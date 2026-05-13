-- CreateTable
CREATE TABLE "ArtifactTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "track_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "member_type_applicability" TEXT NOT NULL,
    "parameter_schema" TEXT NOT NULL,
    "output_summary_template" TEXT NOT NULL,
    "structural_content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArtifactTemplate_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "TrackTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Model" (
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
    "template_id" TEXT,
    "template_parameters" TEXT,
    CONSTRAINT "Model_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Model_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "Artifact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_built_by_banker_id_fkey" FOREIGN KEY ("built_by_banker_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Model_superseded_by_id_fkey" FOREIGN KEY ("superseded_by_id") REFERENCES "Model" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Model_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "ArtifactTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Model" ("active", "artifact_id", "assumptions", "built_at", "built_by_banker_id", "built_with_member", "conversation_id", "id", "member_id", "output_summary", "parameters", "superseded_at", "superseded_by_id") SELECT "active", "artifact_id", "assumptions", "built_at", "built_by_banker_id", "built_with_member", "conversation_id", "id", "member_id", "output_summary", "parameters", "superseded_at", "superseded_by_id" FROM "Model";
DROP TABLE "Model";
ALTER TABLE "new_Model" RENAME TO "Model";
CREATE INDEX "Model_member_id_active_idx" ON "Model"("member_id", "active");
CREATE INDEX "Model_conversation_id_idx" ON "Model"("conversation_id");
CREATE INDEX "Model_artifact_id_idx" ON "Model"("artifact_id");
CREATE INDEX "Model_template_id_idx" ON "Model"("template_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ArtifactTemplate_track_id_idx" ON "ArtifactTemplate"("track_id");
