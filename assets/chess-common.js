'use strict';
(()=>{
const files='abcdefgh';
const unicode={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
const values={p:100,n:320,b:330,r:500,q:900,k:0};
const pst={
 p:[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,27,27,10,5,5,0,0,0,25,25,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-25,-25,10,10,5,0,0,0,0,0,0,0,0],
 n:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
 b:[-20,-10,-10,-10,-10,-10,-10,-20,-10,5,0,0,0,0,5,-10,-10,10,10,10,10,10,10,-10,-10,0,10,10,10,10,0,-10,-10,5,5,10,10,5,5,-10,-10,0,5,10,10,5,0,-10,-10,0,0,0,0,0,0,-10,-20,-10,-10,-10,-10,-10,-10,-20],
 r:[0,0,0,5,5,0,0,0,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,5,10,10,10,10,10,10,5,0,0,0,0,0,0,0,0],
 q:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
 k:[20,30,10,0,0,10,30,20,20,20,0,0,0,0,20,20,-10,-20,-20,-20,-20,-20,-20,-10,-20,-30,-30,-40,-40,-30,-30,-20,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-30,-30,-30,-30,-30,-30,-30,-20,-20,-20,-20,-20,-20,-20,-20]
};
function idx(file,rank){return rank*8+file}
function sqFile(i){return i%8}
function sqRank(i){return Math.floor(i/8)}
function inBounds(f,r){return f>=0&&f<8&&r>=0&&r<8}
function algebraic(i){return files[sqFile(i)]+(8-sqRank(i))}
function parseSquare(s){if(!s||s==='-')return -1;return idx(files.indexOf(s[0]),8-Number(s[1]))}
function colorOf(p){if(!p) return null; return p===p.toUpperCase()?'w':'b'}
function typeOf(p){return p.toLowerCase()}
function other(c){return c==='w'?'b':'w'}
function pieceAt(state,sq){return state.board[sq]||''}
function cloneState(state){return {board:state.board.slice(),turn:state.turn,castle:{...state.castle},ep:state.ep,halfmove:state.halfmove||0,fullmove:state.fullmove||1}}
function startState(){return fromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')}
function fromFEN(fen){const [placement,turn,castle,ep,half,full]=fen.split(/\s+/);const board=[];placement.split('/').forEach(part=>{for(const ch of part){if(/\d/.test(ch)){for(let i=0;i<Number(ch);i++)board.push('');} else board.push(ch);}});return {board,turn:turn||'w',castle:{K:(castle||'').includes('K'),Q:(castle||'').includes('Q'),k:(castle||'').includes('k'),q:(castle||'').includes('q')},ep:parseSquare(ep),halfmove:Number(half||0),fullmove:Number(full||1)};}
function toFEN(state){let out='';for(let r=0;r<8;r++){let empties=0;for(let f=0;f<8;f++){const p=state.board[idx(f,r)];if(!p)empties++;else{if(empties){out+=empties;empties=0}out+=p}}if(empties)out+=empties;if(r<7)out+='/'}const castle=(state.castle.K?'K':'')+(state.castle.Q?'Q':'')+(state.castle.k?'k':'')+(state.castle.q?'q':'')||'-';return `${out} ${state.turn} ${castle} ${state.ep>=0?algebraic(state.ep):'-'} ${state.halfmove||0} ${state.fullmove||1}`}
function attacked(state,sq,by){const b=state.board;const f=sqFile(sq),r=sqRank(sq);const pawnDir=by==='w'?1:-1; /* angreifender Bauer steht hinter dem Ziel */for(const df of [-1,1]){const ff=f+df,rr=r+pawnDir;if(inBounds(ff,rr)){const p=b[idx(ff,rr)];if(p&&colorOf(p)===by&&typeOf(p)==='p')return true;}}
 const knightSteps=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];for(const [df,dr] of knightSteps){const ff=f+df,rr=r+dr;if(inBounds(ff,rr)){const p=b[idx(ff,rr)];if(p&&colorOf(p)===by&&typeOf(p)==='n')return true;}}
 const dirsB=[[1,1],[1,-1],[-1,1],[-1,-1]],dirsR=[[1,0],[-1,0],[0,1],[0,-1]];
 for(const [df,dr] of dirsB){let ff=f+df,rr=r+dr;while(inBounds(ff,rr)){const p=b[idx(ff,rr)];if(p){if(colorOf(p)===by&&['b','q'].includes(typeOf(p)))return true;break;}ff+=df;rr+=dr;}}
 for(const [df,dr] of dirsR){let ff=f+df,rr=r+dr;while(inBounds(ff,rr)){const p=b[idx(ff,rr)];if(p){if(colorOf(p)===by&&['r','q'].includes(typeOf(p)))return true;break;}ff+=df;rr+=dr;}}
 for(let df=-1;df<=1;df++)for(let dr=-1;dr<=1;dr++){if(!df&&!dr)continue;const ff=f+df,rr=r+dr;if(inBounds(ff,rr)){const p=b[idx(ff,rr)];if(p&&colorOf(p)===by&&typeOf(p)==='k')return true;}}
 return false;}
function kingSquare(state,color){return state.board.findIndex(p=>p&&(p=== (color==='w'?'K':'k')))}
function inCheck(state,color){const ks=kingSquare(state,color);return ks<0 || attacked(state,ks,other(color))}
function genPseudo(state){const res=[];const b=state.board;for(let i=0;i<64;i++){const p=b[i];if(!p||colorOf(p)!==state.turn)continue;const col=state.turn, foe=other(col), f=sqFile(i), r=sqRank(i), type=typeOf(p);
  if(type==='p'){const dir=col==='w'?-1:1;const start=col==='w'?6:1;const promo=col==='w'?0:7;const addPromo=(base,isPromo)=>{if(isPromo){for(const pr of ['q','r','b','n'])res.push({...base,promotion:pr});}else res.push(base);};const one=idx(f,r+dir);if(inBounds(f,r+dir)&&!b[one]){addPromo({from:i,to:one,piece:p},sqRank(one)===promo);if(r===start){const two=idx(f,r+2*dir);if(!b[two])res.push({from:i,to:two,piece:p,double:true});}}
   for(const df of [-1,1]){const ff=f+df,rr=r+dir;if(!inBounds(ff,rr))continue;const to=idx(ff,rr);const target=b[to];if(target&&colorOf(target)===foe&&typeOf(target)!=='k')addPromo({from:i,to,piece:p,capture:target},rr===promo);if(state.ep===to)res.push({from:i,to,piece:p,enPassant:true,capture:col==='w'?'p':'P'});}}
  if(type==='n'){for(const [df,dr] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]){const ff=f+df,rr=r+dr;if(!inBounds(ff,rr))continue;const to=idx(ff,rr),t=b[to];if(!t||(colorOf(t)!==col&&typeOf(t)!=='k'))res.push({from:i,to,piece:p,capture:t||null});}}
  if(type==='b'||type==='r'||type==='q'){const dirs=[];if(type!=='r')dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);if(type!=='b')dirs.push([1,0],[-1,0],[0,1],[0,-1]);for(const [df,dr] of dirs){let ff=f+df,rr=r+dr;while(inBounds(ff,rr)){const to=idx(ff,rr),t=b[to];if(!t){res.push({from:i,to,piece:p});} else {if(colorOf(t)!==col&&typeOf(t)!=='k')res.push({from:i,to,piece:p,capture:t});break;}ff+=df;rr+=dr;}}}
  if(type==='k'){for(let df=-1;df<=1;df++)for(let dr=-1;dr<=1;dr++){if(!df&&!dr)continue;const ff=f+df,rr=r+dr;if(!inBounds(ff,rr))continue;const to=idx(ff,rr),t=b[to];if(!t||(colorOf(t)!==col&&typeOf(t)!=='k'))res.push({from:i,to,piece:p,capture:t||null});}
   if(col==='w'&&r===7&&f===4&&!inCheck(state,'w')){
      if(state.castle.K && !b[idx(5,7)] && !b[idx(6,7)] && b[idx(7,7)]==='R' && !attacked(state,idx(5,7),'b') && !attacked(state,idx(6,7),'b'))res.push({from:i,to:idx(6,7),piece:p,castle:'K'});
      if(state.castle.Q && !b[idx(1,7)] && !b[idx(2,7)] && !b[idx(3,7)] && b[idx(0,7)]==='R' && !attacked(state,idx(3,7),'b') && !attacked(state,idx(2,7),'b'))res.push({from:i,to:idx(2,7),piece:p,castle:'Q'});
   }
   if(col==='b'&&r===0&&f===4&&!inCheck(state,'b')){
      if(state.castle.k && !b[idx(5,0)] && !b[idx(6,0)] && b[idx(7,0)]==='r' && !attacked(state,idx(5,0),'w') && !attacked(state,idx(6,0),'w'))res.push({from:i,to:idx(6,0),piece:p,castle:'k'});
      if(state.castle.q && !b[idx(1,0)] && !b[idx(2,0)] && !b[idx(3,0)] && b[idx(0,0)]==='r' && !attacked(state,idx(3,0),'w') && !attacked(state,idx(2,0),'w'))res.push({from:i,to:idx(2,0),piece:p,castle:'q'});
   }}
 }
 return res;
}
function apply(state,move){const s=cloneState(state);const b=s.board;const piece=b[move.from];const captured=move.enPassant ? b[move.to + (colorOf(piece)==='w'?8:-8)] : b[move.to];
 if(!piece||typeOf(captured||'')==='k')throw Error('Ungültiger Schachzug: König kann nicht geschlagen werden.');
 b[move.from]='';if(move.enPassant)b[move.to + (colorOf(piece)==='w'?8:-8)]='';
 if(move.castle){if(move.castle==='K'){b[idx(6,7)]='K';b[idx(5,7)]='R';b[idx(7,7)]='';}
  else if(move.castle==='Q'){b[idx(2,7)]='K';b[idx(3,7)]='R';b[idx(0,7)]='';}
  else if(move.castle==='k'){b[idx(6,0)]='k';b[idx(5,0)]='r';b[idx(7,0)]='';}
  else if(move.castle==='q'){b[idx(2,0)]='k';b[idx(3,0)]='r';b[idx(0,0)]='';}
 } else {
  let place=piece; if(move.promotion)place=(colorOf(piece)==='w'?move.promotion.toUpperCase():move.promotion.toLowerCase()); b[move.to]=place;
 }
 // Update castling rights.
 if(piece==='K'){s.castle.K=false;s.castle.Q=false}
 if(piece==='k'){s.castle.k=false;s.castle.q=false}
 if(move.from===idx(0,7)||move.to===idx(0,7))s.castle.Q=false;
 if(move.from===idx(7,7)||move.to===idx(7,7))s.castle.K=false;
 if(move.from===idx(0,0)||move.to===idx(0,0))s.castle.q=false;
 if(move.from===idx(7,0)||move.to===idx(7,0))s.castle.k=false;
 s.ep=-1;if(typeOf(piece)==='p'&&Math.abs(sqRank(move.to)-sqRank(move.from))===2)s.ep=idx(sqFile(move.from),(sqRank(move.from)+sqRank(move.to))/2);
 s.turn=other(state.turn);s.fullmove=(state.fullmove||1)+(state.turn==='b'?1:0);s.halfmove=(typeOf(piece)==='p'||captured)?0:(state.halfmove||0)+1;
 return s;
}
function legalMoves(state){const res=[];for(const m of genPseudo(state)){const next=apply(state,m);if(!inCheck(next,other(next.turn)))res.push(m);}return res;}
function moveText(move){const pt=typeOf(move.piece);const name={p:'Bauer',n:'Springer',b:'Läufer',r:'Turm',q:'Dame',k:'König'}[pt];
 if(move.castle)return move.castle.toLowerCase()==='q'?'Rochade lang':'Rochade kurz';
 let txt=`${name} ${algebraic(move.from)}→${algebraic(move.to)}`; if(move.enPassant)txt+=' (en passant)'; else if(move.capture)txt+=' schlägt'; if(move.promotion)txt+=' wird '+({q:'Dame',r:'Turm',b:'Läufer',n:'Springer'}[move.promotion]||'Figur'); return txt;
}
function equalMove(a,b){return a&&b&&a.from===b.from&&a.to===b.to&&!!a.promotion===!!b.promotion&&(!a.promotion||a.promotion===b.promotion)&&a.castle===b.castle&&!!a.enPassant===!!b.enPassant}
function orderMoves(moves){return moves.slice().sort((a,b)=>scoreMove(b)-scoreMove(a));}
 function scoreMove(m){let x=0;if(m.capture)x+=10*values[typeOf(m.capture)]-values[typeOf(m.piece)];if(m.promotion)x+=800;if(m.castle)x+=50;if(m.enPassant)x+=30;return x;}
function evaluate(state){let score=0;for(let i=0;i<64;i++){const p=state.board[i];if(!p)continue;const t=typeOf(p), v=values[t], table=p===p.toUpperCase()?pst[t][i]:pst[t][63-i];score += (colorOf(p)==='w'?1:-1)*(v+table);} const turnMoves=legalMoves(state).length; const temp=cloneState(state); temp.turn=other(state.turn); const oppMoves=legalMoves(temp).length; score+=(state.turn==='w'?1:-1)*(turnMoves-oppMoves)*2; return score;}
function gameStatus(state){const moves=legalMoves(state);if(moves.length)return {over:false,inCheck:inCheck(state,state.turn),legal:moves};if(inCheck(state,state.turn))return {over:true,result:'checkmate',winner:other(state.turn),legal:moves,inCheck:true};return {over:true,result:'stalemate',winner:null,legal:moves,inCheck:false};}
function negamax(state,depth,alpha,beta,colorSign){const status=gameStatus(state);if(status.over){if(status.result==='checkmate')return -100000 - depth;return 0;}if(depth===0)return colorSign*evaluate(state);
 let best=-Infinity;const moves=orderMoves(status.legal);for(const m of moves){const val=-negamax(apply(state,m),depth-1,-beta,-alpha,-colorSign);if(val>best)best=val;if(best>alpha)alpha=best;if(alpha>=beta)break;}return best;
}
function bestMoves(state,depth){const status=gameStatus(state);const colorSign=state.turn==='w'?1:-1;const moves=orderMoves(status.legal);return moves.map(m=>({move:m,score:-negamax(apply(state,m),Math.max(0,depth-1),-Infinity,Infinity,-colorSign)})).sort((a,b)=>b.score-a.score)}
function chooseComputerMove(state,level){const depth=level===1?1:level===2?2:3;const ranked=bestMoves(state,depth);if(!ranked.length)return null;if(level===1){const pool=ranked.slice(0,Math.min(3,ranked.length));return pool[Math.floor(Math.random()*pool.length)]}if(level===2){const pool=ranked.filter(x=>x.score>=ranked[0].score-80).slice(0,3);return pool[Math.floor(Math.random()*pool.length)]||ranked[0];}return ranked[0]}
function analyseHumanMove(stateBefore,played,depth=2){const ranked=bestMoves(stateBefore,depth);const best=ranked[0];const found=ranked.find(x=>equalMove(x.move,played))||{move:played,score:-negamax(apply(stateBefore,played),Math.max(0,depth-1),-Infinity,Infinity,-(stateBefore.turn==='w'?1:-1))}; const delta=best?best.score-found.score:0; let label='Gut'; if(best&&equalMove(best.move,played))label='Starker Zug'; else if(delta<30)label='Sehr gut'; else if(delta<90)label='Gut'; else if(delta<220)label='Kleiner Fehler'; else label='Grosser Fehler'; return {best,played:found,delta,label};}
window.ChessSafari={files,unicode,values,idx,sqFile,sqRank,algebraic,parseSquare,colorOf,typeOf,other,startState,fromFEN,toFEN,cloneState,legalMoves,apply,inCheck,attacked,gameStatus,chooseComputerMove,analyseHumanMove,moveText,equalMove,bestMoves};
})();
