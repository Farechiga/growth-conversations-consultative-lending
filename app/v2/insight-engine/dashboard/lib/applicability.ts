/*
 * Sprint 7b — Member-Type × Track applicability matrix for the
 * dashboard drill-downs.
 *
 * Mirrors the locked matrix from Sprint 9 Patch E
 * (`prisma/seed-matrix.ts` → TRACK_TEMPLATES[].member_type_applicability).
 * The dashboard renders against synthetic Members + closed deals (not
 * the Prisma TrackTemplate rows) so the lookup lives client-side as a
 * constant. Keep this in sync with the seed if the matrix ever changes.
 */

import type { MemberType, TrackId } from "@/lib/synthetic-data/types";

export const TRACK_APPLICABILITY: Record<TrackId, MemberType[]> = {
  "TRACK-001": [
    "event_services",
    "maintenance_services",
    "food_services",
    "retail",
  ],
  "TRACK-002": ["maintenance_services", "food_services", "construction"],
  "TRACK-003": [
    "specialty_manufacturer",
    "professional_services",
    "healthcare_services",
    "retail",
  ],
  "TRACK-004": ["specialty_manufacturer"],
  "TRACK-006": ["professional_services"],
  "TRACK-007": [
    "maintenance_services",
    "specialty_manufacturer",
    "healthcare_services",
    "food_services",
    "construction",
  ],
  "TRACK-008": ["specialty_manufacturer", "healthcare_services"],
  "TRACK-009": ["specialty_manufacturer", "healthcare_services"],
  "TRACK-010": [
    "event_services",
    "professional_services",
    "food_services",
    "retail",
  ],
  "TRACK-011": ["event_services", "maintenance_services", "construction"],
};

export function isApplicable(
  memberType: MemberType,
  trackId: TrackId,
): boolean {
  const list = TRACK_APPLICABILITY[trackId];
  if (!list) return true; // unknown Track → treat as applicable (no flag)
  return list.includes(memberType);
}
