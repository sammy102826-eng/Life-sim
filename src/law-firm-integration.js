const LAW_FOUNDER_ROLES = ['Senior partner','Managing partner'];
const LAW_OWNER_TITLE = 'Law firm owner';
const lawOwnsJob = () => g.job?.firmOwner===true;
const lawFirmActive = () => !!g.lawFirm&&g.lawFirm.status==='active'&&lawOwnsJob()&&!g.jail&&!g.ret&&g.office<0&&!royalActive();
const lawFirmBusy = () => !!(g.event||g.result||g.ysum||g.eduPopup||g.hsPopup||g.msReport||g.msTrainPopup||g.msq?.length||g.hsQueue?.length||newsPopupOpen);
const lawDegree = (life=g) => life.collegeTrack?.degrees?.findLast(d=>d.level==='law');
const lawHasJD = (life=g) => !!lawDegree(life)||life.deg?.some(d=>['JD','Juris Doctor (JD)'].includes(d));
const lawCurrentAttorney = () => g.job?.f==='law'&&!g.job.sp&&['Attorney','Senior associate',...LAW_FOUNDER_ROLES].includes(g.job.t);
const lawOwnerJob = () => ({t:LAW_OWNER_TITLE,f:'law',sp:1,pay:0,yrs:0,firmOwner:true});

LAD.law.splice(2,0,['Senior associate',195000,3,4,0,'JD']);
for(const role of LAW_FOUNDER_ROLES)REQJ[role]='Bar exam';
REQJ['Senior associate']='Bar exam';

const lawOriginalFix = fix2;
fix2=function(life){
  const result=lawOriginalFix(life);
  if(lawHasJD(result)&&!result.deg.includes('JD'))result.deg.push('JD');
  return result;
};
const lawOriginalSpecificJob = collegeSpecificJobMet;
collegeSpecificJobMet=function(job){
  if(job[0]==='Attorney')return lawHasJD();
  return lawOriginalSpecificJob(job);
};
const lawOriginalGraduate = collegeGraduate;
collegeGraduate=function(){
  const student=collegeEnsure().current;
  if(student?.level==='law'&&!g.deg.includes('JD'))g.deg.push('JD');
  lawOriginalGraduate();
  if(student?.level==='law'){
    const degree=lawDegree();
    if(degree&&student.lawFocus)degree.lawFocus=student.lawFocus;
    draw();
  }
};
const lawOriginalCollegePage = collegeCurrentPage;
collegeCurrentPage=function(){
  const student=collegeEnsure().current,html=lawOriginalCollegePage();
  if(student?.level!=='law'||!['home','current','study','coursework'].includes(collegePage))return html;
  const options=Object.entries(LAW_PRACTICES).map(([id,p])=>`<option value="${id}" ${student.lawFocus===id?'selected':''}>${p.name}</option>`).join('');
  return `<div class="card law-study"><h3>Law school concentration</h3><p>Choose a concentration for your transcript and future law firm. Your selection adds a clinic to your law coursework.</p><label for="law-concentration">Practice area</label><select id="law-concentration" ${student.lawFocus?'disabled':''} onchange="lawSetConcentration(this.value)"><option value="">Choose a practice area</option>${options}</select></div>`+html;
};
function lawSetConcentration(key){
  const student=collegeEnsure().current;
  if(student?.level!=='law'||!Object.hasOwn(LAW_PRACTICES,key)||student.lawFocus)return;
  student.lawFocus=key;
  if(!collegeScheduleLocked(student))lawScheduleClinic(student);
  draw();
}
function lawScheduleClinic(student){
  if(student.level!=='law'||!Object.hasOwn(LAW_PRACTICES,student.lawFocus))return;
  const course=student.schedule.find(row=>row.type==='Major');
  if(course)course.name=LAW_PRACTICES[student.lawFocus].name+' clinic';
}
const lawDefaultSchedule=collegeDefaultSchedule;
collegeDefaultSchedule=function(student){
  lawDefaultSchedule(student);
  if(!collegeScheduleLocked(student))lawScheduleClinic(student);
};
const lawLegacyFindJob=findJob;
findJob=function(){
  if(lawOwnsJob())return toast('Manage your current firm from Work.');
  return lawLegacyFindJob();
};
const lawOriginalJobEvent=jobUpdateJobEventAllowed;
jobUpdateJobEventAllowed=function(event){
  if(lawOwnsJob()&&event?.jobOnly&&event.jobField==='law')return false;
  return lawOriginalJobEvent(event);
};
function lawFounderRequirements(){
  if(!lawCurrentAttorney())return [];
  const j=g.job, harmony=jobUpdateEnsureCareer().score;
  return [
    [j.companyYears>=10,`10 years with this firm (${j.companyYears||0})`],
    [LAW_FOUNDER_ROLES.includes(j.t),'Senior or managing partner'],
    [g.perf>=75,`Performance 75+ (${g.perf})`],
    [harmony>=60,`Career harmony 60+ (${harmony})`],
    [j.boss.bond>=55,`Supervisor relationship 55+ (${j.boss.bond})`],
    [!g.rec&&!g.jail&&!g.ret&&g.office<0&&!royalActive(),'Clean record and eligible to practice'],
    [lawHasJD()&&g.pass?.['Bar exam'],'JD and passed bar exam']
  ];
}
function lawCanFound(){
  return !g.lawFirm&&!g.lawFirmSetup&&lawCurrentAttorney()&&lawFounderRequirements().every(([met])=>met);
}
function lawFoundConfirm(){
  if(!lawCanFound()||lawFirmBusy())return;
  g.lawFirmPrompt='confirm';
  draw();
}
function lawFoundResign(){
  if(g.lawFirmPrompt!=='confirm'||!lawCanFound()||lawFirmBusy())return;
  g.lawFirmPrompt=null;
  const concentration=lawDegree()?.lawFocus;
  g.lawFirmSetup={focus:LAW_PRACTICES[concentration]?concentration:null,age:g.age,employer:g.job.company};
  quit(-1);
  tab='Work';wsub=null;
  wsel='law-setup';
  draw(1);
}
function lawSetupModal(){
  const setup=g.lawFirmSetup;
  const concentration=setup.focus
    ? `<p>JD concentration · <strong>${LAW_PRACTICES[setup.focus].name}</strong></p>`
    : `<label for="law-setup-specialty">Founding concentration</label><select id="law-setup-specialty">${Object.entries(LAW_PRACTICES).map(([id,p])=>`<option value="${id}">${p.name}</option>`).join('')}</select><p class="d">Your JD transcript has no recorded concentration. Choose the practice area for this firm.</p>`;
  const scale=pr(100000)/100000;
  return lawModal('Open your law firm',`<label for="law-setup-name">Firm name</label><input class="txt" id="law-setup-name" maxlength="60" autocomplete="off" value="${uiEscape(g.name.trim().split(/\s+/).at(-1)+' Law')}">${concentration}
    <label for="law-setup-office">First office</label><select id="law-setup-office"><option value="rent">Lease a solo suite · ${loc(pr(1900))} upfront</option><option value="own">Buy a solo suite · ${loc(pr(115000))}</option></select>
    <label for="law-setup-capital">Personal investment in the firm</label><select id="law-setup-capital">${[25000,50000,90000,160000,250000].map((n,i)=>`<option value="${Math.round(n*scale)}" ${i===1?'selected':''}>${loc(Math.round(n*scale))}</option>`).join('')}</select>
    <p class="d">Available personal cash ${loc(g.cash)}. You start solo. Working capital covers office costs and litigation.</p><p class="law-form-error" id="law-setup-error" role="alert"></p>`,
    B('Open the practice','lawFoundOpen()')+B('Finish later',"wsel=null;draw(1)"));
}
function lawFoundOpen(){
  const setup=g.lawFirmSetup;
  if(!setup||g.job||g.lawFirm||g.jail||g.rec||g.ret||g.office>=0||royalActive()||lawFirmBusy())return;
  const name=document.getElementById('law-setup-name')?.value.trim();
  const specialty=setup.focus||document.getElementById('law-setup-specialty')?.value;
  const owned=document.getElementById('law-setup-office')?.value==='own';
  const capital=Number(document.getElementById('law-setup-capital')?.value);
  const scale=pr(100000)/100000;
  const error=document.getElementById('law-setup-error');
  if(!name||name.length>60||/[<>]/.test(name)||!Object.hasOwn(LAW_PRACTICES,specialty)||![25000,50000,90000,160000,250000].some(n=>Math.round(n*scale)===capital)){
    error.textContent='Enter a plain-text firm name and select valid options.';return;
  }
  const home=g.city||g.country;
  const domestic=(CITY[g.country]||'').split('|').filter(Boolean);
  const foreign=Object.keys(g.w).filter(k=>k!==g.country).slice(0,4).map(k=>((CITY[k]||'').split('|')[0]||k)+', '+k);
  const places=[...new Set([home,...domestic,...foreign])];
  const seed=[...g.name+name+g.country+g.age].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261);
  const f=lawNewFirm({name,specialty,seed,capital,age:g.age,scale,home,places});
  if(g.cash<capital||capital<lawOfficeQuote(f,0,owned,home)){
    error.textContent='Choose an investment you can afford that covers the first office.';return;
  }
  lawAddOffice(f,0,owned,home);
  f.country=g.country;f.domestic=[...new Set([home,...domestic])];
  f.founder=g.name;f.founderEmployer=setup.employer;
  f.skill=lawClamp(34+g.smarts*.32+g.perf*.10);
  f.influence=lawClamp(Math.max(12,(g.pc||0)/2));
  lawTouch(f,'The firm opened its first solo office.');
  lawFillLeads(f);
  g.cash-=capital;
  LD('Law firm capital contribution',-capital);
  g.lawFirm=f;g.lawFirmSetup=null;
  g.job=lawOwnerJob();g.ue=false;
  const degree=lawDegree();
  if(degree&&!degree.lawFocus)degree.lawFocus=specialty;
  L('You opened '+name+' and began practicing '+LAW_PRACTICES[specialty].name.toLowerCase()+'.');
  lawOpen('dashboard');
}
function lawCalendarAdvance(){
  if(!lawFirmActive()||lawFirmBusy()||g.lawFirm.receipt)return;
  if(g.lawFirm.clock%12===11)return toast('Use Age Up to close the year and open next year’s hearings.');
  lawMonth(g.lawFirm,g.eco?.services||50);
  draw();
}
const lawOriginalYearSummary = buildSum;
buildSum=function(){
  if(lawFirmActive()){
    const f=g.lawFirm;
    while(f.lastAge<g.age){
      const end=(Math.floor(f.clock/12)+1)*12;
      while(f.clock<end)lawMonth(f,g.eco?.services||50);
      f.lastAge++;
      if(f.publicity>=20){
        g.fame=Math.max(g.fame||0,Math.round(f.publicity*.8));
        g.fm=Math.max(g.fm||0,Math.round(f.publicity*.8));
      }
      L(f.name+' closed its financial year. '+lawActiveCases(f).length+' matters remain open.');
    }
  }
  return lawOriginalYearSummary();
};
const lawOriginalAge = ageUp;
ageUp=function(){
  if(g.lawFirmPrompt||tab==='Work'&&wsel==='law-setup'&&g.lawFirmSetup||lawFirmActive()&&(g.lawFirm.receipt||g.lawFirm.closePrompt))return;
  return lawOriginalAge();
};
const lawJobChange=collegeConfirmJob;
collegeConfirmJob=function(type,index){
  if(lawOwnsJob()&&type!=='pt')return toast('Close the firm or hand it over to a partner before taking another full-time job.');
  return lawJobChange(type,index);
};
const lawOriginalQuit=quit;
quit=function(index){
  if(index<0&&lawOwnsJob())return lawRequestExit('close');
  return lawOriginalQuit(index);
};
const lawOriginalRetire=retire;
retire=function(){
  if(lawOwnsJob())return toast('Close the firm or hand it over to a partner before retiring.');
  return lawOriginalRetire();
};
const lawOriginalCamp=startCamp;
startCamp=function(i){
  if(lawOwnsJob())return toast('Close the firm or hand it over to a partner before running for office.');
  return lawOriginalCamp(i);
};
function lawResume(){
  const f=g.lawFirm;
  if(!f||f.status!=='active'||g.job||g.country!==f.country||g.jail||g.rec||g.ret||g.office>=0||royalActive()||lawFirmBusy())return;
  g.job=lawOwnerJob();g.ue=false;f.lastAge=g.age;
  L('You resumed management of '+f.name+'.');
  lawOpen('dashboard');
}
function lawRequestExit(mode){
  if(!lawFirmActive()||lawFirmBusy()||!['close','handover','government','judiciary'].includes(mode))return;
  g.lawFirm.closePrompt=mode;
  draw();
}
function lawExitFirm(){
  const f=g.lawFirm,mode=f?.closePrompt;
  if(!lawFirmActive()||!mode||lawFirmBusy())return;
  const appointment=['government','judiciary'].includes(mode);
  const successor=f.staff.find(e=>e.id===f.successor&&e.shares);
  if(mode==='handover'&&!successor)return;
  if(appointment&&!lawPublicEligible(f,mode))return;
  f.closePrompt=null;
  const owner=100-lawPartnerShares(f);
  if(mode==='handover'||appointment&&successor){
    f.status='Succeeded by '+successor.name;
    const proceeds=Math.min(Math.max(0,f.cash),Math.round(lawValuation(f)*owner/100));
    lawPost(f,'capital','Founder succession buyout',-proceeds);
    g.cash+=proceeds;
    LD('Law firm succession',proceeds);
  }else{
    for(const c of lawActiveCases(f)){
      if(c.verdict)lawClose(f,c,c.verdict.outcome||'Final judgment');
      else{
        lawBill(f,c);
        c.deposit=0;c.status='closed';c.result='Referred on closure';c.deadline=null;
        lawLogCase(c,'The firm arranged a transfer to independent counsel and returned unused trust funds.');
      }
    }
    const assets=f.offices.reduce((n,o)=>n+(o.owned?Math.round(o.equity*.88):o.deposit),0);
    const payroll=f.staff.reduce((n,e)=>n+Math.round(e.salary/12)+e.bonus,0);
    const net=f.cash+assets-f.debt-payroll;
    const funds=net<0?net:Math.round(net*owner/100);
    g.cash+=funds;
    LD('Law firm liquidation',funds);
    f.cash=0;f.debt=0;f.status='Closed';
  }
  g.job=appointment?{t:mode==='judiciary'?'Appellate judge':'Government counsel',f:'publicservice',pay:mode==='judiciary'?165000:132000,sp:0,yrs:0,lv:0}:null;
  if(appointment)jobUpdateOnHire(g.job);
  L(appointment?'You accepted an appointment as '+g.job.t.toLowerCase()+'.':f.name+' · '+f.status+'.');
  wsel=null;wsub=null;
  draw(1);
}
function lawPublicEligible(f,which){
  return g.office<0&&!g.rec&&!g.jail&&f.ethics>=78&&f.reputation>=(which==='judiciary'?76:61)&&f.influence>=(which==='judiciary'?44:27)&&(which!=='judiciary'||f.wins>=5);
}
