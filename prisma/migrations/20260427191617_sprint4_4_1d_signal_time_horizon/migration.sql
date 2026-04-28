-- Sprint 4 Prompt 4.1d Block C — Signal.time_horizon for Trigger Signals.
--
-- Trigger Signals are forward-looking events; the banker-facing question
-- is "when will this hit?" not "how recently did it become observable?"
-- The new TimeHorizon enum (stored as TEXT in SQLite) carries the
-- forward-looking duration; recency stays for Goal / Blocker / Indecision.
-- Both fields nullable; per-type validation lives in the application
-- layer (saveAskCaptures Server Action).

ALTER TABLE "Signal" ADD COLUMN "time_horizon" TEXT;
