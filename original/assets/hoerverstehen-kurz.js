/* LernSafari · fünf Hörverständnisse. Eindeutig korrigierbare Auswahlaufgaben. */
'use strict';
(async()=>{
 const id=window.HOER_KURZ,root=document.getElementById('short-hearing-app');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const parts=['Richtig oder falsch?','Fragen möglichst genau beantworten','Wörter anders erklären','Reihenfolge'];
 const points=[8,5,3,4],answers={tf:{},open:{},words:{},order:{}};
 let data,step=0,finished=false;
 const get=s=>root.querySelector(s);
 const auth=()=>{try{return window.parent.SafariLogin?.auth?.()||null}catch{return null}};
 function choice(q,type,number){
   const selected=answers[type][q.id];
   return '<fieldset class="hv-item"><legend><b>'+number+'.</b> '+esc(type==='words'?'Was bedeutet «'+q.term+'»?':q.question)+'</legend>'+
    '<div class="hv-options">'+q.options.map((o,j)=>'<label class="hv-option"><input type="radio" name="'+type+'-'+number+'" data-choice="'+type+'" data-id="'+esc(q.id)+'" value="'+j+'" '+(selected===j?'checked':'')+'><span>'+esc(o)+'</span></label>').join('')+'</div></fieldset>';
 }
 function content(){
  if(step===0)return '<p class="hv-instruction">Höre genau zu. Entscheide bei jedem Satz: richtig oder falsch?</p><div class="hv-items">'+data.task1.map((q,i)=>'<fieldset class="hv-item"><legend><b>'+(i+1)+'.</b> '+esc(q.statement)+'</legend><div class="hv-two">'+['Richtig','Falsch'].map((label,j)=>'<label><input type="radio" name="tf-'+i+'" data-choice="tf" data-id="'+esc(q.id)+'" value="'+(j===0?1:0)+'" '+(answers.tf[q.id]===(j===0?1:0)?'checked':'')+'><span>'+label+'</span></label>').join('')+'</div></fieldset>').join('')+'</div>';
  if(step===1)return '<p class="hv-instruction">Beantworte die Fragen möglichst genau. Kreuze jeweils <strong>eine</strong> passende Antwort an. Lies alle vier Antworten aufmerksam!</p><div class="hv-items">'+data.task2.map((q,i)=>choice(q,'open',i+1)).join('')+'</div>';
  if(step===2)return '<p class="hv-instruction">Erkläre mit anderen Worten, was diese Wörter bedeuten. Wähle jeweils <strong>eine</strong> Erklärung.</p><div class="hv-items">'+data.task3.map((q,i)=>choice(q,'words',i+1)).join('')+'</div>';
  return '<p class="hv-instruction">Ordne die Textstellen in die richtige Reihenfolge: 1 ist zuerst, 4 ist zuletzt. Jede Zahl darf nur einmal vorkommen.</p><div class="hv-items">'+data.task4.map((q,i)=>'<label class="hv-item hv-order"><span>'+esc(q.text)+'</span><select data-order="'+esc(q.id)+'" aria-label="Position für '+esc(q.text)+'"><option value="">Zahl wählen</option>'+[1,2,3,4].map(n=>'<option value="'+n+'" '+(answers.order[q.id]===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label>').join('')+'</div>';
 }
 function save(){root.querySelectorAll('[data-choice]:checked').forEach(x=>{answers[x.dataset.choice][x.dataset.id]=Number(x.value)});root.querySelectorAll('[data-order]').forEach(x=>{answers.order[x.dataset.order]=x.value?Number(x.value):null})}
 function showStep(){
  const host=get('#hvWork'); if(!host||finished)return;
  host.innerHTML='<div class="hv-progress"><div class="hv-progress-text">Aufgabe '+(step+1)+' von 4 <strong>'+parts[step]+'</strong></div><div class="hv-progressbar"><span style="width:'+((step+1)*25)+'%"></span></div></div><section class="hv-panel"><div class="hv-section-head"><h2>'+parts[step]+'</h2><span>'+points[step]+' Punkte</span></div>'+content()+'</section><div class="hv-actions"><button type="button" id="hvPrevious" class="hv-soft" '+(step===0?'disabled':'')+'>← Zurück</button><button type="button" id="hvNext" class="hv-main">'+(step===3?'Antworten abgeben':'Weiter →')+'</button></div><p class="hv-note">Deine Antworten bleiben beim Wechsel erhalten. Du kannst sie bis zur Abgabe verändern.</p>';
  get('#hvPrevious').onclick=()=>{save();step--;showStep()};
  get('#hvNext').onclick=()=>{save();if(step<3){step++;showStep()}else submit()};
 }
 function render(){
  root.innerHTML='<header class="hv-hero"><div><div class="hv-eyebrow">🎧 Lern-Lagune · Deutsch · Hörverständnis</div><h1>'+esc(data.title)+'</h1><p>Höre die Geschichte und löse alle vier Aufgaben. Du darfst die Aufnahme jederzeit nochmals abspielen.</p></div><span class="hv-badge">20 Punkte</span></header>'+
  '<div class="hv-player"><div><strong>🔊 Hörgeschichte</strong><small>Höre, halte an und spule zurück.</small></div><audio controls preload="metadata" id="hvAudio" src="'+esc(data.audio)+'"></audio><button type="button" id="hvBackAudio" class="hv-soft">↶ 10 s</button><button type="button" id="hvRestartAudio" class="hv-soft">↻ Anfang</button></div><p id="hvAudioError" class="hv-alert" hidden>Das Audio konnte nicht geladen werden. Bitte melde es deiner Lehrperson.</p><div id="hvWork"></div><div id="hvHelpers"></div>';
  const player=get('#hvAudio');player.addEventListener('error',()=>get('#hvAudioError').hidden=false);
  get('#hvBackAudio').onclick=()=>player.currentTime=Math.max(0,player.currentTime-10);
  get('#hvRestartAudio').onclick=()=>{player.currentTime=0;player.play().catch(()=>{})};
  showStep();void helpers();
 }
 async function helpers(){
  const host=get('#hvHelpers'),user=auth();if(!host||user?.role!=='child')return;
  let token='';try{token=localStorage.getItem('lernsafari-token-v1')||window.parent.localStorage.getItem('lernsafari-token-v1')||''}catch{}
  if(!token)return;
  const base=String(window.parent.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/\/+$/,'');
  try{
   const r=await fetch(base+'/learning-helpers?target='+encodeURIComponent('game:hoerverstehen-kurz-'+id),{headers:{Authorization:'Bearer '+token}});
   if(!r.ok)return;const json=await r.json();const names=(json.helpers||[]).filter(x=>x&&typeof x==='string').slice(0,3);
   if(!names.length)return;host.innerHTML='<aside class="hv-helper"><strong>🌟 Expertinnen und Experten</strong><p>Diese drei Kinder haben bei diesem Hörverständnis besonders gute Ergebnisse erzielt. Du kannst sie um Hilfe bitten.</p><div>'+names.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div></aside>';
  }catch{}
 }
 function assessment(){
  const entries=[];let score=0;const add=(question,okay)=>{entries.push({question,okay});if(okay)score++};
  for(const q of data.task1)add(q.statement,answers.tf[q.id]===Number(q.correct));
  for(const q of data.task2)add(q.question,answers.open[q.id]===q.correct_index);
  for(const q of data.task3)add('«'+q.term+'»',answers.words[q.id]===q.correct_index);
  const used=data.task4.map(q=>answers.order[q.id]);const unique=new Set(used);
  for(const q of data.task4)add(q.text,unique.size===4&&used.every(n=>n>=1&&n<=4)&&answers.order[q.id]===q.correct_position);
  return {score,entries};
 }
 function submit(){
  const missing=data.task1.filter(q=>answers.tf[q.id]===undefined).length+data.task2.filter(q=>answers.open[q.id]===undefined).length+data.task3.filter(q=>answers.words[q.id]===undefined).length+data.task4.filter(q=>!answers.order[q.id]).length;
  const ord=data.task4.map(q=>answers.order[q.id]);if(new Set(ord).size!==4||ord.some(n=>!(n>=1&&n<=4))){alert('Bitte benutze bei der Reihenfolge die Zahlen 1, 2, 3 und 4 je einmal.');return}
  if(missing){alert('Bitte beantworte zuerst alle Fragen. Es fehlen noch '+missing+' Antworten.');return}
  finished=true;const {score,entries}=assessment();const percent=Math.round(score/20*100);
  get('#hvWork').innerHTML='<section class="hv-result" role="status"><h2>🌟 Gut gemacht!</h2><div class="hv-score"><strong>'+score+' / 20</strong><span>'+percent+' % richtig · '+(20-score)+' Fehler</span></div><p>Alle Antworten wurden automatisch ausgewertet.</p><details><summary>Deine Antworten überprüfen</summary><div class="hv-feedback">'+entries.map(x=>'<div class="hv-feedback-item"><span class="hv-result-'+(x.okay?'right':'wrong')+'">'+(x.okay?'✓':'✕')+'</span><div><strong>'+esc(x.question)+'</strong><small>'+(x.okay?'Richtig':'Noch nicht richtig')+'</small></div></div>').join('')+'</div></details><button type="button" class="hv-main" id="hvAgain">Noch einmal üben</button></section>';
  get('#hvAgain').onclick=()=>{finished=false;step=0;for(const a of Object.values(answers))for(const k of Object.keys(a))delete a[k];showStep()};
  try{const api=window.parent.SafariLogin;if(api?.auth?.()?.role==='child'&&api?.request)api.request('/game-attempt','POST',{game:'hoerverstehen-kurz-'+id,task:data.title,correct:score===20,correctCount:score,total:20,answer:String(score),expected:'20',details:percent+' Prozent richtig'}).catch(()=>{})}catch{}
  void helpers();
 }
 try{if(!/^(affe|loewe|brille|wettrennen|kuchen)$/.test(id))throw Error('Unbekanntes Hörverständnis');
  const r=await fetch('../hoerverstehen-data/kurz-'+id+'.json',{cache:'no-store'});if(!r.ok)throw Error('Daten konnten nicht geladen werden');data=await r.json();
  if(data.task1.length!==8||data.task2.length!==5||data.task3.length!==3||data.task4.length!==4||[...data.task2,...data.task3].some(q=>q.options?.length!==4||!(q.correct_index>=0&&q.correct_index<4)))throw Error('Die Aufgaben sind unvollständig');
  render();
 }catch(e){root.innerHTML='<div class="hv-alert">Dieses Hörverständnis konnte nicht gestartet werden: '+esc(e.message)+'</div>'}
})();