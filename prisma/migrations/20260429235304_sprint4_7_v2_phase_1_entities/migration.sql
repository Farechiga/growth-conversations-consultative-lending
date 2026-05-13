-- Sprint 4.7 Block B — v2 phase 1 entities (per ARCHITECTURE_V2 §11).
--
-- Three new tables added additively. v1 schema unchanged. v2 reads use
-- both old and new entities; v1 reads work without modification.
--
--   Model — banker-built calculation/projection with parameters,
--           assumptions, output summary. With-Member vs Banker-draft
--           evidentiary distinction. Supersession discipline parallel
--           to Signal / SizingMeasurement.
--   Reaction — Member response to a Show event. Optional verbatim
--              member_quote (subject to Sprint 4.6 keyword scan).
--   ShowEvent — when an Artifact was rendered to a Member during a
--               conversation. Decouples "artifact produced" (Model)
--               from "artifact rendered" (ShowEvent).
--
-- The Objective entity from ARCHITECTURE_V2 §11.1 is implemented as
-- derived state in lib/v2-objectives.ts (Block C / D), not a persisted
-- table.

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "artifact_id" TEXT,
    "built_with_member" BOOLEAN NOT NULL,
    "parameters" JSONB NOT NULL,
    "assumptions" JSONB NOT NULL,
    "output_summary" TEXT NOT NULL,
    "built_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "built_by_banker_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "superseded_by_id" TEXT,
    "superseded_at" DATETIME,
    CONSTRAINT "Model_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Model_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "Artifact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_built_by_banker_id_fkey" FOREIGN KEY ("built_by_banker_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Model_superseded_by_id_fkey" FOREIGN KEY ("superseded_by_id") REFERENCES "Model" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Model_member_id_active_idx" ON "Model"("member_id", "active");

-- CreateIndex
CREATE INDEX "Model_conversation_id_idx" ON "Model"("conversation_id");

-- CreateIndex
CREATE INDEX "Model_artifact_id_idx" ON "Model"("artifact_id");

-- CreateTable
CREATE TABLE "ShowEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "artifact_id" TEXT NOT NULL,
    "model_id" TEXT,
    "shown_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shown_by_banker_id" TEXT NOT NULL,
    "context_note" TEXT,
    CONSTRAINT "ShowEvent_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShowEvent_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ShowEvent_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "Artifact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ShowEvent_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "Model" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ShowEvent_shown_by_banker_id_fkey" FOREIGN KEY ("shown_by_banker_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ShowEvent_member_id_idx" ON "ShowEvent"("member_id");

-- CreateIndex
CREATE INDEX "ShowEvent_artifact_id_idx" ON "ShowEvent"("artifact_id");

-- CreateIndex
CREATE INDEX "ShowEvent_conversation_id_idx" ON "ShowEvent"("conversation_id");

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "show_event_id" TEXT,
    "response_value" TEXT NOT NULL,
    "member_quote" TEXT,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_by_banker_id" TEXT NOT NULL,
    CONSTRAINT "Reaction_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reaction_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reaction_show_event_id_fkey" FOREIGN KEY ("show_event_id") REFERENCES "ShowEvent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reaction_captured_by_banker_id_fkey" FOREIGN KEY ("captured_by_banker_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Reaction_member_id_idx" ON "Reaction"("member_id");

-- CreateIndex
CREATE INDEX "Reaction_conversation_id_idx" ON "Reaction"("conversation_id");

-- CreateIndex
CREATE INDEX "Reaction_show_event_id_idx" ON "Reaction"("show_event_id");
