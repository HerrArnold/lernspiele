import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('original/assets/einmaleins.js'),nav=read('topic-navigation.js');
function launch(mode){
 const map=new Map(),listeners={};
 const get=id=>{
   if(!map.has(id)){
     const classes=new Set();
     map.set(id,{id,classList:{
       add(v){classes.add(v)},remove(v){classes.delete(v)},
       contains(v){return classes.has(v)},toggle(v,val){if(val===undefined? !classes.has(v):val)classes.add(v);else classes.delete(v)}
     },innerHTML:'',textContent:'',value:'',disabled:false,readOnly:false,style:{},attrs:{},
       setAttribute(k,v){this.attrs[k]=v},addEventListener(type,fn){this['on_'+type]=fn},focus(){}});
   }
   return map.get(id);
 };
 const context={document:{body:{dataset:{mode}},getElementById:get,addEventListener(type,fn){listeners[type]=fn}},
 console:{warn(){}},window:{SafariTelemetry:{record(){}}},Math};
 vm.runInNewContext(game,context,{timeout:1000});
 return {get,listeners};
}
test('all four new game pages are wired to the same engine',()=>{
 for(const [name,mode] of [['siebener','seven'],['achter','eight'],['mix-sieben-acht','mix78'],['test-alle','testall']]){
   const html=read('original/spiele/einmaleins-'+name+'.html');
   assert.match(html,new RegExp('data-mode="'+mode+'"'));
   assert.match(html,/einmaleins\.js\?v=[345]/);
   assert.match(nav,new RegExp('einmaleins-'+name+'.html'));
 }
});
test('archived solmisation and rhythm remains accessible and all catalogue items retained',()=>{
 assert.match(nav,/name:'Solmisation und Rhythmus',icon:'🎼',archived:true/);
 assert.match(nav,/Themen-Archiv/);
 assert.match(nav,/archive\.map\(topicCard\)/);
 assert.match(nav,/data-archive-toggle/);
 assert.match(nav,/window\.LernSafariTopicCatalog/);
 assert.match(nav,/entry\[1\]\.startsWith\('einmaleins-'\)/);
});
test('7er and 8er show accurate alternative 5er/10er strategies',()=>{
 for(const [mode,five,ten] of [['seven',2,-3],['eight',3,-2]]){
   const {get,listeners}=launch(mode);
   assert.match(get('intro').innerHTML,/Von der 5er-Reihe/);
   assert.match(get('intro').innerHTML,/Von der 10er-Reihe/);
   assert.match(get('intro').innerHTML,new RegExp('5 × [0-9]+'));
   assert.match(get('intro').innerHTML,new RegExp(Math.abs(five)+' × [0-9]+'));
   listeners.click({target:{closest(){return {dataset:{bridge:'1'}}}}});
   assert.match(get('intro').innerHTML,/10 ×/);
   assert.match(get('intro').innerHTML,new RegExp(Math.abs(ten)+' × [0-9]+'));
   get('start').on_click();
   assert.match(get('question').innerHTML,/<input id="answer"/);
   assert.match(get('question-count').textContent,/von 12/);
   get('tip-toggle').onclick();
   assert.match(get('tip-content').innerHTML,/10 ×/);
 }
});
test('8er-Reihe provides third route: doubling 4er-Reihe in introduction and hints',()=>{
 const {get,listeners}=launch('eight');
 assert.match(get('intro').innerHTML,/4er-Reihe verdoppeln/);
 listeners.click({target:{closest(){return {dataset:{bridge:'2'}}}}});
 assert.match(get('intro').innerHTML,/4 × 4 = 16/);
 assert.match(get('intro').innerHTML,/4 × 4 = 16/);
 assert.match(get('intro').innerHTML,/8 × 4 = 32/);
 assert.match(get('intro').innerHTML,/Doppelte der 4er-Reihe/);
 get('start').on_click();
 get('tip-toggle').onclick();
 assert.match(get('tip-content').innerHTML,/Doppelte der 4er-Reihe/);
 listeners.click({target:{closest(){return {dataset:{bridge:'1'}}}}});
 assert.match(get('tip-content').innerHTML,/10 ×/);
});
test('archived 2er, 5er, 10er and mix are available in Mathematics archive, not current Einmaleins section',()=>{
 assert.match(nav,/name:'Einmaleins – 2er, 5er und 10er',icon:'📚',archived:true/);
 for(const [label,name,mode] of [['2er Reihe','zweier','two'],['5er Reihe','fuenfer','five'],['10er Reihe','zehner','ten']]){
   assert.ok(nav.includes("['"+label+"','einmaleins-"+name+".html']"));
   const html=read('original/spiele/einmaleins-'+name+'.html');
   assert.match(html,new RegExp('data-mode="'+mode+'"'));
   const {get}=launch(mode);get('start').on_click();
   assert.match(get('question-count').textContent,/von 10/);
 }
 const catalogStart=nav.indexOf("{name:'Einmaleins',");
 const archiveStart=nav.indexOf("{name:'Einmaleins – 2er, 5er und 10er'");
 assert.ok(catalogStart>=0 && archiveStart>catalogStart);
 assert.doesNotMatch(nav.slice(catalogStart,archiveStart),/einmaleins-mix\.html/);
 assert.match(nav.slice(archiveStart),/einmaleins-mix\.html/);
});
test('Tauschaufgaben show a memory-row shortcut for every applicable learning row',()=>{
 for(const mode of ['three','four','six','seven','eight','nine']){
   const {get}=launch(mode);
   get('start').on_click();
   const text=get('question').innerHTML;
   const match=text.match(/<span>(\d+)<\/span><span>×<\/span><span>(\d+)<\/span>/);
   assert.ok(match);
   assert.equal(Number(match[2]),2);
   assert.match(text,/Tauschaufgabe:/);
   assert.match(text,new RegExp(match[2]+' × '+match[1]));
   assert.match(text,/2er-Reihe/);
 }
 for(const mode of ['two','five','ten']){
   const {get}=launch(mode);get('start').on_click();
   assert.doesNotMatch(get('question').innerHTML,/Tauschaufgabe:/);
 }
});
test('27-question overall test contains exactly 3 questions from every 2–10 row and never stops after mistakes',()=>{
 const {get}=launch('testall');get('start').on_click();
 const rows={};let count=0;
 for(let i=0;i<27;i++){
   assert.match(get('question-count').textContent,new RegExp('Aufgabe '+(i+1)+' von 27'));
   const m=get('question').innerHTML.match(/<span>(\d+)<\/span><span>×<\/span><span>(\d+)<\/span>/);
   assert.ok(m);const row=Number(m[1]);rows[row]=(rows[row]||0)+1;
   get('answer').value='999';get('check').onclick();count++;
   if(i<26){get('next').onclick();assert.equal(get('finish').classList.contains('hidden'),true);}
 }
 get('next').onclick();assert.equal(get('finish').classList.contains('hidden'),false);
 assert.equal(count,27);
 assert.deepEqual(Object.keys(rows).map(Number).sort((a,b)=>a-b),[2,3,4,5,6,7,8,9,10]);
 assert.ok(Object.values(rows).every(x=>x===3));
 assert.match(get('finish').innerHTML,/0 von 27/);
 assert.match(get('finish').innerHTML,/0 % richtig/);
});
