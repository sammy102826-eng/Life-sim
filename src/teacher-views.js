const TEACH_PAGES={home:'Overview',class:'Class',hours:'Office hours',style:'Teaching method',workload:'Homework and tests',grading:'Grading',
 staff:'Staff',supervisor:'Supervisor',projects:'Academic projects',reports:'Annual reports',inbox:'Pending decisions',
 financial:'Funding and finances',hire:'Hire and fire staff',upgrades:'Campus upgrades',issues:'Student issues',programs:'Colleges and programs',
 deals:'Exchange and summer programs',governance:'Private, charter and public status'};
let teachPage='home',teachDialog=null;
const teachSelect=(id,label,rows)=>studioSelect('teach-'+id,label,rows);
const teachValue=id=>document.getElementById('teach-'+id)?.value;
const teachSection=(label,body)=>studioSection(label,body);
const teachStats=rows=>studioStats(rows);
const teachB=(label,action,arg='',id=0,off=false)=>B(label,`teachAction('${action}','${arg}',${id})`,off);
const teachNum=(id,label,n,min=0,max=100)=>`<label for="teach-${id}">${label}</label><input id="teach-${id}" class="txt" type="number" value="${n}" min="${min}" max="${max}" step="1">`;
const teachText=(id,label)=>`<label for="teach-${id}">${label}</label><input id="teach-${id}" class="txt" maxlength="65">`;
const teachMoneyInput=(id,label,value)=>teachNum(id,label,finDisplay(value),0,1000000000000000);
function teachOpen(page='home'){
 if(!teachHas(TEACH_PAGES,page))return;
 teachPage=page;tab='Work';wsel='teacher';wsub=null;draw(1);
}
function teachOpenCareer(){tab='Work';wsel='teacher-career';wsub='Special';draw(1);}
const teachGo=(key,label=TEACH_PAGES[key])=>B(label,`teachOpen('${key}')`);
function teachPolicyRows(defs,current){return Object.entries(defs).map(([key,row])=>[key,row[0],key===current]);}
function teachSubjectView(s){
 return teachSelect('subject','Teaching subject',teachSubjectOptions().map(([key,[label]])=>[key,label,key===s.subject]))+
  teachB('Set teaching subject','subject');
}
function teachCareerView(){
 const s=teachState(),busy=!teachCanChange(),dean=teachQualified('dean',s),prof=teachQualified('professor',s);
 const requirements=role=>teachRequirements(role,s).map(([label,ok])=>'<p>'+label+' · '+(ok?'Met':'Needed')+'</p>').join('');
 const footer=busy?'<p>Finish your current commitments before taking an appointment.</p>':'';
 const pick=teachSubjectView(s);
 return B('Back to Work',"wsel=null;wsub=null;draw(1)")+
  teachSection('Teaching career',pick+teachStats([['School teaching',s.schoolYears+' years'],['University teaching',s.professorYears+' years'],['Published projects',s.publications]])+footer)+
  teachSection('Elementary through high school',requirements('high')+B('Teaching certification exam',"wsel=null;wsub='Exam';draw(1)")+
   teachB('Register teaching license · '+loc(pr(450)),'license','',0,s.license===g.country||!g.pass['Teaching certification']||!teachDegrees().bachelor)+
   ['elementary','middle','high'].map(k=>teachB(TEACH_ROLES[k][0],'hire',k,0,busy||!teachQualified(k,s)||s.assignment?.role==='dean'&&teachJob())).join(''))+
  teachSection('University faculty',requirements('professor')+TEACH_INSTITUTIONS.map(([n,years,pay,respect],i)=>
   teachB(uiEscape(n)+' <small>'+years+' university years · Respect '+respect+' · '+loc(pay)+' base salary</small>','hire','professor',i,
    busy||!prof||s.professorYears<years||s.respect<respect||s.assignment?.role==='dean'&&teachJob())).join(''))+
  teachSection('University leadership',requirements('dean')+(s.campus?.owned?
   teachB('Resume '+uiEscape(s.campus.name),'dean','resume',0,busy||!dean||uniDean()):
   teachB('Apply to lead Western Plains University','dean','appointment',0,busy||!dean||uniDean())+
   teachText('university','University name')+teachSelect('university-type','Academic focus',Object.entries(UNI_TYPES))+
   teachMoneyInput('capital','Founding contribution',pr(1600000))+teachB('Create a university','dean','found',0,busy||!dean)));
}
function teachClassView(s){
 const campus=s.assignment.role==='professor';
 return teachSection(campus?'Seminar roster':'Class roster',s.students.map(p=>`<details class="card"><summary>${uiEscape(p.name)} · Engagement ${p.engagement}/100</summary>`+
   teachStats([['Practice or coursework',p.work[0]+'%'],['Assessment',p.work[1]+'%'],['Participation',p.work[2]+'%']])+
   [[campus?'Review course material':'Help with study practice','study'],[campus?'Discuss academic goals':'Offer guidance','guidance'],
    [campus?'Coach presentation skills':'Practice learning skills','skills'],['Recognize progress','praise'],...(campus?[]:[['Meet with parents or guardians','meeting']])]
    .map(([label,key])=>teachB(label,'interact',key,p.id,s.used[key+'-'+p.id]?.age===g.age)).join('')+'</details>').join(''));
}
function teachHoursView(s){
 const remaining=3-(s.used.hours?.age===g.age?s.used.hours.count:0);
 const struggling=s.students.slice().sort((a,b)=>teachScore(s,a)-teachScore(s,b)).slice(0,3);
 return teachSection('Office hours','<p>'+remaining+' sessions available. Each session reaches three students who need support.</p>'+
  struggling.map(p=>'<p>'+uiEscape(p.name)+' · Current projected mark '+teachScore(s,p)+'%</p>').join('')+
  teachB('Hold office hours','interact','hours',0,remaining<=0));
}
function teachMethodsView(s,page){
 const m=s.methods;
 if(page==='style')return teachSection('Teaching method',teachSelect('style','Classroom approach',teachPolicyRows(TEACH_METHODS,m.style))+
  '<p>Different approaches change performance on assignments, assessments, and participation.</p>'+teachB('Save teaching method','method','style'));
 return teachSection('Homework and testing philosophy',teachSelect('homework','Homework approach',teachPolicyRows(TEACH_HOMEWORK,m.homework))+
  teachSelect('tests','Test approach',teachPolicyRows(TEACH_TESTS,m.tests))+teachB('Save homework and testing policy','workload'));
}
function teachGradingView(s){
 const weights=s.methods.weights;
 return teachSection('Grading policy','<p>Set weights totaling 100%. Graded work keeps the mark recorded when it was reviewed.</p>'+
  ['Homework or coursework','Tests and assessments','Participation'].map((label,i)=>teachNum('weight-'+i,label+' (%)',weights[i])).join('')+
  teachB('Save grading weights','weights'))+
  teachSection('Student work',s.students.map(p=>`<p>${uiEscape(p.name)} · ${p.mark===null?'Ungraded':'Recorded '+p.mark+'%'}</p>`+
   teachB('Grade work for '+uiEscape(p.name),'grade','',p.id,p.mark!==null)).join('')+
   teachB('Grade all remaining work','grade-all','',0,s.students.every(p=>p.mark!==null)));
}
function teachStaffView(s){
 return teachSection('Colleagues',s.staff.map(p=>`<details class="card"><summary>${uiEscape(p.name)} · ${p.role}</summary><p>Working relationship ${p.bond}/100</p>`+
  teachB('Talk with '+uiEscape(p.name),'interact','chat',p.id)+teachB('Ask for mentoring','interact','mentor',p.id)+
  teachB('Become friends','interact','friend',p.id,p.bond<74||!!p.friend)+'</details>').join(''));
}
function teachSupervisorView(s){
 const a=s.assignment.role==='professor',word=a?'Dean':'Principal';
 return teachSection(word+' · '+s.supervisor.name,'<p>Working relationship '+s.supervisor.bond+'/100.</p>'+
  teachSelect('discussion-student','Student to discuss',s.students.map(x=>[x.id,x.name]))+
  [['Discuss a struggling student','support'],[a?'Request academic resources':'Request classroom resources','resources'],
   [a?'Schedule a peer evaluation':'Request a classroom observation','observe']].map(([l,k])=>teachB(l,'interact',k,0,s.used['supervisor-'+k]?.age===g.age)).join(''));
}
function teachProjectsView(s){
 return teachSection('Start a project',teachText('project','Project title')+
  teachSelect('project-type','Project type',Object.entries(TEACH_PROJECTS).map(([k,d])=>[k,d[0]]))+teachB('Begin project','project'))+
  s.projects.slice().reverse().map(p=>`<details class="card"><summary>${uiEscape(p.name)} · ${p.status==='published'?'Published':p.progress+'% complete'}</summary>
   <p>${uiEscape(TEACH_SUBJECTS[p.subject][0])} · Quality ${p.quality}/100</p>`+(p.status==='active'?
   [['Do project work','work'],['Request a peer review','review'],['Invite a research collaborator','partner'],['Submit for publication','publish']].map(([l,k])=>
    teachB(l,'project-action',k,p.id,p.used[k]===g.age||k==='publish'&&(p.progress<100||p.quality<60))).join(''):'')+'</details>').join('');
}
function uniStaffView(c){
 const need=uniStaffNeed(c);
 return teachSection('Staffing and recruitment',`<p>Staffing targets reflect ${c.enrollment} students, ${new Set(c.programs.map(p=>p.college)).size} colleges, and ${c.programs.reduce((n,p)=>n+p.courses,0)} courses.</p>`+
  Object.entries(UNI_ROLES).map(([k,[label,salary]])=>`<details class="card"><summary>${label} · ${c.roles[k]} / ${need[k]}</summary><p>Per-person annual pay ${loc(pr(salary))}</p>`+
    teachB('Hire one','staff-hire',k)+teachB('Dismiss one','staff-fire',k,0,!c.roles[k])+'</details>').join(''));
}
function uniProgramsView(c){
 const groups=[...new Set(c.programs.map(p=>p.college))];
 return teachSection('Academic focus',teachSelect('focus','University specialization',Object.entries(UNI_TYPES).map(([k,d])=>[k,d,k===c.type]))+
  teachB('Set university focus','focus'))+groups.map(k=>teachSection(UNI_TYPES[k],c.programs.filter(p=>p.college===k).map(p=>
    `<p>${uiEscape(uniProgramName(p))} · ${p.track} · ${p.courses} courses · Rigor ${p.rigor}/100</p>`+
    teachB('Remove '+uiEscape(uniProgramName(p))+' '+p.track,'program-remove',p.key,p.track==='major'?0:1,c.programs.length<=2)).join(''))).join('')+
  teachSection('Add or revise a degree program',teachSelect('program','Subject',[...Object.entries(UNI_PROGRAMS).map(([k,d])=>[k,d[0]+' · '+UNI_TYPES[d[1]]]),
    ...c.programs.filter(p=>p.name).map(p=>[p.key,uniProgramName(p)+' · '+p.track]),['custom','Create a custom program']])+
   '<p>For a new custom program, choose its name and college.</p>'+teachText('program-name','Custom program name')+
   teachSelect('program-college','Custom program college',Object.entries(UNI_TYPES).filter(([k])=>k!=='broad'))+
   teachSelect('credential','Credential',[['major','Major'],['minor','Minor']])+teachNum('courses','Course count',5,2,20)+
   teachNum('rigor','Academic rigor',65,35,95)+teachB('Save program','program'));
}
function uniFundingView(c){
 const last=c.reports[0];
 return teachSection('Funding and finances',teachStats([['University funds',loc(c.cash)],['Governance',c.status],['Academic independence',c.independence+'/100']])+
  teachSelect('funding','Primary funding source',Object.entries(UNI_FUNDING).map(([k,d])=>[k,d,c.funding===k]))+
  teachMoneyInput('tuition','Annual tuition per student',c.tuition)+teachB('Set funding and tuition','funding')+
  (c.owned?teachMoneyInput('contribution','Personal contribution',0)+teachB('Contribute to the university','contribution'):'')+
  (last?teachSection('Last year’s ledger',Object.entries(last.ledger).map(([k,n])=>'<p>'+uiEscape(k)+' · '+loc(n)+'</p>').join('')):'<p>The ledger closes on Age Up.</p>'));
}
function uniDealsView(c){
 return teachSection('University partnerships and summer trips',teachSelect('deal-kind','Program',[['abroad','Study abroad'],['exchange','Student exchange'],['summer','Summer trip']])+
  teachSelect('destination','Partner country',Object.keys(g.w).filter(x=>x!==c.country).map(n=>[n,n]))+
  teachText('partner','Partner university or organization')+teachSelect('activities','Planned activities',Object.entries(UNI_TRIP_PLANS))+
  teachNum('seats','Places available',20,5,120)+teachMoneyInput('price','Fee per student',pr(400))+teachB('Negotiate program','deal'))+
  c.deals.map(d=>teachSection(d.partner,('<p>'+uiEscape(d.country)+' · '+{abroad:'Study abroad',exchange:'Student exchange',summer:'Summer trip'}[d.kind]+
   ' · '+d.last+'/'+d.seats+' places used last year · Fee '+loc(d.price)+'</p><p>'+UNI_TRIP_PLANS[d.plan]+'</p>')+
   (d.active?teachB('Suspend this agreement','deal-end','',d.id):'<p>Suspended</p>'))).join('');
}
function uniReportsView(c){
 return c.reports.map(r=>teachSection('Age '+r.age,teachStats([['Enrolled',r.enrollment],['Waitlisted',r.wait],['Net movement',loc(r.net)]])+
  Object.entries(r.short).filter(([,n])=>n).map(([k,n])=>'<p>'+UNI_ROLES[k][0]+' short by '+n+'</p>').join('')+(r.status?'<p>'+r.status+'</p>':''))).join('')||'<p>No annual reports yet.</p>';
}
function teachInbox(s,filter=()=>true){
 const items=s.events.filter(e=>teachEventReady(s,e)&&filter(e));
 return teachSection('Pending decisions',items.map(e=>teachB(TEACH_EVENTS[e.key][0],'review','',e.id)).join('')||'<p>No decisions waiting.</p>')+
  teachSection('Recent activity',s.history.slice(0,9).map(x=>'<p>Age '+x.age+' · '+uiEscape(x.text)+'</p>').join(''));
}
function teachOfficeView(s){
 const a=s.assignment,c=s.campus,leader=a.role==='dean',prof=a.role==='professor',page=teachPage;
 const back=page==='home'?B('Back to Work',"wsel=null;draw(1)"):teachGo('home','Back to teaching overview');
 let html='';
 if(page==='home'){
  const links=leader?['financial','hire','upgrades','issues','programs','deals','governance','reports','inbox']:
    ['class','hours','style','workload','grading','staff','supervisor',...(prof?['projects']:[]),'reports','inbox'];
  html=Bar(leader||prof?'Faculty respect':'School and staff respect',s.respect,GOLD)+Bar('Student popularity',s.popularity,'#4FB39A')+
   (leader?teachStats([['University funds',loc(c.cash)],['Prestige',c.prestige+'/100'],['Enrollment',c.enrollment],['Accreditation',c.accreditation]]):
    teachStats([['Subject',TEACH_SUBJECTS[s.subject][0]],['Years in this role',g.job.yrs||0]]))+
   links.map(k=>teachGo(k,k==='supervisor'?(prof?'Dean':'Principal'):TEACH_PAGES[k])).join('')+
   B('Explore teaching appointments','teachOpenCareer()')+teachB('Step down','quit');
 }else if(page==='inbox')html=teachInbox(s);
 else if(leader){
  if(page==='financial')html=uniFundingView(c);
  if(page==='hire')html=uniStaffView(c);
  if(page==='upgrades')html=teachSection('Campus upgrades',Object.entries(UNI_UPGRADES).map(([k,[l,cost]])=>
   teachB(l+' · '+(c.upgrades.includes(k)?'Installed':loc(pr(cost))),'upgrade',k,0,c.upgrades.includes(k))).join(''));
  if(page==='issues')html=teachB('Request a student affairs review','affairs')+teachInbox(s,e=>['hazing','bullying','safety','layoffs','repairs','accreditation'].includes(e.key));
  if(page==='programs')html=uniProgramsView(c);
  if(page==='deals')html=uniDealsView(c);
  if(page==='governance')html=teachSection('Governance',`<p>${c.status} · ${c.owned?'Owner-managed':'Public board appointment'}${c.pending?' · Application pending':''}.</p>`+
   (c.owned?teachB('Apply for a public charter','status','charter',0,!!c.pending||c.status!=='private')+
    teachB('Propose a state acquisition and public merger','status','public',0,!!c.pending||c.status!=='charter')+
    teachB('Return to private governance','status','private',0,!!c.pending||c.status!=='charter'):''));
  if(page==='reports')html=uniReportsView(c);
 }else{
  if(page==='class')html=teachClassView(s);
  if(page==='hours')html=teachHoursView(s);
  if(page==='style'||page==='workload')html=teachMethodsView(s,page);
  if(page==='grading')html=teachGradingView(s);
  if(page==='staff')html=teachStaffView(s);
  if(page==='supervisor')html=teachSupervisorView(s);
  if(page==='projects'&&prof)html=teachProjectsView(s);
  if(page==='reports')html=s.reports.slice(0,10).map(r=>teachSection(r.school+' · Age '+r.age,
   `<p>Class average ${r.average}% · Passed ${r.pass}/${r.size} · Graded by you ${r.submitted}.</p>`+
   r.marks.map(p=>'<p>'+uiEscape(p.name)+' · '+p.mark+'%</p>').join(''))).join('')||'<p>No annual reports yet.</p>';
 }
 return '<div class="law-shell studio-shell">'+back+teachSection(a.school,'<p>'+TEACH_ROLES[a.role][0]+' · '+loc(g.job.pay)+' base salary</p>')+html+'</div>';
}
function teachAction(action,arg,id){
 if(g.jail||!g.alive||g.justice?.pending||publicityBusy())return;
 const s=teachState();
 let error='';
 if(action==='subject'){
  const key=teachValue('subject');
  if(!teachSubjectOptions().some(([k])=>k===key)||teachActive()&&s.assignment.role==='dean')return toast('Select a subject supported by your college studies.');
  s.subject=key;
 }else if(action==='license')error=teachLicense();
 else if(action==='hire'){
  error=teachHire(arg,id);
  if(!error)return teachOpen();
 }else if(action==='dean'){
  error=teachDean(arg,teachValue('university'),teachValue('university-type'),finAmount('teach-capital'));
  if(!error)return teachOpen();
 }else{
  if(!teachActive())return;
  const c=s.campus;
  if(action==='review'){
   const e=s.events.find(x=>x.id===id);
   if(teachEventReady(s,e)){e.seen=true;teachDialog=e.id;draw();}
   return;
  }
  if(action==='quit'){teachDialog='quit';return draw();}
  if(s.assignment.role==='dean'){
   if(action==='staff-hire'||action==='staff-fire')error=uniStaff(action==='staff-hire'?'hire':'fire',arg);
   else if(action==='upgrade')error=uniUpgrade(arg);
   else if(action==='focus'){
    const focus=teachValue('focus');
    if(!teachHas(UNI_TYPES,focus))return;
    c.type=focus;
   }else if(action==='funding')error=uniFunding(teachValue('funding'),finAmount('teach-tuition'));
   else if(action==='contribution'){
    const amount=finAmount('teach-contribution');
    if(!c.owned||!Number.isSafeInteger(amount)||amount<1||g.cash<amount)return toast('Enter a positive amount available in your personal cash.');
    g.cash-=amount;LD('University owner contribution',-amount);c.ownerBasis=(c.ownerBasis||0)+amount;uniPost(c,'Personal contribution',amount);
   }else if(action==='program')error=uniProgram('save',teachValue('program'),teachValue('credential'),Number(teachValue('courses')),Number(teachValue('rigor')),
    teachValue('program-name'),teachValue('program-college'));
   else if(action==='affairs'){
    if(!teachOnce(s,'affairs'))return toast('The student affairs office already reviewed concerns this year.');
    const open=['bullying','hazing','safety'].find(k=>!s.events.some(e=>e.key===k&&!e.closed));
    if(open)teachEvent(s,open);
   }
   else if(action==='program-remove')error=uniProgram('remove',arg,id===0?'major':'minor');
   else if(action==='status')error=uniStatus(arg);
   else if(action==='deal')error=uniDeal(teachValue('deal-kind'),teachValue('destination'),teachValue('partner'),teachValue('activities'),
    finAmount('teach-price'),Number(teachValue('seats')));
   else if(action==='deal-end'){
    const deal=c.deals.find(d=>d.id===id&&d.active);
    if(!deal)return;
    deal.active=false;
   }else return;
  }else if(action==='interact')error=teachInteract(arg,arg==='support'?Number(teachValue('discussion-student')):id);
  else if(action==='grade')error=teachGrade(id);
  else if(action==='grade-all')s.students.filter(p=>p.mark===null).forEach(p=>teachGrade(p.id));
  else if(action==='method')error=teachSetMethod(arg,teachValue(arg));
  else if(action==='workload'){
   const homework=teachValue('homework'),tests=teachValue('tests');
   if(!teachHas(TEACH_HOMEWORK,homework)||!teachHas(TEACH_TESTS,tests))return toast('Select an available homework and testing policy.');
   teachSetMethod('homework',homework);teachSetMethod('tests',tests);
  }else if(action==='weights')error=teachWeights([0,1,2].map(i=>Number(teachValue('weight-'+i))));
  else if(action==='project')error=teachProject(teachValue('project-type'),teachValue('project'));
  else if(action==='project-action')error=teachProjectAction(id,arg);
  else return;
 }
 if(error)return toast(error);
 draw(1);
}
function teachReply(index){
 if(publicityBusy()||!teachActive())return;
 if(teachDialog==='quit'){
  teachDialog=null;
  return quit(-1);
 }
 const s=teachState(),e=s.events.find(e=>e.id===teachDialog),result=teachResolve(s,e,index);
 if(!result.done)return toast(result.text);
 teachDialog=null;g.result={t:'Education decision',d:uiEscape(result.text)};draw();
}
function teachStory(id){teachDialog=null;newsOpenBrief(id);}
function teachNotice(id,review){
 const e=g.teacher?.events.find(x=>x.id===id);
 if(!teachEventReady(g.teacher,e))return;
 e.seen=true;
 if(review)teachDialog=e.id;
 draw(1);
}
function teachModal(s){
 if(teachDialog==='quit')return lawModal('Step down from this appointment?',
  '<p>Your credentials and career history will remain. An owned university retains its funds and operations.</p>',
  B('Confirm departure','teachReply(0)')+B('Stay in this role','teachDialog=null;draw()'));
 const e=s.events.find(x=>x.id===teachDialog);
 if(teachEventReady(s,e)){
  const [title,body,choices]=TEACH_EVENTS[e.key];
  return lawModal(title,'<p>'+uiEscape(body)+'</p>',choices.map(([name,cost],i)=>B(uiEscape(name)+(cost?' · '+loc(pr(cost)):''),`teachReply(${i})`)).join('')+
   (e.article?B('Open in the Newspaper',`teachStory('${e.article}')`):'')+B('Decide later','teachDialog=null;draw()'));
 }
 const pending=s.events.find(x=>x.age===g.age&&!x.seen&&teachEventReady(s,x));
 if(!pending)return '';
 return lawModal(TEACH_EVENTS[pending.key][0],'<p>'+uiEscape(TEACH_EVENTS[pending.key][1])+'</p>',
  B('Review decision',`teachNotice(${pending.id},true)`)+B('Decide later',`teachNotice(${pending.id},false)`));
}
