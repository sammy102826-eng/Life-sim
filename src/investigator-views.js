let piPage='overview',piCaseId=null;
const piCall=(name,...args)=>name+'('+args.map(a=>uiEscape(JSON.stringify(a))).join(',')+')';
const piB=(label,action,key='',value=0,disabled=false)=>B(label,piCall('piClick',action,key,value),disabled);
const piLink=(label,page,id=null)=>B(label,piCall('piOpen',page,id));
const piInput=(id,label,type='text',value='')=>'<label for="pi-'+id+'">'+label+'</label><input class="txt" id="pi-'+id+
 '" type="'+type+'" value="'+uiEscape(value)+'" '+(type==='text'?'maxlength="52"':'min="1" step="1"')+'>';
function piOpen(page='overview',id=null){
 if(!g.alive||g.jail)return;
 tab='Work';wsel='investigator';wsub=null;piPage=page;piCaseId=id;draw(1);
}
function piClick(action,key,value){
 if(!g.alive||g.jail||publicityBusy()||g.justice?.pending)return;
 const s=piState();
 let error;
 if(action==='found')error=piFound(document.getElementById('pi-name')?.value);
 else if(action==='resume')error=piResume(s);
 else if(action==='accept')error=piAccept(key);
 else if(action==='case')error=piCaseAction(key,value);
 else if(action==='respond'){
  const result=piRespond(s.events.find(e=>e.id===key),value);
  error=result.done?'':result.text;
 }else if(action==='leave'){
  if(!piActive())return;
  wsel=null;wsub=null;quit(-1);
  return;
 }else{
  if(action==='rename')key=document.getElementById('pi-name')?.value;
  if(action==='fund'||action==='withdraw')value=Number(document.getElementById('pi-amount')?.value);
  error=piManage(action,key,value);
 }
 if(error)return toast(error);
 if(action==='found'||action==='resume')return piOpen();
 if(action==='accept')return piOpen('file',key);
 draw(1);
}
function piPoliceView(){
 const s=piState(),role=piPoliceRole(g.job),training=s.policeUsed;
 return studioSection('Patrol and detective service',
  '<p>Patrol '+s.patrol+' / '+PI_PATROL_YEARS+' years · Detective '+s.detective+' / '+PI_DETECTIVE_YEARS+' years · Casework courses '+s.training+' / 2</p>'+
  (role==='patrol'?'<p>Promotion to detective also requires performance of 55 and a clean record.</p>':'<p>Keep working as a detective to earn experience toward private practice.</p>')+
  B('Take a casework course',"piPoliceAction('course')",training.course===g.age)+
  B(role==='patrol'?'Complete patrol duty':'Review department cases',"piPoliceAction('duty')",training.duty===g.age)+
  (role==='patrol'?B('Apply for detective promotion',"piPoliceAction('promote')",s.patrol<PI_PATROL_YEARS||s.training<2||g.perf<55||!!g.rec):'')+
  (piQualified(s)?piLink('Private Investigator licensing','overview'):''));
}
function piStartView(s){
 const a=s.agency;
 return B('Back to Special careers',"wsel=null;wsub='Special';draw(1)")+
  studioSection(a?.name||'Private Investigator','<p>Requires three years of patrol and three years in the detective division, a clean record, and a clear work schedule. You can leave an eligible police post to open your agency.</p>'+
   studioStats([['Patrol service',s.patrol+' / '+PI_PATROL_YEARS],['Detective service',s.detective+' / '+PI_DETECTIVE_YEARS]])+
   (a?'<p>The agency operates in '+uiEscape(a.country)+'.</p>'+piB('Resume agency','resume','',0,!piCanOpen(s)||a.country!==g.country):
    '<p>Startup costs '+loc(pr(PI_START_COST))+' and includes an operating reserve.</p>'+
    piInput('name','Agency name')+piB('Open agency','found','',0,!piCanOpen(s))));
}
function piFileView(s){
 const item=s.cases.find(c=>c.id===piCaseId);
 if(!item)return studioSection('Case file','<p>This file is unavailable.</p>');
 const [title,,,,brief]=PI_CASES[item.key],active=item.status==='active',coverage=new Set(item.evidence.map(e=>e.source)).size;
 return studioSection(title,'<p>'+brief+'</p><p>Client '+uiEscape(item.client)+' · '+uiEscape(item.status)+' · '+Math.max(0,item.due-piClock(s))+
  ' months remaining</p>'+Bar('Evidence',item.confidence,GOLD)+Bar('Client trust',item.trust,'#4FB39A')+
  studioStats([['Fee collected',loc(item.fees)],['Evidence sources',coverage],['Case expenses',loc(item.cost)]])+
  (active?Object.entries(PI_METHODS).map(([k,[name,base]])=>piB(name+' · '+loc(piCost(s.agency,base)),
   'case',item.id,k,item.used[k]>=2||s.month>=11||k==='review'&&item.evidence.length<2)).join('')+
   piB('Submit findings','case',item.id,'findings',item.confidence<48||coverage<2)+
   piB('Close with an inconclusive report','case',item.id,'inconclusive')+
   piB('Hand the file to counsel','case',item.id,'handoff'):'')+
  '<h4>Evidence log</h4>'+(item.evidence.map(e=>'<p>'+PI_METHODS[e.source][0]+' · +' +e.gain+' evidence</p>').join('')||
   '<p>The evidence log is empty.</p>'));
}
function piInboxView(s){
 piRefreshOffers(s);
 const a=s.agency,locked=piOpenFiles(s).length>=piCapacity(a)||piClock(s)<s.closedUntil;
 return studioSection('Accept a case','<p>'+piOpenFiles(s).length+' / '+piCapacity(a)+' active files. Clients pay a 25% retainer. New referrals arrive each year.</p>'+
  (s.offers.map(t=>{
   const [title,,,,brief]=PI_CASES[t.key];
   return '<details class="card"><summary>'+title+(t.inbound?' · Client requested your agency':' · Referral')+'</summary>'+
    '<p>'+brief+'</p><p>'+uiEscape(t.client)+' · '+loc(t.fee)+' quoted fee · '+t.months+' month deadline</p>'+
    piB('Accept '+title.toLowerCase(),'accept',t.id,0,locked)+'</details>';
  }).join('')||'<p>You reviewed all this year’s referrals.</p>'));
}
function piCasesView(s){
 return studioSection('Active cases',piOpenFiles(s).map(c=>piLink(PI_CASES[c.key][0]+' · '+Math.max(0,c.due-piClock(s))+' months left','file',c.id)).join('')||
  '<p>No open files.</p>')+studioSection('Closed cases',s.cases.filter(c=>c.status!=='active').slice(0,20).map(c=>
   piLink(PI_CASES[c.key][0]+' · '+c.status,'file',c.id)).join('')||'<p>No closed files.</p>');
}
function piStaffView(s){
 return studioSection('Staff and resources',Object.entries(PI_STAFF).map(([key,[name,salary,hire,method]])=>
  '<div class="card"><h4>'+name+'</h4><p>'+s.agency.staff[key]+' / 3 · '+loc(piCost(s.agency,salary))+
  '/year each · Improves '+PI_METHODS[method][0].toLowerCase()+'</p>'+
  piB('Hire '+name.toLowerCase()+' · '+loc(piCost(s.agency,hire)),'staff',key,1,s.agency.staff[key]>=3)+
  piB('Release '+name.toLowerCase(),'staff',key,-1,s.agency.staff[key]===0)+'</div>').join('')+
  piB('Improve the archive · '+loc(piCost(s.agency,2700)),'archive','',0,s.agency.secure>=6));
}
function piDecisionView(s){
 const open=s.events.filter(piEventReady);
 return studioSection('Agency decisions',open.map(e=>{
  const [title,text,,options]=PI_EVENTS[e.key];
  return '<details class="card"><summary>'+title+'</summary><p>'+text+'</p>'+
   (options.map(([label,cost],i)=>piB(label+(cost?' · '+loc(piCost(s.agency,cost)):''),'respond',e.id,i)).join(''))+'</details>';
 }).join('')||'<p>No unresolved decisions.</p>')+studioSection('Public case coverage',
  [...(g.news?.editions||[]).flatMap(e=>e.articles),...(g.news?.queued||[]).map(x=>x.article)]
   .filter(a=>a.kind==='investigations'||a.brief?.type==='piEvent').slice(0,15)
   .map(a=>'<h4>'+uiEscape(a.title)+'</h4><p>'+uiEscape(a.text)+'</p>').join('')||'<p>No public coverage yet.</p>');
}
function piAgencyView(){
 const s=piState(),a=s.agency;
 if(!piActive())return piStartView(s);
 let body;
 if(piPage==='rename')body=studioSection('Rebrand','<p>Agency cost '+loc(piCost(a,1900))+'.</p>'+
  piInput('name','New agency name','text',a.name)+piB('Confirm new name','rename'));
 else if(piPage==='intake')body=piInboxView(s);
 else if(piPage==='cases')body=piCasesView(s);
 else if(piPage==='file')body=piFileView(s);
 else if(piPage==='staff')body=piStaffView(s);
 else if(piPage==='decisions')body=piDecisionView(s);
 else if(piPage==='finances')body=studioSection('Finances',studioStats([['Current balance',loc(a.cash)],
   ['Last year’s revenue',loc(a.report?.revenue||0)],['Expenses',loc(a.report?.expenses||0)],['Business tax',loc(a.report?.tax||0)],
   ['Current withholding',finDistributionTax(100)+'%']])+
  piInput('amount','Transfer amount','number')+piB('Invest personal cash','fund')+piB('Withdraw owner distribution','withdraw')+
  '<h4>Ledger</h4>'+Object.entries(a.ledger).map(([key,value])=>'<p>'+uiEscape(key)+' · '+loc(value)+'</p>').join(''));
 else body=studioSection('Agency operations',piLink('Rebrand','rename')+piLink('Accept a case','intake')+
   piLink('Cases','cases')+piLink('Staff','staff')+piLink('Finances','finances')+piLink('Agency decisions','decisions')+
   piB('Advance one agency month','month','',0,s.month>=11)+piB('Step away from the agency','leave'))+
   studioSection('Recent work',s.notes.slice(0,5).map(n=>'<p>'+uiEscape(n.text)+'</p>').join(''));
 const back=piPage==='file'?piLink('Back to Cases','cases'):piPage==='overview'?B('Back to Work',"mainTabOpen('Work')"):piLink('Back to agency','overview');
 return '<div class="law-shell">'+back+studioSection(a.name,'<p>'+uiEscape(a.country)+' · '+eraYear()+
  ' · Agency month '+(s.month+1)+' / 12</p>'+Bar('Reputation',a.rep,GOLD))+body+'</div>';
}
