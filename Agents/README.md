# Farcaster Monitoring Agent

A modular and extensible Python application designed to monitor Farcaster user activity for specific rule violations. This agent can track multiple users, apply unique rule sets to each, and log violations in a persistent database. It supports both simple keyword-based rules and sophisticated AI-powered content analysis using LLMs.

**Now with full JSON API support for frontend integration!** 🚀

## ✨ Features

-   ✅ **User-Specific Rules**: Assign unique sets of rules to different Farcaster user FIDs.
-   ✅ **Multi-Rule Engine**:
    -   **Keyword Matching**: Detects the presence of specific forbidden words.
    -   **AI-Powered Analysis**: Uses LLMs to check for abstract violations like "promotional content" or "negativity".
-   ✅ **Extensible Architecture**: Easily add new, custom rule types by implementing a simple protocol.
-   ✅ **Persistent Storage**: All detected violations are logged in a local SQLite database for historical tracking.
-   ✅ **Robust LLM Integration**: Features automatic retries and fallback to different models (via OpenRouter) for improved reliability.
-   ✅ **Batch Processing**: Monitor all configured users in a single, efficient run.
-   ✅ **Clean & Modular**: Code is organized by concern (API connectors, database, rules) for maintainability.
-   ✅ **JSON API Interface**: Full REST API and JSON file-based interface for easy frontend integration.
-   ✅ **CORS Enabled**: Ready for cross-origin requests from web frontends.

## 📂 Project Structure

```
Agents/
├── core/                    # Core utilities and base classes
│   ├── settings.py          # Configuration management (env vars)
│   └── base_agent.py        # Enhanced BaseAgent with retry logic
│
├── database/                # Data persistence layer
│   └── violations_db.py     # SQLite database operations
│
├── connectors/              # External API integrations
│   └── farcaster_api.py     # Neynar API client for Farcaster data
│
├── rules/                   # Rule engine for violation detection
│   └── rule_engine.py       # Extensible rule system and rule types
│
├── api/                     # JSON API interface for frontend
│   ├── json_api.py          # Core JSON processing logic
│   └── server.py            # Flask REST API server
│
├── examples/                # Example JSON request files
│   ├── monitor_request.json
│   ├── get_violations_request.json
│   ├── get_all_violations_request.json
│   └── configure_request.json
│
├── monitor.py               # High-level orchestrator for monitoring tasks
├── main.py                  # Application entry point and example usage
├── api_cli.py               # CLI for JSON file-based API
├── requirements.txt         # Project dependencies
└── README.md                # This file
```

## 🚀 Getting Started

### 1. Installation

Clone the repository and install the required Python packages.

```bash
pip install -r requirements.txt
```

### 2. Configuration

Create a `.env` file in the `Agents/` directory and add your API keys and configuration.

```env
# Required API Keys
NEYNAR_API_KEY="YOUR_NEYNAR_API_KEY"
OPENROUTER_API_KEY="YOUR_OPENROUTER_API_KEY"

# --- Optional Settings ---

# Database path
DATABASE_PATH="violations.db"

# LLM Model Selection (via OpenRouter)
DEFAULT_MODEL="nvidia/nemotron-nano-9b-v2:free"
FALLBACK_MODELS="openai/gpt-oss-20b:free"

# LLM Request Behavior
LLM_REQUEST_TIMEOUT_S="45"
LLM_ATTEMPTS_PER_MODEL="3"
LLM_RETRY_DELAYS_S="15,20"
```

### 3. Running the Application

#### Option A: Python Script (Direct Usage)

Execute the `main.py` script to start the monitoring process.

```bash
python main.py
```

The `main.py` file contains examples that you can customize to define which users and rules to run.

#### Option B: REST API Server (For Frontend Integration)

Start the Flask server to enable HTTP endpoints:

```bash
python api/server.py
```

The API will be available at `http://localhost:5000` with CORS enabled.

#### Option C: JSON File-Based API (CLI)

Process JSON configuration files directly:

```bash
python api_cli.py --input examples/monitor_request.json --output results.json
```

## 🌐 JSON API Usage

### REST API Endpoints

Once the server is running (`python api/server.py`), you can use these endpoints:

#### 1. Monitor Users
```http
POST http://localhost:5000/api/monitor
Content-Type: application/json

{
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
  "days": 7
}
```

**Response:**
```json
{
  "success": true,
  "action": "monitor",
  "timestamp": "2025-10-23T10:30:00",
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
      "post_id": "0xabc...",
      "author_id": "1398613",
      "rule_violated": "Used forbidden word (kinda/dunno)",
      "timestamp": "2025-10-22T15:30:00",
      "content_snippet": "I kinda think this is cool..."
    }
  ]
}
```

#### 2. Get Violations for Specific Users
```http
GET http://localhost:5000/api/violations?user_ids=1398613,194
```

**Response:**
```json
{
  "success": true,
  "action": "get_violations",
  "timestamp": "2025-10-23T10:30:00",
  "violations_by_user": {
    "1398613": [...],
    "194": [...]
  },
  "total_violations": 5
}
```

#### 3. Get All Violations
```http
GET http://localhost:5000/api/violations/all
```

**Response:**
```json
{
  "success": true,
  "action": "get_all_violations",
  "timestamp": "2025-10-23T10:30:00",
  "violations": [...],
  "violations_by_user": {...},
  "total_violations": 10,
  "total_users": 2
}
```

#### 4. Configure Users Without Monitoring
```http
POST http://localhost:5000/api/configure
Content-Type: application/json

{
  "users": [
    {
      "user_id": "1398613",
      "forbidden_words": ["kinda", "dunno"]
    }
  ]
}
```

#### 5. Health Check
```http
GET http://localhost:5000/health
```

### JSON File-Based API

You can also use JSON files for configuration and processing:

#### Example Request Files

See the `examples/` directory for sample JSON files:

- **`monitor_request.json`**: Monitor users and get violations
- **`get_violations_request.json`**: Get violations for specific users
- **`get_all_violations_request.json`**: Get all violations
- **`configure_request.json`**: Configure users without monitoring

#### Using the CLI

```bash
# Monitor users from JSON file
python api_cli.py -i examples/monitor_request.json -o results.json

# Get violations
python api_cli.py -i examples/get_violations_request.json

# Get all violations
python api_cli.py -i examples/get_all_violations_request.json
```

## 💡 Python Usage Examples

All examples can be configured in `main.py`.

### Example 1: Monitor a User for Forbidden Words

This is the simplest rule type. The engine will scan a user's casts for the exact words you specify.

```python
# In main.py
from monitor import FarcasterMonitor

# Initialize the monitor
monitor = FarcasterMonitor()

# Add a user and their specific rules
monitor.add_user_with_rules(
    user_id="1398613",
    forbidden_words=["kinda", "dunno", "literally"]
)

# Run the monitor for just this user
monitor.monitor_user(fid=1398613, days=7)
```

### Example 2: Monitor a User with AI-Powered Rules

Use an LLM to detect more nuanced violations that can't be caught by keywords.

```python
# In main.py

# Add another user with LLM-based rules
monitor.add_user_with_rules(
    user_id="194", # dwr.eth
    llm_rules=[
        {
            "name": "Promotional Content",
            "description": "Detects if the post is primarily for advertising a product, service, or coin."
        },
        {
            "name": "Low-Effort Content",
            "description": "Detects if the post is generic, unoriginal, or lacks substance."
        }
    ]
)
```

### Example 3: Monitor All Configured Users

After adding all desired users and their rules, you can run the monitor for all of them at once.

```python
# In main.py

# ... (add users as shown above) ...

# Monitor all registered users for the last 7 days
print("\n--- Starting Batch Monitoring for All Users ---")
all_violations = monitor.monitor_all_users(days=7)
print(f"\n--- Batch Monitoring Complete. Total new violations found: {all_violations} ---")

```

## 🔧 Extensibility

You can easily create your own rule types.

1.  Define a class that implements the `check` and `get_description` methods.
2.  Add it to a `UserRuleSet` in the `monitor.py` or `main.py` file.

```python
from typing import Dict

# Define a custom rule
class ContainsQuestionRule:
    def check(self, post: Dict) -> bool:
        """Returns True if a question mark is found."""
        content = post.get("content", "")
        return "?" in content

    def get_description(self) -> str:
        return "Post contains a question"

# Add it to a user's rule set
custom_rule = ContainsQuestionRule()
monitor.add_user_with_rules(
    user_id="9876",
    custom_rules=[custom_rule]
)
```

## 🗄️ Database Schema

Violations are stored in a SQLite database with the following schema:

```sql
CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY,
    post_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    rule_violated TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    content_snippet TEXT,
    UNIQUE(post_id, rule_violated)
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `post_id`: Unique identifier for the Farcaster cast
- `author_id`: Farcaster FID of the author
- `rule_violated`: Description of which rule was violated
- `timestamp`: ISO timestamp when the post was created
- `content_snippet`: First 200 characters of the post content

---

## 🔗 Frontend Integration

For detailed information on integrating with your frontend application, see **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)**.

**Quick Links:**
- REST API Reference
- JavaScript/TypeScript examples
- React integration examples
- Error handling patterns

---

## 🧪 Testing

Run the demo script to test the JSON API:

```bash
python demo_api.py
```

This will:
1. Monitor a test user
2. Retrieve violations
3. Save results to `demo_output.json`

---

## 🛠️ Development

### Project Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- `openai` - LLM integration via OpenRouter
- `requests` - HTTP requests to Neynar API
- `python-dotenv` - Environment variable management
- `flask` - REST API server
- `flask-cors` - CORS support for frontend

### Environment Variables

All configuration is managed through `.env`:

```env
# Required
NEYNAR_API_KEY="your_key"
OPENROUTER_API_KEY="your_key"

# Optional (with defaults)
DATABASE_PATH="violations.db"
DEFAULT_MODEL="nvidia/nemotron-nano-9b-v2:free"
FALLBACK_MODELS="openai/gpt-oss-20b:free"
LLM_REQUEST_TIMEOUT_S="45"
LLM_ATTEMPTS_PER_MODEL="3"
LLM_RETRY_DELAYS_S="15,20"
```

---

## 📚 Additional Resources

- **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** - Complete frontend integration guide
- **`examples/`** - Sample JSON request files
- **`demo_api.py`** - Working demonstration of JSON API usage

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional rule types
- Performance optimizations
- Enhanced error handling
- More comprehensive tests
- Additional API endpoints

---

## 📄 License

This project is part of the Base Hackathon 2025.

---

## 💬 Support

For questions or issues:
1. Check the [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) guide
2. Review example files in `examples/`
3. Run `python demo_api.py` to verify setup

---

**Built with ❤️ for Base Hackathon 2025**