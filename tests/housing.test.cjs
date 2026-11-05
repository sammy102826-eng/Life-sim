const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
let browser,server,base;
const root=path.resolve(__dirname,'..');
before(async()=>{
 server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server?server.close(r):r());});
async function setup(t,viewport={width:390,height:844}){
 const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let seed=42;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
 await page.goto(base+'/Life%20sim%20relationships%20.html');
 t.after(async()=>{assert.deepEqual(errors,[]);await context.close();});return page;
}
async function run(p,s){return p.evaluate(s=>eval(s),s);}
async function born(p){await p.getByRole('button',{name:'Create your own life',exact:true}).click();await p.getByRole('button',{name:'Be born',exact:true}).click();await p.getByRole('button',{name:'Begin your life',exact:true}).click();await run(p,'relationshipRepro()');}
function ready(p){return run(p,"g.age=30;g.cash=1000000;g.event=null;g.result=null;g.msq=[];g.ysum=null;g.hsPopup=null;g.housing.lastAge=30;housingEnsure();");}
test('adult housing, rent deposit conservation, arrears, renewal and moving home',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`var before=nw(),cash=g.cash;housingRent(2);var signed=g.home,deposit=signed.deposit;var moving=pr(100+Math.round(RENTAL_HOMES[2].rent*.15));var depositConserved=nw()===before-moving&&g.cash===cash-deposit-moving;g.age++;housingYear();var annual=g.led['Residence rent'];var paid=g.cash;housingYear();var once=paid===g.cash;var proposal=signed.proposedRent;housingAction(signed.id,'renew');var renewed=signed.monthlyRent===proposal;g.cash=0;g.age++;housingYear();var arrears=signed.arrears;housingRent(11);var refused=g.home===signed;g.cash=100000;housingRent(0);({depositConserved,annual,expected:-signed.monthlyRent/1.04*12,once,renewed,arrears,refused,newHome:g.home.n,oldDebt:g.loans.some(x=>x.n==='Former rental arrears')})`);
 assert.equal(r.depositConserved,true);assert.ok(r.annual<0);assert.equal(r.once,true);assert.equal(r.renewed,true);assert.ok(r.arrears>0);assert.equal(r.refused,true);assert.equal(r.newHome,'Shared family room');assert.equal(r.oldDebt,true);
});
test('listing waits for actual Age Up, candidates persist, signed leases earn once and protect housing',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`g.xh=[{id:'investment',n:'Rental house',own:true,v:200000,rented:false,condition:90}];housingEnsure();var h=g.xh[0];stuffRentToggle(h.id);var scheduled=h.tenancy.status;var immediate=stuffMonthlyRent(h);housingYear();var noEarly=h.tenancy.status==='scheduled';g.age++;housingYear();var candidates=h.tenancy.candidates.map(x=>({id:x.id,credit:x.credit,income:x.income,job:x.job,evictions:x.evictions}));var saved=save(2,'life');loadFrom(2);h=g.xh[0];var stable=h.tenancy.candidates[0].id===candidates[0].id;housingAccept(h.id,candidates[0].id);var cash=g.cash;housingCollect(h);var noSignYear=g.cash===cash;g.age++;var random=Math.random;Math.random=()=>.99;housingCollect(h);Math.random=random;var earned=g.cash-cash;housingCollect(h);var once=g.cash-cash===earned;housingMoveIn(h.id);var protectedHome=g.home!==h;stuffSell('home',h.id);var protectedTenant=!!stuffAsset('home',h.id);({scheduled,immediate,noEarly,candidates,saved,stable,noSignYear,earned,expected:h.tenancy.rent*12,once,protectedHome,protectedTenant})`);
 assert.equal(r.scheduled,'scheduled');assert.equal(r.immediate,0);assert.equal(r.noEarly,true);assert.equal(r.candidates.length,3);for(const c of r.candidates){assert.ok(c.credit>=420);assert.ok(c.income>0);assert.ok(c.job);assert.equal(typeof c.evictions,'number');}for(const k of ['saved','stable','noSignYear','once','protectedHome','protectedTenant'])assert.equal(r[k],true,k);assert.equal(r.earned,r.expected);
});
test('real Age Up publishes pending listing without collecting vacancy income',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`g.xh=[{id:'age-listing',n:'Listing test',own:true,v:150000,rented:false}];housingEnsure();stuffRentToggle('age-listing');g.msq=[];g.event=null;g.result=null;g.ysum=null;g.hsPopup=null;g.medical.queue=[];ageUp();({age:g.age,status:g.xh[0].tenancy.status,rent:g.led['Rental income']||0,candidates:g.xh[0].tenancy.candidates.length})`);assert.deepEqual(r,{age:31,status:'applicants',rent:0,candidates:3});
});
test('tenant arrears, payment plans, notice and deposit deductions conserve cash',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`g.xh=[{id:'notice-home',n:'Notice test',own:true,v:120000,rented:true}];housingEnsure();var h=g.xh[0],t=h.tenancy;g.age++;var random=Math.random;Math.random=()=>0;var cash=g.cash;housingCollect(h);Math.random=random;var arrears=t.arrears;housingAction(h.id,'plan');var recovered=arrears-t.arrears;var after=g.cash;housingAction(h.id,'plan');var limited=g.cash===after;t.deposit=t.rent;housingAction(h.id,'notice');var rentUntilDeparture=stuffMonthlyRent(h)===t.rent;g.age++;Math.random=()=>.99;housingYear();Math.random=random;var vacant=t.status==='vacant'&&!t.person;housingMoveIn(h.id);({arrears,recovered,limited,rentUntilDeparture,vacant,moved:g.home.id==='notice-home',deposit:t.deposit})`);assert.ok(r.arrears>0);assert.ok(r.recovered>0);assert.equal(r.limited,true);assert.equal(r.rentUntilDeparture,true);assert.equal(r.vacant,true);assert.equal(r.moved,true);assert.equal(r.deposit,0);
});
test('legacy rentals migrate once and sale of last residence provides supported housing',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`g.home={id:'old-primary',n:'Original primary',v:100000,own:true,rented:false};g.xh=[{id:'legacy-let',n:'Original let',v:150000,own:true,rented:true}];housingEnsure();var person=g.xh[0].tenancy.person.id;housingEnsure();var stable=person===g.xh[0].tenancy.person.id;var income=stuffMonthlyRent(g.xh[0]);stuffSell('home','old-primary');({stable,income,home:g.home.n,own:g.home.own,legacy:g.xh.some(x=>x.id==='legacy-let')})`);assert.equal(r.stable,true);assert.ok(r.income>0);assert.equal(r.home,'Shared family room');assert.equal(r.own,false);assert.equal(r.legacy,true);
});
test('renter and landlord interactions have yearly limits and repairs affect condition',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`housingRent(1);var h=g.home,bond=h.landlord.bond;housingAction(h.id,'chat');housingAction(h.id,'chat');var once=h.landlord.bond===bond+7;g.cash=0;var before=g.cash;housingAction(h.id,'insurance');var noFree=h.contentsInsured!==true&&g.cash===before;g.cash=10000;housingAction(h.id,'insurance');var paid=10000-g.cash;housingAction(h.id,'insurance');({once,noFree,paid,expected:pr(180),limited:g.cash===10000-paid})`);assert.equal(r.once,true);assert.equal(r.noFree,true);assert.equal(r.paid,r.expected);assert.equal(r.limited,true);
});
test('disasters affect homes and cars, insurance reduces cost, decisions cannot pay twice',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`g.home={id:'storm-home',n:'Storm home',own:true,v:200000,rented:false,condition:80};g.car={id:'storm-car',n:'Storm car',v:20000,condition:80};housingEnsure();g.ins.home=1;g.ins.car=1;g.stuffEventQueue=[];housingQueueIncident('Earthquake');var event=g.housing.incidents[0],cash=g.cash;housingResolveIncident({id:event.id,repair:true});var paid=cash-g.cash;housingResolveIncident({id:event.id,repair:true});var once=cash-g.cash===paid;housingQueueIncident('Flood');var second=g.housing.incidents[0];housingResolveIncident({id:second.id,repair:false});({paid,expected:Math.max(pr(250),1200)+Math.max(pr(100),450),once,homeDamaged:g.home.condition<80,carDamaged:g.car.condition<80,loans:g.loans.length,queued:g.stuffEventQueue.length})`);assert.equal(r.paid,r.expected);assert.equal(r.once,true);assert.equal(r.homeDamaged,true);assert.equal(r.carDamaged,true);assert.equal(r.queued,2);
});
test('real estate licensing, work exclusivity and stale job confirmation are enforced',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`var r=realEstateState();realEstateStart();var noEarly=!realEstateActive();for(var i=0;i<3;i++){realEstateTrain();realEstateTrain();g.age++;}var qualified=r.license&&r.training===3;g.pt=[{t:'Part timer',pay:100}];realEstateStart();var blocked=!realEstateActive();g.pt=[];realEstateStart();var active=realEstateActive();hire('ft',0);collegeConfirmJob('ft',0);applyIntern();eduInternApply(0);var exclusive=realEstateActive()&&!g.intern&&!g.pt.length;({noEarly,qualified,blocked,active,exclusive})`);assert.deepEqual(r,{noEarly:true,qualified:true,blocked:true,active:true,exclusive:true});
});
test('client transactions require each stage, disclose issues, pay commission once and retain limits through saves',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`var r=realEstateState();r.license=true;realEstateStart();realEstateLead();var c=r.clients[0],cash=g.cash;realEstateClientAction(c.id,'close');var guarded=cash===g.cash;realEstateClientAction(c.id,'brief');realEstateClientAction(c.id,'search');realEstateClientAction(c.id,'offer',2);var expensive=c.stage==='Viewings';var random=Math.random;Math.random=()=>.01;realEstateClientAction(c.id,'offer',1);var issue=!!c.issue;realEstateClientAction(c.id,'close');var notClosed=c.stage!=='Closed';realEstateClientAction(c.id,'disclose');realEstateClientAction(c.id,'close');Math.random=random;var after=g.cash;realEstateClientAction(c.id,'close');var once=g.cash===after;var commission=c.commission;var saved=save(1,'life');loadFrom(1);r=realEstateState();var effort=r.effort;realEstateLead();var limited=r.effort<=8;({guarded,expensive,issue,notClosed,once,commission,saved,effort,limited,closed:r.closed,earnings:r.earnings})`);for(const k of ['guarded','expensive','issue','notClosed','once','saved','limited'])assert.equal(r[k],true,k);assert.ok(r.commission>0);assert.equal(r.closed,1);assert.equal(r.earnings,r.commission);assert.ok(r.effort>0);
});
test('career firm growth, client expiry and annual overhead settle once',async t=>{
 const p=await setup(t);await born(p);await ready(p);
 const r=await run(p,`var r=realEstateState();r.license=true;realEstateStart();r.closed=3;r.reputation=60;realEstateUpgrade();var level=r.level;realEstateLead();g.age+=3;var cash=g.cash;realEstateYear();var overhead=cash-g.cash;realEstateYear();({level,overhead,expected:pr(1200),once:cash-g.cash===overhead,lost:r.clients[0].stage})`);assert.equal(r.level,2);assert.equal(r.overhead,r.expected);assert.equal(r.once,true);assert.equal(r.lost,'Lost');
});
test('housing and career saves reject malformed records without changing active life',async t=>{
 const p=await setup(t);await born(p);await ready(p);await run(p,'realEstateState();save(0,"life")');
 for(const mutation of ['r.data.housing.history={}','r.data.home.monthlyRent=-50','r.data.realEstate.clients={}','r.data.realEstate.level=9'])assert.equal(await run(p,`var raw=localStorage.getItem('bt_slot_0'),r=JSON.parse(raw);${mutation};var rejected=false;try{SaveStore.parse(JSON.stringify(r))}catch(e){rejected=true}rejected&&localStorage.getItem('bt_slot_0')===raw`),true,mutation);
});
test('compact categories preserve every catalog item, equal tabs and housing menus work at 320 pixels',async t=>{
 const p=await setup(t,{width:320,height:568});await born(p);await ready(p);await run(p,"tab='Stuff';stuffShopTab='Cars';draw()");
 assert.equal(await p.locator('.info details.card').count(),6);
 await p.getByLabel('Category',{exact:true}).last().selectOption('Trucks');assert.match(await p.locator('.info').innerText(),/Trucks/);
 const sizes=await p.locator('.nav .tab').evaluateAll(els=>els.map(x=>x.getBoundingClientRect().width));assert.equal(sizes.length,5);assert.ok(Math.max(...sizes)-Math.min(...sizes)<1);
 await p.getByRole('button',{name:'Residence, landlord & homes to rent',exact:true}).click();await p.getByRole('button',{name:'Talk with landlord',exact:true}).click();await p.getByRole('button',{name:'Listen, document the need and follow through',exact:true}).click();await run(p,'g.result=null;g.msq=[];draw()');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await run(p,"stuffSelected=null;tab='Work';wsel=null;wsub=null;draw()");assert.equal(await p.getByRole('button',{name:/^Education journey/}).count(),1);assert.equal(await p.getByRole('button',{name:'Education',exact:true}).count(),0);await p.getByRole('button',{name:'Special career',exact:true}).click();await p.getByRole('button',{name:/^Real estate /}).click();assert.equal(await p.getByRole('heading',{name:'Real estate special career'}).count(),1);
});
test('annual renter payment uses this year salary before recording arrears',async t=>{
 const p=await setup(t);await born(p);await ready(p);const r=await run(p,`housingRent(0);g.cash=0;g.job={t:'QA employee',f:'office',sp:0,pay:100000,yrs:0};g.event=null;g.result=null;g.msq=[];g.ysum=null;g.hsPopup=null;g.medical.queue=[];ageUp();({arrears:g.home.arrears,paid:g.led['Residence rent'],expected:-g.home.monthlyRent*12,salary:g.fin.gr})`);assert.equal(r.arrears,0);assert.equal(r.paid,r.expected);assert.ok(r.salary>0);
});
test('negotiation, mediation, burglary security and robbery cannot repeat benefits',async t=>{
 const p=await setup(t);await born(p);await ready(p);const r=await run(p,`housingRent(1);var h=g.home;h.proposedRent=Math.round(h.monthlyRent*1.04);var random=Math.random;Math.random=()=>.01;housingAction(h.id,'negotiate');Math.random=random;var unchanged=h.proposedRent===h.monthlyRent;h.issue='Broken heating';h.condition=40;var cash=g.cash;housingAction(h.id,'mediate');var fee=cash-g.cash;housingAction(h.id,'mediate');var limited=cash-g.cash===fee;housingQueueIncident('Street robbery');var event=g.housing.incidents[0];cash=g.cash;housingResolveIncident({id:event.id,repair:true});var robbery=cash-g.cash;housingResolveIncident({id:event.id,repair:true});var once=cash-g.cash===robbery;var r=realEstateState();r.license=true;realEstateStart();wsel=null;wsub=null;var careerCard=workV().includes('Commission-based');({unchanged,resolved:!h.issue,fee,expected:pr(120),limited,robbery,once,careerCard})`);assert.equal(r.unchanged,true);assert.equal(r.resolved,true);assert.equal(r.fee,r.expected);assert.equal(r.limited,true);assert.ok(r.robbery>0);assert.equal(r.once,true);assert.equal(r.careerCard,true);
});
test('property and career menus retain keyboard labels and pass accessibility checks',async t=>{
 const p=await setup(t);await born(p);await ready(p);await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 for(const view of ['housingOpen()','realEstateOpen()',"tab='Stuff';stuffSelected=null;stuffShopTab='Property';draw()"]){await run(p,view);const violations=await p.evaluate(async()=>{const r=await axe.run('.info',{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}});return r.violations.map(x=>({id:x.id,description:x.description}));});assert.deepEqual(violations,[],view);}
});
