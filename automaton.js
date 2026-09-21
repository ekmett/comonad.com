import {createEngine} from './engine.js';
const rule=document.querySelector('#automaton-rule'),seed=document.querySelector('#automaton-seed'),canvas=document.querySelector('#automaton-canvas'),status=document.querySelector('#automaton-status');
try {
  const engine=await createEngine(),width=129,rows=80;
  const draw=()=>{
    if(!rule.checkValidity()){status.textContent='Choose a whole-number rule from 0 to 255.';return;}
    let cells=new Uint8Array(width+2*rows),middle=Math.floor(cells.length/2);
    if(seed.value==='alternating')cells=cells.map((_,i)=>i%2);
    else {cells[middle]=1;if(seed.value==='pair')cells[middle+4]=1;}
    const context=canvas.getContext('2d');
    context.fillStyle='#fafaf7';context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle='#3b6544';
    for(let y=0;y<rows;y++){
      const start=(cells.length-width)/2;
      for(let x=0;x<width;x++)if(cells[start+x])context.fillRect(x*4,y*4,4,4);
      if(y<rows-1)cells=engine.automatonStep(Number(rule.value),cells);
    }
    status.textContent=`Rule ${rule.value}, ${rows} generations.`;
    canvas.setAttribute('aria-label',`Rule ${rule.value}, ${seed.selectedOptions[0].text.toLowerCase()}, ${rows} generations with time running downward.`);
  };
  rule.addEventListener('input',draw);seed.addEventListener('change',draw);draw();
} catch(error){status.textContent='The interactive figure could not load. The original Haskell remains available below.';console.error(error);}
