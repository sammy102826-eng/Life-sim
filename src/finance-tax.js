let finPriorLedger=null;
function finTaxProfile(country=g.country){
 return {...FINANCE_TAX_DEFAULT,...finCountry(country)};
}
function finSalesTax(kind,price,country=g.country){
 const p=finTaxProfile(country);
 return Math.max(0,Math.round(price*(p[{car:'car',home:'home',lux:'jewelry'}[kind]||'other']||0)/100));
}
function finSalesPaid(amount){
 if(amount){finAdd('salesTax',amount);LD('Sales and transfer taxes',-amount);}
}
function finEstateTax(estate,country=g.country){
 const p=finTaxProfile(country);
 return Math.max(0,Math.round((estate-Math.round(p.estateFree*(.3+(g.w[country]?.n.E||50)/100)))*p.estate/100));
}
function finParents(s){
 const family=g.rel.filter(r=>['Mother','Father','Parent'].includes(r.role));
 const counted=new Set(s.estate.map(x=>x.parent));
 for(const r of family){
  if(r.alive){
   if(r.estateSavings==null)r.estateSavings=Math.max(0,Math.round((r.m||0)+pr([2000,18000,72000,340000][g.tier]||0)));
   r.estateCountry??=g.country;
   if(r.estateAge!==g.age){
    r.estateSavings=Math.max(0,Math.round(r.estateSavings*1.02+(r.inc||0)*(r.age>=65?.035:.09)));
    r.estateAge=g.age;
   }
   continue;
  }
  if(!r.deceased||r.deathAt!==g.age||counted.has(r.id))continue;
  const gross=Math.max(0,Math.round((r.estateSavings??r.m)??0)),country=r.estateCountry||g.country;
  const tax=finEstateTax(gross,country);
  const heirs=1+g.rel.filter(x=>x.alive&&['Sibling','Brother','Sister'].includes(x.role)).length;
  const share=Math.floor((gross-tax)/heirs);
  s.estate.push({age:g.age,parent:r.id,name:r.n,country,gross,tax,heirs,share});
  counted.add(r.id);
  finBankDeposit(share);
  LD('Inheritance received',share);
  finAdd('inheritance',share);
  finAdd('estateTax',tax);
  s.notices.push({title:'Estate distribution',text:r.n+' left '+loc(gross)+'. Estate taxes were '+loc(tax)+'. Your share after division among '+heirs+' heirs was '+loc(share)+'.'});
 }
}
function finTaxLedger(s){
 const old=finPriorLedger||{},base=s.ledgerBase||{},now=g.led||{},result={...now};
 for(const key of Object.keys(old)){
  const change=(old[key]||0)-(base[key]||0);
  if(change)result[key]=(result[key]||0)+change;
 }
 return result;
}
function finTaxPreview(report,selected=report.deductions.map(x=>x.id)){
 const cut=report.deductions.filter(x=>selected.includes(x.id)).reduce((n,x)=>n+x.value,0);
 let taxable=Math.max(0,report.ordinary-report.allowance-cut);
 const grossTaxable=taxable;
 let ordinaryTax=0;
 for(const [length,rate] of report.brackets){
  const slice=Math.min(taxable,length);
  ordinaryTax+=slice*rate/100;
  taxable-=slice;
  if(taxable<=0)break;
 }
 const gains=Math.max(0,report.capital-report.capitalAllowance),gainsTax=finInt(gains*report.capitalRate/100);
 const total=finInt(ordinaryTax)+gainsTax+report.lotteryTax;
 return {deductions:cut,taxable:grossTaxable,ordinaryTax:finInt(ordinaryTax),gainsTax,total,difference:total-report.withheld};
}
function finPrepareTaxes(s,ledger){
 const p=finTaxProfile(),a=s.activity,f=g.jail?{}:g.fin||{};
 const rows=[];
 const add=(name,amount)=>{if(amount>0)rows.push([name,finInt(amount)]);};
 const sum=(match,abs=false)=>Object.entries(ledger).reduce((n,[key,value])=>match.test(key)?n+(abs?Math.max(0,-value):Math.max(0,value)):n,0);
 add('Payroll income',f.gr||0);
 add('Pension income',(f.gv||0)+(f.pv||0)+sum(/^Pension payments$/i));
 add('Bank and bond interest',sum(/^(Savings interest|Youth account interest|High-yield savings interest|Bond interest)$/i));
 add('Rent and business distributions',sum(/^(Rental income|Recovered rent|.* profit|.* owner distributions?|Movie studio owner withdrawal|Medical practice owner distribution before tax|Real estate commissions?)$/i));
 add('Performances, publications and sponsorships',sum(/^(Acting production payments|Writing publication payment|.* appearance fees|.* sponsorship income|.* performance income)$/i));
 add('Taxable account withdrawals',(a.ordinary||0));
 const ordinary=rows.reduce((n,[,amount])=>n+amount,0);
 const inherited=a.inheritance||0,lotteryGross=a.lotteryGross||0,lotteryTax=a.lotteryTax||0;
 const capital=(a.gains||0);
 const withhold=(f.inc||0)+sum(/^(Acting income taxes|Movie studio withdrawal tax|Medical practice distribution tax|Law firm distribution tax|Business distribution tax)$/i,true)+lotteryTax;
 const maxMarginal=Math.max(0,Math.min(53,C().t.inc));
 const allowances=pr(p.allow+(g.age<18?2100:g.age>=65?1900:0));
 const charity=sum(/^(Charitable donations|News charitable response)$/i,true)+(a.charity||0);
 const business=sum(/^(Property management|Managed repairs|Real estate firm overhead|Office salaries|.* business interest)$/i,true);
 const children=kids().filter(x=>x.age<18).length;
 const deductions=[
  {id:'charity',label:'Qualified charitable donations',value:Math.min(charity,pr(18000),finInt(ordinary*p.charity))},
  {id:'children',label:'Dependent allowance',value:Math.min(3,children)*pr(p.child)},
  {id:'business',label:'Documented business expenses',value:Math.min(business,pr(22000),finInt(ordinary*.22))},
  {id:'retirement',label:'Traditional retirement contributions',value:Math.min(a.tradContrib||0,pr(p.retirement+(g.age>=50?1000:0)))},
  {id:'student',label:'Eligible student loan interest',value:Math.min(pr(1800),s.studentInterest||0)}
 ].filter(x=>x.value>0);
 return {age:g.age,country:g.country,rows,ordinary,allowance:allowances,capital,capitalAllowance:pr(2500),capitalRate:p.gains,
  brackets:[[pr(18000),Math.round(maxMarginal*.54)],[pr(36000),Math.round(maxMarginal*.88)],[pr(78000),maxMarginal],[1000000000000000,maxMarginal?Math.min(60,maxMarginal+6):0]],
  lotteryGross,lotteryTax,inherited,estateTax:a.estateTax||0,salesTax:a.salesTax||0,earlyPenalty:a.earlyPenalty||0,withheld:withhold,social:f.ss||0,healthcare:f.hc||0,arrearsPaid:f.taxArrears||0,deductions,filing:null};
}
function finFile(s,report,ids,automatic=false){
 if(!report||report.filing)return '';
 const selected=report.deductions.filter(x=>ids.includes(x.id)).map(x=>x.id);
 const calc=finTaxPreview(report,selected);
 let paid=0,refund=0,deferred=0;
 if(calc.difference>0){
  paid=finPull(calc.difference,false,true);
  deferred=calc.difference-paid;
  s.arrears+=deferred;
  LD('Tax filing payment',-paid);
 }else if(calc.difference<0){
  refund=-calc.difference;
  finBankDeposit(refund);
  LD('Tax refund',refund);
 }
 report.filing={...calc,selected,paid,refund,deferred,automatic};
 const text=refund?'A refund of '+loc(refund)+' was deposited.':calc.difference>0?
   loc(paid)+' was paid from bank balances. '+(deferred?loc(deferred)+' will be deducted from future paychecks.':'The return is settled.'):
   'No additional payment or refund was required.';
 L('Tax filing · '+text);
 return text;
}
function finGarnish(){
 const s=g.financial,f=g.fin;
 if(!s?.arrears||!f?.gr||s.arrearsAge===g.age)return;
 const payment=Math.min(s.arrears,Math.max(0,Math.floor(g.cash)),Math.round(f.gr*.15));
 if(!payment)return;
 s.arrearsAge=g.age;s.arrears-=payment;g.cash-=payment;f.net-=payment;f.taxArrears=payment;
 LD('Prior tax balance withheld from paycheck',-payment);
}
function finEventYear(s){
 if(!s.enabled||s.event||g.age<18||g.jail||finRand(s,1,100)>45)return;
 const all=Object.keys(FINANCE_EVENTS),pool=all.filter(x=>!s.eventSeen.includes(x));
 if(!pool.length)s.eventSeen=[];
 const list=pool.length?pool:all,key=list[finRand(s,0,list.length-1)];
 s.eventSeen.push(key);s.event={key,age:g.age};
}
function finEventResolve(action){
 const s=finState(),e=s.event,row=FINANCE_EVENTS[e?.key];
 if(!row||!row[1].some(x=>x[1]===action)||g.jail)return '';
 s.event=null;
 const next=()=>{
  if(action==='dispute'){g.cred=Math.min(850,g.cred+9);finBankDeposit(pr(340));return 'The issuer reversed a duplicate charge. Your credit file was corrected.';}
  if(action==='credit'){finBankDeposit(pr(140));return 'The bank issued a partial credit.';}
  if(action==='save'){if(g.cash<pr(1000))return 'Savings were unchanged because the transfer was unaffordable.';g.cash-=pr(1000);finBankDeposit(pr(1000),'sav');return 'The bank set aside a cash reserve.';}
  if(action==='learn'){g.smarts=cl(g.smarts+3);g.cred=Math.min(850,g.cred+5);return 'You improved your budget and credit habits.';}
  if(action==='rebate'){finBankDeposit(pr(280));return 'The utility rebate was deposited.';}
  if(action==='utility'){s.credit.utility=pr(400);return 'The utility credit is on file for next year.';}
  if(action==='records'){finAdd('charity',Math.min(pr(600),s.missingCharity||0));s.missingCharity=0;return 'You recovered eligible receipts for the next filing.';}
  if(action==='dividend'){finBankDeposit(pr(210));finAdd('ordinary',pr(210));return 'The member dividend was deposited.';}
  if(action==='aid'){finAdd('charity',pr(210));finAdd('ordinary',pr(210));return 'The issuer donated your member distribution to local aid.';}
  if(action==='early'){
   const loan=g.loans.find(x=>x.bal>0&&!x.assetId);
   if(!loan||g.cash<pr(400))return 'There was no eligible balance you could pay today.';
   const paid=Math.min(loan.bal,pr(400)),credit=Math.min(loan.bal-paid,pr(80));
   g.cash-=paid;loan.bal-=paid+credit;
   g.loans=g.loans.filter(l=>l.bal>0);return 'The lender applied your payment and an early repayment credit.';
  }
  if(action==='lock'){s.credit.lockUntil=g.age;return 'New credit applications are paused for the rest of this year.';}
  if(action==='watch'){g.cred=Math.min(850,g.cred+2);return 'You checked the account and kept applications available.';}
  return 'You kept your current arrangements.';
 };
 return next();
}
function finYear(){
 const s=finState();
 if(s.lastAge===g.age)return;
 s.lastAge=g.age;
 for(const report of s.returns.filter(x=>!x.filing&&x.age<g.age))finFile(s,report,report.deductions.map(x=>x.id),true);
 if(s.credit.utility){finBankDeposit(s.credit.utility);LD('Utility account credit',s.credit.utility);s.credit.utility=0;}
 finParents(s);
 finSavingsYear(s);
 finMarketYear(s);
 finWatchYear(s);
 finLotteryYear(s);
 const ledger=finTaxLedger(s);
 if(g.age>=18){
  s.returns.push(finPrepareTaxes(s,ledger));
  s.returns=s.returns.slice(-45);
 }
 if(s.notices.length>12)s.notices=s.notices.slice(-12);
 s.activity={};s.studentInterest=0;s.ledgerBase={...g.led};
 finEventYear(s);
}
