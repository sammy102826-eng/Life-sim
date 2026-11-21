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


async function credentials(page){
 await page.evaluate(()=>{
  g.edu=3;g.gpa=3.25;g.maj='Education';
  g.collegeTrack={current:null,degrees:[{title:'Bachelor of Education',level:'bachelor',major:'Education',minor:'Mathematics',gpa:3.5}]};
  g.highSchool=null;g.pass['Teaching certification']=true;
  draw(1);
 });
}
test('Teacher is in Special careers and verifies credentials before running and grading a class',async t=>{
 const p=await setup(t);await credentials(p);await quiet(p);
 await p.getByRole('button',{name:'Work',exact:true}).click();
 await p.getByRole('button',{name:'Special careers',exact:true}).click();
 await p.getByRole('button',{name:/^Teacher School teaching/}).click();
 const offer=p.getByRole('button',{name:'Elementary school teacher',exact:true});
 assert.equal(await offer.isEnabled(),false);
 await p.getByLabel('Teaching subject').selectOption('math');
 await p.getByRole('button',{name:'Set teaching subject',exact:true}).click();
 await p.getByRole('button',{name:/Register teaching license/}).click();
 await offer.click();
 await p.getByRole('button',{name:'Office hours',exact:true}).click();
 await p.getByRole('button',{name:'Hold office hours',exact:true}).click();
 await p.getByRole('button',{name:'Back to teaching overview',exact:true}).click();
 await p.getByRole('button',{name:'Grading',exact:true}).click();
 await p.getByRole('button',{name:'Grade all remaining work',exact:true}).click();
 const result=await p.evaluate(()=>{
  const s=teachState(),roster=s.students.length,support=s.students.filter(p=>p.support>0).length;
  g.age++;buildSum();buildSum();
  return {job:g.job.t,subject:s.subject,registered:s.license===g.country,support,roster,years:s.schoolYears,graded:s.reports[0].submitted,saved:save(0,'life')};
 });
 assert.deepEqual(result,{job:'Elementary school teacher',subject:'math',registered:true,support:3,roster:8,years:1,graded:8,saved:true});
});
test('professor progression requires graduate education and publishes durable subject projects',async t=>{
 const p=await setup(t);await credentials(p);
 const result=await p.evaluate(()=>{
  const s=teachState();s.schoolYears=3;
  const denied=!!teachHire('professor',0);
  g.collegeTrack.degrees.push({title:'Master of Education',level:'master',major:'Education',minor:'None',gpa:3.8});
  g.edu=4;
  const qualified=teachHire('professor',0)==='';
  teachProject('open','Field Guide to Teaching');
  const item=s.projects[0];
  for(let i=0;i<3;i++){
   teachProjectAction(item.id,'work');teachProjectAction(item.id,'review');teachProjectAction(item.id,'partner');
   g.age++;teachYear();
  }
  const published=teachProjectAction(item.id,'publish')==='';
  newsBuildYear();
  const title=g.news.editions.flatMap(e=>e.articles).find(a=>a.title==='Field Guide to Teaching is published');
  s.respect=80;
  const upgrade=teachHire('professor',1)==='';
  return {denied,qualified,published,readonly:title?.action===null,history:s.publications,years:s.professorYears,upgrade,saved:save(1,'life')};
 });
 assert.deepEqual(result,{denied:true,qualified:true,published:true,readonly:true,history:1,years:3,upgrade:true,saved:true});
});
test('an understaffed university records waitlists and recovers, while programs and funding use campus accounts',async t=>{
 const p=await setup(t);await credentials(p);
 const result=await p.evaluate(()=>{
  g.edu=4;g.collegeTrack.degrees.push({level:'master',major:'Education'});
  const s=teachState();Object.assign(s,{schoolYears:3,professorYears:3,respect:80,publications:1});
  const personal=g.cash,opened=teachDean('found','Rosewood University','science',6500000)==='',c=s.campus;
  const investment=personal-g.cash;
  for(let i=0;i<4;i++)uniStaff('fire','professor');
  uniUpgrade('lights');
  const added=uniProgram('save','custom','major',8,79,'Urban Ecology','science')==='';
  const trip=uniDeal('summer','Canada','Cedar Coast College','field',pr(900),20)==='';
  const noPublic=!!uniFunding('public',c.tuition);
  g.age++;buildSum();
  const first=c.reports[0],event=s.events.find(e=>e.key==='layoffs');
  const once=c.cash;buildSum();const notRepeated=c.cash===once;
  const resolved=teachResolve(s,event,0).done;
  for(let i=0;i<8;i++)uniStaff('hire','professor');
  c.prestige=80;c.conditions=85;
  const charter=uniStatus('charter')==='';
  g.age++;buildSum();const chartered=c.status==='charter';
  const request=uniStatus('public')==='';
  g.age++;buildSum();
  return {opened,investment,added,trip,wait:first.wait>0,record:first.short.professor>=4,resolved,notRepeated,
   recovered:c.reports[0].wait===0,noPublic,charter,chartered,request,public:c.status==='public'&&!c.owned,saved:save(2,'life')};
 });
 assert.deepEqual(result,{opened:true,investment:6500000,added:true,trip:true,wait:true,record:true,resolved:true,notRepeated:true,
  recovered:true,noPublic:true,charter:true,chartered:true,request:true,public:true,saved:true});
});
test('an actionable education headline and a read-only story coexist in the newspaper',async t=>{
 const p=await setup(t);await credentials(p);await quiet(p);
 const ids=await p.evaluate(()=>{
  teachLicense();teachHire('high');
  const s=teachState(),action=teachEvent(s,'family');action.seen=true;
  const read=teachNews(s,'New teaching resources published','A resource collection is now available to teachers.');
  newsBuildYear();draw();
  return {id:action.article,read};
 });
 await p.getByRole('button',{name:'Open newspaper',exact:true}).click();
 const item=p.locator('.newspaper article').filter({hasText:'New teaching resources published'});
 assert.equal(await item.locator('button').count(),0);
 const actionable=p.locator('.newspaper article').filter({hasText:'Families question the grading policy'});
 await actionable.getByRole('button',{name:'Read & respond'}).click();
 await p.getByRole('button',{name:'Hold a rubric workshop',exact:true}).click();
 const r=await p.evaluate(id=>({
  closed:teachState().events.find(e=>e.article===id).closed,
  marked:g.news.editions.flatMap(e=>e.articles).find(a=>a.id===id).resolved,saved:save(3,'life')
 }),ids.id);
 assert.deepEqual(r,{closed:true,marked:true,saved:true});
});
test('an owned university and its exchange agreements survive an estate without transferring credentials',async t=>{
 const p=await setup(t);await credentials(p);
 const result=await p.evaluate(()=>{
  g.edu=4;g.collegeTrack.degrees.push({level:'master',major:'Education'});
  const s=teachState();Object.assign(s,{schoolYears:3,professorYears:3,respect:80,publications:1});
  teachDean('found','Sage University','broad',4000000);
  uniProgram('save','custom','minor',6,62,'Civic Design','arts');
  uniDeal('exchange','Canada','Northstar College','culture',pr(400),15);
  const child=relationshipAddChild('Natural birth',12);
  genState().will={weights:{[child.id]:100},preferred:child.id,funeral:'memorial',property:{}};
  g.alive=false;g.cause='old age';go('death');
  const inherited=genContinue(child.id);
  return {inherited,owned:g.teacher.campus.owned,age:g.age,career:g.job,eligibility:teachQualified('dean'),
   exchange:g.teacher.campus.deals.length,program:g.teacher.campus.programs.some(p=>p.name==='Civic Design'),saved:save(4,'life')};
 });
 assert.deepEqual(result,{inherited:true,owned:true,age:12,career:null,eligibility:false,exchange:1,program:true,saved:true});
});
