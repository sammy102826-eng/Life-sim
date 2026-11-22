function eraYear(life=g){
 return (life.birthYear??(ERA_PRESENT-life.age))+life.age;
}
const eraLabel=year=>year<1970?'Before the 1970s':year>=2030?'2020s onward':Math.floor(year/10)*10+'s';
const ERA_SOCIAL={fb:2004,tw:2006,ig:2010,tt:2017};
const eraPlatform=k=>Object.hasOwn(ERA_SOCIAL,k)&&eraYear()>=ERA_SOCIAL[k];
function eraBirthOptions(){
 return studioSelect('birth-era','Birth year',[[ERA_PRESENT,ERA_PRESENT+' · Present day'],...ERA_BIRTH_YEARS.map(y=>[y,y+(y<1970?' · Reach adulthood in the '+eraLabel(y+18):' · '+eraLabel(y))])]);
}
for(const [year,n,type,price] of ERA_CLASSIC_CARS){
 STUFF_CARS.push({n,type,price,tier:price<12000?1:price<35000?2:3,year});
 CARS.push([n,price]);
}
const eraCarYear=car=>car.year??ERA_CAR_YEARS[car.n]??2000;
const eraCarAvailable=car=>!!car&&eraCarYear(car)<=eraYear();
function parkingSpaces(home){
 if(!home)return 0;
 const type=((home.type||'')+' '+(home.n||'')).toLowerCase();
 const base=/estate|mansion|villa|penthouse/.test(type)?4:/apartment|studio|condo|tiny|\broom\b/.test(type)?1:home.tier>=3?3:2;
 return base+(home.parkingAdded||0);
}
function parkingCapacity(){
 const available=stuffAllHomes().filter(h=>h===g.home||h.own&&!h.rented&&(!h.tenancy||h.tenancy.status==='vacant'));
 return Math.max(1,available.reduce((n,h)=>n+parkingSpaces(h),0));
}
const parkingRoom=()=>stuffAllCars().length<parkingCapacity();
function parkingMessage(){
 const cars=stuffAllCars().length,spaces=parkingCapacity();
 return cars+(cars===1?' car':' cars')+' · '+spaces+(spaces===1?' parking space':' parking spaces')+
  (cars>spaces?' · Existing cars are kept in overflow.':'');
}
function homeItems(home){
 return [
  ...g.lux.map(x=>({kind:'lux',item:x,home:x.showHome})),
  ...(g.heritage?.artifacts||[]).filter(x=>x.place==='private').map(x=>({kind:'artifact',item:x,home:x.display}))
 ].filter(x=>x.home===home.id);
}
const homeDisplayLimit=h=>(h.tier||1)*3+2;
function homeCustomize(home,action,kind,id){
 if(!g.alive||g.jail||g.age<16||!home||home!==g.home&&!home.own||
  home!==g.home&&(home.rented||home.tenancy?.status&&home.tenancy.status!=='vacant'))return 'This home is unavailable for customization.';
 if(action==='parking'){
  if(g.age<18||!home.own||royalProtected(home.id)||home.parkingAdded>=4)return 'Only an eligible owned home can add parking.';
  const cost=pr(6200+1900*(home.parkingAdded||0));
  if(!heritagePay('Additional parking',g,cost))return 'You need '+loc(cost)+' to add a space.';
  home.parkingAdded=(home.parkingAdded||0)+1;
  home.v+=Math.round(cost*.45);
 }else if(action==='style'){
  const styles=['Original','Traditional','Minimalist','Gallery','Retro','Eclectic'];
  if(!styles.includes(kind)||home.decor===kind)return 'Choose a different interior style.';
  const cost=pr((home.tier||1)*360);
  if(!heritagePay('Interior decoration',g,cost))return 'You need '+loc(cost)+' to redecorate.';
  home.decor=kind;
  g.happy=cl(g.happy+2);
 }else if(['display','store'].includes(action)){
  const item=kind==='lux'?g.lux.find(x=>x.id===id):kind==='artifact'?g.heritage?.artifacts.find(x=>x.id===Number(id)&&x.place==='private'):null;
  if(!item)return 'That item is not in your inventory.';
  const key=kind==='lux'?'showHome':'display';
  if(action==='display'){
   if(item[key]===home.id)return 'This item is already on display here.';
   if(homeItems(home).length>=homeDisplayLimit(home))return 'This home has no free display space.';
   if(kind==='lux')item.secured=false;
   item[key]=home.id;
  }else if(item[key]===home.id)item[key]=null;
 }else return 'This home action is unavailable.';
 return '';
}
function homeDisplayTheft(ids,reported){
 const eligible=ids.flatMap(id=>{
  const h=stuffAsset('home',id);
  return h?homeItems(h).map(row=>({...row,security:h.securityLevel||0})):[];
 });
 if(!eligible.length)return;
 eligible.sort((a,b)=>a.security-b.security);
 const {item,kind,security}=eligible[0];
 if(ch(Math.min(90,(reported?32:14)+security*15))){
  L('The police recovered '+uiEscape(item.name||item.n)+' after the break-in.');
  return;
 }
 if(kind==='lux')stuffRemove('lux',item.id);
 else {item.place='stolen';item.display=null;}
 const label=item.name||item.n;
 L(uiEscape(label)+' was stolen from a home display.');
 heritagePress('A displayed collectible is taken in a break-in','Police listed '+label+' as missing.');
}
const MALL_DEPARTMENTS={used:'Used car lot',new:'New car showroom',luxury:'Luxury car dealer',technology:'Technology store',
 Jewelry:'Jewelry and collectibles',Vehicles:'Boats and aircraft',Pets:'Pet adoption centre',Property:'Property office',Licenses:'Licenses and permits',Investments:'Investment desk'};
function eraMallDepartment(key){
 if(!g.alive||g.jail||!Object.hasOwn(MALL_DEPARTMENTS,key))return;
 NV.S=['Mall',key];stuffSelected=null;stuffPurchaseOffer=null;draw(1);
}
function eraTechBuy(index){
 const row=ERA_TECH[index];
 if(!row||!g.alive||g.jail||g.age<10||row[0]>eraYear())return toast('This technology is unavailable for your age or year.');
 const [introduced,n,base]=row;
 if(g.lux.some(x=>x.itemKey==='tech-'+introduced+'-'+index))return toast('You already own this product.');
 const price=pr(base),tax=finSalesTax('other',price);
 if(g.cash<price+tax)return toast('You need '+loc(price+tax)+' for this purchase.');
 heritagePay('Technology purchase',g,price);
 g.cash-=tax;
 finSalesPaid(tax);
 g.lux.push({id:uid(),n,v:price,purchasePrice:price,assetType:'technology',itemKey:'tech-'+introduced+'-'+index,introduced});
 A({p:2},'You bought a '+n.toLowerCase()+'.');
}
function eraCarShop(dealer){
 const year=eraYear();
 const rows=STUFF_CARS.map((car,index)=>({car,index,group:catalogGroup('car',car)})).filter(({car})=>{
  if(!eraCarAvailable(car))return false;
  if(!dealer)return year<2020||!car.year;
  const luxury=car.price>=46000||/luxury|sports|supercar/.test(car.type.toLowerCase());
  const used=/used/i.test(car.type)||car.year!=null&&year-car.year>=8;
  return dealer==='used'?used:dealer==='luxury'?luxury&&!used:!used&&!luxury;
 });
 const page=catalogSlice(dealer?'mall-'+dealer:'era-car',rows);
 return '<div class="card"><p>'+parkingMessage()+'. A driver’s license is required.</p></div>'+
  (rows.length?page.controls+page.items.map(({car,index,group})=>{
   const listed=dealer==='used'&&car.year?Math.round(car.price*.65):car.price;
   return `<details class="card"><summary>${uiEscape(car.n)} · ${loc(pr(listed))}</summary><p>${uiEscape(group)} · ${uiEscape(car.type)}</p>
    ${B('Purchase options',`eraCarQuote(${index},'${dealer||''}')`,g.age<16||!g.lic.includes(DL)||!parkingRoom())}</details>`;
  }).join(''):'<p>No models in this department are available in '+year+'.</p>');
}
function eraCarQuote(index,dealer){
 const car=STUFF_CARS[index];
 if(!eraCarAvailable(car))return toast('This model is not available in this year.');
 const prior=stuffPurchaseOffer;
 stuffStartPurchase('car',index);
 if(dealer==='used'&&car.year&&eraYear()-car.year>=8&&stuffPurchaseOffer!==prior&&stuffPurchaseOffer?.i===index){
  stuffPurchaseOffer.price=pr(Math.round(car.price*.65));
  draw(1);
 }
}
function eraMallView(){
 const key=NV.S[1],year=eraYear();
 const back=B(key?'Back to Mall':'Back to Stuff',key?"NV.S=['Mall'];draw(1)":"mainTabOpen('Stuff')");
 if(!key)return back+`<div class="card"><h2>The Mall</h2><p>${year} · ${eraLabel(year)}</p></div>`+
  Object.entries(MALL_DEPARTMENTS).map(([k,name])=>B(name,`eraMallDepartment('${k}')`)).join('');
 const heading=back+`<h2>${MALL_DEPARTMENTS[key]||'The Mall'}</h2>`;
 if(['used','new','luxury'].includes(key))return heading+eraCarShop(key);
 if(key==='technology'){
  const current=ERA_TECH.map((x,i)=>({x,i,group:eraLabel(x[0])})).filter(({x})=>x[0]<=year).reverse();
  if(!current.length)return heading+'<p>No devices are available in this year.</p>';
  const p=catalogSlice('era-tech',current);
  return heading+p.controls+p.items.map(({x:[introduced,n,base],i})=>{
   const price=pr(base)+finSalesTax('other',pr(base));
   return B(n+' <small>Introduced '+introduced+' · '+loc(price)+'</small>',`eraTechBuy(${i})`,g.age<10||g.cash<price);
  }).join('');
 }
 if(key==='Investments')return heading+finShoppingInvestments();
 if(key==='Licenses')return heading+stuffLicenseView();
 return heading+eraUseShop(key);
}
function eraUseShop(key){
 const current=stuffShopTab;
 try{stuffShopTab=key;return stuffShopView();}
 finally{stuffShopTab=current;}
}
