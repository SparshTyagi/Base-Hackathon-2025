"""Farcaster API connector using Neynar."""
import requests
from datetime import datetime, timedelta
from typing import List, Dict
from core.settings import get_neynar_api_key


class FarcasterAPI:
    """Connector for Farcaster data via Neynar API."""
    
    def __init__(self, api_key: str | None = None):
        """Initialize the Farcaster API connector.
        
        Args:
            api_key: Neynar API key. If None, reads from settings.
        """
        self.api_key = api_key or get_neynar_api_key()
        self.base_url = "https://api.neynar.com/v2/farcaster"
    
    def get_user_casts(self, fid: int, days: int = 7, limit: int = 150) -> List[Dict]:
        """Fetch casts for a Farcaster ID (fid).
        
        Args:
            fid: Farcaster user ID
            days: Number of days to look back
            limit: Maximum number of casts to retrieve
            
        Returns:
            List of formatted post dictionaries
        """
        url = f"{self.base_url}/feed/user/casts"
        headers = {
            "accept": "application/json",
            "x-api-key": self.api_key
        }
        params = {
            "fid": fid,
            "limit": limit
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
