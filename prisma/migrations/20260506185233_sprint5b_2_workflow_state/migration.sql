-- CreateTable
CREATE TABLE "MemberWorkflowState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "total_captures" INTEGER NOT NULL DEFAULT 0,
    "factor_captures_count" INTEGER NOT NULL DEFAULT 0,
    "signals_count" INTEGER NOT NULL DEFAULT 0,
    "insights_count" INTEGER NOT NULL DEFAULT 0,
    "reactions_count" INTEGER NOT NULL DEFAULT 0,
    "open_thread_count" INTEGER NOT NULL DEFAULT 0,
    "stale_capture_count" INTEGER NOT NULL DEFAULT 0,
    "last_touch_at" DATETIME,
    "current_track_id" TEXT,
    "pending_action_card_count" INTEGER NOT NULL DEFAULT 0,
    "pending_specialist_handoff_count" INTEGER NOT NULL DEFAULT 0,
    "recomputed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberWorkflowState_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberWorkflowState_member_id_key" ON "MemberWorkflowState"("member_id");

-- CreateIndex
CREATE INDEX "MemberWorkflowState_member_id_idx" ON "MemberWorkflowState"("member_id");

-- CreateIndex
CREATE INDEX "MemberWorkflowState_last_touch_at_idx" ON "MemberWorkflowState"("last_touch_at");

-- CreateIndex
CREATE INDEX "MemberWorkflowState_current_track_id_idx" ON "MemberWorkflowState"("current_track_id");
