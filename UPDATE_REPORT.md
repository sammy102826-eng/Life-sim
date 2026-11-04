# Education planning and cross-tab audit

## Education additions

- Two college semesters per year, term report cards, year-end credit/GPA finalization, and semester archives on completed degrees. Age Up can finish remaining terms with current preparation.
- A shared study-block and energy budget across coursework, studying, classmates/faculty, parties, sports, Greek activities and internships. Employment reserves time; limited breaks restore energy.
- Transfer applications with eligibility checks, chance-based acceptance, review before accepting, category-specific credit caps and target residency requirements. Transfer does not duplicate source GPA or erase debt.
- Renewable scholarships checked against latest term GPA and recruited-team performance; suspension and restoration are visible in Finances.
- Student-loan interest at 5% annually, enrollment/one-year grace deferral, standard/income-based/accelerated plans, annual payment history and extra payments. Standard repayment reaches zero over ten uncapped annual payments in the deterministic test.

These remain simplified game systems. See EDUCATION.md for exact rules and how to use them.

## Confirmed fixes

| Area | Problem | Result |
| --- | --- | --- |
| Stuff | A single insurance payout was subtracted in full from every linked loan | Settlement now allocates the payout sequentially, reducing total debt by exactly the amount paid |
| Stuff | Upkeep and repair formulas converted local asset values into local currency a second time | Only fixed base costs are converted; percentage costs use the existing local asset value; affordability controls match |
| Relationships | Memorial price displayed literal template text | Price now renders in the current currency |
| Relationships | Repeated remembrance journal entries could repeatedly award stats within the same year | Journal remembrance now observes the same annual limit as other remembrance actions |
| Other | License screens showed country-adjusted prices but charged the raw base amount | The purchase handler now charges the displayed country price |

No confirmed Jobs defect was found in the tested workflows. Catalog/requirement panels, actual hiring gates, raise limits, coworker friendship, applicable job events, contribution matching and retirement were checked.

## Validation

**At the cross-tab audit stage: 41 tests passed, 0 failed, 0 skipped. The follow-up feature stage passed 54 tests; the current graphics suite passes 59 tests. See FEATURE_GUIDE.md and art/README.md.** Run `npm ci` and `npm test`. The suite uses real system Chromium, seeded randomness, an ephemeral local server and isolated storage. It does not alter player saves.

Coverage includes:

- Original startup, navigation, saves/backups, health/fertility bugs, mobile focus and contrast regressions.
- Education from preschool to graduation, semester save/load, workload limits, transfer graduation, academic/athletic renewal, billing/debt invariants, grace, plan changes and ten-year standard repayment.
- Jobs: all catalog requirement panels, career subpanels, hiring eligibility and success, raise limits, coworker friendships, current-job event availability, 401(k) matching and retirement withdrawal.
- Stuff: every shopping/owned category; car/home/luxury/boat/plane details; cash/financed purchases; debt settlement; gifting restrictions and persistence; rental toggling; maintenance limits/pricing; multi-loan insurance losses.
- Relationships: all relationship-group details, parent interactions, adoption-created children, pregnancy-related regressions, grief, displayed memorial pricing and remembrance limits.
- Other: every declared top category/subpanel plus Licenses; functional banking transfers, personal-loan repayment, investment round-trip, giving, health affordability, license prices and student-loan controls.
- New education screens at 320px width and automated label/dialog/contrast checks in both themes.

These checks combine menu coverage with representative functional cases. They are not an exhaustive playthrough of every crime, business, medical, historical, relationship, career or random-event branch. Annual progression tests supply strong study activity/health and clear unrelated popups to isolate the transitions. No manual screen-reader, physical-device or live payment testing is claimed.

## Follow-up changes implemented

- **Jobs:** one promotion checklist shared with review validation; annual training/networking limits; persistent annual development choices and follow-up stories.
- **Stuff:** pre-purchase cash/financing ownership-cost comparisons, asset equity/debt cards and insurance settlement records.
- **Relationships:** explicit contact/friend identity links, bidirectional bond synchronization, persistent shared memories and multi-year trust repair.
- **Other:** safe action search, a financial dashboard and consistent local-currency labels on older banking/debt/tax controls.
- **Financial fixes:** company retirement is included in net worth once; the old second student-interest charge is disabled. New regression tests cover both.

See FEATURE_GUIDE.md for the user instructions and feature-stage 54-test result (59 tests now pass including graphics). Broader education ideas remain documented separately in EDUCATION.md.

## In-depth health update

Implemented 39 conditions/support needs, 20 specialties, clinical appointments/records, inherited and developed conditions, chronic care/remission, puberty, menstrual health, perimenopause/menopause, expanded contraception, prenatal/postpartum care and preventive/wellbeing decisions. The latest full suite passes **74/74 tests**. Read HEALTH_GUIDE.md for the complete player guide and validation boundaries.
