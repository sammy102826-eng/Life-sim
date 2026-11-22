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


test('Casino opens from Other and deals a saved blackjack hand with separate hit and stand actions',async t=>{
 const p=await setup(t);await quiet(p);
 await p.getByRole('button',{name:'Other',exact:true}).click();
 await p.getByRole('button',{name:/^Casino Casino games/}).click();
 await p.getByRole('button',{name:'Go to Casino',exact:true}).click();
 await p.getByRole('button',{name:'Blackjack',exact:true}).click();
 await p.getByLabel('Wager',{exact:true}).fill('80');
 await p.evaluate(()=>{casinoShuffle=()=>[0,1,2,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,16,3,51];});
 await p.getByRole('button',{name:'Place wager',exact:true}).click();
 await p.getByRole('button',{name:'Stand',exact:true}).waitFor();
 const hand=await p.evaluate(()=>{
  const age=g.age,before=g.cash;
  ageUp();
  const saved=SaveStore.save(0,'life');
  const persisted=SaveStore.read(0).data.casinoPlay.round;
  loadFrom(0);
  return {saved,stake:persisted.stake,stillAge:g.age===age,balance:g.cash===before};
 });
 assert.deepEqual(hand,{saved:true,stake:80,stillAge:true,balance:true});
 await p.evaluate(()=>casinoResume());
 await p.getByRole('button',{name:'Stand',exact:true}).click();
 const result=await p.evaluate(()=>({receipt:g.casinoPlay.result,active:g.casinoPlay.round,gross:g.led['Casino player net']}));
 assert.equal(result.active,null);
 assert.ok(result.receipt.summary.includes('Dealer'));
 assert.equal(result.receipt.net,result.gross||0);
});

test('fixed games simulate wheel, reels, dice, keno, race order and sports scores',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  const s=casinoState(),start=g.cash,old=Math.random;Math.random=()=>.01;
  const bad=casinoStart('keno',null,20,null,[2,2,3]),unchanged=start===g.cash;
  const plans=[
   ['roulette','straight','0','Wheel result'],['slots',null,null,'Cherry'],['dice','under',null,'Dice'],
   ['keno',null,[1,2,3],'matches'],['horse',null,0,'Race order'],['sports','home',0,'Harbor Foxes']
  ];
  const plays=plans.map(([game,choice,selection,label])=>{
   const error=casinoStart(game,null,20,choice,selection),receipt=s.result;
   return {game,error,label:receipt?.summary.includes(label),delta:receipt?.net};
  });
  Math.random=old;
  const keno=Array.from({length:4},(_,i)=>casinoKenoChance(i)).reduce((a,b)=>a+b,0);
  return {bad,unchanged,plays,cash:g.cash-start,net:s.net,ledger:g.led['Casino player net'],keno,
   european:casinoRoulettePick('straight','single','00'),american:casinoRoulettePick('straight','double','00').pick};
 });
 assert.match(result.bad,/valid bet/);assert.ok(result.unchanged);
 for(const play of result.plays){assert.equal(play.error,'',play.game);assert.ok(play.label,play.game);}
 assert.equal(result.plays[0].delta,700);
 assert.equal(result.plays[1].delta,60);
 assert.equal(result.cash,result.net);assert.equal(result.net,result.ledger);
 assert.ok(Math.abs(result.keno-1)<1e-10);
 assert.equal(result.european,null);assert.equal(result.american,37);
});

test('draw poker ranks complete hands and Hold’em reveals the flop, turn, and river before settlement',async t=>{
 const p=await setup(t);await quiet(p);
 const outcome=await p.evaluate(()=>{
  const s=casinoState(),balance=g.cash;
  const royal=casinoPokerScore([8,9,10,11,12]),wheel=casinoPokerScore([12,0,1,2,3]);
  casinoStart('draw',null,80);const draw=s.round,original=[...draw.player];
  const bad=casinoMove('draw',[0,1,2,3]),locked=draw.player.every((c,i)=>c===original[i]);
  const old=Math.random;Math.random=()=>{throw Error('The odds calculator used gameplay randomness.');};
  const estimate=casinoPokerEstimate(draw,[1,2]);Math.random=old;
  const valid=casinoMove('draw',[1,2]),drawReceipt=s.result;
  casinoStart('holdem',null,80);
  const street=[];
  for(let i=0;i<4;i++){
   casinoMove('check');
   street.push(s.round?.board.length??0);
  }
  return {royal,wheel,bad,locked,valid,drawReceipt,street,hold:s.result,net:s.net,cash:g.cash-balance,estimate};
 });
 assert.deepEqual(outcome.royal,[8,14]);assert.deepEqual(outcome.wheel,[8,5]);
 assert.match(outcome.bad,/up to three/);assert.ok(outcome.locked);assert.equal(outcome.valid,'');
 assert.equal(outcome.drawReceipt.game,'draw');assert.equal(outcome.hold.game,'holdem');
 assert.deepEqual(outcome.street,[3,4,5,0]);assert.match(outcome.hold.summary,/Board/);
 assert.equal(outcome.net,outcome.cash);
 assert.ok(Math.abs(outcome.estimate.win+outcome.estimate.push+outcome.estimate.loss-1)<1e-10);
});

test('owners expand through venue levels, unlock hospitality and use the same house rules at their tables',async t=>{
 const p=await setup(t);await quiet(p);
 await p.getByRole('button',{name:'Other',exact:true}).click();
 await p.getByRole('button',{name:/^Casino Casino games/}).click();
 await p.getByRole('button',{name:'Open your own Casino',exact:true}).click();
 await p.getByLabel('Casino name',{exact:true}).fill('Harbor Social');
 await p.getByRole('button',{name:'Open house game',exact:true}).click();
 await p.getByText('Restaurants, bars and entertainment venues',{exact:true}).click();
 assert.equal(await p.getByRole('button',{name:/^Licensed bar Unlocks/}).isEnabled(),false);
 const progress=await p.evaluate(()=>{
  const v=g.vent.find(v=>v.t==='cas'),c=v.casino;
  const early=casinoManage(v,'amenity','bar');
  casinoManage(v,'transfer',null,pr(2000000));const patron=g.cash;
  const expand1=casinoManage(v,'expand'),open=casinoManage(v,'game','roulette');
  const bar=casinoManage(v,'amenity','bar'),music=casinoManage(v,'act','acoustic');
  const second=casinoManage(v,'expand'),stage=casinoManage(v,'amenity','stage'),band=casinoManage(v,'act','residency');
  const wheel=casinoManage(v,'rule','wheel','double'),before=c.cash;
  const random=Math.random;Math.random=()=>.9999;
  const betError=casinoStart('roulette',c.id,10,'straight','00');Math.random=random;
  const settle={house:c.cash-before,patron:g.cash-patron};
  const lowLimit=casinoManage(v,'limits',null,[10,400]);
  const roundError=casinoStart('holdem',c.id,30);
  g.age++;casinoAnnual(v);
  const cash=c.cash;casinoAnnual(v);
  return {early,expand1,open,bar,music,second,stage,band,wheel,betError,settle,lowLimit,roundError,level:c.level,
   report:c.report,once:cash===c.cash,saved:SaveStore.save(0,'life')};
 });
 assert.match(progress.early,/available room/);
 for(const k of ['expand1','open','bar','music','second','stage','band','wheel','betError','lowLimit'])assert.equal(progress[k],'',k);
 assert.deepEqual(progress.settle,{house:-350,patron:350});
 assert.match(progress.roundError,/closed/);assert.equal(progress.level,2);
 assert.ok(progress.report.visitors>0&&progress.report.expenses>0&&progress.once&&progress.saved);
});

test('age, loss caps, and reserve checks block charges and casino news decisions apply once',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  const s=casinoState(),original=g.cash;
  g.age=20;const age=casinoStart('dice',null,15,'over');
  g.age=34;s.budget=10;
  const budget=casinoStart('dice',null,15,'over'),unspent=g.cash===original;
  s.budget=0;casinoCreate('East Pier Rooms');
  const v=g.vent[0],c=v.casino;c.cash=1;
  const reserve=casinoStart('blackjack',c.id,c.min);
  c.cash=pr(10000);casinoEvent('audit',v);newsBuildYear();
  const e=s.events[0],edition=newsState().editions.find(x=>x.articles.some(a=>a.id===e.article)),article=edition.articles.find(a=>a.id===e.article);
  g.age=20;const young=!newsCanRespond(article,edition);
  g.age=34;const canRespond=newsCanRespond(article,edition),cost=casinoCurrency(c,3500),before=c.cash,rep=c.rep;
  const yes=newsResolveBrief(article,0),again=newsResolveBrief(article,0);
  return {age,budget,unspent,reserve,young,canRespond,yes:yes.done,again:again.done,cost:before-c.cash===cost,reputation:c.rep-rep};
 });
 assert.match(result.age,/age 21/);assert.match(result.budget,/seasonal loss limit/);assert.ok(result.unspent);
 assert.match(result.reserve,/reserve/);assert.ok(result.young&&result.canRespond&&result.yes&&!result.again&&result.cost);
 assert.equal(result.reputation,8);
});

test('legacy casino ventures migrate into owner finances and inherit without carrying an old annual clock',async t=>{
 const p=await setup(t);await quiet(p);
 const result=await p.evaluate(()=>{
  const child={id:'casino-heir',n:'Robin Test',t:'fam',role:'Child',age:22,bond:78,m:0,alive:true};
  g.rel.push(child);genProfile(child);
  const old={t:'cas',n:'Old Gaming Room',lvl:0,games:['Slots','Blackjack','Poker room'],minb:5,maxb:200,rep:63,sec:1};
  g.vent.push(old);const c=casinoBusinessState(old),games=c.games.slice();
  const legacyValue=casinoBusinessValue(old),saved=SaveStore.save(0,'life');
  genState().will={weights:{[child.id]:100},property:{business:child.id},preferred:child.id,funeral:'memorial'};
  g.alive=false;const inherited=genContinue(child.id),v=g.vent.find(x=>x.t==='cas');
  return {games,saved,legacyValue,inherited,age:g.age,last:v.casino.lastAge,name:v.n,valid:SaveStore.save(1,'life')};
 });
 assert.deepEqual(result.games,['slots','blackjack','draw']);assert.ok(result.legacyValue>0&&result.saved&&result.inherited&&result.valid);
 assert.equal(result.age,result.last);assert.equal(result.name,'Old Gaming Room');
});


test('an owned table keeps its payout backed if the player visits the management menu mid-hand',async t=>{
 const p=await setup(t);await quiet(p);
 const outcome=await p.evaluate(()=>{
  casinoCreate('Reserve Lounge');
  const v=g.vent[0],c=v.casino;
  c.cash=7000;casinoManage(v,'limits',null,[5,300]);
  const started=casinoStart('holdem',c.id,100);
  const opened=casinoManage(v,'game','holdem');c.cash=200;
  const setup=casinoStart('holdem',c.id,100),before=c.cash;
  const spend=casinoManage(v,'marketing');
  const retained=c.cash===before,close=casinoManage(v,'game','holdem');
  casinoMove('fold');
  const later=casinoManage(v,'marketing');
  return {started,opened,setup,spend,retained,close,later,profit:c.liveNet};
 });
 assert.match(outcome.started,/closed/);
 assert.equal(outcome.opened,'');assert.equal(outcome.setup,'');
 assert.match(outcome.spend,/unfunded/);assert.match(outcome.close,/active round/);
 assert.ok(outcome.retained);assert.equal(outcome.later,'');assert.equal(outcome.profit,100);
});
