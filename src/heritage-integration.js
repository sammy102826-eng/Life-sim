const heritageOldWork=workV;
workV=function(){
 if(g.jail)return heritageOldWork();
 if(wsel==='archaeology'||wsel==='job'&&heritageJob())return heritageWorkView();
 const html=heritageOldWork();
 if(!wsel&&wsub==='Special')return B('Archaeologist <small>Survey, excavate, and study the past</small>','heritageOpen()')+html;
 return html;
};
const heritageOldStuff=stuffTop;
stuffTop=function(){
 if(!g.jail&&!stuffSelected&&!stuffPurchaseOffer){
  const page=NV.S[0];
  if(page==='Mall')return eraMallView();
  if(page==='Museum')return heritageMuseumView();
  if(page==='Customize')return heritageHomeView();
  if(page==='Artifacts')return B('Back to Stuff',"mainTabOpen('Stuff')")+studioSection('Personal artifacts',
   (g.heritage?.artifacts||[]).filter(a=>a.place==='private').map(a=>heritageArtifactView(a,'private')).join('')||'<p>No artifacts in your personal inventory.</p>');
  if(!page)return B('The Mall <small>Cars, property, jewelry, and era-appropriate technology</small>',"heritageStuff('Mall')")+
   B(g.heritage?.museum?'Manage your museum':'Open your own museum',"heritageStuff('Museum')")+
   B('Personal artifact inventory',"heritageStuff('Artifacts')")+heritageOldStuff();
 }
 return heritageOldStuff();
};
const heritageOldDetail=stuffItemDetail;
stuffItemDetail=function(kind,id){
 const html=heritageOldDetail(kind,id),home=kind==='housing'?g.home:kind==='home'?stuffAsset('home',id):null;
 return html+(home?studioSection('Parking and displays','<p>'+parkingSpaces(home)+' spaces · '+uiEscape(home.decor||'Original')+
  ' interior · '+homeItems(home).length+' items on display</p>'+
  B('Customize home',heritageCall('heritageStuff','Customize',home.id),g.age<16||home!==g.home&&(home.rented||home.tenancy?.status!=='vacant'))):'');
};
const eraOldShop=stuffShopView;
stuffShopView=function(){
 if(stuffShopTab==='Cars'&&eraYear()<2020)return eraCarShop('');
 // Preserve the existing current-era catalog, illustrations, and purchase controls.
 const html=eraOldShop();
 if(stuffShopTab!=='Cars')return html;
 const box=document.createElement('div');box.innerHTML=html;
 for(const button of box.querySelectorAll('button[onclick^="stuffBuyCar("]')){
  const index=Number(button.getAttribute('onclick').match(/\d+/)?.[0]);
  if(!eraCarAvailable(STUFF_CARS[index]))button.closest('details,.card')?.remove();
  else if(!parkingRoom())button.disabled=true;
 }
 return '<p class="d">'+parkingMessage()+'</p>'+box.innerHTML;
};
const parkingOldQuote=stuffStartPurchase;
stuffStartPurchase=function(kind,index){
 if(kind==='car'&&!eraCarAvailable(STUFF_CARS[index]))return toast('This model has not been released yet.');
 if(kind==='car'&&!parkingRoom())return toast('Add parking or sell a car before purchasing another vehicle.');
 return parkingOldQuote(kind,index);
};
const parkingOldPurchase=stuffCompletePurchase;
stuffCompletePurchase=function(method){
 if(stuffPurchaseOffer?.kind==='car'&&(!parkingRoom()||!eraCarAvailable(STUFF_CARS[stuffPurchaseOffer.i])))
  return toast('This vehicle needs an available parking space and a valid model year.');
 return parkingOldPurchase(method);
};
const parkingOldBuy=buyCar;
buyCar=function(index){
 if(!parkingRoom()||!eraCarAvailable(STUFF_CARS[index]))return toast('A parking space and an available model are required.');
 return parkingOldBuy(index);
};
const heritageOldRemove=stuffRemove;
stuffRemove=function(kind,id){
 const removed=heritageOldRemove(kind,id);
 if(removed&&kind==='home'){
  for(const {kind,item} of homeItems(removed))item[kind==='lux'?'showHome':'display']=null;
 }
 return removed;
};
const heritageOldHousingIncident=housingResolveIncident;
housingResolveIncident=function(payload){
 const incident=g.housing?.incidents.find(x=>x.id===payload.id),open=incident&&!incident.resolved;
 const result=heritageOldHousingIncident(payload);
 if(open&&incident.resolved&&incident.type==='Break-in')homeDisplayTheft(incident.homes,payload.repair);
 return result;
};
const heritageOldStuffIncident=stuffApplyIncident;
stuffApplyIncident=function(payload){
 const result=heritageOldStuffIncident(payload);
 if(payload?.kind==='home'&&['home-security','property-take'].includes(payload.action))homeDisplayTheft([payload.id],payload.action==='home-security');
 return result;
};
const heritageOldNW=nw;
nw=function(){
 const s=g.heritage;
 const items=(s?.artifacts||[]).filter(x=>['private','museum'].includes(x.place));
 return heritageOldNW()+(s?.museum?museumWorth(s.museum):0)+items.reduce((n,x)=>n+x.value,0);
};
const heritageOldBuild=buildSum;
buildSum=function(){heritageYear();return heritageOldBuild();};
const heritageOldPrisonLedger=prisonLedger;
prisonLedger=function(s){heritageYear();return heritageOldPrisonLedger(s);};
const heritageOldAge=ageUp;
ageUp=function(){
 if(g&&!Object.hasOwn(g,'birthYear'))g.birthYear=eraYear()-g.age;
 const before=g?.age,result=heritageOldAge();
 if(g?.alive&&g.age>before&&!g.jail){
  const year=eraYear(),items=ERA_TECH.filter(x=>x[0]===year);
  if(ERA_STARTS.includes(year))
   newsPublish('business','A new decade begins',eraLabel(year)+' technology begins arriving in the Mall.',null,'era-'+year);
  if(items.length)
   newsPublish('business','New technology arrives in stores',items.map(x=>x[1]).join(' and ')+' now in the Mall technology department.',null,'tech-'+year);
 }
 return result;
};
const heritageOldEffect=E;
E=function(x){
 const result=heritageOldEffect(x),pending=x?.heritageEvent;
 if(pending&&g.heritage){
  const s=g.heritage,e=s.events.find(e=>e.id===pending.id);
  const decision=heritageRespond(s,e,pending.choice);
  newsBriefReceipt=decision.text;
 }
 return result;
};
const heritageOldDrain=stuffDrainEvents;
stuffDrainEvents=function(){
 if(g?.stuffEventQueue?.length){
  g.stuffEventQueue=g.stuffEventQueue.filter(q=>{
   const id=q.c?.[0]?.[1]?.heritageEvent?.id;
   return id==null||heritageEventReady(g.heritage,g.heritage?.events.find(e=>e.id===id));
  });
 }
 return heritageOldDrain();
};
function heritageNewsEvent(article){
 return g.heritage?.events.find(e=>e.id===article.brief?.ref&&e.article===article.id);
}
function heritageNewsOptions(article){
 const e=heritageNewsEvent(article);
 return e?HERITAGE_EVENTS[e.key][2].map(([label,base],i)=>[label+(base?' · '+loc(pr(base)):''),'brief'+i]):[];
}
function heritageEstateItems(life){
 const s=life.heritage;
 if(!s)return [];
 const pieces=s.artifacts.filter(x=>x.place==='private').map(value=>({category:'keepsakes',key:'artifact',ref:'artifact-'+value.id,
  value,worth:value.value}));
 if(s.museum)pieces.push({category:'business',key:'museum',ref:'museum',
  value:{...s.museum,collection:museumItems(s)},worth:museumWorth(s.museum)+museumItems(s).reduce((n,x)=>n+x.value,0)});
 return pieces;
}
function heritageInherit(life,key,value,worth){
 const s=heritageState(life);
 if(key==='museum'){
  if(s.museum){life.cash+=Math.max(0,worth);return;}
  const {collection,...m}=value;
  s.museum={...m,trips:0,last:null,used:{},outreach:0,exhibit:0,quiet:0};
  for(const item of collection)s.artifacts.push({...item,id:++s.serial,site:null,cleanAge:null});
 }else s.artifacts.push({...value,id:++s.serial,site:null,display:null});
}
