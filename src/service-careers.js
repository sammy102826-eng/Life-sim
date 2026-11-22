const SERVICE_ROLES=['Soldier','Military officer','Captain','Major','Colonel'];
const SERVICE_LISTINGS=JB.sp.filter(row=>['Military officer','Enlist as a soldier'].includes(row[0]));
for(const row of SERVICE_LISTINGS){
 const listing=[...row];
 if(row[0]==='Enlist as a soldier')listing[0]='Soldier';
 JB.ft.push(listing);
}
REQJ.Soldier=REQJ['Enlist as a soldier'];
LAD.military=[['Military officer',85000,2,0],['Captain',102000,2,3],['Major',128000,2,7],['Colonel',160000,2,13]];
for(const role of SERVICE_ROLES)CAR[role]=CAR['Military officer'];
LAD.police=[['Police officer',53000,1,0],['Detective',69000,1,3],['Senior detective',87000,1,7]];
function serviceMigrate(life){
 const job=life.job;
 if(SERVICE_ROLES.includes(job?.t)&&job.f==='military'){
  job.sp=0;
  if(job.t==='Soldier'&&!Number.isFinite(job.term))job.term=Math.max(1,4-(job.yrs||0));
 }
}
function serviceCompleteYear(){
 const job=g.job;
 if(job?.t!=='Soldier'||job.f!=='military'||job.serviceClosedAge===g.age)return;
 job.serviceClosedAge=g.age;
 if(--job.term>0)return;
 g.job=null;g.gi=true;
 L('You completed your four-year enlistment. Your tuition benefit is now active.');
}
function serviceDuties(){
 if(!g.job||g.job.f!=='military')return '';
 const actions=CAR['Military officer'].slice(0,3);
 return studioSection('Service duties',
  (g.job.t==='Soldier'?'<p>'+g.job.term+' years left in the enlistment. Finish the term to earn the tuition benefit.</p>':'')+
  actions.map((a,i)=>B(a[0],`serviceActivity(${i})`,g.serviceUsed?.[i]===g.age)).join(''));
}
function serviceActivity(index){
 if(!g.alive||g.jail||g.job?.f!=='military'||!Number.isInteger(index)||index<0||index>2||publicityBusy())return;
 const used=g.serviceUsed??={};
 if(used[index]===g.age)return toast('This service duty is complete for the year.');
 used[index]=g.age;
 cact(index);
}
