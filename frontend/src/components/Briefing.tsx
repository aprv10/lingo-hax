"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendUp,
  TrendDown,
  Sparkle,
  Tag,
  ArrowRight,
  ArrowSquareOut,
  X,
} from "@phosphor-icons/react";
import type { GlobalTrendsData, Trend, Post, SourceLang } from "@/lib/types";
import { getLanguageFlag, getLanguageLabel, LANGUAGE_MAP } from "@/lib/types";
import s from "./Briefing.module.css";

// ── Language bar colors (per spec) ──
const LANG_COLORS: Record<string, string> = {
  ja: "#E85D3A",
  zh: "#D4A843",
  ru: "#5B8DD9",
  pt: "#4CAF7D",
  ko: "#9B6DD6",
  de: "#E06B8B",
  es: "#F0944D",
};

// ── Time helpers ──
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ═════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════

// ── Sidebar ──
function Sidebar({
  trends,
  selectedCategory,
  onSelectCategory,
  selectedTechFilter,
  onSelectTechFilter,
  topTechs,
}: {
  trends: Trend[];
  selectedCategory: string | null;
  onSelectCategory: (c: string | null) => void;
  selectedTechFilter: string | null;
  onSelectTechFilter: (t: string | null) => void;
  topTechs: string[];
}) {
  const totalPosts = trends.reduce((n, t) => n + t.post_count, 0);

  return (
    <aside className={s.sidebar}>
      <p className={s.sidebarLabel}>SECTIONS</p>
      <nav className={s.catNav}>
        {/* All */}
        <button
          className={`${s.catItem} ${selectedCategory === null ? s.catItemActive : ""}`}
          onClick={() => onSelectCategory(null)}
        >
          <span className={s.catName}>All</span>
          <span className={s.catCount}>{totalPosts}</span>
        </button>
        {trends.map((t) => (
          <button
            key={t.category}
            className={`${s.catItem} ${selectedCategory === t.category ? s.catItemActive : ""}`}
            onClick={() => onSelectCategory(t.category)}
          >
            <span className={s.catLeft}>
              {t.momentum === "rising" && <TrendUp weight="bold" size={14} className={s.iconRising} />}
              {t.momentum === "new" && <Sparkle weight="fill" size={14} className={s.iconNew} />}
              <span className={s.catName}>{t.category}</span>
            </span>
            <span className={s.catCount}>{t.post_count}</span>
          </button>
        ))}
      </nav>

      <div className={s.sidebarRule} />

      <div className={s.techSection}>
        <p className={s.sidebarLabel}>KEY TECHNOLOGIES</p>
        <div className={s.techPills}>
          {topTechs.map((tech) => {
            const active = selectedTechFilter === tech;
            return (
              <button
                key={tech}
                className={`${s.techPill} ${active ? s.techPillActive : ""}`}
                onClick={() => onSelectTechFilter(active ? null : tech)}
              >
                <Tag weight={active ? "fill" : "regular"} size={12} />
                {tech}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

// ── Language Bar ──
function LanguageBar({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const segs = Object.entries(breakdown).map(([lang, count]) => ({
    lang,
    count,
    pct: (count / total) * 100,
    color: LANG_COLORS[lang] || "#7A6E62",
    label: LANGUAGE_MAP[lang as SourceLang]
      ? `${LANGUAGE_MAP[lang as SourceLang].flag} ${LANGUAGE_MAP[lang as SourceLang].label}`
      : lang,
  }));

  return (
    <div className={s.langBarWrap}>
      <div className={s.langBar}>
        {segs.map((seg) => (
          <motion.div
            key={seg.lang}
            className={s.langSeg}
            style={{ background: seg.color }}
            initial={{ width: 0 }}
            animate={{ width: `${seg.pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>
      <div className={s.langLabels}>
        {segs.map((seg) => (
          <span key={seg.lang} className={s.langLabel}>
            {seg.label} {seg.count}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Post Row ──
function PostRow({
  post,
  index,
  isSelected,
  onSelect,
}: {
  post: Post;
  index: number;
  isSelected: boolean;
  onSelect: (p: Post) => void;
}) {
  const flag = getLanguageFlag(post.source_lang as SourceLang);
  const noveltyColor =
    post.novelty_score >= 8
      ? "var(--accent)"
      : post.novelty_score >= 6
      ? "var(--text-primary)"
      : "var(--text-muted)";

  const delay = Math.min(index, 15) * 0.03;
  const visibleTechs = post.key_technologies.slice(0, 4);
  const moreTechs = post.key_technologies.length - 4;

  return (
    <motion.div
      className={`${s.postRow} ${isSelected ? s.postRowSelected : ""}`}
      onClick={() => onSelect(post)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.12 + delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Col 1: novelty */}
      <div className={s.postNoveltyCol}>
        <div className={s.postNoveltyNum} style={{ color: noveltyColor }}>
          {post.novelty_score}
        </div>
        <div className={s.postNoveltyLabel}>NOVELTY</div>
      </div>

      {/* Col 2: content */}
      <div className={s.postContent}>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className={s.postTitleLink}
          onClick={(e) => e.stopPropagation()}
        >
          <span className={s.postTitle}>{post.translated_title}</span>
          <ArrowSquareOut weight="regular" size={14} className={s.postExternalIcon} />
        </a>
        <p className={s.postMeta}>
          {flag} {post.source} · {timeAgo(post.scraped_at)}
        </p>
        {visibleTechs.length > 0 && (
          <div className={s.postTechs}>
            {visibleTechs.map((t) => (
              <span key={t} className={s.postTechPill}>{t}</span>
            ))}
            {moreTechs > 0 && (
              <span className={s.postMoreTechs}>+{moreTechs} more</span>
            )}
          </div>
        )}
      </div>

      {/* Col 3: coverage */}
      <div className={s.postCoverageCol}>
        {!post.english_coverage && (
          <motion.span
            className={s.coverageBadge}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: [0.95, 1.04, 1], opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 + delay }}
          >
            NOT IN ENGLISH YET
          </motion.span>
        )}
      </div>

      {/* Col 4: arrow */}
      <div className={s.postArrowCol}>
        <ArrowRight weight="regular" size={16} />
      </div>
    </motion.div>
  );
}

// ── Detail Panel contents ──
function DetailContent({ post, onClose }: { post: Post; onClose: () => void }) {
  const flag = getLanguageFlag(post.source_lang as SourceLang);
  const langName = getLanguageLabel(post.source_lang as SourceLang).split(" ").pop();

  return (
    <motion.div
      key={post.id}
      className={s.detailContent}
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <button className={s.detailClose} onClick={onClose} aria-label="Close">
        <X weight="regular" size={18} />
      </button>

      {/* 1. Source badge */}
      <div className={s.detailSourceBadge}>
        {flag} {post.source} · {langName}
      </div>

      {/* 2. Original */}
      <p className={s.detailLabel}>ORIGINAL</p>
      <h3 className={s.detailOriginalTitle}>{post.original_title}</h3>

      {/* 3. Divider */}
      <div className={s.detailDivider}>
        <span className={s.detailDividerLine} />
        <span className={s.detailDividerText}>TRANSLATED BY LINGO.DEV</span>
        <span className={s.detailDividerLine} />
      </div>

      {/* 4. Translated */}
      <p className={s.detailLabel}>ENGLISH</p>
      <h3 className={s.detailTranslatedTitle}>{post.translated_title}</h3>

      {/* 5. Novelty */}
      <div className={s.detailNoveltySection}>
        <p className={s.detailLabel}>NOVELTY</p>
        <div className={s.detailNoveltyRow}>
          <span
            className={s.detailNoveltyScore}
            style={{ color: post.novelty_score >= 8 ? "var(--accent)" : "var(--text-primary)" }}
          >
            {post.novelty_score}
          </span>
          <span className={s.detailNoveltyMax}>/10</span>
        </div>
        <p className={s.detailNoveltySub}>How new is this concept globally?</p>
      </div>

      {/* 6. Tech pills */}
      {post.key_technologies.length > 0 && (
        <div className={s.detailTechs}>
          {post.key_technologies.map((t) => (
            <span key={t} className={s.detailTechPill}>{t}</span>
          ))}
        </div>
      )}

      {/* 7. Open source button */}
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className={s.detailOpenBtn}
      >
        <ArrowSquareOut weight="regular" size={16} />
        OPEN SOURCE
      </a>

      {/* 8. No English callout */}
      {!post.english_coverage && (
        <div className={s.detailCallout}>
          <p className={s.detailCalloutText}>
            This topic has no significant English-language coverage.
            <br />
            <strong>You are seeing it first.</strong>
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ═════════════════════════════════════
// MAIN BRIEFING COMPONENT
// ═════════════════════════════════════

interface BriefingProps {
  data: GlobalTrendsData;
}

export function Briefing({ data }: BriefingProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedTechFilter, setSelectedTechFilter] = useState<string | null>(null);

  // Top 10 technologies
  const topTechs = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of data.trends) {
      for (const tech of t.key_technologies) {
        counts[tech] = (counts[tech] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t);
  }, [data.trends]);

  // Filtered trends
  const filteredTrends = useMemo(() => {
    let filtered = data.trends;
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    if (selectedTechFilter) {
      filtered = filtered
        .map((t) => ({
          ...t,
          posts: t.posts.filter((p) =>
            p.key_technologies.some((k) => k.toLowerCase() === selectedTechFilter.toLowerCase())
          ),
        }))
        .filter((t) => t.posts.length > 0);
    }
    return filtered;
  }, [data.trends, selectedCategory, selectedTechFilter]);

  // Global post index for stagger
  let globalIdx = 0;

  return (
    <section id="briefing" className={s.wrapper}>
      <div className={s.grid}>
        {/* ── LEFT SIDEBAR ── */}
        <Sidebar
          trends={data.trends}
          selectedCategory={selectedCategory}
          onSelectCategory={(c) => {
            setSelectedCategory(c);
            setSelectedPost(null);
          }}
          selectedTechFilter={selectedTechFilter}
          onSelectTechFilter={setSelectedTechFilter}
          topTechs={topTechs}
        />

        {/* ── CENTER FEED ── */}
        <div className={s.feed}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory || "all"}-${selectedTechFilter || "none"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filteredTrends.length === 0 ? (
                <div className={s.feedEmpty}>
                  <p className={s.feedEmptyText}>No signals found for this filter.</p>
                </div>
              ) : (
                filteredTrends.map((trend, trendIdx) => {
                  const trendMomentum = trend.momentum || "new";
                  const isRising = trendMomentum === "rising" || trendMomentum === "new";
                  return (
                    <div key={trend.category} className={s.trendSection}>
                      {/* Trend Header */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: trendIdx * 0.06 }}
                      >
                        <div className={s.trendHeaderTop}>
                          <h2 className={s.trendCategory}>{trend.category}</h2>
                          <div className={s.trendBadges}>
                            <span className={`${s.velocityPill} ${isRising ? s.velocityRising : s.velocityFalling}`}>
                              {!isFinite(trend.velocity) ? "∞" : `+${trend.velocity}%`}
                            </span>
                            <span
                              className={`${s.momentumBadge} ${
                                trendMomentum === "rising"
                                  ? s.momentumRising
                                  : trendMomentum === "new"
                                  ? s.momentumNew
                                  : s.momentumFalling
                              }`}
                            >
                              {trendMomentum === "rising" && <TrendUp weight="bold" size={14} />}
                              {trendMomentum === "new" && <Sparkle weight="fill" size={14} />}
                              {trendMomentum === "falling" && <TrendDown weight="bold" size={14} />}
                              {trendMomentum.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <LanguageBar breakdown={trend.language_breakdown} />
                        <div className={s.trendRule} />
                      </motion.div>

                      {/* Posts */}
                      {trend.posts.map((post) => {
                        const idx = globalIdx++;
                        return (
                          <PostRow
                            key={post.id}
                            post={post}
                            index={idx}
                            isSelected={selectedPost?.id === post.id}
                            onSelect={setSelectedPost}
                          />
                        );
                      })}
                    </div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT DETAIL PANEL (desktop) ── */}
        <div className={s.detail}>
          <AnimatePresence mode="wait">
            {selectedPost ? (
              <DetailContent
                key={selectedPost.id}
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
              />
            ) : (
              <motion.div
                key="empty"
                className={s.detailEmpty}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <p className={s.detailEmptyText}>
                  Select a post to read the original source.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Sheet (tablet) ── */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div
              className={s.bottomSheetOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
            />
            <motion.div
              className={s.bottomSheet}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <DetailContent post={selectedPost} onClose={() => setSelectedPost(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
