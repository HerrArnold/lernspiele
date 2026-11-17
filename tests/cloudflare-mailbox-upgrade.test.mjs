import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommunicationsService} from '../cloudflare-worker/communications-service.mjs';

function fixture(){
 const all=[],reads=new Map();
 const auth={
  requireAdmin:async r=>r.headers.get('X-Teacher')==='yes'?{username:'Flamingo'}:null,
  optionalChild:async r=>r.headers.get('Authorization')==='Bearer affe'?{username:'Affe'}:
    r.headers.get('Authorization')==='Bearer zebra'?{username:'Zebra'}:null
 };
 const store={
  studentExists:async name=>['Affe','Zebra'].includes(name),
  createMessage:async m=>{all.push({id:all.length+1,...m,created_at:m.at});return all.length},
  messagesFor:async name=>all.filter(m=>m.audience==='all'||m.recipient===name).map(m=>({...m,read_at:reads.get(name+':'+m.id)||null})),
  recentMessages:async()=>all.slice().reverse(),
  markRead:async(name,id,at)=>{const m=all.find(x=>x.id===id);if(!m||(m.audience==='child'&&m.recipient!==name))return false;reads.set(name+':'+id,at);return true},
  setActivity:async()=>{},liveActivity:async()=>[]
 };
 const service=createCommunicationsService({auth,store,catalog:{}});
 async function req(path,method='GET',body,role){
  const headers={'content-type':'application/json'};
  if(role==='admin')headers['X-Teacher']='yes';
  else if(role)headers.Authorization='Bearer '+role;
  const response=await service.handle(new Request('https://example.com'+path,{method,headers,body:body?JSON.stringify(body):undefined}));
  return {status:response.status,data:await response.json()};
 }
 return {req,all,reads};
}
test('empty mailbox is genuinely empty',async()=>{
 const f=fixture(),r=await f.req('/messages','GET',null,'affe');
 assert.equal(r.status,200);assert.deepEqual(r.data.messages,[]);
});
test('teacher can send three types; child only sees own and class letters',async()=>{
 const f=fixture();
 for(const kind of ['message','update','success']){
  const r=await f.req('/admin-messages','POST',{kind,audience:'child',recipient:'Affe',subject:kind,body:'Gute Arbeit'},'admin');
  assert.equal(r.status,201);
 }
 const all=await f.req('/messages','GET',null,'affe');
 assert.deepEqual(all.data.messages.map(m=>m.kind),['message','update','success']);
 assert.equal((await f.req('/messages','GET',null,'zebra')).data.messages.length,0);
 assert.equal((await f.req('/admin-messages','POST',{kind:'invalid',audience:'all',subject:'x',body:'y'},'admin')).status,400);
 assert.equal((await f.req('/admin-messages','POST',{kind:'success',audience:'all',subject:'Gemeinsam stark',body:'Super!'},'admin')).status,201);
 assert.equal((await f.req('/messages','GET',null,'zebra')).data.messages[0].kind,'success');
});
test('read flags are per child and cannot be forged for another child message',async()=>{
 const f=fixture();
 await f.req('/admin-messages','POST',{audience:'child',recipient:'Affe',kind:'success',subject:'Erfolg',body:'Gut gemacht!'},'admin');
 await f.req('/admin-messages','POST',{audience:'all',kind:'update',subject:'Neu',body:'Neues Spiel'},'admin');
 assert.equal((await f.req('/messages/read','POST',{id:1},'zebra')).status,404);
 assert.equal((await f.req('/messages/read','POST',{id:2},'affe')).status,200);
 assert.equal((await f.req('/messages','GET',null,'affe')).data.messages.find(x=>x.id===2).read_at!==null,true);
 assert.equal((await f.req('/messages','GET',null,'zebra')).data.messages[0].read_at,null);
 assert.equal((await f.req('/messages','GET',null,'affe')).data.messages.find(x=>x.id===1).read_at,null);
 assert.equal((await f.req('/messages/read','POST',{id:1})).status,401);
 assert.equal((await f.req('/messages/read','POST',{id:-2},'affe')).status,400);
});
test('source contains no sample inbox letters and projects use time order',async()=>{
 const fs=await import('node:fs');
 const app=fs.readFileSync('app.js','utf8');
 const projects=fs.readFileSync('baobab-projects.js','utf8');
 const source=fs.readFileSync('cloudflare-integration.js','utf8');
 assert.ok(!app.includes('Persönlicher Demobrief'));
 assert.match(projects,/baobab-timeline/);
 assert.match(source,/LernSafariExtras\.mailbox/);
 assert.match(source,/LernSafariExtras\.logbook/);
 assert.match(source,/LernSafariProjects\.adminMount/);
});
