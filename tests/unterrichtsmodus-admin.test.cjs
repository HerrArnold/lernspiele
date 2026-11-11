'use strict';
const assert=require('node:assert/strict');
const {matchingAssignments,payloadOf,setCatalogForTests}=require('../unterrichtsmodus-admin.js');
setCatalogForTests({Mathe:[{file:'einmaleins-dreier.html'}],Musik:[{file:'rhythmus-trio.html'}]});
const future=new Date(Date.now()+7200000).toISOString();
const old=new Date(Date.now()-7200000).toISOString();
const assignments=[
 {id:1,target:'number:word',kind:'pflicht',start_at:old,end_at:future},
 {id:2,target:'daily:1',kind:'pflicht',start_at:old,end_at:future},
 {id:3,target:'game:einmaleins-dreier',kind:'pflicht',start_at:old,end_at:future},
 {id:4,target:'game:rhythmus-trio',kind:'pflicht',start_at:old,end_at:future},
 {id:5,target:'game:einmaleins-dreier',kind:'zusatz',start_at:old,end_at:future},
 {id:6,target:'game:einmaleins-dreier',kind:'pflicht',start_at:future,end_at:new Date(Date.now()+86400000).toISOString()},
 {id:7,target:'game:rhythmus-trio',kind:'pflicht',start_at:old,end_at:old}
];
assert.deepEqual(matchingAssignments(assignments,'arrival','Mathe').map(x=>x.id),[1,2]);
assert.deepEqual(matchingAssignments(assignments,'subject','Mathe').map(x=>x.id),[3]);
assert.deepEqual(matchingAssignments(assignments,'subject','Musik').map(x=>x.id),[4]);
assert.deepEqual(matchingAssignments(assignments,'free','Mathe'),[]);
let p=payloadOf({kind:'subject',subject:'Mathe',assignmentIds:[3],expiresAt:future});
assert.equal(p.kind,'subject');assert.equal(p.subject,'Mathe');assert.deepEqual(p.required_assignment_ids,[3]);assert.equal(p.require_verified,true);
p=payloadOf({kind:'arrival',assignmentIds:[1,2],expiresAt:future});
assert.equal(p.subject,null);assert.deepEqual(p.required_assignment_ids,[1,2]);
p=payloadOf({kind:'free',assignmentIds:[],expiresAt:future});
assert.equal(p.required_assignment_ids.length,0);
assert.throws(()=>payloadOf({kind:'subject',subject:'Fantasiefach',assignmentIds:[3],expiresAt:future}));
assert.throws(()=>payloadOf({kind:'subject',subject:'Mathe',assignmentIds:[],expiresAt:future}));
assert.throws(()=>payloadOf({kind:'arrival',assignmentIds:[1],expiresAt:old}));
console.log('PASS: Teacher classroom mode selection and safe payloads');
