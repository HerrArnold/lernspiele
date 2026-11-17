import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const id of ['affe','loewe','brille','wettrennen','kuchen']){
   const data=JSON.parse(fs.readFileSync('original/hoerverstehen-data/kurz-'+id+'.json','utf8'));
   const page=await browser.newPage({viewport:{width:1400,height:900}});
   const errs=[];page.on('pageerror',e=>errs.push(e.message));
   const url='http://127.0.0.1:8765/original/spiele/hoerverstehen-kurz-'+id+'.html';
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>localStorage.clear());await page.reload();
   await page.locator('#hvNext').waitFor();
   assert.equal(await page.locator('#hvRead').isVisible(),false,id+' should lock reading until completed');
   for(const q of data.task1){await page.locator('[data-choice="tf"][data-id="'+q.id+'"][value="'+Number(q.correct)+'"]').check()}
   await page.locator('#hvNext').click();
   for(const q of data.task2){await page.locator('[data-choice="open"][data-id="'+q.id+'"][value="'+q.correct_index+'"]').check()}
   await page.locator('#hvNext').click();
   for(const q of data.task3){await page.locator('[data-choice="words"][data-id="'+q.id+'"][value="'+q.correct_index+'"]').check()}
   await page.locator('#hvNext').click();
   for(const q of data.task4){await page.locator('[data-order="'+q.id+'"]').selectOption(String(q.correct_position))}
   await page.locator('#hvNext').click();
   await page.locator('.hv-result').waitFor();
   assert.match(await page.locator('.hv-score').innerText(),/20 \/ 20/,id+' should grade correct answers');
   await page.locator('#hvStudyButton').click();
   assert.equal(await page.locator('.hv-study-question').count(),20,id+' should display all 20 questions beside text');
   assert.equal(await page.locator('.hv-study-prose').innerText().then(t=>t.replace(/\s+/g,' ').trim()),data.text,id+' should use original text');
   const target=page.locator('[data-study-id="b4"]');await target.click();
   assert.ok((await page.locator('.hv-study-sentence.is-highlighted').count())>0,id+' must highlight evidence');
   assert.ok(await target.getAttribute('aria-pressed')==='true');
   await page.reload();await page.locator('#hvNext').waitFor();
   assert.equal(await page.locator('#hvRead').isVisible(),true,id+' must remember unlock');
   await page.locator('#hvRead').click();assert.equal(await page.locator('.hv-study-question').count(),20);
   if(errs.length)throw Error(id+': '+errs.join(' | '));
   console.log('PASS '+data.title+' reading unlock, 20/20 grading, 20 answers and text highlights');
   await page.close();
 }
}finally{await browser.close()}
