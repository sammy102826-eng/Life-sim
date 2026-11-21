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
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
});
after(async()=>{
  await browser?.close();
  if(server)await new Promise(r=>server.close(r));
});
async function setup(t){
  const page=await browser.newPage({viewport:{width:320,height:760}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  t.after(async()=>{await page.close();assert.deepEqual(errors,[]);});
  await page.addInitScript(()=>{
    let seed=33;
    Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  });
  await page.goto(base+'/Life%20sim%20relationships%20.html');
  await page.getByRole('button',{name:'Create your own life',exact:true}).click();
  await page.getByRole('button',{name:'Be born',exact:true}).click();
  await page.getByRole('button',{name:'Begin your life',exact:true}).click();
  await page.evaluate(()=>{
    Object.assign(g,{age:44,cash:900000,edu:4,rec:0,perf:88,smarts:85,health:90,event:null,result:null,msq:[],ysum:null,office:-1,hsPopup:null,hsQueue:[],royalty:null});
    g.deg=['Doctor of Medicine (MD)','MD'];
    g.pass['Medical licensing exam']=true;
    collegeEnsure().degrees=[{level:'medical',title:'Doctor of Medicine (MD)',school:'Lakehurst School of Medicine',gpa:3.8}];
    g.job={t:'Senior physician',f:'medicine',pay:255000,sp:0,yrs:5,companyId:'medical-test',company:'Lakehurst Medical',companyYears:10,boss:{name:'Maya Chen',bond:68}};
    g.careerHarmony={score:72,lastField:'medicine',activeField:'medicine',history:[]};
    msCheck(true);
    tab='Work';wsel='job';draw(1);
  });
  return page;
}
async function openPractice(page){
  await page.getByLabel('Choose a medical specialty').selectOption('orthopedics');
  await page.getByRole('button',{name:'Start training in this specialty'}).click();
  await page.evaluate(()=>{g.physicianPath.years=8;draw();});
  await page.getByRole('button',{name:'Start a practice',exact:true}).click();
  await page.getByLabel('Practice name').fill('Juniper & Lake Clinic');
  await page.getByRole('button',{name:'Purchase office and open practice'}).click();
  const milestone=page.getByRole('button',{name:'Nice!',exact:true});
  for(let i=0;i<35&&await milestone.isVisible();i++)await milestone.click();
}
test('medical graduation supplies the licensing credential and employed physicians earn specialty years',async t=>{
  const page=await setup(t);
  const result=await page.evaluate(()=>{
    g.deg=[];g.pass={};collegeEnsure().degrees=[];
    collegeEnsure().current=collegeCurrentFrom('Lakehurst School of Medicine','medical','Medicine','None');
    collegeGraduate();
    const resident=JB.ft.find(x=>x[0]==='Medical resident');
    const degree=clinicDegree()?.level,exam=EXM['Medical licensing exam'][5]();
    g.pass['Medical licensing exam']=true;g.hsPopup=null;g.event=null;
    const job=g.job;g.job=null;
    const eligible=__COLLEGE_PREV_ELIG('ft',resident)&&collegeSpecificJobMet(resident);
    g.job=job;g.physicianPath={specialty:'cardiology',lastAge:43,years:4};
    payday();
    const once=g.physicianPath.years;
    payday();
    return {degree,exam,eligible,once,twice:g.physicianPath.years};
  });
  assert.deepEqual(result,{degree:'medical',exam:true,eligible:true,once:5,twice:5});
});
test('practice unlocks in the doctor job, opens an owned office, and keeps its records in the normal save',async t=>{
  const page=await setup(t);
  assert.equal(await page.getByRole('button',{name:'Start a practice',exact:true}).count(),0);
  await openPractice(page);
  await page.locator('.clinic-heading').getByText('Juniper & Lake Clinic',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>clinicActive()&&g.practice.sites.length===1&&g.practice.sites[0].equity>0),true);
  await page.locator('.law-nav').getByRole('button',{name:'Patients',exact:true}).click();
  await page.getByRole('button',{name:'Enroll patient',exact:true}).first().click();
  await page.getByRole('button',{name:'OK',exact:true}).click();
  await page.locator('.law-nav').getByRole('button',{name:'Appointments',exact:true}).click();
  await page.locator('.law-page details summary').first().click();
  await page.getByRole('button',{name:'Complete with a payment plan'}).click();
  assert.match(await page.getByRole('dialog').innerText(),/Patient paid/);
  await page.getByRole('button',{name:'OK',exact:true}).click();
  assert.equal(await page.evaluate(()=>g.practice.visits[0].status==='completed'&&save(2,'life')),true);
  await page.evaluate(()=>loadFrom(2));
  await page.locator('.nav').getByRole('button',{name:'Work',exact:true}).click();
  await page.getByRole('button',{name:'Manage medical practice'}).click();
  for(const label of ['Patients','Appointments','Price controls','Insurance','Manage staff','Building','Become a chain','Finances','Practice inbox']){
    await page.locator('.law-nav').getByRole('button',{name:label,exact:true}).click();
    assert.equal(await page.evaluate(()=>document.querySelector('.info').scrollWidth<=document.querySelector('.info').clientWidth+1),true);
  }
});
test('delayed insurance claims and separate plan reserves conserve cash',async t=>{
  const page=await setup(t);
  const result=await page.evaluate(()=>{
    const p=clinicNew({name:'Aspen Centre',specialty:'family',age:g.age,capital:900000,scale:1,home:g.city,country:g.country,cities:[g.city],skill:80,seed:96});
    const x=clinicOpenSite(p,1,g.city);
    g.practice=p;g.job=clinicJob();
    const q=p.leads[0];q.cover='bridge';q.budget=100;
    p.networks.bridge=true;
    clinicAccept(p,x,q);
    const v=p.visits[0],quote=clinicQuote(p,q,v.kind),opening=p.cash;
    clinicVisit(p,x,q,v,'charge');
    const supplied=clinicVisitDef(p,v.kind)[2];
    const cashExpected=p.cash-opening===quote.patient-supplied, pending=p.claims[0].amount===quote.claim;
    clinicCollectClaims(p,p.year+1);
    const collected=p.cash-opening===quote.patient+quote.claim-supplied&&p.claims.length===0;
    p.reputation=70;
    for(let i=0;i<89;i++){
      const q={...p.leads[0],id:clinicId(p),budget:100,cover:'self',enrolled:null,balance:0};
      p.patients.push(q);
    }
    const beforePlan=p.cash;
    clinicCreatePlan(p);clinicConfigTier(p,0,480,70,'routine');clinicConfigTier(p,1,960,80,'extended');
    const separate=p.cash===beforePlan-55000&&p.plan.reserve===55000;
    clinicEnrollPlan(p,q,0);clinicEnrollPlan(p,q,1);
    const savedTerms=q.planTerms.name==='Essential'&&q.pendingTier===1&&p.plan.reserve===55480;
    const corrupt=JSON.parse(JSON.stringify(g));corrupt.practice.visits[0].site=-9;
    let rejected=false;
    try{SaveStore.validate({kind:'life',data:corrupt});}catch{rejected=true;}
    return {cashExpected,pending,collected,separate,savedTerms,rejected,saved:save(1,'life')};
  });
  assert.deepEqual(result,{cashExpected:true,pending:true,collected:true,separate:true,savedTerms:true,rejected:true,saved:true});
});
test('location purchases, manager gates, annual payroll, and sales move real practice assets',async t=>{
  const page=await setup(t);
  const result=await page.evaluate(()=>{
    const p=clinicNew({name:'Ash Care',specialty:'orthopedics',age:g.age,capital:950000,scale:1,home:g.city,country:g.country,cities:[g.city,'Sterling'],skill:80,seed:43});
    const x=clinicOpenSite(p,0,g.city);p.reputation=74;
    const branch=clinicOpenSite(p,1,'Sterling');
    g.practice=p;g.job=clinicJob();
    const unstaffed=!clinicReady(p,branch);
    clinicHire(p,branch,'Manager');
    const managerAlone=!clinicReady(p,branch);
    clinicHire(p,branch,'Physician');
    const staffed=clinicReady(p,branch);
    const q=p.leads.find(q=>q.site===branch.id);
    clinicAccept(p,branch,q);
    const salary=clinicStaffAt(p,branch).reduce((n,e)=>n+e.salary,0);
    const year=g.age;ST.sum=false;
    ageUp();
    const annual=g.age===year+1&&p.year===g.age&&p.reports.length===1&&p.reports[0].sites.some(r=>r.city==='Sterling'&&r.visits>0);
    const payroll=p.ledger.some(r=>r.label==='Annual payroll'&&r.site===branch.id&&r.amount===-salary);
    const {proceeds,payroll:severance}=clinicSaleQuote(p,branch),balance=p.cash;
    clinicSell(p,branch);
    const sold=p.sites.length===1&&p.cash-balance===proceeds-severance&&q.site===x.id;
    return {unstaffed,managerAlone,staffed,annual,payroll,sold,saved:save(3,'life')};
  });
  assert.deepEqual(result,{unstaffed:true,managerAlone:true,staffed:true,annual:true,payroll:true,sold:true,saved:true});
});
test('public healthcare choices are actionable from back issues and apply exactly once',async t=>{
  const page=await setup(t);
  await openPractice(page);
  const fixture=await page.evaluate(()=>{
    const p=g.practice,x=p.sites[0];
    clinicRaiseIncident(p,'privacy',x);
    clinicRaiseIncident(p,'feedback',x,p.leads[0]);
    const item=p.incidents.find(i=>i.key==='privacy');
    newsBuildYear();
    const age=g.age;g.age++;newsBuildYear();draw();
    return {age,story:item.story,cash:p.cash,expected:clinicCost(p,5400)};
  });
  await page.getByRole('button',{name:'Open newspaper',exact:true}).click();
  await page.getByLabel('Past editions').selectOption(String(fixture.age));
  const item=page.locator('.newspaper article').filter({hasText:'A patient portal incident draws public attention'});
  await item.getByRole('button',{name:'Read & respond'}).click();
  await page.getByRole('button',{name:/Notify affected patients/}).click();
  assert.match(await page.getByRole('dialog').innerText(),/corrective plan/);
  const state=await page.evaluate(({story})=>({cash:g.practice.cash,closed:g.practice.incidents.find(i=>i.key==='privacy').closed,
    archived:g.news.editions.flatMap(e=>e.articles).find(a=>a.id===story).resolved,
    privatePublished:g.news.editions.some(e=>e.articles.some(a=>a.title.includes('felt rushed'))),saved:save(4,'life')}),fixture);
  assert.deepEqual(state,{cash:fixture.cash-fixture.expected,closed:true,archived:true,privatePublished:false,saved:true});
});

test('the newspaper also drives public legal incidents and civic responses',async t=>{
  const page=await setup(t);
  const result=await page.evaluate(()=>{
    const f=lawNewFirm({name:'Willow Legal',specialty:'civil',seed:8,capital:80000,age:g.age,scale:1,home:g.city,places:[g.city]});
    f.country=g.country;f.domestic=[g.city];g.lawFirm=f;g.job=lawOwnerJob();
    lawAddOffice(f,0,false,g.city);
    f.crisis={key:'records'};pressLawIncident(f);
    const id=f.crisis.article,opening=f.cash;
    newsBuildYear();newsPopupOpen=true;
    newsArticle(id);
    const lawChoice=g.event.c[0][1];
    pick(0);
    const lawResolved=!f.crisis&&f.cash===opening-6500;
    const repeat=f.cash;E(lawChoice);
    const lawOnce=f.cash===repeat;
    g.event=null;g.result=null;g.msq=[];g.office=1;g.job=null;g.approval=50;
    const bill=0;
    pass(bill,1);
    const a=g.news.editions.find(e=>e.age===g.age).articles.find(x=>x.storyKey==='bill-'+g.age+'-'+bill);
    const before=g.approval;
    newsPopupOpen=true;newsArticle(a.id);pick(1);
    return {lawResolved,lawOnce,civic:a.resolved&&g.approval===before+2,saved:save(0,'life')};
  });
  assert.deepEqual(result,{lawResolved:true,lawOnce:true,civic:true,saved:true});
});
