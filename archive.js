const search=document.querySelector('#archive-search');
const entries=[...document.querySelectorAll('.archive-entry')];
const kind=document.querySelector('#archive-kind');
function filter() {
  const words=search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  let count=0;
  for(const entry of entries) { entry.hidden=(kind.value && entry.dataset.kind!==kind.value)||!words.every(word=>entry.dataset.search.includes(word)); if(!entry.hidden)count++; }
  for(const heading of document.querySelectorAll('.archive-year')) {
    let visible=false,node=heading.nextElementSibling;
    while(node && !node.classList.contains('archive-year')) {if(!node.hidden)visible=true;node=node.nextElementSibling;}
    heading.hidden=!visible;
  }
  document.querySelector('#archive-count').textContent=`${count} ${count===1?'entry':'entries'}`;
  document.querySelector('#archive-empty').hidden=count!==0;
}
search?.addEventListener('input',filter);
kind?.addEventListener('change',filter);

// Escape dismisses a thumbnail without following the link or moving focus.
const thumbnailLinks=[...document.querySelectorAll('.talk-title-thumbnail')];
for(const link of thumbnailLinks){
  link.addEventListener('mouseleave',()=>link.removeAttribute('data-preview-dismissed'));
  link.addEventListener('blur',()=>link.removeAttribute('data-preview-dismissed'));
}
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')for(const link of thumbnailLinks)link.setAttribute('data-preview-dismissed','');
});
