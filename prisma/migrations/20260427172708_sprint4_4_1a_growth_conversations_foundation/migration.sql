-- Sprint 4 Prompt 4.1a — Growth Conversations foundation.
--
-- Schema additions per the prompt's Block A:
--   1. Recommendation.size_low / size_high / product_subtype
--   2. Signal.superseded_by_signal_id / superseded_at (longevity tracking)
--   3. GrowthStepExecution.was_skipped / skip_confirmed_by_banker_id /
--      skip_confirmed_at / skip_reason
--   4. New Macro entity
--   5. New ArtifactParameterCapture entity + ParameterProvenance enum
--      (stored as TEXT in SQLite)
--
-- All new columns on existing tables are nullable (or have defaults),
-- so SQLite ALTER TABLE ADD COLUMN suffices for the modifications.
-- New tables are created fresh.

PRAGMA foreign_keys = OFF;

-- ── Recommendation: add size_low, size_high, product_subtype ────────
ALTER TABLE "Recommendation" ADD COLUMN "size_low" REAL;
ALTER TABLE "Recommendation" ADD COLUMN "size_high" REAL;
ALTER TABLE "Recommendation" ADD COLUMN "product_subtype" TEXT;

-- ── Signal: add supersession tracking ──────────────────────────────
ALTER TABLE "Signal" ADD COLUMN "superseded_by_signal_id" TEXT REFERENCES "Signal" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Signal" ADD COLUMN "superseded_at" DATETIME;

-- ── GrowthStepExecution: add skip-state ────────────────────────────
ALTER TABLE "GrowthStepExecution" ADD COLUMN "was_skipped" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "GrowthStepExecution" ADD COLUMN "skip_confirmed_by_banker_id" TEXT REFERENCES "Banker" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GrowthStepExecution" ADD COLUMN "skip_confirmed_at" DATETIME;
ALTER TABLE "GrowthStepExecution" ADD COLUMN "skip_reason" TEXT;

-- ── Macro: new entity ──────────────────────────────────────────────
CREATE TABLE "Macro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "authored_by_banker_id" TEXT,
    "authored_by_external_label" TEXT,
    "authored_at" DATETIME NOT NULL,
    "effective_period_start" DATETIME NOT NULL,
    "effective_period_end" DATETIME,
    "affected_industry_families" JSONB NOT NULL,
    "affected_member_types" JSONB NOT NULL,
    "recommended_response" TEXT NOT NULL,
    "evidence_links" JSONB NOT NULL,
    "related_topics" JSONB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Macro_authored_by_banker_id_fkey" FOREIGN KEY ("authored_by_banker_id") REFERENCES "Banker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Macro_authored_by_banker_id_idx" ON "Macro"("authored_by_banker_id");

-- ── ArtifactParameterCapture: new entity ───────────────────────────
-- parameter_provenance stored as TEXT enum in SQLite (Prisma maps the
-- ParameterProvenance enum to TEXT and validates at the application
-- layer).
CREATE TABLE "ArtifactParameterCapture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "growth_step_execution_id" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "parameter_value" TEXT NOT NULL,
    "parameter_provenance" TEXT NOT NULL,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_by_banker_id" TEXT NOT NULL,
    CONSTRAINT "ArtifactParameterCapture_growth_step_execution_id_fkey" FOREIGN KEY ("growth_step_execution_id") REFERENCES "GrowthStepExecution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArtifactParameterCapture_captured_by_banker_id_fkey" FOREIGN KEY ("captured_by_banker_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ArtifactParameterCapture_growth_step_execution_id_idx" ON "ArtifactParameterCapture"("growth_step_execution_id");
CREATE INDEX "ArtifactParameterCapture_captured_by_banker_id_idx" ON "ArtifactParameterCapture"("captured_by_banker_id");

PRAGMA foreign_keys = ON;
