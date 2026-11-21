/* Fictional issuers and simplified country tax schedules used only in the simulation. */
const FINANCE_BANKS=[
 {id:'FFB',apy:1.05,high:0,card:'Starter Card',reward:.5},
 {id:'MCU',apy:1.65,high:4.15,card:'Rewards Card',reward:1.25},
 {id:'NVB',apy:2.30,high:4.6,card:'Platinum Card',reward:2}
];
const FINANCE_COMPANIES=[
 ['FFB','First Federal','finance',54,11,true],['MCU','Metro Credit Union','finance',0,7,false],
 ['NVB','NovaBank Online','finance',37,17,true],['VLT','Voltline Systems','technology',81,29,true],
 ['ORX','Orchard Diagnostics','services',46,20,true],['HBR','Harbor Freight Works','industry',32,18,true],
 ['GLN','Greenline Renewables','energy',29,33,true],['RIV','Rivergrain Foods','agriculture',27,13,true],
 ['MDS','Meridian Software','technology',108,23,true],['WVN','Woven Retail Group','services',42,17,true],
 ['FSP','Firefly Sensors','technology',2.25,52,true],['NQL','North Quarry Labs','industry',1.6,57,true],
 ['SLT','Saltline Storage','energy',3.1,48,true],['RDM','Redmill Robotics','technology',0,35,false],
 ['PLM','Paloma Logistics','industry',0,19,false]
];
const FINANCE_FUND_DEFS={
 'F:BLEND':['Broad market mutual fund',['FFB','ORX','HBR','WVN','VLT','RIV','NVB','MDS'],[.12,.12,.11,.1,.17,.12,.11,.15],.55],
 'F:GROW':['Innovation mutual fund',['VLT','MDS','GLN','ORX'],[.35,.35,.15,.15],.85],
 'F:VALUE':['Dividend and value fund',['FFB','RIV','HBR','WVN'],[.27,.27,.24,.22],.45]
};
const FINANCE_COIN_DEFS={
 'C:ARC':['Arc Token',36,55], 'C:ORB':['Orbit Coin',135,48], 'C:GLD':['Grid Ledger',15,64]
};
const FINANCE_BOND_DEFS={
 'B:GOV':['Government Treasury',null,3.5,4],
 'B:FFB':['First Federal senior bond','FFB',4.3,5],
 'B:HBR':['Harbor Freight Works bond','HBR',6,5],
 'B:GLN':['Greenline expansion bond','GLN',7.2,6]
};
const FINANCE_LOTTERIES={
 daily:{name:'Community Draw',cost:2,odds:160,base:1200,ticketLimit:250,secondary:18},
 city:{name:'City Millions',cost:5,odds:18000,base:125000,ticketLimit:400,secondary:65},
 national:{name:'National Jackpot',cost:10,odds:650000,base:3000000,ticketLimit:500,secondary:225}
};
const FINANCE_TAX_DEFAULT={allow:10000,child:1450,charity:.10,car:8,home:3,jewelry:9,other:7,estate:18,estateFree:130000,gains:16,lottery:20,retirement:5200};
const FINANCE_TAX={
 'United States':{allow:14500,child:2000,charity:.18,car:7,home:1.6,jewelry:8,other:7,estate:22,estateFree:950000,gains:15,lottery:24,retirement:6500},
 Canada:{allow:15100,child:1600,charity:.16,car:12,home:2.5,jewelry:12,other:12,estate:15,estateFree:180000,gains:13,lottery:0,retirement:6200},
 'United Kingdom':{allow:12800,child:1320,charity:.14,car:20,home:4,jewelry:20,other:20,estate:27,estateFree:335000,gains:17,lottery:0,retirement:6200},
 Germany:{allow:12200,child:1740,charity:.10,car:19,home:5.2,jewelry:19,other:19,estate:18,estateFree:260000,gains:23,lottery:0,retirement:5600},
 France:{allow:11300,child:1550,charity:.16,car:20,home:5.5,jewelry:20,other:20,estate:23,estateFree:160000,gains:21,lottery:0,retirement:5400},
 Japan:{allow:8600,child:1150,charity:.10,car:10,home:3,jewelry:10,other:10,estate:24,estateFree:260000,gains:18,lottery:0,retirement:4700},
 Australia:{allow:15000,child:1560,charity:.15,car:10,home:4,jewelry:10,other:10,estate:0,estateFree:0,gains:16,lottery:0,retirement:6400},
 'United Arab Emirates':{allow:0,child:0,charity:.04,car:5,home:2,jewelry:5,other:5,estate:0,estateFree:0,gains:0,lottery:5,retirement:3200},
 India:{allow:5700,child:900,charity:.08,car:18,home:5,jewelry:5,other:12,estate:0,estateFree:0,gains:14,lottery:30,retirement:3000},
 'Switzerland':{allow:13500,child:1800,charity:.12,car:8.1,home:2,jewelry:8.1,other:8.1,estate:9,estateFree:280000,gains:7,lottery:12,retirement:6200}
};
const FINANCE_REGIONAL={
 'South Korea':[10500,10,3.1,10,24,190000,22,22],Italy:[9800,22,5,22,12,150000,26,14],
 Spain:[11200,21,5.6,21,19,175000,19,20],Sweden:[14100,25,1.5,25,0,0,24,0],
 Poland:[9600,23,2,23,12,94000,19,10],Ukraine:[5100,20,2.4,20,8,75000,15,15],
 Palestine:[5300,16,2.5,16,8,65000,12,12],Brazil:[7100,13,3,15,9,110000,17,25],
 Mexico:[8250,16,2.3,16,0,0,12,7],Argentina:[6900,21,3.5,21,10,85000,15,22],
 Indonesia:[6600,11,2.5,11,0,0,12,20],'South Africa':[7600,15,3.4,15,18,175000,17,0],
 Nigeria:[4900,7.5,2.6,7.5,8,72000,12,15],Egypt:[4600,14,2.5,14,0,0,11,20],
 Turkey:[7900,20,4,20,13,110000,16,18],'Saudi Arabia':[0,15,5,15,0,0,0,5],
 Pakistan:[4900,18,3,18,7,69000,10,20],Vietnam:[5900,10,2.4,10,10,79000,13,12],
 Philippines:[6300,12,2.2,12,6,90000,15,20],China:[8700,13,3,13,0,0,20,20],
 Russia:[9400,20,2,20,0,0,13,13],Iran:[4800,10,2.8,10,12,88000,14,18],
 'North Korea':[0,4,1,4,0,0,0,5]
};
const FINANCE_EVENTS={
 statement:['A duplicate charge appeared on your payment statement',[['Dispute and document the charge','dispute'],['Accept the account adjustment','credit']]],
 reserve:['Your bank invited you to build an emergency reserve',[['Move funds into savings','save'],['Keep the money available','wait']]],
 education:['A local financial workshop has open seats',[['Attend and update your budget','learn'],['Decline the invitation','wait']]],
 rebate:['A utility issued a billing credit',[['Take the cash rebate','rebate'],['Apply it to next year’s expenses','utility']]],
 records:['Your accountant found incomplete donation records',[['Organize the records','records'],['Keep the existing records','wait']]],
 bonus:['A credit union offered a membership reward',[['Accept the member dividend','dividend'],['Direct it to local aid','aid']]],
 contract:['A vendor offered an early repayment discount',[['Take the discount if you can afford it','early'],['Keep the existing payment plan','wait']]],
 security:['A bank security review flagged an unfamiliar account attempt',[['Lock new credit applications for a year','lock'],['Review and leave credit open','watch']]]
};
