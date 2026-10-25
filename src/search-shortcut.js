document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.isComposing||event.altKey)return;
  const editing=event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable="true"]');
  if((event.key==='/'&&!editing&&!event.metaKey&&!event.ctrlKey)||(event.key.toLowerCase()==='k'&&(event.metaKey||event.ctrlKey))){
    event.preventDefault();
    const input=document.querySelector('#site-search');
    if(input){input.focus();input.select();}else location.assign('/search');
  }
});
