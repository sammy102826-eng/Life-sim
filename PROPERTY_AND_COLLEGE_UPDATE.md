# Property enterprise and college flow update

## Property and household controls

Open **Stuff → Your residence** for household controls, roommates and operating statements, or manage any owned property for market and building controls.

- Four regional markets: Metro, Suburban, Rural and Coastal. Demand changes annually and affects market rent, vacancies, forecasts and property growth. Legacy properties default to Suburban; a vacant property may be classified into a region once. Neighborhood improvements increase its rent potential.
- Asking rents range from 80% to 140% of market rent. Changing a live listing withdraws its applicants and schedules the revised listing for the next Age Up. Above-market listings can attract no applicants and remain vacant until a subsequent year. Signed leases retain their agreed rent.
- Convert a vacant investment property into two or four independent units. Each unit has a separate listing, tenant, arrears and lease. Conversion costs money but preserves total asset value; existing mortgage debt remains on Unit 1. Units can subsequently be managed or sold separately once vacant. Insurance is charged per unit.
- Budget and specialist contractors restore different amounts of condition; annual limits prevent repeated improvements. Quotes appear on the buttons. Managers charge 8% of collected rent, arrange paid repairs and improve tenant relations. They do not override player notice or automatically select tenants.
- Moving costs are charged separately from the refundable rental deposit and shown before signing. Roommates contribute 35% toward rental housing costs, or a fixed contribution in owned housing. They have persistent identities, bonds and shared-chores interactions. Household supplies scale with dependent children; comfort declines annually and affects wellbeing and roommate relations.

## Accounting

Statements appear after Age Up and remain in saves. They show rent, commissions, operating expenses, capital costs, mortgage interest, debt service, taxable profit, income tax, carried losses and cash flow.

- Commissions and discretionary business spending are recorded during play and included in the following Age Up statement. Annual rent, management, repairs and office overhead use that year's actual collection and charges.
- Investment mortgage interest is captured before annual amortization. Principal affects cash flow but is not a tax deduction. Investment property tax and insurance are deductible; primary-home costs and personal moving/household expenses are excluded from business deductions.
- Building conversion and neighborhood investment are capital costs: they reduce cash flow without reducing taxable profit. Depreciation of capital improvements is not modeled.
- Positive business profit after carried losses is taxed at a simulated 15% on the first 50,000 country-adjusted units and 25% above that. Losses carry forward. Assessment runs once per age. This game model is separate from employment payroll taxes and does not implement jurisdiction-specific tax law.
- Forecasts estimate signed-lease collection losses and regional vacancy demand, operating expenses and debt service. They exclude new commissions, unexpected repairs, capital projects, taxes on income and personal household spending; estimated vacant-unit income is not guaranteed.

## Office staff and referrals

**Work → Special career → Real estate** now includes recruitment and annual salaries:

- Office assistant: two extra annual work blocks, with a matching ten-block limit in the interface and handlers.
- Inspection specialist: documents and resolves client due-diligence issues at Age Up.
- Referral broker: sources a lead each year if capacity and prospecting funds allow.
- Referral networking: one paid campaign per year improves reputation and helps find a client.

Staff identities, client pipeline, salary commitments, business records and regional markets persist in saves. Leaving the career blocks stale client actions even when an assistant remains on the saved roster.

## One college workflow

Open **Work → Education journey → College & current program**. Enrolled students go directly to their current semester.

1. A recommended annual schedule is available immediately. **Adjust annual schedule** lets you choose course load and course mix.
2. **Preview schedule** creates a draft without changing active classes. **Confirm schedule** commits it; cancel preserves the previous schedule. Age Up waits for a pending draft to be confirmed or cancelled.
3. The semester page shows only the current term's classes. Attendance, study, projects and exams use the same block and energy budget shown above them. Campus activities, sports and internships also use that budget.
4. Starting academic activities locks this year's schedule. A preview cannot erase completed work or swap out graded courses.
5. One **Finish semester & receive report** button grades the current semester. Semester 1 leads to Semester 2; Semester 2 finalizes annual credits/GPA and shows the annual report. Annual tuition is charged once. After completing the year, Age Up unlocks the next year.
6. Finances, report history, degree requirements, classmates, professors, clubs, campus life and transfers remain available from the same page.

The previous parallel Study and Coursework menus, general study-action buttons and duplicate semester completion controls are replaced in the active interface. Old routes delegate to the same page for compatibility. Existing enrollment, schedules, grades, scholarships, transfer credit and student debt are retained.

## Verification and future work

The complete browser suite covers existing jobs, assets, relationships, Other, education, health, saves, artwork and the GitHub Pages project prefix, alongside new end-to-end property and college tests. Run `npm test`.

Possible later additions: regional maps and purchase-time region selection, configurable manager policies, depreciation and jurisdiction-specific taxes, commercial leases, and household space/capacity rules.
