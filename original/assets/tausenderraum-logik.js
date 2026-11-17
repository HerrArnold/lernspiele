/* LernSafari Tausenderraum: mathematisch pruefbare Spielregeln.
 * Jede Tausenderbuch-Seite ist ein 10x10-Feld:
 * Seite 1 = 1..100; Seite 10 = 901..1000.
 * Normaler Pfeil = ein Nachbarfeld auf derselben Seite.
 * Volles Dreieck = eine Seite weiter/zurueck, Position unveraendert.
 */
'use strict';
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.LernSafariTausenderraumLogik=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const arrows={
  '→':{dx:1,dy:0},'←':{dx:-1,dy:0},
  '↑':{dx:0,dy:-1},'↓':{dx:0,dy:1},
  '↗':{dx:1,dy:-1},'↖':{dx:-1,dy:-1},
  '↘':{dx:1,dy:1},'↙':{dx:-1,dy:1},
  '▶':{dp:1},'◀':{dp:-1}
 };
 const pick=(a,rng)=>a[Math.floor(rng()*a.length)];
 const coords=n=>({page:Math.floor((n-1)/100),row:Math.floor(((n-1)%100)/10),col:(n-1)%10});
 const numberAt=(page,row,col)=>page*100+row*10+col+1;
 function move(n,symbol){
  if(!Number.isInteger(n)||n<1||n>1000||!arrows[symbol])return null;
  const old=coords(n),a=arrows[symbol];
  const page=old.page+(a.dp||0),row=old.row+(a.dy||0),col=old.col+(a.dx||0);
  if(page<0||page>9||row<0||row>9||col<0||col>9)return null;
  return numberAt(page,row,col);
 }
 function walk(start,symbols){
  let current=start;
  for(const symbol of symbols){
   current=move(current,symbol);
   if(current===null)return null;
  }
  return current;
 }
 function newWalk(rng=Math.random){
  for(let attempt=0;attempt<1000;attempt++){
   let start=1+Math.floor(rng()*1000),n=start,path=[];
   // A page-jump appears on about half of the four-step exercises.
   // Other routes consist only of ordinary one-cell arrows.
   const specialAt=rng()<0.5?Math.floor(rng()*4):-1;
   for(let i=0;i<4;i++){
    let valid=Object.keys(arrows).filter(symbol=>move(n,symbol)!==null);
    valid=valid.filter(symbol=>i===specialAt?(symbol==='▶'||symbol==='◀'):(symbol!=='▶'&&symbol!=='◀'));
    if(!valid.length)break;
    const step=pick(valid,rng);
    if(!step)break;
    path.push(step);n=move(n,step);
   }
   if(path.length===4&&n!==start)return {type:'walk',start,path,answer:n};
  }
  throw Error('Kein gueltiger Tausenderbuch-Weg erzeugt.');
 }
 function newFind(rng=Math.random){
  return {type:'find',answer:1+Math.floor(rng()*1000)};
 }
 function newLine(rng=Math.random){
  return {type:'line',answer:1+Math.floor(rng()*1000)};
 }
 function neighbors(n){
  if(!Number.isInteger(n)||n<=100||n>=900||n%10===0||n%100===0)throw Error('Zahl braucht Nachbarn auf beiden Seiten.');
  const ten=Math.floor(n/10)*10,hundred=Math.floor(n/100)*100;
  return {hundredLeft:hundred,hundredRight:hundred+100,
    tenLeft:ten,tenRight:ten+10,oneLeft:n-1,oneRight:n+1};
 }
 function newNeighbors(rng=Math.random){
  let n;do{n=101+Math.floor(rng()*798)}while(n%10===0);
  return {type:'neighbors',start:n,answers:neighbors(n)};
 }
 function randomTask(type,rng=Math.random){
  if(type==='walk')return newWalk(rng);
  if(type==='line')return newLine(rng);
  if(type==='neighbors')return newNeighbors(rng);
  if(type==='find')return newFind(rng);
  throw Error('Unbekannter Aufgabentyp: '+type);
 }
 return {arrows,coords,numberAt,move,walk,newWalk,newFind,newLine,neighbors,newNeighbors,randomTask};
});
