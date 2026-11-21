for(const [index,bank] of FINANCE_BANKS.entries())BANKS[index][1]=bank.apy;

const finOriginalAge=ageUp;
ageUp=function(){
 if(g&&!g.jail&&(g.financial?.modal||g.financial?.collection&&!g.event&&!g.result&&!g.ysum))return;
 const previous=finPriorLedger;
 finPriorLedger={...g?.led};
 try{return finOriginalAge();}
 finally{finPriorLedger=previous;}
};
const finOriginalPayday=payday;
payday=function(){
 const s=g.financial;
 for(const report of s?.returns.filter(x=>!x.filing&&x.age<g.age)||[])finFile(s,report,report.deductions.map(x=>x.id),true);
 const result=finOriginalPayday();
 finGarnish();
 return result;
};
const finOldStudent=eduLoanPayroll;
eduLoanPayroll=function(income){
 const record=eduLoanPlan(),before=record.lastAge,result=finOldStudent(income),stamp=record.history.at(-1);
 if(before!==record.lastAge&&stamp?.age===g.age&&stamp.interest)finState().studentInterest=Math.min(stamp.interest,stamp.payment);
 return result;
};
debtCheck=function(){finCoverDebt();};
const finOldOpenBank=openBank;
openBank=function(i){
 if(g.age<18||g.jail||!BANKS[i])return toast('Adult bank accounts open at age 18.');
 const s=finState(),prior=g.bank.id;
 const result=finOldOpenBank(i);
 if(g.bank.id===i&&prior!==i&&s.high&&!FINANCE_BANKS[i].high){g.bank.sav+=s.high;s.high=0;draw();}
 return result;
};
const finOldApplication=applyCC;
applyCC=function(i){
 if(g.jail||finState().credit.lockUntil===g.age||!CARDS[i])return toast('New credit applications are unavailable.');
 const result=finOldApplication(i);
 if(g.cc?.i===i)g.cc.lender=finIssuer(i);
 return result;
};
loanNew=function(amount){toast(finNewLoan(amount,'personal',5));};
const finOldAssetPurchase=stuffCompletePurchase;
stuffCompletePurchase=function(method){
 const before=new Set(g.loans),result=finOldAssetPurchase(method);
 for(const loan of g.loans)if(!before.has(loan))loan.lender=finIssuer(g.bank.id??0);
 return result;
};
const finOldBuyVehicle=buyVeh;
buyVeh=function(kind,index){
 const row=(kind==='b'?BOATS:PLANES)[index];
 if(!row)return;
 const price=pr(row[1]),tax=finSalesTax('other',price),licensed=kind==='b'?'Boat license':'Pilot license';
 if(g.age<18||g.jail)return toast('This purchase is currently unavailable.');
 if(!g.lic.includes(licensed))return finOldBuyVehicle(kind,index);
 const down=g.cash>=price+tax?price:Math.round(price*.2);
 if(g.cash<down+tax||!finCollateralOkay('other',price-down))return toast('The purchase and tax exceed your available cash or financing.');
 const assetKind=kind==='b'?'boat':'plane',id=uid();
 (kind==='b'?g.boats:g.planes).push({id,n:row[0],v:price,purchasePrice:price,assetType:assetKind,age:0});
 if(price>down)g.loans.push({id:uid(),assetId:id,kind:assetKind,n:row[0]+' loan',bal:price-down,original:price-down,rate:lrate(),
  term:5,yearsLeft:5,lender:finIssuer(g.bank.id??0)});
 g.cash-=down+tax;finSalesPaid(tax);
 A({p:2},'You bought '+row[0]+'. Sales tax '+loc(tax)+'.');
};
const finOldNW=nw;
nw=function(){
 const s=g.financial;
 if(!s)return finOldNW();
 const positions=Object.keys(s.positions).reduce((n,id)=>n+finPositionValue(s,id),0);
 return finOldNW()+s.high+s.youth+s.retirement.traditional+s.retirement.roth+positions-s.arrears;
};
const finOldCo=VT.co.year;
VT.co.year=function(v){
 const result=finOldCo.call(this,v);
 const s=finInitMarket(),c=finCompanyQuote(s,v);
 if(result===false&&c?.public){
  if(s.positions[c.id])finClosePosition(s,c.id,.01,'Bankruptcy position settlement');
  c.public=false;c.price=null;c.linked=false;
  finHeadline(c.name+' files for bankruptcy','Trading was suspended. Shareholders received the final nominal liquidation price.',c.id,'bankrupt-'+c.id);
 }
 return result;
};
const finOldVA=va;
va=function(i,action){
 const v=g.vent[i],old=v?.t==='co'?{value:v.val,products:v.prod,shares:v.sh,public:v.pub,cash:g.cash}:null;
 const result=finOldVA(i,action);
 if(!v||!old)return result;
 const s=finInitMarket();
 let reason='';
 if(v.prod>old.products){
  v.patents=(v.patents||0)+1;
  v.val=Math.round(v.val*1.09);
  v.rev=Math.round(v.rev*1.04);
  reason='research';
 }
 const c=finCompanyQuote(s,v,reason);
 if(c?.public&&old.shares!==v.sh)finHeadline(c.name+' splits its shares','Each share was split. Total ownership was preserved.',c.id,'split-'+c.id+'-'+g.age);
 if(c&&(reason||old.public!==v.pub||old.value!==v.val||old.shares!==v.sh))draw();
 return result;
};
const finOldVentureSale=vsell;
vsell=function(i){
 const v=g.vent[i],s=v?.t==='co'?finInitMarket():null;
 if(s)finCompanyQuote(s,v);
 const result=finOldVentureSale(i);
 if(s)finSyncCompanies(s);
 return result;
};
const finOldFound=found;
found=function(i){
 const known=new Set(g.vent);
 const result=finOldFound(i);
 const company=g.vent.find(v=>v.t==='co'&&!known.has(v));
 if(company)finCompanyQuote(finInitMarket(),company);
 return result;
};
const finOldHeir=heir;
heir=function(id){
 const before=g,children=Math.max(1,kids().length),tax=finEstateTax(Math.max(0,Math.round(g.cash)));
 const result=finOldHeir(id);
 if(g!==before&&tax){g.cash=Math.max(0,g.cash-Math.floor(tax/children));L('Estate tax reduced your inherited cash share.');draw();}
 return result;
};
function finNewsOptions(a){
 const row=finFind(finInitMarket().companies,a.brief.ref);
 if(!row)return [['Read market context','brief2']];
 return [[row.public?'Review '+row.name+' in Investments':'Review '+row.name+' in the company directory','brief0'],
  ['Follow the company’s next report','brief1'],['Read without changing your plans','brief2']];
}
function finNewsResolve(a,choice){
 const s=finState(),company=finFind(finInitMarket(s).companies,a.brief.ref);
 if(choice===0&&company){
  tab='Other';NV.O=['Finance'];finPage=company.public?'market':'companies';finMarketKind=company.penny?'penny':'stock';finSelected=company.id;
  return {done:true,text:'Opened '+company.name+' for review.'};
 }
 if(choice===1&&company){(s.watch??={})[company.id]=true;s.enabled=true;return {done:true,text:company.name+' was added to the annual watchlist.'};}
 return {done:true,text:'You kept your current plans.'};
}
function finWatchYear(s){
 for(const id of Object.keys(s.watch||{})){
  const c=finFind(s.companies,id);
  if(c)s.notices.push({title:c.name+' annual report',text:c.public?'Quote '+finQuote(c.price)+' · Annual change '+c.change+'%.':'Company status · '+finCompanyStatus(c)+'.'});
 }
}

const finOriginalNewsYear=newsBuildYear;
newsBuildYear=function(){
 const result=finOriginalNewsYear();
 if(g.age<18)return result;
 const edition=g.news?.editions.find(x=>x.age===g.age);
 const article=edition?.articles.find(x=>x.kind==='market'&&!x.brief);
 if(!article)return result;
 const s=finInitMarket();
 if(s.marketShockAge===g.age)return result;
 s.marketShockAge=g.age;
 for(const row of [...s.companies.filter(x=>x.public&&!x.linked),...s.instruments.filter(x=>x.kind==='fund')]){
   const before=row.price,opening=before/Math.max(.05,1+(row.change||0)/100);
   row.price=finRoundPrice(before*.96);
   row.change=Math.round((row.price/opening-1)*100);
 }
 article.text+=' Public stock and mutual fund quotes reflect the broader decline.';
 return result;
};

function finValidate(life){
 const s=life.financial,object=x=>!!x&&typeof x==='object'&&!Array.isArray(x),num=Number.isFinite;
 const count=x=>Number.isSafeInteger(x)&&x>=0;
 if(!object(s)||s.version!==1||!count(s.seed)||!count(s.serial)||![s.high,s.youth,s.arrears].every(count)||!object(s.retirement)||
  !['traditional','roth','rothBasis'].every(k=>count(s.retirement[k]))||!object(s.credit)||!['minimum','full'].includes(s.credit.mode)||
  !['companies','instruments','notices','returns','estate','eventSeen'].every(k=>Array.isArray(s[k]))||
  !['positions','tickets','pots','activity','ledgerBase'].every(k=>object(s[k])))throw Error('Invalid financial accounts.');
 const all=[...s.companies,...s.instruments];
 if(all.some(x=>!object(x)||typeof x.id!=='string'||!/^[A-Za-z0-9:-]+$/.test(x.id)||typeof x.name!=='string'||
    x.price!=null&&(!num(x.price)||x.price<=0))||new Set(all.map(x=>x.id)).size!==all.length||
    s.companies.some(x=>typeof x.public!=='boolean'||!num(x.revenue)||!num(x.earnings)||!num(x.vol)||!num(x.change)||x.public&&x.price==null)||
    s.instruments.some(x=>!['fund','crypto','bond'].includes(x.kind)||x.price==null||
      x.kind==='fund'&&!finHas(FINANCE_FUND_DEFS,x.id)||x.kind==='crypto'&&(!finHas(FINANCE_COIN_DEFS,x.id)||!num(x.vol))||x.kind==='bond'&&(!finHas(FINANCE_BOND_DEFS,x.id)||!count(x.matures)||!count(x.term)||!x.term||!num(x.coupon))))throw Error('Invalid market listing.');
 const ids=new Set(all.map(x=>x.id));
 if(Object.entries(s.positions).some(([id,p])=>!ids.has(id)||!object(p)||!count(p.units)||!p.units||!count(p.basis))||
  Object.entries(s.tickets).some(([id,n])=>!finHas(FINANCE_LOTTERIES,id)||!count(n)||n>FINANCE_LOTTERIES[id].ticketLimit)||
  Object.entries(s.pots).some(([id,n])=>!finHas(FINANCE_LOTTERIES,id)||!count(n))||
  !Object.values(s.activity).every(num)||!Object.values(s.ledgerBase).every(num))throw Error('Invalid holdings or lottery records.');
 if(s.returns.some(x=>!object(x)||!count(x.age)||typeof x.country!=='string'||!Array.isArray(x.rows)||
   !Array.isArray(x.brackets)||x.brackets.some(b=>!Array.isArray(b)||!b.every(num))||!Array.isArray(x.deductions)||
   x.deductions.some(d=>!object(d)||typeof d.label!=='string'||typeof d.id!=='string'||!count(d.value))||!num(x.withheld)||!num(x.ordinary)||x.filing!=null&&(!object(x.filing)||!Array.isArray(x.filing.selected)||!num(x.filing.difference))))throw Error('Invalid tax return.');
 if(s.corporateDeal!=null&&(!object(s.corporateDeal)||typeof s.corporateDeal.approved!=='boolean'||
  !s.companies.some(c=>c.id===s.corporateDeal.buyer)||!s.companies.some(c=>c.id===s.corporateDeal.target)))throw Error('Invalid corporate transaction.');
 if(s.event!=null&&(!object(s.event)||!finHas(FINANCE_EVENTS,s.event.key)))throw Error('Invalid financial event.');
 if(s.collection!=null&&(!object(s.collection)||!count(s.collection.age)))throw Error('Invalid collection record.');
 if(s.modal!=null&&(!object(s.modal)||!['tax','notice','event','collection'].includes(s.modal.kind)))throw Error('Invalid financial dialog.');
 if(s.notices.some(n=>!object(n)||typeof n.title!=='string'||typeof n.text!=='string'))throw Error('Invalid financial notices.');
}
