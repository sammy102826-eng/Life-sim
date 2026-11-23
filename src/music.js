function musicIdentity(){return Array.from(crypto.getRandomValues(new Uint32Array(2)),n=>n.toString(36)).join('-');}
function musicState(){
 return g.music??={version:1,id:musicIdentity(),serial:0,instruments:{},practice:{},mode:null,band:null,label:null,history:[],projects:[],events:[],
  archives:[],pastLabels:[],votes:[],earnings:[],lastAge:g.age,auditions:{},used:{},studioSkill:30};
}
const musicNum=n=>Math.round(cl(n,0,100));
const musicJob=()=>g.job?.music===true||g.job?.t==='Musician';
const musicActive=()=>musicJob()&&!!g.music?.mode&&g.alive&&!g.jail&&!g.ret&&g.office<0&&!royalRestricted();
const musicMembers=s=>s.band?.members.filter(m=>m.active)||[];
const musicAct=s=>s.mode==='band'?s.band.id:'solo';
const musicActName=s=>s.mode==='band'?s.band.name:g.name;
const musicSkill=(s,key)=>key==='voice'?g.les.music||0:s.instruments[key]||0;
const musicLocked=s=>!!(s.label&&s.label.end>g.age||s.mode==='band'&&s.band.end>g.age);
const musicAccess=()=>g.age>=16&&g.alive&&!g.jail&&!g.ret&&g.office<0&&!royalRestricted()&&(!g.job||musicJob())&&
 !g.pt.length&&!g.intern&&!g.study&&!g.collegeTrack?.current&&!g.educationJourney?.internships?.some(i=>i.status==='Active')&&
 !g.vent.some(v=>v.ceo)&&!g.actor?.projects?.some(p=>p.status==='signed')&&!g.actor?.queue?.length;
function musicLog(s,text){
 s.history.unshift({age:g.age,text});s.history=s.history.slice(0,55);
 L(uiEscape(text));
}
function musicPress(s,title,text,event=null){
 return newsPublish('music',title,text,event?{type:'musicEvent',ref:event.id}:null,'music-'+s.id+'-'+(++s.serial));
}
function musicMigrate(){
 if(g?.job?.t!=='Musician'||g.music?.mode)return;
 const s=musicState();
 s.mode='solo';s.studioSkill=musicNum(Math.max(30,g.sk||0));s.lastAge=g.age;
 g.job.music=true;
}
function musicPractice(key,lesson){
 if(!Object.hasOwn(MUSIC_ROLES,key)||g.jail||g.age<musicTrainingAge(key))return 'Practice is unavailable.';
 const s=musicState(),p=s.practice[key]??={age:g.age,lessons:0,sessions:0};
 if(p.age!==g.age)Object.assign(p,{age:g.age,lessons:0,sessions:0});
 if(lesson?p.lessons>=1:p.sessions>=2)return 'You already used those practice blocks for this year.';
 const fee=lesson&&g.age>=14?pr(MUSIC_ROLES[key][1]):0;
 if(g.cash<fee)return 'You need '+loc(fee)+' for that lesson.';
 if(musicSkill(s,key)>=talentCap('music'))return 'You reached your current practice limit for this skill.';
 if(fee){g.cash-=fee;LD('Music instruction',-fee);}
 p[lesson?'lessons':'sessions']++;
 const next=learnTalent('music',musicSkill(s,key),(lesson?9:4)+Math.floor(g.smarts/38));
 if(key==='voice')g.les.music=next;
 else s.instruments[key]=next;
 musicLog(s,MUSIC_ROLES[key][0]+' reached '+next+'/100.');
 return '';
}
function musicLoseDrafts(s,act){
 for(const p of s.projects.filter(p=>p.act===act&&!['released','archived'].includes(p.stage)))p.stage='archived';
 for(const e of s.events.filter(e=>e.act===act&&e.key!=='reunion'))e.closed=true;
}
function musicSetJob(s){
 g.job={t:s.mode==='band'?s.band.role==='voice'?'Band vocalist':'Band musician':'Solo singer',f:'arts',sp:1,pay:0,yrs:0,music:true};
 g.ue=false;
}
function musicLeaveBand(s,reason){
 const b=s.band;
 musicLoseDrafts(s,b.id);
 const old={...b,left:g.age,reason,reunionAge:null};
 s.archives.unshift(old);s.archives=s.archives.slice(0,12);
 s.band=null;musicRetireLabel(s);
 return old;
}
function musicEndCareer(s,reason){
 if(s.band){
  const b=musicLeaveBand(s,reason);
  musicPress(s,b.name+' announces a departure',g.name+' left the lineup. Released recordings retain their original credits.');
 }else{
  musicLoseDrafts(s,'solo');musicRetireLabel(s);
 }
 s.mode=null;
 musicLog(s,'You stepped away from performing. Released recordings retain their credits.');
}
function musicSync(){
 musicMigrate();
 const s=g?.music;
 if(s?.mode&&!musicJob())musicEndCareer(s,'Career ended');
}
function musicSolo(){
 const s=musicState();musicExpire(s);
 if(!musicAccess()||s.mode==='solo'&&musicActive())return 'A solo career is unavailable with your current commitments.';
 if(musicLocked(s))return 'Wait until your current band and label agreements expire.';
 if(s.band){
  const b=musicLeaveBand(s,'Left after contract');
  musicPress(s,g.name+' leaves '+b.name,g.name+' will perform as a solo artist after the band agreement ended.');
 }
 s.mode='solo';s.label=null;musicSetJob(s);
 musicLog(s,'You began an independent solo career.');
 return '';
}
function musicAudition(key,role){
 const s=musicState(),def=MUSIC_BANDS[key];musicExpire(s);
 if(!musicAccess()||musicLocked(s)||!def||!def[3].includes(role)||s.band?.key===key)return 'This audition is unavailable under your current commitments.';
 const skill=musicSkill(s,role),minimum=def[2];
 if(skill<minimum)return MUSIC_ROLES[role][0]+' skill must reach '+minimum+' for this audition.';
 if(s.auditions[key]===g.age)return 'You already auditioned for this band this year.';
 s.auditions[key]=g.age;
 const chance=cl(54+(skill-minimum)*1.25+(g.fm||0)*.18,54,97);
 if(!ch(chance)){
  musicLog(s,def[0]+' selected another performer after auditions.');
  return 'The band chose another performer. Practice and try again next year.';
 }
 if(s.band)musicLeaveBand(s,'Joined a different act');
 else if(s.mode==='solo')musicLoseDrafts(s,'solo');
 s.label=null;s.mode='band';
 s.band={id:'band-'+(++s.serial),key,name:def[0],genre:def[1],role,joined:g.age,end:g.age+2,cohesion:63,
  members:def[4].map((name,i)=>({id:++s.serial,name,role:def[3].filter(x=>x!==role)[i%(def[3].length-1)],trust:R(48,77),active:true}))};
 musicSetJob(s);
 musicLog(s,'You joined '+def[0]+' after a successful audition.');
 musicPress(s,def[0]+' announces a new lineup',g.name+' joined the band on '+MUSIC_ROLES[role][0].toLowerCase()+'.');
 return '';
}
function musicLabelSign(key){
 const s=musicState(),def=MUSIC_LABELS[key];musicExpire(s);
 if(!musicActive()||s.label||!def||Math.max(musicSkill(s,s.band?.role||'voice'),s.studioSkill)+(g.fm||0)*.28<def[4])
  return 'This label needs stronger skills or a larger audience.';
 if(s.used.label===g.age)return 'The act can sign one recording deal per year.';
 s.used.label=g.age;
 if(s.band&&!musicVote(s,'Label agreement: '+def[0],{pitch:59,player:true}).passed)return 'The band voted against the recording agreement.';
 const advance=pr(def[3]),parts=musicMembers(s).length+1,share=Math.floor(advance/parts);
 s.label={id:++s.serial,key,act:musicAct(s),end:g.age+def[1],rate:def[2],recoup:share};
 g.cash+=share;LD('Music performance income',share);
 musicLog(s,'You signed with '+def[0]+' and received '+loc(share)+' of the recoupable advance.');
 musicPress(s,musicActName(s)+' signs with '+def[0],'The label signed a '+def[1]+'-year recording agreement.');
 return '';
}
function musicVote(s,motion,{pitch=50,player=true,exclude=null}={}){
 const b=s.band;
 if(!b)return {passed:true,ballots:[],age:g.age,motion};
 const roster=musicMembers(s),out=[{name:g.name,yes:player===true}];
 for(const m of roster){
  const support=cl(48+(m.trust-50)*.65+(b.cohesion-50)*.62+(pitch-50)*.63,8,94);
  out.push({name:m.name,yes:m.id!==exclude&&ch(support)});
 }
 const yes=out.filter(x=>x.yes).length,needed=Math.floor(out.length/2)+1;
 const vote={id:++s.serial,age:g.age,motion,yes,needed,passed:yes>=needed,ballots:out};
 s.votes.unshift(vote);s.votes=s.votes.slice(0,30);
 musicLog(s,motion+' · '+yes+' yes votes, '+needed+' needed. '+(vote.passed?'Passed.':'The motion failed.'));
 return vote;
}
function musicBandAction(key,id){
 const s=musicState(),b=s.band;
 if(!musicActive()||!b||!['rehearse','discuss','remove','invite','disband'].includes(key))return 'This band action is unavailable.';
 const m=musicMembers(s).find(m=>m.id===id);
 if(key==='rehearse'){
  if(s.used.rehearse===g.age)return 'The band already rehearsed this year.';
  s.used.rehearse=g.age;b.cohesion=musicNum(b.cohesion+8);
  for(const p of musicMembers(s))p.trust=musicNum(p.trust+3);
  s.studioSkill=musicNum(s.studioSkill+4);
 }else if(key==='discuss'&&m){
  if(s.used['chat:'+id]===g.age)return 'You already had a check-in with this bandmate.';
  s.used['chat:'+id]=g.age;m.trust=musicNum(m.trust+8);b.cohesion=musicNum(b.cohesion+3);
 }else if(key==='remove'&&m){
  if(musicMembers(s).length<=1)return 'A band needs at least one other member. Put a breakup to a vote instead.';
  if(s.used['remove:'+id]===g.age)return 'A second vote on this member must wait until next year.';
  s.used['remove:'+id]=g.age;
  if(musicVote(s,'Remove '+m.name,{pitch:63+(55-m.trust)*.6,exclude:m.id}).passed){
   m.active=false;b.cohesion=musicNum(b.cohesion-5);
   musicPress(s,b.name+' changes its lineup',m.name+' left after a majority vote. Existing recording credits and shares remain.');
  }
 }else if(key==='invite'){
  if(s.used.invite===g.age||musicMembers(s).length>=4)return 'The roster or yearly recruitment slot is full.';
  s.used.invite=g.age;
  const role=Object.keys(MUSIC_ROLES).find(k=>k!=='voice'&&k!==b.role&&!musicMembers(s).some(m=>m.role===k))||'keys';
  const candidate=nm2();
  if(musicVote(s,'Invite '+candidate,{pitch:62}).passed)b.members.push({id:++s.serial,name:candidate,role,trust:58,active:true});
 }else if(key==='disband'){
  if(musicLocked(s))return 'A voluntary breakup must wait until the band and label agreements end.';
  if(s.used.disband===g.age)return 'The band already voted on a breakup this year.';
  s.used.disband=g.age;
  if(musicVote(s,'Disband '+b.name,{pitch:70}).passed){
   const archive=musicLeaveBand(s,'Disbanded');
   s.mode='solo';musicSetJob(s);
   musicPress(s,archive.name+' announces its breakup','The majority voted to end the band. Members retain their recorded credits.');
  }
 }else return 'This bandmate is unavailable.';
 return '';
}
function musicRetireLabel(s){
 if(!s.label)return;
 s.pastLabels.push(s.label);
 s.label=null;
}
function musicExpire(s){
 if(s.label?.end<=g.age){
  musicLog(s,MUSIC_LABELS[s.label.key][0]+' contract ended. You can negotiate a new deal or change acts if eligible.');
  musicRetireLabel(s);
 }
}
function musicProject(title,genre,format){
 const s=musicState();
 if(!musicActive()||typeof title!=='string'||!title.trim()||title.length>60||/[<>]/.test(title)||!MUSIC_GENRES.includes(genre)||
  !Object.hasOwn(MUSIC_FORMATS,format)||s.projects.some(p=>p.title.toLowerCase()===title.trim().toLowerCase()&&p.act===musicAct(s))||
  s.projects.filter(p=>!['archived','released'].includes(p.stage)).length>=5||s.projects.length>=80)return 'Enter a unique title and choose a format and genre. Five drafts can be active.';
 const skill=musicSkill(s,s.band?.role||'voice');
 s.projects.push({id:++s.serial,title:title.trim(),genre,format,stage:'draft',quality:musicNum(27+skill*.35+s.studioSkill*.26),
  act:musicAct(s),artist:musicActName(s),age:g.age,cost:0,marketing:0,splits:[],label:null,releaseAge:null,gross:0,earned:0,used:{}});
 s.studioSkill=musicNum(s.studioSkill+2);
 return '';
}
function musicAllowLabel(p,phase,deal){
 if(!deal)return true;
 const threshold={local:47,indie:55,major:64}[deal.key]+(p.format==='album'?3:0);
 const score=p.quality+(phase==='release'?p.marketing*4:0)+(g.fm||0)*.10;
 return score>=threshold;
}
function musicProjectStep(id,action,value=0){
 const s=musicState(),p=s.projects.find(x=>x.id===id&&x.act===musicAct(s));
 if(!musicActive()||!p||!['refine','produce','release'].includes(action))return 'This project is unavailable.';
 musicExpire(s);
 if(action==='refine'){
  if(!['draft','recorded'].includes(p.stage)||p.used.refine===g.age)return 'You can revise the material once a year before scheduling.';
  p.used.refine=g.age;p.quality=musicNum(p.quality+7);
  return '';
 }
 const release=action==='release',stage=release?'recorded':'draft',deal=release?(musicFindLabel(s,p.label)||s.label):s.label;
 if(p.stage!==stage||p.used[action]===g.age)return 'This decision is not ready or has already been tried this year.';
 if(release&&![0,1,2].includes(value))return 'Choose a marketing package.';
 const parts=release?p.splits.length:musicMembers(s).length+1;
 const base=release?[0,900,3100][value]:MUSIC_FORMATS[p.format][1];
 const bill=Math.ceil(pr(base)/parts);
 const fee=release?bill:Math.round(bill*(deal?.act===p.act ? .65 : 1));
 if(g.cash<fee)return 'You need '+loc(fee)+' for your share.';
 if(release)p.marketing=value;
 if(!musicAllowLabel(p,action,deal))return 'The label declined this proposal. Improve the recording or its release plan.';
 p.used[action]=g.age;
 if(s.band&&!musicVote(s,(release?'Release ':'Record ')+p.title,{pitch:p.quality+(release?value*6:0)}).passed)return 'The band voted against the proposal.';
 if(fee){g.cash-=fee;LD(release?'Music promotion':'Music recording',-fee);p.cost+=fee;}
 if(release){p.stage='scheduled';p.releaseAge=g.age+1;if(!p.label&&deal)p.label=deal.id;}
 else{
  p.stage='recorded';
  p.splits=[g.name,...musicMembers(s).map(m=>m.name)];
  p.label=deal?.id||null;
  s.studioSkill=musicNum(s.studioSkill+5);
 }
 return '';
}
function musicFindLabel(s,id){return id&&(s.label?.id===id?s.label:s.pastLabels.find(x=>x.id===id));}
function musicIncome(s,p,gross,label=true){
 const deal=label&&musicFindLabel(s,p.label),rate=deal?.rate||0;
 const labelCut=Math.round(gross*rate/100);
 const share=Math.floor((gross-labelCut)/Math.max(1,p.splits.length));
 const recoup=deal?Math.min(share,deal.recoup):0;
 if(deal)deal.recoup-=recoup;
 const received=share-recoup;
 p.gross+=gross;p.earned+=received;g.cash+=received;
 if(received)LD('Music performance income',received);
 s.earnings.unshift({age:g.age,title:p.title,gross,labelCut,share,recoup,received,members:p.splits.length});
 s.earnings=s.earnings.slice(0,70);
 return received;
}
function musicShow(type){
 const s=musicState(),tour=type==='tour';
 if(!musicActive()||!['show','tour'].includes(type)||s.used[type]===g.age)return 'This performance is unavailable this year.';
 const parts=musicMembers(s).length+1,fee=Math.ceil(pr(tour?6200:180)/parts);
 if(g.cash<fee)return 'You cannot cover your share of expenses.';
 if(tour&&s.band&&!musicVote(s,'Approve the tour',{pitch:59}).passed){s.used[type]=g.age;return 'The band voted against touring.';}
 s.used[type]=g.age;g.cash-=fee;LD('Music performance expenses',-fee);
 const gross=pr(Math.round((tour?7600:650)*(1+(g.fm||0)/55+s.studioSkill/70)*R(70,135)/100));
 const show={title:tour?'Tour receipts':'Local show',splits:[g.name,...musicMembers(s).map(m=>m.name)],gross:0,earned:0};
 const earned=musicIncome(s,show,gross,false);
 g.fm=musicNum((g.fm||0)+(tour?4:1));g.fame=musicNum(g.fame+(tour?3:1));
 musicLog(s,(tour?'The tour':'The show')+' grossed '+loc(gross)+'. Your share was '+loc(earned)+' before personal expenses.');
 if(tour)musicPress(s,musicActName(s)+' wraps a tour','The tour closed after a series of live appearances.');
 return '';
}
function musicEvent(s,key,data={}){
 if(!MUSIC_EVENTS[key]||s.events.some(e=>!e.closed&&e.key===key&&e.act===musicAct(s)))return null;
 const e={id:++s.serial,key,act:musicAct(s),age:g.age,seen:false,closed:false,article:null,...data};
 s.events.push(e);
 if(MUSIC_EVENTS[key][3])e.article=musicPress(s,MUSIC_EVENTS[key][0],MUSIC_EVENTS[key][1],e);
 if(s.events.length>65){const first=s.events.findIndex(x=>x.closed);if(first>=0)s.events.splice(first,1);}
 return e;
}
function musicEventReady(s,e){
 return !!e&&!e.closed&&musicActive()&&(e.key==='reunion'||e.act===musicAct(s));
}
function musicConfidence(s,mode){
 const b=s.band,ballots=[{name:g.name,yes:mode===2}];
 for(const m of musicMembers(s)){
  const risk=cl(70-(m.trust+b.cohesion)/2+(mode===0?-10:mode===2?12:0),4,85);
  ballots.push({name:m.name,yes:ch(risk)});
 }
 const yes=ballots.filter(v=>v.yes).length,needed=Math.floor(ballots.length/2)+1,passed=yes>=needed;
 s.votes.unshift({id:++s.serial,age:g.age,motion:'Remove '+g.name,yes,needed,passed,ballots});
 s.votes=s.votes.slice(0,30);
 if(passed){
  musicLeaveBand(s,'Removed by majority vote');
  s.mode='solo';musicSetJob(s);
  musicPress(s,b.name+' announces a lineup change',g.name+' was removed by a majority vote and can continue as a solo artist.');
 }
 return yes+' voted for removal. '+needed+' were needed. '+(passed?'You are now a solo performer.':'You kept your place in the band.');
}
function musicRespond(s,e,index){
 const choice=e&&MUSIC_EVENTS[e.key]?.[2][index];
 if(!musicEventReady(s,e)||!choice)return {done:false,text:'This music decision is unavailable.'};
 const [label,cohesion,quality]=choice;
 let text=label+'.';
 if(e.key==='reunion'){
  const a=s.archives.find(b=>b.id===e.archive);
  if(index===0){
   if(!a||s.mode!=='solo'||musicLocked(s))return {done:false,text:'The reunion needs a solo schedule clear of recording contracts.'};
   musicLoseDrafts(s,'solo');
   s.label=null;s.mode='band';
   s.band={id:'band-'+(++s.serial),key:a.key,name:a.name,role:a.role,genre:a.genre,joined:g.age,end:g.age+2,cohesion:65,
    members:a.members.filter(m=>m.active).map(m=>({...m,id:++s.serial,trust:65}))};
   musicSetJob(s);musicPress(s,a.name+' confirms its reunion','The band agreed to perform together again under a new agreement.');
  }
 }else if(e.key==='confidence'){
  if(!s.band)return {done:false,text:'The band is no longer active.'};
  text=musicConfidence(s,index);
 }else{
  if(s.band)s.band.cohesion=musicNum(s.band.cohesion+cohesion);
  const p=s.projects.find(p=>p.act===e.act&&['draft','recorded'].includes(p.stage));
  if(p)p.quality=musicNum(p.quality+quality);
  else s.studioSkill=musicNum(s.studioSkill+quality);
  if(e.article&&index<2)musicPress(s,musicActName(s)+' issues an update',label+'.');
 }
 e.closed=true;
 musicLog(s,text);
 return {done:true,text};
}
function musicYear(){
 musicSync();
 const s=g.music;
 if(!s||s.lastAge>=g.age)return;
 s.lastAge=g.age;
 musicExpire(s);
 for(const p of s.projects){
  if(p.stage==='scheduled'&&p.releaseAge<=g.age&&musicActive()&&p.act===musicAct(s)){
   p.stage='released';
   const base={single:2000,ep:5700,album:12500}[p.format];
   const gross=pr(Math.round(base*(p.quality/45+.20)*(1+(g.fm||0)/70+p.marketing*.26)*R(65,150)/100));
   p.initialGross=gross;
   const take=musicIncome(s,p,gross);
   g.fm=musicNum((g.fm||0)+(gross>=pr(base*1.5)?7:3));g.fame=musicNum(g.fame+4);
   musicLog(s,p.title+' was released. Gross receipts '+loc(gross)+' and your payout '+loc(take)+'.');
   musicPress(s,p.artist+' releases '+p.title,'The '+MUSIC_FORMATS[p.format][0].toLowerCase()+' was released with '+p.splits.join(', ')+' credited.');
  }else if(p.stage==='released'&&g.age>p.releaseAge&&g.age<=p.releaseAge+6){
   const first=p.initialGross||pr(1800);
   musicIncome(s,p,Math.max(0,Math.round(first*.2*Math.pow(.69,g.age-p.releaseAge-1))));
  }
 }
 if(!musicActive())return;
 if(s.band){
  s.band.cohesion=musicNum(s.band.cohesion-(s.used.rehearse===g.age-1?1:5));
  if(s.band.cohesion<=43)musicEvent(s,'confidence');
  else if(ch(60))musicEvent(s,P(['burnout','direction','credit','venue']));
 }else{
  const reunion=s.archives.find(b=>b.reunionAge==null&&b.left+2<=g.age&&b.reason!=='Removed by majority vote');
  if(reunion&&!musicLocked(s)&&ch(34)){
   const e=musicEvent(s,'reunion',{archive:reunion.id});
   if(e)reunion.reunionAge=g.age;
  }else if(ch(34))musicEvent(s,P(['venue','credit']));
 }
}
