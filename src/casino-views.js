let casinoVenue=null;
const casinoCall=(name,...args)=>name+'('+args.map(x=>uiEscape(JSON.stringify(x))).join(',')+')';
const casinoButton=(label,action,...args)=>B(label,casinoCall('casinoClick',action,...args));
const casinoGameLink=(key,title,disabled=false)=>B(title,casinoCall('casinoOpen','play',key,casinoVenue),disabled);
const casinoSection=(title,html)=>studioSection(title,html);
const casinoBaseBack=()=>B('Back to Casino',"casinoOpen('home')");
const casinoValue=id=>document.getElementById('casino-'+id)?.value;
const casinoCards=cards=>cards.map(casinoCard).join('  ');
function casinoOpen(page='home',key=null,venue=null){
 if(!g.alive||g.jail)return;
 if(!['home','play','owner','records'].includes(page))return;
 tab='Other';NV.O=['Casino',page,key];casinoVenue=venue;draw(1);
}
function casinoResume(){
 const r=g.casinoPlay?.round;
 if(r)casinoOpen('play',r.game,r.venue);
}
function casinoClick(action,key=null,arg=null){
 if(!g.alive||g.jail||publicityBusy()||g.justice?.pending)return;
 let error='';
 const venue=casinoVenue,s=casinoState();
 const discards=()=>[...document.querySelectorAll('#casino-discard input:checked')].map(i=>Number(i.value));
 if(action==='bet'){
  const choice=casinoValue('choice')||null,stake=Number(casinoValue('stake'));
  const selection=key==='keno'?[1,2,3].map(n=>Number(casinoValue('keno-'+n))):
   key==='horse'||key==='sports'?Number(casinoValue('fixture')):casinoValue('number');
  error=casinoStart(key,venue,stake,choice,selection);
 }else if(action==='move'){
  error=casinoMove(key,discards());
 }else if(action==='estimate'){
  const round=s.round;
  if(!round||round.game==='blackjack')return;
  const estimate=casinoPokerEstimate(round,discards()),output=document.getElementById('casino-equity');
  if(!estimate||!output)return toast('Mark up to three discards first.');
  output.textContent='Simulated showdown · Win '+casinoPct(estimate.win)+' · Tie '+casinoPct(estimate.push)+' · Lose '+casinoPct(estimate.loss)+'.';
  return;
 }else if(action==='create'){
  error=casinoCreate(casinoValue('name'));
  if(!error)return casinoOpen('owner',null,g.vent.find(v=>v.t==='cas').casino.id);
 }else if(action==='budget'){
  const raw=casinoValue('budget'),amount=raw?.trim()?Number(raw):NaN;
  if(!casinoCanGamble()||!Number.isSafeInteger(amount)||amount<0)return toast('Enter a budget of zero or more.');
  s.budget=amount;casinoSeason(s);
 }else if(action==='pause'){
  if(!casinoCanGamble()||s.round)return toast('Finish the active round first.');
  s.paused=g.age+1;
 }else if(action==='support'){
  const e=s.events.find(x=>x.id===key),answer=casinoRespond(e,arg);
  if(!answer.done)error=answer.text;
 }else{
  const v=casinoOwns(venue);
  if(action==='transfer'||action==='withdraw')arg=Number(casinoValue('transfer'));
  if(action==='limits')arg=[Number(casinoValue('min')),Number(casinoValue('max'))];
  if(action==='rule')arg=key==='rake'?Number(casinoValue(key)):casinoValue(key);
  error=casinoManage(v,action,key,arg);
  if(action==='sell'&&!error)return casinoOpen('owner');
 }
 if(error)return toast(error);
 draw(1);
}
function casinoLobby(){
 const s=casinoState(),round=s.round,v=casinoVenue?casinoOwns(casinoVenue):null,c=v?.casino;
 const back=c?B('Back to management',casinoCall('casinoOpen','owner',null,c.id)):casinoBaseBack();
 if(casinoVenue&&!c)return casinoBaseBack()+'<p>This casino is unavailable.</p>';
 if(!casinoCanGamble())return back+ '<p>Casino play opens at age '+casinoEnterAge()+' in '+uiEscape(g.country)+'.</p>';
 const games=c?c.games:Object.keys(CASINO_GAMES);
 return back+casinoSection(v?.n||'Public casino',c&&c.closed>g.age?'<p>Wagering is suspended until the reserve is restored.</p>':
  '<p>Wagers use your character’s cash.</p>'+games.map(key=>casinoGameLink(key,CASINO_GAMES[key][0])).join(''))+
  (round?B('Resume the active hand','casinoResume()'):'')+
  B('Results and limits', "casinoOpen('records')");
}
const casinoOption=(id,label,choices)=>studioSelect('casino-'+id,label,choices);
const casinoNumber=(id,label,value,min,max)=>'<label for="casino-'+id+'">'+label+'</label><input class="txt" type="number" step="1" id="casino-'+id+
 '" value="'+value+'" min="'+min+'"'+(max==null?'':' max="'+max+'"')+'>';
function casinoGameRules(key,terms){
 switch(key){
  case 'blackjack':
   return '<p>One deck. Beat the dealer without exceeding 21. The dealer '+(terms.soft==='hit'?'hits':'stands on')+
    ' soft 17. A natural pays '+(terms.blackjack==='three'?'3:2':'6:5')+' profit. Ordinary wins pay 1:1 and ties push.</p>'+
    '<p>Hit, stand, double on two cards, or split one matching pair. Split aces receive one card each. No insurance or surrender.</p>'+
    '<p>A typical blackjack table wins about 42% of hands for the player, with about 8% pushes. Your choices and these house rules change that rate.</p>';
  case 'draw':
   return '<p>Heads-up poker with equal antes. Keep your hand or replace up to three cards once. The best five-card hand wins and ties return the ante. The room takes '+
    terms.rake+'% of winning profit.</p><p>Win chance depends on your cards and draw choices. A random five-card hand is dealt exactly one pair 42.26% of the time.</p>';
  case 'holdem':
   return '<p>Heads-up fixed-limit Hold’em with equal antes. Two hole cards and five shared cards. The best five of seven win. Tied pots return the stakes.</p>'+
    '<p>Check, raise once per street, or fold. The later streets use a double-size raise. The opponent can match or fold. Winning profit is charged '+
    terms.rake+'% rake. A starting hand is dealt a pocket pair 5.88% of the time. Showdown equity changes as the board is dealt.</p>';
  case 'roulette':{
   const pockets=terms.wheel==='single'?37:38;
   return '<p>'+(pockets===37?'European single-zero':'American double-zero')+' wheel · '+pockets+' equal pockets.</p><p>Even-money bets win '+
    casinoPct(18/pockets)+' and pay 1:1. Dozens win '+casinoPct(12/pockets)+' and pay 2:1. One number wins '+casinoPct(1/pockets)+
    ' and pays 35:1. Zero pockets beat outside bets. House edge '+casinoPct(1-36/pockets)+'.</p>';
  }
  case 'slots':
   return '<p>Three independently weighted reels. Exact return '+casinoPct(casinoSlotReturn(terms.slots))+
    ' before rounding. Any payout '+casinoPct(casinoSlotChance())+' including a stake return.</p><p>Three matching symbols return '+
    CASINO_REELS.map(([n,w],i)=>n+' '+CASINO_SLOT_PAY[terms.slots][i]+'× (symbol weight '+w+'%)').join(', ')+
    '. Exactly two cherries return the stake.</p>';
  case 'keno':
   return '<p>Pick three different numbers from 1–80. The house draws 20 without replacement. Two matches return '+
    CASINO_KENO_PAY[2]+'× ('+casinoPct(casinoKenoChance(2))+'), and three return '+CASINO_KENO_PAY[3]+'× ('+
    casinoPct(casinoKenoChance(3))+'). Any win '+casinoPct(casinoKenoChance(2)+casinoKenoChance(3))+'.</p>';
  case 'dice':
   return '<p>Two fair dice. Pick a total above or below seven. Either wins 15 of 36 rolls ('+casinoPct(15/36)+
    ') and pays 1:1. Seven loses either bet.</p>';
  case 'horse':
   return '<p>Pick the race winner. The field is simulated from the posted form weights. Decimal odds include the stake and reflect a 15% takeout before rounding.</p>';
  default:
   return '<p>Pick a team to win or take the over/under. Each simulated score varies by up to 16 points over its baseline. Moneyline ties refund the stake. Decimal odds include the stake and reflect a 5% margin before rounding.</p>';
 }
}
function casinoBetFields(s,key,terms){
 if(key==='roulette')return casinoOption('choice','Roulette bet',[
  ['red','Red'],['black','Black'],['even','Even'],['odd','Odd'],['low','1–18'],['high','19–36'],['first','First dozen'],
  ['second','Second dozen'],['third','Third dozen'],['straight','One number']])+
  '<label for="casino-number">Number for a straight bet ('+(terms.wheel==='double'?'0–36 or 00':'0–36')+
  ')</label><input id="casino-number" class="txt" inputmode="numeric" value="0" maxlength="2">';
 if(key==='keno')return [1,2,3].map(i=>casinoNumber('keno-'+i,'Number '+i,i,1,80)).join('');
 if(key==='dice')return casinoOption('choice','Dice total',[['under','Under seven'],['over','Over seven']]);
 if(key==='horse'){
  const horses=casinoBoard(s).horse,sum=horses.reduce((n,h)=>n+h.weight,0);
  return casinoOption('fixture','Pick a horse',horses.map((h,i)=>[i,h.name+' · '+casinoPct(h.weight/sum)+' · '+casinoHorseOdds(horses,h).toFixed(2)+'×']));
 }
 if(key==='sports'){
  const matches=casinoBoard(s).sports;
  return casinoOption('fixture','Match',matches.map((m,i)=>[i,m.home+' vs '+m.away]))+
   casinoOption('choice','Bet',[['home','Home team'],['away','Away team'],['over','Over points'],['under','Under points']])+
   matches.map(m=>'<details class="card"><summary>'+m.home+' vs '+m.away+'</summary><p>Total line '+
    (m.a+m.b+16)+'.5 points</p>'+casinoSportsOptions(m).map(o=>'<p>'+({home:m.home,away:m.away,over:'Over',under:'Under'}[o.key])+
     ' · '+casinoPct(o.prob)+' win'+(o.push?' · '+casinoPct(o.push)+' push':'')+' · '+(o.odds>=1.01?o.odds.toFixed(2)+'×':'No offer')+'</p>').join('')+'</details>').join('');
 }
 return '';
}
function casinoRoundView(r){
 if(r.game==='blackjack')return '<p>Dealer shows '+casinoCard(r.dealer[0])+' and a hidden card.</p>'+
  r.hands.map((h,i)=>'<p><b>'+(i===r.hand?'Playing hand ':'Hand ')+(i+1)+'</b> · '+casinoCards(h.cards)+
  ' · Total '+casinoBlackjackScore(h.cards).total+' · Wager '+loc(h.stake)+'</p>').join('')+
  '<p>Estimated chance of busting on the next hit · '+casinoPct(casinoBustChance(r))+'.</p>'+
  ['hit','stand','double','split'].map(a=>casinoButton({hit:'Hit',stand:'Stand',double:'Double down',split:'Split pair'}[a],'move',a)).join('');
 const estimate=casinoButton('Estimate showdown odds','estimate')+'<p id="casino-equity" role="status"></p>';
 if(r.game==='draw')return '<p>Current hand · '+CASINO_HAND_NAMES[casinoPokerScore(r.player)[0]]+'</p>'+
  '<fieldset id="casino-discard"><legend>Mark up to three cards to replace</legend>'+r.player.map((c,i)=>
   '<label><input type="checkbox" value="'+i+'"> Replace '+casinoCard(c)+'</label>').join('')+'</fieldset>'+estimate+
  casinoButton('Draw selected cards · none to stand pat','move','draw')+casinoButton('Fold','move','fold');
 return '<p>Your cards · '+casinoCards(r.player)+'</p><p>Board · '+(r.board.length?casinoCards(r.board):'Waiting for the flop')+'</p>'+
  '<p>Street · '+['Opening round','Flop','Turn','River'][r.street]+' · Your stake '+loc(r.stake)+'</p>'+
  estimate+casinoButton(r.street===3?'Check and show hands':'Check and deal next street','move','check')+
  casinoButton('Raise '+loc(r.original*(r.street>=2?2:1)),'move','raise')+casinoButton('Fold','move','fold');
}
function casinoGameView(key){
 const s=casinoState(),r=s.round,terms=casinoTerms(casinoVenue),v=casinoOwns(casinoVenue);
 const back=B('Back to games',casinoCall('casinoOpen','play',null,casinoVenue));
 if(!casinoCanGamble()||!terms||!Object.hasOwn(CASINO_GAMES,key))return back;
 const title=CASINO_GAMES[key][0],wePlay=r?.game===key&&r.venue===casinoVenue;
 const stats=s.stats[key],total=stats?stats.won+stats.lost+stats.push:0;
 const record=total?'<p>Your results · '+stats.won+' wins, '+stats.lost+' losses, '+stats.push+' pushes · '+
  casinoPct(stats.won/total)+' win rate across '+total+' plays.</p>':'';
 const last=s.result?.game===key&&s.result.venue===casinoVenue?s.result:null;
 const receipt=last?'<div class="card" role="status"><p><b>'+(last.net>0?'Won '+loc(last.net):last.net<0?'Lost '+loc(-last.net):'Stake returned')+
  '</b></p><p>'+uiEscape(last.summary)+'</p></div>':'';
 const available=!v||casinoAvailable(v.casino,key),open=!r&&available&&s.paused<=g.age;
 return back+casinoSection(title,record+receipt+
  (wePlay?casinoRoundView(r):r?B('Resume the active hand','casinoResume()'):open?
   casinoNumber('stake','Wager',terms.min,terms.min,terms.max)+'<p>Table limits '+loc(terms.min)+' to '+loc(terms.max)+'.</p>'+
   casinoBetFields(s,key,terms)+casinoButton(key==='slots'?'Spin':key==='horse'?'Run the race':key==='sports'?'Watch the match':'Place wager','bet',key):
   '<p>'+(available?'You are on a gambling break until next Age Up.':'This table is closed.')+'</p>')+
  '<details class="card"><summary>Rules and winning odds</summary>'+casinoGameRules(key,wePlay?r.terms:terms)+'</details>');
}
function casinoRecords(){
 const s=casinoState(),net=s.netAge===g.age?s.net:0;
 const events=s.events.filter(e=>e.key==='support'&&casinoEventReady(e));
 return casinoBaseBack()+casinoSection('Results and limits','<p>Season net '+loc(net)+'. Your loss limit applies before a wager is accepted.</p>'+
  casinoNumber('budget','Season loss limit (0 clears it)',s.budget,0)+casinoButton('Save loss limit','budget')+
  (s.paused>g.age?'<p>On a break until next Age Up.</p>':casinoButton('Take a break until next Age Up','pause'))+
  (s.round?B('Resume the active hand','casinoResume()'):'')+
  events.map(e=>'<details class="card"><summary>Gambling support plan</summary>'+
   CASINO_BUSINESS_EVENTS.support[2].map(([label],i)=>casinoButton(label,'support',e.id,i)).join('')+'</details>').join(''))+
  casinoSection('Recent results',s.history.slice(0,16).map(r=>'<p>Age '+r.age+' · '+CASINO_GAMES[r.game][0]+' · '+loc(r.net)+'<br>'+
   uiEscape(r.summary)+'</p>').join('')||'<p>No wagers recorded.</p>');
}
function casinoRuleView(c){
 const choices={
  wheel:['Roulette wheel',[['single','European single zero'],['double','American double zero']]],
  soft:['Dealer on soft 17',[['stand','Stand'],['hit','Hit']]],
  blackjack:['Natural blackjack payout',[['three','3:2 profit'],['six','6:5 profit']]],
  slots:['Slot paytable',[['standard','Standard'],['jackpot','Higher jackpot, smaller cherry prize']]],
  rake:['Percent of poker winning profit',[2,4,6,8].map(n=>[n,n+'%'])]
 };
 return casinoNumber('min','Minimum wager',c.min,1)+casinoNumber('max','Maximum wager',c.max,1)+casinoButton('Apply betting limits','limits')+
  Object.entries(choices).map(([k,[label,options]])=>{
   const ordered=[...options].sort(([a],[b])=>Number(b===c.rules[k])-Number(a===c.rules[k]));
   return casinoOption(k,label,ordered)+casinoButton('Apply '+label.toLowerCase(),'rule',k);
  }).join('');
}
function casinoOwnerView(v){
 const back=casinoBaseBack();
 if(!v){
  const properties=g.vent.filter(x=>x.t==='cas');
  return back+casinoSection('Open your own casino',!casinoCanOwn()?'<p>Casino ownership opens at 21.</p>':
   properties.length?properties.map(x=>{
    const c=casinoBusinessState(x);
    return B(uiEscape(x.n)+ ' <small>'+CASINO_LEVELS[c.level][0]+'</small>',casinoCall('casinoOpen','owner',null,c.id));
   }).join(''):'<p>Open a house game for '+loc(pr(CASINO_LEVELS[0][1]))+
    '. Start with blackjack and expand when the reserve can cover construction.</p><label for="casino-name">Casino name</label>'+
    '<input class="txt" id="casino-name" maxlength="48">'+casinoButton('Open house game','create'));
 }
 if(!casinoCanOwn())return back+'<p>Casino operations are unavailable.</p>';
 const c=casinoBusinessState(v),level=CASINO_LEVELS[c.level],next=CASINO_LEVELS[c.level+1],report=c.report;
 const pending=(g.casinoPlay?.events||[]).filter(e=>e.venue===c.id&&casinoEventReady(e));
 const bucket=(title,body)=>'<details class="law-section"><summary>'+title+'</summary>'+body+'</details>';
 return '<div class="law-shell">'+back+casinoSection(v.n,'<p>'+level[0]+' · '+uiEscape(c.country)+'</p>'+
  Bar('Reputation',c.rep,GOLD)+studioStats([['Casino funds',loc(c.cash)],['Table slots',c.games.length+' / '+level[3]],
   ['Amenity slots',c.amenities.length+' / '+c.level*2],['Entertainment slots',c.performers.length+' / '+c.level]])+
  (c.closed>g.age?'<p>Wagering suspended.</p>'+casinoButton('Reopen after funding the reserve','reopen'):'')+
  B('Play at your casino',casinoCall('casinoOpen','play',null,c.id)))+
  (pending.length?casinoSection('Open public decisions',pending.map(e=>B(uiEscape(CASINO_BUSINESS_EVENTS[e.key][0]),casinoCall('newsOpenBrief',e.article))).join('')):'')+
  bucket('Finances and expansion',(report?studioStats([['Visitors',report.visitors],['Gaming income',loc(report.gaming)],
   ['Table play net',loc(report.table)],['Hospitality income',loc(report.amenities)],['Operating expenses',loc(report.expenses)],
   ['Business tax',loc(report.taxes)],['Unfunded costs',loc(report.shortfall)]]):'<p>The first report arrives at Age Up.</p>')+
   '<p>Personal withdrawal withholding · '+finDistributionTax(100)+'%</p>'+casinoNumber('transfer','Transfer amount','',1)+casinoButton('Invest personal funds','transfer')+casinoButton('Withdraw taxable distribution','withdraw')+
   (next?casinoButton('Expand to '+next[0].toLowerCase()+' · '+loc(casinoCurrency(c,next[1])),'expand'):'')+
   casinoButton('Run a marketing campaign','marketing'))+
  bucket('Games on the floor',Object.entries(CASINO_GAMES).map(([key,[title,need,cost]])=>{
   const open=c.games.includes(key);
   return B((open?'Close ':'Open ')+title+' <small>'+(need>c.level?'Unlocks at '+CASINO_LEVELS[need][0]:open?'Open':loc(casinoCurrency(c,cost)))+
    '</small>',casinoCall('casinoClick','game',key),need>c.level||open&&c.games.length===1);
  }).join(''))+bucket('House rules',casinoRuleView(c))+
  bucket('Restaurants, bars and entertainment venues',Object.entries(CASINO_AMENITIES).map(([key,[name,l,cost]])=>
   B(name+' <small>'+(c.amenities.includes(key)?'Open':l>c.level?'Unlocks at '+CASINO_LEVELS[l][0]:loc(casinoCurrency(c,cost)))+
    '</small>',casinoCall('casinoClick','amenity',key),l>c.level||c.amenities.includes(key))).join(''))+
  bucket('Performers and security',Object.entries(CASINO_PERFORMERS).map(([key,[name,l,space,cost]])=>{
   const hired=c.performers.includes(key);
   return B((hired?'Release ':'Book ')+name.toLowerCase()+' <small>'+(l>c.level?'Unlocks at '+CASINO_LEVELS[l][0]:
    space&&!c.amenities.includes(space)?'Needs '+CASINO_AMENITIES[space][0]:loc(casinoCurrency(c,cost))+' per year')+'</small>',
    casinoCall('casinoClick','act',key),l>c.level||!!space&&!c.amenities.includes(space));
  }).join('')+'<p>Security '+c.security+' / '+(c.level+2)+'</p>'+casinoButton('Hire a security officer','security','',1)+
   casinoButton('Release a security officer','security','',-1))+
  bucket('Ownership',casinoButton('Sell venue · '+loc(casinoBusinessValue(v)),'sell'))+'</div>';
}
function casinoView(){
 const page=NV.O[1]||'home',key=NV.O[2];
 if(page==='owner')return casinoOwnerView(casinoOwns(casinoVenue));
 if(page==='play')return key?casinoGameView(key):casinoLobby();
 if(page==='records')return casinoRecords();
 return B('Back to Other',"mainTabOpen('Other')")+casinoSection('Casino',
  B('Go to Casino',"casinoOpen('play')")+B('Open your own Casino',"casinoOpen('owner')")+
  B('Results and limits',"casinoOpen('records')")+(g.casinoPlay?.round?B('Resume the active hand','casinoResume()'):''));
}
