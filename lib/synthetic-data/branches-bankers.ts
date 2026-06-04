/*
 * Sprint 7a Block A — Stage 1 hard-coded branches + bankers.
 *
 * Per SYNTHETIC_DATA_stage1_branches_and_bankers.md §1-2 verbatim.
 */

import type { Banker, Branch } from "./types";

export const BRANCHES: Branch[] = [
  // MSP metro — Major (5)
  { id: "BRANCH-001", name: "Minneapolis Downtown", city: "Minneapolis", latitude: 44.9778, longitude: -93.2650, tier: "major" },
  { id: "BRANCH-002", name: "St. Paul Downtown", city: "St. Paul", latitude: 44.9537, longitude: -93.0900, tier: "major" },
  { id: "BRANCH-003", name: "Maple Grove", city: "Maple Grove", latitude: 45.0725, longitude: -93.4558, tier: "major" },
  { id: "BRANCH-004", name: "Edina", city: "Edina", latitude: 44.8897, longitude: -93.3499, tier: "major" },
  { id: "BRANCH-005", name: "Bloomington", city: "Bloomington", latitude: 44.8408, longitude: -93.2983, tier: "major" },
  // MSP metro — Standard (15)
  { id: "BRANCH-006", name: "Plymouth", city: "Plymouth", latitude: 45.0105, longitude: -93.4555, tier: "standard" },
  { id: "BRANCH-007", name: "Roseville", city: "Roseville", latitude: 45.0061, longitude: -93.1567, tier: "standard" },
  { id: "BRANCH-008", name: "Burnsville", city: "Burnsville", latitude: 44.7677, longitude: -93.2777, tier: "standard" },
  { id: "BRANCH-009", name: "Woodbury", city: "Woodbury", latitude: 44.9239, longitude: -92.9594, tier: "standard" },
  { id: "BRANCH-010", name: "Eagan", city: "Eagan", latitude: 44.8041, longitude: -93.1669, tier: "standard" },
  { id: "BRANCH-011", name: "Coon Rapids", city: "Coon Rapids", latitude: 45.1199, longitude: -93.2876, tier: "standard" },
  { id: "BRANCH-012", name: "Anoka", city: "Anoka", latitude: 45.1977, longitude: -93.3872, tier: "standard" },
  { id: "BRANCH-013", name: "Brooklyn Park", city: "Brooklyn Park", latitude: 45.0941, longitude: -93.3563, tier: "standard" },
  { id: "BRANCH-014", name: "Apple Valley", city: "Apple Valley", latitude: 44.7319, longitude: -93.2177, tier: "standard" },
  { id: "BRANCH-015", name: "Lakeville", city: "Lakeville", latitude: 44.6497, longitude: -93.2427, tier: "standard" },
  { id: "BRANCH-016", name: "Eden Prairie", city: "Eden Prairie", latitude: 44.8547, longitude: -93.4708, tier: "standard" },
  { id: "BRANCH-017", name: "Minnetonka", city: "Minnetonka", latitude: 44.9211, longitude: -93.4687, tier: "standard" },
  { id: "BRANCH-018", name: "Shakopee", city: "Shakopee", latitude: 44.7973, longitude: -93.5269, tier: "standard" },
  { id: "BRANCH-019", name: "Stillwater", city: "Stillwater", latitude: 45.0563, longitude: -92.8060, tier: "standard" },
  { id: "BRANCH-020", name: "Cottage Grove", city: "Cottage Grove", latitude: 44.8278, longitude: -92.9438, tier: "standard" },
  // Outstate (8)
  { id: "BRANCH-021", name: "St. Cloud", city: "St. Cloud", latitude: 45.5579, longitude: -94.1632, tier: "regional" },
  { id: "BRANCH-022", name: "Princeton", city: "Princeton", latitude: 45.5694, longitude: -93.5810, tier: "outstate" },
  { id: "BRANCH-023", name: "Mora", city: "Mora", latitude: 45.8772, longitude: -93.2944, tier: "outstate" },
  { id: "BRANCH-024", name: "Pine City", city: "Pine City", latitude: 45.8266, longitude: -92.9683, tier: "outstate" },
  { id: "BRANCH-025", name: "Ogilvie", city: "Ogilvie", latitude: 45.8358, longitude: -93.4283, tier: "outstate" },
  { id: "BRANCH-026", name: "Milaca", city: "Milaca", latitude: 45.7569, longitude: -93.6519, tier: "outstate" },
  { id: "BRANCH-027", name: "Waseca", city: "Waseca", latitude: 44.0780, longitude: -93.5072, tier: "outstate" },
  { id: "BRANCH-028", name: "Rochester", city: "Rochester", latitude: 44.0121, longitude: -92.4802, tier: "regional" },
];

export const BANKERS: Banker[] = [
  { id: "BANKER-001", name: "Scott Brynjolfsson", primary_branch_id: "BRANCH-001", additional_branch_ids: [], tenure_years: 12, specialty: "general", activity_level: "high", target_member_count: 18 },
  { id: "BANKER-002", name: "Margot Desandre", primary_branch_id: "BRANCH-004", additional_branch_ids: [], tenure_years: 8, specialty: "cre_focused", activity_level: "high", target_member_count: 22 },
  { id: "BANKER-003", name: "Marcus Johansson", primary_branch_id: "BRANCH-002", additional_branch_ids: [], tenure_years: 18, specialty: "general", activity_level: "high", target_member_count: 24 },
  { id: "BANKER-004", name: "Linnea Petersen", primary_branch_id: "BRANCH-003", additional_branch_ids: [], tenure_years: 6, specialty: "sba_focused", activity_level: "medium", target_member_count: 16 },
  { id: "BANKER-005", name: "David Nguyen", primary_branch_id: "BRANCH-005", additional_branch_ids: [], tenure_years: 10, specialty: "general", activity_level: "high", target_member_count: 20 },
  { id: "BANKER-006", name: "Rachel Goldman", primary_branch_id: "BRANCH-004", additional_branch_ids: [], tenure_years: 15, specialty: "cre_focused", activity_level: "medium", target_member_count: 18 },
  { id: "BANKER-007", name: "Tom Olsson", primary_branch_id: "BRANCH-009", additional_branch_ids: ["BRANCH-019"], tenure_years: 22, specialty: "general", activity_level: "medium", target_member_count: 16 },
  { id: "BANKER-008", name: "Maria Reyes", primary_branch_id: "BRANCH-008", additional_branch_ids: ["BRANCH-014"], tenure_years: 5, specialty: "general", activity_level: "high", target_member_count: 17 },
  { id: "BANKER-009", name: "Michael Nordgaard", primary_branch_id: "BRANCH-001", additional_branch_ids: [], tenure_years: 14, specialty: "sba_focused", activity_level: "medium", target_member_count: 14 },
  { id: "BANKER-010", name: "Karin Lindgren", primary_branch_id: "BRANCH-006", additional_branch_ids: ["BRANCH-017"], tenure_years: 9, specialty: "treasury_focused", activity_level: "medium", target_member_count: 12 },
  { id: "BANKER-011", name: "Abdirahman Hassan", primary_branch_id: "BRANCH-013", additional_branch_ids: ["BRANCH-011"], tenure_years: 4, specialty: "general", activity_level: "high", target_member_count: 15 },
  { id: "BANKER-012", name: "Robert Anderson", primary_branch_id: "BRANCH-007", additional_branch_ids: ["BRANCH-010"], tenure_years: 25, specialty: "general", activity_level: "low", target_member_count: 10 },
  { id: "BANKER-013", name: "Jennifer Vang", primary_branch_id: "BRANCH-021", additional_branch_ids: ["BRANCH-022", "BRANCH-026"], tenure_years: 7, specialty: "general", activity_level: "medium", target_member_count: 12 },
  { id: "BANKER-014", name: "Diana Reyes", primary_branch_id: "BRANCH-028", additional_branch_ids: ["BRANCH-027"], tenure_years: 11, specialty: "cre_focused", activity_level: "medium", target_member_count: 11 },
];
