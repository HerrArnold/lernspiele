/* LernSafari Lernfortschritte – server-reported attempts only. No invented scores. */
(function(root){
'use strict';
const text=x=>String(x??'');
const esc=x=>text(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
const nameOf=a=>text(a.username||a.user||a.child||'Unbekannt');
const gameOf=a=>text(a.game||a.game_id||'Unbekannt');
function catalogMap(topics){
 const m=new Map();
 for(const [subject,groups]of Object.entries(topics||{}))
  for(const t of groups||[])for(const g of t.games||[]){
   if(!g.file)continue;
   m.set(g.file.replace(/\.html$/,''),{subject,topic:t.name,title:g.title});
  }
 return m;
}
function scoreOf(a){
 const earned=num(a.correct_count??a.correctCount??a.score??a.points);
 const total=num(a.total??a.max_score??a.maxScore??a.max_points);
 if(earned===null||total===null||total<=0||earned<0||earned>total)return null;
 return {earned,total};
}
function aggregate(attempts,topics,filters={}){
 const index=catalogMap(topics),groups=new Map(),topicGroups=new Map();
 const select=Array.isArray(attempts)?attempts:[];
 for(const attempt of select){
  if(!attempt||typeof attempt!=='object')continue;
  const user=nameOf(attempt),game=gameOf(attempt);
  const info=index.get(game)||{subject:'Weitere Inhalte',topic:'Ohne Zuordnung',title:game};
  if(filters.user&&filters.user!==user)continue;
  if(filters.subject&&filters.subject!==info.subject)continue;
  if(filters.topic&&filters.topic!==info.topic)continue;
  const score=scoreOf(attempt);
  const key=JSON.stringify([user,info.subject,info.topic,game]);
  const row=groups.get(key)||{user,game,...info,tries:0,earned:0,total:0,graded:0,attempts:[]};
  row.tries++;
  if(score){row.earned+=score.earned;row.total+=score.total;row.graded++;}
  row.attempts.push({...attempt,normalizedScore:score});
  groups.set(key,row);
  const tk=JSON.stringify([user,info.subject,info.topic]);
  const tr=topicGroups.get(tk)||{user,subject:info.subject,topic:info.topic,tries:0,graded:0,earned:0,total:0};
  tr.tries++;if(score){tr.graded++;tr.earned+=score.earned;tr.total+=score.total;}
  topicGroups.set(tk,tr);
 }
 const sort=(a,b)=>a.user.localeCompare(b.user,'de')||a.subject.localeCompare(b.subject,'de')||a.topic.localeCompare(b.topic,'de')||a.title?.localeCompare(b.title||'', 'de')||0;
 const result=[...groups.values()].sort(sort);
 for(const x of result)x.attempts.sort((a,b)=>text(b.created_at||b.at||b.timestamp).localeCompare(text(a.created_at||a.at||a.timestamp)));
 return {games:result,topics:[...topicGroups.values()].sort(sort),attempts:result.reduce((s,g)=>s+g.tries,0)};
}
const percent=(a,b)=>b>0?Math.round(a/b*100)+' %':'—';
const displayDate=a=>{const raw=a.created_at||a.at||a.timestamp;if(!raw)return 'Datum unbekannt';const d=new Date(raw);return Number.isNaN(d.getTime())?text(raw):d.toLocaleString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});};
const detailRows=a=>{
 const score=a.normalizedScore;
 const entries=[];
 const add=(label,value)=>{if(value!==null&&value!==undefined&&text(value).trim())entries.push('<dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd>');};
 add('Aufgabe',a.task||a.question||a.prompt);
 add('Meine Antwort',a.answer);
 add('Richtige Antwort',a.expected||a.correct_answer);
 add('Hinweis / Fehler',a.details||a.error_details||a.errors);
 if(!entries.length)return '<p class="admin-detail-missing">Für diesen Versuch wurden vom Lernspiel keine einzelnen Antworten oder Fehler an Cloudflare übermittelt.</p>';
 return '<dl class="admin-detail-facts">'+entries.join('')+'</dl>';
};
function render(host,report,kids,topics,subjects){
 if(!host)return;
 const attempts=Array.isArray(report?.attempts)?report.attempts:[];
 const usernames=[...new Set([...(kids||[]).map(k=>text(k.username)),...attempts.map(nameOf)])].filter(Boolean).sort((a,b)=>a.localeCompare(b,'de'));
 const options=(list,empty)=>'<option value="">'+esc(empty)+'</option>'+list.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');
 host.innerHTML='<h4>📈 Lernfortschritte nach Kind, Fach, Thema und Spiel</h4>'+
 '<p>Hier erscheinen ausschliesslich Ergebnisse, die die Lernspiele wirklich an Cloudflare übermittelt haben. Ein Versuch ist nicht automatisch ein abgeschlossener Lernauftrag.</p>'+
 '<div class="admin-progress-filters">'+
 '<label>Kind / Tierkonto<select id="adminProgressUser">'+options(usernames,'Alle Kinder')+'</select></label>'+
 '<label>Fach<select id="adminProgressSubject">'+options(subjects||Object.keys(topics||{}),'Alle Fächer')+'</select></label>'+
 '<label>Thema<select id="adminProgressTopic"><option value="">Alle Themen</option></select></label>'+
 '</div><div id="adminProgressReport" aria-live="polite"></div>'+
 '<p class="admin-progress-method">Trefferquote = tatsächlich übermittelte richtige Punkte geteilt durch die insgesamt übermittelten möglichen Punkte. Versuche ohne Maximum werden mitgezählt, aber nicht in die Prozentberechnung aufgenommen. Fehlende Fehlerdetails werden ausdrücklich gekennzeichnet.</p>';
 const userEl=host.querySelector('#adminProgressUser'),subjectEl=host.querySelector('#adminProgressSubject'),topicEl=host.querySelector('#adminProgressTopic'),out=host.querySelector('#adminProgressReport');
 function syncTopics(){
  const previous=topicEl.value;
  const list=subjectEl.value?(topics?.[subjectEl.value]||[]).map(t=>t.name):[];
  topicEl.innerHTML=options(list,'Alle Themen');
  if(list.includes(previous))topicEl.value=previous;
 }
 function draw(){
  const view=aggregate(attempts,topics,{user:userEl.value,subject:subjectEl.value,topic:topicEl.value});
  const sumE=view.games.reduce((x,g)=>x+g.earned,0),sumT=view.games.reduce((x,g)=>x+g.total,0);
  out.innerHTML='<div class="admin-progress-summary"><article><strong>'+view.attempts+'</strong><span>Versuche</span></article>'+
    '<article><strong>'+view.games.length+'</strong><span>Spiele / Tierkonten</span></article>'+
    '<article><strong>'+percent(sumE,sumT)+'</strong><span>Richtig (bewertete Punkte)</span></article></div>'+
   (view.topics.length?'<h5>Auswertung nach Thema</h5><div class="admin-progress-topic-list">'+view.topics.map(t=>
    '<article><strong>'+esc(t.user)+' · '+esc(t.subject)+' · '+esc(t.topic)+'</strong><span>'+t.tries+' Versuche</span><span>'+percent(t.earned,t.total)+' richtig</span>'+
    (t.graded<t.tries?'<small>Prozentberechnung aus '+t.graded+' von '+t.tries+' bewertbaren Versuchen</small>':'')+'</article>').join('')+'</div>':'')+
   (view.games.length?'<h5>Spiele und einzelne Versuche</h5><div class="admin-progress-game-list">'+view.games.map(g=>
    '<section class="admin-progress-game"><h6>'+esc(g.user)+' · '+esc(g.title)+'</h6><p>'+esc(g.subject)+' / '+esc(g.topic)+' · '+g.tries+' Versuche · '+percent(g.earned,g.total)+' richtig'+(g.graded<g.tries?' ('+g.graded+' mit Punktmaximum)':'')+'</p>'+
    '<div>'+g.attempts.map((a,i)=>'<details class="admin-detail-attempt"><summary>Versuch '+(g.tries-i)+' · '+esc(displayDate(a))+' · '+(a.normalizedScore?esc(a.normalizedScore.earned)+' / '+esc(a.normalizedScore.total)+' Punkte':'Punktmaximum nicht vorhanden')+'</summary>'+
    detailRows(a)+'</details>').join('')+'</div></section>').join('')+'</div>':
    '<p>Für diese Auswahl sind noch keine gespeicherten Lernversuche vorhanden.</p>');
 }
 subjectEl.onchange=()=>{syncTopics();draw()};userEl.onchange=draw;topicEl.onchange=draw;syncTopics();draw();
}
const api={aggregate,render,scoreOf};
root.LernSafariProgress=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
