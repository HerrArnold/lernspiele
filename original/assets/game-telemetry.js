/* LernSafari Lernversuche: sicher zur D1-Schnittstelle, nur bei angemeldeten Kinderkonten. */
(()=>{'use strict';
const game=decodeURIComponent(location.pathname.split('/').pop().replace(/\.html$/,''));
const api=()=>String(window.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
let chain=Promise.resolve();
const small=(v,n=300)=>String(v??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
async function send(data){
 let token='';try{token=localStorage.getItem('lernsafari-token-v1')||''}catch(_){};
 if(!token)return;
 const res=await fetch(api()+'/game-attempt',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({game,...data})});
 if(!res.ok){const j=await res.json().catch(()=>({}));throw Error(j.error||'Lernversuch konnte nicht gespeichert werden');}
}
window.SafariTelemetry={
 record(p){const d={task:small(p.task||'Aufgabe',140),correct:p.correct===true,correctCount:p.correctCount??(p.correct?1:0),total:p.total??1,answer:small(p.answer),expected:small(p.expected),details:small(p.details)};
   // Read-only notification to the embedding prototype; no pupil identity is transmitted.
   if(window.parent!==window){try{window.parent.postMessage({source:'LernSafariOriginal',action:'demoAttempt',game,correct:d.correct,task:d.task},location.origin==='null'?'*':location.origin)}catch(_){}}
   // One queue per page prevents reversing the submission order.
   chain=chain.catch(()=>{}).then(()=>send(d)).catch(err=>{console.warn('LernSafari Speicherung:',err.message);});return chain;
 },
 game,
};
})();
