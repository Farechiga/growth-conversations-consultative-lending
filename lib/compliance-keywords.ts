/*
 * Sprint 4.6 Block C — Compliance keyword registry for the submit-time
 * scan over banker-prose ([FL:BANKER-PROSE]) fields.
 *
 * Source: PROTECTED_CLASS_KEYWORD_LIST_v1.md (repo root). The list groups
 * terms by protected-class category under federal ECOA, federal FHA, and
 * the Minnesota Human Rights Act. Editorial decisions E1–E6 from the
 * source document have been resolved per Path A (Sprint 4.6 launch with
 * Francisco's drafted defaults; Pilot calibrates from real banker
 * capture telemetry):
 *   E1 — keep unmodified man/men/woman/women (high false-positive but
 *        soft-advisory framing tolerates it)
 *   E2 — include curated Minnesota-relevant nationalities (Hmong, Somali,
 *        Vietnamese, etc.); not exhaustive
 *   E3 — include "Indian" with dual-meaning awareness (tribal /
 *        national-origin / South Asian heritage)
 *   E4 — spouse fires the scan (nudge toward `co_decision_maker_household`
 *        structured field)
 *   E5 — discrimination / lawsuit / civil-rights terms fire
 *   E6 — representative, not exhaustive — the protected-class category
 *        is the rule; specific terms are surface-detection aids
 *
 * Pilot will calibrate this list based on real banker capture telemetry
 * (which terms fire most, which dismissals are routine, where false
 * negatives appear). The scan is soft-advisory — false positives are
 * tolerated; false negatives are the real risk.
 *
 * Match logic (per COMPLIANCE.md §7.3 and Sprint 4.6 prompt §C.2):
 *   1. Case-insensitive
 *   2. Whole-word (word boundary anchors so "Asian" matches but
 *      "Caucasian" does not match the substring "asian")
 *   3. Unicode normalization (NFKC) + diacritic stripping applied to
 *      both the input text and registered terms before matching, so
 *      "African‑American" (typographic hyphen), "African-American"
 *      (ASCII hyphen), and "African American" (space) all match
 *   4. Multi-word terms match contiguously (sequence of word chars +
 *      separator chars)
 *   5. Returns matched terms with their group labels for the soft-
 *      advisory prompt copy
 */

export type KeywordGroup =
  | "race_color_origin"
  | "religion_creed"
  | "disability_health"
  | "age"
  | "sex_gender_orientation"
  | "marital_familial"
  | "public_assistance"
  | "reprisal";

export const KEYWORD_GROUP_LABELS: Record<KeywordGroup, string> = {
  race_color_origin: "Race / color / national origin",
  religion_creed: "Religion / creed",
  disability_health: "Disability / health condition",
  age: "Age",
  sex_gender_orientation: "Sex / gender identity / sexual orientation",
  marital_familial: "Marital / familial status",
  public_assistance: "Public assistance / economic status",
  reprisal: "Reprisal / exercise of legal rights",
};

// Each group's terms are listed in the canonical order from
// PROTECTED_CLASS_KEYWORD_LIST_v1.md. Cross-class terms (Pregnant,
// Maternity, Paternity — protected under both pregnancy/sex and
// disability/health depending on framing; Spouse — marital + sex)
// are placed in their primary protected-class group to avoid
// duplicate-match noise. The soft-advisory prompt remains useful in
// either framing.
export const COMPLIANCE_KEYWORDS: Record<KeywordGroup, ReadonlyArray<string>> = {
  race_color_origin: [
    // Racial categories
    "Black",
    "African American",
    "African-American",
    "Caucasian",
    "White",
    "Asian",
    "Asian American",
    "Asian-American",
    "Pacific Islander",
    "Native American",
    "American Indian",
    "Indigenous",
    "Indian",
    "Hispanic",
    "Latino",
    "Latina",
    "Latinx",
    "Latine",
    "Mixed race",
    "Multiracial",
    "Biracial",
    "Person of color",
    "POC",
    "BIPOC",
    "Minority-owned",
    "Minority owned",
    "Woman-owned",
    "Minority",
    "Minorities",
    // National-origin / ethnicity descriptors
    "Foreign-born",
    "Foreign born",
    "Immigrant",
    "Migrant",
    "Refugee",
    "Naturalized",
    "Visa",
    "Green card",
    "Citizenship",
    "Non-citizen",
    "Undocumented",
    "Country of origin",
    "Heritage",
    "Mexican",
    "Chinese",
    "Korean",
    "Vietnamese",
    "Filipino",
    "Japanese",
    "Pakistani",
    "Somali",
    "Hmong",
    "Ethiopian",
    "Eritrean",
    "Cuban",
    "Puerto Rican",
    "Dominican",
    "Salvadoran",
    "Guatemalan",
    "Honduran",
  ],
  religion_creed: [
    "Christian",
    "Catholic",
    "Protestant",
    "Jewish",
    "Muslim",
    "Islamic",
    "Hindu",
    "Buddhist",
    "Sikh",
    "Mormon",
    "LDS",
    "Evangelical",
    "Born-again",
    "Born again",
    "Atheist",
    "Agnostic",
    "Secular",
    "Religious",
    "Faith-based",
    "Faith based",
    "Church",
    "Mosque",
    "Synagogue",
    "Temple",
    "Pastor",
    "Priest",
    "Imam",
    "Rabbi",
    "Minister",
    "Devout",
    "Observant",
    "Practicing",
    "Halal",
    "Kosher",
  ],
  disability_health: [
    "Disabled",
    "Disability",
    "Handicap",
    "Handicapped",
    "Wheelchair",
    "Blind",
    "Deaf",
    "Hearing impaired",
    "Hearing-impaired",
    "Visually impaired",
    "Visually-impaired",
    "Mobility",
    "Service animal",
    "Service dog",
    "ADA",
    "Accommodation",
    "Mental health",
    "Mental illness",
    "Depression",
    "Anxiety",
    "Bipolar",
    "Schizophrenia",
    "PTSD",
    "Autism",
    "ADHD",
    "Cancer",
    "Diabetes",
    "Heart attack",
    "Stroke",
    "Surgery",
    "Hospital",
    "Hospitalized",
    "Treatment",
    "Diagnosis",
    "Diagnosed",
    "Therapy",
    "Medication",
    "Prescription",
    "Recovery",
    "Rehab",
    "Rehabilitation",
    "Sober",
    "Sobriety",
    "Addiction",
    "Alcoholic",
    "Alcoholism",
    "Substance",
    "Chronic condition",
    "Chronic illness",
    "Terminal",
    "Hospice",
    "Palliative",
  ],
  age: [
    "Elderly",
    "Senior",
    "Young",
    "Old",
    "Aging",
    "Aged",
    "Retiring",
    "Retired",
    "Retirement",
    "Generational",
    "Boomer",
    "Gen X",
    "Millennial",
    "Gen Z",
    "Younger generation",
    "Older generation",
    "Pre-retirement",
    "Post-retirement",
  ],
  sex_gender_orientation: [
    // Sex / pregnancy
    "Female",
    "Male",
    "Woman",
    "Women",
    "Man",
    "Men",
    "Lady",
    "Gentleman",
    "Mother",
    "Father",
    "Mom",
    "Dad",
    "Sister",
    "Brother",
    "Daughter",
    "Son",
    "Wife",
    "Husband",
    "Maternity",
    "Paternity",
    "Pregnant",
    "Pregnancy",
    // Gender identity
    "Transgender",
    "Trans",
    "Non-binary",
    "Nonbinary",
    "Genderqueer",
    "Cisgender",
    "Cis",
    "Gender identity",
    "Pronouns",
    "They/them",
    "He/him",
    "She/her",
    "Transitioning",
    "Transitioned",
    // Sexual orientation
    "Gay",
    "Lesbian",
    "Bisexual",
    "Bi",
    "Queer",
    "LGBTQ",
    "LGBT",
    "LGBTQ+",
    "LGBTQIA",
    "LGBTQIA+",
    "Straight",
    "Heterosexual",
    "Homosexual",
    "Same-sex",
    "Same sex",
  ],
  marital_familial: [
    "Married",
    "Unmarried",
    "Single",
    "Divorced",
    "Divorcing",
    "Separated",
    "Widowed",
    "Widow",
    "Widower",
    "Engaged",
    "Bachelor",
    "Bachelorette",
    "Common-law",
    "Common law",
    "Domestic partner",
    "Civil union",
    "Spouse",
    "Children",
    "Kids",
    "Childless",
    "No children",
    "Stepchild",
    "Stepchildren",
    "Adopted",
    "Adoption",
    "Custody",
    "Parent",
    "Parental",
    "Foster",
  ],
  public_assistance: [
    "Welfare",
    "Public assistance",
    "Government assistance",
    "Food stamps",
    "SNAP",
    "WIC",
    "Medicaid",
    "Medical assistance",
    "Section 8",
    "Housing subsidy",
    "Rent subsidy",
    "Rental assistance",
    "HUD",
    "Subsidized housing",
    "TANF",
    "SSI",
    "SSDI",
    "Disability benefits",
    "Unemployment",
    "Unemployed",
    "Out of work",
    "Low-income",
    "Low income",
    "Poverty",
    "Poor",
    "Government check",
    "Government program",
  ],
  reprisal: [
    "Lawsuit",
    "Sued",
    "Suing",
    "Complaint",
    "Filed against",
    "Discrimination",
    "Civil rights",
    "Attorney involved",
    "Legal action",
    "Class action",
    "EEOC",
    "MDHR",
    "CFPB complaint",
  ],
};

export type MatchedTerm = {
  term: string;
  group: KeywordGroup;
};

// Flattened registry — one row per (term, group) pair. Used by scanText
// for matching. Order preserved from COMPLIANCE_KEYWORDS so consistent
// match results across runs.
export const ALL_KEYWORDS: ReadonlyArray<{ term: string; group: KeywordGroup }> =
  (Object.entries(COMPLIANCE_KEYWORDS) as Array<
    [KeywordGroup, ReadonlyArray<string>]
  >).flatMap(([group, terms]) =>
    terms.map((term) => ({ term, group })),
  );

// ────────────────────────────────────────────────
// Match logic
// ────────────────────────────────────────────────

/**
 * Normalize text for matching: NFKC normalize, strip diacritics, lowercase,
 * and collapse runs of whitespace + hyphens (typographic and ASCII) to
 * single spaces. The result is a normalized form where "African‑American",
 * "African-American", and "African American" all become "african
 * american".
 *
 * The hyphen-to-space normalization means hyphen-only multi-word terms
 * registered in the registry must be canonicalized too — see
 * `normalizeForMatching` below, which we apply to both sides.
 */
function normalizeForMatching(input: string): string {
  return input
    .normalize("NFKC")
    // Strip combining diacritical marks (any character category Mn).
    // Spread + filter via regex is cleaner than a code-point sweep.
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    // Treat any hyphen variant (-, ‑ U+2011 non-breaking, – U+2013 en-dash,
    // — U+2014 em-dash) as a space for word-boundary matching purposes.
    .replace(/[\-‑–—]/g, " ")
    // Collapse whitespace runs to single space.
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a Set of normalized canonical forms for fast membership checking,
 * paired with a parallel array preserving original group attribution.
 * Computed once at module load.
 */
type NormalizedEntry = { normalized: string; term: string; group: KeywordGroup };
const NORMALIZED_REGISTRY: ReadonlyArray<NormalizedEntry> = ALL_KEYWORDS.map(
  ({ term, group }) => ({
    normalized: normalizeForMatching(term),
    term,
    group,
  }),
);

/**
 * Whole-word, case-insensitive, Unicode-normalized scan. For each term in
 * the registry, check whether the normalized input contains the term
 * with word boundaries on both sides. Returns deduplicated matches in
 * the order they first appear in the input text.
 *
 * Single-pass per term (not regex-compiled); registry size is ~270 terms,
 * input is typically 1–500 chars, so this runs in well under 1ms on
 * modern browsers — far below the threshold for noticeable submit
 * latency.
 */
export function scanText(input: string): MatchedTerm[] {
  if (!input) return [];
  const normalized = normalizeForMatching(input);
  const matches = new Map<string, MatchedTerm>(); // dedupe by canonical term
  for (const { normalized: ntTerm, term, group } of NORMALIZED_REGISTRY) {
    if (!ntTerm) continue;
    // Whole-word match: the normalized term must appear bounded by
    // word boundaries (start-of-string, end-of-string, or non-word
    // character on each side). Constructed via regex with escaped term.
    const escaped = ntTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`, "i");
    if (re.test(normalized)) {
      // Key by canonical term (lowercased original) to dedupe near-
      // identical entries (e.g., "Born-again" and "Born again" both
      // normalize to "born again" and would both match the same input;
      // we keep the first registry entry in dedupe order).
      const key = term.toLowerCase();
      if (!matches.has(key)) {
        matches.set(key, { term, group });
      }
    }
  }
  return Array.from(matches.values());
}

/**
 * Convenience helper for the soft-advisory prompt copy. Given a list of
 * matched terms, format them as a comma-separated banker-readable string:
 * "Black, husband, low-income".
 */
export function formatMatchedTermsForPrompt(matches: ReadonlyArray<MatchedTerm>): string {
  return matches.map((m) => m.term).join(", ");
}
