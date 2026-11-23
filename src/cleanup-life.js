const APPEARANCE={
 eye:[['Brown','#70472b'],['Blue','#377496'],['Green','#507b50'],['Hazel','#85763b'],['Gray','#778483'],['Amber','#ac6b29']],
 hair:[['Black','#262129'],['Dark brown','#4d3028'],['Chestnut','#783d2b'],['Blonde','#cca764'],['Copper','#a54e35'],['Silver','#b8b8bb'],['Plum','#79496d'],['Teal','#267c7c']],
 skin:[['Porcelain','#f5d8c0'],['Light','#e8b993'],['Warm beige','#dca481'],['Olive','#c28d65'],['Brown','#a66e51'],['Deep brown','#794d38'],['Rich deep','#543324']],
 style:[['Short crop',0],['Layered waves',1],['Side part',2],['Long',3],['Curls',4],['Braids',5],['Shaved',6]]
};
const LIFE_TALENTS={sport:'Athletics',acting:'Acting',music:'Singing and music',stealth:'Stealth',writing:'Writing',
 teaching:'Teaching',investigation:'Investigation',business:'Business',science:'Science and archaeology',medicine:'Medicine',law:'Law'};
function naturalTalent(life){
 if(life.talent)return life.talent;
 const n=crypto.getRandomValues(new Uint32Array(1))[0];
 return life.talent=Object.keys(LIFE_TALENTS)[n%Object.keys(LIFE_TALENTS).length];
}
const talentCap=key=>!g.talent||g.talent===key?100:64;
const talentFactor=key=>!g.talent?1:g.talent===key?1.55:.58;
function learnTalent(key,current,gain){
 if(!g.talent||!Object.hasOwn(LIFE_TALENTS,key)||gain<=0)return cl(current+gain);
 const cap=talentCap(key);
 return Math.max(current,cl(Math.round(current+Math.max(1,gain*talentFactor(key))),0,cap));
}
function appearanceState(){
 if(!g.appearance){
  const seed=GameArt.hash(g.name||'Player');
  g.appearance=Object.fromEntries(Object.entries(APPEARANCE).map(([key,list],i)=>[key,(seed>>>(i*6))%list.length]));
 }
 return g.appearance;
}
function appearanceOptions(keys){
 const current=appearanceState();
 return keys.map(key=>studioSelect('looks-'+key,({eye:'Eye color',hair:'Hair color',skin:'Skin tone',style:'Hair style'})[key],
  APPEARANCE[key].map(([label],index)=>[index,label,index===current[key]]))).join('');
}
function appearanceRead(keys){
 const a=appearanceState();
 for(const key of keys){
  const value=document.getElementById('looks-'+key)?.value;
  if(value!=null&&APPEARANCE[key][Number(value)])a[key]=Number(value);
 }
}
function appearancePreview(){
 appearanceRead(Object.keys(APPEARANCE));
 const element=document.getElementById('appearance-preview');
 if(element)element.innerHTML=GameArt.svg('person',{id:'player:'+g.name,n:g.name,age:g.age,appearance:g.appearance},'hero');
}
function appearanceBirth(){
 return '<section class="card"><h2>Appearance</h2><div id="appearance-preview">'+GameArt.svg('person',{id:'player:'+g.name,
  n:g.name,age:g.age,appearance:appearanceState()},'hero')+'</div>'+
  appearanceOptions(Object.keys(APPEARANCE)).replaceAll('<select ','<select onchange="appearancePreview()" ')+'</section>';
}
const appearanceOldBegin=begin;
begin=function(){appearanceRead(Object.keys(APPEARANCE));naturalTalent(g);return appearanceOldBegin();};
function appearanceMenu(){
 const fee=pr(48);
 return B('Back to Other',"mainTabOpen('Other')")+studioSection('Appearance and self-care',
  GameArt.svg('person',{id:'player:'+g.name,n:g.name,age:g.age,appearance:appearanceState()},'hero')+
  '<p>Natural aptitude · '+(LIFE_TALENTS[g.talent]||'Generalist')+'</p>'+appearanceOptions(['style','hair'])+
  B('Update haircut and color · '+loc(fee),"appearanceService('salon')",g.age<5)+
  B('Visit a spa · '+loc(pr(110)),"appearanceService('spa')",g.age<13)+
  B('Book a skincare visit · '+loc(pr(65)),"appearanceService('care')",g.age<10)+
  B('Take a rest and self-care day',"appearanceService('rest')",g.age<5));
}
function appearanceService(key){
 const choices={salon:[5,48,{l:2,p:3},'You refreshed your haircut and hair color.'],
  spa:[13,110,{p:5,h:1},'You spent the afternoon at the spa.'],
  care:[10,65,{l:1,p:2},'You discussed a skincare routine at a salon.'],
  rest:[5,0,{p:2},'You took time for a quiet self-care day.']};
 if(!Object.hasOwn(choices,key)||!g.alive||g.jail||g.age<choices[key][0])return;
 const [,base,stats,text]=choices[key],fee=pr(base),used=g.appearanceUsed??={};
 if(used[key]===g.age)return toast('You already did this in the current year.');
 if(g.cash<fee)return toast('This appointment costs '+loc(fee)+'.');
 if(key==='salon')appearanceRead(['style','hair']);
 used[key]=g.age;g.cash-=fee;LD('Personal grooming and wellbeing',-fee);A(stats,text);
}
function cleanupDebugTalent(){
 const choice=document.getElementById('debug-talent')?.value;
 if(!Object.hasOwn(LIFE_TALENTS,choice))return;
 debugCommit(()=>{g.talent=choice;});
}
function cleanupDebugSkills(){
 const fields=[...Object.keys(MUSIC_ROLES).filter(k=>k!=='voice'),'patrol','detective','training'];
 const values=Object.fromEntries(fields.map(key=>[key,Number(document.getElementById('debug-special-'+key)?.value)]));
 if(Object.values(values).some(n=>!Number.isInteger(n)||n<0||n>100))return toast('Enter whole numbers from 0 to 100.');
 debugCommit(()=>{
  const police=piState(),music=musicState();
  for(const key of fields){
   if(Object.hasOwn(MUSIC_ROLES,key))music.instruments[key]=values[key];
   else police[key]=values[key];
  }
 });
}
const cleanupDebugEditor=debugEditor;
debugEditor=function(){
 const inputs=Object.entries(MUSIC_ROLES).filter(([key])=>key!=='voice').map(([key,[name]])=>
  debugInput('special-'+key,name+' skill',0,100,g.music?.instruments[key])).join('');
 const service=[['patrol','Patrol years'],['detective','Detective years'],['training','Supervised casework courses']]
  .map(([key,label])=>debugInput('special-'+key,label,0,100,g.investigator?.[key])).join('');
 return cleanupDebugEditor()+studioSection('Natural aptitude',studioSelect('debug-talent','Talent',
  Object.entries(LIFE_TALENTS).map(([key,label])=>[key,label,key===g.talent]))+
  B('Apply talent for testing','cleanupDebugTalent()'))+
  studioSection('Instruments and police experience',inputs+service+B('Apply instrument and police skills','cleanupDebugSkills()'));
};
DEBUG_FIELDS.push(['birthYear','Birth year',1900,2100],['pop','Popularity',0,100],['heat','Heat',0,100],['exp.police','Police experience',0,100]);
DEBUG_INTEGER_FIELDS.push('birthYear','pop','heat','exp.police');
for(const sport of Object.keys(SPT))DEBUG_FIELDS.push(['sp.'+sport,sport+' performance',0,100]);
function cleanupEventEligible(e){
 const title=e[3];
 if(/Dorm life|campus|college (lecture|classroom|roommate)/i.test(title))return Boolean(g.study||g.collegeTrack?.current);
 if(/summer internship/.test(title))return Boolean(g.intern||g.study||g.collegeTrack?.current);
 if(/sibling and you/.test(title))return g.rel.some(r=>r.alive&&/sibling/i.test(r.role));
 if(/friend betrays|A friend asks you to be roommates|A friend jokes|A friend asks to borrow|A friend invites/i.test(title))return g.rel.some(r=>r.alive&&r.t==='fri');
 if(/spouse|your partner/i.test(title)&&e[2]!=='sc')return !!partner();
 if(/coach says|sprain your ankle during a game/i.test(title))return !!(g.sport||g.job?.f==='sport'||g.middle?.club?.kind==='sport'||g.highSchool?.club?.kind==='sport');
 if(title==='Your phone breaks.')return g.lux.some(x=>x.assetType==='technology'&&/phone/i.test(x.n));
 if(title==='You get a speeding ticket.')return g.lic.includes(DL)&&stuffAllCars().length>0;
 if(title==='Your health insurance premiums rise.')return !!g.ins.health&&!freeH();
 if(title==='A viral dance trend sweeps your social feeds.')return Object.keys(ERA_SOCIAL).some(k=>g.pl[k]!=null&&eraPlatform(k));
 if(title==='You are invited to a high school reunion.')return g.edu>=1;

 return true;
}
function cleanupLogAge(){
 const age=g.age;
 if(!g.log.some(line=>line.startsWith('Age '+age+': ')))L('A new year began.');
 const kind=genTopic(),entries={
 early:['You had a quiet moment with your family.','You noticed new sounds and faces.'],
 school:['You found a favorite place to read.','You swapped stories after class.','You explored something new at the library.'],
 college:['You caught up on class notes.','You found time to talk with another student.','You rearranged your study schedule.'],
 work:['You finished a routine task ahead of schedule.','You caught up with people at work.','You reviewed your plans for the year.'],
 teen:['You made time to go over your plans for the year.','You worked on a new hobby.','You took a longer walk than usual.'],
 senior:['You spent a quiet morning on a hobby.','You made time to catch up with someone.','You changed your daily routine.'],
 adult:['You tried a different route around town.','You set aside time to plan the year.','You revisited an old hobby.']
 };
 const pool=entries[kind]||entries.adult;
 L(pool[GameArt.hash(g.name+age)%pool.length]);
}
const cleanupAgeBase=ageUp;
ageUp=function(){
 const age=g?.age,result=cleanupAgeBase();
 if(!g||g.age===age)return result;
 const seen=new Set();
 g.stuffEventQueue=(g.stuffEventQueue||[]).filter(e=>{
  const signature=e.x;
  if(seen.has(signature)||e.x===g.event?.x)return false;
  seen.add(signature);return true;
 });
 if(!g.alive)msCheck(true);
 else if(!g.jail){
  cleanupLogAge();
  const year=eraYear(),models=[
   ...STUFF_CARS.filter(car=>eraCarYear(car)===year).map(car=>car.n),
   ...[...BOATS,...PLANES].filter(item=>item[2]===year).map(item=>item[0]),
   ...STUFF_HOMES.filter(home=>home.year===year||mallHomeYears[home.n]===year).map(home=>home.n)
  ];
  if(models.length)newsPublish('business','New models arrive at the Mall',
   'This year’s catalog adds '+models.join(', ')+'.',null,'mall-models-'+year);
 }
 draw();
 return result;
};
const CLEANUP_MILESTONES=[
 ['pi-agency','Private practice','You opened an investigation agency.','Careers',()=>!!g.investigator?.agency],
 ['pi-file','Documented findings','Your agency completed a corroborated investigation.','Careers',()=>g.investigator?.cases.some(c=>c.status==='substantiated')],
 ['museum','Public collection','You opened your own museum.','Collectibles',()=>!!g.heritage?.museum],
 ['dig','Field discovery','You documented an archaeological find.','Careers',()=>g.heritage?.career?.discoveries>0],
 ['casino','Open for play','You opened a casino.','Money',()=>g.vent.some(v=>v.t==='cas')],
 ['band','Band lineup','You performed as part of a band.','Careers',()=>g.music?.mode==='band'],
 ['signed-screen-role','Cast on screen','You signed a role in a screen production.','Careers',()=>g.actor?.projects?.some(p=>['signed','released','completed'].includes(p.status))],
 ['professional-sport','Turned pro','You played a sport professionally.','Careers',()=>g.job?.f==='sport'],
 ['writing-credit','Published work','Your portfolio contains a published work.','Careers',()=>g.writingPortfolio?.credits.length>0],
 ['teacher-appointment','First classroom','You took up a teaching appointment.','Careers',()=>!!g.teacher?.assignment],

 ['record','Released a recording','Your music reached the public.','Careers',()=>g.music?.projects.some(p=>p.stage==='released')],
 ['studio','Studio owner','You operated a movie studio.','Careers',()=>!!g.studio],
 ['clinic','Practice founder','You owned a medical practice.','Careers',()=>!!g.practice],
 ['firm','Firm founder','You started a law firm.','Careers',()=>!!g.lawFirm],
 ['dean','University leadership','You led a university.','Careers',()=>!!g.teacher?.campus],
 ['corporate-ipo','Went public','Your company listed its shares on the exchange.','Careers',()=>g.vent.some(v=>!!v.biz&&v.pub&&!v.ceo)],
 ['political-leader','Led a country','You held the country’s highest elected office.','Careers',()=>civicCurrent()?.id==='leader'],
 ['display','Home collection','You put an owned item on display.','Collectibles',()=>g.lux.some(x=>x.showHome)||g.heritage?.artifacts.some(x=>x.display)],
 ['first-investment','Invested savings','You hold an investment.','Money',()=>Object.keys(g.financial?.positions||{}).length>0],
 ['conviction','A conviction','A court recorded a conviction.','Life events',()=>g.justice?.convictions.length>0],
 ['service','Completed military service','You earned the enlistment tuition benefit.','Careers',()=>!!g.gi],
 ['generation','A new generation','You continued as a descendant.','Generations',()=>g.generations?.number>=2],
 ['lot-built','Built a home','You finished a home on land you bought.','Collectibles',()=>g.generations?.land.some(x=>x.completed)||stuffAllHomes().some(x=>x.custom)],
 ['island-owned','Island owner','You bought a private island.','Money',()=>g.generations?.islands.length>0],
 ['prison-release','Returned home','You completed time in custody and left prison.','Life events',()=>!g.jail&&g.justice?.convictions.some(x=>x.served>0)],
 ['mark-release','First release','Your studio released a film or series.','Careers',()=>g.studio?.projects.some(x=>x.releaseAge<=g.age&&x.earned>0)],
 ['grandchild','A grandchild is born','You welcomed a new generation in your family.','Generations',()=>g.rel.some(x=>x.role==='Grandchild')],
 ['loss','Remembering someone','Someone you knew passed away.','Life events',()=>g.rel.some(x=>x.deceased)],
 ['legacy','Life remembered','Your life ended and your legacy was recorded.','Life events',()=>!g.alive]
];
MS.push(...CLEANUP_MILESTONES.map(entry=>[...entry,'journal']));
