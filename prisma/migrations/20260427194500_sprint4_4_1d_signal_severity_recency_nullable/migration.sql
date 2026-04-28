-- Sprint 4 Prompt 4.1d Block C — Signal.severity and Signal.recency become nullable.
--
-- Per the per-type required-field discipline:
--   - Indecision Signals: Impact (severity) and Timeframe (recency) are
--     optional; the form may save them as null.
--   - Trigger Signals: forward-looking, use time_horizon instead of
--     recency; recency may be left null.
--   - Goal / Blocker Signals: severity and recency stay required at the
--     application layer (validated client-side and in saveAskCaptures),
--     even though the schema now permits null.
--
-- SQLite cannot DROP NOT NULL via ALTER COLUMN; the column relaxation
-- requires the standard table-rebuild dance. Existing seed data values
-- transfer verbatim.

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "growth_step_execution_id" TEXT,
    "member_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "severity" TEXT,
    "their_words" TEXT,
    "recency" TEXT,
    "confidence" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "magnitude" REAL,
    "unit" TEXT,
    "frequency" TEXT,
    "feeling" TEXT,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "superseded_by_signal_id" TEXT,
    "superseded_at" DATETIME,
    "time_horizon" TEXT,
    CONSTRAINT "Signal_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signal_growth_step_execution_id_fkey" FOREIGN KEY ("growth_step_execution_id") REFERENCES "GrowthStepExecution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Signal_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signal_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signal_superseded_by_signal_id_fkey" FOREIGN KEY ("superseded_by_signal_id") REFERENCES "Signal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Signal" ("id", "conversation_id", "growth_step_execution_id", "member_id", "type", "topic_id", "severity", "their_words", "recency", "confidence", "active", "magnitude", "unit", "frequency", "feeling", "captured_at", "superseded_by_signal_id", "superseded_at", "time_horizon")
SELECT "id", "conversation_id", "growth_step_execution_id", "member_id", "type", "topic_id", "severity", "their_words", "recency", "confidence", "active", "magnitude", "unit", "frequency", "feeling", "captured_at", "superseded_by_signal_id", "superseded_at", "time_horizon"
FROM "Signal";

DROP TABLE "Signal";
ALTER TABLE "new_Signal" RENAME TO "Signal";

CREATE INDEX "Signal_member_id_active_idx" ON "Signal"("member_id", "active");
CREATE INDEX "Signal_conversation_id_idx" ON "Signal"("conversation_id");
CREATE INDEX "Signal_topic_id_idx" ON "Signal"("topic_id");
CREATE INDEX "Signal_type_idx" ON "Signal"("type");

PRAGMA foreign_keys=ON;
