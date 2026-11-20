/* LernSafari Mathplan: genuine server-persisted child ticks and admin overview. */
'use strict';
(function(root){
 const data=root.LernSafariMathPlan;
 if(!data)throw Error('Matheplan-Aufgaben fehlen.');
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
 const sections=data.sections;
 const tasks=data.all;
 const taskMap=new Map(tasks.map(t=>[t.id,t]));
 const legend='<p class="mathplan-legend">Ein Häkchen bedeutet «Ich habe die Aufgabe gemacht». Es ist keine automatische Korrektur.</p>';
 const countDone=(set,list)=>list.filter(x=>set.has(x.id)).length;
 function tableSection(section,done,child){
  return '<section class="mathplan-section"><div class="mathplan-section-title"><h4>'+section.emoji+' '+esc(section.title)+'</h4><span>'+countDone(done,section.tasks)+' / '+section.tasks.length+'</span></div>'+
   '<div class="mathplan-table-wrap"><table class="mathplan-table"><thead><tr><th scope="col">✓</th><th scope="col">LZ</th><th scope="col">Aufgabe</th></tr></thead><tbody>'+
   section.tasks.map(t=>'<tr class="'+(done.has(t.id)?'mathplan-is-done':'')+'" data-math-task="'+esc(t.id)+'"><td><label class="mathplan-check-wrap"><input type="checkbox" data-math-toggle="'+esc(t.id)+'" '+(done.has(t.id)?'checked':'')+(child?'':' disabled')+' aria-label="'+esc(t.text)+' als erledigt markieren"></label></td><td>'+esc(t.lz||'–')+'</td><td><span>'+esc(t.text)+'</span>'+
    (t.detail?.length?'<div class="mathplan-subtasks">'+t.detail.map(x=>'<span>→ '+esc(x)+'</span>').join('')+'</div>':'')+
    (t.file?'<div><button type="button" class="mathplan-play" data-math-open="'+esc(t.file)+'">▶ Spiel öffnen</button></div>':
    t.destination?'<div><button type="button" class="mathplan-play" data-math-open-area="'+esc(t.destination)+'">▶ Oase öffnen</button></div>':'')+
    '</td></tr>').join('')+'</tbody></table></div></section>';
 }
 function bindOpen(host,onOpen){
  host.querySelectorAll('[data-math-open]').forEach(b=>b.onclick=()=>onOpen('game:'+b.dataset.mathOpen.replace(/\.html$/,'')));
  host.querySelectorAll('[data-math-open-area]').forEach(b=>b.onclick=()=>onOpen('page:'+b.dataset.mathOpenArea));
 }
 async function child({host,call,onOpen}){
  host.innerHTML='<div class="pd-panel">📘 Dein Matheplan wird geladen …</div>';
  let response;
  try{
   response=await call('/math-plan');
   if(!host.isConnected||host.closest('.ls-logbook')?.querySelector('[data-logbook-tab="math"]')?.getAttribute('aria-selected')!=='true')return;
   if(response?.available!==true||!Array.isArray(response.completed))throw Error('Die Matheplan-Speicherung ist noch nicht im Cloudflare-Worker aktiviert.');
  }catch(err){
   host.innerHTML='<section class="pd-panel"><h4>📘 Matheplan</h4><p>Deine Aufgaben sind vorbereitet. Das dauerhafte Abhaken wird noch auf Cloudflare eingerichtet. Bis dahin kannst du die Spiele öffnen, aber keine Häkchen speichern.</p><p class="mathplan-error" role="status">'+esc(err.message||err)+'</p>'+sections.map(x=>tableSection(x,new Set(),false)).join('')+'</section>';
   bindOpen(host,onOpen);return;
  }
  const completed=new Set(response.completed.filter(id=>taskMap.has(id)));
  const view=()=>{
   host.innerHTML='<div class="mathplan-overview"><div class="mathplan-progress"><div><h3>📘 Mein Matheplan</h3><p>'+countDone(completed,tasks)+' von '+tasks.length+' Aufgaben erledigt</p></div><progress value="'+countDone(completed,tasks)+'" max="'+tasks.length+'" aria-label="Bearbeitete Aufgaben"></progress></div>'+
    legend+sections.map(x=>tableSection(x,completed,true)).join('')+'</div>';
   bindOpen(host,onOpen);
   host.querySelectorAll('[data-math-toggle]').forEach(input=>input.onchange=async()=>{
    const id=input.dataset.mathToggle,completedNow=input.checked;
    if(!taskMap.has(id))return;
    input.disabled=true;
    try{
     const saved=await call('/math-plan',{method:'POST',body:{taskId:id,completed:completedNow}});
     if(saved?.ok!==true)throw Error('Server konnte das Häkchen nicht speichern.');
     if(completedNow)completed.add(id);else completed.delete(id);
     view();
    }catch(err){
     input.checked=!completedNow;input.disabled=false;
     const notice=document.createElement('p');notice.className='mathplan-error';notice.setAttribute('role','alert');
     notice.textContent='Nicht gespeichert: '+String(err.message||err);
     host.prepend(notice);
    }
   });
  };
  view();
 }
 function adminMount({host,call,kids=[]}){
  host.innerHTML='<div class="pd-panel mathplan-admin"><h4>📊 Matheplan – Klassenübersicht</h4><p>Ein Häkchen zeigt die Selbsteinschätzung der Kinder, keine automatische Kontrolle.</p><div class="mathplan-controls"><label>Ansicht <select id="mathplanAdminView"><option value="class">Gesamte Klasse</option><option value="child">Einzelnes Tier</option></select></label><label id="mathplanAnimalWrap" hidden>Tierkonto <select id="mathplanAdminAnimal"></select></label><button type="button" class="pd-secondary" id="mathplanAdminRefresh">🔄 Jetzt aktualisieren</button></div><div id="mathplanAdminResults" aria-live="polite">Noch keine Abfrage durchgeführt.</div></div>';
  const view=host.querySelector('#mathplanAdminView'),animal=host.querySelector('#mathplanAdminAnimal');
  const wrap=host.querySelector('#mathplanAnimalWrap'),results=host.querySelector('#mathplanAdminResults');
  const reload=host.querySelector('#mathplanAdminRefresh');
  let snapshot=null;
  function draw(){
   if(!snapshot)return;
   const students=Array.isArray(snapshot.students)?snapshot.students:[];
   const completed=new Map(students.map(s=>[s.username,new Set(s.completed||[])]));
   if(view.value==='child'){
    const name=animal.value,saved=completed.get(name)||new Set();
    results.innerHTML='<h5>🐾 '+esc(name)+' · '+countDone(saved,tasks)+' von '+tasks.length+' erledigt</h5>'+
     sections.map(x=>tableSection(x,saved,false)).join('');
    return;
   }
   const names=students.map(x=>x.username);
   results.innerHTML='<div class="mathplan-admin-summary"><strong>'+names.length+' Tierkonten</strong><span>'+tasks.length+' Aufgaben im Matheplan</span></div>'+
    '<div class="mathplan-table-wrap"><table class="mathplan-table mathplan-matrix"><thead><tr><th scope="col">Aufgabe</th><th scope="col">Erledigt</th>'+names.map(name=>'<th scope="col">'+esc(name)+'</th>').join('')+'</tr></thead><tbody>'+
    sections.map(section=>'<tr class="mathplan-matrix-group"><th scope="row" colspan="'+(names.length+2)+'">'+esc(section.title)+'</th></tr>'+
     section.tasks.map(t=>'<tr><th scope="row">'+esc(t.text)+'</th><td>'+names.filter(name=>completed.get(name)?.has(t.id)).length+'/'+names.length+'</td>'+
     names.map(name=>'<td class="'+(completed.get(name)?.has(t.id)?'mathplan-complete':'mathplan-open')+'" aria-label="'+esc(name)+' '+(completed.get(name)?.has(t.id)?'erledigt':'offen')+'">'+(completed.get(name)?.has(t.id)?'✓':'–')+'</td>').join('')+'</tr>').join('')).join('')+'</tbody></table></div>';
  }
  view.onchange=()=>{wrap.hidden=view.value!=='child';draw()};
  animal.onchange=draw;
  reload.onclick=async()=>{
   reload.disabled=true;results.textContent='Klassenübersicht wird geladen …';
   try{
    const response=await call('/admin-math-plan',{admin:true});
    if(response?.available!==true||!Array.isArray(response.students))throw Error('Der Matheplan-Dienst wurde noch nicht im Cloudflare-Worker aktiviert.');
    snapshot=response;
    const options=response.students.map(s=>'<option value="'+esc(s.username)+'">'+esc(s.username)+'</option>').join('');
    const old=animal.value;animal.innerHTML=options;if(response.students.some(s=>s.username===old))animal.value=old;
    draw();
   }catch(err){snapshot=null;results.innerHTML='<p class="mathplan-error" role="alert">Konnte die Übersicht nicht laden: '+esc(err.message||err)+'</p>'}
   finally{reload.disabled=false}
  };
  // Only user-triggered refresh: do not poll student completion in the background.
  // First opening the admin section triggers a single request explicitly via the navigation action.
  return {refresh:()=>reload.click()};
 }
 root.LernSafariMathPlanUI={child,adminMount,tableSection};
})(window);
