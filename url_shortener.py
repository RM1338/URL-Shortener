import random
from datetime import datetime
from typing import Dict, List
from constants import BASE62_CHARS, SHORT_CODE_LENGTH
from file_handler import read_urls, write_urls, find_url_by_code

def generate_short_code() -> str:
    return ''.join(random.choices(BASE62_CHARS, k=SHORT_CODE_LENGTH))

def create_short_url(original_url: str) -> Dict:
    urls = read_urls()

    for url_entry in urls:
        if url_entry['original_url'] == original_url:
            return  url_entry
        
    while True:
        short_code = generate_short_code()
        if not find_url_by_code(short_code):
            break

    url_entry = {
        'short_code': short_code,
        'original_url': original_url,
        'clicks': 0,
        'created_at': datetime.now().isoformat()
    }

    urls.append(url_entry)
    write_urls(urls)

    return url_entry

def get_all_urls() -> List[Dict]:
    return read_urls()

def get_original_url(short_code: str) -> str:
    url_entry = find_url_by_code(short_code)
    if url_entry:
        return url_entry['original_url']
    return None