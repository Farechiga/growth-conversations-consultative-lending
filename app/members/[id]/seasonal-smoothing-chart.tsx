"use client";

/*
 * Seasonal cash flow smoothing chart — Recharts ComposedChart implementation.
 *
 * Renders the with-LOC vs. without-LOC cash position over twelve months for
 * Jenny's parameters (revenue band $500K-$1M, monthly_low 35000, monthly_high
 * 95000, proposed_loc_size 75000). The chart's job is to make the smoothing
 * benefit obvious without claiming a specific outcome — the without-LOC line
 * dips below zero in slow months; the with-LOC line stays positive throughout.
 *
 * Data values are illustrative and hardcoded for the demo per Francisco's
 * step-(c)(4) spec. The production version would parameterize from real
 * member cash-flow data and the artifact's parameter_schema.
 *
 * Styling per BLAZE_STYLE_GUIDE.md §9:
 *   - Without-LOC line: #4F5052 (blaze-grey-body), 2px stroke
 *   - With-LOC line:    #B45F26 (blaze-orange), 2.5px stroke
 *   - With-LOC area:    rgba(180, 95, 38, 0.12) — subtle orange tint
 *   - Grid:             rgba(232, 224, 212, 0.3) — faint warm parchment
 *   - Axis text:        Inter 12px / #4F5052
 */

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DATA = [
  { month: "Jan", withoutLoc: -8000, withLoc: 12000 },
  { month: "Feb", withoutLoc: -15000, withLoc: 8000 },
  { month: "Mar", withoutLoc: -3000, withLoc: 18000 },
  { month: "Apr", withoutLoc: 22000, withLoc: 22000 },
  { month: "May", withoutLoc: 35000, withLoc: 35000 },
  { month: "Jun", withoutLoc: 28000, withLoc: 28000 },
  { month: "Jul", withoutLoc: 32000, withLoc: 32000 },
  { month: "Aug", withoutLoc: 30000, withLoc: 30000 },
  { month: "Sep", withoutLoc: -5000, withLoc: 15000 },
  { month: "Oct", withoutLoc: -12000, withLoc: 10000 },
  { month: "Nov", withoutLoc: 8000, withLoc: 18000 },
  { month: "Dec", withoutLoc: 18000, withLoc: 22000 },
];

function fmtDollarTick(v: number): string {
  if (v === 0) return "$0";
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
}

function fmtTooltipValue(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${abs}`;
}

const AXIS_STYLE = { fill: "#4F5052", fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" };

export function SeasonalSmoothingChart() {
  return (
    <div
      className="rounded border border-blaze-dust bg-white"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={DATA} margin={{ top: 24, right: 24, left: 16, bottom: 24 }}>
          <CartesianGrid stroke="rgba(232, 224, 212, 0.6)" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tick={AXIS_STYLE}
            axisLine={{ stroke: "#888780" }}
            tickLine={{ stroke: "#888780" }}
            label={{
              value: "Month",
              position: "insideBottom",
              offset: -10,
              style: { ...AXIS_STYLE, fontSize: 11 },
            }}
          />
          <YAxis
            tick={AXIS_STYLE}
            tickFormatter={fmtDollarTick}
            axisLine={{ stroke: "#888780" }}
            tickLine={{ stroke: "#888780" }}
            label={{
              value: "Cash position ($)",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { ...AXIS_STYLE, fontSize: 11, textAnchor: "middle" },
            }}
          />
          <Tooltip
            formatter={(value, name) => [
              fmtTooltipValue(typeof value === "number" ? value : Number(value ?? 0)),
              String(name),
            ]}
            contentStyle={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 12,
              border: "1px solid #D7D3D0",
              borderRadius: 6,
              backgroundColor: "rgba(255, 255, 255, 0.96)",
            }}
            labelStyle={{ color: "#262626", fontWeight: 500 }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 12,
              color: "#4F5052",
              paddingTop: 8,
            }}
            verticalAlign="top"
            align="right"
          />
          {/* Subtle orange fill below the with-LOC line — reads as "LOC keeps cash positive" */}
          <Area
            type="monotone"
            dataKey="withLoc"
            name="Cash position with $75K LOC"
            stroke="none"
            fill="rgba(180, 95, 38, 0.12)"
            isAnimationActive={false}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="withoutLoc"
            name="Cash position without LOC"
            stroke="#4F5052"
            strokeWidth={2}
            dot={{ fill: "#4F5052", r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="withLoc"
            name="Cash position with $75K LOC"
            stroke="#B45F26"
            strokeWidth={2.5}
            dot={{ fill: "#B45F26", r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
