-- Sprint 2 schema changes — combined migration covering work from
-- both Sprint 2 Prompt 1 (response enum + status field retirement) and
-- Sprint 2 Prompt 2 (updated_at + owned_by fields).
--
-- Why one migration: Prompt 1's schema changes were applied at the
-- Prisma-client level only (regenerate, not migrate) so the dev.db
-- still carried the `status` column when Prompt 2 began. The single
-- migration below brings the database to the post-Prompt-2 shape and
-- restores migration-history honesty.
--
-- Effects:
--   1. Drop `Recommendation.status` (RecommendationStatus enum retired)
--   2. Add `Recommendation.updated_at` (Prisma @updatedAt directive)
--   3. Add `Recommendation.owned_by_id` (FK to Banker, nullable)
--   4. Add the `Recommendation_owned_by_id_fkey` foreign-key index
--
-- SQLite does not support DROP COLUMN cleanly across versions so
-- Prisma's standard pattern is "rebuild the table." We follow that
-- pattern: copy data into a new table with the desired shape, drop
-- the old, rename the new.

PRAGMA foreign_keys = OFF;

CREATE TABLE "new_Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "growth_step_execution_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size_proposed" REAL,
    "structure" TEXT NOT NULL,
    "paired_product_id" TEXT,
    "rationale_text" TEXT NOT NULL,
    "confidence_band" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "primary_concern" TEXT,
    "rule_id_that_fired" TEXT,
    "owned_by_id" TEXT,
    "their_words" TEXT,
    "rationale_summary" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recommendation_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_growth_step_execution_id_fkey" FOREIGN KEY ("growth_step_execution_id") REFERENCES "GrowthStepExecution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_paired_product_id_fkey" FOREIGN KEY ("paired_product_id") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_rule_id_that_fired_fkey" FOREIGN KEY ("rule_id_that_fired") REFERENCES "Rule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_owned_by_id_fkey" FOREIGN KEY ("owned_by_id") REFERENCES "Banker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Recommendation" (
    "id", "member_id", "growth_step_execution_id", "product_id",
    "size_proposed", "structure", "paired_product_id", "rationale_text",
    "confidence_band", "response", "primary_concern", "rule_id_that_fired",
    "their_words", "rationale_summary", "created_at", "updated_at"
)
SELECT
    "id", "member_id", "growth_step_execution_id", "product_id",
    "size_proposed", "structure", "paired_product_id", "rationale_text",
    "confidence_band", "response", "primary_concern", "rule_id_that_fired",
    "their_words", "rationale_summary", "created_at", "created_at"
FROM "Recommendation";

DROP TABLE "Recommendation";
ALTER TABLE "new_Recommendation" RENAME TO "Recommendation";

CREATE UNIQUE INDEX "Recommendation_growth_step_execution_id_key" ON "Recommendation"("growth_step_execution_id");

PRAGMA foreign_keys = ON;
