# 04_Module_and_Data_Flow — Amendments

**Sidecar to `04_Module_and_Data_Flow.docx`. Captures the textual changes that need to be folded into the source .docx at next review.**

---

## Sprint 4 §F.3 — §3 Meeting Recap → Growth Conversations rewrite

**Replace** §3 wholesale. New section:

> ## §3 — Growth Conversations
>
> The structured-capture interface that records what happened in a banker-member conversation, surfaces matching Growth Tracks based on captured Signals, and produces ActionCards / Recommendations as the conversation progresses. Replaces what was called "Meeting Recap" in v1.
>
> ### Two entry paths
>
> 1. **From a Member profile** — banker clicks "Run Growth Track" or "Run follow-up" on the suggested-next-step card; navigates to `/growth-conversations/[memberId]` with the Member preloaded.
> 2. **Standalone** — banker navigates to `/growth-conversations` directly; selects a Member from the lookup component (Sprint 4 §D); the lookup is scoped to the banker's portfolio.
>
> Both paths converge on the same prefilled scrolling-page interface once a Member is selected.
>
> ### Single scrolling page architecture
>
> All stages render on one page, top-to-bottom, in a left column (~70% width). A right column (~30% width) carries a sticky **anchor progress bar** showing all stages with state (completed / current / upcoming) and click-to-scroll behavior. Mirrors the Member profile's TrackProgressDots visual language so the system reads as one application.
>
> Stage sequence is driven by the Track's `growth_step_sequence` (after the Sprint 4 §F.1 reframe: post-discovery only) plus two post-Track lifecycle stages whose labels depend on the final step's shape:
>
> - Resolve-ending Track → `Decision pending` → `Funded`
> - Connect-ending Track → `Specialist engagement` → `Closed`
>
> ### Track-agnostic vs track-specific phases
>
> - **Ask + Size** (track-agnostic): discovery captures. Bankers always start here regardless of which Track will eventually surface. The system uses captured Signals to match a Track via the rule engine; matched Tracks then provide the Show + Resolve (or Show + Connect) steps.
> - **Show + Resolve / Connect** (track-specific): the matched Track's GrowthSteps. Show renders the Track's Artifact with banker-captured parameters; Resolve closes the conversation with member response + ActionCard production; Connect transfers to a specialist.
>
> ### Signal longevity
>
> When a banker re-enters Growth Conversations months after a prior capture, prior Ask + Size Signals display with timestamps. The banker can update stale captures; updates create new Signal records with new timestamps and `superseded_by_signal_id` references back to the prior. Old records retained; current state is "active Signals not yet superseded." Full audit trail per Sprint 4 §A.7. The Signal supersession schema lands in Sprint 4 Prompt 4.1a; the UI for updating stale captures lands in Sprint 4 Prompt 4.2.
>
> ### Skip handling
>
> Each stage has a skip checkbox. Submitting a later stage with an earlier stage unfilled triggers a confirmation popup; on confirmation, the unfilled stage's GrowthStepExecution is written with `was_skipped = true`, `skip_confirmed_by_banker_id`, and `skip_confirmed_at`. Skip patterns are queryable for Insight Engine analytics (Sprint 5 stage-skip view). UI lands in Sprint 4 Prompt 4.3.
>
> ### Inline insight surfaces
>
> During Ask, Size, Show, and Resolve phases, the capture form surfaces **inline insights** — small evidence-grounded prompts that nudge banker behavior toward the canonical pattern. Per `INSIGHT_ENGINE_DESIGN_NOTES.md` §5 Surface B, every inline insight passes the **three-criterion actionable-insight test**: (1) it changes behavior, (2) it's grounded in evidence, (3) it's specific to context. UI lands in Sprint 4 Prompt 4.2.
>
> ### Save behavior
>
> Stage-by-stage save: each stage has its own save button that commits that stage's `GrowthStepExecution` plus produced Signals / ActionCards / Recommendations. The Member profile reflects the new state immediately after each save. A "Complete conversation" action commits any unsaved work and writes the parent Conversation record. Cancel returns to the Member profile without saving any unsaved work.

---

*Folded into `04_Module_and_Data_Flow.docx`: PENDING.*
