"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowSquareOut } from "@phosphor-icons/react";
import type { Post, SourceLang } from "@/lib/types";
import { getLanguageFlag, getLanguageLabel } from "@/lib/types";

interface DetailPanelProps {
  post: Post | null;
  onClose: () => void;
}

export function DetailPanel({ post, onClose }: DetailPanelProps) {
  return (
    <aside className="detail-panel">
      <AnimatePresence mode="wait">
        {post ? (
          <motion.div
            key={post.id}
            className="detail-content"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Close button */}
            <button className="detail-close" onClick={onClose} aria-label="Close panel">
              <X weight="regular" size={18} />
            </button>

            {/* 1. Source badge */}
            <div className="detail-source-badge">
              <span>
                {getLanguageFlag(post.source_lang as SourceLang)}{" "}
                {post.source} · {getLanguageLabel(post.source_lang as SourceLang).split(" ").pop()}
              </span>
            </div>

            {/* 2. Original title */}
            <p className="detail-section-label">ORIGINAL</p>
            <h3 className="detail-title-original">{post.original_title}</h3>

            {/* 3. Divider with translator credit */}
            <div className="detail-divider">
              <span className="detail-divider-line" />
              <span className="detail-divider-text">TRANSLATED BY LINGO.DEV</span>
              <span className="detail-divider-line" />
            </div>

            {/* 4. Translated title */}
            <p className="detail-section-label">ENGLISH</p>
            <h3 className="detail-title-translated">{post.translated_title}</h3>

            {/* 5. Novelty score */}
            <div className="detail-novelty-section">
              <p className="detail-section-label">NOVELTY</p>
              <div className="detail-novelty-row">
                <span
                  className="detail-novelty-score"
                  style={{
                    color: post.novelty_score > 7 ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  {post.novelty_score}
                </span>
                <span className="detail-novelty-max">/10</span>
              </div>
              <p className="detail-novelty-sub">How new is this concept globally?</p>
            </div>

            {/* 6. Key technologies */}
            {post.key_technologies.length > 0 && (
              <div className="detail-techs">
                {post.key_technologies.map((tech) => (
                  <span key={tech} className="detail-tech-pill">
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* 7. Open source button */}
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-open-btn"
            >
              <ArrowSquareOut weight="regular" size={16} />
              OPEN SOURCE
            </a>

            {/* 8. No English coverage callout */}
            {!post.english_coverage && (
              <div className="detail-callout">
                <p>
                  This topic has no significant English-language coverage.
                  <br />
                  <strong>You are seeing it first.</strong>
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="detail-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="detail-empty-text">
              Select a post to read the original source.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .detail-panel {
          width: 280px;
          flex-shrink: 0;
          padding-left: 24px;
          border-left: 1px solid var(--border);
          position: sticky;
          top: 24px;
          align-self: flex-start;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
        }

        .detail-content {
          position: relative;
        }

        .detail-close {
          position: absolute;
          top: 0;
          right: 0;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          transition: color 150ms ease;
        }

        .detail-close:hover {
          color: var(--text-primary);
        }

        .detail-source-badge {
          display: inline-block;
          padding: 4px 12px;
          border: 1px solid var(--border);
          border-radius: 9999px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .detail-section-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .detail-title-original {
          font-family: var(--font-cormorant), serif;
          font-size: 20px;
          font-weight: 400;
          line-height: 1.35;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .detail-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .detail-divider-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .detail-divider-text {
          font-family: var(--font-dm-mono), monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .detail-title-translated {
          font-family: var(--font-cormorant), serif;
          font-size: 20px;
          font-weight: 400;
          line-height: 1.35;
          color: var(--text-primary);
          margin-bottom: 24px;
        }

        .detail-novelty-section {
          margin-bottom: 24px;
        }

        .detail-novelty-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
        }

        .detail-novelty-score {
          font-family: var(--font-dm-mono), monospace;
          font-size: 40px;
          font-weight: 400;
          line-height: 1;
        }

        .detail-novelty-max {
          font-family: var(--font-dm-mono), monospace;
          font-size: 16px;
          color: var(--text-muted);
        }

        .detail-novelty-sub {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          color: var(--text-muted);
        }

        .detail-techs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 24px;
        }

        .detail-tech-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid var(--border);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          color: var(--text-muted);
        }

        .detail-open-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-primary);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-decoration: none;
          cursor: pointer;
          transition: border-color 150ms ease, color 150ms ease;
          margin-bottom: 20px;
        }

        .detail-open-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .detail-callout {
          padding: 16px;
          background: var(--bg-raised);
          border-left: 3px solid var(--accent);
        }

        .detail-callout p {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          line-height: 1.55;
          color: var(--text-primary);
        }

        .detail-empty {
          padding: 40px 16px;
          text-align: center;
        }

        .detail-empty-text {
          font-family: var(--font-cormorant), serif;
          font-size: 18px;
          font-style: italic;
          color: var(--text-muted);
        }

        /* Tablet: narrower */
        @media (max-width: 1024px) {
          .detail-panel {
            width: 240px;
          }
        }

        /* Mobile: full-width overlay when post is selected */
        @media (max-width: 768px) {
          .detail-panel {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
