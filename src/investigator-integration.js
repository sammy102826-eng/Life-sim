const piOldFix=fix2;
fix2=function(life){
 const prepared=piOldFix(life);
 serviceMigrate(prepared);
 // Earlier UAE saves used a default payroll contribution for every resident.
 const emirates=prepared.w?.['United Arab Emirates']?.t;
 if(emirates?.inc===0&&emirates.ss===12)emirates.ss=0;
 return prepared;
};
function serviceListingIndex(row){
 const title=row[0]==='Enlist as a soldier'?'Soldier':row[0];
 return JB.ft.findIndex(x=>x[0]===title&&x[1]==='military');
}
const piOldHire=hire;
hire=function(type,index){
 const row=JB[type]?.[index];
 if(!row)return;
 if(type==='sp'&&SERVICE_LISTINGS.includes(row))return piOldHire('ft',serviceListingIndex(row));
 return piOldHire(type,index);
};
const piOldConfirm=collegeConfirmJob;
collegeConfirmJob=function(type,index){
 const row=JB[type]?.[index];
 if(!row)return;
 const prior=g.job;
 const result=type==='sp'&&SERVICE_LISTINGS.includes(row)?piOldConfirm('ft',serviceListingIndex(row)):piOldConfirm(type,index);
 if(prior!==g.job&&piPoliceRole(g.job))piState();
 return result;
};
const piOldWork=workV;
workV=function(){
 if(g.jail)return piOldWork();
 if(wsel==='job'&&piOwnsJob()){piPage='overview';return piAgencyView();}
 if(wsel==='investigator')return piAgencyView();
 const html=piOldWork();
 if(!wsel&&wsub==='Special'){
  const s=g.investigator,ready=s&&piQualified(s);
  return B('Private Investigator <small>'+(ready?'Open or resume your agency':'Requires 3 patrol years and 3 detective years')+'</small>',
   'piOpen()',!ready)+html;
 }
 if(wsel==='job'&&piPoliceRole(g.job))return html+piPoliceView();
 if(wsel==='job'&&g.job?.f==='military')return html+serviceDuties();
 return html;
};
const serviceOldPromo=promo;
promo=function(){
 if(g.job?.t==='Soldier')return toast('Finish the enlistment term. Officer roles require the listed qualifications.');
 return serviceOldPromo();
};
const piOldAge=ageUp;
ageUp=function(){
 if(g?.alive&&piPoliceRole(g.job))piState();
 if(g?.job?.f==='military')serviceMigrate(g);
 return piOldAge();
};
const piOldPayday=payday;
payday=function(){
 const result=piOldPayday();
 piPayroll();serviceCompleteYear();
 return result;
};
const piOldSum=buildSum;
buildSum=function(){
 piYear();
 return piOldSum();
};
const piOldPrisonLedger=prisonLedger;
prisonLedger=function(s){
 piYear();
 return piOldPrisonLedger(s);
};
const piOldNW=nw;
nw=function(){
 return piOldNW()+(g.investigator?.agency?piValue(g.investigator.agency):0);
};
const piOldEffects=E;
E=function(x){
 const result=piOldEffects(x);
 if(x?.piNotice){tab='Work';wsel='investigator';wsub=null;piPage='overview';}
 if(x?.piEvent)newsBriefReceipt=piRespond(g.investigator?.events.find(e=>e.id===x.piEvent.id),x.piEvent.choice).text;
 return result;
};
const piOldDrain=stuffDrainEvents;
stuffDrainEvents=function(){
 if(g?.stuffEventQueue?.length)g.stuffEventQueue=g.stuffEventQueue.filter(q=>{
  const id=q.c?.[0]?.[1]?.piEvent?.id;
  return id==null||piEventReady(g.investigator?.events.find(e=>e.id===id));
 });
 return piOldDrain();
};
function piTransferEstate(life,a){
 const s=piState(life);
 if(s.agency){life.cash+=piValue(a);return;}
 s.agency={...a,staff:{...a.staff},report:null,ledger:{},outreach:0};
 s.lastAge=life.age;
}
function piValidate(life){
 const s=life.investigator;
 const obj=x=>x!=null&&typeof x==='object'&&!Array.isArray(x);
 const count=x=>Number.isSafeInteger(x)&&x>=0,score=x=>count(x)&&x<=100;
 const id=x=>count(x)&&x>0&&x<=s.serial;
 const ages=x=>obj(x)&&Object.values(x).every(count);
 if(!obj(s)||s.version!==1||![s.serial,s.patrol,s.detective,s.training,s.lastService,s.lastAge,s.month,s.closedUntil].every(count)||
  s.month>11||typeof s.notified!=='boolean'||s.lastIntake!==null&&!count(s.lastIntake)||!ages(s.policeUsed)||
  !['offers','cases','events','notes'].every(k=>Array.isArray(s[k]))||
  s.notes.some(x=>!obj(x)||!count(x.year)||!count(x.month)||typeof x.text!=='string'))
  throw Error('Invalid investigation career.');
 const entries=[...s.offers,...s.cases,...s.events];
 if(entries.some(x=>!obj(x)||!id(x.id))||new Set(entries.map(x=>x.id)).size!==entries.length)throw Error('Invalid investigation identifiers.');
 const referral=x=>Object.hasOwn(PI_CASES,x.key)&&typeof x.client==='string'&&[x.fee,x.opened,x.months].every(count)&&typeof x.inbound==='boolean';
 if(s.offers.some(x=>!referral(x))||s.cases.some(x=>!referral(x)||![x.started,x.due,x.fees,x.cost].every(count)||x.fees>x.fee||x.due<x.started||
  !score(x.confidence)||!score(x.trust)||typeof x.public!=='boolean'||!ages(x.used)||
  !['active','substantiated','qualified','inconclusive','handoff','expired'].includes(x.status)||!Array.isArray(x.evidence)||
  x.evidence.some(e=>!obj(e)||!Object.hasOwn(PI_METHODS,e.source)||!count(e.month)||!count(e.gain))))throw Error('Invalid investigation file.');
 if(s.events.some(e=>!Object.hasOwn(PI_EVENTS,e.key)||typeof e.closed!=='boolean'||!count(e.age)||e.article!=null&&!/^brief-\d+$/.test(e.article)||
  e.file!=null&&!count(e.file)))throw Error('Invalid investigation event.');
 const a=s.agency;
 if(a==null){
  if(life.job?.investigationOwner||s.cases.length||s.offers.length||s.events.length)throw Error('Investigation files require an agency.');
  return;
 }
 if(!obj(a)||typeof a.id!=='string'||!/^life-[a-z0-9-]+$/.test(a.id)||!piValidName(a.name)||!Object.hasOwn(life.w,a.country)||
  ![a.cash,a.equity,a.outreach,a.secure].every(count)||a.secure>6||!score(a.rep)||!Number.isFinite(a.scale)||a.scale<=0||
  !obj(a.staff)||Object.keys(PI_STAFF).some(k=>!count(a.staff[k])||a.staff[k]>3)||!obj(a.ledger)||!Object.values(a.ledger).every(Number.isSafeInteger)||
  a.report!=null&&!ages(a.report))throw Error('Invalid investigation agency.');
}
