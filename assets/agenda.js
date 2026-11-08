 'use strict';
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const WEEK=['Mo','Di','Mi','Do','Fr','Sa','So'];
let pupilMonday=null,adminMonday=null,adminEvents=[];
function zurichToday(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const pick=k=>p.find(x=>x.type===k).value;return `${pick('year')}-${pick('month')}-${pick('day')}`;}
function monday(iso){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10);}
function dateOffset(day,delta){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);}
function label(iso){return new Intl.DateTimeFormat('de-CH',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(iso+'T12:00:00Z'));}
function short(iso){return new Intl.DateTimeFormat('de-CH',{day:'numeric',month:'numeric',timeZone:'UTC'}).format(new Date(iso+'T12:00:00Z'));}
function typeLabel(t,subject,body){return t==='ha'?'HA: '+body:t==='lk'?'LK '+subject+': '+body:t==='free'?'Schulfrei: '+body:body;}
function template(){return `<div class="feature-head"><div><h1>Agenda</h1><p>Hier siehst du unsere Termine und Hausaufgaben.</p></div></div><div class="agenda-top"><div class="agenda-actions"><button type="button" class="feature-button alt" data-shift="-7">← Woche zurück</button><button type="button" class="feature-button pink" data-today>Aktuelle Woche</button><button type="button" class="feature-button alt" data-shift="7">Woche vor →</button></div><div class="agenda-week-title" data-week-label></div></div><p class="agenda-status" data-status role="status"></p><div class="agenda-wrap" data-calendar></div><div class="agenda-key"><span><i style="background:#a9d8fb"></i>Hausaufgaben (HA)</span><span><i style="background:#bceab6"></i>Lernkontrollen (LK)</span><span><i style="background:#f4bad1"></i>Besondere Termine</span><span><i style="background:#f9df73"></i>Schulfrei</span></div>`;}
function hasAdmin(){return window.SafariSite?.isAdminUnlocked()===true;}
function render(host,start,events,admin){
 const days=Array.from({length:7},(_,i)=>dateOffset(start,i)),today=zurichToday();
 host.querySelector('[data-week-label]').textContent=`${label(days[0])} – ${label(days[6])}`;
 const head=days.map((d,i)=>`<th class="${d===today?'today':''}"><span class="agenda-date">${WEEK[i]}</span><span class="agenda-day">${short(d)}</span></th>`).join('');
 const row=part=>`<tr><td class="period-title">${part==='am'?'☀ Vormittag':'☾ Nachmittag'}</td>${days.map(d=>{
  const day=events.filter(x=>x.day_date===d&&x.period===part);
  const blocks=day.map(x=>`<button type="button" class="agenda-event ${esc(x.type)} ${admin?'clickable':''}" ${admin?`data-event-id="${esc(x.id)}" data-event-date="${esc(d)}" data-event-type="${esc(x.type)}" data-event-period="${esc(part)}"`: 'disabled'} title="${admin?'Bearbeiten oder löschen':''}">${esc(typeLabel(x.type,x.subject,x.text))}</button>`).join('');
  let restore='';const dayNo=new Date(d+'T12:00:00Z').getUTCDay();
  if(admin&&part==='am'&&[2,4,5].includes(dayNo)&&!day.some(x=>x.type==='free'||x.type==='ha'))restore=`<button type="button" class="agenda-restore" data-restore="${d}" title="Gelöschte Standard-Hausaufgabe wieder anzeigen">↻ Standard-HA</button>`;
  return `<td class="${d===today?'today':''}">${blocks}${admin?`<button type="button" class="agenda-add" data-date="${d}" data-period="${part}">+ Termin</button>${restore}`:!day.length?'<span class="agenda-placeholder">—</span>':''}</td>`;
 }).join('')}</tr>`;
 host.querySelector('[data-calendar]').innerHTML=`<table class="agenda-table"><thead><tr><th></th>${head}</tr></thead><tbody>${row('am')}${row('pm')}</tbody></table>`;
 if(admin){
  host.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>openModal({day_date:b.dataset.date,period:b.dataset.period,type:'ha',text:'',subject:'Deutsch'}));
  host.querySelectorAll('[data-event-id]').forEach(b=>b.onclick=()=>{
   const id=Number(b.dataset.eventId),type=b.dataset.eventType,date=b.dataset.eventDate;
   const found=adminEvents.find(x=>Number(x.id)===id&&x.type===type&&x.day_date===date&&x.period===b.dataset.eventPeriod);
   if(found)openModal(found);
  });
  host.querySelectorAll('[data-restore]').forEach(b=>b.onclick=async()=>{
   b.disabled=true;
   try{await window.SafariLogin.adminRequest('/admin-agenda','POST',{restoreDefault:b.dataset.restore});load(host,true);}catch(e){host.querySelector('[data-status]').textContent=e.message;b.disabled=false;}
  });
 }
}
function wire(host,admin){host.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{if(admin)adminMonday=dateOffset(adminMonday,Number(b.dataset.shift));else pupilMonday=dateOffset(pupilMonday,Number(b.dataset.shift));load(host,admin);});host.querySelector('[data-today]').onclick=()=>{if(admin)adminMonday=monday(zurichToday());else pupilMonday=monday(zurichToday());load(host,admin);};}
async function load(host,admin){if(!host)return;const m=admin?adminMonday:pupilMonday;host.querySelector('[data-status]').textContent='Lade Termine …';try{
 const data=(admin||(!window.SafariLogin?.auth()&&hasAdmin()))?await window.SafariLogin.adminRequest('/admin-agenda?week='+m):await window.SafariLogin.request('/agenda?week='+m);
 if((admin?adminMonday:pupilMonday)!==m)return;
 if(admin)adminEvents=data.events||[];host.querySelector('[data-status]').textContent='';render(host,m,data.events||[],admin);
}catch(e){host.querySelector('[data-status]').textContent='Termine konnten nicht geladen werden: '+e.message;}}
function showChild(){const host=$('agenda-pupil');if(!host)return;if(!window.SafariLogin?.auth()&&!hasAdmin()){host.innerHTML='<p class="agenda-status">Bitte melde dich an.</p>';return;}if(!pupilMonday)pupilMonday=monday(zurichToday());host.innerHTML=template();wire(host,false);load(host,false);}
function showAdmin(){const host=$('agenda-admin');if(!host)return;if(!adminMonday)adminMonday=monday(zurichToday());host.innerHTML=template();wire(host,true);load(host,true);}
function openModal(event){const dialog=$('agenda-modal'),f=$('agenda-form');dialog.classList.remove('feature-hidden');dialog.hidden=false;
 f.elements.id.value=event.id>0?event.id:'';
 f.elements.originalType.value=event.type||'ha';
 f.elements.defaultDate.value=event.system_default?event.day_date:'';
 f.elements.date.value=event.day_date;f.elements.period.value=event.period;
 f.elements.type.value=event.type||'ha';f.elements.subject.value=event.subject||'Deutsch';f.elements.text.value=event.text||'';
 f.elements.startDate.value=event.start_date||event.day_date;
 f.elements.endDate.value=event.end_date||event.day_date;
 $('agenda-delete').classList.toggle('feature-hidden',!(event.system_default||event.id>0));
 $('agenda-modal-message').textContent='';updateForm();}
function updateForm(){const f=$('agenda-form'),type=f.elements.type.value,isFree=type==='free';
 $('agenda-single-date-wrap').classList.toggle('feature-hidden',isFree);
 $('agenda-range-wrap').classList.toggle('feature-hidden',!isFree);
 $('agenda-subject-wrap').classList.toggle('feature-hidden',type!=='lk');
 $('agenda-prefix').textContent=type==='ha'?'HA:':type==='lk'?'LK Fach:':isFree?'Schulfrei:':'Kein Kürzel';
 f.elements.date.required=!isFree;f.elements.startDate.required=isFree;f.elements.endDate.required=isFree;
}
function closeModal(){const d=$('agenda-modal');d.hidden=true;d.classList.add('feature-hidden');}
async function saveEvent(e){e.preventDefault();const f=$('agenda-form'),el=f.elements;
 const body={id:el.id.value?Number(el.id.value):undefined,date:el.date.value,period:el.period.value,type:el.type.value,subject:el.type.value==='lk'?el.subject.value:'',text:el.text.value.trim(),startDate:el.startDate.value,endDate:el.endDate.value,originalDefaultDate:el.defaultDate.value||undefined};
 if(!body.text){$('agenda-modal-message').textContent='Bitte schreibe einen Termintext.';return;}
 if(body.id&&((el.originalType.value==='free')!==(body.type==='free'))){$('agenda-modal-message').textContent='Bitte diesen Termin zuerst löschen und danach in der anderen Art neu anlegen.';return;}
 if(body.type==='free'&&body.endDate<body.startDate){$('agenda-modal-message').textContent='Das Enddatum muss am oder nach dem Startdatum liegen.';return;}
 // Ein automatisch erzeugter Termin hat keine positive ID: beim Bearbeiten als normalen Termin speichern.
 const b=$('agenda-save');b.disabled=true;
 try{await window.SafariLogin.adminRequest('/admin-agenda','POST',body);closeModal();load($('agenda-admin'),true);}catch(err){$('agenda-modal-message').textContent='Nicht gespeichert: '+err.message;}finally{b.disabled=false;}}
async function deleteEvent(){const f=$('agenda-form'),el=f.elements,id=Number(el.id.value),defaultDate=el.defaultDate.value;
 const body=defaultDate?{defaultDate}:id>0?{id,type:el.originalType.value}:null;if(!body)return;
 const question=defaultDate?'Nur diese Hausaufgabe für diese Woche entfernen?':el.type.value==='free'?'Den ganzen Zeitraum «Schulfrei» löschen?':'Diesen Termin wirklich löschen?';
 if(!window.confirm(question))return;
 const b=$('agenda-delete');b.disabled=true;
 try{await window.SafariLogin.adminRequest('/admin-agenda','DELETE',body);closeModal();load($('agenda-admin'),true);}catch(err){$('agenda-modal-message').textContent='Nicht gelöscht: '+err.message;}finally{b.disabled=false;}}
function init(){const f=$('agenda-form');if(!f)return;f.elements.type.addEventListener('change',updateForm);f.addEventListener('submit',saveEvent);$('agenda-delete').addEventListener('click',deleteEvent);$('agenda-close').addEventListener('click',closeModal);$('agenda-modal').addEventListener('click',e=>{if(e.target===$('agenda-modal'))closeModal();});window.addEventListener('safari-auth-change',()=>{if(!window.SafariLogin?.auth()&&!hasAdmin()&&['#agenda','#advent'].includes(location.hash))location.hash='#aufgaben';updateNav();});updateNav();}
function updateNav(){const allowed=!!window.SafariLogin?.auth()||hasAdmin();for(const id of ['nav-agenda','nav-advent']){const nav=$(id);if(nav){nav.hidden=!allowed;nav.style.display=allowed?'':'none';}}}
window.SafariAgenda={showChild,showAdmin,updateNav};document.addEventListener('DOMContentLoaded',init);
})();
