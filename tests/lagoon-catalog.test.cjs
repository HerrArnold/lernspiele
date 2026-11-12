// Authoritative Lern-Lagune structure supplied by the teacher.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root='lernsafari-test/';
const text=fs.readFileSync(root+'topic-navigation.js','utf8');
const literal=text.match(/const topicData=(\{[\s\S]*?\n  \});/);
assert.ok(literal,'Cannot locate topic definitions');
const actual=vm.runInNewContext('('+literal[1]+')',Object.create(null));
const labels=Object.fromEntries(Object.entries(actual).map(([subject,sections])=>[
 subject,sections.map(s=>[s.name,s.games.map(g=>g[0])])
]));
const expected={
 Mathe:[
  ['Einmaleins',['Mix (2er, 5er, 10er)','3er Reihe','4er Reihe','6er Reihe','9er Reihe','Mix (3er, 4er, 6er, 9er)','Teste dein Wissen (Alle Reihen)']],
  ['Tausenderraum',['Im Tausenderbuch finden','In der Stellentafel eintragen','In Hunderter, Zehner und Einer zerlegen','Zahlenbild legen','Zahlenbild ablesen','Teste dein Wissen']]
 ],
 Deutsch:[
  ['Briefe',['Briefe entdecken']],
  ['Vom Hören zum Sprechen',['Gefühle und direkte Rede']],
  ['Hörverständnis',['Der Dachs','Das Eichhörnchen','Der Igel','Das Reh','Der Rotfuchs']]
 ],
 NMG:[['Rabenvögel',['Rabenvögel erkennen','Lebensraum der Vögel','Arten von Federn','Teste dein Wissen']]],
 Musik:[
  ['Solmisation und Rhythmus',['Solmisationsleiter','Solmisationsspiel einfach','Solmisationsspiel schwer','Rhythmus-Trio','Notenname - Notenbild - Rhythmussprache','Teste dein Wissen']],
  ['Say-Hi: "I bi da für di"',['SayHi: Singen','SayHi: Tanz']]
 ],
 Englisch:[['Unit 2 "My body"',['Vocabulary: Wörter zuordnen','Vocabulary: Karteikarten']]]
};
assert.deepEqual(JSON.parse(JSON.stringify(labels)),expected,'Theme, game name or display order does not match requested catalog');
const math=actual.Mathe;
assert.equal(math[0].games.at(-1)[1],null,'Unbuilt Einmaleins test must remain in preparation');
assert.equal(math[1].games.at(-1)[1],null,'Unbuilt Tausenderraum test must remain in preparation');
const games=Object.values(actual).flatMap(topics=>topics.flatMap(t=>t.games));
const htmlGames=games.filter(g=>g[1]&&g[1].endsWith('.html'));
for(const [title,file] of htmlGames)assert.ok(fs.existsSync(root+'original/spiele/'+file),'Broken game link: '+title+' -> '+file);
for(const [title,file] of games)if(file&&!file.endsWith('.html'))assert.ok(/^english:(match|cards)$/.test(file),'Unexpected internal game identifier: '+title);
const css=fs.readFileSync(root+'integration.css','utf8');
const colors={math:'#dcedff',german:'#f8dddd',nmg:'#dcebd5',music:'#ffffff',english:'#fff0ac'};
for(const [name,color] of Object.entries(colors)){
 const re=new RegExp('\\.safari-topic-page\\.safari-subject-'+name+'\\s*\\{[^}]*--subject-bg:'+color+';');
 assert.ok(re.test(css),'Unexpected subject color: '+name);
}
const badgeFiles=['math-badge.svg','german-flag.svg','nmg-leaf.svg','music-badge.svg','uk-flag.svg'];
const integration=fs.readFileSync(root+'integration.js','utf8');
for(const badge of badgeFiles){
 assert.ok(fs.existsSync(root+'assets/'+badge),'Missing badge '+badge);
 assert.ok(integration.includes('src="assets/'+badge+'"'),'Badge not visible in Fach navigation: '+badge);
}
assert.ok(!/safari-topic-game-icon[^\n]*🎮/.test(text),'No video game controller on task cards');
assert.ok(text.includes("'<span class=\"safari-topic-arrow\">›</span>'"),'Available games need subtle right chevron');
assert.ok(text.includes('🛠️'),'Unavailable games need construction icon');
assert.ok(text.includes('In Vorbereitung'),'Unavailable games must be clearly labelled');
console.log('PASS: all five subjects, 9 themes, game labels, colours, badges, existing links, subtle arrows and preparation notices');
