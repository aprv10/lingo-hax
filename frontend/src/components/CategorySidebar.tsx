"use client";

import { TrendUp, Sparkle, Tag } from "@phosphor-icons/react";
import type { Trend } from "@/lib/types";

interface CategorySidebarProps {
  trends: Trend[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  selectedTechFilter: string | null;
  onSelectTechFilter: (tech: string | null) => void;
}

export function CategorySidebar({
  trends,
  selectedCategory,
  onSelectCategory,
  selectedTechFilter,
  onSelectTechFilter,
}: CategorySidebarProps) {
  // Collect top 10 tech keywords across all trends
  const techCounts: Record<string, number> = {};
  for (const trend of trends) {
    for (const tech of trend.key_technologies) {
      techCounts[tech] = (techCounts[tech] || 0) + 1;
    }
  }
  const topTechs = Object.entries(techCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tech]) => tech);

  return (
    <aside className="category-sidebar">
      {/* Section label */}
      <p className="sidebar-label">SECTIONS</p>

      {/* Category list */}
      <nav className="sidebar-nav">
        {/* "All" option */}
        <button
          className={`sidebar-item ${selectedCategory === null ? "sidebar-item-active" : ""}`}
          onClick={() => onSelectCategory(null)}
        >
          <span className="sidebar-item-name">All</span>
          <span className="sidebar-item-count">
            {trends.reduce((sum, t) => sum + t.post_count, 0)}
          </span>
        </button>

        {trends.map((trend) => (
          <button
            key={trend.category}
            className={`sidebar-item ${
              selectedCategory === trend.category ? "sidebar-item-active" : ""
            }`}
            onClick={() => onSelectCategory(trend.category)}
          >
            <span className="sidebar-item-left">
              {trend.momentum === "rising" && (
                <TrendUp weight="bold" size={14} className="sidebar-icon-rising" />
              )}
              {trend.momentum === "new" && (
                <Sparkle weight="fill" size={14} className="sidebar-icon-new" />
              )}
              <span className="sidebar-item-name">{trend.category}</span>
            </span>
            <span className="sidebar-item-count">{trend.post_count}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Tech filters */}
      <p className="sidebar-label">KEY TECHNOLOGIES</p>
      <div className="sidebar-techs">
        {topTechs.map((tech) => {
          const isActive = selectedTechFilter === tech;
          return (
            <button
              key={tech}
              className={`sidebar-tech-pill ${isActive ? "sidebar-tech-active" : ""}`}
              onClick={() => onSelectTechFilter(isActive ? null : tech)}
            >
              <Tag
                weight={isActive ? "fill" : "regular"}
                size={12}
              />
              {tech}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .category-sidebar {
          width: 220px;
          flex-shrink: 0;
          padding: 0 20px 0 0;
          border-right: 1px solid var(--border);
          position: sticky;
          top: 24px;
          align-self: flex-start;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
        }

        .sidebar-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 10px;
          background: transparent;
          border: none;
          border-left: 3px solid transparent;
          color: var(--text-primary);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease;
          text-align: left;
        }

        .sidebar-item:hover {
          background: var(--bg-raised);
        }

        .sidebar-item-active {
          border-left-color: var(--accent);
          background: var(--bg-raised);
        }

        .sidebar-item-left {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .sidebar-item-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-icon-rising {
          color: var(--accent);
          flex-shrink: 0;
        }

        .sidebar-icon-new {
          color: var(--accent-new);
          flex-shrink: 0;
        }

        .sidebar-item-count {
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          color: var(--text-muted);
          flex-shrink: 0;
          margin-left: 8px;
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border);
          margin: 20px 0;
        }

        .sidebar-techs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .sidebar-tech-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .sidebar-tech-pill:hover {
          border-color: var(--accent);
          color: var(--text-primary);
        }

        .sidebar-tech-active {
          border-color: var(--accent);
          color: var(--accent);
          background: transparent;
        }

        /* Tablet: narrower */
        @media (max-width: 1024px) {
          .category-sidebar {
            width: 180px;
            padding-right: 16px;
          }

          .sidebar-item-name {
            font-size: 12px;
          }
        }

        /* Mobile: horizontal layout above feed */
        @media (max-width: 768px) {
          .category-sidebar {
            width: 100%;
            position: static;
            max-height: none;
            border-right: none;
            border-bottom: 1px solid var(--border);
            padding: 0 0 16px 0;
          }

          .sidebar-nav {
            flex-direction: row;
            overflow-x: auto;
            gap: 0;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }

          .sidebar-nav::-webkit-scrollbar {
            display: none;
          }

          .sidebar-item {
            border-left: none;
            border-bottom: 2px solid transparent;
            white-space: nowrap;
            padding: 8px 14px;
          }

          .sidebar-item-active {
            border-bottom-color: var(--accent);
            border-left-color: transparent;
          }

          .sidebar-divider {
            display: none;
          }

          .sidebar-label:last-of-type,
          .sidebar-techs {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
