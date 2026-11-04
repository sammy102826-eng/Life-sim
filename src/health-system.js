/* Saved, annual medical state. Normal life stages are not illnesses. */
function medicalHash(text){let n=7;for(const c of String(text))n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n;}
function medicalBody(d,body,periods=body==='female'){
 const seed=medicalHash((d.name||'character')+'|'+body),onset=(body==='male'?9:8)+seed%6;
 return {body,hasPeriods:!!periods,pubertyAge:onset,pubertyEnd:onset+4,menarcheAge:cl(onset+2,10,16),menopauseAge:45+(seed%11)};
}
function medicalEnsure(d=g){
 if(!d)return null;
 if(!d.medical){const body=medicalHash((d.name||'')+'|'+(d.birth||''))%2?'female':'male';d.medical={version:1,profile:medicalBody(d,body),lastAge:-1,appointments:[],records:[],queue:[],seen:{},prevention:{},nextId:1,wellbeing:65,cycle:{},puberty:{},life:{},referrals:{}};}
 const m=d.medical;for(const k of ['appointments','records','queue'])if(!Array.isArray(m[k]))m[k]=[];
 m.seen=m.seen||{};m.prevention=m.prevention||{};m.referrals=m.referrals||{};m.life=m.life||{};m.cycle=m.cycle||{};m.puberty=m.puberty||{};m.nextId=Number.isInteger(m.nextId)?m.nextId:1;m.wellbeing=Number.isFinite(m.wellbeing)?cl(m.wellbeing):65;
 if(!m.profile||!['female','male','intersex'].includes(m.profile.body))m.profile=medicalBody(d,'female');
 d.dz=Array.isArray(d.dz)?d.dz:[];d.cond=Array.isArray(d.cond)?d.cond:[];
 const aliases={Diabetes:'Type 2 diabetes',Anxiety:'Anxiety disorder'};
 for(const name of d.cond.slice()){const n=aliases[name]||name;if(MEDICAL_CONDITIONS[n]){if(!d.dz.some(x=>x.n===n))d.dz.push({n,known:true,sev:1,prog:0,age:d.age});d.cond=d.cond.filter(x=>x!==name);}}
 for(const condition of d.dz){if(!condition.id)condition.id='medical-'+m.nextId++;condition.sev=cl(Number(condition.sev)||1,1,5);condition.prog=cl(Number(condition.prog)||0);if(condition.onsetAge==null)condition.onsetAge=condition.age??d.age;if(!condition.origin)condition.origin=MEDICAL_CONDITIONS[condition.n]?.birth&&condition.onsetAge===0?'present at birth':MEDICAL_CONDITIONS[condition.n]?.origin||'legacy';condition.actions=condition.actions||{};if(condition.controlUntil==null)condition.controlUntil=condition.ctl?d.age:-1;}
 return m;
}
function medicalRecord(type,text,extra={}){const m=medicalEnsure();m.records.unshift({age:g.age,type,text,...extra});if(m.records.length>100)m.records.length=100;}
function medicalQueue(key,title,choices){const m=medicalEnsure();if(m.seen[key])return;m.seen[key]=true;m.queue.push({x:title,c:choices,medical:true});if(m.queue.length>8)m.queue.length=8;}
function medicalQuote(base){if(g.age<18)return 0;return mc(pr(base));}
function medicalAffordable(cost){return cost===0||g.cash>=cost;}
function medicalCharge(cost,label){if(!Number.isFinite(cost)||cost<0||!medicalAffordable(cost))return false;g.cash-=cost;if(cost&&typeof LD==='function')LD(label,-cost);return true;}
function medicalAdd(name,known=false,origin='developed during life',d=g){if(!MEDICAL_CONDITIONS[name]||d.dz.some(x=>x.n===name&&!x.resolved))return null;const m=medicalEnsure(d),condition={id:'medical-'+m.nextId++,n:name,known,sev:1,prog:0,ctl:false,onsetAge:d.age,age:d.age,origin,actions:{}};d.dz.push(condition);return condition;}
addDz=function(name,known){return medicalAdd(name,known??false);};
bornDz=function(d){const m=medicalEnsure(d);m.profile=medicalBody(d,ch(50)?'female':'male');if(ch(24)){const name=P(MEDICAL_BIRTH_POOL);medicalAdd(name,!DZ[name].hid&&MEDICAL_CONDITIONS[name].min===0,'present at birth',d);if(ch(4))medicalAdd(P(MEDICAL_BIRTH_POOL),false,'present at birth',d);}return d;};
function medicalStage(d=g){const m=medicalEnsure(d),p=m.profile,age=d.age;return age<p.pubertyAge?'Before puberty':age<p.pubertyEnd?'Puberty in progress':'Puberty complete';}
function medicalCycle(d=g){const m=medicalEnsure(d),p=m.profile,repro=d.repro;if(!p.hasPeriods)return 'Not applicable';if(d.age<p.menarcheAge)return 'Periods have not started';if(repro?.pregnancy&&repro.pregnancy.carrier!=='partner')return 'Paused during pregnancy';if(m.life.postpartumUntil>=d.age)return 'Postpartum recovery';if(d.age>=p.menopauseAge)return 'Menopause';if(d.age>=p.menopauseAge-5)return 'Perimenopause';return m.cycle.irregular?'Irregular cycles':'Menstrual cycles';}
function medicalDiagnose(specialty,screening=false){const found=[];for(const d of g.dz){const c=MEDICAL_CONDITIONS[d.n];if(!c||d.known||g.age<c.min)continue;const relevant=specialty==='primary'||specialty==='emergency'||specialty===c.specialty;const odds=screening?85:specialty===c.specialty?92:specialty==='primary'?(c.acute?90:65):specialty==='emergency'?80:0;if(relevant&&ch(odds)){d.known=true;d.diagnosedAge=g.age;found.push(d.n);medicalRecord('diagnosis',`${d.n} was diagnosed.`,{condition:d.id});}}return found;}
function medicalBook(specialty,reason='routine',quiet=false){
 const m=medicalEnsure(),clinic=Object.hasOwn(MEDICAL_SPECIALTIES,specialty)?MEDICAL_SPECIALTIES[specialty]:null;if(!clinic||!g.alive)return null;
 const reasonKey=['routine','symptoms','screening','prenatal','followup','emergency'].includes(reason)?reason:'routine';
 if(reasonKey==='prenatal'&&!g.repro?.pregnancy)return null;
 if(m.appointments.some(x=>x.specialty===specialty&&x.age===g.age&&x.status==='Scheduled'))return toast('You already have an appointment waiting with this clinic.');
 if(m.appointments.filter(x=>x.specialty===specialty&&x.age===g.age&&x.status==='Completed').length>=2)return toast('You have used both appointments with this clinic this year.');
 const cost=medicalQuote(reasonKey==='screening'?500:clinic.fee);if(!medicalAffordable(cost))return toast('You need '+loc(cost)+' for this appointment. Review insurance or choose a public/family-covered option.');
 const a={id:'appointment-'+m.nextId++,specialty,reason:reasonKey,age:g.age,cost,status:'Scheduled',doctor:clinic.doctor};m.appointments.unshift(a);if(m.appointments.length>60)m.appointments.length=60;medicalRecord('booking',`${clinic.name}: ${reasonKey} appointment booked.`);if(!quiet)draw();return a;
}
function medicalAttend(id){const m=medicalEnsure(),a=m.appointments.find(x=>x.id===id);if(!a||a.status!=='Scheduled')return false;if(a.age!==g.age){a.status='Expired';draw();return false;}
 if(a.reason==='prenatal'&&!g.repro?.pregnancy)return toast('This prenatal appointment is no longer needed. Cancel it and book the appropriate follow-up.');
 const cost=medicalQuote(a.reason==='screening'?500:MEDICAL_SPECIALTIES[a.specialty].fee);if(!medicalCharge(cost,'Medical appointment'))return toast('You cannot afford the current appointment price.');
 a.cost=cost;a.status='Completed';a.completedAge=g.age;const found=medicalDiagnose(a.specialty,a.reason==='screening');
 for(const d of g.dz){if(!d.known)continue;const c=MEDICAL_CONDITIONS[d.n];if(!c)continue;if(a.specialty===c.specialty||a.specialty==='emergency'){d.reviewedBy=a.specialty;d.reviewAge=g.age;d.sev=Math.max(1,d.sev-(a.specialty==='emergency'?1:0));}m.referrals[c.specialty]=true;}
 if(a.specialty==='reproductive'){m.cycle.reviewedAge=g.age;m.cycle.supportedUntil=g.age+1;m.life.menopauseSupportUntil=g.age+1;}
 if(a.specialty==='mental')m.wellbeing=cl(m.wellbeing+8);
 if(a.reason==='prenatal'&&g.repro?.pregnancy)g.repro.pregnancy.prenatal=true;
 if(a.specialty==='obstetric'&&m.life.postpartumUntil>=g.age)m.life.postpartumReviewedAge=g.age;
 medicalRecord('visit',`${MEDICAL_SPECIALTIES[a.specialty].name}: ${found.length?'diagnosed '+found.join(', '):'assessment completed; no new diagnosis confirmed'}.`,{cost,appointment:a.id});
 if(!m.seen['visit-bonus:'+g.age]){m.seen['visit-bonus:'+g.age]=true;g.health=cl(g.health+2);}
 A({p:1},found.length?'Your appointment confirmed '+found.join(', ')+'. Review the condition care plans.':'Your appointment is complete. Follow-up recommendations are in your medical record.');return true;
}
function medicalCancel(id){const a=medicalEnsure().appointments.find(x=>x.id===id);if(a?.status==='Scheduled'){a.status='Cancelled';draw();}}
function medicalQuickVisit(specialty='primary',reason='routine'){const a=medicalBook(specialty,reason);return a&&a.id?medicalAttend(a.id):false;}
checkup=function(full,silent=false){if(silent)return medicalDiagnose('primary',true);return medicalQuickVisit('primary',full?'screening':'routine');};
doctor=function(){return medicalQuickVisit('primary','symptoms');};
function medicalTreat(id,action='plan'){
 const m=medicalEnsure(),d=g.dz.find(x=>x.id===id),c=d&&MEDICAL_CONDITIONS[d.n];if(!d||!c||!d.known||!['plan','procedure'].includes(action))return false;
 if(action==='procedure'&&(!c.surgery||![c.specialty,'emergency'].includes(d.reviewedBy)))return toast('A matching specialist must assess this condition before a procedure.');
 const key=g.age+':'+action;if(d.actions[key])return toast('This care step is already completed this year.');
 const cost=medicalQuote(action==='procedure'?c.surgery:c.cost);if(!medicalCharge(cost,'Medical treatment'))return toast('You need '+loc(cost)+' for this treatment.');d.actions[key]=true;
 if(action==='procedure'){
  if(ch(80)){d.remission=true;d.ctl=true;d.controlUntil=g.age+1;d.sev=1;if(c.correctable){d.resolved=true;medicalRecord('procedure',`${d.n}: specialist procedure completed successfully.`,{condition:d.id,cost});g.dz=g.dz.filter(x=>x!==d);}}else{d.sev=cl(d.sev+1,1,5);medicalRecord('procedure',`${d.n}: the procedure did not fully resolve the problem; follow-up is needed.`,{condition:d.id,cost});}
 }else{d.ctl=true;d.controlUntil=g.age+1;d.prog=cl(d.prog+25);d.sev=Math.max(1,d.sev-1);if(c.acute){medicalRecord('recovery',`${d.n}: recovery after treatment.`,{condition:d.id,cost});g.dz=g.dz.filter(x=>x!==d);}else{if(c.remission&&d.prog>=75)d.remission=true;medicalRecord('care',`${d.n}: ${c.care} arranged${d.remission?'; symptoms are in remission':''}.`,{condition:d.id,cost});}}
 A({p:1},'Your treatment record was updated. Long-term conditions may still need monitoring and follow-up.');return true;
}
treat=function(index,step){medicalEnsure();const d=g.dz[index];if(d)return medicalTreat(d.id,step===1?'procedure':'plan');};
prog=function(d,amount){const c=MEDICAL_CONDITIONS[d.n];if(!c)return;d.prog=cl((d.prog||0)+amount);if(d.prog>=100){if(c.acute)g.dz=g.dz.filter(x=>x!==d);else{d.remission=!!c.remission;d.sev=Math.max(1,d.sev-1);d.prog=75;}}};
therapy=function(){const m=medicalEnsure(),key='therapy:'+g.age,count=m.seen[key]||0;if(count>=3)return toast('You have completed three therapy sessions this year.');const cost=medicalQuote(150);if(!medicalCharge(cost,'Therapy'))return toast('You need '+loc(cost)+' for therapy.');m.seen[key]=count+1;m.wellbeing=cl(m.wellbeing+7);for(const d of g.dz.filter(x=>x.known&&MEDICAL_CONDITIONS[x.n]?.mental)){prog(d,20);d.ctl=true;d.controlUntil=g.age+1;}medicalRecord('therapy','A therapy session focused on coping, support and next steps.',{cost});A({p:4},'You attended a therapy session.');};
function medicalAutoCare(id){const d=g.dz.find(x=>x.id===id);if(!d||!d.known||MEDICAL_CONDITIONS[d.n]?.acute)return;d.autoCare=!d.autoCare;draw();}
function medicalPrevent(action){const m=medicalEnsure(),fees={vaccines:50,dental:80,sleep:0,exercise:0,nutrition:50},key=action+':'+g.age;if(!(action in fees)||m.prevention[key])return;const cost=medicalQuote(fees[action]);if(!medicalCharge(cost,'Preventive care'))return toast('You need '+loc(cost)+' for this care.');m.prevention[key]=true;
 if(action==='vaccines')m.prevention.vaccineAge=g.age;if(action==='dental')m.prevention.dentalAge=g.age;if(action==='sleep')m.wellbeing=cl(m.wellbeing+5);
 medicalRecord('prevention',`${action[0].toUpperCase()+action.slice(1)} support completed.`,{cost});A({p:2,h:action==='sleep'?1:0,fit:action==='exercise'?2:0},'Your preventive-care plan was updated.');}
function medicalRisk(c){let rate=c.rate||0,m=medicalEnsure();if(c.risk==='metabolic')rate*=1+(g.bmi>=30?.8:0);if(c.risk==='cardiac'||c.risk==='smoking')rate*=1+g.habits.smoke*.7;if(c.risk==='alcohol')rate*=1+g.habits.drink*.8;if(c.risk==='stress')rate*=g.happy<35?2:1;if(c.risk==='age')rate*=1+Math.max(0,g.age-40)/45;if(m.prevention['exercise:'+(g.age-1)]&&c.risk)rate*=.8;if(c.acute&&m.prevention.vaccineAge>=g.age-1&&c.specialty==='urgent')rate*=.65;return rate;}
function medicalLifeYear(){const m=medicalEnsure(),p=m.profile;
 m.puberty.stage=medicalStage();
 if(g.age>=p.pubertyAge&&g.age<p.pubertyEnd)medicalQueue('puberty-start','Your body is beginning puberty. Growth, skin, body hair, emotions and '+(p.body==='male'?'voice changes':'body shape changes')+' can happen at different times.',[
  ['Ask a trusted adult or clinician',{medicalDecision:'puberty-support',p:3},'You get clear, age-appropriate explanations.'],['Learn about hygiene, sleep and changing feelings',{medicalDecision:'puberty-learn',s:2,p:1},'You build a routine that feels comfortable.'],['Keep your questions private for now',{p:-1},'You can return to these questions when you feel ready.']]);
 if(g.age>=p.pubertyEnd&&g.age<19)medicalQueue('puberty-complete','You reflect on growing up and the changes of puberty.',[['Talk about confidence and boundaries',{p:3,s:1},'You feel more prepared to ask for support.'],['Keep building a healthy routine',{h:1,p:2},'You focus on sleep, food, movement and friendships.']]);
 const state=medicalCycle();m.cycle.status=state;
 if(p.hasPeriods&&g.age>=p.menarcheAge&&g.age<p.menopauseAge){m.cycle.started=true;m.cycle.irregular=state==='Perimenopause'||g.dz.some(x=>['PCOS','Endometriosis'].includes(x.n))||ch(g.age<p.menarcheAge+2?35:12);m.cycle.symptoms=m.cycle.supportedUntil>=g.age?1:R(0,3);if(['Paused during pregnancy','Postpartum recovery'].includes(state))m.cycle.symptoms=0;
  if(g.age<=p.menarcheAge+1)medicalQueue('menarche','Your first periods have begun. Timing and symptoms can vary, especially in the early years.',[['Ask for information and supplies',{medicalDecision:'period-support',p:3},'You make a practical plan and know who to ask for help.'],['Talk with a clinician about difficult symptoms',{medicalDecision:'period-review',p:1},'A care appointment can help when symptoms disrupt daily life.'],['Keep a simple symptom note',{medicalDecision:'period-track',s:1},'You begin noticing patterns without expecting every cycle to be identical.']]);
  if(m.cycle.symptoms>=3&&!g.repro?.pregnancy)medicalQueue('period-symptoms:'+g.age,'Period symptoms are affecting your usual activities this year.',[['Arrange a reproductive-health appointment',{medicalDecision:'period-review'},'You decide to have the symptoms assessed.'],['Rest and ask for practical support',{medicalDecision:'period-support',p:2},'You make room for recovery and support.']]);
 }
 if(g.age>p.menopauseAge+4)m.life.transitionSymptoms=null;
 if(p.hasPeriods&&g.age>=p.menopauseAge-5&&g.age<=p.menopauseAge+4){const supported=m.life.menopauseSupportUntil>=g.age;m.life.transitionSymptoms={hotFlushes:supported?1:R(0,3),sleep:supported?1:R(0,3),mood:supported?1:R(0,3)};}
 if(p.hasPeriods&&g.age>=p.menopauseAge-5&&g.age<p.menopauseAge){m.life.phase='Perimenopause';medicalQueue('perimenopause','Your cycle pattern is changing, with possible sleep changes or hot flushes. This can be a normal transition, and symptoms can still deserve care.',[['Arrange a menopause consultation',{medicalDecision:'menopause-review'},'You choose to discuss symptoms and treatment options.'],['Plan rest, movement and support',{medicalDecision:'menopause-support',p:2},'You adapt your routines and keep track of changes.']]);}
 if(p.hasPeriods&&g.age>=p.menopauseAge){m.life.phase='Menopause';m.cycle.symptoms=0;medicalQueue('menopause','You have reached menopause in the game: periods have ended. This is a normal life stage, not a disease.',[['Review symptoms and longer-term health with a clinician',{medicalDecision:'menopause-review',p:1},'You make a plan for comfort, bone health and ongoing care.'],['Reflect and adjust your routines',{p:3},'You focus on what supports this stage of life.']]);}
 m.cycle.history=Array.isArray(m.cycle.history)?m.cycle.history:[];if(p.hasPeriods&&g.age>=p.menarcheAge){m.cycle.history.unshift({age:g.age,status:medicalCycle(),symptoms:m.cycle.symptoms||0});if(m.cycle.history.length>20)m.cycle.history.length=20;}
}
function medicalYear(){const m=medicalEnsure();if(m.lastAge===g.age)return;m.lastAge=g.age;
 for(const a of m.appointments)if(a.status==='Scheduled'&&a.age<g.age)a.status='Expired';
 medicalLifeYear();
 for(const [name,c] of Object.entries(MEDICAL_CONDITIONS)){if(g.age<c.min||g.age>(c.max??120)||c.birth||!c.rate||c.cycles&&!m.profile.hasPeriods||c.male&&m.profile.body!=='male')continue;if(pcx(medicalRisk(c)))medicalAdd(name,false,c.origin==='neurodevelopmental'?'present since development':'developed during life');}
 let burden=0;
 for(const d of g.dz.slice()){const c=MEDICAL_CONDITIONS[d.n];if(!c)continue;
  if(d.autoCare&&d.known&&!c.acute&&d.controlUntil<=g.age){const cost=medicalQuote(c.cost);if(medicalCharge(cost,'Automatic medical care')){d.controlUntil=g.age+1;d.ctl=true;d.actions[g.age+':plan']=true;medicalRecord('care',`${d.n}: annual care renewed.`,{cost});}else medicalQueue('care-cost:'+d.id+':'+g.age,`Your care plan for ${d.n} could not renew within the available budget.`,[['Review insurance and clinic options',{medicalDecision:'care-access',p:1},'You look for a more affordable care route.'],['Ask for help planning care',{p:1},'You reach out for practical support.']]);}
  const controlled=d.controlUntil>=g.age;d.ctl=controlled;
  if(c.acute&&g.age>d.onsetAge&&ch(controlled?95:75)){g.dz=g.dz.filter(x=>x!==d);medicalRecord('recovery',`${d.n}: the episode resolved.`);continue;}
  if(controlled&&ch(30))d.sev=Math.max(1,d.sev-1);else if(!controlled&&!d.remission&&d.n!=='Color blindness'&&ch(18))d.sev=cl(d.sev+1,1,5);
  burden+=c.hp*d.sev*(controlled?.2:d.remission?.3:1);
  if(!d.known&&(d.sev>=3||ch(12)))medicalQueue('symptoms:'+d.id,`You notice ${c.symptoms.toLowerCase()}. A clinical assessment can help clarify what is happening.`,[['Book primary care',{medicalDecision:'symptom-visit'},'You decide to have the symptoms checked.'],['Use urgent care if symptoms are severe',{medicalDecision:'urgent-visit'},'You choose timely professional assessment.'],['Monitor and seek support',{p:-1},'The symptom note stays in your health record.']]);
  if(c.mental&&!controlled&&!d.remission)m.wellbeing=cl(m.wellbeing-2);
 }
 g.health=cl(g.health-Math.min(12,burden));
 if(m.life.postpartumUntil>=g.age&&g.happy<35&&ch(5))medicalAdd('Postpartum depression',false);
}
dzYear=medicalYear;
