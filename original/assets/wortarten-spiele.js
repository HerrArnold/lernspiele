/* LernSafari Wortarten: ergebnisorientiert, ohne Einzelantworten in D1. */
(function(){
'use strict';
const cfg=window.WORTARTEN_GAME;if(!cfg||!Array.isArray(cfg.items))return;
const $=id=>document.getElementById(id);
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-CH').replace(/[.!?]$/,'');
const shuffle=a=>{for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const POOL=shuffle(cfg.items.slice());
let index=0,stage=0,points=0,questions=0,answered=0,allFirst=true,choice=null;
const stages=cfg.kind==='class'?1:2, maximum=POOL.length*stages;
function put(id,text){$(id).textContent=text}
function percent(){return Math.round(points/maximum*100)}
function record(){try{window.SafariTelemetry?.record({task:cfg.title+' Abschluss',correct:points===maximum,correctCount:points,total:maximum,answer:points+'/'+maximum,expected:maximum+'/'+maximum})}catch(e){}}
function textFeedback(message,good){const el=$('feedback');el.textContent=message;el.className='feedback '+(good?'good':'bad')}
function display(){
const item=POOL[index];stage=0;choice=null;
$('finish').hidden=true;$('task').hidden=false;$('continue').hidden=true;$('check').hidden=false;
put('counter','Aufgabe '+(index+1)+' von '+POOL.length);put('score',points+' / '+maximum+' Punkte');
$('progress').style.width=(index/POOL.length*100)+'%';
put('word',item.word);
textFeedback('',true);renderStage();
}
function fieldFocus(){setTimeout(()=>$('entry')?.focus(),0)}
function stageLabel(){
if(cfg.kind==='noun')return stage===0?'1. Schreibe den Begleiter (der, die oder das).':'2. Schreibe die Mehrzahl (ohne Begleiter).';
if(cfg.kind==='verb')return stage===0?'1. Welches Personalpronomen passt?':'2. Wie heisst die Grundform?';
return 'Ist dieses Wort ein Nomen, ein Verb oder keines von beidem?';
}
function stageHelp(){
if(cfg.kind==='noun')return stage===0?'Beispiel: der Hund':'Beispiel: Hunde';
if(cfg.kind==='verb')return stage===0?'Schreibe z. B. ich, du, er, sie, es, wir oder ihr. Es kann mehrere richtige Antworten geben.':'Beispiel: spiele → spielen';
return 'Achte auf die Gross- und Kleinschreibung. «spielen» ist ein Verb, «das Spielen» ein Nomen.';
}
function renderStage(){
const item=POOL[index];$('check').hidden=false;$('continue').hidden=true;
put('step-title',stageLabel());put('step-help',stageHelp());textFeedback('',true);
$('input-stage').hidden=cfg.kind==='class';$('choice-stage').hidden=cfg.kind!=='class';
if(cfg.kind==='class'){
 $('choices').innerHTML='';
 for(const [id,title] of [['nomen','Nomen'],['verb','Verb'],['other','Keines von beidem']]){
   const b=document.createElement('button');b.type='button';b.textContent=title;b.dataset.value=id;b.setAttribute('aria-pressed','false');
   b.onclick=()=>{choice=id;$('choices').querySelectorAll('button').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.value===id)));};$('choices').appendChild(b);
 }
}else{
 $('entry').value='';$('entry').disabled=false;
 $('entry').placeholder=cfg.kind==='noun'?(stage===0?'der / die / das':'Mehrzahl'):stage===0?'Personalpronomen':'Grundform';
 $('entry').setAttribute('aria-label',stageLabel());fieldFocus();
}
}
function answers(item){
if(cfg.kind==='noun')return stage===0?[item.article]:[item.plural];
if(cfg.kind==='verb')return stage===0?item.pronouns:[item.base];
return item.categories;
}
function solution(item){
if(cfg.kind==='class'){
const words={nomen:'Nomen',verb:'Verb',other:'Keines von beidem'};
return item.categories.map(x=>words[x]).join(' oder ')+(item.explanation?' – '+item.explanation:'');
}
if(cfg.kind==='noun')return stage===0?item.article:item.plural+(item.note?' – '+item.note:'');
if(stage===0){
const names={ich:'ich',du:'du',er:'er','sie-sg':'sie (Einzahl)',es:'es',wir:'wir',ihr:'ihr','sie-pl':'sie (Mehrzahl)'};
return item.pronouns.map(x=>names[x]||x).join(', ');
}
return item.base;
}
function validInput(item,v){
const valid=answers(item);
if(cfg.kind==='verb'&&stage===0&&v==='sie')return valid.includes('sie-sg')||valid.includes('sie-pl');
return valid.some(x=>normalize(x)===v);
}
function check(){
const item=POOL[index];
if(cfg.kind==='class'&&!choice){textFeedback('Wähle zuerst eine Antwort aus.',false);return;}
const entered=cfg.kind==='class'?choice:normalize($('entry').value);
if(!entered){textFeedback('Schreibe zuerst deine Antwort.',false);return;}
const good=validInput(item,entered);if(good)points++;else allFirst=false;answered++;
$('check').hidden=true;$('continue').hidden=false;
if(cfg.kind==='class')$('choices').querySelectorAll('button').forEach(b=>b.disabled=true);
else $('entry').disabled=true;
textFeedback(good?'✓ Richtig!'+(item.note&&stage===1?' '+item.note:''):'Noch nicht richtig. Lösung: '+solution(item),good);
$('continue').textContent=(stage+1<stages)?'Weiter zu Schritt 2 →':(index+1<POOL.length?'Nächstes Wort →':'Ergebnis ansehen');
put('score',points+' / '+maximum+' Punkte');
}
function advance(){
if(stage+1<stages){stage++;renderStage();return;}
index++;
if(index<POOL.length){display();return;}
$('task').hidden=true;$('finish').hidden=false;$('progress').style.width='100%';
put('counter','Alle '+POOL.length+' Wörter geübt');put('score',points+' / '+maximum+' Punkte');
$('final-score').textContent=points+' von '+maximum+' Punkten ('+percent()+' %)';
$('final-text').textContent='Gut gearbeitet! Die falschen Antworten wurden jeweils mit der Lösung erklärt. Du kannst alle Wörter neu mischen und noch einmal üben.';
record();
}
$('check').onclick=check;$('continue').onclick=advance;$('restart').onclick=()=>location.reload();
$('entry').addEventListener('keydown',e=>{if(e.key==='Enter'&&!$('check').hidden){e.preventDefault();check();}});
display();
})();