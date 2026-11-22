const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let browser,server,base;
before(async()=>{
  server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(error,data)=>{
      if(error)return res.writeHead(404).end();
      res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
      res.end(data);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
});
after(async()=>{
  await browser?.close();
  if(server)await new Promise(r=>server.close(r));
});
async function setup(t){
  const page=await browser.newPage({viewport:{width:340,height:760}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  t.after(async()=>{await page.close();assert.deepEqual(errors,[]);});
  await page.addInitScript(()=>{
    let n=121;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  });
  await page.goto(base+'/Life%20sim%20relationships%20.html');
  await page.getByRole('button',{name:'Create your own life',exact:true}).click();
  await page.getByRole('button',{name:'Be born',exact:true}).click();
  await page.getByRole('button',{name:'Begin your life',exact:true}).click();
  await page.evaluate(()=>{
    Object.assign(g,{age:34,cash:15000000,event:null,result:null,ysum:null,eduPopup:null,hsPopup:null,hsQueue:[],msq:[],
      country:'United States',city:'Chicago',office:-1,royalty:null,job:null,rec:0,jail:0,cred:730,evq:0,vent:[],loans:[]});
    g.nat=g.w[g.country].n;
    ST.sum=false;ST.cur='usd';msCheck(true);tab='Life';draw(1);
  });
  return page;
}


async function quiet(page){
 const button=page.getByRole('button',{name:'Nice!',exact:true});
 for(let i=0;i<35&&await button.isVisible();i++)await button.click();
}


test('a field team surveys and documents a discovery before receiving an independent permit',async t=>{
 const p=await setup(t);await quiet(p);
 await p.evaluate(()=>{relocate('Italy');tab='Life';draw(1);});
 await p.getByRole('button',{name:'Work',exact:true}).click();
 await p.getByRole('button',{name:'Special careers',exact:true}).click();
 await p.getByRole('button',{name:/^Archaeologist Survey/}).click();
 await p.getByRole('button',{name:'Join the field team',exact:true}).click();
 const dig=p.getByRole('button',{name:/^Dig · Surface/});
 assert.equal(await dig.isEnabled(),false);
 await p.getByRole('button',{name:/^Explore · survey/}).click();
 await dig.click();
 await p.getByRole('button',{name:'Analyze material and manage artifacts',exact:true}).click();
 const artifact=await p.evaluate(()=>g.heritage.artifacts[0].name);
 await p.getByText(artifact,{exact:true}).click();
 await p.getByRole('button',{name:'Map stratigraphy',exact:true}).click();
 await p.getByText(artifact,{exact:true}).click();
 await p.getByRole('button',{name:'Scientific test · chemical analysis',exact:true}).click();
 const state=await p.evaluate(()=>{
  const s=heritageState(),first=s.artifacts[0],early=heritageAcquireSite();
  const blocked=heritageMove(first,'private');
  heritageMove(first,'donated');
  for(let i=0;i<3;i++){g.age++;heritageYear();}
  const bought=heritageAcquireSite();
  heritageField('survey');heritageField('dig',0);
  const next=s.artifacts.at(-1);
  heritageLab(next,'map');heritageLab(next,'chemical');
  const kept=heritageMove(next,'private');
  return {early,blocked,bought,kept,job:g.job.t,years:s.career.years,first:first.place,next:next.place,saved:SaveStore.save(0,'life')};
 });
 assert.match(state.early,/three field years/);
 assert.match(state.blocked,/requires.*public institution/);
 assert.deepEqual({...state,early:null,blocked:null},{early:null,blocked:null,bought:'',kept:'',job:'Site director',years:3,first:'donated',next:'private',saved:true});
});

test('museum funds cover acquisitions, staff, school visits and annual operations',async t=>{
 const p=await setup(t);await quiet(p);
 await p.getByRole('button',{name:'Stuff',exact:true}).click();
 await p.getByRole('button',{name:'Open your own museum',exact:true}).click();
 await p.getByLabel('Museum name',{exact:true}).fill('River Terrace Museum');
 await p.getByRole('button',{name:'Open museum',exact:true}).click();
 const result=await p.evaluate(()=>{
  const s=heritageState(),m=s.museum,initial=m.cash,personal=g.cash;
  const office=heritageMuseumAction('staff','guide',1);
  const book=heritageMuseumAction('trips');
  const buy=heritageMuseumAction('buy',null,'pottery'),item=museumItems(s)[0];
  const clean=heritageMuseumAction('clean',item.id);
  const swap=heritageMuseumAction('trade',item.id,'seal');
  const fundsUsed=m.cash<initial,personalUnchanged=g.cash===personal;
  heritageMuseumAction('fund',null,pr(95000));heritageMuseumAction('wing','study');
  heritageMuseumAction('fee',null,0);
  g.age++;heritageYear();
  const once=m.cash;heritageYear();
  return {office,book,buy,clean,swap,fundsUsed,personalUnchanged,slots:museumSlots(m),visitor:m.last.visitors,
   receipts:m.last.admissions,expenses:m.last.expenses,once:m.cash===once,old:item.place,collection:museumItems(s)[0].key,
   saved:SaveStore.save(0,'life')&&SaveStore.read(0).data.heritage.museum.name};
 });
 for(const key of ['office','book','buy','clean','swap'])assert.equal(result[key],'');
 assert.ok(result.fundsUsed&&result.personalUnchanged&&result.once);
 assert.equal(result.slots,14);
 assert.ok(result.visitor>0&&result.expenses>0);
 assert.equal(result.receipts,0);
 assert.equal(result.old,'traded');
 assert.equal(result.collection,'seal');
 assert.equal(result.saved,'River Terrace Museum');
});

test('historic timelines keep future products out of the Mall, and Age Up advances the year',async t=>{
 const p=await setup(t);await quiet(p);
 const details=await p.evaluate(()=>{
  g.birthYear=1970;g.age=12;g.cash=30000;g.log=[];tab='Life';draw(1);
  return {year:eraYear(),classic:eraCarAvailable(STUFF_CARS.find(c=>c.n==='Volkswagen Golf')),
   future:eraCarAvailable(STUFF_CARS.find(c=>c.n==='Tesla Model 3')),oldSocial:socialV(['Social','Media'])};
 });
 assert.equal(details.year,1982);assert.ok(details.classic&&!details.future);
 assert.match(details.oldSocial,/have not launched/);
 assert.match(await p.locator('.hd').innerText(),/Age 12 · 1982/);
 await p.getByRole('button',{name:'Stuff',exact:true}).click();
 await p.getByRole('button',{name:/^The Mall Cars/}).click();
 await p.getByRole('button',{name:'Technology store',exact:true}).click();
 assert.equal(await p.getByRole('button',{name:/Satellite-capable/}).count(),0);
 await p.getByRole('button',{name:/^Home personal computer/}).click();
 await p.evaluate(()=>{Object.assign(g,{event:null,result:null,ysum:null,eduPopup:null,hsPopup:null,hsQueue:[],msq:[],msReport:null,msTrainPopup:null});draw(1);});
 await p.getByRole('button',{name:'Age Up',exact:true}).click();
 const inventory=await p.evaluate(()=>({year:eraYear(),items:g.lux.map(x=>x.n),released:ERA_TECH.some(x=>x[0]===eraYear()&&x[1]==='Portable CD player')}));
 assert.equal(inventory.year,1983);assert.ok(inventory.released);
 assert.ok(inventory.items.includes('Home personal computer'));
});

test('parking blocks additional purchases and a burglary removes an exposed collectible once',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  g.lic.push(DL);g.home=null;g.xh=[];g.car=null;g.xc=[];
  stuffStartPurchase('car',0);stuffCompletePurchase('cash');
  const one=stuffAllCars().length;
  stuffStartPurchase('car',1);stuffCompletePurchase('cash');
  const blocked=stuffAllCars().length;
  g.home={id:'home-test',n:'Test house',v:245000,own:true,tier:2,condition:75};
  housingEnsure();const space=parkingCapacity();
  const add=homeCustomize(g.home,'parking','');
  stuffStartPurchase('car',1);stuffCompletePurchase('cash');
  g.lux.push({id:'test-collectible',n:'Valuable display',v:4500,purchasePrice:4500,assetType:'art'});
  const displayed=homeCustomize(g.home,'display','lux','test-collectible');
  const objects=homeItems(g.home).length;
  housingQueueIncident('Break-in');const incident=g.housing.incidents[0];
  const random=Math.random;Math.random=()=>.99;
  housingResolveIncident({id:incident.id,repair:false});
  housingResolveIncident({id:incident.id,repair:false});
  Math.random=random;
  return {one,blocked,space,add,capacity:parkingCapacity(),cars:stuffAllCars().length,displayed,objects,
   lost:!g.lux.some(x=>x.id==='test-collectible'),log:g.log.filter(x=>x.includes('was stolen from a home display')).length};
 });
 assert.deepEqual(result,{one:1,blocked:1,space:2,add:'',capacity:3,cars:2,displayed:'',objects:1,lost:true,log:1});
});

test('a heritage headline stays readable before the museum decision becomes available',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  heritageCreateMuseum('City Archive');
  const s=heritageState();heritageEvent(s,'schools');
  g.age=17;newsBuildYear();newsSection='all';
  const e=s.events[0],edition=newsState().editions.find(x=>x.articles.some(a=>a.id===e.article));
  newsEditionAge=edition.age;
  const article=edition.articles.find(a=>a.id===e.article);
  const root=document.createElement('div');
  root.innerHTML=newsPopup();
  const get=()=>[...root.querySelectorAll('article')].find(x=>x.textContent.includes(article.title));
  const minor=!!get()&&!get().querySelector('button')&&!newsCanRespond(article,edition);
  g.age=18;root.innerHTML=newsPopup();
  const adult=!!get()?.querySelector('button')&&newsCanRespond(article,edition);
  const heard=newsResolveBrief(article,0);
  const repeat=newsResolveBrief(article,0);
  return {minor,adult,heard:heard.done,repeat:repeat.done,public:article.resolved,visits:s.museum.outreach};
 });
 assert.deepEqual(result,{minor:true,adult:true,heard:true,repeat:false,public:true,visits:3});
});

test('a successor continues in the same calendar year and inherits museum collections and personal finds',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  const child={id:'heritage-heir',n:'Robin Test',t:'fam',role:'Child',age:22,bond:78,m:0,alive:true};
  g.rel.push(child);genProfile(child);
  g.birthYear=1980;
  const year=eraYear();
  heritageCreateMuseum('Century Museum');
  heritageMuseumAction('buy',null,'coin');
  const s=heritageState();
  const second={...museumItems(s)[0],id:++s.serial,place:'private'};
  s.artifacts.push(second);
  genState().will={weights:{[child.id]:100},property:{business:child.id,keepsakes:child.id},preferred:child.id,funeral:'memorial'};
  g.alive=false;
  const savedEstate=SaveStore.save(0,'life')&&genFinalEstate().recipients[0].items.some(x=>x.key==='museum');
  const continued=genContinue(child.id);
  return {savedEstate,continued,year,same:eraYear(),name:g.heritage.museum.name,
   exhibits:museumItems(g.heritage).length,private:g.heritage.artifacts.filter(x=>x.place==='private').length,saved:SaveStore.save(1,'life')};
 });
 assert.deepEqual(result,{savedEstate:true,continued:true,year:2014,same:2014,name:'Century Museum',exhibits:1,private:1,saved:true});
});
