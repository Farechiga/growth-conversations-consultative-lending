/*
 * Stage guidance — Sprint 4 §4.2a Block A.
 *
 * Per-Member-Type, per-stage guidance paragraphs that scaffold the
 * banker's understanding of what each stage of a Growth Conversation is
 * for. Surfaces directly below each stage section header on the Growth
 * Conversations page.
 *
 * Architecture (per prompt §A.3, Approach 2):
 *   - Reference data, not member-specific captured data.
 *   - Lives in code (this module), not denormalized per execution.
 *   - Lookup keyed on (member_type_name, track_id | null, step_phase,
 *     stage_label) — the stage_label arg disambiguates Cygnus's two
 *     Ask stages ("Ask 1" vs "Ask 2") while the trackId arg is null
 *     for track-agnostic phases (Ask, Size).
 *
 * Member Types in the demo (from prisma/seed.ts):
 *   - "Event services" — Jenny's Catering (Sprint 5d-pre rename;
 *     coverage broadened beyond catering to event planners, venue
 *     operators, mobile bartenders, party rental, wedding services,
 *     corporate event management)
 *   - "Maintenance services" — Northland HVAC (Sprint 5d-pre rename;
 *     coverage broadened to plumbing, electrical, mechanical
 *     contractors, landscapers, pool service, pest control, cleaning)
 *   - "Specialty manufacturer" — Cygnus Bioscience (Sprint 5d-pre
 *     rename; coverage covers mid-market manufacturers, industrial
 *     fabrication, custom production, contract manufacturing)
 *
 * Tracks in the demo:
 *   - Jenny → Working Capital LOC Track (Resolve-ending)
 *   - Northland → Vehicle/Fleet Loan Track (Resolve-ending)
 *   - Cygnus → Commercial Real Estate Term Loan Track (Connect-ending)
 *
 * Content authored verbatim from prompt §A.2. When updating guidance,
 * edit this module in place — no schema migration needed.
 *
 * Fallback shape (per §A.3): if the (member_type, track, phase) tuple
 * isn't authored, return a generic phase-only paragraph so the page
 * always has something coherent to render. The fallback also covers
 * the "Member has no Track yet" edge case (none of the demo Members
 * fall into this category, but the architecture handles it cleanly).
 */

export type StepPhase =
  | "ask"
  | "size"
  | "show"
  | "propose"
  | "resolve"
  | "connect"
  | "decision_pending"
  | "funded"
  | "specialist_engagement"
  // Sprint 4.6 patch — Connect-ending terminal renamed `closed` →
  // `introduced`. Past-tense framing matches the semantic work the
  // label does (the banker-to-specialist handoff has been made).
  | "introduced";

// Member Type names keyed exactly as seeded. Using the `name` string
// (rather than uuid id) keeps this lookup human-readable; the seed
// guarantees exactly these three values for the demo.
// Sprint 5d-pre — renamed per CONTENT_REWRITE_v1.md Section 1:
//   "Small Caterer · Starting"          → "Event services"
//   "HVAC & Trades · Growing"           → "Maintenance services"
//   "Specialty Manufacturer · Established" → "Specialty manufacturer"
// Constants follow the new IDs (event_services / maintenance_services /
// specialty_manufacturer) for code-internal naming; values are the
// banker-facing display labels.
const EVENT_SERVICES = "Event services";
const MAINTENANCE_SERVICES = "Maintenance services";
const SPECIALTY_MANUFACTURER = "Specialty manufacturer";

// Sprint 5d-pre A.4 — coverage definitions for banker-facing surfaces
// where the broadened Member-Type scope needs explicit articulation
// (filter dropdowns, Track Performance Member-Type mix labels, Coach
// surface section headers). Centralized here so updates land in one
// place; consumers import via the helper below.
export type MemberTypeCoverage = {
  /** Banker-facing display label (matches MemberType.name in seed). */
  label: string;
  /** Coverage description for tooltips / filter UIs / Coach headers. */
  coverage: string;
};

export const MEMBER_TYPE_COVERAGE: Record<string, MemberTypeCoverage> = {
  [EVENT_SERVICES]: {
    label: EVENT_SERVICES,
    coverage:
      "Caterers, event planners, venue operators, mobile bartenders, party rental companies, wedding services, corporate event management.",
  },
  [MAINTENANCE_SERVICES]: {
    label: MAINTENANCE_SERVICES,
    coverage:
      "HVAC, plumbing, electrical, mechanical contractors, landscapers, pool service, pest control, cleaning services.",
  },
  [SPECIALTY_MANUFACTURER]: {
    label: SPECIALTY_MANUFACTURER,
    coverage:
      "Mid-market manufacturers, industrial fabrication, custom production, contract manufacturing.",
  },
};

export function memberTypeCoverage(name: string | null): MemberTypeCoverage | null {
  if (!name) return null;
  return MEMBER_TYPE_COVERAGE[name] ?? null;
}

// Internal shape: a per-Member-Type guidance map. Key strategy:
//   - For track-agnostic phases (ask, size): key on `${phase}` or
//     `ask:1` / `ask:2` for Cygnus's two Ask stages.
//   - For track-specific phases: key on `${phase}` (the Member's
//     active Track determines the content).
// We index Cygnus's two Ask stages by stage label suffix; Jenny and
// Northland each have a single Ask stage so the bare "ask" key
// suffices.
type GuidanceMap = Record<string, string>;

const GUIDANCE: Record<string, GuidanceMap> = {
  [EVENT_SERVICES]: {
    ask:
      "Establish the rhythm of cashflow and surface seasonal pressures driving working capital needs. Listen for blockers around customer payment timing and acute moments of seasonal stress.",
    size:
      "Quantify the slow-season revenue gap and the magnitude of customer-payment-timing impact. Size the working capital line at roughly one quarter of the slow-season gap.",
    show:
      "Render the seasonal cashflow chart that makes the smoothing math visible. The Member should see how the line of credit covers the trough.",
    resolve:
      "Capture the Member's response, sentiment, and any indecision. If the Member is leaning yes but needs another decision-maker's input, surface that as the open thread.",
    decision_pending:
      "The Member has the proposal and needs internal alignment before committing. Track this as an open opportunity in the Member profile until the decision lands.",
    funded:
      "The Working Capital LOC is funded and active. Member is in service mode; future Growth Conversations will likely surface utilization patterns or expansion triggers.",
  },
  [MAINTENANCE_SERVICES]: {
    ask:
      "Determine what greater fleet capacity would enable. Surface the work that's being declined, the regions where capacity falls short, and any trigger events (regulatory, seasonal, competitive) shaping the decision window.",
    size:
      "Quantify the volume of declined work and the revenue-per-truck math. Size the fleet expansion against demonstrated demand and the time horizon for vehicle availability.",
    show:
      "Render the fleet expansion ROI projection that maps quarterly cash flow against the vehicle financing payment. The Member should see breakeven and cumulative gain.",
    resolve:
      "Capture the Member's response and any open indecision. If the Member needs to verify with their advisor or partner, surface that as the open thread.",
    decision_pending:
      "The Member has the ROI projection and needs to align with their partner or advisor before committing. Track as open opportunity.",
    funded:
      "The Vehicle/Fleet Loan is funded and the trucks are being acquired. Future Growth Conversations may surface expansion-stage triggers (additional regions, fleet replacement).",
  },
  [SPECIALTY_MANUFACTURER]: {
    // Cygnus's Track has two Ask stages — keyed by ":1" and ":2"
    // suffix matching the stage label "Ask 1" / "Ask 2".
    "ask:1":
      "Probe the capital event under evaluation. Surface the Member's read on timing, scope, and the trigger event (capacity expansion, customer growth commitment, supply chain shift) shaping the window.",
    "ask:2":
      "Discover the timing driver behind the capital event. Surface the customer growth commitments or contractual milestones that anchor the decision calendar.",
    show:
      "Render the capital event partnership map that lays out the milestones, decision points, and specialist handoffs. The Member should see the pathway from initial conversation to closing.",
    connect:
      "Hand off to the appropriate specialist (CRE underwriter, Treasury, or Specialty Lending). Capture the introduction context and any open threads the specialist needs to know.",
    specialist_engagement:
      "The relationship is now driven by the specialist banker. Primary banker stays informed via the open opportunity thread but does not lead the technical conversation.",
    introduced:
      "The introduction to the CRE specialist has been made. The relationship from this point forward is driven by the specialist; primary banker stays in the loop on follow-on opportunities (expansion, treasury services, succession planning).",
  },
};

// Generic fallbacks used when the (Member Type, phase) tuple isn't
// authored. Phase-level only — no Member-Type framing. These keep the
// page coherent without inventing Member-specific content.
const GENERIC_PHASE_FALLBACK: Record<StepPhase, string> = {
  ask: "Surface what's driving this conversation. Listen for goals, blockers, triggers, and indecisions in the Member's own words.",
  size: "Quantify the magnitude of the opportunity or the constraint. Capture measurements with provenance — what was stated, by whom, and when.",
  show: "Render the supporting analysis or projection. The Member should leave the conversation able to picture the proposal in their own situation.",
  propose:
    "Surface the structured recommendation. Capture the Member's response, sentiment, and any conditions attached to a yes.",
  resolve:
    "Capture the Member's response to the recommendation. Note sentiment, primary concern, and any indecision that needs further decision-maker input.",
  connect:
    "Hand off to the appropriate specialist. Capture introduction context and the open threads the specialist will need.",
  decision_pending:
    "The Member is weighing the recommendation. Track as an open opportunity until the decision lands.",
  funded:
    "The opportunity has funded. Future Growth Conversations may surface utilization, expansion, or follow-on patterns.",
  specialist_engagement:
    "A specialist banker is leading the technical conversation. Primary banker stays informed via the opportunity thread.",
  introduced:
    "The introduction to the specialist has been made. The relationship from this point forward is driven by the specialist; future Growth Conversations may surface follow-on opportunities.",
};

/**
 * Look up the guidance paragraph for a stage. Returns null if no Member
 * Type was supplied and no fallback applies — the caller can choose to
 * suppress the guidance area entirely in that case.
 *
 * Args:
 *   - memberTypeName: Member Type display name (e.g. "Event services").
 *     Pass null when the Member has no resolved Member Type.
 *   - stepPhase: the canonical phase identifier.
 *   - stageLabel: the stage's display label ("Ask", "Ask 1", "Ask 2",
 *     "Size", "Show", "Resolve", "Connect", "Decision pending",
 *     "Funded", "Specialist engagement", "Introduced"). Used to
 *     disambiguate repeated phases (Cygnus's two Asks).
 *
 * The stageLabel parameter is what lets us key Cygnus's "Ask 1" and
 * "Ask 2" to distinct guidance paragraphs while keeping single-Ask
 * Tracks on the bare "ask" key.
 */
export function getStageGuidance(
  memberTypeName: string | null,
  stepPhase: StepPhase,
  stageLabel: string,
): string {
  if (memberTypeName) {
    const memberMap = GUIDANCE[memberTypeName];
    if (memberMap) {
      // For Cygnus, Ask 1 / Ask 2 disambiguate. We synthesize a key
      // like "ask:1" by reading the trailing digit from the stage
      // label when present.
      const m = stageLabel.match(/^(\w+)\s+(\d+)$/);
      if (m) {
        const phaseFromLabel = m[1].toLowerCase();
        const ord = m[2];
        const compound = `${phaseFromLabel}:${ord}`;
        if (memberMap[compound]) return memberMap[compound];
      }
      if (memberMap[stepPhase]) return memberMap[stepPhase];
    }
  }
  return GENERIC_PHASE_FALLBACK[stepPhase];
}

// ============================================================
// Sprint 4.7.2 — V2Objective vocabulary refactor (Block B + D).
//
// Land/Understand/Formalize → Discover/Measure/Navigate per
// ARCHITECTURE_V2.md §3 + EVIDENCE_FRAMEWORK.md §2.
//
// Evidence re-mapping:
//   - Goals / Blockers / Indecision moved Understand → Discover
//   - Trigger signals stay on Discover (was Land)
//   - Sized magnitude / Methodology / Time period+confidence stay on
//     Measure (was Understand)
//   - Model produced moved Consult → Measure
//   - Show / Reaction / Decision posture / Primary concern → Consult
//   - Specialist handoff / ActionCard / Application / Decision finalized
//     → Navigate (was Formalize)
//
// Coach content split into three layers:
//   1. V2_OBJECTIVE_QUESTIONS — verbatim approved question per objective
//   2. GENERIC_OBJECTIVE_BODIES — generic fallback body when Member
//      Type not authored
//   3. MEMBER_TYPE_GUIDANCE — per-Member-Type body that overrides the
//      generic fallback
//
// objectiveGuidance() returns { headline, body } so the sidebar can
// render question + body separately for the "show ?" coach expansion.
// ============================================================

export type V2Objective = "discover" | "measure" | "consult" | "navigate";

export type ObjectiveGuidance = {
  headline: string;
  body: string;
};

export const V2_OBJECTIVE_LABELS: Record<V2Objective, string> = {
  discover: "Discover",
  measure: "Measure",
  consult: "Consult",
  navigate: "Navigate",
};

// Verbatim approved per Sprint 4.7.2 prompt §D.2. The question framing
// is the centerpiece of the coach surface — it tells the banker what
// the objective is *for*, not just what to do.
export const V2_OBJECTIVE_QUESTIONS: Record<V2Objective, string> = {
  discover: "Do we understand how their business can grow?",
  measure: "Have we measured the pain, the lost opportunities, the solution?",
  consult: "Does the Member see how the opportunity comes together?",
  navigate: "Are we helping get this across the finish line?",
};

// Generic body fallback when no Member Type is matched.
const GENERIC_OBJECTIVE_BODIES: Record<V2Objective, string> = {
  discover:
    "Surface the supporting context, market issues, seasonality, business-specific circumstances. Capture goals, blockers, indecision, triggers. Connect to a candidate product or growth track.",
  measure:
    "Quantify the gap. Cost the status quo. Size and shape the proposed solution. Scope and model — banker draft or with Member.",
  consult:
    "Walk them through the model. Capture how they react, what they push back on, what threads hold the decision.",
  navigate:
    "Move the Member from ready-to-proceed to actually-proceeded. Handoff to specialist, ensure introductions land, track ActionCards through to completion.",
};

// Per-Member-Type body. Overrides the generic fallback when the
// Member's Member Type matches. Each paragraph stays short (~30-60
// words) so the sidebar's "show ?" expansion reads tight.
const MEMBER_TYPE_GUIDANCE: Record<string, Record<V2Objective, string>> = {
  [EVENT_SERVICES]: {
    discover:
      "Listen for seasonal pressure (trigger), late-paying corporate clients (blocker), and the slow-season cash gap (goal of smoothing). Capture verbatim quotes — the human texture of \"I want to sleep through January\" is the centerpiece. Trigger-watch: late payments, equipment break-downs, approaching slow seasons.",
    measure:
      "Quantify the slow-season gap (e.g., $48K shortfall over Jan–Feb). Size the working capital line at roughly one quarter of that gap. Build the cashflow projection model — banker draft for pre-work, with-Member for the live conversation. Methodology note explains the sizing logic.",
    consult:
      "Show the seasonal smoothing chart so the Member sees the line cover the trough. Capture reaction, the verbatim quote, and the open thread (spouse pending, advisor pending). Don't move on without surfacing what holds the decision.",
    navigate:
      "Once the Member is leaning yes, queue the joint call or follow-up application step as an ActionCard with owner and due date. Track through to commit/funded. Specialist handoff doesn't apply for working capital LOC.",
  },
  [MAINTENANCE_SERVICES]: {
    discover:
      "Surface the work being declined and why (capacity blocker), the goal of expanding fleet, and the moment the Member reframes a personal-vehicle inquiry as a business-fleet opportunity (the indecision). Trigger-watch: regulatory shifts, seasonal demand, technician hiring lag.",
    measure:
      "Quantify the volume of declined work and the revenue-per-truck math. Size the fleet expansion against demonstrated demand and the time horizon for vehicle availability. Build the ROI projection model — banker draft if pre-meeting; with-Member if walked through together.",
    consult:
      "Show the fleet ROI projection mapping breakeven and cumulative gain. Capture reaction (engaged / leaning yes / skeptical), the verbatim quote, and any open thread (CPA review, partner alignment).",
    navigate:
      "ActionCards for advisor follow-up and application materials. Specialist handoff if the deal scope grows beyond standard fleet financing — otherwise Scott runs it through to commit/funded.",
  },
  [SPECIALTY_MANUFACTURER]: {
    discover:
      "Two trigger captures matter: capacity expansion under evaluation (the floor-space decision) and customer volume commitments (the volumes that anchor the timing). Capture both as distinct Triggers. Macro context (regional commercial banking competition) frames the conversation.",
    measure:
      "Quantify capacity utilization (~85%), customer concentration (3 anchor customers ~62% of revenue), expansion scope ($4-7M). Size against the milestone calendar. The capital event partnership map is a Model produced jointly during the conversation — with-Member provenance auto-creates the ShowEvent.",
    consult:
      "Show the capital event partnership map; the Member should see the pathway from conversation to closing, including specialist roles. Capture reaction and the open thread (board scenarios, RFP-vs-relationship preference). Decision posture matters here — Cygnus is leaning toward Blaze if the specialist depth is shown.",
    navigate:
      "Specialist handoff to the CRE banker (e.g., Marcus Webb). Track the introduction follow-through; this Track is Connect-ending — Navigate is satisfied when the introduction lands and the specialist takes over the relationship.",
  },
};

/**
 * Look up the objective guidance for a (Member Type, objective) tuple.
 * Returns { headline (the question), body (Member-Type-specific if
 * authored, else generic fallback) }. Retained for backward compat;
 * Sprint 5a.3 Block C migrates the sidebar coach surface to the
 * structured bullet shape (`coachBullets()` below).
 */
export function objectiveGuidance(
  objective: V2Objective,
  memberTypeName: string | null,
): ObjectiveGuidance {
  const headline = V2_OBJECTIVE_QUESTIONS[objective];
  const memberSpecific =
    memberTypeName && MEMBER_TYPE_GUIDANCE[memberTypeName]
      ? MEMBER_TYPE_GUIDANCE[memberTypeName][objective]
      : null;
  const body = memberSpecific ?? GENERIC_OBJECTIVE_BODIES[objective];
  return { headline, body };
}

// ============================================================
// Sprint 5a.3 Block C — Coach surface visual restructure.
//
// Coach panel mirrors popup-as-workflow discipline:
//   - Section per objective (V2_OBJECTIVE_QUESTIONS as the framing
//     question, same as popup headers)
//   - Verb-led action item bullets (not narrative paragraphs)
//   - Bullets that map to factors render as clickable CTAs reusing
//     Block E plumbing (factor-NNN → + Quantify; symbolic refs → other
//     forms)
//   - Figures bolded
//   - Always-expanded when opened (no expand-per-objective)
//
// Authoring discipline (per Francisco's Block C scope):
//   - Substance preserved from MEMBER_TYPE_GUIDANCE paragraphs above
//   - Lines made redundant by popup-as-workflow CTAs retired
//     (e.g., "capture goals", "show the chart", "size the gap" — all
//     now surfaced by popup missing-evidence CTAs or sidebar artifact
//     slot)
//   - What stays: verbatim-quote discipline, trigger-watch lists,
//     domain-specific framing, Member-specific reframing moments,
//     figure-based context (~85% utilization, $4-7M scope, etc.)
//
// Note 3 (Pilot architectural question): coach content is currently
// Record<member_type × objective>. Pilot may benefit from
// Record<member_type × track × objective> so coaching adapts to current
// Track context. See Sprint 5a.3 BUILD_LOG entry for the full Note.
// ============================================================

export type CoachBullet = {
  /** Verb-led action item or substantive insight. */
  text: string;
  /**
   * Substring fragments within `text` to render bold. Useful for
   * figures (~$48K, 70 calls/peak season, 1/4 of the gap, etc.) and
   * key terms ("Two trigger captures", "Connect-ending"). Substring
   * match; rendering is left-to-right, first-match-wins.
   */
  boldFragments?: string[];
  /**
   * Optional CTA target. When present, the bullet renders as a
   * clickable row that fires onCtaClick(evidence_ref) — reuses
   * Block E plumbing. evidence_ref is FACTOR-NNN (→ + Quantify with
   * preselection) or a symbolic ref (model_produced, reaction_captured,
   * specialist_handoff_initiated, decision_maker_mapping → respective
   * forms).
   */
  ctaEvidenceRef?: string;
  /** Italicize the bullet (used for verbatim-quote discipline lines). */
  italic?: boolean;
};

export type MemberTypeCoach = Record<V2Objective, CoachBullet[]>;

const GENERIC_COACH_BULLETS: MemberTypeCoach = {
  discover: [
    {
      text: "Capture verbatim Member quotes — the human texture is the centerpiece.",
      italic: true,
    },
    {
      text: "Trigger-watch: events that change what the Member needs from you.",
    },
  ],
  measure: [
    {
      text: "Quantify the pain. Cost the status quo. Size the proposed solution.",
    },
    {
      text: "Pre-work the model as banker-draft; switch to with-Member when walking through together.",
      ctaEvidenceRef: "model_produced",
    },
  ],
  consult: [
    {
      text: "Surface what holds the decision — don't move on without naming it.",
    },
    {
      text: "Watch for the reaction quote that lands.",
    },
  ],
  navigate: [
    {
      text: "ActionCards with explicit owner + due date when follow-through is open.",
      ctaEvidenceRef: "specialist_handoff_initiated",
    },
  ],
};

// Sprint 5d Block C — Coach content sourced verbatim from
// CONTENT_REWRITE_v1.md Section 2 (3 Member-Types × 4 phases). Each
// bullet's text is the exact prose Section 2 specifies. CTA wiring
// follows the *[CTA: + activity · context]* annotations: bullets that
// map cleanly to a single capture-form symbolic ref or factor get
// `ctaEvidenceRef`; bullets whose CTA is open-ended (Ask·Trigger,
// Action·next conversation, etc.) stay static — wiring those to the
// wrong form would mislead the banker more than no CTA.
const MEMBER_TYPE_COACH: Record<string, MemberTypeCoach> = {
  // ── Section 2.1 — Event services ──
  [EVENT_SERVICES]: {
    // 2.1.1 — Discover
    discover: [
      {
        text: "Get the seasonal cycle exactly right. A wedding caterer's busy months aren't the same as a corporate caterer's. Don't assume — ask which months are strong and which are slow. Capture the answer verbatim.",
        boldFragments: ["Get the seasonal cycle exactly right."],
      },
      {
        text: "Find out who the big customers are. Most event-services businesses have a handful of accounts that drive most of the revenue. A venue partnership, a corporate account, a recurring institutional client. Ask “Who are your top three customers and roughly what share of revenue?”",
        boldFragments: ["Find out who the big customers are."],
        ctaEvidenceRef: "FACTOR-003",
      },
      {
        text: "Listen for what they're saying about the slow months. December is usually strong. January and February are often where the year is won or lost. The way they describe those months — “the dry spell,” “the kill months,” “we just hold on” — tells you how much pressure they're under.",
        boldFragments: ["Listen for what they're saying about the slow months."],
      },
      {
        text: "Ask about events they've turned down. Event-services businesses often decline work without tracking it. “Have you turned down any events in the past year? What kind?” surfaces lost revenue you can quantify together.",
        boldFragments: ["Ask about events they've turned down."],
      },
      {
        text: "Find out who else is part of the decision. Many event-services businesses are jointly owned. One spouse runs operations; the other holds the household financial veto. Knowing this before Measure phase shapes how the whole conversation goes.",
        boldFragments: ["Find out who else is part of the decision."],
        ctaEvidenceRef: "decision_maker_mapping",
      },
    ],
    // 2.1.2 — Measure
    measure: [
      {
        text: "Put a dollar number on the slow-season gap. Total revenue gap across the slow months, not just average monthly revenue. “How much do you net in November-December versus January-February?” gets you the real shape.",
        boldFragments: ["Put a dollar number on the slow-season gap."],
      },
      {
        text: "Get the seasonal-variance percentage. The Lending-product specific factor capture asks for it directly. Most event-services owners have a sense of it (around 30-40% in their head) but haven't put a number to it.",
        boldFragments: ["Get the seasonal-variance percentage."],
        ctaEvidenceRef: "FACTOR-001",
      },
      {
        text: "Ask about customer payment timing. Corporate clients often pay in 60-90 days. Private events pay at booking. Mixed customer base produces a complicated payment cycle. The Member may quote an average (“about 45 days”) that hides how stretched the corporate side is.",
        boldFragments: ["Ask about customer payment timing."],
        ctaEvidenceRef: "FACTOR-002",
      },
      {
        text: "Quantify the lost revenue from declined work. Even a loose annual estimate is useful. Event-services Members usually underestimate this number; capture what they say and note where to come back to it.",
        boldFragments: ["Quantify the lost revenue from declined work."],
      },
      {
        text: "Build the seasonal cashflow picture together. Event-services Members understand their own cycle better when they see it drawn out. Put the model together with them watching, not as a finished thing you hand them.",
        boldFragments: ["Build the seasonal cashflow picture together."],
        ctaEvidenceRef: "model_produced",
      },
    ],
    // 2.1.3 — Consult
    consult: [
      {
        text: "Show the smoothing chart while the Member is in front of you. Event-services owners process visual cashflow differently than verbal description. The chart's value is in seeing their own pattern with the proposed line of credit drawn over the top.",
        boldFragments: ["Show the smoothing chart while the Member is in front of you."],
      },
      {
        text: "Listen for the household partner reference. “I'd want my husband to look at this” or “Let me run it past my wife” tells you the decision is shared. Capture as Indecision right when it surfaces, not at the end.",
        boldFragments: ["Listen for the household partner reference."],
        ctaEvidenceRef: "decision_maker_mapping",
      },
      {
        text: "Ask about the line size that feels comfortable. Event-services Members often have a number in mind (“around fifty thousand”) that's different from what the cashflow analysis suggests. Capture both — the gut number and the analytical one.",
        boldFragments: ["Ask about the line size that feels comfortable."],
      },
      {
        text: "Capture the reaction precisely. Event-services Members move from “I'm not sure” to “this might work” to “let me think about it” in identifiable steps. Pick the response that matches what they actually said, not what you hope they said.",
        boldFragments: ["Capture the reaction precisely."],
        ctaEvidenceRef: "reaction_captured",
      },
      {
        text: "Don't try to schedule Navigate-phase steps yet. Event-services Members typically need a household conversation between Consult and Navigate. Ask when the next conversation can happen instead of pushing forward.",
        boldFragments: ["Don't try to schedule Navigate-phase steps yet."],
      },
    ],
    // 2.1.4 — Navigate
    navigate: [
      {
        text: "Confirm the household conversation actually happened. “Did you and Mike talk through the line of credit?” surfaces where they really are without making assumptions.",
        boldFragments: ["Confirm the household conversation actually happened."],
        ctaEvidenceRef: "reaction_captured",
      },
      {
        text: "Offer to meet with both decision-makers together. Many event-services businesses benefit from a joint conversation with both owners present. Offer this rather than waiting to be asked.",
        boldFragments: ["Offer to meet with both decision-makers together."],
      },
      {
        text: "Walk through what the first six months look like. Event-services Members commit more readily when the first-six-month draw plan is concrete: “you'll likely draw about $20K in February, another $15K in March, repay everything by May when corporate events pick back up.”",
        boldFragments: ["Walk through what the first six months look like."],
        ctaEvidenceRef: "model_produced",
      },
      {
        text: "Mention business checking and merchant services. Sweep accounts, automated payroll, and merchant services pair naturally with the line of credit. Surface them as options without making them prerequisites.",
        boldFragments: ["Mention business checking and merchant services."],
      },
      {
        text: "Set a specific next-conversation date. “Let me know when you're ready” produces drift. “Can we connect again Tuesday morning?” produces forward motion.",
        boldFragments: ["Set a specific next-conversation date."],
      },
    ],
  },

  // ── Section 2.2 — Maintenance services ──
  [MAINTENANCE_SERVICES]: {
    // 2.2.1 — Discover
    discover: [
      {
        text: "Start with what brought them in today. Maintenance-services Members usually arrive with a specific operational problem. A truck broke down. They turned away a customer last week. They can't hire technicians because they don't have enough trucks. Capture this as the Trigger.",
        boldFragments: ["Start with what brought them in today."],
      },
      {
        text: "Listen for “we couldn't get to” or “we had to turn down.” This language surfaces lost revenue from capacity constraints. Maintenance-services Members don't always say “we have a capacity problem” outright; the way they describe the week tells you.",
        boldFragments: ["Listen for “we couldn't get to” or “we had to turn down.”"],
      },
      {
        text: "Ask about the fleet specifically. “How old is the oldest truck still working? The newest?” Maintenance-services Members know their fleet intimately and the answer tells you a lot.",
        boldFragments: ["Ask about the fleet specifically."],
        ctaEvidenceRef: "FACTOR-010",
      },
      {
        text: "Get the seasonal pattern. Maintenance services has multiple seasonal layers — cooling-season service peak, heating-season peak, shoulder-season install work. Different from event services; ask what the year looks like.",
        boldFragments: ["Get the seasonal pattern."],
      },
      {
        text: "Find out who their CPA is. Maintenance-services owners typically have a long-tenured CPA who handles depreciation and equipment-financing decisions. The CPA's perspective will shape how the financing case lands later.",
        boldFragments: ["Find out who their CPA is."],
      },
    ],
    // 2.2.2 — Measure
    measure: [
      {
        text: "Get capacity utilization in their own terms. Maintenance-services Members track capacity in truck-days per week or technician-hours per month. Ask “what percentage of your available technician hours did you actually bill last month?”",
        boldFragments: ["Get capacity utilization in their own terms."],
        ctaEvidenceRef: "FACTOR-006",
      },
      {
        text: "Count the declined service calls and put a dollar figure on them. “How many calls did you turn down last month? Last quarter? What's the average ticket?” Lost revenue grounds the fleet-expansion case.",
        boldFragments: ["Count the declined service calls and put a dollar figure on them."],
        ctaEvidenceRef: "FACTOR-007",
      },
      {
        text: "Separate replacement from expansion in the fleet plan. Maintenance-services Members often need both — replace aging trucks AND add new capacity. The split matters for how the financing is structured. “If we did this in two waves, what's the replacement piece and what's the expansion piece?”",
        boldFragments: ["Separate replacement from expansion in the fleet plan."],
      },
      {
        text: "Get year-over-year revenue with concrete numbers. Many maintenance-services businesses have grown 15-25% per year recently. Confirm with actual numbers, not “it's been good.”",
        boldFragments: ["Get year-over-year revenue with concrete numbers."],
        ctaEvidenceRef: "FACTOR-009",
      },
      {
        text: "Build the fleet-expansion ROI projection with their input. Maintenance-services Members validate ROI numbers against operational reality — how long it takes to hire a technician, what it costs to outfit a vehicle, what regional demand looks like. Build it with them.",
        boldFragments: ["Build the fleet-expansion ROI projection with their input."],
        ctaEvidenceRef: "model_produced",
      },
    ],
    // 2.2.3 — Consult
    consult: [
      {
        text: "Show several financing options, not one recommendation. Maintenance-services Members evaluate equipment financing through their CPA's tax-structuring lens. Lay out 2-3 options — Business Vehicle Loan, Equipment & Machinery, sometimes SBA — so the CPA can engage with the structural choice.",
        boldFragments: ["Show several financing options, not one recommendation."],
      },
      {
        text: "Show the ROI projection with low-, medium-, and high-demand scenarios. Maintenance-services Members understand that operations vary with hiring success and seasonal demand. Single-point projections feel less credible than ranges.",
        boldFragments: ["Show the ROI projection with low-, medium-, and high-demand scenarios."],
      },
      {
        text: "Listen for “let me talk to my CPA.” This isn't a delay; it's how maintenance-services Members make capital decisions. Capture as Indecision.",
        boldFragments: ["Listen for “let me talk to my CPA.”"],
        ctaEvidenceRef: "decision_maker_mapping",
      },
      {
        text: "Capture the reaction at each step. Maintenance-services Members move from technical questions (“what's the rate?”) through “let me check with the CPA” toward specific commitment (“we want to do this in March”). Pick the response that matches where they actually are.",
        boldFragments: ["Capture the reaction at each step."],
        ctaEvidenceRef: "reaction_captured",
      },
      {
        text: "Confirm the operational timing window. Fleet expansion timing aligns with shoulder-season prep — spring before cooling-season demand, fall before heating-season. Surface this so Navigate-phase scheduling matches operational reality.",
        boldFragments: ["Confirm the operational timing window."],
      },
    ],
    // 2.2.4 — Navigate
    navigate: [
      {
        text: "Offer to coordinate with the CPA directly. Most maintenance-services Members defer the final structuring decision to CPA review. Offer to handle the CPA conversation so the Member doesn't have to triangulate.",
        boldFragments: ["Offer to coordinate with the CPA directly."],
        ctaEvidenceRef: "specialist_handoff_initiated",
      },
      {
        text: "Confirm the procurement timeline. Vehicle ordering and outfitting takes 8-12 weeks. Technician hiring takes 6-10 weeks. The financing should match the shorter of those, not arrive ahead of when the Member can use it.",
        boldFragments: ["Confirm the procurement timeline.", "8-12 weeks", "6-10 weeks"],
      },
      {
        text: "Hand off to commercial credit underwriting if the deal warrants it. Fleet expansions over $250K typically need commercial credit underwriting involvement. Initiate the handoff with notes on operational timing and CPA coordination.",
        boldFragments: ["Hand off to commercial credit underwriting if the deal warrants it.", "$250K"],
        ctaEvidenceRef: "specialist_handoff_initiated",
      },
      {
        text: "Stay connected through the operational milestones. First truck delivery. First new technician's first day. First month operating at expanded capacity. Maintenance-services Members value bankers who stay with them through the transition.",
        boldFragments: ["Stay connected through the operational milestones."],
      },
    ],
  },

  // ── Section 2.3 — Specialty manufacturer ──
  // Cygnus's primary Track is now SBA 504. Specialty-manufacturer Coach
  // content reflects that throughout.
  [SPECIALTY_MANUFACTURER]: {
    // 2.3.1 — Discover
    discover: [
      {
        text: "Map the decision-process first. Specialty-manufacturer financing decisions involve board approval, CFO or controller analysis, founder authority, and often outside advisors. Ask early: “Who needs to be part of this conversation? What's the typical board cadence for capital decisions?”",
        boldFragments: ["Map the decision-process first."],
        ctaEvidenceRef: "decision_maker_mapping",
      },
      {
        text: "Find out if they're going to occupy the building themselves. This is the structural question that decides whether SBA 504 fits. Owner-occupied facilities are eligible for SBA 504; investment-positioned ones aren't. Don't assume — ask.",
        boldFragments: ["Find out if they're going to occupy the building themselves."],
        ctaEvidenceRef: "FACTOR-029",
      },
      {
        text: "Listen for anchor-customer growth signals. Specialty-manufacturer capacity decisions usually trace to a specific customer commitment — a preferred-supplier announcement, a multi-year volume commitment, capacity-reservation conversations. Capture these as Triggers.",
        boldFragments: ["Listen for anchor-customer growth signals."],
        ctaEvidenceRef: "FACTOR-024",
      },
      {
        text: "Capture how they describe the floor-space constraint. Specialty-manufacturer Members talk about capacity in square footage, production-line count, or specific equipment-housing limits. The exact framing matters for the facility-acquisition conversation. Capture verbatim.",
        boldFragments: ["Capture how they describe the floor-space constraint."],
      },
      {
        text: "Ask about regulatory requirements that constrain the facility decision. Specialty manufacturers often face FDA, EPA, OSHA, or sector-specific rules that shape which buildings work and which don't. Surface this early; it narrows the property options.",
        boldFragments: ["Ask about regulatory requirements that constrain the facility decision."],
      },
      {
        text: "Find out about prior banking relationships. Specialty-manufacturer Members often have history with multiple institutions. Past lending events shape how to position Blaze's role.",
        boldFragments: ["Find out about prior banking relationships."],
      },
    ],
    // 2.3.2 — Measure
    measure: [
      {
        text: "Get the specific employee count. SBA 504 has an employee-count threshold. “About 80” isn't enough — capture the actual number.",
        boldFragments: ["Get the specific employee count."],
        ctaEvidenceRef: "FACTOR-038",
      },
      {
        text: "Quantify capacity utilization in their own measure. Specialty manufacturers track production-line hours, machine utilization percentage, or output-units per shift. Ask how they measure it; capture in their terms.",
        boldFragments: ["Quantify capacity utilization in their own measure."],
        ctaEvidenceRef: "FACTOR-006",
      },
      {
        text: "Translate customer-growth volume into capacity demand. “If your anchor customer hits their stated growth, what does that require from you?” Specialty manufacturers usually have this number.",
        boldFragments: ["Translate customer-growth volume into capacity demand."],
      },
      {
        text: "Confirm annual revenue band. SBA 504 has revenue thresholds for eligibility. Capture which tier the Member falls into.",
        boldFragments: ["Confirm annual revenue band."],
      },
      {
        text: "Get the full acquisition cost broken into the SBA 504 pieces. Members need to see how the structure works: the bank covers 50% (first-lien position), the CDC covers 40% (second-lien position with longer fixed-rate terms), the borrower covers 10% as equity. Capture the total project cost and walk through the split.",
        boldFragments: ["Get the full acquisition cost broken into the SBA 504 pieces.", "50%", "40%", "10%"],
        ctaEvidenceRef: "FACTOR-035",
      },
      {
        text: "Build the financing-scenario model with the SBA 504 alongside alternatives. When owner-occupancy permits both, specialty-manufacturer Members want to see SBA 504 next to conventional CRE. The CFO will engage with the structural choice.",
        boldFragments: ["Build the financing-scenario model with the SBA 504 alongside alternatives."],
        ctaEvidenceRef: "model_produced",
      },
    ],
    // 2.3.3 — Consult
    consult: [
      {
        text: "Show the SBA 504 structure clearly. Three pieces: bank takes 50% in first-lien position, the CDC partner takes 40% in second-lien position with longer fixed-rate terms, the borrower puts in 10% equity. The structural advantages — longer-term fixed rate on the CDC piece, lower equity requirement than conventional CRE — become visible when the three pieces are drawn out.",
        boldFragments: ["Show the SBA 504 structure clearly.", "50%", "40%", "10%"],
      },
      {
        text: "Listen for board timing language. “We need to bring this to the board at our next meeting” tells you the timeline. Capture as Indecision with the timeline reference.",
        boldFragments: ["Listen for board timing language."],
        ctaEvidenceRef: "decision_maker_mapping",
      },
      {
        text: "Capture multiple reactions across the conversation. Specialty manufacturers react differently to operational fit (does the banker understand the business?), financial fit (rate, terms, covenants), structural fit (does SBA 504 actually work for this situation?), and relationship fit (specialist coordination, decision-timeline match). Capture each.",
        boldFragments: ["Capture multiple reactions across the conversation."],
        ctaEvidenceRef: "reaction_captured",
      },
      {
        text: "Walk through specialist coordination during this phase, not at Navigate. SBA 504 needs a CRE specialist, an SBA specialist on the bank side, and the CDC partner on the SBA side. The CDC partner is structurally distinct from conventional CRE — explain it explicitly rather than assuming the Member knows.",
        boldFragments: ["Walk through specialist coordination during this phase, not at Navigate."],
        ctaEvidenceRef: "specialist_handoff_initiated",
      },
      {
        text: "Surface the relationship preference if it's there. Specialty manufacturers with long Blaze relationships often state directly: “We'd like the next round to be with you.” Capture that statement when it comes.",
        boldFragments: ["Surface the relationship preference if it's there."],
      },
    ],
    // 2.3.4 — Navigate
    navigate: [
      {
        text: "Hand off to the SBA specialist with the full context package. The SBA specialist receives everything captured — the Track context, the Signals, the financing scenarios, the board timeline, the owner-occupancy confirmation. Make the handoff a scheduled working session with all parties (CRE specialist, SBA specialist, CDC partner contact, the Member's CFO or controller), not an email introduction.",
        boldFragments: ["Hand off to the SBA specialist with the full context package."],
        ctaEvidenceRef: "specialist_handoff_initiated",
      },
      {
        text: "Help with the board-presentation timeline. Specialty-manufacturer Members often need a banker-supported board presentation. The SBA 504 structure needs to be in those materials. Offer to coordinate.",
        boldFragments: ["Help with the board-presentation timeline."],
      },
      {
        text: "Track the external-advisor reviews. Legal counsel, the CPA, and sometimes an investment banker review the structure before commitment. The CDC partner adds documentation requirements that produce additional review touchpoints. Track each.",
        boldFragments: ["Track the external-advisor reviews."],
      },
      {
        text: "Confirm the post-commitment relationship plan. Specialty manufacturers typically continue treasury, working capital, and relationship deepening after the SBA 504 closes. Surface what the relationship looks like 12 months out.",
        boldFragments: ["Confirm the post-commitment relationship plan."],
      },
      {
        text: "Plan for the longer SBA 504 timeline. SBA 504 closings typically take 90-150 days from Navigate to closing — longer than conventional CRE because of CDC documentation. Stay in oversight role while the specialists drive structure execution.",
        boldFragments: ["Plan for the longer SBA 504 timeline.", "90-150 days"],
      },
    ],
  },
};

/**
 * Look up coach bullets for a (Member Type, objective) tuple. Returns
 * the Member-Type-specific bullets when authored; falls back to generic
 * bullets otherwise. Sidebar coach surface renders these as discrete
 * verb-led bullets under per-objective section headers.
 */
export function coachBullets(
  objective: V2Objective,
  memberTypeName: string | null,
): CoachBullet[] {
  if (memberTypeName && MEMBER_TYPE_COACH[memberTypeName]) {
    return MEMBER_TYPE_COACH[memberTypeName][objective];
  }
  return GENERIC_COACH_BULLETS[objective];
}
