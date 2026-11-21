'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const root=path.resolve(__dirname,'../main'),art=path.resolve(__dirname,'artifacts/v2');
fs.mkdirSync(art,{recursive:true});
const rewrites={
 '/':'/index.html','/brat':'/brat/index.html','/meow':'/meow/index.html','/arf':'/arf/index.html',
 '/privacy':'/legal/privacy.html','/cookies':'/legal/cookies.html','/terms':'/legal/terms.html','/log':'/pages/log.html',
 '/legal.css':'/assets/shared/legal.css','/privacy.css':'/assets/shared/privacy.css','/privacy.js':'/assets/shared/privacy.js'
};
const mime={'.css':'text/css','.js':'application/javascript','.html':'text/html','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const target=path.resolve(root,'.'+(rewrites[pathname]||pathname));
  if(!target.startsWith(root+path.sep))throw Error('outside web root');
  const data=fs.readFileSync(target);
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch(e){res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found')}
});
const consent=()=>{
 try{localStorage.setItem('lxwis-consent-v4',JSON.stringify({choice:'essential',version:4,at:new Date().toISOString()}))}catch(e){}
};
const SVG='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="760" viewBox="0 0 640 760"><rect width="640" height="760" fill="#3d4c43"/><circle cx="330" cy="330" r="180" fill="#c6d8ba"/><path d="M100 660h440" stroke="#f4f4f4" stroke-width="22"/></svg>';
function mockServices(page,base){
 let cats=0;
 page.route('**/*',route=>{
  const u=route.request().url();
  if(u.startsWith(base)){
   if(new URL(u).pathname==='/api/log'){
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([
     {sha:'abcdef1123456789',commit:{message:'Improve gallery interactions',author:{name:'lxwis',date:'2026-11-22T08:00:00Z'}}},
     {sha:'123456789abcdef0',commit:{message:'Update project layout',author:{name:'lxwis',date:'2026-11-21T07:00:00Z'}}}
    ])});
   }
   return route.continue();
  }
  if(u.includes('cataas.com/api/cats?limit=12')){
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(Array.from({length:12},(_,i)=>({_id:'bulk-cat-'+i})))});
  }
  if(u.includes('cataas.com/cat?json=true')){
   cats++;return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({_id:'mock-cat-'+cats})});
  }
  if(u.includes('dog.ceo/api/breeds/image/random/12')){
   return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({status:'success',message:Array.from({length:12},(_,i)=>'https://images.dog.ceo/breeds/demo/image-'+i+'.jpg')})});
  }
  if(u.includes('cataas.com/cat/')||u.includes('images.dog.ceo/breeds/demo/')){
   return route.fulfill({status:200,contentType:'image/svg+xml',headers:{'access-control-allow-origin':'*'},body:SVG});
  }
  return route.abort();
 });
}
async function checkAxe(page,label){
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 const severe=result.violations.filter(v=>['critical','serious'].includes(v.impact));
 if(severe.length)console.log('A11Y FAIL',label,JSON.stringify(severe.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))));
 assert.deepEqual(severe.map(v=>v.id),[],'Critical/serious accessibility violations: '+label);
}
async function checkOverflow(page,label){
 const m=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(m.scroll<=m.client+2,'Horizontal overflow '+label+' '+JSON.stringify(m));
}
async function shot(page,label){await page.screenshot({path:path.join(art,label+'.png'),fullPage:true,animations:'disabled'});}
async function navigate(page,base,route){
 const res=await page.goto(base+route,{waitUntil:'domcontentloaded'});
 assert.equal(res.status(),200,'Missing '+route);
 await page.waitForTimeout(120);
}
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,errors=[];
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const routes=['/','/brat','/meow','/arf','/log','/privacy','/cookies','/terms','/404.html'];
  for(const width of [360,390,768,1280]){
   const context=await browser.newContext({viewport:{width,height:width<=390?844:900}});
   await context.addInitScript(consent);
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(width+' '+page.url()+' '+e.message));
   mockServices(page,base);
   for(const route of routes){
    await navigate(page,base,route);
    if(route==='/'){
     await page.waitForFunction(()=>getComputedStyle(document.getElementById('lx-page-loader')).visibility==='hidden',null,{timeout:3500});
     assert.ok(!(await page.locator('body').innerText()).includes("I build things for the web"),'Homepage filler copy returned');
     assert.equal(await page.locator('.lx-showcase a').count(),3);
     assert.ok(await page.locator('.lx-route-menu').count());
     const sectionVisibility=await page.locator('.content-section').evaluateAll(nodes=>nodes.map(el=>({
      id:el.id,opacity:Number(getComputedStyle(el).opacity),rect:el.getBoundingClientRect().height
     })));
     assert.ok(sectionVisibility.every(item=>item.opacity>=.95&&item.rect>100),
      'Homepage contains invisible or collapsed sections at '+width+' '+JSON.stringify(sectionVisibility));
     const icons=await page.locator('.lx-icon svg').count();assert.ok(icons>=4,'Homepage icons not mounted');
    }
    if(route==='/log'){
     await page.waitForFunction(()=>document.querySelectorAll('.lx-log-entry').length>=2,null,{timeout:5000});
     const textBoxes=await page.locator('.lx-log-entry .lx-log-description').evaluateAll(nodes=>nodes.map(el=>({
      width:el.getBoundingClientRect().width,text:el.textContent
     })));
     assert.ok(textBoxes.every(item=>item.width>=Math.min(width*.47,380)),
      'Log text cramped at '+width+' '+JSON.stringify(textBoxes));
    }
    if(route==='/meow'||route==='/arf'){
     const peek=page.locator('.lx-gallery-peek img');
     assert.ok(await peek.count()===1,'Missing gallery preview '+route);
     await peek.evaluate(img=>img.decode());
     assert.ok(await peek.evaluate(img=>img.naturalWidth>0),'Gallery preview not loaded '+route);
    }
    await checkOverflow(page,route+' @ '+width);
    if(route==='/brat'){
     assert.ok(await page.locator('#art').isVisible(),'BRAT canvas hidden');
     assert.ok(await page.locator('#mainText').count(),'BRAT input missing');
    }
    if(['/meow','/arf','/log','/privacy','/cookies','/terms','/404.html'].includes(route)){
     assert.ok(await page.locator('.lx-route-menu summary').isVisible(),'Site menu missing: '+route);
    }
    await shot(page,route.replaceAll('/','-').replace(/^-$/,'home')+'-'+width);
    console.log('PASS visual',route,width);
   }
   await context.close();
  }
  // Interactions with a stable network fixture.
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(consent);
  const page=await context.newPage();page.on('pageerror',e=>errors.push('interaction '+e.message));mockServices(page,base);
  await navigate(page,base,'/meow');
  await page.locator('#startBtn').click();
  await page.waitForFunction(()=>document.querySelectorAll('.lx-gallery-tile').length>=8,null,{timeout:10000});
  assert.ok(await page.locator('.lx-gallery-tile').count()>=8,'Cat gallery never populated');
  await page.locator('.lx-gallery-tile').first().click();
  assert.ok(await page.locator('#lightbox').isVisible(),'Photo viewer failed');
  await page.keyboard.press('ArrowRight');
  assert.ok((await page.locator('#lbCounter').innerText()).includes('/'),'Photo counter absent');
  await page.locator('#lbFavorite').click();
  assert.equal(await page.locator('#lbFavorite').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('Escape');assert.ok(await page.locator('#lightbox').isHidden(),'Escape did not close photo');
  await page.locator('#favToggleBtn').click();
  assert.ok(await page.locator('.lx-gallery-tile').count()>=1,'Saved photo missing');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#startBtn').click();
  await page.waitForFunction(()=>document.querySelectorAll('.lx-gallery-tile').length>0);
  await page.locator('#favToggleBtn').click();
  assert.ok(await page.locator('.lx-gallery-tile').count()>=1,'Saved gallery did not persist');
  await shot(page,'meow-saved');
  console.log('PASS Meow: browse, viewer, keyboard, favorite persistence');
  await navigate(page,base,'/arf');
  await page.locator('#startBtn').click();
  await page.waitForFunction(()=>document.querySelectorAll('.lx-gallery-tile').length===12,null,{timeout:10000});
  await page.locator('.lx-gallery-tile').first().click();
  await page.locator('#lbNext').click();await page.locator('#lbFavorite').click();
  await page.locator('#lbClose').click();
  await page.locator('#favToggleBtn').click();
  assert.equal(await page.locator('.lx-gallery-tile').count(),1);
  await shot(page,'arf-saved');
  console.log('PASS Arf: batch load, viewer, save state');
  await navigate(page,base,'/log');
  await page.waitForFunction(()=>document.querySelectorAll('.lx-log-entry').length===2);
  await page.locator('#refresh').click();
  await page.waitForFunction(()=>!document.getElementById('refresh').disabled);
  assert.equal(await page.locator('.lx-log-entry').count(),2);
  console.log('PASS log API render and refresh');
  await navigate(page,base,'/privacy');
  const anchors=await page.locator('.lx-policy-toc a').count();assert.ok(anchors>=4);
  await page.locator('.lx-policy-toc a').last().click();
  assert.ok(page.url().includes('#section-'),'Policy table of contents not connected');
  await navigate(page,base,'/404.html');
  assert.ok(await page.getByRole('heading',{name:'404'}).count());
  assert.ok(await page.locator('a[href="/"]').count());
  console.log('PASS policy anchors and 404');
  await navigate(page,base,'/brat');
  const initial=await page.locator('#artText').innerText();
  assert.ok(initial.trim().length,'BRAT artwork blank');
  await page.locator('#mainText').fill('testing studio');
  await page.waitForTimeout(300);
  assert.ok((await page.locator('#artText').innerText()).includes('testing studio'),'BRAT editing failed');
  await page.locator('.brat-quick-button[title="Distraction-free preview"]').click();
  assert.ok(await page.locator('.brat-fullscreen').isVisible(),'BRAT fullscreen failed');
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('.brat-fullscreen').isHidden(),'BRAT fullscreen stuck');
  await page.locator('#downloadTop').click();
  assert.ok(await page.locator('.brat-export-dialog').isVisible(),'BRAT export chooser missing');
  await page.keyboard.press('Escape');
  console.log('PASS BRAT: edit, fullscreen and export chooser');
  await context.close();
  // Fresh visitor consent — accept must require the explicit checkmarks.
  const fresh=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const consentPage=await fresh.newPage();mockServices(consentPage,base);
  await navigate(consentPage,base,'/');
  await consentPage.waitForTimeout(150);
  const widget=consentPage.locator('#lx-privacy-widget');
  assert.ok(await widget.locator('.lx-overlay').isVisible(),'Privacy notice not displayed');
  assert.ok(await widget.locator('[data-choice="accept"]').isDisabled(),'Accept should be gated');
  await widget.locator('[data-read="privacy"]').check();
  await widget.locator('[data-read="terms"]').check();
  assert.ok(await widget.locator('[data-choice="accept"]').isEnabled(),'Accept was not enabled after review');
  await widget.locator('[data-choice="accept"]').click();
  assert.ok(await widget.locator('.lx-overlay').isHidden(),'Privacy notice did not dismiss');
  assert.ok(await consentPage.evaluate(()=>!!localStorage.getItem('lxwis-consent-v4')),'Consent not persisted');
  console.log('PASS consent checkmarks and dismissal');
  await fresh.close();
  const audit=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await audit.addInitScript(consent);
  const ap=await audit.newPage();mockServices(ap,base);
  for(const route of ['/','/meow','/arf','/log','/privacy','/cookies','/terms','/404.html','/brat']){
   await navigate(ap,base,route);
   await checkAxe(ap,route);
   console.log('PASS accessibility audit',route);
  }
  await audit.close();
  assert.deepEqual(errors,[],'Uncaught browser errors');
  console.log('PASS full site regression, 9 pages x 4 widths + interactions + axe + visibility + readable log');
 }finally{await browser.close();server.close()}
}
run().catch(e=>{console.error(e);server.close();process.exitCode=1});
