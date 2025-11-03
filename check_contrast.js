// Simple WCAG contrast checker for a few key color pairs
// Usage: node check_contrast.js

function hexToRgb(hex) {
  hex = hex.replace('#','');
  if (hex.length === 3) hex = hex.split('').map(h=>h+h).join('');
  const num = parseInt(hex,16);
  return [(num>>16)&255, (num>>8)&255, num&255];
}

function luminance(r,g,b) {
  const srgb = [r,g,b].map(v=>v/255).map(v=> v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4));
  return 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
}

function contrast(hex1, hex2) {
  const [r1,g1,b1] = hexToRgb(hex1);
  const [r2,g2,b2] = hexToRgb(hex2);
  const L1 = luminance(r1,g1,b1);
  const L2 = luminance(r2,g2,b2);
  const lighter = Math.max(L1,L2);
  const darker = Math.min(L1,L2);
  return +( (lighter + 0.05) / (darker + 0.05) ).toFixed(2);
}

function passLevel(ratio, size='normal'){
  // normal text: AA >= 4.5, AAA >= 7
  // large text (>=18pt or 14pt bold): AA >= 3, AAA >= 4.5
  const aa = (size==='large') ? 3.0 : 4.5;
  const aaa = (size==='large') ? 4.5 : 7.0;
  return {ratio, AA: ratio>=aa, AAA: ratio>=aaa};
}

const tests = [
  {name:'Light theme - body text on bg', fg:'#0f172a', bg:'#f7fafc'},
  {name:'Light theme - primary button (white on primary)', fg:'#ffffff', bg:'#0b61ff'},
  {name:'Classic theme - body text on bg', fg:'#0b2a2f', bg:'#fbfaf6'},
  {name:'Classic theme - primary button (white on primary)', fg:'#ffffff', bg:'#1f3a55'},
  {name:'Dark theme - body text on bg', fg:'#eaf4ff', bg:'#001226'},
  {name:'Dark theme - primary button (white on primary)', fg:'#ffffff', bg:'#001540'},
  {name:'Dark theme - muted on surface', fg:'#9fb0c8', bg:'#041425'},
];

console.log('WCAG Contrast Report\n---------------------');
for (const t of tests){
  const r = contrast(t.fg, t.bg);
  const res = passLevel(r, t.name.includes('button')? 'large':'normal');
  console.log(`${t.name}: ${t.fg} on ${t.bg} => ratio ${r} | AA: ${res.AA} | AAA: ${res.AAA}`);
}
