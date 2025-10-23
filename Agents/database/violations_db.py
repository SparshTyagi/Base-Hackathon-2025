"""Database operations for violations tracking."""
import sqlite3
from typing import Optional
from core.settings import get_database_path


class ViolationsDatabase:
    """Manages the violations database."""
    
    def __init__(self, db_path: Optional[str] = None):
        """Initialize database connection.
        
        Args:
            db_path: Path to the database file. If None, uses settings default.
        """
        self.db_path = db_path or get_database_path()
        self.initialize()
    
    def initialize(self) -> None:
        """Create the violations table if it doesn't exist."""
        con = sqlite3.connect(self.db_path)
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
        print(f"Database initialized successfully at: {self.db_path}")
    
    def add_violation(
        self,
        post_id: str,
        author_id: str,
        rule: str,
        timestamp: str,
        content: str
    ) -> bool:
        """Add a violation to the database.
        
        Args:
            post_id: Unique identifier for the post
            author_id: Unique identifier for the author
            rule: Description of the rule violated
            timestamp: When the violation occurred
            content: Content snippet (will be truncated to 200 chars)
            
        Returns:
            True if violation was added, False if it already exists
        """
        con = sqlite3.connect(self.db_path)
        cur = con.cursor()
        try:
            cur.execute(
                """INSERT INTO violations 
                   (post_id, author_id, rule_violated, timestamp, content_snippet) 
                   VALUES (?, ?, ?, ?, ?)""",
                (post_id, author_id, rule, timestamp, content[:200])
            )
            con.commit()
            print(f"✅ VIOLATION LOGGED for post {post_id} -> Rule: {rule}")
            return True
        except sqlite3.IntegrityError:
            # Violation already exists
            return False
        finally:
            con.close()
    
    def get_violations_by_author(self, author_id: str) -> list[dict]:
        """Get all violations for a specific author.
        
        Args:
            author_id: The author's unique identifier
            
        Returns:
            List of violation dictionaries
        """
        con = sqlite3.connect(self.db_path)
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        cur.execute(
            """SELECT * FROM violations 
               WHERE author_id = ? 
               ORDER BY timestamp DESC""",
            (author_id,)
        )
        rows = cur.fetchall()
        con.close()
        return [dict(row) for row in rows]
    
    def get_all_violations(self) -> list[dict]:
        """Get all violations from the database.
        
        Returns:
            List of all violation dictionaries
        """
        con = sqlite3.connect(self.db_path)
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        cur.execute("SELECT * FROM violations ORDER BY timestamp DESC")
        rows = cur.fetchall()
        con.close()
        return [dict(row) for row in rows]
