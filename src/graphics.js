/* Attach artwork to existing controls; no gameplay state or save format changes. */
function artEntityKind(r){return r?.role==='Pet'?'pet':'person';}
function artInsert(card,kind,entity,hero=false){if(!card||card.querySelector(':scope > .game-art'))return;card.classList.add('illustrated-card');if(hero)card.classList.add('illustrated-card--hero');card.insertAdjacentHTML('afterbegin',GameArt.svg(kind,entity,hero?'hero':'thumb'));}
function artFirstCard(html,kind,entity,hero=false){const box=document.createElement('div');box.innerHTML=html;artInsert(box.querySelector('.card'),kind,entity,hero);return box.innerHTML;}
function artDecorateCatalog(html){const box=document.createElement('div');box.innerHTML=html;
 for(const b of box.querySelectorAll('button[onclick]')){
  const action=b.getAttribute('onclick');let kind,entity,match;
  if((match=action.match(/^stuffBuyCar\((\d+)\)/))){kind='car';entity=STUFF_CARS[+match[1]];}
  else if((match=action.match(/^stuffBuyHome\((\d+)\)/))){kind='home';entity=STUFF_HOMES[+match[1]];}
  else if((match=action.match(/^stuffBuyLux\((\d+)\)/))){kind='lux';const x=STUFF_LUX[+match[1]];if(x)entity={n:x[0],assetType:x[3]};}
  if(entity){artInsert(b.closest('.card'),kind,entity);continue;}
  if((match=action.match(/^buyVeh\('([bp])',(\d+)\)/))){kind=match[1]==='b'?'boat':'plane';const x=(kind==='boat'?BOATS:PLANES)[+match[2]];if(x)entity={n:x[0]};}
  else if((match=action.match(/^adopt\((\d+)\)/))){kind='pet';const x=PETS[+match[1]];if(x)entity={n:x[0],kind:x[0]};}
  else if((match=action.match(/^put\('([^']+)'/))){kind='money';entity={n:match[1]};}
  if(entity){b.classList.add('illustrated-button');b.insertAdjacentHTML('afterbegin',GameArt.svg(kind,entity,'mini'));}
 }
 return box.innerHTML;
}
const artShopView=stuffShopView;
stuffShopView=function(){return artDecorateCatalog(artShopView());};
const artOwnedList=stuffOwnedList;
stuffOwnedList=function(which){const box=document.createElement('div');box.innerHTML=artOwnedList(which);
 for(const card of box.querySelectorAll('.card[onclick]')){const m=card.getAttribute('onclick').match(/stuffOpenItem\('([^']+)','([^']+)'\)/);if(m){const entity=stuffAsset(m[1],m[2]);if(entity)artInsert(card,m[1],entity);}}
 if(which==='Property'&&g.home&&!g.home.own)artInsert(box.querySelector('.card'),'home',g.home);return box.innerHTML;
};
const artDetail=stuffItemDetail;
stuffItemDetail=function(kind,id){const x=stuffAsset(kind,id);return x?artFirstCard(artDetail(kind,id),kind,x,true):artDetail(kind,id);};
const artPurchase=stuffPurchaseView;
stuffPurchaseView=function(){const html=artPurchase(),o=stuffPurchaseOffer;return o?artFirstCard(html,o.kind,{n:o.name,type:o.type},true):html;};
const artPersonCard=relationshipPersonCard;
relationshipPersonCard=function(r,dead){const html=artFirstCard(artPersonCard(r,dead),artEntityKind(r),r);return dead?html.replace('illustrated-card','illustrated-card illustrated-card--memorial'):html;};
const artRelationshipView=relationshipView;
relationshipView=function(){const html=artRelationshipView(),r=sel&&g.rel.find(x=>x.id===sel);return r?artFirstCard(html,artEntityKind(r),r,true):html;};
relV=relationshipView;
function artKnownPeople(){if(!g)return [];const people=[];
 const add=(list,age)=>{for(const p of list||[])people.push({...p,n:p.n||p.name,age:p.age??age});};
 add(g.elem?.classmates,g.age);add(g.elem?.teacher?[g.elem.teacher]:[],35);add(g.middle?.classmates,g.age);add(g.middle?.teacher?[g.middle.teacher]:[],40);add(g.highSchool?.classmates,g.age);add(g.highSchool?.teacher?[g.highSchool.teacher]:[],40);
 add(g.educationJourney?.preschool?.classmates,g.age);add(g.educationJourney?.preschool?.teacher?[g.educationJourney.preschool.teacher]:[],35);add(g.collegeTrack?.current?.peers,g.age);add(g.collegeTrack?.current?.professors,48);add(g.collegeTrack?.current?.club?.team,g.age);add(g.collegeTrack?.current?.club?.coach?[g.collegeTrack.current.club.coach]:[],42);add(g.co,g.age);add(g.job?.boss?[g.job.boss]:[],45);return people;
}
const artWorkView=workV;
workV=function(){const box=document.createElement('div');box.innerHTML=artWorkView();const people=artKnownPeople();
 for(const card of box.querySelectorAll('.card')){const title=card.querySelector(':scope > .t,:scope > .row > .t,:scope > h2,:scope > h3'),text=title?.textContent||'';const person=people.find(p=>p.n&&(text===p.n||text.endsWith(' '+p.n)||text.endsWith(' · '+p.n)));if(person)artInsert(card,'person',person);else if(g.job&&text===g.job.t)artInsert(card,'career',{n:g.job.t});else if(/^(Preschool|Elementary|Middle School|High School|Education journey|College & Higher Education)/i.test(text))artInsert(card,'education',{n:text});}
 return box.innerHTML;
};
const artGameView=gameView;
gameView=function(){const box=document.createElement('div');box.innerHTML=artGameView();const name=box.querySelector('.hd .row > .t');if(name){name.classList.add('player-name');name.insertAdjacentHTML('afterbegin',GameArt.svg('person',{id:'player:'+g.name,n:g.name,age:g.age},'avatar'));}return box.innerHTML;};
const artOtherView=otherV;
otherV=function(){const box=document.createElement('div');box.innerHTML=artOtherView();if(!NV.O.length){for(const b of box.querySelectorAll('button[onclick]')){const m=b.getAttribute('onclick').match(/nv\('O','([^']+)'\)/);const dashboard=b.textContent==='Financial dashboard';if(m||dashboard){b.classList.add('illustrated-button');b.insertAdjacentHTML('afterbegin',GameArt.svg(m?m[1].toLowerCase():'money',{n:m?m[1]:'Financial dashboard'},'mini'));}}}return box.innerHTML;};
const artStuffOverview=stuffTop;
stuffTop=function(){const box=document.createElement('div');box.innerHTML=artStuffOverview();const category=stuffShopTab,kind=category==='Property'?'home':category==='Jewelry'?'lux':category==='Vehicles'?'boat':category==='Pets'?'pet':category==='Investments'?'money':'car',entity={n:category,type:category==='Cars'?'Sports coupe':category==='Property'?'Modern home':category==='Jewelry'?'Watch':'',kind:category==='Pets'?'Cat':''};
 for(const card of box.children){const title=card.querySelector?.(':scope > .t');if(title?.textContent==='Shopping')artInsert(card,kind,entity);if(title?.textContent==='Owned'&&!card.querySelector('.game-art'))artInsert(card,stuffOwnedTab==='Property'?'home':stuffOwnedTab==='Misc'?'lux':'car',{n:'Your collection',type:stuffOwnedTab==='Misc'?'watch':''});}return box.innerHTML;};
const artPeopleWork=workV;
workV=function(){const box=document.createElement('div');box.innerHTML=artPeopleWork();const people=artKnownPeople();for(const b of box.querySelectorAll('button.b')){if(b.querySelector('.game-art'))continue;const text=b.textContent||'',person=people.find(p=>p.n&&(text.startsWith(p.n+' ')||text.includes(' · '+p.n)||text.startsWith('Teacher '+p.n)));if(person){b.classList.add('illustrated-button');b.insertAdjacentHTML('afterbegin',GameArt.svg('person',person,'mini'));}}return box.innerHTML;};
