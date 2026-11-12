import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:768}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try {
 await page.addInitScript(()=>sessionStorage.setItem('lernsafari-admin-token-v2','mock-main-admin-token'));
 await page.route('**/lernsafari-api.ergohd02.workers.dev/**',async route=>{
  const req=route.request(),u=new URL(req.url()),p=u.pathname;
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
  const jobs=[{id:1,title:'3er Reihe üben',kind:'pflicht',target:'game:einmaleins-dreier',audience:'all',start_at:'2026-11-01T00:00:00Z',end_at:'2026-12-01T00:00:00Z'}];
  let data={available:true,ok:true};
  if(p==='/admin-learning')data={students:[{username:'Loewe'},{username:'Zebra'}],assignments:jobs,presence:[],done:[{username:'Loewe',assignment_id:1}],verified:[]};
  else if(p==='/admin-report')data={students:[{username:'Loewe'},{username:'Zebra'}],highscores:[],attempts:[
    {username:'Loewe',game:'einmaleins-dreier',correct_count:7,total:10,task:'3 × 6',answer:'17',expected:'18',details:'Multiplikation',created_at:'2026-11-12T09:00:00Z'},
    {username:'Loewe',game:'einmaleins-dreier',correct_count:9,total:10,task:'3 × 7',answer:'21',expected:'21',created_at:'2026-11-12T09:15:00Z'}
  ]};
  else if(p==='/admin-live-activity')data={available:true,students:[{username:'Loewe',area:'game',game:'einmaleins-dreier',last_seen:'2026-11-12T09:15:00Z'}]};
  else if(p==='/admin-agenda')data={events:[]};
  else if(p==='/admin-messages')data={available:true,messages:[]};
  else if(p==='/admin-projects')data={available:true,projects:[]};
  else if(p==='/admin-classroom-mode')data={available:true,classroomMode:{kind:'free',required_assignment_ids:[]}};
  await route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':'*','content-type':'application/json'},body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#userLabel')?.textContent?.includes('Flamingo'),null,{timeout:15000});
 await page.evaluate(()=>showModal('admin'));
 await page.locator('#adminScreen:not([hidden])').waitFor();
 assert.equal(await page.locator('#modalLayer:not([hidden])').count(),0,'Admin must be a full page, not a pop-up');
 assert.equal(await page.locator('[data-admin-section]').count(),6);
 await page.locator('[data-admin-section="progress"]').click();
 await page.locator('#adminProgressReport .admin-progress-game').first().waitFor({timeout:10000});
 assert.match(await page.locator('#adminProgressReport').innerText(),/80 %/,'7+9 of 20 correct = 80 percent');
 const first=page.locator('#adminProgressReport .admin-detail-attempt').first();
 await first.locator('summary').click();
 assert.match(await first.innerText(),/Meine Antwort/);
 assert.match(await first.innerText(),/Richtige Antwort/);
 await page.screenshot({path:'/tmp/lernsafari-main-progress.png'});
 await page.locator('[data-admin-workspace="progress"] .admin-home').click();
 await page.locator('[data-admin-section="activity"]').click();
 await page.locator('.admin-activity-assignments').waitFor();
 assert.match(await page.locator('.admin-activity-assignments').innerText(),/Loewe/);
 assert.match(await page.locator('.admin-activity-assignments').innerText(),/Zebra/);
 await page.screenshot({path:'/tmp/lernsafari-main-activity.png'});
 await page.locator('[data-admin-workspace="activity"] .admin-home').click();
 await page.locator('[data-admin-section="agenda"]').click();
 await page.locator('#adminAgendaForm').waitFor();
 assert.equal(await page.locator('#adminAgendaForm select[name=subject] option').count(),6);
 await page.locator('#adminAgendaDays .admin-agenda-day').first().waitFor({timeout:10000});
 assert.equal(await page.locator('#adminAgendaDays .admin-agenda-day').count(),7);
 await page.screenshot({path:'/tmp/lernsafari-main-agenda-admin.png'});

 await page.evaluate(()=>{closeModal(true);showModal('map')});
 await page.locator('.safari-map>img').first().waitFor();
 await page.waitForTimeout(650);
 const mapImage=await page.locator('.safari-map>img').first().evaluate(el=>({src:el.currentSrc,naturalWidth:el.naturalWidth}));
 assert.ok(/(?:karte-stickerwelt\.webp|karte\.png)$/.test(new URL(mapImage.src).pathname),'Map must load the new illustration or the existing real image, not SVG placeholder');
 assert.ok(mapImage.naturalWidth>0,'Map image did not load');
 await page.screenshot({path:'/tmp/lernsafari-main-map.png'});
 await page.evaluate(()=>travelTo('baobab'));
 await page.locator('.baobab-new-map>img').first().waitFor();
 await page.waitForTimeout(650);
 const treeImage=await page.locator('.baobab-new-map>img').first().evaluate(el=>({src:el.currentSrc,naturalWidth:el.naturalWidth}));
 assert.ok(/(?:baobab-stickerwelt\.webp|baobab\.jpg)$/.test(new URL(treeImage.src).pathname),'Baobab must load the new illustration or the existing real image, not SVG placeholder');
 assert.ok(treeImage.naturalWidth>0,'Baobab image did not load');
 await page.screenshot({path:'/tmp/lernsafari-main-baobab.png'});
 if(errors.length)throw Error('Page exceptions: '+errors.join(' | '));
 console.log('PASS: main teacher page, six sections, progress with real percentages/errors, activity and Agenda editor.');
}finally{await browser.close()}
