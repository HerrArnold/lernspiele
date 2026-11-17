import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:850}});
 await page.setContent('<html><head></head><body><span id="mailIndicator" hidden>1</span><div id="area"></div></body></html>');
 await page.addStyleTag({path:'lernsafari-extras.css'});
 await page.addScriptTag({path:'lernsafari-extras.js'});
 await page.evaluate(()=>{
   window.calls=[];
   window.mockCall=async(path,options)=>{
     window.calls.push({path,options});
     if(path==='/messages')return {available:true,messages:[
       {id:1,subject:'Ältere Post',kind:'message',body:'Hallo',created_at:'2026-11-11T08:00:00Z',read_at:'2026-11-11T09:00:00Z'},
       {id:2,subject:'Neue Auszeichnung',kind:'success',body:'Du warst fleissig!',created_at:'2026-11-13T08:00:00Z',read_at:null}
     ]};
     if(path==='/messages/read')return {ok:true};
     if(path==='/admin-messages'&&options?.method==='POST')return {ok:true,id:6};
     if(path==='/admin-messages')return {available:true,messages:[]};
     throw Error('Unexpected route '+path);
   };
 });
 await page.evaluate(()=>window.LernSafariExtras.mailbox({host:document.querySelector('#area'),call:window.mockCall}));
 assert.deepEqual(await page.locator('.ls-post-title strong').allInnerTexts(),['Neue Auszeichnung','Ältere Post']);
 assert.equal(await page.locator('.ls-post.is-unread').count(),1);
 assert.equal(await page.locator('#mailIndicator').innerText(),'1');
 await page.locator('[data-open-post="2"]').click();
 await page.waitForFunction(()=>document.querySelector('.ls-post[data-post-id="2"]').classList.contains('is-read'));
 assert.equal(await page.locator('.ls-post.is-unread').count(),0);
 assert.equal(await page.locator('#mailIndicator').isHidden(),true);
 const posted=await page.evaluate(()=>window.calls.filter(x=>x.path==='/messages/read'));
 assert.equal(posted.length,1);assert.equal(posted[0].options.body.id,2);
 await page.evaluate(()=>{
   window.LernSafariTopicCatalog={Mathe:[{name:'Einmaleins',games:[['Die 7er-Reihe','einmaleins-siebener.html']]}],Musik:[{name:'Rhythmus',games:[['Rhythmus-Trio','rhythmus-trio.html']]}]};
   window.LernSafariExtras.logbook({host:document.querySelector('#area'),
     plan:{assignments:[{id:9,title:'7er-Reihe',target:'game:einmaleins-siebener',kind:'pflicht'}],done:[]},
     highscores:{highscores:[{game:'einmaleins-siebener',score:87},{game:'rhythmus-trio',score:100}]},
     messages:[{kind:'success',id:5,subject:'Besonders fleissig',body:'Du hast viel geübt!',created_at:'2026-11-13T08:00:00Z'}],
     onOpen:()=>{},onDone:async()=>{},onRefresh:()=>{}
   });
 });
 assert.equal(await page.locator('[data-logbook-open="9"]').count(),1);
 await page.locator('[data-logbook-tab="achievements"]').click();
 assert.match(await page.locator('.ls-award-list').innerText(),/Besonders fleissig/);
 await page.locator('[data-achievement-tab="highscores"]').click();
 assert.match(await page.locator('.ls-score-list').innerText(),/Mathe/);
 await page.locator('.ls-score-subject > summary').first().click();
 assert.match(await page.locator('.ls-score-subject').first().innerText(),/Einmaleins/);
 await page.evaluate(()=>window.LernSafariExtras.adminPanel({host:document.querySelector('#area'),call:window.mockCall,kids:[{username:'Affe'}]}));
 await page.locator('#lsTeacherPostForm').waitFor({state:'visible'});
 await page.locator('#lsTeacherPostForm [name="kind"]').selectOption('success');
 await page.locator('#lsTeacherPostForm [name="audience"]').selectOption('child');
 await page.locator('#lsTeacherPostForm [name="subject"]').fill('Tolle Arbeit');
 await page.locator('#lsTeacherPostForm [name="body"]').fill('Du hast fleissig geübt.');
 await page.locator('#lsTeacherPostForm button[type="submit"]').click();
 await page.waitForFunction(()=>document.querySelector('#lsTeacherPostStatus').textContent.includes('gespeichert'));
 const sent=await page.evaluate(()=>window.calls.filter(x=>x.path==='/admin-messages'&&x.options?.method==='POST'));
 assert.equal(sent.length,1);assert.equal(sent[0].options.body.kind,'success');assert.equal(sent[0].options.body.recipient,'Affe');
 console.log('PASS mailbox ordering/read flags, child logbook awards/subject topics, teacher success letter');
}finally{await browser.close()}
