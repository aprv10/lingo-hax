import asyncio
import json
import os
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
    get_velocity,
    save_trend_snapshot,
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

    # 1. Scrape all sources concurrently
    print("\n📡 Scraping...")
    all_posts = await scrape_all_sources()
    print(f"   Fetched {len(all_posts)} raw posts")

    # 2. Deduplicate against existing DB
    print("\n🔍 Deduplicating...")
    existing_ids = await get_existing_ids()
    new_posts = [p for p in all_posts if p["id"] not in existing_ids]
    print(f"   {len(new_posts)} new posts ({len(all_posts) - len(new_posts)} already in DB)")

    if not new_posts:
        print("\n✅ No new posts to process. Skipping translation & classification.")
    else:
        # 3. Translate only new posts
        print(f"\n🌐 Translating {len(new_posts)} new posts...")
        new_posts = await translate_posts(new_posts)

        # 4. Classify translated posts
        print(f"\n🧠 Classifying {len(new_posts)} posts...")
        new_posts = await classify_posts(new_posts)

        # 5. Save to database
        print("\n💾 Saving to database...")
        await bulk_insert_posts(new_posts)

    # 6. Calculate and save trend snapshots
    print("\n📊 Updating trend snapshots...")
    # Gather category stats from ALL posts (new + existing)
    category_posts: dict[str, list[dict]] = {}
    # Reload all enriched posts from the pipeline run for category grouping
    for post in all_posts:
        # For posts that weren't new, they may not have classification data yet
        # from this run — we'll use what's in the DB. For new posts, use in-memory.
        cat = post.get("category", "Other")
        category_posts.setdefault(cat, []).append(post)

    for cat, posts_in_cat in category_posts.items():
        sources = list(set(p.get("source", "") for p in posts_in_cat))
        await save_trend_snapshot(cat, len(posts_in_cat), sources)

    # 7. Export JSON
    print("\n📦 Exporting JSON...")
    await _export_trends_json(new_posts, all_posts)

    print(f"\n✅ Done. {len(new_posts)} posts added, {len(category_posts)} trends updated.")
    print("=" * 60 + "\n")


async def _export_trends_json(new_posts: list[dict], all_posts: list[dict]):
    """
    Export the enriched trends JSON in two formats:
    1. ./public/categorized_global_trends.json — enriched schema with trends wrapper
    2. ./categorized_global_trends.json — flat array for backward compat with frontend
    """
    # Group all posts by category
    category_groups: dict[str, list[dict]] = {}
    for post in all_posts:
        cat = post.get("category", "Other")
        category_groups.setdefault(cat, []).append(post)

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

        # Velocity
        velocity = await get_velocity(cat)

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
        "total_posts": len(all_posts),
        "trends": trends,
    }

    enriched_path = os.path.join(PUBLIC_DIR, "categorized_global_trends.json")
    with open(enriched_path, "w", encoding="utf-8") as f:
        json.dump(enriched_output, f, ensure_ascii=False, indent=2)
    print(f"   ✓ Enriched JSON → {enriched_path}")

    # Flat-array format → ./categorized_global_trends.json (backward compat)
    # Convert to the shape the existing frontend expects
    flat_posts = []
    for post in all_posts:
        flat_posts.append({
            # Original fields the frontend reads
            "source": post.get("source", ""),
            "original_lang": post.get("source_lang", "").upper(),
            "original_title": post.get("original_title", ""),
            "english_title": post.get("translated_title", post.get("original_title", "")),
            "english_body": post.get("translated_body", post.get("original_body", "")),
            "url": post.get("url", ""),
            "category": post.get("category", "Other"),
            # New fields (additive, won't break frontend)
            "key_technologies": post.get("key_technologies", []),
            "novelty_score": post.get("novelty_score", 5),
            "english_coverage": post.get("english_coverage", True),
            "score": post.get("score", 0),
        })

    flat_path = os.path.join(BACKEND_DIR, "categorized_global_trends.json")
    with open(flat_path, "w", encoding="utf-8") as f:
        json.dump(flat_posts, f, ensure_ascii=False, indent=2)
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
