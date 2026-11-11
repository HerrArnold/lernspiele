#!/usr/bin/env node
/* Static checks only; no network calls and no secrets. Run: node pruefen.mjs */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const required=['index.html','app.js','styles.css','integration.js','integration.css','cloudflare-integration.js','cloudflare-integration.css','diagnose.html','original/index.html','original/assets/login-config.js','original/spiele/solmisationsspiel.html'];
let errors=[];for(const name of required){if(!fs.existsSync(path.join(root,name)))errors.push('Fehlt: '+name)}
const allGames=fs.readdirSync(path.join(root,'original','spiele')).filter(x=>x.endsWith('.html'));
if(allGames.length<29)errors.push('Zu wenige Originalspiele: '+allGames.length);
const config=fs.readFileSync(path.join(root,'original/assets/login-config.js'),'utf8');
if(!/https:\/\/[a-z0-9.-]+/.test(config))errors.push('Cloudflare-HTTPS-Adresse fehlt');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const script of ['cloudflare-integration.js','original/assets/login-config.js','integration.js'])if(!index.includes(script))errors.push('Einbindung fehlt: '+script);
const cloud=fs.readFileSync(path.join(root,'cloudflare-integration.js'),'utf8');
for(const endpoint of ['/login','/me','/logout','/learning-plan','/assignment-done','/admin-session','/admin-learning','/admin-assignments','/agenda'])if(!cloud.includes(endpoint))errors.push('Erwarteter Endpunkt fehlt: '+endpoint);
console.log('Originalspiele: '+allGames.length);console.log('Cloudflare-Adresse: vorhanden');
if(errors.length){console.error('FEHLER\n'+errors.join('\n'));process.exit(1)}
console.log('PASS: Statische Datei- und Integrationsprüfung erfolgreich.');
