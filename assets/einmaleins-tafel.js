'use strict';
(()=>{
  const $=id=>document.getElementById(id);
  const ns='http://www.w3.org/2000/svg';
  const missions=[
    {name:'Eine Gruppe mehr',from:[2,6],to:[3,6],formula:'2 × 6 + 6',intro:'Du kennst 2 · 6. Für 3 · 6 kommt eine Gruppe mit 6 dazu.',clue:'Die 3er-Reihe ist die 2er-Reihe plus eine Gruppe.',color:3},
    {name:'Zweimal so viel',from:[2,4],to:[4,4],formula:'2 × 4 + 2 × 4',intro:'Du kennst 2 · 4. Nimm diese Menge zweimal. Wie viel ist 4 · 4?',clue:'Die 4er-Reihe ist doppelt so viel wie die 2er-Reihe.',color:4},
    {name:'Wieder eine Gruppe dazu',from:[5,7],to:[6,7],formula:'5 × 7 + 7',intro:'Du kennst 5 · 7. Für 6 · 7 kommt eine Gruppe mit 7 dazu.',clue:'Die 6er-Reihe ist die 5er-Reihe plus eine Gruppe.',color:6},
    {name:'Eine Gruppe weniger',from:[10,4],to:[9,4],formula:'10 × 4 − 4',intro:'Du kennst 10 · 4. Nimm eine Gruppe mit 4 weg. Wie viel ist 9 · 4?',clue:'Die 9er-Reihe ist die 10er-Reihe minus eine Gruppe.',color:9},
    {name:'Tausche die Plätze',from:[5,3],to:[3,5],formula:'5 × 3 = 3 × 5',intro:'Du kennst 5 · 3. Wenn du die Zahlen tauschst, bleibt das Ergebnis gleich.',clue:'5 · 3 und 3 · 5 sind Tauschaufgaben.',color:3},
    {name:'Du kannst es!',from:[2,9],to:[3,9],formula:'2 × 9 + 9',intro:'Jetzt probierst du es alleine: von 2 · 9 zu 3 · 9.',clue:'Zwei Neunergruppen und noch eine Neunergruppe.',color:3}
  ];
  const quizQuestions=[
    {a:3,b:8,from:[2,8],op:'plus'},
    {a:4,b:6,from:[2,6],op:'double'},
    {a:6,b:4,from:[5,4],op:'plus'},
    {a:9,b:7,from:[10,7],op:'minus'},
    {a:3,b:5,from:[5,3],op:'swap'},
    {a:4,b:9,from:[2,9],op:'double'},
    {a:6,b:8,from:[5,8],op:'plus'},
    {a:9,b:3,from:[10,3],op:'minus'}
  ];
  let mode='guided',missionIndex=0,stage='base',results=[],answerLocked=false,quizIndex=0,quizResults=[],freePicks=[];
  const board=$('multiplication-board'),content=$('mode-content');
  const equal=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];
  const markKey=x=>x?x.join('-'):'';
  const square=n=>n*n;
  function element(tag,attrs={},text=null){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==null)e.textContent=text;return e;}
  function tileType(a,b){if(a===1||a===10||b===1||b===10)return 'edge';if(a===2||a===5||b===2||b===5)return 'known';if(a===7||a===8||b===7||b===8)return 'later';return 'new';}
  function boardMarks(){if(mode==='guided'&&missionIndex<missions.length){const m=missions[missionIndex];return {base:m.from,goal:m.to,selected:stage==='answer'?m.to:null};}if(mode==='quiz'&&quizIndex<quizQuestions.length){const q=quizQuestions[quizIndex];return {base:q.from,goal:[q.a,q.b],selected:[q.a,q.b]};}return {selected:freePicks[freePicks.length-1]};}
  function drawBoard(){const marks=boardMarks();board.textContent='';const u=23,C=265,Y=25;
    for(let r=0;r<10;r++)for(let c=0;c<10;c++){
      const a=r+1,b=c+1,x=C+(c-r)*u,y=Y+(c+r)*u;
      const g=element('g',{role:'button',tabindex:0,'aria-label':`${a} mal ${b}`});
      const states=['tile',tileType(a,b)];if(equal(marks.base,[a,b]))states.push('base');if(equal(marks.goal,[a,b]))states.push('goal');if(equal(marks.selected,[a,b]))states.push('selected');
      if(freePicks.some(p=>equal(p,[a,b])))states.push('selected');g.setAttribute('class',states.join(' '));
      g.appendChild(element('polygon',{points:`${x},${y} ${x+u},${y+u} ${x},${y+2*u} ${x-u},${y+u}`}));
      g.appendChild(element('text',{x,y:y+u+5,'text-anchor':'middle','aria-hidden':true},`${a}·${b}`));
      g.addEventListener('click',()=>chooseTile(a,b));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseTile(a,b)}});board.appendChild(g);
    }
  }
  function notify(message,type='info'){const el=$('message');if(el){el.textContent=message;el.className=`message ${type}`;}}
  function tracker(index,total){return `<div class="task-number">Auftrag ${index+1} von ${total}</div><div class="progress-line"><span style="width:${index/total*100}%"></span></div>`;}
  function dots(groups,count,showExtra=true){return `<div class="mini-groups" aria-label="${groups} Gruppen mit je ${count}">${Array.from({length:groups},(_,row)=>`<div class="dot-group"><small>${row===groups-1&&showExtra?'Noch 1 Gruppe':`Gruppe ${row+1}`}</small>${Array.from({length:count},()=>`<span class="dot ${row===groups-1&&showExtra?'extra':''}"></span>`).join('')}</div>`).join('')}</div>`;}
  function missionView(){if(missionIndex>=missions.length){const successes=results.filter(x=>x).length;content.innerHTML=`<p class="eyebrow-small">Teil 1 geschafft!</p><h2>Du bist ein Einmaleins-Forscher!</h2><p>Du hast alle ${missions.length} Zusammenhänge entdeckt.</p><div class="math-display">${successes} von ${missions.length} richtig</div><p>Jetzt kannst du die ganze Tafel erforschen oder dein Wissen ausprobieren.</p><button class="btn" id="goto-quiz">Wissen testen →</button><button class="btn alt" id="again">Nochmals entdecken</button>`;$('goto-quiz').onclick=()=>switchTab('quiz');$('again').onclick=()=>{missionIndex=0;results=[];stage='base';missionView();drawBoard();};return;}
    const m=missions[missionIndex],known=m.from[0]*m.from[1];
    const phrase=stage==='base'?`Tippe in der Tafel zuerst auf <strong>${m.from[0]} · ${m.from[1]}</strong>.`:stage==='target'?`Jetzt suche <strong>${m.to[0]} · ${m.to[1]}</strong> in der Tafel.`:'Rechne das Ergebnis aus.';
    content.innerHTML=`${tracker(missionIndex,missions.length)}<p class="eyebrow-small">${m.name}</p><h2>Wie hängen die Aufgaben zusammen?</h2><p>${m.intro}</p><p class="big-step">${phrase}</p>${stage==='base'?'<div class="helper">Die blaue Markierung zeigt dir die bekannte Aufgabe.</div>':''}${stage!=='base'?`<div class="math-display">${m.from[0]} × ${m.from[1]} = ${known}</div>`:''}${stage==='answer'?`<div class="math-display"><strong>${m.to[0]} × ${m.to[1]} = ?</strong></div><div class="answer-box"><label for="task-answer">Dein Ergebnis:</label><input id="task-answer" type="number" min="0" max="100" inputmode="numeric" autocomplete="off"></div><button class="btn" id="check-answer">Überprüfen</button><button class="btn alt" id="hint-btn">💡 Rechenbild zeigen</button><div id="hint" class="hidden"></div>`:''}<div id="message" class="message info" role="status" aria-live="polite">${stage==='base'?'Beginne mit der blauen Aufgabe.':stage==='target'?'Suche die neue Aufgabe mit der rosa Umrandung.':'Denke an die bekannte Aufgabe.'}</div><button id="next-mission" class="btn pink hidden">Nächster Auftrag →</button>`;
    if(stage==='answer'){$('check-answer').onclick=()=>checkGuided();$('hint-btn').onclick=()=>{$('hint').innerHTML=`<p>${m.clue}</p>${dots(m.to[0],m.to[1],m.to[0]!==4&&m.to[0]!==9&&m.to[0]!==3&&m.to[0]!==5)}`;$('hint').classList.toggle('hidden');};$('task-answer').addEventListener('keydown',e=>{if(e.key==='Enter')checkGuided()});}
    $('next-mission').onclick=()=>{missionIndex++;stage='base';missionView();drawBoard();};
  }
  function record(task,correct,answer,expected,details){try{window.SafariTelemetry?.record({task,correct,correctCount:correct?1:0,total:1,answer:String(answer),expected:String(expected),details});}catch(e){console.warn('Ergebnis nicht gespeichert',e)}}
  function checkGuided(){const input=$('task-answer');if(!input||input.disabled)return;const val=input.value.trim(),m=missions[missionIndex];if(!/^\d{1,3}$/.test(val)){notify('Schreibe eine Zahl ins Feld.','warn');return;}const expect=m.to[0]*m.to[1],right=Number(val)===expect;
    if(right){input.disabled=true;$('check-answer').disabled=true;results.push(true);notify(`${m.to[0]} · ${m.to[1]} = ${expect}. ${m.clue}`,'');$('next-mission').classList.remove('hidden');record(`Einmaleins-Tafel: ${m.name}`,true,val,expect,m.formula);}else{notify('Das stimmt noch nicht. Schau die bekannte Aufgabe an oder öffne den Tipp.','warn');record(`Einmaleins-Tafel: ${m.name}`,false,val,expect,m.formula);}
  }
  function chooseTile(a,b){if(mode==='guided'){
      const m=missions[missionIndex];if(!m)return;
      if(stage==='base'&&equal([a,b],m.from)){stage='target';missionView();drawBoard();return}
      if(stage==='target'&&equal([a,b],m.to)){stage='answer';missionView();drawBoard();return}
      if(stage==='answer')notify('Die Rechnung ist ausgewählt. Schreibe jetzt ihr Ergebnis.');
      else notify(`Das ist ${a} · ${b}. Gesucht ist ${stage==='base'?m.from.join(' · '):m.to.join(' · ')}.`, 'warn');
    }else if(mode==='free'){
      const value=[a,b];if(freePicks.length===2)freePicks=[];freePicks.push(value);freeView();drawBoard();
    }else if(mode==='quiz'){
      const q=quizQuestions[quizIndex];if(!q)return;
      if(a===q.a&&b===q.b)notify(`Genau, ${a} · ${b} ist die gesuchte Rechnung. Jetzt berechne sie.`);else notify(`Das ist ${a} · ${b}. Wir suchen ${q.a} · ${q.b}.`);
    }
  }
  function freeView(){let chosen='';if(freePicks.length){const [a,b]=freePicks[freePicks.length-1];chosen=`<div class="math-display">${a} × ${b} = <strong>${a*b}</strong></div>`;}
    let compare='';if(freePicks.length===2){const [[a,b],[c,d]]=freePicks;
      let note='Welche Zahlen haben sich verändert?';
      if(a===d&&b===c)note='Das sind Tauschaufgaben. Das Ergebnis bleibt gleich!';
      else if(b===d){const n=c-a;if(n===1)note=`Eine Gruppe mit ${b} kommt dazu. Das sind ${b} mehr.`;else if(n===-1)note=`Eine Gruppe mit ${b} fällt weg. Das sind ${b} weniger.`;else if(c===2*a)note='Die zweite Aufgabe ist doppelt so gross!';}
      else if(a===c){const n=d-b;if(n===1)note=`In jeder der ${a} Gruppen kommt ein Punkt dazu. Das sind ${a} mehr.`;else if(n===-1)note=`In jeder Gruppe fehlt ein Punkt. Das sind ${a} weniger.`;}
      compare=`<div class="message">${a} × ${b} = ${a*b}<br>${c} × ${d} = ${c*d}<br><strong>${note}</strong></div>`;
    }
    content.innerHTML=`<p class="eyebrow-small">Teil 2 · Frei entdecken</p><h2>Was fällt dir auf?</h2><p>Tippe auf zwei Aufgaben der Einmaleins-Tafel. Vergleiche ihre Ergebnisse.</p><div class="helper">Erforsche vor allem die 3er-, 4er-, 6er- und 9er-Reihe. Die 7er- und 8er-Reihe lernst du später.</div>${chosen||'<div class="math-display">Wähle eine Rechnung.</div>'}${compare}<p>Ideen zum Forschen:</p><div class="mission-grid"><button data-explore="3,6|2,6">3 · 6 und 2 · 6</button><button data-explore="4,5|2,5">4 · 5 und 2 · 5</button><button data-explore="9,4|10,4">9 · 4 und 10 · 4</button><button data-explore="5,3|3,5">5 · 3 und 3 · 5</button></div>`;
    content.querySelectorAll('[data-explore]').forEach(x=>x.onclick=()=>{const [one,two]=x.dataset.explore.split('|').map(s=>s.split(',').map(Number));freePicks=[two,one];freeView();drawBoard();});
  }
  function quizView(){if(quizIndex>=quizQuestions.length){const count=quizResults.filter(Boolean).length;content.innerHTML=`<p class="eyebrow-small">Teil 3 geschafft</p><h2>Gut geforscht!</h2><div class="math-display">${count} von ${quizResults.length} richtig</div><p>${count===quizResults.length?'Du hast alle Zusammenhänge verstanden!':'Du kannst weiterforschen und es nochmals probieren.'}</p><button class="btn" id="quiz-again">Neue Runde starten</button><button class="btn alt" id="free-again">Frei forschen</button>`;$('quiz-again').onclick=()=>{quizIndex=0;quizResults=[];quizView();drawBoard();};$('free-again').onclick=()=>switchTab('free');return;}
    const q=quizQuestions[quizIndex],baseVal=q.from[0]*q.from[1];let line='';
    if(q.op==='plus')line=`${q.from[0]} × ${q.from[1]} + ${q.b}`;
    if(q.op==='double')line=`${q.from[0]} × ${q.from[1]} + ${q.from[0]} × ${q.from[1]}`;
    if(q.op==='minus')line=`${q.from[0]} × ${q.from[1]} − ${q.b}`;
    if(q.op==='swap')line=`${q.from[0]} × ${q.from[1]} = ${q.a} × ${q.b}`;
    content.innerHTML=`${tracker(quizIndex,quizQuestions.length)}<p class="eyebrow-small">Teil 3 · Dein Wissen</p><h2>Kannst du die Rechnung lösen?</h2><p>Du kennst bereits die blaue Aufgabe:</p><div class="math-display">${q.from[0]} × ${q.from[1]} = ${baseVal}</div><p>Das ist die neue Aufgabe:</p><div class="math-display"><strong>${q.a} × ${q.b} = ?</strong></div><div class="answer-box"><label for="quiz-answer">Ergebnis:</label><input id="quiz-answer" type="number" min="0" max="100" inputmode="numeric" autocomplete="off"></div><button class="btn" id="quiz-check">Überprüfen</button><button class="btn alt" id="quiz-hint-btn">💡 Tipp</button><div id="quiz-hint" class="hidden helper">${line}</div><div id="message" class="message info" role="status" aria-live="polite">Du kannst in der Tafel nachsehen.</div><button id="quiz-next" class="btn pink hidden">Weiter →</button>`;
    $('quiz-check').onclick=()=>checkQuiz();$('quiz-answer').onkeydown=e=>{if(e.key==='Enter')checkQuiz()};$('quiz-hint-btn').onclick=()=>{$('quiz-hint').classList.toggle('hidden');};$('quiz-next').onclick=()=>{quizIndex++;quizView();drawBoard()};
  }
  function checkQuiz(){const input=$('quiz-answer');if(!input||input.disabled)return;const value=input.value.trim();if(!/^\d{1,3}$/.test(value)){notify('Schreibe zuerst ein Ergebnis.','warn');return;}
    const q=quizQuestions[quizIndex],expect=q.a*q.b,right=Number(value)===expect;quizResults.push(right);record(`Einmaleins-Tafel: ${q.a} × ${q.b}`,right,value,expect,`Bekannte Aufgabe: ${q.from[0]} × ${q.from[1]}`);input.disabled=true;$('quiz-check').disabled=true;
    notify(right?`Genau! ${q.a} · ${q.b} = ${expect}.`:`Die Lösung ist ${expect}. Vergleiche mit der bekannten Aufgabe.` ,right?'':'warn');$('quiz-next').classList.remove('hidden');$('quiz-next').textContent=quizIndex===quizQuestions.length-1?'Ergebnis sehen':'Nächste Aufgabe →';
  }
  function switchTab(value){mode=value;content.textContent='';for(const b of document.querySelectorAll('[data-tab]')){const active=b.dataset.tab===value;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));}if(mode==='guided')missionView();else if(mode==='free')freeView();else quizView();drawBoard();}
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  $('reset-markers').onclick=()=>{if(mode==='free'){freePicks=[];freeView();}else if(mode==='guided'){stage='base';missionView();}drawBoard();};
  switchTab('guided');
})();
