"""
Quick integration test to verify Python → Backend webhook flow
"""
import httpx
import asyncio
import json

async def test_backend_webhook():
    """Test posting a violation to the backend webhook"""
    
    backend_url = "http://localhost:8080"
    
    # Test payload (simulating a violation detected by the agent)
    test_violation = {
        "groupId": "550e8400-e29b-41d4-a716-446655440000",  # Example UUID
        "memberFid": "1398613",
        "memberAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "ruleId": "550e8400-e29b-41d4-a716-446655440001",
        "violationType": "Forbidden word detected",
        "evidence": "User posted: 'This is a test message with forbidden content'",
        "castHash": "0xabc123def456",
        "detectedAt": "2025-10-24T08:00:00Z"
    }
    
    print("=" * 60)
    print("   Testing Backend Webhook Integration")
    print("=" * 60)
    print(f"\n📡 Backend URL: {backend_url}")
    print(f"🎯 Endpoint: /api/violations/webhook")
    print(f"\n📦 Test Payload:")
    print(json.dumps(test_violation, indent=2))
    
    print(f"\n⏳ Sending test violation...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{backend_url}/api/violations/webhook",
                json=test_violation,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"\n✅ Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Success! Response:")
                print(json.dumps(result, indent=2))
            else:
                print(f"❌ Error Response:")
                print(response.text)
                
    except httpx.ConnectError:
        print(f"\n❌ Connection Error!")
        print(f"   Backend is not running at {backend_url}")
        print(f"\n💡 To start the backend:")
        print(f"   cd logic")
        print(f"   npm start")
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_backend_webhook())
