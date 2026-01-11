from flask import Flask, render_template, request, redirect, jsonify
from url_shortener import create_short_url, get_all_urls, get_original_url
from file_handler import increment_clicks
from constants import BASE_URL

app = Flask(__name__)


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/shorten', methods=['POST'])
def shorten():
    """Handle URL shortening request."""
    data = request.get_json()
    original_url = data.get('url', '').strip()
    
    if not original_url:
        return jsonify({'error': 'URL is required'}), 400
    
    if not original_url.startswith(('http://', 'https://')):
        original_url = 'https://' + original_url
    
    result = create_short_url(original_url)
    short_url = f"{BASE_URL}/{result['short_code']}"
    
    return jsonify({
        'short_url': short_url,
        'short_code': result['short_code']
    })


@app.route('/api/stats')
def stats():
    """Get statistics about shortened URLs."""
    urls = get_all_urls()
    total_urls = len(urls)
    total_clicks = sum(url.get('clicks', 0) for url in urls)
    
    return jsonify({
        'total_urls': total_urls,
        'total_clicks': total_clicks
    })


@app.route('/list')
def list_urls():
    """Display all shortened URLs."""
    urls = get_all_urls()
    return render_template('list.html', urls=urls, base_url=BASE_URL)


@app.route('/<short_code>')
def redirect_to_url(short_code):
    """Redirect to the original URL."""
    original_url = get_original_url(short_code)
    
    if original_url:
        increment_clicks(short_code)
        return redirect(original_url)
    
    return "URL not found", 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)