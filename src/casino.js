function casinoState(life=g){
 return life.casinoPlay??={version:1,serial:0,round:null,result:null,history:[],events:[],stats:{},
  fixtureAge:null,fixtures:null,paused:0,budget:0,netAge:life.age,net:0,noticeAge:null};
}
function casinoBoard(s){
 if(s.fixtureAge!==g.age){s.fixtures=casinoFixtures();s.fixtureAge=g.age;}
 return s.fixtures;
}
function casinoSeason(s){
 if(s.netAge!==g.age){s.netAge=g.age;s.net=0;s.result=null;}
}
function casinoTerms(venue){
 if(!venue)return {min:Math.max(1,pr(5)),max:Math.max(1,pr(2500)),wheel:'single',soft:'stand',blackjack:'three',slots:'standard',rake:4};
 const c=casinoOwns(venue)?.casino;
 return c?{min:c.min,max:c.max,...c.rules}:null;
}
function casinoRoundReserve(venue,stake,multiple){
 return !venue||casinoOwns(venue)?.casino.cash>=Math.max(0,Math.ceil(stake*multiple)-stake);
}
function casinoDebit(s,stake,venue,multiple,max){
 if(!Number.isSafeInteger(stake)||stake<=0||stake>max||stake>g.cash)return 'Enter a wager within the table limits and your cash.';
 if(s.budget>0&&Math.max(0,-s.net)+stake>s.budget)return 'This stake would exceed your seasonal loss limit.';
 if(!casinoRoundReserve(venue,stake,multiple))return 'The casino cannot reserve the maximum payout for this wager.';
 g.cash-=stake;
 return '';
}
function casinoAdditional(s,r,extra,multiple){
 const total=r.stake+extra;
 if(!Number.isSafeInteger(extra)||extra<1||extra>g.cash||total>r.terms.max*4)return 'Your cash or table limit cannot cover the additional stake.';
 if(s.budget>0&&Math.max(0,-s.net)+total>s.budget)return 'The seasonal loss limit cannot cover the additional stake.';
 if(!casinoRoundReserve(r.venue,total,multiple))return 'The casino cannot reserve the additional payout.';
 g.cash-=extra;r.stake=total;
 return '';
}
function casinoFinish(s,r,payout,summary){
 const returned=Math.max(0,Math.floor(payout)),net=returned-r.stake,v=casinoOwns(r.venue);
 if(v){
  v.casino.cash-=net;
  v.casino.liveNet-=net;
 }
 g.cash+=returned;
 s.net+=net;
 if(net)LD('Casino player net',net);
 const stats=s.stats[r.game]??={won:0,lost:0,push:0,net:0};
 stats[net>0?'won':net<0?'lost':'push']++;stats.net+=net;
 s.result={id:r.id,game:r.game,venue:r.venue,stake:r.stake,returned,net,summary,age:g.age};
 s.history.unshift({...s.result});s.history=s.history.slice(0,40);
 s.round=null;
 const title=CASINO_GAMES[r.game][0];
 L(uiEscape(title)+' · '+(net>0?'Won '+loc(net):net<0?'Lost '+loc(-net):'Stake returned')+'. '+uiEscape(summary));
 if(net>=pr(20000)){
  newsPublish('community','A casino payout makes local news',g.name+' won a notable payout at '+title.toLowerCase()+'.',null,'casino-win-'+g.age+'-'+r.id);
  if(v)casinoEvent('jackpot',v);
 }
 if(s.net<=-pr(5000))casinoCheckSupport(s);
 return '';
}
function casinoRefund(){
 const s=g.casinoPlay,r=s?.round;
 if(!r)return;
 g.cash+=r.stake;s.round=null;
 L('The unfinished casino round was voided and its stake was returned.');
}
function casinoFixedPlay(s,key,r,choice,selection){
 const amount=r.stake,terms=r.terms;
 if(key==='roulette'){
  const pick=casinoRoulettePick(choice,terms.wheel,selection),n=R(0,terms.wheel==='single'?36:37);
  return casinoFinish(s,r,casinoRouletteHits(pick.pick,n)?amount*pick.gross:0,
   'Wheel result '+(n===37?'00':n)+(n===0||n===37?' (green)':CASINO_RED.has(n)?' (red)':' (black)')+'.');
 }
 if(key==='slots'){
  const reels=Array.from({length:3},()=>casinoWeighted(CASINO_REELS.map(x=>x[1])));
  const multiplier=reels.every(n=>n===reels[0])?CASINO_SLOT_PAY[terms.slots][reels[0]]:
   reels.filter(n=>n===0).length===2?1:0;
  return casinoFinish(s,r,amount*multiplier,reels.map(n=>CASINO_REELS[n][0]).join(' · ')+'.');
 }
 if(key==='keno'){
  const drawn=casinoShuffle(Array.from({length:80},(_,i)=>i+1)).slice(0,20).sort((a,b)=>a-b);
  const hits=selection.filter(n=>drawn.includes(n)).length;
  return casinoFinish(s,r,amount*CASINO_KENO_PAY[hits],hits+' matches. Drawn numbers '+drawn.join(', ')+'.');
 }
 if(key==='dice'){
  const dice=[R(1,6),R(1,6)],total=dice[0]+dice[1],win=choice==='under'?total<7:total>7;
  return casinoFinish(s,r,win?amount*2:0,'Dice '+dice.join(' and ')+' · total '+total+'.');
 }
 if(key==='horse'){
  const entrants=casinoBoard(s).horse,pool=[...entrants],finish=[];
  while(pool.length)finish.push(pool.splice(casinoWeighted(pool.map(h=>h.weight)),1)[0].name);
  const horse=entrants[selection],odds=casinoHorseOdds(entrants,horse);
  return casinoFinish(s,r,finish[0]===horse.name?amount*odds:0,'Race order · '+finish.join(', ')+'.');
 }
 const match=casinoBoard(s).sports[selection],odds=casinoSportsOptions(match).find(o=>o.key===choice).odds;
 const a=match.a+R(0,16),b=match.b+R(0,16),moneyline=['home','away'].includes(choice);
 const result=moneyline?(a>b?'home':'away'):a+b>match.a+match.b+16?'over':'under';
 const payout=moneyline&&a===b?amount:result===choice?amount*odds:0;
 return casinoFinish(s,r,payout,match.home+' '+a+'–'+b+' '+match.away+(moneyline&&a===b?' · tie refunded.':'.'));
}
const casinoHorseOdds=(horses,horse)=>Math.floor(.85/(horse.weight/horses.reduce((sum,x)=>sum+x.weight,0))*100)/100;
function casinoBetTerms(s,game,terms,choice,selection){
 if(game==='roulette')return casinoRoulettePick(choice,terms.wheel,selection)?.gross;
 if(game==='slots')return Math.max(...CASINO_SLOT_PAY[terms.slots]);
 if(game==='keno')return Array.isArray(selection)&&selection.length===3&&new Set(selection).size===3&&
  selection.every(n=>Number.isInteger(n)&&n>=1&&n<=80)?CASINO_KENO_PAY[3]:0;
 if(game==='dice')return ['over','under'].includes(choice)?2:0;
 if(game==='horse'){
  const horses=casinoBoard(s).horse;
  return horses[selection]?casinoHorseOdds(horses,horses[selection]):0;
 }
 if(game==='sports'){
  const match=casinoBoard(s).sports[selection],option=match&&casinoSportsOptions(match).find(x=>x.key===choice);
  return option?.odds>=1.01?option.odds:0;
 }
 if(game==='blackjack')return terms.blackjack==='three'?2.5:2.2;
 return 2;
}
function casinoStart(game,venue,stake,choice,selection){
 if(!casinoCanGamble())return 'Casino games unlock at age '+casinoEnterAge()+' here.';
 if(!Object.hasOwn(CASINO_GAMES,game))return 'This game is unavailable.';
 const s=casinoState(),v=venue?casinoOwns(venue):null,terms=casinoTerms(venue);
 casinoSeason(s);
 if(venue&&(!v||!casinoAvailable(v.casino,game)))return 'This gaming floor or game is closed.';
 if(s.round)return 'Finish the game already in progress.';
 if(s.paused>g.age)return 'Your gambling break runs until next Age Up.';
 if(!Number.isSafeInteger(stake)||stake<terms.min)return 'The table minimum is '+loc(terms.min)+'.';
 const multiple=casinoBetTerms(s,game,terms,choice,selection);
 if(!multiple)return 'Choose a valid bet or selection first.';
 const failure=casinoDebit(s,stake,venue,multiple,terms.max);
 if(failure)return failure;
 s.result=null;
 const r={id:++s.serial,game,venue:venue||null,terms,stake,original:stake};
 if(!['blackjack','draw','holdem'].includes(game))return casinoFixedPlay(s,game,r,choice,selection);
 r.deck=casinoDeck();
 s.round=r;
 if(game==='blackjack'){
  const first=[r.deck.pop(),r.deck.pop()];
  r.hands=[{cards:first,stake,done:false}];r.hand=0;r.dealer=[r.deck.pop(),r.deck.pop()];
  const player=casinoBlackjackScore(first).total===21,house=casinoBlackjackScore(r.dealer).total===21;
  if(player||house)return casinoFinish(s,r,player&&house?stake:player?stake*multiple:0,
   'Your hand '+first.map(casinoCard).join(' ')+' · Dealer '+r.dealer.map(casinoCard).join(' ')+'.');
 }else{
  const n=game==='draw'?5:2;
  r.player=r.deck.splice(0,n);r.opponent=r.deck.splice(0,n);
  if(game==='holdem'){r.board=[];r.street=0;r.raise=false;}
 }
 return '';
}
function casinoBlackjackEnd(s,r){
 const dealer=r.dealer;
 const eligible=r.hands.some(h=>casinoBlackjackScore(h.cards).total<=21);
 let score=casinoBlackjackScore(dealer);
 while(eligible&&(score.total<17||score.total===17&&score.soft&&r.terms.soft==='hit')){
  dealer.push(r.deck.pop());score=casinoBlackjackScore(dealer);
 }
 let payout=0;
 const hands=r.hands.map(h=>{
  const value=casinoBlackjackScore(h.cards).total;
  const result=value>21?'bust':score.total>21||value>score.total?'win':value===score.total?'push':'loss';
  payout+=result==='win'?2*h.stake:result==='push'?h.stake:0;
  return value+' ('+result+')';
 });
 return casinoFinish(s,r,payout,'Your totals '+hands.join(', ')+' · Dealer '+dealer.map(casinoCard).join(' ')+' = '+score.total+'.');
}
function casinoBlackjackMove(s,r,action){
 const hand=r.hands[r.hand],cards=hand.cards;
 if(action==='split'){
  if(r.hands.length!==1||cards.length!==2||casinoRank(cards[0])!==casinoRank(cards[1]))return 'You can split one matching pair per round.';
  const failure=casinoAdditional(s,r,hand.stake,2);
  if(failure)return failure;
  const pair=cards.pop(),aces=casinoRank(pair)===14;
  cards.push(r.deck.pop());r.hands.push({cards:[pair,r.deck.pop()],stake:hand.stake,done:aces});
  hand.done=aces;
 }else if(action==='double'){
  if(cards.length!==2)return 'Double down is available only on the first two cards of an active hand.';
  const failure=casinoAdditional(s,r,hand.stake,2);
  if(failure)return failure;
  hand.stake*=2;cards.push(r.deck.pop());hand.done=true;
 }else if(action==='hit'){
  cards.push(r.deck.pop());
  hand.done=casinoBlackjackScore(cards).total>=21;
 }else if(action==='stand')hand.done=true;
 else return 'Choose a blackjack action.';
 if(r.hands.every(h=>h.done))return casinoBlackjackEnd(s,r);
 r.hand=r.hands.findIndex(h=>!h.done);
 return '';
}
function casinoPokerResult(s,r,player,opponent,detail){
 const comparison=casinoCompare(player,opponent),profit=r.stake-Math.floor(r.stake*r.terms.rake/100);
 return casinoFinish(s,r,comparison>0?r.stake+profit:comparison===0?r.stake:0,detail);
}
function casinoDrawMove(s,r,action,discard){
 if(action==='fold')return casinoFinish(s,r,0,'You folded before the draw.');
 if(action!=='draw'||!Array.isArray(discard)||discard.length>3||new Set(discard).size!==discard.length||
  discard.some(i=>!Number.isInteger(i)||i<0||i>4))return 'Choose up to three cards to replace.';
 for(const index of discard)r.player[index]=r.deck.pop();
 for(const index of casinoOpponentDraw(r.opponent))r.opponent[index]=r.deck.pop();
 const player=casinoPokerScore(r.player),opponent=casinoPokerScore(r.opponent);
 const detail='You '+r.player.map(casinoCard).join(' ')+' ('+CASINO_HAND_NAMES[player[0]]+') · Opponent '+
  r.opponent.map(casinoCard).join(' ')+' ('+CASINO_HAND_NAMES[opponent[0]]+').';
 return casinoPokerResult(s,r,player,opponent,detail);
}
function casinoHoldemMove(s,r,action){
 if(action==='fold')return casinoFinish(s,r,0,'You folded on '+['the opening round','the flop','the turn','the river'][r.street]+'.');
 if(action==='raise'){
  if(r.raise)return 'Only one raise is available each street.';
  const extra=r.original*(r.street>=2?2:1),failure=casinoAdditional(s,r,extra,2);
  if(failure)return failure;
  r.raise=true;
  const strength=r.street?casinoBest([...r.opponent,...r.board])[0]:casinoRank(r.opponent[0])===casinoRank(r.opponent[1])?2:0;
  if(ch(strength<=0?36:strength===1?16:5)){
   r.stake-=extra;g.cash+=extra;
   return casinoPokerResult(s,r,[1],[0],'Your opponent folded. Your unmatched raise was returned.');
  }
 }else if(action!=='check')return 'Choose check, raise, or fold.';
 if(r.street===3){
  const player=casinoBest([...r.player,...r.board]),opponent=casinoBest([...r.opponent,...r.board]);
  return casinoPokerResult(s,r,player,opponent,'Board '+r.board.map(casinoCard).join(' ')+' · Your '+CASINO_HAND_NAMES[player[0]]+
   ' · Opponent '+r.opponent.map(casinoCard).join(' ')+' ('+CASINO_HAND_NAMES[opponent[0]]+').');
 }
 r.deck.pop();
 r.board.push(...r.deck.splice(0,r.street===0?3:1));r.street++;r.raise=false;
 return '';
}
function casinoMove(action,discard){
 const s=casinoState(),r=s.round;
 if(!casinoCanGamble()||!r)return 'There is no active hand.';
 if(r.game==='blackjack')return casinoBlackjackMove(s,r,action);
 if(r.game==='draw')return casinoDrawMove(s,r,action,discard);
 return casinoHoldemMove(s,r,action);
}
function casinoEvent(key,v=null){
 const s=casinoState(),venue=v?.casino.id??null;
 if(!Object.hasOwn(CASINO_BUSINESS_EVENTS,key)||s.events.some(e=>!e.closed&&e.key===key&&e.venue===venue))return;
 const [title,body,choices]=CASINO_BUSINESS_EVENTS[key];
 const event={id:++s.serial,key,venue,age:g.age,closed:false,article:null};
 s.events.push(event);
 if(s.events.length>45){
  const oldest=s.events.findIndex(e=>e.closed||e.venue&&!casinoOwns(e.venue));
  if(oldest>=0)s.events.splice(oldest,1);
 }
 if(v)event.article=casinoPress(v,title,v.n+'. '+body,event);
 (g.stuffEventQueue??=[]).push({x:uiEscape(title+'. '+body),c:choices.map(([label],i)=>[uiEscape(label),
  {casinoEvent:{id:event.id,choice:i}},'You made a casino decision.'])});
}
function casinoCheckSupport(s){
 if(s.noticeAge===g.age)return;
 s.noticeAge=g.age;
 casinoEvent('support');
}
function casinoEventReady(e){
 return !!e&&!e.closed&&(e.venue?casinoCanOwn()&&!!casinoOwns(e.venue):casinoCanGamble());
}
function casinoRespond(e,index){
 const choice=e&&CASINO_BUSINESS_EVENTS[e.key][2][index];
 if(!casinoEventReady(e)||!choice)return {done:false,text:'This decision is unavailable.'};
 const [label,base,reputation,action]=choice,s=casinoState(),v=casinoOwns(e.venue);
 if(v){
  const c=v.casino,cost=casinoCurrency(c,base);
  if(!casinoSpend(c,cost))return {done:false,text:'Casino funds cannot cover '+loc(cost)+'. Choose another response.'};
  if(action==='limits')c.max=Math.max(c.min,Math.min(c.max,Math.floor(c.cash/40)));
  if(action==='close')c.closed=g.age+1;
  if(action==='marketing')c.marketing=1;
  if(action==='early')c.early=1;
  if(action==='amenity')c.property+=Math.round(cost*.5);
  if(action==='audit')c.closed=g.age;
  c.rep=casinoScore(c.rep+reputation);
 }else{
  if(action==='pause')s.paused=g.age+1;
  if(action==='budget')s.budget=Math.min(s.budget||Infinity,pr(2500));
 }
 e.closed=true;
 const news=g.news,story=[...(news?.editions||[]).flatMap(d=>d.articles),...(news?.queued||[]).map(q=>q.article)].find(a=>a.id===e.article);
 if(story)story.resolved=true;
 L(uiEscape(label)+'.');
 return {done:true,text:label+(v?' · Casino reputation '+v.casino.rep+'/100.':'.')};
}
const casinoNewsEvent=article=>g.casinoPlay?.events.find(e=>e.id===article.brief?.ref&&e.article===article.id);
function casinoNewsOptions(article){
 const e=casinoNewsEvent(article),v=casinoOwns(e?.venue);
 return e?CASINO_BUSINESS_EVENTS[e.key][2].map(([label,cost],i)=>
  [label+(cost&&v?' · '+loc(casinoCurrency(v.casino,cost)):''),'brief'+i]):[];
}
function casinoValidate(life){
 const s=life.casinoPlay,object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const int=x=>Number.isSafeInteger(x)&&x>=0,signed=Number.isSafeInteger,text=x=>typeof x==='string'&&x.length>0;
 const known=(rows,k)=>typeof k==='string'&&Object.hasOwn(rows,k);
 const list=(x,allowed)=>Array.isArray(x)&&new Set(x).size===x.length&&x.every(k=>known(allowed,k));
 const rules=x=>object(x)&&['single','double'].includes(x.wheel)&&['stand','hit'].includes(x.soft)&&
  ['three','six'].includes(x.blackjack)&&known(CASINO_SLOT_PAY,x.slots)&&[2,4,6,8].includes(x.rake);
 const limits=x=>int(x.min)&&x.min>=1&&int(x.max)&&x.max>=x.min;
 const id=x=>typeof x==='string'&&/^life-[a-z0-9-]+$/.test(x);
 const owned=(life.vent||[]).filter(v=>v.t==='cas'&&v.casino!=null);
 for(const {casino:c} of owned){
  if(!object(c)||!id(c.id)||!known(life.w,c.country)||!int(c.level)||c.level>3||!rules(c.rules)||!limits(c)||
   !Number.isFinite(c.scale)||c.scale<=0||c.scale>10||![c.cash,c.property,c.lastAge,c.closed,c.marketing,c.early].every(int)||
   !int(c.rep)||c.rep>100||!int(c.security)||c.security>c.level+2||!signed(c.liveNet)||
   !object(c.used)||!Object.values(c.used).every(int)||c.report!=null&&(!object(c.report)||!Object.entries(c.report).every(([k,n])=>k==='table'?signed(n):int(n)))||
   !list(c.games,CASINO_GAMES)||!c.games.length||c.games.length>CASINO_LEVELS[c.level][3]||c.games.some(k=>CASINO_GAMES[k][1]>c.level)||
   !list(c.amenities,CASINO_AMENITIES)||c.amenities.length>c.level*2||c.amenities.some(k=>CASINO_AMENITIES[k][1]>c.level)||
   !list(c.performers,CASINO_PERFORMERS)||c.performers.length>c.level||c.performers.some(k=>
    CASINO_PERFORMERS[k][1]>c.level||CASINO_PERFORMERS[k][2]&&!c.amenities.includes(CASINO_PERFORMERS[k][2])))throw Error('Invalid casino property.');
 }
 const ids=owned.map(v=>v.casino.id);
 if(new Set(ids).size!==ids.length)throw Error('Duplicate casino property.');
 if(s==null)return;
 const result=x=>object(x)&&int(x.id)&&x.id<=s.serial&&known(CASINO_GAMES,x.game)&&
  (x.venue===null||id(x.venue))&&int(x.age)&&int(x.stake)&&int(x.returned)&&signed(x.net)&&x.returned-x.stake===x.net&&text(x.summary);
 if(!object(s)||s.version!==1||![s.serial,s.paused,s.budget,s.netAge].every(int)||!signed(s.net)||!object(s.stats)||
  s.noticeAge!==null&&!int(s.noticeAge)||s.fixtureAge!==null&&!int(s.fixtureAge)||
  !Array.isArray(s.history)||s.history.length>40||s.history.some(x=>!result(x))||s.result!==null&&!result(s.result)||
  !Array.isArray(s.events)||s.events.some(e=>!object(e)||!int(e.id)||e.id>s.serial||!known(CASINO_BUSINESS_EVENTS,e.key)||
   !int(e.age)||typeof e.closed!=='boolean'||e.venue!==null&&!id(e.venue)||e.article!==null&&!/^brief-\d+$/.test(e.article))||
  Object.entries(s.stats).some(([k,x])=>!known(CASINO_GAMES,k)||!object(x)||![x.won,x.lost,x.push].every(int)||!signed(x.net)))
  throw Error('Invalid casino play record.');
 if(s.fixtures!=null){
  const f=s.fixtures;
  if(!object(f)||!Array.isArray(f.horse)||f.horse.length!==6||f.horse.some(h=>!CASINO_HORSES.includes(h?.name)||!int(h.weight)||!h.weight)||
   !Array.isArray(f.sports)||f.sports.length!==3||f.sports.some(m=>![m?.home,m?.away].every(n=>CASINO_TEAMS.includes(n))||
    ![m.a,m.b].every(n=>int(n)&&n>=63&&n<=87)))throw Error('Invalid casino fixtures.');
 }
 if(s.round==null)return;
 const r=s.round,cards=a=>Array.isArray(a)&&a.every(x=>int(x)&&x<52);
 if(!object(r)||!int(r.id)||r.id>s.serial||!['blackjack','draw','holdem'].includes(r.game)||
  r.venue!==null&&!ids.includes(r.venue)||!int(r.stake)||!int(r.original)||r.original<1||r.stake<r.original||
  !rules(r.terms)||!limits(r.terms)||!cards(r.deck))throw Error('Invalid active casino round.');
 let exposed;
 if(r.game==='blackjack'){
  if(!cards(r.dealer)||r.dealer.length!==2||!Array.isArray(r.hands)||!r.hands.length||r.hands.length>2||
   !int(r.hand)||r.hand>=r.hands.length||r.hands.some(h=>!object(h)||!cards(h.cards)||h.cards.length<2||!int(h.stake)||typeof h.done!=='boolean')||
   r.hands[r.hand].done||r.hands.reduce((n,h)=>n+h.stake,0)!==r.stake)throw Error('Invalid blackjack hand.');
  exposed=[...r.dealer,...r.hands.flatMap(h=>h.cards)];
 }else{
  const size=r.game==='draw'?5:2;
  if(!cards(r.player)||r.player.length!==size||!cards(r.opponent)||r.opponent.length!==size)throw Error('Invalid poker hand.');
  exposed=[...r.player,...r.opponent];
  if(r.game==='holdem'){
   if(!int(r.street)||r.street>3||!cards(r.board)||r.board.length!==[0,3,4,5][r.street]||typeof r.raise!=='boolean')
    throw Error('Invalid poker board.');
   exposed.push(...r.board);
  }
 }
 const all=[...r.deck,...exposed];
 if(new Set(all).size!==all.length||r.deck.length<20)throw Error('Invalid casino deck.');
}
