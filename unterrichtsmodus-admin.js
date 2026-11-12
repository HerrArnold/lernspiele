/* LernSafari Unterrichtsmodus: teacher UI builder and safe payload preparation.
   No local fake mode state: the Cloudflare Worker is always authoritative. */
'use strict';
(function(root){
 let currentCatalog={};
 const subjects={Mathe:'Mathematik',Deutsch:'Deutsch',NMG:'NMG',Musik:'Musik',Englisch:'Englisch'};
 const arr=x=>Array.isArray(x)?x:[];
 const subjectFor=target=>{
  const id=String(target||'').replace(/^game:/,'');
  const original=Object.entries(currentCatalog).find(([,games])=>arr(games).some(g=>g.file===id+'.html'))?.[0];
  if(original)return original;
  // Newly added games (e.g. Hörverständnisse) are grouped in the newer
  // Lern-Lagune topic catalog, not in the old original-game registry.
  const topics=root.LernSafariTopicCatalog||{};
  for(const [subject,sections] of Object.entries(topics)){
    if(arr(sections).some(section=>arr(section.games).some(game=>Array.isArray(game)&&game[1]===id+'.html')))
      return subject;
  }
  return '';
 };
 function matchingAssignments(assignments,kind,subject,now=Date.now()){
  return arr(assignments).filter(a=>{
   if(!a||a.kind!=='pflicht'||!Number.isSafeInteger(Number(a.id)))return false;
   if(a.start_at&&Date.parse(a.start_at)>now)return false;
   if(a.end_at&&Date.parse(a.end_at)<=now)return false;
   const target=String(a.target||'');
   if(kind==='arrival')return target.startsWith('daily:')||target.startsWith('number:')||target==='page:aufgaben';
   if(kind==='subject')return subjectFor(target)===subject;
   return false;
  });
 }
 function payloadOf({kind,subject,assignmentIds,expiresAt,requireVerified=true}){
  if(!['arrival','subject','free','closed'].includes(kind))throw Error('Unbekannter Unterrichtsmodus');
  if(kind==='subject'&&!subjects[subject])throw Error('Bitte ein gültiges Fach auswählen');
  const active=kind==='arrival'||kind==='subject';
  const ids=[...new Set(arr(assignmentIds).map(Number))];
  if(active&&(!ids.length||ids.some(id=>!Number.isSafeInteger(id)||id<1)))throw Error('Zuerst gültige Pflichtaufträge für diesen Modus zuweisen');
  if(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.now())throw Error('Bitte eine gültige Endzeit in der Zukunft wählen');
  return {kind,subject:kind==='subject'?subject:null,required_assignment_ids:active?ids:[],require_verified:requireVerified,expires_at:new Date(expiresAt).toISOString()};
 }
 function render({mount,assignments,originalGames,fetchMode,saveMode,refreshAssignments}){
  if(!mount)return;
  currentCatalog=originalGames||{};
  mount.innerHTML=`<section class="pd-panel class-mode-panel">
   <h4>🧭 Unterrichtsmodus</h4>
   <p>Steuere, welche Aufgaben die Kinder jetzt bearbeiten dürfen. Änderungen gelten erst, nachdem Cloudflare sie gespeichert hat.</p>
   <p id="classModeStatus" role="status">Unterrichtssteuerung wird geprüft …</p>
   <form id="classModeForm" hidden>
    <div class="admin-mode-picker" role="group" aria-label="Unterrichtsmodus wählen">
      <button type="button" data-mode-kind="arrival"><span>🌅</span><strong>Ankunftszeit</strong><small>Aufgaben des Tages zuerst</small></button>
      <button type="button" data-mode-kind="subject"><span>📚</span><strong>Fachunterricht</strong><small>Nur das gewählte Fach</small></button>
      <button type="button" data-mode-kind="free"><span>🌴</span><strong>Entdeckungszeit</strong><small>Alle Bereiche freigegeben</small></button>
    </div>
    <label class="admin-mode-advanced-label">Aktiver Modus<select name="kind">
     <option value="free">🌴 Entdeckungszeit</option><option value="arrival">🌅 Ankunftszeit</option>
     <option value="subject">📚 Fachunterricht</option><option value="closed">🔒 Geschlossen</option>
    </select></label>
    <label id="classModeSubjectWrap" hidden>Schulfach<select name="subject">${Object.entries(subjects).map(([key,name])=>`<option value="${key}">${name}</option>`).join('')}</select></label>
    <label>Bis wann?<input name="until" type="datetime-local" required></label>
    <p id="classModeAssignments"></p>
    <p class="pd-warning">Aktuell verlangt Cloudflare die Bestätigung der Pflichtaufträge durch die Lehrperson. Eine automatische Freigabe nach tatsächlich gelösten Aufgaben erfordert zusätzlich eine serverseitige Ergebnisprüfung; ein Häkchen des Kindes genügt dafür nicht.</p>
    <button type="submit" class="pd-action">Modus für die Klasse aktivieren</button>
    <button type="button" class="pd-secondary" id="classModeReload">Aktualisieren</button>
   </form>
  </section>`;
  const form=mount.querySelector('#classModeForm'),status=mount.querySelector('#classModeStatus'),subjectWrap=mount.querySelector('#classModeSubjectWrap'),tasks=mount.querySelector('#classModeAssignments');
  const initial=new Date(Date.now()+60*60*1000);const pad=n=>String(n).padStart(2,'0');
  const local=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  form.elements.until.value=local(initial);
  let registered=arr(assignments);
  let selectedKey='';
  let selectedIds=new Set();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  function update(){
   const kind=form.elements.kind.value,subject=form.elements.subject.value;
   subjectWrap.hidden=kind!=='subject';
   mount.querySelectorAll('[data-mode-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modeKind===kind)));
   const found=matchingAssignments(registered,kind,subject);
   if(kind==='arrival'||kind==='subject'){
    const key=kind+'|'+subject;
    if(selectedKey!==key){
      selectedKey=key;
      selectedIds=new Set(found.map(a=>Number(a.id)));
    }
    selectedIds=new Set([...selectedIds].filter(id=>found.some(a=>Number(a.id)===id)));
    tasks.innerHTML=found.length?'<fieldset class="admin-mode-tasks"><legend>Welche Pflichtaufträge gelten während dieses Modus?</legend>'+
      found.map(a=>'<label><input type="checkbox" value="'+Number(a.id)+'" '+(selectedIds.has(Number(a.id))?'checked':'')+'>'+
        '<span><strong>'+esc(a.title)+'</strong><small>'+esc(a.audience==='all'?'Ganze Klasse':a.username||'Einzelnes Kind')+'</small></span></label>').join('')+'</fieldset>':
      '<span class="pd-warning">Keine passenden aktuellen Pflichtaufträge. Weise sie zuerst unter «Lernaufträge» zu.</span>';
    tasks.querySelectorAll('input[type="checkbox"]').forEach(b=>b.onchange=()=>{
      const id=Number(b.value);
      if(b.checked)selectedIds.add(id);else selectedIds.delete(id);
      form.querySelector('[type=submit]').disabled=selectedIds.size===0;
    });
    form.querySelector('[type=submit]').disabled=selectedIds.size===0;
   }else{
    tasks.textContent='Alle Bereiche frei zugänglich – keine Pflichtaufträge notwendig.';
    selectedKey='';
    form.querySelector('[type=submit]').disabled=false;
   }
  }
  async function load(){
   try{
    const data=await fetchMode();
    if(!data||data.available!==true)throw Error('Die Cloudflare-Schnittstelle für Unterrichtsmodi ist noch nicht aktiviert.');
    const mode=data.classroomMode||{kind:'free'};
    form.hidden=false;form.elements.kind.value=['arrival','subject','free','closed'].includes(mode.kind)?mode.kind:'free';
    form.elements.subject.value=subjects[mode.subject]?mode.subject:'Mathe';
    if(mode.expires_at&&Date.parse(mode.expires_at)>Date.now())form.elements.until.value=local(new Date(mode.expires_at));
    status.textContent=`Aktueller Modus: ${form.elements.kind.options[form.elements.kind.selectedIndex].textContent}`;
    selectedKey='';update();
    if(Array.isArray(mode.required_assignment_ids)&&['arrival','subject'].includes(mode.kind)){
      selectedIds=new Set(mode.required_assignment_ids.map(Number));
      selectedKey=form.elements.kind.value+'|'+form.elements.subject.value;
      update();
    }
   }catch(e){form.hidden=true;status.textContent='Noch nicht verfügbar: Die sichere Cloudflare-Steuerung muss zuerst eingerichtet werden. Die bisherigen Fokusregeln bleiben nutzbar.';}
  }
  mount.querySelectorAll('[data-mode-kind]').forEach(b=>b.onclick=()=>{form.elements.kind.value=b.dataset.modeKind;update()});
  form.elements.kind.onchange=update;
  form.elements.subject.onchange=update;
  form.querySelector('#classModeReload').onclick=async()=>{registered=arr(await refreshAssignments());await load()};
  form.onsubmit=async e=>{
   e.preventDefault();
   const btn=form.querySelector('[type=submit]'),kind=form.elements.kind.value,subject=form.elements.subject.value;
   try{
    const selected=matchingAssignments(registered,kind,subject).filter(a=>selectedIds.has(Number(a.id)));
    const payload=payloadOf({kind,subject,assignmentIds:selected.map(a=>a.id),expiresAt:new Date(form.elements.until.value).toISOString()});
    btn.disabled=true;status.textContent='Modus wird von Cloudflare gespeichert …';
    await saveMode(payload);status.textContent='Modus erfolgreich auf Cloudflare gespeichert.';await load();
   }catch(err){status.textContent='Nicht gespeichert: '+String(err.message||err);update()}
   finally{btn.disabled=false;update()}
  };
  load();
 }
 root.LernSafariClassModeAdmin={render,matchingAssignments,payloadOf,setCatalogForTests:games=>{currentCatalog=games||{}}};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.LernSafariClassModeAdmin;
})(typeof window==='undefined'?globalThis:window);
