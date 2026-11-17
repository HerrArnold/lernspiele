import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const math=require('../original/assets/tausenderraum-logik.js');
const root=new URL('../',import.meta.url);
function seeded(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}}
test('every number maps precisely to its page, row and column',()=>{
 for(let n=1;n<=1000;n++){const c=math.coords(n);
  assert.equal(math.numberAt(c.page,c.row,c.col),n);
  assert.ok(c.page>=0&&c.page<=9&&c.row>=0&&c.row<=9&&c.col>=0&&c.col<=9);
 }
});
test('arrow boundaries never wrap across a page',()=>{
 assert.equal(math.move(10,'→'),null);
 assert.equal(math.move(11,'←'),null);
 assert.equal(math.move(100,'↓'),null);
 assert.equal(math.move(1,'↑'),null);
 assert.equal(math.move(1000,'▶'),null);
 assert.equal(math.move(1,'◀'),null);
 assert.equal(math.move(456,'▶'),556);
 assert.equal(math.move(456,'◀'),356);
 assert.equal(math.move(456,'↘'),467);
 assert.equal(math.move(456,'↖'),445);
});
test('generated paths contain four valid steps and correct destination',()=>{
 for(let seed=1;seed<=12000;seed++){const q=math.newWalk(seeded(seed));assert.equal(q.path.length,4);
  assert.ok(q.answer>=1&&q.answer<=1000);
  assert.equal(math.walk(q.start,q.path),q.answer);
  let n=q.start;for(const arrow of q.path){n=math.move(n,arrow);assert.notEqual(n,null);}
 }
});
test('both ordinary paths and thick page-jump symbols occur',()=>{
 let withJump=0,withoutJump=0;
 for(let seed=1;seed<=1000;seed++){const q=math.newWalk(seeded(seed));
  if(q.path.some(a=>a==='▶'||a==='◀'))withJump++;else withoutJump++;
 }
 assert.ok(withJump>100);assert.ok(withoutJump>100);
});
test('neighbour fields are always unambiguous and all six correct',()=>{
 for(let seed=1;seed<=3000;seed++){const q=math.newNeighbors(seeded(seed));
  assert.ok(q.start>100&&q.start<900);
  const a=q.answers;
  assert.equal(a.oneLeft,q.start-1);assert.equal(a.oneRight,q.start+1);
  assert.equal(a.tenLeft,Math.floor(q.start/10)*10);assert.equal(a.tenRight,a.tenLeft+10);
  assert.equal(a.hundredLeft,Math.floor(q.start/100)*100);
  assert.equal(a.hundredRight,a.hundredLeft+100);
  assert.ok(a.hundredLeft<q.start&&a.hundredRight>q.start);
 }
});
test('all four new game pages load the same tested engine',()=>{
 for(const filename of ['tausenderbuch-wege-gehen','zahlenstrahl-zahlen-eintragen','nachbarzahlen-tausenderraum','tausenderraum-teste-dein-wissen']){
  const html=readFileSync(new URL('original/spiele/'+filename+'.html',root),'utf8');
  assert.ok(html.includes('tausenderraum-logik.js'));
  assert.ok(html.includes('tausenderraum-neu.js'));
  assert.ok(html.includes('game-telemetry.js'));
 }
});
test('number line renders all 1000 exact positions and reveals errors in ticks',()=>{
 const ui=readFileSync(new URL('original/assets/tausenderraum-neu.js',root),'utf8');
 assert.ok(ui.includes('Array.from({length:1000}'));
 assert.ok(ui.includes("Math.abs(value-expected)"));
 assert.ok(ui.includes('Review')||ui.includes('review-list'));
});
