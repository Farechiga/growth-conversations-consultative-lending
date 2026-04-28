-- Sprint 4 Prompt 4.1c §C.3 — track-agnostic GrowthStepExecution support.
--
-- Approach 2 from the prompt: nullable growth_step_id + new step_phase
-- column carrying the phase identity (ask | size | show | propose |
-- resolve | connect, matching the StepShape enum). Track-specific
-- executions populate both fields; track-agnostic Ask + Size captures
-- (the discovery phase before a Track surfaces) populate only step_phase.
--
-- SQLite pattern: rebuild the table to alter the FK constraint shape on
-- growth_step_id (NOT NULL → nullable). The data carries over with both
-- columns populated for existing rows; new track-agnostic captures will
-- write NULL for growth_step_id.

PRAGMA foreign_keys = OFF;

CREATE TABLE "new_GrowthStepExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "growth_step_id" TEXT,
    "step_phase" TEXT,
    "sequence_position" INTEGER NOT NULL,
    "captured_data" JSONB NOT NULL,
    "executed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "was_skipped" BOOLEAN NOT NULL DEFAULT 0,
    "skip_confirmed_by_banker_id" TEXT,
    "skip_confirmed_at" DATETIME,
    "skip_reason" TEXT,
    CONSTRAINT "GrowthStepExecution_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GrowthStepExecution_growth_step_id_fkey" FOREIGN KEY ("growth_step_id") REFERENCES "GrowthStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GrowthStepExecution_skip_confirmed_by_banker_id_fkey" FOREIGN KEY ("skip_confirmed_by_banker_id") REFERENCES "Banker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_GrowthStepExecution" (
    "id", "conversation_id", "growth_step_id", "step_phase",
    "sequence_position", "captured_data", "executed_at",
    "was_skipped", "skip_confirmed_by_banker_id", "skip_confirmed_at", "skip_reason"
)
SELECT
    "id", "conversation_id", "growth_step_id", NULL,
    "sequence_position", "captured_data", "executed_at",
    "was_skipped", "skip_confirmed_by_banker_id", "skip_confirmed_at", "skip_reason"
FROM "GrowthStepExecution";

DROP TABLE "GrowthStepExecution";
ALTER TABLE "new_GrowthStepExecution" RENAME TO "GrowthStepExecution";

CREATE UNIQUE INDEX "GrowthStepExecution_conversation_id_sequence_position_key"
    ON "GrowthStepExecution"("conversation_id", "sequence_position");
CREATE INDEX "GrowthStepExecution_conversation_id_idx"
    ON "GrowthStepExecution"("conversation_id");

PRAGMA foreign_keys = ON;
