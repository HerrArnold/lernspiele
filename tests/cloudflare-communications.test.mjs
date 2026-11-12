import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommunicationsService} from '../cloudflare-worker/communications-service.mjs';
const origin='https://example.test';
function fixture(){
 const messages=[],activities=new Map(),users=new Set(['Loewe','Zebra']);
 let clock=Date.parse('2026-11-11T14:00:00Z');
 const auth={
   requireAdmin:async r=>r.headers.get('X-Test-Admin')==='teacher'?{username:'Lehrperson'}:null,
   optionalChild:async r=>{const h=r.headers.get('Authorization');return h==='Bearer loewe'?{username:'Loewe'}:h==='Bearer zebra'?{username:'Zebra'}:null}
 };
 const store={
   studentExists:async u=>users.has(u),
   createMessage:async m=>{messages.push({id:messages.length+1,...m});return messages.length},
   messagesFor:async u=>messages.filter(m=>m.audience==='all'||m.recipient===u).map(m=>({id:m.id,subject:m.subject,body:m.body,created_at:m.at})),
   recentMessages:async()=>messages.map(m=>({id:m.id,audience:m.audience,recipient:m.recipient,subject:m.subject,created_at:m.at})),
   setActivity:async a=>{activities.set(a.username,a)},
   liveActivity:async cutoff=>[...activities.values()].filter(a=>a.at>=cutoff).map(a=>({...a,last_seen:a.at}))
 };
 const service=createCommunicationsService({auth,store,catalog:{'einmaleins-mix':'Mathe','hoerverstehen-dachs':'Deutsch'},now:()=>clock});
 async function request(path,method='GET',body,who){
  const headers={'Content-Type':'application/json'};
  if(who==='teacher')headers['X-Test-Admin']='teacher';
  else if(who)headers['Authorization']='Bearer '+who;
  const r=await service.handle(new Request(origin+path,{method,headers,body:body?JSON.stringify(body):undefined}));
  return {status:r.status,body:await r.json()};
 }
 return {request,forward:milliseconds=>clock+=milliseconds,messages,activities};
}
test('no anonymous or child teacher access',async()=>{
 const f=fixture();
 assert.equal((await f.request('/admin-messages')).status,403);
 assert.equal((await f.request('/admin-messages','POST',{audience:'all',subject:'x',body:'hi'},'loewe')).status,403);
 assert.equal((await f.request('/messages')).status,401);
 assert.equal((await f.request('/admin-live-activity','GET',null,'loewe')).status,403);
 assert.equal((await f.request('/activity-heartbeat','POST',{area:'camp',game:''})).status,401);
});
test('teacher messages are scoped to intended child or whole class',async()=>{
 const f=fixture();
 assert.equal((await f.request('/admin-messages','POST',{audience:'child',recipient:'Loewe',subject:'Hallo',body:'Dein Auftrag'},'teacher')).status,201);
 assert.equal((await f.request('/messages','GET',null,'loewe')).body.messages.length,1);
 assert.equal((await f.request('/messages','GET',null,'zebra')).body.messages.length,0);
 assert.equal((await f.request('/admin-messages','POST',{audience:'all',subject:'Heute',body:'Willkommen'},'teacher')).status,201);
 assert.equal((await f.request('/messages','GET',null,'zebra')).body.messages.length,1);
 assert.equal((await f.request('/admin-messages','GET',null,'teacher')).body.messages.length,2);
});
test('wrong recipient, unknown student and empty messages are rejected',async()=>{
 const f=fixture();
 for(const body of [
   {audience:'child',recipient:'Unbekannt',subject:'x',body:'text'},
   {audience:'child',recipient:'Zebra',subject:' ',body:'text'},
   {audience:'all',recipient:'Loewe',subject:'x',body:'text'},
   {audience:'all',subject:'x',body:' '},
   {audience:'all',subject:'x',body:'a'.repeat(1501)}
 ]) assert.equal((await f.request('/admin-messages','POST',body,'teacher')).status,400);
 assert.equal(f.messages.length,0);
});
test('activity identity comes from authenticated session, expires in 2 minutes',async()=>{
 const f=fixture();
 assert.equal((await f.request('/activity-heartbeat','POST',{area:'game',game:'einmaleins-mix',username:'Zebra'},'loewe')).status,200);
 assert.deepEqual([...f.activities.keys()],['Loewe']);
 let res=await f.request('/admin-live-activity','GET',null,'teacher');
 assert.equal(res.body.students.length,1);
 assert.equal(res.body.students[0].username,'Loewe');
 f.forward(121000);
 res=await f.request('/admin-live-activity','GET',null,'teacher');
 assert.equal(res.body.students.length,0);
});
test('unknown games and unexpected pages cannot be reported',async()=>{
 const f=fixture();
 for(const data of [{area:'game',game:'../../secret'},{area:'unknown',game:''},{area:'camp',game:'einmaleins-mix'}])
   assert.equal((await f.request('/activity-heartbeat','POST',data,'zebra')).status,400);
 assert.equal(f.activities.size,0);
});
