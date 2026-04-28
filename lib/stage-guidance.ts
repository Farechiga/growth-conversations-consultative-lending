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
 *   - "Small Caterer · Starting" — Jenny's Catering
 *   - "HVAC & Trades · Growing" — Northland HVAC
 *   - "Specialty Manufacturer · Established" — Cygnus Bioscience
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
  | "closed";

// Member Type names keyed exactly as seeded. Using the `name` string
// (rather than uuid id) keeps this lookup human-readable; the seed
// guarantees exactly these three values for the demo.
const SMALL_CATERER = "Small Caterer · Starting";
const HVAC_GROWING = "HVAC & Trades · Growing";
const SPECIALTY_MFG = "Specialty Manufacturer · Established";

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
  [SMALL_CATERER]: {
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
  [HVAC_GROWING]: {
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
  [SPECIALTY_MFG]: {
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
    closed:
      "The CRE Term Loan engagement has closed (funded, declined, or withdrawn). Future Growth Conversations may surface follow-on opportunities (expansion, treasury services, succession planning).",
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
  closed: "The engagement has concluded. Future Growth Conversations may surface follow-on opportunities.",
};

/**
 * Look up the guidance paragraph for a stage. Returns null if no Member
 * Type was supplied and no fallback applies — the caller can choose to
 * suppress the guidance area entirely in that case.
 *
 * Args:
 *   - memberTypeName: Member Type display name (e.g. "Small Caterer · Starting").
 *     Pass null when the Member has no resolved Member Type.
 *   - stepPhase: the canonical phase identifier.
 *   - stageLabel: the stage's display label ("Ask", "Ask 1", "Ask 2",
 *     "Size", "Show", "Resolve", "Connect", "Decision pending",
 *     "Funded", "Specialist engagement", "Closed"). Used to
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
