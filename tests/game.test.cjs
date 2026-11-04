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
test('startup, labelled name entry, five sections, and test shop',async t=>{
 const p=await setup(t);await p.getByRole('button',{name:'Settings',exact:true}).click();assert.equal(await p.getByRole('heading',{name:'Settings',exact:true}).count(),1);await p.getByRole('button',{name:'Close',exact:true}).click();await p.getByRole('button',{name:'Shop',exact:true}).click();assert.match(await p.locator('main').innerText(),/Simulation only/);assert.equal(await p.getByRole('button',{name:/^Buy /}).count(),0);
 await run(p,"go('title')");await p.getByRole('button',{name:'Create your own life',exact:true}).click();assert.equal(await p.getByLabel('Your name').count(),1);await p.getByRole('button',{name:'Be born',exact:true}).click();
 await p.getByRole('button',{name:'Begin your life',exact:true}).click();await run(p,'g.msq=[];draw()');for(const name of ['Work','Stuff','Life','Relationships','Other']){await p.getByRole('button',{name,exact:true}).click();assert.equal(await p.locator('.info').count(),1);}
});
test('consultation charges once for either outcome and refuses insufficient funds',async t=>{
 const p=await setup(t);await born(p);
 for(const possible of [true,false]){const r=await run(p,`g.age=25;g.country='United States';g.nat=g.w[g.country].n;g.ins.health=0;g.cash=medicalQuote(250);relationshipRepro().testAge=-1;relationshipRepro().naturalPossible=${possible};fertilityTest();({cash:g.cash,known:g.repro.known})`);assert.equal(r.cash,0);assert.equal(r.known,true);}
 assert.equal(await run(p,'relationshipRepro().testAge=-1;g.cash=medicalQuote(250)-1;var beforeCash=g.cash;fertilityTest();g.cash===beforeCash'),true);
});
test('active pregnancy blocks UI, handler and stale effects without payment',async t=>{
 const p=await setup(t);await born(p);
 for(const method of ['ivf','donor','surrogacy']){
 const r=await run(p,`g.age=25;g.cash=1000000;g.event=null;g.repro.pregnancy={dueAge:26,method:'Natural birth',prenatal:true,prepared:true};var original=JSON.stringify(g.repro.pregnancy);relationshipFamilyMethod('${method}');var noEvent=!g.event;E({familyPlan:'${method}',m:-12000});relationshipRunFamilyPlan('${method}');({unchanged:JSON.stringify(g.repro.pregnancy)===original,cash:g.cash,noEvent,html:familyPlanningView()})`);
 assert.equal(r.unchanged,true);assert.equal(r.cash,1000000);assert.equal(r.noEvent,true);
 }
 await run(p,"document.querySelector('.info').innerHTML=familyPlanningView()");for(const name of [/^IVF treatment/,/^Donor conception/,/^Surrogacy/])assert.equal(await p.getByRole('button',{name}).isDisabled(),true);
 assert.equal(await p.getByRole('button',{name:/^Adoption /}).isEnabled(),true);
});
test('successful conception and birth preserve child identity and create only one child',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=25;g.health=100;g.rel.push({id:'qa-partner',n:'QA Partner',t:'fam',role:'Partner',bond:80,age:25,alive:true});g.repro.naturalPossible=true;var random=Math.random;Math.random=()=>.01;var conceived=relationshipConceptionAttempt().ok;Math.random=random;var beforeChildren=kids().length;g.age=26;yearly();var child=kids().at(-1);var afterBirth=kids().length;yearly();({conceived,added:afterBirth-beforeChildren,repeat:kids().length-afterBirth,pregnancy:g.repro.pregnancy,origin:child.origin})`);
 assert.deepEqual(r,{conceived:true,added:1,repeat:0,pregnancy:null,origin:'Natural birth'});
});
test('save versioning, legacy migration and export/import preserve state',async t=>{
 const p=await setup(t);await born(p);
 assert.equal(await run(p,"g.name='QA Test';g.cash=12345;save(0,'life')"),true);
 const record=await run(p,"JSON.parse(localStorage.getItem('bt_slot_0'))");assert.equal(record.version,1);
 assert.equal(await run(p,"var legacy=JSON.parse(localStorage.getItem('bt_slot_0'));delete legacy.version;localStorage.setItem('bt_slot_1',JSON.stringify(legacy));loadFrom(1);g.cash"),12345);
 await run(p,"openSlots('game')");const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'Export slot 1',exact:true}).click();const download=await downloadPromise;const text=fs.readFileSync(await download.path(),'utf8');assert.equal(JSON.parse(text).data.cash,12345);
 await p.locator('#import-slot-2').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await p.waitForFunction(()=>localStorage.getItem('bt_slot_2')!==null);
 assert.equal(await run(p,"g.cash=0;loadFrom(2);g.cash"),12345);
});
test('malformed and future saves are rejected without replacing stored data or active life',async t=>{
 const p=await setup(t);await born(p);await run(p,"save(0,'life')");
 for(const mutation of ['r.version=99','r.data.age=-1','r.data.rel={}','r.data.name="<img src=x>"','r.data.cash="oops"','r.kind="unknown"']){
 const unchanged=await run(p,`var old=localStorage.getItem('bt_slot_0'),name=g.name;var r=JSON.parse(old);${mutation};var rejected=false;try{SaveStore.importText(JSON.stringify(r),0)}catch(e){rejected=true}rejected&&old===localStorage.getItem('bt_slot_0')&&g.name===name`);assert.equal(unchanged,true,mutation);
 }
 p.once('dialog',d=>d.dismiss());assert.equal(await run(p,"SaveStore.importText(localStorage.getItem('bt_slot_0'),0)"),false);
});
test('historical save round-trip and initial decision for both presidents',async t=>{
 const p=await setup(t);assert.equal(await run(p,"PRES.every(p=>{hs(p.id);hp(0);hn();if(!save(0,'hist'))return false;var id=h.id,i=h.i;loadFrom(0);return h.id===id&&h.i===i})"),true);
});
test('seeded annual progression reaches high-school graduation once',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`var ages=[];for(var i=0;i<18;i++){g.event=null;g.result=null;g.ysum=null;g.msq=[];g.msReport=null;g.msTrainPopup=null;g.hsPopup=null;g.hsQueue=[];g.health=100;if(g.age>=14&&g.age<=17){var h=hsEnsure();HS_SUBJECTS.forEach(s=>{h.current.subjects[s].score=90;h.current.subjects[s].tasks.study=1;});}ageUp();ages.push(g.age);if(!save(4,'life'))throw Error('Save failed at age '+g.age);for(var section of ['Work','Stuff','Life','Rel','Other']){tab=section;draw();}}({ages,edu:g.edu,graduated:g.highSchool.graduated,middleYears:g.middle.years.length})`);
 assert.deepEqual(r.ages,Array.from({length:18},(_,i)=>i+1));assert.equal(r.edu,1);assert.equal(r.graduated,true);assert.equal(r.middleYears,3);
});
test('mobile containment, scroll, modal keyboard trap and focus restoration',async t=>{
 const p=await setup(t,{width:320,height:568});await born(p);
 await run(p,"g.msq=[];g.event=null;g.result=null;g.ysum=null;tab='Stuff';draw()");
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await p.locator('.info').evaluate(el=>{el.scrollTop=100;return el.scrollTop>0}),true);
 await p.getByRole('button',{name:'Relationships',exact:true}).focus();
 await run(p,"g.event={x:'Keyboard test',c:[['First',{},'Done'],['Second',{},'Done']]};draw()");
 const dialog=p.getByRole('dialog',{name:'Keyboard test'});assert.equal(await dialog.count(),1);
 assert.equal(await p.evaluate(()=>document.activeElement.textContent),'First');await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.textContent),'Second');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.textContent),'First');
 await run(p,'g.event=null;draw()');assert.equal(await p.evaluate(()=>document.activeElement.textContent),'Relationships');
});
test('representative screens meet automated contrast, labels and dialog checks in both themes',async t=>{
 const p=await setup(t);await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 for(const theme of ['dark','light']){
  for(const screen of ['title','slots','game','family','modal']){
   await run(p,`ST.theme='${theme}';applyTheme();start();begin();g.event=null;g.msq=[];g.result=null;g.ysum=null;g.age=25;relationshipRepro();`+(screen==='title'?"go('title')":screen==='slots'?"openSlots('game')":screen==='family'?"go('game');document.querySelector('.info').innerHTML=familyPlanningView()":screen==='modal'?"go('game');g.event={x:'An important choice',c:[['Continue',{},'Done']]};draw()":"go('game')"));
   const violations=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'rule',values:['color-contrast','button-name','label','aria-dialog-name','aria-valid-attr-value']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}));});
   assert.deepEqual(violations,[],`${theme} ${screen}`);
  }
 }
});
test('education journey connects preschool, every school stage, and college menus',async t=>{
 const p=await setup(t);await born(p);
 for(const age of [3,5,8,11,14,17,18]){
  await run(p,`g.age=${age};g.edu=1;g.event=null;g.result=null;g.msq=[];g.msReport=null;g.hsPopup=null;g.hsQueue=[];wsel=null;tab='Work';draw()`);
  await p.getByRole('button',{name:/^Education journey/}).click();assert.equal(await p.getByRole('heading',{name:'Education journey',exact:true}).count(),1);
  await p.getByRole('button',{name:age<18?'Open classroom':'College & current program',exact:true}).click();assert.ok((await p.locator('.info').innerText()).length>200);
 }
});
test('preschool is playable, age-limited and hands developmental reports to kindergarten',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=3;g.event=null;g.msq=[];eduPreschool();var skill=eduPreschool().skills['Language and stories'];eduPreschoolAction('Language and stories');var once=eduPreschool().skills['Language and stories'];eduPreschoolAction('Language and stories');var twice=eduPreschool().skills['Language and stories'];for(var i=0;i<2;i++){g.event=null;g.result=null;g.ysum=null;g.msq=[];g.msReport=null;g.hsPopup=null;g.hsQueue=[];ageUp();}({once:once-skill,twice:twice-once,age:g.age,reports:eduState().preschool.years.length,readiness:ensureElem().skills.English,html:eduTranscript()})`);
 assert.equal(r.once,12);assert.equal(r.twice,0);assert.equal(r.age,5);assert.equal(r.reports,2);assert.ok(r.readiness>0);assert.match(r.html,/no GPA/);
});
test('school decisions change learning, block aging while open and cannot repeat',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=11;g.event=null;g.result=null;g.msq=[];g.msReport=null;g.hsPopup=null;ensureMiddle();var before=ensureMiddle().current.subjects.Math.score;eduSchoolEvent();var title=g.eduPopup.title;ageUp();var blocked=g.age===11;eduChoose(0);var after=ensureMiddle().current.subjects.Math.score;eduSchoolEvent();({blocked,gain:after-before,again:!!g.eduPopup,record:eduState().events[11]===title})`);
 assert.equal(r.blocked,true);assert.ok(r.gain>0);assert.equal(r.again,false);assert.equal(r.record,true);
});
test('conventional grade points and educational report state survive save/load',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=8;ensureElem();eduArchiveYear(8);g.age=11;var m=ensureMiddle();MS_SUBJECTS.forEach(s=>{m.current.subjects[s].score=50;m.current.subjects[s].tasks.study=1;});g.smarts=50;g.iq=100;msRecalcGPA();var failing=m.gpa;var saved=save(3,'life');g.educationJourney=null;loadFrom(3);({failing,saved,reports:eduState().elementaryReports.length,html:eduTranscript(),points:[eduGradePoint(59),eduGradePoint(73),eduGradePoint(93)]})`);
 assert.equal(r.failing,0);assert.equal(r.saved,true);assert.equal(r.reports,1);assert.match(r.html,/Grade 3/);assert.deepEqual(r.points,[0,2,4]);
});
test('college admission, prerequisites, scholarship cap and enrollment are enforced',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=18;g.edu=0;var blocked=!collegeCanAccess('university');eduEquivalency();eduEquivalency();eduEquivalency();g.smarts=100;g.iq=130;g.gpa=4;collegeMajor='Computer Science';collegeMinor='Mathematics';var random=Math.random;Math.random=()=>.01;var row=COLLEGE_GROUPS.university[0];collegeApply('university',row[0],row[1],row[2]);Math.random=random;var app=collegeEnsure().applications.at(-1);collegeAidApply(app.id);var capped=app.scholarship+app.aid<=app.tuition;g.hsPopup=null;collegeStart(app.id);var current=collegeEnsure().current;({blocked,equivalency:g.edu>=1,status:app.status,capped,school:current.name,major:current.major,minor:current.minor,professors:current.professors.length,peers:current.peers.length})`);
 assert.equal(r.blocked,true);assert.equal(r.equivalency,true);assert.equal(r.status,'Accepted');assert.equal(r.capped,true);assert.equal(r.major,'Computer Science');assert.equal(r.minor,'Mathematics');assert.equal(r.professors,3);assert.equal(r.peers,6);
});
test('college academic year bills once, prevents repeat credits and preserves coursework',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=18;g.edu=1;g.event=null;g.result=null;g.msq=[];g.hsPopup=null;g.hsQueue=[];g.cash=100;g.sloan=0;collegeCurrentFrom('Test University','university','Computer Science','Mathematics',{tuition:1000});var c=collegeEnsure().current;c.room=0;c.books=0;c.fees=0;collegeDefaultSchedule(c);eduCourseAction(0,'attend');var keys=Object.keys(c.courseWork).length;g.msq=[];collegeFinishYear();g.hsPopup=null;g.hsQueue=[];collegeFinishYear();var debt=g.sloan,credits=Object.values(c.credits).reduce((n,x)=>n+x,0),years=c.years.length;g.hsPopup=null;g.hsQueue=[];collegeFinishYear();({debt,cash:g.cash,bills:eduState().bills.length,credits,repeatCredits:Object.values(c.credits).reduce((n,x)=>n+x,0),years,repeatYears:c.years.length,keys,saved:save(4,'life')})`);
 assert.equal(r.debt,900);assert.equal(r.cash,0);assert.equal(r.bills,1);assert.equal(r.repeatCredits,r.credits);assert.equal(r.repeatYears,r.years);assert.equal(r.keys,1);assert.equal(r.saved,true);
});
test('cash-only funding blocks progression and failed classes earn no credits',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=18;g.edu=1;g.event=null;g.result=null;g.msq=[];g.hsPopup=null;g.hsQueue=[];g.cash=0;collegeCurrentFrom('Test College','university','Business','None');var c=collegeEnsure().current;c.autoLoan=false;collegeFinishYear();ageUp();var blocked=c.yearsElapsed===0&&g.age===18;c.autoLoan=true;c.performance=0;g.smarts=0;g.iq=50;c.schedule=[{name:'Difficult class',type:'GE',credits:3}];var random=Math.random;Math.random=()=>0;collegeFinishYear();g.hsPopup=null;g.hsQueue=[];collegeFinishYear();Math.random=random;({blocked,passed:c.years[0].courses[0].passed,credits:c.credits.ge,gpa:c.gpa,standing:c.standing})`);
 assert.equal(r.blocked,true);assert.equal(r.passed,false);assert.equal(r.credits,0);assert.equal(r.gpa,0);assert.equal(r.standing,'Academic probation');
});
test('four funded college years graduate with major, minor and archived transcript',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=18;g.edu=1;g.cash=1000000;g.smarts=100;g.iq=130;collegeCurrentFrom('Test University','university','Computer Science','Mathematics',{tuition:1000});for(var i=0;i<4;i++){g.event=null;g.result=null;g.ysum=null;g.msq=[];g.msReport=null;g.msTrainPopup=null;g.hsPopup=null;g.hsQueue=[];g.health=100;var c=collegeEnsure().current;if(!c)break;c.performance=100;for(var a=0;a<8;a++)c.yearActions[c.year+':'+a]=true;ageUp();}({age:g.age,current:!!collegeEnsure().current,degrees:collegeEnsure().degrees,bills:eduState().bills.length,popup:g.hsPopup.type})`);
 assert.equal(r.age,22);assert.equal(r.current,false);assert.equal(r.degrees.length,1);assert.equal(r.degrees[0].major,'Computer Science');assert.equal(r.degrees[0].minor,'Mathematics');assert.equal(r.degrees[0].transcript.length,4);assert.equal(r.bills,4);assert.equal(r.popup,'college-report');
});
test('campus friends, internships, scholarships and Greek organizations connect to life state',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=19;g.edu=1;g.cash=0;g.event=null;g.msq=[];collegeCurrentFrom('Test College','university','Biology','None');var c=collegeEnsure().current;c.gpa=4;var peer=c.peers[0];peer.bond=80;collegePersonAction('peer',peer.id,4);collegePersonAction('peer',peer.id,4);var random=Math.random;Math.random=()=>.01;eduInternApply(0);Math.random=random;eduInternComplete(0);var cash=g.cash;eduInternComplete(0);eduScholarship(0);var award=c.aid.scholarship;eduScholarship(0);({friends:g.rel.filter(x=>x.id===peer.id).length,friendRole:g.rel.find(x=>x.id===peer.id).role,paid:cash>0,noDoublePay:g.cash===cash,experience:g.exp.publicservice,award,unchangedAward:c.aid.scholarship===award,greek:collegeRushPage()})`);
 assert.equal(r.friends,1);assert.equal(r.friendRole,'Friend');assert.equal(r.paid,true);assert.equal(r.noDoublePay,true);assert.equal(r.experience,1);assert.ok(r.award>0);assert.equal(r.unchangedAward,true);assert.match(r.greek,/Sorority/);
});
test('failing final high-school classes require equivalency before college',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=17;g.edu=0;g.event=null;g.result=null;g.msq=[];g.hsPopup=null;g.hsQueue=[];var h=hsEnsure();HS_SUBJECTS.forEach(s=>h.current.subjects[s].score=0);ageUp();({age:g.age,diploma:g.edu,graduated:g.highSchool.graduated,eligible:collegeCanAccess('university'),popup:g.hsPopup.title})`);
 assert.equal(r.age,18);assert.equal(r.diploma,0);assert.equal(r.graduated,false);assert.equal(r.eligible,false);assert.equal(r.popup,'High-school qualification incomplete');
});
test('education screens remain usable on mobile with accessible dialogs and controls',async t=>{
 const p=await setup(t,{width:320,height:568});await born(p);await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 for(const age of [3,11,16,19]){
  await run(p,`g.age=${age};g.edu=1;g.event=null;g.result=null;g.msq=[];g.msReport=null;g.hsPopup=null;g.hsQueue=[];eduOpen('home')`);
  if(age>=18)await run(p,"collegeCurrentFrom('Test College','university','Biology','None');eduOpen()");await p.getByRole('button',{name:'School-year decision',exact:true}).click();
  if(age<=19){assert.equal(await p.getByRole('dialog').count(),1);await p.getByRole('dialog').getByRole('button').first().click();}
  await run(p,"eduOpen('classroom')");
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const errors=await p.evaluate(async()=>{return (await axe.run(document,{runOnly:{type:'rule',values:['button-name','label','aria-dialog-name','color-contrast']}})).violations.map(v=>({id:v.id,html:v.nodes.map(n=>n.html)}));});assert.deepEqual(errors,[],`Age ${age}`);
 }
});
test('semesters share an annual bill, restrict class tasks and persist midterm state',async t=>{
 const p=await setup(t);await born(p);
 const r=await run(p,`g.age=18;g.edu=1;g.event=null;g.result=null;g.msq=[];g.hsPopup=null;g.cash=1000000;collegeCurrentFrom('Semester College','university','Business','None');var c=collegeEnsure().current;collegeDefaultSchedule(c);var cal=eduCalendar(c);eduCourseAction(8,'study');var blocked=!c.courseWork;eduCourseAction(0,'study');var spent=cal.used;g.msq=[];eduFinishSemester();var semester=cal.semester,first=c.semesterHistory.length;var saved=save(0,'life');loadFrom(0);c=collegeEnsure().current;var restored=eduCalendar(c).semester;g.hsPopup=null;g.msq=[];eduFinishSemester();({blocked,spent,semester,first,saved,restored,terms:c.semesterHistory.length,years:c.years.length,bills:eduState().bills.length})`);
 assert.equal(r.blocked,true);assert.equal(r.spent,2);assert.equal(r.semester,2);assert.equal(r.first,1);assert.equal(r.saved,true);assert.equal(r.restored,2);assert.equal(r.terms,2);assert.equal(r.years,1);assert.equal(r.bills,1);
});
test('student workload competes with employment and restores energy with limited breaks',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=19;collegeCurrentFrom('Time College','university','Business','None');var c=collegeEnsure().current,cal=eduCalendar(c),free=eduTimeLimit();g.job={t:'Office assistant',f:'general',pay:30000};var employed=eduTimeLimit();cal.used=employed;var before=c.performance;collegeStudyAction(0);var unchanged=c.performance===before;cal.used=0;cal.energy=20;eduRest();eduRest();eduRest();({free,employed,unchanged,rests:cal.rests,energy:cal.energy,used:cal.used})`);
 assert.equal(r.free,48);assert.equal(r.employed,32);assert.equal(r.unchanged,true);assert.equal(r.rests,2);assert.equal(r.energy,70);assert.equal(r.used,2);
});
test('transfer evaluation retains earned categories, clears target GPA and cannot duplicate an offer',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=20;g.edu=1;g.event=null;g.msq=[];collegeCurrentFrom('Source College','community','Business','Mathematics');var c=collegeEnsure().current;c.gpa=3.5;c.credits={ge:36,major:30,minor:6};c.yearsElapsed=2;var random=Math.random;Math.random=()=>.01;eduTransferApply(COLLEGE_GROUPS.university[0][0]);Math.random=random;eduTransferAccept();eduTransferAccept();var target=collegeEnsure().current;({credits:target.transferCredits,ge:target.credits.ge,major:target.credits.major,gpa:target.gpa,residency:target.requirements.years,records:eduState().transfers.length})`);
 assert.deepEqual(r,{credits:60,ge:30,major:30,gpa:0,residency:2,records:1});
});
test('scholarships suspend and restore at term-GPA renewal reviews',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=19;collegeCurrentFrom('Aid College','university','Biology','None',{tuition:10000});var c=collegeEnsure().current;c.aid.scholarship=2000;eduCalendar(c);c.year=2;c.semesterHistory=[{gpa:2.1}];eduCalendar(c);var suspended=c.aid.scholarship;c.year=3;c.semesterHistory.push({gpa:3.5});eduCalendar(c);({suspended,restored:c.aid.scholarship,status:c.renewableAid.status})`);assert.equal(r.suspended,0);assert.equal(r.restored,2000);assert.match(r.status,/Renewed/);
});
test('student debt accrues once, respects enrollment/grace, changes plans and caps extra payment',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=20;g.sloan=10000;g.cash=200;collegeCurrentFrom('Debt College','university','Business','None');var inSchool=eduLoanPayroll(50000);var after=g.sloan;eduLoanPayroll(50000);var once=g.sloan===after;collegeEnsure().current=null;g.age=21;var grace=eduLoanPayroll(50000);g.age=22;eduChooseLoanPlan('income');var due=eduLoanPayroll(50000);eduExtraLoan(999999);({inSchool,after,once,grace,due,cash:g.cash,balance:g.sloan,history:eduLoanPlan().history.length})`);assert.equal(r.inSchool,0);assert.equal(r.after,10500);assert.equal(r.once,true);assert.equal(r.grace,0);assert.ok(r.due>=0);assert.equal(r.cash,0);assert.equal(r.history,4);assert.ok(r.balance>0);
});
test('Jobs: catalog cards, career panels, raises, retirement and annual contributions',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=35;g.edu=4;g.cash=100000;g.event=null;g.msq=[];var cards=Object.entries(JB).flatMap(([kind,list])=>list.map((j,i)=>collegeJobPreview(kind,i)));g.job={t:JB.ft[0][0],f:JB.ft[0][1],pay:50000,yrs:3,sp:0};jobUpdateOnHire(g.job);var panels=['home','boss','colleagues','reviews','retirement','retirement-change'].map(page=>{jobUpdateCareerPage=page;return jobUpdateCareerView('ft',-1).length});var random=Math.random;Math.random=()=>.01;jobUpdateBossAction('raise','ft',-1);var pay=g.job.pay;jobUpdateBossAction('raise','ft',-1);var raiseOnce=pay===g.job.pay;jobUpdateSetContribution(4);payday();var plan=jobUpdatePlan(),amount=plan.employeeTotal,match=plan.employerTotal,balance=plan.balance;Math.random=random;g.age=60;g.job.companyYears=20;jobUpdateRetire401();({cards:cards.length,panels,raiseOnce,amount,match,balance,retired:g.ret,account:plan.balance})`);
 assert.ok(r.cards>100);assert.ok(r.panels.every(n=>n>100));assert.equal(r.raiseOnce,true);assert.ok(r.amount>0);assert.equal(r.amount,r.match);assert.ok(r.balance>=r.amount+r.match);assert.equal(r.retired,true);assert.equal(r.account,0);
});
test('Stuff: cash/financed purchases, maintenance, gifting restrictions and sale settlement',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=10000000;g.lic.push(DL);g.event=null;g.msq=[];stuffStartPurchase('car',0);var price=stuffPurchaseOffer.price,startCash=g.cash;stuffCompletePurchase('cash');var car=g.car,bought=startCash-g.cash===price;stuffMaintainCar(car.id);var after=g.cash;stuffMaintainCar(car.id);var once=g.cash===after;stuffStartPurchase('home',0);var homePrice=stuffPurchaseOffer.price;stuffFinanceDown=20;stuffCompletePurchase('finance');var home=g.home,loan=stuffFindLoan(home.id,'home'),friend=g.rel.find(r=>r.alive&&r.role!=='Pet');stuffGiftItem('home',home.id,friend.id);var blocked=!!stuffAsset('home',home.id);var beforeSale=g.cash;stuffSell('home',home.id);({bought,once,loan,homePrice,blocked,sold:!stuffAsset('home',home.id),settled:stuffFindLoan(home.id,'home'),proceeds:g.cash-beforeSale})`);
 assert.equal(r.bought,true);assert.equal(r.once,true);assert.ok(r.loan>0);assert.equal(r.blocked,true);assert.equal(r.sold,true);assert.equal(r.settled,0);assert.equal(r.proceeds,r.homePrice-r.loan);
});
test('Stuff: insured losses allocate one payout across multiple linked loans',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.ins.car=1;g.car={id:'insurance-car',n:'QA Car',v:10000,condition:80};g.xc=[];g.loans=[{assetId:'insurance-car',bal:6000},{assetId:'insurance-car',bal:6000}];var cash=g.cash,expected=Math.max(0,Math.round(10000*.78)-pr(750));stuffApplyIncident({kind:'car',id:'insurance-car',action:'car-total'});({expected,reduction:12000-g.loans.reduce((n,l)=>n+l.bal,0),cash:g.cash-cash,removed:!g.car})`);assert.equal(r.reduction,r.expected);assert.equal(r.cash,0);assert.equal(r.removed,true);
});
test('Relationships: living categories, child planning, grief and remembrance limits',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=100000;g.event=null;g.msq=[];var child=relationshipAddChild('Adopted',3);var categories=relationshipCategories().map(x=>x.label);var parent=g.rel.find(x=>x.role==='Mother'||x.role==='Father');var before=parent.bond;relationshipInteract(parent.id,'parent-talk');pick(0);var bonded=parent.bond>before;parent.alive=false;parent.deceased=true;parent.deathAge=60;parent.deathAt=g.age;var cash=g.cash;relationshipMourn(parent.id,'memorial');var charged=cash-g.cash;var once=g.cash;relationshipMourn(parent.id,'memorial');var unchanged=g.cash===once;sel=parent.id;var text=relationshipView();({categories,childAge:child.age,bonded,charged,expected:pr(300),unchanged,text})`);
 assert.ok(r.categories.includes('Children'));assert.equal(r.childAge,3);assert.equal(r.bonded,true);assert.equal(r.charged,r.expected);assert.equal(r.unchanged,true);assert.ok(!r.text.includes('${loc('),'Memorial price must be interpolated');
});
test('Other: every top category and subpanel renders without runtime errors',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=1000000;g.edu=4;g.event=null;g.msq=[];var checked=[];for(var [top] of OMENU){NV.O=[top];checked.push({path:top,size:otherV().length});for(var [sub] of OSUB[top]||[]){NV.O=[top,sub];checked.push({path:top+'/'+sub,size:otherV().length});}}NV.O=['Licenses'];checked.push({path:'Licenses',size:otherV().length});checked`);
 assert.equal(r.length,await run(p,"OMENU.length+Object.values(OSUB).reduce((n,list)=>n+list.length,0)+1"));for(const item of r)assert.ok(item.size>20,item.path);
});
test('Other: license display and payment use the same country price',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=1000000;g.lic=[];var i=LICS.findIndex(x=>x[0]!==DL&&x[0]!==PERMIT),entry=LICS[i],price=pr(entry[1]),cash=g.cash;var random=Math.random;Math.random=()=>.01;buyLic(i);Math.random=random;({price,paid:cash-g.cash,held:g.lic.includes(entry[0])})`);assert.equal(r.paid,r.price);assert.equal(r.held,true);
});
test('Other: banking, personal loans, investing, giving and health preserve money invariants',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=100000;g.event=null;g.msq=[];openBank(0);var total=g.cash+g.bank.chk+g.bank.sav;bk('ds',5000);bk('ws',2000);var conserved=g.cash+g.bank.chk+g.bank.sav===total;var cash=g.cash;loanNew(1000);var newLoan=g.loans.length-1;payLoan(newLoan,1000);var noFreeCash=g.cash===cash;var beforeInvest=g.cash;put('stock',1000);takeOut('stock');var investment=g.cash===beforeInvest;var beforeGift=g.cash;give(100);var donated=beforeGift-g.cash;var beforeHealth=g.cash;g.cash=0;checkup(0,false);var noUnaffordableCharge=g.cash===0;({conserved,noFreeCash,investment,donated,noUnaffordableCharge})`);assert.deepEqual(r,{conserved:true,noFreeCash:true,investment:true,donated:100,noUnaffordableCharge:true});
});
test('Stuff: every shopping/owned category and asset details render; rent toggles and gifts persist',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=10000000;g.event=null;g.msq=[];var shops=['Cars','Property','Jewelry','Vehicles','Pets','Investments'].map(x=>{stuffShopTab=x;return stuffShopView().length});g.car={id:'qa-car',n:'QA car',v:10000};g.home={id:'qa-home',n:'QA home',v:100000,own:true,rented:false};g.lux=[{id:'qa-lux',n:'QA watch',v:1000}];g.boats=[{id:'qa-boat',n:'QA boat',v:5000}];g.planes=[{id:'qa-plane',n:'QA plane',v:10000}];stuffEnsureIds();var owned=['Cars','Property','Misc'].map(x=>stuffOwnedList(x).length);var details=[['car','qa-car'],['home','qa-home'],['lux','qa-lux'],['boat','qa-boat'],['plane','qa-plane']].map(([k,id])=>stuffItemDetail(k,id).length);stuffRentToggle('qa-home');var income=stuffMonthlyRent(g.home);var friend=g.rel.find(r=>r.alive&&r.role!=='Pet'),bond=friend.bond;stuffGiftItem('lux','qa-lux',friend.id);var gifted=!stuffAsset('lux','qa-lux')&&friend.bond>=bond;var saved=save(1,'life');loadFrom(1);({shops,owned,details,income,gifted,saved,rented:g.home.rented})`);assert.ok(r.shops.every(x=>x>100));assert.ok(r.owned.every(x=>x>100));assert.ok(r.details.every(x=>x>100));assert.ok(r.income>0);assert.equal(r.gifted,true);assert.equal(r.saved,true);assert.equal(r.rented,true);
});
test('Stuff: local-currency upkeep is a percentage of local asset value, not converted twice',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=10000000;g.car={id:'cost-car',n:'QA car',v:1000000};g.home={id:'cost-home',n:'QA home',v:5000000,own:true};var cash=g.cash;stuffMaintainCar('cost-car');var carCost=cash-g.cash;cash=g.cash;stuffMaintainHome('cost-home');({carCost,expectedCar:Math.max(pr(250),25000),homeCost:cash-g.cash,expectedHome:Math.max(pr(300),20000)})`);assert.equal(r.carCost,r.expectedCar);assert.equal(r.homeCost,r.expectedHome);
});
test('Relationships: every relationship group supports detail actions and remembrance cannot repeat',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=100000;g.event=null;g.msq=[];var specs=[['Mother','fam'],['Father','fam'],['Sibling','fam'],['Grandmother','fam'],['Child','fam'],['Partner','fam'],['Spouse','fam'],['Pet','fam'],['Friend','fri'],['Ex','ex'],['Enemy (friend)','en']];var lengths=specs.map(([role,t],i)=>{var person={id:'role-'+i,n:'QA Person '+i,role,t,alive:true,age:role==='Child'?5:30,bond:80,m:1000};g.rel.push(person);sel=person.id;return relationshipView().length});var person=g.rel.at(-1);person.alive=false;person.deceased=true;person.deathAt=g.age;relationshipMourn(person.id,'journal');var smarts=g.smarts;relationshipMourn(person.id,'journal');({lengths,noRepeatedReward:g.smarts===smarts})`);assert.ok(r.lengths.every(x=>x>100));assert.equal(r.noRepeatedReward,true);
});
test('student loan standard plan reaches zero over ten uncapped annual payments',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=25;g.sloan=10000;g.studentLoanPlan=null;var total=0;for(var i=0;i<10;i++){g.age++;total+=eduLoanPayroll(100000);}({balance:g.sloan,payments:eduLoanPlan().history.length,total})`);assert.equal(r.balance,0);assert.equal(r.payments,10);assert.ok(r.total>10000);
});
test('new semester, transfer and debt controls are keyboard accessible in both themes',async t=>{
 const p=await setup(t,{width:320,height:568});await born(p);await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 for(const theme of ['dark','light'])for(const page of ['current','study','coursework','finances','term-reports']){
  await run(p,`ST.theme='${theme}';applyTheme();g.age=20;g.edu=1;g.event=null;g.result=null;g.msq=[];g.hsPopup=null;g.hsQueue=[];if(!collegeEnsure().current)collegeCurrentFrom('Accessible College','university','Business','None');collegePage='${page}';tab='Work';wsel='college';draw()`);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,theme+' '+page);
  const violations=await p.evaluate(async()=>{return (await axe.run(document,{runOnly:{type:'rule',values:['button-name','label','color-contrast','aria-dialog-name']}})).violations.map(v=>({id:v.id,html:v.nodes.map(x=>x.html)}));});assert.deepEqual(violations,[],theme+' '+page);
 }
});
test('transferred credits satisfy categories while two target residency years remain required',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=20;g.edu=1;g.cash=1000000;g.smarts=100;g.iq=130;g.event=null;g.result=null;g.msq=[];g.hsPopup=null;collegeCurrentFrom('Source College','community','Business','Mathematics');var c=collegeEnsure().current;c.credits={ge:30,major:30,minor:0};c.gpa=4;var random=Math.random;Math.random=()=>.01;eduTransferApply(COLLEGE_GROUPS.university[0][0]);Math.random=random;eduTransferAccept();for(var i=0;i<2;i++){g.event=null;g.result=null;g.ysum=null;g.msq=[];g.hsPopup=null;g.hsQueue=[];g.msReport=null;g.health=100;var target=collegeEnsure().current;target.performance=100;for(var a=0;a<8;a++)target.yearActions[target.year+':'+a]=true;ageUp();}({current:!!collegeEnsure().current,degrees:collegeEnsure().degrees.length,age:g.age,semesters:collegeEnsure().degrees[0]?.semesters.length})`);assert.equal(r.current,false);assert.equal(r.degrees,1);assert.equal(r.age,22);assert.equal(r.semesters,4);
});
test('athletic scholarship renewal requires both term GPA and active team performance',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=19;collegeCurrentFrom('Sports College','university','Kinesiology','None');var c=collegeEnsure().current;c.aid.scholarship=3000;c.aidBreakdown=[{name:'Athletic scholarship',amount:3000}];c.club={kind:'sport',performance:50};eduCalendar(c);c.year=2;c.semesterHistory=[{gpa:3.7}];eduCalendar(c);var suspended=c.aid.scholarship;c.year=3;c.club.performance=75;eduCalendar(c);({suspended,renewed:c.aid.scholarship})`);assert.equal(r.suspended,0);assert.equal(r.renewed,3000);
});
test('Jobs: hiring enforces requirements and coworkers become persistent friends only once',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=10;g.edu=0;g.event=null;g.msq=[];collegeConfirmJob('ft',0);var blocked=!g.job;g.hsPopup=null;g.age=30;g.edu=4;g.exp[JB.ft[0][1]]=100;var random=Math.random;Math.random=()=>.01;collegeConfirmJob('ft',0);Math.random=random;var hired=!!g.job;jobUpdateCoworkers();var peer=g.co[0];peer.b=80;jobUpdateColleagueAction(peer.id,'friend');jobUpdateColleagueAction(peer.id,'friend');var events=EV.filter(e=>e.jobOnly&&jobUpdateJobEventAllowed(e));({blocked,hired,friends:g.rel.filter(r=>r.source==='coworker'&&r.n===peer.n).length,company:!!g.job.companyId,events:events.length,saved:save(2,'life')})`);assert.equal(r.blocked,true);assert.equal(r.hired,true);assert.equal(r.friends,1);assert.equal(r.company,true);assert.ok(r.events>0);assert.equal(r.saved,true);
});
test('promotion checklist and actual review enforce the same gates and annual attempt limit',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=60;g.edu=4;g.event=null;g.msq=[];g.job={t:JB.ft[0][0],f:JB.ft[0][1],pay:50000,lv:0,yrs:10,sp:0};g.exp[g.job.f]=100;g.perf=0;jobUpdateOnHire(g.job);var req=careerPromotionRequirements(),target=req.target[0],title=g.job.t;promo();var blocked=g.job.t===title&&!req.eligible;g.perf=100;var ready=careerPromotionRequirements().eligible;var random=Math.random;Math.random=()=>.01;promo();var promoted=g.job.t===target;g.job.yrs=10;g.perf=100;var once=g.job.t;promo();Math.random=random;({blocked,ready,promoted,annual:g.job.t===once,attempt:g.job.promotionAttemptAge})`);assert.equal(r.blocked,true);assert.equal(r.ready,true);assert.equal(r.promoted,true);assert.equal(r.annual,true);assert.equal(r.attempt,60);
});
test('annual workplace training and coworker networking limits survive save/load and reset next year',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.smarts=50;g.perf=30;g.job={t:JB.ft[0][0],f:JB.ft[0][1],pay:30000,sp:0};jobUpdateOnHire(g.job);jobUpdateBossAction('training','ft',-1);jobUpdateBossAction('training','ft',-1);var smarts=g.smarts;jobUpdateBossAction('training','ft',-1);var limit=g.smarts===smarts;jobUpdateCoworkers();var person=g.co[0];for(var i=0;i<3;i++)jobUpdateColleagueAction(person.id,'feedback');var perf=g.perf;jobUpdateColleagueAction(person.id,'feedback');var peerLimit=g.perf===perf;var saved=save(0,'life');loadFrom(0);var persisted=careerActionUsage(g.job).training,beforeReset=g.smarts;g.age++;jobUpdateBossAction('training','ft',-1);({limit,peerLimit,saved,persisted,reset:careerActionUsage(g.job).training,gain:g.smarts-beforeReset})`);assert.equal(r.limit,true);assert.equal(r.peerLimit,true);assert.equal(r.saved,true);assert.equal(r.persisted,2);assert.equal(r.reset,1);assert.equal(r.gain,2);
});
test('career development follows a persisted branch over multiple years',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.event=null;g.result=null;g.msq=[];g.job={t:JB.ft[0][0],f:JB.ft[0][1],pay:30000,sp:0};jobUpdateOnHire(g.job);careerStoryOpen();pick(1);var path=g.job.developmentStory.path;g.result=null;careerStoryOpen();var once=g.job.developmentStory.history.length;g.age++;g.event=null;g.result=null;careerStoryOpen();var follow=g.event.x.includes('A year later');pick(0);var saved=save(0,'life');loadFrom(0);({path,once,follow,saved,history:g.job.developmentStory.history.length,next:g.job.developmentStory.path})`);assert.deepEqual(r,{path:'mentorship',once:1,follow:true,saved:true,history:2,next:'skills'});
});
test('ownership estimates match annual secured debt service and equity without charging on view',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=1000000;g.event=null;g.msq=[];g.car={id:'owned-cost',n:'Cost car',v:25000,purchasePrice:25000};g.loans=[{id:'cost-loan',assetId:'owned-cost',kind:'car',n:'Auto loan',bal:20000,rate:10,yearsLeft:5}];var cash=g.cash,q=assetCostEstimate('car',g.car,g.loans);var html=stuffItemDetail('car','owned-cost'),uncharged=g.cash===cash;g.led={};stuff();({equity:q.equity,service:q.service,actual:-g.led['Auto loan payment'],annual:q.annual,insurance:q.insurance,uncharged,includes:html.includes('Ownership cost &amp; equity')||html.includes('Ownership cost & equity')})`);assert.equal(r.equity,5000);assert.equal(r.service,r.actual);assert.ok(r.annual>r.service);assert.ok(r.insurance>0);assert.equal(r.uncharged,true);assert.equal(r.includes,true);
});
test('insurance settlement records conserve payout and remain visible after loss',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=0;g.ins.car=1;g.car={id:'loss-summary',n:'Lost car',v:10000};g.loans=[{assetId:'loss-summary',bal:3000}];var expected=Math.max(0,7800-pr(750));stuffApplyIncident({kind:'car',id:'loss-summary',action:'car-total'});var record=g.assetSettlements.at(-1);({total:record.debtPaid+record.cashReceived,expected,remaining:record.remainingDebt,visible:stuffTop().includes('Latest insurance settlement'),saved:save(0,'life')})`);assert.equal(r.total,r.expected);assert.equal(r.remaining,0);assert.equal(r.visible,true);assert.equal(r.saved,true);
});
test('campus and coworker bonds synchronize in both directions using explicit identities',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=20;g.event=null;g.msq=[];collegeCurrentFrom('Sync College','university','Business','None');var c=collegeEnsure().current,peer=c.peers[0];peer.bond=80;collegePersonAction('peer',peer.id,4);relationshipSyncAll();collegePersonAction('peer',peer.id,1);var friend=g.rel.find(r=>r.id===peer.id),campus=peer.bond===friend.bond;var before=friend.bond;E({relId:friend.id,relDelta:-10});var reverse=peer.bond===friend.bond&&friend.bond===before-10;g.job={t:JB.ft[0][0],f:JB.ft[0][1],pay:30000,sp:0};jobUpdateCoworkers();var co=g.co[0];co.b=80;jobUpdateColleagueAction(co.id,'friend');var worker=g.rel.find(r=>r.sourceId===co.id);jobUpdateColleagueAction(co.id,'chat');var coworker=worker.bond===co.b;E({relId:worker.id,relDelta:-5});({campus,reverse,coworker,reverseWorker:worker.bond===co.b,memory:friend.sharedMemories.length>0,linked:worker.sourceId===co.id})`);for(const [k,v]of Object.entries(r))assert.equal(v,true,k);
});
test('shared memories and multi-year reconciliation persist through save/load',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;var friend={id:'history-friend',n:'QA Friend',t:'fri',role:'Friend',age:30,bond:80,alive:true,m:0};g.rel.push(friend);relationshipContinuity(friend.id,'conflict');relationshipContinuity(friend.id,'repair');var delayed=friend.continuity.status==='strained';g.age++;relationshipContinuity(friend.id,'repair');g.age++;relationshipContinuity(friend.id,'followup');var saved=save(0,'life');loadFrom(0);friend=g.rel.find(x=>x.id==='history-friend');sel=friend.id;({delayed,saved,status:friend.continuity.status,memories:friend.sharedMemories.length,visible:relationshipView().includes('Shared history')})`);assert.deepEqual(r,{delayed:true,saved:true,status:'steady',memories:3,visible:true});
});
test('Other action search navigates safely and keeps typed text out of markup',async t=>{
 const p=await setup(t);await born(p);await run(p,"g.event=null;g.result=null;g.msq=[];tab='Other';NV.O=[];draw()");await p.getByLabel('Search actions').fill('family planning');await p.getByRole('button',{name:/Health · Family Planning/}).click();assert.match(await p.locator('.info').innerText(),/Family planning/);
 await run(p,"NV.O=[];draw()");await p.getByLabel('Search actions').fill('<img src=x onerror=alert(1)>');assert.equal(await p.locator('#other-search-results img').count(),0);assert.match(await p.locator('#other-search-results').innerText(),/0 results/);
});
test('unified finance totals include retirement once and dashboard viewing preserves balances',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.cash=10000;g.bank.chk=1000;g.bank.sav=2000;g.loans=[{n:'Personal loan',bal:500,rate:10}];g.sloan=1000;g.cc=null;jobUpdatePlan().balance=3000;var before={cash:g.cash,debt:g.sloan},base=financeOriginalNetWorth(),s=financeSnapshot(),html=financeDashboard();({liquid:s.liquid,debt:s.debt,retirement:s.retirement,net:s.netWorth,expected:base+3000,unchanged:g.cash===before.cash&&g.sloan===before.debt,visible:html.includes('Financial dashboard')})`);assert.equal(r.liquid,13000);assert.equal(r.debt,1500);assert.equal(r.retirement,3000);assert.equal(r.net,r.expected);assert.equal(r.unchanged,true);assert.equal(r.visible,true);
});
test('annual progression accrues student-loan interest exactly once',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=20;g.edu=1;g.cash=1000000;g.sloan=10000;g.studentLoanPlan=null;g.event=null;g.result=null;g.ysum=null;g.msq=[];g.hsPopup=null;g.hsQueue=[];g.health=100;collegeCurrentFrom('Interest College','university','Business','None',{tuition:1000});ageUp();({balance:g.sloan,interest:eduLoanPlan().history.at(-1).interest,entries:eduLoanPlan().history.length})`);assert.deepEqual(r,{balance:10500,interest:500,entries:1});
});
test('same-name contacts remain separate people and ending contact clears the linked friend flag',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.event=null;g.msq=[];g.job={t:JB.ft[0][0],f:JB.ft[0][1],pay:30000,sp:0};g.rel.push({id:'unrelated-name',n:'QA Same Name',t:'fri',role:'Friend',age:30,bond:60,alive:true,m:0});g.co=[{id:'actual-coworker',n:'QA Same Name',b:80,r:'Colleague'}];jobUpdateColleagueAction('actual-coworker','friend');var contact=g.co[0],friend=g.rel.find(x=>x.sourceId===contact.id);var separate=g.rel.filter(x=>x.n==='QA Same Name').length===2;friend.alive=false;relationshipSyncAll();({separate,cleared:!contact.friend&&!contact.friendId,unrelated:g.rel.find(x=>x.id==='unrelated-name').bond})`);assert.deepEqual(r,{separate:true,cleared:true,unrelated:60});
});
test('older money controls display the same local amounts that their handlers use',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.country='Japan';g.nat=g.w.Japan.n;ST.cur='local';g.cash=100000;openBank(0);msub='Banking';var bank=moneyV();g.loans=[{n:'QA loan',bal:10000,rate:5}];msub='Loans';var loans=moneyV();msub='Taxes';var taxes=moneyV();({bank:bank.includes('Deposit '+loc(1000)+' to savings'),loan:loans.includes('Pay '+loc(5000)),tax:taxes.includes(loc(2000)+' a year')})`);assert.deepEqual(r,{bank:true,loan:true,tax:true});
});
test('new job, asset, relationship, search and dashboard screens pass mobile accessibility checks',async t=>{
 const p=await setup(t,{width:320,height:568});await born(p);await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 for(const theme of ['dark','light'])for(const screen of ['career','asset','relationship','search','dashboard']){
  await run(p,`ST.theme='${theme}';applyTheme();g.age=30;g.event=null;g.result=null;g.msq=[];g.hsPopup=null;g.ysum=null;g.eduPopup=null;g.job={t:JB.ft[0][0],f:JB.ft[0][1],pay:30000,sp:0};jobUpdateOnHire(g.job);g.car={id:'accessible-asset',n:'Accessible car',v:10000};`+(screen==='career'?"tab='Work';wsel='job';jobUpdateCareerPage='boss';draw()":screen==='asset'?"tab='Stuff';stuffSelected={kind:'car',id:'accessible-asset'};draw()":screen==='relationship'?"tab='Rel';sel=g.rel[0].id;draw()":screen==='search'?"tab='Other';NV.O=[];draw()":"tab='Other';NV.O=['Dashboard'];draw()"));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,theme+' '+screen);
  const errors=await p.evaluate(async()=>{return (await axe.run(document,{runOnly:{type:'rule',values:['label','button-name','color-contrast','aria-dialog-name']}})).violations.map(v=>({id:v.id,html:v.nodes.map(n=>n.html)}));});assert.deepEqual(errors,[],theme+' '+screen);
 }
});
test('graphics cover every car, home and collectible catalog without changing accessible labels',async t=>{
 const p=await setup(t);await born(p);
 const result=await run(p,`['Cars','Property','Jewelry'].map(category=>{stuffShopTab=category;var box=document.createElement('div');box.innerHTML=stuffShopView();var cards=[...box.querySelectorAll('.card')];return {category,count:cards.length,illustrated:cards.filter(c=>c.querySelector('.game-art svg')).length,hidden:[...box.querySelectorAll('.game-art')].every(x=>x.getAttribute('aria-hidden')==='true'),external:box.querySelectorAll('image,img').length};})`);
 for(const x of result){assert.ok(x.count>25,x.category);assert.equal(x.illustrated,x.count,x.category);assert.equal(x.hidden,true);assert.equal(x.external,0);}
});
test('illustrations are deterministic, use no gameplay RNG, and distinguish silhouettes and identities',async t=>{
 const p=await setup(t);const r=await run(p,`var random=Math.random;var result;try{Math.random=()=>{throw Error('Artwork consumed gameplay RNG')};var first=GameArt.svg('person',{id:'stable-avatar',n:'QA Person',age:30}),second=GameArt.svg('person',{id:'stable-avatar',n:'QA Person',age:30});result={stable:first===second,different:first!==GameArt.svg('person',{id:'different-avatar',n:'QA Person',age:30}),types:GameArt.svg('car',{n:'Shared seed',type:'Pickup truck'})!==GameArt.svg('car',{n:'Shared seed',type:'Sports coupe'}),age:first!==GameArt.svg('person',{id:'stable-avatar',n:'QA Person',age:70}),safe:!GameArt.svg('person',{n:'<img src=x onerror=alert(1)>'}).includes('<img')};}finally{Math.random=random}result`);for(const[k,v]of Object.entries(r))assert.equal(v,true,k);
});
test('portraits cover player, relationships and school/work contacts and persist through saves',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=20;g.event=null;g.result=null;g.msq=[];collegeCurrentFrom('Art College','university','Business','None');collegePage='classmates';tab='Work';wsel='college';draw();var peers=document.querySelectorAll('.info [data-art-kind=person]').length;var avatar=document.querySelectorAll('.hd .game-art--avatar').length;var person=g.rel[0],before=GameArt.svg('person',person);var saved=save(0,'life');loadFrom(0);var restored=GameArt.svg('person',g.rel[0])===before;tab='Rel';sel=null;relationshipOpen['Parents']=true;draw();var family=document.querySelectorAll('.relPerson .game-art').length;({peers,avatar,saved,restored,family,saveContainsSvg:localStorage.getItem('bt_slot_0').includes('<svg')})`);assert.ok(r.peers>=6);assert.equal(r.avatar,1);assert.equal(r.saved,true);assert.equal(r.restored,true);assert.ok(r.family>0);assert.equal(r.saveContainsSvg,false);
});
test('illustrated purchase, owned inventory and detail actions work offline on a narrow screen',async t=>{
 const p=await setup(t,{width:320,height:568});await born(p);await run(p,"g.age=30;g.cash=1000000;g.lic.push(DL);g.event=null;g.result=null;g.msq=[];g.hsPopup=null;tab='Stuff';stuffSelected=null;stuffShopTab='Cars';draw()");assert.equal(await p.locator('.info .card .row > .d').first().evaluate(el=>{const r=document.createRange();r.selectNodeContents(el);return r.getClientRects().length<=1;}),true);await p.context().setOffline(true);
 await p.getByRole('button',{name:'Purchase options',exact:true}).first().click();assert.equal(await p.locator('.game-art--hero[data-art-kind=car]').count(),1);await p.getByRole('button',{name:/^Buy with cash/}).click();await run(p,'g.msq=[];g.event=null;draw()');await p.locator('[onclick^="stuffOpenItem"]').first().click();assert.equal(await p.locator('.game-art--hero[data-art-kind=car]').count(),1);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
});
test('exported illustration library contains valid standalone local SVG artwork',async t=>{
 const p=await setup(t);const icons=fs.readdirSync(path.join(root,'art/icons')).filter(x=>x.endsWith('.svg'));assert.equal(icons.length,191);const invalid=await p.evaluate(list=>{return list.flatMap(({name,svg})=>{const doc=new DOMParser().parseFromString(svg,'image/svg+xml');return doc.querySelector('parsererror')||doc.documentElement.localName!=='svg'||doc.querySelector('script,image,foreignObject')?[name]:[];});},icons.map(name=>({name,svg:fs.readFileSync(path.join(root,'art/icons',name),'utf8')})));assert.deepEqual(invalid,[]);
});
test('body profiles can be selected before birth and include appropriate puberty/cycle paths',async t=>{
 const p=await setup(t);await p.getByRole('button',{name:'Create your own life',exact:true}).click();await p.getByLabel('Character body profile').selectOption('female');await p.getByRole('button',{name:'Be born',exact:true}).click();let r=await run(p,"({body:g.medical.profile.body,cycles:g.medical.profile.hasPeriods,age:g.age})");assert.deepEqual(r,{body:'female',cycles:true,age:0});
 await run(p,"go('title')");await p.getByRole('button',{name:'Create your own life',exact:true}).click();await p.getByLabel('Character body profile').selectOption('male');await p.getByRole('button',{name:'Be born',exact:true}).click();r=await run(p,"({body:g.medical.profile.body,cycles:g.medical.profile.hasPeriods})");assert.deepEqual(r,{body:'male',cycles:false});
});
test('newborn conditions have stable identities and life-course conditions can develop later',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`var newborn=initW(newLife(false)),random=Math.random;Math.random=()=>.01;newborn.dz=[];newborn.age=0;bornDz(newborn);var congenital=newborn.dz.every(d=>d.origin==='present at birth'&&MEDICAL_CONDITIONS[d.n].birth);g.dz=[];g.age=35;g.medical.lastAge=-1;g.event=null;g.msq=[];medicalYear();Math.random=random;({congenital,count:newborn.dz.length,onsets:g.dz.every(d=>d.onsetAge===35),developed:g.dz.some(d=>!MEDICAL_CONDITIONS[d.n].birth),catalog:Object.keys(MEDICAL_CONDITIONS).length,clinics:Object.keys(MEDICAL_SPECIALTIES).length,ids:new Set(g.dz.map(d=>d.id)).size===g.dz.length})`);assert.equal(r.congenital,true);assert.ok(r.count>0);assert.equal(r.onsets,true);assert.equal(r.developed,true);assert.ok(r.catalog>=35);assert.equal(r.clinics,20);assert.equal(r.ids,true);
});
test('specialist appointments diagnose the matching hidden condition and charge exactly once',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.country='United States';g.nat=g.w[g.country].n;g.ins.health=0;g.cash=100000;g.dz=[];var d=medicalAdd('Hypertension',false);var random=Math.random;Math.random=()=>.01;var a=medicalBook('cardiology','symptoms'),cash=g.cash,quote=medicalQuote(320);medicalAttend(a.id);var charged=cash-g.cash;medicalAttend(a.id);Math.random=random;({known:d.known,review:d.reviewedBy,charged,quote,noDouble:cash-g.cash===charged,status:a.status,record:medicalEnsure().records.some(x=>x.type==='diagnosis')})`);assert.equal(r.known,true);assert.equal(r.review,'cardiology');assert.equal(r.charged,r.quote);assert.equal(r.noDouble,true);assert.equal(r.status,'Completed');assert.equal(r.record,true);
});
test('appointments expire or cancel without charges and private/insured/family prices agree',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.country='United States';g.nat=g.w[g.country].n;g.ins.health=0;g.cash=10000;var privateFee=medicalQuote(100);g.ins.health=1;var insured=medicalQuote(100);g.ins.health=0;var a=medicalBook('primary'),cash=g.cash;medicalCancel(a.id);var cancelled=medicalAttend(a.id)!==true&&cash===g.cash;var b=medicalBook('primary');g.age++;medicalAttend(b.id);var expired=b.status==='Expired';g.age=10;g.cash=-10;var family=medicalQuote(100),child=medicalBook('primary');var attended=medicalAttend(child.id);({privateFee,insured,cancelled,expired,family,attended,cash:g.cash})`);assert.ok(r.privateFee>0);assert.equal(r.insured,Math.round(r.privateFee*.2));assert.equal(r.cancelled,true);assert.equal(r.expired,true);assert.equal(r.family,0);assert.equal(r.attended,true);assert.equal(r.cash,-10);
});
test('chronic care is limited, renews once yearly and does not magically remove a diagnosis',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.country='United States';g.nat=g.w[g.country].n;g.ins.health=0;g.cash=100000;g.dz=[];var d=medicalAdd('Type 1 diabetes',true);d.sev=3;var cash=g.cash;medicalTreat(d.id,'plan');var fee=cash-g.cash;medicalTreat(d.id,'plan');var limited=cash-g.cash===fee;medicalAutoCare(d.id);g.age++;g.medical.lastAge=-1;cash=g.cash;medicalYear();var renewed=cash-g.cash;var records=medicalEnsure().records.length;medicalYear();({limited,fee,renewed,once:cash-g.cash===renewed,retained:g.dz.some(x=>x.id===d.id),active:d.ctl,recordsStable:records===medicalEnsure().records.length})`);assert.equal(r.limited,true);assert.ok(r.fee>0);assert.equal(r.renewed,r.fee);assert.equal(r.once,true);assert.equal(r.retained,true);assert.equal(r.active,true);assert.equal(r.recordsStable,true);
});
test('procedures require assessment and acute infections can resolve after clinical treatment',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=1000000;g.dz=[];var d=medicalAdd('Congenital heart defect',true),cash=g.cash;medicalTreat(d.id,'procedure');var blocked=g.cash===cash&&g.dz.includes(d);var a=medicalBook('cardiology');medicalAttend(a.id);var random=Math.random;Math.random=()=>.01;medicalTreat(d.id,'procedure');Math.random=random;var corrected=!g.dz.includes(d);var flu=medicalAdd('Flu',true);medicalTreat(flu.id,'plan');({blocked,corrected,acute:!g.dz.includes(flu),records:medicalEnsure().records.some(x=>x.type==='recovery')})`);assert.deepEqual(r,{blocked:true,corrected:true,acute:true,records:true});
});
test('puberty events cover both profiles once and menopause remains a normal stage',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.event=null;g.msq=[];var m=medicalEnsure();m.queue=[];m.seen={};m.profile=medicalBody(g,'male');g.age=m.profile.pubertyAge;medicalLifeYear();var boys=m.queue.find(x=>x.x.includes('beginning puberty'));var count=m.queue.length;medicalLifeYear();var once=count===m.queue.length;m.queue=[];m.seen={};m.profile=medicalBody(g,'female');g.age=m.profile.menarcheAge;medicalLifeYear();var periods=m.queue.some(x=>x.x.includes('first periods'));g.age=m.profile.menopauseAge;medicalLifeYear();({boys:!!boys,once,periods,status:medicalCycle(),menopauseDisease:g.dz.some(x=>x.n==='Menopause'),event:m.queue.some(x=>x.x.includes('reached menopause'))})`);assert.equal(r.boys,true);assert.equal(r.once,true);assert.equal(r.periods,true);assert.equal(r.status,'Menopause');assert.equal(r.menopauseDisease,false);assert.equal(r.event,true);
});
test('pregnancy pauses cycles, birth enables postpartum care and menopause blocks stale conception choices',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`var m=medicalEnsure();m.profile=medicalBody(g,'female');g.age=25;g.repro={naturalPossible:true,birthControl:'None',attempts:0,pregnancy:{dueAge:26,method:'Natural birth',carrier:'self'}};var pregnant=medicalCycle();g.age=26;relationshipAddChild('Natural birth',0);g.repro.pregnancy=null;var postpartum=medicalCycle();g.age=48;m.profile.menopauseAge=47;g.cash=100000;var before=g.cash,attempt=relationshipConceptionAttempt();E({familyPlan:'ivf',m:-12000});({pregnant,postpartum,blocked:!attempt.ok,noFee:g.cash===before})`);assert.equal(r.pregnant,'Paused during pregnancy');assert.equal(r.postpartum,'Postpartum recovery');assert.equal(r.blocked,true);assert.equal(r.noFee,true);
});
test('contraception validates profiles, bills supplies once and expires long-acting methods',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`var m=medicalEnsure();m.profile=medicalBody(g,'female');g.age=20;g.country='United States';g.nat=g.w[g.country].n;g.ins.health=0;g.cash=100000;birthControlSet('Birth control pill');var cash=g.cash;medicalContraceptionAnnual();var fee=cash-g.cash;medicalContraceptionAnnual();var once=cash-g.cash===fee;birthControlSet('None');birthControlSet('IUD');var expiry=g.repro.methodExpiresAge;g.age=expiry;medicalContraceptionAnnual();var expired=g.repro.birthControl==='None';m.profile=medicalBody(g,'male');birthControlSet('Implant');var profileBlocked=g.repro.birthControl==='None';birthControlSet('Bogus method');({fee,expected:medicalQuote(220),once,expiry,expired,profileBlocked,invalid:g.repro.birthControl==='None'})`);assert.equal(r.fee,r.expected);assert.equal(r.once,true);assert.equal(r.expiry,25);assert.equal(r.expired,true);assert.equal(r.profileBlocked,true);assert.equal(r.invalid,true);
});
test('unaffordable care never charges, prevention is limited and therapy records remission not a cure',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.country='United States';g.nat=g.w[g.country].n;g.ins.health=0;g.cash=0;g.dz=[];var d=medicalAdd('Depression',true);medicalTreat(d.id,'plan');var noCharge=g.cash===0&&!d.ctl;g.cash=10000;medicalPrevent('vaccines');var cash=g.cash;medicalPrevent('vaccines');var once=cash===g.cash;for(var i=0;i<4;i++)therapy();({noCharge,once,sessions:medicalEnsure().seen['therapy:'+g.age],retained:g.dz.includes(d),records:medicalEnsure().records.some(x=>x.type==='therapy')})`);assert.equal(r.noCharge,true);assert.equal(r.once,true);assert.equal(r.sessions,3);assert.equal(r.retained,true);assert.equal(r.records,true);
});
test('health events defer behind existing choices and their decisions book recorded care',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.msq=[];g.event={x:'Existing event',c:[['Continue',{},'']]};var m=medicalEnsure();m.queue=[];m.seen={};medicalQueue('test-health','A symptom needs assessment',[['Book care',{medicalDecision:'symptom-visit'},'You choose care.']]);draw();var preserved=g.event.x==='Existing event';g.event=null;g.result=null;draw();var promoted=g.event.x==='A symptom needs assessment';pick(0);({preserved,promoted,booked:m.appointments.some(x=>x.specialty==='primary'),record:m.records.some(x=>x.type==='decision')})`);assert.deepEqual(r,{preserved:true,promoted:true,booked:true,record:true});
});
test('medical records migrate old saves, persist diagnoses and reject malformed health data',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=30;g.cash=100000;g.dz=[];medicalAdd('Asthma',true);var a=medicalBook('respiratory');medicalAttend(a.id);var saved=save(4,'life'),raw=localStorage.getItem('bt_slot_4');g.medical=null;loadFrom(4);var persisted=g.medical.appointments[0].status==='Completed';var bad=JSON.parse(raw);bad.data.medical.profile.body='invalid';var rejected=false;try{SaveStore.importText(JSON.stringify(bad),3)}catch(e){rejected=true;}var legacy=JSON.parse(raw);delete legacy.data.medical;var prepared=SaveStore.prepare(SaveStore.validate(legacy));({saved,persisted,rejected,migrated:!!prepared.medical,kept:prepared.dz.some(x=>x.n==='Asthma')})`);for(const[k,v]of Object.entries(r))assert.equal(v,true,k);
});
test('health pages expose no hidden diagnosis and remain accessible on mobile in both themes',async t=>{
 const p=await setup(t,{width:320,height:568});await born(p);await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});await run(p,"g.age=30;g.dz=[];medicalAdd('Epilepsy',false);g.medical.queue=[];g.event=null;g.msq=[];NV.O=['Health','Doctor'];tab='Other';draw()");assert.equal((await p.locator('.info').innerText()).includes('Epilepsy'),false);
 for(const theme of ['dark','light'])for(const page of ['Overview','Doctor','Appointments','Life stages','Prevention','Records','Family Planning']){
  await run(p,`ST.theme='${theme}';applyTheme();g.event=null;g.result=null;g.msq=[];g.medical.queue=[];g.eduPopup=null;g.hsPopup=null;g.ysum=null;tab='Other';NV.O=['Health','${page}'];draw()`);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,theme+' '+page);
  const violations=await p.evaluate(async()=>{return (await axe.run(document,{runOnly:{type:'rule',values:['label','button-name','color-contrast','aria-dialog-name']}})).violations.map(v=>({id:v.id,html:v.nodes.map(x=>x.html)}));});assert.deepEqual(violations,[],theme+' '+page);
 }
});
test('prenatal care is a recorded clinical appointment and recurring contraception is charged once by aging',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=25;g.country='United States';g.nat=g.w[g.country].n;g.ins.health=0;g.cash=1000000;g.event=null;g.result=null;g.msq=[];var m=medicalEnsure();m.queue=[];m.profile=medicalBody(g,'female');relationshipRepro().pregnancy={dueAge:27,method:'Natural birth',carrier:'self'};var cash=g.cash;relationshipPrenatal();var fee=cash-g.cash,quote=medicalQuote(250);relationshipPrenatal();var noDouble=cash-g.cash===fee,prenatal=g.repro.pregnancy.prenatal;g.repro.pregnancy=null;birthControlSet('Birth control pill');g.event=null;g.result=null;g.ysum=null;g.msq=[];g.hsPopup=null;g.hsQueue=[];m.queue=[];g.health=100;ageUp();({fee,quote,noDouble,prenatal,bill:-g.led['Birth control'],expected:m.records.find(x=>x.type==='contraception'&&x.age===g.age&&x.text.includes('annual supplies'))?.cost,records:m.records.filter(x=>x.type==='contraception'&&x.age===g.age&&x.text.includes('annual supplies')).length})`);assert.equal(r.fee,r.quote);assert.equal(r.noDouble,true);assert.equal(r.prenatal,true);assert.equal(r.bill,r.expected);assert.equal(r.records,1);
});
test('child growth uses development context rather than adult BMI categories',async t=>{
 const p=await setup(t);await born(p);const r=await run(p,`g.age=6;g.bmi=16;var text=healthV();({context:text.includes('Childhood growth'),adultCategory:text.includes('Underweight')||text.includes('Healthy weight')})`);assert.equal(r.context,true);assert.equal(r.adultCategory,false);
});
