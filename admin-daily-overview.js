/* Local, read-only schedule preview for 26 configured daily task sets; no Cloudflare requests. */
'use strict';
(function(root){
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 function mount(host){
  const days=(root.LernSafariDailyOverview||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const dateText=x=>{try{return new Date(x+'T12:00:00Z').toLocaleDateString('de-CH',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'})}catch{return x}};
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  host.innerHTML='<section class="pd-panel admin-daily-view"><h4>🌞 Aufgaben des Tages – Planungsübersicht</h4>'+
   '<p>Diese Aufgaben werden nach Datum automatisch eingeblendet. Hier siehst du die tatsächlich in GitHub hinterlegten Aufgabensets. Änderungen an den Aufgabeninhalten erfolgen weiterhin über die Dateien in GitHub; die Agenda kannst du separat bearbeiten.</p>'+
   '<div class="admin-daily-controls"><label>Datum auswählen<select data-daily-date>'+days.map(d=>'<option value="'+esc(d.date)+'" '+(d.date===today?'selected':'')+'>'+esc(dateText(d.date))+' · '+esc(d.theme)+'</option>').join('')+'</select></label></div>'+
   '<div data-daily-detail></div><p class="admin-small-note">Die Aufgabenübersicht verursacht keine Cloudflare-Datenbankabfragen.</p></section>';
  const select=host.querySelector('[data-daily-date]'),out=host.querySelector('[data-daily-detail]');
  if(!days.some(d=>d.date===today)){const next=days.find(d=>d.date>=today);if(next)select.value=next.date;}
  function draw(){
   const d=days.find(x=>x.date===select.value);if(!d){out.textContent='Keine Tagesaufgaben für dieses Datum geplant.';return;}
   out.innerHTML='<h5>'+esc(d.theme)+' · '+esc(d.tag)+'</h5><ol>'+d.exercises.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ol>';
  }
  select.onchange=draw;draw();
 }
 root.LernSafariDailyAdmin={mount};
})(window);
