/* Fictional matters and simplified, US-inspired procedures for the life simulation. */
const LAW_PRACTICES = {
  criminal: {name:'Criminal defense', model:'flat', fee:18000, forum:'jury', kind:'criminal', matters:[
    ['Warehouse burglary','A night-shift worker disputes identification in a burglary charge.','The prosecution','time-stamped shift logs','an eyewitness',0],
    ['Disputed fraud charges','A bookkeeper says a supervisor authorized the disputed transfers.','The prosecution','payment authorizations','the former supervisor',0]]},
  injury: {name:'Personal injury', model:'contingency', fee:0, forum:'jury', kind:'civil', matters:[
    ['Intersection collision','A delivery driver was injured in a disputed intersection collision.','An auto insurer','traffic-camera footage','a collision reconstruction expert',160000],
    ['Unsafe staircase','A tenant fell after repeated complaints about a broken handrail.','A property insurer','maintenance requests','the building superintendent',240000]]},
  corporate: {name:'Corporate law', model:'hourly', fee:475, forum:'bench', kind:'civil', matters:[
    ['Acquisition earn-out','A manufacturer disputes the revenue calculation in a sale agreement.','The acquiring company','audited revenue schedules','the deal accountant',950000],
    ['Minority shareholder dispute','An investor challenges related-party payments.','The company board','board minutes','a forensic accountant',760000]]},
  family: {name:'Family law', model:'hourly', fee:220, forum:'bench', kind:'family', matters:[
    ['Parenting plan modification','A parent needs a revised parenting plan after a change in work hours.','The other parent','school and care schedules','a family evaluator',0],
    ['Marital asset division','A couple disputes the valuation of a jointly owned shop.','The former spouse','business valuation records','a valuation expert',120000]]},
  realestate: {name:'Real estate law', model:'hourly', fee:285, forum:'bench', kind:'civil', matters:[
    ['Commercial lease dispute','A business seeks recovery after promised repairs were delayed.','The commercial landlord','lease notices and invoices','a building inspector',135000],
    ['Access easement','A landowner seeks continued use of a shared access road.','The neighboring owner','recorded deed maps','a licensed surveyor',65000]]},
  civil: {name:'Civil litigation', model:'hourly', fee:320, forum:'jury', kind:'civil', matters:[
    ['Supplier breach','A retailer claims losses after its supplier failed to deliver inventory.','The supplier','purchase orders','the receiving manager',220000],
    ['Professional negligence','A client claims a consultant failed to meet contracted standards.','The consultancy','project specifications','an industry expert',310000]]},
  constitutional: {name:'Constitutional law', model:'hourly', fee:270, forum:'bench', kind:'public', matters:[
    ['Public assembly permit','A civic group challenges a city restriction on public assembly.','The city','permit records','the permitting official',0],
    ['Public scholarship eligibility','A student challenges a public scholarship eligibility rule.','The education board','eligibility directives','the program director',0]]},
  ip: {name:'Intellectual property', model:'hourly', fee:410, forum:'jury', kind:'civil', matters:[
    ['Trademark confusion','A growing retailer alleges a competing brand is confusing its customers.','A competing retailer','customer communications','a marketing research expert',430000],
    ['Software license dispute','A developer claims a licensee exceeded its contractual permissions.','The software licensee','license records','a software licensing expert',510000]]},
  immigration: {name:'Immigration law', model:'flat', fee:6500, forum:'agency', kind:'agency', matters:[
    ['Family residency petition','A family faces an evidence request on a residency petition.','The immigration agency','civil registration documents','a family sponsor',0],
    ['Work authorization review','A scientist seeks review of an eligibility determination.','The immigration agency','employment and degree records','a department supervisor',0]]},
  entertainment: {name:'Entertainment law', model:'hourly', fee:380, forum:'arbitration', kind:'arbitration', matters:[
    ['Streaming residuals','A performer disputes how a platform calculated contract payments.','The production company','royalty statements','the payroll auditor',320000],
    ['Music publishing rights','A songwriter challenges an accounting for licensed tracks.','The music publisher','catalog and license records','the royalty accountant',290000]]},
  international: {name:'International law', model:'hourly', fee:490, forum:'arbitration', kind:'arbitration', matters:[
    ['Cross-border supply agreement','An exporter seeks payment after a disputed shipment.','The foreign distributor','customs and inspection records','a trade specialist',820000],
    ['Joint venture dissolution','A cross-border venture disputes the distribution of assets.','The overseas partner','venture financial statements','a bilingual auditor',1180000]]},
  classaction: {name:'Class-action lawsuits', model:'contingency', fee:0, forum:'jury', kind:'classaction', matters:[
    ['Recurring subscription charges','A proposed class alleges recurring charges continued after cancellation.','The subscription platform','billing and cancellation logs','the class representative',2800000],
    ['Wage records dispute','Workers allege a shared payroll rule excluded compensable time.','The employer','timekeeping and payroll records','a payroll analyst',3500000]]}
};

const LAW_ROUTES = {
  civil:['file','discovery','motion','settle'],
  criminal:['file','disclosure','motion','plea'],
  family:['file','disclosure','mediation'],
  public:['file','brief','motion'],
  agency:['petition','review'],
  arbitration:['file','disclosure','settle'],
  classaction:['file','discovery','certify','motion','settle']
};

const LAW_STAGES = {
  consultation:['Scope the representation',['Interview the client in depth','Check records and expectations','Limit the engagement']],
  evaluation:['Evaluate the case',['Research governing law','Focus on viable claims','Commission an early assessment']],
  investigation:['Investigate the evidence',['Authenticate the records','Interview independent witnesses','Retain a specialist']],
  file:['File or respond',['File on the strongest grounds','Seek a stipulated timetable','Submit a comprehensive filing']],
  discovery:['Discovery and depositions',['Depose the key witness','Request targeted documents','Conduct broad discovery']],
  disclosure:['Exchange evidence',['Verify disclosed records','Request missing materials','Interview a rebuttal witness']],
  motion:['Pretrial motions and hearings',['Challenge disputed evidence','Narrow issues by agreement','Seek an early ruling']],
  brief:['Brief the public-law issues',['Develop the factual record','Focus on the narrow legal question','Seek supporting declarations']],
  petition:['Submit the agency filing',['Document eligibility','Address gaps in a cover brief','Obtain additional certifications']],
  review:['Agency review',['Answer the evidence request','Request a scheduled interview','Submit corroborating records']],
  certify:['Class certification',['Establish common questions','Narrow the proposed class','Retain a damages expert']],
  settle:['Settlement negotiations',['Open mediation','Make a narrower counteroffer','Reject and prepare for trial']],
  mediation:['Family mediation',['Propose a consent agreement','Ask for a narrower agreement','Continue to an evidentiary hearing']],
  plea:['Plea negotiations',['Request a reduced charge','Seek a noncustodial recommendation','Prepare for trial']],
  prepare:['Prepare for hearing',['Rehearse witnesses','Refine the argument','Run a mock hearing']],
  opening:['Opening or preliminary submissions',['Present a chronological account','Lead with the strongest legal issue','Address weaknesses candidly']],
  direct:['Witness selection and direct examination',['Call the firsthand witness','Call the specialist','Rely on agreed records where permitted']],
  evidence:['Exhibits and objections',['Lay a full foundation for the records','Stipulate to limited exhibits','Object to disputed material']],
  cross:['Cross-examination',['Test inconsistencies in prior testimony','Challenge the scope of the testimony','Limit questioning to uncontested points']],
  surprise:['Unexpected testimony',['Request time to review the new account','Use corroborating records','Narrow the issue on redirect']],
  closing:['Closing argument',['Tie exhibits to each legal element','Focus on the burden of proof','Address the other side’s best argument']]
};

const LAW_OFFICES = [
  {label:'Solo suite', rent:950, price:115000, capacity:2, rep:0},
  {label:'Professional office', rent:3100, price:340000, capacity:7, rep:2},
  {label:'Regional headquarters', rent:8900, price:940000, capacity:20, rep:4},
  {label:'Metropolitan tower floor', rent:17500, price:2200000, capacity:42, rep:7}
];
const LAW_ROLES = {
  Associate:92000, 'Senior attorney':145000, Partner:175000, Paralegal:51000,
  'Legal assistant':43000, Receptionist:36000, Investigator:67000, Administrator:47000
};
const LAW_ATTORNEYS = ['Associate','Senior attorney','Partner'];
const LAW_FIRST = ['Avery','Jordan','Cameron','Adrian','Reese','Morgan','Tessa','Rina','Noor','Dara','Lena','Sofia','Elias','Theo','Imani','Mina','Grace','Isaac','Evan','Hana'];
const LAW_LAST = ['Park','Reed','Blake','Patel','Finch','Ortiz','Lin','Cruz','Doyle','Nguyen','Chen','Ramos','Ford','Bennett','Shaw','Brooks','Karim','Quinn','Stone','Das'];
const LAW_RIVALS = ['Whitaker & Howe','Blackwell Legal','Meridian Counsel','Northgate Partners','Alder & Vale','Juniper Legal Group','Granite Chambers'];
const LAW_EVENTS = [
  ['urgent','A key client was arrested on a separate matter.','Arrange independent counsel','Hold a private update meeting',3200,1800,0,0,5,2],
  ['records','A confidential file was disclosed to the wrong recipient.','Contain and disclose the incident','Delay disclosure pending review',6500,1300,5,-12,0,-3],
  ['ruling','An appellate ruling changed a relevant legal standard.','Update the firm’s filings and training','Request procedural extensions',2400,900,2,0,1,-1],
  ['intrusion','A security incident has disrupted the office.','Restore service and commission an independent review','Use backup intake and reschedule meetings',7100,2600,3,0,1,-2],
  ['complaint','An employee raised a workplace complaint.','Commission an independent investigation','Offer facilitated mediation',4200,1500,4,1,3,1],
  ['network','The local bar invited the firm to a networking event.','Sponsor the event','Send a small delegation',1800,500,0,0,0,0,4,1],
  ['celebration','The team wants to celebrate a filing milestone.','Host a team dinner','Schedule a shorter working day',1400,400,0,0,2,0],
  ['criticism','A former client publicly criticized the firm.','Review the complaint and issue a restrained statement','Offer a confidential meeting',1300,650,3,1,0,2],
  ['visitor','An unscheduled visitor needs urgent advice.','Offer a structured consultation','Refer them to another lawyer',400,0,1,2,3,0],
  ['economy','Local demand shifted after an economic slowdown.','Offer scoped flat fees','Invest in business development',1000,3300,0,0,2,0,0,5],
  ['conflict','A promising lead may overlap with an existing engagement.','Decline and document the conflict','Seek informed consent where permitted',300,1800,5,1,1,0],
  ['witness','A witness has changed their account before a hearing.','Verify the account independently','Request more time from the tribunal',3200,800,1,0,0,-1],
  ['class','A consumer group is seeking counsel for a potential class action.','Review common issues and refer if needed','Decline the intake',850,0,2,0,0,0,3,0],
  ['disagreement','Two coworkers disagree about case assignments.','Agree on a written allocation','Hold individual workload reviews',500,300,2,1,0,0],
  ['merger','A competitor has approached the firm about a merger.','Commission a diligence review','Decline the approach',1500,0,0,1,0,0,4,0]
];

const LAW_ADDITIONAL_MATTERS = {
  criminal:['Disputed obstruction charge','A bystander disputes whether they heard an officer’s order to leave.','The prosecution','body-camera timestamps','a nearby shopkeeper',0],
  injury:['Defective bicycle fork','A commuter seeks compensation after a part fractured on an ordinary ride.','The component manufacturer','the fractured component and inspection records','a materials engineer',195000],
  corporate:['Board information rights','A director seeks access to records before a restructuring vote.','The corporate secretary','prior board communications','the governance adviser',0],
  family:['Relocation request','A parent seeks a revised travel and visitation schedule after a job transfer.','The other parent','the transfer offer and travel schedule','a family services coordinator',0],
  realestate:['Commercial title defect','A buyer disputes a recorded lien that prevented a scheduled sale.','The title insurer','recorded lien releases','the closing agent',215000],
  civil:['Unfinished renovations','A shop owner seeks damages after a contractor abandoned a renovation.','The contractor','change orders and dated photographs','an independent estimator',175000],
  constitutional:['Public records restriction','A journalist challenges a rule restricting access to an agency’s records.','The public records authority','the denial letter and access policy','the records custodian',0],
  ip:['Image licensing claim','A photographer alleges unauthorized commercial use of a series of images.','The advertising agency','publication metadata and invoices','a publication editor',186000],
  immigration:['Specialist transfer petition','An employer seeks review of a denied petition for an interoffice transferee.','The immigration agency','employment history and training records','the regional director',0],
  entertainment:['Film distribution accounting','A producer disputes the recoupment of marketing costs under a distribution deal.','The film distributor','distribution and marketing accounts','a film financing analyst',485000],
  international:['Cargo inspection arbitration','A buyer disputes an award of storage costs after a shipment failed inspection abroad.','The overseas seller','independent cargo survey reports','the port surveyor',640000],
  classaction:['Product warranty program','A proposed class alleges a common repair program excluded covered claims.','The appliance manufacturer','service logs and warranty terms','a repair program coordinator',4200000]
};
for(const [specialty,matter] of Object.entries(LAW_ADDITIONAL_MATTERS))LAW_PRACTICES[specialty].matters.push(matter);
