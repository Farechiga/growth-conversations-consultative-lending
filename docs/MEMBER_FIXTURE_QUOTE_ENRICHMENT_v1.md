# Member fixture quote enrichment — for Sprint 4.7 phase 2

**Verbatim Member quotes for the three demo fixtures (Jenny's Catering, Northland HVAC, Cygnus Bioscience), drafted by Claude in the existing fixture voice. Distributed across Goals, Blockers, Indecision, Reactions, and primary concerns. Francisco edits before this enters seed data.**

**Status:** Draft for Francisco's review. Once approved, the quotes feed Sprint 4.7 phase 2 as `direct_quote` field values on the relevant Signal, Recommendation, and (new) ReactionCapture entities.

**Authoring discipline:**
- Each quote should sound like a real owner-operator talking, not like marketing copy or a structured form response
- Quotes are typically 1-2 sentences, occasionally longer when the Member is venting or working through something out loud
- Avoid jargon the Member wouldn't use; avoid making them sound like the system
- Each Member has a distinct voice (Jenny is direct and weary; Dan is no-nonsense; Margaret is precise and considered)
- Compliance discipline: no quotes should reference protected-class characteristics (per COMPLIANCE.md). Where a Member's actual circumstance might invite a personal reference (e.g., Jenny's husband as co-decision-maker), the quote captures the *business decision-process fact*, not the personal characteristic.

---

## Jenny's Catering — Jenny Patel

**Voice notes:** Tired-but-determined small business owner. Has been running the catering company for ~7 years. Speaks plainly, uses short sentences, occasionally reveals the emotional weight of the business behind otherwise practical statements. Doesn't use financial jargon. Refers to her husband Mike when household financial decisions are involved (this is the `co_decision_maker_household` business fact, not a personal observation).

### Goals

**Goal: Smooth seasonal revenue with working capital** (existing fixture goal — captured 2024-03-12 originally, refreshed in the April 8 conversation)

> "I just want to be able to sleep through January."

> "Most years we make it. But there's always that stretch where I'm watching the bank account and just hoping nothing breaks down."

### Blockers

**Blocker: Slow customer payments** (Apr 8, 2026)

> "Some big accounts paying 60+ days now. Used to be 30."

> "Honestly the bigger the company, the slower they pay. The little weddings and birthdays — those people pay me the day of the event. The corporates take three months."

**Blocker: Seasonal cash flow stress** (refreshed Apr 8, 2026; original ~2024-03-12)

> "January and February kill us every year. Holiday parties end the second week of December and then nothing till spring."

### Indecision

**Indecision: Needs another decision-maker's input** (Apr 8, 2026; the captured Indecision Signal that maps to `co_decision_maker_household` primary concern)

> "I'd want Mike to look at the numbers before I sign anything that big. He handles the books with me."

> "We always make these calls together. He's not in the catering, but he's in the money side."

### Reactions

**Reaction to seasonal smoothing chart (engaged):**

> "That makes sense."

> "Oh, I see what you're doing — the line just covers the dip. That's actually... yeah, that's helpful to see it laid out."

**Reaction to the proposed $75K LOC (leaning yes):**

> "Seventy-five thousand. Okay. That's bigger than I was thinking but if I'm only drawing during the slow months..."

### Primary concern (open thread)

**Co-decision-maker household:**

> "Need to talk to my husband first. Big number."

---

## Northland Heating & Cooling — Dan Hirsch

**Voice notes:** Trades-business owner; second-generation. Direct, practical, uses HVAC and small-business language. Not financially sophisticated but knows his business cold. Tends to mention specifics (truck counts, technician hours, equipment costs). Comes across as competent and a little impatient. The April 15 conversation is the moment Scott connects an apparent personal-vehicle inquiry to the underlying business capacity issue.

### Goals

**Goal: Expand fleet capacity to take more service calls**

> "I've been turning down work since February. Not the big jobs — the bread-and-butter service calls. Couple new builds in town we said no to last month."

> "We could probably do another 20-25% volume if we had the trucks and bodies. Demand isn't the problem."

### Blockers

**Blocker: Truck fleet capacity at limit** (Apr 15, 2026)

> "Four trucks running route. Two of those are getting up there — one's a 2018, the dispatch panel is on its last legs."

> "I came in to look at financing for my own truck because mine's done, but maybe what I really need is to think about the whole fleet."

**Blocker: Technician hiring lag** (related signal; not blocker for vehicle financing decision but contextual)

> "Even if I had the trucks I'd need another tech. Trade school graduates don't grow on trees in this market. We're already paying above scale."

### Indecision

**Indecision: Personal vs. business financing structure** (Apr 15, 2026)

> "I always just kept the truck loan personal. My truck, my loan. But if it's running calls all day every day, that's a business asset, right?"

> "I don't know if I should be doing this through my LLC or just doing it the way I always have."

### Reactions

**Reaction to fleet expansion ROI projection (engaged but cautious):**

> "Okay, the math holds. I see how the volume covers the payment."

> "What happens if I can't find the technicians? I'm not going to buy three trucks and have them sitting."

**Reaction to the proposed $180K commercial vehicle financing (leaning toward — needs more clarity):**

> "I hear you. Let me chew on it. I want to talk to my CPA before pulling the trigger on something this size."

### Primary concern (open thread)

**External advisor (CPA):**

> "I want to run this past my CPA before I commit. He handles all the tax stuff and I want him on board with the structure."

---

## Cygnus Bioscience — Margaret Chen, CFO (with Dr. Robert Lin, CEO)

**Voice notes:** Margaret is a precise CFO at a 20-year-old specialty bioscience company. ~$28M annual revenue. Speaks in business-decision language; comfortable with capital-structure terminology; never uses unnecessary words. Robert (CEO and founder) occasionally appears in conversations but defers to Margaret on financial decisions. The April 21 conversation is about a $4-7M capital event for facility expansion. Cygnus financed their 2019 expansion through a regional commercial bank, not Blaze — and Margaret remembers this.

### Goals

**Goal: Expand production capacity for capital event**

> "We're at about eighty-five percent capacity utilization. Three of our anchor customers are signaling fifteen to twenty-five percent volume growth over the next eighteen months. The math is clear — we have to expand or we have to start telling customers no."

> "Robert and I have been talking about this for nine months. We're past the question of whether; we're working on the how and the when."

**Goal: Maintain banking relationship continuity** (forward-looking, captured ~2025-06-22)

> "Every time we open a new account or move money, that's overhead I don't need. We've been with Blaze almost twenty years. I'd like the next round to be with you."

### Blockers

**Blocker: Internal capital-allocation evaluation in progress** (Apr 21, 2026)

> "Our board has asked for three financing scenarios before we commit to a structure — fully financed, sale-leaseback, and a partial owner contribution. I have to bring all three to the September meeting."

**Blocker: Memory of 2019 expansion not financed by Blaze**

> "Last expansion we went with regional. They had a CRE team that knew the building type. We weren't unhappy but the relationship cost more than the rate did. I'd rather not do that again if we have a choice."

### Indecision

**Indecision: RFP vs. relationship-led process** (Apr 21, 2026)

> "We could run an RFP. The board would actually expect that for a deal this size. But if you can show me you have the specialist depth, I'd rather just work with you."

> "Show me what your CRE team looks like. If they understand specialty manufacturing, that earns the conversation."

### Reactions

**Reaction to commitment to bring CRE specialist into next conversation (committed):**

> "Yes, please. The sooner the better."

> "Have him reach out directly to Robert and me. We can do a working session next week."

### Primary concern (committed status — moving toward Formalize)

**No primary concern at this stage** — Cygnus is in `committed` state with `co_owner_or_board` as the *process fact* (board needs to approve the final structure in September). The Member is committed to working with Blaze; the open thread is the formal capital-allocation evaluation, not a Blaze-side decision.

For the Recommendation entity:

> "Bring me the specialist. We'll work through structure together."

---

## Quote-to-schema mapping (for CC reference)

When CC enriches the seed data in Sprint 4.7 phase 2, quotes map to fields per the Data Framework:

| Quote category | Schema field | Entity |
|---|---|---|
| Goal-related | `Signal.direct_quote` (where Signal.signal_type = goal) | Signal |
| Blocker-related | `Signal.direct_quote` (where Signal.signal_type = blocker) | Signal |
| Indecision-related | `Signal.direct_quote` (where Signal.signal_type = indecision) | Signal |
| Reaction (engaged with artifact) | `member_quote` field (NEW in Sprint 4.7 phase 2 schema additions) | Reaction capture or Recommendation.member_response_quote |
| Primary concern verbalization | `Recommendation.primary_concern_quote` (NEW in Sprint 4.7 phase 2 schema additions) | Recommendation |

For phase 1, the existing `direct_quote` field on Signal already exists; phase 2 adds the `member_quote` and `primary_concern_quote` fields if they don't yet exist.

---

## Editorial review prompts for Francisco

Before these quotes feed seed data:

**E1.** Voice consistency — do Jenny / Dan / Margaret each sound distinct enough? My read: Jenny is markedly different from the other two; Dan and Margaret could blur slightly because both are competent business operators. If Dan needs more "trades" texture (specific HVAC vocabulary, truck-bay detail) or Margaret needs more "specialty manufacturing" texture (regulatory, capital-equipment cadence), let me know specifically which to push on.

**E2.** Compliance clearance — I've drafted with the COMPLIANCE.md discipline in mind. The closest call is Jenny's "husband" references, which I've intentionally framed as `co_decision_maker_household` business-decision-process facts ("he handles the books with me," "we always make these calls together") rather than personal observations. If you want even tighter framing (e.g., switching to gender-neutral "household co-decision-maker" or "spouse" without name), edit accordingly.

**E3.** Length — most quotes are 1-2 sentences; a few are 3-4 when the Member is venting. Is this the right rhythm? My instinct is that consultative banking conversations are richer than 1-sentence soundbites; the longer quotes feel realer. If you'd rather have everything as terse 1-sentence captures, mark which to compress.

**E4.** Demo memorability — which quotes are likely to land with the EVP audience as quotable? My picks: Jenny's "I just want to be able to sleep through January" (humanizes the abstract "seasonal smoothing"), Dan's "I came in to look at financing for my own truck because mine's done, but maybe what I really need is to think about the whole fleet" (the moment of insight), Margaret's "Last expansion we went with regional. They had a CRE team that knew the building type. We weren't unhappy but the relationship cost more than the rate did. I'd rather not do that again if we have a choice." (the lost-business memory). These three quotes alone tell the demo's narrative arc. Worth verifying these are the centerpieces.

**E5.** Voice corrections — anything sounds wrong, edit freely.

---

## Total quote count

- Jenny's Catering: 11 quotes across 5 categories
- Northland HVAC: 10 quotes across 5 categories
- Cygnus Bioscience: 9 quotes across 5 categories

**Total: 30 verbatim Member quotes.** Roughly twice the baseline 5-7 per Member I targeted, because the Members each have multiple Goals/Blockers/Indecisions and each warrants its own quote. Some quotes will be redundant for seed data — pick the strongest 5-7 per Member.

---

**End of Member fixture quote enrichment v1 draft. Awaiting Francisco's editorial review.**
