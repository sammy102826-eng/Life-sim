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
test('Business opens from Work, funds a company and models a product without spending personal funds',async t=>{
 const p=await setup(t);
 await quiet(p);
 await p.getByRole('button',{name:'Work',exact:true}).click();
 await p.getByRole('button',{name:'Special careers',exact:true}).click();
 await p.getByRole('button',{name:/^Business Acquire/}).click();
 await p.getByRole('button',{name:'Start a Business',exact:true}).click();
 await p.getByLabel('Business name').fill('Northbend Analytics');
 await p.getByLabel('Industry').selectOption('ai');
 await p.getByLabel('Your cash contribution').fill('450000');
 await p.getByRole('button',{name:'Start business',exact:true}).click();
 await p.getByRole('heading',{name:'Northbend Analytics',exact:true}).waitFor();
 await p.getByRole('button',{name:'Products',exact:true}).click();
 await p.getByLabel('Product name').fill('Benchmark Suite');
 await p.getByLabel('Sales model').selectOption('subscription');
 await p.getByRole('button',{name:'Launch product',exact:true}).click();
 const result=await p.evaluate(()=>{
  const v=bizActive(),cash=g.cash,before=bizForecast(v);
  v.biz.roles.entry.count=0;
  const understaffed=bizForecast(v);
  v.biz.roles.entry.count=2;g.age++;
  bizYear(v);bizYear(v);
  return {understaffed:understaffed.revenue<before.revenue,year:v.biz.reports.length,product:v.biz.products[0].name,
   subscribers:v.biz.products[0].subscribers,segregated:g.cash===cash,saved:save(0,'life')};
 });
 assert.equal(result.year,1);
 assert.equal(result.product,'Benchmark Suite');
 assert.ok(result.subscribers>0);
 assert.equal(result.understaffed,true);
 assert.equal(result.segregated,true);
 assert.equal(result.saved,true);
});
test('company financing, patents, IPO and subsidiary decisions share market and loan records',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  g.maj='Business';g.edu=2;
  const before=g.cash,error=bizFound('Vector Assembly','manufacturing','loan',300000);
  if(error)throw Error(error);
  const v=bizActive(),s=v.biz;
  const funding=g.cash===before-300000&&s.debt.bal>0&&finLoanView(finState()).includes('Vector Assembly business loan');
  const original=s.debt.bal;bizExtraPrincipal(v,2000);
  const principal=s.debt.bal===original-2000;
  bizProduct(v,'Field sensor',0,pr(540),0,'sale');
  s.research=pr(65000);s.progress=95;g.age++;bizYear(v);
  const patent=s.patents[0],filed=patent&&bizPatent(v,patent.id,'file')==='';
  const quoted=bizIPO(v)==='';
  const company=finFind(finState().companies,v.marketId);
  bizPost(v,'Test capital reserve',20000000);
  const victim=bizCandidates().find(c=>c.id==='FSP');
  const bid=bizBid(v,victim.id,'tender')==='';
  if(!bid)throw Error('Expected funded bid');
  s.escrow.approved=true;s.escrow.review=true;g.age++;bizYear(v);
  const review=s.events.find(x=>x.kind==='antitrust');
  const refund=bizDecision(v,review,2).done&&!s.escrow&&!victim.bizStatus;
  bizBid(v,victim.id,'tender');s.escrow.approved=true;s.escrow.review=false;g.age++;bizYear(v);
  const closed=victim.bizStatus==='subsidiary'&&!victim.public&&s.subs[0].mode==='pending';
  const integration=bizIntegrate(v,victim.id,'merge')===''&&s.factories>1;
  const saved=save(1,'life');
  const trade=finTrade(company.id,1).startsWith('Bought');
  return {funding,principal,filed,quoted,ledger:company.public&&company.patents>0,bid,refund,closed,integration,trade,saved};
 });
 assert.deepEqual(result,{funding:true,principal:true,filed:true,quoted:true,ledger:true,bid:true,refund:true,closed:true,integration:true,trade:true,saved:true});
});
test('newspaper shows independent sections, rumors and persistent company decisions',async t=>{
 const p=await setup(t);
 await quiet(p);
 const response=await p.evaluate(()=>{
  bizFound('Wayfarer Retail','retail','self',250000);
  const v=bizActive();
  const open=bizEvent(v,'labor');open.seen=true;
  bizPress(v,'Speculation about a deal','Parties have not confirmed a deal.',null,true);
  newsBuildYear();draw();
  return open.article;
 });
 await p.getByRole('button',{name:'Open newspaper',exact:true}).click();
 await p.getByRole('button',{name:'The Global Post',exact:true}).click();
 assert.ok(await p.getByText('World economy', {exact:false}).isVisible());
 await p.locator('.newspaper').getByRole('button',{name:'Nunya Beeswax',exact:true}).click();
 await p.getByText('Rumor · Unconfirmed', {exact:false}).waitFor();
 const story=p.locator('.newspaper article').filter({hasText:'Workers request a formal pay agreement'});
 await story.getByRole('button',{name:'Read & respond'}).click();
 await p.getByRole('button',{name:/Open mediated negotiations/}).click();
 const record=await p.evaluate(id=>({
  closed:bizActive().biz.events.find(x=>x.article===id).closed,
  marked:newsState().editions[0].articles.find(x=>x.id===id).resolved,
  policy:newsState().worldCycle.age===g.age,
  saved:save(2,'life')
 }),response);
 assert.deepEqual(record,{closed:true,marked:true,policy:true,saved:true});
});
test('a board-appointed CEO can operate the company but cannot take owner payouts',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  g.job={t:'CEO',company:'Pioneer Sales Group',f:'sales',pay:210000,yrs:0};
  ceoVent('CEO','sales');
  const v=bizActive(),cash=g.cash;
  const ownership=v.own;
  const blocked=bizWithdraw(v,10000).length>0&&g.cash===cash;
  bizEndExecutive(v);
  return {ownership,blocked,noJob:!g.job,stillListed:finFind(finState().companies,v.marketId).public};
 });
 assert.deepEqual(result,{ownership:0,blocked:true,noJob:true,stillListed:true});
});
test('Age Up pays corporate taxes and produces an internship review without a second close',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  const failure=bizFound('Eastline Construction','construction','self',500000);
  if(failure)throw Error(failure);
  const v=bizActive(),s=v.biz;
  bizProduct(v,'Workshop renovation',0,pr(2200),0,'sale');
  s.interns.push({id:++s.serial,age:g.age,name:'Jordan Ellis',status:'active',paid:true,rating:null});
  g.msq=[];g.msReport=null;g.hsPopup=null;g.health=100;
  const before=g.age;
  ageUp();
  const r=s.reports[0];
  if(!r)throw Error('Annual report did not close');
  const actual=s.cash;
  bizYear(v);
  const intern=s.events.find(e=>e.kind==='intern');
  return {advanced:g.age===before+1,taxed:r.tax>0,cashStable:s.cash===actual,review:intern?.target===s.interns[0].id,canHire:!bizAllowed()};
 });
 assert.deepEqual(result,{advanced:true,taxed:true,cashStable:true,review:true,canHire:true});
});
test('a material trade can enter the existing court process and an accepted offer removes the Work slot',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  const failure=bizFound('Signal Commons','ai','investors',500000);
  if(failure){
   g.maj='Business';g.edu=2;
   if(bizFound('Signal Commons','ai','investors',500000))throw Error(failure);
  }
  const v=bizActive(),s=v.biz;
  bizProduct(v,'Dashboards',0,pr(420),0,'sale');
  g.age++;bizYear(v);
  const ipo=bizIPO(v)==='';
  const stock=finTrade(v.marketId,12).startsWith('Bought');
  const original=Math.random;
  Math.random=()=>0;
  bizMaterial(v);g.age++;bizYear(v);
  const e=s.events.find(x=>x.kind==='insider');
  const charges=e&&bizDecision(v,e,1).done&&justiceCurrent(justiceState()).charges.includes('insider');
  Math.random=original;
  if(!s.offer)bizOffer(v,'hostile');
  const offer=s.events.find(x=>x.id===s.offer),cash=g.cash;
  const sold=bizDecision(v,offer,0).done;
  return {ipo,stock,charges,minority:v.own<51,sold,closed:!g.job&&!g.vent.includes(v),payout:g.cash>cash};
 });
 assert.deepEqual(result,{ipo:true,stock:true,charges:true,minority:true,sold:true,closed:true,payout:true});
});
