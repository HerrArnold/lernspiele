#!/usr/bin/env python3
"""Prepare a class-neutral offline package from GitHub's complete LernSafari checkout."""
import json,re,shutil,html,sys
from pathlib import Path
src=Path.cwd(); out=src/'_lernsafari_offline'
if out.exists():shutil.rmtree(out)
out.mkdir()
for item in src.iterdir():
 if item.name in {'.git','.github','_lernsafari_offline','scripts'}:continue
 if item.is_dir():shutil.copytree(item,out/item.name,ignore=shutil.ignore_patterns('__pycache__','*.pyc','.DS_Store'))
 elif item.is_file():shutil.copy2(item,out/item.name)
# Existing site source is retained for completeness, but offline default is neutral and login-free.
if (out/'index.html').exists(): (out/'index.html').rename(out/'online-start-nur-mit-server.html')
# Build inlined data so file:// can load exercises without fetch restrictions.
hearing_dir=out/'original'/'hoerverstehen-data';assets=out/'original'/'assets';game_dir=out/'original'/'spiele'
short={};woods={}
for path in hearing_dir.glob('kurz-*.json'):short[path.stem.replace('kurz-','')]=json.loads(path.read_text(encoding='utf-8'))
for name in ['dachs','eichhoernchen','igel','reh','rotfuchs']:
 path=hearing_dir/(name+'.json')
 if path.exists():woods[name]=json.loads(path.read_text(encoding='utf-8'))
(assets/'offline-hoerverstehen-data.js').write_text('window.OFFLINE_HEARING_DATA='+json.dumps(short,ensure_ascii=False,separators=(',',':'))+';\nwindow.OFFLINE_WOODLAND_DATA='+json.dumps(woods,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
# Use inlined worksheet data for offline mode, same questions and exact answers.
for page in list(game_dir.glob('hoerverstehen-kurz-*.html'))+list(game_dir.glob('hoerverstehen-*.html')):
 s=page.read_text(encoding='utf-8');needle='<script src="../assets/hoerverstehen-'
 if needle in s:s=s.replace(needle,'<script src="../assets/offline-hoerverstehen-data.js"></script>'+needle)
 page.write_text(s,encoding='utf-8')
js=assets/'hoerverstehen-kurz.js'
if js.exists():
 s=js.read_text(encoding='utf8');needle="const r=await fetch('../hoerverstehen-data/kurz-'+id+'.json',{cache:'no-store'});if(!r.ok)throw Error('Daten konnten nicht geladen werden');data=await r.json();"
 repl="data=window.OFFLINE_HEARING_DATA?.[id];if(!data){const r=await fetch('../hoerverstehen-data/kurz-'+id+'.json',{cache:'no-store'});if(!r.ok)throw Error('Daten konnten nicht geladen werden');data=await r.json();}"
 if needle not in s:raise RuntimeError('Short hearing data loader changed; review offline patch')
 js.write_text(s.replace(needle,repl),encoding='utf8')
js=assets/'hoerverstehen.js'
if js.exists():
 s=js.read_text(encoding='utf8');needle="const response=await fetch('../hoerverstehen-data/'+id+'.json',{cache:'no-cache'});\n    if(!response.ok)throw Error('Daten konnten nicht geladen werden');\n    data=await response.json();"
 repl="data=window.OFFLINE_WOODLAND_DATA?.[id];\n    if(!data){const response=await fetch('../hoerverstehen-data/'+id+'.json',{cache:'no-cache'});if(!response.ok)throw Error('Daten konnten nicht geladen werden');data=await response.json();}"
 if needle not in s:raise RuntimeError('Woodland data loader changed; review offline patch')
 js.write_text(s.replace(needle,repl),encoding='utf8')
# Remove specific school / teacher identifiers from portable, text-based assets.
replacements=[(re.compile(r'(?i)klasse\s*3\s*[abcd]'), 'LernSafari'),(re.compile(r'(?i)klasse3[abcd]'), 'LernSafari'),(re.compile(r'(?i)herr\s+arnold(?:s)?'), 'LernSafari'),(re.compile(r'(?i)fabio\s+arnold'), 'LernSafari')]
for path in out.rglob('*'):
 if not path.is_file() or path.suffix.lower() not in {'.html','.htm','.js','.css','.md','.json','.txt','.svg','.yml','.yaml'}:continue
 try:s=path.read_text(encoding='utf-8')
 except UnicodeDecodeError:continue
 old=s
 for pat,new in replacements:s=pat.sub(new,s)
 if s!=old:path.write_text(s,encoding='utf-8')
# Neutral offline start, no login, no classroom, no backend.
pages={
 '🎧 Kurze Hörverständnisse – leichter':[
 ('Der freche Affe','hoerverstehen-kurz-affe.html'),('Der kleine Löwe','hoerverstehen-kurz-loewe.html'),('Die verschwundene Brille','hoerverstehen-kurz-brille.html'),('Das grosse Wettrennen','hoerverstehen-kurz-wettrennen.html'),('Der heimliche Kuchen','hoerverstehen-kurz-kuchen.html')],
 '🌲 Waldtiere – schwieriger':[
 ('Der Dachs','hoerverstehen-dachs.html'),('Das Eichhörnchen','hoerverstehen-eichhoernchen.html'),('Der Igel','hoerverstehen-igel.html'),('Das Reh','hoerverstehen-reh.html'),('Der Rotfuchs','hoerverstehen-rotfuchs.html')],
 '♟️ Schach': [('Schach-Lexikon','schach-lexikon.html'),('Schach gegen den Computer','schach-computer.html')],
 '🧩 Knobelaufgaben': [('Sudoku – 45 Rätsel','oase-sudoku.html'),('Buchstabensalat – 4 Themen','oase-buchstabensalat.html'),('Zahlen-Detektiv','oase-zahlenmuster.html')],
 '🎨 Kreativatelier': [('Mein Malatelier','oase-zeichnen.html'),('Zeichenschule','oase-abzeichnen.html'),('Ausmalstudio','oase-ausmalen.html')],
}
# Include other game files as additional optional material.
chosen={f for games in pages.values() for _,f in games}
others=sorted([p for p in game_dir.glob('*.html') if p.name not in chosen]);pages['📚 Weitere Lernspiele']=[(p.stem.replace('-',' ').capitalize(),p.name) for p in others]
sections=''.join('<section><h2>'+html.escape(category)+'</h2><div class="cards">'+''.join('<a href="original/spiele/'+html.escape(name)+'"><strong>'+html.escape(title)+'</strong><span>Spiel öffnen ›</span></a>' for title,name in items)+'</div></section>' for category,items in pages.items())
markup='''<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LernSafari – Offline-Spiele</title><style>
:root{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#334f3b;background:#f5f0dd}*{box-sizing:border-box}body{margin:0;background:linear-gradient(135deg,#faf3db,#e5efd9)}main{max-width:1120px;margin:auto;padding:25px 18px 70px}.hero{background:#e3edd5;border:2px solid #b6cea9;border-radius:25px;padding:22px}.hero h1{margin:3px 0;color:#2d6347;font-size:clamp(29px,4vw,44px)}.hero p{line-height:1.5}section{background:#fffaf0;border:2px solid #e0d2b0;border-radius:20px;padding:18px;margin-top:18px}h2{margin:0 0 12px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.cards a{display:flex;flex-direction:column;gap:8px;background:white;color:#2b5b42;border:2px solid #ccdbc1;border-radius:13px;padding:13px;text-decoration:none;min-height:75px}.cards a:hover{background:#ebf5e5}.cards span{font-size:13px;color:#64856c}.note{padding:15px;background:#fff5d9;border-radius:12px;margin:13px 0;line-height:1.5}
</style></head><body><main><header class="hero"><small>🏝️ LERNEN · SPIELEN · ENTDECKEN</small><h1>LernSafari</h1><p>Deine Spiel- und Rätselwelt – direkt auf diesem Computer. Wähle eine Aufgabe und starte.</p></header><div class="note"><strong>Offline-Hinweis:</strong> Die fünf kurzen Hörverständnisse und die neuen Oasen-Spiele sind ohne Internet verwendbar. Die älteren Waldtier-Aufnahmen liegen bei einem externen Anbieter und benötigen zum Anhören eine Internetverbindung. Andere ältere Spiele können Online-Funktionen enthalten. Anmeldungen und Lernstände werden in dieser Offline-Ausgabe nicht mit einem Server synchronisiert.</div>'''+sections+'''<p style="padding:25px;text-align:center">Viel Freude beim Lernen und Entdecken! 🌿</p></main></body></html>'''
(out/'index.html').write_text(markup,encoding='utf-8')
(out/'OFFLINE-ANLEITUNG.txt').write_text('LernSafari – tragbare Offline-Ausgabe\n\n1. ZIP-Datei vollständig entpacken.\n2. index.html doppelklicken.\n3. Die neuen Oasen-Spiele und die fünf kurzen Hörverständnisse sind offline spielbar.\n4. Die fünf älteren Waldtier-Aufnahmen benötigen eine Internetverbindung, da sie beim Originalanbieter liegen.\n5. Cloudflare-Anmeldung, Post, individuelle Lernerfolge und andere Online-Funktionen sind in dieser Ausgabe nicht verbunden.\n6. Für andere Geräte den ganzen entpackten Ordner kopieren.\n',encoding='utf-8')
print('Offline package prepared:',len(list(out.rglob('*'))),'entries, short audios:',len(list((out/'original'/'hoerverstehen-audio').glob('*.m4a'))))