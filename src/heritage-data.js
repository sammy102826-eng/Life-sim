const ERA_STARTS=[1970,1980,1990,2000,2010,2020];
const ERA_PRESENT=2026;
const ERA_BIRTH_YEARS=[1950,1960,...ERA_STARTS];
const ERA_TECH=[
 [1950,'Tabletop radio',45], [1963,'Film camera',85],
 [1970,'Portable transistor radio',32], [1971,'Instant camera',85], [1972,'Home game console',110],
 [1976,'Video cassette recorder',780], [1979,'Portable cassette player',150],
 [1981,'Home personal computer',1150], [1983,'Portable CD player',290], [1984,'Camcorder',940],
 [1989,'Handheld game console',115], [1991,'Dial-up desktop computer',1210], [1993,'Pager',95],
 [1996,'Digital camera',460], [1998,'Portable MP3 player',180], [2000,'DVD player',230],
 [2001,'Flip phone',210], [2004,'Portable GPS navigator',280], [2007,'Touchscreen smartphone',520],
 [2010,'Tablet',430], [2012,'Streaming media box',95], [2015,'Smartwatch',315], [2017,'Consumer VR headset',425],
 [2020,'Foldable smartphone',1170], [2021,'Handheld gaming PC',560], [2023,'Mixed-reality headset',860],
 [2025,'Satellite-capable smartphone',920]
];
const ERA_CLASSIC_CARS=[
 [1968,'Volkswagen Beetle','Used compact sedan',2600], [1970,'Datsun 510','Used compact sedan',2400],
 [1970,'Ford Mustang Mach 1','Sports coupe',7200], [1972,'Honda Civic CVCC','Compact hatchback',6200],
 [1974,'Volkswagen Golf','Compact hatchback',6800], [1981,'BMW 7 Series E23','Luxury sedan',22000],
 [1983,'Toyota Corolla AE86','Compact hatchback',8300], [1984,'Chrysler Voyager','Minivan',11200],
 [1990,'Mazda MX-5 NA','Sports roadster',13100], [1993,'Toyota Supra A80','Sports coupe',35900],
 [1995,'Honda CR-V first generation','Compact SUV',16900], [1997,'Volvo V70','Wagon',23400],
 [2000,'Toyota Prius first generation','Hybrid compact',19500], [2002,'Mini Cooper R50','Compact hatchback',17200],
 [2004,'Ford Mustang S197','Sports coupe',23500], [2006,'Honda Fit first generation','Compact hatchback',14500],
 [2010,'Nissan Leaf first generation','Electric hatchback',32200], [2012,'Tesla Model S','Luxury electric sedan',63400]
];
const ERA_CAR_YEARS={
 '2008 Honda Civic':2008,'2012 Toyota Corolla':2012,'Tesla Model 3':2017,'Tesla Model Y':2020,
 'BMW M4':2014,'Lucid Air':2021,'Rivian R1S':2022,'Kia Telluride':2019,'Kia K4':2024,
 'Aston Martin DB12':2023,'Ferrari 296 GTB':2022,'McLaren Artura':2022,'Ford Bronco':2021,
 'Lamborghini Huracán':2014,'Lexus LC':2017,'Rolls-Royce Cullinan':2018,'Genesis G70':2017
};
const DIG_REGIONS={
 Italy:['Port Quarter','Trade roads and ceramics'],
 Greece:['Hillside Settlement','Households and early trade'],
 Egypt:['River Terrace','River settlements and workshops'],
 Turkey:['Market Mound','Markets and layered settlements'],
 'Saudi Arabia':['Caravan Station','Trade routes and wells'],
 Morocco:['Coastal Kiln District','Ceramics and maritime trade'],
 Ethiopia:['Highland Terrace','Agriculture and settlement'],
 Kenya:['Inland Trading Post','Trade networks and material culture'],
 Mexico:['Courtyard Settlement','Architecture and everyday life'],
 Peru:['Valley Workshop','Agriculture and textiles'],
 India:['Riverbank Workshop','Craft production and exchange'],
 Jordan:['Caravan Courtyard','Water management and regional trade'],
 Tunisia:['Harbor Warehouse','Mediterranean exchange']
};
const DIG_STRATA=[
 ['Surface deposits','0.2–0.6 m',12],
 ['Occupation layer','0.6–1.3 m',32],
 ['Sealed foundation','1.3–2.5 m',57]
];
const DIG_FINDS={
 pottery:['Inscribed pottery fragment','Fired clay',820,0], coin:['Merchant token','Copper alloy',1350,0],
 weight:['Trade weight','Stone',780,0], glass:['Decorated glass vessel','Glass',2420,1],
 plaque:['Workshop maker’s plaque','Terracotta',3400,1], textile:['Woven textile fragment','Plant fiber',3850,1],
 tablet:['Inscribed tablet','Stone',7800,2], mosaic:['Mosaic panel','Stone and glass',9400,2],
 seal:['Carved seal','Steatite',6700,2], charcoal:['Hearth sample','Charcoal',115,0],
 fastener:['Bronze dress pin','Bronze',1850,0], wood:['Carved wooden fitting','Wood',1940,1]
};
const MUSEUM_WINGS={main:['Main gallery',8,0],study:['Study gallery',6,42000],community:['Community wing',10,78000],climate:['Climate-controlled wing',14,138000]};
const MUSEUM_STAFF={guide:['Guide',23500,2],conservator:['Conservator',37200,2],security:['Security officer',26400,2],curator:['Curator',45200,1]};
const HERITAGE_EVENTS={
 water:['Rain threatens an exposed layer','A storm has exposed part of a fragile wall. The team needs a plan before digging resumes.',[
  ['Fund a protective shelter',2100,6,'survey'],['Cover the area and suspend digging',0,2,'pause'],['Document the exposed section',400,0,'survey']]],
 review:['Community requests a provenance review','Local representatives want to verify where a set of finds was recovered and who should care for it.',[
  ['Open the site records to the review',600,7,'research'],['Deposit the disputed object with the local archive',0,5,'deposit'],['Pause work until the review is complete',0,0,'pause']]],
 grant:['A research council offers field funding','The award would pay for conservation and public reports. Accepting it comes with an obligation to document the next season.',[
  ['Accept the reporting conditions',0,4,'grant'],['Ask for access to the reference archive',0,2,'research'],['Decline and keep the current plan',0,0,'none']]],
 leak:['Humidity rises in a museum wing','The conservator reports a humidity spike that could damage the collection.',[
  ['Repair the climate controls',2700,5,'condition'],['Move fragile pieces into storage',0,1,'crate'],['Shorten opening hours during repairs',550,1,'quiet']]],
 schools:['Local schools ask for museum access','Teachers want supervised visits for students who cannot afford the normal ticket price.',[
  ['Reserve free guided visits',1200,7,'outreach'],['Offer discounted group visits',250,4,'trips'],['Keep the existing schedule',0,0,'none']]],
 exhibit:['A regional museum proposes a traveling exhibition','The invitation offers an audience for your collection. Packing, supervision, and lending terms will affect the opening.',[
  ['Join and fund professional packing',2300,8,'exhibit'],['Host a visiting curator locally',500,4,'outreach'],['Keep the collection on site',0,0,'none']]],
 claim:['A claim challenges a museum acquisition','New documentation suggests that an item may belong with its source community.',[
  ['Return it with a public explanation',0,8,'museumDeposit'],['Commission an independent review',1000,5,'condition'],['Restrict access while gathering evidence',0,1,'crate']]]
};
