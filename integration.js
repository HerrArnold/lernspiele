/* LernSafari 2.0 - original learning content mounted without changes to game rules */
'use strict';
const ORIGINAL_GAMES = {"Deutsch": [{"title": "Gefühle und direkte Rede", "file": "gefuehle-direkte-rede.html", "preview": "preview-gefuehle.webp", "description": "Direkte Rede, Gesichter und Stimmen · 3 Teile"}, {"title": "Briefe entdecken", "file": "briefe-entdecken.html", "preview": "preview-briefe.webp", "description": "Briefarten, Briefaufbau und passende Sätze · 3 Teile"}], "NMG": [{"title": "Verschiedene Rabenvögel", "file": "verschiedene-rabenvoegel.html", "preview": "preview-rabenvoegel.webp", "description": "10 Rabenvögel auf Fotos erkennen und benennen"}, {"title": "Lebensraum der Vögel", "file": "lebensraum-voegel.html", "preview": "preview-lebensraum.webp", "description": "Was hilft und was schadet Vögeln? · 2 Teile"}, {"title": "Federtypen", "file": "federtypen.html", "preview": "preview-federn.webp", "description": "Federn erkennen und ihre Aufgaben verstehen"}, {"title": "Teste dein Wissen", "file": "teste-dein-wissen-nmg.html", "preview": "preview-wissen-nmg.webp", "description": "18 Aufgaben · 3 Teile · 18 Punkte"}], "Allgemein": [{"title": "Schach-Lexikon", "file": "schach-lexikon.html", "preview": "preview-schach-lexikon.svg", "description": "Figuren und wichtige Regeln einfach erklärt"}, {"title": "Schach gegen den Computer", "file": "schach-computer.html", "preview": "preview-schach-computer.svg", "description": "Spiele eine echte Partie gegen den Computer"}], "Musik": [{"title": "SayHi: Singen", "file": "sayhi-singen.html", "preview": "preview-sayhi-singen.svg", "description": "Musikvideo anschauen und mit Liedtext mitsingen"}, {"title": "SayHi: Tanz", "file": "sayhi-tanz.html", "preview": "preview-sayhi-tanz.svg", "description": "Die Tanzschritte mit Video üben"}, {"title": "Solmisationsleiter", "file": "solmisationsleiter.html", "preview": "preview-solmisationsleiter.webp", "description": "Silben ordnen und Farben finden"}, {"title": "Solmisationsspiel", "file": "solmisationsspiel.html", "preview": "preview-solmi.webp", "description": "Do liegt auf C"}, {"title": "Solmisationsspiel schwer", "file": "solmisationsspiel-profi.html", "preview": "preview-solmi-profi.webp", "description": "Do liegt auf verschiedenen Tönen"}, {"title": "Rhythmus-Trio", "file": "rhythmus-trio.html", "preview": "preview-rhythm-trio.webp", "description": "Drei passende Karten finden"}, {"title": "Notenname · Notenbild · Rhythmussprache", "file": "rhythmus-trio-profi.html", "preview": "preview-rhythm-profi.webp", "description": "Rhythmen schreiben und zeichnen"}, {"title": "Teste dein Wissen", "file": "teste-dein-wissen-musik.html", "preview": "preview-teste-wissen-musik.svg", "description": "24 Punkte · 12 Aufgaben"}], "Mathe": [{"title": "Einmaleins-Tafel erforschen", "file": "einmaleins-tafel-entdecken.html", "preview": "preview-einmaleins-tafel.svg", "description": "Zusammenhänge finden · Neue Reihen mit Merkaufgaben lösen"}, {"title": "Einmaleins-Mix", "file": "einmaleins-mix.html", "preview": "preview-einmaleins-mix.svg", "description": "2er-, 5er- und 10er-Reihe gemischt üben"}, {"title": "Die 3er-Reihe", "file": "einmaleins-dreier.html", "preview": "preview-einmaleins-dreier.svg", "description": "Mit der 2er-Reihe die 3er-Reihe entdecken"}, {"title": "Die 4er-Reihe", "file": "einmaleins-vierer.html", "preview": "preview-einmaleins-vierer.svg", "description": "Mit der 2er-Reihe die 4er-Reihe entdecken"}, {"title": "Die 6er-Reihe", "file": "einmaleins-sechser.html", "preview": "preview-einmaleins-sechser.svg", "description": "Mit der 5er-Reihe die 6er-Reihe entdecken"}, {"title": "Die 9er-Reihe", "file": "einmaleins-neuner.html", "preview": "preview-einmaleins-neuner.svg", "description": "Mit der 10er-Reihe die 9er-Reihe entdecken"}, {"title": "Einmaleins-Mix · 3, 4, 6 und 9", "file": "einmaleins-mix-neue-reihen.html", "preview": "preview-einmaleins-mix-neue-reihen.svg", "description": "3er-, 4er-, 6er- und 9er-Reihe gemischt üben"}, {"title": "Finde die Zahl", "file": "finde-die-zahl.html", "preview": "preview-finde-die-zahl.webp", "description": "Zahlen im Tausenderbuch suchen"}, {"title": "Stellentafel", "file": "stellentafel.html", "preview": "preview-stellentafel.webp", "description": "Hunderter, Zehner und Einer"}, {"title": "Hunderter, Zehner und Einer zerlegen", "file": "hunderter-zehner-einer-zerlegen.html", "preview": "preview-hunderter-zehner-einer-zerlegen.webp", "description": "Zahlen zerlegen"}, {"title": "Wie viele Hundertertafeln, Zehnerstangen und Einerwürfel?", "file": "wie-viele-brauchst-du.html", "preview": "preview-wie-viele-brauchst-du.webp", "description": "Mit Stellenwertmaterial arbeiten"}, {"title": "Welche Zahl ist das?", "file": "welche-zahl-ist-das.html", "preview": "preview-welche-zahl-ist-das.webp", "description": "Stellenwertmaterial erkennen"}, {"title": "Teste dein Wissen", "file": "teste-dein-wissen.html", "preview": "preview-teste-wissen-mathe.svg", "description": "Lernkontrolle · 15 Aufgaben"}]};
const SUBJECTS=[['Mathe','Mathe','<img class="safari-subject-badge" src="assets/math-badge.svg" alt="" aria-hidden="true">'],['Deutsch','Deutsch','<img class="safari-subject-badge" src="assets/german-flag.svg" alt="" aria-hidden="true">'],['NMG','NMG','<img class="safari-subject-badge" src="assets/nmg-leaf.svg" alt="" aria-hidden="true">'],['Musik','Musik','<img class="safari-subject-badge" src="assets/music-badge.svg" alt="" aria-hidden="true">'],['Englisch','Englisch','<img class="safari-subject-badge" src="assets/uk-flag.svg" alt="" aria-hidden="true">']];
let safariSubject=null;
let safariGame=null;
let safariGameOrigin='lagoon';
const originalLagoon=renderLagoon;
const originalDestination=renderDestination;
const originalBaobab=renderBaobab;
const originalValley=renderValley;
const htmlSafe=(s)=>escapeHtml(String(s));

function subjectLabel(id){return SUBJECTS.find(s=>s[0]===id)?.[1]||id}
function integrationAreaMeta(areaId){
  const meta={
    lagoon:{icon:'🌊',label:'Lern-Lagune',kicker:'Lern-Lagune',intro:'Hier findest du deine vertrauten Lernspiele – jetzt enger in die neue LernSafari eingebettet.',tip:'Die Spielregeln bleiben gleich. Neu sind vor allem klarere Karten, einheitlichere Abstände und ein stärkerer Safari-Rahmen.'},
    valley:{icon:'🌞',label:'Tages-Tal',kicker:'Tages-Tal',intro:'Hier warten die «Zahl des Tages» und die weiteren Aufgaben des Tages auf dich.',tip:'Die Aufgabenlogik bleibt unverändert. Das Tages-Tal wirkt nun stärker wie ein echter Teil der LernSafari.'},
    baobab:{icon:'🌳',label:'Baobab-Baum',kicker:'Baobab-Baum',intro:'Hier sammelst du Wissen, entdeckst Tiere und findest weitere Inhalte zum Klassenmotto.',tip:'Tierwelt und Advent bleiben in ihrer bewährten Logik erhalten und sind nun enger mit dem Baobab-Bereich verbunden.'},
    oasis:{icon:'🏝️',label:'Oase',kicker:'Oase',intro:'Ein ruhiger Ort für freiwillige Spiele, Schach und weitere Entdeckungen.',tip:'Auch hier bleibt der Inhalt erhalten – Buttons, Rahmen und Rückwege passen nun besser zur LernSafari.'}
  };
  return meta[areaId]||meta.lagoon;
}
function integrationBackConfig(){
  if(state.destination==='oasis')return {label:'← Zurück zur Oase',action:()=>renderDestination(places.find(p=>p.id==='oasis')),areaId:'oasis'};
  if(state.destination==='valley')return {label:'← Zur Karte',action:()=>{goCamp();showModal('map')},areaId:'valley'};
  if(state.destination==='baobab')return {label:'← Zurück zum Baobab-Baum',action:()=>renderBaobab(),areaId:'baobab'};
  if(safariGameOrigin && safariGameOrigin!=='lagoon')return {label:`← Zurück zu ${subjectLabel(safariGameOrigin)}`,action:()=>{safariGame=null;safariSubject=safariGameOrigin;renderLagoon()},areaId:'lagoon'};
  return {label:'← Zurück zur Lern-Lagune',action:()=>{safariGame=null;safariSubject=null;renderLagoon()},areaId:'lagoon'};
}
function integrationTrail(areaLabel,contextLabel,title){
  const parts=['LernSafari',areaLabel];
  if(contextLabel)parts.push(contextLabel);
  if(title)parts.push(title);
  return `<nav class="integration-trail" aria-label="Pfad">${parts.map((part,i)=>{
    const current=i===parts.length-1;
    const item=current
      ?`<span class="integration-pill is-current" aria-current="page">${htmlSafe(part)}</span>`
      :`<button type="button" class="integration-pill integration-trail-link" data-trail-index="${i}" aria-label="Zurück zu ${htmlSafe(part)}">${htmlSafe(part)}</button>`;
    return `${i?'<span class="integration-chevron" aria-hidden="true">›</span>':''}${item}`;
  }).join('')}</nav>`;
}
/* Breadcrumb navigation is delegated: every new view replaces destinationContent,
   so handlers attached to individual pills would be lost after each render. */
document.getElementById('destinationContent').addEventListener('click',event=>{
  const pill=event.target.closest('button[data-trail-index]');
  if(!pill||!event.currentTarget.contains(pill))return;
  const index=Number(pill.dataset.trailIndex);
  const labels=[...pill.closest('.integration-trail').querySelectorAll('.integration-pill')].map(el=>el.textContent.trim());
  if(index===0){
    safariGame=null;safariSubject=null;
    goCamp();
    return;
  }
  if(index===1){
    safariGame=null;safariSubject=null;
    const area=labels[1];
    if(area==='Lern-Lagune'){activeLagoonSubject=null;renderLagoon();}
    else if(area==='Baobab-Baum'){baobabSection=null;renderBaobab();}
    else if(area==='Tages-Tal'){renderValley();}
    else if(area==='Oase'){renderDestination(places.find(p=>p.id==='oasis'));}
    return;
  }
  if(index===2 && labels[1]==='Lern-Lagune'){
    safariGame=null;
    const subject=SUBJECTS.find(x=>x[1]===labels[2]||x[0]===labels[2]);
    if(subject){safariSubject=subject[0];renderLagoon();}
    else {safariSubject=null;renderLagoon();}
  }
});
function originalFrame(relative,title,opts={}){
 const root=document.getElementById('destinationContent');
 const back=integrationBackConfig(),areaId=opts.areaId||back.areaId||'lagoon',area=integrationAreaMeta(areaId),kind=opts.kind||'exercise';
 const context=opts.contextLabel||'';
 root.innerHTML=`<section class="original-integration integration-shell integration-area-${htmlSafe(areaId)}" aria-label="${htmlSafe(title)}">
 ${integrationTrail(area.label,context,title)}
 <div class="integration-play-heading"><div class="integration-play-title"><span class="integration-play-emoji" aria-hidden="true">${area.icon}</span><div><span class="integration-kicker">${htmlSafe(area.label)}${context?' · '+htmlSafe(context):''}</span><h2>${htmlSafe(title)}</h2></div></div><button type="button" class="integration-back" id="returnFromOriginal">${htmlSafe(back.label)}</button></div>
 <div class="integration-game-surface"><iframe class="original-frame ${kind==='daily'?'original-daily':''}" id="originalGameFrame" src="${htmlSafe(relative)}" title="${htmlSafe(title)}" loading="eager" referrerpolicy="same-origin" allow="fullscreen"></iframe></div>
 </section>`;
 document.getElementById('returnFromOriginal').onclick=back.action;
}
function renderOriginalSubject(subject){
  const root=document.getElementById('destinationContent');
  const label=subjectLabel(subject);
  const games=ORIGINAL_GAMES[subject]||[];
  root.innerHTML=`<section class="original-collection integration-shell integration-area-lagoon integration-subject-page">${integrationTrail('Lern-Lagune',label,'Spieleauswahl')}<div class="integration-top"><button type="button" class="integration-back" id="backOriginalSubject">← Zur Lern-Lagune</button><p class="integration-note">Wähle ein Spiel. Die ursprünglichen Aufgaben und Regeln bleiben erhalten.</p></div><div class="integration-hero"><div class="integration-icon" aria-hidden="true">${SUBJECTS.find(s=>s[0]===subject)?.[2]||'🎒'}</div><div class="integration-hero-text"><span class="integration-kicker">Lern-Lagune · ${htmlSafe(label)}</span><h2>${htmlSafe(label)} entdecken</h2><p>Wähle ein Spiel und leg los!</p></div><aside class="integration-side-note"><strong>Für Kinder klarer</strong> Weniger Brüche im Design, gleiche Inhalte, gleiche Bedienlogik.</aside></div><div class="integration-context-grid"><article class="integration-context-card"><strong>Vertraute Spiele</strong><p>Alle Spiele unten stammen aus dem bisherigen Bestand und wurden nicht neu erfunden.</p></article><article class="integration-context-card"><strong>Neuer Rahmen</strong><p>Karten, Abstände und Rückwege sind näher an der neuen Safari gestaltet.</p></article><article class="integration-context-card"><strong>Einfach wählen</strong><p>Klicke auf eine Karte und starte direkt im passenden Lernspiel.</p></article></div><div class="integration-game-grid">${games.map((game,i)=>`<button type="button" class="integration-game-card" data-original-game="${i}">${game.preview?`<img src="original/assets/${htmlSafe(game.preview)}" alt="" loading="lazy">`:'<span class="integration-game-fallback">✏️</span>'}<span class="integration-game-caption"><strong>${htmlSafe(game.title)}</strong><small>${htmlSafe(game.description)}</small></span><span class="integration-arrow">›</span></button>`).join('')}</div></section>`;
  document.getElementById('backOriginalSubject').onclick=()=>{safariSubject=null;renderLagoon()};
  root.querySelectorAll('[data-original-game]').forEach(btn=>btn.onclick=()=>{
    const game=games[Number(btn.dataset.originalGame)];safariGame=game;safariGameOrigin=subject;
    originalFrame('original/spiele/'+encodeURIComponent(game.file),game.title,{areaId:'lagoon',contextLabel:label,headline:game.title,intro:`${label}: ${game.description}. Das Spiel selbst bleibt erhalten, nur die Einbettung passt jetzt besser zur LernSafari.`,toolbarLead:`📘 ${label}`,toolbarNote:'Die Übung läuft direkt im Safari-Fenster. Aufgaben und Auswertung bleiben unverändert.',tip:'Wenn du fertig bist, gehst du mit dem Zurück-Knopf wieder sauber zurück in die Lern-Lagune.'})
  });
}
renderLagoon=function(){
  if(safariGame){originalFrame('original/spiele/'+encodeURIComponent(safariGame.file),safariGame.title,{areaId:'lagoon',contextLabel:subjectLabel(safariGameOrigin),headline:safariGame.title,intro:`${subjectLabel(safariGameOrigin)}: ${safariGame.description}. Die Oberfläche ist nun stärker Teil der LernSafari, die Spielregeln bleiben gleich.`,toolbarLead:`🌊 Lern-Lagune · ${subjectLabel(safariGameOrigin)}`,toolbarNote:'Die bisherige Übung wird hier direkt in die neue LernSafari eingebettet.',tip:'So fühlt sich das Spiel mehr wie ein echter Teil der Safari an, ohne dass seine Logik verändert wurde.'});return}
  if(safariSubject){
    if(safariSubject==='Englisch'){
      activeLagoonSubject='english';return originalLagoon()
    }
    return renderOriginalSubject(safariSubject)
  }
  activeLagoonSubject=null;
  const root=document.getElementById('destinationContent');
  root.innerHTML=`<section class="original-lagoon integration-shell integration-area-lagoon">${integrationTrail('Lern-Lagune','','Fächer')}<div class="integration-hero"><div class="integration-icon" aria-hidden="true">🌊</div><div class="integration-hero-text"><span class="integration-kicker">Die Lern-Lagune</span><h2>Wähle ein Fach!</h2><p>Wähle einen Felsen oder einen Fachknopf.</p></div><aside class="integration-side-note"><strong>Safari-Tipp</strong> Du kannst ein Fach entweder über die grossen Felsen oder über die Fachknöpfe unten öffnen.</aside></div><div class="integration-context-grid"><article class="integration-context-card"><strong>Mathematik</strong><p>Einmaleins, Stellenwert und «Zahl erkennen» warten in der Lagune.</p></article><article class="integration-context-card"><strong>Sprachen & Musik</strong><p>Deutsch, Englisch und Musik bleiben mit ihren bekannten Übungen erhalten.</p></article><article class="integration-context-card"><strong>NMG</strong><p>Auch die Rabenvögel und andere NMG-Inhalte sind direkt eingebettet erreichbar.</p></article></div><div class="integration-scene-card"><div class="integration-lagoon-scene"><img src="assets/lern-lagune.png" alt="Lagune mit fünf beschrifteten Felsen: Mathematik, Deutsch, NMG, Musik und Englisch." draggable="false">${[['Mathe','math'],['Deutsch','german'],['NMG','nmg'],['Musik','music'],['Englisch','english']].map(([s,cls])=>`<button type="button" data-original-subject="${s}" class="integration-stone integration-stone-${cls}" aria-label="${s==='Mathe'?'Mathematik':s} öffnen"></button>`).join('')}</div></div><div class="integration-subjects">${SUBJECTS.map(([id,label,icon])=>`<button type="button" data-original-subject="${id}">${icon} ${htmlSafe(label)}</button>`).join('')}</div></section>`;
  root.querySelectorAll('[data-original-subject]').forEach(btn=>btn.onclick=()=>{safariSubject=btn.dataset.originalSubject;renderLagoon()});
};
renderValley=function(){
  originalFrame('original/index.html#aufgaben','Aufgaben des Tages',{areaId:'valley',contextLabel:'Tagesaufgaben',headline:'Deine Aufgaben des Tages',intro:'Die «Zahl des Tages» und die weiteren Tagesaufgaben bleiben in ihrer bekannten Struktur erhalten. Neu ist vor allem der engere LernSafari-Rahmen rundherum.',kind:'daily',toolbarLead:'🌞 Tages-Tal · Heutige Aufgaben',toolbarNote:'Auch hier bleiben Tageswechsel, Aufgabenserien und Auswertung aus der bisherigen LernSafari bestehen.',tip:'Oben im eingebetteten Bereich bearbeitest du die Aufgaben wie bisher. Mit «Zurück» gelangst du wieder sauber ins Tages-Tal.'});
};
renderBaobab=function(){
 const root=document.getElementById('destinationContent');
 root.innerHTML=`<section class="integration-baobab-new" aria-label="Baobab-Baum und Klassenwelt">
   <div class="baobab-intro">🌳 Unser Baobab-Baum – entdecke unsere Klassentiere und Erlebnisse!</div>
   <div class="baobab-map baobab-new-map">
     <img src="assets/baobab-stickerwelt.webp" onload="if(this.currentSrc.includes('baobab-stickerwelt.webp')||this.currentSrc.includes('baobab.jpg'))this.parentNode.classList.add('baobab-has-character-art')" onerror="if(!this.dataset.fallback){this.dataset.fallback='original';this.src='assets/baobab.jpg'}else{this.onerror=null;this.src='assets/baobab-ohne-schilder.svg'}" alt="Ein grosser Baobab-Baum in einer zusammenhängenden Savanne. Im Vordergrund ein Löwe, ein Warzenschwein und genau ein Erdmännchen. Links sitzt ein Hornvogel." draggable="false">
     <img class="baobab-extra-flamingo" src="original/assets/tiersticker/flamingo.png" alt="" aria-hidden="true" draggable="false">
     <button class="baobab-hotspot baobab-animals" type="button" data-baobab-new="animals"><span>🐾 Unsere Klassentiere</span></button>
     <button class="baobab-hotspot baobab-advent" type="button" data-baobab-new="advent"><span>🎄 Adventskalender<small>🔒 Noch nicht verfügbar</small></span></button>
     <button class="baobab-hotspot baobab-projects" type="button" data-baobab-new="projects"><span>📸 Unsere Lieblingsprojekte</span></button>
   </div>
   <div class="baobab-mobile-links"><button type="button" data-baobab-new="animals">🐾 Unsere Klassentiere</button><button type="button" data-baobab-new="advent">🎄 Adventskalender 🔒</button><button type="button" data-baobab-new="projects">📸 Unsere Lieblingsprojekte</button></div>
   <p class="integration-note">Ein Klick auf ein Holzschild führt dich direkt zum passenden Bereich.</p>
 </section>`;
 root.querySelectorAll('[data-baobab-new]').forEach(button=>button.addEventListener('click',()=>{
   const id=button.dataset.baobabNew;
   if(id==='animals'){
     originalFrame('original/index.html#tiere','Unsere Klassentiere',{areaId:'baobab',contextLabel:'Tierwelt'});
   }else if(id==='advent'){
     const placeholder=document.createElement('section');placeholder.className='baobab-coming-soon';
     placeholder.innerHTML='<button type="button" class="integration-back" id="backFromAdvent">← Zum Baobab-Baum</button><div class="baobab-coming-icon">🎄</div><h2>Adventskalender</h2><p>🛠️ Noch nicht verfügbar</p><small>Hier entsteht später unser Adventskalender.</small>';
     root.replaceChildren(placeholder);
     placeholder.querySelector('#backFromAdvent').onclick=()=>renderBaobab();
   }else if(id==='projects'){
     root.innerHTML='<div class="baobab-gallery-page"><button type="button" class="integration-back" id="returnFromProjects">← Zum Baobab-Baum</button><div id="baobabGalleryContent"></div></div>';
     root.querySelector('#returnFromProjects').onclick=()=>renderBaobab();
     window.LernSafariProjects?.render(root.querySelector('#baobabGalleryContent'));
   }
 }));
};
renderDestination=function(place){
 if(place.id==='lagoon'){safariSubject=null;safariGame=null;return renderLagoon()}
 if(place.id==='valley')return renderValley();
 if(place.id==='baobab')return renderBaobab();
 if(place.id==='oasis'){
  const games=ORIGINAL_GAMES.Allgemein||[];
  const root=document.getElementById('destinationContent');
  root.innerHTML=`<section class="original-collection integration-shell integration-area-oasis integration-oasis-page">${integrationTrail('Oase','','Angebote')}<div class="integration-hero"><div class="integration-icon" aria-hidden="true">🏝️</div><div class="integration-hero-text"><span class="integration-kicker">Oase</span><h2>Spielen & entdecken</h2><p>Hier kannst du Schach spielen und Neues entdecken.</p></div><aside class="integration-side-note"><strong>Freiwillige Angebote</strong> Die Oase bleibt ein ruhiger Ort für Knobeleien, Schach und weitere freie Entdeckungen.</aside></div><div class="integration-context-grid"><article class="integration-context-card"><strong>Schach</strong><p>Lerne Figuren und Regeln oder spiele direkt gegen den Computer.</p></article><article class="integration-context-card"><strong>Freiwillig</strong><p>Diese Angebote ergänzen die LernSafari und sind bewusst spielerischer angelegt.</p></article><article class="integration-context-card"><strong>Gleich bedienbar</strong><p>Auch hier bleiben die Inhalte gleich, aber sie passen optisch besser zur Oase.</p></article></div><div class="integration-game-grid">${games.map((g,i)=>`<button type="button" class="integration-game-card" data-oasis-game="${i}">${g.preview?`<img src="original/assets/${htmlSafe(g.preview)}" alt="" loading="lazy">`:''}<span class="integration-game-caption"><strong>${htmlSafe(g.title)}</strong><small>${htmlSafe(g.description)}</small></span><span class="integration-arrow">›</span></button>`).join('')}</div></section>`;
  root.querySelectorAll('[data-oasis-game]').forEach(btn=>btn.onclick=()=>{safariGame=null;let g=games[Number(btn.dataset.oasisGame)];originalFrame('original/spiele/'+encodeURIComponent(g.file),g.title,{areaId:'oasis',contextLabel:'Freie Angebote',headline:g.title,intro:`${g.description}. Dieses Angebot stammt weiterhin aus der bisherigen LernSafari, sitzt jetzt aber enger im Oasen-Design der neuen Webseite.`,toolbarLead:'🏝️ Oase · Freie Angebote',toolbarNote:'Inhalt und Logik des Angebots bleiben unverändert.',tip:'Nach dem Spielen kommst du mit einem Klick wieder zurück in die Oase.'})});
  return;
 }
 return originalDestination(place);
};
// Original games navigate to the new LernSafari instead of their former home page.
window.addEventListener('message',event=>{
 if(event.data?.source!=='LernSafariOriginal')return;
 const frame=document.getElementById('originalGameFrame');
 if(!frame||event.source!==frame.contentWindow)return;
 if(event.data.action==='backToSubject'){
   if(state.destination==='oasis')renderDestination(places.find(p=>p.id==='oasis'));
   else if(state.destination==='valley'){goCamp();showModal('map')}
   else if(state.destination==='baobab')renderBaobab();
   else if(safariGameOrigin && safariGameOrigin!=='lagoon'){safariGame=null;safariSubject=safariGameOrigin;renderLagoon()}
   else {safariGame=null;safariSubject=null;renderLagoon()}
 }
 if(event.data.action==='openGame'){
   const file=String(event.data.file||'');
   if(!/^[a-z0-9-]+\.html$/.test(file))return;
   const found=Object.entries(ORIGINAL_GAMES).find(([,list])=>list.some(g=>g.file===file));
   const original=found?.[1]?.find(g=>g.file===file);
   if(!original)return;
   safariGameOrigin=found?.[0]||'lagoon';
   safariGame=original;originalFrame('original/spiele/'+encodeURIComponent(original.file),original.title,{areaId:state.destination==='oasis'?'oasis':'lagoon',contextLabel:state.destination==='oasis'?'Freie Angebote':subjectLabel(safariGameOrigin),headline:original.title,intro:`${original.description}. Das Spiel bleibt gleich, ist nun aber noch enger im LernSafari-Stil eingebettet.`,toolbarLead:state.destination==='oasis'?'🏝️ Oase · Freie Angebote':`🌊 Lern-Lagune · ${subjectLabel(safariGameOrigin)}`,toolbarNote:'Die bisherige Übung wird hier direkt in die neue LernSafari eingebettet.',tip:'Mit dem Zurück-Knopf gelangst du wieder an die passende Stelle der LernSafari.'})
 }
});
