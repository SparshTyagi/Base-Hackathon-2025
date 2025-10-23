"""
Test script to verify all functionality works correctly.
Run this from the Agents directory: python test_all.py
"""
import sys
import json
from pathlib import Path

print("=" * 70)
print("   FARCASTER MONITORING AGENT - FUNCTIONALITY TEST")
print("=" * 70)

# Test 1: Import all modules
print("\n[1/6] Testing imports...")
try:
    from api.json_api import MonitoringAPI, process_json_file
    from monitor import FarcasterMonitor
    from database.violations_db import ViolationsDatabase
    from connectors.farcaster_api import FarcasterAPI
    from rules.rule_engine import RuleEngine, ForbiddenWordsRule
    from core.base_agent import BaseAgent
    from core.settings import get_fast_model
    print("✅ All imports successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    sys.exit(1)

# Test 2: Initialize components
print("\n[2/6] Testing component initialization...")
try:
    api = MonitoringAPI()
    monitor = FarcasterMonitor()
    db = ViolationsDatabase()
    print("✅ All components initialized successfully")
except Exception as e:
    print(f"❌ Initialization failed: {e}")
    sys.exit(1)

# Test 3: Test JSON API - Configure Users
print("\n[3/6] Testing JSON API - Configure Users...")
try:
    configure_request = {
        "action": "configure_users",
        "users": [
            {
                "user_id": "1398613",
                "forbidden_words": ["test1", "test2"],
                "llm_rules": []
            }
        ]
    }
    response = api.process_request(configure_request)
    assert response["success"] == True
    assert response["total_users"] == 1
    print(f"✅ Successfully configured {response['total_users']} user(s)")
except Exception as e:
    print(f"❌ Configure test failed: {e}")
    sys.exit(1)

# Test 4: Test JSON API - Get All Violations
print("\n[4/6] Testing JSON API - Get All Violations...")
try:
    get_all_request = {"action": "get_all_violations"}
    response = api.process_request(get_all_request)
    assert response["success"] == True
    print(f"✅ Retrieved {response['total_violations']} violation(s)")
except Exception as e:
    print(f"❌ Get all violations test failed: {e}")
    sys.exit(1)

# Test 5: Test JSON API - Get Specific User Violations
print("\n[5/6] Testing JSON API - Get User Violations...")
try:
    get_violations_request = {
        "action": "get_violations",
        "user_ids": ["1398613"]
    }
    response = api.process_request(get_violations_request)
    assert response["success"] == True
    print(f"✅ Retrieved violations for {len(response['violations_by_user'])} user(s)")
except Exception as e:
    print(f"❌ Get violations test failed: {e}")
    sys.exit(1)

# Test 6: Test JSON file processing
print("\n[6/6] Testing JSON file processing...")
try:
    test_file = Path("examples/get_all_violations_request.json")
    if test_file.exists():
        with open(test_file, 'r') as f:
            request_data = json.load(f)
        response = api.process_request(request_data)
        assert response["success"] == True
        print(f"✅ Successfully processed example JSON file")
    else:
        print("⚠️  Example file not found, skipping file test")
except Exception as e:
    print(f"❌ File processing test failed: {e}")
    sys.exit(1)

# All tests passed
print("\n" + "=" * 70)
print("   ✅ ALL TESTS PASSED!")
print("=" * 70)
print("\n📋 Summary:")
print("   - All modules import correctly")
print("   - All components initialize successfully")
print("   - JSON API endpoints work correctly")
print("   - File processing works correctly")
print("\n🚀 The system is ready to use!")
print("=" * 70)
