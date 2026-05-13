-- CreateTable
CREATE TABLE "InsightPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "track_id" TEXT NOT NULL,
    "signal_tag_scope" TEXT NOT NULL,
    "insight_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "implication_questions" TEXT NOT NULL,
    "member_type_origins" TEXT NOT NULL,
    "member_type_applicability" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "authored_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authored_by" TEXT NOT NULL,
    "approved_at" DATETIME,
    "approved_by" TEXT
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "addresses_signal_id" TEXT,
    "insight_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "matched_pattern_id" TEXT,
    "match_confidence" REAL,
    "llm_feedback" TEXT,
    "state" TEXT NOT NULL,
    "authored_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authored_by" TEXT NOT NULL,
    CONSTRAINT "Insight_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Insight_matched_pattern_id_fkey" FOREIGN KEY ("matched_pattern_id") REFERENCES "InsightPattern" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpecialistHandoff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "department_tag" TEXT NOT NULL,
    "specialist_preference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "initiated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initiated_by" TEXT NOT NULL,
    CONSTRAINT "SpecialistHandoff_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InsightPattern_track_id_idx" ON "InsightPattern"("track_id");

-- CreateIndex
CREATE INDEX "InsightPattern_signal_tag_scope_idx" ON "InsightPattern"("signal_tag_scope");

-- CreateIndex
CREATE INDEX "InsightPattern_track_id_signal_tag_scope_idx" ON "InsightPattern"("track_id", "signal_tag_scope");

-- CreateIndex
CREATE INDEX "Insight_member_id_idx" ON "Insight"("member_id");

-- CreateIndex
CREATE INDEX "Insight_track_id_idx" ON "Insight"("track_id");

-- CreateIndex
CREATE INDEX "Insight_addresses_signal_id_idx" ON "Insight"("addresses_signal_id");

-- CreateIndex
CREATE INDEX "Insight_state_idx" ON "Insight"("state");

-- CreateIndex
CREATE INDEX "Insight_matched_pattern_id_idx" ON "Insight"("matched_pattern_id");

-- CreateIndex
CREATE INDEX "SpecialistHandoff_member_id_idx" ON "SpecialistHandoff"("member_id");

-- CreateIndex
CREATE INDEX "SpecialistHandoff_track_id_idx" ON "SpecialistHandoff"("track_id");

-- CreateIndex
CREATE INDEX "SpecialistHandoff_status_idx" ON "SpecialistHandoff"("status");

-- CreateIndex
CREATE INDEX "Recommendation_member_id_idx" ON "Recommendation"("member_id");
