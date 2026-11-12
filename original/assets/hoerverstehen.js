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
    const gapCount=(data.gap.match(/\{\{/g)||[]).length;
    root.innerHTML='<div class="hear-intro"><div><p class="hear-kicker">DEUTSCH · HÖRVERSTÄNDNIS</p><h1>'+safe(data.title)+'</h1><p>Höre genau zu und löse die vier Aufgaben. Du darfst die Aufnahme jederzeit anhalten, zurückspulen und nochmals abspielen.</p></div><span class="hear-total">'+data.total+' Punkte</span></div>'+
      '<div class="hear-player" role="region" aria-label="Hörtext abspielen"><span class="hear-audio-label">🎧 Hörtext</span><audio id="hearing-audio" controls preload="metadata" controlsList="nodownload" src="'+safe(data.audio)+'"></audio>'+
      '<button type="button" id="hear-rewind">↶ 10 s</button><button type="button" id="hear-replay">↻ Anfang</button></div>'+
      '<p class="hear-audio-error" id="hear-audio-error" hidden>Die Aufnahme konnte nicht geladen werden. <a href="'+safe(data.source)+'" target="_blank" rel="noopener noreferrer">Originalaufnahme aufrufen</a>.</p>'+
      section('1. Ergänze den Lückentext',gapCount,renderGap(data.gap),'Schreibe die fehlenden Wörter genau richtig in die Lücken. Achte auf Gross- und Kleinschreibung.')+
      section('2. Richtig, falsch oder nicht im Text?',data.tf.length,renderTF(),'Wähle für jeden Satz genau eine Antwort aus.')+
      section('3. Welche Sätze sind richtig?',data.pick.length,renderChoices(),'Kreuze die richtigen Sätze an. Pro Gruppe kann eine Antwort richtig sein.')+
      section('4. Finde die Fehler und verbessere die Sätze',data.correct.length*3,renderCorrect(),'Schreibe den ganzen richtigen Satz auf. Pro Satz gibt es 3 Punkte: Inhalt, Satzzeichen und Rechtschreibung.')+
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
    renderHistory();
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
    const gapSolutions=[...data.gap.matchAll(/\{\{(.*?)\}\}/g)].map(x=>x[1]);
    const details={gap:0,tf:0,pick:0,correct:0};
    for(let i=0;i<gapSolutions.length;i++){
      const el=current('[data-gap="'+i+'"]');
      const ok=[gapSolutions[i],...(data.gapAlternatives?.[i]||[])].some(word=>trim(el.value)===trim(word));
      details.gap+=Number(ok);
      el.classList.toggle('hear-invalid',!ok);
      el.classList.toggle('hear-valid',ok);
    }
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
    for(let i=0;i<data.correct.length;i++){
      const el=current('[data-correction="'+i+'"]');
      const [wrong,target,keys]=data.correct[i];
      const pts=gradeSentence(el.value,target,keys);
      details.correct+=pts;
      el.classList.toggle('hear-valid',pts===3);
      el.classList.toggle('hear-invalid',pts!==3);
    }
    return {details,score:Object.values(details).reduce((a,b)=>a+b,0)};
  }
  function submit(){
    if(submitted)return;
    const scored=collect();
    const record={at:new Date().toISOString(),score:scored.score,detail:scored.details};
    saveRecord(record);submitted=true;result=scored;
    const box=current('#hearing-result');
    box.hidden=false;
    box.innerHTML='<h2>🌟 Dein Ergebnis: '+scored.score+' / '+data.total+' Punkte</h2>'+
      '<div class="hear-score-grid"><span>Lückentext <b>'+scored.details.gap+'</b></span><span>Richtig / falsch <b>'+scored.details.tf+'</b></span>'+
      '<span>Sätze ankreuzen <b>'+scored.details.pick+'</b></span><span>Sätze verbessern <b>'+scored.details.correct+'</b></span></div>'+
      '<p>Dein Versuch ist gespeichert. Beim nächsten Versuch kannst du deine Punkte mit den früheren Ergebnissen vergleichen.</p>'+
      '<p class="hear-score-note">Hinweis: Die Rechtschreibung wird streng geprüft. Anders formulierte, aber inhaltlich richtige Sätze muss eine Lehrperson gegebenenfalls nachprüfen.</p>';
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
    const total=(data.gap.match(/\{\{/g)||[]).length+data.tf.length+data.pick.length+3*data.correct.length;
    if(total!==data.total)throw Error('Punkteverteilung stimmt nicht: '+total+'/'+data.total);
    historyKey='lernsafari-hoerverstehen-v1-'+profileKey()+'-'+id;
    render();
  }catch(e){root.innerHTML='<div class="hear-error">Dieses Hörverständnis konnte nicht gestartet werden. Bitte versuche es erneut.<p>'+safe(e.message)+'</p></div>'}
})();