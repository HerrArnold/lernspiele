/* LernSafari teacher cockpit: group existing authenticated Cloudflare controls.
   No fabricated persistence or permission checks; all writes call the existing Worker. */
'use strict';
(function(root){
 const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const areas=[
  {id:'mathplan',icon:'📘',name:'Matheplan',desc:'Alle Aufgaben und Häkchen der Klasse oder einzelner Tiere'},
  {id:'matrix',icon:'📊',name:'Lernaktivität nach Inhalt',desc:'Lern-Lagune, Oase, Baobab: Durchläufe, erster und bester Wert'},
  {id:'assignments',icon:'📌',name:'Lernaufträge',desc:'Aufträge planen, Exit-Tickets und Tagesaufgaben ansehen'},
  {id:'activity',icon:'👀',name:'Aktivitätsübersicht',desc:'Auf Knopfdruck sehen, welches Tier wo arbeitet'},
  {id:'agenda',icon:'📅',name:'Agenda',desc:'Wochenübersicht und Hausaufgaben, Lernkontrollen, Schulfrei bearbeiten'},
  {id:'memories',icon:'📷',name:'Erinnerungen',desc:'Fotos, Datum und Rückblicke als Polaroids beim Baobab veröffentlichen'},
  {id:'messages',icon:'✉️',name:'Nachrichten',desc:'Briefe an alle oder einzelne Kinder senden und Lesestatus ansehen'}
 ];
 const SUBJECTS=['Mathe','Deutsch','NMG','Musik','Englisch'];
 const TARGET_AREAS=[
  ['lagoon','🌊 Lern-Lagune','Fach → Thema → Spiel'],
  ['valley','🌞 Tages-Tal','Zahl des Tages und Tagesaufgaben'],
  ['baobab','🌳 Baobab-Baum','Wissensangebote und Advent'],
  ['oasis','🏝️ Oase','Rätsel und Angebote'],
  ['agenda','🧭 Kompass','Agenda und Termine'],
  ['help','🦩 Lernhilfen','Unterstützung und Lernportale']
 ];
 function catalog(allowed){
  const permitted=new Set(allowed.map(x=>x.v));
  const bySubject={};
  for(const subject of SUBJECTS){
   bySubject[subject]=(root.LernSafariTopicCatalog?.[subject]||[]).map(topic=>({
     name:topic.name,icon:topic.icon,
     games:topic.games.map(([title,file])=>({title,file,target:file?'game:'+file.replace(/\.html$/,''):null,available:!!file&&permitted.has('game:'+file.replace(/\.html$/,''))}))
   }));
  }
  return bySubject;
 }
 function safeTargetOptions(targets,ids){
  return ids.map(id=>targets.find(t=>t.v===id)).filter(Boolean);
 }
 function createSelect(label,id,choices){return '<label>'+label+'<select id="'+id+'">'+choices.map(x=>'<option value="'+html(x[0])+'">'+html(x[1])+'</option>').join('')+'</select></label>'}
 function mount(opts){
  const {host,kids=[],jobs=[],done=[],verified=[],targets=[],call}=opts;
  if(!host?.isConnected||!host.querySelector('#cloudAssignmentForm'))return;
  const shell=host.querySelector('.cloud-shell');
  const banner=shell?.querySelector('.pd-banner');
  if(!shell||!banner)return;
  const oldParts=[...shell.children].filter(el=>el!==banner);
  const assignForm=shell.querySelector('#cloudAssignmentForm'),assignmentPanel=assignForm.closest('section');
  const jobPanel=shell.querySelector('#cloudRefreshAdmin')?.closest('section');
  const verifyPanel=shell.querySelector('#cloudTeacherVerification');
  const lockPanel=shell.querySelector('#cloudLoginLocks');
  const deck=document.createElement('div');deck.className='admin-deck';
  deck.innerHTML='<div class="admin-deck-intro"><h4>Was möchtest du verwalten?</h4><p>Wähle einen Bereich. Du kannst jederzeit zurück zur Übersicht.</p></div>'+
    '<div class="admin-deck-grid">'+areas.map(a=>'<button type="button" class="admin-deck-card" data-admin-section="'+a.id+'"><span class="admin-deck-icon">'+a.icon+'</span><strong>'+a.name+'</strong><small>'+a.desc+'</small><span aria-hidden="true" class="admin-deck-arrow">→</span></button>').join('')+'</div>';
  shell.append(deck);
  const sections={};
  for(const item of areas){
   const sec=document.createElement('section');sec.className='admin-workspace';sec.dataset.adminWorkspace=item.id;
   sec.hidden=true;
   sec.innerHTML='<div class="admin-workspace-head"><button type="button" class="pd-secondary admin-home">← Zur Verwaltungsübersicht</button><div><h3>'+item.icon+' '+item.name+'</h3><p>'+item.desc+'</p></div></div>';
   shell.append(sec);sections[item.id]=sec;
   sec.querySelector('.admin-home').addEventListener('click',()=>open('home'));
  }
  let mathPlanControl=null;
  if(sections.mathplan&&root.LernSafariMathPlanUI){
    const target=document.createElement('div');target.id='adminMathplanMount';
    sections.mathplan.append(target);
    mathPlanControl=root.LernSafariMathPlanUI.adminMount({host:target,call,kids});
  }
  if(assignmentPanel)sections.assignments.append(assignmentPanel);
  if(jobPanel)sections.assignments.append(jobPanel);
  if(verifyPanel)sections.assignments.append(verifyPanel);
  let exitAdminControl=null,exitOverviewLoaded=false;
  if(root.LernSafariExitAdmin){
   const exitHost=document.createElement('div');exitHost.id='adminNativeExitTickets';sections.assignments.append(exitHost);
   exitAdminControl=root.LernSafariExitAdmin.mount({host:exitHost,call,kids});
  }
  if(root.LernSafariDailyAdmin){
   const dailyHost=document.createElement('div');dailyHost.id='adminDailyOverview';sections.assignments.append(dailyHost);
   root.LernSafariDailyAdmin.mount(dailyHost);
  }
  // Classroom-mode editor removed.
  let learningMatrixControl=null;
  if(sections.matrix&&root.LernSafariLearningMatrix){
   const spot=document.createElement('div');spot.id='adminLearningMatrixMount';
   sections.matrix.append(spot);
   learningMatrixControl=root.LernSafariLearningMatrix.mount({host:spot,call});
  }
  let messagesControl=null;
  if(sections.messages&&root.LernSafariAdminMessages){
   const messagesHost=document.createElement('div');messagesHost.id='adminMessagesMount';sections.messages.append(messagesHost);
   messagesControl=root.LernSafariAdminMessages.mount({host:messagesHost,call,kids});
  }
  if(lockPanel)sections.assignments.append(lockPanel);
  // Any unidentified old panel remains accessible in assignments; no controls are lost.
  for(const el of oldParts)if(el.parentElement===shell)sections.assignments.append(el);
  function open(name){
   deck.hidden=name!=='home';
   Object.entries(sections).forEach(([key,el])=>el.hidden=name!==key);
   banner.classList.toggle('admin-banner-compact',name!=='home');
   shell.scrollIntoView({block:'start',behavior:'smooth'});
   if(name==='assignments'&&!exitOverviewLoaded){exitOverviewLoaded=true;exitAdminControl?.refresh();}
   if(name==='matrix')learningMatrixControl?.refresh();
   if(name==='messages')messagesControl?.refresh();
   if(name==='mathplan')mathPlanControl?.refresh();
   // Live activity is fetched only after an explicit click.
   if(name==='agenda')renderAgendaEditor();
   if(name==='memories')openMemories();
   // Messaging is checked only if the teacher explicitly opens it.
  }
  deck.querySelectorAll('[data-admin-section]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.adminSection)));

  // Assignment hierarchy: map place -> subject -> topic -> game.
  const topics=catalog(targets);
  const originalLabel=assignForm.elements.target.closest('label');
  originalLabel.classList.add('admin-hidden-original-target');
  const picker=document.createElement('div');picker.className='admin-assignment-picker';
  picker.innerHTML='<h5>1. Wo befindet sich der Lernauftrag?</h5><div class="admin-area-pills" id="adminAreaPills">'+TARGET_AREAS.map(a=>'<button type="button" data-area="'+a[0]+'" aria-pressed="'+(a[0]==='lagoon')+'"><strong>'+a[1]+'</strong><small>'+a[2]+'</small></button>').join('')+'</div>'+
    '<div class="admin-picker-controls" id="adminPickerControls"></div>'+
    '<div class="admin-choice-caption" id="adminChosenCount" role="status"></div>';
  assignForm.prepend(picker);
  let area='lagoon',scope='game',selectedSubject='Mathe',selectedTopic='',selectedTarget='';
  const optsFor=()=>targets.filter(t=>t.v.startsWith('game:'));
  const getSubjectTopics=()=>topics[selectedSubject]||[];
  function redraw(){
   picker.querySelectorAll('[data-area]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.area===area)));
   const controls=picker.querySelector('#adminPickerControls');
   if(area==='lagoon'){
    const ts=getSubjectTopics();
    if(!ts.some(x=>x.name===selectedTopic))selectedTopic=ts[0]?.name||'';
    const chosen=ts.find(t=>t.name===selectedTopic);
    const options=chosen?.games||[];
    if(!options.some(x=>x.target===selectedTarget&&x.available))selectedTarget=options.find(x=>x.available)?.target||'';
    controls.innerHTML=createSelect('2. Fach','adminPickSubject',SUBJECTS.map(x=>[x,x]))+
      createSelect('3. Thema','adminPickTopic',ts.map(x=>[x.name,x.name]))+
      createSelect('4. Was zuweisen?','adminPickScope',[['game','Einzelnes Lernspiel'],['topic','Alle verfügbaren Spiele dieses Themas'],['subject','Ganzes Fach (alle verfügbaren Spiele)']])+
      (scope==='game'?createSelect('5. Spiel','adminPickGame',options.filter(x=>x.available).map(x=>[x.target,x.title])):'')+
      '<p class="admin-small-note">Ein ganzes Fach oder Thema wird in einzelne Aufträge für die enthaltenen Spiele aufgeteilt. Inhalte ohne Cloudflare-Auftragskennung sind noch nicht zuweisbar.</p>';
    controls.querySelector('#adminPickSubject').value=selectedSubject;
    controls.querySelector('#adminPickTopic').value=selectedTopic;
    controls.querySelector('#adminPickScope').value=scope;
    if(controls.querySelector('#adminPickGame'))controls.querySelector('#adminPickGame').value=selectedTarget;
    controls.querySelector('#adminPickSubject').onchange=e=>{selectedSubject=e.target.value;selectedTopic='';selectedTarget='';redraw()};
    controls.querySelector('#adminPickTopic').onchange=e=>{selectedTopic=e.target.value;selectedTarget='';redraw()};
    controls.querySelector('#adminPickScope').onchange=e=>{scope=e.target.value;redraw()};
    controls.querySelector('#adminPickGame')?.addEventListener('change',e=>{selectedTarget=e.target.value;sync()});
   }else{
    const ids=area==='valley'?targets.filter(x=>x.v.startsWith('daily:')||x.v.startsWith('number:')||x.v==='page:aufgaben'):
      area==='baobab'?safeTargetOptions(targets,['page:tiere','page:advent']):
      area==='help'?safeTargetOptions(targets,['page:lernportale']):
      area==='oasis'?targets.filter(t=>t.v==='page:oasis'||t.v.startsWith('oasis:')):
      safeTargetOptions(targets,['page:agenda']);
    if(!ids.some(x=>x.v===selectedTarget))selectedTarget=ids[0]?.v||'';
    controls.innerHTML=createSelect('2. Lerninhalt','adminPickAreaTarget',ids.map(x=>[x.v,x.label]));
    controls.querySelector('#adminPickAreaTarget').value=selectedTarget;
    controls.querySelector('#adminPickAreaTarget').onchange=e=>{selectedTarget=e.target.value;sync()};
   }
   sync();
  }
  function selection(){
   if(area!=='lagoon')return selectedTarget?[selectedTarget]:[];
   if(scope==='subject')return getSubjectTopics().flatMap(t=>t.games).filter(g=>g.available).map(g=>g.target);
   if(scope==='topic')return (getSubjectTopics().find(t=>t.name===selectedTopic)?.games||[]).filter(g=>g.available).map(g=>g.target);
   return selectedTarget?[selectedTarget]:[];
  }
  function sync(){
   const ids=[...new Set(selection())];
   const found=ids.filter(v=>targets.some(t=>t.v===v));
   if(found.length)assignForm.elements.target.value=found[0];
   picker.querySelector('#adminChosenCount').textContent=found.length
     ?found.length===1?'1 Lernauftrag ausgewählt: '+(targets.find(t=>t.v===found[0])?.label||found[0]):found.length+' Spiele als einzelne Lernaufträge ausgewählt'
     :'Keine aktuell zuweisbaren Aufgaben in dieser Auswahl.';
   assignForm.querySelector('[type="submit"]').disabled=found.length===0;
   if(!assignForm.elements.title.value.trim()&&found.length){
    assignForm.elements.title.value=scope==='subject'?selectedSubject+' üben':scope==='topic'?selectedTopic+' üben':targets.find(t=>t.v===found[0])?.label.split(' · ').at(-1)||'Lernauftrag';
   }
  }
  picker.querySelectorAll('[data-area]').forEach(b=>b.addEventListener('click',()=>{
    area=b.dataset.area;selectedTarget='';scope='game';redraw();
  }));
  redraw();
  // Editing an existing job should always return to a single target.
  assignForm.addEventListener('click',()=>{},false);
  host.querySelectorAll('[data-cloud-edit]').forEach(b=>b.addEventListener('click',()=>{
    const job=jobs.find(x=>String(x.id)===b.dataset.cloudEdit);if(!job)return;
    selectedTarget=String(job.target||'');
    if(selectedTarget.startsWith('game:')){
      area='lagoon';scope='game';
      for(const subject of SUBJECTS)for(const topic of topics[subject])if(topic.games.some(g=>g.target===selectedTarget)){
        selectedSubject=subject;selectedTopic=topic.name;
      }
    }else{area=selectedTarget.startsWith('daily:')||selectedTarget.startsWith('number:')||selectedTarget==='page:aufgaben'?'valley':
      ['page:tiere','page:advent'].includes(selectedTarget)?'baobab':selectedTarget==='page:lernportale'?'help':selectedTarget.startsWith('oasis:')||selectedTarget==='page:oasis'?'oasis':'agenda';scope='game'}
    redraw();
  }));
  assignForm.addEventListener('submit',async e=>{
    const ids=[...new Set(selection())].filter(v=>targets.some(t=>t.v===v));
    if(assignForm.dataset.id||ids.length<=1)return;
    e.preventDefault();e.stopImmediatePropagation();
    const status=host.querySelector('#cloudAdminMessage'),btn=assignForm.querySelector('[type="submit"]');
    const starts=new Date(assignForm.elements.start.value),ends=new Date(assignForm.elements.end.value);
    if(!ids.length||!(ends>starts)){status.textContent='Bitte gültige Aufträge und einen gültigen Zeitraum wählen.';return}
    if(!confirm('Wirklich '+ids.length+' einzelne Lernaufträge in Cloudflare für '+(assignForm.elements.audience.value==='all'?'die ganze Klasse':assignForm.elements.username.value)+' erstellen?'))return;
    btn.disabled=true;let saved=0;let error=null;
    for(const target of ids){
      const label=targets.find(x=>x.v===target)?.label||target;
      const payload={audience:assignForm.elements.audience.value,username:assignForm.elements.audience.value==='child'?assignForm.elements.username.value:'',
        start_at:starts.toISOString(),end_at:ends.toISOString(),target,kind:assignForm.elements.kind.value,
        title:(scope==='subject'?selectedSubject:scope==='topic'?selectedTopic:assignForm.elements.title.value.trim())+' · '+label.split(' · ').at(-1)};
      try{await call('/admin-assignments',{admin:true,method:'POST',body:payload});saved++}
      catch(err){error=err;break}
      status.textContent=saved+' von '+ids.length+' Aufträgen in Cloudflare gespeichert …';
    }
    if(error){status.textContent=saved+' Aufträge gespeichert; danach Fehler: '+String(error.message||error);btn.disabled=false;}
    else{status.textContent=saved+' Lernaufträge gespeichert.';await opts.renderCloudAdmin();}
  },true);
  const livePanel=document.createElement('div');livePanel.className='pd-panel';
  livePanel.innerHTML='<h4>👀 Aktivität auf Anfrage</h4><p class="admin-small-note">Die Übersicht wird ausschliesslich durch deinen Klick geladen. Du siehst, wo sich die Kinder zuletzt gemeldet haben.</p>';
  sections.activity.prepend(livePanel);
  // Assignment completion is separate from live presence. Do not present a
  // pupil's self-reported "done" check as teacher-verified completion.
  const activityProgress=document.createElement('section');
  activityProgress.className='pd-panel admin-activity-assignments';
  const nowMs=Date.now();
  const activeJobs=jobs.filter(j=>{
    const start=Date.parse(j.start_at||'');
    const end=Date.parse(j.end_at||'');
    return (!Number.isFinite(start)||start<=nowMs)&&(!Number.isFinite(end)||end>=nowMs);
  });
  const submitted=new Set(done.filter(x=>x&&x.username).map(x=>String(x.username)+'|'+Number(x.assignment_id)));
  const checked=new Set((Array.isArray(verified)?verified:[]).filter(x=>x&&x.username).map(x=>String(x.username)+'|'+Number(x.assignment_id)));
  activityProgress.innerHTML='<h4>📌 Lernaufträge der Tierkonten</h4>'+
   '<p class="admin-small-note">Aktive Zuweisungen aus Cloudflare. «Gemeldet» bedeutet vom Kind angekreuzt, «überprüft» bedeutet von der Lehrperson bestätigt.</p>'+
   '<div class="admin-presence-grid">'+kids.map(k=>{
    const user=String(k.username||'');
    const mine=activeJobs.filter(j=>j.audience==='all'||j.username===user);
    const total=mine.length;
    const marked=mine.filter(j=>submitted.has(user+'|'+Number(j.id))).length;
    const confirmed=mine.filter(j=>checked.has(user+'|'+Number(j.id))).length;
    const outstanding=mine.filter(j=>!checked.has(user+'|'+Number(j.id)));
    const label=total===0?'Keine aktiven Aufträge':confirmed===total?'Alle bestätigt':marked===total?'Alle gemeldet':'Noch in Arbeit';
    return '<article class="admin-activity-person"><strong>'+html(user)+'</strong>'+
     '<span>'+html(label)+'</span>'+
     '<small>'+marked+' von '+total+' als erledigt gemeldet · '+confirmed+' überprüft</small>'+
     (outstanding.length?'<details><summary>'+outstanding.length+' noch nicht überprüfte Aufträge</summary><ul>'+outstanding.map(j=>'<li>'+html(j.title||j.target||'Auftrag')+'</li>').join('')+'</ul></details>':'')+
     '</article>';
   }).join('')+'</div>';
  sections.assignments.append(activityProgress);

  const liveRefresh=document.createElement('div');
  liveRefresh.className='admin-live-refresh';liveRefresh.innerHTML='<button type="button" class="pd-secondary" id="adminLiveReload">🔄 Jetzt abfragen: Wer ist wo?</button><p class="admin-small-note" role="status" id="adminLiveStatus">Noch keine Abfrage durchgeführt.</p>';
  livePanel.prepend(liveRefresh);
  async function renderLiveActivity(){
    const status=livePanel.querySelector('#adminLiveStatus');
    status.textContent='Sichere Aktivitätsmeldungen werden geprüft …';
    try{
      const data=await call('/admin-live-activity',{admin:true});
      if(!livePanel.isConnected)return;
      if(data.available!==true||!Array.isArray(data.students))throw Error('Dienst nicht verfügbar');
      const areaNames={camp:'Camp',map:'Karte',logbook:'Logbuch',lagoon:'Lern-Lagune',valley:'Tages-Tal',baobab:'Baobab-Baum',oasis:'Oase',agenda:'Agenda',mail:'Briefkasten',help:'Lernhilfe',game:'Lernspiel'};
      const gameTitles=new Map();
      for(const subject of SUBJECTS)for(const topic of topics[subject]||[])for(const game of topic.games){
        if(game.file)gameTitles.set(game.file.replace(/\.html$/,''),game.title);
      }
      let grid=livePanel.querySelector('#adminLiveVerified');
      if(!grid){grid=document.createElement('div');grid.id='adminLiveVerified';livePanel.append(grid)}
      grid.innerHTML=data.students.length?'<div class="admin-presence-grid">'+data.students.map(a=>'<article><strong>'+html(a.username)+'</strong><span>'+html(a.game?'🎮 '+(gameTitles.get(a.game)||a.game):areaNames[a.area]||a.area)+'</span><small>'+html(a.last_seen||'')+'</small></article>').join('')+'</div>':
        '<p>In den letzten zwei Minuten hat kein angemeldetes Kind Aktivität gemeldet.</p>';
      status.textContent='Manuell abgefragt um '+new Intl.DateTimeFormat('de-CH',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Zurich'}).format(new Date())+' · '+data.students.length+' Kinder mit einer Meldung aus den letzten zwei Minuten.';
    }catch(_){status.textContent='Live-Aktivität noch nicht freigeschaltet: Cloudflare muss den geschützten Aktivitätsdienst bereitstellen.'}
  }
  livePanel.querySelector('#adminLiveReload').onclick=renderLiveActivity;
  // Photo albums can contain large image payloads. Do not load them every
  // time Flamingo opens the dashboard; mount only when «Erinnerungen» is chosen.
  let memoriesMounted=false;
  const openMemories=()=>{
   if(memoriesMounted||!sections.memories||!root.LernSafariProjects?.adminMount)return;
   memoriesMounted=true;
   const projectMount=document.createElement('div');projectMount.id='adminProjectsMount';
   sections.memories.append(projectMount);
   root.LernSafariProjects.adminMount({mount:projectMount,call});
  };
  // Built-in teacher agenda: edits the existing authenticated Worker endpoint
  // with the SAME payload shape as the existing original/admin agenda editor.
  let agendaOffset=0,agendaLoaded=[],agendaEditing=null,agendaLoadSeq=0;
  const mondayDate=()=>{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const d=new Date(parts+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
    d.setUTCDate(d.getUTCDate()+agendaOffset*7);
    return d.toISOString().slice(0,10);
  };
  const shiftDay=(value,days)=>{const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
  const agendaLabel=e=>{
    const original=String(e.text||'').trim();
    const type=String(e.type||'special');
    const text=type==='special'?original:original.replace(/^(?:HA:\s*|Frei:\s*|LK\s+(?:Deutsch|Englisch|Mathe|Musik|NMG|Sport|Fach)\s*:\s*)/i,'').trim();
    const prefix=type==='ha'?'HA: ':type==='lk'?'LK '+String(e.subject||'Fach')+': ':type==='free'?'Frei: ':'';
    return text.startsWith(prefix)?text:prefix+text;
  };
  let agendaPanel=document.createElement('div');
  agendaPanel.className='pd-panel admin-agenda-panel';
  agendaPanel.innerHTML='<h4>📅 Termine im Kompass verwalten</h4>'+
    '<div class="admin-agenda-controls"><button type="button" data-shift="-1">◀ Letzte Woche</button>'+
    '<strong class="admin-agenda-week-label" id="adminAgendaWeekLabel"></strong>'+
    '<button type="button" data-shift="1">Nächste Woche ▶</button>'+
    '<button type="button" id="adminAgendaToday">Aktuelle Woche</button></div>'+
    '<p id="adminAgendaWeekNotice" role="status"></p>'+
    '<div id="adminAgendaDays" aria-live="polite"></div>'+
    '<h5 id="adminAgendaFormTitle">Neuen Termin erstellen</h5>'+
    '<form id="adminAgendaForm" class="admin-agenda-form">'+
     '<label>Datum<input name="date" type="date" required></label>'+
     '<label>Tageszeit<select name="period"><option value="am">Vormittag</option><option value="pm">Nachmittag</option></select></label>'+
     '<label>Art des Termins<select name="type"><option value="ha">Hausaufgabe (HA:)</option>'+
       '<option value="lk">Lernkontrolle (LK Fach:)</option><option value="special">Besonderer Termin</option>'+
       '<option value="free">Schulfrei (Frei:)</option></select></label>'+
     '<label id="adminAgendaSubjectWrap" hidden>Fach<select name="subject">'+
       ['Deutsch','Englisch','Mathe','Musik','NMG','Sport'].map(x=>'<option value="'+x+'">'+x+'</option>').join('')+
       '</select></label>'+
     '<label>Beginn (Schulfrei)<input name="startDate" type="date"></label>'+
     '<label>Ende (Schulfrei)<input name="endDate" type="date"></label>'+
     '<label class="admin-agenda-wide">Text<textarea name="text" maxlength="500" rows="2" placeholder="Was steht im Kalender?" required></textarea></label>'+
     '<div class="admin-agenda-form-actions"><button type="submit" id="adminAgendaSave">In Cloudflare speichern</button>'+
      '<button type="button" id="adminAgendaClear">Neue Eingabe</button>'+
      '<button type="button" id="adminAgendaRemove" hidden>Löschen</button></div>'+
     '<p class="admin-agenda-status admin-agenda-wide" id="adminAgendaStatus" role="status">Termine werden mit dem Cloudflare-Adminzugang bearbeitet.</p>'+
    '</form>';
  sections.agenda.append(agendaPanel);
  const agendaForm=agendaPanel.querySelector('#adminAgendaForm');
  const agendaStatus=agendaPanel.querySelector('#adminAgendaStatus');
  const agendaSubjectWrap=agendaPanel.querySelector('#adminAgendaSubjectWrap');
  const agendaToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function agendaTypeChange(){
    const free=agendaForm.elements.type.value==='free';
    agendaSubjectWrap.hidden=agendaForm.elements.type.value!=='lk';
    for(const name of ['startDate','endDate']){
      agendaForm.elements[name].required=free;
      agendaForm.elements[name].closest('label').hidden=!free;
    }
    agendaForm.elements.date.closest('label').hidden=free;
    agendaForm.elements.date.required=!free;
  }
  function resetAgendaForm(date=agendaToday(),period='am'){
    agendaEditing=null;agendaForm.reset();
    agendaForm.elements.date.value=date;agendaForm.elements.period.value=period;
    agendaForm.elements.startDate.value=date;agendaForm.elements.endDate.value=date;
    agendaPanel.querySelector('#adminAgendaFormTitle').textContent='Neuen Termin erstellen';
    agendaPanel.querySelector('#adminAgendaRemove').hidden=true;
    agendaTypeChange();
    agendaStatus.textContent='Neuen Termin eingeben und speichern.';
  }
  agendaForm.elements.type.onchange=agendaTypeChange;
  agendaPanel.querySelector('#adminAgendaClear').onclick=()=>resetAgendaForm();
  agendaPanel.querySelectorAll('[data-shift]').forEach(btn=>btn.onclick=()=>{
    agendaOffset+=Number(btn.dataset.shift);renderAgendaEditor();
  });
  agendaPanel.querySelector('#adminAgendaToday').onclick=()=>{agendaOffset=0;renderAgendaEditor()};
  function editAgendaEvent(event){
    agendaEditing=event;
    agendaForm.elements.type.value=event.type||'special';
    agendaForm.elements.period.value=event.period||'am';
    agendaForm.elements.date.value=event.day_date||event.start_date||agendaToday();
    agendaForm.elements.startDate.value=event.start_date||event.day_date||agendaToday();
    agendaForm.elements.endDate.value=event.end_date||event.day_date||agendaToday();
    agendaForm.elements.subject.value=event.subject||'Deutsch';
    agendaForm.elements.text.value=String(event.text||'').trim().replace(/^(?:HA:\s*|Frei:\s*|LK\s+(?:Deutsch|Englisch|Mathe|Musik|NMG|Sport|Fach)\s*:\s*)/i,'').trim();
    agendaPanel.querySelector('#adminAgendaFormTitle').textContent='Termin bearbeiten';
    agendaPanel.querySelector('#adminAgendaRemove').hidden=!(Number(event.id)>0||event.system_default);
    agendaTypeChange();
    agendaStatus.textContent='Du bearbeitest einen vorhandenen Termin.';
    agendaForm.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  async function renderAgendaEditor(){
    if(!agendaPanel.isConnected)return;
    const seq=++agendaLoadSeq,week=mondayDate(),days=Array.from({length:7},(_,i)=>shiftDay(week,i));
    const names=['Mo','Di','Mi','Do','Fr','Sa','So'];
    agendaPanel.querySelector('#adminAgendaWeekLabel').textContent=days[0]+' – '+days[6];
    agendaPanel.querySelector('#adminAgendaWeekNotice').innerHTML=agendaOffset?
      '<span class="admin-agenda-week-away">📅 Du bist nicht in der aktuellen Woche.</span>':
      '<span>✓ Aktuelle Woche</span>';
    const body=agendaPanel.querySelector('#adminAgendaDays');
    body.innerHTML='<p role="status">Kalender wird geladen …</p>';
    try{
      const result=await call('/admin-agenda?week='+encodeURIComponent(week),{admin:true});
      if(!body.isConnected||seq!==agendaLoadSeq)return;
      if(!Array.isArray(result.events))throw Error('Cloudflare hat keine Terminliste geliefert.');
      agendaLoaded=result.events;
      body.innerHTML='<div class="admin-agenda-days">'+days.map((date,i)=>
        '<article class="admin-agenda-day"><h5>'+names[i]+' · '+html(date.slice(8,10))+'.'+html(date.slice(5,7))+'.</h5>'+
        '<div class="admin-agenda-events">'+
        ['am','pm'].map(period=>{
          const matches=agendaLoaded.filter(e=>e.day_date===date&&e.period===period);
          return '<strong>'+(period==='am'?'☀ Vormittag':'☾ Nachmittag')+'</strong>'+
            (matches.length?matches.map(e=>{
              const index=agendaLoaded.indexOf(e);
              return '<button type="button" class="admin-agenda-entry" data-event-index="'+index+
                '" data-type="'+html(e.type||'special')+'">'+html(agendaLabel(e))+'</button>';
            }).join(''):'<small>Keine Termine</small>')+
            '<button type="button" class="admin-agenda-entry" data-new-date="'+date+'" data-new-period="'+period+'">+ Hinzufügen</button>';
        }).join('')+'</div></article>').join('')+'</div>';
      body.querySelectorAll('[data-event-index]').forEach(b=>b.onclick=()=>editAgendaEvent(agendaLoaded[Number(b.dataset.eventIndex)]));
      body.querySelectorAll('[data-new-date]').forEach(b=>{b.onclick=()=>{resetAgendaForm(b.dataset.newDate,b.dataset.newPeriod);agendaForm.scrollIntoView({block:'nearest',behavior:'smooth'})}});
    }catch(err){
      if(seq!==agendaLoadSeq||!body.isConnected)return;
      body.innerHTML='<p role="alert">Agenda momentan nicht erreichbar: '+html(err.message||err)+'</p>';
    }
  }
  agendaForm.onsubmit=async e=>{
    e.preventDefault();
    const f=agendaForm.elements,free=f.type.value==='free';
    if(!f.text.value.trim()){agendaStatus.textContent='Bitte einen Text eingeben.';return}
    if(free&&f.endDate.value<f.startDate.value){agendaStatus.textContent='Das Enddatum liegt vor dem Beginn.';return}
    if(agendaEditing&&((agendaEditing.type==='free')!==free)){
      agendaStatus.textContent='Für den Wechsel zu oder von Schulfrei bitte zuerst den bestehenden Termin löschen.';return;
    }
    const payload={id:Number(agendaEditing?.id)>0?Number(agendaEditing.id):undefined,
      date:f.date.value,period:f.period.value,type:f.type.value,
      subject:f.type.value==='lk'?f.subject.value:'',
      text:f.text.value.trim(),startDate:f.startDate.value,endDate:f.endDate.value,
      originalDefaultDate:agendaEditing?.system_default?agendaEditing.day_date:undefined};
    const button=agendaPanel.querySelector('#adminAgendaSave');button.disabled=true;
    agendaStatus.textContent='Termin wird gespeichert …';
    try{
      await call('/admin-agenda',{method:'POST',admin:true,body:payload});
      resetAgendaForm();agendaStatus.textContent='✅ Termin in Cloudflare gespeichert.';
      await renderAgendaEditor();
    }catch(err){agendaStatus.textContent='Nicht gespeichert: '+String(err.message||err)}
    finally{button.disabled=false}
  };
  agendaPanel.querySelector('#adminAgendaRemove').onclick=async()=>{
    if(!agendaEditing)return;
    const target=agendaEditing.system_default?{defaultDate:agendaEditing.day_date}:
      Number(agendaEditing.id)>0?{id:Number(agendaEditing.id),type:agendaEditing.type}:null;
    if(!target){agendaStatus.textContent='Dieser Termin lässt sich nicht entfernen.';return}
    if(!confirm('Diesen Termin wirklich löschen?'))return;
    const button=agendaPanel.querySelector('#adminAgendaRemove');button.disabled=true;
    try{
      await call('/admin-agenda',{method:'DELETE',admin:true,body:target});
      resetAgendaForm();agendaStatus.textContent='✅ Termin gelöscht.';
      await renderAgendaEditor();
    }catch(err){agendaStatus.textContent='Nicht gelöscht: '+String(err.message||err)}
    finally{button.disabled=false}
  };
  resetAgendaForm();

    // initial route always home, never expose a child report on the public guest view.
  open('home');
  return {open};
 }
 root.LernSafariAdminDashboard={mount,catalog};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.LernSafariAdminDashboard;
})(typeof window==='undefined'?globalThis:window);
