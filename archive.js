const search=document.querySelector('#archive-search');
const entries=[...document.querySelectorAll('.archive-entry')];
const kind=document.querySelector('#archive-kind');
const seriesEntries=[...document.querySelectorAll('.series-entry')];
function filter() {
  const words=search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const series=kind.value==='Series';
  document.querySelector('.chronological').hidden=series;
  document.querySelector('.series-results').hidden=!series;
  let count=0;
  for(const entry of entries) { entry.hidden=(kind.value && entry.dataset.kind!==kind.value)||!words.every(word=>entry.dataset.search.includes(word)); if(!entry.hidden&&!series)count++; }
  for(const heading of document.querySelectorAll('.archive-year')) {
    let visible=false,node=heading.nextElementSibling;
    while(node && !node.classList.contains('archive-year')) {if(!node.hidden)visible=true;node=node.nextElementSibling;}
    heading.hidden=!visible;
  }
  for(const entry of seriesEntries){entry.hidden=!words.every(word=>entry.dataset.search.includes(word));if(series&&!entry.hidden)count++;}
  document.querySelector('#archive-count').textContent=`${count} ${series?'series':count===1?'entry':'entries'}`;
  document.querySelector('#archive-empty').hidden=count!==0;
}
search?.addEventListener('input',filter);
kind?.addEventListener('change',filter);
