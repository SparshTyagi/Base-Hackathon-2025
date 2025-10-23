# Frontend Integration Guide

This guide explains how to integrate the Farcaster Monitoring Agent with your frontend application.

## 🚀 Quick Start

### Option 1: REST API (Recommended for Web Apps)

Start the API server:

```bash
python api/server.py
```

The server will run on `http://localhost:5000` with CORS enabled.

### Option 2: JSON Files (For Batch Processing)

Use the CLI tool to process JSON configuration files:

```bash
python api_cli.py -i config.json -o results.json
```

## 📡 REST API Reference

### Base URL
```
http://localhost:5000
```

### Authentication
Currently, no authentication is required. This is a local service.

---

### Endpoints

#### 1. Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "Farcaster Monitoring Agent"
}
```

---

#### 2. Monitor Users and Get Violations

**Endpoint:** `POST /api/monitor`

**Description:** Configure users with their rules, monitor their casts, and return all violations found.

**Request Body:**
```json
{
  "users": [
    {
      "user_id": "1398613",
      "forbidden_words": ["kinda", "dunno", "literally"],
      "llm_rules": [
        {
          "name": "Promotional Content",
          "description": "Detect if the post is promotional or advertising"
        }
      ]
    }
  ],
  "days": 7
}
```

**Request Fields:**
- `users` (array, required): List of users to monitor
  - `user_id` (string, required): Farcaster FID
  - `forbidden_words` (array, optional): List of forbidden words
  - `llm_rules` (array, optional): List of AI-powered rules
    - `name` (string): Rule name
    - `description` (string): Rule description for LLM
- `days` (integer, optional): Number of days to look back (default: 7)

**Response:**
```json
{
  "success": true,
  "action": "monitor",
  "timestamp": "2025-10-23T10:30:00.000000",
  "summary": {
    "total_users_monitored": 1,
    "total_new_violations": 3,
    "per_user_breakdown": {
      "1398613": 3
    }
  },
  "violations": [
    {
      "id": 1,
      "post_id": "0xabc123...",
      "author_id": "1398613",
      "rule_violated": "Used forbidden word (kinda/dunno)",
      "timestamp": "2025-10-22T15:30:00.000000",
      "content_snippet": "I kinda think this is cool..."
    }
  ]
}
```

---

#### 3. Get Violations for Specific Users

**Endpoint:** `GET /api/violations?user_ids=1398613,194`

**Description:** Retrieve all stored violations for specific users.

**Query Parameters:**
- `user_ids` (string, required): Comma-separated list of user IDs

**Response:**
```json
{
  "success": true,
  "action": "get_violations",
  "timestamp": "2025-10-23T10:30:00.000000",
  "violations_by_user": {
    "1398613": [
      {
        "id": 1,
        "post_id": "0xabc123...",
        "author_id": "1398613",
        "rule_violated": "Used forbidden word (kinda/dunno)",
        "timestamp": "2025-10-22T15:30:00.000000",
        "content_snippet": "I kinda think..."
      }
    ],
    "194": []
  },
  "total_violations": 1
}
```

---

#### 4. Get All Violations

**Endpoint:** `GET /api/violations/all`

**Description:** Retrieve all violations from the database.

**Response:**
```json
{
  "success": true,
  "action": "get_all_violations",
  "timestamp": "2025-10-23T10:30:00.000000",
  "violations": [
    {
      "id": 1,
      "post_id": "0xabc123...",
      "author_id": "1398613",
      "rule_violated": "Used forbidden word (kinda/dunno)",
      "timestamp": "2025-10-22T15:30:00.000000",
      "content_snippet": "I kinda think..."
    }
  ],
  "violations_by_user": {
    "1398613": [...]
  },
  "total_violations": 1,
  "total_users": 1
}
```

---

#### 5. Configure Users Without Monitoring

**Endpoint:** `POST /api/configure`

**Description:** Set up user rules without immediately monitoring.

**Request Body:**
```json
{
  "users": [
    {
      "user_id": "1398613",
      "forbidden_words": ["kinda", "dunno"],
      "llm_rules": []
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "action": "configure_users",
  "timestamp": "2025-10-23T10:30:00.000000",
  "configured_users": [
    {
      "user_id": "1398613",
      "forbidden_words_count": 2,
      "llm_rules_count": 0
    }
  ],
  "total_users": 1
}
```

---

## 💻 Frontend Integration Examples

### JavaScript/TypeScript (Fetch API)

```typescript
// Monitor users and get violations
async function monitorUsers() {
  const response = await fetch('http://localhost:5000/api/monitor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      users: [
        {
          user_id: "1398613",
          forbidden_words: ["kinda", "dunno"],
          llm_rules: [
            {
              name: "Promotional Content",
              description: "Detect promotional posts"
            }
          ]
        }
      ],
      days: 7
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('New violations:', data.summary.total_new_violations);
    console.log('All violations:', data.violations);
  }
}

// Get violations for specific users
async function getViolations(userIds: string[]) {
  const response = await fetch(
    `http://localhost:5000/api/violations?user_ids=${userIds.join(',')}`
  );
  
  const data = await response.json();
  return data.violations_by_user;
}

// Get all violations
async function getAllViolations() {
  const response = await fetch('http://localhost:5000/api/violations/all');
  const data = await response.json();
  return data.violations;
}
```

### React Example

```tsx
import { useState, useEffect } from 'react';

interface Violation {
  id: number;
  post_id: string;
  author_id: string;
  rule_violated: string;
  timestamp: string;
  content_snippet: string;
}

function ViolationsComponent() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(false);

  const monitorUser = async (userId: string, forbiddenWords: string[]) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: [{ user_id: userId, forbidden_words: forbiddenWords }],
          days: 7
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setViolations(data.violations);
      }
    } catch (error) {
      console.error('Error monitoring user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => monitorUser('1398613', ['kinda', 'dunno'])}>
        Monitor User
      </button>
      
      {loading && <p>Loading...</p>}
      
      <ul>
        {violations.map(v => (
          <li key={v.id}>
            <strong>{v.rule_violated}</strong>
            <p>{v.content_snippet}</p>
            <small>{new Date(v.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Python (Requests Library)

```python
import requests

# Monitor users
def monitor_users():
    response = requests.post('http://localhost:5000/api/monitor', json={
        "users": [
            {
                "user_id": "1398613",
                "forbidden_words": ["kinda", "dunno"],
                "llm_rules": []
            }
        ],
        "days": 7
    })
    
    data = response.json()
    if data['success']:
        print(f"New violations: {data['summary']['total_new_violations']}")
        return data['violations']

# Get violations
def get_violations(user_ids):
    response = requests.get(
        'http://localhost:5000/api/violations',
        params={'user_ids': ','.join(user_ids)}
    )
    return response.json()['violations_by_user']
```

---

## 🎯 Common Use Cases

### Use Case 1: Real-time Monitoring Dashboard

1. Configure users once with `POST /api/configure`
2. Periodically call `POST /api/monitor` to check for new violations
3. Display results in real-time dashboard

### Use Case 2: Historical Data Display

1. Call `GET /api/violations/all` to get all violations
2. Group by user or date
3. Display in tables or charts

### Use Case 3: User-Specific Rule Management

1. Let users configure their own rules via frontend form
2. Send configuration to `POST /api/configure`
3. Monitor with `POST /api/monitor`
4. Show user their violations with `GET /api/violations?user_ids=...`

---

## 🔒 Security Considerations

- This is a **local development server** - do not expose to the internet
- For production, add:
  - Authentication (API keys, OAuth)
  - Rate limiting
  - Input validation
  - HTTPS/TLS
  - Proper CORS configuration

---

## 🐛 Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-10-23T10:30:00.000000"
}
```

Handle errors in your frontend:

```typescript
try {
  const response = await fetch('http://localhost:5000/api/monitor', {...});
  const data = await response.json();
  
  if (!data.success) {
    console.error('API Error:', data.error);
    // Show error to user
  }
} catch (error) {
  console.error('Network Error:', error);
  // Handle network errors
}
```

---

## 📝 Notes

- The API server must be running for REST endpoints to work
- Violations are stored in a local SQLite database
- LLM-based rules require valid OpenRouter API key
- Farcaster data fetching requires valid Neynar API key
