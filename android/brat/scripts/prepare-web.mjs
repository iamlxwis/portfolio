import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const source=resolve(root,'main/brat'),dest=resolve(root,'android/brat/www');
await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});await cp(source,dest,{recursive:true});
for(const name of ['privacy.css','privacy.js','legal.css','site.css','site.js'])await cp(resolve(root,'main/assets/shared',name),resolve(dest,name));
for(const name of ['privacy.html','cookies.html','terms.html'])await cp(resolve(root,'main/legal',name),resolve(dest,name));
const file=resolve(dest,'index.html');let html=await readFile(file,'utf8');
html=html.replaceAll(/(href|src)="\/brat\//g,'$1="./');
html=html.replaceAll(/(href|src)="\/(privacy\.css|privacy\.js)/g,'$1="./$2');
html=html.replaceAll(/(href|src)="\/assets\/shared\/(site\.css|site\.js)/g,'$1="./$2');
html=html.replace(/<a href="\/" class="logo">brat\.<\/a>/,'<span class="logo" aria-label="BRAT editor">brat.</span>');
for(const name of ['privacy.html','cookies.html','terms.html']){
 const path=resolve(dest,name);let page=await readFile(path,'utf8');
 page=page.replaceAll(/(href|src)="\/(legal\.css|privacy\.css|privacy\.js)/g,'$1="./$2').replaceAll('href="/"','href="./index.html"');
 page=page.replaceAll(/(href|src)="\/assets\/shared\/(site\.css|site\.js)/g,'$1="./$2');
 for(const policy of ['privacy','cookies','terms'])page=page.replaceAll('href="/'+policy+'"','href="./'+policy+'.html"');
 await writeFile(path,page);
}
// Keep the same non-floating legal/credit footer as the website, inside editor controls.
const widget=resolve(dest,'privacy.js');let js=await readFile(widget,'utf8');
js=js.replaceAll('href="/privacy"','href="./privacy.html"').replaceAll('href="/cookies"','href="./cookies.html"').replaceAll('href="/terms"','href="./terms.html"');
await writeFile(widget,js);
// One native-only startup overlay, with a short animation and guaranteed timeout.
html=html.replace(/<head>/, `<head><meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'">`);
html=html.replace(/<body([^>]*)>/i, match=>match+'<div id="brat-startup" role="status" aria-label="Loading BRAT" style="position:fixed;inset:0;z-index:2147483647;background:#8ace00;color:#141414;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 64px Arial,sans-serif;transition:opacity .28s ease"><span id="brat-startup-word" style="animation:bratEnter .55s cubic-bezier(.2,.8,.2,1) both">brat</span><span style="position:absolute;bottom:12%;width:48px;height:3px;background:#14141433;overflow:hidden;border-radius:4px"><span style="display:block;width:40%;height:100%;background:#141414;animation:bratLoad .8s ease-in-out infinite alternate"></span></span></div>');
html=html.replace('</head>','<style>@keyframes bratEnter{from{opacity:0;transform:translateY(12px) scale(.94)}to{opacity:1;transform:none}}@keyframes bratLoad{from{transform:translateX(-100%)}to{transform:translateX(250%)}}</style><script src="./startup.js" defer></script></head>');
await writeFile(resolve(dest,'startup.js'),`(() => {
  let closing = false;
  function dismiss() {
    if (closing) return;
    closing = true;
    for (const id of ['brat-startup','native-startup']) {
      const overlay = document.getElementById(id);
      if (!overlay) continue;
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => overlay.remove(), 320);
    }
  }
  // Never block the editor waiting for an image, font, or network load event.
  const ready = () => setTimeout(dismiss, 550);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
  window.addEventListener('load', ready, {once:true});
  setTimeout(dismiss, 2200);
})();`);
// Native-only refinements: the logo does not reload the editor.
html=html.replace('</head>','<style>html,body{overscroll-behavior:none}.logo{cursor:default}.editor-panel>summary,.settings-panel>summary{transition:background-color .18s ease}.editor-panel>summary:active,.settings-panel>summary:active{background-color:var(--line)}.editor-panel .panel-content{animation:bratPanelIn .18s ease-out}@keyframes bratPanelIn{from{opacity:.5;transform:translateY(-5px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.editor-panel .panel-content{animation:none}}</style></head>');
await writeFile(file,html);
console.log('Offline BRAT web assets copied to android/brat/www');
