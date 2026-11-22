const LAW_TABS = {dashboard:'Dashboard',cases:'Cases',courtroom:'Courtroom',clients:'Clients',employees:'Employees',
  finances:'Finances',offices:'Offices',competitors:'Competitors',news:'Legal News',partnership:'Partnership',
  calendar:'Calendar',career:'Career'};
const LAW_CASE_STATUS = {lead:'Available',active:'Active',waiting:'Hearing scheduled',trial:'In hearing',appealable:'Appeal window',appeal:'On appeal',closed:'Completed'};
let lawTab='dashboard',lawSelected=null;
const lawDate = month => month==null?'—':`Year ${Math.floor(month/12)+1}, month ${month%12+1}`;
const lawMetric=(label,value)=>`<div class="law-metric"><span>${label}</span><strong>${value}</strong></div>`;
const lawMoney=n=>loc(Math.round(n||0));
const lawSigned=n=>`${n>0?'+':''}${n}`;
const lawSection=(heading,body)=>`<section class="law-section"><h3>${heading}</h3>${body}</section>`;
const lawEmpty=text=>`<p class="d">${text}</p>`;
const lawButton=(label,action,id=0,arg='',disabled=false)=>B(label,`lawManage('${action}',${id},'${arg}')`,disabled);
const lawOptions=(id,label,items)=>`<label for="${id}">${label}</label><select id="${id}">${items.map(([value,text])=>`<option value="${uiEscape(String(value))}">${uiEscape(text)}</option>`).join('')}</select>`;
const lawHelp = f => `<p class="d">Use firm calendar months for deadlines and working hours. Age Up closes the remaining months of the current year. A case prepared for trial is heard the following year.</p>`;
function lawModal(title,content,buttons){
  return `<div class="mo law-modal"><div class="ev"><h2>${uiEscape(title)}</h2>${content}<div class="law-actions">${buttons}</div></div></div>`;
}
function lawRead(id){return document.getElementById(id)?.value;}
function lawOpen(page='dashboard',id=null){
  if(!Object.hasOwn(LAW_TABS,page))return;
  lawTab=page;lawSelected=id;tab='Work';wsel='job';wsub=null;draw(1);
}
function lawReceipt(f,title,detail,c=null){
  f.receipt=typeof detail==='object'?{...detail,caseId:c?.id}:{title,response:detail,caseId:c?.id};
  draw();
}
function lawClearReceipt(){
  if(g.lawFirm)g.lawFirm.receipt=null;
  draw();
}
function lawManage(action,id,arg){
  if(!lawFirmActive()||lawFirmBusy()||g.lawFirm.receipt||g.lawFirm.closePrompt)return;
  const f=g.lawFirm;
  const c=f.cases.find(x=>x.id===id),e=f.staff.find(x=>x.id===id),r=f.rivals.find(x=>x.id===id);
  let result='',title='';
  switch(action){
    case 'accept':
      result=c&&lawAccept(f,c,arg==='check');title='Engagement review';break;
    case 'decline':
      if(c?.status!=='lead')return;
      c.status='closed';c.result='Engagement declined';c.deadline=null;
      result='The prospective client was referred to other counsel.';title='Referral recorded';break;
    case 'appeal':
      result=c&&lawAppeal(f,c,arg==='file');title='Appeal decision';break;
    case 'trialDeal': {
      if(c?.status!=='trial'||c.negotiatedAt===f.clock||!['civil','family','criminal','classaction','arbitration'].includes(LAW_PRACTICES[c.key].kind))return;
      const issue=lawSpend(f,c,10,Math.round(260*f.scale));
      if(issue)return lawReceipt(f,'Scheduling or funds',issue,c);
      c.negotiatedAt=f.clock;
      result=lawNegotiate(f,c,0,true);lawLogCase(c,result);title='Hearing negotiations';break;
    }
    case 'hire':
      result=lawHireEmployee(f,f.candidates.find(x=>x.id===id));title='Recruitment';break;
    case 'employee':
      result=lawEmployeeAction(f,e,arg);title='Employee management';break;
    case 'assign':
      result=lawAssign(f,c,f.staff.find(x=>x.id===Number(lawRead('law-assignee'))),arg==='remove'?'remove':lawRead('law-task'));title='Case assignments';break;
    case 'department':{
      const head=f.staff.find(x=>x.id===Number(lawRead('law-head')));
      result=head&&lawOpenDepartment(f,head.specialty,head.id);title='Practice departments';break;
    }
    case 'office':{
      const place=f.places[Number(lawRead('law-city'))];
      const type=Number(lawRead('law-office-type'));
      const owned=lawRead('law-tenure')==='buy';
      if(place&&!f.domestic.includes(place)&&(f.reputation<65||f.offices.filter(o=>f.domestic.includes(o.place)).length<2))return lawReceipt(f,'Expansion requirements','International offices require two domestic offices and reputation 65.');
      result=lawAddOffice(f,type,owned,place)||'The firm could not open that office. Review available funds.';title='Office selection';break;
    }
    case 'officeChange':
      result=['improve','close'].includes(arg)&&lawOfficeAction(f,f.offices.find(x=>x.id===id),arg);title='Office management';break;
    case 'partner':
      result=lawPartnerAction(f,e,arg);title='Partnership';break;
    case 'rival':
      result=lawRivalAction(f,r,arg);title='Market competition';break;
    case 'crisis':
      if(f.crisis?.article)return newsOpenBrief(f.crisis.article);
      result=lawResolveCrisis(f,Number(arg));title='Firm incident';break;
    case 'client':{
      const client=f.clients.find(x=>x.id===id);
      if(!client)return;
      result=lawClientAction(f,client,arg);title='Client relations';break;
    }
    case 'capital':
      result=lawCapitalAction(f,arg);title='Firm finances';break;
    case 'training':{
      if(f.monthTraining===f.clock)return;
      const issue=lawSpend(f,null,10,Math.round(750*f.scale));
      if(issue)return lawReceipt(f,'Training unavailable',issue);
      f.monthTraining=f.clock;
      lawChange(f,'skill',4);
      result='You completed a legal skills workshop.';title='Continuing education';break;
    }
    case 'publicity':
      result=lawPublicity(f,arg);title='Public profile';
      if(f.publicity>=20){
        g.fame=Math.max(g.fame||0,Math.round(f.publicity*.8));
        g.fm=Math.max(g.fm||0,Math.round(f.publicity*.8));
        g.pc=lawClamp(Math.max(g.pc||0,f.influence));
      }
      break;
    default:return;
  }
  if(result)lawReceipt(f,title,result,c);
}
function lawPlayDecision(id,step,choice){
  if(!lawFirmActive()||lawFirmBusy()||g.lawFirm.receipt)return;
  const f=g.lawFirm,c=f.cases.find(x=>x.id===id);
  if(!c||c.step!==step)return;
  const response=lawDecision(f,c,choice,lawPhase(c));
  if(response)lawReceipt(f,response.warning?'Action unavailable':'Case decision',response.warning||response,c);
}
function lawClientAction(f,client,action){
  if(action==='update'||action==='meeting'){
    if(client.lastContact===f.clock)return 'This client already received a meeting or update this month.';
    const issue=lawSpend(f,null,action==='meeting'?7:3,0);
    if(issue)return issue;
    client.lastContact=f.clock;
    client.satisfaction=lawClamp(client.satisfaction+(action==='meeting'?8:4));
    client.trust=lawClamp(client.trust+(action==='meeting'?9:4));
    if(client.request!=='Billing dispute')client.request='';
    for(const c of lawActiveCases(f).filter(c=>c.client===client.id))c.confidence=lawClamp(c.confidence+4);
    if(client.satisfaction>=85&&lawRandom(f,1,100)<=32){
      lawGenerateLead(f,f.specialty);
      return client.name+' referred a new prospective client after your conversation.';
    }
    return client.name+' reviewed the strategy and next steps with you.';
  }
  const invoice=client.invoices[0];
  if(!invoice)return '';
  if(action==='writeoff'){
    client.invoices.shift();client.request='';
    return 'The unpaid balance was written off.';
  }
  if(action==='discount'||action==='collect'){
    if(client.lastBilling===f.clock)return 'The billing team already contacted this client this month.';
    client.lastBilling=f.clock;
    const paid=lawInvoice(f,client,invoice,action==='discount');
    if(paid){client.request='';return 'The client paid '+lawMoney(paid)+'.';}
    client.satisfaction=lawClamp(client.satisfaction-4);
    return 'The client disputed the bill and withheld payment.';
  }
  return '';
}
function lawCapitalAction(f,action){
  const amount=Math.round(Number(lawRead('law-funds')));
  if(![5000,15000,30000,75000,150000].some(n=>Math.round(n*f.scale)===amount))return '';
  if(action==='invest'){
    if(g.cash<amount)return 'Personal cash is too low for this investment.';
    g.cash-=amount;f.capital+=amount;
    lawPost(f,'capital','Owner capital contribution',amount);LD('Law firm capital contribution',-amount);
    return 'Capital transferred from your personal account.';
  }
  if(action==='draw'){
    const runway=f.offices.reduce((n,o)=>n+o.monthly,0)+f.staff.reduce((n,e)=>n+Math.round(e.salary/12)+e.bonus,0);
    if(f.cash<amount+runway)return 'Leave at least one month of firm overhead in cash.';
    const partnerCost=lawPartnerShares(f)/100;
    const gross=Math.round(amount*(1-partnerCost));
    lawPost(f,'capital','Owner and partner distributions',-amount);
    const {net}=finOwnerDistribution(gross,'Law firm owner distributions','Law firm distribution tax');
    f.personalIncome+=net;
    return 'Your account received '+lawMoney(net)+' after simulated withholding and partner distributions.';
  }
  if(action==='loan'){
    const limit=Math.round(f.scale*(65000+f.reputation*2200))+Math.round(lawValuation(f)*.2);
    if(f.debt+amount>limit)return 'The requested loan exceeds the available credit line.';
    f.debt+=amount;f.lender=typeof finIssuer==='function'?finIssuer(g.bank.id??2):'NVB';
    lawPost(f,'capital','Business loan proceeds',amount);
    return 'Business financing approved at 0.8% monthly interest.';
  }
  if(action==='repay'){
    const payment=Math.min(amount,f.debt);
    if(!payment||f.cash<payment)return 'No balance is payable from current cash.';
    f.debt-=payment;lawPost(f,'capital','Extra loan repayment',-payment);
    return 'Principal reduced by '+lawMoney(payment)+'.';
  }
  return '';
}

function lawFirmView(f){
  const active=lawFirmActive();
  if(!active)return B('Back to Work',"wsel=null;draw(1)")+`<div class="card"><h2>${uiEscape(f.name)}</h2><p>${uiEscape(f.status==='active'?'Management is paused':f.status)}</p>
  <p>${f.wins} favorable decisions · ${f.settlements} negotiated resolutions · Reputation ${f.reputation}/100</p>
  ${f.status==='active'?'<p>To return, be eligible to practice in the firm’s home country and leave any other full-time post.</p>':''}${f.status==='active'?B('Resume managing the firm','lawResume()',!!g.job||g.country!==f.country||g.jail||g.rec||g.ret||g.office>=0||royalActive()):''}</div>`;
  const pages={dashboard:lawDashboard,cases:lawCases,courtroom:lawCourtroom,clients:lawClients,employees:lawEmployees,
    finances:lawFinances,offices:lawOffices,competitors:lawCompetitors,news:lawNews,partnership:lawPartnership,calendar:lawCalendar,career:lawCareer};
  return `<div class="law-shell">${B('Back to Work',"wsel=null;wsub=null;draw(1)")}
    <header class="law-header"><div><h2>${uiEscape(f.name)}</h2><p>${LAW_PRACTICES[f.specialty].name} · ${uiEscape(f.home)}</p></div><strong>${f.reputation}<small>Reputation</small></strong></header>
    <nav class="law-nav" aria-label="Law firm sections">${Object.entries(LAW_TABS).map(([id,label])=>`<button type="button" aria-pressed="${lawTab===id}" onclick="lawOpen('${id}')">${label}</button>`).join('')}</nav>
    <div class="law-page"><h2>${LAW_TABS[lawTab]}</h2>${pages[lawTab](f)}</div>
  </div>`;
}
function lawDashboard(f){
  const open=lawActiveCases(f), due=open.filter(c=>c.deadline!=null&&c.deadline<=f.clock+2);
  const crisis=lawCrisisOptions(f);
  return `<div class="law-metrics">${lawMetric('Operating cash',lawMoney(f.cash))}${lawMetric('Open matters',open.length)}${lawMetric('Working hours',`${f.hours} / ${lawCapacity(f)}`)}${lawMetric('Period',lawDate(f.clock))}</div>`
    +lawSection('Needs attention',
      (crisis?`<div class="law-alert"><strong>${uiEscape(crisis[0])}</strong>${(f.crisis.article?B('Read in the newspaper',`newsOpenBrief('${f.crisis.article}')`):B('Review incident',"lawOpen('news')"))}</div>`:'')
      +(due.length?due.map(c=>lawCaseSummary(c,'cases')).join(''):lawEmpty('No case deadlines in the next two months.'))
      +B('Open firm calendar',"lawOpen('calendar')"))
    +lawSection('Recent developments',f.news.slice(0,4).map(n=>`<p><small>${lawDate(n.at)}</small> ${uiEscape(n.text)}</p>`).join(''));
}
function lawCaseSummary(c,page){
  return `<article class="law-item"><div><h4>${uiEscape(c.title)}</h4><p>${LAW_PRACTICES[c.key].name} · ${LAW_CASE_STATUS[c.status]}${c.deadline!=null?' · '+lawDate(c.deadline):''}</p></div>
  ${B('Open matter',`lawOpen('${page}',${c.id})`)}</article>`;
}
function lawCases(f){
  const selected=f.cases.find(c=>c.id===lawSelected);
  if(selected)return lawCaseDetail(f,selected,'cases');
  const leads=f.cases.filter(c=>c.status==='lead');
  const archive=f.cases.filter(c=>c.status==='closed').slice().reverse();
  const row=(cases,empty)=>cases.map(c=>lawCaseSummary(c,'cases')).join('')||lawEmpty(empty);
  return lawSection('Active matters',row(lawActiveCases(f),'No active engagements. Review an available case to get started.'))
    +lawSection('Available for intake',row(leads,'New prospects appear as the calendar advances.'))
    +`<details class="law-section"><summary>Completed and declined matters (${archive.length})</summary>${row(archive,'No cases have closed.')}</details>`;
}
function lawCourtroom(f){
  const c=f.cases.find(x=>x.id===lawSelected);
  if(c)return lawCaseDetail(f,c,'courtroom');
  const scheduled=lawActiveCases(f).filter(c=>['waiting','trial','appealable','appeal'].includes(c.status));
  return lawSection('Hearings, trials and appeals',scheduled.map(c=>lawCaseSummary(c,'courtroom')).join('')||lawEmpty('No hearings are scheduled. Complete preparation on an active case to request a hearing.'));
}
function lawCaseDetail(f,c,page){
  const cl=lawClient(f,c),p=LAW_PRACTICES[c.key],phase=lawPhase(c),stage=LAW_STAGES[phase];
  const forum={jury:'Judge and jury',bench:'Judge in a bench hearing',agency:'Agency reviewing officer',arbitration:'Independent arbitrator'}[p.forum];
  const line=(key,value)=>`<div class="row"><span>${key}</span><b>${value}</b></div>`;
  const basic=`<p>${uiEscape(c.story)}</p>`
    +line('Client',uiEscape(cl.name))+line('Opposing party',uiEscape(c.opponent))+line('Opposing counsel',uiEscape(c.opposingCounsel))
    +line('Tribunal',forum+' · '+uiEscape(c.judge)+' · '+uiEscape(c.tribunal))+line('Procedural status',LAW_CASE_STATUS[c.status])
    +line('Deadline',lawDate(c.deadline))+line('Amount claimed',c.claim?lawMoney(c.claim):'Non-monetary relief')
    +line('Estimated expenses',lawMoney(c.estimate))+line('Expenses to date',lawMoney(c.cost))
    +line('Fee arrangement',c.model==='hourly'?lawMoney(c.fee)+' per hour':c.model==='flat'?lawMoney(c.fee)+' flat fee':'One-third of qualifying recovery');
  const metrics=[['Evidence strength',c.evidence],['Client confidence',c.confidence],['Settlement leverage',c.leverage],['Hearing readiness',c.readiness]].map(([label,n])=>Bar(label,n,'#528a78')).join('');
  const decision=lawCaseActions(f,c,stage);
  const assignments=f.staff.length&&['active','waiting','trial','appealable','appeal'].includes(c.status)?
    lawSection('Case team',`<p>${c.assigned.map(id=>f.staff.find(e=>e.id===id)).filter(Boolean).map(e=>uiEscape(e.name)+(c.tasks?.[e.id]?' · '+uiEscape(c.tasks[e.id]):'')).join(', ')||'Founder only'}</p>`
      +lawOptions('law-assignee','Employee',f.staff.map(e=>[e.id,e.name+' · '+e.role]))
      +lawOptions('law-task','Task',['Research','Evidence review','Client liaison','Hearing counsel'].map(x=>[x,x]))
      +lawButton('Assign task','assign',c.id)+lawButton('Remove assignment','assign',c.id,'remove')):'';
  return B('Back to '+LAW_TABS[page],`lawOpen('${page}')`)
    +lawSection(uiEscape(c.title),basic+metrics)
    +lawSection('Next action',decision)
    +lawSection('Evidence and negotiations',`<p>Key records · ${uiEscape(c.exhibit)}<br>Witness · ${uiEscape(c.witness)}</p>
      <p>Last offer · ${c.offer==null?'None':lawMoney(c.offer)}<br>Last counteroffer · ${c.counter==null?'None':lawMoney(c.counter)}</p>${c.offerNote?`<p>${uiEscape(c.offerNote)}</p>`:''}`)
    +(c.status==='closed'?lawSection('Final accounting',`<p>${uiEscape(c.result)}</p>`+line('Gross recovery',lawMoney(c.verdict?.recovery))+line('Client net recovery',lawMoney(c.recovery))+line('Firm receipts',lawMoney(c.paid))+line('Matter contribution',lawMoney(c.paid-c.cost))):'')
    +assignments+lawSection('Recent developments',c.history.slice(0,8).map(s=>`<p>${uiEscape(s)}</p>`).join(''));
}
function lawCaseActions(f,c,stage){
  if(c.status==='lead')return (c.conflict?lawEmpty('Potential conflict identified. Screen the engagement before taking it on.'):'')+
    lawButton(c.conflict?'Run conflict review':'Accept engagement','accept',c.id,c.conflict?'check':'')+lawButton('Decline and refer','decline',c.id);
  if(c.status==='waiting')return `<p>Hearing scheduled for ${lawDate(c.hearing)}. Review assignments before the date.</p>`;
  if(c.status==='appealable')return `<p>${uiEscape(c.verdict.outcome)}. Discuss whether the client will authorize an appeal.</p>`
    +lawButton('Seek authorization and file appeal','appeal',c.id,'file')+lawButton('Finalize the judgment','appeal',c.id,'final');
  if(c.status==='appeal')return `<p>Review on the existing record scheduled for ${lawDate(c.deadline)}.</p>`;
  if(!['active','trial'].includes(c.status)||!stage)return lawEmpty('This matter is closed.');
  if(c.status==='trial'&&c.nextHearing>f.clock)return `<p>The next hearing session is ${lawDate(c.nextHearing)}.</p>`;
  const negotiation=c.status==='trial'&&['civil','family','criminal','classaction','arbitration'].includes(LAW_PRACTICES[c.key].kind);
  return `<h4>${stage[0]}</h4>`+stage[1].map((name,i)=>B(name,`lawPlayDecision(${c.id},${c.step},${i})`)).join('')
    +(negotiation?lawButton('Open negotiations during the hearing','trialDeal',c.id,'',c.negotiatedAt===f.clock):'');
}

function lawClients(f){
  const clients=f.clients.filter(c=>c.matters||c.invoices.length);
  return clients.length?clients.slice().reverse().map(c=>`<details class="law-section" ${c.request?'open':''}><summary>${uiEscape(c.name)} · ${c.type}${c.request?' · '+uiEscape(c.request):''}</summary>
    <p>${uiEscape(c.background)} · ${c.trait} · Payment capacity ${c.funds}/100 · ${c.matters} engagement(s)</p>
    ${Bar('Satisfaction',c.satisfaction,'#528a78')}${Bar('Trust',c.trust,'#528a78')}
    ${c.retained&&lawActiveCases(f).some(x=>x.client===c.id)?lawButton('Send case update','client',c.id,'update',c.lastContact===f.clock)+lawButton('Arrange strategy meeting','client',c.id,'meeting',c.lastContact===f.clock):''}
    ${c.invoices.length?`<p>Unpaid invoices · ${lawMoney(c.invoices.reduce((n,i)=>n+i.amount,0))}. Next invoice ${lawMoney(c.invoices[0].amount)}.</p>`+lawButton('Request payment','client',c.id,'collect',c.lastBilling===f.clock)+lawButton('Offer 25% discount','client',c.id,'discount',c.lastBilling===f.clock)+lawButton('Write off next invoice','client',c.id,'writeoff'):''}</details>`).join('')
    :lawEmpty('Clients are added here after you accept an engagement in Cases.');
}
function lawEmployees(f){
  const staff=f.staff.map(e=>`<details class="law-section" ${e.request?'open':''}><summary>${uiEscape(e.name)} · ${e.role}${e.request?' · '+e.request+' requested':''}</summary>
    <p>${LAW_PRACTICES[e.specialty].name} · Age ${e.age} · ${e.exp} years’ experience · ${lawMoney(e.salary)} annual salary</p>
    <div class="law-metrics law-compact">${[['Skill',e.skill],['Performance',e.performance],['Loyalty',e.loyalty],['Ambition',e.ambition],['Stress',e.stress],['Satisfaction',e.satisfaction],['Team rapport',e.bond],['Hours assigned',e.used]].map(([k,v])=>lawMetric(k,v)).join('')}</div>
    ${lawButton('Train','employee',e.id,'train')}${lawButton('Raise salary 10%','employee',e.id,'raise')}${lawButton('Schedule bonus','employee',e.id,'bonus',!!e.bonus)}
    ${e.role==='Associate'?lawButton('Promote to senior attorney','employee',e.id,'promote'):''}
    ${lawButton('Review workload','employee',e.id,'delegate')}${lawButton('Dismiss with severance','employee',e.id,'release',!!e.shares)}</details>`).join('');
  const roster=f.candidates.map(e=>`<article class="law-item"><div><h4>${uiEscape(e.name)} · ${e.role}</h4><p>${LAW_PRACTICES[e.specialty].name} · Skill ${e.skill} · ${lawMoney(e.salary)}/year${e.source?' · '+uiEscape(f.rivals.find(r=>r.id===e.source)?.name||'Rival firm'):''}</p></div>${lawButton('Make offer','hire',e.id,'',f.staff.length>=lawStaffLimit(f))}</article>`).join('');
  return `<p>${f.staff.length} of ${lawStaffLimit(f)} staff workstations occupied. Assign hires to matters in the Cases tab.</p>`
    +(staff||lawEmpty('You currently practice solo.'))+lawSection('Recruitment',roster||lawEmpty('Candidate lists refresh quarterly.'));
}
function lawFinanceTable(rows,annual){
  if(!rows.length)return lawEmpty(annual?'Your first annual report is posted at Age Up.':'Advance one month for the first report.');
  return `<div class="law-table-wrap"><table><thead><tr>${['Period','Revenue','Expenses','Profit / loss','Closing cash','Debt'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${annual?'Year '+r.year:lawDate(r.month)}</th>${[r.revenue,r.expense,r.revenue-r.expense,r.cash,r.debt].map(n=>`<td>${lawMoney(n)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function lawFinances(f){
  const trust=f.cases.reduce((n,c)=>n+c.deposit,0);
  const unpaid=f.clients.reduce((n,c)=>n+c.invoices.reduce((s,i)=>s+i.amount,0),0);
  const annual=[];
  for(const r of f.reports){
    const year=Math.floor(r.month/12)+1;
    if(year>Math.floor(f.clock/12))continue;
    if(annual.at(-1)?.year!==year)annual.push({year,revenue:0,expense:0});
    const entry=annual.at(-1);
    entry.revenue+=r.revenue;entry.expense+=r.expense;entry.cash=r.cash;entry.debt=r.debt;
  }
  return `<div class="law-metrics">${lawMetric('Cash balance',lawMoney(f.cash))}${lawMetric('Business debt',lawMoney(f.debt))}${lawMetric('Estimated valuation',lawMoney(lawValuation(f)))}${lawMetric('Client trust deposits',lawMoney(trust))}${lawMetric('Open invoices',lawMoney(unpaid))}${lawMetric('Current month profit / loss',lawMoney(f.period.revenue-f.period.expense))}</div>`
    +lawSection('Funding and distributions',`<p>Personal cash ${lawMoney(g.cash)} · Lifetime personal draws after withholding ${lawMoney(f.personalIncome)}.</p>`
      +lawOptions('law-funds','Amount',[5000,15000,30000,75000,150000].map(n=>[Math.round(n*f.scale),lawMoney(n*f.scale)]))
      +lawButton('Contribute personal cash','capital',0,'invest')+lawButton('Distribute firm cash','capital',0,'draw')
      +lawButton('Draw business loan','capital',0,'loan')+lawButton('Repay business loan','capital',0,'repay',!f.debt))
    +lawSection('Monthly reports',lawFinanceTable(f.reports.slice(-12).reverse(),false))
    +lawSection('Annual reports',lawFinanceTable(annual.reverse(),true))
    +`<details class="law-section"><summary>Recent ledger entries</summary>${f.ledger.slice(0,25).map(x=>`<div class="row"><span>${lawDate(x.at)} · ${uiEscape(x.label)}</span><b>${lawMoney(x.amount)}</b></div>`).join('')}</details>`;
}
function lawOffices(f){
  const reach=f.offices.some(o=>!f.domestic.includes(o.place))?'International':new Set(f.offices.map(o=>o.place)).size>=3?'National':f.offices.length>1?'Regional':'Local';
  const heads=f.staff.filter(e=>e.specialty!==f.specialty&&LAW_ATTORNEYS.includes(e.role));
  return `<div class="law-metrics">${lawMetric('Practice reach',reach)}${lawMetric('Offices',f.offices.length)}${lawMetric('Staff capacity',lawStaffLimit(f))}${lawMetric('Monthly premises cost',lawMoney(f.offices.reduce((n,o)=>n+o.monthly,0)))}</div>`
    +lawSection('Current premises',f.offices.map(o=>`<article class="law-item"><div><h4>${LAW_OFFICES[o.level].label} · ${uiEscape(o.place)}</h4><p>${o.owned?'Owned':'Leased'} · ${lawMoney(o.monthly)}/month · ${LAW_OFFICES[o.level].capacity} staff desks</p></div><div>
      ${lawButton('Upgrade facilities','officeChange',o.id,'improve',o.level===LAW_OFFICES.length-1)}${lawButton('Close office','officeChange',o.id,'close',f.offices.length<=1)}</div></article>`).join(''))
    +lawSection('Open an office',lawOptions('law-city','Location',f.places.map((name,i)=>[i,name]))
      +lawOptions('law-office-type','Premises',LAW_OFFICES.map((o,i)=>[i,o.label+' · '+lawMoney(o.rent*2*f.scale)+' lease signing / '+lawMoney(o.price*f.scale)+' purchase locally']))
      +lawOptions('law-tenure','Tenure',[['rent','Lease'],['buy','Purchase']])
      +lawEmpty('Locations outside your home city cost 22% more. International offices require two domestic offices and reputation 65.')
      +lawButton('Open selected office','office'))
    +lawSection('Practice departments',Object.entries(f.dept).map(([key,id])=>`<p><b>${LAW_PRACTICES[key].name}</b> · ${key===f.specialty?'Founder':uiEscape(f.staff.find(e=>e.id===id)?.name||'Department head needed')}</p>`).join('')
      +(heads.length?lawOptions('law-head','Qualified attorney',heads.map(e=>[e.id,e.name+' · '+LAW_PRACTICES[e.specialty].name]))+lawButton('Open department or assign lead','department'):lawEmpty('Hire a lawyer who practices in another specialty to add a department.'))
      +lawEmpty('Creating a new department requires reputation 42 and '+lawMoney(6200*f.scale)+'.'));
}
function lawCompetitors(f){
  return lawSection('Market standing',`<p>Local demand ${f.market}/100. Rival firms handle cases, hire, expand and merge as time passes.</p>`)
    +f.rivals.map(r=>lawSection(uiEscape(r.name),`<p>${uiEscape(r.status)} · ${uiEscape(r.place)} · ${LAW_PRACTICES[r.specialty].name}</p>
      <p>Reputation ${r.rep}/100 · ${r.lawyers} attorneys · ${r.offices} offices · Record ${r.wins} wins and ${r.losses} losses</p>`
      +(r.status==='Operating'?lawButton('Pitch for a major client','rival',r.id,'pitch')+lawButton('Propose merger · '+lawMoney(lawRivalQuote(f,r,true)),'rival',r.id,'merge',f.reputation<56)
      +lawButton('Offer acquisition · '+lawMoney(lawRivalQuote(f,r,false)),'rival',r.id,'acquire',f.reputation<68):''))).join('');
}
function lawNews(f){
  const x=lawCrisisOptions(f);
  return (x?lawSection('Decision pending',`<p>${uiEscape(x[0])}</p>`
    +(f.crisis.article?B('Read and respond in the newspaper',`newsOpenBrief('${f.crisis.article}')`):lawButton(uiEscape(x[1])+' · '+lawMoney(x[3]*f.scale),'crisis',0,'0')+lawButton(uiEscape(x[2])+' · '+lawMoney(x[4]*f.scale),'crisis',0,'1'))):'')
    +lawSection('Market and legal developments',f.news.map(x=>`<p><small>${lawDate(x.at)}</small> ${uiEscape(x.text)}</p>`).join(''))
    +B('Open the life newspaper','newsOpen()');
}
function lawPartnership(f){
  const partners=f.staff.filter(e=>e.shares), potential=f.staff.filter(e=>e.role==='Senior attorney');
  const manager=f.staff.find(e=>e.id===f.managing), heir=f.staff.find(e=>e.id===f.successor);
  return lawSection('Ownership and leadership',`<p>Founder equity ${100-lawPartnerShares(f)}% · Managing partner ${uiEscape(manager?.name||g.name)} · Designated successor ${uiEscape(heir?.name||'None')}</p>
    <p>Partners receive base compensation through payroll and ownership distributions through Finances. Appointments require a majority vote by ownership share.</p>`)
    +partners.map(e=>lawSection(uiEscape(e.name),`<p>${e.shares}% ownership · ${lawMoney(e.salary)} annual compensation · Loyalty ${e.loyalty}/100 · Ambition ${e.ambition}/100</p>`
      +lawButton('Increase compensation 10%','employee',e.id,'raise')+lawButton('Grant 5% equity','partner',e.id,'shares')
      +lawButton('Hold managing partner vote','partner',e.id,'managing')+lawButton('Hold succession vote','partner',e.id,'successor')
      +lawButton('Mediate an internal dispute','partner',e.id,'mediate')+lawButton('Offer stake buyout','partner',e.id,'buyout'))).join('')
    +lawSection('Admission',potential.map(e=>lawButton('Offer partnership to '+uiEscape(e.name),'partner',e.id,'admit')).join('')||lawEmpty('Hire or promote a senior attorney to consider a partner.'))
    +(f.governance.length?lawSection('Vote records',f.governance.slice(0,12).map(x=>`<p>${uiEscape(x)}</p>`).join('')):'')
    +lawSection('Founder exit',B('Hand over to designated successor',"lawRequestExit('handover')",!heir)+B('Wind down practice',"lawRequestExit('close')"));
}
function lawCalendar(f){
  const due=lawActiveCases(f).filter(c=>c.deadline!=null).sort((a,b)=>a.deadline-b.deadline);
  return lawSection(lawDate(f.clock),lawHelp(f)+Bar('Hours used',Math.min(100,100*f.hours/lawCapacity(f)),'#528a78')
    +`<p>${f.hours} of ${lawCapacity(f)} available working hours used. Monthly payroll, overhead, billing and new leads update as you advance.</p>`
    +B('Advance one month','lawCalendarAdvance()',f.clock%12===11)+(f.clock%12===11?lawEmpty('Use the life simulator’s Age Up button to open the next firm year.'):'' ))
    +lawSection('Deadlines and hearings',due.map(c=>`<article class="law-item"><div><h4>${uiEscape(c.title)}</h4><p>${c.status==='waiting'?'Hearing · '+lawDate(c.hearing):c.status==='trial'&&c.nextHearing>f.clock?'Next session · '+lawDate(c.nextHearing):LAW_CASE_STATUS[c.status]+' · '+lawDate(c.deadline)}</p></div>${B('Open matter',`lawOpen('cases',${c.id})`)}</article>`).join('')||lawEmpty('No upcoming case dates.'))
    +lawSection('Client follow-ups',f.clients.filter(c=>c.request).map(c=>`<p>${uiEscape(c.name)} · ${uiEscape(c.request)}</p>`).join('')||lawEmpty('No outstanding client requests.'));
}
function lawCareer(f){
  const clients=f.clients.filter(c=>c.matters);
  const satisfaction=clients.length?Math.round(clients.reduce((n,c)=>n+c.satisfaction,0)/clients.length):0;
  return lawSection(uiEscape(g.name)+' · Founder',`<p>${LAW_PRACTICES[f.specialty].name} · Founded at age ${f.startAge} after working at ${uiEscape(f.founderEmployer||'a law firm')}.</p>`
    +[['Legal expertise',f.skill],['Professional ethics',f.ethics],['Industry influence',f.influence],['Public recognition',f.publicity],['Firm prestige',f.reputation],['Client satisfaction',satisfaction]].map(([label,v])=>Bar(label,v,'#528a78')).join('')
    +`<p>${f.wins} favorable decisions · ${f.losses} adverse decisions · ${f.settlements} negotiated resolutions · ${f.discipline} disciplinary records</p>`
    +lawButton('Practice legal skills','training',0,'',f.monthTraining===f.clock))
    +lawSection('Public appearances',[
      ['Publish legal commentary','article',38],['Speak at the bar association','speech',42],['Give a television interview','interview',48],['Accept a professional service award','award',65]
    ].map(([label,key,rep])=>lawButton(label,'publicity',0,key,f.reputation<rep||f.monthPublicity===f.clock||key==='award'&&f.award)).join('')
      +lawEmpty('Appearances build recognition and unlock opportunities. One appearance per month.'))
    +lawSection('Public service',B('Accept government counsel appointment',"lawRequestExit('government')",!lawPublicEligible(f,'government'))
      +B('Accept appellate judicial appointment',"lawRequestExit('judiciary')",!lawPublicEligible(f,'judiciary'))
      +lawEmpty('Public appointments require professional ethics, reputation and industry influence. Judicial appointment also requires five favorable decisions.'));
}
function lawOutcomeModal(f){
  const r=f.receipt;
  if(!r)return '';
  const c=f.cases.find(x=>x.id===r.caseId);
  const deltas=r.changes?.map((value,i)=>lawMetric(['Evidence','Confidence','Leverage','Readiness','Client satisfaction','Expense change','Billable fees','Fees received'][i],i>=5?lawMoney(value):lawSigned(value))).join('');
  const accounting=c?.status==='closed'?`<p>Client recovery ${lawMoney(c.recovery)} · Firm receipts ${lawMoney(c.paid)} · Matter expenses ${lawMoney(c.cost)}</p>`:'';
  return lawModal(r.title,`<p>${uiEscape(r.response||'The action was recorded.')}</p>${r.evidence?`<p>${uiEscape(r.evidence)}</p>`:''}
    ${deltas?`<div class="law-metrics law-compact">${deltas}</div>`:''}
    ${r.hours?`<p>${r.hours} working hours used.</p>`:''}${r.next?`<p>${uiEscape(r.next)}</p>`:''}${accounting}`,
    B('Continue','lawClearReceipt()'));
}

const lawWork = workV;
workV=function(){
  const f=g.lawFirm;
  if(wsel==='law-archive'&&f)return lawFirmView(f);
  if(lawFirmActive()&&wsel==='job')return lawFirmView(f);
  if(wsel==='law-setup')return `<div class="card"><h2>Law firm setup</h2><p>Choose your office and startup funding.</p>${B('Back to Work',"wsel=null;draw(1)")}</div>`;
  let html=lawWork();
  if(wsel==='job'&&lawCurrentAttorney()&&jobUpdateCareerPage==='home'&&!f&&!g.lawFirmSetup){
    const requirements=lawFounderRequirements();
    html+=`<section class="law-section"><h3>Path to independent practice</h3><ul>${requirements.map(([met,label])=>`<li>${met?'Met':'Pending'} · ${uiEscape(label)}</li>`).join('')}</ul>${lawCanFound()?B('Start a law firm','lawFoundConfirm()'):''}</section>`;
  }
  if(!wsel&&!wsub){
    if(lawFirmActive()){
      const root=document.createElement('div');root.innerHTML=html;
      for(const job of root.querySelectorAll('[onclick]'))if(job.getAttribute('onclick')==="wsel='job';draw(1)")job.remove();
      html=`<section class="law-section law-work-slot"><h3>Current work</h3><div class="row"><strong>${uiEscape(f.name)}</strong><span>Reputation ${f.reputation}/100</span></div><p>${LAW_PRACTICES[f.specialty].name}</p>${B('Manage law firm',"lawOpen('dashboard')")}</section>`+root.innerHTML;
    } else if(f){
      html=B(`${uiEscape(f.name)} <small>${f.status==='active'?'Paused management':'Firm records'}</small>`,"wsel='law-archive';draw(1)")+html;
    } else if(g.lawFirmSetup&&!g.job&&!g.jail&&!g.ret&&g.office<0&&!royalActive()){
      html=B('Resume law firm setup',"wsel='law-setup';draw(1)")+html;
    }
  }
  return html;
};
const lawGame = gameView;
gameView=function(){
  const html=lawGame();
  if(!g.lawFirmPrompt&&wsel!=='law-setup'&&!g.lawFirm?.receipt&&!g.lawFirm?.closePrompt)return html;
  const root=document.createElement('div');
  root.innerHTML=html;
  if(root.querySelector('.mo'))return html;
  const f=g.lawFirm;
  let modal='';
  if(g.lawFirmPrompt==='confirm')modal=lawModal('Leave your job and start a firm?',`<p>Confirming resigns from ${uiEscape(g.job?.company||'your employer')} immediately. You’ll then set your firm name, choose an office and invest your own cash.</p>`,B('Resign and continue','lawFoundResign()')+B('Stay at current firm','g.lawFirmPrompt=null;draw()'));
  else if(tab==='Work'&&wsel==='law-setup'&&g.lawFirmSetup)modal=lawSetupModal();
  else if(f?.receipt)modal=lawOutcomeModal(f);
  else if(f?.closePrompt)modal=lawModal(f.closePrompt==='close'?'Wind down the firm?':f.closePrompt==='handover'?'Hand over the firm?':'Accept the public appointment?',`<p>${f.closePrompt==='close'?'Open matters will be referred, remaining trust funds returned, and business assets and liabilities settled. Your personal cash covers any remaining shortfall.':'This ends your active management. An appointed successor assumes control if available. Otherwise, the practice winds down.'}</p>`,B('Confirm transition','lawExitFirm()')+B('Keep managing the firm','g.lawFirm.closePrompt=null;draw()'));
  if(modal)root.querySelector('.game').insertAdjacentHTML('beforeend',modal);
  return root.innerHTML;
};
