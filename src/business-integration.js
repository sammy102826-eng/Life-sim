function bizExtraPrincipal(v,amount){
 const debt=v.biz.debt;
 if(!debt||!Number.isSafeInteger(amount)||amount<=0)return 'Enter a positive payment for an outstanding company loan.';
 amount=Math.min(amount,debt.bal);
 if(!bizPay(v,'Extra loan principal',amount))return 'Company cash cannot cover the payment.';
 debt.bal-=amount;if(!debt.bal)v.biz.debt=null;
 bizRevalue(v);
 return 'Paid '+loc(amount)+' from company funds.';
}
const bizPreviousCompanyYear=VT.co.year;
VT.co.year=function(v){
 if(!v.biz)return bizPreviousCompanyYear.call(this,v);
 if(v.ceo&&bizActive()!==v)return false;
 bizYear(v);
};
const bizPreviousVenture=bizP;
bizP=function(i){
 const v=g.vent[i];
 if(!v?.biz)return bizPreviousVenture(i);
 return bizSection(v.n,'<p>Company funds '+loc(v.biz.cash)+' · Reputation '+v.rep+'/100</p>'+
  (bizActive()===v?B('Manage business','bizGo()'):bizButton('Resume business management','resume',v.marketId,'',!bizAllowed()||!!v.ceo)));
};
const bizOldVA=va,bizOldSale=vsell;
va=function(i,j){if(!g.vent[i]?.biz)return bizOldVA(i,j);};
vsell=function(i){if(!g.vent[i]?.biz)return bizOldSale(i);};
function bizExecutive(field){
 if(g.job?.t!=='CEO'||g.job.sp)return null;
 let v=g.vent.find(x=>x.ceo&&x.biz&&x.n===g.job.company);
 if(v)return v;
 const old=g.vent.find(x=>x.ceo&&!x.biz);
 const industry={tech:'ai',finance:'finance',retail:'retail',logistics:'manufacturing',accounting:'finance',marketing:'marketing',sales:'retail'}[field]||'marketing';
 const name=g.job.company||old?.n||'Summit Operations';
 v=bizNew(name,industry,pr(1200000),true);
 const listing=finFind(finInitMarket().companies,old?.marketId)||finInitMarket().companies.find(c=>c.name===name&&!c.linked&&!c.bizStatus);
 g.job.company=name;
 v.marketId=listing?.id;v.pub=listing?.public??true;v.sh=listing?.shares||1000000;
 v.val=v.pub&&listing?.price?Math.round(listing.price*v.sh):pr(4500000);
 const [product,price]=bizIndustry(v).types[0];
 bizProduct(v,product,0,pr(price),pr(18000),'subscription');
 v.biz.factories=3;v.biz.stores=3;v.biz.roles.entry.count=10;v.biz.roles.specialist.count=5;
 if(listing)bizSeedPatents(v,listing);
 if(old)g.vent.splice(g.vent.indexOf(old),1,v);else g.vent.push(v);
 finCompanyQuote(finInitMarket(),v);
 return v;
}
const bizOldAppointment=ceoVent;
ceoVent=function(title,field){
 if(title!=='CEO')return bizOldAppointment(title,field);
 const v=bizExecutive(field);
 if(v)bizPress(v,v.n+' appoints a CEO',g.name+' joined as chief executive under board oversight.');
};
const bizOldTrack=jobUpdatePromotionTrack;
jobUpdatePromotionTrack=function(j){
 const track=bizOldTrack(j);
 if(!track||!['office','sales','accounting','marketing','tech','retail','finance','logistics','engineering','software','data','trades'].includes(j.f))return track;
 const pay=track.at(-1)[1];
 return [...track,['Vice president',Math.round(pay*1.42),2,10,35],['CEO',Math.round(pay*2.1),2,15,38]];
};
const bizPriorEffect=E;
E=function(effect){
 if(g.job?.businessId&&effect?.fire)return bizPriorEffect({...effect,fire:false});
 return bizPriorEffect(effect);
};
const bizOldQuit=quit,bizOldRetire=retire,bizOldEnrol=enrol,bizOldCollege=collegeStart,bizOldCampaign=runFor,bizOldOdds=oddJob;
quit=function(i){
 if(i<0&&bizActive())return bizAction('confirm',bizActive().ceo?'resign':'close');
 return bizOldQuit(i);
};
retire=function(){if(g.job?.businessId)return toast('Sell or wind down the business before retiring.');return bizOldRetire();};
enrol=function(goal){if(bizActive())return toast('Company management requires a free school schedule.');return bizOldEnrol(goal);};
collegeStart=function(id){if(bizActive()){toast('Company management requires a free school schedule.');return draw();}return bizOldCollege(id);};
runFor=function(i){if(g.job?.businessId)return toast('Step away from management before running for office.');return bizOldCampaign(i);};
oddJob=function(i){if(g.job?.businessId)return toast('Your business is already your active job.');return bizOldOdds(i);};
const bizOldTrade=finTrade;
finTrade=function(id,units,sell=false){
 const player=bizActive(),s=finState(),before=s.positions[id]?.units||0;
 const listed=g.vent.find(v=>v.marketId===id&&v.biz&&v.pub);
 if(listed&&!sell&&before+units>Math.floor(listed.sh*(100-listed.own)/100))return 'The order exceeds shares available outside the founder stake.';
 const result=bizOldTrade(id,units,sell),after=s.positions[id]?.units||0;
 if(player&&before!==after){
  const related=player.marketId===id||player.biz.escrow?.id===id||player.biz.watchTarget===id;
  if(related)player.biz.insider={id,age:g.age,reviewed:false};
  else if(!sell){
   (player.biz.trades??={})[id]=g.age;
  }
 }
 return result;
};
const bizPreviousEligibility=elig;
elig=function(type,job){return job?.[0]!=='Entrepreneur'&&bizPreviousEligibility(type,job);};
const bizPreviousFound=found;
found=function(index){
 if(FOUND[index]?.[2]==='co')return bizStartOpen();
 return bizPreviousFound(index);
};
const bizPreviousWork=workV;
workV=function(){
 if(g.jail)return bizPreviousWork();
 if(g.job?.t==='CEO')bizExecutive(g.job.f);
 const v=bizActive();
 if(v&&(wsel==='business'||wsel==='job'))return bizWorkView(v);
 if(wsel==='business-entry')return bizEntryView();
 const html=bizPreviousWork();
 if(!v&&wsub==='Special'&&!wsel)return B('Business <small>Acquire or start a company</small>','bizStartOpen()')+html;
 if(!v||wsel||wsub)return html;
 const page=document.createElement('div');page.innerHTML=html;
 const old=page.querySelector('[onclick="wsel=\'job\';draw(1)"]');
 const card=B(uiEscape(v.n)+' <small>'+bizIndustry(v).name+' · Reputation '+v.rep+'/100</small>','bizGo()');
 old?.insertAdjacentHTML('beforebegin',card);old?.remove();
 if(v.ceo){
  const i=g.vent.indexOf(v);
  page.querySelector(`[onclick="wsel='bz${i}';draw(1)"]`)?.remove();
 }
 return page.innerHTML;
};
let bizUiLife=null;
const bizPreviousGame=gameView;
gameView=function(){
 if(bizUiLife!==g){bizDialog=null;bizPage='overview';bizStartPage='home';bizUiLife=g;}
 const html=bizPreviousGame();
 if(g.jail||g.justice?.pending)return html;
 const v=bizActive();
 if(!v||!bizDialog&&!v.biz.events.some(e=>!e.closed&&!e.seen&&e.age===g.age))return html;
 const root=document.createElement('div');root.innerHTML=html;
 if(!root.querySelector('.mo')){
  const popup=bizModal(v);
  if(popup)root.querySelector('.game')?.insertAdjacentHTML('beforeend',popup);
 }
 return root.innerHTML;
};
const bizOriginalAge=ageUp;
ageUp=function(){
 if(g&&!g.jail&&bizDialog)return;
 if(g?.job?.t==='CEO'&&!g.jail)bizExecutive(g.job.f);
 return bizOriginalAge();
};
function bizNewsCanRespond(article,edition){
 const decision=article.brief.decision;
 if(!decision)return edition.age===g.age;
 const v=g.vent.find(x=>x.marketId===article.brief.ref&&x.biz);
 return !!v?.biz.events.some(e=>e.id===decision&&!e.closed)&&!g.jail;
}
function bizNewsOptions(article){
 const v=g.vent.find(x=>x.marketId===article.brief.ref&&x.biz),e=v?.biz.events.find(x=>x.id===article.brief.decision);
 if(e)return bizOptions(v,e).map(([label,cost],i)=>[label+(cost?' · '+loc(cost):''),'brief'+i]);
 if(article.brief.rumor)return [['Review the company listing','brief0'],['Follow a confirmed update','brief1'],['Wait for verification','brief2']];
 return [['Review the company and its listing','brief0'],['Follow the company’s next report','brief1'],['Keep your current plans','brief2']];
}
function bizNewsResolve(article,index){
 const v=g.vent.find(x=>x.marketId===article.brief.ref&&x.biz),e=v?.biz.events.find(x=>x.id===article.brief.decision);
 return e?bizDecision(v,e,index):finNewsResolve(article,index);
}
function bizInternationalOptions(){
 return [['Review how this affects investments','brief0'],['Compare home prices this year','brief1'],['Keep your current plans','brief2']];
}
function bizInternationalResponse(index){
 if(index===0){tab='Other';NV.O=['Finance'];finPage='market';finSelected=null;}
 if(index===1){tab='Stuff';stuffSelected=null;stuffPurchaseOffer=null;stuffShopTab='Property';}
 return {done:true,text:['Opened Investments for review.','Opened current property listings.','You kept your current plans.'][index]};
}
function bizWorldYear(){
 if(g.age<18)return;
 const s=newsState();
 if(s.worldCycle?.age===g.age)return;
 const choices=Object.keys(BUSINESS_COUNTRIES);
 const key=choices[Math.floor(newsRandom(g.age,49)*choices.length)];
 const [title,text,changes,housing]=BUSINESS_COUNTRIES[key];
 s.worldCycle={age:g.age,key,housing};
 for(const [sector,value] of Object.entries(changes))g.eco[sector]=cl(g.eco[sector]+value,5,95);
 newsPublish('international',title,text,{type:'businessWorld',ref:key},'international-economy-'+g.age);
 if(g.age%4===2){
  const delta=newsRandom(g.age,52)<.5?-1:1;
  const policy=g.w[g.country].t;
  policy.inc=cl(policy.inc+delta,0,50);
  newsPublish('government',g.country+' adjusts its income tax rate','The standard rate '+(delta<0?'fell':'rose')+' to '+policy.inc+'%. The change applies to this year’s payroll and filing.',
   {type:'businessLocal',ref:'tax'},'domestic-tax-'+g.age);
 }
}
const bizOldStuff=stuff;
stuff=function(){bizWorldYear();return bizOldStuff();};
const bizOldNewsBuild=newsBuildYear;
newsBuildYear=function(){
 bizWorldYear();
 const result=bizOldNewsBuild();
 const s=newsState(),e=s.editions.find(x=>x.age===g.age);
 if(e&&s.worldCycle?.age===g.age&&s.worldHousingAge!==g.age){
  s.worldHousingAge=g.age;
  const factor=s.market?.expiresAge===g.age+1?s.market.factor:1;
  s.market={factor:factor*s.worldCycle.housing,expiresAge:g.age+1};
 }
 return result;
};
function bizValidate(life){
 const ventures=life.vent||[],rows=ventures.filter(v=>v?.biz!=null);
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x),count=x=>Number.isSafeInteger(x)&&x>=0;
 const id=x=>typeof x==='string'&&/^[A-Za-z0-9:-]+$/.test(x);
 if(life.job?.businessId&&!rows.some(v=>v.marketId===life.job.businessId&&!v.ceo))throw Error('Missing active business.');
 for(const v of rows){
  const s=v.biz;
  if(v.t!=='co'||!id(v.marketId)||!bizName(v.n)||!object(s)||s.version!==1||!Object.hasOwn(BUSINESS_INDUSTRIES,s.industry)||
    !Number.isSafeInteger(s.cash)||!count(s.serial)||!count(s.lastAge)||!count(s.factories)||!count(s.stores)||!s.factories||!s.stores||
    !['standard','strong','poor'].includes(s.conditions)||!['home','abroad'].includes(s.sourcing)||
    !['products','patents','locations','reports','interns','events','subs','history'].every(k=>Array.isArray(s[k]))||
    !s.locations.includes(s.hq)||s.locations.some(x=>typeof x!=='string'||!Object.hasOwn(life.w||{},x))||!object(s.ledger)||!object(s.roles)||!object(s.responses)||
    !Object.keys(BUSINESS_ROLES).every(k=>object(s.roles[k])&&count(s.roles[k].pay)&&count(s.roles[k].count))||
    !['basis','morale','board','ethics','conduct','research','progress'].every(k=>count(s[k]))||
    !['standard','complex'].includes(s.taxPlan)||!count(v.sh)||!v.sh||typeof v.pub!=='boolean'||!count(v.own)||v.own>100||!count(v.rep)||v.rep>100)throw Error('Invalid business data.');
  const identified=[...s.products,...s.patents,...s.events,...s.interns];
  if(identified.some(r=>!object(r)||!count(r.id)||r.id>s.serial)||new Set(identified.map(r=>r.id)).size!==identified.length||
    s.products.some(p=>!bizName(p.name)||!BUSINESS_INDUSTRIES[s.industry].types[p.type]||!count(p.price)||!p.price||!count(p.marketing)||
      !['sale','subscription'].includes(p.model)||!count(p.quality)||!count(p.subscribers)||p.patent!=null&&!s.patents.some(x=>x.id===p.patent))||
    s.patents.some(p=>!bizName(p.name)||!['discovered','patented','licensed'].includes(p.status)||!count(p.licenses))||
    s.events.some(e=>!count(e.age)||typeof e.closed!=='boolean'||e.kind==='insider'&&!['insider','espionage'].includes(e.offense)||!Object.hasOwn(BUSINESS_EVENTS,e.kind)&&
     !['report','antitrust','offer','intern','deficit','board','insider'].includes(e.kind))||
    s.subs.some(x=>!object(x)||!id(x.id)||!bizName(x.name)||!count(x.price)||!Number.isFinite(x.earnings)||!Array.isArray(x.patentNames)||
     !['pending','merge','independent','assets'].includes(x.mode))||
    s.reports.some(x=>!object(x)||!count(x.age)||!Number.isFinite(x.profit)||!object(x.costs)||!Array.isArray(x.products)||x.products.some(p=>!object(p)||!count(p.units)))||
    s.debt!=null&&(!object(s.debt)||!count(s.debt.bal)||!count(s.debt.left)||!s.debt.left||!Number.isFinite(s.debt.rate)||!id(s.debt.lender))||
    s.escrow!=null&&(!object(s.escrow)||!id(s.escrow.id)||!count(s.escrow.price)||!count(s.escrow.due)))throw Error('Invalid business records.');
 }
 if(new Set(rows.map(v=>v.marketId)).size!==rows.length)throw Error('Duplicate businesses.');
}
function bizLocalOptions(){
 return [['Review this year’s tax records','brief0'],['Review your household budget','brief1'],['Keep your current plans','brief2']];
}
function bizLocalResponse(index){
 if(index===0){tab='Other';NV.O=['Finance'];finPage='taxes';}
 if(index===1){tab='Other';NV.O=['Dashboard'];}
 return {done:true,text:['Opened your tax records.','Opened your household budget.','You kept your current plans.'][index]};
}
function bizMarketDeals(s){
 if(g.age<25||g.jail||s.dealAge===g.age)return;
 s.dealAge=g.age;
 const pending=s.corporateDeal;
 if(pending){
  s.corporateDeal=null;
  const buyer=finFind(s.companies,pending.buyer),target=finFind(s.companies,pending.target);
  if(!buyer?.public||!target?.public||buyer.linked||target.linked||buyer.bizStatus||target.bizStatus||!pending.approved){
   if(buyer)finHeadline('Independent merger talks end','The rumored combination did not receive enough support to close.',buyer.id,'corporate-deal-end-'+g.age);
   return;
  }
  const payout=finRoundPrice(target.price*1.18);
  finClosePosition(s,target.id,payout,'Merger proceeds');
  buyer.revenue+=Math.round(target.revenue*.5);buyer.earnings+=Math.round(target.earnings*.5);
  const opening=buyer.price/Math.max(.05,1+buyer.change/100);
  buyer.price=finRoundPrice(buyer.price*1.075);buyer.change=Math.round((buyer.price/opening-1)*100);
  target.public=false;target.price=null;target.change=0;target.bizStatus='merged';
  finHeadline(buyer.name+' merges with '+target.name,'The deal closed. '+target.name+' shares were cashed out at '+finQuote(payout)+', and '+buyer.name+' reported a higher revenue outlook.',buyer.id,'corporate-deal-close-'+g.age);
  return;
 }
 if(g.age%6!==1)return;
 const target=s.companies.find(c=>['NQL','FSP','SLT'].includes(c.id)&&c.public&&!c.linked&&!c.bizStatus);
 const buyer=target&&s.companies.find(c=>c.sector===target.sector&&c.public&&!c.penny&&!c.linked&&!c.bizStatus);
 if(!buyer)return;
 s.corporateDeal={buyer:buyer.id,target:target.id,approved:newsRandom(g.age,53)>.32};
 newsPublish('business','Merger rumor: '+buyer.name+' and '+target.name,'Neither company has confirmed a deal. A completed merger could change both listings.',
  {type:'businessUpdate',ref:buyer.id,decision:0,rumor:true},'corporate-deal-rumor-'+g.age);
}
const bizPriorMarketYear=finMarketYear;
finMarketYear=function(s){
 const result=bizPriorMarketYear(s);
 bizMarketDeals(s);
 return result;
};
