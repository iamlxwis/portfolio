'use strict';
const $=id=>document.getElementById(id),canvas=$('artCanvas'),ctx=canvas.getContext('2d',{alpha:false});
const dims={square:[1080,1080],portrait:[1080,1350],story:[1080,1920],landscape:[1920,1080]};
const palettes={classic:['#8ace00','#141414'],pink:['#f1a6c9','#ffffff'],white:['#f4f4f0','#141414'],blue:['#1766ef','#ffffff'],orange:['#ff6839','#141414'],black:['#141414','#ffffff']};
const defaults={text:'we got GTA VI before i got a girlfriend',bg:'#8ace00',fg:'#141414',blur:1,grain:0,size:'square',font:'Arial, Helvetica, sans-serif',layout:'auto',fontScale:100,lineHeight:100,image:null};
const storage='brat-maker-v3',themeKey='brat-maker-theme';
let state={...defaults},photo=null,history=[],future=[],renderPending=false,toastTimer,grainTile=null;
function notify(t){const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200)}
function snapshot(){return JSON.stringify(state)}
function set(patch,record=true){if(record){history.push(snapshot());if(history.length>35)history.shift();future=[]}state={...state,...patch};sync();render();try{localStorage.setItem(storage,snapshot())}catch{}}
function undo(){if(!history.length)return;future.push(snapshot());state=JSON.parse(history.pop());loadImage();sync();render()}
function redo(){if(!future.length)return;history.push(snapshot());state=JSON.parse(future.pop());loadImage();sync();render()}
function sync(){
 $('mainText').value=state.text;$('bgColor').value=state.bg;$('textColor').value=state.fg;
 $('blur').value=state.blur;$('grain').value=state.grain;$('canvasSize').value=state.size;
 $('fontFamily').value=state.font;$('layoutMode').value=state.layout;$('sizeAdjust').value=state.fontScale;$('lineHeight').value=state.lineHeight;
 $('sizeLabel').textContent=state.fontScale+'%';$('lineLabel').textContent=state.lineHeight+'%';
 document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',palettes[b.dataset.palette][0]===state.bg&&palettes[b.dataset.palette][1]===state.fg));
 $('undo').disabled=!history.length;$('redo').disabled=!future.length;
}
function loadImage(){if(!state.image){photo=null;render();return}const im=new Image();im.onload=()=>{photo=im;render()};im.onerror=()=>{photo=null;render()};im.src=state.image}
function measure(c,t,spacing){return c.measureText(t).width+Math.max(0,[...t].length-1)*spacing}
function greedy(c,text,max,spacing){
 const out=[];for(const para of text.replace(/\r/g,'').split('\n')){
  if(!para.trim()){out.push('');continue}
  let line='';for(const word of para.trim().split(/\s+/)){
   if(line&&measure(c,line+' '+word,spacing)>max){out.push(line);line=word}else line=line?line+' '+word:word;
   if(measure(c,line,spacing)>max){let part='';for(const char of [...line]){if(part&&measure(c,part+char,spacing)>max){out.push(part);part=char}else part+=char}line=part}
  }out.push(line)
 }return out
}
function layout(c,w,h){
 const scale=w/1080,margin=Math.min(w,h)*.025,maxWidth=w-2*margin,maxHeight=h-2*margin;
 const text=state.text.trim()||'brat',spacing=-1.5*scale;
 let best=null;
 // Search over font sizes and choose a tight, readable block with natural glyph widths.
 for(let px=36;px<=300;px+=3){
  const font=px*scale*state.fontScale/100;c.font='400 '+font+'px '+state.font;
  const lines=state.layout==='manual'?text.split('\n'):greedy(c,text,maxWidth,spacing);
  const step=font*state.lineHeight/100;
  const height=(lines.length-1)*step+font;
  const widths=lines.map(t=>measure(c,t,spacing));
  const widest=Math.max(...widths,0);
  if(height>maxHeight||widest>maxWidth+1)continue;
  const occupancy=widest/maxWidth,vertical=height/maxHeight;
  // Favor a block occupying the square without stretching or inserting huge word gaps.
  const score=.62*vertical+.38*occupancy-Math.max(0,lines.length-6)*.12;
  if(!best||score>best.score)best={font,lines,step,height,widths,spacing,score};
 }
 if(!best){c.font='24px '+state.font;best={font:24,lines:[text],step:24,height:24,widths:[c.measureText(text).width],spacing:0}}
 return best
}
function drawLetters(c,t,x,y,spacing){
 for(const ch of [...t]){c.fillText(ch,x,y);x+=c.measureText(ch).width+spacing}
}
function drawGrain(c,w,h){
 if(!state.grain)return;
 if(!grainTile){const tile=document.createElement('canvas');tile.width=96;tile.height=96;const tc=tile.getContext('2d'),im=tc.createImageData(96,96);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=85}tc.putImageData(im,0,0);grainTile=tile}
 c.save();c.globalAlpha=state.grain/80;c.globalCompositeOperation='soft-light';c.fillStyle=c.createPattern(grainTile,'repeat');c.fillRect(0,0,w,h);c.restore()
}
function paint(c,w,h){
 c.save();c.fillStyle=state.bg;c.fillRect(0,0,w,h);
 if(photo){const ratio=Math.max(w/photo.width,h/photo.height),iw=photo.width*ratio,ih=photo.height*ratio;c.drawImage(photo,(w-iw)/2,(h-ih)/2,iw,ih)}
 const l=layout(c,w,h),margin=Math.min(w,h)*.025;
 c.save();c.beginPath();c.rect(0,0,w,h);c.clip();c.fillStyle=state.fg;c.textAlign='left';c.textBaseline='middle';c.font='400 '+l.font+'px '+state.font;
 c.filter=state.blur?'blur('+(state.blur*w/1080).toFixed(2)+'px)':'none';
 // Top-to-bottom tight block; align lines to the same left edge like the reference.
 const top=(h-l.height)/2+l.font/2;
 for(let i=0;i<l.lines.length;i++)drawLetters(c,l.lines[i],margin,top+i*l.step,l.spacing);
 c.restore();drawGrain(c,w,h);c.restore()
}
function render(){if(renderPending)return;renderPending=true;requestAnimationFrame(()=>{renderPending=false;const [w,h]=dims[state.size],factor=Math.min(1,700/Math.max(w,h));const pw=Math.round(w*factor),ph=Math.round(h*factor);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph}paint(ctx,pw,ph);$('canvasInfo').textContent=w+' × '+h})}
function exportImage(){const [w,h]=dims[state.size],mult=Number($('exportScale').value),out=document.createElement('canvas');out.width=w*mult;out.height=h*mult;paint(out.getContext('2d',{alpha:false}),out.width,out.height);const format=$('exportFormat').value,mime='image/'+format;out.toBlob(blob=>{if(!blob){notify('Export failed');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='brat.'+(format==='jpeg'?'jpg':format);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)},mime,.95)}
function bind(id,event,key,transform=v=>v){$(id).addEventListener(event,e=>set({[key]:transform(e.target.value)},event!=='input'))}
bind('mainText','input','text');bind('bgColor','input','bg');bind('textColor','input','fg');bind('blur','input','blur',Number);bind('grain','input','grain',Number);bind('canvasSize','change','size');bind('fontFamily','change','font');bind('layoutMode','change','layout');bind('sizeAdjust','input','fontScale',Number);bind('lineHeight','input','lineHeight',Number);
document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{const [bg,fg]=palettes[b.dataset.palette];set({bg,fg})}));
$('resetEffects').addEventListener('click',()=>set({blur:0,grain:0}));
$('resetDesign').addEventListener('click',()=>{set({...defaults});photo=null});
$('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
$('download').addEventListener('click',exportImage);$('downloadTop').addEventListener('click',exportImage);
$('imageInput').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>6e6){notify('Choose an image under 6 MB');return}const reader=new FileReader();reader.onload=()=>{set({image:reader.result});loadImage()};reader.readAsDataURL(f)});
$('removeImage').addEventListener('click',()=>{set({image:null});photo=null});
function applyTheme(v){document.documentElement.dataset.theme=v;try{localStorage.setItem(themeKey,v)}catch{};$('themeToggle').setAttribute('aria-label',v==='dark'?'Switch to light mode':'Switch to dark mode')}
$('themeToggle').addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}});
try{const saved=JSON.parse(localStorage.getItem(storage));if(saved&&dims[saved.size])state={...defaults,...saved}}catch{}
applyTheme((()=>{try{return localStorage.getItem(themeKey)}catch{return null}})()||'light');sync();loadImage();render();
