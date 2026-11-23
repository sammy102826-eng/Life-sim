const cleanupBackButton=container=>[...container.querySelectorAll('button[onclick]')].find(button=>
 /^Back(?:\b|$)/i.test(button.textContent.trim())&&!button.closest('details')&&button.closest('.info,.ev')===(container.matches('.info,.ev')?container:null));
function cleanupPinBack(container){
 if(!container)return;
 const button=cleanupBackButton(container);
 if(!button)return;
 const dock=document.createElement('div');dock.className='back-dock';
 button.classList.add('back-bubble');
 const label=button.textContent.trim();button.setAttribute('aria-label',label);button.title=label;
 button.innerHTML='<span aria-hidden="true">‹</span> Back';
 dock.append(button);container.prepend(dock);
}
const cleanupOldView=view;
view=function(){
 const html=cleanupOldView(),box=document.createElement('div');
 box.innerHTML=html;
 const info=box.querySelector('.info');
 if(info)cleanupPinBack(info);
 else cleanupPinBack(box);
 for(const panel of box.querySelectorAll('.mo .ev'))cleanupPinBack(panel);
 return box.innerHTML;
};
function cleanupRoute(tabName,path){
 tab=tabName;NV[tabName==='Other'?'O':'S']=path;
 stuffSelected=null;stuffPurchaseOffer=null;stuffGiftMode=false;
 draw(1);
}
const cleanupWork=workV;
workV=function(){
 if(g.jail)return cleanupWork();
 if(wsub==='Military'&&!wsel){
  const rows=JB.ft.map((job,index)=>({job,index})).filter(({job})=>job[1]==='military');
  return B('Back to Work',"mainTabOpen('Work')")+'<h2>Join the military</h2>'+rows.map(({job,index})=>
   B((job[0]==='Soldier'?'Enlist as a soldier':'Become an officer')+
    '<small> Age '+job[5]+'+ · '+(job[0]==='Soldier'?'ASVAB and four-year enlistment':'College degree required')+'</small>',`hire('ft',${index})`)).join('');
 }
 const html=cleanupWork(),root=document.createElement('div');root.innerHTML=html;
 if(!wsel&&wsub==='Special'){
  for(const el of root.querySelectorAll('button[onclick="eduOpen()"]'))el.remove();
  for(const el of root.querySelectorAll(':scope > .t'))if(/^Current\b/.test(el.textContent.trim()))el.remove();
  for(const el of root.querySelectorAll(':scope > .card'))if(el.matches('[onclick^="wsel="]')||/^Current\b/.test(el.querySelector('h2')?.textContent||''))el.remove();
  for(const el of root.querySelectorAll(':scope > p'))if(/not working or studying/.test(el.textContent))el.remove();
  const back=[...root.querySelectorAll('button')].find(el=>/^Back\b/.test(el.textContent.trim()));
  if(back)root.prepend(back);
  const heading=document.createElement('h2');heading.textContent='Special careers';root.insertBefore(heading,back?.nextSibling||root.firstChild);
  const promoted=[...root.querySelectorAll('button')].filter(b=>/^(Police officer|Pro athlete)\b/.test(b.textContent.trim()));
  heading.after(...promoted);
 }else if(!wsel&&!wsub){
  const part=[...root.querySelectorAll('button')].find(b=>/^Find a part-time job$/.test(b.textContent.trim()));
  if(part)part.insertAdjacentHTML('afterend',B('Join the military',"wsub='Military';draw(1)"));
 }
 return root.innerHTML;
};
delete OSUB.Money;
for(const k of ['Money']){
 const index=OMENU.findIndex(row=>row[0]===k);if(index>=0)OMENU.splice(index,1);
}
OMENU.push(['Museum','Open or manage your own museum'],['Appearance','Hair, styling, and self-care']);
const cleanupOther=otherV;
otherV=function(){
 if(g.jail)return cleanupOther();
 const route=NV.O[0];
 if(route==='Museum')return heritageMuseumView();
 if(route==='Appearance')return appearanceMenu();
 const html=cleanupOther(),holder=document.createElement('div');holder.innerHTML=html;
 for(const b of holder.querySelectorAll('button[onclick="eduOpen()"]'))b.remove();
 return holder.innerHTML;
};
function cleanupHealth(){
 const medical=medicalEnsure(),waiting=medical.appointments.filter(a=>a.status==='Scheduled');
 return studioSection('Health care','<p>Start here when you feel unwell. Attend a visit, then open the recommended care plan.</p>'+
  (waiting.length?waiting.map(a=>B('Attend '+MEDICAL_SPECIALTIES[a.specialty].name,`medicalAttend('${a.id}');draw(1)`)).join(''):
    B('Book primary care',"medicalBook('primary','symptoms')",
    medical.appointments.filter(a=>a.age===g.age&&a.status==='Completed'&&a.specialty==='primary').length>=2))+
  g.dz.filter(d=>d.known&&!d.resolved).map(d=>medicalConditionView(d)).join('')+
  ['Appointments','Body','Life stages','Prevention','Records','Family Planning'].map(label=>
   B(label,`NV.O=['Health','${label}'];draw(1)`)).join(''));
}
const cleanupOtherHealth=otherV;
otherV=function(){
 if(!g.jail&&NV.O[0]==='Health'&&NV.O.length===1)return B('Back to Other',"mainTabOpen('Other')")+cleanupHealth();
 return cleanupOtherHealth();
};
