/* Native Flamingo exit-ticket administration. No old Cloudflare iframe or polling. */
'use strict';
(function(root){
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const date=x=>{try{return new Intl.DateTimeFormat('de-CH',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Zurich'}).format(new Date(x))}catch{return String(x||'')}};
 const local=x=>{
  const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Europe/Zurich'}).formatToParts(new Date(x));
  const get=name=>parts.find(v=>v.type===name)?.value||'00';
  return get('year')+'-'+get('month')+'-'+get('day')+'T'+get('hour')+':'+get('minute');
 };
 const svg=raw=>{
  let paths=raw;
  if(typeof raw==='string')try{paths=JSON.parse(raw)}catch{return ''};
  if(!Array.isArray(paths))return '';
  const lines=paths.slice(0,35).map(line=>Array.isArray(line)?line.slice(0,150).filter(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isInteger(n)&&n>=0&&n<=1000)):[]).filter(v=>v.length);
  return lines.length?'<svg class="admin-exit-drawing" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Gespeicherte Zeichnung des Kindes">'+lines.map(l=>'<polyline points="'+l.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#253347" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>').join('')+'</svg>':'';
 };
 function mount({host,call,kids=[]}){
  const now=Date.now();
  host.innerHTML='<section class="pd-panel admin-exit-native"><h4>🎟️ Exit-Tickets</h4><p>Stelle eine Frage zum Abschluss einer Lernphase. Die Kinder können mit einem Text oder einer Zeichnung antworten.</p>'+
   '<form class="admin-exit-form" data-exit-form><input type="hidden" name="id">'+
   '<label>Frage oder Auftrag<textarea name="question" maxlength="400" rows="3" required placeholder="Was hast du heute gelernt?"></textarea></label>'+
   '<div class="admin-exit-grid"><label>Für wen?<select name="audience"><option value="all">Ganze Klasse</option><option value="child">Ein Tierkonto</option></select></label>'+
   '<label data-exit-child-wrap hidden>Tierkonto<select name="username">'+kids.map(k=>'<option value="'+esc(k.username)+'">'+esc(k.username)+'</option>').join('')+'</select></label>'+
   '<label>Freigeben ab<input name="start" type="datetime-local" value="'+local(now)+'" required></label>'+
   '<label>Abgabe bis<input name="end" type="datetime-local" value="'+local(now+45*60*1000)+'" required></label></div>'+
   '<div class="admin-exit-buttons"><button type="submit" class="pd-action">Exit-Ticket speichern</button><button type="reset" class="pd-secondary">Neue Frage</button><button type="button" class="pd-secondary" data-exit-refresh>🔄 Tickets laden</button></div>'+
   '<p role="status" data-exit-status>Noch keine Abfrage durchgeführt.</p></form>'+
   '<div data-exit-history></div></section>';
  const form=host.querySelector('[data-exit-form]'),status=host.querySelector('[data-exit-status]'),list=host.querySelector('[data-exit-history]');
  let data={tickets:[],responses:[]};
  form.elements.audience.onchange=()=>{host.querySelector('[data-exit-child-wrap]').hidden=form.elements.audience.value!=='child'};
  form.onreset=()=>setTimeout(()=>{form.elements.id.value='';form.elements.audience.onchange()},0);
  const render=()=>{
   const tickets=(data.tickets||[]).slice().sort((a,b)=>String(b.start_at).localeCompare(String(a.start_at)));
   const answers=data.responses||[];
   list.innerHTML='<h5>Gespeicherte Exit-Tickets ('+tickets.length+')</h5>'+
    (tickets.length?'<div class="admin-exit-history">'+tickets.map(t=>{
     const sent=answers.filter(a=>Number(a.ticket_id)===Number(t.id));
     return '<article class="admin-exit-record"><strong>'+esc(t.question)+'</strong><p>'+esc(date(t.start_at))+' – '+esc(date(t.end_at))+' · '+esc(t.audience==='all'?'Ganze Klasse':t.username)+' · '+sent.length+' Antworten</p>'+
      '<div class="admin-exit-buttons"><button type="button" class="pd-secondary" data-exit-edit="'+Number(t.id)+'">Bearbeiten</button><button type="button" class="pd-secondary" data-exit-delete="'+Number(t.id)+'">Löschen</button></div>'+
      (sent.length?'<details><summary>Antworten ansehen ('+sent.length+')</summary>'+sent.map(p=>'<div class="admin-exit-answer"><strong>'+esc(p.username)+'</strong><small>'+esc(date(p.submitted_at))+'</small>'+(p.answer?'<p>'+esc(p.answer)+'</p>':'')+svg(p.drawing)+'</div>').join('')+'</details>':'<p>Noch keine Antworten.</p>')+'</article>';
    }).join('')+'</div>':'<p>Noch keine Exit-Tickets erstellt.</p>');
   list.querySelectorAll('[data-exit-edit]').forEach(b=>b.onclick=()=>{
    const ticket=tickets.find(t=>Number(t.id)===Number(b.dataset.exitEdit));if(!ticket)return;
    form.elements.id.value=ticket.id;form.elements.question.value=ticket.question||'';
    form.elements.audience.value=ticket.audience;form.elements.audience.onchange();
    form.elements.username.value=ticket.username||'';
    form.elements.start.value=local(ticket.start_at);form.elements.end.value=local(ticket.end_at);
    form.scrollIntoView({block:'center',behavior:'smooth'});
   });
   list.querySelectorAll('[data-exit-delete]').forEach(b=>b.onclick=async()=>{
    if(!confirm('Dieses Exit-Ticket und alle Antworten endgültig löschen?'))return;
    try{await call('/admin-exit-tickets',{admin:true,method:'DELETE',body:{id:Number(b.dataset.exitDelete)}});await refresh();}
    catch(err){status.textContent='Nicht gelöscht: '+String(err.message||err)}
   });
  };
  async function refresh(){
   status.textContent='Exit-Tickets werden geladen …';
   try{
    const result=await call('/admin-exit-tickets',{admin:true});
    if(!Array.isArray(result.tickets)||!Array.isArray(result.responses))throw Error('Der Worker liefert keine vollständigen Exit-Tickets.');
    data=result;render();status.textContent='Exit-Tickets aktualisiert.';
   }catch(err){status.textContent='Exit-Tickets konnten nicht geladen werden: '+String(err.message||err)}
  }
  form.onsubmit=async e=>{
   e.preventDefault();
   const f=form.elements,start=new Date(f.start.value),end=new Date(f.end.value);
   if(!f.question.value.trim()||!Number.isFinite(+start)||!Number.isFinite(+end)||end<=start){status.textContent='Bitte Frage und Zeitraum prüfen.';return}
   const payload={question:f.question.value.trim(),audience:f.audience.value,username:f.audience.value==='child'?f.username.value:'',
    start_at:start.toISOString(),end_at:end.toISOString()};
   if(f.id.value)payload.id=Number(f.id.value);
   const button=form.querySelector('[type="submit"]');button.disabled=true;
   try{
    const result=await call('/admin-exit-tickets',{method:'POST',admin:true,body:payload});
    if(result.ok!==true)throw Error('Keine Bestätigung vom Worker');
    form.reset();await refresh();status.textContent='✅ Exit-Ticket gespeichert.';
   }catch(err){status.textContent='Nicht gespeichert: '+String(err.message||err)}
   finally{button.disabled=false}
  };
  host.querySelector('[data-exit-refresh]').onclick=refresh;
  return {refresh};
 }
 root.LernSafariExitAdmin={mount,svg};
 if(typeof module==='object'&&module.exports)module.exports={svg};
})(typeof window!=='undefined'?window:globalThis);
