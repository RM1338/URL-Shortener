import random
from datetime import datetime
from typing import Dict, List
from constants import BASE62_CHARS, SHORT_CODE_LENGTH
from db import (
    find_url_by_original,
    find_url_by_code,
    create_url_entry,
    get_all_urls as db_get_all_urls
)

def generate_short_code() -> str:
    return ''.join(random.choices(BASE62_CHARS, k=SHORT_CODE_LENGTH))

def create_short_url(original_url: str) -> Dict:
    existing = find_url_by_original(original_url)
    if existing:
        return existing

    while True:
        short_code = generate_short_code()
        if not find_url_by_code(short_code):
            break

    return create_url_entry(short_code, original_url)


def get_all_urls() -> List[Dict]:
    return db_get_all_urls()

def get_original_url(short_code: str) -> str:
    url_entry = find_url_by_code(short_code)
    if url_entry:
        return url_entry['original_url']
    return None