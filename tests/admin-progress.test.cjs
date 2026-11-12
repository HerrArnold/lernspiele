const test=require('node:test');
const assert=require('node:assert/strict');
const {aggregate,scoreOf}=require('../admin-progress.js');
const topics={Mathe:[{name:'Einmaleins',games:[{title:'3er Reihe',file:'einmaleins-dreier.html'},{title:'6er Reihe',file:'einmaleins-sechser.html'}]}],Deutsch:[{name:'Hörverständnis',games:[{title:'Der Dachs',file:'hoerverstehen-dachs.html'}]}]};
const attempts=[
 {username:'Loewe',game:'einmaleins-dreier',correct_count:7,total:10,answer:'17',expected:'18',details:'6×3',created_at:'2026-11-12T10:00:00Z'},
 {username:'Loewe',game:'einmaleins-dreier',correctCount:9,total:10,answer:'18',expected:'18',created_at:'2026-11-12T11:00:00Z'},
 {username:'Loewe',game:'einmaleins-sechser',score:2,created_at:'2026-11-12T11:02:00Z'},
 {username:'Zebra',game:'hoerverstehen-dachs',score:44,total:55,details:'Schreibfehler',created_at:'2026-11-12T09:00:00Z'},
 {username:'Loewe',game:'noch-nicht-bekannt',correct_count:1,total:2}
];
test('aggregates real game and topic attempts without guessing unknown maxima',()=>{
 const result=aggregate(attempts,topics,{user:'Loewe',subject:'Mathe'});
 assert.equal(result.attempts,3);
 assert.equal(result.games.length,2);
 const game=result.games.find(x=>x.game==='einmaleins-dreier');
 assert.equal(game.tries,2);assert.equal(game.earned,16);assert.equal(game.total,20);
 assert.equal(game.graded,2);assert.equal(game.attempts[0].answer,'18');
 const t=result.topics[0];assert.equal(t.tries,3);assert.equal(t.earned,16);assert.equal(t.total,20);
 assert.equal(t.graded,2);
});
test('filters by learner, subject and topic',()=>{
 const r=aggregate(attempts,topics,{subject:'Deutsch',topic:'Hörverständnis'});
 assert.equal(r.games.length,1);assert.equal(r.games[0].title,'Der Dachs');
 assert.equal(r.games[0].user,'Zebra');assert.equal(r.games[0].total,55);
});
test('never fabricates percentages for ungraded attempts',()=>{
 assert.equal(scoreOf({score:3}),null);
 assert.equal(scoreOf({score:9,total:5}),null);
 assert.equal(scoreOf({correct_count:4,total:0}),null);
 assert.deepEqual(scoreOf({correctCount:3,total:4}),{earned:3,total:4});
});
test('lists unclassified game attempts transparently',()=>{
 const r=aggregate(attempts,topics,{user:'Loewe',subject:'Weitere Inhalte'});
 assert.equal(r.games.length,1);assert.equal(r.games[0].topic,'Ohne Zuordnung');
});
