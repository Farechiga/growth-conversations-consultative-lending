/*
 * Sprint 7a Block A — synthetic data type definitions per Stages 1-5.
 *
 * These types match the schema-notes sections in each Stage doc
 * (Stage 1 §5, Stage 2 §10, Stage 3 §8, Stage 4 §9, Stage 5 §17).
 *
 * Naming convention: all IDs use the canonical NNN format (BRANCH-NNN,
 * BANKER-NNN, MEMBER-NNN, DEAL-NNN). TrackTemplate IDs follow the
 * existing TRACK-NNN convention from the demo schema.
 */

export type BranchTier = "major" | "regional" | "standard" | "outstate";

export type Branch = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  tier: BranchTier;
};

export type BankerSpecialty =
  | "general"
  | "sba_focused"
  | "cre_focused"
  | "treasury_focused";

export type BankerActivityLevel = "high" | "medium" | "low";

export type Banker = {
  id: string;
  name: string;
  primary_branch_id: string;
  additional_branch_ids: string[];
  tenure_years: number;
  specialty: BankerSpecialty;
  activity_level: BankerActivityLevel;
  target_member_count: number;
};

export type MemberType =
  | "event_services"
  | "maintenance_services"
  | "specialty_manufacturer"
  | "professional_services"
  | "healthcare_services"
  | "food_services"
  | "retail"
  | "construction";

export const MEMBER_TYPE_LABELS: Record<MemberType, string> = {
  event_services: "Event services",
  maintenance_services: "Maintenance services",
  specialty_manufacturer: "Specialty manufacturer",
  professional_services: "Professional services",
  healthcare_services: "Healthcare services",
  food_services: "Food services",
  retail: "Retail",
  construction: "Construction",
};

export type Phase = "discover" | "measure" | "consult" | "navigate";

export const PHASE_LABELS: Record<Phase, string> = {
  discover: "Discover",
  measure: "Measure",
  consult: "Consult",
  navigate: "Navigate",
};

export type CaptureDensityTier = "little" | "some" | "lot";

export type SyntheticMember = {
  id: string;
  name: string;
  member_type: MemberType;
  banker_id: string;
  branch_id: string;
  latitude: number;
  longitude: number;
  current_phase: Phase;
  current_track_id: string; // TRACK-NNN
  days_in_current_phase: number;
  is_stage_skipping: boolean;
  sized_opportunity_amount: number;
  last_touch_at: Date;
  capture_count: number;
  open_thread_count: number;
  pending_action_card_count: number;
  capture_density_tier: CaptureDensityTier;
};

export type ClosedDeal = {
  id: string;
  originating_member_name: string;
  member_type: MemberType;
  originating_banker_id: string;
  originating_branch_id: string;
  track_id: string;
  closure_value: number;
  closure_date: Date;
  discover_date: Date;
  navigate_date: Date;
  days_discover_to_close: number;
  days_navigate_to_close: number;
  specialist_involved: boolean;
  specialist_banker_id: string | null;
  specialist_introduction_day: number | null;
  cdc_partner_involved: boolean;
  cdc_introduction_day: number | null;
  total_captures: number;
  insights_authored: number;
  is_featured: boolean;
  featured_narrative: FeaturedDealNarrative | null;
};

/**
 * Stage 5 §13.1 curated narratives for the "Conversations that became
 * deals" tile. Five hand-crafted records cycle through the tile.
 */
export type FeaturedDealNarrative = {
  rank: number; // 1..5
  headline: string; // e.g. "Closed Mar 14 — $3.2M SBA 504"
  cycle_label: string; // e.g. "From first conversation to close: 187 days"
  originating_quote: string;
  originating_quote_speaker: string;
  /**
   * Per Sprint 7a-patch §F: each key insight surfaces the matched
   * canonical Pattern's content. `label` is the abstract category tag;
   * `content` is the actual reframe/implication text the banker
   * authored against. `pattern_id` lets the tile cross-link to the
   * Pattern library if needed.
   */
  key_insights: Array<{
    day: number;
    type: "reframe" | "implication";
    label: string;
    pattern_id: string;
    content: string;
  }>;
  specialist_summary: string;
  banker_name: string;
};

export type BankerDailyActivity = {
  banker_id: string;
  events_count: number;
  insights_authored: number;
  members_progressed: number;
  on_vacation: boolean;
};

export type DailyActivity = {
  date: Date;
  days_ago: number;
  factor_captures: number;
  signals: number;
  insights_authored: number;
  reactions: number;
  models: number;
  actions: number;
  show_events: number;
  per_banker_activity: Record<string, BankerDailyActivity>;
  discover_to_measure: number;
  measure_to_consult: number;
  consult_to_navigate: number;
  navigate_to_closed: number;
  insights_matched: number;
  insights_novel: number;
  open_thread_total: number;
  open_thread_recent: number;
  open_thread_aging: number;
  open_thread_stale: number;
};

export type FeaturedTemporalEvent = {
  days_ago: number;
  event_type:
    | "major_authoring_day"
    | "sba_close"
    | "pattern_promotion"
    | "peak_activity"
    | "stage_skip_catch";
  title: string;
  description: string;
  visual_marker: "spike" | "milestone" | "highlight";
};

export type TrackId =
  | "TRACK-001"
  | "TRACK-002"
  | "TRACK-003"
  | "TRACK-004"
  | "TRACK-006"
  | "TRACK-007"
  | "TRACK-008"
  | "TRACK-009"
  | "TRACK-010"
  | "TRACK-011";

export const TRACK_LABELS: Record<TrackId, string> = {
  "TRACK-001": "Working Capital LOC",
  "TRACK-002": "Business Vehicle Loan",
  "TRACK-003": "CRE Term Loan",
  "TRACK-004": "SBA 7(a)",
  "TRACK-006": "Investment Property Loan",
  "TRACK-007": "Equipment & Machinery",
  "TRACK-008": "SBA 504",
  "TRACK-009": "PACE Loan",
  "TRACK-010": "Business Visa Credit Card",
  "TRACK-011": "Unsecured Loan",
};

/**
 * Per Sprint 5c, Blaze offers 8 of these today; TRACK-001 (Working
 * Capital LOC) and TRACK-004 (SBA 7(a)) are future-expansion products
 * retained for matrix coverage. Dashboards distinguish the two groups.
 */
export const BLAZE_OFFERED_TRACKS = new Set<TrackId>([
  "TRACK-002",
  "TRACK-003",
  "TRACK-006",
  "TRACK-007",
  "TRACK-008",
  "TRACK-009",
  "TRACK-010",
  "TRACK-011",
]);

export const FUTURE_EXPANSION_TRACKS = new Set<TrackId>([
  "TRACK-001",
  "TRACK-004",
]);

/** Stage 5 §3.3 stickiness factors per Track. */
export const TRACK_STICKINESS: Record<TrackId, number> = {
  "TRACK-001": 0.75,
  "TRACK-002": 0.72,
  "TRACK-003": 0.84,
  "TRACK-004": 0.7,
  "TRACK-006": 0.78,
  "TRACK-007": 0.75,
  "TRACK-008": 0.92,
  "TRACK-009": 0.67,
  "TRACK-010": 0.64,
  "TRACK-011": 0.6,
};

export type TrackMetrics = {
  track_id: TrackId;
  member_count: number;
  pipeline_value: number;
  median_size: number;
  closed_count_12mo: number;
  closed_value_12mo: number;
  conversion_rate: number;
  avg_days_discover_to_close: number;
  stickiness: number;
  is_blaze_offered: boolean;
};

export type BankerMetrics = {
  banker_id: string;
  member_count: number;
  pipeline_value: number;
  closed_count_12mo: number;
  closed_value_12mo: number;
  closure_rate: number;
  insights_authored_90d: number;
  total_activity_90d: number;
};

export type BranchMetrics = {
  branch_id: string;
  member_count: number;
  pipeline_value: number;
  closed_count_12mo: number;
  closed_value_12mo: number;
  conversion_rate: number;
  activity_per_day_avg: number;
};

export type MemberTypeMetrics = {
  member_type: MemberType;
  member_count: number;
  pipeline_value: number;
  closed_count_12mo: number;
  closed_value_12mo: number;
  top_track_id: TrackId | null;
};

export type AggregateMetrics = {
  pipeline_value_face: number;
  pipeline_value_weighted: number;
  members_in_cultivation: number;
  conversations_this_week: number;
  insights_this_week: number;
  avg_discover_to_navigate_days: number;
  closed_value_12mo: number;
  closed_count_12mo: number;
  conversations_sparkline: number[]; // 12 weeks
  insights_sparkline: number[]; // 12 weeks
  closures_sparkline: number[]; // 12 months
  funnel_counts: Record<Phase, number>;
  funnel_flow_rates: {
    discover_to_measure: number;
    measure_to_consult: number;
    consult_to_navigate: number;
    navigate_to_closed: number;
  };
  track_metrics: Record<TrackId, TrackMetrics>;
  banker_metrics: Record<string, BankerMetrics>;
  branch_metrics: Record<string, BranchMetrics>;
  member_type_metrics: Record<MemberType, MemberTypeMetrics>;
  top_patterns: Array<{
    pattern_id: string;
    pattern_label: string;
    match_count_90d: number;
    banker_count: number;
    tracks: TrackId[];
  }>;
};

export type SyntheticDataset = {
  branches: Branch[];
  bankers: Banker[];
  members: SyntheticMember[];
  closed_deals: ClosedDeal[];
  daily_activity: DailyActivity[];
  featured_temporal_events: FeaturedTemporalEvent[];
  aggregate_metrics: AggregateMetrics;
};
