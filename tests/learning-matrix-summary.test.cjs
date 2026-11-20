const test=require('node:test');
const assert=require('node:assert/strict');
const matrix=require('../learning-matrix.js');

test('Compact historical summary preserves first and best completed run without losing prior highscore',()=>{
 const stats=matrix.organize({
  visits:[{username:'Zebra',area:'lagoon',content:'einmaleins-siebener',opens:4}],
  answerCounts:[{username:'Zebra',game:'einmaleins-siebener',answers:20}],
  highscores:[{username:'Zebra',game:'einmaleins-siebener',score:14}],
  runSummaries:[{username:'Zebra',game:'einmaleins-siebener',tries:3,first_percent:60,best_percent:90}]
 });
 const x=stats.get('Zebra|lagoon|einmaleins-siebener');
 assert.equal(x.runsCount,3);
 assert.equal(x.first,60);
 assert.equal(x.best,90);
 assert.equal(x.highscore,14);
 assert.equal(x.opens,4);
 assert.equal(x.answers,20);
});

test('Ungraded viewed content gets visits but no invented percentage',()=>{
 const stats=matrix.organize({visits:[{username:'Elefant',area:'oasis',content:'pokemon-pocket:lexikon',opens:2}]});
 const x=stats.get('Elefant|oasis|pokemon-pocket:lexikon');
 assert.equal(x.opens,2);
 assert.equal(x.first,null);
 assert.equal(x.best,null);
 assert.equal(matrix.band(x.best),'ls-matrix-neutral');
});

test('Old completed rounds remain supported during Worker migration',()=>{
 const stats=matrix.organize({completions:[
  {id:2,username:'Löwe',game:'hoerverstehen-kurz-affe',correct_count:7,total:10,happened_at:'2026-11-19T09:00:00Z'},
  {id:1,username:'Löwe',game:'hoerverstehen-kurz-affe',correct_count:4,total:10,happened_at:'2026-11-19T08:00:00Z'}
 ]});
 const x=stats.get('Löwe|lagoon|hoerverstehen-kurz-affe');
 assert.equal(x.runs.length,2);
 assert.equal(x.first,40);
 assert.equal(x.best,70);
});

test('Historical animal quiz scores map to the Baobab animal row',()=>{
 const stats=matrix.organize({runSummaries:[{username:'Giraffe',game:'tierwelt-elefant',tries:2,first_percent:75,best_percent:100}]});
 const x=stats.get('Giraffe|baobab|animal:elefant');
 assert.equal(x.runsCount,2);
 assert.equal(x.first,75);
 assert.equal(x.best,100);
});

test('Scoring colors reflect best percentage without pretending missing results are red',()=>{
 assert.equal(matrix.band(0),'ls-matrix-red');
 assert.equal(matrix.band(49),'ls-matrix-red');
 assert.equal(matrix.band(50),'ls-matrix-yellow');
 assert.equal(matrix.band(79),'ls-matrix-yellow');
 assert.equal(matrix.band(80),'ls-matrix-green');
 assert.equal(matrix.band(null),'ls-matrix-neutral');
});