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
      res.writeHead(200,{'content-type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
      res.end(data);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
});
after(async()=>{
  await browser?.close();
  if(server)await new Promise(resolve=>server.close(resolve));
});
async function setup(t){
  const page=await browser.newPage({viewport:{width:320,height:760}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  t.after(async()=>{await page.close();assert.deepEqual(errors,[]);});
  await page.addInitScript(()=>{
    let seed=76;
    Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  });
  await page.goto(base+'/Life%20sim%20relationships%20.html');
  await page.getByRole('button',{name:'Create your own life',exact:true}).click();
  await page.getByRole('button',{name:'Be born',exact:true}).click();
  await page.getByRole('button',{name:'Begin your life',exact:true}).click();
  await page.evaluate(()=>{
    Object.assign(g,{age:36,cash:1200000,edu:4,rec:0,smarts:85,health:95,event:null,result:null,msq:[],ysum:null,
      office:-1,hsPopup:null,hsQueue:[],royalty:null,job:null,intern:null,pt:[],vent:[]});
    ST.cur='usd';ST.sum=false;
    msCheck(true);
    tab='Work';wsel=null;wsub=null;draw(1);
  });
  return page;
}
async function openStudio(page){
  await page.getByRole('button',{name:'Special careers',exact:true}).click();
  await page.getByRole('button',{name:/Movie Director/}).click();
  await page.getByLabel('Studio name').fill('Golden & Violet Pictures');
  await page.getByLabel('Upfront personal investment').fill('450000');
  await page.getByRole('button',{name:'Open the studio',exact:true}).click();
  await page.locator('.studio-heading h2').getByText('Golden & Violet Pictures',{exact:true}).waitFor();
}
async function dismissMilestones(page){
  const button=page.getByRole('button',{name:'Nice!',exact:true});
  for(let i=0;i<35&&await button.isVisible();i++)await button.click();
}
async function closeResult(page){
  await dismissMilestones(page);
  await page.getByRole('button',{name:'OK',exact:true}).click();
  await dismissMilestones(page);
}
const fixture=async page=>page.evaluate(()=>{
  const s=studioNew({name:'Orchid Film',age:g.age,capital:650000,scale:1,seed:14,reputation:52});
  s.country=g.country;g.studio=s;g.job=studioJob();
  s.seen=Object.keys(STUDIO_INCIDENTS);
  return s.age;
});

test('studio opening is part of Work and mobile financial controls move money with withholding',async t=>{
  const page=await setup(t);
  await openStudio(page);
  await page.locator('.nav').getByRole('button',{name:'Work',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:/Movie Director/}).count(),0);
  await page.getByRole('button',{name:'Manage movie studio'}).click();
  await page.getByRole('button',{name:'Financials',exact:true}).click();
  const before=await page.evaluate(()=>({cash:g.cash,studio:g.studio.cash,tax:C().t.inc}));
  await page.getByLabel('Transfer type').selectOption('withdraw');
  await page.getByLabel('Transfer amount').fill('6000');
  assert.equal(await page.getByLabel('Adjust amount').inputValue(),'6000');
  await page.getByRole('button',{name:'Submit transfer'}).click();
  assert.match(await page.getByRole('dialog').innerText(),/after .* in tax/);
  const after=await page.evaluate(()=>({cash:g.cash,studio:g.studio.cash,saved:save(0,'life')}));
  assert.deepEqual(after,{cash:before.cash+6000-Math.round(6000*before.tax/100),studio:before.studio-6000,saved:true});
  await closeResult(page);
  await page.getByRole('button',{name:'Close financials'}).click();
  await page.getByRole('button',{name:'Create Script',exact:true}).click();
  await page.getByLabel('Project title').fill('Window on the Coast');
  await page.getByLabel('Production format').selectOption('animation');
  await page.getByRole('button',{name:'Add to Projects',exact:true}).click();
  await page.getByRole('heading',{name:'Window on the Coast',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>g.studio.projects[0].slots.some(x=>x.role==='voice')),true);
  for(const label of ['Projects','Industry','Releases','Awards','Facilities','Production inbox']){
    await page.locator('[aria-label="Movie studio sections"]').getByRole('button',{name:label,exact:true}).click();
    assert.equal(await page.evaluate(()=>document.querySelector('.info').scrollWidth<=document.querySelector('.info').clientWidth+1),true);
  }
});
test('a staged production moves once per Age Up and release, award, licensing and sequel systems use the same project',async t=>{
  const page=await setup(t);
  await fixture(page);
  const result=await page.evaluate(()=>{
    const s=g.studio;
    const p=studioNewProject(s,{name:'Night Lantern',genre:'Drama',media:'film',format:'live',rating:'PG-13',leads:1,support:1,background:1});
    const advance=()=>{
      g.event=null;g.result=null;g.ysum=null;g.eduPopup=null;g.hsPopup=null;g.hsQueue=[];g.msq=[];g.msReport=null;g.msTrainPopup=null;
      s.notices=[];g.health=95;
      ageUp();
    };
    studioPhaseChoice(s,p,2);
    const before=p.stage==='writing'&&p.ready;
    advance();
    const castStage=p.stage==='casting'&&!p.ready;
    for(const [i,slot] of p.slots.entries())studioCasting(s,p,i,s.people.find(e=>e.role===slot.role));
    studioLockCast(s,p);advance();
    const filming=p.stage==='filming';
    studioPhaseChoice(s,p,2);advance();
    const post=p.stage==='post';
    studioPhaseChoice(s,p,2);advance();
    const marketing=p.stage==='marketing';
    studioConfigureRelease(s,p,'frame','original');studioMarket(s,p,1,1);
    const preRelease=p.stage==='future'&&p.releaseAge===g.age+1&&p.earned===0;
    const personalBefore=g.cash;
    advance();
    const released=p.stage==='released'&&p.gross===p.distribution.guarantee&&p.earned===p.gross&&p.actual===g.age&&s.notices.some(n=>n.project===p.id);
    const separate=g.cash<=personalBefore;
    const nominee=p.nominations.length>0;
    const beforeAwards=s.cash;
    studioAwards(s);
    const awardCharge=nominee&&s.cash===beforeAwards-8500&&p.results.length===p.nominations.length;
    const afterAward=s.cash;studioAwards(s);
    const awardOnce=s.cash===afterAward;
    const offer=s.offers.find(x=>x.project===p.id)||studioGenerateOffer(s,p);
    studioLicense(s,offer.id);advance();
    const paid=p.licenses[0].paid===offer.annual&&s.reports[0].income['Library licenses']===offer.annual;
    const sequel=studioNewProject(s,{name:'Night Lantern II',genre:p.genre,media:p.media,format:p.format,rating:p.rating,leads:1,support:0,background:0},p);
    return {before,castStage,filming,post,marketing,preRelease,released,separate,awardCharge,awardOnce,paid,sequel:sequel.source===p.id,saved:save(1,'life')};
  });
  assert.deepEqual(result,{before:true,castStage:true,filming:true,post:true,marketing:true,preRelease:true,released:true,separate:true,
    awardCharge:true,awardOnce:true,paid:true,sequel:true,saved:true});
});
test('a public production decision uses the archived newspaper once and preserves separate cash',async t=>{
  const page=await setup(t);
  await fixture(page);
  const story=await page.evaluate(()=>{
    const s=g.studio,p=studioNewProject(s,{name:'Edge of Autumn',genre:'Action',media:'film',format:'live',rating:'PG',leads:1,support:0,background:0});
    p.stage='filming';
    studioRaiseIncident(s,p,'safety');
    const incident=s.incidents[0];
    newsBuildYear();
    g.age++;newsBuildYear();draw();
    return {id:incident.story,age:g.age-1,cash:s.cash,personal:g.cash};
  });
  await page.getByRole('button',{name:'Open newspaper',exact:true}).click();
  await page.getByLabel('Past editions').selectOption(String(story.age));
  await page.locator('.newspaper article').filter({hasText:'A publicly reported stunt incident'}).getByRole('button',{name:'Read & respond'}).click();
  const effect=await page.evaluate(()=>g.event.c[0][1]);
  await page.getByRole('button',{name:/Fund an outside safety review/}).click();
  await dismissMilestones(page);
  assert.match(await page.getByRole('dialog').innerText(),/postponed filming/);
  const state=await page.evaluate(({effect,id})=>{
    E(effect);
    return {cash:g.studio.cash,personal:g.cash,delay:g.studio.projects[0].delay,
      resolved:g.news.editions.flatMap(e=>e.articles).find(a=>a.id===id).resolved,saved:save(2,'life')};
  },{effect,id:story.id});
  assert.deepEqual(state,{cash:story.cash-23500,personal:story.personal,delay:1,resolved:true,saved:true});
});
test('annual studio debt opens recovery and production cannot charge personal cash',async t=>{
  const page=await setup(t);
  await fixture(page);
  const result=await page.evaluate(()=>{
    const s=g.studio,p=studioNewProject(s,{name:'Cobalt Sky',genre:'Mystery',media:'film',format:'live',rating:'PG',leads:1,support:0,background:0});
    s.cash=1000;
    const before=g.cash;
    const refused=studioPhaseChoice(s,p,2).includes('cannot cover')&&p.ready===false&&g.cash===before&&s.cash===1000;
    const asset=s.assets[0];
    g.age++;studioYear(s,g.age);
    const debt=s.cash<0&&s.notices[0].kind==='debt';
    studioDebtOpen();
    const recovery=s.pending.kind==='finance'&&save(3,'life');
    s.pending=null;
    studioAssetAction(s,asset.id,'sell');
    const sold=s.cash>0&&s.assets.length===0;
    const copy=JSON.parse(JSON.stringify(g));copy.studio.projects[0].slots[0].person=999999;
    let rejected=false;
    try{SaveStore.validate({kind:'life',data:copy});}catch{rejected=true;}
    return {refused,debt,recovery,sold,rejected};
  });
  assert.deepEqual(result,{refused:true,debt:true,recovery:true,sold:true,rejected:true});
});
test('writing credits and fame raise the studio founding reputation',async t=>{
  const page=await setup(t);
  await page.evaluate(()=>writingPortfolioOpen());
  await page.getByLabel('Title',{exact:true}).fill('The Glass Harbor');
  await page.getByRole('button',{name:'Begin a draft',exact:true}).click();
  const result=await page.evaluate(()=>{
    const baseline=studioStartingRep();
    g.age++;writingPortfolioAdvance();
    const waiting=g.writingPortfolio.draft.stage===1;
    writingPortfolioAdvance();
    const once=g.writingPortfolio.credits.length===0;
    g.age++;writingPortfolioAdvance();
    const authored=studioStartingRep();
    g.fm=40;
    return {waiting,once,published:g.writingPortfolio.credits.length,creditBonus:authored-baseline,fameBonus:studioStartingRep()-authored,saved:save(4,'life')};
  });
  assert.deepEqual(result,{waiting:true,once:true,published:1,creditBonus:3,fameBonus:10,saved:true});
});

test('outside investment enters capital and the investor shares only earned receipts',async t=>{
  const page=await setup(t);
  await fixture(page);
  const result=await page.evaluate(()=>{
    const s=g.studio,p=studioNewProject(s,{name:'Luminous Bridge',genre:'Drama',media:'limited',format:'animation',rating:'PG',leads:1,support:0,background:0});
    const starting=s.cash,personal=g.cash;
    s.seed=1;
    studioSeekInvestment(s,p);
    const advance=p.investor?.advance;
    const investment=advance>0&&s.cash===starting+advance&&s.period.capital['Outside project investment']===advance&&studioTotals(s.period.income)===0;
    studioSeekInvestment(s,p);
    const once=s.cash===starting+advance;
    studioPost(s,'income','Streaming',60000,p);
    studioInvestorPayout(s,p,60000);
    const split=Math.round(60000*p.investor.share/100);
    return {investment,once,split:p.investor.paid===split&&s.cash===starting+advance+60000-split,personal:g.cash===personal,saved:save(2,'life')};
  });
  assert.deepEqual(result,{investment:true,once:true,split:true,personal:true,saved:true});
});
