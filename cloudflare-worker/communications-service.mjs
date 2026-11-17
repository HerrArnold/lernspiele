/* Cloudflare communications service: authenticated routes only.
   Server auth is authoritative; child identity is never read from JSON.
   Presence is an ephemeral "last seen" marker, not surveillance history. */
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const AREA_NAMES=new Set(['camp','map','logbook','lagoon','valley','baobab','oasis','agenda','mail','help','game']);
const validUsername=x=>typeof x==='string'&&x.length>0&&x.length<=80&&/^[\p{L}\p{N} _.-]+$/u.test(x);
export function createCommunicationsService({auth,store,catalog={},now=()=>Date.now()}){
 if(!auth?.requireAdmin||!auth?.optionalChild||!store?.createMessage||!store?.messagesFor||
   !store?.recentMessages||!store?.setActivity||!store?.liveActivity||!store?.studentExists)
   throw Error('Trusted auth and communications storage adapters required');
 const permittedGames=new Set(Object.keys(catalog).filter(id=>/^[a-z0-9-]+$/.test(id)));
 const child=async request=>{
   const identity=await auth.optionalChild(request);
   return validUsername(identity?.username)?identity.username:null;
 };
 const admin=async request=>{
   const identity=await auth.requireAdmin(request);
   return validUsername(identity?.username)?identity.username:null;
 };
 async function handle(request){
   const u=new URL(request.url),p=u.pathname,method=request.method;
   if(!['/admin-messages','/messages','/messages/read','/activity-heartbeat','/admin-live-activity'].includes(p))return null;
   try{
     if(p==='/activity-heartbeat'&&method==='POST'){
       const name=await child(request);
       if(!name)return json({error:'Anmeldung erforderlich'},401);
       const body=await request.json().catch(()=>null);
       if(!body||!AREA_NAMES.has(body.area)||typeof body.game!=='string'||
          body.game.length>80||(body.game&&!permittedGames.has(body.game)))
         return json({error:'Ungültiger Lernbereich'},400);
       if(body.game&&body.area!=='game')return json({error:'Ungültige Aktivität'},400);
       await store.setActivity({username:name,area:body.area,game:body.game||null,at:new Date(now()).toISOString()});
       return json({ok:true});
     }
     if(p==='/admin-live-activity'&&method==='GET'){
       if(!await admin(request))return json({error:'Keine Berechtigung'},403);
       const cutoff=new Date(now()-120000).toISOString();
       const raw=await store.liveActivity(cutoff);
       return json({available:true,students:raw.filter(a=>validUsername(a.username)&&
          AREA_NAMES.has(a.area)&&(!a.game||permittedGames.has(a.game))&&a.last_seen>=cutoff)
          .map(a=>({username:a.username,area:a.area,game:a.game||null,last_seen:a.last_seen}))});
     }
     if(p==='/admin-messages'){
       const teacher=await admin(request);
       if(!teacher)return json({error:'Keine Berechtigung'},403);
       if(method==='GET')return json({available:true,messages:await store.recentMessages()});
       if(method==='POST'){
         const body=await request.json().catch(()=>null);
         const subject=typeof body?.subject==='string'?body.subject.trim():'';
         const message=typeof body?.body==='string'?body.body.trim():'';
         const audience=body?.audience,recipient=audience==='child'?body?.recipient:null;
         const kind=body?.kind===undefined?'message':body.kind;
         if(!['all','child'].includes(audience)||!['message','update','success'].includes(kind)||!subject||subject.length>100||!message||
            message.length>1500||(audience==='child'&&(!validUsername(recipient)||!await store.studentExists(recipient))))
           return json({error:'Empfänger oder Nachricht ungültig'},400);
         if(audience==='all'&&body?.recipient) return json({error:'Empfänger nicht erlaubt'},400);
         const id=await store.createMessage({audience,recipient,kind,subject,body:message,
            author:teacher,at:new Date(now()).toISOString()});
         return json({ok:true,id},201);
       }
     }
     if(p==='/messages/read'&&method==='POST'){
       const name=await child(request);
       if(!name)return json({error:'Anmeldung erforderlich'},401);
       const input=await request.json().catch(()=>null);
       if(!Number.isSafeInteger(input?.id)||input.id<1)return json({error:'Ungültige Nachricht'},400);
       if(typeof store.markRead!=='function')return json({error:'Lesebestätigung noch nicht eingerichtet'},503);
       const okay=await store.markRead(name,input.id,new Date(now()).toISOString());
       return json({ok:okay},okay?200:404);
     }
     if(p==='/messages'&&method==='GET'){
       const name=await child(request);
       if(!name)return json({error:'Anmeldung erforderlich'},401);
       const messages=await store.messagesFor(name);
       return json({available:true,messages:messages.map(m=>({id:m.id,subject:m.subject,
          body:m.body,kind:m.kind||'message',created_at:m.created_at,read_at:m.read_at||null}))});
     }
     return json({error:'Methode nicht erlaubt'},405);
   }catch(_){
     return json({error:'Nachrichten- und Aktivitätsdienst vorübergehend nicht erreichbar'},503);
   }
 }
 return {handle};
}
