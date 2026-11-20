'use strict';
const $=id=>document.getElementById(id),art=$('art'),txt=$('artText');
if(window.Capacitor?.isNativePlatform?.())document.documentElement.classList.add('capacitor-app');
const sizes={square:[1080,1080],portrait:[1080,1350],story:[1080,1920],landscape:[1920,1080]};
const palettes={classic:['#8ace00','#141414'],pink:['#f1a6c9','#ffffff'],white:['#f4f4f0','#141414'],blue:['#1766ef','#ffffff'],black:['#141414','#ffffff']};
const defaults={text:'brat',bg:'#8ace00',fg:'#141414',blur:1,grain:.35,mirror:false,size:'square',font:'Arial, Helvetica, sans-serif',fontScale:100,lineHeight:100,image:null};
const key='brat-minimal-v2';let state={...defaults},photo=null,raf=0,toastTimer;
function notify(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2000)}
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function update(p){state={...state,...p};save();sync();schedule()}
function sync(){for(const [id,v] of [['mainText',state.text],['bgColor',state.bg],['textColor',state.fg],['blur',state.blur],['grain',state.grain],['canvasSize',state.size],['fontFamily',state.font],['sizeAdjust',state.fontScale],['lineHeight',state.lineHeight]])$(id).value=v;document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',palettes[b.dataset.palette].join('|')===[state.bg,state.fg].join('|')));for(const [id,value] of [['blur',Math.max(1,Math.round(state.blur/5*100))],['grain',Math.max(1,Math.round(state.grain/35*100))],['sizeAdjust',state.fontScale],['lineHeight',state.lineHeight]])$(id+'Value').value=Math.max(1,Math.min(100,value));$('mirrorToggle').setAttribute('aria-pressed',String(!!state.mirror));$('mirrorToggle').querySelector('span').textContent=state.mirror?'on':'off';syncHex();document.querySelectorAll('.select-display').forEach(b=>{const sel=$(b.dataset.select);b.querySelector('span').textContent=sel.options[sel.selectedIndex]?.textContent||''})}
function validHex(v){const raw=v.trim().replace(/^#/,'');return /^[0-9a-f]{6}$/i.test(raw)?'#'+raw.toLowerCase():/^[0-9a-f]{3}$/i.test(raw)?'#'+raw.split('').map(c=>c+c).join('').toLowerCase():null}
function syncHex(){for(const [id,color] of [['bgHex',state.bg],['textHex',state.fg]]){if(document.activeElement!==$(id))$(id).value=color.toUpperCase()}}
function schedule(){draw()}
function fitText(){
 const width=art.clientWidth,height=art.clientHeight;
 if(!width||!height)return;
 const content=String(state.text??'');
 const single=!!content.trim()&&!/\\s/.test(content.trim());
 txt.classList.toggle('single-word',single);
 txt.style.fontFamily=state.font;
 txt.style.lineHeight=String(Math.max(.65,1.12*state.lineHeight/100));
 txt.style.color=state.fg;
 txt.style.filter=state.blur?'blur('+(state.blur*width/1080).toFixed(2)+'px)':'none';
 txt.textContent=content;
 txt.style.transform='translateY(-50%)'+(state.mirror?' scaleX(-1)':'');
 const pad=Math.max(8,Math.round(width*.055));
 const availableWidth=width-pad*2,availableHeight=height-Math.max(8,Math.round(height*.055))*2;
 txt.style.width=availableWidth+'px';
 txt.style.height='auto';
 txt.style.top='50%';
 txt.style.bottom='auto';
 txt.style.left=pad+'px';
 txt.style.right='auto';
 if(!content.trim()){txt.style.fontSize='0px';return}
 // Bratify's textfit principle: measure actual browser line breaks in a
 // constrained box, then binary-search the largest font that still fits.
 const scale=Math.max(.01,Math.min(1,Number(state.fontScale)||100)/100);
 const maximum=Math.min(availableWidth*.85,availableHeight*.85,400)*scale;
 let low=.5,high=Math.max(1,maximum);
 const node=txt.firstChild;
 function fits(px){
  txt.style.fontSize=px+'px';
  if(txt.scrollHeight>availableHeight+.5||txt.scrollWidth>availableWidth+.5)return false;
  // scrollWidth alone cannot detect a final glyph protruding beyond a line.
  // Inspect the browser's actual glyph boxes, including justified lines.
  if(!node||node.nodeType!==3)return true;
  const parent=txt.getBoundingClientRect();
  const range=document.createRange();
  for(let i=0;i<node.length;i++){
   if(/\\s/.test(node.textContent[i]))continue;
   range.setStart(node,i);range.setEnd(node,i+1);
   const rect=range.getBoundingClientRect();
   if(rect.left<parent.left-1||rect.right>parent.right+1)return false;
  }
  return true;
 }
 for(let i=0;i<18;i++){const mid=(low+high)/2;if(fits(mid))low=mid;else high=mid}
 txt.style.fontSize=Math.max(.5,low-.15)+'px';
}

function draw(){const [w,h]=sizes[state.size];const area=art.closest('.art-area');const styles=getComputedStyle(area);const aw=area.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight),ah=area.clientHeight-parseFloat(styles.paddingTop)-parseFloat(styles.paddingBottom);const scale=Math.min(aw/w,ah/h);if(scale>0){art.style.width=Math.floor(w*scale)+'px';art.style.height=Math.floor(h*scale)+'px'}art.style.aspectRatio=w+'/'+h;art.style.background=state.bg;if(photo)art.style.backgroundImage='url('+JSON.stringify(photo.src)+')';else art.style.backgroundImage='none';art.style.backgroundSize='cover';art.style.backgroundPosition='center';fitText()}
function loadPhoto(){if(!state.image){photo=null;schedule();return}const im=new Image();im.onload=()=>{photo=im;schedule();notify('image added')};im.onerror=()=>{photo=null;schedule()};im.src=state.image}
function getRows(){
 // Inspect the actual browser line boxes so exported wrapping matches the preview.
 const node=txt.firstChild;if(!node||node.nodeType!==3)return [];
 const text=node.textContent,rect=art.getBoundingClientRect(),rows=[];
 for(let i=0;i<text.length;i++){
  const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);
  const box=range.getBoundingClientRect();if(!box.width&&!box.height)continue;
  const y=Math.round((box.top-rect.top)*10)/10;
  let row=rows.find(r=>Math.abs(r.y-y)<2);
  if(!row){row={y,chars:[]};rows.push(row)}
  row.chars.push({ch:text[i],x:box.left-rect.left,w:box.width});
 }
 return rows.sort((a,b)=>a.y-b.y)
}
function exportArt(){
 const [w,h]=sizes[state.size],mul=Number($('exportScale').value),out=document.createElement('canvas');out.width=w*mul;out.height=h*mul;
 const c=out.getContext('2d'),previewWidth=art.clientWidth,previewHeight=art.clientHeight;if(!previewWidth)return;
 const sx=out.width/previewWidth,sy=out.height/previewHeight;
 c.fillStyle=state.bg;c.fillRect(0,0,out.width,out.height);
 if(photo){const ratio=Math.max(out.width/photo.width,out.height/photo.height),iw=photo.width*ratio,ih=photo.height*ratio;c.drawImage(photo,(out.width-iw)/2,(out.height-ih)/2,iw,ih)}
 const computed=getComputedStyle(txt),size=parseFloat(computed.fontSize),line=parseFloat(computed.lineHeight),rows=getRows();
 c.fillStyle=state.fg;c.font=computed.fontWeight+' '+(size*sy)+'px '+computed.fontFamily;c.textBaseline='top';
 c.filter=state.blur?'blur('+(state.blur*mul).toFixed(2)+'px)':'none';
 // Paint browser-positioned characters, retaining CSS justification and natural glyph widths.
 if(state.mirror){c.translate(out.width,0);c.scale(-1,1)}
 for(const row of rows)for(const item of row.chars){if(item.ch===' '||item.ch==='\n')continue;c.fillText(item.ch,item.x*sx,(row.y+(line-size)*.28)*sy)}
 if(state.mirror)c.setTransform(1,0,0,1,0,0);
 c.filter='none';
 if(state.grain>0){const tile=document.createElement('canvas');tile.width=96;tile.height=96;const g=tile.getContext('2d'),d=g.createImageData(96,96);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=Math.round(state.grain*2)}g.putImageData(d,0,0);c.globalCompositeOperation='soft-light';c.fillStyle=c.createPattern(tile,'repeat');c.fillRect(0,0,out.width,out.height)}
 const type=$('exportFormat').value;out.toBlob(blob=>{if(!blob){notify('export failed');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='brat.'+(type==='jpeg'?'jpg':type);a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)},'image/'+type,.95)
}
function bind(id,event,key,convert=x=>x){$(id).addEventListener(event,e=>update({[key]:convert(e.target.value)}))}
bind('mainText','input','text');bind('bgColor','input','bg');bind('textColor','input','fg');bind('blur','input','blur',Number);bind('grain','input','grain',Number);bind('canvasSize','change','size');bind('fontFamily','change','font');bind('sizeAdjust','input','fontScale',Number);bind('lineHeight','input','lineHeight',Number);
for(const [id,keyName] of [['bgHex','bg'],['textHex','fg']]){
 const el=$(id);el.addEventListener('change',()=>{const hex=validHex(el.value);if(hex)update({[keyName]:hex});else{el.value=state[keyName];notify('enter a valid HEX color')}});
 el.addEventListener('blur',()=>{el.value=state[keyName].toUpperCase()});
}
for(const [id,keyName,min,max,fromPercent] of [['blurValue','blur',1,100,v=>v*5/100],['grainValue','grain',1,100,v=>v*35/100],['sizeAdjustValue','fontScale',1,100,v=>v],['lineHeightValue','lineHeight',1,100,v=>v]]){
 $(id).addEventListener('change',e=>{const n=Number(e.target.value);if(!Number.isFinite(n)||e.target.value.trim()===''){sync();return}update({[keyName]:fromPercent(Math.max(min,Math.min(max,Math.round(n))))})});
}
document.querySelectorAll('.hint-trigger').forEach(button=>{
 button.addEventListener('click',e=>{e.stopPropagation();const active=button.getAttribute('aria-expanded')==='true';document.querySelectorAll('.hint-trigger').forEach(b=>b.setAttribute('aria-expanded','false'));button.setAttribute('aria-expanded',String(!active))});
});
const hintBubble=document.createElement('div');hintBubble.className='floating-hint';hintBubble.setAttribute('role','tooltip');document.body.appendChild(hintBubble);
function placeHint(button){const box=button.getBoundingClientRect();hintBubble.textContent=button.nextElementSibling?.textContent||'';hintBubble.style.left=Math.max(12,Math.min(window.innerWidth-244,box.left-8))+'px';hintBubble.style.top=Math.max(12,Math.min(window.innerHeight-75,box.bottom+10))+'px';hintBubble.hidden=false}
function hideHint(){hintBubble.hidden=true}
document.querySelectorAll('.hint-trigger').forEach(b=>{b.addEventListener('click',()=>{if(b.getAttribute('aria-expanded')==='true')placeHint(b);else hideHint()});b.addEventListener('mouseenter',()=>placeHint(b));b.addEventListener('mouseleave',()=>{if(b.getAttribute('aria-expanded')!=='true')hideHint()})});
document.addEventListener('click',e=>{if(!e.target.closest('.hint-wrap')){hideHint();}if(!e.target.closest('.hint-wrap'))document.querySelectorAll('.hint-trigger').forEach(b=>b.setAttribute('aria-expanded','false'))});
$('mirrorToggle').addEventListener('click',()=>update({mirror:!state.mirror}));
document.querySelectorAll('.modern-select').forEach(sel=>{const shell=document.createElement('div');shell.className='select-shell';const trigger=document.createElement('button');trigger.type='button';trigger.className='select-display';trigger.dataset.select=sel.id;trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.innerHTML='<span></span><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>';const options=document.createElement('div');options.className='select-options';options.setAttribute('role','listbox');options.hidden=true;for(const option of sel.options){const item=document.createElement('button');item.type='button';item.className='select-item';item.setAttribute('role','option');item.textContent=option.textContent;item.addEventListener('click',()=>{sel.value=option.value;sel.dispatchEvent(new Event('change',{bubbles:true}));options.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.querySelector('span').textContent=option.textContent;draw();trigger.focus()});options.appendChild(item)}sel.parentNode.insertBefore(shell,sel);shell.append(sel,trigger,options);trigger.addEventListener('click',()=>{const opening=options.hidden;document.querySelectorAll('.select-options').forEach(p=>p.hidden=true);document.querySelectorAll('.select-display').forEach(b=>b.setAttribute('aria-expanded','false'));options.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening))});trigger.addEventListener('keydown',e=>{if(e.key==='Escape'){options.hidden=true;trigger.setAttribute('aria-expanded','false')}else if(e.key==='ArrowDown'){e.preventDefault();options.hidden=false;options.firstElementChild?.focus()}});options.addEventListener('keydown',e=>{if(e.key==='Escape'){options.hidden=true;trigger.focus()}})});
document.addEventListener('click',e=>{if(!e.target.closest('.select-shell')){document.querySelectorAll('.select-options').forEach(p=>p.hidden=true);document.querySelectorAll('.select-display').forEach(b=>b.setAttribute('aria-expanded','false'))}});
document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{const [bg,fg]=palettes[b.dataset.palette];update({bg,fg})}));
$('downloadTop').addEventListener('click',exportArt);
$('resetDesign').addEventListener('click',()=>{state={...defaults};photo=null;save();sync();schedule()});
$('imageInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;$('uploadLabel').textContent=file.name.length>18?file.name.slice(0,15)+'…':file.name;if(file.size>5e6){notify('image must be under 5 MB');return}const reader=new FileReader();reader.onload=()=>{update({image:reader.result});loadPhoto();document.querySelector('.media-panel').open=false;document.querySelector('.controls').scrollTo({top:0,behavior:'smooth'})};reader.readAsDataURL(file)});
$('removeImage').addEventListener('click',()=>{photo=null;$('imageInput').value='';$('uploadLabel').textContent='upload image';update({image:null})});
function theme(v){document.documentElement.dataset.theme=v;try{localStorage.setItem('brat-ui-theme',v)}catch{}}
$('themeToggle').addEventListener('click',()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
try{const old=JSON.parse(localStorage.getItem(key));if(old&&sizes[old.size])state={...defaults,...old}}catch{}
try{theme(localStorage.getItem('brat-ui-theme')||'light')}catch{theme('light')}
const observer=new ResizeObserver(()=>requestAnimationFrame(draw));observer.observe(art.closest('.art-area'));sync();loadPhoto();schedule();
