"""Main monitoring orchestrator for Farcaster content."""
from typing import List, Dict
from core.base_agent import BaseAgent
from core.settings import get_openrouter_api_key
from database.violations_db import ViolationsDatabase
from connectors.farcaster_api import FarcasterAPI
from rules.rule_engine import RuleEngine, ForbiddenWordsRule, LLMBasedRule


class FarcasterMonitor:
    """Main orchestrator for monitoring Farcaster users."""
    
    def __init__(self, api_key: str | None = None):
        """Initialize the Farcaster monitor.
        
        Args:
            api_key: OpenRouter API key for LLM. If None, reads from settings.
        """
        self.api_key = api_key or get_openrouter_api_key()
        self.agent = BaseAgent(model=None, api_key=self.api_key)
        self.database = ViolationsDatabase()
        self.farcaster_api = FarcasterAPI()
        self.rule_engine = RuleEngine()
        
        print(f"Monitor initialized with model: {self.agent.model}")
    
    def add_user_with_rules(self, user_id: str, forbidden_words: List[str] = None,
                           llm_rules: List[Dict[str, str]] = None) -> None:
        """Configure monitoring rules for a specific user.
        
        Args:
            user_id: Farcaster user ID (FID as string)
            forbidden_words: List of words that are not allowed for this user
            llm_rules: List of dicts with 'name' and 'description' for LLM-based rules
        """
        rules = []
        
        # Add forbidden words rule if provided
        if forbidden_words:
            rules.append(ForbiddenWordsRule(forbidden_words))
        
        # Add LLM-based rules if provided
        if llm_rules:
            for rule_spec in llm_rules:
                rules.append(LLMBasedRule(
                    agent=self.agent,
                    rule_description=rule_spec.get("description", ""),
                    rule_name=rule_spec.get("name", "Custom Rule")
                ))
        
        self.rule_engine.add_user_rules(user_id, rules)
    
    def monitor_user(self, fid: int, days: int = 7) -> int:
        """Monitor a specific user's casts for violations.
        
        Args:
            fid: Farcaster user ID
            days: Number of days to look back
            
        Returns:
            Number of new violations found
        """
        print(f"\n--- Monitoring User FID: {fid} ---")
        
        try:
            user_casts = self.farcaster_api.get_user_casts(fid, days=days)
        except Exception as e:
            print(f"ERROR: Failed to fetch casts for FID {fid}: {e}")
            return 0
        
        violations_found = 0
        
        if not user_casts:
            print("No casts to analyze.")
            return 0
        
        print(f"\n--- Scanning {len(user_casts)} casts for rule violations ---")
        
        for cast in user_casts:
            violations = self.rule_engine.check_post(cast)
            
            for violated, rule_description in violations:
                if violated:
                    if self.database.add_violation(
                        post_id=cast['post_id'],
                        author_id=cast['author_id'],
                        rule=rule_description,
                        timestamp=cast['timestamp'],
                        content=cast['content']
                    ):
                        violations_found += 1
        
        print(f"\n--- Analysis Complete ---")
        print(f"New violations found: {violations_found}")
        
        return violations_found
    
    def monitor_all_users(self, days: int = 7) -> Dict[str, int]:
        """Monitor all configured users.
        
        Args:
            days: Number of days to look back
            
        Returns:
            Dictionary mapping user_id to violation count
        """
        results = {}
        
        for user_id in self.rule_engine.user_rules.keys():
            try:
                fid = int(user_id)
                violations = self.monitor_user(fid, days=days)
                results[user_id] = violations
            except ValueError:
                print(f"Skipping invalid FID: {user_id}")
            except Exception as e:
                print(f"Error monitoring user {user_id}: {e}")
                results[user_id] = 0
        
        return results
