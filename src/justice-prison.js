const justicePrison=(s=justiceState())=>s.prison;
const justiceTerm=(s=justiceState())=>s.convictions.find(r=>r.id===s.prison?.record);
const prisonFacility=(city,minor)=>city+(minor?' Youth Detention Center':' Correctional Center');
function prisonNew(s,record){
 const p={record:record.id,home:g.city,facility:prisonFacility(g.city||g.country,g.age<18),started:g.age,behavior:62,respect:26,
   funds:0,job:null,items:{},people:[],gang:null,everGang:false,informant:false,actions:{},seen:[],events:0,lastAge:g.age};
 for(const [type,count] of [['inmate',6],['guard',4],['warden',1]])for(let i=0;i<count;i++){
   p.people.push({id:justiceID(s),type,name:justiceName(s),age:type==='inmate'&&g.age<18?justiceRandom(s,13,17):justiceRandom(s,type==='inmate'?19:27,type==='inmate'?64:59),
     bond:justiceRandom(s,35,67),style:justicePick(s,['reserved','even-tempered','outspoken','patient'])});
 }
 record.facility=p.facility;
 return p;
}
function justiceEnterPrison(s,record,remaining){
 if(!s.prison||s.prison.record!==record.id)s.prison=prisonNew(s,record);
 g.jail=remaining;g.juv=Number(g.age<18);
 g.job=null;g.pt=[];g.study=null;g.intern=null;g.office=-1;g.club=null;g.offer=null;g.ue=false;
 if(g.collegeTrack?.current){
   g.collegeTrack.current=null;L('The school ended your current enrollment. Completed qualifications remain on your transcript.');
 }
 for(const x of g.educationJourney?.internships||[])if(x.status==='Active')x.status='Withdrawn';
 g.vent=g.vent.filter(x=>!x.ceo);
 g.event=null;g.result=null;g.ysum=null;g.msq=[];g.hsPopup=null;g.hsQueue=[];g.eduPopup=null;g.msReport=null;g.msTrainPopup=null;g.evq=0;
 iqm=false;
 newsPopupOpen=false;tab='Work';wsel='justice-prison';wsub=null;justicePrisonPage='home';
}
function justiceEnsurePrison(life=g){
 if(!(life.jail>0)||life.justice?.prison)return;
 const s=justiceState(life);
 const prior={id:justiceID(s),caseId:null,charges:['legacy'],age:life.age,country:life.country,sentence:Math.ceil(life.jail),served:0,
   status:'In custody',overturned:false,appealUsed:false,facility:prisonFacility(life.city||life.country,life.age<18),paroleEligible:true,extensions:0};
 s.convictions.push(prior);
 if(!life.rec)life.rec=1;
 life.jail=Math.ceil(life.jail);
 s.prison={record:prior.id,home:life.city,facility:prior.facility,started:life.age,behavior:62,respect:26,
   funds:0,job:null,items:{},people:[],gang:null,everGang:false,informant:false,actions:{},seen:[],events:0,lastAge:life.age};
 for(const [type,count] of [['inmate',6],['guard',4],['warden',1]])for(let i=0;i<count;i++)s.prison.people.push({
   id:justiceID(s),type,name:justiceName(s),age:type==='inmate'&&life.age<18?justiceRandom(s,13,17):justiceRandom(s,19,59),bond:justiceRandom(s,35,67),style:'reserved'});
}
function prisonFinish(status,options={}) {
 const s=justiceState(),p=s.prison,record=justiceTerm(s);
 if(!p||!record)return;
 record.status=status;
 s.terms.push({record:record.id,facility:p.facility,started:p.started,ended:g.age,served:record.served,funds:p.funds,status});
 if(status==='Paroled')s.parole={record:record.id,until:g.age+Math.max(1,g.jail),country:g.country,probation:false};
 if(options.overturned){
   record.overturned=true;g.rec=Math.max(0,g.rec-1);
   if(s.fugitive?.record===record.id)s.fugitive.status='cleared';
   if(s.parole?.record===record.id)s.parole=null;
 }
 s.prison=null;g.jail=0;g.juv=0;g.sn=0;tab='Work';wsel=null;wsub=null;justicePrisonPage='home';
 L('Custody ended. '+status+'.');
}
function prisonChange(p,behavior,respect){
 p.behavior=justiceClamp(p.behavior+behavior);p.respect=justiceClamp(p.respect+respect);
}
function prisonUse(p,key,limit=1){
 const item=p.actions[key];
 if(item?.age===g.age&&item.count>=limit)return false;
 p.actions[key]={age:g.age,count:item?.age===g.age?item.count+1:1};
 return true;
}
function prisonLocked(p,key,limit=1){return p.actions[key]?.age===g.age&&p.actions[key].count>=limit;}
function prisonExtend(p,record,years){
 record.extensions+=years;record.sentence+=years;record.paroleEligible=false;g.jail+=years;
}
function prisonSocial(id,action){
 const s=justiceState(),p=s.prison,person=p&&justiceFind(p.people,id);
 if(!justiceCustody()||s.pending||!person)return;
 const catalog={
  inmate:{talk:['You got to know each other better.',4,4,1],read:['You exchanged reading recommendations.',5,2,3],mediate:['You handled a disagreement calmly.',6,5,5]},
  guard:{ask:['The guard explained the unit schedule.',4,1,3],help:['The guard noticed your cooperation with the unit.',6,1,4],grievance:['Your concern was entered in the grievance log.',2,3,1]},
  warden:{plan:['The warden approved a reentry planning session.',5,1,6],course:['You were placed on a skills program list.',3,1,5],snitch:['You gave a confidential statement. The unit’s response may affect your relationships.',-3,-8,6]}
 };
 const item=catalog[person.type]?.[action];
 if(!item||action==='snitch'&&p.informant||!prisonUse(p,'person-'+id,2))return;
 person.bond=justiceClamp(person.bond+item[1]);prisonChange(p,item[3],item[2]);
 if(action==='course')g.smarts=cl(g.smarts+2);
 if(action==='snitch'){p.informant=true;g.sn=1;}
 justiceOutcome('Prison interaction',item[0]);
}
function prisonJob(key){
 const p=justiceState().prison,d=PRISON_JOBS[key];
 if(!justiceCustody()||!p||!d||p.behavior<d[2]||g.age<d[3]||prisonLocked(p,'job'))return;
 prisonUse(p,'job');p.job=key;justiceOutcome('Work assignment',d[0]+' was assigned. Wages are paid into your prison balance at the next Age Up.');
}
function prisonPurchase(key){
 const s=justiceState(),p=s.prison,d=PRISON_STORE[key],record=justiceTerm(s);
 if(!justiceCustody()||s.pending||!p||!d||p.funds<pr(d[1])||!prisonUse(p,'store',4))return;
 p.funds-=pr(d[1]);
 if(d[4]&&justiceRandom(s,1,100)<=44){
   prisonChange(p,-20,-7);prisonExtend(p,record,1);
   return justiceOutcome('Disciplinary finding','The prohibited item was confiscated. The prison added one year and ended parole eligibility.');
 }
 p.items[key]=(p.items[key]||0)+1;g.happy=cl(g.happy+d[2]);g.smarts=cl(g.smarts+d[3]);
 if(d[4])prisonChange(p,-9,5);else prisonChange(p,2,0);
 justiceOutcome('Prison store',d[0]+' was paid for from your prison balance.');
}
function prisonGang(index,action='join'){
 const s=justiceState(),p=s.prison,group=PRISON_GANGS[index];
 if(!justiceCustody()||s.pending||!p)return;
 if(action==='join'){
   if(!group||p.gang!=null||!prisonUse(p,'gangVisit'))return;
   const threshold=group[1],score=Math.round(p.respect*.55+g.fit*.26+g.smarts*.19);
   if(score<threshold||justiceRandom(s,1,100)>75)return justiceOutcome('Recruitment declined','The group did not offer membership this year.');
   p.gang=index;p.everGang=true;justiceTerm(s).paroleEligible=false;prisonChange(p,-6,10);
   return justiceOutcome('Joined a prison group','Membership changed your standing and ended parole eligibility for this sentence.');
 }
 if(p.gang==null||!['mediate','circle','leave'].includes(action)||!prisonUse(p,'gangAction'))return;
 if(action==='leave'){p.gang=null;prisonChange(p,2,-8);return justiceOutcome('Left the group','The group accepted your departure. The parole restriction remains on this sentence.');}
 prisonChange(p,action==='mediate'?3:-2,action==='mediate'?5:7);
 justiceOutcome('Prison group',action==='mediate'?'You helped settle a disagreement between members.':'You checked in with the group and your standing increased.');
}
function prisonActivities(key){
 const p=justiceState().prison;
 if(!justiceCustody()||!p||!['study','exercise','ged'].includes(key)||key==='ged'&&(g.age<16||g.edu>=1)||!prisonUse(p,key))return;
 if(key==='study'){g.smarts=cl(g.smarts+3);prisonChange(p,6,1);}
 if(key==='exercise'){g.fit=cl(g.fit+4);g.health=cl(g.health+2);prisonChange(p,5,2);}
 if(key==='ged'&&g.age>=16&&g.edu<1){g.edu=1;L('You earned a high school equivalency qualification in custody.');prisonChange(p,8,2);}
 justiceOutcome('Prison program',key==='study'?'You studied in the library.':key==='exercise'?'You completed a yard exercise session.':'You completed the equivalency program.');
}
function prisonAppeal(index){
 const s=justiceState(),pending=s.pending,record=justiceTerm(s),option=JUSTICE_APPEALS[index];
 if(pending?.kind!=='appeal'||!option||!record||record.appealUsed||!justiceCustody()||g.cash<pr(option[1]))return;
 const cost=pr(option[1]);g.cash-=cost;LD('Criminal appeal fees',-cost);
 record.appealUsed=true;
 const old=justiceFind(s.cases,record.caseId),chance=Math.max(5,Math.min(62,option[2]*.7+(65-(old?.evidence||65))*.44-(record.extensions?8:0)));
 if(justiceRandom(s,1,100)<=chance){
   if(old){old.status='overturned';old.result='Conviction overturned';}
   prisonFinish('Overturned',{overturned:true});
   return justiceOutcome('Appeal granted','The court overturned this conviction. You were released and this conviction no longer counts toward your active record.');
 }
 return justiceOutcome('Appeal denied','The original judgment stands. Your remaining sentence is unchanged.');
}
function prisonParoleEligible(p,r){
 return p&&r&&r.paroleEligible&&!r.extensions&&!p.everGang&&p.behavior===100&&r.served>=Math.max(1,Math.ceil(r.sentence*.5));
}
function prisonTryEscape(){
 const s=justiceState(),p=s.prison,r=justiceTerm(s);
 if(!justiceCustody()||!p||!r||s.pending?.kind!=='escape')return;
 if(!prisonUse(p,'escape'))return justiceOutcome('Escape attempt unavailable','Only one attempt is available per year.');
 const left=g.jail;
 if(justiceRandom(s,1,100)<=Math.min(19,5+Math.floor((g.health+g.fit)/25))){
   r.status='Fugitive';r.paroleEligible=false;
   s.fugitive={status:'atLarge',record:r.id,home:g.city,country:g.country,left,age:g.age,lastCheck:g.age};
   g.jail=0;g.juv=0;g.sn=0;
   tab='Work';wsel=null;wsub=null;
   return justiceDecision('fugitive');
 }
 prisonExtend(p,r,2);prisonChange(p,-28,-5);
 return justiceOutcome('Escape attempt failed','Your sentence grew by two years and parole is no longer available.');
}
function justiceRecapture(s){
 const f=s.fugitive,r=justiceFind(s.convictions,f.record);
 f.status='returned';
 const extra=2;
 r.extensions+=extra;r.sentence+=extra;r.status='In custody';r.paroleEligible=false;
 if(!r.charges.includes('escape'))r.charges.push('escape');
 if(g.country!==f.country)relocate(f.country);
 g.city=f.home||g.city;
 justiceEnterPrison(s,r,f.left+extra);
 return justiceOutcome('Returned to custody','You were returned to prison. The sentence grew by two years and parole is unavailable.');
}
function justiceRelocationMarker(s){
 const current=s.relocation;
 if(!current)s.relocation={contacts:g.rel.filter(x=>x.alive).map(x=>({id:x.id,city:g.city,country:g.country})),visited:{}};
}
function justiceFugitiveMove(action){
 const s=justiceState(),f=s.fugitive;
 if(s.pending?.kind!=='fugitive'||f?.status!=='atLarge'||!['home','city','border'].includes(action))return;
 const locations=(CITY[g.country]||'Capital').split('|').filter(x=>x!==g.city);
 const security=justiceRandom(s,22,71);
 const risk=action==='home'?79:action==='city'?48:security;
 if(justiceRandom(s,1,100)<=risk)return justiceRecapture(s);
 if(action==='home'){
   g.city=f.home||g.city;
   return justiceOutcome('Returned home','The immediate return passed without arrest. You are still wanted and can face a later custody check.');
 }
 justiceRelocationMarker(s);
 if(action==='city'){
   if(locations.length)g.city=justicePick(s,locations);
   return justiceOutcome('Moved cities','You relocated by surface transit. Contacts left behind are now long-distance. The warrant remains active.');
 }
 const countries=Object.keys(g.w).filter(x=>x!==g.country);
 const regional=justiceRegion(g.country).filter(x=>countries.includes(x));
 const other=justicePick(s,regional.length?regional:countries);
 relocate(other);
 f.status='abroad';f.destination=other;
 const record=justiceFind(s.convictions,f.record);if(record)record.status='Unserved sentence abroad';
 if(s.prison&&record)s.terms.push({record:record.id,facility:s.prison.facility,started:s.prison.started,ended:g.age,served:record.served,funds:s.prison.funds,status:'Escape abroad'});
 s.prison=null;
 return justiceOutcome('Relocated abroad','You settled in a different country. This escape no longer triggers routine checks abroad. The original conviction remains on your record.');
}
function justiceRegion(country){
 const regions=[['United States','Canada','Mexico'],['United Kingdom','France','Germany','Spain','Italy','Netherlands','Belgium'],
  ['Japan','South Korea','China','Taiwan'],['Australia','New Zealand','Indonesia'],['India','Pakistan','Bangladesh'],
  ['Brazil','Argentina','Chile','Colombia'],['Russia','Ukraine','Poland'],['United Arab Emirates','Saudi Arabia','Qatar']];
 return regions.find(x=>x.includes(country))||[];
}
function prisonEventChoice(index){
 const s=justiceState(),p=s.prison,q=s.pending,row=PRISON_EVENTS.find(x=>x[0]===q?.event);
 if(!justiceCustody()||q?.kind!=='prisonEvent'||!p||!row||![0,1].includes(index))return;
 const who=g.rel.find(x=>x.id===q.person&&x.alive);
 prisonChange(p,row[4][index],row[3][index]);
 if(who)who.bond=cl(who.bond+(index===0?6:2));
 if(['library','course'].includes(row[0]))g.smarts=cl(g.smarts+(index===0?3:1));
 if(row[0]==='health')g.health=cl(g.health+(index===0?4:1));
 if(row[0]==='recruit'&&index===1)p.respect=justiceClamp(p.respect+3);
 justiceOutcome('Prison event',row[2][index]+'. '+(index===0?'Your response improved your standing or helped you prepare for release.':'You recorded your choice and the unit moved on.'));
}
function prisonAnnualEvent(s,p){
 const family=g.rel.filter(x=>x.alive&&['fam','fri'].includes(x.t));
 const eligible=PRISON_EVENTS.filter(row=>(!['letter','visit'].includes(row[0])||family.length)&&
   (row[0]!=='work'||p.job)&&(row[0]!=='recruit'||p.gang==null));
 let options=eligible.filter(row=>!p.seen.includes(row[0]));
 if(!options.length){p.seen=[];options=eligible;}
 const row=justicePick(s,options);
 p.seen.push(row[0]);p.events++;
 s.pending={kind:'prisonEvent',event:row[0],person:['letter','visit'].includes(row[0])?justicePick(s,family)?.id:null};
}

function prisonLedger(s){
 const change=(label,amount)=>{amount=Math.round(amount);if(!amount)return;g.cash+=amount;LD(label,amount);};
 const interest=g.bank.id!=null?Math.round(g.bank.sav*rt(g.bank.id)/100):0;
 if(interest){g.bank.sav+=interest;LD('Savings interest',interest);}
 for(const [type,,[low,high]] of STK){
   if(g.inv[type]>0)g.inv[type]=Math.max(0,Math.round(g.inv[type]*(100+justiceRandom(s,low,high))/100));
 }
 const [government,pension]=pens();
 change('Pension payments',government+pension);
 for(const c of stuffAllCars()){
   c.age=(c.age||0)+1;c.cleanliness=cl((c.cleanliness??70)-14);c.condition=cl((c.condition??80)-11);
   c.v=Math.max(Math.round((c.purchasePrice||c.v)*.025),Math.round(c.v*.86));
   change('Vehicle upkeep',-Math.max(pr(250),c.v*.015));
 }
 for(const h of stuffAllHomes().filter(x=>x.own)){
   h.cleanliness=cl((h.cleanliness??70)-14);h.condition=cl((h.condition??80)-9);
   h.v=Math.max(0,Math.round(h.v*(h.condition<45?.91:.97)));
   change('Property tax and upkeep',-h.v*.013);
 }
 housingYear(true);
 g.loans=g.loans.filter(loan=>{
   const opening=Math.max(0,loan.bal||0),interest=Math.round(opening*(loan.rate||0)/100);
   const term=Math.max(1,Number(loan.yearsLeft)||9);
   const principal=Math.min(opening,Math.ceil(opening/term));
   const paid=Math.min(Math.max(0,Math.floor(g.cash)),interest+principal);
   loan.bal=opening+interest-paid;
   if(loan.yearsLeft>1)loan.yearsLeft--;
   change('Scheduled loan payments',-paid);
   return loan.bal>0;
 });
 if(g.cc?.bal>0&&typeof finCardYear==='function')finCardYear();
 else if(g.cc?.bal>0){
   g.cc.bal=Math.round(g.cc.bal*(1+(CARDS[g.cc.i]?.[2]||19)/100));
   const paid=Math.min(Math.max(0,g.cash),Math.round(g.cc.bal*.05));
   g.cc.bal-=paid;change('Credit card payment',-paid);
 }
}
function prisonFamilyYear(s){
 const news=[];
 for(const r of g.rel.filter(x=>x.alive)){
   r.age++;
   if(r.age>75&&justiceRandom(s,1,100)<Math.min(93,(r.age-70)*2)){
     Object.assign(r,{alive:false,deceased:true,deathAge:r.age,deathAt:g.age,deathCause:'old age',memory:'You knew '+r.n+' as your '+String(r.role||'relative').toLowerCase()+'.'});
     g.happy=cl(g.happy-8);news.push(r.n+' died of old age.');
   }else if(r.age>48&&justiceRandom(s,1,100)<=3)news.push(r.n+' has been ill and is recovering.');
 }
 const pregnancy=g.repro?.pregnancy;
 if(pregnancy&&g.age>=pregnancy.dueAge){
   const child=relationshipAddChild(pregnancy.method||'Natural birth',0);
   g.repro.pregnancy=null;g.repro.attempts=0;
   news.push(child.n+' was born. The family update is saved in your relationship record.');
 }
 for(const line of news)L(uiEscape(line));
 return news;
}
function prisonAgeUp(){
 const s=justiceState(),p=s.prison,r=justiceTerm(s);
 if(!p||!r||s.pending||g.event||g.result||newsPopupOpen||!g.alive)return;
 g.age++;p.lastAge=g.age;g.led={};g.fin=null;
 const family=prisonFamilyYear(s);
 prisonLedger(s);
 if(typeof finYear==='function')finYear();
 g.health=cl(g.health-(g.age>52?justiceRandom(s,1,3):1)-g.cond.length);
 g.happy=cl(g.happy-2);
 for(const person of p.people)person.age++;
 r.served++;g.jail--;
 if(p.job){const wages=pr(PRISON_JOBS[p.job][1]);p.funds+=wages;L('Prison wages '+loc(wages)+' deposited into your commissary balance.');}
 prisonChange(p,p.gang==null?5:1,0);
 if(p.informant&&p.gang!=null&&justiceRandom(s,1,100)<=25){prisonChange(p,-3,-5);L('The group distanced itself after your confidential report.');}
 const next=()=>{
   if(family.length)justiceDecision('outcome',{title:'News from home',text:family.join(' '),next:s.pending});
   else draw(1);
 };
 if(g.health<=0||g.age>76&&justiceRandom(s,1,100)<(g.age-70)*2){
   r.status='Died in custody';g.alive=false;g.cause='illness or old age in custody';return go('death');
 }
 if(g.jail<=0){prisonFinish('Sentence complete');s.pending={kind:'outcome',title:'Released from custody',text:'You finished your sentence. Your usual menus are available again. The conviction and time served are in the prison record.',next:null};return next();}
 if(prisonParoleEligible(p,r)){
   s.pending={kind:'paroleReview'};
 }else{
   prisonAnnualEvent(s,p);
 }
 tab='Work';wsel='justice-prison';next();
}
function prisonParole(choice){
 const s=justiceState(),p=s.prison,r=justiceTerm(s);
 if(s.pending?.kind!=='paroleReview'||!justiceCustody()||!prisonParoleEligible(p,r)||!prisonUse(p,'parole'))return;
 if(choice==='accept'&&justiceRandom(s,1,100)<=Math.min(92,52+Math.round(r.served/r.sentence*29)+Math.round(p.respect/8))){
   prisonFinish('Paroled');
   return justiceOutcome('Parole granted','You were released under supervision. The conviction remains on your record.');
 }
 justiceOutcome('Parole review',choice==='accept'?'The board denied release this year. Your original sentence continues.':'You deferred the review. Your original sentence continues.');
}
