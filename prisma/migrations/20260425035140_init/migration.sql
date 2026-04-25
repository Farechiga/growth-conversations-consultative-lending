-- CreateTable
CREATE TABLE "Banker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "external_user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "roles" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authored_private_notes" JSONB
);

-- CreateTable
CREATE TABLE "IndustryFamily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "naics_codes" JSONB NOT NULL,
    "size_band_thresholds" JSONB NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonical_tag" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "topic_type" TEXT NOT NULL,
    "parent_topic_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'canonical',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Topic_parent_topic_id_fkey" FOREIGN KEY ("parent_topic_id") REFERENCES "Topic" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "routing_owner_role" TEXT NOT NULL,
    "compliance_tags" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "confidence_band" TEXT NOT NULL,
    "compliance_gates" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'canonical',
    "version" INTEGER NOT NULL DEFAULT 1,
    "promoted_at" DATETIME,
    "promoted_by_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rule_promoted_by_id_fkey" FOREIGN KEY ("promoted_by_id") REFERENCES "Banker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MemberType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "industry_family_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "size_band" TEXT NOT NULL,
    "typical_sequences" JSONB,
    "segment_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MemberType_industry_family_id_fkey" FOREIGN KEY ("industry_family_id") REFERENCES "IndustryFamily" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrowthTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target_member_type_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'canonical',
    "promoted_at" DATETIME,
    "promoted_by_id" TEXT,
    "performance_counts" JSONB,
    "review_due" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthTrack_target_member_type_id_fkey" FOREIGN KEY ("target_member_type_id") REFERENCES "MemberType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GrowthTrack_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GrowthTrack_promoted_by_id_fkey" FOREIGN KEY ("promoted_by_id") REFERENCES "Banker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrowthTrackStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "growth_track_id" TEXT NOT NULL,
    "growth_step_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "GrowthTrackStep_growth_track_id_fkey" FOREIGN KEY ("growth_track_id") REFERENCES "GrowthTrack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GrowthTrackStep_growth_step_id_fkey" FOREIGN KEY ("growth_step_id") REFERENCES "GrowthStep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrowthStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "step_shape" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variant_phrasings" JSONB,
    "capture_schema" JSONB NOT NULL,
    "artifact_id" TEXT,
    "author_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'canonical',
    "promoted_at" DATETIME,
    "promoted_by_id" TEXT,
    "performance_counts" JSONB,
    "review_due" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthStep_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "Artifact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GrowthStep_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GrowthStep_promoted_by_id_fkey" FOREIGN KEY ("promoted_by_id") REFERENCES "Banker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameter_schema" JSONB NOT NULL,
    "template" TEXT NOT NULL,
    "compliance_status" TEXT NOT NULL DEFAULT 'draft',
    "last_reviewed_at" DATETIME,
    "reviewed_by_id" TEXT,
    "shareable" BOOLEAN NOT NULL DEFAULT false,
    "use_counts" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Artifact_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "Banker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "member_id" TEXT NOT NULL,
    "banker_id" TEXT NOT NULL,
    "meeting_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "duration_min" INTEGER,
    "moment_quote" TEXT,
    "banker_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conversation_banker_id_fkey" FOREIGN KEY ("banker_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrowthStepExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "growth_step_id" TEXT NOT NULL,
    "sequence_position" INTEGER NOT NULL,
    "captured_data" JSONB NOT NULL,
    "executed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GrowthStepExecution_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GrowthStepExecution_growth_step_id_fkey" FOREIGN KEY ("growth_step_id") REFERENCES "GrowthStep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "growth_step_execution_id" TEXT,
    "member_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "their_words" TEXT,
    "recency" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "magnitude" REAL,
    "unit" TEXT,
    "frequency" TEXT,
    "feeling" TEXT,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Signal_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signal_growth_step_execution_id_fkey" FOREIGN KEY ("growth_step_execution_id") REFERENCES "GrowthStepExecution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Signal_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Signal_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "origin_conversation_id" TEXT NOT NULL,
    "origin_growth_step_execution_id" TEXT,
    "rationale" TEXT NOT NULL,
    "suggested_opening" TEXT,
    "due_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "status_changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT,
    "outcome_reason" TEXT,
    "funded_product_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" DATETIME,
    CONSTRAINT "ActionCard_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Banker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActionCard_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActionCard_origin_conversation_id_fkey" FOREIGN KEY ("origin_conversation_id") REFERENCES "Conversation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActionCard_origin_growth_step_execution_id_fkey" FOREIGN KEY ("origin_growth_step_execution_id") REFERENCES "GrowthStepExecution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionCard_funded_product_id_fkey" FOREIGN KEY ("funded_product_id") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recommendation" (
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
    "status" TEXT NOT NULL DEFAULT 'surfaced',
    "rule_id_that_fired" TEXT,
    "their_words" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recommendation_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_growth_step_execution_id_fkey" FOREIGN KEY ("growth_step_execution_id") REFERENCES "GrowthStepExecution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_paired_product_id_fkey" FOREIGN KEY ("paired_product_id") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_rule_id_that_fired_fkey" FOREIGN KEY ("rule_id_that_fired") REFERENCES "Rule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MemberTypeBlockers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MemberTypeBlockers_A_fkey" FOREIGN KEY ("A") REFERENCES "MemberType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MemberTypeBlockers_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MemberTypeTriggers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MemberTypeTriggers_A_fkey" FOREIGN KEY ("A") REFERENCES "MemberType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MemberTypeTriggers_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MemberTypeGoals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MemberTypeGoals_A_fkey" FOREIGN KEY ("A") REFERENCES "MemberType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MemberTypeGoals_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MemberTypeTypicalProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MemberTypeTypicalProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "MemberType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MemberTypeTypicalProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GrowthTrackBlockerTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GrowthTrackBlockerTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "GrowthTrack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GrowthTrackBlockerTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GrowthTrackTriggerTopics" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GrowthTrackTriggerTopics_A_fkey" FOREIGN KEY ("A") REFERENCES "GrowthTrack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GrowthTrackTriggerTopics_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MemberTypeDefaultGrowthTracks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MemberTypeDefaultGrowthTracks_A_fkey" FOREIGN KEY ("A") REFERENCES "GrowthTrack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MemberTypeDefaultGrowthTracks_B_fkey" FOREIGN KEY ("B") REFERENCES "MemberType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RuleOutputGrowthTracks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RuleOutputGrowthTracks_A_fkey" FOREIGN KEY ("A") REFERENCES "GrowthTrack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RuleOutputGrowthTracks_B_fkey" FOREIGN KEY ("B") REFERENCES "Rule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GrowthStepTargetMemberTypes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GrowthStepTargetMemberTypes_A_fkey" FOREIGN KEY ("A") REFERENCES "GrowthStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GrowthStepTargetMemberTypes_B_fkey" FOREIGN KEY ("B") REFERENCES "MemberType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GrowthStepTriggerSignals" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GrowthStepTriggerSignals_A_fkey" FOREIGN KEY ("A") REFERENCES "GrowthStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GrowthStepTriggerSignals_B_fkey" FOREIGN KEY ("B") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Banker_external_user_id_key" ON "Banker"("external_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryFamily_name_key" ON "IndustryFamily"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_canonical_tag_key" ON "Topic"("canonical_tag");

-- CreateIndex
CREATE INDEX "Topic_canonical_tag_idx" ON "Topic"("canonical_tag");

-- CreateIndex
CREATE INDEX "Topic_topic_type_idx" ON "Topic"("topic_type");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MemberType_name_key" ON "MemberType"("name");

-- CreateIndex
CREATE INDEX "MemberType_industry_family_id_stage_size_band_idx" ON "MemberType"("industry_family_id", "stage", "size_band");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthTrack_name_key" ON "GrowthTrack"("name");

-- CreateIndex
CREATE INDEX "GrowthTrackStep_growth_track_id_idx" ON "GrowthTrackStep"("growth_track_id");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthTrackStep_growth_track_id_position_key" ON "GrowthTrackStep"("growth_track_id", "position");

-- CreateIndex
CREATE INDEX "Member_primary_banker_id_idx" ON "Member"("primary_banker_id");

-- CreateIndex
CREATE INDEX "Member_member_type_id_idx" ON "Member"("member_type_id");

-- CreateIndex
CREATE INDEX "Member_industry_family_id_stage_size_band_idx" ON "Member"("industry_family_id", "stage", "size_band");

-- CreateIndex
CREATE INDEX "Conversation_member_id_idx" ON "Conversation"("member_id");

-- CreateIndex
CREATE INDEX "Conversation_banker_id_idx" ON "Conversation"("banker_id");

-- CreateIndex
CREATE INDEX "Conversation_created_at_idx" ON "Conversation"("created_at");

-- CreateIndex
CREATE INDEX "GrowthStepExecution_conversation_id_idx" ON "GrowthStepExecution"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "GrowthStepExecution_conversation_id_sequence_position_key" ON "GrowthStepExecution"("conversation_id", "sequence_position");

-- CreateIndex
CREATE INDEX "Signal_member_id_active_idx" ON "Signal"("member_id", "active");

-- CreateIndex
CREATE INDEX "Signal_conversation_id_idx" ON "Signal"("conversation_id");

-- CreateIndex
CREATE INDEX "Signal_topic_id_idx" ON "Signal"("topic_id");

-- CreateIndex
CREATE INDEX "Signal_type_idx" ON "Signal"("type");

-- CreateIndex
CREATE INDEX "ActionCard_owner_id_status_idx" ON "ActionCard"("owner_id", "status");

-- CreateIndex
CREATE INDEX "ActionCard_member_id_status_idx" ON "ActionCard"("member_id", "status");

-- CreateIndex
CREATE INDEX "ActionCard_due_at_idx" ON "ActionCard"("due_at");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_growth_step_execution_id_key" ON "Recommendation"("growth_step_execution_id");

-- CreateIndex
CREATE INDEX "Recommendation_member_id_idx" ON "Recommendation"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "_MemberTypeBlockers_AB_unique" ON "_MemberTypeBlockers"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberTypeBlockers_B_index" ON "_MemberTypeBlockers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MemberTypeTriggers_AB_unique" ON "_MemberTypeTriggers"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberTypeTriggers_B_index" ON "_MemberTypeTriggers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MemberTypeGoals_AB_unique" ON "_MemberTypeGoals"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberTypeGoals_B_index" ON "_MemberTypeGoals"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MemberTypeTypicalProducts_AB_unique" ON "_MemberTypeTypicalProducts"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberTypeTypicalProducts_B_index" ON "_MemberTypeTypicalProducts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GrowthTrackBlockerTopics_AB_unique" ON "_GrowthTrackBlockerTopics"("A", "B");

-- CreateIndex
CREATE INDEX "_GrowthTrackBlockerTopics_B_index" ON "_GrowthTrackBlockerTopics"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GrowthTrackTriggerTopics_AB_unique" ON "_GrowthTrackTriggerTopics"("A", "B");

-- CreateIndex
CREATE INDEX "_GrowthTrackTriggerTopics_B_index" ON "_GrowthTrackTriggerTopics"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MemberTypeDefaultGrowthTracks_AB_unique" ON "_MemberTypeDefaultGrowthTracks"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberTypeDefaultGrowthTracks_B_index" ON "_MemberTypeDefaultGrowthTracks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RuleOutputGrowthTracks_AB_unique" ON "_RuleOutputGrowthTracks"("A", "B");

-- CreateIndex
CREATE INDEX "_RuleOutputGrowthTracks_B_index" ON "_RuleOutputGrowthTracks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GrowthStepTargetMemberTypes_AB_unique" ON "_GrowthStepTargetMemberTypes"("A", "B");

-- CreateIndex
CREATE INDEX "_GrowthStepTargetMemberTypes_B_index" ON "_GrowthStepTargetMemberTypes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GrowthStepTriggerSignals_AB_unique" ON "_GrowthStepTriggerSignals"("A", "B");

-- CreateIndex
CREATE INDEX "_GrowthStepTriggerSignals_B_index" ON "_GrowthStepTriggerSignals"("B");
