import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const source=resolve(root,'main/brat'),dest=resolve(root,'android/brat/www');
await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});await cp(source,dest,{recursive:true});
for(const name of ['privacy.css','privacy.js','legal.css','privacy.html','cookies.html','terms.html'])await cp(resolve(root,'main',name),resolve(dest,name));
const file=resolve(dest,'index.html');let html=await readFile(file,'utf8');
html=html.replaceAll(/(href|src)="\/brat\//g,'$1="./');
html=html.replaceAll(/(href|src)="\/(privacy\.css|privacy\.js)/g,'$1="./$2');
html=html.replaceAll('href="/"','href="./index.html"');
for(const name of ['privacy.html','cookies.html','terms.html']){
 const path=resolve(dest,name);let page=await readFile(path,'utf8');
 page=page.replaceAll(/(href|src)="\/(legal\.css|privacy\.css|privacy\.js)/g,'$1="./$2').replaceAll('href="/"','href="./index.html"');
 await writeFile(path,page);
}
const widget=resolve(dest,'privacy.js');let js=await readFile(widget,'utf8');
js=js.replaceAll('href="/privacy"','href="./privacy.html"').replaceAll('href="/cookies"','href="./cookies.html"').replaceAll('href="/terms"','href="./terms.html"');await writeFile(widget,js);
// Native-only startup overlay: visible while the offline editor initializes.
html=html.replace(/<body([^>]*)>/i, (match,attrs)=>match+'<div id="native-startup" aria-label="Loading BRAT" style="position:fixed;inset:0;z-index:2147483647;background:#8ace00;color:#141414;display:flex;align-items:center;justify-content:center;font:700 64px Arial,sans-serif">brat</div>');
html=html.replace('</body>','<script>window.addEventListener("load",()=>{setTimeout(()=>{const el=document.getElementById("native-startup");if(el)el.remove()},550)},{once:true});</script></body>');
html=html.replace(/<head>/,'<head><meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: blob:; img-src \'self\' data: blob:; style-src \'self\' \'unsafe-inline\'; script-src \'self\'; connect-src \'self\'">');
await writeFile(file,html);
console.log('Offline BRAT web assets copied to android/brat/www');
