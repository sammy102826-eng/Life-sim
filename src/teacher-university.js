const uniDean=()=>teachActive()&&g.teacher.assignment.role==='dean'&&!!g.teacher.campus;
function uniInitial(name,type,cash,owned){
 const founder=owned;
 return {name,type,cash,owned,country:g.country,status:founder?'private':'public',prestige:founder?37:66,
  conditions:72,independence:75,enrollment:founder?360:760,tuition:pr(founder?6900:4300),
  funding:founder?'tuition':'public',programs:[],roles:{},upgrades:[],deals:[],reports:[],ledger:{},
  pending:null,lastAge:g.age,accreditation:'Accredited',reliefUntil:null,groupSuspendedUntil:null};
}
function uniPost(c,label,value){
 c.cash+=value;
 c.ledger[label]=(c.ledger[label]||0)+value;
}
function uniSpend(c,label,amount){
 if(!c||!Number.isSafeInteger(amount)||amount<0||c.cash<amount)return false;
 uniPost(c,label,-amount);
 return true;
}
const uniProgramName=p=>p.name||UNI_PROGRAMS[p.key]?.[0]||'Academic program';
function uniStaffNeed(c){
 const colleges=new Set(c.programs.map(p=>p.college)).size,courses=c.programs.reduce((n,p)=>n+p.courses,0),n=c.enrollment;
 return {professor:Math.max(3,Math.ceil(n/38+courses/6)),janitor:Math.max(2,Math.ceil(n/135+colleges/2)),
  maintenance:Math.max(2,Math.ceil(n/195+courses/11)),security:Math.max(2,Math.ceil(n/170+colleges/2)),advising:Math.max(1,Math.ceil(n/170))};
}
function uniOpeningPrograms(c){
 const matches=Object.entries(UNI_PROGRAMS).filter(([,d])=>d[1]===c.type);
 const keys=[...new Set([...matches.map(([k])=>k),'education','business','biology'])].slice(0,c.owned?2:3);
 for(const key of keys)c.programs.push({key,college:UNI_PROGRAMS[key][1],courses:5,track:'major',rigor:53});
 const needs=uniStaffNeed(c);
 for(const key of Object.keys(UNI_ROLES))c.roles[key]=needs[key];
}
function teachDean(mode,name,type,investment){
 const s=teachState(),fee=pr(1600000);
 if(!teachCanChange()||!teachQualified('dean',s)||!['appointment','found','resume'].includes(mode))return 'A dean needs the academic track record and a free work schedule.';
 let c=s.campus;
 if(mode==='resume'){
  if(!c||!c.owned||c.country!==g.country||uniDean())return 'No owned university is available to resume.';
 }else if(mode==='found'){
  if(c?.owned)return 'You already own a university.';
  if(typeof name!=='string'||!name.trim()||name.length>65||/[<>]/.test(name)||!teachHas(UNI_TYPES,type)||
    !Number.isSafeInteger(investment)||investment<fee||investment>g.cash)return 'Enter a name and contribute at least '+loc(fee)+' from personal cash.';
  g.cash-=investment;LD('University founder investment',-investment);
  c=uniInitial(name.trim(),type,investment,true);c.ownerBasis=investment;
  uniPost(c,'Campus setup',-pr(380000));
  uniOpeningPrograms(c);
  teachNews(s,c.name+' opens its campus','The private institution announced its first degree programs and enrollment targets.');
 }else{
  if(c?.owned||uniDean())return 'You already have an institution to manage.';
  c=uniInitial('Western Plains University','broad',pr(2300000),false);uniOpeningPrograms(c);
  teachNews(s,c.name+' names a new dean','The existing university announced a new campus leadership appointment.');
 }
 s.campus=c;
 teachAssign(s,'dean',c.name,c.owned?105000:TEACH_ROLES.dean[1],0);
 return '';
}
function uniStaff(action,key){
 const c=g.teacher?.campus;
 if(!uniDean()||!teachHas(UNI_ROLES,key))return 'That staffing role is unavailable.';
 if(action==='hire'){
  if(c.roles[key]>=uniStaffNeed(c)[key]+15||!uniSpend(c,'Recruitment',pr(3200)))return 'A funded staffing vacancy is required.';
  c.roles[key]++;
 }else if(action==='fire'&&c.roles[key]>0){
  if(!uniSpend(c,'Severance',pr(UNI_ROLES[key][1]/10)))return 'The university cannot cover severance.';
  c.roles[key]--;
 }else return 'There is no employee to dismiss.';
 return '';
}
function uniUpgrade(key){
 const s=teachState(),c=s.campus,def=UNI_UPGRADES[key];
 if(!uniDean()||!def||c.upgrades.includes(key)||!uniSpend(c,def[0],pr(def[1])))return 'The project is already complete or the university cannot fund it.';
 c.upgrades.push(key);
 c.prestige=teachBound(c.prestige+def[2]);
 c.conditions=teachBound(c.conditions+5);
 teachNews(s,c.name+' opens '+def[0].toLowerCase(),'The improvement was paid from university funds and is now available on campus.');
 return '';
}
function uniProgram(action,key,track,courses,rigor,name='',college='applied'){
 const s=teachState(),c=s.campus;
 if(!uniDean()||!['major','minor'].includes(track))return 'Select an academic program and credential.';
 const existing=c.programs.find(p=>p.key===key&&p.track===track);
 if(action==='remove'){
  if(!existing||c.programs.length<=2)return 'Keep at least two programs operating.';
  c.programs=c.programs.filter(p=>p!==existing);
  c.prestige=teachBound(c.prestige-2);return '';
 }
 const def=UNI_PROGRAMS[key],custom=key==='custom';
 if(custom&&(typeof name!=='string'||!name.trim()||name.length>65||/[<>]/.test(name)||!teachHas(UNI_TYPES,college)||college==='broad'||
    c.programs.some(p=>uniProgramName(p).toLowerCase()===name.trim().toLowerCase()&&p.track===track)))return 'Enter a unique program name and choose its college.';
 if(!custom&&!def&&!existing)return 'Select an academic program and credential.';
 if(!Number.isInteger(courses)||courses<2||courses>20||!Number.isInteger(rigor)||rigor<35||rigor>95||
  !existing&&c.programs.length>=24)return 'Use 2–20 courses and an academic rigor score of 35–95.';
 const cost=pr(existing?Math.max(0,courses-existing.courses)*7500:26000+courses*7500);
 if(!uniSpend(c,existing?'Program expansion':'New degree program',cost))return 'University funds cannot cover this curriculum.';
 if(existing)Object.assign(existing,{courses,rigor});
 else{
  const entry=custom?{key:'custom-'+(++s.serial),name:name.trim(),college,track,courses,rigor}:{key,college:def[1],track,courses,rigor};
  c.programs.push(entry);
  teachNews(s,c.name+' adds an academic program',uniProgramName(entry)+' is now available as a '+track+'.');
 }
 return '';
}
function uniFunding(mode,tuition){
 const c=g.teacher?.campus;
 if(!uniDean()||!teachHas(UNI_FUNDING,mode)||!Number.isSafeInteger(tuition)||tuition<0||tuition>pr(c.status==='public'?11000:36000))return 'Enter a tuition price within the institution’s limit.';
 if(mode==='public'&&c.status==='private')return 'A charter or public status is needed for this funding source.';
 c.funding=mode;c.tuition=tuition;
 return '';
}
function uniStatus(action){
 const s=teachState(),c=s.campus;
 if(!uniDean()||c.pending||!c.owned||!['charter','public','private'].includes(action)||action===c.status||c.status==='private'&&action==='public')
  return 'That governance change is unavailable.';
 if(!uniSpend(c,'Governance application',pr(45000)))return 'The university cannot cover the application.';
 c.pending={kind:action,due:g.age+1};
 teachNews(s,c.name+' requests a governance change','The application will be reviewed during the next annual cycle.');
 return '';
}
function uniDeal(kind,country,partner,plan,price,seats){
 const s=teachState(),c=s.campus;
 if(!uniDean()||!['abroad','exchange','summer'].includes(kind)||!Object.hasOwn(g.w,country)||country===c.country||
  typeof partner!=='string'||!partner.trim()||partner.length>65||/[<>]/.test(partner)||!teachHas(UNI_TRIP_PLANS,plan)||
  !Number.isSafeInteger(price)||price<0||price>pr(10000)||!Number.isSafeInteger(seats)||seats<5||seats>120||
  c.deals.length>=15||c.deals.some(d=>d.country===country&&d.kind===kind&&d.active))return 'Choose a valid partner and program, a fee up to '+loc(pr(10000))+', and 5–120 seats.';
 if(tie(country)<20)return 'Diplomatic relations are too strained for a new agreement.';
 if(!uniSpend(c,'Program agreement',pr(30000+seats*220)))return 'University funds cannot cover the agreement.';
 c.deals.push({id:++s.serial,kind,country,partner:partner.trim(),seats,plan,price,age:g.age,active:true,last:0});
 teachNews(s,c.name+' announces a '+{abroad:'study-abroad agreement',exchange:'student exchange',summer:'summer program'}[kind],
  partner+' in '+country+' will host '+UNI_TRIP_PLANS[plan].toLowerCase()+'.',null,'international');
 return '';
}
function uniYear(s,c,active){
 if(!c||c.lastAge>=g.age)return;
 c.lastAge=g.age;
 const need=uniStaffNeed(c),short=Object.fromEntries(Object.keys(need).map(k=>[k,Math.max(0,need[k]-c.roles[k])]));
 const relief=(c.reliefUntil??-1)>=g.age?2:0;
 const wait=Math.min(c.enrollment-15,Math.max(0,short.professor-relief)*21);
 const chronic=short.maintenance*2+short.janitor;
 const safety=Math.max(0,short.security-(c.upgrades.includes('lights')?2:0));
 c.conditions=teachBound(c.conditions+(c.upgrades.includes('green')?3:1)-chronic-safety);
 c.prestige=teachBound(c.prestige+(wait>0?-4:2)+(c.conditions<48?-3:1)+(c.accreditation==='On probation'?-3:0));
 const payroll=Object.entries(UNI_ROLES).reduce((n,[k,[,pay]])=>n+c.roles[k]*pr(pay),0);
 const feePaid=Math.max(0,c.enrollment-wait),totalCourses=c.programs.reduce((n,p)=>n+p.courses,0);
 const tuition=Math.round(feePaid*c.tuition*(c.status==='public'?.78:1));
 const weights={tuition:pr(60000),donor:pr(120000+c.prestige*5400),alumni:pr(90000+c.prestige*3700),
  public:pr(c.status==='public'?1280000:625000),partner:pr(80000+c.prestige*3000+totalCourses*1900)};
 const extracurricular=c.deals.filter(d=>d.active).reduce((n,d)=>{
  d.last=Math.max(0,Math.round(d.seats*(1-Math.min(.80,d.price/Math.max(1,pr(14500))))));
  return n+d.last*(d.price-pr(d.kind==='summer'?450:750));
 },0);
 const operations=Math.round(pr(240000+TEACH_ROLES.dean[1]+totalCourses*2550+feePaid*240+(chronic+safety)*16000)*(c.austerityUntil===g.age?.88:1));
 uniPost(c,'Tuition',tuition);uniPost(c,UNI_FUNDING[c.funding],weights[c.funding]);
 uniPost(c,'Exchange and summer programs',extracurricular);
 uniPost(c,'Payroll',-payroll);uniPost(c,'Operations and repairs',-operations);
 let status=null;
 if(c.pending?.due<=g.age){
  const action=c.pending.kind;c.pending=null;
  if(action==='private'||c.prestige>=(action==='public'?62:46)&&c.conditions>=55&&c.accreditation!=='On probation'){
   c.status=action;
   if(action==='private'&&c.funding==='public')c.funding='donor';
   if(action==='public'){
    c.owned=false;c.funding='public';c.tuition=Math.min(c.tuition,pr(11000));
    const purchase=pr(950000+c.prestige*12500);
    g.cash+=purchase;LD('University state acquisition',purchase);finAdd('gains',Math.max(0,purchase-(c.ownerBasis||0)));
    if(active&&g.job)g.job.pay=TEACH_ROLES.dean[1];
   }
   status='The '+action+' governance application was approved.';
  }else status='The application was declined. Review staffing, accreditation and campus conditions.';
  teachNews(s,c.name+' receives its governance decision',status);
 }
 const rigor=c.programs.reduce((n,p)=>n+p.rigor,0)/Math.max(1,c.programs.length);
 const rigorEffect=wait||c.conditions<55?-Math.max(0,rigor-65):Math.max(0,rigor-60)*.7;
 const confidence=(c.prestige-45)*2+(c.conditions-60)+rigorEffect+
  c.programs.filter(p=>c.type==='broad'||p.college===c.type).length*5;
 if(rigor>=75&&!wait&&c.conditions>=65)c.prestige=teachBound(c.prestige+2);
 const enrollment=c.enrollment;
 c.enrollment=Math.round(cl(enrollment+confidence-Math.round(wait*.35)-Math.round(c.tuition/Math.max(1,pr(900)))+(c.reliefUntil>=g.age?24:0),100,4500));
 const net=Object.values(c.ledger).reduce((n,x)=>n+x,0);
 c.reports.unshift({age:g.age,enrollment,wait,payroll,operations,tuition,net,short,ledger:c.ledger,status});
 c.reports=c.reports.slice(0,24);c.ledger={};
 if(!active)return;
 s.respect=teachBound(s.respect+(net>=0?3:-3)+(wait?0:2));
 s.popularity=teachBound(s.popularity+(wait?-4:2)+(safety?-3:1));
 teachLog(s,'Campus report. '+enrollment+' students, '+wait+' waitlisted and '+loc(net)+' net operating movement.');
 const keys=[...(c.cash<0?['deficit']:[]),...(wait?['layoffs']:[]),...(chronic>1?['repairs']:[]),...(safety?['safety']:[]),
  ...((c.groupSuspendedUntil||0)<g.age?['hazing']:[]),'bullying','sponsor','accreditation',...(c.deals.some(d=>d.active)?['exchange']:[])];
 const available=keys.filter(k=>!s.events.some(e=>e.key===k&&(!e.closed||e.age>=g.age-2)));
 if(available.length)teachEvent(s,['deficit','layoffs','repairs','safety'].includes(available[0])?available[0]:P(available));
}

function uniOwnerTransfer(c,action,amount){
 if(!uniDean()||!c?.owned)return 'This university has no owner account to transfer funds.';
 if(!Number.isSafeInteger(amount)||amount<1)return 'Enter a positive transfer amount.';
 if(action==='contribution'){
  if(g.cash<amount)return 'Personal cash cannot cover the contribution.';
  g.cash-=amount;LD('University owner contribution',-amount);
  c.ownerBasis=(c.ownerBasis||0)+amount;uniPost(c,'Personal contribution',amount);
 }else if(action==='distribution'){
  if(c.status!=='private')return 'Only a privately owned university can withdraw owner funds.';
  const reserve=pr(10000)+Object.entries(c.roles).reduce((n,[key,count])=>n+Math.round(pr(UNI_ROLES[key][1])*count/12),0);
  if(c.cash-amount<reserve)return 'Leave the operating reserve and one month of payroll in university funds.';
  uniPost(c,'Owner distribution',-amount);
  finOwnerDistribution(amount,'University owner distribution','University distribution tax');
 }else return 'Unknown transfer type.';
 return '';
}
