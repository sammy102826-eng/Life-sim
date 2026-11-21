const CIVIC_OFFICES=[
 ['school','School board member','school',18,450,4200,4],
 ['council','City council member','city',18,1200,24000,4],
 ['mayor','Mayor','city',21,3800,85000,4],
 ['regional','State representative','region',21,6500,58000,2],
 ['governor','Governor','region',25,12000,145000,4],
 ['house','House representative','nation',25,15000,174000,2],
 ['senate','Senator','nation',30,22000,174000,6],
 ['leader','President','nation',35,30000,400000,4]
];
const CIVIC_SYSTEMS={
 us:{parties:['Democratic','Republican','Independent'],body:'Congress',court:'Supreme Court',mode:'presidential'},
 westminster:{parties:['Conservative','Labour','Liberal','Green'],body:'Parliament',court:'Supreme Court',mode:'parliamentary',
  offices:{school:'School trustee',regional:'Member of the regional assembly',governor:'Regional first minister',house:'Member of Parliament',senate:null,leader:'Prime Minister'}},
 commonwealth:{parties:['Liberal','Conservative','Labour','Green'],body:'Parliament',court:'High Court',mode:'parliamentary',
  offices:{school:'School trustee',regional:'Member of the provincial assembly',governor:'Premier',house:'Member of Parliament',senate:null,leader:'Prime Minister'}},
 federal:{parties:['Social Democrats','Conservatives','Liberals','Greens'],body:'Federal Parliament',court:'Constitutional Court',mode:'parliamentary',
  offices:{school:'Education committee member',regional:'State parliament member',governor:'Minister-president',house:'Federal parliament member',senate:null,leader:'Chancellor'}},
 semi:{parties:['Center Alliance','Social Democrats','Conservatives','Greens'],body:'National Assembly',court:'Constitutional Council',mode:'presidential',
  offices:{school:'School council member',regional:'Regional councillor',governor:'Regional council president',house:'National Assembly member',senate:'Senator'}},
 assembly:{parties:['Civic Alliance','Social Democrats','People’s Party','Green Alliance'],body:'National Parliament',court:'High Court',mode:'parliamentary',
  offices:{school:'Education council member',regional:'Regional assembly member',governor:'Regional council chair',house:'Member of Parliament',senate:null,leader:'Prime Minister'}},
 presidential:{parties:['Civic Alliance','Labor Party','National Party','Independent'],body:'National Congress',court:'Supreme Court',mode:'presidential',
  offices:{school:'Education council member',regional:'Regional representative',governor:'Regional governor',house:'National representative',senate:'Senator'}},
 council:{parties:['Civic Delegation','Regional Delegation','Public Service Delegation'],body:'National Council',court:'High Court',mode:'council',
  offices:{school:'Education committee member',regional:'Provincial delegate',governor:'Provincial administrator',house:'National Council member',senate:null,leader:'Council chair'}}
};
const CIVIC_COUNTRIES={ 'United States':'us','United Kingdom':'westminster',Canada:'commonwealth',Australia:'commonwealth',
 'New Zealand':'westminster',Germany:'federal',France:'semi',Poland:'semi',Ukraine:'semi',Brazil:'presidential',Mexico:'presidential',
 Argentina:'presidential','South Korea':'presidential',Indonesia:'presidential',Philippines:'presidential','South Africa':'assembly',
 Nigeria:'presidential',Egypt:'semi',Turkey:'presidential',Japan:'assembly',India:'assembly',Italy:'assembly',Spain:'assembly',Sweden:'assembly',
 Netherlands:'assembly',Switzerland:'council',China:'council','North Korea':'council','Saudi Arabia':'council','United Arab Emirates':'council',
 Vietnam:'council',Iran:'council',Russia:'semi',Kenya:'presidential',Chile:'presidential',Colombia:'presidential',Peru:'presidential',
 Venezuela:'presidential',Pakistan:'assembly',Singapore:'assembly',Thailand:'assembly'};
const CIVIC_OVERRIDES={
 Canada:{court:'Supreme Court',parties:['Liberal','Conservative','New Democratic','Bloc Québécois','Green']},
 Germany:{parties:['Christian Democrats','Social Democrats','Greens','Free Democrats','The Left']},
 Australia:{parties:['Labor','Liberal','National','Greens'],offices:{regional:'State parliament member'}},
 Japan:{body:'National Diet',court:'Supreme Court',parties:['Liberal Democratic','Constitutional Democratic','Komeito','Innovation Party']},
 India:{body:'Parliament',court:'Supreme Court',parties:['Bharatiya Janata','Indian National Congress','Regional Alliance','Left Front']},
 Brazil:{parties:['Workers’ Party','Liberal Party','Brazilian Democratic Movement','Social Democratic Party']},
 Switzerland:{body:'Federal Assembly',court:'Federal Supreme Court',offices:{leader:'Federal Council chair',regional:'Cantonal representative'}},
 'United Kingdom':{parties:['Labour','Conservative','Liberal Democrats','Green','Regional parties']},
 'South Korea':{body:'National Assembly',court:'Constitutional Court',offices:{senate:null}},
 France:{parties:['Centrist Alliance','Socialists','Republicans','Greens','National Bloc']}
};
const CIVIC_POLICIES={
 curriculum:['Curriculum standards',['school'],{S:5},.08],schools:['Classroom investment',['school','city','region','nation'],{S:6},.12],
 transport:['Public transport and maintenance',['city','region','nation'],{E:4,V:3},.10],housing:['Affordable housing',['city','region','nation'],{S:5,E:2},.11],
 safety:['Emergency preparedness',['city','region','nation'],{A:6},.10],water:['Water and conservation',['city','region','nation'],{V:7},.10],
 health:['Public health access',['region','nation'],{S:7,A:2},.13],jobs:['Workforce training',['city','region','nation'],{E:6},.10],
 tax:['Tax relief',['region','nation'],{E:4,S:-2},.07],allotment:['Operating budget',['school','city','region','nation'],{E:2,S:3},.12],
 extraction:['Resource development permits',['nation'],{E:5,V:-6},.12],defense:['Defense authorization',['nation'],{A:3,S:-2},.11]
};
const CIVIC_EVENTS={
 curriculum:['Parents challenge new curriculum standards','school',['Hold a public hearing','Commission a curriculum review','Keep the existing standards'],[{S:4},{S:2},{S:-3}]],
 teachers:['A staffing shortage disrupts schools','school',['Fund teacher retention','Partner with nearby districts','Keep staffing unchanged'],[{S:5,E:-2},{S:3},{S:-5}]],
 flood:['Flooding displaces residents','city',['Open emergency shelters','Request regional aid','Wait for a damage assessment'],[{S:5,A:3},{S:3,A:2},{S:-4,A:-2}]],
 transit:['Transit workers announce a strike','city',['Offer a mediated agreement','Run a limited emergency service','Maintain the existing offer'],[{E:4,S:2},{A:3,S:-1},{E:-4,S:-3}]],
 housing:['Rents trigger a public protest','city',['Fund tenant assistance','Schedule a focused public hearing','Maintain existing programs'],[{S:6,E:-2},{S:2},{S:-5}]],
 wildfire:['A regional disaster strains emergency services','region',['Coordinate mutual aid','Release regional emergency funds','Leave the response with local agencies'],[{A:6,S:3},{A:4,E:-2},{A:-4}]],
 employer:['A large employer plans to close','region',['Fund retraining','Negotiate a transition agreement','Let the closure proceed'],[{E:5,S:2},{E:2,S:2},{E:-5}]],
 strike:['Public-sector workers threaten a nationwide strike','nation',['Offer negotiations','Commission binding mediation','Hold the current line'],[{S:5,E:2},{S:3},{E:-5,S:-3}]],
 privacy:['A court challenge tests a new privacy policy','nation',['Accept a narrower policy','Refer the measure to committee','Maintain the government’s position'],[{S:4},{S:2},{S:-4}]],
 migrants:['A humanitarian emergency reaches the border','world',['Coordinate international relief','Provide limited emergency assistance','Refer the matter to an international forum'],[{S:5,A:2},{S:2},{S:-2}]],
 trade:['Trade partners threaten retaliatory tariffs','world',['Negotiate a temporary standstill','Support affected industries','Maintain the current schedule'],[{E:6},{E:3},{E:-5}]],
 peace:['International mediators seek a security dialogue','world',['Join peace talks','Offer humanitarian support','Request a broader conference'],[{A:5},{S:4},{A:2}]],
 tradeOffer:['A partner offers an unusual trade concession','world',['Request transparent terms','Accept a private concession','Decline the offer'],[{E:3,S:2},{E:6,S:-4},{E:-1}]],
 climate:['A regional climate accord is on the agenda','world',['Commit to joint monitoring','Fund adaptation partnerships','Request a revised agreement'],[{V:6},{V:4,S:2},{V:1}]]
};
const CIVIC_CABINET=['Finance','Education','Health','Foreign affairs','Defense','Justice','Environment'];
const CIVIC_BODIES={WHO:'Public health coordination',UN:'Humanitarian relief and mediation',WTO:'Trade coordination',
 NATO:'Collective security dialogue','Climate Partnership':'Environmental monitoring and adaptation'};
