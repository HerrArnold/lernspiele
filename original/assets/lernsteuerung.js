'use strict';
/* LernSafari: Auftraege, Fokusregeln und datensparsame Online-Anzeige.
   Die Sperre auf GitHub Pages ist eine pädagogische Navigationseinschränkung,
   keine Zugangskontrolle fuer oeffentlich lesbare HTML-Dateien. */
(()=>{
const $=id=>document.getElementById(id);
const onHome=!location.pathname.includes('/spiele/');
const api=()=>String(window.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={schach:'Schach',tiere:'Tierwelt',lernportale:'Lernportale',advent:'Adventskalender','andere-spiele':'Andere Lernspiele'};
const stepLabels={word:'Zahl als Wort',parity:'Gerade oder ungerade?',place:'Stellentafel mit Punkten',decomp:'Zerlegung',art:'Hunderter, Zehner und Einer',line:'Zahlenstrahl'};
let plan={assignments:[],done:[],blocks:[]},report=null,activity='',planPromise=null,refreshing=false,onlineTimer=null,previousPage='',hasUser=false,lastPresence=0;
function token(){try{return localStorage.getItem('lernsafari-token-v1')||'';}catch(_){return '';}}
async function childFetch(path,method='GET',body){if(!token())throw Error('Bitte melde dich an.');const r=await fetch(api()+path,{method,headers:{'content-type':'application/json',Authorization:'Bearer '+token()},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Verbindung fehlgeschlagen');return d;}
async function adminFetch(path,method='GET',body){if(!window.SafariLogin?.adminRequest)throw Error('Admin-Zugang nicht bereit');return window.SafariLogin.adminRequest(path,method,body);}
function account(){return onHome?window.SafariLogin?.auth()?.role==='child':hasUser;}
function slug(url){const match=String(url).match(/(?:^|\/)([a-z0-9-]+)\.html(?:[?#]|$)/);return match?.[1]||'';}
// Unterrichtsmodus und Fokus-Sperren sind abgeschafft.
function notice(msg){let el=$('lernsteuerung-notice');if(!el){el=document.createElement('div');el.id='lernsteuerung-notice';el.className='ls-notice';document.body.append(el);}el.textContent=msg;el.hidden=false;el.setAttribute('role','status');el.onclick=()=>el.hidden=true;}
function fmt(iso){return new Intl.DateTimeFormat('de-CH',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Zurich'}).format(new Date(iso));}
function targetName(v){if(v.startsWith('daily:'))return 'Heute · Andere Tagesaufgabe '+(Number(v.split(':')[1])+1);if(v.startsWith('number:'))return 'Zahl des Tages · '+(stepLabels[v.split(':')[1]]||v);if(v.startsWith('page:'))return {tiere:'Tierwelt',agenda:'Agenda',aufgaben:'Heute',advent:'Adventskalender',lernportale:'Lernportale'}[v.split(':')[1]]||v;return v.replace(/^game:/,'').replace(/-/g,' ');}
function hrefFor(v){if(v.startsWith('game:'))return 'spiele/'+v.slice(5)+'.html';if(v.startsWith('page:'))return '#'+v.slice(5);return '#aufgaben';}
function makeAssignmentLink(a){const h=hrefFor(a.target);return `<a class="ls-task-link" href="${esc(h)}" data-focus-target="${esc(a.target)}">Öffnen ↗</a>`;}
function renderTodo(){const el=$('lernsteuerung-todo');if(!el)return;const nav=$('nav-todo');const logged=!!account();if(nav){nav.hidden=!logged;nav.style.display=logged?'':'none';}
 if(!logged){el.innerHTML='<div class="ls-empty">Melde dich mit deinem Tierkonto an, um deine Aufträge zu sehen.</div>';return;}
 const assignments=plan.assignments||[],done=new Set(plan.done||[]);
 const list=kind=>assignments.filter(a=>a.kind===kind).map(a=>`<div class="ls-assignment ${done.has(a.id)?'ls-finished':''}"><div class="ls-assignment-main"><span class="ls-kind ${kind}">${kind==='pflicht'?'Pflicht':'Zusatz'}</span><h3>${esc(a.title)}</h3><p>${esc(targetName(a.target))} · bis ${esc(fmt(a.end_at))}</p>${makeAssignmentLink(a)}</div><label class="ls-done"><input type="checkbox" data-complete="${a.id}" ${done.has(a.id)?'checked':''}><span>Erledigt</span></label></div>`).join('');
 const count=assignments.filter(a=>done.has(a.id)).length;
 el.innerHTML=`<div class="ls-todo-head"><h2>Deine Aufgaben</h2><span class="ls-counter">${count} von ${assignments.length} erledigt</span></div><p class="ls-lead">Wähle einen Auftrag. Wenn du ihn fertig gelöst hast, setze ein Häkchen.</p><p class="ls-explore-state">Alle Lernbereiche sind frei erreichbar.</p><h3 class="ls-section-title">Pflichtaufgaben</h3>${list('pflicht')||'<div class="ls-empty">Momentan keine Pflichtaufgaben.</div>'}<h3 class="ls-section-title">Zusatzaufgaben</h3>${list('zusatz')||'<div class="ls-empty">Momentan keine Zusatzaufgaben.</div>'}<p class="ls-small">Deine Lösungen werden wie bisher in deinem Lernfortschritt gespeichert. Das Häkchen bedeutet: «Ich bin fertig».</p>`;
 el.querySelectorAll('[data-complete]').forEach(c=>c.onchange=async()=>{const before=new Set(plan.done),id=Number(c.dataset.complete);c.disabled=true;try{await childFetch('/assignment-done','POST',{id,completed:c.checked});if(c.checked)before.add(id);else before.delete(id);plan.done=[...before];renderTodo();}catch(e){notice(e.message);c.disabled=false;c.checked=!c.checked;}});
 el.querySelectorAll('[data-focus-target]').forEach(a=>a.addEventListener('click',()=>{const v=a.dataset.focusTarget;if(!v.startsWith('daily:')&&!v.startsWith('number:'))return;const selector=v.startsWith('daily:')?'#exercise-'+v.split(':')[1]:'[data-step="'+v.split(':')[1]+'"]';setTimeout(()=>document.querySelector(selector)?.scrollIntoView({behavior:'smooth',block:'center'}),180);}));
}
function applyVisualRules(){
 if(!onHome||!account())return;
 document.querySelectorAll('.daily-task[id^="exercise-"]').forEach(el=>{
  const i=Number(el.id.replace('exercise-','')),a=plan.assignments.find(x=>x.target==='daily:'+i);
  el.classList.toggle('ls-assigned-task',!!a);el.classList.toggle('ls-assigned-extra-task',a?.kind==='zusatz');
 });
 document.querySelectorAll('.zdt-task[data-step]').forEach(el=>{
  const a=plan.assignments.find(x=>x.target==='number:'+el.dataset.step);
  el.classList.toggle('ls-assigned-task',!!a);el.classList.toggle('ls-assigned-extra-task',a?.kind==='zusatz');
 });
 document.querySelectorAll('.game-link').forEach(el=>{
  el.classList.remove('ls-blocked','ls-assigned','ls-assigned-zusatz');
  const name=slug(el.getAttribute('href')||'');
  const task=plan.assignments.find(x=>x.target==='game:'+name);
  if(task)el.classList.add(task.kind==='pflicht'?'ls-assigned':'ls-assigned-zusatz');
 });
 document.querySelectorAll('.ls-game-guard').forEach(el=>el.remove());
}
function applyGameGuard(){document.getElementById('ls-game-overlay')?.remove();}
async function refreshPlan(){if(!token()){plan={assignments:[],done:[],blocks:[]};hasUser=false;renderTodo();return;}
 if(refreshing)return;refreshing=true;try{const p=await childFetch('/learning-plan');plan=p;hasUser=true;if(onHome){renderTodo();applyVisualRules();}else applyGameGuard();}catch(e){if(onHome){const el=$('lernsteuerung-todo');if(el&&account())el.innerHTML='<p class="ls-error">Aufträge konnten nicht geladen werden: '+esc(e.message)+'</p>';}hasUser=false;}finally{refreshing=false;}}
function activityText(){if(!onHome){const s=slug(location.pathname);const heading=document.querySelector('h1')?.textContent.trim()||s;const count=document.querySelector('#question-count')?.textContent.trim();return {page:'Lernspiel '+s,activity:(count?heading+' '+count:heading).slice(0,100)};}
 const route=location.hash.replace('#','').split('--')[0]||'aufgaben';if(route==='aufgaben')return {page:'Heute',activity:activity||'Übersicht Heute'};if(route==='tiere'){const animal=$('animal-detail')?.querySelector('h1')?.textContent||'Tierwelt';return {page:'Tierwelt',activity:animal};}if(route==='aktuelle')return {page:'Lernspiele',activity:'Lernspiele auswählen'};if(route==='todo')return {page:'To-Do',activity:'Aufträge anschauen'};return {page:route[0].toUpperCase()+route.slice(1),activity:route};}
function localDateValue(d){const p=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Europe/Zurich'}).formatToParts(d);const g=k=>p.find(v=>v.type===k)?.value;return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;}
function parseLocal(s){const d=new Date(s);if(!Number.isFinite(d.getTime()))throw Error('Datum und Zeit prüfen.');return d.toISOString();}
function toLocal(s){return localDateValue(new Date(s));}
function catalog(){const found=new Map();document.querySelectorAll('.game-link').forEach(a=>{const id=slug(a.getAttribute('href'));if(id)found.set('game:'+id,a.querySelector('.game-name')?.textContent?.trim()||id);});
 const basic=[...Array.from({length:4},(_,i)=>['daily:'+i,'Heute · Andere Tagesaufgabe '+(i+1)]),...Object.entries(stepLabels).map(([id,name])=>['number:'+id,'Zahl des Tages · '+name]),['page:tiere','Tierwelt'],['page:aufgaben','Heute'],['page:agenda','Agenda'],['page:lernportale','Lernportale'],['page:advent','Adventskalender']];
 for(const [v,t] of basic)found.set(v,t);return [...found].sort((a,b)=>a[1].localeCompare(b[1],'de-CH'));}
function adminForm(){const now=new Date(),end=new Date(now.getTime()+7*86400000);return `<div class="ls-admin-top"><h2>Lernsteuerung</h2><p>Erstelle Pflicht- und Zusatzaufgaben, wähle Kinder aus und stelle den Zeitraum ein. Online bedeutet: in den letzten 90 Sekunden aktiv.</p><button class="ls-btn ls-alt" type="button" id="ls-refresh">↻ Aktualisieren</button><p class="ls-admin-message" id="ls-admin-message" role="status"></p></div><div class="ls-admin-two"><form id="ls-assignment-form" class="ls-form"><h3>Auftrag planen</h3><input type="hidden" name="id"><label>Aufgabe oder Spiel<select name="target" required>${catalog().map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('')}</select></label><label>Kurzer Titel<input name="title" maxlength="110" placeholder="Zum Beispiel: 6er-Reihe üben" required></label><div class="ls-fields"><label>Art<select name="kind"><option value="pflicht">Pflicht</option><option value="zusatz">Zusatz</option></select></label><label>Für wen?<select name="audience" data-audience><option value="all">Alle Kinder</option><option value="child">Ein Tierkonto</option></select></label></div><label data-child-wrap hidden>Tierkonto<select name="username" data-user-select></select></label><div class="ls-fields"><label>Von<input name="start" type="datetime-local" value="${localDateValue(now)}" required></label><label>Bis<input name="end" type="datetime-local" value="${localDateValue(end)}" required></label></div><div class="ls-buttons"><button class="ls-btn" type="submit">Auftrag speichern</button><button class="ls-btn ls-alt" type="reset">Neu</button></div></form></div><div class="ls-admin-two"><div class="ls-admin-list"><h3>Geplante Aufträge</h3><div id="ls-assignment-list"></div></div></div></div>`;}
function fillUsers(){document.querySelectorAll('[data-user-select]').forEach(s=>{const chosen=s.value;s.innerHTML=(report?.students||[]).map(u=>`<option value="${esc(u.username)}">${esc(u.username)}</option>`).join('');if(chosen&&[...s.options].some(o=>o.value===chosen))s.value=chosen;});}
function formScope(form){form.querySelectorAll('[data-audience]').forEach(select=>{const upd=()=>form.querySelector('[data-child-wrap]').hidden=select.value!=='child';select.addEventListener('change',upd);upd();});}
function adminMessage(s){const el=$('ls-admin-message');if(el)el.textContent=s;}
function renderAdminLists(){if(!report)return;const now=Date.now();const active=x=>new Date(x.start_at).getTime()<=now&&new Date(x.end_at).getTime()>now;

 const byName=x=>x.audience==='all'?'Ganze Klasse':x.username;
 const done=new Map();(report.done||[]).forEach(x=>{if(!done.has(x.assignment_id))done.set(x.assignment_id,new Set());done.get(x.assignment_id).add(x.username);});
 const jobs=$('ls-assignment-list');if(jobs)jobs.innerHTML=(report.assignments||[]).length?report.assignments.map(a=>{const people=done.get(a.id)||new Set(),count=a.audience==='all'?[...people].filter(n=>report.students.some(u=>u.username===n)).length:(people.has(a.username)?1:0),total=a.audience==='all'?report.students.length:1;return `<div class="ls-record"><div><span class="ls-kind ${a.kind}">${a.kind==='pflicht'?'Pflicht':'Zusatz'}</span><strong>${esc(a.title)}</strong><small>${esc(targetName(a.target))} · ${esc(byName(a))}</small><small>${esc(fmt(a.start_at))} – ${esc(fmt(a.end_at))}</small><small>${active(a)?'● Aktiv · ':''}${count} von ${total} mit Häkchen</small></div><div class="ls-record-actions"><button type="button" data-edit-job="${a.id}">Bearbeiten</button><button type="button" data-delete-job="${a.id}">Löschen</button></div></div>`;}).join(''):'<p class="ls-empty">Noch keine Aufträge geplant.</p>';
 document.querySelectorAll('[data-edit-job]').forEach(b=>b.onclick=()=>{const x=report.assignments.find(x=>x.id===Number(b.dataset.editJob)),f=$('ls-assignment-form');if(!x)return;for(const [k,v] of [['id',x.id],['target',x.target],['title',x.title],['kind',x.kind],['audience',x.audience],['username',x.username],['start',toLocal(x.start_at)],['end',toLocal(x.end_at)]])f.elements[k].value=v;f.querySelector('[data-audience]').dispatchEvent(new Event('change'));f.scrollIntoView({behavior:'smooth'});});
 document.querySelectorAll('[data-delete-job]').forEach(b=>b.onclick=()=>removeAdmin('job',Number(b.dataset.deleteJob)));
}
async function removeAdmin(kind,id){if(kind!=='job')return;if(!confirm('Diesen Auftrag löschen?'))return;try{await adminFetch('/admin-assignments','DELETE',{id});await loadAdmin();}catch(e){adminMessage(e.message);}}
async function loadAdmin(){if(!onHome||!window.SafariSite?.isAdminUnlocked())return;try{report=await adminFetch('/admin-learning');fillUsers();renderAdminLists();adminMessage('Aktualisiert · '+new Intl.DateTimeFormat('de-CH',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Zurich'}).format(new Date()));}catch(e){adminMessage('Nicht geladen: '+e.message);}}
function wireAdmin(){
 const host=$('lernsteuerung-admin');if(!host)return;
 host.innerHTML=adminForm();
 const f=$('ls-assignment-form');
 formScope(f);
 f.addEventListener('reset',()=>setTimeout(()=>{
  f.elements.id.value='';
  f.querySelector('[data-audience]').dispatchEvent(new Event('change'));
 },0));
 f.addEventListener('submit',async e=>{
  e.preventDefault();const el=f.elements;let start,end;
  try{start=parseLocal(el.start.value);end=parseLocal(el.end.value);if(end<=start)throw Error('Das Ende muss nach dem Start liegen.')}
  catch(err){adminMessage(err.message);return;}
  const payload={id:el.id.value?Number(el.id.value):undefined,
   audience:el.audience.value,username:el.audience.value==='child'?el.username.value:'',
   start_at:start,end_at:end,target:el.target.value,title:el.title.value.trim(),kind:el.kind.value};
  const button=f.querySelector('[type=submit]');button.disabled=true;
  try{await adminFetch('/admin-assignments','POST',payload);f.reset();el.id.value='';await loadAdmin();}
  catch(err){adminMessage('Nicht gespeichert: '+err.message);}
  finally{button.disabled=false;}
 });
 $('ls-refresh').onclick=loadAdmin;
}
async function verifyGameUser(){if(!token())return;try{const res=await childFetch('/me');hasUser=res.role==='child';}catch(_){hasUser=false;}}
function init(){if(onHome){wireAdmin();renderTodo();window.addEventListener('safari-auth-change',()=>{refreshPlan();});window.addEventListener('hashchange',()=>{if(location.hash==='#admin')loadAdmin();else if(location.hash==='#todo')refreshPlan();});setTimeout(()=>{refreshPlan();if(location.hash==='#admin')loadAdmin();},500);}else verifyGameUser().then(refreshPlan);}
window.SafariFocus={refresh:refreshPlan,loadAdmin,apply:applyVisualRules};document.addEventListener('DOMContentLoaded',init);
})();
