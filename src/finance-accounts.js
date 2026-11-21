const finIssuer=index=>FINANCE_BANKS[index]?.id||FINANCE_BANKS[0].id;
const finBankName=id=>FINANCE_COMPANIES.find(x=>x[0]===id)?.[1]||'First Federal';
function finBankDeposit(amount,to='chk'){
 if(g.age<18){finState().youth+=amount;return;}
 if(g.bank.id==null)g.bank.id=0;
 g.bank[to]+=amount;
}
function finTransfer(action,amount){
 const s=finState(),accounts={saving:[g.bank,'sav'],checking:[g.bank,'chk'],high:[s,'high'],youth:[s,'youth']};
 const [direction,key]=action.split('-'),target=accounts[key];
 if(!['in','out'].includes(direction)||!target||!finSafe(amount)||amount<=0||g.jail)return 'Enter a positive whole amount.';
 if(key==='youth'&&(g.age<6||g.age>=18)||key!=='youth'&&(g.age<18||g.bank.id==null))return 'This account is unavailable.';
 if(key==='high'&&direction==='in'&&!FINANCE_BANKS[g.bank.id]?.high)return 'Choose a bank that offers a high-yield account.';
 const [record,field]=target,source=direction==='in'?g.cash:record[field];
 if(source<amount)return 'The source balance cannot cover that transfer.';
 if(direction==='in'){g.cash-=amount;record[field]+=amount;}
 else{record[field]-=amount;g.cash+=amount;}
 return 'Transfer of '+loc(amount)+' completed.';
}
function finRetirement(action,key,amount){
 const s=finState(),r=s.retirement,terms=finCountry(g.country);
 if(!['traditional','roth'].includes(key)||!['deposit','withdraw'].includes(action)||g.age<18||g.jail||!finSafe(amount)||amount<1)return 'Enter a positive whole amount.';
 if(action==='deposit'){
  const cap=pr(terms.retirement+(g.age>=50?1000:0)),used=(s.activity.tradContrib||0)+(s.activity.rothContrib||0);
  if(g.cash<amount||used+amount>cap)return 'The contribution exceeds personal cash or your remaining annual limit of '+loc(Math.max(0,cap-used))+'.';
  g.cash-=amount;r[key]+=amount;
  if(key==='roth'){r.rothBasis+=amount;finAdd('rothContrib',amount);}
  else finAdd('tradContrib',amount);
  return 'Retirement contribution posted.';
 }
 if(r[key]<amount)return 'The retirement balance cannot cover that withdrawal.';
 const taxable=key==='traditional'?amount:g.age>=60?0:Math.max(0,amount-r.rothBasis);
 const penalty=g.age<60?Math.round(taxable*.1):0;
 r[key]-=amount;
 if(key==='roth')r.rothBasis=Math.min(r.roth,Math.max(0,r.rothBasis-amount));
 g.cash+=amount-penalty;
 finAdd('ordinary',taxable);finAdd('earlyPenalty',penalty);
 return 'Received '+loc(amount-penalty)+(penalty?' after an early withdrawal charge of '+loc(penalty):'')+'.';
}
function finSavingsYear(s){
 if(s.youth){
  const interest=finInt(s.youth*.062);
  s.youth+=interest;LD('Youth account interest',interest);
  if(g.age>=18){finBankDeposit(s.youth,'sav');s.youth=0;s.notices.push({title:'Your youth account matured',text:'The remaining balance and interest moved to adult savings.'});}
 }
 if(s.high){
  const bank=FINANCE_BANKS[g.bank.id],apy=bank?.high||FINANCE_BANKS[0].apy;
  const interest=finInt(s.high*apy/100);
  s.high+=interest;LD('High-yield savings interest',interest);
 }
 for(const key of ['traditional','roth'])if(s.retirement[key]){
  const move=finRand(s,-6,12);
  s.retirement[key]=Math.max(0,finInt(s.retirement[key]*(1+move/100)));
 }
}
function finPull(amount,useCash=false,includeHigh=false){
 let left=Math.max(0,finInt(amount)),paid=0;
 for(const [record,key] of [[g.bank,'chk'],[g.bank,'sav'],...(includeHigh?[[finState(),'high']]:[]),...(useCash?[[g,'cash']]:[])]){
  const take=Math.min(left,Math.max(0,Math.floor(record[key]||0)));
  record[key]-=take;left-=take;paid+=take;
 }
 return paid;
}
function finCardYear(){
 const s=finState(),c=g.cc;
 if(s.credit.lastAge===g.age)return;
 s.credit.lastAge=g.age;
 if(!c)return;
 const def=CARDS[c.i];
 if(!def)return;
 const opening=Math.max(0,finInt(c.bal)),canPay=Math.max(0,g.bank.chk)+Math.max(0,g.bank.sav)+Math.max(0,g.cash);
 const full=s.credit.mode==='full'&&canPay>=opening;
 const interest=full?0:finInt(opening*def[2]/100);
 c.bal=opening+interest;
 const due=full?c.bal:Math.min(c.bal,Math.max(pr(25),Math.ceil(c.bal*.05),Math.max(0,s.credit.missed||0)));
 const paid=finPull(due,true);
 c.bal-=paid;s.credit.missed=due-paid;
 if(due>paid)g.missed=1;
 const reward=finInt((c.spent||0)*(FINANCE_BANKS[c.i]?.reward||0)/100);
 if(reward){finBankDeposit(reward);LD('Credit card cashback',reward);}
 if(interest)LD('Credit card interest assessed',-interest);
 if(paid)LD('Credit card payment',-paid);
 s.credit.report={age:g.age,opening,interest,due,paid,reward,mode:full?'Full balance':'Minimum payment'};
 c.spent=0;
}
function finCreditFinalize(){
 const s=finState();
 if(s.credit.scoreAge===g.age)return;
 s.credit.scoreAge=g.age;
 if(g.cc)finCardYear();
 if(g.cash<0)g.missed=1;
 const card=g.cc&&CARDS[g.cc.i],usage=card?g.cc.bal/Math.max(1,pr(card[1])):0;
 g.cred=cl(g.cred+(g.missed?-45:6)-(usage>.3?Math.round((usage-.3)*20):0),300,850);
 g.missed=0;
}
function finManualCredit(amount){
 const s=finState();
 if(!g.cc||!finSafe(amount)||amount<=0||g.jail)return 'Enter an amount to pay.';
 const due=Math.min(amount,g.cc.bal);
 if(!due)return 'The card balance is already paid.';
 const paid=finPull(due,true);
 g.cc.bal-=paid;s.credit.missed=Math.max(0,s.credit.missed-paid);
 return 'Paid '+loc(paid)+'. Remaining balance '+loc(g.cc.bal)+'.';
}
function finLoanTerms(kind='personal'){
 const eligible=g.cred>=(kind==='business'?640:560)&&g.age>=18&&finState().credit.lockUntil!==g.age;
 const existing=g.loans.filter(l=>['personal','business','restructure'].includes(l.kind)||!l.kind&&!l.assetId&&!l.h).reduce((n,x)=>n+x.bal,0);
 const base=kind==='business'?112000:52000,limit=Math.max(0,finInt(pr(base)*Math.max(.1,(g.cred-525)/225)-existing));
 const rate=Math.min(27,Math.max(4.25,Math.round((8+(720-g.cred)/17+(kind==='business'?2.1:0))*10)/10));
 return {eligible,limit,rate,issuer:finIssuer(g.bank.id??0)};
}
function finNewLoan(amount,kind,years){
 const t=finLoanTerms(kind);
 if(!['personal','business'].includes(kind)||![3,5,8,10].includes(years)||!finSafe(amount)||amount<1||g.jail||!t.eligible||amount>t.limit)return 'This request exceeds current borrowing eligibility.';
 g.loans.push({id:uid(),n:kind==='business'?'Business loan':'Personal loan',kind,lender:t.issuer,bal:amount,original:amount,rate:t.rate,term:years,yearsLeft:years});
 g.cash+=amount;
 LD('New loan principal',amount);
 return finBankName(t.issuer)+' approved '+loc(amount)+' at '+t.rate+'% for '+years+' years.';
}
function finBusinessPay(which,amount){
 const entity=which==='firm'?g.lawFirm:which==='clinic'?g.practice:null;
 if(!entity||entity.status!=='active'||entity.debt<=0||!finSafe(amount)||amount<1||g.jail)return 'There is no eligible business balance to pay.';
 const paid=Math.min(amount,Math.floor(entity.cash),entity.debt);
 if(paid<=0)return 'The business has no cash available for repayment.';
 entity.debt-=paid;
 if(which==='firm')lawPost(entity,'capital','Loan principal payment',-paid);
 else clinicEntry(entity,null,'Loan principal payment',-paid,'capital');
 return 'Business funds paid '+loc(paid)+' toward principal.';
}
function finCoverDebt(){
 if(g.cash>=0)return;
 const s=finState(),needed=Math.ceil(-g.cash);
 const transfers=finPull(needed);
 if(transfers){g.cash+=transfers;LD('Bank cash used to cover expenses',transfers);}
 if(g.cash<0&&g.cc){
  const credit=Math.max(0,pr(CARDS[g.cc.i][1])-g.cc.bal),charge=Math.min(credit,Math.ceil(-g.cash));
  if(charge>0){g.cc.bal+=charge;g.cc.spent=(g.cc.spent||0)+charge;g.cash+=charge;LD('Expenses charged to your card',charge);}
 }
 if(g.cash<-pr(3000)){
  const loan=finLoanTerms();
  if(!loan.eligible||-g.cash>loan.limit||(s.credit.missed||0)>0){
   if(!s.collection){s.collection={age:g.age};g.dbt++;g.cred=Math.max(300,g.cred-35);}
  }else if(s.credit.noticeAge!==g.age){
   s.credit.noticeAge=g.age;
   s.notices.push({title:'Your cash balance is overdrawn',text:'The card and bank balances could not cover all expenses. Review the Loans panel for available credit.'});
  }
 }
}
function finRepoList(protect){
 stuffEnsureIds();
 const options=[];
 const add=(kind,items)=>items.forEach(x=>options.push({kind,x}));
 add('lux',g.lux);add('boat',g.boats);add('plane',g.planes);
 add('car',stuffAllCars().filter(x=>!protect||x!==g.car));
 add('home',stuffAllHomes().filter(x=>x.own&&(!protect||x!==g.home)));
 return options.sort((a,b)=>{
  const priority=y=>['car','home'].includes(y.kind)?(y.x===g.car||y.x===g.home?2:1):0;
  return priority(a)-priority(b)||b.x.v-a.x.v;
 });
}
function finRepoAsset(kind,x){
 if(!stuffRemove(kind,x.id))return false;
 const loans=g.loans.filter(l=>l.assetId===x.id||kind==='home'&&l.h===x.id);
 const due=loans.reduce((n,l)=>n+l.bal,0),proceeds=Math.max(0,Math.round(x.v*.72));
 g.loans=g.loans.filter(l=>!loans.includes(l));
 g.cash+=proceeds-due;
 LD('Net proceeds from surrendered assets',proceeds-due);
 return true;
}
function finLiquidateSecurities(s,all){
 for(const id of Object.keys(s.positions)){
  if(!all&&g.cash>=0)break;
  finClosePosition(s,id,finInstrument(s,id)?.price,'Investment liquidation');
 }
 for(const [key,,] of STK){
  if(!all&&g.cash>=0)break;
  const value=Math.max(0,g.inv[key]||0);
  if(value){g.cash+=value;g.inv[key]=0;LD('Legacy holding liquidation',value);}
 }
 for(const venture of g.vent.filter(v=>!v.ceo)){
  if(!all&&g.cash>=0)break;
  const value=Math.max(0,Math.round(VT[venture.t].value(venture)*(venture.own??100)/100*.65));
  g.cash+=value;g.vent=g.vent.filter(v=>v!==venture);LD('Surrendered business interests',value);
 }
}
function finCollections(action){
 const s=finState();
 if(!s.collection||!['surrender','restructure'].includes(action)||g.jail)return '';
 if(g.cash>=0){s.collection=null;return 'The cash shortfall was resolved before collection.';}
 const protect=action==='restructure',assets=finRepoList(protect),names=[];
 if(s.high){g.cash+=s.high;s.high=0;}
 finLiquidateSecurities(s,protect);
 for(const {kind,x} of assets){
  if(!protect&&g.cash>=0)break;
  if(finRepoAsset(kind,x))names.push(x.n);
 }
 if(protect){
  const unsecured=g.loans.filter(l=>['personal','business','restructure'].includes(l.kind)||!l.kind&&!l.h&&!l.assetId);
  let remainder=unsecured.reduce((n,l)=>n+l.bal,0)+(g.cc?.bal||0)-g.cash;
  g.loans=g.loans.filter(x=>!unsecured.includes(x));
  if(g.cc){g.cc.bal=0;g.cc.spent=0;}
  s.credit.missed=0;
  g.cash=Math.max(0,-remainder);
  remainder=Math.max(0,finInt(remainder));
  if(remainder)g.loans.push({id:uid(),n:'Restructuring loan',kind:'restructure',lender:finIssuer(g.bank.id??0),bal:remainder,rate:25,term:8,yearsLeft:8});
  g.cred=Math.max(300,g.cred-35);s.collection=null;
  return (names.length?'Surrendered '+names.join(', ')+'. ':'')+'Primary home and vehicle were protected. '+(remainder?'Restructured '+loc(remainder)+' at 25% APR.':'The remaining obligations were covered.');
 }
 if(g.cash<0){
  const deficiency=Math.ceil(-g.cash);
  g.cash+=deficiency;g.loans.push({id:uid(),n:'Collection deficiency',kind:'restructure',lender:finIssuer(g.bank.id??0),bal:deficiency,rate:27,term:6,yearsLeft:6});
 }
 g.cred=Math.max(300,g.cred-55);s.collection=null;
 return names.length?'Surrendered '+names.join(', ')+'. Any uncovered shortfall remains as a collection loan.':'No recoverable assets were available. The remaining shortfall became a collection loan.';
}
function finLotteryBuy(key,n){
 const def=FINANCE_LOTTERIES[key],s=finState(),owned=s.tickets[key]||0;
 if(!def||g.age<18||g.jail||!finSafe(n)||n<1||owned+n>def.ticketLimit)return 'Choose a quantity within the draw’s annual ticket limit.';
 const cost=pr(def.cost)*n;
 if(g.cash<cost)return 'Personal cash cannot cover those tickets.';
 g.cash-=cost;s.enabled=true;s.tickets[key]=owned+n;s.pots[key]??=pr(def.base);
 LD('Lottery tickets',-cost);
 return 'Bought '+n+' ticket'+(n===1?'':'s')+' for '+def.name+'.';
}
function finLotteryYear(s){
 const taxes=finCountry(g.country);
 for(const [key,def] of Object.entries(FINANCE_LOTTERIES)){
  const n=s.tickets[key]||0,pot=s.pots[key]??pr(def.base);
  if(!n){if(s.enabled)s.pots[key]=Math.min(pr(def.base)*6,pot+pr(def.base*.08));continue;}
  const probability=1-(1-1/def.odds)**n,win=finRand(s,1,1000000)<=Math.round(probability*1000000);
  const other=!win&&finRand(s,1,1000)<=Math.min(610,7*n);
  const gross=win?pot:other?pr(def.secondary)*Math.max(1,Math.round(n/40)):0;
  const tax=finInt(gross*taxes.lottery/100);
  if(gross){
   finBankDeposit(gross-tax);LD('Lottery winnings after withholding',gross-tax);finAdd('lotteryGross',gross);finAdd('lotteryTax',tax);
  }
  s.notices.push({title:def.name+' results',text:gross?'Your '+n+' tickets won '+loc(gross)+'. '+loc(tax)+' was withheld and '+loc(gross-tax)+' deposited.':'None of your '+n+' tickets won. The jackpot rolls over.'});
  if(win&&gross>=pr(100000))newsPublish('business','A lottery jackpot is claimed','The public draw reported a jackpot winner. You can choose how to respond to the attention.',{type:'spotlight'},'jackpot-'+key+'-'+g.age);
  s.pots[key]=win?pr(def.base):Math.min(pr(def.base)*6,pot+pr(def.base*.12)+n*pr(def.cost));
 }
 s.tickets={};
}
function finCollateralOkay(kind,amount){
 if(amount<=0)return true;
 const s=finState();
 if(g.age<18||g.cred<520||s.credit.lockUntil===g.age)return false;
 const ceiling={car:110000,home:1150000,lux:90000}[kind]||120000;
 return amount<=pr(ceiling)*Math.min(1.12,Math.max(.10,(g.cred-490)/270));
}
