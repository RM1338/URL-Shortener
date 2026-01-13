import os
from flask import Flask, render_template, request, redirect, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from url_shortener import create_short_url, get_all_urls, get_original_url
from constants import BASE_URL
from qr_generator import generate_qr_matrix
from db import init_db, increment_url_clicks, get_stats as db_get_stats

app = Flask(__name__)
app.secret_ket = os.urandom(24)

CORS(app)

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

with app.app_context():
    try:
        init_db()
        print("✓ Database initialized successfully")
    except Exception as e:
        print(f"✗ Failed to initialize database: {e}")


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == 'admin' and password == 'admin':
        session['user'] = username
        return jsonify({'success': True, 'message': 'Login successful'})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
    
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect('/login')

@app.route('/signup')
def signup_page():
    """Render the signup page."""
    return render_template('signup.html')


@app.route('/signup', methods=['POST'])
def signup():
    """Handle signup request."""
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    
    return jsonify({'success': True, 'message': 'Account created'})



@app.route('/shorten', methods=['POST'])
@limiter.limit("10 per minute")  
def shorten():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        original_url = data.get('url', '').strip()
        
        if not original_url:
            return jsonify({'error': 'URL is required'}), 400
        
        if len(original_url) > 2048:
            return jsonify({'error': 'URL is too long (max 2048 characters)'}), 400
        
        if not original_url.startswith(('http://', 'https://')):
            original_url = 'https://' + original_url
        
        if not ('.' in original_url and len(original_url) > 10):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        result = create_short_url(original_url)
        short_url = f"{BASE_URL}/{result['short_code']}"
        
        return jsonify({
            'short_url': short_url,
            'short_code': result['short_code']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error in /shorten: {e}")
        return jsonify({'error': 'Failed to shorten URL. Please try again.'}), 500


@app.route('/list')
def list_urls():
    try:
        urls = get_all_urls()
        return render_template('list.html', urls=urls, base_url=BASE_URL)
    except Exception as e:
        print(f"Error in /list: {e}")
        return render_template('list.html', urls=[], base_url=BASE_URL, error="Failed to load URLs")


@app.route('/api/stats')
def stats():
    try:
        stats_data = db_get_stats()
        return jsonify(stats_data), 200
    except Exception as e:
        print(f"Error in /api/stats: {e}")
        return jsonify({
            'total_urls': 0,
            'total_clicks': 0,
            'error': 'Failed to load statistics'
        }), 500


@app.route('/api/qr/<short_code>')
def get_qr_matrix(short_code):
    try:
        if not short_code or len(short_code) > 20:
            return jsonify({'error': 'Invalid short code'}), 400
        
        url = f"{BASE_URL}/{short_code}"
        matrix = generate_qr_matrix(url)
        
        if not matrix:
            return jsonify({'error': 'Failed to generate QR code'}), 500
        
        return jsonify({
            'matrix': matrix,
            'width': len(matrix[0]) if matrix else 0,
            'height': len(matrix) if matrix else 0
        }), 200
        
    except Exception as e:
        print(f"Error in /api/qr/{short_code}: {e}")
        return jsonify({'error': 'Failed to generate QR code'}), 500


@app.route('/<short_code>')
def redirect_to_url(short_code):
    try:
        if not short_code or len(short_code) > 20:
            return "Invalid short code", 400
        
        original_url = get_original_url(short_code)
        
        if original_url:
            try:
                increment_url_clicks(short_code)
            except Exception as e:
                print(f"Failed to increment clicks for {short_code}: {e}")
            
            return redirect(original_url, code=302)
        
        return render_template('404.html', short_code=short_code), 404
        
    except Exception as e:
        print(f"Error in /{short_code}: {e}")
        return "An error occurred", 500


@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500


@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'error': 'Rate limit exceeded. Please try again later.',
        'limit': str(e.description)
    }), 429


@app.route('/health')
def health():
    try:
        db_get_stats()
        return jsonify({
            'status': 'healthy',
            'database': 'connected'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 503


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True  
    )