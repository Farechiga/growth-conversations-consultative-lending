/*
 * Sprint 5a.1 Block E — Track ranking function.
 *
 * For a given Member, walks all TrackTemplates × MatrixEntries against
 * the Member's FactorCaptures. Returns ranked Tracks per the matrix
 * lookup logic, applying:
 *
 *   - 2-evidence-threshold filter (Tracks with <2 supporting entries
 *     fired are excluded from the ranked output)
 *   - Negative-count override (Tracks with any negative entry fired
 *     are returned but labeled "insufficient" regardless of positive
 *     count, per Sprint 5a.1 §E.3 demo discipline)
 *   - Sort order: most-negative first as demerit, then strong_count
 *     descending, then moderate_count descending
 *
 * Pure-function behavior beyond the necessary db reads (single
 * findMany per entity). Deterministic given the captured factor set.
 */

import type { PrismaClient } from "@/app/generated/prisma/client";
import {
  evaluateThreshold,
  type CaptureValueLike,
  type FactorMeta,
} from "./factor-evaluator";

export type RankedTrack = {
  track_id: string;
  track_name: string;
  banker_description: string;
  strength: "strong" | "moderate" | "insufficient";
  matrix_entries_fired: Array<{
    factor_id: string;
    factor_name: string;
    factor_field_name: string;
    strength: string;
    threshold_rule: string | null;
    banker_rationale: string;
  }>;
  strong_count: number;
  moderate_count: number;
  negative_count: number;
};

export async function rankTracksForMember(
  prisma: PrismaClient,
  memberId: string,
): Promise<RankedTrack[]> {
  // Pull all matrix data + this Member's captures in parallel.
  const [tracks, allEntries, allFactors, captureRows] = await Promise.all([
    prisma.trackTemplate.findMany(),
    prisma.matrixEntry.findMany(),
    prisma.businessFactor.findMany(),
    prisma.factorCapture.findMany({ where: { member_id: memberId } }),
  ]);

  // Index factors by id + by field_name; index captures by factor_id
  // and by field_name for cross-factor rule lookups.
  const factorById = new Map(allFactors.map((f) => [f.id, f]));
  const captureByFactorId = new Map(
    captureRows.map((c) => [c.factor_id, c]),
  );
  const captureByFieldName: Record<string, CaptureValueLike> = {};
  for (const c of captureRows) {
    const factor = factorById.get(c.factor_id);
    if (factor) {
      captureByFieldName[factor.field_name] = {
        numerical_value: c.numerical_value,
        boolean_value: c.boolean_value,
        qualitative_value: c.qualitative_value,
      };
    }
  }

  const ranked: RankedTrack[] = tracks.map((track) => {
    const trackEntries = allEntries.filter((e) => e.track_id === track.id);
    const fired: RankedTrack["matrix_entries_fired"] = [];
    let strong = 0;
    let moderate = 0;
    let negative = 0;

    for (const entry of trackEntries) {
      const factor = factorById.get(entry.factor_id);
      if (!factor) continue;
      const capture = captureByFactorId.get(entry.factor_id) ?? null;
      const meta: FactorMeta = {
        field_name: factor.field_name,
        capture_mode: factor.capture_mode,
      };
      const matched = evaluateThreshold(
        capture,
        meta,
        entry.threshold_rule,
        captureByFieldName,
      );
      if (matched) {
        fired.push({
          factor_id: entry.factor_id,
          factor_name: factor.name,
          factor_field_name: factor.field_name,
          strength: entry.strength,
          threshold_rule: entry.threshold_rule,
          banker_rationale: entry.banker_rationale,
        });
        if (entry.strength === "strong") strong++;
        else if (entry.strength === "moderate") moderate++;
        else if (entry.strength === "negative") negative++;
      }
    }

    // Strength label rules:
    //   strong      — strong_count >= 3 AND no negative
    //   moderate    — (strong >= 1 OR moderate >= 2) AND no negative
    //   insufficient — anything else
    let strength: RankedTrack["strength"];
    if (negative > 0) {
      strength = "insufficient";
    } else if (strong >= 3) {
      strength = "strong";
    } else if (strong >= 1 || moderate >= 2) {
      strength = "moderate";
    } else {
      strength = "insufficient";
    }

    return {
      track_id: track.id,
      track_name: track.name,
      banker_description: track.banker_description,
      strength,
      matrix_entries_fired: fired,
      strong_count: strong,
      moderate_count: moderate,
      negative_count: negative,
    };
  });

  // 2-evidence-threshold filter: only return Tracks with at least 2
  // supporting entries fired. Tracks below threshold are excluded
  // entirely from the ranked output (banker doesn't see them in the
  // switchboard).
  const filtered = ranked.filter(
    (t) => t.strong_count + t.moderate_count >= 2,
  );

  // Sort: negative_count ascending (demerit) → strong_count descending
  // → moderate_count descending. A Track with 1 negative reads as
  // "insufficient" regardless of positives, but stays in the list so
  // the banker can see what disqualified it.
  filtered.sort((a, b) => {
    if (a.negative_count !== b.negative_count) {
      return a.negative_count - b.negative_count;
    }
    if (a.strong_count !== b.strong_count) {
      return b.strong_count - a.strong_count;
    }
    return b.moderate_count - a.moderate_count;
  });

  return filtered;
}
