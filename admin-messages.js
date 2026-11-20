/* Flamingo: separate Nachrichtenverwaltung über den bestehenden Admin-Worker. */
'use strict';
(function(root){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mount({host,call,kids=[]}){
  if(!host)return {refresh:()=>{}};
  host.innerHTML=`<section class="admin-mail-section">
    <form id="ls-admin-post-form" class="admin-mail-form">
      <h4>✉️ Einen Brief schreiben</h4>
      <label>Empfänger <select name="audience"><option value="all">Alle Kinder</option><option value="child">Ein einzelnes Kind</option></select></label>
      <label id="ls-admin-post-child" hidden>Kind auswählen <select name="username">${kids.map(k=>'<option value="'+esc(k.username)+'">'+esc(k.username)+'</option>').join('')}</select></label>
      <label>Betreff <input name="title" maxlength="110" required placeholder="Titel des Briefes"></label>
      <label>Nachricht <textarea name="body" maxlength="1500" rows="5" required placeholder="Deine Nachricht an die Kinder"></textarea></label>
      <button type="submit" class="pd-action">✉️ Brief verschicken</button>
      <p id="ls-admin-post-feedback" role="status"></p>
    </form>
    <section class="admin-mail-history"><div class="admin-mail-history-head"><h4>Verschickte Briefe</h4><button type="button" id="ls-admin-post-refresh" class="pd-secondary">Aktualisieren</button></div><div id="ls-admin-post-list" aria-live="polite">Noch nicht geladen.</div></section>
  </section>`;
  const form=host.querySelector('form'),recipient=host.querySelector('#ls-admin-post-child');
  const feedback=host.querySelector('#ls-admin-post-feedback'),list=host.querySelector('#ls-admin-post-list');
  form.elements.audience.addEventListener('change',()=>{recipient.hidden=form.elements.audience.value!=='child';});
  async function refresh(){
    list.textContent='Briefe werden geladen …';
    try {
      const data=await call('/admin-messages',{admin:true});
      if(!Array.isArray(data.items))throw Error('Keine Nachrichtenliste verfügbar');
      const rows=data.items;
      if(!rows.length){list.textContent='Es wurden noch keine Briefe verschickt.';return;}
      list.innerHTML='<p class="admin-mail-counter">'+rows.length+' gespeicherte Empfänger-Briefe (maximal 300 werden angezeigt)</p>'+
       rows.map(m=>'<article class="admin-mail-item"><div><strong>'+esc(m.title)+'</strong> <small>an '+esc(m.username)+' · '+esc((m.created_at||'').slice(0,16).replace('T',' '))+'</small></div><p>'+esc(m.body)+'</p><span class="admin-mail-read">'+(m.read_at?'✓ Gelesen':'✉ Noch ungelesen')+'</span></article>').join('');
    } catch(e){list.textContent='Nachrichten konnten nicht geladen werden: '+(e.message||e);}
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const payload={audience:form.elements.audience.value,username:form.elements.username.value,title:form.elements.title.value.trim(),body:form.elements.body.value.trim()};
    if(!payload.title||!payload.body)return;
    const btn=form.querySelector('[type=submit]');btn.disabled=true;feedback.textContent='Brief wird gespeichert …';
    try{
      const result=await call('/admin-messages',{admin:true,method:'POST',body:payload});
      if(result?.error)throw Error(result.error);
      feedback.textContent='✅ Brief in Cloudflare gespeichert.';
      form.elements.title.value='';form.elements.body.value='';
      await refresh();
    }catch(err){feedback.textContent='Versand fehlgeschlagen: '+(err.message||err);}
    finally{btn.disabled=false;}
  });
  host.querySelector('#ls-admin-post-refresh').addEventListener('click',refresh);
  return {refresh};
 }
 root.LernSafariAdminMessages={mount};
})(window);
