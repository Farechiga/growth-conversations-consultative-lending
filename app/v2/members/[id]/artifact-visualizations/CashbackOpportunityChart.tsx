"use client";

/*
 * Sprint 9 Block H — TRACK-010 Business Visa: cashback opportunity chart.
 *
 * Annual benefit comparison + a 5-year cumulative call-out. The chart
 * answers "what's the rewards opportunity I'm leaving on the table by
 * not running operational spend through the Business Visa?"
 *
 * Sprint 9 Patch B — palette refresh + Block 5.2 baseline fix.
 *   - Cashback bar uses muted `benefit` green; float uses warm
 *     `afterState` Blaze accent.
 *   - Both columns now carry a `card_eligible_spend` baseline in
 *     muted `beforeState` so the visual reads as "you're spending
 *     this either way — the question is whether you capture the
 *     rewards on top." This replaces the prior empty "Current"
 *     column, which under-communicated the trade-off.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ARTIFACT_PALETTE } from "./palette";
import {
  annotationLineClass,
  fmtUSD,
  fmtUSDLong,
  num,
  tooltipUSD,
} from "./shared";

export function CashbackOpportunityChart({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const annualSpend = num(parameterValues, "annual_operational_spend");
  const monthlySpend =
    num(parameterValues, "expected_monthly_spend") || annualSpend / 12;
  const cashbackRate = num(parameterValues, "estimated_cashback_rate", 2);
  const annualCardSpend = monthlySpend * 12;
  // Float benefit ≈ ~4% money-market yield on the average 30-day
  // outstanding balance (≈ monthlySpend / 2). Captured monthly, then
  // annualized.
  const annualFloatBenefit = monthlySpend * 0.5 * 0.04;
  const annualCashback = (annualCardSpend * cashbackRate) / 100;
  const totalAnnual = annualCashback + annualFloatBenefit;

  const series = [
    {
      scenario: "Current",
      card_eligible_spend: Math.round(annualCardSpend),
      cashback: 0,
      float: 0,
    },
    {
      scenario: "With Business Visa",
      card_eligible_spend: Math.round(annualCardSpend),
      cashback: Math.round(annualCashback),
      float: Math.round(annualFloatBenefit),
    },
  ];

  const fiveYearLeft = totalAnnual * 5;

  return (
    <div className="space-y-3">
      <div className="rounded border border-blaze-rule bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
          Annual benefit comparison
        </p>
        <p className="mt-0.5 text-[11px] text-blaze-grey-body">
          Same spend either way. The Business Visa captures rewards on top.
        </p>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={series}
              margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <CartesianGrid
                stroke={ARTIFACT_PALETTE.referenceGrid}
                vertical={false}
              />
              <XAxis
                dataKey="scenario"
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
              />
              <YAxis
                tickFormatter={fmtUSD}
                tick={{ fontSize: 11, fill: ARTIFACT_PALETTE.axis }}
                width={68}
              />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 4 }}
                formatter={tooltipUSD}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="card_eligible_spend"
                name="Card-eligible spend (baseline)"
                stackId="benefit"
                fill={ARTIFACT_PALETTE.beforeState}
              />
              <Bar
                dataKey="cashback"
                name="Annual cashback captured"
                stackId="benefit"
                fill={ARTIFACT_PALETTE.benefit}
              />
              <Bar
                dataKey="float"
                name="Annual float benefit (30-day)"
                stackId="benefit"
                fill={ARTIFACT_PALETTE.afterState}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded border border-blaze-rule bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
          What you&rsquo;re leaving on the table
        </p>
        <ul className="mt-2 space-y-1 text-[12px] text-blaze-charcoal">
          <li>
            Annual operational spend: <strong>{fmtUSDLong(annualSpend)}</strong>
          </li>
          <li>
            Expected card spend (monthly × 12):{" "}
            <strong>{fmtUSDLong(annualCardSpend)}</strong> at{" "}
            <strong>{cashbackRate}% effective cashback</strong>
          </li>
          <li>
            Annual cashback captured:{" "}
            <strong>{fmtUSDLong(annualCashback)}</strong>
          </li>
          <li>
            Annual float benefit (30-day delayed payment):{" "}
            <strong>~{fmtUSDLong(annualFloatBenefit)}</strong>
          </li>
          <li>
            <strong>Combined annual benefit:</strong>{" "}
            <strong>{fmtUSDLong(totalAnnual)}</strong>
          </li>
        </ul>
      </div>

      <p className={annotationLineClass()}>
        Over 5 years: <strong>{fmtUSDLong(fiveYearLeft)}</strong> in combined
        rewards + float. The underlying spend is happening either way; the
        Business Visa is the difference between capturing the rewards and
        leaving them behind.
      </p>
    </div>
  );
}
