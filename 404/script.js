(function(){
  var loader=document.getElementById('lx-page-loader');
  var banner=document.getElementById('lx-cookie-banner');
  if(!loader||!banner)return;
  document.addEventListener('click',function(event){
    var link=event.target.closest&&event.target.closest('a[href]');
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(link.hasAttribute('download'))return;
    var target=(link.getAttribute('target')||'').toLowerCase();
    if(target&&target!=='_self')return;
    var href=link.getAttribute('href')||'';
    if(!href||href.charAt(0)==='#'||/^(mailto:|tel:|javascript:)/i.test(href))return;
    var destination;
    try{destination=new URL(link.href,window.location.href)}catch(e){return}
    if(destination.origin!==window.location.origin)return;
    if(destination.pathname===window.location.pathname&&destination.search===window.location.search&&destination.hash)return;
    if(event.defaultPrevented)return;
    loader.classList.add('is-active');
    loader.setAttribute('aria-hidden','false');
  });
  document.addEventListener('submit',function(event){
    if(event.defaultPrevented)return;
    var form=event.target;
    if(form&&form.getAttribute('target')==='_blank')return;
    loader.classList.add('is-active');
    loader.setAttribute('aria-hidden','false');
  });
  // Restore the page when returning with the browser Back/Forward buttons.
  window.addEventListener('pageshow',function(){
    loader.classList.remove('is-active');
    loader.setAttribute('aria-hidden','true');
  });
  window.addEventListener('pagehide',function(){
    // Keep the current page state clean if the browser caches this document.
    loader.classList.remove('is-active');
    loader.setAttribute('aria-hidden','true');
  });
  var saved=false;
  try{saved=window.localStorage.getItem('lxwis-privacy-note')==='seen'}catch(e){}
  if(!saved){window.setTimeout(function(){banner.classList.add('is-visible')},700)}
  banner.querySelectorAll('[data-lx-cookie]').forEach(function(button){
    button.addEventListener('click',function(){
      banner.classList.remove('is-visible');
      try{window.localStorage.setItem('lxwis-privacy-note','seen')}catch(e){}
    });
  });
})();