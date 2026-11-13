'use strict';(()=>{
const $=s=>document.querySelector(s),mode=window.OASE_ART_MODE,canvas=$('#canvas'),ctx=canvas.getContext('2d'),palette=['#283b2e','#d34d3b','#f3b137','#f4e7a4','#4f9a61','#67b7ce','#5b72bc','#9668b5','#bc7956','#ffffff'];let color=palette[0],drawing=false,last=null,stack=[],guideVisible=true;
const shapes={sonne:'<circle cx="680" cy="160" r="70" fill="none" stroke="#555" stroke-width="6"/><path d="M680 42v-30 M680 277v30 M565 160h-30 M794 160h30 M598 78l-25-25 M762 78l25-25 M598 243l-25 25 M762 243l25 25 M50 440Q260 370 470 450T910 430 M50 520 Q240 450 410 525T910 515" fill="none" stroke="#555" stroke-width="7"/><path d="M170 468 L170 330 M130 380 Q170 325 210 380 M140 400Q170 370 205 400" fill="none" stroke="#555" stroke-width="7"/>',baum:'<path d="M400 540L422 300L310 240L260 190M422 300L520 260L595 170M420 330L360 270L260 255M520 270L620 275" fill="none" stroke="#555" stroke-width="14" stroke-linecap="round"/><path d="M220 220Q160 125 270 110Q320 25 450 90Q565 25 630 135Q715 140 690 230Q635 285 535 240Q420 295 330 255Q250 280 220 220Z" fill="none" stroke="#555" stroke-width="7"/><path d="M150 545Q460 500 800 545" fill="none" stroke="#555" stroke-width="7"/>',vogel:'<path d="M250 335Q230 250 360 245Q470 180 590 260Q655 330 580 405Q470 455 370 395Z" fill="none" stroke="#555" stroke-width="7"/><path d="M455 315Q530 245 575 328Q550 410 450 385Z" fill="none" stroke="#555" stroke-width="6"/><circle cx="332" cy="286" r="12" fill="none" stroke="#555" stroke-width="6"/><path d="M250 310L160 340L245 350M490 412L500 505M535 415L545 505M470 505h65 M520 505h65" fill="none" stroke="#555" stroke-width="6"/>',haus:'<path d="M245 535V300L470 145L695 300V535Z" fill="none" stroke="#555" stroke-width="7"/><path d="M210 320L470 125L735 320M300 535V400H415V535M530 340h110v95H530Z M470 145V535" fill="none" stroke="#555" stroke-width="7"/><path d="M100 540h760 M120 310l40-100l40 100" fill="none" stroke="#555" stroke-width="5"/>'};
const snapshot=()=>{try{if(stack.length>25)stack.shift();stack.push(ctx.getImageData(0,0,960,600))}catch{}};
function white(){ctx.fillStyle='#fff';ctx.fillRect(0,0,960,600)}white();snapshot();
$('#palette').innerHTML=palette.map((c,i)=>'<button class="o-swatch" aria-label="Farbe '+(i+1)+'" style="background:'+c+'" data-color="'+c+'" aria-pressed="'+(i===0)+'"></button>').join('');$('#palette').querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;$('#palette').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'))});
function point(e){const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*960/rect.width,y:(e.clientY-rect.top)*600/rect.height}}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);snapshot();drawing=true;last=point(e);ctx.beginPath();ctx.arc(last.x,last.y,Number($('#brush').value)/2,0,Math.PI*2);ctx.fillStyle=$('#tool').value==='erase'?'#fff':color;ctx.fill()});canvas.addEventListener('pointermove',e=>{if(!drawing)return;const next=point(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(next.x,next.y);ctx.lineWidth=Number($('#brush').value)*2;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=$('#tool').value==='erase'?'#fff':color;ctx.stroke();last=next});canvas.addEventListener('pointerup',()=>drawing=false);canvas.addEventListener('pointercancel',()=>drawing=false);
$('#undo').onclick=()=>{if(stack.length>1)ctx.putImageData(stack.pop(),0,0);else if(stack.length===1){ctx.putImageData(stack[0],0,0);stack=[]}};
$('#clear').onclick=()=>{if(!confirm('Deine Zeichnung wirklich löschen?'))return;snapshot();white()};
$('#save').onclick=()=>{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=mode==='frei'?'mein-kunstwerk.png':'meine-zeichenschule.png';a.click()};
if(mode==='vorlage'){
  const templates=window.OASE_ART_TEMPLATES||{},overlay=$('#guideOverlay'),preview=$('#referencePreview');
  let lastUrl=null;
  const items=Object.entries(templates);
  if(items.length){
    $('#motif').innerHTML=items.map(([id,v])=>'<option value="'+id+'">'+v.name+'</option>').join('');
    function setMotif(){
      const v=templates[$('#motif').value];if(!v)return;
      const url=URL.createObjectURL(new Blob([v.svg],{type:'image/svg+xml;charset=utf-8'}));
      overlay.src=url;preview.src=url;if(lastUrl)setTimeout(()=>URL.revokeObjectURL(lastUrl),1000);
      lastUrl=url;
    }
    setMotif();$('#motif').onchange=setMotif;
  }
  $('#guide').onclick=()=>{
    guideVisible=!guideVisible;
    overlay.style.display=guideVisible?'block':'none';
    $('#guide').textContent=guideVisible?'Hilfslinien verstecken':'Hilfslinien zeigen';
  };
}
})();