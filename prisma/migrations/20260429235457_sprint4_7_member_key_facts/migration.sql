-- Sprint 4.7 Block D — Member.key_facts column for v2 workstation key
-- facts strip (ARCHITECTURE_V2 §6.2). Json shape:
--   [{ label, value, source_type, source_id }, ...]
-- 3-5 hand-curated facts per Member fixture; seed populates.

ALTER TABLE "Member" ADD COLUMN "key_facts" JSONB;
