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
      country:'United States',cit:['United States'],city:'Chicago',office:-1,royalty:null,job:null,rec:0,jail:0,cred:730,evq:0,vent:[],loans:[]});
    g.nat=g.w[g.country].n;
    ST.sum=false;ST.cur='usd';msCheck(true);tab='Life';draw(1);
  });
  return page;
}


async function quiet(page){
 const button=page.getByRole('button',{name:'Nice!',exact:true});
 for(let i=0;i<35&&await button.isVisible();i++)await button.click();
}

test('Run for Office offers the US ladder and a completed grassroots campaign counts votes',async t=>{
 const p=await setup(t);
 await quiet(p);
 await p.getByRole('button',{name:'Work',exact:true}).click();
 await p.getByRole('button',{name:'Special careers',exact:true}).click();
 await p.getByRole('button',{name:'Run for Office',exact:true}).click();
 await p.getByRole('button',{name:/School board member/}).click();
 await p.evaluate(()=>civicState().campaign.rivals.forEach(r=>{r.backing=25;}));
 await p.getByRole('button',{name:'Build a grassroots network'}).click();
 await p.getByRole('button',{name:/Hold a public town hall/}).click();
 await p.getByRole('button',{name:/Present a costed platform/}).click();
 await p.getByRole('button',{name:/Organize volunteers/}).click();
 const election=await p.evaluate(()=>({
  office:civicCurrent()?.id,won:civicState().elections[0].won,
  margin:civicState().elections[0].results[0].votes-civicState().elections[0].results[1].votes,
  saved:save(0,'life'),uk:civicOffices('United Kingdom').at(-1).name,canadaSenate:civicOffices('Canada').some(o=>o.id==='senate')
 }));
 assert.deepEqual({...election,margin:election.margin>0},{office:'school',won:true,margin:true,saved:true,uk:'Prime Minister',canadaSenate:false});
});
test('a mayor negotiates a bill, the council can override and funds are charged once',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  const s=civicState(),o=civicOffice('mayor');
  civicInstall(s,o,'Democratic');
  const chamber=civicAssembly(s,'city');
  chamber.blocs.forEach(b=>{b.stance=88;});
  const b=civicBill(s,'allotment');
  if(civicVote(s,b))throw Error('The vote was unavailable');
  const desk=b.stage==='desk',near=s.funds;
  civicDesk(s,b,'negotiate');civicVote(s,b);civicDesk(s,b,'veto');
  const veto=b.stage==='veto';
  const prior=Math.random;Math.random=()=>.99;civicVote(s,b);Math.random=prior;
  const enacted=b.stage==='enacted'&&b.outcome==='Veto overridden',funded=near-s.funds===b.cost;
  const locked=!!civicVote(s,b)&&near-s.funds===b.cost;
  return {desk,veto,enacted,funded,locked,local:s.local['United States:city'].S>g.nat.S,saved:save(1,'life')};
 });
 assert.deepEqual(result,{desk:true,veto:true,enacted:true,funded:true,locked:true,local:true,saved:true});
});
test('national institutions run on Age Up and a legislature decision can be opened from the Newspaper',async t=>{
 const p=await setup(t);
 await quiet(p);
 const info=await p.evaluate(()=>{
  g.age=41;g.health=100;
  const s=civicState();civicInstall(s,civicOffice('leader'),'Democratic');
  for(const b of civicAssembly(s,'nation').blocs)b.stance=92;
  const budget=civicBill(s,'allotment');
  civicVote(s,budget);
  const order=civicOrder(s,'safety');
  if(order)throw Error(order);
  civicAppoint(s,'judge',null,'independent');
  const prior=Math.random;Math.random=()=>.3;
  ageUp();
  Math.random=prior;
  const ready=s.bills.find(b=>b.key==='safety');
  const office=civicCurrent()?.id;
  const salary=g.fin.gr;
  g.event=null;g.result=null;g.ysum=null;g.msq=[];g.justice.pending=null;
  for(const item of s.events)item.seen=true;
  const story=newsState().editions.flatMap(e=>e.articles).find(a=>a.brief?.type==='civicsBill'&&a.brief.ref===budget.id&&a.brief.stage==='desk');
  newsOpenBrief(story.id);
  return {office,salary,judge:s.judges.length,review:ready.stage,independent:s.bills.some(b=>b.npc),id:story.id};
 });
 assert.equal(info.office,'leader');
 assert.equal(info.salary,400000);
 assert.equal(info.judge,1);
 assert.equal(info.review,'enacted');
 assert.equal(info.independent,true);
 await p.locator('.newspaper article').filter({hasText:'Operating budget reaches the executive desk'}).getByRole('button',{name:'Read & respond'}).click();
 await p.getByRole('button',{name:'Sign into law',exact:true}).click();
 const row=await p.evaluate(id=>({enacted:g.civics.bills.find(b=>b.key==='allotment').stage==='enacted',
  marked:g.news.editions.flatMap(e=>e.articles).find(a=>a.id===id).resolved,saved:save(2,'life')}),info.id);
 assert.deepEqual(row,{enacted:true,marked:true,saved:true});
});
test('an inquiry can enter criminal court and a resource deal updates the International section',async t=>{
 const p=await setup(t);
 const result=await p.evaluate(()=>{
  g.age=42;
  const s=civicState();civicInstall(s,civicOffice('leader'),'Democratic');
  for(const b of civicAssembly(s,'nation').blocs)b.stance=90;
  const permits=civicBill(s,'extraction');civicVote(s,permits);civicDesk(s,permits,'sign');
  g.age++;civicYear();
  const reserves=s.resources.stock;
  const trade=civicInternational(s,'trade','Canada')==='';
  const repeated=!!civicInternational(s,'trade','Canada');
  const e=civicNotice(s,'ethics','Ethics inquiry','A simulated inquiry has opened.');
  const prior=Math.random;Math.random=()=>.01;
  const response=civicRespond(s,e,1);
  Math.random=prior;newsBuildYear();
  const article=g.news.editions.flatMap(x=>x.articles).find(x=>x.title==='New trade agreement signed');
  const left=s.resources.stock,hearing=response.done&&justiceCurrent(g.justice).charges.includes('bribery');
  relocate('Canada');
  civicInstall(s,civicOffice('leader'),'Liberal');
  const archives=s.resources.stock===0&&s.institutionRecords['United States'].resources.stock===left;
  return {reserves,trade,repeated,left,classified:newsArticleSection(article),hearing,archives,saved:save(3,'life')};
 });
 assert.deepEqual(result,{reserves:4,trade:true,repeated:true,left:2,classified:'international',hearing:true,archives:true,saved:true});
});
