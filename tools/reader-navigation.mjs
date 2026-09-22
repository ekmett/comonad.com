const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function readerNavigation(timeline) {
  const months = [...new Set(timeline.filter(item => item.date.length >= 7).map(item => item.date.slice(0,7)))].sort();
  const monthPath = month => `reader/${month.replace('-', '/')}/`;
  const monthLabel = month => new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB', {month:'long',year:'numeric',timeZone:'UTC'});
  function neighbors(item, base) {
    const index = timeline.findIndex(entry => entry.path === item.path);
    const link = (entry, direction, label) => entry ? `<a rel="${direction}" href="${base+entry.path}"><span>${label}</span>${escape(entry.title)}</a>` : '<span></span>';
    return `<nav class="post-navigation" aria-label="Chronological navigation">${link(timeline[index+1],'prev','← Previous · older')}<a class="all-entries" href="${base}reader/">Archive</a>${link(timeline[index-1],'next','Next · newer →')}</nav>`;
  }
  const years=[...new Set(timeline.map(item=>item.date.slice(0,4)))].sort();
  function calendar(base, date = years.at(-1)) {
    const year=date.slice(0,4),yearIndex=years.indexOf(year);
    const yearEntries=timeline.filter(item=>item.date.startsWith(year));
    const monthKeys=Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`);
    const yearLink=(value,label)=>value?`<a href="${base}reader/${value}/" aria-label="${label}: ${value}">${label==='Earlier year'?'←':'→'}</a>`:'<span></span>';
    const monthName=month=>monthLabel(month).replace(/ \d{4}$/,'');
    const monthGrid=`<nav class="archive-month-grid" aria-label="Months in ${year}">${monthKeys.map(month=>{
      const count=yearEntries.filter(item=>item.date.startsWith(month)).length;
      return count?`<a href="#calendar-month-${month}" aria-label="${monthName(month)} ${year}: ${count} entries"${date.startsWith(month)?' aria-current="date"':''}><span>${monthName(month).slice(0,3)}</span><small>${count}</small></a>`:`<span class="empty-month">${monthName(month).slice(0,3)}</span>`;
    }).join('')}</nav>`;
    const dayList=items=>[...new Set(items.map(item=>item.date))].sort().map(day=>`<section class="calendar-day" id="calendar-day-${day}"><h4>${day.length===10?`<time datetime="${day}">${Number(day.slice(-2))} ${monthName(day.slice(0,7))}</time>`:'Day not recorded'}</h4><ul>${items.filter(item=>item.date===day).reverse().map(item=>`<li><a href="${base+item.path}">${escape(item.title)}</a>${item.kind!=='Article'?`<span class="calendar-kind">${escape(item.kind)}</span>`:''}</li>`).join('')}</ul></section>`).join('');
    const list=monthKeys.filter(month=>yearEntries.some(item=>item.date.startsWith(month))).map(month=>{
      const entries=yearEntries.filter(item=>item.date.startsWith(month));
      return `<details class="archive-month-posts" id="calendar-month-${month}"${date.startsWith(month)?' open':''}><summary>${monthName(month)} <span>${entries.length}</span></summary><a class="month-page" href="${base+monthPath(month)}">${monthName(month)} archive →</a>${dayList(entries)}</details>`;
    }).join('');
    const undated=yearEntries.filter(item=>item.date.length===4);
    return `<aside class="archive-sidebar" aria-label="Yearly archive"><details class="archive-disclosure"><summary class="archive-toggle"><span>Archive</span><span class="archive-toggle-icon" aria-hidden="true">‹</span></summary><div class="archive-panel"><nav class="calendar-month calendar-year" aria-label="Archive years">${yearLink(years[yearIndex-1],'Earlier year')}<a href="${base}reader/${year}/">${year}</a>${yearLink(years[yearIndex+1],'Later year')}</nav>${monthGrid}<div class="calendar-posts"><h3>In ${year}</h3>${list}${undated.length?`<details class="archive-month-posts"><summary>Month not recorded <span>${undated.length}</span></summary>${dayList(undated)}</details>`:''}</div><details class="calendar-years"><summary>All years</summary><nav aria-label="All archive years">${[...years].reverse().map(value=>`<a href="${base}reader/${value}/"${year===value?' aria-current="date"':''}>${value}</a>`).join('')}</nav></details></div></details></aside>`;
  }
  return {months, monthPath, monthLabel, neighbors, calendar};
}
