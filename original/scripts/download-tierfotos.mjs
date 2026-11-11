/**
 * LernSafari: einmaliger Import von frei lizenzierten Tierfotos aus Wikimedia Commons.
 * Ausführen im lokal geklonten Repository: node scripts/download-tierfotos.mjs
 * Schreibt Bilder + Bildquellen lokal in assets/tierfotos/ und passt tierwelt-data.js an.
 * Keine Veränderung an Cloudflare, Lernfortschritt oder Anmeldedaten.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const assets=path.join(root,'assets');
const dataFile=path.join(assets,'tierwelt-data.js');
const photoDir=path.join(assets,'tierfotos');
const sourceFile=path.join(assets,'TIERFOTOS_QUELLEN.txt');
await fs.mkdir(photoDir,{recursive:true});
const dataSource=await fs.readFile(dataFile,'utf8');
const sandbox={window:{}};
vm.runInNewContext(dataSource,sandbox,{timeout:1000});
const animals=sandbox.window.SAFARI_ANIMALS;
if(!Array.isArray(animals)||animals.length!==26)throw new Error('Die Tierdaten wurden nicht gefunden. Es wurden keine Änderungen vorgenommen.');

// Wissenschaftliche Namen verhindern, dass ein Foto einer falschen Tierart gewählt wird.
const searches={
 chamaeleon:['Chamaeleo dilepis photograph','Chamaeleonidae Africa photograph'],
 elefant:['Loxodonta africana wildlife photo','African bush elephant wildlife photograph'],
 eidechse:['Agama agama lizard photograph','African agama lizard photo'],
 honigdachs:['Mellivora capensis photograph','Honey badger in wild'],
 antilope:['Aepyceros melampus impala photo','Impala Africa photograph'],
 doktorfisch:['Acanthurus leucosternon underwater photograph','Acanthurus leucosternon'],
 libelle:['Orthetrum chrysostigma dragonfly photograph','African dragonfly wildlife'],
 leopard:['Panthera pardus leopard in Africa photograph','African leopard'],
 maki:['Lemur catta ring-tailed lemur photo','Lemur catta'],
 mandrill:['Mandrillus sphinx photograph','Mandrill Africa'],
 nektarvogel:['Cinnyris venustus sunbird photo','African sunbird photograph'],
 nilpferd:['Hippopotamus amphibius photograph','Hippopotamus river Africa'],
 nashorn:['Diceros bicornis black rhinoceros photo','African rhinoceros in wild'],
 okapi:['Okapia johnstoni photograph','Okapi animal'],
 rochen:['Taeniura lymma ray photograph','Stingray Indian Ocean photograph'],
 seepferdchen:['Hippocampus hippocampus underwater photo','Seahorse Africa'],
 gorilla:['Gorilla gorilla wildlife photo','Gorilla in African forest'],
 flamingo:['Phoenicopterus roseus photograph','Greater flamingo Africa photo'],
 erdmaennchen:['Suricata suricatta meerkat photograph','Meerkat African savanna'],
 warzenschwein:['Phacochoerus africanus warthog photograph','African warthog'],
 loewe:['Panthera leo African lion photo','African lion wild photograph'],
 schildkroete:['Stigmochelys pardalis leopard tortoise photograph','African tortoise'],
 zebra:['Equus quagga plains zebra photograph','African zebra photo'],
 giraffe:['Giraffa camelopardalis giraffe photograph','Giraffe in Africa'],
 frosch:['Hyperolius viridiflavus frog photograph','African reed frog photograph'],
 spinne:['Trichonephila senegalensis spider photo','African orb weaving spider photo']
};
const HEADERS={
 'User-Agent':'LernSafari/1.0 (https://herrarnold.github.io/lernspiele/; classroom educational site)',
 'Accept':'application/json, image/jpeg, image/png, image/webp, */*'
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const strip=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const safeLicense=s=>/^(?:CC[- ]?BY(?:[- ]?SA)?[- ]?[1-4]\.[0-9]|CC0(?:[- ]?1\.0)?|Public domain|PD(?:-.*)?)$/i.test(s.trim());
const unsuitable=/logo|cartoon|illustration|drawing|icon|diagram|sketch|painting|silhouette|taxiderm|mounted|captive|zoo|drawing|stuffed/i;
async function searchCommons(query){
 const url=new URL('https://commons.wikimedia.org/w/api.php');
 url.search=new URLSearchParams({action:'query',format:'json',generator:'search',gsrsearch:'filetype:bitmap '+query,gsrnamespace:'6',gsrlimit:'20',prop:'imageinfo',iiprop:'url|mime|size|extmetadata',iiurlwidth:'900',origin:'*'});
 const res=await fetch(url,{headers:HEADERS,signal:AbortSignal.timeout(20000)});
 if(!res.ok)throw new Error('Commons API: HTTP '+res.status);
 const json=await res.json();
 return Object.values(json.query?.pages||{}).flatMap(p=>(p.imageinfo||[]).map(info=>({title:p.title,info})))
 .filter(({title,info})=>/^image\/(jpeg|png|webp)$/.test(info.mime||'')&&info.width>=400&&!unsuitable.test(title))
 .filter(({info})=>safeLicense(strip(info.extmetadata?.LicenseShortName?.value||info.extmetadata?.License?.value||'')))
 .sort((a,b)=>{const x=a.title.toLowerCase(),y=b.title.toLowerCase();const aScore=(/wild|nature|africa|photograph|\.jpg/.test(x)?3:0)+(a.info.width>=800?1:0);const bScore=(/wild|nature|africa|photograph|\.jpg/.test(y)?3:0)+(b.info.width>=800?1:0);return bScore-aScore;});
}
const sources=[];const failures=[];let count=0;
for(const animal of animals){
 let imported=false;
 for(const query of searches[animal.id]||[animal.name+' animal photograph']){
  try{
   const results=await searchCommons(query);
   for(const pick of results.slice(0,5)){
    const uri=pick.info.thumburl||pick.info.url;
    const response=await fetch(uri,{headers:{'User-Agent':HEADERS['User-Agent']},signal:AbortSignal.timeout(25000)});
    if(!response.ok)continue;
    const mime=response.headers.get('content-type')||'';
    if(!/^image\/(jpeg|png|webp)/.test(mime))continue;
    const bytes=Buffer.from(await response.arrayBuffer());
    if(bytes.length<15000||bytes.length>12_000_000)continue;
    const ext=mime.includes('png')?'png':mime.includes('webp')?'webp':'jpg';
    const name=animal.id+'.'+ext;
    await fs.writeFile(path.join(photoDir,name),bytes);
    animal.photo='tierfotos/'+name;
    animal.photoSource=pick.info.descriptionurl||'https://commons.wikimedia.org/wiki/'+encodeURIComponent(pick.title);
    animal.photoCredit=strip(pick.info.extmetadata?.Artist?.value)||'Wikimedia Commons';
    animal.photoLicense=strip(pick.info.extmetadata?.LicenseShortName?.value)||'Lizenz auf der Dateiseite';
    sources.push([animal.name,pick.title,animal.photoCredit,animal.photoLicense,animal.photoSource].join(' | '));
    console.log('✓',animal.name,'→',name);
    imported=true;count++;
    break;
   }
   if(imported)break;
  }catch(err){console.warn('  '+animal.name+': '+err.message)}
  await sleep(400);
 }
 if(!imported){failures.push(animal.name);console.warn('✕ Noch kein lokales Foto:',animal.name)}
}
if(count){
 await fs.writeFile(dataFile,'window.SAFARI_ANIMALS='+JSON.stringify(animals,null,2)+';\n','utf8');
 await fs.writeFile(sourceFile,'Tierfotos für LernSafari – Quellen und Lizenzen\n'
  +'Die Bilder werden lokal gespeichert. Lizenz und Urheberin/Urheber gehören zu jedem Bild.\n'
  +'CC-BY/CC-BY-SA verlangt eine geeignete Namensnennung, teilweise Weitergabe unter gleichen Bedingungen.\n\n'
  +sources.join('\n')+'\n','utf8');
}
console.log(`\nErgebnis: ${count}/${animals.length} Tierfotos lokal gespeichert.`);
if(failures.length)console.log('Nicht heruntergeladen:',failures.join(', '));
console.log('Lade die aktualisierten Assets zusammen mit den Bildern via GitHub Desktop hoch.');
if(failures.length)process.exitCode=2;
