/* LernSafari 2.9 – browser-local demonstration. Not authentication or a backend. */
'use strict';
(()=>{
  const KEY='lernsafari-local-demo-v29';
  const safe=s=>escapeHtml(String(s));
  const defaultData=()=>({assignments:[{id:'demo-tageszahl',title:'Zahl des Tages',kind:'daily',file:'',subject:'Mathe',due:'',published:true},{id:'demo-solmi',title:'Solmisationsspiel',kind:'game',file:'solmisationsspiel.html',subject:'Musik',due:'',published:true}],done:{},attempts:[]});
  let data;
  try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');data=raw&&Array.isArray(raw.assignments)&&raw.done?raw:defaultData()}catch(_){data=defaultData()}
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){toast('Lokale Speicherung ist in diesem Browser nicht möglich.')}};
  const isChild=()=>state.role==='demo';
  const isTeacher=()=>state.role==='demo-admin';
  const games=Object.entries(ORIGINAL_GAMES).flatMap(([subject,items])=>items.map(g=>({...g,subject})));
  const byFile=file=>games.find(g=>g.file===file);
  const visible=()=>data.assignments.filter(a=>a.published && (!a.due || a.due>=new Date().toISOString().slice(0,10)));
  const statusText=()=>Object.keys(data.done).filter(id=>data.done[id]).length;
  const oldModal=renderModal;
  renderModal=function(){if(state.modal==='admin'){renderAdmin();return}if(state.modal==='logbook' && (isChild()||isTeacher())){renderDemoLogbook();return}oldModal()};

  function renderDemoLogbook(){
    const student=isChild();const assigned=visible();const done=assigned.filter(a=>data.done[a.id]).length;
    DOM.modalBody.innerHTML=`<div class="pd-shell"><div class="pd-banner"><div><span class="pd-eyebrow">${student?'Mein persönlicher Bereich':'Verwaltungs-Vorschau'}</span><h3>${student?'Mein Logbuch 📖':'So sieht das Logbuch aus'}</h3><p>Hier findest du die Aufgaben, die für das Demo-Kind freigegeben sind.</p></div><div class="pd-total"><strong>${done} / ${assigned.length}</strong><span>geschafft</span></div></div><div class="pd-progress"><span style="width:${assigned.length?done/assigned.length*100:0}%"></span></div><div class="pd-items">${assigned.length?assigned.map(a=>`<article class="pd-task ${data.done[a.id]?'is-done':''}"><div class="pd-task-head"><span>${a.kind==='daily'?'🌞':a.subject==='Musik'?'🎵':a.subject==='Mathe'?'🔢':a.subject==='NMG'?'🐦‍⬛':a.subject==='Deutsch'?'📖':'🎲'}</span><div><strong>${safe(a.title)}</strong><small>${a.kind==='daily'?'Tages-Tal':safe(a.subject)}${a.due?' · bis '+safe(a.due):''}</small></div><span class="pd-task-status">${data.done[a.id]?'✓ Erledigt':'Offen'}</span></div><div class="pd-task-actions"><button class="pd-action" data-pd-open="${safe(a.id)}">Aufgabe öffnen</button><button class="pd-secondary" data-pd-toggle="${safe(a.id)}">${data.done[a.id]?'Als offen markieren':'Als erledigt markieren'}</button></div></article>`).join(''):'<p>Momentan sind keine Aufgaben freigeschaltet.</p>'}</div><div class="pd-panel"><h4>⭐ Meine Lernversuche</h4><p>${data.attempts.length} Übungsantworten wurden in dieser lokalen Demo erfasst. Eine richtige Einzelantwort bedeutet noch nicht, dass ein ganzes Spiel abgeschlossen ist.</p></div><p class="pd-warning">Nur Testdaten in diesem Browser: keine echte Anmeldung, keine gemeinsame Klassendatenbank und keine Übertragung der Demo-Häkchen auf andere Geräte.</p></div>`;
    DOM.modalBody.querySelectorAll('[data-pd-toggle]').forEach(b=>b.onclick=()=>{if(!isChild()&&!isTeacher())return;const id=b.dataset.pdToggle;data.done[id]=!data.done[id];save();renderDemoLogbook()});
    DOM.modalBody.querySelectorAll('[data-pd-open]').forEach(b=>b.onclick=()=>{const a=data.assignments.find(x=>x.id===b.dataset.pdOpen);if(!a)return;closeModal(true);if(a.kind==='daily'){travelTo('valley');return}const g=byFile(a.file);if(!g){toast('Dieses Spiel ist nicht verfügbar.');return}if(g.subject==='Allgemein'){travelTo('oasis');safariGame=null;originalFrame('original/spiele/'+encodeURIComponent(g.file),g.title,{areaId:'oasis',contextLabel:'Freie Angebote'});return}travelTo('lagoon');safariSubject=g.subject;safariGame=g;safariGameOrigin=g.subject;renderLagoon()});
  }
  const choices=games.map(g=>`<option value="${safe(g.file)}">${safe(g.subject)} · ${safe(g.title)}</option>`).join('');
  function renderAdmin(){
    if(!isTeacher()){DOM.modalBody.innerHTML='<p>Diese Vorschau ist nur im Modus «Verwaltung testen» sichtbar.</p>';return}
    DOM.modalBody.innerHTML=`<div class="pd-shell"><div class="pd-banner"><div><span class="pd-eyebrow">Lehrpersonen-Ansicht · lokale Demo</span><h3>Aufgaben verwalten 🛠️</h3><p>Du kannst Aufgaben zuweisen, veröffentlichen, ändern und den Demo-Fortschritt prüfen.</p></div></div><section class="pd-panel"><h4>Neue Aufgabe zuweisen</h4><form id="pd-add" class="pd-form"><label>Aufgabenquelle<select name="file"><option value="daily">🌞 Zahl des Tages</option>${choices}</select></label><label>Aufgabentitel<input name="title" maxlength="90" placeholder="z. B. Übe die 6er-Reihe" required></label><label>Fällig bis (optional)<input type="date" name="due"></label><label class="pd-inline"><input type="checkbox" name="published" checked> Für das Demo-Kind sichtbar</label><button class="pd-action" type="submit">Aufgabe hinzufügen</button></form></section><section class="pd-panel"><h4>Aufgaben (${data.assignments.length})</h4><div class="pd-items">${data.assignments.map(a=>`<article class="pd-task"><div class="pd-task-head"><span>📌</span><div><strong>${safe(a.title)}</strong><small>${a.kind==='daily'?'Zahl des Tages':safe(a.subject)}${a.due?' · bis '+safe(a.due):''}</small></div><span class="pd-task-status">${data.done[a.id]?'✓ Fertig':a.published?'Sichtbar':'Verborgen'}</span></div><div class="pd-task-actions"><button class="pd-secondary" data-pd-publish="${safe(a.id)}">${a.published?'Verbergen':'Veröffentlichen'}</button><button class="pd-secondary" data-pd-remove="${safe(a.id)}">Entfernen</button></div></article>`).join('')}</div></section><section class="pd-panel"><h4>Demo-Fortschritt</h4><p>${data.assignments.filter(a=>data.done[a.id]).length} Aufgaben als erledigt markiert · ${data.attempts.length} Lernversuche erfasst.</p><button class="pd-secondary" id="pd-preview">Kinder-Logbuch ansehen</button><button class="pd-secondary" id="pd-reset">Demo-Fortschritt zurücksetzen</button></section><p class="pd-warning"><strong>Keine echte Admin-Sicherheit:</strong> Hier werden ausschliesslich lokale Demodaten verwaltet. Bitte keine echten Schülernamen, Passwörter oder Lernleistungen eingeben.</p></div>`;
    DOM.modalBody.querySelector('#pd-add').onsubmit=e=>{e.preventDefault();const form=e.currentTarget;const file=form.elements.file.value;const title=form.elements.title.value.trim();if(!title)return;const g=file==='daily'?null:byFile(file);if(!g&&file!=='daily')return;data.assignments.push({id:'task-'+Date.now()+'-'+Math.floor(Math.random()*10000),title,kind:file==='daily'?'daily':'game',file:file==='daily'?'':file,subject:g?.subject||'Mathe',due:form.elements.due.value,published:form.elements.published.checked});save();renderAdmin()};
    DOM.modalBody.querySelectorAll('[data-pd-publish]').forEach(b=>b.onclick=()=>{const a=data.assignments.find(x=>x.id===b.dataset.pdPublish);if(!a)return;a.published=!a.published;save();renderAdmin()});
    DOM.modalBody.querySelectorAll('[data-pd-remove]').forEach(b=>b.onclick=()=>{data.assignments=data.assignments.filter(x=>x.id!==b.dataset.pdRemove);save();renderAdmin()});
    DOM.modalBody.querySelector('#pd-preview').onclick=renderDemoLogbook;
    DOM.modalBody.querySelector('#pd-reset').onclick=()=>{if(!confirm('Nur die lokalen Demo-Häkchen und Lernversuche zurücksetzen?'))return;data.done={};data.attempts=[];save();renderAdmin()};
  }
  // Telemetry from original exercise frames is displayed only as local demonstration feedback.
  window.addEventListener('message',e=>{
    if(e.data?.source!=='LernSafariOriginal'||e.data.action!=='demoAttempt')return;
    const frame=document.getElementById('originalGameFrame');if(!frame||e.source!==frame.contentWindow||!isChild())return;
    if(e.origin!==location.origin && !(e.origin==='null'&&location.protocol==='file:'))return;
    data.attempts.push({game:String(e.data.game||'').slice(0,80),correct:e.data.correct===true,ts:new Date().toISOString()});
    data.attempts=data.attempts.slice(-100);save();
  });
  save();
})();
