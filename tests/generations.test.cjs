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

test('the will settles tax and debts once, then transfers assets and an adult child’s existing life',async t=>{
 const p=await setup(t);await quiet(p);
 const prepared=await p.evaluate(()=>{
  g.age=75;g.cash=2000000;g.fm=0;g.fame=0;g.job=null;
  const child=relationshipAddChild('Natural birth',35),s=genState(),sib=g.rel.find(x=>x.role==='Sibling');
  const profile=genProfile(child);profile.savings=24000;profile.job={t:'Accountant',f:'finance',pay:72000,lv:1,yrs:9};profile.degree=2;profile.years=9;
  const baby=genRel('Grandchild',6,[child.id]);const childName=child.n;
  g.car={id:'estate-car',n:'Family sedan',v:30000,condition:95};
  g.loans=[{id:'estate-loan',assetId:'estate-car',kind:'car',n:'Auto loan',bal:10000,rate:4}];
  g.home={id:'estate-home',n:'Family cottage',v:240000,own:true,beds:3,condition:90};
  finTrade('VLT',32);
  g.studio=studioNew({name:'Juniper Pictures',age:g.age,capital:22000,scale:1,seed:12,reputation:40});g.studio.country=g.country;
  const firm=lawNewFirm({name:'Birch Legal',specialty:'civil',seed:8,capital:80000,age:g.age,scale:1,home:g.city,places:[g.city]});
  Object.assign(firm,{country:g.country,domestic:[g.city]});lawAddOffice(firm,0,false,g.city);g.lawFirm=firm;
  const practice=clinicNew({name:'Aspen Centre',specialty:'family',age:g.age,capital:900000,scale:1,home:g.city,country:g.country,cities:[g.city],skill:80,seed:96});
  clinicOpenSite(practice,0,g.city);g.practice=practice;
  const company=bizNew('Willow Tools','manufacturing',180000);g.vent.push(company);finCompanyQuote(finInitMarket(),company);
  s.will={weights:{[child.id]:60,[sib.id]:25,charity:15},preferred:child.id,funeral:'green',
   property:{homes:sib.id,vehicles:child.id,investments:child.id,business:child.id}};
  g.alive=false;g.cause='old age';go('death');
  const first=genFinalEstate();
  return {id:child.id,sib:sib.id,baby:baby.id,childName,allocation:first.recipients.find(r=>r.id===child.id).cash,
   tax:first.tax,repeat:genFinalEstate()===first,saved:save(0,'life')};
 });
 assert.ok(prepared.tax>0);assert.equal(prepared.repeat,true);assert.equal(prepared.saved,true);
 await p.getByText(/Funeral preference.*Natural burial/).waitFor();
 await p.getByRole('button',{name:'Continue as your child',exact:true}).click();
 await p.getByRole('button',{name:new RegExp(prepared.childName+' · Age 35')}).click();
 const result=await p.evaluate(({id,sib,baby,allocation})=>({
  age:g.age,job:g.job.t,cash:g.cash===24000+allocation,car:g.car.id,loan:g.loans.some(l=>l.id==='estate-loan'),
  position:g.financial.positions.VLT.units,studio:g.studio.name,law:g.lawFirm.name,practice:g.practice.name,company:g.vent[0].n,independent:g.job.studioOwner===undefined,
  kin:g.rel.find(x=>x.id===baby).role,siblingGift:g.rel.find(x=>x.id===sib).genLife.legacy.some(x=>x.value.id==='estate-home'),
  number:g.generations.number,valid:save(1,'life')
 }),prepared);
 assert.deepEqual(result,{age:35,job:'Accountant',cash:true,car:'estate-car',loan:true,position:32,studio:'Juniper Pictures',law:'Birch Legal',practice:'Aspen Centre',company:'Willow Tools',
  independent:true,kin:'Child',siblingGift:true,number:2,valid:true});
 const third=await p.evaluate(id=>{
  g.alive=false;g.cause='old age';go('death');
  const continued=genContinue(id);
  return {continued,age:g.age,generation:g.generations.number,car:g.car.id,studio:g.studio.name,unspecifiedJob:g.job===null,
   past:g.generations.archive.length,saved:save(2,'life')};
 },prepared.baby);
 assert.deepEqual(third,{continued:true,age:6,generation:3,car:'estate-car',studio:'Juniper Pictures',unspecifiedJob:true,past:2,saved:true});
});
test('family transitions and neglected friendships create persistent consequences',async t=>{
 const p=await setup(t);
 const r=await p.evaluate(()=>{
  const s=genState(),friend={id:'neglected-pal',n:'Alex Friend',role:'Friend',t:'fri',age:32,alive:true,bond:62,m:0};
  g.rel.push(friend);genContact(friend,5);
  g.age+=3;genCheckRelationship();
  const invitation=s.events.some(e=>e.person===friend.id&&!e.closed&&e.kind==='contact');
  g.age+=2;genCheckRelationship();
  const former=friend.role==='Former friend';
  genReconnect(friend.id);genReconnect(friend.id);
  const once=friend.connection.repairs===1;
  g.age++;genReconnect(friend.id);
  genParentsDecision('separation',0);genParentsDecision('remarriage',0);
  const blended=genFamilyInit().status==='blended'&&g.rel.some(x=>x.role==='Step-parent')&&g.rel.some(x=>x.role==='Step-sibling');
  return {invitation,former,once,repaired:friend.role==='Friend',blended,saved:save(2,'life')};
 });
 assert.deepEqual(r,{invitation:true,former:true,once:true,repaired:true,blended:true,saved:true});
});
test('vacations have a destination, memories and an inventory souvenir; funny news is read-only',async t=>{
 const p=await setup(t);await quiet(p);
 await p.evaluate(()=>{g.lic.push('Passport');draw(1);});
 await p.getByRole('button',{name:'Other',exact:true}).click();
 await p.getByRole('button',{name:/^Vacation/}).click();
 await p.getByLabel('Country',{exact:true}).selectOption('Japan');
 const target=await p.getByLabel('Destination city').inputValue();
 const companion=await p.locator('[name=gen-companion]').first().getAttribute('value');
 await p.locator('[name=gen-companion]').first().check();
 await p.getByRole('button',{name:'Book vacation',exact:true}).click();
 await p.getByRole('heading',{name:target+', Japan'}).waitFor();
 await p.getByRole('button',{name:/Historic center and local museum/}).click();
 const pending=await p.evaluate(()=>g.generations.trip.pending);
 if(pending){
  await p.locator('.mo button[onclick="genReply(0)"]').click();
  await p.getByRole('button',{name:'OK',exact:true}).click();
 }
 await quiet(p);
 assert.equal(await p.evaluate(id=>genFind(id).sharedMemories.some(m=>m.text.includes('in Japan together')),companion),true);
 await p.getByRole('button',{name:/^Buy Furoshiki wrapping cloth/}).click();
 await p.getByRole('button',{name:'Return home',exact:true}).click();
 const stored=await p.evaluate(()=>({item:g.lux.some(x=>x.souvenir&&x.origin==='Japan'),trip:g.generations.trips[0].city,cash:g.cash}));
 assert.equal(stored.item,true);assert.equal(stored.trip,target);
 await p.getByRole('button',{name:'Open newspaper',exact:true}).click();
 await p.getByRole('button',{name:'Just for Fun',exact:true}).click();
 assert.equal(await p.locator('.newspaper article').count(),2);
 assert.equal(await p.locator('.newspaper article button').count(),0);
 assert.equal(await p.evaluate(()=>g.cash),stored.cash);
});
test('custom property and island infrastructure complete at Age Up and resource sales pay royalties once',async t=>{
 const p=await setup(t);
 const r=await p.evaluate(()=>{
  g.cash=100000000000;const s=genState();
  genBuyLot('country');const id=s.land[0].id;
  const plan=genBuildHome(id,'custom','Juniper House',4,220)==='';
  genBuyIsland('seagrass');genBuyIsland('pelican',true);
  const island=s.islands[0],nation=s.nations[0];
  genIslandDevelop(island.id,'lodge');genIslandDevelop(nation.id,'schools');
  const before=g.age; g.age++;buildSum();
  const home=stuffAllHomes().find(x=>x.id===id);
  const cash=g.cash,traded=genIslandTrade(nation.id,'Canada')==='',noRepeat=!!genIslandTrade(nation.id,'Canada');
  return {plan,advanced:g.age===before+1,home:home?.customArea,land:s.land.length,
   opened:island.projects[0].complete&&island.profit>0,school:nation.wellbeing>55,traded,noRepeat,royalty:g.cash>cash,saved:save(3,'life')};
 });
 assert.deepEqual(r,{plan:true,advanced:true,home:220,land:0,opened:true,school:true,traded:true,noRepeat:true,royalty:true,saved:true});
});
