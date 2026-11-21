const studioHas=(data,key)=>Object.hasOwn(data,key);
const studioClamp=n=>Math.round(Math.max(0,Math.min(100,n)));
const studioFind=(items,id)=>items.find(row=>row.id===id);
const studioMoney=n=>loc(Math.round(n||0));
const studioCost=(s,n)=>Math.round(n*s.scale);
const studioId=s=>++s.serial;
function studioRandom(s,min,max){
  s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;
  return min+Math.floor(s.seed/4294967296*(max-min+1));
}
const studioPick=(s,list)=>list[studioRandom(s,0,list.length-1)];
const studioName=s=>studioPick(s,STUDIO_FIRST)+' '+studioPick(s,STUDIO_LAST);
const studioRole=p=>p.media==='series'||p.media==='limited'?'cable':'theater';
const studioActiveProjects=s=>s.projects.filter(p=>!['released','cancelled'].includes(p.stage));
const studioTotals=record=>Object.values(record).reduce((n,x)=>n+x,0);
const studioPeriod=()=>({income:{},expenses:{},capital:{}});
function studioRecord(s,text){
  s.history.unshift({age:s.age,text});
  if(s.history.length>70)s.history.pop();
}
function studioPost(s,kind,category,amount,p=null){
  const value=Math.round(amount);
  if(!value)return;
  s.cash+=value;
  const bucket=s.period[kind];
  bucket[category]=(bucket[category]||0)+(kind==='capital'?value:Math.abs(value));
  if(p){
    if(kind==='income')p.earned+=value;
    else if(kind==='expenses')p.spent-=value;
    p.costs[category]=(p.costs[category]||0)+value;
  }
  s.ledger.unshift({age:s.age,kind,category,amount:value,project:p?.id??0});
  if(s.ledger.length>170)s.ledger.pop();
}
function studioSpend(s,amount,category,p=null){
  if(amount>s.cash&&amount>0)return false;
  studioPost(s,'expenses',category,-amount,p);
  return true;
}
const studioTalent=(s,role,quality)=>({
  id:studioId(s),name:studioName(s),role,skill:quality,reputation:studioRandom(s,12,81),relationship:studioRandom(s,39,66),
  bookings:0,shared:[],retainer:null
});
function studioNew({name,age,capital,scale,seed,reputation}){
  const s={version:1,name,age,opened:age,status:'active',cash:capital,scale,seed,serial:0,reputation,projects:[],people:[],assets:[],outlets:{},
    rivals:[],period:studioPeriod(),reports:[],ledger:[],history:[],incidents:[],seen:[],notices:[],offers:[],awardSeason:null,awards:0,
    pending:null,review:null,lossYears:0};
  for(const role of Object.keys({...STUDIO_ROLES,...STUDIO_CREW})){
    const count=studioHas(STUDIO_ROLES,role)?5:3;
    for(let i=0;i<count;i++)s.people.push(studioTalent(s,role,studioRandom(s,39,67)+(i===count-1?15:0)));
  }
  s.rivals=STUDIO_RIVALS.map((name,index)=>({id:studioId(s),name,reputation:26+index*8+studioRandom(s,0,9),gross:studioCost(s,studioRandom(s,350000,8500000)),releases:2+index,awards:index}));
  for(const [id,outlet] of Object.entries(STUDIO_OUTLETS))s.outlets[id]=Math.max(18,49-Math.round(outlet.min*.3));
  s.assets.push({id:studioId(s),type:0,book:studioCost(s,STUDIO_ASSETS[0][1]),bought:age});
  return s;
}
function studioProjectCost(s,p,base){
  return studioCost(s,base*STUDIO_MEDIA[p.media][1]*STUDIO_FORMATS[p.format][1]);
}
function studioNewProject(s,settings,source=null){
  const {name,genre,media,format,rating,leads,support,background}=settings;
  if(typeof name!=='string'||!name.trim()||name.length>64||/[<>]/.test(name)||!STUDIO_GENRES.includes(genre)||!STUDIO_RATINGS.includes(rating)||
    !studioHas(STUDIO_MEDIA,media)||!studioHas(STUDIO_FORMATS,format)||![1,2].includes(leads)||![0,1,2,3].includes(support)||![0,1,2].includes(background))return 'Choose a valid title, format, rating and casting plan.';
  if(studioActiveProjects(s).length>=2+Math.floor(s.reputation/24))return 'The studio’s development slate is full.';
  if(s.projects.some(p=>p.name.toLowerCase()===name.trim().toLowerCase()))return 'This studio already has a project with that title.';
  if(source&&(source.stage!=='released'||!source.rights||!s.projects.includes(source)))return 'The studio needs the screen rights to develop this sequel.';
  const draft=studioCost(s,7500);
  if(draft>s.cash)return 'Studio funds cannot cover script development.';
  const p={id:studioId(s),name:name.trim(),genre,media,format,rating,created:s.age,stage:'writing',stageAge:s.age,ready:false,quality:studioRandom(s,43,56),
    slots:[],crew:{},spent:0,earned:0,costs:{},source:source?.id??null,franchise:source?.franchise||source?.id||null,
    releaseAge:null,actual:null,distribution:null,rights:true,rightsSale:0,investor:null,financingAt:null,campaign:null,buzz:18,
    delay:0,licenses:[],nominations:[],results:[],decisions:[],record:null,gross:0,initialProfit:0,runtime:null};
  for(const [role,count] of [[format==='animation'||format==='stop'?'voice':'lead',leads],['support',support],['background',background]]){
    for(let i=0;i<count;i++)p.slots.push({role,number:i+1,person:null,fee:0});
  }
  if(source){
    p.buzz=studioClamp(19+source.buzz*.19);
    studioLogProject(p,'This project continues the story of '+source.name+'.');
  }
  studioSpend(s,draft,'Writing',p);
  s.projects.push(p);
  studioLogProject(p,'The studio ordered the initial screenplay.');
  return p;
}
function studioLogProject(p,text){
  p.decisions.unshift(text);
  if(p.decisions.length>24)p.decisions.pop();
}
function studioAssetDiscount(s,phase){
  return Math.min(.34,s.assets.reduce((n,a)=>STUDIO_ASSETS[a.type][3]===phase?n+STUDIO_ASSETS[a.type][4]:n,0));
}
function studioEstimate(s,p){
  const remaining={writing:135000,casting:111000,filming:80000,post:39000,marketing:15000}[p.stage]||0;
  const cast=p.slots.reduce((n,x)=>n+(x.person==null?studioCost(s,STUDIO_ROLES[x.role][1]):0),0);
  return p.spent+studioProjectCost(s,p,remaining)+cast;
}
function studioTalentQuote(s,person){
  const row=STUDIO_ROLES[person.role]||STUDIO_CREW[person.role];
  return studioCost(s,row[1]*(.60+person.skill/145+person.reputation/210-person.relationship/480));
}
function studioCasting(s,p,index,person){
  if(!p||p.stage!=='casting'||p.ready||!p.slots[index]||!person)return '';
  const slot=p.slots[index];
  if(slot.person||slot.role!==person.role||p.slots.some(x=>x.person===person.id))return 'Select available talent who fits the role.';
  const price=studioTalentQuote(s,person);
  if(!studioSpend(s,price,'Casting',p))return 'The studio cannot afford this talent contract.';
  slot.person=person.id;slot.fee=price;
  person.bookings++;person.relationship=studioClamp(person.relationship+4);person.shared.push(p.id);
  studioLogProject(p,person.name+' signed for '+STUDIO_ROLES[slot.role][0].toLowerCase()+'.');
  return person.name+' signed for '+studioMoney(price)+'.';
}
function studioHireStaff(s,person){
  if(!person||!studioHas(STUDIO_CREW,person.role)||person.retainer!=null)return '';
  if(s.people.filter(x=>x.retainer!=null).length>=2+Math.floor(s.reputation/24))return 'Your studio has reached its current permanent staffing limit.';
  const salary=studioCost(s,STUDIO_CREW[person.role][1]*(1.25+person.skill/115)),onboarding=Math.round(salary*.043);
  if(s.cash<Math.round(salary*.32)+onboarding)return 'Keep at least four months of salary in studio funds before hiring.';
  studioSpend(s,onboarding,'Staff');
  person.retainer=salary;person.relationship=studioClamp(person.relationship+6);
  return person.name+' joined the studio at '+studioMoney(salary)+' per year.';
}
function studioReleaseStaff(s,person){
  if(!person?.retainer)return '';
  const fee=Math.round(person.retainer/12);
  if(!studioSpend(s,fee,'Staff'))return 'There is insufficient cash for severance. In a deficit, use the recovery plan to settle payroll from proceeds.';
  person.retainer=null;person.relationship=studioClamp(person.relationship-10);
  return person.name+' received severance. Future annual payroll has been reduced.';
}
function studioAssignCrew(s,p,person){
  const phases={writer:'writing',director:'filming',producer:'filming',crew:'filming',editor:'post'};
  if(!p||!person||p.ready||p.stage!==phases[person.role]||p.crew[person.role])return 'This role is unavailable in the current production stage.';
  const quote=person.retainer?0:studioTalentQuote(s,person);
  if(!studioSpend(s,quote,'Staff',p))return 'Studio funds cannot cover this crew contract.';
  p.crew[person.role]=person.id;
  person.relationship=studioClamp(person.relationship+4);person.bookings++;
  if(!person.shared.includes(p.id))person.shared.push(p.id);
  return person.name+' joined the production'+(quote?' for '+studioMoney(quote):' through their studio contract')+'.';
}
function studioAssetAction(s,id,action){
  if(action==='buy'){
    const row=STUDIO_ASSETS[id];
    if(!row||s.assets.some(x=>x.type===id))return '';
    const price=studioCost(s,row[1]);
    if(s.cash<price)return 'The studio cannot fund this purchase.';
    studioPost(s,'capital','Production equipment purchases',-price);
    s.assets.push({id:studioId(s),type:id,book:price,bought:s.age});
    return row[0]+' was purchased for '+studioMoney(price)+'.';
  }
  const asset=studioFind(s.assets,id);
  if(!asset)return '';
  const proceeds=studioAssetValue(s,asset);
  s.assets=s.assets.filter(x=>x!==asset);
  studioPost(s,'capital','Equipment sales',proceeds);
  return STUDIO_ASSETS[asset.type][0]+' sold for '+studioMoney(proceeds)+'. Annual upkeep fell.';
}
const studioAssetValue=(s,a)=>Math.round(a.book*Math.max(.32,.76-(s.age-a.bought)*.045));
function studioSeekInvestment(s,p){
  if(!p||!['writing','casting','filming'].includes(p.stage)||p.investor||p.financingAt===s.age)return '';
  p.financingAt=s.age;
  const interest=Math.min(91,25+s.reputation*.45+p.quality*.25+p.slots.filter(x=>x.person).length*2);
  if(studioRandom(s,1,100)>interest){
    studioLogProject(p,'An outside investor declined the pitch this year.');
    return 'The investor declined the pitch. You can try again next year.';
  }
  const advance=studioProjectCost(s,p,56000+s.reputation*810),share=s.reputation>=60?17:26;
  p.investor={advance,share,paid:0,cancelled:false};
  studioPost(s,'capital','Outside project investment',advance);
  studioLogProject(p,'An outside investor contributed '+studioMoney(advance)+' for a '+share+'% share of studio receipts.');
  return 'Outside funding added '+studioMoney(advance)+' to studio cash. The investor receives '+share+'% of the project’s studio receipts.';
}

const STUDIO_OPTIONS={
  writing:[['Polish a lean draft',10500,7],['Run a table read and rewrite',21500,11],['Commission an extended rewrite',39000,17]],
  filming:[['Shoot an efficient production',39000,6],['Rehearse and extend the shoot',67000,11],['Fund a detailed production schedule',111000,17]],
  post:[['Finish the standard cut',15500,6],['Test the cut and revise',32000,12],['Commission additional post-production',54500,17]]
};
const studioIncidentsFor=(s,p)=>s.incidents.filter(e=>e.project===p.id&&!e.closed);
const studioBlockingIncident=(s,p)=>studioIncidentsFor(s,p).some(x=>!['festival','leak'].includes(x.key));
function studioPhaseChoice(s,p,choice){
  if(!p||p.ready||!Number.isInteger(choice)||choice<0||choice>2||!STUDIO_OPTIONS[p.stage]?.[choice])return '';
  if(studioBlockingIncident(s,p))return 'Resolve the open production issue before completing this stage.';
  const [label,base,expected]=STUDIO_OPTIONS[p.stage][choice];
  const category=STUDIO_STAGES[p.stage],asset=studioAssetDiscount(s,p.stage);
  const cost=Math.round(studioProjectCost(s,p,base)*(1-asset));
  if(!studioSpend(s,cost,category,p))return 'Studio funds cannot cover this production choice.';
  const group={writing:['writer'],filming:['director','producer','crew'],post:['editor']}[p.stage];
  const hired=group.map(role=>studioFind(s.people,p.crew[role])).filter(Boolean);
  const boost=hired.reduce((n,e)=>n+Math.round((e.skill-40)/12),0);
  let cast=0;
  if(p.stage==='filming')cast=Math.round(p.slots.reduce((n,slot)=>n+(studioFind(s.people,slot.person)?.skill||42),0)/Math.max(1,p.slots.length)/9)-5;
  const change=expected+boost+cast+studioRandom(s,-5,4);
  p.quality=studioClamp(p.quality+change);
  p.ready=true;
  studioLogProject(p,label+'. The stage review is complete.');
  return label+'. Project quality '+p.quality+'/100. This stage advances at the next Age Up unless a production issue holds it.';
}
function studioLockCast(s,p){
  if(!p||p.stage!=='casting'||p.ready)return '';
  if(p.slots.some(x=>x.person==null))return 'Fill all selected casting positions before locking the cast.';
  p.ready=true;
  const star=p.slots.map(slot=>studioFind(s.people,slot.person)).find(x=>x.reputation>=76);
  if(star&&g.studio===s){
    studioHeadline(s,p,'A recognizable performer joins '+p.name,star.name+' has signed for '+p.name+'.','cast-'+p.id);
  }
  studioLogProject(p,'All roles are under contract. Filming opens next year.');
  return 'The complete cast is under contract. Filming begins at the next Age Up.';
}
function studioConfigureRelease(s,p,outlet,deal){
  const network=STUDIO_OUTLETS[outlet];
  if(!p||p.stage!=='marketing'||p.ready||p.distribution||!network||![studioRole(p),'streaming'].includes(network.channel))return 'Choose a compatible distributor before locking your marketing.';
  if(s.reputation+Math.max(0,s.outlets[outlet]-40)/2<network.min)return 'The distributor requires more studio reputation or a stronger working relationship.';
  if(deal==='original'&&network.channel!=='streaming'||!['share','original'].includes(deal))return 'Choose a valid contract for this partner.';
  const cost=studioCost(s,network.fee);
  if(!studioSpend(s,cost,studioChannelName(network.channel),p))return 'The studio cannot afford the distribution deal.';
  p.distribution={outlet,deal,agreed:s.age,guarantee:deal==='original'?studioProjectCost(s,p,117000+Math.round(p.quality*1730*network.reach)):0};
  studioLogProject(p,'A distribution agreement was signed with '+network.name+'.');
  if(deal==='original'&&g.studio===s)studioHeadline(s,p,network.name+' commissions a streaming original',s.name+' will deliver '+p.name+' as a streaming original.','streaming-original-'+p.id);
  return network.name+(deal==='original'?' guaranteed '+studioMoney(p.distribution.guarantee)+' on delivery.':' agreed to distribute the project with a '+Math.round(network.share*100)+'% studio share.');
}
const studioChannelName=key=>({theater:'Movie theaters',cable:'Cable',streaming:'Streaming'}[key]);
function studioMarket(s,p,choice,offset){
  const campaign=[['Targeted campaign',14600,10],['Wide campaign',39000,23],['Premiere campaign',76000,34]][choice];
  if(!p||p.stage!=='marketing'||p.ready||!p.distribution||!campaign||![1,2,3].includes(offset))return 'Sign a distributor and choose a campaign first.';
  if(studioBlockingIncident(s,p))return 'Resolve the open issue before announcing a release date.';
  const cost=studioProjectCost(s,p,campaign[1]);
  if(!studioSpend(s,cost,'Marketing',p))return 'The studio cannot afford this campaign.';
  p.campaign=campaign[0];p.releaseAge=s.age+offset;p.buzz=studioClamp(p.buzz+campaign[2]+Math.round(p.quality*.15));p.ready=true;p.stage='future';p.stageAge=s.age;
  studioLogProject(p,'Marketing is booked. The distributor reserved a release for age '+p.releaseAge+'.');
  if(g.studio===s)studioHeadline(s,p,p.name+' gets a release date',STUDIO_OUTLETS[p.distribution.outlet].name+' will release the project when you are age '+p.releaseAge+'.','scheduled-'+p.id);
  return p.name+' is scheduled to release at age '+p.releaseAge+'.';
}
function studioInvestorPayout(s,p,amount){
  if(!p.investor||p.investor.cancelled)return;
  const payout=Math.round(amount*p.investor.share/100);
  p.investor.paid+=payout;
  studioPost(s,'expenses','Investor payouts',-payout,p);
}
function studioRelease(s,p){
  if(p.stage!=='future'||p.releaseAge>s.age||studioBlockingIncident(s,p))return false;
  const {outlet,deal,guarantee}=p.distribution,network=STUDIO_OUTLETS[outlet];
  const audience=studioClamp(Math.round(p.quality*.62+p.buzz*.30)+studioRandom(s,-17,17));
  const critics=studioClamp(p.quality+studioRandom(s,-14,9));
  const variance=studioRandom(s,57,155)/100;
  const baseline=studioProjectCost(s,p,268000);
  const genre=(['Action','Family','Fantasy','Science fiction'].includes(p.genre)?1.12:1)*(p.rating==='R'?.87:1);
  const gross=deal==='original'?guarantee:Math.max(0,Math.round(baseline*network.reach*variance*genre*(.25+audience/46)*(1+s.reputation/160)));
  const receipt=deal==='original'?gross:Math.round(gross*network.share);
  p.stage='released';p.stageAge=s.age;p.actual=s.age;p.gross=gross;p.critics=critics;p.audience=audience;
  p.runtime=p.media==='film'?studioRandom(s,85,140):p.media==='short'?studioRandom(s,12,37):studioRandom(s,4,10)+' episodes';
  studioPost(s,'income',studioChannelName(network.channel),receipt,p);
  studioInvestorPayout(s,p,receipt);
  p.initialProfit=p.earned-p.spent;
  const ratio=p.earned/Math.max(1,p.spent);
  p.record=ratio<.46?'Bomb':ratio<.83?'Flop':ratio<1.18?'Meets expectations':ratio<2?'Hit':'Smash';
  const ratings=[critics,Math.round((critics+p.quality)/2),Math.round(p.slots.reduce((n,x)=>n+(studioFind(s.people,x.person)?.skill||0),0)/p.slots.length),p.quality,audience];
  p.nominations=STUDIO_AWARDS.filter((_,i)=>ratings[i]>=66&&studioRandom(s,1,100)<=Math.min(94,34+ratings[i]-Math.floor(s.rivals.length*2)));
  s.reputation=studioClamp(s.reputation+({Bomb:-5,Flop:-2,'Meets expectations':2,Hit:6,Smash:11}[p.record])+Math.min(3,p.nominations.length));
  s.outlets[outlet]=studioClamp(s.outlets[outlet]+(ratio>=1?5:-3));
  for(const slot of p.slots){
    const performer=studioFind(s.people,slot.person);
    if(performer)performer.reputation=studioClamp(performer.reputation+(ratio>=1?3:1));
  }
  for(const incident of studioIncidentsFor(s,p))incident.closed=true;
  s.notices.push({kind:'release',project:p.id,age:s.age});
  studioLogProject(p,'The release recorded '+p.record.toLowerCase()+' results and '+studioMoney(p.initialProfit)+' in launch profit or loss.');
  studioRecord(s,p.name+' opened through '+network.name+'.');
  if(g.studio===s){
    g.fame=studioClamp((g.fame||0)+(ratio>=1.18?5:1)+Math.min(4,p.nominations.length));
    g.fm=Math.max(g.fm||0,g.fame);
    studioHeadline(s,p,p.name+' opens to audiences',p.name+' earned '+studioMoney(gross)+' in '+(deal==='original'?'its streaming delivery agreement':'public market receipts')+'. It opened as '+p.record.toLowerCase()+'.','release-'+p.id);
  }
  return true;
}
function studioAwards(s){
  const season=s.awardSeason;
  if(!season||season.age!==s.age||season.status!=='nominated')return '';
  const fee=studioCost(s,8500);
  if(!studioSpend(s,fee,'Marketing'))return 'Studio funds cannot cover the awards appearance.';
  season.status='attended';
  let awards=0;
  const outcomes=[];
  for(const p of s.projects.filter(x=>season.projects.includes(x.id))){
    for(const category of p.nominations){
      const merit=category==='Audience award'?p.audience:category==='Production craft'?p.quality:p.critics;
      const chance=Math.min(75,19+Math.max(0,merit-57)+s.reputation*.12);
      const won=studioRandom(s,1,100)<=chance;
      p.results.push({category,won,age:s.age});
      awards+=Number(won);
      if(won)outcomes.push(p.name+' · '+category);
    }
  }
  season.wins=awards;
  s.awards+=awards;s.reputation=studioClamp(s.reputation+(awards?Math.min(12,awards*3):1));
  const headline=awards?awards+' award'+(awards===1?'':'s')+' won':'The nominees did not win at the ceremony';
  if(g.studio===s){
    g.fame=studioClamp(g.fame+awards*3);g.fm=Math.max(g.fm,g.fame);
    studioHeadline(s,null,awards?s.name+' wins at the Screen Guild Awards':s.name+' attends the Screen Guild Awards',awards?outcomes.join('. ')+'.':'The studio’s nominees attended the ceremony.','awards-result-'+s.age);
  }
  studioRecord(s,headline+'.');
  return headline+'.'+(outcomes.length?' '+outcomes.join('. ')+'.':' The nominations remain in each release’s record.');
}
function studioGenerateOffer(s,p,index=0){
  if(p.stage!=='released'||!p.rights||p.licenses.some(x=>x.until>=s.age)||s.offers.some(x=>x.project===p.id&&x.expires>=s.age))return null;
  const stream=['frame','current','atlas'].filter(k=>STUDIO_OUTLETS[k].min<=s.reputation+8);
  if(!stream.length)return null;
  const outlet=stream[index%stream.length],years=2+Number(p.record==='Smash');
  const annual=studioProjectCost(s,p,Math.max(12000,Math.round(p.earned*.065)+studioRandom(s,3500,16000)))*
    (outlet==='atlas'?1.3:outlet==='current'?1.12:1);
  const offer={id:studioId(s),project:p.id,outlet,years,annual:Math.round(annual),expires:s.age+1};
  s.offers.push(offer);
  studioRecord(s,STUDIO_OUTLETS[outlet].name+' offered a license for '+p.name+'.');
  return offer;
}
function studioLicense(s,id){
  const offer=studioFind(s.offers,id),p=offer&&studioFind(s.projects,offer.project);
  if(!offer||!p?.rights||offer.expires<s.age||p.licenses.some(x=>x.until>=s.age))return 'This license is no longer available.';
  if(!studioSpend(s,studioCost(s,1800),'Streaming',p))return 'The studio cannot cover the delivery and licensing costs.';
  p.licenses.push({outlet:offer.outlet,annual:offer.annual,first:s.age+1,until:s.age+offer.years,paid:0,last:null});
  s.offers=s.offers.filter(x=>x.id!==id);
  s.outlets[offer.outlet]=studioClamp(s.outlets[offer.outlet]+4);
  studioLogProject(p,STUDIO_OUTLETS[offer.outlet].name+' licensed the title for '+offer.years+' years.');
  if(g.studio===s&&offer.annual*offer.years>=studioCost(s,50000)){
    studioHeadline(s,p,p.name+' returns through a streaming deal',STUDIO_OUTLETS[offer.outlet].name+' secured a '+offer.years+'-year library license.','library-'+offer.id);
  }
  return studioMoney(offer.annual)+' is due each year for '+offer.years+' years, starting at the next Age Up.';
}
function studioRightsQuote(s,p){
  const baseline=studioProjectCost(s,p,10000);
  return Math.max(baseline,Math.round(p.earned*.19+p.spent*.29+p.quality*studioCost(s,240)));
}
function studioSellRights(s,p){
  if(!p?.rights||p.stage==='cancelled')return '';
  const value=studioRightsQuote(s,p);
  p.rights=false;p.rightsSale=value;
  if(p.stage!=='released'){
    p.stage='cancelled';p.ready=false;
    s.incidents.filter(x=>x.project===p.id).forEach(x=>x.closed=true);
  }
  for(const license of p.licenses)license.until=Math.min(license.until,s.age);
  s.offers=s.offers.filter(x=>x.project!==p.id);
  studioPost(s,'income','Rights sales',value,p);
  studioInvestorPayout(s,p,value);
  if(p.investor)p.investor.cancelled=true;
  if(g.studio===s)studioHeadline(s,p,'Screen rights for '+p.name+' change hands',s.name+' sold the title’s screen rights.','rights-sale-'+p.id);
  studioLogProject(p,'The screen rights were sold. Future licensing income and sequel rights transferred to the buyer.');
  return 'Rights sold for '+studioMoney(value)+'. The buyer now controls future releases and licensing.';
}

function studioHeadline(s,p,title,text,key,type='studioPress',ref=p?.id||0){
  return newsPublish('film',title,text,{type,ref},'studio-'+s.opened+'-'+key+(p?'-p':''));
}
function studioRaiseIncident(s,p,kind){
  if(!STUDIO_INCIDENTS[kind]||studioIncidentsFor(s,p).length>=2||s.incidents.some(x=>x.project===p.id&&x.key===kind))return false;
  const entry={id:studioId(s),key:kind,project:p.id,age:s.age,closed:false,story:null};
  s.incidents.push(entry);
  const def=STUDIO_INCIDENTS[kind];
  if(def.public&&g.studio===s)entry.story=studioHeadline(s,p,def.headline,s.name+' is preparing a response regarding '+p.name+'.','incident-'+entry.id,'studioIncident',entry.id);
  studioLogProject(p,def.headline+'.');
  return true;
}
function studioPhaseIncident(s,p){
  const catalog={
    casting:['actor'],
    filming:p.format==='live'?['equipment','weather','location','safety','crew']:['equipment','crew'],
    post:['edit','music','leak'],
    marketing:['rights','festival'],
    future:['rights','festival','leak']
  }[p.stage];
  if(!catalog||studioRandom(s,1,100)>(p.delay?28:53))return;
  const choices=catalog.filter(x=>!s.seen.includes(x)&&!s.incidents.some(v=>v.project===p.id&&v.key===x));
  if(!choices.length)return;
  if(studioRaiseIncident(s,p,studioPick(s,choices)))s.seen.push(s.incidents.at(-1).key);
}
function studioResolveIncident(s,item,index){
  const p=item&&studioFind(s.projects,item.project);
  const choice=item&&!item.closed&&p&&STUDIO_INCIDENTS[item.key].choices[index];
  if(!choice)return {done:false,text:'This production issue is no longer open.'};
  const [label,base,quality,reputation,delay,bond,detail]=choice;
  const cost=studioCost(s,base);
  if(!studioSpend(s,cost,'Incident responses',p))return {done:false,text:'Studio funds cannot cover this response. Select a lower-cost option or raise more cash.'};
  item.closed=true;
  p.quality=studioClamp(p.quality+quality);s.reputation=studioClamp(s.reputation+reputation);
  p.buzz=studioClamp(p.buzz+reputation*2);
  if(p.stage==='future'&&(delay||p.releaseAge<=s.age))p.releaseAge=Math.max(s.age+1,p.releaseAge+delay);
  else p.delay+=delay;
  for(const id of new Set([...Object.values(p.crew),...p.slots.map(x=>x.person)])){
    const person=studioFind(s.people,id);
    if(person)person.relationship=studioClamp(person.relationship+bond);
  }
  studioLogProject(p,detail);
  studioRecord(s,p.name+' · '+label+'.');
  return {done:true,text:detail+(cost?' Studio expense '+studioMoney(cost)+'.':'')};
}
function studioYear(s,age){
  if(s.age===age)return;
  const previous=s.age;
  if(previous>age)return;
  if(s.awardSeason?.status==='nominated')s.awardSeason.status='missed';
  if(s.awardSeason?.status==='missed'){
    for(const p of s.projects.filter(x=>s.awardSeason.projects.includes(x.id)))p.awardsMissed=true;
  }
  const payroll=s.people.reduce((n,p)=>n+(p.retainer||0),0);
  studioPost(s,'expenses','Staff',-payroll);
  studioPost(s,'expenses','Equipment upkeep',-s.assets.reduce((n,a)=>n+studioCost(s,STUDIO_ASSETS[a.type][2]),0));
  if(s.cash<0)studioPost(s,'expenses','Interest',-Math.round(Math.abs(s.cash)*.08));
  s.age=age;
  if((age-s.opened)%6===0)s.seen=[];
  const newlyReleased=[];
  for(const p of s.projects){
    if(p.stage==='future'){
      if(p.releaseAge>age){
        if(!studioIncidentsFor(s,p).length)studioPhaseIncident(s,p);
      } else if(studioRelease(s,p))newlyReleased.push(p);
      else{
        p.releaseAge=age+1;
        studioLogProject(p,'A production issue prevented delivery. The release moved back one year.');
      }
      continue;
    }
    if(p.stage==='released'){
      for(const license of p.licenses.filter(x=>p.rights&&x.first<=age&&x.until>=age&&x.last!==age)){
        license.last=age;license.paid+=license.annual;
        studioPost(s,'income','Library licenses',license.annual,p);
        studioInvestorPayout(s,p,license.annual);
      }
      continue;
    }
    if(!p.ready||studioBlockingIncident(s,p))continue;
    if(p.delay>0){p.delay--;studioLogProject(p,'The production remains on its revised schedule.');continue;}
    const next={writing:'casting',casting:'filming',filming:'post',post:'marketing'}[p.stage];
    if(next){
      p.stage=next;p.stageAge=age;p.ready=false;
      studioLogProject(p,STUDIO_STAGES[next]+' opened.');
      studioPhaseIncident(s,p);
    }
  }
  const nominees=newlyReleased.filter(p=>p.nominations.length);
  s.awardSeason=nominees.length?{age,status:'nominated',projects:nominees.map(p=>p.id),wins:0,story:null}:null;
  if(nominees.length&&g.studio===s)s.awardSeason.story=studioHeadline(s,null,'Screen Guild announces its nominations',
    s.name+' received '+nominees.reduce((n,p)=>n+p.nominations.length,0)+' nominations for '+nominees.map(p=>p.name).join(', ')+'.','nominees-'+age,'studioAwards',0);
  s.offers=s.offers.filter(o=>o.expires>=age);
  let offers=0;
  for(const p of s.projects.filter(x=>x.stage==='released').slice().reverse()){
    if(offers>=3)break;
    if(studioRandom(s,1,100)<(p.actual===age?80:48)&&studioGenerateOffer(s,p,offers))offers++;
  }
  for(const rival of s.rivals){
    rival.reputation=studioClamp(rival.reputation+studioRandom(s,-5,7));
    rival.gross=Math.max(studioCost(s,230000),Math.round(rival.gross*(studioRandom(s,78,128)/100)));
    rival.releases+=studioRandom(s,1,3);
    rival.awards+=Number(studioRandom(s,1,100)<rival.reputation*.43);
  }
  const yearGross=newlyReleased.reduce((n,p)=>n+p.gross,0);
  s.reports.unshift({age:previous,closing:age,...s.period,cash:s.cash,gross:yearGross,releases:newlyReleased.map(p=>p.id)});
  s.reports=s.reports.slice(0,60);s.period=studioPeriod();
  s.lossYears=s.cash<0?s.lossYears+1:0;
  if(s.cash<0)s.notices.push({kind:'debt',project:0,age:s.age});
  if(studioRandom(s,1,100)<55){
    const role=studioPick(s,Object.keys({...STUDIO_ROLES,...STUDIO_CREW}));
    if(s.people.length<80)s.people.push(studioTalent(s,role,studioRandom(s,55,90)));
  }
}
function studioRankings(s){
  const mine={id:0,name:s.name,reputation:s.reputation,gross:s.reports[0]?.gross||0,releases:s.projects.filter(p=>p.stage==='released').length,awards:s.awards};
  return [mine,...s.rivals].sort((a,b)=>b.reputation-a.reputation||b.gross-a.gross);
}
function studioRestructure(s){
  if(s.cash>=0)return 'The studio is out of deficit.';
  const staff=s.people.filter(x=>x.retainer);
  if(!staff.length)return 'The studio has no permanent payroll to cut.';
  const charge=staff.reduce((n,p)=>n+Math.round(p.retainer/12),0);
  for(const e of staff){e.retainer=null;e.relationship=studioClamp(e.relationship-16);}
  studioPost(s,'expenses','Staff',-charge);
  s.reputation=studioClamp(s.reputation-3);
  if(g.studio===s)studioHeadline(s,null,'A studio restructures its production team',s.name+' reduced permanent staffing and recorded severance obligations.','restructure-'+s.age);
  return staff.length+' staff contracts ended. Future payroll fell and '+studioMoney(charge)+' in severance was recorded.';
}
