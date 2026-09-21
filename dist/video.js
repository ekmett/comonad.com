for(const figure of document.querySelectorAll('[data-video-id]')) {
  figure.querySelector('button')?.addEventListener('click',()=>{
    const id=figure.dataset.videoId;
    if(!/^[\w-]{11}$/.test(id))return;
    const frame=document.createElement('iframe');
    frame.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    frame.title=document.querySelector('h1').textContent;
    frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
    figure.querySelector('button').replaceWith(frame);
  });
}
