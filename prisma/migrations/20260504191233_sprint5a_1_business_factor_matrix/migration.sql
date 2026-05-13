-- Sprint 5a.1 — Business Factor Matrix infrastructure.
-- Four new entities driving Track ranking and (in 5a.2) the
-- popup-as-workflow surface. Sourced from BUSINESS_FACTOR_MATRIX_v1.md.
-- Additive only; no v1 / earlier-v2 entity changes.

-- BusinessFactor — 28 factors across 6 categories (cashflow, capacity,
-- decision_process, industry_structural, member_stated, banking_relationship).
CREATE TABLE "BusinessFactor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "diagnostic_question" TEXT NOT NULL,
    "capture_mode" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "unit" TEXT,
    "category" TEXT NOT NULL,
    "enum_values" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "BusinessFactor_field_name_key" ON "BusinessFactor"("field_name");
CREATE INDEX "BusinessFactor_category_idx" ON "BusinessFactor"("category");
CREATE INDEX "BusinessFactor_field_name_idx" ON "BusinessFactor"("field_name");

-- TrackTemplate — 5 Tracks. required_evidence_per_objective is JSON.
CREATE TABLE "TrackTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "banker_description" TEXT NOT NULL,
    "typical_size_band" TEXT,
    "required_evidence_per_objective" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- MatrixEntry — factor × track × strength × threshold rule rows.
CREATE TABLE "MatrixEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factor_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "threshold_rule" TEXT,
    "banker_rationale" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatrixEntry_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "BusinessFactor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatrixEntry_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "TrackTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MatrixEntry_factor_id_track_id_strength_threshold_rule_key"
    ON "MatrixEntry"("factor_id", "track_id", "strength", "threshold_rule");
CREATE INDEX "MatrixEntry_factor_id_idx" ON "MatrixEntry"("factor_id");
CREATE INDEX "MatrixEntry_track_id_idx" ON "MatrixEntry"("track_id");
CREATE INDEX "MatrixEntry_strength_idx" ON "MatrixEntry"("strength");

-- FactorCapture — per-Member captured factor values with optional
-- source linkage to existing capture entities.
CREATE TABLE "FactorCapture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "factor_id" TEXT NOT NULL,
    "numerical_value" REAL,
    "boolean_value" BOOLEAN,
    "qualitative_value" TEXT,
    "unit" TEXT,
    "source_signal_id" TEXT,
    "source_sizing_id" TEXT,
    "source_reaction_id" TEXT,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "banker_id" TEXT NOT NULL,
    CONSTRAINT "FactorCapture_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FactorCapture_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "BusinessFactor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "FactorCapture_member_id_idx" ON "FactorCapture"("member_id");
CREATE INDEX "FactorCapture_factor_id_idx" ON "FactorCapture"("factor_id");
CREATE INDEX "FactorCapture_member_id_factor_id_idx" ON "FactorCapture"("member_id", "factor_id");
