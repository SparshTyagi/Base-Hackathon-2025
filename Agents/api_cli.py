"""CLI interface for JSON-based monitoring."""
import argparse
import json
import sys
from api.json_api import MonitoringAPI, process_json_file


def main():
    """Main CLI entry point for JSON API."""
    parser = argparse.ArgumentParser(
        description="Farcaster Monitoring Agent - JSON API CLI"
    )
    parser.add_argument(
        '--input',
        '-i',
        required=True,
        help='Path to input JSON file with configuration'
    )
    parser.add_argument(
        '--output',
        '-o',
        help='Path to output JSON file for results (optional, prints to stdout if not provided)'
    )
    
    args = parser.parse_args()
    
    try:
        # Process the request
        response = process_json_file(args.input, args.output)
        
        # If no output file, print to stdout
        if not args.output:
            print(json.dumps(response, indent=2, ensure_ascii=False))
        
        # Exit with appropriate code
        sys.exit(0 if response.get("success", False) else 1)
    
    except FileNotFoundError:
        print(f"Error: Input file '{args.input}' not found.", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in input file: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
