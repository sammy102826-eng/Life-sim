const CLEANUP_HEADLINES={
 all:[
  ['Libraries add evening opening hours','Residents will have more time for study and public services.'],
  ['City parks gain a new network of paths','Community groups helped choose routes and signage.'],
  ['A regional archive publishes newly indexed records','Local historians can now browse records that were previously available by appointment.'],
  ['Council reviews pedestrian crossings','The review includes routes used by schoolchildren and older residents.'],
  ['A former station becomes a community hall','The renovation retained the building’s original waiting room.'],
  ['Volunteers rebuild a riverside garden','The new planting includes a section maintained by nearby schools.'],
  ['Local classrooms share an exhibition','Students and teachers contributed objects and stories from their neighborhoods.'],
  ['Community nurses extend drop-in hours','The extra sessions focus on routine questions and preventive care.']],
 international:[
  ['Regional rail partners coordinate timetables','The agreement will connect more passenger services across borders.'],
  ['Researchers share coastal monitoring data','Several institutes are contributing observations to the same public record.'],
  ['Neighboring countries revise flood plans','Emergency agencies agreed to share early warnings and planning resources.'],
  ['Cross-border scholarship program expands','The new application cycle includes more language and research placements.'],
  ['Conservation teams publish a wildlife survey','The joint report tracks changes in habitat across several regions.'],
  ['Ports agree on a shared safety schedule','Shipping authorities will exchange inspection records and publish annual findings.'],
  ['Museums sign a rotating loan agreement','Public collections will exchange exhibits with documented provenance.'],
  ['Public health agencies share seasonal findings','The report compares community programs and identifies regions for continued study.']],
 business:[
  ['Suppliers open a regional distribution center','Retailers expect shorter delivery times once the new routes are running.'],
  ['Independent manufacturers publish annual orders','The survey points to uneven demand between sectors.'],
  ['Two retailers trial a shared logistics network','Both will keep separate stores while sharing part of the distribution operation.'],
  ['Small businesses turn to local lenders','A new report tracks which firms obtained financing this year.'],
  ['Consumer spending shifts toward services','Analysts are comparing the change to the previous year’s household budget data.'],
  ['An industry group updates product standards','Members will start publishing the new information with their next catalog.'],
  ['Regional lenders review their small-business terms','The revised offers emphasize repayment schedules and business records.'],
  ['A trade fair draws more independent exhibitors','Smaller companies presented alongside the established firms.']],
 crime:[
  ['Annual community safety report published','The figures include reported property incidents and vary with local conditions.'],
  ['Courts publish updated case-processing figures','The report looks at how long different kinds of cases take to reach a hearing.'],
  ['A public evidence archive reopens','The archive offers public reports and aggregated statistics while protecting private records.'],
  ['Neighborhood groups discuss theft prevention','Residents, shops, and local agencies compared their priorities at an open meeting.'],
  ['A case review identifies documentation gaps','The review recommends clearer records and a better process for correcting earlier accounts.'],
  ['Consumer protection office reports disputed invoices','Its summary compares trends across reports submitted this year.'],
  ['Police publish their annual recovered-property summary','Local agencies reported which categories were most often returned to their owners.'],
  ['Community groups review reporting access','The discussion focused on how residents can reach local services.']],
 fun:[
  ['Goose interrupts a professional ribbon cutting','The ceremony resumed after the guest stopped inspecting the ribbon.'],
  ['Library’s most borrowed book is a book about overdue books','The librarian said this was both encouraging and inconvenient.'],
  ['A pie contest runs out of plates','Judges improvised and insisted this counted as an additional category.'],
  ['Owl lands on a birdwatching club’s schedule','Members agreed it was the closest they had come to a punctual guest all year.'],
  ['Town votes to keep its leaning Christmas tree','Residents said it had earned the right to stay exactly where it was.'],
  ['Volunteer choir finishes early after skipping the encore','The audience applauded the unexpectedly short commute home.'],
  ['Museum discovers a visitor left a review in its complaint box','The review gave five stars for the benches.'],
  ['Flower show awards a prize to an uninvited sunflower','It grew through the fence and was judged on its own merits.']]
};
function cleanupDigest(e,section){
 const rows=CLEANUP_HEADLINES[section];
 if(!rows)return [];
 const offset=GameArt.hash(e.country+'|'+section)%rows.length;
 const cycle=Math.floor(e.age/rows.length);
 const [title,story]=rows[(offset+(e.age%rows.length)+cycle)%rows.length];
 const safety=e.safety??g.w[e.country]?.n.A??50;
 const rate=Math.round((100-safety)*.63+(GameArt.hash(e.country+e.age)%9));
 return [{kind:section,title,text:story+(section==='crime'?' This edition’s simulated property-crime index is '+rate+'/100.':''),
  action:null,resolved:false,player:false}];
}
function cleanupNewsSection(article){
 if(article.brief?.type==='piEvent'||article.kind==='investigations')return 'agency';
 if(article.player&&(article.kind==='family'||article.id.startsWith('edition-')&&['fame','career','education','school'].includes(article.kind))||
  ['A family welcomes a new member','Community remembers loved ones','A new home joins the household portfolio'].includes(article.title))return 'journal';
 return null;
}
let journalOpen=false,journalOwner=null,journalPage='news';
function openJournal(page='news'){
 if(g.jail||publicityBusy()&&!journalOpen)return;
 journalOpen=true;journalPage=page;newsBuildYear();draw(1);
}
function closeJournal(){
 journalOpen=false;draw(1);
}
function journalEntries(){
 if(journalPage==='milestones')return MS.filter(m=>g.ms?.[m[0]]!=null).map(m=>[g.ms[m[0]],m[1],m[2]]);
 const state=newsState();
 const current=state.editions.flatMap(e=>e.articles.filter(a=>cleanupNewsSection(a)==='journal').map(a=>[e.age,a.title,a.text,a,e]));
 return [...current,...(state.journalArchive||[]).map(a=>[a.age,a.title,a.text])];
}
const cleanupJournalGame=gameView;
gameView=function(){
 if(journalOwner!==g){journalOwner=g;journalOpen=false;}
 const root=document.createElement('div');root.innerHTML=cleanupJournalGame();
 if(g.jail)return root.innerHTML;
 const paper=root.querySelector('.news-icon');
 if(paper)paper.insertAdjacentHTML('afterend','<button class="journal-icon" aria-label="Open journal" onclick="openJournal()">'+
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V5l3-2h12v16H8l-3 2z" fill="#f2b134" stroke="currentColor" stroke-width="1.5"/><path d="M9 7h7m-7 4h7m-7 4h4" fill="none" stroke="#16233a" stroke-width="1.4"/></svg></button>');
 if(journalOpen&&!root.querySelector('.mo')){
  const entries=journalEntries();
  const items=entries.map(([age,title,body,a,e])=>'<article class="journal-entry"><h3>'+uiEscape(title)+'</h3><p class="dd">Age '+age+
   ' · '+(eraYear()-g.age+age)+'</p><p>'+uiEscape(body)+'</p>'+
   (a&&newsCanRespond(a,e)?B('Respond',`journalOpen=false;newsPopupOpen=true;newsArticle('${a.id}')`):'')+'</article>').join('');
  root.querySelector('.game')?.insertAdjacentHTML('beforeend','<div class="mo"><div class="ev"><h2>Journal</h2>'+
   B('Personal news',"openJournal('news')")+B('Achievements and milestones',"openJournal('milestones')")+
   (items||'<p>No entries yet.</p>')+B('Back to Life','closeJournal()')+'</div></div>');
 }
 return root.innerHTML;
};
