"""
User Service - Microservice for user management
Handles registration, login, and user profile
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_graphql import GraphQLView
import sys
import os

# Add shared directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared'))

from config import SERVICE_PORTS, CORS_ORIGINS
from schema import schema

app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS)

# Optional debug logging for GraphQL requests. Set DEBUG_GRAPHQL=1 in environment to enable capturing POST bodies.
@app.before_request
def _log_graphql_request_body():
    try:
        if request.path == '/graphql' and request.method == 'POST' and os.getenv('DEBUG_GRAPHQL', '0') == '1':
            data = request.get_data(as_text=True)
            app.logger.debug('GraphQL request body: %s', data)
    except Exception:
        pass

# GraphQL endpoint
app.add_url_rule(
    '/graphql',
    view_func=GraphQLView.as_view('graphql', schema=schema, graphiql=True)
)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'user-service'}), 200

@app.route('/api/users/by-email', methods=['GET'])
def get_user_by_email():
    """Get user by email (Internal use)"""
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email required'}), 400
    
    from models import User
    user = User.get_by_email(email)
    
    if user:
        return jsonify({
            'user_id': user['user_id'],
            'email': user['email'],
            'name': user['name']
        }), 200
    return jsonify({'error': 'User not found'}), 404

if __name__ == '__main__':
    port = SERVICE_PORTS['user']
    app.run(host='0.0.0.0', port=port, debug=True)

