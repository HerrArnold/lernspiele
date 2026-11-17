/* Pokemon Pocket vs computer – responsive, accessible teacher-preview match board. */
'use strict';
(function(){
 const D=window.PokemonPocketData,E=window.PokemonPocketEngine;
 if(!D||!E)return;
 const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const card=id=>D.byId[id],icon=t=>D.symbols[t]||'🃏';
 const energyIcon=t=>'<span class="energy-badge energy-'+escape(t||'none')+'" title="'+escape(t||'Energie')+'">'+icon(t)+'</span>';
 // Use the eight supplied circular icons when uploaded, keep emoji fallbacks otherwise.
 const energyImage=new Image();
 energyImage.onload=()=>document.body.classList.add('pokemon-energy-sprites-ready');
 energyImage.src='../assets/pokemon-pocket/energy-icons.webp';
 const deckName=id=>D.decks.find(d=>d.id===id)?.name||id;
 let game=null,choice=null,activeDeck=null,lastOpponent=null;
 function img(id){return '../assets/pokemon-pocket/'+id+'.webp';}
 function imgMarkup(id){
  const c=card(id),symbol=c?.kind==='pokemon'?icon(c.type):c?.kind==='supporter'?'📙':'🎒';
  return '<div class="art"><span class="fallback">'+symbol+'<small>'+escape(c?.name||id)+'</small></span><img src="'+img(id)+'" alt="" loading="lazy" onload="this.previousElementSibling.hidden=true" onerror="this.remove()"></div>';
 }
 function cardMarkup(id,{mon=null,hidden=false,actionText=null,action=null}={}){
  if(hidden)return '<div class="mini-card card-back" aria-label="Verdeckte Karte"></div>';
  const c=card(id);if(!c)return '';
  const isMon=c.kind==='pokemon';
  const energy=mon?.energy?.map(energyIcon).join(' ')||'';
  const health=mon?Math.max(0,c.hp-mon.damage)+' / '+c.hp+' KP':isMon?c.hp+' KP':'';
  return '<article class="mini-card" data-type="'+escape(c.type||'trainer')+'">'+
   '<div class="card-name">'+escape(c.name)+'</div>'+imgMarkup(id)+
   '<button type="button" class="inspect-btn" data-inspect="'+escape(id)+'">🔎 Karte vergrössern</button>'+
   '<div class="card-info">'+(isMon?energyIcon(c.type)+' '+health+(c.ex?' · ex':''):'📜 '+(c.kind==='supporter'?'Unterstützer':'Item'))+'</div>'+
   (mon?'<div class="card-info card-energy">Energie: '+(energy||'–')+'</div>':'')+
   (actionText?'<button class="card-action" '+(action?'data-action="'+escape(action)+'"':'disabled')+'>'+escape(actionText)+'</button>':'')+
   '</article>';
 }
 function optionLabel(option,side){
  const p=game.players[side];
  if(option.skip)return 'Keine Karte nehmen';
  if(choice?.effect==='forceSwitch')return 'Angstmacherei spielen – der Gegner entscheidet, welches Bank-Pokémon kommt';
  if('id' in option)return 'Nimm '+card(option.id).name+' auf die Hand';
  if('swap' in option)return option.swap?'Die zwei obersten Karten vertauschen':'Reihenfolge behalten';
  if('bottom' in option)return option.bottom?'Unter das Deck legen':'Oben lassen';
  if('yes' in option)return option.yes?'Ja, Zebritz ex nach vorne wechseln':'Nein, nicht wechseln';
  if('from' in option)return card(E.position(p,option.from).id).name+' → '+card(E.position(p,option.to).id).name+' (Energie '+(option.ei+1)+')';
  if('slot' in option){
   const victim=['bench20','forceSwitch'].includes(choice?.effect)?game.players[1-side]:p;
   const pokemon=E.position(victim,option.slot);
   return (option.slot==='active'?'Aktiv':'Bank '+(Number(option.slot)+1))+': '+card(pokemon.id).name;
  }
  return 'Jetzt spielen';
 }
 function showChoices(title,options,callback){
  choice={title,options,callback,effect:choice?.effect||null};
  renderChoices();
 }
 function renderChoices(){
  const host=$('choice');
  if(!choice){host.hidden=true;host.innerHTML='';return}
  host.hidden=false;
  host.innerHTML='<h3>'+escape(choice.title)+'</h3>'+
   '<div>'+choice.options.map((option,i)=>'<button class="option" data-choose="'+i+'">'+escape(optionLabel(option,0))+'</button>').join('')+'</div>'+
   '<button class="option" id="cancelChoice">Abbrechen</button>';
  host.querySelectorAll('[data-choose]').forEach(b=>b.onclick=()=>{
   const current=choice,option=current.options[Number(b.dataset.choose)];choice=null;
   try{current.callback(option)}catch(error){showNotice(error.message)}
   render();
  });
  $('cancelChoice').onclick=()=>{choice=null;render()};
  host.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function inspectCard(id){
  const c=card(id);if(!c)return;
  const name=escape(c.name);
  const el=document.createElement('div');el.className='pokemon-zoom';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Karte '+c.name);
  el.innerHTML='<div class="pokemon-zoom-backdrop"></div><div class="pokemon-zoom-content"><button type="button" class="action" data-close-zoom>✕ Schliessen</button><h2>'+name+'</h2>'+imgMarkup(id)+'</div>';
  document.body.appendChild(el);
  const close=()=>{document.removeEventListener('keydown',escapeKey);el.remove()};
  const escapeKey=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',escapeKey);
  el.querySelector('[data-close-zoom]').onclick=close;
  el.querySelector('.pokemon-zoom-backdrop').onclick=close;
  el.querySelector('[data-close-zoom]').focus();
 }
 function showNotice(message){const node=$('choice');node.hidden=false;node.innerHTML='<p class="warning">'+escape(message)+'</p><button class="option" id="dismiss">Schliessen</button>';$('dismiss').onclick=()=>{node.hidden=true;render()};}
 function take(fn){
  try{fn();if(game?.turn===1&&!game.gameOver)E.aiPlay(game);}catch(error){showNotice(error.message)}
  render();
 }
 function handAction(i){
  if(!game||game.turn!==0||game.gameOver)return;
  const cardId=game.players[0].hand[i],c=card(cardId),legal=E.legalOptions(game,0);
  if(!c)return;
  if(c.kind==='pokemon'){
   if(c.stage===0){take(()=>E.playBasic(game,0,i));return;}
   const options=legal.evolutions.filter(x=>x.handIndex===i).map(x=>({slot:x.slot}));
   if(!options.length){showNotice('Diese Entwicklung ist noch nicht möglich.');return;}
   showChoices('Wo möchtest du '+c.name+' entwickeln?',options,option=>take(()=>E.evolve(game,0,i,option.slot)));return;
  }
  const options=E.trainerOptions(game,0,cardId);
  if(!options.length){showNotice('Diese Trainerkarte kannst du gerade nicht einsetzen.');return;}
  choice={effect:c.effect};
  showChoices(c.name+' – Wirkung wählen',options,option=>take(()=>E.playTrainer(game,0,i,option)));
 }
 function showPending(){
  if(!game?.pending||game.pending.side!==0)return;
  if(game.pending.kind==='evolveSwitch'){
   showChoices('Zebritz ex: Möchtest du mit deinem aktiven Pokémon wechseln?',
    [{yes:true},{yes:false}],o=>take(()=>E.switchOnEvolution(game,0,o.yes)));
   return;
  }
  if(game.pending.kind==='postAttackSwitch'){
   showChoices('Mopex ex: Wähle ein Bank-Pokémon für den Wechsel nach dem Angriff.',
    game.players[0].bench.map((_,slot)=>({slot})),o=>take(()=>E.finishSwitch(game,0,o.slot)));
   return;
  }
  if(game.pending.kind==='postAttackLook'){
   showChoices('Damhirplex – oberste Karte: '+card(game.pending.cardId).name+'. Wohin soll sie?',
    [{bottom:false},{bottom:true}],o=>take(()=>E.finishLook(game,0,o.bottom)));
   return;
  }
  if(game.pending.kind==='forceSwitch'){
   showChoices('Angstmacherei: Der Computer zwingt dich zum Wechsel. Du darfst das Pokémon deiner Bank bestimmen.',
    game.players[0].bench.map((_,slot)=>({slot})),o=>take(()=>E.chooseForcedSwitch(game,0,o.slot)));
  }
 }
 function renderBattlefield(side,hostId){
  const p=game.players[side],self=side===0,legal=self?E.legalOptions(game,0):null;
  const slotControls=(slot,mon)=>{
   if(!self||game.turn!==0||game.gameOver||game.pending)return '';
   let html='';
   if(legal.attach.some(v=>String(v)===String(slot)))html+='<button class="card-action" data-attach="'+slot+'">⚡ Energie anhängen</button>';
   if(slot!=='active'&&legal.retreat.some(v=>String(v)===String(slot)))html+='<button class="card-action" data-retreat="'+slot+'">↩️ Aktives Pokémon ersetzen</button>';
   return html;
  };
  const display=slot=>{const m=E.position(p,slot);if(!m)return '<p class="muted">Noch kein Pokémon</p>';return cardMarkup(m.id,{mon:m})+slotControls(slot,m)};
  $(hostId).innerHTML='<h2>'+(self?'Deine Pokémon':'Computer · '+escape(deckName(p.id)))+'</h2><div class="board"><div class="active-zone"><h3>Aktiv</h3>'+display('active')+'</div><div class="bench-zone"><h3>Bank · '+p.bench.length+' / 3</h3><div class="cards">'+(p.bench.length?p.bench.map((_,i)=>display(i)).join(''):'<p class="muted">Leer</p>')+'</div></div></div>'+
   (!self?'<h3>Verdeckte Handkarten · '+p.hand.length+'</h3><div class="opponent-hand">'+p.hand.map(()=>'<div class="mini-back card-back" aria-label="Verdeckte Karte"></div>').join('')+'</div>':'');
 }
 function render(){
  if(!game)return;
  const turn=game.turn===0?'Du bist am Zug':'Der Computer ist am Zug';
  const p=game.players[0],bot=game.players[1];
  $('scorebar').innerHTML='<span>🏆 Du: '+p.points+' / 3</span><span>'+escape(game.gameOver?(game.winner===0?'Du gewinnst! 🎉':game.winner===1?'Computer gewinnt':'Unentschieden'):turn)+'</span><span>Computer: '+bot.points+' / 3 🏆</span>'+
    '<span>⚡ Energiezone (∞): '+(p.energyNext?energyIcon(p.energyNext):'leer')+(p.attached?' · Energie für diesen Zug angehängt':' · Energie bereit')+'</span>'+
    '<span>Karten: '+p.pile.length+' | Computer: '+bot.pile.length+'</span>';
  renderBattlefield(1,'enemy');renderBattlefield(0,'yours');
  const legal=E.legalOptions(game,0);
  $('hand').innerHTML=p.hand.length?p.hand.map((id,i)=>cardMarkup(id,{actionText:'Karte spielen',action:game.turn===0&&!game.pending?'hand:'+i:null})).join(''):'<p>Keine Handkarten.</p>';
  $('actions').innerHTML='<button class="action primary" id="finishTurn" '+(game.turn!==0||game.gameOver||game.pending?'disabled':'')+'>Zug beenden</button>'+
   legal.attacks.map(x=>'<button class="action" data-attack="'+x.index+'">⚔️ '+escape(x.attack.name)+' ('+x.attack.damage+'+)</button>').join('')+
   (game.gameOver?'<button class="big-button" id="newGame">Neue Partie</button>':'')+
   (game.turn===1&&!game.gameOver?'<span class="status">🤖 Der Computer denkt …</span>':'');
  $('gameLog').innerHTML=game.log.map(message=>'<li>'+escape(message)+'</li>').join('');
  document.querySelectorAll('[data-inspect]').forEach(b=>b.onclick=()=>inspectCard(b.dataset.inspect));
  document.querySelectorAll('[data-action^="hand:"]').forEach(b=>b.onclick=()=>handAction(Number(b.dataset.action.split(':')[1])));
  document.querySelectorAll('[data-attach]').forEach(b=>b.onclick=()=>take(()=>E.attach(game,0,b.dataset.attach==='active'?'active':Number(b.dataset.attach))));
  document.querySelectorAll('[data-retreat]').forEach(b=>b.onclick=()=>take(()=>E.retreat(game,0,Number(b.dataset.retreat))));
  document.querySelectorAll('[data-attack]').forEach(b=>b.onclick=()=>take(()=>E.attack(game,0,Number(b.dataset.attack))));
  if($('finishTurn'))$('finishTurn').onclick=()=>take(()=>E.endTurn(game,0));
  if($('newGame'))$('newGame').onclick=()=>{$('setup').hidden=false;$('game').hidden=true;game=null};
  if(game.pending?.side===0&&!choice)showPending();else renderChoices();
 }
 function renderDeckPreview(){
  const id=$('yourDeck').value,deck=D.decks.find(d=>d.id===id);if(!deck)return;
  const pokemon=Object.entries(deck.ids).filter(([id])=>card(id).kind==='pokemon');
  $('deckPreview').innerHTML='<h3>'+energyIcon(deck.type)+' '+escape(deck.name)+' · '+('⭐'.repeat(deck.level))+'</h3><p>'+
   pokemon.map(([id,num])=>num+'× '+escape(card(id).name)).join(' · ')+'</p><small>20 Karten · Energie: '+(deck.type==='colorless'?'gemischte Energietypen':icon(deck.type)+' '+escape(deck.type))+'</small>';
 }
 function start(){
  const selected=$('yourDeck').value;
  const alternatives=D.decks.filter(x=>x.id!==selected&&x.id!==lastOpponent);
  const bot=(alternatives.length?alternatives:D.decks.filter(x=>x.id!==selected))[Math.floor(Math.random()*(alternatives.length||5))];
  lastOpponent=bot.id;
  game=E.createGame(selected,bot.id,$('difficulty').value);
  choice=null;
  $('setup').hidden=true;$('game').hidden=false;
  if(game.turn===1)E.aiPlay(game);
  render();
  $('game').scrollIntoView({block:'start'});
 }
 $('yourDeck').innerHTML=D.decks.map(d=>'<option value="'+d.id+'">'+icon(d.type)+' '+escape(d.name)+' · '+('⭐'.repeat(d.level))+'</option>').join('');
 $('yourDeck').onchange=renderDeckPreview;
 $('start').onclick=start;
 renderDeckPreview();
})();
