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
  if(server)await new Promise(r=>server.close(r));
});
async function setup(t){
  const page=await browser.newPage({viewport:{width:320,height:750}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  t.after(async()=>{await page.close();assert.deepEqual(errors,[]);});
  await page.addInitScript(()=>{
    let n=81;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  });
  await page.goto(base+'/Life%20sim%20relationships%20.html');
  await page.getByRole('button',{name:'Create your own life',exact:true}).click();
  await page.getByRole('button',{name:'Be born',exact:true}).click();
  await page.getByRole('button',{name:'Begin your life',exact:true}).click();
  await page.evaluate(()=>{
    Object.assign(g,{age:32,cash:95000,health:90,fit:82,smarts:72,event:null,result:null,ysum:null,eduPopup:null,
      hsPopup:null,hsQueue:[],msq:[],office:-1,royalty:null,job:{t:'Office assistant',f:'office',pay:38000,yrs:3,sp:0},rec:0,jail:0,evq:0});
    window.seedFor=(s,predicate)=>{
      for(let seed=0;seed<50000;seed++){
        const copy={seed},first=justiceRandom(copy,1,100),second=justiceRandom(copy,1,100),third=justiceRandom(copy,1,100);
        if(predicate(first,second,third)){s.seed=seed;return;}
      }
      throw Error('No test seed');
    };
    ST.sum=false;ST.cur='usd';msCheck(true);tab='Other';NV.O=['Crime'];draw(1);
  });
  return page;
}
test('Crime categories, a fictional bank scene, court booking and conviction are connected through Work',async t=>{
  const p=await setup(t);
  await p.locator('summary').getByText('Theft',{exact:true}).click();
  await p.getByRole('button',{name:/Bank robbery/}).click();
  for(const label of ['Scene prop','Costume','Scene vehicle','Scene time']){
    const input=p.getByLabel(label,{exact:true});assert.equal(await input.locator('option').count(),3);
  }
  await p.evaluate(()=>seedFor(justiceState(),(first,second)=>first>27&&second<59));
  await p.getByRole('button',{name:'Play out the scene',exact:true}).click();
  for(const label of ['Persuade','Offer a bribe','Cooperate','Run','Fight']){
    assert.equal(await p.getByRole('button',{name:label,exact:true}).count(),1);
  }
  await p.getByRole('button',{name:'Fight',exact:true}).click();
  assert.match(await p.getByRole('dialog').innerText(),/death is possible/);
  await p.getByRole('button',{name:'Back to encounter',exact:true}).click();
  await p.getByRole('button',{name:'Cooperate',exact:true}).click();
  assert.match(await p.getByRole('dialog').innerText(),/Jury trial/);
  assert.equal(await p.evaluate(()=>g.job.t==='Office assistant'&&g.rec===0&&g.jail===0),true);
  await p.getByRole('button',{name:'Public defender · Free',exact:true}).click();
  await p.evaluate(()=>{
    const s=justiceState(),c=justiceCurrent(s);
    if(s.pending?.kind==='outcome')s.pending=null;
    g.age=c.due;g.event=null;g.result=null;
    justiceCourtDue(s);
    seedFor(s,(_,roll)=>roll>86);
    draw();
  });
  await p.getByRole('button',{name:'Present your defense',exact:true}).click();
  await p.getByRole('button',{name:'Continue',exact:true}).click();
  assert.equal(await p.evaluate(()=>g.rec===1&&g.jail>=6&&!g.job&&save(0,'life')),true);
  for(const name of ['Stuff','Life','Relationships','Other']){
    assert.equal(await p.locator('.nav').getByRole('button',{name,exact:true}).isDisabled(),true);
  }
  assert.equal(await p.getByRole('button',{name:'Prison jobs',exact:true}).count(),1);
  await p.evaluate(()=>loadFrom(0));
  await p.getByRole('button',{name:'Open prison menu',exact:true}).click();
  await p.getByRole('button',{name:'Prison jobs',exact:true}).click();
  await p.getByRole('button',{name:/Laundry/}).click();
  await p.getByRole('button',{name:'Continue',exact:true}).click();
  assert.equal(await p.evaluate(()=>g.justice.prison.job==='laundry'),true);
});
test('legacy arrests are tried in court and an acquittal keeps work, education and the existing record',async t=>{
  const p=await setup(t);
  const result=await p.evaluate(()=>{
    g.rec=1;g.event=arrest('trespass',1,2);draw();
    const s=justiceState(),c=justiceCurrent(s);
    const waited=c.status==='booking'&&c.venue==='Judge hearing';
    g.study={name:'Legacy studies',left:2,goal:2};
    const old=g.job,study=g.study;
    justiceHire(3);
    seedFor(s,(_,roll)=>roll<7);
    justiceVerdict(2);
    return {waited,acquitted:c.status==='acquitted',retained:g.job===old&&g.study===study,record:g.rec,custody:g.jail,saved:save(1,'life')};
  });
  assert.deepEqual(result,{waited:true,acquitted:true,retained:true,record:1,custody:0,saved:true});
});
test('prison Age Up uses passive finances, separates wages, preserves queued events and supports appeals',async t=>{
  const p=await setup(t);
  const result=await p.evaluate(()=>{
    g.rec=2;g.jail=5;justiceEnsurePrison();
    const s=justiceState(),r=justiceTerm(s),j=s.prison;
    j.job='laundry';
    g.ins={health:1,car:1,home:1};
    g.diet='Healthy';g.habits={smoke:2,drink:2};
    const health=g.health;
    g.car={id:'testcar',n:'Test car',v:18000,condition:90,cleanliness:80,purchasePrice:20000,age:2};
    g.relationshipEventQueue=[{x:'An unrelated social event.',c:[['OK',{},'']]}];
    draw();
    const noBacklogOpened=g.relationshipEventQueue.length===1&&!g.event;
    prisonAgeUp();
    const annually=r.served===1&&g.jail===4&&j.funds===pr(310)&&g.car.condition<90&&g.car.cleanliness<80&&g.car.v<18000;
    const separate=!Object.keys(g.led).some(x=>/insurance|diet|prison wages/i.test(x))&&g.health===health-1;
    s.pending=null;
    const balance=g.cash;
    prisonPurchase('soap');
    const store=j.funds===pr(310)-pr(24)&&g.cash===balance;
    s.pending={kind:'appeal'};
    seedFor(s,(roll)=>roll<=5);
    prisonAppeal(0);
    return {noBacklogOpened,annually,separate,store,overturned:r.overturned&&g.jail===0&&g.rec===1,
      spent:balance-g.cash===pr(4500),saved:save(2,'life')};
  });
  assert.deepEqual(result,{noBacklogOpened:true,annually:true,separate:true,store:true,overturned:true,spent:true,saved:true});
});
test('parole requires full behavior and time served, and escape creates a separate fugitive status',async t=>{
  const p=await setup(t);
  const result=await p.evaluate(()=>{
    g.jail=5;justiceEnsurePrison();
    const s=justiceState(),r=justiceTerm(s),j=s.prison;
    r.sentence=10;r.served=5;j.behavior=100;
    const qualified=prisonParoleEligible(j,r);
    j.everGang=true;const excluded=!prisonParoleEligible(j,r);j.everGang=false;
    s.pending={kind:'escape'};
    seedFor(s,first=>first<8);
    prisonTryEscape();
    const fugitive=justiceAtLarge()&&g.jail===0&&r.status==='Fugitive';
    seedFor(s,(_,second)=>second>70);
    justiceFugitiveMove('city');
    const moved=g.justice.relocation.contacts.length>0&&g.justice.relocation.contacts.some(x=>x.city!==g.city)&&justiceAtLarge();
    s.pending={kind:'fugitive'};
    seedFor(s,(_,second)=>second<60);
    justiceFugitiveMove('home');
    return {qualified,excluded,fugitive,moved,recaptured:g.jail===7&&r.extensions===2&&!r.paroleEligible,saved:save(3,'life')};
  });
  assert.deepEqual(result,{qualified:true,excluded:true,fugitive:true,moved:true,recaptured:true,saved:true});
});
test('civil stages wait for their dates and a settlement pays once',async t=>{
  const p=await setup(t);
  const result=await p.evaluate(()=>{
    const s=justiceState(),v=civilAddVictim('firing','Northwind Publishing');
    civilFile(v.id);
    const c=s.civil[0];
    s.pending=null;civilOpenStage(c.id);
    const notEarly=s.pending===null;
    const start=g.age;
    for(let i=0;i<2;i++){
      g.age=c.due;s.pending=null;civilOpenStage(c.id);civilSelect(0);
    }
    g.age=c.due;s.pending=null;civilOpenStage(c.id);
    seedFor(s,(_,second)=>second<=5);
    civilSelect(0);s.pending=null;
    const before=g.cash,offered=c.status==='offer';
    civilSettle(c.id,true);s.pending=null;civilSettle(c.id,true);
    return {notEarly,offered,years:g.age-start,paid:g.cash-before===c.offer,costs:c.expenses>pr(450),saved:save(4,'life')};
  });
  assert.deepEqual(result,{notEarly:true,offered:true,years:3,paid:true,costs:true,saved:true});
});

test('a failed bribe loses only the selected amount and adds a charge before court',async t=>{
  const p=await setup(t);
  await p.evaluate(()=>{
    const s=justiceState();
    s.pending={kind:'stop',key:'theft',charges:['theft'],incident:0,evidence:69,source:'A witness came forward'};
    draw();
  });
  await p.getByRole('button',{name:'Offer a bribe',exact:true}).click();
  const initial=await p.evaluate(()=>g.cash);
  await p.getByLabel('Amount',{exact:true}).fill('300');
  await p.evaluate(()=>seedFor(justiceState(),roll=>roll>25));
  await p.getByRole('button',{name:'Confirm offer',exact:true}).click();
  assert.match(await p.getByRole('dialog').innerText(),/Theft, Bribery/);
  assert.equal(await p.evaluate(()=>g.cash),initial-300);
  assert.equal(await p.evaluate(()=>g.rec===0&&g.jail===0&&!g.justice.convictions.length),true);
});
test('a civil trial defeat opens an appeal that reviews on a later date',async t=>{
  const p=await setup(t);
  const result=await p.evaluate(()=>{
    const s=justiceState(),v=civilAddVictim('contract','Orchard Services');
    civilFile(v.id);
    const c=s.civil[0];
    c.stage='trial';c.evidence=40;c.due=g.age;s.pending=null;
    civilOpenStage(c.id);seedFor(s,roll=>roll>90);civilSelect(0);
    const window=c.status==='appealWindow';
    s.pending=null;civilOpenStage(c.id);civilSelect(0);
    const filed=c.status==='appealFiled'&&c.due>g.age;
    g.age=c.due;s.pending=null;s.lastVictim=null;civilAnnual(s);
    const ready=c.status==='appealReady';
    s.pending=null;civilOpenStage(c.id);seedFor(s,roll=>roll<7);
    const before=g.cash;civilSelect(0);s.pending=null;
    civilOpenStage(c.id);
    return {window,filed,ready,recovery:c.status==='closed'&&c.paid>0&&g.cash===before+c.paid,once:s.pending===null,saved:save(4,'life')};
  });
  assert.deepEqual(result,{window:true,filed:true,ready:true,recovery:true,once:true,saved:true});
});

test('a successful theft credits personal cash and a later investigation can reopen it',async t=>{
  const p=await setup(t);
  await p.locator('summary').getByText('Theft',{exact:true}).click();
  await p.getByRole('button',{name:/Grand theft ·|Grand theft Age/}).first().click();
  const cash=await p.evaluate(()=>{
    seedFor(justiceState(),(roll,_,follow)=>roll<=43&&follow<50);
    return g.cash;
  });
  await p.getByRole('button',{name:'Play out the scene',exact:true}).click();
  const result=await p.evaluate(start=>{
    const s=justiceState(),i=s.incidents[0];
    const credited=g.cash-start;
    justiceContinue();
    g.age=i.due;
    justiceAfterAge(s);
    return {paid:credited>=pr(2200)&&credited<=pr(14500),reopened:s.pending.kind==='stop'&&s.pending.incident===i.id,saved:save(0,'life')};
  },cash);
  assert.deepEqual(result,{paid:true,reopened:true,saved:true});
});
test('a public defender remains available with a negative personal balance',async t=>{
  const p=await setup(t);
  await p.evaluate(()=>{
    g.cash=-1500;
    justiceBook({key:'trespass'});
  });
  await p.getByRole('button',{name:'Public defender · Free',exact:true}).click();
  assert.equal(await p.evaluate(()=>g.cash===-1500&&justiceCurrent(justiceState()).lawyer.name==='Public defender'),true);
});
