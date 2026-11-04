/* Keyboard and screen-reader support around the existing renderer. */
const accessibleOriginalDraw=draw;
let modalOpener=null;
draw=function(rs){
 const active=document.activeElement,previous=document.querySelector('.mo');
 const focusKey=active&&{id:active.id,text:active.textContent,handler:active.getAttribute('onclick')};
 if(!previous&&active&&active!==document.body)modalOpener=focusKey;
 accessibleOriginalDraw(rs);
 const app=document.getElementById('app'),modal=app.querySelector('.mo');
 for(const card of app.querySelectorAll('[onclick]:not(button):not(input):not(select):not(a)')){card.setAttribute('role','button');card.tabIndex=0;if(!card.getAttribute('aria-label'))card.setAttribute('aria-label',card.textContent.trim());}
 for(const input of app.querySelectorAll('input:not([id]),select:not([aria-label])')){if(input.labels?.length||input.hasAttribute('aria-labelledby'))continue;input.setAttribute('aria-label',input.type==='text'?'Text entry':'Choose an option');}
 for(const nav of app.querySelectorAll('.nav')){nav.setAttribute('aria-label','Game sections');for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-pressed',b.classList.contains('on'));}
 for(const toast of app.querySelectorAll('.toast')){toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');}
 const find=key=>key&&(key.id?document.getElementById(key.id):[...app.querySelectorAll('[onclick]')].find(el=>el.getAttribute('onclick')===key.handler&&el.textContent===key.text));
 if(modal){
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.tabIndex=-1;
  const title=modal.querySelector('h1,h2,h3,.t,p');if(title){title.id='active-dialog-title';modal.setAttribute('aria-labelledby',title.id);}else modal.setAttribute('aria-label','Game event');
  for(let branch=modal;branch&&branch!==app;branch=branch.parentElement){for(const sibling of branch.parentElement.children)if(sibling!==branch)sibling.inert=true;}
  const focus=previous&&find(focusKey);(focus&&modal.contains(focus)?focus:modal.querySelector('button:not(:disabled),input,select,[tabindex="0"]')||modal).focus({preventScroll:true});
 }else{
  const focus=find(previous?modalOpener:focusKey);if(focus)focus.focus({preventScroll:true});
 }
};
document.addEventListener('keydown',e=>{
 const modal=document.querySelector('.mo');
 if(e.key==='Tab'&&modal){const els=[...modal.querySelectorAll('button:not(:disabled),input,select,a[href],[tabindex="0"]')].filter(el=>!el.hidden);if(!els.length){e.preventDefault();modal.focus();return;}const first=els[0],last=els.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===modal)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first.focus();}}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"]:not(button)')){e.preventDefault();e.target.click();}
});
