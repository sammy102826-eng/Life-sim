const PRACTICE_DOCTORS=['Medical resident','Physician','Senior physician','Department head','Hospital CEO'];
const PRACTICE_FOUNDERS=['Senior physician','Department head','Hospital CEO'];
const clinicDegree=(life=g)=>life.collegeTrack?.degrees?.findLast(d=>d.level==='medical');
const clinicHasMD=(life=g)=>!!clinicDegree(life)||life.deg?.some(d=>['MD','Doctor of Medicine (MD)'].includes(d));
const clinicMedicalJob=()=>g.job?.f==='medicine'&&!g.job.sp&&PRACTICE_DOCTORS.includes(g.job.t);
const clinicOwnsJob=()=>g.job?.practiceOwner===true;
const clinicActive=()=>g.practice?.status==='active'&&clinicOwnsJob()&&g.practice.country===g.country&&!g.jail&&!g.ret&&g.office<0&&!royalActive();
const clinicJob=()=>({t:'Medical practice owner',f:'medicine',pay:0,sp:1,yrs:0,practiceOwner:true});
const clinicBlocked=()=>publicityBusy()||!!g.actor?.queue?.length;
const clinicScale=()=>pr(100000)/100000;
const clinicCities=()=>[...new Set([g.city||g.country,...(CITY[g.country]||'').split('|').filter(Boolean)])];

jobUpdateCompanies.medicine=['Lakehurst Medical','Cedar Valley Hospital','Summit Health Center','Harbor General'];
MJ['Medical resident']=['Biology','Medicine'];
LAD.medicine.splice(2,0,['Senior physician',255000,3,6,0,'MD']);
for(const title of ['Medical resident','Physician','Senior physician','Hospital CEO'])REQJ[title]='Medical licensing exam';
for(const title of PRACTICE_DOCTORS){
  for(const [scenario,choices] of [
    ['A clinic review found that handoff notes are slowing down follow-up visits.',[
      ['Lead a staff review',{perf:5,jobBossBond:4},'Your supervisor adopted the revised handoff process.'],
      ['Ask a senior colleague to lead',{perf:1,jobColleagueBond:3},'The team changed the handoff process together.']]],
    ['A patient advocacy group asks your department to address appointment access.',[
      ['Prepare a proposal for evening access',{perf:4,careerHarmonyDelta:3,jobBossBond:2},'Your department trialed a new appointment block.'],
      ['Collect patient feedback first',{perf:2,jobColleagueBond:2},'The team recorded the feedback before revising the schedule.']]],
    ['A colleague asks for help reviewing an unexpected procedure outcome.',[
      ['Attend a protected peer review',{perf:4,jobBossBond:4},'The department documented improvements to its review process.'],
      ['Arrange a second reviewer',{perf:2,careerHarmonyDelta:1},'Another clinician provided an independent review.']]]
  ]){
    const event=[26,100,'w',scenario,choices];
    Object.assign(event,{jobOnly:true,jobField:'medicine',jobTitle:title});
    EV.push(event);
  }
}

const clinicFix=fix2;
fix2=function(life){
  const result=clinicFix(life);
  if(clinicHasMD(result)&&!result.deg.includes('MD'))result.deg.push('MD');
  if(result.job?.f==='health'&&['Physician','Medical resident','Hospital CEO'].includes(result.job.t))result.job.f='medicine';
  return result;
};
const clinicOriginalGraduate=collegeGraduate;
collegeGraduate=function(){
  if(collegeEnsure().current?.level==='medical'&&!g.deg.includes('MD'))g.deg.push('MD');
  return clinicOriginalGraduate();
};
const clinicSpecificJob=collegeSpecificJobMet;
collegeSpecificJobMet=function(row){
  if(row[1]==='medicine'&&PRACTICE_DOCTORS.includes(row[0]))return clinicHasMD();
  return clinicSpecificJob(row);
};
const clinicOriginalPayday=payday;
payday=function(){
  const j=g.job,track=g.physicianPath,eligible=clinicMedicalJob()&&j.t!=='Medical resident'&&!!g.pass?.['Medical licensing exam'];
  const result=clinicOriginalPayday();
  if(eligible&&g.job===j&&track?.specialty&&track.lastAge!==g.age){
    track.lastAge=g.age;track.years++;
  }
  return result;
};
function clinicSelectSpecialty(key){
  if(!clinicMedicalJob()||!clinicHas(PRACTICE_SPECIALTIES,key)||g.physicianPath?.specialty)return;
  g.physicianPath={specialty:key,years:0,lastAge:g.age};
  L('You began training in '+PRACTICE_SPECIALTIES[key][0].toLowerCase()+'.');
  draw();
}
function clinicRequirements(){
  if(!clinicMedicalJob())return [];
  const j=g.job,track=g.physicianPath;
  const career=jobUpdateEnsureCareer();
  return [
    [!!track?.specialty,'Choose a medical specialty'],
    [(track?.years||0)>=8,'Eight licensed physician years in the specialty ('+(track?.years||0)+')'],
    [PRACTICE_FOUNDERS.includes(j.t),'Senior physician or higher'],
    [g.perf>=75,'Performance 75+ ('+g.perf+')'],
    [career.score>=55,'Career harmony 55+ ('+career.score+')'],
    [j.boss.bond>=55,'Supervisor relationship 55+ ('+j.boss.bond+')'],
    [clinicHasMD()&&g.pass?.['Medical licensing exam']&&!g.rec&&!g.jail&&!g.ret&&g.office<0&&!royalActive(),'Medical license and clean record']
  ];
}
const clinicCanFound=()=>!g.practice&&clinicMedicalJob()&&clinicRequirements().every(([met])=>met);
function clinicFound(){
  if(!clinicCanFound()||clinicBlocked())return;
  g.practicePrompt='found';
  draw();
}
function clinicFoundConfirm(){
  if(g.practicePrompt!=='found'||!clinicCanFound()||clinicBlocked())return;
  const input=document.getElementById('clinic-name'), error=document.getElementById('clinic-form-error');
  const name=input?.value.trim(), base=Number(document.getElementById('clinic-capital')?.value);
  if(!error)return;
  if(!name||/[<>]/.test(name)||name.length>60||![190000,225000,300000,450000].includes(base)){
    error.textContent='Enter a plain-text practice name and choose the startup investment.';
    return;
  }
  const cities=clinicCities(),home=cities[Number(document.getElementById('clinic-start-city')?.value)];
  if(!home){error.textContent='Choose a city for the first office.';return;}
  const scale=clinicScale(), capital=Math.round(base*scale);
  if(g.cash<capital){
    error.textContent='You need '+clinicMoney(capital)+' in personal cash for this investment.';
    return;
  }
  const seed=[...g.name+name+g.country+g.age].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261);
  const p=clinicNew({name,specialty:g.physicianPath.specialty,age:g.age,capital,scale,home,country:g.country,cities,
    skill:clinicClamp(g.perf*.55+g.smarts*.25+8),seed});
  const site=clinicOpenSite(p,0,home);
  if(typeof site==='string'){error.textContent=site;return;}
  g.practicePrompt=null;
  quit(-1);
  g.cash-=capital;
  LD('Medical practice capital contribution',-capital);
  g.job=clinicJob();g.practice=p;g.ue=false;
  clinicRecord(p,'You opened your first practice as an independent doctor.');
  L(uiEscape(p.name)+' opened for patients in '+home+'.');
  pressNotice('health','An independent medical practice opens',p.name+' purchased a solo office in '+home+' and began enrolling patients.','practiceProfile','practice-found-'+g.age);
  clinicGo('overview');
}
function clinicResume(){
  const p=g.practice;
  if(p?.status!=='active'||g.job||g.jail||g.rec||g.office>=0||g.ret||royalActive()||p.country!==g.country||clinicBlocked())return;
  const pause=Math.max(0,g.age-p.year);
  if(pause){
    for(const c of p.claims)c.due+=pause;
    for(const v of p.visits.filter(v=>v.status==='booked'))v.status='expired';
    p.year=g.age;
  }
  g.job=clinicJob();g.ue=false;clinicGo('overview');
}
function clinicWindDown(){
  if(!clinicActive()||clinicBlocked()||g.practicePrompt!=='close')return;
  const p=g.practice;
  clinicCollectClaims(p,p.year+1);
  for(const x of p.sites){
    const q=clinicSaleQuote(p,x);
    clinicEntry(p,x,'Property liquidation',q.proceeds-q.payroll,'capital');
  }
  const transfer=p.cash-p.debt;
  g.cash+=transfer;
  LD('Medical practice liquidation',transfer);
  p.cash=0;p.debt=0;p.status='closed';p.transfers+=p.patients.length;p.patients=[];p.leads=[];p.visits=[];p.staff=[];
  if(p.plan){p.plan.closingReserve=p.plan.reserve;p.plan.reserve=0;}
  p.incidents.forEach(x=>x.closed=true);
  g.job=null;g.practicePrompt=null;wsel=null;wsub=null;
  clinicRecord(p,'The practice sold its properties and arranged continuity of care.');
  pressNotice('health','A medical practice announces its closure',p.name+' closed. Patients were referred to other providers.','property','practice-close-'+g.age);
  draw(1);
}
const clinicSummary=buildSum;
buildSum=function(){
  if(clinicActive())clinicYear(g.practice,g.age);
  return clinicSummary();
};
const clinicAgeUp=ageUp;
ageUp=function(){
  if(g.practicePrompt)return;
  return clinicAgeUp();
};
const clinicQuit=quit;
quit=function(index){
  if(index<0&&clinicOwnsJob())return clinicPrompt('close');
  return clinicQuit(index);
};
const clinicFindJob=findJob;
findJob=function(){
  if(clinicOwnsJob())return toast('Manage your medical practice in Work.');
  return clinicFindJob();
};
const clinicRetire=retire;
retire=function(){
  if(clinicOwnsJob())return toast('Wind down your medical practice before retiring.');
  return clinicRetire();
};
const clinicCamp=startCamp;
startCamp=function(index){
  if(clinicOwnsJob())return toast('Wind down your medical practice before running for office.');
  return clinicCamp(index);
};
const clinicConfirmJob=collegeConfirmJob;
collegeConfirmJob=function(kind,index){
  if(clinicOwnsJob()&&kind!=='pt')return toast('Wind down the practice before applying for another full-time job.');
  return clinicConfirmJob(kind,index);
};
const clinicOrdinaryEvent=jobUpdateJobEventAllowed;
jobUpdateJobEventAllowed=function(event){
  if(clinicOwnsJob()&&event?.jobOnly&&event.jobField==='medicine')return false;
  return clinicOrdinaryEvent(event);
};
function clinicPrivateDecision(id){
  if(!clinicActive()||clinicBlocked())return;
  const p=g.practice,incident=clinicFind(p.incidents,id),data=PRACTICE_INCIDENTS[incident?.key];
  if(!data||incident.closed)return;
  if(data.public)return newsOpenBrief(incident.story);
  const token=uid();p.pending={token,id,age:g.age};
  g.event={x:data.title+'. Choose how the practice will respond.',c:data.options.map(([label,cost],index)=>[
    label+' · '+clinicMoney(clinicCost(p,cost)),{clinicDecision:{token,index}},'Your clinic response was recorded.'
  ])};
  draw();
}
let clinicDecisionReceipt=null;
const clinicOriginalEffect=E;
E=function(effect){
  clinicOriginalEffect(effect);
  if(!effect?.clinicDecision)return;
  const p=g.practice,record=p?.pending,choice=effect.clinicDecision;
  if(!clinicActive()||!record||record.token!==choice.token||record.age!==g.age||![0,1].includes(choice.index))return;
  p.pending=null;
  const result=clinicRespond(p,clinicFind(p.incidents,record.id),choice.index);
  clinicDecisionReceipt=result.text;
};
const clinicOriginalPick=pick;
pick=function(index){
  clinicDecisionReceipt=null;newsBriefReceipt=null;
  const effect=g.event?.c[index]?.[1],famous=g.fm>=35;
  const venture=g.vent[g.vi];
  const before=g.rec,result=clinicOriginalPick(index);
  const receipt=clinicDecisionReceipt||newsBriefReceipt;
  if(receipt&&g.result){g.result.d=uiEscape(receipt);draw();}
  if(!effect?.newsDecision&&!effect?.clinicDecision&&famous&&g.rec>before){
    pressNotice('community','A public figure faces a legal judgment','A court decision involving '+g.name+' has drawn public attention.','spotlight','public-judgment-'+g.age+'-'+g.rec);
    draw();
  }
  if(venture&&['sell','dil','zooneg','fight','abandon'].includes(effect?.vx)){
    pressNotice('business','A public business dispute prompts a decision',venture.n+' responded to a development covered by the local business press.','business');
    draw();
  }
  return result;
};

function clinicValidate(life){
  const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const count=x=>Number.isSafeInteger(x)&&x>=0;
  const path=life.physicianPath,p=life.practice;
  if(path!=null&&(!obj(path)||!clinicHas(PRACTICE_SPECIALTIES,path.specialty)||!count(path.years)||!count(path.lastAge)))throw Error('Invalid physician specialty record.');
  const prompt=life.practicePrompt;
  if(prompt!=null&&!['found','close'].includes(prompt)&&(!obj(prompt)||prompt.kind!=='sell'||!count(prompt.site)))throw Error('Invalid practice prompt.');
  if(!p){if(life.job?.practiceOwner)throw Error('Practice owner has no saved practice.');return;}
  if(!obj(p)||p.version!==1||!['active','closed'].includes(p.status)||!clinicHas(PRACTICE_SPECIALTIES,p.specialty)||
    typeof p.name!=='string'||!p.name.trim()||p.name.length>60||!Number.isFinite(p.cash)||!Number.isFinite(p.scale)||p.scale<=0||
    !['year','opened','serial','seed','debt'].every(k=>count(p[k]))||!['quality','respect','reputation'].every(k=>count(p[k])&&p[k]<=100))throw Error('Invalid practice account.');
  const lists=['cities','sites','staff','patients','leads','claims','visits','ledger','reports','history','incidents','seen'];
  if(lists.some(key=>!Array.isArray(p[key]))||!['fees','period','flags','networks'].every(k=>obj(p[k])))throw Error('Incomplete practice records.');
  const all=['sites','staff','patients','leads','claims','visits','incidents'].flatMap(k=>p[k]);
  if(all.some(x=>!obj(x)||!count(x.id)||x.id>p.serial)||new Set(all.map(x=>x.id)).size!==all.length)throw Error('Invalid practice record IDs.');
  const sites=new Set(p.sites.map(x=>x.id)),patients=new Set(p.patients.map(x=>x.id));
  if(p.sites.filter(x=>x.primary).length!==1||p.sites.some(x=>!PRACTICE_BUILDINGS[x.level]||!p.cities.includes(x.city)||!count(x.equity))||
    p.staff.some(x=>!sites.has(x.site)||!clinicHas(PRACTICE_ROLES,x.role)||!count(x.salary))||
    [...p.patients,...p.leads].some(x=>!sites.has(x.site)||!['self','plan',...Object.keys(PRACTICE_NETWORKS)].includes(x.cover)||!count(x.balance))||
    p.visits.some(v=>!sites.has(v.site)||!patients.has(v.patient)||!clinicVisitDef(p,v.kind)||!['booked','referred','deferred','completed','expired'].includes(v.status))||
    p.claims.some(x=>x.site!==0&&!sites.has(x.site)||!clinicHas(PRACTICE_NETWORKS,x.payer)||!count(x.amount)||!count(x.due))||
    p.incidents.some(x=>!clinicHas(PRACTICE_INCIDENTS,x.key)||typeof x.closed!=='boolean'))throw Error('Invalid practice site, appointment or insurance claim.');
  if(p.plan!=null&&(!obj(p.plan)||!count(p.plan.reserve)||!Array.isArray(p.plan.tiers)||p.plan.tiers.length!==3||
    p.plan.tiers.some(t=>t!=null&&(!obj(t)||!count(t.coverage)||t.coverage>100||!count(t.premium)||!Array.isArray(t.services)||t.services.some(key=>!clinicVisitDef(p,key))))))throw Error('Invalid in-house insurance plan.');
  if(p.patients.some(q=>q.planTerms!=null&&(!obj(q.planTerms)||!Array.isArray(q.planTerms.services)||
    q.planTerms.services.some(key=>!clinicVisitDef(p,key))||!count(q.planTerms.coverage)||q.planTerms.coverage>100)))throw Error('Invalid patient coverage terms.');
  if(p.pending!=null&&(!obj(p.pending)||typeof p.pending.token!=='string'||!p.incidents.some(x=>x.id===p.pending.id&&!x.closed)||!count(p.pending.age)))throw Error('Invalid clinic decision.');
}
