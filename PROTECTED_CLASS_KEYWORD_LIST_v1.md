# Protected-class keyword list — submit-time text scan, v1

**Status:** Draft for Francisco's editorial review prior to CC implementation.
**Purpose:** Source list for the submit-time advisory text scan that surfaces a soft prompt to the banker when free-text capture (Customer response, Closing notes, Description, Suggested opening) contains terms tied to protected classes under federal ECOA, federal FHA, and the Minnesota Human Rights Act.
**Scope:** Demo phase. Pilot will calibrate this list based on real banker capture telemetry per the FFIEC CMS pattern.
**Behavior:** Soft advisory only — banker sees a friction prompt, can edit / continue / cancel. Not a save-blocker.

---

## Regulatory grounding

The list is built from the union of protected classes recognized under three statutory frames Blaze must satisfy in 2026:

- **ECOA / Regulation B**, 15 U.S.C. § 1691 et seq. — race, color, religion, national origin, sex, marital status, age, receipt of public assistance income, exercise of CCPA rights.
- **Fair Housing Act**, 42 U.S.C. §§ 3601–3619 — adds familial status, disability (residential real-estate-related transactions only).
- **Minnesota Human Rights Act §363A.16 (Credit Discrimination)**, Minn. Stat. ch. 363A — race, color, creed, religion, disability, national origin, sex, sexual orientation, marital status, public assistance receipt (including medical assistance and housing subsidy receipt). Broader definitions in §363A.03 add familial status and gender identity.

Authoritative sources: [Minn. Stat. §363A.16](https://www.revisor.mn.gov/statutes/cite/363A.16); [Minn. Stat. §363A.03](https://www.revisor.mn.gov/statutes/cite/363A.03/pdf); [12 CFR Part 1002 (Reg B)](https://www.ecfr.gov/current/title-12/chapter-X/part-1002).

---

## Editorial principles for this list

Three principles shaped the list. Worth understanding before reviewing terms.

**P1 — Surface mention, not analytical signal.** The scan is a *fair-warning prompt*: "this term tends to be sensitive; double-check the framing." It is not an automated discrimination detector. False positives are acceptable; false negatives — terms that should have flashed but didn't — are the real risk.

**P2 — Member-owned identity, not Member self-description.** A banker writing "Member is a Black-owned business" is what the scan catches — that's an identity assertion about the Member by the banker. A banker writing "Member's customer is a Black-owned business" or "Member's NAICS code includes black-pepper processing" is a false positive that the soft-advisory framing tolerates. The banker reads the prompt, confirms the framing is benign, and continues.

**P3 — Conservative on contested terminology.** Where 2026 has political and social contestation around terms (gender identity vocabulary, public assistance terminology, race/ethnicity self-identification), the list defaults to inclusion. A banker can dismiss the prompt; they can't undo a stigmatizing capture they didn't realize was sensitive at the time.

---

## Term groups

Terms are grouped by protected-class category. Match should be **case-insensitive**, **whole-word** (so "Asian" matches but "Caucasian" does not match the substring "asian", and "asia" does not match), and apply to all four free-text fields.

Implementation note: the actual scan should normalize punctuation (apostrophes, hyphens) and strip diacritics before matching, so "Black-owned," "Black‑owned," and "Black owned" all match the term `Black-owned`.

### Group 1 — Race / color / national origin / ethnicity

Includes racial categories, color descriptions, national-origin terms, and ethnicity descriptors. Most likely to fire on real captures and most consequential when surfaced.

**Racial categories:**
- Black
- African American
- African-American
- Caucasian
- White
- Asian
- Asian American
- Asian-American
- Pacific Islander
- Native American
- American Indian
- Indigenous
- Indian (note: ambiguous — flags both Native American and South Asian usage; counsel review may want a more specific phrasing)
- Hispanic
- Latino
- Latina
- Latinx
- Latine
- Mixed race
- Multiracial
- Biracial
- Person of color
- POC
- BIPOC
- Minority-owned
- Minority owned
- Woman-owned (note: also fires under sex; see Group 5)
- Minority
- Minorities

**National-origin / ethnicity descriptors:**
- Foreign-born
- Foreign born
- Immigrant
- Migrant
- Refugee
- Naturalized
- Visa
- Green card
- Citizenship
- Non-citizen
- Undocumented
- Country of origin
- Heritage
- Mexican
- Chinese
- Korean
- Vietnamese
- Filipino
- Japanese
- Indian (South Asian)
- Pakistani
- Somali
- Hmong
- Ethiopian
- Eritrean
- Cuban
- Puerto Rican
- Dominican
- Salvadoran
- Guatemalan
- Honduran

*Editorial note for Francisco: the national-origin list above is shaped by Minnesota's actual demographic communities (Hmong, Somali, etc. are significant Minnesota populations). It's not exhaustive — every nationality is a protected class under "national origin." The list catches the common cases; the soft-advisory framing handles the rest.*

### Group 2 — Religion / creed

MHRA §363A.16 protects "creed" in addition to "religion," giving Minnesota broader scope than ECOA.

- Christian
- Catholic
- Protestant
- Jewish
- Muslim
- Islamic
- Hindu
- Buddhist
- Sikh
- Mormon
- LDS
- Evangelical
- Born-again
- Born again
- Atheist
- Agnostic
- Secular
- Religious
- Faith-based
- Faith based
- Church
- Mosque
- Synagogue
- Temple
- Pastor
- Priest
- Imam
- Rabbi
- Minister (note: fires for religious context AND business "minister" — accept false positive)
- Devout
- Observant
- Practicing (when paired with religious context — partial-match risk; flag and let banker dismiss)
- Halal
- Kosher

### Group 3 — Disability / health condition

MHRA §363A.16 protects "disability." Federal ADA + FHA also relevant. Health-condition mentions are the most likely accidental-capture vector — bankers writing "Member's wife is dealing with a health issue, deal is on hold" is a real pattern that creates exposure.

- Disabled
- Disability
- Handicap
- Handicapped
- Wheelchair
- Blind
- Deaf
- Hearing impaired
- Hearing-impaired
- Visually impaired
- Visually-impaired
- Mobility
- Service animal
- Service dog
- ADA
- Accommodation
- Mental health
- Mental illness
- Depression
- Anxiety
- Bipolar
- Schizophrenia
- PTSD
- Autism
- ADHD
- Cancer
- Diabetes
- Heart attack
- Stroke
- Surgery
- Hospital
- Hospitalized
- Treatment
- Diagnosis
- Diagnosed
- Therapy
- Medication
- Prescription
- Recovery
- Rehab
- Rehabilitation
- Sober
- Sobriety
- Addiction
- Alcoholic
- Alcoholism
- Substance
- Chronic condition
- Chronic illness
- Terminal
- Hospice
- Palliative
- Pregnant (note: pregnancy is sex-discrimination protected; cross-references Group 5)
- Pregnancy
- Maternity
- Paternity

### Group 4 — Age

ECOA protects age (provided applicant has capacity to contract). MHRA §363A.16 does not list age explicitly but §363A.03 protects age in employment and other contexts; Pilot should treat age captures cautiously regardless.

- Elderly
- Senior
- Young
- Old
- Aging
- Aged
- Retiring
- Retired
- Retirement (note: catches business-financial planning context; banker dismisses if it's about the business's planning, not the Member's age)
- Generational (note: captures "generational wealth," "generational business" — accept false positive)
- Boomer
- Gen X
- Millennial
- Gen Z
- Younger generation
- Older generation
- Pre-retirement
- Post-retirement

### Group 5 — Sex / gender identity / sexual orientation

MHRA §363A.16 explicitly includes sex and sexual orientation; §363A.03 Subd. 50 defines gender identity (added 2013, consolidated 2024).

**Sex / pregnancy:**
- Female
- Male
- Woman
- Women
- Man (note: extreme false-positive rate; consider whether to include — see editorial note below)
- Men (same false-positive concern)
- Lady
- Gentleman
- Mother
- Father
- Mom
- Dad
- Sister
- Brother
- Daughter
- Son
- Wife
- Husband
- Spouse (note: marital status overlap; banker may legitimately reference spouse as decision-maker — handle via the renamed `co_decision_maker_household` field, not free text)
- Maternity (also Group 3)
- Paternity (also Group 3)
- Pregnant (also Group 3)

*Editorial decision needed for Francisco: "man" / "men" / "woman" / "women" have very high false-positive rates because they appear in benign business prose ("the team has 12 men and 8 women," "she's the woman running the business"). The soft-advisory framing tolerates this, but if it leads to fatigue, removing the unmodified pronouns is reasonable. My recommendation: keep them in for v1, remove in Pilot calibration if telemetry shows >50% dismiss rate.*

**Gender identity:**
- Transgender
- Trans
- Non-binary
- Nonbinary
- Genderqueer
- Cisgender
- Cis
- Gender identity
- Pronouns
- They/them
- He/him
- She/her
- Transitioning
- Transitioned

**Sexual orientation:**
- Gay
- Lesbian
- Bisexual
- Bi
- Queer
- LGBTQ
- LGBT
- LGBTQ+
- LGBTQIA
- LGBTQIA+
- Straight (note: included for symmetry; banker noting "Member is a straight white man" is exactly the capture pattern that should flash)
- Heterosexual
- Homosexual
- Same-sex
- Same sex

### Group 6 — Marital status / familial status

MHRA §363A.16 protects marital status. §363A.03 protects familial status. The 2024 amendments expanded familial-status protection to commercial credit, which is directly relevant to Blaze's commercial book.

- Married
- Unmarried
- Single
- Divorced
- Divorcing
- Separated
- Widowed
- Widow
- Widower
- Engaged
- Bachelor
- Bachelorette
- Common-law
- Common law
- Domestic partner
- Civil union
- Children
- Kids
- Childless
- No children
- Stepchild
- Stepchildren
- Adopted
- Adoption
- Custody
- Parent
- Parental
- Foster
- Pregnancy (also Groups 3, 5)

### Group 7 — Public assistance / economic status

MHRA §363A.16 protects "receipt of federal, state, or local public assistance including medical assistance," and Subd. 2 specifically protects tenants receiving housing subsidies. This is one of the broadest public-assistance protections in U.S. state law.

- Welfare
- Public assistance
- Government assistance
- Food stamps
- SNAP
- WIC
- Medicaid (note: medical assistance protected explicitly)
- Medical assistance
- Section 8
- Housing subsidy
- Rent subsidy
- Rental assistance
- HUD
- Subsidized housing
- TANF
- SSI
- SSDI
- Disability benefits
- Unemployment
- Unemployed
- Out of work
- Low-income
- Low income
- Poverty
- Poor
- Government check
- Government program

### Group 8 — Reprisal / exercise of legal rights

ECOA protects exercise of CCPA rights. MHRA §363A.15 protects against reprisal. Banker captures referencing the Member having complained, having sued, or having exercised legal rights are particularly sensitive.

- Lawsuit
- Sued
- Suing
- Complaint (note: "complaint" has business-context use too — accept false positive)
- Filed against
- Discrimination
- Civil rights
- Attorney involved
- Legal action
- Class action
- EEOC
- MDHR
- CFPB complaint

---

## What's deliberately NOT in this list

Worth being explicit about exclusions, because each represents an editorial judgment Francisco may want to revisit.

**Excluded — geographic terms** (zip codes, neighborhood names, county names). Geography correlates strongly with race in many U.S. metros and Minnesota is no exception (Twin Cities racial geography is well-documented). Including geography in a keyword scan would create overwhelming false-positive volume because bankers legitimately reference where Members are located. The redlining vector is better caught by the structural `[FL:PROXY-RISK]` tag on geographic fields plus periodic disparate-impact correlation testing, not by a real-time text scan.

**Excluded — language references** ("speaks Spanish," "translates," "ESL"). Language can be a national-origin proxy but the false-positive rate for legitimate business reference (Member's customer base, Member's marketing strategy) is too high. Pilot may revisit.

**Excluded — political affiliation, union membership, military veteran status**. These are not protected classes under MHRA §363A.16 or ECOA for credit purposes (military status protected under SCRA / MLA but those are different regulatory frames with their own capture and disclosure requirements outside this scan's scope). Pilot may layer these in if compliance counsel recommends.

**Excluded — explicitly profane or harassment terminology**. The scan is for fair-lending capture risk, not banker conduct discipline. Conduct issues are a separate HR/compliance vector with its own surfaces.

---

## Implementation guidance for CC

When CC implements the scan, three patterns matter:

**1. Match logic.** Case-insensitive, whole-word, after Unicode normalization (NFKC) and diacritic stripping. Multi-word terms ("African American," "Section 8") match contiguously. Hyphenated variants are separate entries.

**2. Prompt copy.** When scan fires, modal/inline-banner copy:

> *Compliance check: this note mentions [matched term(s)]. Lending decisions and capture should focus on observable business and cashflow factors. Personal characteristics, household circumstances, and social context tend not to belong in member files. Continue saving, edit the note, or cancel?*

Three actions: **Continue saving** (banker confirmed, captures their dismissal as part of the [FL:DECISION-TRACE] log), **Edit** (returns to field for revision), **Cancel** (discards capture).

**3. Telemetry hooks.** Capture which terms fire and which the banker dismisses vs. edits. Stored against the DecisionTraceEvent (Sprint 4.5) or a lightweight `ComplianceScanEvent` if trace log isn't yet in place. This telemetry feeds Pilot calibration of the keyword list.

**4. Storage.** The keyword list lives in a dedicated source file (`lib/compliance-keywords.ts` or similar), not embedded in the form component. Reason: the list is a content asset that Pilot will iterate on independently of the form code. Single source of truth, version-controlled, comment-documented per group.

---

## Editorial review prompts for Francisco

Before this list ships to CC, three judgment calls worth your explicit decision:

**E1.** Keep or remove unmodified `man` / `men` / `woman` / `women` from Group 5? Keep = symmetry and conservative posture; high false-positive rate. Remove = lower banker fatigue; potential gap when the Member's sex is referenced casually. *My recommendation: keep for v1, plan Pilot calibration based on telemetry.*

**E2.** Include or exclude common nationalities (Group 1)? Including makes the list longer; excluding leaves common-name protected references uncaught. *My recommendation: include the curated Minnesota-relevant list as drafted; expand in Pilot.*

**E3.** Include or exclude `Indian` given the dual usage (Native American / South Asian)? *My recommendation: include but flag in implementation that the soft-advisory copy should reference both protected-class meanings: "tribal/national origin or South Asian heritage."*

Three more potential edits I'd flag for your call:

**E4.** `Spouse` is in Group 6 but I'm recommending the banker capture spouse-as-decision-maker via the renamed `co_decision_maker_household` enum field rather than free text. Should `spouse` *fire* the scan in free text? *My recommendation: yes — it nudges the banker toward the structured field instead of free text, which is exactly the discipline we want.*

**E5.** `Discrimination` and related terms (Group 8) might fire when a banker is documenting a Member's complaint about another institution ("Member said they felt discriminated against by [bank X]"). Is that a desired capture for Blaze (relationship-building data) or a problematic one? *My recommendation: fire the scan — banker should consider whether the capture belongs in member file or compliance complaint channel; either way, the soft prompt protects the institution.*

**E6.** Names of specific religions, nationalities, etc. — should the list be exhaustive or representative? *My recommendation: representative for v1, with an explicit comment in the source file: "This list is illustrative, not exhaustive. The protected-class category is the rule; specific terms are surface-detection aids."*

---

## Total list size

v1 list contains approximately 240 distinct terms across eight groups. This is conservative for a credit-union compliance scan and well below the volume that would degrade banker UX (a properly-implemented scan parses 240 terms in <1ms on modern browsers). Larger production lists routinely run 500-1,000 terms; we're sizing for clarity and demo legibility, not coverage maximalism.

---

**End of v1 keyword list. Awaiting Francisco's editorial review before CC implementation.**
