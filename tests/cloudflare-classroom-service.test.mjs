import assert from 'node:assert/strict';
import {createClassroomService,activeMode} from '../cloudflare-worker/classroom-service.mjs';
const at=Date.parse('2026-11-11T08:00:00Z');
const available=[{id:1,kind:'pflicht',target:'number:word',audience:'all'},{id:2,kind:'pflicht',target:'game:einmaleins-dreier',audience:'all'},{id:3,kind:'pflicht',target:'game:rhythmus-trio',audience:'child',username:'Zebra'},{id:4,kind:'zusatz',target:'game:rhythmus-trio',audience:'all'}];
let current=null;
const verified=new Map();
const service=createClassroomService({
 now:()=>at,
 catalog:{'einmaleins-dreier':'Mathe','einmaleins-mix':'Mathe','rhythmus-trio':'Musik'},
 auth:{requireAdmin:async r=>r.headers.has('x-school-admin')?{username:'teacher'}:null,optionalChild:async r=>r.headers.get('x-test-child')?{username:r.headers.get('x-test-child')}:null},
 store:{
  loadMode:async()=>current,saveMode:async mode=>{current=mode},
  assignmentDefinitions:async ids=>available.filter(a=>ids.includes(a.id)),
  childAssignments:async name=>available.filter(a=>a.audience==='all'||a.username===name),
  studentExists:async name=>['Zebra','Loewe'].includes(name),
  verifiedIds:async name=>[...(verified.get(name)||new Set())],
  setVerification:async ({username,assignmentId,verified:yes})=>{const ids=verified.get(username)||new Set();if(yes)ids.add(assignmentId);else ids.delete(assignmentId);verified.set(username,ids)}
 }
});
const req=(route,method='GET',body,headers={})=>new Request('https://example.invalid'+route,{method,headers,body:body?JSON.stringify(body):undefined});
async function call(r){const x=await service.handle(r);return {status:x.status,data:await x.json()}}
assert.equal((await call(req('/classroom-access?game=einmaleins-dreier'))).data.allowed,false,'without a teacher-selected mode, guests cannot bypass legacy focus');
const legacy=await service.childPlan('Zebra',{blocks:['andere-spiele'],done:[]});
assert.equal(legacy.classroomMode,undefined,'existing legacy focus data must not be overridden before activation');
assert.equal((await call(req('/admin-classroom-mode'))).status,403);
const mode={kind:'subject',subject:'Mathe',required_assignment_ids:[2],expires_at:'2026-11-11T09:00:00Z'};
assert.equal((await call(req('/admin-classroom-mode','POST',mode,{'x-school-admin':'1'}))).status,200);
assert.equal((await call(req('/classroom-access?game=einmaleins-dreier'))).data.allowed,false);
assert.equal((await call(req('/classroom-access?game=einmaleins-dreier','GET',null,{'x-test-child':'Zebra'}))).data.allowed,true);
assert.equal((await call(req('/classroom-access?game=einmaleins-mix','GET',null,{'x-test-child':'Zebra'}))).data.allowed,true,'the entire selected subject is accessible');
assert.equal((await call(req('/classroom-access?game=rhythmus-trio','GET',null,{'x-test-child':'Zebra'}))).data.allowed,false);
assert.equal((await call(req('/admin-verify-assignment','POST',{username:'Zebra',assignment_id:2,verified:true},{'x-school-admin':'1'}))).status,200);
assert.equal((await call(req('/classroom-access?game=rhythmus-trio','GET',null,{'x-test-child':'Zebra'}))).data.allowed,true);
assert.equal((await call(req('/classroom-access?game=rhythmus-trio','GET',null,{'x-test-child':'Loewe'}))).data.allowed,false);
assert.equal((await call(req('/admin-classroom-mode','POST',{...mode,required_assignment_ids:[4]},{'x-school-admin':'1'}))).status,400);
assert.equal((await call(req('/admin-classroom-mode','POST',{...mode,subject:'NMG'},{'x-school-admin':'1'}))).status,400);
assert.equal((await call(req('/admin-verify-assignment','POST',{username:'Loewe',assignment_id:3,verified:true},{'x-school-admin':'1'}))).status,400);
assert.equal((await call(req('/admin-classroom-mode','POST',{kind:'free',expires_at:mode.expires_at},{'x-school-admin':'1'}))).status,200);
assert.equal((await call(req('/classroom-access?game=einmaleins-dreier'))).data.allowed,false,'login is required even in Entdeckungszeit');
assert.equal((await call(req('/classroom-access?game=einmaleins-dreier','GET',null,{'x-test-child':'Zebra'}))).data.allowed,true);
assert.equal(activeMode({kind:'subject',expires_at:'2026-11-10T09:00:00Z'},at).kind,'free');
console.log('PASS classroom worker logic');
