const STUDIO_PAGES={overview:'Studio overview',projects:'Projects',industry:'Industry',releases:'Releases',awards:'Awards',assets:'Facilities',inbox:'Production inbox',recovery:'Recovery plan'};
let studioPage='overview',studioProjectId=null,studioIndustryTab='people';
const studioBtn=(name,action,id=0,arg='',disabled=false)=>B(name,`studioAction('${action}',${id},'${arg}')`,disabled);
const studioSection=(name,body)=>`<section class="law-section"><h3>${uiEscape(name)}</h3>${body}</section>`;
const studioSelect=(id,label,rows)=>`<label for="${id}">${label}</label><select id="${id}">${rows.map(([value,text,selected])=>`<option value="${uiEscape(value)}"${selected?' selected':''}>${uiEscape(text)}</option>`).join('')}</select>`;
const studioVal=id=>document.getElementById(id)?.value;
const studioStats=rows=>'<div class="law-metrics">'+rows.map(([k,v])=>lawMetric(k,v)).join('')+'</div>';
function studioOpen(page='overview',project=null){
  if(!studioHas(STUDIO_PAGES,page))return;
  studioPage=page;studioProjectId=project;tab='Work';wsel='job';wsub=null;draw(1);
}
function studioIndustry(key){
  if(!['people','theaters','streaming','rankings'].includes(key))return;
  studioIndustryTab=key;studioOpen('industry');
}
function studioPopup(kind,id=0){
  if(!studioActive()||studioBlocked()||g.studio.pending||!['finance','script','close','rights','asset','restructure'].includes(kind))return;
  g.studio.pending={kind,id};draw();
}
function studioPopupClose(){
  if(g.studio?.pending)g.studio.pending=null;
  draw();
}
function studioMessage(text){
  if(!text)return;
  g.result={t:'Movie studio',d:uiEscape(text)};
  draw();
}
function studioScriptSave(){
  const s=g.studio,pending=s?.pending;
  if(!studioActive()||pending?.kind!=='script'||studioBlocked())return;
  const source=studioFind(s.projects,pending.id);
  const settings={name:studioVal('script-name'),genre:studioVal('script-genre'),media:studioVal('script-media'),format:studioVal('script-format'),
    rating:studioVal('script-rating'),leads:Number(studioVal('script-leads')),support:Number(studioVal('script-support')),background:Number(studioVal('script-background'))};
  const response=pending.id&&!source?'The original title is unavailable.':studioNewProject(s,settings,source);
  if(typeof response==='string'){document.getElementById('studio-form-error').textContent=response;return;}
  s.pending=null;studioOpen('projects',response.id);
}
function studioTransferBounds(){
  const mode=studioVal('studio-transfer-mode'),range=document.getElementById('studio-transfer-range'),text=document.getElementById('studio-transfer-text');
  if(!range||!text)return;
  const maximum=Math.max(0,studioToDisplay(mode==='withdraw'?g.studio.cash:g.cash));
  range.max=String(maximum);text.max=String(maximum);
  const amount=Math.min(maximum,Math.max(0,Number(text.value)||0));
  range.value=String(amount);text.value=String(amount);
}
function studioSyncTransfer(from){
  const range=document.getElementById('studio-transfer-range'),text=document.getElementById('studio-transfer-text');
  if(from==='range')text.value=range.value;
  else range.value=String(Math.min(Number(range.max),Math.max(0,Number(text.value)||0)));
}
function studioSubmitTransfer(){
  if(!studioActive()||g.studio.pending?.kind!=='finance'||studioBlocked())return;
  const mode=studioVal('studio-transfer-mode'),value=Number(studioVal('studio-transfer-text'));
  if(!['invest','withdraw'].includes(mode))return;
  const balance=mode==='withdraw'?g.studio.cash:g.cash;
  if(!Number.isSafeInteger(value)||value<=0||value>studioToDisplay(balance))return studioMessage('Enter a positive whole amount within the available balance.');
  studioMessage(studioTransfer(g.studio,mode,Math.min(studioToAccount(value),Math.floor(balance))));
}
function studioConfirm(){
  const s=g.studio,pending=s?.pending;
  if(!studioActive()||!pending||studioBlocked())return;
  if(pending.kind==='close')return studioClose();
  let text='';
  if(pending.kind==='asset')text=studioAssetAction(s,pending.id,'sell');
  if(pending.kind==='rights')text=studioSellRights(s,studioFind(s.projects,pending.id));
  if(pending.kind==='restructure')text=studioRestructure(s);
  s.pending=null;studioMessage(text||'The transaction is no longer available.');
}
function studioAction(action,id,arg){
  const s=g.studio;
  if(!studioActive()||s.pending||studioBlocked())return;
  const p=studioFind(s.projects,id),person=studioFind(s.people,id);
  let text='';
  switch(action){
    case 'phase':
      text=studioPhaseChoice(s,p,Number(arg));break;
    case 'cast':{
      const slot=Number(arg),talent=studioFind(s.people,Number(studioVal('studio-cast-'+slot)));
      text=studioCasting(s,p,slot,talent);break;
    }
    case 'castLock':
      text=studioLockCast(s,p);break;
    case 'crew':
      text=studioAssignCrew(s,p,studioFind(s.people,Number(studioVal('studio-crew-'+arg))));break;
    case 'industryHire':{
      const [key,slot]=(studioVal('studio-person-project-'+id)||'').split(',').map(Number);
      const production=studioFind(s.projects,key);
      text=studioHas(STUDIO_ROLES,person?.role)?studioCasting(s,production,slot,person):studioAssignCrew(s,production,person);
      break;
    }
    case 'staff':
      text=arg==='hire'?studioHireStaff(s,person):studioReleaseStaff(s,person);break;
    case 'financePitch':
      text=studioSeekInvestment(s,p);
      if(p?.investor&&text.startsWith('Outside funding')&&p.investor.advance>=studioCost(s,105000)){
        studioHeadline(s,p,'A production attracts outside backing',s.name+' secured external investment for '+p.name+'.','funding-'+p.id);
      }
      break;
    case 'distribution':{
      const key=arg==='industry'?Number(studioVal('studio-industry-project')):id;
      text=studioConfigureRelease(s,studioFind(s.projects,key),studioVal('studio-outlet'),studioVal('studio-deal'));break;
    }
    case 'market':
      text=studioMarket(s,p,Number(studioVal('studio-campaign')),Number(studioVal('studio-release-window')));break;
    case 'asset':
      if(arg==='sell')return studioPopup('asset',id);
      text=studioAssetAction(s,id,'buy');break;
    case 'license':
      text=studioLicense(s,id);break;
    case 'offerDecline':{
      const item=studioFind(s.offers,id);
      if(!item)return;
      s.offers=s.offers.filter(x=>x!==item);
      text='The studio declined the offer and kept the title available.';break;
    }
    case 'solicit':{
      if(!p?.rights||p.stage!=='released'||p.solicited===s.age)return;
      p.solicited=s.age;
      const offer=studioGenerateOffer(s,p,studioRandom(s,0,2));
      text=offer?'A platform quoted terms. Open Industry → Streaming services to review them.':'The rights are committed or a licensing offer is already open.';break;
    }
    case 'awards':
      text=studioAwards(s);break;
    case 'network':{
      const network=STUDIO_OUTLETS[arg],price=studioCost(s,1600);
      const yearKey='outlet:'+arg;
      if(!network||s[yearKey]===s.age)return;
      if(!studioSpend(s,price,studioChannelName(network.channel)))return studioMessage('The studio cannot afford the booking meeting.');
      s[yearKey]=s.age;s.outlets[arg]=studioClamp(s.outlets[arg]+8);
      text='The studio strengthened its relationship with '+network.name+'.';break;
    }
    default:return;
  }
  studioMessage(text);
}
function studioPrivateOpen(id){
  const s=g.studio,entry=s&&studioFind(s.incidents,id),data=STUDIO_INCIDENTS[entry?.key];
  if(!studioActive()||studioBlocked()||s.pending||!data||entry.closed)return;
  if(data.public)return newsOpenBrief(entry.story);
  const token=uid();s.review={token,id,age:g.age};
  const p=studioFind(s.projects,entry.project);
  g.event={x:uiEscape(data.headline+' during '+p.name+'.'),c:data.choices.map(([label,cost],index)=>[
    label+(cost?' · '+studioMoney(studioCost(s,cost)):''),
    {studioDecision:{token,index}},'Your production decision was recorded.'
  ])};
  draw();
}
let studioEventReceipt=null;
const studioOldEffect=E;
E=function(effect){
  const result=studioOldEffect(effect),d=effect?.studioDecision,s=g.studio;
  if(d&&studioActive()&&s.review?.token===d.token&&s.review.age===g.age&&[0,1,2].includes(d.index)){
    const incident=studioFind(s.incidents,s.review.id);
    s.review=null;
    studioEventReceipt=studioResolveIncident(s,incident,d.index).text;
  }
  return result;
};
const studioOldPick=pick;
pick=function(index){
  studioEventReceipt=null;
  const result=studioOldPick(index);
  if(studioEventReceipt&&g.result){g.result.d=uiEscape(studioEventReceipt);draw();}
  return result;
};
function studioWorkView(s){
  const views={overview:studioOverview,projects:studioProjects,industry:studioIndustryView,releases:studioReleases,awards:studioAwardView,
    assets:studioFacilities,inbox:studioInbox,recovery:studioRecovery};
  return `<div class="law-shell studio-shell">${B('Back to Work',"wsel=null;wsub=null;draw(1)")}
    <header class="law-header studio-heading"><div><h2>${uiEscape(s.name)}</h2><p>Movie studio</p></div><strong>${s.reputation}<small>Reputation</small></strong></header>
    ${B('Financials',"studioPopup('finance')")}
    <hr>
    <nav class="law-nav" aria-label="Movie studio sections">
      <button type="button" onclick="studioPopup('script')">Create Script</button>
      ${Object.entries(STUDIO_PAGES).filter(([key])=>key!=='recovery'||s.cash<0).map(([key,label])=>`<button type="button" aria-pressed="${studioPage===key}" onclick="studioOpen('${key}')">${key==='overview'?'Overview':label}</button>`).join('')}
    </nav>
    <div class="law-page"><h2>${STUDIO_PAGES[studioPage]}</h2>${views[studioPage](s)}</div></div>`;
}
function studioOverview(s){
  const top=studioRankings(s).findIndex(x=>x.id===0)+1,open=s.incidents.filter(x=>!x.closed).length;
  return studioStats([['Studio funds',studioMoney(s.cash)],['Projects in development',studioActiveProjects(s).length],['Studio rank',top+' of '+(s.rivals.length+1)],['Awards won',s.awards]])+
    (s.cash<0?studioSection('Studio deficit','<p>Production spending is paused until the studio can pay for it. Review assets, project rights and payroll.</p>'+B('Review recovery options',"studioOpen('recovery')")):'')+
    studioSection('Production slate','<p>Finish each stage before Age Up. Marketing reserves a release date. Age Up advances ready projects, runs annual accounts and releases titles due that year.</p>'+
      B('Review project pipeline',"studioOpen('projects')")+B(open?'Production inbox · '+open+' pending':'Production inbox',"studioOpen('inbox')"))+
    studioSection('Recent activity',s.history.slice(0,6).map(x=>`<p>Age ${x.age} · ${uiEscape(x.text)}</p>`).join(''));
}
function studioProjectCard(s,p,page){
  const info=[STUDIO_MEDIA[p.media][0],p.genre,'Quality '+p.quality+'/100',
    p.stage==='future'?'Releases at age '+p.releaseAge:p.ready&&p.stage!=='released'?'Ready for Age Up':p.record].filter(Boolean).join(' · ');
  return `<article class="law-item"><div><h4>${uiEscape(p.name)}</h4><p>${uiEscape(info)}</p></div>${B('Open project',`studioOpen('${page}',${p.id})`)}</article>`;
}
function studioProjects(s){
  const p=studioFind(s.projects,studioProjectId);
  if(p)return studioProjectView(s,p,'projects');
  const sections=[...Object.keys(STUDIO_STAGES).filter(k=>!['released','cancelled'].includes(k)).map(k=>[STUDIO_STAGES[k],x=>x.stage===k]),
    ['Current releases',x=>x.stage==='released'&&x.actual===s.age],['Past releases',x=>x.stage==='released'&&x.actual<s.age],['Shelved',x=>x.stage==='cancelled']];
  return sections.map(([label,test])=>studioSection(label,s.projects.filter(test).map(x=>studioProjectCard(s,x,'projects')).join('')||'<p class="d">No projects here.</p>')).join('');
}
function studioProjectView(s,p,back){
  const source=studioFind(s.projects,p.source);
  const cast=p.slots.map((x,i)=>{
    const person=studioFind(s.people,x.person);
    return `<p>${STUDIO_ROLES[x.role][0]} ${x.number} · ${uiEscape(person?.name||'Unfilled')}${person?' · '+studioMoney(x.fee):''}</p>`;
  }).join('');
  const credits=Object.entries(p.crew).map(([role,id])=>`<p>${STUDIO_CREW[role][0]} · ${uiEscape(studioFind(s.people,id)?.name)}</p>`).join('');
  const label=STUDIO_STAGES[p.stage];
  return B('Back to '+(back==='releases'?'Releases':'Projects'),`studioOpen('${back}')`)+studioSection(p.name,
    `<p>${STUDIO_MEDIA[p.media][0]} · ${STUDIO_FORMATS[p.format][0]} · ${p.genre} · Rated ${p.rating} · ${label} since age ${p.stageAge}</p>`+
    Bar('Project quality',p.quality,'#528a78')+Bar('Audience awareness',p.buzz,'#528a78')+
    `<p>Costs to date ${studioMoney(p.spent)} · ${p.stage==='released'?'Lifetime studio receipts '+studioMoney(p.earned):'Estimated committed production budget '+studioMoney(studioEstimate(s,p))}</p>`+
    (source?`<p>Continues ${uiEscape(source.name)}.</p>`:'')+(p.investor?`<p>Outside funding ${studioMoney(p.investor.advance)} · Investor share ${p.investor.share}% · Paid to investor ${studioMoney(p.investor.paid)}</p>`:''))
    +studioSection('Cast and crew',cast+(credits||'<p class="d">No additional crew credits yet.</p>'))
    +studioSection('Production decisions',studioStageView(s,p))
    +studioSection('Project record',p.decisions.map(note=>`<p>${uiEscape(note)}</p>`).join(''));
}
function studioStageView(s,p){
  const notices=studioIncidentsFor(s,p).map(e=>B('Respond: '+uiEscape(STUDIO_INCIDENTS[e.key].headline),`studioPrivateOpen(${e.id})`)).join('');
  if(p.stage==='cancelled')return '<p>This production was shelved after a rights sale.</p>';
  if(p.stage==='released')return studioReleaseDetails(s,p,true);
  if(p.stage==='future'){
    return `<p>${STUDIO_OUTLETS[p.distribution.outlet].name} · ${p.campaign} · Release at age ${p.releaseAge}</p>`+notices;
  }
  const pitch=['writing','casting','filming'].includes(p.stage)&&!p.investor?studioBtn('Pitch an outside investor','financePitch',p.id,'',p.financingAt===s.age):'';
  if(p.ready)return '<p>This stage is complete. Age Up to continue.</p>'+notices+pitch;
  let stage='';
  if(STUDIO_OPTIONS[p.stage]){
    const roles={writing:['writer'],filming:['director','producer','crew'],post:['editor']}[p.stage];
    stage=roles.filter(role=>!p.crew[role]).map(role=>{
      const candidates=s.people.filter(x=>x.role===role);
      return studioSelect('studio-crew-'+role,'Optional '+STUDIO_CREW[role][0].toLowerCase(),candidates.map(x=>[x.id,x.name+' · Skill '+x.skill+' · '+(x.retainer?'Under contract':studioMoney(studioTalentQuote(s,x)))]))+
        studioBtn('Hire selected '+STUDIO_CREW[role][0].toLowerCase(),'crew',p.id,role);
    }).join('')+STUDIO_OPTIONS[p.stage].map(([name,cost],i)=>studioBtn(name+' · '+studioMoney(studioProjectCost(s,p,cost)*(1-studioAssetDiscount(s,p.stage))),'phase',p.id,String(i),studioBlockingIncident(s,p))).join('');
  }
  if(p.stage==='casting'){
    stage=p.slots.map((slot,i)=>{
      if(slot.person)return '';
      const candidates=s.people.filter(x=>x.role===slot.role&&!p.slots.some(other=>other.person===x.id));
      const role=STUDIO_ROLES[slot.role][0]+' '+slot.number;
      return studioSelect('studio-cast-'+i,role,candidates.map(x=>[x.id,x.name+' · Skill '+x.skill+' · '+studioMoney(studioTalentQuote(s,x))]))+
        studioBtn('Sign '+role.toLowerCase(),'cast',p.id,String(i));
    }).join('')+studioBtn('Lock complete cast','castLock',p.id,'',p.slots.some(x=>!x.person));
  }
  if(p.stage==='marketing'){
    stage=(p.distribution?`<p>Signed with ${STUDIO_OUTLETS[p.distribution.outlet].name}.</p>`:studioDistributionForm(s,p))+
      studioSelect('studio-campaign','Campaign',
        [['0','Targeted campaign · '+studioMoney(studioProjectCost(s,p,14600))],['1','Wide campaign · '+studioMoney(studioProjectCost(s,p,39000))],['2','Premiere campaign · '+studioMoney(studioProjectCost(s,p,76000))]])+
      studioSelect('studio-release-window','Release window',[[1,'Next Age Up'],[2,'In two years'],[3,'In three years']])+
      studioBtn('Book campaign and set release date','market',p.id,'',!p.distribution||studioBlockingIncident(s,p));
  }
  return notices+stage+pitch;
}
function studioDistributionForm(s,p=null,channel=null){
  const projects=s.projects.filter(x=>x.stage==='marketing'&&!x.distribution&&(channel==='streaming'||['film','short'].includes(x.media)||['series','limited'].includes(x.media)));
  if(!p&&!projects.length)return '<p>No unsigned project is ready for distribution. Finish post-production first.</p>';
  const rows=Object.entries(STUDIO_OUTLETS).filter(([,x])=>p?[studioRole(p),'streaming'].includes(x.channel):channel==='streaming'?x.channel==='streaming':x.channel!=='streaming');
  return (!p?studioSelect('studio-industry-project','Project awaiting distribution',projects.map(x=>[x.id,x.name+' · '+STUDIO_MEDIA[x.media][0]])):'')+
    studioSelect('studio-outlet','Distribution partner',rows.map(([key,x])=>[key,x.name+' · '+studioMoney(studioCost(s,x.fee))+' booking · Reputation '+x.min]))+
    studioSelect('studio-deal','Agreement',
      [['share','Revenue share'],...(p||channel==='streaming'?[['original','Guaranteed streaming original payment']]:[])])+
    studioBtn('Sign distribution agreement','distribution',p?.id||0,p?'project':'industry');
}
function studioIndustryView(s){
  const labels={people:'People',theaters:'Theaters / Cable',streaming:'Streaming services',rankings:'Studios'};
  const body={people:studioPeople,theaters:studioExhibitors,streaming:studioStreaming,rankings:studioCharts}[studioIndustryTab];
  return '<div class="law-nav" aria-label="Industry sections">'+Object.entries(labels).map(([key,label])=>`<button type="button" aria-pressed="${studioIndustryTab===key}" onclick="studioIndustry('${key}')">${label}</button>`).join('')+'</div>'+body(s);
}
function studioPeople(s){
  const people=s.people.slice().sort((a,b)=>Number(b.bookings>0||b.retainer)-Number(a.bookings>0||a.retainer)||b.relationship-a.relationship);
  const phases={writer:'writing',director:'filming',producer:'filming',crew:'filming',editor:'post'};
  return studioSection('People and studio staff','<p>Returning collaborators keep their working relationships. Salaried staff can join future projects without another freelance fee.</p>'+
    people.map(e=>{
      const role=(STUDIO_ROLES[e.role]||STUDIO_CREW[e.role])[0];
      const assignments=studioHas(STUDIO_ROLES,e.role)?s.projects.filter(p=>p.stage==='casting'&&!p.ready&&!p.slots.some(x=>x.person===e.id))
        .flatMap(p=>p.slots.map((slot,index)=>slot.role===e.role&&!slot.person?[p.id+','+index,p.name+' · '+role+' '+slot.number]:null).filter(Boolean)):
        s.projects.filter(p=>p.stage===phases[e.role]&&!p.ready&&!p.crew[e.role]).map(p=>[p.id,p.name]);
      const recent=e.shared.slice(-5).map(id=>studioFind(s.projects,id)?.name).filter(Boolean);
      return `<details class="law-section"><summary>${uiEscape(e.name)} · ${role}${e.retainer?' · On staff':''}</summary>
        <p>Skill ${e.skill}/100 · Recognition ${e.reputation}/100 · Relationship ${e.relationship}/100 · ${e.bookings} bookings</p>
        <p>${recent.length?'Recent collaborations · '+recent.map(uiEscape).join(', '):'Available for a first collaboration.'}</p>
        ${e.retainer?`<p>Annual salary ${studioMoney(e.retainer)}</p>`+studioBtn('End staff contract with severance','staff',e.id,'release'):
          STUDIO_CREW[e.role]?studioBtn('Offer permanent studio contract','staff',e.id,'hire'):'<p>Book this performer from a project’s Casting stage.</p>'}
        ${assignments.length?studioSelect('studio-person-project-'+e.id,'Production',assignments)+
        studioBtn('Hire on selected project','industryHire',e.id):''}</details>`;
    }).join(''));
}
function studioPartnerCards(s,streaming){
  return Object.entries(STUDIO_OUTLETS).filter(([,o])=>(o.channel==='streaming')===streaming).map(([key,o])=>
    `<article class="law-item"><div><h4>${o.name}</h4><p>${studioChannelName(o.channel)} · ${Math.round(o.share*100)}% studio share · Relationship ${s.outlets[key]}/100</p></div>
    ${studioBtn('Meet booking team','network',0,key,s['outlet:'+key]===s.age)}</article>`).join('');
}
function studioExhibitors(s){
  return studioSection('Theaters and cable networks',studioPartnerCards(s,false))+
    studioSection('Book a release',studioDistributionForm(s,null,'theater-cable'));
}
function studioStreaming(s){
  const offers=s.offers.map(o=>{
    const p=studioFind(s.projects,o.project);
    return `<article class="law-item"><div><h4>${uiEscape(p.name)} · ${STUDIO_OUTLETS[o.outlet].name}</h4><p>${studioMoney(o.annual)} per year · ${o.years} years · Offer through age ${o.expires}</p></div><div>
    ${studioBtn('License the title','license',o.id)}${studioBtn('Decline offer','offerDecline',o.id)}</div></article>`;
  }).join('');
  return studioSection('Current library offers',offers||'<p>No open offers. A platform can bid automatically, or you can request a quote from a past release.</p>')+
    studioSection('Streaming partners',studioPartnerCards(s,true))+
    studioSection('Book a streaming premiere',studioDistributionForm(s,null,'streaming'));
}
function studioCharts(s){
  return studioSection('Studio rankings',
    '<p>Rankings use reputation first and reported market receipts to break ties. Rival studios update at Age Up.</p>'+
    '<div class="law-table-wrap"><table><thead><tr><th scope="col">Studio</th><th scope="col">Reputation</th><th scope="col">Latest receipts</th><th scope="col">Releases</th><th scope="col">Awards</th></tr></thead><tbody>'+
    studioRankings(s).map((x,i)=>`<tr><th scope="row">${i+1}. ${uiEscape(x.name)}${x.id===0?' (your studio)':''}</th><td>${x.reputation}</td><td>${studioMoney(x.gross)}</td><td>${x.releases}</td><td>${x.awards}</td></tr>`).join('')+
    '</tbody></table></div>');
}
function studioReleaseDetails(s,p,actions){
  const cast=p.slots.map(x=>STUDIO_ROLES[x.role][0]+' · '+(studioFind(s.people,x.person)?.name||'Uncredited')).map(uiEscape).join('<br>');
  const now=p.licenses.filter(x=>x.until>=s.age&&p.rights);
  const award=p.results.length?p.results.map(x=>uiEscape(x.category)+' · '+(x.won?'Won':'Nominated')).join(', '):
    p.nominations.join(', ')+(p.awardsMissed?' · Ceremony missed':'');
  const paid=p.licenses.reduce((n,l)=>n+l.paid,0);
  return `<p>${uiEscape(p.genre)} · ${STUDIO_FORMATS[p.format][0]} · ${STUDIO_MEDIA[p.media][0]} · Rated ${p.rating} · ${STUDIO_OUTLETS[p.distribution.outlet].name}</p>
    <p>Release at age ${p.actual} · ${typeof p.runtime==='number'?p.runtime+' minutes':p.runtime} · ${p.record} · Critics ${p.critics}/100 · Audience ${p.audience}/100</p><p>${cast}</p>`+
    studioStats([['Production and deal costs',studioMoney(p.spent)],['Market revenue',studioMoney(p.gross)],['Studio receipts',studioMoney(p.earned)],
      ['Launch profit / loss',studioMoney(p.initialProfit)],['Lifetime profit / loss',studioMoney(p.earned-p.spent)],['Library payments',studioMoney(paid)]])+
    `<p>Awards · ${award||'No nominations'}</p><p>${now.length?now.map(l=>STUDIO_OUTLETS[l.outlet].name+' pays '+studioMoney(l.annual)+' yearly through age '+l.until).join('. '):
      p.rights?'Available for new library deals.':'Studio screen rights sold for '+studioMoney(p.rightsSale)+'.'}</p>`+
    (actions&&p.rights?B('Develop a sequel or spin-off',`studioPopup('script',${p.id})`)+
      studioBtn('Request a streaming library quote','solicit',p.id,'',p.solicited===s.age||!!now.length)+
      B('Sell screen rights',`studioPopup('rights',${p.id})`):'');
}
function studioReleases(s){
  const selected=studioFind(s.projects,studioProjectId);
  if(selected?.stage==='released')return studioProjectView(s,selected,'releases');
  const released=s.projects.filter(p=>p.stage==='released').slice().reverse();
  return studioSection('Release library',released.length?released.map(p=>
    `<article class="law-item"><div><h4>${uiEscape(p.name)}</h4><p>Age ${p.actual} · ${p.record} · Studio receipts ${studioMoney(p.earned)} · Library income ${studioMoney(p.licenses.reduce((n,l)=>n+l.paid,0))}</p></div>${B('Review release',`studioOpen('releases',${p.id})`)}</article>`).join(''):
    '<p>The first release will appear after delivery to an exhibitor or streaming partner.</p>');
}
function studioAwardView(s){
  const season=s.awardSeason;
  const current=season?.age===s.age&&season.projects.length;
  const archive=s.projects.filter(p=>p.nominations.length).slice().reverse();
  return studioSection('Screen Guild Awards',current?`<p>${season.status==='nominated'?'Nominations are open this year.':season.status==='attended'?'Ceremony results recorded.':'The studio missed the ceremony.'}</p>`+
    season.projects.map(id=>{const p=studioFind(s.projects,id);return `<p>${uiEscape(p.name)} · ${p.nominations.join(', ')}</p>`;}).join('')+
    studioBtn('Attend award show this year · '+studioMoney(studioCost(s,8500)),'awards',0,'',season.status!=='nominated'):
    '<p>No current nominations. Eligible projects are considered after release.</p>')+
    studioSection('Awards history',archive.map(p=>`<p><strong>${uiEscape(p.name)}</strong> · ${p.results.length?
      p.results.map(r=>r.category+' '+(r.won?'won':'nominated')).join(', '):p.nominations.join(', ')+(p.awardsMissed?' · Ceremony missed':'')}</p>`).join('')||'<p>No past nominations.</p>');
}
function studioFacilities(s){
  const assets=STUDIO_ASSETS.map(([name,buy,upkeep],index)=>{
    const asset=s.assets.find(a=>a.type===index);
    return `<article class="law-item"><div><h4>${name}</h4><p>${asset?'Owned · Annual upkeep '+studioMoney(studioCost(s,upkeep)):'Purchase '+studioMoney(studioCost(s,buy))+' · Annual upkeep '+studioMoney(studioCost(s,upkeep))}</p></div>
    ${asset?studioBtn('Sell for '+studioMoney(studioAssetValue(s,asset)),'asset',asset.id,'sell'):studioBtn('Purchase','asset',index,'buy')}</article>`;
  }).join('');
  return studioSection('Facilities and equipment','<p>Production facilities lower the cost of relevant filming or post-production work. The studio pays upkeep each year.</p>'+assets);
}
function studioRecovery(s){
  const items=s.projects.filter(p=>p.rights&&p.stage!=='cancelled');
  return studioSection('Cash shortfall',`<p>Studio funds ${studioMoney(s.cash)}. The studio can sell equipment or screen rights and reduce annual payroll. Cash contributions come from your personal account.</p>`+
    B('Open Financials to invest',"studioPopup('finance')")+B('Cut permanent payroll',"studioPopup('restructure')",s.cash>=0||!s.people.some(p=>p.retainer)))+
    studioFacilities(s)+studioSection('Sell project rights',items.map(p=>B(uiEscape(p.name)+' · '+studioMoney(studioRightsQuote(s,p)),`studioPopup('rights',${p.id})`)).join('')||'<p>No unsold projects.</p>')+
    studioSection('Wind down the studio',B('Review closure terms',"studioPopup('close')"));
}
function studioInbox(s){
  const items=s.incidents.filter(e=>!e.closed);
  return studioSection('Production decisions',items.map(e=>{
    const data=STUDIO_INCIDENTS[e.key],p=studioFind(s.projects,e.project);
    return `<article class="law-item"><div><h4>${uiEscape(data.headline)}</h4><p>${uiEscape(p?.name)} · Age ${e.age}</p></div>
    ${B(data.public?'Respond in the newspaper':'Review privately',`studioPrivateOpen(${e.id})`)}</article>`;
  }).join('')||'<p>No production decisions are waiting.</p>');
}
const studioCurrencyFactor=()=>ST.cur==='usd'?1:cxo()[1];
const studioToDisplay=n=>Math.round(n*studioCurrencyFactor());
const studioToAccount=n=>Math.round(n/studioCurrencyFactor());
function studioFinance(s){
  const previous=s.reports[0];
  const breakdown=(label,record,types)=>`<section class="law-section"><h3>${label}</h3>${types.map(name=>
    `<div class="row"><span>${name}</span><b>${studioMoney(record?.[name])}</b></div>`).join('')}</section>`;
  const releases=previous?.releases.map(id=>studioFind(s.projects,id)).filter(Boolean)||[];
  return studioStats([['Studio funds',studioMoney(s.cash)],['Personal cash',studioMoney(g.cash)],['Past year net operating income',studioMoney(previous?studioTotals(previous.income)-studioTotals(previous.expenses):0)]])+
    '<p>All production costs use studio funds. Withdrawals are taxed at the game’s current income-tax rate.</p>'+
    studioSelect('studio-transfer-mode','Transfer type',[['invest','Invest personal cash'],['withdraw','Withdraw studio cash']]).replace('<select ','<select onchange="studioTransferBounds()" ')+
    `<label for="studio-transfer-range">Adjust amount</label><input id="studio-transfer-range" type="range" min="0" max="${Math.max(0,studioToDisplay(g.cash))}" value="0" oninput="studioSyncTransfer('range')">
     <label for="studio-transfer-text">Transfer amount</label><input class="txt" id="studio-transfer-text" type="number" min="0" max="${Math.max(0,studioToDisplay(g.cash))}" step="1" value="0" oninput="studioSyncTransfer('text')">
     <p>Amounts shown in ${uiEscape(ST.cur==='usd'?'US dollars':loc(0).replace(/[0\s]/g,'')||'local currency')}. Current withdrawal tax ${C().t.inc}%.</p>`+
    B('Submit transfer','studioSubmitTransfer()')+
    (previous?`<h3>Past year accounts · Ages ${previous.age}–${previous.closing}</h3>`+breakdown('Income',previous.income,STUDIO_INCOME)+breakdown('Expenses',previous.expenses,STUDIO_EXPENSES)+
      `<section class="law-section"><h3>Released projects</h3>${releases.length?releases.map(p=>`<div class="row"><span>${uiEscape(p.name)}</span><b>${studioMoney(p.gross)} market revenue</b></div>`).join(''):'<p>No titles released that year.</p>'}</section>`+
      (Object.keys(previous.capital).length?breakdown('Capital movements',previous.capital,Object.keys(previous.capital)):''):
      '<p>The first annual breakdown will post at Age Up.</p>')+
    '<details class="law-section"><summary>Current-year transactions</summary>'+
    s.ledger.filter(x=>x.age===s.age).slice(0,18).map(x=>`<div class="row"><span>${uiEscape(x.category)}</span><b>${studioMoney(x.amount)}</b></div>`).join('')+'</details>';
}
function studioScriptModal(s,id){
  const p=studioFind(s.projects,id),count=role=>p?.slots.filter(x=>x.role===role).length;
  const range=(n,k)=>Array.from({length:k-n+1},(_,i)=>[n+i,String(n+i)]);
  const select=(rows,value)=>rows.map(([key,label])=>[key,label,value===key]);
  return lawModal(p?'Create a sequel or spin-off':'Create Script',
    `<p>Development fee ${studioMoney(studioCost(s,7500))} from studio funds. ${p?'The studio retains control of the new production and its original title’s rights.':''}</p>
    <label for="script-name">Project title</label><input class="txt" id="script-name" maxlength="64" value="${uiEscape(p?p.name+' II':'')}">`+
    studioSelect('script-genre','Genre',select(STUDIO_GENRES.map(x=>[x,x]),p?.genre||'Drama'))+
    studioSelect('script-media','Release type',select(Object.entries(STUDIO_MEDIA).map(([key,value])=>[key,value[0]]),p?.media||'film'))+
    studioSelect('script-format','Production format',select(Object.entries(STUDIO_FORMATS).map(([key,value])=>[key,value[0]]),p?.format||'live'))+
    studioSelect('script-rating','Rating',select(STUDIO_RATINGS.map(x=>[x,x]),p?.rating||'PG-13'))+
    studioSelect('script-leads','Lead roles',select(range(1,2),p?count('lead')+count('voice'):1))+
    studioSelect('script-support','Supporting roles',select(range(0,3),p?count('support'):1))+
    studioSelect('script-background','Background groups',select(range(0,2),p?count('background'):1))+
    '<p id="studio-form-error" class="law-form-error" role="alert"></p>',B('Add to Projects','studioScriptSave()')+B('Cancel','studioPopupClose()'));
}
function studioModal(){
  const s=g.studio;
  if(g.studioPrompt){
    const quote=Math.round(170000*studioScale()),funding=Math.max(quote,Math.min(g.cash,Math.round(325000*studioScale())));
    return lawModal('Create your movie studio',`<p>Minimum opening investment ${studioMoney(quote)}. The studio buys ${studioMoney(pr(45000))} of editing equipment and pays ${studioMoney(pr(12000))} in setup costs.</p>
      <label for="studio-name">Studio name</label><input id="studio-name" class="txt" maxlength="60" value="${uiEscape(g.name.trim().split(/\s+/).at(-1)+' Pictures')}">
      <label for="studio-opening">Upfront personal investment</label><input id="studio-opening" class="txt" type="number" min="${studioToDisplay(quote)}" max="${studioToDisplay(g.cash)}" step="1" value="${studioToDisplay(funding)}">
      <p>Available personal cash ${studioMoney(g.cash)} · Starting studio reputation ${studioStartingRep()}/100.</p><p id="studio-form-error" class="law-form-error" role="alert"></p>`,
      B('Open the studio','studioFound()')+B('Cancel',"g.studioPrompt=null;draw()"));
  }
  if(!studioActive())return '';
  const pending=s.pending;
  if(pending){
    if(pending.kind==='finance')return lawModal('Studio financials',studioFinance(s),B('Close financials','studioPopupClose()'));
    if(pending.kind==='script')return studioScriptModal(s,pending.id);
    if(pending.kind==='close')return lawModal('Wind down the studio?',
      '<p>Screen rights and equipment will be sold. Remaining payroll obligations will be settled, and the net proceeds or deficit will transfer to your personal account. Positive proceeds are taxed.</p>',
      B('Confirm studio closure','studioConfirm()')+B('Keep the studio','studioPopupClose()'));
    if(pending.kind==='rights'){
      const p=studioFind(s.projects,pending.id);
      return lawModal('Sell screen rights',`<p>The offer for ${uiEscape(p.name)} is ${studioMoney(studioRightsQuote(s,p))} before any investor share. Future licensing and sequels transfer to the buyer. An in-progress production will be shelved.</p>`,
        B('Confirm rights sale','studioConfirm()')+B('Keep the rights','studioPopupClose()'));
    }
    if(pending.kind==='asset'){
      const a=studioFind(s.assets,pending.id);
      return lawModal('Sell studio equipment',`<p>The studio will receive ${studioMoney(studioAssetValue(s,a))} for ${STUDIO_ASSETS[a.type][0].toLowerCase()} and its annual upkeep will end.</p>`,
        B('Confirm equipment sale','studioConfirm()')+B('Keep the equipment','studioPopupClose()'));
    }
    if(pending.kind==='restructure')return lawModal('Cut permanent payroll',
      '<p>All salaried staff will be released. The studio will record one month of severance per employee. Relationships and reputation will fall.</p>',
      B('Confirm payroll reduction','studioConfirm()')+B('Keep staff','studioPopupClose()'));
  }
  const notice=s.notices[0];
  if(notice?.kind==='release'){
    const p=studioFind(s.projects,notice.project);
    return lawModal('Release report · '+p.name,studioReleaseDetails(s,p,false),B('Continue',`studioNoticeClose('release',${p.id})`));
  }
  if(notice?.kind==='debt')return lawModal('The studio ended the year in debt',
    `<p>The studio has a cash shortfall of ${studioMoney(-s.cash)}. Invest personal funds or review production assets, payroll and screen rights.</p>`,
    B('Open Financials to invest','studioDebtOpen()')+B('Review cost cutting',"g.studio.notices.shift();studioOpen('recovery')"));
  return '';
}
const studioWorkPrevious=workV;
workV=function(){
  const s=g.studio;
  if(studioActive()&&wsel==='job')return studioWorkView(s);
  if(wsel==='studio-record'&&s){
    const old=s.status==='closed';
    return B('Back to Work',"wsel=null;draw(1)")+
      studioSection(s.name,`<p>${old?'Closed':'Management paused'} · ${s.projects.filter(p=>p.stage==='released').length} releases · Reputation ${s.reputation}/100</p>`+
      (!old?B('Resume managing the studio','studioResume()',!studioAllowed()||g.country!==s.country):''));
  }
  const html=studioWorkPrevious();
  if(wsub==='Special'&&!wsel&&!s)return B('Movie Director <small>Create an independent movie studio</small>','studioStart()')+html;
  if(!wsel&&!wsub&&s){
    if(studioActive()){
      const root=document.createElement('div');root.innerHTML=html;
      for(const el of root.querySelectorAll('[onclick]'))if(el.getAttribute('onclick')==="wsel='job';draw(1)")el.remove();
      for(const el of root.children)if(el.textContent.trim()==='Current (tap to open)'){el.remove();break;}
      return studioSection('Current work',`<div class="row"><strong>${uiEscape(s.name)}</strong><span>Reputation ${s.reputation}/100</span></div>
        ${B('Manage movie studio',"studioOpen('overview')")}`)+root.innerHTML;
    }
    return B(uiEscape(s.name)+' <small>Movie studio record</small>',"wsel='studio-record';draw(1)")+html;
  }
  return html;
};
const studioPreviousGame=gameView;
gameView=function(){
  const html=studioPreviousGame();
  if(!g.studioPrompt&&!(studioActive()&&(g.studio.pending||g.studio.notices.length)))return html;
  const root=document.createElement('div');root.innerHTML=html;
  if(!root.querySelector('.mo')){
    const modal=studioModal();
    if(modal)root.querySelector('.game').insertAdjacentHTML('beforeend',modal);
  }
  return root.innerHTML;
};
