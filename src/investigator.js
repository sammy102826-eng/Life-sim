const piScore=n=>Math.round(cl(n,0,100));
const piPoliceRole=job=>job?.t==='Police officer'?'patrol':['Detective','Senior detective'].includes(job?.t)?'detective':null;
const piOwnsJob=()=>g.job?.investigationOwner===true;
const piAdult=()=>g.alive&&g.age>=21&&!g.jail;
const piActive=()=>piAdult()&&piOwnsJob()&&g.investigator?.agency?.country===g.country&&g.office<0&&!g.ret&&!royalRestricted();
function piState(life=g){
 if(life.investigator)return life.investigator;
 const current=piPoliceRole(life.job),years=Math.max(0,Math.floor(life.job?.yrs||0));
 return life.investigator={version:1,serial:0,patrol:current==='patrol'?years:0,detective:current==='detective'?years:0,
  training:0,lastService:life.age,notified:false,agency:null,cases:[],offers:[],events:[],notes:[],
  month:0,lastAge:life.age,lastIntake:null,closedUntil:0,policeUsed:{}};
}
function piNote(s,message){
 s.notes.unshift({year:g.age,month:s.month,text:message});s.notes=s.notes.slice(0,40);
 L(uiEscape(message));
}
const piQualified=s=>s.patrol>=PI_PATROL_YEARS&&s.detective>=PI_DETECTIVE_YEARS;
function piPayroll(){
 const role=piPoliceRole(g.job);
 if(!role||!g.alive||g.jail)return;
 const s=piState();
 if(s.lastService>=g.age)return;
 s.lastService=g.age;s[role]++;
 piNotify(s);
}
function piNotify(s){
 if(!s.notified&&piQualified(s)){
  s.notified=true;
  const text='You completed the patrol and detective experience required to open a private investigation agency.';
  piNote(s,text);
  (g.stuffEventQueue??=[]).push({x:text,c:[['Review the agency requirements',{piNotice:true},'The Private Investigator career is available.'],
   ['Continue in your current role',{},'You kept your current role.']]});
 }
}
function piPoliceAction(action){
 const role=piPoliceRole(g.job);
 if(!role||g.jail||!g.alive||publicityBusy())return;
 const s=piState();
 if(action==='promote'){
  if(role!=='patrol'||s.patrol<PI_PATROL_YEARS||s.training<2||g.perf<55||g.rec)return toast('Promotion requires three patrol years, two casework courses, performance of 55, and a clean record.');
  g.job={...g.job,t:'Detective',f:'police',sp:0,pay:69000,lv:1,yrs:0,careerBaseTitle:null};
  g.exp.police=Math.max(g.exp.police||0,s.patrol);
  piNote(s,'You were assigned to the detective division.');
 }else if(['course','duty'].includes(action)){
  if(s.policeUsed[action]===g.age)return toast('You finished that duty this year.');
  s.policeUsed[action]=g.age;
  if(action==='course')s.training++;
  g.perf=piScore(g.perf+(action==='course'?6:4));
  piNote(s,action==='course'?'Completed supervised casework training.':role==='patrol'?'Completed community patrol and documented incident reports.':'Reviewed case files with your division.');
 }
 draw(1);
}
function piCanOpen(s){
 return piAdult()&&piQualified(s)&&!g.rec&&!g.justice?.pending&&g.office<0&&!g.ret&&!royalRestricted()&&
  (!g.job||!!piPoliceRole(g.job))&&!g.pt.length&&!g.intern&&!g.study&&!g.collegeTrack?.current&&
  !g.educationJourney?.internships?.some(i=>i.status==='Active')&&!g.vent.some(v=>v.ceo)&&!g.actor?.projects?.some(p=>p.status==='signed');
}
const piValidName=n=>typeof n==='string'&&n.trim().length>0&&n.trim().length<=52&&!/[<>]/.test(n);
const piClock=s=>g.age*12+s.month;
const piOpenFiles=s=>s.cases.filter(c=>c.status==='active');
const piCapacity=a=>3+a.staff.analyst+a.staff.reviewer;
const piCost=(a,n)=>Math.max(n>0?1:0,Math.round(n*a.scale));
const piValue=a=>a.cash+a.equity;
function piLedger(a,label,value){a.cash+=value;a.ledger[label]=(a.ledger[label]||0)+value;}
function piSpend(a,label,amount){
 if(a.cash<amount)return false;
 piLedger(a,label,-amount);return true;
}
function piHeadline(title,summary,event=null){
 return newsPublish('investigations',title,summary,event?{type:'piEvent',ref:event.id}:null);
}
function piFound(name){
 const s=piState();
 if(!piCanOpen(s)||s.agency)return 'Meet the experience, licensing, and schedule requirements first.';
 if(!piValidName(name))return 'Enter an agency name of up to 52 characters.';
 const cost=pr(PI_START_COST);
 if(g.cash<cost)return 'Opening needs '+loc(cost)+' in personal cash.';
 g.cash-=cost;LD('Investigation agency investment',-cost);
 s.agency={id:genIdentity(),name:name.trim(),country:g.country,cash:Math.round(cost*.52),equity:Math.round(cost*.35),scale:pr(10000)/10000,
  rep:21,staff:{analyst:0,liaison:0,reviewer:0},ledger:{},report:null,outreach:0,secure:0};
 s.lastAge=g.age;s.month=0;
 piResume(s);
 piHeadline('A new investigation agency opens',s.agency.name+' announced its private investigation and case review services.');
 piNote(s,'You opened '+s.agency.name+'.');
 return '';
}
function piResume(s){
 const a=s.agency;
 if(!a||a.country!==g.country||!piCanOpen(s))return 'You must qualify and work in the agency’s country to reopen it.';
 g.job={t:'Private Investigator',f:'police',sp:1,pay:0,yrs:0,investigationOwner:true};
 g.ue=false;return '';
}
function piRefreshOffers(s){
 const a=s.agency;
 if(s.lastIntake===g.age)return;
 s.lastIntake=g.age;
 const available=Object.keys(PI_CASES).filter(k=>a.rep>=PI_CASES[k][1]),count=a.rep>=70?6:a.rep>=43?5:3;
 const pool=[...available],year=g.age;
 const invite=a.rep>=43?pool.filter(k=>PI_CASES[k][1]>=18):[];
 s.offers=[];
 while(pool.length&&s.offers.length<count){
  const personal=invite.length>0&&s.offers.length<2;
  const key=personal?invite.splice(R(0,invite.length-1),1)[0]:P(pool);
  pool.splice(pool.indexOf(key),1);
  const [,threshold,base,months]=PI_CASES[key];
  s.offers.push({id:++s.serial,key,client:nm2(),fee:piCost(a,Math.round(base*R(91,118)/100)),opened:year,months,
   inbound:personal||threshold>=18&&a.rep>=threshold+4&&ch(65)});
 }
}
function piAccept(id){
 if(!piActive())return 'Open your agency before accepting work.';
 const s=piState(),a=s.agency;
 piRefreshOffers(s);
 const t=s.offers.find(x=>x.id===id);
 if(!t)return 'This referral is unavailable.';
 if(piClock(s)<s.closedUntil||piOpenFiles(s).length>=piCapacity(a))return 'The agency cannot take another file yet.';
 const start=piClock(s),retainer=Math.round(t.fee*.25);
 const item={...t,started:start,due:start+t.months,status:'active',confidence:0,trust:t.inbound?65:54,evidence:[],used:{},
  fees:retainer,cost:0,public:PI_CASES[t.key][1]>=34};
 s.cases.unshift(item);
 if(s.cases.length>70)s.cases.splice(s.cases.findLastIndex(x=>x.status!=='active'),1);
 s.offers=s.offers.filter(x=>x.id!==id);
 piLedger(a,'Client retainers',retainer);
 piNote(s,'Accepted '+PI_CASES[t.key][0].toLowerCase()+' with a '+loc(retainer)+' retainer.');
 return '';
}
function piClose(s,item,mode){
 const a=s.agency,coverage=new Set(item.evidence.map(e=>e.source)).size;
 if(item.status!=='active')return 'This file is already closed.';
 if(mode==='findings'&&(item.confidence<48||coverage<2))return 'Corroborate across two sources and reach confidence of 48 before reporting findings.';
 const success=mode==='findings'&&item.confidence>=64&&coverage>=3&&item.trust>=48;
 const bill=mode==='findings'?(success?item.fee-item.fees:Math.round((item.fee-item.fees)*.65)):
  mode==='inconclusive'?Math.round((item.fee-item.fees)*.22):0;
 item.fees+=bill;item.status=success?'substantiated':mode==='findings'?'qualified':mode;
 if(bill)piLedger(a,'Case completion fees',bill);
 const rep=success?9:mode==='findings'?4:mode==='inconclusive'?1:mode==='expired'?-5:-3;
 a.rep=piScore(a.rep+rep);
 piNote(s,PI_CASES[item.key][0]+' closed with '+item.status+' status. Total collected '+loc(item.fees)+'.');
 if(item.public&&['substantiated','qualified'].includes(item.status)){
  piHeadline('Independent review delivers its findings',a.name+' submitted a '+item.status+' report without releasing private client information.');
  if(success&&ch(70))piEvent(s,item.key==='murder'||item.key==='missing'?'jurisdiction':'publicity');
 }
 return '';
}
function piExpire(s){
 for(const item of piOpenFiles(s))if(item.due<=piClock(s))piClose(s,item,'expired');
}
function piAdvance(s){
 if(s.month>=11)return false;
 s.month++;
 piExpire(s);
 return true;
}
function piCaseAction(id,action){
 if(!piActive())return 'The agency is unavailable.';
 const s=piState(),a=s.agency,item=piOpenFiles(s).find(x=>x.id===id);
 if(!item||item.due<=piClock(s))return 'This case is closed or overdue.';
 if(['findings','inconclusive','handoff'].includes(action))return piClose(s,item,action);
 if(!Object.hasOwn(PI_METHODS,action)||item.used[action]>=2||s.month>=11)return 'That work is complete or the calendar year is closing.';
 if(action==='review'&&item.evidence.length<2)return 'Collect two records or accounts before attempting corroboration.';
 const [,base,quality]=PI_METHODS[action],cost=piCost(a,base);
 if(!piSpend(a,'Investigation expenses',cost))return 'The agency cannot fund that work.';
 const staff=Object.keys(PI_STAFF).find(k=>PI_STAFF[k][3]===action);
 const difficulty=PI_CASES[item.key][1]/9,bonus=(a.staff[staff]||0)*3+a.secure;
 const gain=Math.max(3,Math.round(quality+(g.talent==='investigation'?Math.round(quality*.2):0)+R(0,11)+bonus+s.training/2-difficulty));
 item.used[action]=(item.used[action]||0)+1;item.cost+=cost;
 item.confidence=piScore(item.confidence+gain);
 item.trust=piScore(item.trust+(action==='interview'?5:2));
 item.evidence.push({source:action,month:piClock(s),gain});
 if(gain<=10&&ch(30))piEvent(s,'witness',item.id);
 piAdvance(s);
 return '';
}
function piManage(action,key,amount){
 if(!piActive())return 'Open your agency first.';
 const s=piState(),a=s.agency;
 if(action==='fund'||action==='withdraw'){
  if(!Number.isSafeInteger(amount)||amount<1)return 'Enter a positive whole amount.';
  if(action==='fund'){
   if(g.cash<amount)return 'Your personal account cannot fund that transfer.';
   g.cash-=amount;LD('Investigation agency investment',-amount);piLedger(a,'Owner contribution',amount);
  }else{
   const reserve=Math.round(Object.keys(PI_STAFF).reduce((n,k)=>n+piCost(a,PI_STAFF[k][1])*a.staff[k],piCost(a,5200))/12);
   if(a.cash-amount<reserve)return 'Leave at least one month of operating costs in the agency.';
   piLedger(a,'Owner distribution',-amount);
   finOwnerDistribution(amount,'Investigation agency owner distribution','Investigation agency distribution tax');
  }
 }else if(action==='rename'){
  if(!piValidName(key)||key.trim()===a.name)return 'Enter a new agency name of up to 52 characters.';
  if(!piSpend(a,'Rebranding',piCost(a,1900)))return 'Agency cash cannot cover rebranding.';
  const old=a.name;a.name=key.trim();
  piHeadline('Investigation agency announces a rebrand',old+' is now called '+a.name+'.');
 }else if(action==='staff'){
  if(!Object.hasOwn(PI_STAFF,key)||![1,-1].includes(amount)||a.staff[key]+amount<0||a.staff[key]+amount>3)return 'This staff position is unavailable.';
  if(amount===1&&!piSpend(a,'Staff recruitment',piCost(a,PI_STAFF[key][2])))return 'The agency cannot fund recruitment.';
  a.staff[key]+=amount;
 }else if(action==='month'){
  if(!piAdvance(s))return 'Use Age Up to begin the next calendar year.';
 }else if(action==='archive'){
  if(a.secure>=6)return 'The archive is at its highest security level.';
  if(!piSpend(a,'Archive improvement',piCost(a,2700)))return 'The agency cannot pay for the archive upgrade.';
  a.secure=Math.min(6,a.secure+1);
 }else return 'This agency action is unavailable.';
 return '';
}
function piEvent(s,key,file=null){
 const a=s.agency;
 if(!a||!Object.hasOwn(PI_EVENTS,key)||s.events.some(e=>e.key===key&&!e.closed))return;
 const [title,text,publicStory,options]=PI_EVENTS[key],e={id:++s.serial,key,file,closed:false,age:g.age,article:null};
 s.events.push(e);
 if(s.events.length>40){const first=s.events.findIndex(x=>x.closed);if(first>=0)s.events.splice(first,1);}
 if(publicStory)e.article=piHeadline(title,a.name+'. '+text,e);
 (g.stuffEventQueue??=[]).push({x:uiEscape(title+'. '+text),c:options.map(([label],i)=>[uiEscape(label),
  {piEvent:{id:e.id,choice:i}},'You recorded an agency decision.'])});
}
const piEventReady=e=>!!e&&!e.closed&&piActive();
function piRespond(e,index){
 const choice=e&&PI_EVENTS[e.key][3][index];
 if(!piEventReady(e)||!choice)return {done:false,text:'This agency decision is unavailable.'};
 const [label,base,rep,action]=choice,s=piState(),a=s.agency,amount=piCost(a,base);
 if(!piSpend(a,'Incident response',amount))return {done:false,text:'The agency cannot fund this response. Choose another option.'};
 a.rep=piScore(a.rep+rep);
 if(action==='grant'){piLedger(a,'Community grant',piCost(a,8000));a.outreach=2;}
 if(action==='protect')a.secure=Math.min(6,a.secure+1);
 if(action==='intake')s.closedUntil=piClock(s)+1;
 for(const item of piOpenFiles(s).filter(c=>e.file===null||e.file===c.id)){
  if(action==='trust')item.trust=piScore(item.trust+8);
  if(action==='credit')item.confidence=piScore(item.confidence+9);
  if(action==='wait')item.due++;
 }
 e.closed=true;
 const news=g.news,story=[...(news?.editions||[]).flatMap(d=>d.articles),...(news?.queued||[]).map(q=>q.article)].find(x=>x.id===e.article);
 if(story)story.resolved=true;
 piNote(s,label+'.');
 return {done:true,text:label+' · Agency reputation '+a.rep+'/100.'};
}
const piNewsEvent=article=>g.investigator?.events.find(e=>e.id===article.brief?.ref&&e.article===article.id);
function piNewsOptions(article){
 const e=piNewsEvent(article),a=g.investigator?.agency;
 return e?PI_EVENTS[e.key][3].map(([label,base],i)=>[label+(base?' · '+loc(piCost(a,base)):''),'brief'+i]):[];
}
function piYear(){
 const s=g.investigator,a=s?.agency;
 if(!a||s.lastAge>=g.age)return;
 s.lastAge=g.age;s.month=0;
 piExpire(s);
 const expenses=piCost(a,5200)+Object.keys(PI_STAFF).reduce((n,k)=>n+a.staff[k]*piCost(a,PI_STAFF[k][1]),0);
 const revenue=Object.entries(a.ledger).filter(([k,v])=>v>0&&k!=='Owner contribution').reduce((n,[,v])=>n+v,0);
 const workingCosts=Object.entries(a.ledger).filter(([k,v])=>v<0&&k!=='Owner distribution').reduce((n,[,v])=>n-v,0);
 const tax=Math.round(Math.max(0,revenue-expenses-workingCosts)*finEnterpriseRate(a.country,8,36)/100);
 const operatingPaid=Math.min(a.cash,expenses+tax);
 if(operatingPaid)piLedger(a,'Annual payroll, lease, and business tax',-operatingPaid);
 const shortfall=expenses+tax-operatingPaid;
 if(shortfall){
  const role=Object.keys(PI_STAFF).reverse().find(k=>a.staff[k]>0);
  if(role)a.staff[role]--;
  a.rep=piScore(a.rep-7);s.closedUntil=piClock(s)+2;
  piNote(s,'An operating shortfall slowed intake and reduced staffing.');
 }
 if(a.outreach>0){
  a.outreach--;
  if(s.cases.some(c=>c.started>=piClock(s)-12&&PI_CASES[c.key][1]>=12))a.rep=piScore(a.rep+3);
  else if(!a.outreach){piLedger(a,'Grant repayment',-Math.min(a.cash,piCost(a,4000)));a.rep=piScore(a.rep-5);}
 }
 a.report={age:g.age,revenue,expenses:expenses+workingCosts,tax,shortfall};
 a.ledger={};
 if(piActive()){
  piRefreshOffers(s);
  if(ch(52)){
   const pool=['conflict','witness','security','overtime'];
   if(a.rep>=34)pool.push('publicity','grant','jurisdiction','appeal');
   piEvent(s,P(pool));
  }
 }
}
