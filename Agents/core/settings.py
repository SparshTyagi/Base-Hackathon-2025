"""Configuration and settings for the application."""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def get_fast_model() -> str:
    """Returns the default model for the agent."""
    return os.getenv("DEFAULT_MODEL", "nvidia/nemotron-nano-9b-v2:free")


def get_fallback_models() -> list[str]:
    """Returns a list of fallback models."""
    fallback_str = os.getenv("FALLBACK_MODELS", "openai/gpt-oss-20b:free")
    return [m.strip() for m in fallback_str.split(",") if m.strip()]


def get_openrouter_api_key() -> str:
    """Returns the OpenRouter API key."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set.")
    return api_key


def get_neynar_api_key() -> str:
    """Returns the Neynar API key."""
    api_key = os.getenv("NEYNAR_API_KEY")
    if not api_key:
        raise ValueError("NEYNAR_API_KEY environment variable not set.")
    return api_key


def get_database_path() -> str:
    """Returns the database file path."""
    return os.getenv("DATABASE_PATH", "violations.db")


def get_backend_webhook_url() -> str | None:
    """Returns the backend webhook URL if configured."""
    return os.getenv("BACKEND_WEBHOOK_URL") or None
