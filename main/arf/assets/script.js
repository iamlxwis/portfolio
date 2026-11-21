(function(){var _S=["bHh3aXM6YXJmOmZhdm9yaXRlcw==","YnJvd3Nl","Z3JpZA==","c3RhdFRleHQ=","bG9hZE1vcmVCdG4=","ZmF2VG9nZ2xlQnRu","bGlnaHRib3g=","bGJJbWc=","bGJDb3VudGVy","bGJEb3dubG9hZA==","bGJGYXZvcml0ZQ==","bGJQcmV2","bGJOZXh0","IGRvZ3MgbG9hZGVk","IGZhdm9yaXRlcyBzYXZlZA==","U2F2ZWQgKA==","4oaQIEJhY2sgdG8gYnJvd3Npbmc=","Z3JpZC1pdGVt","ZG9n","bGF6eQ==","b3ZlcmxheQ==","PHNwYW4gY2xhc3M9Im92ZXJsYXktbGFiZWwiPk9wZW4gZnVsbCDihpI8L3NwYW4+","Y2xpY2s=","PHAgY2xhc3M9ImVtcHR5LW5vdGUiPk5vIGZhdm9yaXRlcyB5ZXQuIE9wZW4gYW55IGRvZyBhbmQgdGFwIHRoZSBoZWFydC48L3A+","PGRpdiBjbGFzcz0ic2tlbGV0b24iPjwvZGl2Pg==","aHR0cHM6Ly9kb2cuY2VvL2FwaS9icmVlZHMvaW1hZ2UvcmFuZG9t","LnNrZWxldG9u","U0FWRUQ=","U0FWRQ==","YWN0aXZl","b3Blbg==","U0FWSU5HLi4u","cG5n","anBn","bHh3aXMtZG9nLQ==","X2JsYW5r","4oaTIFNBVkUgSU1BR0U=","ZmF2b3JpdGVz","bGJDbG9zZQ==","a2V5ZG93bg==","RXNjYXBl","QXJyb3dSaWdodA==","QXJyb3dMZWZ0","dG91Y2hzdGFydA==","dG91Y2hlbmQ=","bm9uZQ==","aW5saW5lLWJsb2Nr","c3RhcnRCdG4=","aGVybw==","c3RhdHNCYXI=","ZmxleA==","Z2FsbGVyeQ==","dmlzaWJsZQ=="];function _D(n){return decodeURIComponent(escape(atob(_S[n])));}const _K = _D(0);let _m = _D(1);let _im = [];let _fv = [];try{_fv = JSON.parse(localStorage.getItem(_K))|| [];}catch{_fv = [];}let _al = _im;let _ci = -1;let _cu = '';const _B = 30;const _g = document.getElementById(_D(2));const _st = document.getElementById(_D(3));const _lm = document.getElementById(_D(4));const _ft = document.getElementById(_D(5));const _lb = document.getElementById(_D(6));const _li = document.getElementById(_D(7));const _lc = document.getElementById(_D(8));const _ld = document.getElementById(_D(9));const _lf = document.getElementById(_D(10));const _lp = document.getElementById(_D(11));const _ln = document.getElementById(_D(12));function _rs(){_st.innerHTML = _m === _D(1)? `<span class="stat-count">${_im.length}</span>${_D(13)}`:`<span class="stat-count">${_fv.length}</span>${_D(14)}`;}function _uf(){_ft.textContent = _m === _D(1)? `${_D(15)}${_fv.length})`:_D(16);}function _sf(){localStorage.setItem(_K,JSON.stringify(_fv));_uf();}function _mgi(url,onClick){const item = document.createElement('div');item.className = _D(17);item.style.opacity = '1';const img = document.createElement('img');img.src = url;img.alt = _D(18);img.loading = _D(19);const ov = document.createElement('div');ov.className = _D(20);ov.innerHTML = _D(21);item.appendChild(img);item.appendChild(ov);item.addEventListener(_D(22),onClick);return item;}function _rbg(){_g.innerHTML = '';_im.forEach((url,idx)=> _g.appendChild(_mgi(url,()=>{_al = _im;_ol(idx);})));}function _rfg(){_g.innerHTML = '';if(!_fv.length){_g.innerHTML = _D(23);return;}_fv.forEach((url,idx)=> _g.appendChild(_mgi(url,()=>{_al = _fv;_ol(idx);})));}function _ask(delay){const item = document.createElement('div');item.className = _D(17);item.style.animationDelay = delay + 's';item.innerHTML = _D(24);_g.appendChild(item);return item;}async function _fd(item){try{const res = await fetch(_D(25));if(!res.ok)throw new Error();const data = await res.json();const url = data.message;const idx = _im.length;_im.push(url);const img = document.createElement('img');img.alt = _D(18);img.src = url;img.loading = _D(19);const ov = document.createElement('div');ov.className = _D(20);ov.innerHTML = _D(21);item.querySelector(_D(26)).remove();item.appendChild(img);item.appendChild(ov);item.addEventListener(_D(22),()=>{_al = _im;_ol(idx);});_rs();}catch{item.remove();}}function _lbatch(){for(let i = 0;i < _B;i++){const item = _ask(i * 0.03);_fd(item);}}function _ulc(){_lc.textContent = `${_ci + 1} / ${_al.length}`;}function _ufi(){const isFav = _fv.includes(_cu);_lf.textContent = isFav ? _D(27):_D(28);_lf.classList.toggle(_D(29),isFav);}function _ol(idx){_ci = idx;_cu = _al[idx];_li.src = _cu;_ulc();_ufi();_lb.classList.add(_D(30));}function _cl(){_lb.classList.remove(_D(30));_li.src = '';_cu = '';}function _sn(){if(!_al.length)return;_ci =(_ci + 1)% _al.length;_cu = _al[_ci];_li.src = _cu;_ulc();_ufi();}function _sp(){if(!_al.length)return;_ci =(_ci - 1 + _al.length)% _al.length;_cu = _al[_ci];_li.src = _cu;_ulc();_ufi();}async function _dc(){if(!_cu)return;_ld.disabled = true;_ld.textContent = _D(31);try{const res = await fetch(_cu);const blob = await res.blob();const ext = blob.type.includes(_D(32))? _D(32):_D(33);const blobUrl = URL.createObjectURL(blob);const a = document.createElement('a');a.href = blobUrl;a.download = `${_D(34)}${Date.now()}.${ext}`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(blobUrl);}catch{window.open(_cu,_D(35));}finally{_ld.disabled = false;_ld.textContent = _D(36);}}function _tf(){if(!_cu)return;const i = _fv.indexOf(_cu);if(i === -1)_fv.push(_cu);else _fv.splice(i,1);_sf();_ufi();if(_m === _D(37))_rs();}_ld.addEventListener(_D(22),_dc);_lf.addEventListener(_D(22),_tf);_lp.addEventListener(_D(22),_sp);_ln.addEventListener(_D(22),_sn);document.getElementById(_D(38)).addEventListener(_D(22),_cl);_lb.addEventListener(_D(22),e =>{if(e.target === _lb)_cl();});document.addEventListener(_D(39),e =>{if(!_lb.classList.contains(_D(30)))return;if(e.key === _D(40))_cl();if(e.key === _D(41))_sn();if(e.key === _D(42))_sp();});let _tx = 0,_ty = 0;_lb.addEventListener(_D(43),e =>{const t = e.touches[0];_tx = t.clientX;_ty = t.clientY;},{passive:true});_lb.addEventListener(_D(44),e =>{const t = e.changedTouches[0];const dx = t.clientX - _tx;const dy = t.clientY - _ty;if(Math.abs(dy)> 60 && Math.abs(dy)> Math.abs(dx)){if(dy > 0)_cl();}else if(Math.abs(dx)> 50 && Math.abs(dx)> Math.abs(dy)){dx < 0 ? _sn():_sp();}},{passive:true});_ft.addEventListener(_D(22),()=>{if(_m === _D(1)){_m = _D(37);_lm.style.display = _D(45);_rfg();}else{_m = _D(1);_lm.style.display = _D(46);_rbg();}_rs();_uf();});document.getElementById(_D(47)).addEventListener(_D(22),()=>{document.getElementById(_D(48)).style.display = _D(45);document.getElementById(_D(49)).style.display = _D(50);document.getElementById(_D(51)).classList.add(_D(52));_lbatch();});_lm.addEventListener(_D(22),_lbatch);_uf();})();

(function(){
  var loader=document.getElementById('lx-page-loader');
  var banner=document.getElementById('lx-cookie-banner');
  if(!loader)return;
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

})();