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

test('the top cash button opens investments and only public shares are purchasable',async t=>{
 const p=await setup(t);
 await p.getByRole('button',{name:/Open financial center/}).click();
 await p.getByRole('button',{name:'Investments',exact:true}).click();
 await p.locator('.law-item').filter({hasText:'Voltline Systems'}).getByRole('button',{name:'View investment'}).click();
 const before=await p.evaluate(()=>({cash:g.cash,quote:finInstrument(finState(),'VLT').price}));
 await p.getByLabel('Number of units').fill('10');
 await p.getByRole('button',{name:'Buy units',exact:true}).click();
 assert.equal(await p.evaluate(()=>g.financial.positions.VLT.units),10);
 assert.equal(await p.evaluate(()=>g.cash),before.cash-Math.round(before.quote*10));
 const invalid=await p.evaluate(()=>finTrade('RDM',3));
 assert.match(invalid,/tradable|public/);
 for(const name of ['Bonds','Mutual funds','Crypto','Penny stocks']){
  await p.getByRole('button',{name,exact:true}).click();
  assert.ok(await p.locator('.law-item').count()>0);
 }
 assert.equal(await p.evaluate(()=>save(0,'life')),true);
});
test('an owned company IPO, patent and share split affect the same exchange listing and news',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  const v=VT.co.mk('Quartz Tools','corp');
  g.vent.push(v);
  const s=finSyncCompanies(),row=s.companies.find(x=>x.name===v.n),wasPrivate=!row.public;
  const action=label=>VT.co.acts(v).findIndex(r=>r[0].includes(label));
  va(0,action('company public'));
  const ipo=row.public&&row.price>0;
  finTrade(row.id,12);
  const oldPrice=row.price;
  va(0,2);
  const patent=row.patents===1&&row.price>oldPrice;
  const initial=finPositionValue(s,row.id);
  va(0,action('Split shares'));
  const split=s.positions[row.id].units===24&&Math.abs(finPositionValue(s,row.id)-initial)<=1;
  newsBuildYear();
  const publicStory=g.news.editions[0].articles.some(a=>a.brief?.ref===row.id&&a.title.includes('IPO'));
  const bad=JSON.parse(JSON.stringify(g));bad.financial.positions[row.id].units=-1;
  let rejected=false;try{SaveStore.validate({kind:'life',data:bad});}catch{rejected=true;}
  return {wasPrivate,ipo,patent,split,publicStory,rejected,saved:save(1,'life')};
 });
 assert.deepEqual(result,{wasPrivate:true,ipo:true,patent:true,split:true,publicStory:true,rejected:true,saved:true});
 const milestone=p.getByRole('button',{name:'Nice!',exact:true});
 for(let i=0;i<30&&await milestone.isVisible();i++)await milestone.click();
 await p.getByRole('button',{name:'Open newspaper',exact:true}).click();
 await p.getByRole('button',{name:'Nunya Beeswax',exact:true}).click();
 await p.locator('.newspaper article').filter({hasText:'IPO: Quartz Tools'}).getByRole('button',{name:'Read & respond'}).click();
 await p.getByRole('button',{name:'Review Quartz Tools in Investments'}).click();
 assert.equal(await p.evaluate(()=>NV.O[0]==='Finance'&&finPage==='market'),true);
});
test('bond maturity pays once, mutual funds follow their constituents, and gains record cost basis',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  const s=finInitMarket();
  finTrade('B:GOV',5);
  const bond=finInstrument(s,'B:GOV'),fund=finInstrument(s,'F:BLEND'),previous=fund.price;
  bond.matures=g.age+1;g.age++;
  const bank=g.bank.chk;
  finYear();
  const mix=FINANCE_FUND_DEFS['F:BLEND'],change=mix[1].reduce((n,id,i)=>n+finFind(s.companies,id).change*mix[2][i],0)-mix[3];
  const computed=finRoundPrice(previous*(1+change/100));
  const paid=g.bank.chk-bank===Math.round(5*bond.coupon)+500&&!s.positions['B:GOV'];
  const snapshot=g.bank.chk;finYear();
  const one=g.bank.chk===snapshot;
  const stock=finFind(s.companies,'VLT');
  stock.price=40;finTrade('VLT',10);stock.price=52;finTrade('VLT',4,true);
  return {paid,one,mix:fund.price===computed,basis:s.positions.VLT.basis,gains:s.activity.gains,saved:save(2,'life')};
 });
 assert.deepEqual(result,{paid:true,one:true,mix:true,basis:240,gains:48,saved:true});
});
test('tax filing uses checked deductions, bank deposits, and later paycheck withholding',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  const s=finState();g.fin={gr:200000,inc:450,net:140000};
  g.bank={id:0,chk:1200,sav:100};
  finAdd('tradContrib',2500);
  const r=finPrepareTaxes(s,{'Charitable donations':-2000});s.returns.push(r);
  const withDeductions=finTaxPreview(r),without=finTaxPreview(r,[]),cash=g.cash;
  const qualified=withDeductions.total<without.total&&r.deductions.some(x=>x.id==='retirement');
  finFile(s,r,r.deductions.map(x=>x.id));
  const debt=s.arrears,drawn=r.filing.paid===1300&&g.cash===cash&&debt>0;
  finFile(s,r,[]);const one=debt===s.arrears;
  finGarnish();
  const collected=g.fin.taxArrears===Math.min(debt,30000)&&g.cash===cash-g.fin.taxArrears;
  g.fin={gr:20000,inc:11000};const refund=finPrepareTaxes(s,{});
  const bank=g.bank.chk;finFile(s,refund,[]);
  return {qualified,drawn,one,collected,refund:g.bank.chk-bank===refund.filing.refund&&refund.filing.refund>0,saved:save(3,'life')};
 });
 assert.deepEqual(result,{qualified:true,drawn:true,one:true,collected:true,refund:true,saved:true});
});
test('lottery wins are taxed and a parent estate is divided after estate tax',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  const s=finState();s.seed=1;
  const expectedPot=84000;s.pots.daily=expectedPot;
  const before=g.cash;
  finLotteryBuy('daily',200);
  const paid=g.cash===before-pr(2)*200;
  finLotteryYear(s);
  const lotteryTax=Math.round(expectedPot*.24),won=s.activity.lotteryTax===lotteryTax&&g.bank.chk===expectedPot-lotteryTax;
  const parent=g.rel.find(r=>r.role==='Mother'||r.role==='Father');
  parent.alive=false;parent.deceased=true;parent.deathAt=g.age;parent.estateSavings=2300000;parent.estateCountry=g.country;
  const prior=g.bank.chk;
  finParents(s);
  const record=s.estate[0],heirs=1+g.rel.filter(x=>x.alive&&['Sibling','Brother','Sister'].includes(x.role)).length;
  const share=Math.floor((parent.estateSavings-finEstateTax(parent.estateSavings))/heirs);
  finParents(s);
  return {paid,won,share:record.share===share&&g.bank.chk===prior+share,one:s.estate.length===1,notices:s.notices.length===2,saved:save(4,'life')};
 });
 assert.deepEqual(result,{paid:true,won:true,share:true,one:true,notices:true,saved:true});
});
test('youth savings roll over and credit autopay, cashback and restructuring conserve balances',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  const s=finState();
  g.age=17;
  finTransfer('in-youth',1000);
  finSavingsYear(s);
  const youth=s.youth===1062;
  g.age=18;finSavingsYear(s);
  const rollover=s.youth===0&&g.bank.sav===1128;
  g.age=34;g.bank={id:1,chk:5000,sav:0};
  g.cc={i:1,bal:2000,spent:8000};s.credit.mode='full';
  finCardYear();
  const full=s.credit.report.interest===0&&g.cc.bal===0&&g.bank.chk===3100;
  g.age++;g.bank.chk=200;g.cash=0;g.cc.bal=2000;g.cc.spent=0;s.credit.mode='minimum';
  finCardYear();
  const minimum=s.credit.report.interest===400&&s.credit.report.paid===120&&g.cc.bal===2280;
  g.car={id:'car-keep',n:'Commuter car',v:15000,condition:82};
  g.home={id:'home-keep',n:'Main house',v:220000,own:true};
  g.lux=[{id:'sell-value',n:'Collectible',v:5000}];g.cash=-10000;s.collection={age:g.age};
  const answer=finCollections('restructure');
  return {youth,rollover,full,minimum,secured:!!g.car&&!!g.home,liquidated:g.lux.length===0,
    principal:g.loans.find(x=>x.kind==='restructure')?.bal,reported:answer.includes('25%'),saved:save(0,'life')};
 });
 assert.deepEqual(result,{youth:true,rollover:true,full:true,minimum:true,secured:true,liquidated:true,principal:8680,reported:true,saved:true});
});

test('the annual summary opens a selectable tax filing before a queued life event',async t=>{
 const p=await setup(t);
 await p.evaluate(()=>{
  const s=finState();
  g.fin={gr:82000,inc:9000,net:55000};
  g.led={'Charitable donations':-2100};
  g.bank={id:0,chk:5000,sav:0};
  finYear();
  g.event={x:'An ordinary life event is waiting.',c:[['Proceed with life',{},'']]};
  g.ysum={rows:[['Salary before tax',82000]],net:55000};
  draw();
 });
 await p.getByRole('button',{name:'Review income tax return',exact:true}).click();
 await p.getByRole('heading',{name:'Income tax filing'}).waitFor();
 const select=p.getByRole('checkbox',{name:/Qualified charitable donations/});
 const estimate=await p.locator('#fin-tax-preview').innerText();
 await select.uncheck();
 assert.notEqual(await p.locator('#fin-tax-preview').innerText(),estimate);
 await p.getByRole('button',{name:'File with selected deductions'}).click();
 await p.getByRole('heading',{name:'Tax return filed'}).waitFor();
 await p.getByRole('button',{name:'Continue',exact:true}).click();
 await p.getByRole('button',{name:'Proceed with life'}).waitFor();
 assert.deepEqual(await p.evaluate(()=>finState().returns.at(-1).filing.selected),[]);
});
