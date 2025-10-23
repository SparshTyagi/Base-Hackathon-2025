"""JSON API interface for the Farcaster monitoring agent."""
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from monitor import FarcasterMonitor
from database.violations_db import ViolationsDatabase


class MonitoringAPI:
    """API interface for JSON-based communication with frontend."""
    
    def __init__(self):
        """Initialize the API."""
        self.monitor = FarcasterMonitor()
        self.database = ViolationsDatabase()
    
    def process_request(self, request_json: Dict[str, Any]) -> Dict[str, Any]:
        """Process a JSON request from the frontend.
        
        Expected request format:
        {
            "action": "monitor" | "get_violations" | "get_all_violations",
            "users": [
                {
                    "user_id": "1398613",
                    "forbidden_words": ["kinda", "dunno"],
                    "llm_rules": [
                        {
                            "name": "Promotional Content",
                            "description": "Detect promotional posts"
                        }
                    ]
                }
            ],
            "days": 7  # optional, defaults to 7
        }
        
        Args:
            request_json: Dictionary containing the request
            
        Returns:
            Dictionary containing the response
        """
        try:
            action = request_json.get("action", "monitor")
            
            if action == "monitor":
                return self._handle_monitor_request(request_json)
            elif action == "get_violations":
                return self._handle_get_violations_request(request_json)
            elif action == "get_all_violations":
                return self._handle_get_all_violations_request()
            elif action == "configure_users":
                return self._handle_configure_users_request(request_json)
            else:
                return {
                    "success": False,
                    "error": f"Unknown action: {action}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def _handle_monitor_request(self, request_json: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a monitoring request.
        
        Args:
            request_json: The request dictionary
            
        Returns:
            Response with monitoring results
        """
        users = request_json.get("users", [])
        days = request_json.get("days", 7)
        
        # Configure users with their rules
        for user_config in users:
            user_id = user_config.get("user_id")
            if not user_id:
                continue
            
            forbidden_words = user_config.get("forbidden_words", [])
            llm_rules = user_config.get("llm_rules", [])
            
            self.monitor.add_user_with_rules(
                user_id=str(user_id),
                forbidden_words=forbidden_words,
                llm_rules=llm_rules
            )
        
        # Monitor all configured users
        results = self.monitor.monitor_all_users(days=days)
        
        # Get all violations for these users
        all_violations = []
        for user_id in results.keys():
            user_violations = self.database.get_violations_by_author(user_id)
            all_violations.extend(user_violations)
        
        return {
            "success": True,
            "action": "monitor",
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_users_monitored": len(results),
                "total_new_violations": sum(results.values()),
                "per_user_breakdown": results
            },
            "violations": all_violations
        }
    
    def _handle_get_violations_request(self, request_json: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a request to get violations for specific users.
        
        Args:
            request_json: The request dictionary
            
        Returns:
            Response with violations data
        """
        user_ids = request_json.get("user_ids", [])
        
        violations_by_user = {}
        for user_id in user_ids:
            violations = self.database.get_violations_by_author(str(user_id))
            violations_by_user[str(user_id)] = violations
        
        # Flatten all violations
        all_violations = []
        for violations in violations_by_user.values():
            all_violations.extend(violations)
        
        return {
            "success": True,
            "action": "get_violations",
            "timestamp": datetime.now().isoformat(),
            "violations_by_user": violations_by_user,
            "total_violations": len(all_violations)
        }
    
    def _handle_get_all_violations_request(self) -> Dict[str, Any]:
        """Handle a request to get all violations.
        
        Returns:
            Response with all violations data
        """
        all_violations = self.database.get_all_violations()
        
        # Group by user
        violations_by_user = {}
        for violation in all_violations:
            author_id = violation["author_id"]
            if author_id not in violations_by_user:
                violations_by_user[author_id] = []
            violations_by_user[author_id].append(violation)
        
        return {
            "success": True,
            "action": "get_all_violations",
            "timestamp": datetime.now().isoformat(),
            "violations": all_violations,
            "violations_by_user": violations_by_user,
            "total_violations": len(all_violations),
            "total_users": len(violations_by_user)
        }
    
    def _handle_configure_users_request(self, request_json: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a request to configure users without monitoring.
        
        Args:
            request_json: The request dictionary
            
        Returns:
            Response with configuration status
        """
        users = request_json.get("users", [])
        configured_users = []
        
        for user_config in users:
            user_id = user_config.get("user_id")
            if not user_id:
                continue
            
            forbidden_words = user_config.get("forbidden_words", [])
            llm_rules = user_config.get("llm_rules", [])
            
            self.monitor.add_user_with_rules(
                user_id=str(user_id),
                forbidden_words=forbidden_words,
                llm_rules=llm_rules
            )
            
            configured_users.append({
                "user_id": str(user_id),
                "forbidden_words_count": len(forbidden_words),
                "llm_rules_count": len(llm_rules)
            })
        
        return {
            "success": True,
            "action": "configure_users",
            "timestamp": datetime.now().isoformat(),
            "configured_users": configured_users,
            "total_users": len(configured_users)
        }


def process_json_file(input_file: str, output_file: str = None) -> Dict[str, Any]:
    """Process a JSON file and optionally write results to another file.
    
    Args:
        input_file: Path to input JSON file
        output_file: Optional path to output JSON file
        
    Returns:
        Response dictionary
    """
    api = MonitoringAPI()
    
    # Read input
    with open(input_file, 'r', encoding='utf-8') as f:
        request_data = json.load(f)
    
    # Process request
    response = api.process_request(request_data)
    
    # Write output if specified
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(response, f, indent=2, ensure_ascii=False)
        print(f"Results written to: {output_file}")
    
    return response


def process_json_string(json_string: str) -> str:
    """Process a JSON string and return response as JSON string.
    
    Args:
        json_string: JSON string containing the request
        
    Returns:
        JSON string containing the response
    """
    api = MonitoringAPI()
    request_data = json.loads(json_string)
    response = api.process_request(request_data)
    return json.dumps(response, indent=2, ensure_ascii=False)
