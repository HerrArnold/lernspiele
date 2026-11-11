'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../original/assets/game-zugang.js'),'utf8');
const bridge=fs.readFileSync(path.join(__dirname,'../original/assets/new-safari-bridge.js'),'utf8');
assert.match(bridge,/game-zugang\.js/,'Every game bridge must load the access guard');
assert.match(bridge,/window\.parent===window/,'Legacy iframe navigation bridge remains');
async function run({token='',publicResponse,plan}){
 const state={status:'',shield:null,urls:[]};
 const doc={
  hidden:false,
  body:{append(el){state.shield=el}},
  getElementById(id){return id==='safari-game-access-shield'?state.shield:null},
  createElement(){return {id:'',style:{},hidden:false,setAttribute(){},querySelector(){return {set textContent(x){state.status=x}}}}},
  addEventListener(){}
 };
 const root={
  document:doc,location:{pathname:'/lernsafari-test/original/spiele/einmaleins-dreier.html'},
  localStorage:{getItem(){return token}},
  addEventListener(){},setInterval(){},LERNSAFARI_BACKEND_URL:'https://example.test'
 };
 const fetch=async(url)=>{
  state.urls.push(url);
  if(url.includes('/classroom-access?'))return publicResponse===undefined?{ok:false,status:404}: {ok:true,json:async()=>publicResponse};
  if(url.includes('/learning-plan'))return {ok:true,json:async()=>plan};
  throw Error('unexpected request');
 };
 vm.runInNewContext(src,{window:root,fetch,AbortController,setTimeout,clearTimeout,Date,decodeURIComponent,encodeURIComponent});
 await new Promise(resolve=>setImmediate(resolve));
 return {state,allowed:root.LernSafariGameAccess.isAllowed()};
}
(async()=>{
 let r=await run({publicResponse:{allowed:true}});
 assert.equal(r.allowed,true,'Free public mode must permit guests when the server confirms');
 r=await run({publicResponse:{allowed:false}});
 assert.equal(r.allowed,false,'Active classroom restriction denies guest');
 r=await run({});
 assert.equal(r.allowed,false,'Without authoritative public API guest must not bypass class mode');
 r=await run({token:'child-token',plan:{blocks:['andere-spiele'],assignments:[
  {id:1,kind:'pflicht',target:'game:rhythmus-trio'}],done:[]}});
 assert.equal(r.allowed,false,'Existing worker blocks an unrelated directly opened game');
 assert.ok(r.state.urls.some(u=>u.includes('/learning-plan')));
 r=await run({token:'child-token',plan:{blocks:['andere-spiele'],assignments:[
  {id:1,kind:'pflicht',target:'game:einmaleins-dreier'}],done:[]}});
 assert.equal(r.allowed,true,'Assigned game accessible directly');
 r=await run({token:'child-token',plan:{blocks:['andere-spiele'],assignments:[
  {id:1,kind:'pflicht',target:'game:rhythmus-trio'}],done:[1]}});
 assert.equal(r.allowed,true,'Finishing legacy required tasks releases direct game');
 r=await run({token:'child-token',plan:{classroomMode:{kind:'subject',required_assignment_ids:[1]},assignments:[
  {id:1,kind:'pflicht',target:'game:rhythmus-trio'}],done:[1],verified:[]}});
 assert.equal(r.allowed,false,'Self-reported completion is not verified');
 r=await run({token:'child-token',plan:{classroomMode:{kind:'subject',required_assignment_ids:[1]},assignments:[
  {id:1,kind:'pflicht',target:'game:rhythmus-trio'}],done:[1],verified:[1]}});
 assert.equal(r.allowed,true,'Verified duty unlocks future mode');
 console.log('PASS: Direct URL game guard / logged-in and guest access policy');
})().catch(err=>{console.error(err);process.exit(1)});
