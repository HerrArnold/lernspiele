/* LernSafari: geschützter Briefkasten, Logbuch und Lehrpersonen-Post.
   Reale Inhalte kommen ausschliesslich über authentisierte Cloudflare-Endpunkte. */
'use strict';
(function(root){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const kinds={message:['✉️','Nachricht'],update:['🔔','Update'],success:['🏅','Erfolg']};
 const safeRows=x=>Array.isArray(x)?x:[];
 const format=x=>{const d=new Date(x);return Number.isFinite(d.getTime())?d.toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric'}):''};
 const badge=k=>{const a=kinds[k]||kinds.message;return '<span class="ls-post-kind ls-post-'+esc(k)+'">'+a[0]+' '+a[1]+'</span>'};
 const sorted=rows=>safeRows(rows).slice().sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||Number(b.id)-Number(a.id));
 function setIndicator(rows){
   const el=document.querySelector('#mailIndicator');if(!el)return;
   const unread=safeRows(rows).filter(x=>!x.read_at).length;
   el.hidden=unread===0;
   if(unread){el.textContent=String(unread);el.setAttribute('aria-label',unread+' ungelesene Briefe')}
 }
 function mailCard(row){
   const read=!!row.read_at;
   return '<article class="ls-post '+(read?'is-read':'is-unread')+'" data-post-id="'+Number(row.id)+'">'+
    '<button class="ls-post-trigger" type="button" data-open-post="'+Number(row.id)+'" aria-expanded="false">'+
     '<span class="ls-post-title"><strong>'+esc(row.subject||'Nachricht')+'</strong>'+(read?'':'<span class="ls-post-new">NEU</span>')+'</span>'+
     '<span class="ls-post-meta">'+badge(row.kind||'message')+' · '+esc(format(row.created_at))+'</span>'+
     '</button><div class="ls-post-body" hidden><p>'+esc(row.body||'').replace(/\n/g,'<br>')+'</p>'+
     ((row.kind==='success')?'<p class="ls-post-note">🏅 Dieser Erfolg ist auch in deinem Logbuch sichtbar.</p>':'')+
     '</div></article>';
 }
 async function mailbox({host,call,onChanged}){
   host.innerHTML='<div class="pd-panel" role="status">✉️ Briefkasten wird geladen …</div>';
   let data;
   try{data=await call('/messages');if(data.available!==true||!Array.isArray(data.messages))throw Error('Nachrichtendienst noch nicht eingerichtet')}
   catch(e){host.innerHTML='<div class="pd-panel ls-mail-empty"><h3>✉️ Briefkasten</h3><p>Deine Nachrichten können noch nicht geladen werden. Es wird keine Beispielnachricht angezeigt.</p><small>'+esc(e.message||'Cloudflare-Verbindung prüfen')+'</small><button type="button" class="pd-action" id="ls-mail-retry">Erneut versuchen</button></div>';host.querySelector('#ls-mail-retry')?.addEventListener('click',()=>mailbox({host,call,onChanged}));setIndicator([]);return}
   const rows=sorted(data.messages);setIndicator(rows);
   host.innerHTML='<section class="pd-shell cloud-shell ls-mailbox"><header class="pd-banner"><div><span class="pd-eyebrow">✉️ Persönliche Post</span><h3>Mein Briefkasten</h3><p>Die neuesten Briefe stehen immer oben.</p></div><div class="pd-total"><strong id="lsUnreadTotal">'+rows.filter(x=>!x.read_at).length+'</strong><span>ungelesen</span></div></header>'+
    '<div class="ls-post-list">'+(rows.length?rows.map(mailCard).join(''):'<div class="pd-panel ls-mail-empty"><h4>📭 Dein Briefkasten ist leer.</h4><p>Sobald deine Lehrperson dir schreibt, erscheint die Nachricht hier.</p></div>')+'</div></section>';
   host.querySelectorAll('[data-open-post]').forEach(button=>button.addEventListener('click',async()=>{
     const row=rows.find(x=>Number(x.id)===Number(button.dataset.openPost));if(!row)return;
     const card=button.closest('.ls-post'),content=card.querySelector('.ls-post-body');
     const open=content.hidden;content.hidden=!open;button.setAttribute('aria-expanded',String(open));
     if(!open||row.read_at)return;
     button.disabled=true;
     try{
       const r=await call('/messages/read',{method:'POST',body:{id:Number(row.id)}});
       if(r.ok!==true)throw Error('Lesebestätigung nicht möglich');
       row.read_at=new Date().toISOString();
       card.classList.remove('is-unread');card.classList.add('is-read');
       card.querySelector('.ls-post-new')?.remove();
       const unread=rows.filter(x=>!x.read_at).length;
       host.querySelector('#lsUnreadTotal').textContent=String(unread);
       setIndicator(rows);
       if(typeof onChanged==='function')onChanged();
     }catch(e){const p=document.createElement('p');p.className='ls-post-error';p.textContent='Gelesen-Status konnte nicht gespeichert werden: '+String(e.message||'Serverfehler');content.appendChild(p)}
     finally{button.disabled=false}
   }));
 }
 function topicForGame(id){
   const catalog=root.LernSafariTopicCatalog||{};
   const candidates=[id,String(id).replace(/^original\/spiele\//,'').replace(/\.html$/,'')];
   for(const [subject,topics] of Object.entries(catalog)){
     for(const topic of topics)for(const game of safeRows(topic.games)){
       const file=String(game[1]||'').replace(/\.html$/,'');
       if(candidates.some(k=>k===file))return {subject,topic:topic.name,title:game[0]};
     }
   }
   return {subject:'Weitere Spiele',topic:'Noch nicht zugeordnet',title:id.replace(/-/g,' ')};
 }
 function scoreCategories(scores){
   const tree=new Map();
   for(const entry of safeRows(scores)){
     if(!entry||typeof entry.game!=='string'||!entry.game)continue;
     const key=topicForGame(entry.game),amount=Number(entry.score);
     if(!Number.isFinite(amount))continue;
     if(!tree.has(key.subject))tree.set(key.subject,new Map());
     const subjects=tree.get(key.subject);
     if(!subjects.has(key.topic))subjects.set(key.topic,[]);
     const group=subjects.get(key.topic);
     const found=group.find(x=>x.id===entry.game);
     if(found)found.score=Math.max(found.score,amount);
     else group.push({id:entry.game,title:key.title,score:amount});
   }
   const order=Object.keys(root.LernSafariTopicCatalog||{});
   return [...tree].sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0])).map(([subject,topics])=>
     '<details class="ls-score-subject"><summary>'+esc(subject)+' <small>'+[...topics.values()].reduce((n,arr)=>n+arr.length,0)+' Spiele</small></summary>'+
     [...topics].map(([topic,games])=>'<details class="ls-score-topic"><summary>'+esc(topic)+' <small>'+games.length+' Spiele</small></summary><div class="ls-score-games">'+games.map(g=>'<article><span>'+esc(g.title)+'</span><strong>⭐ '+esc(g.score)+'</strong></article>').join('')+'</div></details>').join('')+'</details>').join('');
 }
 function achievements(messages){
   const awards=sorted(messages).filter(x=>x.kind==='success');
   return awards.length?awards.map(x=>'<article class="ls-award"><span aria-hidden="true">🏅</span><div><strong>'+esc(x.subject)+'</strong><small>'+esc(format(x.created_at))+'</small><p>'+esc(x.body||'')+'</p></div></article>').join(''):'<p>Noch keine Auszeichnungen erhalten. Deine Lehrperson kann dir hier besondere Erfolge verleihen.</p>';
 }
 function logbook({host,plan,highscores,messages,onOpen,onDone,onRefresh}){
   const assignments=safeRows(plan.assignments);
   const done=new Set(safeRows(plan.done).map(Number));
   const scores=safeRows(highscores.highscores);
   let selected='tasks',achievementTab='awards';
   const awards=safeRows(messages).filter(x=>x.kind==='success');
   const doneTotal=assignments.filter(a=>done.has(Number(a.id))).length;
   host.innerHTML='<div class="pd-shell cloud-shell ls-logbook"><header class="pd-banner"><div><span class="pd-eyebrow">📖 Mein persönliches Logbuch</span><h3>Mein Logbuch</h3><p>Meine Aufgaben und Erfolge – alles an einem Ort.</p></div><div class="pd-total"><strong>'+doneTotal+' / '+assignments.length+'</strong><span>erledigt</span></div></header>'+
     '<nav class="ls-logbook-tabs" aria-label="Logbuch-Bereiche"><button type="button" data-logbook-tab="tasks" aria-selected="true">📌 Meine Aufgaben</button><button type="button" data-logbook-tab="achievements" aria-selected="false">🏆 Erfolge</button></nav><div id="lsLogbookContent"></div></div>';
   const outlet=host.querySelector('#lsLogbookContent');
   const render=()=>{
     host.querySelectorAll('[data-logbook-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.logbookTab===selected)));
     if(selected==='tasks'){
       outlet.innerHTML='<p class="ls-logbook-intro">Hier siehst du deine aktuellen Aufträge. Ein Häkchen bedeutet «Ich bin fertig» und ist keine automatische Korrektur.</p>'+
       (assignments.length?assignments.map(a=>'<article class="pd-task '+(done.has(Number(a.id))?'is-done':'')+'"><div class="pd-task-head"><span>📌</span><div><strong>'+esc(a.title)+'</strong><small>'+(a.kind==='zusatz'?'Zusatzaufgabe':'Pflichtaufgabe')+'</small></div><span class="pd-task-status">'+(done.has(Number(a.id))?'✓ Erledigt':'Offen')+'</span></div>'+
         '<div class="pd-task-actions"><button type="button" class="pd-action" data-logbook-open="'+Number(a.id)+'">Aufgabe öffnen</button><label class="pd-inline-check"><input type="checkbox" data-logbook-done="'+Number(a.id)+'" '+(done.has(Number(a.id))?'checked':'')+'> Erledigt</label></div></article>').join(''):'<div class="pd-panel">Momentan hast du keine zugewiesenen Aufgaben.</div>');
       outlet.querySelectorAll('[data-logbook-open]').forEach(b=>b.onclick=()=>{const a=assignments.find(x=>Number(x.id)===Number(b.dataset.logbookOpen));if(a)onOpen(a.target)});
       outlet.querySelectorAll('[data-logbook-done]').forEach(b=>b.onchange=async()=>{const id=Number(b.dataset.logbookDone),checked=b.checked;b.disabled=true;try{await onDone(id,checked);if(checked)done.add(id);else done.delete(id);render()}catch(e){b.checked=!checked;const hint=document.createElement('p');hint.textContent='Nicht gespeichert: '+e.message;outlet.prepend(hint);b.disabled=false}});
     }else{
       outlet.innerHTML='<div class="ls-achievement-tabs"><button type="button" data-achievement-tab="awards" aria-selected="'+(achievementTab==='awards')+'">🏅 Verliehene Erfolge ('+awards.length+')</button><button type="button" data-achievement-tab="highscores" aria-selected="'+(achievementTab==='highscores')+'">⭐ Spiel-Highscores ('+scores.length+')</button></div>'+
         (achievementTab==='awards'?'<div class="ls-award-list">'+achievements(messages)+'</div>':'<div class="ls-score-list"><p>Deine Bestwerte sind nach Fach und Thema sortiert. Neue Spiele werden automatisch über die Lern-Lagune zugeordnet.</p>'+ (scoreCategories(scores)||'<p>Noch keine Spiel-Highscores gespeichert.</p>')+'<button type="button" class="pd-secondary" id="lsRefreshHighscores">Aktualisieren</button></div>');
       outlet.querySelectorAll('[data-achievement-tab]').forEach(b=>b.onclick=()=>{achievementTab=b.dataset.achievementTab;render()});
       outlet.querySelector('#lsRefreshHighscores')?.addEventListener('click',onRefresh);
     }
   };
   host.querySelectorAll('[data-logbook-tab]').forEach(b=>b.onclick=()=>{selected=b.dataset.logbookTab;render()});render();
 }
 function adminPanel({host,call,kids}){
   if(!host)return;
   host.innerHTML='<section class="pd-panel ls-admin-post"><h4>✉️ Nachricht, Update oder Erfolg verschicken</h4>'+
     '<p>Nur nach einer bestätigten Serverantwort gilt die Nachricht als verschickt. Ein «Erfolg» erscheint zusätzlich im Logbuch des betreffenden Kindes.</p>'+
     '<form id="lsTeacherPostForm" class="pd-form" hidden>'+
       '<label>Art der Post<select name="kind"><option value="message">✉️ Nachricht</option><option value="update">🔔 Update auf der LernSafari</option><option value="success">🏅 Verliehener Erfolg</option></select></label>'+
       '<label>Empfänger<select name="audience"><option value="all">Ganze Klasse</option><option value="child">Einzelnes Tierkonto</option></select></label>'+
       '<label id="lsRecipientWrap" hidden>Tierkonto<select name="recipient">'+safeRows(kids).map(k=>'<option value="'+esc(k.username)+'">'+esc(k.username)+'</option>').join('')+'</select></label>'+
       '<label>Titel<input name="subject" maxlength="100" required placeholder="z. B. Tolle Ausdauer beim Üben!"></label>'+
       '<label>Deine Mitteilung<textarea name="body" maxlength="1500" rows="4" required placeholder="Schreibe hier deine persönliche Botschaft."></textarea></label>'+
       '<button type="submit" class="pd-action">Brief verschicken</button></form>'+
     '<p id="lsTeacherPostStatus" role="status">Nachrichtendienst wird geprüft …</p><div id="lsTeacherPostHistory"></div></section>';
   const form=host.querySelector('#lsTeacherPostForm'),status=host.querySelector('#lsTeacherPostStatus'),history=host.querySelector('#lsTeacherPostHistory');
   form.elements.audience.onchange=()=>{host.querySelector('#lsRecipientWrap').hidden=form.elements.audience.value!=='child'};
   const refresh=async()=>{try{const r=await call('/admin-messages',{admin:true});if(r.available!==true||!Array.isArray(r.messages))throw Error('nicht verfügbar');form.hidden=false;status.textContent='✅ Nachrichtendienst ist mit Cloudflare verbunden.';history.innerHTML='<h5>Zuletzt verschickt</h5>'+(r.messages.length?sorted(r.messages).slice(0,20).map(m=>'<div class="ls-admin-sent">'+badge(m.kind||'message')+' <strong>'+esc(m.subject||'')+'</strong><small> · '+esc(m.audience==='all'?'Alle':m.recipient)+' · '+esc(format(m.created_at))+'</small></div>').join(''):'<p>Noch keine Briefe verschickt.</p>');}
     catch(e){form.hidden=true;status.textContent='Der Nachrichtendienst ist im Worker noch nicht aktiv: '+String(e.message||'Unbekannt')}};
   form.onsubmit=async e=>{e.preventDefault();const b=form.querySelector('[type=submit]');b.disabled=true;status.textContent='Brief wird sicher versendet …';try{const v=form.elements,body={kind:v.kind.value,audience:v.audience.value,recipient:v.audience.value==='child'?v.recipient.value:null,subject:v.subject.value.trim(),body:v.body.value.trim()};const result=await call('/admin-messages',{admin:true,method:'POST',body});if(result.ok!==true)throw Error('Server hat den Versand nicht bestätigt');form.reset();host.querySelector('#lsRecipientWrap').hidden=true;await refresh();status.textContent='✅ Brief wurde von Cloudflare gespeichert und zugestellt.';}catch(e){status.textContent='Nicht versendet: '+String(e.message||e)}finally{b.disabled=false}};
   refresh();
 }
 root.LernSafariExtras={mailbox,logbook,adminPanel,scoreCategories,setIndicator};
})(window);
