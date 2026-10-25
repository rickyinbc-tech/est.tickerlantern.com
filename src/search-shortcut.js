import {searchLink} from './search-navigation.js';
// The notes/GIC application renders its shared header after HTML delivery and
// can replace it on navigation. Keep the entry present across those renders.
function ensureSearchLink(){
  const header=document.querySelector('.tl-header__inner');
  if(header&&!header.querySelector('.tl-search-link'))header.querySelector('.tl-brand')?.insertAdjacentHTML('afterend',searchLink);
}
ensureSearchLink();
const appRoot=document.querySelector('#root');
if(appRoot)new MutationObserver(ensureSearchLink).observe(appRoot,{childList:true,subtree:true});

document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.isComposing||event.altKey)return;
  const editing=event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable="true"]');
  if((event.key==='/'&&!editing&&!event.metaKey&&!event.ctrlKey)||(event.key.toLowerCase()==='k'&&(event.metaKey||event.ctrlKey))){
    event.preventDefault();
    const input=document.querySelector('#site-search');
    if(input){input.focus();input.select();}else location.assign('/search');
  }
});
