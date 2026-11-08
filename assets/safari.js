'use strict';
(()=>{
const $=id=>document.getElementById(id);
const days=window.LEARNSAFARI_DAYS;
const classes=['Allgemein','Deutsch','Englisch','Mathe','Musik','NMG'];
const paths={
 Musik:[
  ['Solmisationsleiter','solmisationsleiter.html','preview-solmisationsleiter.webp','Silben ordnen und Farben finden'],
  ['Solmisationsspiel','solmisationsspiel.html','preview-solmi.webp','Do liegt auf C'],
  ['Solmisationsspiel schwer','solmisationsspiel-profi.html','preview-solmi-profi.webp','Do liegt auf verschiedenen Tönen'],
  ['Rhythmus-Trio','rhythmus-trio.html','preview-rhythm-trio.webp','Drei passende Karten finden'],
  ['Notenname · Notenbild · Rhythmussprache','rhythmus-trio-profi.html','preview-rhythm-profi.webp','Rhythmen schreiben und zeichnen'],
  ['Teste dein Wissen','teste-dein-wissen-musik.html',null,'24 Punkte · 12 Aufgaben']],
 Mathe:[
  ['Finde die Zahl','finde-die-zahl.html','preview-finde-die-zahl.webp','Zahlen im Tausenderbuch suchen'],
  ['Stellentafel','stellentafel.html','preview-stellentafel.webp','Hunderter, Zehner und Einer'],
  ['Hunderter, Zehner und Einer zerlegen','hunderter-zehner-einer-zerlegen.html','preview-hunderter-zehner-einer-zerlegen.webp','Zahlen zerlegen'],
  ['Wie viele Hundertertafeln, Zehnerstangen und Einerwürfel?','wie-viele-brauchst-du.html','preview-wie-viele-brauchst-du.webp','Mit Stellenwertmaterial arbeiten'],
  ['Welche Zahl ist das?','welche-zahl-ist-das.html','preview-welche-zahl-ist-das.webp','Stellenwertmaterial erkennen'],
  ['Teste dein Wissen','teste-dein-wissen.html',null,'Lernkontrolle · 15 Aufgaben']]
};
// Spiele werden künftig durch Verschieben von paths ins Archiv übernommen.
// Archivierte Einträge: {subject,title,file,preview,description,archivedAt:'2026-11-07T12:00:00'}.
const archivedGames=[];
const siteState={route:'aufgaben',previewIndex:null,dayIndex:null,sessions:new Map(),renderedDate:null,adminUnlocked:false};
const htmlEscape=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function norm(v){return String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-CH')}
function daySwiss(now=new Date()){
 const ps=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const f=k=>ps.find(p=>p.type===k).value;
 let iso=`${f('year')}-${f('month')}-${f('day')}`;
 // Der Wechsel um 23:59 ist bewusst eine Minute VOR Mitternacht.
 if(Number(f('hour'))===23&&Number(f('minute'))>=59){const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+1);iso=d.toISOString().slice(0,10)}
 return iso;
}
function dayIndex(iso){
 // Fr 06.11. bleibt am Sa 07.11. und So 08.11. sichtbar.
 // Der nächste Wechsel ist wie gewohnt jeweils um 23:59 Schweizer Zeit.
 const date=new Date(`${iso}T12:00:00Z`), day=date.getUTCDay();
 if(day===6)date.setUTCDate(date.getUTCDate()-1);
 if(day===0)date.setUTCDate(date.getUTCDate()-2);
 const schoolDate=date.toISOString().slice(0,10);
 const matched=days.findIndex(d=>d.date===schoolDate);
 // Vor dem Start die Freitagsserie anzeigen, danach keine Aufgaben wiederholen.
 return matched>=0?matched:(schoolDate<'2026-11-06'?0:null);
}
function prettyDate(iso){return new Intl.DateTimeFormat('de-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Zurich'}).format(new Date(`${iso}T12:00:00Z`))}
function viewShow(view){
 const available=['aufgaben','aktuelle','archiv','lernportale','advent','admin'];
 if(view==='admin'&&!siteState.adminUnlocked){location.hash='#aufgaben';view='aufgaben'}
 siteState.route=view;
 available.forEach(id=>{$('view-'+id).hidden=id!==view});
 document.querySelectorAll('[data-route]').forEach(a=>{const yes=a.dataset.route===view;a.classList.toggle('active',yes);if(a.tagName==='A'){if(yes)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}});
 if(view==='admin')renderAdmin();window.scrollTo(0,0)
}
function route(){
 const value=decodeURIComponent(location.hash.slice(1));let name='aufgaben',section=null;
 if(value.startsWith('aktuelle')){name='aktuelle';section=value.split('--')[1]}
 else if(['archiv','lernportale','advent','admin'].includes(value))name=value;
 viewShow(name);
 if(section){requestAnimationFrame(()=>document.getElementById('fach-'+section)?.scrollIntoView({behavior:'smooth',block:'start'}))}
}
function cardGame(game){const [title,file,preview,desc]=game;return `<a class="game-link ${preview?'':'game-check'}" href="spiele/${encodeURIComponent(file)}">${preview?`<img class="game-preview" src="assets/${preview}" alt="Spielvorschau ${htmlEscape(title)}" loading="lazy">`:`<span class="exam-icon" aria-hidden="true">${/musik/i.test(file)?'♫':'✓'}</span>`}<span class="game-name">${htmlEscape(title)}</span><span class="game-desc">${htmlEscape(desc||'')}</span></a>`}
function emptySubject(){return `<div class="subject-empty"><img src="assets/warzenschwein-schlafend.png" alt="Schlafendes Warzenschwein" loading="lazy"><span>Hier gibt es momentan keine Spiele</span></div>`}
function renderSubjects(){const current=$('subject-list'),archive=$('archive-list');current.innerHTML=classes.map(s=>`<section class="subject-block subject-${s.toLowerCase()}" id="fach-${s.toLowerCase()}"><h3>${s}</h3><div class="game-grid">${paths[s]?.length?paths[s].map(cardGame).join(''):emptySubject()}</div></section>`).join('');archive.innerHTML=classes.map(s=>{const items=archivedGames.filter(a=>a.subject===s).sort((a,b)=>String(b.archivedAt).localeCompare(String(a.archivedAt)));return `<section class="subject-block subject-${s.toLowerCase()}"><h3>${s}</h3><div class="game-grid">${items.length?items.map(x=>cardGame([x.title,x.file,x.preview,x.description])).join(''):'<div class="archive-empty">Noch keine archivierten Spiele.</div>'}</div></section>`}).join('')}
function newSession(dayIdx){const d=days[dayIdx];return d.exercises.map(ex=>{
 if(ex.type==='paint')return {type:ex.type,colors:Array(ex.art.join('').length).fill(null),active:ex.palette[0].value,success:false};
 if(ex.type==='sudoku')return {type:ex.type,cells:ex.givens.join('').split('').map(ch=>ch==='0'?'':ch),success:false};
 if(ex.type==='order')return {type:ex.type,permutation:shuffle(ex.items.map((_,i)=>i)),selected:[],success:false};
 if(ex.type==='choices')return {type:ex.type,answers:Array(ex.questions.length).fill(''),success:false};
 if(ex.type==='match')return {type:ex.type,options:shuffle(ex.pairs.map(p=>p[1])),answers:Array(ex.pairs.length).fill(''),success:false};
 if(ex.type==='categorize')return {type:ex.type,answers:Array(ex.items.length).fill(''),success:false};
 if(ex.type==='fill')return {type:ex.type,answers:Array(ex.fields.length).fill(''),success:false};
 return {success:false};
 })}
function session(dayIdx){if(!siteState.sessions.has(dayIdx))siteState.sessions.set(dayIdx,newSession(dayIdx));return siteState.sessions.get(dayIdx)}
// Authentifizierte Ergebnisse aus der Cloudflare-Datenbank übernehmen.
async function restoreSavedProgress(){
 const api=window.SafariLogin;if(!api?.auth()||api.auth().role!=='child'||siteState.dayIndex===null)return;
 const day=siteState.dayIndex,date=days[day].date;
 try{const saved=await api.dayState(date);if(siteState.dayIndex!==day||!api.auth())return;
   for(const item of saved.progress||[]){const i=Number(item.task_index);if(i>=0&&i<4&&item.completed===1)session(day)[i].success=true}
   for(let i=0;i<4;i++)renderTask(day,i);updateProgress();
 }catch(e){console.warn('Fortschritt nicht geladen:',e.message)}
}
function answerErrors(ex,s){let all=[];
 const add=(field,a,b)=>{if(String(a)!==String(b))all.push({feld:String(field),antwort:String(a??'–'),richtig:String(b??'–')})};
 if(ex.type==='paint'){const symbols=ex.art.join('');symbols.split('').forEach((v,i)=>add('Feld '+(i+1),s.colors[i],ex.mapping[v]))}
 else if(ex.type==='sudoku'){ex.solution.join('').split('').forEach((v,i)=>add('Sudoku '+(i+1),s.cells[i],v))}
 else if(ex.type==='choices')ex.questions.forEach((q,i)=>add(q[0],q[1][Number(s.answers[i])]??'–',q[1][Number(q[2])]))
 else if(ex.type==='match')ex.pairs.forEach((pair,i)=>add(pair[0],s.answers[i],pair[1]))
 else if(ex.type==='categorize')ex.items.forEach((pair,i)=>add(pair[0],s.answers[i],pair[1]))
 else if(ex.type==='fill')ex.fields.forEach((pair,i)=>{if(norm(s.answers[i])!==norm(pair[1]))add(pair[0],s.answers[i],pair[1])})
 else if(ex.type==='order')ex.items.forEach((v,i)=>add('Position '+(i+1),ex.items[s.selected[i]]||'–',v));
 return all.slice(0,25)
}
function saveActivity(ex,s,i,total,wrong){
 const api=window.SafariLogin;if(!api?.auth()||api.auth().role!=='child'||siteState.dayIndex===null)return;
 const date=days[siteState.dayIndex].date;
 api.recordDay({date,taskIndex:i,correct:total-wrong,total,completed:s.success,mistakes:answerErrors(ex,s)}).catch(err=>console.warn('Fortschritt konnte nicht gespeichert werden',err.message));
}

function exerciseMarkup(ex,s,idx){
 switch(ex.type){
 case 'paint':return `<div class="paint-legend">${ex.palette.map(c=>`<button type="button" class="paint-swatch ${s.active===c.value?'selected':''}" data-swatch="${c.value}" aria-pressed="${s.active===c.value}" title="${c.name}"><span style="background:${c.color}"></span>${c.value} · ${c.name}</button>`).join('')}</div><div class="paint-grid" style="--columns:${ex.art[0].length}">${ex.art.join('').split('').map((v,i)=>{const number=ex.mapping[v];const expressions=ex.expressions[number];const label=expressions[(i*3+Math.floor(i/ex.art[0].length))%expressions.length];const selected=ex.palette.find(c=>c.value===s.colors[i]);return `<button type="button" class="paint-cell ${s.colors[i]!==null?'painted':''}" data-pcell="${i}" style="${selected?`--paint:${selected.color}`:''}" aria-label="Feld ${i+1}: ${htmlEscape(label)}">${htmlEscape(label)}</button>`}).join('')}</div><p class="task-tip">Wähle eine Farbe und tippe auf die Rechnungsfelder.</p>`;
 case 'sudoku':return `<div class="sudoku-grid" role="group" aria-label="Sudoku mit vier mal vier Feldern">${ex.givens.join('').split('').map((n,i)=>n!=='0'?`<div class="sudoku-given" aria-label="Vorgegebene Zahl ${n}">${n}</div>`:`<select aria-label="Sudoku Zeile ${Math.floor(i/4)+1}, Spalte ${i%4+1}" data-sudoku="${i}"><option value="">?</option>${[1,2,3,4].map(x=>`<option value="${x}" ${s.cells[i]===String(x)?'selected':''}>${x}</option>`).join('')}</select>`).join('')}</div>`;
 case 'choices':return `${ex.passage?`<div class="reading-box">${htmlEscape(ex.passage)}</div>`:''}<div class="question-list">${ex.questions.map((q,i)=>`<div class="question-row"><span class="question-label">${i+1}. ${htmlEscape(q[0])}</span><div class="choice-options">${q[1].map((a,k)=>`<button type="button" data-choice="${i}" data-answer="${k}" aria-pressed="${s.answers[i]===String(k)}" class="choice-button ${s.answers[i]===String(k)?'picked':''}">${htmlEscape(a)}</button>`).join('')}</div></div>`).join('')}</div>`;
 case 'order':return `<div class="order-bank">${s.permutation.filter(i=>!s.selected.includes(i)).map(i=>`<button type="button" class="word-tile" data-pick="${i}">${htmlEscape(ex.items[i])}</button>`).join('')}</div><div class="order-line"><span class="order-title">Deine Reihenfolge:</span>${s.selected.length?s.selected.map((i,k)=>`<button class="order-picked" type="button" data-unpick="${i}"><b>${k+1}.</b> ${htmlEscape(ex.items[i])} <span aria-hidden="true">×</span></button>`).join(''):'<span class="order-placeholder">Klicke oben auf das erste Feld …</span>'}</div>`;
 case 'match':return `<div class="match-list">${ex.pairs.map(([a],i)=>`<label class="match-row"><span>${htmlEscape(a)}</span><select data-match="${i}" aria-label="Passend zu ${htmlEscape(a)}"><option value="">Bitte wählen</option>${s.options.map(v=>`<option value="${htmlEscape(v)}" ${s.answers[i]===v?'selected':''}>${htmlEscape(v)}</option>`).join('')}</select></label>`).join('')}</div>`;
 case 'categorize':return `<div class="category-grid">${ex.items.map(([word],i)=>`<label class="category-row"><strong>${htmlEscape(word)}</strong><select data-category="${i}" aria-label="Wortart oder Kategorie von ${htmlEscape(word)}"><option value="">Wählen</option>${ex.categories.map(cat=>`<option value="${htmlEscape(cat)}" ${s.answers[i]===cat?'selected':''}>${htmlEscape(cat)}</option>`).join('')}</select></label>`).join('')}</div>`;
 case 'fill':return `<div class="fill-list">${ex.fields.map(([question],i)=>`<label class="fill-row"><span>${htmlEscape(question)}</span><input type="text" autocomplete="off" spellcheck="false" data-fill="${i}" aria-label="Ergänze zu ${htmlEscape(question)}" value="${htmlEscape(s.answers[i])}" placeholder="Deine Antwort"></label>`).join('')}</div>`;
 }
 return '';
}
function renderTask(dayIdx,i){const ex=days[dayIdx].exercises[i],s=session(dayIdx)[i],mount=$(`task-${i}`);mount.innerHTML=exerciseMarkup(ex,s,i);mount.classList.toggle('task-done',s.success);$(`status-${i}`).textContent=s.success?'✓ Geschafft!':'';$(`status-${i}`).className='task-status '+(s.success?'success':'');}
function renderToday(force=false){let iso=daySwiss();let newIdx=dayIndex(iso);if(siteState.previewIndex!==null)newIdx=siteState.previewIndex;
 if(!force&&siteState.dayIndex===newIdx&&siteState.renderedDate===iso)return;
 siteState.dayIndex=newIdx;siteState.renderedDate=iso;
 const isPreview=siteState.previewIndex!==null;
 if(newIdx===null){
  $('today-label').textContent=prettyDate(iso);$('today-theme').textContent='Neue Aufgaben folgen';
  $('today-intro').textContent='Die 20 Reserve-Serien sind aufgebraucht. Neue Aufgaben werden vorbereitet.';
  $('day-pill').textContent='Reserve aufgebraucht';$('preview-notice').hidden=true;
  $('daily-tasks').innerHTML='<div class="daily-task"><h3>Die Aufgabenpause</h3><p>Neue Rätsel erscheinen, sobald sie ergänzt werden.</p></div>';
  $('daily-progress').textContent='Noch keine neuen Aufgaben';$('daily-progress-bar').style.width='0%';return;
 }
 const d=days[newIdx];
 $('today-label').textContent=isPreview?`Vorschau · ${prettyDate(d.date)}`:prettyDate(newIdx===0?'2026-11-06':(days[newIdx].date));
 $('today-theme').textContent=d.theme;
 $('today-intro').textContent=d.intro;
 $('day-pill').textContent=(d.reserve?'Reserve · ': 'Geplant · ')+d.tag;
 $('preview-notice').hidden=!isPreview;
 $('daily-tasks').innerHTML=d.exercises.map((ex,i)=>`<section class="daily-task" id="exercise-${i}"><div class="task-head"><span class="task-count">Aufgabe ${i+1}</span><h3>${htmlEscape(ex.title)}</h3><div class="task-status" id="status-${i}" aria-live="polite"></div></div><p class="task-description">${htmlEscape(ex.desc)}</p><div class="task-body" id="task-${i}"></div><div class="task-actions"><button type="button" class="check-button" data-check="${i}">Überprüfen</button><button type="button" class="clear-button" data-reset="${i}">Neu versuchen</button><span class="check-feedback" id="feedback-${i}" aria-live="polite"></span></div></section>`).join('');
 d.exercises.forEach((_,i)=>renderTask(newIdx,i));updateProgress();restoreSavedProgress();
}
function updateProgress(){if(siteState.dayIndex===null)return;const arr=session(siteState.dayIndex);const n=arr.filter(x=>x.success).length;$('daily-progress').textContent=`${n} von 4 Aufgaben geschafft`;$('daily-progress-bar').style.width=`${n*25}%`}
function reRender(i){renderTask(siteState.dayIndex,i);updateProgress();}
function handleTasks(e){const button=e.target.closest('button');if(!button)return;
 const card=button.closest('.daily-task');if(!card)return;
 const i=Number(card.id.replace('exercise-',''));if(!Number.isInteger(i))return;
 const ex=days[siteState.dayIndex].exercises[i],s=session(siteState.dayIndex)[i];
 if(button.hasAttribute('data-check')){checkTask(ex,s,i);return}
 if(button.hasAttribute('data-reset')){session(siteState.dayIndex)[i]=newSession(siteState.dayIndex)[i];renderTask(siteState.dayIndex,i);$(`feedback-${i}`).textContent='';updateProgress();return}
 if(button.hasAttribute('data-swatch')){s.success=false;s.active=Number(button.dataset.swatch);reRender(i);return}
 if(button.hasAttribute('data-pcell')){s.success=false;s.colors[Number(button.dataset.pcell)]=s.active;reRender(i);return}
 if(button.hasAttribute('data-choice')){s.success=false;s.answers[Number(button.dataset.choice)]=button.dataset.answer;reRender(i);return}
 if(button.hasAttribute('data-pick')){s.success=false;s.selected.push(Number(button.dataset.pick));reRender(i);return}
 if(button.hasAttribute('data-unpick')){s.success=false;s.selected=s.selected.filter(x=>x!==Number(button.dataset.unpick));reRender(i);return}
}
function handleChanges(e){const inp=e.target;const card=inp.closest('.daily-task');if(!card)return;const i=Number(card.id.replace('exercise-',''));const s=session(siteState.dayIndex)[i];s.success=false;updateProgress();
 for(const [name,key] of [['data-sudoku','cells'],['data-match','answers'],['data-category','answers'],['data-fill','answers']]){if(inp.hasAttribute(name)){s[key][Number(inp.getAttribute(name))]=inp.value;return}}
}
function checkTask(ex,s,i){let missing=false,wrong=0,total=0;
 if(ex.type==='paint'){total=s.colors.length;wrong=s.colors.filter((v,j)=>v!==ex.mapping[ex.art.join('')[j]]).length;missing=s.colors.some(x=>x===null)}
 else if(ex.type==='sudoku'){total=16;const answer=ex.solution.join('');wrong=s.cells.filter((v,j)=>v!==answer[j]).length;missing=s.cells.some(v=>!v)}
 else if(ex.type==='choices'){total=ex.questions.length;wrong=s.answers.filter((v,j)=>v!==String(ex.questions[j][2])).length;missing=s.answers.some(v=>v==='')}
 else if(ex.type==='match'){total=ex.pairs.length;wrong=s.answers.filter((v,j)=>v!==ex.pairs[j][1]).length;missing=s.answers.some(v=>!v)}
 else if(ex.type==='categorize'){total=ex.items.length;wrong=s.answers.filter((v,j)=>v!==ex.items[j][1]).length;missing=s.answers.some(v=>!v)}
 else if(ex.type==='fill'){total=ex.fields.length;wrong=s.answers.filter((v,j)=>norm(v)!==norm(ex.fields[j][1])).length;missing=s.answers.some(v=>!norm(v))}
 else if(ex.type==='order'){total=ex.items.length;missing=s.selected.length!==total;wrong=s.selected.filter((v,j)=>v!==j).length+Math.max(0,total-s.selected.length)}
 s.success=!missing&&wrong===0;
 const feedback=$(`feedback-${i}`);feedback.classList.toggle('is-good',s.success);feedback.textContent=s.success?'Richtig! Super gemacht! ✓':missing?'Noch nicht vollständig. Schau alle Felder an.':`Fast geschafft! Prüfe nochmals ${wrong} von ${total} Antworten.`;
 renderTask(siteState.dayIndex,i);updateProgress();saveActivity(ex,s,i,total,wrong);
}
function initNavigation(){window.addEventListener('hashchange',route);document.addEventListener('scroll',()=>{$('main-header').classList.toggle('compact',window.scrollY>65)},{passive:true});$('nav-current').addEventListener('click',()=>{$('dropdown').classList.toggle('open')});document.addEventListener('click',e=>{if(!e.target.closest('.nav-dropdown'))$('dropdown').classList.remove('open')});document.querySelectorAll('[data-subject]').forEach(a=>a.addEventListener('click',()=>{$('dropdown').classList.remove('open');if(location.hash==='#aktuelle--'+a.dataset.subject){route()}}));route()}
function initSecret(){const meerkat=$('meerkat-secret'),popup=$('secret-box'),pass=$('secret-input'),panel=$('week-panel');meerkat.addEventListener('click',()=>{popup.hidden=!popup.hidden;if(!popup.hidden){pass.value='';pass.focus()}});pass.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();if(pass.value.trim()==='6208'){popup.hidden=true;pass.value='';panel.hidden=false;renderWeekPanel()}else{pass.value='';pass.classList.add('invalid');setTimeout(()=>pass.classList.remove('invalid'),550)}});document.addEventListener('click',e=>{if(!e.target.closest('.secret-wrap'))popup.hidden=true});$('close-week').addEventListener('click',()=>panel.hidden=true);$('return-today').addEventListener('click',()=>{siteState.previewIndex=null;renderToday(true)});}
function renderWeekPanel(){
 $('week-list').innerHTML=days.map((d,i)=>`<button type="button" class="week-choice" data-week="${i}"><span>${htmlEscape(prettyDate(d.date).replace(/ 2026$/,''))} · ${d.reserve?'Reserve '+(i-5):'geplant'}</span><b>${htmlEscape(d.theme)}</b></button>`).join('');
}
function initWeek(){ $('week-list').addEventListener('click',e=>{const b=e.target.closest('[data-week]');if(!b)return;siteState.previewIndex=Number(b.dataset.week);$('week-panel').hidden=true;location.hash='#aufgaben';renderToday(true);route()});}

function swissNowDate(){const s=daySwiss();return s}
function recordLocalVisit(){
 try{
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const f=k=>parts.find(x=>x.type===k).value; const iso=`${f('year')}-${f('month')}-${f('day')}`;
  const key='lernsafari-local-visits-v1';const x=JSON.parse(localStorage.getItem(key)||'{}');x[iso]=(x[iso]||0)+1;localStorage.setItem(key,JSON.stringify(x));
 }catch(_){/* storage disabled */}
}
function renderAdmin(){
 const today=daySwiss();const idx=dayIndex(today);
 let used=idx===null?20:Math.max(0,idx-5);
 let remaining=Math.max(0,20-used); const active=(idx!==null&&idx>=6);
 $('admin-reserve').innerHTML=`<div class="reserve-metrics"><div class="metric"><span>Reserve-Serie aktiv?</span><strong>${active?'Ja · Serie '+(idx-5):'Nein'}</strong></div><div class="metric"><span>Noch verfügbare Serien nach der heutigen</span><strong>${remaining} / 20</strong></div></div><p>${idx===null?'Alle Reserve-Serien sind aufgebraucht. Bitte neue Aufgaben erstellen.':active?'Es werden momentan Reserveaufgaben angezeigt.':'Aktuell ist eine geplante Aufgabenserie sichtbar.'}</p>`;
 let visits={};try{visits=JSON.parse(localStorage.getItem('lernsafari-local-visits-v1')||'{}')}catch(_){ }
 const d=new Date(today+'T12:00:00Z');const dow=d.getUTCDay();d.setUTCDate(d.getUTCDate()-(dow===0?6:dow-1));
 let rows='';for(let j=0;j<7;j++){const x=new Date(d);x.setUTCDate(d.getUTCDate()+j);const iso=x.toISOString().slice(0,10);rows+=`<tr><td>${htmlEscape(prettyDate(iso).replace(/ 2026$/,''))}</td><td>${visits[iso]||0}</td></tr>`}
 $('admin-stats').innerHTML=`<table class="admin-table"><thead><tr><th>Tag dieser Woche</th><th>Aufrufe auf diesem Gerät</th></tr></thead><tbody>${rows}</tbody></table>`;
 loadAdminNotes();
 renderClassReport();
}
function swissStamp(iso){
 if(!iso)return '–';const d=new Date(iso);
 return Number.isNaN(d.valueOf())?String(iso):new Intl.DateTimeFormat('de-CH',{timeZone:'Europe/Zurich',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d);
}
function swissIso(iso){
 const d=new Date(iso);
 if(Number.isNaN(d.valueOf()))return '';
 const ps=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zurich',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
 const f=k=>ps.find(x=>x.type===k).value;
 return `${f('year')}-${f('month')}-${f('day')}`;
}
function weekdayLabel(date){
 return new Intl.DateTimeFormat('de-CH',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'Europe/Zurich'}).format(new Date(date+'T12:00:00Z'));
}
function adminGraph(title,records){
 // records: previous best at each distinct Swiss calendar day; no fake daily score samples
 const byDay=new Map();
 [...records].reverse().forEach(e=>{
   const day=swissIso(e.happened_at);if(!day)return;
   byDay.set(day,Math.max(byDay.get(day)||0,Number(e.correct_count)||0));
 });
 const days=[...byDay.keys()].sort();let maximum=0;
 const vals=days.map(day=>{maximum=Math.max(maximum,byDay.get(day));return maximum});
 if(!vals.length)return '';
 const top=Math.max(...vals,1);const left=30,right=315,up=12,bottom=106;
 const pts=vals.map((value,i)=>{
   const x=days.length===1?(left+right)/2:left+(right-left)*i/(days.length-1);
   const y=bottom-(bottom-up)*value/top;
   return {x,y,value,date:days[i]};
 });
 const line=pts.map(pt=>`${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
 const dots=pts.map(pt=>`<circle cx="${pt.x}" cy="${pt.y}" r="4.5" fill="#9C3557"><title>${htmlEscape(pt.date)}: ${pt.value} Punkte</title></circle>`).join('');
 const labels=pts.filter((_,i)=>i===0||i===pts.length-1||(pts.length<=5)).map(pt=>`<text text-anchor="middle" x="${pt.x}" y="127">${htmlEscape(pt.date.slice(5))}</text>`).join('');
 return `<div class="admin-graph"><h5>${htmlEscape(title)} · Bestwert ${maximum}</h5><svg role="img" aria-label="Highscoreverlauf für ${htmlEscape(title)}" viewBox="0 0 340 142" preserveAspectRatio="xMidYMid meet"><line x1="30" y1="12" x2="30" y2="106" stroke="#b8c8b0"/><line x1="30" y1="106" x2="315" y2="106" stroke="#b8c8b0"/><text x="6" y="15">${top}</text><text x="15" y="106">0</text>${pts.length>1?`<polyline points="${line}" fill="none" stroke="#67966A" stroke-width="3" stroke-linejoin="round"/>`:''}${dots}${labels}</svg></div>`;
}
function renderAdminWeek(entries){
 // Monday..Sunday of current Swiss calendar week
 const today=swissIso(new Date().toISOString()), d=new Date(today+'T12:00:00Z');
 const off=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-off);
 const days=Array.from({length:7},(_,i)=>{const x=new Date(d);x.setUTCDate(d.getUTCDate()+i);return x.toISOString().slice(0,10)});
 const byDate=new Map();entries.filter(e=>e.completed).forEach(e=>{
   const day=e.day_date;if(!byDate.has(day))byDate.set(day,new Set());byDate.get(day).add(e.task_index);
 });
 return `<div class="admin-week-table" style="overflow-x:auto"><table><thead><tr>${days.map(d=>`<th>${htmlEscape(weekdayLabel(d))}</th>`).join('')}</tr></thead><tbody><tr>${days.map(d=>`<td>${byDate.get(d)?.size||0} / 4</td>`).join('')}</tr></tbody></table></div>`;
}
function adminMistakes(e){
 let mistakes=[];try{mistakes=JSON.parse(e.mistakes||'[]')}catch(_){}
 if(!mistakes.length)return e.kind==='game'?'<p>Bei diesem Lernspiel werden bisher nur Punkte gespeichert, nicht die einzelnen falschen Antworten.</p>':'<p>Keine falschen Antworten erfasst.</p>';
 return `<ol class="admin-error-list">${mistakes.map(m=>`<li><b>${htmlEscape(m.feld||'Feld')}</b>: Antwort <strong>${htmlEscape(m.antwort??'–')}</strong> · richtig: <strong>${htmlEscape(m.richtig??'–')}</strong></li>`).join('')}</ol>`;
}
async function loadAdminNotes(){
 const api=window.SafariLogin;if(!siteState.adminUnlocked||!api)return;
 $('todo-feedback').textContent='Notizen werden geladen …';
 try{const data=await api.getAdminNotes();$('admin-todos').value=data.content||'';$('todo-feedback').textContent='Auf allen Geräten verfügbar ✓';}
 catch(error){$('todo-feedback').textContent='Nicht geladen: '+error.message}
}
async function renderClassReport(){
 const api=window.SafariLogin,status=$('class-analytics-status'),host=$('class-analytics-contents');
 if(!siteState.adminUnlocked||!api){status.textContent='Öffne den Adminbereich mit dem Flamingo-Code.';host.innerHTML='';return;}
 status.textContent='Lade Klassenergebnisse aus der sicheren Datenbank …';
 try{
  const data=await api.getAdminReport();
  const names=(data.students||[]).map(u=>u.username);
  host.innerHTML=names.map(name=>{
   const entries=(data.events||[]).filter(x=>x.username===name);
   const done=(data.daily||[]).filter(x=>x.username===name);
   const scores=(data.highscores||[]).filter(x=>x.username===name);
   const gameNames=[...new Set([...scores.map(s=>s.game),...entries.filter(e=>e.kind==='game').map(e=>e.ref)])].sort();
   const graphs=gameNames.map(game=>adminGraph(game,entries.filter(e=>e.kind==='game'&&e.ref===game))).join('');
   const logs=entries.slice(0,80).map(e=>`<details class="admin-attempt"><summary>${htmlEscape(swissStamp(e.happened_at))} · ${htmlEscape(e.kind==='daily'?'Tagesaufgabe '+e.ref:'Spiel '+e.ref)} · ${e.correct_count??0}${e.total?'/'+e.total:''} richtig</summary>${adminMistakes(e)}</details>`).join('');
   return `<details class="admin-child-card"><summary><img src="assets/login-tiere/${encodeURIComponent(name)}.webp" alt=""><span>${htmlEscape(name)} · ${done.filter(x=>x.completed).length} Tagesaufgaben geschafft · ${scores.length} Spielhighscores</span></summary><h4>Fortschritt diese Woche</h4>${renderAdminWeek(done)}<h4>Highscores pro Spiel</h4>${scores.length?`<p>${scores.map(x=>`${htmlEscape(x.game)}: <strong>${x.score}</strong>`).join(' · ')}</p>`:'<p>Noch kein Highscore.</p>'}<h4>Highscore-Entwicklung nach Spiel und Tag</h4>${graphs?`<div class="admin-graph-list">${graphs}</div>`:'<p>Noch keine Spielhighscores vorhanden.</p>'}<h4>Antworten und Fehler (neueste zuerst)</h4>${logs||'<p>Noch keine Ergebnisse.</p>'}</details>`;
  }).join('')||'<p>Noch keine Schülerkonten vorhanden.</p>';
  status.textContent=`${names.length} Schülerkonten · alle Uhrzeiten Europe/Zurich (Sommer- und Winterzeit berücksichtigt). Highscore-Diagramme zeigen nur tatsächlich gespeicherte neue Bestwerte.`;
 }catch(e){status.textContent='Klassendaten nicht verfügbar: '+e.message;host.innerHTML='';}
}
function initAdmin(){
 const trigger=$('flamingo-admin'),box=$('admin-secret-box'),pass=$('admin-secret-input');
 trigger.addEventListener('click',()=>{box.hidden=!box.hidden;if(!box.hidden){pass.value='';pass.focus()}});
 pass.addEventListener('keydown',async e=>{
   if(e.key!=='Enter')return;e.preventDefault();
   const value=pass.value;pass.value='';pass.disabled=true;
   try{await window.SafariLogin.adminUnlock(value);siteState.adminUnlocked=true;box.hidden=true;location.hash='#admin';route()}
   catch(err){pass.classList.add('invalid');pass.title=err.message;setTimeout(()=>pass.classList.remove('invalid'),700)}
   finally{pass.disabled=false}
 });
 document.addEventListener('click',e=>{if(!e.target.closest('.logo-group'))box.hidden=true});
 $('save-todos').addEventListener('click',async()=>{
   const msg=$('todo-feedback');msg.textContent='Speichere …';
   try{await window.SafariLogin.saveAdminNotes($('admin-todos').value);msg.textContent='Auf allen Geräten gespeichert ✓'}
   catch(err){msg.textContent='Nicht gespeichert: '+err.message}
 });
 // A user account (even a child's) does not grant access. The separate
 // admin session expires server-side after three hours.
 let token=null;try{token=sessionStorage.getItem('lernsafari-admin-token-v2')}catch(_){}
 const returnToAdmin=location.hash==='#admin';
 if(token){window.SafariLogin.verifyAdmin().then(()=>{siteState.adminUnlocked=true;if(returnToAdmin){location.hash='#admin';route()}}).catch(()=>{try{sessionStorage.removeItem('lernsafari-admin-token-v2')}catch(_){}siteState.adminUnlocked=false})}
}

function init(){window.addEventListener('safari-auth-change',()=>{if(siteState.dayIndex!==null){siteState.sessions.clear();renderToday(true)}if(siteState.route==='admin')renderClassReport()});recordLocalVisit();initAdmin();renderSubjects();initNavigation();initSecret();initWeek();renderToday(true);$('daily-tasks').addEventListener('click',handleTasks);$('daily-tasks').addEventListener('change',handleChanges);$('daily-tasks').addEventListener('input',handleChanges);
 setInterval(()=>{const iso=daySwiss();if(iso!==siteState.renderedDate)renderToday(true)},1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderToday()});}
window.addEventListener('DOMContentLoaded',init);
})();
