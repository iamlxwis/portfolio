'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const root=path.resolve(__dirname,'../main');
const artifact=path.join(__dirname,'artifacts','brat-editor');
fs.mkdirSync(artifact,{recursive:true});
const aliases={'/brat':'/brat/index.html','/':'/index.html','/privacy.css':'/assets/shared/privacy.css','/privacy.js':'/assets/shared/privacy.js'};
const mime={'.css':'text/css','.js':'application/javascript','.html':'text/html','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=path.resolve(root,'.'+(aliases[pathname]||pathname));
  if(!target.startsWith(root+path.sep))throw Error('outside web root');
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(fs.readFileSync(target));
 }catch(e){res.writeHead(404);res.end('not found')}
});
const prepare=()=>{
 try{
  localStorage.setItem('lxwis-consent-v4',JSON.stringify({choice:'essential',version:4,at:new Date().toISOString()}));
  if(!sessionStorage.getItem('lxwis-brat-test-initialized')){
   localStorage.removeItem('brat-color-presets-v1');
   localStorage.removeItem('brat-minimal-v2');
   localStorage.setItem('brat-ui-theme','light');
   sessionStorage.setItem('lxwis-brat-test-initialized','1');
  }
 }catch(e){}
};
const androidUserAgent='Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
async function boot(browser,base,width,theme='light',mobile=false){
 const context=await browser.newContext({
  viewport:{width,height:width<=420?844:900},isMobile:mobile,hasTouch:mobile,
  deviceScaleFactor:mobile?2:1,
  ...(mobile?{userAgent:androidUserAgent}:{}),
  reducedMotion:'reduce'
 });
 await context.addInitScript(prepare);
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
 const response=await page.goto(base+'/brat',{waitUntil:'domcontentloaded'});
 assert.equal(response.status(),200);
 await page.waitForTimeout(180);
 if(theme==='dark')await page.locator('#themeToggle').click();
 return {page,context,errors};
}
async function checks(page,width,label){
 const props=await page.evaluate(()=>{
  const bounds=(sel)=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const border=(sel)=>getComputedStyle(document.querySelector(sel)).borderTopWidth;
  return {
   vw:document.documentElement.clientWidth,sw:document.documentElement.scrollWidth,
   brand:bounds('.brat-brand'),actions:bounds('.header-actions'),
   route:bounds('.brat-route-menu>summary'),save:bounds('#saveColors'),
   heading:bounds('.color-group-label'),textarea:bounds('#mainText'),
   textField:bounds('.text-field'),bg:bounds('.color-option'),
   bgEntry:bounds('.color-entry'),colors:bounds('.color-pickers'),
   panel:bounds('.editor-panel'),swatches:bounds('.swatches'),
   optionBorder:border('.color-option'),labelBorder:border('.color-option>label'),entryBorder:border('.color-entry'),
   preview:bounds('#art'),logo:bounds('.brat-brand .logo'),
   menuInHeader:!!document.querySelector('.header-actions>.brat-route-menu'),
   menuNotByLogo:!document.querySelector('.brat-brand>.brat-route-menu'),
   iconCount:document.querySelectorAll('.brat-route-menu .lx-icon svg').length,
   paletteInitiallyHidden:document.querySelector('#bratSavedPalette').hidden,
   colorFieldCount:document.querySelectorAll('.color-option').length,
   presetCount:document.querySelectorAll('.swatches .swatch').length
  };
 });
 assert.ok(props.sw<=props.vw+2,'Horizontal overflow '+label+': '+JSON.stringify(props));
 assert.ok(props.brand.right+5<=props.actions.x,'BRAT header components overlap '+label+': '+JSON.stringify(props));
 assert.ok(props.route.width<=42&&props.route.height<=42&&props.route.x>=0&&props.route.right<=width,'Menu not compact '+label+': '+JSON.stringify(props));
 assert.ok(props.menuInHeader&&props.menuNotByLogo,'Menu placement wrong '+label);
 assert.equal(props.iconCount,1,'Professional menu icon missing '+label);
 assert.ok(props.heading&&props.save&&Math.abs(props.heading.y-props.save.y)<16,'Save colors not on same row as heading '+label+': '+JSON.stringify(props));
 assert.ok(props.textarea.height<=80&&props.textField.height<=102,'Text editor too tall '+label);
 assert.equal(props.optionBorder,'0px','Color field has redundant outer box '+label);
 assert.equal(props.labelBorder,'0px','Color field label still looks like an input '+label);
 assert.equal(props.entryBorder,'1px','Compact input border missing '+label);
 assert.ok(props.bgEntry.height<=50,'Color input oversized '+label);
 assert.equal(props.colorFieldCount,2,'Color controls missing '+label);
 assert.equal(props.presetCount,5,'Color presets missing '+label);
 assert.ok(props.paletteInitiallyHidden,'Empty saved palettes row occupies space '+label);
 assert.ok(props.preview.width>150&&props.preview.height>150,'Artwork preview missing '+label);
 await page.locator('.brat-route-menu summary').click();
 assert.ok(await page.locator('.brat-route-menu').evaluate(el=>el.open),'Menu did not open '+label);
 const menu=await page.locator('.brat-route-menu>nav').boundingBox();
 assert.ok(menu&&menu.x>=0&&menu.x+menu.width<=width+2,'Menu off-screen '+label+': '+JSON.stringify(menu));
 assert.equal(await page.locator('.brat-route-menu>nav a').count(),5,'Menu lost page links '+label);
 assert.ok(menu.width<=182&&menu.height<=230,'Mobile menu is too large '+label+': '+JSON.stringify(menu));
 const order=await page.evaluate(()=>{
  const actions=document.querySelector('.header-actions');
  return actions?.lastElementChild?.matches('.brat-route-menu')||false;
 });
 assert.ok(order,'Overflow menu should appear at trailing edge '+label);
 await page.keyboard.press('Escape');
 assert.ok(!await page.locator('.brat-route-menu').evaluate(el=>el.open),'Escape did not close menu '+label);
 await page.screenshot({path:path.join(artifact,'brat-'+label+'.png'),animations:'disabled'});
 await page.locator('.color-pickers').scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(artifact,'brat-colors-'+label+'.png'),animations:'disabled'});
 console.log('PASS layout '+label+' | '+JSON.stringify({viewport:props.vw,menu:props.route.width,textarea:props.textarea.height,field:props.bgEntry.height,preview:props.preview.width}));
}
async function interactions(page){
 const swatches=page.locator('.swatches button.swatch');
 await swatches.nth(1).click();
 assert.equal((await page.locator('#bgHex').inputValue()).toUpperCase(),'#F1A6C9');
 await page.locator('#bgHex').fill('#225588');
 await page.locator('#bgHex').press('Tab');
 await page.waitForTimeout(60);
 assert.equal((await page.locator('#bgColor').inputValue()).toLowerCase(),'#225588');
 await page.locator('#saveColors').click();
 assert.ok(await page.locator('#toast .brat-dialog-done').isVisible(),'Save feedback missing');
 await page.locator('#toast .brat-dialog-done').click();
 await page.waitForTimeout(280);
 assert.equal(await page.locator('#bratPaletteList .brat-palette-apply').count(),1,'Custom palette failed to save');
 assert.ok(await page.locator('#bratSavedPalette').isVisible(),'Saved row not visible');
 await swatches.nth(0).click();
 await page.locator('#bratPaletteList .brat-palette-apply').click();
 assert.equal((await page.locator('#bgHex').inputValue()).toUpperCase(),'#225588','Saved palette failed to apply');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForTimeout(140);
 assert.equal(await page.locator('#bratPaletteList .brat-palette-apply').count(),1,'Palette did not persist across reload');
 await page.locator('#bratPaletteList .brat-palette-remove').click();
 assert.equal(await page.locator('#bratPaletteList .brat-palette-apply').count(),0,'Saved palette did not remove');
 assert.ok(await page.locator('#bratSavedPalette').isHidden(),'Empty row visible after remove');
 await page.locator('#mainText').fill('test editor');
 await page.waitForTimeout(100);
 assert.ok((await page.locator('#artText').innerText()).includes('test editor'),'Text editor not linked to artwork');
 await page.locator('#downloadTop').click();
 assert.ok(await page.locator('.brat-export-dialog').isVisible(),'Export dialog regression');
 await page.keyboard.press('Escape');
 await page.locator('.brat-export-dialog').waitFor({state:'hidden',timeout:1400});
 assert.ok(await page.locator('.brat-export-dialog').isHidden(),'Export dialog did not dismiss');
 console.log('PASS interactions | palettes, HEX fields, persistence, text and export');
}
async function audit(page,label){
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 const failures=results.violations.filter(x=>['critical','serious'].includes(x.impact));
 if(failures.length)console.log('AXE FAIL '+label,JSON.stringify(failures.map(x=>({id:x.id,nodes:x.nodes.map(y=>y.target)}))));
 assert.deepEqual(failures.map(x=>x.id),[],'Accessibility failures '+label);
 console.log('PASS axe '+label);
}
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [320,360,390,412,768,1280]){
   for(const theme of ['light','dark']){
    const mobile=width<=412;
    const {page,context,errors}=await boot(browser,base,width,theme,mobile);
    try{
     const label=width+'-'+theme;
     await checks(page,width,label);
     if(width===390){
      await interactions(page);
      await audit(page,label);
     }
     assert.deepEqual(errors,[],'Uncaught JS errors '+label);
    }finally{await context.close()}
   }
  }
  // Installed APK must not expose web-only route menu.
  const {page,context}=await boot(browser,base,390,'light',true);
  await page.evaluate(()=>document.documentElement.classList.add('capacitor-app'));
  assert.ok(await page.locator('.brat-route-menu').isHidden(),'Android app still shows web-only site menu');
  await context.close();
  console.log('PASS installed-app UI simulation | site menu hidden');
  console.log('PASS BRAT fidelity | 12 viewport/theme combinations, interactions, accessibility, Android app mode');
 }finally{await browser.close();server.close()}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
