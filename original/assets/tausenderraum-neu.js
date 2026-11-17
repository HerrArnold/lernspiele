'use strict';
(function(){
 const $=id=>document.getElementById(id);
 const logic=window.LernSafariTausenderraumLogik;
 if(!logic)throw Error('Tausenderraum-Logik fehlt.');
 const mode=document.body.dataset.mode||'walk';
 const names={walk:'Tausenderbuch: Wege gehen',line:'Zahlenstrahl: Zahlen eintragen',
  neighbors:'Nachbarzahl, Nachbarzehner, Nachbarhunderter',test:'Teste dein Wissen: Tausenderraum'};
 const labels={find:'Tausenderbuch: Zahlen finden',walk:'Tausenderbuch: Wege gehen',
  line:'Zahlenstrahl: Zahlen eintragen',neighbors:'Nachbarzahlen'};
 const fields=[
  ['hundredLeft','Vorheriger Hunderter'],['hundredRight','Nächster Hunderter'],
  ['tenLeft','Vorheriger Zehner'],['tenRight','Nächster Zehner'],
  ['oneLeft','Vorherige Zahl'],['oneRight','Nächste Zahl']
 ];
 const state={tasks:[],index:0,page:0,selected:null,answers:[],submitted:false,results:[],phase:'intro',lineOffset:0};
 const random=a=>{let b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const btn=(id,label,kind='')=>'<button type="button" class="btn '+kind+'" id="'+id+'">'+label+'</button>';
 const getTask=()=>state.tasks[state.index];
 const show=(id,bool)=>{$(id).hidden=!bool;};
 const setFeedback=(message,cls='')=>{$('feedback').textContent=message;$('feedback').className='feedback '+cls;};
 const rand=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
 function makeTasks(){
  const types=mode==='test'?random(['find','walk','line','neighbors'].flatMap(type=>Array(5).fill(type))):Array(10).fill(mode);
  return types.map(type=>logic.randomTask(type));
 }
 function telemetry(task,correct,correctCount,total,answer,expected){
  try{window.SafariTelemetry?.record({
   task:'Aufgabe '+(state.index+1)+': '+labels[task.type],correct,correctCount,total,
   answer:String(answer),expected:String(expected),details:'Tausenderraum '+names[mode]
  })}catch(e){console.warn('LernSafari Telemetrie:',e)}
 }
 function reportFinal(){
  const sum=state.results.reduce((n,x)=>n+x.correctCount,0);
  const total=state.results.reduce((n,x)=>n+x.total,0);
  try{window.SafariTelemetry?.record({
   task:'Tausenderraum Abschluss',correct:sum===total&&state.results.length===state.tasks.length,
   correctCount:sum,total,answer:String(sum),expected:String(total),details:'Tausenderraum '+names[mode]
  })}catch(e){console.warn('LernSafari Abschluss:',e)}
 }
 function renderStart(){
  state.phase='intro';show('game',false);show('intro',true);show('finish',false);
  $('intro').innerHTML='<h2>'+esc(names[mode])+'</h2>'+
   (mode==='walk'?'<p>Du bekommst eine Startzahl und vier Pfeile. Gehe die Pfeile im Tausenderbuch ab und schreibe die Zielzahl auf. Die ausgefüllten Dreiecke wechseln eine ganze Seite, aber nicht die Position.</p>':
    mode==='line'?'<p>Finde die genaue Position einer Zahl auf dem Zahlenstrahl von 1 bis 1000. Jeder Strich ist eine Zahl. Hunderter sind besonders kräftig, Zehner mittelstark, Fünfer etwas länger.</p>':
    mode==='neighbors'?'<p>Finde die Zahlen links und rechts: zuerst die Nachbarhunderter, darunter die Nachbarzehner und danach die direkten Nachbarzahlen.</p>':
    '<p>20 Aufgaben – je fünf zum Tausenderbuch, zu Wegen, zum Zahlenstrahl und zu Nachbarzahlen. Am Schluss siehst du genau, welche Aufgaben falsch waren.</p>')+
   '<p class="help">Die Aufgaben wechseln zufällig. Jede Antwort wird einmal überprüft; der Test zeigt die vollständige Auswertung erst am Schluss.</p>'+btn('start','Jetzt starten');
  $('start').onclick=start;
 }
 function start(){
  state.tasks=makeTasks();state.index=0;state.results=[];state.answers=[];state.submitted=false;
  state.phase='play';show('intro',false);show('finish',false);show('game',true);renderQuestion();
 }
 function pageHTML(task){
  const page=state.page,first=page*100+1;
  let out='<div class="book-nav"><button id="prevPage" type="button" '+(page===0?'disabled':'')+' aria-label="Vorherige Seite">‹</button><strong>Seite '+(page+1)+' · '+first+'–'+(first+99)+'</strong><button id="nextPage" type="button" '+(page===9?'disabled':'')+' aria-label="Nächste Seite">›</button></div>';
  out+='<div class="book" role="group" aria-label="Tausenderbuch, Seite '+(page+1)+'">';
  for(let i=0;i<100;i++){
   const n=first+i,starting=task.type==='walk'&&task.start===n,chosen=state.selected===n;
   const classes='cell '+(starting?'start ':'')+(chosen?'selected ':'');
   const label=starting?'Startzahl '+n:n;
   out+='<button type="button" class="'+classes+'" data-book-number="'+n+'" aria-label="'+label+'"'+(task.type==='walk'?' tabindex="-1"':'')+'>'+n+'</button>';
  }
  return out+'</div>';
 }
 function bindBook(task){
  $('prevPage').onclick=()=>{state.page--; $('bookHost').innerHTML=pageHTML(task);bindBook(task)};
  $('nextPage').onclick=()=>{state.page++; $('bookHost').innerHTML=pageHTML(task);bindBook(task)};
  $('bookHost').querySelectorAll('[data-book-number]').forEach(button=>{
   button.onclick=()=>{if(state.submitted||task.type!=='find')return;
    state.selected=Number(button.dataset.bookNumber);
    $('bookHost').innerHTML=pageHTML(task);bindBook(task);
    setFeedback('Du hast einen Strich im Tausenderbuch ausgewählt.');
   };
  });
 }
 function renderBook(task){
  $('bookHost').innerHTML=pageHTML(task);bindBook(task);
 }
 function walkHTML(task){
  const symbols=task.path.map(x=>'<span class="path-step '+('▶◀'.includes(x)?'special':'')+'" aria-label="'+('▶◀'.includes(x)?(x==='▶'?'eine Seite vor':'eine Seite zurück'):x)+'">'+esc(x)+'</span>').join('');
  return '<p class="prompt">Starte bei <span class="value">'+task.start+'</span> und gehe diese vier Schritte:</p>'+
   '<div class="path" aria-label="Vier Schritte">'+symbols+'</div>'+
   '<div class="legend"><span>↗ ↑ ← ↓ ↘ ↖ ↙ → = <b>ein Feld</b></span><span><strong>▶ / ◀</strong> = eine ganze Buchseite, gleiche Stelle</span></div>'+
   '<div id="bookHost"></div><div class="targets"><div class="labelled-input"><label for="targetInput">Bei welcher Zahl landest du?</label><input id="targetInput" class="number-input" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Zielzahl" placeholder="?"></div></div>';
 }
 function findHTML(task){
  return '<p class="prompt">Finde die Zahl <span class="value">'+task.answer+'</span> im Tausenderbuch.</p>'+
   '<p class="help">Wechsle zuerst auf die richtige Buchseite. Tippe anschliessend auf das passende Feld.</p><div id="bookHost"></div>';
 }
 function tickHTML(n){
  const cls=n%100===0?'hundred':n%10===0?'ten':n%5===0?'five':'one';
  const label=n%10===0?'<span>'+n+'</span>':'';
  return '<button type="button" class="line-tick '+cls+(state.selected===n?' selected':'')+'" data-line-number="'+n+'" aria-label="Strich '+n+'" '+(state.selected===n?'ausgewählt':'')+'">'+label+'</button>';
 }
 function lineHTML(task){
  return '<p class="prompt">Markiere die Zahl <span class="value">'+task.answer+'</span> auf dem Zahlenstrahl.</p>'+
   '<p class="help">Jeder einzelne Strich zählt 1. Du kannst den Strahl seitlich verschieben. Tippe genau auf den Strich, den du für richtig hältst.</p>'+
   '<div id="lineScroll" class="line-scroll" tabindex="0" aria-label="Zahlenstrahl von 1 bis 1000, seitlich verschiebbar">'+
   '<div class="line-track" id="lineTrack">'+Array.from({length:1000},(_,i)=>tickHTML(i+1)).join('')+'</div></div>'+
   '<div class="line-notes"><span><b>│</b> Hunderter</span><span>Zehner</span><span>Fünfer</span><span>Kleine Striche: Einer</span></div>';
 }
 function neighborsHTML(task){
  return '<p class="prompt">Ergänze die Nachbarn der Zahl <span class="value">'+task.start+'</span>.</p>'+
   '<div class="neighbors">'+[['hundredLeft','hundredRight','Nachbarhunderter'],['tenLeft','tenRight','Nachbarzehner'],['oneLeft','oneRight','Nachbarzahlen']].map(([left,right,title])=>
     '<div class="neighbor-row">'+
      '<div class="neighbor-side"><small>'+title+' links</small><input class="number-input" data-field="'+left+'" inputmode="numeric" maxlength="4" aria-label="'+title+' links"></div>'+
      '<div class="neighbor-center">'+task.start+'</div>'+
      '<div class="neighbor-side"><small>'+title+' rechts</small><input class="number-input" data-field="'+right+'" inputmode="numeric" maxlength="4" aria-label="'+title+' rechts"></div>'+
     '</div>').join('')+'</div>';
 }
 function renderQuestion(){
  state.submitted=false;state.selected=null;state.answers=[];
  const task=getTask();state.page=task.type==='walk'?logic.coords(task.start).page:rand(0,9);
  $('counter').textContent='Aufgabe '+(state.index+1)+' von '+state.tasks.length+' · '+labels[task.type];
  $('task').innerHTML=task.type==='walk'?walkHTML(task):task.type==='find'?findHTML(task):task.type==='line'?lineHTML(task):neighborsHTML(task);
  setFeedback('');$('check').hidden=false;$('check').disabled=false;$('next').hidden=true;
  if(task.type==='walk'||task.type==='find')renderBook(task);
  if(task.type==='line'){
   const scroll=$('lineScroll');
   const visible=Math.max(15,Math.floor(scroll.clientWidth/22));
   const anchor=rand(Math.floor(visible*.22),Math.floor(visible*.78));
   state.lineOffset=Math.max(0,Math.min(1000-visible,task.answer-anchor));
   scroll.scrollLeft=state.lineOffset*22;
   $('lineTrack').addEventListener('click',event=>{
    if(state.submitted)return;
    const button=event.target.closest('[data-line-number]');if(!button)return;
    const old=$('lineTrack').querySelector('.selected');old?.classList.remove('selected');
    state.selected=Number(button.dataset.lineNumber);
    button.classList.add('selected');setFeedback('Position ausgewählt. Drücke «Überprüfen».');
   });
  }
  if(task.type==='walk'||task.type==='neighbors')$('task').querySelector('input')?.focus({preventScroll:true});
 }
 function numeric(text){const s=String(text||'').trim();return /^\d{1,4}$/.test(s)?Number(s):null}
 function readAnswer(task){
  if(task.type==='neighbors'){
   const answers={};for(const [id] of fields){const el=$('task').querySelector('[data-field="'+id+'"]');answers[id]=numeric(el?.value);if(answers[id]===null)return null}
   return answers;
  }
  if(task.type==='walk')return numeric($('targetInput').value);
  return state.selected;
 }
 function assess(task,value){
  if(task.type==='neighbors'){
   let incorrect=[],good=0;
   for(const [id,label] of fields){if(value[id]===task.answers[id])good++;else incorrect.push({id,label,given:value[id],expected:task.answers[id]})}
   return {ok:good===6,correctCount:good,total:6,incorrect,expected:task.answers};
  }
  const expected=task.answer,ok=value===expected;
  return {ok,correctCount:Number(ok),total:1,
   incorrect:ok?[]:[{label:labels[task.type],given:value,expected}],
   expected,off:task.type==='line'?Math.abs(value-expected):null};
 }
 function formatWrong(r){
  if(r.task.type==='neighbors')return r.assessed.incorrect.map(x=>x.label+': deine Antwort '+x.given+', richtig '+x.expected).join(' · ');
  if(r.task.type==='line')return 'Dein Strich: '+r.value+' · richtig: '+r.assessed.expected+' · '+r.assessed.off+' Strich'+(r.assessed.off===1?'':'e')+' daneben.';
  if(r.task.type==='walk')return 'Start: '+r.task.start+' · Weg: '+r.task.path.join(' ')+' · deine Antwort: '+r.value+' · richtig: '+r.task.answer+'.';
  return 'Gesucht: '+r.task.answer+' · ausgewählt: '+r.value+'.';
 }
 function check(){
  if(state.submitted)return;const task=getTask(),value=readAnswer(task);
  if(value===null){setFeedback(task.type==='find'||task.type==='line'?'Wähle zuerst ein Feld beziehungsweise einen Strich aus.':'Fülle bitte alle Zahlenfelder aus.','wrong');return}
  if(task.type==='walk'&&(value<1||value>1000)){setFeedback('Die Zielzahl muss zwischen 1 und 1000 liegen.','wrong');return}
  if(task.type==='neighbors'&&Object.values(value).some(x=>x<0||x>1000)){setFeedback('Alle Nachbarzahlen müssen im Tausenderraum liegen.','wrong');return}
  const assessed=assess(task,value);
  state.submitted=true;const item={task,value,assessed};state.results.push(item);
  telemetry(task,assessed.ok,assessed.correctCount,assessed.total,JSON.stringify(value),JSON.stringify(assessed.expected));
  if(task.type==='neighbors')for(const error of assessed.incorrect){
   const field=$('task').querySelector('[data-field="'+error.id+'"]');field?.classList.add('error');field?.setAttribute('aria-invalid','true');
  }
  $('check').hidden=true;$('next').hidden=false;
  $('next').textContent=state.index===state.tasks.length-1?'Auswertung ansehen':'Nächste Aufgabe →';
  if(mode==='test'){
   const off=task.type==='line'&&!assessed.ok?' Du liegst '+assessed.off+' Striche daneben.':'';
   setFeedback('Antwort gespeichert.'+off,assessed.ok?'ok':'wrong');
  }else{
   setFeedback(assessed.ok?'Richtig! Gut gemacht.':'Noch nicht ganz. '+formatWrong(item),assessed.ok?'ok':'wrong');
  }
 }
 function next(){
  if(!state.submitted)return;
  if(state.index===state.tasks.length-1){finish();return}
  state.index++;renderQuestion();
 }
 function finish(){
  reportFinal();state.phase='finished';show('game',false);show('finish',true);
  const right=state.results.reduce((v,r)=>v+r.assessed.correctCount,0),max=state.results.reduce((v,r)=>v+r.assessed.total,0);
  const mistakes=state.results.map((r,i)=>({r,i})).filter(x=>!x.r.assessed.ok);
  $('finish').innerHTML='<h2>Auswertung</h2><p class="status">'+right+' von '+max+' Antworten richtig · '+state.results.filter(r=>r.assessed.ok).length+' von '+state.tasks.length+' Aufgaben vollständig richtig</p>'+
   (mistakes.length?'<h3>Diese Aufgaben solltest du nochmals anschauen:</h3><ol class="review-list">'+mistakes.map(({r,i})=>'<li class="review-item"><strong>Aufgabe '+(i+1)+': '+esc(labels[r.task.type])+'</strong>'+esc(formatWrong(r))+'</li>').join('')+'</ol>':'<p class="feedback ok">Alles fehlerfrei gelöst! Super!</p>')+
   '<div class="controls">'+btn('again','Noch einmal spielen')+'</div>';
  $('again').onclick=renderStart;
 }
 $('check').onclick=check;$('next').onclick=next;
 document.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('.number-input')&&!state.submitted){event.preventDefault();check()}});
 renderStart();
})();
