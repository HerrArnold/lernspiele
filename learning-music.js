/* LernSafari – lokaler Lernmusik-Player, ohne Cloudflare-Synchronisierung. */
'use strict';
(() => {
  if (document.getElementById('ls-music-widget')) return;
  const tracks = [
    {title:'Klavier', url:'audio/klavier.mp3'},
    {title:'Klavier & Natur', url:'audio/natur.mp3'},
    {title:'Lo-Fi', url:'audio/lofi.mp3'}
  ];
  const root = document.createElement('aside');
  root.id = 'ls-music-widget';
  root.innerHTML = `
    <div class="ls-music-panel" id="ls-music-panel" hidden>
      <div class="ls-music-heading"><strong>♫ Musik zum Lernen</strong><button type="button" id="ls-music-close" aria-label="Musikauswahl schliessen">✕</button></div>
      <p class="ls-music-tip">Höre nur Musik, wenn sie dir beim Konzentrieren hilft. Wenn sie dich ablenkt, schalte sie wieder aus.</p>
      <div class="ls-music-tracks" id="ls-music-tracks"></div>
      <div class="ls-music-controls">
        <button type="button" id="ls-music-pause" aria-label="Musik pausieren" title="Musik pausieren" disabled>❚❚</button>
        <div id="ls-music-playing" aria-live="polite">Noch keine Musik ausgewählt</div>
        <label class="ls-music-volume">🔊 <input type="range" id="ls-music-volume" min="0" max="100" value="35" aria-label="Lautstärke"></label>
      </div>
      <div class="ls-music-error" id="ls-music-error" role="status"></div>
    </div>
    <button type="button" class="ls-music-fab" id="ls-music-toggle" aria-label="Musik zum Lernen öffnen" aria-expanded="false" aria-controls="ls-music-panel" title="Musik zum Lernen">♫</button>
  `;
  document.body.appendChild(root);
  const audio = new Audio();
  audio.preload = 'none';
  audio.loop = true;
  audio.volume = .35;
  const el = id => root.querySelector('#'+id);
  const panel = el('ls-music-panel'), toggle = el('ls-music-toggle'), pause = el('ls-music-pause');
  const label = el('ls-music-playing'), error = el('ls-music-error'), list = el('ls-music-tracks');
  let active = -1;
  function show(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Musikauswahl schliessen' : 'Musik zum Lernen öffnen');
  }
  function paint() {
    [...list.children].forEach((b,i) => {
      b.classList.toggle('is-selected',i===active);
      b.setAttribute('aria-pressed', String(i===active));
    });
    const playing = !audio.paused;
    pause.disabled=active<0;
    pause.textContent=playing?'❚❚':'▶';
    pause.title=playing?'Pausieren':'Weiter abspielen';
    pause.setAttribute('aria-label',pause.title);
    label.textContent=active<0?'Noch keine Musik ausgewählt':tracks[active].title+(playing?' · spielt':' · pausiert');
    toggle.classList.toggle('is-playing',playing);
  }
  tracks.forEach((track,i)=>{
    const b=document.createElement('button');
    b.type='button';b.className='ls-music-track';b.textContent=track.title;
    b.addEventListener('click',async()=>{
      error.textContent='';
      if(active!==i){audio.pause();audio.src=track.url;active=i;audio.load();}
      try {
        await audio.play();
        paint();
        show(false); // Auswahl aus dem Weg räumen
      } catch(e) {
        audio.pause();paint();
        error.textContent='Diese Musik konnte nicht geladen werden. Bitte Internetverbindung und Musikdatei prüfen.';
      }
    });
    list.appendChild(b);
  });
  toggle.addEventListener('click',()=>show(panel.hidden));
  el('ls-music-close').addEventListener('click',()=>show(false));
  pause.addEventListener('click',async()=>{
    if(active<0)return;
    if(audio.paused){
      try{await audio.play();error.textContent='';show(false);}
      catch(e){error.textContent='Die Wiedergabe konnte nicht gestartet werden.';}
    }else audio.pause();
    paint();
  });
  el('ls-music-volume').addEventListener('input',e=>{audio.volume=Number(e.target.value)/100;});
  audio.addEventListener('play',paint);audio.addEventListener('pause',paint);
  audio.addEventListener('error',()=>{error.textContent='Musikdatei nicht erreichbar.';paint();});
  // Ein Hörspiel in einem untergeordneten Spiel pausiert die Hintergrundmusik.
  window.addEventListener('message', event=>{
    if(event.origin!==location.origin)return;
    if(event.data?.type==='lernsafari:foreground-audio' && event.data.playing === true && !audio.paused)audio.pause();
  });
  // Audio in iframes gleicher Herkunft erkennen: etwa Hörverständnisse.
  document.addEventListener('play',e=>{
    if(e.target instanceof HTMLMediaElement && e.target!==audio && !audio.paused)audio.pause();
  },true);
  // Hörspiele innerhalb der Lern-Lagune werden in einem same-origin iframe angezeigt.
  // 'play' aus einem iframe erreicht den Eltern-DOM nicht, darum separat registrieren.
  const boundFrames=new WeakSet();
  function watchFrames(){
    document.querySelectorAll('iframe').forEach(frame=>{
      if(boundFrames.has(frame))return;
      boundFrames.add(frame);
      const listen=()=>{
        try{
          const innerDoc=frame.contentDocument;
          if(!innerDoc)return;
          innerDoc.addEventListener('play',event=>{
            if(event.target instanceof HTMLMediaElement && !audio.paused)audio.pause();
          },true);
        }catch(_){ /* fremde iframe-Inhalte bleiben isoliert */ }
      };
      frame.addEventListener('load',listen);
      listen();
    });
  }
  const frameObserver=new MutationObserver(watchFrames);
  frameObserver.observe(document.body,{childList:true,subtree:true});
  watchFrames();
  paint();
})();
