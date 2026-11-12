import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectService} from '../cloudflare-worker/projects-service.mjs';
function fixture(){
 const entries=[];
 const store={
  listProjects:async()=>entries.slice().reverse(),
  addProject:async row=>{const id=entries.length+1;entries.push({...row,event_date:row.date,image_data:row.image,id});return id},
  deleteProject:async id=>{const n=entries.findIndex(x=>x.id===id);if(n<0)return false;entries.splice(n,1);return true}
 };
 const service=createProjectService({auth:{requireAdmin:async r=>r.headers.get('X-Teacher')==='yes'?{username:'Teacher'}:null},store});
 async function call(path,method='GET',body,teacher=false){
   const r=await service.handle(new Request('https://example.test'+path,{method,headers:teacher?{'X-Teacher':'yes'}:{},body:body?JSON.stringify(body):undefined}));
   return {status:r.status,body:await r.json()};
 }
 return {call,entries};
}
const photo='data:image/jpeg;base64,'+'a'.repeat(100);
const publish={date:'2026-11-11',title:'Ausflug',caption:'Wir haben viel entdeckt.',image:photo,photo_permission_confirmed:true};
test('Only the teacher publishes or deletes; guests see only published photos',async()=>{
 const f=fixture();
 assert.equal((await f.call('/admin-projects','POST',publish)).status,403);
 assert.equal((await f.call('/admin-projects','POST',publish,true)).status,201);
 const list=await f.call('/projects');assert.equal(list.body.projects.length,1);
 assert.equal(list.body.projects[0].title,'Ausflug');
 assert.equal((await f.call('/admin-projects','DELETE',{id:1})).status,403);
 assert.equal((await f.call('/admin-projects','DELETE',{id:1},true)).status,200);
 assert.equal((await f.call('/projects')).body.projects.length,0);
});
test('Rejects uploading photos without permission confirmation',async()=>{
 const f=fixture();
 for(const payload of [{...publish,photo_permission_confirmed:false},{...publish,image:'<img src=x>'},{...publish,date:'2026-13-99'},{...publish,title:''},{...publish,image:'data:image/svg+xml;base64,PHN2Zz4='},{...publish,image:'data:image/jpeg;base64,'+'a'.repeat(220100)}]){
  assert.equal((await f.call('/admin-projects','POST',payload,true)).status,400);
 }
 assert.equal(f.entries.length,0);
});
test('Unknown route is passed to the existing Worker',async()=>{
 const f=fixture();assert.equal(await createProjectService({auth:{requireAdmin:async()=>null},store:{listProjects:async()=>[],addProject:async()=>{},deleteProject:async()=>{}}}).handle(new Request('https://x.test/learning-plan')),null);
});
