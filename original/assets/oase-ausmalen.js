/* Oase Ausmalstudio · hochwertige SVG-Vorlagen aus CC BY-SA 4.0 Sammlung.
   Eigenständige lokale Füllfunktion. Auch offline ohne Fetch verwendbar. */
'use strict';
(()=>{
 const $=s=>document.querySelector(s), board=$('#board'),ctx=board.getContext('2d',{willReadFrequently:true});
 const templates=window.OASE_ART_TEMPLATES||{};
 const palette=['#dc5546','#e99239','#f7c75b','#fbec93','#6fa85b','#3f8069','#79bdca','#457dbc','#8265a9','#ba81ab','#9c6948','#ffffff','#303b34'];
 let color=palette[0],selected='',revision=0,undoStack=[];
 const status=(msg)=>{const el=$('#status');if(el)el.textContent=msg};
 const names=Object.entries(templates);
 if(!names.length){status('Die Vorlagen konnten nicht geladen werden.');return}
 $('#motif').innerHTML=names.map(([key,v])=>'<option value="'+key+'">'+v.name+'</option>').join('');
 $('#palette').innerHTML=palette.map((c,i)=>'<button type="button" class="o-swatch" data-color="'+c+'" aria-label="Farbe '+(i+1)+'" aria-pressed="'+(i===0?'true':'false')+'" style="background:'+c+'"></button>').join('');
 $('#palette').querySelectorAll('[data-color]').forEach(b=>b.addEventListener('click',()=>{
  color=b.dataset.color;$('#palette').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 }));
 function snapshot(){undoStack.push(ctx.getImageData(0,0,board.width,board.height));if(undoStack.length>10)undoStack.shift()}
 function initial(){
  const key=$('#motif').value||names[0][0],v=templates[key];if(!v)return;
  selected=key;const call=++revision;status('Vorlage wird geladen …');undoStack=[];
  const blob=new Blob([v.svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),img=new Image();
  img.onload=()=>{
   if(call!==revision){URL.revokeObjectURL(url);return}
   ctx.fillStyle='#fff';ctx.fillRect(0,0,board.width,board.height);
   const margin=32,ratio=Math.min((board.width-2*margin)/img.width,(board.height-2*margin)/img.height);
   const w=Math.round(img.width*ratio),h=Math.round(img.height*ratio);
   ctx.drawImage(img,(board.width-w)/2,(board.height-h)/2,w,h);
   URL.revokeObjectURL(url);status('Wähle eine Farbe und klicke auf eine weisse Fläche.');
  };
  img.onerror=()=>{URL.revokeObjectURL(url);status('Diese Vorlage konnte nicht geöffnet werden. Wähle ein anderes Motiv.')};
  img.src=url;
 }
 function fillAt(x,y){
  const w=board.width,h=board.height;if(x<0||x>=w||y<0||y>=h)return;
  const image=ctx.getImageData(0,0,w,h),data=image.data,seed=(y*w+x)*4;
  const sample=[data[seed],data[seed+1],data[seed+2]],target=[1,3,5].map((v,i)=>parseInt(color.slice(v,v+2),16));
  // Schwarze Umrisse bleiben erhalten. Es können nur helle bzw. bereits gefärbte Flächen angeklickt werden.
  if(Math.max(...sample)<130){status('Das ist eine Umrisslinie. Klicke in eine helle Fläche.');return}
  if(sample.every((v,i)=>Math.abs(v-target[i])<8))return;
  snapshot();const queue=new Int32Array(w*h),seen=new Uint8Array(w*h);let head=0,tail=0;
  const allow=i=>{
   if(i<0||i>=w*h||seen[i])return false;
   const k=i*4;const dr=data[k]-sample[0],dg=data[k+1]-sample[1],db=data[k+2]-sample[2];
   return dr*dr+dg*dg+db*db<=38*38*3 && data[k+3]>=180;
  };
  const enqueue=i=>{if(!allow(i))return;seen[i]=1;queue[tail++]=i};
  enqueue(y*w+x);
  while(head<tail){
   const i=queue[head++],p=i*4;data[p]=target[0];data[p+1]=target[1];data[p+2]=target[2];data[p+3]=255;
   if(i%w>0)enqueue(i-1);if(i%w<w-1)enqueue(i+1);
   if(i>=w)enqueue(i-w);if(i<w*(h-1))enqueue(i+w);
  }
  if(tail<4){undoStack.pop();status('Wähle eine grössere Fläche innerhalb des Motivs.');return}
  ctx.putImageData(image,0,0);status('Super! Du kannst weitere Flächen ausmalen.');
 }
 board.addEventListener('pointerdown',e=>{e.preventDefault();const rect=board.getBoundingClientRect();fillAt(Math.floor((e.clientX-rect.left)*board.width/rect.width),Math.floor((e.clientY-rect.top)*board.height/rect.height))});
 $('#motif').addEventListener('change',initial);
 $('#reset').onclick=()=>{if(confirm('Möchtest du alle Farben dieses Bildes entfernen?'))initial()};
 $('#undo').onclick=()=>{const last=undoStack.pop();if(last){ctx.putImageData(last,0,0);status('Letzte Farbe rückgängig gemacht.')}else status('Es gibt nichts rückgängig zu machen.')};
 $('#save').onclick=()=>{const link=document.createElement('a');link.download='LernSafari-Ausmalbild-'+selected+'.png';link.href=board.toDataURL('image/png');link.click()};
 initial();
})();