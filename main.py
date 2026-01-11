import sys
from datetime import datetime
from url_shortener import create_short_url, get_all_urls
from constants import BASE_URL

def print_usage():
    print("Usage:")
    print('  python main.py shorten "https://example.com"')
    print("  python main.py list")

def format_datetime(iso_string: str) -> str:
    dt = datetime.fromisoformat(iso_string)
    return dt.strftime("%Y-%m-%d %H:%M")

def print_table(urls):
    if not urls:
        print("No URLs found.")
        return
    
    max_code =  max(len(u['short_code']) for u in urls)
    max_url = max(len(u['original_url']) for u in urls)
    max_url = min(max_url, 40)

    code_width = max(max_code, 4)
    url_width = max(max_url, 12)
    clicks_width = 6
    date_width = 16

    print("┌─" + "─" * code_width + "─┬─" + "─" * url_width + "─┬─" + "─" * clicks_width + "─┬─" + "─" * date_width + "─┐")
    print("│ " + "Code".ljust(code_width) + " │ " + "Original URL".ljust(url_width) + " │ " + "Clicks".ljust(clicks_width) + " │ " + "Created".ljust(date_width) + " │")
    print("├─" + "─" * code_width + "─┼─" + "─" * url_width + "─┼─" + "─" * clicks_width + "─┼─" + "─" * date_width + "─┤")

    for urls in urls:
        code = url['short_code'].ljust(code_width)
        original = url['original_url'][:url_width].ljust(url_width)
        clicks = str(url['clicks']).ljust(cicks_width)
        created = format_datetime(url['created_at']).ljust(date_width)
        print(f"| {code} | {original} | {clicks} | {created} |")

    print("└─" + "─" * code_width + "─┴─" + "─" * url_width + "─┴─" + "─" * clicks_width + "─┴─" + "─" * date_width + "─┘")

def main():
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "shorten":
        if len(sys.argv) < 3:
            print("Error: Please provide a URL to shorten")
            print_usage()
            sys.exit(1)

        url = sys.argv[2]
        result = create_short_url(url)
        print(f"Your short URL: {BASE_URL}/{result['short_code']}")

    elif command == "lists":
        urls = get_all_urls()
        print_table(urls)

    else:
        print(f"Error: Unknown command '{commanf}'")
        print_usage()
        sys.exit(1)

if __name__ == "__main__":
    main()