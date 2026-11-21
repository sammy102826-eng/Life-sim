let justicePrisonPage='home';
const justiceSection=(title,html)=>`<section class="law-section"><h3>${uiEscape(title)}</h3>${html}</section>`;
const justiceSelect=(id,label,options)=>`<label for="${id}">${uiEscape(label)}</label><select id="${id}">${options.map(x=>`<option>${uiEscape(x)}</option>`).join('')}</select>`;
const justiceDuration=(record,served=false)=>{
 if(record.months&&!record.extensions){
   const n=served?(record.served?record.months:0):record.months;
   return n+' month'+(n===1?'':'s');
 }
 const n=served?record.served:record.sentence;
 return n+' year'+(n===1?'':'s');
};
const justiceChargeList=keys=>keys.map(k=>justiceOffense(k)[0]).join(', ');
function justiceOpenOther(section){
 tab='Other';NV.O=[section];draw(1);
}
function justiceDocket(){
 const s=justiceState(),c=justiceCurrent(s);
 if(!c)return '<p>No criminal hearing is scheduled.</p>';
 return `<p>${uiEscape(justiceChargeList(c.charges))} · ${c.venue}</p><p>Age ${c.due} · Month ${c.month} · ${c.lawyer?uiEscape(c.lawyer.name):'Counsel pending'}</p>`+
  B('Attend hearing','justiceAttend()',c.status!=='scheduled'||g.age<c.due);
}
function justiceAttend(){
 const s=justiceState(),c=justiceCurrent(s);
 if(c?.status==='scheduled'&&g.age>=c.due&&!s.pending&&!justiceQuiet())justiceDecision('hearing',{id:c.id});
}
function justiceCrimeView(){
 const s=justiceState();
 const available=Object.entries(JUSTICE_VISIBLE).map(([category,keys])=>`<details class="law-section justice-category"><summary>${uiEscape(category)}</summary>
 ${keys.map(k=>{const d=justiceOffense(k);return B(d[0]+` <small>Age ${d[2]}+</small>`,`justiceStart('${k}')`,
   g.age<d[2]||s.ageTaken===g.age||!!justiceCurrent(s)||k==='embezzle'&&!g.job||category==='Organized crime'&&!g.gang);}).join('')}
 ${category==='Organized crime'?(g.gang?`<p>${uiEscape(g.gang.n)}</p>`+B('Leave outside gang','leaveG()'):B('Join an outside gang','joinG()',g.age<14)):''}</details>`).join('');
 const f=s.fugitive;
 return '<div class="justice-shell law-shell"><h2>Crime</h2>'+Bar('Heat',g.heat||0,'#d18b67')+
    `<p>${g.rec||0} active conviction(s). Scene selections are cosmetic. The simulation determines the outcome.</p>`+
    (s.ageTaken===g.age?'<p>You already made this year’s crime attempt.</p>':'')+
    (justiceAtLarge()?justiceSection('Active warrant',B('Review fugitive options','justiceFugitiveOpen()')):'')+
    (f?.status==='abroad'?'<p>Your original sentence remains recorded abroad.</p>':'')+
    (justiceCurrent(s)?justiceSection('Scheduled court case',justiceDocket()):'')+available+'</div>';
}
function justiceFugitiveOpen(){
 if(justiceAtLarge()&&!justiceState().pending&&!justiceQuiet())justiceDecision('fugitive');
}
function justiceCustodySlot(){
 const p=justicePrison();if(!p)return '';
 return '<div class="justice-shell law-shell">'+justiceSection('Current work',`<p><strong>${uiEscape(p.facility)}</strong></p>`+
  Bar('Respect',p.respect,'#528a78')+Bar('Behavior',p.behavior,'#528a78')+B('Open prison menu','prisonOpen()'))+'</div>';
}
function prisonOpen(page='home'){
 if(!justiceCustody())return;
 justicePrisonPage=page;tab='Work';wsel='justice-prison';wsub=null;draw(1);
}
function prisonButton(label,key){return B(label,`prisonOpen('${key}')`);}
function prisonShowPrompt(kind){
 if(!justiceCustody()||justiceState().pending||g.event||g.result)return;
 const p=justicePrison(),r=justiceTerm();
 if(kind==='appeal'&&!r.appealUsed||kind==='escape'&&!prisonLocked(p,'escape')||
    kind==='paroleReview'&&!prisonLocked(p,'parole')&&prisonParoleEligible(p,r))justiceDecision(kind);
}
function prisonView(){
 const p=justicePrison(),r=justiceTerm();
 if(!p||!r)return justiceCustodySlot();
 const group=justicePrisonPage;
 const back=group==='home'?B('Back to Work',"wsel=null;draw(1)"):prisonButton('Back to prison menu','home');
 let body='';
 if(group==='home'){
   body=[['Inmates','inmate'],['Guards','guard'],['Warden','warden'],['Prison jobs','jobs'],['Prison store','store'],['Gangs','gang'],['Programs','programs']]
     .map(([label,key])=>prisonButton(label,key)).join('')+
     B('Appeal conviction',"prisonShowPrompt('appeal')",r.appealUsed)+
     B('Request parole review',"prisonShowPrompt('paroleReview')",!prisonParoleEligible(p,r)||prisonLocked(p,'parole'))+
     B('Attempt escape',"prisonShowPrompt('escape')",prisonLocked(p,'escape'))+
     B('Save or load a life',"openSlots('game')")+
     (Object.keys(g.led||{}).length?`<details class="law-section"><summary>Personal finances this year</summary>
      ${Object.entries(g.led).map(([key,value])=>`<div class="row"><span>${uiEscape(key)}</span><b>${loc(value)}</b></div>`).join('')}</details>`:'');
 }else if(['inmate','guard','warden'].includes(group)){
   const verbs={
    inmate:[['Talk','talk'],['Share reading recommendations','read'],['Offer mediation','mediate']],
    guard:[['Ask about the schedule','ask'],['Help with unit routines','help'],['File a grievance','grievance']],
    warden:[['Discuss reentry','plan'],['Ask about skills programs','course'],['Become an informant','snitch']]
   };
   body=p.people.filter(x=>x.type===group).map(x=>`<details class="law-section"><summary>${uiEscape(x.name)} · Age ${x.age}</summary>
   ${Bar('Relationship',x.bond,'#528a78')}<p>${x.style}</p>${verbs[group].map(([label,key])=>B(label,`prisonSocial(${x.id},'${key}')`,
       prisonLocked(p,'person-'+x.id,2)||key==='snitch'&&p.informant)).join('')}</details>`).join('');
 }else if(group==='jobs'){
   body=justiceSection('Work assignments',`<p>Current assignment ${p.job?PRISON_JOBS[p.job][0]:'None'}. Wages go to your prison balance at Age Up.</p>`+
    Object.entries(PRISON_JOBS).map(([key,d])=>B(d[0]+` <small>${loc(pr(d[1]))}/year · Behavior ${d[2]}+${d[3]?' · Age '+d[3]+'+':''}</small>`,
        `prisonJob('${key}')`,p.job===key||prisonLocked(p,'job')||p.behavior<d[2]||g.age<d[3])).join(''));
 }else if(group==='store'){
   const shop=flag=>Object.entries(PRISON_STORE).filter(([,d])=>d[4]===flag).map(([key,d])=>B(d[0]+` <small>${loc(pr(d[1]))} · Owned ${p.items[key]||0}</small>`,
      `prisonPurchase('${key}')`,p.funds<pr(d[1])||prisonLocked(p,'store',4))).join('');
   body=justiceSection('Commissary',`<p>Prison balance ${loc(p.funds)}. This balance only pays for prison store items.</p>`+shop(false))+
     `<details class="law-section"><summary>Prohibited items</summary><p>A purchase can trigger confiscation, extra time and loss of parole.</p>${shop(true)}</details>`;
 }else if(group==='gang'){
   const score=Math.round(p.respect*.55+g.fit*.26+g.smarts*.19);
   body=p.gang==null?justiceSection('Available groups',`<p>Recruitment standing ${score}. It reflects respect, fitness and smarts. Joining removes parole eligibility.</p>`+
      PRISON_GANGS.map(([name,min],i)=>B(name+` <small>Standing ${min}+</small>`,`prisonGang(${i})`,prisonLocked(p,'gangVisit')||score<min)).join('')):
      justiceSection(PRISON_GANGS[p.gang][0],[['Mediate a disagreement','mediate'],['Check in with the group','circle'],['Leave the group','leave']]
        .map(([label,key])=>B(label,`prisonGang(${p.gang},'${key}')`,prisonLocked(p,'gangAction'))).join(''));
 }else{
   body=justiceSection('Prison programs',[['Library study','study',false],['Exercise in the yard','exercise',false],['Study for high school equivalency','ged',g.age<16||g.edu>=1]]
     .map(([label,key,disabled])=>B(label,`prisonActivities('${key}')`,disabled||prisonLocked(p,key))).join(''));
 }
 return `<div class="justice-shell law-shell">${back}<header class="law-header"><div><h2>${uiEscape(p.facility)}</h2>
 <p>${justiceDuration(r,true)} served out of ${justiceDuration(r)} · Prison balance ${loc(p.funds)}</p></div></header>
 ${Bar('Respect',p.respect,'#528a78')}${Bar('Behavior',p.behavior,'#528a78')}
 <p>${r.paroleEligible?'Parole review requires full behavior and at least half the sentence served.':'Parole is unavailable for this sentence.'}</p><hr>${body}</div>`;
}
function justiceRecordView(){
 const s=justiceState();
 return '<div class="justice-shell law-shell"><h2>Prison record</h2>'+
 `<p>${g.rec||0} active conviction(s), including any convictions from earlier versions.</p>`+
 (s.parole?justiceSection('Supervision',`<p>${s.parole.probation?'Probation':'Parole'} through age ${s.parole.until}.</p>`):'')+
 (s.convictions.slice().reverse().map(r=>justiceSection(justiceChargeList(r.charges),`<p>Age ${r.age} · ${uiEscape(r.country)} · ${uiEscape(r.status)}.</p>
 <p>${r.sentence?justiceDuration(r,true)+' served out of '+justiceDuration(r):'No custody sentence'}${r.facility?' · '+uiEscape(r.facility):''}.</p>`)).join('')||'<p>No detailed convictions have been recorded.</p>')+
 justiceSection('Court docket',justiceDocket())+
 (s.cases.some(c=>!['booking','scheduled'].includes(c.status))?justiceSection('Past criminal hearings',s.cases.filter(c=>c.result).slice().reverse().map(c=>
   `<p>Age ${c.filed} · ${uiEscape(justiceChargeList(c.charges))} · ${uiEscape(c.result)}.</p>`).join('')):'')+'</div>';
}
function civilView(){
 const s=justiceState();
 const incidents=s.victims.filter(x=>x.status==='new').slice().reverse();
 const cases=s.civil.slice().reverse();
 return '<div class="justice-shell law-shell"><h2>Lawsuits</h2><p>File an eligible claim, then return as each stage opens. This is a simplified civil process for the game.</p>'+
 justiceSection('Possible claims',incidents.map(v=>`<article class="law-item"><div><h4>${CIVIL_TYPES[v.key][0]}</h4>
 <p>${uiEscape(v.defendant)} · Age ${v.age} · Evidence ${v.evidence}/100</p><p>${uiEscape(v.description)}</p></div>
 ${!v.response?B('Review incident',`civilReviewVictim(${v.id})`):''}${B('File lawsuit · '+loc(pr(450)),`civilFile(${v.id})`,g.age>v.age+3||g.cash<pr(450))}</article>`).join('')||
 '<p>No actionable disputes have been recorded.</p>')+
 justiceSection('Cases',cases.map(c=>{
   const v=justiceFind(s.victims,c.victim);
   const ready=c.status==='open'&&g.age>=c.due||c.status==='appealReady'||c.status==='appealWindow'&&g.age<=c.due;
   const label=c.status==='open'?CIVIL_STAGES[c.stage][0]:({offer:'Settlement offer',appealWindow:'Appeal available',appealFiled:'Appeal filed',appealReady:'Appeal ready',closed:'Closed'}[c.status]||c.status);
   return `<details class="law-section" open><summary>${CIVIL_TYPES[v.key][0]} · ${uiEscape(v.defendant)}</summary>
   <p>${label} · ${['open','appealFiled','appealWindow'].includes(c.status)?'Age '+c.due+' · ':''}Claim ${loc(c.value)} · Costs ${loc(c.expenses)} · Recovered ${loc(c.paid)}</p>
   ${Bar('Evidence',c.evidence,'#528a78')}${Bar('Leverage',c.leverage,'#528a78')}
   ${ready?B('Review next step',`civilOpenStage(${c.id})`):''}
   ${c.status==='offer'?`<p>Offer ${loc(c.offer)}.</p>`+B('Accept offer',`civilSettle(${c.id},true)`)+B('Decline offer',`civilSettle(${c.id},false)`):''}
   ${c.history.slice(0,5).map(x=>`<p>${uiEscape(x)}</p>`).join('')}</details>`;
 }).join('')||'<p>No filed lawsuits.</p>')+'</div>';
}
function justiceCancel(){
 const s=justiceState();
 if(['plan','escape','appeal','civilStage','fugitive'].includes(s.pending?.kind)){s.pending=null;draw();}
}
function justiceModal(s,p){
 if(!p)return '';
 const cancel=B('Cancel','justiceCancel()');
 if(p.kind==='outcome')return lawModal(p.title,`<p>${uiEscape(p.text)}</p>`,B('Continue','justiceContinue()'));
 if(p.kind==='plan')return lawModal(justiceOffense(p.key)[0],'<p>Choose the look of the fictional scene. These selections have no effect on the outcome.</p>'+
   Object.entries(JUSTICE_PLANS).map(([key,row])=>justiceSelect('justice-'+key,row[0],p.options[key])).join(''),B('Play out the scene','justiceAttempt()')+cancel);
 if(p.kind==='stop')return lawModal('Police encounter',`<p>Suspected incident · ${uiEscape(justiceChargeList(p.charges))}.</p><p>${uiEscape(p.source)}.</p>${p.message?`<p>${uiEscape(p.message)}</p>`:''}`,
   [['Persuade','persuade'],['Offer a bribe','bribe'],['Cooperate','cooperate'],['Run','run'],['Fight','fight']]
   .map(([label,key])=>B(label,`justiceStop('${key}')`,key==='persuade'&&p.asked||key==='bribe'&&g.cash<1)).join(''));
 if(p.kind==='bribe'){
   const max=Math.max(0,Math.min(Math.floor(g.cash),pr(25000)));
   return lawModal('Offer a bribe?',`<p>The money is lost either way. A failed attempt can add a bribery charge.</p><label for="justice-bribe">Amount</label>
     <input id="justice-bribe" type="range" min="1" max="${max}" value="1" oninput="document.getElementById('justice-bribe-value').textContent=this.value">
     <output id="justice-bribe-value" for="justice-bribe">1</output>`,B('Confirm offer','justiceBribe()',max<1)+B('Back to encounter','justiceBracketBack()'));
 }
 if(p.kind==='fight')return lawModal('Fight during the encounter?', '<p>This choice can add resisting arrest and assault charges. Serious injury or death is possible.</p>',
   B('Confirm fight','justiceFight()')+B('Back to encounter','justiceBracketBack()'));
 if(p.kind==='reschedule')return lawModal('Proposed court postponement',
   '<p>A scheduling request reached the court. You can agree to move the hearing or ask the court to keep the existing date.</p>',
   B('Agree to postpone',"justiceCourtSchedule('agree')")+B('Ask to keep the existing date',"justiceCourtSchedule('object')"));
 if(p.kind==='booked'||p.kind==='hearing'){
   const c=justiceFind(s.cases,p.id);
   if(!c)return '';
   const info=`<p>Charges · ${uiEscape(justiceChargeList(c.charges))}</p><p>${c.venue} · Age ${c.due}, month ${c.month}.</p>
   <p>${uiEscape(c.source)}.</p>${Bar('Prosecution evidence',c.evidence,'#d18b67')}`;
   return p.kind==='booked'?lawModal('Arrest and charges',info,JUSTICE_DEFENSES.map(([l,cost],i)=>B(l+' · '+(cost?loc(pr(cost)):'Free'),`justiceHire(${i})`,cost>0&&g.cash<pr(cost))).join('')):
     lawModal(c.venue,info+`<p>Counsel · ${uiEscape(c.lawyer.name)}.</p>`,['Challenge the evidence','Test testimony','Present your defense'].map((l,i)=>B(l,`justiceVerdict(${i})`)).join(''));
 }
 if(p.kind==='appeal')return lawModal('Appeal conviction','<p>A successful appeal overturns this conviction. You can file one appeal during this sentence.</p>',
   JUSTICE_APPEALS.map(([label,cost],i)=>B(label+' · '+loc(pr(cost)),`prisonAppeal(${i})`,g.cash<pr(cost))).join('')+cancel);
 if(p.kind==='escape')return lawModal('Attempt escape?', '<p>An unsuccessful attempt extends the sentence and removes parole eligibility. A successful attempt leaves an active warrant.</p>',
   B('Confirm attempt','prisonTryEscape()')+cancel);
 if(p.kind==='paroleReview')return lawModal('Parole board review','<p>You qualify for a review. The board can release you under supervision or keep the existing sentence.</p>',
   B('Attend review',"prisonParole('accept')")+B('Defer review',"prisonParole('defer')"));
 if(p.kind==='prisonEvent'){
   const row=PRISON_EVENTS.find(x=>x[0]===p.event);
   const who=g.rel.find(x=>x.id===p.person);
   return lawModal('Prison event',`<p>${uiEscape(row[1])}</p>${who?`<p>${uiEscape(who.n)}</p>`:''}`,row[2].map((l,i)=>B(l,`prisonEventChoice(${i})`)).join(''));
 }
 if(p.kind==='fugitive')return lawModal('You are a fugitive','<p>Choose what happens next in the simulation. All three options can lead to recapture.</p>',
   B('Return home',"justiceFugitiveMove('home')")+B('Move to a different city',"justiceFugitiveMove('city')")+B('Cross a regional border',"justiceFugitiveMove('border')"));
 if(p.kind==='victim'){
   const v=justiceFind(s.victims,p.id);
   return lawModal(CIVIL_TYPES[v.key][0],`<p>${uiEscape(v.description)}</p>`,
   B('Gather available documents',"civilVictimChoice('documents')")+B('Contact an independent witness',"civilVictimChoice('contact')")+B('Review it later',"civilVictimChoice('later')"));
 }
 if(p.kind==='civilStage'){
   const c=justiceFind(s.civil,p.id),v=justiceFind(s.victims,c.victim);
   if(p.stage==='review')return lawModal('Civil appeal review',`<p>The court will review your case against ${uiEscape(v.defendant)}.</p>`,B('Receive appeal ruling','civilSelect(0)')+cancel);
   const row=CIVIL_STAGES[p.stage];
   return lawModal(row[0],`<p>${uiEscape(v.defendant)} · Claim ${loc(c.value)} · Expenses ${loc(c.expenses)}.</p>`,
   row[1].map((l,i)=>B(l+(row[2][i]?' · '+loc(pr(row[2][i])):''),`civilSelect(${i})`,g.cash<pr(row[2][i]))).join('')+cancel);
 }
 return '';
}
