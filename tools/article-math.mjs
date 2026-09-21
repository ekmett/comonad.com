// The historical CRC derivations are plain-text mathematics, not Haskell.
// Keep their source intact and typeset only the notation they already contain.
export function crcMath(source) {
  const expression = text => text.trim()
    .replace(/\*/g, '\\cdot ')
    .replace(/\^([0-9]+|[a-z])/g, '^{$1}')
    .replace(/\b([ar])([12])\b/g, '$1_{$2}')
    .replace(/`xor`/g, '\\mathbin{\\mathrm{xor}}')
    .replace(/\b(crc|CRC)\b/g, '\\operatorname{$1}')
    .replace(/\b(INIT|FINAL)\b/g, '\\mathrm{$1}');
  const lines = source.trim().split('\n').map(line => {
    const split = line.indexOf('--');
    return split === -1 ? {value:line.trim(), note:''} : {value:line.slice(0,split).trim(), note:line.slice(split+2).trim()};
  });
  if (lines.length === 1) return expression(lines[0].value);
  const rows = lines.map((line, i) => {
    const value = expression(line.value.replace(/\s*=\s*$/, ''));
    // An end-of-line comment describes the transition to the next line.
    const note = i ? lines[i-1].note : '';
    const noteTex = note ? (/crc\(/.test(note) ? expression(note) : `\\text{${note}}`) : '';
    return `${i ? '{}=' : ''} & ${value}${note ? ' && ' + noteTex : ''}`;
  });
  return '\\begin{aligned}\n' + rows.join(' \\\\\n') + '\n\\end{aligned}';
}
