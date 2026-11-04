/* Explicit identity links keep contact cards and long-term friends in sync. */
function relationshipContactLinks(){if(!g)return [];const links=[];
 const add=(list,type,field)=>{for(const p of list||[]){let r=p.friendId?g.rel.find(r=>r.id===p.friendId):null;if(!r&&type==='college')r=g.rel.find(r=>r.id===p.id&&r.source==='college');if(!r&&type==='coworker'){r=g.rel.find(r=>r.source==='coworker'&&r.sourceId===p.id);if(!r&&p.friend){const possible=g.rel.filter(r=>r.source==='coworker'&&!r.sourceId&&r.n===p.n);if(possible.length===1){r=possible[0];r.sourceId=p.id;}}}if(r&&!r.alive){p.friendId=null;p.friend=false;}if(r&&r.alive){p.friendId=r.id;links.push({p,r,field,key:type+':'+p.id});}}};
 add(g.elem?.classmates,'elementary','bond');add(g.middle?.classmates,'middle','bond');add(g.highSchool?.classmates,'high','bond');add(g.collegeTrack?.current?.peers,'college','bond');add(g.co,'coworker','b');return links;
}
function relationshipSyncAll(){if(!g)return;for(const r of g.rel||[]){const old=r.historyState;if(old){if(old.role!==r.role)relationshipMemory(r,'Your relationship changed from '+old.role+' to '+r.role+'.','milestone');if(old.alive&&!r.alive)relationshipMemory(r,r.deceased?'Their life became part of your shared history.':'You ended contact, keeping the memories of your time together.','farewell');}r.historyState={role:r.role,alive:r.alive};}for(const {p,r,field,key} of relationshipContactLinks()){r.contactSync=r.contactSync||{};const last=r.contactSync[key];let bond=r.bond;
 if(last!==undefined&&p[field]!==last&&r.bond===last)bond=p[field];
 bond=cl(Number.isFinite(bond)?bond:50);r.bond=bond;p[field]=bond;r.contactSync[key]=bond;
 }}
function relationshipMemory(r,text,type='shared'){if(!r||!text)return;r.sharedMemories=Array.isArray(r.sharedMemories)?r.sharedMemories:[];if(r.sharedMemories.some(x=>x.age===g.age&&x.text===text))return;r.sharedMemories.unshift({age:g.age,text:String(text),type});if(r.sharedMemories.length>30)r.sharedMemories.length=30;}
function relationshipCaptureContact(p,field,fn,label){if(!p)return fn();relationshipSyncAll();const before=p[field],oldLinks=relationshipContactLinks().filter(x=>x.p===p);const result=fn();relationshipSyncAll();const link=relationshipContactLinks().find(x=>x.p===p);if(link&&(p[field]!==before||!oldLinks.length)){relationshipMemory(link.r,label);draw();}return result;}
const relationshipContinuityDraw=draw;
draw=function(rs){relationshipSyncAll();return relationshipContinuityDraw(rs);};
const relationshipContinuityEffect=E;
E=function(x){const result=relationshipContinuityEffect(x);relationshipSyncAll();return result;};
const relationshipContinuityAction=A;
A=function(x,text){if(x?.relId){const r=g.rel.find(r=>r.id===x.relId);relationshipMemory(r,text);}return relationshipContinuityAction(x,text);};
const relationshipContinuityColleague=jobUpdateColleagueAction;
jobUpdateColleagueAction=function(id,action){const p=g.co.find(x=>x.id===id);return relationshipCaptureContact(p,'b',()=>relationshipContinuityColleague(id,action),`Work memory: ${action==='friend'?'became friends':action} with ${p?.n||'a colleague'}.`);};
const relationshipContinuityCollege=collegePersonAction;
collegePersonAction=function(kind,id,i){const p=(kind==='peer'?g.collegeTrack?.current?.peers:g.collegeTrack?.current?.professors)?.find(x=>x.id===id);return relationshipCaptureContact(p,'bond',()=>relationshipContinuityCollege(kind,id,i),'Campus memory: '+(['studied together','shared notes','attended an event','worked on a project','became friends'][i]||'spent time together')+'.');};
const relationshipContinuityElementary=elemPeerAct;
elemPeerAct=function(id,i){return relationshipCaptureContact(g.elem?.classmates.find(x=>x.id===id),'bond',()=>relationshipContinuityElementary(id,i),'Elementary school: learned and played together.');};
const relationshipContinuityMiddle=msClassmateAct;
msClassmateAct=function(id,i){return relationshipCaptureContact(g.middle?.classmates.find(x=>x.id===id),'bond',()=>relationshipContinuityMiddle(id,i),'Middle school: shared time and supported each other.');};
const relationshipContinuityHigh=hsPeerAct;
hsPeerAct=function(id,i){return relationshipCaptureContact(g.highSchool?.classmates.find(x=>x.id===id),'bond',()=>relationshipContinuityHigh(id,i),'High school: built a friendship together.');};
function relationshipContinuity(id,action){const r=g.rel.find(x=>x.id===id&&x.alive);if(!r||!['conflict','repair','followup'].includes(action))return;r.continuity=r.continuity||{status:'steady',lastAge:-1};const c=r.continuity;if(c.lastAge===g.age)return toast('Give this relationship time. Continue this conversation next year.');
 if(action==='conflict'&&c.status==='steady'){c.status='strained';c.startedAge=g.age;r.bond=cl(r.bond-10);relationshipMemory(r,'A difficult disagreement changed the relationship.','conflict');}
 else if(action==='repair'&&c.status==='strained'){c.status='rebuilding';r.bond=cl(r.bond+5);relationshipMemory(r,'You listened, apologized where needed, and agreed on a way forward.','repair');}
 else if(action==='followup'&&c.status==='rebuilding'){c.status='steady';r.bond=cl(r.bond+8);relationshipMemory(r,'You followed through over time and rebuilt trust.','reconciliation');}
 else return;c.lastAge=g.age;relationshipSyncAll();A({p:action==='conflict'?-2:3},action==='conflict'?'You acknowledged a conflict instead of pretending nothing was wrong.':'Trust grows through follow-through, not just one conversation.');}
const relationshipContinuityView=relationshipView;
relationshipView=function(){const html=relationshipContinuityView(),r=sel&&g.rel.find(r=>r.id===sel);if(!r)return html;const status=r.continuity?.status||'steady',available=r.continuity?.lastAge!==g.age;
 return html+`<div class=card><h3>Shared history</h3>${r.alive?`<p>Relationship outlook: ${uiEscape(status)}.</p>${status==='steady'?B('Talk through an unresolved disagreement',`relationshipContinuity('${r.id}','conflict')`,!available):status==='strained'?B('Begin repairing trust',`relationshipContinuity('${r.id}','repair')`,!available):B('Follow through on your agreement',`relationshipContinuity('${r.id}','followup')`,!available)}<p class=d>Repair takes more than one year. Memories remain even if your relationship changes.</p>`:''}${(r.sharedMemories||[]).map(m=>`<p>Age ${m.age} · ${uiEscape(m.text)}</p>`).join('')||'<p class=d>No shared memories recorded yet. Spending time together creates a history.</p>'}</div>`;};
relV=relationshipView;
