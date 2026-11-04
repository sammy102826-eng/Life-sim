# Bug report — fixes and validation

## Fixed

**B1 — Fertility consultation double charge.** `src/relationships.js`, `fertilityTest`: removed the direct cash subtraction; the normal effect pipeline now charges once. Chromium tests cover both fertility outcomes, a balance exactly equal to the price (ends at zero), and insufficient funds (unchanged).

**B2 — Existing pregnancy overwritten by assisted reproduction.** `src/relationships.js`: IVF, donor conception and surrogacy are disabled while pregnant. The selection handler, treatment handler and pre-payment effect guard also reject concurrent pregnancy-producing treatments. Tests confirm the pregnancy and prenatal/preparation flags remain intact, with no charge, even for stale effect commands. Adoption stays available.

**Light-theme contrast.** Browser accessibility checks exposed insufficient contrast in gold title text and muted slot descriptions. Updated those colors, modal descriptions and focus indicators.

## Added and checked

- Version 1 save records; legacy versionless-record migration; JSON slot export and import with overwrite confirmation. Validation rejects unsupported versions, invalid core state, unsafe object keys, unsupported markup and oversized files before replacing storage.
- Extracted state, content, rendering, utilities and major system files; preserved entry filename and game controls. `src/` is now required beside the HTML file.
- Explicit free test-unlock labeling in the shop.
- Accessible dialog naming, background isolation, keyboard trapping and focus restoration; keyboard card activation and improved labels/touch targets.

## Test results

Run `npm ci` then `npm test`. The original regression coverage remains in place:

1. Startup, title settings, labeled name entry, main navigation and test-shop labeling.
2. Consultation charges, both outcomes, exact-price and insufficient balances.
3. Concurrent pregnancy guards at UI, handler and effect layers; adoption availability.
4. Successful conception and birth, child creation and prevention of duplicate birth.
5. Versioned save/load, legacy migration and actual browser download/file-upload round-trip.
6. Malformed/future backup rejection, preservation of existing storage and overwrite cancellation.
7. Both historical scenarios and historical save/load.
8. Eighteen annual transitions, save at each age, middle-school reports and high-school graduation with passing schoolwork.
9. 320px mobile containment/scrolling, named modal keyboard trap and focus restoration.
10. Automated axe contrast, button-name, label and dialog-attribute checks on representative screens in light and dark themes.

The original report used DOM simulation because browser downloads were blocked. System Chromium is now available, so the updated suite runs in a real browser. Annual progression is controlled: popups are cleared and health restored between years; it is not a full player-driven playthrough. No complete branch coverage, manual screen-reader certification, physical-device validation, exhaustive economic balancing, or live billing test is claimed. The modularization deliberately retains existing gameplay wrappers to limit unrelated behavior changes.

## Education expansion validation

At the initial education-expansion stage, the Chromium suite contained 21 passing tests. Added checks cover stage-menu navigation from ages 3 to 18, preschool activity limits and kindergarten handoff, school decisions and age blocking, conventional GPA and persistent report cards, admission requirements and equivalency, scholarship caps, real college charges and loan principal, repeat-year guards, failed-course credits, four-year funded bachelor’s graduation with major/minor and archived transcript, campus friend schema, one-time internship payment/experience and scholarships, failed-diploma recovery, and mobile education dialogs/labels/contrast.

Also corrected education-system gaps: repeated manual college-year completion, display-only college bills, credit for failed courses, unweighted college GPA, automatic diploma despite failing core classes, and college friends missing the relationship schema. Previously recorded report cards remain unchanged. New high-school cohorts use a separate high-school GPA.

The four-year graduation test supplies strong study activity to isolate graduation requirements; it does not prove every major, funding combination, sports route or graduate program. The game deliberately shares one calendar across countries and uses simplified debt without student-loan interest. See EDUCATION.md for gameplay details and future work.

## Latest education-planning and cross-tab audit

The latest full Chromium run completed **41 tests: 41 passed, 0 failed, 0 skipped**. Semester planning, time/energy, transfers, renewable scholarships, student-loan interest/grace/repayment and extra payments are implemented. The cross-tab audit reproduced and fixed multi-loan insurance over-settlement, double conversion of percentage-based asset upkeep/repair costs, literal memorial pricing text, repeatable journal remembrance rewards, and mismatched license display/payment pricing.

Jobs hiring, requirement previews, career panels, coworker friendship, job-event availability, contributions and retirement passed the added cases; no confirmed Jobs defect remained in that coverage. See UPDATE_REPORT.md for the full coverage, limitations and suggested improvements by tab.

## Follow-up feature validation

The latest full browser run completed **54 tests: 54 passed, 0 failed, 0 skipped**. Added regressions cover promotion eligibility and attempt limits, persistent annual workplace limits, career-development history, estimates versus actual secured-loan service, insurance settlement summaries, two-way friendship bonds, same-name identity isolation, persistent memories and multi-year trust repair, safe search navigation, financial totals, local-currency labels and exactly-once annual student interest.

Fixed a legacy annual routine that still applied a second 5% student-interest charge after the centralized loan processor ran. Company retirement balances previously missing from net worth now count once. Coworker friendship checks use explicit contact IDs instead of merging unrelated people with the same name. Mobile contrast/name/label/dialog checks pass for the new screens in both themes. See FEATURE_GUIDE.md for scope and remaining test limits.

## Graphics validation

The final complete Chromium run now passes **59/59 tests, with zero failures or skips**. Graphics tests cover every car/home/collectible catalog item, stable procedural portraits without gameplay RNG, school/family/player coverage, save/load stability, valid standalone SVG exports and offline narrow-screen purchase/inventory/detail behavior. Visual inspection also caught and fixed price wrapping beside thumbnails. Existing 54 gameplay/accessibility regressions remain passing. See art/README.md for the 191-item illustration library and previews.

## Health expansion validation

The latest full Chromium suite completes **74 tests: 74 passed, 0 failed, 0 skipped**. The prior 59 regressions remain passing. Added tests cover body-profile selection, congenital/later-life conditions, specialist diagnosis and exactly-once costs, expired/cancelled appointments, insured/family care, chronic renewal, procedures and recovery, both puberty paths, periods and menopause, contraception eligibility/billing/expiry, pregnancy/postpartum, prenatal charges, prevention/therapy limits, event queue preservation, medical-save validation/migration, hidden-diagnosis privacy, age-appropriate growth display and mobile accessibility in both themes.

Replaced overlapping disease progression with a guarded annual medical processor; unified recurring contraception billing; integrated prenatal and fertility charges with coverage. Fixed the accessibility helper overriding explicitly associated select labels. Childhood growth pages no longer apply adult BMI labels. The annual contraception integration test compares the budget entry with the recorded billing-time quote, since economic updates may change the next displayed price during Age Up. See HEALTH_GUIDE.md for behavior and test limits.
