/* One gallery engine for Meow and Arf. No obfuscated code or framework. */
(()=>{
'use strict';
const kind=document.body.dataset.gallery;
if(!['cat','dog'].includes(kind))return;
const cat=kind==='cat',type=cat?'cat':'dog',plural=cat?'cats':'dogs';
const key='lxwis:'+ (cat?'meow':'arf') +':favorites';
const $=id=>document.getElementById(id);
const grid=$('grid'),status=$('galleryStatus'),count=$('statText'),start=$('startBtn'),more=$('loadMoreBtn'),saved=$('favToggleBtn'),browser=$('gallerySection'),hero=$('hero'),modal=$('lightbox'),photo=$('lbImg'),counter=$('lbCounter'),fav=$('lbFavorite'),download=$('lbDownload'),share=$('lbShare'),prev=$('lbPrev'),next=$('lbNext'),close=$('lbClose'),notice=$('galleryNotice');
const isReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let items=[],favorites=[],mode='browse',current=-1,active=[],busy=false,initiated=false,returnFocus=null,noticeTimer=0;
try{const value=JSON.parse(localStorage.getItem(key));favorites=Array.isArray(value)?value.filter(v=>typeof v==='string').slice(0,250):[]}catch{}
const icon=n=>'<span data-lx-icon="'+n+'"></span>';
function refreshIcons(root=document){window.LXIcons?.mount(root)}
function say(message){status.textContent=message}
function inform(message){
 notice.textContent=message;notice.classList.add('is-visible');clearTimeout(noticeTimer);
 noticeTimer=setTimeout(()=>{notice.classList.remove('is-visible')},2500);
}
function persist(){
 try{localStorage.setItem(key,JSON.stringify(favorites));return true}
 catch{inform('Storage unavailable');return false}
}
function countUpdate(){
 const shown=mode==='saved'?favorites.length:items.length;
 count.textContent=shown+' '+(mode==='saved'?'saved':plural);
 saved.setAttribute('aria-pressed',String(mode==='saved'));
 saved.innerHTML=icon('bookmark')+(mode==='saved'?' All photos':' Saved ('+favorites.length+')');
 refreshIcons(saved);
 more.hidden=mode==='saved';
}
function empty(message,action){
 grid.replaceChildren();
 const container=document.createElement('div');container.className='lx-gallery-empty';
 container.textContent=message;
 if(action){
  const btn=document.createElement('button');btn.className='lx-btn lx-btn--ghost';btn.textContent=action.label;btn.addEventListener('click',action.fn);
  container.append(btn);
 }
 grid.append(container);
}
function list(){return mode==='saved'?favorites.slice():items.slice()}
function render(){
 const urls=list();countUpdate();grid.replaceChildren();
 if(!urls.length){
  empty(mode==='saved'?'No saved photos yet.':'No photos available.',mode==='saved'?{label:'All photos',fn:()=>setMode('browse')}:null);
  return;
 }
 const frag=document.createDocumentFragment();
 urls.forEach((url,index)=>{
  const tile=document.createElement('button');tile.className='lx-gallery-tile';tile.type='button';
  tile.setAttribute('aria-label','Open '+type+' photo '+(index+1));
  const img=document.createElement('img');img.src=url;img.alt=type+' photo '+(index+1);img.loading=index<4?'eager':'lazy';img.decoding='async';
  img.addEventListener('load',()=>tile.classList.add('is-loaded'),{once:true});
  img.addEventListener('error',()=>tile.classList.add('is-error'),{once:true});
  const label=document.createElement('span');label.className='lx-tile-label';label.innerHTML='<span>'+(index+1).toString().padStart(2,'0')+'</span>'+icon('arrow-up-right');
  tile.append(img,label);tile.addEventListener('click',()=>open(url,tile));frag.append(tile);
 });
 grid.append(frag);refreshIcons(grid);
}
function setMode(value){
 mode=value;render();say(mode==='saved'?'Saved photos':'Browse '+plural);
}
function showBusy(value){
 busy=value;more.disabled=value;start.disabled=value;
 more.innerHTML=value?icon('loader-circle')+' Loading':icon('refresh-cw')+' Load more';
 start.innerHTML=value?icon('loader-circle')+' Loading':icon('grid-2x2')+' Browse '+plural;
 refreshIcons(more);refreshIcons(start);
}
function fetchJSON(url,timeout=12000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
 return fetch(url,{signal:controller.signal}).then(async response=>{
  if(!response.ok)throw new Error('Service returned '+response.status);
  return response.json();
 }).finally(()=>clearTimeout(timer));
}
async function catURL(){
 const data=await fetchJSON('https://cataas.com/cat?json=true');
 const raw=data.url||data._id||data.id;
 if(!raw)throw Error('Cat photo unavailable');
 const url=new URL(String(raw).includes('/')?raw:'/cat/'+raw,'https://cataas.com');
 if(url.protocol!=='https:'||url.hostname!=='cataas.com')throw Error('Unexpected image host');
 return url.href;
}
async function dogURLs(){
 const data=await fetchJSON('https://dog.ceo/api/breeds/image/random/12');
 if(data.status!=='success'||!Array.isArray(data.message))throw Error('Dog photos unavailable');
 return data.message.filter(value=>{
  try{const url=new URL(value);return url.protocol==='https:'&&url.hostname.endsWith('dog.ceo')}catch{return false}
 });
}
async function load(){
 if(busy)return;
 showBusy(true);initiated=true;browser.hidden=false;hero.classList.add('is-compact');
 say('Loading '+plural+'…');
 const countBefore=items.length;
 // Placeholders reserve space and prevent the grid shifting as images arrive.
 if(mode!=='saved'){for(let i=0;i<8;i++){const sk=document.createElement('div');sk.className='lx-gallery-skeleton';sk.setAttribute('aria-hidden','true');grid.append(sk)}}
 try{
  let urls=[];
  if(cat){
   // Four concurrent metadata requests, not 30 simultaneous network connections.
   const amount=12;
   let cursor=0;
   const tasks=Array.from({length:4},async()=>{
    while(cursor<amount){
     cursor++;try{const url=await catURL();if(!items.includes(url))urls.push(url)}catch{}
    }
   });
   await Promise.all(tasks);
  }else urls=await dogURLs();
  if(!urls.length)throw Error('No photos returned');
  items.push(...urls.filter(url=>!items.includes(url)));
  if(mode==='browse')render();else countUpdate();
  say(items.length+' '+plural+' loaded');
 }catch(error){
  if(mode==='browse')render();
  say('Could not load photos. Check your connection and try again.');
  if(!items.length&&mode==='browse')empty('Unable to load photos.',{label:'Try again',fn:load});
 }finally{
  showBusy(false);
  if(items.length===countBefore)countUpdate();
 }
}
function updateFavorite(){
 if(current<0)return;
 const isSaved=favorites.includes(active[current]);
 fav.setAttribute('aria-pressed',String(isSaved));
 fav.innerHTML=icon('bookmark')+(isSaved?' Saved':' Save');
 refreshIcons(fav);
}
function showPhoto(){
 const url=active[current];if(!url)return;
 photo.src=url;photo.alt=type+' photo '+(current+1)+' of '+active.length;
 counter.textContent=(current+1).toString().padStart(2,'0')+' / '+active.length.toString().padStart(2,'0');
 updateFavorite();
}
function open(url,trigger){
 returnFocus=trigger;active=list();current=active.indexOf(url);if(current<0)return;
 modal.hidden=false;document.body.classList.add('lx-lightbox-open');
 showPhoto();close.focus({preventScroll:true});
}
function dismiss(){
 if(modal.hidden)return;
 modal.hidden=true;document.body.classList.remove('lx-lightbox-open');photo.removeAttribute('src');
 returnFocus?.focus?.({preventScroll:true});current=-1;
}
function step(dir){if(modal.hidden||!active.length)return;current=(current+dir+active.length)%active.length;showPhoto()}
function toggleFavorite(){
 if(current<0)return;const url=active[current],index=favorites.indexOf(url);
 if(index<0){favorites.unshift(url);if(favorites.length>250)favorites.pop()}
 else favorites.splice(index,1);
 persist();updateFavorite();countUpdate();if(mode==='saved')render();inform(index<0?'Saved':'Removed from saved');
}
async function savePhoto(){
 if(current<0)return;
 const url=active[current];download.disabled=true;
 download.innerHTML=icon('loader-circle')+' Saving';refreshIcons(download);
 try{
  const res=await fetch(url);
  if(!res.ok)throw Error('Download unavailable');
  const blob=await res.blob();
  const extension=blob.type.includes('png')?'png':blob.type.includes('webp')?'webp':'jpg';
  const local=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=local;link.download='lxwis-'+type+'-'+Date.now()+'.'+extension;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(local),30000);
  inform('Download started');
 }catch{
  window.open(url,'_blank','noopener,noreferrer');
  inform('Image opened in a new tab');
 }finally{
  download.disabled=false;download.innerHTML=icon('download')+' Download';refreshIcons(download)
 }
}
async function sharePhoto(){
 if(current<0)return;
 const url=active[current];
 try{
  if(navigator.share){await navigator.share({title:cat?'Meow':'Arf',url});return}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);inform('Link copied');return}
  window.open(url,'_blank','noopener,noreferrer');
 }catch(error){if(error.name!=='AbortError')inform('Sharing unavailable')}
}
function trap(event){
 if(event.key==='Escape'){event.preventDefault();dismiss();return}
 if(event.key==='ArrowRight'){event.preventDefault();step(1);return}
 if(event.key==='ArrowLeft'){event.preventDefault();step(-1);return}
 if(event.key==='Tab'){
  const visible=[...modal.querySelectorAll('button:not(:disabled)')].filter(el=>el.getClientRects().length);
  if(!visible.length)return;
  const first=visible[0],last=visible[visible.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 }
}
let startX=0,startY=0;
modal.addEventListener('touchstart',e=>{if(e.touches.length===1){startX=e.touches[0].clientX;startY=e.touches[0].clientY}},{passive:true});
modal.addEventListener('touchend',e=>{
 if(!e.changedTouches.length)return;
 const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;
 if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.4)step(dx<0?1:-1);
},{passive:true});
modal.addEventListener('keydown',trap);
modal.addEventListener('click',e=>{if(e.target===modal)dismiss()});
close.addEventListener('click',dismiss);prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
fav.addEventListener('click',toggleFavorite);download.addEventListener('click',savePhoto);share.addEventListener('click',sharePhoto);
start.addEventListener('click',load);more.addEventListener('click',load);
saved.addEventListener('click',()=>setMode(mode==='saved'?'browse':'saved'));
countUpdate();
})();
