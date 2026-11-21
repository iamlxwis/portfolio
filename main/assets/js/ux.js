/* Minimal, progressive UX enhancements. No animation library. */
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const progress=document.getElementById('lx-scroll-progress');
 const back=document.getElementById('lx-back-to-top');
 const sections=[...document.querySelectorAll('.content-section[id]')];
 const links=[...document.querySelectorAll('.site-nav a[href^="#"]')];
 let scheduled=false;
 function renderScroll(){
  scheduled=false;
  const max=document.documentElement.scrollHeight-innerHeight;
  const p=max>0?Math.min(1,Math.max(0,scrollY/max)):0;
  if(progress)progress.style.transform='scaleX('+p.toFixed(4)+')';
  if(back)back.classList.toggle('is-visible',scrollY>560);
  let current='';
  for(const section of sections){
   if(section.getBoundingClientRect().top<=Math.min(210,innerHeight*.36))current=section.id;
  }
  for(const link of links){
   const active=link.getAttribute('href')==='#'+current;
   link.classList.toggle('is-current',active);
   if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
  }
 }
 function schedule(){
  if(!scheduled){scheduled=true;requestAnimationFrame(renderScroll)}
 }
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 addEventListener('pageshow',schedule);
 if(back)back.addEventListener('click',()=>scrollTo({top:0,behavior:reduced?'auto':'smooth'}));
 schedule();
 if(!reduced&&'IntersectionObserver' in window){
  const targets=[...document.querySelectorAll('.content-section')];
  for(const el of targets){
   el.classList.add('lx-reveal');
   if(el.getBoundingClientRect().top<innerHeight*.88)el.classList.add('is-visible');
  }
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}
   }
  },{rootMargin:'0px 0px -6% 0px',threshold:.02});
  for(const el of targets)if(!el.classList.contains('is-visible'))observer.observe(el);
  document.documentElement.classList.add('lx-motion-ready');
  addEventListener('pageshow',()=>{for(const el of targets)if(el.getBoundingClientRect().top<innerHeight*.9)el.classList.add('is-visible')});
 }
})();
