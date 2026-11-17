/* Baobab projects: a visible public Polaroid gallery, and authenticated teacher
   uploads through an optional server-side Worker. No pupil data in localStorage. */
'use strict';
(function(root){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const date=s=>{try{return new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Europe/Zurich'}).format(new Date(s+'T12:00:00Z'))}catch(_){return String(s)}};
 const endpoint=()=>String(root.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
 const photoSafe=s=>typeof s==='string'&&s.length<220001&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s);
 function polaroids(rows){
  const items=rows.filter(p=>photoSafe(p.image)).slice().sort((x,y)=>
    String(x.event_date||x.date||'').localeCompare(String(y.event_date||y.date||''))||Number(x.id)-Number(y.id));
  return '<div class="baobab-timeline-head"><span>Früher</span><div class="baobab-timeline-controls"><button type="button" data-project-scroll="-1" aria-label="Ältere Projekte">‹</button><button type="button" data-project-scroll="1" aria-label="Neuere Projekte">›</button></div><span>Heute</span></div>'+
   '<div class="baobab-timeline" role="region" aria-label="Unsere Lieblingsprojekte, zeitlich von alt nach neu" tabindex="0">'+
   items.map((p,i)=>'<article class="baobab-timeline-item"><time datetime="'+esc(p.date||p.event_date)+'">'+esc(date(p.date||p.event_date))+'</time>'+
    '<button type="button" class="baobab-polaroid baobab-polaroid-open" data-open-project="'+Number(p.id)+'" style="--polaroid-tilt:'+((i%5)-2)*.8+'deg" aria-label="'+esc(p.title)+' – Bilder anschauen">'+
    '<img src="'+esc(p.image)+'" alt="'+esc(p.title)+'" loading="lazy">'+
    (Number(p.photo_count)>1?'<span class="baobab-photo-badge">📷 '+Number(p.photo_count)+' Fotos · Ansehen</span>':'<span class="baobab-photo-badge is-one">🔍 Vergrössern</span>')+
    '<span class="baobab-polaroid-caption"><strong>'+esc(p.title)+'</strong>'+(p.caption?'<span>'+esc(p.caption)+'</span>':'')+'</span></button></article>').join('')+'</div>'+
   '<p class="baobab-scroll-hint">← Scrolle von links nach rechts durch unsere gemeinsamen Erlebnisse →</p>';
 }
 function openGallery(host,project){
   const existing=host.querySelector('.baobab-lightbox');
   if(existing)existing.remove();
   const layer=document.createElement('div');
   layer.className='baobab-lightbox';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');
   layer.setAttribute('aria-label','Bildergalerie '+project.title);
   layer.innerHTML='<div class="baobab-lightbox-panel"><button type="button" class="baobab-lightbox-close" aria-label="Bildergalerie schliessen">✕</button>'+
     '<h3>'+esc(project.title)+'</h3><p>'+esc(date(project.date||project.event_date))+(project.caption?' · '+esc(project.caption):'')+'</p>'+
     '<div class="baobab-lightbox-picture"><button type="button" data-photo-step="-1" aria-label="Vorheriges Foto">‹</button>'+
     '<img alt="'+esc(project.title)+'" src="'+esc(project.image)+'">'+
     '<button type="button" data-photo-step="1" aria-label="Nächstes Foto">›</button></div>'+
     '<div class="baobab-lightbox-footer"><span data-photo-counter aria-live="polite">Foto 1 von 1</span><div class="baobab-photo-thumbs"></div></div>'+
     '<p class="baobab-photo-loading" role="status">Zusätzliche Bilder werden geladen …</p></div>';
   host.append(layer);
   const focusFrom=host.querySelector('[data-open-project="'+Number(project.id)+'"]');
   const originalOverflow=document.body.style.overflow;
   document.body.style.overflow='hidden';
   let index=0,photos=[project.image],closed=false;
   const img=layer.querySelector('.baobab-lightbox-picture img');
   const update=()=>{
     if(closed)return;
     img.src=photos[index];img.alt=project.title+' – Foto '+(index+1)+' von '+photos.length;
     layer.querySelector('[data-photo-counter]').textContent='Foto '+(index+1)+' von '+photos.length;
     layer.querySelectorAll('[data-photo-step]').forEach(b=>b.disabled=photos.length<2);
     layer.querySelector('.baobab-photo-thumbs').innerHTML=photos.map((photo,i)=>
       '<button type="button" data-photo-index="'+i+'" class="'+(i===index?'is-current':'')+'" aria-label="Foto '+(i+1)+' auswählen" aria-pressed="'+(i===index)+'"><img src="'+esc(photo)+'" alt=""></button>').join('');
     layer.querySelectorAll('[data-photo-index]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.photoIndex);update()});
   };
   const close=()=>{if(closed)return;closed=true;document.removeEventListener('keydown',keys);document.body.style.overflow=originalOverflow;layer.remove();focusFrom?.focus()};
   const keys=e=>{if(e.key==='Escape'){e.preventDefault();close()}else if(e.key==='ArrowRight'){index=(index+1)%photos.length;update()}else if(e.key==='ArrowLeft'){index=(index+photos.length-1)%photos.length;update()}};
   layer.querySelector('.baobab-lightbox-close').onclick=close;
   layer.addEventListener('click',e=>{if(e.target===layer)close()});
   layer.querySelectorAll('[data-photo-step]').forEach(b=>b.onclick=()=>{index=(index+Number(b.dataset.photoStep)+photos.length)%photos.length;update()});
   document.addEventListener('keydown',keys);layer.querySelector('.baobab-lightbox-close').focus();update();
   if(Number(project.photo_count)>1){
     fetch(endpoint()+'/project-photos?id='+encodeURIComponent(project.id),{cache:'no-store'})
       .then(async r=>{const data=await r.json();if(!r.ok||data.available!==true||!Array.isArray(data.photos))throw Error('Weitere Bilder sind derzeit nicht erreichbar.');return data.photos})
       .then(rows=>{if(closed)return;photos=[project.image,...rows.map(x=>x.image).filter(photoSafe)];layer.querySelector('.baobab-photo-loading').textContent='';update()})
       .catch(()=>{if(!closed)layer.querySelector('.baobab-photo-loading').textContent='Weitere Bilder konnten nicht geladen werden. Das Titelbild bleibt verfügbar.'});
   }else layer.querySelector('.baobab-photo-loading').textContent='';
 }
 async function render(host){
  if(!host)return;
  host.innerHTML='<div class="baobab-projects-intro"><h2>📸 Unsere Lieblingsprojekte</h2><p>Unsere schönsten Erlebnisse auf einem Zeitstrahl – von früher bis heute.</p></div>'+
    '<div id="baobabProjectGallery" class="baobab-projects-loading" role="status">Unser Fotoalbum wird geöffnet …</div>';
  const gallery=host.querySelector('#baobabProjectGallery');
  try{
   const res=await fetch(endpoint()+'/projects',{cache:'no-store'});
   const json=await res.json();
   if(!res.ok||json.available!==true||!Array.isArray(json.projects))throw Error('Nicht verfügbar');
   if(!gallery.isConnected)return;
   gallery.innerHTML=json.projects.length?polaroids(json.projects):
    '<div class="baobab-projects-empty">🖼️ Unser Album wartet auf das erste Projekt oder Erlebnis.</div>';
   gallery.querySelectorAll('[data-open-project]').forEach(btn=>btn.addEventListener('click',()=>{
     const project=json.projects.find(p=>Number(p.id)===Number(btn.dataset.openProject));
     if(project)openGallery(gallery,project);
   }));
   gallery.querySelectorAll('[data-project-scroll]').forEach(btn=>btn.addEventListener('click',()=>{
     const timeline=gallery.querySelector('.baobab-timeline');
     timeline?.scrollBy({left:Number(btn.dataset.projectScroll)*Math.max(240,timeline.clientWidth*.8),behavior:'smooth'});
   }));
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
   '<label>Titelbild<input type="file" name="image" accept="image/jpeg,image/png,image/webp" required></label>'+
   '<label>Weitere Bilder (optional, höchstens 8)<input type="file" name="extra_images" accept="image/jpeg,image/png,image/webp" multiple><small>Mehrere Bilder gleichzeitig auswählen. Sie erscheinen beim Klick auf das Polaroid.</small></label>'+
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
     data.projects.map(p=>'<article class="admin-project-entry"><strong>'+esc(p.title)+'</strong><span>'+esc(date(p.event_date||p.date))+' · '+Number(p.photo_count||1)+' Fotos</span><button type="button" class="pd-secondary" data-add-project-photos="'+Number(p.id)+'" '+(Number(p.photo_count||1)>=9?'disabled':'')+'>📷 Fotos hinzufügen</button><button type="button" class="pd-secondary" data-delete-project="'+Number(p.id)+'">Löschen</button>'+
     '<div class="admin-extra-photo-form" data-photo-form="'+Number(p.id)+'" hidden><label>Weitere Bilder auswählen<input type="file" accept="image/jpeg,image/png,image/webp" multiple></label><label class="admin-project-permission"><input type="checkbox"> Ich bestätige, dass ich alle ausgewählten Fotos veröffentlichen darf.</label><button type="button" class="pd-action" data-save-project-photos="'+Number(p.id)+'">Fotos hochladen</button><p role="status"></p></div></article>').join('')+'</div>':'<p>Noch keine veröffentlichten Rückblicke.</p>';
    list.querySelectorAll('[data-add-project-photos]').forEach(button=>button.onclick=()=>{
      const panel=list.querySelector('[data-photo-form="'+Number(button.dataset.addProjectPhotos)+'"]');
      if(panel)panel.hidden=!panel.hidden;
    });
    list.querySelectorAll('[data-save-project-photos]').forEach(button=>button.onclick=async()=>{
      const id=Number(button.dataset.saveProjectPhotos);
      const item=data.projects.find(p=>Number(p.id)===id);
      const formArea=list.querySelector('[data-photo-form="'+id+'"]');
      const files=Array.from(formArea.querySelector('input[type="file"]').files||[]);
      const approved=formArea.querySelector('input[type="checkbox"]').checked;
      const message=formArea.querySelector('[role="status"]');
      if(!approved){message.textContent='Bitte die Foto-Freigabe bestätigen.';return}
      if(!files.length){message.textContent='Bitte mindestens ein Bild auswählen.';return}
      if(files.length>9-Number(item?.photo_count||1)){message.textContent='Es sind maximal 9 Fotos pro Erlebnis möglich – einschliesslich Titelbild.';return}
      button.disabled=true;
      let uploaded=0;
      try{
        for(const file of files){
          message.textContent='Bild '+(uploaded+1)+' von '+files.length+' wird verkleinert und hochgeladen …';
          const image=await prepareImage(file);
          const result=await call('/admin-project-photos',{method:'POST',admin:true,body:{project_id:id,image,photo_permission_confirmed:true}});
          if(result.ok!==true)throw Error('Cloudflare hat das Foto nicht bestätigt');
          uploaded++;
        }
        await refresh();
        status.textContent='✅ '+uploaded+' weitere Fotos gespeichert.';
      }catch(err){
        message.textContent=uploaded+' Bild(er) gespeichert. Weitere Fotos nicht hochgeladen: '+String(err.message||err);
        button.disabled=false;
      }
    });
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
    const extras=Array.from(form.elements.extra_images.files||[]);
    if(extras.length>8)throw Error('Bitte höchstens 8 zusätzliche Fotos auswählen.');
    const image=await prepareImage(form.elements.image.files[0]);
    const result=await call('/admin-projects',{admin:true,method:'POST',body:{
      image,date:form.elements.date.value,title:form.elements.title.value.trim(),
      caption:form.elements.caption.value.trim(),photo_permission_confirmed:form.elements.permission.checked
    }});
    if(result.ok!==true||!Number.isSafeInteger(result.id))throw Error('Cloudflare hat die Veröffentlichung nicht bestätigt.');
    let uploaded=0;
    try{
      for(const file of extras){
        status.textContent='Projekt gespeichert. Zusätzliches Bild '+(uploaded+1)+' von '+extras.length+' wird hochgeladen …';
        const extraImage=await prepareImage(file);
        const saved=await call('/admin-project-photos',{admin:true,method:'POST',body:{project_id:result.id,image:extraImage,photo_permission_confirmed:true}});
        if(saved.ok!==true)throw Error('Zusatzfoto konnte nicht gespeichert werden');
        uploaded++;
      }
      form.reset();form.elements.date.value=localDate;
      await refresh();status.textContent='✅ Erlebnis mit '+(uploaded+1)+' Foto(s) veröffentlicht.';
    }catch(err){
      await refresh();status.textContent='⚠️ Titelbild und '+uploaded+' zusätzliche Bilder sind gespeichert. Fehlende Fotos kannst du beim Erlebnis nachträglich hinzufügen. Ursache: '+String(err.message||err);
    }
   }catch(err){status.textContent='Nicht veröffentlicht: '+String(err.message||err)}
   finally{button.disabled=false}
  };
  refresh();
 }
 root.LernSafariProjects={render,adminMount,photoSafe};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.LernSafariProjects;
})(typeof window==='undefined'?globalThis:window);
