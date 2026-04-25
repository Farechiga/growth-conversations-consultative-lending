-- CreateTable
CREATE TABLE "MemberSummarySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "summary_text" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL,
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberSummarySnapshot_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MemberSummarySnapshot_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MemberSummarySnapshot_member_id_idx" ON "MemberSummarySnapshot"("member_id");

-- CreateIndex
CREATE INDEX "MemberSummarySnapshot_conversation_id_idx" ON "MemberSummarySnapshot"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSummarySnapshot_member_id_conversation_id_key" ON "MemberSummarySnapshot"("member_id", "conversation_id");
