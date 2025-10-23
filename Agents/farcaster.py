# farcaster_monitor.py
import json
import os
import sqlite3
import time
from datetime import datetime, timedelta
import requests
from openai import OpenAI

def get_fast_model():
    """Returns the default model for the agent."""
    return "nvidia/nemotron-nano-9b-v2:free"

def get_fallback_models():
    """Returns a list of fallback models."""
    return ["google/gemini-pro"]

class BaseAgent:
    """A base class for Agents that use an LLM, providing a shared client."""
    def __init__(self, model: str | None, api_key: str, site_url: str = None, site_name: str = None):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
            timeout=45.0,
            max_retries=0,
        )
        self.model = model or get_fast_model()
        self.extra_headers = {}
        if site_url: self.extra_headers["HTTP-Referer"] = site_url
        if site_name: self.extra_headers["X-Title"] = site_name
    

# --- Part 3: Database Logic ---
def initialize_db(db_name="violations.db"):
    con = sqlite3.connect(db_name)
    cur = con.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS violations (
            id INTEGER PRIMARY KEY,
            post_id TEXT NOT NULL,
            author_id TEXT NOT NULL,
            rule_violated TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            content_snippet TEXT,
            UNIQUE(post_id, rule_violated)
        )
    """)
    con.commit()
    con.close()
    print("Database initialized successfully.")

def add_violation(post_id, author_id, rule, timestamp, content, db_name="violations.db"):
    con = sqlite3.connect(db_name)
    cur = con.cursor()
    try:
        cur.execute(
            "INSERT INTO violations (post_id, author_id, rule_violated, timestamp, content_snippet) VALUES (?, ?, ?, ?, ?)",
            (post_id, author_id, rule, timestamp, content[:200])
        )
        con.commit()
        print(f"✅ VIOLATION LOGGED for post {post_id} -> Rule: {rule}")
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        con.close()

# --- Part 4: Farcaster Data Connector ---
def get_farcaster_casts(fid: int, days: int = 7):
    """Fetches casts for a Farcaster ID (fid) using a direct REST API call."""
    api_key = os.getenv("NEYNAR_API_KEY")
    if not api_key:
        raise ValueError("NEYNAR_API_KEY environment variable not set.")

    url = "https://api.neynar.com/v2/farcaster/feed/user/casts"
    headers = {
        "accept": "application/json",
        "x-api-key": api_key 
    }
    params = {
        "fid": fid,
        "limit": 150
    }
    
    print(f"Fetching casts for Farcaster user FID: {fid} via REST API...")
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()
    
    formatted_posts = []
    time_threshold = datetime.now() - timedelta(days=days)

    for cast in data.get("casts", []):
        cast_timestamp = datetime.fromisoformat(cast['timestamp'].replace('Z', '+00:00'))
        if cast_timestamp.replace(tzinfo=None) >= time_threshold:
            formatted_posts.append({
                "post_id": cast['hash'],
                "author_id": str(cast['author']['fid']),
                "content": cast['text'],
                "timestamp": cast['timestamp']
            })
            
    print(f"Found and filtered {len(formatted_posts)} casts from the last {days} days.")
    return formatted_posts

# --- Part 5: Rule Engine ---
def check_for_forbidden_words(post: dict) -> bool:
    """Checks for the specific words 'kinda' or 'dunno' in the post content."""
    forbidden_words = ["kinda", "dunno"]
    content_lower = post.get("content", "").lower()
    return any(f' {word} ' in f' {content_lower} ' for word in forbidden_words)

# --- Part 6: Main Orchestrator ---
def main():
    print("--- Farcaster Monitoring Agent Initializing ---")
    initialize_db()
    
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key:
        print("Warning: OPENROUTER_API_KEY not set. LLM-based rules will fail.")

    # The BaseAgent is initialized with your chosen model for future use,
    # though it is not used by the simple `check_for_forbidden_words` rule.
    my_agent = BaseAgent(model=None, api_key=openrouter_api_key)
    print(f"AI Agent configured to use model: {my_agent.model}")
    
    # UPDATED: Target FID is now 1398613
    target_fid = 1398613
    monitoring_days = 7

    try:
        user_casts = get_farcaster_casts(target_fid, days=monitoring_days)
    except Exception as e:
        print(f"\n--- ERROR ---")
        print(f"Failed to fetch Farcaster data: {e}")
        return

    violations_found = 0
    print("\n--- Scanning Casts for Rule Violations ---")
    if not user_casts:
        print("No casts to analyze.")
    else:
        for cast in user_casts:
            if check_for_forbidden_words(cast):
                if add_violation(
                    post_id=cast['post_id'],
                    author_id=cast['author_id'],
                    rule="Used forbidden word (kinda/dunno)",
                    timestamp=cast['timestamp'],
                    content=cast['content']
                ):
                    violations_found += 1
    
    print("\n--- Analysis Complete ---")
    print(f"New violations found in this run: {violations_found}")

if __name__ == "__main__":
    main()