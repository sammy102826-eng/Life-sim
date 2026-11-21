const teachOldMajors=collegeAllowedMajors;
collegeAllowedMajors=function(level){
 const list=teachOldMajors(level);
 return level==='masters'?[...new Set(['Education',...list])]:list;
};
const teachOldCollege=collegeCurrentPage;
collegeCurrentPage=function(){
 const html=teachOldCollege(),c=g.collegeTrack?.current;
 if(!c||!['current','home','study','coursework'].includes(collegePage)||!['university','ivy','masters'].includes(c.level))return html;
 return html+teachSection('Teaching subject',teachSubjectView(teachState()));
};
const teachOldWork=workV;
workV=function(){
 if(g.jail)return teachOldWork();
 if(wsel==='teacher-career')return teachCareerView();
 const active=teachActive();
 if(active&&(wsel==='teacher'||wsel==='job'))return teachOfficeView(g.teacher);
 const html=teachOldWork();
 if(!wsel&&wsub==='Special')return B('Teacher <small>School teaching, university faculty, and campus leadership</small>','teachOpenCareer()')+html;
 if(active&&!wsel&&!wsub){
  const node=document.createElement('div');node.innerHTML=html;
  const old=node.querySelector('[onclick="wsel=\'job\';draw(1)"]');
  const button=teachGo('home',uiEscape(g.teacher.assignment.school)+' <small>'+uiEscape(g.job.t)+' · Respect '+g.teacher.respect+'/100</small>');
  if(old){old.insertAdjacentHTML('beforebegin',button);old.remove();}
  else node.insertAdjacentHTML('afterbegin',button);
  return node.innerHTML;
 }
 return html;
};
const teachOldBuild=buildSum;
buildSum=function(){teachYear();return teachOldBuild();};
const teachOldQuit=quit;
quit=function(index){
 if(index===-1&&teachJob()){
  const s=g.teacher;
  if(s?.assignment)teachLog(s,'You left your teaching appointment at '+s.assignment.school+'.');
  if(s)for(const e of s.events)e.closed=true;
  teachDialog=null;wsel=null;wsub=null;
 }
 return teachOldQuit(index);
};
const teachOldPromo=promo;
promo=function(){if(teachJob())return teachOpenCareer();return teachOldPromo();};
const teachOldAge=ageUp;
ageUp=function(){
 if(g?.alive&&teachDialog&&!g.jail)return toast('Finish or postpone your teaching decision before aging up.');
 return teachOldAge();
};
let teachUiLife=null;
const teachOldGame=gameView;
gameView=function(){
 if(teachUiLife!==g){teachUiLife=g;teachPage='home';teachDialog=null;}
 const html=teachOldGame(),s=g.teacher;
 if(!teachActive()||g.justice?.pending||!teachDialog&&!s.events.some(x=>x.age===g.age&&!x.seen&&teachEventReady(s,x)))return html;
 const root=document.createElement('div');root.innerHTML=html;
 if(!root.querySelector('.mo')){
  const popup=teachModal(s);
  if(popup)root.querySelector('.game')?.insertAdjacentHTML('beforeend',popup);
 }
 return root.innerHTML;
};
function teachNewsEvent(article){
 return g.teacher?.events.find(x=>x.id===article.brief.ref&&x.article===article.id);
}
function teachNewsOptions(article){
 const e=teachNewsEvent(article);
 return e?TEACH_EVENTS[e.key][2].map(([l,cost],i)=>[l+(cost?' · '+loc(pr(cost)):''),'brief'+i]):[];
}
function teachNewsResolve(article,index){
 const e=teachNewsEvent(article);
 return e?teachResolve(g.teacher,e,index):{done:false,text:'This education decision is unavailable.'};
}
function uniValue(c){
 return Math.max(0,Math.round(c.cash+pr(360000+c.upgrades.length*70000+c.programs.length*24000)));
}
const teachOldWorth=nw;
nw=function(){const c=g.teacher?.campus;return teachOldWorth()+(c?.owned?uniValue(c):0);};
function teachValidate(life){
 const s=life.teacher,object=x=>x&&typeof x==='object'&&!Array.isArray(x),count=x=>Number.isSafeInteger(x)&&x>=0,
  pct=x=>count(x)&&x<=100,word=x=>typeof x==='string'&&x.trim().length>0,country=x=>word(x)&&Object.hasOwn(life.w||{},x);
 const roles=Object.keys(TEACH_ROLES);
 if(!object(s)||s.version!==1||!teachHas(TEACH_SUBJECTS,s.subject)||!count(s.serial)||!count(s.lastAge)||
  ![s.respect,s.popularity].every(pct)||![s.schoolYears,s.professorYears,s.publications].every(count)||
  !['students','staff','reports','events','projects','history'].every(k=>Array.isArray(s[k]))||!object(s.used)||
  s.license!=null&&!country(s.license)||!object(s.methods)||
  !teachHas(TEACH_METHODS,s.methods.style)||!teachHas(TEACH_HOMEWORK,s.methods.homework)||!teachHas(TEACH_TESTS,s.methods.tests)||
  !Array.isArray(s.methods.weights)||s.methods.weights.length!==3||!s.methods.weights.every(pct)||
  s.methods.weights.reduce((n,x)=>n+x,0)!==100)throw Error('Invalid teaching career.');
 const a=s.assignment;
 if(life.job?.teaching&&!a||a&&(!object(a)||!roles.includes(a.role)||!word(a.school)||!country(a.country)||
  !count(a.start)||!count(a.index)||a.role==='dean'&&!s.campus||a.role!=='dean'&&!object(s.supervisor)))throw Error('Invalid academic appointment.');
 const c=s.campus,ids=[...s.students,...s.staff,...s.events,...s.projects,...(Array.isArray(c?.deals)?c.deals:[])];
 if(ids.some(x=>!object(x)||!count(x.id)||x.id>s.serial)||new Set(ids.map(x=>x.id)).size!==ids.length||
  s.students.some(x=>!word(x.name)||!pct(x.engagement)||!pct(x.skill)||!pct(x.support)||!Array.isArray(x.work)||x.work.length!==3||
   !x.work.every(pct)||x.mark!==null&&!pct(x.mark))||
  s.staff.some(x=>!word(x.name)||!word(x.role)||!pct(x.bond))||
  s.events.some(x=>!teachHas(TEACH_EVENTS,x.key)||!word(x.school)||!roles.includes(x.role)||!count(x.age)||
    typeof x.closed!=='boolean'||typeof x.seen!=='boolean')||
  s.projects.some(x=>!word(x.name)||!teachHas(TEACH_PROJECTS,x.key)||!teachHas(TEACH_SUBJECTS,x.subject)||!pct(x.progress)||
   !pct(x.quality)||!['active','published'].includes(x.status)||!object(x.used)))throw Error('Invalid teaching records.');
 if(c==null)return;
 if(!object(c)||!word(c.name)||!country(c.country)||!teachHas(UNI_TYPES,c.type)||!teachHas(UNI_FUNDING,c.funding)||
  !['private','charter','public'].includes(c.status)||typeof c.owned!=='boolean'||!Number.isSafeInteger(c.cash)||
  ![c.prestige,c.conditions,c.independence].every(pct)||![c.enrollment,c.tuition,c.lastAge].every(count)||
  !['programs','upgrades','deals','reports'].every(k=>Array.isArray(c[k]))||!object(c.roles)||!object(c.ledger)||
  Object.keys(UNI_ROLES).some(k=>!count(c.roles[k]))||
  c.programs.some(p=>!object(p)||!(teachHas(UNI_PROGRAMS,p.key)&&p.college===UNI_PROGRAMS[p.key][1]||
    /^custom-\d+$/.test(p.key)&&word(p.name)&&teachHas(UNI_TYPES,p.college)&&p.college!=='broad')||
    !['major','minor'].includes(p.track)||!count(p.courses)||p.courses<2||p.courses>20||!pct(p.rigor))||
  c.upgrades.some(k=>!teachHas(UNI_UPGRADES,k))||
  c.deals.some(d=>!['abroad','exchange','summer'].includes(d.kind)||!word(d.partner)||!country(d.country)||!teachHas(UNI_TRIP_PLANS,d.plan)||
   ![d.seats,d.price,d.age,d.last].every(count)||typeof d.active!=='boolean')||
  c.reports.some(r=>!object(r)||!count(r.age)||!count(r.wait)||!object(r.ledger)||!object(r.short))||
  c.pending!=null&&(!object(c.pending)||!['private','charter','public'].includes(c.pending.kind)||!count(c.pending.due)))throw Error('Invalid university records.');
}
