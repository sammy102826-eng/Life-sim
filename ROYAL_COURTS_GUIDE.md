# Royal courts, constitutions and diplomacy

All five additions previously listed on line 73 of the royalty guide are implemented. Open your royal role in **Work**, then use the **Royal institutions** buttons. These controls extend the existing house, succession registry, treasury and public-opinion systems.

## Courts and territorial duchies

Each house has three regional courts with their own loyalty and annual administration costs. Listening audiences improve local loyalty and council confidence, with one audience per court per year.

Three territorial duchies track prosperity, loyalty, investment, stewards and ducal titleholders. Adult royals can fund an audited infrastructure project once per duchy per year. An adult sovereign or appointed adult regent can appoint stewards; only an adult sovereign can grant ducal charters. A charter adds the territorial Duke/Duchess title; it does not grant Crown succession rights. Lower-ranking peers may become dukes. Stewards improve annual prosperity and loyalty. Dead or renounced officeholders are removed from active appointments; territorial charters return to the Crown for reassignment.

These are regional stewardship trusts in a fictional dynasty, not new sovereign countries or a claim that every supported country has legal feudal duchies. Each regional court costs 25,000 country-adjusted base units per year; funding, staff and protection costs are additional to the pre-existing royal household operations budget.

## Country constitutions and succession

| Realms | Game powers | Default succession |
| --- | --- | --- |
| United Kingdom, Canada, New Zealand, Sweden | Ceremonial | Equal birth order |
| Japan | Ceremonial | Male line |
| Australia, Netherlands, Norway | Reserve | Equal birth order |
| Spain, Thailand | Reserve | Male preference within each branch |
| Morocco | Executive | Male line |
| Saudi Arabia, United Arab Emirates | Executive | Council selection of adult male dynasts |

These are simplified gameplay profiles, not complete legal descriptions. Existing reigns are preserved when an old save upgrades or a rule changes. The founding co-ruler convention from the royalty update remains in place. Succession rules apply to future accessions.

Equal birth order considers daughters and sons alike. Male preference orders sons ahead of daughters within each branch. Male-line succession excludes female-line descendants. Council selection considers eligible adult male dynasts, family standing and the sovereign's endorsed candidate. Consorts and renounced members remain ineligible.

Lineage eligibility is snapshotted separately from the cosmetic title-style selector, so changing between masculine and feminine titles does not bypass succession rules. A new birth uses the finalized character profile; older saves initialize from the available saved member data.

Adult sovereigns may propose a succession reform once yearly. Consultation costs 50,000 base units even if the proposal fails. Council confidence must reach 60, with public support 65 in parliamentary/reserve realms or 50 in executive realms. Success changes future succession without removing a living sovereign. A supported council/legislative assembly can also resolve an interregnum with no eligible heir: it requires public and council support 70 and a 100,000 consultation budget.

Ministerial audiences build confidence. Assent requires an adult sovereign or formally appointed adult regent and sufficient council/public support. Regents can manage delegated administration and authorized relief, but cannot grant new ducal charters, endorse a council-selected successor, reform succession or dismantle the monarchy. Ceremonial monarchs cannot authorize executive emergency spending. Reserve powers require an actual war affecting the realm or severe residence damage; executive sovereigns may authorize relief directly. Existing decree/law decisions respect council/ministerial approval: advocacy without sufficient approval cannot directly change civic policy.

## Diplomatic royal tours

From age 16, book a cultural, humanitarian or trade visit to another country. Minor royals need council approval and an escort. Tours are temporary official visits and do not change your residence or citizenship.

Booking spends royal funds immediately and schedules departure for the next Age Up. One tour can be booked per year. A cancellation before departure returns 75% of its booking cost once; it does not reset the annual booking limit.

The departure queues a conduct decision behind existing popups. Service and partnerships can improve the game's existing bilateral relationship adjustment, diplomatic rapport and public opinion. Partnerships can improve your realm's economic metric; public service can help the host's civic metric. Demanding luxury hospitality costs additional royal funds and can damage relations. Diplomatic staff improve outcomes and reduce booking costs.

A visit to a country at war with your realm cannot be booked. If such a war starts before the conduct decision, the visit is halted before additional decision spending. Tours, cancellations, outcomes and pending choices are saved; effects cannot be replayed.

## Staff and security

| Staff | Annual base salary | Benefit |
| --- | ---: | --- |
| Lord chamberlain | 80,000 | Court loyalty improvement; 20% lower court administration costs |
| Security chief | 120,000 | Lower protection-incident risk |
| Diplomatic secretary | 100,000 | 15% cheaper tours and better diplomatic outcomes |

Recruitment costs 5,000 base units. Dismissal ends future salary commitments. All costs use the royal treasury, not private cash.

Annual protection budgets are basic (20,000), standard (80,000) or enhanced (200,000). Higher protection, a security chief and temporary training reduce incident risk. Security responses include audited reviews, civil-liberty-conscious training and dismissive responses with public consequences. Explicit spending choices display their costs.

Annual assessments itemize salaries, protection and regional administration, charge once and preserve statements. If funds are insufficient, the treasury never goes negative: the shortfall is recorded, bonuses are suspended, confidence declines and protection risk rises.

## Regencies and family council

A sole minor sovereign automatically receives a living adult regent; an adult co-ruler prevents an unnecessary regency. The council replaces a deceased or renounced regent. If there is no living adult royal, a caretaker council acts instead.

From age eight, royals can listen to family concerns, mediate disputes and discuss education. These activities have yearly limits and affect confidence, family bonds and preparation. From age 12, a minor sovereign can negotiate supervised autonomy with confidence 65. Each of two autonomy levels improves service reach and lowers escorted-tour confidence requirements by five; governing authority remains unavailable until adulthood.

A supported council can approve a petition to replace the regent with another living adult royal. The consultation costs 15,000, requires confidence 60 and is limited to one successful appointment per year. It changes the regency, not succession eligibility.

At adulthood, a formal handover ends the regency and unlocks the sovereign's constitutional powers. Family-council disputes produce saved popup negotiations: audited mediation, compromise or threats have different funding, relationship and opinion effects.

## Saves and verification

Old royal saves initialize the new institutions without rerolling birth, house or family. Courts, charter holders, budgets, constitution, lineage, regent, tours, bilateral rapport and pending decisions persist. Continuing as a royal child resets annual action timing for the new player while preserving the house's institutional history. Abdication, exile and dismantling end access to active institutional actions and future assessments.

Validation: **139 browser tests passed**, with no failures or skipped tests. Run `npm test`. Tests cover each constitutional model, reforms, appointments and titles, staff bills, diplomacy, cancellation and war, regent negotiations and handover, saved popups, invalid save rejection, budget shortfalls, interregnums and mobile accessibility, alongside the existing game regression suite.
