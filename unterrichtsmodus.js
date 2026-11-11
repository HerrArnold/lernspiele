/* LernSafari: compatibility gate for existing Cloudflare focus rules.
   This is a classroom navigation restriction, not an access-control boundary.
   Student submissions do NOT imply verified mastery. */
'use strict';
(function(root){
 const arr=x=>Array.isArray(x)?x:[];
 const text=x=>String(x??'');
 const normalizeDone=x=>new Set(arr(x).map(v=>typeof v==='object'?Number(v?.assignment_id??v?.id):Number(v)).filter(Number.isFinite));
 const gameId=x=>text(x?.file).replace(/\.html$/i,'');
 function gameMap(original){
  const map=new Map();
  for(const [subject,games] of Object.entries(original||{}))for(const game of arr(games))if(gameId(game))map.set(gameId(game),{subject,title:game.title});
  return map;
 }
 // Future authoritative contract: sent by Cloudflare, never inferred from a client flag.
 // On old Workers, no classroomMode is returned: the legacy policy stays active.
 function classroomState(plan,original,now=new Date()){
  const mode=plan?.classroomMode;
  if(!mode||!['arrival','subject','free','closed'].includes(mode.kind))return null;
  const expires=Date.parse(mode.expires_at||'');
  const expired=Number.isFinite(expires)&&expires<=new Date(now).getTime();
  const kind=expired?'free':mode.kind;
  const tasks=arr(plan?.assignments).filter(a=>a&&typeof a.target==='string');
  const done=normalizeDone(plan?.done);
  const verified=normalizeDone(plan?.verified);
  const requiredIds=arr(mode.required_assignment_ids).map(Number).filter(Number.isSafeInteger);
  const required=requiredIds.map(id=>tasks.find(a=>Number(a.id)===id)).filter(Boolean);
  // An unknown/expired task identifier must never silently count as finished.
  const missing=requiredIds.filter(id=>!tasks.some(a=>Number(a.id)===id));
  const requireVerified=mode.require_verified!==false;
  const pending=required.filter(a=>!(requireVerified?verified:done).has(Number(a.id)));
  const restricted=kind==='closed'||(kind!=='free'&&(pending.length>0||missing.length>0||requiredIds.length===0));
  const allowed=new Set(required.map(a=>a.target));
  const catalog=gameMap(original);
  const assignedGames=[...allowed].filter(x=>x.startsWith('game:')).map(x=>({id:x.slice(5),...catalog.get(x.slice(5))}));
  const subjects=new Set(assignedGames.map(x=>x.subject).filter(Boolean));
  const daily=[...allowed].some(x=>x.startsWith('daily:')||x.startsWith('number:')||x==='page:aufgaben');
  const subjectCodes={math:'Mathe',german:'Deutsch',nmg:'NMG',music:'Musik',english:'Englisch'};
  const allowTarget=x=>!restricted||kind!=='closed'&&allowed.has(x);
  const allowDestination=area=>{
   if(!restricted||area==='camp'||area==='map')return true;
   if(kind==='closed')return false;
   if(area==='valley')return daily;
   if(area==='lagoon')return assignedGames.some(x=>x.subject!=='Allgemein');
   if(area==='oasis')return assignedGames.some(x=>x.subject==='Allgemein');
   if(area==='baobab')return ['page:tiere','page:advent'].some(x=>allowed.has(x));
   return false;
  };
  const allowSubject=code=>!restricted||kind!=='closed'&&subjects.has(subjectCodes[code]||code);
  const allowGame=id=>!restricted||kind!=='closed'&&allowed.has('game:'+id);
  return {kind,focus:kind!=='free',restricted,pending,missing,requiredIds,
   assigned:allowed,assignedGames,hasDaily:daily,subjects,allowTarget,allowDestination,allowSubject,allowGame,
   verificationRequired:requireVerified,expired};
 }
 function makeState(plan,original){
  const modern=classroomState(plan,original);
  if(modern)return modern;
  const blocks=arr(plan?.blocks).filter(x=>typeof x==='string');
  const tasks=arr(plan?.assignments).filter(a=>a&&typeof a.target==='string');
  const done=normalizeDone(plan?.done);
  const pending=tasks.filter(a=>a.kind==='pflicht'&&!done.has(Number(a.id)));
  const focus=blocks.length>0;
  // The legacy Worker has no explicit arrival/subject-mode contract.
  // A restriction can be enforced in the new UI only when focus rules and
  // an outstanding required task both exist.
  const restricted=focus&&pending.length>0;
  const assigned=new Set(tasks.map(a=>a.target));
  const games=gameMap(original);
  const assignedGames=[...assigned].filter(v=>v.startsWith('game:')).map(v=>({...games.get(v.slice(5)),id:v.slice(5)}));
  const hasDaily=[...assigned].some(v=>v.startsWith('daily:')||v.startsWith('number:')||v==='page:aufgaben');
  const subjects=new Set(assignedGames.map(g=>g.subject));
  const allowTarget=(target)=>!restricted||assigned.has(target)||target==='page:aufgaben'&&hasDaily;
  const allowDestination=(area)=>{
   if(!restricted||area==='camp'||area==='map')return true;
   if(area==='valley')return hasDaily;
   if(area==='lagoon')return assignedGames.some(g=>g.subject!=='Allgemein');
   if(area==='oasis')return assignedGames.some(g=>g.subject==='Allgemein');
   if(area==='baobab')return ['page:tiere','page:advent'].some(v=>assigned.has(v));
   return false;
  };
  const subjectCodes={math:'Mathe',german:'Deutsch',nmg:'NMG',music:'Musik',english:'Englisch'};
  const allowSubject=code=>!restricted||subjects.has(subjectCodes[code]||code);
  const allowGame=id=>!restricted||assigned.has('game:'+id);
  return {focus,restricted,blocks,pending,assigned,assignedGames,hasDaily,subjects,allowTarget,allowDestination,allowSubject,allowGame};
 }
 root.LernSafariFocusGate={makeState,gameMap,classroomState};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.LernSafariFocusGate;
})(typeof window==='undefined'?globalThis:window);
