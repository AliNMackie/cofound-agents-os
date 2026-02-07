import feedparser
import time

def verify_rss_depth():
    # The URL we are using in production
    url = "https://news.google.com/rss/search?q=bankruptcy+UK+when:28d&hl=en-GB&gl=GB&ceid=GB:en"
    
    print(f"Fetching RSS: {url}")
    feed = feedparser.parse(url)
    
    print(f"Found {len(feed.entries)} entries.")
    
    if not feed.entries:
        print("No entries found!")
        return

    print("\nSample Dates:")
    for i, entry in enumerate(feed.entries[:10]):
        print(f"{i+1}. {entry.published} - {entry.title}")

    # Check for oldest entry
    msg_entries = sorted(feed.entries, key=lambda x: x.published_parsed)
    oldest = msg_entries[0]
    newest = msg_entries[-1]
    
    print(f"\nOldest Entry: {oldest.published}")
    print(f"Newest Entry: {newest.published}")

if __name__ == "__main__":
    verify_rss_depth()
