'use strict';
const $=id=>document.getElementById(id),art=$('art'),txt=$('artText');
if(window.Capacitor?.isNativePlatform?.())document.documentElement.classList.add('capacitor-app');
const sizes={square:[1080,1080],portrait:[1080,1350],story:[1080,1920],landscape:[1920,1080]};
const palettes={classic:['#8ace00','#141414'],pink:['#f1a6c9','#ffffff'],white:['#f4f4f0','#141414'],blue:['#1766ef','#ffffff'],black:['#141414','#ffffff']};
const defaults={text:'we got GTA VI before i got a girlfriend',bg:'#8ace00',fg:'#141414',blur:1,grain:0,size:'square',font:'Arial, Helvetica, sans-serif',fontScale:100,lineHeight:100,image:null};
const key='brat-minimal-v1';let state={...defaults},photo=null,raf=0,toastTimer;
function notify(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2000)}
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function update(p){state={...state,...p};save();sync();schedule()}
function sync(){for(const [id,v] of [['mainText',state.text],['bgColor',state.bg],['textColor',state.fg],['blur',state.blur],['grain',state.grain],['canvasSize',state.size],['fontFamily',state.font],['sizeAdjust',state.fontScale],['lineHeight',state.lineHeight]])$(id).value=v;document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',palettes[b.dataset.palette].join('|')===[state.bg,state.fg].join('|')))}
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;draw()})}
function fitText(){
 // Same core method as bratify: browser-native justified layout, then text-fit.
 // Binary-search font size against the actual DOM box, not an approximation of wrapping.
 const width=art.clientWidth,height=art.clientHeight;if(!width||!height)return;
 txt.style.fontFamily=state.font;txt.style.lineHeight=String(1.12*state.lineHeight/100);
 txt.style.color=state.fg;txt.style.filter=state.blur?'blur('+(state.blur*width/1080).toFixed(2)+'px)':'none';
 txt.textContent=state.text||'brat';
 let lo=5,hi=Math.min(width*.72,300*width/384)*state.fontScale/100;
 for(let i=0;i<19;i++){
  const mid=(lo+hi)/2;txt.style.fontSize=mid+'px';
  if(txt.scrollHeight<=height+1&&txt.scrollWidth<=width+1)lo=mid;else hi=mid;
 }
 txt.style.fontSize=lo+'px';
}
function draw(){const [w,h]=sizes[state.size];art.style.aspectRatio=w+'/'+h;art.style.background=state.bg;if(photo)art.style.backgroundImage='url('+JSON.stringify(photo.src)+')';else art.style.backgroundImage='none';art.style.backgroundSize='cover';art.style.backgroundPosition='center';fitText()}
function loadPhoto(){if(!state.image){photo=null;schedule();return}const im=new Image();im.onload=()=>{photo=im;schedule()};im.onerror=()=>{photo=null;schedule()};im.src=state.image}
function getRows(){
 // Inspect the actual browser line boxes so exported wrapping matches the preview.
 const node=txt.firstChild;if(!node||node.nodeType!==3)return [];
 const text=node.textContent,rect=txt.getBoundingClientRect(),rows=[];
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
 for(const row of rows)for(const item of row.chars){if(item.ch===' '||item.ch==='\n')continue;c.fillText(item.ch,item.x*sx,(row.y+(line-size)*.28)*sy)}
 c.filter='none';
 if(state.grain>0){const tile=document.createElement('canvas');tile.width=96;tile.height=96;const g=tile.getContext('2d'),d=g.createImageData(96,96);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=Math.round(state.grain*2)}g.putImageData(d,0,0);c.globalCompositeOperation='soft-light';c.fillStyle=c.createPattern(tile,'repeat');c.fillRect(0,0,out.width,out.height)}
 const type=$('exportFormat').value;out.toBlob(blob=>{if(!blob){notify('export failed');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='brat.'+(type==='jpeg'?'jpg':type);a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)},'image/'+type,.95)
}
function bind(id,event,key,convert=x=>x){$(id).addEventListener(event,e=>update({[key]:convert(e.target.value)}))}
bind('mainText','input','text');bind('bgColor','input','bg');bind('textColor','input','fg');bind('blur','input','blur',Number);bind('grain','input','grain',Number);bind('canvasSize','change','size');bind('fontFamily','change','font');bind('sizeAdjust','input','fontScale',Number);bind('lineHeight','input','lineHeight',Number);
document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{const [bg,fg]=palettes[b.dataset.palette];update({bg,fg})}));
$('download').addEventListener('click',exportArt);$('downloadTop').addEventListener('click',exportArt);
$('resetDesign').addEventListener('click',()=>{state={...defaults};photo=null;save();sync();schedule()});
$('imageInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;$('uploadLabel').textContent=file.name.length>18?file.name.slice(0,15)+'…':file.name;if(file.size>5e6){notify('image must be under 5 MB');return}const reader=new FileReader();reader.onload=()=>{update({image:reader.result});loadPhoto()};reader.readAsDataURL(file)});
$('removeImage').addEventListener('click',()=>{photo=null;$('imageInput').value='';$('uploadLabel').textContent='upload image';update({image:null})});
function theme(v){document.documentElement.dataset.theme=v;try{localStorage.setItem('brat-ui-theme',v)}catch{}}
$('themeToggle').addEventListener('click',()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
try{const old=JSON.parse(localStorage.getItem(key));if(old&&sizes[old.size])state={...defaults,...old}}catch{}
try{theme(localStorage.getItem('brat-ui-theme')||'light')}catch{theme('light')}
const observer=new ResizeObserver(schedule);observer.observe(art);sync();loadPhoto();schedule();
