"use client";

import { motion } from "framer-motion";
import { Lightbulb, Sparkle } from "@phosphor-icons/react";
import type { ProjectIdea } from "@/lib/types";
import s from "./BuildThisWeek.module.css";

// ── Helpers ──

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function isNew(generatedAt: string): boolean {
  return Date.now() - new Date(generatedAt).getTime() < TWO_HOURS_MS;
}

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: s.difficultyEasy,
  Medium: s.difficultyMedium,
  Hard: s.difficultyHard,
};

// ── Card ──

function IdeaCard({ idea, index }: { idea: ProjectIdea; index: number }) {
  const delay = index * 0.06;

  return (
    <motion.div
      className={s.card}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Top: title + NEW badge */}
      <div className={s.cardTop}>
        <h3 className={s.cardTitle}>{idea.title}</h3>
        {isNew(idea.generated_at) && (
          <span className={s.newBadge}>
            <Sparkle weight="fill" size={10} />
            NEW
          </span>
        )}
      </div>

      {/* Badges */}
      <div className={s.badges}>
        <span className={s.categoryBadge}>{idea.category}</span>
        <span className={`${s.difficultyBadge} ${DIFFICULTY_CLASS[idea.difficulty] || s.difficultyMedium}`}>
          {idea.difficulty}
        </span>
      </div>

      {/* One-liner */}
      <p className={s.oneLiner}>{idea.one_liner}</p>

      {/* Inspired by */}
      {idea.source_topics && idea.source_topics.length > 0 && (
        <div className={s.inspiredBy}>
          <p className={s.inspiredLabel}>Inspired by</p>
          <div className={s.inspiredTopics}>
            {idea.source_topics.slice(0, 3).map((topic, i) => (
              <span key={i} className={s.inspiredTopic} title={topic}>
                → {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Section ──

interface BuildThisWeekProps {
  ideas: ProjectIdea[];
}

export function BuildThisWeek({ ideas }: BuildThisWeekProps) {
  if (!ideas || ideas.length === 0) return null;

  return (
    <section id="build-this-week" className={s.section}>
      <motion.div
        className={s.header}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={s.heading}>Build This Week</h2>
        <p className={s.subheading}>
          Project ideas the English internet hasn't thought of yet
        </p>
      </motion.div>

      <div className={s.grid}>
        {ideas.map((idea, i) => (
          <IdeaCard key={`${idea.title}-${i}`} idea={idea} index={i} />
        ))}
      </div>
    </section>
  );
}
