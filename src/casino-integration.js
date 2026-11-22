OMENU.push(['Casino','Casino games, venues, and wagering records']);
const casinoOldOther=otherV;
otherV=function(){
 if(NV.O[0]==='Casino'&&!g.jail)return casinoView();
 return casinoOldOther();
};
const casinoOldFound=found;
found=function(index){
 if(FOUND[index]?.[2]==='cas')return casinoOpen('owner');
 return casinoOldFound(index);
};
const casinoOldBizPanel=bizP;
bizP=function(i){
 const v=g.vent[i];
 if(v?.t!=='cas')return casinoOldBizPanel(i);
 const c=casinoBusinessState(v);
 return casinoSection(v.n,'<p>'+CASINO_LEVELS[c.level][0]+' · '+loc(c.cash)+' in casino funds.</p>'+
  B('Manage casino',casinoCall('casinoOpen','owner',null,c.id)));
};
const casinoOldVentAction=va;
va=function(i,j){
 if(g.vent[i]?.t==='cas')return found(FOUND.findIndex(x=>x[2]==='cas'));
 return casinoOldVentAction(i,j);
};
const casinoOldSell=vsell;
vsell=function(i){
 const v=g.vent[i];
 if(v?.t==='cas'){
  const result=casinoManage(v,'sell');
  if(result)return toast(result);
  vsel=null;wsel=null;return casinoOpen('owner');
 }
 return casinoOldSell(i);
};
const casinoOldAge=ageUp;
ageUp=function(){
 if(g?.casinoPlay?.round){
  if(casinoCanGamble())return toast('Finish or fold the active casino hand before aging up.');
  casinoRefund();
 }
 const prior=g?.age,result=casinoOldAge();
 if(g?.alive&&g.age>prior&&g.casinoPlay)casinoSeason(g.casinoPlay);
 return result;
};
const casinoOldPrisonLedger=prisonLedger;
prisonLedger=function(s){
 if(g.casinoPlay?.round)casinoRefund();
 for(const v of g.vent.filter(x=>x.t==='cas'))casinoAnnual(v,true);
 return casinoOldPrisonLedger(s);
};
const casinoOldEffects=E;
E=function(x){
 const result=casinoOldEffects(x);
 if(x?.casinoVisit&&casinoCanGamble()){tab='Other';NV.O=['Casino','play'];casinoVenue=null;}
 if(x?.casinoEvent){
  const e=g.casinoPlay?.events.find(e=>e.id===x.casinoEvent.id);
  newsBriefReceipt=casinoRespond(e,x.casinoEvent.choice).text;
 }
 return result;
};
const casinoOldDrain=stuffDrainEvents;
stuffDrainEvents=function(){
 if(g?.stuffEventQueue?.length)g.stuffEventQueue=g.stuffEventQueue.filter(q=>{
  const id=q.c?.[0]?.[1]?.casinoEvent?.id;
  return id==null||casinoEventReady(g.casinoPlay?.events.find(e=>e.id===id));
 });
 return casinoOldDrain();
};
function casinoRebase(v,age,origin){
 if(!v.casino)return;
 const c=v.casino;
 c.lastAge=age;c.used={};c.report=null;c.liveNet=0;
 c.closed=c.closed>origin?age+(c.closed-origin):0;
}
