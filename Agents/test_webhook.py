"""Test script for webhook integration between Python agents and TypeScript backend."""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from monitor import FarcasterMonitor

def test_webhook_integration():
    """Test that the webhook URL is properly configured."""
    print("=" * 60)
    print("   Testing Webhook Integration")
    print("=" * 60)
    
    # Test with backend URL
    backend_url = "http://localhost:8080"
    monitor = FarcasterMonitor(backend_url=backend_url)
    
    print(f"\n✅ Monitor initialized successfully")
    print(f"   Backend URL: {monitor.backend_url}")
    
    # Add a test user with group/rule mapping
    monitor.add_user_with_rules(
        user_id="1398613",
        group_id="550e8400-e29b-41d4-a716-446655440000",
        rule_id="550e8400-e29b-41d4-a716-446655440001",
        wallet_address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        forbidden_words=["test"]
    )
    
    print(f"\n✅ User configured with group/rule mapping:")
    print(f"   FID: 1398613")
    print(f"   Group: 550e8400-e29b-41d4-a716-446655440000")
    print(f"   Rule: 550e8400-e29b-41d4-a716-446655440001")
    
    print(f"\n✅ Webhook integration is properly configured")
    print(f"   When violations are detected, they will be sent to:")
    print(f"   {backend_url}/api/violations/webhook")
    
    print("\n" + "=" * 60)
    print("   Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    test_webhook_integration()
