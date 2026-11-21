/* Bridge legacy incidents and the shared life simulator into the justice records. */
const justiceOldFix=fix2;
fix2=function(life){const result=justiceOldFix(life);justiceEnsurePrison(result);return result;};
let justiceUiOwner=null;
const justiceOldDraw=draw;
draw=function(reset){
 if(scr==='game'&&g){
   justiceEnsurePrison();
   if(justiceUiOwner!==g){
     justiceUiOwner=g;
     if(justiceCustody()){wsel=null;justicePrisonPage='home';}
   }
   const redirect=g.event?.justiceArrest;
   if(redirect&&!justiceCustody()){
     g.event=null;g.evq=0;
     const key=justiceLegacyKey(redirect.label,redirect.minimum,redirect.maximum);
     if(!justiceCurrent(justiceState()))return justiceBook({key,source:'Police reported '+String(redirect.label||'a suspected offense')});
   }
   if(justiceCustody()){
     tab='Work';wsub=null;
     g.event=null;g.result=null;g.ysum=null;g.eduPopup=null;g.hsPopup=null;
     g.msq=[];g.hsQueue=[];g.msReport=null;g.msTrainPopup=null;g.evq=0;
   }
 }
 return justiceOldDraw(reset);
};
const justiceHousingIncident=housingResolveIncident;
housingResolveIncident=function(choice){
 const incident=g.housing?.incidents.find(x=>x.id===choice.id),was=incident?.resolved;
 const result=justiceHousingIncident(choice);
 if(incident?.resolved&&!was&&['Street robbery','Break-in'].includes(incident.type)){
   civilAddVictim('theft',null,'Investigators identified a possible civil defendant after the reported '+incident.type.toLowerCase()+'.');
 }
 return result;
};
const justiceOldAgeUp=ageUp;
ageUp=function(){
 if(!g||!g.alive||g.justice?.pending)return;
 if(justiceCustody())return prisonAgeUp();
 const age=g.age,priorJob=g.job,result=justiceOldAgeUp();
 if(g.age>age&&g.alive&&scr==='game'){
   const s=g.justice||(g.age>=16?justiceState():null);
   if(s){
     if(priorJob&&!g.job&&priorJob.yrs>=2&&!g.jail&&g.ue)civilAddVictim('firing',priorJob.company||'Former employer');
     const pending=s.pending;justiceAfterAge(s);
     if(s.pending!==pending)draw(1);
   }
 }
 return result;
};
function justiceAfterAge(s){
 if(s.parole?.until<=g.age){
   const r=justiceFind(s.convictions,s.parole.record);
   if(r)r.status=s.parole.probation?'Probation completed':'Parole completed';
   s.parole=null;
 }
 if(justiceAtLarge()&&!justiceCurrent(s)&&!s.pending&&s.fugitive.lastCheck<g.age){
   s.fugitive.lastCheck=g.age;
   if(justiceRandom(s,1,100)<=31)return justiceRecapture(s);
 }
 justiceCourtDue(s,true);
 if(!s.pending&&!justiceCurrent(s)&&!justiceCustody()){
   const incident=s.incidents.find(x=>!x.resolved&&x.due<=g.age&&(!x.country||x.country===g.country)&&!(s.fugitive?.status==='abroad'&&x.age<=s.fugitive.age));
   if(incident){
     s.pending={kind:'stop',key:incident.key,charges:incident.charges||[incident.key],incident:incident.id,evidence:incident.evidence,source:incident.source};
     return;
   }
 }
 civilAnnual(s);
}
const justiceOldPick=pick;
pick=function(index){
 const event=g.event,choice=event?.c?.[index];
 if(!choice)return;
 if(event.justiceArrest){
   g.event=null;
   return justiceBook({key:justiceLegacyKey(event.justiceArrest.label,event.justiceArrest.minimum,event.justiceArrest.maximum),
     source:'Police recorded '+event.justiceArrest.label});
 }
 const effect=choice[1]||{},job=g.job;
 if(!justiceCustody()&&effect.j>0){
   const {j,rec,...rest}=effect;
   g.event={...event,c:event.c.map((x,i)=>i===index?[choice[0],rest,'The incident was referred for court review.']:x)};
   const result=justiceOldPick(index);
   const s=justiceState();
   if(!justiceCurrent(s)){
     g.event=null;
     justiceBook({key:justiceLegacyKey(event.x,1,j),source:'Police referred an incident for court review'});
   }
   return result;
 }
 const result=justiceOldPick(index);
 if(job&&!g.job&&effect.fire&&!justiceCustody())civilAddVictim('firing',job.company||'Former employer',
   'Your employer dismissed you after a workplace dispute. Review the written terms to decide whether to file.');
 return result;
};
const justiceOldChain=chain;
chain=function(){if(justiceCustody()||g.justice?.pending){g.evq=0;return;}return justiceOldChain();};
raid=function(){
 const label=g.evade||g.shell?'suspected tax evasion':g.gang?'suspected organized smuggling':'suspected financial fraud';
 g.event=arrest(label,1,6);
};
crimeV=function(){return justiceCustody()?prisonView():justiceCrimeView();};
doCrime=function(index){const entry=CR[index];if(entry)justiceStart(justiceLegacyKey(entry.n,entry.a,entry.b));};
org=function(index){const d=ORG[index];if(d&&g.gang)justiceStart(index===2?'racket':'smuggling');};
escape=function(){prisonShowPrompt('escape');};
appeal=function(){prisonShowPrompt('appeal');};

function justiceLicenseRestricted(job){
 if(!g.rec)return false;
 const titles=['Medical resident','Physician','Senior physician','Attorney','Paralegal','Police officer','Enlist as a soldier','Military officer',
   'Security guard','Pilot','Commercial pilot','Teacher'];
 if(titles.includes(job[0]))return true;
 return job[1]==='finance'&&!!g.justice?.convictions.some(r=>!r.overturned&&r.charges.some(k=>['fraud','embezzle','identity','tax','bribery'].includes(k)));
}
const justiceOldJobSpecific=collegeSpecificJobMet;
collegeSpecificJobMet=function(job){return justiceOldJobSpecific(job)&&!justiceLicenseRestricted(job);};
const justiceOldJobPreview=collegeJobPreview;
collegeJobPreview=function(type,index){
 const job=JB[type]?.[index],html=justiceOldJobPreview(type,index);
 return job&&justiceLicenseRestricted(job)?html.replace('<div class=ev>','<div class=ev><p class=d>An active conviction disqualifies you from this position.</p>'):html;
};
const justiceOldTrip=trip;
trip=function(country){return justiceAtLarge()||justiceCustody()?toast('Ordinary travel is unavailable while your warrant is active or you are in custody.'):justiceOldTrip(country);};
const justiceOldEmi=emi;
emi=function(country){return justiceAtLarge()||justiceCustody()?toast('Ordinary emigration is unavailable while your warrant is active or you are in custody.'):justiceOldEmi(country);};
const justiceOldStudyAbroad=studyAbroad;
studyAbroad=function(country){return justiceAtLarge()||justiceCustody()?toast('Study abroad is unavailable while your warrant is active or you are in custody.'):justiceOldStudyAbroad(country);};
const justiceOldVac=vacV;
vacV=function(){return justiceAtLarge()?'<p>Ordinary travel is unavailable while your warrant is active.</p>'+B('Review fugitive options','justiceFugitiveOpen()'):justiceOldVac();};
function justiceDistance(person){
 const node=g.justice?.relocation?.contacts.find(x=>x.id===person?.id);
 return person?.alive&&node&&(node.city!==g.city||node.country!==g.country)?node:null;
}
function justiceContact(id,action){
 const person=g.rel.find(r=>r.id===id),state=justiceState().relocation;
 if(!justiceDistance(person)||justiceCustody()||!['call','letter','visit'].includes(action))return;
 const key=id+'-'+action;
 if(state.visited[key]===g.age)return toast('You already made this contact this year.');
 if(action==='visit'&&justiceAtLarge())return toast('Visits are unavailable while the warrant is active.');
 const cost=action==='visit'?pr(450):action==='letter'?pr(5):0;
 if(cost>0&&g.cash<cost)return toast('Personal cash cannot cover the cost.');
 state.visited[key]=g.age;
 person.bond=cl(person.bond+(action==='visit'?8:action==='call'?4:3));
 relationshipSyncAll();
 A({m:-cost,p:2},(action==='visit'?'You arranged a visit with ':action==='call'?'You called ':'You wrote to ')+uiEscape(person.n)+'.');
}
const justiceOldRelations=relV;
relV=function(){
 const person=sel&&g.rel.find(x=>x.id===sel),node=justiceDistance(person);
 if(node)return B('Back to Relationships','relationshipBack()')+justiceSection(person.n,
   `<p>Long-distance · ${uiEscape(node.city||'')}, ${uiEscape(node.country)}.</p>`+Bar('Bond',person.bond,'#528a78')+
   [['Call','call'],['Write a letter','letter'],['Arrange a visit','visit']].map(([label,key])=>B(label+(key==='visit'?' · '+loc(pr(450)):''),
    `justiceContact('${person.id}','${key}')`,g.justice.relocation.visited[person.id+'-'+key]===g.age||key==='visit'&&justiceAtLarge())).join(''));
 const html=justiceOldRelations();
 if(!sel&&g.rel.some(x=>justiceDistance(x))){
   const root=document.createElement('div');root.innerHTML=html;
   for(const b of root.querySelectorAll('button[onclick="spendAll()"]'))b.remove();
   return '<p class="d">Some of your relationships are long-distance. Open their profiles for calls, letters and visits.</p>'+root.innerHTML;
 }
 return html;
};
const justiceOldNavigate=nv;
nv=function(scope,key){
 if(scope==='O'&&['Crime','Lawsuits'].includes(key))justiceState().tracking=true;
 return justiceOldNavigate(scope,key);
};
OMENU.push(['Prison record','Convictions, court dates, custody and supervision'],['Lawsuits','Civil incidents, hearings, settlements and appeals']);
const justiceOldOther=otherV;
otherV=function(){
 if(NV.O[0]==='Prison record')return B('Back to Other',"NV.O=[];draw(1)")+justiceRecordView();
 if(NV.O[0]==='Lawsuits')return B('Back to Other',"NV.O=[];draw(1)")+civilView();
 return justiceOldOther();
};
const justiceOldWork=workV;
workV=function(){
 if(justiceCustody())return wsel==='justice-prison'?prisonView():justiceCustodySlot();
 const html=justiceOldWork(),c=g.justice&&justiceCurrent(g.justice);
 return !wsel&&!wsub&&c?justiceSection('Court date',justiceDocket())+html:html;
};
const justiceOldMain=mainTabOpen;
mainTabOpen=function(section){if(justiceCustody()&&section!=='Work')return;return justiceOldMain(section);};
const justiceOldGame=gameView;
gameView=function(){
 const html=justiceOldGame(),inCustody=justiceCustody(),pending=g.justice?.pending;
 if(!inCustody&&!pending&&!justiceAtLarge())return html;
 const root=document.createElement('div');root.innerHTML=html;
 if(inCustody){
   for(const element of root.querySelectorAll('.mo'))element.remove();
   for(const button of root.querySelectorAll('.nav button,.hd button,.bot button:not(.up)')){
     if(button.textContent.trim()==='Work')continue;
     button.disabled=true;button.removeAttribute('onclick');
   }
   for(const element of root.querySelectorAll('.bot [onclick]:not(button)')){
     element.removeAttribute('onclick');element.setAttribute('aria-disabled','true');
   }
   const p=g.justice?.prison,head=root.querySelector('.hd .row>span:nth-child(2)');
   if(head&&p)head.insertAdjacentHTML('beforeend',`<small class="justice-balance">Prison funds ${loc(p.funds)}</small>`);
 }
 if(!inCustody&&justiceAtLarge()){
   const sub=root.querySelector('.hd .sub');
   if(sub)sub.insertAdjacentHTML('beforeend',' <strong>· Fugitive</strong>');
 }
 if(pending&&!root.querySelector('.mo')){
   const popup=justiceModal(g.justice,pending);
   if(popup)root.querySelector('.game').insertAdjacentHTML('beforeend',popup);
 }
 return root.innerHTML;
};

function justiceValidate(life){
 const s=life.justice,object=x=>!!x&&typeof x==='object'&&!Array.isArray(x),count=x=>Number.isSafeInteger(x)&&x>=0;
 const bar=x=>count(x)&&x<=100,offense=x=>justiceHas(JUSTICE_OFFENSES,x);
 const charges=x=>Array.isArray(x)&&x.length>0&&x.every(offense);
 if(!object(s)||s.version!==1||!count(s.seed)||!count(s.serial)||!['cases','incidents','civil','victims','convictions','terms','seen'].every(k=>Array.isArray(s[k])))throw Error('Invalid justice records.');
 const keys=['cases','incidents','civil','victims','convictions'];
 const entries=keys.flatMap(k=>s[k]);
 if(entries.some(x=>!object(x)||!count(x.id)||x.id>s.serial)||new Set(entries.map(x=>x.id)).size!==entries.length)throw Error('Invalid justice record IDs.');
 const cases=new Set(s.cases.map(x=>x.id)),records=new Set(s.convictions.map(x=>x.id)),victims=new Set(s.victims.map(x=>x.id));
 if(s.cases.some(c=>!charges(c.charges)||!offense(c.key)||!bar(c.evidence)||!count(c.due)||!count(c.filed)||![1,2,3,4,5,6,7,8,9,10,11,12].includes(c.month)||
   !['booking','scheduled','acquitted','convicted','overturned'].includes(c.status)||c.status==='scheduled'&&(!object(c.lawyer)||!bar(c.lawyer.skill))||
   c.record!=null&&!records.has(c.record))||s.incidents.some(i=>!offense(i.key)||typeof i.resolved!=='boolean'||!count(i.due)||!bar(i.evidence)||
   i.charges!=null&&!charges(i.charges))||s.convictions.some(r=>!charges(r.charges)||!count(r.sentence)||!count(r.served)||r.served>r.sentence||r.months!=null&&(!count(r.months)||r.months>11)||
   r.caseId!=null&&!cases.has(r.caseId)||typeof r.status!=='string'||typeof r.overturned!=='boolean'||typeof r.paroleEligible!=='boolean'||!count(r.extensions)))throw Error('Invalid criminal case or sentence.');
 if(s.victims.some(v=>!justiceHas(CIVIL_TYPES,v.key)||typeof v.defendant!=='string'||!bar(v.evidence)||!count(v.value)||!count(v.age))||
    s.civil.some(c=>!victims.has(c.victim)||!bar(c.evidence)||!bar(c.leverage)||!count(c.due)||!count(c.value)||!count(c.expenses)||!count(c.paid)||c.status==='offer'&&!count(c.offer)||
      !['investigation','discovery','negotiation','trial'].includes(c.stage)||!['open','offer','appealWindow','appealFiled','appealReady','closed','withdrawn'].includes(c.status)||
      !Array.isArray(c.history)))throw Error('Invalid civil case.');
 const p=s.prison;
 if(p!=null&&(!object(p)||!records.has(p.record)||typeof p.facility!=='string'||!bar(p.respect)||!bar(p.behavior)||!count(p.funds)||
    !Array.isArray(p.people)||p.people.some(x=>!object(x)||!count(x.id)||!bar(x.bond)||!['inmate','guard','warden'].includes(x.type))||
    p.gang!=null&&!PRISON_GANGS[p.gang]||p.job!=null&&!justiceHas(PRISON_JOBS,p.job)||!object(p.actions)||!object(p.items)))throw Error('Invalid prison placement.');
 if(s.fugitive!=null&&(!object(s.fugitive)||!records.has(s.fugitive.record)||!['atLarge','returned','abroad','cleared'].includes(s.fugitive.status)||!count(s.fugitive.left)))throw Error('Invalid warrant.');
 if(s.parole!=null&&(!object(s.parole)||!records.has(s.parole.record)||!count(s.parole.until)))throw Error('Invalid parole record.');
 if(s.relocation!=null&&(!object(s.relocation)||!Array.isArray(s.relocation.contacts)||!object(s.relocation.visited)))throw Error('Invalid relocation record.');
 const validPending=(q,depth=0)=>{
   if(q==null)return true;
   if(!object(q)||depth>3)return false;
   if(q.kind==='outcome')return typeof q.title==='string'&&typeof q.text==='string'&&validPending(q.next,depth+1);
   if(q.kind==='plan')return offense(q.key)&&object(q.options)&&Object.keys(JUSTICE_PLANS).every(k=>Array.isArray(q.options[k])&&
     q.options[k].length>0&&q.options[k].every(v=>JUSTICE_PLANS[k][1].includes(v)));
   if(q.kind==='stop')return offense(q.key)&&charges(q.charges)&&bar(q.evidence)&&typeof q.source==='string';
   if(['bribe','fight'].includes(q.kind))return q.stop?.kind==='stop'&&validPending(q.stop,depth+1);
   if(['booked','hearing','reschedule'].includes(q.kind))return cases.has(q.id);
   if(q.kind==='prisonEvent')return PRISON_EVENTS.some(x=>x[0]===q.event);
   if(q.kind==='victim')return victims.has(q.id);
   if(q.kind==='civilStage')return s.civil.some(x=>x.id===q.id)&&(q.stage==='review'||justiceHas(CIVIL_STAGES,q.stage));
   return ['appeal','escape','fugitive','paroleReview'].includes(q.kind);
 };
 if(!validPending(s.pending))throw Error('Invalid justice decision.');
}
