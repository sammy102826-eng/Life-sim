const justiceHas=(data,key)=>Object.hasOwn(data,key);
const justiceClamp=n=>Math.round(Math.min(100,Math.max(0,n)));
const justiceFind=(list,id)=>list.find(x=>x.id===id);
const justiceID=s=>++s.serial;
function justiceRandom(s,a,b){
 s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;
 return a+Math.floor(s.seed/4294967296*(b-a+1));
}
const justicePick=(s,list)=>list[justiceRandom(s,0,list.length-1)];
const justiceName=s=>justicePick(s,JUSTICE_NAMES)+' '+justicePick(s,JUSTICE_LAST);
function justiceState(life=g){
 return life.justice??={version:1,seed:[...life.name+'|'+life.birth].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261),
   serial:0,pending:null,cases:[],incidents:[],civil:[],victims:[],convictions:[],prison:null,terms:[],fugitive:null,relocation:null,parole:null,
   seen:[],ageTaken:null,lastVictim:null};
}
const justiceOffense=key=>JUSTICE_OFFENSES[key]||JUSTICE_OFFENSES.legacy;
const justiceCurrent=s=>s.cases.find(x=>['booking','scheduled'].includes(x.status));
const justiceCustody=()=>Number(g?.jail)>0;
const justiceAtLarge=()=>g.justice?.fugitive?.status==='atLarge';
const justiceQuiet=()=>!!(publicityBusy()||g.lawFirm?.receipt||g.practicePrompt||g.studioPrompt||g.studio?.pending||g.studio?.notices?.length);
function justiceDecision(kind,values={}){
 justiceState().pending={kind,...values};
 draw();
}
function justiceOutcome(title,text,next=null){
 justiceDecision('outcome',{title,text,next});
}
function justiceContinue(){
 const s=justiceState(),p=s.pending;
 if(p?.kind!=='outcome')return;
 s.pending=p.next||null;
 draw();
}
function justiceStart(key){
 const d=justiceOffense(key),s=justiceState();
 if(!justiceHas(JUSTICE_OFFENSES,key)||g.age<d[2]||justiceCustody()||justiceQuiet()||s.pending||justiceCurrent(s)||key==='embezzle'&&!g.job)return;
 if(s.ageTaken===g.age)return toast('You already attempted a crime this year.');
 if(d[1]==='Organized crime'&&!g.gang)return toast('This storyline requires an existing outside gang affiliation.');
 const options={};
 for(const [slot,def] of Object.entries(JUSTICE_PLANS)){
   const start=justiceRandom(s,0,def[1].length-1),count=Math.min(3,def[1].length);
   options[slot]=Array.from({length:count},(_,i)=>def[1][(start+i)%def[1].length]);
 }
 justiceDecision('plan',{key,options});
}
function justiceAttempt(){
 const s=justiceState(),p=s.pending;
 if(p?.kind!=='plan'||justiceCustody()||s.ageTaken===g.age)return;
 const key=p.key,d=justiceOffense(key),scene={};
 for(const slot of Object.keys(JUSTICE_PLANS)){
   const value=document.getElementById('justice-'+slot)?.value;
   if(!p.options[slot].includes(value))return;
   scene[slot]=value;
 }
 s.ageTaken=g.age;
 const aptitude=g.talent==='stealth'?1:g.talent?-.45:0;
 const hit=justiceRandom(s,1,100)<=cl(d[6]+8*aptitude,1,99),stopped=!hit&&justiceRandom(s,1,100)<=59-10*aptitude;
 g.heat=cl((g.heat||0)+(d[4]>=5?12:5));
 if(stopped){
   return justiceDecision('stop',{key,charges:[key],evidence:justiceClamp(d[9]+justiceRandom(s,-9,9)),source:justicePick(s,JUSTICE_EVIDENCE),incident:0});
 }
 const gain=hit?pr(justiceRandom(s,d[7],d[8])):0;
 if(gain){g.cash+=gain;LD('Crime proceeds',gain);}
 const follow=justiceRandom(s,1,100)<(hit?50:23)||justiceAtLarge();
 if(follow){
   s.incidents.push({id:justiceID(s),key,age:g.age,country:g.country,due:g.age+justiceRandom(s,1,3),evidence:justiceClamp(d[9]-justiceRandom(s,6,20)),
     source:justicePick(s,JUSTICE_EVIDENCE),scene,resolved:false});
 }
 const text=hit?(gain?'The attempt succeeded in the simulation. You received '+loc(gain)+'.':'The incident ended without an immediate arrest. No money changed hands.'):
   'The attempt failed. You left without any money or an immediate arrest.';
 L(d[0]+' · '+text);
 return justiceOutcome(hit?'Incident outcome':'Attempt failed',text+(follow?' Investigators could reopen the incident later.':''));
}
function justiceLegacyKey(label,min,max){
 const text=String(label||'').toLowerCase();
 const groups=[['bank','bank'],['robbery','bank'],['burgl','burglary'],['shoplift','shoplifting'],['auto','vehicle'],['pickpocket','theft'],
   ['theft','theft'],['assault','assault'],['murder','homicide'],['tax','tax'],['embezz','embezzle'],['fraud','fraud'],
   ['brib','bribery'],['vandal','vandalism'],['smuggl','smuggling'],['drugs','smuggling'],['racket','racket'],['trespass','trespass']];
 return groups.find(([part])=>text.includes(part))?.[1]||(max>=6?'fraud':max<=1?'shoplifting':'legacy');
}
function justiceBook(context){
 const s=justiceState();
 if(justiceCurrent(s))return '';
 const key=context.key||'legacy',main=justiceOffense(key),charges=[...new Set(context.charges||[key])];
 const jury=charges.some(k=>justiceOffense(k)[5]==='jury');
 const wait=jury?justiceRandom(s,10,22):justiceRandom(s,2,7);
 const c={id:justiceID(s),key,charges,evidence:context.evidence??main[9],source:context.source||'A formal police report was filed',filed:g.age,
   due:g.age+Math.floor((wait-1)/12),month:(wait-1)%12+1,venue:jury?'Jury trial':'Judge hearing',status:'booking',lawyer:null,
   cooperation:!!context.cooperation,record:null,result:null};
 s.cases.push(c);
 if(context.incident){
   const i=justiceFind(s.incidents,context.incident);
   if(i)i.resolved=true;
 }
 justiceDecision('booked',{id:c.id});
 return c;
}
function justiceStop(action){
 const s=justiceState(),p=s.pending;
 if(p?.kind!=='stop')return;
 if(action==='cooperate')return justiceBook({...p,cooperation:true});
 if(action==='bribe')return justiceDecision('bribe',{stop:p});
 if(action==='fight')return justiceDecision('fight',{stop:p});
 if(action==='persuade'){
   if(!p.asked&&justiceRandom(s,1,100)<=8){
     const i=justiceFind(s.incidents,p.incident);if(i)i.resolved=true;
     return justiceOutcome('Released without arrest','The officer ended the stop. The case did not go to court.');
   }
   return justiceDecision('stop',{...p,asked:true,message:'The officer kept the stop open.'});
 }
 if(action==='run')return justiceConfront(p,false);
}
function justiceBracketBack(){
 const s=justiceState(),p=s.pending;
 if(['bribe','fight'].includes(p?.kind))justiceDecision('stop',p.stop);
}
function justiceBribe(){
 const s=justiceState(),p=s.pending;
 if(p?.kind!=='bribe')return;
 const amount=Number(document.getElementById('justice-bribe')?.value);
 if(!Number.isSafeInteger(amount)||amount<1||amount>Math.min(Math.floor(g.cash),pr(25000)))return;
 g.cash-=amount;LD('Money lost during police contact',-amount);
 if(justiceRandom(s,1,100)<=Math.min(21,3+Math.floor(amount/Math.max(1,pr(1600))))){
   const i=justiceFind(s.incidents,p.stop.incident);if(i)i.resolved=true;
   return justiceOutcome('Released without arrest','The encounter ended. The money was lost and this case was not filed.');
 }
 return justiceBook({...p.stop,charges:[...p.stop.charges,'bribery'],evidence:justiceClamp(p.stop.evidence+7)});
}
function justiceFight(){
 const p=justiceState().pending;
 if(p?.kind==='fight')justiceConfront(p.stop,true);
}
function justiceConfront(p,fight){
 const s=justiceState(),capacity=Math.round((g.health+g.fit)/2);
 if(fight){
   g.health=cl(g.health-justiceRandom(s,9,32));
   if(g.health<=0||justiceRandom(s,1,100)<=3){
     s.pending=null;g.alive=false;g.cause='injuries during a police confrontation';L('You died after a police confrontation.');
     return go('death');
   }
 }
 const free=justiceRandom(s,1,100)<=(fight?4+Math.floor(capacity/10):12+Math.floor(capacity/4));
 if(free){
   const i=justiceFind(s.incidents,p.incident);
   if(i)i.resolved=true;
   s.incidents.push({id:justiceID(s),key:p.key,age:g.age,country:g.country,due:g.age+1,evidence:justiceClamp(p.evidence+5),source:p.source,
     charges:[...p.charges,'resisting',...(fight?['officer']:[])],scene:{},resolved:false});
   return justiceOutcome('Encounter ended','You left the encounter. Police kept the incident open and may follow up.');
 }
 const extra=fight?['officer',...(g.age>=18&&justiceRandom(s,1,100)<=3?['homicide']:[])]:[];
 return justiceBook({...p,charges:[...p.charges,'resisting',...extra],evidence:justiceClamp(p.evidence+5)});
}
function justiceHire(index){
 const s=justiceState(),p=s.pending,c=justiceFind(s.cases,p?.id),lawyer=JUSTICE_DEFENSES[index];
 if(p?.kind!=='booked'||!c||c.status!=='booking'||!lawyer)return;
 const cost=pr(lawyer[1]);
 if(cost>0&&g.cash<cost)return toast('Personal cash cannot cover that lawyer.');
 g.cash-=cost;LD('Criminal defense fees',-cost);
 const experienced=(g.job?.f==='law'&&(g.exp?.law||0)>=4)||g.job?.firmOwner;
 c.lawyer={name:lawyer[0],cost,skill:index===0&&experienced?Math.min(72,44+(g.exp?.law||0)):lawyer[2]};
 c.status='scheduled';s.pending=null;
 if(g.age>=c.due)return justiceDecision('hearing',{id:c.id});
 justiceOutcome('Court date scheduled',c.venue+' scheduled for age '+c.due+', month '+c.month+'. Your current job and education continue while the case is pending.');
}
function justiceCourtDue(s=justiceState(),allowDelay=false){
 const c=justiceCurrent(s);
 if(c?.status!=='scheduled'||g.age<c.due||s.pending)return;
 if(allowDelay&&!c.deferred&&justiceRandom(s,1,100)<=21){
   c.deferred=true;
   s.pending={kind:'reschedule',id:c.id};
 }else s.pending={kind:'hearing',id:c.id};
}
function justiceCourtSchedule(choice){
 const s=justiceState(),p=s.pending,c=justiceFind(s.cases,p?.id);
 if(p?.kind!=='reschedule'||c?.status!=='scheduled'||!['agree','object'].includes(choice))return;
 const approved=choice==='agree'||justiceRandom(s,1,100)<47;
 if(!approved)return justiceDecision('hearing',{id:c.id});
 c.due=g.age+1;c.month=justiceRandom(s,1,11);
 if(choice==='agree')c.evidence=justiceClamp(c.evidence-3);
 return justiceOutcome('Court date revised','The hearing was postponed to age '+c.due+', month '+c.month+'. Your existing counsel will stay on the case.');
}
function justiceVerdict(choice){
 const s=justiceState(),p=s.pending,c=justiceFind(s.cases,p?.id);
 if(p?.kind!=='hearing'||c?.status!=='scheduled'||g.age<c.due||![0,1,2].includes(choice))return;
 const scores=[5,3,9],variation=justiceRandom(s,-12,12),main=justiceOffense(c.key);
 const acquittal=Math.max(6,Math.min(82,51+c.lawyer.skill*.61-c.evidence*.81+scores[choice]+variation-(main[4]>=10?9:0)));
 if(justiceRandom(s,1,100)<=acquittal){
   c.status='acquitted';c.result='Not guilty';
   L('You were found not guilty.');
   if(c.evidence<45&&justiceRandom(s,1,100)<=35)civilAddVictim('detention','Local authority',
     'Your lawyer identified a documented dispute about detention procedure. You may ask the civil court to review it.');
   return justiceOutcome('Not guilty','The court entered an acquittal. No new conviction or sentence was recorded.');
 }
 c.status='convicted';c.result='Guilty';
 const offenses=c.charges.map(justiceOffense).sort((a,b)=>b[4]-a[4]);
 const [first,...others]=offenses;
 let years=justiceRandom(s,first[3],first[4])+others.reduce((n,d)=>n+Math.max(1,Math.round(d[3]*.65)),0);
 if(c.cooperation)years=Math.max(first[3],years-1);
 if(g.age<18)years=Math.min(4,years);
 const priorWarrant=s.fugitive&&['atLarge','abroad'].includes(s.fugitive.status)?s.fugitive:null;
 if(priorWarrant){
   years+=priorWarrant.left;priorWarrant.status='cleared';
   const original=justiceFind(s.convictions,priorWarrant.record);
   if(original)original.status='Remaining custody added to a later sentence';
 }
 const underSupervision=s.parole?.until>g.age&&s.parole.country===g.country;
 if(underSupervision){
   years+=Math.max(1,s.parole.until-g.age);
   const previous=justiceFind(s.convictions,s.parole.record);
   if(previous)previous.status='Parole revoked after another conviction';
   s.parole=null;
 }
 const months=first[4]<=2&&!others.length&&!priorWarrant&&!underSupervision?Math.max(1,justiceRandom(s,1,8)-(c.cooperation?2:0)):null;
 if(months)years=1;
 const record={id:justiceID(s),caseId:c.id,charges:c.charges.slice(),age:g.age,country:g.country,sentence:years,months,served:0,
   status:'In custody',overturned:false,appealUsed:false,facility:null,paroleEligible:!priorWarrant&&!underSupervision&&!months&&offenses.every(d=>d[10]!==false),extensions:0};
 c.record=record.id;s.convictions.push(record);g.rec++;
 justiceEnterPrison(s,record,years);
 L('The court entered a conviction for '+offenses.map(x=>x[0]).join(', ')+'.');
 if(g.fm>=35||first[4]>=10){
   if(typeof newsPublish==='function')newsPublish('law','A criminal verdict is entered','A court entered a public verdict involving '+g.name+'.',{type:'civic'},'verdict-'+record.id);
 }
 justiceOutcome('Guilty verdict','Sentence '+justiceDuration(record)+'. You lost your job and any open school enrollment. Open Work to manage your time in custody.');
}
