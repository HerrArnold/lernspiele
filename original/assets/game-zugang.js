/* Unterrichtsmodus abgeschafft: Keine periodischen Freigabeabfragen und
   keine Sperr-Overlays mehr. Die Login-/Datenschutzfunktionen des Workers
   bleiben davon unberuehrt. */
'use strict';
(function(root){
 const game=decodeURIComponent(root.location.pathname.split('/').pop().replace(/\.html$/i,''));
 const check=()=>Promise.resolve(true);
 root.LernSafariGameAccess={
   check,isAllowed:()=>true,game,gameAllowedFromPlan:()=>true
 };
 root.document.getElementById('safari-game-access-shield')?.remove();
})(window);
