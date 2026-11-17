/* LernSafari Lern-Lagune: Fach -> Thema -> Spiel.
   Namen und Zuordnung der Lehrperson, vorhandene Originalspiele unveraendert. */
'use strict';
(function(){
  const topicData={
    Mathe:[
      {name:'Einmaleins',icon:'✖️',games:[
        ['3er Reihe','einmaleins-dreier.html'],
        ['4er Reihe','einmaleins-vierer.html'],
        ['6er Reihe','einmaleins-sechser.html'],
        ['7er Reihe – zwei Rechenwege','einmaleins-siebener.html'],
        ['8er Reihe – drei Rechenwege','einmaleins-achter.html'],
        ['Mix (7er und 8er)','einmaleins-mix-sieben-acht.html'],
        ['9er Reihe','einmaleins-neuner.html'],
        ['Mix (3er, 4er, 6er, 9er)','einmaleins-mix-neue-reihen.html'],
        ['Teste dein Wissen (2er bis 10er)','einmaleins-test-alle.html']
      ]},
      {name:'Einmaleins – 2er, 5er und 10er',icon:'📚',archived:true,games:[
        ['2er Reihe','einmaleins-zweier.html'],
        ['5er Reihe','einmaleins-fuenfer.html'],
        ['10er Reihe','einmaleins-zehner.html'],
        ['Mix (2er, 5er, 10er)','einmaleins-mix.html']
      ]},
      {name:'Tausenderraum',icon:'🔢',games:[
        ['Im Tausenderbuch finden','finde-die-zahl.html'],
        ['In der Stellentafel eintragen','stellentafel.html'],
        ['In Hunderter, Zehner und Einer zerlegen','hunderter-zehner-einer-zerlegen.html'],
        ['Zahlenbild legen','wie-viele-brauchst-du.html'],
        ['Zahlenbild ablesen','welche-zahl-ist-das.html'],
        ['Teste dein Wissen',null]
      ]}
    ],
    Deutsch:[
      {name:'Briefe',icon:'✉️',games:[['Briefe entdecken','briefe-entdecken.html']]},
      {name:'Vom Hören zum Sprechen',icon:'💬',games:[['Gefühle und direkte Rede','gefuehle-direkte-rede.html']]},
      {name:'Hörverständnis',icon:'👂',games:[
        ['Der freche Affe','hoerverstehen-kurz-affe.html'],
        ['Der kleine Löwe','hoerverstehen-kurz-loewe.html'],
        ['Die verschwundene Brille','hoerverstehen-kurz-brille.html'],
        ['Das grosse Wettrennen','hoerverstehen-kurz-wettrennen.html'],
        ['Der heimliche Kuchen','hoerverstehen-kurz-kuchen.html'],
        ['Der Dachs','hoerverstehen-dachs.html'],['Das Eichhörnchen','hoerverstehen-eichhoernchen.html'],['Der Igel','hoerverstehen-igel.html'],['Das Reh','hoerverstehen-reh.html'],['Der Rotfuchs','hoerverstehen-rotfuchs.html']
      ]}
    ],
    NMG:[
      {name:'Rabenvögel',icon:'🐦‍⬛',games:[
        ['Rabenvögel erkennen','verschiedene-rabenvoegel.html'],
        ['Lebensraum der Vögel','lebensraum-voegel.html'],
        ['Arten von Federn','federtypen.html'],
        ['Teste dein Wissen','teste-dein-wissen-nmg.html']
      ]}
    ],
    Musik:[
      {name:'Solmisation und Rhythmus',icon:'🎼',archived:true,games:[
        ['Solmisationsleiter','solmisationsleiter.html'],
        ['Solmisationsspiel einfach','solmisationsspiel.html'],
        ['Solmisationsspiel schwer','solmisationsspiel-profi.html'],
        ['Rhythmus-Trio','rhythmus-trio.html'],
        ['Notenname - Notenbild - Rhythmussprache','rhythmus-trio-profi.html'],
        ['Teste dein Wissen','teste-dein-wissen-musik.html']
      ]},
      {name:'Say-Hi: "I bi da für di"',icon:'🎤',games:[
        ['SayHi: Singen','sayhi-singen.html'],['SayHi: Tanz','sayhi-tanz.html']
      ]}
    ],
    Englisch:[
      {name:'Unit 2 "My body"',icon:'<img class="safari-uk-flag" src="assets/uk-flag.svg" alt="" aria-hidden="true">',games:[
        ['Vocabulary: Wörter zuordnen','english:match'],
        ['Vocabulary: Karteikarten','english:cards']
      ]}
    ]
  };
  // Public read-only subject/topic catalog for teacher assignment selectors.
  window.LernSafariTopicCatalog=Object.freeze(topicData);
  let selectedTopic=null;
  const expandedArchives=new Set();
  const esc=s=>htmlSafe(String(s));
  const currentTopics=()=>topicData[safariSubject]||[];
  const currentTopic=()=>currentTopics().find(t=>t.name===selectedTopic);
  const root=()=>document.getElementById('destinationContent');
  const originalRenderLagoon=renderLagoon;

  function trail(mode,topic){
    const label=subjectLabel(safariSubject);
    const sections=[['LernSafari','camp'],['Lern-Lagune','lagoon'],[label,'subject']];
    if(mode!=='subjects')sections.push([topic.name,'topic']);
    if(mode==='game')sections.push(['Spiel','current']);
    return '<nav class="integration-trail" aria-label="Pfad">'+sections.map((item,i)=>
      (i?'<span class="integration-chevron" aria-hidden="true">›</span>':'')+
      (i===sections.length-1?'<span class="integration-pill is-current" aria-current="page">'+esc(item[0])+'</span>':
      '<button type="button" class="integration-pill integration-trail-link" data-topic-nav="'+item[1]+'">'+esc(item[0])+'</button>')
    ).join('')+'</nav>';
  }
  function header(text,description,icon){
    return '<div class="safari-topic-header"><span class="safari-topic-icon">'+icon+'</span><div><span class="integration-kicker">Lern-Lagune · '+esc(subjectLabel(safariSubject))+'</span><h2>'+esc(text)+'</h2><p>'+esc(description)+'</p></div></div>';
  }
  function subjectColorClass(){return 'safari-subject-'+({Mathe:'math',Deutsch:'german',NMG:'nmg',Musik:'music',Englisch:'english'}[safariSubject]||'neutral')}
  // Archiviert ist nur die Katalogansicht, nicht die Spiel-Datei oder der Lernfortschritt.
  // Später reicht archived:true bei einem abgeschlossenen Thema; archived:false macht es wieder aktuell.
  function renderSubjects(){
    const topics=currentTopics();
    selectedTopic=null;safariGame=null;
    const active=topics.map((t,i)=>({topic:t,index:i})).filter(x=>!x.topic.archived);
    const archive=topics.map((t,i)=>({topic:t,index:i})).filter(x=>x.topic.archived);
    const expanded=expandedArchives.has(safariSubject);
    const topicCard=({topic:t,index:i})=>{
      const count=t.games.filter(g=>g[1]).length;
      return '<button type="button" class="safari-topic-card" data-topic-index="'+i+'"><span class="safari-topic-card-icon">'+t.icon+'</span><strong>'+esc(t.name)+'</strong><small>'+count+' '+(count===1?'Spiel':'Spiele')+'</small><span class="safari-topic-arrow">›</span></button>';
    };
    root().innerHTML='<section class="integration-shell safari-topic-page '+subjectColorClass()+'">'+trail('subjects')+
      '<div class="integration-top"><button type="button" class="integration-back" data-topic-nav="lagoon">← Zur Lern-Lagune</button></div>'+
      header('Aktuelle Themen','Wähle dein aktuelles Lernthema.',SUBJECTS.find(s=>s[0]===safariSubject)?.[2]||'📖')+
      (active.length?'<div class="safari-topic-grid">'+active.map(topicCard).join('')+'</div>':'<p class="safari-archive-note">Gerade sind keine aktuellen Themen eingetragen.</p>')+
      (archive.length?'<section class="safari-archive-box"><button type="button" class="safari-archive-toggle" data-archive-toggle aria-expanded="'+expanded+'"><span class="safari-archive-symbol">📚</span><span><strong>Themen-Archiv</strong><small>'+archive.length+' '+(archive.length===1?'abgeschlossenes Thema':'abgeschlossene Themen')+' · alle Spiele bleiben zugänglich</small></span><span aria-hidden="true">'+(expanded?'▴':'▾')+'</span></button>'+
        (expanded?'<div class="safari-archive-inside"><p class="safari-archive-note">Zum Wiederholen kannst du jedes archivierte Thema öffnen und wie gewohnt spielen.</p><div class="safari-topic-grid">'+archive.map(topicCard).join('')+'</div></div>':'')+'</section>':'')+
      '</section>';
  }
  function renderGames(){
    const topic=currentTopic();
    if(!topic){selectedTopic=null;renderSubjects();return}
    safariGame=null;
    const cards=topic.games.map((g,i)=>{
      const available=!!g[1];
      const old=Object.values(ORIGINAL_GAMES).flat().find(x=>x.file===g[1]);
      return '<button type="button" class="safari-topic-game '+(available?'':'safari-topic-unavailable')+'" '+(available?'data-topic-game="'+i+'"':'disabled aria-disabled="true"')+'>'+
        (available?'':'<span class="safari-topic-game-icon">🛠️</span>')+
        '<span class="safari-topic-game-text"><strong>'+esc(g[0])+'</strong><small>'+esc(available?(old?.description||'Klicke auf den Pfeil, um die Aufgabe zu starten.'):'Bald verfügbar')+'</small></span>'+
        (available?'<span class="safari-topic-arrow">›</span>':'<span class="safari-topic-status">In Vorbereitung</span>')+
        '</button>';
    });
    const grouped=selectedTopic==='Hörverständnis' && safariSubject==='Deutsch';
    const list=grouped
      ? '<section class="safari-hearing-section is-easy"><h3 class="safari-hearing-title">🌿 Kurze Geschichten – leichter</h3><p class="safari-hearing-description">Fünf kurze Hörgeschichten zum Üben. Starte am besten hier.</p><div class="safari-topic-games">'+cards.slice(0,5).join('')+'</div></section>'+
        '<section class="safari-hearing-section is-hard"><h3 class="safari-hearing-title">🌲 Waldtiere – schwieriger</h3><p class="safari-hearing-description">Längere Hörtexte mit genaueren Fragen. Die freiwillige Schreibaufgabe gibt keine Pflichtpunkte.</p><div class="safari-topic-games">'+cards.slice(5).join('')+'</div></section>'
      : '<div class="safari-topic-games">'+cards.join('')+'</div>';
    root().innerHTML='<section class="integration-shell safari-topic-page '+subjectColorClass()+'">'+trail('topic',topic)+
      '<div class="integration-top"><button type="button" class="integration-back" data-topic-nav="subject">← Zu '+esc(subjectLabel(safariSubject))+'</button></div>'+
      header(topic.name,'Wähle ein Spiel aus.',topic.icon)+list+'</section>';
  }
  function launchGame(index){
    const topic=currentTopic(),entry=topic?.games[index];
    if(!entry||!entry[1])return;
    if(entry[1].startsWith('english:')){
      activeLagoonSubject='english';
      englishMode=null;
      renderEnglishSection();
      const button=document.getElementById(entry[1]==='english:match'?'englishStartMatch':'englishStartCards');
      button?.click();
      return;
    }
    if(entry[1].startsWith('hoerverstehen-')||entry[1].startsWith('einmaleins-')){
      safariGame={title:entry[0],file:entry[1],description:entry[1].startsWith('hoerverstehen-')?'Hörverständnis mit Audio':'Einmaleins: entdecken, üben und überprüfen'};
      safariGameOrigin=safariSubject;
      showSelectedGame();
      return;
    }
    const existing=Object.values(ORIGINAL_GAMES).flat().find(g=>g.file===entry[1]);
    if(!existing)return;
    safariGame=existing;safariGameOrigin=safariSubject;
    showSelectedGame();
  }
  function showSelectedGame(){
    const topic=currentTopic();
    if(!topic||!safariGame){renderGames();return}
    originalFrame('original/spiele/'+encodeURIComponent(safariGame.file),safariGame.title,{
      areaId:'lagoon',contextLabel:topic.name
    });
    const previous=root().querySelector('.integration-trail');
    if(previous)previous.outerHTML=trail('game',topic);
  }
  // Override only the lagoon part of the existing journey.
  renderLagoon=function(){
    if(!safariSubject){selectedTopic=null;return originalRenderLagoon()}
    if(safariGame){return showSelectedGame()}
    if(selectedTopic){return renderGames()}
    return renderSubjects();
  };
  /* After an English exercise, return to its topic's games instead of the old English menu. */
  englishBack=function(){
    englishMode=null;englishMatch=null;englishCards=null;
    safariGame=null;
    renderGames();
  };
  const oldBack=integrationBackConfig;
  integrationBackConfig=function(){
    if(state.destination==='lagoon'&&safariGame&&selectedTopic){
      return {label:'← Zurück zu '+selectedTopic,areaId:'lagoon',action:()=>{
        safariGame=null;renderGames();
      }};
    }
    return oldBack();
  };
  const oldRenderDestination=renderDestination;
  renderDestination=function(place){
    if(place?.id==='lagoon'){selectedTopic=null;safariSubject=null;safariGame=null}
    return oldRenderDestination(place);
  };
  root().addEventListener('click',event=>{
    const nav=event.target.closest('[data-topic-nav]');
    if(nav){
      event.preventDefault();event.stopImmediatePropagation();
      const target=nav.dataset.topicNav;
      if(target==='camp'){selectedTopic=null;safariSubject=null;safariGame=null;goCamp()}
      else if(target==='lagoon'){selectedTopic=null;safariSubject=null;safariGame=null;renderLagoon()}
      else if(target==='subject'){selectedTopic=null;safariGame=null;renderSubjects()}
      else if(target==='topic'){safariGame=null;renderGames()}
      return;
    }
    const archiveToggle=event.target.closest('[data-archive-toggle]');
    if(archiveToggle){
      if(expandedArchives.has(safariSubject))expandedArchives.delete(safariSubject);
      else expandedArchives.add(safariSubject);
      renderSubjects();return;
    }
    const topicButton=event.target.closest('[data-topic-index]');
    if(topicButton){selectedTopic=currentTopics()[Number(topicButton.dataset.topicIndex)]?.name||null;renderGames();return}
    const gameButton=event.target.closest('[data-topic-game]');
    if(gameButton){launchGame(Number(gameButton.dataset.topicGame))}
  },true);
  // Existing breadcrumb handlers in embedded games are handled by originalFrame.
  // Returning from an embedded game should show its selected topic rather than the whole subject.
  window.addEventListener('message',event=>{
    if(event.data?.source!=='LernSafariOriginal'||event.data.action!=='backToSubject')return;
    const frame=document.getElementById('originalGameFrame');
    if(!frame||event.source!==frame.contentWindow)return;
    if(state.destination==='lagoon'&&selectedTopic){
      event.stopImmediatePropagation();
      safariGame=null;renderGames();
    }
  },true);
})();