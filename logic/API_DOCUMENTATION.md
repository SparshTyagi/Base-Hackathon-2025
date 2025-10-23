# SwearJar Backend API Documentation

## Base URL
```
http://localhost:8080
```

## Authentication
Currently no authentication is implemented. In production, you'll want to add Base wallet signature verification.

## WebSocket Connection
```
ws://localhost:8080/ws
```

### WebSocket Messages

**Subscribe to group notifications:**
```json
{
  "type": "subscribe",
  "groupId": "uuid-of-group"
}
```

**Unsubscribe from group notifications:**
```json
{
  "type": "unsubscribe",
  "groupId": "uuid-of-group"
}
```

### WebSocket Notifications
You'll receive real-time notifications for:
- `violation`: New violation detected
- `penalty_applied`: Penalty has been applied to a violation
- `member_joined`: New member joined a group
- `vote_created`: New vote/proposal created

## REST API Endpoints

### Health Check
```
GET /health
```
Returns server status and connected WebSocket clients.

### Blockchain State
```
GET /state?user=0x...
```
Get on-chain state for a user (bond amount, pot balance, nonce).

### Group Management

#### Create Group
```
POST /groups
```
**Body:**
```json
{
  "name": "My Friend Group",
  "description": "Group for tracking our bad habits",
  "contractAddress": "0x...",
  "creatorAddress": "0x..."
}
```

#### Get Group Dashboard
```
GET /groups/{groupId}
```
Returns group details, members, rules, and recent violations.

#### Add Member to Group
```
POST /groups/{groupId}/members
```
**Body:**
```json
{
  "address": "0x...",
  "bondAmount": "0.01"
}
```

#### Create Rule
```
POST /groups/{groupId}/rules
```
**Body:**
```json
{
  "name": "No Swearing",
  "description": "Penalty for using swear words",
  "penaltyAmount": "0.005"
}
```

### AI Agent Integration

#### Report Violation
```
POST /violations
```
**Body:**
```json
{
  "groupId": "uuid",
  "memberAddress": "0x...",
  "ruleId": "uuid",
  "message": "The detected message content",
  "platform": "discord"
}
```

#### Apply Penalty
```
POST /violations/{violationId}/apply-penalty
```
**Body:**
```json
{
  "privateKey": "0x..."
}
```

### User Dashboard
```
GET /users/{address}/dashboard
```
Returns user's groups, violations, and total penalties.

### Voting System

#### Create Vote
```
POST /groups/{groupId}/votes
```
**Body:**
```json
{
  "proposalType": "pot_distribution",
  "proposalData": {
    "recipient": "0x...",
    "amount": "0.1"
  },
  "proposerAddress": "0x...",
  "expiresInHours": 24
}
```

#### Submit Vote
```
POST /votes/{voteId}/submit
```
**Body:**
```json
{
  "voterAddress": "0x...",
  "response": "yes"
}
```

### Bond Management

#### Deposit Bond
```
POST /deposit
```
**Body:**
```json
{
  "amountEth": "0.01"
}
```

#### Withdraw Bond
```
POST /withdraw
```
**Body:**
```json
{
  "amountEth": "0.01"
}
```

#### Build Pot Withdrawal (for multisig)
```
POST /build-withdraw
```
**Body:**
```json
{
  "to": "0x...",
  "amountEth": "0.1"
}
```

## Data Models

### Group
```typescript
{
  id: string;
  name: string;
  description?: string;
  contractAddress: string;
  creatorAddress: string;
  createdAt: string;
  isActive: boolean;
}
```

### Member
```typescript
{
  id: string;
  groupId: string;
  address: string;
  joinedAt: string;
  isActive: boolean;
  bondAmount: string; // ETH amount as string
}
```

### Rule
```typescript
{
  id: string;
  groupId: string;
  name: string;
  description?: string;
  penaltyAmount: string; // ETH amount as string
  isActive: boolean;
  createdAt: string;
}
```

### Violation
```typescript
{
  id: string;
  groupId: string;
  memberAddress: string;
  ruleId: string;
  message: string;
  platform: string;
  detectedAt: string;
  penaltyApplied: boolean;
  txHash?: string;
}
```

## Error Responses
All endpoints return errors in this format:
```json
{
  "ok": false,
  "error": "Error message"
}
```

## Environment Variables
```bash
PORT=8080
RPC_URL=https://sepolia.base.org
CONTRACT_ADDRESS=0x...
DATABASE_PATH=./swearjar.db
DEFAULT_PRIVATE_KEY=0x... # Optional, for testing
```

## For Frontend Developers
- Use WebSocket connection for real-time updates
- All group operations require groupId
- User dashboard endpoint provides comprehensive user data
- Voting system supports consensus-based decisions

## For AI Agent Developers
- Use `/violations` endpoint to report detected violations
- Include the original message content for transparency
- Specify the platform (discord, twitter, etc.)
- The system will automatically notify group members via WebSocket
