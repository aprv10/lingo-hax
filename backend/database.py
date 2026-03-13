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
                secondary_category TEXT,
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
        # Add secondary_category column if upgrading from old schema
        try:
            await db.execute("ALTER TABLE posts ADD COLUMN secondary_category TEXT")
        except Exception:
            pass  # Column already exists
        await db.commit()
    print("  ✓ Database initialized")


async def bulk_insert_posts(posts: list[dict]):
    """Insert multiple posts in a single transaction using executemany."""
    if not posts:
        return
    rows = [
        (
            post["id"],
            post.get("source", ""),
            post.get("source_lang", ""),
            post.get("original_title", ""),
            post.get("translated_title", ""),
            post.get("translated_body", ""),
            post.get("category", "Other"),
            post.get("secondary_category"),
            json.dumps(post.get("key_technologies", [])),
            post.get("novelty_score", 5),
            1 if post.get("english_coverage", True) else 0,
            post.get("score", 0),
            post.get("url", ""),
            post.get("scraped_at", ""),
        )
        for post in posts
    ]
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executemany(
            """INSERT OR IGNORE INTO posts
               (id, source, source_lang, original_title, translated_title,
                translated_body, category, secondary_category, key_technologies,
                novelty_score, english_coverage, score, url, scraped_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            rows,
        )
        await db.commit()


async def get_existing_ids() -> set[str]:
    """Return the set of all post IDs currently in the database."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("SELECT id FROM posts")
        rows = await cursor.fetchall()
        return {row[0] for row in rows}


async def bulk_save_trend_snapshots(snapshots: list[tuple[str, int, list[str]]]):
    """Save multiple trend snapshots in a single transaction.

    Each snapshot is a tuple: (category, post_count, sources_list).
    """
    if not snapshots:
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    rows = [
        (cat, now_iso, count, json.dumps(sources))
        for cat, count, sources in snapshots
    ]
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executemany(
            """INSERT INTO trend_snapshots
               (category, snapshot_time, post_count, sources)
               VALUES (?, ?, ?, ?)""",
            rows,
        )
        await db.commit()


# Keep the single-call version for backward compat
async def save_trend_snapshot(category: str, count: int, sources_list: list[str]):
    """Save a single trend snapshot (delegates to bulk version)."""
    await bulk_save_trend_snapshots([(category, count, sources_list)])


async def get_velocity_batch(categories: list[str]) -> dict[str, float]:
    """Compute velocity for multiple categories in a single DB connection.

    Returns dict of category → velocity.
    """
    now = datetime.now(timezone.utc)
    six_hours_ago = (now - timedelta(hours=6)).isoformat()
    twelve_hours_ago = (now - timedelta(hours=12)).isoformat()

    velocities: dict[str, float] = {}
    async with aiosqlite.connect(DB_PATH) as db:
        for cat in categories:
            cursor = await db.execute(
                "SELECT COUNT(*) FROM posts WHERE category = ? AND scraped_at >= ?",
                (cat, six_hours_ago),
            )
            current = (await cursor.fetchone())[0]

            cursor = await db.execute(
                "SELECT COUNT(*) FROM posts WHERE category = ? AND scraped_at >= ? AND scraped_at < ?",
                (cat, twelve_hours_ago, six_hours_ago),
            )
            previous = (await cursor.fetchone())[0]

            if previous == 0 and current > 0:
                velocities[cat] = float("inf")
            elif previous == 0 and current == 0:
                velocities[cat] = 0.0
            else:
                velocities[cat] = ((current - previous) / max(previous, 1)) * 100

    return velocities


# Keep single-call version for backward compat
async def get_velocity(category: str) -> float:
    """Compute velocity for a single category."""
    result = await get_velocity_batch([category])
    return result.get(category, 0.0)


async def get_all_enriched_posts() -> list[dict]:
    """Return all posts from the DB with their enriched fields.

    Used by main.py to build trend exports from canonical DB data
    instead of stale in-memory scraped data.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """SELECT id, source, source_lang, original_title, translated_title,
                      translated_body, category, secondary_category, key_technologies,
                      novelty_score, english_coverage, score, url, scraped_at
               FROM posts"""
        )
        rows = await cursor.fetchall()

    return [
        {
            "id": r[0],
            "source": r[1],
            "source_lang": r[2],
            "original_title": r[3],
            "translated_title": r[4],
            "translated_body": r[5],
            "category": r[6] or "Other",
            "secondary_category": r[7],
            "key_technologies": json.loads(r[8]) if r[8] else [],
            "novelty_score": r[9] if r[9] is not None else 5,
            "english_coverage": bool(r[10]),
            "score": r[11] or 0,
            "url": r[12] or "",
            "scraped_at": r[13] or "",
        }
        for r in rows
    ]


async def get_all_trends() -> list[dict]:
    """Return a list of trend dicts using efficient batched queries."""
    async with aiosqlite.connect(DB_PATH) as db:
        # Get category counts + sources in bulk
        cursor = await db.execute(
            "SELECT category, COUNT(*), GROUP_CONCAT(DISTINCT source) FROM posts GROUP BY category"
        )
        cat_rows = await cursor.fetchall()

        categories = [row[0] for row in cat_rows]

        # Get top 5 posts per category
        trends = []
        for row in cat_rows:
            cat, post_count, sources_str = row
            sources = sources_str.split(",") if sources_str else []

            cursor = await db.execute(
                """SELECT id, source, source_lang, original_title, translated_title,
                          url, score, key_technologies, novelty_score, english_coverage
                   FROM posts WHERE category = ?
                   ORDER BY score DESC LIMIT 5""",
                (cat,),
            )
            post_rows = await cursor.fetchall()
            latest_posts = [
                {
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
                }
                for r in post_rows
            ]

            trends.append({
                "category": cat,
                "post_count": post_count,
                "sources": sources,
                "latest_posts": latest_posts,
            })

    # Velocity in a single separate connection
    velocities = await get_velocity_batch(categories)
    for trend in trends:
        trend["velocity"] = velocities.get(trend["category"], 0.0)

    return trends
