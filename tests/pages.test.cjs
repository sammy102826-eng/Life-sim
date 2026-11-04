const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let server,browser,base;
const entry='/Life-sim/Life%20sim%20relationships%20.html';
before(async()=>{
  // Serve only the project prefix: a root-relative /src/... asset must fail here.
  server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(!pathname.startsWith('/Life-sim/'))return res.writeHead(404).end();
    const relative=decodeURIComponent(pathname.slice('/Life-sim/'.length))||'index.html';
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
    fs.readFile(file,(err,data)=>{
      if(err)return res.writeHead(404).end();
      const type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html';
      res.writeHead(200,{'Content-Type':type});res.end(data);
    });
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?server.close(resolve):resolve());});
async function pageFor(t,options={}){
  const context=await browser.newContext(options),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
  t.after(async()=>{assert.deepEqual(errors,[]);await context.close();});
  return page;
}
async function startLife(page){
  await page.getByRole('button',{name:'Create your own life',exact:true}).click();
  await page.getByLabel('Your name').fill('Pages Test');
  await page.getByRole('button',{name:'Be born',exact:true}).click();
  await page.getByRole('button',{name:'Begin your life',exact:true}).click();
  for(let i=0;i<10;i++){
    const milestone=page.getByRole('button',{name:'Nice!',exact:true});
    if(!await milestone.isVisible())break;
    await milestone.click();
  }
}
test('Pages root launcher preserves project prefix, query, fragment and all local assets',async t=>{
  const page=await pageFor(t),assets=[],bad=[];
  page.on('response',r=>{if(r.url().includes('/src/')){assets.push(r.url());if(r.status()!==200)bad.push([r.url(),r.status()]);}});
  await page.goto(base+'/Life-sim/?launch=pages#resume');
  await page.waitForURL(base+entry+'?launch=pages#resume');
  assert.equal(await page.title(),'Born to Run');
  assert.equal(await page.getByRole('button',{name:'Create your own life',exact:true}).count(),1);
  assert.ok(assets.length>=24);
  assert.ok(assets.every(url=>url.startsWith(base+'/Life-sim/src/')));
  assert.deepEqual(bad,[]);
  assert.ok(fs.existsSync(path.join(root,'.nojekyll')));
});
test('Pages deployment supports desktop and mobile gameplay with graphics and navigation',async t=>{
  for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}]){
    const page=await pageFor(t,{viewport});
    await page.goto(base+'/Life-sim/');await page.waitForURL(base+entry);await startLife(page);
    for(const name of ['Work','Stuff','Life','Relationships','Other'])await page.getByRole('button',{name,exact:true}).click();
    assert.equal(await page.locator('.hd .game-art--avatar svg').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,JSON.stringify(viewport));
    await page.getByRole('button',{name:'Stuff',exact:true}).click();
    assert.ok(await page.locator('.info [data-art-kind=car] svg').count()>0);
  }
});
test('opening index.html preserves existing same-origin game saves and supports loading them',async t=>{
  const page=await pageFor(t);await page.goto(base+entry);await startLife(page);
  assert.equal(await page.evaluate(()=>save(0,'life')),true);
  const saved=await page.evaluate(()=>localStorage.getItem('bt_slot_0'));
  await page.goto(base+'/Life-sim/index.html');await page.waitForURL(base+entry);
  assert.equal(await page.evaluate(()=>localStorage.getItem('bt_slot_0')),saved);
  await page.getByRole('button',{name:'Load game',exact:true}).click();
  await page.getByRole('button',{name:'Load',exact:true}).first().click();
  assert.match(await page.locator('.hd').innerText(),/Pages Test/);
});
test('launcher provides an accessible manual link when JavaScript is disabled',async t=>{
  const page=await pageFor(t,{javaScriptEnabled:false,viewport:{width:320,height:568}});
  await page.goto(base+'/Life-sim/');
  assert.match(await page.locator('main').innerText(),/Enable JavaScript/);
  assert.equal(await page.getByRole('link',{name:'Launch the game',exact:true}).getAttribute('href'),'./Life%20sim%20relationships%20.html');
});
