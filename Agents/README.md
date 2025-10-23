# Farcaster Monitoring Agent

A modular and extensible Python application designed to monitor Farcaster user activity for specific rule violations. This agent can track multiple users, apply unique rule sets to each, and log violations in a persistent database. It supports both simple keyword-based rules and sophisticated AI-powered content analysis using LLMs.

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
├── monitor.py               # High-level orchestrator for monitoring tasks
├── main.py                  # Application entry point and example usage
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
FALLBACK_MODELS="google/gemini-pro"

# LLM Request Behavior
LLM_REQUEST_TIMEOUT_S="45"
LLM_ATTEMPTS_PER_MODEL="3"
LLM_RETRY_DELAYS_S="15,20"
```

### 3. Running the Monitor

Execute the `main.py` script to start the monitoring process.

```bash
python main.py
```

The `main.py` file contains examples that you can customize to define which users and rules to run.

## 💡 Usage Examples

All examples are configured in `main.py`.

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