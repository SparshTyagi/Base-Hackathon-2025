"""Main entry point for the Farcaster monitoring application."""
from monitor import FarcasterMonitor


def main():
    """Main application entry point."""
    print("=" * 60)
    print("   Farcaster Monitoring Agent")
    print("=" * 60)
    
    # Initialize the monitor
    monitor = FarcasterMonitor()
    
    # # Example: Configure user 1398613 with forbidden words
    # monitor.add_user_with_rules(
    #     user_id="1398613",
    #     forbidden_words=["kinda", "dunno", "baby"]
    # )
    
    # Example: Configure another user with LLM-based rules
    monitor.add_user_with_rules(
        user_id="1398613",
        forbidden_words=["spam", "scam", "kinda", "dunno"],
        llm_rules=[
            {
                "name": "Song Lyrics",
                "description": "Detect posts that are song lyrics"
            },
            {
                "name": "Negativity",
                "description": "Detect posts with excessive negativity or complaining"
            }
        ]
    )
    
    # Monitor all configured users
    print("\n" + "=" * 60)
    print("   Starting Monitoring Process")
    print("=" * 60)
    
    results = monitor.monitor_all_users(days=7)
    
    # Print summary
    print("\n" + "=" * 60)
    print("   Monitoring Summary")
    print("=" * 60)
    total_violations = sum(results.values())
    print(f"Total users monitored: {len(results)}")
    print(f"Total violations found: {total_violations}")
    print("\nPer-user breakdown:")
    for user_id, count in results.items():
        print(f"  - User {user_id}: {count} violations")
    print("=" * 60)


if __name__ == "__main__":
    main()
