const GEN_FUN_NEWS=[
 ['A library adds an “overdue cat” to its inventory','The cat attended the book club and remained unconvinced by the mystery ending.'],
 ['A tiny museum opens a gallery of forgotten shopping lists','The curator says the collection includes three rival recipes for pancakes.'],
 ['A town elects a pumpkin as parade marshal','The marshal was praised for showing up early and staying remarkably still.'],
 ['A ferry crew holds a championship for folding maps','The winner used a map of an island where the ferry has never stopped.'],
 ['A radio station broadcasts a minute of applause for the weather','Residents called in to applaud the small patch of sunshine, too.'],
 ['A choir performs entirely in the voice of a creaking gate','The encore was held outside to accommodate several actual gates.'],
 ['A lost umbrella returns wearing a knitted hat','The owner plans to keep the hat on for the rest of the rainy season.'],
 ['A bakery names every sourdough starter after a retired teacher','Several former students stopped by to check that their teachers were rising.'],
 ['A stamp club designs a postage stamp the size of a door','They are still looking for an envelope.']
];
const genPreviousNewsYear=newsBuildYear;
newsBuildYear=function(){
 const result=genPreviousNewsYear();
 const edition=g.news?.editions.find(e=>e.age===g.age);
 if(edition&&!edition.articles.some(a=>a.kind==='fun')){
  const n=genRoll(g,'fun paper',GEN_FUN_NEWS.length);
  for(let i=0;i<2;i++){
   const entry=GEN_FUN_NEWS[(n+i*3)%GEN_FUN_NEWS.length];
   edition.articles.push({id:'fun-'+g.age+'-'+i,kind:'fun',title:entry[0],text:entry[1],action:null,player:false,resolved:false});
  }
 }
 return result;
};
function genNewsItem(article){
 const id=article.brief.ref;
 return g.generations?.events.find(x=>x.id===id&&x.story===article.id);
}
function genNewsOptions(article){
 const item=genNewsItem(article);
 return item?genChoices(item).map((text,i)=>[text,'brief'+i]):[];
}
function genNewsResolve(article,i){
 const item=genNewsItem(article);
 return item?genRespond(item,i):{done:false,text:'This decision is unavailable.'};
}
const genPreviousEffect=E;
E=function(x){
 const result=genPreviousEffect(x);
 if(x?.relId&&x.relDelta>0)genContact(genFind(x.relId),x.relDelta);
 if(x?.relGroup&&x.relDelta>0){
  const category={parents:'Parents',siblings:'Siblings',friends:'Friends',partner:'Dating / Spouse',children:'Children',extended:'Extended family',pets:'Pets'}[x.relGroup];
  for(const r of relationshipCategories().find(x=>x.label===category)?.people||[])genContact(r,x.relDelta);
 }
 return result;
};
const genPreviousSpend=spendAll;
spendAll=function(){
 for(const r of g.rel.filter(x=>x.alive&&x.bond>=25&&x.age>=3&&['fam','fri'].includes(x.t)))genContact(r,1);
 return genPreviousSpend();
};
const genPreviousRelView=relV;
relV=function(){
 const r=sel&&genFind(sel),c=r?.connection;
 if(r?.alive&&['estranged','former'].includes(c?.status)){
  return B('Back to Relationships','relationshipBack()')+genSection(r.n,'<p>'+
   (c.status==='former'?'Former friend':'Estranged '+uiEscape(r.role.toLowerCase()))+
   ' · Reconnecting takes two conversations in different years.</p>'+
   B(c.repairs?'Follow up and rebuild trust':'Reach out to reconnect',`genReconnect('${r.id}')`,c.attempt===g.age)+
   (r.sharedMemories||[]).slice(0,6).map(x=>'<p>'+uiEscape(x.text)+'</p>').join(''));
 }
 return genPreviousRelView();
};
const genPreviousBirth=birthIntro;
birthIntro=function(){genFamilyInit();return genPreviousBirth();};
const genPreviousNewChild=relationshipAddChild;
relationshipAddChild=function(...args){
 const child=genPreviousNewChild(...args),spouse=partner();
 child.genParents=[genState().id,...(spouse?[spouse.id]:[])];child.genBirth=g.country;child.genCity=g.city;child.genCountry=g.country;
 genProfile(child);
 return child;
};
const genPreviousSummary=buildSum;
buildSum=function(){
 const s=genState();
 if(s.lastAge<g.age&&!g.jail){
  s.lastAge=g.age;
  genFamilyYear();genCheckRelationship();genMinorYear();genLandYear(s);genIslandYear(s);
 }
 return genPreviousSummary();
};
const genPreviousHeir=heir;
heir=function(id){
 if(!g.alive)return genContinue(id);
 return genPreviousHeir(id);
};
const genPreviousHeirView=heirV;
heirV=function(){return g.alive?genPreviousHeirView():genHeirView();};
const genPreviousDraw=draw;
draw=function(reset){
 if(g&&!g.alive&&scr==='death')genFinalEstate();
 return genPreviousDraw(reset);
};
const genPreviousRevive=revive;
revive=function(){
 if(!g.alive&&inv.revives>0&&g.generations)g.generations.settlement=null;
 return genPreviousRevive();
};
const genPreviousSec=secV;
secV=function(path){
 if(path[0]==='Will')return genWillView();
 if(path[0]==='Family life')return genFamilyView();
 if(path[0]==='Vacation')return genTravelView();
 return genPreviousSec(path);
};
OMENU.push(['Will','Beneficiaries, property gifts and funeral wishes'],['Family life','Pending decisions and earlier generations']);
const genPreviousShop=stuffShopView;
stuffShopView=function(){
 const html=genPreviousShop();
 if(stuffShopTab!=='Property'||g.jail)return html;
 if(genPropertyPage==='catalog')return genCmd('Land and islands','property','index')+html;
 return genPropertyView();
};
const genPreviousMain=mainTabOpen;
mainTabOpen=function(section){
 if(section==='Stuff'){genPropertyPage='catalog';genSelected=null;}
 return genPreviousMain(section);
};
const genPreviousOwned=stuffOwnedList;
stuffOwnedList=function(which){
 const html=genPreviousOwned(which);
 if(g.jail||which!=='Property'||!g.generations)return html;
 const s=g.generations;
 const notices=s.land.length+s.islands.length+s.nations.length;
 return notices?genCmd('Manage lots and islands','property','index')+html:html;
};
const genPreviousWorth=nw;
nw=function(){
 const s=g.generations;
 return genPreviousWorth()+(s?s.land.reduce((n,x)=>n+x.cost+(x.build?.paid||0),0)+
  [...s.islands,...s.nations].reduce((n,x)=>n+x.value,0):0);
};
const genPreviousAge=ageUp;
ageUp=function(){
 if(g?.generations?.trip&&!g.jail)return toast('Return home from the vacation before aging up.');
 if(genDialog&&!g.jail)return toast('Finish or postpone the current decision before aging up.');
 if(g?.alive)genState();
 return genPreviousAge();
};
let genPreviousLife=null;
const genPreviousGame=gameView;
gameView=function(){
 if(genPreviousLife!==g){genPreviousLife=g;genDialog=null;genPropertyPage='catalog';genSelected=null;genDestination=null;}
 const html=genPreviousGame(),s=g.generations;
 if(g.jail||g.justice?.pending||!s||!genDialog&&!s.trip?.pending&&!s.events.some(e=>e.age===g.age&&!e.closed&&!e.seen))return html;
 const root=document.createElement('div');root.innerHTML=html;
 if(!root.querySelector('.mo')){
  const open=genModal(s);
  if(s.trip?.pending&&!genDialog)genDialog=s.trip.pending;
  if(open)root.querySelector('.game')?.insertAdjacentHTML('beforeend',open);
 }
 return root.innerHTML;
};
function genValidate(life){
 const s=life.generations;
 const object=x=>x!=null&&typeof x==='object'&&!Array.isArray(x);
 const integer=x=>Number.isSafeInteger(x)&&x>=0;
 const id=x=>typeof x==='string'&&/^[A-Za-z0-9_-]+$/.test(x);
 const country=x=>typeof x==='string'&&Object.hasOwn(life.w||{},x);
 const items=['car','home','boats','planes','lux','vent','lawFirm','practice','studio','university','land','islands','nations','position','investment','angel','museum','artifact','investigation'];
 const asset=x=>object(x)&&items.includes(x.key)&&object(x.value)&&Number.isFinite(x.net)&&Array.isArray(x.loans);
 if(!object(s)||s.version!==1||!id(s.id)||!integer(s.number)||!s.number||!integer(s.serial)||!integer(s.lastAge)||
  !['events','archive','land','islands','nations','trips'].every(k=>Array.isArray(s[k])))throw Error('Invalid generation record.');
 if(s.family!=null&&(!object(s.family)||!['single','together','separated','blended'].includes(s.family.status)||
  !Array.isArray(s.family.parents)||!s.family.parents.every(id)||!integer(s.family.since)))throw Error('Invalid family history.');
 if(s.will!=null){
  const w=s.will;
  if(!object(w)||!object(w.weights)||!object(w.property)||!Object.hasOwn(GEN_FUNERALS,w.funeral)||
   Object.entries(w.weights).some(([key,n])=>!id(key)||!integer(n)||n>100)||
   Object.values(w.weights).reduce((n,x)=>n+x,0)!==100||Object.entries(w.property).some(([k,x])=>!Object.hasOwn(GEN_CATEGORIES,k)||!id(x))||
   w.preferred!=null&&!id(w.preferred))throw Error('Invalid will.');
 }
 if(s.settlement!=null){
  const p=s.settlement;
  if(life.alive||!object(p)||!country(p.country)||!integer(p.age)||p.age!==life.age||
   ![p.gross,p.debt,p.fee,p.tax,p.shortfall].every(integer)||typeof p.funeral!=='string'||
   !Array.isArray(p.recipients)||!Array.isArray(p.summary)||!Array.isArray(p.sold)||
   p.recipients.some(x=>!object(x)||!id(x.id)||!integer(x.cash)||!Array.isArray(x.items)||!x.items.every(asset))||
   p.summary.some(x=>!object(x)||!id(x.id)||typeof x.name!=='string'||!integer(x.cash)||!integer(x.assets)||!integer(x.value)))throw Error('Invalid estate settlement.');
 }
 if(s.events.some(e=>!object(e)||!integer(e.id)||e.id>s.serial||!integer(e.age)||typeof e.title!=='string'||typeof e.text!=='string'||
  typeof e.closed!=='boolean'||typeof e.seen!=='boolean'||!['contact','newRelative','parents','daily','travel','island','update'].includes(e.kind)||
  e.kind==='travel'&&(!Array.isArray(e.options)||e.options.some(x=>!Array.isArray(x)||typeof x[0]!=='string'||!Number.isFinite(x[1])||!Number.isFinite(x[2])))||
  e.kind==='daily'&&!Object.hasOwn(GEN_SCENES,e.scene))||new Set(s.events.map(e=>e.id)).size!==s.events.length)throw Error('Invalid life decision.');
 const trip=x=>object(x)&&country(x.country)&&typeof x.city==='string'&&integer(x.age)&&integer(x.cost)&&[1,2,3].includes(x.stops)&&
  ['companions','activities','souvenirs'].every(k=>Array.isArray(x[k]))&&x.companions.every(id)&&x.activities.length<=x.stops;
 if(s.trips.some(t=>!trip(t))||s.trip!=null&&(!trip(s.trip)||s.trip.pending!=null&&!s.events.some(e=>e.id===s.trip.pending&&e.kind==='travel'&&!e.closed)))throw Error('Invalid trip.');
 if(s.land.some(x=>!object(x)||!id(x.id)||!Object.hasOwn(GEN_LOTS,x.key)||!country(x.country)||!integer(x.cost)||!integer(x.area)||
   x.build!=null&&(!object(x.build)||!Object.hasOwn(GEN_PLANS,x.build.plan)||!integer(x.build.due)||!integer(x.build.paid)||typeof x.build.name!=='string')))
  throw Error('Invalid building lot.');
 if([...s.islands,...s.nations].some(x=>!object(x)||!id(x.id)||typeof x.name!=='string'||!integer(x.value)||!integer(x.age)||!object(x.used)||
  !Array.isArray(x.projects)||x.projects.some(p=>!object(p)||!Object.hasOwn(x.population?GEN_NATION_PROJECTS:GEN_DEVELOP,p.key)||
   !integer(p.due)||typeof p.complete!=='boolean'))||s.nations.some(x=>!Object.hasOwn(GEN_NATIONS,x.key)||
   ![x.population,x.funds,x.stock,x.output,x.wellbeing,x.economy].every(integer)))throw Error('Invalid island record.');
 for(const r of life.rel){
  const p=r.genLife,c=r.connection;
  if(p!=null&&(!object(p)||!integer(p.savings)||!integer(p.years)||!integer(p.degree)||!Array.isArray(p.assets)||!Array.isArray(p.legacy)||
    !p.assets.every(asset)||!p.legacy.every(asset)||p.job!=null&&(!object(p.job)||typeof p.job.t!=='string'||typeof p.job.f!=='string'||!Number.isFinite(p.job.pay))))throw Error('Invalid relative life history.');
  if(c!=null&&(!object(c)||!['close','estranged','former'].includes(c.status)||!integer(c.last)||!integer(c.repairs)))throw Error('Invalid relationship contact history.');
 }
}
