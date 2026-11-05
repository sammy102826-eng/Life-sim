# Sponsorships, fan clubs and PR management

Open **Other → Fame** or click the bottom fame bar. Below your name and fame bar, **Long-term fame** opens three compact management pages. Existing Payment, Media, agent representation and reception history remain available.

## Long-term sponsorship contracts

From age 18, request one batch of offers per game year. Six fictional sponsors have different fame thresholds, sectors, rates and required activities. The offer batch is fixed until another game year; reopening it does not reroll fees. You can hold up to three active contracts.

**Review terms** opens a real decision before signing:

| Terms | Duration | Annual payment | Reputation requirements |
| --- | --- | --- | --- |
| Balanced | 2 years | Quoted base retainer | Credibility 45+, average deliverable reception 50+ |
| Premium exclusive | 3 years | 140% of quoted base | Credibility 60+, average deliverable reception 60+ |

Each sponsor requires two specific accepted appearances per year. Use its **Complete…** buttons to open the existing activity scenario. Ordinary appearance fees and participation costs remain separate from the contract retainer. A rejected appearance does not complete a deliverable. If you repeat an accepted task, its higher reception can replace the earlier mark, subject to the original activity limits.

Standalone appearances can satisfy one matching contract, rather than counting the same work toward several retainers. Contract-linked buttons identify the client and show the ordinary fee/cost quote. Exclusive agreements block competing agreements in the same sector and block unassigned standalone brand partnerships; deliver explicitly contracted work instead.

At the next Age Up, accepted deliverables, reception and current credibility determine the retainer. Reception of 75+ earns a 5% retainer bonus. Missing requirements withhold that year’s payment. Two missed years, or credibility more than 15 points below the agreement’s threshold, can terminate the contract. Reviews run once per age and preserve a payment/reason history.

A successfully completed term can receive a **renewal offer**. Review balanced/exclusive terms again; the updated fee reflects your fame change. Declining renewal ends the commitment. Signing or renewing alone never pays an unearned retainer.

**Review early termination** quotes a buyout of 25% of one annual fee and forfeits the current retainer. You must fund the buyout before cancellation completes. Replaying the same choice cannot charge twice.

Annual contract revenue and recurring PR salaries appear in the active annual summary for private funds. A separate commitment statement records retainers, payroll, shortfalls and club fan changes.

## Fan clubs and recurring characters

Three communities follow different interests:

- **The Creative Circle:** books, voice work, portraits and creative collaboration. Mira Lane and Theo Reed organize it.
- **Community Hearts:** charity, wish visits, meetups, privacy and practical kindness. Amara Brooks and Leo Park organize it.
- **The Front Row:** performances, premieres and direct contact. Casey Vale and Nora Bell organize it.

Club loyalty responds to accepted work, reception and conduct. Thoughtful work in a club’s preferred activities builds stronger loyalty than unrelated appearances; exploitative conduct can damage all three communities.

Each club and each active organizer allows two conversations per age, from age 13. Conversations have choices: listen and follow through, pay for an accessible gathering, or dismiss supporters. Minor celebrities have guardians/moderators involved. Outcomes affect loyalty, personal bonds, fans and persistent shared memories.

Organizers keep their identities, memories and ages across saves. With bond 75+ and an adult player, a trusted organizer can become a persistent **Friend**, once. Club conversations and the normal relationship menu share the same bond and age. Inactive contacts and retired organizers remain in the record; when a club has no active organizers, a new coordinator can join.

At Age Up, high loyalty (75+) can recruit fans and low loyalty (below 30) can lose fans. The amount depends on club size, which is bounded by the actual total fan base. Club changes happen once per year. Organizers’ private bonds and club loyalty are separate measures: friendship does not guarantee unanimous audience approval.

## PR team and campaigns

The existing agent still improves quoted fees and acceptance. PR staff provide separate ongoing services:

| Role | Annual base retainer | Funded benefit |
| --- | ---: | --- |
| Publicist | 12,000 | +8 percentage points to acceptance below the guaranteed tier; +2 reception |
| Campaign strategist | 22,000 | 20% cheaper campaign plans and +4 reception on matching campaign work |
| Crisis adviser | 30,000 | Better reception on press controversies, cheaper crisis responses and stronger repair |

Recruitment asks for confirmation and charges 1,000 setup **plus the first annual retainer immediately**. Future retainers renew at each Age Up while the person remains active. Dismissal stops future retainers and benefits; it does not refund the first year. This prevents hiring and dismissing staff for free temporary bonuses.

A retainer that cannot be funded does not make the treasury negative. Its shortfall is recorded and that staff member’s benefits pause until a funded annual renewal. Private cash and annual income can support private teams; royal staff use household funds. Former celebrities can still manage existing commitments and crises when their fame falls below the threshold for new appearances.

### Campaigns

From age 16, plan one campaign per age. Planning costs 3,000 base units, reduced by a funded strategist. Choose a focus:

- Creative credibility supports books, voice work, photoshoots and collaborations.
- Community connection supports charity, wish visits, meetups and livestreams.
- Trust and transparency supports interviews, partnerships, commercials and paid appearances.

The planning popup offers a careful evidence-based approach, community listening, sensational buzz or deferral. A plan supports the next three **accepted, matching** appearances before the next birthday. Nonmatching work, rejection and declining do not consume uses. Careful/listening plans improve reception; sensational plans sacrifice credibility and have uncertain reception. A funded strategist strengthens matching work. Plans expire at Age Up rather than providing permanent bonuses.

### Crises

Very poor reception or sufficiently low credibility opens a reputation crisis. The PR page shows unresolved cases and their severity. Each case allows one attempted response per age:

- Verify the facts and repair the harm.
- Arrange a mediated conversation.
- Attack critics and risk escalation.
- Defer while considering your response.

The popup quotes the cost before you choose. A crisis adviser lowers repair from 5,000 to 1,500 base units and mediation from 2,500 to 750. Assisted repair restores more credibility. Constructive responses can restore fans and loyalty; attacks can worsen both. Unresolved crises reduce credibility before yearly sponsor reviews, so timing matters for contract clauses. Replaying a response cannot repeat its effects or charge money again.

## Royal funding and news

Official royal fees, retainers, fan-event costs and PR costs use the household treasury, preserving the existing separation from private cash. Commercial image use can still anger the public. Contracts and PR posts signed specifically for a royal household end when that affiliation ends, instead of becoming private windfalls or bills. Existing private commitments use the current life’s normal funding rules.

The newspaper can report sponsorship and reputation developments alongside its existing stories. Management history remains available for the details behind a headline.

## Saves and validation

All data is local to the life’s existing save: offers, terms, obligations, accepted work, renewal state, staff, clubs, recurring people, campaigns, crises, pending choices and financial history. Older lives initialize these fields when first used. These personal-image commitments do not automatically bind a new character when continuing as a child.

Save validation rejects malformed contracts, unknown sponsors/roles/campaigns, invalid financial quotes and invalid fan-club data. Activity and management limits survive loading, and a pending negotiation or fan conversation can be resumed.

Run `npm test`. Focused cases cover signing through actual buttons, contract settlement and renewal, reputation and exclusivity, cancellation, shared deliverables, recurring fan memories and friendships, funded/unfunded staff, campaign scope/expiry, crisis repair, royal funding, malformed saves and 320-pixel accessibility. The complete existing game regression suite is retained.

Validation: all 183 regression tests passed. All 18 focused feature tests passed, followed by two passing navigation and narrow-phone checks after the final result-popup adjustment.
