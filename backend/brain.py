import asyncio
import json
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY", "")
MISTRAL_MODEL = "mistral-small-latest"
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
BATCH_SIZE = 50  # Max posts per API call to avoid token limits

VALID_CATEGORIES = [
    "AI & ML",
    "SaaS",
    "Developer Tools",
    "Web Development",
    "DevOps & Cloud",
    "Cybersecurity",
    "Blockchain & Web3",
    "Mobile Development",
    "Open Source",
    "General Tech",
]

SYSTEM_PROMPT = f"""You are a tech-post classifier. You will receive a JSON array of posts, each with an "index", "title", and "body" field.

Classify every post into exactly ONE of these categories:
{json.dumps(VALID_CATEGORIES)}

For each post, return:
- "index": the same index from the input
- "category": one of the categories listed above
- "novelty_score": integer 1-10 (1 = widely known / mainstream topic, 10 = cutting-edge / novel)
- "english_coverage": boolean — true if this topic is well-covered in English-language tech media, false if it is niche or primarily discussed in non-English communities

Return ONLY a valid JSON array. No explanation, no markdown, no code fences — just the raw JSON array."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_post_payload(posts: list[dict]) -> list[dict]:
    """Build the numbered JSON array sent inside the user message."""
    payload = []
    for i, post in enumerate(posts):
        title = post.get("translated_title", post.get("original_title", ""))
        body = post.get("translated_body", post.get("original_body", ""))
        # Truncate body to keep token usage reasonable
        payload.append({
            "index": i,
            "title": title,
            "body": body[:500],
        })
    return payload


def _apply_fallback(posts: list[dict]) -> None:
    """Apply default classification to all posts (used when API fails)."""
    for post in posts:
        post["category"] = "General Tech"
        post["secondary_category"] = None
        post["key_technologies"] = []
        post["novelty_score"] = 5
        post["english_coverage"] = True


def _parse_and_apply(posts: list[dict], raw_response: str) -> None:
    """Parse the Mistral JSON response and apply results to the posts list."""
    # Strip markdown fences if the model wraps them anyway
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        # Remove opening fence (```json or ```)
        first_newline = cleaned.index("\n")
        cleaned = cleaned[first_newline + 1:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    results = json.loads(cleaned)

    # Build a lookup by index
    result_map: dict[int, dict] = {}
    for item in results:
        idx = item.get("index")
        if idx is not None:
            result_map[int(idx)] = item

    for i, post in enumerate(posts):
        if i in result_map:
            item = result_map[i]
            cat = item.get("category", "General Tech")
            # Validate category
            if cat not in VALID_CATEGORIES:
                cat = "General Tech"
            post["category"] = cat
            post["novelty_score"] = max(1, min(10, int(item.get("novelty_score", 5))))
            post["english_coverage"] = bool(item.get("english_coverage", True))
        else:
            # Missing from response — fallback
            post["category"] = "General Tech"
            post["novelty_score"] = 5
            post["english_coverage"] = True

        # Fields the pipeline expects but the API doesn't return
        post["secondary_category"] = None
        post["key_technologies"] = []


# ---------------------------------------------------------------------------
# Core classification — single API call per batch
# ---------------------------------------------------------------------------

async def _classify_via_mistral(posts: list[dict]) -> None:
    """Send a batch of posts in ONE Mistral API call and apply results."""
    post_payload = _build_post_payload(posts)
    user_message = json.dumps(post_payload, ensure_ascii=False)

    request_body = {
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                MISTRAL_API_URL,
                headers=headers,
                json=request_body,
            )
            response.raise_for_status()

        data = response.json()
        raw_text = data["choices"][0]["message"]["content"]
        _parse_and_apply(posts, raw_text)
        print(f"  ✓ Mistral classified {len(posts)} posts successfully.")

    except Exception as e:
        print(f"  ⚠ Mistral API call failed: {e}")
        print("  → Falling back to General Tech for all posts in this batch.")
        _apply_fallback(posts)


# ---------------------------------------------------------------------------
# Public API — preserves the original contract
# ---------------------------------------------------------------------------

async def classify_posts(posts: list[dict]) -> list[dict]:
    """
    Classify posts using Mistral API in chunks of BATCH_SIZE.
    Each post dict is enriched in-place with:
      category, secondary_category, key_technologies, novelty_score,
      english_coverage
    """
    if not posts:
        return posts

    total = len(posts)
    num_chunks = (total + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"  Classifying {total} posts in {num_chunks} chunk(s) of up to {BATCH_SIZE} ({MISTRAL_MODEL})...")

    for chunk_idx in range(num_chunks):
        start = chunk_idx * BATCH_SIZE
        end = min(start + BATCH_SIZE, total)
        chunk = posts[start:end]
        print(f"  Chunk {chunk_idx + 1}/{num_chunks} ({len(chunk)} posts)...")
        await _classify_via_mistral(chunk)

    return posts


# ---------------------------------------------------------------------------
# Project idea generation — single API call
# ---------------------------------------------------------------------------

IDEAS_SYSTEM_PROMPT = (
    "You are a startup idea analyst. Given these trending tech topics from "
    "non-English communities, generate actionable project ideas that an indie "
    "developer could build in under 2 weeks.\n\n"
    "Return EXACTLY 9 ideas as a JSON array. Each idea must have:\n"
    "- \"title\": short project name\n"
    "- \"one_liner\": one-sentence description\n"
    "- \"category\": the tech category it falls under\n"
    "- \"difficulty\": one of \"Easy\", \"Medium\", or \"Hard\"\n"
    "- \"source_topics\": array of post titles that inspired this idea\n\n"
    "Return ONLY a valid JSON array. No markdown, no explanation, no code fences."
)


async def generate_project_ideas(db_posts: list[dict]) -> list[dict]:
    """
    Take the top 20 posts by novelty_score, send them to Mistral, and get
    back 9 actionable project ideas.  Returns [] on failure (non-blocking).
    """
    if not db_posts:
        return []

    # Sort by novelty_score descending, take top 20
    sorted_posts = sorted(
        db_posts,
        key=lambda p: p.get("novelty_score", 0),
        reverse=True,
    )[:20]

    # Build compact payload — only title + category
    payload = [
        {
            "title": p.get("translated_title", p.get("original_title", "")),
            "category": p.get("category", "General Tech"),
        }
        for p in sorted_posts
    ]

    user_message = json.dumps(payload, ensure_ascii=False)

    request_body = {
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": IDEAS_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                MISTRAL_API_URL,
                headers=headers,
                json=request_body,
            )
            response.raise_for_status()

        data = response.json()
        raw_text = data["choices"][0]["message"]["content"]

        # Strip markdown fences if present
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            first_newline = cleaned.index("\n")
            cleaned = cleaned[first_newline + 1:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        ideas = json.loads(cleaned)

        # Handle the model sometimes wrapping in an object
        if isinstance(ideas, dict):
            # Look for the first list value
            for v in ideas.values():
                if isinstance(v, list):
                    ideas = v
                    break

        if not isinstance(ideas, list):
            print("  ⚠ Mistral returned non-list for project ideas. Skipping.")
            return []

        # Add generated_at timestamp to each idea
        from datetime import datetime, timezone
        generated_at = datetime.now(timezone.utc).isoformat()
        for idea in ideas:
            idea["generated_at"] = generated_at

        print(f"  ✓ Generated {len(ideas)} project ideas.")
        return ideas

    except Exception as e:
        print(f"  ⚠ Project idea generation failed: {e}")
        return []


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

        print(f"Classifying {len(data)} items via Mistral API...")
        classified = await classify_posts(data)

        with open("categorized_global_trends.json", "w", encoding="utf-8") as f:
            json.dump(classified, f, ensure_ascii=False, indent=2)
        print("\nSuccess! Intelligence Layer Complete.")

    asyncio.run(_main())