const GEN_CATEGORIES={investments:'Investments',vehicles:'Cars, boats and aircraft',homes:'Homes and land',
 business:'Businesses and professional practices',keepsakes:'Valuables, islands and souvenirs'};
const GEN_FUNERALS={memorial:['Family memorial',2400],burial:['Traditional burial',5800],cremation:['Cremation and remembrance',3200],green:['Natural burial',3900],private:['Private remembrance',750]};
function genIdentity(){
 return 'life-'+Array.from(crypto.getRandomValues(new Uint32Array(2)),x=>x.toString(36)).join('-');
}
const genClone=value=>value==null?value:JSON.parse(JSON.stringify(value));
function genState(life=g){
 return life.generations??={version:1,id:genIdentity(),number:1,will:null,settlement:null,lastAge:life.age,
  family:null,events:[],archive:[],serial:0,land:[],islands:[],nations:[],trips:[],trip:null};
}
const genEligible=life=>life.rel.filter(r=>r.alive&&!r.deceased&&['Spouse','Child','Sibling','Brother','Sister'].includes(r.role));
const genChild=life=>genEligible(life).filter(r=>r.role==='Child');
function genDefaultWill(life){
 const eligible=genEligible(life),preferred=eligible.filter(r=>r.role==='Child'||r.role==='Spouse');
 const ids=(preferred.length?preferred:eligible).map(x=>x.id);
 if(!ids.length)ids.push('charity');
 const weights=Object.fromEntries(ids.map((id,i)=>[id,Math.floor(100/ids.length)+(i<100%ids.length?1:0)]));
 return {weights,property:{},preferred:preferred.find(r=>r.role==='Child')?.id||null,funeral:'memorial'};
}
function genCurrentWill(life){
 const defaults=genDefaultWill(life),written=life.generations?.will;
 if(!written)return defaults;
 const legal=new Set(['charity',...genEligible(life).map(x=>x.id)]);
 const weights=Object.fromEntries(Object.entries(written.weights).filter(([id,n])=>legal.has(id)&&n>0));
 return {...written,weights:Object.keys(weights).length?weights:defaults.weights,
  property:Object.fromEntries(Object.entries(written.property).filter(([,id])=>legal.has(id))),
  preferred:written.preferred===null?null:legal.has(written.preferred)?written.preferred:defaults.preferred};
}
function genEnterpriseValue(key,value){
 if(key==='university')return uniValue(value);
 if(key==='vent')return Math.max(0,Math.round((VT[value.t]?.value(value)||0)*(value.own??100)/100));
 const cash=Math.max(0,value.cash||0);
 if(key==='studio')return Math.round(cash+(value.assets||[]).reduce((n,a)=>n+(a.book||0),0));
 if(key==='lawFirm')return Math.round(cash+pr(40000)*(value.offices?.length||1)-(value.debt||0));
 return Math.round(cash+(value.sites||[]).reduce((n,s)=>n+(s.equity||s.value||s.realEstate||pr(45000)),0)-(value.debt||0));
}
function genItems(life){
 const rows=[];
 const add=(category,key,value,worth,ref=value?.id)=>rows.push({category,key,ref,value,worth:Math.max(0,Math.round(worth||0))});
 for(const x of [life.car,...life.xc].filter(Boolean))add('vehicles','car',x,x.v);
 for(const key of ['boats','planes'])for(const x of life[key])add('vehicles',key,x,x.v);
 for(const x of [life.home,...life.xh].filter(x=>x?.own)){
  if(life.royalty?.houseId&&royalProtected(x.id))continue;
  add('homes','home',x,x.v);
 }
 for(const x of life.generations.land)add('homes','land',x,x.cost+(x.build?.paid||0));
 for(const x of life.lux)add('keepsakes','lux',x,x.v);
 for(const x of life.generations.islands)add('keepsakes','islands',x,x.value);
 for(const x of life.generations.nations)add('keepsakes','nations',x,x.value);
 for(const v of life.vent.filter(v=>!v.ceo))add('business','vent',v,genEnterpriseValue('vent',v),v.marketId||v.n);
 if(life.teacher?.campus?.owned)add('business','university',life.teacher.campus,genEnterpriseValue('university',life.teacher.campus),'university');
 for(const key of ['studio','lawFirm','practice']){
  if(life[key]?.status==='active')add('business',key,life[key],genEnterpriseValue(key,life[key]),key);
 }
 for(const [id,position] of Object.entries(life.financial?.positions||{})){
  const row=finInstrument(life.financial,id);
  if(row?.price)add('investments','position',{id,row,position},position.units*row.price,id);
 }
 for(const [id,amount] of Object.entries(life.inv||{}))if(amount>0)add('investments','investment',{id,amount},amount,id);
 for(const a of life.angels||[])add('investments','angel',a,a.a,a.n);
 rows.push(...heritageEstateItems(life));
 if(life.investigator?.agency)add('business','investigation',life.investigator.agency,piValue(life.investigator.agency),'investigation');
 return rows;
}
function genAllocate(total,weights){
 const keys=Object.entries(weights),sum=keys.reduce((n,[,v])=>n+v,0);
 let available=total,weight=sum;
 return keys.map(([id,n])=>{
  const share=weight?Math.floor(available*n/weight):0;
  available-=share;weight-=n;
  return {id,cash:share,items:[]};
 });
}
function genPlan(life=g){
 const s=genState(life),will=genCurrentWill(life),rel=genEligible(life),eligible=new Set(['charity',...rel.map(x=>x.id)]);
 if(life===g)stuffEnsureIds();
 const debt=(life.loans||[]).filter(l=>l.bal>0),items=genItems(life);
 const present=new Set(items.filter(x=>['home','car','boats','planes'].includes(x.key)).map(x=>x.ref));
 const unsecured=debt.filter(l=>!present.has(l.assetId||l.h)).reduce((n,l)=>n+l.bal,0)+
  Math.max(0,-life.cash)+(life.cc?.bal||0)+(life.sloan||0)+(life.financial?.arrears||0);
 for(const x of items){
  x.loans=present.has(x.ref)&&['home','car','boats','planes'].includes(x.key)?debt.filter(l=>(l.assetId||l.h)===x.ref):[];
  x.net=x.worth-x.loans.reduce((n,l)=>n+l.bal,0);
 }
 const fin=life.financial||{},deposits=life.bank.chk+life.bank.sav+(fin.high||0)+(fin.youth||0)+
  (fin.retirement?.traditional||0)+(fin.retirement?.roth||0)+(life.retirementPlan?.balance||0);
 const liquid=Math.max(0,Math.round(life.cash))+Math.round(deposits)+(life.casinoPlay?.round?.stake||0);
 const gross=liquid+items.reduce((n,x)=>n+x.worth,0);
 const allDebt=unsecured+items.reduce((n,x)=>n+x.worth-x.net,0);
 const funeral=GEN_FUNERALS[will.funeral]||GEN_FUNERALS.memorial,fee=Math.min(pr(funeral[1]),Math.max(0,gross-allDebt));
 const tax=finEstateTax(Math.max(0,gross-allDebt-fee),life.country);
 let reserve=liquid-unsecured-fee-tax;
 const disposed=[];
 let retained=items.filter(x=>{
  if(x.net<0){reserve+=x.net;disposed.push(x);return false;}
  return true;
 });
 if(reserve<0){
  const order=['investments','keepsakes','vehicles','homes','business'];
  const selling=retained.slice().sort((a,b)=>order.indexOf(a.category)-order.indexOf(b.category)||a.net-b.net);
  for(const x of selling){
   if(reserve>=0)break;
   reserve+=x.net;
   disposed.push(x);
  }
  retained=retained.filter(x=>!disposed.includes(x));
 }
 const recipients=genAllocate(Math.max(0,reserve),will.weights);
 const preferred=eligible.has(will.preferred)?will.preferred:null;
 const primary=preferred||recipients[0]?.id||'charity';
 for(const item of retained){
  const who=will.property[item.category]||primary;
  let record=recipients.find(x=>x.id===who);
  if(!record){record={id:who,cash:0,items:[]};recipients.push(record);}
  if(who==='charity')record.cash+=item.net;
  else record.items.push(genClone(item));
 }
 const summary=recipients.map(x=>({id:x.id,name:x.id==='charity'?'Charity':rel.find(r=>r.id===x.id).n,
  cash:x.cash,assets:x.items.length,value:x.items.reduce((n,i)=>n+i.net,0)}));
 return {age:life.age,country:life.country,gross,debt:allDebt,fee,tax,funeral:funeral[0],recipients,summary,
  sold:disposed.map(x=>x.value?.n||x.value?.name||x.value?.id||GEN_CATEGORIES[x.category]),shortfall:Math.max(0,-reserve)};
}
function genFinalEstate(){
 const s=genState();
 if(g.alive)return null;
 return s.settlement??=genPlan(g);
}
function genReimburse(person,bundle,originAge){
 if(!person||!bundle)return;
 const n=genProfile(person);
 n.savings+=bundle.cash;
 n.legacy.push(...genClone(bundle.items).map(item=>({...item,originAge})));
 person.m=n.savings;
}
function genApplyProperty(life,items,previousFinance){
 const s=genState(life),legacy=items||[];
 if(previousFinance&&(legacy.some(x=>['vent','position'].includes(x.key)))){
  life.financial=genClone(previousFinance);
  const fin=life.financial;
  Object.assign(fin,{positions:{},high:0,youth:0,retirement:{traditional:0,roth:0,rothBasis:0},tickets:{},notices:[],returns:[],arrears:0,activity:{},
   ledgerBase:{},estate:[],event:null,eventSeen:[],modal:null,collection:null,annual:null,lastAge:life.age,watch:{},credit:{mode:'minimum',missed:0,lastAge:null},dealAge:null});
 }
 for(const item of legacy){
  const value=genClone(item.value),key=item.key;
  if(key==='home'){
   if(!life.home&&(!value.tenancy||value.tenancy.status==='vacant'))life.home=value;
   else life.xh.push(value);
  }else if(key==='car'){if(!life.car)life.car=value;else life.xc.push(value);}
  else if(['boats','planes','lux','vent'].includes(key))life[key].push(value);
  else if(['land','islands','nations'].includes(key))s[key].push(value);
  else if(key==='investigation')piTransferEstate(life,value);
  else if(key==='artifact'||key==='museum')heritageInherit(life,key,value,item.net);
  else if(key==='university'){
   const t=teachState();
   if(!t.campus){
    t.campus=value;
    t.serial=Math.max(t.serial,...value.deals.map(d=>d.id),...value.programs.map(p=>Number(p.key.match(/^custom-(\d+)$/)?.[1])||0));
   }
   else life.cash+=Math.max(0,item.net);
  }else if(['studio','lawFirm','practice'].includes(key)){
   if(!life[key]){
    life[key]=value;
    if(key==='studio'){value.pending=null;value.notices=[];}
    if(key==='lawFirm')value.receipt=null;
   }else life.cash+=Math.max(0,item.net);
  }else if(key==='position'){
   const fin=life.financial||finInitMarket(finState(life)),row=value.row;
   const list=['stock','penny'].includes(row.kind)?fin.companies:fin.instruments;
   if(!list.some(x=>x.id===value.id))list.push(row);
   const position=fin.positions[value.id],cost=Math.round(value.position.units*row.price);
   fin.positions[value.id]={units:(position?.units||0)+value.position.units,basis:(position?.basis||0)+cost};
  }else if(key==='investment')life.inv[value.id]=(life.inv[value.id]||0)+value.amount;
  else if(key==='angel')life.angels.push(value);
  life.loans.push(...genClone(item.loans||[]));
 }
 if(life.car){life.ins.car=1;if(life.age>=18&&!life.lic.includes(DL))life.lic.push(DL);}
 if(life.home?.own||life.xh.length)life.ins.home=1;
}
function genChildRoles(old,child){
 const profile=genProfile(child),other=old.rel.find(x=>x.alive&&x.role==='Spouse');
 const descendants=old.rel.filter(x=>x.genParents?.includes(child.id));
 const direct=new Set(descendants.map(x=>x.id)),parents=new Set(child.genParents||[]);
 const known=old.rel.filter(x=>x.id!==child.id&&(x.t==='fam'||x.id===profile.partner||parents.has(x.id)));
 const player={id:genState(old).id,n:old.name,age:old.age,alive:false,deceased:true,deathAt:child.age,
  deathAge:old.age,deathCause:old.cause||'life ended',bond:child.bond,t:'fam',role:'Parent',m:0};
 const out=[player];
 for(const rel of known){
  const r=genClone(rel);
  if(direct.has(r.id))r.role='Child';
  else if(r.id===profile.partner)r.role='Spouse';
  else if(r.id===other?.id||parents.has(r.id))r.role='Parent';
  else if(r.role==='Child')r.role='Sibling';
  else if(['Mother','Father','Parent'].includes(r.role))r.role='Grandparent';
  else if(['Sibling','Step-sibling','Brother','Sister'].includes(r.role))r.role='Relative';
  else if(r.role==='Grandchild')r.role='Niece';
  else if(!['Pet','Grandmother','Grandfather','Grandparent'].includes(r.role))r.role='Relative';
  if(r.role!=='Pet')r.t='fam';
  if(r.deathAt!=null)r.deathAt=Math.max(0,child.age-(old.age-r.deathAt));
  if(r.genLife?.lastAge!=null)r.genLife.lastAge=null;
  if(r.connection){
   r.connection.last=Math.max(0,child.age-(old.age-r.connection.last));
   if(r.connection.requested!=null)r.connection.requested=null;
   delete r.connection.attempt;
  }
  if(r.sharedMemories)r.sharedMemories=r.sharedMemories.map(m=>({...m,age:Math.max(0,child.age-(old.age-m.age))}));
  delete r.historyState;
  delete r.contactSync;
  if(!out.some(x=>x.id===r.id))out.push(r);
 }
 return out;
}
function genRebaseAsset(life,item,age,passedAge){
 const diff=age-passedAge;
 const move=(object,keys)=>{for(const key of keys)if(Number.isFinite(object[key]))object[key]=Math.max(0,object[key]+diff);};
 if(item.key==='university'&&life.teacher?.campus){
  const c=life.teacher.campus;
  c.lastAge=age;c.ownerBasis=item.net;
  move(c,['reliefUntil','groupSuspendedUntil']);
  if(c.pending)move(c.pending,['due']);
  for(const d of c.deals)move(d,['age']);
 }else if(item.key==='studio'){
  move(life.studio,['age','opened','lastAge']);
  for(const project of life.studio.projects){
   move(project,['created','releaseAge','targetAge','releasedAge','last']);
   for(const license of project.licenses)move(license,['first','until']);
  }
  for(const offer of life.studio.offers)move(offer,['expires']);
 }else if(item.key==='practice'){
  move(life.practice,['year','opened','lastAge','startAge','lastAnnual']);
  for(const c of life.practice.claims)move(c,['due']);
  for(const visit of life.practice.visits)move(visit,['year','age','due']);
  if(life.practice.year>age)life.practice.year=age;
 }else if(item.key==='lawFirm'){
  move(life.lawFirm,['startAge','lastAge','closedAge']);
 }else if(item.key==='home'){
  const home=[life.home,...life.xh].find(x=>x?.id===item.value.id);
  if(home?.tenancy)move(home.tenancy,['startAge','paidAge','listedAge','endAge','noticeAge']);
  if(home)move(home,['cleaningAge','maintenanceAge','renovationAge']);
 }else if(item.key==='car'){
  const car=[life.car,...life.xc].find(x=>x?.id===item.value.id);
  if(car)move(car,['cleaningAge','maintenanceAge','lastMajorServiceAge']);
 }else if(item.key==='land'){
  const lot=life.generations.land.find(x=>x.id===item.value.id);
  if(lot?.build)move(lot.build,['due']);
 }else if(['islands','nations'].includes(item.key)){
  const island=life.generations[item.key].find(x=>x.id===item.value.id);
  if(island){
   island.age=age;island.used={};
   for(const p of island.projects)move(p,['due']);
  }
 }else if(item.key==='vent'&&item.value.t==='cas'){
  const v=life.vent.find(x=>x.t==='cas'&&x.casino?.id===item.value.casino?.id);
  if(v)casinoRebase(v,age,passedAge);
 }else if(item.key==='vent'&&item.value.biz){
  const v=life.vent.find(x=>x.marketId===item.value.marketId);
  const s=v.biz;
  s.lastAge=age;s.used={};s.offer=null;
  for(const event of s.events)event.closed=true;
  if(s.escrow){
   s.cash+=s.escrow.price;
   s.ledger['Inherited escrow refund']=(s.ledger['Inherited escrow refund']||0)+s.escrow.price;
   s.escrow=null;
  }
 }
}
function genContinue(id){
 const old=g,s=genState(old),child=genChild(old).find(r=>r.id===id);
 if(!child||old.alive)return false;
 const estate=genFinalEstate(),bundle=estate.recipients.find(r=>r.id===id),own=genProfile(child);
 const next=newLife(false);
 next.name=child.n;next.age=child.age;next.birthYear=eraYear(old)-child.age;next.birth=child.genBirth||old.country;next.country=child.genCountry||old.country;
 next.w=genClone(old.w);next.wars=genClone(old.wars);next.nat=next.w[next.country].n;
 next.city=child.genCity||old.city;next.bcity=next.city;
 next.cash=own.savings+(bundle?.cash||0);next.edu=next.age>=18?Math.max(1,own.degree):0;
 next.job=next.age>=18?genClone(own.job):null;next.exp=next.job?{[next.job.f]:own.years}:{};
 next.rel=genChildRoles(old,child);
 next.log=[];next.alive=true;next.event=null;
 next.generations={version:1,id:child.id,number:s.number+1,will:null,settlement:null,lastAge:next.age,family:null,
  events:[],archive:[...s.archive,{name:old.name,age:old.age,funeral:estate.funeral,tax:estate.tax}].slice(-30),serial:0,
  land:[],islands:[],nations:[],trips:[],trip:null};
 for(const r of next.rel)genReimburse(r,estate.recipients.find(x=>x.id===r.id),estate.age);
 dflt(next);
 next.cit=[next.birth,next.country].filter((v,i,a)=>a.indexOf(v)===i);
 if(next.age>=18)next.bank.id=old.bank.id??0;
 next.msInit=1;
 g=next;naturalTalent(g);
 const items=[...genClone(own.assets),...genClone(own.legacy),...(bundle?.items||[])];
 genApplyProperty(next,items,old.financial);
 for(const item of items)genRebaseAsset(next,item,next.age,item.originAge??old.age);
 if(next.financial){
  const fin=next.financial;
  for(const row of fin.companies){row.quoteAge=next.age;row.openingQuote=row.price;row.change=0;}
  for(const bond of fin.instruments.filter(x=>x.kind==='bond'))bond.matures=next.age+Math.max(1,bond.matures-old.age);
 }
 genFamilyInit();
 royalApplyHeir(old,child);
 tab='Life';sel=null;wsel=null;wsub=null;NV.O=[];NV.S=[];
 newsPopupOpen=false;newsEditionAge=null;newsSection='all';
 L('Generation '+next.generations.number+' begins. You are '+uiEscape(next.name)+', age '+next.age+'.');
 if(bundle)L('The estate passed '+loc(bundle.cash)+' and '+bundle.items.length+' asset'+(bundle.items.length===1?'':'s')+' to you after settlement.');
 if(own.savings||own.job)L('Your existing savings'+(own.job?' and work as '+uiEscape(own.job.t):'')+' carry forward.');
 if(estate.gross>=pr(15000000)||old.fm>=35)genEvent('update','A public estate passes to the next generation',
  old.name+'’s estate was settled. The family can decide what to share about the transition.',{},'community');
 newsBuildYear();
 go('game');
 return true;
}
