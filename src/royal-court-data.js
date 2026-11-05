/* Simplified game constitutions; current reigns survive migrations and reforms. */
const ROYAL_CONSTITUTIONS={
 'United Kingdom':{power:'ceremonial',law:'absolute',note:'Parliament legislates; the Crown holds audiences and gives assent on ministerial advice.'},
 Canada:{power:'ceremonial',law:'absolute',note:'Responsible government and parliamentary advice govern official Crown action.'},
 Australia:{power:'reserve',law:'absolute',note:'Parliament governs; reserve powers are limited to an actual constitutional or public emergency.'},
 'New Zealand':{power:'ceremonial',law:'absolute',note:'Parliament governs; royal advocacy is not binding legislation.'},
 Japan:{power:'ceremonial',law:'male-line',note:'The imperial role is ceremonial. This game models male-line succession until a legislative reform.'},
 Spain:{power:'reserve',law:'male-preference',note:'Parliament legislates; male-preference applies within each family branch.'},
 Sweden:{power:'ceremonial',law:'absolute',note:'The royal role is ceremonial; eldest eligible descendants inherit regardless of sex.'},
 Netherlands:{power:'reserve',law:'absolute',note:'Ministers and parliament govern; reserve action requires an emergency.'},
 Norway:{power:'reserve',law:'absolute',note:'Parliament governs; equal birth-order succession applies in this simplified dynasty.'},
 Thailand:{power:'reserve',law:'male-preference',note:'The government legislates; succession favors sons within each branch in this game model.'},
 Morocco:{power:'executive',law:'male-line',note:'The Crown has executive authority; royal succession follows the male line in this model.'},
 'Saudi Arabia':{power:'executive',law:'council',note:'An adult male successor is selected with family-council support, rather than automatic eldest-child succession.'},
 'United Arab Emirates':{power:'executive',law:'council',note:'A simplified council chooses among eligible adult male dynasts; this does not simulate the actual federation of emirates.'}
};
const ROYAL_LAWS={absolute:'Equal birth-order primogeniture','male-preference':'Male-preference primogeniture','male-line':'Male-line succession',council:'Council selection of adult male dynasts'};
const ROYAL_STAFF={chamberlain:{name:'Lord chamberlain',salary:80000,benefit:'Improves court loyalty and reduces court administration costs by 20%.'},security:{name:'Security chief',salary:120000,benefit:'Reduces incident risk and strengthens protection on diplomatic tours.'},diplomat:{name:'Diplomatic secretary',salary:100000,benefit:'Cuts tour costs by 15% and improves diplomatic outcomes.'}};
const ROYAL_SECURITY={basic:{cost:20000,risk:24},standard:{cost:80000,risk:14},enhanced:{cost:200000,risk:6}};
