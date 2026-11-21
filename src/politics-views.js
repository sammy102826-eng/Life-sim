const CIVIC_PAGES={
 overview:'Government overview',domestic:'Domestic policy',budget:'Budget',bills:'Current bills',propose:'Propose a bill',
 assembly:'Legislature',court:'Courts',orders:'Executive powers',cabinet:'Cabinet',standing:'Country and global standing',
 international:'International policy',diplomacy:'Diplomacy',trade:'Trade',resources:'Resources',
 military:'Military',conflict:'War and peace',inbox:'Decisions and record'
};
const CIVIC_STAGE_LABELS={committee:'In committee',desk:'Executive desk',reconsideration:'Returned for revisions',
 veto:'Vetoed · Override pending',review:'Judicial review',enacted:'Enacted',failed:'Defeated',rejected:'Struck down',closed:'Term ended'};
let civicPage='overview',civicDialog=null;
const civicButton=(label,action='',arg='',id=0,disabled=false)=>B(label,`civicAction('${action}','${arg}',${id})`,disabled);
const civicSelect=(id,label,options)=>studioSelect('civic-'+id,label,options);
const civicValue=id=>document.getElementById('civic-'+id)?.value;
const civicSection=(name,body)=>studioSection(name,body);
const civicRows=rows=>studioStats(rows);
function civicGo(page='overview'){
 if(!Object.hasOwn(CIVIC_PAGES,page))return;
 tab='Work';wsub=null;wsel='civics';civicPage=page;draw(1);
}
function civicOpenRaces(){
 tab='Work';wsel='civic-races';wsub='Special';draw(1);
}
function civicAssemblyName(o){
 return ({school:'School board',city:'City council',region:'Regional assembly',nation:civicSystem(g.country).body})[o.scope];
}
function civicRaceView(){
 const s=civicState(),c=s.campaign,back=B('Back to Special careers',"wsel=null;wsub='Special';draw(1)");
 if(c){
  const o=civicOffice(c.id,c.country);
  return back+civicSection('Campaign for '+o.name,
   civicRows([['Stage',civicCampaignStages[c.round]],['Campaign funds',loc(c.treasury)],['Coalition support',c.backing]])+
   civicCampaignActions[c.round].map(([,base],i)=>civicButton(civicCampaignLabel(c.round,i)+(base?' · '+loc(pr(base*(1+o.rank*.7))):''),'campaign','',i)).join('')+
   civicButton('Withdraw from the race','withdraw'));
 }
 const system=civicSystem(g.country);
 return back+civicSection('Run for Office','<p>Campaign experience and time in elected office improve support. Winning requires more votes than any rival.</p>'+
  civicSelect('party','Party or bloc',system.parties.map(p=>[p,p,p===s.party]))+
  civicOffices().map(o=>civicButton(uiEscape(o.name)+' <small>Age '+o.minAge+'+ · Filing fee '+loc(pr(o.fee))+' · '+o.term+'-year term</small>',
   'run',o.id,0,!civicEligible(o,s)||g.cash<pr(o.fee)||s.used['run:'+g.country+':'+o.id]===g.age)).join(''))+
   (s.elections.length?civicSection('Previous election',civicElectionView(s.elections[0])):'');
}
function civicElectionView(e){
 return '<p>'+uiEscape(civicOffice(e.id,e.country)?.name||'Election')+' · '+(e.won?'Won':'Lost')+'</p>'+
 '<ol>'+e.results.map(r=>'<li>'+uiEscape(r.name)+(r.party?' ('+uiEscape(r.party)+')':'')+' · '+r.votes.toLocaleString()+' votes</li>').join('')+'</ol>';
}
function civicProposals(s,o,page){
 const include=k=>CIVIC_POLICIES[k][1].includes(o.scope)&&!['extraction','defense'].includes(k);
 const entries=Object.keys(CIVIC_POLICIES).filter(k=>include(k)&&(page==='budget'?k==='allotment':k!=='allotment'));
 return civicSection(page==='budget'?'Public budget':'Introduce legislation',
  (page==='budget'?'<p>Available public funds '+loc(s.funds)+'. A budget needs an assembly vote. Executives can sign, return, or veto the approved measure.</p>':'')+
  entries.map(k=>civicButton(CIVIC_POLICIES[k][0]+' · '+loc(Math.round(s.funds*CIVIC_POLICIES[k][3])),'propose',k,0,
   civicTermBills(s).some(b=>b.key===k&&(civicLiveStage(b)||b.age===g.age)))).join(''));
}
function civicBillView(s,o,b){
 const vote=['committee','veto','reconsideration'].includes(b.stage);
 const support=(mode,label)=>civicButton(label,'bill-support',mode,b.id,b.used.includes(mode));
 return `<details class="card"><summary>${uiEscape(b.name)} · ${CIVIC_STAGE_LABELS[b.stage]}</summary>
  <p>${b.npc?'Assembly proposal':'Government proposal'} · Appropriation ${loc(b.cost)}${b.target?' · '+uiEscape(b.target):''}.</p>
  ${b.debate?`<p>Recorded vote ${b.debate.yes} for, ${b.debate.no} against · ${b.debate.threshold} needed.</p>`:''}
  ${b.outcome?'<p>'+uiEscape(b.outcome)+'</p>':''}
  ${vote?support('whip','Ask members for support')+support('compromise','Negotiate a compromise')+support('favor','Promise an exchange of support')+
  civicButton(b.stage==='veto'?'Take an override vote':'Call a vote or vote in favor','vote','support',b.id)+
  civicButton('Vote against the measure','vote','oppose',b.id):''}
  ${o.executive&&b.stage==='desk'?civicButton(o.id==='leader'&&!civicCanVeto(o)?'Approve implementation':'Sign into law','desk','sign',b.id)+civicButton('Return for negotiations','desk','negotiate',b.id,b.used.includes('returned'))+
   (civicCanVeto(o)?civicButton('Veto','desk','veto',b.id):''):''}</details>`;
}
function civicBillsView(s,o,filter=()=>true){
 return civicTermBills(s).filter(filter).slice().reverse().map(b=>civicBillView(s,o,b)).join('')||'<p>No measures on this list.</p>';
}
function civicAssemblyView(s,o){
 const group=civicAssembly(s,o.scope,s.party);
 return civicSection(civicAssemblyName(o),'<p>Governing coalition · '+group.coalition.map(uiEscape).join(' + ')+
  ' · '+group.size+' seats.</p>'+group.blocs.map(b=>`<p>${uiEscape(b.name)} · ${b.seats} seats</p>`).join('')+
  '<p>Political capital '+g.pc+' / 100. Compromises and coalition support change the vote count.</p>')+
  civicSection('Measures before the assembly',civicBillsView(s,o,b=>['committee','veto','reconsideration'].includes(b.stage)));
}
function civicAppointments(s,court){
 const o=civicCurrent(),names=Object.entries(civicRoster(s).candidates).map(([key,c])=>[key,c.name+' · '+c.profile]);
 if(!court)return civicSection('Cabinet portfolios',civicSelect('seat','Portfolio',CIVIC_CABINET.map(n=>[n,n]))+
  civicSelect('candidate','Nominee',names)+civicButton('Appoint to Cabinet','appoint','cabinet')+
  CIVIC_CABINET.map(seat=>`<p>${seat} · ${uiEscape(s.cabinet[seat]?.name||'Vacant')}</p>`).join(''));
 return civicSection(civicSystem(g.country).court,
  (s.nominee?'<p>Nomination awaiting a confirmation vote · '+uiEscape(s.nominee.name)+'</p>':'')+
  (o.id==='leader'?civicSelect('candidate','Nominee',names)+civicButton('Submit judge nomination','appoint','judge',0,!!s.nominee):'')+
  (o.executive?civicButton('Request advisory opinion on a desk bill','advisory','',0,!!s.advisory):'')+
  s.judges.map(j=>'<p>Confirmed · '+uiEscape(j.name)+'</p>').join('')+
  civicBillsView(s,o,b=>['review','rejected'].includes(b.stage)));
}
function civicInternationalPage(s,page){
 const partners=civicNations().map(c=>[c,c]);
 const partner=civicSelect('nation','Partner country',partners);
 const forums=civicSelect('forum','International forum',[...Object.entries(CIVIC_BODIES).map(([name,role])=>[name,name+' · '+role]),...s.pacts.map(p=>[p.name,p.name])]);
 if(page==='diplomacy')return civicSection('Multilateral diplomacy',partner+forums+
  civicButton('Open coordination talks','international','diplomacy')+civicButton('Offer humanitarian assistance','international','aid')+
  civicButton('Propose a new cooperation forum','international','pact')+
  s.pacts.map(p=>'<p>'+uiEscape(p.name)+'</p>').join(''));
 if(page==='trade')return civicSection('Trade agreements','<p>Resource reserves '+s.resources.stock+' units.</p>'+partner+
  civicButton('Negotiate a two-unit resource agreement','international','trade')+
  s.trade.slice(-6).map(t=>'<p>Age '+t.age+' · '+uiEscape(t.country)+' · '+t.units+' units</p>').join(''));
 if(page==='resources')return civicSection(civicCountryResource(s),'<p>Annual output '+s.resources.output+' · Reserves '+s.resources.stock+
  ' units. New development requires an authorization vote.</p>'+civicButton('Propose resource permits','propose','extraction'));
 if(page==='conflict')return civicSection('Security and peace negotiations',
  (g.wars.filter(w=>[w.a,w.b].includes(g.country)).map(w=>'<p>Active conflict · '+uiEscape(w.a===g.country?w.b:w.a)+'</p>').join('')||'<p>No active conflicts.</p>')+
  partner+forums+civicButton('Request a defense authorization vote','international','authorise')+
  civicButton('Seek a mediated ceasefire','international','mediation')+B('Review military posture',"civicGo('military')"));
 return civicSection('Military policy',civicRows([['Readiness',s.military.readiness+'/100'],['Posture',s.military.posture]])+
  civicButton('Set a defensive readiness policy','military','defensive')+
  civicButton('Prioritize civilian protection and relief','military','support')+civicButton('Fund training, reserves and equipment','military','reserves')+
  (civicNuclear()?civicButton('Review nuclear deterrence policy','military','deterrence')+
  civicButton('Order a nuclear risk-reduction stand-down','military','standdown'):''));
}
function civicInbox(s,o){
 const events=s.events.filter(e=>!e.closed&&civicEventAvailable(e,o));
 return civicSection('Pending decisions',events.map(e=>civicButton(uiEscape(e.title),'review','',e.id)).join('')||'<p>No decisions are pending.</p>')+
  civicSection('Career record',s.terms.slice().reverse().map(x=>'<p>'+uiEscape(x.name)+' · '+x.years+' years · '+uiEscape(x.reason)+'</p>').join('')+
  s.elections.slice(0,4).map(civicElectionView).join(''))+
  civicSection('Recent activity',s.history.slice(0,10).map(x=>'<p>Age '+x.age+' · '+uiEscape(x.text)+'</p>').join('')||'<p>No activity recorded.</p>');
}
function civicOfficeView(o){
 const s=civicState(),p=civicPage,leader=o.id==='leader';
 const back=p==='overview'?B('Back to Work',"wsel=null;wsub=null;draw(1)"):B('Back to government overview','civicGo()');
 const go=(k,label=CIVIC_PAGES[k])=>B(label,`civicGo('${k}')`);
 const system=civicSystem(g.country);
 let body='';
 if(p==='overview'){
  body=civicRows([['Official',uiEscape(g.name)],['Approval',g.approval+'/100'],['Term ends','Age '+s.office.end],['Bloc',uiEscape(s.party)]])+
   (!leader?civicRows(Object.entries({E:'Local economy',S:'Services',A:'Safety',V:'Environment'}).map(([key,label])=>[label,civicMetric(s,o.scope,key)+'/100'])):'')+
   (leader?go('standing',uiEscape(g.country)+' <small>Global standing '+s.standing+'/100</small>')+Bar('Global standing',s.standing,'#4FB39A')+go('cabinet')+go('international'):'')+
   go('domestic')+go('assembly',civicAssemblyName(o))+go('court',system.court)+(o.executive?go('orders'):'')+
   (leader?go('military')+go('resources')+go('conflict')+go('diplomacy')+go('trade'):'')+
   go('inbox')+civicButton('Resign','resign');
 }else if(p==='domestic')body=go('budget')+go('bills')+go('propose');
 else if(p==='budget')body=civicProposals(s,o,'budget')+civicBillsView(s,o,b=>b.key==='allotment');
 else if(p==='bills')body=civicBillsView(s,o);
 else if(p==='propose')body=civicProposals(s,o,'propose');
 else if(p==='assembly')body=civicAssemblyView(s,o);
 else if(p==='court')body=civicAppointments(s,true);
 else if(p==='cabinet'&&leader)body=civicAppointments(s,false);
 else if(p==='orders'&&o.executive)body=civicSection('Executive powers','<p>Orders take effect only if upheld during independent judicial review.</p>'+
  ['transport','safety','water','health','jobs'].filter(k=>CIVIC_POLICIES[k][1].includes(o.scope)).map(k=>civicButton(CIVIC_POLICIES[k][0],'order',k,0,s.used.order===g.age)).join(''));
 else if(p==='standing'&&leader)body=civicSection(g.country,civicRows([['Global standing',s.standing+'/100'],['Public funds',loc(s.funds)],['Income tax',C().t.inc+'%']])+
  Object.entries({E:'Economy',S:'Society',A:'Safety',V:'Environment'}).map(([k,label])=>Bar(label,g.nat[k],GOLD)).join(''));
 else if(p==='international'&&leader)body=go('diplomacy')+go('trade')+go('resources')+go('conflict');
 else if(['diplomacy','trade','resources','conflict','military'].includes(p)&&leader)body=civicInternationalPage(s,p);
 else if(p==='inbox')body=civicInbox(s,o);
 return `<div class="law-shell studio-shell">${back}<div class="card"><h2>${uiEscape(o.name)}</h2><p>${uiEscape(g.city||g.country)} · ${CIVIC_PAGES[p]}</p></div>${body}</div>`;
}
function civicEventAvailable(item,o=civicCurrent()){
 if(item.closed||item.country&&item.country!==g.country||g.jail)return false;
 if(['incident','court','favor'].includes(item.kind))return !!o&&(!item.office||item.office===o.id);
 return true;
}
function civicAction(action,arg,id){
 if(publicityBusy()||g.justice?.pending||g.jail)return;
 const s=civicState();
 let error;
 if(action==='run')error=civicStart(arg,civicValue('party'));
 else if(action==='campaign')error=civicCampaignChoice(id);
 else if(action==='withdraw'){
  if(!s.campaign)return;
  const o=civicOffice(s.campaign.id,s.campaign.country);
  s.campaign=null;civicPress(s,g.name+' withdraws from the race','The campaign for '+o.name+' ended before the final vote.');
 }else if(action==='review'){
  const item=s.events.find(x=>x.id===id);
  if(!item||!civicEventAvailable(item))return;
  item.seen=true;civicDialog={id};return draw(1);
 }else{
  const o=civicCurrent();
  if(!o)return;
  const b=s.bills.find(b=>b.id===id);
  if(action==='propose'){
   if(!['defense'].includes(arg)&&civicBill(s,arg))return civicGo('bills');
   error='This proposal is unavailable or already pending.';
  }else if(action==='order')error=civicOrder(s,arg);
  else if(action==='bill-support')error=civicBillSupport(s,b,arg);
  else if(action==='vote')error=civicVote(s,b,arg);
  else if(action==='desk')error=civicDesk(s,b,arg);
  else if(action==='advisory')error=civicAdvisory(s);
  else if(action==='appoint')error=civicAppoint(s,arg,civicValue('seat'),civicValue('candidate'));
  else if(action==='international')error=civicInternational(s,arg,civicValue('nation'),civicValue('forum'));
  else if(action==='military')error=civicMilitary(s,arg);
  else if(action==='resign'){civicDialog={resign:true};return draw(1);}
  else return;
 }
 if(error)return toast(error);
 if(action==='campaign'&&!s.campaign&&civicActive())return civicGo();
 draw(1);
}
function civicDialogClose(){civicDialog=null;draw();}
function civicAnswer(i){
 const s=g.civics;
 if(!s||publicityBusy())return;
 if(civicDialog?.resign){
  if(!civicActive())return civicDialogClose();
  civicLeave(s,'You resigned');tab='Work';wsel=null;wsub=null;
  return civicDialogClose();
 }
 const item=s.events.find(x=>x.id===civicDialog?.id);
 if(!item||!civicEventAvailable(item))return civicDialogClose();
 const result=civicRespond(s,item,i);
 if(!result.done)return toast(result.text);
 civicDialog=null;
 if(!g.justice?.pending)g.result={t:'Government decision',d:uiEscape(result.text)};
 draw(1);
}
function civicReadStory(id){civicDialog=null;newsOpenBrief(id);}
function civicReviewNotice(id,open){
 const item=g.civics?.events.find(e=>e.id===id);
 if(!item||!civicEventAvailable(item))return;
 item.seen=true;
 if(open)civicDialog={id};
 draw(1);
}
function civicModal(s){
 if(civicDialog?.resign)return lawModal('Resign from office?','<p>The office becomes vacant and current proposals close. Your service stays on your record.</p>',
  B('Confirm resignation','civicAnswer(0)')+B('Keep serving','civicDialogClose()'));
 if(civicDialog){
  const item=s.events.find(x=>x.id===civicDialog.id);
  if(item&&civicEventAvailable(item))return lawModal(item.title,'<p>'+uiEscape(item.text)+'</p>',
   civicEventOptions(s,item).map((x,i)=>B(uiEscape(x),`civicAnswer(${i})`)).join('')+
   (item.article?B('Read in the Newspaper',`civicReadStory('${item.article}')`):'')+B('Decide later','civicDialogClose()'));
 }
 const item=s.events.find(x=>x.age===g.age&&!x.seen&&civicEventAvailable(x));
 if(!item)return '';
 return lawModal(item.title,'<p>'+uiEscape(item.text)+'</p>',
  B('Review decision',`civicReviewNotice(${item.id},true)`)+B('Decide later',`civicReviewNotice(${item.id},false)`));
}
