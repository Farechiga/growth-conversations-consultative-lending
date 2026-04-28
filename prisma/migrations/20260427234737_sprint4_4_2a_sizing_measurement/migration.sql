-- Sprint 4 Prompt 4.2a Block B — Size phase capture entities.
--
-- Two new tables:
--   SizingDimension   — controlled vocabulary for what a measurement
--                       quantifies. Parallel in shape to Topic.
--   SizingMeasurement — fact table for captured quantification, with
--                       full supersession discipline parallel to Signal.

-- CreateTable
CREATE TABLE "SizingDimension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SizingDimension_key_key" ON "SizingDimension"("key");

-- CreateIndex
CREATE INDEX "SizingDimension_key_idx" ON "SizingDimension"("key");

-- CreateTable
CREATE TABLE "SizingMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "growth_step_execution_id" TEXT,
    "dimension_id" TEXT NOT NULL,
    "magnitude" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "frequency" TEXT,
    "source" TEXT NOT NULL,
    "their_words" TEXT,
    "confidence" TEXT,
    "time_period" TEXT,
    "methodology_note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "superseded_by_id" TEXT,
    "superseded_at" DATETIME,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SizingMeasurement_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SizingMeasurement_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SizingMeasurement_growth_step_execution_id_fkey" FOREIGN KEY ("growth_step_execution_id") REFERENCES "GrowthStepExecution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SizingMeasurement_dimension_id_fkey" FOREIGN KEY ("dimension_id") REFERENCES "SizingDimension" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SizingMeasurement_superseded_by_id_fkey" FOREIGN KEY ("superseded_by_id") REFERENCES "SizingMeasurement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SizingMeasurement_member_id_active_idx" ON "SizingMeasurement"("member_id", "active");

-- CreateIndex
CREATE INDEX "SizingMeasurement_conversation_id_idx" ON "SizingMeasurement"("conversation_id");

-- CreateIndex
CREATE INDEX "SizingMeasurement_dimension_id_idx" ON "SizingMeasurement"("dimension_id");
