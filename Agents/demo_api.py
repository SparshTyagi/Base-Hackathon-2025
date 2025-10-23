"""
Demo script showing how to use the JSON API programmatically.
"""
import json
from api.json_api import MonitoringAPI


def main():
    """Demonstrate JSON API usage."""
    print("=" * 60)
    print("   Farcaster Monitoring Agent - JSON API Demo")
    print("=" * 60)
    
    # Initialize the API
    api = MonitoringAPI()
    
    # Example 1: Configure and monitor users
    print("\n1️⃣ Monitoring users...")
    monitor_request = {
        "action": "monitor",
        "users": [
            {
                "user_id": "1398613",
                "forbidden_words": ["kinda", "dunno"],
                "llm_rules": []
            }
        ],
        "days": 7
    }
    
    response = api.process_request(monitor_request)
    print(f"✅ Success: {response['success']}")
    print(f"📊 New violations found: {response['summary']['total_new_violations']}")
    
    # Example 2: Get violations for specific users
    print("\n2️⃣ Getting violations for user 1398613...")
    get_violations_request = {
        "action": "get_violations",
        "user_ids": ["1398613"]
    }
    
    response = api.process_request(get_violations_request)
    print(f"✅ Success: {response['success']}")
    print(f"📋 Total violations: {response['total_violations']}")
    
    if response['total_violations'] > 0:
        print("\nFirst violation:")
        first_violation = list(response['violations_by_user'].values())[0][0]
        print(f"   Rule: {first_violation['rule_violated']}")
        print(f"   Content: {first_violation['content_snippet'][:80]}...")
    
    # Example 3: Get all violations
    print("\n3️⃣ Getting all violations...")
    all_violations_request = {
        "action": "get_all_violations"
    }
    
    response = api.process_request(all_violations_request)
    print(f"✅ Success: {response['success']}")
    print(f"📋 Total violations: {response['total_violations']}")
    print(f"👥 Total users: {response['total_users']}")
    
    # Example 4: Save response to JSON file
    print("\n4️⃣ Saving response to file...")
    with open('demo_output.json', 'w', encoding='utf-8') as f:
        json.dump(response, f, indent=2, ensure_ascii=False)
    print("✅ Response saved to demo_output.json")
    
    print("\n" + "=" * 60)
    print("   Demo Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
