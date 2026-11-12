"use strict";
(()=>{
const $=id=>document.getElementById(id);
const mode=document.body.dataset.mode;
const config={
 mix:{title:'Einmaleins-Mix',sub:'2er-, 5er- und 10er-Reihe',total:20,kind:'mix',rows:[2,5,10],introLead:'Hier übst du die 2er-, 5er- und 10er-Reihe. Die Rechnungen sind gut gemischt. Schau genau hin und rechne in deinem Tempo.',detail:'2er-, 5er- und 10er-Reihe',mixExamples:['2 × 6 = 12','5 × 4 = 20','10 × 3 = 30']},
 mix3469:{title:'Einmaleins-Mix',sub:'3er-, 4er-, 6er- und 9er-Reihe',total:20,kind:'mix',rows:[3,4,6,9],introLead:'Hier übst du die 3er-, 4er-, 6er- und 9er-Reihe. Nutze deine Tricks aus den Lernspielen und rechne in deinem Tempo.',detail:'3er-, 4er-, 6er- und 9er-Reihe',mixExamples:['3 × 4 = 12','4 × 6 = 24','9 × 3 = 27']},
 three:{title:'Die 3er-Reihe',sub:'Von der 2er-Reihe zur 3er-Reihe',total:12,kind:'plus-one',row:3,knownRow:2,knownLabel:'2er-Reihe',exampleN:9,detail:'3er-Reihe',introHeading:'So einfach geht die 3er-Reihe!',introLead:'Du kennst schon die 2er-Reihe. Für die 3er-Reihe nimmst du eine gleiche Gruppe mehr.',note:'Merke: Zu 2 Gruppen mit je {n} kommt noch 1 Gruppe mit {n} dazu.'},
 four:{title:'Die 4er-Reihe',sub:'Von der 2er-Reihe zur 4er-Reihe',total:12,kind:'double-known',row:4,knownRow:2,knownLabel:'2er-Reihe',exampleN:4,detail:'4er-Reihe',introHeading:'So einfach geht die 4er-Reihe!',introLead:'Du kennst schon die 2er-Reihe. Für die 4er-Reihe nimmst du die 2er-Reihe einfach zweimal.',note:'Merke: 4 mal {n} ist gleich 2 mal {n} plus noch einmal 2 mal {n}.'},
 six:{title:'Die 6er-Reihe',sub:'Von der 5er-Reihe zur 6er-Reihe',total:12,kind:'plus-one',row:6,knownRow:5,knownLabel:'5er-Reihe',exampleN:6,detail:'6er-Reihe',introHeading:'So einfach geht die 6er-Reihe!',introLead:'Du kennst schon die 5er-Reihe. Für die 6er-Reihe nimmst du eine gleiche Gruppe mehr.',note:'Merke: Zu 5 Gruppen mit je {n} kommt noch 1 Gruppe mit {n} dazu.'},
 nine:{title:'Die 9er-Reihe',sub:'Von der 10er-Reihe zur 9er-Reihe',total:12,kind:'minus-one',row:9,knownRow:10,knownLabel:'10er-Reihe',exampleN:4,detail:'9er-Reihe',introHeading:'So einfach geht die 9er-Reihe!',introLead:'Du kennst schon die 10er-Reihe. Für die 9er-Reihe nimmst du eine gleiche Gruppe wieder weg.',note:'Merke: 9 mal {n} ist gleich 10 mal {n} minus 1 mal {n}.'}
}[mode];
if(!config)return;
const intro=$('intro'),play=$('play'),finish=$('finish'),stats=$('stats');
let questions=[],index=0,correct=0,hearts=3,answered=false,seen=[],hintOpen=false;
const random=a=>{let b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
function rowsVisual(normalRows,items,{extraRows=0,removedRows=0}={}){
 const lines=[];
 for(let i=0;i<normalRows;i++)lines.push({cls:'',label:'Gruppe '+(i+1)});
 for(let i=0;i<extraRows;i++)lines.push({cls:'extra',label:'+ Gruppe '+(normalRows+i+1)});
 for(let i=0;i<removedRows;i++)lines.push({cls:'removed',label:'− 1 Gruppe'});
 return `<div class="row-visual">${lines.map(line=>`<div class="visual-line ${line.cls}"><span class="row-label">${line.label}</span><span class="dot-line">${Array.from({length:items},()=>'<i class="unit"></i>').join('')}</span></div>`).join('')}</div>`;
}
function introBlock(cfg,n){
 if(cfg.kind==='mix')return `<p class="eyebrow">Wiederholen</p><h2>Fit im Einmaleins!</h2><p class="intro-lead">${cfg.introLead}</p><div class="big-formula">${cfg.mixExamples.map(x=>`<span class="math-chip">${x}</span>`).join('')}</div><div class="buttons"><button class="btn" id="start">Los geht's!</button></div>`;
 if(cfg.kind==='plus-one')return `<p class="eyebrow">Erst entdecken, dann üben</p><h2>${cfg.introHeading}</h2><p class="intro-lead">${cfg.introLead}</p><div class="big-formula"><span class="math-chip">${cfg.knownRow} × ${n} = ${cfg.knownRow*n}</span><span class="math-sign">+</span><span class="math-chip new">1 × ${n} = ${n}</span><span class="math-sign">=</span><span class="math-chip new">${cfg.row} × ${n} = ${cfg.row*n}</span></div>${rowsVisual(cfg.knownRow,n,{extraRows:1})}<p class="explain-note"><strong>Merke:</strong> ${cfg.note.replaceAll('{n}',String(n))}</p><div class="buttons"><button class="btn" id="start">Jetzt üben!</button></div>`;
 if(cfg.kind==='double-known')return `<p class="eyebrow">Erst entdecken, dann üben</p><h2>${cfg.introHeading}</h2><p class="intro-lead">${cfg.introLead}</p><div class="big-formula"><span class="math-chip">${cfg.knownRow} × ${n} = ${cfg.knownRow*n}</span><span class="math-sign">+</span><span class="math-chip new">${cfg.knownRow} × ${n} = ${cfg.knownRow*n}</span><span class="math-sign">=</span><span class="math-chip new">${cfg.row} × ${n} = ${cfg.row*n}</span></div>${rowsVisual(cfg.knownRow,n,{extraRows:cfg.knownRow})}<p class="explain-note"><strong>Merke:</strong> ${cfg.note.replaceAll('{n}',String(n))}</p><div class="buttons"><button class="btn" id="start">Jetzt üben!</button></div>`;
 return `<p class="eyebrow">Erst entdecken, dann üben</p><h2>${cfg.introHeading}</h2><p class="intro-lead">${cfg.introLead}</p><div class="big-formula"><span class="math-chip">${cfg.knownRow} × ${n} = ${cfg.knownRow*n}</span><span class="math-sign">−</span><span class="math-chip new">1 × ${n} = ${n}</span><span class="math-sign">=</span><span class="math-chip new">${cfg.row} × ${n} = ${cfg.row*n}</span></div>${rowsVisual(cfg.row,n,{removedRows:1})}<p class="explain-note"><strong>Merke:</strong> ${cfg.note.replaceAll('{n}',String(n))}</p><div class="buttons"><button class="btn" id="start">Jetzt üben!</button></div>`;
}
function hint(n){
 if(config.kind==='plus-one')return `<div class="tipbox"><p>Denk an die ${config.knownLabel}.</p><div class="big-formula"><span class="math-chip">${config.knownRow} × ${n} = ${config.knownRow*n}</span><span class="math-sign">+</span><span class="math-chip new">1 × ${n} = ${n}</span><span class="math-sign">=</span><span class="math-chip new">${config.row*n}</span></div>${rowsVisual(config.knownRow,n,{extraRows:1})}<p>Eine Gruppe mit ${n} kommt dazu.</p></div>`;
 if(config.kind==='double-known')return `<div class="tipbox"><p>Denk an die ${config.knownLabel}. Nimm sie zweimal.</p><div class="big-formula"><span class="math-chip">${config.knownRow} × ${n} = ${config.knownRow*n}</span><span class="math-sign">+</span><span class="math-chip new">${config.knownRow} × ${n} = ${config.knownRow*n}</span><span class="math-sign">=</span><span class="math-chip new">${config.row*n}</span></div>${rowsVisual(config.knownRow,n,{extraRows:config.knownRow})}<p>Zwei Zweiergruppen zusammen sind vier Gruppen.</p></div>`;
 if(config.kind==='minus-one')return `<div class="tipbox"><p>Denk an die ${config.knownLabel}. Nimm eine Gruppe wieder weg.</p><div class="big-formula"><span class="math-chip">${config.knownRow} × ${n} = ${config.knownRow*n}</span><span class="math-sign">−</span><span class="math-chip new">1 × ${n} = ${n}</span><span class="math-sign">=</span><span class="math-chip new">${config.row*n}</span></div>${rowsVisual(config.row,n,{removedRows:1})}<p>Von 10 Gruppen mit ${n} bleibt 9 mal ${n} übrig.</p></div>`;
 return '';
}
function makeQuestions(){
 if(config.kind==='mix')return random(config.rows.flatMap(row=>Array.from({length:10},(_,i)=>({row,n:i+1})))).slice(0,config.total);
 const firsts=[2,5,9];
 const numbers=[...firsts,...random(Array.from({length:10},(_,i)=>i+1).filter(n=>!firsts.includes(n)))];
 while(numbers.length<config.total)numbers.push(1+Math.floor(Math.random()*10));
 return numbers.slice(0,config.total).map(n=>({row:config.row,n}));
}
function updateStats(){if(!stats)return;$('progress').textContent=`Richtig: ${correct}`;$('hearts').textContent='♥'.repeat(hearts)+'♡'.repeat(3-hearts);$('hearts').setAttribute('aria-label',hearts+' Herzen');}
function renderIntro(){intro.classList.remove('hidden');play.classList.add('hidden');finish.classList.add('hidden');intro.innerHTML=introBlock(config,config.exampleN||6);$('start').addEventListener('click',start);}
function start(){questions=makeQuestions();index=0;correct=0;hearts=3;seen=[];intro.classList.add('hidden');finish.classList.add('hidden');play.classList.remove('hidden');updateStats();renderQuestion();}
function renderQuestion(){answered=false;hintOpen=false;const q=questions[index];$('question-count').textContent=`Aufgabe ${index+1} von ${questions.length}`;$('bar').style.width=`${index/questions.length*100}%`; $('question').innerHTML=`<div class="calc-line"><span>${q.row}</span><span>×</span><span>${q.n}</span><span>=</span><input id="answer" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="?" aria-label="Ergebnis eingeben"></div>`;
 $('feedback').textContent='';$('feedback').className='answer-feedback';$('next').classList.add('hidden');$('check').classList.remove('hidden');$('check').disabled=false;
 const tip=$('tip-toggle'),holder=$('tip-content');holder.innerHTML='';holder.classList.add('hidden');tip.textContent='💡 Tipp zeigen';tip.classList.toggle('hidden',config.kind==='mix');tip.disabled=false;
 $('answer').addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!answered){ev.preventDefault();check();}else if(ev.key==='Enter'&&answered){ev.preventDefault();next();}});$('answer').focus({preventScroll:true});}
function toggleTip(){const q=questions[index];hintOpen=!hintOpen;const h=$('tip-content');h.classList.toggle('hidden',!hintOpen);if(hintOpen)h.innerHTML=hint(q.n);$('tip-toggle').textContent=hintOpen?'Tipp schliessen':'💡 Tipp zeigen';}
function record(q,ok,value,expected){try{window.SafariTelemetry?.record({task:`${q.row} × ${q.n} = ?`,correct:ok,correctCount:ok?1:0,total:1,answer:value,expected:String(expected),details:config.detail});}catch(e){console.warn('Telemetrie:',e);}}
function check(){if(answered)return;const q=questions[index],input=$('answer'),raw=input.value.trim();if(!/^\d{1,3}$/.test(raw)){$('feedback').textContent='Schreibe eine Zahl ins Feld.';$('feedback').className='answer-feedback incorrect';input.focus();return;}
 const expected=q.row*q.n,ok=Number(raw)===expected;answered=true;seen.push({q,ok});if(ok)correct++;else hearts=Math.max(0,hearts-1);updateStats();record(q,ok,raw,expected);$('feedback').textContent=ok?'Super, richtig!':`Noch nicht ganz. ${q.row} × ${q.n} = ${expected}.`;$('feedback').className='answer-feedback '+(ok?'correct':'incorrect');input.readOnly=true;$('check').classList.add('hidden');$('next').classList.remove('hidden');$('next').textContent=(index===questions.length-1||hearts===0)?'Auswertung ansehen':'Nächste Aufgabe →';
 if(!ok&&config.kind!=='mix'&&!hintOpen){hintOpen=true;$('tip-content').classList.remove('hidden');$('tip-content').innerHTML=hint(q.n);$('tip-toggle').textContent='Tipp schliessen';}}
function next(){if(!answered)return;if(index===questions.length-1||hearts===0){showFinish();return;}index++;renderQuestion();}
function showFinish(){play.classList.add('hidden');finish.classList.remove('hidden');$('bar').style.width='100%';finish.innerHTML=`<div class="summary"><p class="eyebrow">Geschafft!</p><h2>Dein Einmaleins-Ergebnis</h2><div class="big">${correct} von ${seen.length}</div><p>${correct===seen.length?'Spitze! Du hast alles richtig gelöst.':'Gut geübt! Die kniffligen Rechnungen kannst du gleich nochmals probieren.'}</p><div class="buttons"><button class="btn" id="again">Neue Runde</button><a class="btn alt" href="../index.html#aktuelle" style="text-decoration:none">Zurück zur LernSafari</a></div></div>`;$('again').onclick=start;}
$('check').onclick=check;$('next').onclick=next;$('tip-toggle').onclick=toggleTip;
renderIntro();updateStats();
})();
