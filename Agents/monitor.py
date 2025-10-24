"""Main monitoring orchestrator for Farcaster content."""
import os
import requests
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
        
        # Backend webhook configuration
        self.backend_webhook_url = os.getenv('BACKEND_WEBHOOK_URL', 'http://localhost:8080/api/violations/webhook')
        
        print(f"Monitor initialized with model: {self.agent.model}")
        print(f"Backend webhook URL: {self.backend_webhook_url}")
    
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
    
    def report_violation_to_backend(self, group_id: str, member_fid: str, rule_id: str, 
                                  violation_type: str, evidence: str) -> bool:
        """Report a violation to the backend webhook.
        
        Args:
            group_id: Group ID where violation occurred
            member_fid: Farcaster FID of the member who violated
            rule_id: ID of the rule that was violated
            violation_type: Type of violation (e.g., 'swearing', 'negativity')
            evidence: The content that violated the rule
            
        Returns:
            True if successfully reported, False otherwise
        """
        try:
            payload = {
                'groupId': group_id,
                'memberFid': member_fid,
                'ruleId': rule_id,
                'violationType': violation_type,
                'evidence': evidence
            }
            
            response = requests.post(
                self.backend_webhook_url,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Violation reported to backend: {violation_type} by FID {member_fid}")
                return True
            else:
                print(f"❌ Failed to report violation: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error reporting violation to backend: {e}")
            return False
    
    def get_group_for_user(self, user_fid: str) -> str | None:
        """Get the group ID for a user's FID.
        
        This is a placeholder implementation. In a real system, you would:
        1. Query the backend API to get user's groups
        2. Use a mapping database
        3. Or maintain a local cache of FID -> group mappings
        
        Args:
            user_fid: Farcaster FID as string
            
        Returns:
            Group ID if user is in a group, None otherwise
        """
        # Placeholder: Return a default group ID for testing
        # In production, you'd query the backend API or database
        try:
            # Example: Query backend for user's groups
            # response = requests.get(f"{self.backend_webhook_url.replace('/api/violations/webhook', '')}/api/users/{user_fid}/groups")
            # if response.status_code == 200:
            #     groups = response.json().get('groups', [])
            #     return groups[0] if groups else None
            
            # For now, return a placeholder group ID
            # You should implement proper group mapping based on your needs
            return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"  # Placeholder
        except Exception as e:
            print(f"Error getting group for user {user_fid}: {e}")
            return None
    
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
                    # Add to local database
                    if self.database.add_violation(
                        post_id=cast['post_id'],
                        author_id=cast['author_id'],
                        rule=rule_description,
                        timestamp=cast['timestamp'],
                        content=cast['content']
                    ):
                        violations_found += 1
                        
                        # Report to backend webhook (for group-specific functionality)
                        # Note: You'll need to map FID to group membership
                        # This is a placeholder - you'll need to implement group mapping
                        group_id = self.get_group_for_user(str(cast['author_id']))
                        if group_id:
                            self.report_violation_to_backend(
                                group_id=group_id,
                                member_fid=str(cast['author_id']),
                                rule_id=f"rule_{hash(rule_description) % 10000}",  # Generate rule ID
                                violation_type=rule_description.split(':')[0] if ':' in rule_description else 'custom',
                                evidence=cast['content'][:500]  # Truncate for webhook
                            )
        
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
