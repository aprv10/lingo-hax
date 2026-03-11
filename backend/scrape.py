import requests
import json

def scrape_qiita_japan():
    print("Fetching from Qiita (Japan)...")
    url = "https://qiita.com/api/v2/items?page=1&per_page=10"
    response = requests.get(url)
    articles = response.json() if response.status_code == 200 else []
    
    normalized_data = []
    for item in articles:
        normalized_data.append({
            "source": "Qiita (Japan)",
            "original_lang": "JA",
            "title": item.get("title", ""),
            "body": item.get("body", "")[:500],
            "url": item.get("url", "")
        })
    return normalized_data

def scrape_v2ex_china():
    print("Fetching from V2EX (China)...")
    url = "https://www.v2ex.com/api/topics/hot.json"
    response = requests.get(url)
    topics = response.json() if response.status_code == 200 else []
    
    normalized_data = []
    for item in topics:
        normalized_data.append({
            "source": "V2EX (China)",
            "original_lang": "ZH",
            "title": item.get("title", ""),
            "body": item.get("content", "")[:500],
            "url": item.get("url", "")
        })
    return normalized_data

def scrape_reddit_spain():
    print("Fetching from Reddit (r/programacion - Spain/LatAm)...")
    url = "https://www.reddit.com/r/programacion/hot.json?limit=10"
    
    headers = {"User-Agent": "GlobalArbitrageHackathonBot/1.0"}
    
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Reddit API blocked the request (Status: {response.status_code})")
        return []
        
    posts = response.json().get("data", {}).get("children", [])
    
    normalized_data = []
    for post in posts:
        item = post.get("data", {})
        if item.get("stickied"): 
            continue
            
        normalized_data.append({
            "source": "Reddit (r/programacion)",
            "original_lang": "ES",
            "title": item.get("title", ""),
            "body": item.get("selftext", "")[:500],
            "url": f"https://reddit.com{item.get('permalink', '')}"
        })
    return normalized_data


print("Initializing Global Arbitrage Scrapers...")
global_trends = scrape_qiita_japan() + scrape_v2ex_china() + scrape_reddit_spain()


with open('raw_global_trends.json', 'w', encoding='utf-8') as f:
    json.dump(global_trends, f, ensure_ascii=False, indent=4)
    
print(f"Success! Aggregated {len(global_trends)} foreign technical trends.")