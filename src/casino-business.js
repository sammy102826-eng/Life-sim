const CASINO_LEVELS=[
 ['House game',4500,1500,3,1400,1200],['Gaming lounge',38000,22000,5,18500,32000],
 ['Licensed casino',365000,160000,8,130000,285000],['Casino resort',1850000,680000,9,525000,1690000]
];
const CASINO_AMENITIES={
 counter:['Snack counter',1,18000,9000,2], bar:['Licensed bar',1,36000,17000,3],
 restaurant:['Restaurant',2,125000,70000,7], stage:['Showroom',2,185000,58000,8],
 nightclub:['Nightclub',3,460000,180000,10], hotel:['Hotel',3,900000,290000,13]
};
const CASINO_PERFORMERS={
 acoustic:['Acoustic musician',1,'',6000,3], standup:['Stand-up comic',1,'',11000,4],
 residency:['Resident band',2,'stage',29000,11], cabaret:['Cabaret ensemble',2,'stage',42000,14],
 dj:['Resident DJ',3,'nightclub',74000,21], headliner:['Headlining residency',3,'stage',160000,30]
};
const CASINO_BUSINESS_EVENTS={
 audit:['Casino faces a reserve audit','The licensing board wants proof that posted prizes are backed by cash.',[
  ['Commission an independent audit',3500,8,'audit'],['Lower maximum wagers and submit records',0,4,'limits'],['Suspend wagering while the board reviews the books',0,-2,'close']]],
 jackpot:['Jackpot puts a gaming floor in the spotlight','A highly publicized payout is testing how the casino communicates its rules.',[
  ['Publish the audited payout records',1800,7,'audit'],['Give local reporters a tour',1200,5,'marketing'],['Keep the winner’s identity private',0,2,'none']]],
 cheating:['Officials investigate irregular play','Players want a fair investigation and a clear explanation of table procedures.',[
  ['Hire an independent investigator',4800,8,'audit'],['Offer a supervised review of the disputed hands',1800,4,'audit'],['Close the affected tables for the season',0,-3,'close']]],
 noise:['Neighbors object to late-night noise','Local residents ask the casino to reduce noise from evening shows.',[
  ['Install acoustic treatment',12000,9,'amenity'],['Move performances to earlier hours',0,4,'early'],['Keep the existing hours',0,-6,'none']]],
 artist:['A headliner cancels before opening night','Ticket holders are waiting to hear whether the casino will offer a replacement or refund.',[
  ['Book a replacement act',6000,5,'marketing'],['Issue refunds and postpone the event',3200,3,'early'],['Cancel the show and close bookings',0,-5,'early']]],
 support:['A counselor offers a gambling support plan','Recent gambling losses have affected your character’s finances. You can choose a break or set a limit.',[
  ['Take a break until next year',0,0,'pause'],['Set a lower seasonal loss limit',0,0,'budget'],['Review your records without changing limits',0,0,'none']]]
};
const casinoScore=n=>Math.round(cl(n,0,100));
const casinoCurrency=(c,n)=>Math.max(n>0?1:0,Math.round(n*c.scale));
function casinoLegacyValue(v){
 const level=cl(v.lvl||0,0,2);
 return [5e6,4e7,3e8][level]+(v.games?.length||0)*pr(100000);
}
function casinoBusinessState(v){
 if(v.casino)return v.casino;
 const level=cl((v.lvl||0)+1,1,3);
 const base=pr(10000)/10000, mapped={Slots:'slots',Blackjack:'blackjack','Poker room':'draw',Roulette:'roulette',Craps:'dice'};
 const games=[...new Set((v.games||[]).map(n=>mapped[n]).filter(Boolean))];
 const reserve=Math.round(CASINO_LEVELS[level][2]*base);
 const maximum=Math.max(2,Math.min(Math.round((v.maxb||200)*base),Math.round([500,2500,10000,50000][level]*base)));
 return v.casino={id:genIdentity(),country:g.country,level,scale:base,cash:reserve,
  property:Math.max(0,casinoLegacyValue(v)-reserve),rep:casinoScore(v.rep??45),games:games.length?games:['slots'],
  min:cl(Math.round((v.minb||5)*base),1,maximum),max:maximum,
  security:cl(v.sec||0,0,level+2),rules:{wheel:'single',soft:'stand',blackjack:'three',slots:'standard',rake:4},
  amenities:[],performers:[],lastAge:g.age,report:null,closed:0,marketing:0,early:0,used:{},liveNet:0};
}
const casinoOwns=id=>typeof id==='string'?g.vent.find(v=>v.t==='cas'&&v.casino?.id===id):null;
const casinoEnterAge=()=>g.country==='United States'?21:18;
const casinoCanGamble=()=>g.alive&&!g.jail&&g.age>=casinoEnterAge();
const casinoCanOwn=()=>g.alive&&!g.jail&&g.age>=21&&!royalRestricted();
const casinoBusinessValue=v=>{const c=v.casino;return c?c.property+c.cash:casinoLegacyValue(v);};
const casinoAvailable=(c,key)=>c.games.includes(key)&&c.closed<=g.age;
function casinoCommittedReserve(c){
 const current=g.casinoPlay?.round;
 // Every saved card hand has a maximum remaining profit equal to its total stake.
 return current?.venue===c.id?current.stake:0;
}
const casinoSpend=(c,cost)=>c.cash-cost>=casinoCommittedReserve(c)?(c.cash-=cost,true):false;
function casinoCreate(name){
 if(!casinoCanOwn())return 'An eligible adult of 21 or older is required to operate a casino.';
 if(g.vent.some(v=>v.t==='cas'))return 'You already own a casino.';
 if(typeof name!=='string'||!name.trim()||name.trim().length>48||/[<>]/.test(name))return 'Enter a casino name of up to 48 characters.';
 const cost=pr(CASINO_LEVELS[0][1]);
 if(g.cash<cost)return 'Opening a house game costs '+loc(cost)+'.';
 const v={t:'cas',n:name.trim(),own:100,lvl:-1,games:['Blackjack']},c=casinoBusinessState(v);
 Object.assign(c,{level:0,games:['blackjack'],cash:pr(CASINO_LEVELS[0][2]),property:pr(CASINO_LEVELS[0][5]),
  min:Math.max(1,pr(5)),max:Math.max(2,pr(100))});
 g.cash-=cost;LD('Casino startup',-cost);g.vent.push(v);
 L('You opened '+uiEscape(v.n)+' as a house game.');
 return '';
}
function casinoPress(v,title,text,event=null){
 return newsPublish('business',title,text,event?{type:'casinoEvent',ref:event.id}:null);
}
function casinoAnnual(v,quiet=false){
 const c=casinoBusinessState(v);
 if(c.lastAge>=g.age)return;
 c.lastAge=g.age;
 const level=CASINO_LEVELS[c.level],country=g.w[c.country];
 const audience=c.performers.reduce((sum,k)=>sum+CASINO_PERFORMERS[k][4],0);
 const visitors=Math.max(0,Math.round(level[4]*(.55+c.rep/100+audience/100+c.marketing*.3)*(country?.n.E||55)/65*
  (.80+.13*c.games.length)*(c.closed>g.age?.15:c.early?.80:1)*R(86,115)/100));
 const holds={blackjack:c.rules.blackjack==='three'?.018:.032,roulette:c.rules.wheel==='single'?1/37:2/38,
  slots:1-casinoSlotReturn(c.rules.slots),draw:c.rules.rake/100,holdem:c.rules.rake/100,horse:.15,sports:.05,keno:1-CASINO_KENO_PAY.reduce((n,payout,i)=>n+payout*casinoKenoChance(i),0),dice:1/6};
 const gameHold=c.games.reduce((sum,k)=>sum+holds[k],0)/c.games.length;
 const turnover=visitors*(c.min+Math.min(c.max,c.min*12))*.5*(3+c.level*2);
 const gaming=Math.round(turnover*gameHold),amenities=c.amenities.reduce((sum,k)=>sum+casinoCurrency(c,CASINO_AMENITIES[k][4])*visitors,0);
 const expenses=casinoCurrency(c,level[5]*.045+c.security*[9000,24000,44000,62000][c.level]+c.games.length*[250,1700,10500,36000][c.level]+
  c.amenities.reduce((sum,k)=>sum+CASINO_AMENITIES[k][3],0)+c.performers.reduce((sum,k)=>sum+CASINO_PERFORMERS[k][3],0));
 const taxes=Math.round(Math.max(0,gaming+amenities+c.liveNet-expenses)*finEnterpriseRate(c.country,8,36)/100);
 const net=gaming+amenities-expenses-taxes,shortfall=Math.max(0,-(c.cash+net));
 c.report={age:g.age,visitors,gaming,amenities,expenses,taxes,shortfall,table:c.liveNet};
 c.cash=Math.max(0,c.cash+net);c.liveNet=0;
 if(shortfall){
  c.closed=g.age+1;c.rep=casinoScore(c.rep-9);
  L(uiEscape(v.n)+' suspended tables after a reserve shortfall of '+loc(shortfall)+'.');
  if(!quiet)casinoPress(v,'Casino temporarily suspends wagers',v.n+' is rebuilding its operating reserve.');
 }else c.rep=casinoScore(c.rep+(c.security?1:0)+(c.performers.length?1:0));
 c.marketing=0;c.early=0;
 if(!quiet&&c.level>=1&&ch(43)){
  const pool=c.performers.length?['audit','jackpot','cheating','noise','artist']:['audit','jackpot','cheating'];
  casinoEvent(P(pool),v);
 }
}
function casinoManage(v,action,key,amount){
 if(!casinoCanOwn()||!v||v.t!=='cas'||!g.vent.includes(v))return 'The casino is unavailable.';
 const c=casinoBusinessState(v),round=g.casinoPlay?.round;
 if(action==='transfer'||action==='withdraw'){
  if(!Number.isSafeInteger(amount)||amount<=0)return 'Enter a positive transfer amount.';
  if(action==='transfer'){
   if(g.cash<amount)return 'Personal cash cannot cover that transfer.';
   g.cash-=amount;c.cash+=amount;LD('Casino capital investment',-amount);
  }else{
   if(round?.venue===c.id||c.cash-amount<Math.max(casinoCurrency(c,CASINO_LEVELS[c.level][2]),c.max*40))
    return 'Finish the active round and leave the required payout reserve in the casino.';
   c.cash-=amount;finOwnerDistribution(amount,'Casino owner distribution','Casino distribution tax');
  }
 }else if(action==='expand'){
  const next=CASINO_LEVELS[c.level+1];
  if(!next)return 'The casino is already a resort.';
  const cost=casinoCurrency(c,next[1]),reserve=Math.max(casinoCurrency(c,next[2]),casinoCommittedReserve(c));
  if(c.cash-cost<reserve)return 'Construction needs '+loc(cost)+' plus '+loc(reserve)+' left in the reserve.';
  c.cash-=cost;c.level++;c.property+=Math.round(cost*.8);c.rep=casinoScore(c.rep+7);
  casinoPress(v,'Casino expands its gaming floor',v.n+' is now a '+next[0].toLowerCase()+' with more room for games and entertainment.');
 }else if(action==='game'){
  const row=Object.hasOwn(CASINO_GAMES,key)?CASINO_GAMES[key]:null;
  if(!row||row[1]>c.level)return 'This game needs a larger venue.';
  if(c.games.includes(key)){
   if(c.games.length===1||round?.venue===c.id&&round.game===key)return 'Keep one game open and finish any active round first.';
   c.games=c.games.filter(k=>k!==key);
  }else{
   if(c.games.length>=CASINO_LEVELS[c.level][3]||!casinoSpend(c,casinoCurrency(c,row[2])))return 'The gaming floor or casino funds are insufficient.';
   c.games.push(key);
  }
 }else if(action==='limits'){
  if(!Array.isArray(amount)||amount.length!==2||!amount.every(Number.isSafeInteger)||amount[0]<1||amount[1]<amount[0]||
    amount[1]>casinoCurrency(c,[500,2500,10000,50000][c.level]))return 'Enter valid table limits for this venue level.';
  [c.min,c.max]=amount;
 }else if(action==='rule'){
  const choices={wheel:['single','double'],soft:['stand','hit'],blackjack:['three','six'],slots:['standard','jackpot'],rake:[2,4,6,8]};
  if(!Object.hasOwn(choices,key)||!choices[key].includes(amount))return 'This rule is unavailable.';
  c.rules[key]=amount;
 }else if(action==='amenity'){
  const row=Object.hasOwn(CASINO_AMENITIES,key)?CASINO_AMENITIES[key]:null;
  if(!row||row[1]>c.level||c.amenities.includes(key)||c.amenities.length>=c.level*2)return 'There is no available room for that amenity.';
  const cost=casinoCurrency(c,row[2]);
  if(!casinoSpend(c,cost))return 'Casino funds cannot cover the opening cost.';
  c.property+=Math.round(cost*.6);c.amenities.push(key);c.rep=casinoScore(c.rep+3);
  casinoPress(v,'Casino adds a hospitality venue',v.n+' opened a '+row[0].toLowerCase()+'.');
 }else if(action==='act'){
  const row=Object.hasOwn(CASINO_PERFORMERS,key)?CASINO_PERFORMERS[key]:null;
  if(!row||row[1]>c.level||row[2]&&!c.amenities.includes(row[2]))return 'The venue does not meet this act’s requirements.';
  if(c.performers.includes(key))c.performers=c.performers.filter(k=>k!==key);
  else{
   if(c.performers.length>=c.level||!casinoSpend(c,casinoCurrency(c,Math.round(row[3]*.2))))return 'There is no booking slot or enough money for the deposit.';
   c.performers.push(key);c.rep=casinoScore(c.rep+2);
   casinoPress(v,'Casino announces a new live booking',v.n+' added '+row[0].toLowerCase()+' to its entertainment calendar.');
  }
 }else if(action==='security'){
  if(![1,-1].includes(amount)||c.security+amount<0||c.security+amount>c.level+2)return 'No security position is available.';
  if(amount>0&&!casinoSpend(c,casinoCurrency(c,800)))return 'Casino funds cannot cover recruitment.';
  c.security+=amount;
 }else if(action==='marketing'){
  if(c.used.marketing===g.age||!casinoSpend(c,casinoCurrency(c,[150,1100,7200,22000][c.level])))return 'Marketing is used or unfunded for this year.';
  c.used.marketing=g.age;c.marketing=1;c.rep=casinoScore(c.rep+3);
 }else if(action==='reopen'){
  if(c.cash<Math.max(casinoCurrency(c,CASINO_LEVELS[c.level][2]),c.max*40))return 'Rebuild the payout reserve before reopening.';
  c.closed=g.age;
 }else if(action==='sell'){
  if(round?.venue===c.id)return 'Finish the active round before selling.';
  const value=casinoBusinessValue(v);
  g.cash+=value;LD('Casino sale proceeds',value);
  g.vent.splice(g.vent.indexOf(v),1);
  casinoPress(v,'A casino property changes hands',v.n+' was sold to new operators.');
 }else return 'Unknown casino action.';
 return '';
}
