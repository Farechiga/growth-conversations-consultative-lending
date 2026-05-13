/*
 * Sprint 7a Block A — seedable pseudo-random number generator.
 *
 * Mulberry32 — small, fast, sufficient for deterministic synthetic
 * data. Same seed produces the same stream every run.
 */

export type Rng = {
  next: () => number;
  nextInt: (min: number, max: number) => number;
  nextFloat: (min: number, max: number) => number;
  pick: <T>(arr: readonly T[]) => T;
  weightedPick: <T>(arr: readonly T[], weights: readonly number[]) => T;
};

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const nextInt = (min: number, max: number) =>
    Math.floor(next() * (max - min + 1)) + min;
  const nextFloat = (min: number, max: number) => next() * (max - min) + min;
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)]!;
  const weightedPick = <T>(arr: readonly T[], weights: readonly number[]) => {
    const total = weights.reduce((s, w) => s + w, 0);
    let roll = next() * total;
    for (let i = 0; i < arr.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) return arr[i]!;
    }
    return arr[arr.length - 1]!;
  };
  return { next, nextInt, nextFloat, pick, weightedPick };
}
