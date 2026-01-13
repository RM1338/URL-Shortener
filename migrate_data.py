import json
import os
from db import create_url_entry, init_db, get_all_urls

def migrate_from_json():
    
    print(" Starting migration from JSON to PostgreSQL...")
    print("=" * 60)
    
    print("\n Initializing database tables...")
    try:
        init_db()
    except Exception as e:
        print(f" Failed to initialize database: {e}")
        return
    
    json_file = 'urls.json'
    if not os.path.exists(json_file):
        print(f"\n  No {json_file} file found.")
        print("Starting with a fresh database!")
        print("=" * 60)
        return
    
    print(f"\n Reading data from {json_file}...")
    try:
        with open(json_file, 'r') as f:
            urls = json.load(f)
        print(f" Found {len(urls)} URLs to migrate")
    except json.JSONDecodeError as e:
        print(f" Error reading JSON file: {e}")
        return
    except Exception as e:
        print(f" Error: {e}")
        return
    
    if not urls:
        print("  JSON file is empty. Nothing to migrate.")
        return
    
    print(f"\n Migrating URLs to PostgreSQL...")
    print("-" * 60)
    
    success_count = 0
    failed_count = 0
    
    for i, url in enumerate(urls, 1):
        try:
            short_code = url.get('short_code')
            original_url = url.get('original_url')
            clicks = url.get('clicks', 0)
            
            if not short_code or not original_url:
                print(f" [{i}/{len(urls)}] Invalid entry: {url}")
                failed_count += 1
                continue
            
            create_url_entry(
                short_code=short_code,
                original_url=original_url,
                clicks=clicks
            )
            
            print(f" [{i}/{len(urls)}] Migrated: {short_code} -> {original_url[:50]}... ({clicks} clicks)")
            success_count += 1
            
        except Exception as e:
            print(f" [{i}/{len(urls)}] Failed to migrate {url.get('short_code', 'unknown')}: {e}")
            failed_count += 1
    
    print("\n" + "=" * 60)
    print(" MIGRATION SUMMARY")
    print("=" * 60)
    print(f" Successfully migrated: {success_count} URLs")
    print(f" Failed: {failed_count} URLs")
    print(f" Total processed: {len(urls)} URLs")
    
    print("\n Verifying migration...")
    try:
        db_urls = get_all_urls()
        print(f" Database now contains {len(db_urls)} URLs")
        
        if len(db_urls) == success_count:
            print(" Migration verification PASSED!")
        else:
            print(f"  Warning: Expected {success_count} URLs but found {len(db_urls)}")
    
    except Exception as e:
        print(f" Failed to verify migration: {e}")
    
    print("\n" + "=" * 60)
    print(" BACKUP RECOMMENDATION")
    print("=" * 60)
    print(f"Your original data is still in {json_file}")
    print("Consider backing it up:")
    print(f"  cp {json_file} {json_file}.backup")
    print("\nOnce you confirm everything works, you can remove:")
    print(f"  - {json_file}")
    print(f"  - file_handler.py (if you're not using it anymore)")
    print("=" * 60)

def verify_database():
    """Quick verification of database contents"""
    print("\n Database Contents:")
    print("=" * 60)
    
    try:
        urls = get_all_urls()
        
        if not urls:
            print("Database is empty")
            return
        
        print(f"\nTotal URLs: {len(urls)}\n")
        
        for i, url in enumerate(urls[:10], 1):  
            print(f"{i}. {url['short_code']} -> {url['original_url'][:60]}...")
            print(f"   Clicks: {url['clicks']} | Created: {url['created_at']}")
        
        if len(urls) > 10:
            print(f"\n... and {len(urls) - 10} more URLs")
    
    except Exception as e:
        print(f" Error verifying database: {e}")

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print(" PostgreSQL Migration Tool")
    print("=" * 60)
    
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("\n ERROR: DATABASE_URL not found in environment!")
        print("Make sure you have a .env file with:")
        print("DATABASE_URL=postgresql://user:password@localhost/url_shortener")
        exit(1)
    
    print(f"\n Database: {db_url.split('@')[1] if '@' in db_url else db_url}")
    
    print("\n  WARNING: This will migrate data from urls.json to PostgreSQL")
    response = input("\nContinue? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        migrate_from_json()
        verify_database()
        print("\n Migration complete!\n")
    else:
        print("\n Migration cancelled")
        print("Run this script again when you're ready.")