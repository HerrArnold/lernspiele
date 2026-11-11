#!/usr/bin/env node
// Tests without Cloudflare credentials, browser, or personal data.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('cloudflare-integration.js',root),'utf8');
const css=fs.readFileSync(new URL('cloudflare-integration.css',root),'utf8');
function functionExpr(name){
  const first=source.match(new RegExp('const '+name+'='));
  assert.ok(first,name+' must exist');
  const start=first.index+first[0].length, end=source.indexOf(';\n',start);
  assert.ok(end>start,name+' ending not found');
  return source.slice(start,end);
}
const scoreIndex=vm.runInNewContext('('+functionExpr('scoreIndex')+')');
const scoreText=vm.runInNewContext('('+functionExpr('scoreText')+')');
let result=scoreIndex([{game:'rhythmus-trio',score:4},{game:'rhythmus-trio',score:11},{game:'rhythmus-trio',score:7},{game:'solmisationsspiel',score:0}]);
assert.equal(result.get('rhythmus-trio'),11,'Best score must be highest');
assert.equal(result.get('solmisationsspiel'),0,'Zero score must remain a valid result');
result=scoreIndex([{game:'rhythmus-trio',score:-1},{game:'rhythmus-trio',score:'bad'},null,{score:2},{game:'',score:5}]);
assert.equal(result.size,0,'Ignore invalid score rows');
assert.equal(scoreIndex(null).size,0,'Null input must not crash');
assert.match(scoreText(undefined),/Noch kein/);
assert.match(scoreText(8.9),/8/);
assert.ok(source.includes("call('/highscores')"),'Use existing child highscore API');
assert.ok(source.includes("call('/admin-report',{admin:true})"),'Admin report request must be authenticated');
assert.ok(source.includes("if(!panel||!loggedTeacher())return"),'Admin progress gated in UI');
assert.ok(source.includes("Das bedeutet nicht automatisch «Aufgabe erledigt»"),'Best score not treated as assignment completion');
assert.ok(css.includes('.cloud-progress-table'),'Admin overview styles exist');
assert.ok(css.includes('.cloud-task-score'),'Logbook score styles exist');
console.log('PASS: LernSafari v3.2 – 12 checks for score logic and integrations');
