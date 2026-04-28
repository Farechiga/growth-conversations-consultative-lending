-- Sprint 3 §B — add `slug` to Member as a NOT NULL UNIQUE column.
--
-- Pattern: SQLite-friendly table rebuild. Create new table with the new
-- column shape, copy rows into it (backfilling slug from a CASE on the
-- legal_name for the three demo Members), drop the old table, rename.
--
-- The demo has exactly three Members; hardcoding the slug mapping in
-- the migration is acceptable. Re-seed will overwrite anyway.

PRAGMA foreign_keys = OFF;

CREATE TABLE "new_Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "doing_business_as" TEXT,
    "industry_family_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "size_band" TEXT NOT NULL,
    "member_type_id" TEXT NOT NULL,
    "primary_banker_id" TEXT NOT NULL,
    "tenure_started_at" DATETIME NOT NULL,
    "consent_state" JSONB NOT NULL,
    "core_sync_state" JSONB NOT NULL,
    "private_notes" JSONB,
    "last_touch_at" DATETIME,
    "active_signal_count" INTEGER NOT NULL DEFAULT 0,
    "open_action_card_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Member_industry_family_id_fkey" FOREIGN KEY ("industry_family_id") REFERENCES "IndustryFamily" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Member_member_type_id_fkey" FOREIGN KEY ("member_type_id") REFERENCES "MemberType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Member_primary_banker_id_fkey" FOREIGN KEY ("primary_banker_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Member" (
    "id", "slug", "legal_name", "doing_business_as", "industry_family_id",
    "stage", "size_band", "member_type_id", "primary_banker_id",
    "tenure_started_at", "consent_state", "core_sync_state", "private_notes",
    "last_touch_at", "active_signal_count", "open_action_card_count",
    "created_at", "updated_at"
)
SELECT
    "id",
    CASE
        WHEN "legal_name" = 'Jenny''s Catering LLC' THEN 'jenny'
        WHEN "legal_name" = 'Northland Heating & Cooling Inc.' THEN 'northland'
        WHEN "legal_name" = 'Cygnus Bioscience Inc.' THEN 'cygnus'
        ELSE LOWER(REPLACE(REPLACE("legal_name", ' ', '-'), '.', ''))
    END AS "slug",
    "legal_name", "doing_business_as", "industry_family_id",
    "stage", "size_band", "member_type_id", "primary_banker_id",
    "tenure_started_at", "consent_state", "core_sync_state", "private_notes",
    "last_touch_at", "active_signal_count", "open_action_card_count",
    "created_at", "updated_at"
FROM "Member";

DROP TABLE "Member";
ALTER TABLE "new_Member" RENAME TO "Member";

CREATE UNIQUE INDEX "Member_slug_key" ON "Member"("slug");
CREATE INDEX "Member_primary_banker_id_idx" ON "Member"("primary_banker_id");
CREATE INDEX "Member_member_type_id_idx" ON "Member"("member_type_id");
CREATE INDEX "Member_industry_family_id_stage_size_band_idx" ON "Member"("industry_family_id", "stage", "size_band");

PRAGMA foreign_keys = ON;
