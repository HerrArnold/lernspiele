/* LernSafari Oase: drei übersichtliche Erlebnisbereiche. */
'use strict';
(()=>{
  const originalRender=renderDestination;
  const groups=[
    {title:'Schach',icon:'♟️',hint:'Lerne die Figuren und Regeln oder spiele gegen den Computer.',games:[
      {title:'Schach-Lexikon',file:'schach-lexikon.html',description:'Schachfiguren und Regeln entdecken',emoji:'📖'},
      {title:'Schach gegen den Computer',file:'schach-computer.html',description:'Eine eigene Schachpartie spielen',emoji:'♟️'}]},
    {title:'Knobelaufgaben',icon:'🧩',hint:'Rätsel lösen, Muster finden und konzentriert denken.',games:[
      {title:'Sudoku',file:'oase-sudoku.html',description:'45 geprüfte Sudokus: einfach, mittel und schwer',emoji:'🔢'},
      {title:'Buchstabensalat',file:'oase-buchstabensalat.html',description:'Vier Wortsuchrätsel mit über 60 Begriffen',emoji:'🔤'},
      {title:'Zahlen-Detektiv',file:'oase-zahlenmuster.html',description:'24 Zahlenmuster und Logikaufgaben',emoji:'🕵️'}]},
    {title:'Kreativatelier',icon:'🎨',hint:'Malen, ausmalen und zeichnen – alles direkt am Computer.',games:[
      {title:'Mein Malatelier',file:'oase-zeichnen.html',description:'Freies Zeichnen mit Farben und Stiften',emoji:'🖌️'},
      {title:'Zeichenschule',file:'oase-abzeichnen.html',description:'Vier Vorlagen zum Nachzeichnen',emoji:'✏️'},
      {title:'Ausmalstudio',file:'oase-ausmalen.html',description:'Drei Ausmalbilder selbst gestalten',emoji:'🌈'}]}
  ];
  renderDestination=function(place){
    if(place?.id!=='oasis')return originalRender(place);
    const root=document.getElementById('destinationContent');
    root.innerHTML='<section class="integration-shell integration-area-oasis oase-home">'+
      '<div class="integration-trail"><span class="integration-pill is-current">Oase · Freiwillige Angebote</span></div>'+
      '<div class="oase-heading"><span aria-hidden="true">🏝️</span><div><span class="integration-kicker">LernSafari · Oase</span><h2>Spielen, knobeln & kreativ sein</h2><p>Suche dir ein Angebot aus. Du kannst jederzeit zurück in die Oase.</p></div></div>'+
      groups.map((group,g)=>'<section class="oase-section"><div class="oase-group-head"><span aria-hidden="true">'+group.icon+'</span><div><h3>'+group.title+'</h3><p>'+group.hint+'</p></div></div><div class="oase-game-grid">'+group.games.map((game,i)=>'<button type="button" class="oase-card" data-oase-section="'+g+'" data-oase-game="'+i+'"><span class="oase-card-icon">'+game.emoji+'</span><span><strong>'+game.title+'</strong><small>'+game.description+'</small></span><span class="oase-arrow">›</span></button>').join('')+'</div></section>').join('')+'</section>';
    root.querySelectorAll('[data-oase-game]').forEach(button=>button.onclick=()=>{
      const group=groups[Number(button.dataset.oaseSection)],game=group?.games[Number(button.dataset.oaseGame)];if(!game)return;
      safariGame=null;
      originalFrame('original/spiele/'+encodeURIComponent(game.file),game.title,{areaId:'oasis',contextLabel:group.title});
    });
  };
})();