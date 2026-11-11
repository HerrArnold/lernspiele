/* Access check on EVERY direct game URL via the shared game bridge.
   This is a pedagogical browser guard for public HTML, not data security.
   Backend contract: GET /classroom-access?game=<id> returns {allowed:boolean,mode:string}.
   Until that endpoint exists, logged-in children can use legacy GET /learning-plan.
   Guests are fail-closed if an authoritative check is unavailable.
*/
'use strict';
(function(root){
 const origin=()=>String(root.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
 const game=decodeURIComponent(root.location.pathname.split('/').pop().replace(/\.html$/i,''));
 const key='lernsafari-token-v1';
 let stopped=false, checking=false, lastAllowed=false;
 const token=()=>{try{return root.localStorage.getItem(key)||''}catch(_){return ''}};
 function gameAllowedFromPlan(data){
  if(!data||typeof data!=='object')return false;
  if(root.LernSafariFocusGate?.makeState)return root.LernSafariFocusGate.makeState(data,{}).allowGame(game);
  const m=data.classroomMode;
  if(m&&['arrival','subject','free','closed'].includes(m.kind)){
   if(m.expires_at&&Date.parse(m.expires_at)<=Date.now())return true;
   if(m.kind==='free')return true;
   if(m.kind==='closed')return false;
   const ids=new Set(Array.isArray(m.required_assignment_ids)?m.required_assignment_ids.map(Number):[]);
   const required=(Array.isArray(data.assignments)?data.assignments:[]).filter(a=>ids.has(Number(a.id)));
   const verified=new Set((Array.isArray(data.verified)?data.verified:[]).map(Number));
   const done=new Set((Array.isArray(data.done)?data.done:[]).map(Number));
   const acknowledged=m.require_verified===false?done:verified;
   const pending=required.some(a=>!acknowledged.has(Number(a.id)));
   if(!pending&&required.length===ids.size&&ids.size>0)return true;
   return required.some(a=>a.target==='game:'+game);
  }
  const blocks=Array.isArray(data.blocks)?data.blocks:[];
  const assignments=Array.isArray(data.assignments)?data.assignments:[];
  const done=new Set((Array.isArray(data.done)?data.done:[]).map(Number));
  const required=assignments.filter(a=>a.kind==='pflicht');
  if(!blocks.length||!required.length||required.every(a=>done.has(Number(a.id))))return true;
  if(assignments.some(a=>a.target==='game:'+game))return true;
  if(game.startsWith('schach-'))return !blocks.includes('schach');
  return !blocks.includes('andere-spiele');
 }
 function shield(){
  let el=root.document.getElementById('safari-game-access-shield');
  if(el)return el;
  el=root.document.createElement('div');el.id='safari-game-access-shield';
  el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  el.style.cssText='position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:22px;background:#162b26f7;color:#fff;font-family:system-ui,Arial,sans-serif;text-align:center';
  el.innerHTML='<div style="max-width:520px"><h1 style="font-size:26px">🦩 LernSafari</h1><p id="safari-game-access-status">Die Freigabe für dieses Spiel wird geprüft …</p><a href="../index.html" style="display:inline-block;padding:12px 18px;background:#f8e3b1;border-radius:12px;color:#23352e;font-weight:750;text-decoration:none">Zurück zur LernSafari</a></div>';
  root.document.body.append(el);return el;
 }
 function show(message){
  stopped=true;
  const el=shield();el.hidden=false;
  el.querySelector('#safari-game-access-status').textContent=message;
 }
 async function request(path,t){
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7000);
  try{
   const res=await fetch(origin()+path,{headers:t?{Authorization:'Bearer '+t}:{},cache:'no-store',signal:controller.signal});
   if(!res.ok)throw new Error('HTTP '+res.status);
   return res.json();
  }finally{clearTimeout(timeout)}
 }
 async function check(){
  if(checking)return;checking=true;
  // Keep an already authorised game visible while a routine recheck runs.
  // If permission is revoked, the result below shows the shield immediately.
  if(!lastAllowed)shield().hidden=false;
  try{
   const t=token();let data=null;
   try{data=await request('/classroom-access?game='+encodeURIComponent(game),t)}
   catch(err){
    if(!t)throw err; // Guest access must be affirmatively allowed by Worker.
    const plan=await request('/learning-plan',t);
    data={allowed:gameAllowedFromPlan(plan)};
   }
   if(!data||data.allowed!==true){lastAllowed=false;show(!t?'🔒 Bitte melde dich mit deinem Tierkonto an. Während einer Unterrichtsphase ist der Gastzugang zu Lernspielen nicht freigegeben.':'🔒 Dieses Spiel ist gerade nicht freigegeben. Bearbeite zuerst deine offenen To-dos im Logbuch.');return;}
   stopped=false;lastAllowed=true;shield().hidden=true;
  }catch(_){
   lastAllowed=false;show('Die Freigabe konnte nicht sicher geprüft werden. Bitte gehe zur LernSafari zurück oder frage die Lehrperson.');
  }finally{checking=false}
 }
 root.LernSafariGameAccess={check,isAllowed:()=>!stopped&&lastAllowed,game,gameAllowedFromPlan};
 shield();check();
 root.addEventListener('focus',check);
 root.document.addEventListener('visibilitychange',()=>{if(!root.document.hidden)check()});
 root.setInterval(()=>{if(!root.document.hidden)check()},15000);
})(window);
