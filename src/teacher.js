const teachHas=(table,k)=>Object.hasOwn(table,k);
const teachBound=n=>Math.round(cl(n,0,100));
const teachJob=()=>g.job?.teaching===true;
const teachActive=()=>teachJob()&&!!g.teacher?.assignment&&!g.jail&&!g.ret&&g.office<0&&!royalRestricted();
const teachK12=s=>['elementary','middle','high'].includes(s.assignment?.role);
function teachState(){
 return g.teacher??={version:1,subject:'broad',license:null,assignment:null,campus:null,schoolYears:0,professorYears:0,
  respect:48,popularity:50,serial:0,students:[],staff:[],supervisor:null,reports:[],events:[],projects:[],history:[],
  methods:{style:'balanced',homework:'standard',tests:'standard',weights:[30,45,25]},used:{},lastAge:g.age,publications:0};
}
function teachDegrees(){
 const recorded=g.collegeTrack?.degrees||[];
 const old=g.deg||[];
 return {bachelor:recorded.findLast(d=>d.level==='bachelor')||old.some(d=>/^Bachelor\b/i.test(d))&&{major:g.maj||'Education',minor:'None'},
  master:recorded.some(d=>d.level==='master'&&d.major==='Education')||old.some(d=>/^Master(?: of|’s in|\x27s in) Education$/i.test(d))};
}
function teachGpa(){
 const school=g.highSchool;
 return school?.finished||school?.graduated?school.gpa:g.edu>=1?g.gpa:0;
}
function teachRequirements(role,s=teachState()){
 const edu=teachDegrees(),prof=['professor','dean'].includes(role);
 const common=[['High school GPA at least 2.5',teachGpa()>=2.5],['Bachelor’s degree',!!edu.bachelor]];
 if(prof)common.push(['Master’s degree in Education',edu.master],['Three years of school teaching',s.schoolYears>=3]);
 else common.push(['Teaching certification exam',!!g.pass['Teaching certification']],['Active teaching license',s.license===g.country]);
 if(role==='dean')common.push(['Three years teaching at a university',s.professorYears>=3],['Respect 68 or higher',s.respect>=68],['One completed academic project',s.publications>0]);
 return common;
}
const teachQualified=(role,s)=>teachRequirements(role,s).every(([,met])=>met);
function teachLicense(){
 const s=teachState(),fee=pr(450);
 if(g.jail||royalRestricted()||teachGpa()<2.5||!teachDegrees().bachelor||!g.pass['Teaching certification']||g.rec>0||g.cash<fee)
  return 'Licensing requires a 2.5 high school GPA, a bachelor’s degree, teaching certification, an eligible record and '+loc(fee)+'.';
 if(s.license===g.country)return 'Your teaching license is already active here.';
 g.cash-=fee;LD('Teaching license registration',-fee);s.license=g.country;if(!g.lic.includes('Teaching license'))g.lic.push('Teaching license');
 teachLog(s,'You registered a teaching license in '+g.country+'.');
 return '';
}
function teachLog(s,text){
 s.history.unshift({age:g.age,text});s.history=s.history.slice(0,50);
 L(uiEscape(text));
}
function teachNews(s,title,text,event=null,kind='education'){
 return newsPublish(kind,title,text,event?{type:'teacherEvent',ref:event.id}:null,'teacher-'+g.age+'-'+(++s.serial));
}
function teachEvent(s,key){
 const def=TEACH_EVENTS[key],a=s.assignment;
 if(!def||s.events.some(e=>e.key===key&&!e.closed))return null;
 const e={id:++s.serial,key,age:g.age,school:a.school,role:a.role,closed:false,seen:false,article:null};
 s.events.push(e);
 if(def[3])e.article=teachNews(s,def[0],a.school+'. '+def[1],e,['layoffs','repairs','safety','sponsor','exchange','accreditation'].includes(key)?'government':'education');
 if(s.events.length>70){const first=s.events.findIndex(x=>x.closed);if(first>=0)s.events.splice(first,1);}
 return e;
}
function teachPeople(s){
 const university=s.assignment.role==='professor';
 const size=university?10:8;
 s.students=Array.from({length:size},()=>{
  const skill=R(42,86);
  return {id:++s.serial,name:nm2(),skill,engagement:R(33,75),support:0,work:[skill+R(-13,10),skill+R(-16,12),skill+R(-18,14)].map(teachBound),mark:null,used:{}};
 });
}
function teachColleagues(s){
 s.staff=Array.from({length:4},(_,i)=>({id:++s.serial,name:nm2(),role:s.assignment.role==='professor'?
  ['Faculty mentor','Lecturer','Program chair','Academic advisor'][i]:['Department lead','Classroom teacher','School counselor','Learning support teacher'][i],bond:R(39,63),friend:null}));
 s.supervisor={name:nm2(),bond:55};
}
function teachCanChange(){
 return g.age>=21&&g.alive&&!g.jail&&!g.ret&&!royalRestricted()&&g.office<0&&!g.study&&!g.collegeTrack?.current&&!g.intern&&
  !g.pt.length&&(!g.job||teachJob())&&!g.educationJourney?.internships?.some(i=>i.status==='Active');
}
function teachSubjectOptions(){
 const edu=teachDegrees().bachelor,c=g.collegeTrack?.current,areas=[edu?.major,edu?.minor,c?.major,c?.minor,g.maj];
 return Object.entries(TEACH_SUBJECTS).filter(([key,[,majors]])=>key==='broad'||areas.some(x=>majors.includes(x)));
}
function teachAssign(s,role,school,pay,index){
 const changed=s.assignment?.school!==school||s.assignment.role!==role;
 if(changed)for(const e of s.events)if(!e.closed)e.closed=true;
 s.assignment={role,school,index,start:g.age,country:g.country};
 s.lastAge=g.age;s.used={};
 g.job={t:TEACH_ROLES[role][0],f:'education',company:school,companyId:uid(),pay,yrs:0,teaching:true};
 g.ue=false;
 if(role!=='dean'){teachPeople(s);teachColleagues(s);}
 teachLog(s,'You began working as '+TEACH_ROLES[role][0].toLowerCase()+' at '+school+'.');
}
function teachHire(role,index=0){
 const s=teachState();
 if(!teachHas(TEACH_ROLES,role)||role==='dean'||!teachCanChange()||!teachQualified(role,s))return 'The required qualifications or work schedule are missing.';
 if(teachActive()&&s.assignment.role==='dean')return 'Step down as dean before taking a teaching post.';
 if(!teachSubjectOptions().some(([k])=>k===s.subject))s.subject='broad';
 const university=role==='professor',rank=TEACH_INSTITUTIONS[index];
 if(university&&(!rank||s.professorYears<rank[1]||s.respect<rank[3]))return 'This university requires more experience or faculty respect.';
 if(teachActive()&&role===s.assignment.role&&index===s.assignment.index)return 'You already teach at this institution.';
 const name=university?rank[0]:(g.city||'Local')+' '+{elementary:'Elementary School',middle:'Middle School',high:'High School'}[role];
 teachAssign(s,role,name,university?rank[2]:TEACH_ROLES[role][1],university?index:0);
 if(university&&index>=2)teachNews(s,'Faculty appointment announced',schoolArticle(name));
 return '';
}
function schoolArticle(name){return name+' announced a faculty appointment in '+TEACH_SUBJECTS[teachState().subject][0].toLowerCase()+'.';}
function teachSetMethod(key,value){
 const s=teachState(),m=s.methods,defs={style:TEACH_METHODS,homework:TEACH_HOMEWORK,tests:TEACH_TESTS};
 if(!teachActive()||s.assignment.role==='dean'||!defs[key]||!teachHas(defs[key],value))return 'Choose an available teaching policy.';
 m[key]=value;return '';
}
function teachWeights(weights){
 if(!teachActive()||teachState().assignment.role==='dean'||weights.some(n=>!Number.isSafeInteger(n)||n<0||n>100)||weights.reduce((n,x)=>n+x,0)!==100)
  return 'Whole-number weights must add up to 100%.';
 teachState().methods.weights=weights;return '';
}
function teachScore(s,student){
 const method=TEACH_METHODS[s.methods.style],work=TEACH_HOMEWORK[s.methods.homework],test=TEACH_TESTS[s.methods.tests];
 const marks=[student.work[0]+method[1]+work[1]+test[1],student.work[1]+method[2]+work[2]+test[2],
  student.work[2]+method[3]+work[3]+test[3]+(student.engagement-50)/9];
 return teachBound(marks.reduce((n,x,i)=>n+teachBound(x)*s.methods.weights[i]/100,0)+student.support);
}
function teachGrade(id){
 const s=teachState(),p=s.students.find(x=>x.id===id);
 if(!teachActive()||s.assignment.role==='dean'||!p||p.mark!==null)return 'This work is already graded or unavailable.';
 p.mark=teachScore(s,p);
 return '';
}
function teachOnce(s,key,limit=1){
 const entry=s.used[key]??={age:g.age,count:0};
 if(entry.age!==g.age){entry.age=g.age;entry.count=0;}
 if(entry.count>=limit)return false;
 entry.count++;return true;
}
function teachInteract(action,id=0){
 const s=teachState(),role=s.assignment?.role,p=s.students.find(x=>x.id===id),staff=s.staff.find(x=>x.id===id);
 if(!teachActive()||role==='dean')return 'The classroom is unavailable.';
 const defs={study:[5,3,1],guidance:[3,5,1],praise:[1,7,0],meeting:[4,3,3],skills:[6,4,1]};
 if(p&&teachHas(defs,action)){
  if(action==='meeting'&&!teachK12(s))return 'University students manage their own advising appointments.';
  if(!teachOnce(s,action+'-'+id))return 'You already held this conversation this year.';
  const [support,engagement,respect]=defs[action];
  p.support=Math.min(14,p.support+support);p.engagement=teachBound(p.engagement+engagement);
  s.respect=teachBound(s.respect+respect);s.popularity=teachBound(s.popularity+1);
 }else if(action==='hours'){
  if(!teachOnce(s,'hours',3))return 'You have used the three office-hour blocks for this year.';
  const attending=s.students.slice().sort((a,b)=>teachScore(s,a)-teachScore(s,b)).slice(0,3);
  attending.forEach(x=>{x.support=Math.min(14,x.support+3);x.engagement=teachBound(x.engagement+4);});
  s.popularity=teachBound(s.popularity+2);
 }else if(staff&&['chat','mentor','friend'].includes(action)){
  if(action==='friend'){
   if(staff.bond<74||staff.friend)return 'Build a stronger working relationship first.';
   const friend={id:uid(),n:staff.name,age:Math.max(24,g.age+R(-5,6)),t:'fri',role:'Friend',bond:staff.bond,alive:true,m:0};
   staff.friend=friend.id;g.rel.push(friend);
   teachLog(s,staff.name+' became a friend outside work.');
  }else{
   if(!teachOnce(s,'staff-'+id,2))return 'You already had two staff meetings this year.';
   staff.bond=teachBound(staff.bond+8);
   const friend=g.rel.find(r=>r.id===staff.friend);
   if(friend?.alive){friend.bond=staff.bond;genContact(friend,1);}
   if(action==='mentor'){s.respect=teachBound(s.respect+2);s.students.forEach(x=>x.support=Math.min(14,x.support+1));}
  }
 }else if(['support','resources','observe'].includes(action)){
  if(!teachOnce(s,'supervisor-'+action))return 'The supervisor has already reviewed this request this year.';
  s.supervisor.bond=teachBound(s.supervisor.bond+6);
  s.respect=teachBound(s.respect+(action==='observe'?4:2));
  const targets=action==='support'&&p?[p]:s.students;
  targets.forEach(x=>x.support=Math.min(14,x.support+(action==='resources'?2:1)));
 }else return 'This interaction is unavailable.';
 return '';
}
function teachProject(key,name){
 const s=teachState(),def=TEACH_PROJECTS[key];
 if(!teachActive()||s.assignment.role!=='professor'||!def||typeof name!=='string'||!name.trim()||name.length>65||/[<>]/.test(name)||
  s.projects.filter(p=>p.status==='active').length>=3||s.projects.some(p=>p.name.toLowerCase()===name.trim().toLowerCase()))return 'Choose a unique project title and an available research slot.';
 s.projects.push({id:++s.serial,key,name:name.trim(),subject:s.subject,progress:0,quality:def[2],used:{},status:'active',year:g.age});
 return '';
}
function teachProjectAction(id,mode){
 const s=teachState(),p=s.projects.find(x=>x.id===id&&x.status==='active');
 if(!teachActive()||s.assignment.role!=='professor'||!p||!['work','review','partner','publish'].includes(mode))return 'This academic project is unavailable.';
 if(mode==='publish'){
  if(p.progress<100||p.quality<60)return 'A submission needs completed work and quality of at least 60.';
  p.status='published';p.published=g.age;s.publications++;
  s.respect=teachBound(s.respect+6);
  if(p.quality>=75||p.key==='open')teachNews(s,p.name+' is published','Faculty at '+s.assignment.school+' published new work in '+TEACH_SUBJECTS[p.subject][0].toLowerCase()+'.');
  teachLog(s,'You published '+p.name+'.');
  return '';
 }
 if(p.used[mode]===g.age)return 'This project action has already been used this year.';
 p.used[mode]=g.age;
 if(mode==='work')p.progress=Math.min(100,p.progress+23);
 if(mode==='review'){p.quality=teachBound(p.quality+9);p.progress=Math.min(100,p.progress+8);}
 if(mode==='partner'){p.quality=teachBound(p.quality+5);p.progress=Math.min(100,p.progress+13);s.popularity=teachBound(s.popularity+2);}
 return '';
}
function teachClassYear(s){
 const submitted=s.students.filter(x=>x.mark!==null).length;
 const final=s.students.map(x=>x.mark??teachScore(s,x));
 const average=Math.round(final.reduce((n,x)=>n+x,0)/Math.max(1,final.length));
 const pass=final.filter(mark=>mark>=60).length;
 s.respect=teachBound(s.respect+(average>=68?4:-1)+(submitted>=Math.ceil(final.length*.75)?3:-3));
 s.popularity=teachBound(s.popularity+(average>=70?3:0)+(TEACH_HOMEWORK[s.methods.homework][3]>=3?2:-1));
 s.reports.unshift({age:g.age,role:s.assignment.role,school:s.assignment.school,average,pass,size:final.length,submitted,
  marks:s.students.map((p,i)=>({name:p.name,mark:final[i]}))});
 s.reports=s.reports.slice(0,30);
 teachLog(s,'Class report at '+s.assignment.school+'. Average '+average+'%, '+pass+' of '+final.length+' passed, and '+submitted+' submissions were graded by you.');
 if(s.assignment.role==='professor'){
  s.professorYears++;
  for(const p of s.projects.filter(x=>x.status==='active'))p.progress=Math.min(100,p.progress+TEACH_PROJECTS[p.key][1]);
 }else s.schoolYears++;
 teachPeople(s);
 const keys=s.assignment.role==='professor'?['support','copying','invited','review','device']:['support','family','copying','device'];
 const available=keys.filter(k=>!s.events.some(e=>e.key===k&&(!e.closed||e.age>=g.age-2)));
 if(available.length&&ch(72))teachEvent(s,P(available));
}
function teachEventReady(s,e){
 return !!e&&!e.closed&&teachActive()&&e.school===s.assignment.school&&e.role===s.assignment.role;
}
function teachResolve(s,e,i){
 const def=e&&TEACH_EVENTS[e.key],choice=def?.[2][i];
 if(!teachEventReady(s,e)||!choice)return {done:false,text:'This decision is unavailable.'};
 const [label,cost,respect,popularity,impact]=choice,c=s.campus;
 if(cost&&!uniSpend(c,label,pr(cost)))return {done:false,text:'The university budget cannot cover that response.'};
 s.respect=teachBound(s.respect+respect);
 s.popularity=teachBound(s.popularity+popularity);
 if(e.role==='dean'){
  c.conditions=teachBound(c.conditions+impact);
  c.prestige=teachBound(c.prestige+Math.sign(respect)*2);
  if(e.key==='sponsor'&&i!==2){
   uniPost(c,'Conditional gifts',pr(i===0?190000:340000));
   c.independence=teachBound(c.independence+(i===0?3:-15));
  }
  if(e.key==='exchange'&&i!==0){
   const deal=c.deals.find(d=>d.kind!=='summer'&&d.active);
   if(deal){if(i===1)deal.seats=Math.max(5,Math.floor(deal.seats/2));else deal.active=false;}
  }
  if(e.key==='deficit'&&i<2){
   if(i===0)uniPost(c,'Emergency operating support',pr(210000));
   else c.austerityUntil=g.age+1;
  }
  if(e.key==='hazing'&&i<2)c.groupSuspendedUntil=g.age+2;
  if(e.key==='accreditation')c.accreditation=i===0?'Accredited':i===1?'Under review':'On probation';
  if(['layoffs','repairs','safety'].includes(e.key)&&i!==2)c.reliefUntil=g.age+1;
 }else{
  for(const p of s.students)p.support=teachBound(Math.min(14,p.support+impact));
  if(e.key==='review'&&i<2){
   const p=s.projects.find(x=>x.published===g.age||x.status==='active');
   if(p)p.quality=teachBound(p.quality+4);
  }
 }
 e.closed=true;
 teachLog(s,label+'.');
 if(e.article)teachNews(s,s.assignment.school+' issues a response',label+'.');
 return {done:true,text:label+'.'};
}
function teachYear(){
 const s=g.teacher;
 if(!s||s.lastAge>=g.age)return;
 s.lastAge=g.age;
 if(s.campus?.owned&&!uniDean())uniYear(s,s.campus,false);
 if(!teachActive())return;
 if(s.assignment.country!==g.country&&teachK12(s)){g.job=null;return;}
 if(s.assignment.role==='dean')uniYear(s,s.campus,true);
 else teachClassYear(s);
}
