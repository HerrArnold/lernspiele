/* LernSafari Hörverständnis · Waldtiere.
   Arbeitsaufgaben aus den von der Lehrperson bereitgestellten Klett-Unterlagen.
   Die Hörtexte selbst werden NICHT als lesbarer Text angezeigt. */
'use strict';
(async()=>{
  const id=window.HOER_ANIMAL;
  const root=document.getElementById('hearing-app');
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const swiss=s=>String(s??'').normalize('NFC').replaceAll('ß','ss');
  const trim=s=>swiss(s).trim().replace(/\s+/g,' ');
  const asNumber=n=>Number.isInteger(n)?n:0;
  let data,submitted=false;
  let result=null;
  function profileKey(){
    try {
      const profile=window.parent.SafariLogin?.auth?.();
      return String(profile?.id||profile?.user_id||profile?.username||profile?.name||'gast').slice(0,80);
    } catch(_){return 'gast'}
  }
  let historyKey='';
  function history(){try{return JSON.parse(localStorage.getItem(historyKey)||'[]')}catch(_){return []}}
  function saveRecord(record){
    try{const records=history();records.push(record);localStorage.setItem(historyKey,JSON.stringify(records))}catch(e){console.warn('Versuchsverlauf konnte nicht gespeichert werden:',e)}
  }
  const current=(selector)=>root.querySelector(selector);
  const all=(selector)=>[...root.querySelectorAll(selector)];
  function section(title,points,body,description){
    return '<section class="hear-task"><div class="hear-task-head"><h2>'+safe(title)+'</h2><span>'+points+' P.</span></div>'+
      (description?'<p class="hear-instruction">'+safe(description)+'</p>':'')+body+'</section>';
  }
  function renderGap(text){
    let n=0;
    return text.split(/\n\s*\n/).map(paragraph=>{
      let rendered=safe(paragraph).replace(/\{\{(.*?)\}\}/g,(_,word)=>{
        const k=n++;
        const size=Math.max(5,Math.min(19,word.length+2));
        return '<input class="hear-gap" data-gap="'+k+'" aria-label="Lücke '+(k+1)+'" size="'+size+'" maxlength="48" spellcheck="false" autocomplete="off" placeholder="…">';
      });
      return '<p class="hear-gap-paragraph">'+rendered.replace(/\n/g,' ')+'</p>';
    }).join('');
  }
  function renderTF(){
    const labels=[['r','richtig'],['f','falsch'],['n','steht nicht im Text']];
    return '<div class="hear-table-head" aria-hidden="true"><span>Aussage</span>'+labels.map(x=>'<span>'+x[1]+'</span>').join('')+'</div>'+
      data.tf.map(([statement],i)=>'<div class="hear-tf-row"><p>'+safe(statement)+'</p>'+
        labels.map(([key,label])=>'<label class="hear-radio"><input type="radio" name="tf-'+i+'" value="'+key+'" aria-label="'+safe(statement)+' – '+label+'"><span>'+label+'</span></label>').join('')+'</div>').join('');
  }
  function renderChoices(){
    return data.pick.map(([options],i)=>'<fieldset class="hear-pick-group"><legend>Gruppe '+(i+1)+'</legend>'+
      options.map((statement,j)=>'<label class="hear-choice"><input type="checkbox" data-pick-group="'+i+'" data-pick-option="'+j+'"><span>'+safe(statement)+'</span></label>').join('')+'</fieldset>').join('');
  }
  function renderCorrect(){
    return data.correct.map(([wrong],i)=>'<div class="hear-correction"><label for="rewrite-'+i+'"><strong>'+String.fromCharCode(97+i)+')</strong> '+safe(wrong)+'</label>'+
      '<textarea rows="2" id="rewrite-'+i+'" data-correction="'+i+'" spellcheck="false" autocomplete="off" placeholder="Schreibe den ganzen Satz richtig auf."></textarea></div>').join('');
  }
  function renderHistory(){
    const records=history();
    const box=current('#hearing-history');
    if(!box)return;
    box.innerHTML=records.length
      ?'<h2>Deine Versuche auf diesem Gerät</h2><ol class="hear-history-list">'+records.map((r,i)=>{
        const date=new Date(r.at);
        const stamp=Number.isFinite(date.valueOf())?date.toLocaleString('de-CH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
        return '<li><strong>Versuch '+(i+1)+'</strong><span>'+safe(stamp)+'</span><b>'+asNumber(r.score)+' / '+data.total+' Punkte</b></li>';
      }).join('')+'</ol>'
      :'<h2>Deine Versuche</h2><p>Noch kein abgeschlossener Versuch.</p>';
  }
  function render(){
    const baseTotal=data.tf.length+data.pick.length;
    root.innerHTML='<div class="hear-intro"><div><p class="hear-kicker">DEUTSCH · HÖRVERSTÄNDNIS</p><h1>'+safe(data.title)+'</h1><p>Höre genau zu und löse die zwei Pflichtaufgaben. Danach kannst du freiwillig weitere Sätze verbessern. Du darfst die Aufnahme jederzeit anhalten, zurückspulen und nochmals abspielen.</p></div><span class="hear-total">'+baseTotal+' Punkte</span></div>'+
      '<div class="hear-player" role="region" aria-label="Hörtext abspielen"><span class="hear-audio-label">🎧 Hörtext</span><audio id="hearing-audio" controls preload="metadata" controlsList="nodownload" src="'+safe(data.audio)+'"></audio>'+
      '<button type="button" id="hear-rewind">↶ 10 s</button><button type="button" id="hear-replay">↻ Anfang</button></div>'+
      '<p class="hear-audio-error" id="hear-audio-error" hidden>Die Aufnahme konnte nicht geladen werden. <a href="'+safe(data.source)+'" target="_blank" rel="noopener noreferrer">Originalaufnahme aufrufen</a>.</p>'+
      section('1. Richtig, falsch oder nicht im Text?',data.tf.length,renderTF(),'Wähle für jeden Satz genau eine Antwort aus.')+
      section('2. Welche Sätze sind richtig?',data.pick.length,renderChoices(),'Kreuze in jeder Gruppe den einen inhaltlich richtigen Satz an.')+
      '<section class="hear-task hear-extra"><div class="hear-task-head"><h2>⭐ Zusatzaufgabe – freiwillig</h2><span>0 Pflichtpunkte</span></div><p class="hear-instruction"><strong>Nicht erwartet:</strong> Lies die Sätze genau und schreibe die Sätze ohne Fehler. Achte auf die Rechtschreibung. Diese freiwillige Aufgabe zählt nicht zum Ergebnis.</p>'+renderCorrect()+'</section>' +
      '<div class="hear-actions"><button type="button" id="hearing-submit" class="hear-submit">Fertig – Punkte auswerten</button>'+
      '<button type="button" id="hearing-reset" class="hear-secondary">Neu versuchen</button></div>'+
      '<div id="hearing-result" class="hear-result" role="status" aria-live="polite" hidden></div>'+
      '<section class="hear-history" id="hearing-history"></section>'+
      '<footer class="hear-credits">Quelle: Beate Kurt / Ernst Klett Verlag, Grundschul-Blog. <a href="'+safe(data.source)+'" target="_blank" rel="noopener noreferrer">Originalmaterial</a>. Die Hörgeschichte wird nicht als Lesetext eingeblendet.</footer>';
    const audio=current('#hearing-audio');
    current('#hear-rewind').addEventListener('click',()=>{audio.currentTime=Math.max(0,audio.currentTime-10)});
    current('#hear-replay').addEventListener('click',()=>{audio.currentTime=0;audio.play().catch(()=>{})});
    audio.addEventListener('error',()=>{current('#hear-audio-error').hidden=false});
    current('#hearing-submit').addEventListener('click',submit);
    current('#hearing-reset').addEventListener('click',reset);
    renderHistory();void loadExperts();
  }
  // Correct spelling and upper/lower case must match the printed source.
  // German ß/Swiss ss are accepted as the same grapheme.
  function gradeSentence(actual,corrected,keywords){
    const a=trim(actual),want=trim(corrected);
    const sufficientlyComplete=a.split(/\s+/).length>=Math.max(3,Math.round(want.split(/\s+/).length*0.70));
    const keywordMatch=sufficientlyComplete&&keywords.every(k=>a.toLocaleLowerCase('de-CH').includes(swiss(k).toLocaleLowerCase('de-CH')));
    const punctuation=sufficientlyComplete&&a.endsWith(want.slice(-1))&&/[.!?]$/.test(a);
    const spelling=a.replace(/[.!?]$/,'')===want.replace(/[.!?]$/,'');
    // Each of the three original criteria is one point.
    return Number(keywordMatch)+Number(punctuation)+Number(spelling);
  }
  function collect(){
    const details={tf:0,pick:0};
    for(let i=0;i<data.tf.length;i++){
      const choice=current('[name="tf-'+i+'"]:checked');
      const ok=choice?.value===data.tf[i][1];
      details.tf+=Number(ok);
      all('[name="tf-'+i+'"]').forEach(el=>el.closest('label').classList.toggle('hear-valid',ok&&el.checked));
    }
    for(let i=0;i<data.pick.length;i++){
      const inputs=all('[data-pick-group="'+i+'"]');
      const marks=inputs.filter(el=>el.checked).map(el=>Number(el.dataset.pickOption));
      const ok=marks.length===1&&marks[0]===data.pick[i][1];
      details.pick+=Number(ok);
      inputs.forEach(el=>el.closest('label').classList.toggle('hear-valid',ok&&el.checked));
    }
    return {details,score:details.tf+details.pick};
  }
  async function loadExperts(){
    try{
      const profile=window.parent.SafariLogin?.auth?.();
      if(profile?.role!=='child')return;
      const token=window.parent.localStorage.getItem('lernsafari-token-v1')||'';
      if(!token)return;
      const base=String(window.parent.LERNSAFARI_BACKEND_URL||'https://lernsafari-api.ergohd02.workers.dev').replace(/[/]+$/,'');
      const response=await fetch(base+'/learning-helpers?target='+encodeURIComponent('game:hoerverstehen-'+id),{headers:{Authorization:'Bearer '+token}});
      if(!response.ok)return;
      const json=await response.json();
      const names=(json.helpers||[]).filter(n=>typeof n==='string'&&n).slice(0,3);
      if(!names.length)return;
      const box=document.createElement('aside');box.className='hear-history hear-experts';
      box.innerHTML='<h2>🌟 Expertinnen und Experten</h2><p>Diese Kinder haben besonders gute Ergebnisse erzielt und können dir helfen.</p><p>'+names.map(n=>'<strong class="hear-expert-name">'+safe(n)+'</strong>').join(' ')+'</p>';
      current('#hearing-history')?.insertAdjacentElement('beforebegin',box);
    }catch(_){}
  }
  function submit(){
    if(submitted)return;
    const scored=collect();
    const record={at:new Date().toISOString(),score:scored.score,detail:scored.details};
    saveRecord(record);submitted=true;result=scored;
    const box=current('#hearing-result');
    box.hidden=false;
    box.innerHTML='<h2>🌟 Dein Ergebnis: '+scored.score+' / '+data.total+' Punkte ('+Math.round(scored.score/data.total*100)+' %)</h2>'+
      '<div class="hear-score-grid"><span>Richtig / falsch <b>'+scored.details.tf+' / '+data.tf.length+'</b></span>'+
      '<span>Sätze ankreuzen <b>'+scored.details.pick+' / '+data.pick.length+'</b></span></div>'+
      '<p>Die freiwillige Zusatzaufgabe zählt nicht zu den Punkten. Die Pflichtergebnisse sind automatisch korrigiert.</p>';
    current('#hearing-submit').disabled=true;
    renderHistory();box.scrollIntoView({behavior:'smooth',block:'center'});
    // Send only score counts to the already-configured class backend, if a
    // permitted child session exists. Local attempt history is device based.
    try {
      const api=window.parent.SafariLogin;
      if(api?.auth?.()?.role==='child'){
        api.request('/game-attempt','POST',{
          game:'hoerverstehen-'+id,task:data.title,correct:scored.score===data.total,
          correctCount:scored.score,total:data.total,
          answer:'Punkte',expected:String(data.total),details:'Hörverständnis '+data.title
        }).catch(()=>{});
      }
    } catch(_){}
  }
  function reset(){
    submitted=false;result=null;render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  try{
    if(!/^(dachs|eichhoernchen|igel|reh|rotfuchs)$/.test(id))throw Error('Unbekanntes Tier');
    const response=await fetch('../hoerverstehen-data/'+id+'.json',{cache:'no-cache'});
    if(!response.ok)throw Error('Daten konnten nicht geladen werden');
    data=await response.json();
    const total=data.tf.length+data.pick.length;
    data.total=total;
    historyKey='lernsafari-hoerverstehen-v2-'+profileKey()+'-'+id;
    render();
  }catch(e){root.innerHTML='<div class="hear-error">Dieses Hörverständnis konnte nicht gestartet werden. Bitte versuche es erneut.<p>'+safe(e.message)+'</p></div>'}
})();