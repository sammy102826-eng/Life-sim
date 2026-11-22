const heritageCall=(name,...args)=>name+'('+args.map(x=>uiEscape(JSON.stringify(x))).join(',')+')';
const heritageButton=(label,action,arg='',value='',disabled=false)=>B(label,heritageCall('heritageClick',action,arg,value),disabled);
let heritagePage='site',heritageSelected=null;
function heritageOpen(page='site'){
 tab='Work';wsel='archaeology';wsub=null;heritagePage=page;draw(1);
}
function heritageStuff(page,id=null){
 if(!g.alive||g.jail)return;
 tab='Stuff';NV.S=[page];stuffSelected=null;stuffPurchaseOffer=null;heritageSelected=id;draw(1);
}
function heritageClick(action,arg,value){
 if(!g.alive||g.jail||publicityBusy()||g.justice?.pending)return;
 const s=heritageState();
 const item=s.artifacts.find(x=>x.id===arg);
 let error;
 if(action==='start')error=heritageStart();
 else if(action==='site')error=heritageAcquireSite();
 else if(['survey','dig'].includes(action))error=heritageField(action,arg);
 else if(action==='lab')error=heritageLab(item,value);
 else if(action==='move')error=heritageMove(item,value);
 else if(action==='museum')error=heritageCreateMuseum(document.getElementById('museum-name')?.value);
 else if(action==='home')error=homeCustomize(stuffAsset('home',heritageSelected),arg,value,document.getElementById('heritage-'+value)?.value);
 else if(action==='home-store'){
  error=homeCustomize(stuffAsset('home',heritageSelected),'store',arg,value);
 }else if(action==='event'){
  const e=s.events.find(x=>x.id===arg);
  if(heritageEventReady(s,e))return newsOpenBrief(e.article);
  return;
 }else if(action==='quit'){
  if(heritageJob()){wsel=null;wsub=null;quit(-1);}
  return;
 }else{
  if(['fee','withdraw','fund'].includes(action)){
   const input=document.getElementById('museum-'+(action==='fee'?'fee':'transfer'));
   value=input?.value.trim()?Number(input.value):NaN;
  }else if(action==='buy'||action==='trade')value=document.getElementById('museum-dealer')?.value;
  error=heritageMuseumAction(action,arg,value);
 }
 if(error)return toast(error);
 draw(1);
}
function heritageEventList(s,museum){
 const pending=s.events.filter(x=>heritageMuseumEvent(x)===museum&&heritageEventReady(s,x));
 return pending.length?studioSection('Open decisions',pending.map(e=>heritageButton(uiEscape(HERITAGE_EVENTS[e.key][0]),'event',e.id)).join('')):'';
}
function heritageArtifactView(item,location){
 const dealer=item.method==='dealer',locked=item.restricted,carbon=['Plant fiber','Charcoal','Wood'].includes(item.material);
 const h=`<p>${uiEscape(item.origin)} · ${uiEscape(item.material)} · Condition ${item.condition}/100</p>
  <p>${dealer?'Dealer provenance documented':(item.mapped?'Stratigraphy mapped':'Context unmapped')+' · '+(item.method==='carbon'?'Radiocarbon dated':item.method==='chemical'?'Chemical analysis completed':'Lab work pending')}
  ${item.date?' · Estimated '+item.date.join('–')+' years old':''}</p><p>Appraisal ${loc(item.value)}${locked?' · Public deposit required by permit':''}</p>`;
 const controls=location==='lab'?heritageButton('Map stratigraphy','lab',item.id,'map',item.mapped)+
  heritageButton('Scientific test · chemical analysis','lab',item.id,'chemical',!item.mapped||!!item.method)+
  heritageButton('Scientific test · radiocarbon dating','lab',item.id,'carbon',!item.mapped||!!item.method||!carbon)+
  heritageButton('Keep in personal inventory','move',item.id,'private',!item.method||locked)+
  heritageButton('Send to your museum','move',item.id,'museum',!item.method||locked||!g.heritage.museum):
  location==='museum'?heritageButton('Clean and conserve','clean',item.id,'',item.cleanAge===g.age||item.condition>=100)+
   heritageButton('Trade with selected dealer listing','trade',item.id):
   heritageButton('Send to your museum','move',item.id,'museum',!g.heritage.museum);
 return '<details class="card"><summary>'+uiEscape(item.name)+'</summary>'+h+controls+
  heritageButton('Donate to a public museum','move',item.id,'donated',location==='lab'&&!item.method)+
  heritageButton('Sell through a licensed dealer','move',item.id,'sold',locked||location==='lab'&&!item.method)+'</details>';
}
function heritageWorkView(){
 const s=heritageState(),site=heritageSite(s),c=s.career;
 if(!heritageAtSite(s)){
  return B('Back to Special careers',"wsel=null;wsub='Special';draw(1)")+
   studioSection('Archaeologist','<p>Join a supervised field program at 18 or older. Open a site after three years of work, a published discovery, and reputation of 42.</p><p>Available countries · '+
    Object.keys(DIG_REGIONS).filter(k=>Object.hasOwn(g.w,k)).map(uiEscape).join(', ')+'</p>'+
    (Object.hasOwn(DIG_REGIONS,g.country)?'<p>In '+uiEscape(g.country)+' · '+DIG_REGIONS[g.country][0]+'</p>':
     B('Browse the emigration menu',"tab='Other';NV.O=['World','Emigrate'];draw(1)"))+
    heritageButton('Join the field team','start','','',!heritageCareerEligible()));
 }
 const back=heritagePage==='site'?B('Back to Work',"mainTabOpen('Work')"):B('Back to dig site',"heritageOpen()");
 const head=studioSection(site.name,'<p>'+uiEscape(site.country)+' · '+(site.owned?'Independent excavation':'Research institute field team')+'</p>'+
  Bar('Reputation',c.reputation,GOLD)+Bar('Survey',site.survey,'#4FB39A')+'<p>'+c.years+' field years · '+c.discoveries+' published discoveries · Lab skill '+c.analysis+'/100</p>');
 const actions=heritagePage==='artifacts'?studioSection('Field lab',
  s.artifacts.filter(a=>a.place==='lab'&&a.site===site.id).map(a=>heritageArtifactView(a,'lab')).join('')||'<p>Dig for the first find.</p>'):
   heritageEventList(s,false)+studioSection('Fieldwork',
    '<p>'+DIG_REGIONS[site.country][1]+'. Survey before digging. Deeper layers open as the site is mapped and excavated.</p>'+
    (site.paused>g.age?'<p>Work is paused for the rest of the season.</p>':'')+
    heritageButton('Explore · survey the site','survey','','',site.used.survey===g.age||site.paused>g.age)+
    DIG_STRATA.map(([name,depth,min],i)=>heritageButton('Dig · '+name+' <small>'+depth+' · Survey '+min+'%</small>',
     'dig',i,'',site.survey<min||i>site.layer||site.used.dig===g.age&&site.effort>=2||site.paused>g.age)).join('')+
    B('Analyze material and manage artifacts',"heritageOpen('artifacts')")+
    (!site.owned?heritageButton('Acquire a private site permit · '+loc(pr(34000)),'site','','',
     c.years<3||c.discoveries<1||c.reputation<42):''))+
   heritageButton('Leave the field team','quit');
 return '<div class="law-shell">'+back+head+actions+'</div>';
}
function heritageMuseumView(){
 const back=B('Back to Stuff',"mainTabOpen('Stuff')"),s=heritageState(),m=s.museum;
 if(!m)return back+studioSection('Open your own museum','<p>Opening costs '+loc(pr(76000))+
  ' and includes a main gallery with eight display spaces and an operating reserve.</p><label for="museum-name">Museum name</label>'+
  '<input id="museum-name" class="txt" maxlength="52">'+heritageButton('Open museum','museum','','',!heritageAdult()));
 const league=studioStats([['Cash reserve',loc(m.cash)],['Collection',museumItems(s).length+' / '+museumSlots(m)],
  ['Admission',m.fee?loc(m.fee):'Free'],['Field trips this year',m.trips+' / '+m.wings.length*2]]);
 const finance=studioSection('Finance',
  (m.last?studioStats([['Visitors',m.last.visitors],['Admissions',loc(m.last.admissions)],['Donations & grants',loc(m.last.donations+m.last.grant)],
   ['Operating expenses',loc(m.last.expenses)],['Taxes',loc(m.last.taxes)],['Unfunded costs',loc(m.last.loss)]]):'<p>The first annual report arrives at Age Up.</p>')+
  '<p>Personal withdrawal withholding · '+finDistributionTax(100)+'%</p>'+'<label for="museum-transfer">Transfer amount</label><input class="txt" type="number" min="1" step="1" id="museum-transfer">'+
  heritageButton('Invest personal funds','fund')+heritageButton('Withdraw a taxable distribution','withdraw'));
 return '<div class="law-shell">'+back+studioSection(m.name,league+Bar('Reputation',m.reputation,GOLD))+
  heritageEventList(s,true)+`<details class="law-section"><summary>Finances and transfers</summary>${finance}</details>`+
  `<details class="law-section"><summary>Admission and field trips</summary><label for="museum-fee">Ticket price (0 for free entry)</label>
  <input class="txt" type="number" min="0" step="1" id="museum-fee" value="${m.fee}">`+heritageButton('Set admission','fee')+
  heritageButton('Host a school field trip · '+loc(pr(180)),'trips','','',!m.staff.guide||m.trips>=m.wings.length*2)+'</details>'+
  '<details class="law-section"><summary>Wings and expansion</summary>'+Object.entries(MUSEUM_WINGS).map(([key,[name,slots,cost]])=>
   m.wings.includes(key)?'<p>'+name+' · '+slots+' spaces · Open</p>':
   heritageButton(name+' · '+slots+' spaces · '+loc(pr(cost)),'wing',key,'',m.cash<pr(cost))).join('')+'</details>'+
  '<details class="law-section"><summary>Staff management</summary>'+
  Object.entries(MUSEUM_STAFF).map(([k,[title,salary,base]])=>'<div class="card"><p>'+title+' · '+m.staff[k]+' / '+(base+m.wings.length-1)+
   ' · '+loc(pr(salary))+' per year each</p>'+heritageButton('Hire '+title.toLowerCase(),'staff',k,1,m.staff[k]>=base+m.wings.length-1)+
   heritageButton('Release '+title.toLowerCase(),'staff',k,-1,m.staff[k]===0)+'</div>').join('')+'</details>'+
  '<details class="law-section"><summary>Collection, purchases, and trades</summary>'+
  studioSelect('museum-dealer','Licensed dealer inventory',Object.entries(DIG_FINDS).map(([k,[name,,base]])=>[k,name+' · '+loc(pr(base*1.4))]))+
  heritageButton('Buy selected artifact','buy','','',museumItems(s).length>=museumSlots(m))+
  museumItems(s).map(a=>heritageArtifactView(a,'museum')).join('')+
  B('Personal artifact inventory',"heritageStuff('Artifacts')")+'</details></div>';
}
function heritageHomeView(){
 const h=stuffAsset('home',heritageSelected);
 const back=h?B('Back to home','NV.S=[];'+heritageCall('stuffOpenItem','home',h.id)):B('Back to Stuff',"mainTabOpen('Stuff')");
 if(!h)return back;
 const display=homeItems(h),choices={
  lux:g.lux.filter(x=>x.showHome!==h.id).map(x=>[x.id,x.n]),
  artifact:(g.heritage?.artifacts||[]).filter(x=>x.place==='private'&&x.display!==h.id).map(x=>[x.id,x.name])
 };
 return back+studioSection('Customize '+h.n,
  '<p>'+parkingSpaces(h)+' parking spaces here · '+parkingMessage()+'</p><p>'+display.length+' / '+homeDisplayLimit(h)+
  ' display places · Displayed belongings can be stolen in a burglary.</p>'+
  studioSelect('heritage-style','Interior style',['Original','Traditional','Minimalist','Gallery','Retro','Eclectic'].map(k=>[k,k]))+
  heritageButton('Apply selected style · '+loc(pr((h.tier||1)*360)),'home','style','style')+
  heritageButton('Build a parking space · '+loc(pr(6200+1900*(h.parkingAdded||0))),'home','parking','',!h.own||g.age<18||h.parkingAdded>=4)+
  Object.entries(choices).map(([kind,rows])=>rows.length?studioSelect('heritage-'+kind,kind==='lux'?'Owned valuables and devices':'Owned artifacts',rows)+
   heritageButton('Put on display','home','display',kind,display.length>=homeDisplayLimit(h)):'').join('')+
  display.map(({kind,item})=>heritageButton('Put '+uiEscape(item.name||item.n)+' away','home-store',kind,item.id)).join(''));
}
