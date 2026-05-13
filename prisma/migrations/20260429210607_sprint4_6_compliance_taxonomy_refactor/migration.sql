-- Sprint 4.6 Block A — Compliance posture floor: primary_concern enum refactor.
--
-- Replaces the v1 hybrid `RecommendationPrimaryConcern` enum with two
-- context-specific value sets per COMPLIANCE.md §6.3 and the resolved Q-041:
--
--   Open-thread context (engaged / leaning_yes / committed):
--     pricing_concern, terms_concern, timing_concern,
--     co_decision_maker_household, external_advisor, co_owner_or_board,
--     service_or_capability_concern, other_open_thread
--
--   Decline-reason context (declined / dismissive):
--     pricing_uncompetitive, terms_uncompetitive, timing_misaligned,
--     chose_alternative_lender, chose_alternative_funding,
--     need_resolved_otherwise, need_no_longer_present,
--     wants_to_revisit_later, service_or_capability_concern,
--     other_member_stated
--
-- The `service_or_capability_concern` value is shared across both contexts.
--
-- Old → New value mapping (applied to existing rows below):
--   rate            → pricing_concern             (open-thread context)
--   timing          → timing_concern              (open-thread context)
--   spouse          → co_decision_maker_household (open-thread context)
--   cpa             → external_advisor            (open-thread context)
--   partner         → co_owner_or_board           (open-thread context)
--   bank_capability → service_or_capability_concern (shared)
--   does_not_qualify → NULL (dropped per COMPLIANCE.md §8.2; bank-side
--                            observations move to Closing notes free text)
--
-- The Sprint 4 §4.2a refinement #3 decline-reason values (terms_unfavorable,
-- going_with_competitor, no_longer_needed, lost_interest, found_alternative,
-- circumstances_changed) are also mapped to the new decline-reason set:
--   terms_unfavorable      → terms_uncompetitive
--   going_with_competitor  → chose_alternative_lender
--   no_longer_needed       → need_no_longer_present
--   lost_interest          → wants_to_revisit_later
--   found_alternative      → chose_alternative_funding
--   circumstances_changed  → need_no_longer_present
--
-- Values kept unchanged:
--   none, speed, commitment, other (legacy generic; renamed to other_open_thread
--                                   for current values in open-thread rows).
--   The `none` and `speed` and `commitment` values are dropped from the new
--   enum entirely; existing rows holding these values are migrated:
--     none       → NULL (no concern)
--     speed      → timing_concern (closest semantic match)
--     commitment → terms_concern  (closest semantic match)
--
-- SQLite stores enum columns as TEXT, so this migration is rows-only — no
-- DDL change at the database layer. The Prisma schema is updated separately
-- to reflect the new enum value set; Prisma will reject writes of dropped
-- values once the client is regenerated.

-- Migrate open-thread context values
UPDATE "Recommendation" SET "primary_concern" = 'pricing_concern'             WHERE "primary_concern" = 'rate';
UPDATE "Recommendation" SET "primary_concern" = 'timing_concern'              WHERE "primary_concern" = 'timing';
UPDATE "Recommendation" SET "primary_concern" = 'co_decision_maker_household' WHERE "primary_concern" = 'spouse';
UPDATE "Recommendation" SET "primary_concern" = 'external_advisor'            WHERE "primary_concern" = 'cpa';
UPDATE "Recommendation" SET "primary_concern" = 'co_owner_or_board'           WHERE "primary_concern" = 'partner';
UPDATE "Recommendation" SET "primary_concern" = 'service_or_capability_concern' WHERE "primary_concern" = 'bank_capability';

-- Drop bank-side determinations entirely (per COMPLIANCE.md §8.2)
UPDATE "Recommendation" SET "primary_concern" = NULL WHERE "primary_concern" = 'does_not_qualify';

-- Migrate Sprint 4 §4.2a decline-reason values
UPDATE "Recommendation" SET "primary_concern" = 'terms_uncompetitive'      WHERE "primary_concern" = 'terms_unfavorable';
UPDATE "Recommendation" SET "primary_concern" = 'chose_alternative_lender' WHERE "primary_concern" = 'going_with_competitor';
UPDATE "Recommendation" SET "primary_concern" = 'need_no_longer_present'   WHERE "primary_concern" = 'no_longer_needed';
UPDATE "Recommendation" SET "primary_concern" = 'wants_to_revisit_later'   WHERE "primary_concern" = 'lost_interest';
UPDATE "Recommendation" SET "primary_concern" = 'chose_alternative_funding' WHERE "primary_concern" = 'found_alternative';
UPDATE "Recommendation" SET "primary_concern" = 'need_no_longer_present'   WHERE "primary_concern" = 'circumstances_changed';

-- Migrate residual legacy values
UPDATE "Recommendation" SET "primary_concern" = NULL              WHERE "primary_concern" = 'none';
UPDATE "Recommendation" SET "primary_concern" = 'timing_concern'  WHERE "primary_concern" = 'speed';
UPDATE "Recommendation" SET "primary_concern" = 'terms_concern'   WHERE "primary_concern" = 'commitment';

-- Migrate generic 'other' to context-appropriate value. Since SQLite has no
-- knowledge of context, all surviving 'other' rows are migrated to
-- 'other_open_thread'. Decline-context rows that need 'other_member_stated'
-- will be re-captured via the form post-deploy.
UPDATE "Recommendation" SET "primary_concern" = 'other_open_thread' WHERE "primary_concern" = 'other';
