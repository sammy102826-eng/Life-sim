const BUSINESS_PAGES={
 overview:'Business overview',financials:'Financials',outlook:'Financial outlook',products:'Products',research:'Research and patents',
 hiring:'Hire and fire',employees:'Employee management',expansion:'Expansion',manufacturing:'Manufacturing',
 facilities:'Factories and stores',competitors:'Acquire competitors',manage:'Manage business empire',
 governance:'Ownership and public policy',sale:'Sell the business'
};
const bizButton=(label,action,arg='',key='',disabled=false)=>B(label,`bizAction('${action}','${arg}','${key}')`,disabled);
const bizSelect=(id,label,rows)=>studioSelect('biz-'+id,label,rows);
const bizInput=(id,label,value=0)=>`<label for="biz-${id}">${uiEscape(label)}</label><input id="biz-${id}" type="number" class="txt" min="0" step="1" value="${Math.round(value*(ST.cur==='usd'?1:cxo()[1]))}">`;
const bizText=(id,label)=>`<label for="biz-${id}">${uiEscape(label)}</label><input id="biz-${id}" class="txt" maxlength="60">`;
const bizValue=id=>document.getElementById('biz-'+id)?.value;
function bizAmount(id){
 const value=bizValue(id),raw=Number(value);
 return value!==undefined&&value.trim()&&Number.isSafeInteger(raw)&&raw>=0?Math.round(raw/(ST.cur==='usd'?1:cxo()[1])):NaN;
}
const bizRows=rows=>studioStats(rows);
const bizSection=(name,html)=>studioSection(name,html);
let bizPage='overview',bizStartPage='home',bizDialog=null;
function bizGo(page='overview'){
 if(!Object.hasOwn(BUSINESS_PAGES,page))return;
 bizPage=page;tab='Work';wsel='business';wsub=null;draw(1);
}
function bizStartOpen(page='home'){
 bizStartPage=page;wsel='business-entry';wsub='Special';tab='Work';draw(1);
}
function bizMessage(text){
 if(!text)draw(1);
 else toast(text);
}
function bizEntryView(){
 const back=B('Back to Special careers',"wsel=null;wsub='Special';draw(1)");
 const resume=bizAllowed()?g.vent.filter(x=>x.biz&&!x.ceo).map(v=>bizButton('Resume '+uiEscape(v.n),'resume',v.marketId)).join(''):'';
 if(bizStartPage==='home')return back+bizSection('Business',resume+
  (!bizAllowed()?'<p>Business management requires age 18 and a free work and school schedule.</p>':'')+
  B('Acquire',"bizStartOpen('acquire')",!bizAllowed())+B('Start a Business',"bizStartOpen('start')",!bizAllowed()));
 const inner=B('Back to Business','bizStartOpen()');
 if(bizStartPage==='acquire')return inner+bizSection('Businesses available to acquire',bizCandidates().map(c=>`<details class="card"><summary>${uiEscape(c.name)} · ${loc(bizAcquirePrice(c,'majority'))}</summary><p>${c.public?'Public · majority purchase':'Private · full ownership'} · ${BUSINESS_INDUSTRIES[bizSectorIndustry(c.sector)].name}</p><p>Opening reserve ${loc(pr(85000))}. Existing products and patents transfer with control.</p>${bizButton('Acquire '+uiEscape(c.name),'buy',c.id,'',g.cash<bizAcquirePrice(c,'majority')+pr(85000)||!bizAllowed())}</details>`).join(''));
 const t=bizFunding();
 return inner+bizSection('Start a Business',bizText('name','Business name')+
  bizSelect('industry','Industry',Object.entries(BUSINESS_INDUSTRIES).map(([k,x])=>[k,x.name+' · opening capital '+loc(bizCapital(k))]))+
  bizSelect('funding','Funding',[['self','Self funding'],['investors','Investors · '+loc(t.investor)+' for 35%'],['loan','Loan · '+loc(t.loan)+' at '+t.rate.toFixed(1)+'%']])+
  bizInput('opening','Your cash contribution',Math.max(pr(15000),Math.min(g.cash,pr(85000))))+
  '<p>Business studies and relevant work experience improve financing. Outside funding goes directly to the company.</p>'+
  bizButton('Start business','found','','',!bizAllowed()));
}
function bizFinancial(v,forecast=false){
 const s=v.biz,last=s.reports[0],next=bizForecast(v);
 const ledger=r=>bizRows([['Units sold or subscribed',r.products.reduce((n,p)=>n+p.units,0).toLocaleString()],['Revenue',loc(r.income)],['Operating expenses',loc(r.expenses)],['Corporate taxes',loc(r.tax)],['After-tax earnings',loc(r.profit)],['Loan principal',loc(r.actualPrincipal??r.principal)]])+
   `<details><summary>Expense breakdown</summary>${Object.entries(r.costs).map(([k,x])=>`<p>${k} · ${loc(x)}</p>`).join('')}</details>`;
 if(forecast)return bizSection('Next year at current settings',ledger(next)+
   '<p>Actual demand, company events, and the economy can change the result.</p>')+
   bizSection('Last year',last?ledger(last):'<p>Your first report will arrive after Age Up.</p>');
 return bizSection('Company financials',bizRows([['Available company funds',loc(s.cash)],['Debt principal',loc(s.debt?.bal||0)],['Corporate tax',bizCountryTax(v)+'%']])+
   (last?ledger(last):'<p>Your first report will arrive after Age Up.</p>')+
   (v.ceo?'<p>The board owns the company funds. Your annual base salary is '+loc(g.job.pay)+'.</p>':
   bizInput('transfer','Amount in selected currency',pr(1000))+bizButton('Invest personal cash','transfer','invest')+
   bizButton('Withdraw a taxed distribution','transfer','withdraw','',bizVoting(v)<51))+
   (s.debt?bizSection('Business loan',`<p>${uiEscape(finBankName(s.debt.lender))} · ${s.debt.rate.toFixed(1)}% APR · ${s.debt.left} planned payments</p>`+
    bizInput('debt-payment','Extra principal payment',Math.min(s.debt.bal,pr(5000)))+bizButton('Pay principal from company funds','debt')):'')+
   (last?.transactions?`<details><summary>Last year’s cash movements</summary>${Object.entries(last.transactions).map(([k,x])=>`<p>${uiEscape(k)} · ${loc(x)}</p>`).join('')}</details>`:''));
}
function bizProducts(v){
 const s=v.biz,def=bizIndustry(v);
 return bizSection('Create a product',bizText('product-name','Product name')+
   bizSelect('product-type','Product type',def.types.map(([n,p],i)=>[i,n+' · typical price '+loc(pr(p))]))+
   bizInput('price','Unit or annual subscription price',pr(def.types[0][1]))+bizInput('marketing','Annual marketing budget',0)+
   bizSelect('model','Sales model',[['sale','One-time sale'],['subscription','Annual subscription']])+
   bizSelect('patent','Technology',[[0,'Standard'],...s.patents.filter(p=>['patented','licensed'].includes(p.status)).map(p=>[p.id,p.name])])+
   bizButton('Launch product','product'))+
  s.products.map(p=>`<details class="card"><summary>${uiEscape(p.name)} · ${loc(p.price)}</summary><p>${p.model==='sale'?'Units sold':'Active subscribers'} last year · ${p.units}</p>${bizInput('price-'+p.id,'New price',p.price)}${bizInput('ads-'+p.id,'Annual marketing',p.marketing)}${bizButton('Update pricing and marketing','product-edit',String(p.id))}${bizButton('Retire product','confirm','product',String(p.id))}</details>`).join('');
}
function bizResearch(v){
 const s=v.biz;
 return bizSection('Research budget and progress',`<p>${s.progress} / 100 toward the next breakthrough.</p>`+
  bizInput('research','Annual research spending',s.research)+bizButton('Set research budget','research')+
  s.patents.map(p=>`<p><b>${uiEscape(p.name)}</b> · ${p.status} · ${p.licenses} licenses</p>`+
    (p.status==='discovered'?bizButton('File patent · '+loc(pr(12000)),'patent',String(p.id),'file'):
    p.status==='patented'?bizButton('License to another company','patent',String(p.id),'license',p.licenses>=4):'')).join(''))+
  bizSection('Outside technology',bizCandidates().filter(c=>c.patents).map(c=>`<details class="card"><summary>${uiEscape(c.name)} · ${c.patents} patents</summary>${bizButton('Negotiate a license · '+loc(pr(28000)),'technology',c.id,'legal')}${bizButton('Authorize an undercover hire · '+loc(pr(19000)),'confirm','espionage',c.id)}</details>`).join('')||'<p>No competitors are offering patent access yet.</p>');
}
function bizStaff(v,hiring){
 const s=v.biz;
 const header=`<p>Employees ${bizHeadcount(v)} / ${bizRequired(v)} needed for full production. Morale ${s.morale}/100. Benefits are ${s.benefits}% of payroll.</p>`;
 const roles=Object.entries(BUSINESS_ROLES).map(([key,[label]])=>{
  const r=s.roles[key];
  return `<details class="card"><summary>${label} · ${r.count} / ${Math.max(bizSlots(v,key),r.count)} · ${loc(r.pay)}/yr</summary>`+
   (hiring?bizButton('Hire '+label,'hire',key,'',r.count>=bizSlots(v,key))+bizButton('Dismiss '+label,'fire',key,'',!r.count):
    bizInput('pay-'+key,'Annual pay',r.pay)+bizButton('Set pay','pay',key))+'</details>';
 }).join('');
 return bizSection(hiring?'Hire and fire':'Staff, pay and benefits',header+roles+(hiring?'':bizSelect('benefits','Benefits',[['0','No benefits'],['6','Basic · 6%'],['15','Comprehensive · 15%'],['24','Generous · 24%']].map(r=>[...r,Number(r[0])===s.benefits]))+
  bizButton('Set benefits','benefits')+bizButton('Team-building trip · '+loc(pr(6500)),'team','','',s.teamAge===g.age)))+
  (hiring?'':bizSection('College internships',bizSelect('intern','Placement terms',[['paid','Paid internship'],['unpaid','Unpaid internship']])+
    bizButton('Offer internship','intern','','',s.interns.some(i=>i.age===g.age))+
    s.interns.slice(-6).reverse().map(i=>`<p>${uiEscape(i.name)} · ${i.status}${i.rating==null?'':' · '+i.rating+'/100'}</p>`).join('')));
}
function bizExpansion(v){
 const s=v.biz,places=Object.keys(g.w);
 return bizSection('Expansion and headquarters',`<p>Headquarters in ${uiEscape(s.hq)} · Corporate tax ${bizCountryTax(v)}%.</p><p>Operating locations · ${s.locations.map(uiEscape).join(', ')}</p>`+
  bizSelect('expand','New operating location',places.filter(c=>!s.locations.includes(c)).map(c=>[c,c]))+
  bizButton('Expand · '+loc(pr(125000)),'expand')+
  bizSelect('hq','Move headquarters',s.locations.map(c=>[c,c+' · '+(BUSINESS_CORPORATE_RATES[c]??Math.round(cl((g.w[c]?.t.inc||20)+3,10,39)))+'% standard company tax',c===s.hq]))+
  bizButton('Move headquarters · '+loc(pr(45000)),'hq'));
}
function bizOperations(v,facilities){
 const s=v.biz;
 return facilities?bizSection('Factories and stores',`<p>${s.factories} factories · ${s.stores} stores. Capacity is limited by the smaller side of your operation and available staff.</p>`+
  bizButton('Open factory · '+loc(pr(98000)),'facility','factories','open')+bizButton('Open store · '+loc(pr(65000)),'facility','stores','open')+
  bizButton('Sell factory','facility','factories','close',s.factories<=1)+bizButton('Sell store','facility','stores','close',s.stores<=1)):
  bizSection('Manufacturing and working conditions',bizSelect('source','Manufacturing location',[['home','Home country',s.sourcing==='home'],['abroad','Abroad',s.sourcing==='abroad']])+
  bizSelect('conditions','Working conditions',[['strong','Strong protections'],['standard','Standard protections'],['poor','Unsafe conditions']].map(r=>[...r,r[0]===s.conditions]))+
  bizButton('Set manufacturing policy','manufacturing')+'<p>Conditions affect unit cost, worker retention, and public reputation.</p>');
}
function bizCompetitors(v){
 const s=v.biz;
 return bizSection('Acquire competitors',(s.escrow?`<p>Offer pending · ${loc(s.escrow.price)} in escrow. Review decisions in Manage.</p>`:'')+
  bizCandidates().map(c=>`<details class="card"><summary>${uiEscape(c.name)} · ${c.public?'Public':'Private'} · ${c.patents||0} patents</summary>${bizButton('Negotiated offer · '+loc(bizAcquirePrice(c)),'bid',c.id,'negotiated',!!s.escrow)}${c.public?
   bizButton('Public tender offer · '+loc(bizAcquirePrice(c,'tender')),'bid',c.id,'tender',!!s.escrow)+
   bizButton('Hostile market bid · '+loc(bizAcquirePrice(c,'market')),'bid',c.id,'market',!!s.escrow):''}</details>`).join(''));
}
function bizInbox(v){
 const s=v.biz;
 return bizSection('Pending decisions',(s.events.filter(x=>!x.closed).map(e=>bizButton(uiEscape(BUSINESS_EVENTS[e.kind]?.[0]||e.title),'read',String(e.id))).join('')||'<p>No decisions are waiting.</p>'))+
  bizSection('Acquired companies',s.subs.map(x=>`<details class="card"><summary>${uiEscape(x.name)} · ${x.mode}</summary>
   <p>Earnings ${loc(x.earnings)} · ${x.staff} modeled staff · ${x.patents} patents.</p>${x.mode==='pending'?
    [['merge','Merge operations'],['independent','Leave independent'],['restructure','Clean house and replace leadership'],['assets','Keep patents and sell the rest']].map(([arg,label])=>bizButton(label,'integrate',x.id,arg)).join(''):''}</details>`).join('')||'<p>No acquisitions have closed.</p>')+
  bizSection('Recent activity',s.history.slice(0,12).map(h=>`<p>Age ${h.age} · ${uiEscape(h.text)}</p>`).join('')||'<p>No activity recorded yet.</p>');
}
function bizGovernance(v,sale=false){
 const s=v.biz;
 if(sale)return bizSection('Sell the business',(v.ceo?'<p>The board owns the company.</p>':
  `<p>${s.sale?'The business is on the market.':'You can invite offers. Buyers may also approach independently.'}</p>`+
  bizButton(s.sale?'Stop soliciting offers':'Put the business up for sale','sale')+
  (s.offer?bizButton('Review current offer','read',String(s.offer)):'')+bizButton('Wind down operations','confirm','close')));
 return bizSection('Ownership, policy and reputation',`<p>${v.ceo?'Board confidence '+s.board+'/100 · No ownership stake':(v.pub?'Public':'Private')+' company · Your voting stake '+(Math.floor(bizVoting(v)*100)/100)+'%'}. Corporate ethics ${s.ethics}/100 · Personal conduct ${s.conduct}/100.</p>`+
  (!v.ceo?bizButton('Take company public','ipo','','',v.pub)+
   (v.pub?bizButton('Repurchase shares · up to 5%','buyback','','',v.own>=100):''):'')+
  bizSelect('policy','Corporate tax strategy',[['standard','Standard filing',s.taxPlan==='standard'],['complex','Aggressive loopholes',s.taxPlan==='complex']])+bizButton('Apply tax policy','tax')+
  bizButton('Make a company donation · '+loc(pr(10000)),'civic','charity')+bizButton('Lobby for worker training · '+loc(pr(9500)),'civic','public')+
  bizButton('Lobby for favorable exemptions · '+loc(pr(9500)),'civic','self')+
  bizButton('Enable AI automation','automation','','',s.ai===true)+
  (v.ceo?bizButton('Resign as CEO','confirm','resign'):''));
}
function bizWorkView(v){
 const s=v.biz,p=bizPage;
 const back=p==='overview'?B('Back to Work',"wsel=null;wsub=null;draw(1)"):B('Back to business overview','bizGo()');
 let body='';
 if(p==='overview'){
  body=bizRows([['Industry',bizIndustry(v).name],['Structure',v.ceo?'Board-appointed CEO':v.pub?'Public company':'Private company'],['Funds',loc(s.cash)],['Reputation',v.rep+'/100']])+
   B('Financials',"bizGo('financials')")+'<hr>'+Object.entries(BUSINESS_PAGES).filter(([page])=>!['overview','financials'].includes(page)).map(([page,label])=>B(label+(page==='manage'&&s.events.some(e=>!e.closed)?' <small>Decisions waiting</small>':''),`bizGo('${page}')`)).join('');
 }else{
  body={
   financials:()=>bizFinancial(v),outlook:()=>bizFinancial(v,true),products:()=>bizProducts(v),research:()=>bizResearch(v),
   hiring:()=>bizStaff(v,true),employees:()=>bizStaff(v,false),expansion:()=>bizExpansion(v),manufacturing:()=>bizOperations(v,false),
   facilities:()=>bizOperations(v,true),competitors:()=>bizCompetitors(v),manage:()=>bizInbox(v),governance:()=>bizGovernance(v),sale:()=>bizGovernance(v,true)
  }[p]();
 }
 return `<div class="law-shell studio-shell">${back}<div class="card"><h2>${uiEscape(v.n)}</h2>${p==='overview'?'':`<p>${BUSINESS_PAGES[p]}</p>`}</div>${body}</div>`;
}
function bizAction(action,arg,key){
 if(publicityBusy()||g.justice?.pending)return;
 if(action==='found'||action==='buy'){
  const error=action==='buy'?bizBuy(arg):bizFound(bizValue('name')?.trim(),bizValue('industry'),bizValue('funding'),bizAmount('opening'));
  if(error)return toast(error);
  return bizGo();
 }
 if(action==='resume'){
  const v=g.vent.find(v=>v.marketId===arg&&v.biz&&!v.ceo);
  if(v&&bizAllowed()){g.job=bizJob(v);g.ue=false;bizGo();}
  return;
 }
 const v=bizActive(),s=v?.biz;
 if(!v)return;
 if(v.ceo&&s.board<45&&['expand','hq','ipo','buyback','civic','facility','technology','automation'].includes(action))
  return toast('The board is withholding approval for major commitments until confidence reaches 45.');
 const staff=s.roles[arg];
 let message='',material=false;
 switch(action){
  case 'read':
   if(s.events.some(x=>x.id===Number(arg)&&!x.closed)){bizDialog={id:Number(arg),company:v.marketId};draw();}
   return;
  case 'confirm':
   if(['product','close','espionage','resign'].includes(arg)){bizDialog={type:arg,key,company:v.marketId};draw();}
   return;
  case 'transfer':{
   const amount=bizAmount('transfer');
   if(v.ceo||!Number.isSafeInteger(amount)||amount<=0)return toast('Enter a positive amount.');
   if(arg==='withdraw')message=bizWithdraw(v,amount);
   else if(arg==='invest'&&g.cash>=amount){
    g.cash-=amount;LD('Business owner contribution',-amount);bizPost(v,'Owner capital',amount);s.basis+=amount;
   }else message='Personal cash cannot cover this investment.';
   break;
  }
  case 'debt':message=bizExtraPrincipal(v,bizAmount('debt-payment'));break;
  case 'product':{
   const type=Number(bizValue('product-type')),patent=Number(bizValue('patent'))||null;
   if(!bizProduct(v,bizValue('product-name')?.trim(),type,bizAmount('price'),bizAmount('marketing'),bizValue('model'),patent))
    return toast('Enter a unique product name and valid price and budget.');
   const p=s.products.at(-1);
   p.quality=bizRound(45+g.smarts/6+(patent?8:0),0,100);
   bizPress(v,v.n+' launches '+p.name,'The '+bizIndustry(v).name.toLowerCase()+' company opened sales for its new product.');
   material=true;break;
  }
  case 'product-edit':{
   const p=s.products.find(x=>x.id===Number(arg)),price=bizAmount('price-'+arg),marketing=bizAmount('ads-'+arg);
   if(!p||!Number.isSafeInteger(price)||!Number.isSafeInteger(marketing)||price<1||price>pr(1e6)||marketing>pr(1e7))return toast('Enter a valid price and marketing budget.');
   p.price=price;p.marketing=marketing;break;
  }
  case 'research':{
   const amount=bizAmount('research');
   if(!Number.isSafeInteger(amount)||amount>pr(1e7)||amount>s.cash&&amount>0)return toast('Enter an annual budget within the company’s current funds.');
   s.research=amount;break;
  }
  case 'patent':message=bizPatent(v,Number(arg),key);break;
  case 'hire':
   if(!staff||staff.count>=bizSlots(v,arg))return toast('No opening is available.');
   if(!bizPay(v,'Recruiting',pr(550)))return toast('Company funds cannot cover recruiting.');
   staff.count++;break;
  case 'fire':
   if(!staff?.count)return;
   if(!bizPay(v,'Severance',Math.round(staff.pay/12)))return toast('Company funds cannot cover severance.');
   staff.count--;s.morale=bizRound(s.morale-4,0,100);
   if(['manager','operations','finance'].includes(arg)||s.lastLayoff===g.age)bizPress(v,v.n+' cuts jobs','The business confirmed a reduction in staff.');
   s.lastLayoff=g.age;break;
  case 'pay':{
   const amount=bizAmount('pay-'+arg);
   if(!staff||!Number.isSafeInteger(amount)||amount<pr(9000)||amount>pr(1e7))return toast('Enter annual pay between '+loc(pr(9000))+' and '+loc(pr(1e7))+'.');
   staff.pay=amount;break;
  }
  case 'benefits':{
   const level=Number(bizValue('benefits'));
   if(![0,6,15,24].includes(level))return;
   s.benefits=level;break;
  }
  case 'team':
   if(s.teamAge===g.age||!bizPay(v,'Team-building',pr(6500)))return toast('The trip cannot be booked.');
   s.teamAge=g.age;s.morale=bizRound(s.morale+9,0,100);break;
  case 'intern':
   if(s.interns.some(x=>x.age===g.age)||!['paid','unpaid'].includes(bizValue('intern')))return;
   s.interns.push({id:++s.serial,age:g.age,name:nm2(),paid:bizValue('intern')==='paid',status:'active',rating:null});
   break;
  case 'expand':{
   const country=bizValue('expand');
   if(!Object.hasOwn(g.w,country)||s.locations.includes(country)||!bizPay(v,'Expansion',pr(125000)))return toast('Choose an available market the company can afford.');
   s.locations.push(country);
   bizPress(v,v.n+' opens a new operation','The company expanded into '+country+'.');
   v.rep=bizRound(v.rep+3,0,100);material=true;break;
  }
  case 'hq':{
   const country=bizValue('hq');
   if(!s.locations.includes(country)||country===s.hq||!bizPay(v,'Headquarters relocation',pr(45000)))return toast('Choose a different operating location the company can afford.');
   s.hq=country;v.rep=bizRound(v.rep+(country===g.country?4:-3),0,100);
   bizPress(v,v.n+' relocates headquarters','The company now files corporate taxes in '+country+'.');
   material=true;break;
  }
  case 'manufacturing':{
   const source=bizValue('source'),conditions=bizValue('conditions');
   if(!['home','abroad'].includes(source)||!['strong','standard','poor'].includes(conditions)||source===s.sourcing&&conditions===s.conditions)return;
   s.sourcing=source;s.conditions=conditions;
   s.ethics=bizRound(s.ethics+(conditions==='strong'?10:conditions==='poor'?-14:0)+(source==='home'?2:-4),0,100);
   v.rep=bizRound(v.rep+(conditions==='poor'?-8:source==='abroad'?-3:3),0,100);
   bizPress(v,v.n+' changes manufacturing policy','Operations will use '+(source==='home'?'domestic':'overseas')+' production with '+conditions+' labor protections.');material=true;break;
  }
  case 'facility':{
   if(!['factories','stores'].includes(arg))return;
   const factory=arg==='factories',label=factory?'factory':'store';
   if(key==='open'){
    if(s[arg]>=30||!bizPay(v,'Facility purchase',pr(factory?98000:65000)))return toast('The company cannot open this facility.');
    s[arg]++;
   }else if(key==='close'&&s[arg]>1){s[arg]--;bizPost(v,'Facility sale',pr(factory?35000:30000));}
   else return;
   bizPress(v,v.n+(key==='open'?' opens a ':' sells a ')+label,'The change affects capacity and operating expenses.');
   material=true;break;
  }
  case 'bid':message=bizBid(v,arg,key);break;
  case 'integrate':message=bizIntegrate(v,arg,key);break;
  case 'technology':
   message=bizEspionage(v,arg,true);
   if(message.startsWith('License signed')){bizRecord(v,message);message='';}
   break;
  case 'ipo':message=bizIPO(v);break;
  case 'buyback':{
   if(v.ceo||!v.pub||v.own>=100)return;
   const stake=Math.min(5,100-v.own);
   if(!bizPay(v,'Share repurchase',Math.round(v.val*stake/100)))return toast('Company funds cannot cover the repurchase.');
   v.own+=stake;
   bizPress(v,v.n+' repurchases outside shares','The controlling shareholder’s voting percentage increased.');material=true;break;
  }
  case 'tax':{
   const plan=bizValue('policy');
   if(!['standard','complex'].includes(plan)||s.taxPlan===plan)return;
   s.taxPlan=plan;s.ethics=bizRound(s.ethics+(plan==='complex'?-10:6),0,100);
   if(plan==='complex')bizPress(v,v.n+' faces questions about its tax strategy','Journalists report that the company adopted an aggressive tax structure.');
   break;
  }
  case 'civic':{
   if(!['charity','public','self'].includes(arg))return;
   if(s.responses[g.age+':'+arg])return toast('You already made this commitment this year.');
   if(!bizPay(v,arg==='charity'?'Corporate donations':'Lobbying',pr(arg==='charity'?10000:9500)))return toast('Company funds cannot cover this commitment.');
   s.responses[g.age+':'+arg]=true;
   s.ethics=bizRound(s.ethics+(arg==='self'?-8:5),0,100);
   v.rep=bizRound(v.rep+(arg==='self'?-5:4),0,100);g.pop=bizRound(g.pop+(arg==='self'?-2:2),0,100);
   bizPress(v,v.n+(arg==='charity'?' announces a donation':' takes a position on public policy'),
     {charity:'The company pledged support for a local charity.',public:'The company supports more funding for worker training.',self:'The company lobbied for exemptions that would reduce its compliance costs.'}[arg]);break;
  }
  case 'automation':
   if(s.ai||!bizPay(v,'Automation project',pr(12000)))return toast('Automation is unavailable.');
   s.ai=true;s.ethics=bizRound(s.ethics-6,0,100);v.rep=bizRound(v.rep-5,0,100);
   bizEvent(v,'automation');material=true;break;
  case 'sale':
   if(v.ceo)return;
   s.sale=!s.sale;
   if(s.sale&&!s.offer&&ch(55))bizOffer(v,'negotiated');
   if(s.sale)bizPress(v,'Buyers may approach '+v.n,'People familiar with the business say a sale could be considered.',null,true);
   break;
  default:return;
 }
 if(!message){if(material)bizMaterial(v);bizRevalue(v);}
 bizMessage(message);
}
function bizDialogClose(){bizDialog=null;draw();}
function bizDialogAnswer(index){
 const v=bizActive(),p=bizDialog;
 if(!p||p.company!==v?.marketId||publicityBusy())return;
 if(p.id){
  const e=v.biz.events.find(x=>x.id===p.id);
  if(!e)return bizDialogClose();
  const result=bizDecision(v,e,index);
  if(!result.done)return toast(result.text);
  bizDialog=null;
  if(!g.justice?.pending)g.result={t:'Business decision',d:uiEscape(result.text)};
  return draw();
 }
 if(index!==0)return bizDialogClose();
 bizDialog=null;
 if(p.type==='close'&&!v.ceo)bizSale(v,Math.round(Math.max(0,v.val-v.biz.cash+(v.biz.debt?.bal||0))*.55),'liquidation');
 if(p.type==='resign'&&v.ceo)bizEndExecutive(v);
 if(p.type==='espionage'){
  const result=bizEspionage(v,p.key);
  g.result={t:'Corporate espionage',d:uiEscape(result)};
 }
 if(p.type==='product'){
  const product=v.biz.products.find(x=>x.id===Number(p.key));
  if(product){
   v.biz.products=v.biz.products.filter(x=>x!==product);
   bizPress(v,v.n+' retires a product',product.name+' is no longer sold. Existing subscriptions closed.');
   bizMaterial(v);bizRevalue(v);
  }
 }
 draw(1);
}
function bizModal(v){
 const p=bizDialog;
 if(p){
  const e=v.biz.events.find(x=>x.id===p.id);
  if(e&&!e.closed)return lawModal(BUSINESS_EVENTS[e.kind]?.[0]||e.title,'<p>'+uiEscape(BUSINESS_EVENTS[e.kind]?.[1]||e.text)+'</p>',
    bizOptions(v,e).map(([label,cost],i)=>B(label+(cost?' · '+loc(cost):''),`bizDialogAnswer(${i})`)).join('')+(e.article?B('Open this Newspaper story',`bizOpenStory('${e.article}')`):'')+B('Decide later','bizDialogClose()'));
  const title={close:'Wind down the business?',espionage:'Proceed with corporate espionage?',product:'Retire this product?',resign:'Resign as CEO?'}[p.type];
  const desc={close:'The company will liquidate its operations, settle obligations, and pay your share of the remainder.',espionage:'An undercover hire will target a competitor’s confidential technology. The attempt can lead to lost funds, reputational damage, and prosecution.',product:'The company will stop selling it and lose its associated subscribers.',resign:'The board will appoint another executive. Your salary and control will end.'}[p.type];
  if(title)return lawModal(title,'<p>'+desc+'</p>',B('Confirm','bizDialogAnswer(0)')+B('Cancel','bizDialogClose()'));
 }
 const item=v.biz.events.find(e=>!e.closed&&!e.seen&&e.age===g.age);
 if(!item)return '';
 return lawModal('Business update · '+v.n,'<p>'+uiEscape(BUSINESS_EVENTS[item.kind]?.[0]||item.title)+'</p>'+
  '<p>'+uiEscape(BUSINESS_EVENTS[item.kind]?.[1]||item.text)+'</p>',
  B('Review decision',`bizAcknowledge(${item.id},true)`)+B('Decide later in Manage',`bizAcknowledge(${item.id},false)`));
}
function bizAcknowledge(id,review){
 const v=bizActive(),item=v?.biz.events.find(e=>e.id===id&&!e.closed);
 if(!item)return;
 item.seen=true;
 if(review){bizDialog={id,company:v.marketId};bizGo('manage');}
 else draw();
}

function bizOpenStory(id){bizDialog=null;newsOpenBrief(id);}
