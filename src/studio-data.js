const STUDIO_GENRES=['Drama','Comedy','Action','Romance','Mystery','Science fiction','Fantasy','Horror','Documentary','Family','Musical','Historical'];
const STUDIO_MEDIA={film:['Feature film',1],series:['TV series',1.32],limited:['Limited series',1.16],short:['Short film',.47]};
const STUDIO_FORMATS={live:['Live action',1],animation:['Animation',1.25],stop:['Stop-motion',1.39],mixed:['Mixed media',1.12]};
const STUDIO_RATINGS=['G','PG','PG-13','R','Unrated'];
const STUDIO_STAGES={writing:'Writing',casting:'Casting',filming:'Filming',post:'Post-production',marketing:'Marketing',future:'Future releases',released:'Released',cancelled:'Shelved'};
const STUDIO_ROLES={lead:['Lead',42000,2],support:['Supporting',17500,3],background:['Background ensemble',3500,2],voice:['Voice lead',28000,2]};
const STUDIO_CREW={writer:['Writer',22000],director:['Director',57000],producer:['Line producer',52000],editor:['Editor',40000],crew:['Production coordinator',39000]};
const STUDIO_ASSETS=[
  ['Editing workstations',45000,2400,'post',.14],
  ['Equipment package',85000,5900,'filming',.14],
  ['Soundstage',295000,19500,'filming',.25],
  ['Animation suite',235000,16200,'filming',.23],
  ['Mixing room',120000,7800,'post',.23]
];
const STUDIO_OUTLETS={
  festival:{name:'Lantern Festival Circuit',channel:'theater',reach:.85,share:.56,min:0,fee:8000},
  indie:{name:'Marquee Independent Cinemas',channel:'theater',reach:1.12,share:.48,min:24,fee:16500},
  national:{name:'Grandline Theatres',channel:'theater',reach:1.65,share:.43,min:55,fee:53000},
  local:{name:'Beacon Cable',channel:'cable',reach:.93,share:.62,min:0,fee:9300},
  coast:{name:'Crestview Television',channel:'cable',reach:1.43,share:.56,min:43,fee:31000},
  frame:{name:'Framehouse Streaming',channel:'streaming',reach:.95,share:.58,min:0,fee:5500},
  current:{name:'Current+, Streaming',channel:'streaming',reach:1.28,share:.51,min:37,fee:17000},
  atlas:{name:'Atlas Screen',channel:'streaming',reach:1.55,share:.47,min:61,fee:36000}
};
const STUDIO_EXPENSES=['Staff','Writing','Casting','Filming','Post-production','Marketing','Movie theaters','Cable','Streaming','Equipment upkeep','Investor payouts','Incident responses','Interest'];
const STUDIO_INCOME=['Movie theaters','Cable','Streaming','Library licenses','Rights sales'];
const STUDIO_AWARDS=['Directing','Screenplay','Ensemble','Production craft','Audience award'];
const STUDIO_FIRST=['Morgan','Marin','Reva','Inez','Julian','Talia','Sasha','Drew','Rowan','Kenji','Nico','Amara','Luca','Noa','Celeste','Dara','Rafi','Alina','Tomas','Hana','Jules','Paola','Tess','Emil','Anika','Avery','Micah','Conrad','Lina','Rosa'];
const STUDIO_LAST=['Hart','Duval','Sato','Perry','Basran','Cole','Shah','Vega','Ito','Pike','Okafor','Sayeed','Gomez','Kim','Frost','Stone','Bennett','Cruz','Patel','Wolfe','Liu','Rivera','Santos','Nolan','Sokolov','Chen','Quinn','Yuan','Romero','Park'];
const STUDIO_RIVALS=['Golden Hour Pictures','Blue Meridian Studios','Copperlight Productions','Northline Entertainment','Horizon Lantern','Juniper Filmworks','Snowline Media'];
const STUDIO_INCIDENTS={
  equipment:{headline:'A rental equipment failure interrupted production',public:false,choices:[
    ['Rent a backup package',16000,1,0,0,0,'The replacement arrived and the schedule held.'],
    ['Replan the shoot around available equipment',3000,-3,0,0,0,'Production stayed open with a smaller visual setup.']]},
  weather:{headline:'Bad weather washed out an exterior filming day',public:false,choices:[
    ['Book a covered alternative',11000,0,0,0,0,'The location team kept the production moving.'],
    ['Wait for the original location',2800,2,0,1,0,'The crew preserved the original look and moved the filming date.']]},
  actor:{headline:'A lead performer requested a schedule change',public:false,choices:[
    ['Pay for an extra booking block',10500,2,0,0,7,'The performer stayed and appreciated the revised schedule.'],
    ['Reorder the scenes and shorten the block',3200,-2,0,0,-4,'The schedule held, but the performer is less eager to return.']]},
  edit:{headline:'A test screening flagged a confusing section',public:false,choices:[
    ['Fund an additional edit pass',13500,6,0,0,0,'The new cut tested more clearly.'],
    ['Keep the cut and clarify the marketing',3800,-1,0,0,0,'The campaign was adjusted to set clearer expectations.']]},
  music:{headline:'A music clearance fell through in post-production',public:false,choices:[
    ['Commission original music',14500,5,0,0,0,'The film cleared licensing with a new original score.'],
    ['Use an existing cleared library track',2200,-2,0,0,0,'The team preserved the schedule with a simpler score.']]},
  location:{headline:'A filming location changed its access conditions',public:false,choices:[
    ['Negotiate a revised agreement',8100,1,0,0,0,'The location owner agreed to a shorter permit window.'],
    ['Rework the affected scene',2800,-2,0,0,0,'The rewritten scene avoided the disputed site.']]},
  safety:{headline:'A publicly reported stunt incident halted filming',public:true,choices:[
    ['Fund an outside safety review and pause filming',23500,4,5,1,4,'The studio postponed filming and implemented independent recommendations.'],
    ['Shift the production to an alternate scene plan',13000,-1,1,0,1,'The original sequence was dropped and the production schedule was revised.'],
    ['Suspend the project pending review',0,-3,-2,1,-3,'The production stayed suspended for another year.']]},
  rights:{headline:'A public rights dispute threatens a scheduled release',public:true,choices:[
    ['Clear the disputed material',19500,2,4,0,1,'The licenses were secured and the release date held.'],
    ['Replace the disputed material',9500,-2,2,1,0,'The new material cleared review. The release moved back one year.'],
    ['Postpone distribution',0,-2,-3,1,0,'The premiere was postponed while the studio reworked the agreement.']]},
  leak:{headline:'An unfinished cut leaked online',public:true,choices:[
    ['Release an official preview and explain the unfinished cut',12000,0,5,0,1,'The studio redirected attention to the authorized preview.'],
    ['Issue a statement and continue the existing campaign',2000,0,1,0,0,'The release stayed on schedule and the team protected the remaining material.'],
    ['Keep the campaign quiet',0,0,-2,0,0,'Speculation continued and audience awareness fell.']]},
  festival:{headline:'A festival requested an early gala screening',public:true,choices:[
    ['Fund a premiere appearance',11000,0,5,0,3,'The gala secured press coverage and strengthened exhibitor contacts.'],
    ['Provide a recorded introduction',3000,0,2,0,1,'The festival screened the project with a recorded introduction.'],
    ['Keep the planned premiere',0,0,0,0,0,'The studio kept the original release plan.']]},
  crew:{headline:'Production staff raised a public scheduling dispute',public:true,choices:[
    ['Fund a mediated scheduling agreement',15000,3,4,1,5,'The team agreed to revised schedules and retained the core crew.'],
    ['Use the negotiated minimum and redesign the shoot',7000,-1,1,0,-2,'The production reduced its shoot while protecting the agreed conditions.'],
    ['Wait for the next available shoot window',0,-2,-2,1,-4,'Filming moved back and crew relationships weakened.']]}
};
