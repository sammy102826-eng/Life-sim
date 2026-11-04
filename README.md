# Life-sim — Born to Run

**Life sim relationships .html** is the game's entry point. The original uploaded game has been updated and split into JavaScript and CSS files in `src/`. Keep that directory beside the HTML file when copying the game.

## Run

No application build or runtime package installation is required. From `/workspace/Life-sim`:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open the HTML through the server in a browser. Five browser-storage save slots, settings, and simulated shop unlocks remain local to the browser and origin.

## Education progression

Open **Work → Education journey** for the connected preschool-to-college path. Added playable preschool; age-appropriate report cards and a unified transcript; school-year decisions; individual college coursework; actual annual bills and student debt; internships, extra scholarships and support services; earned diploma requirements and adult equivalency. Existing teacher/classmate, club/sports, admissions, major/minor, party and Greek-life systems remain available through the connected classrooms.

College now includes two semesters, a time/energy budget, transfer-credit evaluations, renewable scholarship rules, 5% student-loan interest, a repayment grace period, and repayment-plan choices. Read [EDUCATION.md](EDUCATION.md) for the calendar, requirements and funding policy. College costs are billed once per completed year; shortfalls become student loans by default, with a cash-only option in College Finances.

## Jobs, assets, relationships and Other

The next suggested improvements are implemented: promotion checklists and annual workplace limits, career-development choices, ownership/equity estimates, insurance settlement summaries, shared friendship bonds and memories, multi-year reconciliation, Other action search and a unified financial dashboard. Company retirement now counts toward net worth; student interest is applied once per year.

See [FEATURE_GUIDE.md](FEATURE_GUIDE.md) for controls, rules and the **74-test** validation summary.

## Graphics

The game now includes illustrated cars, houses, collectibles, boats, aircraft, pets, people and navigation categories. Character portraits remain stable across saves and update by age category. All graphics work offline and use no gameplay randomness.

See [art/gallery.html](art/gallery.html) for **191 exported SVG illustrations**, [art/mobile-preview.png](art/mobile-preview.png) for a phone screenshot, and [art/README.md](art/README.md) for source and regeneration instructions. Run `npm run art:build` to refresh the gallery.

## Health

An in-depth health system is available in **Other → Health**: 39 conditions/support needs, 20 care specialties, appointments and records, selectable physiology, puberty, periods, perimenopause/menopause, expanded contraception, pregnancy/postpartum support, chronic care, prevention and wellbeing decisions.

Read [HEALTH_GUIDE.md](HEALTH_GUIDE.md) for the care flow, costs, life-stage rules and the **74-test** result. Health progress is included in saves and backups.

## Save backups

Open **Settings → Save and load games** (or **Load game** from the title).

- **Export slot** downloads that slot as a JSON backup.
- **Import JSON into slot** validates a backup before writing it. Replacing an occupied slot requires confirmation. Import does not immediately change the active life; choose Load afterward.
- Versionless saves from the original game migrate to schema version 1 when read. Current writes include `version: 1`; unsupported future versions, malformed core data, unsafe keys, and oversized files are rejected.
- Export unreadable slots before deleting them if recovery is needed. Keep your backups private: they include your game state and life history. Shop unlocks and settings are separate from slot backups.

## Included

Custom life creation, aging, choices, stats, death, revival and heirs; countries, currencies, relocation, elections and political office; FDR/JFK history scenarios; elementary through graduate education; careers, coworkers, promotions, retirement and 401(k); property, vehicles, luxury goods, loans and assets; health, illness, fitness, crime, prison, sports, fame and social media; family, friendships, marriage, pets, grief, contraception, fertility, pregnancy, prenatal care and alternative family-building routes; light/dark themes and a test shop.

## Implemented improvements

- Fertility consultations now deduct exactly one displayed fee. Existing pregnancies block IVF, donor conception and surrogacy at the UI, entry-handler and effect layers, without charging. Adoption remains available.
- Versioned, validated saves and JSON export/import retain original slot keys and support legacy saves.
- Source files separate shared state, content, rendering, utilities, education, the connected education journey, careers, assets, relationships, persistence and accessibility. Ordered classic scripts preserve legacy inline controls. Existing system wrappers remain; this is an incremental separation, not a complete rewrite into ES modules.
- Dialogs have accessible names, keyboard focus containment, background inertness and focus restoration. Clickable cards support keyboard activation; controls have improved labels, focus indicators and touch sizes. Narrow layouts contain and scroll content. Light-theme text contrast is improved.
- Shop purchases are explicitly labeled as free test unlocks. No payment, purchase restoration, or real billing integration is enabled.

## Tests

Node.js 24 was used for validation. Install the pinned test dependencies:

```sh
npm ci
npm test
```

Tests use `/usr/bin/chromium` when available, otherwise Playwright's installed Chromium. Set `CHROMIUM_PATH` for another executable, or run `npx playwright install chromium` if permitted. No browser download is needed in this prepared environment.

The suite starts an ephemeral local server and isolated browser contexts, seeds randomness, and checks charges, pregnancy guards and birth, save migration and backup round-trips, invalid backups, historical saves, annual school progression, mobile scrolling, modal keyboard behavior, and automated contrast/labels/dialog checks in both themes. It does not touch normal user saves. Progression checks deliberately clear event popups and restore health to isolate annual transitions; the diploma check supplies passing final-year marks. Education tests also cover preschool reports, learning decisions, earned diploma and equivalency paths, admissions, actual college bills, failed credits, four-year graduation, internship rewards and mobile education menus.

See [UPDATE_REPORT.md](UPDATE_REPORT.md) for the education additions, cross-tab fixes, test coverage and further recommendations. See BUG_REPORT.md for the bug history and remaining limits. Full manual screen-reader testing, physical-device testing, all game branches, and real billing are outside the completed validation.
