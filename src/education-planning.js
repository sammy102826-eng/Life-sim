/* Semester planning, constrained student time, transfers, renewable aid and debt. */
function eduCalendar(c=collegeEnsure().current){
 if(!c)return null;
 if(!c.calendar||c.calendar.year!==c.year){
  c.calendar={year:c.year,semester:1,terms:[],used:0,energy:100,rests:0};
  eduRenewAwards(c);
 }
 return c.calendar;
}
function eduTimeLimit(){return Math.max(12,48-(g.job?16:0)-Math.min(12,(g.pt?.length||0)*6));}
function eduSpendTime(blocks,energy){const c=collegeEnsure().current;if(!c)return true;const cal=eduCalendar(c);if(c.completedAge>=g.age+1)return false;if(cal.used+blocks>eduTimeLimit()||cal.energy<energy){toast('Not enough study blocks or energy this semester. Adjust your priorities, rest, or finish the semester.');return false;}cal.used+=blocks;cal.energy-=energy;return true;}
function eduRest(){const cal=eduCalendar();if(!cal||cal.rests>=2||cal.used>=eduTimeLimit())return;cal.rests++;cal.used++;cal.energy=cl(cal.energy+25);A({h:1,p:2},'You took a restorative break. Energy recovered; the study block still counts toward this semester.');}
function eduSemesterCourses(c){if(!c.schedule.length)collegeDefaultSchedule(c);const cal=eduCalendar(c),half=Math.ceil(c.schedule.length/2);return c.schedule.map((x,index)=>({x,index})).filter(({index})=>cal.semester===1?index<half:index>=half);}
function eduPlannerView(){const c=collegeEnsure().current;if(!c)return '';const cal=eduCalendar(c);return `<div class=card><h3>Year ${c.year} · Semester ${cal.semester} of 2</h3><p>Study blocks ${cal.used}/${eduTimeLimit()} · Energy ${cal.energy}/100</p><p class=d>A full-time job reserves 16 blocks; each part-time job reserves 6. Class tasks, study, parties, sports and internships share this budget. Two semesters fit within one Age Up.</p>${B('Take a restorative break','eduRest()',cal.rests>=2||cal.used>=eduTimeLimit())}${B('Finish current semester','eduFinishSemester()',c.completedAge>=g.age+1)}${B('Transfer college / evaluate credits',"eduOpen('transfer')")}</div>`;}
function eduRenewAwards(c){
 if(!c.renewableAid)c.renewableAid={base:Math.max(0,c.aid.scholarship),status:'Initial award',lastYear:1};
 const a=c.renewableAid;if(a.lastYear===c.year)return;
 const last=c.semesterHistory?.at(-1),gpa=last?.gpa??c.gpa;
 const extras=eduState().scholarships.filter(x=>x.school===c.name).reduce((n,x)=>n+x.amount,0);
 a.base=Math.max(a.base,Math.max(0,c.aid.scholarship-extras));
 const sportNeeded=(c.aidBreakdown||[]).some(x=>/^Athletic/.test(x.name));
 const eligible=gpa>=3&&(!sportNeeded||(c.club?.kind==='sport'&&c.club.performance>=60));
 c.aid.scholarship=eligible?Math.min(c.tuition,a.base+extras):0;
 a.status=eligible?'Renewed: term GPA and activity requirements met':'Suspended: term GPA 3.0+ and recruited-team performance 60+ required';a.lastYear=c.year;
 if(c.year>1)L(`Scholarship review at ${c.name}: ${a.status}. Awards can be restored at the next annual review.`);
}
const eduPlannerCourse=eduCourseAction;
eduCourseAction=function(index,action){const c=collegeEnsure().current;if(!c||!['attend','study','project','exam'].includes(action))return;const current=eduSemesterCourses(c);if(!current.some(x=>x.index===index))return toast('This class belongs to the other semester.');const key=c.year+':'+index;if(c.courseWork?.[key]?.[action])return;const cost={attend:1,study:2,project:3,exam:2}[action];if(!eduSpendTime(cost,cost*2))return;return eduPlannerCourse(index,action);};
const eduPlannerStudy=collegeStudyAction;
collegeStudyAction=function(i){const c=collegeEnsure().current;if(!c||!Number.isInteger(i)||i<0||i>7||c.yearActions[c.year+':'+i])return;if(!eduSpendTime(2,5))return;return eduPlannerStudy(i);};
const eduPlannerSocial=collegeSocialAction;
collegeSocialAction=function(i){const c=collegeEnsure().current;if(!c||i<0||i>11||c.yearActions['social:'+c.year+':'+i])return;const costs=[25,45,55,25,20,60,10,0,0,180,10,25];if(g.cash<costs[i])return;if(!eduSpendTime(3,4))return;return eduPlannerSocial(i);};
const eduPlannerTrain=collegeClubTrain;
collegeClubTrain=function(name,workout){const c=collegeEnsure().current,b=c?.club;if(!b)return;const used=workout?b.workoutUsed:b.trainUsed;if(used[c.year+':'+name])return;if(!eduSpendTime(3,8))return;return eduPlannerTrain(name,workout);};
const eduPlannerIntern=eduInternComplete;
eduInternComplete=function(index){if(!eduState().internships.some(x=>x.index===index&&x.status==='Active'))return;if(!eduSpendTime(6,12))return;return eduPlannerIntern(index);};
const eduPlannerCoursesView=eduCoursesView;
eduCoursesView=function(){const c=collegeEnsure().current;if(!c)return '';const allowed=new Set(eduSemesterCourses(c).map(x=>x.index)),holder=document.createElement('div');holder.innerHTML=eduPlannerCoursesView();for(const card of holder.querySelectorAll('.card')){const button=card.querySelector('[onclick^="eduCourseAction"]'),index=button&&Number(button.getAttribute('onclick').match(/\((\d+)/)[1]);if(button&&!allowed.has(index))card.remove();}return eduPlannerView()+holder.innerHTML;};
const eduPlannerPage=collegeCurrentPage;
collegeCurrentPage=function(){const c=collegeEnsure().current;const html=eduPlannerPage();return c&&['current','study'].includes(collegePage)?eduPlannerView()+html:html;};
function eduRecordSemester(c){const cal=eduCalendar(c);if(cal.terms.includes(cal.semester))return false;if(!eduPayYear(c))return false;
 const actions=Object.keys(c.yearActions).filter(k=>k.startsWith(c.year+':')).length;
 const courses=eduSemesterCourses(c).map(({x,index})=>{const w=c.courseWork?.[c.year+':'+index]||{},bonus=(w.attend?2:0)+(w.study?3:0)+(w.project?4:0)+(w.exam?3:0);x.semesterScore=cl(Math.round(64+actions*1.5+c.performance*.05+(g.smarts-50)*.035+((g.iq||100)-100)*.018+bonus+R(-9,10)),0,100);return {name:x.name,type:x.type,credits:x.credits,score:x.semesterScore,letter:eduLetter(x.semesterScore),passed:x.semesterScore>=60};});
 const credits=courses.reduce((n,x)=>n+x.credits,0),gpa=credits?courses.reduce((n,x)=>n+eduGradePoint(x.score)*x.credits,0)/credits:0;
 const record={year:c.year,semester:cal.semester,age:g.age,gpa:+gpa.toFixed(2),courses};c.semesterHistory=c.semesterHistory||[];c.semesterHistory.push(record);cal.terms.push(cal.semester);return record;
}
const eduAnnualFinalize=collegeFinishYear;
function eduFinishSemester(){const c=collegeEnsure().current;if(!c||c.completedAge>=g.age+1)return;if(g.event||g.result||g.eduPopup||g.hsPopup||g.msq?.length)return toast('Finish your current popup first.');const cal=eduCalendar(c),report=eduRecordSemester(c);if(!report)return;
 if(cal.semester===1){cal.semester=2;cal.used=0;cal.energy=100;cal.rests=0;g.hsPopup={type:'college-notice',title:'Semester 1 report',text:`Term GPA ${report.gpa.toFixed(2)} / 4.00. ${report.courses.filter(x=>x.passed).length}/${report.courses.length} classes passed. Semester 2 is ready; annual credits and GPA finalize after both terms.`};draw();}
 else eduAnnualFinalize(false);
}
collegeFinishYear=function(fromAgeUp=false){const c=collegeEnsure().current;if(!c)return;if(!fromAgeUp)return eduFinishSemester();if(c.completedAge>=g.age)return;const cal=eduCalendar(c);if(!cal.terms.includes(1)){cal.semester=1;if(!eduRecordSemester(c))return;}cal.semester=2;if(!cal.terms.includes(2)&&!eduRecordSemester(c))return;return eduAnnualFinalize(true);};
// Changing a schedule after term grades exist would invalidate earned results.
const eduPlanSchedule=collegeBuildSchedule;
collegeBuildSchedule=function(){const c=collegeEnsure().current;if(c&&eduCalendar(c).terms.length)return toast('This year’s schedule is locked after a semester is graded.');return eduPlanSchedule();};

function eduTransferView(){const c=collegeEnsure().current;if(!c)return '<p>Enroll in a college program before requesting a transfer evaluation.</p>';const eligible=['community','university','ivy'].includes(c.level)&&c.gpa>=2&&c.credits.ge>=12;
 return `<h2>Transfer applications & credit evaluation</h2><p class=d>Requires GPA 2.0+ and 12 earned GE credits. Up to 60 credits transfer: up to 30 GE and 30 same-major credits. No transfer GPA is imported. At least two years of target-program residency remain. Existing loan debt stays payable; previously billed tuition is not refunded. Apply only before this year’s semester grading begins.</p>${COLLEGE_GROUPS.university.filter(x=>x[0]!==c.name).map(x=>B(`${x[0]} <small>Annual tuition ${collegeLoc(x[2])} · admission is not guaranteed</small>`,`eduTransferApply('${x[0]}')`,!eligible||!!eduCalendar(c).terms.length||!!c.transferAttempts?.[x[0]+':'+g.age])).join('')}${c.pendingTransfer?`<div class=card><h3>Accepted: ${c.pendingTransfer.name}</h3><p>${c.pendingTransfer.ge} GE + ${c.pendingTransfer.major} major credits eligible. Target tuition ${collegeLoc(c.pendingTransfer.tuition)}.</p>${B('Accept transfer offer','eduTransferAccept()')}</div>`:''}`;
}
function eduTransferApply(name){const c=collegeEnsure().current,row=COLLEGE_GROUPS.university.find(x=>x[0]===name);if(!c||!row||name===c.name||!['community','university','ivy'].includes(c.level)||c.gpa<2||c.credits.ge<12||eduCalendar(c).terms.length)return;c.transferAttempts=c.transferAttempts||{};const key=name+':'+g.age;if(c.transferAttempts[key])return;c.transferAttempts[key]=true;
 if(!ch(cl(Math.round(row[1]*100+(c.gpa-2)*12),10,95)))return toast('Transfer application declined. You remain at your current college.');c.pendingTransfer={name,tuition:row[2],ge:Math.min(30,c.credits.ge),major:Math.min(30,c.credits.major),sourceMajor:c.major};draw();}
function eduTransferAccept(){const t=collegeEnsure(),source=t.current,offer=source?.pendingTransfer;if(!source||!offer||eduCalendar(source).terms.length)return;
 eduState().transfers=eduState().transfers||[];eduState().transfers.push({from:source.name,to:offer.name,age:g.age,credits:offer.ge+offer.major,transcript:JSON.parse(JSON.stringify(source.years))});
 const target=collegeCurrentFrom(offer.name,'university',source.major,source.minor,{tuition:offer.tuition});target.credits.ge=offer.ge;target.credits.major=offer.major;target.requirements.years=Math.max(2,target.requirements.years-Math.floor((offer.ge+offer.major)/30));target.completedAge=source.completedAge;target.transferCredits=offer.ge+offer.major;collegeDefaultSchedule(target);eduPage='classroom';collegePage='current';L(`You transferred to ${offer.name} with ${target.transferCredits} credits. GPA starts with coursework at the new college.`);draw();}
const eduPlannerJourney=eduJourneyView;
eduJourneyView=function(){if(eduPage==='transfer')return B('Back to education',"eduOpen()")+eduTransferView();return eduPlannerJourney();};

/* Annual student debt servicing replaces the old fixed 8%-of-income payment. */
function eduLoanPlan(){if(!g.studentLoanPlan)g.studentLoanPlan={rate:.05,choice:'standard',lastAge:-1,lastEnrolledAge:null,history:[],repaymentYears:0};const p=g.studentLoanPlan;if(!Number.isFinite(p.rate)||p.rate<=0||p.rate>.2)p.rate=.05;if(!['standard','income','accelerated'].includes(p.choice))p.choice='standard';p.history=Array.isArray(p.history)?p.history:[];p.repaymentYears=Math.max(0,Number(p.repaymentYears)||0);return p;}
function eduChooseLoanPlan(choice){if(!['standard','income','accelerated'].includes(choice))return;eduLoanPlan().choice=choice;draw();}
function eduLoanPayroll(income){const p=eduLoanPlan();if(p.lastAge===g.age)return 0;p.lastAge=g.age;const enrolled=!!g.collegeTrack?.current;if(enrolled)p.lastEnrolledAge=g.age;const opening=Math.max(0,g.sloan||0);if(!opening)return 0;
 const interest=Math.round(opening*p.rate);g.sloan=opening+interest;const grace=enrolled||(p.lastEnrolledAge!=null&&g.age<=p.lastEnrolledAge+1);
 const remaining=Math.max(1,10-p.repaymentYears),standard=Math.round(opening*p.rate/(1-Math.pow(1+p.rate,-remaining))),requested=p.choice==='income'?Math.round(Math.max(0,income-pr(15000))*.10):p.choice==='accelerated'?Math.round(standard*1.5):standard;
 const payment=grace?0:Math.max(0,Math.min(g.sloan,requested,Math.round(Math.max(0,income)*.5)));g.sloan-=payment;if(!grace)p.repaymentYears++;p.history.push({age:g.age,opening,interest,payment,balance:g.sloan,deferred:grace});if(p.history.length>100)p.history.shift();L(`Student loans: interest ${loc(interest)}, payment ${loc(payment)}, balance ${loc(g.sloan)}${grace?' (in-school / one-year grace deferral)':''}.`);return payment;
}
function eduExtraLoan(amount){if(!Number.isFinite(amount)||amount<=0)return;const pay=Math.min(Math.round(amount),Math.max(0,g.cash),Math.max(0,g.sloan||0));if(!pay)return;g.cash-=pay;g.sloan-=pay;eduLoanPlan().history.push({age:g.age,extra:pay,balance:g.sloan});A({p:1},`You paid an extra ${loc(pay)} toward student debt.`);}
function eduDebtView(){const p=eduLoanPlan();return `<div class=card><h3>Student loan repayment</h3><p>Balance ${loc(g.sloan||0)} · annual interest ${(p.rate*100).toFixed(1)}% · ${p.choice} plan.</p><p class=d>Interest accrues annually, including enrollment and the one-year repayment grace period. Standard targets ten years; income-based pays 10% above ${loc(pr(15000))} annual income; accelerated pays 150% of standard. Payments are capped at 50% of annual income. This is a simplified annual game model.</p>${['standard','income','accelerated'].map(x=>B('Choose '+x+' repayment',`eduChooseLoanPlan('${x}')`,p.choice===x)).join('')}${B('Extra payment '+loc(pr(500)),`eduExtraLoan(${pr(500)})`,g.cash<=0||!g.sloan)}${B('Pay available balance','eduExtraLoan(g.sloan)',g.cash<=0||!g.sloan)}${p.history.slice(-5).map(y=>`<p class=d>Age ${y.age}: ${y.extra?'extra '+loc(y.extra):'interest '+loc(y.interest)+' · payment '+loc(y.payment)} · balance ${loc(y.balance)}</p>`).join('')}</div>`;}
const eduPlannerFinances=collegeFinancesPage;
collegeFinancesPage=function(){const c=collegeEnsure().current;if(c)eduCalendar(c);return eduPlannerFinances()+`<div class=card><h3>Scholarship renewal</h3><p>${c?.renewableAid?.status||'No award review yet'}</p><p class=d>Annual renewal uses your most recent term GPA (3.0+) and, for recruited athletes, active team performance (60+). Suspended funding can return after improved grades.</p></div>`+eduDebtView();};
const eduPlannerMoney=secV;
secV=function(p){const html=eduPlannerMoney(p);return p?.[0]==='Money'&&p[1]==='Loans'?html+eduDebtView():html;};
const eduPlannerAge=ageUp;
ageUp=function(){const before=g?.age;const result=eduPlannerAge();if(g&&g.age>before&&eduLoanPlan().lastAge!==g.age){const payment=eduLoanPayroll(0);if(payment)g.cash-=payment;}return result;};

function eduTermReportsView(){const c=collegeEnsure().current;if(!c)return '';return B('Back to Study',"collegePage='study';draw(1)")+`<h2>Semester report cards</h2>${(c.semesterHistory||[]).map(r=>`<div class=card><h3>Year ${r.year} · Semester ${r.semester}</h3><p>Term GPA ${r.gpa.toFixed(2)} / 4.00</p>${r.courses.map(x=>`<p>${x.name} · ${x.score}% · ${x.letter} · ${x.credits} credits ${x.passed?'passed':'failed'}</p>`).join('')}</div>`).join('')||'<p>No completed semester yet.</p>'}`;}
const eduTermPage=collegeCurrentPage;
collegeCurrentPage=function(){if(collegePage==='term-reports')return eduTermReportsView();return eduTermPage();};
const eduTermStudy=collegeStudyPage;
collegeStudyPage=function(){return B('Semester report cards',"collegePage='term-reports';draw(1)")+eduTermStudy();};
const eduTermGraduate=collegeGraduate;
collegeGraduate=function(){const c=collegeEnsure().current,terms=JSON.parse(JSON.stringify(c?.semesterHistory||[]));eduTermGraduate();const d=collegeEnsure().degrees.at(-1);if(d)d.semesters=terms;};
const eduTermPeople=collegePersonAction;
collegePersonAction=function(kind,id,i){const c=collegeEnsure().current,p=(kind==='peer'?c?.peers:c?.professors)?.find(x=>x.id===id);if(!p||p.used[c.year+':'+i]||(kind==='peer'&&i===4&&(p.bond<75||p.friend)))return;if(!eduSpendTime(1,2))return;return eduTermPeople(kind,id,i);};
const eduTermGreek=collegeGreekAction;
collegeGreekAction=function(i){const c=collegeEnsure().current;if(!c?.fraternity||i<0||i>5||c.yearActions['greek:'+c.year+':'+i])return;if(!eduSpendTime(2,4))return;return eduTermGreek(i);};
const eduTermTeam=collegeTeamAction;
collegeTeamAction=function(id,i){const c=collegeEnsure().current,p=c?.club?.team?.find(x=>x.id===id);if(!p||p.used[c.year+':'+i]||i<0||i>3)return;if(!eduSpendTime(1,3))return;return eduTermTeam(id,i);};
const eduTermCoach=collegeCoachAction;
collegeCoachAction=function(i){const c=collegeEnsure().current,b=c?.club;if(!b||b.coach.used?.[c.year+':'+i]||i<0||i>3)return;if(!eduSpendTime(1,2))return;return eduTermCoach(i);};
