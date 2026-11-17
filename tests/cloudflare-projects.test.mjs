import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectService} from '../cloudflare-worker/projects-service.mjs';
function fixture(){
 const entries=[],photos=[];
 const store={
  listProjects:async()=>entries.map(e=>({...e,photo_count:photos.filter(x=>x.project_id===e.id).length})).slice().reverse(),
  projectExists:async id=>entries.some(x=>x.id===id),
  listPhotos:async id=>photos.filter(x=>x.project_id===id).slice().sort((a,b)=>a.id-b.id),
  photoCount:async id=>photos.filter(x=>x.project_id===id).length,
  addPhoto:async({projectId,image,by,at})=>{const id=photos.length?Math.max(...photos.map(x=>x.id))+1:1;photos.push({id,project_id:projectId,image_data:image,by,at});return id},
  deletePhoto:async id=>{const i=photos.findIndex(x=>x.id===id);if(i<0)return false;photos.splice(i,1);return true},
  addProject:async row=>{const id=entries.length+1;entries.push({...row,event_date:row.date,image_data:row.image,id});return id},
  deleteProject:async id=>{const n=entries.findIndex(x=>x.id===id);if(n<0)return false;entries.splice(n,1);for(let i=photos.length-1;i>=0;i--)if(photos[i].project_id===id)photos.splice(i,1);return true}
 };
 const service=createProjectService({auth:{requireAdmin:async r=>r.headers.get('X-Teacher')==='yes'?{username:'Teacher'}:null},store});
 async function call(path,method='GET',body,teacher=false){
   const r=await service.handle(new Request('https://example.test'+path,{method,headers:teacher?{'X-Teacher':'yes'}:{},body:body?JSON.stringify(body):undefined}));
   return {status:r.status,body:await r.json()};
 }
 return {call,entries,photos};
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
test('More photos can be attached and browsed without replacing the original cover',async()=>{
 const f=fixture();
 assert.equal((await f.call('/admin-projects','POST',publish,true)).status,201);
 assert.equal((await f.call('/admin-project-photos','POST',{project_id:1,image:photo,photo_permission_confirmed:true})).status,403);
 for(let i=0;i<3;i++){
  const res=await f.call('/admin-project-photos','POST',{project_id:1,image:photo,photo_permission_confirmed:true},true);
  assert.equal(res.status,201);
 }
 const publicList=await f.call('/projects');
 assert.equal(publicList.body.projects[0].photo_count,4);
 assert.equal(publicList.body.projects[0].image,photo);
 const gallery=await f.call('/project-photos?id=1');
 assert.equal(gallery.status,200);
 assert.equal(gallery.body.photos.length,3);
 assert.equal((await f.call('/admin-project-photos','DELETE',{id:2})).status,403);
 assert.equal((await f.call('/admin-project-photos','DELETE',{id:2},true)).status,200);
 assert.equal((await f.call('/projects')).body.projects[0].photo_count,3);
 assert.equal((await f.call('/admin-projects','DELETE',{id:1},true)).status,200);
 assert.equal((await f.call('/project-photos?id=1')).status,404);
});
test('Invalid attachments and overfull galleries are rejected',async()=>{
 const f=fixture();
 await f.call('/admin-projects','POST',publish,true);
 for(const payload of [
  {project_id:1,image:photo,photo_permission_confirmed:false},
  {project_id:9,image:photo,photo_permission_confirmed:true},
  {project_id:1,image:'data:image/svg+xml;base64,YQ==',photo_permission_confirmed:true},
  {project_id:1,image:photo.repeat(3000),photo_permission_confirmed:true}
 ]){
  const r=await f.call('/admin-project-photos','POST',payload,true);
  assert.ok([400,404].includes(r.status));
 }
 for(let i=0;i<8;i++)assert.equal((await f.call('/admin-project-photos','POST',{project_id:1,image:photo,photo_permission_confirmed:true},true)).status,201);
 assert.equal((await f.call('/admin-project-photos','POST',{project_id:1,image:photo,photo_permission_confirmed:true},true)).status,409);
 assert.equal((await f.call('/project-photos?id=../../secrets')).status,400);
});
test('Unknown route is passed to the existing Worker',async()=>{
 const f=fixture();assert.equal(await createProjectService({auth:{requireAdmin:async()=>null},store:{listProjects:async()=>[],addProject:async()=>{},deleteProject:async()=>{},listPhotos:async()=>[],addPhoto:async()=>{},deletePhoto:async()=>{},projectExists:async()=>false,photoCount:async()=>0}}).handle(new Request('https://x.test/learning-plan')),null);
});
