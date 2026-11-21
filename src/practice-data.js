const PRACTICE_SPECIALTIES = {
  family:['Family medicine','Family check-in',135],
  internal:['Internal medicine','Complex care review',195],
  pediatrics:['Pediatrics','School readiness visit',145],
  cardiology:['Cardiology','Heart health follow-up',250],
  dermatology:['Dermatology','Skin health consultation',270],
  orthopedics:['Orthopedics','Mobility assessment',325],
  women:['Women’s health','Preventive health discussion',185]
};
const PRACTICE_VISITS = {
  checkup:['Regular check-up',125,22,1,0],
  consult:['Consultation',170,32,1,0],
  counsel:['Care planning visit',205,44,1,0],
  assess:['Specialty assessment',290,69,2,0],
  procedure:['Outpatient procedure',880,210,3,1],
  surgery:['Ambulatory surgery',3800,1580,6,2]
};
const PRACTICE_BUILDINGS = [
  {name:'Solo office',price:155000,maintenance:7800,panel:80,count:4,slots:{Receptionist:1,Nurse:1,Physician:1,Manager:1}},
  {name:'Community clinic',price:425000,maintenance:20500,panel:220,count:8,slots:{Receptionist:2,Nurse:2,'Billing specialist':1,'Physician':2,Manager:1}},
  {name:'Outpatient center',price:1050000,maintenance:61500,panel:520,count:16,slots:{Receptionist:3,Nurse:5,'Billing specialist':2,'Physician':4,Manager:1,'Surgical coordinator':1}}
];
const PRACTICE_ROLES = {
  Receptionist:40000,Nurse:65000,'Billing specialist':53000,Physician:152000,Manager:68000,'Surgical coordinator':72000
};
const PRACTICE_NETWORKS = {
  civic:{name:'Civic Health Network',coverage:72,allowance:89,delay:0,minimum:0},
  bridge:{name:'Bridge Mutual',coverage:83,allowance:83,delay:1,minimum:0},
  summit:{name:'Summit Preferred',coverage:91,allowance:94,delay:1,minimum:50}
};
const PRACTICE_TIER_LABELS=['Essential','Plus','Comprehensive'];
const PRACTICE_NAMES=['Alex','Maya','Noah','Leila','Casey','Sana','Elliot','Iris','Dylan','Samira','Micah','Nina','Joel','Rowan','Elena','Jude','Ash','Anika','Ravi','Hugo'];
const PRACTICE_SURNAMES=['Shah','Parker','Imani','Chen','Dawson','Reyes','Ibrahim','Okafor','Russo','Kim','Young','Silva','Miller','Ishikawa','Cruz','Ali','Baker','Lin','Ramos','Sato'];
const PRACTICE_INCIDENTS = {
  outcome:{title:'A procedure follow-up found an unexpected outcome',public:false,options:[
    ['Arrange an independent review and follow-up',2200,2,5,4,'The patient received ongoing support and an independent review improved the practice’s procedure checks.'],
    ['Coordinate care with an external specialist',1100,0,2,2,'The specialist took over the follow-up and gave the clinic feedback on the handoff.']]},
  feedback:{title:'A patient felt rushed during a visit',public:false,options:[
    ['Schedule a listening visit',140,4,0,7,'The patient stayed and helped the team improve its intake process.'],
    ['Arrange continuity with a colleague',280,1,1,3,'The patient transferred to a different clinician and the handoff was documented.']]},
  missed:{title:'Repeated missed appointments put a patient’s continuity of care at risk',public:false,options:[
    ['Offer flexible scheduling and reminders',240,5,0,5,'The patient returned for follow-up. Staff added reminders to the scheduling workflow.'],
    ['Coordinate a transfer to a more accessible practice',180,1,1,1,'A community clinic accepted the referral. The original panel slot was released.']]},
  staffing:{title:'The team requested protected training time after a near miss',public:false,options:[
    ['Fund a training session and reduce the schedule',1400,4,7,1,'The team adopted a revised review process and shortened this year’s schedule.'],
    ['Run a smaller peer review',400,1,3,0,'The review identified several issues. The full training request remains deferred.']]},
  claim:{title:'An insurer questioned a batch of submitted claims',public:false,options:[
    ['Audit the batch and correct disputed claims',1200,2,5,0,'Clean claims were released for payment and a review checklist was added.'],
    ['Write off the batch and renegotiate the process',450,1,2,2,'The remaining claims were written off. The clinic avoided passing the charges to patients.']]},
  shortage:{title:'A supplier cannot deliver a key outpatient item on schedule',public:false,options:[
    ['Arrange temporary cover with a nearby clinic',850,3,2,3,'Patients kept their appointment dates through the backup arrangement.'],
    ['Postpone elective work and notify patients',310,0,2,-2,'The clinic kept emergency arrangements in place and freed staff hours.']]},
  access:{title:'Local advocates question appointment access',public:true,options:[
    ['Fund reserved appointments for underserved patients',2400,6,2,5,'The clinic reserved appointments and added lower-cost intake places.'],
    ['Publish wait times and a referral directory',650,2,1,1,'Residents can compare wait times and find other clinics while capacity is tight.']]},
  privacy:{title:'A patient portal incident draws public attention',public:true,options:[
    ['Notify affected patients and commission an independent review',5400,4,6,4,'The clinic notified affected patients and adopted the reviewer’s corrective plan.'],
    ['Use the internal review and publish a progress update',1800,-3,2,-2,'The clinic issued an update. The oversight board will continue to monitor its response.']]},
  outreach:{title:'A community organization requests an outreach clinic',public:true,options:[
    ['Fund the outreach clinic',2900,7,2,5,'The event served local residents and generated referrals across the area.'],
    ['Offer staff time and printed referral information',700,3,1,2,'The organizers linked residents with appointments and community services.']]},
  audit:{title:'The regional oversight board announces a clinic review',public:true,options:[
    ['Fund corrective work and publish the board’s summary',6600,4,7,3,'The clinic adopted the corrective plan and published an independently reviewed summary.'],
    ['Request staged compliance monitoring',1300,-4,2,0,'The board granted staged monitoring. Restrictions on new procedures stay in place this year.']]},
  payer:{title:'A regional insurer proposes a lower-rate contract',public:true,options:[
    ['Sign a one-year access agreement',1000,4,1,4,'More patients gained in-network access. Civic Health reimbursements are lower this year.'],
    ['Decline the contract and protect existing visits',600,1,1,0,'Existing patients kept their scheduled appointments and the clinic retained its current rates.']]},
  recovery:{title:'A public quality review recognizes the clinic’s improvement',public:true,options:[
    ['Share the clinic’s improvement plan with peers',800,5,3,2,'Other clinics adopted the process and the local medical association invited you to speak.'],
    ['Reinvest the attention in staff mentoring',1500,2,5,1,'The clinic put mentoring time on the schedule and increased staff retention.']]}
};
