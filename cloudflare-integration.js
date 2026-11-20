/* LernSafari v3.0 – Use the existing Cloudflare Worker, keeping the original API and game logic.
   Real access is ALWAYS authorized by Cloudflare, never by a frontend role flag. */
'use strict';
(()=>{
 const API=()=>String(window.LERNSAFARI_BACKEND_URL||'').replace(/\/+$/,'');
 const CHILD_KEY='lernsafari-token-v1';
 const ADMIN_KEY='lernsafari-admin-token-v2';
 const esc=v=>escapeHtml(String(v??''));
 const html=(v)=>esc(v);
 let childToken='', adminToken='', person=null, plan=null, adminData=null, pending=false;
 let oldClassroomModeRetired=false, oldClassroomRetirementError='', obsoleteFocusRulesCleared=false;
 // No automatic classroom-mode polling.
 const safeGame=(name)=>Object.entries(ORIGINAL_GAMES).flatMap(([subject,items])=>items.map(g=>({...g,subject}))).find(g=>g.file.replace(/\.html$/,'')===name);
 const dateFormat=s=>{const d=new Date(s);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('de-CH',{timeZone:'Europe/Zurich',day:'numeric',month:'short',year:'numeric'}).format(d):''};
 const localDateTime=d=>{const p=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);return p.replace(' ','T')};
 const errorText=e=>e instanceof Error?e.message:'Verbindung fehlgeschlagen';
 const notify=(msg)=>{toast(msg);const status=document.querySelector('#cloudStatus');if(status)status.textContent=msg};
 const loggedChild=()=>state.role==='cloudflare-child'&&!!childToken;
 const loggedTeacher=()=>state.role==='cloudflare-admin'&&!!adminToken;
 async function refreshUnreadBadge(){
   if(!loggedChild()||!window.LernSafariExtras?.setIndicator)return;
   try{
     const data=await call('/messages');
     if(loggedChild()&&data.available===true)window.LernSafariExtras.setIndicator(data.messages||[]);
   }catch(_){const badge=document.getElementById('mailIndicator');if(badge)badge.hidden=true}
 }


 async function call(path,{method='GET',body,admin=false,token}={}){
  if(!API()||!/^https:\/\//.test(API()))throw Error('Cloudflare-Adresse fehlt oder ist nicht HTTPS.');
  const headers={'Accept':'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  const t=token!==undefined?token:(admin?adminToken:childToken);
  if(t){if(admin)headers['X-Safari-Admin']=t;else headers.Authorization='Bearer '+t;}
  let res;
  try{res=await fetch(API()+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});}catch(_){throw Error('Cloudflare nicht erreichbar. Prüfe Internet und die erlaubte GitHub-Domain (CORS).')}
  let data;try{data=await res.json()}catch(_){throw Error('Der Server hat keine gültige Antwort gesendet.')}
  if(!res.ok)throw Error(String(data.error||`Serverfehler (${res.status})`).slice(0,240));
  return data;
 }
 async function childLogin(username,password){
  if(pending)return;pending=true;
  try{
   if(!username.trim()||!password)throw Error('Bitte Benutzername und Passwort eingeben.');
   notify('Anmeldung wird geprüft …');
   const response=await call('/login',{method:'POST',body:{username:username.trim(),password}});
   if(typeof response.token!=='string'||!response.token)throw Error('Cloudflare hat kein gültiges Sitzungstoken geliefert.');
   // Check role server-side before granting a personal area.
   const identity=await call('/me',{token:response.token});
   if(!['child','class'].includes(identity.role))throw Error('Dieses Konto ist kein Kinder- oder Klassenkonto.');
   childToken=response.token;person=identity;
   try{localStorage.setItem(CHILD_KEY,childToken)}catch(_){/* browser storage unavailable */}
   document.querySelector('#password').value='';
   enter('cloudflare-child',String(identity.username||response.username||username));
   setTimeout(refreshUnreadBadge,950);
  }catch(e){notify('Anmeldung fehlgeschlagen: '+errorText(e));}
  finally{pending=false}
 }
 async function adminLogin(code){
  if(pending)return;pending=true;
  try{
   if(!code)throw Error('Bitte den bestehenden Cloudflare-Admincode eingeben.');
   notify('Adminzugang wird von Cloudflare geprüft …');
   const result=await call('/admin-unlock',{method:'POST',body:{password:code}});
   if(!result?.token)throw Error('Cloudflare hat keinen Adminzugang erteilt.');
   await call('/admin-session',{admin:true,token:result.token});
   adminToken=result.token;try{sessionStorage.setItem(ADMIN_KEY,adminToken)}catch(_){/* just this tab */}
   const legacyDialog=document.querySelector('#teacherDialog');if(legacyDialog)legacyDialog.hidden=true;
   enter('cloudflare-admin','Flamingo');
   setTimeout(()=>{if(loggedTeacher()&&state.screen==='camp')showModal('admin')},760);
  }catch(e){const el=document.querySelector('#teacherError');if(el)el.textContent=errorText(e);notify('Admin-Anmeldung fehlgeschlagen.');}
  finally{pending=false}
 }
 async function signOut(){
  if(childToken){try{await call('/logout',{method:'POST',body:{}})}catch(_){/* invalidate locally anyway */}}
  childToken='';person=null;adminToken='';plan=null;adminData=null;
  try{sessionStorage.removeItem(CHILD_KEY);localStorage.removeItem(CHILD_KEY);sessionStorage.removeItem(ADMIN_KEY)}catch(_){}
 }
 async function restore(){
  try{childToken=localStorage.getItem(CHILD_KEY)||sessionStorage.getItem(CHILD_KEY)||'';adminToken=sessionStorage.getItem(ADMIN_KEY)||'';if(childToken)localStorage.setItem(CHILD_KEY,childToken);sessionStorage.removeItem(CHILD_KEY)}catch(_){childToken='';adminToken=''}
  if(adminToken){
   try{await call('/admin-session',{admin:true});enter('cloudflare-admin','Flamingo');return}
   catch(_){adminToken='';try{sessionStorage.removeItem(ADMIN_KEY)}catch(_){}}
  }
  if(childToken){
   try{const identity=await call('/me');if(!['child','class'].includes(identity.role))throw Error('Unzulässige Rolle');person=identity;enter('cloudflare-child',String(identity.username||'Tierkonto'));setTimeout(refreshUnreadBadge,950);return}
   catch(_){childToken='';try{sessionStorage.removeItem(CHILD_KEY);localStorage.removeItem(CHILD_KEY)}catch(_){}}
  }
 }
 const originalRender=renderModal;
 renderModal=function(){
   if(state.modal==='logbook'&&loggedChild()){renderChildLogbook();return;}
   if(state.modal==='admin'&&loggedTeacher()){renderCloudAdmin();return;}
   if(state.modal==='agenda'&&(loggedChild()||loggedTeacher())){renderCloudAgenda();return;}
   if(state.modal==='mail'&&loggedChild()){renderCloudMail(originalRender);return;}
   originalRender();
 };


 // The mailbox is enabled only after the existing Cloudflare Worker confirms
 // an authenticated, child-filtered GET /messages endpoint.
 async function renderCloudMail(){
   const host=DOM.modalBody;
   if(!window.LernSafariExtras){host.innerHTML='<div class="pd-panel">Nachrichtenansicht konnte nicht geladen werden.</div>';return}
   await window.LernSafariExtras.mailbox({host,call});
 }
 // Cloudflare contains authentic results; an attempt/highscore is not proof of a finished assignment.
 const scoreIndex=rows=>{const scores=new Map();for(const row of Array.isArray(rows)?rows:[]){if(!row||typeof row.game!=='string'||!row.game)continue;const value=Number(row.score);if(!Number.isFinite(value)||value<0)continue;scores.set(row.game,Math.max(scores.get(row.game)??0,value));}return scores;};
 const taskScore=(target,scores)=>target.startsWith('game:')?scores.get(target.slice(5)):undefined;
 const scoreText=(value)=>Number.isFinite(value)?`⭐ Bester Punktestand: ${Math.max(0,Math.floor(value))}`:'Noch kein gespeicherter Highscore';
 const safeCounts=rows=>Array.isArray(rows)?rows:[];
 const recentAttemptCount=(attempts,username)=>safeCounts(attempts).filter(x=>x.username===username).length;
 async function renderAdminProgress(){
   const panel=DOM.modalBody.querySelector('#cloudProgressPanel');if(!panel||!loggedTeacher())return;
   panel.innerHTML='<p role="status">Spielergebnisse werden aus Cloudflare geladen …</p>';
   try{
     const data=await call('/admin-report',{admin:true});
     if(!loggedTeacher()||!panel.isConnected)return;
     const students=safeCounts(data.students), attempts=safeCounts(data.attempts), highs=safeCounts(data.highscores);
     // A learner may have multiple score entries; count different games, not rows.
     const rows=students.map(u=>{
       const name=String(u.username||'');
       const ownScores=highs.filter(x=>x.username===name);
       const games=new Set(ownScores.map(x=>String(x.game||''))).size;
       const attemptsTotal=recentAttemptCount(attempts,name);
       const correct=attempts.filter(x=>x.username===name&&(x.is_correct===true||x.is_correct===1||x.is_correct==='1')).length;
       return {name,games,attemptsTotal,correct};
     });
     panel.innerHTML=`<div class="cloud-panel-head"><h4>🎯 Lernfortschritt aus Spielen</h4><button type="button" class="pd-secondary" id="cloudReloadResults">Aktualisieren</button></div><p class="cloud-progress-intro">Die Übersicht zeigt gespeicherte Lernversuche und Bestwerte. Ein Lernversuch ist keine abgeschlossene Pflichtaufgabe.</p><div class="cloud-progress-table" role="table" aria-label="Spielergebnisse pro Tierkonto"><div class="cloud-progress-row cloud-progress-header" role="row"><span role="columnheader">Tierkonto</span><span role="columnheader">Spiele mit Highscore</span><span role="columnheader">Lernversuche</span><span role="columnheader">Davon richtig</span></div>${rows.map(r=>`<div class="cloud-progress-row" role="row"><strong role="cell">${html(r.name)}</strong><span role="cell">${r.games}</span><span role="cell">${r.attemptsTotal}</span><span role="cell">${r.correct}</span></div>`).join('')}</div>${rows.length?'':'<p>Noch keine Tierkonten im Klassenbericht.</p>'}<p class="pd-warning">Detaillierte Antworten und zeitliche Verläufe findest du weiterhin im bestehenden Klassenbericht unter «Erweiterte Cloudflare-Verwaltung öffnen».</p>`;
     panel.querySelector('#cloudReloadResults')?.addEventListener('click',renderAdminProgress);
   }catch(e){if(panel.isConnected){panel.innerHTML=`<h4>🎯 Lernfortschritt</h4><p>${html(errorText(e))}</p><button type="button" class="pd-secondary" id="cloudRetryResults">Erneut laden</button>`;panel.querySelector('#cloudRetryResults')?.addEventListener('click',renderAdminProgress);}}
 }
 const STEP_LABELS={word:'Zahl als Wort',parity:'Gerade oder ungerade?',place:'Stellentafel mit Punkten',decomp:'Zerlegung',art:'Hunderter, Zehner und Einer',line:'Zahlenstrahl'};
 function targetName(target){
  if(target.startsWith('game:'))return safeGame(target.slice(5))?.title||target.slice(5).replace(/-/g,' ');
  if(target.startsWith('daily:'))return `Tagesaufgabe ${Number(target.slice(6))+1}`;
  if(target.startsWith('number:'))return `Zahl des Tages · ${STEP_LABELS[target.slice(7)]||target.slice(7)}`;
  if(target==='page:tiere')return 'Tierwelt';if(target==='page:advent')return 'Adventskalender';
  if(target==='page:aufgaben')return 'Aufgaben des Tages';
  if(target==='page:agenda')return 'Agenda';if(target==='page:lernportale')return 'Lernportale';
  return target;
 }
 function openTarget(target){
  closeModal(true);
  if(target.startsWith('game:')){
   let game=safeGame(target.slice(5));
   if(!game){const filename=target.slice(5)+'.html';for(const [subject,topics] of Object.entries(window.LernSafariTopicCatalog||{})){for(const topic of topics){const item=(topic.games||[]).find(x=>x[1]===filename);if(item){game={file:filename,title:item[0],subject};break;}}if(game)break;}}
   if(!game){notify('Dieses Lernspiel ist im neuen Katalog noch nicht vorhanden.');return;}
   window.LernSafariTrackVisit?.(game.subject==='Allgemein'?'oasis':'lagoon',game.file.replace(/\.html$/,''));
   if(game.subject==='Allgemein'){travelTo('oasis');originalFrame('original/spiele/'+encodeURIComponent(game.file),game.title,{areaId:'oasis',contextLabel:'Freie Angebote'});return;}
   travelTo('lagoon');safariSubject=game.subject;safariGame=game;safariGameOrigin=game.subject;renderLagoon();return;
  }
  if(target.startsWith('daily:')||target.startsWith('number:')||target==='page:aufgaben'){
   travelTo('valley');const frame=document.querySelector('#originalGameFrame');
   if(frame&&(target.startsWith('daily:')||target.startsWith('number:')))frame.addEventListener('load',()=>{
    try{const id=target.startsWith('daily:')?'#exercise-'+Number(target.slice(6)):`[data-step="${CSS.escape(target.slice(7))}"]`;
     frame.contentDocument.querySelector(id)?.scrollIntoView({block:'center'});}catch(_){}
   },{once:true});return;
  }
  if(target==='page:tiere'){travelTo('baobab');originalFrame('original/index.html#tiere','Unsere Klassentiere',{areaId:'baobab',contextLabel:'Tierwelt'});return}
  if(target==='page:advent'){travelTo('baobab');originalFrame('original/index.html#advent','Adventskalender',{areaId:'baobab'});return}
  if(target==='page:agenda'){showModal('agenda');return}
  if(target==='page:oasis'){travelTo('oasis');return}
  notify('Für diesen Auftrag bitte die entsprechende Seite über die Karte öffnen.');
 }
 async function renderChildLogbook(){
   const host=DOM.modalBody;
   host.innerHTML='<div class="pd-panel">📖 Dein Logbuch wird aus Cloudflare geladen …</div>';
   try{
     const [p,highscores,post]=await Promise.all([
       call('/learning-plan'),
       call('/highscores').catch(()=>({highscores:[]})),
       call('/messages').catch(()=>({available:false,messages:[]}))
     ]);
     if(!loggedChild()||state.modal!=='logbook')return;
     plan=p;
     if(!window.LernSafariExtras)throw Error('Logbuchansicht nicht geladen');
     window.LernSafariExtras.logbook({
       host,plan:p,highscores,messages:post.available===true?post.messages:[],call,
       onOpen:target=>openTarget(String(target||'')),
       onDone:(id,completed)=>call('/assignment-done',{method:'POST',body:{id,completed}}),
       onRefresh:renderChildLogbook
     });
   }catch(e){
     if(state.modal!=='logbook')return;
     host.innerHTML='<div class="pd-panel"><h3>Logbuch konnte nicht geladen werden</h3><p>'+html(errorText(e))+'</p><button type="button" class="pd-action" id="retryCloudLogbook">Nochmals versuchen</button></div>';
     host.querySelector('#retryCloudLogbook')?.addEventListener('click',renderChildLogbook);
   }
 }
 const BASIC_TARGETS=[...Array.from({length:4},(_,i)=>({v:'daily:'+i,label:`Heute · Tagesaufgabe ${i+1}`})),...Object.entries(STEP_LABELS).map(([id,label])=>({v:'number:'+id,label:'Zahl des Tages · '+label})),{v:'page:tiere',label:'Tierwelt'},{v:'page:aufgaben',label:'Aufgaben des Tages'},{v:'page:agenda',label:'Agenda'},{v:'page:advent',label:'Adventskalender'}];
 function targets(){return [...BASIC_TARGETS,...Object.entries(ORIGINAL_GAMES).flatMap(([subject,items])=>items.map(g=>({v:'game:'+g.file.replace(/\.html$/,''),label:subject+' · '+g.title})))].sort((a,b)=>a.label.localeCompare(b.label,'de-CH'))}
 function selectOptions(items,field='v',label='label'){return items.map(i=>`<option value="${html(i[field])}">${html(i[label])}</option>`).join('')}
 // Legacy cloud mode must be switched off once via the existing protected API.
 // No UI, poller, or student-triggered writes are involved in this cleanup.
 async function retireFormerClassroomMode(){
  if(oldClassroomModeRetired)return;
  try{
   const current=await call('/admin-classroom-mode',{admin:true});
   if(current?.available!==true||!current.classroomMode)throw Error('Cloudflare-Unterrichtsmodus nicht erreichbar.');
   if(current.classroomMode.kind!=='free'){
    const expires_at=new Date(Date.now()+3*60*60*1000).toISOString();
    const saved=await call('/admin-classroom-mode',{admin:true,method:'POST',body:{
     kind:'free',subject:null,required_assignment_ids:[],require_verified:true,expires_at
    }});
    if(saved?.classroomMode?.kind!=='free')throw Error('Die Freigabe wurde nicht bestätigt.');
   }
   oldClassroomModeRetired=true;oldClassroomRetirementError='';
  }catch(err){
   oldClassroomRetirementError='Alte Unterrichtssperren konnten auf Cloudflare nicht automatisch aufgehoben werden. Bitte den Worker kontrollieren.';
   console.warn('LernSafari: alte Modus-Einstellung noch nicht überprüft:',errorText(err));
  }
 }
 async function renderCloudAdmin(){
  if(!loggedTeacher())return;
  const host=DOM.modalBody;
  host.innerHTML='<div class="pd-panel"><h3>🛠️ Cloudflare-Verwaltung</h3><p>Verwaltungsdaten werden geladen …</p></div>';
  try{
   if(!oldClassroomModeRetired)await retireFormerClassroomMode();
   const report=await call('/admin-learning',{admin:true});if(!loggedTeacher()||state.modal!=='admin')return;
   adminData=report;
   // Old class_focus_rules may still block saving game attempts on the Worker.
   // Clear only current/future restrictions, leave expired history untouched.
   if(!obsoleteFocusRulesCleared){
    const ids=(Array.isArray(report.rules)?report.rules:[])
      .filter(rule=>Date.parse(rule.end_at||'')>Date.now())
      .map(rule=>Number(rule.id))
      .filter(id=>Number.isSafeInteger(id)&&id>0);
    try{
     for(const id of ids)await call('/admin-focus-rules',{admin:true,method:'DELETE',body:{id}});
     obsoleteFocusRulesCleared=true;
     if(ids.length)report.rules=(report.rules||[]).filter(rule=>!ids.includes(Number(rule.id)));
    }catch(err){
     oldClassroomRetirementError+=(oldClassroomRetirementError?' ':'')+
      'Alte Fokus-Sperren konnten noch nicht vollständig aufgehoben werden.';
     console.warn('LernSafari: Alte Fokus-Sperren noch vorhanden:',errorText(err));
    }
   }
   const kids=Array.isArray(report.students)?report.students:[];
   const jobs=Array.isArray(report.assignments)?report.assignments:[];
   const pres=Array.isArray(report.presence)?report.presence:[];
   const done=Array.isArray(report.done)?report.done:[];
   const now=new Date(),later=new Date(now.getTime()+7*86400000);
   host.innerHTML=`<div class="pd-shell cloud-shell"><div class="pd-banner"><div><span class="pd-eyebrow">🔐 Cloudflare · Lehrperson</span><h3>Verwaltung 🛠️</h3><p>Die Aufträge werden in deiner bestehenden Cloudflare-Verwaltung gespeichert.</p></div><div class="pd-total"><strong>${kids.length}</strong><span>Tierkonten</span></div></div><section class="pd-panel"><h4>Neuen Lernauftrag zuweisen</h4><form id="cloudAssignmentForm" class="pd-form"><label>Aufgabe oder Lernspiel<select name="target" required>${selectOptions(targets())}</select></label><label>Titel<input name="title" maxlength="110" placeholder="z. B. Die 6er-Reihe üben" required></label><div class="cloud-form-grid"><label>Art<select name="kind"><option value="pflicht">Pflichtaufgabe</option><option value="zusatz">Zusatzaufgabe</option></select></label><label>Für wen?<select name="audience"><option value="all">Ganze Klasse</option><option value="child">Ein Kind</option></select></label></div><label id="cloudChildWrap" hidden>Tierkonto<select name="username">${selectOptions(kids,'username','username')}</select></label><div class="cloud-form-grid"><label>Beginn<input type="datetime-local" name="start" value="${html(localDateTime(now))}" required></label><label>Ende<input type="datetime-local" name="end" value="${html(localDateTime(later))}" required></label></div><button type="submit" class="pd-action">Auftrag in Cloudflare speichern</button><p role="status" id="cloudAdminMessage"></p></form></section><section class="pd-panel"><div class="cloud-panel-head"><h4>Geplante Aufträge (${jobs.length})</h4><button class="pd-secondary" id="cloudRefreshAdmin">Aktualisieren</button></div><div class="pd-items">${jobs.length?jobs.map(a=>{const c=done.filter(d=>Number(d.assignment_id)===Number(a.id)).length;return `<article class="pd-task"><div class="pd-task-head"><span>📌</span><div><strong>${html(a.title)}</strong><small>${html(targetName(String(a.target||'')))} · ${a.audience==='all'?'Ganze Klasse':html(a.username)}</small><small>${html(dateFormat(a.start_at))} – ${html(dateFormat(a.end_at))} · ${c} Erledigt-Häkchen</small></div></div><div class="pd-task-actions"><button class="pd-secondary" data-cloud-edit="${html(a.id)}">Bearbeiten</button><button class="pd-secondary" data-cloud-remove="${html(a.id)}">Löschen</button></div></article>`}).join(''):'Noch keine Aufträge geplant.'}</div></section><section class="pd-panel" id="cloudProgressPanel"><h4>🎯 Lernfortschritt aus Spielen</h4><button type="button" class="pd-secondary" id="cloudLoadResults">Spielergebnisse laden</button><p>Gespeicherte Lernversuche und Highscores für jedes Tierkonto. Wird nur für angemeldete Lehrpersonen abgerufen.</p></section><section class="pd-panel"><h4>Aktivität</h4><p>${pres.length} aktive Konten gemäss Cloudflare. Hier werden bewusst keine umfangreichen individuellen Daten veröffentlicht.</p><button type="button" class="pd-secondary" id="cloudOpenLegacy">Erweiterte Cloudflare-Verwaltung öffnen</button><p class="pd-warning">Die ausführliche bisherige Verwaltung enthält Lernsteuerung, Fokus-Modus, Agenda, Klassenbericht und weitere Funktionen. Sie wird unverändert weiterverwendet.</p></section></div>`;
   if(oldClassroomRetirementError){
    const banner=host.querySelector('.pd-banner');
    const caution=document.createElement('p');caution.className='pd-warning';caution.setAttribute('role','alert');
    caution.textContent=oldClassroomRetirementError;banner?.append(caution);
   }
   // Teacher-only features use the existing authenticated admin session.
   if(window.LernSafariExtras){
     const messageMount=document.createElement('div');
     messageMount.id='cloudTeacherPostMount';
     const progress=host.querySelector('#cloudProgressPanel');
     if(progress)progress.insertAdjacentElement('beforebegin',messageMount);
     else host.appendChild(messageMount);
     window.LernSafariExtras.adminPanel({host:messageMount,call,kids});
   }
   if(window.LernSafariProjects){
     const projectMount=document.createElement('div');
     projectMount.id='cloudTeacherProjectsMount';
     const before=host.querySelector('#cloudProgressPanel');
     if(before)before.insertAdjacentElement('beforebegin',projectMount);
     else host.appendChild(projectMount);
     window.LernSafariProjects.adminMount({mount:projectMount,call});
   }
   // Explicit teacher verification is available only when the upgraded Worker
   // includes a server-confirmed verified list. Legacy Worker: never fake approval.
   if(Array.isArray(report.verified)){
    const verified=new Set(report.verified.map(v=>String(v.username)+'|'+Number(v.assignment_id)));
    const submitted=new Set(done.map(v=>String(v.username)+'|'+Number(v.assignment_id)));
    const activeJobs=jobs.filter(a=>a.kind==='pflicht'&&Date.parse(a.start_at)<=Date.now()&&Date.parse(a.end_at)>Date.now());
    const candidates=[];
    for(const task of activeJobs){
     for(const person of kids){
      if(task.audience==='child'&&task.username!==person.username)continue;
      const code=String(person.username)+'|'+Number(task.id);
      if(submitted.has(code)||verified.has(code)){
       candidates.push({username:person.username,task,code,isVerified:verified.has(code),isSubmitted:submitted.has(code)});
      }
     }
    }
    const verificationPanel=document.createElement('section');
    verificationPanel.className='pd-panel';
    verificationPanel.id='cloudTeacherVerification';
    verificationPanel.innerHTML=`<h4>✅ Pflichtaufträge überprüfen</h4><p>«Erledigt» ist die Rückmeldung des Kindes. Erst deine Bestätigung zählt als überprüfte Erledigung für den Unterrichtsmodus.</p>
      <div class="pd-items">${candidates.slice(0,100).map((c,i)=>`<article class="pd-task">
        <div class="pd-task-head"><span>${c.isVerified?'✅':'📝'}</span><div>
        <strong>${html(c.username)} · ${html(c.task.title)}</strong>
        <small>${c.isSubmitted?'Vom Kind als erledigt markiert':'Von der Lehrperson bereits bestätigt'}</small>
        </div><span class="pd-task-status">${c.isVerified?'Überprüft':'Zu überprüfen'}</span></div>
        <div class="pd-task-actions"><button type="button" class="pd-secondary" data-cloud-verify="${i}" aria-label="${c.isVerified?'Bestätigung zurücknehmen':'Auftrag bestätigen'}: ${html(c.username)}">${c.isVerified?'Bestätigung zurücknehmen':'✅ Als überprüft bestätigen'}</button></div>
        </article>`).join('')||'<p>Derzeit keine vom Kind als erledigt markierten Pflichtaufträge zur Überprüfung.</p>'}</div>
        ${candidates.length>100?'<p>Die ersten 100 Einträge werden angezeigt. Weitere folgen in der Klassenübersicht.</p>':''}
        <p id="cloudVerifyStatus" role="status"></p>`;
    const progressPanel=host.querySelector('#cloudProgressPanel');
    if(progressPanel)progressPanel.insertAdjacentElement('beforebegin',verificationPanel);
    verificationPanel.querySelectorAll('[data-cloud-verify]').forEach(button=>button.onclick=async()=>{
     const c=candidates[Number(button.dataset.cloudVerify)];
     if(!c||!loggedTeacher())return;
     const output=verificationPanel.querySelector('#cloudVerifyStatus');button.disabled=true;
     try{
      await call('/admin-verify-assignment',{admin:true,method:'POST',body:{username:c.username,assignment_id:Number(c.task.id),verified:!c.isVerified}});
      output.textContent='✅ Bestätigung in Cloudflare gespeichert.';
      await renderCloudAdmin();
     }catch(err){output.textContent='Konnte nicht gespeichert werden: '+errorText(err);button.disabled=false;}
    });
   }

   // Admin-only password lockout recovery: available only with upgraded Worker.
   // The worker checks the admin session again for every reset.
   if(Array.isArray(report.loginLocks)){
    const entries=report.loginLocks.filter(x=>x&&Number(x.attempts)>=6&&x.lockedUntil&&Date.parse(x.lockedUntil)>Date.now());
    const lockPanel=document.createElement('section');
    lockPanel.className='pd-panel';
    lockPanel.id='cloudLoginLocks';
    lockPanel.innerHTML=`<h4>🔓 Anmeldesperren aufheben</h4>
      <p>Nach sechs falschen Passworteingaben wird ein Tierkonto vorübergehend für 15 Minuten gesperrt. Du kannst es nach persönlicher Prüfung frühzeitig entsperren. Das Passwort bleibt gleich.</p>
      <div class="pd-items">${entries.length?entries.map((x,i)=>`<article class="pd-task">
        <div class="pd-task-head"><span>🔒</span><div><strong>${html(x.username)}</strong>
        <small>${Number(x.attempts)} fehlgeschlagene Versuche · gesperrt bis ${html(new Date(x.lockedUntil).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Zurich'}))}</small></div></div>
        <div class="pd-task-actions"><button type="button" class="pd-secondary" data-cloud-unlock="${i}">🔓 Entsperren</button></div>
        </article>`).join(''):'<p>Aktuell ist kein Tierkonto wegen zu vieler Passwortversuche gesperrt.</p>'}</div>
      <p id="cloudLoginUnlockStatus" role="status"></p>`;
    const before=host.querySelector('#cloudProgressPanel');
    if(before)before.insertAdjacentElement('beforebegin',lockPanel);
    lockPanel.querySelectorAll('[data-cloud-unlock]').forEach(b=>b.onclick=async()=>{
      const chosen=entries[Number(b.dataset.cloudUnlock)];
      if(!chosen||!loggedTeacher()||!confirm('Anmeldesperre für '+chosen.username+' aufheben? Bitte vorher prüfen, ob das Kind selbst die Anmeldung versucht hat.'))return;
      const status=lockPanel.querySelector('#cloudLoginUnlockStatus');
      b.disabled=true;
      try{
       await call('/admin-login-unlock',{admin:true,method:'POST',body:{username:chosen.username}});
       status.textContent='✅ Sperre für '+chosen.username+' aufgehoben. Das Passwort bleibt unverändert.';
       await renderCloudAdmin();
      }catch(err){status.textContent='Entsperren fehlgeschlagen: '+errorText(err);b.disabled=false;}
    });
   }

   host.querySelector('#cloudLoadResults')?.addEventListener('click',renderAdminProgress);
   const form=host.querySelector('#cloudAssignmentForm');form.elements.audience.onchange=()=>{host.querySelector('#cloudChildWrap').hidden=form.elements.audience.value!=='child'};
   form.onsubmit=async e=>{e.preventDefault();const start=new Date(form.elements.start.value),end=new Date(form.elements.end.value);const msg=host.querySelector('#cloudAdminMessage');if(!(end>start)){msg.textContent='Ende muss nach dem Beginn liegen.';return}const payload={id:form.dataset.id?Number(form.dataset.id):undefined,audience:form.elements.audience.value,username:form.elements.audience.value==='child'?form.elements.username.value:'',start_at:start.toISOString(),end_at:end.toISOString(),target:form.elements.target.value,title:form.elements.title.value.trim(),kind:form.elements.kind.value};const submit=form.querySelector('[type=submit]');submit.disabled=true;try{await call('/admin-assignments',{admin:true,method:'POST',body:payload});await renderCloudAdmin();notify('Auftrag in Cloudflare gespeichert.')}catch(err){msg.textContent=errorText(err);submit.disabled=false}};
   host.querySelectorAll('[data-cloud-edit]').forEach(b=>b.onclick=()=>{const a=jobs.find(x=>Number(x.id)===Number(b.dataset.cloudEdit));if(!a)return;form.dataset.id=String(a.id);for(const key of ['target','title','kind','audience','username'])if(form.elements[key])form.elements[key].value=a[key]||'';form.elements.start.value=localDateTime(new Date(a.start_at));form.elements.end.value=localDateTime(new Date(a.end_at));form.elements.audience.onchange();form.querySelector('[type=submit]').textContent='Änderung in Cloudflare speichern';form.scrollIntoView({block:'start',behavior:'smooth'})});
   host.querySelectorAll('[data-cloud-remove]').forEach(b=>b.onclick=async()=>{if(!confirm('Diesen Auftrag wirklich aus Cloudflare löschen?'))return;try{await call('/admin-assignments',{admin:true,method:'DELETE',body:{id:Number(b.dataset.cloudRemove)}});await renderCloudAdmin()}catch(e){notify(errorText(e))}});
   host.querySelector('#cloudRefreshAdmin').onclick=renderCloudAdmin;
   host.querySelector('#cloudOpenLegacy').onclick=()=>{host.innerHTML='<div class="cloud-legacy-header"><button type="button" id="cloudBackAdmin" class="pd-secondary">← Zur Aufgabenverwaltung</button><p>Bestehende Cloudflare-Verwaltung (aus der bisherigen LernSafari)</p></div><iframe class="cloud-admin-frame" title="Bisherige Cloudflare-Verwaltung" src="original/index.html#admin"></iframe>';host.querySelector('#cloudBackAdmin').onclick=renderCloudAdmin};
   // Present the existing authenticated Cloudflare controls as five navigable workspaces.
   // All write actions above retain their server-side checks and existing handlers.
   window.LernSafariAdminDashboard?.mount({host,kids,jobs,pres,done,verified:report.verified||[],targets:targets(),call,renderAdminProgress,renderCloudAdmin});
  }catch(e){host.innerHTML=`<div class="pd-panel"><h3>Verwaltung nicht erreichbar</h3><p>${html(errorText(e))}</p><button class="pd-action" id="retryCloudAdmin">Erneut versuchen</button></div>`;host.querySelector('#retryCloudAdmin').onclick=renderCloudAdmin;}
 }
 function mondayOfZurich(){const day=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Zurich',weekday:'short'}).format(new Date());const idx={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[day]||0;const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const utc=new Date(today+'T12:00:00Z');utc.setUTCDate(utc.getUTCDate()-((idx+6)%7));return utc.toISOString().slice(0,10)}

 const agendaDisplayText=e=>{
  const original=String(e.text||'').trim();
  const type=String(e.type||'special');
  if(type==='special')return original;
  const clean=original.replace(/^(?:HA:\s*|Frei:\s*|LK\s+(?:Deutsch|Englisch|Mathe|Musik|NMG|Sport|Fach)\s*:\s*)/i,'').trim();
  if(type==='ha')return 'HA: '+clean;
  if(type==='lk')return 'LK '+String(e.subject||'Fach')+': '+clean;
  if(type==='free')return 'Frei: '+clean;
  return original;
 };
 let cloudAgendaWeekOffset=0;
 let cloudAgendaRequestNumber=0;
 const agendaWeekStart=offset=>{
   const d=new Date(mondayOfZurich()+'T12:00:00Z');
   d.setUTCDate(d.getUTCDate()+offset*7);
   return d.toISOString().slice(0,10);
 };
 async function renderCloudAgenda(){
   const host=DOM.modalBody;
   const offset=cloudAgendaWeekOffset;
   const requestNumber=++cloudAgendaRequestNumber;
   const week=agendaWeekStart(offset);
   const days=Array.from({length:7},(_,i)=>{
     const d=new Date(week+'T12:00:00Z');
     d.setUTCDate(d.getUTCDate()+i);
     return d.toISOString().slice(0,10);
   });
   const names=['Mo','Di','Mi','Do','Fr','Sa','So'];
   const todayInZurich=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   const weekLabel=dateFormat(week)+' – '+dateFormat(days[6]);
   const away=offset!==0;
   const toolbar='<nav class="cloud-agenda-nav" aria-label="Kalenderwoche wechseln">'+
     '<button type="button" class="cloud-agenda-week-button" id="cloudAgendaPrevious">◀ Letzte Woche</button>'+
     '<div class="cloud-agenda-week-center"><strong>'+html(weekLabel)+'</strong><small>Montag bis Sonntag</small></div>'+
     '<button type="button" class="cloud-agenda-week-button" id="cloudAgendaNext">Nächste Woche ▶</button>'+
     '</nav>'+
     '<div class="cloud-agenda-actions"><button type="button" class="cloud-agenda-today-button" id="cloudAgendaToday" '+(!away?'disabled aria-current="date"':'')+'>Aktuelle Woche</button>'+
     (away?'<p class="cloud-agenda-other-week" role="status">📅 Du schaust gerade '+(offset<0?'eine frühere':'eine spätere')+' Woche an – nicht die aktuelle Woche.</p>':
     '<p class="cloud-agenda-current-week" role="status">✓ Du bist in der aktuellen Woche.</p>')+'</div>';
   host.innerHTML='<div class="pd-shell"><div class="pd-banner"><div><span class="pd-eyebrow">🧭 Wochenagenda</span><h3>'+html(weekLabel)+'</h3><p>Hausaufgaben, Lernkontrollen und Termine</p></div></div>'+
     toolbar+'<div id="cloudAgendaDays" aria-live="polite"><p class="cloud-agenda-loading">Wochentermine werden geladen …</p></div></div>';
   host.querySelector('#cloudAgendaPrevious').onclick=()=>{cloudAgendaWeekOffset--;renderCloudAgenda()};
   host.querySelector('#cloudAgendaNext').onclick=()=>{cloudAgendaWeekOffset++;renderCloudAgenda()};
   host.querySelector('#cloudAgendaToday').onclick=()=>{cloudAgendaWeekOffset=0;renderCloudAgenda()};
   const area=host.querySelector('#cloudAgendaDays');
   try{
     const result=await call((loggedTeacher()?'/admin-agenda':'/agenda')+'?week='+encodeURIComponent(week),{admin:loggedTeacher()});
     if(state.modal!=='agenda'||requestNumber!==cloudAgendaRequestNumber||!area.isConnected)return;
     const events=Array.isArray(result.events)?result.events:[];
     area.innerHTML='<div class="cloud-week">'+days.map((date,i)=>
       '<article class="cloud-day '+(date===todayInZurich?'is-today':'')+'"><h4>'+names[i]+' · '+html(dateFormat(date))+
       (date===todayInZurich?' <span class="cloud-day-today">Heute</span>':'')+'</h4>'+
       events.filter(e=>e.day_date===date).map(e=>'<div class="cloud-event cloud-event-'+(e.type==='ha'?'ha':e.type==='lk'?'lk':e.type==='free'?'free':'special')+'"><strong>'+
          html(e.type==='lk'?'Lernkontrolle':e.type==='ha'?'Hausaufgabe':e.type==='free'?'Schulfrei':'Besonderer Termin')+
          '</strong><p>'+html(agendaDisplayText(e))+'</p></div>').join('')+
       (events.some(e=>e.day_date===date)?'':'<p class="cloud-agenda-no-events">Keine Einträge</p>')+'</article>').join('')+'</div>'+
       (loggedTeacher()?'<p class="pd-warning">Termine bearbeiten: Verwaltung → Agenda</p>':'');
   }catch(e){
     if(requestNumber!==cloudAgendaRequestNumber||!area.isConnected||state.modal!=='agenda')return;
     area.innerHTML='<div class="pd-panel cloud-agenda-error"><h3>Termine konnten nicht geladen werden</h3><p>'+html(errorText(e))+'</p><button type="button" id="cloudAgendaRetry" class="cloud-agenda-today-button">Erneut versuchen</button></div>';
     area.querySelector('#cloudAgendaRetry').onclick=renderCloudAgenda;
   }
 }
 // The former classroom mode and focus gates have been retired.
 // All authenticated learning areas remain accessible; assignments still appear in the logbook.
 // Minimal, authenticated, short-lived presence reports. Never send guest data,
 // answer text, keyboard input, device identifiers or browser location.
 let activityEndpointUnavailable=false;
 async function heartbeat(){
   if(!loggedChild()||document.hidden||activityEndpointUnavailable)return;
   let area='camp',game='';
   if(state.modal==='mail')area='mail';
   else if(state.modal==='agenda')area='agenda';
   else if(state.modal==='logbook')area='logbook';
   else if(state.screen==='destination'){
     area=state.destination||'camp';
     if(safariGame?.file&&/^[a-z0-9-]+\.html$/i.test(safariGame.file)){
       area='game';game=safariGame.file.replace(/\.html$/i,'');
     }
   }
   if(!['camp','map','logbook','lagoon','valley','baobab','oasis','agenda','mail','help','game'].includes(area))area='camp';
   try{await call('/activity-heartbeat',{method:'POST',body:{area,game}});}
   catch(err){if(/404|405|Not Found|not found|Methode nicht erlaubt/.test(String(err.message||err)))activityEndpointUnavailable=true;}
 }
 setInterval(heartbeat,45000);
 window.addEventListener('focus',()=>{activityEndpointUnavailable=false;heartbeat()});


 // Existing app.js login placeholder handles submit in bubble phase; intercept for authenticated login.
 document.querySelector('#loginForm').addEventListener('submit',e=>{
   e.preventDefault();e.stopImmediatePropagation();
   const username=document.querySelector('#username').value.trim();
   const password=document.querySelector('#password').value;
   // Same Cloudflare administration password as before; never stored in source.
   if(username.toLocaleLowerCase('de-CH')==='flamingo')adminLogin(password);
   else childLogin(username,password);
 },{capture:true});
 document.querySelector('#logoutBtn').addEventListener('click',e=>{if(!loggedChild()&&!loggedTeacher())return;e.preventDefault();e.stopImmediatePropagation();signOut().finally(()=>exit())},{capture:true});
 restore();
 window.LernSafariCloud={getIdentity:()=>person?.username||null,hasChild:loggedChild,hasAdmin:loggedTeacher,refreshLogbook:renderChildLogbook};
})();