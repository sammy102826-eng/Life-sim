const CASINO_GAMES={
 blackjack:['Blackjack',0,0], draw:['Five-card draw poker',0,2300], holdem:['Texas Hold’em',0,3500],
 roulette:['Roulette',1,24000], slots:['Slots',1,18000], horse:['Horse racing',2,68000],
 sports:['Sports betting',2,85000], keno:['Keno',1,14000], dice:['Dice · over or under seven',0,1600]
};
const CASINO_RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const CASINO_REELS=[['Cherry',40],['Lemon',28],['Bell',18],['Bar',10],['Seven',4]];
const CASINO_SLOT_PAY={standard:[4,8,20,65,400],jackpot:[3,8,20,65,1400]};
const CASINO_KENO_PAY=[0,0,3,35];
const CASINO_SUIT=['♣','♦','♥','♠'];
const CASINO_RANK=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const casinoRank=card=>card%13+2;
const casinoCard=card=>CASINO_RANK[card%13]+CASINO_SUIT[Math.floor(card/13)];
function casinoShuffle(items){
 const shuffled=[...items];
 for(let i=shuffled.length-1;i>0;i--){
  const k=Math.floor(Math.random()*(i+1));
  [shuffled[i],shuffled[k]]=[shuffled[k],shuffled[i]];
 }
 return shuffled;
}
const casinoDeck=()=>casinoShuffle(Array.from({length:52},(_,i)=>i));
function casinoWeighted(weights){
 let draw=Math.random()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<weights.length-1;i++){
  draw-=weights[i];
  if(draw<0)return i;
 }
 return weights.length-1;
}
function casinoChoose(n,k){
 if(k<0||k>n)return 0;
 let value=1;
 for(let i=1;i<=k;i++)value=value*(n-i+1)/i;
 return value;
}
function casinoKenoChance(hits){
 return casinoChoose(20,hits)*casinoChoose(60,3-hits)/casinoChoose(80,3);
}
const casinoSlotChance=()=>CASINO_REELS.reduce((sum,[,weight])=>sum+(weight/100)**3,0)+3*.4**2*.6;
function casinoSlotReturn(rule){
 return CASINO_REELS.reduce((sum,[,weight],i)=>sum+(weight/100)**3*CASINO_SLOT_PAY[rule][i],0)+3*.4**2*.6;
}
function casinoBlackjackScore(cards){
 // Treat all aces as ones first, then raise one ace if the hand can absorb it.
 const total=cards.reduce((sum,card)=>sum+(casinoRank(card)===14?1:Math.min(10,casinoRank(card))),0);
 const soft=total<=11&&cards.some(card=>casinoRank(card)===14);
 return {total:total+(soft?10:0),soft};
}
function casinoPokerScore(cards){
 const ranks=cards.map(casinoRank).sort((a,b)=>b-a),groups={};
 for(const rank of ranks)groups[rank]=(groups[rank]||0)+1;
 const byCount=Object.keys(groups).map(Number).sort((a,b)=>groups[b]-groups[a]||b-a);
 const flush=cards.every(c=>Math.floor(c/13)===Math.floor(cards[0]/13));
 const straight=new Set(ranks).size===5&&ranks[0]-ranks[4]===4?ranks[0]:
  ranks.join(',')==='14,5,4,3,2'?5:0;
 if(flush&&straight)return [8,straight];
 if(groups[byCount[0]]===4)return [7,...byCount];
 if(groups[byCount[0]]===3&&groups[byCount[1]]===2)return [6,...byCount];
 if(flush)return [5,...ranks];
 if(straight)return [4,straight];
 if(groups[byCount[0]]===3)return [3,...byCount];
 if(groups[byCount[0]]===2)return [groups[byCount[1]]===2?2:1,...byCount];
 return [0,...ranks];
}
function casinoCompare(a,b){
 for(let i=0;i<Math.max(a.length,b.length);i++){
  const delta=(a[i]||0)-(b[i]||0);
  if(delta)return Math.sign(delta);
 }
 return 0;
}
function casinoBest(cards){
 let best=[-1];
 for(let a=0;a<cards.length-4;a++)for(let b=a+1;b<cards.length-3;b++)
  for(let c=b+1;c<cards.length-2;c++)for(let d=c+1;d<cards.length-1;d++)for(let e=d+1;e<cards.length;e++){
   const score=casinoPokerScore([cards[a],cards[b],cards[c],cards[d],cards[e]]);
   if(casinoCompare(score,best)>0)best=score;
  }
 return best;
}
const CASINO_HAND_NAMES=['High card','One pair','Two pair','Three of a kind','Straight','Flush','Full house','Four of a kind','Straight flush'];
function casinoOpponentDraw(cards){
 const score=casinoPokerScore(cards);
 if(score[0]>=4)return [];
 const ranks=cards.map(casinoRank),single=i=>ranks.filter(n=>n===ranks[i]).length===1;
 const loose=cards.map((_,i)=>i).filter(single).sort((a,b)=>ranks[a]-ranks[b]);
 return loose.slice(0,3);
}
const CASINO_HORSES=['Copper Comet','Harbor Wind','Golden Orchard','Sunday Tide','Northern Post','Valley King'];
const CASINO_TEAMS=['Harbor Foxes','Valley Owls','Coastal Gulls','City Rams','Union Bears','North Stars'];
function casinoFixtures(){
 return {
  horse:casinoShuffle(CASINO_HORSES).map((name,i)=>({name,weight:R(5,12)+i*3})),
  sports:Array.from({length:3},(_,i)=>({home:CASINO_TEAMS[2*i],away:CASINO_TEAMS[2*i+1],a:R(63,87),b:R(63,87)}))
 };
}
function casinoSportsOptions(match){
 const counts={home:0,away:0,over:0,under:0};
 let pushes=0;
 for(let x=0;x<=16;x++)for(let y=0;y<=16;y++){
  const a=match.a+x,b=match.b+y;
  if(a===b)pushes++;
  else counts[a>b?'home':'away']++;
  counts[a+b>(match.a+match.b+16)?'over':'under']++;
 }
 return Object.entries(counts).map(([key,ways])=>{
  const moneyline=key==='home'||key==='away',push=moneyline?pushes/289:0;
  return {key,prob:ways/289,push,odds:ways?Math.floor((1-push)*.95/(ways/289)*100)/100:0};
 });
}
function casinoRoulettePick(choice,rule,number){
 const digits=/^(?:[0-9]|[12][0-9]|3[0-6])$/;
 if(choice==='straight'&&digits.test(String(number)))return {pick:Number(number),ways:1,gross:36};
 if(choice==='red'||choice==='black'||choice==='odd'||choice==='even'||choice==='low'||choice==='high')
  return {pick:choice,ways:18,gross:2};
 if(['first','second','third'].includes(choice))return {pick:choice,ways:12,gross:3};
 if(rule==='double'&&choice==='straight'&&String(number)==='00')return {pick:37,ways:1,gross:36};
 return null;
}
function casinoRouletteHits(pick,n){
 if(typeof pick==='number')return n===pick;
 if(n===0||n===37)return false;
 switch(pick){
  case 'red':return CASINO_RED.has(n);
  case 'black':return !CASINO_RED.has(n);
  case 'even':return n%2===0;
  case 'odd':return n%2===1;
  case 'low':return n<=18;
  case 'high':return n>=19;
  case 'first':return n<=12;
  case 'second':return n>=13&&n<=24;
  default:return n>=25;
 }
}
const casinoPct=n=>(100*n).toFixed(2)+'%';
function casinoBustChance(round){
 const exposed=[round.dealer[0],...round.hands.flatMap(h=>h.cards)];
 const unseen=Array.from({length:52},(_,i)=>i).filter(c=>!exposed.includes(c));
 const cards=round.hands[round.hand].cards;
 const hiddenOptions=unseen.filter(c=>casinoBlackjackScore([round.dealer[0],c]).total!==21);
 const busted=unseen.filter(c=>casinoBlackjackScore([...cards,c]).total>21);
 const hiddenBusts=hiddenOptions.filter(c=>busted.includes(c)).length;
 // The opening dealer check ruled out blackjack, so exclude those hole cards.
 return (busted.length-hiddenBusts/hiddenOptions.length)/(unseen.length-1);
}
function casinoPokerEstimate(round,discard){
 const draw=round.game==='draw';
 if(draw&&(!Array.isArray(discard)||discard.length>3||new Set(discard).size!==discard.length||
   discard.some(i=>!Number.isInteger(i)||i<0||i>4)))return null;
 const board=round.board||[],known=[...round.player,...board];
 const unseen=Array.from({length:52},(_,i)=>i).filter(c=>!known.includes(c));
 let seed=[...known,...(draw?discard:[])].reduce((acc,x)=>Math.imul(acc^x,16777619)>>>0,2166136261);
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const trials=300,counts={win:0,push:0,loss:0};
 for(let trial=0;trial<trials;trial++){
  const sample=[...unseen],take=draw?8+discard.length:7-board.length;
  for(let i=0;i<take;i++){
   const j=i+Math.floor(random()*(sample.length-i));
   [sample[i],sample[j]]=[sample[j],sample[i]];
  }
  let player,other;
  if(draw){
   const p=[...round.player],opponent=sample.slice(0,5);
   discard.forEach((index,i)=>{p[index]=sample[5+i];});
   casinoOpponentDraw(opponent).forEach((index,i)=>{opponent[index]=sample[5+discard.length+i];});
   player=casinoPokerScore(p);other=casinoPokerScore(opponent);
  }else{
   const community=[...board,...sample.slice(2,take)];
   player=casinoBest([...round.player,...community]);
   other=casinoBest([...sample.slice(0,2),...community]);
  }
  const comparison=casinoCompare(player,other);
  counts[comparison>0?'win':comparison<0?'loss':'push']++;
 }
 return {win:counts.win/trials,push:counts.push/trials,loss:counts.loss/trials};
}
