# DEMO_RUNBOOK.md

**Pre-demo checklist + narrative arcs + talking points + backup plans for the Blaze Member Signals EVP demo.**

This runbook is for the day-of demo and the immediate hours before. Read it once before you start the demo. Skim the talking points the morning of.

---

## Pre-demo checklist

Run through this sequence the night before and the morning of.

### Environment

- [ ] **Production deployment URL:** `https://<project>.vercel.app` — populate after the first successful Vercel build (see Deployment walkthrough below).
- [ ] **Verify HTTPS access** from a network outside the demo location (laptop tethered to phone, for example).
- [ ] **ANTHROPIC_API_KEY** set in Vercel project env vars. Test with a quick `+ Insight` author flow on Cygnus or Northland; verify the matched-Pattern feedback returns within 5 seconds.
- [ ] **Browser zoom** at 100% (Cmd+0). Demo screenshots and visual proportions assume 100%.
- [ ] **Cache-busting**: hard-refresh (Cmd+Shift+R) once before the demo begins to flush any stale CSS from prior dev runs.

### Deployment walkthrough (one-time setup)

Sprint 6 wires SQLite for Vercel's read-only filesystem. The bundled snapshot at `prisma/seed.db` ships with the Lambda; on cold start, `lib/db-path.ts` copies it to `/tmp/blaze.db` so reads + writes both succeed for the Lambda instance's lifetime (writes vanish when Vercel recycles — accepted demo-phase constraint per OPEN_QUESTIONS Q-F7).

**Refresh the seed snapshot before deploying:**

```sh
pnpm db:reset       # re-seeds dev.db from scratch
pnpm db:snapshot    # copies dev.db → prisma/seed.db
git add prisma/seed.db package.json next.config.ts vercel.json lib/db-path.ts .gitignore
git commit -m "Sprint 6: Vercel-ready SQLite snapshot"
git push origin main
```

**Vercel project setup (one-time):**

1. Sign in at <https://vercel.com> with the GitHub account that owns the repo.
2. **Add New… → Project**, select `blaze-member-signals-demo` from the GitHub list, click **Import**.
3. **Framework Preset:** Next.js (auto-detected). Leave Build/Output settings on defaults; `vercel.json` overrides any needed.
4. **Environment Variables** — add two:
   - `ANTHROPIC_API_KEY` = (paste the same value from local `.env`)
   - `DATABASE_URL` = `file:./prisma/seed.db`
5. Click **Deploy**. First build runs `pnpm install && prisma generate && next build` (~2-3 minutes).
6. When the build succeeds, Vercel surfaces the project URL (`https://<project-name>.vercel.app`). Paste it into the **Production deployment URL** checkbox above.

**Subsequent deploys:** push to `main` → Vercel auto-builds. If the seed schema changes, repeat the **Refresh the seed snapshot** step before pushing.

### Demo data

The seed produces four fixture Members. Verify all four are present and renderable:

- [ ] **Jenny's Catering** — `/v2/members/jenny` — event_services, TRACK-001 Working Capital LOC, "leaning yes / spouse pending"
- [ ] **Northland HVAC** — `/v2/members/northland` — maintenance_services, TRACK-002 Business Vehicle Loan, "leaning yes / awaiting advisor"
- [ ] **Cygnus Bioscience** — `/v2/members/cygnus` — specialty_manufacturer, TRACK-008 SBA 504, board pending
- [ ] **Riverside Catering** — `/v2/members/riverside` — event_services, TRACK-001 stage-skipping (visible on Stage-skip portfolio)

### Insight Engine

- [ ] **Lending product performance** — `/v2/insight-engine/tracks` — shows 8 Blaze offerings + 2 future-expansion grouping
- [ ] **Member portfolio** — `/v2/insight-engine/portfolio` — sorted oldest-touched first
- [ ] **Open threads** — `/v2/insight-engine/coverage` — Indecisions surfaced
- [ ] **Members who skipped earlier work** — `/v2/insight-engine/stage-skip` — Riverside Catering listed with "Discover" missing on Working Capital LOC

### Backup plan

If something fails during the demo, here's the recovery order:

| Failure | Recovery |
|---|---|
| LLM API unavailable | Insights save as `novel` state with graceful 5-second fallback. Demo continues; just narrate "this Insight is novel until a senior lender reviews it" — that's actually the intended Pilot routing path, so the failure mode IS demo-relevant content. |
| Demo dataset corrupts (won't happen with read-only EVP demo, but) | `pnpm exec tsx prisma/seed.ts` re-seeds cleanly. |
| Specific surface throws 500 | Pivot to a working surface. The four Member pages and four Insight Engine routes are independent — failure of one doesn't cascade. |
| Browser session expires / tab closes mid-demo | Re-open from `https://<production-url>/v2/members/cygnus`. State is server-rendered; no session loss. |

---

## Demo narrative arcs (suggested order)

The demo runs ~25-35 minutes depending on EVP engagement. Plan for: dashboard opening + one deep-dive Member + Insight Engine + one live Insight authoring. Expect the EVP to interrupt with questions; the architecture is meant to absorb that.

### 1. Open at the Insight Engine dashboard — `/v2/insight-engine` (5-8 min)

**Why open here:** the Insight Engine is the EVP-facing surface. Portfolio scale on first impression — $147M pipeline, 220 Members, 14 bankers, 28 branches — sets the conversation up correctly. Member-page deep dives come second.

**What to show:**

1. **Hero metrics strip** — six cards across the top.
   - Pipeline value $147M face (click → $55M weighted; explain the phase-progression weighting: Discover 10% · Measure 35% · Consult 60% · Navigate 85%).
   - Members in cultivation: **220** (216 synthetic Members + 4 fixture cultivation arcs).
   - Conversations this week: ~74. Sparkline shows 12-week trend.
   - Insights this week: ~55. Sparkline shows authoring momentum.
   - Avg Discover → Navigate: ~75 days.
   - Closed last 12 months: ~$73M / 100 deals.
2. **Filter tag row** — four visualization tags. Click through each:
   - **Phase funnel** (default) — 4-bar funnel with closed-12mo bar muted underneath. Click any phase to drill into the Member list.
   - **Lending product mix** — 10-Track treemap. Hover any cell for tooltip; click to drill into that Track's Member list. Per-Track distinct color palette.
   - **Geographic** — three-region alphabetical bar lists (Twin Cities Metro 20 · Northern MN 6 · Southern MN 2). Click any branch to drill into that branch's Member roster.
   - **Banker activity** — 14-banker × 90-day heatmap. Sorted by 90-day activity; click any cell to drill into "Members touched that day".
3. **Featured deal tile** — "Conversations that became deals". Auto-rotating 5-deal carousel. Each deal shows: first member signal verbatim, headline ($3.2M SBA 504 / 187 days), Pattern-content insights along the way (actual REFRAME / IMPLICATION text from the canonical library, not abstract labels), specialist coordination summary, originating banker.
4. **Synthetic Member click** — from any drill-down list, click a Member name. Members route to the closest fixture page (e.g., Cygnus for specialty_manufacturer / professional_services / healthcare_services) with a sample-arc notation banner: "Sample conversation arc — representative example for [Member-Type]". Dismissible.

**Talking points:**

- "$147M of active pipeline across 220 Members. The dashboard is filter-responsive — every metric and visualization recomputes for the active filter set, and the URL encodes state so any view is shareable as a link."
- "SBA 504 + CRE Term Loan together = 81% of pipeline value despite being 27% of Members. Bigger deals concentrate value; the dashboard surfaces that distribution without anyone running a report."
- "Future-expansion Tracks — Working Capital LOC and SBA 7(a) — render at the same scale as Blaze-active offerings. Bankers do the consultative work whether or not the product is in the catalog today. The architecture demonstrates pipeline value on products Blaze doesn't yet offer."
- "The featured deal tile shows specific deals with the actual Pattern content that drove the conversation. Day 8 reframe: 'When operational capacity caps demand, every customer the business turns away today is one a competitor builds a relationship with...' — that's the senior-lender voice surfacing during a junior banker's conversation."

### 2. Deep dive — Cygnus — `/v2/members/cygnus` (8-10 min)

**Why open with Cygnus:** strongest Track narrative. Demonstrates the full consultative arc end-to-end: anchor-customer growth Trigger → Discover work confirming owner-occupancy + capacity → Measure with $4M-$7M sized + 85% capacity utilization quantified → Consult with SBA 504 50/40/10 structure shown → Navigate with SBA specialist + CDC partner engaged + board pending.

**What to show:**

1. **Header strip:** Name, Member-Type ("Specialty manufacturer"), Track ("SBA 504"), key facts ($4M-$7M CRE need · capital event trigger · SBA + CDC partner engaged · last touch [recent]).
2. **Sidebar Lending product:** "SBA 504 · strong support". Click "compare to other lending products" briefly to show the Tracks-supported panel — banker can see why SBA 504 won over conventional CRE (owner-occupancy negative on TRACK-003).
3. **Discover popup:** click the dot. Show the Goal verbatim quote ("Grow alongside customer expansion"), the Trigger Signal, the captured factors. Hover a row to surface the "captured by Scott · via + Ask" metadata. Note that quotes get the same visual weight as Insights — this is by design.
4. **Lightbulb popover:** click the bulb icon on the Goal row. Show matched Patterns. Click "See all related insights ↓" to reveal remaining Track-relevant Patterns. **This is the Pattern library architecture in operation** — banker sees both what's tied to current Signals and what else the Pattern library has for this lending product.
5. **Measure popup:** show 88% capacity utilization, owner-occupancy confirmed, employee count, $4-7M sized. Three quantitative captures distinct (Sprint 5e Block F fix verified live).
6. **Consult popup:** the SBA 504 transaction roadmap artifact. Click "view ↗" on the artifact slot in sidebar OR on the Model row in the popup itself. **The roadmap is the Sprint 5d Block A.4 deliverable** — 8 stages, "Cygnus is here" marker on stage 3 (CDC partner introduction).
7. **Navigate popup:** Reaction (engaged, board-pending), specialist handoff in motion.

**Talking points:**

- "Member Signals captures consultative reasoning during conversation. Lending decisions and formal underwriting happen in the lending decisioning system. This is the front-end where the banker thinks with the Member."
- "Three-layer CTA derivation: missing template evidence → threshold-uplift → specialist handoff. The system suggests the next valuable thing to capture, in priority order."
- "Patterns are the institutional knowledge of the bank. Each has a senior-lender-authored reframe or implication question. Bankers can see them on every relevant Member without searching."

### 3. Walk through Northland — `/v2/members/northland` (5-7 min)

**Why Northland next:** different Member-Type, different Track, but parallel architecture. Shows the system isn't a one-trick demo.

**What to show:**

1. **Header strip:** Name, "Maintenance services", "Business Vehicle Loan", $180K fleet target.
2. **Discover popup:** "I came in to look at financing for my own truck because mine's done, but maybe what I really need is to think about the whole fleet." (Verbatim Member quote — this is the exact moment of consultative escalation.)
3. **Measure popup:** capacity utilization 88%, demand exceeding capacity Yes, fleet aging Yes, revenue trajectory 18% — distinct quantitative rows.
4. **Consult popup:** Fleet expansion ROI projection artifact. "leaning yes" Reaction with CPA-pending concern.

**Talking point:** "Same architecture as Cygnus. Different Member-Type, different lending product, different Track template, different Pattern set. The work each banker does in Member Signals is consistent across Member types."

### 4. Brief Jenny — `/v2/members/jenny` (3-5 min)

**Why Jenny third:** event_services Member, TRACK-001 Working Capital LOC. Note that Working Capital LOC is currently a future-expansion product for Blaze.

**What to show:**

1. Quick header pass.
2. Smoothing chart artifact (Apr 8 conversation, $48K slow-season gap, $75K LOC sized).
3. Indecision Signal: "I'd want my husband to look at this" — the verbatim quote of the household-decision moment. The Insight nested under it: "Shared decisions aren't a delay. They make the financing work better day-to-day because both decision-makers are on board."

**Talking point:** "Working Capital LOC isn't a Blaze offering today. The architecture handles future-expansion products — when Blaze adds LOC, this Track becomes operational; until then, it's matrix coverage. Senior lenders see Members where this lending product would help even when it's not in the catalog."

### 5. Insight Engine legacy portfolio surfaces (optional, 3-5 min)

**Note:** These four routes are the pre-dashboard portfolio views. The Sprint 7a dashboard absorbs their role for the EVP audience. Show them only if the EVP asks "what does the senior-lender daily workflow look like?" — they're operational queues rather than EVP visualizations.

**Why this matters:** the Member-page demo so far is one banker working with one Member at a time. The Insight Engine is the senior-lender / EVP view across the portfolio.

**What to show:**

1. **Lending product performance** (`/v2/insight-engine/tracks`): "Lending products Blaze offers (8)" + "Lending products Blaze doesn't offer today (2)". Per-Track Member distribution by capture density (A little / Some / A lot) and workflow state (Pending follow-ups / Captures over 90 days old / Open threads).
2. **Member portfolio** (`/v2/insight-engine/portfolio`): sorted oldest-touched first. Shows where the senior lender's attention should go.
3. **Open threads** (`/v2/insight-engine/coverage`): Indecisions with no follow-up Reaction. "What's holding things up" — the things the senior lender can act on this week.
4. **Members who skipped earlier work** (`/v2/insight-engine/stage-skip`): Riverside Catering listed. Coaching opportunity — the system flags Members where the banker started Consult-phase work without doing Discover-phase capture first.

**Talking point:** "Senior lenders don't have to ask each banker what's happening. The Insight Engine surfaces the operational picture — coverage, indecisions, stage-skipping — so coaching is targeted instead of generic."

### 6. Author one Insight live (3-5 min)

During the Cygnus or Northland walkthrough, click `+ Insight` on a Signal row.

**What to show:**

1. The Insight authoring form with Track pre-filled, Signal pre-filled, type dropdown (Reframe / Implication).
2. Type a banker observation. Example for Cygnus Goal: "If they're at 85% utilization with anchor-customer growth committed, the question isn't whether to expand — it's whether expansion timing matches the customer's ramp."
3. Click Save. **Watch the LLM matching fire live** — 5-second timeout with graceful fallback. Insight saves as `routine` (matched a Pattern) or `novel` (no match, senior-lender review).

**Talking point:** "Banker authorship gets cross-referenced against the Pattern library in real time. Routine matches confirm the banker's reasoning aligns with institutional knowledge. Novel insights flag for senior-lender review — that's how the Pattern library grows."

**Read-only persistence note:** Vercel's serverless runtime uses a read-only filesystem outside `/tmp`. The Insight save writes to the Lambda's `/tmp` SQLite copy and surfaces immediately in the popup; the change persists for the life of the Lambda instance but vanishes when Vercel recycles. For the EVP demo this is fine — the architecture beat is "the matching fires and surfaces feedback live", not "the change is durable across browser refreshes". If the EVP refreshes the page mid-demo and asks why their authored Insight is gone, the honest answer is: "Demo phase runs on SQLite, which Vercel treats as read-only at runtime. Pilot moves to Postgres." (Q-F7 in OPEN_QUESTIONS.)

---

## Talking points (cross-cutting)

**Architecture thesis:**
> Member Signals captures the consultative reasoning that happens during conversation — what the Member said, what the banker is interpreting, what evidence supports a recommendation. Lending decisions and formal underwriting happen in the lending decisioning system. This is the front-end where banker and Member think together.

**Member Signals' contribution to lending:**

- **Capture discipline.** Verbatim Member statements + structured factor captures + banker-authored Insights. Audit trail for compliance.
- **Pattern library.** 53 senior-authored Patterns across 10 lending products. Available to every banker on every Member where they're relevant.
- **CTA derivation.** Three layers of suggested next actions — missing template evidence, threshold-uplift, specialist handoff — keep banker focused on the next valuable capture.
- **Portfolio surfaces.** Senior-lender views across the roster: Lending product performance, Member portfolio (oldest-touched first), Open threads, Members who skipped earlier work.

**The four objectives:**

- **Discover:** what brought them in. The Trigger, the Goal, the verbatim statements.
- **Measure:** quantification. Numbers, percentages, sized magnitudes that ground the case.
- **Consult:** show the Member how the financing fits. Models, artifacts, projections. Reaction.
- **Navigate:** specialist handoffs, next-conversation scheduling, board timelines.

**Pilot extensions:**

- RBAC for portfolio surfaces (currently all bankers see all surfaces).
- Async workflow state recomputation at scale.
- Pattern library size bounds (currently 53; Pilot may grow to 100+).
- Track-aware factor filtering in + Quantify (37 factors organized into 6 categories — Pilot may filter per Track).
- HubSpot UI Extensions and Custom Objects integration.
- PostgreSQL migration (currently SQLite for demo).

---

## Demo data spot-checks (run morning-of)

```sh
# Re-seed cleanly (takes ~3 seconds)
pnpm exec tsx prisma/seed.ts

# Verify all four members + correct Tracks
pnpm exec tsx -e "
import Database from 'better-sqlite3';
const db = new Database('./dev.db');
console.log(db.prepare(\"SELECT mb.slug, mt.name as type, w.current_track_id FROM Member mb JOIN MemberType mt ON mt.id=mb.member_type_id LEFT JOIN MemberWorkflowState w ON w.member_id=mb.id\").all());
"
# Expected:
#   jenny    | Event services        | TRACK-001
#   northland| Maintenance services  | TRACK-002
#   cygnus   | Specialty manufacturer| TRACK-008
#   riverside| Event services        | TRACK-001
```

---

## After-demo

- [ ] Capture EVP feedback in `BUILD_LOG.md` as the post-demo entry.
- [ ] If the EVP greenlights Pilot, transition to `OPEN_QUESTIONS.md` Pilot deferrals as the working backlog.
- [ ] Decide on hosting target migration (SQLite → PostgreSQL) per CLAUDE.md Section 2.
