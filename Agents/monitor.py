"""Main monitoring orchestrator for Farcaster content."""
from typing import List, Dict, Optional
import httpx
from core.base_agent import BaseAgent
from core.settings import get_openrouter_api_key
from database.violations_db import ViolationsDatabase
from connectors.farcaster_api import FarcasterAPI
from rules.rule_engine import RuleEngine, ForbiddenWordsRule, LLMBasedRule


class FarcasterMonitor:
    """Main orchestrator for monitoring Farcaster users."""
    
    def __init__(self, api_key: str | None = None, backend_url: Optional[str] = None):
        """Initialize the Farcaster monitor.
        
        Args:
            api_key: OpenRouter API key for LLM. If None, reads from settings.
            backend_url: URL of the backend webhook endpoint. If None, violations are only stored locally.
        """
        self.api_key = api_key or get_openrouter_api_key()
        self.agent = BaseAgent(model=None, api_key=self.api_key)
        self.database = ViolationsDatabase()
        self.farcaster_api = FarcasterAPI()
        self.rule_engine = RuleEngine()
        self.backend_url = backend_url
        self.user_group_mapping = {}  # Maps user_id -> (group_id, rule_id, wallet_address)
        
        print(f"Monitor initialized with model: {self.agent.model}")
        if self.backend_url:
            print(f"Backend webhook configured: {self.backend_url}")
    
    def add_user_with_rules(self, user_id: str, group_id: str, rule_id: str, 
                           wallet_address: str, forbidden_words: List[str] = None,
                           llm_rules: List[Dict[str, str]] = None) -> None:
        """Configure monitoring rules for a specific user.
        
        Args:
            user_id: Farcaster user ID (FID as string)
            group_id: UUID of the group this user belongs to
            rule_id: UUID of the rule to apply
            wallet_address: Ethereum wallet address of the user
            forbidden_words: List of words that are not allowed for this user
            llm_rules: List of dicts with 'name' and 'description' for LLM-based rules
        """
        # Store group/rule mapping for webhook
        self.user_group_mapping[user_id] = (group_id, rule_id, wallet_address)
        
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
                    # Add to local database
                    if self.database.add_violation(
                        post_id=cast['post_id'],
                        author_id=cast['author_id'],
                        rule=rule_description,
                        timestamp=cast['timestamp'],
                        content=cast['content']
                    ):
                        violations_found += 1
                        
                        # Send to backend webhook if configured
                        if self.backend_url:
                            self._send_violation_to_backend(
                                cast_hash=cast['post_id'],
                                author_fid=str(fid),
                                rule_violated=rule_description,
                                evidence=cast['content'],
                                timestamp=cast['timestamp']
                            )
        
        print(f"\n--- Analysis Complete ---")
        print(f"New violations found: {violations_found}")
        
        return violations_found
    
    def _send_violation_to_backend(self, cast_hash: str, author_fid: str, 
                                   rule_violated: str, evidence: str, timestamp: str) -> None:
        """Send violation data to backend webhook.
        
        Args:
            cast_hash: Hash of the Farcaster cast
            author_fid: Farcaster FID of the author
            rule_violated: Description of the rule that was violated
            evidence: The content that caused the violation
            timestamp: When the violation was detected
        """
        try:
            import asyncio
            asyncio.run(self._async_send_violation(
                cast_hash, author_fid, rule_violated, evidence, timestamp
            ))
        except Exception as e:
            print(f"Failed to send violation to backend: {e}")
    
    async def _async_send_violation(self, cast_hash: str, author_fid: str,
                                     rule_violated: str, evidence: str, timestamp: str) -> None:
        """Async helper to send violation to backend."""
        # Get group/rule mapping for this user
        group_id, rule_id, wallet_address = self.user_group_mapping.get(
            author_fid, 
            (None, None, None)
        )
        
        if not group_id or not rule_id:
            print(f"⚠️ No group/rule mapping found for FID {author_fid}, skipping webhook")
            return
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(
                    f"{self.backend_url}/api/violations/webhook",
                    json={
                        "castHash": cast_hash,
                        "memberFid": author_fid,
                        "memberAddress": wallet_address,
                        "groupId": group_id,
                        "ruleId": rule_id,
                        "violationType": rule_violated,
                        "evidence": evidence,
                        "detectedAt": timestamp
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Violation sent to backend successfully")
                    print(f"   Violation ID: {result.get('violation', {}).get('id', 'N/A')}")
                    print(f"   Vote ID: {result.get('vote', {}).get('id', 'N/A')}")
                else:
                    print(f"⚠️ Backend returned status {response.status_code}: {response.text}")
            except httpx.RequestError as e:
                print(f"❌ Network error sending to backend: {e}")
    
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
