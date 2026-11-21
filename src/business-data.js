/* Prices and labor policies are tuned for the game's economy. */
const BUSINESS_INDUSTRIES={
 construction:{name:'Construction',sector:'industry',types:[['Renovation package',2200,780],['Building component',700,280]],patents:['Modular foundation', 'Low-waste framing']},
 ai:{name:'Artificial intelligence',sector:'technology',types:[['Analytics license',420,56],['Automation platform',760,110]],patents:['Auditable inference engine','Privacy-preserving model']},
 marketing:{name:'Marketing',sector:'services',types:[['Campaign package',650,110],['Audience research',320,65]],patents:['Consent-based attribution','Campaign forecasting']},
 manufacturing:{name:'Manufacturing',sector:'industry',types:[['Industrial sensor',540,190],['Workshop equipment',950,320]],patents:['Precision assembly','Recyclable housing']},
 energy:{name:'Clean energy',sector:'energy',types:[['Battery module',880,340],['Efficiency retrofit',1600,530]],patents:['Thermal storage cell','Grid balancing controller']},
 food:{name:'Food and agriculture',sector:'agriculture',types:[['Meal delivery plan',250,85],['Wholesale produce box',180,62]],patents:['Low-energy cooling','Water-efficient growing system']},
 finance:{name:'Financial services',sector:'finance',types:[['Budgeting service',280,42],['Business accounting package',680,80]],patents:['Accessible forecasting tools','Fraud alert system']},
 retail:{name:'Retail',sector:'services',types:[['Home goods collection',300,105],['Specialty goods membership',350,115]],patents:['Repairable product design','Inventory routing system']}
};
const BUSINESS_ROLES={
 entry:['Entry-level',28000,4],specialist:['Specialist',43000,2],lead:['Team lead',56000,1],
 manager:['Manager',78000,1],operations:['Operations director',105000,1],finance:['CFO',135000,1]
};
const BUSINESS_EVENTS={
 recall:['A quality review triggers a product recall','Customers want a remedy and a timetable.',[['Recall and replace affected orders',22000,8,2,0],['Publish a repair plan',11000,3,1,0],['Decline voluntary repairs',0,-10,-1,0]]],
 labor:['Workers request a formal pay agreement','Turnover and future capacity depend on the response.',[['Fund the agreement',17000,7,8,0],['Open mediated negotiations',5500,2,3,0],['Reject the proposal',0,-8,-9,0]]],
 grant:['A research consortium opens a grant round','The award comes with public reporting requirements.',[['Match funding and publish findings',9000,5,0,40],['Join an academic partnership',3500,2,0,22],['Keep research independent',0,0,0,0]]],
 supply:['A critical supplier exits the market','Your next production year depends on sourcing.',[['Qualify a domestic supplier',15000,6,4,0],['Arrange a shared purchasing agreement',7000,2,2,0],['Wait for spot prices to recover',0,-5,-4,0]]],
 privacy:['A customer group questions your data practices','An audit can help retain institutional clients.',[['Fund an independent audit',16000,8,3,0],['Publish a limited review',6500,2,1,0],['Continue existing practices',0,-8,0,0]]],
 contract:['A public contract shortlist is announced','The tender rewards reliable delivery and transparent bids.',[['Invest in the tender',12000,5,4,0],['Submit a smaller proposal',4500,2,2,0],['Pass on the tender',0,0,0,0]]],
 climate:['Insurers revise facility coverage','Better protections can limit interruption losses.',[['Retrofit facilities',20000,6,5,0],['Update emergency plans',5000,2,2,0],['Accept the risk',0,-4,-2,0]]],
 automation:['An automation plan divides staff','The company must balance output and job security.',[['Train staff for new roles',17000,7,6,8],['Pilot with worker oversight',7000,3,3,5],['Accelerate automation',0,-7,-6,12]]],
 tax:['A corporate tax review reaches the press','The company must answer questions about its reported profits.',[['Restate and pay the assessment',18000,7,0,0],['Commission an audit',6500,3,0,0],['Maintain the existing filing',0,-9,0,0]]],
 shortage:['Customers face a delivery backlog','Your response can restore confidence or damage future demand.',[['Add weekend shifts with overtime',12000,6,2,0],['Offer a delayed delivery credit',7000,3,1,0],['Keep the original terms',0,-6,-2,0]]],
 leak:['A rival product resembles your patented design','A formal review can protect future licensing revenue.',[['Bring a patent claim',24000,4,0,10],['Offer a licensing settlement',7000,3,0,5],['Keep competing on price',0,-4,0,0]]]
};
const BUSINESS_INDUSTRY_EVENTS={
 construction:['contract','supply','climate'],ai:['privacy','automation','grant'],marketing:['privacy','contract','grant'],
 manufacturing:['recall','automation','supply'],energy:['climate','grant','contract'],food:['recall','supply','climate'],
 finance:['privacy','tax','automation'],retail:['shortage','labor','supply']
};
const BUSINESS_CORPORATE_RATES={'United States':21,Canada:26,'United Kingdom':25,Germany:30,France:25,Japan:30,Australia:30,India:25,'United Arab Emirates':9,Switzerland:15,China:25,Ireland:13,Brazil:34};
const BUSINESS_COUNTRIES={
 transit:['Cross-border freight improves','New freight capacity eases input prices and helps manufacturers.',{industry:5,services:2},.98],
 trade:['New tariffs ripple through global trade','Imported inputs become costlier and manufacturers face slower demand.',{industry:-6,technology:-2},1.025],
 energy:['Global energy prices climb','Higher fuel costs lift energy producers and squeeze logistics and housing demand.',{energy:7,industry:-4},.98],
 credit:['Global lenders tighten credit','Investment appetite and international property demand weaken.',{finance:-7,services:-4},.96],
 research:['Research partners announce a joint funding program','Technology and service companies gain new outlets for their work.',{technology:7,services:3},1.015],
 housing:['Cross-border construction investment expands','New development boosts construction activity and local property demand.',{industry:4,finance:3},1.035]
};

const BUSINESS_CAPITAL_ENTRIES=new Set([
 'Opening owner capital','Outside investor capital','Opening loan principal','Opening equipment and registration','Owner capital','Public offering proceeds',
 'Shareholder distributions','Acquisition escrow','Acquisition escrow refund','Divested assets','Emergency loan principal','Loan principal',
 'Extra loan principal','Inherited escrow refund','Expansion','Headquarters relocation','Facility purchase','Facility sale','Share repurchase'
]);
