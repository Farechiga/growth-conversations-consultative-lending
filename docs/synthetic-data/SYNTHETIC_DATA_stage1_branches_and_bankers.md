# Stage 1 — Branches and Bankers (Foundation)

Synthetic data foundation for Insight Engine dashboard. Branches and bankers establish the spatial and organizational structure that everything else attaches to.

**Total scope:** 28 branches across MSP-area + outstate Minnesota; 14 bankers with attributes.

---

## Section 1 — Branches (28)

Branch list inferred from the Blaze location map screenshot. Branches concentrate in MSP metro with outstate coverage in central and southern Minnesota.

Coordinates use approximate lat/lng for synthetic purposes. Real Blaze locations may differ slightly; close enough for demo map rendering.

### 1.1 MSP metro branches (20)

| ID | Branch name | City | Lat | Lng | Tier |
|---|---|---|---|---|---|
| BRANCH-001 | Minneapolis Downtown | Minneapolis | 44.9778 | -93.2650 | Major |
| BRANCH-002 | St. Paul Downtown | St. Paul | 44.9537 | -93.0900 | Major |
| BRANCH-003 | Maple Grove | Maple Grove | 45.0725 | -93.4558 | Major |
| BRANCH-004 | Edina | Edina | 44.8897 | -93.3499 | Major |
| BRANCH-005 | Bloomington | Bloomington | 44.8408 | -93.2983 | Major |
| BRANCH-006 | Plymouth | Plymouth | 45.0105 | -93.4555 | Standard |
| BRANCH-007 | Roseville | Roseville | 45.0061 | -93.1567 | Standard |
| BRANCH-008 | Burnsville | Burnsville | 44.7677 | -93.2777 | Standard |
| BRANCH-009 | Woodbury | Woodbury | 44.9239 | -92.9594 | Standard |
| BRANCH-010 | Eagan | Eagan | 44.8041 | -93.1669 | Standard |
| BRANCH-011 | Coon Rapids | Coon Rapids | 45.1199 | -93.2876 | Standard |
| BRANCH-012 | Anoka | Anoka | 45.1977 | -93.3872 | Standard |
| BRANCH-013 | Brooklyn Park | Brooklyn Park | 45.0941 | -93.3563 | Standard |
| BRANCH-014 | Apple Valley | Apple Valley | 44.7319 | -93.2177 | Standard |
| BRANCH-015 | Lakeville | Lakeville | 44.6497 | -93.2427 | Standard |
| BRANCH-016 | Eden Prairie | Eden Prairie | 44.8547 | -93.4708 | Standard |
| BRANCH-017 | Minnetonka | Minnetonka | 44.9211 | -93.4687 | Standard |
| BRANCH-018 | Shakopee | Shakopee | 44.7973 | -93.5269 | Standard |
| BRANCH-019 | Stillwater | Stillwater | 45.0563 | -92.8060 | Standard |
| BRANCH-020 | Cottage Grove | Cottage Grove | 44.8278 | -92.9438 | Standard |

### 1.2 Outstate branches (8)

| ID | Branch name | City | Lat | Lng | Tier |
|---|---|---|---|---|---|
| BRANCH-021 | St. Cloud | St. Cloud | 45.5579 | -94.1632 | Regional |
| BRANCH-022 | Princeton | Princeton | 45.5694 | -93.5810 | Outstate |
| BRANCH-023 | Mora | Mora | 45.8772 | -93.2944 | Outstate |
| BRANCH-024 | Pine City | Pine City | 45.8266 | -92.9683 | Outstate |
| BRANCH-025 | Ogilvie | Ogilvie | 45.8358 | -93.4283 | Outstate |
| BRANCH-026 | Milaca | Milaca | 45.7569 | -93.6519 | Outstate |
| BRANCH-027 | Waseca | Waseca | 44.0780 | -93.5072 | Outstate |
| BRANCH-028 | Rochester | Rochester | 44.0121 | -92.4802 | Regional |

### 1.3 Branch tier definitions

Tier informs banker staffing and pipeline weight:

- **Major** (5 branches): Primary urban centers. Multiple bankers; specialist coverage on-site. Higher Member density.
- **Regional** (2 branches): Outstate hubs (St. Cloud, Rochester). Often 1-2 bankers; specialist coverage via traveling specialists or regional teams.
- **Standard** (15 branches): MSP-area suburban locations. Typically 1 banker per branch.
- **Outstate** (6 branches): Smaller rural/exurban locations. Often shared bankers covering multiple branches.

### 1.4 Total Member capacity by branch tier

For pipeline scale planning:
- 5 Major branches × ~20 Members each = 100 Members
- 2 Regional branches × ~12 Members each = 24 Members
- 15 Standard branches × ~5 Members each = 75 Members
- 6 Outstate branches × ~2 Members each = 12 Members
- **Total target: ~210 Members across portfolio**

Lands close to the 200-Member target for Stage 2.

---

## Section 2 — Bankers (14)

Banker roster sized for the 200-Member portfolio. Names follow Minnesota demographic patterns — Scandinavian, German, Eastern European mixed with broader American names. Includes Hmong, Somali, and Latino representation reflecting MSP demographics.

### 2.1 Banker attributes

Each banker has:
- **Banker ID** (BANKER-NNN)
- **Name** (first + last)
- **Branch assignment** (1-2 branches; some bankers cover multiple outstate branches)
- **Tenure** (years at Blaze; range 2-25)
- **Specialty focus** (general / SBA-focused / CRE-focused / treasury-focused)
- **Activity level** (high / medium / low — drives capture density and pipeline volume)
- **Member count** (target Members in active cultivation)

### 2.2 Banker roster

| ID | Name | Primary branch | Tenure | Specialty | Activity | Members |
|---|---|---|---|---|---|---|
| BANKER-001 | Scott Brynjolffson | Minneapolis Downtown | 12 | General | High | 18 |
| BANKER-002 | Sarah Chen | Edina | 8 | CRE-focused | High | 22 |
| BANKER-003 | Marcus Johansson | St. Paul Downtown | 18 | General | High | 24 |
| BANKER-004 | Linnea Petersen | Maple Grove | 6 | SBA-focused | Medium | 16 |
| BANKER-005 | David Nguyen | Bloomington | 10 | General | High | 20 |
| BANKER-006 | Rachel Goldman | Edina | 15 | CRE-focused | Medium | 18 |
| BANKER-007 | Tom Olsson | Woodbury, Stillwater | 22 | General | Medium | 16 |
| BANKER-008 | Maria Reyes | Burnsville, Apple Valley | 5 | General | High | 17 |
| BANKER-009 | James Patterson | Minneapolis Downtown | 14 | SBA-focused | Medium | 14 |
| BANKER-010 | Karin Lindgren | Plymouth, Minnetonka | 9 | Treasury-focused | Medium | 12 |
| BANKER-011 | Abdirahman Hassan | Brooklyn Park, Coon Rapids | 4 | General | High | 15 |
| BANKER-012 | Robert Anderson | Roseville, Eagan | 25 | General | Low | 10 |
| BANKER-013 | Jennifer Vang | St. Cloud, Princeton, Milaca | 7 | General | Medium | 12 |
| BANKER-014 | Diana Reyes | Rochester, Waseca | 11 | CRE-focused | Medium | 11 |

**Total Member coverage: 225** (slightly above 200 target; allows for sparse outstate coverage).

### 2.3 Specialty distribution

- **General** (8 bankers): Default banker role; covers all Track types
- **CRE-focused** (3 bankers): Sarah Chen, Rachel Goldman, Diana Reyes — heavy CRE Term Loan and SBA 504 coverage
- **SBA-focused** (2 bankers): Linnea Petersen, James Patterson — SBA 7(a) and SBA 504 expertise (Patterson is also the SBA specialist named in the Capital event partnership map artifact)
- **Treasury-focused** (1 banker): Karin Lindgren — Treasury Services and adjacent products

### 2.4 Activity level distribution

- **High activity** (5 bankers): 65-75% of weekly capture/conversation volume; 18-24 Members each
- **Medium activity** (7 bankers): 25-30% of weekly volume; 11-18 Members each
- **Low activity** (1 banker, Robert Anderson): 5-10% of weekly volume; 10 Members; tenured banker winding down toward retirement; useful contrast for banker activity heatmap

### 2.5 Multi-branch banker handling

Three bankers cover multiple branches (typical for outstate coverage):
- Tom Olsson: Woodbury (primary) + Stillwater
- Maria Reyes: Burnsville (primary) + Apple Valley
- Karin Lindgren: Plymouth (primary) + Minnetonka
- Abdirahman Hassan: Brooklyn Park (primary) + Coon Rapids
- Jennifer Vang: St. Cloud (primary) + Princeton + Milaca (3 outstate branches)
- Diana Reyes: Rochester (primary) + Waseca

Members distribute across all branches a banker covers based on physical location.

---

## Section 3 — Cross-references for downstream stages

Stage 1 establishes IDs and structure that Stages 2-5 reference:

**For Stage 2 (Member roster):**
- Each Member assigned to one BRANCH-NNN and one BANKER-NNN
- Banker assignment correlates with branch (banker covers Member's branch)
- Member count per banker matches Section 2.2 column

**For Stage 3 (Closed deals):**
- Each closed deal originated by one BANKER-NNN
- Branch assignment same as originating banker
- High-activity bankers produce more closed deals (correlation, not strict ratio)

**For Stage 4 (Temporal activity):**
- Banker activity per day correlates with activity level (high/medium/low)
- High-activity bankers contribute ~3x daily captures of low-activity bankers
- Branch tier affects banker stacking (Major branches show concentrated activity)

**For Stage 5 (Aggregate metrics):**
- Hero metrics aggregate across all bankers
- Banker activity heatmap renders all 14 bankers
- Geographic view places branches at coordinates with Member density circles

---

## Section 4 — Open items

**Decision needed:**

1. **Real branch names verification.** I inferred 28 branches from the screenshot. Visible markers showed clusters that I mapped to actual MSP suburbs. If Blaze's actual branch list differs (e.g., they have 25 branches not 28, or coverage extends further north), worth correcting before proceeding.

2. **Banker count: 14 acceptable?** Could expand to 15-18 for richer banker activity heatmap, or contract to 10-12 for cleaner visualization. 14 lands in middle.

3. **Specialty distribution: realistic for Blaze size?** A real credit union with ~200 active Members might have fewer specialists than I sketched. Worth confirming.

4. **Banker name aesthetic.** Names mix Scandinavian, German, Latino, Hmong, Somali, broader American. Reflects MSP demographics. Worth confirming this aesthetic feels right or whether to simplify to fewer ethnic groups.

---

## Section 5 — Schema notes for synthetic data generator

When CC implements the data generator (Sprint 7), Stage 1 produces:

```typescript
type Branch = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  tier: 'major' | 'regional' | 'standard' | 'outstate';
};

type Banker = {
  id: string;
  name: string;
  primary_branch_id: string;
  additional_branch_ids: string[];
  tenure_years: number;
  specialty: 'general' | 'sba_focused' | 'cre_focused' | 'treasury_focused';
  activity_level: 'high' | 'medium' | 'low';
  target_member_count: number;
};
```

Both types serialize to JSON for static demo data. Generator deterministic from seed value.

Stage 1 produces:
- 28 Branch records
- 14 Banker records
- Total: ~50KB of seed data

---

**End of Stage 1 — Branches and Bankers.**

Ready for review per Section 4 open items. After confirmation, Stage 2 (Member roster) begins.
