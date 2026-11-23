/* All random draws are stored with the firm, including market and case decisions. */
const lawClamp = n => Math.min(100,Math.max(0,Math.round(n)));
const lawActiveCases = f => f.cases.filter(c=>!['lead','closed'].includes(c.status));
const lawStaffLimit = f => f.offices.reduce((total,o)=>total+LAW_OFFICES[o.level].capacity,0);
const lawCapacity = f => 132+f.staff.reduce((total,e)=>total+Math.max(0,Math.round((LAW_ATTORNEYS.includes(e.role)?108:52)*(1-e.stress/145))),0);
const lawValuation = f => Math.max(0,Math.round(f.cash-f.debt+f.offices.reduce((n,o)=>n+o.equity,0)+Math.max(0,f.reports.slice(-12).reduce((n,r)=>n+r.revenue-r.expense,0))*2+f.reputation*1600));
const lawPhase = c => c.route[c.step];
const lawRandom = (f,low,high) => {
  f.seed=(Math.imul(f.seed,1664525)+1013904223)>>>0;
  return low+Math.floor(f.seed/4294967296*(high-low+1));
};
const lawPick = (f,items) => items[lawRandom(f,0,items.length-1)];
const lawId = f => ++f.serial;
const lawPerson = f => lawPick(f,LAW_FIRST)+' '+lawPick(f,LAW_LAST);
const lawTouch = (f,text) => {
  f.news.unshift({at:f.clock,text});
  if(f.news.length>70)f.news.pop();
};
const lawLogCase = (c,text) => {
  c.history.unshift(text);
  if(c.history.length>25)c.history.pop();
};
function lawPost(f,kind,label,amount) {
  amount=Math.round(amount);
  if(!amount)return;
  f.cash+=amount;
  f.ledger.unshift({at:f.clock,kind,label,amount});
  if(f.ledger.length>180)f.ledger.pop();
  if(kind==='revenue')f.period.revenue+=amount;
  if(kind==='expense')f.period.expense-=amount;
}
function lawChange(f,key,n) {
  f[key]=lawClamp(f[key]+n);
}
function lawOfficeQuote(f,level,owned,place) {
  const office=LAW_OFFICES[level];
  const location=place===f.home?1:1.22;
  return Math.round((owned?office.price:office.rent*2)*f.scale*location);
}
function lawAddOffice(f,level,owned,place) {
  if(!LAW_OFFICES[level]||!f.places.includes(place))return '';
  const amount=lawOfficeQuote(f,level,owned,place);
  if(f.cash<amount)return '';
  const design=LAW_OFFICES[level], location=place===f.home?1:1.22;
  const monthly=Math.round(design.rent*f.scale*location*(owned?.31:1));
  f.offices.push({id:lawId(f),level,place,owned,monthly,openedAt:f.clock,equity:owned?amount:0,deposit:owned?0:amount-monthly});
  if(!owned)lawPost(f,'expense','First month rent',-monthly);
  lawPost(f,'capital',owned?'Office purchase':'Lease deposit',owned?-amount:monthly-amount);
  lawChange(f,'reputation',design.rep);
  return design.label+' opened in '+place+'.';
}
function lawNewFirm({name,specialty,seed,capital,age,scale,home,places}) {
  const f={version:1,name,specialty,seed,capital,scale,home,places,startAge:age,lastAge:age,clock:0,serial:0,
    cash:capital,debt:0,reputation:30,ethics:78,skill:48,influence:12,publicity:10,
    hours:0,monthTraining:-1,monthPublicity:-1,market:50,dept:{[specialty]:0},
    offices:[],staff:[],candidates:[],cases:[],clients:[],rivals:[],news:[],ledger:[],reports:[],
    period:{revenue:0,expense:0},crisis:null,seenEvents:[],governance:[],managing:0,successor:0,award:false,
    wins:0,losses:0,settlements:0,discipline:0,personalIncome:0,receipt:null,status:'active'};
  f.rivals=LAW_RIVALS.slice(0,5).map((name,i)=>({id:lawId(f),name,rep:lawRandom(f,28,72),lawyers:lawRandom(f,4,16),offices:1,place:places[i%places.length],wins:0,losses:0,cash:lawRandom(f,140000,420000)*scale,status:'Operating',specialty:lawPick(f,Object.keys(LAW_PRACTICES))}));
  lawRefreshStaff(f);
  return f;
}
function lawRefreshStaff(f) {
  const roles=Object.keys(LAW_ROLES).filter(role=>role!=='Partner');
  f.candidates=roles.map((role,i)=>lawMakeEmployee(f,role,i<3?f.specialty:lawPick(f,Object.keys(LAW_PRACTICES))));
  const rival=f.rivals.find(r=>r.status==='Operating');
  const fields=Object.keys(LAW_PRACTICES);
  const rotation=Math.floor(f.clock/3)%fields.length;
  for(const specialty of fields.slice(rotation).concat(fields.slice(0,rotation)).slice(0,4)) {
    f.candidates.push(lawMakeEmployee(f,'Associate',specialty));
  }
  if(rival)f.candidates.push({...lawMakeEmployee(f,'Senior attorney',rival.specialty),source:rival.id});
}
function lawMakeEmployee(f,role,specialty) {
  const age=lawRandom(f,role==='Senior attorney'?35:25,58);
  return {id:lawId(f),name:lawPerson(f),role,specialty,age,exp:Math.max(1,age-lawRandom(f,23,29)),skill:lawRandom(f,42,81),
    performance:lawRandom(f,47,76),salary:Math.round(LAW_ROLES[role]*f.scale*lawRandom(f,90,115)/100),
    loyalty:lawRandom(f,42,80),ambition:lawRandom(f,28,92),stress:10,satisfaction:65,bond:55,shares:0,
    used:0,request:'',bonus:0,source:null};
}
function lawGenerateLead(f,key,returning) {
  const practice=LAW_PRACTICES[key];
  const [title,story,opponent,exhibit,witness,claim]=lawPick(f,practice.matters);
  const size=key==='classaction'?2:f.reputation>=63?lawRandom(f,0,2):lawRandom(f,0,1);
  const scale=[.58,1,1.6][size]*f.scale;
  const traits=['risk-averse','pragmatic','demanding','principled','cost-conscious'];
  const types=['Individual','Family','Corporation','Celebrity','Public official'];
  const type=['corporate','ip','international'].includes(key)?'Corporation':
    ['family','immigration'].includes(key)?'Family':key==='entertainment'?'Celebrity':lawPick(f,[types[0],types[0],types[0],types[4]]);
  const client=returning||{id:lawId(f),name:type==='Corporation'?lawPerson(f).split(' ')[1]+' Industries':lawPerson(f),
    type,background:lawPick(f,['A referral from a former client','A local bar referral','An existing professional contact','Found the firm through its public profile']),
    trait:lawPick(f,traits),funds:lawRandom(f,30,91),trust:54,satisfaction:61,matters:0,lastContact:-1,invoices:[],request:'',retained:true};
  if(!returning)f.clients.push(client);
  const fee=Math.round((practice.model==='hourly'?practice.fee*f.scale:practice.fee*scale));
  const route=['consultation','evaluation','investigation',...LAW_ROUTES[practice.kind],'prepare'];
  const c={id:lawId(f),client:client.id,key,title:client.name+' · '+title,story,opponent,exhibit,witness,
    opposingCounsel:lawPerson(f),judge:lawPerson(f),tribunal:lawPick(f,['Procedure-focused','Evidence-focused','Settlement-oriented']),
    development:lawPick(f,['An archived record surfaced during preparation.','The opposing party changed its account of a key date.','An independent witness requested clarification before appearing.','A duplicate record contains an inconsistent entry.']),
    size,claim:Math.round(claim*scale),fee,model:practice.model,
    retainer:practice.model==='hourly'?Math.round(fee*[9,14,20][size]):0,deposit:0,billed:0,invoiced:0,paid:0,
    cost:0,estimate:Math.round([3700,6800,15300][size]*f.scale),
    evidence:lawRandom(f,35,57),readiness:20,leverage:lawRandom(f,30,54),confidence:55,
    offer:null,counter:null,offerNote:'',assigned:[],status:'lead',route,step:0,deadline:f.clock+3,
    history:[returning?'The client returned with another matter.':'A new consultation was requested.'],appealUntil:null,
    error:false,adverse:false,recovery:0,result:'',verdict:null,conflict:lawRandom(f,1,100)<=9};
  f.cases.push(c);
  return c;
}
function lawFillLeads(f) {
  const keys=Object.keys(f.dept);
  const target=Math.min(8,3+keys.length+Math.floor(f.publicity/30));
  const open=f.cases.filter(c=>c.status==='lead');
  for(let i=open.length;i<target;i++) {
    const specialty=i===0?keys[0]:keys[i%keys.length];
    const previous=f.clients.find(cl=>cl.retained&&cl.satisfaction>=76&&cl.trust>=71&&cl.matters>0&&!f.cases.some(c=>c.client===cl.id&&c.status!=='closed'));
    lawGenerateLead(f,specialty,previous&&lawRandom(f,1,100)<33?previous:null);
  }
}
function lawClient(f,c) {return f.clients.find(client=>client.id===c.client);}
function lawAccept(f,c,check) {
  if(c.status!=='lead'||c.deadline<=f.clock||!Object.hasOwn(f.dept,c.key))return '';
  if(c.key!==f.specialty&&!f.staff.some(e=>e.id===f.dept[c.key]))return 'Assign a qualified department head before accepting this matter.';
  if(c.conflict&&!check)return 'The conflict screen requires written clearance before engagement.';
  if(c.conflict&&check) {
    c.conflict=false;
    if(lawRandom(f,1,100)<=35){
      c.status='closed';c.result='Referred after a conflict check';
      lawChange(f,'ethics',3);
      return 'The conflict could not be cleared. The prospective client was referred to independent counsel.';
    }
    lawChange(f,'ethics',2);
  }
  const client=lawClient(f,c);
  c.status='active';
  c.deadline=f.clock+3;
  client.matters++;
  if(c.retainer){
    c.deposit=c.retainer;
    lawLogCase(c,'The client deposited an advance retainer in trust.');
  }
  if(c.model==='flat'){
    const initial=Math.round(c.fee*.35);
    c.paid+=initial;
    lawPost(f,'revenue','Earned initial flat fee',initial);
  }
  if(f.dept[c.key])c.assigned.push(f.dept[c.key]);
  return 'Engagement opened for '+client.name+'. Consultation is ready.';
}
function lawBill(f,c) {
  if(c.model!=='hourly')return;
  const total=Math.max(0,c.billed-c.invoiced);
  if(!total)return;
  c.invoiced+=total;
  const earned=Math.min(total,c.deposit);
  c.deposit-=earned;
  c.paid+=earned;
  lawPost(f,'revenue','Earned hourly fees from trust',earned);
  if(total>earned)lawClient(f,c).invoices.push({caseId:c.id,amount:total-earned,due:f.clock+1,attempts:0});
}
function lawInvoice(f,client,invoice,discount=false) {
  const c=f.cases.find(x=>x.id===invoice.caseId);
  if(lawRandom(f,1,100)<=Math.min(98,45+client.funds*.38+client.trust*.18+(discount?24:0))) {
    const paid=Math.round(invoice.amount*(discount?.75:1));
    lawPost(f,'revenue','Client invoice payment',paid);
    c.paid+=paid;
    client.invoices=client.invoices.filter(x=>x!==invoice);
    return paid;
  }
  invoice.attempts++;
  invoice.due=f.clock+1;
  client.request='Billing dispute';
  return 0;
}
function lawSpend(f,c,hours,expense) {
  if(f.hours+hours>lawCapacity(f))return 'There are too few working hours left this month. Delegate, hire, or advance the calendar.';
  if(expense>0&&f.cash<expense)return 'Firm cash cannot cover this expense. Add capital or arrange financing.';
  f.hours+=hours;
  if(c){
    c.cost+=expense;
    if(c.model==='hourly')c.billed+=Math.round(hours*c.fee);
    for(const e of f.staff.filter(e=>c.assigned.includes(e.id))) {
      e.stress=lawClamp(e.stress+Math.ceil(hours/9));
      e.used+=hours;
    }
  }
  lawPost(f,'expense',c?'Matter expense':'Professional expense',-expense);
  return '';
}
function lawClose(f,c,result) {
  const client=lawClient(f,c);
  c.status='closed';c.result=result;c.deadline=null;
  lawBill(f,c);
  const refund=c.deposit;
  c.deposit=0;
  const award=c.verdict?.recovery||0;
  let fee=0;
  if(c.model==='contingency')fee=Math.round(award/3);
  if(c.model==='flat')fee=Math.max(0,c.fee-c.paid);
  if(fee){
    c.paid+=fee;
    lawPost(f,'revenue',c.model==='flat'?'Final earned flat fee':'Contingency fee',fee);
  }
  const reimburse=c.model==='contingency'?Math.min(c.cost,Math.max(0,award-fee)):0;
  if(reimburse){
    c.paid+=reimburse;
    lawPost(f,'revenue','Recovered litigation expenses',reimburse);
  }
  c.recovery=Math.max(0,award-(c.model==='contingency'?fee+reimburse:0));
  if(result==='Settlement approved'||result==='Plea approved'||result==='Consent order entered')f.settlements++;
  if(c.verdict){
    const success=c.verdict.good;
    if(!/approved|Consent order/.test(result)){
      if(success)f.wins++;
      else f.losses++;
    }
    lawChange(f,'reputation',success?2+c.size:-2);
    lawChange(f,'publicity',success?c.size*3:0);
    client.satisfaction=lawClamp(client.satisfaction+(success?13:-13));
    client.trust=lawClamp(client.trust+(success?7:-6));
  }
  lawLogCase(c,result+'. '+(refund?'Unused trust funds were returned. ':'')+'Client recovery and firm receipts were recorded separately.');
  lawTouch(f,c.title+' concluded. '+result+'.');
}
function lawNegotiate(f,c,choice,atTrial=false) {
  const client=lawClient(f,c);
  const kind=LAW_PRACTICES[c.key].kind;
  const money=c.claim>0&&kind!=='criminal';
  const split=lawClamp(27+c.leverage*.45+c.evidence*.19+lawRandom(f,-18,12));
  c.offer=money?Math.round(c.claim*split/100):null;
  c.counter=money?Math.round(c.claim*(choice===0?.72:.6)):null;
  if(choice===2) {
    c.offerNote='Negotiations ended without agreement. The previous offer is off the table.';
    return c.offerNote;
  }
  const consent=lawRandom(f,1,100);
  const deal=money
    ? split>=(client.trait==='demanding'?65:client.trait==='risk-averse'?43:52)
    : lawRandom(f,1,100)<c.leverage+(kind==='family'?12:0);
  if(deal&&consent<=Math.round(36+client.trust*.58-(client.trait==='principled'?17:0))){
    c.offerNote='Both sides agreed and the client authorized the terms.';
    c.verdict={good:true,recovery:c.offer||0};
    lawClose(f,c,kind==='criminal'?'Plea approved':kind==='family'?'Consent order entered':'Settlement approved');
  }else{
    c.offerNote=deal?'The client declined the proposed terms.':'The other side rejected the proposed terms.';
    if(atTrial)c.leverage=lawClamp(c.leverage-3);
  }
  return c.offerNote;
}
function lawQueueTrial(f,c) {
  c.status='waiting';
  c.hearing=Math.floor(f.clock/12)*12+12+lawRandom(f,0,2);
  c.deadline=c.hearing+2;
}
function lawOpenTrial(f,c) {
  c.status='trial';
  c.trialStart=c.step;
  const practice=LAW_PRACTICES[c.key];
  const sequence=practice.kind==='public'?['opening','evidence','closing']:
    practice.forum==='agency'?['opening','direct','closing']:['opening','direct','evidence','cross','surprise','closing'];
  c.route.push(...sequence);
  c.nextHearing=f.clock;
  c.deadline=f.clock+4;
  lawLogCase(c,'The tribunal called the matter for hearing.');
}
function lawVerdict(f,c,appeal=false) {
  const forum=LAW_PRACTICES[c.key].forum;
  const recordWeight=forum==='agency'?.47:forum==='jury'?.36:.41;
  const presentation=forum==='jury'?c.confidence*.12:c.leverage*.07;
  const standard=LAW_PRACTICES[c.key].kind==='criminal'?7:forum==='agency'?-3:0;
  const n=lawClamp(c.evidence*recordWeight+c.readiness*.29+f.skill*.18+presentation+standard+
    (c.admitted||0)+(c.tribunal==='Procedure-focused'&&c.missed?-6:0)-(c.adverse?8:0));
  const roll=lawRandom(f,1,100);
  if(appeal){
    const overturned=roll<=Math.min(58,(c.error?32:13)+Math.floor(n/4));
    if(overturned){
      c.verdict.good=true;c.verdict.recovery=Math.round(c.claim*.62);
    }
    lawClose(f,c,overturned?'Decision reversed on appeal':'Decision affirmed on appeal');
    return c.result;
  }
  const good=roll<=Math.max(8,Math.min(92,n));
  const practice=LAW_PRACTICES[c.key], criminal=practice.kind==='criminal';
  const outcome=criminal?(good?'Acquittal':'Conviction'):
    practice.forum==='agency'?(good?'Application approved':'Application denied'):
    practice.forum==='arbitration'?(good?'Favorable award':'Adverse award'):
    (good?'Judgment for the client':c.evidence<28?'Dismissal':'Judgment against the client');
  c.verdict={good,recovery:good?Math.round(c.claim*(.55+lawRandom(f,0,30)/100)):0,outcome};
  lawLogCase(c,outcome+'.');
  if(!good&&practice.forum!=='arbitration'){
    c.status='appealable';c.appealUntil=f.clock+2;c.deadline=c.appealUntil;
    return outcome+'. The client may authorize an appeal within two months.';
  }
  lawClose(f,c,outcome);
  return outcome+'. Final accounting was recorded.';
}
function lawAppeal(f,c,file) {
  if(c.status!=='appealable'||f.clock>=c.appealUntil)return '';
  if(!file){
    lawClose(f,c,c.verdict.outcome);
    return 'Judgment finalized and accounts closed.';
  }
  const client=lawClient(f,c);
  if(client.trust<41||client.funds<33&&c.model!=='contingency'){
    lawClose(f,c,c.verdict.outcome);
    return 'The client declined to authorize an appeal. The original result stands.';
  }
  const issue=lawSpend(f,c,33,Math.round(f.scale*(6400+c.size*2300)));
  if(issue)return issue;
  c.status='appeal';c.deadline=f.clock+lawRandom(f,3,6);
  lawLogCase(c,'An appeal was filed. Review is limited to the existing record and preserved objections.');
  return 'Appeal filed. The review date is on the calendar.';
}
function lawDecision(f,c,choice,stage) {
  if(!c||!['active','trial'].includes(c.status)||lawPhase(c)!==stage||![0,1,2].includes(choice))return '';
  if(c.status==='trial'&&c.nextHearing>f.clock)return {warning:'The next hearing session has been scheduled. Advance the firm calendar to continue.'};
  const client=lawClient(f,c), courtroom=c.status==='trial';
  const trained=f.staff.filter(e=>c.assigned.includes(e.id)&&e.used<100);
  const relevant={
    Research:['evaluation','motion','brief','certify','petition'],
    'Evidence review':['investigation','discovery','disclosure','direct','evidence','cross','surprise'],
    'Client liaison':['consultation','settle','plea','mediation'],
    'Hearing counsel':['prepare','opening','direct','evidence','cross','surprise','closing']
  };
  const support=trained.reduce((n,e)=>n+(e.specialty===c.key?3:1)+Math.round(e.skill/35)+(relevant[c.tasks?.[e.id]]?.includes(stage)?2:0),0);
  const hours=Math.max(7,(courtroom?16:18)+c.size*5+[1,-4,8][choice]-Math.min(14,support));
  const expense=Math.round(f.scale*(courtroom?425:230)*(1+c.size*.5)*[1.1,.43,2.55][choice]);
  const issue=lawSpend(f,c,hours,expense);
  if(issue)return {warning:issue};
  const before=[c.evidence,c.confidence,c.leverage,c.readiness,client.satisfaction,c.cost-expense,c.billed-(c.model==='hourly'?hours*c.fee:0),c.paid];
  const isNegotiation=['settle','mediation','plea'].includes(stage), isInvestigation=['discovery','investigation','disclosure','evidence'].includes(stage);
  const draw=lawRandom(f,-8,9), push=draw+Math.round((f.skill-48)/13)+Math.min(7,support);
  c.evidence=lawClamp(c.evidence+(isInvestigation?[11,6,14]:[3,1,6])[choice]+push);
  c.readiness=lawClamp(c.readiness+(stage==='prepare'?[14,11,19]:[5,6,8])[choice]+Math.round(push/2));
  c.leverage=lawClamp(c.leverage+[5,8,2][choice]+draw);
  c.confidence=lawClamp(c.confidence+[5,2,-2][choice]+Math.round(push/2));
  client.satisfaction=lawClamp(client.satisfaction+[3,2,-2][choice]+Math.sign(push)*2);
  client.trust=lawClamp(client.trust+Math.sign(push)*2);
  if(stage==='prepare'||courtroom)f.skill=learnTalent('law',f.skill,1);
  let response=push>=2
    ? c.opposingCounsel+' narrowed the challenge to part of the record.'
    : c.opposingCounsel+' disputed your account and secured time to respond.';
  let evidence=isInvestigation
    ? (push>=0?'The team corroborated '+c.exhibit+'.':'The other side challenged the provenance of '+c.exhibit+'.')
    : stage==='direct'||stage==='cross'||stage==='surprise'?'The record now includes updated testimony from '+c.witness+'.':'The filing and case notes were updated.';
  let next=push<0?'The dispute may require follow-up at the next hearing.':'The updated record can support later arguments.';
  const kind=LAW_PRACTICES[c.key].kind;
  if(kind==='agency'){
    response=push>=2?'The reviewing officer accepted part of the submission.':'The reviewing officer asked for further clarification.';
  }
  if(stage==='evidence'){
    const sustains=push+(c.tribunal==='Procedure-focused'?-3:1)>0;
    c.admitted=sustains?[6,2,4][choice]:[-5,1,-3][choice];
    c.error=choice===2&&!sustains;
    evidence=choice===2?(sustains?'The tribunal sustained your objection and excluded the disputed material.':'The tribunal overruled the objection. Your challenge was preserved in the record.'):
      sustains?'The tribunal admitted the offered exhibits.':'The tribunal limited admission to the portions already supported by the record.';
  }
  if(stage==='surprise'){
    c.adverse=push<3;
    evidence=c.development+' '+(c.adverse?'The new account remained in the record.':'Your response narrowed the dispute.');
  }
  if(stage==='investigation'&&draw>=5)evidence+=' '+c.development;
  if(choice===2&&client.trait==='cost-conscious'&&client.satisfaction<48){
    client.request='Strategy meeting';
    next='The client objected to the cost of the strategy and requested a meeting.';
  }
  if(isNegotiation){
    response=lawNegotiate(f,c,choice);
    next=c.status==='closed'?'The case is closed.':'The matter proceeds on the remaining issues.';
  }
  if(stage==='certify'&&push<0) {
    c.claim=Math.round(c.claim*.46);
    evidence='The court narrowed the class, reducing the amount at stake.';
  }
  if(stage==='motion'&&choice===2&&c.evidence<28) {
    c.verdict={good:false,outcome:'Dismissal on an early motion',recovery:0};
    c.status='appealable';c.appealUntil=f.clock+2;c.deadline=c.appealUntil;
    next='The court dismissed the case. Discuss an appeal before the window closes.';
  }
  if(client.satisfaction<24&&c.status==='active'){
    client.retained=false;
    c.status='closed';c.result='Client ended the engagement';c.deadline=null;
    lawBill(f,c);c.deposit=0;
    lawLogCase(c,'The client terminated the engagement. Unused trust was returned.');
    lawChange(f,'reputation',-2);
    next='The client ended the engagement. Unused trust was returned.';
  }
  if(c.status==='active'||c.status==='trial'){
    c.step++;
    if(stage==='prepare') {
      lawQueueTrial(f,c);
      next='Hearing scheduled for the next life year or later. See the calendar for the date.';
    } else if(stage==='closing'){
      next=lawVerdict(f,c);
    } else if(courtroom&&['direct','cross'].includes(stage)){
      c.nextHearing=f.clock+1;
      c.deadline=c.nextHearing+3;
      next='The next hearing session begins next month.';
    } else if(!courtroom){
      c.deadline=f.clock+(stage==='file'?3:4);
    }
  }
  const after=[c.evidence,c.confidence,c.leverage,c.readiness,client.satisfaction,c.cost,c.billed,c.paid];
  const label=LAW_STAGES[stage][1][choice];
  lawLogCase(c,label+'. '+evidence+' '+next);
  return {title:label,response,evidence,next,hours,changes:after.map((n,i)=>n-before[i])};
}

function lawMonth(f,economy) {
  f.clock++;
  const months=f.clock%12;
  const rent=f.offices.reduce((n,o)=>n+(o.owned||o.openedAt!==f.clock-1?o.monthly:0),0);
  lawPost(f,'expense','Office rent and maintenance',-rent);
  lawPost(f,'expense','Salaries and bonuses',-f.staff.reduce((n,e)=>n+Math.round(e.salary/12)+e.bonus,0));
  if(f.debt>0){
    const interest=Math.round(f.debt*.008);
    const payment=Math.min(f.debt,Math.max(1,Math.round(f.debt*.013)),Math.max(0,f.cash-interest));
    lawPost(f,'expense','Loan interest',-interest);
    lawPost(f,'capital','Loan principal payment',-payment);
    f.debt-=payment;
  }
  f.hours=0;
  f.market=lawClamp(f.market+lawRandom(f,-5,5)+Math.sign(economy-f.market));
  for(const e of f.staff.slice()){
    e.bonus=0;
    const work=e.used;
    e.used=0;
    e.stress=lawClamp(e.stress+(work>100?13:work>65?4:-7)+(f.cash<0?5:0));
    e.satisfaction=lawClamp(e.satisfaction+(e.stress>75?-5:1)+(e.request?-2:0));
    e.loyalty=lawClamp(e.loyalty+(e.satisfaction<35?-3:1));
    e.bond=lawClamp(e.bond+lawRandom(f,-3,4));
    if(!months){e.age++;e.exp++;e.performance=lawClamp(e.performance+lawRandom(f,-3,5));}
    if(e.shares&&e.satisfaction<32&&e.ambition>72&&lawRandom(f,1,100)<14){
      const owed=Math.round(lawValuation(f)*e.shares/100);
      lawPost(f,'capital','Departing partner equity',-owed);
      lawRemoveEmployee(f,e);
      f.rivals.push({id:lawId(f),name:e.name.split(' ').at(-1)+' Legal',rep:35,lawyers:1,offices:1,place:f.home,wins:0,losses:0,cash:owed,status:'Operating',specialty:e.specialty});
      lawTouch(f,e.name+' withdrew from the partnership and opened a competing firm.');
    } else if(!e.shares&&e.satisfaction<28&&lawRandom(f,1,100)<22){
      const rival=f.rivals.find(r=>r.status==='Operating');
      lawRemoveEmployee(f,e);
      if(rival&&LAW_ATTORNEYS.includes(e.role))rival.lawyers++;
      lawTouch(f,e.name+' resigned'+(rival?' for '+rival.name:'')+'.');
    } else if(!e.request&&lawRandom(f,1,100)<7){
      e.request=e.ambition>68&&['Associate','Senior attorney'].includes(e.role)?'Promotion':'Raise';
      lawTouch(f,e.name+' requested a '+e.request.toLowerCase()+'.');
    }
  }
  for(const c of f.cases.slice()){
    const client=lawClient(f,c);
    if(c.status==='lead'&&c.deadline<=f.clock){
      c.status='closed';c.result='Prospect hired other counsel';c.deadline=null;c.expiresAt=f.clock+6;
      continue;
    }
    if(['lead','closed'].includes(c.status))continue;
    lawBill(f,c);
    if(c.status==='waiting'&&c.hearing<=f.clock)lawOpenTrial(f,c);
    else if(c.status==='appealable'&&c.appealUntil<=f.clock)lawClose(f,c,c.verdict.outcome);
    else if(c.status==='appeal'&&c.deadline<=f.clock)lawVerdict(f,c,true);
    else if(['active','trial'].includes(c.status)&&c.deadline<=f.clock){
      c.adverse=true;
      c.evidence=lawClamp(c.evidence-8);
      c.confidence=lawClamp(c.confidence-13);
      client.satisfaction=lawClamp(client.satisfaction-13);
      client.trust=lawClamp(client.trust-8);
      c.missed=(c.missed||0)+1;
      c.deadline=f.clock+2;
      lawChange(f,'ethics',-4);
      lawLogCase(c,'A deadline was missed. The client expects an explanation.');
      if(c.missed>=3||client.satisfaction<24){
        client.retained=false;
        if(!f.crisis)f.crisis={key:'malpractice',caseId:c.id};
        lawClose(f,c,'Representation ended after missed deadlines');
      }
    } else if(f.clock-client.lastContact>=3&&lawRandom(f,1,100)<16){
      client.request=client.trait==='demanding'?'Strategy meeting':'Case update';
    }
  }
  for(const client of f.clients){
    for(const invoice of client.invoices.slice()){
      if(invoice.due<=f.clock&&invoice.attempts<2)lawInvoice(f,client,invoice);
    }
  }
  lawRivalMonth(f);
  if(!f.crisis&&f.clock%3===2)lawGenerateCrisis(f);
  if(!f.cash&&f.debt>0)lawTouch(f,'Loan reserves are exhausted.');
  if(f.cash<0&&f.clock%3===0){
    lawChange(f,'reputation',-2);
    lawTouch(f,'The firm has a cash shortfall. Review overhead and financing.');
  }
  if(f.ethics<42&&!f.crisis)f.crisis={key:'discipline'};
  f.reports.push({month:f.clock-1,...f.period,cash:f.cash,debt:f.debt});
  f.period={revenue:0,expense:0};
  f.cases=f.cases.filter(c=>c.expiresAt==null||c.expiresAt>f.clock);
  const represented=new Set(f.cases.map(c=>c.client));
  f.clients=f.clients.filter(c=>c.matters||represented.has(c.id));
  if(months%3===0)lawRefreshStaff(f);
  lawFillLeads(f);
}
function lawRivalMonth(f) {
  for(const rival of f.rivals.filter(r=>r.status==='Operating')){
    const won=lawRandom(f,1,100)<rival.rep;
    rival.wins+=Number(won);
    rival.losses+=Number(!won);
    rival.cash+=Math.round(f.scale*(won?lawRandom(f,2000,24000):lawRandom(f,-21000,-1500))*(f.market/70+.45));
    rival.rep=lawClamp(rival.rep+(won?1:-1)+lawRandom(f,-2,2));
    if(f.clock%6===0){
      rival.lawyers=Math.max(1,rival.lawyers+(rival.cash>160000?1:-1));
      if(rival.cash>570000*f.scale&&rival.offices<5){
        rival.offices++;
        rival.cash-=Math.round(125000*f.scale);
        rival.place=f.places[(f.places.indexOf(rival.place)+1)%f.places.length];
        lawTouch(f,rival.name+' opened an office in '+rival.place+'.');
      } else if(rival.cash<0){
        rival.status='Closed';rival.lawyers=0;
        lawTouch(f,rival.name+' ceased operating after cash-flow problems.');
      }
    }
  }
  if(f.clock%18===0){
    const pair=f.rivals.filter(r=>r.status==='Operating').sort((a,b)=>b.cash-a.cash);
    if(pair.length>2&&pair.at(-1).cash<pair[0].cash*.6){
      const other=pair.at(-1);
      pair[0].lawyers+=other.lawyers;
      pair[0].offices+=other.offices;
      pair[0].cash+=other.cash;
      other.status='Merged with '+pair[0].name;
      lawTouch(f,other.name+' merged with '+pair[0].name+'.');
    }
    if(!f.rivals.some(r=>r.status==='Operating')){
      f.rivals.push({id:lawId(f),name:lawPick(f,LAW_RIVALS)+' of '+f.home,rep:36,lawyers:5,offices:1,place:f.home,wins:0,losses:0,cash:200000*f.scale,status:'Operating',specialty:f.specialty});
    }
  }
}
function lawRemoveEmployee(f,e) {
  f.staff=f.staff.filter(x=>x.id!==e.id);
  for(const key of Object.keys(f.dept))if(f.dept[key]===e.id)f.dept[key]=0;
  for(const c of f.cases)c.assigned=c.assigned.filter(id=>id!==e.id);
  if(f.managing===e.id)f.managing=0;
  if(f.successor===e.id)f.successor=0;
}
function lawGenerateCrisis(f) {
  const staff=f.staff.filter(e=>e.loyalty<74);
  const rival=f.rivals.find(r=>r.status==='Operating');
  if(staff.length&&rival&&lawRandom(f,1,100)<32){
    f.crisis={key:'poach',employee:lawPick(f,staff).id,rival:rival.id};
    return;
  }
  const eligible=LAW_EVENTS.filter(e=>!['urgent','witness','conflict'].includes(e[0])||lawActiveCases(f).length)
    .filter(e=>!['complaint','celebration','disagreement'].includes(e[0])||f.staff.length);
  const fresh=eligible.filter(e=>!f.seenEvents.includes(e[0]));
  if(!fresh.length)f.seenEvents=[];
  const row=lawPick(f,fresh.length?fresh:eligible);
  f.seenEvents.push(row[0]);
  f.crisis={key:row[0]};
  lawTouch(f,row[1]);
}
function lawCrisisOptions(f) {
  const crisis=f.crisis;
  if(!crisis)return null;
  if(crisis.key==='malpractice'){
    return ['A former client filed a malpractice claim.','Report the claim and offer mediation','Retain outside defense counsel',7500,14500,6,3,1,0,-2,1];
  }
  if(crisis.key==='discipline'){
    return ['The professional regulator opened a disciplinary review.','Cooperate and adopt remedial procedures','Contest the findings through counsel',5800,11500,13,7,1,0,-2,-5];
  }
  if(crisis.key==='poach'){
    const e=f.staff.find(x=>x.id===crisis.employee),r=f.rivals.find(x=>x.id===crisis.rival);
    return [r.name+' approached '+(e?.name||'a former employee')+'.','Offer a retention bonus','Let the employee decide',4500,0,0,0,2,0,0,0];
  }
  return LAW_EVENTS.find(e=>e[0]===crisis.key)?.slice(1);
}
function lawResolveCrisis(f,choice) {
  if(![0,1].includes(choice))return '';
  const options=lawCrisisOptions(f);
  if(!options)return '';
  const [title,first,second,c1,c2,e1,e2,s1,s2,r1=0,r2=0]=options;
  const amount=Math.round((choice?c2:c1)*f.scale);
  if(f.cash<amount&&amount>0)return 'The firm needs more funds for this response.';
  const {key,employee,rival}=f.crisis;
  const action=choice?second:first;
  let detail='';
  lawPost(f,'expense','Crisis response',-amount);
  lawChange(f,'ethics',choice?e2:e1);
  lawChange(f,'reputation',choice?r2:r1);
  for(const e of f.staff)e.satisfaction=lawClamp(e.satisfaction+(choice?s2:s1));
  if(key==='poach'){
    const e=f.staff.find(x=>x.id===employee),r=f.rivals.find(x=>x.id===rival);
    if(e&&choice&&lawRandom(f,1,100)>e.loyalty){
      lawRemoveEmployee(f,e);
      if(r.status==='Operating')r.lawyers++;
      detail=' '+e.name+' accepted the offer.';
    } else if(e){
      e.loyalty=lawClamp(e.loyalty+(choice?1:12));detail=' '+e.name+' stayed.';
    }
  }
  if(key==='discipline'){
    f.discipline++;
    lawChange(f,'ethics',7);
    detail=' The regulator issued a formal reprimand.';
  }
  if(key==='records'){
    for(const c of lawActiveCases(f)){
      const cl=lawClient(f,c);
      cl.trust=lawClamp(cl.trust-(choice?12:2));
    }
    if(choice)f.discipline++;
  }
  if(key==='witness'||key==='ruling'){
    const c=lawActiveCases(f).find(x=>['active','trial'].includes(x.status));
    if(c){
      if(choice)c.deadline++;
      else c.evidence=lawClamp(c.evidence+6);
      lawLogCase(c,title+' '+action+'.');
    }
  }
  if(key==='visitor'||key==='class'){
    if(choice===0)lawGenerateLead(f,key==='class'&&Object.hasOwn(f.dept,'classaction')?'classaction':f.specialty);
  }
  if(key==='merger'&&!choice){
    const target=f.rivals.filter(r=>r.status==='Operating').sort((a,b)=>a.cash-b.cash)[0];
    if(target){target.diligenceUntil=f.clock+4;detail=' A temporary integration discount is available in Competitors.';}
  }
  if(key==='economy')f.market=lawClamp(f.market+(choice?5:3));
  if(key==='network')lawChange(f,'influence',choice?3:7);
  f.crisis=null;
  const result=action+'.'+detail;
  lawTouch(f,result);
  return result;
}

function lawHireEmployee(f,e) {
  if(!e||f.staff.length>=lawStaffLimit(f))return 'The firm needs an open workstation.';
  const source=f.rivals.find(r=>r.id===e.source);
  if(source&&source.status!=='Operating')return 'This candidate is no longer available through the rival firm.';
  if(f.cash<Math.round(e.salary/6))return 'Keep at least two months of the offered salary on hand.';
  if(lawRandom(f,1,100)>Math.min(98,(source?54:72)+f.reputation*.35)){
    f.candidates=f.candidates.filter(x=>x.id!==e.id);
    return e.name+' declined the offer.';
  }
  f.staff.push(e);
  f.candidates=f.candidates.filter(x=>x.id!==e.id);
  if(source)source.lawyers=Math.max(0,source.lawyers-1);
  return e.name+' joined the firm as '+e.role.toLowerCase()+'.';
}
function lawEmployeeAction(f,e,action) {
  if(!e)return '';
  const raise=Math.round(e.salary*.10);
  const bonus=Math.round(e.salary*.035);
  if(action==='release'){
    if(e.shares)return 'Buy out the partner’s stake before ending their employment.';
    const amount=Math.round(e.salary/12);
    if(f.cash<amount)return 'The firm cannot cover severance.';
    lawPost(f,'expense','Severance',-amount);
    lawRemoveEmployee(f,e);
    return e.name+' left the firm.';
  }
  if(action==='raise'){
    e.salary+=raise;
    e.loyalty=lawClamp(e.loyalty+8);
    e.satisfaction=lawClamp(e.satisfaction+10);
    if(e.request==='Raise')e.request='';
    return e.name+' received a salary increase.';
  }
  if(action==='bonus'){
    if(e.bonus)return 'This employee already has a bonus scheduled this month.';
    if(f.cash<bonus)return 'The firm cannot cover a bonus.';
    e.bonus=bonus;
    e.satisfaction=lawClamp(e.satisfaction+6);
    return 'A bonus for '+e.name+' was added to this month’s payroll.';
  }
  if(action==='train'){
    const issue=lawSpend(f,null,9,Math.round(650*f.scale));
    if(issue)return issue;
    e.skill=lawClamp(e.skill+5);
    e.performance=lawClamp(e.performance+4);
    e.stress=lawClamp(e.stress+3);
    return e.name+' completed professional training.';
  }
  if(action==='promote'&&e.role==='Associate'){
    if(e.skill<65||e.exp<5)return 'Promotion requires five years of experience and legal skill of at least 65.';
    e.role='Senior attorney';
    e.salary=Math.max(e.salary,Math.round(LAW_ROLES[e.role]*f.scale));
    e.satisfaction=lawClamp(e.satisfaction+9);
    e.request='';
    return e.name+' was promoted to senior attorney.';
  }
  if(action==='delegate'){
    e.bond=lawClamp(e.bond+8);e.stress=lawClamp(e.stress-9);
    return e.name+' reviewed their assignments and workload with you.';
  }
  return '';
}
function lawAssign(f,c,e,task) {
  if(!c||!e||['lead','closed'].includes(c.status))return '';
  if(task==='remove'){
    c.assigned=c.assigned.filter(id=>id!==e.id);
    delete c.tasks?.[e.id];
    return e.name+' was removed from the matter.';
  }
  if(!['Research','Evidence review','Client liaison','Hearing counsel'].includes(task))return '';
  if(task==='Hearing counsel'&&(!LAW_ATTORNEYS.includes(e.role)||e.specialty!==c.key))return 'Hearing counsel must be an attorney in this specialty.';
  if(!c.assigned.includes(e.id))c.assigned.push(e.id);
  c.tasks??={};
  c.tasks[e.id]=task;
  return e.name+' was assigned '+task.toLowerCase()+'.';
}
function lawOpenDepartment(f,key,id) {
  const e=f.staff.find(e=>e.id===id);
  if(!LAW_PRACTICES[key]||key===f.specialty||!e||e.specialty!==key||!LAW_ATTORNEYS.includes(e.role))return 'Select an attorney who practices in that department.';
  if(Object.hasOwn(f.dept,key)){
    f.dept[key]=e.id;
    return e.name+' now leads '+LAW_PRACTICES[key].name+'.';
  }
  if(f.reputation<42)return 'A new department requires at least 42 reputation.';
  const cost=Math.round(6200*f.scale);
  if(f.cash<cost)return 'The firm cannot cover department expenses.';
  lawPost(f,'expense','Department setup',-cost);
  f.dept[key]=e.id;
  lawChange(f,'reputation',2);
  lawGenerateLead(f,key);
  return LAW_PRACTICES[key].name+' opened under '+e.name+'.';
}
function lawOfficeAction(f,office,action) {
  if(!office)return '';
  if(action==='improve'){
    const next=LAW_OFFICES[office.level+1];
    if(!next)return 'This office already has the highest facilities rating.';
    const cost=Math.round(next.rent*2*f.scale);
    if(cost>f.cash)return 'Firm cash cannot cover the facilities upgrade.';
    lawPost(f,'expense','Facilities upgrade',-cost);
    office.level++;
    office.monthly=Math.round(next.rent*f.scale*(office.owned?.31:1)*(office.place===f.home?1:1.22));
    if(office.owned)office.equity+=cost;
    lawChange(f,'reputation',next.rep);
    return 'Facilities expanded at '+office.place+'.';
  }
  const capacity=LAW_OFFICES[office.level].capacity;
  if(f.offices.length===1||lawStaffLimit(f)-capacity<f.staff.length)return 'Maintain an office and enough desks for the full team.';
  lawPost(f,'capital',office.owned?'Office sale':'Recovered lease deposit',Math.round(office.owned?office.equity*.88:office.deposit));
  f.offices=f.offices.filter(x=>x.id!==office.id);
  return 'Office closed in '+office.place+'.';
}
function lawPartnerShares(f) {return f.staff.reduce((n,e)=>n+e.shares,0);}
function lawPartnerAction(f,e,action) {
  if(!e)return '';
  if(action==='admit'){
    if(e.role!=='Senior attorney'||e.skill<72||e.loyalty<55||lawPartnerShares(f)>75)return 'Admission requires a senior attorney with skill 72, loyalty 55, and ten available ownership points.';
    e.role='Partner';e.shares=10;
    e.salary=Math.max(e.salary,Math.round(LAW_ROLES.Partner*f.scale));
    e.request='';e.loyalty=lawClamp(e.loyalty+12);
    return e.name+' was admitted with a 10% stake.';
  }
  if(!e.shares)return '';
  if(action==='shares'){
    if(lawPartnerShares(f)>80)return 'There are fewer than five ownership points available.';
    e.shares+=5;e.loyalty=lawClamp(e.loyalty+4);
    return 'Five ownership points were granted to '+e.name+'.';
  }
  if(action==='buyout'){
    const price=Math.round(lawValuation(f)*e.shares/100);
    if(f.cash<price)return 'The firm cannot fund the buyout.';
    lawPost(f,'capital','Partner buyout',-price);
    e.shares=0;e.role='Senior attorney';
    if(f.managing===e.id)f.managing=0;
    if(f.successor===e.id)f.successor=0;
    return e.name+' sold their stake for '+loc(price)+'.';
  }
  if(action==='mediate'){
    const issue=lawSpend(f,null,10,Math.round(750*f.scale));
    if(issue)return issue;
    e.bond=lawClamp(e.bond+13);e.satisfaction=lawClamp(e.satisfaction+8);e.loyalty=lawClamp(e.loyalty+7);
    return e.name+' agreed to a written plan for resolving internal disputes.';
  }
  if(['managing','successor'].includes(action)){
    const partners=f.staff.filter(e=>e.shares);
    const yes=100-lawPartnerShares(f)+partners.reduce((n,p)=>n+(p===e||lawRandom(f,1,100)<p.loyalty-p.ambition*.17?p.shares:0),0);
    f.governance.unshift(e.name+' received '+yes+'% support for '+(action==='managing'?'managing partner':'succession')+'.');
    if(yes<=50)return f.governance[0];
    f[action]=e.id;
    return f.governance[0]+' The motion passed.';
  }
  return '';
}
function lawRivalAction(f,r,action) {
  if(!r||r.status!=='Operating')return '';
  if(action==='pitch'){
    const issue=lawSpend(f,null,15,Math.round(1700*f.scale));
    if(issue)return issue;
    if(lawRandom(f,1,100)>Math.max(14,50+f.reputation-r.rep)){
      r.rep=lawClamp(r.rep+1);
      return r.name+' won the engagement.';
    }
    const c=lawGenerateLead(f,Object.hasOwn(f.dept,r.specialty)?r.specialty:f.specialty);
    c.claim=Math.round(c.claim*1.35);
    lawChange(f,'reputation',2);
    return 'The client requested a consultation with your firm.';
  }
  const merge=action==='merge';
  if(!merge&&action!=='acquire')return '';
  if(f.reputation<(merge?56:68))return 'The rival requires a stronger market reputation.';
  const price=lawRivalQuote(f,r,merge);
  if(f.cash<price)return 'The firm cannot fund this transaction.';
  if(merge&&lawPartnerShares(f)>75)return 'The merger requires ten available ownership points.';
  if(lawStaffLimit(f)-f.staff.length<1)return 'Open a workstation for the incoming attorney.';
  const issue=lawSpend(f,null,22,Math.round(2400*f.scale));
  if(issue)return issue;
  if(f.cash<price)return 'The firm covered due diligence and needs more funds to close.';
  if(lawRandom(f,1,100)>Math.min(93,45+f.reputation-r.rep/3)){
    return r.name+' rejected the proposal after due diligence.';
  }
  lawPost(f,'capital',merge?'Merger integration':'Firm acquisition',-price);
  const employee=lawMakeEmployee(f,merge?'Partner':'Senior attorney',r.specialty);
  if(merge)employee.shares=10;
  f.staff.push(employee);
  r.status=merge?'Merged into your firm':'Acquired by your firm';
  lawChange(f,'reputation',merge?6:4);
  if(Object.hasOwn(f.dept,r.specialty))lawGenerateLead(f,r.specialty);
  return r.name+' joined the firm. '+employee.name+' leads its incoming team.';
}
function lawRivalQuote(f,r,merge) {
  const base=Math.max(25000*f.scale,r.cash*(merge?.22:.62))+r.lawyers*(merge?2300:6000)*f.scale;
  return Math.round(base*(r.diligenceUntil>f.clock?.85:1));
}
function lawPublicity(f,action) {
  const options={
    interview:[48,6,1600,'A local broadcast interviewed you about the practice of law.'],
    speech:[42,4,800,'You spoke at a professional association event.'],
    article:[38,3,400,'A legal journal published your commentary.'],
    award:[65,10,1200,'The bar association awarded you a professional service honor.']
  };
  const row=options[action];
  if(!row||f.reputation<row[0]||f.monthPublicity===f.clock||action==='award'&&f.award)return '';
  const issue=lawSpend(f,null,11,Math.round(row[2]*f.scale));
  if(issue)return issue;
  f.monthPublicity=f.clock;
  if(action==='award')f.award=true;
  lawChange(f,'publicity',row[1]);lawChange(f,'influence',Math.ceil(row[1]/2));
  if(f.publicity>=48&&lawRandom(f,1,100)<=40){
    const c=lawGenerateLead(f,Object.hasOwn(f.dept,'entertainment')?'entertainment':f.specialty);
    const client=lawClient(f,c);
    if(client.type==='Individual'||client.type==='Family')client.type='Celebrity';
  }
  lawTouch(f,row[3]);
  return row[3];
}

function lawValidateSave(life) {
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const count=x=>Number.isSafeInteger(x)&&x>=0;
  const practice=key=>Object.hasOwn(LAW_PRACTICES,key);
  const setup=life.lawFirmSetup;
  if(setup!=null&&(!object(setup)||!count(setup.age)||typeof setup.employer!=='string'||setup.focus!=null&&!practice(setup.focus)))throw Error('Invalid law firm setup.');
  if(life.lawFirmPrompt!=null&&life.lawFirmPrompt!=='confirm')throw Error('Invalid law firm confirmation.');
  const f=life.lawFirm;
  if(f==null){
    if(life.job?.firmOwner)throw Error('Law firm ownership requires saved firm data.');
    return;
  }
  if(!object(f)||f.version!==1||typeof f.name!=='string'||!f.name.trim()||f.name.length>60||!practice(f.specialty)||
    !['active','Closed'].includes(f.status)&&(typeof f.status!=='string'||!f.status.startsWith('Succeeded by '))||
    !Number.isFinite(f.cash)||!Number.isFinite(f.scale)||f.scale<=0||
    !['clock','serial','seed','startAge','lastAge','debt','hours'].every(key=>count(f[key]))||
    !['reputation','ethics','skill','influence','publicity','market'].every(key=>count(f[key])&&f[key]<=100)){
    throw Error('Invalid law firm accounts or timeline.');
  }
  const lists=['places','domestic','staff','candidates','clients','cases','offices','rivals','news','reports','ledger','seenEvents','governance'];
  if(lists.some(k=>!Array.isArray(f[k]))||!object(f.dept)||!object(f.period)||!Object.hasOwn(f.dept,f.specialty))throw Error('Incomplete law firm records.');
  const records=['staff','candidates','clients','cases','offices','rivals'].flatMap(k=>f[k]);
  if(records.some(r=>!object(r)||!count(r.id)||r.id>f.serial)||new Set(records.map(r=>r.id)).size!==records.length)throw Error('Invalid law firm record identifiers.');
  const staff=f.staff.concat(f.candidates);
  if(staff.some(e=>!Object.hasOwn(LAW_ROLES,e.role)||!practice(e.specialty)||!count(e.salary)||!count(e.shares))||
    Object.entries(f.dept).some(([key,id])=>!practice(key)||!count(id)||id!==0&&!f.staff.some(e=>e.id===id&&e.specialty===key))||
    f.offices.some(o=>!count(o.level)||!LAW_OFFICES[o.level]||!count(o.monthly)||!f.places.includes(o.place))||
    f.rivals.some(r=>!practice(r.specialty)||typeof r.status!=='string')){
    throw Error('Invalid law firm staffing or offices.');
  }
  const statuses=['lead','active','waiting','trial','appealable','appeal','closed'];
  const clients=new Set(f.clients.map(c=>c.id));
  const cases=new Set(f.cases.map(c=>c.id));
  if(f.cases.some(c=>!practice(c.key)||!statuses.includes(c.status)||!clients.has(c.client)||!Array.isArray(c.route)||
    c.route.some(key=>!Object.hasOwn(LAW_STAGES,key))||!count(c.step)||c.step>c.route.length||
    !Array.isArray(c.assigned)||!Array.isArray(c.history)||!count(c.deposit)||!count(c.billed))||
    f.clients.some(c=>!Array.isArray(c.invoices)||c.invoices.some(i=>!object(i)||!cases.has(i.caseId)||!count(i.amount)))){
    throw Error('Invalid law firm case or client records.');
  }
  if(f.crisis!=null&&(!object(f.crisis)||!['malpractice','discipline','poach',...LAW_EVENTS.map(e=>e[0])].includes(f.crisis.key)||
    f.crisis.key==='poach'&&!f.rivals.some(r=>r.id===f.crisis.rival)))throw Error('Invalid law firm incident.');
  if(f.receipt!=null&&(!object(f.receipt)||typeof f.receipt.title!=='string'||f.receipt.changes!=null&&!Array.isArray(f.receipt.changes)))throw Error('Invalid law firm decision.');
}
