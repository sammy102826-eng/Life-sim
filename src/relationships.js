/* Relationship, grief, fertility, and family-planning update */
let relationshipOpen = {};
function relationshipRole(r, names){return !!r&&names.includes(r.role)}
function relationshipAlive(){return (g.rel||[]).filter(r=>r.alive)}
function relationshipIsExtended(r){return /^(Grandmother|Grandfather|Grandparent|Cousin|Aunt|Uncle|Niece|Nephew|In-law|Great-Grandmother|Great-Grandfather|Relative)/i.test(r.role||'')}
function relationshipCategories(){
 const a=relationshipAlive(), group=(label,fn)=>({label,people:a.filter(fn)});
 const cats=[
  group('Parents',r=>r.t==='fam'&&/^(Mother|Father|Parent)$/.test(r.role||'')),
  group('Siblings',r=>r.t==='fam'&&r.role==='Sibling'),
  group('Pets',r=>r.role==='Pet'),
  group('Dating / Spouse',r=>r.role==='Partner'||r.role==='Spouse'),
  group('Children',r=>r.t==='fam'&&r.role==='Child'),
  group('Extended family',relationshipIsExtended),
  group('Friends',r=>r.t==='fri'&&r.role!=='Partner'&&r.role!=='Ex')
 ].filter(c=>c.people.length);
 const past=a.filter(r=>r.t==='ex'||r.t==='en'||r.role==='Ex');
 if(past.length)cats.push({label:'Past relationships',people:past});
 const dead=(g.rel||[]).filter(r=>r.deceased||r.deathAt!=null);
 if(dead.length)cats.push({label:'Deceased relationships',people:dead,dead:true});
 return cats;
}
function relationshipToggle(k){relationshipOpen[k]=!relationshipOpen[k];sel=null;draw()}
function relationshipPersonCard(r,dead){
 return `<div class="card relPerson" onclick="relationshipOpenPerson('${r.id}')" style="padding:10px;margin:6px 0;cursor:pointer"><div class=row><span class=t>${r.n}</span><span class=d>${dead?'Deceased':r.role}, ${dead?(r.deathAge==null?(r.age||0):r.deathAge):r.age}${!dead&&r.bond<35&&r.t!=='en'?' · at risk':''}</span></div><p class=d style="margin:2px 0">${dead?(r.deathCause||'Remembered with love'):jobLine(r)}</p>${dead?'':Bar('Bond',r.bond,rc(r.bond))}</div>`;
}
function relationshipPopup(id, headline, choices){
 const r=(g.rel||[]).find(x=>x.id===id&&x.alive); if(!r)return toast('That relationship is no longer active.');
 g.event={x:headline,c:choices};draw();
}
function relationshipInteract(id,action){
 const r=(g.rel||[]).find(x=>x.id===id&&x.alive);if(!r)return toast('That relationship is no longer active.');
 const k=key(r),cost=n=>pr(n);
 if(r.role==='Pet'){
  if(action==='pet-play')return A({relId:id,relDelta:8,p:3,h:1},`You played with ${r.n}. Your bond grew stronger.`);
  if(action==='pet-walk')return A({relId:id,relDelta:6,p:2,fit:1},`You took ${r.n} for a walk.`);
  if(action==='pet-train')return A({relId:id,relDelta:5,s:1},`You practiced a new skill with ${r.n}.`);
  if(action==='pet-vet'){const c=cost(150);if(g.cash<c)return toast('You need more money for the vet visit.');return A({m:-c,relId:id,relDelta:4,p:1},`${r.n} had a vet checkup.`)}
 }
 if(/^(Mother|Father|Parent)$/.test(r.role)){
  if(action==='parent-talk')return relationshipPopup(id,`${r.n} asks how life has really been going.`,[['Open up about your worries',{relId:id,relDelta:8,p:3},'You feel heard.'],['Ask for practical advice',{relId:id,relDelta:5,s:2},'Their experience gives you a new perspective.'],['Keep everything to yourself',{relId:id,relDelta:-2,p:1},'You change the subject.']]);
  if(action==='parent-help'){const choices=[];if(g.cash>=cost(150))choices.push(['Help out financially or with errands',{relId:id,relDelta:8,m:-cost(150),p:-1},'The extra help means a lot.']);choices.push(['Offer to check in more often',{relId:id,relDelta:5,p:1},'You make a plan to stay in touch.'],['Say you are too busy',{relId:id,relDelta:-6,p:-2},'They are disappointed.']);return relationshipPopup(id,`${r.n} could use some help this year.`,choices);}
  if(action==='parent-memory')return relationshipPopup(id,`You and ${r.n} look back on a family memory.`,[['Ask them to tell the story',{relId:id,relDelta:6,s:1,p:2},'The story becomes a favorite memory.'],['Share your version',{relId:id,relDelta:8,p:3},'You laugh about the details you remember differently.'],['Change the subject',{relId:id,relDelta:-1},'The moment passes.']]);
 }
 if(r.role==='Sibling'){
  if(action==='sib-hang')return relationshipPopup(id,`You and ${r.n} have time to reconnect.`,[['Play a game or revisit an old hobby',{relId:id,relDelta:7,p:3},'It feels like old times.'],['Compete at something',{relId:id,relDelta:ch(65)?5:-6,p:2},'A little rivalry returns.'],['Talk honestly about an old conflict',{relId:id,relDelta:8,p:-1},'You finally clear the air.']]);
  if(action==='sib-help')return relationshipPopup(id,`${r.n} needs advice on a personal decision.`,[['Listen without judging',{relId:id,relDelta:8,p:2},'They trust you with more of their life.'],['Give direct advice',{relId:id,relDelta:ch(65)?5:-4,s:1},'Your advice is clear, if a little blunt.'],['Avoid getting involved',{relId:id,relDelta:-4},'They handle it alone.']]);
  if(action==='sib-secret')return relationshipPopup(id,`${r.n} shares a private family worry with you.`,[['Keep their confidence',{relId:id,relDelta:9,p:2},'They know they can trust you.'],['Tell another relative',{relId:id,relDelta:-12,p:-3},'The news spreads and causes tension.']]);
 }
 if(r.role==='Child'){
  if(action==='child-listen')return relationshipPopup(id,`${r.n} wants your attention and asks to talk.`,[['Put everything else aside and listen',{relId:id,relDelta:8,p:3},'Your child feels understood.'],['Offer advice right away',{relId:id,relDelta:ch(65)?4:-3,s:1},'You try to help, though they may not feel fully heard.'],['Tell them you are busy',{relId:id,relDelta:-7,p:-2},'They quietly back away.']]);
  if(action==='child-school'){const choices=[['Work through it together',{relId:id,relDelta:7,s:2,p:2},'You make progress as a team.']];if(g.cash>=cost(200))choices.push(['Arrange extra support',{relId:id,relDelta:5,m:-cost(200),s:2},'They get additional help.']);choices.push(['Tell them to figure it out',{relId:id,relDelta:-6,p:-2},'They feel unsupported.']);return relationshipPopup(id,`${r.n} is having a difficult time with school or a new challenge.`,choices);}
  if(action==='child-outing'){const choices=[];if(g.cash>=cost(120))choices.push([`Special outing (${loc(cost(120))})`,{relId:id,relDelta:9,m:-cost(120),p:4},'The two of you make a lasting memory.']);choices.push(['Free day at home',{relId:id,relDelta:6,p:3},'Simple time together is just what you needed.'],['Postpone it',{relId:id,relDelta:-3,p:-1},'They are disappointed.']);return relationshipPopup(id,`You plan a day that is just for ${r.n}.`,choices);}
  if(action==='child-boundaries')return relationshipPopup(id,`${r.n} tests a boundary and you need to respond.`,[['Explain the reason calmly',{relId:id,relDelta:5,s:1,p:1},'The boundary is clear without damaging trust.'],['Use a firm consequence',{relId:id,relDelta:ch(70)?2:-3,p:-1},'The lesson may stick, although feelings are mixed.'],['Let it slide',{relId:id,relDelta:-1,p:1},'The immediate tension fades.']]);
  if(action==='child-celebrate')return relationshipPopup(id,`${r.n} has something they are proud of and wants you to notice.`,[['Celebrate their effort',{relId:id,relDelta:8,p:4},'They feel seen and encouraged.'],['Focus only on the result',{relId:id,relDelta:2,s:1},'They hear the praise, but also the pressure.'],['Miss the moment',{relId:id,relDelta:-6,p:-2},'They feel overlooked.']]);
 }
 if(r.role==='Partner'||r.role==='Spouse'){
  if(action==='partner-date'){const choices=[];if(g.cash>=cost(120))choices.push([`Plan a thoughtful date (${loc(cost(120))})`,{relId:id,relDelta:9,m:-cost(120),p:4},'You reconnect and laugh together.']);choices.push(['Take a walk and talk',{relId:id,relDelta:6,p:3,h:1},'The simple evening goes well.'],['Cancel at the last minute',{relId:id,relDelta:-7,p:-2},'They feel like an afterthought.']);return relationshipPopup(id,`You and ${r.n} want to spend meaningful time together.`,choices);}
  if(action==='partner-future')return relationshipPopup(id,`${r.n} asks what the next few years should look like for you both.`,[['Make a shared plan',{relId:id,relDelta:8,s:1,p:2},'You agree on a few goals.'],['Admit you are unsure but keep talking',{relId:id,relDelta:4,p:-1},'It is honest, even without easy answers.'],['Avoid the conversation',{relId:id,relDelta:-7,p:-2},'The uncertainty hangs over you.']]);
  if(action==='partner-repair')return relationshipPopup(id,`There is still tension after a disagreement with ${r.n}.`,[['Own your part and apologize',{relId:id,relDelta:9,p:1},'The apology makes room for a better conversation.'],['Explain your side and listen',{relId:id,relDelta:6,s:1},'You understand each other more clearly.'],['Insist that you did nothing wrong',{relId:id,relDelta:-8,p:-3},'The argument starts again.']]);
  if(action==='try-baby')return tryForBaby();
  if(action==='break')return breakUp();
 }
 if(r.t==='fri'&&r.role==='Friend'){
  if(action==='friend-out'){const choices=[];if(g.cash>=cost(60))choices.push([`Go somewhere fun (${loc(cost(60))})`,{relId:id,relDelta:8,m:-cost(60),p:4},'You both have a great time.']);choices.push(['Have a low-cost catch-up',{relId:id,relDelta:6,p:2},'The conversation flows easily.'],['Cancel the plan',{relId:id,relDelta:-6,p:-2},'They are annoyed by the late change.']);return relationshipPopup(id,`You invite ${r.n} to spend a day together.`,choices);}
  if(action==='friend-support')return relationshipPopup(id,`${r.n} tells you they are struggling.`,[['Listen and offer practical help',{relId:id,relDelta:9,p:-1},'They feel less alone.'],['Give them space but check in later',{relId:id,relDelta:5,p:1},'They appreciate the thoughtful follow-up.'],['Make it about your own problems',{relId:id,relDelta:-7,p:-2},'They feel dismissed.']]);
  if(action==='friend-celebrate')return relationshipPopup(id,`${r.n} has some good news.`,[['Celebrate with them',{relId:id,relDelta:8,p:4},'Their excitement is contagious.'],['Offer a practical next step',{relId:id,relDelta:5,s:1},'You help them plan what comes next.'],['Act jealous',{relId:id,relDelta:-8,p:-2},'The mood changes quickly.']]);
  if(action==='friend-trust')return relationshipPopup(id,`You have a chance to deepen your friendship with ${r.n}.`,[['Share something personal',{relId:id,relDelta:8,p:2},'You both let your guard down.'],['Ask about their goals',{relId:id,relDelta:6,s:1},'You learn something new about them.'],['Keep things superficial',{relId:id,relDelta:1},'The friendship stays comfortable but unchanged.']]);
 }
 if(relationshipIsExtended(r)){
  if(action==='extended-call')return relationshipPopup(id,`You call ${r.n} and hear the latest family news.`,[['Stay on the phone and catch up',{relId:id,relDelta:7,p:2},'The distance feels smaller.'],['Ask about family history',{relId:id,relDelta:6,s:2},'You learn a story worth passing down.'],['Keep it brief',{relId:id,relDelta:1},'You promise to call again.']]);
  if(action==='extended-visit'){const choices=[];if(g.cash>=cost(250))choices.push([`Make the trip (${loc(cost(250))})`,{relId:id,relDelta:9,m:-cost(250),p:3},'The visit brings everyone closer.']);choices.push(['Arrange a video call',{relId:id,relDelta:5,p:2},'It is a good substitute for now.'],['Put it off',{relId:id,relDelta:-3},'The visit stays on the to-do list.']);return relationshipPopup(id,`You are considering a visit with ${r.n}.`,choices);}
 }
 if(r.t==='ex'||r.t==='en'){
  if(action==='past-talk')return relationshipPopup(id,`You are thinking about how to handle things with ${r.n}.`,[['Set a respectful boundary',{relId:id,relDelta:2,p:1},'You leave the conversation with clearer limits.'],['Try a sincere reconciliation',{relId:id,relDelta:8,p:2},'There may be room to rebuild trust.'],['Cut contact',{relEndId:id,p:-2},'You decide to move on.']]);
 }
 toast('That interaction is not available for this relationship.');
}
function relationshipOpenPerson(id){sel=id;draw()}
function relationshipBack(){sel=null;draw()}
function relationshipCardActions(r){
 const id=r.id,k=key(r),out=[];
 if(/^(Mother|Father|Parent)$/.test(r.role)){
  out.push(B('Talk about your life',`relationshipInteract('${id}','parent-talk')`),B('Help them with a problem',`relationshipInteract('${id}','parent-help')`,false),B('Share a family memory',`relationshipInteract('${id}','parent-memory')`));
  if(g.age>=10)out.push(B('Ask for money','ask()',((r.m||0)<300)||g.age<10||r.bond<25));
 }
 if(r.role==='Sibling')out.push(B('Reconnect and hang out',`relationshipInteract('${id}','sib-hang')`),B('Help with a decision',`relationshipInteract('${id}','sib-help')`),B('Handle a private family secret',`relationshipInteract('${id}','sib-secret')`));
 if(r.role==='Pet')out.push(B('Play together',`relationshipInteract('${id}','pet-play')`),B('Go for a walk',`relationshipInteract('${id}','pet-walk')`),B('Train a new skill',`relationshipInteract('${id}','pet-train')`),B('Vet visit',`relationshipInteract('${id}','pet-vet')`,g.cash<pr(150)));
 if(r.role==='Partner'||r.role==='Spouse'){
  out.push(B('Plan time together',`relationshipInteract('${id}','partner-date')`,false),B('Talk about the future',`relationshipInteract('${id}','partner-future')`),B('Repair a disagreement',`relationshipInteract('${id}','partner-repair')`));
  if(r.role==='Partner'&&!r.eng)out.push(B('Propose','propose()',g.age<18));
  if(r.eng)out.push(`<div class=t style="margin:10px 0 6px">Plan the wedding</div>`+[0,1,2].map(q=>`<p class=d>${WN[q]}: ${r.wd&&r.wd[q]!=null?WED[q][r.wd[q]][0]:'not chosen'}</p>`+WED[q].map((o,i)=>B(`${o[0]} <small>${loc(pr(o[1]))}</small>`,`wedPick(${q},${i})`)).join('')).join('')+B('Hold the wedding','marry()',!r.wd||[0,1,2].some(q=>r.wd[q]==null)));
  if(g.age>=18&&g.age<=50)out.push(B('Try for a baby','tryForBaby()',!!relationshipRepro().pregnancy||r.age<18||r.bond<20));
  out.push(B(r.role==='Spouse'?'Divorce':'Break up',`relationshipInteract('${id}','break')`));
 }
 if(r.role==='Child')out.push(B('Listen to them',`relationshipInteract('${id}','child-listen')`),B('Help with school or a challenge',`relationshipInteract('${id}','child-school')`,false),B('Plan a day together',`relationshipInteract('${id}','child-outing')`,false),B('Set age-appropriate boundaries',`relationshipInteract('${id}','child-boundaries')`),B('Celebrate their progress',`relationshipInteract('${id}','child-celebrate')`));
 if(relationshipIsExtended(r))out.push(B('Call and catch up',`relationshipInteract('${id}','extended-call')`),B('Plan a visit',`relationshipInteract('${id}','extended-visit')`,false));
 if(r.t==='fri'&&r.role==='Friend')out.push(B('Invite them out',`relationshipInteract('${id}','friend-out')`,false),B('Support them through a hard time',`relationshipInteract('${id}','friend-support')`),B('Celebrate their good news',`relationshipInteract('${id}','friend-celebrate')`),B('Build trust',`relationshipInteract('${id}','friend-trust')`),B('End friendship',`cut()`,false));
 if(r.t==='ex'||r.t==='en')out.push(B('Talk through the past',`relationshipInteract('${id}','past-talk')`),r.t==='ex'?B('Get back together','getBack()',!!partner()):B('Try to make peace','ra(0)'));
 if(r.role==='Spouse'||r.role==='Partner')out.push(B('Plan a family',"tab='Other';NV.O=[];nv('O','Health');nv('O','Family Planning')",false));
 return out.join('');
}
function relationshipMourn(id,kind){
 const r=(g.rel||[]).find(x=>x.id===id&&(x.deceased||x.deathAt!=null));if(!r)return toast('This memory is not available.');
 if(kind==='memorial'){
  const c=pr(300);if(g.cash<c)return toast('You need more money to hold a memorial.');
  if(r.mournedAge===g.age)return toast('You have already held a remembrance this year.');
  r.mournedAge=g.age;r.mourned=true;return A({m:-c,p:-3,relId:id,relDelta:0},`You held a small memorial for ${r.n}. It gave the family a place to share stories.`);
 }
 if(kind==='grave'){
  if(r.mournedAge===g.age)return toast('You have already visited or remembered them this year.');
  r.mournedAge=g.age;r.mourned=true;return A({p:-2,s:1},`You visited ${r.n}'s resting place and thought about the memories you shared.`);
 }
 if(kind==='journal'){
  if(r.mournedAge===g.age)return toast('You have already remembered them this year.');
  r.mourned=true;r.mournedAge=g.age;return A({p:-1,s:2},`You wrote down your favorite memories of ${r.n}.`);
 }
}
function relationshipView(){
 const r=sel&&who();
 if(r&&(r.alive||r.deceased||r.deathAt!=null)){
  const dead=!!(r.deceased||r.deathAt!=null);
  if(dead)return `${B('Back to Relationships','relationshipBack()')}<div class=card><div class=t>${r.n}</div><p class=d>${r.role} · remembered${r.deathCause?' · '+r.deathCause:''}</p><p class=d>${r.deathAge!=null?'Age at death: '+r.deathAge+'. ':''}${r.origin==='Adopted'?'You joined the family through adoption. ':''}Their relationship bond was ${Math.round(r.bond||0)} when you last knew them.</p><p class=ln>${r.memory||'Your time together is part of your life story.'}</p></div><div class=t style="margin:12px 0 6px">Remember ${r.n}</div>${B('Visit their resting place','relationshipMourn(\''+r.id+'\',\'grave\')',r.mournedAge===g.age)}${B(`Hold a memorial (${loc(pr(300))})`,'relationshipMourn(\''+r.id+'\',\'memorial\')',g.cash<pr(300)||r.mournedAge===g.age)}${B('Write down a favorite memory','relationshipMourn(\''+r.id+'\',\'journal\')',r.mournedAge===g.age)}`;
  let extra='';
  if(r.role==='Child')extra=`<p class=d>${r.origin==='Adopted'?'Adopted child':r.origin==='IVF'?'Child conceived through IVF':r.origin==='Donor conception'?'Child conceived with donor assistance':r.origin==='Surrogacy'?'Child born through surrogacy':r.origin==='Natural birth'?'Biological child':'Child'} · ${r.age<18?'dependent':'adult child'}</p>`;
  return `${B('Back to Relationships','relationshipBack()')}<div class=card><div class=t>${r.n}</div><p class=d>${r.role}${r.eng?' (engaged)':''} · age ${r.age}</p><p class=d>${jobLine(r)}</p>${extra}${Bar('Bond',r.bond,rc(r.bond))}${r.bond<25&&r.role!=='Pet'?'<p class=d style="color:#E08E79">This relationship needs attention. Your next choice can change where it goes.</p>':''}</div>${r.bond<50&&r.role!=='Pet'?B('Apologize or make amends',`A({relId:'${r.id}',relDelta:6,p:1},'You tried to make things right with ${r.n}.')`):''}${relationshipCardActions(r)}`;
 }
 sel=null;
 const cats=relationshipCategories();
 let c=`<p class=d>Every relationship has its own choices and consequences. Sections appear when there is someone in that part of your life. Family planning, fertility care, and birth control are in Other → Health.</p>`;
 if(cats.some(x=>x.people.length))c+=B('Spend time with everyone','spendAll()',g.age<3);
 for(const cat of cats){const n=cat.people.length,opened=!!relationshipOpen[cat.label];c+=`<div class="card relSection" style="padding:0;overflow:hidden;margin:7px 0"><div class="row" onclick="relationshipToggle('${cat.label}')" style="padding:12px;cursor:pointer;align-items:center"><span class=t>${cat.label}</span><span class=d>${n} ${opened?'▾':'▸'}</span></div>`;
  if(opened)c+=`<div style="padding:0 8px 8px">${cat.people.map(p=>relationshipPersonCard(p,!!cat.dead)).join('')}${cat.label==='Extended family'?B('Meet another relative','meetRelative()',false):''}</div>`;
  c+='</div>';
 }
 if(!cats.length)c+=`<div class=card><div class=t>Your circle is still small</div><p class=d>Friends can be made through school, social activities, or Other → Social. A partner can be found under Other → Love. Pets can be adopted from Stuff.</p></div>`;
 return c;
}
relV=relationshipView;
function meetRelative(){
 const role=P(['Cousin','Aunt','Uncle','Grandmother','Grandfather']),age=role==='Cousin'?Math.max(1,g.age+R(-8,8)):role==='Aunt'||role==='Uncle'?Math.max(18,g.age+R(15,35)):Math.max(45,g.age+R(25,45));
 const r={id:uid(),n:nm2(),t:'fam',role,bond:R(30,60),age,alive:true,m:R(0,8000),origin:'Extended family'};jobFor(r,1);g.rel.push(r);relationshipOpen['Extended family']=true;A({p:2},`At a family gathering, you met ${r.n}, your ${role.toLowerCase()}. They are now in Extended family.`);
}
function relationshipRepro(){
 if(!g.repro||typeof g.repro!=='object')g.repro={naturalPossible:ch(86),known:false,attempts:0,birthControl:'None',pregnancy:null,adoptionCount:0,lastBCAge:-1,suspected:false};
 const x=g.repro;if(typeof x.naturalPossible!=='boolean')x.naturalPossible=ch(86);if(!x.birthControl)x.birthControl='None';if(!Number.isFinite(x.attempts))x.attempts=0;return x;
}
function relationshipAddChild(method,age){
 const names=['Maya','Noah','Ava','Eli','Sofia','Lucas','Amira','Theo','Mila','Kai','Nora','Leo'];
 const surname=(g.name||'Rivera').split(' ').slice(-1)[0]||'Rivera';
 const child={id:uid(),n:P(names)+' '+surname,t:'fam',role:'Child',bond:R(78,95),age:Math.max(0,age||0),alive:true,m:0,origin:method||'Natural birth',birthAge:g.age,school:{}};
 g.rel.push(child);g.relationshipMemory=g.relationshipMemory||[];g.relationshipMemory.unshift({type:'birth',name:child.n,age:g.age,method:child.origin});return child;
}
function relationshipConceptionAttempt(){
 const repro=relationshipRepro(),p=partner();
 if(g.age<18||g.age>50)return {ok:false,msg:'Natural conception attempts are not available at this age in the game.'};
 if(!p||p.age<18)return {ok:false,msg:'You need an adult partner to try for a baby.'};
 if(repro.pregnancy)return {ok:false,msg:'You are already expecting a child. Wait for the pregnancy to progress.'};
 repro.attempts++;
 let chance= g.age<30?46:g.age<35?38:g.age<40?25:g.age<45?12:4;
 chance+=Math.round((g.health-60)*.18)+(p.age>=40?-8:p.age>=35?-3:0);
 if(repro.birthControl!=='None')chance=Math.round(chance*({Condoms:.18,'Birth control pill':.06,IUD:.02,Implant:.02}[repro.birthControl]||.1));
 chance=cl(chance,1,55);
 if(repro.naturalPossible&&ch(chance)){
  repro.pregnancy={dueAge:g.age+1,partnerId:p.id,partnerName:p.n,method:'Natural birth'};
  repro.attempts=0;repro.suspected=false;
  return {ok:true,msg:`You and ${p.n} are expecting a baby. The pregnancy will progress over the next year.`,bond:5,p:6};
 }
 if(repro.attempts>=3){repro.suspected=true;return {ok:false,msg:`You and ${p.n} have had trouble conceiving. A fertility consultation can help clarify your options.`,bond:1,p:-2};}
 return {ok:false,msg:`You and ${p.n} did not conceive this time. You can try again later or arrange a fertility consultation.`,bond:1,p:-1};
}
function tryForBaby(){
 const p=partner(),repro=relationshipRepro();
 if(g.age<18||g.age>50)return toast('Family planning for pregnancy is available from age 18 to 50 in this game.');
 if(!p||p.age<18)return toast('You need an adult dating partner or spouse to try for a baby.');
 if(repro.pregnancy)return toast('You are already expecting a child.');
 if(repro.birthControl!=='None'){
  g.event={x:`You currently use ${repro.birthControl.toLowerCase()}. Decide how to handle contraception before trying for a baby.`,c:[['Pause contraception and try',{relationshipCommand:'stop-bc-try',relId:p.id},'You stop your current method and try to conceive.'],['Keep using contraception',{relId:p.id,relDelta:1,p:1},'You decide to wait before trying.']]};return draw();
 }
 const o=relationshipConceptionAttempt();A({p:o.p||0,relId:p.id,relDelta:o.bond||0},o.msg);
}
function birthControlSet(method){
 const repro=relationshipRepro();if(g.age<13)return toast('Health education and contraception options unlock at age 13.');
 if(repro.pregnancy&&method!=='None')return toast('You are already expecting.');if(repro.birthControl===method)return toast('That method is already selected.');
 const costs={Condoms:0,'Birth control pill':0,IUD:pr(650),Implant:pr(500)},c=costs[method]||0;
 if(g.cash<c)return toast('You need more money for this option.');
 repro.birthControl=method;repro.lastBCAge=g.age;
 if(c)g.cash-=c;
 A({m:-0,p:method==='None'?0:1},method==='None'?'You stopped using your current birth control method.':`${method} selected. ${method==='Condoms'||method==='Birth control pill'?'A yearly supply cost will appear in your budget.':'The insertion cost was paid.'}`);
}
function fertilityTest(){
 const repro=relationshipRepro();if(g.age<16)return toast('Fertility consultation unlocks at age 16.');const c=pr(250);if(g.cash<c)return toast('You need more money for a consultation.');repro.known=true;repro.testAge=g.age;
 if(repro.naturalPossible)A({m:-c,p:1},'The consultation found no indication of a major natural fertility barrier. Conception is never guaranteed, and age can still matter.');
 else A({m:-c,p:-1},'The consultation found a fertility barrier that makes natural conception very unlikely. Assisted reproduction, donor conception, surrogacy, and adoption remain options.');
}
function relationshipFamilyMethod(method){
 const repro=relationshipRepro();const methods={adopt:{name:'adoption',cost:5000,minAge:21},ivf:{name:'IVF treatment',cost:12000,minAge:18},donor:{name:'donor conception',cost:8500,minAge:18},surrogacy:{name:'surrogacy arrangement',cost:65000,minAge:18}};const o=methods[method];if(!o)return;
 if(method!=='adopt'&&repro.pregnancy)return toast('You are already expecting a child. Wait until this pregnancy is complete.');
 if(g.age<o.minAge)return toast(`${o.name[0].toUpperCase()+o.name.slice(1)} is available from age ${o.minAge}.`);
 if(g.age>50&&method!=='adopt')return toast('This family-building option is not currently available at this age in the game.');
 const c=pr(o.cost);if(g.cash<c)return toast(`You need ${loc(c)} for ${o.name}.`);
 const line=method==='adopt'?'Applications involve eligibility checks and approval; this game resolves the process through a simplified chance-based outcome.':method==='ivf'?'IVF uses fertility treatment and does not guarantee a pregnancy.':method==='donor'?'Donor conception is an alternative when natural conception is difficult or impossible.':'Surrogacy can help build a family when carrying a pregnancy is not possible.';
 g.event={x:`You are considering ${o.name}. ${line} The game abstracts legal and medical requirements, which differ in real life.`,c:[[`Proceed (${loc(c)})`,{familyPlan:method,m:-c,p:-1},`You begin the ${o.name} process.`],['Not right now',{},'You decide to wait.']]};draw();
}
function relationshipPrenatal(){const r=relationshipRepro();if(!r.pregnancy)return toast('There is no pregnancy in progress.');if(r.pregnancy.prenatal)return toast('You have already recorded a prenatal appointment for this pregnancy.');const c=pr(250);if(g.cash<c)return toast('You need more money for a prenatal appointment.');r.pregnancy.prenatal=true;A({m:-c,p:2},'You attended a prenatal appointment and reviewed the next steps for a healthy pregnancy.');}
function relationshipPrepareBaby(){const r=relationshipRepro();if(!r.pregnancy)return toast('There is no pregnancy in progress.');if(r.pregnancy.prepared)return toast('You have already made preparations for this baby.');const choices=[];if(g.cash>=pr(600))choices.push(['Set aside money for supplies ('+loc(pr(600))+')',{familyPrep:'supplies',m:-pr(600),p:2},'You prepare a practical starter budget.']);choices.push(['Ask a relative for support',{familyPrep:'support',relGroup:'parents',relDelta:3,p:2},'You talk through the kind of help that would make a difference.'],['Keep plans simple',{familyPrep:'simple',p:1},'You decide to focus on what the baby will need first.']);g.event={x:'The baby is on the way. How will you prepare for the transition?',c:choices};draw();}
function relationshipRunFamilyPlan(method){
 const repro=relationshipRepro();if(method!=='adopt'&&repro.pregnancy)return false;
 const agePenalty=Math.max(0,g.age-30)*1.1,healthBonus=(g.health-50)*.25;
 if(method==='adopt'){
  if(g.age<21){L('The adoption application was not accepted because you are too young in the game.');return}
  if(ch(82)){const child=relationshipAddChild('Adopted',R(0,4));repro.adoptionCount=(repro.adoptionCount||0)+1;L(`Your adoption was approved. ${child.n}, age ${child.age}, joined your family. You can find them in Relationships → Children.`);g.happy=cl(g.happy+7)}else{L('The adoption agency did not approve the application this time. The application fee was not refunded.');g.happy=cl(g.happy-2)}
  return;
 }
 let chance=method==='ivf'?45+healthBonus-agePenalty:method==='donor'?66+healthBonus-agePenalty*.45:method==='surrogacy'?72-agePenalty*.4:0;chance=cl(Math.round(chance),8,82);
 if(ch(chance)){
  repro.pregnancy={dueAge:g.age+1,partnerId:partner()?partner().id:null,partnerName:partner()?partner().n:null,method:method==='ivf'?'IVF':method==='donor'?'Donor conception':'Surrogacy'};
  repro.attempts=0;repro.suspected=false;L(`${method==='ivf'?'IVF treatment':method==='donor'?'Donor conception':'Your surrogacy arrangement'} was successful. You are expecting a child, and the birth will progress over the next year.`);g.happy=cl(g.happy+4);
 }else{L(`${method==='ivf'?'The IVF cycle':method==='donor'?'The donor-conception attempt':'The surrogacy application'} did not lead to a child this time. The costs were not refunded.`);g.happy=cl(g.happy-3)}
}
function familyPlanningView(){
 const r=relationshipRepro(),canTry=g.age>=18&&g.age<=50,methods=[['Condoms','Low-cost protection; annual expense'],['Birth control pill','Prescription; annual expense'],['IUD','One-time insertion cost'],['Implant','One-time insertion cost']];
 let status=!r.known?'Not tested':r.naturalPossible?'No major natural fertility barrier identified':'Natural conception may be very unlikely';
 let c=`<div class=card><div class=t>Family planning</div><p class=d>Current method: <b>${r.birthControl}</b></p><p class=d>Fertility assessment: <b>${status}</b></p><p class=d>${r.pregnancy?`Pregnancy in progress · expected birth at age ${r.pregnancy.dueAge}. ${r.pregnancy.prenatal?'Prenatal appointment completed.':''} ${r.pregnancy.prepared?'You have made preparations for the baby.':''}`:'No pregnancy in progress.'} Natural conception can be unpredictable; the game allows fertility barriers and alternative family-building routes.</p></div>`;if(r.pregnancy)c+=B('Attend prenatal appointment <small>'+loc(pr(250))+'</small>','relationshipPrenatal()',g.cash<pr(250)||!!r.pregnancy.prenatal)+B('Prepare for the baby','relationshipPrepareBaby()',!!r.pregnancy.prepared);
 c+=`<div class=t style="margin:12px 0 6px">Birth control</div>`;
 if(g.age<13)c+=`<p class=d>Health education unlocks at age 13.</p>`;
 else c+=B('Use condoms <small>Annual cost about '+loc(pr(80))+'</small>',"birthControlSet('Condoms')",r.birthControl==='Condoms')+B('Use birth control pill <small>Annual cost about '+loc(pr(220))+'</small>',"birthControlSet('Birth control pill')",r.birthControl==='Birth control pill')+B('Get an IUD <small>One-time cost '+loc(pr(650))+'</small>',"birthControlSet('IUD')",g.cash<pr(650)||r.birthControl==='IUD')+B('Get an implant <small>One-time cost '+loc(pr(500))+'</small>',"birthControlSet('Implant')",g.cash<pr(500)||r.birthControl==='Implant')+(r.birthControl!=='None'?B('Stop current contraception',"birthControlSet('None')",false):'');
 c+=`<div class=t style="margin:12px 0 6px">Fertility & pregnancy</div>`+B('Fertility consultation <small>'+loc(pr(250))+'</small>','fertilityTest()',g.age<16||g.cash<pr(250));
 if(canTry)c+=`<p class=d>To try naturally, open your Dating / Spouse relationship and choose Try for a baby. A partner is required.</p>`;
 c+=`<div class=t style="margin:12px 0 6px">Other ways to build a family</div><p class=d>These routes can be used even when natural conception is not possible. Success is not guaranteed; each option has an upfront cost.</p>`+B('Adoption <small>From age 21 · '+loc(pr(5000))+'</small>',"relationshipFamilyMethod('adopt')",g.age<21||g.cash<pr(5000))+B('IVF treatment <small>From age 18 · '+loc(pr(12000))+'</small>',"relationshipFamilyMethod('ivf')",g.age<18||g.age>50||!!r.pregnancy||g.cash<pr(12000))+B('Donor conception <small>From age 18 · '+loc(pr(8500))+'</small>',"relationshipFamilyMethod('donor')",g.age<18||g.age>50||!!r.pregnancy||g.cash<pr(8500))+B('Surrogacy <small>From age 18 · '+loc(pr(65000))+'</small>',"relationshipFamilyMethod('surrogacy')",g.age<18||g.age>50||!!r.pregnancy||g.cash<pr(65000));
 return c;
}
function adoptionView(){return `<div class=card><div class=t>Adoption & assisted reproduction</div><p class=d>You do not need to be able to conceive naturally to build a family. Adoption and assisted options are available below, including IVF, donor conception, and surrogacy. These are simplified game mechanics rather than real-world medical or legal advice.</p></div>`+familyPlanningView()}
const relationshipRawSecV=secV;
OSUB.Health.push(['Family Planning','Birth control, fertility and pregnancy'],['Adoption & Fertility','Adoption and assisted reproduction']);
OMENU[0][1]='Body, doctor, birth control, and family planning';
secV=function(p){if(p&&p[0]==='Health'&&p[1]==='Family Planning')return familyPlanningView();if(p&&p[0]==='Health'&&p[1]==='Adoption & Fertility')return adoptionView();return relationshipRawSecV(p)};
const relationshipRawE=E;
E=function(x){if(x&&x.familyPlan&&x.familyPlan!=='adopt'&&relationshipRepro().pregnancy){toast('You are already expecting a child. No treatment fee was charged.');return;}relationshipRawE(x);if(!x||!g)return;
 if(x.relId&&x.relDelta){const r=(g.rel||[]).find(q=>q.id===x.relId&&q.alive);if(r)r.bond=cl((r.bond||0)+x.relDelta);}
 if(x.relEndId){const r=(g.rel||[]).find(q=>q.id===x.relEndId&&q.alive);if(r){r.alive=false;r.endedAt=g.age;r.endReason='No contact';}}
 if(x.relGroup&&x.relDelta){const match=r=>x.relGroup==='parents'?/^(Mother|Father|Parent)$/.test(r.role||''):x.relGroup==='siblings'?r.role==='Sibling':x.relGroup==='friends'?r.t==='fri'&&r.role==='Friend':x.relGroup==='partner'?(r.role==='Partner'||r.role==='Spouse'):x.relGroup==='children'?r.role==='Child':x.relGroup==='extended'?relationshipIsExtended(r):x.relGroup==='pets'?r.role==='Pet':false;(g.rel||[]).filter(r=>r.alive&&match(r)).forEach(r=>r.bond=cl((r.bond||0)+x.relDelta));}
 if(x.relationshipCommand==='stop-bc-try'){const repro=relationshipRepro();repro.birthControl='None';const p=(g.rel||[]).find(r=>r.id===x.relId&&r.alive&&(r.role==='Partner'||r.role==='Spouse'));if(p){const o=relationshipConceptionAttempt();g.happy=cl(g.happy+(o.p||0));p.bond=cl(p.bond+(o.bond||0));L(o.msg)}}
 if(x.familyPrep&&relationshipRepro().pregnancy){relationshipRepro().pregnancy.prepared=true;if(x.familyPrep==='support'){(g.rel||[]).filter(r=>r.alive&&relationshipIsExtended(r)).slice(0,2).forEach(r=>r.bond=cl((r.bond||0)+2));}}
 if(x.familyPlan)relationshipRunFamilyPlan(x.familyPlan);
};
const relationshipRawYearly=yearly;
yearly=function(){
 const before=new Map((g.rel||[]).map(r=>[r.id,!!r.alive]));const logBefore=g.log?g.log.slice(0,30).join('\n'):'';relationshipRawYearly();
 const recent=(g.log||[]).slice(0,35).join('\n');
 (g.rel||[]).forEach(r=>{if(before.get(r.id)&&!r.alive&&!r.deceased){const text=recent.replace(logBefore,'');if(new RegExp((r.n||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'.*(passed away|died|death)|(passed away|died|death).*'+(r.n||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(text)||((g.mourn||'').split('|')[0]===r.n)){r.deceased=true;r.deathAge=r.age;r.deathAt=g.age;r.deathCause=r.deathCause||(/Pet/.test(r.role)?'illness or old age':'old age or illness');r.memory=`You knew ${r.n} as your ${String(r.role||'relative').toLowerCase()}.`;}}});
 const repro=relationshipRepro();
 if(typeof medicalContraceptionAnnual==='function')medicalContraceptionAnnual();
 else if(repro.birthControl==='Condoms'||repro.birthControl==='Birth control pill'){if(repro.lastBCAge!==g.age){const expense=repro.birthControl==='Condoms'?pr(80):pr(220);g.cash-=expense;LD('Birth control',-expense);repro.lastBCAge=g.age;}}
 (g.rel||[]).forEach(r=>{if(!r.alive||r.deceased||r.role==='Pet')return;if(r.role==='Child'&&r.age<18&&Math.random()<.0004){r.alive=false;r.deceased=true;r.deathAge=r.age;r.deathAt=g.age;r.deathCause='illness';r.memory=`You shared ${r.age} years with ${r.n}.`;relationshipQueueDeath(r);return;}if(r.age>=18&&r.age<76&&Math.random()<.0025){r.alive=false;r.deceased=true;r.deathAge=r.age;r.deathAt=g.age;r.deathCause=ch(50)?'an accident':'an illness';r.memory=`You knew ${r.n} as your ${String(r.role||'relative').toLowerCase()}.`;relationshipQueueDeath(r);}});
 if(repro.pregnancy&&g.age>=repro.pregnancy.dueAge){const q=repro.pregnancy,child=relationshipAddChild(q.method||'Natural birth',0);repro.pregnancy=null;repro.attempts=0;g.happy=cl(g.happy+7);relationshipQueue({x:`The baby has arrived. ${child.n} is now part of your family. ${q.prenatal?'You followed up with prenatal care. ':''}${q.prepared?'You made plans before the arrival. ':''}You will find ${child.n} in Relationships → Children. Choose how to settle into this new chapter.`,c:[['Welcome your child and focus on bonding',{relId:child.id,relDelta:8,p:4},'You hold your new baby close.'],['Ask trusted people for practical support',{relGroup:'parents',relDelta:2,p:3},'Loved ones offer what help they can.'],['Build a steady routine',{relId:child.id,relDelta:5,p:2},'You focus on a calm routine and small daily wins.']]});}
};
function relationshipQueue(ev){if(!g||!ev)return;g.relationshipEventQueue=g.relationshipEventQueue||[];g.relationshipEventQueue.push(ev)}
function relationshipQueueDeath(r){relationshipQueue({x:`You have received painful news: ${r.n}, your ${String(r.role||'relative').toLowerCase()}, has died from ${r.deathCause||'an unexpected cause'}. How will you respond to the loss?`,c:[['Attend a memorial',{relGroup:'parents',relDelta:1,p:-6},'You join others who are grieving.'],['Reach out to family and friends',{relGroup:'friends',relDelta:2,p:-4},'You lean on the people close to you.'],['Take time to grieve privately',{p:-7,s:1},'You give yourself space to process the loss.']]});}
const relationshipRawDraw=draw;
draw=function(rs){relationshipRawDraw(rs);if(!g||scr!=='game'||!g.alive||g.event||g.result||g.ysum||(g.msq&&g.msq.length)||g.msReport||g.msTrainPopup||g.hsPopup||(g.hsQueue&&g.hsQueue.length))return;g.relationshipEventQueue=g.relationshipEventQueue||[];if(g.relationshipEventQueue.length){g.event=g.relationshipEventQueue.shift();relationshipRawDraw(rs)}};
EV.push(
[6,17,'p','A parent offers to help you with a difficult decision.',[['Explain what is worrying you',{relGroup:'parents',relDelta:6,p:3,s:1},'Talking it through makes the problem feel manageable.'],['Ask them to give you space',{relGroup:'parents',relDelta:1,p:1},'They respect your independence.'],['Snap at them',{relGroup:'parents',relDelta:-7,p:-3},'The argument lingers.']]],
[12,60,'p','A parent asks whether you can spend more time together.',[['Make a regular plan',{relGroup:'parents',relDelta:7,p:3},'You find a routine that works.'],['Explain your responsibilities',{relGroup:'parents',relDelta:3,s:1},'They understand, though they still miss you.'],['Dismiss the request',{relGroup:'parents',relDelta:-6,p:-2},'They feel pushed aside.']]],
[18,90,'p','A parent is thinking about downsizing or changing their living situation.',[['Help them plan',{relGroup:'parents',relDelta:6,p:-1,m:-pr(250)},'You make the process less stressful.'],['Offer emotional support',{relGroup:'parents',relDelta:5,p:2},'They feel reassured.'],['Leave it entirely to them',{relGroup:'parents',relDelta:-2},'They handle the decision themselves.']]],
[8,17,'p','A sibling feels that you get more attention at home.',[['Invite them to do something together',{relGroup:'siblings',relDelta:7,p:3},'You remind each other that you are on the same team.'],['Explain why you disagree',{relGroup:'siblings',relDelta:2,s:1},'You talk it out.'],['Make fun of their feelings',{relGroup:'siblings',relDelta:-8,p:-3},'The rivalry gets worse.']]],
[14,45,'f','A close friend confides a secret that could change your friendship.',[['Keep the secret',{relGroup:'friends',relDelta:7,p:1},'Your friend trusts you more.'],['Encourage them to get help',{relGroup:'friends',relDelta:5,s:2},'You help them find a path forward.'],['Share it with someone else',{relGroup:'friends',relDelta:-10,p:-3},'The breach of trust gets around.']]],
[16,70,'f','Your friend group plans a trip, but one friend is being left out.',[['Speak up for them',{relGroup:'friends',relDelta:4,p:3},'The group reconsiders.'],['Plan a separate get-together',{relGroup:'friends',relDelta:6,m:-pr(100),p:2},'The excluded friend feels included.'],['Stay out of it',{relGroup:'friends',relDelta:-2},'The awkwardness remains.']]],
[18,85,'f','A friend is celebrating a major life milestone.',[['Show up and help celebrate',{relGroup:'friends',relDelta:7,p:4,m:-pr(75)},'Your support matters.'],['Send a thoughtful message',{relGroup:'friends',relDelta:4,p:2},'They appreciate being remembered.'],['Forget about it',{relGroup:'friends',relDelta:-5,p:-2},'They feel let down.']]],
[18,70,'m','Your partner wants to talk about how responsibilities are divided.',[['Make a fair plan',{relGroup:'partner',relDelta:7,p:2},'You agree on clearer expectations.'],['Ask what matters most to them',{relGroup:'partner',relDelta:6,s:1},'The conversation feels collaborative.'],['Say it is not your problem',{relGroup:'partner',relDelta:-9,p:-3},'Resentment builds.']]],
[18,75,'m','Your partner has been feeling insecure about the relationship.',[['Offer reassurance and listen',{relGroup:'partner',relDelta:8,p:3},'You both feel closer.'],['Plan something meaningful together',{relGroup:'partner',relDelta:7,m:-pr(100),p:3},'The effort is appreciated.'],['Tell them to get over it',{relGroup:'partner',relDelta:-8,p:-3},'The insecurity deepens.']]],
[21,90,'m','You and your spouse discuss whether to grow your family.',[['Review finances, time, and readiness',{relGroup:'partner',relDelta:6,s:2,p:1},'You build a shared picture of what is possible.'],['Agree to revisit the question next year',{relGroup:'partner',relDelta:4,p:1},'There is no immediate decision, but you stay connected.'],['Refuse to discuss it',{relGroup:'partner',relDelta:-7,p:-2},'The question stays unresolved.']]],
[20,80,'k','Your child asks why another family seems to have more money or freedom.',[['Talk honestly in an age-appropriate way',{relGroup:'children',relDelta:7,s:1,p:2},'Your child feels respected.'],['Focus on what your family has',{relGroup:'children',relDelta:5,p:2},'You find gratitude together.'],['Tell them to stop asking',{relGroup:'children',relDelta:-6,p:-2},'They feel embarrassed for asking.']]],
[20,75,'k','Your child is being left out by classmates.',[['Listen and role-play ways to respond',{relGroup:'children',relDelta:7,s:2,p:2},'They feel less alone and more prepared.'],['Contact the school for help',{relGroup:'children',relDelta:5,m:-pr(100),p:1},'You seek support.'],['Say they need to toughen up',{relGroup:'children',relDelta:-7,p:-3},'They withdraw.']]],
[18,80,'k','Your child wants more independence than you expected.',[['Agree on clear boundaries',{relGroup:'children',relDelta:6,s:1},'You find a compromise.'],['Offer more freedom with check-ins',{relGroup:'children',relDelta:8,p:2},'They appreciate your trust.'],['Forbid the activity without discussion',{relGroup:'children',relDelta:-7,p:-2},'The conflict intensifies.']]],
[25,90,'k','Your adult child calls with a problem they want to solve themselves.',[['Ask what support they want',{relGroup:'children',relDelta:7,p:2},'You respect their independence.'],['Offer advice only when invited',{relGroup:'children',relDelta:5,s:1},'You leave room for them to lead.'],['Take over the decision',{relGroup:'children',relDelta:-5,p:-2},'They feel you do not trust them.']]],
[30,90,'p','An older relative needs more help with appointments and errands.',[['Share the caregiving work',{relGroup:'parents',relDelta:5,p:-2,m:-pr(200)},'The practical support eases the pressure.'],['Coordinate help from several relatives',{relGroup:'extended',relDelta:5,p:1},'The family shares the load.'],['Avoid the conversation',{relGroup:'parents',relDelta:-4,p:-2},'The strain continues.']]],
[20,80,'f','Two friends are arguing and each expects you to take sides.',[['Help them talk calmly',{relGroup:'friends',relDelta:3,p:-1},'It takes effort, but the temperature drops.'],['Set a boundary and stay neutral',{relGroup:'friends',relDelta:2,p:1},'You avoid becoming the messenger.'],['Repeat what each said about the other',{relGroup:'friends',relDelta:-7,p:-3},'The conflict spreads.']]],
[18,90,'f','A friend asks to borrow money after an unexpected expense.',[['Lend a manageable amount',{relGroup:'friends',relDelta:5,m:-pr(200),p:-1},'You agree on what they can repay.'],['Offer help finding resources',{relGroup:'friends',relDelta:4,s:1},'You help without taking on debt.'],['Say no clearly and kindly',{relGroup:'friends',relDelta:1,p:1},'The boundary is understood.']]],
[18,85,'m','You discover a difference in long-term goals with your partner.',[['Explore a compromise',{relGroup:'partner',relDelta:7,p:1},'You find overlap.'],['Accept that you want different things',{relGroup:'partner',relDelta:2,p:-2},'The truth is hard, but important.'],['Pretend it does not matter',{relGroup:'partner',relDelta:-6,p:-2},'The issue returns later.']]],
[12,60,'p','A family tradition is at risk of disappearing.',[['Ask relatives to teach it to you',{relGroup:'parents',relDelta:5,s:2,p:2},'The tradition gets a new generation.'],['Create a new tradition',{relGroup:'parents',relDelta:4,p:3},'Your family makes room for change.'],['Let the tradition fade',{relGroup:'parents',relDelta:-1},'Not every tradition continues.']]],
[18,90,'f','Your closest friend receives an exciting opportunity in another city.',[['Help them plan regular calls and visits',{relGroup:'friends',relDelta:6,p:-1},'You both commit to staying close.'],['Celebrate and let them make their choice',{relGroup:'friends',relDelta:5,p:2},'You are proud of them.'],['Guilt them into staying',{relGroup:'friends',relDelta:-8,p:-3},'They feel held back.']]],
[18,90,'m','Your partner says the relationship has started to feel routine.',[['Start a new shared hobby',{relGroup:'partner',relDelta:7,p:3},'A new ritual gives you something to look forward to.'],['Schedule regular check-ins',{relGroup:'partner',relDelta:6,s:1},'You make time for each other.'],['Ignore the concern',{relGroup:'partner',relDelta:-7,p:-2},'The distance grows.']]],
[20,90,'k','Your child is proud of an achievement but worries you will only care about the result.',[['Praise their effort and persistence',{relGroup:'children',relDelta:7,p:3},'They feel supported regardless of the outcome.'],['Discuss what they learned',{relGroup:'children',relDelta:5,s:2},'The achievement becomes a learning moment.'],['Compare them with another child',{relGroup:'children',relDelta:-9,p:-3},'They feel diminished.']]],
[18,90,'p','A difficult family disagreement threatens to split a gathering.',[['Create room for everyone to be heard',{relGroup:'parents',relDelta:4,p:-1},'The conversation stays respectful.'],['Suggest a break and return later',{relGroup:'parents',relDelta:3,p:1},'People cool off.'],['Publicly shame one relative',{relGroup:'parents',relDelta:-8,p:-3},'The conflict becomes personal.']]],
[21,90,'f','You realize a friendship has become one-sided.',[['Tell them how you feel',{relGroup:'friends',relDelta:3,p:-1},'The honest talk creates a chance to rebalance things.'],['Step back and set limits',{relGroup:'friends',relDelta:1,p:1},'You protect your time.'],['Keep giving while growing resentful',{relGroup:'friends',relDelta:-5,p:-3},'The imbalance continues.']]]
);

