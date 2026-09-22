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
  function calendar(base, date = months.at(-1)) {
    const month = date.length >= 7 ? date.slice(0,7) : months.findLast(value => value.startsWith(date)) || months.at(-1);
    const index = months.indexOf(month), [year, number] = month.split('-').map(Number);
    const count = new Date(Date.UTC(year,number,0)).getUTCDate();
    const offset = (new Date(Date.UTC(year,number-1,1)).getUTCDay()+6)%7;
    const cells = Array.from({length:Math.ceil((offset+count)/7)*7}, (_,position) => {
      const day = position-offset+1;
      if(day<1 || day>count) return '<td></td>';
      const key = `${month}-${String(day).padStart(2,'0')}`;
      const entries = timeline.filter(item => item.date===key);
      const href = '#calendar-day-'+key;
      return `<td${key===date?' class="selected-day"':''}>${entries.length ? `<a href="${href}" aria-label="${day} ${monthLabel(month)}: ${escape(entries.map(item=>item.title).join('; '))}">${day}</a>` : day}</td>`;
    });
    const monthEntries = timeline.filter(item => item.date.startsWith(month));
    const days = [...new Set(monthEntries.map(item => item.date))].sort();
    const dayList = `<div class="calendar-posts"><h3>In this month</h3>${days.map(day => `<section class="calendar-day" id="calendar-day-${day}"><h4>${day.length===10 ? `<time datetime="${day}">${Number(day.slice(-2))} ${monthLabel(month).split(' ')[0]}</time>` : 'Day not recorded'}</h4><ul>${monthEntries.filter(item => item.date===day).map(item => `<li><a href="${base+item.path}">${escape(item.title)}</a>${item.kind==='Talk'?'<span class="calendar-kind">Talk</span>':''}</li>`).join('')}</ul></section>`).join('')}</div>`;
    const adjacent = (value,label) => value ? `<a href="${base+monthPath(value)}" aria-label="${label}: ${monthLabel(value)}">${label==='Earlier month'?'←':'→'}</a>` : '<span></span>';
    return `<aside class="archive-sidebar" aria-label="Archive calendar"><details class="archive-disclosure"><summary class="archive-toggle"><span>Archive</span><span class="archive-toggle-icon" aria-hidden="true">‹</span></summary><div class="archive-panel"><nav class="calendar-month" aria-label="Archive months">${adjacent(months[index-1],'Earlier month')}<a href="${base+monthPath(month)}">${monthLabel(month)}</a>${adjacent(months[index+1],'Later month')}</nav><table class="calendar"><caption class="visually-hidden">Posts and talks in ${monthLabel(month)}</caption><thead><tr>${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day=>`<th scope="col"><abbr title="${day}">${day.slice(0,2)}</abbr></th>`).join('')}</tr></thead><tbody>${Array.from({length:cells.length/7},(_,row)=>'<tr>'+cells.slice(row*7,row*7+7).join('')+'</tr>').join('')}</tbody></table><p class="calendar-note">Choose a day to find its writing and talks below.</p>${dayList}<details class="calendar-years"><summary>Browse by year</summary>${[...new Set(timeline.map(item=>item.date.slice(0,4)))].map(year=>`<details${date.startsWith(year)?' open':''}><summary><a href="${base}reader/${year}/">${year}</a></summary><div>${months.filter(month=>month.startsWith(year)).map(month=>`<a href="${base+monthPath(month)}"${date.startsWith(month)?' aria-current="date"':''}>${monthLabel(month).split(' ')[0]}</a>`).join('')}</div></details>`).join('')}</details></div></details></aside>`;
  }
  return {months, monthPath, monthLabel, neighbors, calendar};
}
