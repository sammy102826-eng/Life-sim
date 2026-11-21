const MUSIC_ROLES={voice:['Vocals',470],guitar:['Guitar',420],bass:['Bass',390],drums:['Drums',550],keys:['Keyboards',480],strings:['Strings',520]};
const musicTrainingAge=key=>key==='voice'?5:8;
const MUSIC_BANDS={
 harbor:['Harbor Signals','Indie pop',42,['voice','guitar','keys'],['June Park','Eli Flores','Nico Reed']],
 lantern:['Paper Lanterns','Alternative rock',55,['voice','guitar','bass','drums'],['Ivy Chen','Theo Bell','Morgan Grey']],
 orbit:['Quiet Orbit','Soul and jazz',61,['voice','bass','keys','strings'],['Sofia Vale','Raj Lane','Avery Ford']],
 city:['City in Stereo','Electronic pop',69,['voice','drums','keys'],['Casey Cross','Maya Finch','Sam Vega']]
};
const MUSIC_LABELS={local:['Northline Records',2,23,2800,28],indie:['Cedar Room Music',2,32,11000,49],major:['Westlake Music Group',3,42,33000,68]};
const MUSIC_GENRES=['Indie pop','Alternative rock','Soul and jazz','Electronic pop','Folk','Hip-hop','Country','Classical crossover'];
const MUSIC_FORMATS={single:['Single',950],ep:['EP',2800],album:['Album',6900]};
const MUSIC_EVENTS={
 burnout:['The act is worn out after rehearsal','Members want a schedule they can sustain.',[['Build rest into the schedule',7,3],['Ask everyone to keep the current pace',-6,0],['Cancel the next rehearsal',-2,-1]],false],
 direction:['Bandmates disagree over the next sound','The group wants a creative decision before the next proposal.',[['Workshop two arrangements together',9,4],['Find a compromise on the sound',5,3],['Push for your own version',-9,1]],false],
 venue:['A venue changes the show arrangements','Fans want to know how the act will respond.',[['Share a clear update and move the show',6,2],['Offer a smaller performance',3,2],['Leave the venue to communicate',-5,-1]],true],
 credit:['A collaborator asks for proper credit','The credits can change before the next release.',[['Update the credits publicly',7,3],['Review the original agreement',3,2],['Keep the credits as they are',-7,-1]],true],
 reunion:['A former band proposes a reunion','The original lineup is considering performing together again.',[['Accept the reunion',0,0],['Keep working solo',0,0],['Offer your support from afar',0,1]],true],
 confidence:['Your bandmates ask for a vote on your place in the lineup','Their votes depend on the group’s working relationship.',[['Make your case and vote to stay',8,0],['Let the band vote without your support',0,0],['Support a change in the lineup',-8,0]],false]
};
