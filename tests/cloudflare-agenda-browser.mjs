import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:8765';
const api='https://lernsafari-api.ergohd02.workers.dev';
const browser=await chromium.launch({headless:true});
const requestWeeks=[];
const dayAdd=(iso,n)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const respond=(obj,status=200)=>({status,headers:{'access-control-allow-origin':'*','content-type':'application/json; charset=utf-8'},body:JSON.stringify(obj)});
async function setMock(page){
 await page.route('**/lernsafari-api.ergohd02.workers.dev/**',async route=>{
  const url=new URL(route.request().url());
  if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'*'}});
  let payload={available:true,ok:true};
  if(url.pathname==='/me')payload={role:'class',username:'3a'};
  else if(url.pathname==='/learning-plan')payload={assignments:[],blocks:[],done:[]};
  else if(url.pathname==='/agenda'){
   const monday=url.searchParams.get('week');requestWeeks.push(monday);
   payload={events:[{id:1,day_date:monday,period:'am',type:'ha',text:'Wochentermin '+monday}]};
  }
  await route.fulfill(respond(payload));
 });
}
async function newClassPage(context,token){
 const page=await context.newPage();
 await page.addInitScript(token=>localStorage.setItem('lernsafari-token-v1',token),token);
 await setMock(page);
 await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#userLabel')?.textContent?.includes('3a'),null,{timeout:10000});
 return page;
}
try{
 const firstContext=await browser.newContext({viewport:{width:1366,height:768}});
 const secondContext=await browser.newContext({viewport:{width:1366,height:768}});
 const one=await newClassPage(firstContext,'test-3a-device-one');
 const two=await newClassPage(secondContext,'test-3a-device-two');
 assert.equal(await one.evaluate(()=>localStorage.getItem('lernsafari-token-v1')),'test-3a-device-one');
 assert.equal(await two.evaluate(()=>localStorage.getItem('lernsafari-token-v1')),'test-3a-device-two');
 await one.reload({waitUntil:'domcontentloaded'});
 await one.waitForFunction(()=>document.querySelector('#userLabel')?.textContent?.includes('3a'));
 assert.equal(await one.evaluate(()=>localStorage.getItem('lernsafari-token-v1')),'test-3a-device-one');

 await one.evaluate(()=>showModal('agenda'));
 await one.locator('#cloudAgendaPrevious').waitFor();
 assert.equal(await one.locator('#cloudAgendaNext').count(),1);
 assert.equal(await one.locator('#cloudAgendaToday').count(),1);
 assert.equal(await one.locator('.cloud-agenda-other-week').count(),0);
 assert.equal(await one.locator('.cloud-agenda-today-button').isDisabled(),true);
 const thisMonday=requestWeeks.at(-1);
 assert.match(thisMonday,/^\d{4}-\d{2}-\d{2}$/);
 await one.locator('.cloud-event').first().waitFor();
 await one.screenshot({path:'/tmp/safari-agenda-current-week.png'});
 await one.click('#cloudAgendaPrevious');
 await one.locator('.cloud-agenda-other-week').waitFor();
 assert.match(await one.locator('.cloud-agenda-other-week').innerText(),/frühere Woche/);
 await one.locator('.cloud-event').first().waitFor();
 assert.equal(requestWeeks.at(-1),dayAdd(thisMonday,-7));
 await one.screenshot({path:'/tmp/safari-agenda-last-week.png'});
 await one.click('#cloudAgendaNext');
 await one.locator('.cloud-event').first().waitFor();
 assert.equal(requestWeeks.at(-1),thisMonday);
 assert.equal(await one.locator('.cloud-agenda-other-week').count(),0);
 await one.click('#cloudAgendaNext');
 await one.locator('.cloud-agenda-other-week').waitFor();
 assert.match(await one.locator('.cloud-agenda-other-week').innerText(),/spätere Woche/);
 await one.locator('.cloud-event').first().waitFor();
 assert.equal(requestWeeks.at(-1),dayAdd(thisMonday,7));
 await one.screenshot({path:'/tmp/safari-agenda-next-week.png'});
 await one.click('#cloudAgendaToday');
 await one.locator('.cloud-event').first().waitFor();
 assert.equal(requestWeeks.at(-1),thisMonday);
 assert.equal(await one.locator('.cloud-agenda-other-week').count(),0);

 // The separate device must retain its own token and its own visible class account.
 assert.equal(await two.evaluate(()=>localStorage.getItem('lernsafari-token-v1')),'test-3a-device-two');
 assert.match(await two.locator('#userLabel').innerText(),/3a/);

 const teacher=await browser.newContext({viewport:{width:1366,height:768}});
 const admin=await teacher.newPage();
 await admin.addInitScript(()=>sessionStorage.setItem('lernsafari-admin-token-v2','test-admin'));
 await admin.route('**/lernsafari-api.ergohd02.workers.dev/**',async route=>{
  await route.fulfill(respond({ok:true,available:true}));
 });
 await admin.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
 await admin.waitForFunction(()=>document.querySelector('#userLabel')?.textContent?.includes('Flamingo'),null,{timeout:10000});
 assert.match(await admin.locator('#userLabel').innerText(),/Flamingo/);
 console.log('PASS: two class devices stay logged in independently, Flamingo display, previous/current/next week and other-week warning.');
}finally{await browser.close();}
