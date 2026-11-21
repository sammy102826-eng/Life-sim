function civicSystem(country=g.country){
 const system=CIVIC_SYSTEMS[CIVIC_COUNTRIES[country]||'assembly'],over=CIVIC_OVERRIDES[country]||{};
 return {...system,...over,offices:{...system.offices,...over.offices}};
}
function civicOffices(country=g.country){
 const system=civicSystem(country);
 return CIVIC_OFFICES.flatMap(([id,title,scope,minAge,fee,pay,term],rank)=>{
  const name=Object.hasOwn(system.offices,id)?system.offices[id]:title;
  return name?[{id,name,scope,minAge:system.mode!=='presidential'&&id==='leader'?25:minAge,fee,pay,term,rank,
   executive:['mayor','governor','leader'].includes(id)}]:[];
 });
}
const civicOffice=(id,country=g.country)=>civicOffices(country).find(o=>o.id===id);
const civicCurrent=()=>g.civics?.office&&g.office>=0&&g.civics.office.country===g.country&&!g.jail?civicOffice(g.civics.office.id):null;
const civicActive=()=>!!civicCurrent();
const civicLegacyIndex=o=>o.id==='leader'?3:o.scope==='nation'||o.scope==='region'?2:o.executive?1:0;
function civicHighest(){
 const terms=g.civics?.terms||[],office=civicCurrent();
 const earned=terms.slice().sort((a,b)=>b.rank-a.rank)[0];
 return office&&(!earned||office.rank>=earned.rank)?office.name:earned?.name||OFFICES[g.top]?.n||'None';
}
const civicClamp=n=>Math.round(cl(n,0,100));
const civicWorkBlocked=()=>royalRestricted()||g.jail||g.ret||g.job?.businessId||g.job?.firmOwner||g.job?.practiceOwner||g.job?.studioOwner||
 g.study||g.collegeTrack?.current||g.actor?.projects?.some(x=>x.status==='signed');
const CIVIC_INSTITUTION_FIELDS=['cabinet','judges','standing','resources','military','pacts','trade','nominee'];
function civicNationalDefaults(){
 return {cabinet:{},judges:[],standing:50,resources:{stock:0,output:0},military:{readiness:50,posture:'Defensive'},pacts:[],trade:[],nominee:null};
}
function civicState(){
 return g.civics??={version:1,institutionCountry:g.country,serial:0,campaign:null,office:null,party:null,history:[],bills:[],events:[],elections:[],
  bodies:{},terms:[],favors:[],used:{},funds:0,...civicNationalDefaults(),lastAge:-1,review:null,ethics:65,support:50};
}
function civicUpdateCountry(s){
 if(s.institutionCountry===g.country)return;
 s.institutionRecords??={};
 s.institutionRecords[s.institutionCountry]=Object.fromEntries(CIVIC_INSTITUTION_FIELDS.map(k=>[k,s[k]]));
 const country=g.country,previous=s.institutionRecords[country];
 Object.assign(s,previous||civicNationalDefaults());
 delete s.institutionRecords[country];
 s.institutionCountry=country;
}
function civicLog(s,text){
 s.history.unshift({age:g.age,text});s.history=s.history.slice(0,65);
 L(uiEscape(text));
}
function civicPress(s,title,text,item=null,international=false){
 return newsPublish(international?'international':'government',title,text,{type:'civics',ref:item?.id||0,international},'civic-story-'+(++s.serial));
}
function civicNotice(s,kind,title,text,data={},international=false){
 const item={id:++s.serial,kind,title,text,age:g.age,country:g.country,closed:false,seen:false,...data};
 s.events.push(item);
 item.article=civicPress(s,title,text,item,international);
 if(s.events.length>100){
  const oldest=s.events.findIndex(x=>x.closed);
  if(oldest>=0)s.events.splice(oldest,1);
 }
 return item;
}
function civicExperience(s){
 return s.terms.reduce((n,t)=>n+Math.min(5,t.years)*2+Math.min(5,t.rank),0);
}
function civicEligible(o,s){
 if(!o||civicWorkBlocked()||!isCit()||g.age<o.minAge||s.campaign)return false;
 if(civicCurrent()?.id===o.id&&g.age<s.office.end-1)return false;
 return o.id!=='leader'||!['United States','France','Brazil','Germany','South Korea','Mexico'].includes(g.country)||
  s.terms.filter(t=>t.country===g.country&&t.id==='leader'&&t.years>=o.term-1).length+(civicCurrent()?.id==='leader'?1:0)<(['South Korea','Mexico'].includes(g.country)?1:2);
}
const civicCampaignStages=['Fundraising','Public forum','Policy debate','Get out the vote'];
const civicCampaignActions=[
 [['Build a grassroots network',0,5,3,0],['Accept a large political committee endorsement',0,4,0,1],['Self-fund the campaign',750,4,1,0]],
 [['Hold a public town hall',200,5,3,0],['Agree to a public policy endorsement',0,4,2,0],['Trade an improper favor for an endorsement',0,9,-4,2]],
 [['Present a costed platform',240,6,3,0],['Negotiate a coalition pledge',0,4,1,0],['Withdraw from the debate',0,-2,0,0]],
 [['Organize volunteers',180,6,2,0],['Buy advertising',900,8,0,0],['Rely on existing supporters',0,2,0,0]]
];
function civicStart(id,party){
 const s=civicState(),o=civicOffice(id),group=civicSystem(g.country),fee=o&&pr(o.fee);
 if(!civicEligible(o,s)||!group.parties.includes(party)||g.cash<fee)return 'You do not meet the eligibility or cash requirements.';
 if(s.used['run:'+g.country+':'+id]===g.age)return 'You already ran for this office this year.';
 s.used['run:'+g.country+':'+id]=g.age;
 g.cash-=fee;LD('Campaign filing fees',-fee);
 const seasoned=Math.min(18,civicExperience(s)),fame=Math.min(9,Math.floor((g.fm||0)/8));
 s.campaign={id,party,country:g.country,started:g.age,round:0,backing:25+seasoned+fame-o.rank,
  treasury:0,ethics:0,risk:0,rivals:group.parties.filter(x=>x!==party).slice(0,3).map((party,i)=>({name:nm2(),party,backing:40+i*2+R(-5,7)}))};
 civicPress(s,g.name+' runs for '+o.name,'The campaign has filed its candidacy and announced its opening platform.');
 return '';
}
function civicCampaignLabel(round,index){
 if(round===0&&index===1&&g.country!=='United States')return 'Seek major party donors';
 return civicCampaignActions[round][index][0];
}
function civicCampaignChoice(i){
 const s=civicState(),c=s.campaign;
 if(!c||c.country!==g.country||g.jail||!civicCampaignActions[c.round]?.[i])return 'This campaign round is unavailable.';
 const [,base,gain,integrity,risk]=civicCampaignActions[c.round][i];
 const label=civicCampaignLabel(c.round,i);
 const o=civicOffice(c.id),cost=pr(base*(1+o.rank*.7));
 if(g.cash+c.treasury<cost)return 'Campaign funds cannot cover this event.';
 const fromFund=Math.min(c.treasury,cost);
 c.treasury-=fromFund;
 g.cash-=cost-fromFund;LD('Campaign contributions and expenses',fromFund-cost);
 if(c.round===0&&i<2)c.treasury+=pr((i===0?1400:5300)*(1+o.rank*.65));
 if(c.round===0&&i===2)c.treasury+=pr(350);
 c.backing+=gain+R(-2,3);c.ethics+=integrity;c.risk+=risk;
 if(c.round===1&&i===2)s.favors.push({id:++s.serial,country:g.country,due:g.age+2,status:'open',name:'Campaign endorsement'});
 civicLog(s,label+'.');
 if(c.round===2)civicPress(s,'Debate for '+o.name+' concludes',g.name+' chose the following approach: '+label.toLowerCase()+'.');
 c.round++;
 if(c.round===civicCampaignStages.length)civicElection(s,c,o);
 return '';
}
function civicAssembly(s,scope,party){
 const key=g.country+':'+scope;
 if(!s.bodies[key])civicRenewAssembly(s,scope,party);
 return s.bodies[key];
}
function civicRenewAssembly(s,scope,party=s.party){
 const system=civicSystem(g.country),size={school:7,city:15,region:49,nation:100}[scope];
 const names=system.parties.slice();
 const weights=names.map(name=>R(11,28)+(name===party?R(0,21):0));
 let remaining=size;
 const total=weights.reduce((n,v)=>n+v,0);
 const blocs=names.map((name,i)=>{
  const seats=i===names.length-1?remaining:Math.floor(size*weights[i]/total);
  remaining-=seats;
  return {name,seats,stance:R(25,70)};
 });
 const best=blocs.slice().sort((a,b)=>b.seats-a.seats);
 const coalition=[];
 let seats=0;
 for(const bloc of best){if(seats>size/2)break;coalition.push(bloc.name);seats+=bloc.seats;}
 s.bodies[g.country+':'+scope]={age:g.age,scope,size,blocs,coalition};
 return s.bodies[g.country+':'+scope];
}
function civicInstall(s,o,party){
 if(s.office)civicLeave(s,'Moved to another office',false);
 civicUpdateCountry(s);
 s.office={id:o.id,term:++s.serial,country:g.country,since:g.age,end:g.age+o.term};
 s.party=party;g.party=party;g.office=civicLegacyIndex(o);g.term=0;g.pc=35;g.approval=54;
 g.job=null;g.pt=[];g.intern=null;g.ue=false;
 g.vent=g.vent.filter(v=>!v.ceo);
 if(o.id==='leader')C().leader=g.name;
 const budget=pr({school:85000,city:500000,region:2800000,nation:16000000}[o.scope]);
 const key=g.country+':'+o.scope;
 s.publicBudgets??={};
 s.funds=s.publicBudgets[key]??budget;
 g.top=Math.max(g.top,civicLegacyIndex(o));
 civicAssembly(s,o.scope,party);
}
function civicElection(s,c,o){
 const rivals=c.rivals.map(x=>({...x,backing:Math.max(8,x.backing+R(-8,9))}));
 const field=[{name:g.name,party:c.party,backing:Math.max(1,c.backing+R(-5,6)),player:true},...rivals];
 const mode=civicSystem(g.country).mode;
 const appointment=o.id==='leader'&&mode!=='presidential';
 const chamber=appointment?civicAssembly(s,'nation',c.party):null;
 if(chamber){
  for(const candidate of field){
   const name=candidate.party;
   const seats=chamber.blocs.find(b=>b.name===name)?.seats||0;
   candidate.backing+=seats+(chamber.coalition.includes(name)?10:0);
  }
 }
 const sum=field.reduce((n,x)=>n+x.backing,0),scale=appointment?chamber.size:10000+o.rank*42000;
 const allocated=field.map(x=>{const total=x.backing/sum*scale;x.votes=Math.floor(total);return {candidate:x,remainder:total-x.votes};});
 allocated.sort((a,b)=>b.remainder-a.remainder);
 const unassigned=scale-field.reduce((n,x)=>n+x.votes,0);
 for(const row of allocated.slice(0,unassigned))row.candidate.votes++;
 field.sort((a,b)=>b.votes-a.votes||Number(!!a.player)-Number(!!b.player));
 const won=!!field[0].player;
 s.ethics=civicClamp(s.ethics+c.ethics);
 s.elections.unshift({id:o.id,country:c.country,age:g.age,won,results:field});
 s.elections=s.elections.slice(0,30);
 s.campaign=null;
 if(won)civicInstall(s,o,c.party);
 if(c.risk>=2)s.review={age:g.age+1,key:'campaign',country:g.country};
 civicNotice(s,'election',o.name+' election results',field.map(x=>x.name+' '+x.votes.toLocaleString()).join(' · ')+
  (won?' You won the most votes.':' '+field[0].name+' won the most votes.'),{won,country:g.country});
}
function civicLeave(s,reason,press=true){
 const i=s.office;
 if(!i)return;
 const o=civicOffice(i.id,i.country);
 s.terms.push({country:i.country,id:i.id,name:o.name,rank:o.rank,years:Math.max(0,g.age-i.since),reason});
 (s.publicBudgets??={})[i.country+':'+o.scope]=s.funds;
 s.office=null;s.advisory=null;g.office=-1;g.term=0;
 const affected=s.bills.filter(b=>b.term===i.term&&['committee','desk','reconsideration','veto','review'].includes(b.stage));
 for(const bill of affected)bill.stage='closed';
 if(o.id==='leader'&&g.w[i.country]?.leader===g.name)g.w[i.country].leader=nm2();
 if(press)civicPress(s,g.name+' leaves '+o.name+' office',reason+'.');
}
const civicCanVeto=o=>o?.executive&&(o.id!=='leader'||civicSystem(g.country).mode==='presidential');
const civicTermBills=s=>s.bills.filter(b=>b.term===s.office?.term);
const civicLiveStage=b=>['committee','desk','reconsideration','veto','review'].includes(b.stage);
const civicMetric=(s,scope,key)=>{
 if(scope==='nation')return g.nat[key];
 s.local??={};
 const row=s.local[g.country+':'+scope]??={...g.nat};
 return row[key];
};
function civicChange(s,scope,effects){
 for(const [key,value] of Object.entries(effects)){
  const next=civicClamp(civicMetric(s,scope,key)+value);
  if(scope==='nation')g.nat[key]=next;
  else s.local[g.country+':'+scope][key]=next;
 }
}
function civicBill(s,key,{npc=false,order=false,target=null}={}){
 const o=civicCurrent(),def=CIVIC_POLICIES[key];
 if(!o||!def?.[1].includes(o.scope)||civicTermBills(s).some(b=>b.key===key&&(civicLiveStage(b)||b.age===g.age)))return null;
 if(['defense','extraction'].includes(key)&&!o.executive)return null;
 const rate=def[3],cost=Math.round(s.funds*rate);
 const b={id:++s.serial,key,country:g.country,term:s.office.term,age:g.age,scope:o.scope,cost,target,
  stage:order?'review':'committee',name:def[0],support:0,debate:null,npc,order,due:g.age+1,outcome:null,used:[]};
 s.bills.push(b);
 if(s.bills.length>120){const oldest=s.bills.findIndex(x=>!civicLiveStage(x));if(oldest>=0)s.bills.splice(oldest,1);}
 if(order){
  civicPress(s,'Executive decision faces judicial review',b.name+' was issued through executive authority. Its effect is suspended pending a ruling.');
 }else civicBillPress(s,b,b.name+' enters '+civicAssemblyName(o),npc?'Legislators introduced the proposal independently.':'The proposal is awaiting debate and a vote.');
 return b;
}
function civicBillSupport(s,b,mode){
 const o=civicCurrent();
 if(!o||!civicTermBills(s).includes(b)||!['committee','reconsideration','veto'].includes(b.stage)||b.used.includes(mode))return 'This action is unavailable for this measure.';
 const cost={whip:5,compromise:3,favor:2}[mode];
 if(!cost||g.pc<cost)return 'You need more political capital.';
 g.pc-=cost;b.used.push(mode);
 if(mode==='compromise'){b.support+=12;b.cost=Math.round(b.cost*.76);b.compromise=true;}
 if(mode==='whip')b.support+=8;
 if(mode==='favor'){
  b.support+=15;
  s.favors.push({id:++s.serial,country:g.country,due:g.age+2,status:'open',name:b.name});
  s.ethics=civicClamp(s.ethics-4);
  if(s.favors.filter(f=>f.status==='open').length>=2&&!s.review)s.review={age:g.age+1,key:'favors',country:g.country};
 }
 return '';
}
function civicVote(s,b,position='support'){
 const o=civicCurrent();
 if(!o||!civicTermBills(s).includes(b)||!['committee','reconsideration','veto'].includes(b.stage))return 'This measure is no longer available for a vote.';
 const veto=b.stage==='veto',body=civicAssembly(s,b.scope,s.party);
 const threshold=veto?Math.ceil(body.size*2/3):Math.floor(body.size/2)+1;
 let yes=0;
 for(const bloc of body.blocs){
  const alignment=(bloc.name===s.party?12+(s.support-50)/6:0)+(body.coalition.includes(bloc.name)?5:0);
  const support=cl(bloc.stance+alignment+b.support+(position==='oppose'?-18:8)+R(-12,12),5,97);
  yes+=Math.round(bloc.seats*support/100);
 }
 b.debate={yes,no:body.size-yes,threshold};
 if(yes<threshold){
  b.stage='failed';b.outcome=veto?'Veto sustained':'Rejected by the assembly';
 }else if(o.executive&&!veto){b.stage='desk';b.due=g.age+1;}
 else civicEnact(s,b,veto?'Veto overridden':'Passed by the assembly');
 const voteText='The recorded vote was '+yes+' in favor and '+(body.size-yes)+' against. '+(b.outcome||'The measure awaits executive review.');
 if(b.stage==='desk')civicBillPress(s,b,b.name+' reaches the executive desk',voteText);
 else civicPress(s,b.name+' receives a vote',voteText);
 return '';
}
function civicEnact(s,b,reason){
 if(!civicTermBills(s).includes(b)||s.funds<b.cost){
  b.stage='failed';b.outcome='Insufficient public funds';return false;
 }
 b.stage='enacted';b.outcome=reason;s.funds-=b.cost;
 const effects=Object.fromEntries(Object.entries(CIVIC_POLICIES[b.key][2]).map(([k,n])=>[k,b.compromise?Math.round(n*.65):n]));
 civicChange(s,b.scope,effects);
 g.approval=civicClamp(g.approval+2);
 if(b.key==='tax'&&b.scope==='nation')C().t.inc=Math.max(0,C().t.inc-(b.compromise?.5:1));
 if(b.key==='extraction')s.resources.output+=b.compromise?2:4;
 if(b.key==='defense'&&b.target&&g.w[b.target]&&b.target!==g.country){
  if(!g.wars.some(w=>[w.a,w.b].includes(g.country)&&[w.a,w.b].includes(b.target))){
   g.wars.push({a:g.country,b:b.target,left:3});
   civicNotice(s,'incident','Defense authorization takes effect','An international crisis has entered the conflict phase. The government can pursue mediation or manage public support.',{key:'peace'},true);
  }
 }
 civicPress(s,b.name+' takes effect',b.outcome+'. The public appropriation was '+loc(b.cost)+'.');
 return true;
}
function civicDesk(s,b,action){
 const o=civicCurrent();
 if(!o?.executive||!civicTermBills(s).includes(b)||b.stage!=='desk')return 'The bill is unavailable for executive action.';
 if(action==='sign')civicEnact(s,b,o.id==='leader'&&!civicCanVeto(o)?'Approved for implementation':'Signed into law');
 else if(action==='negotiate'){
  if(b.used.includes('returned'))return 'This bill has already been returned for revisions.';
  b.used.push('returned');b.stage='reconsideration';b.support+=9;b.cost=Math.round(b.cost*.80);
  b.due=g.age+1;
  civicBillPress(s,b,b.name+' returns to the assembly','The executive requested revisions before deciding whether to sign.');
 }else if(action==='veto'&&civicCanVeto(o)){
  b.stage='veto';b.due=g.age+1;
  civicBillPress(s,b,b.name+' is vetoed','The assembly may attempt a two-thirds override in the simulation.');
 }else return 'Invalid executive action.';
 return '';
}
function civicOrder(s,key){
 const o=civicCurrent();
 if(!o?.executive||!['transport','safety','water','health','jobs'].includes(key)||s.used.order===g.age||g.pc<8)return 'An eligible order costs 8 political capital and can be used once a year.';
 const b=civicBill(s,key,{order:true});
 if(!b)return 'This policy is outside your jurisdiction or already pending.';
 s.used.order=g.age;g.pc-=8;
 return '';
}
function civicCountryResource(s){
 return ['United States','Canada','Brazil','Mexico','Russia','Saudi Arabia','United Arab Emirates','Iran','Nigeria','Indonesia','China','Norway','Venezuela'].includes(g.country)?'Energy reserves':'Mineral and industrial resources';
}
const civicNations=()=>Object.keys(g.w).filter(k=>k!==g.country);
function civicInternational(s,action,country,org){
 if(civicCurrent()?.id!=='leader'||!civicNations().includes(country))return 'Select an eligible government and foreign partner.';
 const annual=action==='mediation'?'diplomacy':action;
 if(s.used[annual]===g.age)return 'That program has already been used this year.';
 const war=g.wars.find(w=>[w.a,w.b].includes(g.country)&&[w.a,w.b].includes(country));
 let title='',body='';
 if(action==='authorise'){
  if(war)return 'A conflict is already active.';
  if(!civicBill(s,'defense',{target:country}))return 'A defense authorization is already pending.';
  return '';
 }
 if(action==='trade'){
  if(tie(country)<25||s.resources.stock<2)return 'The agreement requires two resource units and diplomatic ties of at least 25.';
  s.resources.stock-=2;s.funds+=pr(225000);civicChange(s,'nation',{E:3});
  s.trade.push({age:g.age,country,units:2});
  title='New trade agreement signed';body=g.country+' reached a resource agreement with '+country+'.';
 }else if(action==='diplomacy'||action==='aid'||action==='mediation'){
  const allowed=Object.hasOwn(CIVIC_BODIES,org)||s.pacts.some(p=>p.name===org);
  if(!allowed)return 'Select a recognized forum.';
  if(org==='NATO'&&!['United States','Canada','United Kingdom','France','Germany','Italy','Spain','Sweden','Poland','Netherlands','Turkey','Greece','Portugal','Czechia'].includes(g.country))return 'This government has no NATO membership in the simulation. Choose another forum.';
  const cost=pr(action==='aid'?240000:85000);
  if(s.funds<cost)return 'Public funds cannot cover this commitment.';
  s.funds-=cost;g.tadj[country]=(g.tadj[country]||0)+(action==='aid'?8:6);s.standing=civicClamp(s.standing+4);
  if(action==='mediation'&&war&&ch(cl(tie(country)+40,25,85))){
   g.wars=g.wars.filter(w=>w!==war);title='Ceasefire reached';body='Mediators brought '+g.country+' and '+country+' to a ceasefire through '+org+'.';
  }else{title='Multilateral talks open';body=g.country+' and '+country+' coordinated through '+org+' on '+(CIVIC_BODIES[org]||'a shared development program').toLowerCase()+'.';}
 }else if(action==='pact'){
  if(s.pacts.some(p=>p.country===country)||tie(country)<35||s.funds<pr(120000))return 'The proposed partnership needs funds, stronger ties, and a new partner.';
  s.funds-=pr(120000);s.pacts.push({name:country+' Cooperation Forum',country,age:g.age});
  s.standing=civicClamp(s.standing+3);
  title='A new cooperation forum is established';body=g.country+' and '+country+' opened a forum for shared trade, environment and humanitarian priorities.';
 }else return 'That international action is unavailable.';
 s.used[annual]=g.age;civicPress(s,title,body,null,true);
 return '';
}
function civicMilitary(s,action){
 if(civicCurrent()?.id!=='leader'||s.used.military===g.age)return 'Only the national executive can set one posture each year.';
 const posture={
  defensive:['Defensive readiness',280000,7,2],
  support:['Civilian protection and relief',200000,3,4],
  reserves:['Reserve and equipment funding',365000,10,0],
  standdown:['Nuclear risk-reduction and stand-down',125000,-2,7],
  deterrence:['Nuclear deterrence review',160000,2,-4]
 }[action];
 if(!posture||(['standdown','deterrence'].includes(action)&&!civicNuclear()))return 'That option is unavailable for this country.';
 const [name,cost,ready,standing]=posture;
 if(s.funds<pr(cost))return 'The public budget cannot fund this posture.';
 s.funds-=pr(cost);s.military={readiness:civicClamp(s.military.readiness+ready),posture:name};
 s.standing=civicClamp(s.standing+standing);s.used.military=g.age;
 civicChange(s,'nation',action==='support'?{S:3}:{A:Math.sign(ready)});
 civicPress(s,'Government revises defense posture',g.country+' announced '+name.toLowerCase()+'.',null,true);
 return '';
}
const civicNuclear=()=>['United States','United Kingdom','France','China','Russia','India','Pakistan','North Korea'].includes(g.country);
function civicRoster(s){
 if(s.roster?.age===g.age)return s.roster;
 return s.roster={age:g.age,candidates:{
  career:{name:nm2(),profile:'Career specialist'},coalition:{name:nm2(),profile:'Coalition nominee'},independent:{name:nm2(),profile:'Independent expert'}
 }};
}
function civicAdvisory(s){
 const o=civicCurrent();
 if(!o?.executive||s.advisory||s.used.advisory===g.age)return 'A request is already active or outside executive authority.';
 const measure=civicTermBills(s).find(b=>b.stage==='desk');
 if(!measure)return 'There must be a measure at your desk.';
 s.used.advisory=g.age;s.advisory={bill:measure.id,due:g.age+1};
 civicPress(s,'Executive requests a judicial opinion',measure.name+' was referred for a public advisory opinion. The assembly’s vote remains on record.');
 return '';
}
function civicAppoint(s,kind,seat,candidate){
 if(civicCurrent()?.id!=='leader'||!['career','coalition','independent'].includes(candidate))return 'Choose an eligible nominee.';
 const label=civicRoster(s).candidates[candidate].name;
 if(Object.values(s.cabinet).some(x=>x.name===label)||s.judges.some(x=>x.name===label)||s.nominee?.name===label)return 'The nominee already holds an appointment.';
 if(kind==='cabinet'){
  if(!CIVIC_CABINET.includes(seat)||s.used['seat:'+seat]===g.age)return 'This cabinet seat can be filled once a year.';
  s.used['seat:'+seat]=g.age;
  s.cabinet[seat]={name:label,age:g.age,experience:{career:75,coalition:53,independent:67}[candidate]};
  s.support=civicClamp(s.support+(candidate==='coalition'?6:1));
  civicPress(s,seat+' appointment announced',label+' accepted the portfolio.');
 }else if(kind==='judge'){
  if(s.nominee||s.judges.length>=7||s.used.judge===g.age)return 'A judicial nomination is already pending or the bench is full.';
  s.used.judge=g.age;
  s.nominee={name:label,due:g.age+1,quality:{career:74,coalition:51,independent:80}[candidate]};
  civicPress(s,'Judicial nomination submitted',label+' will receive an independent confirmation vote.');
 }else return 'Unknown appointment.';
 return '';
}
function civicEventOptions(s,item){
 if(item.kind==='incident')return CIVIC_EVENTS[item.key]?.[2]||[];
 if(item.kind==='ethics')return ['Request a hearing with counsel','Cooperate with the inquiry','Contest the inquiry publicly'];
 if(item.kind==='favor')return ['Disclose and end the arrangement','Offer a public policy compromise','Honor the private commitment'];
 if(item.kind==='election')return item.won?['Thank voters and publish priorities','Keep remarks brief']:['Concede publicly','Review the campaign results'];
 if(item.kind==='court')return ['Accept the court’s ruling','Bring a narrower policy to committee','Request a public legal briefing'];
 return ['Acknowledge the update','Issue a public statement'];
}
function civicRespond(s,item,index){
 const choice=civicEventOptions(s,item)[index],o=civicCurrent();
 if(!choice||!s.events.includes(item)||!civicEventAvailable(item,o))return {done:false,text:'This decision is unavailable.'};
 if(['incident','favor','court'].includes(item.kind)&&!o)return {done:false,text:'You no longer hold the relevant office.'};
 if(item.kind==='ethics'&&justiceCurrent(justiceState()))return {done:false,text:'Finish your current court case before responding to this inquiry.'};
 let text=choice+'.';
 if(item.kind==='incident'){
  const def=CIVIC_EVENTS[item.key],effect=def[3][index],charge=Math.round(s.funds*(index===0?.045:index===1?.02:0));
  s.funds-=charge;civicChange(s,o.scope,effect);
  g.approval=civicClamp(g.approval+[5,2,-4][index]);
  if(def[1]==='world')s.standing=civicClamp(s.standing+[5,2,-1][index]);
  if(item.key==='trade')g.eco.finance=cl(g.eco.finance+[4,2,-5][index],5,95);
  if(item.key==='tradeOffer'&&index===1){
   s.funds+=pr(150000);s.ethics=civicClamp(s.ethics-12);s.standing=civicClamp(s.standing-7);
   s.review={age:g.age+1,key:'trade',country:g.country};
  }
  if(item.key==='housing'&&index===0){
   const state=newsState(),market=state.market;
   state.market={factor:(market?.expiresAge===g.age+1?market.factor:1)*.965,expiresAge:g.age+1};
  }
  civicPress(s,'An official response is announced',item.title+'. '+text,null,def[1]==='world');
 }else if(item.kind==='favor'){
  const f=s.favors.find(x=>x.id===item.target);
  if(f)f.status=index===2?'honored':'disclosed';
  s.ethics=civicClamp(s.ethics+[6,1,-9][index]);
  if(index===2){s.support=civicClamp(s.support+8);s.review={age:g.age+1,key:'favors',country:g.country};}
  if(index===0)g.pc=Math.max(0,g.pc-5);
 }else if(item.kind==='ethics'){
  const fee=index===0?pr(7000):0;
  if(g.cash<fee)return {done:false,text:'Personal cash cannot fund this legal response.'};
  if(fee){g.cash-=fee;LD('Campaign inquiry legal fees',-fee);}
  s.ethics=civicClamp(s.ethics+[1,5,-7][index]);
  g.approval=civicClamp(g.approval+[0,-2,-8][index]);
  s.review=null;
  if(ch([30,45,68][index])){
   justiceBook({key:'bribery',charges:['bribery'],evidence:[44,55,68][index],source:'A campaign ethics inquiry was referred for review.'});
   text='The inquiry was referred to the court for a hearing.';
  }else text='The ethics inquiry concluded without a court referral.';
  civicPress(s,'Ethics inquiry reaches a decision',text);
 }else if(item.kind==='court'){
  if(index===1&&item.bill!=null){
   const prior=s.bills.find(b=>b.id===item.bill);
   if(prior&&prior.stage==='rejected'&&prior.age<g.age){
    const revision=civicBill(s,prior.key);
    if(revision){revision.compromise=true;revision.cost=Math.round(revision.cost*.75);}
   }
  }
  if(index===2)g.approval=civicClamp(g.approval+2);
 }else if(item.kind==='election'){
  if(index===0)s.ethics=civicClamp(s.ethics+2);
  if(item.won&&o&&index===0)g.approval=civicClamp(g.approval+3);
 }
 item.closed=true;
 return {done:true,text};
}
function civicResolveOrder(s,b){
 const o=civicCurrent(),limited=['water','safety','health'].includes(b.key);
 const confidence=cl(40+(limited?22:0)+s.judges.reduce((n,j)=>n+(j.quality-55)/9,0),20,80);
 if(ch(confidence))civicEnact(s,b,'Upheld after judicial review');
 else{b.stage='rejected';b.outcome='Struck down by the court';g.approval=civicClamp(g.approval-5);}
 civicNotice(s,'court',civicSystem(g.country).court+' issues a ruling',b.name+'. '+b.outcome+'.',{bill:b.id,country:g.country,office:o.id});
}
function civicYear(){
 const s=g.civics;
 if(!s||s.lastAge>=g.age||g.jail)return;
 s.lastAge=g.age;
 if(s.office&&!civicActive())civicLeave(s,'The office became vacant');
 const o=civicCurrent();
 if(s.review?.age<=g.age&&s.review.country===g.country&&!s.events.some(e=>e.kind==='ethics'&&!e.closed)){
  civicNotice(s,'ethics','Election watchdog opens an ethics inquiry','Records raise questions about political commitments. The case may be referred for a hearing.',{country:g.country});
 }
 if(!o)return;
 g.term=g.age-s.office.since;
 const cap={school:140000,city:950000,region:5000000,nation:28000000}[o.scope];
 const efficiency=(s.cabinet.Finance?.experience||50)/100;
 s.funds=Math.min(pr(cap),s.funds+pr(cap*(.21+efficiency*.06)));
 if(o.id==='leader'){
  s.resources.stock=Math.min(80,s.resources.stock+s.resources.output);
  if(s.nominee?.due<=g.age){
   const candidate=s.nominee;
   s.nominee=null;
   const chamber=civicAssembly(s,'nation');
   const accepted=ch(cl(candidate.quality+s.support/7-(chamber.coalition.includes(s.party)?0:18),24,90));
   if(accepted)s.judges.push(candidate);
   civicNotice(s,'update','Legislators rule on the judicial nomination',candidate.name+(accepted?' was confirmed.':' did not receive enough votes.'),{country:g.country,office:'leader'});
  }
 }
 const term=s.office;
 if(s.advisory?.due<=g.age){
  const measure=civicTermBills(s).find(b=>b.id===s.advisory.bill);
  s.advisory=null;
  if(measure?.stage==='desk'){
   const narrow=ch(47);
   if(narrow)measure.support-=5;
   civicNotice(s,'court',civicSystem(g.country).court+' publishes an advisory opinion',
    measure.name+(narrow?' would benefit from narrower statutory language.':' has a sufficient legal basis to proceed.'),
    {bill:measure.id,country:g.country,office:o.id});
  }
 }
 if(term.end<=g.age){
  civicLeave(s,'The elected term ended');
  civicNotice(s,'update',o.name+' term concludes','The seat is open for a new election. Previous service improves campaign support.',{country:g.country});
  return;
 }
 if(o.id==='leader'&&g.age%3===0){
  civicNotice(s,'court',civicSystem(g.country).court+' requests a public brief',
   'The court has opened an independent review of administrative accountability. Your response sets the government’s public position.',
   {country:g.country,office:o.id});
 }
 if(g.age%2===0&&o.scope!=='school'){
  const body=civicRenewAssembly(s,o.scope);
  civicNotice(s,'update',civicSystem(g.country).body+' publishes new seat totals',body.blocs.map(x=>x.name+' '+x.seats).join(' · ')+
   '. Governing bloc: '+body.coalition.join(' + ')+'.',{country:g.country,office:o.id});
 }
 for(const f of s.favors.filter(x=>x.status==='open'&&x.due<=g.age&&x.country===g.country)){
  f.status='requested';civicNotice(s,'favor','A past supporter calls in a favor','The request traces back to '+f.name+'. Your response can trigger an ethics inquiry.',{target:f.id,country:g.country,office:o.id});
 }
 for(const b of civicTermBills(s).filter(x=>x.due<=g.age&&civicLiveStage(x))){
  if(b.stage==='veto')civicVote(s,b,'oppose');
  else if(b.stage==='review')civicResolveOrder(s,b);
  else if((b.npc||b.stage==='reconsideration')&&b.stage!=='desk')civicVote(s,b,'support');
 }
 if(civicTermBills(s).filter(civicLiveStage).length<4){
  const keys=Object.keys(CIVIC_POLICIES).filter(k=>CIVIC_POLICIES[k][1].includes(o.scope)&&!['defense','extraction'].includes(k));
  const b=civicBill(s,P(keys),{npc:true});
  if(b&&o.executive&&ch(70))civicVote(s,b,'support');
 }
 const types=Object.keys(CIVIC_EVENTS).filter(k=>[o.scope,...(o.id==='leader'?['world']:[])].includes(CIVIC_EVENTS[k][1])&&
  !s.events.some(e=>e.key===k&&(!e.closed||e.age>=g.age-2)&&e.office===o.id));
 if(types.length){
  const activeConflict=g.wars.some(w=>[w.a,w.b].includes(g.country));
  const signal=o.id==='leader'&&activeConflict&&types.includes('peace')?'peace':
   o.id==='leader'&&g.eco.finance<37&&types.includes('trade')?'trade':null;
  const key=signal||P(types),def=CIVIC_EVENTS[key];
  civicNotice(s,'incident',def[0],'A response is requested from the '+o.name.toLowerCase()+'.',{key,country:g.country,office:o.id},def[1]==='world');
 }
}
