/* Count visits only on an intentional click, not while browsing or polling. */
'use strict';
(function(root){
 let queued=Promise.resolve();
 function track(area,content){
  if(typeof state==='undefined'||state.role!=='cloudflare-child')return;
  if(!['lagoon','oasis','baobab'].includes(area))return;
  if(typeof content!=='string'||!/^[-a-z0-9:]{2,90}$/.test(content))return;
  let token='';
  try{token=root.localStorage.getItem('lernsafari-token-v1')||''}catch(_){}
  if(!/^[a-f0-9]{64}$/.test(token))return;
  const endpoint=String(root.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
  queued=queued.catch(()=>{}).then(()=>root.fetch(endpoint+'/learning-visit',{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    body:JSON.stringify({area,content}),cache:'no-store',keepalive:true
  }).then(()=>{}).catch(()=>{}));
 }
 root.LernSafariTrackVisit=track;
})(window);
