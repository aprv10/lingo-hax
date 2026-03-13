import asyncio
import json
import os
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

client = AsyncGroq(api_key=GROQ_API_KEY)

VALID_CATEGORIES = [
    "AI & Machine Learning",
    "SaaS",
    "Developer Tools",
    "Web3 & Crypto",
    "Infrastructure & Cloud",
    "Mobile",
    "Open Source",
    "Other",
]

SYSTEM_PROMPT = """You are an expert tech analyst. Given a translated tech post (title + body), analyze it and return ONLY valid JSON (no markdown, no backticks, no explanation) in this exact shape:

{
  "category": one of ["AI & Machine Learning", "SaaS", "Developer Tools", "Web3 & Crypto", "Infrastructure & Cloud", "Mobile", "Open Source", "Other"],
  "key_technologies": array of up to 4 technology/tool names mentioned in the post,
  "novelty_score": integer 1-10 where 10 = cutting-edge concept never seen before, 1 = well-established common knowledge,
  "english_coverage": boolean, true if this topic is already widely discussed in English-language tech media, false if it is relatively unknown outside its original language community
}

Return ONLY the JSON object. No other text."""


async def _classify_single(title: str, body: str) -> dict:
    """Classify a single post using Groq LLM. Returns structured dict."""
    user_content = f"Title: {title}\n\nBody: {body[:1000]}"

    try:
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            model="llama-3.1-8b-instant",
            temperature=0,
            max_tokens=300,
        )
        raw = completion.choices[0].message.content.strip()

        # Strip markdown fences if the model wraps in ```json ... ```
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

        result = json.loads(raw)

        # Validate category
        if result.get("category") not in VALID_CATEGORIES:
            result["category"] = "Other"
        # Validate key_technologies
        if not isinstance(result.get("key_technologies"), list):
            result["key_technologies"] = []
        result["key_technologies"] = result["key_technologies"][:4]
        # Validate novelty_score
        ns = result.get("novelty_score", 5)
        result["novelty_score"] = max(1, min(10, int(ns))) if isinstance(ns, (int, float)) else 5
        # Validate english_coverage
        if not isinstance(result.get("english_coverage"), bool):
            result["english_coverage"] = True

        return result

    except json.JSONDecodeError:
        return {
            "category": "Other",
            "key_technologies": [],
            "novelty_score": 5,
            "english_coverage": True,
        }
    except Exception as e:
        print(f"  ⚠ Groq API error: {e}")
        return {
            "category": "Other",
            "key_technologies": [],
            "novelty_score": 5,
            "english_coverage": True,
        }


async def classify_posts(posts: list[dict]) -> list[dict]:
    """
    Classify posts using Groq LLM in batches of 10 (concurrent calls).
    Each post dict is enriched in-place with:
      category, key_technologies, novelty_score, english_coverage
    """
    if not posts:
        return posts

    batch_size = 10
    for i in range(0, len(posts), batch_size):
        batch = posts[i : i + batch_size]
        print(f"  Classifying batch {i // batch_size + 1} ({len(batch)} posts)...")

        tasks = [
            _classify_single(
                post.get("translated_title", post.get("original_title", "")),
                post.get("translated_body", post.get("original_body", "")),
            )
            for post in batch
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for post, result in zip(batch, results):
            if isinstance(result, Exception):
                print(f"  ⚠ Classification failed for post {post.get('id')}: {result}")
                result = {
                    "category": "Other",
                    "key_technologies": [],
                    "novelty_score": 5,
                    "english_coverage": True,
                }
            post["category"] = result["category"]
            post["key_technologies"] = result["key_technologies"]
            post["novelty_score"] = result["novelty_score"]
            post["english_coverage"] = result["english_coverage"]

    return posts


# ---------------------------------------------------------------------------
# Standalone execution (for testing / backward compat)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    async def _main():
        print("Loading translated global trends...")
        try:
            with open("translated_global_trends.json", "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            print("Error: translated_global_trends.json not found! Run translation first.")
            return

        print(f"Classifying {len(data)} items using Groq & Llama 3...")
        classified = await classify_posts(data)

        with open("categorized_global_trends.json", "w", encoding="utf-8") as f:
            json.dump(classified, f, ensure_ascii=False, indent=2)
        print("\nSuccess! Intelligence Layer Complete.")

    asyncio.run(_main())