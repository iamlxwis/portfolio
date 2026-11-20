(function(){
var widget=document.getElementById('vinyl-widget');
var toggle=document.getElementById('vinyl-toggle');
var minimize=document.getElementById('vinyl-minimize');
minimize.addEventListener('click',function(event){event.stopPropagation();widget.classList.toggle('is-minimized');minimize.textContent=widget.classList.contains('is-minimized')?'+':'−';minimize.setAttribute('aria-label',widget.classList.contains('is-minimized')?'Expand vinyl player':'Minimize vinyl player');minimize.title=widget.classList.contains('is-minimized')?'Expand player':'Minimize player';});
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
function openTerminal(){lastFocus=document.activeElement;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';setTimeout(function(){input.focus();},20);}
function closeTerminal(){overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus();}
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
input.addEventListener('keydown',function(event){if(event.key==='ArrowUp'){event.preventDefault();if(history.length){historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex]||'';}}else if(event.key==='ArrowDown'){event.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||'';}else if(event.key==='Escape'){event.preventDefault();closeTerminal();}});
document.querySelectorAll('[data-command]').forEach(function(button){button.addEventListener('click',function(){runCommand(button.getAttribute('data-command'));input.focus();});});
document.addEventListener('keydown',function(event){if(event.key==='Escape'&&overlay.classList.contains('open')){closeTerminal();return;}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(overlay.classList.contains('open'))closeTerminal();else openTerminal();}});
})();

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
  window.addEventListener('pageshow',function(){
    loader.classList.remove('is-active');
    loader.setAttribute('aria-hidden','true');
  });
  window.addEventListener('pagehide',function(){
    loader.classList.remove('is-active');
    loader.setAttribute('aria-hidden','true');
  });

})();