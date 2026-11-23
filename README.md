# Life-sim — Born to Run

**Life sim relationships .html** is the game's entry point. The original uploaded game has been updated and split into JavaScript and CSS files in `src/`. Keep that directory beside the HTML file when copying the game.


## Play offline on your phone

Open [Born to Run](https://sammy102826-eng.github.io/Life-sim/) while connected to the internet.

- **iPhone** — In Safari, tap **Share → Add to Home Screen**. Turn on **Open as Web App** if you see it, then tap **Add**.
- **Android** — In Chrome, tap **Install Born to Run**, or open the menu and choose **Install app** or **Add to Home screen**.

Open the new Home Screen icon while you’re still online. Once the title screen says **Ready to play offline**, you can launch and play in airplane mode. On iPhone, the Home Screen app may have its own save storage. If a Safari save is missing, export its JSON from **Load game** in Safari and import it through **Load game** in the installed app.

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

## Housing, rentals and real estate

Open **Stuff → Residence, landlord & homes to rent** for the new housing system. Extra properties support scheduled listings, applicant screening, tenant relationships, annual rent, repairs, arrears and lease renewals. Work → **Special career → Real estate** adds licensing, clients, viewings, offers, commissions and firm growth. Catalogs are categorized and paginated; the five main tabs have equal widths; Education journey is the single school entry on the Work overview.

See [REAL_ESTATE_GUIDE.md](REAL_ESTATE_GUIDE.md) for the rules, save compatibility, validation and next recommendations.

## Property enterprise and unified college flow

Regional markets, adjustable asking rents, independent building units, contractors, managers, business statements/taxes/forecasts, household costs and roommates, and real estate office teams are implemented. College scheduling now uses a real draft/confirmation process and one current-semester coursework page. See [PROPERTY_AND_COLLEGE_UPDATE.md](PROPERTY_AND_COLLEGE_UPDATE.md) for controls and accounting rules.

## Royalty

New lives can be born royal in monarchy countries, and adult dating can lead to royal marriage and relocation. Royal houses have crests, protected residences, family titles, succession, allowances, public opinion, duties, scandals, abdication/exile and an irreversible country-specific republican transition. See [ROYALTY_GUIDE.md](ROYALTY_GUIDE.md) for the rules and the 504-scenario event catalog.

## Royal courts and constitutional systems

Royal institutions now include regional courts and territorial charters, country-specific powers and succession rules, diplomatic tours, staff/protection budgets, regents and negotiated family-council decisions. Open **Work → Royal role → Royal institutions**. See [ROYAL_COURTS_GUIDE.md](ROYAL_COURTS_GUIDE.md).

## Fame, newspaper and interactive activities

The bottom fame bar opens a full profile with paid offers, media choices, fans, reception reports and agent representation. The header newspaper opens archived yearly editions with community/player stories and interactive responses. Previously instant activities across major life systems now offer meaningful approaches while preserving their existing rules and detailed decision flows. See [FAME_AND_NEWS_GUIDE.md](FAME_AND_NEWS_GUIDE.md).

## Long-term fame commitments

The Fame profile now includes sponsorship contracts with annual deliverables, renewal and reputation clauses; distinct fan clubs with recurring organizers and persistent friendships; and funded PR staff, targeted campaigns and crisis responses. Open **Fame → Long-term fame**. See [FAME_COMMITMENTS_GUIDE.md](FAME_COMMITMENTS_GUIDE.md) for the rules and costs.

## Actor career

Work → Special careers → Actor now includes performance-led role progression, agents, auditions, salary/backend negotiation, production decisions, releases, awards and franchise commitments. Other → Learning → Lessons provides the single acting-training system from age eight. See [ACTOR_GUIDE.md](ACTOR_GUIDE.md).

## Lawyer career and law firm

Choose a practice concentration while enrolled in law school, graduate, pass the bar exam, and apply for the Attorney job in Work. The promotion path runs through Senior Associate, Senior Partner, and Managing Partner. **Start a law firm** appears inside the attorney’s job menu after at least 10 years with the same employer, promotion to partner, performance of 75, career harmony of 60, supervisor relationship of 55, and a clean record. Graduates who already have a saved JD can select their concentration during founding if their transcript has none.

The firm replaces your full-time job. Open it from **Work** to accept matters, manage staff and offices, handle hearings, or review finances and firm news. Case work spends hours and firm cash. Advance months in **Calendar** to renew working hours and post payroll, rent, and billing. **Age Up** closes any remaining months and opens a new firm year. Cases ready for trial are scheduled the following year. The procedures and public appointments are simplified for the fictional setting.

Firm cash, client trust deposits, and personal cash have separate balances. Use **Finances** to contribute capital, borrow, and distribute available funds. The same life save preserves open matters, financial reports, pending decisions, staff, and the random seed. To run the focused browser tests after the test dependencies are installed, use `node --test tests/law-firm.test.cjs`.

## Doctor career and medical practices

Complete medical school, pass the medical licensing exam and apply for **Medical resident**. Choose a specialty in your job menu, work eight licensed years as a physician in that specialty and reach Senior Physician or above. **Start a practice** appears in the physician job menu when your performance, career harmony, supervisor relationship and clean record also qualify.

The first practice purchases a solo office with personal capital. In **Work → Manage medical practice**, enroll patients, set fees, complete or refer appointments, handle uninsured balances and choose insurance networks. Larger facilities allow more permanent patients, staff and procedures. Secondary sites need a manager and physician to see patients. Each location tracks its own volume, costs, popularity and property value. **Age Up** posts routine visits, payroll, property upkeep and eligible insurer reimbursements. An established practice can fund an in-house insurance reserve, configure up to three tiers and offer coverage to individual patients.

The **newspaper button** carries public clinic incidents and other major developments across law, government, royalty, entertainment, business and property. Use **Read & respond** for decisions. Unresolved public clinic and legal incidents remain actionable in past editions. Individual patient matters stay in the practice inbox. The focused browser checks run with `node --test tests/practice.test.cjs`.

## Movie Director and studio ownership

Open **Work → Special careers → Movie Director**, then name the studio and contribute startup capital. The studio occupies the current Work slot and gets a starting reputation boost from fame, acting credits and published writing credits. The writing portfolio is available in **Other → Learning → Lessons**.

**Create Script** sets a title, genre, rating, release type, production format and casting plan. Work through writing, casting, filming and post-production. **Age Up** advances completed stages. Sign a theatrical, cable or streaming agreement in Marketing or Industry, then reserve a release date. Release reports include the cast, expenses, receipts, performance and award nominations. Eligible productions can attend the Screen Guild Awards and any studio-owned release can be the basis of a sequel or spin-off.

**Financials** separates operating income, annual expenses and capital movements. Use the slider or text field to transfer funds. Withdrawals are taxed. The studio can seek outside investors, license its back catalog, or sell project rights and facilities if cash runs short. Major releases, awards, and public production incidents use the shared newspaper. Private production decisions stay in the studio inbox.

Run the focused studio checks with `node --test tests/studio.test.cjs` after installing the test dependencies.

## Crime, criminal court, prison and lawsuits

**Other → Crime** groups offenses into collapsible categories. Scene props, costumes, vehicles and time choices are cosmetic. The game can record an incident, start a police encounter, or revisit a past incident after later evidence. Arrests open charges and counsel options. Judge hearings generally occur sooner than jury trials. Work and school continue until a guilty verdict.

A prison sentence appears in the current **Work** slot. Other activity menus are disabled during custody. Prison jobs pay into a commissary-only balance. Each **Age Up** counts custody time, processes passive household finances and asset wear, and brings prison decisions or family news. Minor sentences are shown in months and resolve on the next annual tick. Appeals, parole eligibility, recapture and active convictions are recorded under **Other → Prison record**. Moving away can make existing relationships long-distance.

**Other → Lawsuits** lists potential civil claims from life events. File within three years, then gather evidence, go through discovery and negotiation, and attend trial or pursue an appeal when eligible. Each stage has its own date and expenses. Opening the Crime or Lawsuits menu enables immediate popups for future standalone civil incidents. Background incidents are also listed in Lawsuits.

The court and prison systems use fictional sentencing bands. Run the focused checks with `node --test tests/justice.test.cjs`.

## Financial center, markets and tax filing

Select your cash balance in the upper-right corner to open the **Financial center**. Investments includes public stocks, bonds, mutual funds, crypto and penny stocks. The company directory uses the same listings as business ownership. An IPO opens the company to trading, research changes its outlook and quote, and a split preserves the value of existing positions. The newspaper’s **Nunya Beeswax** section covers financial developments and supports company watchlists and related decisions.

Youth savings earns a higher rate before rolling into adult savings at 18. Adult banking supports checking, savings, high-yield accounts at participating banks, and traditional and Roth retirement accounts. Credit cards can cover a cash shortfall up to their available limit. Choose full-balance or minimum autopay and review annual interest, overdue amounts and cashback. **Loans** shows scheduled and extra repayments, including linked asset loans, student debt and practice or firm debt. Collection options include surrendering assets or restructuring while protecting the primary home and car.

**Age Up** resolves three lottery draws, investment income, estates and the yearly tax return. Use **Review income tax return** in the year summary or open **Financial center → Taxes** to choose recorded deductions. Bank balances pay additional tax, refunds are deposited, and unpaid tax is withheld from later wages. Earlier unfiled returns use the available deductions at the next annual settlement. Asset checkout includes sales or transfer tax. Tax rates, exemptions and financial products are simplified game rules.

Run the focused tests with `node --test tests/finance.test.cjs`.

## Testing tools

Settings → Debug character editor provides validated stat, age, money, skill, relationship and mechanic-testing controls with one-step undo. The main menu also includes Born into royalty · Testing, with a choice of monarchy and guaranteed royal birth. See [DEBUG_GUIDE.md](DEBUG_GUIDE.md).

### Run a business

Open **Work → Special careers → Business** to found a company or buy control of an existing one. An owner needs a free work and school schedule. Conventional business careers can lead to a board-appointed CEO role with a salary and no ownership stake.

Use **Financial outlook** to compare your last report with a forecast based on current prices, staffing, facilities, and corporate tax. Company funds pay operating costs, research and company debt. Add personal capital or withdraw a taxed distribution from **Financials**. Company loans also appear in the Financial Center.

Research can unlock patent filings, licenses and product improvements. Pending offers, competition reviews and acquired companies appear in **Manage business empire**. A public listing uses the same company registration as Investments.

The Newspaper has **Personal & home country**, **International**, and **Business** sections. Public decisions can be answered from their articles. Rumors are labeled, and economic developments can affect home listings, taxes and investment prices.

### Run for office

Open **Work → Special careers → Run for Office** to choose an office and party in your country. Build a campaign through fundraising, public appearances, debates and turnout. Results use vote totals, and completed terms improve future campaign support.

The current Work slot opens your government. Local offices focus on their own jurisdiction. Executives can negotiate bills, issue orders subject to court review, and handle budgets. National leaders also manage appointments, trade, resources, diplomacy and defense policy. Legislatures and courts can make decisions during **Age Up**. Country profiles use simplified electoral and constitutional rules.

Domestic political stories appear in **Personal & home country** and foreign developments appear in **International**. Eligible articles let you respond, including voting on measures, taking executive action and answering public inquiries.


### Generations, vacations and development

Use **Other → Will** to divide cash after debts, taxes and funeral costs, assign property groups, and choose a preferred child successor. At death the settlement lists beneficiaries and any assets sold to pay obligations. Continuing as a child keeps their own savings, job, household and assets alongside their share of the estate.

**Other → Family life** lists pending decisions and earlier generations. Relationships can grow distant after years without contact. Reconnecting with an estranged relative or former friend takes more than one year.

Book a destination and invite companions in **Other → Vacation**. Choose outings, respond to travel events, and bring home souvenirs in your inventory. The Newspaper’s **Just for Fun** section contains fictional stories with no game effects.

Open **Stuff → Property → Land and islands** to buy a building lot, start a preset or custom home, or manage island developments. At the highest wealth levels, fictional island nations offer development and resource mandates. Residents retain their civil government, public project funds stay separate, and resource trades can pay personal royalties.


### Teaching and university leadership

Open **Work → Special careers → Teacher** to review qualifications. A 2.5 high-school GPA, a bachelor’s degree, the existing Teaching certification exam, and a local teaching license unlock school appointments. Choose a subject supported by your college major or minor, or choose Broad education. University appointments require a Master of Education and three completed school-teaching years.

Open the current Work slot to plan lessons, hold office hours, guide students, work with colleagues, and grade a class. Age Up generates an annual report. University faculty can publish academic projects and apply to more selective institutions.

After building a university track record, you can lead an existing campus or establish your own. Enrollment, courses, staffing, tuition, and facilities feed into the same annual university budget. The Newspaper carries both read-only education stories and public decisions that can be answered directly.


### Singer and bands

Open **Work → Special careers → Singer and bands** to start solo or audition for vocals or an instrument. Practice in the career menu or under **Other → Learning → Lessons → Voice and instruments**. Switch between solo and band careers once the current band and label deals expire.

Bands vote on recording, release, tours, label deals, and lineup changes. A signed label also reviews recording and release proposals. Earnings are split after the label’s cut and any advance repayment. Released recordings keep generating royalties for their original lineup after a member leaves. Look in the Newspaper for releases, lineup changes, breakups, and reunions.

The game and its menus use the same 390 × 844 px mobile frame on computers and adapt to smaller phone screens.


### Archaeology, museums, and eras

Choose a birth year when starting a life. The calendar appears next to your age and carries over to your children. The **Mall** in **Stuff** has used, new, and luxury dealerships, a technology store, and departments for existing goods and services. Vehicles, technology, and online platforms unlock by year. Choose 1950 or 1960 to reach adulthood in an earlier era.

Open **Work → Special careers → Archaeologist** to see available field programs. Survey and excavate in layers, then record stratigraphy and run a suitable lab test. After three field years, a documented discovery, and reputation of 42, you can buy an independent excavation permit. Protected finds go to a public collection. Eligible finds can go into your inventory or museum, be donated, or be sold through a licensed dealer.

Open a museum from **Other → Museum**. Manage admissions, school visits, conservation, dealer transactions, gallery space, and staff against a separate budget. Find your owned pieces under **Stuff → My stuff → Personal artifacts**. Open a residence or owned property and choose **Customize home** to display objects, select an interior style, or add parking. Cars already owned stay in overflow when you lose parking capacity, and you need a free space for the next purchase. Displayed items may be stolen in a break-in.

The Newspaper carries discoveries, museum openings, public decisions, and technology launches. Decision buttons appear when you meet the relevant requirements.

### Casino and gambling

Choose **Other → Casino → Go to Casino**. Play blackjack, five-card draw poker, Texas Hold’em, roulette, slots, horse racing, sports betting, keno, or dice. Each table explains its payouts and odds. Poker estimates use only the visible cards and blackjack shows the chance of busting on a hit. An unfinished card hand survives a save and load. Finish it before aging up.

**Results and limits** shows seasonal net winnings, past games, and optional loss limits or a break until the next Age Up. Wagers use the character’s personal cash and net winnings appear in the tax report.

Choose **Open your own Casino** to start a house game and grow it into a lounge, licensed casino, or resort. Fund construction from the venue’s reserve, set limits and house rules, and open games, hospitality spaces, and entertainment bookings as the floor grows. You can play at your own venue using its posted rules. Personal cash and the venue’s reserve settle separately. The annual report covers operations and taxes, and the Newspaper carries public decisions on audits, payouts, and neighborhood complaints.

### Private investigations and military careers

Become a police officer, take two supervised casework courses, and complete three patrol years before applying for detective. Three years in the detective division unlock **Work → Special careers → Private Investigator**. An agency can accept referrals, build evidence across sources, issue documented reports, and hire staff. Reputation brings more complex assignments and direct client requests. Agency decisions and archived coverage live under **Work → Private Investigator**. The newspaper’s **Crime** section covers public investigations and simulated crime trends.

**Work → Join the military** offers enlistment and officer applications. Soldiers keep the four-year enlistment and earn the tuition benefit after the final year of service.

Personal distributions from businesses, studios, law firms, medical practices, museums, casinos, private universities, and investigation agencies use the character’s country income-tax rate as withholding. The annual tax return credits withheld amounts. The UAE starts with no personal income or payroll tax in the game. Business taxes and purchase taxes are separate.

### Life log, Journal, and shopping

The Life log shows the calendar year for each birthday. Open the **Journal** beside the newspaper to read personal news and review achievements. The newspaper includes the character’s country edition, **The Global Post**, **Nunya Beeswax**, **Crime**, and **The Silly Goose**.

In **Stuff**, start with Housing, shop by department at **The Mall**, or manage belongings under **My stuff**. The Mall opens new models as the calendar advances. Vehicle purchases require available parking. **Other → Appearance** lets you change hairstyles and hair color after birth. The character editor in Settings can adjust stats, birth year, sports skills, and natural aptitude for testing.
