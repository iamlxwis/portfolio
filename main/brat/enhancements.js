'use strict';
/* BRAT Studio enhancements — browser-first, no third-party runtime. */
(()=>{
 const $=id=>document.getElementById(id);
 const native=()=>!!window.Capacitor?.isNativePlatform?.();
 const clone=v=>({...v});
 const history=[clone(state)];let position=0,restoring=false,saveTimer=0,lastVibration=0;
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(state))}catch(e){console.warn('Draft storage unavailable',e)}};
 // Debounce large photo drafts instead of serializing on every slider frame.
 save=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(persist,250)};
 window.addEventListener('pagehide',persist);
 const originalUpdate=update;
 update=function(p){
  const before=JSON.stringify(state);
  originalUpdate(p);
  if(restoring||JSON.stringify(state)===before)return;
  const snapshot=clone(state);
  // Slider/text changes coalesce into one history step while dragging/typing.
  const now=Date.now(),continuous=['text','blur','grain','fontScale','lineHeight','bg','fg'].some(k=>Object.hasOwn(p,k));
  if(continuous&&now-(update.lastAt||0)<550&&position>0){history[position]=snapshot}
  else{history.splice(position+1);history.push(snapshot);position++;if(history.length>70){history.shift();position--}}
  update.lastAt=now;
  refreshHistory();
 };
 function restore(next){
  if(next<0||next>=history.length)return;
  restoring=true;position=next;state=clone(history[position]);photo=null;sync();loadPhoto();schedule();save();restoring=false;refreshHistory();
 }
 const actions=document.createElement('div');actions.className='brat-quick-actions';
 function button(label,icon,handler){const b=document.createElement('button');b.type='button';b.className='brat-quick-button';b.setAttribute('aria-label',label);b.title=label;b.append(premiumIcon(icon,19));b.addEventListener('click',handler);return b}
 iconPaths.undo='<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2"/>';
 iconPaths.redo='<path d="m15 14 5-5-5-5m5 5H10a6 6 0 0 0 0 12h2"/>';
 iconPaths.expand='<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>';
 iconPaths.gallery='<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/>';
 iconPaths.bookmark='<path d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18l-7-4-7 4Z"/>';
 iconPaths.share='<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4"/>';
 iconPaths.close='<path d="M18 6 6 18M6 6l12 12"/>';
 const undo=button('Undo','undo',()=>restore(position-1)),redo=button('Redo','redo',()=>restore(position+1));
 actions.append(undo,redo);
 function refreshHistory(){undo.disabled=position===0;redo.disabled=position===history.length-1}
 refreshHistory();
 const artArea=document.querySelector('.art-area'),control=document.querySelector('.controls-inner');
 if(!artArea||!control)return;
 artArea.append(actions);
 document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const el=e.target;if(el?.matches?.('textarea,input,[contenteditable]'))return;if(e.key.toLowerCase()==='z'){e.preventDefault();restore(position+(e.shiftKey?1:-1))}else if(e.key.toLowerCase()==='y'){e.preventDefault();restore(position+1)}});
 // Fullscreen uses a scaled snapshot of the live preview; original DOM remains intact.
 const preview=document.createElement('div');preview.className='brat-fullscreen';preview.hidden=true;preview.setAttribute('role','dialog');preview.setAttribute('aria-modal','true');preview.setAttribute('aria-label','Fullscreen artwork preview');
 const close=button('Back to editor','close',()=>{preview.classList.remove('brat-fullscreen-visible');preview.hidden=true;document.body.classList.remove('brat-preview-open');fullscreenButton.focus()});close.classList.add('brat-fullscreen-close');close.append(document.createTextNode(' Back'));
 const stage=document.createElement('div');stage.className='brat-fullscreen-stage';preview.append(stage,close);document.body.append(preview);
 let zoom=1;
 let fullscreenCopy=null;
 function paintPreview(){
  if(preview.hidden)return;
  // Clone at the exact preview dimensions: text positions and font sizes are
  // measured in CSS pixels by fitText(), not the 1080px export resolution.
  const w=art.clientWidth,h=art.clientHeight;if(!w||!h)return;
  const factor=Math.min((stage.clientWidth-32)/w,(stage.clientHeight-110)/h);
  const copy=art.cloneNode(true);copy.removeAttribute('id');
  copy.querySelector('#artText')?.removeAttribute('id');
  copy.removeAttribute('tabindex');copy.removeAttribute('role');
  copy.classList.add('brat-fullscreen-art');
  copy.style.width=w+'px';copy.style.height=h+'px';
  copy.style.position='absolute';copy.style.left='50%';copy.style.top='50%';
  copy.style.transform='translate(-50%,-50%) scale('+(factor*zoom)+')';
  stage.replaceChildren(copy);fullscreenCopy=copy;
 }
 const fullscreenButton=button('Distraction-free preview','expand',()=>{zoom=1;preview.hidden=false;document.body.classList.add('brat-preview-open');requestAnimationFrame(()=>{paintPreview();preview.classList.add('brat-fullscreen-visible')});close.focus()});
 actions.append(fullscreenButton);
 preview.addEventListener('click',e=>{if(e.target===preview||e.target===stage)close.click()});
 preview.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.min(3,Math.max(1,zoom+(e.deltaY<0?.15:-.15)));paintPreview()},{passive:false});
 let pinch=0;preview.addEventListener('touchmove',e=>{if(e.touches.length!==2)return;e.preventDefault();const [a,b]=e.touches,d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(pinch)zoom=Math.max(1,Math.min(3,zoom*d/pinch));pinch=d;paintPreview()},{passive:false});preview.addEventListener('touchend',()=>pinch=0);
 window.addEventListener('resize',paintPreview);document.addEventListener('keydown',e=>{if(preview.hidden)return;if(e.key==='Escape')close.click();else if(e.key==='Tab'){e.preventDefault();close.focus()}});
 // Local saved-design library: small, bounded, and private to this device/browser.
 const galleryKey='brat-design-library-v1',colorsKey='brat-color-presets-v1';
 const read=(k)=>{try{const v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:[]}catch{return []}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){notify('storage full: remove an older saved design');return false}};
 const galleryButton=button('Saved designs','gallery',()=>openGallery());
 const saveDesign=button('Save design','bookmark',()=>{
  const designs=read(galleryKey);if(designs.length>=20){notify('gallery full: remove a saved design first');return}
  const title=(state.text||'Untitled').trim().slice(0,35)||'Untitled';
  designs.unshift({id:String(Date.now()),title,created:new Date().toISOString(),design:clone(state)});
  if(write(galleryKey,designs))notify('design saved to your gallery');
 });
 actions.append(galleryButton,saveDesign);
 const paletteBar=document.createElement('div');paletteBar.className='brat-custom-palette';
 const paletteSave=document.createElement('button');paletteSave.type='button';paletteSave.className='brat-palette-save';paletteSave.textContent='+ save colors';
 const paletteList=document.createElement('div');paletteList.className='brat-palette-list';paletteList.setAttribute('aria-label','Saved color combinations');
 paletteBar.append(paletteSave,paletteList);document.querySelector('.swatches')?.after(paletteBar);
 paletteSave.addEventListener('click',()=>{const colors=read(colorsKey);if(colors.some(c=>c.bg===state.bg&&c.fg===state.fg)){notify('colors already saved');return}if(colors.length>=12){notify('color presets full: remove one first');return}colors.push({bg:state.bg,fg:state.fg});if(write(colorsKey,colors)){renderColors();notify('color preset saved')}});
 function renderColors(){paletteList.replaceChildren();read(colorsKey).forEach((c,i)=>{const item=document.createElement('span');item.className='brat-palette-item';const apply=document.createElement('button');apply.type='button';apply.className='brat-palette-apply';apply.title='Apply saved colors';apply.setAttribute('aria-label','Apply saved color combination '+(i+1));apply.style.background='linear-gradient(135deg,'+c.bg+' 50%,'+c.fg+' 50%)';apply.addEventListener('click',()=>update({bg:c.bg,fg:c.fg}));const remove=document.createElement('button');remove.type='button';remove.className='brat-palette-remove';remove.setAttribute('aria-label','Remove saved colors '+(i+1));remove.textContent='×';remove.addEventListener('click',()=>{const list=read(colorsKey);list.splice(i,1);write(colorsKey,list);renderColors()});item.append(apply,remove);paletteList.append(item)})}
 renderColors();
 // Accessible modal with explicit controls and no untrusted HTML.
 const library=document.createElement('div');library.className='brat-library-overlay';library.hidden=true;
 const panel=document.createElement('section');panel.className='brat-library-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','brat-library-heading');
 const header=document.createElement('div');header.className='brat-library-header';
 const heading=document.createElement('h2');heading.id='brat-library-heading';heading.textContent='Saved designs';
 const exit=button('Close saved designs','close',()=>{library.hidden=true;galleryButton.focus()});header.append(heading,exit);
 const list=document.createElement('div');list.className='brat-library-list';panel.append(header,list);library.append(panel);document.body.append(library);
 function openGallery(){list.replaceChildren();const designs=read(galleryKey);if(!designs.length){const empty=document.createElement('p');empty.className='brat-library-empty';empty.textContent='No saved designs yet. Tap the bookmark button to save one.';list.append(empty)}
  designs.forEach((entry,i)=>{const row=document.createElement('div');row.className='brat-library-row';const swatch=document.createElement('span');swatch.className='brat-library-swatch';swatch.style.background=entry.design.bg;swatch.style.color=entry.design.fg;swatch.textContent=(entry.title||'brat').slice(0,12);const info=document.createElement('span');info.className='brat-library-info';const title=document.createElement('strong');title.textContent=entry.title||'Untitled';const date=document.createElement('small');date.textContent=new Date(entry.created).toLocaleDateString();info.append(title,date);const open=document.createElement('button');open.type='button';open.textContent='Open';open.addEventListener('click',()=>{history.splice(position+1);state={...defaults,...entry.design};history.push(clone(state));position=history.length-1;photo=null;sync();loadPhoto();schedule();save();refreshHistory();library.hidden=true;galleryButton.focus()});const remove=document.createElement('button');remove.type='button';remove.textContent='Delete';remove.setAttribute('aria-label','Delete '+(entry.title||'design'));remove.addEventListener('click',()=>{const d=read(galleryKey);d.splice(i,1);write(galleryKey,d);openGallery()});row.append(swatch,info,open,remove);list.append(row)});
  library.hidden=false;exit.focus()}
 library.addEventListener('click',e=>{if(e.target===library)exit.click()});document.addEventListener('keydown',e=>{if(library.hidden)return;if(e.key==='Escape')exit.click();else if(e.key==='Tab'){const focusable=[...panel.querySelectorAll('button:not(:disabled)')];if(!focusable.length)return;const i=focusable.indexOf(document.activeElement);e.preventDefault();focusable[(i+(e.shiftKey?-1:1)+focusable.length)%focusable.length].focus()}});
 // Native sharing uses a temporary cache file, not Gallery permission.
 const share=button('Share image','share',async()=>{
  try{
   const canvas=document.createElement('canvas');const [w,h]=sizes[state.size];canvas.width=w;canvas.height=h;
   const c=canvas.getContext('2d');c.fillStyle=state.bg;c.fillRect(0,0,w,h);
   if(photo){const scale=Math.max(w/photo.width,h/photo.height);c.drawImage(photo,(w-photo.width*scale)/2,(h-photo.height*scale)/2,photo.width*scale,photo.height*scale)}
   const rows=getRows(),sx=w/art.clientWidth,sy=h/art.clientHeight,computed=getComputedStyle(txt),size=parseFloat(computed.fontSize);
   c.fillStyle=state.fg;c.font=computed.fontWeight+' '+size*sy+'px '+computed.fontFamily;c.textBaseline='top';c.filter=state.blur?'blur('+state.blur+'px)':'none';
   if(state.mirror){c.translate(w,0);c.scale(-1,1)}
   for(const row of rows)for(const item of row.chars){if(item.ch.trim())c.fillText(item.ch,item.x*sx,(row.y+(parseFloat(computed.lineHeight)-size)*.28)*sy)}
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Image could not be created');
   if(native()){
    const plugins=window.Capacitor.Plugins;if(!plugins.Filesystem||!plugins.Share)throw Error('Sharing unavailable in this build');
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)});
    const name='brat-share-'+Date.now()+'.png';await plugins.Filesystem.writeFile({path:name,data,directory:'CACHE'});const uri=await plugins.Filesystem.getUri({path:name,directory:'CACHE'});await plugins.Share.share({title:'BRAT design',url:uri.uri,dialogTitle:'Share BRAT image'});
   }else if(navigator.canShare?.({files:[new File([blob],'brat.png',{type:'image/png'})]})){await navigator.share({files:[new File([blob],'brat.png',{type:'image/png'})],title:'BRAT design'})}
   else{notify('sharing not supported here: use Export instead')}
  }catch(e){if(e?.name!=='AbortError')notify('share failed: '+(e?.message||'try export instead'))}
 });actions.append(share);
 // Haptic ticks are rate-limited and only on Android, never on every paint.
 const haptics=window.Capacitor?.Plugins?.Haptics;
 document.querySelectorAll('input[type=range]').forEach(slider=>{
  slider.addEventListener('pointerup',()=>{if(!native()||!haptics||Date.now()-lastVibration<120)return;lastVibration=Date.now();haptics.impact({style:'LIGHT'}).catch(()=>{})});
  slider.addEventListener('dblclick',()=>{const map={blur:['blur',defaults.blur],grain:['grain',defaults.grain],sizeAdjust:['fontScale',defaults.fontScale],lineHeight:['lineHeight',defaults.lineHeight]};if(map[slider.id])update({[map[slider.id][0]]:map[slider.id][1]})});
 });
 // Fix reset history and keep the preview keyboard accessible.
 $('resetDesign')?.addEventListener('click',()=>{history.splice(position+1);history.push(clone(defaults));position=history.length-1;refreshHistory();persist()});
 art.setAttribute('tabindex','0');art.setAttribute('role','button');art.setAttribute('aria-label','Artwork preview, activate for fullscreen');art.addEventListener('click',()=>fullscreenButton.click());art.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fullscreenButton.click()}});
 let hasDraft=false;try{hasDraft=!!localStorage.getItem(key)}catch{}
 if(hasDraft)setTimeout(()=>{const indicator=document.createElement('span');indicator.className='brat-draft-restored';indicator.textContent='Draft restored';indicator.setAttribute('role','status');actions.append(indicator);setTimeout(()=>indicator.remove(),2200)},350);
})();
