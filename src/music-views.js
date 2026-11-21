const MUSIC_PAGES={home:'Overview',band:'Band and votes',auditions:'Band auditions',training:'Voice and instruments',label:'Record labels',
 records:'Songs and releases',shows:'Gigs and tours',money:'Music earnings',events:'Decisions and news'};
let musicPage='home',musicDialog=null;
const musicPanel=(title,html)=>studioSection(title,html);
const musicBtn=(t,action,key='',id=0,off=false)=>B(t,`musicAction('${action}','${key}',${id})`,off);
const musicSelect=(id,label,rows)=>studioSelect('music-'+id,label,rows);
const musicVal=id=>document.getElementById('music-'+id)?.value;
function musicOpen(page='home'){
 if(!Object.hasOwn(MUSIC_PAGES,page))return;
 musicPage=page;tab='Work';wsel='music';wsub=null;draw(1);
}
const musicGo=(page,title=MUSIC_PAGES[page])=>B(title,`musicOpen('${page}')`);
function musicSkillsView(){
 const s=musicState();
 return musicPanel('Voice and instruments',Object.entries(MUSIC_ROLES).map(([key,[name,cost]])=>{
  const p=s.practice[key],today=p?.age===g.age,skill=musicSkill(s,key);
  return '<details class="card"><summary>'+name+' · '+skill+'/100</summary>'+
   musicBtn('Practice '+name.toLowerCase(),'practice',key,0,g.age<musicTrainingAge(key)||skill>=100||today&&p.sessions>=2)+
   musicBtn('Take a lesson · '+(g.age<14?'Covered by family':loc(pr(cost))),'lesson',key,0,g.age<musicTrainingAge(key)||skill>=100||today&&p.lessons>=1)+'</details>';
 }).join(''));
}
function musicAuditionsView(s){
 return musicPanel('Auditions', '<p>A successful audition starts a two-year band agreement. Audition for vocals or an open instrument.</p>'+
  Object.entries(MUSIC_BANDS).map(([key,[name,genre,skill,roles]])=>
   `<details class="card"><summary>${uiEscape(name)} · ${genre}</summary><p>Minimum skill ${skill}/100.</p>`+
   roles.map(role=>musicBtn('Audition for '+MUSIC_ROLES[role][0].toLowerCase()+' · '+musicSkill(s,role)+'/100','audition',key,
    Object.keys(MUSIC_ROLES).indexOf(role),!musicAccess()||musicLocked(s)||musicSkill(s,role)<skill||
     s.auditions[key]===g.age||s.band?.key===key)).join('')+'</details>').join(''));
}
function musicBandView(s){
 const b=s.band;
 return (b?musicPanel(b.name,'<p>'+b.genre+' · Contract until age '+b.end+' · Your role '+MUSIC_ROLES[b.role][0]+'.</p>'+
  Bar('Cohesion',b.cohesion,'#4FB39A')+musicBtn('Rehearse together','band-action','rehearse',0,s.used.rehearse===g.age)+
  musicMembers(s).map(m=>`<details class="card"><summary>${uiEscape(m.name)} · ${MUSIC_ROLES[m.role][0]}</summary><p>Trust ${m.trust}/100</p>`+
   musicBtn('Talk about the direction of the band','band-action','discuss',m.id)+
   musicBtn('Propose removing this member','band-action','remove',m.id,musicMembers(s).length<=1)+'</details>').join('')+
  musicBtn('Propose inviting a new bandmate','band-action','invite',0,musicMembers(s).length>=4||s.used.invite===g.age)+
  musicBtn('Put a breakup to a vote','band-action','disband',0,musicLocked(s)||s.used.disband===g.age)+
  musicBtn('Leave the band and go solo','solo','',0,musicLocked(s))):'<p>You are currently a solo artist.</p>')+
  musicPanel('Votes',s.votes.slice(0,10).map(v=>`<details class="card"><summary>${uiEscape(v.motion)} · ${v.passed?'Passed':'Failed'}</summary>
  <p>${v.yes} yes votes · ${v.needed} needed.</p>${v.ballots.map(x=>'<p>'+uiEscape(x.name)+' · '+(x.yes?'Yes':'No')+'</p>').join('')}</details>`).join('')||'<p>No votes have been held yet.</p>')+
  (s.archives.length?musicPanel('Former bands',s.archives.map(a=>'<p>'+uiEscape(a.name)+' · '+a.reason+' · Age '+a.left+'</p>').join('')):'');
}
function musicLabelView(s){
 if(s.label&&s.label.end>g.age)return musicPanel(MUSIC_LABELS[s.label.key][0],studioStats([['Contract ends','Age '+s.label.end],
  ['Label share of recording revenue',s.label.rate+'%'],['Remaining advance to recoup',loc(s.label.recoup)]])+
  '<p>The label reviews recording and release proposals. Live shows are governed by the act.</p>');
 return musicPanel('Available recording agreements','<p>Independent releases are available without signing a deal.</p>'+
  Object.entries(MUSIC_LABELS).map(([key,[name,years,rate,amount,threshold]])=>'<details class="card"><summary>'+name+' · '+years+' years</summary>'+
   '<p>'+rate+'% recording revenue share · '+loc(pr(amount))+' advance shared by the act · Combined skill and audience '+threshold+' needed.</p>'+
   musicBtn('Sign with '+name,'sign',key,0,s.used.label===g.age)+'</details>').join(''));
}
function musicProjectsView(s){
 const act=musicAct(s),p=s.projects.slice().reverse();
 return musicPanel('Write a release','<label for="music-title">Project title</label><input class="txt" id="music-title" maxlength="60">'+
  musicSelect('genre','Genre',MUSIC_GENRES.map(g=>[g,g]))+
  musicSelect('format','Format',Object.entries(MUSIC_FORMATS).map(([k,d])=>[k,d[0]]))+musicBtn('Start writing','project'))+
  p.map(x=>{
   const assigned=x.act===act,spl=x.splits.length;
   const label={draft:'Writing',recorded:'Recorded',scheduled:'Scheduled',released:'Released',archived:'Archived'}[x.stage];
   const canRefine=assigned&&['draft','recorded'].includes(x.stage);
   const production=Math.round(Math.ceil(pr(MUSIC_FORMATS[x.format][1])/(musicMembers(s).length+1))*(s.label?.act===x.act&&s.label.end>g.age ? .65 : 1));
   return `<details class="card"><summary>${uiEscape(x.title)} · ${label}</summary><p>${uiEscape(x.artist)} · ${x.genre} · ${MUSIC_FORMATS[x.format][0]} · Quality ${x.quality}/100.</p>`+
    (spl?'<p>Credits · '+x.splits.map(uiEscape).join(', ')+'</p>':'')+
    (x.stage==='scheduled'?'<p>Due to release at age '+x.releaseAge+'.</p>':'')+
    (x.stage==='released'?'<p>Lifetime gross '+loc(x.gross)+' · Your receipts '+loc(x.earned)+' · Your costs '+loc(x.cost)+'.</p>':'')+
    (canRefine?musicBtn('Revise the material','project-step','refine',x.id,x.used.refine===g.age):'')+
    (assigned&&x.stage==='draft'?musicBtn('Submit recording proposal · '+loc(production),'project-step','produce',x.id,x.used.produce===g.age):'')+
    (assigned&&x.stage==='recorded'?musicSelect('marketing-'+x.id,'Release marketing',[[0,'Independent announcement'],[1,'Local promotion'],[2,'Expanded campaign']])+
     musicBtn('Submit release proposal','project-step','release',x.id,x.used.release===g.age):'')+'</details>';
  }).join('');
}
function musicOfficeView(s){
 const page=musicPage;
 let html;
 if(page==='home')html=musicPanel(musicActName(s),'<p>'+(s.mode==='band'?'Band · '+MUSIC_ROLES[s.band.role][0]:'Solo singer')+
  ' · '+(s.label&&s.label.end>g.age?'Signed with '+MUSIC_LABELS[s.label.key][0]:'Independent')+'</p>'+
  Bar('Audience',g.fm||0,GOLD)+Bar('Studio skill',s.studioSkill,'#4FB39A')+
  Object.keys(MUSIC_PAGES).filter(x=>x!=='home').map(x=>musicGo(x)).join('')+musicBtn('Leave the music career','quit','',0,musicLocked(s)));
 else if(page==='band')html=musicBandView(s);
 else if(page==='auditions')html=musicAuditionsView(s);
 else if(page==='training')html=musicSkillsView();
 else if(page==='label')html=musicLabelView(s);
 else if(page==='records')html=musicProjectsView(s);
 else if(page==='shows')html=musicPanel('Live performances','<p>Act members split expenses and receipts. Band tours require a vote.</p>'+
  musicBtn('Book a local gig','show','show',0,s.used.show===g.age)+musicBtn('Propose a tour','show','tour',0,s.used.tour===g.age));
 else if(page==='money')html=musicPanel('Receipts and splits',s.earnings.slice(0,16).map(x=>`<p>Age ${x.age} · <b>${uiEscape(x.title)}</b> · Gross ${loc(x.gross)} · Label ${loc(x.labelCut)}<br>
  ${x.members}-way split · Your share ${loc(x.share)} · Advance recouped ${loc(x.recoup)} · Received ${loc(x.received)}</p>`).join('')||'<p>No receipts yet.</p>');
 else html=musicPanel('Pending decisions',s.events.filter(e=>musicEventReady(s,e)).map(e=>musicBtn(MUSIC_EVENTS[e.key][0],'event','',e.id)).join('')||'<p>No decisions waiting.</p>')+
  musicPanel('Recent activity',s.history.slice(0,12).map(x=>'<p>Age '+x.age+' · '+uiEscape(x.text)+'</p>').join(''));
 return '<div class="law-shell studio-shell">'+(page==='home'?B('Back to Work',"wsel=null;wsub=null;draw(1)"):musicGo('home','Back to music overview'))+html+'</div>';
}
function musicCareerView(s){
 if(musicActive())return musicOfficeView(s);
 const back=B('Back to Special careers',"wsel=null;wsub='Special';draw(1)");
 if(musicPage==='auditions')return back+musicAuditionsView(s);
 if(musicPage==='training')return back+musicSkillsView();
 return back+musicPanel('Singer and bands','<p>Start independently as a solo singer or audition for an open role in a band.</p>'+
  musicBtn('Start solo','solo','',0,!musicAccess())+musicGo('auditions')+musicGo('training'));
}
function musicAction(action,key,id){
 if(!g.alive||g.jail||g.justice?.pending||publicityBusy())return;
 const s=musicState();
 let error='';
 if(action==='solo'){
  error=musicSolo();if(!error)return musicOpen();
 }else if(action==='audition'){
  error=musicAudition(key,Object.keys(MUSIC_ROLES)[id]);if(!error)return musicOpen();
 }else if(action==='practice'||action==='lesson')error=musicPractice(key,action==='lesson');
 else if(action==='sign')error=musicLabelSign(key);
 else if(action==='band-action')error=musicBandAction(key,id);
 else if(action==='project')error=musicProject(musicVal('title'),musicVal('genre'),musicVal('format'));
 else if(action==='project-step')error=musicProjectStep(id,key,Number(musicVal('marketing-'+id)));
 else if(action==='show')error=musicShow(key);
 else if(action==='quit'&&musicActive()&&!musicLocked(s)){musicDialog='quit';return draw(1);}
 else if(action==='event'){
  const event=s.events.find(x=>x.id===id);
  if(musicEventReady(s,event)){event.seen=true;musicDialog=event.id;draw(1);}
  return;
 }else return;
 if(error)return toast(error);
 draw(1);
}
function musicNotify(id,review){
 const s=g.music,e=s?.events.find(x=>x.id===id);
 if(!musicEventReady(s,e))return;
 e.seen=true;if(review)musicDialog=e.id;
 draw(1);
}
function musicAnswer(i){
 if(!musicActive()||publicityBusy())return;
 if(musicDialog==='quit'){
  musicDialog=null;return quit(-1);
 }
 const s=musicState(),e=s.events.find(x=>x.id===musicDialog),result=musicRespond(s,e,i);
 if(!result.done)return toast(result.text);
 musicDialog=null;g.result={t:'Music career',d:uiEscape(result.text)};draw(1);
}
function musicStory(id){musicDialog=null;newsOpenBrief(id);}
function musicModal(s){
 if(musicDialog==='quit')return lawModal('Leave the music career?','<p>Released recordings keep their credits and continue to earn eligible royalties.</p>',
  B('Confirm departure','musicAnswer(0)')+B('Keep performing','musicDialog=null;draw()'));
 const e=s.events.find(x=>x.id===musicDialog);
 if(musicEventReady(s,e)){
  const [title,body,choices]=MUSIC_EVENTS[e.key];
  return lawModal(title,'<p>'+uiEscape(body)+'</p>',choices.map(([name],i)=>B(uiEscape(name),`musicAnswer(${i})`)).join('')+
   (e.article?B('Read in the Newspaper',`musicStory('${e.article}')`):'')+B('Decide later','musicDialog=null;draw()'));
 }
 const item=s.events.find(e=>!e.seen&&e.age===g.age&&musicEventReady(s,e));
 if(!item)return '';
 const [title,body]=MUSIC_EVENTS[item.key];
 return lawModal(title,'<p>'+uiEscape(body)+'</p>',B('Review decision',`musicNotify(${item.id},true)`)+B('Decide later',`musicNotify(${item.id},false)`));
}
