# Jobs, ownership, shared history and financial planning

## Jobs

Open a full-time job from **Work**, then view its home page, Boss / Supervisor or Performance review.

The **Next promotion** checklist names the next role and shows each requirement, the current value, and what is missing. Performance, time in role, education, field experience, minimum age, named degree and professional exams are checked by the same function used when requesting a promotion. Meeting them enables a chance-based selection review, not a guaranteed offer. Only one eligible promotion attempt is allowed each year; checking unmet requirements does not consume an attempt.

Repeatable workplace activities now have annual limits, saved with the job:

| Activity | Limit per year |
| --- | --- |
| Training | 2 |
| Schmoozing | 2 |
| Career-goal discussion | 1 |
| Time off | 1 |
| Workplace concern | 1 |
| Coworker activities | 3 shared between chat, lunch, collaboration, feedback and outings, per person |

Raises retain their once-yearly rule, and working harder retains its twice-yearly limit. Becoming friends does not consume a coworker activity. Paid activities show and charge the same local-currency amount.

Under **Performance review → Plan this year’s development**, choose skills, mentorship or sustainable workload. The choice and its company are recorded. The following year offers a follow-up branch; development history persists with the job in save files.

## Stuff

Before buying a car or home, the purchase screen compares cash and selected financing. Each comparison shows market value, debt, equity, estimated annual debt service, required insurance, routine upkeep and property tax. The down payment is separate from annual costs.

Owned asset details show the same **Ownership cost & equity** card. Negative equity remains visible rather than being hidden. Maintenance that is already scheduled is reflected in the next routine car-upkeep estimate.

Estimates are informational and do not charge money. They exclude market movements, fuel, accidents, exceptional repairs, vacancy and taxes on income. Optional preventative maintenance is described separately; debt-service estimates include principal and interest. Actual annual property taxes can change with valuation.

After an insured vehicle loss, Stuff shows the latest settlement: paid to lenders, cash received and remaining loan balance. Up to 20 settlement records persist in the save.

## Relationships

Classroom/campus contacts and coworkers are linked to long-term friends by explicit IDs. Bond changes flow in either direction between their contact card and Relationships. Existing legacy coworker links are migrated only when unambiguous. Two people with the same name are not merged. Ending contact clears its active friend link.

Relationship details now include **Shared history**. School, campus and coworker interactions, direct relationship actions and relationship milestones add persistent memories. Memories are limited to the most recent 30 per person, with duplicate text at the same age suppressed.

The trust path spans multiple years:

1. Talk through an unresolved disagreement to acknowledge a strained relationship.
2. In a later year, begin repairing trust.
3. In another later year, follow through on the agreement to rebuild trust.

Only one trust-path step is available per person per age. These are optional decisions; they do not introduce automatic conflicts into every friendship. Memories remain when a relationship changes or ends.

## Other

At the top of **Other**, use **Search actions** to find declared categories and pages such as family planning, doctor, loans, banking, licenses, education and jobs. Search updates without moving input focus. Choosing a result navigates to the relevant page. Typed text is never executed as code.

**Other → Financial dashboard** brings together cash/deposits, company retirement assets, net worth, total debt, asset equity, estimated ownership costs, last recorded payroll, current college funding and individual debt accounts. It links to Banking and Loans.

Company 401(k) balances now count toward net worth exactly once; they remain separate from spendable cash. Dashboard estimates are not a new bill or a complete cash forecast. Opening the dashboard does not apply interest, make repayments or deduct costs.

Older banking/debt/tax controls now label their existing local-currency amounts consistently. The annual student-loan processor is the sole source of student interest; a legacy second annual 5% charge has been disabled.

## Validation

Run `npm ci` and `npm test`. **74 Chromium tests pass, with no failures or skips, including the health update.** These include the original 41 regressions and new checks for promotion gating, annual activity limits/save persistence, career-story follow-through, asset estimates/actual debt service, settlements, two-way bond updates, same-name identity separation, memories and reconciliation, search and safe input, retirement/net-worth totals, currency labels and exactly-once annual student interest.

The new job, asset, relationship, search and dashboard screens were checked at 320px width in dark/light themes with automated accessibility rules for names, labels, contrast and dialogs. This is representative browser coverage, not exhaustive random-event, manual screen-reader or physical-device certification.

## Graphics

The game now decorates catalogs, purchases, owned assets, relationship details, school/work contacts, the player header and major categories with local vector illustrations. See art/README.md and art/gallery.html. These images preserve existing button labels and do not change saved state or consume gameplay randomness.

## Health expansion

Other → Health now contains a connected medical and life-stage system. See HEALTH_GUIDE.md for the 39-condition/20-specialty directory, appointment and care rules, puberty/cycle/menopause paths, contraception, prevention, records and validation.
