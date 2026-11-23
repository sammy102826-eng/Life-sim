const clinicClamp = n => Math.round(Math.max(0,Math.min(100,n)));
const clinicHas = (catalog,key) => Object.hasOwn(catalog,key);
const clinicFind = (list,id) => list.find(x=>x.id===id);
const clinicId = p => ++p.serial;
function clinicRandom(p,a,b){
  p.seed=(Math.imul(p.seed,1664525)+1013904223)>>>0;
  return a+Math.floor(p.seed/4294967296*(b-a+1));
}
const clinicPick=(p,list)=>list[clinicRandom(p,0,list.length-1)];
const clinicName=p=>clinicPick(p,PRACTICE_NAMES)+' '+clinicPick(p,PRACTICE_SURNAMES);
const clinicCost=(p,n)=>Math.round(p.scale*n);
const clinicMoney=n=>loc(Math.round(n||0));
function clinicEntry(p,x,label,amount,kind){
  amount=Math.round(amount);
  if(!amount)return;
  p.cash+=amount;
  if(kind==='income'||kind==='expense'){
    const target=amount>0?'income':'expense';
    p.period[target]+=Math.abs(amount);
    if(x)x.period[target]+=Math.abs(amount);
  }
  p.ledger.unshift({age:p.year,site:x?.id||0,label,amount});
  if(p.ledger.length>125)p.ledger.pop();
}
const clinicStaffAt=(p,x)=>p.staff.filter(e=>e.site===x.id);
const clinicPatientsAt=(p,x)=>p.patients.filter(e=>e.site===x.id);
const clinicCount=(p,x,role)=>clinicStaffAt(p,x).filter(e=>e.role===role).length;
const clinicManager=(p,x)=>clinicStaffAt(p,x).find(e=>e.role==='Manager');
const clinicReady=(p,x)=>x.primary||!!clinicManager(p,x)&&clinicCount(p,x,'Physician')>0;
const clinicPanelLimit=(p,x)=>PRACTICE_BUILDINGS[x.level].panel;
const clinicHours=(p,x)=>clinicReady(p,x)?(x.primary?190:85)+clinicCount(p,x,'Physician')*150+clinicCount(p,x,'Nurse')*35:0;
const clinicLocationCost=(p,level,city)=>clinicCost(p,PRACTICE_BUILDINGS[level].price*(city===p.home?1:1.14));
function clinicRecord(p,text){
  p.history.unshift({age:p.year,text});
  if(p.history.length>55)p.history.pop();
}
function clinicChange(p,rep,quality,respect,x=null){
  p.reputation=clinicClamp(p.reputation+rep);
  p.quality=clinicClamp(p.quality+(quality>0?Math.max(1,Math.round(quality*talentFactor('medicine'))):quality));
  p.respect=clinicClamp(p.respect+respect);
  if(x)x.popularity=clinicClamp(x.popularity+rep);
}
function clinicNew({name,specialty,age,capital,scale,home,country,cities,skill,seed}){
  const fees=Object.fromEntries(Object.entries(PRACTICE_VISITS).map(([k,v])=>[k,clinicCost({scale},v[1])]));
  fees.specialty=clinicCost({scale},PRACTICE_SPECIALTIES[specialty][2]);
  return {version:1,status:'active',name,specialty,year:age,opened:age,serial:0,seed,scale,home,country,cities,
    reputation:36,quality:skill,respect:58,cash:capital,debt:0,fees,period:{income:0,expense:0},networks:{civic:true,bridge:false,summit:false},
    sites:[],staff:[],patients:[],leads:[],visits:[],claims:[],reports:[],ledger:[],history:[],incidents:[],seen:[],plan:null,
    flags:{},transfers:0,served:0};
}
function clinicOpenSite(p,level,city){
  if(!PRACTICE_BUILDINGS[level]||!p.cities.includes(city)||p.sites.some(x=>x.city===city))return 'Choose an available building in a different city.';
  if(p.sites.length&&p.reputation<44)return 'Expansion requires a practice reputation of 44.';
  const price=clinicLocationCost(p,level,city),setup=clinicCost(p,level===0?8500:18000+level*9000);
  if(p.cash<price+setup)return 'The practice needs enough cash for the property and setup.';
  const x={id:clinicId(p),city,level,primary:!p.sites.length,equity:price,hours:0,popularity:37,visits:0,lastVisits:0,lastProfit:0,period:{income:0,expense:0}};
  p.sites.push(x);
  if(p.sites.length>1)p.flags.expanded=true;
  clinicEntry(p,x,'Purchase of premises',-price,'capital');
  clinicEntry(p,x,'Site setup and equipment',-setup,'expense');
  clinicChange(p,x.primary?0:3,0,0,x);
  clinicFillLeads(p,x);
  return x;
}
function clinicFillLeads(p,x){
  const available=clinicPanelLimit(p,x)-clinicPatientsAt(p,x).length;
  const n=Math.min(available,Math.max(10,Math.round((x.popularity+p.reputation)/3)));
  const existing=p.leads.filter(q=>q.site===x.id).length;
  for(let i=existing;i<n;i++){
    const age=clinicRandom(p,8,79);
    const type=clinicPick(p,['routine','routine','follow-up','urgent','specialty']);
    const cover=clinicPick(p,['civic','civic','bridge','summit','self','self',p.plan?'plan':'self']);
    p.leads.push({id:clinicId(p),site:x.id,name:clinicName(p),age,cover,budget:clinicRandom(p,20,100),
      trust:clinicRandom(p,48,72),type,balance:0,enrolled:null,deferred:0,outreach:-1});
  }
}
function clinicAccept(p,x,q){
  if(!clinicReady(p,x))return 'Appoint a location manager and physician before enrolling patients.';
  if(clinicPatientsAt(p,x).length>=clinicPanelLimit(p,x))return 'The permanent patient panel is full.';
  p.leads=p.leads.filter(n=>n.id!==q.id);
  p.patients.push(q);
  if(q.cover==='plan'){
    q.cover='self';
    if(p.plan?.tiers[0])clinicEnrollPlan(p,q,0);
  }
  clinicSchedule(p,x,q,q.type==='specialty'?'specialty':q.type==='urgent'?'consult':'checkup');
  return '';
}
function clinicSchedule(p,x,q,kind){
  if(!clinicReady(p,x)||!clinicVisitDef(p,kind)||q.site!==x.id||p.visits.some(v=>v.patient===q.id&&v.status==='booked'))return false;
  if(q.bookedAge===p.year&&(q.bookedCount||0)>=3)return false;
  if(q.bookedAge!==p.year){q.bookedAge=p.year;q.bookedCount=0;}
  q.bookedCount++;
  const v={id:clinicId(p),site:x.id,patient:q.id,kind,status:'booked',age:p.year};
  p.visits.push(v);
  return true;
}
function clinicVisitDef(p,kind){
  if(kind==='specialty'){
    if(!clinicHas(p.fees,kind))return PRACTICE_VISITS.assess;
    const specialty=PRACTICE_SPECIALTIES[p.specialty];
    return [specialty[1],specialty[2],65,2,0];
  }
  return clinicHas(PRACTICE_VISITS,kind)?PRACTICE_VISITS[kind]:null;
}
function clinicQuote(p,q,kind){
  const key=kind==='specialty'&&!p.fees.specialty?'assess':kind;
  const list=p.fees[key];
  const external=p.networks[q.cover]&&PRACTICE_NETWORKS[q.cover];
  if(external){
    const rate=external.allowance-(q.cover==='civic'&&p.flags.accessAge===p.year?7:0);
    const total=Math.round(list*rate/100), claim=Math.round(total*external.coverage/100);
    return {list,total,claim,patient:total-claim,payer:q.cover,delay:external.delay};
  }
  const tier=q.enrolled==null?null:q.planTerms;
  if(tier?.services.includes(kind)&&q.planPaidAge===p.year){
    const claim=Math.min(p.plan.reserve,Math.round(list*tier.coverage/100));
    return {list,total:list,claim,patient:list-claim,payer:'plan',delay:0};
  }
  return {list,total:list,claim:0,patient:list,payer:'self',delay:0};
}
function clinicBill(p,x,q,quote,collected,writeoff){
  if(quote.claim){
    if(quote.payer==='plan'){
      p.plan.reserve-=quote.claim;p.plan.paid+=quote.claim;
      clinicEntry(p,x,'In-house plan paid claim',quote.claim,'income');
    } else if(quote.delay){
      p.claims.push({id:clinicId(p),site:x.id,payer:quote.payer,amount:quote.claim,due:p.year+quote.delay});
    } else clinicEntry(p,x,'Insurance reimbursement',quote.claim,'income');
  }
  q.balance+=quote.patient-collected-writeoff;
  clinicEntry(p,x,'Patient payments',collected,'income');
}
function clinicCanTreat(p,x,kind){
  const [, , ,hours,facility]=clinicVisitDef(p,kind);
  if(!clinicReady(p,x))return 'The location needs a manager and physician before appointments can proceed.';
  if(facility>x.level||facility===1&&!clinicCount(p,x,'Nurse')||facility===2&&(!clinicCount(p,x,'Nurse')||!clinicCount(p,x,'Surgical coordinator')||!clinicCount(p,x,'Physician')))return 'This visit requires the appropriate premises and clinical team. You can refer it out.';
  if(kind==='surgery'&&(p.specialty!=='orthopedics'||p.quality<69||(p.flags.restrictedThrough??-1)>=p.year))return 'Surgery requires a qualified orthopedic team, quality of care at least 69, and current authorization.';
  if(x.hours+hours>clinicHours(p,x))return 'This location has filled its available appointments for the year.';
  return '';
}
function clinicVisit(p,x,q,v,choice){
  if(v.status!=='booked'||v.age!==p.year)return '';
  if(choice==='refer'){
    v.status='referred';q.trust=clinicClamp(q.trust+2);
    clinicRecord(p,'A patient accepted a referral from '+x.city+'.');
    return 'A referral was arranged. The practice issued no charge.';
  }
  if(!['charge','plan','aid'].includes(choice))return '';
  const issue=clinicCanTreat(p,x,v.kind);
  if(issue)return issue;
  const [label, ,base,hours]=clinicVisitDef(p,v.kind);
  const cost=clinicCost(p,base);
  if(p.cash<cost)return 'Operating cash cannot cover this appointment.';
  const quote=clinicQuote(p,q,v.kind), capacity=clinicCost(p,q.budget*3);
  let paid=quote.patient,writeoff=0;
  if(choice==='charge'&&paid>capacity){
    v.status='deferred';q.deferred++;q.trust=clinicClamp(q.trust-8);
    clinicChange(p,-1,0,-1,x);
    if(q.deferred>=2)clinicRaiseIncident(p,'missed',x,q);
    return 'The patient could not afford the quoted amount and postponed the appointment. You can invite them back with a payment plan or discount.';
  }
  if(choice==='plan')paid=Math.min(paid,capacity,Math.round(paid*.35));
  if(choice==='aid'){paid=Math.min(paid,capacity,Math.round(paid*.44));writeoff=quote.patient-paid;}
  x.hours+=hours;x.visits++;p.served++;
  clinicEntry(p,x,'Appointment supplies and services',-cost,'expense');
  clinicBill(p,x,q,quote,paid,writeoff);
  v.status='completed';v.paid=paid;v.insurance=quote.claim;v.writeoff=writeoff;
  q.trust=clinicClamp(q.trust+(choice==='charge'?3:7));
  if(q.deferred)q.deferred--;
  if(['procedure','surgery'].includes(v.kind)&&clinicRandom(p,1,100)>Math.min(98,79+p.quality*.17+clinicCount(p,x,'Nurse')*2)){
    q.trust=clinicClamp(q.trust-9);
    clinicChange(p,-2,-3,-1,x);
    clinicRaiseIncident(p,'outcome',x,q);
  }
  if(p.served%5===0)clinicChange(p,1,1,1,x);
  if(p.served%8===0)clinicRaiseIncident(p,clinicPick(p,['feedback','shortage','staffing','claim']),x,q);
  return label+' completed. Patient paid '+clinicMoney(paid)+'. '+(quote.claim?clinicMoney(quote.claim)+' covered by the payer'+(quote.delay?' and due next year.':'.'):'no payer contribution.')+(writeoff?' The clinic forgave '+clinicMoney(writeoff)+'.':quote.patient>paid?' The remaining patient balance is '+clinicMoney(quote.patient-paid)+'.':'');
}

function clinicHire(p,x,role){
  const building=PRACTICE_BUILDINGS[x.level], team=clinicStaffAt(p,x);
  if(!clinicHas(PRACTICE_ROLES,role)||team.length>=building.count||clinicCount(p,x,role)>=(building.slots[role]||0))return 'This building has no opening for that position.';
  const salary=clinicCost(p,PRACTICE_ROLES[role]);
  if(p.cash<Math.round(salary/4))return 'Keep at least three months of salary on hand before hiring.';
  const e={id:clinicId(p),name:clinicName(p),site:x.id,role,salary,skill:clinicRandom(p,47,83),morale:70,age:clinicRandom(p,25,58)};
  const fee=Math.round(salary*.025);
  clinicEntry(p,x,'Recruitment and onboarding',-fee,'expense');
  p.staff.push(e);
  clinicRecord(p,e.name+' joined the '+x.city+' practice as '+role.toLowerCase()+'.');
  return e.name+' accepted the position at '+clinicMoney(salary)+' per year.';
}
function clinicFire(p,x,e){
  if(e.site!==x.id)return '';
  const cost=Math.round(e.salary/12);
  if(p.cash<cost)return 'The practice cannot cover severance.';
  clinicEntry(p,x,'Staff severance',-cost,'expense');
  p.staff=p.staff.filter(n=>n.id!==e.id);
  return e.name+' left the practice.'+(clinicReady(p,x)?'':' Appointments are paused pending a replacement manager or physician.');
}
function clinicImproveSite(p,x){
  const level=x.level+1;
  if(!PRACTICE_BUILDINGS[level])return 'This building already supports the highest service level.';
  if(p.reputation<35+level*10)return 'Build more local demand and reputation before expanding.';
  const equity=clinicLocationCost(p,level,x.city),cost=Math.round(equity-x.equity);
  if(p.cash<cost)return 'The practice cannot cover the premises upgrade.';
  clinicEntry(p,x,'Building expansion',-cost,'capital');
  x.equity=equity;x.level=level;
  clinicChange(p,3,1,2,x);
  clinicFillLeads(p,x);
  return x.city+' now has a '+PRACTICE_BUILDINGS[level].name.toLowerCase()+'.';
}
function clinicSaleQuote(p,x){
  const payroll=clinicStaffAt(p,x).reduce((n,e)=>n+Math.round(e.salary/12),0);
  const proceeds=Math.round(x.equity*(.79+x.popularity/450));
  return {proceeds,payroll};
}
function clinicSell(p,x){
  if(x.primary)return 'The original location is sold when the practice winds down.';
  const home=p.sites.find(n=>n.primary),people=clinicPatientsAt(p,x),quote=clinicSaleQuote(p,x);
  const room=clinicPanelLimit(p,home)-clinicPatientsAt(p,home).length;
  for(const [i,q] of people.entries()){
    if(i<room){q.site=home.id;q.trust=clinicClamp(q.trust-4);}
    else{p.patients=p.patients.filter(n=>n.id!==q.id);p.transfers++;}
  }
  p.claims.forEach(q=>{if(q.site===x.id)q.site=0;});
  p.visits=p.visits.filter(v=>v.site!==x.id);
  p.leads=p.leads.filter(q=>q.site!==x.id);
  p.staff=p.staff.filter(e=>e.site!==x.id);
  clinicEntry(p,x,'Sale of clinic premises',quote.proceeds,'capital');
  clinicEntry(p,x,'Closing severance',-quote.payroll,'expense');
  p.sites=p.sites.filter(n=>n.id!==x.id);
  clinicRecord(p,x.city+' closed. Patients received continuity arrangements and the building was sold.');
  return x.city+' closed. Net sale proceeds '+clinicMoney(quote.proceeds-quote.payroll)+'. Patients were transferred or referred out.';
}
function clinicCreatePlan(p){
  if(p.plan)return 'The in-house plan is already active.';
  if(p.sites.every(x=>x.level<1)||p.patients.length<90||p.reputation<57)return 'The plan requires a community clinic, 90 permanent patients and reputation 57.';
  const capital=clinicCost(p,55000);
  if(p.cash<capital)return 'The plan requires '+clinicMoney(capital)+' in initial claim reserves.';
  clinicEntry(p,null,'In-house plan reserve transfer',-capital,'capital');
  p.plan={name:p.name+' Health Plan',reserve:capital,tiers:[null,null,null],collected:0,paid:0};
  return 'The plan was funded. Configure at least one tier before enrolling patients.';
}
function clinicConfigTier(p,index,premium,coverage,scope){
  if(!p.plan||![0,1,2].includes(index)||![300,480,720,960,1320,1800].includes(premium)||![40,55,70,80,90].includes(coverage))return '';
  const services={
    routine:['checkup','consult','counsel'],
    specialty:['checkup','consult','counsel','assess','specialty'],
    extended:['checkup','consult','counsel','assess','specialty','procedure','surgery']
  };
  const covered=Array.isArray(scope)?[...new Set(scope)]:services[scope];
  if(!Array.isArray(covered)||!covered.length||covered.some(key=>!clinicVisitDef(p,key)))return 'Choose at least one valid covered service.';
  const tier={name:PRACTICE_TIER_LABELS[index],premium:clinicCost(p,premium),coverage,services:covered};
  p.plan.tiers[index]=tier;
  return tier.name+' terms saved. Existing members keep their current-year terms. Renewals use the new terms.';
}
function clinicEnrollPlan(p,q,index){
  const tier=p.plan?.tiers[index];
  if(!tier)return 'Select a configured insurance tier.';
  if(q.planPaidAge===p.year){
    q.pendingTier=index;
    return tier.name+' was queued for the patient’s next renewal. The current-year contract remains in effect.';
  }
  if(tier.premium>clinicCost(p,q.budget*24))return 'The patient declined the premium. They kept their current coverage.';
  q.enrolled=index;q.planPaidAge=p.year;q.planTerms={...tier,services:[...tier.services]};q.previousCover=q.cover;q.cover='plan';
  p.plan.reserve+=tier.premium;p.plan.collected+=tier.premium;
  q.trust=clinicClamp(q.trust+4);
  return q.name+' enrolled in '+tier.name+'. The premium went into the plan reserve.';
}
function clinicRenew(p,q){
  if(q.enrolled==null)return;
  const index=q.pendingTier??q.enrolled;
  const tier=p.plan?.tiers[index];
  q.pendingTier=null;
  if(!tier||tier.premium>clinicCost(p,q.budget*24)||q.trust<34){
    q.enrolled=null;q.cover=q.previousCover||'self';q.planTerms=null;
    return;
  }
  q.enrolled=index;q.planPaidAge=p.year;q.planTerms={...tier,services:[...tier.services]};
  p.plan.reserve+=tier.premium;p.plan.collected+=tier.premium;
}
function clinicRaiseIncident(p,key,x,q){
  const data=PRACTICE_INCIDENTS[key];
  if(!data||p.incidents.some(n=>n.key===key&&!n.closed)||p.seen.includes(key)&&p.seen.length<Object.keys(PRACTICE_INCIDENTS).length)return;
  if(p.incidents.filter(n=>!n.closed).length>=6)return;
  if(p.seen.length>=Object.keys(PRACTICE_INCIDENTS).length)p.seen=[];
  p.seen.push(key);
  const incident={id:clinicId(p),key,site:x?.id||0,patient:q?.id||0,age:p.year,closed:false,story:null};
  p.incidents.push(incident);
  if(data.public&&g.practice===p)incident.story=newsPublish('health',data.title,p.name+' is involved in a public healthcare decision in '+(x?.city||p.home)+'.',{type:'practice',ref:incident.id});
  clinicRecord(p,data.title+'.');
}
function clinicRespond(p,incident,index){
  const data=PRACTICE_INCIDENTS[incident?.key],choice=data?.options[index];
  if(!choice||incident.closed)return {done:false,text:'This decision is no longer open.'};
  const [label,base,rep,quality,respect,summary]=choice;
  const cost=clinicCost(p,base),x=clinicFind(p.sites,incident.site),q=clinicFind(p.patients,incident.patient);
  if(p.cash<cost)return {done:false,text:'The clinic cannot fund this response. Add operating cash and reopen the decision.'};
  clinicEntry(p,x,label,-cost,'expense');
  clinicChange(p,rep,quality,respect,x);
  if(q)q.trust=clinicClamp(q.trust+(index===0?8:3));
  if(q&&index===1&&['missed','feedback','outcome'].includes(incident.key)){
    p.patients=p.patients.filter(a=>a.id!==q.id);
    p.visits=p.visits.filter(v=>v.patient!==q.id);
    p.transfers++;
  }
  if(incident.key==='access'&&index===0&&x){x.popularity=clinicClamp(x.popularity+12);clinicFillLeads(p,x);}
  if(incident.key==='privacy'&&index===1)p.flags.restrictedThrough=p.year+1;
  if(incident.key==='audit'&&index===1)p.flags.restrictedThrough=p.year;
  if(incident.key==='payer'&&index===0){p.networks.civic=true;p.flags.accessAge=p.year;}
  if(incident.key==='staffing'&&x)x.hours=Math.min(clinicHours(p,x),x.hours+(index===0?10:4));
  if(incident.key==='recovery')for(const employee of p.staff)employee.morale=clinicClamp(employee.morale+4);
  if(incident.key==='claim'){
    if(index===1)p.claims=p.claims.filter(c=>c.site!==incident.site);
    else for(const claim of p.claims.filter(c=>c.site===incident.site))claim.due=p.year;
  }
  incident.closed=true;
  clinicRecord(p,summary);
  return {done:true,text:summary+' Cost '+clinicMoney(cost)+'.'};
}
function clinicCollectClaims(p,year){
  for(const c of p.claims.filter(c=>c.due<=year)){
    const x=clinicFind(p.sites,c.site);
    clinicEntry(p,x,'Collected '+PRACTICE_NETWORKS[c.payer].name+' claims',c.amount,'income');
  }
  p.claims=p.claims.filter(c=>c.due>year);
}
function clinicRoutineYear(p,x){
  if(!clinicReady(p,x))return;
  for(const q of clinicPatientsAt(p,x)){
    const scheduled=p.visits.find(v=>v.patient===q.id&&v.status==='booked');
    if(scheduled){
      scheduled.status='expired';
      q.trust=clinicClamp(q.trust-5);
    }
    const n=clinicRandom(p,1,4), paidVisits=Math.min(n,clinicHours(p,x)-x.hours);
    if(paidVisits<=0){q.trust=clinicClamp(q.trust-2);continue;}
    for(let i=0;i<paidVisits;i++){
      const kind=i===0?'checkup':i===1&&q.type==='specialty'?'specialty':'consult';
      const quote=clinicQuote(p,q,kind), allowed=clinicCost(p,q.budget*3);
      if(quote.patient>2*allowed&&clinicRandom(p,1,100)>q.trust){q.deferred++;continue;}
      const paid=Math.min(quote.patient,allowed);
      x.hours++;x.visits++;p.served++;
      clinicEntry(p,x,'Routine panel services',-clinicCost(p,clinicVisitDef(p,kind)[2]),'expense');
      clinicBill(p,x,q,quote,paid,quote.patient-paid);
    }
    if(q.balance&&clinicRandom(p,1,100)<35+q.trust*.3){
      const amount=Math.min(q.balance,clinicCost(p,q.budget*2));
      q.balance-=amount;
      clinicEntry(p,x,'Patient payment plan installment',amount,'income');
    }
  }
}
function clinicCommunityWork(p,x){
  if(!clinicReady(p,x))return;
  const priceRatio=(p.fees.checkup+p.fees.consult)/clinicCost(p,PRACTICE_VISITS.checkup[1]+PRACTICE_VISITS.consult[1]);
  const demand=Math.min(1.4,Math.max(.40,(1.52-priceRatio*.52)*(.68+p.reputation/130)));
  const providers=clinicCount(p,x,'Physician')+Number(x.primary);
  const support=clinicCount(p,x,'Nurse')*170+clinicCount(p,x,'Receptionist')*110;
  const organization=clinicManager(p,x)?.skill||60;
  const volume=Math.max(0,Math.round((providers*(750+x.popularity*25)+support)*demand*(.88+organization/500)*clinicRandom(p,93,107)/100));
  const fee=Math.round(p.fees.checkup*.55+p.fees.consult*.45);
  const networks=Object.keys(PRACTICE_NETWORKS).filter(k=>p.networks[k]);
  const insuranceShare=networks.length?Math.min(.84,.47+networks.length*.12):0;
  const grouped=Math.round(volume*insuranceShare);
  const uninsured=volume-grouped;
  clinicEntry(p,x,'Community self-pay visits',Math.round(uninsured*fee*.76),'income');
  for(const [index,key] of networks.entries()){
    const n=Math.floor(grouped/networks.length)+(index<grouped%networks.length?1:0);
    const contract=PRACTICE_NETWORKS[key],rate=contract.allowance-(key==='civic'&&p.flags.accessAge===p.year?7:0);
    const allowed=Math.round(n*fee*rate/100),insurer=Math.round(allowed*contract.coverage/100);
    clinicEntry(p,x,'Community copayments',Math.round((allowed-insurer)*.95),'income');
    if(contract.delay&&!clinicCount(p,x,'Billing specialist')&&insurer){
      p.claims.push({id:clinicId(p),site:x.id,payer:key,amount:insurer,due:p.year+contract.delay});
    } else clinicEntry(p,x,'Community insurance claims',insurer,'income');
  }
  clinicEntry(p,x,'Community visit operating costs',clinicCost(p,volume*31),'expense');
  x.visits+=volume;
  p.served+=volume;
}
function clinicYear(p,nextAge){
  if(p.year===nextAge)return;
  clinicCollectClaims(p,p.year);
  for(const x of p.sites){
    clinicRoutineYear(p,x);
    clinicCommunityWork(p,x);
    clinicEntry(p,x,'Annual building maintenance',-clinicCost(p,PRACTICE_BUILDINGS[x.level].maintenance),'expense');
    clinicEntry(p,x,'Annual payroll',-clinicStaffAt(p,x).reduce((n,e)=>n+e.salary,0),'expense');
    x.lastVisits=x.visits;x.lastProfit=x.period.income-x.period.expense;
    x.popularity=clinicClamp(x.popularity+(x.lastVisits>=16?3:x.lastVisits?0:-3));
    x.period={income:0,expense:0};x.visits=0;x.hours=0;
  }
  if(p.debt){
    const interest=Math.round(p.debt*.065),payment=Math.min(p.debt,Math.max(1,Math.round(p.debt*.07)),Math.max(0,p.cash-interest));
    clinicEntry(p,null,'Practice loan interest',-interest,'expense');
    p.debt-=payment;clinicEntry(p,null,'Practice loan principal',-payment,'capital');
  }
  p.reports.unshift({age:p.year,...p.period,cash:p.cash,debt:p.debt,sites:p.sites.map(x=>({city:x.city,visits:x.lastVisits,profit:x.lastProfit}))});
  p.period={income:0,expense:0};p.year=nextAge;
  p.reports=p.reports.slice(0,65);
  for(const v of p.visits)if(v.status==='booked'&&v.age<nextAge)v.status='expired';
  p.visits=p.visits.filter(v=>v.age>=nextAge-2);
  p.incidents=p.incidents.filter(i=>!i.closed||i.age>=nextAge-4);
  for(const e of p.staff.slice()){
    e.age++;
    e.morale=clinicClamp(e.morale+(p.cash<0?-9:3));
    if(e.morale<37&&clinicRandom(p,1,100)<28){
      p.staff=p.staff.filter(n=>n.id!==e.id);
      clinicRecord(p,e.name+' resigned from the '+clinicFind(p.sites,e.site).city+' location.');
    }
  }
  for(const q of p.patients){q.age++;clinicRenew(p,q);}
  const leaving=p.patients.filter(q=>q.trust<27);
  if(leaving.length){
    const ids=new Set(leaving.map(q=>q.id));
    p.patients=p.patients.filter(q=>!ids.has(q.id));
    p.visits=p.visits.filter(v=>!ids.has(v.patient));
    p.transfers+=leaving.length;
  }
  for(const x of p.sites){
    clinicFillLeads(p,x);
    const followups=clinicPatientsAt(p,x).filter(q=>['urgent','specialty','follow-up'].includes(q.type)).slice(0,6);
    if(clinicReady(p,x))for(const q of followups)clinicSchedule(p,x,q,q.type==='specialty'?'specialty':'checkup');
  }
  if(p.seen.length===Object.keys(PRACTICE_INCIDENTS).length||(p.year-p.opened)%7===0)p.seen=[];
  const pool=Object.keys(PRACTICE_INCIDENTS).filter(k=>PRACTICE_INCIDENTS[k].public&&!p.seen.includes(k));
  if(pool.length){
    const choose=p.quality<48&&pool.includes('audit')?'audit':clinicPick(p,pool);
    clinicRaiseIncident(p,choose,p.sites[0]);
  }
  const privatePool=Object.keys(PRACTICE_INCIDENTS).filter(k=>!PRACTICE_INCIDENTS[k].public&&!p.seen.includes(k)&&k!=='outcome')
    .filter(k=>p.patients.length||!['missed','feedback'].includes(k)).filter(k=>k!=='staffing'||p.staff.length);
  if(privatePool.length)clinicRaiseIncident(p,clinicPick(p,privatePool),p.sites[0],p.patients[0]);
  if(p.cash>=0&&p.quality>=64&&p.patients.length>=5&&p.patients.reduce((n,q)=>n+q.trust,0)/p.patients.length>=59){
    clinicChange(p,2,0,1,p.sites[0]);
  }
  if(p.cash<0){
    clinicChange(p,-2,-2,0);
    clinicRecord(p,'Cash ran short after payroll. Review funding and staffing before booking more care.');
  }
}
