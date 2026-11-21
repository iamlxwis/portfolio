const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../main');
const artifacts=path.join(__dirname,'artifacts');fs.mkdirSync(artifacts,{recursive:true});
const aliases={'/':'/index.html','/brat':'/brat/index.html','/meow':'/meow/index.html','/arf':'/arf/index.html','/log':'/pages/log.html','/privacy':'/legal/privacy.html','/cookies':'/legal/cookies.html','/terms':'/legal/terms.html','/privacy.css':'/assets/shared/privacy.css','/privacy.js':'/assets/shared/privacy.js','/legal.css':'/assets/shared/legal.css'};
const type={'.css':'text/css','.js':'application/javascript','.html':'text/html','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
 try{
  const uri=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const location=path.resolve(root,'.'+(aliases[uri]||uri));
  if(!location.startsWith(root+path.sep))throw Error('not allowed');
  const data=fs.readFileSync(location);
  res.writeHead(200,{'Content-Type':(type[path.extname(location)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store'});res.end(data);
 }catch(e){res.writeHead(404);res.end('not found')}
});
const saveConsent=()=>{try{localStorage.setItem('lxwis-consent-v4',JSON.stringify({choice:'essential',version:4,at:new Date().toISOString()}))}catch(e){}};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,errors=[];
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [360,390,768,1440]){
   const ctx=await browser.newContext({viewport:{width,height:width<500?844:900}});
   await ctx.addInitScript(saveConsent);
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(width+': '+e.message));
   await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await page.goto(base+'/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!document.documentElement.classList.contains('lx-booting'),null,{timeout:3000});
   await page.waitForFunction(()=>getComputedStyle(document.getElementById('lx-page-loader')).visibility==='hidden',null,{timeout:3300});
   await page.waitForTimeout(350);
   const metrics=await page.evaluate(()=>({
    screen:document.documentElement.clientWidth,
    width:document.documentElement.scrollWidth,
    dismissed:getComputedStyle(document.getElementById('lx-page-loader')).visibility==='hidden',
    seen:sessionStorage.getItem('lxwis-intro-seen-v1')==='1',
    nav:document.querySelectorAll('.site-nav a').length,
    sections:['work','explore','contact'].every(id=>!!document.getElementById(id)),
    vinyl:document.getElementById('vinyl-widget').classList.contains('is-minimized')
   }));
   assert.ok(metrics.width<=metrics.screen+2,'Horizontal overflow '+width+' '+JSON.stringify(metrics));
   assert.ok(metrics.dismissed&&metrics.seen,'Loader failed to dismiss '+width+' '+JSON.stringify(metrics));
   assert.ok(metrics.nav===3&&metrics.sections,'Navigation missing '+width);
   const footer=await page.evaluate(()=>{
    const spans=[...document.querySelectorAll('.wrap>footer>span')];
    return spans.slice(0,2).map(x=>x.getBoundingClientRect().top);
   });
   assert.ok(footer.length===2&&Math.abs(footer[0]-footer[1])<5,'Footer credits wrapped awkwardly at '+width);

   if(width<600)assert.ok(metrics.vinyl,'Mobile vinyl should start compact');
   // Floating vinyl: drag by the grip, move with keys, dismiss, persist and restore.
   const origin=await page.locator('#vinyl-widget').boundingBox();
   const grip=await page.locator('#vinyl-grab').boundingBox();
   await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);
   await page.mouse.down();
   await page.mouse.move(grip.x+grip.width/2+64,grip.y+grip.height/2-90,{steps:6});
   await page.mouse.up();
   const moved=await page.locator('#vinyl-widget').boundingBox();
   assert.ok(moved.x>origin.x+30&&moved.y<origin.y-45,'Vinyl drag failed at '+width);
   await page.locator('#vinyl-grab').focus();
   await page.keyboard.press('ArrowRight');
   const keyed=await page.locator('#vinyl-widget').boundingBox();
   assert.ok(keyed.x>moved.x+5,'Vinyl keyboard movement failed at '+width);
   await page.locator('#vinyl-close').click();
   assert.ok(await page.locator('#vinyl-widget').isHidden(),'Vinyl close failed');
   assert.ok(await page.locator('#vinyl-reopen').isVisible(),'Music restore dock missing');
   await page.reload({waitUntil:'domcontentloaded'});
   assert.ok(await page.locator('#vinyl-widget').isHidden(),'Closed player did not persist');
   await page.locator('#vinyl-reopen').click();
   assert.ok(await page.locator('#vinyl-widget').isVisible(),'Vinyl failed to reopen');
   const restored=await page.locator('#vinyl-widget').boundingBox();
   assert.ok(Math.abs(restored.x-keyed.x)<30,'Saved vinyl position not restored at '+width);
   await page.locator('#vinyl-minimize').click();
   assert.ok(!await page.locator('#vinyl-widget').evaluate(el=>el.classList.contains('is-minimized')),'Expand action failed');
   await page.locator('#vinyl-minimize').click();
   assert.ok(await page.locator('#vinyl-widget').evaluate(el=>el.classList.contains('is-minimized')),'Minimize action failed');
   console.log('PASS vinyl',width,'px | drag, keyboard move, close, persist, reopen, minimize');

   await page.locator('#terminal-trigger').click();
   await page.waitForTimeout(80);
   assert.equal(await page.locator('#terminal-modal').getAttribute('aria-hidden'),'false');
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#terminal-modal').getAttribute('aria-hidden'),'true');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'terminal-trigger');
   await page.locator('.site-nav a[href="#contact"]').click();
   await page.waitForTimeout(750);
   assert.equal(new URL(page.url()).hash,'#contact');
   assert.ok(await page.evaluate(()=>scrollY>100),'Navigation scroll failed');
   await page.locator('#lx-back-to-top').click();
   await page.waitForFunction(()=>scrollY<30,null,{timeout:3000});
   await page.screenshot({path:path.join(artifacts,'home-'+width+'.png'),fullPage:true,animations:'disabled'});
   await page.reload({waitUntil:'domcontentloaded'});
   assert.ok(!await page.evaluate(()=>document.documentElement.classList.contains('lx-booting')),'Intro repeated');
   console.log('PASS',width,'px | loader, layout, navigation, terminal, back-to-top');
   await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await ctx.addInitScript(saveConsent);
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push('reduce: '+e.message));
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  assert.ok(!await page.evaluate(()=>document.documentElement.classList.contains('lx-booting')),'Reduced motion should skip intro');
  assert.ok(!await page.evaluate(()=>document.documentElement.classList.contains('lx-motion-ready')),'Reduced motion should skip reveals');
  console.log('PASS reduced-motion preference');
  for(const [p,title] of [['/brat','brat'],['/meow','Meow'],['/arf','Arf'],['/privacy','privacy'],['/cookies','cookies'],['/terms','terms']]){
   const response=await page.goto(base+p,{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200,'Missing route '+p);
   assert.ok((await page.title()).toLowerCase().includes(title.toLowerCase()),'Incorrect page '+p);
   console.log('PASS route',p);
  }
  assert.deepEqual(errors,[],'JavaScript browser errors');
  console.log('PASS no uncaught browser errors');
  await ctx.close();
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
