import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  summarizeMember,
  summarizeRecommendation,
  summarizeGrowthTrack,
  type MemberSummaryInput,
} from "../lib/summaries";
import { fireRules, type RuleConditions } from "../lib/rule-engine";
import { RELATION_NAMES } from "../lib/relation-names";

const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: dbPath }) });

const NOW = new Date("2026-04-25T12:00:00Z");

// ----- Description compliance check -----
const MIN_WORDS = 15;
function wordCount(s: string | null | undefined): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

async function complianceCheck() {
  const types: { type: string; rows: { name: string; description: string }[] }[] = [
    { type: "IndustryFamily", rows: (await prisma.industryFamily.findMany({ select: { name: true, description: true } })).map((r) => ({ name: r.name, description: r.description })) },
    { type: "Topic", rows: (await prisma.topic.findMany({ select: { canonical_tag: true, description: true } })).map((r) => ({ name: r.canonical_tag, description: r.description })) },
    { type: "Product", rows: (await prisma.product.findMany({ select: { name: true, description: true } })).map((r) => ({ name: r.name, description: r.description })) },
    { type: "MemberType", rows: (await prisma.memberType.findMany({ select: { name: true, description: true } })).map((r) => ({ name: r.name, description: r.description })) },
    { type: "Rule", rows: (await prisma.rule.findMany({ select: { name: true, description: true } })).map((r) => ({ name: r.name, description: r.description })) },
  ];
  const results = types.map((t) => {
    const failing = t.rows.filter((r) => wordCount(r.description) < MIN_WORDS).map((r) => r.name);
    return { type: t.type, total: t.rows.length, passing: t.rows.length - failing.length, failing };
  });
  return results;
}

// ----- Member profiles (structured) -----
async function memberProfile(id: string) {
  const m = await prisma.member.findUniqueOrThrow({
    where: { id },
    include: {
      member_type: { include: { default_growth_tracks: { select: { name: true } } } },
      industry_family: true,
      primary_banker: true,
      conversations: { orderBy: { created_at: "desc" }, select: { id: true, created_at: true, meeting_type: true, channel: true, sentiment: true, moment_quote: true, banker: { select: { display_name: true } } } },
      signals: { where: { active: true }, include: { topic: { select: { canonical_tag: true, display_name: true } } }, orderBy: { captured_at: "desc" } },
      action_cards: { where: { status: { in: ["open", "in_progress"] } }, include: { owner: { select: { display_name: true } } }, orderBy: { due_at: "asc" } },
      recommendations: { include: { product: { select: { name: true } }, rule_that_fired: { select: { name: true } } }, orderBy: { created_at: "desc" } },
      summary_snapshots: { include: { conversation: { select: { created_at: true } } }, orderBy: { generated_at: "desc" } },
    },
  });

  const activeBlockerCount = m.signals.filter((s) => s.type === "blocker").length;
  const proposal = m.recommendations[0] ?? null;

  const memberSummaryInput: MemberSummaryInput = {
    legal_name: m.legal_name,
    doing_business_as: m.doing_business_as,
    member_type_name: m.member_type.name,
    industry_family_name: m.industry_family.name,
    tenure_started_at: m.tenure_started_at,
    primary_banker_name: m.primary_banker.display_name,
    active_blocker_count: activeBlockerCount,
    active_proposal: proposal
      ? { product_name: proposal.product.name, size_proposed: proposal.size_proposed, response: proposal.response, primary_concern: proposal.primary_concern }
      : null,
    last_touch_at: m.last_touch_at,
    open_action_card_count: m.open_action_card_count,
    active_signal_count: m.active_signal_count,
  };

  const summaryResult = summarizeMember(memberSummaryInput, NOW);

  return {
    identity: {
      legal_name: m.legal_name,
      doing_business_as: m.doing_business_as,
      member_type: m.member_type.name,
      industry_family: m.industry_family.name,
      stage: m.stage,
      size_band: m.size_band,
      primary_banker: m.primary_banker.display_name,
      tenure_started_at: m.tenure_started_at.toISOString().slice(0, 10),
    },
    suggested_growth_tracks: m.member_type.default_growth_tracks.map((t) => t.name),
    derived_state: {
      last_touch_at: m.last_touch_at?.toISOString().slice(0, 10) ?? null,
      active_signal_count: m.active_signal_count,
      active_blocker_count: activeBlockerCount,
      open_action_card_count: m.open_action_card_count,
    },
    active_signals: m.signals.map((s) => ({
      type: s.type,
      topic: s.topic.display_name,
      severity: s.severity,
      recency: s.recency,
      magnitude: s.magnitude,
      unit: s.unit,
      frequency: s.frequency,
      their_words: s.their_words,
    })),
    open_action_cards: m.action_cards.map((c) => ({ type: c.type, due_at: c.due_at.toISOString().slice(0, 10), owner: c.owner.display_name, rationale: c.rationale })),
    recommendations: m.recommendations.map((r) => {
      const recSummary = summarizeRecommendation({
        product_name: r.product.name,
        size_proposed: r.size_proposed,
        structure: r.structure,
        response: r.response,
        confidence_band: r.confidence_band,
        rationale_text: r.rationale_text,
        rationale_summary: r.rationale_summary,
        primary_concern: r.primary_concern,
      });
      return {
        product: r.product.name,
        size_proposed: r.size_proposed,
        confidence_band: r.confidence_band,
        response: r.response,
        primary_concern: r.primary_concern,
        rule_that_fired: r.rule_that_fired?.name ?? null,
        summary: recSummary.ok ? recSummary.value : { error: recSummary.error },
      };
    }),
    summary_snapshots: m.summary_snapshots.map((s) => ({
      conversation_date: s.conversation.created_at.toISOString().slice(0, 10),
      template_version: s.template_version,
      generated_at: s.generated_at.toISOString(),
      summary_text: s.summary_text,
    })),
    conversation_history: m.conversations.map((c) => ({ date: c.created_at.toISOString().slice(0, 10), meeting_type: c.meeting_type, channel: c.channel, sentiment: c.sentiment, moment_quote: c.moment_quote })),
    rendered_member_summary: summaryResult.ok ? summaryResult.value : { error: summaryResult.error },
  };
}

// ----- Rule engine -----
async function ruleEngine(memberId: string) {
  const m = await prisma.member.findUniqueOrThrow({ where: { id: memberId }, select: { id: true, member_type_id: true, core_sync_state: true } });
  const activeSignals = await prisma.signal.findMany({ where: { member_id: memberId, active: true }, select: { topic_id: true } });
  const heldRaw = (m.core_sync_state as { products_held: { product_id: string }[] }).products_held;
  const productsHeld = await Promise.all(heldRaw.map(async (p) => {
    const pr = await prisma.product.findUnique({ where: { id: p.product_id }, select: { subcategory: true } });
    return pr ? { product_subcategory: pr.subcategory } : null;
  })).then((arr) => arr.filter((x): x is { product_subcategory: string } => x !== null));

  const rules = await prisma.rule.findMany({ include: { output_growth_tracks: { select: { id: true, name: true } } } });
  return fireRules(
    rules.map((r) => ({ id: r.id, name: r.name, conditions: r.conditions as RuleConditions, confidence_band: r.confidence_band, output_growth_tracks: r.output_growth_tracks })),
    { member: { id: m.id, member_type_id: m.member_type_id }, activeSignals, productsHeld },
  );
}

// ----- Growth track summaries -----
async function growthTrackSummaries() {
  const tracks = await prisma.growthTrack.findMany({
    include: { target_member_type: { select: { name: true } }, growth_step_sequence: { include: { growth_step: { select: { title: true, step_shape: true } } } } },
    orderBy: { name: "asc" },
  });
  return tracks.map((t) =>
    summarizeGrowthTrack({
      name: t.name,
      description: t.description,
      target_member_type_name: t.target_member_type.name,
      growth_steps: t.growth_step_sequence.map((s) => ({ position: s.position, title: s.growth_step.title, step_shape: s.growth_step.step_shape })),
    }),
  );
}

// ----- Main -----
async function main() {
  console.log("==========================================================");
  console.log("(A) Compliance check — Principle 1 (descriptions ≥15 words)");
  console.log("==========================================================");
  const compliance = await complianceCheck();
  for (const r of compliance) {
    const status = r.passing === r.total ? "✓" : "✗";
    console.log(`  ${status} ${r.type}: ${r.passing}/${r.total}`);
    if (r.failing.length > 0) r.failing.forEach((f) => console.log(`      ✗ ${f}`));
  }

  console.log("\n==========================================================");
  console.log("(B) Three Member profiles (structured JSON)");
  console.log("==========================================================");
  const jenny = await prisma.member.findFirstOrThrow({ where: { legal_name: "Jenny's Catering LLC" } });
  const northland = await prisma.member.findFirstOrThrow({ where: { legal_name: "Northland Heating & Cooling Inc." } });
  const cygnus = await prisma.member.findFirstOrThrow({ where: { legal_name: "Cygnus Bioscience Inc." } });
  for (const m of [jenny, northland, cygnus]) {
    const profile = await memberProfile(m.id);
    console.log(`\n--- ${m.legal_name} ---\n`);
    console.log(JSON.stringify(profile, null, 2));
  }

  console.log("\n==========================================================");
  console.log("(C) Rule engine output per Member");
  console.log("==========================================================\n");
  for (const m of [jenny, northland, cygnus]) {
    const ranked = await ruleEngine(m.id);
    console.log(`${m.legal_name}:`);
    if (ranked.length === 0) console.log("  (no rules fired)");
    else
      ranked.forEach((r, i) => {
        const tracks = r.growth_tracks.map((t) => `"${t.name}"`).join(", ");
        console.log(`  #${i + 1}  [${r.rule.confidence_band}] ${r.rule.name}`);
        console.log(`         → ${tracks}`);
      });
    console.log();
  }

  console.log("==========================================================");
  console.log("(D) summarizeMember output per Member (registry-rendered)");
  console.log("==========================================================\n");
  for (const m of [jenny, northland, cygnus]) {
    const profile = await memberProfile(m.id);
    console.log(`${m.legal_name}:`);
    if (typeof profile.rendered_member_summary === "string") {
      console.log(`  "${profile.rendered_member_summary}"\n`);
    } else {
      console.log(`  MissingSlotsError:`, JSON.stringify(profile.rendered_member_summary, null, 2), "\n");
    }
  }

  console.log("==========================================================");
  console.log("(E) MemberSummarySnapshot rows");
  console.log("==========================================================\n");
  const snapshots = await prisma.memberSummarySnapshot.findMany({
    include: { member: { select: { legal_name: true } }, conversation: { select: { created_at: true, meeting_type: true } } },
    orderBy: { generated_at: "asc" },
  });
  for (const s of snapshots) {
    console.log(`Snapshot ${s.id}`);
    console.log(`  member:               ${s.member.legal_name}`);
    console.log(`  conversation:         ${s.conversation.created_at.toISOString().slice(0, 10)} (${s.conversation.meeting_type})`);
    console.log(`  template_version:     ${s.template_version}`);
    console.log(`  generated_at:         ${s.generated_at.toISOString()}`);
    console.log(`  summary_text:`);
    console.log(`    "${s.summary_text}"\n`);
  }

  console.log("==========================================================");
  console.log("(F) Relation-name registry");
  console.log("==========================================================\n");
  for (const r of RELATION_NAMES) {
    console.log(`  ${r.source.padEnd(22)} ${r.verb.padEnd(34)} ${r.target}`);
  }

  console.log("\n==========================================================");
  console.log("(G) Growth track summaries (registry-rendered)");
  console.log("==========================================================\n");
  for (const r of await growthTrackSummaries()) {
    if (r.ok) console.log(`• ${r.value}\n`);
    else console.log(`✗ ${r.error.template} missing: ${r.error.missing.join(", ")}\n`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
