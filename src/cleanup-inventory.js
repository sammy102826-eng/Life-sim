const MALL_RELEASES={
 home:[[1950,'Postwar bungalow','Single-family home',54000,2],[1960,'Split-level family home','Single-family home',84000,2],
  [1972,'Cedar A-frame','Cabin',128000,2],[1983,'Subdivision ranch','Single-family home',155000,2],[1995,'Brick townhouse','Townhouse',178000,2],
  [2004,'Warehouse loft','Condo',249000,2],[2013,'Passive solar cottage','Cottage',294000,2],[2021,'Net-zero modular home','Modern home',410000,3]],
 b:[[1950,'Aluminum outboard skiff',6200],[1960,'Fiberglass cabin cruiser',24500],[1973,'Offshore sport fisher',89000],
  [1986,'Cruising catamaran',165000],[1994,'Fiberglass fishing runabout',17200],[2003,'Performance motor yacht',940000],
  [2014,'Center-console offshore boat',112000],[2021,'Electric day cruiser',235000]],
 p:[[1950,'Piston training aircraft',42500],[1956,'Four-seat touring aircraft',119000],[1964,'Light business jet',940000],
  [1977,'Twin-engine turboprop',670000],[1986,'Pressurized piston twin',367000],[1997,'Long-range executive jet',6400000],
  [2007,'Very light jet',2350000],[2016,'Composite touring aircraft',435000],[2023,'Long-range composite turboprop',4890000]]
};
const mallHomeYears={'Smart home':2015,'Smart home villa':2015,'Eco-friendly modern home':2008};
for(const [year,n,type,price,tier] of MALL_RELEASES.home){
 STUFF_HOMES.push({year,n,type,price,tier});HOMES.push([n,price]);
}
for(const [key,list,years] of [['b',BOATS,[1950,1950,1960]],['p',PLANES,[1950,1964]]]){
 list.forEach((row,i)=>row[2]=years[i]);
 for(const [year,n,price] of MALL_RELEASES[key])list.push([n,price,year]);
}
delete MALL_DEPARTMENTS.Investments;
delete MALL_DEPARTMENTS.Licenses;
MALL_DEPARTMENTS.land='Land and islands';
const cleanupOriginalBuyVeh=buyVeh;
buyVeh=function(kind,index){
 const item=(kind==='b'?BOATS:kind==='p'?PLANES:[])[index];
 if(!item||eraYear()<item[2])return toast('That model is not available yet.');
 return cleanupOriginalBuyVeh(kind,index);
};
function homeSpecs(h){
 const type=[h.n,h.type].join(' '),tier=h.tier||2;
 const beds=h.beds??(/studio/i.test(type)?0:/apartment|condo|cottage|tiny/i.test(type)?tier>=3?2:1:tier===4?6:tier===3?4:3);
 return beds+' bedrooms · '+(h.baths??Math.max(1,Math.ceil(beds*.65)))+' bathrooms · '+parkingSpaces(h)+' parking spaces';
}
const cleanupOriginalQuote=stuffStartPurchase;
stuffStartPurchase=function(kind,index){
 if(kind==='home'&&eraYear()<(STUFF_HOMES[index]?.year??mallHomeYears[STUFF_HOMES[index]?.n]??2000))return toast('That property design is not available yet.');
 return cleanupOriginalQuote(kind,index);
};
function inventoryIllustrated(label,call,kind,value,disabled=false){
 return B(GameArt.svg(kind,value,'mini')+label,call,disabled).replace('class="b"','class="b illustrated-button"');
}
const OWNED_SECTIONS={car:['Cars','car'],home:['Homes','home'],lux:['Jewelry and collectibles','lux'],technology:['Technology','device'],
 boat:['Boats','boat'],plane:['Aircraft','plane'],artifact:['Personal artifacts','artifact'],land:['Land and islands','land']};
function cleanupOwned(kind){
 const back=B(kind?'Back to My stuff':'Back to Stuff',kind?"cleanupRoute('Stuff',['Owned'])":"mainTabOpen('Stuff')");
 if(!kind)return back+'<h2>My stuff</h2>'+Object.entries(OWNED_SECTIONS).map(([key,[label,art]])=>
  inventoryIllustrated(label+(key==='car'?'<small>'+parkingMessage()+'</small>':''),`cleanupRoute('Stuff',['Owned','${key}'])`,art,label)).join('');
 if(!Object.hasOwn(OWNED_SECTIONS,kind))return back;
 if(kind==='land'){
  const estate=genState(),rows=[[estate.land,'land'],[estate.islands,'island'],[estate.nations,'island']];
  return back+'<h2>Land and islands</h2>'+(rows.flatMap(([items,page])=>items.map(x=>
   inventoryIllustrated(uiEscape(x.name),heritageCall('genPropertyOpen',page,x.id),'land',x.name))).join('')||'<p>No land or islands owned.</p>');
 }
 if(kind==='artifact')return back+'<h2>Personal artifacts</h2>'+
  ((g.heritage?.artifacts||[]).filter(a=>a.place==='private').map(a=>heritageArtifactView(a,'private')).join('')||'<p>No personal artifacts yet.</p>');
 const data={car:stuffAllCars(),home:stuffAllHomes().filter(h=>h.own),lux:g.lux.filter(x=>x.assetType!=='technology'),
  technology:g.lux.filter(x=>x.assetType==='technology'),boat:g.boats,plane:g.planes};
 const page=OWNED_SECTIONS[kind];
 return back+'<h2>'+page[0]+'</h2>'+
  (kind==='car'?'<p>'+parkingMessage()+'</p>':'')+((data[kind]||[]).map(x=>
   inventoryIllustrated(uiEscape(x.n)+' <small>'+loc(x.v)+(kind==='home'?' · '+homeSpecs(x):'')+'</small>',
    heritageCall('stuffOpenItem',kind==='technology'?'lux':kind,x.id),page[1],x)).join('')||'<p>No items in this category yet.</p>');
}
const cleanupOldMall=eraMallView;
eraMallView=function(){
 const key=NV.S[1],back=B('Back to Mall',"cleanupRoute('Stuff',['Mall'])");
 if(!key)return B('Back to Stuff',"mainTabOpen('Stuff')")+'<h2>The Mall</h2><p>'+eraYear()+' · '+eraLabel(eraYear())+'</p>'+
  Object.entries(MALL_DEPARTMENTS).map(([k,label])=>inventoryIllustrated(label,`eraMallDepartment('${k}')`,
   ({land:'land',technology:'device',Jewelry:'lux',Property:'home',Vehicles:'boat',Pets:'pet'})[k]||'car',label)).join('');
 if(key==='Investments'||key==='Licenses')return back;
 if(key==='land'){
  if(genPropertyPage==='catalog')genPropertyPage='index';
  if(genPropertyPage!=='index')return genPropertyView();
  const holder=document.createElement('div');holder.innerHTML=genPropertyView();
  holder.firstElementChild?.remove();
  return back+holder.innerHTML;
 }
 if(key==='Vehicles')return back+vehicleDepartment();
 if(key==='Property')return back+homeDepartment();
 return cleanupOldMall();
};
function vehicleDepartment(){
 return [['b','Boats',BOATS,'boat'],['p','Aircraft',PLANES,'plane']].map(([k,label,list,art])=>
  '<h2>'+label+'</h2>'+(list.map(([name,price,year],i)=>({name,price,year,i})).filter(x=>eraYear()>=x.year).map(x=>
   inventoryIllustrated(uiEscape(x.name)+' <small>'+loc(pr(x.price)+finSalesTax('other',pr(x.price)))+' · Introduced '+x.year+'</small>',
    `buyVeh('${k}',${x.i})`,art,x.name)).join('')||'<p>No models are available in this year.</p>')).join('');
}
function homeDepartment(){
 const rows=STUFF_HOMES.map((x,i)=>({x,i,group:catalogGroup('home',x)})).filter(({x})=>eraYear()>=(x.year??mallHomeYears[x.n]??2000));
 const page=catalogSlice('mall-property',rows);
 return '<h2>Property office</h2>'+B('Browse rental homes','housingOpen()')+page.controls+page.items.map(({x,i})=>
  inventoryIllustrated(uiEscape(x.n)+' <small>'+loc(newsHomeQuote(i))+' · '+homeSpecs(x)+'</small>',`stuffBuyHome(${i})`,'home',x,g.age<18)).join('');
}
const cleanupOldStuff=stuffTop;
stuffTop=function(){
 if(g.jail||stuffSelected||stuffPurchaseOffer)return cleanupOldStuff();
 if(NV.S[0]==='Owned'){stuffEnsureIds();return cleanupOwned(NV.S[1]);}
 if(NV.S.length)return cleanupOldStuff();
 housingEnsure();
 return studioSection('Housing',g.home?GameArt.svg('home',g.home)+
  '<p>'+uiEscape(g.home.n)+' · '+homeSpecs(g.home)+'</p>'+B('Residence and rentals','housingOpen()'):
  GameArt.svg('home','Family home')+'<p>Living with family.</p>'+B('Residence and rentals','housingOpen()'))+
  inventoryIllustrated('The Mall','heritageStuff(\'Mall\')','mall','The Mall')+
  inventoryIllustrated('My stuff',"cleanupRoute('Stuff',['Owned'])",'inventory','My stuff')+stuffSettlementSummary();
};
const cleanupOwnedDetail=stuffItemDetail;
stuffItemDetail=function(kind,id){
 const h=kind==='housing'?g.home:kind==='home'?stuffAsset(kind,id):null;
 return cleanupOwnedDetail(kind,id)+(h?studioSection('Property details','<p>'+homeSpecs(h)+'</p>'):'');
};
const cleanupOriginalCatalog=catalogChoose;
catalogChoose=function(key,group,page=0){
 if(tab==='Stuff'){catalogSelection[key]={group,page};draw();return;}
 return cleanupOriginalCatalog(key,group,page);
};
