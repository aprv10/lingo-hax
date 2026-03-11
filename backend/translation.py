import json
import os
import time
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.environ.get("LINGODOTDEV_API_KEY")
ENGINE_ID = os.environ.get("LINGODOTDEV_ENGINE_ID")



LOCALIZE_URL = "https://api.lingo.dev/process/localize"

def localize_post(title, body, source_locale, target_locale="en"):
    """Sends a batch request to localize both title and body at once."""
    if not title and not body:
        return "", ""
        
    headers = {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "engineId": ENGINE_ID,
        # Ensure locale is lowercase (e.g., 'ja', 'zh', 'es') to match standard formats
        "sourceLocale": source_locale.lower(), 
        "targetLocale": target_locale,
        "data": {
            "title": title,
            "body": body
        }
    }
    
    try:
        response = requests.post(LOCALIZE_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            # The API returns our translated key-value pairs inside the "data" object
            translated_data = response.json().get("data", {})
            return translated_data.get("title", title), translated_data.get("body", body)
        else:
            print(f"API Error {response.status_code}: {response.text}")
            return title, body
            
    except Exception as e:
        print(f"Connection failed: {e}")
        return title, body

def run_translation_engine():
    print("Loading raw global trends...")
    try:
        with open('raw_global_trends.json', 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except FileNotFoundError:
        print("Error: raw_global_trends.json not found. Run the scraper script first!")
        return
        
    translated_data = []
    
    print(f"Processing {len(raw_data)} foreign posts using batch localization...")
    for idx, item in enumerate(raw_data):
        print(f"Translating item {idx + 1}/{len(raw_data)} from {item['original_lang']}...")
        
        # Translate both fields in a single API call!
        english_title, english_body = localize_post(
            item['title'], 
            item['body'], 
            item['original_lang']
        )
        
        translated_data.append({
            "source": item['source'],
            "original_lang": item['original_lang'],
            "original_title": item['title'],
            "english_title": english_title,
            "english_body": english_body,
            "url": item['url']
        })
        
        time.sleep(0.5) # Be polite to API rate limits
        
    with open('translated_global_trends.json', 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=4)
        
    print("\nSuccess! Output saved to translated_global_trends.json")

if __name__ == "__main__":
    run_translation_engine()