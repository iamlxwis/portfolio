(function(){
var widget=document.getElementById('vinyl-widget');
var toggle=document.getElementById('vinyl-toggle');
var minimize=document.getElementById('vinyl-minimize');
try{
 var preference=sessionStorage.getItem('lxwis-vinyl-view');
 widget.classList.toggle('is-minimized',preference!=='full');
}catch(e){widget.classList.add('is-minimized')}
minimize.addEventListener('click',function(event){
 event.stopPropagation();
 widget.classList.toggle('is-minimized');
 try{sessionStorage.setItem('lxwis-vinyl-view',widget.classList.contains('is-minimized')?'min':'full')}catch(e){}
minimize.textContent=widget.classList.contains('is-minimized')?'+':'−';minimize.setAttribute('aria-label',widget.classList.contains('is-minimized')?'Expand vinyl player':'Minimize vinyl player');minimize.title=widget.classList.contains('is-minimized')?'Expand player':'Minimize player';});
var playerBox=document.getElementById('vinyl-player');
var embed=document.getElementById('vinyl-embed');
var videoId='RaaccfAJiOo';
var iframe=null;
var playing=false;
function makePlayer(){
 if(iframe)return;
 iframe=document.createElement('iframe');
 iframe.src='https://www.youtube-nocookie.com/embed/'+videoId+'?enablejsapi=1&autoplay=1&controls=0&playsinline=1&rel=0';
 iframe.title='Background music player';
 iframe.allow='autoplay; encrypted-media; picture-in-picture';
 iframe.referrerPolicy='strict-origin-when-cross-origin';
 iframe.tabIndex=-1;
 embed.appendChild(iframe);
}
function play(){
 widget.classList.add('is-open','is-playing');
 playerBox.setAttribute('aria-hidden','false');
 toggle.setAttribute('aria-pressed','true');
 toggle.setAttribute('aria-label','Pause music');
 makePlayer();
 if(iframe&&iframe.contentWindow)iframe.contentWindow.postMessage(JSON.stringify({event:'command',func:'playVideo',args:[]}), '*');
 playing=true;
}
function pause(){
 widget.classList.remove('is-playing');
 toggle.setAttribute('aria-pressed','false');
 toggle.setAttribute('aria-label','Play music');
 if(iframe&&iframe.contentWindow)iframe.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}), '*');
 playing=false;
}
toggle.addEventListener('click',function(){if(playing)pause();else play();});
document.addEventListener('keydown',function(event){if(event.key==='Escape'&&playing)pause();});
})();

(function(){
var trigger=document.getElementById('terminal-trigger'),overlay=document.getElementById('terminal-modal'),closeButton=document.getElementById('terminal-close'),form=document.getElementById('terminal-form'),input=document.getElementById('terminal-input'),output=document.getElementById('terminal-output');
var history=[],historyIndex=0,lastFocus=null;
function openTerminal(){lastFocus=document.activeElement;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');trigger.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';setTimeout(function(){input.focus();},20);}
function closeTerminal(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');trigger.setAttribute('aria-expanded','false');document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus();}
function addLine(command,result){var line=document.createElement('div');line.className='terminal-line';var prompt=document.createElement('span');prompt.className='terminal-prompt';prompt.textContent='lxwis:~$ ';var cmd=document.createElement('span');cmd.className='terminal-command';cmd.textContent=command;line.append(prompt,cmd);output.appendChild(line);if(result){var res=document.createElement('div');res.className='terminal-line terminal-result';res.innerHTML=result;output.appendChild(res);}output.scrollTop=output.scrollHeight;}
function safeText(value){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function runCommand(raw){var command=raw.trim().toLowerCase();if(!command)return;history.push(raw.trim());historyIndex=history.length;input.value='';if(command==='clear'){output.innerHTML='';return;}if(command==='home'){closeTerminal();window.scrollTo({top:0,behavior:'smooth'});return;}
var responses={
help:`Available commands:
  about       a little about me
  projects    view selected work
  skills      tools I use
  contact     social links
  time        current local time
  open libnav  open the LibNav project
  open bot     open the Telegram bot
  home        close terminal and go to the top
  clear       clear terminal output`,
about:'I\'m a student',
projects:`Selected work:
  LibNav             library website
  lxwis.site         personal website
  AllinOneTools_Bot  Telegram utility bot
  lxwis Bot          Messenger bot in progress

Try "open libnav" or "open bot".`,
skills:`Tools I use:
  HTML / CSS / JavaScript
  Node.js
  Firebase
  Git and GitHub
  Vercel`,
contact:`GitHub   github.com/iamlxwis
Facebook facebook.com/iamlxwis
Telegram t.me/iamlxwis`,
time:'Local time: '+new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Manila'}).format(new Date())
};
if(command==='open libnav'){window.open('https://libnav.lxwis.site','_blank','noopener,noreferrer');addLine(raw,'Opening <a href="https://libnav.lxwis.site" target="_blank" rel="noopener noreferrer">LibNav</a>');return;}
if(command==='open bot'){window.open('https://t.me/AllinOneTools_Bot','_blank','noopener,noreferrer');addLine(raw,'Opening <a href="https://t.me/AllinOneTools_Bot" target="_blank" rel="noopener noreferrer">AllinOneTools Bot</a>');return;}
if(Object.prototype.hasOwnProperty.call(responses,command)){addLine(raw,safeText(responses[command]).replace(/\\n/g,'<br>'));return;}
addLine(raw,'Command not found: <span class="terminal-prompt">'+safeText(command)+'</span>. Type <span class="terminal-prompt">help</span> to see available commands.');
}
trigger.addEventListener('click',openTerminal);closeButton.addEventListener('click',closeTerminal);
overlay.addEventListener('click',function(event){if(event.target===overlay)closeTerminal();});
form.addEventListener('submit',function(event){event.preventDefault();runCommand(input.value);});
overlay.addEventListener('keydown',function(event){
 if(event.key!=='Tab'||!overlay.classList.contains('open'))return;
 var items=Array.from(overlay.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')).filter(function(el){return el.getClientRects().length>0});
 if(!items.length){event.preventDefault();return}
 var first=items[0],last=items[items.length-1];
 if(event.shiftKey&&(document.activeElement===first||!overlay.contains(document.activeElement))){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&(document.activeElement===last||!overlay.contains(document.activeElement))){event.preventDefault();first.focus()}
});
input.addEventListener('keydown',function(event){if(event.key==='ArrowUp'){event.preventDefault();if(history.length){historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex]||'';}}else if(event.key==='ArrowDown'){event.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||'';}else if(event.key==='Escape'){event.preventDefault();closeTerminal();}});
document.querySelectorAll('[data-command]').forEach(function(button){button.addEventListener('click',function(){runCommand(button.getAttribute('data-command'));input.focus();});});
document.addEventListener('keydown',function(event){if(event.key==='Escape'&&overlay.classList.contains('open')){closeTerminal();return;}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(overlay.classList.contains('open'))closeTerminal();else openTerminal();}});
})();

/* Boot animation and navigation feedback: capped, bfcache safe. */
(function(){
 var loader=document.getElementById('lx-page-loader');
 if(!loader)return;
 var root=document.documentElement,booting=root.classList.contains('lx-booting'),bootStart=performance.now(),navTimer=0;
 var bootDone=!booting;
 function exitBoot(){
  if(bootDone&&!root.classList.contains('lx-booting'))return;
  bootDone=true;
  root.classList.remove('lx-booting');
  loader.classList.remove('is-active');
  loader.setAttribute('aria-hidden','true');
  try{sessionStorage.setItem('lxwis-intro-seen-v1','1')}catch(e){}
 }
 if(booting){
  loader.setAttribute('aria-hidden','false');
  function ready(){
   window.setTimeout(exitBoot,Math.max(0,380-(performance.now()-bootStart)));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
  else ready();
  window.setTimeout(exitBoot,1650);
 }else loader.setAttribute('aria-hidden','true');
 function navigate(){
  clearTimeout(navTimer);
  navTimer=window.setTimeout(function(){
   if(document.visibilityState==='visible'&&bootDone){
    loader.classList.add('is-active');
    loader.setAttribute('aria-hidden','false');
   }
  },140);
  // Never leave a blocked page covered if navigation is canceled or fails.
  window.setTimeout(function(){
   loader.classList.remove('is-active');
   loader.setAttribute('aria-hidden','true');
  },2400);
 }
 document.addEventListener('click',function(event){
  var link=event.target.closest&&event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.hasAttribute('download'))return;
  var target=(link.getAttribute('target')||'').toLowerCase();
  if(target&&target!=='_self')return;
  var href=link.getAttribute('href')||'';
  if(!href||href.charAt(0)==='#'||/^(mailto:|tel:|javascript:)/i.test(href))return;
  var destination;
  try{destination=new URL(link.href,location.href)}catch(e){return}
  if(destination.origin!==location.origin)return;
  if(destination.pathname===location.pathname&&destination.search===location.search)return;
  navigate();
 });
 window.addEventListener('pageshow',function(event){
  clearTimeout(navTimer);
  loader.classList.remove('is-active');
  if(event.persisted)exitBoot();
 });
 window.addEventListener('pagehide',function(){
  clearTimeout(navTimer);
  root.classList.remove('lx-booting');
  bootDone=true;
  loader.classList.remove('is-active');
  loader.setAttribute('aria-hidden','true');
 });
})();
