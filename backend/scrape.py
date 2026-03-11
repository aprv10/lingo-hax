import httpx
import asyncio
import hashlib
import json
from datetime import datetime, timezone

USER_AGENT = "GlobalArbitrageBot/2.0 (https://github.com/global-arbitrage)"
REQUEST_DELAY = 2  # seconds between requests per source


def _make_id(url: str) -> str:
    """Generate a deterministic ID from a URL."""
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _get_json(client: httpx.AsyncClient, url: str, **kwargs) -> dict | list | None:
    """GET request with error handling."""
    try:
        resp = await client.get(url, **kwargs)
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"  ⚠ GET {url} returned {resp.status_code}")
            return None
    except Exception as e:
        print(f"  ✗ GET {url} failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Existing sources (migrated to async httpx)
# ---------------------------------------------------------------------------

async def scrape_qiita(client: httpx.AsyncClient) -> list[dict]:
    """Qiita (Japan) — trending articles."""
    print("  → Qiita (Japan)")
    url = "https://qiita.com/api/v2/items?page=1&per_page=20"
    data = await _get_json(client, url)
    if not data:
        return []

    posts = []
    for item in data:
        post_url = item.get("url", "")
        posts.append({
            "id": _make_id(post_url),
            "source": "Qiita",
            "source_lang": "ja",
            "original_title": item.get("title", ""),
            "original_body": item.get("body", "")[:500],
            "url": post_url,
            "score": item.get("likes_count", 0),
            "scraped_at": _now_iso(),
        })
    await asyncio.sleep(REQUEST_DELAY)
    return posts


async def scrape_v2ex(client: httpx.AsyncClient) -> list[dict]:
    """V2EX (China) — hot topics."""
    print("  → V2EX (China)")
    url = "https://www.v2ex.com/api/topics/hot.json"
    data = await _get_json(client, url)
    if not data:
        return []

    posts = []
    for item in data:
        post_url = item.get("url", "")
        posts.append({
            "id": _make_id(post_url),
            "source": "V2EX",
            "source_lang": "zh",
            "original_title": item.get("title", ""),
            "original_body": item.get("content", "")[:500],
            "url": post_url,
            "score": item.get("replies", 0),
            "scraped_at": _now_iso(),
        })
    await asyncio.sleep(REQUEST_DELAY)
    return posts


async def scrape_reddit_programacion(client: httpx.AsyncClient) -> list[dict]:
    """Reddit r/programacion (Spanish)."""
    print("  → Reddit r/programacion (Spain/LatAm)")
    url = "https://www.reddit.com/r/programacion/hot.json?limit=20"
    data = await _get_json(client, url)
    if not data:
        return []

    children = data.get("data", {}).get("children", [])
    posts = []
    for post in children:
        item = post.get("data", {})
        if item.get("stickied"):
            continue
        post_url = f"https://reddit.com{item.get('permalink', '')}"
        posts.append({
            "id": _make_id(post_url),
            "source": "Reddit r/programacion",
            "source_lang": "es",
            "original_title": item.get("title", ""),
            "original_body": item.get("selftext", "")[:500],
            "url": post_url,
            "score": item.get("score", 0),
            "scraped_at": _now_iso(),
        })
    await asyncio.sleep(REQUEST_DELAY)
    return posts


# ---------------------------------------------------------------------------
# New sources
# ---------------------------------------------------------------------------

async def scrape_habr(client: httpx.AsyncClient) -> list[dict]:
    """Habr.com (Russian) — most-read articles."""
    print("  → Habr (Russia)")
    url = "https://habr.com/kek/v2/articles/most-reading/?fl=ru&hl=ru"
    data = await _get_json(client, url)
    if not data:
        return []

    articles = data.get("articleIds", [])
    articles_refs = data.get("articleRefs", {})

    posts = []
    for article_id in articles[:20]:
        item = articles_refs.get(str(article_id), {})
        post_url = f"https://habr.com/ru/articles/{article_id}/"
        title = item.get("titleHtml", "") or item.get("title", "")
        body = item.get("textFlat", "") or item.get("leadData", {}).get("textHtml", "")
        posts.append({
            "id": _make_id(post_url),
            "source": "Habr",
            "source_lang": "ru",
            "original_title": title[:300],
            "original_body": body[:500] if body else "",
            "url": post_url,
            "score": item.get("statistics", {}).get("score", 0),
            "scraped_at": _now_iso(),
        })
    await asyncio.sleep(REQUEST_DELAY)
    return posts


async def scrape_zenn(client: httpx.AsyncClient) -> list[dict]:
    """Zenn.dev (Japanese) — trending articles."""
    print("  → Zenn (Japan)")
    url = "https://zenn.dev/api/articles?order=trending"
    data = await _get_json(client, url)
    if not data:
        return []

    articles = data.get("articles", []) if isinstance(data, dict) else data
    posts = []
    for item in articles[:20]:
        path = item.get("path", "")
        post_url = f"https://zenn.dev{path}" if path else ""
        posts.append({
            "id": _make_id(post_url),
            "source": "Zenn",
            "source_lang": "ja",
            "original_title": item.get("title", ""),
            "original_body": f"[article depth: {item.get('body_letters_count', 0)} chars]",
            "url": post_url,
            "score": item.get("liked_count", 0),
            "scraped_at": _now_iso(),
        })
    await asyncio.sleep(REQUEST_DELAY)
    return posts


async def scrape_tabnews(client: httpx.AsyncClient) -> list[dict]:
    """TabNews.com.br (Brazilian Portuguese) — relevant content."""
    print("  → TabNews (Brazil)")
    url = "https://www.tabnews.com.br/api/v1/contents?strategy=relevant"
    data = await _get_json(client, url)
    if not data:
        return []

    posts = []
    for item in data[:20]:
        owner = item.get("owner_username", "")
        slug = item.get("slug", "")
        post_url = item.get("source_url") or f"https://www.tabnews.com.br/{owner}/{slug}"
        posts.append({
            "id": _make_id(post_url),
            "source": "TabNews",
            "source_lang": "pt",
            "original_title": item.get("title", ""),
            "original_body": item.get("body", "")[:500] if item.get("body") else "",
            "url": post_url,
            "score": item.get("tabcoins", 0),
            "scraped_at": _now_iso(),
        })
    await asyncio.sleep(REQUEST_DELAY)
    return posts


async def scrape_velog(client: httpx.AsyncClient) -> list[dict]:
    """Velog.io (Korean) — recent posts via GraphQL."""
    print("  → Velog (Korea)")
    graphql_url = "https://v2.velog.io/graphql"
    query = """{
        posts(cursor: "", limit: 20) {
            title
            short_description
            url_slug
            user { username }
            likes
        }
    }"""
    try:
        resp = await client.post(
            graphql_url,
            json={"query": query},
            headers={"Content-Type": "application/json"},
        )
        if resp.status_code != 200:
            print(f"  ⚠ Velog GraphQL returned {resp.status_code}")
            return []
        data = resp.json()
        if "errors" in data:
            print(f"  ⚠ Velog GraphQL error: {data['errors'][0]['message']}")
            return []
    except Exception as e:
        print(f"  ✗ Velog GraphQL failed: {e}")
        return []

    velog_posts = data.get("data", {}).get("posts", [])
    posts = []
    for item in velog_posts:
        username = item.get("user", {}).get("username", "")
        slug = item.get("url_slug", "")
        post_url = f"https://velog.io/@{username}/{slug}"
        posts.append({
            "id": _make_id(post_url),
            "source": "Velog",
            "source_lang": "ko",
            "original_title": item.get("title", ""),
            "original_body": (item.get("short_description") or "")[:500],
            "url": post_url,
            "score": item.get("likes", 0),
            "scraped_at": _now_iso(),
        })
    await asyncio.sleep(REQUEST_DELAY)
    return posts


# ---------------------------------------------------------------------------
# Public API — used by main.py
# ---------------------------------------------------------------------------

ALL_SCRAPERS = [
    scrape_qiita,
    scrape_v2ex,
    scrape_reddit_programacion,
    scrape_habr,
    scrape_zenn,
    scrape_tabnews,
    scrape_velog,
]


async def scrape_all_sources() -> list[dict]:
    """Run all scrapers concurrently and return a flat list of posts."""
    async with httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT},
        timeout=30.0,
        follow_redirects=True,
    ) as client:
        results = await asyncio.gather(
            *(fn(client) for fn in ALL_SCRAPERS),
            return_exceptions=True,
        )

    all_posts: list[dict] = []
    for result in results:
        if isinstance(result, Exception):
            print(f"  ✗ Scraper raised exception: {result}")
            continue
        all_posts.extend(result)

    return all_posts


# ---------------------------------------------------------------------------
# Standalone execution (for testing)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    async def _main():
        posts = await scrape_all_sources()
        with open("raw_global_trends.json", "w", encoding="utf-8") as f:
            json.dump(posts, f, ensure_ascii=False, indent=2)
        print(f"\nSuccess! Aggregated {len(posts)} posts from {len(ALL_SCRAPERS)} sources.")

    asyncio.run(_main())