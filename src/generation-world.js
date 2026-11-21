const GEN_TRAVEL={culture:['Historic center and local museum',190,4],food:['Food market and cooking class',155,4],
 coast:['Guided coast or river outing',230,4],nature:['Nature reserve and scenic trail',180,5],
 local:['Neighborhood walk and community visit',45,3],rest:['A relaxed day near the lodging',0,2]};
const GEN_TRAVEL_EVENTS=[
 ['The tour operator changes the itinerary',[['Take the replacement tour',0,3],['Book a smaller local tour',-45,5],['Request a partial refund',35,1]]],
 ['A wet afternoon interrupts the outing',[['Explore an indoor exhibition',-35,3],['Head back for a quiet afternoon',0,1],['Wait for a break in the weather',0,2]]],
 ['A local artisan invites you to a workshop',[['Join the workshop',-24,5],['Browse the studio',0,3],['Continue with your itinerary',0,0]]],
 ['Your bag arrives at the wrong lodging',[['Ask staff to trace it',0,1],['Buy a few essentials',-95,2],['Wait for the next delivery',0,-2]]],
 ['Other travelers invite you to a shared dinner',[['Join them for dinner',-34,5],['Meet them for a free walking tour',0,3],['Take the evening to rest',0,2]]],
 ['A transit delay leaves time to explore nearby',[['Explore the neighborhood',-12,3],['Wait at the station',0,0],['Take a later service and enjoy a café',-20,2]]]
];
const GEN_SOUVENIRS={
 France:[['Provence lavender sachet',16],['Ceramic market bowl',42]],Japan:[['Furoshiki wrapping cloth',22],['Hand-painted tea cup',55]],
 Canada:[['Maple candy tin',18],['Carved cedar keepsake',48]],Mexico:[['Woven table runner',24],['Talavera-style ceramic tile',42]],
 'United Kingdom':[['Museum print',24],['Local pottery mug',36]],Italy:[['Marbled notebook',22],['Handmade glass bead ornament',46]],
 India:[['Block-printed cotton scarf',28],['Small brass keepsake',44]],Australia:[['Wildlife field guide',22],['Local landscape print',35]]
};
const GEN_LOTS={
 neighborhood:['Neighborhood building lot',85000,600],waterfront:['Waterfront lot',220000,1250],
 country:['Rural acreage',68000,4000],urban:['City infill lot',150000,400]
};
const GEN_PLANS={
 cottage:['Two-bedroom cottage',185000,2,1],family:['Family home',290000,4,2],accessible:['Accessible single-storey home',230000,3,1],
 modern:['Modern villa',540000,5,2],custom:['Custom design',0,0,0]
};
const GEN_ISLANDS={
 seagrass:['Seagrass Cay',12000000,52],heron:['Heron Island',29000000,90],glass:['Glasswater Isle',64000000,150]
};
const GEN_NATIONS={
 pelican:['Pelican Commonwealth',38000000000,'Seaweed and fishery products',64000],
 meridian:['Meridian Isles',195000000000,'Renewable electricity and specialty crops',210000],
 solana:['Solana Federation',1100000000000,'Marine technology and wind energy',520000]
};
const GEN_DEVELOP={dock:['Dock and utilities',1250000,0],trails:['Trails and habitat protection',640000,0],
 lodge:['Eco-lodge',4600000,750000],solar:['Solar microgrid',2900000,270000]};
const GEN_NATION_PROJECTS={schools:['Build schools and clinics',250000000,8,2],port:['Improve ports and processing',420000000,3,8],
 water:['Restore water and energy systems',310000000,6,5],habitat:['Protect fisheries and coastline',195000000,5,4]};
function genTravelAvailable(){
 return g.age>=16&&g.alive&&!g.jail&&!justiceAtLarge()&&g.lic.includes('Passport')&&g.vac!==g.age&&!genState().trip;
}
function genTripStart(country,style,weeks,companions,city){
 const s=genState(),c=g.w[country],mode=VCL[style];
 if(!genTravelAvailable()||country===g.country||!c||!mode||![1,2,3].includes(weeks)||companions.length>2||
  new Set(companions).size!==companions.length||companions.some(id=>!genFind(id)?.alive||genFind(id).bond<35))return 'The itinerary or travel documents are unavailable.';
 const cost=pr((500+c.n.E*18)*mode[1]*(1+companions.length*.65)+weeks*260);
 if(g.cash<cost)return 'You need '+loc(cost)+' for this itinerary.';
 g.cash-=cost;LD('Vacation booking',-cost);g.vac=g.age;
 const cities=(CITY[country]||'Capital city').split('|');
 if(!cities.includes(city))city=cities[genRoll(g,'destination',cities.length)];
 s.trip={country,city,style,stops:weeks,cost,companions,age:g.age,
  activities:[],souvenirs:[],pending:null};
 L('You arrived in '+uiEscape(s.trip.city)+', '+uiEscape(country)+'.');
 return '';
}
function genTripActivity(key){
 const s=genState(),t=s.trip,a=GEN_TRAVEL[key];
 if(!t||!a||t.pending||t.activities.length>=t.stops)return 'This activity does not fit the remaining itinerary.';
 const cost=pr(a[1]*(1+t.companions.length*.65));
 if(g.cash<cost)return 'Available cash cannot pay for this outing.';
 g.cash-=cost;LD('Vacation activities',-cost);t.cost+=cost;
 t.activities.push(a[0]);g.happy=cl(g.happy+a[2]);
 for(const id of t.companions){
  const r=genFind(id);
  if(r?.alive){r.bond=cl(r.bond+4);genContact(r,4);relationshipMemory(r,a[0]+' in '+t.country+' together.');}
 }
 L('Vacation in '+uiEscape(t.city)+' · '+a[0]+'.');
 const n=genRoll(g,'travel '+t.activities.length+' '+key,GEN_TRAVEL_EVENTS.length+2);
 const incident=GEN_TRAVEL_EVENTS[n];
 if(incident){
  const item=genEvent('travel',incident[0],t.city+' · '+a[0]+'.',{options:genClone(incident[1])});
  t.pending=item.id;
 }
 return '';
}
function genTripSouvenirs(t){
 return GEN_SOUVENIRS[t.country]||[['Locally made ceramic cup',30],['Illustrated city guide',18],['Woven market bag',35]];
}
function genTripBuy(index){
 const t=genState().trip,x=t&&genTripSouvenirs(t)[index];
 if(!x||t.pending||t.souvenirs.includes(index))return 'That souvenir is unavailable for this trip.';
 const cost=pr(x[1]),tax=finSalesTax('other',cost,t.country);
 if(g.cash<cost+tax)return 'You need '+loc(cost+tax)+' including purchase tax.';
 g.cash-=cost+tax;t.cost+=cost+tax;LD('Vacation souvenirs',-cost);finSalesPaid(tax);
 const id=uid();t.souvenirs.push(index);
 g.lux.push({id,n:x[0]+' · '+t.country,v:cost,souvenir:true,origin:t.country,age:0});
 return '';
}
function genTripFinish(){
 const s=genState(),t=s.trip;
 if(!t||t.pending)return 'Finish the current vacation decision first.';
 s.trips.unshift(genClone(t));s.trips=s.trips.slice(0,20);s.trip=null;
 L('You returned from '+uiEscape(t.country)+' with '+t.souvenirs.length+' souvenir'+(t.souvenirs.length===1?'':'s')+'.');
 return '';
}
function genBuyLot(key){
 const lot=GEN_LOTS[key],s=genState();
 if(!lot||g.age<18||g.jail||s.land.length>=20)return 'Land purchase is unavailable.';
 const cost=pr(lot[1]),tax=finSalesTax('home',cost);
 if(g.cash<cost+tax)return 'Available cash cannot cover the lot and transfer tax.';
 g.cash-=cost+tax;LD('Land purchase',-cost);finSalesPaid(tax);
 s.land.push({id:uid(),key,name:lot[0],country:g.country,city:g.city,cost,area:lot[2],build:null});
 return '';
}
function genBuildHome(id,plan,name,rooms,area){
 const lot=genState().land.find(x=>x.id===id),def=GEN_PLANS[plan];
 if(!lot||lot.build||!def||g.age<18||g.jail||typeof name!=='string'||!name.trim()||name.length>54||/[<>]/.test(name))return 'Choose a lot and a valid home name.';
 const custom=plan==='custom';
 if(custom&&(!Number.isInteger(rooms)||rooms<1||rooms>12||!Number.isInteger(area)||area<35||area>Math.min(lot.area*.8,900)))return 'A custom build needs 1–12 bedrooms and a floor area that fits the lot.';
 const quote=custom?pr(53000+rooms*18500+area*1050):pr(def[1]);
 const tax=finSalesTax('home',quote);
 if(g.cash<quote+tax)return 'You need '+loc(quote+tax)+' to cover construction and tax.';
 g.cash-=quote+tax;LD('Home construction',-quote);finSalesPaid(tax);
 lot.build={plan,name:name.trim(),rooms:custom?rooms:def[2],area:custom?area:null,paid:quote,due:g.age+(custom&&area>240?2:custom?1:def[3])};
 return '';
}
function genLandYear(s){
 for(const lot of s.land.slice()){
  const b=lot.build;
  if(!b||b.due>g.age)continue;
  const home={id:lot.id,n:b.name,type:GEN_PLANS[b.plan][0],own:true,v:lot.cost+b.paid,purchasePrice:lot.cost+b.paid,
   beds:b.rooms,condition:100,cleanliness:100,country:lot.country,city:lot.city,customArea:b.area,age:0};
  if(!g.home&&g.age>=18)g.home=home;else g.xh.push(home);
  g.ins.home=1;
  s.land=s.land.filter(x=>x!==lot);
  L('Construction finished on '+uiEscape(home.n)+'. It is in your property inventory.');
  genEvent('update',home.n+' is ready','The deed and completed house were added to your property inventory.',{},b.paid>=pr(475000)?'property':null);
 }
}
function genBuyIsland(key,nation=false){
 const defs=nation?GEN_NATIONS:GEN_ISLANDS,def=defs[key],s=genState(),list=nation?s.nations:s.islands;
 if(!def||g.age<18||g.jail||list.some(x=>x.key===key))return 'This acquisition is unavailable.';
 const value=def[1],tax=finSalesTax('home',value);
 if(g.cash<value+tax)return 'Available cash cannot cover the acquisition and transfer tax.';
 g.cash-=value+tax;LD(nation?'Island stewardship acquisition':'Private island purchase',-value);finSalesPaid(tax);
 const x={id:uid(),key,name:def[0],value,projects:[],age:g.age,condition:84,used:{},profit:0};
 if(nation)Object.assign(x,{population:def[3],resource:def[2],output:6,stock:0,wellbeing:55,economy:54,funds:Math.round(value*.06)});
 list.push(x);
 genEvent('island',def[0]+(nation?' ratifies a stewardship agreement':' changes ownership'),
  nation?'A fictional island nation approved a paid development and resource mandate. Its residents retain civil government.':
  'The acquisition includes environmental and development commitments.',{asset:x.id},nation?'international':'property');
 return '';
}
function genIslandAsset(id){
 const s=genState();
 return s.islands.find(x=>x.id===id)||s.nations.find(x=>x.id===id);
}
function genIslandDevelop(id,key){
 const x=genIslandAsset(id),nation=!!x?.population,def=(nation?GEN_NATION_PROJECTS:GEN_DEVELOP)[key];
 if(!x||!def||x.projects.some(p=>p.key===key)||g.age<18||g.jail)return 'This development is unavailable.';
 if(nation){
  if(x.funds<def[1])return 'The island government cannot cover the project.';
  x.funds-=def[1];
 }else{
  if(g.cash<def[1])return 'Personal cash cannot cover the project.';
  g.cash-=def[1];LD('Private island development',-def[1]);
 }
 x.projects.push({key,due:g.age+1,complete:false});
 return '';
}
function genIslandTrade(id,partner){
 const x=genIslandAsset(id);
 if(!x?.population||!g.w[partner]||x.stock<2||x.used.trade===g.age||x.wellbeing<20||g.jail)return 'You need two units, local approval, and an unused trade allotment.';
 const amount=Math.round(x.value*.003);
 x.stock-=2;x.funds+=Math.round(amount*.92);x.economy=cl(x.economy+2);
 const royalty=Math.round(amount*.08);g.cash+=royalty;LD('Island stewardship profit',royalty);
 x.used.trade=g.age;
 genEvent('update','A resource deal is signed',x.name+' agreed to sell '+x.resource.toLowerCase()+' to '+partner+'.',{},'international');
 return '';
}
function genIslandResolve(event,index){
 const a=genIslandAsset(event.asset);
 if(!a)return 'That property is no longer available.';
 const nation=!!a.population;
 const cost=index===0?Math.round(a.value*(nation?.001:.002)):0;
 if(cost>(nation?a.funds:g.cash))return 'Funds cannot cover that response.';
 if(nation){
  a.funds-=cost;a.wellbeing=cl(a.wellbeing+[8,4,-6][index]);
 }else{
  g.cash-=cost;if(cost)LD('Island upkeep response',-cost);
  a.condition=cl(a.condition+[10,4,-7][index]);
 }
 return '';
}
function genIslandYear(s){
 for(const a of [...s.islands,...s.nations]){
  const nation=!!a.population;
  for(const p of a.projects.filter(x=>!x.complete&&x.due<=g.age)){
   const d=(nation?GEN_NATION_PROJECTS:GEN_DEVELOP)[p.key];
   p.complete=true;
   if(nation){a.wellbeing=cl(a.wellbeing+d[2]);a.output+=d[3];a.economy=cl(a.economy+3);}
   else a.condition=cl(a.condition+5);
   L(uiEscape(a.name)+' completed '+d[0].toLowerCase()+'.');
   if(nation)genEvent('update',a.name+' completes a public project',d[0]+' is now serving residents.',{},'international');
  }
  if(nation){
   a.stock=Math.min(120,a.stock+a.output);a.funds+=Math.round(a.value*.0018*(a.economy/100));
   a.wellbeing=cl(a.wellbeing+(a.projects.some(x=>x.complete)?1:-2));
  }else{
   a.profit=Math.round(a.projects.filter(p=>p.complete).reduce((n,p)=>n+GEN_DEVELOP[p.key][2],0)*a.condition/100-a.value*.002);
   g.cash+=a.profit;if(a.profit)LD('Private island profit',a.profit);
   a.condition=cl(a.condition-2);
  }
  if(genRoll(g,'event-'+a.id)<22&&!s.events.some(e=>e.kind==='island'&&e.asset===a.id&&!e.closed)){
   const storm=genRoll(g,'weather-'+a.id)<50;
   if(nation)a.economy=cl(a.economy-(storm?4:1));
   else a.condition=cl(a.condition-(storm?8:4));
   genEvent('island',storm?'Heavy weather affects '+a.name:a.name+' reviews development impacts',
    storm?'Residents and property managers asked for a recovery decision.':'A local review raised concerns about costs and habitat protection.',
    {asset:a.id},nation?'international':'property');
  }
 }
}
