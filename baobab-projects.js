/* Baobab projects: a visible public Polaroid gallery, and authenticated teacher
   uploads through an optional server-side Worker. No pupil data in localStorage. */
'use strict';
(function(root){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const date=s=>{try{return new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Zurich'}).format(new Date(s+'T12:00:00Z'))}catch(_){return String(s)}};
 const endpoint=()=>String(root.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
 const photoSafe=s=>typeof s==='string'&&s.length<220001&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s);
 function polaroids(rows){
  return '<div class="baobab-polaroids">'+rows.filter(p=>photoSafe(p.image)).map((p,i)=>
   '<figure class="baobab-polaroid" style="--polaroid-tilt:'+((i%5)-2)*1.5+'deg">'+
   '<img src="'+esc(p.image)+'" alt="'+esc(p.title)+'" loading="lazy">'+
   '<figcaption><time>'+esc(date(p.date))+'</time><strong>'+esc(p.title)+'</strong>'+
   (p.caption?'<span>'+esc(p.caption)+'</span>':'')+'</figcaption></figure>').join('')+'</div>';
 }
 async function render(host){
  if(!host)return;
  host.innerHTML='<div class="baobab-projects-intro"><h2>📸 Projekte und Erlebnisse</h2><p>Unsere gemeinsamen Entdeckungen – wie Polaroids in einem Reisealbum.</p></div>'+
    '<div id="baobabProjectGallery" class="baobab-projects-loading" role="status">Unser Fotoalbum wird geöffnet …</div>';
  const gallery=host.querySelector('#baobabProjectGallery');
  try{
   const res=await fetch(endpoint()+'/projects',{cache:'no-store'});
   const json=await res.json();
   if(!res.ok||json.available!==true||!Array.isArray(json.projects))throw Error('Nicht verfügbar');
   if(!gallery.isConnected)return;
   gallery.innerHTML=json.projects.length?polaroids(json.projects):
    '<div class="baobab-projects-empty">🖼️ Unser Album wartet auf das erste Projekt oder Erlebnis.</div>';
  }catch(_){
   if(gallery.isConnected)gallery.innerHTML='<div class="baobab-projects-empty">🖼️ Hier erscheinen bald unsere Polaroid-Rückblicke. Noch keine veröffentlichten Einträge verfügbar.</div>';
  }
 }
 async function prepareImage(file){
  if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('Bitte ein JPG-, PNG- oder WebP-Foto wählen.');
  if(file.size>15*1024*1024)throw Error('Das Foto ist zu gross (maximal 15 MB vor dem Verkleinern).');
  const image=await new Promise((resolve,reject)=>{const el=new Image();const src=URL.createObjectURL(file);el.onload=()=>{URL.revokeObjectURL(src);resolve(el)};el.onerror=()=>{URL.revokeObjectURL(src);reject(new Error('Das Foto konnte nicht gelesen werden.'))};el.src=src});
  let ratio=Math.min(1,1050/Math.max(image.naturalWidth,image.naturalHeight));
  for(let k=0;k<5;k++){
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
   canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
   const ctx=canvas.getContext('2d');
   if(!ctx)throw Error('Fotoverarbeitung nicht verfügbar');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   const encoded=canvas.toDataURL('image/jpeg',Math.max(.45,.78-k*.08));
   if(encoded.length<215000)return encoded;
   ratio*=.8;
  }
  throw Error('Foto konnte nicht ausreichend verkleinert werden.');
 }
 function adminMount({mount,call}){
  if(!mount)return;
  mount.innerHTML='<section class="pd-panel"><h4>📸 Projekte und Erlebnisse</h4><p>Füge ein Foto mit Datum und einem kurzen Rückblick hinzu. Nach dem Veröffentlichen erscheint der Beitrag im Baobab-Baum als Polaroid.</p>'+
   '<form id="adminProjectForm" class="pd-form" hidden>'+
   '<label>Foto<input type="file" name="image" accept="image/jpeg,image/png,image/webp" required></label>'+
   '<label>Datum<input type="date" name="date" required></label>'+
   '<label>Titel<input name="title" maxlength="90" placeholder="z. B. Vogelwarte Sempach" required></label>'+
   '<label>Ein Satz zum Erlebnis (optional)<textarea name="caption" maxlength="180" rows="3" placeholder="Das haben wir erlebt …"></textarea></label>'+
   '<label class="admin-project-permission"><input name="permission" type="checkbox" required> Ich bestätige, dass ich dieses Foto auf der LernSafari veröffentlichen darf und gegebenenfalls die nötigen Einwilligungen vorliegen.</label>'+
   '<button type="submit" class="pd-action">Als Polaroid veröffentlichen</button></form>'+
   '<p id="adminProjectsStatus" role="status">Sicherer Fotodienst wird geprüft …</p><div id="adminProjectsList"></div></section>';
  const form=mount.querySelector('#adminProjectForm'),status=mount.querySelector('#adminProjectsStatus'),list=mount.querySelector('#adminProjectsList');
  const localDate=new Date().toISOString().slice(0,10);
  form.elements.date.value=localDate;
  let available=false;
  async function refresh(){
   try{
    const data=await call('/admin-projects',{admin:true});
    if(!mount.isConnected)return;
    if(data.available!==true||!Array.isArray(data.projects))throw Error('Nicht vorhanden');
    available=true;form.hidden=false;
    status.textContent='✅ Fotoalbum mit Cloudflare verbunden. Fotos werden erst nach Veröffentlichung sichtbar.';
    list.innerHTML=data.projects.length?'<h5>Veröffentlichte Rückblicke</h5><div class="admin-project-list">'+
     data.projects.map(p=>'<article><strong>'+esc(p.title)+'</strong><span>'+esc(date(p.event_date||p.date))+'</span><button type="button" class="pd-secondary" data-delete-project="'+Number(p.id)+'">Löschen</button></article>').join('')+'</div>':'<p>Noch keine veröffentlichten Rückblicke.</p>';
    list.querySelectorAll('[data-delete-project]').forEach(button=>button.onclick=async()=>{
      if(!confirm('Dieses Foto und den Rückblick wirklich löschen?'))return;
      button.disabled=true;
      try{await call('/admin-projects',{method:'DELETE',admin:true,body:{id:Number(button.dataset.deleteProject)}});await refresh()}
      catch(err){status.textContent='Löschen nicht möglich: '+String(err.message||err);button.disabled=false}
    });
   }catch(_){
    available=false;form.hidden=true;
    status.textContent='Der geschützte Cloudflare-Fotodienst ist noch nicht aktiviert. Hier werden die Veröffentlichungsfelder freigeschaltet, sobald der Worker angebunden ist.';
   }
  }
  form.onsubmit=async e=>{
   e.preventDefault();if(!available)return;
   const button=form.querySelector('[type="submit"]');button.disabled=true;status.textContent='Foto wird für die Webseite verkleinert …';
   try{
    const image=await prepareImage(form.elements.image.files[0]);
    const result=await call('/admin-projects',{admin:true,method:'POST',body:{
      image,date:form.elements.date.value,title:form.elements.title.value.trim(),
      caption:form.elements.caption.value.trim(),photo_permission_confirmed:form.elements.permission.checked
    }});
    if(result.ok!==true)throw Error('Cloudflare hat die Veröffentlichung nicht bestätigt.');
    form.reset();form.elements.date.value=localDate;
    await refresh();status.textContent='✅ Rückblick als Polaroid auf Cloudflare veröffentlicht.';
   }catch(err){status.textContent='Nicht veröffentlicht: '+String(err.message||err)}
   finally{button.disabled=false}
  };
  refresh();
 }
 root.LernSafariProjects={render,adminMount,photoSafe};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.LernSafariProjects;
})(typeof window==='undefined'?globalThis:window);
