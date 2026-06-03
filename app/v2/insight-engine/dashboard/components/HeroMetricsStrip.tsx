"use client";

/*
 * Sprint 7a Block C — hero metrics strip.
 *
 * Six metric cards per Stage 5 §1.1. Sparklines on conversations,
 * insights, and closures. Pipeline-value face/weighted toggle.
 * Filter-responsive — receives scoped metrics from parent.
 */

import { useFilterState } from "../hooks/use-filter-state";
import type { ScopedMetrics } from "@/lib/synthetic-data/filters";

export function HeroMetricsStrip({
  metrics,
  filterDescription,
}: {
  metrics: ScopedMetrics;
  filterDescription: string;
}) {
  const { state, togglePipelineWeighted } = useFilterState();

  const showWeighted = state.pipeline_weighted === true;
  const pipelineValue = showWeighted
    ? metrics.pipeline_value_weighted
    : metrics.pipeline_value_face;
  const pipelineLabel = showWeighted ? "weighted pipeline" : "pipeline value";

  return (
    <section
      aria-label="Dashboard hero metrics"
      className="grid grid-cols-2 gap-3 border-b border-blaze-rule bg-white px-8 py-5 md:grid-cols-3 lg:grid-cols-6"
    >
      <MetricCard
        value={formatCurrency(pipelineValue)}
        label={pipelineLabel}
        onClick={togglePipelineWeighted}
        title={
          showWeighted
            ? "A probability-adjusted view with an opportunity in Discover valued at 10%, and one in Navigate at 85%. Click to show face value."
            : "The total face value of every sized opportunity in the portfolio. Click to show phase-weighted view."
        }
      />
      <MetricCard
        value={metrics.members_in_cultivation.toLocaleString()}
        label={filterDescription ? "Members (filtered)" : "Members in cultivation"}
      />
      <MetricCard
        value={metrics.conversations_this_week.toLocaleString()}
        label="conversations this week"
        sparkline={metrics.conversations_sparkline}
      />
      <MetricCard
        value={metrics.insights_this_week.toLocaleString()}
        label="insights this week"
        sparkline={metrics.insights_sparkline}
      />
      <MetricCard
        value={`${metrics.avg_discover_to_navigate_days} days`}
        label="avg Discover → Navigate"
      />
      <MetricCard
        value={formatCurrency(metrics.closed_value_12mo)}
        label="closed last 12 months"
        sparkline={metrics.closures_sparkline}
        sparklineSuffix={`${metrics.closed_count_12mo} deals`}
      />
    </section>
  );
}

function MetricCard({
  value,
  label,
  sparkline,
  sparklineSuffix,
  onClick,
  title,
}: {
  value: string;
  label: string;
  sparkline?: number[];
  sparklineSuffix?: string;
  onClick?: () => void;
  title?: string;
}) {
  const inner = (
    <>
      <p className="font-semibold leading-tight text-blaze-charcoal text-[26px] md:text-[28px]">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.06em] text-blaze-grey-soft">
        {label}
      </p>
      {sparkline && (
        <div className="mt-2 flex items-end justify-between gap-2">
          <Sparkline data={sparkline} />
          {sparklineSuffix && (
            <span className="text-[10px] text-blaze-grey-soft">{sparklineSuffix}</span>
          )}
        </div>
      )}
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded border border-blaze-rule bg-white px-4 py-3 text-left transition-colors hover:border-blaze-orange-deep/40 hover:bg-blaze-cream/30 focus:outline-none focus-visible:border-blaze-orange-deep"
    >
      {inner}
    </button>
  ) : (
    <div
      title={title}
      className="rounded border border-blaze-rule bg-white px-4 py-3"
    >
      {inner}
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 16;
  const step = width / (data.length - 1 || 1);
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="text-blaze-orange-deep"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
