const PI_PATROL_YEARS=3;
const PI_DETECTIVE_YEARS=3;
const PI_START_COST=36000;
const PI_STAFF={
 analyst:['Records analyst',14500,1800,'records'], liaison:['Client liaison',18200,2500,'interview'],
 reviewer:['Senior investigator',30000,4200,'review']
};
const PI_CASES={
 relationship:['Relationship inquiry',0,2300,5,'A client wants an evidence-based account. Work from consent and material the client can share.'],
 property:['Misplaced family property',0,1640,4,'A family wants help accounting for an item in a private collection.'],
 claims:['Insurance chronology',5,4200,6,'An insurer needs a timeline and independent corroboration of a disputed claim.'],
 missing:['Missing person assistance',12,6400,7,'Work with authorized contacts and refer credible safety information to the appropriate public agency.'],
 theft:['Contents of a robbery case',18,7350,7,'A victim’s representative needs a documented inventory and evidence discrepancies to share with police.'],
 fraud:['Contract and invoice dispute',23,9150,8,'A business client wants to know which records conflict before approaching counsel.'],
 witness:['Witness account review',28,10900,8,'A lawyer needs separate accounts compared closely for gaps and contradictions.'],
 artwork:['Missing artwork recovery',34,16700,9,'A collection is missing a piece. Corroborate previous ownership and provide a referral.'],
 accident:['Accident file reconstruction',40,18700,9,'An attorney wants a chronology of contemporaneous statements and records.'],
 corruption:['Public contract review',52,24000,10,'A newsroom and its attorney want independent confirmation before publishing a claim.'],
 murder:['Cold-case murder review',64,33800,11,'Defense counsel requests a review of disclosed evidence. Document inconsistencies and pass new leads to counsel.'],
 institutional:['Institutional missing-persons file',76,48500,11,'Multiple organizations have agreed to an independent review of records and unresolved discrepancies.']
};
const PI_METHODS={
 interview:['Interview a willing witness',150,12],records:['Review authorized records',220,15],
 review:['Corroborate the timeline',390,18],referral:['Consult counsel or the case liaison',220,10]
};
const PI_EVENTS={
 publicity:['A high-profile file draws press attention','Reporters want a public comment on the work. The client’s privacy and the agency’s reputation are at stake.',true,[
  ['Release a redacted progress statement',1100,5,'credit'],['Refer inquiries to the client’s attorney',0,3,'trust'],['Decline to comment',0,0,'none']]],
 jurisdiction:['An agency asks you to hand over a credible lead','The client wants a quick answer. An authorized agency requests that your team preserve and share its records.',true,[
  ['Document the handoff and share the lead',700,7,'credit'],['Ask counsel to coordinate the handoff',950,5,'protect'],['Pause the file pending written instructions',0,-2,'wait']]],
 grant:['A community group funds missing-persons work','The funding would pay for an independent review. The agency must publish an anonymized account of how the funds were used.',true,[
  ['Accept the grant and reporting terms',0,5,'grant'],['Offer a limited pro bono review',1400,8,'credit'],['Decline the funding',0,0,'none']]],
 conflict:['A possible conflict of interest surfaces','Someone connected to a new client previously worked with your agency on a different matter.',false,[
  ['Assign an independent reviewer',1350,4,'protect'],['Disclose the conflict and offer a handoff',0,3,'trust'],['Pause while counsel assesses the risk',0,0,'wait']]],
 witness:['A witness corrects an earlier statement','The revised account contradicts a useful lead. The client has already heard the original version.',false,[
  ['Flag both accounts and verify the revision',740,5,'credit'],['Tell the client and extend the review',0,2,'wait'],['Mark the disputed lead inconclusive',0,2,'trust']]],
 security:['A client file needs stronger protection','A routine review found that the archive needs an upgrade before another case team can access it.',false,[
  ['Pay for independent archive review',2100,6,'protect'],['Suspend intake for one month',0,2,'intake'],['Narrow staff access temporarily',0,-2,'wait']]],
 appeal:['An attorney questions a published conclusion','A disputed finding appeared in the public record. The firm can review it openly or issue a correction.',true,[
  ['Commission a second independent review',3500,7,'protect'],['Publish a correction with counsel',500,5,'trust'],['Leave the finding for the court to assess',0,-3,'none']]],
 overtime:['An investigator warns that workloads are too high','Several clients have asked for updates. Staff want time to check their work before the next report.',false,[
  ['Pay for another review shift',1650,4,'credit'],['Renegotiate deadlines with clients',0,2,'wait'],['Close intake for a month',0,3,'intake']]]
};
