'use strict';
const $=id=>document.getElementById(id),art=$('art'),txt=$('artText');
if(window.Capacitor?.isNativePlatform?.())document.documentElement.classList.add('capacitor-app');
const sizes={square:[1080,1080],portrait:[1080,1350],story:[1080,1920],landscape:[1920,1080]};
const palettes={classic:['#8ace00','#141414'],pink:['#f1a6c9','#ffffff'],white:['#f4f4f0','#141414'],blue:['#1766ef','#ffffff'],black:['#141414','#ffffff']};
const defaults={text:'brat',bg:'#8ace00',fg:'#141414',blur:1,grain:.35,mirror:false,size:'square',font:'Arial, Helvetica, sans-serif',fontScale:100,lineHeight:100,wrapMode:'classic',image:null};
const key='brat-minimal-v2';let state={...defaults},photo=null,raf=0,toastTimer;

const iconPaths={
 check:'<path d="m20 6-11 11-5-5"/>',
 alert:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v5m0-8h.01"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>',
 moon:'<path d="M20.985 12.486A9 9 0 0 1 11.514 3.015 9 9 0 1 0 20.985 12.486Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
 type:'<path d="M4 7V4h16v3M12 4v16m-4 0h8"/>',
 sliders:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
 chevron:'<path d="m6 9 6 6 6-6"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m5 4v7m4-7v7"/>',
 reset:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/>'
};
function premiumIcon(name,size=24){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width',String(size));svg.setAttribute('height',String(size));
 svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
 svg.classList.add('brat-premium-icon');svg.setAttribute('aria-hidden','true');
 svg.innerHTML=iconPaths[name]||iconPaths.info;return svg;
}
function upgradeIcons(){
 const entries=[
  ['#downloadTop','download'],['#themeToggle','moon'],
  ['.editor-panel>summary .settings-title','type'],
  ['.settings-panel>summary .settings-title','sliders'],
  ['.media-panel>summary .settings-title','image'],
  ['#removeImage','trash'],['#resetDesign','reset']
 ];
 for(const [selector,name] of entries){
  const parent=document.querySelector(selector);const old=parent?.querySelector('svg');
  if(old)old.replaceWith(premiumIcon(name));
 }
 document.querySelectorAll('details.editor-panel>summary>svg,details.settings-panel>summary>svg').forEach(svg=>svg.replaceWith(premiumIcon('chevron')));
 document.querySelectorAll('.hint-trigger').forEach(button=>{button.textContent='';button.append(premiumIcon('info',14));button.classList.add('premium-hint')});
 const upload=document.querySelector('.upload-button svg');if(upload)upload.replaceWith(premiumIcon('image'));
 document.querySelectorAll('.mirror-toggle svg,#mirrorToggle svg').forEach(svg=>svg.classList.add('brat-premium-icon'));
}
function exportOptions(){
 const el=$('toast');clearTimeout(toastTimer);el.replaceChildren();
 const dialog=document.createElement('div');dialog.className='brat-dialog brat-export-dialog';
 dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','brat-export-title');
 const icon=document.createElement('span');icon.className='brat-dialog-symbol';icon.append(premiumIcon('download',29));
 const heading=document.createElement('h2');heading.id='brat-export-title';heading.textContent='Export image';
 const description=document.createElement('p');description.textContent='Choose a format and resolution';
 const form=document.createElement('div');form.className='brat-export-form';
 function choiceGroup(title,name,choices,current){
  const group=document.createElement('fieldset');group.className='brat-choice-group';
  const legend=document.createElement('legend');legend.textContent=title;group.append(legend);
  const grid=document.createElement('div');grid.className='brat-choice-grid';
  for(const [value,label,detail] of choices){
   const option=document.createElement('label');option.className='brat-choice';
   const input=document.createElement('input');input.type='radio';input.name=name;input.value=value;input.checked=value===current;
   const content=document.createElement('span');content.className='brat-choice-content';
   const titleEl=document.createElement('strong');titleEl.textContent=label;
   const detailEl=document.createElement('small');detailEl.textContent=detail;
   content.append(titleEl,detailEl);option.append(input,content);grid.append(option);
  }
  group.append(grid);return group;
 }
 form.append(
  choiceGroup('Image format','brat-format',[['png','PNG','Best quality'],['jpeg','JPG','Smaller file'],['webp','WebP','Modern format']],$('exportFormat').value),
  choiceGroup('Resolution','brat-resolution',[['1','1080px','Standard'],['2','2160px','High quality']],$('exportScale').value)
 );
 const format={get value(){return form.querySelector('input[name="brat-format"]:checked')?.value||'png'},focus(){form.querySelector('input[name="brat-format"]:checked')?.focus()}};
 const quality={get value(){return form.querySelector('input[name="brat-resolution"]:checked')?.value||'1'}};
 const actions=document.createElement('div');actions.className='brat-export-actions';
 const cancel=document.createElement('button');cancel.type='button';cancel.className='brat-export-cancel';cancel.textContent='Cancel';
 const save=document.createElement('button');save.type='button';save.className='brat-dialog-done';save.append(premiumIcon('download',19),document.createTextNode(' Save image'));
 actions.append(cancel,save);dialog.append(icon,heading,description,form,actions);el.append(dialog);
 el.className='brat-modal show';
 const prior=document.activeElement;
 function close(){el.classList.remove('show');document.removeEventListener('keydown',onKey);if(prior?.focus)prior.focus({preventScroll:true})}
 function onKey(e){if(e.key==='Escape'){e.preventDefault();close()}else if(e.key==='Tab'){const nodes=[...form.querySelectorAll('input[type=radio]'),cancel,save],index=nodes.indexOf(document.activeElement);if(index>=0){e.preventDefault();nodes[(index+(e.shiftKey?nodes.length-1:1))%nodes.length].focus()}}}
 document.addEventListener('keydown',onKey);
 cancel.addEventListener('click',close);
 save.addEventListener('click',()=>{$('exportFormat').value=format.value;$('exportScale').value=quality.value;document.removeEventListener('keydown',onKey);exportArt()});
 format.focus({preventScroll:true});
}

let progressActive=false;
function showProgress(message='Working on your image…'){
 const el=$('toast');
 clearTimeout(toastTimer);
 progressActive=true;
 el.replaceChildren();
 const dialog=document.createElement('div');
 dialog.className='brat-dialog brat-progress-dialog';
 dialog.setAttribute('role','dialog');
 dialog.setAttribute('aria-modal','true');
 dialog.setAttribute('aria-label',message);
 const icon=document.createElement('span');icon.className='brat-progress-icon';icon.setAttribute('aria-hidden','true');icon.append(premiumIcon('image',32));
 const title=document.createElement('h2');title.textContent=message;
 const subtitle=document.createElement('p');subtitle.textContent='just a moment';
 const skeleton=document.createElement('div');skeleton.className='brat-progress-track';skeleton.innerHTML='<span></span>';
 dialog.append(icon,title,subtitle,skeleton);el.append(dialog);
 el.className='brat-modal show brat-modal-loading';
 el.setAttribute('aria-busy','true');
}
function notify(t){
 const el=$('toast'),message=String(t);
 progressActive=false;
 el.removeAttribute('aria-busy');
 const failed=/failed|could not|error|invalid|under 5 MB/i.test(message);
 const success=/saved to gallery|image added|ready/i.test(message);
 clearTimeout(toastTimer);
 el.replaceChildren();
 const dialog=document.createElement('div');dialog.className='brat-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','brat-dialog-title');
 const symbol=document.createElement('span');symbol.className='brat-dialog-symbol';symbol.append(premiumIcon(failed?'alert':success?'check':'info',30));
 const title=document.createElement('h2');title.id='brat-dialog-title';title.textContent=failed?'Something went wrong':success?'Saved successfully':'BRAT';
 const description=document.createElement('p');description.textContent=message;
 const done=document.createElement('button');done.type='button';done.className='brat-dialog-done';done.textContent='Done';
 dialog.append(symbol,title,description,done);el.append(dialog);
 el.className='brat-modal show'+(failed?' brat-modal-error':'');
 const previousFocus=document.activeElement;
 function close(){if(!el.classList.contains('show'))return;el.classList.remove('show');document.removeEventListener('keydown',onKey);toastTimer=setTimeout(()=>{if(!el.classList.contains('show'))el.replaceChildren();previousFocus?.focus?.()},220)}
 function onKey(e){if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){e.preventDefault();done.focus()}}
 done.addEventListener('click',close);
 el.addEventListener('click',e=>{if(e.target===el)close()},{once:true});
 document.addEventListener('keydown',onKey);
 done.focus({preventScroll:true});
}

function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function update(p){state={...state,...p};save();sync();schedule()}
function sync(){for(const [id,v] of [['mainText',state.text],['bgColor',state.bg],['textColor',state.fg],['blur',state.blur],['grain',state.grain],['canvasSize',state.size],['fontFamily',state.font],['sizeAdjust',state.fontScale],['lineHeight',state.lineHeight],['wrapMode',state.wrapMode||'classic']]){if($(id))$(id).value=v;}document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',palettes[b.dataset.palette].join('|')===[state.bg,state.fg].join('|')));for(const [id,value] of [['blur',Math.max(1,Math.round(state.blur/5*100))],['grain',Math.max(1,Math.round(state.grain/35*100))],['sizeAdjust',state.fontScale],['lineHeight',state.lineHeight]])$(id+'Value').value=Math.max(1,Math.min(100,value));$('mirrorToggle').setAttribute('aria-pressed',String(!!state.mirror));$('mirrorToggle').querySelector('span').textContent=state.mirror?'on':'off';syncHex();document.querySelectorAll('.select-display').forEach(b=>{const sel=$(b.dataset.select);b.querySelector('span').textContent=sel.options[sel.selectedIndex]?.textContent||''})}
function validHex(v){const raw=v.trim().replace(/^#/,'');return /^[0-9a-f]{6}$/i.test(raw)?'#'+raw.toLowerCase():/^[0-9a-f]{3}$/i.test(raw)?'#'+raw.split('').map(c=>c+c).join('').toLowerCase():null}
function syncHex(){for(const [id,color] of [['bgHex',state.bg],['textHex',state.fg]]){if(document.activeElement!==$(id))$(id).value=color.toUpperCase()}}
function schedule(){draw()}
function fitText(){
 const width=art.clientWidth,height=art.clientHeight;
 if(!width||!height)return;
 const content=String(state.text??'');
 const single=!!content.trim()&&!/\s/.test(content.trim());
 txt.classList.toggle('single-word',single);
 txt.dataset.wrapMode=state.wrapMode==='natural'?'natural':'classic';
 txt.style.textAlign=state.wrapMode==='natural'?'left':'justify';
 txt.style.textAlignLast='left';
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
 const scale=Math.max(.01,Math.min(1,(Number(state.fontScale)||100)/100));
 const maximum=Math.min(availableWidth*.85,availableHeight*.85,400)*scale;
 // Single words use canvas glyph measurement, avoiding unreliable DOM range
 // bounds and flex layout measurements that previously forced 0.5px text.
 if(single){
  const probe=document.createElement('canvas').getContext('2d');
  probe.font='400 100px '+state.font;
  const measured=Math.max(1,probe.measureText(content).width);
  const lineFactor=Math.max(.65,1.12*state.lineHeight/100);
  const target=Math.min(maximum,availableWidth*100/measured,availableHeight/lineFactor);
  txt.style.fontSize=Math.max(1,target)+'px';
  return;
 }
 // Multiline content: fit by actual rendered height and width only.
 // Range rectangles were compared to their own transformed parent, producing
 // false overflow and shrinking even short text to nearly zero.
 let low=1,high=Math.max(1,maximum);
 function fits(px){
  txt.style.fontSize=px+'px';
  return txt.scrollHeight<=availableHeight+1 && txt.scrollWidth<=availableWidth+1;
 }
 for(let i=0;i<15;i++){
  const mid=(low+high)/2;
  if(fits(mid))low=mid;else high=mid;
 }
 txt.style.fontSize=Math.max(1,low-.1)+'px';
}

function draw(){const [w,h]=sizes[state.size];const area=art.closest('.art-shell');const styles=getComputedStyle(area);const aw=area.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight),ah=area.clientHeight-parseFloat(styles.paddingTop)-parseFloat(styles.paddingBottom);const scale=Math.min(aw/w,ah/h);if(scale>0){art.style.width=Math.floor(w*scale)+'px';art.style.height=Math.floor(h*scale)+'px'}art.style.aspectRatio=w+'/'+h;art.style.background=state.bg;if(photo)art.style.backgroundImage='url('+JSON.stringify(photo.src)+')';else art.style.backgroundImage='none';art.style.backgroundSize='cover';art.style.backgroundPosition='center';fitText()}
function loadPhoto(){if(!state.image){photo=null;schedule();return}const im=new Image();im.onload=()=>{photo=im;schedule();if(progressActive)notify('image added')};im.onerror=()=>{photo=null;schedule();if(progressActive)notify('image failed to load')};im.src=state.image}
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
async function exportArt(){
 if(progressActive)return;
 showProgress('Saving your image…');
 // Paint the progress UI before canvas encoding starts.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 try{
 const [w,h]=sizes[state.size],mul=Number($('exportScale').value),out=document.createElement('canvas');out.width=w*mul;out.height=h*mul;
 const c=out.getContext('2d'),previewWidth=art.clientWidth,previewHeight=art.clientHeight;if(!previewWidth){notify('export failed: preview is not ready');return;}
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
 const type=$('exportFormat').value;
 out.toBlob(async blob=>{
  if(!blob){notify('export failed');return}
  const extension=type==='jpeg'?'jpg':type;
  if(window.Capacitor?.isNativePlatform?.()){
   try{
    const Gallery=window.Capacitor.Plugins?.BratGallery;
    if(!Gallery)throw new Error('Gallery saving is not available in this build');
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)});
    await Gallery.saveImage({data,mimeType:'image/'+type,fileName:'brat-'+Date.now()+'.'+extension});
    notify('saved to gallery');
   }catch(error){console.error('Gallery export failed',error);notify('save failed: '+(error?.message||'please try again'))}
   return;
  }
  try{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='brat.'+extension;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);notify('image ready to download')}catch(error){notify('export failed: '+(error?.message||'please try again'))}
 },'image/'+type,.95)
 }catch(error){console.error('BRAT export failed',error);notify('export failed: '+(error?.message||'please try again'))}
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
const hintBubble=document.createElement('div');hintBubble.className='floating-hint';hintBubble.setAttribute('role','tooltip');hintBubble.setAttribute('aria-label','Editor control help');hintBubble.hidden=true;document.body.appendChild(hintBubble);
function placeHint(button){const box=button.getBoundingClientRect();hintBubble.textContent=button.nextElementSibling?.textContent||'';hintBubble.style.left=Math.max(12,Math.min(window.innerWidth-244,box.left-8))+'px';hintBubble.style.top=Math.max(12,Math.min(window.innerHeight-75,box.bottom+10))+'px';hintBubble.hidden=false}
function hideHint(){hintBubble.hidden=true}
document.querySelectorAll('.hint-trigger').forEach(b=>{b.addEventListener('click',()=>{if(b.getAttribute('aria-expanded')==='true')placeHint(b);else hideHint()});b.addEventListener('mouseenter',()=>placeHint(b));b.addEventListener('mouseleave',()=>{if(b.getAttribute('aria-expanded')!=='true')hideHint()})});
document.addEventListener('click',e=>{if(!e.target.closest('.hint-wrap')){hideHint();}if(!e.target.closest('.hint-wrap'))document.querySelectorAll('.hint-trigger').forEach(b=>b.setAttribute('aria-expanded','false'))});
$('mirrorToggle').addEventListener('click',()=>update({mirror:!state.mirror}));
document.querySelectorAll('.modern-select').forEach(sel=>{
 const shell=document.createElement('div');shell.className='select-shell';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='select-display';
 trigger.dataset.select=sel.id;trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
 const label=document.createElement('span');const chevron=premiumIcon('chevron',17);trigger.append(label,chevron);
 const options=document.createElement('div');options.className='select-options';options.id=sel.id+'-choices';options.setAttribute('role','listbox');options.hidden=true;
 trigger.setAttribute('aria-controls',options.id);
 function close(){options.hidden=true;trigger.setAttribute('aria-expanded','false')}
 function refresh(){
  label.textContent=sel.selectedOptions[0]?.textContent||'';
  options.querySelectorAll('[role="option"]').forEach(item=>{const selected=item.dataset.value===sel.value;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1});
 }
 for(const option of sel.options){
  const item=document.createElement('button');item.type='button';item.className='select-item';
  item.setAttribute('role','option');item.dataset.value=option.value;
  const name=document.createElement('span');name.textContent=option.textContent;
  const check=premiumIcon('check',16);item.append(name,check);
  item.addEventListener('click',()=>{sel.value=option.value;sel.dispatchEvent(new Event('change',{bubbles:true}));refresh();close();trigger.focus()});
  options.append(item);
 }
 sel.parentNode.insertBefore(shell,sel);shell.append(sel,trigger,options);
 trigger.addEventListener('click',()=>{
  const opening=options.hidden;
  document.querySelectorAll('.select-options').forEach(p=>p.hidden=true);
  document.querySelectorAll('.select-display').forEach(b=>b.setAttribute('aria-expanded','false'));
  options.hidden=!opening;trigger.setAttribute('aria-expanded',String(opening));
  if(opening){refresh();options.querySelector('[aria-selected="true"]')?.focus()}
 });
 trigger.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='Enter'||e.key===' '){e.preventDefault();if(options.hidden)trigger.click()}else if(e.key==='Escape')close()});
 options.addEventListener('keydown',e=>{
  const items=[...options.querySelectorAll('[role="option"]')],index=items.indexOf(document.activeElement);
  if(e.key==='Escape'){e.preventDefault();close();trigger.focus()}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();items[(index+(e.key==='ArrowDown'?1:items.length-1))%items.length]?.focus()}
  if(e.key==='Home'){e.preventDefault();items[0]?.focus()}
  if(e.key==='End'){e.preventDefault();items[items.length-1]?.focus()}
 });
 sel.addEventListener('change',refresh);refresh();
});
document.addEventListener('click',e=>{if(!e.target.closest('.select-shell')){document.querySelectorAll('.select-options').forEach(p=>p.hidden=true);document.querySelectorAll('.select-display').forEach(b=>b.setAttribute('aria-expanded','false'))}});
$('wrapMode')?.addEventListener('change',e=>update({wrapMode:e.target.value==='natural'?'natural':'classic'}));
document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{const [bg,fg]=palettes[b.dataset.palette];update({bg,fg})}));
$('downloadTop').addEventListener('click',exportOptions);
$('resetDesign').addEventListener('click',()=>{state={...defaults};photo=null;save();sync();schedule()});
$('imageInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;$('uploadLabel').textContent=file.name.length>18?file.name.slice(0,15)+'…':file.name;if(file.size>5e6){notify('image must be under 5 MB');return}const reader=new FileReader();reader.onload=()=>{showProgress('Loading your image…');update({image:reader.result});loadPhoto();document.querySelector('.media-panel').open=false;document.querySelector('.controls').scrollTo({top:0,behavior:'smooth'})};reader.onerror=()=>notify('image failed to load');reader.readAsDataURL(file)});
$('removeImage').addEventListener('click',()=>{photo=null;$('imageInput').value='';$('uploadLabel').textContent='upload image';update({image:null})});
function theme(v){
 document.documentElement.dataset.theme=v;
 const themeIcon=$('themeToggle')?.querySelector('svg');if(themeIcon)themeIcon.replaceWith(premiumIcon(v==='dark'?'sun':'moon'));
 const dark=v==='dark';
 const themeColor=dark?'#141613':'#f5f5f2';
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',themeColor);
 const status=window.Capacitor?.Plugins?.StatusBar;
 if(window.Capacitor?.isNativePlatform?.()&&status){
  status.setBackgroundColor({color:themeColor}).catch(()=>{});
  status.setStyle({style:dark?'DARK':'LIGHT'}).catch(()=>{});
 }
 try{localStorage.setItem('brat-ui-theme',v)}catch{}
}
$('themeToggle').addEventListener('click',()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
try{const old=JSON.parse(localStorage.getItem(key));if(old&&sizes[old.size])state={...defaults,...old}}catch{}
try{theme(localStorage.getItem('brat-ui-theme')||'light')}catch{theme('light')}
upgradeIcons();
const observer=new ResizeObserver(()=>requestAnimationFrame(draw));observer.observe(art.closest('.art-area'));observer.observe(art.closest('.art-shell'));sync();loadPhoto();schedule();
