const studioOwnsJob=()=>g.job?.studioOwner===true;
const studioActive=()=>g.studio?.status==='active'&&studioOwnsJob()&&g.studio.country===g.country&&!g.jail&&!g.ret&&g.office<0&&!royalActive();
const studioJob=()=>({t:'Movie studio owner',f:'film',sp:1,pay:0,yrs:0,studioOwner:true});
const studioScale=()=>pr(100000)/100000;
const studioBlocked=()=>publicityBusy()||!!g.actor?.queue?.length;
const studioAllowed=()=>g.age>=18&&g.alive&&!g.jail&&!g.ret&&g.office<0&&!royalActive()&&!g.job&&!g.pt.length&&!g.intern&&!g.vent.some(v=>v.ceo)&&
  !g.actor?.projects?.some(p=>p.status==='signed')&&!g.actor?.queue?.length;
const studioAuthorCredits=()=>g.writingPortfolio?.credits.length||0;
function studioStartingRep(){
  const acting=g.actor?.credits?.length||0;
  return Math.min(57,18+Math.min(20,Math.floor(Math.max(g.fm||0,g.fame||0)/4))+Math.min(12,acting*2)+Math.min(10,studioAuthorCredits()*3));
}
function studioStart(){
  if(g.studio||studioBlocked())return;
  if(!studioAllowed())return toast('You need to be an adult and free of other jobs and outstanding acting commitments.');
  g.studioPrompt=true;draw();
}
function studioFound(){
  if(!g.studioPrompt||g.studio||!studioAllowed()||studioBlocked())return;
  const error=document.getElementById('studio-form-error');
  if(!error)return;
  const name=document.getElementById('studio-name')?.value.trim(),raw=Number(document.getElementById('studio-opening')?.value),amount=studioToAccount(raw);
  if(!name||name.length>60||/[<>]/.test(name)||!Number.isSafeInteger(raw)||raw<studioToDisplay(Math.round(170000*studioScale()))||raw>studioToDisplay(g.cash)){
    error.textContent='Enter a plain-text name and invest at least '+studioMoney(170000*studioScale())+' from your available personal cash.';
    return;
  }
  const scale=studioScale(),seed=[...g.name+name+g.country+g.age].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261);
  const s=studioNew({name,age:g.age,capital:0,scale,seed,reputation:studioStartingRep()});
  s.country=g.country;
  for(const director of g.actor?.directors?.filter(x=>x.history.length).slice(0,6)||[]){
    const person=studioTalent(s,'director',Math.max(58,director.bond));
    person.name=director.n;person.relationship=director.bond;
    s.people.push(person);
  }
  const contributed=Math.min(amount,Math.floor(g.cash));
  g.cash-=contributed;LD('Movie studio owner contribution',-contributed);
  studioPost(s,'capital','Owner investment',contributed);
  studioPost(s,'capital','Production equipment purchases',-s.assets[0].book);
  studioSpend(s,studioCost(s,12000),'Staff');
  g.studio=s;g.studioPrompt=null;g.job=studioJob();g.ue=false;
  studioRecord(s,'The studio opened with '+studioMoney(amount)+' in owner investment.');
  L(uiEscape(s.name)+' opened as an independent movie studio.');
  studioHeadline(s,null,'A new independent film studio opens',s.name+' launched with a slate focused on original productions.','opening');
  studioOpen('overview');
}
function studioResume(){
  const s=g.studio;
  if(s?.status!=='active'||s.country!==g.country||!studioAllowed()||studioBlocked())return;
  if(g.age>s.age){
    const pause=g.age-s.age;
    for(const p of s.projects){
      if(p.stage==='future')p.releaseAge+=pause;
      for(const license of p.licenses){if(license.until>=s.age){license.first+=pause;license.until+=pause;}}
    }
    for(const offer of s.offers)offer.expires+=pause;
    s.age=g.age;
  }
  g.job=studioJob();g.ue=false;studioOpen('overview');
}
function studioTransfer(s,action,amount){
  if(!Number.isSafeInteger(amount)||amount<=0)return 'Enter a positive whole amount.';
  if(action==='invest'){
    if(g.cash<amount)return 'Personal cash cannot cover this investment.';
    g.cash-=amount;LD('Movie studio owner contribution',-amount);
    studioPost(s,'capital','Owner investment',amount);
    return studioMoney(amount)+' moved from personal cash into studio funds.';
  }
  if(action==='withdraw'){
    if(s.cash<amount)return 'The studio cannot fund this withdrawal.';
    const tax=Math.round(amount*Math.max(0,Math.min(60,C().t.inc))/100),net=amount-tax;
    studioPost(s,'capital','Owner withdrawals',-amount);
    g.cash+=net;LD('Movie studio owner withdrawal',amount);LD('Movie studio withdrawal tax',-tax);
    return 'The studio paid '+studioMoney(amount)+'. You received '+studioMoney(net)+' after '+studioMoney(tax)+' in tax.';
  }
  return '';
}
function studioNoticeClose(kind,id){
  const s=g.studio,entry=s?.notices[0];
  if(!entry||entry.kind!==kind||entry.project!==id)return;
  s.notices.shift();
  draw();
}
function studioDebtOpen(){
  const s=g.studio;
  if(!studioActive()||s.notices[0]?.kind!=='debt')return;
  s.notices.shift();s.pending={kind:'finance',id:0};studioOpen('recovery');
}
function studioClose(){
  const s=g.studio;
  if(!studioActive()||s.pending?.kind!=='close'||studioBlocked())return;
  for(const p of s.projects)if(p.rights&&p.stage!=='cancelled')studioSellRights(s,p);
  for(const asset of s.assets.slice())studioAssetAction(s,asset.id,'sell');
  const costs=s.people.reduce((n,p)=>n+Math.round((p.retainer||0)/12),0);
  studioPost(s,'expenses','Staff',-costs);
  s.people.forEach(p=>p.retainer=null);
  const proceeds=s.cash;
  const tax=Math.round(Math.max(0,proceeds)*Math.max(0,Math.min(60,C().t.inc))/100);
  g.cash+=proceeds-tax;LD('Movie studio liquidation',proceeds);LD('Movie studio liquidation tax',-tax);
  s.cash=0;s.status='closed';s.pending=null;s.notices=[];s.incidents.forEach(x=>x.closed=true);
  g.job=null;wsel=null;wsub=null;
  studioHeadline(s,null,'A movie studio closes its doors',s.name+' wound down and sold its remaining projects and production assets.','closure','studioClosure');
  L(uiEscape(s.name)+' closed. Net liquidation '+studioMoney(proceeds-tax)+'.');
  draw(1);
}
const studioSummary=buildSum;
buildSum=function(){
  if(studioActive())studioYear(g.studio,g.age);
  return studioSummary();
};
const studioAge=ageUp;
ageUp=function(){
  if(g.studioPrompt||studioActive()&&(g.studio.pending||g.studio.notices.length))return;
  return studioAge();
};
const studioOriginalQuit=quit;
quit=function(index){
  if(index<0&&studioActive())return studioPopup('close');
  return studioOriginalQuit(index);
};
const studioOriginalRetire=retire;
retire=function(){
  if(studioOwnsJob())return toast('Wind down the studio before retiring.');
  return studioOriginalRetire();
};
function studioPressChoices(type){
  if(type==='studioPress')return [['Hold a studio press event',6700,3,7],['Issue a short studio statement',1300,1,3],['Decline to comment',0,0,0]];
  if(type==='studioClosure')return [['Release a final public statement',0,0,0],['Keep the details private',0,0,0]];
  if(type==='studioAwards')return [['Attend the Screen Guild Awards',8500,0,0],['Skip the ceremony',0,0,0]];
  return [];
}
function studioNewsCanRespond(article,edition){
  const s=g.studio,{type,ref}=article.brief;
  if(type==='studioClosure')return s?.status==='closed'&&edition.age===g.age;
  if(!s||s.status!=='active')return false;
  if(type==='studioIncident')return s.incidents.some(e=>e.id===ref&&e.story===article.id&&!e.closed);
  if(type==='studioAwards')return s.awardSeason?.story===article.id&&s.awardSeason.status==='nominated'&&s.awardSeason.age===g.age;
  return edition.age===g.age;
}
function studioNewsOptions(article){
  const s=g.studio;
  if(!s)return [];
  const {type,ref}=article.brief;
  const item=studioFind(s.incidents,ref);
  const choices=type==='studioIncident'?STUDIO_INCIDENTS[item?.key]?.choices:studioPressChoices(type);
  return (choices||[]).map(([label,base],i)=>[label+(base?' · '+studioMoney(studioCost(s,base))+' in studio funds':''),'brief'+i]);
}
function studioNewsResolve(article,index){
  const s=g.studio,{type,ref}=article.brief;
  if(type==='studioClosure'&&s?.status==='closed'){
    const option=studioPressChoices(type)[index];
    return {done:!!option,text:option?option[0]+'. The newspaper recorded the response.':'This response is unavailable.'};
  }
  if(!s||s.status!=='active')return {done:false,text:'The studio is unavailable.'};
  if(type==='studioIncident')return studioResolveIncident(s,studioFind(s.incidents,ref),index);
  if(type==='studioAwards'){
    if(index===1){
      s.awardSeason.status='missed';
      return {done:true,text:'The studio passed on this year’s ceremony.'};
    }
    const text=studioAwards(s);
    return {done:s.awardSeason.status==='attended',text};
  }
  const [label,base,reputation,buzz]=studioPressChoices(type)[index];
  const p=studioFind(s.projects,ref),money=studioCost(s,base);
  if(!studioSpend(s,money,'Marketing',p?.stage!=='cancelled'?p:null))return {done:false,text:'Studio funds cannot cover the response. The article remains open.'};
  s.reputation=studioClamp(s.reputation+reputation);
  if(p)p.buzz=studioClamp(p.buzz+buzz);
  studioRecord(s,label+'.');
  return {done:true,text:label+'. '+(money?studioMoney(money)+' was paid from studio funds.':'The studio kept its current plans.')};
}

function writingPortfolioOpen(){
  tab='Other';NV.O=['Learning','Lessons','Writing portfolio'];draw(1);
}
function writingPortfolioView(){
  const s=g.writingPortfolio,p=s?.draft;
  return `<div class="card"><h2>Writing portfolio</h2><p>Develop and publish a script, short book or collection. Published credits help when founding a studio.</p>${
    p?`<h3>${uiEscape(p.name)}</h3><p>${p.type} · ${p.genre} · Quality ${p.quality}/100</p>`+
      B(p.stage===0?'Revise the manuscript':'Submit for publication','writingPortfolioAdvance()',p.last>=g.age):
      `<label for="writing-title">Title</label><input id="writing-title" maxlength="60" class="txt">`+
      studioSelect('writing-kind','Format',[['Screenplay','Screenplay'],['Short book','Short book'],['Story collection','Story collection']])+
      studioSelect('writing-genre','Genre',STUDIO_GENRES.map(name=>[name,name]))+B('Begin a draft','writingPortfolioStart()',g.age<16)
    }${(s?.credits||[]).slice().reverse().map(c=>`<p><strong>${uiEscape(c.name)}</strong> · ${c.type} · Published at age ${c.age}</p>`).join('')}</div>`;
}
function writingPortfolioStart(){
  if(g.age<16||studioBlocked()||g.writingPortfolio?.draft)return;
  const name=document.getElementById('writing-title')?.value.trim(),type=document.getElementById('writing-kind')?.value,genre=document.getElementById('writing-genre')?.value;
  if(!name||name.length>60||/[<>]/.test(name)||!['Screenplay','Short book','Story collection'].includes(type)||!STUDIO_GENRES.includes(genre))return toast('Enter a title and select valid writing options.');
  const state=g.writingPortfolio??={credits:[],draft:null};
  if(state.credits.some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast('Choose a different title for the new draft.');
  state.draft={name,type,genre,stage:0,last:g.age,quality:studioClamp(29+g.smarts*.43)};
  draw();
}
function writingPortfolioAdvance(){
  const s=g.writingPortfolio,p=s?.draft;
  if(!p||p.last>=g.age||studioBlocked())return;
  p.last=g.age;
  if(p.stage===0){p.stage=1;p.quality=studioClamp(p.quality+13);return toast('The revision is complete. Submit it next year.');}
  if(p.quality<68){p.quality=studioClamp(p.quality+8);return toast('An editor asked for a revision. The next submission opens next year.');}
  s.credits.push({name:p.name,type:p.type,genre:p.genre,quality:p.quality,age:g.age});
  s.draft=null;
  const fee=pr(p.type==='Screenplay'?2400:1400);g.cash+=fee;LD('Writing publication payment',fee);
  L('You published '+uiEscape(p.name)+'.');
  pressNotice('arts','A new writing credit is published',g.name+' published '+p.name+' as an independent '+p.type.toLowerCase()+'.','spotlight','writing-credit-'+s.credits.length);
  toast('Published. Your personal cash received '+studioMoney(fee)+'.');
}
const studioOtherSec=secV;
secV=function(path){
  if(path[0]==='Learning'&&path[2]==='Writing portfolio')return writingPortfolioView();
  const html=studioOtherSec(path);
  return path[0]==='Learning'&&path[1]==='Lessons'?html+B('Writing portfolio','writingPortfolioOpen()'):html;
};

function studioValidate(life){
  const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const count=x=>Number.isSafeInteger(x)&&x>=0;
  const number=Number.isFinite;
  const bar=x=>count(x)&&x<=100;
  const name=(x,n)=>typeof x==='string'&&x.trim()&&x.length<=n;
  if(life.studioPrompt!=null&&life.studioPrompt!==true)throw Error('Invalid movie studio opening prompt.');
  const writing=life.writingPortfolio;
  const writingItem=x=>object(x)&&name(x.name,60)&&['Screenplay','Short book','Story collection'].includes(x.type)&&STUDIO_GENRES.includes(x.genre)&&bar(x.quality);
  if(writing!=null&&(!object(writing)||!Array.isArray(writing.credits)||writing.credits.some(x=>!writingItem(x)||!count(x.age))||
    writing.draft!=null&&(!writingItem(writing.draft)||!count(writing.draft.last)||![0,1].includes(writing.draft.stage))))throw Error('Invalid writing portfolio.');
  const s=life.studio;
  if(s==null){
    if(life.job?.studioOwner)throw Error('The studio owner job requires studio data.');
    return;
  }
  if(!object(s)||s.version!==1||!name(s.name,60)||!['active','closed'].includes(s.status)||typeof s.country!=='string'||
    !['age','opened','serial','seed','awards','lossYears'].every(key=>count(s[key]))||!number(s.cash)||!number(s.scale)||s.scale<=0||!bar(s.reputation))throw Error('Invalid movie studio account.');
  const lists=['projects','people','assets','rivals','reports','ledger','history','incidents','seen','notices','offers'];
  const bucket=x=>object(x)&&['income','expenses','capital'].every(key=>object(x[key])&&Object.values(x[key]).every(number));
  if(lists.some(k=>!Array.isArray(s[k]))||!bucket(s.period)||!object(s.outlets)||!Object.keys(STUDIO_OUTLETS).every(key=>bar(s.outlets[key])))throw Error('Incomplete movie studio records.');
  const records=['projects','people','assets','rivals','incidents','offers'].flatMap(k=>s[k]);
  if(records.some(x=>!object(x)||!count(x.id)||x.id>s.serial)||new Set(records.map(x=>x.id)).size!==records.length)throw Error('Invalid movie studio record IDs.');
  if(s.people.some(x=>!name(x.name,100)||!studioHas(STUDIO_ROLES,x.role)&&!studioHas(STUDIO_CREW,x.role)||!bar(x.skill)||!bar(x.relationship)||
    !bar(x.reputation)||!Array.isArray(x.shared)||x.retainer!=null&&!count(x.retainer))||
    s.assets.some(a=>!count(a.type)||!STUDIO_ASSETS[a.type]||!count(a.book)||!count(a.bought))||
    s.rivals.some(x=>!name(x.name,100)||!bar(x.reputation)||!number(x.gross)))throw Error('Invalid personnel, facilities or ranking.');
  const projects=new Set(s.projects.map(x=>x.id));
  const people=new Map(s.people.map(x=>[x.id,x]));
  const distribution=x=>object(x)&&studioHas(STUDIO_OUTLETS,x.outlet)&&['share','original'].includes(x.deal)&&count(x.guarantee);
  for(const p of s.projects){
    if(!name(p.name,64)||!studioHas(STUDIO_STAGES,p.stage)||!studioHas(STUDIO_MEDIA,p.media)||!studioHas(STUDIO_FORMATS,p.format)||
      !STUDIO_GENRES.includes(p.genre)||!STUDIO_RATINGS.includes(p.rating)||!bar(p.quality)||!bar(p.buzz)||!count(p.spent)||!count(p.earned)||
      typeof p.ready!=='boolean'||typeof p.rights!=='boolean'||!count(p.delay)||!object(p.costs)||!object(p.crew)||
      !['slots','nominations','results','licenses','decisions'].every(k=>Array.isArray(p[k]))||!p.slots.length||
      p.slots.some(x=>!object(x)||!studioHas(STUDIO_ROLES,x.role)||x.person!=null&&people.get(x.person)?.role!==x.role)||
      Object.entries(p.crew).some(([role,id])=>!studioHas(STUDIO_CREW,role)||people.get(id)?.role!==role)||
      p.source!=null&&!projects.has(p.source)||p.distribution!=null&&!distribution(p.distribution)||
      ['future','released'].includes(p.stage)&&(!distribution(p.distribution)||!count(p.releaseAge)||p.slots.some(x=>x.person==null))||
      p.stage==='released'&&(!count(p.actual)||!bar(p.audience)||!bar(p.critics)||!count(p.gross)||!number(p.initialProfit))||
      p.nominations.some(a=>!STUDIO_AWARDS.includes(a))||p.results.some(r=>!object(r)||!STUDIO_AWARDS.includes(r.category)||typeof r.won!=='boolean')||
      p.licenses.some(x=>!object(x)||!studioHas(STUDIO_OUTLETS,x.outlet)||!['annual','first','until','paid'].every(k=>count(x[k])))||
      p.investor!=null&&(!object(p.investor)||!count(p.investor.advance)||!bar(p.investor.share)||!count(p.investor.paid))){
      throw Error('Invalid movie project.');
    }
  }
  if(s.offers.some(x=>!projects.has(x.project)||!studioHas(STUDIO_OUTLETS,x.outlet)||!['annual','years','expires'].every(k=>count(x[k])))||
    s.incidents.some(x=>!projects.has(x.project)||!studioHas(STUDIO_INCIDENTS,x.key)||typeof x.closed!=='boolean')||
    s.notices.some(x=>!object(x)||!['release','debt'].includes(x.kind)||x.kind==='release'&&!projects.has(x.project))||
    s.reports.some(x=>!bucket(x)||!Array.isArray(x.releases)||x.releases.some(id=>!projects.has(id))))throw Error('Invalid studio release or decision.');
  const q=s.pending;
  if(q!=null&&(!object(q)||!['script','finance','close','rights','asset','restructure'].includes(q.kind)||!count(q.id)||
    q.kind==='script'&&q.id&&!projects.has(q.id)||q.kind==='rights'&&!projects.has(q.id)||q.kind==='asset'&&!studioFind(s.assets,q.id)))throw Error('Invalid studio popup.');
  if(s.review!=null&&(!object(s.review)||typeof s.review.token!=='string'||!count(s.review.age)||!studioFind(s.incidents,s.review.id)))throw Error('Invalid studio review.');
  if(s.awardSeason!=null&&(!object(s.awardSeason)||!count(s.awardSeason.age)||!['nominated','attended','missed'].includes(s.awardSeason.status)||
    !Array.isArray(s.awardSeason.projects)||s.awardSeason.projects.some(id=>!projects.has(id))))throw Error('Invalid studio award season.');
}
