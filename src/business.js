const bizMoney=n=>Math.round(n);
const bizIndustry=v=>BUSINESS_INDUSTRIES[v.biz.industry];
const bizRound=(n,a,b)=>Math.round(cl(n,a,b));
const bizJob=v=>({t:'Business owner',f:'business',sp:1,pay:0,yrs:0,businessId:v.marketId});
const bizActive=()=>g.vent.find(v=>v.biz&&(g.job?.businessId===v.marketId||v.ceo&&g.job?.t==='CEO'&&g.job.company===v.n));
const bizAllowed=()=>g.age>=18&&g.alive&&!g.jail&&!g.ret&&g.office<0&&!royalActive()&&
 !g.job&&!g.pt.length&&!g.intern&&!g.educationJourney?.internships?.some(x=>x.status==='Active')&&!g.study&&!g.collegeTrack?.current&&!g.actor?.projects?.some(p=>p.status==='signed');
const bizSize=v=>v.biz.locations.length+Math.max(0,v.biz.factories+v.biz.stores-2);
const bizHeadcount=v=>Object.values(v.biz.roles).reduce((n,r)=>n+r.count,0);
const bizRequired=v=>4+bizSize(v)*2;
const bizVoting=v=>Math.min(100,v.own+(v.pub?(g.financial?.positions[v.marketId]?.units||0)*100/v.sh:0));
const bizSlots=(v,key)=>BUSINESS_ROLES[key][2]+Math.floor((bizSize(v)-1)*(key==='entry'?3:key==='specialist'?2:.5));
const bizCountryTax=v=>Math.max(0,(BUSINESS_CORPORATE_RATES[v.biz.hq]??Math.round(cl((g.w[v.biz.hq]?.t.inc||20)+3,10,39)))-(v.biz.taxPlan==='complex'?6:0));
const bizCapital=k=>pr(['manufacturing','energy','construction'].includes(k)?150000:85000);
const bizName=n=>typeof n==='string'&&n.trim().length>0&&n.length<=60&&!/[<>]/.test(n);
const bizCandidates=()=>finSyncCompanies().companies.filter(c=>!c.linked&&!c.bizOwner&&!c.bizStatus&&!FINANCE_BANKS.some(b=>b.id===c.id));
const bizSectorIndustry=(sector)=>({technology:'ai',industry:'manufacturing',energy:'energy',agriculture:'food',finance:'finance',services:'retail'}[sector]||'retail');
function bizNew(name,industry,cash,ceo=false){
 const v=VT.co.mk(name,'corp');
 v.rev=0;v.rep=ceo?62:42;v.own=ceo?0:100;v.ceo=ceo?1:0;v.val=cash;v.prod=0;
 v.biz={
  version:1,industry,cash,hq:g.country,locations:[g.country],factories:1,stores:1,conditions:'standard',sourcing:'home',
  benefits:6,morale:62,research:0,progress:0,patents:[],products:[],roles:{},interns:[],reports:[],ledger:{},
  debt:null,escrow:null,subs:[],events:[],history:[],taxPlan:'standard',lastAge:g.age,serial:0,
  basis:cash,offer:null,sale:false,review:0,board:65,ethics:60,conduct:60,responses:{},insider:null
 };
 for(const [key,[,base,max]] of Object.entries(BUSINESS_ROLES)){
  v.biz.roles[key]={count:ceo?max:({entry:2,specialist:1,lead:1}[key]||0),pay:pr(base)};
 }
 return v;
}
function bizPost(v,label,value){
 v.biz.cash+=value;
 if(value)v.biz.ledger[label]=(v.biz.ledger[label]||0)+value;
}
function bizPay(v,label,amount){
 if(!Number.isSafeInteger(amount)||amount<0||v.biz.cash<amount)return false;
 bizPost(v,label,-amount);
 return true;
}
function bizRecord(v,message){
 const s=v.biz;
 s.history.unshift({age:g.age,text:message});s.history=s.history.slice(0,40);
 L(uiEscape(v.n+' · '+message));
}
function bizPress(v,title,body,event=null,rumor=false){
 const s=v.biz;
 return newsPublish('business',title,body,{type:'businessUpdate',ref:v.marketId,decision:event?.id||0,rumor},'business-'+v.marketId+'-'+(++s.serial));
}
function bizEvent(v,kind,data={}){
 const s=v.biz,item={id:++s.serial,kind,age:g.age,closed:false,...data};
 s.events.push(item);
 if(s.events.length>80){const old=s.events.findIndex(e=>e.closed);if(old>=0)s.events.splice(old,1);}
 const e=BUSINESS_EVENTS[kind];
 if(kind!=='intern')item.article=bizPress(v,e?.[0]||item.title,e?.[1]||item.text,item,kind==='offer'&&item.hostile);
 return item;
}
function bizSkill(){
 const business=g.maj==='Business'&&g.edu>=2||g.collegeTrack?.degrees?.some(x=>['Business','Economics','Finance'].includes(x.major));
 return (business?22:0)+Math.min(30,['business','office','finance','sales','accounting','marketing','tech'].reduce((n,k)=>n+(g.exp[k]||0),0)*2)+Math.floor(g.smarts/7);
}
function bizFunding(){
 const skill=bizSkill(),t=finLoanTerms('business');
 return {skill,investor:pr(45000+skill*2200),loan:t.eligible?Math.round(t.limit*(.7+skill/90)):0,rate:Math.max(4,t.rate-skill*.08),lender:t.issuer};
}
function bizProduct(v,name,type,price,marketing,model,patent=null){
 const s=v.biz,def=bizIndustry(v).types[type];
 if(!bizName(name)||!def||!['sale','subscription'].includes(model)||!Number.isSafeInteger(price)||price<1||price>pr(1e6)||
   !Number.isSafeInteger(marketing)||marketing<0||marketing>pr(1e7)||s.products.length>=35||
   s.products.some(p=>p.name.toLowerCase()===name.toLowerCase())||patent!=null&&!s.patents.some(p=>p.id===patent&&['patented','licensed'].includes(p.status)))return false;
 s.products.push({id:++s.serial,name,type,price,marketing,model,patent,subscribers:0,units:0,quality:52});
 v.prod=s.products.length;
 return true;
}
function bizAcquirePrice(c,method='negotiated'){
 const base=c.public?Math.max(pr(170000),c.price*(c.shares||100000)*(method==='majority'?.52:1)):Math.max(pr(115000),c.revenue*.22);
 return bizMoney(base*(method==='tender'?1.28:method==='market'?1.13:1));
}
function bizTakeListing(c,v,paid=0){
 const s=finState();
 if(v.marketId!==c.id){
  if(c.public&&s.positions[c.id]){
   const reference=paid/(c.shares||100000);
   finClosePosition(s,c.id,Math.max(c.price,reference),'Acquisition share payout');
  }
  c.public=false;c.price=null;c.change=0;c.linked=false;c.bizOwner=v.marketId;c.bizStatus='subsidiary';
 }
}
function bizAttach(v){
 g.vent.push(v);
 finCompanyQuote(finInitMarket(),v);
 g.job=bizJob(v);g.ue=false;
}
function bizFound(name,industry,funding,amount){
 if(!bizAllowed()||!bizName(name)||!Object.hasOwn(BUSINESS_INDUSTRIES,industry)||!Number.isSafeInteger(amount)||amount<pr(15000)||amount>g.cash)return 'Choose a name, industry, and an affordable owner contribution.';
 const t=bizFunding(),minimum=bizCapital(industry);
 const capital=funding==='self'?0:funding==='investors'?t.investor:funding==='loan'?t.loan:-1;
 if(capital<0||funding!=='self'&&!capital||funding==='investors'&&t.skill<17||capital+amount<minimum)return 'Funding fell short of the opening requirement of '+loc(minimum)+'. Build experience or increase your contribution.';
 const v=bizNew(name.trim(),industry,0);
 bizPost(v,'Opening owner capital',amount);
 if(capital)bizPost(v,funding==='investors'?'Outside investor capital':'Opening loan principal',capital);
 v.biz.basis=amount;
 if(funding==='investors')v.own=65;
 if(funding==='loan')v.biz.debt={bal:capital,rate:t.rate,lender:t.lender,left:8};
 const setup=Math.round(minimum*.17);
 bizPost(v,'Opening equipment and registration',-setup);
 g.cash-=amount;LD('Business owner contribution',-amount);
 bizAttach(v);
 bizRecord(v,'The company opened with '+loc(v.biz.cash)+' in operating funds.');
 bizPress(v,name+' opens for business',bizIndustry(v).name+' company '+name+' began operations.');
 return '';
}
function bizBuy(id){
 const c=bizCandidates().find(row=>row.id===id);
 if(!bizAllowed()||!c)return 'This acquisition is unavailable.';
 const price=bizAcquirePrice(c,'majority'),reserve=pr(85000);
 if(g.cash<price+reserve)return 'You need '+loc(price+reserve)+' for the acquisition and opening reserve.';
 const v=bizNew(c.name,bizSectorIndustry(c.sector),0);
 bizPost(v,'Opening owner capital',reserve);
 v.marketId=c.id;v.own=c.public?51:100;v.pub=c.public;v.sh=c.shares||100000;
 v.val=c.public?Math.round(c.price*v.sh):price+reserve;
 v.rep=58;
 const [type,unitPrice]=bizIndustry(v).types[0];
 bizProduct(v,type,0,pr(unitPrice),0,'sale');
 bizSeedPatents(v,c);
 v.biz.basis=price+reserve;
 g.cash-=price+reserve;LD('Business acquisition and reserve',-price-reserve);
 bizAttach(v);
 bizRecord(v,'You completed the acquisition for '+loc(price)+'.');
 bizPress(v,c.name+' changes hands','The acquisition closed and includes its existing product and intellectual property.');
 return '';
}
function bizSeedPatents(v,c){
 for(let i=0;i<Math.min(4,c.patents||0);i++){
  v.biz.patents.push({id:++v.biz.serial,name:c.patentNames?.[i]||c.name+' design '+(i+1),status:'patented',licenses:0});
 }
 v.patents=v.biz.patents.filter(p=>p.status==='patented').length;
}
function bizForecast(v,demandFactor=1){
 const s=v.biz,industry=bizIndustry(v),staff=bizHeadcount(v);
 const coverage=Math.min(1,staff/bizRequired(v)),morale=.7+s.morale/240;
 const market=(.7+(g.eco[industry.sector]||50)/166)*(s.locations.length*.48+.52);
 const work={strong:1.16,standard:1,poor:.8}[s.conditions],source=(s.sourcing==='home'?1.04:.75)*(s.ai?.91:1);
 let available=Math.floor(Math.min(s.factories*1900,s.stores*1850)*coverage*morale);
 let revenue=0,production=0,ads=0;
 const demandByProduct=s.products.map(p=>{
  const [,typical,input]=industry.types[p.type];
  const patent=s.patents.some(x=>x.id===p.patent&&['patented','licensed'].includes(x.status));
  const attraction=(p.quality+v.rep+36)/110+(patent?.22:0)+((s.demandUntil||0)>=g.age?.12:0);
  const demand=Math.max(0,Math.round(1380*demandFactor*market*attraction*
    Math.pow(pr(typical)/Math.max(1,p.price),1.45)*(1+Math.min(.85,p.marketing/Math.max(1,pr(75000))))));
  const retained=p.model==='subscription'?Math.round(p.subscribers*cl(.48+s.morale/220,0,.95)):0;
  return {p,input,demand:demand+retained};
 });
 const totalDemand=demandByProduct.reduce((n,x)=>n+x.demand,0);
 let remainingDemand=totalDemand;
 const products=[];
 for(const {p,input,demand} of demandByProduct){
  const units=remainingDemand?Math.min(demand,Math.floor(available*demand/remainingDemand)):0;
  available-=units;remainingDemand-=demand;
  revenue+=units*p.price;
  production+=Math.round(units*pr(input)*source*work*(p.model==='subscription'?.78:1));
  ads+=p.marketing;
  products.push({id:p.id,units,subscribers:p.model==='subscription'?units:0});
 }
 const licensing=s.patents.reduce((n,p)=>n+(p.status==='patented'?p.licenses*pr(9500):0),0);
 const subsidiary=s.subs.reduce((n,p)=>n+(p.mode==='independent'?Math.round(p.earnings*.42):0),0);
 const payroll=Object.values(s.roles).reduce((n,r)=>n+r.count*r.pay,0);
 const interest=s.debt?bizMoney(s.debt.bal*s.debt.rate/100):0;
 const principal=s.debt?Math.ceil(s.debt.bal/s.debt.left):0;
 const costs={Manufacturing:production,Payroll:payroll,Benefits:bizMoney(payroll*s.benefits/100),Marketing:ads,
  Administration:pr(14000*s.locations.length),Facilities:pr(s.factories*15000+s.stores*11000),Research:s.research,
  Internships:s.interns.filter(i=>i.status==='active'&&i.paid).length*pr(4000),Interest:interest};
 const income=revenue+licensing+subsidiary,expenses=Object.values(costs).reduce((sum,n)=>sum+n,0);
 const tax=bizMoney(Math.max(0,income-expenses)*bizCountryTax(v)/100);
 return {age:g.age,income,revenue,licensing,subsidiary,expenses,costs,tax,profit:income-expenses-tax,principal,products};
}
function bizRevalue(v,earnings=v.biz.reports[0]?.profit||0){
 const s=v.biz,next=bizForecast(v);
 v.emp=bizHeadcount(v);
 v.patents=s.patents.filter(p=>p.status==='patented').length;
 const listing=finFind(finState().companies,v.marketId);
 if(listing)listing.patentNames=s.patents.filter(p=>p.status==='patented').map(p=>p.name);
 v.prod=s.products.length;
 v.val=Math.max(pr(12000),Math.round(s.cash-(s.debt?.bal||0)+s.factories*pr(35000)+s.stores*pr(25000)+
   Math.max(0,earnings)*3+Math.max(0,next.profit)*2+Math.max(v.rev,next.revenue)*.28+v.patents*pr(30000)+s.subs.reduce((n,x)=>n+(x.mode==='independent'?x.price*.65:0),0)));
 finCompanyQuote(finInitMarket(),v);
}
function bizMaterial(v){
 const s=v.biz;
 if(!s.insider||s.insider.age<g.age-1||s.insider.reviewed)return;
 s.insider.reviewed=true;
 if(ch(55)){
  s.investigation=g.age+1;s.investigationKind='insider';
  bizPress(v,'Regulator reviews trading in '+v.n,'Trading around a material announcement has drawn a formal review.');
 }
}
function bizIPO(v){
 const s=v.biz;
 if(v.ceo||v.pub||s.reports.length<1||v.val<pr(130000)||s.cash<0)return 'The company needs a completed annual report and a valuation of '+loc(pr(130000))+' to list.';
 v.pub=true;v.own=Math.round(v.own*.75);
 bizPost(v,'Public offering proceeds',Math.round(v.val*.25));
 bizRevalue(v);
 bizPress(v,v.n+' completes its IPO','New shares were issued. The proceeds went into company funds and existing ownership was diluted.');
 return '';
}
function bizWithdraw(v,amount){
 if(v.ceo||bizVoting(v)<51)return 'The board controls distributions without a majority stake.';
 if(!Number.isSafeInteger(amount)||amount<1)return 'Enter a positive distribution.';
 const gross=Math.ceil(amount*100/v.own);
 if(!bizPay(v,'Shareholder distributions',gross))return 'Company funds cannot cover the distribution to all shareholders.';
 const tax=Math.round(amount*finTaxProfile().gains/100);
 g.cash+=amount-tax;LD('Business owner distribution',amount);LD('Business distribution tax',-tax);
 return '';
}
function bizPatent(v,id,action){
 const s=v.biz,p=s.patents.find(x=>x.id===id);
 if(!p)return 'This design is unavailable.';
 if(action==='file'&&p.status==='discovered'){
  if(!bizPay(v,'Patent filing fees',pr(12000)))return 'Company funds cannot cover the patent application.';
  p.status='patented';bizMaterial(v);bizRevalue(v);
  const c=finFind(finState().companies,v.marketId);
  c.patentNames=s.patents.filter(x=>x.status==='patented').map(x=>x.name);
  bizPress(v,v.n+' secures a patent',p.name+' was granted protection. It can now be licensed or used in new products.');
 }else if(action==='license'&&p.status==='patented'&&p.licenses<4){
  p.licenses++;bizPost(v,'Patent royalties',pr(6500));bizRevalue(v);
  bizPress(v,v.n+' licenses its technology','A new license for '+p.name+' adds recurring royalty income.');
 }else return 'That patent action is unavailable.';
 return '';
}
function bizBid(v,id,method){
 const s=v.biz,c=bizCandidates().find(x=>x.id===id);
 if(!c||s.escrow||!['negotiated','tender','market'].includes(method)||!c.public&&method!=='negotiated')return 'Only one valid offer can be pending at a time.';
 const price=bizAcquirePrice(c,method);
 if(v.ceo&&(s.board<55||s.cash<price*2))return 'The board declined to authorize an offer of this size.';
 if(!bizPay(v,'Acquisition escrow',price))return 'Company funds cannot cover the bid.';
 const same=bizIndustry(v).sector===c.sector;
 const gate=bizRound((same?23:7)+s.subs.filter(x=>x.sector===c.sector&&x.mode!=='assets').length*17+
   (method==='negotiated'?0:19)+bizCountryTax(v)/3,5,90);
 const approved=ch(method==='negotiated'?cl(64+v.rep/3,65,95):method==='tender'?74:85);
 s.escrow={id,method,price,due:g.age+1,approved,review:approved&&ch(gate)};
 if(s.trades?.[id]>=g.age-1)s.insider={id,age:s.trades[id],reviewed:false};
 bizMaterial(v);
 bizPress(v,'A possible bid for '+c.name+' circulates','Sources are discussing a possible '+method+' transaction involving '+v.n+'. Approval and terms are unconfirmed.',null,true);
 return '';
}
function bizCancelBid(v){
 const deal=v.biz.escrow;
 if(!deal)return;
 bizPost(v,'Acquisition escrow refund',deal.price);
 v.biz.escrow=null;
}
function bizCompleteBid(v){
 const s=v.biz,deal=s.escrow,c=bizCandidates().find(x=>x.id===deal?.id);
 if(!c){bizCancelBid(v);return false;}
 s.subs.push({id:c.id,name:c.name,sector:c.sector,price:deal.price,earnings:c.earnings,mode:'pending',
  patents:c.patents||0,patentNames:c.patentNames||[],staff:4,factories:1,stores:1});
 bizTakeListing(c,v,deal.price);
 s.escrow=null;bizRevalue(v);
 bizPress(v,v.n+' acquires '+c.name,'The transaction closed. The group is reviewing the future of both companies.');
 return true;
}
function bizIntegrate(v,id,mode){
 const s=v.biz,x=s.subs.find(r=>r.id===id&&r.mode==='pending');
 if(!x||!['independent','merge','restructure','assets'].includes(mode))return 'That company already has an operating plan.';
 if(mode==='restructure'&&!bizPay(v,'Subsidiary restructuring',pr(23000)))return 'The restructuring needs more company cash.';
 if(mode==='merge'&&s.products.length>=35)return 'Free a product slot before merging the product lines.';
 x.mode=mode;
 if(mode!=='independent'){
  bizSeedPatents(v,{name:x.name,patents:x.patents,patentNames:x.patentNames});
  const target=finFind(finState().companies,x.id);if(target)target.bizStatus=mode;
 }
 if(mode==='merge'){
  s.factories+=x.factories;s.stores+=x.stores;
  s.roles.entry.count+=x.staff;
  const [type,unit]=bizIndustry(v).types[0];
  bizProduct(v,(x.name+' '+type).slice(0,60),0,pr(unit),0,'sale');
 }else if(mode==='assets'){
  bizPost(v,'Divested assets',Math.round(x.price*.42));
 }else if(mode==='restructure'){
  x.mode='independent';x.staff=2;x.earnings=Math.round(x.earnings*1.14);
 }
 bizRevalue(v);bizMaterial(v);
 bizPress(v,x.name+' announces its future under '+v.n,{
  merge:'Operations, employees, and product lines are being combined.',
  independent:'The subsidiary retains its brand, management, and employees.',
  restructure:'The subsidiary will operate with new leadership and a smaller team.',
  assets:'The parent retained the intellectual property and sold the remaining operations.'
 }[mode]);
 return '';
}
function bizSale(v,price,buyer){
 const s=v.biz,listing=finCompanyQuote(finInitMarket(),v);
 if(v.ceo||!Number.isFinite(price))return false;
 bizCancelBid(v);
 const cut=Math.max(0,bizMoney((price+s.cash-(s.debt?.bal||0))*v.own/100));
 g.cash+=cut;LD('Business sale proceeds',cut);finAdd('gains',cut-s.basis);
 bizCancelBid(v);
 listing.bizStatus=buyer==='government'?'nationalized':null;
 listing.linked=false;
 if(listing.public){
  const closing=finRoundPrice((price+s.cash-(s.debt?.bal||0))/v.sh);
  finClosePosition(finState(),listing.id,closing,'Buyout share payout');
  listing.public=false;listing.price=null;listing.change=0;
 }
 for(const child of s.subs){
  const company=finFind(finState().companies,child.id);
  if(company){company.bizOwner=null;if(['pending','independent'].includes(child.mode))company.bizStatus=null;}
 }
 for(const item of s.events)item.closed=true;
 g.vent=g.vent.filter(x=>x!==v);
 if(g.job?.businessId===v.marketId)g.job=null;
 wsel=null;wsub=null;
 bizRecord(v,'Your ownership payout was '+loc(cut)+'.');
 bizPress(v,v.n+(buyer==='government'?' is nationalized':' is sold'),'The ownership transfer has completed.');
 return true;
}
function bizOffer(v,kind){
 const s=v.biz,candidate=P(bizCandidates())?.name||'a private investment group';
 const buyer=kind==='government'?'The government':candidate;
 const price=Math.round(Math.max(pr(25000),v.val-Math.max(0,s.cash)+(s.debt?.bal||0))*1.2);
 s.offer=bizEvent(v,'offer',{hostile:kind==='hostile',buyer:kind,price,title:kind==='hostile'?'A hostile approach to '+v.n+' is reported':buyer+' offers to buy '+v.n,
  text:buyer+' proposed '+loc(price)+' for the operating business. A majority owner can refuse. Minority holders may face a shareholder vote.'}).id;
}
function bizResearchYear(v){
 const s=v.biz,def=bizIndustry(v);
 if(!s.research||s.cash<0)return;
 s.progress+=Math.min(82,Math.round(s.research/Math.max(1,pr(650))+bizSkill()/4));
 if(s.progress<100||s.patents.length>=24)return;
 s.progress-=100;
 const base=def.patents[s.patents.length%def.patents.length];
 const name=base+(s.patents.length>=def.patents.length?' '+(1+Math.floor(s.patents.length/def.patents.length)):'');
 s.patents.push({id:++s.serial,name,status:'discovered',licenses:0});
 bizEvent(v,'report',{title:'Research breakthrough at '+v.n,text:name+' is ready for review and patent filing.'});
}
function bizYear(v){
 const s=v.biz;
 if(s.lastAge>=g.age)return;
 s.lastAge=g.age;
 if(s.escrow?.due<=g.age){
  if(!s.escrow.approved){
   bizCancelBid(v);bizPress(v,'Acquisition talks end','The proposed acquisition by '+v.n+' did not receive sufficient approval.');
  }else if(s.escrow.review){
   s.escrow.due=g.age+1000;
   bizEvent(v,'antitrust',{title:'Government challenges '+v.n+'’s acquisition',text:'Competition regulators have filed to stop the deal. The purchase funds remain in escrow.'});
  }else bizCompleteBid(v);
 }
 for(const child of s.subs.filter(x=>x.mode==='independent')){
  child.earnings=Math.round(child.earnings*(1+R(-12,15)/100));
  const c=finFind(finState().companies,child.id);
  if(c)c.earnings=child.earnings;
 }
 const adjustments=Object.entries(s.ledger).filter(([label])=>!BUSINESS_CAPITAL_ENTRIES.has(label));
 const oneOffIncome=adjustments.reduce((n,[,x])=>n+Math.max(0,x),0);
 const oneOffExpenses=adjustments.reduce((n,[,x])=>n+Math.max(0,-x),0);
 const report=bizForecast(v,R(85,115)/100);
 bizPost(v,'Product sales',report.revenue);
 bizPost(v,'Patent licensing',report.licensing);
 bizPost(v,'Subsidiary distributions',report.subsidiary);
 for(const [key,value] of Object.entries(report.costs))bizPost(v,key,-value);
 report.income+=oneOffIncome;report.expenses+=oneOffExpenses;
 if(oneOffExpenses)report.costs['Other operating expenses']=oneOffExpenses;
 report.tax=bizMoney(Math.max(0,report.income-report.expenses)*bizCountryTax(v)/100);
 report.profit=report.income-report.expenses-report.tax;
 bizPost(v,'Corporate taxes',-report.tax);
 const principal=s.debt?Math.min(report.principal,Math.max(0,s.cash)):0;
 if(s.debt){
  bizPost(v,'Loan principal',-principal);
  s.debt.bal-=principal;
  s.debt.left=Math.max(1,s.debt.left-(principal===report.principal?1:0));
  if(!s.debt.bal)s.debt=null;
 }
 report.cash=s.cash;report.actualPrincipal=principal;report.transactions=s.ledger;
 s.ledger={};s.reports.unshift(report);s.reports=s.reports.slice(0,20);
 for(const row of report.products)Object.assign(s.products.find(x=>x.id===row.id),row);
 v.rev=report.income;
 const average=s.roles.entry.pay/Math.max(1,pr(BUSINESS_ROLES.entry[1]));
 s.morale=bizRound(s.morale+(average-1)*8+(s.benefits-6)/3+(s.conditions==='strong'?5:s.conditions==='poor'?-9:0),0,100);
 const giving=(finPriorLedger?.['Charitable donations']||0)<0?1:0;
 if(bizActive()===v){
  const compliance=(g.evade||g.shell)?-4:g.fin?.inc>0?1:0;
  s.conduct=bizRound(s.conduct+giving*3+compliance-(g.heat>35?3:0),0,100);
 }
 v.rep=bizRound(v.rep+(s.conduct>=72?1:s.conduct<40?-2:0)+(s.sourcing==='home'?2:-2)+(s.conditions==='strong'?2:s.conditions==='poor'?-6:0)+(s.taxPlan==='complex'?-3:1)+(report.profit>0?2:-2),0,100);
 if(s.morale<30&&s.roles.entry.count){s.roles.entry.count--;bizRecord(v,'A staff member resigned over working conditions.');}
 for(const intern of s.interns.filter(x=>x.status==='active')){
  intern.rating=bizRound(R(30,75)+s.morale*.24+(intern.paid?7:0),0,100);
  intern.status='review';
  bizEvent(v,'intern',{target:intern.id,title:intern.name+' completes an internship',text:'Performance '+intern.rating+'/100. Decide whether to offer an entry-level position.'});
 }
 bizResearchYear(v);bizRevalue(v,report.profit);
 const deficit=s.cash<0;
 if(deficit&&!s.events.some(e=>e.kind==='deficit'&&!e.closed))bizEvent(v,'deficit',{title:v.n+' faces a cash shortfall',text:'Last year’s obligations exceeded company funds. Review emergency financing and operating cuts.'});
 if(v.ceo){
  s.board=bizRound(s.board+(report.profit>0?9:-14)+(s.ethics-55)/10,0,100);
  if(s.board<32&&!s.events.some(e=>e.kind==='board'&&!e.closed))bizEvent(v,'board',{title:'The board calls a confidence vote',text:'Directors want a corrective plan. Resigning ends the appointment without an ownership payout.'});
 }
 if(s.investigation!=null&&s.investigation<=g.age&&!s.events.some(e=>e.kind==='insider'&&!e.closed)){
  const espionage=s.investigationKind==='espionage';
  bizEvent(v,'insider',{offense:espionage?'espionage':'insider',title:espionage?'Corporate espionage review reaches a decision':'Trading review reaches an enforcement decision',text:espionage?'The regulator wants records related to a disputed company design.':'The regulator wants to interview you about a trade before a material announcement.'});
 }
 if(!v.ceo&&!s.offer){
  const publicRisk=v.pub&&bizVoting(v)<51;
  const nationalization=['energy','finance'].includes(s.industry)&&g.w[s.hq]?.n.E<48&&ch(10);
  if(nationalization||s.sale||ch(15))bizOffer(v,nationalization?'government':publicRisk&&ch(48)?'hostile':'negotiated');
 }
 if(g.job&&bizActive()===v&&(v.rep>=74&&v.rev>=pr(1200000)||v.rev>=pr(5000000))){
  g.fm=cl(Math.max(g.fm||0,10)+3,0,100);g.fame=cl(Math.max(g.fame||0,10)+2,0,100);
 }
 if(Math.abs(finFind(finState().companies,v.marketId)?.change||0)>=12||report.profit>=pr(160000))
  bizPress(v,v.n+' reports annual results','Revenue '+loc(report.income)+' and after-tax earnings '+loc(report.profit)+'.');
 const choices=[...BUSINESS_INDUSTRY_EVENTS[s.industry],'labor','shortage',...(v.patents?['leak']:[]),...(s.taxPlan==='complex'?['tax','tax']:[])];
 const eligible=choices.filter(key=>!s.events.some(e=>e.kind===key&&(!e.closed||e.age>=g.age-2)));
 if(eligible.length&&ch(76))bizEvent(v,P(eligible));
}
function bizOptions(v,item){
 if(BUSINESS_EVENTS[item.kind])return BUSINESS_EVENTS[item.kind][2].map(([label,cost])=>[label,pr(cost)]);
 switch(item.kind){
  case 'antitrust':return [['Contest the challenge',pr(35000)],['Offer to divest overlapping operations',pr(12000)],['Withdraw the bid',0]];
  case 'offer':return [['Accept the offer',0],[item.hostile?'Seek a competing bid':'Counter at a higher price',0],['Refuse the offer',0]];
  case 'intern':return [['Offer an entry-level job',pr(1000)],['Give a reference and finish the placement',0],['Let the placement end',0]];
  case 'deficit':return [['Request a rescue loan',0],['Consolidate one facility or lay off staff',0],['Keep operating and review Financials',0]];
  case 'board':return [['Fund a recovery plan',pr(18000)],['Request one more year',0],['Resign as CEO',0]];
  case 'insider':return [['Request a hearing through counsel',pr(16000)],['Submit the records voluntarily',0],['Contest the allegations personally',0]];
  default:return [['Acknowledge the update',0]];
 }
}
function bizEndExecutive(v){
 if(g.job?.t==='CEO'&&g.job.company===v.n)g.job=null;
 g.vent=g.vent.filter(x=>x!==v);
 const c=finFind(finState().companies,v.marketId);
 if(c)c.linked=false;
 wsel=null;wsub=null;
}
function bizDecision(v,item,index){
 if(item.closed||!g.vent.includes(v))return {done:false,text:'That decision is no longer available.'};
 const s=v.biz,option=bizOptions(v,item)[index];
 if(!option)return {done:false,text:'Select an available response.'};
 const [label,cost]=option;
 const fail=text=>({done:false,text});
 const e=BUSINESS_EVENTS[item.kind];
 if(item.kind==='insider'&&justiceCurrent(justiceState()))return fail('Resolve your existing court case before responding to this investigation.');
 if(item.kind==='antitrust'&&!s.escrow)return fail('The bid is no longer under review.');
 if(item.kind==='intern'&&index===0&&s.roles.entry.count>=bizSlots(v,'entry'))return fail('Open an entry-level position first.');
 if(item.kind==='deficit'&&index===0&&(s.debt||!bizFunding().loan))return fail('Your lender requires an available facility. Make operating cuts or invest cash.');
 if(cost&&!bizPay(v,label,cost))return fail('Company funds cannot cover that response.');
 let text=label+'.';
 if(e){
  const [, ,rep,morale,research]=e[2][index];
  v.rep=bizRound(v.rep+rep,0,100);s.morale=bizRound(s.morale+morale,0,100);s.progress+=research;
  if(item.kind==='tax'&&index!==2)s.taxPlan='standard';
  if(item.kind==='contract'&&index<2){bizPost(v,'Tender advance',pr(index===0?42000:18000));s.demandUntil=g.age+2;}
  if(item.kind==='leak'&&index<2){
   const patent=s.patents.find(x=>x.status==='patented'&&x.licenses<4);
   if(patent)patent.licenses++;
  }
  if(item.kind==='privacy')s.ethics=bizRound(s.ethics+(index===2?-12:6),0,100);
 }else if(item.kind==='antitrust'){
  if(index===0&&ch(57)||index===1&&ch(82)){
   if(index===1&&s.stores>1)s.stores--;
   const completed=bizCompleteBid(v);
   text=completed?'The challenge ended and the acquisition closed.':'The target left the market. Escrow was returned.';
  }else{
   bizCancelBid(v);
   bizPress(v,'Proposed deal is withdrawn','The transaction involving '+v.n+' ended after competition review.');
   text='The transaction ended and escrow was returned.';
  }
 }else if(item.kind==='offer'){
  if(index===0||item.hostile&&bizVoting(v)<51&&ch(index===1?27:65)){
   bizSale(v,item.price,item.buyer);text='The acquisition closed and ownership was transferred.';
  }else if(index===1&&!item.hostile&&ch(55)){
   bizSale(v,Math.round(item.price*1.17),item.buyer);text='The buyer accepted your higher price.';
  }else{
   bizPress(v,v.n+' remains independent','The reported approach ended without a transfer of control.');
   s.offer=null;s.sale=false;text='The offer expired. You retained control of your shares.';
  }
 }else if(item.kind==='intern'){
  const intern=s.interns.find(i=>i.id===item.target&&i.status==='review');
  if(!intern)return fail('This internship review has ended.');
  if(index===0)s.roles.entry.count++;
  intern.status=index===0?'hired':'complete';
  if(index===1)s.ethics=bizRound(s.ethics+3,0,100);
 }else if(item.kind==='deficit'){
  if(index===0){
   const t=bizFunding(),amount=Math.min(t.loan,Math.max(pr(50000),-s.cash+pr(25000)));
   s.debt={bal:amount,rate:t.rate+2,left:5,lender:t.lender};bizPost(v,'Emergency loan principal',amount);
  }else if(index===1){
   if(s.stores>1){s.stores--;bizPost(v,'Facility sale',pr(30000));}
   else if(s.factories>1){s.factories--;bizPost(v,'Facility sale',pr(35000));}
   else if(s.roles.entry.count){s.roles.entry.count--;v.rep=bizRound(v.rep-5,0,100);}
   else return fail('Review payroll or fund the cash shortfall in Financials.');
  }
 }else if(item.kind==='board'){
  if(index===2||index===1&&s.board<15)bizEndExecutive(v);
  else s.board=bizRound(s.board+(index===0?24:8),0,100);
 }else if(item.kind==='insider'){
  s.investigation=null;
  if(ch(index===0?38:index===1?55:72)){
   if(item.offense==='espionage'&&s.disputedPatent){
    s.patents=s.patents.filter(p=>p.id!==s.disputedPatent);
    for(const p of s.products)if(p.patent===s.disputedPatent)p.patent=null;
    s.disputedPatent=null;
   }
   justiceBook({key:item.offense,charges:[item.offense],evidence:index===0?46:64,source:'A securities regulator referred a corporate trading investigation'});
   text='The regulator referred the matter to court.';
  }else text='The regulator closed the review without charges.';
 }
 item.closed=true;
 if(g.vent.includes(v)){
  bizRevalue(v);bizRecord(v,text);
  if(e||item.kind==='board')bizPress(v,v.n+' issues its response',text);
 }
 return {done:true,text};
}
function bizEspionage(v,id,legal=false){
 const s=v.biz,c=bizCandidates().find(x=>x.id===id);
 if(!c||!c.patents||s.review===g.age)return 'Choose an eligible patent holder. You can pursue one inquiry each year.';
 const amount=pr(legal?28000:19000);
 if(!bizPay(v,legal?'Technology licensing':'Corporate incident expenses',amount))return 'Company funds cannot cover the proposal.';
 s.review=g.age;
 if(legal||ch(40)){
  const patentName=c.patentNames?.[0]||c.name+' design';
  s.patents.push({id:++s.serial,name:patentName,status:legal?'licensed':'discovered',licenses:0});
  if(legal)bizPress(v,v.n+' signs a technology license','The deal gives the company permission to use a design from '+c.name+'.');
  else{s.investigation=g.age+1;s.investigationKind='espionage';s.disputedPatent=s.patents.at(-1).id;}
  bizRevalue(v);
  return legal?'License signed. You can use the design in a product.':'The company obtained a disputed design. A regulatory review is possible.';
 }
 s.investigation=g.age+1;s.investigationKind='espionage';
 v.rep=bizRound(v.rep-8,0,100);
 bizPress(v,'Competitor reports suspected corporate espionage','The allegation involving '+v.n+' has been referred for independent review.');
 return 'The operation failed. A regulatory review is pending.';
}
