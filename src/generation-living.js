const GEN_EARLY={
 1:'You practiced crawling toward a favorite toy and babbled when you reached it.',
 2:'You took a few unsteady steps and repeated the word everyone taught you.',
 3:'You learned to name the colors on a picture book.',
 4:'You told a story from beginning to end and asked to hear it again.',
 5:'You packed a favorite pencil for your first week of school.'
};
const GEN_MOMENTS={
 school:[
 ['You found a quiet place to read during lunch.',0],['You spent your pocket money at a school book fair.',-12],
 ['A neighbor paid you for helping in their garden.',25],['You and a classmate traded drawings after school.',0]],
 teen:[
 ['Your friends turned a canceled outing into a game night.',0],['You replaced a damaged charger before class.',-25],
 ['A neighbor paid you for looking after their pet.',48],['You helped a friend prepare for a difficult exam.',0]],
 college:[
 ['A professor returned your assignment with a note about your improvement.',0],['A campus party ran late and you paid for a ride home.',-24],
 ['You shared notes with someone who missed a lecture.',0],['You sold a used textbook to another student.',42],
 ['Students debated hazing and campus traditions at an open meeting.',0]],
 work:[
 ['A colleague sent a thank-you note after a difficult week.',0],['You paid to fix a torn work bag.',-35],
 ['Your workplace reimbursed a small expense from a previous project.',66],['You shared lunch with someone new at work.',-14]],
 adult:[
 ['You found a forgotten gift card while clearing a drawer.',28],['A subscription renewed before you remembered to cancel it.',-40],
 ['You gave away spare furniture to a neighbor.',0],['You caught up with a familiar face at a community event.',0]],
 senior:[
 ['You shared a family story someone had never heard before.',0],['You paid to restore an old photograph.',-28],
 ['You helped organize a neighborhood gathering.',0],['You sold a collectible you had stopped using.',75]]
};
const GEN_SCENES={
 school:['A school project costs more than expected',['Borrow supplies and work with a friend','Make a simpler version','Buy a complete kit'],[0,0,-22],[2,0,1]],
 teen:['Your friends split over a weekend plan',['Make time for both groups','Choose one gathering','Stay home and catch up later'],[-12,-18,0],[3,1,-1]],
 college:['A student group asks you to comment on its initiation traditions',['Help draft a safer welcome','Raise concerns privately','Skip the meeting'],[0,0,0],[2,1,-1]],
 work:['A coworker asks you to share credit for a project',['Publish a joint account','Ask for a mediated discussion','Keep separate accounts'],[0,0,0],[2,1,-2]],
 adult:['A neighborhood repair project needs volunteers',['Help organize the work','Contribute to the shared cost','Leave the decision to the committee'],[0,-85,0],[3,2,-1]],
 senior:['The family asks what to do with boxes of old records',['Digitize a family collection','Give each branch its own records','Store the boxes for later'],[-65,0,0],[4,2,0]]
};
function genRoll(life,seed,range=100){
 let hash=[...life.name+'|'+life.birth+'|'+life.age+'|'+seed].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,29791);
 hash^=hash<<13;hash^=hash>>>17;hash^=hash<<5;
 return (hash>>>0)%range;
}
const genFind=id=>g.rel.find(r=>r.id===id);
function genRel(role,age,parents=[],name=null){
 const s=genState(),last=(genFind(parents[0])?.n||g.name).split(' ').at(-1);
 const serial=++s.serial;
 const names=['Alex','Jordan','Avery','Robin','Morgan','Casey','Riley','Noor','Mateo','Ivy','Maya','Sam','Nico','Kai','June','Rosa','Elena'];
 const first=names[genRoll(g,'person'+serial,names.length)];
 const id='gen-'+s.id+'-'+serial;
 const r={id,n:name||first+' '+last,age,bond:55,t:'fam',role,alive:true,m:0,genParents:[...parents]};
 g.rel.push(r);
 return r;
}
function genFamilyInit(){
 const s=genState();
 if(s.family)return s.family;
 const parents=g.rel.filter(r=>['Mother','Father','Parent'].includes(r.role)&&!r.stepFor).slice(0,2);
 const parentalIds=parents.map(r=>r.id);
 if(g.age===0&&!g.rel.some(r=>r.role==='Sibling'))genRel('Sibling',2,parentalIds);
 s.family={parents:parentalIds,status:parents.length===2?'together':'single',since:g.age,step:null};
 for(const p of g.rel.filter(r=>r.role==='Sibling'))p.genParents??=parentalIds.slice();
 return s.family;
}
function genProfile(r){
 if(r.genLife)return r.genLife;
 const field=r.f&&LAD[r.f]?r.f:'office';
 const employed=r.age>=18&&r.age<65&&r.inc>0&&r.j&&r.j!=='Unemployed';
 const years=employed?Math.max(1,Math.min(r.age-17,(r.lv||0)*2+1)):0;
 const job=employed?{t:r.j,f:field,pay:Math.round(r.inc),lv:r.lv||0,yrs:years}:null;
 return r.genLife={savings:Math.max(0,Math.round(r.m||0)),job,degree:r.age>=18?1:0,years,lastAge:null,
  legacy:[],assets:[],partner:null};
}
function genConnect(r){
 return r.connection??={last:g.age,status:'close',requested:null,repairs:0};
}
function genContact(r,amount){
 if(!r?.alive||r.role==='Pet'||r.deceased||amount<=0)return;
 const c=genConnect(r);
 if(c.status==='close'){
  c.last=g.age;c.requested=null;
  const request=g.generations?.events.find(e=>e.kind==='contact'&&!e.closed&&e.person===r.id);
  if(request)request.closed=true;
 }
}
function genTopic(){
 if(g.age<=5)return 'early';
 if(g.age<=12)return 'school';
 if(g.age<18)return 'teen';
 if(g.collegeTrack?.current||g.study)return 'college';
 if(g.age>=65)return 'senior';
 return g.job?'work':'adult';
}
function genEvent(kind,title,text,data={},publicKind=null){
 const s=genState(),event={id:++s.serial,age:g.age,kind,title,text,closed:false,seen:false,...data};
 s.events.push(event);
 if(publicKind)event.story=newsPublish(publicKind,title,text,{type:'generationEvent',ref:event.id},'generation-'+s.id+'-'+event.id);
 if(s.events.length>65){
  const index=s.events.findIndex(e=>e.closed);
  if(index>=0)s.events.splice(index,1);
 }
 return event;
}
function genCheckRelationship(){
 if(g.age<8)return;
 const s=genState();
 for(const r of g.rel.filter(r=>r.alive&&!r.deceased&&r.age>=3&&r.role!=='Pet'&&['fam','fri'].includes(r.t)&&
  (!r.genParents?.length||r.age>=8)&&(!['Mother','Father','Parent'].includes(r.role)||g.age>=15))){
  const c=genConnect(r),diff=g.age-c.last;
  const family=r.t==='fam'||genEligible(g).includes(r);
  if(c.status!=='close'){if(c.status==='estranged')r.bond=Math.max(18,r.bond);continue;}
  const threshold=family?6:5;
  if(diff>=threshold){
   c.status=family?'estranged':'former';c.repairs=0;c.requested=null;
   r.bond=cl(r.bond-14,18,100);
   if(!family){c.formerRole=r.role;c.formerType=r.t;r.role='Former friend';r.t='ex';}
   const invitation=s.events.find(e=>!e.closed&&e.kind==='contact'&&e.person===r.id);
   if(invitation)invitation.closed=true;
   relationshipMemory(r,'Distance changed the relationship after a long period without contact.','conflict');
   L(uiEscape(r.n)+(family?' became estranged after years without contact.':' stopped treating you as a close friend.'));
  }else if(diff>=3&&c.requested==null){
   c.requested=g.age;
   genEvent('contact',r.n+' wants to reconnect','They haven’t heard from you in a while and asked to spend time together.',{person:r.id});
   L(uiEscape(r.n)+' asked when you could get together.');
  }
 }
}
function genReconnect(id){
 const r=genFind(id);
 if(!r?.alive||!['estranged','former'].includes(r.connection?.status)||r.connection.attempt===g.age||publicityBusy())return;
 const c=r.connection;
 c.attempt=g.age;c.repairs++;r.bond=cl(r.bond+8);
 relationshipMemory(r,c.repairs>=2?'You kept showing up and began talking regularly again.':'You made a first attempt to reconnect.','reconciliation');
 if(c.repairs>=2){
  if(c.status==='former'){r.role=c.formerRole||'Friend';r.t=c.formerType||'fri';}
  c.status='close';c.last=g.age;c.requested=null;
  L(uiEscape(r.n)+' welcomed you back into their life.');
 }else L('You and '+uiEscape(r.n)+' agreed to talk again next year.');
 draw(1);
}
function genLifePerson(r){
 const p=genProfile(r);
 if(p.lastAge===g.age)return;
 p.lastAge=g.age;
 if(r.age>=18){
  if(!p.job||r.j!==p.job.t&&r.inc>0){
   const field=r.f&&LAD[r.f]?r.f:(r.age<22?'retail':'office'),level=LAD[field][r.lv||0]||LAD[field][0];
   if(r.j!=='Unemployed'&&r.age<65)p.job={t:r.inc>0?r.j:level[0],f:field,pay:r.inc||level[1],lv:r.lv||0,yrs:p.years};
  }
  if(r.age>=65||r.j==='Unemployed')p.job=null;
  if(p.job){
   if(r.inc>0)p.job.pay=Math.round(r.inc);
   p.years++;p.job.yrs=p.years;
   p.savings+=Math.round(p.job.pay*.105);
   if(r.age>=23&&['office','finance','tech','education','health'].includes(p.job.f))p.degree=2;
   else p.degree=Math.max(1,p.degree);
  }
  if(r.age>=23&&p.savings>=pr(18000)&&!p.assets.some(x=>x.key==='car')){
   const worth=pr(8700);p.savings-=worth;
   p.assets.push({key:'car',value:{id:r.id+'-car',n:'Used hatchback',v:worth,age:1,condition:84,cleanliness:76,purchasePrice:worth},loans:[],net:worth});
   L(uiEscape(r.n)+' bought their first car.');
  }
  if(r.age>=29&&p.savings>=pr(50000)&&!p.assets.some(x=>x.key==='home')){
   const worth=pr(72000),down=pr(40000),id=r.id+'-home';
   p.savings-=down;
   p.assets.push({key:'home',value:{id,n:'Small starter home',v:worth,own:true,beds:2,type:'Cottage',condition:87,cleanliness:82},
    loans:[{id:r.id+'-mortgage',assetId:id,h:id,n:'Starter home mortgage',kind:'home',bal:worth-down,rate:5,term:12,yearsLeft:12}],net:down});
   L(uiEscape(r.n)+' moved into a first home.');
  }
  const home=p.assets.find(x=>x.key==='home');
  const loan=home?.loans[0];
  if(loan?.bal>0&&p.savings>pr(2300)){
   const paid=Math.min(loan.bal,pr(2000));loan.bal-=paid;p.savings-=paid;home.net+=paid;
  }
 }
 r.m=p.savings;
 if(['Parent','Mother','Father','Grandparent','Grandmother','Grandfather','Spouse','Partner','Relative','In-law','Ex','Enemy'].includes(r.role))return;
 if(r===partner())return;
 if(r.age>=23&&r.age<=46&&(!p.partner||!genFind(p.partner)?.alive)&&genRoll(g,'spouse:'+r.id)<20){
  const role=r.role==='Child'?'In-law':'Relative';
  const spouse=genRel(role,r.age+genRoll(g,'partner:'+r.id,8)-3,[],r.t==='fam'?null:nm2());
  spouse.genPartner=r.id;p.partner=spouse.id;
  L(uiEscape(r.n)+' married '+uiEscape(spouse.n)+'.');
 }
 const children=g.rel.filter(x=>x.genParents?.includes(r.id));
 if(r.age>=24&&r.age<=45&&children.length<3&&(p.partner&&genFind(p.partner)?.alive||genRoll(g,'single-parent:'+r.id)<12)&&
   genRoll(g,'child:'+r.id)<26){
  const role=r.role==='Child'?'Grandchild':['Sibling','Step-sibling'].includes(r.role)?(genRoll(g,'niece:'+r.id)<50?'Niece':'Nephew'):'Relative';
  const baby=genRel(role,0,[r.id,...(p.partner?[p.partner]:[])]);
  if(r.t==='fam')genEvent('newRelative',r.n+' welcomed '+baby.n,'You can decide how to support the new household.',{person:r.id,baby:baby.id});
  L(uiEscape(r.n)+' welcomed '+uiEscape(baby.n)+' into the family.');
 }
}
function genFamilyYear(){
 const s=genState(),f=genFamilyInit();
 for(const r of g.rel.filter(r=>r.alive&&r.role!=='Pet'))genLifePerson(r);
 const parents=f.parents.map(genFind).filter(r=>r?.alive);
 if(!parents.length||g.age<6||s.events.some(e=>e.kind==='parents'&&!e.closed))return;
 const lag=g.age-f.since;
 let phase=null;
 if(f.status==='together'&&parents.length===2&&lag>=5&&genRoll(g,'divorce')<7)phase='separation';
 else if(f.status==='separated'&&lag>=2&&genRoll(g,'new-family')<30)phase=parents.length===2&&genRoll(g,'return')<35?'reunion':'remarriage';
 else if(parents.length===1&&f.status!=='blended'&&lag>=3&&genRoll(g,'single-family')<12)phase='remarriage';
 if(phase)genEvent('parents',{
  separation:'Your parents are separating',reunion:'Your parents are considering reconciliation',remarriage:'One of your parents is remarrying'
 }[phase],'They asked how you would like to handle the change in the family.',{phase});
}
function genMinorYear(){
 const kind=genTopic(),s=genState();
 if(kind==='early'){
  if(GEN_EARLY[g.age])L(GEN_EARLY[g.age]);
  return;
 }
 const scene=GEN_MOMENTS[kind],entry=scene[genRoll(g,'daily log',scene.length)];
 const cash=entry[1]<0?-Math.min(pr(-entry[1]),Math.max(0,g.cash)):pr(entry[1]);
 if(cash){g.cash+=cash;LD('Everyday life',cash);}
 L(entry[0]+(cash?' '+(cash>0?'Received ':'Spent ')+loc(Math.abs(cash))+'.':''));
 if(genRoll(g,'interact')<25&&!s.events.some(e=>e.kind==='daily'&&!e.closed)){
  const choice=GEN_SCENES[kind];
  genEvent('daily',choice[0],'Your choice can affect your spending, mood, and relationships.',{scene:kind});
 }
}
function genChoices(event){
 if(event.kind==='contact')return ['Make time to catch up','Send a thoughtful message','Put it off again'];
 if(event.kind==='newRelative')return ['Help with the new baby','Send your congratulations','Give them time to settle'];
 if(event.kind==='parents')return ['Hear both sides','Ask for time to process it','Keep some distance for now'];
 if(event.kind==='daily')return GEN_SCENES[event.scene][1];
 if(event.kind==='travel')return event.options.map(x=>x[0]);
 if(event.kind==='island')return ['Fund a public response','Open a community consultation','Leave the current plan in place'];
 return ['Acknowledge the update','Share a public response'];
}
function genRespond(e,i){
 const label=genChoices(e)[i];
 if(!label||e.closed)return {done:false,text:'This decision is unavailable.'};
 const r=e.person?genFind(e.person):null;
 let cash=0,boost=0,delta=0;
 if(e.kind==='contact'){delta=[9,5,-4][i];boost=[3,1,-1][i];}
 if(e.kind==='newRelative'){delta=[8,4,0][i];cash=i===0?-pr(70):0;}
 if(e.kind==='daily'){const d=GEN_SCENES[e.scene];cash=Math.sign(d[2][i])*pr(Math.abs(d[2][i]));boost=d[3][i];}
 if(e.kind==='parents')genParentsDecision(e.phase,i);
 if(e.kind==='travel'){const [,amount,mood]=e.options[i];cash=Math.sign(amount)*pr(Math.abs(amount));boost=mood;}
 if(g.cash<-cash)return {done:false,text:'You need '+loc(-cash)+' for this choice.'};
 if(e.kind==='island'){
  const result=genIslandResolve(e,i);
  if(result)return {done:false,text:result};
 }
 if(cash){g.cash+=cash;LD('Life decisions',cash);}
 if(r?.alive){
  r.bond=cl(r.bond+delta);
  if(delta>0){genContact(r,delta);genConnect(r).requested=null;}
  relationshipMemory(r,label+'.');
 }
 if(e.kind==='travel'&&genState().trip)genState().trip.pending=null;
 if(e.kind==='update'&&e.story&&i===1)g.pop=cl(g.pop+2);
 g.happy=cl(g.happy+boost);
 e.closed=true;
 L(label+'.');
 return {done:true,text:label+'.'};
}
function genParentsDecision(phase,index){
 const f=genFamilyInit(),parents=f.parents.map(genFind).filter(r=>r?.alive);
 if(phase==='separation'){
  f.status='separated';
  for(const r of parents)r.mar=0;
  L('Your parents separated and began keeping separate households.');
 }else if(phase==='reunion'){
  f.status='together';
  for(const r of parents)r.mar=1;
  L('Your parents decided to get back together.');
 }else if(phase==='remarriage'&&parents.length){
  f.status='blended';
  const parent=parents[genRoll(g,'remarried-parent',parents.length)];
  const step=genRel('Step-parent',parent.age+2);
  step.genPartner=parent.id;step.stepFor=parent.id;f.step=step.id;parent.mar=1;
  genRel('Step-sibling',Math.max(3,g.age-3),[step.id]);
  if(genRoll(g,'second-step-child')<50)genRel('Step-sibling',Math.min(25,g.age+1),[step.id]);
  L(uiEscape(parent.n)+' married '+uiEscape(step.n)+'. You now have step-family.');
 }
 f.since=g.age;
 for(const r of parents){r.bond=cl(r.bond+[6,2,-7][index]);if(index<2)genContact(r,2);}
}
