import test from 'node:test';
import assert from 'node:assert/strict';
import {createClassroomService} from '../cloudflare-worker/classroom-service.mjs';
const now=Date.parse('2026-11-11T11:00:00Z');
const definitions=[{id:10,kind:'pflicht',target:'game:einmaleins-mix',audience:'all'}];
let trusted=[];
let mode={kind:'subject',subject:'Mathe',required_assignment_ids:[10],expires_at:'2026-11-11T12:00:00Z'};
const store={
 loadMode:async()=>mode,saveMode:async m=>{mode=m},
 assignmentDefinitions:async ids=>definitions.filter(x=>ids.includes(x.id)),
 childAssignments:async()=>definitions,
 studentExists:async n=>n==='Zebra',
 verifiedIds:async()=>[],
 trustedCompletionIds:async()=>trusted,
 setVerification:async()=>{}
};
const service=createClassroomService({
 auth:{requireAdmin:async()=>null,optionalChild:async r=>r.headers.get('Authorization')==='Bearer zebra'?{username:'Zebra'}:null},
 store,catalog:{'einmaleins-mix':'Mathe','rhythmus-trio':'Musik'},now:()=>now
});
async function allowed(game){const r=await service.handle(new Request('https://example.test/classroom-access?game='+game,{headers:{Authorization:'Bearer zebra'}}));return (await r.json()).allowed}
test('only trusted server-verified completions release the subject lock',async()=>{
 trusted=[];
 assert.equal(await allowed('rhythmus-trio'),false);
 trusted=[10];
 assert.equal(await allowed('rhythmus-trio'),true);
});
test('unrelated IDs do not release current subject lock',async()=>{
 trusted=[999];
 assert.equal(await allowed('rhythmus-trio'),false);
});
test('browser-supplied score cannot change server-side completion',async()=>{
 trusted=[];
 const r=await service.handle(new Request('https://example.test/classroom-access?game=rhythmus-trio&score=999&done=10',{headers:{Authorization:'Bearer zebra','X-Game-Score':'999'}}));
 assert.equal((await r.json()).allowed,false);
});
