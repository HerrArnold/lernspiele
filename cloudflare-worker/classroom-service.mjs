/* LernSafari classroom extension for the EXISTING Cloudflare Worker.
   NOT a standalone Worker entrypoint: existing authentication and assignment
   queries must be supplied by trusted server-side adapters.
   No student or admin authorization is ever accepted from client JSON. */
const SUBJECTS=new Set(['Mathe','Deutsch','NMG','Musik','Englisch']);
const MODES=new Set(['arrival','subject','free','closed']);
const MS_DAY=86400000;
const numberId=id=>Number.isSafeInteger(Number(id))&&Number(id)>0?Number(id):null;
const idsOf=items=>[...new Set((Array.isArray(items)?items:[]).map(numberId).filter(Boolean))];
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const denied=()=>json({error:'Keine Berechtigung'},403);
const invalid=s=>json({error:s},400);
const safeKind=x=>MODES.has(x)?x:'free';
function activeMode(record,at=Date.now()){
 if(!record||!MODES.has(record.kind))return {kind:'free',subject:null,required_assignment_ids:[],require_verified:true,expires_at:null};
 const expires=Date.parse(record.expires_at||'');
 if(record.expires_at&&(!Number.isFinite(expires)||expires<=at))return {kind:'free',subject:null,required_assignment_ids:[],require_verified:true,expires_at:null};
 return {kind:record.kind,subject:record.kind==='subject'?record.subject:null,
   required_assignment_ids:idsOf(record.required_assignment_ids),require_verified:true,
   expires_at:record.expires_at||null};
}
function matchTarget(target,mode,subject,gameSubjects){
 if(mode==='arrival')return target==='page:aufgaben'||target.startsWith('daily:')||target.startsWith('number:');
 if(mode==='subject'&&target.startsWith('game:'))return gameSubjects[target.slice(5)]===subject;
 return false;
}
function validForChild(assignment,username,now){
 if(!assignment||assignment.kind!=='pflicht')return false;
 if(!(assignment.audience==='all'||assignment.audience==='child'&&assignment.username===username))return false;
 if(assignment.start_at&&Date.parse(assignment.start_at)>now)return false;
 if(assignment.end_at&&Date.parse(assignment.end_at)<=now)return false;
 return true;
}
function requiredForChild(mode,assignments,username,gameSubjects,now){
 const selected=new Set(mode.required_assignment_ids);
 return (Array.isArray(assignments)?assignments:[]).filter(a=>selected.has(numberId(a.id))&&
  validForChild(a,username,now)&&matchTarget(String(a.target||''),mode.kind,mode.subject,gameSubjects)).map(a=>numberId(a.id));
}
function evaluate(mode,plan,game,gameSubjects){
 if(mode.kind==='free')return true;
 if(mode.kind==='closed')return false;
 const assignments=Array.isArray(plan?.assignments)?plan.assignments:[];
 const required=idsOf(mode.required_assignment_ids);
 const verified=new Set(idsOf(plan?.verified));
 const unfinished=required.length===0||required.some(id=>!verified.has(id));
 if(!unfinished)return true;
 return assignments.some(a=>required.includes(numberId(a.id))&&a.target==='game:'+game);
}
/* Required adapters:
 auth.requireAdmin(request) -> verified admin {username} | null
 auth.optionalChild(request) -> verified child {username} | null
 store.loadMode(), store.saveMode(mode,adminUsername)
 store.assignmentDefinitions(ids) -> server-side assignments, including audience/time
 store.childAssignments(username) -> active assignments for child
 store.verifiedIds(username) -> teacher-verified assignment IDs
 store.studentExists(username) -> true only for a current class account
 store.setVerification({username,assignmentId,verified,adminUsername}) -> persisted
 catalog {gameId:subject} must be from server allowlist, NOT request input.
*/
export function createClassroomService({auth,store,catalog,now=()=>Date.now()}){
 if(!auth?.requireAdmin||!auth?.optionalChild||!store?.loadMode||!store?.saveMode||
    !store?.assignmentDefinitions||!store?.childAssignments||!store?.studentExists||!store?.verifiedIds||!store?.setVerification||
    !catalog||typeof catalog!=='object')throw Error('Trusted Worker adapters required');
 const games=new Map(Object.entries(catalog).filter(([id])=>/^[a-z0-9-]+$/.test(id)));
 async function mode(){return activeMode(await store.loadMode(),now())}
 async function childPlan(username,basePlan){
  const saved=await store.loadMode();
  const m=activeMode(saved,now());
  const assignments=await store.childAssignments(username);
  const allowed=requiredForChild(m,assignments,username,Object.fromEntries(games),now());
  const verified=idsOf(await store.verifiedIds(username));
  // Until the teacher explicitly enables a mode, preserve the existing
  // /learning-plan focus rules instead of accidentally overriding them with 'free'.
  if(!saved)return {...basePlan,assignments,verified};
  return {...basePlan,assignments,verified,classroomMode:{...m,required_assignment_ids:allowed}};
 }
 async function handle(request){
  const url=new URL(request.url),route=url.pathname,method=request.method;
  if(!['/admin-classroom-mode','/admin-verify-assignment','/classroom-access'].includes(route))return null;
  try{
   if(route==='/classroom-access'&&method==='GET'){
    const game=url.searchParams.get('game')||'';
    if(!games.has(game))return json({allowed:false},200);
    const saved=await store.loadMode();
    const current=activeMode(saved,now());
    const child=await auth.optionalChild(request);
    // No explicit mode yet: the new endpoint MUST NOT claim that a guest is
    // free to bypass old focus rules. Until migration, use the legacy child
    // plan in the browser and keep anonymous direct-game access closed.
    if(!saved)return json({allowed:false},200);
    if(!child?.username)return json({allowed:current.kind==='free'},200);
    const p=await childPlan(child.username,{});
    return json({allowed:evaluate(p.classroomMode,p,game,Object.fromEntries(games))});
   }
   const admin=await auth.requireAdmin(request);
   if(!admin?.username)return denied();
   if(route==='/admin-classroom-mode'&&method==='GET')return json({available:true,classroomMode:await mode()});
   if(route==='/admin-classroom-mode'&&method==='POST'){
    const body=await request.json().catch(()=>null);
    if(!body||!MODES.has(body.kind))return invalid('Ungültiger Unterrichtsmodus');
    if(body.kind==='subject'&&!SUBJECTS.has(body.subject))return invalid('Unbekanntes Schulfach');
    const expires=Date.parse(body.expires_at||'');
    if(!Number.isFinite(expires)||expires<=now()||expires>now()+MS_DAY)return invalid('Endzeit muss innerhalb der nächsten 24 Stunden liegen');
    if(body.require_verified===false)return invalid('Pflichtaufträge benötigen überprüfte Erledigung');
    const isDuty=body.kind==='subject'||body.kind==='arrival';
    const requested=idsOf(body.required_assignment_ids);
    if(isDuty&&(!requested.length||requested.length!==body.required_assignment_ids?.length))return invalid('Gültige Pflichtaufträge fehlen');
    const definitions=isDuty?await store.assignmentDefinitions(requested):[];
    if(isDuty&&(definitions.length!==requested.length||definitions.some(a=>!requested.includes(numberId(a.id))||
       a.kind!=='pflicht'||(a.start_at&&Date.parse(a.start_at)>now())||
       (a.end_at&&Date.parse(a.end_at)<=now())||
       !matchTarget(String(a.target||''),body.kind,body.subject,Object.fromEntries(games)))))
       return invalid('Aufträge passen nicht zu diesem Modus');
    const saved={kind:body.kind,subject:body.kind==='subject'?body.subject:null,
      required_assignment_ids:isDuty?requested:[],require_verified:true,expires_at:new Date(expires).toISOString()};
    await store.saveMode(saved,admin.username);
    return json({available:true,classroomMode:saved});
   }
   if(route==='/admin-verify-assignment'&&method==='POST'){
    const body=await request.json().catch(()=>null);
    const id=numberId(body?.assignment_id),username=String(body?.username||'');
    if(!id||!username||username.length>80||!/^[\p{L}\p{N} _.-]+$/u.test(username)||typeof body.verified!=='boolean')return invalid('Ungültige Freigabe');
    const defs=await store.assignmentDefinitions([id]);
    if(!await store.studentExists(username)||defs.length!==1||!validForChild(defs[0],username,now()))return invalid('Auftrag nicht für dieses Tierkonto gültig');
    await store.setVerification({username,assignmentId:id,verified:body.verified,adminUsername:admin.username});
    return json({ok:true});
   }
   return json({error:'Methode nicht erlaubt'},405);
  }catch(error){
   // Never leak internal credentials, schema, or student information.
   return json({error:'Unterrichtssteuerung zurzeit nicht erreichbar'},503);
  }
 }
 return {handle,childPlan,activeMode:mode};
}
export {activeMode,requiredForChild,evaluate,matchTarget,validForChild};
