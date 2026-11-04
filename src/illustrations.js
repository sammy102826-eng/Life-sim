/* Original deterministic vector artwork. No requests, fonts, tracking or gameplay RNG. */
const GameArt=(()=>{
 const cache=new Map();
 function hash(text){let n=2166136261;for(const c of String(text)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
 const stroke='stroke="#25364b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
 const rect=(x,y,w,h,fill,r=3)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${stroke}/>`;
 const circle=(x,y,r,fill,outline=true)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${outline?stroke:''}/>`;
 const path=(d,fill='none')=>`<path d="${d}" fill="${fill}" ${stroke}/>`;
 function car(n,type){const suv=/SUV|crossover|off-road|wagon|van/i.test(type),truck=/pickup|truck/i.test(type),sport=/sport|coupe|supercar|touring/i.test(type),electric=/electric|hybrid/i.test(type),color=`hsl(${n%360} 58% 54%)`,bodyTop=suv?43:sport?62:55;
  let body=truck?path('M18 66 L24 54 H62 V36 H97 L114 58 H143 V83 H18 Z',color):suv?path('M15 65 L26 44 Q28 37 38 37 H104 L126 61 H143 L148 80 H15 Z',color):path(`M14 70 L35 63 L53 ${bodyTop} Q57 ${bodyTop-6} 68 ${bodyTop-6} H99 L123 64 L144 70 V83 H14 Z`,color);
  body+=truck?path('M69 43 H92 L104 58 H69 Z','#b8dbe2'):path(suv?'M35 44 H72 V61 H28 Z M79 44 H100 L117 61 H79 Z':`M58 ${bodyTop} H77 V63 H46 Z M83 ${bodyTop} H98 L112 63 H83 Z`,'#b8dbe2');
  body+=path('M21 77 H139','#25364b')+rect(15,68,9,5,'#ffe9a7',1)+rect(137,69,7,5,'#e8877f',1);
  for(const x of [41,121])body+=circle(x,82,13,'#25364b')+circle(x,82,7,'#ebeee7')+circle(x,82,2,color,false);
  body+=path(truck?'M115 59 V73':suv?'M75 65 V76':'M80 66 V75')+path('M89 67 H96');
  if(electric)body+=path('M119 66 L114 73 H119 L115 79','#ffdf7e');
  if(n%3===0)body+=path('M29 72 H35 M129 74 H136');body+=path('M53 76 H'+(61+((n>>>9)%19)));return body;
 }
 function house(n,type){const color=`hsl(${n%360} 34% 76%)`,roof=`hsl(${(n+35)%360} 24% 35%)`,modern=/modern|architect|sustainable|smart|penthouse/i.test(type),apartment=/apartment|condo|penthouse|townhouse/i.test(type),grand=/mansion|estate|manor|villa|resort/i.test(type),cabin=/cabin|cottage|chalet|lodge|farm/i.test(type),tiny=/tiny|manufactured|mobile/i.test(type);let body='';
  if(apartment){body+=rect(44,20,72,76,color,2)+rect(39,15,82,9,roof,2);for(let r=0;r<3;r++)for(let c=0;c<3;c++)body+=rect(53+c*21,31+r*19,12,12,'#acd7dc',1);body+=rect(72,80,17,16,'#735c50',1);}
  else if(grand){body+=rect(18,51,124,45,color,2)+rect(53,33,54,63,'#f6e9d0',2)+path('M12 52 L38 33 L65 52 M48 34 L80 15 L112 34 M96 52 L123 33 L148 52',roof);for(const x of [28,121])body+=rect(x,63,11,17,'#aed7df',1);for(const x of [63,88])body+=rect(x,42,10,14,'#aed7df',1);body+=rect(69,72,23,24,'#715b5b',2)+path('M59 96 V60 M103 96 V60');}
  else if(modern){body+=rect(24,47,109,49,color,2)+rect(54,22,78,40,'#f4e8d5',2)+rect(63,31,57,22,'#9bc8d4',1)+rect(29,57,51,28,'#a3cbd2',1)+rect(95,65,20,31,'#7a6c5f',1)+path('M83 58 V85 M22 46 H138');}
  else {const left=tiny?30:27,right=tiny?129:133,top=tiny?57:47;body+=rect(left,top,right-left,96-top,color,2)+path(`M${left-7} ${top+2} L80 ${cabin?17:22} L${right+7} ${top+2} Z`,roof)+rect(72,69,20,27,'#8b6653',1)+rect(39,60,19,18,'#acd8de',1)+rect(105,60,16,18,'#acd8de',1)+path('M48 60 V78 M39 69 H58 M113 60 V78');if(cabin)body+=path('M33 84 H64 M96 84 H128');if(tiny)body+=circle(51,99,5,'#25364b')+circle(112,99,5,'#25364b');else body+=rect(109,21,9,20,roof,1);}
  body+=path('M12 97 H148')+path('M72 100 L66 109 H99 L91 100','#e0cbb1');body+=circle(18,80,10,'#7eac8a')+path('M18 88 V98');return body;
 }
 function person(n,age){const skin=['#f3cfaa','#d9a27d','#ad7656','#794c38','#c88c66','#e7b993'][n%6],hair=['#322d35','#634134','#b7864e','#cfad72','#433d34'][Math.floor(n/7)%5],shirt=`hsl(${(n+30)%360} 37% 50%)`,child=Number(age)<13,elder=Number(age)>=55,faceY=child?49:45,hairColor=elder?'#c4c5be':hair;let b=path('M38 110 V97 Q42 77 65 78 H95 Q118 78 122 97 V110 Z',shirt)+rect(69,65,22,24,skin,8);
  b+=`<ellipse cx="80" cy="${faceY}" rx="${child?25:23}" ry="${child?29:30}" fill="${skin}" ${stroke}/>`;
  const style=Math.floor(n/11)%4;
  b+=style===0?path(`M57 ${faceY+2} Q48 13 81 12 Q108 12 106 ${faceY+5} L99 32 Q77 34 63 25 Z`,hairColor):style===1?path(`M55 ${faceY+10} Q45 7 83 10 Q117 12 105 ${faceY+19} L100 40 L96 23 Q72 36 59 32 Z`,hairColor):style===2?path('M57 38 Q48 13 74 10 Q108 7 106 40 L96 27 Q76 25 62 35 Z',hairColor):path('M57 33 Q55 11 80 11 Q103 12 104 34 L92 24 L67 24 Z',hairColor);
  b+=circle(71,faceY+1,1.8,'#25364b',false)+circle(89,faceY+1,1.8,'#25364b',false)+path(`M76 ${faceY+14} Q80 ${faceY+18} 85 ${faceY+13}`)+path(`M80 ${faceY+4} L78 ${faceY+9} H81`);
  if(n%4===0||elder)b+=rect(62,faceY-5,16,12,'none',4)+rect(83,faceY-5,16,12,'none',4)+path(`M78 ${faceY} H83`);
  b+=path('M58 86 L72 96 L80 85 L89 96 L102 86','none');if(elder)b+=path(`M65 ${faceY+12} L67 ${faceY+14} M94 ${faceY+12} L92 ${faceY+14}`);return b;
 }
 function animal(n,type){const cat=/cat/i.test(type),horse=/horse/i.test(type),bird=/bird|parrot/i.test(type),fish=/fish/i.test(type),fur=['#ce9a64','#ddd2bb','#826652','#9b9c9e','#e9dfd0'][n%5];
  if(fish)return path('M29 58 Q73 18 115 58 Q74 94 29 58 Z','#e7aa61')+path('M114 58 L140 36 V79 Z','#e7aa61')+circle(49,53,3,'#25364b',false)+path('M80 39 L68 58 L83 77');
  if(bird)return path('M57 80 Q37 66 55 30 Q71 11 93 31 Q111 52 98 78 L111 91 H61 Z',fur)+path('M98 40 L117 49 L98 54 Z','#edbc5d')+circle(85,39,3,'#25364b',false)+path('M64 51 Q94 67 73 79 M68 91 V100 M87 91 V100');
  if(horse)return path('M53 96 L50 50 L63 32 L64 13 L77 27 L89 17 L97 42 L119 70 Q121 87 102 87 L89 74 L89 97 Z',fur)+path('M52 50 L38 65 L36 88 M60 35 L53 18 M88 74 L103 70')+circle(85,46,3,'#25364b',false);
  return path(cat?'M47 43 L47 15 L68 31 Q82 27 95 32 L117 15 L114 48 Q126 91 82 94 Q35 92 47 43 Z':'M49 44 Q28 17 24 46 Q23 75 46 76 Q47 99 82 97 Q117 96 116 76 Q140 75 136 44 Q129 19 110 44 Q79 22 49 44 Z',fur)+circle(64,58,3,'#25364b',false)+circle(98,58,3,'#25364b',false)+path('M74 71 Q81 64 88 71 L81 78 Z','#5b4946')+path('M81 78 V85 M70 85 Q81 91 92 84')+(cat?path('M42 69 L61 73 M40 79 H60 M102 73 L124 69 M103 79 H126'):'');
 }
 function item(n,type){const gold='#e8b954',blue='#92c9d7',cream='#f7e6c1',key=type.toLowerCase();
  if(/yacht|motor boat|fishing boat/.test(key))return path('M18 76 H145 L127 96 H37 Z',blue)+rect(53,46,59,28,cream,3)+path('M64 46 L77 27 H104 L116 46 Z',cream)+rect(80,34,20,10,blue,1)+path('M22 103 Q36 97 50 103 T80 103 T109 103 T140 103');
  if(/sneaker|shoes/.test(key))return path('M35 40 H59 L73 64 L126 76 L136 87 V96 H27 V74 Z',blue)+path('M28 86 H134 M58 52 L71 47 M65 61 L78 55 M74 69 L86 63')+path('M35 40 L44 64 L58 67');
  if(/sunglass/.test(key))return rect(25,38,45,35,'#8db8c4',12)+rect(90,38,45,35,'#8db8c4',12)+path('M70 49 Q80 40 90 49 M25 42 L15 35 M135 42 L145 35');
  if(/suit|tailor/.test(key))return path('M57 24 L80 36 L103 24 L124 43 L113 96 H47 L36 43 Z','#74939b')+path('M57 24 L69 64 L80 45 L91 64 L103 24 M80 45 V96')+path('M80 36 L73 45 L80 59 L87 45 Z',gold);
  if(/boat|yacht|sail/.test(key))return path('M21 77 H142 L125 96 H40 Z',blue)+path('M77 18 V76 M70 24 L36 69 H70 Z',cream)+path('M84 32 L116 69 H84 Z','#e8ad87')+path('M18 103 Q30 96 44 103 T72 103 T100 103 T133 103');
  if(/plane|aircraft|jet|flight|vacation/.test(key))return path('M18 61 L66 52 L88 17 H99 L89 51 L138 65 V74 L90 69 L94 92 H84 L69 69 L24 72 Z',blue);
  if(/watch/.test(key))return rect(66,9,28,96,'#956d50',6)+circle(80,57,27,gold)+circle(80,57,21,cream)+path('M80 42 V57 L92 64');
  if(/handbag|designer|leather/.test(key))return rect(43,40,76,56,'#b58189',8)+path('M60 41 V29 Q80 6 100 29 V41')+rect(73,59,15,12,gold,2);
  if(/art|painting|sculpture/.test(key))return rect(31,17,99,80,gold,3)+rect(39,25,83,64,'#9ac6c9',1)+circle(102,41,9,'#f7dfa0',false)+path('M41 87 L66 53 L85 72 L99 58 L120 87','#719b86');
  if(/book|collectible|education|learning/.test(key))return path('M21 27 Q48 17 79 32 Q110 17 139 27 V88 Q110 78 79 93 Q49 78 21 88 Z',cream)+path('M79 32 V93 M34 40 L62 42 M34 52 L62 54 M94 43 L124 40 M94 55 L124 52');
  if(/wine/.test(key))return path('M71 15 H89 V39 Q106 50 106 61 V99 H54 V61 Q54 50 71 39 Z','#718975')+rect(68,10,24,15,gold,2)+rect(61,62,38,25,cream,2);
  if(/ring|jewelry|bracelet|necklace|pendant|earring/.test(key))return circle(80,70,27,gold)+circle(80,70,18,'#f3ede0')+path('M63 35 L72 23 H88 L97 35 L80 53 Z',blue)+path('M63 35 H97 M72 23 L80 53 L88 23');
  if(/money|finance|invest|bank|loan|dashboard/.test(key))return rect(29,34,102,61,'#a1c3a3',9)+rect(92,49,42,29,gold,5)+circle(104,63,4,cream,false)+circle(52,38,20,gold)+path('M52 23 V52 M60 29 H48 Q40 34 51 38 Q66 44 46 47');
  if(/health|love|relationship/.test(key))return path('M80 93 L35 53 Q13 19 49 18 Q68 15 80 35 Q94 14 114 18 Q147 24 125 55 Z','#d88e94')+path('M42 57 H59 L69 42 L80 70 L91 53 H118');
  if(/social|friend|person/.test(key))return rect(27,22,106,65,blue,15)+path('M47 87 L43 101 L70 87',blue)+circle(53,55,5,cream,false)+circle(80,55,5,cream,false)+circle(107,55,5,cream,false);
  if(/job|career|work|venture/.test(key))return rect(26,39,108,58,'#b99074',7)+path('M61 39 V24 H100 V39')+path('M28 60 Q80 78 132 60')+rect(73,61,17,17,gold,3);
  if(/sports|activity|activities|fitness/.test(key))return circle(80,57,38,'#deb676')+path('M43 57 H117 M80 19 V95 M53 30 Q86 58 53 85 M107 30 Q74 58 107 85');
  if(/world|emigrate/.test(key))return circle(80,56,39,blue)+path('M44 43 L60 31 L73 42 L63 58 L72 69 L64 86 M94 24 L88 44 L107 55 L110 70 L96 80')+path('M41 56 H119 M80 17 Q57 57 80 95 Q104 57 80 17');
  if(/crime|license/.test(key))return path('M80 15 L124 32 V60 Q115 88 80 102 Q44 88 36 60 V32 Z',blue)+path('M60 56 L75 72 L104 41');
  return path('M80 17 L94 44 L124 48 L102 69 L108 98 L80 84 L52 98 L58 69 L36 48 L66 44 Z',gold);
 }
 function svg(kind,entity={},size='thumb'){
  const name=typeof entity==='string'?entity:(entity.n||entity.name||entity.id||kind),type=typeof entity==='string'?entity:[entity.type,entity.kind,entity.assetType,name].filter(Boolean).join(' '),age=typeof entity==='object'?entity.age:30,identity=typeof entity==='object'?(entity.id||name):name;
  const portrait=kind==='person',key=[kind,identity,type,portrait?(age<13?'child':age<55?'adult':'elder'):'',size].join('|');if(cache.has(key))return cache.get(key);
  const n=hash(identity+'|'+kind),bg=`hsl(${(n+190)%360} 27% 90%)`,accent=`hsl(${(n+210)%360} 35% 81%)`;
  let drawing=kind==='car'?car(n,type):kind==='home'?house(n,type):portrait?person(n,age):kind==='pet'?animal(n,type):item(n,type+' '+kind);
  const result=`<span class="game-art game-art--${size}${portrait?' game-art--portrait':''}" data-art-kind="${kind.replace(/[^a-z-]/g,'')}" data-art-key="${n}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 112" focusable="false"><rect width="160" height="112" rx="16" fill="${bg}"/><circle cx="126" cy="20" r="24" fill="${accent}" opacity=".55"/><ellipse cx="81" cy="100" rx="65" ry="7" fill="#25364b" opacity=".10"/>${drawing}</svg></span>`;
  if(cache.size>=600)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
 }
 return {svg,hash};
})();
