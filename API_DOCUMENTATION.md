# SwearJar API Documentation - Group-Specific Endpoints

## 🎯 Overview

The SwearJar backend now supports comprehensive group-specific functionality with the updated smart contract. This documentation covers all the new API endpoints for managing groups, members, bonds, and penalties.

## 📋 Base Configuration

**Contract Address:** `0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9`  
**Network:** Base Sepolia (Chain ID: 84532)  
**RPC URL:** `https://sepolia.base.org`

## 🔧 Environment Variables Required

```bash
# Backend operations
DEFAULT_PRIVATE_KEY=your_backend_private_key_here
CONTRACT_ADDRESS=0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9
RPC_URL=https://sepolia.base.org

# Farcaster integration
NEYNAR_API_KEY=your_neynar_api_key_here
```

---

## 🚀 Group Management Endpoints

### Create Group
**POST** `/api/groups`

Creates a new accountability group with specified parameters.

**Request Body:**
```json
{
  "name": "Pizza Party Fund",
  "targetAmountEth": "2.0",
  "durationDays": 30
}
```

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678,
  "groupId": "0x..."
}
```

### Join Group
**POST** `/api/groups/:groupId/join`

Join an existing group with a bond deposit.

**Request Body:**
```json
{
  "bondAmountEth": "0.1"
}
```

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678
}
```

### Leave Group
**POST** `/api/groups/:groupId/leave`

Leave a group and withdraw your bond.

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678
}
```

### Deactivate Group
**POST** `/api/groups/:groupId/deactivate`

Deactivate a group (creator or owner only).

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678
}
```

---

## 💰 Bond Management Endpoints

### Deposit Additional Bond
**POST** `/api/groups/:groupId/deposit`

Deposit additional ETH to your group bond.

**Request Body:**
```json
{
  "amountEth": "0.05"
}
```

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678
}
```

### Withdraw Bond
**POST** `/api/groups/:groupId/withdraw`

Withdraw partial bond from your group membership.

**Request Body:**
```json
{
  "amountEth": "0.02"
}
```

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678
}
```

---

## ⚖️ Penalty & Pot Management Endpoints

### Apply Penalty
**POST** `/api/groups/:groupId/penalty`

Apply penalty to a group member (owner only).

**Request Body:**
```json
{
  "user": "0x...",
  "amountEth": "0.01"
}
```

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678
}
```

### Withdraw from Pot
**POST** `/api/groups/:groupId/pot/withdraw`

Withdraw specific amount from group pot (owner only).

**Request Body:**
```json
{
  "to": "0x...",
  "amountEth": "0.5"
}
```

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678
}
```

### Distribute Pot
**POST** `/api/groups/:groupId/pot/distribute`

Distribute entire pot equally among active members (owner only).

**Response:**
```json
{
  "ok": true,
  "hash": "0x...",
  "block": 12345678
}
```

---

## 📊 View Endpoints

### Get Group Information
**GET** `/api/groups/:groupId`

**Response:**
```json
{
  "ok": true,
  "group": {
    "id": "0x...",
    "name": "Pizza Party Fund",
    "creator": "0x...",
    "targetAmount": "2000000000000000000",
    "potBalance": "500000000000000000",
    "memberCount": "5",
    "isActive": true,
    "createdAt": "1703000000",
    "expiresAt": "1705592000"
  }
}
```

### Get Group Members
**GET** `/api/groups/:groupId/members`

**Response:**
```json
{
  "ok": true,
  "members": [
    "0x...",
    "0x...",
    "0x..."
  ]
}
```

### Get Group Member Info
**GET** `/api/groups/:groupId/members/:member`

**Response:**
```json
{
  "ok": true,
  "member": {
    "wallet": "0x...",
    "bondAmount": "100000000000000000",
    "isActive": true,
    "joinedAt": "1703000000"
  }
}
```

### Get Group Pot Balance
**GET** `/api/groups/:groupId/pot`

**Response:**
```json
{
  "ok": true,
  "potBalance": "500000000000000000"
}
```

### Get Member Bond
**GET** `/api/groups/:groupId/bonds/:member`

**Response:**
```json
{
  "ok": true,
  "bondAmount": "100000000000000000"
}
```

### Get User's Groups
**GET** `/api/users/:user/groups`

**Response:**
```json
{
  "ok": true,
  "groups": [
    "0x...",
    "0x..."
  ]
}
```

### Check Membership
**GET** `/api/groups/:groupId/members/:member/check`

**Response:**
```json
{
  "ok": true,
  "isMember": true
}
```

### Get Member Count
**GET** `/api/groups/:groupId/member-count`

**Response:**
```json
{
  "ok": true,
  "memberCount": 5
}
```

### Check Target Reached
**GET** `/api/groups/:groupId/target-reached`

**Response:**
```json
{
  "ok": true,
  "hasReachedTarget": false
}
```

### Get Progress Percentage
**GET** `/api/groups/:groupId/progress`

**Response:**
```json
{
  "ok": true,
  "progress": 25
}
```

### Get All Groups
**GET** `/api/groups`

**Response:**
```json
{
  "ok": true,
  "groupIds": [
    "0x...",
    "0x..."
  ]
}
```

---

## 🤖 Python Agent Integration

### Violation Webhook
**POST** `/api/violations/webhook`

Webhook endpoint for Python agents to report violations.

**Request Body:**
```json
{
  "groupId": "0x...",
  "memberFid": "12345",
  "ruleId": "rule-1",
  "violationType": "swearing",
  "evidence": "Damn, this is frustrating!"
}
```

**Response:**
```json
{
  "ok": true,
  "violation": {
    "id": "violation-123",
    "groupId": "0x...",
    "memberAddress": "0x...",
    "ruleId": "rule-1",
    "message": "Damn, this is frustrating!",
    "platform": "farcaster",
    "detectedAt": "2024-12-19T20:30:00Z"
  }
}
```

---

## 🔌 WebSocket Integration

### Connect to WebSocket
**WebSocket** `/ws`

Connect to real-time notifications.

**Subscribe to Group:**
```json
{
  "type": "subscribe",
  "groupId": "0x..."
}
```

**Unsubscribe from Group:**
```json
{
  "type": "unsubscribe",
  "groupId": "0x..."
}
```

**Notification Messages:**
```json
{
  "type": "new_violation",
  "groupId": "0x...",
  "violation": {
    "id": "violation-123",
    "memberAddress": "0x...",
    "ruleId": "rule-1",
    "message": "Evidence text",
    "detectedAt": "2024-12-19T20:30:00Z"
  }
}
```

---

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "error": "Error message description"
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error (contract/network issues)

---

## 🧪 Testing Examples

### Complete Group Lifecycle

1. **Create Group:**
```bash
curl -X POST http://localhost:8080/api/groups \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Group", "targetAmountEth": "1.0", "durationDays": 7}'
```

2. **Join Group:**
```bash
curl -X POST http://localhost:8080/api/groups/0x.../join \
  -H "Content-Type: application/json" \
  -d '{"bondAmountEth": "0.1"}'
```

3. **Check Group Info:**
```bash
curl http://localhost:8080/api/groups/0x...
```

4. **Apply Penalty:**
```bash
curl -X POST http://localhost:8080/api/groups/0x.../penalty \
  -H "Content-Type: application/json" \
  -d '{"user": "0x...", "amountEth": "0.01"}'
```

5. **Distribute Pot:**
```bash
curl -X POST http://localhost:8080/api/groups/0x.../pot/distribute
```

---

## 🔄 Integration Flow

### Frontend Integration
```typescript
// Create group
const response = await fetch('/api/groups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Pizza Party Fund',
    targetAmountEth: '2.0',
    durationDays: 30
  })
});
const { groupId } = await response.json();

// Join group
await fetch(`/api/groups/${groupId}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bondAmountEth: '0.1' })
});
```

### Python Agent Integration
```python
import httpx

async def report_violation(group_id, member_fid, rule_id, violation_type, evidence):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://localhost:8080/api/violations/webhook',
            json={
                'groupId': group_id,
                'memberFid': member_fid,
                'ruleId': rule_id,
                'violationType': violation_type,
                'evidence': evidence
            }
        )
        return response.json()
```

---

## 🎯 Next Steps

1. **Test the API endpoints** with the deployed contract
2. **Integrate with frontend** using the new group endpoints
3. **Update Python agents** to use the webhook endpoint
4. **Deploy to production** when ready

The backend is now fully equipped to handle group-specific operations for your Base Mini App! 🚀
