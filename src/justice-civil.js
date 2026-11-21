function civilAddVictim(key,defendant=null,description=null,loss=0){
 const s=justiceState(),type=CIVIL_TYPES[key];
 if(!type||s.victims.some(v=>v.key===key&&v.age===g.age&&v.defendant===defendant))return null;
 const party=defendant||justiceName(s)+(key==='contract'||key==='property'?' Services':'');
 const incident={id:justiceID(s),key,age:g.age,defendant:party,description:description||justicePick(s,CIVIL_INCIDENTS[key]||['A documented dispute is eligible for civil review.']),
   value:pr(type[1]),evidence:justiceClamp(type[2]+justiceRandom(s,-16,9)),response:null,status:'new',loss};
 s.victims.push(incident);
 return incident;
}
function civilAnnual(s){
 if(s.lastVictim===g.age||g.age<16||justiceCustody())return;
 s.lastVictim=g.age;
 for(const c of s.civil){
   if(c.status==='appealFiled'&&c.due<=g.age)c.status='appealReady';
   if(c.status==='appealWindow'&&g.age>c.due)c.status='closed';
 }
 if(s.pending||justiceRandom(s,1,100)>25)return;
 const keys=['theft','assault','contract','property'];
 const key=justicePick(s,keys),loss=pr(justiceRandom(s,180,1750)),v=civilAddVictim(key,null,null,loss);
 if(v&&s.tracking){
   civilImpact(s,v);
   s.pending={kind:'victim',id:v.id};
 }
}
function civilImpact(s,v){
 if(v.impacted||!v.loss)return;
 v.impacted=true;
 if(v.key==='assault'){g.health=cl(g.health-justiceRandom(s,2,7));g.happy=cl(g.happy-5);}
 else{
   const actual=Math.min(Math.max(0,g.cash),v.loss);
   g.cash-=actual;
   LD('Loss from civil incident',-actual);
 }
}
function civilReviewVictim(id){
 const s=justiceState(),v=justiceFind(s.victims,id);
 if(v?.status!=='new'||v.response||s.pending||justiceCustody()||justiceQuiet())return;
 civilImpact(s,v);
 justiceDecision('victim',{id:v.id});
}
function civilVictimChoice(choice){
 const s=justiceState(),p=s.pending,v=justiceFind(s.victims,p?.id);
 if(p?.kind!=='victim'||!v||v.status!=='new'||v.response||!['documents','contact','later'].includes(choice))return;
 v.response=choice;
 if(choice==='documents')v.evidence=justiceClamp(v.evidence+8);
 if(choice==='contact'){v.evidence=justiceClamp(v.evidence+4);g.happy=cl(g.happy+2);}
 const text=choice==='documents'?'The documents are on the incident record.':choice==='contact'?'An independent contact supplied a statement.':'You can review the record later.';
 justiceOutcome('Incident recorded',text+' Open Other → Lawsuits to review filing options.');
}
function civilFile(id){
 const s=justiceState(),v=justiceFind(s.victims,id);
 if(!v||v.status!=='new'||justiceCustody()||justiceQuiet()||s.pending)return;
 if(g.age>v.age+3)return toast('The simulation’s three-year filing window has closed.');
 const fee=pr(450);
 if(g.cash<fee)return toast('You cannot cover the civil filing fee.');
 if(s.civil.filter(x=>!['closed','withdrawn'].includes(x.status)).length>=3)return toast('You can manage up to three open civil cases.');
 g.cash-=fee;LD('Civil case filing fees',-fee);civilImpact(s,v);v.status='filed';
 const c={id:justiceID(s),victim:v.id,age:g.age,due:g.age+1,stage:'investigation',status:'open',evidence:v.evidence,
   leverage:33,expenses:fee,offer:null,value:v.value,paid:0,outcome:null,history:['The court accepted your filing. A response and initial review take time.']};
 s.civil.push(c);
 justiceOutcome('Civil claim filed','The initial investigation opens at age '+c.due+'. Use the Lawsuits tab to follow the case.');
}
function civilOpenStage(id){
 const s=justiceState(),c=justiceFind(s.civil,id);
 if(!c||justiceCustody()||s.pending||justiceQuiet())return;
 if(c.status==='appealWindow'&&g.age<=c.due)return justiceDecision('civilStage',{id,stage:'appeal'});
 if(c.status==='appealReady')return justiceDecision('civilStage',{id,stage:'review'});
 if(c.status==='open'&&g.age>=c.due)return justiceDecision('civilStage',{id,stage:c.stage});
}
function civilPayment(c,amount,text){
 if(c.status==='closed')return '';
 const paid=Math.max(0,Math.round(amount));
 c.paid+=paid;g.cash+=paid;LD('Civil recovery',paid);
 c.status='closed';c.outcome=text;c.history.unshift(text);
 return text+(paid?' You received '+loc(paid)+'.':'');
}
function civilSelect(index){
 const s=justiceState(),p=s.pending,c=justiceFind(s.civil,p?.id);
 if(p?.kind!=='civilStage'||!c||justiceCustody()||![0,1,2].includes(index))return;
 if(p.stage==='review'){
   if(c.status!=='appealReady'||index!==0)return;
   const won=justiceRandom(s,1,100)<Math.min(54,19+c.evidence*.33);
   return justiceOutcome('Civil appeal decision',civilPayment(c,won?c.value*.52:0,won?'The appellate court awarded a partial recovery.':'The appellate court affirmed the judgment.'));
 }
 if(p.stage==='appeal'&&index===1)return justiceOutcome('Judgment finalized',civilPayment(c,0,'The original judgment is final.'));
 const def=CIVIL_STAGES[p.stage],cost=def?.[2][index];
 if(cost==null||g.cash<pr(cost))return toast('You do not have enough cash for this step.');
 if(p.stage==='appeal'&&c.status!=='appealWindow'||p.stage!=='appeal'&&(c.status!=='open'||c.stage!==p.stage||g.age<c.due))return;
 g.cash-=pr(cost);c.expenses+=pr(cost);LD('Civil legal expense',-pr(cost));
 let text='';
 if(p.stage==='investigation'||p.stage==='discovery'){
   const delta=[8,5,13][index]+justiceRandom(s,-7,7);
   c.evidence=justiceClamp(c.evidence+delta);c.leverage=justiceClamp(c.leverage+Math.round(delta/2));
   c.stage=p.stage==='investigation'?'discovery':'negotiation';c.due=g.age+1;
   text=delta>5?justicePick(s,['The material supported part of your claim.','A dated account corroborated the timeline.',
     'The other side conceded one factual issue after reviewing the documents.']):
     justicePick(s,['The defense disputed the new material.','A requested record was incomplete and requires explanation.',
       'A witness account conflicted with part of the existing record.']);
   text+=' '+CIVIL_STAGES[c.stage][0]+' opens at age '+c.due+'.';
 }else if(p.stage==='negotiation'){
   const pct=Math.round(18+c.leverage*.46+c.evidence*.24+justiceRandom(s,-13,15));
   c.offer=Math.round(c.value*pct/100);
   if(index!==2&&justiceRandom(s,1,100)<Math.min(77,27+c.leverage*.65)){
     c.status='offer';text='The defense proposed '+loc(c.offer)+'. Review and accept or decline the offer in Lawsuits.';
   }else{c.stage='trial';c.due=g.age+1;text='No agreement was reached. Trial is scheduled for age '+c.due+'.';}
 }else if(p.stage==='trial'){
   const won=justiceRandom(s,1,100)<Math.round(c.evidence*.8+([5,3,8][index]));
   if(won){
     return justiceOutcome('Civil judgment',civilPayment(c,c.value*justiceRandom(s,55,94)/100,'The court found in your favor.'));
   }
   c.status='appealWindow';c.due=g.age+1;c.outcome='Defense prevailed';
   text='The defense prevailed. You can appeal through age '+c.due+'.';
 }else{
   c.status='appealFiled';c.due=g.age+justiceRandom(s,1,2);c.outcome='Appeal filed';
   text='The appeal is set for review at age '+c.due+'.';
 }
 c.history.unshift(text);
 justiceOutcome('Civil case update',text);
}
function civilSettle(id,accept){
 const s=justiceState(),c=justiceFind(s.civil,id);
 if(c?.status!=='offer'||s.pending||justiceCustody()||justiceQuiet())return;
 if(accept)return justiceOutcome('Accepted settlement',civilPayment(c,c.offer,'The parties signed a final settlement.'));
 c.status='open';c.stage='trial';c.due=g.age+1;c.history.unshift('You declined the settlement. Trial is scheduled.');
 justiceOutcome('Settlement declined','Trial is scheduled for age '+c.due+'.');
}
