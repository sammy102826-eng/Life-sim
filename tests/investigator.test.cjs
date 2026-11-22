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


test('police payroll counts distinct patrol and detective years and unlocks the agency with a notice',async t=>{
 const p=await setup(t);await quiet(p);
 const start=await p.evaluate(()=>{
  g.job={t:'Police officer',f:'law',sp:1,pay:55000,yrs:0};
  g.perf=68;
  const s=piState();
  const early=piFound('East Bank Investigations');
  for(let i=0;i<3;i++){piPoliceAction('course');g.age++;piPayroll();piPayroll();}
  piPoliceAction('promote');
  const title=g.job.t;
  for(let i=0;i<3;i++){g.age++;piPayroll();piPayroll();}
  const reminder=g.log.some(x=>x.includes('experience required to open a private investigation agency'));
  g.stuffEventQueue=[];g.event=null;g.result=null;g.ysum=null;g.msq=[];tab='Life';draw(1);
  return {early,title,patrol:s.patrol,detective:s.detective,notified:s.notified,reminder};
 });
 assert.match(start.early,/requirements/);
 assert.deepEqual({...start,early:null},{early:null,title:'Detective',patrol:3,detective:3,notified:true,reminder:true});
 await p.getByRole('button',{name:'Work',exact:true}).click();
 await p.getByRole('button',{name:'Special careers',exact:true}).click();
 await p.getByRole('button',{name:/^Private Investigator Open or resume/}).click();
 await p.getByLabel('Agency name',{exact:true}).fill('East Bank Investigations');
 await p.getByRole('button',{name:'Open agency',exact:true}).click();
 for(const [label,heading] of [['Rebrand','Rebrand'],['Accept a case','Accept a case'],['Cases','Active cases'],['Staff','Staff and resources'],['Finances','Finances']]){
  await p.getByRole('button',{name:label,exact:true}).click();
  await p.getByRole('heading',{name:heading,exact:true}).waitFor();
  await p.getByRole('button',{name:'Back to agency',exact:true}).click();
 }
 assert.equal(await p.evaluate(()=>SaveStore.save(0,'life')),true);
});
test('agency work corroborates multiple evidence sources, collects fees once, and resolves press decisions',async t=>{
 const p=await setup(t);await quiet(p);
 const outcome=await p.evaluate(()=>{
  const s=piState();s.patrol=3;s.detective=3;s.training=3;piFound('South Shore Review');
  const a=s.agency;a.rep=78;
  piRefreshOffers(s);
  const inbound=s.offers.some(x=>x.inbound);
  const selected=s.offers.sort((x,y)=>PI_CASES[y.key][1]-PI_CASES[x.key][1])[0];
  piAccept(selected.id);
  const item=s.cases[0],early=piCaseAction(item.id,'findings');
  const random=Math.random;Math.random=()=>.97;
  const results=['interview','records','review','referral'].map(method=>piCaseAction(item.id,method));
  Math.random=random;
  const completed=piCaseAction(item.id,'findings'),closed=item.status;
  const cash=a.cash,repeat=piCaseAction(item.id,'findings'),same=cash===a.cash;
  piEvent(s,'publicity');newsBuildYear();
  const e=s.events.find(x=>x.key==='publicity'),edition=newsState().editions.find(d=>d.articles.some(x=>x.id===e.article));
  const article=edition.articles.find(x=>x.id===e.article),can=newsCanRespond(article,edition);
  const before=a.rep,chosen=newsResolveBrief(article,1),duplicate=newsResolveBrief(article,1);
  return {inbound,early,results,completed,closed,repeat,same,coverage:item.evidence.length,fee:item.fees,quote:item.fee,
   can,response:chosen.done,duplicate:duplicate.done,public:article.resolved,changed:a.rep-before,saved:SaveStore.save(0,'life')};
 });
 assert.ok(outcome.inbound);
 assert.match(outcome.early,/two sources/);
 assert.deepEqual(outcome.results,['','','','']);
 assert.equal(outcome.completed,'');assert.equal(outcome.closed,'substantiated');
 assert.match(outcome.repeat,/closed/);assert.ok(outcome.same&&outcome.can&&outcome.response&&!outcome.duplicate&&outcome.public&&outcome.saved);
 assert.equal(outcome.fee,outcome.quote);assert.equal(outcome.coverage,4);assert.equal(outcome.changed,3);
});
test('staff capacity, deadlines and payroll change the agency without duplicating expenses',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  const s=piState();s.patrol=3;s.detective=3;piFound('Central File Review');const a=s.agency;
  const base=piCapacity(a),hired=piManage('staff','analyst',1);piRefreshOffers(s);
  piAccept(s.offers[0].id);
  const capacity=piCapacity(a);
  const item=s.cases[0],before=a.rep;
  g.age++;piYear();const cash=a.cash;piYear();
  return {base,hired,capacity,after:piCapacity(a),expired:item.status,rep:a.rep<before,once:a.cash===cash,expenses:a.report.expenses,shortfall:a.report.shortfall,closed:s.month===0};
 });
 assert.equal(result.base,3);assert.equal(result.hired,'');assert.equal(result.capacity,4);
 assert.equal(result.expired,'expired');assert.ok(result.rep&&result.once&&result.expenses>0&&result.shortfall>0&&result.closed);
 assert.equal(result.after,3);
});
test('military jobs appear as full-time listings and an enlistment pays its last year before granting tuition',async t=>{
 const p=await setup(t);await quiet(p);
 const lists=await p.evaluate(()=>{
  const w=()=>new DOMParser().parseFromString(workV(),'text/html');
  wsel=null;wsub='Special';const special=w().body.textContent;
  wsub='Full-time';const regular=w().body.textContent;
  return {regular,special};
 });
 assert.match(lists.regular,/Military officer/);assert.match(lists.regular,/Soldier/);
 assert.doesNotMatch(lists.special,/Military officer|Enlist as a soldier/);
 const result=await p.evaluate(()=>{
  const i=JB.ft.findIndex(x=>x[0]==='Soldier');
  g.edu=1;g.pass.ASVAB=true;
  const allowed=__COLLEGE_PREV_ELIG('ft',JB.ft[i])&&collegeSpecificJobMet(JB.ft[i]),random=Math.random;
  Math.random=()=>.02;collegeConfirmJob('ft',i);Math.random=random;
  const first={title:g.job.t,term:g.job.term,sp:g.job.sp};
  for(let year=0;year<4;year++){g.age++;g.led={};payday();}
  return {allowed,first,retired:g.job===null,benefit:g.gi,last:g.fin.gr};
 });
 assert.ok(result.allowed&&result.retired&&result.benefit&&result.last>0);
 assert.deepEqual(result.first,{title:'Soldier',term:4,sp:0});
});
test('owned museum, casino and agency transfers use residence withholding and UAE keeps personal withdrawals untaxed',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  const us=g.w[g.country].t.inc, expected=Math.round(1000*us/100);
  heritageCreateMuseum('File Museum');const m=heritageState().museum;
  casinoCreate('Library Tables');const v=g.vent[0];casinoManage(v,'transfer',null,pr(15000));
  const s=piState();s.patrol=3;s.detective=3;piFound('File Agency');
  const a=s.agency,amount=1000,test=(withdraw,source,label)=>{
   const before=g.cash,funds=source.cash;const error=withdraw();
   return [error,g.cash-before,source.cash-funds,g.led[label]||0];
  };
  const museum=test(()=>heritageMuseumAction('withdraw',null,amount),m,'Museum distribution tax');
  const casino=test(()=>casinoManage(v,'withdraw',null,amount),v.casino,'Casino distribution tax');
  const agency=test(()=>piManage('withdraw','',amount),a,'Investigation agency distribution tax');
  const report=finPrepareTaxes(finState(),g.led);
  relocate('United Arab Emirates');
  const before=g.cash;const transfer=heritageMuseumAction('withdraw',null,amount);
  const local={transfer,net:g.cash-before,income:C().t.inc,payroll:C().t.ss,business:finEnterpriseRate(g.country,8,35)};
  return {expected,museum,casino,agency,report:report.withheld,local};
 });
 for(const k of ['museum','casino','agency'])assert.deepEqual(result[k],['',1000-result.expected,-1000,-result.expected]);
 assert.equal(result.report,3*result.expected);
 assert.deepEqual(result.local,{transfer:'',net:1000,income:0,payroll:0,business:9});
});

test('a saved investigation agency reopens and accepts a new file with network access disabled',async t=>{
 const p=await setup(t);await quiet(p);
 await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await p.evaluate(()=>{
  const s=piState();s.patrol=3;s.detective=3;
  if(piFound('Offline File Review'))throw Error('Failed to open the office');
  if(!SaveStore.save(0,'life'))throw Error('Failed to save the office');
 });
 await p.context().setOffline(true);
 const response=await p.reload();assert.ok(response.fromServiceWorker());
 await p.getByRole('button',{name:'Load game',exact:true}).click();
 await p.getByRole('button',{name:'Load',exact:true}).first().click();
 await p.evaluate(()=>piOpen());
 await p.getByRole('heading',{name:'Offline File Review',exact:true}).waitFor();
 await p.getByRole('button',{name:'Accept a case',exact:true}).click();
 await p.locator('.info details summary').first().click();
 await p.getByRole('button',{name:/^Accept (relationship|misplaced|insurance|missing|contents)/i}).first().click();
 assert.equal(await p.evaluate(()=>piOpenFiles(piState()).length),1);
});

test('business, studio and a private university reconcile owner contributions and taxed withdrawals',async t=>{
 const p=await setup(t);await quiet(p);
 const outcome=await p.evaluate(()=>{
  const amount=pr(1500),tax=finDistributionTax(amount);
  const v=bizNew('Records Company','retail',pr(200000));g.vent.push(v);
  const studio=studioNew({name:'Records Studio',age:g.age,capital:pr(200000),scale:1,seed:771,reputation:50});
  const s=teachState(),campus=uniInitial('Records University','broad',pr(250000),true);
  s.campus=campus;teachAssign(s,'dean',campus.name,0,0);
  const run=(reserve,deposit,withdraw)=>{
   const old=g.cash,base=reserve();
   deposit();
   const invested=g.cash===old-amount&&reserve()===base+amount;
   const receipt=withdraw();
   return {invested,returned:reserve()===base,net:g.cash-old,receipt};
  };
  const company=run(()=>v.biz.cash,()=>{g.cash-=amount;bizPost(v,'Owner capital',amount);},()=>bizWithdraw(v,amount));
  const film=run(()=>studio.cash,()=>studioTransfer(studio,'invest',amount),()=>studioTransfer(studio,'withdraw',amount));
  const university=run(()=>campus.cash,()=>uniOwnerTransfer(campus,'contribution',amount),()=>uniOwnerTransfer(campus,'distribution',amount));
  campus.status='public';const before=g.cash,blocked=uniOwnerTransfer(campus,'distribution',amount);
  return {tax,company,film,university,blocked,unchanged:g.cash===before};
 });
 for(const k of ['company','film','university']){
  assert.ok(outcome[k].invested&&outcome[k].returned,k);
  assert.equal(outcome[k].net,-outcome.tax,k);
 }
 assert.match(outcome.blocked,/privately owned/);assert.ok(outcome.unchanged);
});
