import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const image='data:image/jpeg;base64,'+'A'.repeat(100);
try{
 const page=await browser.newPage({viewport:{width:1250,height:850}});
 await page.setContent('<html><body><main id="projects"></main><section id="admin"></section></body></html>');
 await page.addStyleTag({path:'baobab-projects.css'});
 await page.addScriptTag({path:'baobab-projects.js'});
 await page.evaluate(image=>{
  window.calls=[];
  window.LERNSAFARI_BACKEND_URL='https://example.test';
  const projects=[
    {id:2,title:'Neuere Erinnerung',date:'2026-11-13',caption:'Neuer',image,photo_count:3},
    {id:1,title:'Älteres Erlebnis',date:'2026-10-12',caption:'Alt',image,photo_count:1}
  ];
  window.fetch=async url=>{
    const value=String(url);window.calls.push(value);
    if(value.endsWith('/projects'))return {ok:true,json:async()=>({available:true,projects})};
    if(value.includes('/project-photos?id=2'))return {ok:true,json:async()=>({available:true,photos:[{id:3,image},{id:4,image}]})};
    throw Error('Unexpected fetch: '+value);
  };
 },image);
 await page.evaluate(()=>window.LernSafariProjects.render(document.getElementById('projects')));
 await page.locator('[data-open-project="2"]').waitFor();
 assert.deepEqual(await page.locator('[data-open-project]').evaluateAll(nodes=>nodes.map(n=>n.dataset.openProject)),['1','2']);
 assert.match(await page.locator('[data-open-project="2"]').innerText(),/3 Fotos/);
 assert.match(await page.locator('[data-open-project="1"]').innerText(),/Vergrössern/);
 await page.locator('[data-open-project="2"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-photo-counter]')?.textContent==='Foto 1 von 3');
 await page.locator('[data-photo-step="1"]').click();
 assert.equal(await page.locator('[data-photo-counter]').innerText(),'Foto 2 von 3');
 await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('[data-photo-counter]').innerText(),'Foto 3 von 3');
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.baobab-lightbox').count(),0);
 await page.locator('[data-open-project="1"]').click();
 assert.equal(await page.locator('[data-photo-counter]').innerText(),'Foto 1 von 1');
 assert.equal(await page.locator('[data-photo-step="1"]').isDisabled(),true);
 await page.locator('.baobab-lightbox-close').click();
 const getCount=await page.evaluate(()=>window.calls.filter(x=>x.includes('/project-photos')).length);
 assert.equal(getCount,1,'Only projects with extras fetch additional images');
 await page.evaluate(()=>{
   window.adminCalls=[];
   window.adminCall=async(path,opts)=>{
     window.adminCalls.push({path,opts});
     if(path==='/admin-projects')return {available:true,projects:[{id:2,title:'Neuere Erinnerung',date:'2026-11-13',photo_count:3}]};
     if(path==='/admin-project-photos'&&opts.method==='POST')return {ok:true,id:8};
     throw Error('Unexpected admin request '+path);
   };
   window.LernSafariProjects.adminMount({mount:document.querySelector('#admin'),call:window.adminCall});
 });
 await page.locator('[data-add-project-photos="2"]').waitFor();
 await page.locator('[data-add-project-photos="2"]').click();
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/+kUAAAAASUVORK5CYII=','base64');
 await page.locator('[data-photo-form="2"] input[type=file]').setInputFiles({name:'erlebnis.png',mimeType:'image/png',buffer:png});
 await page.locator('[data-photo-form="2"] input[type=checkbox]').check();
 await page.locator('[data-save-project-photos="2"]').click();
 await page.waitForFunction(()=>window.adminCalls.some(x=>x.path==='/admin-project-photos'&&x.opts?.method==='POST'));
 const saved=await page.evaluate(()=>window.adminCalls.filter(x=>x.path==='/admin-project-photos'));
 assert.equal(saved.length,1);assert.equal(saved[0].opts.body.project_id,2);
 assert.equal(saved[0].opts.body.photo_permission_confirmed,true);
 assert.match(saved[0].opts.body.image,/^data:image\/jpeg;base64,/);
 console.log('PASS teacher adds image to an existing project with confirmed permission');
 console.log('PASS chronological preview, gallery indicator, lazy gallery, keyboard arrows and close');
}finally{await browser.close()}
