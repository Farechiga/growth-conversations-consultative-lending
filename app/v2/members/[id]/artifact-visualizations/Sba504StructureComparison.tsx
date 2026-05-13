"use client";

/*
 * Sprint 9 Block F — TRACK-008 SBA 504: structure comparison.
 *
 * Side-by-side visualization showing the financial advantage of SBA 504
 * vs. conventional CRE. Two grouped bar comparisons:
 *   - Cash at closing (Member's out-of-pocket equity contribution)
 *   - 10-year cumulative interest paid
 *
 * Renders BELOW the existing partnership-map roadmap (the roadmap and
 * this chart compose into the "sba_504_paired" structural content type;
 * the renderer wraps both in the same artifact view).
 *
 * Sprint 9 Patch B — palette refresh: conventional bars use the muted
 * `beforeState` slate, SBA 504 bars use the warm `afterState` Blaze
 * accent. Consistent with the before/after grammar used across all
 * Sprint 9 visualizations.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  monthlyPayment,
  num,
  tooltipUSD,
} from "./shared";

function interestOver10Years(
  principal: number,
  annualRatePct: number,
  amortYears: number,
): number {
  const monthly = monthlyPayment(principal, annualRatePct, amortYears * 12);
  const r = annualRatePct / 100 / 12;
  let balance = principal;
  let interestPaid = 0;
  const months = Math.min(120, amortYears * 12);
  for (let m = 0; m < months && balance > 0; m++) {
    const interest = balance * r;
    const principalThisMonth = Math.max(monthly - interest, 0);
    interestPaid += interest;
    balance -= principalThisMonth;
  }
  return interestPaid;
}

export function Sba504StructureComparison({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const propertyValue = num(parameterValues, "property_value");
  const bankRate = num(parameterValues, "bank_first_lien_rate", 7.5);
  const cdcRate = num(parameterValues, "cdc_second_lien_rate", 5.5);
  const conventionalRate = num(parameterValues, "conventional_rate", 8);
  const amortYears = num(parameterValues, "amortization_years", 25);

  const conventionalCash = propertyValue * 0.3;
  const conventionalLoan = propertyValue * 0.7;
  const conventional10yrInterest = interestOver10Years(
    conventionalLoan,
    conventionalRate,
    amortYears,
  );

  const sba504Cash = propertyValue * 0.1;
  const sba504BankPortion = propertyValue * 0.5;
  const sba504CdcPortion = propertyValue * 0.4;
  const sba504BankInterest = interestOver10Years(
    sba504BankPortion,
    bankRate,
    amortYears,
  );
  const sba504CdcInterest = interestOver10Years(
    sba504CdcPortion,
    cdcRate,
    amortYears,
  );
  const sba50410yrInterest = sba504BankInterest + sba504CdcInterest;

  const cashSavings = conventionalCash - sba504Cash;
  const interestSavings = conventional10yrInterest - sba50410yrInterest;

  const cashSeries = [
    { structure: "Conventional", value: Math.round(conventionalCash) },
    { structure: "SBA 504", value: Math.round(sba504Cash) },
  ];
  const interestSeries = [
    { structure: "Conventional", value: Math.round(conventional10yrInterest) },
    { structure: "SBA 504", value: Math.round(sba50410yrInterest) },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border border-blaze-rule bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
            Cash at closing
          </p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cashSeries}
                margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
              >
                <CartesianGrid
                  stroke={ARTIFACT_PALETTE.referenceGrid}
                  vertical={false}
                />
                <XAxis
                  dataKey="structure"
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
                <Bar dataKey="value" name="Cash required">
                  {cashSeries.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.structure === "SBA 504"
                          ? ARTIFACT_PALETTE.afterState
                          : ARTIFACT_PALETTE.beforeState
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-blaze-grey-body">
            Conventional needs 30% equity. SBA 504 needs 10%.
          </p>
        </div>

        <div className="rounded border border-blaze-rule bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
            10-year cumulative interest
          </p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={interestSeries}
                margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
              >
                <CartesianGrid
                  stroke={ARTIFACT_PALETTE.referenceGrid}
                  vertical={false}
                />
                <XAxis
                  dataKey="structure"
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
                <Bar dataKey="value" name="Interest paid (10 years)">
                  {interestSeries.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.structure === "SBA 504"
                          ? ARTIFACT_PALETTE.afterState
                          : ARTIFACT_PALETTE.beforeState
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-blaze-grey-body">
            Below-market CDC second lien lowers blended interest.
          </p>
        </div>
      </div>

      <p className={annotationLineClass()}>
        On a <strong>{fmtUSDLong(propertyValue)}</strong> property: SBA 504
        saves <strong>{fmtUSDLong(cashSavings)}</strong> in cash at closing
        and <strong>~{fmtUSDLong(interestSavings)}</strong> in interest over
        10 years vs. conventional CRE. The roadmap above shows where you are
        in the three-party process.
      </p>
    </div>
  );
}
