const TEACH_ROLES={
 elementary:['Elementary school teacher',50500],middle:['Middle school teacher',58500],high:['High school teacher',65500],
 professor:['University professor',92000],dean:['University dean',130000]
};
const TEACH_SUBJECTS={
 broad:['Broad education',['Education','Psychology','Undeclared']],
 math:['Mathematics',['Mathematics','Economics','Engineering','Computer Science']],
 science:['Science',['Biology','Chemistry','Environmental Science','Nursing','Engineering']],
 english:['English and writing',['English','Communications','Education']],
 history:['History and social studies',['History','Political Science','Social Work','Criminal Justice','Education']],
 arts:['Arts',['Art & Design','Communications','Education']],
 technology:['Technology',['Computer Science','Engineering','Mathematics']],
 health:['Health and physical education',['Kinesiology','Nursing','Biology','Education']]
};
const TEACH_METHODS={balanced:['Balanced',2,2,2],strict:['Structured and strict',0,5,1],creative:['Creative and project-based',4,1,5],
 discussion:['Discussion and tutorials',2,2,5],supportive:['Differentiated instruction',4,2,3]};
const TEACH_HOMEWORK={light:['Short practice exercises',1,0,4],standard:['Weekly practice',4,1,2],intensive:['Frequent assignments',7,2,-2],portfolio:['Project portfolio',5,0,4]};
const TEACH_TESTS={standard:['End-of-unit tests',4,1,1],frequent:['Frequent low-stakes quizzes',2,2,3],
 finals:['Cumulative final',0,7,-2],practical:['Applied assessment',2,4,2]};
const TEACH_INSTITUTIONS=[
 ['Cedar County College',0,92000,45],['Western Plains University',3,110000,62],
 ['Lakehurst University',5,132000,72],['Eastlake Research University',7,159000,83]
];
const TEACH_PROJECTS={research:['Research study',14,58],writing:['Textbook or course reader',12,48],outreach:['Community education partnership',11,45],
 lab:['Teaching lab or studio',15,55],open:['Open teaching resources',10,45]};
const UNI_TYPES={broad:'Broad university',arts:'Arts and humanities',science:'Science and technology',research:'Research university',applied:'Applied and professional studies'};
const UNI_PROGRAMS={
 arts:['Arts and design','arts'],english:['English and communications','arts'],education:['Education','applied'],business:['Business','applied'],
 biology:['Biology','science'],computing:['Computer science','science'],math:['Mathematics','science'],engineering:['Engineering','science'],
 policy:['Public policy','arts'],health:['Public health','applied'],research:['Interdisciplinary research','research'],history:['History','arts']
};
const UNI_ROLES={professor:['Professors',76000],janitor:['Janitorial staff',34000],maintenance:['Maintenance technicians',46000],
 security:['Campus safety officers',48000],advising:['Student advisors',51000]};
const UNI_UPGRADES={lights:['Emergency blue-light phones',95000,4],library:['Library and learning commons',380000,9],
 accessibility:['Accessible facilities',225000,7],labs:['Teaching laboratories',520000,10],wellbeing:['Counseling center',245000,8],green:['Efficient campus utilities',330000,6]};
const UNI_FUNDING={tuition:'Tuition and family contributions',donor:'Private donors and foundations',alumni:'Alumni and graduates',
 public:'Public appropriations',partner:'Research and private partnerships'};
const UNI_TRIP_PLANS={culture:'Museums and community history',field:'Field study and environmental survey',innovation:'Labs and professional visits',
 service:'Supervised service and language immersion'};
const TEACH_EVENTS={
 support:['A student asks for a different way to access the course','A choice about accommodations will shape participation for the rest of the year.',[
  ['Create accessible materials',0,5,4,5],['Coordinate support with a specialist',0,3,2,3],['Keep the current format',0,-2,-4,0]],false],
 family:['Families question the grading policy','You can review the rubric without disclosing student records.',[
  ['Hold a rubric workshop',0,4,5,2],['Share anonymized examples',0,3,3,1],['Keep the current explanation',0,-1,-3,0]],true],
 device:['The classroom equipment fails during a unit','A practical response can protect learning time.',[
  ['Borrow equipment from another department',0,3,2,3],['Redesign the lesson with available supplies',0,2,4,3],['Postpone the unit',0,-2,-2,-2]],false],
 copying:['A group submission raises an academic-integrity concern','Students want a review and a fair process.',[
  ['Review individual contributions',0,5,2,2],['Offer an educational resubmission',0,2,5,4],['Apply the standard penalty',0,1,-4,-1]],false],
 invited:['A symposium invites you to present your work','The invitation can open research and teaching partnerships.',[
  ['Present with a student collaborator',0,5,4,3],['Share course resources with colleagues',0,3,2,2],['Decline this year',0,0,0,0]],true],
 review:['An external reviewer questions a research conclusion','A documented response can protect scholarly credibility.',[
  ['Audit the analysis and issue a correction if needed',0,6,2,1],['Request a second peer review',0,3,2,0],['Leave the work as published',0,-5,-2,0]],true],
 deficit:['The university budget closes in deficit','Students and staff are asking how the university will keep essential services open.',[
  ['Apply for emergency funding and publish a recovery plan',0,4,2,3],['Suspend optional operations for the next year',0,2,-3,1],
  ['Continue at current spending',0,-6,-6,-4]],true],
 layoffs:['Large classes push the campus past capacity','Students are being waitlisted and staff report heavy workloads.',[
  ['Fund extra sections and temporary staff',90000,6,5,8],['Create a staggered timetable',25000,2,3,4],['Keep this year’s intake unchanged',0,-5,-7,-4]],true],
 repairs:['Deferred maintenance closes teaching space','Repairs or temporary rooms will affect next year’s capacity.',[
  ['Fund urgent repairs',125000,6,5,10],['Arrange temporary rooms',48000,2,3,5],['Close affected rooms for the term',0,-4,-5,-5]],true],
 safety:['Campus safety incidents draw public attention','Residents and students want a plan for safe access without blanket restrictions.',[
  ['Fund lighting and staffed late-night transit',110000,7,6,9],['Organize a student safety consultation',20000,3,4,4],['Maintain current coverage',0,-6,-6,-4]],true],
 hazing:['Students report hazing in a campus organization','The response affects safety, trust and whether the group can operate.',[
  ['Investigate and provide independent student support',85000,8,5,8],['Suspend the group pending review',30000,5,2,5],['Leave the matter to the group',0,-9,-9,-6]],true],
 bullying:['A student group reports persistent bullying','Affected students ask for support and an independent review.',[
  ['Fund advocacy and a formal review',65000,7,6,8],['Arrange a supervised intervention',28000,3,4,4],['Keep the current process',0,-5,-6,-4]],true],
 sponsor:['A large donor attaches conditions to a gift','The proposed gift could help the budget and constrain academic decisions.',[
  ['Accept with a public academic-independence clause',0,5,4,2],['Accept the original terms',0,-5,-6,0],['Decline the gift',0,3,2,0]],true],
 exchange:['A partner requests better support for visiting students','The next year’s exchange depends on reliable housing and advising.',[
  ['Fund orientation and emergency support',70000,5,5,6],['Agree on a smaller exchange',22000,2,3,3],['Suspend the partnership',0,-3,-5,-2]],true],
 accreditation:['An external review visits the campus','Reviewers want evidence of sustainable staffing and strong programs.',[
  ['Fund the improvement plan',92000,8,5,7],['Publish a phased remediation plan',30000,4,3,4],['Defer the requested changes',0,-7,-6,-4]],true]
};
