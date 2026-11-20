(()=>{
'use strict';
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>{window.__lxPrivacyInit?.()}, {once:true});window.__lxPrivacyInit=init;return;}
init();
function init(){
if(document.getElementById('lx-privacy-widget'))return;
const key='lxwis-consent-v3';
const icon=(name)=>{const paths={
shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
cookie:'<path d="M20 12a8 8 0 1 1-8-8 4 4 0 0 0 4 4 4 4 0 0 0 4 4Z"/><path d="M8.5 9h.01M12 16h.01M8 16h.01"/>',
file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
settings:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',
chevron:'<path d="m6 9 6 6 6-6"/>',
close:'<path d="M18 6 6 18M6 6l12 12"/>'
};return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>'};
const root=document.createElement('div');root.id='lx-privacy-widget';
root.innerHTML='<nav class="lx-footer" aria-label="Legal and privacy"><button type="button" data-open="privacy">privacy</button><button type="button" data-open="cookies">cookies</button><button type="button" data-open="terms">terms</button><span>© '+new Date().getFullYear()+' lxwis</span><button type="button" data-open="settings">'+icon('settings')+' settings</button></nav>'+
'<div class="lx-overlay" hidden><section class="lx-panel" role="dialog" aria-modal="true" aria-labelledby="lx-consent-title">'+
'<div class="lx-panel-head"><div><span class="lx-eyebrow">lxwis.site</span><h2 id="lx-consent-title">your privacy.</h2></div><button type="button" class="lx-close" aria-label="Close privacy settings" data-close>'+icon('close')+'</button></div>'+
'<p class="lx-intro">the short version: we save some things in your browser. read what you want below.</p>'+
'<div class="lx-sections">'+
'<details data-section="privacy"><summary>'+icon('shield')+'<span>privacy policy<small>your data and uploads</small></span>'+icon('chevron')+'</summary><div class="lx-detail"><p>favorites, brat settings and designs, and your cookie choice can be saved in your browser. you can clear them in your browser settings.</p><p>our hosting provider may process your ip address, browser info, and visit times to run and protect the site.</p><p>some pages load fonts, images, or content from outside services like google fonts, github, and image hosts. they may receive request details under their own policies.</p><p>brat edits uploaded images in your browser. we don't intentionally send them to our server. exports and shares are up to you.</p></div></details>'+
'<details data-section="cookies"><summary>'+icon('cookie')+'<span>cookies & storage<small>what gets remembered</small></span>'+icon('chevron')+'</summary><div class="lx-detail"><p>we use local storage for your cookie choice, brat designs and settings, themes, and saved favorites. local storage is not the same as a cookie.</p><p>there are no optional ad or analytics trackers controlled by this notice right now. accepting does not turn on extra tracking.</p><p>third-party services may have their own cookies or storage. these controls cannot change that.</p></div></details>'+
'<details data-section="terms"><summary>'+icon('file')+'<span>terms & copyright<small>the basic rules</small></span>'+icon('chevron')+'</summary><div class="lx-detail"><p>use the site without abusing it or violating other people’s rights. keep backups of anything important; tools are provided as-is.</p><p>your original creations remain yours. make sure you have rights to any images or text you use.</p><p>© '+new Date().getFullYear()+' lxwis. original site content is reserved unless stated otherwise. third-party content belongs to its owners.</p></div></details>'+
'</div>'+
'<label class="lx-check"><input type="checkbox" data-read="privacy"><span>i’ve read the privacy and cookies info.</span></label><label class="lx-check"><input type="checkbox" data-read="terms"><span>i’ve read the terms.</span></label>'+
'<div class="lx-actions"><button type="button" data-choice="essential">essential only</button><button type="button" class="lx-accept" data-choice="accept" disabled>accept</button></div>'+
'<p class="lx-note">both choices currently save your preference only. no extra tracking is switched on.</p>'+
'</section></div>';
document.body.append(root);
const overlay=root.querySelector('.lx-overlay'),panel=root.querySelector('.lx-panel'),checks=[...root.querySelectorAll('[data-read]')],accept=root.querySelector('[data-choice="accept"]'),close=root.querySelector('[data-close]');
let lastFocus=null;
function getChoice(){try{return JSON.parse(localStorage.getItem(key))}catch{return null}}
function open(section){lastFocus=document.activeElement;overlay.hidden=false;root.querySelectorAll('details').forEach(d=>d.open=d.dataset.section===section);checks.forEach(c=>c.checked=false);accept.disabled=true;close.focus()}
function hide(){overlay.hidden=true;if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function choose(choice){try{localStorage.setItem(key,JSON.stringify({choice,version:2,at:new Date().toISOString()}))}catch{}hide()}
root.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));
checks.forEach(c=>c.addEventListener('change',()=>{accept.disabled=!checks.every(c=>c.checked)}));
root.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.choice==='accept'&&!checks.every(c=>c.checked))return;choose(b.dataset.choice)}));
close.addEventListener('click',hide);
overlay.addEventListener('click',e=>{if(e.target===overlay)hide()});
document.addEventListener('keydown',e=>{if(overlay.hidden)return;if(e.key==='Escape')hide();if(e.key==='Tab'){const items=[...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),summary')].filter(el=>el.getClientRects().length);if(!items.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
if(!getChoice())open('cookies');
}
})();