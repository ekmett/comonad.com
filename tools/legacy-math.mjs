// Adapt old proof.sty notation; arguments and labels remain those of the source.
export function legacyMath(tex) {
  let pos=0;
  // Use an independent balanced reader: premises/conclusions may contain braces.
  function braces(open='{',close='}') {
    while(pos<tex.length && /\s/.test(tex[pos]))pos++;
    if(tex[pos]!==open)throw new Error('Expected '+open+' in '+tex);
    const start=++pos;let depth=1;
    while(pos<tex.length) {
      if(tex[pos]==='\\') {pos+=2;continue;}
      if(tex[pos]===open)depth++;
      if(tex[pos]===close) {depth--;if(depth===0){const result=tex.slice(start,pos);pos++;return result;}}
      pos++;
    }
    throw new Error('Unclosed group in '+tex);
  }
  let result='',cursor=0;
  while((pos=tex.indexOf('\\inference',cursor))>=0) {
    result+=tex.slice(cursor,pos);pos+='\\inference'.length;
    const premise=braces().replace(/&/g,'\\qquad '),conclusion=braces();
    while(pos<tex.length && /\s/.test(tex[pos]))pos++;
    let label='';
    if(tex[pos]==='[') label=braces('[',']').split('$').map((part,i)=>i%2?part:part?`\\text{${part}}`:'').join('');
    result+=`\\frac{${premise}}{${conclusion}}${label?'\\;'+label:''}`;cursor=pos;
  }
  result+=tex.slice(cursor);
  return result.replaceAll('\\binampersand','\\mathbin{\\&}').replaceAll('\\varominus','\\ominus').replaceAll('\\varobar','\\mathbin{\\text{⦶}}');
}
