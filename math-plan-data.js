/* Mathematik-Arbeitsplan der Klasse 3b, nach der gedruckten Vorlage.
   Unveränderliche Aufgabennummern für dauerhafte Cloudflare-Abhakstände. */
'use strict';
(function(root){
 const sections=[
  {id:'grund',title:'Grundaufgaben',emoji:'📘',tasks:[
   {id:'g01',lz:'LZ 1',text:'Mein Klett',detail:['Wie viele? / Welche Zahl?','Wie viele?']},
   {id:'g02',lz:'LZ 1',text:'ZB S. 30 Nr. 1'},
   {id:'g03',lz:'LZ 1',text:'AH S. 26 Nr. 1 + 2'},
   {id:'g04',lz:'LZ 1',text:'AH S. 26 Nr. 3'},
   {id:'g05',lz:'LZ 1',text:'ZB S. 30 Nr. 2 + 3'},
   {id:'g06',lz:'LZ 1',text:'LS «Tausenderbuch: Zahlen finden»',file:'finde-die-zahl.html'},
   {id:'g07',lz:'LZ 1',text:'LS «Tausenderbuch: Wege gehen»',file:'tausenderbuch-wege-gehen.html'},
   {id:'g08',lz:'LZ 1',text:'LS «Zahlenstrahl: Zahlen eintragen»',file:'zahlenstrahl-zahlen-eintragen.html'},
   {id:'g09',lz:'LZ 2',text:'ZB S. 31 Nr. 5 + 6 + 7 (jeweils A)'},
   {id:'g10',lz:'LZ 2',text:'AH S. 27 Nr. 4 + 5'},
   {id:'g11',lz:'LZ 2',text:'AH S. 27 Nr. 6'},
   {id:'g12',lz:'LZ 2',text:'LS «Nachbarzahl, Nachbarzehner, Nachbarhunderter»',file:'nachbarzahlen-tausenderraum.html'},
   {id:'g13',lz:'LZ 1 & 2',text:'LS «Teste dein Wissen»',file:'tausenderraum-teste-dein-wissen.html'},
   {id:'g14',lz:'LZ 3',text:'1x1 Dossier – Teil 2'}
  ]},
  {id:'erweitert',title:'Erweiterte Aufgaben',emoji:'🌟',tasks:[
   {id:'e01',lz:'LZ 1',text:'AB: Welche Zahl?'},
   {id:'e02',lz:'LZ 1 + 2',text:'AH S. 28 Nr. 7 + 8'},
   {id:'e03',lz:'LZ 2',text:'ZB S. 31 Nr. 5 + 6 + 7 (jeweils B + C)'}
  ]},
  {id:'forscher',title:'Forscherzone',emoji:'🔍',tasks:[
   {id:'f01',lz:'',text:'AB: Sudoku'},
   {id:'f02',lz:'',text:'AB: Passende Paare'},
   {id:'f03',lz:'',text:'LernSafari Oase: Knobelaufgaben',destination:'oasis'}
  ]}
 ];
 const all=sections.flatMap(section=>section.tasks.map(task=>({...task,section:section.id,sectionTitle:section.title})));
 const ids=new Set(all.map(x=>x.id));
 if(ids.size!==all.length)throw Error('Doppelte Matheplan-Aufgabennummern');
 root.LernSafariMathPlan=Object.freeze({version:'matheplan-2026-11',sections,all,ids:[...ids],total:all.length});
})(window);
