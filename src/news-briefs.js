/* Public developments become articles; the original action is only applied where the story owns its decision. */
let newsBriefReceipt=null;
const PRESS_OPTIONS = {
  practiceProfile:[['Explain the clinic’s services and access policy',800,4,2],['Meet with local organizations',300,2,4],['Keep a low profile',0,0,0]],
  lawProfile:[['Give a public interview within confidentiality rules',600,4,2],['Discuss the issue at a bar association forum',300,2,4],['Keep the details confidential',0,0,0]],
  business:[['Publish a public summary and take questions',650,3,2],['Meet with affected customers and staff',350,1,3],['Keep the transaction private',0,0,0]],
  civic:[['Hold a public forum',800,3,4],['Release a written public briefing',250,2,2],['Let the official record stand',0,0,0]],
  spotlight:[['Grant an interview',500,4,1],['Thank supporters at a community event',300,2,3],['Decline media requests',0,0,0]],
  property:[['Speak with local residents about the change',250,2,3],['Share a short public statement',100,1,1],['Keep the details private',0,0,0]]
};
const newsRunsAfterLead=brief=>!brief||['businessWorld','businessLocal'].includes(brief.type)||brief.type==='civics'&&!brief.ref;
function newsPublish(kind,title,text,brief,key=null){
  const state=newsState();
  if(key&&(state.editions.some(e=>e.articles.some(a=>a.storyKey===key))||state.queued?.some(e=>e.article.storyKey===key)))return null;
  state.serial=(state.serial||0)+1;
  const article={id:'brief-'+state.serial,storyKey:key,kind,title,text,action:brief?'brief':null,brief,player:true,resolved:false};
  const edition=state.editions.find(e=>e.age===g.age);
  if(edition){
    if(newsRunsAfterLead(brief))edition.articles.push(article);
    else edition.articles.unshift(article);
  }
  else (state.queued??=[]).push({age:g.age,article});
  return article.id;
}
const pressBuildYear=newsBuildYear;
newsBuildYear=function(){
  const state=newsState();
  const outstanding=state.editions.flatMap(e=>e.articles.filter(a=>['practice','lawIncident','studioIncident','businessUpdate','civics','civicsBill','generationEvent','teacherEvent','musicEvent','heritageEvent','casinoEvent','piEvent'].includes(a.brief?.type)&&newsCanRespond(a,e)));
  pressBuildYear();
  for(const article of outstanding){
    if(!state.editions.some(e=>e.articles.some(a=>a.id===article.id)))state.editions[0]?.articles.unshift(article);
  }
  for(const item of state.queued||[]){
    const edition=state.editions.find(e=>e.age===item.age)||state.editions[0];
    if(edition&&!edition.articles.some(a=>a.id===item.article.id)){
      if(newsRunsAfterLead(item.article.brief))edition.articles.push(item.article);
      else edition.articles.unshift(item.article);
    }
  }
  state.queued=[];
};
const NEWS_ACTION_AGES={housing:18,market:18,jobs:14,education:5,health:0,family:0,security:18,fame:13,royalty:0};
const NEWS_BRIEF_AGES={musicEvent:16,generationEvent:0,spotlight:13,civics:18,civicsBill:18};
function newsMinimumAge(article){
 return article.brief?(NEWS_BRIEF_AGES[article.brief.type]??18):(NEWS_ACTION_AGES[article.action]??12);
}
function newsCanRespond(a,edition){
  if(!a?.action||a.resolved||!edition||!g.alive||g.jail||g.age<newsMinimumAge(a))return false;
  if(a.brief?.type==='civics'||a.brief?.type==='civicsBill')return civicNewsAvailable(a,edition);
  if(a.brief?.type==='piEvent')return piEventReady(piNewsEvent(a));
  if(a.brief?.type==='casinoEvent')return casinoEventReady(casinoNewsEvent(a));
  if(a.brief?.type==='heritageEvent')return heritageEventReady(g.heritage,heritageNewsEvent(a));
  if(a.brief?.type==='musicEvent')return musicEventReady(g.music,musicNewsEvent(a));
  if(a.brief?.type==='teacherEvent')return teachEventReady(g.teacher,teachNewsEvent(a));
  if(a.brief?.type==='generationEvent')return !!g.alive&&!g.jail&&genNewsItem(a)?.closed===false;
  if(a.brief?.type==='businessUpdate')return bizNewsCanRespond(a,edition);
  if(a.brief?.type?.startsWith('studio'))return studioNewsCanRespond(a,edition);
  if(a.brief?.type==='practice'){
    return !!g.practice&&g.practice.status==='active'&&g.practice.incidents.some(x=>x.id===a.brief.ref&&!x.closed);
  }
  if(a.brief?.type==='lawIncident')return g.lawFirm?.status==='active'&&g.lawFirm.crisis?.article===a.id;
  return edition.age===g.age;
}
function newsOpenBrief(id){
  if(publicityBusy())return;
  newsBuildYear();
  const edition=newsState().editions.find(e=>e.articles.some(a=>a.id===id));
  if(!edition)return toast('That edition is no longer available.');
  newsEditionAge=edition.age;newsSection=newsArticleSection(edition.articles.find(a=>a.id===id));newsPopupOpen=true;draw(1);
}
function newsBriefOptions(article){
  const {type,ref}=article.brief;
  if(type==='financeMarket')return finNewsOptions(article);
  if(type==='civics'||type==='civicsBill')return civicNewsOptions(article);
  if(type==='musicEvent')return musicNewsOptions(article);
  if(type==='heritageEvent')return heritageNewsOptions(article);
  if(type==='casinoEvent')return casinoNewsOptions(article);
  if(type==='piEvent')return piNewsOptions(article);
  if(type==='teacherEvent')return teachNewsOptions(article);
  if(type==='generationEvent')return genNewsOptions(article);
  if(type==='businessUpdate')return bizNewsOptions(article);
  if(type==='businessWorld')return bizInternationalOptions();
  if(type==='businessLocal')return bizLocalOptions();
  if(type.startsWith('studio'))return studioNewsOptions(article);
  if(type==='practice'){
    const item=g.practice?.incidents.find(x=>x.id===ref);
    return (PRACTICE_INCIDENTS[item?.key]?.options||[]).map(([label,cost],i)=>[label+' · '+clinicMoney(clinicCost(g.practice,cost)),'brief'+i]);
  }
  if(type==='lawIncident'){
    const item=lawCrisisOptions(g.lawFirm);
    return item?[1,2].map((n,i)=>[item[n]+' · '+loc(item[n+2]*g.lawFirm.scale),'brief'+i]):[];
  }
  return (PRESS_OPTIONS[type]||[]).map(([label,cost],i)=>[label+(cost?' · '+loc(pr(cost)):''),'brief'+i]);
}
function newsResolveBrief(article,index){
  const {type,ref}=article.brief;
  if(type==='financeMarket')return finNewsResolve(article,index);
  if(type==='civics'||type==='civicsBill')return civicNewsResolve(article,index);
  if(type==='musicEvent')return musicNewsResolve(article,index);
  if(type==='heritageEvent')return heritageRespond(g.heritage,heritageNewsEvent(article),index);
  if(type==='casinoEvent')return casinoRespond(casinoNewsEvent(article),index);
  if(type==='piEvent')return piRespond(piNewsEvent(article),index);
  if(type==='teacherEvent')return teachNewsResolve(article,index);
  if(type==='generationEvent')return genNewsResolve(article,index);
  if(type==='businessUpdate')return bizNewsResolve(article,index);
  if(type==='businessWorld')return bizInternationalResponse(index);
  if(type==='businessLocal')return bizLocalResponse(index);
  if(type.startsWith('studio'))return studioNewsResolve(article,index);
  if(type==='practice')return clinicRespond(g.practice,clinicFind(g.practice.incidents,ref),index);
  if(type==='lawIncident'){
    const f=g.lawFirm,text=lawResolveCrisis(f,index);
    return {done:!f.crisis,text};
  }
  const option=PRESS_OPTIONS[type]?.[index];
  if(!option)return {done:false,text:'The newspaper could not record that response.'};
  const [label,base,reputation,community]=option,cost=pr(base);
  if(g.cash<cost)return {done:false,text:'Personal cash could not cover this response. The article is still open.'};
  g.cash-=cost;
  LD('Public response expenses',-cost);
  if(type==='practiceProfile'&&g.practice?.status==='active'){
    clinicChange(g.practice,reputation,0,community,g.practice.sites[0]);
  } else if(type==='lawProfile'&&g.lawFirm?.status==='active'){
    lawChange(g.lawFirm,'reputation',reputation);
    lawChange(g.lawFirm,'influence',community);
  } else if(type==='spotlight'){
    g.fame=cl(g.fame+reputation,0,100);
    if(reputation)publicityState().credibility=cl(publicityState().credibility+community,0,100);
  } else if(type==='civic'&&(g.office>=0||royalActive())){
    if(royalActive())royalApplyOpinion(reputation);
    else g.approval=cl(g.approval+reputation,0,100);
    g.pc=cl(g.pc+community,0,100);
  } else if(community){
    g.pop=cl(g.pop+reputation,0,100);
    g.nat.S=cl(g.nat.S+(community>=3?1:0),0,100);
  }
  return {done:true,text:label+'. '+(cost?'You spent '+loc(cost)+'.':'The newspaper recorded your choice.')};
}
function pressNotice(kind,title,summary,type,key){
  return newsPublish(kind,title,summary,{type},key);
}
const pressPass=pass;
pass=function(index,quality){
  const result=pressPass(index,quality);
  if(g.office>=0&&POL[index])pressNotice('government','Legislature adopts '+POL[index][0],OFFICES[g.office].n+' '+g.name+' backed the measure. Constituents are asking about its effects.','civic','bill-'+g.age+'-'+index);
  draw();
  return result;
};
const pressCampaign=campAct;
campAct=function(action){
  const office=g.office,result=pressCampaign(action);
  if(g.office>=0&&office!==g.office){
    pressNotice('government','The election results are in',g.name+' won election as '+OFFICES[g.office].n+'.','civic','election-'+g.age+'-'+g.office);
    draw();
  }
  return result;
};
const pressBusinessFound=found;
found=function(i){
  const old=new Set(g.vent),result=pressBusinessFound(i),business=g.vent.find(x=>!old.has(x));
  if(business){pressNotice('business','A new venture opens',g.name+' launched '+business.n+'.','business');draw();}
  return result;
};
const pressBusinessSale=vsell;
vsell=function(i){
  const business=g.vent[i],result=pressBusinessSale(i);
  if(business&&!g.vent.includes(business)){pressNotice('business','A local venture changes owners',business.n+' has been sold. Customers and staff want to know what comes next.','business');draw();}
  return result;
};
const pressVentureAction=va;
va=function(i,index){
  const business=g.vent[i],row=business&&VT[business.t].acts(business)[index];
  const previous=business&&JSON.stringify(business);
  const result=pressVentureAction(i,index);
  if(row&&/acquire|merge|expand into|go public|company public|go private|split shares|ipo|lay off|declare bankrupt/i.test(row[0])&&previous!==JSON.stringify(business)){pressNotice('business',business.n+' announces a major decision',row[0]+' was announced in the local business section.','business','venture-'+g.age+'-'+i+'-'+index);draw();}
  return result;
};
const pressPropertyPurchase=stuffCompletePurchase;
stuffCompletePurchase=function(method){
  const sale=stuffPurchaseOffer;
  const old=new Set(stuffAllHomes().map(x=>x.id)),result=pressPropertyPurchase(method);
  if(sale?.kind==='home'&&sale.price>=pr(900000)&&stuffAllHomes().some(x=>x.own&&!old.has(x.id))){
    pressNotice('property','A major property transaction closes','Local property records report a high-value purchase.','property');draw();
  }
  return result;
};
const pressActorYear=actorYear;
actorYear=function(){
  const previous=g.actor?.lastAge,result=pressActorYear();
  if(g.actor&&previous!==g.actor.lastAge)for(const p of g.actor.credits.filter(x=>x.releaseAge===g.age&&(x.rank>=3||x.award))){
    pressNotice('arts',p.award==='Winner'?p.n+' wins a production award':p.award==='Nominee'?p.n+' receives an award nomination':p.n+' opens to audiences',
      g.name+' appeared in the production as '+p.role+'.','spotlight','production-'+p.id);
  }
  return result;
};
const pressRoyalDecision=royalDecision;
royalDecision=function(choice){
  const state=royalState(),pending=state?.pending;
  const result=pressRoyalDecision(choice);
  if(pending&&state.pending!==pending&&['decree','law','benefit','disservice'].includes(pending.kind)){
    pressNotice('royalty','The palace announces a public decision',royalPlayer()?royalTitle(royalPlayer())+' '+g.name+' has recorded a decision on '+pending.kind+' policy.':'The royal household released a public update.','civic','royal-'+pending.token);
  }
  return result;
};
const pressLawClose=lawClose;
lawClose=function(f,c,result){
  const prior=c.status,out=pressLawClose(f,c,result);
  if(prior!=='closed'&&c.verdict&&(c.key==='classaction'||c.key==='constitutional'||c.size===2&&c.claim>Math.round(400000*f.scale))){
    pressNotice('law','A closely followed legal matter concludes',f.name+' handled the matter. The public result was '+result.toLowerCase()+'.','lawProfile','law-matter-'+f.startAge+'-'+c.id);
  }
  return out;
};
const pressLawRival=lawRivalAction;
lawRivalAction=function(f,r,action){
  const old=r?.status,out=pressLawRival(f,r,action);
  if(r&&r.status!==old)pressNotice('business','Legal firms announce a combination',f.name+' and '+r.name+' finalized a transaction.','lawProfile');
  return out;
};
function pressLawIncident(f){
  const c=f.crisis;
  if(!c||c.article||!['records','ruling','discipline','criticism','intrusion','malpractice','merger'].includes(c.key))return;
  c.article=newsPublish('law',lawCrisisOptions(f)[0],f.name+' is preparing its public response.',{type:'lawIncident'});
}
const pressLawMonth=lawMonth;
lawMonth=function(f,market){
  const result=pressLawMonth(f,market);
  if(g.lawFirm===f)pressLawIncident(f);
  return result;
};
const pressLawFound=lawFoundOpen;
lawFoundOpen=function(){
  const before=g.lawFirm,result=pressLawFound();
  if(g.lawFirm&&g.lawFirm!==before){
    pressNotice('law','An independent law firm opens',g.lawFirm.name+' opened a practice focused on '+LAW_PRACTICES[g.lawFirm.specialty].name.toLowerCase()+'.','lawProfile');
    draw();
  }
  return result;
};
function newsValidateBriefs(state){
  if(!Array.isArray(state.editions)||state.editions.some(e=>!Array.isArray(e?.articles)))return;
  const types=['practice','lawIncident','studioPress','studioIncident','studioAwards','studioClosure','financeMarket','businessUpdate','businessWorld','businessLocal','civics','civicsBill','generationEvent','teacherEvent','musicEvent','heritageEvent','casinoEvent','piEvent',...Object.keys(PRESS_OPTIONS)];
  const journal=state.journalArchive;
  if(journal!=null&&(!Array.isArray(journal)||journal.some(a=>!Number.isSafeInteger(a?.age)||a.age<0||
    typeof a.title!=='string'||typeof a.text!=='string')))throw Error('Invalid journal archive.');
  const world=state.worldCycle;
  if(world!=null&&(!Number.isSafeInteger(world.age)||world.age<18||!Object.hasOwn(BUSINESS_COUNTRIES,world.key)||
    world.housing!==BUSINESS_COUNTRIES[world.key][3]))throw Error('Invalid world economic cycle.');
  const queued=state.queued??[];
  const serial=state.serial??0;
  if(!Array.isArray(queued)||!Number.isSafeInteger(serial)||serial<0)throw Error('Invalid newspaper brief queue.');
  const briefs=[...state.editions.flatMap(e=>e.articles.filter(a=>a.brief||a.storyKey&&a.id.startsWith('brief-'))),...queued.map(q=>q?.article)];
  const validPayload=a=>a.brief==null?a.action===null:types.includes(a.brief?.type)&&a.action==='brief';
  if(queued.some(q=>!Number.isSafeInteger(q?.age)||q.age<0)||briefs.some(a=>!a||!/^brief-\d+$/.test(a.id)||Number(a.id.slice(6))>serial||
    !validPayload(a)||['generationEvent','teacherEvent','musicEvent','heritageEvent','casinoEvent','piEvent'].includes(a.brief?.type)&&(!Number.isSafeInteger(a.brief.ref)||a.brief.ref<1)||['civics','civicsBill'].includes(a.brief?.type)&&
     (!Number.isSafeInteger(a.brief.ref)||a.brief.ref<0||typeof a.brief.international!=='boolean')||
    a.brief?.type==='civicsBill'&&!['committee','desk','reconsideration','veto'].includes(a.brief.stage)||a.brief?.type==='businessUpdate'&&(typeof a.brief.rumor!=='boolean'||!Number.isSafeInteger(a.brief.decision))||
    ['financeMarket','businessUpdate','businessWorld','businessLocal'].includes(a.brief?.type)&&typeof a.brief.ref!=='string'||['practice','studioIncident','studioPress'].includes(a.brief?.type)&&!Number.isSafeInteger(a.brief.ref)||
    typeof a.title!=='string'||typeof a.text!=='string'||typeof a.resolved!=='boolean')||
    new Set(briefs.map(a=>a.id)).size!==briefs.length)throw Error('Invalid newspaper brief.');
}
const pressBudget=bud;
bud=function(i){
  const result=pressBudget(i);
  if(g.office>=0&&BUD[i]){pressNotice('government','A public budget passes',BUD[i][0]+' is the focus of the new budget.','civic','budget-'+g.age);draw();}
  return result;
};
const pressExecutive=ceoVent;
ceoVent=function(title,field){
  const appointed=g.vent.some(x=>x.ceo),result=pressExecutive(title,field);
  if(!appointed&&g.vent.some(x=>x.ceo)){
    pressNotice('business','An executive appointment is announced',g.name+' took office as '+title+'.',field==='medicine'?'practiceProfile':'business','executive-'+g.age+'-'+field);
  }
  return result;
};
const pressLawOffice=lawAddOffice;
lawAddOffice=function(f,level,owned,place){
  const n=f.offices.length,result=pressLawOffice(f,level,owned,place);
  if(g.lawFirm===f&&f.offices.length>n&&n>0)pressNotice('law','A law firm expands its reach',f.name+' opened an office in '+place+'.','lawProfile');
  return result;
};
const pressLawExit=lawExitFirm;
lawExitFirm=function(){
  const f=g.lawFirm,prior=f?.status,result=pressLawExit();
  if(f&&f.status!==prior){
    if(['Government counsel','Appellate judge'].includes(g.job?.t)){
      pressNotice('law','A public legal appointment is announced',g.name+' accepted a position as '+g.job.t.toLowerCase()+'.','civic','legal-appointment-'+g.age);
    }else pressNotice('law','A law firm announces a leadership change',f.name+' announced that its founder is leaving active management.','lawProfile','law-exit-'+g.age);
    draw();
  }
  return result;
};
const pressPropertySale=stuffSell;
stuffSell=function(kind,id){
  const home=kind==='home'&&stuffAsset(kind,id),result=pressPropertySale(kind,id);
  if(home&&home.v>=pr(900000)&&!stuffAsset(kind,id)){
    pressNotice('property','A prominent property changes hands','A high-value property sale appeared in local records.','property');draw();
  }
  return result;
};
const pressMarriage=marry;
marry=function(){
  const partner=who(),status=partner?.role,result=pressMarriage();
  if(g.fm>=45&&status!=='Spouse'&&partner?.role==='Spouse'){
    pressNotice('community','A public figure announces a marriage',g.name+' confirmed the marriage. The family has been asked how much they wish to share.','spotlight','public-marriage-'+g.age);
    draw();
  }
  return result;
};
function newsEarlierDecisions(state,edition,section='all'){
  if(edition.age!==g.age)return '';
  const older=state.editions.filter(e=>e.age!==edition.age).flatMap(e=>e.articles.filter(a=>newsArticleSection(a)===section&&newsCanRespond(a,e)).map(a=>[e.age,a]));
  return older.length?`<section class="newspaper-pending"><h2>Unresolved decisions from past editions</h2>
    ${older.map(([age,a])=>B(uiEscape(a.title)+' · Age '+age,`newsArticle('${a.id}')`)).join('')}</section>`:'';
}
const pressRealEstateUpgrade=realEstateUpgrade;
realEstateUpgrade=function(){
  const old=g.realEstate?.level,result=pressRealEstateUpgrade();
  if(old&&g.realEstate?.level>old){
    pressNotice('property','A local real estate practice expands',g.name+' expanded their real estate practice after a series of completed sales.','property','realestate-growth-'+g.realEstate.level);
    draw();
  }
  return result;
};
const pressSportsContract=pro;
pro=function(){
  const was=g.job,result=pressSportsContract();
  if(g.job!==was&&g.job?.t==='Pro athlete')pressNotice('sports','A professional team confirms a signing',g.name+' entered the professional league.','spotlight','professional-signing-'+g.age);
  return result;
};
const pressRoyalInstitution=royalInstitutionDecision;
royalInstitutionDecision=function(action){
  const state=royalState()?.institutions,pending=state?.pending;
  const result=pressRoyalInstitution(action);
  if(pending?.type==='tour'&&state.pending!==pending){
    pressNotice('royalty','The palace reports on its overseas tour','The royal household released a report on its diplomatic visit and community engagements.','civic','tour-'+pending.token);
  }
  return result;
};
const pressConstitution=royalConstitutionAction;
royalConstitutionAction=function(action){
  const state=royalState()?.institutions,before=state?.used['constitution-'+action];
  const result=pressConstitution(action);
  if(state&&before!==state.used['constitution-'+action]&&['assent','emergency'].includes(action)){
    pressNotice('royalty',action==='assent'?'The palace assents to a public-interest bill':'Emergency relief receives royal approval',
      'The government and royal household released a public account of the decision.','civic','constitution-'+g.age+'-'+action);
    draw();
  }
  return result;
};
const pressAppearance=publicityResolve;
publicityResolve=function(decision){
  const previous=g.publicity?.receipt?.token,result=pressAppearance(decision),receipt=g.publicity?.receipt;
  if(g.fm>=30&&receipt?.accepted&&previous!==receipt.token&&receipt.reception>=70){
    pressNotice('culture','A public appearance draws attention',g.name+' took part in '+receipt.title.toLowerCase()+'. The response was widely reported.','spotlight','appearance-'+receipt.token);
  }
  return result;
};
