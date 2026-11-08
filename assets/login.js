'use strict';
/* GitHub Pages frontend – credentials are checked ONLY by the private Cloudflare Worker. */
(()=>{
 // Fallback für GitHub Pages: Auch bei verzögertem oder zwischengespeichertem
 // Laden der Konfigurationsdatei bleibt die API-Adresse verfügbar.
 const apiUrl=()=>String(window.LERNSAFARI_BACKEND_URL||
   'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
 const $=id=>document.getElementById(id);
 const esc=v=>String(v).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 let identity=null,token=null,scores={},ready=false;
 const imageNames={'Chamäleon':'Chamaeleon','Löwe':'Loewe'};
 const iconFor=name=>'assets/login-tiere/'+encodeURIComponent(imageNames[name]||name)+'.webp';
 function emit(){window.dispatchEvent(new CustomEvent('safari-auth-change',{detail:{identity}}));}
 function auth(){return identity}
 async function request(path,method='GET',data){const config=apiUrl();if(!config)throw Error('Die Cloudflare-Verbindung ist nicht eingerichtet.');
   const opts={method,headers:{'content-type':'application/json'}};if(token)opts.headers.Authorization='Bearer '+token;
   if(data!==undefined)opts.body=JSON.stringify(data);
   const res=await fetch(config+path,opts);let parsed;try{parsed=await res.json()}catch(_){throw Error('Keine gültige Antwort vom Server.')}
   if(!res.ok)throw Error(parsed.error||'Verbindung fehlgeschlagen');return parsed;
 }
 function display(){
   const title=$('login-greeting'),logout=$('logout-btn');if(!title)return;
   if(identity){title.innerHTML=`<span class="welcome-main">Willkommen <img class="login-user-icon" src="${iconFor(identity.username)}" alt="" onerror="this.style.display='none'"> <strong>${esc(identity.username)}</strong> auf der <strong>LernSafari!</strong></span>`;logout.hidden=false}
   else{title.innerHTML='<span class="welcome-main">Willkommen auf der <strong>LernSafari!</strong></span><span class="welcome-login"><button type="button" class="inline-login" id="login-open"><u><b>Hier</b></u></button> kannst du dich anmelden.</span>';logout.hidden=true;$('login-open').addEventListener('click',()=>{$('login-dialog').hidden=false;$('login-username').focus()})}
 }
 async function login(user,pwd){const result=await request('/login','POST',{username:user,password:pwd});token=result.token;identity={username:result.username,role:result.role};try{localStorage.setItem('lernsafari-token-v1',token)}catch(_){};try{const data=await request('/highscores');scores=Object.fromEntries(data.highscores.map(x=>[x.game,x.score]));}catch(_){scores={}}display();emit();return result}
 async function logout(){try{await request('/logout','POST',{})}catch(_){}token=null;identity=null;scores={};try{localStorage.removeItem('lernsafari-token-v1')}catch(_){};display();emit()}
 async function restore(){try{token=localStorage.getItem('lernsafari-token-v1')}catch(_){token=null};if(token&&apiUrl()){try{identity=await request('/me');const data=await request('/highscores');scores=Object.fromEntries(data.highscores.map(x=>[x.game,x.score]));}catch(_){identity=null;token=null;try{localStorage.removeItem('lernsafari-token-v1')}catch(_){}}}ready=true;display();emit();}
 async function dayState(date){if(!identity||identity.role==='admin')return null;return request('/daily-state?date='+encodeURIComponent(date))}
 async function recordDay(payload){if(!identity||identity.role==='admin')return null;return request('/daily-event','POST',payload)}
 async function recordScore(game,score){if(!identity||identity.role==='admin')return null;if(score<=Number(scores[game]||0))return null;const data=await request('/game-score','POST',{game,score});scores[game]=score;return data}
 async function adminRequest(path,method='GET',data){
    let token='';try{token=sessionStorage.getItem('lernsafari-admin-token-v2')||''}catch(_){};
    if(!token)throw Error('Admin-Code erforderlich.');
    const opts={method,headers:{'content-type':'application/json','X-Safari-Admin':token}};
    if(data!==undefined)opts.body=JSON.stringify(data);
    const res=await fetch(apiUrl()+path,opts);
    let response;try{response=await res.json()}catch(_){throw Error('Keine Serverantwort')}
    if(!res.ok)throw Error(response.error||'Admin-Zugriff fehlgeschlagen');
    return response;
 }
 async function adminUnlock(password){
    const res=await request('/admin-unlock','POST',{password});
    sessionStorage.setItem('lernsafari-admin-token-v2',res.token);
    return res;
 }
 async function getAdminReport(){return adminRequest('/admin-report')}
 async function getAdminNotes(){return adminRequest('/admin-notes')}
 async function saveAdminNotes(content){return adminRequest('/admin-notes','POST',{content})}
 async function verifyAdmin(){return adminRequest('/admin-session')}
 
 async function getScores(){if(!identity)return {};const data=await request('/highscores');scores=Object.fromEntries(data.highscores.map(x=>[x.game,x.score]));return scores}
 window.SafariLogin={auth,request,login,logout,dayState,recordDay,recordScore,getAdminReport,getAdminNotes,saveAdminNotes,adminUnlock,verifyAdmin,getScores,score:game=>Number(scores[game]||0),isConfigured:()=>!!apiUrl(),ready:()=>ready};
 window.addEventListener('DOMContentLoaded',()=>{
   const dlg=$('login-dialog');$('login-close').onclick=()=>dlg.hidden=true;dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.hidden=true});
   $('logout-btn').onclick=logout;
   $('login-form').addEventListener('submit',async e=>{e.preventDefault();const msg=$('login-message');msg.textContent='Anmeldung wird geprüft …';try{await login($('login-username').value,$('login-password').value);$('login-password').value='';dlg.hidden=true;}catch(error){msg.textContent=error.message}});
   restore();
 });
})();
