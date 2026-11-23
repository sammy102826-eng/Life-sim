const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
let server,browser,base;
const overrides=new Map();
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
      const types={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
      const type=types[path.extname(file)]||'text/html';
      res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(overrides.get(relative)??data);
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
    await page.getByRole('button',{name:'The Mall',exact:true}).click();
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


test('offline asset list and release version match the current game',()=>{
  execFileSync(process.execPath,['scripts/build-offline.cjs','--check'],{cwd:root});
});

test('a phone can reopen the installed game offline and continue a saved life',async t=>{
  const page=await pageFor(t,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const context=page.context();
  await page.goto(base+'/Life-sim/');
  await page.waitForURL(base+entry);
  await page.getByText('Ready to play offline.',{exact:true}).waitFor();

  const session=await context.newCDPSession(page);
  await session.send('Page.enable');
  const installed=await session.send('Page.getAppManifest');
  assert.deepEqual(installed.errors,[]);
  const manifest=JSON.parse(installed.data);
  assert.equal(manifest.display,'standalone');
  assert.equal(new URL(manifest.start_url,installed.url).href,base+'/Life-sim/');
  assert.deepEqual(manifest.icons.map(icon=>icon.sizes),['192x192','512x512']);

  await startLife(page);
  assert.ok(await page.evaluate(()=>save(0,'life')));
  await page.close();
  await context.setOffline(true);

  const reopened=await context.newPage();
  const errors=[];
  reopened.on('pageerror',error=>errors.push(error.message));
  const response=await reopened.goto(base+'/Life-sim/?from=home-screen#resume');
  assert.equal(response.fromServiceWorker(),true);
  await reopened.waitForURL(base+entry+'?from=home-screen#resume');
  await reopened.getByRole('button',{name:'Load game',exact:true}).click();
  await reopened.getByRole('button',{name:'Load',exact:true}).first().click();
  assert.match(await reopened.locator('.hd').innerText(),/Pages Test/);
  await reopened.getByRole('button',{name:'Work',exact:true}).click();
  await reopened.getByRole('button',{name:'Other',exact:true}).click();
  assert.ok(await reopened.evaluate(()=>save(0,'life')));
  await reopened.reload();
  await reopened.getByRole('button',{name:'Create your own life',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
});

test('an existing installation can replace its stale cache and find the new content without deleting saves',async t=>{
  t.after(()=>overrides.clear());
  const page=await pageFor(t,{isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
  const legacyVersion='11111111111111111111';
  const assetFile=fs.readFileSync(path.join(root,'offline-assets.js'),'utf8');
  const actualVersion=assetFile.match(/"[a-f0-9]{20}"/)[0].slice(1,-1);
  // Reproduce the pre-update worker keeping an old game window as a client.
  overrides.set('offline-assets.js', 'const OFFLINE_VERSION="'+legacyVersion+'"; const OFFLINE_ASSETS=["index.html","Life sim relationships .html"];');
  overrides.set('offline-worker.js', `importScripts('./offline-assets.js');
    const prefix='born-to-run:'+self.registration.scope+':', cache=prefix+OFFLINE_VERSION;
    self.addEventListener('install',e=>e.waitUntil(caches.open(cache).then(c=>c.addAll(OFFLINE_ASSETS))));
    self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
    self.addEventListener('fetch',e=>e.respondWith(caches.open(cache).then(c=>c.match(e.request)).then(r=>r||fetch(e.request))));`);
  overrides.set('Life sim relationships .html', `<!doctype html><title>Old game</title><p>Old offline game</p>
    <script>navigator.serviceWorker.register('./offline-worker.js');</script>`);
  await page.goto(base+entry);
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.evaluate(()=>localStorage.setItem('bt_slot_0','legacy-save-copy'));
  const updater=await page.context().newPage();
  overrides.clear();
  await updater.goto(base+'/Life-sim/update.html');
  await updater.getByRole('button',{name:'Download latest game'}).click();
  await updater.getByRole('link',{name:'Open updated game'}).click();
  await updater.getByText('Downloaded build '+actualVersion.slice(0,12),{exact:true}).waitFor();
  assert.ok(await page.getByText('Old offline game').isVisible());
  assert.equal(await updater.evaluate(()=>localStorage.getItem('bt_slot_0')),'legacy-save-copy');
  await updater.evaluate(()=>localStorage.removeItem('bt_slot_0'));
  await startLife(updater);
  await updater.getByRole('button',{name:'Work',exact:true}).click();
  await updater.getByRole('button',{name:'Find a full-time job',exact:true}).click();
  assert.equal(await updater.getByRole('heading',{name:'Military service'}).count(),0);
  await updater.locator('.info .back-dock').getByRole('button').click();
  await updater.getByRole('button',{name:'Join the military',exact:true}).click();
  await updater.getByRole('heading',{name:'Join the military'}).waitFor();
  assert.equal(await updater.getByRole('button',{name:/^Enlist as a soldier/}).count(),1);
  assert.equal(await updater.getByRole('button',{name:/^Become an officer/}).count(),1);
  await updater.getByRole('button',{name:'Open newspaper',exact:true}).click();
  await updater.getByRole('button',{name:'Crime',exact:true}).click();
  await updater.getByRole('heading',{name:'Crime',exact:true}).waitFor();
  assert.match(await updater.locator('.newspaper article').first().innerText(),/property-crime index/);

  // A subsequent update waits while the game is open and can be installed on demand.
  await updater.evaluate(()=>{newsPopupOpen=false;if(!save(0,'life'))throw Error('Save failed');go('title');});
  const nextVersion='22222222222222222222';
  overrides.set('offline-assets.js',assetFile.replace(actualVersion,nextVersion));
  await updater.getByRole('button',{name:'Check for game updates'}).click();
  await updater.getByRole('button',{name:'Install update and reload'}).click();
  await updater.getByText('Downloaded build '+nextVersion.slice(0,12),{exact:true}).waitFor();
  await updater.context().setOffline(true);
  const response=await updater.reload();
  assert.ok(response.fromServiceWorker());
  await updater.getByRole('button',{name:'Load game',exact:true}).click();
  await updater.getByRole('button',{name:'Load',exact:true}).first().click();
  assert.match(await updater.locator('.hd').innerText(),/Pages Test/);
});
