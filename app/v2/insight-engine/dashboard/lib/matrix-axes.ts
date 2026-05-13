/*
 * Sprint 7b — canonical axis ordering for Member-Type × Track surfaces.
 *
 * Order is stable across views: matrix rows, funnel small-multiples,
 * and any cross-view filter chips read in this order. Member-Types
 * follow the synthetic-data convention; Tracks read in the same order
 * as the lending-product treemap (existing family clustering).
 */

import type { MemberType, TrackId } from "@/lib/synthetic-data/types";

export const MEMBER_TYPES: readonly MemberType[] = [
  "event_services",
  "maintenance_services",
  "specialty_manufacturer",
  "professional_services",
  "healthcare_services",
  "food_services",
  "retail",
  "construction",
];

export const ALL_TRACK_IDS: readonly TrackId[] = [
  "TRACK-001",
  "TRACK-002",
  "TRACK-003",
  "TRACK-004",
  "TRACK-006",
  "TRACK-007",
  "TRACK-008",
  "TRACK-009",
  "TRACK-010",
  "TRACK-011",
];
