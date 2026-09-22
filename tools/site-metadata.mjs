// The hosting root and the blog path are distinct: /comonad.com/ + reader/
// today; / + reader/ after the custom-domain migration.
export function createSite(config) {
  const base=new URL(config.baseUrl);
  if(!['https:','http:'].includes(base.protocol)||base.search||base.hash||!base.pathname.endsWith('/'))throw new Error('Site baseUrl must be an HTTP(S) directory URL with a trailing slash');
  const url=route=>{
    if(route.startsWith('/')||route.split('/').includes('..'))throw new Error('Site paths must be relative to the hosting root');
    return new URL(route,base).href;
  };
  const readerUrl=url(config.readerPath);
  function metadata({title,route,entry,description}) {
    const pageUrl=url(route||config.readerPath);
    const people=(entry?.authors||entry?.speakers||(entry?.author?[entry.author]:[])).map(name=>({'@type':'Person',name}));
    const type=entry?.videoId?'VideoObject':entry?.kind==='Paper'?'ScholarlyArticle':entry?.slug?'BlogPosting':entry?'PresentationDigitalDocument':'CollectionPage';
    const data={'@context':'https://schema.org','@type':type,'@id':pageUrl+'#content',url:pageUrl,name:title,inLanguage:'en',description,isPartOf:{'@type':'WebSite','@id':readerUrl+'#website',name:'The Comonad.Reader',url:readerUrl}};
    if(entry){
      data.mainEntityOfPage={'@type':'WebPage','@id':pageUrl};
      if(people.length)data.author=people;
      if(['BlogPosting','ScholarlyArticle'].includes(type))data.headline=title;
      // Never manufacture publication days or promote ambiguous revision dates.
      const published=entry.videoId?entry.uploadDate:entry.source==='School of Haskell'?null:entry.date;
      if(/^\d{4}-\d{2}-\d{2}$/.test(published||''))data[entry.videoId?'uploadDate':'datePublished']=published;
      if(entry.categories)data.keywords=entry.categories.split(' · ');
      if(entry.videoId){
        data.embedUrl=`https://www.youtube-nocookie.com/embed/${entry.videoId}?playsinline=1`;
        if(entry.durationSeconds)data.duration=`PT${entry.durationSeconds}S`;
      }
      if(entry.pdf)data.encoding={'@type':'MediaObject',contentUrl:url(entry.pdf),encodingFormat:'application/pdf'};
    }
    return {pageUrl,data};
  }
  return {url,readerUrl,metadata};
}
