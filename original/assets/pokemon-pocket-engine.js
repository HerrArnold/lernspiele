/* LernSafari Pocket simulator — explicit shared rules for players and AI.
   Source: teacher-provided custom cards and six fixed 20-card decks. */
'use strict';
(function(root){
 const data=root.PokemonPocketData||require('./pokemon-pocket-cards.js');
 const {byId,decks,allTypes}=data;
 const random=()=>Math.random();
 const shuffle=(list,rng=random)=>{
  const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out;
 };
 const clone=x=>JSON.parse(JSON.stringify(x));
 const validSide=x=>x===0||x===1;
 const C=id=>byId[id];
 const isBasic=id=>C(id)?.kind==='pokemon'&&C(id).stage===0;
 const isEvo=id=>C(id)?.kind==='pokemon'&&C(id).stage>0;
 const mon=(id,t)=>({id,stack:[],damage:0,energy:[],entered:t,evolved:-1,activeSince:-1,weakShield:false,weakShieldAgainst:null});
 const position=(p,slot)=>slot==='active'?p.active:p.bench[Number(slot)];
 const candidates=p=>[p.active,...p.bench].filter(Boolean);
 const energyNeeded=(pokemon,attack)=> {
  const pool=[...pokemon.energy];
  for(const symbol of attack.cost){
   if(symbol==='colorless')continue;
   const index=pool.indexOf(symbol);if(index<0)return false;pool.splice(index,1);
  }
  return pool.length>=attack.cost.filter(x=>x==='colorless').length;
 };
 const retreatCost=(game,side)=>{
  const m=game.players[side].active;if(!m)return 99;
  const opp=game.players[1-side];
  const pressure=candidates(opp).some(x=>C(x.id)?.ability==='opponentRetreatPlus1')?1:0;
  return C(m.id).retreat+pressure;
 };
 function draw(p,count){let n=0;while(n++<count&&p.pile.length&&p.hand.length<10)p.hand.push(p.pile.shift());}
 function energyType(game,side){const types=game.players[side].energyTypes;return types[Math.floor(game.rng()*types.length)]||'grass';}
 function addLog(game,message){game.log.unshift(message);game.log=game.log.slice(0,120);}
 function createGame(playerDeckId,botDeckId,difficulty='mittel',rng=random,forceFirst){
  const ids=[playerDeckId,botDeckId],players=[];
  for(const deckId of ids){
   const definition=decks.find(x=>x.id===deckId);
   if(!definition)throw Error('Unbekanntes Deck '+deckId);
   const list=Object.entries(definition.ids).flatMap(([id,n])=>Array(n).fill(id));
   if(list.length!==20)throw Error('Das Deck '+deckId+' hat '+list.length+' Karten statt 20');
   if(Object.values(definition.ids).some(n=>n>2))throw Error('Mehr als zwei gleiche Karten');
   let pile=shuffle(list,rng),hand=pile.splice(0,5);
   // Pocket guarantees a Basic in the opening five; physical classroom rule reshuffles.
   let tries=0;while(!hand.some(isBasic)&&tries++<100){pile=shuffle([...pile,...hand],rng);hand=pile.splice(0,5);}
   if(!hand.some(isBasic))throw Error('Kein Basis-Pokémon im Startdeck');
   const basic=hand.findIndex(isBasic);
   const active=mon(hand.splice(basic,1)[0],0);active.activeSince=0;
   // The Energy Zone is infinite: each new Energy is chosen randomly from the
   // deck's declared Energy types. There is no finite Energy pile to exhaust.
   players.push({id:deckId,hand,pile,discard:[],active,bench:[],points:0,
    energyTypes:definition.energy,energyNext:null,attached:false,retreated:false,supporter:false,turnCount:0});
  }
  const first=validSide(forceFirst)?forceFirst:Math.floor(rng()*2);
  const game={players,turn:first,first,ply:0,gameOver:false,winner:null,log:[],rng,difficulty,pending:null};
  startTurn(game,first);
  addLog(game,'Die Partie beginnt: '+(first===0?'Du bist zuerst.':'Der Computer beginnt.'));
  return game;
 }
 function assertTurn(g,s){if(g.gameOver)throw Error('Die Partie ist bereits beendet.');if(g.turn!==s)throw Error('Du bist gerade nicht am Zug.');if(g.pending)throw Error('Schliesse zuerst die Kartenauswahl ab.');}
 function nextEnergy(g,p){
  const types=p.energyTypes;
  p.energyNext=types[Math.floor(g.rng()*types.length)]||'grass';
 }
 function takeEnergy(g,s,requested=null){
  const p=g.players[s];
  // A special card may only take the Energy currently visible in the Zone.
  // Using it does not consume the ordinary once-per-turn attachment.
  if(!p.energyNext||requested&&p.energyNext!==requested)return null;
  const type=p.energyNext;
  nextEnergy(g,p);
  return type;
 }
 function startTurn(g,s){
  const p=g.players[s];p.turnCount++;p.attached=false;p.retreated=false;p.supporter=false;
  nextEnergy(g,p);
  draw(p,1);
 }
 function endTurn(g,s){
  assertTurn(g,s);
  addLog(g,(s===0?'Dein':'Computer-')+' Zug endet.');
  // A camouflage shield lasts through the opponent's next turn.
  const other=g.players[1-s];for(const m of candidates(other)){
   if(m.weakShieldAgainst===s){m.weakShield=false;m.weakShieldAgainst=null;}
  }
  g.ply++;
  if(g.ply>=60){g.gameOver=true;g.winner=g.players[0].points===g.players[1].points?null:g.players[0].points>g.players[1].points?0:1;addLog(g,'Zuglimit erreicht.');return;}
  g.turn=1-s;startTurn(g,1-s);
 }
 function playBasic(g,s,handIndex){
  assertTurn(g,s);const p=g.players[s],id=p.hand[handIndex];
  if(!isBasic(id)||p.bench.length>=3)throw Error('Kein Platz auf der Bank oder kein Basis-Pokémon.');
  p.hand.splice(handIndex,1);p.bench.push(mon(id,p.turnCount));
  addLog(g,C(id).name+' kommt auf die Bank.');
 }
 function moveActive(p,benchIndex,turnCount){
  const selected=p.bench[benchIndex];if(!selected)throw Error('Dieses Bank-Pokémon gibt es nicht.');
  p.bench.splice(benchIndex,1);
  const previous=p.active;
  p.active=selected;p.active.activeSince=turnCount;
  if(previous)p.bench.push(previous);
 }
 function applyEvolveAbility(g,s,slot){
  const p=g.players[s],m=position(p,slot),c=C(m.id);
  if(c.ability==='draw1OnEvolve'){draw(p,1);addLog(g,'Farigiraf ex: eine Karte gezogen.');}
  if(c.ability==='evolveGrassEnergy'){
   const gained=takeEnergy(g,s,'grass');
   if(gained){m.energy.push(gained);addLog(g,'Gortrom ex erhält eine Pflanzen-Energie aus der Energiezone.');}
  }
  if(c.ability==='evolveSwitch'&&slot!=='active'){
   g.pending={kind:'evolveSwitch',side:s,slot:Number(slot)};
  }
 }
 function evolve(g,s,handIndex,slot){
  assertTurn(g,s);const p=g.players[s],id=p.hand[handIndex],newCard=C(id),target=position(p,slot);
  if(!newCard||newCard.kind!=='pokemon'||newCard.stage<1||!target)throw Error('Ungültige Entwicklung.');
  if(p.turnCount<=1||target.entered>=p.turnCount||target.evolved===p.turnCount)throw Error('Dieses Pokémon darf sich noch nicht entwickeln.');
  if(newCard.from!==C(target.id).name||newCard.stage!==C(target.id).stage+1)throw Error('Diese Entwicklung passt nicht.');
  p.hand.splice(handIndex,1);target.stack.push(target.id);
  target.id=id;target.evolved=p.turnCount;
  addLog(g,C(id).name+' wurde entwickelt.');
  applyEvolveAbility(g,s,slot);
 }
 function resolvePending(g,accept){
  const pending=g.pending;
  if(!pending)throw Error('Keine offene Entscheidung.');
  if(pending.kind==='evolveSwitch'){
   if(accept)moveActive(g.players[pending.side],pending.slot,g.players[pending.side].turnCount);
   addLog(g,'Zebritz ex: '+(accept?'mit dem aktiven Pokémon gewechselt.':'nicht gewechselt.'));
   g.pending=null;return;
  }
  if(pending.kind==='forceSwitch'){
   const p=g.players[pending.side],slot=Number(accept);
   if(!Number.isInteger(slot)||slot<0||slot>=p.bench.length)throw Error('Wähle ein Pokémon deiner eigenen Bank.');
   moveActive(p,slot,p.turnCount);
   addLog(g,'Angstmacherei: der Gegner hat sein Bank-Pokémon ausgewählt.');
   g.pending=null;return;
  }
  if(pending.kind==='postAttackLook'){
   const p=g.players[pending.side];
   if(accept===true&&p.pile.length>1){p.pile.push(p.pile.shift());addLog(g,'Damhirplex legt die oberste Deckkarte nach unten.');}
   g.pending=null;if(!g.gameOver)endTurn(g,pending.side);return;
  }
  if(pending.kind==='postAttackSwitch'){
   const p=g.players[pending.side];
   const slot=Number(accept);
   if(!Number.isInteger(slot)||slot<0||slot>=p.bench.length)throw Error('Wähle ein Pokémon auf deiner Bank.');
   moveActive(p,slot,p.turnCount);g.pending=null;
   if(!g.gameOver)endTurn(g,pending.side);
   return;
  }
  throw Error('Unbekannte offene Entscheidung.');
 }
 function attach(g,s,slot){
  assertTurn(g,s);const p=g.players[s],target=position(p,slot);
  if(!target||p.attached||(p.turnCount===1&&g.first===s)||!p.energyNext)throw Error('Du darfst noch keine Energie anhängen.');
  const attached=takeEnergy(g,s);
  target.energy.push(attached);p.attached=true;
  addLog(g,'Eine '+attached+'-Energie wird an '+C(target.id).name+' angehängt.');
 }
 function retreat(g,s,slot){
  assertTurn(g,s);const p=g.players[s],cost=retreatCost(g,s);
  if(p.retreated||!p.active||p.bench.length<1||p.active.energy.length<cost)throw Error('Rückzug gerade nicht möglich.');
  // Generic retreat cost: discard exactly the printed number of attached Energy.
  p.discard.push(...p.active.energy.splice(0,cost).map(x=>'energy:'+x));
  moveActive(p,Number(slot),p.turnCount);p.retreated=true;
  addLog(g,'Rückzug zum Bank-Pokémon.');
 }
 function getHealTargets(g,s,type){
  return ['active',...g.players[s].bench.map((_,i)=>i)].filter(slot=>{
   const m=position(g.players[s],slot),c=C(m.id);
   return m&&m.damage>0&&(!type||c.type===type);
  });
 }
 function trainerOptions(g,s,cardId){
  const p=g.players[s],card=C(cardId);
  if(!card||!['item','supporter'].includes(card.kind)||card.kind==='supporter'&&p.supporter)return [];
  const own=['active',...p.bench.map((_,i)=>i)];
  const bench=p.bench.map((_,i)=>i);
  switch(card.effect){
   case 'heal20':return getHealTargets(g,s).map(slot=>({slot}));
   case 'heal25':return getHealTargets(g,s).map(slot=>({slot}));
   case 'metalHeal30':return getHealTargets(g,s,'metal').map(slot=>({slot}));
   case 'switch':return bench.map(slot=>({slot}));
   case 'forceSwitch':return g.players[1-s].bench.length?[{}]:[];
   case 'noWeakness':return own.map(slot=>({slot}));
   case 'moveEnergy':return own.flatMap(from=>{
    const m=position(p,from);return (m?.energy||[]).flatMap((type,ei)=>
      own.filter(to=>String(to)!==String(from)).map(to=>({from,to,ei})));
   });
   case 'energyGrassEvolved':return p.energyNext==='grass'?own.filter(slot=>{const m=position(p,slot);return C(m?.id)?.type==='grass'&&C(m?.id)?.stage>0}).map(slot=>({slot})):[];
   case 'coinElectricBench':return p.energyNext==='electric'?bench.map(slot=>({slot})):[];
   case 'bench20':return g.players[1-s].bench.map((_,i)=>({slot:i}));
   case 'searchBasic4':case 'searchEvolution4':
    return p.pile.slice(0,4).map((id,i)=>({index:i,id})).filter(o=>
      card.effect==='searchBasic4'?isBasic(o.id):isEvo(o.id)).concat([{skip:true}]);
   case 'look2':return [{swap:false},{swap:true}];
   case 'draw2':return p.hand.length<10&&p.pile.length>0?[{}]:[];
   default:return [];
  }
 }
 function removeTrainer(g,s,handIndex){const p=g.players[s],id=p.hand.splice(handIndex,1)[0];p.discard.push(id);if(C(id).kind==='supporter')p.supporter=true;return C(id);}
 function knockOut(g,targetSide,slot){
  const victim=g.players[targetSide],winner=g.players[1-targetSide];
  const pokemon=position(victim,slot);if(!pokemon||pokemon.damage<C(pokemon.id).hp)return;
  winner.points+=C(pokemon.id).ex?2:1;
  victim.discard.push(pokemon.id,...pokemon.stack);
  victim.discard.push(...pokemon.energy.map(x=>'energy:'+x));
  addLog(g,C(pokemon.id).name+' wurde besiegt! '+(C(pokemon.id).ex?'2 Punkte.':'1 Punkt.'));
  if(slot==='active'){
   victim.active=null;
   if(victim.bench.length){const best=victim.bench.reduce((acc,m,i)=>C(m.id).hp-m.damage>C(victim.bench[acc].id).hp-victim.bench[acc].damage?i:acc,0);
    victim.active=victim.bench.splice(best,1)[0];victim.active.activeSince=victim.turnCount;
   }
  }else victim.bench.splice(Number(slot),1);
  if(winner.points>=3||!victim.active){g.gameOver=true;g.winner=1-targetSide;addLog(g,(g.winner===0?'Du gewinnst!':'Computer gewinnt!'));}
 }
 function deal(g,targetSide,slot,amount,attackingType=null){
  const m=position(g.players[targetSide],slot);if(!m)return 0;
  let damage=Math.max(0,amount);
  if(damage>0&&slot==='active'&&attackingType&&C(m.id).weak===attackingType&&!m.weakShield)damage+=20;
  if(attackingType&&C(m.id).ability==='reduce10')damage=Math.max(0,damage-10);
  m.damage+=damage;
  knockOut(g,targetSide,slot);
  return damage;
 }
 function playTrainer(g,s,handIndex,choice={}){
  assertTurn(g,s);const p=g.players[s],id=p.hand[handIndex],card=C(id);
  if(!card||!['item','supporter'].includes(card.kind))throw Error('Keine Trainerkarte.');
  const options=trainerOptions(g,s,id);
  const picked=options.find(o=>JSON.stringify(o)===JSON.stringify(choice));
  if(!picked)throw Error('Wähle zuerst eine gültige Wirkung für diese Karte.');
  removeTrainer(g,s,handIndex);
  const own=slot=>position(p,slot),other=slot=>position(g.players[1-s],slot);
  switch(card.effect){
   case 'draw2':draw(p,2);break;
   case 'heal20':own(choice.slot).damage=Math.max(0,own(choice.slot).damage-20);break;
   case 'heal25':own(choice.slot).damage=Math.max(0,own(choice.slot).damage-25);break;
   case 'metalHeal30':own(choice.slot).damage=Math.max(0,own(choice.slot).damage-30);break;
   case 'switch':moveActive(p,choice.slot,p.turnCount);break;
   case 'forceSwitch':{
    const victimSide=1-s,enemy=g.players[victimSide];
    if(victimSide===0){g.pending={kind:'forceSwitch',side:0,actor:s};}
    else{
     const slot=enemy.bench.reduce((best,m,i)=>scoreTarget(g,victimSide,i)>scoreTarget(g,victimSide,best)?i:best,0);
     moveActive(enemy,slot,enemy.turnCount);
    }
    break;
   }
   case 'noWeakness':own(choice.slot).weakShield=true;own(choice.slot).weakShieldAgainst=1-s;break;
   case 'moveEnergy':{
    const energy=own(choice.from).energy.splice(choice.ei,1)[0];
    own(choice.to).energy.push(energy);break;
   }
   case 'energyGrassEvolved':{const e=takeEnergy(g,s,'grass');if(e)own(choice.slot).energy.push(e);break;}
   case 'coinElectricBench':{
    if(g.rng()<.5){const e=takeEnergy(g,s,'electric');if(e)own(choice.slot).energy.push(e);addLog(g,'Kopf! Die zusätzliche Energie wurde angehängt.');}
    else addLog(g,'Zahl! Keine zusätzliche Energie.');break;
   }
   case 'bench20':deal(g,1-s,choice.slot,20,null);break;
   case 'look2':if(choice.swap&&p.pile.length>1)[p.pile[0],p.pile[1]]=[p.pile[1],p.pile[0]];break;
   case 'searchBasic4':case 'searchEvolution4':{
    const top=p.pile.splice(0,4);
    if(!choice.skip&&top[choice.index]===choice.id&&p.hand.length<10)p.hand.push(top.splice(choice.index,1)[0]);
    p.pile=shuffle([...p.pile,...top],g.rng);break;
   }
  }
  addLog(g,card.name+' wurde gespielt.');
 }
 function expectedAttackDamage(g,s,attack){
  // Planning uses expected values, never consumes a real coin flip.
  if(attack.effect==='coin2x30')return 30;
  const preview=Object.assign({},g,{rng:()=>0.99});
  const base=attackDamage(preview,s,attack);
  if(attack.effect==='coinPlus20')return base+10;
  if(attack.effect==='coinPlus10')return base+5;
  return base;
 }
 function attackDamage(g,s,attack){
  const p=g.players[s],enemy=g.players[1-s],m=p.active;
  let damage=attack.damage;
  switch(attack.effect){
   case 'plus10OwnBench':damage+=p.bench.length*10;break;
   case 'plus20OwnBench':damage+=p.bench.length*20;break;
   case 'plus15BecameActive':if(m.activeSince===p.turnCount)damage+=15;break;
   case 'coinPlus20':if(g.rng()<.5)damage+=20;break;
   case 'coinPlus10':if(g.rng()<.5)damage+=10;break;
   case 'coin2x30':damage=(g.rng()<.5?30:0)+(g.rng()<.5?30:0);break;
   case 'plus20Enemy2Energy':if((enemy.active?.energy.length||0)>=2)damage+=20;break;
   case 'plus20EnemyDamaged':if(enemy.active?.damage>0)damage+=20;break;
   case 'plus25EnemyDamaged':if(enemy.active?.damage>0)damage+=25;break;
   case 'energyTimes20Max100':damage=Math.min(100,m.energy.length*20);break;
   case 'plus20Enemy2Bench':if(enemy.bench.length>=2)damage+=20;break;
  }
  return damage;
 }
 function attack(g,s,index){
  assertTurn(g,s);const p=g.players[s],id=p.active?.id,c=C(id),move=c?.attacks?.[Number(index)];
  if(!move||!energyNeeded(p.active,move))throw Error('Für diesen Angriff fehlen Energien.');
  const attackText=move.name;const value=attackDamage(g,s,move);
  const dealt=deal(g,1-s,'active',value,c.type);
  addLog(g,c.name+' setzt '+attackText+' ein und verursacht '+dealt+' Schaden.');
  if(!g.gameOver){
   if(move.effect==='energyMetalBench'&&p.bench.length){
    const target=p.bench.reduce((best,m,i)=>m.energy.length<p.bench[best].energy.length?i:best,0);
    const e=takeEnergy(g,s,'metal');
    if(e){p.bench[target].energy.push(e);addLog(g,'Metallruf: Energie an '+C(p.bench[target].id).name+'.');}
   }
   if(move.effect==='lookTopMayBottom'&&p.pile.length){
    const top=C(p.pile[0]);const wantsBottom=s===1&&top?.kind==='item'&&p.hand.length>6;
    if(s===0){g.pending={kind:'postAttackLook',side:s,cardId:p.pile[0]};return;}
    if(wantsBottom)p.pile.push(p.pile.shift());
   }
   if(move.effect==='switchAfterAttack'&&p.bench.length){
    g.pending={kind:'postAttackSwitch',side:s};
    return;
   }
   endTurn(g,s);
  }
 }
 function chooseForcedSwitch(g,s,slot){if(g.pending?.kind!=='forceSwitch'||g.pending.side!==s)throw Error('Keine gegnerische Wechselentscheidung offen.');resolvePending(g,slot);}
 function finishLook(g,s,sendToBottom){if(g.pending?.kind!=='postAttackLook'||g.pending.side!==s)throw Error('Keine Karteneinsicht offen.');resolvePending(g,sendToBottom);}
 function finishSwitch(g,s,slot){if(g.pending?.kind!=='postAttackSwitch'||g.pending.side!==s)throw Error('Kein freier Wechsel offen.');resolvePending(g,slot);}
 function switchOnEvolution(g,s,yes){if(g.pending?.kind!=='evolveSwitch'||g.pending.side!==s)throw Error('Keine Entwicklungsauswahl.');resolvePending(g,yes);}
 function availableAttacks(g,s){const m=g.players[s].active;return m?C(m.id).attacks.map((a,i)=>({index:i,attack:a,ready:energyNeeded(m,a)})):[];}
 function legalOptions(g,s){
  if(g.turn!==s||g.gameOver||g.pending)return {basics:[],evolutions:[],attach:[],retreat:[],attacks:[],trainers:[]};
  const p=g.players[s],slots=['active',...p.bench.map((_,i)=>i)];
  const basics=p.hand.map((id,i)=>isBasic(id)&&p.bench.length<3?i:null).filter(x=>x!==null);
  const evolutions=[];
  p.hand.forEach((id,i)=>{const card=C(id);if(!isEvo(id))return;slots.forEach(slot=>{
   const target=position(p,slot);
   if(p.turnCount>1&&target&&target.entered<p.turnCount&&target.evolved!==p.turnCount&&card.from===C(target.id).name&&card.stage===C(target.id).stage+1)
    evolutions.push({handIndex:i,slot});
  });});
  const attachSlots=!p.attached&&p.energyNext&&!(p.turnCount===1&&g.first===s)?slots:[];
  const retreatSlots=!p.retreated&&p.active&&p.active.energy.length>=retreatCost(g,s)?p.bench.map((_,i)=>i):[];
  const trainers=p.hand.map((id,i)=>({handIndex:i,options:trainerOptions(g,s,id)})).filter(x=>x.options.length);
  return {basics,evolutions,attach:attachSlots,retreat:retreatSlots,attacks:availableAttacks(g,s).filter(x=>x.ready),trainers};
 }
 function scoreTarget(g,s,slot){
  const m=position(g.players[s],slot);if(!m)return -999;
  const c=C(m.id),ready=c.attacks.some(a=>energyNeeded(m,a));
  const energyValue=m.energy.filter(e=>e===c.type).length;
  return (c.hp-m.damage)*.17+Math.max(...c.attacks.map(a=>a.damage))+energyValue*15+(ready?32:0)+(c.ex?4:0);
 }
 function aiPlay(g){
  if(g.gameOver||g.turn!==1)return;
  const level={leicht:1,mittel:2,schwer:3}[g.difficulty]||2;
  const p=g.players[1],human=g.players[0];
  let steps=0;
  const best=(values,fn)=>values.reduce((x,y)=>fn(y)>fn(x)?y:x);
  while(!g.gameOver&&g.turn===1&&steps++<42){
   if(g.pending?.kind==='forceSwitch')return; // Human must choose which of their Pokémon becomes active.
   if(g.pending?.kind==='evolveSwitch'){
    const current=p.active?scoreTarget(g,1,'active'):-99;
    const other=scoreTarget(g,1,g.pending.slot);
    switchOnEvolution(g,1,level===1?g.rng()<.5:other>current+5);continue;
   }
   if(g.pending?.kind==='postAttackSwitch'){
    finishSwitch(g,1,best(p.bench.map((_,i)=>i),i=>scoreTarget(g,1,i)));continue;
   }
   if(g.pending?.kind==='postAttackLook'){finishLook(g,1,false);continue;}
   const legal=legalOptions(g,1);
   if(legal.basics.length&& (p.bench.length<2||level===3||g.rng()<.6)){
    const i=level===1?legal.basics[Math.floor(g.rng()*legal.basics.length)]:best(legal.basics,i=>C(p.hand[i]).hp);
    playBasic(g,1,i);continue;
   }
   if(legal.evolutions.length){
    const choice=level===1?legal.evolutions[Math.floor(g.rng()*legal.evolutions.length)]:
     best(legal.evolutions,x=>C(p.hand[x.handIndex]).hp+(x.slot==='active'?15:0));
    evolve(g,1,choice.handIndex,choice.slot);continue;
   }
   // Avoid wasting the single supporter slot; prioritize useful board-building effects.
   const useful=legal.trainers.map(t=>{
    const c=C(p.hand[t.handIndex]);
    const value=({draw2:60,searchBasic4:p.bench.length<3?48:15,searchEvolution4:42,
     heal20:34,heal25:38,metalHeal30:40,switch:9,moveEnergy:16,noWeakness:12,
     coinElectricBench:35,energyGrassEvolved:35,bench20:50,forceSwitch:22,look2:8})[c.effect]||8;
    return {...t,value,kind:c.kind,card:c};
   }).filter(t=>t.options.length);
   const use=level===1?useful.filter(t=>g.rng()<.13)[0]:useful.filter(t=>t.value>=28||level===3&&t.value>=18).sort((a,b)=>b.value-a.value)[0];
   if(use){
    const opts=use.options;
    let choice=opts[0];
    if(level>1){
     if(['heal20','heal25','metalHeal30'].includes(use.card.effect))choice=best(opts,o=>position(p,o.slot).damage);
     if(use.card.effect==='bench20')choice=best(opts,o=>position(human,o.slot).damage+C(position(human,o.slot).id).ex*20);
     if(use.card.effect==='searchBasic4'||use.card.effect==='searchEvolution4')choice=best(opts,o=>o.skip?-999:C(o.id).hp+(C(o.id).ex?30:0));
     if(use.card.effect==='moveEnergy')choice=best(opts,o=>scoreTarget(g,1,o.to)-scoreTarget(g,1,o.from));
     if(use.card.effect==='forceSwitch')choice=best(opts,o=>-scoreTarget(g,0,o.slot));
     if(use.card.effect==='switch')choice=best(opts,o=>scoreTarget(g,1,o.slot));
    }
    playTrainer(g,1,use.handIndex,choice);continue;
   }
   if(legal.attach.length){
    // Hard AI focuses on active attacker or an evolving bench Pokémon when threatened.
    let slot='active';
    if(level>1){
     slot=best(legal.attach,x=>{
      const m=position(p,x),c=C(m.id),eng=m.energy.length;
      const needed=Math.min(...c.attacks.map(a=>a.cost.length));
      return (eng<needed?70:8)+(x==='active'?25:0)+c.hp*.1-(m.damage*.12)+(c.ex?7:0);
     });
    }else slot=legal.attach[Math.floor(g.rng()*legal.attach.length)];
    attach(g,1,slot);continue;
   }
   // Hard AI retreats only for a substantially superior ready attacker.
   if(level===3&&legal.retreat.length&&p.active?.damage>0){
    const target=best(legal.retreat,i=>scoreTarget(g,1,i));
    if(scoreTarget(g,1,target)>scoreTarget(g,1,'active')+24){retreat(g,1,target);continue;}
   }
   if(legal.attacks.length){
    const chosen=level===1?legal.attacks[Math.floor(g.rng()*legal.attacks.length)]:
      best(legal.attacks,o=>{
       const defender=C(human.active?.id);
       const weakness=defender?.weak===C(p.active.id).type?20:0;
       const armor=defender?.ability==='reduce10'?10:0;
       const expected=Math.max(0,expectedAttackDamage(g,1,o.attack)+weakness-armor);
       const missing=defender?defender.hp-human.active.damage:999;
       const probableKO=expected>=missing;
       const knockOutValue=probableKO?(defender.ex?195:120):0;
       return expected+knockOutValue;
      });
    attack(g,1,chosen.index);continue;
   }
   endTurn(g,1);
  }
  if(steps>=42&&!g.gameOver&&g.turn===1&&!g.pending)endTurn(g,1);
 }
 const API={createGame,shuffle,clone,position,energyNeeded,retreatCost,trainerOptions,
  playBasic,evolve,attach,retreat,playTrainer,attack,endTurn,finishSwitch,finishLook,chooseForcedSwitch,switchOnEvolution,
  availableAttacks,legalOptions,aiPlay,attackDamage,deal,knockOut,scoreTarget};
 root.PokemonPocketEngine=API;
 if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window==='undefined'?globalThis:window);
