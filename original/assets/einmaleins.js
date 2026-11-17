"use strict";
(()=>{
const $=id=>document.getElementById(id);
const mode=document.body.dataset.mode;
const config={
 mix:{title:'Einmaleins-Mix',sub:'2er-, 5er- und 10er-Reihe',total:20,kind:'mix',rows:[2,5,10],introLead:'Hier übst du die 2er-, 5er- und 10er-Reihe. Die Rechnungen sind gut gemischt. Schau genau hin und rechne in deinem Tempo.',detail:'2er-, 5er- und 10er-Reihe',mixExamples:['2 × 6 = 12','5 × 4 = 20','10 × 3 = 30']},
 two:{title:'Die 2er-Reihe',sub:'Die 2er-Reihe üben',total:10,kind:'mix',rows:[2],introLead:'Übe alle zehn Rechnungen aus der 2er-Reihe. Du kannst in Zweierschritten zählen.',detail:'2er-Reihe',mixExamples:['2 × 3 = 6','2 × 7 = 14','2 × 10 = 20']},
 five:{title:'Die 5er-Reihe',sub:'Die 5er-Reihe üben',total:10,kind:'mix',rows:[5],introLead:'Übe alle zehn Rechnungen aus der 5er-Reihe. Denke an die Fünferschritte.',detail:'5er-Reihe',mixExamples:['5 × 2 = 10','5 × 7 = 35','5 × 10 = 50']},
 ten:{title:'Die 10er-Reihe',sub:'Die 10er-Reihe üben',total:10,kind:'mix',rows:[10],introLead:'Übe alle zehn Rechnungen aus der 10er-Reihe. Denke an die Zehnerschritte.',detail:'10er-Reihe',mixExamples:['10 × 2 = 20','10 × 7 = 70','10 × 10 = 100']},
 mix78:{title:'Einmaleins-Mix',sub:'7er- und 8er-Reihe',total:20,kind:'mix',rows:[7,8],introLead:'Hier übst du die 7er- und 8er-Reihe durcheinander. Denke an die 5er- oder 10er-Reihe, wenn du Hilfe brauchst.',detail:'7er- und 8er-Reihe',mixExamples:['7 × 6 = 42','8 × 4 = 32','7 × 9 = 63']},
 testall:{title:'Teste dein Wissen – alle Reihen',sub:'2er- bis 10er-Reihe',total:27,kind:'test',rows:[2,3,4,5,6,7,8,9,10],introLead:'27 Aufgaben: Jede Reihe von 2 bis 10 kommt genau dreimal vor. Du löst alle Aufgaben bis zum Schluss. Am Ende siehst du deine Punkte und die Prozentzahl.',detail:'Einmaleins-Gesamttest 2 bis 10',mixExamples:['2 × 7 = 14','7 × 8 = 56','9 × 6 = 54']},
 seven:{title:'Die 7er-Reihe',sub:'Mehrere Rechenwege: 5er, 10er, 6er oder 8er-Reihe',total:12,kind:'bridge',row:7,exampleN:6,detail:'7er-Reihe',introHeading:'Entdecke vier Wege zur 7er-Reihe!',introLead:'Nutze eine bekannte Reihe als Hilfe: 5er + 2 Gruppen, 10er − 3 Gruppen, 6er + 1 Gruppe oder 8er − 1 Gruppe. Achte immer auch auf Tauschaufgaben!',bridges:[{label:'5er-Reihe + 2',knownRow:5,delta:2},{label:'10er-Reihe − 3',knownRow:10,delta:-3},{label:'6er-Reihe + 1',knownRow:6,delta:1},{label:'8er-Reihe − 1',knownRow:8,delta:-1}]},
 eight:{title:'Die 8er-Reihe',sub:'Mehrere Rechenwege: 10er, 9er oder 6er-Reihe',total:12,kind:'bridge',row:8,exampleN:4,detail:'8er-Reihe',introHeading:'Entdecke drei Wege zur 8er-Reihe!',introLead:'Suche dir einen passenden Weg: Von der 10er-Reihe 2 Gruppen wegnehmen, zur 9er-Reihe 1 Gruppe wegnehmen oder zur 6er-Reihe 2 Gruppen dazunehmen. Nutze auch Tauschaufgaben!',bridges:[{label:'10er-Reihe − 2',knownRow:10,delta:-2},{label:'9er-Reihe − 1',knownRow:9,delta:-1},{label:'6er-Reihe + 2',knownRow:6,delta:2}]},
 mix3469:{title:'Einmaleins-Mix',sub:'3er-, 4er-, 6er- und 9er-Reihe',total:20,kind:'mix',rows:[3,4,6,9],introLead:'Hier übst du die 3er-, 4er-, 6er- und 9er-Reihe. Nutze deine Tricks aus den Lernspielen und rechne in deinem Tempo.',detail:'3er-, 4er-, 6er- und 9er-Reihe',mixExamples:['3 × 4 = 12','4 × 6 = 24','9 × 3 = 27']},
 three:{title:'Die 3er-Reihe',sub:'Von der 2er-Reihe zur 3er-Reihe',total:12,kind:'plus-one',row:3,knownRow:2,knownLabel:'2er-Reihe',exampleN:9,detail:'3er-Reihe',introHeading:'So einfach geht die 3er-Reihe!',introLead:'Du kennst schon die 2er-Reihe. Für die 3er-Reihe nimmst du eine gleiche Gruppe mehr.',note:'Merke: Zu 2 Gruppen mit je {n} kommt noch 1 Gruppe mit {n} dazu.'},
 four:{title:'Die 4er-Reihe',sub:'Von der 2er-Reihe zur 4er-Reihe',total:12,kind:'double-known',row:4,knownRow:2,knownLabel:'2er-Reihe',exampleN:4,detail:'4er-Reihe',introHeading:'So einfach geht die 4er-Reihe!',introLead:'Du kennst schon die 2er-Reihe. Für die 4er-Reihe nimmst du die 2er-Reihe einfach zweimal.',note:'Merke: 4 mal {n} ist gleich 2 mal {n} plus noch einmal 2 mal {n}.'},
 six:{title:'Die 6er-Reihe',sub:'Von der 5er-Reihe zur 6er-Reihe',total:12,kind:'plus-one',row:6,knownRow:5,knownLabel:'5er-Reihe',exampleN:6,detail:'6er-Reihe',introHeading:'So einfach geht die 6er-Reihe!',introLead:'Du kennst schon die 5er-Reihe. Für die 6er-Reihe nimmst du eine gleiche Gruppe mehr.',note:'Merke: Zu 5 Gruppen mit je {n} kommt noch 1 Gruppe mit {n} dazu.'},
 nine:{title:'Die 9er-Reihe',sub:'Von der 10er-Reihe zur 9er-Reihe',total:12,kind:'minus-one',row:9,knownRow:10,knownLabel:'10er-Reihe',exampleN:4,detail:'9er-Reihe',introHeading:'So einfach geht die 9er-Reihe!',introLead:'Du kennst schon die 10er-Reihe. Für die 9er-Reihe nimmst du eine gleiche Gruppe wieder weg.',note:'Merke: 9 mal {n} ist gleich 10 mal {n} minus 1 mal {n}.'}
}[mode];
if(!config)return;
const intro=$('intro'),play=$('play'),finish=$('finish'),stats=$('stats');
let questions=[],index=0,correct=0,hearts=3,answered=false,seen=[],hintOpen=false,activeBridge=0;
const random=a=>{let b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
function rowsVisual(normalRows,items,{extraRows=0,removedRows=0}={}){
 const lines=[];
 for(let i=0;i<normalRows;i++)lines.push({cls:'',label:'Gruppe '+(i+1)});
 for(let i=0;i<extraRows;i++)lines.push({cls:'extra',label:'+ Gruppe '+(normalRows+i+1)});
 for(let i=0;i<removedRows;i++)lines.push({cls:'removed',label:'− 1 Gruppe'});
 return `<div class="row-visual">${lines.map(line=>`<div class="visual-line ${line.cls}"><span class="row-label">${line.label}</span><span class="dot-line">${Array.from({length:items},()=>'<i class="unit"></i>').join('')}</span></div>`).join('')}</div>`;
}
function bridgeMarkup(cfg,n,includeHeading=false){
 const b=cfg.bridges[activeBridge],diff=Math.abs(b.delta),sign=b.delta>0?'+':'−',known=b.knownRow*n,step=diff*n;
 return (includeHeading?'<p class="eyebrow">Erst entdecken, dann üben</p><h2>'+cfg.introHeading+'</h2><p class="intro-lead">'+cfg.introLead+'</p>':'<p>Wähle den Rechenweg, der dir hilft.</p>')+
 '<div class="bridge-choices" role="group" aria-label="Rechenweg wählen">'+cfg.bridges.map((v,i)=>'<button type="button" data-bridge="'+i+'" class="btn alt bridge-choice '+(activeBridge===i?'active':'')+'" aria-pressed="'+(activeBridge===i)+'">'+v.label+'</button>').join('')+'</div>'+
 '<div class="big-formula"><span class="math-chip">'+b.knownRow+' × '+n+' = '+known+'</span><span class="math-sign">'+sign+'</span><span class="math-chip new">'+diff+' × '+n+' = '+step+'</span><span class="math-sign">=</span><span class="math-chip new">'+cfg.row+' × '+n+' = '+cfg.row*n+'</span></div>'+
 rowsVisual(b.delta>0?b.knownRow:cfg.row,n,b.delta>0?{extraRows:diff}:{removedRows:diff})+
 '<p class="explain-note">'+(b.double?'Merke: Die 8er-Reihe ist das Doppelte der 4er-Reihe. '+b.knownRow+' × '+n+' + '+b.knownRow+' × '+n+' = '+cfg.row+' × '+n+'.':'Merke: '+b.knownRow+' × '+n+' '+sign+' '+diff+' × '+n+' = '+cfg.row+' × '+n+'.')+'</p>';
}
function introBlock(cfg,n){
 if(cfg.kind==='test')return '<p class="eyebrow">Einmaleins-Gesamttest</p><h2>Teste dein Wissen!</h2><p class="intro-lead">'+cfg.introLead+'</p><div class="big-formula">'+cfg.mixExamples.map(x=>'<span class="math-chip">'+x+'</span>').join('')+'</div><p class="explain-note">Alle 27 Aufgaben werden gezählt. Du hast so viele Versuche wie Aufgaben und keine Herzenbegrenzung. Es gibt im Test keine Tipps.</p><div class="buttons"><button class="btn" id="start">Test starten</button></div>';
 if(cfg.kind==='mix')return `<p class="eyebrow">Wiederholen</p><h2>Fit im Einmaleins!</h2><p class="intro-lead">${cfg.introLead}</p><div class="big-formula">${cfg.mixExamples.map(x=>`<span class="math-chip">${x}</span>`).join('')}</div><div class="buttons"><button class="btn" id="start">Los geht's!</button></div>`;
 if(cfg.kind==='bridge')return bridgeMarkup(cfg,n,true)+'<div class="buttons"><button class="btn" id="start">Jetzt üben!</button></div>';
 if(cfg.kind==='plus-one')return `<p class="eyebrow">Erst entdecken, dann üben</p><h2>${cfg.introHeading}</h2><p class="intro-lead">${cfg.introLead}</p><div class="big-formula"><span class="math-chip">${cfg.knownRow} × ${n} = ${cfg.knownRow*n}</span><span class="math-sign">+</span><span class="math-chip new">1 × ${n} = ${n}</span><span class="math-sign">=</span><span class="math-chip new">${cfg.row} × ${n} = ${cfg.row*n}</span></div>${rowsVisual(cfg.knownRow,n,{extraRows:1})}<p class="explain-note"><strong>Merke:</strong> ${cfg.note.replaceAll('{n}',String(n))}</p><div class="buttons"><button class="btn" id="start">Jetzt üben!</button></div>`;
 if(cfg.kind==='double-known')return `<p class="eyebrow">Erst entdecken, dann üben</p><h2>${cfg.introHeading}</h2><p class="intro-lead">${cfg.introLead}</p><div class="big-formula"><span class="math-chip">${cfg.knownRow} × ${n} = ${cfg.knownRow*n}</span><span class="math-sign">+</span><span class="math-chip new">${cfg.knownRow} × ${n} = ${cfg.knownRow*n}</span><span class="math-sign">=</span><span class="math-chip new">${cfg.row} × ${n} = ${cfg.row*n}</span></div>${rowsVisual(cfg.knownRow,n,{extraRows:cfg.knownRow})}<p class="explain-note"><strong>Merke:</strong> ${cfg.note.replaceAll('{n}',String(n))}</p><div class="buttons"><button class="btn" id="start">Jetzt üben!</button></div>`;
 return `<p class="eyebrow">Erst entdecken, dann üben</p><h2>${cfg.introHeading}</h2><p class="intro-lead">${cfg.introLead}</p><div class="big-formula"><span class="math-chip">${cfg.knownRow} × ${n} = ${cfg.knownRow*n}</span><span class="math-sign">−</span><span class="math-chip new">1 × ${n} = ${n}</span><span class="math-sign">=</span><span class="math-chip new">${cfg.row} × ${n} = ${cfg.row*n}</span></div>${rowsVisual(cfg.row,n,{removedRows:1})}<p class="explain-note"><strong>Merke:</strong> ${cfg.note.replaceAll('{n}',String(n))}</p><div class="buttons"><button class="btn" id="start">Jetzt üben!</button></div>`;
}
function hint(n){
 if(config.kind==='bridge')return '<div class="tipbox">'+bridgeMarkup(config,n,false)+'</div>';
 if(config.kind==='plus-one')return `<div class="tipbox"><p>Denk an die ${config.knownLabel}.</p><div class="big-formula"><span class="math-chip">${config.knownRow} × ${n} = ${config.knownRow*n}</span><span class="math-sign">+</span><span class="math-chip new">1 × ${n} = ${n}</span><span class="math-sign">=</span><span class="math-chip new">${config.row*n}</span></div>${rowsVisual(config.knownRow,n,{extraRows:1})}<p>Eine Gruppe mit ${n} kommt dazu.</p></div>`;
 if(config.kind==='double-known')return `<div class="tipbox"><p>Denk an die ${config.knownLabel}. Nimm sie zweimal.</p><div class="big-formula"><span class="math-chip">${config.knownRow} × ${n} = ${config.knownRow*n}</span><span class="math-sign">+</span><span class="math-chip new">${config.knownRow} × ${n} = ${config.knownRow*n}</span><span class="math-sign">=</span><span class="math-chip new">${config.row*n}</span></div>${rowsVisual(config.knownRow,n,{extraRows:config.knownRow})}<p>Zwei Zweiergruppen zusammen sind vier Gruppen.</p></div>`;
 if(config.kind==='minus-one')return `<div class="tipbox"><p>Denk an die ${config.knownLabel}. Nimm eine Gruppe wieder weg.</p><div class="big-formula"><span class="math-chip">${config.knownRow} × ${n} = ${config.knownRow*n}</span><span class="math-sign">−</span><span class="math-chip new">1 × ${n} = ${n}</span><span class="math-sign">=</span><span class="math-chip new">${config.row*n}</span></div>${rowsVisual(config.row,n,{removedRows:1})}<p>Von 10 Gruppen mit ${n} bleibt 9 mal ${n} übrig.</p></div>`;
 return '';
}
function makeQuestions(){
 if(config.kind==='test')return random(config.rows.flatMap(row=>random(Array.from({length:10},(_,i)=>i+1)).slice(0,3).map(n=>({row,n}))));
 if(config.kind==='mix')return random(config.rows.flatMap(row=>random(Array.from({length:10},(_,i)=>({row,n:i+1}))).slice(0,Math.ceil(config.total/config.rows.length)))).slice(0,config.total);
 const firsts=[2,5,9];
 const numbers=[...firsts,...random(Array.from({length:10},(_,i)=>i+1).filter(n=>!firsts.includes(n)))];
 while(numbers.length<config.total)numbers.push(1+Math.floor(Math.random()*10));
 return numbers.slice(0,config.total).map(n=>({row:config.row,n}));
}
function updateStats(){if(!stats)return;$('progress').textContent=`Richtig: ${correct}`;if(config.kind==='test'){$('hearts').textContent='27 Aufgaben';$('hearts').setAttribute('aria-label','Gesamttest mit 27 Aufgaben');}else{$('hearts').textContent='♥'.repeat(hearts)+'♡'.repeat(3-hearts);$('hearts').setAttribute('aria-label',hearts+' Herzen');}}
function renderIntro(){intro.classList.remove('hidden');play.classList.add('hidden');finish.classList.add('hidden');intro.innerHTML=introBlock(config,config.exampleN||6);$('start').addEventListener('click',start);}
function start(){questions=makeQuestions();index=0;correct=0;hearts=3;seen=[];intro.classList.add('hidden');finish.classList.add('hidden');play.classList.remove('hidden');updateStats();renderQuestion();}
function tauschHinweis(q){
 const merkReihen=config.kind==='bridge'?[2,3,4,5,6,7,8,9,10]:[2,5,10];
 if((config.kind!=='bridge'&&merkReihen.includes(q.row))||!merkReihen.includes(q.n)||q.row===q.n)return '';
 return '<div class="tausch-hinweis" role="note"><span aria-hidden="true">💡</span><span><strong>Tauschaufgabe:</strong> '+q.row+' × '+q.n+' = '+q.n+' × '+q.row+'. Nutze die <strong>'+q.n+'er-Reihe</strong>, wenn du diese Aufgabe bereits kennst. So geht es oft leichter!</span></div>';
}
function renderQuestion(){answered=false;hintOpen=false;const q=questions[index];$('question-count').textContent=`Aufgabe ${index+1} von ${questions.length}`;$('bar').style.width=`${index/questions.length*100}%`; $('question').innerHTML=`<div class="calc-line"><span>${q.row}</span><span>×</span><span>${q.n}</span><span>=</span><input id="answer" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="?" aria-label="Ergebnis eingeben"></div>`+tauschHinweis(q);
 $('feedback').textContent='';$('feedback').className='answer-feedback';$('next').classList.add('hidden');$('check').classList.remove('hidden');$('check').disabled=false;
 const tip=$('tip-toggle'),holder=$('tip-content');holder.innerHTML='';holder.classList.add('hidden');tip.textContent='💡 Tipp zeigen';tip.classList.toggle('hidden',config.kind==='mix'||config.kind==='test');tip.disabled=false;
 $('answer').addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!answered){ev.preventDefault();check();}else if(ev.key==='Enter'&&answered){ev.preventDefault();next();}});$('answer').focus({preventScroll:true});}
function toggleTip(){const q=questions[index];hintOpen=!hintOpen;const h=$('tip-content');h.classList.toggle('hidden',!hintOpen);if(hintOpen)h.innerHTML=hint(q.n);$('tip-toggle').textContent=hintOpen?'Tipp schliessen':'💡 Tipp zeigen';}
function record(q,ok,value,expected){try{window.SafariTelemetry?.record({task:`Aufgabe ${index+1}: ${q.row} × ${q.n} = ?`,correct:ok,correctCount:ok?1:0,total:1,answer:value,expected:String(expected),details:config.detail});}catch(e){console.warn('Telemetrie:',e);}}
function check(){if(answered)return;const q=questions[index],input=$('answer'),raw=input.value.trim();if(!/^\d{1,3}$/.test(raw)){$('feedback').textContent='Schreibe eine Zahl ins Feld.';$('feedback').className='answer-feedback incorrect';input.focus();return;}
 const expected=q.row*q.n,ok=Number(raw)===expected;answered=true;seen.push({q,ok});if(ok)correct++;else if(config.kind!=='test')hearts=Math.max(0,hearts-1);updateStats();record(q,ok,raw,expected);$('feedback').textContent=ok?'Super, richtig!':`Noch nicht ganz. ${q.row} × ${q.n} = ${expected}.`;$('feedback').className='answer-feedback '+(ok?'correct':'incorrect');input.readOnly=true;$('check').classList.add('hidden');$('next').classList.remove('hidden');$('next').textContent=(index===questions.length-1||(hearts===0&&config.kind!=='test'))?'Auswertung ansehen':'Nächste Aufgabe →';
 if(!ok&&config.kind!=='mix'&&config.kind!=='test'&&!hintOpen){hintOpen=true;$('tip-content').classList.remove('hidden');$('tip-content').innerHTML=hint(q.n);$('tip-toggle').textContent='Tipp schliessen';}}
function next(){if(!answered)return;if(index===questions.length-1||(hearts===0&&config.kind!=='test')){showFinish();return;}index++;renderQuestion();}
function showFinish(){
 try{window.SafariTelemetry?.record({task:'Einmaleins Abschluss',correct:seen.length===questions.length&&correct===questions.length,correctCount:correct,total:questions.length,answer:String(correct),expected:String(questions.length),details:config.detail});}catch(e){console.warn('Abschluss konnte nicht gespeichert werden:',e)}
 play.classList.add('hidden');finish.classList.remove('hidden');$('bar').style.width='100%';finish.innerHTML=`<div class="summary"><p class="eyebrow">Geschafft!</p><h2>Dein Einmaleins-Ergebnis</h2><div class="big">${correct} von ${seen.length}</div><p>${Math.round(100*correct/seen.length)} % richtig</p><p>${correct===seen.length?'Spitze! Du hast alles richtig gelöst.':'Gut geübt! Die kniffligen Rechnungen kannst du gleich nochmals probieren.'}</p><div class="buttons"><button class="btn" id="again">Neue Runde</button><a class="btn alt" href="../index.html#aktuelle" style="text-decoration:none">Zurück zur LernSafari</a></div></div>`;$('again').onclick=start;}
$('check').onclick=check;$('next').onclick=next;$('tip-toggle').onclick=toggleTip;
document.addEventListener('click',event=>{
 const control=event.target.closest('[data-bridge]');
 if(!control||config.kind!=='bridge')return;
 const next=Number(control.dataset.bridge);if(!Number.isInteger(next)||next<0||next>=config.bridges.length)return;
 activeBridge=next;
 if(!intro.classList.contains('hidden'))renderIntro();
 else if(hintOpen){$('tip-content').innerHTML=hint(questions[index].n)}
});
renderIntro();updateStats();
})();
