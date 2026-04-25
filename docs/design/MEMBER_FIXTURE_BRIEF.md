# MEMBER_FIXTURE_BRIEF.md

**Design brief for the three Member fixtures in the Blaze Member Signals demo. This is the substantive design content CC translates into seed data. Read this end-to-end before authoring any fixture records.**

---

## 1. Purpose and how to use this document

This document specifies three Member fixtures that together demonstrate the full range of the Blaze Member Signals system across business growth stages. Each Member is designed to exercise different parts of the data model, surface different patterns of consultative banking work, and tell a distinct narrative arc that lands with the EVP of Lending audience.

CC's job: translate this design brief into seed data that conforms to the Data Framework specification (`docs/design/03_Data_Framework.docx`). Where this brief and the Data Framework conflict on field names or types, the Data Framework wins. Where this brief and the Data Framework conflict on substantive content, this brief wins.

Where this brief is silent, log to OPEN_QUESTIONS rather than inventing.

### 1.1 Demo "now" — temporal anchor

Set the demo's current date as **2026-04-25**. All conversation timestamps should be relative to this anchor:

- Jenny's Catering — current featured conversation: **2026-04-08** (~2.5 weeks ago)
- Northland Heating & Cooling — current featured conversation: **2026-04-15** (~10 days ago)
- Cygnus Bioscience — current featured conversation: **2026-04-21** (~4 days ago)

This staggers activity across the three Members so the demo feels like a real banker's book in active use, with different relationships at different points in their arc.

### 1.2 Naming the businesses

Three deliberate stylistic choices in the Member names:

- **Jenny's Catering** — a person's name in the business name. Common for very small owner-operator businesses. Conveys "this is a person's livelihood."
- **Northland Heating & Cooling** — a regional descriptor + service category. Common for established trades. Conveys "this is a real local business with a service area."
- **Cygnus Bioscience** — a name from the technical/scientific register (Cygnus is a constellation). Conveys "this company sells to sophisticated B2B customers and presents that way."

These naming choices reinforce the growth-stage progression visually before any data is read.

---

## 2. Cross-cutting reference data needed

Before any Member fixture is authored, the supporting reference data must exist. These records must be created with full descriptions per Semantic Discipline.

### 2.1 Banker entities

Three Banker records are required:

| Field | Scott Brynjolffson | Marcus Webb | Priya Patel |
|---|---|---|---|
| display_name | Scott Brynjolffson | Marcus Webb | Priya Patel |
| roles | [primary_banker] | [commercial_re_specialist] | [growth_lead] |
| status | active | active | active |
| external_user_id | scott.b | marcus.w | priya.p |

Scott is the primary banker for all three Members. Marcus is the CRE specialist who receives a handoff in the Cygnus arc. Priya is the Growth lead — she does not appear in any Member fixture directly, but she's the implicit author/promoter of the canonical Growth tracks and Member Types.

### 2.2 Industry Family entries

Three Industry Family records:

**Event-driven services**
- *Description:* "Service businesses whose revenue follows discrete events rather than ongoing service relationships. Includes catering, florists, event planners, photographers, and similar businesses. Characterized by lumpy event-driven revenue, perishable inventory exposure, surge labor needs, and seasonal concentration around weddings, corporate events, and holiday cycles."
- *NAICS codes:* ['72232', '45311', '71139']
- *Size band thresholds:* solo (1 employee), small (2-10), mid (11-50), larger (51+)

**Trades and construction**
- *Description:* "Service businesses providing skilled trade work for residential and light-commercial customers. Includes HVAC, electrical, plumbing, general contracting, landscaping, and similar trades. Characterized by recurring service revenue plus project revenue, seasonal demand patterns, capital-intensive equipment and vehicle fleets, and growth constrained by skilled-technician availability."
- *NAICS codes:* ['238220', '238210', '238110']
- *Size band thresholds:* solo (1 employee), small (2-10), mid (11-30), larger (31+)

**Specialty manufacturing**
- *Description:* "B2B manufacturers producing precision components, contract-manufactured products, or specialty inputs for larger downstream manufacturers. Includes precision machining, microfluidics, specialty chemicals, medical device subassemblies, and similar specialty manufacturing. Characterized by concentrated B2B customer bases under multi-year contracts, capital-intensive operations requiring periodic facility and equipment investment, regulatory and qualification burden, and steady but capital-constrained growth."
- *NAICS codes:* ['332710', '339113', '325413']
- *Size band thresholds:* solo (n/a), small (1-25), mid (26-100), larger (101+)

### 2.3 Topic taxonomy entries

The following Topics must exist in the canonical taxonomy with full descriptions. Display names are banker-facing per Semantic Discipline; canonical_tag values are stable internal identifiers per Data Framework §5.1.

**Blockers:**

- `blocker.cash_flow_seasonal` — display "Seasonal cash flow stress"
  - *Description:* "Revenue follows a predictable annual peak-and-trough pattern, with intervening periods where operating costs continue but income is significantly reduced. Distinct from cash_flow_receivables (timing-driven) and cash_flow_growth (expansion-driven). Common in event-driven services, hospitality, and tourism."
- `blocker.receivables_timing` — display "Slow customer payments"
  - *Description:* "Customers consistently pay later than invoiced terms, creating cash flow strain even when overall revenue is healthy. Often involves anchor-client concentration where one or two customers' payment behavior dominates working capital needs."
- `blocker.capacity_constrained` — display "Capacity below demand"
  - *Description:* "Business is turning away work or losing growth opportunities because production, dispatch, or service capacity cannot meet demand. Typical in trades during peak season and in manufacturing approaching utilization ceilings."
- `blocker.customer_concentration` — display "Customer concentration risk"
  - *Description:* "A small number of customers represent a large share of revenue, creating vulnerability if any one relationship changes materially. Common in B2B specialty manufacturing where qualification cycles favor incumbent suppliers."

**Triggers:**

- `trigger.customer_volume_commitment` — display "Customer growth commitment"
  - *Description:* "An existing customer has indicated forthcoming volume growth, creating both opportunity (revenue expansion) and pressure (capacity to fulfill). Often the precipitating event for capacity-expansion conversations."
- `trigger.capacity_expansion_evaluation` — display "Evaluating capacity expansion"
  - *Description:* "Member is actively evaluating a major capacity expansion — facility, equipment, or fleet — typically as a multi-quarter strategic decision rather than an acute response. The bank's role is to earn the right to be the financing partner before the formal evaluation begins."
- `trigger.lease_expiration` — display "Lease expiration approaching"
  - *Description:* "An existing lease (facility, equipment, vehicle) is approaching expiration, forcing a renew-or-replace decision. Often a financing trigger for ownership conversion or upgrade."
- `trigger.equipment_qualification_window` — display "Equipment qualification window"
  - *Description:* "A new piece of production equipment requires customer qualification or regulatory validation before it can generate revenue. Creates a financing window where capital is deployed but revenue is delayed."

**Goals:**

- `goal.fleet_expansion` — display "Fleet expansion"
  - *Description:* "Member intends to add vehicles or expand fleet capacity, typically driven by service-area expansion, capacity constraints, or modernization needs."
- `goal.facility_expansion` — display "Facility expansion"
  - *Description:* "Member is planning a major facility investment — new building, addition, or significant renovation — typically a multi-year capital event."
- `goal.customer_growth` — display "Customer base growth"
  - *Description:* "Member has indicated intent to grow their customer base, either by adding new customers or deepening existing ones. Often surfaces in routine relationship conversations as forward-looking commentary."
- `goal.facility_ownership` — display "Move from leasing to owning"
  - *Description:* "Member is considering or planning a transition from leasing their primary facility to owning it. Common in established small-to-mid businesses approaching their second decade."

**Indecisions:**

- `indecision.authority` — display "Needs another decision-maker's input"
  - *Description:* "Member is unable to commit because a key decision-maker is not in the conversation — a spouse, business partner, board member, or other stakeholder. Resolution requires bringing the missing party into a subsequent conversation. Distinct from indecision.information (which is about data) and indecision.outcome_uncertainty (which is about confidence in the outcome)."
- `indecision.information` — display "Needs to verify with their advisor"
  - *Description:* "Member is unable to commit because they want to verify the financial or operational implications with a trusted advisor — typically a CPA, attorney, or business mentor. Resolution requires the bank providing materials the member can share with their advisor and following up after that conversation."
- `indecision.outcome_uncertainty` — display "Uncertain about the outcome"
  - *Description:* "Member is unable to commit because they're not confident the proposed action will produce the intended outcome. Resolution often requires de-risking through phased structure, smaller pilot, or comparable case studies."

### 2.4 Product catalog entries

The following Products must exist with descriptions:

- **Business Checking** — Routine deposit account for business operations. Routing owner: consumer.
- **Business Visa** — Small-business credit card with employee cards available. Routing owner: cards.
- **Commercial Credit Card** — Mid-market commercial card with treasury integration. Routing owner: cards.
- **Working Capital Line of Credit** — Revolving credit facility for cash flow smoothing. Routing owner: commercial_re (general commercial banking; sized to relationship).
- **Equipment Loan** — Secured term loan for equipment acquisition. Routing owner: commercial_re.
- **Vehicle/Fleet Loan** — Secured term loan for vehicles, including fleet structures. Routing owner: commercial_re.
- **Treasury Services** — Sweep accounts, lockbox, ACH origination, positive pay. Routing owner: treasury.
- **Commercial Real Estate Term Loan** — Large secured term loan for facility acquisition or construction. Routing owner: commercial_re.
- **FX Services** — Foreign exchange and international wire services. Routing owner: treasury.

Each gets a description per Semantic Discipline. Skip the descriptions here for brevity; CC writes them following the pattern in the Data Framework.

### 2.5 Rule entries

Three Rules must exist to surface the three Growth tracks:

**Rule 1: Surface seasonal cash flow track for small caterers**
- Conditions: Member fits Member Type "Small Caterer · Starting" AND has active Signal with topic blocker.cash_flow_seasonal AND does not currently hold a Working Capital Line of Credit
- Output Growth track: "Smooth seasonal cash flow with LOC for small caterer"
- Confidence band: high
- Description: "Surfaces the seasonal smoothing track when a small caterer shows active seasonal cash flow stress and has no existing LOC. The combination is a high-confidence indicator that the seasonal smoothing reframe is appropriate."

**Rule 2: Surface fleet financing track for growing trades**
- Conditions: Member fits Member Type "HVAC & Trades · Growing" AND has active Signal with topic blocker.capacity_constrained
- Output Growth track: "Unlock growth capacity with fleet financing"
- Confidence band: high
- Description: "Surfaces the fleet financing track when a growing trades business shows capacity constraint signals. Pre-existing equipment loans or vehicle financing do not block this rule — the assumption is that growth has outpaced earlier capital deployment."

**Rule 3: Surface capital event track for established manufacturers**
- Conditions: Member fits Member Type "Specialty Manufacturer · Established" AND has active Signal with topic trigger.capacity_expansion_evaluation OR trigger.customer_volume_commitment
- Output Growth track: "Earn the capital event with the right team in the room"
- Confidence band: medium
- Description: "Surfaces the coordinated commercial banking track when an established manufacturer shows capital-event signals. Confidence is medium rather than high because the signal could lead to either a banking opportunity or a confirmation that the customer is using another bank — the track's job is to discover which."

---

## 3. Member 1 — Jenny's Catering

### 3.1 Member Type — Small Caterer · Starting

- *Name:* Small Caterer · Starting
- *Industry Family:* Event-driven services
- *Stage:* starting
- *Size band:* small (2-10 employees)
- *Description:* "Small event-driven catering businesses in their first three years of operations, typically with one to ten employees and revenue under $1.5M. These members face lumpy event-based revenue, perishable inventory risk, surge labor needs, and chronic working capital strain during slow seasons. They are typically owner-operated with the principal personally guaranteeing most credit decisions."
- *Characteristic blockers:* blocker.cash_flow_seasonal, blocker.receivables_timing
- *Characteristic triggers:* trigger.lease_expiration
- *Characteristic goals:* goal.facility_ownership
- *Typical products:* Business Checking, Business Visa, Working Capital LOC
- *Default Growth tracks:* "Smooth seasonal cash flow with LOC for small caterer"

### 3.2 The Member

- *Legal name:* Jenny's Catering LLC
- *Doing business as:* Jenny's Catering
- *Industry family:* Event-driven services
- *Stage:* starting
- *Size band:* small
- *Member Type:* Small Caterer · Starting
- *Primary banker:* Scott Brynjolffson
- *Tenure started:* 2023-06-15 (3 years with Blaze)
- *Owner:* Jenny Patel (single owner-operator; spouse is involved in financial decisions but not in operations)
- *Location:* Plymouth, MN
- *Employees:* 6 (Jenny + 5 part-time/seasonal)
- *Revenue:* approximately $720K trailing twelve months
- *Currently holds:* Business Checking, Business Visa
- *Does not hold:* any line of credit, term loans, real estate financing

### 3.3 Conversation history

Five Conversations on record. The most recent (April 2026) is the featured conversation that produces the current active Signals and ActionCards.

| Date | Type | Channel | Sentiment | Notes |
|---|---|---|---|---|
| 2023-06-15 | onboarding | in_person | receptive | Account opening; Visa application initiated |
| 2024-03-12 | check_in | call | receptive | Year-end review; Jenny mentioned "winter was tough" but didn't elaborate |
| 2024-09-08 | check_in | in_person | cautious | Visa limit increase request approved; Jenny mentioned spouse helps with books |
| 2025-12-04 | service | call | uncertain | Inquiry about late-paying corporate client; Scott offered guidance, no track run |
| **2026-04-08** | **check_in** | **in_person** | **receptive** | **The featured conversation. Full Growth track run.** |

The 2024-03 and 2025-12 conversations are particularly important context: they show that the seasonal cash flow stress was *visible in the system* across multiple touches but never properly diagnosed and quantified until April 2026. This is the teaching moment for the EVP demo — the system catches what gets missed in routine relationship banking.

### 3.4 The featured conversation — 2026-04-08

**Setup:** Scott met with Jenny for a 30-minute check-in. Jenny mentioned that last month was rough on cash flow because a corporate client paid 45 days late on a large event. Scott ran the canonical Growth track.

**Growth track:** Smooth seasonal cash flow with LOC for small caterer

**Growth step executions** (4 steps in sequence):

**Step 1 — Ask: "Surface seasonal cash flow stress"**
- *step_shape:* ask
- *Captured data:*
  - signal_type: blocker
  - topic_id: ref to blocker.cash_flow_seasonal
  - severity: painful
  - their_words: "this corporate client paying late really hit us, and our slow months are tough as it is"
  - recency: acute_recent
  - confidence: member_stated

**Step 2 — Size: "Quantify the seasonal impact"**
- *step_shape:* size
- *Captured data:*
  - parent_signal_id: ref to the Signal produced in Step 1
  - magnitude: 12000
  - unit: dollars
  - frequency: quarterly
  - feeling: frustrated
  - quantification_confidence: banker_estimated_from_cues

**Step 3 — Show: "Render seasonal smoothing chart"**
- *step_shape:* show
- *Captured data:*
  - artifact_id: ref to "Seasonal cash flow smoothing chart"
  - parameters_used: { revenue_band: "$500K-$1M", monthly_low: 35000, monthly_high: 95000, proposed_loc_size: 75000 }
  - member_reaction: engaged
  - followup_questions_asked: ["size", "rate", "flexibility"]
  - shared_afterward: true
  - their_words: "this is exactly what I needed to see — wow"

**Step 4 — Resolve: "Capture closure"**
- *step_shape:* resolve
- *Captured data:*
  - resolution_type: indecision
  - indecision_type: authority
  - next_step_description: "Send Jenny the parameterized chart by email; offer joint call with her spouse next week"
  - next_step_owner_id: Scott Brynjolffson
  - due_date: 2026-04-22 (14 days after the conversation)
  - member_stated_reason: "I want to talk to my husband before we commit to anything this size"

**Conversation metadata:**
- *meeting_type:* check_in
- *channel:* in_person
- *sentiment:* receptive
- *moment_quote:* "this is exactly what I needed to see — wow"
- *banker_note:* "Husband is the financial decision-maker; include him next time"
- *duration_min:* 32

### 3.5 The Artifact — Seasonal cash flow smoothing chart

- *Name:* Seasonal cash flow smoothing chart
- *Type:* chart
- *Description:* "Compares twelve months of business cash flow with and without a working capital line of credit, parameterized by the member's own revenue band and seasonal pattern. Designed to make the seasonal smoothing benefit visually obvious without claiming any specific outcome. The reframe: a properly-sized LOC turns lumpy revenue into smooth cash flow, at a cost typically far below the cost of declined opportunities or stress-driven decisions during slow months."
- *Parameters accepted:* revenue_band, monthly_low, monthly_high, proposed_loc_size
- *Compliance status:* approved
- *Last reviewed:* 2025-08-15
- *Reviewed by:* Compliance reviewer (placeholder)
- *Shareable:* true

**Visual rendering:** Two-line chart over 12 months. Line 1 (cash position without LOC) dips below zero in the slow months. Line 2 (cash position with LOC, parameterized) stays above zero throughout, with shaded area showing LOC utilization. Use Recharts. Apply Blaze chart palette per BLAZE_STYLE_GUIDE.md §9 (with-LOC line in burnished orange #B45F26, without-LOC line in body grey #4F5052).

### 3.6 Active Signals on Jenny's record

After the April 8 conversation, Jenny has these active Signals:

1. **Seasonal cash flow stress** (from Step 1) — type: blocker, severity: painful, recency: acute_recent, quantified at $12K/quarter via Step 2
2. **Spousal authority indecision** (from Step 4) — type: indecision, indecision_type: authority, severity: manageable
3. **Late-paying corporate client** (carried forward from Dec 2025 conversation) — type: blocker, topic: blocker.receivables_timing, severity: manageable, recency: ongoing

### 3.7 Open ActionCards on Jenny's record

One ActionCard generated by the April 8 conversation:

- *Type:* follow_up
- *Owner:* Scott Brynjolffson
- *Rationale:* "Jenny was 'leaning yes' on the $75K LOC after seeing the seasonal smoothing chart but wants to discuss with her husband before committing. De-risk by sending her the parameterized chart and offering a joint call next week."
- *Suggested opening:* "Hi Jenny — attaching the projection we walked through. Happy to set up a quick call with you and Mike if that would be helpful before deciding."
- *Due:* 2026-04-22
- *Status:* open

### 3.8 Recommendation on Jenny's record

One Recommendation, status surfaced:

- *Product:* Working Capital Line of Credit
- *Size proposed:* $75,000
- *Structure:* standard
- *Rationale text:* "Member showed acute seasonal cash flow stress quantified at approximately $12K per quarter. A $75K LOC sized at roughly one quarter of the slow-season revenue gap provides smoothing capacity with comfortable headroom. Member's existing Visa demonstrates payment discipline; primary guarantee from the owner is appropriate given the size."
- *Confidence band:* high
- *Response:* leaning_yes
- *Primary concern:* spouse (needs husband's input before committing)
- *Rule that fired:* Rule 1 (surface seasonal cash flow track for small caterers)

---

## 4. Member 2 — Northland Heating & Cooling

### 4.1 Member Type — HVAC & Trades · Growing

- *Name:* HVAC & Trades · Growing
- *Industry Family:* Trades and construction
- *Stage:* growing
- *Size band:* mid (11-30 employees)
- *Description:* "Established residential and light-commercial trade businesses (HVAC, electrical, plumbing) in their 8th-15th year of operations, with 10-30 employees and revenue between $2M and $10M. These members have proven their model and are at the inflection point where growth requires capital — fleet expansion, additional crews, equipment upgrades, sometimes second locations. Cash flow is steady and seasonal, but capital expenditure financing is the dominant capital question. Owner-operated with strong relationships in their service area; growth is constrained more by execution capacity than by demand."
- *Characteristic blockers:* blocker.capacity_constrained, blocker.cash_flow_seasonal, blocker.receivables_timing
- *Characteristic triggers:* trigger.lease_expiration
- *Characteristic goals:* goal.fleet_expansion, goal.facility_ownership
- *Typical products:* Business Checking, Business Visa, Working Capital LOC, Equipment Loan, Vehicle/Fleet Loan, eventually CRE
- *Default Growth tracks:* "Unlock growth capacity with fleet financing"

### 4.2 The Member

- *Legal name:* Northland Heating & Cooling Inc.
- *Doing business as:* Northland HVAC
- *Industry family:* Trades and construction
- *Stage:* growing
- *Size band:* mid
- *Member Type:* HVAC & Trades · Growing
- *Primary banker:* Scott Brynjolffson
- *Tenure started:* 2018-09-22 (8 years with Blaze; founded in 2014)
- *Owner:* Dan Reichart (single owner-operator)
- *Location:* Maple Grove, MN
- *Employees:* 14 technicians + 2 office staff
- *Revenue:* approximately $3.8M trailing twelve months, growing ~15% YoY
- *Currently holds:* Business Checking, Business Visa, Equipment Loan ($45K balance, 2 years remaining on a 2022 5-year loan)
- *Does not hold:* Working Capital LOC, Vehicle/Fleet financing

### 4.3 Conversation history

Four Conversations on record before the featured one.

| Date | Type | Channel | Sentiment | Notes |
|---|---|---|---|---|
| 2018-09-22 | onboarding | in_person | receptive | Account opening; first business banking relationship |
| 2024-08-12 | check_in | in_person | receptive | Annual check-in; Dan mentioned "really busy summer" |
| 2024-11-03 | service | call | receptive | Equipment loan payment review; routine |
| 2025-02-22 | opportunity | in_person | receptive | Visa limit increase approved; Dan mentioned needing one more truck |
| **2026-04-15** | **check_in** | **in_person** | **receptive** | **The featured conversation. Full Growth track run.** |

The 2024-08 and 2025-02 conversations matter for the same reason as Jenny's history: the capacity issue was *visible in the system* but never properly diagnosed. The system surfaces it on April 15, 2026, partly because the Insight Engine had been showing rising capacity-constrained signals across the HVAC × Growing Member Type, sharpening Scott's awareness when Dan walked in for what was nominally a personal vehicle loan inquiry.

### 4.4 The featured conversation — 2026-04-15

**Setup:** Dan came into the branch to ask about a personal vehicle loan for his daughter's first car. The receptionist routed him to Scott for a check-in. The daughter's car loan turned into a 30-minute conversation about the business.

**Growth track:** Unlock growth capacity with fleet financing

**Growth step executions** (4 steps in sequence):

**Step 1 — Ask: "Surface capacity constraint"**
- *step_shape:* ask
- *Captured data:*
  - signal_type: blocker
  - topic_id: ref to blocker.capacity_constrained
  - severity: painful
  - their_words: "we just couldn't get to all the calls last summer — felt awful turning people away"
  - recency: ongoing
  - confidence: member_stated

**Step 2 — Size: "Quantify declined work"**
- *step_shape:* size
- *Captured data:*
  - parent_signal_id: ref to the Signal produced in Step 1
  - magnitude: 70
  - unit: calls_declined
  - frequency: annual
  - feeling: frustrated
  - quantification_confidence: banker_estimated_from_cues
- *Banker mental note (not stored):* 70 calls × $700 average = ~$49K of lost revenue per peak season

**Step 3 — Show: "Render fleet expansion ROI"**
- *step_shape:* show
- *Captured data:*
  - artifact_id: ref to "Fleet expansion ROI projection"
  - parameters_used: { revenue_band: "$3M-$5M", current_fleet_size: 8, proposed_addition: 2, service_call_avg_value: 700, financing_term_months: 60, financing_rate_pct: 7.5 }
  - member_reaction: engaged
  - followup_questions_asked: ["structure_options", "rate", "speed_of_approval"]
  - shared_afterward: true
  - their_words: "I've been doing this all wrong — paying cash for used trucks while declining work"

**Step 4 — Resolve: "Capture closure"**
- *step_shape:* resolve
- *Captured data:*
  - resolution_type: indecision
  - indecision_type: information
  - next_step_description: "Send Dan the projection report; schedule call after he meets with his CPA"
  - next_step_owner_id: Scott Brynjolffson
  - due_date: 2026-04-29 (14 days after the conversation)
  - member_stated_reason: "I need to run the numbers by my accountant before I commit to something this size"

**Conversation metadata:**
- *meeting_type:* check_in
- *channel:* in_person
- *sentiment:* receptive
- *moment_quote:* "I've been doing this all wrong — paying cash for used trucks while declining work"
- *banker_note:* "Daughter's vehicle loan also approved separately; that conversation went well too"
- *duration_min:* 35

### 4.5 The Artifact — Fleet expansion ROI projection

- *Name:* Fleet expansion ROI projection
- *Type:* chart
- *Description:* "Compares 3 years of projected cash position under two paths: continuing to buy used vehicles with cash, versus financing two new vehicles to expand dispatch capacity. Shows captured-vs-declined revenue as a stacked overlay. The reframe is that revenue captured from previously-declined service calls outweighs the debt service cost of the financing — typically by year 2."
- *Parameters accepted:* revenue_band, current_fleet_size, proposed_addition, service_call_avg_value, financing_term_months, financing_rate_pct
- *Compliance status:* approved
- *Last reviewed:* 2025-11-20
- *Reviewed by:* Compliance reviewer (placeholder)
- *Shareable:* true

**Visual rendering:** Composed chart with two elements. Lower section: two-line cash position chart over 36 months — "current path" line in body grey #4F5052, "fleet financing path" line in burnished orange #B45F26. Upper section: stacked bar chart showing captured revenue (orange) vs. declined revenue lost (grey) per quarter. Use Recharts ComposedChart. Demonstrates that the demo can render multi-element charts, not just single-line ones.

### 4.6 Active Signals on Northland's record

After the April 15 conversation, Northland has these active Signals:

1. **Capacity constraint** (from Step 1) — type: blocker, severity: painful, recency: ongoing, quantified at 70 calls/year via Step 2
2. **Information indecision** (from Step 4) — type: indecision, indecision_type: information, severity: manageable

### 4.7 Open ActionCards on Northland's record

One ActionCard generated by the April 15 conversation:

- *Type:* follow_up
- *Owner:* Scott Brynjolffson
- *Rationale:* "Dan was leaning yes on fleet financing after seeing the ROI projection but wants to verify with his CPA before committing. De-risk by sending him the projection report and scheduling a follow-up call after his CPA meeting."
- *Suggested opening:* "Hi Dan — attaching the projection we walked through. Take it to your CPA and let's schedule a call once you've had that conversation. No pressure on timing."
- *Due:* 2026-04-29
- *Status:* open

### 4.8 Recommendation on Northland's record

One Recommendation, status surfaced:

- *Product:* Vehicle/Fleet Loan
- *Size proposed:* $180,000 (two new service vehicles at ~$90K each)
- *Structure:* standard (5-year term, secured by vehicles)
- *Rationale text:* "Member showed capacity constraint quantified at approximately 70 declined service calls per peak season, representing roughly $49K of annual lost revenue. Two new service vehicles at approximately $90K each, financed over 60 months at current rates, produce monthly debt service of approximately $3,600 — well below the lost revenue from declined calls. Member's existing Equipment Loan demonstrates payment discipline."
- *Confidence band:* high
- *Response:* leaning_yes
- *Primary concern:* cpa (needs accountant's verification before committing)
- *Rule that fired:* Rule 2 (surface fleet financing track for growing trades)

---

## 5. Member 3 — Cygnus Bioscience

### 5.1 Member Type — Specialty Manufacturer · Established

- *Name:* Specialty Manufacturer · Established
- *Industry Family:* Specialty manufacturing
- *Stage:* established
- *Size band:* mid (50-150 employees, but treated as "mid" in our 4-band scheme; could also be "larger" depending on threshold)
- *Description:* "Established specialty manufacturers (precision components, contract manufacturing, specialty chemicals, medical device subassemblies) typically 15-30 years old, with 50-200 employees and revenue between $15M and $80M. These members serve concentrated B2B customer bases — often Fortune 500 or large mid-market — under multi-year contracts. Cash flow is steady but capital-intensive; growth requires periodic large capital events for facility expansion, equipment qualification, or capacity additions. Owner-operated or owner-led, often with a small leadership team and a CFO. Banking needs are sophisticated: treasury, FX in some cases, term financing, and commercial real estate. The competition for these relationships is regional and national commercial banks, not credit unions; Blaze wins these by combining deep-relationship attentiveness with sophisticated commercial banking capability."
- *Characteristic blockers:* blocker.capacity_constrained, blocker.customer_concentration
- *Characteristic triggers:* trigger.customer_volume_commitment, trigger.capacity_expansion_evaluation, trigger.lease_expiration, trigger.equipment_qualification_window
- *Characteristic goals:* goal.facility_expansion, goal.customer_growth
- *Typical products:* Business Checking with treasury services, Commercial Credit Card, Working Capital LOC, Equipment Loans, CRE Term Loan, FX Services, Sweep accounts
- *Default Growth tracks:* "Earn the capital event with the right team in the room"

### 5.2 The Member

- *Legal name:* Cygnus Bioscience Inc.
- *Doing business as:* Cygnus Bioscience
- *Industry family:* Specialty manufacturing
- *Stage:* established
- *Size band:* mid (or larger, per CC's threshold call — flag in OPEN_QUESTIONS if ambiguous)
- *Member Type:* Specialty Manufacturer · Established
- *Primary banker:* Scott Brynjolffson
- *Tenure started:* 2006-04-10 (20 years with Blaze; founded in 2003)
- *CEO:* Margaret Sullivan (majority owner; small leadership team includes COO Tom Reyes, CFO not named, VPs not named)
- *Location:* St. Louis Park, MN
- *Employees:* 75
- *Revenue:* approximately $32M trailing twelve months, growing ~8% YoY
- *Capacity utilization:* ~85% on primary ISO 7 cleanroom production line
- *Customer concentration:* 3 customers represent ~62% of revenue; each has indicated 15-25% volume growth over the next 18 months
- *Currently holds:* Business Checking with full Treasury Services package, Commercial Credit Card, Working Capital LOC ($2M, currently drawn ~$400K)
- *Does not hold (with Blaze):* CRE Term Loan, Equipment Loans, FX Services
- *Notable historical fact:* The 2019 facility expansion was financed through a regional commercial bank because Blaze "wasn't really set up for that" at the time. Margaret still mentions this occasionally; it's a relationship sore point that the upcoming capital event is an opportunity to address.

### 5.3 Conversation history

Five Conversations on record before the featured one.

| Date | Type | Channel | Sentiment | Notes |
|---|---|---|---|---|
| 2006-04-10 | onboarding | in_person | receptive | Account opening as a deposit relationship |
| 2024-11-15 | check_in | in_person | receptive | Annual treasury review; Margaret mentioned customer growth indications |
| 2025-03-08 | service | call | receptive | LOC renewal at $2M; routine |
| 2025-06-22 | check_in | in_person | receptive | Margaret mentioned customer "platform consolidation" naming Cygnus a preferred supplier — captured as forward-looking trigger Signal but no track existed at the time |
| 2025-09-04 | service | in_person | receptive | Margaret introduced new COO Tom Reyes to Scott |
| **2026-04-21** | **check_in** | **in_person** | **receptive** | **The featured conversation. Full Growth track run.** |

The 2024-11 and 2025-06 conversations are particularly important. The June 2025 trigger Signal (customer volume commitment) sat in the system without a Growth track targeting it — until the Growth lead authored the capital-event track in early 2026 in response to the Insight Engine's coverage-gap view flagging this exact pattern. This is a teaching moment for the EVP demo: it shows the loop where the Insight Engine drives canonical content authoring, not just operational reminders.

The 20-year tenure is itself a system feature. The Member profile shows a continuous relationship; every prior Signal, every product opened, every conversation is in the timeline. This depth makes Cygnus visually distinct from Jenny (3-year tenure) and Northland (8-year tenure).

### 5.4 The featured conversation — 2026-04-21

**Setup:** Margaret came in for a scheduled annual treasury review. In the course of routine business, she mentioned the leadership team had been "doing some long-range planning" and would need to make a "big decision about the floor space" within the next two quarters. Scott recognized the opportunity and ran the appropriate Growth track rather than letting the comment pass.

**Growth track:** Earn the capital event with the right team in the room

**Growth step executions** (4 steps in sequence):

**Step 1 — Ask: "Probe the capital event evaluation"**
- *step_shape:* ask
- *Captured data:*
  - signal_type: trigger
  - topic_id: ref to trigger.capacity_expansion_evaluation
  - severity: painful
  - their_words: "we're going to need to make a big decision about the floor space within the next two quarters"
  - recency: ongoing
  - confidence: member_stated

**Step 2 — Ask (second instance): "Discover the timing driver"**
- *step_shape:* ask
- *Captured data:*
  - signal_type: trigger
  - topic_id: ref to trigger.customer_volume_commitment
  - severity: painful
  - their_words: "three of our biggest customers have given us volume forecasts that we just can't fulfill at our current capacity — and one of them has been getting nervous about us being a single-source"
  - recency: ongoing
  - confidence: member_stated

**Step 3 — Show: "Render the capital event partnership map"**
- *step_shape:* show
- *Captured data:*
  - artifact_id: ref to "Capital event partnership map"
  - parameters_used: { company_revenue_band: "$25M-$50M", expansion_size_estimate: "$4M-$7M", current_blaze_relationships: ["treasury", "loc"], cre_specialist_id: ref to Marcus Webb }
  - member_reaction: engaged
  - followup_questions_asked: ["timeline_for_decision", "blaze_capacity_for_deal_size", "marcus_webb_background"]
  - shared_afterward: false (used as conversational anchor in the meeting; not sent as takeaway)
  - their_words: "this is the conversation I've been wanting to have with you"

**Step 4 — Connect: "Hand off to Marcus Webb"**
- *step_shape:* connect
- *Captured data:*
  - connect_type: specialist_handoff
  - target_specialist_id: ref to Marcus Webb
  - trigger_reason: "Capital event evaluation underway; CRE and structured term financing required; bringing CRE specialist in early to earn the relationship before any RFP process. Member explicitly receptive to Blaze handling the deal."
  - member_receptiveness: eager

**Conversation metadata:**
- *meeting_type:* check_in
- *channel:* in_person
- *sentiment:* receptive
- *moment_quote:* "this is the conversation I've been wanting to have with you"
- *banker_note:* "Margaret still references the 2019 deal we lost; this is the chance to make that right"
- *duration_min:* 55

### 5.5 The Artifact — Capital event partnership map

- *Name:* Capital event partnership map
- *Type:* comparison (closest match in the schema; see implementation note below)
- *Description:* "A relationship map showing the banking products and specialist roles involved in a capital expansion event for an established commercial customer. Used in the moment to demonstrate Blaze's coordinated commercial banking capability — the reframe is that the capital event is not a single loan request but a coordinated multi-product engagement, and Blaze has the specialists to handle it. Designed for use with Specialty Manufacturer · Established and adjacent established Member Types."
- *Parameters accepted:* company_revenue_band, expansion_size_estimate, current_blaze_relationships, cre_specialist_id
- *Compliance status:* approved
- *Last reviewed:* 2026-02-12 (newer than the other two — reflecting that this Artifact was authored more recently)
- *Reviewed by:* Compliance reviewer (placeholder)
- *Shareable:* true (sometimes used as follow-up takeaway, but typically not in the moment)

**Visual rendering implementation note:** This Artifact is a schematic relationship diagram, not a financial chart. It's the hardest of the three to render. Suggested approach for CC:

- Center node: a card showing "Facility expansion · ~$5M" with the orange-headed panel pattern
- Surrounding nodes: 4-6 product cards (CRE Term Loan, Equipment Loan, expanded Working Capital LOC, Treasury services, FX) arranged radially or in a grid
- For each product card, a specialist name and headshot placeholder (Marcus Webb for CRE, Scott Brynjolffson for relationship coordination, treasury team contact for treasury)
- A timeline strip across the bottom showing typical phasing: evaluation (3 months) → financing structure (2 months) → construction (12-18 months) → operational ramp-up (6 months)
- Built with HTML + CSS (or a small custom React component) rather than Recharts, since Recharts doesn't natively render relationship diagrams

If this proves harder to render than expected, log to OPEN_QUESTIONS and propose either (a) simplifying to a labeled grid layout, or (b) substituting a more conventional financial projection chart. Discuss with Francisco before substituting.

### 5.6 Active Signals on Cygnus's record

After the April 21 conversation, Cygnus has these active Signals:

1. **Capacity expansion evaluation** (from Step 1) — type: trigger, severity: painful, recency: ongoing
2. **Customer volume commitment** (from Step 2) — type: trigger, severity: painful, recency: ongoing
3. **Customer concentration risk** (carried forward from June 2025) — type: blocker, topic: blocker.customer_concentration, severity: manageable, recency: ongoing
4. **Customer growth** (carried forward from November 2024) — type: goal, topic: goal.customer_growth, severity: manageable

### 5.7 Open ActionCards on Cygnus's record

Two ActionCards generated by the April 21 conversation:

**Card 1 — Handoff to Marcus Webb**
- *Type:* handoff
- *Owner:* Marcus Webb
- *Rationale:* "Capital event evaluation underway at Cygnus Bioscience. Member is at ~85% capacity utilization with 3 anchor customers indicating 15-25% volume growth over 18 months. Expansion size estimated at $4-7M. Member is explicitly receptive to Blaze handling the deal but is keeping options open. Bring CRE specialist in early to earn the relationship before any RFP process. Note: Cygnus financed their 2019 expansion through a regional commercial bank — Margaret still mentions this; this is an opportunity to make that right."
- *Suggested opening:* "Margaret, Scott told me you're starting to think about your floor space situation. I lead our commercial real estate and structured financing work — I'd love to spend 30 minutes understanding what you're weighing, with no expectation that we're the right answer. When works for you?"
- *Due:* 2026-04-26 (5 days after the conversation)
- *Status:* open

**Card 2 — Follow-up to Scott**
- *Type:* follow_up
- *Owner:* Scott Brynjolffson
- *Rationale:* "Confirm Marcus's introduction to Margaret landed cleanly. Check in with Margaret separately to see if there's anything else she wanted to discuss but didn't. The primary banker stays primary even when the specialist comes in."
- *Suggested opening:* "Margaret — wanted to follow up on our conversation last week. Did Marcus reach out? And is there anything else you've been thinking about that we should put on the next agenda?"
- *Due:* 2026-05-05 (14 days after the conversation)
- *Status:* open

### 5.8 Recommendation on Cygnus's record

One Recommendation, status surfaced:

- *Product:* Commercial Real Estate Term Loan
- *Size proposed:* not committed (range $4M-$7M based on conversation cues)
- *Structure:* standard (with possible interest rate hedging overlay for a deal this size)
- *Rationale text:* "Member is evaluating a major capacity expansion driven by anchor customer volume growth commitments. Current capacity at ~85% utilization on primary production line; expansion estimated at $4-7M including facility, equipment qualification, and validation. Member explicitly receptive to Blaze handling the deal. CRE specialist Marcus Webb engaged; relationship coordination by Scott Brynjolffson."
- *Confidence band:* medium
- *Response:* leaning_yes
- *Primary concern:* blaze_capacity_for_deal_size (Margaret's open question is whether Blaze can handle a deal this size with the sophistication needed)
- *Rule that fired:* Rule 3 (surface capital event track for established manufacturers)

---

## 6. Insight Engine implications

Three Member fixtures across three Member Types is thin substrate for cross-member analytics views. CC should build the Insight Engine views to render gracefully when a Member Type has only one Member — empty-state messaging, "1 member" pluralization, no division-by-zero in averages.

Specifically:

- **Signal volume and trend:** With one Member per Member Type, "rising in your cell" indicators won't trigger meaningfully. Show the absolute counts and let the demo viewer extrapolate. Privacy floor (cell size ≥ 5) means most cross-member views show "insufficient data" — that's correct behavior, but flag it visually as "this is what would normally show; the demo has only one Member per type."
- **Growth track performance:** With one run per track, performance metrics are technically computable but not statistically meaningful. Show the raw counts ("1 run, 0 funded outcomes yet"). Don't compute conversion rates from one data point.
- **Artifact effectiveness:** Same — one run per Artifact. Show reactions captured. Don't aggregate.
- **Indecision diagnostics:** Two indecisions across the three Members (Jenny: authority, Northland: information). One is committed/in-progress (Cygnus). This is enough variety to demonstrate the diagnostic categories, but again the "rates" are not statistically meaningful.
- **Forward pipeline:** Cygnus's two active triggers contribute meaningfully. Northland and Jenny don't have forward signals. The pipeline view will look thin but real.
- **Coverage gaps:** The most interesting Insight Engine view to populate. Synthesize a few "fake" coverage gaps that show the editor queue in operation — e.g., "Manufacturing × Established members have rising trigger.equipment_qualification_window signals (synthesized counts: 8) but no Growth track targets this combination." This populates the Growth lead's authoring queue. Flag to Francisco that this synthesizes counts; alternative is to show empty state and explain.

If CC has questions about how to populate the Insight Engine without over-faking data, log to OPEN_QUESTIONS.

---

## 7. Implementation notes for CC

### 7.1 Authoring sequence

Recommended order to author the fixtures:

1. **Reference data first.** Industry Family entries, Topic taxonomy entries, Product catalog, Banker entities, Member Type entries, Rule entries. Each gets a description.
2. **Member identity records.** Three Members with their basic identity (name, industry, stage, size, primary banker, tenure, products held).
3. **Conversation history without Growth steps.** The 4-5 prior Conversations per Member at lower fidelity — meeting type, channel, sentiment, sometimes a moment quote or banker note. No Growth steps run; just enough to populate timelines.
4. **Featured Conversations with full Growth step executions.** Each Member's most recent Conversation, with all four (or so) Growth step executions, captured_data, produced Signals, produced ActionCards, produced Recommendations.
5. **Artifacts.** Three Artifacts with parameter schemas and templates. Render each at least once to verify it works.
6. **Active state derivation.** Make sure Member.active_signal_count, Member.open_action_card_count, Member.last_touch_at are correctly derived.

### 7.2 Authoring discipline

- Every reference entity gets a description per Semantic Discipline. Skip none.
- Every captured_data jsonb validates against the corresponding Growth step's capture_schema.
- Every timestamp respects the demo "now" anchor (2026-04-25).
- No real PII. The customer names in Cygnus's customer concentration ("3 customers represent 62%") should remain anonymous — refer to them as "Customer A", "Customer B", "Customer C" if specificity is needed.
- The owner names (Jenny Patel, Dan Reichart, Margaret Sullivan, Tom Reyes) are placeholders. They should appear in fixture data exactly as written here for consistency with the worked example narrative, but they are not real people.

### 7.3 What's deliberately deferred from this brief

- **Other Members.** Three full-fidelity Members are the v1 commitment. No supporting Members. If time permits at end of build, revisit — but don't author them speculatively.
- **Other Growth tracks.** One canonical Growth track per Member Type. No alternative tracks, no draft tracks, no retired tracks. The single track per type is enough for the demo.
- **Other Artifacts.** Three Artifacts total. No additional charts or visuals beyond what's specified here.
- **Multi-meeting Growth track flows.** A Growth track in this brief is run end-to-end in a single Conversation. Real banking sometimes spreads a track across multiple conversations; v1 doesn't model this.

### 7.4 Open questions worth flagging during authoring

If any of these become blockers during fixture authoring, log to OPEN_QUESTIONS:

- The Cygnus Member's size_band — "mid" vs "larger" depends on threshold; Specialty manufacturing's threshold is 25/100 employees. At 75 employees, Cygnus is "mid" by that threshold.
- The Capital event partnership map Artifact rendering complexity — if it proves intractable in Recharts, propose alternatives.
- The Insight Engine's synthesized coverage-gap counts — flag if you'd rather show empty state.
- Any Topic, Product, or Rule that should exist but isn't specified in §2.

Stop and check in after reference data + Member identity records are authored, and again after the featured Conversations and their Growth step executions are committed. Don't push through to "demo complete" without checkpoints.

---

## 8. What this brief does and does not authorize

**This brief authorizes:**
- Authoring the three Member fixtures and all reference data per the specifications above
- Choosing Prisma model conventions, file organization, and seed-script structure that fit the locked stack
- Logging questions to OPEN_QUESTIONS when the brief is silent or ambiguous

**This brief does not authorize:**
- Adding additional Members, Member Types, Growth tracks, or Artifacts beyond what's specified
- Inventing substantive content (Growth step content, Artifact descriptions, conversation narratives) that's not in this brief
- Changing the demo "now" anchor or adjusting timestamps without flagging
- Substituting alternative consultative arcs without Francisco's approval

When in doubt, the conservative default is: build what's here, flag what's missing, propose extensions for review.
