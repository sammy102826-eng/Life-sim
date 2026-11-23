const FINANCE_PAGES={overview:'Overview',market:'Investments',companies:'Companies',lottery:'Lottery',banking:'Banking',credit:'Credit cards',loans:'Loans',insurance:'Insurance',giving:'Giving',retirement:'Retirement',taxes:'Taxes'};
const FINANCE_MARKETS={stock:'Stocks',bond:'Bonds',fund:'Mutual funds',crypto:'Crypto',penny:'Penny stocks'};
let finPage='overview',finMarketKind='stock',finSelected=null,finListOwner=null;
const finListScroll={};
const finSection=(title,body)=>`<section class="law-section"><h3>${uiEscape(title)}</h3>${body}</section>`;
const finLabel=(title,value)=>`<div class="row"><span>${uiEscape(title)}</span><b>${value}</b></div>`;
const finButton=(label,action,id='')=>B(label,`finAction('${action}','${id}')`);
const finCurrency=()=>ST.cur==='usd'?1:cxo()[1];
const finDisplay=n=>Math.round(n*finCurrency());
const finInput=(id,label,amount=0)=>`<label for="${id}">${uiEscape(label)}</label><input id="${id}" class="txt" type="number" min="1" step="1" inputmode="numeric" ${amount?`value="${finDisplay(amount)}"`:''}>`;
const finRead=id=>Number(document.getElementById(id)?.value);
const finRaw=id=>document.getElementById(id)?.value;
const finAmount=id=>{const n=finRead(id);return finSafe(n)?Math.round(n/finCurrency()):NaN;};
const finSelect=(id,label,items)=>`<label for="${id}">${uiEscape(label)}</label><select id="${id}">${items.map(([key,text,selected])=>`<option value="${uiEscape(key)}"${selected?' selected':''}>${uiEscape(text)}</option>`).join('')}</select>`;
function finOpen(page='overview',selected=null){
 if(g.jail||!Object.hasOwn(FINANCE_PAGES,page))return;
 const s=finState();s.enabled=true;
 if(['market','companies'].includes(page))finSyncCompanies(s.companies.length?s:finInitMarket(s));
 if(finListOwner!==g){
  finListOwner=g;
  for(const key of Object.keys(finListScroll))delete finListScroll[key];
 }
 const panel=document.querySelector('.info'),same=tab==='Other'&&NV.O[0]==='Finance'&&finPage===page;
 const key=page==='market'?finMarketKind:page;
 const returnToList=same&&!selected&&!!finSelected;
 if(same&&selected&&!finSelected)finListScroll[key]=panel?.scrollTop||0;
 finPage=page;finSelected=selected;tab='Other';NV.O=['Finance'];draw(!same&&!selected);
 if(selected||returnToList)requestAnimationFrame(()=>{
  const current=document.querySelector('.info');
  if(!current||finPage!==page||finSelected!==selected)return;
  if(returnToList){current.scrollTop=finListScroll[key]||0;return;}
  const detail=current.querySelector('.law-shell > .law-section');
  if(!detail)return;
  current.scrollTop+=detail.getBoundingClientRect().top-current.getBoundingClientRect().top-
   Math.max(50,(current.clientHeight-detail.offsetHeight)/2);
 });
}
function finMarketOpen(kind){
 if(!Object.hasOwn(FINANCE_MARKETS,kind))return;
 if(finMarketKind!==kind){finSelected=null;finMarketKind=kind;finOpen('market');requestAnimationFrame(()=>document.querySelector('.info')?.scrollTo(0,0));return;}
 finOpen('market');
}
function finMessage(text){if(text)toast(text);}
function finOpenTax(age){
 const s=finState();
 if(g.jail||!s.returns.some(x=>x.age===age))return;
 g.ysum=null;
 s.modal={kind:'tax',age};draw();
}
function finCloseModal(){
 if(g.financial)g.financial.modal=null;
 draw();
}
function finFileButton(){
 const s=finState(),p=s.modal,report=s.returns.find(x=>x.age===p?.age);
 if(p?.kind!=='tax'||!report||g.jail)return;
 const ids=[...document.querySelectorAll('[name=fin-deduction]:checked')].map(x=>x.value);
 const text=finFile(s,report,ids);
 if(text){s.notices.unshift({title:'Tax return filed',text});s.modal={kind:'notice'};draw();}
}
function finUpdateTaxPreview(){
 const s=finState(),report=s.returns.find(x=>x.age===s.modal?.age),target=document.getElementById('fin-tax-preview');
 if(!report||!target)return;
 const selected=[...document.querySelectorAll('[name=fin-deduction]:checked')].map(x=>x.value);
 const estimate=finTaxPreview(report,selected);
 target.textContent=(estimate.difference>0?'Additional tax due ':estimate.difference<0?'Expected refund ':'Balance due ')+loc(Math.abs(estimate.difference));
}
function finAction(action,id){
 if(g.jail)return;
 const s=finState();
 let text='';
 if(['buy','sell'].includes(action))text=finTrade(id,finRead('fin-quantity'),action==='sell');
 if(action==='lottery')text=finLotteryBuy(id,finRead('fin-ticket-'+id));
 if(action==='transfer')text=finTransfer(finRaw('fin-transfer'),finAmount('fin-bank-amount'));
 if(action==='retirement')text=finRetirement(finRaw('fin-retire-action'),finRaw('fin-retire-type'),finAmount('fin-retire-amount'));
 if(action==='mode'&&['full','minimum'].includes(id)){s.credit.mode=id;text='Autopay updated.';}
 if(action==='cardpay')text=finManualCredit(finAmount('fin-card-amount'));
 if(action==='loan')text=finNewLoan(finAmount('fin-loan-amount'),finRaw('fin-loan-kind'),finRead('fin-loan-term'));
 if(action==='pay'){
  const amount=finAmount('fin-debt-'+id),index=Number(id);
  if(!finSafe(amount)||amount<1)return finMessage('Enter a positive repayment amount.');
  if(id==='student')return eduExtraLoan(amount);
  if(id==='firm'||id==='clinic')text=finBusinessPay(id,amount);
  else if(id.startsWith('company-')){
   const v=g.vent.find(v=>v.marketId===id.slice(8)&&v.biz?.debt);
   if(v)text=bizExtraPrincipal(v,amount);
  }else if(g.loans[index])return payLoan(index,amount);
 }
 if(action==='collections'){
  text=finCollections(id);
  if(text){s.modal=null;g.result={t:'Collection agreement',d:uiEscape(text)};return draw();}
 }
 if(action==='event'){
  text=finEventResolve(id);
  if(text){s.modal=null;g.result={t:'Financial decision',d:uiEscape(text)};return draw();}
 }
 finMessage(text);
}
function finDismissNotice(){
 const s=finState();s.notices.shift();s.modal=null;draw();
}
function finReviewEvent(){
 const s=finState();
 if(s.event){s.modal={kind:'event'};draw();}
}
function finDeferEvent(){
 const s=finState();
 if(s.event)s.event.deferred=true;
 s.modal=null;draw();
}
function finCenter(page=finPage){
 const s=finState(),views={overview:finOverview,market:finMarketView,companies:finCompanyView,lottery:finLotteryView,banking:finBankView,
  credit:finCreditView,loans:finLoanView,insurance:()=>moneyV('Insurance'),giving:()=>moneyV('Giving'),retirement:finRetirementView,taxes:finTaxView};
 return `<div class="law-shell finance-shell"><h2>Financial center</h2>${B('Back to Other',"NV.O=[];draw(1)")}
  <nav class="law-nav" aria-label="Financial sections">${Object.entries(FINANCE_PAGES).map(([key,title])=>`<button type="button" aria-pressed="${key===page}" onclick="finOpen('${key}')">${title}</button>`).join('')}</nav>
  <h2>${FINANCE_PAGES[page]}</h2>${views[page](s)}</div>`;
}
function finOverview(s){
 const latest=s.returns.at(-1);
 return '<div class="law-metrics">'+lawMetric('Personal cash',loc(g.cash))+lawMetric('Checking and savings',loc(g.bank.chk+g.bank.sav+s.high))+
  lawMetric('Net worth',loc(nw()))+lawMetric('Credit score',g.cred)+'</div>'+B('Financial dashboard',"NV.O=['Dashboard'];draw(1)")+
  (latest&&!latest.filing?finSection('Tax return ready',B('Review and file',`finOpenTax(${latest.age})`)):'')+
  (s.event?finSection('Financial decision',B('Review financial event','finReviewEvent()')):'')+

  (s.notices.length?finSection('Notices',s.notices.map(n=>`<p><strong>${uiEscape(n.title)}</strong> · ${uiEscape(n.text)}</p>`).join('')+
    B('Review next notice',"g.financial.modal={kind:'notice'};draw()")):'')+finSection('Economy',moneyV('Overview'));
}
function finMarketView(s){
 finInitMarket(s);
 const tabs=`<nav class="law-nav" aria-label="Investment categories">${Object.entries(FINANCE_MARKETS).map(([id,label])=>`<button aria-pressed="${id===finMarketKind}" onclick="finMarketOpen('${id}')">${label}</button>`).join('')}</nav>`;
 const companyRows=s.companies.filter(c=>c.public&&(finMarketKind==='penny'?c.penny:!c.penny));
 const rows=['penny','stock'].includes(finMarketKind)?companyRows:s.instruments.filter(i=>i.kind===finMarketKind);
 const row=finInstrument(s,finSelected);
 if(row&&row.price&&rows.some(x=>x.id===row.id)){
  const p=s.positions[row.id],value=finPositionValue(s,row.id);
  const mix=row.kind==='fund'?FINANCE_FUND_DEFS[row.id][1].map((id,i)=>
    uiEscape(finFind(s.companies,id)?.name)+' '+Math.round(FINANCE_FUND_DEFS[row.id][2][i]*100)+'%').join(', '):'';
  const details=row.kind==='bond'?`<p>Issuer ${uiEscape(row.issuer?finFind(s.companies,row.issuer)?.name:g.country)} · Coupon ${row.coupon}% · Matures at age ${row.matures}.</p>`:
   mix?`<p>Fund mix · ${mix}.</p>`:row.vol?`<p>Volatility ${row.vol}/100.</p>`:'';
  return tabs+B('Back to investment list',`finMarketOpen('${finMarketKind}')`)+finSection(row.name,
   `<p>${uiEscape(row.id)} · ${finQuote(row.price)} per unit · Annual move ${row.change||0}%</p>${details}`+
   finLabel('Units owned',p?.units?.toLocaleString()||'0')+finLabel('Position value',loc(value))+finLabel('Cost basis',loc(p?.basis||0))+
   finInput('fin-quantity','Number of units',0)+finButton('Buy units','buy',row.id)+finButton('Sell units','sell',row.id));
 }
 return tabs+finSection(FINANCE_MARKETS[finMarketKind],rows.map(r=>`<article class="law-item"><div><h4>${uiEscape(r.name)}</h4>
 <p>${uiEscape(r.id)} · ${finQuote(r.price)} per unit · Annual move ${r.change||0}% · ${s.positions[r.id]?.units||0} held</p></div>
 ${B('View investment',`finOpen('market','${r.id}')`)}</article>`).join('')||'<p>No listings in this category.</p>')+
 (Object.values(g.inv).some(x=>x>0)?finSection('Legacy holdings',STK.filter(([key])=>g.inv[key]>0).map(([key,label])=>
  finLabel(label,loc(g.inv[key]))+B('Sell legacy '+label.toLowerCase(),`takeOut('${key}')`)).join('')):'');
}
function finCompanyStatus(c){
 if(c.public)return 'Public · '+finQuote(c.price);
 return {subsidiary:'Privately held subsidiary',restructure:'Restructured subsidiary',merge:'Merged',merged:'Merged',
  assets:'Operations divested',nationalized:'State-owned'}[c.bizStatus]||'Private or member-owned';
}
function finCompanyView(s){
 finInitMarket(s);
 const chosen=finFind(s.companies,finSelected);
 if(chosen)return B('Back to company directory',"finOpen('companies')")+finSection(chosen.name,
  `<p>${uiEscape(chosen.sector)} · ${finCompanyStatus(chosen)}.</p>`+finLabel('Revenue',loc(chosen.revenue))+finLabel('Earnings',loc(chosen.earnings))+
  finLabel('Patents recorded',chosen.patents||0)+(chosen.public?B('View listed shares',`finMarketKind='${chosen.penny?'penny':'stock'}';finOpen('market','${chosen.id}')`):''));
 return finSection('Corporate directory',s.companies.map(c=>`<article class="law-item"><div><h4>${uiEscape(c.name)}</h4>
  <p>${uiEscape(c.sector)} · ${finCompanyStatus(c)} · Earnings ${loc(c.earnings)}</p></div>
  ${B('View company',`finOpen('companies','${c.id}')`)}</article>`).join(''));
}
function finLotteryView(s){
 return Object.entries(FINANCE_LOTTERIES).map(([id,d])=>{
  const n=s.tickets[id]||0,chance=n?((1-(1-1/d.odds)**n)*100).toFixed(3):'0';
  return finSection(d.name,`<p>Jackpot ${loc(s.pots[id]??pr(d.base))} · Ticket price ${loc(pr(d.cost))}. Jackpot odds for one ticket are 1 in ${d.odds.toLocaleString()}.</p>
  <p>${n} tickets purchased this year. Current jackpot chance ${chance}%. Up to ${d.ticketLimit} tickets per draw. Results arrive at Age Up.</p>
  <label for="fin-ticket-${id}">Ticket quantity</label><input id="fin-ticket-${id}" class="txt" type="number" min="1" max="${Math.max(1,d.ticketLimit-n)}" value="1">`+
  B('Buy tickets',`finAction('lottery','${id}')`,g.age<18||n>=d.ticketLimit));
 }).join('');
}
function finBankView(s){
 const youth=g.age<18,open=g.bank.id!=null,bank=FINANCE_BANKS[g.bank.id];
 const types=youth?[['in-youth','Deposit to youth savings'],['out-youth','Withdraw youth savings']]:
   [['in-checking','Deposit to checking'],['out-checking','Withdraw from checking'],['in-saving','Deposit to savings'],['out-saving','Withdraw from savings'],
    ...(bank?.high||s.high?[['in-high','Deposit to high-yield savings'],['out-high','Withdraw from high-yield savings']]:[])];
 return (youth?finSection('Youth savings',finLabel('Balance',loc(s.youth))+'<p>6.2% annual yield. The account is available at age six and moves into adult savings at 18.</p>'):
  finSection('Bank accounts',`<p>${bank?uiEscape(finBankName(bank.id)):'Choose a bank to open checking and savings.'}</p>`+
    finLabel('Checking',loc(g.bank.chk))+finLabel('Savings',loc(g.bank.sav))+finLabel('High-yield savings',loc(s.high))+
    FINANCE_BANKS.map((b,i)=>B(finBankName(b.id)+` <small>${b.apy.toFixed(2)}% standard savings${b.high?' · '+b.high.toFixed(2)+'% high yield':''}</small>`,
      `openBank(${i})`,i===g.bank.id)).join('')))+
   (youth||open?finSection('Transfer funds',finSelect('fin-transfer','Transfer direction',types)+finInput('fin-bank-amount','Amount in selected currency',1000)+finButton('Submit transfer','transfer')):'');
}
function finCreditView(s){
 const c=g.cc,r=s.credit.report;
 return finSection('Credit eligibility',`<p>Score ${g.cred}/850. An approved card can cover an annual shortfall up to its remaining limit.</p>`+
  CARDS.map(([name,limit,apr,,min],i)=>B(name+` <small>${finBankName(finIssuer(i))} · Limit ${loc(pr(limit))} · APR ${apr}% · Credit ${min||'starter'} · ${FINANCE_BANKS[i].reward}% cashback</small>`,`applyCC(${i})`,!!c||g.age<18||g.cred<min||s.credit.lockUntil===g.age)).join(''))+
 (c?finSection(CARDS[c.i][0],
   finLabel('Balance',loc(c.bal))+finLabel('Credit remaining',loc(Math.max(0,pr(CARDS[c.i][1])-c.bal)))+finLabel('Minimum payment still overdue',loc(s.credit.missed||0))+
   B('Autopay full balance',"finAction('mode','full')",s.credit.mode==='full')+
   B('Autopay minimum',"finAction('mode','minimum')",s.credit.mode==='minimum')+
   '<p>Autopay uses available bank balances and cash. Interest is charged when any balance is carried, and an unpaid minimum damages credit.</p>'+
   finInput('fin-card-amount','Custom repayment',Math.min(c.bal,1000))+finButton('Pay amount','cardpay')+
   (r?finLabel('Last annual payment',loc(r.paid))+finLabel('Interest assessed',loc(r.interest))+finLabel('Cashback deposited',loc(r.reward)):'')+
   (!c.bal?B('Close paid card','finCloseCard()'):'') ):'');
}
function finCloseCard(){
 if(!g.jail&&g.cc&&g.cc.bal===0){g.cc=null;finState().credit.missed=0;finMessage('The card was closed.');}
}
function finLoanView(s){
 const a=finLoanTerms(),b=finLoanTerms('business');
 const payment=(id,max)=>finInput('fin-debt-'+id,'Extra payment amount',Math.min(5000,max))+finButton('Pay principal','pay',String(id));
 const loans=g.loans.map((l,i)=>finSection(l.n||'Loan',finLabel('Issuer',uiEscape(finBankName(l.lender||finIssuer(g.bank.id??0))))+
  finLabel('Remaining principal',loc(l.bal))+`<p>APR ${l.rate}% · ${l.yearsLeft?`${l.yearsLeft} scheduled annual payments remain`:'Annual payments are automatic'}.</p>`+payment(i,l.bal))).join('');
 const business=[['firm',g.lawFirm,'Law firm loan'],['clinic',g.practice,'Medical practice loan']]
  .filter(([,o])=>o?.debt>0&&o.status==='active').map(([id,o,label])=>finSection(label,
   finLabel('Issuer',uiEscape(finBankName(o.lender||'NVB')))+finLabel('Principal',loc(o.debt))+
   '<p>Automatic installments and extra payments use business funds.</p>'+payment(id,o.debt))).join('');
 const companyLoans=g.vent.filter(v=>v.biz?.debt&&!v.ceo).map(v=>{
  const d=v.biz.debt;
  return finSection(v.n+' business loan',finLabel('Issuer',uiEscape(finBankName(d.lender)))+finLabel('Principal',loc(d.bal))+
   '<p>Company funds pay the annual installment and extra principal.</p>'+payment('company-'+v.marketId,d.bal));
 }).join('');
 return (s.collection?finSection('Collections',B('Review collection options',"g.financial.modal={kind:'collection'};draw()")):'')+
 (s.arrears?finSection('Tax arrears',finLabel('Outstanding balance',loc(s.arrears))+'<p>Unpaid tax is collected from future paychecks.</p>'):'')+
 (g.cc?.bal?finSection('Credit card debt',finLabel('Outstanding balance',loc(g.cc.bal))+B('Manage card payments',"finOpen('credit')")):'')+
 finSection('Borrowing offers',finLabel('Credit score',g.cred)+
  finLabel('Personal borrowing limit',a.eligible?loc(a.limit)+' · '+a.rate+'% APR':'Unavailable')+
  finLabel('Business borrowing limit',b.eligible?loc(b.limit)+' · '+b.rate+'% APR':'Unavailable')+
  finSelect('fin-loan-kind','Purpose',[['personal','Personal'],['business','Business']])+finSelect('fin-loan-term','Annual term',[[3,'3 years'],[5,'5 years'],[8,'8 years'],[10,'10 years']])+
  finInput('fin-loan-amount','Principal to request',1000)+finButton('Apply for loan','loan'))+loans+
  (g.sloan>0?finSection('Student loan',finLabel('Issuer',uiEscape(finBankName('FFB')))+finLabel('Remaining principal',loc(g.sloan))+
   eduDebtView()+payment('student',g.sloan)):'')+business+companyLoans+
  (!loans&&!business&&!companyLoans&&!g.sloan?'<p>No outstanding loans.</p>':'');
}
function finRetirementView(s){
 const r=s.retirement,limit=pr(finTaxProfile().retirement+(g.age>=50?1000:0));
 return finSection('Individual retirement accounts',
  finLabel('Traditional IRA',loc(r.traditional))+finLabel('Roth IRA',loc(r.roth))+
  finLabel('Annual contribution limit remaining',loc(Math.max(0,limit-(s.activity.tradContrib||0)-(s.activity.rothContrib||0))))+
  '<p>Traditional contributions can qualify for a deduction. Roth contributions use after-tax cash. Early taxable withdrawals can incur a charge.</p>'+
  finSelect('fin-retire-type','Account',[['traditional','Traditional IRA'],['roth','Roth IRA']])+
  finSelect('fin-retire-action','Transaction',[['deposit','Contribute'],['withdraw','Withdraw']])+
  finInput('fin-retire-amount','Amount in selected currency',1000)+B('Submit retirement transaction',"finAction('retirement','')",g.age<18))+
  finSection('Employer and government retirement',retV());
}
function finTaxView(s){
 const latest=finTaxProfile();
 return finSection('Country tax schedule',`<p>${uiEscape(g.country)} · Simulated progressive income tax. Standard exemption ${loc(pr(latest.allow))}.</p>`+
  [['Vehicles',latest.car],['Home transfer',latest.home],['Jewelry',latest.jewelry],['Other purchases',latest.other],
   ['Capital gains',latest.gains],['Lottery winnings',latest.lottery],['Estate tax above '+loc(pr(latest.estateFree)),latest.estate]]
  .map(([title,value])=>finLabel(title,value+'%')).join(''))+
  finSection('Tax returns',s.returns.slice().reverse().map(r=>`<article class="law-item"><div><h4>Age ${r.age} · ${uiEscape(r.country)}</h4>
   <p>${r.filing?(r.filing.refund?'Refund '+loc(r.filing.refund):'Filed · Tax assessed '+loc(r.filing.total)):'Ready to file'}.</p></div>
   ${B(r.filing?'View return':'Review and file',`finOpenTax(${r.age})`)}</article>`).join('')||'<p>The first adult return is prepared at Age Up.</p>')+
  finSection('Tax planning',moneyV('Taxes'))+(s.estate.length?finSection('Estate distributions',s.estate.slice().reverse().map(r=>`<p>${uiEscape(r.name)} · ${r.heirs} heirs · Your share ${loc(r.share)} · Estate tax ${loc(r.tax)}.</p>`).join('')):'');
}
function finTaxModal(report,s){
 const filed=report.filing,estimate=filed||finTaxPreview(report);
 const amounts=[
  ['Standard exemption',report.allowance],['Net realized capital gains',report.capital],['Lottery winnings',report.lotteryGross],
  ['Lottery tax withheld',report.lotteryTax],['Inheritance received',report.inherited],['Estate taxes paid by estates',report.estateTax],
  ['Sales and transfer taxes paid',report.salesTax],['Early withdrawal charge paid',report.earlyPenalty],['Total income and lottery tax withheld',report.withheld],
  ['Social security withheld',report.social||0],['Healthcare levy withheld',report.healthcare||0],['Previous balances withheld from paycheck',report.arrearsPaid||0]
 ];
 const selections=report.deductions.length?report.deductions.map(d=>`<label class="fin-check"><input type="checkbox" name="fin-deduction" value="${d.id}"
    ${!filed||filed.selected.includes(d.id)?'checked':''} ${filed?'disabled':'onchange="finUpdateTaxPreview()"'}> ${uiEscape(d.label)} · ${loc(d.value)}</label>`).join(''):
    '<p>No optional deductions were recorded.</p>';
 const message=estimate.difference>0?'Additional tax due ':estimate.difference<0?'Expected refund ':'Balance due ';
 return lawModal('Income tax filing',
  `<p>Age ${report.age} · ${uiEscape(report.country)}. This return uses the game’s tax schedule.</p>`+
  report.rows.map(([title,n])=>finLabel(title,loc(n))).join('')+finLabel('Total taxable income before deductions',loc(report.ordinary))+
  amounts.filter(([,n])=>n!==0).map(([title,n])=>finLabel(title,loc(n))).join('')+
  '<h3>Available deductions</h3>'+selections+`<p id="fin-tax-preview">${message}${loc(Math.abs(estimate.difference))}</p>`+
  (filed?finLabel('Paid from bank',loc(filed.paid))+finLabel('Refund deposited',loc(filed.refund))+
    finLabel('Deferred to future paychecks',loc(filed.deferred)):'<p>Tax payments use checking and savings. Any unpaid amount is withheld from future wages.</p>'),
  (filed?'':B('File with selected deductions','finFileButton()'))+B(filed?'Close':'Review later','finCloseModal()'));
}
function finModalView(s,kind){
 if(kind==='tax'){
  const report=s.returns.find(x=>x.age===s.modal?.age);
  return report?finTaxModal(report,s):'';
 }
 if(kind==='notice'){
  const n=s.notices[0];
  return n?lawModal(n.title,`<p>${uiEscape(n.text)}</p>`,B('Continue','finDismissNotice()')):'';
 }
 if(kind==='collection'&&s.collection)return lawModal('Debt collection',
  `<p>Cash shortfall ${loc(Math.max(0,-g.cash))}. Available credit and bank cash could not cover it.</p>
  <p>Surrendering assets can include your car and home. Restructuring protects your primary home and car, sells nonessential assets, then combines remaining eligible balances into a high-interest loan.</p>`,
  finButton('Surrender assets','collections','surrender')+finButton('Negotiate restructuring','collections','restructure'));
 if(kind==='event'&&s.event){
  const row=FINANCE_EVENTS[s.event.key];
  return lawModal('Financial decision',`<p>${uiEscape(row[0])}.</p>`,row[1].map(([label,key])=>finButton(label,'event',key)).join('')+B('Review later','finDeferEvent()'));
 }
 return '';
}

const finOriginalOther=otherV;
otherV=function(){
 if(NV.O[0]==='Finance')return finCenter();
 const html=finOriginalOther();
 if(NV.O[0]==='Ventures'&&vsel==null)return B('Corporate company directory',"finOpen('companies')")+html;
 return html;
};
const finOriginalMoney=moneyV;
moneyV=function(){
 const panels={Banking:'banking',Loans:'loans',Retirement:'retirement',Taxes:'taxes'};
 const html=finOriginalMoney();
 if(!panels[msub])return B('Open financial center',"finOpen('overview')")+html;
 return B('Open '+FINANCE_PAGES[panels[msub]].toLowerCase()+' in Financial center',`finOpen('${panels[msub]}')`)+html;
};
function finShoppingInvestments(){
 return B('Browse investments',"finOpen('market')")+B('Open company directory',"finOpen('companies')")+
   finSection('Angel investments',`<p>${g.angels.length} private investments.</p>`+
    B('Invest '+loc(10000),'angel(10000)',g.age<18||g.cash<10000)+B('Invest '+loc(100000),'angel(100000)',g.age<18||g.cash<100000));
}
const finOriginalShop=stuffShopView;
stuffShopView=function(){return stuffShopTab==='Investments'?finShoppingInvestments():finOriginalShop();};
const finOriginalStuff=stuffTop;
stuffTop=function(){return NV.S[0]==='Invest'?B('Back to Stuff',"nvb('S')")+finShoppingInvestments():finOriginalStuff();};
const finOldGame=gameView;
gameView=function(){
 const html=finOldGame();
 if(g.jail)return html;
 const root=document.createElement('div');root.innerHTML=html;
 const s=g.financial,head=root.querySelector('.hd .row>span:nth-child(2)');
 if(head){
  for(const node of [...head.childNodes])if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim())node.remove();
  const cash=document.createElement('button');cash.className='fin-cash';cash.type='button';cash.textContent=loc(g.cash);
  cash.setAttribute('aria-label','Open financial center · '+loc(g.cash));
  if(s?.returns.at(-1)?.filing===null)cash.title='An income tax return is ready';cash.setAttribute('onclick',"finOpen('overview')");head.prepend(cash);
 }
 const current=s?.returns.at(-1),summary=root.querySelector('button[onclick*="g.ysum=null"]');
 if(summary&&current?.age===g.age&&!current.filing){
  summary.insertAdjacentHTML('beforebegin',B('Review income tax return',`finOpenTax(${current.age})`));
 }
 if(s){
  const existing=root.querySelector('.mo');
  const requested=['tax','notice'].includes(s.modal?.kind);
  if(!existing||requested){
   const kind=s.modal?.kind||(s.collection?'collection':s.notices.length?'notice':s.enabled&&s.event&&!s.event.deferred?'event':null);
   const modal=finModalView(s,kind);
   if(modal){
    existing?.remove();
    root.querySelector('.game').insertAdjacentHTML('beforeend',modal);
   }
  }
 }
 return root.innerHTML;
};
