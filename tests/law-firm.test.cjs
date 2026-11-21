const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let server,browser,base;
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
    let seed=17;
    Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  });
  await page.goto(base+'/Life%20sim%20relationships%20.html');
  await page.getByRole('button',{name:'Create your own life',exact:true}).click();
  await page.getByRole('button',{name:'Be born',exact:true}).click();
  await page.getByRole('button',{name:'Begin your life',exact:true}).click();
  await page.evaluate(()=>{
    Object.assign(g,{age:42,cash:600000,edu:4,rec:0,perf:88,smarts:83,event:null,result:null,msq:[],ysum:null,office:-1,hsPopup:null,hsQueue:[],royalty:null});
    g.deg=['Juris Doctor (JD)'];
    g.pass['Bar exam']=true;
    collegeEnsure().degrees=[{level:'law',title:'Juris Doctor (JD)',school:'Lakehurst College of Law',gpa:3.7,lawFocus:'immigration'}];
    g.job={t:'Senior partner',f:'law',pay:300000,sp:0,yrs:5,companyId:'law-test',company:'Westbridge Legal',companyYears:9,boss:{name:'Avery Park',bond:70}};
    g.careerHarmony={score:80,lastField:'law',activeField:'law',history:[]};
    msCheck(true);
    tab='Work';wsel='job';draw(1);
  });
  return page;
}

test('attorney job opens the firm only after eligibility, retains the JD concentration and saves a real decision',async t=>{
  const page=await setup(t);
  const start=page.getByRole('button',{name:'Start a law firm',exact:true});
  assert.equal(await start.count(),0);
  await page.evaluate(()=>{g.job.companyYears=10;draw();});
  await start.click();
  await page.getByRole('button',{name:'Stay at current firm',exact:true}).click();
  assert.equal(await page.evaluate(()=>g.job.t),'Senior partner');
  await start.click();
  await page.getByRole('button',{name:'Resign and continue',exact:true}).click();
  assert.equal(await page.evaluate(()=>g.job),null);
  for(let i=0;i<35;i++){
    const milestone=page.getByRole('button',{name:'Nice!',exact:true});
    if(!await milestone.isVisible())break;
    await milestone.click();
  }
  assert.equal(await page.getByLabel('Firm name',{exact:true}).count(),1,await page.locator('.mo').first().innerText());
  await page.getByLabel('Firm name',{exact:true}).fill('West & Park Immigration');
  await page.getByRole('button',{name:'Open the practice',exact:true}).click();
  assert.equal(await page.locator('.law-header h2').textContent(),'West & Park Immigration');
  assert.equal(await page.evaluate(()=>g.lawFirm.specialty),'immigration');
  await page.getByRole('button',{name:'Cases',exact:true}).click();
  await page.getByRole('button',{name:'Open matter',exact:true}).first().click();
  await page.evaluate(()=>{g.lawFirm.cases.find(c=>c.id===lawSelected).conflict=false;draw();});
  await page.getByRole('button',{name:'Accept engagement',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Interview the client in depth',exact:true}).click();
  await page.getByRole('dialog').getByRole('heading',{name:'Interview the client in depth',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>g.lawFirm.cases.find(c=>c.id===lawSelected).step),1);
  assert.equal(await page.evaluate(()=>save(0,'life')),true);
  await page.evaluate(()=>loadFrom(0));
  await page.getByRole('dialog').getByRole('heading',{name:'Interview the client in depth',exact:true}).waitFor();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.locator('.nav').getByRole('button',{name:'Work',exact:true}).click();
  await page.getByRole('button',{name:'Manage law firm',exact:true}).click();
  for(const name of ['Cases','Courtroom','Clients','Employees','Finances','Offices','Competitors','Legal News','Partnership','Calendar','Career']){
    await page.locator('.law-nav').getByRole('button',{name,exact:true}).click();
    assert.equal(await page.locator('.law-page > h2').textContent(),name);
    assert.equal(await page.evaluate(()=>document.querySelector('.info').scrollWidth<=document.querySelector('.info').clientWidth+1),true);
  }
  await page.setViewportSize({width:1280,height:900});
  await page.getByRole('button',{name:'Dashboard',exact:true}).click();
  await page.addScriptTag({path:require.resolve('axe-core')});
  const accessibility=await page.evaluate(async()=>{
    const result=await axe.run('.law-shell',{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa']});
    return result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));
  });
  assert.deepEqual(accessibility,[]);
});

test('law school records a specialty and the graduate can take the bar and apply',async t=>{
  const page=await setup(t);
  const result=await page.evaluate(()=>{
    g.deg=[];g.job=null;g.pass={};collegeEnsure().degrees=[];
    const student=collegeCurrentFrom('Lakehurst College of Law','law','Law','None');
    collegeEnsure().current=student;
    collegeDefaultSchedule(student);
    collegePage='study';
    lawSetConcentration('corporate');
    const clinic=student.schedule.some(course=>course.name==='Corporate law clinic');
    collegeGraduate();
    const degree=lawDegree();
    const bar=EXM['Bar exam'][5]();
    g.pass['Bar exam']=true;
    const job=JB.ft.find(row=>row[0]==='Attorney');
    return {clinic,concentration:degree.lawFocus,bar,eligible:collegeSpecificJobMet(job)&&__COLLEGE_PREV_ELIG('ft',job)};
  });
  assert.deepEqual(result,{clinic:true,concentration:'corporate',bar:true,eligible:true});
});

test('Age Up opens the next hearing year and proceedings produce financial and appellate outcomes',async t=>{
  const page=await setup(t);
  const result=await page.evaluate(()=>{
    const f=lawNewFirm({name:'Maple Legal',specialty:'injury',seed:617,capital:110000,age:g.age,scale:1,home:g.city,places:[g.city]});
    f.country=g.country;f.domestic=[g.city];
    g.lawFirm=f;g.job=lawOwnerJob();g.ue=false;
    lawAddOffice(f,0,false,g.city);
    const c=lawGenerateLead(f,'injury');c.conflict=false;
    lawAccept(f,c,true);
    for(let i=0;i<16&&c.status==='active';i++){
      const stage=lawPhase(c);
      const outcome=lawDecision(f,c,stage==='settle'?2:1,stage);
      if(outcome?.warning)lawMonth(f,50);
    }
    const scheduled=c.hearing>=12&&c.status==='waiting';
    const age=g.age;
    ST.sum=false;
    ageUp();
    const entersYear=g.age===age+1&&f.clock===12&&f.reports.length===12;
    for(let i=0;i<5&&c.status==='waiting';i++)lawMonth(f,50);
    let turns=0;
    for(let i=0;i<14&&c.status==='trial';i++){
      const outcome=lawDecision(f,c,2,lawPhase(c));
      if(outcome?.warning)lawMonth(f,50);
      else turns++;
    }
    if(c.status==='appealable'){
      lawClient(f,c).trust=90;
      lawAppeal(f,c,true);
      while(c.status==='appeal')lawMonth(f,50);
    }
    return {scheduled,entersYear,turns,status:c.status,accounted:c.deposit===0&&c.cost>0&&!!c.verdict,receipts:f.reports.some(x=>x.expense>0),saved:save(3,'life')};
  });
  assert.deepEqual(result,{scheduled:true,entersYear:true,turns:6,status:'closed',accounted:true,receipts:true,saved:true});
});

test('identical saved seeds replay the same financial and case consequences',async t=>{
  const page=await setup(t);
  const result=await page.evaluate(()=>{
    const f=lawNewFirm({name:'Rivers Legal',specialty:'corporate',seed:813,capital:100000,age:g.age,scale:1,home:g.city,places:[g.city]});
    lawAddOffice(f,0,false,g.city);
    lawFillLeads(f);
    const copy=JSON.parse(JSON.stringify(f));
    function simulate(state){
      const c=state.cases[0];c.conflict=false;
      lawAccept(state,c,true);
      lawDecision(state,c,0,lawPhase(c));
      lawMonth(state,51);
      return state;
    }
    return JSON.stringify(simulate(f))===JSON.stringify(simulate(copy));
  });
  assert.equal(result,true);
});

test('office and staff capacity, assignments, partnership votes and firm money survive save validation',async t=>{
  const page=await setup(t);
  const result=await page.evaluate(()=>{
    const f=lawNewFirm({name:'Park Partners',specialty:'corporate',seed:9,capital:240000,age:g.age,scale:1,home:g.city,places:[g.city,'Test City']});
    f.country=g.country;f.domestic=f.places.slice();
    g.lawFirm=f;g.job=lawOwnerJob();
    lawAddOffice(f,0,false,g.city);
    lawAddOffice(f,1,false,'Test City');
    const e=lawMakeEmployee(f,'Senior attorney','immigration');
    e.skill=90;e.loyalty=90;
    f.staff.push(e);
    const before=lawCapacity(f);
    f.reputation=60;
    const formed=lawOpenDepartment(f,e.specialty,e.id).includes('opened');
    const c=f.cases.find(x=>x.key==='immigration');
    c.conflict=false;
    lawAccept(f,c,true);
    lawAssign(f,c,e,'Hearing counsel');
    lawPartnerAction(f,e,'admit');
    lawPartnerAction(f,e,'successor');
    const opening=f.cash, prepaid=f.period.expense, payroll=Math.round(e.salary/12);
    lawMonth(f,50);
    const latest=f.reports[0];
    const bad=JSON.parse(JSON.stringify(g));
    bad.lawFirm.cases[0].client=-1;
    let rejects=false;
    try{SaveStore.validate({kind:'life',data:bad});}catch{rejects=true;}
    return {formed,capacity:before>132,desks:lawStaffLimit(f),team:c.tasks[e.id],successor:f.successor===e.id,
      expense:latest.expense>0,paidOnce:opening-f.cash===payroll&&latest.expense===prepaid+payroll,
      saved:save(1,'life'),rejects};
  });
  assert.deepEqual(result,{formed:true,capacity:true,desks:9,team:'Hearing counsel',successor:true,expense:true,paidOnce:true,saved:true,rejects:true});
});
