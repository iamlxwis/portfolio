'use strict';
/* BRAT Studio — vanilla JavaScript and Canvas. */
const $=id=>document.getElementById(id),canvas=$('artCanvas'),ctx=canvas.getContext('2d',{alpha:false});
const storageKey='brat-studio-project-v1',presetsKey='brat-studio-custom-presets';
const dimensions={square:[1080,1080],portrait:[1080,1350],story:[1080,1920],landscape:[1920,1080],banner:[1800,600]};
const presets=[
{name:'reference pink',text:'we got GTA\nVI before i\ngot a\ngirlfriend',bg:'#f2a4c8',fg:'#ffffff',blur:1.15,font:'arial',fontSize:166,spacing:-3,lineHeight:1.05,textAlign:'left',padding:0,grain:0},
{name:'classic brat',text:'brat',bg:'#8ace00',fg:'#111111',blur:1.6,font:'arial',fontSize:100,spacing:-4},
{name:'brat deluxe',text:'brat and\nit’s the same\nbut there’s three\nmore songs so\nit’s not',bg:'#f8f8f4',fg:'#111111',blur:1,font:'arial',fontSize:79,spacing:-3},
{name:'club classics',text:'club\nclassics',bg:'#111111',fg:'#ededeb',blur:1.6,font:'arial',fontSize:116,spacing:-5},
{name:'365',text:'365\nparty girl',bg:'#8ace00',fg:'#111111',blur:2.2,font:'arial',fontSize:105,spacing:-5},
{name:'remix',text:'brat\nbut it’s\ncompletely\ndifferent',bg:'#bcbdbd',fg:'#111111',blur:2,font:'arial',fontSize:94,spacing:-5},
{name:'hot pink',text:'everything\nis romantic',bg:'#ff68a9',fg:'#171717',blur:1.5,font:'arial',fontSize:110,spacing:-5},
{name:'blue monday',text:'guess',bg:'#136eff',fg:'#fafafa',blur:1.8,font:'arial',fontSize:125,spacing:-4},
{name:'blood orange',text:'talk talk',bg:'#ff642a',fg:'#191919',blur:1.8,font:'arial',fontSize:128,spacing:-5},
{name:'clean slate',text:'your era',bg:'#eeeeec',fg:'#151515',blur:0,font:'arial',fontSize:100,spacing:-4}
];
const defaults={text:'we got GTA\nVI before i\ngot a\ngirlfriend',fontFamily:'arial',fontSize:166,lineHeight:1.05,letterSpacing:-3,textAlign:'left',weight:'normal',vertical:50,horizontal:50,bgColor:'#f2a4c8',textColor:'#ffffff',sizePreset:'square',padding:0,rotation:0,blur:1.15,grain:0,distort:0,shadow:0,contrast:100,saturation:100,texture:'none',overlay:'none',imageMode:'background',imageFit:'cover',imageOpacity:100,imageScale:100,imageX:0,imageY:0,imageBlur:0,imageData:null};
let state={...defaults},image=null,undoStack=[],redoStack=[],lastSnapshot='',drawing=false,zoom=1,fitZoom=1,manuallyZoomed=false,toastTimeout,saveTimeout,drag=null;
const fields=['fontFamily','fontSize','lineHeight','letterSpacing','vertical','horizontal','bgColor','textColor','sizePreset','padding','rotation','blur','grain','distort','shadow','contrast','saturation','texture','overlay','imageMode','imageFit','imageOpacity','imageScale','imageX','imageY','imageBlur'];
const valueFormats={fontSize:v=>v,lineHeight:v=>Number(v).toFixed(2),letterSpacing:v=>v,vertical:v=>v+'%',horizontal:v=>v+'%',padding:v=>v+'%',rotation:v=>v+'°',blur:v=>Number(v).toFixed(1),grain:v=>v,distort:v=>v,shadow:v=>v,contrast:v=>v+'%',saturation:v=>v+'%',imageOpacity:v=>v+'%',imageScale:v=>v+'%',imageX:v=>v,imageY:v=>v,imageBlur:v=>v};
function notify(message){clearTimeout(toastTimeout);const el=$('toast');el.textContent=message;el.classList.add('show');toastTimeout=setTimeout(()=>el.classList.remove('show'),2800)}
function snapshot(){return JSON.stringify(state)}
function pushHistory(){if(!lastSnapshot)return;undoStack.push(lastSnapshot);if(undoStack.length>40)undoStack.shift();redoStack=[];updateHistory()}
function updateHistory(){$('undo').disabled=!undoStack.length;$('redo').disabled=!redoStack.length}
function setState(next,record=true){if(record)pushHistory();state={...state,...next};lastSnapshot=snapshot();syncControls();loadStateImage().then(render);scheduleSave()}
function change(key,value,record=false){if(state[key]===value)return;if(record)pushHistory();state[key]=value;lastSnapshot=snapshot();if(key==='sizePreset')fitCanvas();if(key==='imageData')loadStateImage().then(render);else render();scheduleSave()}
function scheduleSave(){clearTimeout(saveTimeout);saveTimeout=setTimeout(()=>{try{localStorage.setItem(storageKey,snapshot())}catch(e){}},450)}
function syncControls(){
 $('mainText').value=state.text;
 for(const key of fields){const el=$(key);if(el)el.value=state[key];if($(key+'Val'))$(key+'Val').textContent=valueFormats[key]?.(state[key])??state[key]}
 $('bgHex').value=state.bgColor;$('textHex').value=state.textColor;
 for(const id of ['textAlign','weight'])$(id).querySelectorAll('button').forEach(b=>b.classList.toggle('chosen',b.dataset.value===state[id]));
 $('imageTools').hidden=!state.imageData;fitCanvas()
}
function selectTab(id){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===id))}
function fontString(size){const families={arial:'Arial, Helvetica, sans-serif',helvetica:'Helvetica, Arial, sans-serif',impact:'Impact, Arial Black, sans-serif',mono:'Courier New, monospace',serif:'Times New Roman, serif'};return (state.weight==='bold'?'700':'400')+' '+size+'px '+(families[state.fontFamily]||families.arial)}
function measureText(context,text,spacing){return context.measureText(text).width+Math.max(0,[...text].length-1)*spacing}
function wrapText(context,content,maxWidth,spacing){
 const lines=[];
 for(const paragraph of String(content).replace(/\r/g,'').split('\n')){
  if(!paragraph.trim()){lines.push('');continue}
  let line='';
  for(const word of paragraph.split(/\s+/)){
   const candidate=line?line+' '+word:word;
   if(line&&measureText(context,candidate,spacing)>maxWidth){lines.push(line);line=word}else line=candidate;
   if(measureText(context,line,spacing)>maxWidth){let sub='';for(const ch of [...line]){if(sub&&measureText(context,sub+ch,spacing)>maxWidth){lines.push(sub);sub=ch}else sub+=ch}line=sub}
  }lines.push(line)
 }return lines.length?lines:['']
}
function drawSpaced(context,text,x,y,spacing,align){
 const chars=[...text],widths=chars.map(c=>context.measureText(c).width),total=widths.reduce((a,b)=>a+b,0)+(chars.length-1)*spacing;
 let pos=align==='center'?x-total/2:align==='right'?x-total:x;
 for(let i=0;i<chars.length;i++){context.fillText(chars[i],pos,y);pos+=widths[i]+spacing}
}
function textLayout(context,w,h){
 const k=w/1080,size=Number(state.fontSize)*k,margin=w*Number(state.padding)/100,maxWidth=w-2*margin,spacing=Number(state.letterSpacing)*k;
 context.font=fontString(size);const lines=wrapText(context,state.text,maxWidth,spacing),step=size*Number(state.lineHeight),height=(lines.length-1)*step+size;
 return {size,margin,maxWidth,spacing,lines,step,height,x:w*state.horizontal/100,y:h*state.vertical/100}
}
function drawText(context,w,h){
 const l=textLayout(context,w,h),k=w/1080;
 context.save();context.translate(l.x,l.y);context.rotate(Number(state.rotation)*Math.PI/180);
 context.textBaseline='middle';context.textAlign='left';context.font=fontString(l.size);context.fillStyle=state.textColor;
 const fx=Number(state.blur)*k;context.filter=fx?'blur('+fx+'px)':'none';
 if(state.shadow>0){context.shadowColor='rgba(0,0,0,.7)';context.shadowBlur=Number(state.shadow)*k;context.shadowOffsetX=2*k;context.shadowOffsetY=3*k}
 const left=state.textAlign==='left'?-l.maxWidth/2:state.textAlign==='right'?l.maxWidth/2:0,offset=(l.lines.length-1)*l.step/2;
 for(let i=0;i<l.lines.length;i++){const y=i*l.step-offset,wobble=Number(state.distort)>0?Math.sin(i*2.7+1)*Number(state.distort)*k:0;drawSpaced(context,l.lines[i],left+wobble,y,l.spacing,state.textAlign)}
 context.restore()
}
function drawImage(context,w,h,which){
 if(!image||state.imageMode!==which)return;
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;if(!iw||!ih)return;
 context.save();context.beginPath();context.rect(0,0,w,h);context.clip();context.globalAlpha=Number(state.imageOpacity)/100;context.filter=Number(state.imageBlur)?'blur('+state.imageBlur*w/1080+'px)':'none';
 let dw=w,dh=h;
 if(state.imageFit!=='stretch'){const factor=(state.imageFit==='contain'?Math.min:Math.max)(w/iw,h/ih);dw=iw*factor;dh=ih*factor}
 dw*=Number(state.imageScale)/100;dh*=Number(state.imageScale)/100;
 context.drawImage(image,(w-dw)/2+state.imageX/100*w,(h-dh)/2+state.imageY/100*h,dw,dh);context.restore()
}
function hashNoise(x,y){let n=(Math.imul(x+11,374761393)+Math.imul(y+7,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function drawTexture(context,w,h){
 const grain=Number(state.grain)+(state.texture==='noise'?28:0);
 if(grain>0){
  const tile=document.createElement('canvas');tile.width=180;tile.height=180;const p=tile.getContext('2d'),data=p.createImageData(180,180);
  for(let i=0;i<data.data.length;i+=4){const v=(hashNoise(i%720,(i/720)|0)*255)|0;data.data[i]=v;data.data[i+1]=v;data.data[i+2]=v;data.data[i+3]=Math.min(130,grain*1.6)}
  p.putImageData(data,0,0);context.save();context.globalCompositeOperation='soft-light';context.fillStyle=context.createPattern(tile,'repeat');context.fillRect(0,0,w,h);context.restore()
 }
 context.save();context.strokeStyle='rgba(0,0,0,.13)';context.fillStyle='rgba(0,0,0,.17)';
 if(state.texture==='scanlines'){context.lineWidth=Math.max(1,w/1080);for(let y=0;y<h;y+=Math.max(5,w/180)){context.beginPath();context.moveTo(0,y);context.lineTo(w,y);context.stroke()}}
 if(state.texture==='halftone'){const step=Math.max(9,w/90);for(let y=step/2;y<h;y+=step)for(let x=step/2;x<w;x+=step){context.beginPath();context.arc(x,y,step*.11,0,Math.PI*2);context.fill()}}
 context.restore()
}
function drawOverlay(context,w,h){
 const u=w/1080,pad=w*.045;context.save();context.strokeStyle=state.textColor;context.fillStyle=state.textColor;context.globalAlpha=.68;context.lineWidth=2*u;
 if(state.overlay==='border')context.strokeRect(pad,pad,w-2*pad,h-2*pad);
 if(state.overlay==='crosshair'){const n=26*u;for(const x of [pad,w-pad])for(const y of [pad,h-pad]){context.beginPath();context.moveTo(x-n,y);context.lineTo(x+n,y);context.moveTo(x,y-n);context.lineTo(x,y+n);context.stroke()}}
 if(state.overlay==='stamp'){context.font='700 '+20*u+'px monospace';context.textAlign='right';context.fillText('BRAT STUDIO • YOUR ERA',w-pad,h-pad)}
 context.restore()
}
function paint(context,w,h){
 context.save();context.clearRect(0,0,w,h);context.fillStyle=state.bgColor;context.fillRect(0,0,w,h);
 drawImage(context,w,h,'background');
 if(state.contrast!==100||state.saturation!==100){const layer=document.createElement('canvas');layer.width=w;layer.height=h;const lc=layer.getContext('2d');drawText(lc,w,h);drawImage(lc,w,h,'foreground');context.filter='contrast('+state.contrast+'%) saturate('+state.saturation+'%)';context.drawImage(layer,0,0);context.filter='none'}
 else{drawText(context,w,h);drawImage(context,w,h,'foreground')}
 drawTexture(context,w,h);drawOverlay(context,w,h);context.restore()
}
function render(){if(drawing)return;drawing=true;requestAnimationFrame(()=>{drawing=false;const [w,h]=dimensions[state.sizePreset]||dimensions.square;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}paint(ctx,w,h);$('canvasInfo').textContent=w+' × '+h+' px'})}
function fitCanvas(){const [w,h]=dimensions[state.sizePreset]||dimensions.square,stage=$('stageBody'),aw=Math.max(160,stage.clientWidth-30),ah=Math.max(160,stage.clientHeight-30);fitZoom=Math.min(aw/w,ah/h);if(!manuallyZoomed)zoom=fitZoom;applyZoom();render()}
function applyZoom(){const [w,h]=dimensions[state.sizePreset]||dimensions.square,wrap=$('canvasWrap');wrap.style.width=Math.round(w*zoom)+'px';wrap.style.height=Math.round(h*zoom)+'px';$('zoomLabel').textContent=manuallyZoomed?Math.round(zoom/fitZoom*100)+'%':'Fit'}
function setZoom(m){zoom=Math.min(fitZoom*4,Math.max(fitZoom*.35,zoom*m));manuallyZoomed=true;applyZoom()}
function imgFromData(data){return new Promise(resolve=>{if(!data){image=null;resolve();return}const im=new Image();im.onload=()=>{image=im;resolve()};im.onerror=()=>{image=null;notify('Could not load this photo');resolve()};im.src=data})}
async function loadStateImage(){await imgFromData(state.imageData);$('imageTools').hidden=!state.imageData}
function safeColor(v){return /^#[\da-f]{6}$/i.test(v)?v.toLowerCase():null}
function bindControls(){
 $('mainText').addEventListener('input',e=>change('text',e.target.value));
 for(const key of fields){const el=$(key);if(!el)continue;el.addEventListener('input',e=>{let val=e.target.value;if(el.type==='range')val=Number(val);change(key,val);if($(key+'Val'))$(key+'Val').textContent=valueFormats[key]?.(val)??val;if(key==='bgColor')$('bgHex').value=val;if(key==='textColor')$('textHex').value=val})}
 for(const [input,key,picker] of [['bgHex','bgColor','bgColor'],['textHex','textColor','textColor']])$(input).addEventListener('change',e=>{const value=safeColor(e.target.value);if(!value){e.target.value=state[key];notify('Use a 6-digit HEX color');return}change(key,value);$(picker).value=value});
 for(const id of ['textAlign','weight'])$(id).addEventListener('click',e=>{const b=e.target.closest('button[data-value]');if(!b)return;change(id,b.dataset.value,true);$(id).querySelectorAll('button').forEach(x=>x.classList.toggle('chosen',x===b))});
 document.querySelectorAll('.tab').forEach(el=>el.addEventListener('click',()=>selectTab(el.dataset.tab)));
 $('swapColors').addEventListener('click',()=>setState({bgColor:state.textColor,textColor:state.bgColor}));
 $('randomize').addEventListener('click',randomize);$('shuffle').addEventListener('click',randomize);
 $('resetEffects').addEventListener('click',()=>setState({blur:0,grain:0,distort:0,shadow:0,contrast:100,saturation:100,texture:'none',overlay:'none'}));
 $('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
 $('zoomIn').addEventListener('click',()=>setZoom(1.25));$('zoomOut').addEventListener('click',()=>setZoom(.8));$('zoomFit').addEventListener('click',()=>{manuallyZoomed=false;fitCanvas()});
 $('download').addEventListener('click',download);$('downloadTop').addEventListener('click',download);$('share').addEventListener('click',share);
 $('copyLink').addEventListener('click',copyDesignLink);$('saveProject').addEventListener('click',saveProject);$('loadProject').addEventListener('click',()=>$('projectInput').click());$('projectInput').addEventListener('change',loadProject);
 $('mobileTools').addEventListener('click',()=>toggleTools());$('mobileExport').addEventListener('click',()=>{selectTab('export');toggleTools(true)});
 document.addEventListener('keydown',e=>{const meta=e.ctrlKey||e.metaKey;if(meta&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}if(meta&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}if(e.key==='Escape')toggleTools(false)});
 window.addEventListener('resize',fitCanvas);
 $('fileInput').addEventListener('change',e=>{if(e.target.files?.[0])uploadImage(e.target.files[0]);e.target.value=''});
 const dz=$('dropzone');dz.addEventListener('click',()=>$('fileInput').click());dz.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('fileInput').click()}});
 for(const event of ['dragenter','dragover'])dz.addEventListener(event,e=>{e.preventDefault();dz.classList.add('over')});
 for(const event of ['dragleave','drop'])dz.addEventListener(event,e=>{e.preventDefault();dz.classList.remove('over')});
 dz.addEventListener('drop',e=>{const f=e.dataTransfer?.files?.[0];if(f)uploadImage(f)});
 $('removeImage').addEventListener('click',()=>setState({imageData:null}));
 $('savePreset').addEventListener('click',savePreset);$('customPreset').addEventListener('change',e=>{const p=getCustomPresets()[e.target.value];if(p)setState({...p,imageData:state.imageData})});$('deletePreset').addEventListener('click',deletePreset);
 $('canvasWrap').addEventListener('pointerdown',startDrag);window.addEventListener('pointermove',moveDrag);window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',endDrag)
}
function toggleTools(open){const sidebar=$('sidebar'),value=open===undefined?!sidebar.classList.contains('open'):open;sidebar.classList.toggle('open',value);$('mobileTools').setAttribute('aria-expanded',String(value))}
function undo(){if(!undoStack.length)return;redoStack.push(snapshot());state={...defaults,...JSON.parse(undoStack.pop())};lastSnapshot=snapshot();syncControls();loadStateImage().then(render);updateHistory();scheduleSave()}
function redo(){if(!redoStack.length)return;undoStack.push(snapshot());state={...defaults,...JSON.parse(redoStack.pop())};lastSnapshot=snapshot();syncControls();loadStateImage().then(render);updateHistory();scheduleSave()}
function randomize(){const p=presets[Math.floor(Math.random()*presets.length)];setState({text:p.text,bgColor:p.bg,textColor:p.fg,blur:p.blur,fontFamily:p.font,fontSize:p.fontSize,letterSpacing:p.spacing,rotation:0,vertical:50,horizontal:50,lineHeight:p.lineHeight??.95,textAlign:p.textAlign??'center',padding:p.padding??10,grain:p.grain??7});notify('New era unlocked ✳')}
function makePresets(){const grid=$('presetGrid');for(const p of presets){const b=document.createElement('button');b.className='preset';const preview=document.createElement('span');preview.className='preset-preview';preview.style.background=p.bg;preview.style.color=p.fg;preview.textContent=p.name==='brat deluxe'?'brat':p.text.split('\n')[0];const name=document.createElement('span');name.className='preset-name';name.textContent=p.name;b.append(preview,name);b.addEventListener('click',()=>{grid.querySelectorAll('.preset').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');setState({text:p.text,bgColor:p.bg,textColor:p.fg,blur:p.blur,fontFamily:p.font,fontSize:p.fontSize,letterSpacing:p.spacing,lineHeight:p.lineHeight??.95,textAlign:p.textAlign??'center',padding:p.padding??10,grain:p.grain??7,vertical:50,horizontal:50,rotation:0});notify(p.name+' applied')});grid.appendChild(b)}}
function getCustomPresets(){try{return JSON.parse(localStorage.getItem(presetsKey))||{}}catch{return {}}}
function fillCustomPresets(){const el=$('customPreset');el.replaceChildren(new Option('Load saved…',''));for(const key of Object.keys(getCustomPresets()))el.add(new Option(key,key))}
function savePreset(){const name=prompt('Name your look:');if(!name?.trim())return;const p=getCustomPresets(),{imageData,...rest}=state;p[name.trim().slice(0,40)]=rest;try{localStorage.setItem(presetsKey,JSON.stringify(p));fillCustomPresets();$('customPreset').value=name.trim().slice(0,40);notify('Look saved')}catch{notify('Could not save preset')}}
function deletePreset(){const name=$('customPreset').value;if(!name)return;const p=getCustomPresets();delete p[name];localStorage.setItem(presetsKey,JSON.stringify(p));fillCustomPresets();notify('Preset deleted')}
function uploadImage(file){if(!file.type.startsWith('image/')){notify('Choose an image file');return}if(file.size>12*1024*1024){notify('Please use an image under 12 MB');return}const reader=new FileReader();reader.onload=()=>{setState({imageData:reader.result});notify('Image added')};reader.onerror=()=>notify('Image upload failed');reader.readAsDataURL(file)}
function startDrag(e){if(e.button!==0||!e.isPrimary)return;const bounds=canvas.getBoundingClientRect(),rx=(e.clientX-bounds.left)/bounds.width,ry=(e.clientY-bounds.top)/bounds.height,[w,h]=dimensions[state.sizePreset],l=textLayout(ctx,w,h),dx=rx*100-state.horizontal,dy=ry*100-state.vertical,reachX=Math.max(12,Math.min(47,l.maxWidth/w*55)),reachY=Math.max(9,Math.min(44,l.height/h*65));if(Math.abs(dx)>reachX||Math.abs(dy)>reachY)return;drag={id:e.pointerId,rx,ry,horizontal:state.horizontal,vertical:state.vertical,moved:false};$('canvasWrap').classList.add('dragging');try{canvas.setPointerCapture(e.pointerId)}catch{}}
function moveDrag(e){if(!drag||e.pointerId!==drag.id)return;const bounds=canvas.getBoundingClientRect(),rx=(e.clientX-bounds.left)/bounds.width,ry=(e.clientY-bounds.top)/bounds.height;if(!drag.moved&&Math.hypot(rx-drag.rx,ry-drag.ry)>.004){pushHistory();drag.moved=true}if(drag.moved){state.horizontal=Math.max(0,Math.min(100,Math.round(drag.horizontal+(rx-drag.rx)*100)));state.vertical=Math.max(0,Math.min(100,Math.round(drag.vertical+(ry-drag.ry)*100)));$('horizontal').value=state.horizontal;$('vertical').value=state.vertical;$('horizontalVal').textContent=state.horizontal+'%';$('verticalVal').textContent=state.vertical+'%';lastSnapshot=snapshot();render()}}
function endDrag(e){if(!drag||e.pointerId!==drag.id)return;drag=null;$('canvasWrap').classList.remove('dragging');scheduleSave()}
function makeOutput(scale){const [w,h]=dimensions[state.sizePreset],target=document.createElement('canvas');target.width=w*scale;target.height=h*scale;paint(target.getContext('2d',{alpha:false}),target.width,target.height);return target}
function filename(){return ($('fileName').value.trim()||'my-brat-era').replace(/[^a-z0-9_\-. ]/gi,'-').slice(0,70)}
function saveBlob(blob,name){if(!blob){notify('Export failed');return}const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function exportBlob(){return new Promise((resolve,reject)=>{try{const scale=Number($('exportScale').value),format=$('exportFormat').value,mime=format==='jpeg'?'image/jpeg':format==='webp'?'image/webp':'image/png';makeOutput(scale).toBlob(blob=>blob?resolve({blob,format}):reject(new Error('Browser could not export image')),mime,.94)}catch(e){reject(e)}})}
async function download(){try{const {blob,format}=await exportBlob();saveBlob(blob,filename()+'.'+(format==='jpeg'?'jpg':format));notify('Image downloaded ✳')}catch{notify('Export failed — try standard resolution')}}
async function share(){try{const {blob,format}=await exportBlob(),file=new File([blob],filename()+'.'+(format==='jpeg'?'jpg':format),{type:blob.type});if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'My BRAT era'});else{notify('Native sharing unavailable — downloading instead');saveBlob(blob,file.name)}}catch(e){if(e.name!=='AbortError')notify('Sharing failed')}}
async function copyDesignLink(){const {imageData,...rest}=state,payload=btoa(unescape(encodeURIComponent(JSON.stringify(rest)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');const link=location.origin+location.pathname+'#design='+payload;try{await navigator.clipboard.writeText(link);notify(imageData?'Link copied (uploaded photo excluded)':'Design link copied')}catch{prompt('Copy your design link:',link)}}
function saveProject(){saveBlob(new Blob([JSON.stringify({app:'BRAT Studio',version:1,settings:state},null,2)],{type:'application/json'}),filename()+'.brat.json');notify('Editable project saved')}
function loadProject(e){const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(data.app!=='BRAT Studio'||!data.settings||!dimensions[data.settings.sizePreset])throw Error();setState({...defaults,...data.settings});notify('Project opened')}catch{notify('Not a valid BRAT Studio project')}};reader.readAsText(f);e.target.value=''}
function loadFromUrl(){const match=location.hash.match(/^#design=([A-Za-z0-9_-]+)$/);if(!match)return false;try{const b64=match[1].replace(/-/g,'+').replace(/_/g,'/'),decoded=JSON.parse(decodeURIComponent(escape(atob(b64))));if(!dimensions[decoded.sizePreset])return false;state={...defaults,...decoded,imageData:null};notify('Shared design loaded');return true}catch{return false}}
function init(){makePresets();bindControls();if(!loadFromUrl()){try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved&&dimensions[saved.sizePreset])state={...defaults,...saved}}catch{}}lastSnapshot=snapshot();syncControls();fillCustomPresets();loadStateImage().then(render);updateHistory();requestAnimationFrame(fitCanvas)}
init();
