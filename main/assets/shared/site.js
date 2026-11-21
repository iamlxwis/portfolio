/* lxwis icons & navigation. Local inline SVG, Lucide-style ISC shapes; no network dependency. */
(()=>{
'use strict';
const P={
'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',
'arrow-right':'<path d="M5 12h14m-7-7 7 7-7 7"/>',
'arrow-left':'<path d="m12 19-7-7 7-7m7 7H5"/>',
'chevron-down':'<path d="m6 9 6 6 6-6"/>',
'chevron-left':'<path d="m15 18-6-6 6-6"/>',
'chevron-right':'<path d="m9 18 6-6-6-6"/>',
'home':'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
'grid-2x2':'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>',
'terminal':'<path d="m4 17 6-6-6-6m8 12h8"/>',
'download':'<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',
'heart':'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
'bookmark':'<path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4Z"/>',
'image':'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
'check':'<path d="m20 6-11 11-5-5"/>',
'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
'x':'<path d="M18 6 6 18M6 6l12 12"/>',
'refresh-cw':'<path d="M20 11a8 8 0 0 0-14-5L4 8m0-4v4h4M4 13a8 8 0 0 0 14 5l2-2m-4 0h4v4"/>',
'loader-circle':'<path d="M21 12a9 9 0 1 1-9-9"/>',
'info':'<circle cx="12" cy="12" r="10"/><path d="M12 11v5m0-8h.01"/>',
'sliders-horizontal':'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',
'book-open':'<path d="M12 7v14M3 18V4c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1Z"/>',
'file-text':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
'shield-check':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
'cookie':'<path d="M20 12a8 8 0 1 1-8-8 4 4 0 0 0 4 4 4 4 0 0 0 4 4Z"/><path d="M8.5 9h.01M12 16h.01M8 16h.01"/>',
'share-2':'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/>',
'maximize':'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
'pause':'<path d="M10 5v14m5-14v14"/>',
'play':'<path d="m8 5 11 7-11 7Z"/>',
'calendar':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
'copy':'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
'search':'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
'trash-2':'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m5 4v7m4-7v7"/>'
};
function mount(root=document){
 for(const span of root.querySelectorAll('[data-lx-icon]')){
  if(span.dataset.lxMounted==='1')continue;
  const name=span.dataset.lxIcon;
  if(!Object.prototype.hasOwnProperty.call(P,name))continue;
  span.classList.add('lx-icon');span.setAttribute('aria-hidden','true');
  span.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+P[name]+'</svg>';
  span.dataset.lxMounted='1';
 }
}
window.LXIcons=Object.freeze({mount});
function init(){
 mount();
 for(const details of document.querySelectorAll('.lx-route-menu')){
  details.addEventListener('keydown',e=>{if(e.key==='Escape'){details.open=false;details.querySelector('summary')?.focus()}});
  details.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>details.open=false));
  document.addEventListener('pointerdown',e=>{if(details.open&&!details.contains(e.target))details.open=false},{passive:true});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
