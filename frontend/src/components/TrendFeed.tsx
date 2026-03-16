"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendUp, TrendDown, Sparkle } from "@phosphor-icons/react";
import type { Trend, Post } from "@/lib/types";
import { LANGUAGE_COLORS } from "@/lib/constants";
import { PostRow } from "@/components/PostRow";

interface TrendFeedProps {
  trends: Trend[];
  selectedCategory: string | null;
  selectedTechFilter: string | null;
  selectedPost: Post | null;
  onSelectPost: (post: Post) => void;
}

function MomentumBadge({ momentum }: { momentum: string }) {
  if (momentum === "rising") {
    return (
      <span className="momentum-badge momentum-rising">
        <TrendUp weight="bold" size={14} />
        RISING
      </span>
    );
  }
  if (momentum === "new") {
    return (
      <span className="momentum-badge momentum-new">
        <Sparkle weight="fill" size={14} />
        NEW
      </span>
    );
  }
  return (
    <span className="momentum-badge momentum-falling">
      <TrendDown weight="bold" size={14} />
      FALLING
    </span>
  );
}

function VelocityBadge({ velocity, momentum }: { velocity: number; momentum: string }) {
  const isRising = momentum === "rising" || momentum === "new";
  const display = velocity === Infinity || !isFinite(velocity) ? "∞" : `+${velocity}%`;
  return (
    <span
      className="pill"
      style={{
        background: isRising ? "var(--accent)" : "var(--accent-fall)",
        color: "#fff",
        fontSize: 11,
        padding: "3px 10px",
      }}
    >
      {display}
    </span>
  );
}

function LanguageBar({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((s, n) => s + n, 0);
  if (total === 0) return null;

  const segments = Object.entries(breakdown).map(([lang, count]) => ({
    lang,
    count,
    pct: (count / total) * 100,
    color: LANGUAGE_COLORS[lang] || "#7A6E62",
  }));

  return (
    <div className="lang-bar-wrapper">
      <div className="lang-bar">
        {segments.map((seg) => (
          <motion.div
            key={seg.lang}
            className="lang-bar-segment"
            style={{ background: seg.color }}
            initial={{ width: 0 }}
            animate={{ width: `${seg.pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            title={`${seg.lang.toUpperCase()}: ${seg.count} posts`}
          />
        ))}
      </div>
    </div>
  );
}

export function TrendFeed({
  trends,
  selectedCategory,
  selectedTechFilter,
  selectedPost,
  onSelectPost,
}: TrendFeedProps) {
  // Filter trends by selected category
  const filteredTrends = useMemo(() => {
    if (!selectedCategory) return trends;
    return trends.filter((t) => t.category === selectedCategory);
  }, [trends, selectedCategory]);

  // For each trend, filter posts by tech filter
  const trendsWithFilteredPosts = useMemo(() => {
    if (!selectedTechFilter) return filteredTrends;
    return filteredTrends
      .map((t) => ({
        ...t,
        posts: t.posts.filter((p) =>
          p.key_technologies.some(
            (tech) => tech.toLowerCase() === selectedTechFilter.toLowerCase()
          )
        ),
      }))
      .filter((t) => t.posts.length > 0);
  }, [filteredTrends, selectedTechFilter]);

  // Global post index counter for stagger across all sections
  let globalPostIndex = 0;

  if (trendsWithFilteredPosts.length === 0) {
    return (
      <div className="feed-empty">
        <p className="feed-empty-text">No matching trends found.</p>
        <style jsx>{`
          .feed-empty {
            flex: 1;
            padding: 80px 20px;
            text-align: center;
          }
          .feed-empty-text {
            font-family: var(--font-cormorant), serif;
            font-size: 22px;
            font-style: italic;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="trend-feed">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedCategory || "all"}-${selectedTechFilter || "none"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {trendsWithFilteredPosts.map((trend, trendIdx) => {
            return (
              <div key={trend.category} className="trend-section">
                {/* Trend header row — animated */}
                <motion.div
                  className="trend-header"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: trendIdx * 0.08,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  <div className="trend-header-top">
                    <h2 className="trend-category">{trend.category}</h2>
                    <div className="trend-header-badges">
                      <VelocityBadge velocity={trend.velocity} momentum={trend.momentum || "new"} />
                      <MomentumBadge momentum={trend.momentum || "new"} />
                    </div>
                  </div>
                  <LanguageBar breakdown={trend.language_breakdown} />
                  <div className="trend-header-rule" />
                </motion.div>

                {/* Post rows with stagger */}
                {trend.posts.map((post) => {
                  const idx = globalPostIndex++;
                  return (
                    <PostRow
                      key={post.id}
                      post={post}
                      index={idx}
                      isSelected={selectedPost?.id === post.id}
                      onSelect={onSelectPost}
                    />
                  );
                })}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <style jsx>{`
        .trend-feed {
          flex: 1;
          min-width: 0;
          padding: 0 24px;
        }

        .trend-section {
          margin-bottom: 40px;
        }

        .trend-header {
          margin-bottom: 8px;
        }

        .trend-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .trend-category {
          font-family: var(--font-cormorant), serif;
          font-size: 32px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .trend-header-badges {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .trend-header-rule {
          height: 1px;
          background: var(--border);
          margin-top: 12px;
        }

        @media (max-width: 768px) {
          .trend-feed {
            padding: 0 8px;
          }

          .trend-category {
            font-size: 24px;
          }

          .trend-header-top {
            gap: 8px;
          }
        }
      `}</style>

      <style jsx global>{`
        .momentum-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          letter-spacing: 0.05em;
        }

        .momentum-rising {
          color: var(--accent);
        }

        .momentum-new {
          color: var(--accent-new);
        }

        .momentum-falling {
          color: var(--accent-fall);
        }

        .lang-bar-wrapper {
          margin-top: 4px;
        }

        .lang-bar {
          display: flex;
          height: 4px;
          overflow: hidden;
          gap: 2px;
        }

        .lang-bar-segment {
          min-width: 4px;
        }
      `}</style>
    </div>
  );
}
