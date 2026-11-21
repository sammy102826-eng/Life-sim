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


test('the solo career opens immediately and instruments unlock auditions after the label deal ends',async t=>{
 const p=await setup(t);await quiet(p);
 await p.getByRole('button',{name:'Work',exact:true}).click();
 await p.getByRole('button',{name:'Special careers',exact:true}).click();
 await p.getByRole('button',{name:/^Singer and bands Solo music/}).click();
 await p.getByRole('button',{name:'Start solo',exact:true}).click();
 await p.getByRole('button',{name:'Voice and instruments',exact:true}).click();
 await p.getByText('Guitar · 0/100',{exact:true}).click();
 await p.getByRole('button',{name:'Practice guitar',exact:true}).click();
 const result=await p.evaluate(()=>{
  const s=musicState(),practice=s.instruments.guitar;
  const low=musicAudition('harbor','guitar');
  s.instruments.guitar=95;
  const signed=musicLabelSign('local');
  const locked=musicAudition('harbor','guitar');
  g.age=s.label.end;musicYear();
  const retired=s.pastLabels.length;
  const original=Math.random;Math.random=()=>.04;
  const joined=musicAudition('harbor','guitar');
  Math.random=original;
  return {practice,low,signed,locked,retired,joined,role:s.band?.role,years:s.band?.end-g.age,job:g.job.t,
   wentSoloEarly:musicSolo()};
 });
 assert.ok(result.practice>0);
 assert.match(result.low,/Guitar skill must reach 42/);
 assert.equal(result.signed,'');
 assert.match(result.locked,/current commitments/);
 assert.equal(result.retired,1);
 assert.equal(result.joined,'');
 assert.equal(result.role,'guitar');
 assert.equal(result.years,2);
 assert.equal(result.job,'Band musician');
 assert.match(result.wentSoloEarly,/agreements expire/);
});

test('label approval and two majority votes precede release and preserve royalties after a lineup vote',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  const original=Math.random;Math.random=()=>.03;
  const s=musicState();g.les.music=97;
  musicAudition('harbor','voice');musicLabelSign('local');
  musicProject('Night Windows','Indie pop','album');
  const project=s.projects[0],target=musicMembers(s)[0];
  project.quality=35;
  const before=g.cash,votes=s.votes.length;
  const labelDenial=musicProjectStep(project.id,'produce');
  const labelVoted=s.votes.length-votes;
  project.quality=86;Math.random=()=>.99;
  const bandDenial=musicProjectStep(project.id,'produce');
  const unchanged=g.cash===before&&project.stage==='draft';
  g.age++;musicYear();Math.random=()=>.03;
  const recorded=musicProjectStep(project.id,'produce');
  const originalCredits=[...project.splits];
  const removed=musicBandAction('remove',target.id);
  Math.random=()=>.99;
  const releaseDenial=musicProjectStep(project.id,'release',1);
  g.age++;musicYear();Math.random=()=>.03;
  const release=musicProjectStep(project.id,'release',1);
  const scheduled=project.stage;
  g.age++;musicYear();
  const earnings=s.earnings[0],released=project.stage;
  const once=s.earnings.length;musicYear();
  const maintained=s.earnings.length===once;
  const saved=SaveStore.save(0,'life')&&SaveStore.prepare(SaveStore.read(0)).music.projects[0].earned===project.earned;
  Math.random=original;
  return {labelDenial,labelVoted,bandDenial,unchanged,recorded,removed,releaseDenial,release,scheduled,released,earnings,maintained,saved,originalCredits,
   current:musicMembers(s).length+1,credits:project.splits,passed:s.votes.filter(v=>v.passed).map(v=>v.motion)};
 });
 assert.match(result.labelDenial,/label declined/);
 assert.equal(result.labelVoted,0);
 assert.match(result.bandDenial,/band voted against/);
 assert.ok(result.unchanged);
 assert.equal(result.recorded,'');
 assert.equal(result.removed,'');
 assert.match(result.releaseDenial,/band voted against/);
 assert.equal(result.release,'');
 assert.equal(result.scheduled,'scheduled');
 assert.equal(result.released,'released');
 assert.equal(result.current,3);
 assert.deepEqual(result.originalCredits,result.credits);
 assert.equal(result.earnings.members,4);
 assert.ok(result.earnings.labelCut>0);
 assert.ok(result.earnings.recoup>0);
 assert.equal(result.earnings.share,Math.floor((result.earnings.gross-result.earnings.labelCut)/4));
 assert.equal(result.earnings.received,result.earnings.share-result.earnings.recoup);
 assert.ok(result.maintained);
 assert.ok(result.saved);
 assert.ok(result.passed.includes('Record Night Windows'));
 assert.ok(result.passed.includes('Release Night Windows'));
});

test('band departures, reunion decisions, and player removal appear in Newspaper',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  const original=Math.random;Math.random=()=>.02;
  const s=musicState();g.les.music=97;
  musicAudition('harbor','voice');
  const first=s.band.id;
  g.age=s.band.end;musicYear();
  const brokeUp=musicBandAction('disband');
  g.age+=2;musicYear();
  const event=s.events.find(e=>e.key==='reunion');
  newsBuildYear();
  const editions=newsState().editions;
  const edition=editions.find(x=>x.articles.some(a=>a.id===event.article));
  const article=edition.articles.find(a=>a.id===event.article);
  const canRespond=newsCanRespond(article,edition);
  const options=newsBriefOptions(article);
  const accepted=newsResolveBrief(article,0);
  const newBand=s.band.id!==first;
  const closed=!newsCanRespond(article,edition);
  s.band.cohesion=9;for(const m of musicMembers(s))m.trust=12;
  const confidence=musicEvent(s,'confidence');
  const fired=musicRespond(s,confidence,0);
  newsBuildYear();
  const articles=newsState().editions.flatMap(e=>e.articles);
  Math.random=original;
  return {brokeUp,canRespond,options,accepted,newBand,closed,fired,
   mode:s.mode,breakup:articles.some(a=>a.title.includes('breakup')&&!a.action),
   reunion:articles.some(a=>a.title.includes('confirms its reunion')&&!a.action),
   removal:s.archives[0].reason};
 });
 assert.equal(result.brokeUp,'');
 assert.ok(result.canRespond);
 assert.equal(result.options[0][0],'Accept the reunion');
 assert.ok(result.accepted.done&&result.newBand&&result.closed);
 assert.match(result.fired.text,/now a solo performer/);
 assert.equal(result.mode,'solo');
 assert.equal(result.removal,'Removed by majority vote');
 assert.ok(result.breakup&&result.reunion);
});

test('legacy Musician saves keep their pay and the game and Newspaper use the same mobile widths on desktop',async t=>{
 const p=await setup(t);await quiet(p);
 const start=await p.evaluate(()=>{
  g.job={t:'Musician',f:'arts',sp:1,pay:32500,yrs:1};g.sk=49;
  tab='Work';wsel=null;wsub=null;draw(1);
  return {mode:g.music.mode,pay:g.job.pay,loaded:SaveStore.save(0,'life')};
 });
 assert.deepEqual(start,{mode:'solo',pay:32500,loaded:true});
 async function measurements(width,height){
  await p.setViewportSize({width,height});
  return p.evaluate(()=>{
   const size=s=>document.querySelector(s).getBoundingClientRect().width;
   newsPopupOpen=false;tab='Life';draw(1);
   const life=size('#app');
   musicOpen();const career=size('#app');
   newsPopupOpen=true;draw(1);
   const paper=size('.newspaper');
   return {life,career,paper,viewport:document.documentElement.scrollWidth,
    height:document.querySelector('.game').getBoundingClientRect().height};
  });
 }
 assert.deepEqual(await measurements(1440,1080),{life:390,career:390,paper:366,viewport:1440,height:820});
 assert.deepEqual(await measurements(390,844),{life:390,career:390,paper:366,viewport:390,height:820});
 assert.deepEqual(await measurements(320,640),{life:320,career:320,paper:296,viewport:320,height:616});
});

test('instrument lessons are reachable in Other and Age Up settles a scheduled solo release',async t=>{
 const p=await setup(t);await quiet(p);
 await p.getByRole('button',{name:'Other',exact:true}).click();
 await p.getByRole('button',{name:/^Learning Lessons and languages/}).click();
 await p.getByRole('button',{name:'Lessons',exact:true}).click();
 await p.getByRole('button',{name:'Voice and instruments',exact:true}).click();
 await p.getByText('Drums · 0/100',{exact:true}).click();
 await p.getByRole('button',{name:/^Take a lesson/}).click();
 const cost=await p.evaluate(()=>({skill:g.music.instruments.drums,paid:g.led['Music instruction']}));
 assert.ok(cost.skill>0&&cost.paid<0);
 await p.evaluate(()=>{
  musicSolo();musicProject('After the Rain','Folk','single');
  const id=g.music.projects[0].id;
  musicProjectStep(id,'produce');musicProjectStep(id,'release',0);
  tab='Life';draw(1);
 });
 await p.getByRole('button',{name:/^Age Up/i}).click();
 const result=await p.evaluate(()=>{
  const project=g.music.projects[0];
  return {age:g.age,stage:project.stage,earnings:project.earned,ledger:g.led['Music performance income']};
 });
 assert.equal(result.age,35);
 assert.equal(result.stage,'released');
 assert.ok(result.earnings>0);
 assert.equal(result.ledger,result.earnings);
 const custody=await p.evaluate(()=>{
  const project=g.music.projects[0],before=project.earned;
  g.job=null;g.jail=1;g.age++;g.led={};
  prisonLedger(justiceState());
  return {mode:g.music.mode,newRoyalties:project.earned-before,ledger:g.led['Music performance income']};
 });
 assert.equal(custody.mode,null);
 assert.ok(custody.newRoyalties>0);
 assert.equal(custody.newRoyalties,custody.ledger);
});
