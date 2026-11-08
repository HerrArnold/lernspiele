'use strict';
/* Highscore viewer/recorder. Existing game mechanics are untouched. */
(()=>{
 const game=location.pathname.split('/').pop().replace(/\.html$/,'');
 const apiOrigin=(window.LERNSAFARI_BACKEND_URL||'').replace(/\/+$/,'');
 const id='lernsafari-token-v1';const home='../index.html#aktuelle';
 let profile=null,high=0,highestSent=0,lastObserved=0,pending=false;
 const banner=document.createElement('div');banner.className='highscore-banner';banner.innerHTML='<strong>Persönlicher Highscore: <span id="safari-score">–</span></strong><span id="safari-score-info" class="highscore-note">Melde dich an, um deinen Fortschritt zu speichern.</span>';
 function show(){banner.querySelector('#safari-score').textContent=profile?String(high):'–';banner.querySelector('#safari-score-info').textContent=profile?'Dein bester Punktestand ist gespeichert.':'Melde dich an, um deinen Fortschritt zu speichern.'}
 async function call(path,data){const t=localStorage.getItem(id);if(!t||!apiOrigin)return null;const r=await fetch(apiOrigin+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:data?JSON.stringify(data):undefined});if(!r.ok)throw Error('Backend nicht erreichbar');return r.json()}
 async function load(){try{profile=await call('/me');if(profile&&profile.role==='child'){const vals=await call('/highscores');high=Number(vals.highscores.find(x=>x.game===game)?.score||0);highestSent=high}else profile=null;}catch(_){profile=null;}show()}
 function currentScore(){const selector=['#streak','#highscore','#progress'];for(const s of selector){let el=document.querySelector(s);if(el){const m=(el.textContent||'').match(/Richtig:\s*(\d+)/i);if(m)return Number(m[1]);}}return null}
 function monitor(){if(pending)return;const val=currentScore();if(val===null)return;if(val>lastObserved)lastObserved=val;
   if(profile&&profile.role==='child'&&val>high&&val>highestSent){const next=val;highestSent=next;pending=true;call('/game-score',{game,score:next}).then(()=>{high=Math.max(high,next);show()}).catch(()=>{highestSent=high;show()}).finally(()=>pending=false)}
 }
 window.addEventListener('DOMContentLoaded',()=>{const bar=document.querySelector('.safari-exit-bar');if(bar)bar.insertAdjacentElement('afterend',banner);else document.body.prepend(banner);load();for(const selector of ['#streak','#highscore','#progress']){const target=document.querySelector(selector);if(target){new MutationObserver(monitor).observe(target,{childList:true,characterData:true,subtree:true})}}setInterval(monitor,1100);});
})();
