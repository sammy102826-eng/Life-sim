/* Versioned portable saves. Existing versionless slot records migrate on read. */
const SaveStore=(()=>{
 const VERSION=1,MAX_BYTES=8*1024*1024;
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const clone=x=>JSON.parse(JSON.stringify(x));
 function validateTree(x,depth=0,budget={n:0}){
  if(depth>80||++budget.n>200000)throw Error('Save is too complex.');
  if(typeof x==='number'&&!Number.isFinite(x))throw Error('Invalid number.');
  if(typeof x==='string'&&/[<>]/.test(x))throw Error('Save contains unsupported markup.');
  if(x&&typeof x==='object')for(const k of Object.keys(x)){
   if(['__proto__','prototype','constructor'].includes(k))throw Error('Unsafe save key.');
   validateTree(x[k],depth+1,budget);
  }
 }
 function validate(record){
  if(!object(record))throw Error('Expected a save object.');
  const r=clone(record);validateTree(r);
  if(r.version!==undefined&&r.version!==0&&r.version!==VERSION)throw Error('Unsupported save version.');
  if(!['life','hist'].includes(r.kind)||!object(r.data))throw Error('Invalid save kind or data.');
  const d=r.data;
  if(r.kind==='life'){
   if(typeof d.name!=='string'||!d.name.trim()||d.name.length>100||/["'`&]/.test(d.name))throw Error('Invalid player name.');
   if(!Number.isInteger(d.age)||d.age<0||d.age>1000||typeof d.alive!=='boolean')throw Error('Invalid age or life status.');
   for(const k of ['health','happy','smarts','looks','cash','edu'])if(!Number.isFinite(d[k]))throw Error('Invalid '+k+'.');
   if(!Array.isArray(d.log)||!d.log.every(x=>typeof x==='string'))throw Error('Invalid life log.');
   for(const k of ['rel','pt','wars','cond','deg','loans','vent','xc','xh','lux','boats','planes','msq','hsQueue','dz','lic','seen'])if(d[k]!=null&&!Array.isArray(d[k]))throw Error('Invalid '+k+' list.');
   if(d.rel)for(const p of d.rel){if(!object(p)||typeof p.id!=='string'||! /^[\w-]+$/.test(p.id)||typeof p.n!=='string'||/["'`&]/.test(p.n)||!Number.isFinite(p.age)||!Number.isFinite(p.bond)||typeof p.alive!=='boolean')throw Error('Invalid relationship.');}
   if(d.educationJourney!=null){const e=d.educationJourney;if(!object(e))throw Error('Invalid education journey.');for(const k of ['elementaryReports','internships','scholarships','bills'])if(e[k]!=null&&!Array.isArray(e[k]))throw Error('Invalid education history.');if(e.preschool!=null&&(!object(e.preschool)||!Array.isArray(e.preschool.classmates)||!Array.isArray(e.preschool.years)||!object(e.preschool.skills)))throw Error('Invalid preschool history.');}
   if(d.medical!=null){const m=d.medical;if(!object(m)||!object(m.profile)||!['female','male','intersex'].includes(m.profile.body)||typeof m.profile.hasPeriods!=='boolean')throw Error('Invalid health profile.');for(const k of ['pubertyAge','pubertyEnd','menarcheAge','menopauseAge'])if(!Number.isFinite(m.profile[k])||m.profile[k]<0||m.profile[k]>120)throw Error('Invalid health timeline.');for(const k of ['appointments','records','queue'])if(!Array.isArray(m[k]))throw Error('Invalid medical record.');if(m.appointments.some(a=>!object(a)||!Object.hasOwn(MEDICAL_SPECIALTIES,a.specialty)||!['Scheduled','Completed','Cancelled','Expired'].includes(a.status)||!Number.isFinite(a.age)||!Number.isFinite(a.cost)||a.cost<0))throw Error('Invalid appointment data.');}
   if(d.w!=null&&(!object(d.w)||!object(d.w[d.country])||!object(d.w[d.country].n)))throw Error('Invalid country data.');
  }else{
   const p=PRES.find(p=>p.id===d.id);
   if(!p||!Number.isInteger(d.i)||d.i<0||d.i>p.nodes.length||!object(d.m)||!object(d.f))throw Error('Invalid historical scenario.');
   for(const k of Object.keys(p.start))if(!Number.isFinite(d.m[k]))throw Error('Invalid historical metrics.');
  }
  r.version=VERSION;r.at=Number.isFinite(r.at)?r.at:Date.now();
  r.label=r.kind==='life'?`${d.name}, age ${d.age}`:`${PRES.find(p=>p.id===d.id).name}, decision ${d.i+1}`;
  return r;
 }
 function parse(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)throw Error('Save file is too large.');return validate(JSON.parse(text));}
 function read(i){const raw=ls.get('bt_slot_'+i);return raw?parse(raw):null;}
 function slots(){return [0,1,2,3,4].map(i=>{try{return read(i)}catch(e){return {invalid:true,label:'Unreadable save — export or delete to recover',at:0}}});}
 function prepare(r){r=validate(r);return r.kind==='life'?fix2(r.data):r.data;}
 function save(i,kind){try{const d=kind==='hist'?h:g;if(!d)return false;const r=validate({version:VERSION,kind,at:Date.now(),data:d});return ls.set('bt_slot_'+i,JSON.stringify(r));}catch(e){return false;}}
 function importText(text,i){if(!Number.isInteger(i)||i<0||i>4)throw Error('Invalid destination slot.');const r=parse(text);prepare(r);if(ls.get('bt_slot_'+i)&&!confirm('Replace the save in slot '+(i+1)+'?'))return false;if(!ls.set('bt_slot_'+i,JSON.stringify(r)))throw Error('Browser storage is unavailable or full.');return true;}
 function exportSlot(i){const raw=ls.get('bt_slot_'+i);if(!raw)return;const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`born-to-run-slot-${i+1}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function importFile(input,i){try{const f=input.files[0];if(!f)return;if(f.size>MAX_BYTES)throw Error('Save file is too large.');if(importText(await f.text(),i))draw();}catch(e){alert('Could not import this save: '+e.message)}finally{input.value='';}}
 return {validate,parse,read,slots,prepare,save,importText,exportSlot,importFile};
})();
// Slot controls are added independently of gameplay rendering.
const savesOriginalView=view;
view=function(){let html=savesOriginalView();if(scr!=='slots')return html;
 const holder=document.createElement('div');holder.innerHTML=html;
 holder.querySelectorAll('.card').forEach((card,i)=>{
  if(ls.get('bt_slot_'+i)){const b=document.createElement('button');b.className='b';b.textContent='Export slot '+(i+1);b.onclick=()=>SaveStore.exportSlot(i);b.setAttribute('onclick',`SaveStore.exportSlot(${i})`);card.append(b);}
  const label=document.createElement('label');label.textContent='Import JSON into slot '+(i+1);label.htmlFor='import-slot-'+i;
  const input=document.createElement('input');input.id=label.htmlFor;input.type='file';input.accept='.json,application/json';input.setAttribute('onchange',`SaveStore.importFile(this,${i})`);card.append(label,input);
 });return holder.innerHTML;
};
