for(const button of document.querySelectorAll('[data-print]'))button.addEventListener('click',()=>window.print());
for(const link of document.querySelectorAll('.bank-switch a'))if(link.pathname.replace(/\/$/,'')===location.pathname.replace(/\/$/,''))link.setAttribute('aria-current','page');
