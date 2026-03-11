import aiosqlite
import json
from datetime import datetime, timedelta, timezone

DB_PATH = "global_arbitrage.db"


async def init_db():
    """Create the database tables if they don't exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                source TEXT,
                source_lang TEXT,
                original_title TEXT,
                translated_title TEXT,
                translated_body TEXT,
                category TEXT,
                key_technologies TEXT,
                novelty_score REAL,
                english_coverage INTEGER,
                score INTEGER,
                url TEXT,
                scraped_at TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS trend_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT,
                snapshot_time TEXT,
                post_count INTEGER,
                sources TEXT
            )
        """)
        await db.commit()
    print("  ✓ Database initialized")


async def insert_post(post: dict):
    """Insert a post only if its id doesn't already exist (deduplication)."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT OR IGNORE INTO posts
               (id, source, source_lang, original_title, translated_title,
                translated_body, category, key_technologies, novelty_score,
                english_coverage, score, url, scraped_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                post["id"],
                post.get("source", ""),
                post.get("source_lang", ""),
                post.get("original_title", ""),
                post.get("translated_title", ""),
                post.get("translated_body", ""),
                post.get("category", "Other"),
                json.dumps(post.get("key_technologies", [])),
                post.get("novelty_score", 5),
                1 if post.get("english_coverage", True) else 0,
                post.get("score", 0),
                post.get("url", ""),
                post.get("scraped_at", ""),
            ),
        )
        await db.commit()


async def bulk_insert_posts(posts: list[dict]):
    """Insert multiple posts in a single transaction."""
    async with aiosqlite.connect(DB_PATH) as db:
        for post in posts:
            await db.execute(
                """INSERT OR IGNORE INTO posts
                   (id, source, source_lang, original_title, translated_title,
                    translated_body, category, key_technologies, novelty_score,
                    english_coverage, score, url, scraped_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    post["id"],
                    post.get("source", ""),
                    post.get("source_lang", ""),
                    post.get("original_title", ""),
                    post.get("translated_title", ""),
                    post.get("translated_body", ""),
                    post.get("category", "Other"),
                    json.dumps(post.get("key_technologies", [])),
                    post.get("novelty_score", 5),
                    1 if post.get("english_coverage", True) else 0,
                    post.get("score", 0),
                    post.get("url", ""),
                    post.get("scraped_at", ""),
                ),
            )
        await db.commit()


async def get_existing_ids() -> set[str]:
    """Return the set of all post IDs currently in the database."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id FROM posts")
        rows = await cursor.fetchall()
        return {row[0] for row in rows}


async def get_velocity(category: str) -> float:
    """
    Compute velocity for a category:
    ((posts in last 6h) - (posts in 6h-12h ago)) / max(posts in 6h-12h ago, 1) * 100

    Returns float('inf') if previous window had 0 posts (brand new trend).
    """
    now = datetime.now(timezone.utc)
    six_hours_ago = (now - timedelta(hours=6)).isoformat()
    twelve_hours_ago = (now - timedelta(hours=12)).isoformat()

    async with aiosqlite.connect(DB_PATH) as db:
        # Current window: last 6 hours
        cursor = await db.execute(
            "SELECT COUNT(*) FROM posts WHERE category = ? AND scraped_at >= ?",
            (category, six_hours_ago),
        )
        current = (await cursor.fetchone())[0]

        # Previous window: 6-12 hours ago
        cursor = await db.execute(
            "SELECT COUNT(*) FROM posts WHERE category = ? AND scraped_at >= ? AND scraped_at < ?",
            (category, twelve_hours_ago, six_hours_ago),
        )
        previous = (await cursor.fetchone())[0]

    if previous == 0 and current > 0:
        return float("inf")
    if previous == 0 and current == 0:
        return 0.0
    return ((current - previous) / max(previous, 1)) * 100


async def save_trend_snapshot(category: str, count: int, sources_list: list[str]):
    """Save a point-in-time snapshot for a trend category."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO trend_snapshots (category, snapshot_time, post_count, sources) VALUES (?, ?, ?, ?)",
            (
                category,
                datetime.now(timezone.utc).isoformat(),
                count,
                json.dumps(sources_list),
            ),
        )
        await db.commit()


async def get_all_trends() -> list[dict]:
    """
    Return a list of dicts:
    {category, post_count, velocity, sources, latest_posts (top 5 by score)}
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Get distinct categories
        cursor = await db.execute("SELECT DISTINCT category FROM posts")
        categories = [row[0] for row in await cursor.fetchall()]

        trends = []
        for cat in categories:
            # Count
            cursor = await db.execute(
                "SELECT COUNT(*) FROM posts WHERE category = ?", (cat,)
            )
            post_count = (await cursor.fetchone())[0]

            # Unique sources
            cursor = await db.execute(
                "SELECT DISTINCT source FROM posts WHERE category = ?", (cat,)
            )
            sources = [row[0] for row in await cursor.fetchall()]

            # Top 5 by score
            cursor = await db.execute(
                """SELECT id, source, source_lang, original_title, translated_title,
                          url, score, key_technologies, novelty_score, english_coverage
                   FROM posts WHERE category = ?
                   ORDER BY score DESC LIMIT 5""",
                (cat,),
            )
            rows = await cursor.fetchall()
            latest_posts = []
            for r in rows:
                latest_posts.append({
                    "id": r[0],
                    "source": r[1],
                    "source_lang": r[2],
                    "original_title": r[3],
                    "translated_title": r[4],
                    "url": r[5],
                    "score": r[6],
                    "key_technologies": json.loads(r[7]) if r[7] else [],
                    "novelty_score": r[8],
                    "english_coverage": bool(r[9]),
                })

            velocity = await get_velocity(cat)

            trends.append({
                "category": cat,
                "post_count": post_count,
                "velocity": velocity,
                "sources": sources,
                "latest_posts": latest_posts,
            })

        return trends
