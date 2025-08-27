// year
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Mixing Lab
  const A = document.getElementById('mixA');
  const B = document.getElementById('mixB');
  const R = document.getElementById('mixRatio');
  const chipA = document.getElementById('chipA');
  const chipB = document.getElementById('chipB');
  const chipMix = document.getElementById('chipMix');
  const hex = document.getElementById('mixHex');
  const pctA = document.getElementById('mixPctA');
  const pctB = document.getElementById('mixPctB');
  const copyBtn = document.getElementById('copyHexBtn');
  const hint = document.getElementById('copyHint');

  function h2rgb(h){h=h.replace('#','');if(h.length===3)h=[...h].map(x=>x+x).join('');const n=parseInt(h,16);return [(n>>16)&255,(n>>8)&255,n&255]}
  function rgb2h([r,g,b]){return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase()}
  function mixHex(a,b,t){const A=h2rgb(a),B=h2rgb(b);const m=[0,1,2].map(i=>Math.round(A[i]*(1-t)+B[i]*t));return rgb2h(m)}
  function render(){
    const t = (+R.value)/100;
    const m = mixHex(A.value,B.value,t);
    chipA.style.background = A.value;
    chipB.style.background = B.value;
    chipMix.style.background = m;
    hex.textContent = m;
    pctA.textContent = String(Math.round((1-t)*100));
    pctB.textContent = String(Math.round(t*100));
  }
  [A,B,R].forEach(el=>el && el.addEventListener('input', render));
  copyBtn?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(hex.textContent); hint.textContent = 'Copied!'; setTimeout(()=>hint.textContent='',1500); } catch {}
  });
  render();

  // Ask live widget
  const pass = document.getElementById('pass');
  const tier = document.getElementById('tier');
  const save = document.getElementById('savePass');
  const q = document.getElementById('q');
  const ask = document.getElementById('askBtn');
  const out = document.getElementById('out');

  // remember pass locally (doesn't affect server list)
  const get = k => localStorage.getItem(k)||'';
  const set = (k,v) => localStorage.setItem(k,v);
  pass.value = get('ctc_pass') || '';
  tier.value = get('ctc_tier') || 'starter';
  save?.addEventListener('click', () => { set('ctc_pass', pass.value.trim()); set('ctc_tier', tier.value); out.textContent = 'Saved.'; });

  ask?.addEventListener('click', async () => {
    out.textContent = '…';
    try {
      const res = await fetch('/.netlify/functions/assistant', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'Authorization': `Bearer ${pass.value.trim()}`
        },
        body: JSON.stringify({ q: q.value })
      });
      const txt = await res.text();
      out.textContent = txt;
    } catch (e) {
      out.textContent = 'Network error';
    }
  });
});
