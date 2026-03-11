import json
import os
from groq import Groq
from dotenv import load_dotenv


load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")


client = Groq(api_key=GROQ_API_KEY)

def categorize_post(title, body):
    """Uses Groq and Llama 3 to assign a strict category to a tech post."""
    prompt = f"""
    You are an expert tech analyst. Read the following foreign startup forum post and classify it into EXACTLY ONE of these categories:
    - AI & Machine Learning
    - Developer Tools & Infrastructure
    - Hardware & Robotics
    - Crypto & Web3
    - SaaS & Enterprise
    - Consumer Tech
    - Other
    
    Return ONLY the exact category name. Do not include quotes, markdown, or any explanations.
    
    Title: {title}
    Body: {body}
    """
    
    try:
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant", 
            
            temperature=0, 
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Other"

def run_intelligence_layer():
    print("Loading translated global trends...")
    try:
        with open('translated_global_trends.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: translated_global_trends.json not found! Run Phase 2 first.")
        return

    print(f"Categorizing {len(data)} items using Groq & Llama 3...")
    
    for idx, item in enumerate(data):
        print(f"Categorizing item {idx + 1}/{len(data)}...")
        
        category = categorize_post(item.get('english_title', ''), item.get('english_body', ''))
        item['category'] = category
        
        # Look ma, no time.sleep()! Groq's free tier can easily handle this loop at full speed.

    with open('categorized_global_trends.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print("\nSuccess! Intelligence Layer Complete. Output saved to categorized_global_trends.json")

if __name__ == "__main__":
    run_intelligence_layer()