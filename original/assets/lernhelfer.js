'use strict';
/* Lernhelfer: nur für angemeldete Tierkonten. Keine öffentliche Bestenliste. */
(()=>{
const onHome=!location.pathname.includes('/spiele/');
const api=()=>String(window.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cache=new Map();let eligible=false,refreshing=false,queue=null;
function token(){try{return localStorage.getItem('lernsafari-token-v1')||'';}catch(_){return '';}}
function clean(){document.querySelectorAll('.ls-helper-card').forEach(x=>x.remove());}
async function me(){if(!token()){eligible=false;clean();return false;}
 if(onHome){eligible=window.SafariLogin?.auth()?.role==='child';if(!eligible)clean();return eligible;}
 try{const r=await fetch(api()+'/me',{headers:{Authorization:'Bearer '+token()},cache:'no-store'});const d=await r.json();eligible=r.ok&&d.role==='child';}catch(_){eligible=false;}if(!eligible)clean();return eligible;}
function targetForCard(el){if(el.classList.contains('daily-task'))return 'daily:'+el.id.replace('exercise-','');if(el.classList.contains('zdt-task'))return 'number:'+el.dataset.step;return '';}
function currentDate(){const name=document.getElementById('today-label')?.textContent||'';const match=/(\d{1,2})\.(\d{1,2})\.(20\d\d)/.exec(name);
 if(match)return `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
 const named=/(\d{1,2})\.\s+([A-Za-zÄÖÜäöü]+)\s+(20\d\d)/.exec(name);
 if(named){const months={januar:1,februar:2,märz:3,april:4,mai:5,juni:6,juli:7,august:8,september:9,oktober:10,november:11,dezember:12};const month=months[named[2].toLocaleLowerCase('de-CH')];if(month)return `${named[3]}-${String(month).padStart(2,'0')}-${named[1].padStart(2,'0')}`;}
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
async function peers(target,date){const key=target+'|'+date,prior=cache.get(key);if(prior&&Date.now()-prior.time<300000)return prior.names;
 const search=new URLSearchParams({target});if(date)search.set('date',date);
 try{const r=await fetch(api()+'/learning-helpers?'+search,{headers:{Authorization:'Bearer '+token()},cache:'no-store'});if(!r.ok)return [];
  const d=await r.json();const names=(d.helpers||[]).filter(n=>!['flamingo','löwe','loewe'].includes(String(n).toLocaleLowerCase('de-CH'))).slice(0,3);cache.set(key,{names,time:Date.now()});return names;
 }catch(_){return [];}}
function show(el,target,date){if(!el.isConnected||!eligible||el.querySelector('.ls-helper-card'))return;
 const panel=document.createElement('aside');panel.className='ls-helper-card';panel.setAttribute('aria-label','Lernhelfer');
 panel.innerHTML='<button type="button" class="ls-helper-open">🌟 Lernhelfer anzeigen</button><span class="ls-helper-result" role="status"></span>';
 const button=panel.querySelector('.ls-helper-open'),result=panel.querySelector('.ls-helper-result');
 button.onclick=async()=>{
  if(!eligible)return;button.disabled=true;result.textContent='Lernhelfer werden gesucht …';
  try{const names=await peers(target,date);
   result.textContent=names.length?'Diese Kinder können dir beim Üben helfen:':'Für diese Aufgabe gibt es noch keine Lernhelfer-Empfehlung.';
   if(names.length){const namesHost=document.createElement('div');namesHost.className='ls-helper-names';
    for(const name of names){const badge=document.createElement('span');badge.textContent=name;namesHost.append(badge)}
    result.after(namesHost)}
   button.hidden=true;
  }catch(_){result.textContent='Die Lernhelfer konnten nicht geladen werden.';button.disabled=false}
 };
 if(el.classList.contains('top')){el.insertAdjacentElement('afterend',panel);return;}const heading=el.querySelector('.task-head')||el.querySelector('h3');if(heading)heading.insertAdjacentElement('afterend',panel);else el.prepend(panel);
}
async function fill(){if(refreshing||!eligible)return;refreshing=true;
 try{if(onHome){
   if(location.hash==='#tiere'){
     const quiz=document.querySelector('#animal-quiz:not(.feature-hidden) .feature-panel');
     if(quiz&&!quiz.querySelector('.ls-helper-card')){
       const label=quiz.querySelector('.quiz-progress')?.textContent||'';
       const name=label.split('·')[0].trim();const animal=(window.SAFARI_ANIMALS||[]).find(a=>a.name===name);
       const target=animal?'game:tierwelt-'+animal.id:label.startsWith('Tiernamen schreiben')?'game:tier-namen':'';
       if(target)show(quiz,target,'');
     }
     const memory=document.querySelector('#memory-game.memory-active');
     if(memory&&!memory.querySelector('.ls-helper-card'))show(memory,'game:tier-memory','');
     return;
   }
   if(!['#aufgaben',''].includes(location.hash)&&!location.hash.startsWith('#aufgaben'))return;
   const cards=[...document.querySelectorAll('#daily-tasks .daily-task[id^="exercise-"]'),...document.querySelectorAll('#zahl-des-tages .zdt-task[data-step]')];
   // Keine alten Helfer auf neue, wöchentlich wechselnde Tagesaufgaben übertragen.
   const date=currentDate();for(const card of cards){if(!card.isConnected||card.querySelector('.ls-helper-card'))continue;const target=targetForCard(card);show(card,target,target.startsWith('daily:')?date:'');}
 }else{const s=location.pathname.split('/').pop()?.replace('.html','')||'';const h=document.querySelector('main .top, main header, .game-header, .game-top, header.top, main h1');if(!h||document.querySelector('.ls-helper-card'))return;show(h,'game:'+s,'');}}
 finally{refreshing=false;}}
function schedule(){clearTimeout(queue);queue=setTimeout(()=>{void fill();},360);}
async function reset(){eligible=false;clean();cache.clear();await me();schedule();}
function init(){void reset();window.addEventListener('safari-auth-change',reset);window.addEventListener('hashchange',schedule);
 if(onHome){for(const id of ['daily-tasks','zahl-des-tages','animal-quiz','memory-game']){const el=document.getElementById(id);if(el)new MutationObserver(changes=>{if(changes.some(c=>[...c.addedNodes].some(n=>n.nodeType===1&&!n.classList?.contains('ls-helper-card')&&!n.closest?.('.ls-helper-card'))))schedule();}).observe(el,{childList:true,subtree:true});}}
 setInterval(()=>{if(eligible&&document.visibilityState==='visible'){document.querySelectorAll('.ls-helper-card').forEach(x=>x.remove());schedule();}},300000);
}
document.addEventListener('DOMContentLoaded',init);
})();
