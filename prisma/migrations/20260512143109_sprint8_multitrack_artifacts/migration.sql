-- AlterTable
ALTER TABLE "Member" ADD COLUMN "active_track_ids" JSONB;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FactorCapture" (
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
    "capture_mode" TEXT NOT NULL DEFAULT 'member_confirmed',
    CONSTRAINT "FactorCapture_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FactorCapture_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "BusinessFactor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FactorCapture" ("banker_id", "boolean_value", "captured_at", "factor_id", "id", "member_id", "numerical_value", "qualitative_value", "source_reaction_id", "source_signal_id", "source_sizing_id", "unit") SELECT "banker_id", "boolean_value", "captured_at", "factor_id", "id", "member_id", "numerical_value", "qualitative_value", "source_reaction_id", "source_signal_id", "source_sizing_id", "unit" FROM "FactorCapture";
DROP TABLE "FactorCapture";
ALTER TABLE "new_FactorCapture" RENAME TO "FactorCapture";
CREATE INDEX "FactorCapture_member_id_idx" ON "FactorCapture"("member_id");
CREATE INDEX "FactorCapture_factor_id_idx" ON "FactorCapture"("factor_id");
CREATE INDEX "FactorCapture_member_id_factor_id_idx" ON "FactorCapture"("member_id", "factor_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
