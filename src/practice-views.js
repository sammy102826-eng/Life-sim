const CLINIC_PAGES={overview:'Practice overview',profile:'Doctor profile',patients:'Patients',appointments:'Appointments',prices:'Price controls',
  insurance:'Insurance',staff:'Manage staff',building:'Building',locations:'Manage locations',finances:'Finances',incidents:'Practice inbox'};
let clinicPage='overview',clinicSiteId=null,clinicPatientId=null,clinicPatientPage=0;
const clinicB=(label,action,id=0,arg='',disabled=false)=>B(label,`clinicAction('${action}',${id},'${arg}')`,disabled);
const clinicSelect=(id,label,items)=>`<label for="${id}">${label}</label><select id="${id}">${items.map(([value,text])=>`<option value="${uiEscape(value)}">${uiEscape(text)}</option>`).join('')}</select>`;
const clinicPanel=(title,html)=>`<section class="law-section"><h3>${uiEscape(title)}</h3>${html}</section>`;
const clinicStat=(label,value)=>lawMetric(label,value);
const clinicValue=id=>document.getElementById(id)?.value;
const clinicNetwork=code=>PRACTICE_NETWORKS[code]?.name||(code==='plan'?'In-house health plan':'Self-pay');
function clinicGo(page='overview',site=null,patient=null){
  if(!Object.hasOwn(CLINIC_PAGES,page))return;
  clinicPage=page;clinicSiteId=site;clinicPatientId=patient;clinicPatientPage=0;
  tab='Work';wsel='job';wsub=null;draw(1);
}
function clinicRosterPage(index){
  if(index<0||!Number.isInteger(index))return;
  clinicPatientPage=index;draw(1);
}
const clinicCurrentSite=p=>clinicFind(p.sites,clinicSiteId)||p.sites.find(x=>x.primary);
function clinicMessage(text){
  if(!text)return;
  g.result={t:'Medical practice',d:uiEscape(text)};
  draw();
}
function clinicPrompt(kind,id=null){
  if(!clinicActive()||clinicBlocked())return;
  if(kind==='sell'){
    if(!clinicFind(g.practice.sites,id)||clinicFind(g.practice.sites,id).primary)return;
    g.practicePrompt={kind,site:id};
  }else if(kind==='close')g.practicePrompt=kind;
  else return;
  draw();
}
function clinicConfirmSale(id){
  if(!clinicActive()||clinicBlocked()||g.practicePrompt?.site!==id)return;
  const p=g.practice,x=clinicFind(p.sites,id);
  if(!x||x.primary)return;
  const message=clinicSell(p,x);
  g.practicePrompt=null;clinicSiteId=null;
  pressNotice('health','A community clinic location closes',p.name+' sold its '+x.city+' building and arranged patient transfers.','property');
  clinicMessage(message);
}
function clinicAction(action,id,arg){
  if(!clinicActive()||clinicBlocked()||g.practicePrompt)return;
  const p=g.practice,x=clinicCurrentSite(p);
  const q=clinicFind(p.patients,id),v=clinicFind(p.visits,id),item=clinicFind(p.leads,id);
  let message='';
  switch(action){
    case 'accept':
      if(!item||item.site!==x.id)return;
      message=clinicAccept(p,x,item)||item.name+' joined the permanent patient panel.';
      break;
    case 'batch': {
      const applicants=p.leads.filter(l=>l.site===x.id).slice(0,12);
      let added=0,issue='';
      for(const row of applicants){
        issue=clinicAccept(p,x,row);
        if(issue)break;
        added++;
      }
      message=added?added+' patients joined the panel and received initial appointments.':issue||'There are no applicants left.';
      break;
    }
    case 'visit': {
      const patient=v&&clinicFind(p.patients,v.patient);
      if(!patient||v.site!==x.id||patient.site!==x.id)return;
      message=clinicVisit(p,x,patient,v,arg);
      break;
    }
    case 'book':
      if(!q||q.site!==x.id)return;
      message=clinicSchedule(p,x,q,clinicValue('clinic-service'))?'The appointment is booked. Open Appointments to review the price and treatment options.':'The patient already has an appointment or has reached the annual booking limit.';
      break;
    case 'balance':
      if(!q||!q.balance||q.site!==x.id||q.contacted===p.year)return;
      q.contacted=p.year;
      if(arg==='waive'){
        q.balance=0;q.trust=clinicClamp(q.trust+4);message='The clinic forgave the unpaid patient balance.';
      } else if(arg==='collect'){
        const paid=Math.min(q.balance,clinicCost(p,q.budget*2));
        q.balance-=paid;
        clinicEntry(p,x,'Patient balance payment',paid,'income');
        message='The patient paid '+clinicMoney(paid)+'. Outstanding balance '+clinicMoney(q.balance)+'.';
      }
      break;
    case 'hire':
      message=clinicHire(p,x,clinicValue('clinic-role'));
      break;
    case 'fire':{
      const employee=clinicFind(p.staff,id);
      if(employee)message=clinicFire(p,x,employee);
      break;
    }
    case 'train':{
      const employee=clinicFind(p.staff,id),cost=clinicCost(p,550);
      if(!employee||employee.site!==x.id||employee.training===p.year)return;
      if(p.cash<cost)return clinicMessage('Operating cash cannot cover training.');
      employee.skill=clinicClamp(employee.skill+5);employee.morale=clinicClamp(employee.morale+5);employee.training=p.year;
      clinicChange(p,0,1,0,x);
      clinicEntry(p,x,'Staff training',-cost,'expense');
      message=employee.name+' completed training.';
      break;
    }
    case 'prices':{
      const key=clinicValue('clinic-price-service');
      const rate=Number(clinicValue('clinic-price-rate'));
      if(!clinicHas(p.fees,key)||![50,65,80,90,100,110,125,150,175,200].includes(rate))return;
      p.fees[key]=clinicCost(p,clinicVisitDef(p,key)[1]*rate/100);
      message=clinicVisitDef(p,key)[0]+' now lists at '+clinicMoney(p.fees[key])+'. Payer allowances still apply.';
      break;
    }
    case 'network':{
      const network=PRACTICE_NETWORKS[arg];
      if(!network||p.reputation<network.minimum)return;
      if(p.flags['network '+arg]===p.year)return;
      p.flags['network '+arg]=p.year;p.networks[arg]=!p.networks[arg];
      message=network.name+(p.networks[arg]?' is now accepted.':' is now out of network. Existing claims stay in the payment queue.');
      break;
    }
    case 'newPlan':
      message=clinicCreatePlan(p);
      if(p.plan?.tiers.every(t=>t===null))pressNotice('health','Local clinic launches an in-house health plan',p.name+' set aside a reserve to fund its own coverage tiers.','practiceProfile','clinic-plan-'+p.opened);
      break;
    case 'tier':
      message=clinicConfigTier(p,Number(clinicValue('clinic-tier')),Number(clinicValue('clinic-premium')),Number(clinicValue('clinic-coverage')),[...document.querySelectorAll('[name=clinic-covered]:checked')].map(box=>box.value));
      break;
    case 'enroll':
      if(q&&q.site===x.id)message=clinicEnrollPlan(p,q,Number(clinicValue('clinic-member-tier')));
      break;
    case 'upgrade':{
      const old=x.level;
      message=clinicImproveSite(p,x);
      if(x.level!==old)pressNotice('health','Clinic expands its facilities',p.name+' expanded its building in '+x.city+'.','practiceProfile');
      break;
    }
    case 'buy':{
      const city=p.cities[Number(clinicValue('clinic-city'))],level=Number(clinicValue('clinic-build'));
      const result=clinicOpenSite(p,level,city);
      if(typeof result==='string')message=result;
      else{
        clinicSiteId=result.id;clinicPage='locations';
        message=p.name+' bought a property in '+city+'. Hire a manager and physician to open its patient panel.';
        pressNotice('health','A medical practice expands to '+city,p.name+' bought a property for a new clinic location.','practiceProfile');
      }
      break;
    }
    case 'fund':
      return clinicFund(p,arg);
    case 'education':{
      if(p.flags.training===p.year)return;
      const cost=clinicCost(p,900);
      if(p.cash<cost)return clinicMessage('Operating cash cannot cover professional training.');
      p.flags.training=p.year;clinicEntry(p,x,'Professional training',-cost,'expense');clinicChange(p,0,4,2,x);
      message='You completed continuing medical education and shared the findings with your team.';
      break;
    }
    default:return;
  }
  clinicMessage(message);
}
function clinicFund(p,action){
  const base=Number(clinicValue('clinic-funds'));
  if(![5000,20000,50000,100000,250000,500000].includes(base))return;
  const amount=clinicCost(p,base);
  if(action==='contribute'){
    if(g.cash<amount)return clinicMessage('There is not enough personal cash for that contribution.');
    g.cash-=amount;LD('Medical practice capital contribution',-amount);
    clinicEntry(p,null,'Owner contribution',amount,'capital');
    return clinicMessage('Capital transferred into the practice.');
  }
  if(action==='loan'){
    const equity=p.sites.reduce((n,x)=>n+x.equity,0);
    if(p.debt+amount>equity*.7+clinicCost(p,85000))return clinicMessage('This loan would exceed the available business credit line.');
    p.debt+=amount;p.lender=typeof finIssuer==='function'?finIssuer(g.bank.id??2):'NVB';clinicEntry(p,null,'Loan proceeds',amount,'capital');
    return clinicMessage('Business loan approved at 6.5% annual interest.');
  }
  if(action==='repay'){
    const payment=Math.min(amount,p.debt);
    if(!payment||p.cash<payment)return clinicMessage('No principal is payable from current operating cash.');
    p.debt-=payment;clinicEntry(p,null,'Extra principal repayment',-payment,'capital');
    return clinicMessage('Business principal fell by '+clinicMoney(payment)+'.');
  }
  if(action==='draw'){
    const reserve=p.sites.reduce((n,x)=>n+clinicCost(p,PRACTICE_BUILDINGS[x.level].maintenance),0)+p.staff.reduce((n,e)=>n+e.salary,0);
    if(p.cash<amount+reserve*.25)return clinicMessage('Leave at least one quarter of fixed costs in the practice.');
    clinicEntry(p,null,'Owner distribution',-amount,'capital');
    const {tax}=finOwnerDistribution(amount,'Medical practice owner distribution before tax','Medical practice distribution tax');
    return clinicMessage('Personal cash increased by '+clinicMoney(amount-tax)+' after simulated withholding.');
  }
  if(action==='reserve'){
    if(!p.plan||p.cash<amount)return clinicMessage('The practice cannot fund this reserve transfer.');
    clinicEntry(p,null,'Additional insurance reserve',-amount,'capital');
    p.plan.reserve+=amount;
    return clinicMessage(clinicMoney(amount)+' transferred to insurance claim reserves.');
  }
}
function clinicWorkMenu(p){
  const x=clinicCurrentSite(p);
  const views={overview:clinicOverview,profile:clinicProfile,patients:clinicPatientView,appointments:clinicAppointmentView,prices:clinicPrices,
    insurance:clinicInsurance,staff:clinicStaffView,building:clinicBuilding,locations:clinicLocations,finances:clinicFinances,incidents:clinicInbox};
  return `<div class="clinic-shell law-shell">${B('Back to Work',"wsel=null;wsub=null;draw(1)")}
  <header class="clinic-heading">
    ${B('<strong>'+uiEscape(p.name)+'</strong><small>Practice reputation '+p.reputation+'/100</small>',"clinicGo('overview')")}
    ${B('<strong>Dr. '+uiEscape(g.name)+'</strong><small>Respect '+p.respect+'/100 · Quality of work '+p.quality+'/100</small>',"clinicGo('profile')")}
  </header>
  <nav class="law-nav" aria-label="Medical practice sections">${Object.entries(CLINIC_PAGES).slice(2).map(([key,label])=>`<button aria-pressed="${clinicPage===key}" onclick="clinicGo('${key}',${x.id})">${key==='locations'&&!p.flags.expanded?'Become a chain':label}</button>`).join('')}</nav>
  <div class="law-page"><h2>${CLINIC_PAGES[clinicPage]}</h2>${views[clinicPage](p,x)}</div></div>`;
}
function clinicOverview(p,x){
  const waiting=p.incidents.filter(n=>!n.closed).length;
  return '<div class="law-metrics">'+clinicStat('Operating cash',clinicMoney(p.cash))+clinicStat('Permanent patients',p.patients.length)+
    clinicStat('Locations',p.sites.length)+clinicStat('Appointments this year',p.sites.reduce((n,x)=>n+x.visits,0))+'</div>'+
    clinicPanel('Current practice',`<p>${uiEscape(PRACTICE_SPECIALTIES[p.specialty][0])} · Founded at age ${p.opened} · ${uiEscape(p.home)}</p><p>Book visits for patients who need individual attention. Age Up settles payroll, maintenance, routine visits and community walk-ins and opens a new appointment year.</p>
      ${B('Review appointments',`clinicGo('appointments',${x.id})`)}${B('Open practice inbox'+(waiting?' · '+waiting+' pending':''),`clinicGo('incidents',${x.id})`)}`)+
    clinicPanel('Recent practice activity',p.history.slice(0,5).map(n=>`<p>Age ${n.age} · ${uiEscape(n.text)}</p>`).join(''));
}
function clinicProfile(p){
  return clinicPanel(PRACTICE_SPECIALTIES[p.specialty][0],Bar('Respect',p.respect,'#528a78')+Bar('Quality of work',p.quality,'#528a78')+
    `<p>${p.served} completed visits · ${p.transfers} patients referred or transferred · ${g.physicianPath?.years||0} years in your specialty before opening.</p>`+
    clinicB('Complete professional training','education',0,'',p.flags.training===p.year));
}
function clinicSiteNav(p,x,page){
  if(p.sites.length<2)return `<p class="d">${uiEscape(x.city)}</p>`;
  return '<div class="sub2">'+p.sites.map(site=>`<button class="pill${site===x?' on':''}" aria-pressed="${site===x}" onclick="clinicGo('${page}',${site.id})">${uiEscape(site.city)}</button>`).join('')+'</div>';
}
function clinicPatientView(p,x){
  const q=clinicFind(p.patients,clinicPatientId);
  if(q?.site===x.id)return clinicPatientDetail(p,x,q);
  const people=clinicPatientsAt(p,x),limit=clinicPanelLimit(p,x),leads=p.leads.filter(q=>q.site===x.id);
  const page=Math.min(clinicPatientPage,Math.max(0,Math.ceil(people.length/14)-1));
  return clinicSiteNav(p,x,'patients')+clinicPanel('Permanent patient panel',`<p>${people.length} of ${limit} spaces used.</p>`+
    (people.slice(page*14,page*14+14).map(q=>`<article class="law-item"><div><h4>${uiEscape(q.name)}</h4><p>${clinicNetwork(q.cover)} · Balance ${clinicMoney(q.balance)}</p></div>
      ${B('Review patient',`clinicGo('patients',${x.id},${q.id})`)}</article>`).join('')||'<p>No permanent patients at this location.</p>')+
    (people.length>14?`<div class="sub2">${B('Previous patients',`clinicRosterPage(${page-1})`,page===0)}${B('Next patients',`clinicRosterPage(${page+1})`,(page+1)*14>=people.length)}</div>`:''))
    +clinicPanel('Patient applicants',`<p>${leads.length} applicants are awaiting intake.</p>`+
      clinicB('Enroll up to 12 applicants','batch',0,'',!clinicReady(p,x)||people.length>=limit||!leads.length)+
      leads.map(q=>`<article class="law-item"><div><h4>${uiEscape(q.name)}</h4><p>${clinicNetwork(q.cover)} · ${uiEscape(q.type)}</p></div>
      ${clinicB('Enroll patient','accept',q.id,'',!clinicReady(p,x)||people.length>=limit)}</article>`).join(''));
}
function clinicPatientDetail(p,x,q){
  const appointments=p.visits.filter(v=>v.patient===q.id).slice(-7).reverse();
  const tiers=p.plan?.tiers.map((t,i)=>t&&[i,t.name+' · '+clinicMoney(t.premium)+' yearly']).filter(Boolean)||[];
  return B('Back to patient panel',`clinicGo('patients',${x.id})`)+clinicPanel(q.name,`<p>Age ${q.age} · ${clinicNetwork(q.cover)} · ${uiEscape(q.type)} care</p>`+
    Bar('Trust',q.trust,'#528a78')+`<p>Outstanding balance ${clinicMoney(q.balance)} · Deferred visits ${q.deferred}</p>`+
    (q.balance?clinicB('Collect an installment','balance',q.id,'collect',q.contacted===p.year)+clinicB('Forgive the balance','balance',q.id,'waive',q.contacted===p.year):'')+
    (tiers.length?clinicSelect('clinic-member-tier','In-house insurance tier',tiers)+clinicB(q.planPaidAge===p.year?'Set tier for next renewal':'Offer plan enrollment','enroll',q.id):''))+
    clinicPanel('Schedule an appointment',clinicSelect('clinic-service','Visit type',Object.keys(p.fees).map(k=>[k,clinicVisitDef(p,k)[0]]))+
    clinicB('Book selected visit','book',q.id,'',!clinicReady(p,x))+appointments.map(v=>`<p>Age ${v.age} · ${clinicVisitDef(p,v.kind)[0]} · ${v.status}</p>`).join(''));
}
function clinicAppointmentView(p,x){
  const visits=p.visits.filter(v=>v.site===x.id&&v.status==='booked'&&v.age===p.year);
  return clinicSiteNav(p,x,'appointments')+clinicPanel('Appointment schedule',`<p>${x.hours} of ${clinicHours(p,x)} appointment units used this year. Scheduling a procedure does not collect payment.</p>`+
    (visits.map(v=>{
      const q=clinicFind(p.patients,v.patient),def=clinicVisitDef(p,v.kind),quote=clinicQuote(p,q,v.kind);
      const issue=clinicCanTreat(p,x,v.kind);
      return `<details class="law-section"><summary>${uiEscape(q.name)} · ${def[0]}</summary>
      <p>Patient share ${clinicMoney(quote.patient)} · Payer share ${clinicMoney(quote.claim)}${quote.delay?' due next year':''} · Service cost ${clinicMoney(clinicCost(p,def[2]))}</p>${issue?`<p>${uiEscape(issue)}</p>`:''}
      ${clinicB('Complete and bill','visit',v.id,'charge',!!issue)}${clinicB('Complete with a payment plan','visit',v.id,'plan',!!issue)}
      ${clinicB('Complete at a reduced patient fee','visit',v.id,'aid',!!issue)}${clinicB('Refer to another provider','visit',v.id,'refer')}</details>`;
    }).join('')||'<p>No appointments are booked at this location. Book a visit from the patient’s record.</p>'));
}
function clinicPrices(p){
  const fees=Object.entries(p.fees);
  return clinicPanel('Fee schedule',fees.map(([key,amount])=>`<div class="row"><span>${clinicVisitDef(p,key)[0]}</span><strong>${clinicMoney(amount)}</strong></div>`).join('')+
    '<p>Accepted insurers apply their contracted allowances and split the resulting charge with the patient. Self-pay patients may need a payment plan or reduced fee.</p>'+
    clinicSelect('clinic-price-service','Service to reprice',fees.map(([key])=>[key,clinicVisitDef(p,key)[0]]))+
    clinicSelect('clinic-price-rate','Percentage of baseline',[50,65,80,90,100,110,125,150,175,200].map(n=>[n,n+'%']))+
    clinicB('Save service price','prices'));
}
function clinicInsurance(p){
  const plan=p.plan;
  const networks=Object.entries(PRACTICE_NETWORKS).map(([key,item])=>`<article class="law-item"><div><h4>${item.name}</h4><p>${p.networks[key]?'Accepted':'Out of network'} · Pays ${item.coverage}% of a ${item.allowance}% allowance · ${item.delay?'Next-year reimbursement':'Immediate reimbursement'}</p>
    ${p.reputation<item.minimum?`<p>Requires reputation ${item.minimum}.</p>`:''}</div>${clinicB(p.networks[key]?'Leave network':'Accept network','network',0,key,p.flags['network '+key]===p.year||p.reputation<item.minimum)}</article>`).join('');
  const planView=!plan?`<p>Launch funding requires ${clinicMoney(clinicCost(p,55000))} in separate reserves, a community clinic, 90 permanent patients and reputation 57.</p>`+clinicB('Fund an in-house insurance plan','newPlan'):
    `<div class="law-metrics">${clinicStat('Claim reserves',clinicMoney(plan.reserve))}${clinicStat('Premiums received',clinicMoney(plan.collected))}${clinicStat('Claims paid',clinicMoney(plan.paid))}</div>`+
    plan.tiers.map((t,i)=>`<p><strong>${PRACTICE_TIER_LABELS[i]}</strong> · ${t?clinicMoney(t.premium)+' yearly · '+t.coverage+'% coverage · '+t.services.map(key=>clinicVisitDef(p,key)[0]).join(', '):'Unavailable'}</p>`).join('')+
    '<p>Enroll individual members from their patient records. Premiums fund the reserve. Payments from the reserve appear on both the clinic and plan ledgers. New terms take effect for members at renewal.</p>'+
    clinicSelect('clinic-tier','Tier to configure',PRACTICE_TIER_LABELS.map((label,i)=>[i,label]))+
    clinicSelect('clinic-premium','Annual premium',[300,480,720,960,1320,1800].map(n=>[n,clinicMoney(clinicCost(p,n))]))+
    clinicSelect('clinic-coverage','Share of covered bills',[40,55,70,80,90].map(n=>[n,n+'%']))+
    `<fieldset class="clinic-coverage"><legend>Covered services</legend>${Object.keys(p.fees).map(key=>`<label for="clinic-covered-${key}"><input id="clinic-covered-${key}" name="clinic-covered" type="checkbox" value="${key}" ${['checkup','consult','counsel'].includes(key)?'checked':''}> ${clinicVisitDef(p,key)[0]}</label>`).join('')}</fieldset>`+
    clinicB('Save insurance tier terms','tier');
  return clinicPanel('Insurance networks',networks)+clinicPanel('In-house insurance',planView);
}
function clinicStaffView(p,x){
  const building=PRACTICE_BUILDINGS[x.level],staff=clinicStaffAt(p,x);
  const openings=Object.entries(building.slots).filter(([role,cap])=>clinicCount(p,x,role)<cap&&staff.length<building.count);
  return clinicSiteNav(p,x,'staff')+clinicPanel('Staff roster',`<p>${staff.length} of ${building.count} positions filled. Location manager ${uiEscape(clinicManager(p,x)?.name|| (x.primary?'Dr. '+g.name:'Vacant'))}.</p>`+
    (staff.map(e=>`<details class="law-section"><summary>${uiEscape(e.name)} · ${e.role}</summary>
      <p>Annual salary ${clinicMoney(e.salary)} · Age ${e.age} · Skill ${e.skill}/100 · Morale ${e.morale}/100</p>
      ${clinicB('Fund staff training','train',e.id,'',e.training===p.year)}${clinicB('Dismiss with severance','fire',e.id)}</details>`).join('')||'<p>No staff have been hired at this location.</p>'))+
    clinicPanel('Open positions',openings.length?clinicSelect('clinic-role','Role',openings.map(([role,cap])=>[role,role+' · '+(cap-clinicCount(p,x,role))+' open · '+clinicMoney(clinicCost(p,PRACTICE_ROLES[role]))+'/year']))+
      clinicB('Hire for selected position','hire'):'<p>All permitted positions are filled. Larger facilities can support additional roles.</p>');
}
function clinicBuilding(p,x){
  const current=PRACTICE_BUILDINGS[x.level],future=PRACTICE_BUILDINGS[x.level+1];
  return clinicSiteNav(p,x,'building')+clinicPanel(current.name,`<p>${uiEscape(x.city)} · Owned premises · Estimated equity ${clinicMoney(x.equity)}.</p>
    <div class="law-metrics">${clinicStat('Patient capacity',current.panel)}${clinicStat('Staff positions',current.count)}${clinicStat('Annual maintenance',clinicMoney(clinicCost(p,current.maintenance)))}</div>`+
    (future?`<p>Upgrade to ${future.name} for ${clinicMoney(clinicLocationCost(p,x.level+1,x.city)-x.equity)}. Supports ${future.panel} permanent patients and ${future.count} staff positions. Requires reputation ${35+(x.level+1)*10}.</p>`+
      clinicB('Expand this building','upgrade',0,'',p.reputation<35+(x.level+1)*10):''));
}
function clinicLocations(p,x){
  const choices=p.cities.map((city,index)=>[index,city]).filter(([,city])=>!p.sites.some(s=>s.city===city));
  return clinicPanel('Practice locations',p.sites.map(s=>{
    const manager=clinicManager(p,s),limit=clinicPanelLimit(p,s);
    return `<section class="law-section"><h4>${uiEscape(s.city)} · ${PRACTICE_BUILDINGS[s.level].name}${s.primary?' · Main office':''}</h4>
    <p>Manager ${uiEscape(manager?.name||(s.primary?'Dr. '+g.name:'Vacant'))} · ${clinicReady(p,s)?'Open for patients':'Manager or physician needed'} · Popularity ${s.popularity}/100</p>
    <div class="law-metrics">${clinicStat('Permanent patients',clinicPatientsAt(p,s).length+' / '+limit)}${clinicStat('Last year’s visits',s.lastVisits)}
      ${clinicStat('Last year’s profit / loss',clinicMoney(s.lastProfit))}${clinicStat('Current income',clinicMoney(s.period.income))}${clinicStat('Property value',clinicMoney(s.equity))}</div>
    <div class="clinic-site-actions">${B('Staff and manager',`clinicGo('staff',${s.id})`)}${B('Review or expand building',`clinicGo('building',${s.id})`)}${B('Patient panel',`clinicGo('patients',${s.id})`)}
      ${!s.primary?B('Close location and sell property',`clinicPrompt('sell',${s.id})`):''}</div></section>`;
  }).join(''))+clinicPanel('Buy a practice location',choices.length?
    '<p>Expansion requires practice reputation 44. Properties in other cities cost 14% more than in your home city. Secondary branches need a manager and physician to begin seeing patients.</p>'+
    clinicSelect('clinic-city','City',choices)+clinicSelect('clinic-build','Building size',PRACTICE_BUILDINGS.map((b,i)=>[i,b.name+' · '+clinicMoney(clinicLocationCost(p,i,p.cities[choices[0][0]]))+' plus setup']))+
    clinicB('Buy and set up selected location','buy',0,'',p.reputation<44):'<p>All available cities in this country have a practice location.</p>');
}
function clinicFinances(p){
  const equity=p.sites.reduce((n,x)=>n+x.equity,0),pending=p.claims.reduce((n,x)=>n+x.amount,0);
  return `<div class="law-metrics">${clinicStat('Operating cash',clinicMoney(p.cash))}${clinicStat('Business loan balance',clinicMoney(p.debt))}
    ${clinicStat('Premises equity',clinicMoney(equity))}${clinicStat('Awaiting insurer payments',clinicMoney(pending))}
    ${clinicStat('Current year income',clinicMoney(p.period.income))}${clinicStat('Current year expenses',clinicMoney(p.period.expense))}</div>`+
    clinicPanel('Capital and financing',`<p>Personal cash ${clinicMoney(g.cash)}. Practice funds and any insurance reserves have separate balances.</p>`+
      clinicSelect('clinic-funds','Amount',[5000,20000,50000,100000,250000,500000].map(n=>[n,clinicMoney(clinicCost(p,n))]))+
      clinicB('Contribute personal cash','fund',0,'contribute')+clinicB('Draw business loan','fund',0,'loan')+clinicB('Repay business loan','fund',0,'repay',!p.debt)+
      clinicB('Distribute cash to yourself','fund',0,'draw')+(p.plan?clinicB('Fund insurance claim reserves','fund',0,'reserve'):''))+
    clinicPanel('Annual reports',p.reports.length?p.reports.slice(0,15).map(r=>`<details class="law-section"><summary>Age ${r.age} · Profit / loss ${clinicMoney(r.income-r.expense)}</summary>
      <p>Income ${clinicMoney(r.income)} · Expenses ${clinicMoney(r.expense)} · Closing cash ${clinicMoney(r.cash)} · Debt ${clinicMoney(r.debt)}</p>
      ${r.sites.map(s=>`<p>${uiEscape(s.city)} · ${s.visits} visits · Profit / loss ${clinicMoney(s.profit)}</p>`).join('')}</details>`).join(''):'<p>The first report is posted at Age Up.</p>')+
    `<details class="law-section"><summary>Recent transactions</summary>${p.ledger.slice(0,22).map(r=>`<div class="row"><span>${uiEscape(r.label)}</span><strong>${clinicMoney(r.amount)}</strong></div>`).join('')}</details>`+
    B('Wind down the entire practice',"clinicPrompt('close')");
}
function clinicInbox(p){
  const incidents=p.incidents.filter(n=>!n.closed);
  return clinicPanel('Decisions needing a response',incidents.length?incidents.map(item=>{
    const incident=PRACTICE_INCIDENTS[item.key];
    return `<article class="law-item"><div><h4>${uiEscape(incident.title)}</h4><p>Age ${item.age} · ${incident.public?'Public newspaper story':'Private practice decision'}</p></div>${B(incident.public?'Respond in the newspaper':'Review and respond',`clinicPrivateDecision(${item.id})`)}</article>`;
  }).join(''):'<p>Your practice inbox is clear.</p>')+
    clinicPanel('Resolved cases',p.history.slice(0,16).map(r=>`<p>Age ${r.age} · ${uiEscape(r.text)}</p>`).join(''));
}
function clinicModal(){
  const state=g.practicePrompt,p=g.practice;
  if(state==='found'){
    const defaultName=g.name.trim().split(/\s+/).at(-1)+' Medical';
    const investments=[190000,225000,300000,450000];
    return lawModal('Start a medical practice',`<p>You will leave your hospital job and purchase a solo office for ${clinicMoney(pr(155000))}, plus ${clinicMoney(pr(8500))} in setup costs.</p>
      <label for="clinic-name">Practice name</label><input class="txt" id="clinic-name" maxlength="60" value="${uiEscape(defaultName)}">`+
      clinicSelect('clinic-start-city','First office city',clinicCities().map((city,i)=>[i,city]))+
      clinicSelect('clinic-capital','Initial investment',investments.map(n=>[n,clinicMoney(pr(n))]))+
      `<p>Personal cash ${clinicMoney(g.cash)}.</p><p class="law-form-error" role="alert" id="clinic-form-error"></p>`,
      B('Purchase office and open practice','clinicFoundConfirm()')+B('Stay at my current job',"g.practicePrompt=null;draw()"));
  }
  if(state==='close'&&p){
    return lawModal('Wind down the practice?', '<p>Staff contracts will end, patients will be referred and properties will be sold. Remaining operating proceeds or liabilities will transfer to your personal cash. Insurance reserves will be set aside for plan closure.</p>',
      B('Confirm practice closure','clinicWindDown()')+B('Keep my practice',"g.practicePrompt=null;draw()"));
  }
  const site=p&&clinicFind(p.sites,state?.site);
  if(!site||site.primary)return '';
  const quote=clinicSaleQuote(p,site);
  return lawModal('Sell the '+site.city+' location?',`<p>Estimated net proceeds ${clinicMoney(quote.proceeds-quote.payroll)}. The main office will take patients where it has capacity. The remaining patients will receive referrals.</p>`,
    B('Confirm sale',`clinicConfirmSale(${site.id})`)+B('Keep this location',"g.practicePrompt=null;draw()"));
}
const clinicWork=workV;
workV=function(){
  const p=g.practice;
  if(wsel==='job'&&clinicActive())return clinicWorkMenu(p);
  if(wsel==='clinic-record'&&p){
    return B('Back to Work',"wsel=null;draw(1)")+
      clinicPanel(p.name,`<p>${p.status==='closed'?'Closed':'Management paused'} · ${p.served} completed visits · Reputation ${p.reputation}/100</p>`+
        (p.status==='active'?B('Resume managing the practice','clinicResume()',!!g.job||g.jail||g.rec||g.ret||g.office>=0||g.country!==p.country||royalActive()):''));
  }
  let html=clinicWork();
  if(wsel==='job'&&clinicMedicalJob()&&jobUpdateCareerPage==='home'&&!p){
    const spec=g.physicianPath?.specialty;
    html+=clinicPanel('Path to independent medical practice',spec?'<p>Specialty · '+PRACTICE_SPECIALTIES[spec][0]+'</p>':
      clinicSelect('clinic-focus','Choose a medical specialty',Object.entries(PRACTICE_SPECIALTIES).map(([key,item])=>[key,item[0]]))+
        B('Start training in this specialty',"clinicSelectSpecialty(clinicValue('clinic-focus'))"));
    html+=clinicPanel('Founding requirements','<ul>'+clinicRequirements().map(([met,label])=>`<li>${met?'Met':'Pending'} · ${uiEscape(label)}</li>`).join('')+'</ul>'+
      (clinicCanFound()?B('Start a practice','clinicFound()'):''));
  }
  if(!wsel&&!wsub&&p){
    if(clinicActive()){
      const root=document.createElement('div');root.innerHTML=html;
      for(const el of root.querySelectorAll('[onclick]'))if(el.getAttribute('onclick')==="wsel='job';draw(1)")el.remove();
      return clinicPanel('Current work',`<div class="row"><strong>${uiEscape(p.name)}</strong><span>Reputation ${p.reputation}/100</span></div>
        <p>${PRACTICE_SPECIALTIES[p.specialty][0]}</p>${B('Manage medical practice',"clinicGo('overview')")}`)+root.innerHTML;
    }
    return B(uiEscape(p.name)+' <small>Medical practice record</small>',"wsel='clinic-record';draw(1)")+html;
  }
  return html;
};
const clinicGame=gameView;
gameView=function(){
  const html=clinicGame(),unread=g.news?.editions.reduce((n,e)=>n+e.articles.filter(a=>a.brief&&newsCanRespond(a,e)).length,0);
  if(!g.practicePrompt&&!unread)return html;
  const root=document.createElement('div');root.innerHTML=html;
  if(unread){
    const button=root.querySelector('.news-icon');
    if(button){
      button.classList.add('news-has-briefs');
      button.title=unread+' newspaper decisions';
    }
  }
  if(!root.querySelector('.mo')&&g.practicePrompt){
    const popup=clinicModal();
    if(popup)root.querySelector('.game').insertAdjacentHTML('beforeend',popup);
  }
  return root.innerHTML;
};
