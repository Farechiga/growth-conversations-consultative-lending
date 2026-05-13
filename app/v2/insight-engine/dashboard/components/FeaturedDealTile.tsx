"use client";

/*
 * Sprint 7a Block E — "Conversations that became deals" featured tile.
 * Sprint 7a-patch Block F — "ORIGINATING CAPTURE" → "FIRST MEMBER SIGNAL".
 * Each key insight now renders the matched canonical Pattern content
 * (REFRAME / IMPLICATION chip + day annotation + content text) instead
 * of an abstract Pattern label.
 *
 * Member name click routes through the synthetic-Member → fixture
 * helper (Block G) so the demo can drill into a representative arc.
 */

import { useEffect, useState } from "react";
import type { ClosedDeal, MemberType } from "@/lib/synthetic-data/types";
import { useFilterState } from "../hooks/use-filter-state";
import { MemberLink } from "./MemberLink";

const ROTATION_MS = 30_000;

export function FeaturedDealTile({ deals }: { deals: ClosedDeal[] }) {
  const featured = deals.filter((d) => d.is_featured && d.featured_narrative);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { toggleBanker } = useFilterState();

  useEffect(() => {
    if (paused || featured.length === 0) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % featured.length),
      ROTATION_MS,
    );
    return () => clearInterval(id);
  }, [paused, featured.length]);

  if (featured.length === 0) {
    return null;
  }

  const deal = featured[index]!;
  const n = deal.featured_narrative!;

  return (
    <section
      aria-label="Conversations that became deals"
      className="border-t border-blaze-rule bg-white px-8 py-5"
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
          Conversations that became deals
        </p>
        <div className="flex items-center gap-3 text-[11px] text-blaze-grey-body">
          <span>
            {n.rank} of {featured.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + featured.length) % featured.length)}
            className="text-blaze-orange-deep hover:underline"
            aria-label="Previous deal"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % featured.length)}
            className="text-blaze-orange-deep hover:underline"
            aria-label="Next deal"
          >
            ▶
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="text-blaze-orange-deep hover:underline"
            aria-label={paused ? "Resume rotation" : "Pause rotation"}
          >
            {paused ? "▶ play" : "⏸ pause"}
          </button>
        </div>
      </header>
      <div className="rounded border border-blaze-rule bg-blaze-cream/30 px-5 py-4">
        <p className="text-base font-semibold text-blaze-charcoal">
          <MemberLink
            name={deal.originating_member_name}
            memberType={deal.member_type as MemberType}
            className="text-blaze-charcoal hover:text-blaze-orange-deep hover:underline"
          />
          {" · "}
          <span className="text-blaze-orange-deep">{n.headline}</span>
        </p>
        <p className="mt-1 text-[12px] text-blaze-grey-body">{n.cycle_label}</p>
        <p className="mt-1 text-[11px] text-blaze-grey-soft">
          {deal.total_captures} captures · {deal.insights_authored} insights
        </p>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
            First member signal
          </p>
          <blockquote className="mt-1 border-l-[2px] border-blaze-orange/40 pl-3 text-sm italic leading-relaxed text-blaze-charcoal">
            &ldquo;{n.originating_quote}&rdquo;
          </blockquote>
          <p className="mt-1 text-[10px] text-blaze-grey-soft">
            — {n.originating_quote_speaker}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
            Key insights along the way
          </p>
          <ul className="mt-2 space-y-3 text-[13px] text-blaze-charcoal">
            {n.key_insights.map((ki, i) => (
              <li key={i} className="border-l-2 border-blaze-orange/30 pl-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.08em]">
                  <span className="rounded bg-blaze-charcoal/8 px-1.5 py-0.5 font-semibold text-blaze-charcoal">
                    {ki.type}
                  </span>
                  <span className="text-blaze-grey-soft">Day {ki.day}</span>
                  <span className="text-blaze-grey-soft">· {ki.pattern_id}</span>
                </div>
                <p className="mt-1.5 italic leading-relaxed text-blaze-charcoal">
                  &ldquo;{ki.content}&rdquo;
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
            Specialist coordination
          </p>
          <p className="mt-1 text-[12px] text-blaze-grey-body">{n.specialist_summary}</p>
        </div>

        <p className="mt-4 text-[11px] text-blaze-grey-soft">
          Originating banker:{" "}
          <button
            type="button"
            onClick={() => toggleBanker(deal.originating_banker_id)}
            className="font-medium text-blaze-orange-deep hover:underline"
          >
            {n.banker_name} ↗
          </button>
        </p>
      </div>
    </section>
  );
}
