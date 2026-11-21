(()=>{
'use strict';
const list=document.getElementById('entries'),updated=document.getElementById('updated'),refresh=document.getElementById('refresh');
const linkRoot='https://github.com/iamlxwis/portfolio/commit/';
let busy=false;
function node(tag,cls,value){const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el}
function skeleton(){
 list.replaceChildren();
 for(let i=0;i<4;i++){
  const li=node('li','lx-log-skeleton');li.setAttribute('aria-hidden','true');li.append(node('span'),node('span'));list.append(li);
 }
}
function state(message){
 const li=node('li','lx-log-state',message);
 const a=node('a','', 'View commits on GitHub');a.href='https://github.com/iamlxwis/portfolio/commits/main';a.target='_blank';a.rel='noopener noreferrer';li.append(a);
 list.replaceChildren(li);
}
function formatted(input){
 const date=new Date(input);if(!Number.isFinite(date.getTime()))return 'Date unavailable';
 return new Intl.DateTimeFormat('en',{month:'short',day:'2-digit',year:'numeric',timeZone:'UTC'}).format(date)
}
function render(data){
 list.replaceChildren();
 if(!data.length){state('No commits available.');return}
 const frag=document.createDocumentFragment();
 data.slice(0,30).forEach((item,index)=>{
  if(!item?.sha||!item?.commit)return;
  const url=linkRoot+encodeURIComponent(item.sha);
  const li=node('li','lx-log-entry');li.style.animationDelay=Math.min(index*30,250)+'ms';
  const timestamp=item.commit.author?.date||item.commit.committer?.date;
  const date=node('time','lx-log-date',formatted(timestamp));if(timestamp)date.dateTime=timestamp;
  const details=node('div','lx-log-description');
  details.append(node('p','lx-log-message',String(item.commit.message||'Update').split('\n')[0]));
  const meta=node('div','lx-log-detail');
  meta.append(node('span','',item.commit.author?.name||'Contributor'));
  const hash=node('a','',item.sha.slice(0,7));hash.href=url;hash.target='_blank';hash.rel='noopener noreferrer';hash.setAttribute('aria-label','View commit '+item.sha.slice(0,7));meta.append(hash);details.append(meta);
  const arrow=node('a','lx-log-link');arrow.href=url;arrow.target='_blank';arrow.rel='noopener noreferrer';arrow.setAttribute('aria-label','Open commit '+item.sha.slice(0,7));
  const glyph=node('span');glyph.dataset.lxIcon='arrow-up-right';arrow.append(glyph);
  li.append(date,details,arrow);frag.append(li);
 });
 list.append(frag);window.LXIcons?.mount(list);
}
async function load(){
 if(busy)return;busy=true;refresh.disabled=true;
 refresh.replaceChildren();const glyph=node('span');glyph.dataset.lxIcon='loader-circle';refresh.append(glyph,document.createTextNode(' Loading'));
 window.LXIcons?.mount(refresh);updated.textContent='Checking…';
 if(!list.querySelector('.lx-log-entry'))skeleton();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
 try{
  const res=await fetch('/api/log',{headers:{Accept:'application/json'},signal:controller.signal});
  if(!res.ok)throw Error('Server returned '+res.status);
  const data=await res.json();if(!Array.isArray(data))throw Error('Invalid response');
  render(data);
  updated.textContent='Updated '+new Intl.DateTimeFormat('en',{hour:'2-digit',minute:'2-digit'}).format(new Date());
 }catch(e){
  if(!list.querySelector('.lx-log-entry'))state('Could not load repository updates.');
  updated.textContent='Unavailable';
 }finally{
  clearTimeout(timer);busy=false;refresh.disabled=false;refresh.replaceChildren();
  const icon=node('span');icon.dataset.lxIcon='refresh-cw';refresh.append(icon,document.createTextNode(' Refresh'));window.LXIcons?.mount(refresh);
 }
}
refresh.addEventListener('click',load);load();
})();
