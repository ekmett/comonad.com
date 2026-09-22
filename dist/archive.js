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
