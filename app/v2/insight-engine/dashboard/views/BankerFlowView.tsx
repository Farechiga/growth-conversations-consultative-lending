"use client";

/*
 * Sprint 7b Block J + K — Banker → Specialist → Outcome Sankey.
 *
 * Three-layer flow rendered with d3-sankey. Cohort dropdown above the
 * chart selects which 5 bankers anchor the left layer (ranked by closed
 * pipeline value, last 12 months). Filter row (Track / Member-Type)
 * scopes the underlying deal + member set so the banker ranking +
 * Sankey flows recompute per filter.
 *
 * Closed-lost outcome is intentionally omitted — the synthetic dataset
 * doesn't model lost deals. The Sankey notes the data gap in a caption
 * rather than fabricating values.
 */

import { useMemo } from "react";
import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyGraph,
} from "d3-sankey";
import type {
  Banker,
  ClosedDeal,
  SyntheticMember,
} from "@/lib/synthetic-data/types";
import { useFilterState } from "../hooks/use-filter-state";
import { buildSankey, type SankeyNode } from "../lib/sankey-aggregator";

type NodeDatum = SankeyNode & {
  index?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  value?: number;
};
type LinkDatum = {
  source: NodeDatum | string;
  target: NodeDatum | string;
  value: number;
  width?: number;
  y0?: number;
  y1?: number;
};

const NODE_FILL: Record<"banker" | "specialist" | "outcome", string> = {
  banker: "#C2410C", // afterState — warm Blaze
  specialist: "#0F766E", // wealth — deep teal
  outcome: "#15803D", // benefit — muted green (closed-won default)
};
const OUTCOME_FILL: Record<string, string> = {
  "outcome:closed_won": "#15803D", // benefit
  "outcome:still_active": "#78716C", // beforeState slate
  "outcome:closed_lost": "#B91C1C", // cost
};

function fillFor(node: SankeyNode): string {
  if (node.kind === "outcome") {
    return OUTCOME_FILL[node.id] ?? NODE_FILL.outcome;
  }
  return NODE_FILL[node.kind];
}

function fmtUSDLong(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

const WIDTH = 920;
const HEIGHT = 520;

export function BankerFlowView({
  bankers,
  members,
  closedDeals,
}: {
  bankers: Banker[];
  members: SyntheticMember[];
  closedDeals: ClosedDeal[];
}) {
  const { state, setCohort } = useFilterState();
  const cohortKey = state.cohort;

  const data = useMemo(
    () => buildSankey(bankers, members, closedDeals, cohortKey),
    [bankers, members, closedDeals, cohortKey],
  );

  const layout = useMemo(() => {
    if (data.nodes.length === 0 || data.links.length === 0) return null;
    // sankey() mutates the input nodes/links — clone defensively.
    const nodeById = new Map(data.nodes.map((n) => [n.id, { ...n } as NodeDatum]));
    const graph: SankeyGraph<NodeDatum, LinkDatum> = {
      nodes: Array.from(nodeById.values()),
      links: data.links.map((l) => ({
        source: nodeById.get(l.source)!,
        target: nodeById.get(l.target)!,
        value: l.value,
      })) as unknown as LinkDatum[],
    };
    const generator = sankey<NodeDatum, LinkDatum>()
      .nodeId((n) => n.id)
      .nodeWidth(16)
      .nodePadding(14)
      .extent([
        [16, 16],
        [WIDTH - 16, HEIGHT - 16],
      ]);
    return generator(graph);
  }, [data.nodes, data.links]);

  const linkPath = sankeyLinkHorizontal();

  return (
    <div className="space-y-4">
      <div className="rounded border border-blaze-rule bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-blaze-charcoal">
              Banker → Specialist → Outcome flow
            </h2>
            <p className="mt-1 text-[12px] text-blaze-grey-body">
              Flow widths proportional to pipeline value. Bankers ranked
              by closed pipeline value (last 12 months). Specialist roles
              derived from closed-deal handoff records; still-active
              members route via &ldquo;Direct (no specialist).&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-blaze-grey-soft">Cohort:</span>
            <select
              value={cohortKey}
              onChange={(e) => setCohort(e.target.value)}
              className="rounded border border-blaze-rule bg-white px-2 py-1 text-[11px] text-blaze-charcoal focus:border-blaze-orange-deep focus:outline-none"
            >
              {data.availableCohorts.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
          {data.cohortLabel} — closed pipeline value last 12 months
        </p>

        {layout ? (
          <div className="mt-3 overflow-x-auto">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              width="100%"
              role="img"
              aria-label="Banker to specialist to outcome Sankey diagram"
              style={{ maxHeight: 560 }}
            >
              <g>
                {layout.links.map((l, i) => {
                  const src = l.source as NodeDatum;
                  const tgt = l.target as NodeDatum;
                  return (
                    <path
                      key={i}
                      d={linkPath(l as never) ?? undefined}
                      fill="none"
                      stroke={fillFor(src)}
                      strokeOpacity={0.25}
                      strokeWidth={Math.max(1, l.width ?? 0)}
                    >
                      <title>
                        {`${src.label} → ${tgt.label} · ${fmtUSDLong(l.value)}`}
                      </title>
                    </path>
                  );
                })}
              </g>
              <g>
                {layout.nodes.map((n) => {
                  const x0 = n.x0 ?? 0;
                  const x1 = n.x1 ?? 0;
                  const y0 = n.y0 ?? 0;
                  const y1 = n.y1 ?? 0;
                  const height = Math.max(2, y1 - y0);
                  const width = x1 - x0;
                  const isLeft = x0 < WIDTH / 2;
                  return (
                    <g key={n.id}>
                      <rect
                        x={x0}
                        y={y0}
                        width={width}
                        height={height}
                        fill={fillFor(n)}
                        rx={2}
                      >
                        <title>
                          {`${n.label} · ${fmtUSDLong(n.totalValue)}`}
                        </title>
                      </rect>
                      <text
                        x={isLeft ? x1 + 6 : x0 - 6}
                        y={(y0 + y1) / 2}
                        dy="0.35em"
                        textAnchor={isLeft ? "start" : "end"}
                        fontSize={11}
                        fill="#1c1917"
                      >
                        {n.label}
                      </text>
                      {n.sublabel && (
                        <text
                          x={isLeft ? x1 + 6 : x0 - 6}
                          y={(y0 + y1) / 2 + 12}
                          textAnchor={isLeft ? "start" : "end"}
                          fontSize={9}
                          fill="#78716C"
                        >
                          {n.sublabel}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        ) : (
          <p className="mt-4 text-[12px] italic text-blaze-grey-soft">
            No flow data for this cohort under the current filters.
          </p>
        )}

        <p className="mt-3 text-[11px] text-blaze-grey-soft">
          Note: closed-lost outcomes are not modeled in the synthetic
          dataset; the Sankey shows closed-won + still-active only.
        </p>
      </div>
    </div>
  );
}
