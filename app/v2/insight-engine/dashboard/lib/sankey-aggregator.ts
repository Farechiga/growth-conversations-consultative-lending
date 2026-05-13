/*
 * Sprint 7b Block I — Sankey data aggregation.
 *
 * Three-layer flow: Bankers → Specialist roles → Closure outcomes.
 *
 *   Layer 1: 5 banker nodes (or fewer for the last partial cohort)
 *            from the selected cohort. Cohorts are computed by ranking
 *            bankers descending on closed pipeline value (last 12 mo);
 *            "top-5" = ranks 1-5, "6-10" = ranks 6-10, etc.
 *
 *   Layer 2: Specialist role nodes. For closed deals, derived from
 *            ClosedDeal.specialist_banker_id → Banker.specialty plus a
 *            "CDC partner" node for cdc_partner_involved. Deals with no
 *            specialist flow through "Direct (no specialist)". For
 *            still-active Members, all flow through "Direct (no
 *            specialist)" since specialist data isn't captured for
 *            members in cultivation.
 *
 *   Layer 3: Two outcome nodes — Closed-won (from ClosedDeal entries)
 *            and Still-active (from SyntheticMember entries currently
 *            in cultivation).
 *
 * Closed-lost outcome is intentionally omitted: the synthetic dataset
 * doesn't model lost deals. The Sankey notes this gap rather than
 * fabricating data.
 *
 * Flow magnitude = pipeline value (closed_value for closed deals,
 * sized_opportunity_amount for still-active members). Aligns with the
 * "closed pipeline value (last 12mo)" banker ranking metric so the
 * top-of-leaderboard story reads cleanly.
 */

import type {
  Banker,
  BankerSpecialty,
  ClosedDeal,
  SyntheticMember,
} from "@/lib/synthetic-data/types";

export const COHORT_SIZE = 5;

export type SpecialistKey =
  | "sba_focused"
  | "cre_focused"
  | "treasury_focused"
  | "general"
  | "cdc_partner"
  | "direct";

export const SPECIALIST_LABELS: Record<SpecialistKey, string> = {
  sba_focused: "SBA specialist",
  cre_focused: "CRE specialist",
  treasury_focused: "Treasury specialist",
  general: "Generalist specialist",
  cdc_partner: "CDC partner",
  direct: "Direct (no specialist)",
};

export type OutcomeKey = "closed_won" | "still_active";
export const OUTCOME_LABELS: Record<OutcomeKey, string> = {
  closed_won: "Closed-won",
  still_active: "Still-active",
};

export type SankeyNode = {
  id: string;
  kind: "banker" | "specialist" | "outcome";
  label: string;
  sublabel?: string;
  totalValue: number;
};

export type SankeyLink = {
  source: string;
  target: string;
  value: number;
};

export type SankeyData = {
  nodes: SankeyNode[];
  links: SankeyLink[];
  cohortLabel: string;
  cohortBankers: Banker[];
  // Available cohort keys derived from total banker count.
  availableCohorts: Array<{ key: string; label: string; rangeText: string }>;
};

export type BankerRank = {
  banker_id: string;
  name: string;
  closed_value_12mo: number;
};

function rankBankers(
  bankers: Banker[],
  closedDeals: ClosedDeal[],
): BankerRank[] {
  const closedByBanker = new Map<string, number>();
  for (const d of closedDeals) {
    closedByBanker.set(
      d.originating_banker_id,
      (closedByBanker.get(d.originating_banker_id) ?? 0) + d.closure_value,
    );
  }
  return bankers
    .map((b) => ({
      banker_id: b.id,
      name: b.name,
      closed_value_12mo: closedByBanker.get(b.id) ?? 0,
    }))
    .sort((a, b) => b.closed_value_12mo - a.closed_value_12mo);
}

export function cohortKeysFor(bankerCount: number): Array<{
  key: string;
  label: string;
  rangeText: string;
  start: number;
  end: number;
}> {
  const cohorts: Array<{
    key: string;
    label: string;
    rangeText: string;
    start: number;
    end: number;
  }> = [];
  for (let start = 0; start < bankerCount; start += COHORT_SIZE) {
    const end = Math.min(bankerCount, start + COHORT_SIZE);
    const rangeText = `${start + 1}-${end}`;
    const key = start === 0 ? "top-5" : rangeText;
    const label = start === 0 ? `Top ${end}` : `Bankers ${rangeText}`;
    cohorts.push({ key, label, rangeText, start, end });
  }
  return cohorts;
}

function specialistKeyForDeal(
  deal: ClosedDeal,
  bankerById: Map<string, Banker>,
): SpecialistKey {
  if (deal.cdc_partner_involved) return "cdc_partner";
  if (!deal.specialist_involved || !deal.specialist_banker_id) return "direct";
  const specialist = bankerById.get(deal.specialist_banker_id);
  if (!specialist) return "direct";
  return specialist.specialty as BankerSpecialty;
}

export function buildSankey(
  bankers: Banker[],
  members: SyntheticMember[],
  closedDeals: ClosedDeal[],
  cohortKey: string,
): SankeyData {
  const ranked = rankBankers(bankers, closedDeals);
  const cohorts = cohortKeysFor(ranked.length);
  const selected =
    cohorts.find((c) => c.key === cohortKey) ?? cohorts[0] ?? null;
  const cohortBankers: Banker[] = [];
  const cohortBankerIds = new Set<string>();
  if (selected) {
    for (let i = selected.start; i < selected.end; i++) {
      const b = bankers.find((x) => x.id === ranked[i].banker_id);
      if (b) {
        cohortBankers.push(b);
        cohortBankerIds.add(b.id);
      }
    }
  }
  const bankerById = new Map(bankers.map((b) => [b.id, b]));

  // Aggregate flows: bankerId → specialistKey → outcomeKey → value
  type FlowTriple = Map<string, Map<SpecialistKey, Map<OutcomeKey, number>>>;
  const flows: FlowTriple = new Map();
  function add(
    bid: string,
    sk: SpecialistKey,
    ok: OutcomeKey,
    value: number,
  ) {
    if (!cohortBankerIds.has(bid)) return;
    let bMap = flows.get(bid);
    if (!bMap) {
      bMap = new Map();
      flows.set(bid, bMap);
    }
    let sMap = bMap.get(sk);
    if (!sMap) {
      sMap = new Map();
      bMap.set(sk, sMap);
    }
    sMap.set(ok, (sMap.get(ok) ?? 0) + value);
  }

  for (const d of closedDeals) {
    add(
      d.originating_banker_id,
      specialistKeyForDeal(d, bankerById),
      "closed_won",
      d.closure_value,
    );
  }
  for (const m of members) {
    // Still-active members route via "Direct" — specialist data isn't
    // captured pre-closure in the synthetic dataset.
    add(m.banker_id, "direct", "still_active", m.sized_opportunity_amount);
  }

  // Build node list. Only include specialist + outcome nodes that
  // carry any flow so the diagram doesn't render dead branches.
  const specialistTotals = new Map<SpecialistKey, number>();
  const outcomeTotals = new Map<OutcomeKey, number>();
  const bankerTotals = new Map<string, number>();
  const links: SankeyLink[] = [];
  for (const [bid, bMap] of flows.entries()) {
    let bTotal = 0;
    const perSpecialist = new Map<SpecialistKey, number>();
    for (const [sk, sMap] of bMap.entries()) {
      let sBucket = 0;
      for (const [ok, v] of sMap.entries()) {
        sBucket += v;
        outcomeTotals.set(ok, (outcomeTotals.get(ok) ?? 0) + v);
      }
      perSpecialist.set(sk, sBucket);
      specialistTotals.set(
        sk,
        (specialistTotals.get(sk) ?? 0) + sBucket,
      );
    }
    for (const [sk, v] of perSpecialist.entries()) {
      links.push({ source: `banker:${bid}`, target: `specialist:${sk}`, value: v });
      bTotal += v;
    }
    bankerTotals.set(bid, bTotal);
  }
  // Specialist → outcome links (re-walk flows aggregated by specialist).
  const specialistOutcome = new Map<string, number>();
  for (const bMap of flows.values()) {
    for (const [sk, sMap] of bMap.entries()) {
      for (const [ok, v] of sMap.entries()) {
        const key = `${sk}->${ok}`;
        specialistOutcome.set(key, (specialistOutcome.get(key) ?? 0) + v);
      }
    }
  }
  for (const [key, v] of specialistOutcome.entries()) {
    const [sk, ok] = key.split("->") as [SpecialistKey, OutcomeKey];
    links.push({ source: `specialist:${sk}`, target: `outcome:${ok}`, value: v });
  }

  const nodes: SankeyNode[] = [];
  for (const b of cohortBankers) {
    nodes.push({
      id: `banker:${b.id}`,
      kind: "banker",
      label: b.name,
      sublabel: `closed: $${Math.round(
        (ranked.find((r) => r.banker_id === b.id)?.closed_value_12mo ?? 0) /
          1_000_000,
      )}M (12mo)`,
      totalValue: bankerTotals.get(b.id) ?? 0,
    });
  }
  for (const [sk, total] of specialistTotals.entries()) {
    nodes.push({
      id: `specialist:${sk}`,
      kind: "specialist",
      label: SPECIALIST_LABELS[sk],
      totalValue: total,
    });
  }
  for (const [ok, total] of outcomeTotals.entries()) {
    nodes.push({
      id: `outcome:${ok}`,
      kind: "outcome",
      label: OUTCOME_LABELS[ok],
      totalValue: total,
    });
  }

  return {
    nodes,
    links,
    cohortLabel: selected?.label ?? "Top 5",
    cohortBankers,
    availableCohorts: cohorts.map((c) => ({
      key: c.key,
      label: c.label,
      rangeText: c.rangeText,
    })),
  };
}
