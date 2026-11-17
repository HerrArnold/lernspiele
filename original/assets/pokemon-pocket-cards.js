/* LernSafari Pokémon Pocket: card catalogue transcribed from the supplied 40 image set.
   Card images are resolved by image key; the gameplay uses this explicit data, never OCR. */
'use strict';
(function(root){
 const P=(id,name,type,hp,stage,from,weak,retreat,attacks,extra={})=>({id,name,kind:'pokemon',type,hp,stage,from,weak,retreat,attacks,...extra});
 const A=(name,cost,damage,effect)=>({name,cost,damage,effect:effect||null});
 const T=(id,name,kind,effect)=>({id,name,kind,effect});
 const cards=[
 T('professor','Forschung des Professors','supporter','draw2'),
 T('safari-ball','Safari-Ball','item','searchBasic4'),
 T('trinkflasche','Trinkflasche','item','heal20'),
 T('trommel-ritual','Trommel-Ritual','supporter','energyGrassEvolved'),
 T('feldstecher','Feldstecher','item','searchEvolution4'),
 T('tausch','Tausch','item','switch'),
 T('energietausch','Energietausch','item','moveEnergy'),
 T('tarnnetz','Tarnnetz','item','noWeakness'),
 T('znuenipause','Znünipause','supporter','heal25'),
 T('strom-aufladung','Strom-Aufladung','supporter','coinElectricBench'),
 T('sturmwarnung','Sturmwarnung','supporter','bench20'),
 T('mechanikerin','Mechanikerin','supporter','metalHeal30'),
 T('angstmacherei','Angstmacherei','supporter','forceSwitch'),
 T('blick-in-die-sterne','Blick in die Sterne','item','look2'),
 P('yanma','Yanma','grass',65,0,null,'electric',0,[A('Flügelschlag',['grass'],25)]),
 P('yanmega','Yanmega','grass',90,1,'Yanma','electric',0,[A('Schwarmflug',['grass','grass'],30,'plus10OwnBench')]),
 P('chimpep','Chimpep','grass',65,0,null,'fire',1,[A('Stockschlag',['grass'],25)]),
 P('chimstix','Chimstix','grass',85,1,'Chimpep','fire',2,[A('Trommelschlag',['grass','grass'],40)]),
 P('gortrom-ex','Gortrom ex','grass',120,2,'Chimstix','fire',3,[A('Trommelschlag',['grass','grass','grass'],35,'plus20OwnBench')],{ex:true,ability:'evolveGrassEnergy'}),
 P('kecleon','Kecleon','colorless',70,0,null,'fighting',1,[A('Farbenschlag',['colorless'],30)]),
 P('mopex-ex','Mopex ex','colorless',95,0,null,'fighting',0,[A('Durchfahrt',['colorless'],30),A('Vorbeirasen',['colorless','colorless'],50,'switchAfterAttack')],{ex:true}),
 P('flaminkno','Flaminkno','colorless',75,0,null,'electric',1,[A('Doppelkick',['colorless','colorless'],0,'coin2x30')]),
 P('elezeba','Elezeba','electric',60,0,null,'fighting',0,[A('Blitztritt',['electric'],25)]),
 P('zebritz-ex','Zebritz ex','electric',100,1,'Elezeba','fighting',1,[A('Blitzstart',['electric'],30,'plus15BecameActive'),A('Donnergalopp',['electric','electric'],50,'coinPlus20')],{ex:true,ability:'evolveSwitch'}),
 P('wattzapf','Wattzapf','electric',55,0,null,'fighting',1,[A('Mini-Schock',['electric'],20,'coinPlus10')]),
 P('voltula','Voltula','electric',85,1,'Wattzapf','fighting',1,[A('Elektrofalle',['electric','electric'],40,'plus20Enemy2Energy')]),
 P('kupfanti','Kupfanti','metal',75,0,null,'fire',2,[A('Stoss',['metal'],30)]),
 P('patinaraja-ex','Patinaraja ex','metal',115,1,'Kupfanti','fire',4,[A('Stahlstampfer',['metal','metal'],50),A('Schwergewicht',['metal','metal','metal'],70)],{ex:true,ability:'reduce10'}),
 P('kobalium','Kobalium','metal',90,0,null,'fire',1,[A('Metallruf',['metal'],25,'energyMetalBench'),A('Eisenhorn',['metal','metal'],45)]),
 P('felilou','Felilou','dark',60,0,null,'fighting',0,[A('Kratzer',['dark'],25)]),
 P('kleoparda','Kleoparda','dark',85,1,'Felilou','fighting',0,[A('Überfall',['dark','dark'],35,'plus20EnemyDamaged')],{ability:'opponentRetreatPlus1'}),
 P('zarude-ex','Zarude ex','dark',105,0,null,'fire',2,[A('Rankengriff',['dark','dark'],40),A('Dschungeljagd',['dark','dark','dark'],55,'plus25EnemyDamaged')],{ex:true}),
 P('damhirplex','Damhirplex','psychic',70,0,null,'dark',1,[A('Weitblick',['psychic'],25,'lookTopMayBottom')]),
 P('damythir','Damythir','psychic',95,1,'Damhirplex','dark',2,[A('Ahnenkraft',['psychic'],0,'energyTimes20Max100')]),
 P('girafarig','Girafarig','psychic',70,0,null,'dark',1,[A('Gedankenstoss',['psychic'],25)]),
 P('farigiraf-ex','Farigiraf ex','psychic',110,1,'Girafarig','dark',2,[A('Radar-Welle',['psychic','psychic'],50,'plus20Enemy2Bench')],{ex:true,ability:'draw1OnEvolve'})
 ];
 const byId=Object.fromEntries(cards.map(c=>[c.id,c]));
 const count=ids=>Object.fromEntries(ids.map(id=>[id,2]));
 const decks=[
 {id:'safari-sprint',name:'Safari-Sprint',type:'colorless',level:1,energy:['grass','fire','water','electric','psychic','fighting','dark','metal'],ids:count(['kecleon','mopex-ex','flaminkno','professor','safari-ball','trinkflasche','znuenipause','tausch','tarnnetz','energietausch'])},
 {id:'eiserner-tank',name:'Eiserner Tank',type:'metal',level:2,energy:['metal'],ids:count(['kupfanti','patinaraja-ex','kobalium','professor','safari-ball','trinkflasche','znuenipause','mechanikerin','tausch','energietausch'])},
 {id:'jagdinstinkt',name:'Jagdinstinkt',type:'dark',level:2,energy:['dark'],ids:count(['felilou','kleoparda','zarude-ex','professor','safari-ball','trinkflasche','znuenipause','tausch','angstmacherei','energietausch'])},
 {id:'voraussicht',name:'Voraussicht',type:'psychic',level:2,energy:['psychic'],ids:count(['damhirplex','damythir','girafarig','farigiraf-ex','professor','safari-ball','trinkflasche','tausch','energietausch','blick-in-die-sterne'])},
 {id:'blitzangriff',name:'Blitzangriff',type:'electric',level:2,energy:['electric'],ids:count(['elezeba','zebritz-ex','wattzapf','voltula','professor','safari-ball','trinkflasche','tausch','strom-aufladung','sturmwarnung'])},
 {id:'dschungel-team',name:'Dschungel-Team',type:'grass',level:3,energy:['grass'],ids:count(['yanma','yanmega','chimpep','chimstix','gortrom-ex','professor','safari-ball','feldstecher','trinkflasche','trommel-ritual'])}
 ];
 const symbols={grass:'🌿',fire:'🔥',water:'💧',electric:'⚡',psychic:'🔮',fighting:'🥊',dark:'🌑',metal:'⚙️',colorless:'⚪'};
 root.PokemonPocketData={cards,byId,decks,symbols,allTypes:['grass','fire','water','electric','psychic','fighting','dark','metal']};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.PokemonPocketData;
})(typeof window==='undefined'?globalThis:window);
