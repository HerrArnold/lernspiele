/* Public published projects + authenticated teacher writes.
   Photos are data-URL JPEG/PNG/WEBP, at most 220000 encoded bytes per image.
   WARNING: do not upload identifiable children without appropriate permission. */
const send=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const maxEncoded=220000;
export function createProjectService({auth,store,now=()=>Date.now()}){
 if(!auth?.requireAdmin||!store?.listProjects||!store?.addProject||!store?.deleteProject)throw Error('Authenticated project adapters required');
 const validImage=data=>typeof data==='string'&&data.length<=maxEncoded&&
  /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/]+={0,2}$/.test(data);
 const validDate=d=>typeof d==='string'&&/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'));
 async function handle(request){
  const url=new URL(request.url),route=url.pathname,method=request.method;
  if(!['/projects','/admin-projects'].includes(route))return null;
  try{
   if(route==='/projects'&&method==='GET'){
    const rows=await store.listProjects();
    return send({available:true,projects:rows.map(p=>({id:p.id,date:p.event_date,title:p.title,caption:p.caption,image:p.image_data}))});
   }
   if(route==='/admin-projects'){
    const identity=await auth.requireAdmin(request);
    if(!identity?.username)return send({error:'Keine Berechtigung'},403);
    if(method==='GET')return send({available:true,projects:await store.listProjects()});
    if(method==='POST'){
     const data=await request.json().catch(()=>null);
     const date=data?.date,title=typeof data?.title==='string'?data.title.trim():'';
     const caption=typeof data?.caption==='string'?data.caption.trim():'';
     if(!validDate(date)||!title||title.length>90||caption.length>180||!validImage(data?.image)||
        data?.photo_permission_confirmed!==true)return send({error:'Datum, Text, Bildformat oder Foto-Freigabe ungültig'},400);
     const id=await store.addProject({date,title,caption,image:data.image,by:identity.username,at:new Date(now()).toISOString()});
     return send({ok:true,id},201);
    }
    if(method==='DELETE'){
     const data=await request.json().catch(()=>null);
     if(!Number.isSafeInteger(data?.id)||data.id<1)return send({error:'Ungültiger Eintrag'},400);
     const removed=await store.deleteProject(data.id);
     return send({ok:removed},removed?200:404);
    }
   }
   return send({error:'Methode nicht erlaubt'},405);
  }catch(_){return send({error:'Projekte derzeit nicht erreichbar'},503)}
 }
 return {handle};
}
