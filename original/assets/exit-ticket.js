'use strict';
/* LernSafari: Exit-Tickets mit Text oder freier Zeichnung. Speichert nur nach explizitem Klick. */
(()=>{
const $=id=>document.getElementById(id);
const api=()=>String(window.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let children=[],history={tickets:[],responses:[]},activeDraws=new Map();
let adminRefresh=null,childRefresh=null;let dirty=false;
function token(){try{return localStorage.getItem('lernsafari-token-v1')||'';}catch(_){return '';}}
function isChild(){return window.SafariLogin?.auth()?.role==='child'&&!!token();}
function isAdmin(){return !!window.SafariSite?.isAdminUnlocked?.();}
async function childFetch(path,method='GET',body){const r=await fetch(api()+path,{method,headers:{Authorization:'Bearer '+token(),'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Keine Verbindung');return d;}
async function adminFetch(path,method='GET',body){if(!window.SafariLogin?.adminRequest)throw Error('Admin-Anmeldung erforderlich.');return window.SafariLogin.adminRequest(path,method,body);}
function localDateValue(d){const p=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Europe/Zurich'}).formatToParts(d);const g=k=>p.find(v=>v.type===k)?.value;return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;}
function dateLabel(s){return new Intl.DateTimeFormat('de-CH',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Zurich'}).format(new Date(s));}
function dayIso(s){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(s));const f=k=>p.find(x=>x.type===k)?.value;return `${f('year')}-${f('month')}-${f('day')}`;}
function weekday(s){return new Intl.DateTimeFormat('de-CH',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(s+'T12:00:00Z'));}
function monday(s){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
function plainPaths(raw){let x=raw;try{if(typeof x==='string')x=JSON.parse(x);}catch(_){return [];}if(!Array.isArray(x))return [];
 return x.slice(0,35).map(line=>Array.isArray(line)?line.slice(0,150).filter(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isInteger(v)&&v>=0&&v<=1000)):[]).filter(a=>a.length>0);
}
function svgDraw(raw){const paths=plainPaths(raw);if(!paths.length)return '';
 const strings=paths.map(line=>`<polyline points="${line.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#252f39" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
 return `<svg class="ls-exit-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" role="img" aria-label="Zeichnung des Kindes">${strings}</svg>`;
}
function drawCanvas(id,paths){const canvas=$('ls-exit-canvas-'+id);if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fafcfb';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#273640';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
 for(const line of paths){if(!line.length)continue;ctx.beginPath();line.forEach(([x,y],i)=>{const px=x/1000*canvas.width,py=y/1000*canvas.height;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});if(line.length===1){const [x,y]=line[0];ctx.lineTo(x/1000*canvas.width+.1,y/1000*canvas.height+.1);}ctx.stroke();}
}
function attachCanvas(ticket){const id=ticket.id,canvas=$('ls-exit-canvas-'+id),data=activeDraws.get(id);if(!canvas||!data)return;
 drawCanvas(id,data.paths);
 const loc=e=>{const rect=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1000,Math.round((e.clientX-rect.left)/rect.width*1000))),Math.max(0,Math.min(1000,Math.round((e.clientY-rect.top)/rect.height*1000)))];};
 canvas.onpointerdown=e=>{dirty=true;if(data.paths.length>=35||data.paths.reduce((a,b)=>a+b.length,0)>=700)return;canvas.setPointerCapture(e.pointerId);data.drawing=true;data.paths.push([loc(e)]);drawCanvas(id,data.paths);};
 canvas.onpointermove=e=>{if(!data.drawing)return;const line=data.paths[data.paths.length-1];if(line.length>=140||data.paths.reduce((a,b)=>a+b.length,0)>=700){data.drawing=false;return;}const p=loc(e);const last=line[line.length-1];if(Math.abs(p[0]-last[0])+Math.abs(p[1]-last[1])<5)return;line.push(p);drawCanvas(id,data.paths);};
 canvas.onpointerup=canvas.onpointercancel=()=>{data.drawing=false;};
 const undo=$('ls-exit-undo-'+id),clear=$('ls-exit-clear-'+id);
 if(undo)undo.onclick=()=>{dirty=true;data.paths.pop();drawCanvas(id,data.paths);};if(clear)clear.onclick=()=>{dirty=true;data.paths=[];drawCanvas(id,data.paths);};
}
function renderChild(){const root=$('ls-exit-kids');if(!root)return;if(!isChild()){root.innerHTML='';activeDraws.clear();return;}
 if(!children.length){root.innerHTML='';activeDraws.clear();return;}
 root.innerHTML=`<section class="ls-exit-box"><div class="ls-todo-head"><h2>Mein Exit-Ticket</h2><span class="ls-kind pflicht">Zum Abschluss</span></div><p class="ls-lead">Was hast du heute gelernt? Schreibe oder zeichne deine Gedanken. Du darfst auch beides machen.</p>${children.map(t=>{const a=t.response||{},done=!!a.submitted_at;return `<article class="ls-exit-child" data-exit-id="${t.id}"><h3>${esc(t.question)}</h3><p class="ls-small">${done?'Bereits abgegeben · Du darfst deine Antwort nochmals ändern.':'Du kannst bis '+esc(dateLabel(t.end_at))+' abgeben.'}</p><label class="ls-exit-text-label" for="ls-exit-answer-${t.id}">Meine Antwort</label><textarea id="ls-exit-answer-${t.id}" rows="3" maxlength="1000" placeholder="Das habe ich heute gelernt …">${esc(a.answer||'')}</textarea><div class="ls-exit-drawing-head"><strong>Meine Zeichnung</strong><span class="ls-small">Male mit Finger oder Maus.</span></div><canvas id="ls-exit-canvas-${t.id}" class="ls-exit-canvas" width="900" height="300" aria-label="Zeichenfeld"></canvas><div class="ls-buttons"><button class="ls-btn ls-alt" type="button" id="ls-exit-undo-${t.id}">Letzten Strich zurück</button><button class="ls-btn ls-alt" type="button" id="ls-exit-clear-${t.id}">Zeichnung löschen</button><button class="ls-btn" type="button" data-submit-exit="${t.id}">${done?'Änderungen speichern':'Exit-Ticket abgeben'}</button></div><p id="ls-exit-status-${t.id}" class="ls-admin-message" role="status"></p></article>`;}).join('')}</section>`;
 for(const t of children){let data=activeDraws.get(t.id);if(!data){data={paths:plainPaths(t.response?.drawing||'[]'),drawing:false};activeDraws.set(t.id,data);}attachCanvas(t);}
 root.querySelectorAll('textarea').forEach(t=>t.addEventListener('input',()=>{dirty=true;}));
 root.querySelectorAll('[data-submit-exit]').forEach(b=>b.onclick=async()=>{const id=Number(b.dataset.submitExit),data=activeDraws.get(id),answer=$('ls-exit-answer-'+id).value.trim(),status=$('ls-exit-status-'+id);
  if(!answer&&!data.paths.length){status.textContent='Schreibe einen Satz oder zeichne etwas.';return;}b.disabled=true;status.textContent='Wird gespeichert …';try{await childFetch('/exit-ticket-answer','POST',{id,answer,drawing:data.paths});status.textContent='Dein Exit-Ticket ist gespeichert! ✓';dirty=false;b.textContent='Änderungen speichern';}catch(e){status.textContent='Nicht gespeichert: '+e.message;}finally{b.disabled=false;}
 });
}
async function loadChild(){if(dirty&&isChild())return;if(!isChild()){children=[];renderChild();return;}try{const res=await childFetch('/exit-tickets');children=res.tickets||[];for(const id of [...activeDraws.keys()])if(!children.some(t=>t.id===id))activeDraws.delete(id);renderChild();}catch(e){const root=$('ls-exit-kids');if(root)root.innerHTML=`<p class="ls-admin-message">Exit-Tickets konnten nicht geladen werden: ${esc(e.message)}</p>`;}}
function adminForm(){const start=new Date(),end=new Date(Date.now()+30*60000);
 return `<section class="ls-admin-root ls-exit-admin"><h2>Exit-Tickets</h2><p class="ls-lead">Schicke zum Abschluss der Lernphase eine Frage. Die Kinder können einen kurzen Text schreiben oder etwas zeichnen.</p><form class="ls-form" id="ls-exit-form"><input type="hidden" name="id"><label>Meine Frage oder mein Auftrag<textarea name="question" maxlength="400" rows="3" required placeholder="Was hast du heute gelernt? Zeichne oder schreibe dazu."></textarea></label><div class="ls-fields"><label>Für wen?<select name="audience"><option value="all">Ganze Klasse</option><option value="child">Ein Tierkonto</option></select></label><label id="ls-exit-select-wrap" hidden>Tierkonto<select name="username" id="ls-exit-account"></select></label></div><div class="ls-fields"><label>Freigeben ab<input name="start" type="datetime-local" value="${localDateValue(start)}" required></label><label>Abgabe bis<input name="end" type="datetime-local" value="${localDateValue(end)}" required></label></div><div class="ls-buttons"><button class="ls-btn" type="submit">Ticket freischalten</button><button class="ls-btn ls-alt" type="reset">Neue Frage</button></div></form><p class="ls-admin-message" role="status" id="ls-exit-admin-status"></p><section class="ls-admin-list"><h3>Frühere Arbeitsphasen – nach Wochen und Tagen</h3><div id="ls-exit-history"><p class="ls-empty">Wird geladen …</p></div></section></section>`;
}
function updateChildrenSelect(){const el=$('ls-exit-account');if(!el)return;const chosen=el.value;el.innerHTML=(history.students||[]).map(x=>`<option value="${esc(x.username)}">${esc(x.username)}</option>`).join('');if(chosen)el.value=chosen;}
function grouping(){const tickets=history.tickets||[],answers=history.responses||[],root=$('ls-exit-history');if(!root)return;
 if(!tickets.length){root.innerHTML='<p class="ls-empty">Noch keine Exit-Tickets erstellt.</p>';return;}
 const weeks=new Map();for(const t of tickets){const day=dayIso(t.start_at),week=monday(day);if(!weeks.has(week))weeks.set(week,new Map());const days=weeks.get(week);if(!days.has(day))days.set(day,[]);days.get(day).push(t);}
 root.innerHTML=[...weeks.entries()].sort((a,b)=>b[0].localeCompare(a[0])).map(([week,days])=>`<details class="ls-exit-week"><summary>Woche ab ${esc(weekday(week))} · ${[...days.values()].reduce((a,v)=>a+v.length,0)} Ticket(s)</summary>${[...days.entries()].sort((a,b)=>b[0].localeCompare(a[0])).map(([day,records])=>`<details class="ls-exit-day"><summary>${esc(weekday(day))} · ${records.length} Ticket(s)</summary>${records.map(t=>{const people=answers.filter(x=>x.ticket_id===t.id);return `<div class="ls-exit-record"><div class="ls-exit-record-head"><strong>${esc(t.question)}</strong><span>${esc(dateLabel(t.start_at))} – ${esc(dateLabel(t.end_at))}</span><span>${t.audience==='all'?'Ganze Klasse':'Nur '+esc(t.username)} · ${people.length} Abgaben</span><div class="ls-record-actions"><button data-edit-exit="${t.id}" type="button">Bearbeiten</button><button data-delete-exit="${t.id}" type="button">Löschen</button></div></div>${people.length?people.map(p=>`<details class="ls-exit-answer"><summary>${esc(p.username)} · ${esc(dateLabel(p.submitted_at))}</summary>${p.answer?`<p>${esc(p.answer)}</p>`:''}${svgDraw(p.drawing)}</details>`).join(''):'<p class="ls-small">Noch keine Abgaben.</p>'}</div>`;}).join('')}</details>`).join('')}</details>`).join('');
 root.querySelectorAll('[data-edit-exit]').forEach(b=>b.onclick=()=>{const t=tickets.find(t=>t.id===Number(b.dataset.editExit)),f=$('ls-exit-form');if(!t)return;
  f.elements.id.value=t.id;f.elements.question.value=t.question;f.elements.audience.value=t.audience;f.elements.audience.dispatchEvent(new Event('change'));f.elements.username.value=t.username;
  f.elements.start.value=localDateValue(new Date(t.start_at));f.elements.end.value=localDateValue(new Date(t.end_at));f.scrollIntoView({behavior:'smooth',block:'center'});
 });
 root.querySelectorAll('[data-delete-exit]').forEach(b=>b.onclick=async()=>{if(!confirm('Dieses Exit-Ticket und alle dazugehörigen Antworten endgültig löschen?'))return;
  try{await adminFetch('/admin-exit-tickets','DELETE',{id:Number(b.dataset.deleteExit)});await loadAdmin();}catch(e){$('ls-exit-admin-status').textContent=e.message;}
 });
}
async function loadAdmin(){if(!isAdmin())return;try{const [data,people]=await Promise.all([adminFetch('/admin-exit-tickets'),adminFetch('/admin-learning')]);history={...data,students:people.students||[]};updateChildrenSelect();grouping();$('ls-exit-admin-status').textContent='Aktualisiert';}catch(e){$('ls-exit-admin-status').textContent='Nicht geladen: '+e.message;}}
function wire(){const root=$('ls-exit-admin');if(!root)return;root.innerHTML=adminForm();const f=$('ls-exit-form');
 const audience=f.elements.audience;audience.onchange=()=>{$('ls-exit-select-wrap').hidden=audience.value!=='child';};
 f.onreset=()=>setTimeout(()=>{f.elements.id.value='';audience.onchange();},0);
 f.onsubmit=async e=>{e.preventDefault();const z=f.elements,status=$('ls-exit-admin-status');const question=z.question.value.trim(),start=new Date(z.start.value),end=new Date(z.end.value);
  if(!Number.isFinite(+start)||!Number.isFinite(+end)||end<=start){status.textContent='Bitte Start und Ende prüfen.';return;}
  const data={question,audience:z.audience.value,username:z.audience.value==='child'?z.username.value:'',start_at:start.toISOString(),end_at:end.toISOString()};if(z.id.value)data.id=Number(z.id.value);
  const button=f.querySelector('[type=submit]');button.disabled=true;status.textContent='Wird freigeschaltet …';try{await adminFetch('/admin-exit-tickets','POST',data);f.reset();f.elements.id.value='';await loadAdmin();status.textContent='Exit-Ticket gespeichert! ✓';}catch(err){status.textContent='Fehler: '+err.message;}finally{button.disabled=false;}
 };
}
function init(){wire();void loadChild();setTimeout(()=>{if(isAdmin())void loadAdmin();},700);
 window.addEventListener('safari-auth-change',()=>{activeDraws.clear();dirty=false;void loadChild();});window.addEventListener('hashchange',()=>{if(location.hash==='#todo')void loadChild();if(location.hash==='#admin')void loadAdmin();});
 childRefresh=setInterval(()=>{if(location.hash==='#todo'&&document.visibilityState==='visible')void loadChild();},60000);
 adminRefresh=setInterval(()=>{if(isAdmin()&&location.hash==='#admin'&&document.visibilityState==='visible')void loadAdmin();},60000);
}
document.addEventListener('DOMContentLoaded',init);
})();
