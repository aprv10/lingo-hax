import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("LINGODOTDEV_API_KEY")
ENGINE_ID = os.environ.get("LINGODOTDEV_ENGINE_ID")

LOCALIZE_URL = "https://api.lingo.dev/process/localize"


async def _localize_post(
    client: httpx.AsyncClient,
    title: str,
    body: str,
    source_locale: str,
    target_locale: str = "en",
) -> tuple[str, str]:
    """Translate a single post's title and body via Lingo.dev API."""
    if not title and not body:
        return "", ""

    payload = {
        "engineId": ENGINE_ID,
        "sourceLocale": source_locale.lower(),
        "targetLocale": target_locale,
        "data": {
            "title": title,
            "body": body,
        },
    }

    try:
        resp = await client.post(LOCALIZE_URL, json=payload)
        if resp.status_code == 200:
            translated = resp.json().get("data", {})
            return translated.get("title", title), translated.get("body", body)
        else:
            print(f"  ⚠ Lingo.dev API error {resp.status_code}: {resp.text[:200]}")
            return title, body
    except Exception as e:
        print(f"  ✗ Lingo.dev connection failed: {e}")
        return title, body


async def translate_posts(posts: list[dict], batch_size: int = 20) -> list[dict]:
    """
    Translate a list of posts. Each post dict is enriched in-place with
    'translated_title' and 'translated_body' keys.

    Processes in concurrent batches of `batch_size` to speed up translation
    while still being respectful to API rate limits (0.5s pause between batches).
    Returns the same list with translations attached.
    """
    if not posts:
        return posts

    async with httpx.AsyncClient(
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
        },
        timeout=30.0,
    ) as client:
        for i in range(0, len(posts), batch_size):
            batch = posts[i : i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(posts) + batch_size - 1) // batch_size
            print(f"  Translating batch {batch_num}/{total_batches} ({len(batch)} posts)...")

            # Fire all translations in this batch concurrently
            tasks = [
                _localize_post(
                    client,
                    post.get("original_title", ""),
                    post.get("original_body", ""),
                    post.get("source_lang", "en"),
                )
                for post in batch
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for post, result in zip(batch, results):
                if isinstance(result, Exception):
                    print(f"  ⚠ Translation failed for {post.get('id', '?')}: {result}")
                    post["translated_title"] = post.get("original_title", "")
                    post["translated_body"] = post.get("original_body", "")
                else:
                    post["translated_title"] = result[0]
                    post["translated_body"] = result[1]



    return posts


# ---------------------------------------------------------------------------
# Standalone execution (for testing / backward compat)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json

    async def _main():
        print("Loading raw global trends...")
        try:
            with open("raw_global_trends.json", "r", encoding="utf-8") as f:
                raw_data = json.load(f)
        except FileNotFoundError:
            print("Error: raw_global_trends.json not found. Run the scraper first!")
            return

        translated = await translate_posts(raw_data)

        with open("translated_global_trends.json", "w", encoding="utf-8") as f:
            json.dump(translated, f, ensure_ascii=False, indent=2)
        print(f"\nSuccess! Translated {len(translated)} posts.")

    asyncio.run(_main())