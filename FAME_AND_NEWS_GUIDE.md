# Fame, news and interactive life choices

## Fame profile

When Fame reaches 10, a clickable fame bar appears immediately above the other bottom stats. Royal recognition and special-career fame feed this bar; new career recognition appears without waiting for another birthday. Click it, or open **Other → Fame**, for your name, fame title, bar, active fan total and credibility.

The profile has compact, collapsible menus:

- **Payment:** books, commercials, photoshoots, sponsors/brand partnerships, voice performances and paid guest appearances.
- **Media:** talk shows, red carpets, fan meetups, charity events, wish visits, celebrity collaborations, publicity stunts and public Q&A livestreams.
- **Representation:** keep the original agent feature, discuss hiring for a one-time country-adjusted 5,000 fee, or end representation. An agent raises quoted fees by 20% and adds five percentage points to acceptance below the guaranteed tier.
- **Reception & earnings history:** past outcomes, fees, costs and actual fan changes.

Each activity opens its own situation and three approaches plus a decline option. A wish visit discusses the family’s wishes, comfort and privacy; an endorsement discusses claims and disclosure; a collaboration discusses credits and audience involvement. Nothing is paid simply for opening the offer.

Fees scale with current fame and the profile of the organizer. Lower fame can lead to rejection without a fee or participation charge. Fame 85+ guarantees organizer acceptance, while age, funds and activity limits still apply. Fame 60+ can bring inbound brand offers after Age Up. An agent and an inbound invitation improve quoted offers.

After an accepted appearance, the result displays a randomized **audience reception** bar, payment, participation cost, fan change and updated fan total. Reception affects final paid fees, fame and credibility. Fans can leave after bad conduct; losses never exceed the actual fan base. Fans are a distinct active audience metric from existing platform follower counts.

Each paid activity allows two attempts per age; each media activity allows three. Rejection or declining consumes the offered attempt; cancellation does not charge money. Publicity receipts and pending choices persist in saves, and the same decision cannot pay twice. History retains the latest 60 records.

Royal households keep their existing restrictions: official appearance proceeds and costs go to household funds, not private cash. Commercial use of a royal title can reduce public opinion and lead to exile. The royal household supplies its own communications staff.

The additional publicity-event catalog contains **72 topic/scenario combinations** involving rumors, privacy, paparazzi, cancellations, credit disputes, recalls, impersonators, sponsors, fans and public accountability. Annual publicity and incoming offers wait behind existing game decisions.

## Newspaper

The newspaper icon sits at the top left beside the player’s name. It opens a graphic newspaper with a masthead, serif typography, columns on wide screens and a single-column phone layout. Close it with the button or Escape. It does not discard existing decisions; finish those before opening it.

An edition is generated once per game age, with two community stories and relevant personal stories, up to seven articles. The newspaper can report career changes, degrees, new children, home purchases, royal transitions and coronations, property incidents, bereavements, school years and public reception. Twelve community-news themes cover housing, markets, clinics, volunteering, security, education, recruitment, culture, weather, transit, sports and science.

Thirty editions are retained, with their original age and place. Historical articles remain readable but cannot issue fresh rewards or decisions. The paper uses a separate deterministic news generator, so reading it does not consume the gameplay random-number sequence or reroll an edition.

**Read & respond** opens a story decision. Depending on the article, you can review a budget, compare property, browse investments, contact education/work services, book a routine care discussion, volunteer, donate or keep a matter private. Routes lead to the existing systems; the paper never buys an asset or investment automatically. A booked medical discussion still uses the normal appointment and payment process. Donations require available private cash and cannot replay.

Some stories have actual economic effects:

- **Housing slowdown:** participating sellers offer 10% lower store purchase quotes for the current game year. The catalog, cash price and financing quote use the same price. Existing owned values, debt and signed rents are preserved. A quote cannot be reused after its game year expires.
- **Stock-market stumble:** an existing stock portfolio can incur an additional 8% decline once for that edition. Reopening or rereading the paper cannot apply another decline. The report explains the portfolio change; browsing an investment is a separate choice with normal affordability checks.

## Interactive choices across the game

The shared activity-choice layer now covers schoolwork and campus activities, teacher/classmate activities, workplace discussions and collaboration, special-career tasks, real-estate client work, pet interactions and apologies, care/treatment activities, property/household activities, royal institutional duties, selected financial actions and routine Other activities.

An instant activity button opens a situation first. You choose careful preparation, a supportive/collaborative approach or a careless approach, or leave the activity for later. The approach can affect learning, performance, bonds, wellbeing, public opinion or financial habits. Positive extra approach bonuses are limited to three per handler per age, preventing repeated transfers or routine tasks from farming the new rewards. Underlying activity costs, caps, school time/energy, employment restrictions and medical requirements remain authoritative.

Existing detailed relationship scenes, applications, course-schedule confirmations, royal negotiations, purchase quotes and other native decision flows are retained. Navigation, settings and forms that already ask for a specific amount or confirmation keep their appropriate controls. The update does not replace every game story with the same generic text: fame and news have their own scenarios, while the shared layer connects previously instant activities.

Choosing an approach does not spend money or complete the task until the choice resolves. Cancellation, stale ages/contexts and refused underlying actions cannot grant extra progress. Pending activity choices and a capped history persist in saves.

## Compatibility and tests

The game entry point and GitHub Pages launcher are preserved. All added scripts and artwork use local paths. New saves validate publicity, newspaper archives, market quotes and pending activity decisions; older saves initialize these fields when needed. The existing jobs, education, relationships, royal courts, health, property and save tests remain part of `npm test`.

Validation: the complete **164-test regression suite passed**, followed by a passing country/archive check. Focused checks cover every fame activity, scaled quotes, acceptance, rejection, costs, royal funds, fans, agents, incoming offers, reaction dialogs, paper archives and actions, actual market effects, quote expiry, meaningful school/career choices, cancellation, limits, malformed saves and narrow-screen accessibility.

## Implemented follow-up additions

- Long-term sponsorship contracts with deliverables, renewals and reputation clauses.
- Fan clubs with different interests, loyalty and recurring characters.
- A publicist/PR team that can plan campaigns and help manage crises.

All three additions above are now implemented. See [FAME_COMMITMENTS_GUIDE.md](FAME_COMMITMENTS_GUIDE.md) for contracts, recurring fan communities and PR management.
