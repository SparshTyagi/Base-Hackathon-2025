"""Flask REST API server for the monitoring agent."""
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.json_api import MonitoringAPI

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize the API
api = MonitoringAPI()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "Farcaster Monitoring Agent"
    })


@app.route('/api/monitor', methods=['POST'])
def monitor_users():
    """Monitor users and return violations.
    
    Request body:
    {
        "users": [
            {
                "user_id": "1398613",
                "forbidden_words": ["kinda", "dunno"],
                "llm_rules": [...]
            }
        ],
        "days": 7
    }
    """
    try:
        request_data = request.get_json()
        request_data["action"] = "monitor"
        response = api.process_request(request_data)
        return jsonify(response)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/violations', methods=['GET'])
def get_violations():
    """Get violations for specific users.
    
    Query params:
    - user_ids: comma-separated list of user IDs
    
    Example: /api/violations?user_ids=1398613,194
    """
    try:
        user_ids_param = request.args.get('user_ids', '')
        user_ids = [uid.strip() for uid in user_ids_param.split(',') if uid.strip()]
        
        request_data = {
            "action": "get_violations",
            "user_ids": user_ids
        }
        response = api.process_request(request_data)
        return jsonify(response)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/violations/all', methods=['GET'])
def get_all_violations():
    """Get all violations from the database."""
    try:
        request_data = {"action": "get_all_violations"}
        response = api.process_request(request_data)
        return jsonify(response)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/configure', methods=['POST'])
def configure_users():
    """Configure user rules without monitoring.
    
    Request body:
    {
        "users": [
            {
                "user_id": "1398613",
                "forbidden_words": ["kinda", "dunno"],
                "llm_rules": [...]
            }
        ]
    }
    """
    try:
        request_data = request.get_json()
        request_data["action"] = "configure_users"
        response = api.process_request(request_data)
        return jsonify(response)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/process', methods=['POST'])
def process_generic():
    """Generic endpoint that processes any action.
    
    Request body must include "action" field.
    """
    try:
        request_data = request.get_json()
        response = api.process_request(request_data)
        return jsonify(response)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == '__main__':
    print("Starting Farcaster Monitoring API Server...")
    print("API Endpoints:")
    print("  GET  /health - Health check")
    print("  POST /api/monitor - Monitor users and get violations")
    print("  GET  /api/violations?user_ids=... - Get violations for specific users")
    print("  GET  /api/violations/all - Get all violations")
    print("  POST /api/configure - Configure user rules")
    print("  POST /api/process - Generic endpoint for any action")
    app.run(host='0.0.0.0', port=5000, debug=True)
