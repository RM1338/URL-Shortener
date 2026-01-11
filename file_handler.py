import json
import os
from typing import List, Dict, Optional
from constants import DATA_FILE

def read_urls() -> List[Dict]:
    if not os.path.exists(DATA_FILE):
        return []
    
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []
    
def write_urls(urls: List[Dict]) -> None:
    with open(DATA_FILE, 'w') as f:
        json.dump(urls, f, indent=2)

def find_url_by_code(short_code: str) -> Optional[Dict]:
    urls = read_urls()
    for url_entry in urls:
        if urls_entry['short_code'] == short_code:
            return url_entry
    return None

def increment_clicks(short_code: str) -> None:
    urls = read_urls()
    for url_entry in urls:
        if url_entry['short_code'] == short_code:
            url_entry['clicks'] += 1
            write_urls(urls)
            break