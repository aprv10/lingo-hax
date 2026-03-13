import asyncio
import json
import os
import time
from datetime import datetime, timezone
from collections import Counter

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from scrape import scrape_all_sources
from translation import translate_posts
from brain import classify_posts
from database import (
    init_db,
    bulk_insert_posts,
    get_existing_ids,
    get_all_enriched_posts,
    get_velocity_batch,
    bulk_save_trend_snapshots,
)

# Ensure public/ directory exists for JSON export
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")
os.makedirs(PUBLIC_DIR, exist_ok=True)

# Also keep the flat-array export in backend/ for backward compat
BACKEND_DIR = os.path.dirname(__file__) or "."


async def run_pipeline():
    """Full pipeline: scrape → dedup → translate → classify → save → export."""
    print("\n" + "=" * 60)
    print(f"🚀 Pipeline started at {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    # 1. Scrape all sources concurrently (already parallel via asyncio.gather)
    print("\n📡 Scraping...")
    t0 = time.perf_counter()
    all_posts = await scrape_all_sources()
    t1 = time.perf_counter()
    print(f"   Fetched {len(all_posts)} raw posts in {t1 - t0:.2f}s")

    # 2. Deduplicate against existing DB — skip already-processed posts
    #    so they are NEVER re-translated or re-classified
    print("\n🔍 Deduplicating...")
    t2 = time.perf_counter()
    existing_ids = await get_existing_ids()
    new_posts = [p for p in all_posts if p["id"] not in existing_ids]
    t3 = time.perf_counter()
    print(f"   {len(new_posts)} new posts ({len(all_posts) - len(new_posts)} already in DB) in {t3 - t2:.2f}s")

    if not new_posts:
        print("\n✅ No new posts to process. Skipping translation & classification.")
    else:
        # 3. Translate only new posts (batch size 20, concurrent within batches)
        print(f"\n🌐 Translating {len(new_posts)} new posts...")
        t4 = time.perf_counter()
        new_posts = await translate_posts(new_posts)
        t5 = time.perf_counter()
        print(f"   Translation done in {t5 - t4:.2f}s")

        # 4. Classify translated posts (offline keyword matching, instant)
        print(f"\n🧠 Classifying {len(new_posts)} posts...")
        t6 = time.perf_counter()
        new_posts = await classify_posts(new_posts)
        t7 = time.perf_counter()
        print(f"   Classification done in {t7 - t6:.4f}s")

        # 5. Save to database (single executemany call)
        print("\n💾 Saving to database...")
        t8 = time.perf_counter()
        await bulk_insert_posts(new_posts)
        t9 = time.perf_counter()
        print(f"   DB write done in {t9 - t8:.4f}s")

    # 6. Load ALL enriched posts from DB (canonical source of truth)
    #    This fixes the stale-data bug where unclassified duplicates
    #    defaulted to "Other" and skewed trend counts.
    print("\n📊 Loading enriched posts from DB for trend generation...")
    t10 = time.perf_counter()
    db_posts = await get_all_enriched_posts()
    t11 = time.perf_counter()
    print(f"   {len(db_posts)} total posts in database (loaded in {t11 - t10:.4f}s)")

    # 7. Calculate and save trend snapshots (batched, single transaction)
    category_posts: dict[str, list[dict]] = {}
    for post in db_posts:
        cat = post.get("category", "Other")
        category_posts.setdefault(cat, []).append(post)

    snapshots = [
        (cat, len(posts_in_cat), list(set(p.get("source", "") for p in posts_in_cat)))
        for cat, posts_in_cat in category_posts.items()
    ]
    await bulk_save_trend_snapshots(snapshots)

    # 8. Export JSON (using DB-sourced data, async file I/O)
    print("\n📦 Exporting JSON...")
    await _export_trends_json(db_posts, category_posts)

    print(f"\n✅ Done. {len(new_posts)} posts added, {len(category_posts)} trends updated.")
    print("=" * 60 + "\n")


async def _export_trends_json(
    db_posts: list[dict],
    category_groups: dict[str, list[dict]],
):
    """
    Export the enriched trends JSON in two formats:
    1. ./public/categorized_global_trends.json — enriched schema with trends wrapper
    2. ./categorized_global_trends.json — flat array for backward compat with frontend
    """
    # Compute velocities for all categories in one DB connection
    categories = list(category_groups.keys())
    velocities = await get_velocity_batch(categories)

    trends = []
    for cat, posts_in_cat in category_groups.items():
        # Top 5 most frequent technologies across category
        tech_counter: Counter = Counter()
        for p in posts_in_cat:
            for tech in p.get("key_technologies", []):
                tech_counter[tech] += 1
        top_technologies = [t for t, _ in tech_counter.most_common(5)]

        # Unique sources
        sources = list(set(p.get("source", "") for p in posts_in_cat))

        # Hidden gem count
        hidden_gem_count = sum(
            1 for p in posts_in_cat if not p.get("english_coverage", True)
        )

        # Velocity (from batch lookup)
        velocity = velocities.get(cat, 0.0)

        # Top 10 posts by novelty_score desc
        sorted_posts = sorted(
            posts_in_cat,
            key=lambda p: p.get("novelty_score", 0),
            reverse=True,
        )[:10]

        trend_posts = []
        for p in sorted_posts:
            trend_posts.append({
                "id": p.get("id", ""),
                "source": p.get("source", ""),
                "source_lang": p.get("source_lang", ""),
                "original_title": p.get("original_title", ""),
                "translated_title": p.get("translated_title", ""),
                "url": p.get("url", ""),
                "score": p.get("score", 0),
                "key_technologies": p.get("key_technologies", []),
                "novelty_score": p.get("novelty_score", 5),
                "english_coverage": p.get("english_coverage", True),
            })

        trends.append({
            "category": cat,
            "post_count": len(posts_in_cat),
            "velocity": velocity if velocity != float("inf") else 9999,
            "key_technologies": top_technologies,
            "sources": sources,
            "hidden_gem_count": hidden_gem_count,
            "posts": trend_posts,
        })

    # Enriched format → ./public/
    enriched_output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_posts": len(db_posts),
        "trends": trends,
    }

    # Flat-array format → ./categorized_global_trends.json (backward compat)
    flat_posts = []
    for post in db_posts:
        flat_posts.append({
            "source": post.get("source", ""),
            "original_lang": post.get("source_lang", "").upper(),
            "original_title": post.get("original_title", ""),
            "english_title": post.get("translated_title", post.get("original_title", "")),
            "english_body": post.get("translated_body", post.get("original_body", "")),
            "url": post.get("url", ""),
            "category": post.get("category", "Other"),
            "key_technologies": post.get("key_technologies", []),
            "novelty_score": post.get("novelty_score", 5),
            "english_coverage": post.get("english_coverage", True),
            "score": post.get("score", 0),
        })

    # Write both files using asyncio.to_thread to avoid blocking the event loop
    enriched_path = os.path.join(PUBLIC_DIR, "categorized_global_trends.json")
    flat_path = os.path.join(BACKEND_DIR, "categorized_global_trends.json")

    def _write_enriched():
        with open(enriched_path, "w", encoding="utf-8") as f:
            json.dump(enriched_output, f, ensure_ascii=False, indent=2)

    def _write_flat():
        with open(flat_path, "w", encoding="utf-8") as f:
            json.dump(flat_posts, f, ensure_ascii=False, indent=2)

    await asyncio.gather(
        asyncio.to_thread(_write_enriched),
        asyncio.to_thread(_write_flat),
    )
    print(f"   ✓ Enriched JSON → {enriched_path}")
    print(f"   ✓ Flat JSON → {flat_path}")


def main():
    """Entry point: run pipeline immediately, then schedule every 30 minutes."""
    print("🌍 Global Arbitrage — Starting up...")

    # Create event loop and run init + first pipeline
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Initialize database
    loop.run_until_complete(init_db())

    # Run pipeline once immediately
    loop.run_until_complete(run_pipeline())

    # Schedule recurring runs
    scheduler = AsyncIOScheduler(event_loop=loop)
    scheduler.add_job(run_pipeline, "interval", minutes=30)
    scheduler.start()

    print("⏰ Scheduler active — pipeline will run every 30 minutes.")
    print("   Press Ctrl+C to stop.\n")

    try:
        loop.run_forever()
    except (KeyboardInterrupt, SystemExit):
        print("\n👋 Shutting down...")
        scheduler.shutdown()
        loop.close()


if __name__ == "__main__":
    main()
