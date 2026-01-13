function isValidUrl(string) {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    
    const hasValidProtocol = /^https?:\/\//i.test(string);
    const hasDomain = /\.[a-z]{2,}$/i.test(string);
    
    if (hasValidProtocol) {
        return urlPattern.test(string);
    }
    
    return hasDomain && /^[\w\-]+(\.[\w\-]+)+/.test(string);
}

async function shortenUrl() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showNotification('Please enter a URL', 'error');
        return;
    }
    
    if (!isValidUrl(url)) {
        showNotification('Please enter a valid URL (e.g., google.com or https://example.com)', 'error');
        urlInput.classList.add('error-shake');
        setTimeout(() => urlInput.classList.remove('error-shake'), 500);
        return;
    }
    
    const btn = document.getElementById('submitBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="btn-text">Shortening...</span>';
    btn.disabled = true;
    
    try {
        const response = await fetch('/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to shorten URL');
        }
        
        const data = await response.json();
        
        document.getElementById('shortUrl').textContent = data.short_url;
        document.getElementById('output').style.display = 'block';
        
        urlInput.value = '';
        
        loadStats();
        
        showNotification('URL shortened successfully!', 'success');
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function copyToClipboard(event) {
    const shortUrl = document.getElementById('shortUrl').textContent;
    const btn = event.target.closest('.copy-btn');
    const originalContent = btn.innerHTML;
    
    try {
        await navigator.clipboard.writeText(shortUrl);
        
        btn.innerHTML = '<span class="copy-icon">✓</span><span class="copy-text">Copied!</span>';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.remove('copied');
        }, 2000);
        
        showNotification('Copied to clipboard!', 'success');
        
    } catch (err) {
        showNotification('Failed to copy to clipboard', 'error');
    }
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        animateNumber('totalUrls', data.total_urls);
        animateNumber('totalClicks', data.total_clicks);
        
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const increment = Math.ceil((targetValue - currentValue) / 20);
    
    if (currentValue < targetValue) {
        element.textContent = Math.min(currentValue + increment, targetValue);
        setTimeout(() => animateNumber(elementId, targetValue), 30);
    } else {
        element.textContent = targetValue;
    }
}

function showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


document.getElementById('urlInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        shortenUrl();
    }
});

document.getElementById('urlInput').addEventListener('input', function(e) {
    const url = e.target.value.trim();
    if (url && !isValidUrl(url)) {
        e.target.style.borderColor = '#ef4444';
    } else {
        e.target.style.borderColor = '';
    }
});

loadStats();