const search=document.querySelector('#archive-search');
const entries=[...document.querySelectorAll('.archive-entry')];
const kind=document.querySelector('#archive-kind');
const seriesEntries=[...document.querySelectorAll('.series-entry')];
const repositoryGroups=[...document.querySelectorAll('.archive-repositories')];
function filter() {
  const words=search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const series=kind.value==='Series';
  document.querySelector('.chronological').hidden=series;
  document.querySelector('.series-results').hidden=!series;
  let count=0;
  for(const entry of entries) { entry.hidden=(kind.value && entry.dataset.kind!==kind.value)||!words.every(word=>entry.dataset.search.includes(word)); if(!entry.hidden&&!series)count++; }
  let repositoryCount=0;
  for(const group of repositoryGroups) {
    let visible=0;
    for(const repo of group.children) {
      repo.hidden=(kind.value && kind.value!=='Repository')||!words.every(word=>repo.dataset.search.includes(word));
      if(!repo.hidden)visible++;
    }
    group.hidden=visible===0;
    repositoryCount+=visible;
  }
  for(const heading of document.querySelectorAll('.archive-year')) {
    let visible=false,node=heading.nextElementSibling;
    while(node && !node.classList.contains('archive-year')) {if(!node.hidden)visible=true;node=node.nextElementSibling;}
    heading.hidden=!visible;
  }
  for(const entry of seriesEntries){entry.hidden=!words.every(word=>entry.dataset.search.includes(word));if(series&&!entry.hidden)count++;}
  const counts=[];
  if(kind.value!=='Repository')counts.push(`${count} ${series?'series':count===1?'entry':'entries'}`);
  if(!kind.value||kind.value==='Repository')counts.push(`${repositoryCount} ${repositoryCount===1?'repository':'repositories'}`);
  document.querySelector('#archive-count').textContent=counts.join(' · ');
  document.querySelector('#archive-empty').hidden=count+repositoryCount!==0;
}
search?.addEventListener('input',filter);
kind?.addEventListener('change',filter);
