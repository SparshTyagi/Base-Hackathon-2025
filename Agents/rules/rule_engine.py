"""Rule engine for checking violations in posts."""
from typing import Dict, List, Protocol
from core.base_agent import BaseAgent


class Rule(Protocol):
    """Protocol for rule implementations."""
    
    def check(self, post: Dict) -> bool:
        """Check if a post violates this rule.
        
        Args:
            post: Dictionary containing post data
            
        Returns:
            True if violation detected, False otherwise
        """
        ...
    
    def get_description(self) -> str:
        """Get a human-readable description of this rule.
        
        Returns:
            Rule description string
        """
        ...


class ForbiddenWordsRule:
    """Rule that checks for specific forbidden words."""
    
    def __init__(self, forbidden_words: List[str]):
        """Initialize with a list of forbidden words.
        
        Args:
            forbidden_words: List of words that are not allowed
        """
        self.forbidden_words = [word.lower() for word in forbidden_words]
    
    def check(self, post: Dict) -> bool:
        """Check if post contains forbidden words."""
        content_lower = post.get("content", "").lower()
        return any(f' {word} ' in f' {content_lower} ' for word in self.forbidden_words)
    
    def get_description(self) -> str:
        """Get rule description."""
        return f"Used forbidden word ({'/'.join(self.forbidden_words)})"


class LLMBasedRule:
    """Rule that uses LLM to detect violations based on custom criteria."""
    
    def __init__(self, agent: BaseAgent, rule_description: str, rule_name: str):
        """Initialize LLM-based rule.
        
        Args:
            agent: BaseAgent instance for LLM calls
            rule_description: Description of what constitutes a violation
            rule_name: Short name for this rule
        """
        self.agent = agent
        self.rule_description = rule_description
        self.rule_name = rule_name
    
    def check(self, post: Dict) -> bool:
        """Check if post violates the rule using LLM."""
        messages = [
            {
                "role": "system",
                "content": f"""You are a content moderator. Analyze if the following post violates this rule:
{self.rule_description}

Respond with a JSON object: {{"violates": true/false, "reason": "brief explanation"}}"""
            },
            {
                "role": "user",
                "content": f"Post content: {post.get('content', '')}"
            }
        ]
        
        result = self.agent.safe_llm_json(messages, fallback={"violates": False})
        return result.get("violates", False)
    
    def get_description(self) -> str:
        """Get rule description."""
        return self.rule_name


class UserRuleSet:
    """Collection of rules for a specific user."""
    
    def __init__(self, user_id: str, rules: List[Rule]):
        """Initialize user rule set.
        
        Args:
            user_id: Unique identifier for the user
            rules: List of Rule objects to check
        """
        self.user_id = user_id
        self.rules = rules
    
    def check_post(self, post: Dict) -> List[tuple[bool, str]]:
        """Check a post against all rules for this user.
        
        Args:
            post: Post dictionary to check
            
        Returns:
            List of (violated, rule_description) tuples
        """
        violations = []
        for rule in self.rules:
            if rule.check(post):
                violations.append((True, rule.get_description()))
        return violations


class RuleEngine:
    """Main rule engine that manages user-specific rule sets."""
    
    def __init__(self):
        """Initialize the rule engine."""
        self.user_rules: Dict[str, UserRuleSet] = {}
    
    def add_user_rules(self, user_id: str, rules: List[Rule]) -> None:
        """Add or update rules for a specific user.
        
        Args:
            user_id: Unique identifier for the user
            rules: List of Rule objects
        """
        self.user_rules[user_id] = UserRuleSet(user_id, rules)
        print(f"Added {len(rules)} rules for user {user_id}")
    
    def get_user_rules(self, user_id: str) -> UserRuleSet | None:
        """Get the rule set for a specific user.
        
        Args:
            user_id: User identifier
            
        Returns:
            UserRuleSet or None if user not found
        """
        return self.user_rules.get(user_id)
    
    def check_post(self, post: Dict) -> List[tuple[bool, str]]:
        """Check a post against the rules for its author.
        
        Args:
            post: Post dictionary containing 'author_id' and 'content'
            
        Returns:
            List of (violated, rule_description) tuples
        """
        author_id = post.get("author_id")
        if not author_id:
            return []
        
        user_rules = self.get_user_rules(author_id)
        if not user_rules:
            return []
        
        return user_rules.check_post(post)
