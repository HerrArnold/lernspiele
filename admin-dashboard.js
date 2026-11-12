/* LernSafari teacher cockpit: group existing authenticated Cloudflare controls.
   No fabricated persistence or permission checks; all writes call the existing Worker. */
'use strict';
(function(root){
 const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const areas=[
  {id:'assignments',icon:'📌',name:'Lernaufträge',desc:'Tagesaufgaben, Fächer, Themen und Spiele zuweisen'},
  {id:'mode',icon:'🧭',name:'Unterrichtsmodus',desc:'Ankunftszeit, Fachunterricht und Entdeckungszeit'},
  {id:'progress',icon:'📈',name:'Lernfortschritte',desc:'Punkte und Lernversuche nach Kind und Thema'},
  {id:'activity',icon:'👀',name:'Aktivitätsübersicht',desc:'Wer ist online? Wer erledigt gerade einen Auftrag?'},
  {id:'agenda',icon:'📅',name:'Agenda',desc:'Wochenübersicht und Hausaufgaben, Lernkontrollen, Schulfrei bearbeiten'},
  {id:'memories',icon:'📷',name:'Erinnerungen',desc:'Fotos, Datum und Rückblicke als Polaroids beim Baobab veröffentlichen'}
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
  const {host,kids=[],jobs=[],pres=[],done=[],verified=[],targets=[],call,renderAdminProgress}=opts;
  if(!host?.isConnected||!host.querySelector('#cloudAssignmentForm'))return;
  const shell=host.querySelector('.cloud-shell');
  const banner=shell?.querySelector('.pd-banner');
  if(!shell||!banner)return;
  const oldParts=[...shell.children].filter(el=>el!==banner);
  const assignForm=shell.querySelector('#cloudAssignmentForm'),assignmentPanel=assignForm.closest('section');
  const modeNode=shell.querySelector('#cloudClassroomModeContainer');
  const jobPanel=shell.querySelector('#cloudRefreshAdmin')?.closest('section');
  const progressPanel=shell.querySelector('#cloudProgressPanel');
  const activityPanel=shell.querySelector('#cloudOpenLegacy')?.closest('section');
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
  if(assignmentPanel)sections.assignments.append(assignmentPanel);
  if(jobPanel)sections.assignments.append(jobPanel);
  if(verifyPanel)sections.assignments.append(verifyPanel);
  if(modeNode)sections.mode.append(modeNode);
  if(progressPanel)sections.progress.append(progressPanel);
  if(activityPanel)sections.activity.append(activityPanel);
  if(lockPanel)sections.activity.append(lockPanel);
  // Any unidentified old panel remains accessible in assignments; no controls are lost.
  for(const el of oldParts)if(el.parentElement===shell)sections.assignments.append(el);
  function open(name){
   deck.hidden=name!=='home';
   Object.entries(sections).forEach(([key,el])=>el.hidden=name!==key);
   banner.classList.toggle('admin-banner-compact',name!=='home');
   shell.scrollIntoView({block:'start',behavior:'smooth'});
   if(name==='progress')renderProgress();
   if(name==='activity')renderLiveActivity();
   if(name==='agenda')renderAgendaEditor();
   if(name==='activity')checkMessagesAvailability();
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
  // Always keep the legacy editor and its own authentication working.
  // New activity / messages panels are intentionally explicit about missing APIs.
  const livePanel=document.createElement('div');livePanel.className='pd-panel';
  const meaningful=pres.filter(p=>p&&typeof p==='object');
  livePanel.innerHTML='<h4>👀 Aktuelle Meldungen aus Cloudflare</h4><p class="admin-small-note">Diese Liste zeigt die vom Server gelieferten Anwesenheitsmeldungen. Eine genaue Live-Spielaktivität ist nur sichtbar, wenn der Worker sie mit Zeitstempel meldet.</p>'+
    (meaningful.length?'<div class="admin-presence-grid">'+meaningful.map(p=>{
      const user=p.username||p.name||'Tierkonto';
      const activity=p.game||p.activity||p.target||p.page||'Keine Tätigkeit übermittelt';
      const at=p.last_seen||p.lastSeen||p.updated_at||p.timestamp||null;
      return '<article><strong>'+html(user)+'</strong><span>'+html(activity)+'</span><small>'+html(at?String(at):'Keine Uhrzeit übermittelt')+'</small></article>';
    }).join('')+'</div>':'<p>Cloudflare meldet momentan keine Anwesenheitsdaten.</p>');
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
  sections.activity.append(activityProgress);

  const liveRefresh=document.createElement('div');
  liveRefresh.className='admin-live-refresh';liveRefresh.innerHTML='<button type="button" class="pd-secondary" id="adminLiveReload">🔄 Live-Aktivität aktualisieren</button><p class="admin-small-note" role="status" id="adminLiveStatus">Eine Aktivitätsanzeige wird nur nach serverseitiger Bestätigung aktiviert.</p>';
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
      status.textContent=data.students.length+' angemeldete Kinder in den letzten zwei Minuten gemeldet. Keine Daten älter als zwei Minuten.';
    }catch(_){status.textContent='Live-Aktivität noch nicht freigeschaltet: Cloudflare muss den geschützten Aktivitätsdienst bereitstellen.'}
  }
  livePanel.querySelector('#adminLiveReload').onclick=renderLiveActivity;
  // Refresh only while the authenticated teacher is viewing this workspace.
  // Stop the timer when the administration view is replaced.
  const liveTimer=setInterval(()=>{
    if(!livePanel.isConnected){clearInterval(liveTimer);return;}
    if(sections.activity.isConnected&&!sections.activity.hidden)renderLiveActivity();
  },30000);
  const messagePanel=document.createElement('div');messagePanel.className='pd-panel';
  messagePanel.innerHTML='<h4>✉️ Nachricht an die Kinder</h4><p>Mitteilungen werden nur über die geprüfte Cloudflare-Lehrpersonen-Sitzung versendet.</p><label>Empfänger<select id="adminMessageRecipient"><option value="all">Ganze Klasse</option>'+kids.map(k=>'<option value="'+html(k.username)+'">'+html(k.username)+'</option>').join('')+'</select></label><label>Betreff<input id="adminMessageSubject" maxlength="100" placeholder="z. B. Morgen mitbringen"></label><label>Nachricht<textarea id="adminMessageText" rows="5" maxlength="1500" placeholder="Deine Nachricht an die Kinder …"></textarea></label><div class="admin-message-actions"><button type="button" class="pd-action" id="adminMessageSend" disabled>Sicher versenden</button><button type="button" class="pd-secondary" id="adminMessageCopy">Text kopieren</button><button type="button" class="pd-secondary" id="adminMessageLegacy">Bestehende Verwaltung öffnen</button></div><p id="adminMessageStatus" role="status">Nachrichtenfunktion wird beim Öffnen geprüft.</p><section id="adminSentMessages" aria-label="Zuletzt versendete Nachrichten"></section>';
  // Keep the previously requested messaging tools accessible without adding a seventh landing card.
  const messagingDetails=document.createElement('details');
  messagingDetails.className='admin-detail-attempt';
  messagingDetails.innerHTML='<summary>✉️ Nachrichten an die Kinder (zusätzliche Verwaltung)</summary>';
  messagingDetails.append(messagePanel);
  sections.activity.append(messagingDetails);
  if(sections.memories&&root.LernSafariProjects?.adminMount){
    const projectMount=document.createElement('div');projectMount.id='adminProjectsMount';sections.memories.append(projectMount);
    root.LernSafariProjects.adminMount({mount:projectMount,call});
  }
  let messageServiceAvailable=false;
  async function checkMessagesAvailability(){
    const status=messagePanel.querySelector('#adminMessageStatus');
    status.textContent='Geschützte Nachrichtenfunktion wird geprüft …';
    try{
      const data=await call('/admin-messages',{admin:true});
      if(data.available!==true||!Array.isArray(data.messages))throw Error('Keine Nachrichten-API');
      messageServiceAvailable=true;
      messagePanel.querySelector('#adminMessageSend').disabled=false;
      status.textContent='Nachrichten können sicher über Cloudflare versendet werden.';
      const list=messagePanel.querySelector('#adminSentMessages');
      list.innerHTML='<h5>Zuletzt versendet</h5>'+(data.messages.length?
        '<div class="admin-sent-list">'+data.messages.slice(0,20).map(m=>'<article><strong>'+html(m.subject)+'</strong><span>'+html(m.audience==='all'?'Ganze Klasse':m.recipient||'Ein Kind')+'</span><small>'+html(m.created_at||'')+'</small></article>').join('')+'</div>':
        '<p>Es wurden noch keine Nachrichten versendet.</p>');
    }catch(_){
      messageServiceAvailable=false;
      messagePanel.querySelector('#adminMessageSend').disabled=true;
      status.textContent='Senden noch nicht möglich: Die Cloudflare-Nachrichten-API ist nicht aktiviert. Du kannst den Text weiterhin kopieren.';
    }
  }
  messagePanel.querySelector('#adminMessageSend').onclick=async()=>{
    if(!messageServiceAvailable)return;
    const recipient=messagePanel.querySelector('#adminMessageRecipient').value;
    const subject=messagePanel.querySelector('#adminMessageSubject').value.trim();
    const body=messagePanel.querySelector('#adminMessageText').value.trim();
    const status=messagePanel.querySelector('#adminMessageStatus');
    if(!subject||!body){status.textContent='Bitte Betreff und Nachricht eingeben.';return;}
    const audience=recipient==='all'?'all':'child';
    const label=recipient==='all'?'die ganze Klasse':recipient;
    if(!confirm('Nachricht wirklich an '+label+' senden?'))return;
    const button=messagePanel.querySelector('#adminMessageSend');button.disabled=true;
    try{
      const result=await call('/admin-messages',{method:'POST',admin:true,body:{audience,recipient:audience==='child'?recipient:undefined,subject,body}});
      if(result.ok!==true)throw Error('Keine Serverbestätigung');
      status.textContent='✅ Nachricht wurde auf Cloudflare gespeichert und ist für '+label+' sichtbar.';
      messagePanel.querySelector('#adminMessageSubject').value='';
      messagePanel.querySelector('#adminMessageText').value='';
      await checkMessagesAvailability();
    }catch(err){status.textContent='Nicht gesendet: '+html(err.message||err);button.disabled=false;}
  };
  messagePanel.querySelector('#adminMessageCopy').onclick=async()=>{
    const subject=messagePanel.querySelector('#adminMessageSubject').value.trim(),body=messagePanel.querySelector('#adminMessageText').value.trim();
    if(!body){messagePanel.querySelector('#adminMessageStatus').textContent='Bitte zuerst einen Nachrichtentext eingeben.';return}
    try{await navigator.clipboard.writeText((subject?subject+'\n\n':'')+body);messagePanel.querySelector('#adminMessageStatus').textContent='Text kopiert – noch nicht versendet.'}
    catch(_){messagePanel.querySelector('#adminMessageStatus').textContent='Kopieren im Browser nicht erlaubt. Du kannst den Text markieren und kopieren.'}
  };
  messagePanel.querySelector('#adminMessageLegacy').onclick=()=>host.querySelector('#cloudOpenLegacy')?.click();
  async function renderProgress(){
    const mountPoint=sections.progress;
    let wrapper=mountPoint.querySelector('#adminDrilldown');
    if(!wrapper){wrapper=document.createElement('section');wrapper.className='pd-panel';wrapper.id='adminDrilldown';mountPoint.prepend(wrapper);}
    wrapper.innerHTML='<h4>📊 Detaillierte Lernfortschritte</h4><p role="status">Daten werden sicher aus Cloudflare geladen …</p>';
    try{
      const report=await call('/admin-report',{admin:true});
      if(!wrapper.isConnected)return;
      if(root.LernSafariProgress){root.LernSafariProgress.render(wrapper,report,kids,topics,SUBJECTS);return;}
      const attempts=Array.isArray(report.attempts)?report.attempts:[];
      const highs=Array.isArray(report.highscores)?report.highscores:[];
      wrapper.innerHTML='<h4>📊 Detaillierte Lernfortschritte</h4><div class="admin-progress-filters">'+
        createSelect('Kind','adminProgressKid',[['','Alle Kinder'],...kids.map(k=>[k.username,k.username])])+
        createSelect('Fach','adminProgressSubject',[['','Alle Fächer'],...SUBJECTS.map(s=>[s,s])])+
        createSelect('Thema','adminProgressTopic',[['','Alle Themen']])+
        '</div><div id="adminProgressDetails"></div><p class="admin-small-note">Die Zahlen beruhen ausschliesslich auf vorhandenen Cloudflare-Spielversuchen. Nicht übermittelte Ergebnisse werden nicht geschätzt.</p>';
      const filters={kid:wrapper.querySelector('#adminProgressKid'),subject:wrapper.querySelector('#adminProgressSubject'),topic:wrapper.querySelector('#adminProgressTopic')},output=wrapper.querySelector('#adminProgressDetails');
      const topicGames=()=> (topics[filters.subject.value]||[]);
      function updateTopics(){
        const old=filters.topic.value;
        filters.topic.innerHTML='<option value="">Alle Themen</option>'+topicGames().map(t=>'<option value="'+html(t.name)+'">'+html(t.name)+'</option>').join('');
        filters.topic.value=topicGames().some(t=>t.name===old)?old:'';
      }
      const selectedGames=()=>{
        if(!filters.subject.value)return null;
        const candidates=topicGames().filter(t=>!filters.topic.value||t.name===filters.topic.value);
        return new Set(candidates.flatMap(t=>t.games.map(g=>g.file?.replace(/\.html$/,'')).filter(Boolean)));
      };
      const numeric=x=>{const n=Number(x);return Number.isFinite(n)?n:null};
      function draw(){
        const games=selectedGames(),kid=filters.kid.value;
        const rec=attempts.filter(a=>(!kid||a.username===kid)&&(!games||games.has(String(a.game||a.game_id||''))));
        const scores=highs.filter(a=>(!kid||a.username===kid)&&(!games||games.has(String(a.game||a.game_id||''))));
        const completedGames=new Set(rec.map(x=>x.game||x.game_id).filter(Boolean));
        const labels=new Map();
        for(const subject of SUBJECTS)for(const topic of topics[subject])for(const g of topic.games){
          if(g.file)labels.set(g.file.replace(/\.html$/,''),subject+' · '+topic.name+' · '+g.title);
        }
        const grouped=new Map();
        for(const a of rec){
          const id=String(a.game||a.game_id||'unbekannt');
          const row=grouped.get(id)||{id,count:0,values:[]};
          row.count++;
          const score=numeric(a.score??a.points??a.correct_count??a.correctCount);
          if(score!==null)row.values.push(score);
          grouped.set(id,row);
        }
        const points=rec.map(a=>numeric(a.score??a.points??a.correct_count??a.correctCount)).filter(x=>x!==null);
        const best=scores.map(a=>numeric(a.score??a.highscore??a.best_score)).filter(x=>x!==null);
        output.innerHTML='<div class="admin-metrics"><article><strong>'+rec.length+'</strong><span>gespeicherte Versuche</span></article><article><strong>'+completedGames.size+'</strong><span>verschiedene Spiele</span></article><article><strong>'+(points.length?Math.max(...points):'—')+'</strong><span>höchste Versuchspunkte*</span></article><article><strong>'+(best.length?Math.max(...best):'—')+'</strong><span>bester Highscore*</span></article></div>'+
          '<p class="admin-small-note">* Punkte nur, sofern die Cloudflare-Daten diesen Wert enthalten; verschiedene Spiele haben unterschiedliche Maximalpunktzahlen.</p>'+
          (grouped.size?'<h5 class="admin-game-results-title">Ergebnisse nach Lernspiel</h5><div class="admin-game-result-list">'+[...grouped.values()].sort((a,b)=>b.count-a.count).map(g=>'<article><strong>'+html(labels.get(g.id)||g.id.replace(/-/g,' '))+'</strong><span>'+g.count+' Versuche</span><span>'+(g.values.length?'Bester Wert: '+Math.max(...g.values):'Keine Punkte übermittelt')+'</span></article>').join('')+'</div>':'')+
          (rec.length?'<div class="admin-result-rows">'+rec.slice(0,75).map(a=>{
            const rawDate=a.created_at||a.at||a.timestamp||'';
            const rawPoints=numeric(a.score??a.points??a.correct_count??a.correctCount);
            return '<article><strong>'+html(a.username||'')+'</strong><span>'+html(a.game||a.game_id||'Lernspiel')+'</span><span>'+(rawPoints===null?'Punkte nicht übermittelt':rawPoints+' Punkte')+'</span><small>'+html(rawDate)+'</small></article>';
          }).join('')+'</div>':'<p>Für diese Auswahl liegen keine gespeicherten Versuche vor.</p>');
      }
      filters.subject.onchange=()=>{updateTopics();draw()};
      filters.kid.onchange=draw;filters.topic.onchange=draw;draw();
    }catch(err){wrapper.innerHTML='<h4>📊 Detaillierte Lernfortschritte</h4><p>Cloudflare-Bericht nicht verfügbar: '+html(err.message||err)+'</p>'}
  }

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
