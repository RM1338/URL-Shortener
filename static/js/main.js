async function shortenUrl() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showNotification('Please enter a URL', 'error');
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
            throw new Error('Failed to shorten URL');
        }
        
        const data = await response.json();
        
        document.getElementById('shortUrl').textContent = data.short_url;
        document.getElementById('output').style.display = 'block';
        
        loadStats();
        
        showNotification('URL shortened successfully!', 'success');
        
    } catch (error) {
        showNotification('Error: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function copyToClipboard() {
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

const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
    
    .notification.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .notification-success {
        background: #22c55e;
        color: white;
    }
    
    .notification-error {
        background: #ef4444;
        color: white;
    }
`;
document.head.appendChild(style);

document.getElementById('urlInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        shortenUrl();
    }
});

loadStats();