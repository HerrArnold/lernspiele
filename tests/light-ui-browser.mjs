import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
const contrast=([a,b])=>{const lum=hex=>{const rgb=hex.map(v=>v/255).map(v=>v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4));return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};return (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)};
const sample=async(selector)=>{
 const data=await page.locator(selector).first().evaluate(el=>{
  const css=getComputedStyle(el);const rgb=x=>(x.match(/\d+(?:\.\d+)?/g)||[]).slice(0,3).map(Number);
  return {text:css.color,bg:css.backgroundColor,foreground:rgb(css.color),background:rgb(css.backgroundColor),innerText:el.textContent?.slice(0,80)};
 });return data;
};
function assertLight(s,area){assert.equal(s.foreground.length,3,area+' foreground');assert.equal(s.background.length,3,area+' background');assert.ok(s.background[0]+s.background[1]+s.background[2]>440,area+' must use a light background: '+s.bg);assert.ok(contrast([s.foreground,s.background])>=4.5,area+' contrast too low: '+JSON.stringify(s));}
try{
 await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
 await page.locator('#loginForm').waitFor();
 for(const old of ['#guestBtn','#demoChild','#demoTeacher','#cloudTeacher'])assert.equal(await page.locator(old).count(),0,'Demo/guest teacher button remains: '+old);
 assert.ok((await page.locator('#loginForm input').count())>=2);
 // Five area colours and the new orange day valley.
 for(const [name,expected] of [['--sf-pink','#b84270'],['--sf-brown','#8b591f'],['--sf-valley','#d87521'],['--sf-lagoon','#2e7850'],['--sf-oasis','#247ba2']]){
  const value=await page.evaluate(n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase(),name);
  assert.equal(value,expected,'Wrong '+name);
 }
 await page.screenshot({path:'/tmp/safari-login-light.png',fullPage:false});
 // Read-only UI preview, not a real signed-in session. Inspect exact layout only.
 await page.evaluate(()=>enter('preview','Layoutprüfung'));
 await page.waitForTimeout(850);
 await page.screenshot({path:'/tmp/safari-camp-light.png',fullPage:false});
 await page.evaluate(()=>showModal('map'));
 await page.locator('.modal-kind-map .safari-map').waitFor();
 const mapOverflow=await page.locator('.modal-kind-map').evaluate(el=>({
  scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,bottom:el.getBoundingClientRect().bottom
 }));
 assert.ok(mapOverflow.scrollHeight<=mapOverflow.clientHeight+6,'Map modal requires scrolling on 1366x768: '+JSON.stringify(mapOverflow));
 assert.ok(mapOverflow.bottom<=768,'Map extends outside laptop viewport');
 assert.equal(await page.locator('.modal-kind-map [data-map-destination]').count(),10,'Map landmarks should be five visible buttons + five mobile shortcuts');
 await page.screenshot({path:'/tmp/safari-map-light.png',fullPage:false});
 await page.evaluate(()=>{closeModal(true);travelTo('baobab')});
 await page.waitForTimeout(700);
 assert.equal(await page.locator('.baobab-new-map .baobab-hotspot').count(),3,'Baobab should show only three labelled buttons');
 await page.screenshot({path:'/tmp/safari-baobab-light.png',fullPage:false});
 for(const area of ['lagoon','oasis','valley']){
  await page.evaluate(id=>travelTo(id),area);
  await page.waitForTimeout(200);
  const panel=page.locator('.destination-screen .destination-panel');
  assert.ok(await panel.count(),area+' panel missing');
  assertLight(await sample('.destination-screen .destination-panel'),area+' card');
  assert.ok(await page.locator('.destination-screen.is-'+area).count(),area+' palette class missing');
  await page.screenshot({path:'/tmp/safari-'+area+'-light.png',fullPage:false});
 }

 // Embedded legacy page must use the light colour palette.
 await page.goto(base+'/original/index.html#tiere',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(1200);
 const cards=await page.locator('#view-tiere .animal-card').count();
 assert.ok(cards>0,'Expected animal selectors');
 await page.locator('#view-tiere .animal-card').first().click();
 await page.waitForTimeout(250);
 if(await page.locator('#view-tiere .animal-story').count())assertLight(await sample('#view-tiere .animal-story'),'Tier-Steckbrief');
 if(await page.locator('#view-tiere .feature-panel').count())assertLight(await sample('#view-tiere .feature-panel'),'Tier-Infobox');
 await page.screenshot({path:'/tmp/safari-animals-light.png',fullPage:false});
 // Tages-Tal background / embedded user-facing font and mascot.
 await page.goto(base+'/original/index.html#aufgaben',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(500);
 assert.ok(await page.locator('img[src*="hornvogel-zahl-des-tages"]').count()>0,'Hornbill mascot missing');
 if(await page.locator('#view-aufgaben .zdt-example-card').count())assertLight(await sample('#view-aufgaben .zdt-example-card'),'Zahl des Tages example');
 await page.screenshot({path:'/tmp/safari-valley-light.png',fullPage:false});
 await page.goto(base+'/original/spiele/einmaleins-mix.html',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(600);
 if(await page.locator('.calc-card').count())assertLight(await sample('.calc-card'),'Einmaleins card');
 await page.screenshot({path:'/tmp/safari-einmaleins-light.png',fullPage:false});
 if(errors.length)throw Error('JavaScript exceptions: '+errors.slice(0,7).join(' | '));
 console.log('PASS: Login, palette, animal cards, day valley, one-multiplication game.');
}finally{await browser.close();}
