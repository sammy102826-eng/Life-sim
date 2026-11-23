const heritageNum=n=>Math.round(cl(n,0,100));
const heritageJob=()=>g.job?.archaeology===true;
const heritageAdult=()=>g.alive&&g.age>=18&&!g.jail;
function heritageState(life=g){
 return life.heritage??={version:1,serial:0,lastAge:life.age,career:null,sites:[],artifacts:[],museum:null,events:[],history:[]};
}
function heritageLog(s,text){
 s.history.unshift({age:g.age,text});s.history=s.history.slice(0,40);
 L(uiEscape(text));
}
function heritagePress(title,text,event=null){
 return newsPublish('heritage',title,text,event?{type:'heritageEvent',ref:event.id}:null);
}
const heritageSite=s=>s.sites.find(x=>x.id===s.career?.site);
const heritageAtSite=s=>heritageAdult()&&heritageJob()&&heritageSite(s)?.country===g.country;
const heritageCareerEligible=()=>heritageAdult()&&Object.hasOwn(DIG_REGIONS,g.country)&&!g.job&&!g.pt.length&&!g.intern&&
 !g.study&&!g.collegeTrack?.current&&g.office<0&&!g.ret&&!royalRestricted()&&!g.vent.some(v=>v.ceo)&&
 !g.actor?.projects?.some(p=>p.status==='signed');
function heritagePay(name,funds,amount){
 if(funds.cash<amount)return false;
 funds.cash-=amount;
 if(funds===g&&amount)LD(name,-amount);
 return true;
}
function heritageStart(){
 if(!heritageCareerEligible())return 'Move to a country with a field program and clear your work and study schedule first.';
 const s=heritageState(),name=DIG_REGIONS[g.country][0]+' Research Site';
 let site=s.sites.find(x=>x.country===g.country);
 if(!site){
  site={id:++s.serial,name,country:g.country,owned:false,survey:0,layer:0,effort:0,used:{},paused:0};
  s.sites.push(site);
 }
 const prior=s.career;
 s.career={site:site.id,years:prior?.years||0,reputation:prior?.reputation||20,
  discoveries:prior?.discoveries||0,analysis:prior?.analysis||15};
 g.job={t:site.owned?'Site director':'Archaeologist',f:'science',sp:1,pay:site.owned?0:pr(g.maj==='Archaeology'?46500:36500),yrs:0,archaeology:true};
 g.ue=false;
 heritageLog(s,'You joined '+name+' in '+g.country+'.');
 return '';
}
function heritageAcquireSite(){
 const s=heritageState(),site=heritageSite(s),c=s.career;
 if(!heritageAtSite(s)||site.owned||c.years<3||c.discoveries<1||c.reputation<42)return 'A permit requires three field years, a documented discovery, and reputation of 42.';
 const cost=pr(34000);
 if(!heritagePay('Field lease and excavation permit',g,cost))return 'The field lease costs '+loc(cost)+'.';
 site.owned=true;g.job.t='Site director';g.job.pay=0;
 heritageLog(s,'You secured the operating lease and permit for '+site.name+'.');
 heritagePress('Independent excavation receives a field permit',g.name+' will direct the work at '+site.name+'. Protected material remains subject to review.');
 return '';
}
function heritageField(action,layer){
 const s=heritageState(),site=heritageSite(s),career=s.career;
 if(!heritageAtSite(s)||!['survey','dig'].includes(action))return 'You must work at your site to conduct fieldwork.';
 if(site.paused>g.age)return 'Fieldwork is paused until age '+site.paused+'.';
 if(action==='survey'){
  if(site.used.survey===g.age)return 'One survey is available each field season.';
  site.used.survey=g.age;site.survey=heritageNum(site.survey+R(17,25));
  career.reputation=heritageNum(career.reputation+2);
  heritageLog(s,'You mapped surface features and marked the site grid.');
  return '';
 }
 if(!DIG_STRATA[layer]||site.survey<DIG_STRATA[layer][2]||layer>site.layer)return 'Survey and excavate the layers in order first.';
 if(site.used.dig!==g.age){site.effort=0;site.used.dig=g.age;}
 if(site.effort>=2)return 'Both excavation shifts are used this season.';
 if(s.artifacts.length>=200)return 'The collection register is full.';
 if(!heritagePay('Excavation supplies',g,site.owned?pr(550*(layer+1)):0))return 'The project cannot cover this shift’s excavation supplies.';
 site.effort++;
 if(site.effort===1||ch(65)){
  const candidates=Object.keys(DIG_FINDS).filter(k=>DIG_FINDS[k][3]<=layer);
  const key=P(candidates),[name,material,base]=DIG_FINDS[key];
  const item={id:++s.serial,key,name,material,site:site.id,origin:site.country,layer,condition:R(42,86),value:pr(base),
   mapped:false,method:null,date:null,significant:false,place:'lab',restricted:!site.owned||layer===2};
  s.artifacts.push(item);
  site.layer=Math.max(site.layer,Math.min(2,layer+1));
  heritageLog(s,'You recovered a '+name.toLowerCase()+' from '+DIG_STRATA[layer][0].toLowerCase()+'. It is in the field lab.');
 }else heritageLog(s,'You recorded a trench with no recoverable material. The notes are part of the field record.');
 return '';
}
function heritageLab(item,step){
 const s=heritageState(),site=heritageSite(s),career=s.career;
 if(!heritageAtSite(s)||item?.place!=='lab'||item.site!==site.id)return 'This find is unavailable in your current field lab.';
 if(step==='map'){
  if(item.mapped)return 'The stratigraphic record is complete.';
  item.mapped=true;career.analysis=learnTalent('science',career.analysis,3);
  heritageLog(s,'You recorded the layer boundaries and features associated with '+item.name.toLowerCase()+'.');
  return '';
 }
 if(!item.mapped||item.method||!['carbon','chemical'].includes(step))return 'Map the context first and choose an unused lab test.';
 if(step==='carbon'&&!['Plant fiber','Charcoal','Wood'].includes(item.material))return 'Radiocarbon dating needs suitable organic material.';
 if(!heritagePay('Field laboratory analysis',g,site.owned?pr(step==='carbon'?1000:590):0))return 'There are insufficient funds for the laboratory test.';
 item.method=step;
 const midpoint=R(700,2300)+item.layer*540,margin=step==='carbon'?R(30,110):R(140,330);
 item.date=[midpoint-margin,midpoint+margin];
 item.value=Math.round(item.value*(1+.25+item.layer*.2));
 const discovery=career.discoveries===0||item.layer>0&&ch(58);
 item.significant=discovery;
 career.analysis=learnTalent('science',career.analysis,6);
 career.reputation=heritageNum(career.reputation+(discovery?13:4));
 if(discovery){
  career.discoveries++;
  heritagePress('Field team documents a new discovery',item.name+' from '+site.name+' has a published context and laboratory result.');
 }
 heritageLog(s,'The lab documented '+item.name.toLowerCase()+' and recorded its composition and age estimate.');
 return '';
}
const museumSlots=m=>m.wings.reduce((n,w)=>n+MUSEUM_WINGS[w][1],0);
const museumItems=s=>s.artifacts.filter(a=>a.place==='museum');
const museumWorth=m=>Math.max(0,Math.round(m.cash+m.equity));
function heritageCreateMuseum(name){
 if(!heritageAdult()||royalRestricted())return 'An adult account is required to open the museum.';
 const s=heritageState();
 if(s.museum)return 'You already operate a museum.';
 if(typeof name!=='string'||!name.trim()||name.trim().length>52||/[<>]/.test(name))return 'Enter a museum name of up to 52 characters.';
 const cost=pr(76000);
 if(!heritagePay('Museum startup',g,cost))return 'Opening costs '+loc(cost)+'.';
 s.museum={name:name.trim(),country:g.country,cash:Math.round(cost*.25),equity:Math.round(cost*.65),fee:pr(8),
  wings:['main'],staff:{guide:0,conservator:0,security:0,curator:0},reputation:24,trips:0,last:null,
  used:{},outreach:0,exhibit:0,quiet:0};
 heritagePress('A new museum opens',s.museum.name+' has opened its main gallery to the public.');
 heritageLog(s,'You opened '+s.museum.name+'. The main gallery and opening cash reserve are ready.');
 return '';
}
function heritageMove(item,to){
 if(!heritageAdult()||!item||!['lab','private','museum'].includes(item.place))return 'This artifact is unavailable.';
 const s=heritageState(),m=s.museum,from=item.place;
 if(from===to)return 'The artifact is already there.';
 if(from==='lab'&&(!heritageAtSite(s)||item.site!==s.career.site||!item.method))return 'Finish documenting the find at its original site first.';
 if(item.restricted&&to!=='donated')return 'The permit requires this material to be deposited with a public institution.';
 if(to==='museum'&&(!m||museumItems(s).length>=museumSlots(m)))return 'Open a museum with exhibition space first.';
 if(to==='private'||to==='museum'){
  item.place=to;item.display=null;
 }else if(to==='donated'||to==='sold'){
  if(to==='sold'){
   const payment=Math.round(item.value*(.50+item.condition*.005));
   const account=from==='museum'?m:g;
   account.cash+=payment;
   if(account===g)LD('Artifact sale income',payment);
  }else{
   if(from==='museum')m.reputation=heritageNum(m.reputation+4);
   else if(s.career)s.career.reputation=heritageNum(s.career.reputation+(item.restricted?5:3));
   if(!item.restricted&&from!=='museum')LD('Charitable donations',-Math.round(item.value*.6));
   heritagePress('Museum receives a documented donation',item.name+' joined the public collections with its provenance record.');
  }
  item.place=to;item.display=null;
 }else return 'Choose a collection destination.';
 heritageLog(s,item.name+' was '+({private:'placed in personal inventory',museum:'accessioned into your museum',donated:'donated to a public collection',sold:'sold through a provenance-checked dealer'})[to]+'.');
 return '';
}
function heritageMuseumAction(action,arg,value){
 const s=heritageState(),m=s.museum;
 if(!heritageAdult()||!m)return 'The museum is unavailable.';
 const item=s.artifacts.find(x=>x.id===arg);
 if(action==='fund'||action==='withdraw'){
  if(!Number.isSafeInteger(value)||value<=0)return 'Enter a positive transfer amount.';
  const from=action==='fund'?g:m,to=action==='fund'?m:g;
  if(!heritagePay('Museum investment',from,value))return 'The balance cannot cover that transfer.';
  if(to===g)finOwnerDistribution(value,'Museum distribution','Museum distribution tax');
  else to.cash+=value;
 }else if(action==='wing'){
  if(!Object.hasOwn(MUSEUM_WINGS,arg)||m.wings.includes(arg))return 'That wing is already open or unavailable.';
  const [name,,base]=MUSEUM_WINGS[arg],cost=pr(base);
  if(!heritagePay('',m,cost))return 'The museum needs '+loc(cost)+' for construction.';
  m.equity+=Math.round(cost*.75);m.wings.push(arg);m.reputation=heritageNum(m.reputation+5);
  heritagePress('Museum opens a new wing',m.name+' opened its '+name.toLowerCase()+' to visitors.');
 }else if(action==='fee'){
  if(!Number.isSafeInteger(value)||value<0||value>pr(55))return 'Choose an admission fee between zero and '+loc(pr(55))+'.';
  m.fee=value;
 }else if(action==='staff'){
  if(!Object.hasOwn(MUSEUM_STAFF,arg)||![1,-1].includes(value))return 'Unknown museum position.';
  const limit=MUSEUM_STAFF[arg][2]+m.wings.length-1,next=m.staff[arg]+value;
  if(next<0||next>limit)return 'That role has no open spot or current employee.';
  if(value>0&&!heritagePay('',m,pr(850)))return 'The museum cannot pay recruitment expenses.';
  m.staff[arg]=next;
 }else if(action==='trips'){
  if(m.trips>=m.wings.length*2||m.staff.guide===0)return 'A guide and an available school booking are required.';
  if(!heritagePay('',m,pr(180)))return 'The museum cannot cover trip materials.';
  m.trips++;m.outreach++;m.reputation=heritageNum(m.reputation+2);
 }else if(action==='clean'){
  if(item?.place!=='museum'||item.cleanAge===g.age||item.condition>=100)return 'This object does not need another cleaning this year.';
  if(!heritagePay('',m,pr(m.staff.conservator?110:410)))return 'The museum cannot pay the treatment cost.';
  item.condition=heritageNum(item.condition+(m.staff.conservator?18:8));item.cleanAge=g.age;
 }else if(action==='buy'||action==='trade'){
  if(!Object.hasOwn(DIG_FINDS,value)||s.artifacts.length>=200)return 'This dealer listing is unavailable.';
  if(action==='trade'&&item?.place!=='museum')return 'Select a museum object to trade.';
  if(action==='buy'&&museumItems(s).length>=museumSlots(m))return 'There is no room to accession another object.';
  const [name,material,base]=DIG_FINDS[value],cost=pr(base*1.4),credit=action==='trade'?Math.round(item.value*.55):0;
  if(m.used['dealer:'+value]===g.age)return 'That dealer listing has already been purchased this season.';
  if(!heritagePay('',m,Math.max(0,cost-credit)))return 'The museum cannot cover the dealer’s price.';
  if(action==='trade'){item.place='traded';m.cash+=Math.max(0,credit-cost);}
  m.used['dealer:'+value]=g.age;
  s.artifacts.push({id:++s.serial,key:value,name,material,site:null,origin:'Licensed dealer',layer:0,condition:79,value:pr(base),
   mapped:true,method:'dealer',date:null,significant:false,place:'museum',restricted:false});
 }else return 'This museum action is unavailable.';
 return '';
}
function heritageEvent(s,key,ref=null){
 if(!Object.hasOwn(HERITAGE_EVENTS,key)||s.events.some(e=>e.key===key&&!e.closed))return;
 const [title,text,choices]=HERITAGE_EVENTS[key];
 const e={id:++s.serial,key,ref,age:g.age,closed:false,article:null};
 s.events.push(e);
 if(s.events.length>40){
  const first=s.events.findIndex(x=>x.closed);
  if(first>=0)s.events.splice(first,1);
 }
 e.article=heritagePress(title,text,e);
 (g.stuffEventQueue??=[]).push({x:uiEscape(title+'. '+text),c:choices.map(([label],i)=>[uiEscape(label),
  {heritageEvent:{id:e.id,choice:i}},'You recorded a heritage decision.'])});
}
const heritageMuseumEvent=e=>['leak','schools','exhibit','claim'].includes(e.key);
function heritageEventReady(s,e){
 if(!e||e.closed||!heritageAdult())return false;
 return heritageMuseumEvent(e)?!!s.museum:heritageAtSite(s)&&s.career.site===e.ref;
}
function heritageRespond(s,e,index){
 if(!heritageEventReady(s,e)||!HERITAGE_EVENTS[e.key][2][index])return {done:false,text:'This decision is unavailable.'};
 const [label,base,rep,action]=HERITAGE_EVENTS[e.key][2][index],museum=heritageMuseumEvent(e),m=s.museum,site=heritageSite(s);
 const account=museum?m:g,cost=pr(base);
 if(!heritagePay('Field response',account,cost))return {done:false,text:'The response requires '+loc(cost)+'. It remains available.'};
 const profile=museum?m:s.career;
 profile.reputation=heritageNum(profile.reputation+rep);
 if(action==='survey')site.survey=heritageNum(site.survey+8);
 if(action==='pause')site.paused=g.age+1;
 if(action==='research')s.career.analysis=learnTalent('science',s.career.analysis,10);
 if(action==='deposit'){
  const item=s.artifacts.find(x=>x.site===site.id&&x.place==='lab');
  if(item)item.place='donated';
 }
 if(action==='grant'){
  g.cash+=pr(5500);LD('Excavation grant income',pr(5500));
  site.grant=g.age+1;
 }
 if(action==='condition')for(const item of museumItems(s))item.condition=heritageNum(item.condition+6);
 if(action==='crate'||action==='quiet'){
  m.quiet=1;
  if(action==='quiet')for(const item of museumItems(s))item.condition=heritageNum(item.condition-3);
 }
 if(action==='outreach')m.outreach+=3;
 if(action==='trips')m.outreach++;
 if(action==='exhibit')m.exhibit=2;
 if(action==='museumDeposit'){
  const item=s.artifacts.find(x=>x.id===e.ref&&x.place==='museum');
  if(item)item.place='donated';
 }
 e.closed=true;
 const article=[...(g.news?.editions||[]).flatMap(d=>d.articles),...(g.news?.queued||[]).map(q=>q.article)].find(a=>a.id===e.article);
 if(article)article.resolved=true;
 heritageLog(s,label+'.');
 return {done:true,text:label+'. '+(cost?loc(cost)+' was paid. ':'')+'Reputation '+profile.reputation+'/100.'};
}
function heritageYear(){
 const s=g.heritage;
 if(!s||s.lastAge>=g.age)return;
 s.lastAge=g.age;
 const site=heritageSite(s);
 if(heritageAtSite(s)){
  s.career.years++;g.job.yrs=(g.job.yrs||0)+1;
  if(site.used.survey===g.age-1||site.used.dig===g.age-1)s.career.reputation=heritageNum(s.career.reputation+3);
  if(site.grant===g.age){
   if(site.used.survey===g.age-1||site.used.dig===g.age-1)s.career.reputation=heritageNum(s.career.reputation+4);
   else {const refund=pr(2750);g.cash-=refund;LD('Excavation grant repayment',-refund);s.career.reputation=heritageNum(s.career.reputation-7);}
  }
  if(ch(38))heritageEvent(s,P(['water','review','grant']),site.id);
 }
 const m=s.museum;
 if(!m)return;
 const items=museumItems(s),quality=items.reduce((n,i)=>n+i.condition,0)/Math.max(1,items.length);
 const country=g.w[m.country]?.n;
 const appeal=Math.min(40,items.length*2)+quality*.38+m.reputation*.57+m.staff.curator*8+m.outreach*2+m.exhibit*17;
 const visitors=Math.max(0,Math.round((2200+appeal*155+m.staff.guide*680+m.trips*120)*(country?.E||60)/65*
  (1/(1+m.fee/Math.max(1,pr(19))))*(m.quiet?.66:1)*R(86,115)/100));
 const admissions=visitors*m.fee,donations=Math.round(visitors*pr(2)*(m.fee?.48:.93)),grant=m.reputation>=65?pr(8000*m.wings.length):0;
 const expenses=pr(m.wings.length*11200+items.length*232)+Object.keys(MUSEUM_STAFF).reduce((n,k)=>n+pr(MUSEUM_STAFF[k][1])*m.staff[k],0);
 const net=admissions+donations+grant-expenses,taxes=net>0?Math.round(net*finEnterpriseRate(m.country,8,35)/100):0;
 const loss=Math.max(0,expenses+taxes-m.cash-admissions-donations-grant);
 m.cash=Math.max(0,m.cash+net-taxes);
 m.last={age:g.age,visitors,admissions,donations,grant,expenses,taxes,loss};
 for(const item of items)
  item.condition=heritageNum(item.condition-(m.staff.conservator?0:2)-(m.wings.includes('climate')?0:1));
 if(loss){
  const employed=Object.keys(MUSEUM_STAFF).reverse().find(k=>m.staff[k]>0);
  if(employed)m.staff[employed]--;
  m.quiet=1;
  m.reputation=heritageNum(m.reputation-8);
  heritageLog(s,m.name+' cut hours after an operating shortfall of '+loc(loss)+'.');
 }else{
  m.quiet=0;
  m.reputation=heritageNum(m.reputation+(items.length>=3&&quality>=60?2:0)+(m.staff.security?1:0));
 }
 m.trips=0;m.outreach=Math.max(0,m.outreach-1);m.exhibit=Math.max(0,m.exhibit-1);
 if(!g.jail&&ch(42)){
  const disputed=items.find(x=>x.method==='dealer');
  const choices=['leak','schools','exhibit'];
  if(disputed)choices.push('claim');
  heritageEvent(s,P(choices),disputed?.id??null);
 }
}
function heritageValidate(s,life){
 const integer=n=>Number.isSafeInteger(n)&&n>=0,score=n=>integer(n)&&n<=100;
 const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const name=x=>typeof x==='string'&&x.trim().length>0;
 const stamp=x=>obj(x)&&Object.values(x).every(integer);
 if(!obj(s)||s.version!==1||!integer(s.serial)||!integer(s.lastAge)||
  !['sites','artifacts','events','history'].every(k=>Array.isArray(s[k]))||
  s.artifacts.length>200||s.history.some(x=>!obj(x)||!integer(x.age)||!name(x.text)))throw Error('Invalid heritage record.');
 const all=[...s.sites,...s.artifacts,...s.events];
 if(all.some(x=>!obj(x)||!integer(x.id)||x.id<1||x.id>s.serial)||new Set(all.map(x=>x.id)).size!==all.length)
  throw Error('Invalid heritage identifiers.');
 if(s.sites.some(x=>!Object.hasOwn(DIG_REGIONS,x.country)||!name(x.name)||typeof x.owned!=='boolean'||!score(x.survey)||
  !integer(x.layer)||x.layer>2||!integer(x.effort)||x.effort>2||!stamp(x.used)||!integer(x.paused)||x.grant!=null&&!integer(x.grant)))
  throw Error('Invalid excavation site.');
 const siteIds=new Set(s.sites.map(x=>x.id));
 const c=s.career;
 if((life.job?.archaeology&&!c)||c!=null&&(!obj(c)||!siteIds.has(c.site)||!integer(c.years)||!score(c.reputation)||!integer(c.discoveries)||!score(c.analysis)))
  throw Error('Invalid archaeology career.');
 if(s.artifacts.some(x=>!Object.hasOwn(DIG_FINDS,x.key)||!name(x.name)||!name(x.material)||!name(x.origin)||
  x.site!=null&&!siteIds.has(x.site)||!integer(x.layer)||x.layer>2||!score(x.condition)||!integer(x.value)||
  ![null,'carbon','chemical','dealer'].includes(x.method)||x.date!=null&&(!Array.isArray(x.date)||x.date.length!==2||!x.date.every(integer))||
  typeof x.mapped!=='boolean'||typeof x.restricted!=='boolean'||typeof x.significant!=='boolean'||
  !['lab','museum','private','donated','sold','traded','stolen'].includes(x.place)||
  x.display!=null&&(x.place!=='private'||typeof x.display!=='string'||!/^[\w-]+$/.test(x.display))||
  x.cleanAge!=null&&!integer(x.cleanAge)))throw Error('Invalid artifact record.');
 if(s.events.some(x=>!Object.hasOwn(HERITAGE_EVENTS,x.key)||!integer(x.age)||typeof x.closed!=='boolean'||
  x.article!=null&&!/^brief-\d+$/.test(x.article)||x.ref!=null&&!integer(x.ref)))throw Error('Invalid heritage event.');
 const m=s.museum;
 if(m==null){
  if(museumItems(s).length)throw Error('Museum collection has no museum.');
  return;
 }
 if(!obj(m)||!name(m.name)||!Object.hasOwn(life.w,m.country)||![m.cash,m.equity,m.fee,m.trips,m.outreach,m.exhibit,m.quiet].every(integer)||
  !score(m.reputation)||!Array.isArray(m.wings)||m.wings[0]!=='main'||new Set(m.wings).size!==m.wings.length||
  m.wings.some(k=>!Object.hasOwn(MUSEUM_WINGS,k))||museumItems(s).length>museumSlots(m)||
  !obj(m.staff)||Object.keys(MUSEUM_STAFF).some(k=>!integer(m.staff[k])||m.staff[k]>MUSEUM_STAFF[k][2]+m.wings.length-1)||
  !stamp(m.used)||m.last!=null&&!stamp(m.last))throw Error('Invalid museum record.');
}
