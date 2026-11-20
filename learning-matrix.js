/* LernSafari: read-only Lernaktivität for Flamingo.
   Percentages are calculated ONLY from completed scored rounds;
   a page opening or an individual answer is never called a finished round. */
'use strict';
(function(root){
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const E={lagoon:'🌊 Lern-Lagune',oasis:'🏝️ Oase',baobab:'🌳 Baobab-Baum'};
 const oase=[
  ['Schach','Schach-Lexikon','schach-lexikon'],['Schach','Schach gegen den Computer','schach-computer'],
  ['Knobelaufgaben','Sudoku','oase-sudoku'],['Knobelaufgaben','Buchstabensalat','oase-buchstabensalat'],
  ['Knobelaufgaben','Zahlen-Detektiv','oase-zahlenmuster'],
  ['Pokémon Pocket','Pokémon-Lexikon','pokemon-pocket:lexikon'],
  ['Pokémon Pocket','Schritt für Schritt üben','pokemon-pocket:uebungen'],
  ['Pokémon Pocket','Mit echten Karten spielen','pokemon-pocket:analog'],
  ['Pokémon Pocket','Gegen den Computer spielen (nur Flamingo)','pokemon-pocket-simulator'],
  ['Kreativatelier','Mein Malatelier','oase-zeichnen'],
  ['Kreativatelier','Zeichenschule','oase-abzeichnen'],['Kreativatelier','Ausmalstudio','oase-ausmalen']
 ];
 const baobab=[
  ['Baobab-Baum','Unsere Klassentiere','animals'],
  ['Baobab-Baum','Adventskalender (noch nicht freigegeben)','advent'],
  ['Baobab-Baum','Erlebnisse – Fotoübersicht','projects'],
  ['Klassentiere','Tier-Memory','memory'],
  ['Klassentiere','Tiernamen schreiben','spelling']
 ];
 function catalog(){
  const entries=[];
  for(const [subject,topics] of Object.entries(root.LernSafariTopicCatalog||{})){
   for(const topic of topics||[]){
    for(const g of topic.games||[]){
     const [title,file]=Array.isArray(g)?g:[g.title,g.file];
     if(!file)continue;
     entries.push({area:'lagoon',group:subject,topic:topic.name,title,content:String(file).replace(/\.html$/,''),
      archived:!!topic.archived});
    }
   }
  }
  for(const [group,title,content] of oase)entries.push({area:'oasis',group,topic:group,title,content});
  for(const [group,title,content] of baobab)entries.push({area:'baobab',group,topic:group,title,content});
  for(const a of root.LernSafariBaobabAnimals||[])entries.push({area:'baobab',group:'Klassentiere',topic:'Klassentiere',title:a.name+' – Steckbrief und Quiz',content:'animal:'+a.id});
  const ids=new Set();
  return entries.filter(x=>{const k=x.area+'|'+x.content;if(ids.has(k))return false;ids.add(k);return true;});
 }
 function roundScore(row){
  const earned=Number(row.correct_count),total=Number(row.total);
  if(!Number.isFinite(earned)||!Number.isFinite(total)||total<=0||earned<0||earned>total)return null;
  return Math.round(earned/total*100);
 }
 function organize(raw){
  const lookup=new Map();
  const ensure=(name,area,content)=>{
   const k=name+'|'+area+'|'+content;
   if(!lookup.has(k))lookup.set(k,{user:name,area,content,opens:0,answers:0,runs:[],first:null,best:null,highscore:null});
   return lookup.get(k);
  };
  for(const v of raw.visits||[]){
   if(typeof v.username!=='string')continue;
   const x=ensure(v.username,v.area,v.content);
   x.opens=Math.max(0,Number(v.opens)||0);
  }
  for(const v of raw.answerCounts||[]){
   if(typeof v.username!=='string')continue;
   const area=gameArea(v.game),content=area==='baobab'&&String(v.game).startsWith('tierwelt-')?'animal:'+String(v.game).slice(9):v.game==='tier-namen'?'spelling':v.game==='tier-memory'?'memory':v.game;
   const x=ensure(v.username,area,content);
   x.answers=Math.max(0,Number(v.answers)||0);
  }
  // Historical raw highscores from the former progress report remain visible as points.
  // A highscore is NOT automatically a percentage or proof of a completed round.
  for(const h of raw.highscores||[]){
   if(typeof h.username!=='string')continue;
   const score=Number(h.score);
   if(!Number.isFinite(score)||score<0)continue;
   const area=gameArea(h.game),content=area==='baobab'&&String(h.game).startsWith('tierwelt-')?'animal:'+String(h.game).slice(9):h.game==='tier-namen'?'spelling':h.game==='tier-memory'?'memory':h.game;
   const entry=ensure(h.username,area,content);
   entry.highscore=Math.max(entry.highscore??0,score);
  }
  const ordered=(raw.completions||[]).slice().sort((a,b)=>String(a.happened_at||'').localeCompare(String(b.happened_at||''))||Number(a.id||0)-Number(b.id||0));
  for(const v of ordered){
   if(typeof v.username!=='string')continue;
   const area=gameArea(v.game),content=area==='baobab'&&String(v.game).startsWith('tierwelt-')?'animal:'+String(v.game).slice(9):v.game==='tier-namen'?'spelling':v.game==='tier-memory'?'memory':v.game;
   const x=ensure(v.username,area,content);
   const score=roundScore(v);
   if(score===null)continue;
   x.runs.push(score);x.first=x.runs[0];x.best=Math.max(...x.runs);
  }
  return lookup;
 }
 function gameArea(game){
  const g=String(game||'');
  if(g.startsWith('oase-')||g.startsWith('schach-')||g.startsWith('pokemon-pocket'))return 'oasis';
  if(g.startsWith('baobab-')||g.startsWith('tierwelt-')||g==='tier-namen'||g==='tier-memory')return 'baobab';
  return 'lagoon';
 }
 function band(percent){
  if(percent===null||!Number.isFinite(percent))return 'ls-matrix-neutral';
  if(percent>=80)return 'ls-matrix-green';
  if(percent>=50)return 'ls-matrix-yellow';
  return 'ls-matrix-red';
 }
 function cell(x){
  if(!x||(!x.opens&&!x.answers&&!x.runs.length&&x.highscore===null))return '<td class="ls-matrix-empty" title="Noch keine Daten">–</td>';
  let label=x.runs.length?
   '<strong>'+x.runs.length+'×</strong><small>1.: '+x.first+'% · Best: '+x.best+'%</small>':
   '<strong>'+(x.opens?x.opens+' Aufruf'+(x.opens===1?'':'e'):x.answers?x.answers+' Einzelprüfungen':'Historischer Highscore')+'</strong><small>'+ (x.answers&&x.opens?x.answers+' Einzelprüfungen · ':'')+'keine abgeschlossene Wertung</small>';
  if(x.runs.length&&x.opens)label+='<small>'+x.opens+' Aufrufe</small>';
  if(x.highscore!==null)label+='<small>⭐ '+x.highscore+' Punkte (Highscore)</small>';
  return '<td class="ls-matrix-cell '+band(x.best)+'" title="'+esc(x.runs.length?'Bester Durchlauf: '+x.best+' Prozent':'Keine bewertbare Gesamtauswertung')+'">'+label+'</td>';
 }
 function detail(x,user,item){
  if(!x||(!x.opens&&!x.answers&&!x.runs.length&&x.highscore===null))return '<td class="ls-matrix-empty">–</td>';
  return '<td class="ls-matrix-cell '+band(x.best)+'">'+
   '<strong>'+(x.runs.length?x.runs.length+' abgeschlossene Durchläufe':x.opens?x.opens+' Aufrufe':x.answers?x.answers+' Einzelprüfungen':'Historischer Highscore')+'</strong>'+
   '<small>Erster Durchlauf: '+(x.first===null?'–':x.first+'%')+'</small>'+
   '<small>Bester Durchlauf: '+(x.best===null?'–':x.best+'%')+'</small>'+
   '<small>'+x.opens+' Aufrufe · '+x.answers+' gespeicherte Einzelprüfungen</small>'+
   (x.highscore===null?'':'<small>⭐ Highscore: '+x.highscore+' Punkte</small>')+
   ((x.answers||x.runs.length||x.highscore!==null)&&item
    ?'<button type="button" class="ls-matrix-history-btn" data-lm-history-user="'+esc(user)+'" data-lm-history-game="'+esc(item.content.startsWith('animal:')?'tierwelt-'+item.content.slice(7):item.content==='memory'?'tier-memory':item.content==='spelling'?'tier-namen':item.content)+'">Einzelversuche ansehen</button>':'')+'</td>';
 }
 function mount({host,call}){
  host.innerHTML='<div class="ls-matrix-head"><p>📊 Was haben die Tiere ausprobiert? Grün bedeutet mindestens 80 % im besten vollständigen Durchlauf, Gelb 50–79 %, Rot unter 50 %. Unbewertete Inhalte bleiben neutral.</p>'+
   '<div class="ls-matrix-filters"><label>Bereich<select data-lm-area><option value="lagoon">🌊 Lern-Lagune</option><option value="oasis">🏝️ Oase</option><option value="baobab">🌳 Baobab-Baum</option></select></label>'+
   '<label data-lm-subject-wrap>Fach<select data-lm-subject></select></label>'+
   '<label>Ansicht<select data-lm-view><option value="all">Ganze Klasse</option><option value="one">Einzelnes Tier</option></select></label>'+
   '<label data-lm-child-wrap hidden>Tierkonto<select data-lm-child></select></label>'+
   '<button type="button" class="pd-secondary" data-lm-refresh>🔄 Ergebnisse abfragen</button></div>'+
   '<p class="ls-matrix-note">Die Tabelle wird nur beim Öffnen und auf Knopfdruck aktualisiert. Frühere Spielpunkte und Highscores erscheinen ebenfalls. Ein Highscore allein beweist keinen abgeschlossenen Durchlauf und wird nicht in Prozent umgerechnet.</p></div>'+
   '<div data-lm-content role="status" aria-live="polite">Noch keine Abfrage durchgeführt.</div>';
  const $=q=>host.querySelector(q);
  const area=$('[data-lm-area]'),subject=$('[data-lm-subject]'),subjectWrap=$('[data-lm-subject-wrap]');
  const view=$('[data-lm-view]'),child=$('[data-lm-child]'),childWrap=$('[data-lm-child-wrap]');
  const result=$('[data-lm-content]'),refresh=$('[data-lm-refresh]');
  let snapshot=null,records=new Map();
  const allEntries=catalog();
  const subjects=[...new Set(allEntries.filter(e=>e.area==='lagoon').map(e=>e.group))];
  subject.innerHTML='<option value="">Alle Fächer</option>'+subjects.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
  const draw=()=>{
   if(!snapshot){result.textContent='Klicke auf «Ergebnisse abfragen», um die Klassenübersicht zu laden.';return;}
   const a=area.value,sg=subject.value,entries=allEntries.filter(x=>x.area===a&&(a!=='lagoon'||!sg||sg===x.group));
   const students=(snapshot.students||[]).map(x=>x.username).filter(Boolean).sort((a,b)=>a.localeCompare(b,'de-CH'));
   const projects=(snapshot.projects||[]).map(p=>({area:'baobab',group:'Erlebnisse',topic:'Erlebnisse',content:'project:'+p.id,
    title:p.title==='Schulreise'?'Herbstwanderung':p.title}));
   const extra=[];
   const known=new Set(entries.concat(projects).map(e=>e.area+'|'+e.content));
   for(const x of records.values()){
    const key=x.area+'|'+x.content;
    if(x.area!==a||known.has(key))continue;
    known.add(key);
    // Keep old progress values from games no longer listed in the current catalog.
    extra.push({area:a,group:'Weitere gespeicherte Spiele',topic:'Ältere Lernspiele',
      content:x.content,title:x.content.replace(/[-_:]/g,' ')});
   }
   const rows=(a==='baobab'?entries.concat(projects):entries).concat(!sg||a!=='lagoon'?extra:[]);
   const chosen=view.value==='one'?(students.includes(child.value)?child.value:students[0]||''):null;
   const groupMap=new Map();
   for(const x of rows){const group=a==='lagoon'?x.group+' · '+x.topic:x.group;
    if(!groupMap.has(group))groupMap.set(group,[]);
    groupMap.get(group).push(x);
   }
   if(!rows.length){result.textContent='Keine Inhalte in diesem Bereich vorhanden.';return;}
   const head=chosen?'<th>Inhalt</th><th>Versuche / Ergebnisse</th>':
    '<th>Inhalt</th>'+students.map(x=>'<th>'+esc(x)+'</th>').join('');
   const tableRows=[...groupMap].map(([group,items])=>
    '<tr class="ls-matrix-group"><th scope="rowgroup" colspan="'+(chosen?2:1+students.length)+'">'+esc(group)+'</th></tr>'+
    items.map(item=>'<tr><th scope="row">'+esc(item.title)+(item.archived?'<small>Archiv</small>':'')+'</th>'+
      (chosen?detail(records.get(chosen+'|'+item.area+'|'+item.content),chosen,item):
       students.map(name=>cell(records.get(name+'|'+item.area+'|'+item.content))).join(''))+'</tr>').join('')
   ).join('');
   result.innerHTML='<div class="ls-matrix-legend"><span class="ls-matrix-green">≥ 80 %</span><span class="ls-matrix-yellow">50–79 %</span><span class="ls-matrix-red">&lt; 50 %</span><span class="ls-matrix-neutral">Keine bewertbare Gesamtauswertung</span></div>'+
    '<p class="ls-matrix-total">'+(chosen?'Tierkonto: '+esc(chosen):students.length+' Tierkonten')+' · '+rows.length+' Inhalte</p>'+
    '<div class="ls-matrix-scroll"><table class="ls-matrix-table"><thead><tr>'+head+'</tr></thead><tbody>'+tableRows+'</tbody></table></div>'+
    (snapshot.limitReached?'<p class="ls-matrix-warning">Achtung: Die historischen Durchläufe wurden bei '+snapshot.limitReached+' Einträgen begrenzt. Frühere Ergebnisse können fehlen.</p>':'')+
    '<div class="ls-matrix-history" data-lm-history hidden aria-live="polite"></div>';
  };
  // Detailed former progress answers are downloaded only for the explicitly
  // selected animal and game – never with the initial class-wide report.
  result.onclick=async event=>{
   const button=event.target.closest('[data-lm-history-user]');
   if(!button||!result.contains(button))return;
   const username=button.dataset.lmHistoryUser,game=button.dataset.lmHistoryGame;
   const panel=result.querySelector('[data-lm-history]');if(!panel)return;
   panel.hidden=false;panel.textContent='Einzelversuche werden geladen …';
   button.disabled=true;
   try{
    const q='?username='+encodeURIComponent(username)+'&game='+encodeURIComponent(game);
    const response=await call('/admin-learning-history'+q,{admin:true});
    if(response?.available!==true||!Array.isArray(response.attempts))throw Error('Der Detaildienst ist im Worker noch nicht verfügbar.');
    panel.innerHTML='<h4>📋 '+esc(username)+' · '+esc(game)+'</h4>'+
      '<p>Die letzten '+response.attempts.length+' gespeicherten Einzelprüfungen und Abschlüsse. Nur für die Lehrperson sichtbar.</p>'+
      (response.attempts.length?response.attempts.map(a=>{
       const pts=Number(a.total)>0?Number(a.correct_count)+' / '+Number(a.total):'–';
       return '<details class="ls-matrix-history-entry"><summary>'+esc(a.task_ref||'Einzelaufgabe')+' · '+esc(pts)+'</summary>'+
        '<p><strong>Antwort:</strong> '+esc(a.answer||'–')+'</p>'+
        '<p><strong>Erwartet:</strong> '+esc(a.expected||'–')+'</p>'+
        (a.details?'<p><strong>Hinweis:</strong> '+esc(a.details)+'</p>':'')+
        '<small>'+esc(a.happened_at||'')+'</small></details>';
      }).join(''):'<p>Keine Einzelversuche für diese Auswahl gespeichert.</p>')+
      '<button type="button" class="pd-secondary" data-lm-history-close>Schliessen</button>';
    panel.querySelector('[data-lm-history-close]').onclick=()=>{panel.hidden=true;panel.textContent=''};
    panel.scrollIntoView({block:'nearest',behavior:'smooth'});
   }catch(err){panel.textContent='Nicht geladen: '+String(err.message||err)}
   finally{button.disabled=false}
  };
  const filter=()=>{subjectWrap.hidden=area.value!=='lagoon';childWrap.hidden=view.value!=='one';draw()};
  area.onchange=filter;subject.onchange=draw;view.onchange=filter;child.onchange=draw;
  refresh.onclick=async()=>{
   refresh.disabled=true;result.textContent='Lernaktivität wird geladen …';
   try{
    const response=await call('/admin-learning-matrix',{admin:true});
    if(response?.available!==true||!Array.isArray(response.students))throw Error('Der Lernaktivitäts-Dienst ist noch nicht im Worker aktiviert.');
    snapshot=response;records=organize(response);
    const old=child.value;child.innerHTML=response.students.map(p=>'<option value="'+esc(p.username)+'">'+esc(p.username)+'</option>').join('');
    if(response.students.some(p=>p.username===old))child.value=old;
    draw();
   }catch(err){snapshot=null;result.innerHTML='<p class="ls-matrix-error">'+esc(err.message||err)+'</p>'}
   finally{refresh.disabled=false;}
  };
  return {refresh:()=>refresh.click()};
 }
 const api={mount,catalog,organize,roundScore,band};
 root.LernSafariLearningMatrix=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);