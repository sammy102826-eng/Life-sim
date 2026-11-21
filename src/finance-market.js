const finHas=(data,key)=>Object.hasOwn(data,key);
const finFind=(list,id)=>list.find(x=>x.id===id);
const finSafe=x=>Number.isSafeInteger(x)&&x>=0;
const finInt=x=>Math.round(x);
function finState(life=g){
 return life.financial??={version:1,seed:[...life.name+'|'+life.birth+'|finance'].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261),
   serial:0,lastAge:null,companies:[],instruments:[],positions:{},high:0,youth:0,retirement:{traditional:0,roth:0,rothBasis:0},
   tickets:{},pots:{},notices:[],returns:[],arrears:0,activity:{},ledgerBase:{},estate:[],credit:{mode:'minimum',missed:0,lastAge:null},
   collection:null,event:null,eventSeen:[],enabled:false,annual:null};
}
function finRand(s,l,h){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return l+Math.floor(s.seed/4294967296*(h-l+1));}
function finCountry(country){
 const profile=FINANCE_TAX[country],region=FINANCE_REGIONAL[country];
 if(profile)return profile;
 if(!region)return FINANCE_TAX_DEFAULT;
 const [allow,car,home,jewelry,estate,estateFree,gains,lottery]=region;
 return {...FINANCE_TAX_DEFAULT,allow,car,home,jewelry,other:car,estate,estateFree,gains,lottery};
}
function finQuote(price){
 const x=ST.cur==='usd'?['$',1]:cxo();
 return x[0]+(price*x[1]).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
}
function finAdd(key,amount){
 if(!Number.isFinite(amount)||!amount)return;
 const bucket=finState().activity;
 bucket[key]=(bucket[key]||0)+finInt(amount);
}
function finInitMarket(s=finState()){
 if(s.companies.length)return s;
 s.companies=FINANCE_COMPANIES.map(([id,name,sector,price,vol,listed])=>({id,name,sector,vol,public:listed,penny:price>0&&price<5,
   price:price?Math.max(.05,Math.round(price*100)/100):null,change:0,revenue:finRand(s,18,130)*1000000,earnings:finRand(s,2,19)*1000000,patents:0,linked:false}));
 s.instruments=[
  ...Object.entries(FINANCE_FUND_DEFS).map(([id,row])=>({id,name:row[0],kind:'fund',price:50,change:0})),
  ...Object.entries(FINANCE_COIN_DEFS).map(([id,row])=>({id,name:row[0],kind:'crypto',price:row[1],change:0,vol:row[2]})),
  ...Object.entries(FINANCE_BOND_DEFS).map(([id,row])=>({id,name:row[0],kind:'bond',price:100,change:0,issuer:row[1],coupon:row[2],term:row[3],matures:g.age+row[3]}))
 ];
 return s;
}
const finRoundPrice=n=>Math.max(.01,Math.round(n*100)/100);
function finCompanyQuote(s,v,reason){
 if(!v||v.t!=='co')return null;
 if(!v.marketId)v.marketId='V'+(++s.serial);
 let c=finFind(s.companies,v.marketId);
 if(!c){c={id:v.marketId,name:v.n,sector:v.kind==='corp'?'technology':'services',vol:22,public:false,penny:false,price:null,change:0,
  revenue:v.rev,earnings:0,patents:0,linked:true,shares:v.sh||1000000};s.companies.push(c);}
 const was=c.public,previous=c.price,oldShares=c.shares;
 c.name=v.n;c.linked=true;c.revenue=v.rev;
 c.earnings=v.biz?v.biz.reports[0]?.profit||0:v.rev-v.emp*pr(65000)-v.prod*pr(120000);
 if(v.biz)c.sector=bizIndustry(v).sector;
 c.patents=v.biz?v.patents||0:Math.max(c.patents||0,v.patents||0);
 c.public=!!v.pub;
 c.shares=v.sh||1000000;
 if(c.public){
   const split=was&&oldShares&&c.shares===oldShares*2;
   c.price=finRoundPrice(Math.max(1,v.val)/c.shares);
   if(!was||c.quoteAge!==g.age){c.quoteAge=g.age;c.openingQuote=previous||c.price;}
   if(split){
     c.openingQuote/=2;
     if(s.positions[c.id])s.positions[c.id].units*=2;
   }
   c.change=Math.round((c.price/c.openingQuote-1)*100);
   if(!was)finHeadline('IPO: '+c.name,c.name+' is now listed at '+finQuote(c.price)+' per share.',c.id,'ipo-'+c.id+'-'+g.age);
 }else if(was){
   if(s.positions[c.id])finClosePosition(s,c.id,previous,'Company delisting');
   c.price=null;c.change=0;
   finHeadline(c.name+' leaves the exchange','Trading closed. Existing market positions were paid at the final quote.',c.id,'delist-'+c.id+'-'+g.age);
 }
 if(reason==='research'&&c.public){
   finHeadline(c.name+' announces a patent',c.name+' reported a research milestone. The updated quote reflects the company’s outlook.',c.id,'patent-'+c.id+'-'+c.patents);
 }
 return c;
}
function finSyncCompanies(s=finInitMarket()){
 const linked=new Set();
 for(const v of g.vent.filter(x=>x.t==='co')){
  const row=finCompanyQuote(s,v);
  if(row)linked.add(row.id);
 }
 for(const c of s.companies)if(c.linked&&!linked.has(c.id))c.linked=false;
 return s;
}
function finHeadline(title,text,id,key=null){
 return newsPublish('business',title,text,{type:'financeMarket',ref:id},key);
}
function finInstrument(s,id){
 const c=finFind(s.companies,id);
 return c?{...c,kind:c.penny?'penny':'stock'}:finFind(s.instruments,id);
}
function finPositionValue(s,id){
 const p=s.positions[id],row=finInstrument(s,id);
 return p&&row?.price?finInt(p.units*row.price):0;
}
function finClosePosition(s,id,price,label){
 const p=s.positions[id];
 if(!p)return 0;
 const value=finInt(p.units*(price||0));
 delete s.positions[id];
 g.cash+=value;
 finAdd('gains',value-p.basis);
 LD(label,value);
 return value;
}
function finTrade(id,units,sell=false){
 const s=finSyncCompanies(),row=finInstrument(s,id),p=s.positions[id];
 if(!row?.price||g.age<18||g.jail||!finSafe(units)||units<1||units>100000000)return 'Choose a valid quantity and tradable instrument.';
 if(!sell&&['stock','penny'].includes(row.kind)&&!row.public)return 'Only public companies can be bought on the market.';
 const value=Math.max(1,finInt(units*row.price));
 if(sell){
  if(!p||p.units<units)return 'You do not hold that many units.';
  const basis=units===p.units?p.basis:finInt(p.basis*units/p.units);
  p.units-=units;p.basis-=basis;
  if(!p.units)delete s.positions[id];
  g.cash+=value;finAdd('gains',value-basis);
  return 'Sold '+units.toLocaleString()+' for '+loc(value)+'.';
 }
 if(g.cash<value)return 'You do not have enough personal cash.';
 g.cash-=value;
 s.positions[id]={units:(p?.units||0)+units,basis:(p?.basis||0)+value};
 return 'Bought '+units.toLocaleString()+' for '+loc(value)+'.';
}
function finMarketYear(s){
 if(g.age<16&&!s.companies.length)return;
 finSyncCompanies(s);
 const changes={};
 const rivals={};
 for(const venture of g.vent.filter(x=>x.biz)){
  const industry=bizIndustry(venture);
  rivals[industry.sector]=(rivals[industry.sector]||0)+Math.min(11,(venture.patents||0)*1.1+venture.rev/2500000);
 }
 for(const c of s.companies){
  if(c.linked||c.bizStatus){changes[c.id]=c.change||0;continue;}
  const sector=g.eco[c.sector]||50;
  const earningsGrowth=(sector-50)*.26+finRand(s,-18,24)-(rivals[c.sector]||0);
  const patent=(c.sector==='technology'||c.sector==='energy')&&finRand(s,1,100)<=13;
  c.revenue=Math.max(500000,finInt(c.revenue*(1+earningsGrowth/100)));
  c.earnings=finInt(c.revenue*(.09+earningsGrowth/280));
  if(patent){
   c.patents++;
   const prototypes=['Materials process','Control system','Cooling system','Quality monitor'];
   (c.patentNames??=[]).push(c.name+' '+prototypes[(c.patents-1)%prototypes.length]+' '+c.patents);
   c.patentNames=c.patentNames.slice(-8);
  }
  if(!c.public){
   if(c.id==='MCU')continue;
   if(c.earnings>24000000&&finRand(s,1,100)<=24){
    c.public=true;c.price=finRoundPrice(c.earnings/2200000);c.change=0;
    finHeadline('IPO: '+c.name,c.name+' joined the exchange after reporting stronger earnings.',c.id,'npc-ipo-'+c.id);
   }
   continue;
  }
  const old=c.price,n=Math.min(c.vol,55);
  const move=Math.min(130,Math.max(-77,earningsGrowth*.71+finRand(s,-n,n)+(patent?17:0)));
  c.price=finRoundPrice(old*(1+move/100));c.change=Math.round((c.price/old-1)*100);
  changes[c.id]=c.change;
  if(patent&&c.change>=12)finHeadline(c.name+' reports a technology patent',c.name+' reported stronger growth and a patent milestone.',c.id,'npc-patent-'+c.id+'-'+c.patents);
  else if(earningsGrowth>=22&&c.change>=12){
   const industry=BUSINESS_INDUSTRIES[bizSectorIndustry(c.sector)];
   c.latestProduct=industry.types[(c.patents+(g.age%2))%industry.types.length][0];
   finHeadline(c.name+' reports a strong product launch',c.name+' attributed higher sales to its new '+c.latestProduct.toLowerCase()+'.',c.id,'npc-launch-'+c.id+'-'+g.age);
  }
 }
 for(const row of s.instruments){
  const old=row.price;
  if(row.kind==='fund'){
   const def=FINANCE_FUND_DEFS[row.id],move=def[1].reduce((v,id,i)=>v+(changes[id]||0)*def[2][i],0)-def[3];
   row.price=finRoundPrice(old*(1+move/100));
  }else if(row.kind==='crypto'){
   const move=Math.max(-84,finRand(s,-row.vol,row.vol+15));
   row.price=finRoundPrice(old*(1+move/100));
  }else if(row.kind==='bond'){
   const held=s.positions[row.id];
   if(held){
    const paid=finInt(held.units*row.coupon);
    finBankDeposit(paid);LD('Bond interest',paid);
   }
   if(g.age>=row.matures){
    if(held){const value=held.units*100;finBankDeposit(value);finAdd('gains',value-held.basis);delete s.positions[row.id];LD('Bond principal redeemed',value);}
    row.matures=g.age+row.term;
   }
   const issuer=finFind(s.companies,row.issuer);
   row.price=finRoundPrice(100+finRand(s,-4,4)+(issuer?Math.round((issuer.change||0)*.10):0));
  }
  row.change=Math.round((row.price/old-1)*100);
 }
 const biggest=s.companies.filter(c=>c.public&&!c.linked).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change))[0];
 if(biggest&&Math.abs(biggest.change)>=23)finHeadline('Market movers: '+biggest.name,
  biggest.name+' moved '+(biggest.change>0?'+':'')+biggest.change+'% after its annual earnings report.',biggest.id,'move-'+g.age);
}
