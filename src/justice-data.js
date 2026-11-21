/* Fictional jurisdictions share these gameplay sentencing bands. */
const JUSTICE_OFFENSES={
 shoplifting:['Shoplifting','Theft',12,1,1,'judge',58,15,180,55],
 theft:['Theft','Theft',13,1,2,'judge',49,60,900,63],
 grand:['Grand theft','Theft',16,2,5,'jury',43,2200,14500,68],
 vehicle:['Grand theft auto','Theft',16,2,6,'jury',38,3000,21000,71],
 burglary:['Burglary','Theft',16,2,7,'jury',40,850,9300,70],
 bank:['Bank robbery','Theft',18,6,16,'jury',27,12000,86000,80],
 vandalism:['Vandalism','Personal',12,1,2,'judge',46,0,0,60],
 harassment:['Harassment','Personal',15,1,2,'judge',48,0,0,61],
 assault:['Assault','Personal',16,1,5,'jury',36,0,0,70],
 officer:['Assault on an officer','Public order',16,3,8,'jury',23,0,0,78],
 homicide:['Murder','Personal',18,25,40,'jury',15,0,0,87,false],
 trespass:['Trespass','Public order',13,1,2,'judge',50,0,0,57],
 identity:['Identity fraud','Business',16,2,5,'jury',41,1200,9500,69],
 fraud:['Financial fraud','Business',18,2,8,'jury',40,3200,22000,73],
 embezzle:['Embezzlement','Business',18,2,9,'jury',37,2500,28000,74],
 tax:['Tax evasion','Business',18,1,5,'judge',43,1200,14000,73],
 smuggling:['Smuggling','Organized crime',18,3,10,'jury',35,4200,41000,75],
 racket:['Extortion','Organized crime',18,3,11,'jury',32,2300,31000,78],
 bribery:['Bribery','Public order',16,1,4,'judge',34,0,0,71],
 resisting:['Resisting arrest','Public order',13,1,3,'judge',36,0,0,74],
 escape:['Escape from custody','Public order',14,1,4,'judge',22,0,0,80,false],
 legacy:['Prior offense','Public order',12,1,4,'judge',35,0,0,65]
};
const JUSTICE_VISIBLE={
 Theft:['shoplifting','theft','grand','vehicle','burglary','bank'],
 Personal:['vandalism','harassment','assault'],
 Business:['identity','fraud','embezzle','tax'],
 'Public order':['trespass'],
 'Organized crime':['smuggling','racket']
};
const JUSTICE_PLANS={
 prop:['Scene prop',['Empty hands','Cardboard prop','Foam prop','Sealed prop case']],
 outfit:['Costume',['Plain clothes','Retro costume','Stage jacket','Oversized mascot costume','Formal outfit']],
 vehicle:['Scene vehicle',['Prop van','Studio car','Background taxi','Illustrated shuttle','Toy roadster']],
 time:['Scene time',['Morning scene','Afternoon scene','Evening scene','Night scene']]
};
const JUSTICE_DEFENSES=[
 ['Represent yourself',0,20],['Public defender',0,48],['Defense attorney',6800,66],['Senior defense counsel',19500,83]
];
const JUSTICE_APPEALS=[['Assigned appeals counsel',4500,38],['Appellate attorney',14500,56],['Senior appellate counsel',38000,73]];
const JUSTICE_EVIDENCE=['A witness came forward with a statement','An investigator located financial records','An independent review linked records to the old report','A lab reported a possible trace match at the scene','An archived incident report was reopened'];
const JUSTICE_NAMES=['Alex','Noor','Jordan','Morgan','Ravi','Inez','Elias','Reese','Amina','Sofia','Mara','Theo','Robin','Maya','Dara','Emery','Lin','Cesare'];
const JUSTICE_LAST=['Ford','Park','Baker','Chen','Ramos','Quinn','Patel','Sato','Ortiz','Nguyen','Reed','Cruz','Nadir','Stone','Blake','Ali','Reyes'];
const PRISON_JOBS={
 laundry:['Laundry',310,52,0], cleaner:['Custodial work',225,25,0], kitchen:['Kitchen assistant',340,55,0],
 plates:['Plate workshop',430,70,16], library:['Library aide',275,65,0], grounds:['Grounds crew',285,48,0]
};
const PRISON_STORE={
 soap:['Soap and toiletries',24,2,0,false], stamps:['Stamps and stationery',18,2,0,false],
 snack:['Commissary snacks',32,3,0,false], book:['Paperback book',28,1,1,false],
 clothes:['Extra socks and undershirt',40,2,0,false], game:['Puzzle book',17,1,1,false],
 pills:['Restricted pills',160,-4,0,true], blade:['Prohibited sharp object',240,-7,0,true]
};
const PRISON_GANGS=[['Foundry Circle',58],['Grey Lanterns',48],['North Block',64]];
const PRISON_EVENTS=[
 ['letter','A letter arrived from someone close to you.',['Write back thoughtfully','Keep the letter for later'],[7,2],[2,0]],
 ['visit','A family member requested a supervised visit.',['Accept the visit','Ask to keep in touch by letter'],[7,3],[3,1]],
 ['library','A librarian has a place in a reading group.',['Join the reading group','Ask for a book to read alone'],[3,1],[5,3]],
 ['hearing','Your unit wants a representative at a grievance meeting.',['Speak up at the hearing','Encourage someone else to attend'],[4,1],[4,0]],
 ['count','A delayed count disrupted the schedule.',['Stay calm and help someone nearby','Ask a guard for an update'],[3,1],[4,2]],
 ['work','The workshop asked for help training new workers.',['Help with orientation','Keep your existing assignment'],[4,1],[5,1]],
 ['recruit','A prison group invited you to an informal meeting.',['Decline and keep your distance','Hear them out'],[1,4],[5,-4]],
 ['room','A disagreement broke out in the shared room.',['Request mediation','Ask for space'],[2,1],[4,2]],
 ['health','The clinic offered a routine wellness appointment.',['Attend the appointment','Ask for a later appointment'],[2,0],[3,1]],
 ['course','A classroom place opened for the next term.',['Enroll in a skills class','Pass the place to someone else'],[2,1],[6,2]],
 ['store','The store offered to replace an incorrect order.',['Ask for the replacement','Donate the item to the unit'],[1,4],[2,3]],
 ['review','The reentry counselor offered a planning session.',['Make a release plan','Ask for a written resource list'],[2,1],[6,3]]
];
const CIVIL_TYPES={
 assault:['Personal injury from an assault',24000,64], theft:['Stolen property',9500,59],
 firing:['Wrongful termination',42000,58], contract:['Breach of contract',28000,67],
 property:['Damage to property',15500,63], detention:['Wrongful detention',33000,60]
};
const CIVIL_INCIDENTS={
 theft:['A personal item went missing and a witness identified a possible defendant.','A disputed property sale left you without the item you paid for.'],
 assault:['An argument at a public event left you injured. A witness offered to help.','A confrontation at a venue caused injuries and a security report was filed.'],
 firing:['You received a dismissal notice that conflicts with the written employment terms.'],
 contract:['A contractor took an advance and disputed the work they agreed to finish.','A business rejected a written refund agreement.'],
 property:['A delivery damaged your belongings. The company disputes responsibility.','A repair service returned an item in worse condition.']
};
const CIVIL_STAGES={
 investigation:['Investigation and records',['Gather receipts and records','Request a written witness account','Hire an independent reviewer'],[420,190,1600]],
 discovery:['Discovery and evidence exchange',['Request targeted documents','Interview a relevant witness','Retain a specialist reviewer'],[850,560,2300]],
 negotiation:['Negotiation',['Ask for a settlement conference','Make a narrow counteroffer','Prepare for trial'],[650,410,900]],
 trial:['Civil trial',['Present the documented losses','Focus on witness accounts','Challenge the defense evidence'],[1800,1250,2350]],
 appeal:['Civil appeal',['Preserve the record and seek review','Finalize the judgment'],[4500,0]]
};
