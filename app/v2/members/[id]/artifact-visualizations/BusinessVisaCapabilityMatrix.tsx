"use client";

/*
 * Sprint 9 Patch G Block 7 — TRACK-010 Business Visa capability matrix.
 *
 * Replaces the cashback opportunity chart for the Business Visa
 * template. The cashback framing picked the smallest, weakest
 * dimension of the product's value; Business Visa's real story is
 * operational infrastructure — expense visibility, working-capital
 * cushion, business-credit profile, operational flexibility.
 *
 * Layout: 2 × 2 card grid. Each card lays out a capability with a
 * small uppercase header, a body description, and one concrete data
 * point pulled from the artifact's parameters. Card 2 (Working
 * Capital Cushion) carries the one visual element — a horizontal
 * progress bar showing expected monthly use vs the credit limit.
 *
 * Color discipline (Patch G locked decision): orange family + slate
 * only. No green. The progress bar uses `afterState` for "expected
 * monthly use" and `beforeStateLight` for "available headroom."
 */

import { ARTIFACT_PALETTE } from "./palette";
import { annotationLineClass, fmtUSDLong, num } from "./shared";

export function BusinessVisaCapabilityMatrix({
  parameterValues,
}: {
  parameterValues: Record<string, string>;
}) {
  const creditLimit = num(parameterValues, "proposed_limit");
  const monthlySpend = num(parameterValues, "expected_monthly_spend");
  const annualSpend = num(parameterValues, "annual_operational_spend");
  const cashbackRate = num(parameterValues, "estimated_cashback_rate", 2);
  const primaryCategories =
    parameterValues.primary_spend_categories?.toString().trim() ||
    "Operational spend";
  const integration =
    parameterValues.expense_management_integration?.toString().trim() ||
    "Not yet configured";
  // BUILD 2e (A5) — no fallback: when unset, hide the row rather than
  // printing a banker process note in a member-facing card.
  const authorizedUsers =
    parameterValues.authorized_users?.toString().trim() || "";
  const rewardStructure =
    parameterValues.reward_structure?.toString().trim() ||
    `${cashbackRate}% cashback on supplies and fuel`;

  const headroom = Math.max(0, creditLimit - monthlySpend);
  const usePct =
    creditLimit > 0
      ? Math.max(0, Math.min(100, (monthlySpend / creditLimit) * 100))
      : 0;
  const headroomPct = 100 - usePct;

  return (
    <div className="space-y-3">
      <div className="rounded border border-blaze-rule bg-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blaze-grey-soft">
          Operating benefits
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <CapabilityCard
            header="Expense visibility"
            description="All operational spend in one place. Auto-categorized for tax prep and reporting."
            primaryDatum={
              <>
                Categories captured:{" "}
                <strong className="text-blaze-charcoal">
                  {primaryCategories}
                </strong>
              </>
            }
            secondaryDatum={
              <>
                Integration:{" "}
                <strong className="text-blaze-charcoal">{integration}</strong>
              </>
            }
          />

          <CapabilityCard
            header="Working capital cushion"
            description="Credit limit provides month-end float for vendor payments and reserves for unexpected opportunities."
            primaryDatum={
              <>
                <strong className="text-blaze-charcoal">
                  {fmtUSDLong(creditLimit)}
                </strong>{" "}
                credit limit
              </>
            }
            secondaryDatum={
              <>
                Expected monthly use:{" "}
                <strong className="text-blaze-charcoal">
                  {fmtUSDLong(monthlySpend)}
                </strong>{" "}
                · Available headroom:{" "}
                <strong className="text-blaze-charcoal">
                  {fmtUSDLong(headroom)}
                </strong>
              </>
            }
            visualElement={
              <div className="mt-2">
                <div className="relative h-2 w-full overflow-hidden rounded bg-blaze-cream/40">
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${usePct}%`,
                      background: ARTIFACT_PALETTE.afterState,
                    }}
                    title={`Expected monthly use: ${fmtUSDLong(monthlySpend)}`}
                  />
                  <div
                    className="absolute inset-y-0"
                    style={{
                      left: `${usePct}%`,
                      width: `${headroomPct}%`,
                      background: ARTIFACT_PALETTE.beforeStateLight,
                      opacity: 0.5,
                    }}
                    title={`Available headroom: ${fmtUSDLong(headroom)}`}
                  />
                </div>
                <p className="mt-1 text-[10px] text-blaze-grey-soft">
                  <span className="inline-block h-2 w-2 rounded-sm align-middle" style={{ background: ARTIFACT_PALETTE.afterState }}/>{" "}
                  expected use · {Math.round(usePct)}%{" "}
                  <span className="inline-block h-2 w-2 rounded-sm align-middle ml-2" style={{ background: ARTIFACT_PALETTE.beforeStateLight, opacity: 0.5 }}/>{" "}
                  headroom · {Math.round(headroomPct)}%
                </p>
              </div>
            }
          />

          <CapabilityCard
            header="Credit story building"
            description="Business credit profile established through consistent business-only spending."
            primaryDatum={
              <>
                Strengthens future borrowing capacity for larger
                commitments (CRE, SBA, equipment financing).
              </>
            }
          />

          <CapabilityCard
            header="Operational flexibility"
            description="Spend without disrupting cash reserves. Fund opportunities as they arise."
            primaryDatum={
              authorizedUsers ? (
                <>
                  Authorized users:{" "}
                  <strong className="text-blaze-charcoal">
                    {authorizedUsers}
                  </strong>
                </>
              ) : null
            }
            secondaryDatum={
              <>
                Reward structure:{" "}
                <strong className="text-blaze-charcoal">
                  {rewardStructure}
                </strong>
              </>
            }
          />
        </div>
      </div>

      <p className={annotationLineClass()}>
        A Business Visa provides operational support, not a wealth-
        generation product. Cashback at <strong>{cashbackRate}%</strong>{" "}
        on annual operational spend of{" "}
        <strong>{fmtUSDLong(annualSpend)}</strong> is a small bonus; the
        real value is the four capabilities above. The{" "}
        <strong>{fmtUSDLong(creditLimit)}</strong> card line provides
        ongoing capacity to spend across operational categories without
        disrupting cash reserves — fundamental to running a small
        business at scale.
      </p>
    </div>
  );
}

function CapabilityCard({
  header,
  description,
  primaryDatum,
  secondaryDatum,
  visualElement,
}: {
  header: string;
  description: string;
  primaryDatum: React.ReactNode;
  secondaryDatum?: React.ReactNode;
  visualElement?: React.ReactNode;
}) {
  return (
    <div className="rounded border border-blaze-rule bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blaze-grey-soft">
        {header}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-blaze-charcoal">
        {description}
      </p>
      <p className="mt-2 text-[12px] leading-relaxed text-blaze-charcoal">
        {primaryDatum}
      </p>
      {secondaryDatum && (
        <p className="mt-1 text-[11px] leading-relaxed text-blaze-grey-body">
          {secondaryDatum}
        </p>
      )}
      {visualElement}
    </div>
  );
}
