"use client";

/*
 * Capital event partnership map — Sprint 3 §D.
 *
 * Cygnus's Show-step Artifact, per MEMBER_FIXTURE_BRIEF.md §5.5. Unlike
 * the other two Artifacts (quantitative line/bar charts), this is a
 * relationship/sequence schematic — a small custom SVG showing the
 * milestone path a capital-event deal walks through Blaze, the partners
 * involved at each milestone, and Cygnus's current position on that path.
 *
 * Reframe the schematic communicates: "the capital event isn't a single
 * loan request — it's a coordinated multi-product engagement, and Blaze
 * has the specialists to handle it." Margaret's lingering memory of the
 * 2019 deal Blaze couldn't handle is the shadow this Artifact lifts.
 *
 * Sequence (six milestones, left → right):
 *   1. Initial conversation       — Scott (relationship banker)
 *   2. Specialist introduction    — Marcus (CRE specialist) — current position
 *   3. Capital event planning     — Marcus + Scott
 *   4. Site & underwriting        — CRE team
 *   5. Lending committee review   — Lending committee
 *   6. Closing & treasury         — Treasury team + Marcus
 *
 * Cygnus is currently between milestones 2 and 3 (Marcus has been
 * introduced — handoff ActionCard exists; capital event planning
 * conversation is upcoming). Highlight node 2 with the current-state
 * orange ring; nodes 3-6 render in the upcoming light-grey treatment;
 * node 1 renders in the completed orange treatment.
 *
 * Visual discipline (BLAZE_STYLE_GUIDE.md):
 *   - Burnished orange (#B45F26) for completed and current milestone
 *     nodes; their connecting line segments
 *   - Light cool grey (#E8EAEC) for upcoming milestone nodes; their
 *     connecting line segments
 *   - Current node has the same orange-ring treatment as TrackProgressDots
 *     (1.5px orange ring around a slightly smaller filled center) so the
 *     visual language carries between the two surfaces
 *   - Labels in 11px charcoal (current/completed) or grey-soft (upcoming)
 *   - Specialist names below labels in 10px italic body grey
 */

type MilestoneState = "completed" | "current" | "upcoming";

type Milestone = {
  label: string;
  specialist: string;
  state: MilestoneState;
};

const MILESTONES: Milestone[] = [
  { label: "Initial conversation", specialist: "Scott Brynjolfsson", state: "completed" },
  { label: "Specialist introduction", specialist: "Marcus Webb", state: "current" },
  { label: "Capital event planning", specialist: "Marcus + Scott", state: "upcoming" },
  { label: "Site & underwriting", specialist: "CRE team", state: "upcoming" },
  { label: "Lending committee review", specialist: "Lending committee", state: "upcoming" },
  { label: "Closing & treasury", specialist: "Treasury team + Marcus", state: "upcoming" },
];

// Layout: SVG canvas 720 × 280. Six nodes evenly distributed horizontally
// at y=110; labels stacked below at y=160 / 180. Connecting line segments
// run between adjacent node centers at y=110.
const CANVAS = { width: 720, height: 280 };
const NODE_Y = 110;
const NODE_RADIUS = 11;
const NODES_X = MILESTONES.map((_, i) => {
  const margin = 60;
  const span = CANVAS.width - 2 * margin;
  const step = span / (MILESTONES.length - 1);
  return margin + i * step;
});

const COLORS = {
  orange: "#B45F26",
  rule: "#E8EAEC",
  charcoal: "#1A1A1A",
  greyBody: "#4F5052",
  greySoft: "#888780",
};

function nodeFill(state: MilestoneState): string {
  return state === "upcoming" ? COLORS.rule : COLORS.orange;
}

function labelColor(state: MilestoneState): string {
  if (state === "current") return COLORS.charcoal;
  if (state === "completed") return COLORS.greyBody;
  return COLORS.greySoft;
}

export function CapitalEventPartnershipMap() {
  return (
    <div
      className="rounded border border-blaze-dust bg-white p-6"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <p className="mb-4 text-sm text-blaze-charcoal">
        How we coordinate a capital-event deal across the relationship
        banker, CRE specialist, lending committee, and treasury team.
      </p>
      <svg
        viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
        width="100%"
        role="img"
        aria-label="Capital event partnership map: six-milestone path from initial conversation to closing"
      >
        {/* Connecting line segments. A segment between two nodes shows the
            color of the prior node's state — completed/current segments
            render in orange; upcoming segments render in grey. */}
        {MILESTONES.slice(0, -1).map((m, i) => {
          const next = MILESTONES[i + 1];
          // Segment is "filled" (orange) only when both endpoints are
          // completed, OR when the prior endpoint is completed and the
          // next is current (the active edge of the journey).
          const filled =
            (m.state === "completed" && next.state === "completed") ||
            (m.state === "completed" && next.state === "current");
          return (
            <line
              key={`seg-${i}`}
              x1={NODES_X[i] + NODE_RADIUS}
              x2={NODES_X[i + 1] - NODE_RADIUS}
              y1={NODE_Y}
              y2={NODE_Y}
              stroke={filled ? COLORS.orange : COLORS.rule}
              strokeWidth={2}
            />
          );
        })}
        {/* Milestone nodes. Current state renders the same way as the
            current dot in TrackProgressDots: a thin ring around a
            slightly smaller filled center. */}
        {MILESTONES.map((m, i) => {
          const x = NODES_X[i];
          if (m.state === "current") {
            return (
              <g key={`node-${i}`}>
                <circle
                  cx={x}
                  cy={NODE_Y}
                  r={NODE_RADIUS}
                  fill="white"
                  stroke={COLORS.orange}
                  strokeWidth={2}
                />
                <circle
                  cx={x}
                  cy={NODE_Y}
                  r={NODE_RADIUS - 4}
                  fill={COLORS.orange}
                />
              </g>
            );
          }
          return (
            <circle
              key={`node-${i}`}
              cx={x}
              cy={NODE_Y}
              r={NODE_RADIUS - 3}
              fill={nodeFill(m.state)}
            />
          );
        })}
        {/* Labels — milestone label on top line; specialist on second
            line. Wrap manually with two tspans for the milestone label
            since SVG has no automatic wrapping. */}
        {MILESTONES.map((m, i) => {
          const x = NODES_X[i];
          const fill = labelColor(m.state);
          const weight = m.state === "current" ? 600 : 500;
          // Two-line label: split on the first space after position 12
          // chars to keep visual rhythm; otherwise keep on one line.
          const label = m.label;
          let line1 = label;
          let line2 = "";
          if (label.length > 14) {
            const spaceIdx = label.indexOf(" ", 8);
            if (spaceIdx > 0) {
              line1 = label.slice(0, spaceIdx);
              line2 = label.slice(spaceIdx + 1);
            }
          }
          return (
            <g key={`label-${i}`}>
              <text
                x={x}
                y={NODE_Y + 38}
                textAnchor="middle"
                fontSize={11}
                fontWeight={weight}
                fill={fill}
              >
                {line1}
              </text>
              {line2 && (
                <text
                  x={x}
                  y={NODE_Y + 52}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={weight}
                  fill={fill}
                >
                  {line2}
                </text>
              )}
              <text
                x={x}
                y={NODE_Y + (line2 ? 70 : 56)}
                textAnchor="middle"
                fontSize={10}
                fontStyle="italic"
                fill={COLORS.greySoft}
              >
                {m.specialist}
              </text>
            </g>
          );
        })}
        {/* "You are here" caret pointing to the current node, above
            it. Reads as a deliberate orientation cue rather than chrome. */}
        {(() => {
          const currentIdx = MILESTONES.findIndex((m) => m.state === "current");
          if (currentIdx < 0) return null;
          const x = NODES_X[currentIdx];
          return (
            <g>
              <text
                x={x}
                y={NODE_Y - 28}
                textAnchor="middle"
                fontSize={10}
                fontWeight={500}
                fill={COLORS.orange}
              >
                Cygnus is here
              </text>
              <polygon
                points={`${x - 4},${NODE_Y - 18} ${x + 4},${NODE_Y - 18} ${x},${NODE_Y - 12}`}
                fill={COLORS.orange}
              />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
