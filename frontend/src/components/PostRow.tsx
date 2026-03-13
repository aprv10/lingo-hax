"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowSquareOut } from "@phosphor-icons/react";
import type { Post, SourceLang } from "@/lib/types";
import { getLanguageFlag } from "@/lib/types";

interface PostRowProps {
  post: Post;
  index: number;
  isSelected: boolean;
  onSelect: (post: Post) => void;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PostRow({ post, index, isSelected, onSelect }: PostRowProps) {
  const flag = getLanguageFlag(post.source_lang as SourceLang);
  const noveltyColor =
    post.novelty_score > 7
      ? "var(--accent)"
      : post.novelty_score <= 5
      ? "var(--text-muted)"
      : "var(--text-primary)";

  // Stagger delay: 30ms per row, max 15 rows = 450ms
  const staggerDelay = Math.min(index, 15) * 0.03;

  return (
    <motion.div
      className={`post-row ${isSelected ? "post-row-selected" : ""}`}
      onClick={() => onSelect(post)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.15 + staggerDelay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {/* Col 1: Novelty score */}
      <div className="post-novelty" style={{ color: noveltyColor }}>
        {post.novelty_score}
      </div>

      {/* Col 2: Title + meta + tech pills */}
      <div className="post-content">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="post-title-link"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="post-title">{post.translated_title}</span>
          <ArrowSquareOut weight="regular" size={14} className="post-external-icon" />
        </a>
        <p className="post-meta">
          {flag} {post.source} · {timeAgo(post.scraped_at)}
        </p>
        {post.key_technologies.length > 0 && (
          <div className="post-techs">
            {post.key_technologies.map((tech) => (
              <span key={tech} className="post-tech-pill">
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Col 3: "NOT IN ENGLISH YET" badge */}
      <div className="post-coverage">
        {!post.english_coverage && (
          <motion.span
            className="post-coverage-badge"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: [0.95, 1.04, 1], opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + staggerDelay }}
          >
            NOT IN ENGLISH YET
          </motion.span>
        )}
      </div>

      {/* Col 4: Arrow */}
      <div className="post-arrow">
        <ArrowRight weight="regular" size={16} />
      </div>

      <style jsx>{`
        .post-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 12px;
          border-bottom: 1px solid var(--border);
          border-left: 2px solid transparent;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease;
        }

        .post-row:hover {
          background: var(--bg-raised);
        }

        .post-row-selected {
          border-left-color: var(--accent);
          background: var(--bg-raised);
        }

        .post-novelty {
          width: 48px;
          flex-shrink: 0;
          font-family: var(--font-dm-mono), monospace;
          font-size: 28px;
          font-weight: 400;
          line-height: 1;
          padding-top: 2px;
          text-align: center;
        }

        .post-content {
          flex: 1;
          min-width: 0;
        }

        .post-title-link {
          display: inline;
          text-decoration: none;
          color: var(--text-primary);
        }

        .post-title {
          font-family: var(--font-cormorant), serif;
          font-size: 20px;
          font-weight: 400;
          line-height: 1.3;
        }

        .post-external-icon {
          display: none;
          margin-left: 6px;
          vertical-align: middle;
          color: var(--text-muted);
        }

        .post-title-link:hover .post-external-icon {
          display: inline;
        }

        .post-meta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 6px;
          letter-spacing: 0.02em;
        }

        .post-techs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 8px;
        }

        .post-tech-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          border: 1px solid var(--border);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .post-coverage {
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding-top: 4px;
        }

        .post-coverage-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          background: var(--accent);
          color: #ffffff;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .post-arrow {
          width: 32px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: 6px;
          color: var(--text-muted);
          transition: color 150ms ease, transform 150ms ease;
        }

        .post-row:hover .post-arrow {
          color: var(--accent);
          transform: translateX(2px);
        }

        /* Responsive: hide badge + arrow on mobile */
        @media (max-width: 768px) {
          .post-coverage {
            display: none;
          }
          .post-arrow {
            display: none;
          }
          .post-novelty {
            width: 36px;
            font-size: 22px;
          }
          .post-title {
            font-size: 17px;
          }
        }
      `}</style>
    </motion.div>
  );
}
