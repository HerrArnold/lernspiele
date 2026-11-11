/* Navigation bridge; does not change any exercise/answer or daily-task logic. */
(()=>{
 // Lernspiele bleiben direkt spielbar; keine vorgeschaltete Freigabepruefung.
 if(window.parent===window)return;
 document.body.classList.add('legacy-embedded');
 document.addEventListener('click',e=>{
   const a=e.target.closest('a[href]');if(!a)return;
   const href=a.getAttribute('href')||'';
   if(href.startsWith('spiele/')){
     e.preventDefault();window.parent.postMessage({source:'LernSafariOriginal',action:'openGame',file:href.slice(7)},location.origin==='null'?'*':location.origin);
   }else if(a.closest('.safari-exit-bar')||href.startsWith('../index.html')){
     e.preventDefault();window.parent.postMessage({source:'LernSafariOriginal',action:'backToSubject'},location.origin==='null'?'*':location.origin);
   }
 },true);
})();
