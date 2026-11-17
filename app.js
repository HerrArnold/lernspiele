'use strict';
// LernSafari · UI prototype. No server, no real authentication, no protected pupil data.
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const state = {screen:'login', role:'guest', username:'Gast', modal:null, destination:null, dateOffset:0, tasks:{}, introBusy:false, toastTimer:null};
const DOM = {login:$('#loginScreen'),camp:$('#campScreen'),destination:$('#destinationScreen'),admin:$('#adminScreen'),topbar:$('#topbar'),layer:$('#modalLayer'),modal:$('#modal'),modalBody:$('#modalBody'),modalTitle:$('#modalTitle'),modalIcon:$('#modalIcon'),modalEyebrow:$('#modalEyebrow')};
const escapeHtml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt = (date,options) => new Intl.DateTimeFormat('de-CH',{timeZone:'Europe/Zurich',...options}).format(date);
const now = () => new Date();
const startOfDay = (date=new Date()) => {const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(date).split('-');return new Date(`${parts.join('-')}T12:00:00+01:00`)};
const dayWithOffset = n => {const d=startOfDay();d.setUTCDate(d.getUTCDate()+n);return d};
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove('show'),3600)}
function showScreen(name){state.screen=name;DOM.login.hidden=name!=='login';DOM.camp.hidden=name!=='camp';DOM.destination.hidden=name!=='destination';DOM.admin.hidden=name!=='admin';DOM.topbar.hidden=name==='login';if($('#adminNav'))$('#adminNav').hidden=!['demo-admin','cloudflare-admin'].includes(state.role);if(name==='camp'){$('#userLabel').textContent=state.username;$('#greeting').textContent=state.role==='guest'?'🌴 Willkommen in der LernSafari!':'🌴 Schön, dass du da bist, '+state.username+'!';if(state.role!=='cloudflare-child')$('#mailIndicator').hidden=true}window.scrollTo({top:0,behavior:'instant'});}
function enter(role,username){if(state.introBusy)return;state.introBusy=true;state.role=role;state.username=username;$('#loginScene').classList.add('intro-exit');setTimeout(()=>{showScreen('camp');$('#campScene').classList.add('camp-enter');$('#loginScene').classList.remove('intro-exit');state.introBusy=false;history.replaceState({screen:'camp'},'','#camp');setTimeout(()=>$('#campScene').classList.remove('camp-enter'),700)},window.matchMedia('(prefers-reduced-motion:reduce)').matches?0:520)}
// Cloudflare authentication owns the login; do not start a local demo session.
$('#loginForm').addEventListener('submit',e=>{e.preventDefault();toast('Die Anmeldung über Cloudflare ist gerade nicht erreichbar.');});
function exit(){cancelObjectAnimation();closeModal(true);showScreen('login');$('#username').value='';$('#password').value='';state.role='guest';state.username='Gast';history.replaceState({screen:'login'},'','#start')}
$('#logoutBtn').addEventListener('click',exit);
$('#adminPageBack').addEventListener('click',goCamp);
$('#homeBtn').addEventListener('click',goCamp);
$('#backToCamp').addEventListener('click',goCamp);
function goCamp(){cancelObjectAnimation();closeModal(true);showScreen('camp');state.destination=null;history.pushState({screen:'camp'},'','#camp')}
function showModal(kind){
 if(state.modal)return;
 if(kind==='admin'){
  // Administration is an authenticated, full-viewport subpage, never a modal.
  if(state.role!=='cloudflare-admin')return;
  state.modal='admin';
  DOM._originalModalBody=DOM.modalBody;
  DOM.modalBody=$('#adminPageBody');
  showScreen('admin');
  window.scrollTo(0,0);
  renderModal();
  history.pushState({screen:'admin',modal:'admin'},'','#admin');
  return;
 }
 const config={logbook:['📖','Mein Logbuch','Dein persönlicher Lernplatz'],map:['🗺️','Karte','Wohin führt deine Reise?'],agenda:['🧭','Kompass & Agenda','Deine Woche im Überblick'],mail:['✉️','Briefkasten','Deine persönliche Post'],clock:['🕰️','Meine Tagesübersicht','Heute in der LernSafari'],help:['🦩','Hallo, Safari-Forscher!','Der Flamingo hilft dir'],admin:['🛠️','Verwaltung','Lokale Demo für Lehrpersonen']};if(!config[kind])return;state.modal=kind;DOM.modalIcon.textContent=config[kind][0];DOM.modalTitle.textContent=config[kind][1];DOM.modalEyebrow.textContent=config[kind][2];DOM.modal.className='modal parchment modal-kind-'+kind;DOM.layer.hidden=false;renderModal();document.body.style.overflow='hidden';setTimeout(()=>DOM.modal.focus(),20);history.pushState({screen:state.screen,modal:kind},'','#'+kind)}
function closeModal(immediate=false,fromPop=false){
  if(!state.modal)return;
  if(state.modal==='admin'){
   state.modal=null;
   DOM.modalBody=DOM._originalModalBody||$('#modalBody');
   DOM._originalModalBody=null;
   showScreen('camp');
   if(!fromPop)history.replaceState({screen:'camp'},'','#camp');
   return;
  }
  state.modal=null;
  document.body.style.overflow='';
  DOM.layer.hidden=true;
  DOM.modal.className='modal parchment';
  $('#modalBackdrop').classList.remove('closing');
  if(!fromPop&&location.hash!=='#camp')history.replaceState({screen:'camp'},'','#camp');
}
$('#closeModal').addEventListener('click',()=>closeModal());$('#modalBack').addEventListener('click',()=>closeModal());$('#modalBackdrop').addEventListener('click',()=>closeModal());
// Camp objects open their content directly. No object or individual opening animations.
function cancelObjectAnimation(){} // compatibility with screen transitions
$$('[data-open]').forEach(button=>button.addEventListener('click',()=>showModal(button.dataset.open)));
$('#flamingoHelp').addEventListener('click',()=>showModal('help'));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.modal)closeModal(true)});
const tasks=[['math','🔢 Zahl des Tages'],['music','🎵 Solmisation üben'],['german','✏️ Deutsch: Wörter entdecken']];
function renderModal(){switch(state.modal){case 'logbook':renderLogbook();break;case 'map':renderMap();break;case 'agenda':renderAgenda();break;case 'mail':renderMail();break;case 'clock':renderClock();break;case 'help':renderHelp();break;}}
function renderLogbook(){if(state.role==='guest'){DOM.modalBody.innerHTML=`<div class="today-card"><div style="font-size:52px">🔒</div><h3>Dieses Logbuch gehört nur dir!</h3><p>Persönliche Aufgaben und Erfolge sind nur für angemeldete Kinder sichtbar.</p><p class="muted">Bitte melde dich mit deinem eigenen Konto an.</p></div>`;return}
const completed=tasks.filter(([id])=>state.tasks[id]).length;DOM.modalBody.innerHTML=`<div class="two-pages"><div class="page"><h3>📝 Meine Aufgaben</h3>${tasks.map(([id,label])=>`<label class="task"><input type="checkbox" data-task="${id}" ${state.tasks[id]?'checked':''}><span>${label}</span></label>`).join('')}<p class="muted">Aufgaben dieses Prototyps sind nur zur Demonstration vorhanden.</p></div><div class="page"><h3>⭐ Meine Erfolge</h3><p>Du hast <strong>${completed} von ${tasks.length}</strong> Demo-Aufgaben abgehakt.</p><div class="progress"><span style="width:${completed/tasks.length*100}%"></span></div><p>${completed===tasks.length?'Super! Du hast alle Demo-Aufgaben geschafft! 🎉':'Schritt für Schritt kommst du ans Ziel. 🐾'}</p><div class="notice">💚 Fehler sind erlaubt – du lernst jeden Tag dazu!</div></div></div><p class="muted">Hinweis: Diese Demo speichert keine Lernleistungen auf einem Server. Beim Neuladen werden die Häkchen zurückgesetzt.</p>`;$$('[data-task]',DOM.modalBody).forEach(c=>c.addEventListener('change',()=>{state.tasks[c.dataset.task]=c.checked;renderLogbook()}))}
const places=[{id:'lagoon',emoji:'🌊',title:'Lern-Lagune',sub:'Schulfächer & Lernspiele',description:'Hier erwarten dich Lernspiele und Übungen für Mathematik, Deutsch, NMG, Musik und weitere Fächer.'},{id:'valley',emoji:'🌞',title:'Tages-Tal',sub:'Deine tägliche Herausforderung',description:'Eine Zahl des Tages und abwechslungsreiche kurze Aufgaben begleiten deine täglichen Lernabenteuer.'},{id:'baobab',emoji:'🌳',title:'Baobab-Baum',sub:'Hakuna Matata & Klassenwelt',description:'Entdecke deine Klassentiere, Geschichten, Projekte und besondere Aktionen wie den Adventskalender.'},{id:'oasis',emoji:'🏝️',title:'Oase',sub:'Rätsel, Spielen & Kreativität',description:'Ein Ort für freiwillige Knobelspiele, Sudokus, Schach, Malen und weitere Entdeckungen.'}];
function renderMap(){
  // All text and interactive labels are HTML, never baked into the illustration.
  const zones=[
    ['valley','🌞 Tages-Tal','valley'],
    ['lagoon','🌊 Lern-Lagune','lagoon'],
    ['camp','⛺ Camp','camp'],
    ['baobab','🌳 Baobab-Baum','baobab'],
    ['oasis','🏝️ Oase','oasis']
  ];
  DOM.modalBody.innerHTML=`<p class="map-intro">Wähle einen Ort und starte deine Expedition!</p>
    <div class="map-scroll" aria-label="Karte der LernSafari mit fünf auswählbaren Orten">
      <div class="safari-map">
        <img src="assets/karte-stickerwelt.webp" onload="if(this.currentSrc.includes('karte-stickerwelt.webp')||this.currentSrc.includes('karte.png'))this.parentNode.classList.add('map-has-character-art')" onerror="if(!this.dataset.fallback){this.dataset.fallback='original';this.src='assets/karte.png'}else{this.onerror=null;this.src='assets/karte-ohne-schilder.svg'}" alt="Safari-Landschaft mit Tages-Tal links oben, Lern-Lagune rechts oben, Camp in der Mitte, Baobab links unten und Oase rechts unten." draggable="false">
        <img class="map-mascot map-mascot-valley" src="assets/hornvogel-sticker.svg" alt="" aria-hidden="true" draggable="false">
        <img class="map-mascot map-mascot-lagoon" src="original/assets/tiersticker/erdmaennchen.png" alt="" aria-hidden="true" draggable="false">
        <img class="map-mascot map-mascot-camp" src="original/assets/tiersticker/flamingo.png" alt="" aria-hidden="true" draggable="false">
        <img class="map-mascot map-mascot-baobab" src="original/assets/tiersticker/loewe.png" alt="" aria-hidden="true" draggable="false">
        <img class="map-mascot map-mascot-oasis" src="original/assets/tiersticker/warzenschwein.png" alt="" aria-hidden="true" draggable="false">
        ${zones.map(([id,label,dest])=>`<button type="button" class="map-hotspot map-hotspot-${id}" data-map-destination="${dest}" aria-label="${label} besuchen"><span>${label}</span></button>`).join('')}
      </div>
    </div>
    <div class="map-mobile-links" aria-label="Orte auf der Karte">${zones.map(([id,label,dest])=>`<button class="map-mobile-place" data-map-destination="${dest}">${label}</button>`).join('')}</div>`;
  $$('[data-map-destination]',DOM.modalBody).forEach(b=>b.addEventListener('click',()=>{
    const id=b.dataset.mapDestination;
    if(id==='camp'){goCamp();return}
    travelTo(id);
  }));
}
function travelTo(id){const place=places.find(p=>p.id===id);if(!place)return;closeModal(true);state.destination=id;showScreen('destination');$('#destinationScreen').classList.toggle('is-lagoon',id==='lagoon');$('#destinationScreen').classList.toggle('is-valley',id==='valley');$('#destinationScreen').classList.toggle('is-baobab',id==='baobab');$('#destinationScreen').classList.toggle('is-oasis',id==='oasis');if(id==='valley'){
  $('#destEmoji').innerHTML='<img class="valley-hornvogel-title" src="assets/hornvogel-froehlich.webp" onerror="this.onerror=null;this.src=\'assets/hornvogel-sticker.svg\'" alt="Fröhlicher Hornvogel, Begleiter im Tages-Tal">';
 }else{$('#destEmoji').textContent=place.emoji;}$('#destTitle').textContent=place.title;$('#destText').textContent=place.description;renderDestination(place);history.pushState({screen:'destination',id},'',`#${id}`)}
// Fächer der Lern-Lagune. Dies sind vorerst Zugänge, keine behaupteten fertigen Lernspiele.
const lagoonSubjects = [
  {id:'math',name:'Mathematik',icon:'🔢',heading:'Zahlen entdecken',description:'Hier kannst du die 3er- und 6er-Reihe üben und Zahlen aus Hundertern, Zehnern und Einern bauen.',ideas:['Zahl des Tages','Reihen üben','Zahlen legen']},
  {id:'german',name:'Deutsch',icon:'✏️',heading:'Mit Sprache spielen',description:'Hier kommen Übungen zu Nomen, Verben, Adjektiven, Lesen und Schreiben hin.',ideas:['Wortarten','Lesen','Rechtschreiben']},
  {id:'nmg',name:'NMG',icon:'🌿',heading:'Unsere Welt erforschen',description:'Hier finden die Kinder Spiele und Wissensaufgaben zum NMG-Unterricht.',ideas:['Rabenvögel','Vögel und Federn','Forscherfragen']},
  {id:'music',name:'Musik',icon:'🎵',heading:'Töne und Rhythmen',description:'Die bereits entwickelten Solmisations- und Rhythmusspiele sollen hier später eingebunden werden. Ihre Regeln bleiben erhalten.',ideas:['Solmisation','Rhythmussprache','Noten erkennen']},
  {id:'english',name:'Englisch',icon:'🗣️',heading:'Body & Actions',description:'Übe englische Körperteile und Bewegungen ohne Schreiben.',ideas:['Wörter zuordnen','Karteikarten','Mündlich üben']}
];
let activeLagoonSubject=null;
let activeMusicGame=null;
let musicRound=null;
let germanRound=null;
let activeGermanGame=null;
function renderLagoon(){
  const content=$('#destinationContent');
  if(activeLagoonSubject){
    if(activeLagoonSubject==='math'){renderMathSection();return}
    if(activeLagoonSubject==='music'){renderMusicSection();return}
    if(activeLagoonSubject==='german'){renderGermanSection();return}
    if(activeLagoonSubject==='nmg'){renderNmgSection();return}
    if(activeLagoonSubject==='english'){renderEnglishSection();return}
    const subject=lagoonSubjects.find(s=>s.id===activeLagoonSubject);
    if(!subject){activeLagoonSubject=null;return renderLagoon()}
    content.innerHTML=`<section class="lagoon-subject" aria-label="${subject.name}">
      <button type="button" class="lagoon-return" id="backToLagoon">← Zur Lern-Lagune</button>
      <div class="subject-header"><span class="subject-symbol" aria-hidden="true">${subject.icon}</span><div><div class="eyebrow">Lern-Lagune · ${subject.name}</div><h2>${subject.heading}</h2><p>${subject.description}</p></div></div>
      <h3>Das erwartet dich hier</h3><div class="subject-preview">${subject.ideas.map(i=>`<div class="subject-idea"><span aria-hidden="true">✦</span>${i}</div>`).join('')}</div>
      <div class="subject-note">🛠️ Die Fachauswahl ist bereits bedienbar. Die eigentlichen Lernspiele werden in den nächsten Entwicklungsschritten integriert.</div>
    </section>`;
    $('#backToLagoon').addEventListener('click',()=>{activeLagoonSubject=null;activeMusicGame=null;renderLagoon()});
    return;
  }
  content.innerHTML=`<div class="lagoon-heading"><p>Wähle einen Stein und entdecke dein Fach!</p></div>
    <div class="lagoon-scroller" tabindex="0" aria-label="Lern-Lagune mit fünf anklickbaren Fachsteinen">
      <div class="lagoon-scene">
        <img src="assets/lern-lagune.png" alt="Lern-Lagune mit Wasserfall und fünf beschrifteten Felsen für Mathematik, Deutsch, NMG, Musik und Englisch." draggable="false">
        ${lagoonSubjects.map(s=>`<button class="lagoon-hotspot lagoon-hotspot-${s.id}" data-lagoon-subject="${s.id}" aria-label="${s.name} öffnen" title="${s.name}"><span class="sr-only">${s.name}</span></button>`).join('')}
      </div>
    </div>
    <div class="lagoon-mobile-links" aria-label="Schulfächer">${lagoonSubjects.map(s=>`<button type="button" data-lagoon-subject="${s.id}">${s.icon} ${s.name}</button>`).join('')}</div>
    <p class="lagoon-footnote">Alle Kinder dürfen die freigegebenen Lernspiele auch ohne Anmeldung benutzen.</p>`;
  $$('[data-lagoon-subject]',content).forEach(b=>b.addEventListener('click',()=>{activeLagoonSubject=b.dataset.lagoonSubject;renderLagoon();document.getElementById('destinationScreen').scrollIntoView({block:'start',behavior:'instant'})}));
}


// Version 1.6 – English vocabulary from the teacher's supplied Body & Actions list.
// Neither exercise requires typing; flashcards are intended for speaking aloud.
const ENGLISH_VOCI=[
 ['Jump on one leg.','Spring/Hüpf auf einem Bein.'],
 ['Turn your head.','Dreh den Kopf.'],
 ['Shut your eyes.','Schliess die Augen.'],
 ['Lift your shoulders.','Heb die Schultern.'],
 ['Open your mouth wide.','Öffne den Mund weit.'],
 ['Bend your knees.','Beug die Knie. Mach Kniebeugen.'],
 ['Put your arms up.','Heb die Arme hoch.'],
 ['Kick your foot.','Tritt mit dem Fuss.'],
 ['Clap your hands!','Klatsch in die Hände!'],
 ['face','Gesicht'],
 ['eyebrow','Augenbraue'],
 ['ear','Ohr'],
 ['nose','Nase'],
 ['tooth (pl. teeth)','Zahn'],
 ['neck','Hals, Nacken'],
 ['hand','Hand'],
 ['elbow','Ellbogen'],
 ['finger','Finger'],
 ['foot (pl. feet)','Fuss'],
 ['toes','Zehen'],
 ['move','(sich) bewegen'],
 ['touch','berühren'],
 ['run','laufen, rennen'],
 ['shake','schütteln'],
 ['I have long hair.','Ich habe langes Haar.'],
 ['He is tall.','Er ist gross.'],
 ['body','Körper'],
 ['bone','Knochen'],
 ['muscle','Muskel']
];
const englishShuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let englishMode=null,englishMatch=null,englishCards=null;
function englishBack(){englishMode=null;englishMatch=null;englishCards=null;renderEnglishSection()}
function renderEnglishSection(){
 const root=$('#destinationContent');
 if(englishMode==='match'){renderEnglishMatching();return}
 if(englishMode==='cards'){renderEnglishCards();return}
 root.innerHTML=`<section class="lagoon-subject english-home"><button class="lagoon-return" id="backToLagoon">← Zur Lern-Lagune</button>
 <div class="subject-header"><span class="subject-symbol" aria-hidden="true"><img class="safari-uk-flag" src="assets/uk-flag.svg" alt="" aria-hidden="true"></span><div><div class="eyebrow">Lern-Lagune · Englisch</div><h2>Body & Actions</h2><p>Übe deine Wörter und Sätze zum Körper und zu Bewegungen – ganz ohne Schreiben!</p></div></div>
 <div class="english-mode-grid"><button id="englishStartMatch" class="english-mode-card"><span aria-hidden="true">🧩</span><strong>Wörter zuordnen</strong><small>Finde die passenden englischen und deutschen Ausdrücke. Immer 5 Paare.</small></button>
 <button id="englishStartCards" class="english-mode-card"><span aria-hidden="true">🗂️</span><strong>Karteikarten</strong><small>Sprich die Übersetzung laut aus und drehe die Karte um.</small></button></div>
 <p class="muted">${ENGLISH_VOCI.length} Wörter und Sätze aus deinem aktuellen Voci · Als Gast spielbar · Kein Schreiben nötig</p></section>`;
 $('#backToLagoon').onclick=()=>{activeLagoonSubject=null;renderLagoon()};
 $('#englishStartMatch').onclick=()=>{englishMode='match';englishMatch={remaining:englishShuffle(ENGLISH_VOCI.map((_,i)=>i)),batch:[],left:null,right:null,matched:[],solved:0,mistakes:0,feedback:'',busy:false};englishNextBatch();renderEnglishMatching()};
 $('#englishStartCards').onclick=()=>{englishMode='cards';englishCards={order:englishShuffle(ENGLISH_VOCI.map((_,i)=>i)),index:0,flipped:false,reversed:false};renderEnglishCards()};
}
function englishNextBatch(){const r=englishMatch;r.batch=r.remaining.splice(0,5);r.left=null;r.right=null;r.matched=[];r.feedback='';r.busy=false;r.leftOrder=englishShuffle(r.batch);r.rightOrder=englishShuffle(r.batch)}
function renderEnglishMatching(){
 const root=$('#destinationContent'),r=englishMatch;
 if(!r.batch.length&&r.remaining.length===0){root.innerHTML=`<section class="music-game english-game"><button class="lagoon-return" id="englishBack">← Zu Englisch</button><div class="game-finish"><h2>🌟 Alle Paare gefunden!</h2><p>Du hast ${r.solved} von ${ENGLISH_VOCI.length} Paaren richtig zugeordnet.</p><p>Du hast ${r.mistakes} ${r.mistakes===1?'Versuch':'Versuche'} gebraucht, bei denen die Wörter nicht zusammenpassten.</p><button class="primary" id="englishRestart">Noch einmal spielen</button></div></section>`;$('#englishBack').onclick=englishBack;$('#englishRestart').onclick=()=>{englishMatch={remaining:englishShuffle(ENGLISH_VOCI.map((_,i)=>i)),batch:[],left:null,right:null,matched:[],solved:0,mistakes:0,feedback:'',busy:false};englishNextBatch();renderEnglishMatching()};return}
 const options=(order,side)=>order.map(id=>`<button type="button" class="english-pair ${r.matched.includes(id)?'is-matched':''} ${r[side]===id?'is-selected':''}" data-pair-side="${side}" data-pair-id="${id}" ${r.matched.includes(id)||r.busy?'disabled':''} aria-pressed="${r[side]===id}">${escapeHtml(ENGLISH_VOCI[id][side==='left'?0:1])}${r.matched.includes(id)?' ✓':''}</button>`).join('');
 root.innerHTML=`<section class="music-game english-game"><button class="lagoon-return" id="englishBack">← Zu Englisch</button>
 <div class="game-top"><div><div class="eyebrow">Englisch · Body & Actions</div><h2>Wörter zuordnen</h2><p>${r.solved} von ${ENGLISH_VOCI.length} Paaren gefunden</p></div><strong>🧩 ${r.matched.length}/ ${r.batch.length}</strong></div>
 <div class="english-instruction">Tippe zuerst auf ein englisches Wort und dann auf die passende deutsche Bedeutung.</div>
 <div class="english-pair-columns"><div><h3><img class="safari-uk-flag" src="assets/uk-flag.svg" alt="" aria-hidden="true"> Englisch</h3>${options(r.leftOrder,'left')}</div><div><h3>🇨🇭 Deutsch</h3>${options(r.rightOrder,'right')}</div></div>
 <p class="english-match-feedback" role="status">${escapeHtml(r.feedback||'Finde zwei passende Karten.')}</p>
 ${r.matched.length===r.batch.length?`<button class="primary" id="englishNextBatch">${r.remaining.length?'Nächste 5 Paare →':'Ergebnis ansehen'}</button>`:''}</section>`;
 $('#englishBack').onclick=englishBack;
 $$('[data-pair-id]',root).forEach(b=>b.onclick=()=>{
  const side=b.dataset.pairSide,id=Number(b.dataset.pairId);if(r.busy||r.matched.includes(id))return;
  r[side]=id;r.feedback='';
  if(r.left!==null&&r.right!==null){
   if(r.left===r.right){r.matched.push(id);r.solved++;r.feedback='Richtig! 🌟';r.left=null;r.right=null;renderEnglishMatching()}
   else{r.mistakes++;r.feedback='Das passt noch nicht. Probiere es nochmals!';r.busy=true;renderEnglishMatching();setTimeout(()=>{if(englishMode!=='match'||englishMatch!==r)return;r.left=null;r.right=null;r.busy=false;renderEnglishMatching()},850)}
  }else renderEnglishMatching();
 });
 const next=$('#englishNextBatch');if(next)next.onclick=()=>{englishNextBatch();renderEnglishMatching()};
}
function renderEnglishCards(){
 const root=$('#destinationContent'),r=englishCards,id=r.order[r.index],pair=ENGLISH_VOCI[id],front=pair[r.reversed?1:0],back=pair[r.reversed?0:1];
 root.innerHTML=`<section class="music-game english-game"><button class="lagoon-return" id="englishBack">← Zu Englisch</button>
 <div class="game-top"><div><div class="eyebrow">Englisch · Body & Actions</div><h2>Karteikarten</h2><p>Karte ${r.index+1} von ${r.order.length}</p></div><button type="button" class="english-direction" id="englishDirection">${r.reversed?'🇨🇭 Deutsch → Englisch':'Englisch → Deutsch'} ↔</button></div>
 <p class="english-instruction">Sprich die Übersetzung laut aus. Tippe dann auf die Karte, um sie aufzudecken.</p>
 <button class="english-flashcard ${r.flipped?'is-flipped':''}" id="englishFlip" aria-label="Karte umdrehen"><span class="english-flash-label">${r.flipped?'Lösung':'Übersetze mündlich'}</span><span class="english-flash-text">${escapeHtml(r.flipped?back:front)}</span><span class="english-flash-hint">${r.flipped?'Tippe, um das Wort wieder zu sehen':'Tippe, um die Lösung zu sehen'}</span></button>
 <div class="english-card-nav"><button id="englishPrev" class="secondary" ${r.index===0?'disabled':''}>← Vorherige</button><button id="englishNext" class="primary">${r.index===r.order.length-1?'Neu mischen ↻':'Nächste Karte →'}</button></div>
 <p class="muted">Du brauchst nichts aufzuschreiben. Übe die Aussprache auch gemeinsam mit einem anderen Kind.</p></section>`;
 $('#englishBack').onclick=englishBack;
 $('#englishFlip').onclick=()=>{r.flipped=!r.flipped;renderEnglishCards()};
 $('#englishPrev').onclick=()=>{if(r.index>0){r.index--;r.flipped=false;renderEnglishCards()}};
 $('#englishNext').onclick=()=>{if(r.index===r.order.length-1){r.order=englishShuffle(ENGLISH_VOCI.map((_,i)=>i));r.index=0}else r.index++;r.flipped=false;renderEnglishCards()};
 $('#englishDirection').onclick=()=>{r.reversed=!r.reversed;r.flipped=false;renderEnglishCards()};
}

// Standalone original music mini-games, reconstructed from the agreed learning rules.
// They do not pretend to be the original source files from earlier conversations.
const SOL_SYLLABLES=['Do','Re','Mi','Fa','So','La','Ti','Do'];
const SOL_COLOR_NAMES=['Rot','Orange','Gelb','Hellgrün','Dunkelgrün','Blau','Violett','Rot'];
const SOL_COLORS=['#de3e35','#f28a28','#f2c72a','#a3d65d','#277c41','#337bcc','#8852b9','#de3e35'];
const COLOR_POOL=[
  ['Rot','#de3e35'],['Orange','#f28a28'],['Gelb','#f2c72a'],['Hellgrün','#a3d65d'],
  ['Dunkelgrün','#277c41'],['Blau','#337bcc'],['Violett','#8852b9'],['Schwarz','#252525'],
  ['Weiss','#ffffff'],['Braun','#91623f'],['Pink','#e97aaf'],['Türkis','#3ac6ba']
];
const RHYTHMS=[
 {id:'whole',name:'Ganze Note',speech:'Ta-a-a-a',symbol:'whole'},
 {id:'dotted',name:'Punktierte Halbe',speech:'Ta-a-a',symbol:'dotted'},
 {id:'half',name:'Halbe Note',speech:'Ta-a',symbol:'half'},
 {id:'quarter',name:'Viertelnote',speech:'Ta',symbol:'quarter'},
 {id:'rest',name:'Viertelpause',speech:'Sa',symbol:'rest'},
 {id:'eighth',name:'Zwei Achtelnoten',speech:'Ta-te',symbol:'eighth'}
];
function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function renderMusicSection(){
 const root=$('#destinationContent');
 if(activeMusicGame==='sol'){renderSolGame();return}
 if(activeMusicGame==='rhythm'){renderRhythmGame();return}
 root.innerHTML=`<section class="lagoon-subject music-home">
 <button class="lagoon-return" id="backToLagoon">← Zur Lern-Lagune</button>
 <div class="subject-header"><span class="subject-symbol" aria-hidden="true">🎵</span><div><div class="eyebrow">Lern-Lagune · Musik</div><h2>Musik entdecken</h2><p>Wähle ein Spiel und übe Töne oder Rhythmen.</p></div></div>
 <div class="music-cards"><button class="music-card" data-music="sol"><span class="music-card-icon">🎼</span><strong>Solmisationsspiel</strong><small>Noten lesen · Silben und Farben erkennen</small><span class="play-label">Spielen →</span></button>
 <button class="music-card" data-music="rhythm"><span class="music-card-icon">🥁</span><strong>Rhythmusspiel</strong><small>Notenbilder · Notennamen · Rhythmussprache</small><span class="play-label">Spielen →</span></button></div>
 <p class="music-warning">Diese zwei Spiele sind neu programmierte, spielbare Testversionen nach den bisherigen Unterrichtsregeln. Sie ersetzen noch nicht die früheren Originalspiele.</p>
 </section>`;
 $('#backToLagoon').onclick=()=>{activeLagoonSubject=null;activeMusicGame=null;renderLagoon()};
 $$('[data-music]',root).forEach(b=>b.onclick=()=>{activeMusicGame=b.dataset.music;musicRound=null;renderMusicSection()});
}
function musicBack(){activeMusicGame=null;musicRound=null;renderMusicSection()}
function newSolRound(){
 if(!musicRound){
  // Balanced 10-question round: all eight notes appear once, two appear twice.
  // Only the order and the two repeated notes change randomly between rounds.
  const notes=shuffle([...Array(8).keys()]);
  const repeats=shuffle([...Array(8).keys()]).slice(0,2);
  musicRound={mode:'sol',index:0,total:10,hearts:3,score:0,answered:false,chosenSyllable:null,chosenColor:null,done:false,noteSequence:shuffle([...notes,...repeats])};
 }
 const r=musicRound;
 r.note=r.noteSequence[r.index];r.answered=false;r.chosenSyllable=null;r.chosenColor=null;
 r.options=shuffle(COLOR_POOL);
}
function staffSvg(note){
 // Treble clef: C4 ledger line y=142, D4 gap y=132, E4 line y=122, up to C5 gap y=72.
 const y=142-note*10;const ledger=note===0?'<line x1="83" y1="142" x2="141" y2="142" stroke="#5b4430" stroke-width="2"/>':'';
 const stem=note>=5?`<line x1="99" y1="${y}" x2="99" y2="${y+42}" stroke="#322e2a" stroke-width="2.5"/>`:`<line x1="124" y1="${y}" x2="124" y2="${y-42}" stroke="#322e2a" stroke-width="2.5"/>`;
 return `<svg class="staff-svg" viewBox="0 0 245 165" role="img" aria-label="Note im Violinschlüssel bestimmen"><g stroke="#6a503a" stroke-width="1.8">${[42,62,82,102,122].map(l=>`<line x1="35" x2="216" y1="${l}" y2="${l}"/>`).join('')}</g><text x="39" y="116" font-family="serif" font-size="90" fill="#40352c">𝄞</text>${ledger}<ellipse cx="112" cy="${y}" rx="13" ry="9" fill="#282c2a" transform="rotate(-17 112 ${y})"/>${stem}</svg>`
}
function solFeedback(r){return `<section class="music-feedback ${r.correct?'is-correct':'is-wrong'}"><strong>${r.correct?'Richtig! 🌟':'Noch nicht richtig.'}</strong><p>Deine Antwort: ${r.chosenSyllable||'–'} · ${r.chosenColor||'–'}</p><p>Richtige Antwort: <strong>${SOL_SYLLABLES[r.note]} · ${SOL_COLOR_NAMES[r.note]}</strong></p>${!r.correct?`<p class="muted">Merke: Die Leiter beginnt unten beim Do (c').</p>`:''}<button class="primary" id="nextSol">${r.index+1>=r.total?'Ergebnis ansehen':'Nächster Ton →'}</button></section>`}
function renderSolGame(){
 const root=$('#destinationContent');const r=musicRound;
 if(r&&r.done){root.innerHTML=`<section class="music-game"><button class="lagoon-return" id="musicBack">← Zur Musik</button><div class="game-finish"><h2>🌟 Geschafft!</h2><p>Du hast ${r.score} von ${r.index} Tönen richtig bestimmt.</p><button class="primary" id="solRestart">Noch einmal spielen</button></div></section>`;$('#musicBack').onclick=musicBack;$('#solRestart').onclick=()=>{musicRound=null;renderSolGame()};return}
 if(!r||r.mode!=='sol')newSolRound();
 const x=musicRound;
 root.innerHTML=`<section class="music-game"><button class="lagoon-return" id="musicBack">← Zur Musik</button>
 <div class="game-top"><div><div class="eyebrow">Musik · Solmisation</div><h2>Teste dein Wissen</h2><p>Punkt ${x.index+1} von ${x.total}</p></div><div class="game-hearts" aria-label="${x.hearts} von 3 Herzen">${'❤️'.repeat(x.hearts)}${'♡'.repeat(3-x.hearts)}</div></div>
 <div class="music-layout"><div class="music-question"><h3>Welcher Ton ist das?</h3>${staffSvg(x.note)}<p class="muted">Wähle die Silbe und die passende Farbe.</p></div>
 <div class="music-answer"><h3>1. Silbe auswählen</h3><div class="syllable-grid">${['Do','Re','Mi','Fa','So','La','Ti'].map(v=>`<button class="syllable-choice ${x.chosenSyllable===v?'is-selected':''}" data-syllable="${v}" ${x.answered?'disabled':''}>${v}</button>`).join('')}</div><h3>2. Farbe auswählen</h3><div class="color-choice-grid">${x.options.map(([name,hex])=>`<button class="color-choice ${x.chosenColor===name?'is-selected':''}" data-color="${name}" style="--choice-color:${hex}" aria-label="${name}" title="${name}" ${x.answered?'disabled':''}><span></span></button>`).join('')}</div>
 ${!x.answered?`<button class="primary music-check" id="checkSol" ${x.chosenSyllable&&x.chosenColor?'':'disabled'}>Prüfen</button>`:solFeedback(x)}</div></div>
 <p class="music-warning">Spielbare Neuumsetzung: Noten c'–c'' im Violinschlüssel; 3 Herzen, ein Versuch pro Ton und zufällige Farbanordnung.</p></section>`;
 $('#musicBack').onclick=musicBack;
 $$('[data-syllable]',root).forEach(b=>b.onclick=()=>{x.chosenSyllable=b.dataset.syllable;renderSolGame()});
 $$('[data-color]',root).forEach(b=>b.onclick=()=>{x.chosenColor=b.dataset.color;renderSolGame()});
 const check=$('#checkSol');if(check)check.onclick=()=>{x.correct=x.chosenSyllable===SOL_SYLLABLES[x.note]&&x.chosenColor===SOL_COLOR_NAMES[x.note];x.answered=true;if(x.correct){x.score++;x.hearts=Math.min(3,x.hearts+1)}else x.hearts=Math.max(0,x.hearts-1);renderSolGame()};
 const next=$('#nextSol');if(next)next.onclick=()=>{x.index++;if(x.hearts===0||x.index>=x.total)x.done=true;else newSolRound();renderSolGame()};
}
function rhythmSvg(type){
 const base='<g stroke="#594b3c" stroke-width="2"><line x1="15" x2="215" y1="30" y2="30"/><line x1="15" x2="215" y1="48" y2="48"/><line x1="15" x2="215" y1="66" y2="66"/><line x1="15" x2="215" y1="84" y2="84"/><line x1="15" x2="215" y1="102" y2="102"/></g>';
 const head=(x,filled)=>`<ellipse cx="${x}" cy="66" rx="13" ry="9" transform="rotate(-18 ${x} 66)" stroke="#292d2b" stroke-width="2.5" fill="${filled?'#292d2b':'#fff9e9'}"/>`;
 let fig='';
 if(type==='whole')fig='<ellipse cx="111" cy="66" rx="15" ry="9" stroke="#292d2b" stroke-width="3" fill="#fff9e9"/>';
 if(type==='half'||type==='dotted')fig=head(111,false)+'<line x1="122" x2="122" y1="66" y2="12" stroke="#292d2b" stroke-width="3"/>'+(type==='dotted'?'<circle cx="145" cy="66" r="3.5" fill="#292d2b"/>':'');
 if(type==='quarter')fig=head(111,true)+'<line x1="122" x2="122" y1="66" y2="12" stroke="#292d2b" stroke-width="3"/>';
 if(type==='rest')fig='<text x="95" y="90" font-family="serif" font-size="79" fill="#292d2b">𝄽</text>';
 if(type==='eighth')fig=head(82,true)+head(142,true)+'<line x1="93" y1="66" x2="93" y2="14" stroke="#292d2b" stroke-width="3"/><line x1="153" y1="66" x2="153" y2="14" stroke="#292d2b" stroke-width="3"/><path d="M93 14 H153 V24 H93 Z" fill="#292d2b"/>';
 return `<svg viewBox="0 0 230 130" class="rhythm-svg" role="img" aria-label="Notenbild">${base}${fig}</svg>`;
}
function newRhythmRound(){
 if(!musicRound||musicRound.mode!=='rhythm')musicRound={mode:'rhythm',index:0,total:10,score:0,done:false,answered:false};
 const r=musicRound;r.item=RHYTHMS[Math.floor(Math.random()*RHYTHMS.length)];r.question=['name','speech','symbol'][Math.floor(Math.random()*3)];r.answered=false;r.answer='';r.correct=false;
 // Fix answer positions for the entire question, including the solution view.
 // Only a new question receives a newly shuffled set of options.
 r.answerOptions=r.question==='symbol'||r.question==='name'?shuffle(RHYTHMS):[];
}
function renderRhythmGame(){
 const root=$('#destinationContent');const r=musicRound;
 if(r&&r.mode==='rhythm'&&r.done){root.innerHTML=`<section class="music-game"><button class="lagoon-return" id="musicBack">← Zur Musik</button><div class="game-finish"><h2>🥁 Fertig!</h2><p>${r.score} von ${r.total} Aufgaben richtig gelöst.</p><button class="primary" id="rhythmRestart">Noch einmal spielen</button></div></section>`;$('#musicBack').onclick=musicBack;$('#rhythmRestart').onclick=()=>{musicRound=null;renderRhythmGame()};return}
 if(!r||r.mode!=='rhythm')newRhythmRound();const x=musicRound;
 const isSymbol=x.question==='symbol';const isSpeech=x.question==='speech';
 const prompt=isSymbol?'Welches Notenbild passt?':isSpeech?'Wie lautet die Rhythmussprache?':'Wie heisst diese Note oder Pause?';
 const shown=isSymbol?`<div class="rhythm-known"><strong>${x.item.name}</strong><small>${x.item.speech}</small></div>`:isSpeech?rhythmSvg(x.item.symbol):rhythmSvg(x.item.symbol);
 const choices=isSymbol?x.answerOptions.map(z=>`<button class="rhythm-option rhythm-note-option" data-answer="${z.id}" ${x.answered?'disabled':''}>${rhythmSvg(z.symbol)}</button>`).join(''):
 isSpeech?`<label class="rhythm-input-label">Deine Antwort <input id="rhythmInput" type="text" value="${escapeHtml(x.answer)}" placeholder="z. B. Ta-a" autocomplete="off" ${x.answered?'disabled':''}></label><p class="muted">Für den Bindestrich (-) brauchst du die Taste neben der rechten Umschalttaste je nach Tastaturbelegung.</p>`:
 x.answerOptions.map(z=>`<button class="rhythm-option" data-answer="${z.id}" ${x.answered?'disabled':''}>${z.name}</button>`).join('');
 root.innerHTML=`<section class="music-game"><button class="lagoon-return" id="musicBack">← Zur Musik</button><div class="game-top"><div><div class="eyebrow">Musik · Rhythmus</div><h2>Teste dein Wissen</h2><p>Punkt ${x.index+1} von ${x.total}</p></div><strong>⭐ ${x.score} richtig</strong></div><div class="rhythm-prompt"><h3>${prompt}</h3>${shown}</div><div class="rhythm-options ${isSymbol?'with-notes':''}">${choices}</div>
 ${isSpeech&&!x.answered?'<button class="primary music-check" id="checkRhythm">Prüfen</button>':''}
 ${x.answered?`<div class="music-feedback ${x.correct?'is-correct':'is-wrong'}"><strong>${x.correct?'Richtig! 🌟':'Versuch es beim nächsten Mal wieder!'}</strong><p>Die Lösung ist: <strong>${x.item.name} · ${x.item.speech}</strong></p><div class="rhythm-solution">${rhythmSvg(x.item.symbol)}</div><button class="primary" id="nextRhythm">${x.index+1===x.total?'Ergebnis ansehen':'Nächste Aufgabe →'}</button></div>`:''}</section>`;
 $('#musicBack').onclick=musicBack;
 $$('[data-answer]',root).forEach(b=>b.onclick=()=>{x.answer=b.dataset.answer;x.correct=x.answer===x.item.id;x.answered=true;if(x.correct)x.score++;renderRhythmGame()});
 const input=$('#rhythmInput');if(input)input.oninput=()=>{x.answer=input.value};
 const check=$('#checkRhythm');if(check)check.onclick=()=>{x.correct=x.answer.trim().toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,'')===x.item.speech.toLowerCase().replace(/\s+/g,'');x.answered=true;if(x.correct)x.score++;renderRhythmGame()};
 const next=$('#nextRhythm');if(next)next.onclick=()=>{x.index++;if(x.index===x.total)x.done=true;else newRhythmRound();renderRhythmGame()};
}
// Version 1.3 – Matematik: new standalone learning games for 3rd grade.
// Each task owns its ordered options. Re-rendering feedback never reshuffles them.
let activeMathGame=null;
let mathRound=null;
function mathStart(kind){activeMathGame=kind;mathRound=createMathRound(kind);renderMathSection()}
function mathBack(){activeMathGame=null;mathRound=null;renderMathSection()}
function mathCloseToLagoon(){activeLagoonSubject=null;activeMathGame=null;mathRound=null;renderLagoon()}
function createMathOptions(correct, distractors){
  const options=[correct,...distractors.filter(v=>v!==correct)];
  const unique=[...new Set(options)];
  return shuffle(unique).map(value=>({value,label:String(value)}));
}
function createMathRound(kind){
  let questions=[];
  if(kind==='times'){
    // Exactly six tasks for each multiplication table. No repeated factor within a table.
    questions=shuffle([3,6].flatMap(table=>shuffle(Array.from({length:10},(_,i)=>i+1)).slice(0,6).map(factor=>{
      const answer=table*factor;
      const pool=new Set([answer+table,answer-table,answer+(table===3?6:3),answer-(table===3?6:3),factor*(table===3?6:3)]);
      const distractors=[...pool].filter(v=>v>=0&&v!==answer);
      for(let n=0;distractors.length<3&&n<15;n++){const v=answer+n+1;if(v!==answer&&!distractors.includes(v))distractors.push(v)}
      return {question:`${table} × ${factor} = ?`,answer,explain:`${table} × ${factor} = ${answer}`,options:createMathOptions(answer,shuffle(distractors).slice(0,3)),table};
    })));
  }else{
    const numbers=new Set();
    while(numbers.size<10){const n=100+Math.floor(Math.random()*900);numbers.add(n)}
    questions=[...numbers].map((number,index)=>{
      const h=Math.floor(number/100),z=Math.floor(number/10)%10,e=number%10;
      const answer=number;
      const pool=[h*100+e*10+z,h*100+z*10+((e+1)%10),((h%9)+1)*100+z*10+e,h*100+((z+1)%10)*10+e,number+100,number-10].filter(n=>n>=100&&n<=999&&n!==answer);
      const distractors=[...new Set(pool)];
      for(let k=0;distractors.length<3&&k<25;k++){const v=100+((number+k*37+17)%900);if(v!==answer&&!distractors.includes(v))distractors.push(v)}
      return {question:`${h} Hunderter · ${z} Zehner · ${e} Einer`,answer,explain:`${h} H + ${z} Z + ${e} E = ${h*100} + ${z*10} + ${e} = ${number}`,options:createMathOptions(answer,shuffle(distractors).slice(0,3)),number};
    });
  }
  return {kind,questions,index:0,total:questions.length,score:0,answered:false,chosen:null};
}
function renderMathSection(){
  if(activeMathGame){renderMathGame();return}
  const root=$('#destinationContent');
  root.innerHTML=`<section class="lagoon-subject math-home">
    <button class="lagoon-return" id="backToLagoon">← Zur Lern-Lagune</button>
    <div class="subject-header"><span class="subject-symbol" aria-hidden="true">🔢</span><div><div class="eyebrow">Lern-Lagune · Mathematik</div><h2>Zahlen entdecken</h2><p>Wähle ein Spiel. Du kannst auch als Gast mitmachen!</p></div></div>
    <div class="math-cards">
      <button class="math-card" id="mathTimes"><span class="math-card-icon">✖️</span><strong>3er- und 6er-Reihe</strong><small>12 Malaufgaben · 6 aus jeder Reihe</small><span class="play-label">Spielen →</span></button>
      <button class="math-card" id="mathNumbers"><span class="math-card-icon">🧮</span><strong>Zahlen bauen</strong><small>10 Aufgaben · Hunderter, Zehner, Einer</small><span class="play-label">Spielen →</span></button>
    </div><p class="music-warning">Neue Mathematikübungen für die LernSafari. Die Ergebnisse werden in dieser Demo nicht gespeichert.</p>
  </section>`;
  $('#backToLagoon').onclick=mathCloseToLagoon;
  $('#mathTimes').onclick=()=>mathStart('times');
  $('#mathNumbers').onclick=()=>mathStart('numbers');
}
function renderMathGame(){
  const root=$('#destinationContent'),r=mathRound;
  if(!r)return mathBack();
  const title=r.kind==='times'?'3er- und 6er-Reihe':'Zahlen bauen';
  if(r.index>=r.total){
    root.innerHTML=`<section class="music-game math-game"><button class="lagoon-return" id="mathBack">← Zu Mathematik</button><div class="game-finish"><h2>🌟 Geschafft!</h2><p>Du hast <strong>${r.score} von ${r.total}</strong> Aufgaben richtig gelöst.</p><p>${r.score===r.total?'Toll gerechnet!':'Schau dir die Lösungen an und probiere es noch einmal.'}</p><button id="mathRestart" class="primary">Noch einmal spielen</button></div></section>`;
    $('#mathBack').onclick=mathBack;$('#mathRestart').onclick=()=>mathStart(r.kind);return;
  }
  const q=r.questions[r.index],correct=r.chosen===q.answer;
  const main=r.kind==='times'?`<div class="math-expression">${escapeHtml(q.question)}</div>`:`<p class="math-micro-label">Welche Zahl ist das?</p><div class="math-place-values"><span>${Math.floor(q.number/100)}<small>Hunderter</small></span><span>${Math.floor(q.number/10)%10}<small>Zehner</small></span><span>${q.number%10}<small>Einer</small></span></div>`;
  root.innerHTML=`<section class="music-game math-game"><button class="lagoon-return" id="mathBack">← Zu Mathematik</button>
    <div class="game-top"><div><div class="eyebrow">Mathematik · ${title}</div><h2>${title}</h2><p>Aufgabe ${r.index+1} von ${r.total}</p></div><strong>⭐ ${r.score} richtig</strong></div>
    <div class="german-progress"><span style="width:${r.index/r.total*100}%"></span></div>
    <div class="math-question">${main}</div>
    <div class="math-options" role="group" aria-label="Antwort auswählen">${q.options.map(o=>`<button class="math-option ${r.answered&&o.value===q.answer?'is-right':''} ${r.answered&&r.chosen===o.value&&!correct?'is-wrong':''}" data-math-answer="${o.value}" ${r.answered?'disabled':''}>${o.label}</button>`).join('')}</div>
    ${r.answered?`<div class="german-feedback ${correct?'is-correct':'is-wrong'}" role="status"><strong>${correct?'Richtig! 🌟':'Fast! Schau dir die Lösung an.'}</strong><p>${escapeHtml(q.explain)}</p><button class="primary" id="mathNext">${r.index+1===r.total?'Ergebnis ansehen':'Nächste Aufgabe →'}</button></div>`:''}
  </section>`;
  $('#mathBack').onclick=mathBack;
  $$('[data-math-answer]',root).forEach(b=>b.onclick=()=>{if(r.answered)return;r.chosen=Number(b.dataset.mathAnswer);r.answered=true;if(r.chosen===q.answer)r.score++;renderMathGame()});
  const next=$('#mathNext');if(next)next.onclick=()=>{r.index++;r.answered=false;r.chosen=null;renderMathGame()};
}

// Deutsch: independent new practice game, not a copy of historical card sets.
// Words remain lowercase as in the original school-card conventions.
const GERMAN_WORDS=[
 {word:'hund',type:'Nomen',detail:'der Hund · die Hunde',hint:'Ein Nomen hat einen Begleiter. Du kannst der Hund sagen.'},
 {word:'blume',type:'Nomen',detail:'die Blume · die Blumen',hint:'Ein Nomen hat einen Begleiter. Du kannst die Blume sagen.'},
 {word:'fenster',type:'Nomen',detail:'das Fenster · die Fenster',hint:'Ein Nomen hat einen Begleiter. Du kannst das Fenster sagen.'},
 {word:'vogel',type:'Nomen',detail:'der Vogel · die Vögel',hint:'Ein Nomen hat einen Begleiter. Du kannst der Vogel sagen.'},
 {word:'buch',type:'Nomen',detail:'das Buch · die Bücher',hint:'Ein Nomen hat einen Begleiter. Du kannst das Buch sagen.'},
 {word:'katze',type:'Nomen',detail:'die Katze · die Katzen',hint:'Ein Nomen hat einen Begleiter. Du kannst die Katze sagen.'},
 {word:'laufen',type:'Verb',detail:'ich laufe · du läufst · er/sie/es läuft',hint:'Ein Verb sagt oft, was jemand tut. Ich kann laufen.'},
 {word:'spielen',type:'Verb',detail:'ich spiele · du spielst · er/sie/es spielt',hint:'Ein Verb sagt oft, was jemand tut. Wir können spielen.'},
 {word:'schreiben',type:'Verb',detail:'ich schreibe · du schreibst · er/sie/es schreibt',hint:'Ein Verb sagt oft, was jemand tut. Ich kann schreiben.'},
 {word:'singen',type:'Verb',detail:'ich singe · du singst · er/sie/es singt',hint:'Ein Verb sagt oft, was jemand tut. Wir können singen.'},
 {word:'springen',type:'Verb',detail:'ich springe · du springst · er/sie/es springt',hint:'Ein Verb sagt oft, was jemand tut. Ich kann springen.'},
 {word:'lesen',type:'Verb',detail:'ich lese · du liest · er/sie/es liest',hint:'Ein Verb sagt oft, was jemand tut. Ich kann lesen.'},
 {word:'klein',type:'Adjektiv',detail:'klein · kleiner · am kleinsten',hint:'Ein Adjektiv beschreibt, wie etwas ist. Ein kleiner Vogel.'},
 {word:'weich',type:'Adjektiv',detail:'weich · weicher · am weichsten',hint:'Ein Adjektiv beschreibt, wie etwas ist. Ein weiches Kissen.'},
 {word:'kalt',type:'Adjektiv',detail:'kalt · kälter · am kältesten',hint:'Ein Adjektiv beschreibt, wie etwas ist. Das Wasser ist kalt.'},
 {word:'schnell',type:'Adjektiv',detail:'schnell · schneller · am schnellsten',hint:'Ein Adjektiv beschreibt, wie etwas ist. Ein schneller Vogel.'},
 {word:'laut',type:'Adjektiv',detail:'laut · lauter · am lautesten',hint:'Ein Adjektiv beschreibt, wie etwas ist. Eine laute Stimme.'},
 {word:'freundlich',type:'Adjektiv',detail:'freundlich · freundlicher · am freundlichsten',hint:'Ein Adjektiv beschreibt, wie etwas ist. Ein freundliches Kind.'}
];
const GERMAN_TYPES=['Nomen','Verb','Adjektiv'];
function createGermanRound(){
  // Four words of every category, mixed together: all three word classes occur equally often.
  const words=shuffle(GERMAN_TYPES.flatMap(type=>shuffle(GERMAN_WORDS.filter(item=>item.type===type)).slice(0,4)));
  germanRound={words,index:0,total:words.length,score:0,chosen:null,answered:false};
}
function renderGermanSection(){
  const root=$('#destinationContent');
  if(activeGermanGame==='wordclasses'){renderWordclassesGame();return}
  root.innerHTML=`<section class="lagoon-subject german-home">
    <button class="lagoon-return" id="backToLagoon">← Zur Lern-Lagune</button>
    <div class="subject-header"><span class="subject-symbol" aria-hidden="true">📖</span><div><div class="eyebrow">Lern-Lagune · Deutsch</div><h2>Wörter entdecken</h2><p>Übe Nomen, Verben und Adjektive. Du bekommst nach jeder Antwort eine Erklärung.</p></div></div>
    <div class="german-card-grid"><button type="button" class="german-start-card" id="startWordclasses"><span aria-hidden="true">🔎</span><strong>Wortarten-Safari</strong><small>12 Wörter · Nomen, Verben und Adjektive erkennen</small><span class="play-label">Spielen →</span></button></div>
    <p class="music-warning">Neue Übung für die 3. Klasse. Die früher erstellten Wortkarten-Serien sind hier noch nicht eingebunden. Lernstände werden in dieser Demo nicht gespeichert.</p>
  </section>`;
  $('#backToLagoon').onclick=()=>{activeLagoonSubject=null;activeGermanGame=null;germanRound=null;renderLagoon()};
  $('#startWordclasses').onclick=()=>{activeGermanGame='wordclasses';createGermanRound();renderGermanSection()};
}
function germanBack(){activeGermanGame=null;germanRound=null;renderGermanSection()}
function renderWordclassesGame(){
  const root=$('#destinationContent');
  if(!germanRound)createGermanRound();
  const r=germanRound;
  if(r.index>=r.total){
    root.innerHTML=`<section class="music-game german-game"><button class="lagoon-return" id="germanBack">← Zu Deutsch</button><div class="game-finish"><h2>🌟 Safari geschafft!</h2><p>Du hast <strong>${r.score} von ${r.total}</strong> Wörtern richtig zugeordnet.</p><p>${r.score===r.total?'Du kennst dich mit Wortarten schon sehr gut aus!':'Schau dir die Erklärungen an und probiere es noch einmal.'}</p><button class="primary" id="restartGerman">Noch einmal spielen</button></div></section>`;
    $('#germanBack').onclick=germanBack;
    $('#restartGerman').onclick=()=>{createGermanRound();renderWordclassesGame()};return;
  }
  const item=r.words[r.index];const correct=r.chosen===item.type;
  root.innerHTML=`<section class="music-game german-game"><button class="lagoon-return" id="germanBack">← Zu Deutsch</button>
    <div class="game-top"><div><div class="eyebrow">Deutsch · Wortarten</div><h2>Wortarten-Safari</h2><p>Aufgabe ${r.index+1} von ${r.total}</p></div><strong aria-label="Richtige Antworten">⭐ ${r.score} richtig</strong></div>
    <div class="german-progress" aria-label="${r.index} von ${r.total} Aufgaben erledigt"><span style="width:${r.index/r.total*100}%"></span></div>
    <div class="german-question"><p>Welche Wortart ist das?</p><div class="german-word">${escapeHtml(item.word)}</div><p class="muted">Alle Wörter stehen absichtlich klein geschrieben.</p></div>
    <div class="german-options" role="group" aria-label="Wortart auswählen">${GERMAN_TYPES.map(type=>`<button type="button" data-german-type="${type}" class="german-option ${r.answered&&item.type===type?'is-right':''} ${r.answered&&r.chosen===type&&!correct?'is-wrong':''}" ${r.answered?'disabled':''}>${type}</button>`).join('')}</div>
    ${r.answered?`<div class="german-feedback ${correct?'is-correct':'is-wrong'}" role="status"><strong>${correct?'Richtig! 🌟':'Noch nicht ganz.'}</strong><p>Das Wort <strong>${escapeHtml(item.word)}</strong> ist ein <strong>${item.type}</strong>.</p><p>${escapeHtml(item.hint)}</p><div class="german-example">${escapeHtml(item.detail)}</div><button class="primary" id="nextGerman">${r.index+1===r.total?'Ergebnis ansehen':'Nächstes Wort →'}</button></div>`:''}
  </section>`;
  $('#germanBack').onclick=germanBack;
  $$('[data-german-type]',root).forEach(btn=>btn.onclick=()=>{if(r.answered)return;r.chosen=btn.dataset.germanType;r.answered=true;if(r.chosen===item.type)r.score++;renderWordclassesGame()});
  const next=$('#nextGerman');if(next)next.onclick=()=>{r.index++;r.chosen=null;r.answered=false;renderWordclassesGame()};
}

// Version 1.4 — NMG: independently developed, age-appropriate quiz based on
// bird facts from the Schweizerische Vogelwarte. The question order and options
// are generated once per question, not regenerated when feedback is displayed.
const NMG_QUESTIONS=[
  {group:'Arten erkennen',q:'Welcher Rabenvogel hat ein schwarz-weisses Gefieder und einen langen Schwanz?',a:'Elster',wrong:['Tannenhäher','Kolkrabe','Alpendohle'],why:'Die Elster ist vor allem schwarz und weiss. Ihr langer Schwanz fällt besonders auf.'},
  {group:'Arten erkennen',q:'Welcher Rabenvogel hat auffällig blaue Federn an den Flügeln?',a:'Eichelhäher',wrong:['Rabenkrähe','Dohle','Kolkrabe'],why:'Der Eichelhäher hat blaue, schwarz gestreifte Federn an seinen Flügeln.'},
  {group:'Arten erkennen',q:'Welcher Rabenvogel ist besonders gross und hat einen kräftigen Schnabel?',a:'Kolkrabe',wrong:['Elster','Dohle','Eichelhäher'],why:'Der Kolkrabe ist ein sehr grosser Rabenvogel. Sein Schnabel ist kräftig.'},
  {group:'Arten erkennen',q:'Welcher Rabenvogel hat viele helle Tupfen im braunen Gefieder?',a:'Tannenhäher',wrong:['Elster','Rabenkrähe','Alpendohle'],why:'Den Tannenhäher erkennst du an seinem braunen Gefieder mit weissen Tupfen.'},
  {group:'Arten erkennen',q:'Welcher dieser Vögel gehört zu den Rabenvögeln?',a:'Alpendohle',wrong:['Rotkehlchen','Buntspecht','Blaumeise'],why:'Die Alpendohle ist ein Rabenvogel und lebt oft in den Bergen.'},
  {group:'Arten erkennen',q:'Welcher Rabenvogel ist meist ganz schwarz und auch in Dörfern zu sehen?',a:'Rabenkrähe',wrong:['Elster','Eichelhäher','Tannenhäher'],why:'Die Rabenkrähe hat ein schwarzes Gefieder und lebt auch in Siedlungen.'},
  {group:'Nahrung und Lebensraum',q:'Was frisst eine Rabenkrähe?',a:'Würmer, Früchte und vieles mehr',wrong:['Nur Gras','Nur Fische','Nur Blätter'],why:'Rabenkrähen sind Allesfresser. Sie finden unterschiedliche Nahrung.'},
  {group:'Nahrung und Lebensraum',q:'Wozu versteckt der Tannenhäher Nüsse?',a:'Als Vorrat für später',wrong:['Zum Spielen','Damit niemand Bäume sieht','Für den Nestbau'],why:'Der Tannenhäher versteckt viele Nüsse und sucht sie später wieder.'},
  {group:'Nahrung und Lebensraum',q:'Was kann passieren, wenn ein Eichelhäher eine versteckte Eichel nicht mehr findet?',a:'Ein neuer Baum kann wachsen',wrong:['Die Eichel wird zu einem Stein','Die Eichel fliegt weg','Die Eichel wird zu einer Feder'],why:'Aus einer vergessenen Eichel kann eine junge Eiche wachsen.'},
  {group:'Nahrung und Lebensraum',q:'Wo lebt der Tannenhäher besonders häufig?',a:'Im Nadelwald',wrong:['Auf dem offenen Meer','In der Wüste','Nur auf Hausdächern'],why:'Tannenhäher leben besonders gern in Nadelwäldern.'},
  {group:'Nahrung und Lebensraum',q:'Warum finden Rabenkrähen auch in Städten oft Nahrung?',a:'Weil sie sehr unterschiedliche Dinge fressen',wrong:['Weil dort immer Schnee liegt','Weil sie nur Blätter fressen','Weil sie kein Futter brauchen'],why:'Rabenkrähen passen sich gut an und nutzen viele Nahrungsquellen.'},
  {group:'Nahrung und Lebensraum',q:'Was hilft Vögeln besonders beim Leben und Brüten?',a:'Bäume, Büsche und passende Nahrung',wrong:['Nur Betonflächen','Viel herumliegender Plastik','Keine Pflanzen'],why:'Vögel brauchen geeignete Lebensräume, Schutz und Nahrung.'},
  {group:'Federn und Körper',q:'Welche Federn helfen einem Vogel besonders beim Steuern im Flug?',a:'Steuerfedern am Schwanz',wrong:['Daunen am Bauch','Federn am Kopf','Keine Federn'],why:'Mit den Steuerfedern am Schwanz kann der Vogel seine Flugrichtung beeinflussen.'},
  {group:'Federn und Körper',q:'Welche Federn sind besonders wichtig fürs Fliegen?',a:'Schwungfedern an den Flügeln',wrong:['Nur Daunen','Nur kleine Kopffedern','Keine Federn'],why:'Die langen Schwungfedern an den Flügeln helfen beim Fliegen.'},
  {group:'Federn und Körper',q:'Was ist eine wichtige Aufgabe der weichen Daunen?',a:'Den Vogel warm halten',wrong:['Nüsse knacken','Den Schnabel färben','Steine tragen'],why:'Daunen halten Luft fest. Diese Luftschicht schützt den Vogel vor Kälte.'},
  {group:'Federn und Körper',q:'Was machen Deckfedern?',a:'Sie bedecken und schützen den Körper',wrong:['Sie ersetzen den Schnabel','Sie sind immer am Fuss','Sie tragen das Nest'],why:'Deckfedern bedecken den Vogelkörper und schützen ihn.'},
  {group:'Federn und Körper',q:'Womit nimmt die Rabenkrähe Nahrung auf?',a:'Mit ihrem Schnabel',wrong:['Mit ihren Flügelspitzen','Mit ihrem Schwanz','Mit ihren Federn'],why:'Mit dem Schnabel kann die Rabenkrähe verschiedene Dinge aufpicken und greifen.'},
  {group:'Federn und Körper',q:'Warum plustern sich manche Vögel bei Kälte auf?',a:'Sie halten mehr wärmende Luft im Gefieder',wrong:['Damit die Flügel verschwinden','Damit die Federn nass werden','Damit sie nicht mehr hören'],why:'Zwischen den Federn bleibt Luft. Diese Luft hilft gegen die Kälte.'}
];
// v1.5: bird-identification photo mode; remote, individually attributed Wikimedia Commons images.
// No photograph is bundled. An internet connection is needed to display each image.
// v1.7 — a curated pool of distinct photographs for each bird species.
// One species per round; its image changes on subsequent rounds.
// All photo metadata remains linked to the Wikimedia Commons file page.
const CORVID_PHOTOS=[
 {name:'Saatkrähe',hint:'Bei erwachsenen Saatkrähen ist die Haut direkt am Schnabelansatz hell und unbefiedert.',files:['Corvus frugilegus.jpg','Rook-Corvus frugilegus.jpg','Corvus frugilegus 1.JPG']},
 {name:'Kolkrabe',hint:'Der Kolkrabe ist besonders gross. Sein Schnabel ist kräftig und sein Hals wirkt oft struppig.',files:['Corvus corax.jpg','Raven close-up (53015845626).jpg','Raven perched on a snag (51202203050).jpg']},
 {name:'Alpendohle',hint:'Die Alpendohle hat einen gelben Schnabel und rote Beine.',files:['Pyrrhocorax graculus.jpg','Alpendohle, Pyrrhocorax graculus 2.JPG','Alpendohle TFA.jpg']},
 {name:'Alpenkrähe',hint:'Die Alpenkrähe erkennst du an ihrem langen, gebogenen roten Schnabel.',files:['Red-billed Chough (Pyrrhocorax pyrrhocorax).jpg','Red-billed Chough (Pyrrhocorax pyrrhocorax) (53753148706).jpg','Red-billed chough (Pyrrhocorax pyrrhocorax).jpg']},
 {name:'Nebelkrähe',hint:'Die Nebelkrähe ist am Körper grau, Kopf, Flügel und Schwanz sind schwarz.',files:['Corvus cornix - Hooded crow.jpg','20140831-Nebelkrähe.jpg','Corvus cornix (6337839322).jpg']},
 {name:'Dohle',hint:'Die Dohle ist kleiner als die Rabenkrähe. Ihr Nacken ist grau, die Augen sind hell.',files:['Corvus.Monedula.jpg','Coloeus monedula - Western Jackdaw 01.jpg','Corvus monedula 02.jpg']},
 {name:'Tannenhäher',hint:'Der Tannenhäher hat braune Federn mit auffälligen hellen Tupfen.',files:['Nucifraga caryocatactes Davos 1.jpg','Nucifraga caryocatactes Davos 2.jpg','Casse-noix moucheté Tannenhäher.jpg']},
 {name:'Eichelhäher',hint:'Der Eichelhäher hat rosabraunes Gefieder und leuchtend blaue, schwarz gestreifte Flügelfedern.',files:['Garrulusglandarius.jpg','Garrulus glandarius 1 Luc Viatour.jpg','2007-11-21 Jaybird, Eichelhäher, Garrulus glandarius.JPG']},
 {name:'Elster',hint:'Die Elster hat schwarz-weisse Federn und einen besonders langen Schwanz.',files:['Common magpie (Pica pica).jpg','Magpie (pica pica) from Greece.jpg','Pica pica in flight cropped.jpg']},
 {name:'Rabenkrähe',hint:'Die Rabenkrähe ist schwarz, mit schwarzem Schnabel und ohne graue Körperpartien.',files:['Corvus-corone.jpg','Corvus corone, Carrion Crow, Rabenkrähe 02.jpg','Corvus corone on a tree.jpg']}
];
const lastCorvidPhotoByName=new Map();
let nmgPhotoRound=null;
function createNmgPhotoRound(){
  const questions=shuffle(CORVID_PHOTOS).map(b=>{
    const previous=lastCorvidPhotoByName.get(b.name);
    const alternatives=b.files.filter(file=>file!==previous);
    const file=shuffle(alternatives.length?alternatives:b.files)[0];
    lastCorvidPhotoByName.set(b.name,file);
    return {
      bird:{name:b.name,hint:b.hint,file,
        image:'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=960',
        source:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(file).replace(/%20/g,'_'),
        author:'Wikimedia Commons',license:'Urheber und Lizenz siehe Bildquelle'},
      options:shuffle([b.name,...shuffle(CORVID_PHOTOS.filter(other=>other.name!==b.name)).slice(0,3).map(other=>other.name)])
    };
  });
  nmgPhotoRound={questions,index:0,total:questions.length,score:0,chosen:null,answered:false};
}
function renderNmgPhotoGame(){
 const root=$('#destinationContent'),r=nmgPhotoRound;
 if(!r)return renderNmgSection();
 if(r.index>=r.total){
  root.innerHTML=`<section class="music-game nmg-game"><button class="lagoon-return" id="photoBack">← Zu NMG</button><div class="game-finish"><h2>🐦‍⬛ Alle Vögel entdeckt!</h2><p><strong>${r.score} von ${r.total}</strong> richtig erkannt.</p><p>Gut geforscht! Schau dir beim nächsten Versuch die Farben, den Schnabel und die Federn genau an.</p><button class="primary" id="photoReplay">Noch einmal spielen</button></div></section>`;
  $('#photoBack').onclick=()=>{nmgPhotoRound=null;renderNmgSection()};
  $('#photoReplay').onclick=()=>{createNmgPhotoRound();renderNmgPhotoGame()};return;
 }
 const q=r.questions[r.index],b=q.bird,correct=r.chosen===b.name;
 root.innerHTML=`<section class="music-game nmg-game nmg-photo-game"><button class="lagoon-return" id="photoBack">← Zu NMG</button>
  <div class="game-top"><div><div class="eyebrow">NMG · Bilder erkennen</div><h2>Welcher Vogel ist das?</h2><p>Bild ${r.index+1} von ${r.total}</p></div><strong>⭐ ${r.score} richtig</strong></div>
  <div class="german-progress"><span style="width:${r.index/r.total*100}%"></span></div>
  <div class="bird-photo-frame"><img class="bird-photo" alt="Foto eines Rabenvogels zum Bestimmen" src="${b.image}" referrerpolicy="no-referrer"><p class="bird-photo-fallback" hidden>Das Foto konnte nicht geladen werden. Verbinde dich mit dem Internet oder überspringe dieses Bild.</p></div>
  <div class="nmg-answers" role="group" aria-label="Vogelart auswählen">${q.options.map((o,i)=>`<button class="nmg-answer ${r.answered&&o===b.name?'is-right':''} ${r.answered&&r.chosen===o&&!correct?'is-wrong':''}" data-photo-answer="${i}" ${r.answered?'disabled':''}>${escapeHtml(o)}</button>`).join('')}</div>
  <div class="bird-photo-actions"><button class="secondary" id="photoSkip">Bild überspringen</button></div>
  ${r.answered?`<div class="german-feedback ${correct?'is-correct':'is-wrong'}" role="status"><strong>${correct?'Richtig! 🌟':'Guter Versuch!'}</strong><p>Das ist ein <strong>${escapeHtml(b.name)}</strong>.</p><p>${escapeHtml(b.hint)}</p><button class="primary" id="photoNext">${r.index+1===r.total?'Ergebnis ansehen':'Nächstes Bild →'}</button></div>`:''}
  <p class="photo-credit">Bild: ${escapeHtml(b.author)} · ${escapeHtml(b.license)} · <a href="${b.source}" target="_blank" rel="noopener noreferrer">Bildquelle und Lizenz</a></p>
  </section>`;
 $('#photoBack').onclick=()=>{nmgPhotoRound=null;renderNmgSection()};
 const photo=$('.bird-photo',root);photo.addEventListener('error',()=>{photo.hidden=true;$('.bird-photo-fallback',root).hidden=false;});
 $$('[data-photo-answer]',root).forEach(btn=>btn.onclick=()=>{if(r.answered)return;r.chosen=q.options[Number(btn.dataset.photoAnswer)];r.answered=true;if(r.chosen===b.name)r.score++;renderNmgPhotoGame()});
 $('#photoSkip').onclick=()=>{r.index++;r.chosen=null;r.answered=false;renderNmgPhotoGame()};
 const next=$('#photoNext');if(next)next.onclick=()=>{r.index++;r.chosen=null;r.answered=false;renderNmgPhotoGame()};
}
let nmgRound=null;
function createNmgRound(){
  const groups=['Arten erkennen','Nahrung und Lebensraum','Federn und Körper'];
  const questions=shuffle(groups.flatMap(group=>shuffle(NMG_QUESTIONS.filter(q=>q.group===group)).slice(0,4)));
  nmgRound={index:0,total:questions.length,score:0,questions:questions.map(q=>({...q,options:shuffle([q.a,...q.wrong])})),chosen:null,answered:false};
}
function renderNmgSection(){
  const root=$('#destinationContent');
  if(nmgPhotoRound){renderNmgPhotoGame();return}
  if(nmgRound){renderNmgGame();return}
  root.innerHTML=`<section class="lagoon-subject nmg-home"><button type="button" class="lagoon-return" id="backToLagoon">← Zur Lern-Lagune</button>
    <div class="subject-header"><span class="subject-symbol" aria-hidden="true">🐦‍⬛</span><div><div class="eyebrow">Lern-Lagune · NMG</div><h2>Rabenvögel entdecken</h2><p>Was weisst du über Krähen, Elstern, Federn und ihre Lebensräume?</p></div></div>
    <div class="nmg-start-card"><div class="nmg-bird">📷</div><div><h3>Vögel erkennen</h3><p>Erkennst du unsere zehn Rabenvögel? In jeder neuen Runde erscheinen andere Fotos. Schau genau auf Schnabel, Farben und Federn.</p><button type="button" class="primary" id="startPhotoNmg">Bilderquiz starten →</button><p class="muted">Für die Fotos wird eine Internetverbindung benötigt. Die Bildquellen stehen beim Foto.</p></div></div>
    <div class="nmg-start-card"><div class="nmg-bird">🐦‍⬛</div><div><h3>Rabenvogel-Quiz</h3><p>12 Fragen: Arten erkennen, Nahrung und Lebensräume, Federn und Körper.</p><p class="muted">Du darfst Fehler machen. Nach jeder Antwort erhältst du eine Erklärung.</p><button type="button" class="primary" id="startNmg">Quiz starten →</button></div></div>
    <p class="music-warning">Neue LernSafari-Übungen: Das Wissensquiz funktioniert offline; die Fotos im Bilderquiz werden von Wikimedia Commons geladen. Ergebnisse werden nicht gespeichert.</p></section>`;
  $('#backToLagoon').onclick=()=>{activeLagoonSubject=null;renderLagoon()};
  $('#startNmg').onclick=()=>{createNmgRound();renderNmgGame()};
  $('#startPhotoNmg').onclick=()=>{createNmgPhotoRound();renderNmgPhotoGame()};
}
function renderNmgGame(){
  const root=$('#destinationContent'), r=nmgRound;
  if(!r)return renderNmgSection();
  if(r.index>=r.total){
    root.innerHTML=`<section class="music-game nmg-game"><button class="lagoon-return" id="nmgBack">← Zu NMG</button><div class="game-finish"><h2>🐦‍⬛ Forscherreise geschafft!</h2><p>Du hast <strong>${r.score} von ${r.total}</strong> Fragen richtig beantwortet.</p><p>${r.score===r.total?'Du kennst dich schon sehr gut aus!':'Toll, dass du geforscht hast. Jede Erklärung hilft dir beim Lernen!'}</p><button class="primary" id="nmgRestart">Noch einmal forschen</button></div></section>`;
    $('#nmgBack').onclick=()=>{nmgRound=null;renderNmgSection()};
    $('#nmgRestart').onclick=()=>{createNmgRound();renderNmgGame()};return;
  }
  const q=r.questions[r.index],correct=r.chosen===q.a;
  root.innerHTML=`<section class="music-game nmg-game"><button class="lagoon-return" id="nmgBack">← Zu NMG</button>
    <div class="game-top"><div><div class="eyebrow">NMG · ${escapeHtml(q.group)}</div><h2>Rabenvogel-Quiz</h2><p>Frage ${r.index+1} von ${r.total}</p></div><strong>⭐ ${r.score} richtig</strong></div>
    <div class="german-progress" aria-label="${r.index} von ${r.total} Fragen beendet"><span style="width:${r.index/r.total*100}%"></span></div>
    <div class="nmg-question"><span class="nmg-question-symbol" aria-hidden="true">${q.group==='Arten erkennen'?'🐦‍⬛':q.group==='Nahrung und Lebensraum'?'🌳':'🪶'}</span><h3>${escapeHtml(q.q)}</h3></div>
    <div class="nmg-answers" role="group" aria-label="Antwort auswählen">${q.options.map((o,i)=>`<button type="button" class="nmg-answer ${r.answered&&o===q.a?'is-right':''} ${r.answered&&r.chosen===o&&!correct?'is-wrong':''}" data-nmg-answer="${i}" ${r.answered?'disabled':''}>${escapeHtml(o)}</button>`).join('')}</div>
    ${r.answered?`<div role="status" class="german-feedback ${correct?'is-correct':'is-wrong'}"><strong>${correct?'Richtig! 🌟':'Guter Versuch!'}</strong><p>${escapeHtml(q.why)}</p><button class="primary" id="nmgNext">${r.index+1===r.total?'Ergebnis ansehen':'Nächste Frage →'}</button></div>`:''}
  </section>`;
  $('#nmgBack').onclick=()=>{nmgRound=null;renderNmgSection()};
  $$('[data-nmg-answer]',root).forEach(b=>b.onclick=()=>{if(r.answered)return;r.chosen=q.options[Number(b.dataset.nmgAnswer)];r.answered=true;if(r.chosen===q.a)r.score++;renderNmgGame()});
  const next=$('#nmgNext');if(next)next.onclick=()=>{r.index++;r.chosen=null;r.answered=false;renderNmgGame()};
}

// Version 1.8 — Tages-Tal. Standalone, day-seeded demo challenges (not teacher assignments).
// Today's tasks depend on Europe/Zurich calendar day; no real pupil records are stored.
const valleyTopics=[
 {id:'german',name:'Deutsch',symbol:'📖',color:'lilac'},
 {id:'math',name:'Mathematik',symbol:'🔢',color:'blue'},
 {id:'nmg',name:'NMG',symbol:'🐦',color:'green'},
 {id:'music',name:'Musik',symbol:'🎵',color:'yellow'},
 {id:'english',name:'Englisch',symbol:'📘',color:'pink'}
];
const valleyWordBank=[
 {word:'springen',kind:'Verb',hint:'Man kann sagen: ich springe, du springst.'},
 {word:'freundlich',kind:'Adjektiv',hint:'Man kann steigern: freundlich, freundlicher, am freundlichsten.'},
 {word:'die Feder',kind:'Nomen',hint:'Ein Nomen hat einen Begleiter: die Feder.'},
 {word:'glücklich',kind:'Adjektiv',hint:'Man kann sagen: glücklich, glücklicher, am glücklichsten.'},
 {word:'die Sonne',kind:'Nomen',hint:'Ein Nomen hat einen Begleiter: die Sonne.'},
 {word:'singen',kind:'Verb',hint:'Man kann sagen: ich singe, du singst.'}
];
const valleyBirdBank=[
 {question:'Welcher Vogel hat auffällig blaue Flügelfedern?',answer:'Eichelhäher',options:['Eichelhäher','Kolkrabe','Dohle'],hint:'Der Eichelhäher hat leuchtend blaue, schwarz gemusterte Flügelfedern.'},
 {question:'Wofür braucht ein Vogel seine Steuerfedern?',answer:'Zum Steuern beim Fliegen',options:['Zum Steuern beim Fliegen','Zum Kauen','Zum Graben'],hint:'Mit dem Schwanz und seinen Steuerfedern kann ein Vogel die Flugrichtung beeinflussen.'},
 {question:'Was hilft Rabenvögeln bei der Nahrungssuche?',answer:'Ein vielseitiger Schnabel',options:['Ein vielseitiger Schnabel','Ein Fell','Schwimmhäute bei allen Arten'],hint:'Rabenvögel können mit ihrem Schnabel sehr unterschiedliche Nahrung aufnehmen.'},
 {question:'Welche Federn halten besonders warm?',answer:'Daunenfedern',options:['Daunenfedern','Schwungfedern','Steuerfedern'],hint:'Daunen halten Luft fest und helfen so beim Wärmen.'}
];
const valleyEnglishBank=[
 ['Clap your hands!','Klatsch in die Hände!'],['nose','Nase'],['Bend your knees.','Beug die Knie.'],['shoulders','Schultern'],['touch','berühren'],['ear','Ohr'],['run','rennen'],['bone','Knochen']
];
let valleyActive=null;
let valleyData=null;
function valleyHash(text){let x=2166136261;for(const ch of text){x=Math.imul(x^ch.charCodeAt(0),16777619)}return x>>>0}
function valleyNumber(date){return 100+(valleyHash(date+'-zahl')%900)}
function valleyPick(items,key){return items[valleyHash(key)%items.length]}
function valleyShuffle(items,key){const a=[...items];let n=valleyHash(key)||1;for(let i=a.length-1;i>0;i--){n^=n<<13;n^=n>>>17;n^=n<<5;const j=(n>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function valleyToday(){return dateKey(new Date())}
function valleySession(){const day=valleyToday();if(!valleyData||valleyData.day!==day){valleyData={day,done:{},answers:{}};valleyActive=null}return valleyData}
function valleyQuestion(id){const day=valleyToday();const number=valleyNumber(day);const seed=day+'-'+id;
 if(id==='number'){const correct=`${Math.floor(number/100)} H · ${Math.floor(number/10)%10} Z · ${number%10} E`;
 return {title:'Zahl des Tages',question:`Wie ist die Zahl ${number} aufgebaut?`,answer:correct,options:[correct,`${(Math.floor(number/100)%9)+1} H · ${Math.floor(number/10)%10} Z · ${number%10} E`,`${Math.floor(number/100)} H · ${(Math.floor(number/10)%10+1)%10} Z · ${number%10} E`,`${Math.floor(number/100)} H · ${Math.floor(number/10)%10} Z · ${(number%10+1)%10} E`],hint:`${number} = ${Math.floor(number/100)*100} + ${(Math.floor(number/10)%10)*10} + ${number%10}.`};}
 if(id==='german'){const q=valleyPick(valleyWordBank,seed);return {title:'Deutsch',question:`Welche Wortart ist «${q.word}»?`,answer:q.kind,options:['Nomen','Verb','Adjektiv'],hint:q.hint}}
 if(id==='math'){const f=1+valleyHash(seed)%10;const n=valleyHash(seed+'-reihe')%2?6:3;const ans=f*n;return {title:'Mathematik',question:`Wie viel ist ${n} × ${f}?`,answer:String(ans),options:[String(ans),String(ans+n),String(Math.max(0,ans-n)),String(ans+2*n)],hint:`${n} × ${f} = ${ans}.`}}
 if(id==='nmg'){const q=valleyPick(valleyBirdBank,seed);return {title:'NMG',...q}}
 if(id==='music'){const names=['Do','Re','Mi','Fa','So','La','Ti'];const index=valleyHash(seed)%7;const answer=names[index];return {title:'Musik',question:`Welche Solmisationssilbe kommt direkt nach ${answer}?`,answer:names[(index+1)%7],options:[names[(index+1)%7],names[(index+2)%7],names[(index+6)%7]],hint:`Die Reihenfolge ist Do – Re – Mi – Fa – So – La – Ti – Do.`}}
 if(id==='english'){const [word,translation]=valleyPick(valleyEnglishBank,seed);const wrong=valleyShuffle(valleyEnglishBank.filter(x=>x[0]!==word).map(x=>x[1]),seed+'-wrong').slice(0,2);return {title:'Englisch',question:`Was bedeutet «${word}»?`,answer:translation,options:[translation,...wrong],hint:`${word} bedeutet «${translation}».`}}
 return null;
}
function renderValley(){
 const root=$('#destinationContent'),r=valleySession(),today=dt(new Date(),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 const all=['number',...valleyTopics.map(t=>t.id)],count=all.filter(id=>r.done[id]).length;
 if(valleyActive){renderValleyQuestion();return}
 const number=valleyNumber(r.day);
 root.innerHTML=`<section class="valley-page" aria-label="Tages-Tal – Aufgaben für heute">
 <div class="valley-banner"><div class="valley-banner-inner"><span class="valley-kicker">🌞 Tages-Tal</span><h2>Deine Abenteuer für heute</h2><p>${escapeHtml(today)}</p></div></div>
 <div class="valley-intro"><p>Jeden Tag warten neue kleine Aufgaben auf dich. Du kannst sie in beliebiger Reihenfolge lösen.</p><span class="valley-count">${count} von ${all.length} geschafft</span></div>
 <div class="valley-progress" role="progressbar" aria-label="Tagesfortschritt" aria-valuemin="0" aria-valuemax="${all.length}" aria-valuenow="${count}"><span style="width:${count/all.length*100}%"></span></div>
 <div class="valley-main">
 <button type="button" class="valley-number" data-valley-task="number"><span class="valley-card-heading">🔢 Zahl des Tages</span><strong>${number}</strong><span>${r.done.number?'✓ Geschafft!':'Hunderter · Zehner · Einer'}</span><span class="valley-card-cta">${r.done.number?'Noch einmal üben':'Aufgabe öffnen'} →</span></button>
 <div class="valley-other"><h3>Weitere Tagesaufgaben</h3><div class="valley-topic-list">${valleyTopics.map(t=>`<button type="button" class="valley-topic ${t.color} ${r.done[t.id]?'completed':''}" data-valley-task="${t.id}"><span class="valley-topic-icon">${t.symbol}</span><span class="valley-topic-title">${t.name}</span><span class="valley-topic-status">${r.done[t.id]?'✓ Geschafft':'Aufgabe öffnen →'}</span></button>`).join('')}</div></div>
 </div>${count===all.length?'<div class="valley-finish" role="status">🌟 Bravo! Du hast alle heutigen Aufgaben geschafft. Morgen wartet ein neues Abenteuer auf dich!</div>':''}
 <p class="valley-disclaimer">Demo: Die Aufgaben wechseln nach dem Schweizer Kalendertag. Die Ergebnisse bleiben nur während dieser geöffneten Webseite erhalten. Später kann die Lehrperson Tagesaufgaben über den Adminbereich festlegen.</p>
 </section>`;
 $$('[data-valley-task]',root).forEach(b=>b.addEventListener('click',()=>{valleyActive=b.dataset.valleyTask;renderValleyQuestion()}));
}
function renderValleyQuestion(){
 const r=valleySession(),id=valleyActive,q=valleyQuestion(id);if(!q){valleyActive=null;renderValley();return}
 const chosen=r.answers[id],answered=chosen!==undefined,correct=chosen===q.answer;
 const options=[...new Set(q.options)].length===q.options.length?q.options:[...new Set(q.options)];
 const ordered=valleyShuffle(options,r.day+'-'+id+'-options');
 const root=$('#destinationContent');root.innerHTML=`<section class="valley-quiz"><button type="button" class="lagoon-return" id="valleyReturn">← Zum Tages-Tal</button><div class="valley-quiz-header"><span>🌞 Heutige Herausforderung</span><h2>${escapeHtml(q.title)}</h2></div><p class="valley-question">${escapeHtml(q.question)}</p><div class="valley-answer-grid">${ordered.map(o=>`<button type="button" class="valley-choice ${answered&&o===q.answer?'right':''} ${answered&&o===chosen&&o!==q.answer?'wrong':''}" data-valley-choice="${escapeHtml(o)}" ${answered?'disabled':''}>${escapeHtml(o)}</button>`).join('')}</div>
 ${answered?`<div class="valley-feedback" role="status"><strong>${correct?'🌟 Richtig!':'🌱 Gut versucht!'}</strong><p>${escapeHtml(q.hint)}</p>${correct?'<p>Diese Aufgabe ist für heute geschafft.</p>':'<p>Du kannst die Aufgabe nochmals versuchen.</p>'}<div class="valley-result-buttons"><button class="primary" id="valleyContinue">Zur Tagesübersicht</button>${!correct?'<button class="secondary" id="valleyRetry">Nochmals versuchen</button>':''}</div></div>`:'<p class="muted">Wähle eine Antwort aus.</p>'}</section>`;
 $('#valleyReturn').onclick=()=>{valleyActive=null;renderValley()};
 $$('[data-valley-choice]',root).forEach(b=>b.onclick=()=>{if(r.answers[id]!==undefined)return;r.answers[id]=b.dataset.valleyChoice;if(r.answers[id]===q.answer)r.done[id]=true;renderValleyQuestion()});
 const cont=$('#valleyContinue');if(cont)cont.onclick=()=>{valleyActive=null;renderValley()};
 const retry=$('#valleyRetry');if(retry)retry.onclick=()=>{delete r.answers[id];renderValleyQuestion()};
}

// Baobab: shared class space. No child names/photos or classroom announcements are invented.
let baobabSection=null;
const baobabMenus=[
 ['animals','Unsere Klassentiere','🐾'],
 ['projects','Projekte & Erlebnisse','📷'],
 ['stories','Geschichten & Werken','📚'],
 ['motto','Hakuna Matata','🌅'],
 ['advent','Adventskalender','🎄'],
 ['extras','Spiele & Extras','⭐']
];
const baobabAnimals=[
 ['Löwe','Die Löwen leben in Gruppen, die man Rudel nennt.'],
 ['Erdmännchen','Erdmännchen halten gemeinsam Ausschau nach Gefahren.'],
 ['Warzenschwein','Warzenschweine können auf ihren Vorderknien fressen.'],
 ['Elefant','Elefanten benutzen ihren Rüssel zum Riechen, Trinken und Greifen.'],
 ['Giraffe','Mit ihrer langen Zunge kann die Giraffe Blätter von Zweigen holen.'],
 ['Zebra','Jedes Zebra hat ein eigenes Streifenmuster.'],
 ['Krokodil','Krokodile warten oft im Wasser auf ihre Beute.'],
 ['Chamäleon','Chamäleons können ihre Augen unabhängig voneinander bewegen.'],
 ['Nashorn','Nashörner haben eine dicke Haut und können trotzdem empfindlich sein.'],
 ['Leopard','Leoparden können hervorragend klettern.'],
 ['Strauss','Strausse können nicht fliegen, aber sehr schnell laufen.'],
 ['Hyäne','Tüpfelhyänen leben in grossen sozialen Gruppen.']
];
function renderBaobab(){
  const root=$('#destinationContent');
  if(!baobabSection){
    root.innerHTML=`<div class="baobab-intro">🌳 Entdecke unsere Klassenwelt! Klicke auf ein Holzschild.</div>
      <div class="baobab-map" aria-label="Baobab-Baum mit sechs Klassenbereichen">
        <img src="assets/baobab.jpg" alt="Grosser Baobab-Baum mit Löwe, Warzenschwein und Erdmännchen. Sechs Holzschilder führen zu den Klassenbereichen." draggable="false">
        ${baobabMenus.map(([id,label])=>`<button class="baobab-hotspot baobab-${id}" data-baobab-section="${id}" aria-label="${label} öffnen" title="${label}"><span class="sr-only">${label}</span></button>`).join('')}
      </div>
      <div class="baobab-mobile-links">${baobabMenus.map(([id,label,icon])=>`<button data-baobab-section="${id}">${icon} ${label}</button>`).join('')}</div>
      <p class="muted">Hier erscheinen später unsere eigenen Klasseninhalte. Die Tierinformationen sind Beispiele, keine Zuordnung zu einzelnen Kindern.</p>`;
  } else {
    const item=baobabMenus.find(x=>x[0]===baobabSection);
    root.innerHTML=`<div class="baobab-subview"><button class="secondary" id="baobabReturn">← Zum Baobab-Baum</button><h2>${item[2]} ${item[1]}</h2><div id="baobabInner"></div></div>`;
    const area=$('#baobabInner');
    if(baobabSection==='animals'){
      area.innerHTML=`<p>Welches Tier möchtest du kennenlernen? Unsere persönlichen Klassentier-Zuordnungen werden später ergänzt.</p><div class="baobab-animal-grid">${baobabAnimals.map(([n,desc])=>`<button class="baobab-animal" data-animal="${escapeHtml(n)}"><strong>${escapeHtml(n)}</strong><span class="muted">Mehr erfahren</span></button>`).join('')}</div><div class="baobab-fact" id="animalFact" aria-live="polite">Wähle ein Tier aus.</div>`;
      $$('[data-animal]',area).forEach(btn=>btn.onclick=()=>{let fact=baobabAnimals.find(a=>a[0]===btn.dataset.animal);$('#animalFact').innerHTML=`<strong>${escapeHtml(fact[0])}</strong><p>${escapeHtml(fact[1])}</p>`});
    } else if(baobabSection==='projects'){
      area.innerHTML=`<div class="baobab-info"><h3>Unsere gemeinsamen Abenteuer</h3><p>Hier kann die Lehrperson später Fotos und kurze Berichte zu Ausflügen, Aufführungen und Klassenprojekten veröffentlichen.</p><p class="muted">Noch keine echten Klassenbeiträge veröffentlicht. Es werden keine Kinderfotos ohne passende Freigabe angezeigt.</p></div>`;
    } else if(baobabSection==='stories'){
      area.innerHTML=`<div class="baobab-info"><h3>Unsere Geschichten-Bibliothek</h3><p>Hier können wir gemeinsam Geschichten lesen und unsere Werke entdecken.</p><p class="muted">Die ersten Klassengeschichten und Arbeiten werden später von der Lehrperson freigeschaltet.</p></div>`;
    } else if(baobabSection==='motto'){
      area.innerHTML=`<div class="baobab-info"><h3>Hakuna Matata – gemeinsam wachsen</h3><p>Im Baobab-Baum geht es um unsere Klasse und darum, wie wir freundlich miteinander lernen.</p><div class="baobab-values"><span>🪨 Schritt für Schritt</span><span>🦁 Mein Bestes genügt</span><span>🌿 Fehler sind erlaubt</span><span>🌟 Meine Stärken entdecken</span><span>🧘 Ruhe bewahren</span></div></div>`;
    } else if(baobabSection==='advent'){
      const current=new Date();const month=Number(dt(current,{month:'numeric'}));const day=Number(dt(current,{day:'numeric'}));const year=Number(dt(current,{year:'numeric'}));
      const isDecember=month===12;
      area.innerHTML=`<p>24 Türchen warten auf die Adventszeit! 🎁</p><div class="baobab-advent-grid">${Array.from({length:24},(_,i)=>{let n=i+1;let canOpen=isDecember && day>=n;return `<button data-advent="${n}" ${canOpen?'':'disabled'} aria-label="Türchen ${n}${canOpen?' öffnen':' ist noch geschlossen'}" class="${canOpen?'unlocked':'locked'}">${n}${canOpen?'':' 🔒'}</button>`}).join('')}</div><div class="baobab-fact" id="adventMessage">${isDecember?'Du kannst alle Türchen bis heute öffnen.':'Die Türchen öffnen sich vom 1. bis 24. Dezember.'}</div><p class="muted">Die Inhalte sind vorläufig freundliche Demo-Botschaften. Später kann die Lehrperson echte Überraschungen hinzufügen.</p>`;
      $$('[data-advent]',area).forEach(btn=>btn.onclick=()=>{const n=Number(btn.dataset.advent);if(month!==12||day<n)return;$('#adventMessage').textContent=['Du kannst mehr, als du denkst! 🌟','Gemeinsam geht vieles leichter. 💚','Eine gute Frage ist ein erster Schritt. 🔎','Heute darfst du stolz auf dich sein. 🦁'][((n-1)%4)]});
    } else if(baobabSection==='extras'){
      area.innerHTML=`<div class="baobab-info"><h3>Auch Spass gehört zur Safari!</h3><p>Schach, Sudoku, Malen und weitere freie Spiele werden in der Oase zu finden sein.</p><button class="primary" id="goOasisFromBaobab">Zur Oase</button></div>`;
      $('#goOasisFromBaobab').onclick=()=>travelTo('oasis');
    }
    $('#baobabReturn').onclick=()=>{baobabSection=null;renderBaobab()};
  }
  $$('[data-baobab-section]',root).forEach(b=>b.onclick=()=>{baobabSection=b.dataset.baobabSection;renderBaobab();$('#destinationScreen').scrollIntoView({block:'start',behavior:'instant'})});
}

function renderDestination(place){
  const screen=$('#destinationScreen');
  screen.classList.toggle('is-lagoon',place.id==='lagoon');
  screen.classList.toggle('is-valley',place.id==='valley');
  screen.classList.toggle('is-baobab',place.id==='baobab');
  screen.classList.toggle('is-oasis',place.id==='oasis');
  if(place.id==='lagoon'){
    activeLagoonSubject=null;
    renderLagoon();
    return;
  }
  if(place.id==='valley'){renderValley();return;}
  if(place.id==='baobab'){baobabSection=null;renderBaobab();return;}
  const contents={baobab:`<div class="topic-cards"><div class="topic-card"><span>🦁</span>Unsere Klassentiere</div><div class="topic-card"><span>📖</span>Geschichten</div><div class="topic-card"><span>🎄</span>Adventskalender</div></div>`,oasis:`<div class="topic-cards"><div class="topic-card"><span>♟️</span>Schach</div><div class="topic-card"><span>🔢</span>Sudoku</div><div class="topic-card"><span>🎨</span>Malen</div></div>`};
  $('#destinationContent').innerHTML=contents[place.id]||'';
}
$('#destinationBack').addEventListener('click',()=>{activeLagoonSubject=null;goCamp();showModal('map')});
// Agenda: the Monday–Sunday week is the default. Today's day is clearly marked.
// Real calendar entries will later be loaded from the secure administration backend.
let agendaWeekOffset=0;
let agendaSelectedDate=null;
const weekdayShort=['So','Mo','Di','Mi','Do','Fr','Sa'];
function dateKey(date){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);const m=Object.fromEntries(p.map(x=>[x.type,x.value]));return `${m.year}-${m.month}-${m.day}`}
function addDays(date,n){const copy=new Date(date.getTime());copy.setUTCDate(copy.getUTCDate()+n);return copy}
function mondayOf(date){const weekday=date.getUTCDay();return addDays(date,-((weekday+6)%7))}
function renderAgenda(){
  const today=startOfDay();
  const monday=addDays(mondayOf(today),7*agendaWeekOffset);
  const days=Array.from({length:7},(_,i)=>addDays(monday,i));
  const todayKey=dateKey(today);
  const selectedKey=agendaSelectedDate||((days.some(d=>dateKey(d)===todayKey))?todayKey:dateKey(monday));
  const selected=days.find(d=>dateKey(d)===selectedKey)||days[0];
  const title=`${dt(monday,{day:'numeric',month:'short'})} – ${dt(days[6],{day:'numeric',month:'short',year:'numeric'})}`;
  DOM.modalBody.innerHTML=`<div class="week-header"><button id="previousWeek" aria-label="Vorherige Woche">◀</button><div class="week-heading"><strong>${title}</strong><small>Montag bis Sonntag</small></div><button id="nextWeek" aria-label="Nächste Woche">▶</button></div><div class="week-actions"><button id="goToday" class="secondary">Heute</button><span class="muted">Wähle einen Tag aus.</span></div><div class="week-grid" role="group" aria-label="Wochentage">${days.map(day=>{const key=dateKey(day);const isToday=key===todayKey;const active=key===dateKey(selected);return `<button class="week-day ${isToday?'is-today':''} ${active?'is-selected':''}" data-date="${key}" aria-pressed="${active}" ${isToday?'aria-current="date"':''}><span class="week-weekday">${weekdayShort[day.getUTCDay()]}</span><span class="week-number">${dt(day,{day:'numeric'})}</span><span class="week-day-note">${isToday?'Heute':' '}</span></button>`}).join('')}</div><section class="selected-day"><h3>${dt(selected,{weekday:'long',day:'numeric',month:'long'})}${dateKey(selected)===todayKey?' · Heute':''}</h3><div class="agenda-entry"><strong>📌 Noch keine Einträge</strong><p>Hausaufgaben, Lernkontrollen und Termine werden hier angezeigt, sobald die Lehrperson sie erfasst hat.</p></div></section><p class="muted">In dieser Demo werden keine Schultermine erfunden. Später erscheinen sie an den jeweiligen Wochentagen.</p>`;
  $('#previousWeek').onclick=()=>{agendaWeekOffset--;agendaSelectedDate=null;renderAgenda()};
  $('#nextWeek').onclick=()=>{agendaWeekOffset++;agendaSelectedDate=null;renderAgenda()};
  $('#goToday').onclick=()=>{agendaWeekOffset=0;agendaSelectedDate=todayKey;renderAgenda()};
  $$('[data-date]',DOM.modalBody).forEach(button=>button.onclick=()=>{agendaSelectedDate=button.dataset.date;renderAgenda()});
}
function renderMail(){
  DOM.modalBody.innerHTML='<div class="today-card ls-mail-empty"><h3>📭 Dein Briefkasten ist leer</h3><p>Hier siehst du Briefe deiner Lehrperson, sobald du mit einem Tierkonto angemeldet bist und der Nachrichtendienst verbunden ist.</p></div>';
  const badge=document.getElementById('mailIndicator');if(badge)badge.hidden=true;
}
let clockTimer=null;function renderClock(){clearInterval(clockTimer);DOM.modalBody.innerHTML=`<div class="today-card"><div class="eyebrow">Zeit in der Schweiz</div><div class="today-time" id="liveTime">--:--</div><h3 id="todayDate">Heute</h3><p>Ein guter Tag für eine neue Entdeckung! 🌞</p></div><div class="tip">🧭 Für die vollständige Agenda klicke auf den Kompass im Camp.</div>`;const update=()=>{if(!$('#liveTime')){clearInterval(clockTimer);return}$('#liveTime').textContent=dt(now(),{hour:'2-digit',minute:'2-digit'});$('#todayDate').textContent=dt(now(),{weekday:'long',day:'numeric',month:'long',year:'numeric'})};update();clockTimer=setInterval(update,15000)}
function renderHelp(){DOM.modalBody.innerHTML=`<div class="notice">🦩 Hakuna Matata! Ich zeige dir unser Camp.</div><div class="agenda-list" style="margin-top:16px"><div class="agenda-entry"><strong>📖 Logbuch</strong><p>Deine Aufgaben und Erfolge, wenn du angemeldet bist.</p></div><div class="agenda-entry"><strong>🗺️ Karte</strong><p>Entdecke die Lern-Lagune, das Tages-Tal, den Baobab-Baum und die Oase.</p></div><div class="agenda-entry"><strong>🧭 Kompass</strong><p>Hier siehst du deine Woche von Montag bis Sonntag. Heute ist besonders markiert.</p></div><div class="agenda-entry"><strong>✉️ Briefkasten</strong><p>Hier bekommst du Post.</p></div><div class="agenda-entry"><strong>🕰️ Uhr</strong><p>Sie zeigt dir die Zeit und den heutigen Tag.</p></div></div>`}
window.addEventListener('popstate',()=>{cancelObjectAnimation();if(state.modal)closeModal(true,true);const id=location.hash.slice(1);if(places.some(p=>p.id===id)){const p=places.find(p=>p.id===id);state.destination=id;showScreen('destination');$('#destinationScreen').classList.toggle('is-lagoon',id==='lagoon');$('#destinationScreen').classList.toggle('is-valley',id==='valley');$('#destinationScreen').classList.toggle('is-baobab',id==='baobab');$('#destEmoji').textContent=p.emoji;$('#destTitle').textContent=p.title;$('#destText').textContent=p.description;renderDestination(p)}else if(state.screen!=='login')showScreen('camp')});
// The prototype intentionally starts at the login scene, even if an old URL fragment exists.
history.replaceState({screen:'login'},'','#start');
