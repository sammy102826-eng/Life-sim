let genPropertyPage='catalog',genSelected=null,genDestination=null,genDialog=null;
const genSection=(title,html)=>studioSection(title,html);
const genSelect=(id,label,rows)=>studioSelect('gen-'+id,label,rows);
const genVal=id=>document.getElementById('gen-'+id)?.value;
const genCmd=(label,action,arg='',i=0,disabled=false)=>B(label,`genAction('${action}','${arg}',${i})`,disabled);
const genField=(id,label,value,min,max)=>`<label for="gen-${id}">${label}</label><input class="txt" type="number" id="gen-${id}" step="1" min="${min}" max="${max}" value="${value}">`;
function genWillView(){
 const s=genState(),written=s.will,plan=genCurrentWill(g),eligible=genEligible(g);
 const people=[...eligible.map(r=>[r.id,r.n+' · '+r.role]),['charity','Charity']];
 const recipients=[['primary','Default beneficiary'],...people];
 return genSection('Will and funeral','<p>Cash remaining after debts, taxes and funeral costs is divided by the percentages below. You can assign each property group to a different beneficiary.</p>'+
  people.map(([id,label])=>genField('share-'+id,uiEscape(label)+' · cash share (%)',plan.weights[id]||0,0,100)).join('')+
  genSelect('preferred','Preferred child successor',[['none','No preference'],...genChild(g).map(r=>[r.id,r.n,r.id===plan.preferred])])+
  Object.entries(GEN_CATEGORIES).map(([key,label])=>genSelect('gift-'+key,label,recipients.map(([id,text])=>[id,text,(plan.property[key]||'primary')===id]))).join('')+
  genSelect('funeral','Funeral preference',Object.entries(GEN_FUNERALS).map(([key,[label,price]])=>[key,label+' · '+loc(pr(price)),key===plan.funeral]))+
  genCmd('Save will','will','',0,g.age<18)+
  (written?genCmd('Restore default inheritance','will-reset','',0,g.age<18):'')+
  (g.age<18?'<p>You can write a will starting at age 18.</p>':'')+
  (s.archive.length?genSection('Family legacy',s.archive.map(x=>'<p>'+uiEscape(x.name)+' · Age '+x.age+' · '+uiEscape(x.funeral)+'</p>').join('')):''));
}
function genSaveWill(){
 if(g.age<18||g.jail)return 'Will changes are unavailable.';
 const ids=[...genEligible(g).map(r=>r.id),'charity'],weights={};
 for(const id of ids){
  const value=Number(genVal('share-'+id));
  if(!Number.isSafeInteger(value)||value<0||value>100)return 'Enter a whole percentage for each beneficiary.';
  if(value)weights[id]=value;
 }
 if(Object.values(weights).reduce((n,x)=>n+x,0)!==100)return 'Cash shares must add up to 100%.';
 const property={};
 for(const category of Object.keys(GEN_CATEGORIES)){
  const id=genVal('gift-'+category);
  if(ids.includes(id))property[category]=id;
  else if(id!=='primary')return 'Select an eligible beneficiary.';
 }
 const funeral=genVal('funeral'),preferred=genVal('preferred');
 if(!Object.hasOwn(GEN_FUNERALS,funeral)||preferred!=='none'&&!genChild(g).some(x=>x.id===preferred))return 'Choose an eligible successor and funeral.';
 genState().will={weights,property,funeral,preferred:preferred==='none'?null:preferred};
 L('You recorded your will and funeral preferences.');
 return '';
}
function genEstateView(plan){
 return genSection('Estate settlement',`<p>Funeral preference · ${uiEscape(plan.funeral)} · ${loc(plan.fee)}</p>
 <p>Gross estate ${loc(plan.gross)} · Debts ${loc(plan.debt)} · Estate tax ${loc(plan.tax)}.</p>`+
 plan.summary.map(x=>`<p><b>${uiEscape(x.name)}</b> · ${loc(x.cash)} cash${x.assets?' · '+x.assets+' asset'+(x.assets===1?'':'s')+' with '+loc(x.value)+' equity':''}</p>`).join('')+
 (plan.sold.length?'<p>Sold to settle obligations · '+plan.sold.map(uiEscape).join(', ')+'</p>':'')+
 (plan.shortfall?'<p>Unfunded estate obligations · '+loc(plan.shortfall)+'</p>':''));
}
function genHeirView(){
 const s=genState(),plan=genFinalEstate(),preferred=genCurrentWill(g).preferred;
 const children=genChild(g).slice().sort((a,b)=>Number(b.id===preferred)-Number(a.id===preferred));
 return '<h1>Continue the family</h1><p>Choose a child and take over their existing life. The estate follows your will.</p>'+
  children.map(r=>{
   const p=genProfile(r),share=plan.summary.find(x=>x.id===r.id);
   return genCmd(uiEscape(r.n)+' · Age '+r.age+'<small>'+uiEscape(p.job?.t||'(no current job)')+' · Own savings '+loc(p.savings)+
    ' · Estate cash '+loc(share?.cash||0)+(r.id===preferred?' · Preferred successor':'')+'</small>','continue',r.id);
  }).join('')+genEstateView(plan)+B('Back',"go('death')");
}
function genTravelView(){
 const s=genState(),t=s.trip;
 if(t){
  const people=t.companions.map(id=>genFind(id)?.n).filter(Boolean);
  return genSection(t.city+', '+t.country,`<p>${people.length?'Traveling with '+people.map(uiEscape).join(', '):'Traveling alone'} · ${t.activities.length}/${t.stops} outings · Trip spending ${loc(t.cost)}.</p>`+
   Object.entries(GEN_TRAVEL).map(([key,[label,price]])=>genCmd(label+' · '+loc(pr(price*(1+t.companions.length*.65))),
     'outing',key,0,t.activities.length>=t.stops||!!t.pending)).join('')+
   t.activities.map(x=>'<p>Visited · '+uiEscape(x)+'</p>').join('')+
   genSection('Souvenirs',genTripSouvenirs(t).map(([label,price],i)=>genCmd('Buy '+label+' · '+loc(pr(price))+' plus tax',
    'souvenir','',i,!!t.pending||t.souvenirs.includes(i))).join(''))+
   genCmd('Return home','trip-finish','',0,!!t.pending));
 }
 const countries=Object.keys(g.w).filter(k=>k!==g.country),country=countries.includes(genDestination)?genDestination:countries[0];
 genDestination=country;
 const select=`<label for="gen-country">Country</label><select id="gen-country" onchange="genDestination=this.value;draw(1)">${countries.map(c=>`<option value="${uiEscape(c)}"${c===country?' selected':''}>${uiEscape(c)}</option>`).join('')}</select>`;
 return genSection('Plan a vacation',(!g.lic.includes('Passport')?'<p>A passport is required. Buy one in Stuff → Licenses.</p>':'')+
  select+genSelect('city','Destination city',(CITY[country]||'Capital city').split('|').map(c=>[c,c]))+
  genSelect('cabin','Travel class',VCL.map(([c],i)=>[i,c]))+
  genSelect('weeks','Time away',[[1,'One week'],[2,'Two weeks'],[3,'Three weeks']])+
  '<p>Select up to two companions.</p>'+g.rel.filter(r=>r.alive&&r.age>=3&&r.role!=='Pet'&&r.bond>=35&&!['estranged','former'].includes(r.connection?.status)).map(r=>
   `<label><input type="checkbox" name="gen-companion" value="${r.id}"> ${uiEscape(r.n)}</label>`).join('')+
   genCmd('Book vacation','book','',0,!genTravelAvailable()))+
   (s.trips.length?genSection('Past trips',s.trips.map(x=>'<p>'+uiEscape(x.city+', '+x.country)+' · Age '+x.age+' · '+loc(x.cost)+'</p>').join('')):'');
}
function genPropertyOpen(page='catalog',id=null){
 if(page==='index'){
  const s=genState();
  for(const old of g.lux.filter(x=>x.n==='Private island')){
   s.islands.push({id:old.id||uid(),key:'legacy',name:old.n,value:old.v,projects:[],age:g.age,condition:82,used:{},profit:0});
   g.lux=g.lux.filter(x=>x!==old);
  }
 }
 genPropertyPage=page;genSelected=id;
 tab='Stuff';stuffSelected=null;stuffPurchaseOffer=null;stuffShopTab='Property';
 draw(1);
}
function genPropertyView(){
 const s=genState(),page=genPropertyPage,back=genCmd('Back to land and islands','property','index');
 if(page==='land'){
  const lot=s.land.find(x=>x.id===genSelected);
  if(!lot)return back;
  if(lot.build)return back+genSection(lot.name,'<p>Construction of '+uiEscape(lot.build.name)+' is due at age '+lot.build.due+'.</p>');
  return back+genSection(lot.name,'<p>'+lot.area+' m² · '+uiEscape(lot.city||lot.country)+'</p>'+
   '<label for="gen-home-name">Home name</label><input class="txt" id="gen-home-name" maxlength="54" value="New home">'+
   genSelect('plan','Building plan',Object.entries(GEN_PLANS).map(([key,[label,price]])=>[key,label+(price?' · '+loc(pr(price)):'')]))+
   '<p>For a custom design, specify bedrooms and floor area. Construction and taxes are charged when work begins.</p>'+
   genField('rooms','Custom bedrooms',3,1,12)+genField('area','Custom floor area in m²',145,35,900)+genCmd('Begin construction','build',lot.id));
 }
 if(page==='island'){
  const x=genIslandAsset(genSelected);
  if(!x)return back;
  const nation=!!x.population,defs=nation?GEN_NATION_PROJECTS:GEN_DEVELOP;
  return back+genSection(x.name,nation?`<p>Population ${x.population.toLocaleString()} · Wellbeing ${x.wellbeing}/100 · Economy ${x.economy}/100</p>
   <p>Public funds ${loc(x.funds)} · Output ${x.output}/yr · Stock ${x.stock} · ${uiEscape(x.resource)}</p>`:
   `<p>Condition ${x.condition}/100 · Latest operating result ${loc(x.profit)} · Value ${loc(x.value)}</p>`)+
   genSection('Developments',Object.entries(defs).map(([key,[label,cost]])=>{
    const p=x.projects.find(p=>p.key===key);
    return genCmd(label+' · '+(p?(p.complete?'Completed':'In progress'):loc(cost)),'develop',key,0,!!p);
   }).join(''))+
   (nation?genSection('Resource trade',genSelect('buyer','Trading partner',Object.keys(g.w).map(c=>[c,c]))+
   genCmd('Sell two resource units','island-trade',x.id,0,x.stock<2||x.used.trade===g.age)):'');
 }
 return genCmd('Back to Property','property','catalog')+
  genSection('Building lots',s.land.map(x=>genCmd(uiEscape(x.name)+' · '+(x.build?'Under construction':x.area+' m²'),'lot-open',x.id)).join('')+
   Object.entries(GEN_LOTS).map(([key,[label,cost,area]])=>genCmd('Buy '+label+' · '+area+' m² · '+loc(pr(cost))+' plus tax','lot-buy',key,0,g.age<18||g.cash<pr(cost))).join(''))+
  genSection('Private islands',s.islands.map(x=>genCmd(uiEscape(x.name),'island-open',x.id)).join('')+
   Object.entries(GEN_ISLANDS).map(([key,[label,value]])=>genCmd('Buy '+label+' · '+loc(value)+' plus tax','island-buy',key,0,g.age<18||g.cash<value||s.islands.some(x=>x.key===key))).join(''))+
  genSection('Island nations','<p>Fictional nations can lease a development and resource mandate. Residents retain their civil government, and public funds stay separate.</p>'+
   s.nations.map(x=>genCmd(uiEscape(x.name),'island-open',x.id)).join('')+
   Object.entries(GEN_NATIONS).map(([key,[label,value]])=>genCmd('Acquire stewardship of '+label+' · '+loc(value)+' plus tax',
    'nation-buy',key,0,g.age<18||g.cash<value||s.nations.some(x=>x.key===key))).join(''));
}
function genFamilyView(){
 const s=genState(),f=genFamilyInit();
 const pending=s.events.filter(e=>!e.closed);
 return genSection('Family and life decisions',
  '<p>Generation '+s.number+' · '+({together:'Parents together',single:'One known parent',separated:'Parents separated',blended:'Blended family'}[f.status]||'')+'</p>'+
  pending.map(e=>genCmd(uiEscape(e.title),'review','',e.id)).join('')+
  (!pending.length?'<p>No decisions are waiting.</p>':'')+
  (s.archive.length?genSection('Earlier generations',s.archive.map(a=>'<p>'+uiEscape(a.name)+' · Died at age '+a.age+'</p>').join('')):''));
}
function genAction(action,arg,index){
 if(action==='continue')return genContinue(arg);
 if(g.jail||!g.alive||publicityBusy()||g.justice?.pending)return;
 const s=genState();
 let error='';
 if(action==='will')error=genSaveWill();
 else if(action==='will-reset'&&g.age>=18)s.will=null;
 else if(action==='book')error=genTripStart(genVal('country'),Number(genVal('cabin')),Number(genVal('weeks')),
  [...document.querySelectorAll('[name=gen-companion]:checked')].map(x=>x.value),genVal('city'));
 else if(action==='outing')error=genTripActivity(arg);
 else if(action==='souvenir')error=genTripBuy(index);
 else if(action==='trip-finish')error=genTripFinish();
 else if(action==='property')return genPropertyOpen(arg);
 else if(action==='lot-buy')error=genBuyLot(arg);
 else if(action==='lot-open')return genPropertyOpen('land',arg);
 else if(action==='build')error=genBuildHome(arg,genVal('plan'),genVal('home-name'),Number(genVal('rooms')),Number(genVal('area')));
 else if(action==='island-buy')error=genBuyIsland(arg);
 else if(action==='nation-buy')error=genBuyIsland(arg,true);
 else if(action==='island-open')return genPropertyOpen('island',arg);
 else if(action==='develop')error=genIslandDevelop(genSelected,arg);
 else if(action==='island-trade')error=genIslandTrade(arg,genVal('buyer'));
 else if(action==='review'){
  const e=s.events.find(x=>x.id===index&&!x.closed);
  if(e){e.seen=true;genDialog=e.id;draw(1);}
  return;
 }else return;
 if(error)return toast(error);
 draw(1);
}
function genReply(i){
 const e=genState().events.find(x=>x.id===genDialog&&!x.closed);
 if(!e||publicityBusy())return;
 const result=genRespond(e,i);
 if(!result.done)return toast(result.text);
 genDialog=null;
 g.result={t:'Life decision',d:uiEscape(result.text)};
 draw(1);
}
function genReadStory(id){genDialog=null;newsOpenBrief(id);}
function genModal(s){
 const trip=s.events.find(x=>x.id===s.trip?.pending&&!x.closed);
 const open=s.events.find(x=>x.id===genDialog&&!x.closed)||trip;
 if(open)return lawModal(open.title,'<p>'+uiEscape(open.text)+'</p>',genChoices(open).map((x,i)=>
  B(uiEscape(x),`genReply(${i})`)).join('')+
  (open.story?B('Read in the Newspaper',`genReadStory('${open.story}')`):'')+
  (!trip?B('Decide later','genDialog=null;draw(1)'):''));
 const item=s.events.find(x=>x.age===g.age&&!x.closed&&!x.seen);
 if(!item)return '';
 return lawModal(item.title,'<p>'+uiEscape(item.text)+'</p>',genCmd('Review decision','review','',item.id)+
  B('Decide later',`genState().events.find(e=>e.id===${item.id}).seen=true;draw(1)`));
}
