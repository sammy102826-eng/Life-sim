# Royalty update

## Entering royal life

On **Be born**, a new life in one of the supported monarchy countries has a 2% gameplay chance of royal birth. The check runs once per life; loading an older save never rerolls its origin. Republics cannot generate royal births. The supported game realms are the United Kingdom, Canada, Australia, New Zealand, Japan, Spain, Sweden, the Netherlands, Norway, Thailand, Morocco, Saudi Arabia and the United Arab Emirates.

Adult dating has a 4% chance of encountering a royal from an available monarchy. The partner card identifies their country and explains the relocation requirement. A completed wedding moves you there, preserves existing relationships and adds a separate **Royal In-laws** relationship section. Your spouse remains in **Dating / Spouse**. Ordinary engagement or a failed/unfinished wedding does not confer royalty. A consort does not inherit the crown through marriage alone.

These are fictional houses with unique names, colors, SVG crests and protected residences. Commonwealth realms are modeled separately for this game's country-specific political transitions; these are not biographies or a simulation of the real shared Crown. Birth/dating probabilities favor playable stories rather than matching population statistics.

## Titles, family and succession

Open **Work → Current royal title → Open royal duties & succession**. The card and detailed view show your name, title, personal allowance, public opinion and house crest. The game header also shows your royal title. A title-style selector supports masculine or feminine forms independently of health physiology.

- King/Queen, Emperor/Empress in Japan, Emir/Emira in the UAE, Prince/Princess, Duke/Duchess, Earl/Countess, Baron/Baroness and retired royal titles are supported. A duchy is a territory; its titleholder is a Duke or Duchess.
- Born-royal parents are fictional co-rulers. All existing grandparents and siblings receive titles and allowances. The surviving parent keeps the crown until both co-rulers have died. Grandparents are retired royals rather than automatically displacing their children.
- Succession follows the realm’s constitutional rules, detailed in [ROYAL_COURTS_GUIDE.md](ROYAL_COURTS_GUIDE.md). Where birth-order inheritance applies, descendants precede a younger sibling's branch. Consorts, deceased members and renounced members cannot inherit. A minor heir receives a regency until adulthood.
- Royal marriages grant a spouse a corresponding title; marrying a sovereign makes them a consort. Natural births, assisted conception and adopted children register through the existing child system and receive titles. Children of a sovereign/prince receive princely titles; a ducal branch passes to earldom and then baronial titles in this simplified model.
- Deaths and accessions generate memorial/coronation notices. Continuing the game as a royal child preserves the house and succession registry.

## Income, residence and ordinary work

Personal annual allowance benchmarks, before the game's country economic adjustment:

| Rank | Personal annual allowance |
| --- | ---: |
| Sovereign | 1,200,000 |
| Sovereign consort | 450,000 |
| Prince/Princess | 300,000 |
| Duke/Duchess | 180,000 |
| Earl/Countess | 100,000 |
| Baron/Baroness | 65,000 |
| Retired senior royal | 220,000 |

These are fictional game-scale personal allowances, not claims about actual families' audited incomes. The household treasury is separate from personal cash. It starts with a reserve, receives a simplified annual estate/endowment and official-household allocation, and budgets family allowances and official operations. Royal decision costs and public programs use this treasury. Ordinary personal expenses still use your cash.

Royal duties replace jobs, political office, internships, executive careers and paid gigs. Both menus and handlers enforce this, including stale job-confirmation buttons. Education remains available. Existing investment principal and businesses are preserved but their ordinary annual returns pause during royal service; rental receipts flow into the royal estate treasury rather than personal income. Abdication or a completed republican transition restores ordinary career access.

The Crown residence appears under **Stuff → Owned → Property**. It is held in trust, excluded from personal net worth, and cannot be sold, gifted, seized for personal debt, rented, converted or replaced with a civilian rental while royal. Maintenance and normal incident/insurance systems remain available. Existing privately owned homes are preserved as additional assets.

## Duties, public opinion and events

The catalog contains **504 unique topic/scenario combinations**, built from 24 decree subjects, 24 law subjects, 24 public-benefit causes, 24 scandal subjects and 40 royal-life subjects, each with authored scenario variants. They share consistent decision rules while varying the topic, circumstances and funding requirements.

- **Issue Decree:** once yearly from 18. A sovereign issues the policy; other royals submit a proposal to the sovereign.
- **Support law:** once yearly from 16. This is advocacy; the legislature retains lawmaking authority.
- **Public benefit:** once yearly from 8, with guardians assisting children. Audited charity, consultation and public programs can improve trust and civic outcomes.
- **Public disservice:** once yearly from 16. Accountability and restitution can repair harm; privilege and concealment can severely reduce opinion.
- **Royal life:** one decision yearly with age-appropriate topics. Additional automatic decisions are queued every other year. Memorials, coronations, public crises and transitions also generate notices.

Choices can spend royal funds, change public opinion, affect family bonds and alter civic wellbeing. Decisions are saved and cannot be replayed for repeated rewards. Royal popups wait behind existing education, health, annual-summary and other game decisions.

Rank grants an appropriate fame floor. Commercial endorsements, paid covers and similar attempts to commercialize royal status can anger the public. In the new Fame profile, official proceeds go to the royal household treasury rather than private cash; see [FAME_AND_NEWS_GUIDE.md](FAME_AND_NEWS_GUIDE.md). Service appearances can improve opinion; a royal charity gala uses household funds. Public opinion at 10 or below triggers exile. A sufficiently alienated adult royal family can also withdraw protection and force exile.

## Abdication, exile and dismantling

Adults may abdicate through a confirmation popup. Abdication ends personal royal income, residence access and succession rights; the country remains a monarchy and the next eligible heir can succeed. Exile also moves the player abroad. Renunciation prevents immediately reclaiming the same country's status through another marriage. Divorce ends a married-in consort's royal role.

Only an adult reigning sovereign sees **Dismantle the monarchy**. Confirmation explicitly warns that the change is irreversible. It applies only to that country. Three saved decisions follow:

1. Help the family adjust to civilian life or strip privileges immediately.
2. Retain the residence privately, create a museum or return it to public ownership.
3. Take the treasury, share it among living relatives, donate to audited charities or transfer it to a public trust.

The player becomes a commoner after completing all choices. NPC royal allowances end too. Keeping public wealth can provoke public anger and estranged family relationships; charitable/public transfers can improve opinion. A retained former palace becomes ordinary saleable property. A transferred residence leaves the inventory and the housing system supplies supported civilian housing. Distributions resolve once; saves can resume the transition between decisions. Other monarchies remain available in the world.

After royal life ends, **Work → Former royal household & transition record** preserves the history and aftermath.

## Validation and completed follow-up additions

Validation: the complete **139-test browser suite passed**, including the court, constitutional, diplomatic and regency additions. Run `npm test`. Royal-specific tests cover country restrictions, birth checks, marriage and relocation, family titles, branch succession, co-ruler deaths, allowances, employment blocks, residence protection, age gates, decision replay protection, fame, exile, abdication, dissolution, save validation, heir continuation, popup ordering and mobile accessibility.

All additions formerly listed here are now implemented: separate royal courts and territorial duchies, country-specific constitutional powers and succession law, diplomatic royal tours, staff/security budgets, and richer regency/family-council negotiations. See [ROYAL_COURTS_GUIDE.md](ROYAL_COURTS_GUIDE.md) for controls, costs and rules.
