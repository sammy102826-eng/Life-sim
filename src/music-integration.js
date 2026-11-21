const musicOldWork=workV;
workV=function(){
 if(g.jail)return musicOldWork();
 musicSync();
 const active=musicActive();
 if(wsel==='music')return musicCareerView(musicState());
 if(wsel==='job'&&active)return musicOfficeView(g.music);
 const html=musicOldWork();
 if(!wsel&&wsub==='Special')return musicGo('home','Singer and bands <small>Solo music, band auditions, and releases</small>')+html;
 if(active&&!wsel&&!wsub){
  const root=document.createElement('div');root.innerHTML=html;
  const old=root.querySelector('[onclick="wsel=\'job\';draw(1)"]');
  const s=g.music,card=musicGo('home',uiEscape(musicActName(s))+' <small>'+uiEscape(g.job.t==='Musician'?'Solo singer':g.job.t)+'</small>');
  if(old){old.insertAdjacentHTML('beforebegin',card);old.remove();}
  else root.insertAdjacentHTML('afterbegin',card);
  return root.innerHTML;
 }
 return html;
};
for(const name of ['hire','collegeConfirmJob']){
 const prior=window[name];
 window[name]=function(type,index){
  if(type==='sp'&&JB.sp[index]?.[0]==='Musician'){
   g.hsPopup=null;
   return musicOpen();
  }
  return prior(type,index);
 };
}
const musicOldActions=cact;
cact=function(index){if(musicJob())return musicOpen();return musicOldActions(index);};
const musicOldSec=secV;
secV=function(path){
 if(path[0]==='Learning'&&path[2]==='Voice and instruments')return musicSkillsView();
 const html=musicOldSec(path);
 if(path[0]!=='Learning'||path[1]!=='Lessons'||path.length!==2)return html;
 return html+B('Voice and instruments',"NV.O=['Learning','Lessons','Voice and instruments'];draw(1)");
};
const musicOldBuild=buildSum;
buildSum=function(){musicYear();return musicOldBuild();};
const musicOldPrisonLedger=prisonLedger;
prisonLedger=function(s){musicYear();return musicOldPrisonLedger(s);};
const musicOldAge=ageUp;
ageUp=function(){
 if(g?.alive&&musicActive()&&musicDialog)return toast('Finish or postpone the music decision before aging up.');
 musicMigrate();
 return musicOldAge();
};
const musicOldQuit=quit;
quit=function(index){
 if(index===-1&&musicJob()){
  musicMigrate();
  const s=g.music;
  if(musicLocked(s))return toast('Your band or label agreement is still active.');
  musicEndCareer(s,'Left after contract');
  musicDialog=null;wsel=null;wsub=null;
 }
 return musicOldQuit(index);
};
const musicOldRetire=retire;
retire=function(){
 if(musicJob()&&g.music&&musicLocked(g.music))return toast('Finish the active recording and band agreements before retiring.');
 const result=musicOldRetire();
 musicSync();
 return result;
};
let musicUiLife=null;
const musicOldGame=gameView;
gameView=function(){
 if(musicUiLife!==g){musicUiLife=g;musicPage='home';musicDialog=null;}
 if(musicDialog&&!musicActive())musicDialog=null;
 const html=musicOldGame(),s=g.music;
 if(!musicActive()||g.justice?.pending||!musicDialog&&!s.events.some(e=>e.age===g.age&&!e.seen&&musicEventReady(s,e)))return html;
 const root=document.createElement('div');root.innerHTML=html;
 if(!root.querySelector('.mo')){
  const popup=musicModal(s);
  if(popup)root.querySelector('.game')?.insertAdjacentHTML('beforeend',popup);
 }
 return root.innerHTML;
};
function musicNewsEvent(article){
 return g.music?.events.find(e=>e.id===article.brief.ref&&e.article===article.id);
}
function musicNewsOptions(article){
 const e=musicNewsEvent(article);
 return e?MUSIC_EVENTS[e.key][2].map(([label],i)=>[label,'brief'+i]):[];
}
function musicNewsResolve(article,index){
 const e=musicNewsEvent(article);
 return e?musicRespond(g.music,e,index):{done:false,text:'This music decision is unavailable.'};
}
function musicValidate(life){
 const s=life.music,object=x=>x!=null&&typeof x==='object'&&!Array.isArray(x),count=x=>Number.isSafeInteger(x)&&x>=0,
  score=x=>count(x)&&x<=100,name=x=>typeof x==='string'&&x.trim().length>0,ageMap=x=>object(x)&&Object.values(x).every(count);
 if(!object(s)||s.version!==1||typeof s.id!=='string'||!/^[a-z0-9-]+$/.test(s.id)||!count(s.serial)||!count(s.lastAge)||
  ![null,'solo','band'].includes(s.mode)||!score(s.studioSkill)||!object(s.instruments)||!object(s.practice)||!ageMap(s.used)||!ageMap(s.auditions)||
  !['history','projects','events','archives','pastLabels','votes','earnings'].every(k=>Array.isArray(s[k]))||
  Object.entries(s.instruments).some(([k,x])=>k==='voice'||!Object.hasOwn(MUSIC_ROLES,k)||!score(x))||
  Object.entries(s.practice).some(([k,x])=>!Object.hasOwn(MUSIC_ROLES,k)||!object(x)||!count(x.age)||!count(x.sessions)||x.sessions>2||!count(x.lessons)||x.lessons>1)||
  s.history.some(x=>!object(x)||!count(x.age)||!name(x.text))||
  (s.mode==='band')!==!!s.band||life.job?.music&&!s.mode)throw Error('Invalid music career.');
 const band=b=>object(b)&&typeof b.id==='string'&&/^band-\d+$/.test(b.id)&&Object.hasOwn(MUSIC_BANDS,b.key)&&name(b.name)&&
  Object.hasOwn(MUSIC_ROLES,b.role)&&count(b.joined)&&count(b.end)&&score(b.cohesion)&&Array.isArray(b.members)&&b.members.length>0&&
  b.members.some(m=>m?.active===true)&&b.members.every(m=>object(m)&&count(m.id)&&name(m.name)&&Object.hasOwn(MUSIC_ROLES,m.role)&&score(m.trust)&&typeof m.active==='boolean');
 if(s.band&&!band(s.band)||s.archives.some(b=>!band(b)||!count(b.left)||!name(b.reason)))throw Error('Invalid band roster.');
 const labels=[...s.pastLabels,...(s.label?[s.label]:[])];
 const labelIds=new Set(labels.map(x=>x?.id));
 const act=id=>typeof id==='string'&&(id==='solo'||/^band-\d+$/.test(id));
 if(labelIds.size!==labels.length||labels.some(d=>!object(d)||!count(d.id)||d.id>s.serial||!Object.hasOwn(MUSIC_LABELS,d.key)||!act(d.act)||
  !count(d.end)||!count(d.recoup)||d.rate!==MUSIC_LABELS[d.key][2]))throw Error('Invalid recording agreement.');
 const ids=[...s.projects,...s.events,...s.votes,...labels,...[...s.archives,...(s.band?[s.band]:[])].flatMap(b=>b.members)];
 if(ids.some(x=>!object(x)||!count(x.id)||x.id>s.serial)||new Set(ids.map(x=>x.id)).size!==ids.length||
  s.projects.some(p=>!name(p.title)||!name(p.artist)||!act(p.act)||!MUSIC_GENRES.includes(p.genre)||!Object.hasOwn(MUSIC_FORMATS,p.format)||
   !['draft','recorded','scheduled','released','archived'].includes(p.stage)||!score(p.quality)||!count(p.age)||![0,1,2].includes(p.marketing)||
   ![p.cost,p.gross,p.earned].every(count)||!ageMap(p.used)||!Array.isArray(p.splits)||!p.splits.every(name)||
   ['recorded','scheduled','released'].includes(p.stage)&&!p.splits.length||p.label!=null&&!labelIds.has(p.label)||
   ['scheduled','released'].includes(p.stage)&&!count(p.releaseAge)||p.stage==='released'&&!count(p.initialGross))||
  s.events.some(e=>!Object.hasOwn(MUSIC_EVENTS,e.key)||!act(e.act)||!count(e.age)||typeof e.seen!=='boolean'||typeof e.closed!=='boolean'||
   e.article!=null&&!/^brief-\d+$/.test(e.article)||e.key==='reunion'&&!/^band-\d+$/.test(e.archive))||
  s.votes.some(v=>!name(v.motion)||!count(v.age)||!count(v.yes)||!count(v.needed)||!Array.isArray(v.ballots)||
   v.ballots.some(b=>!object(b)||!name(b.name)||typeof b.yes!=='boolean')||typeof v.passed!=='boolean')||
  s.earnings.some(e=>!object(e)||!name(e.title)||![e.age,e.gross,e.labelCut,e.share,e.recoup,e.received,e.members].every(count)))throw Error('Invalid music records.');
}
