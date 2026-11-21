const civicPriorWork=workV;
workV=function(){
 if(g.jail)return civicPriorWork();
 const o=civicCurrent();
 if(wsel==='civic-races')return civicRaceView();
 if(o&&(wsel==='civics'||wsel==='office'))return civicOfficeView(o);
 const html=civicPriorWork();
 if(!wsel&&wsub==='Special')return B(g.civics?.campaign?'Continue campaign':'Run for Office','civicOpenRaces()')+html;
 if(!wsel&&!wsub&&(o||g.civics?.campaign)){
  const root=document.createElement('div');root.innerHTML=html;
  if(o){
   const prior=root.querySelector('[onclick="wsel=\'office\';draw(1)"]');
   const control=B(uiEscape(o.name)+' <small>Approval '+g.approval+'/100</small>','civicGo()');
   if(prior){prior.insertAdjacentHTML('beforebegin',control);prior.remove();}
   else root.insertAdjacentHTML('afterbegin',control);
  }
  if(g.civics?.campaign)root.insertAdjacentHTML('afterbegin',B('Continue campaign','civicOpenRaces()'));
  return root.innerHTML;
 }
 return html;
};
let civicUiLife=null;
const civicPriorGame=gameView;
gameView=function(){
 if(civicUiLife!==g){civicUiLife=g;civicPage='overview';civicDialog=null;}
 const html=civicPriorGame(),s=g.civics;
 if(!s||g.jail||g.justice?.pending||!civicDialog&&!s.events.some(e=>e.age===g.age&&!e.seen&&civicEventAvailable(e)))return html;
 const root=document.createElement('div');root.innerHTML=html;
 if(!root.querySelector('.mo')){
  const modal=civicModal(s);
  if(modal)root.querySelector('.game')?.insertAdjacentHTML('beforeend',modal);
 }
 return root.innerHTML;
};
const civicPriorAge=ageUp;
ageUp=function(){
 if(civicDialog&&!g.jail)return toast('Finish the current political decision before aging up.');
 if(g?.civics?.campaign&&!g.jail)return toast('Finish or withdraw from the campaign before aging up.');
 return civicPriorAge();
};
const civicPriorSummary=buildSum;
buildSum=function(){civicYear();return civicPriorSummary();};
const civicPriorRelocate=relocate;
relocate=function(destination){
 const s=g.civics;
 if(s?.office)civicLeave(s,'You moved away');
 if(s)s.campaign=null;
 return civicPriorRelocate(destination);
};
const civicPriorWorld=world;
world=function(){
 const before=new Set(g.wars.map(w=>[w.a,w.b].sort().join(':')));
 const result=civicPriorWorld();
 if(g.age>=18){
  for(const w of g.wars){
   const key=[w.a,w.b].sort().join(':');
   if(!before.delete(key))civicWorldBrief('International conflict reported',w.a+' and '+w.b+' entered a conflict in the simulation.',key,true);
  }
  for(const key of before)civicWorldBrief('International conflict ends',key.split(':').join(' and ')+' ended their active conflict.',key,true);
 }
 return result;
};
function civicWorldBrief(title,text,key,international=false){
 return newsPublish(international?'international':'government',title,text,{type:'civics',ref:0,international},
  'civic-world-'+g.age+'-'+title+'-'+key);
}
const civicPriorGov=gov;
gov=function(country){
 const prior=g.w[country]?.t.inc,result=civicPriorGov(country);
 if(g.age>=18&&country===g.country&&g.w[country].t.inc!==prior)civicWorldBrief('Domestic tax policy changes',g.country+' now lists its income tax rate at '+g.w[country].t.inc+'%.',country);

 return result;
};
const civicPriorElection=elect;
elect=function(country,vote){
 const result=civicPriorElection(country,vote);
 if(g.age>=18&&country===g.country&&!civicActive()){
  civicWorldBrief('Domestic election results announced',g.w[country].leader+' was elected. Voters are watching the incoming government’s priorities.',country);
 }
 return result;
};
const civicPriorRun=runFor;
runFor=function(i){if(civicActive())return civicOpenRaces();return civicPriorRun(i);};
const civicPriorCollege=collegeStart;
collegeStart=function(id){
 if(civicActive()){toast('Finish your term before enrolling.');return draw();}
 return civicPriorCollege(id);
};
for(const name of ['findJob','collegeConfirmJob','takeOffer','applyIntern','eduInternApply','pro']){
 const original=window[name];
 if(typeof original==='function')window[name]=function(...args){
  if(civicActive())return toast('Finish your term before accepting another position.');
  return original(...args);
 };
}
const civicPriorRetire=retire;
retire=function(){
 if(civicActive())return civicAction('resign');
 return civicPriorRetire();
};
const civicPriorInternational=intl;
intl=function(action){
 if(civicActive())return civicGo('international');
 return civicPriorInternational(action);
};
const civicPreviousPrison=justiceEnterPrison;
justiceEnterPrison=function(...args){
 const s=g.civics;
 if(s?.office)civicLeave(s,'Removed from office after conviction');
 if(s)s.campaign=null;
 return civicPreviousPrison(...args);
};
function civicNewsAvailable(a,e){
 const s=g.civics;
 if(!a.brief.ref)return e.age===g.age;
 if(!s)return false;
 if(a.brief.type==='civicsBill'){
  const b=civicTermBills(s).find(x=>x.id===a.brief.ref);
  return civicActive()&&b?.stage===a.brief.stage&&['committee','desk','veto','reconsideration'].includes(b.stage);
 }
 const item=s.events.find(x=>x.id===a.brief.ref);
 return !!item&&civicEventAvailable(item);
}
function civicNewsOptions(a){
 const s=civicState();
 if(a.brief.type==='civicsBill'){
  const b=s.bills.find(x=>x.id===a.brief.ref);
  const choices=b?.stage==='desk'?
   (civicCanVeto(civicCurrent())?['Sign into law','Return for negotiations','Veto']:['Approve implementation','Return for negotiations']):
   ['Vote or call a vote in favor','Vote against','Negotiate a compromise'];
  return choices.map((x,i)=>[x,'brief'+i]);
 }
 if(!a.brief.ref){
  return [['Make a brief public statement','brief0'],['Review the political record','brief1'],['Record no comment','brief2']];
 }
 const item=s.events.find(e=>e.id===a.brief.ref);
 return (item?civicEventOptions(s,item):[]).map((x,i)=>[x,'brief'+i]);
}
function civicNewsResolve(a,index){
 const s=civicState();
 if(a.brief.type==='civicsBill'){
  const b=s.bills.find(x=>x.id===a.brief.ref);
  if(!b||b.stage!==a.brief.stage)return {done:false,text:'This measure has moved to another stage.'};
  const error=b.stage==='desk'?civicDesk(s,b,['sign','negotiate','veto'][index]):
   index===2?civicBillSupport(s,b,'compromise'):civicVote(s,b,index===0?'support':'oppose');
  return {done:!error,text:error||'The legislative response was recorded.'};
 }
 if(a.brief.ref){
  const item=s.events.find(e=>e.id===a.brief.ref);
  return item?civicRespond(s,item,index):{done:false,text:'The decision is unavailable.'};
 }
 if(index===0&&civicActive())g.approval=civicClamp(g.approval+1);
 if(index===1){
  tab='Work';wsub=null;wsel=civicActive()?'civics':'civic-races';civicPage='inbox';
 }
 return {done:true,text:['A statement was recorded.','Opened the political record.','No comment was recorded.'][index]};
}
function civicBillPress(s,b,title,text){
 return newsPublish('government',title,text,{type:'civicsBill',ref:b.id,stage:b.stage,international:false},'civic-bill-'+(++s.serial));
}
function civicValidate(life){
 const s=life.civics;
 const object=x=>x!=null&&typeof x==='object'&&!Array.isArray(x);
 const count=x=>Number.isSafeInteger(x)&&x>=0;
 const country=x=>typeof x==='string'&&Object.hasOwn(life.w||{},x);
 const age=x=>count(x)&&x<=1000;
 const percent=x=>count(x)&&x<=100;
 const stages=Object.keys(CIVIC_STAGE_LABELS);
 if(!object(s)||s.version!==1||!country(s.institutionCountry)||!count(s.serial)||!Number.isSafeInteger(s.lastAge)||!count(s.funds)||
   !['history','bills','events','elections','terms','favors','judges','pacts','trade'].every(k=>Array.isArray(s[k]))||
   !['bodies','cabinet','used','resources','military'].every(k=>object(s[k]))||
   ![s.standing,s.ethics,s.support,s.military.readiness].every(percent)||
   !count(s.resources.stock)||!count(s.resources.output))throw Error('Invalid political career.');
 const office=x=>object(x)&&country(x.country)&&!!civicOffice(x.id,x.country);
 if(s.office!=null&&(!office(s.office)||!count(s.office.term)||s.office.term>s.serial||!age(s.office.since)||!age(s.office.end)||s.office.end<=s.office.since||
  !civicSystem(s.office.country).parties.includes(s.party)))throw Error('Invalid elected office record.');
 const c=s.campaign;
 if(c!=null&&(!office(c)||!age(c.started)||!count(c.round)||!civicCampaignStages[c.round]||!count(c.treasury)||
  !Number.isFinite(c.backing)||!Number.isSafeInteger(c.ethics)||!count(c.risk)||!civicSystem(c.country).parties.includes(c.party)||
  !Array.isArray(c.rivals)||!c.rivals.length||c.rivals.some(x=>!object(x)||typeof x.name!=='string'||!count(x.backing))))throw Error('Invalid campaign.');
 const records=[...s.bills,...s.favors,...s.events];
 if(records.some(x=>!object(x)||!count(x.id)||x.id>s.serial)||new Set(records.map(x=>x.id)).size!==records.length||
   s.bills.some(b=>!country(b.country)||!Object.hasOwn(CIVIC_POLICIES,b.key)||!stages.includes(b.stage)||!count(b.cost)||
    !age(b.age)||!count(b.term)||b.term>s.serial||!Array.isArray(b.used)||!Number.isFinite(b.support)||
    !CIVIC_POLICIES[b.key][1].includes(b.scope)||b.target!=null&&!country(b.target))||
   s.events.some(e=>typeof e.title!=='string'||typeof e.text!=='string'||!age(e.age)||typeof e.closed!=='boolean'||
    typeof e.seen!=='boolean'||!['incident','court','favor','ethics','election','update'].includes(e.kind)||
    e.kind==='incident'&&!Object.hasOwn(CIVIC_EVENTS,e.key)||e.country!=null&&!country(e.country))||
   s.terms.some(x=>!office(x)||!count(x.years)||!count(x.rank))||
   s.elections.some(e=>!office(e)||!age(e.age)||typeof e.won!=='boolean'||!Array.isArray(e.results)||e.results.some(r=>!object(r)||typeof r.name!=='string'||!count(r.votes))))throw Error('Invalid political records.');
 if(Object.values(s.bodies).some(b=>!object(b)||!count(b.size)||!Array.isArray(b.blocs)||!Array.isArray(b.coalition)||
  b.blocs.some(x=>!object(x)||typeof x.name!=='string'||!count(x.seats)||!percent(x.stance))||
  b.blocs.reduce((n,x)=>n+x.seats,0)!==b.size))throw Error('Invalid legislative composition.');
 if(s.institutionRecords!=null&&(!object(s.institutionRecords)||Object.entries(s.institutionRecords).some(([key,n])=>
  !country(key)||!object(n)||!['cabinet','resources','military'].every(field=>object(n[field]))||
  !['judges','pacts','trade'].every(field=>Array.isArray(n[field]))||!percent(n.standing)||
  !count(n.resources.stock)||!count(n.resources.output)||!percent(n.military.readiness))))throw Error('Invalid archived institutions.');
 if(s.publicBudgets!=null&&(!object(s.publicBudgets)||!Object.values(s.publicBudgets).every(count)))throw Error('Invalid public budget.');
}
