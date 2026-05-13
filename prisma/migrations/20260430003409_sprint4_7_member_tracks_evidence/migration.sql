-- Sprint 4.7 Block M — add tracks_by_evidence_strength Json column on Member.
-- Hand-curated per fixture; surfaces in v2 Land objective's Tracks-supported
-- panel per ARCHITECTURE_V2 §10.4.
ALTER TABLE "Member" ADD COLUMN "tracks_by_evidence_strength" JSONB;
