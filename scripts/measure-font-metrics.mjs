import { chromium } from 'playwright';
const PORT = process.env.PORT || '4322';
const URL = `http://localhost:${PORT}/`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);

// 1. Are both heading fonts actually loaded now?
const loaded = await p.evaluate(() => ({
  instrument: document.fonts.check('600 80px "Instrument Sans"'),
  chakra: document.fonts.check('600 80px "Chakra Petch"'),
}));
console.log('fonts loaded:', loaded);

// 2. Width ratio: render the headline text in each face at the same size.
const metrics = await p.evaluate(() => {
  function measure(family) {
    const s = document.createElement('span');
    s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:600 80px "${family}";letter-spacing:-0.025em;`;
    s.textContent = 'I build applied-AI tools that ship.';
    document.body.appendChild(s);
    const w = s.getBoundingClientRect().width;
    // line box height under normal line-height (font-metric dependent)
    s.style.whiteSpace = 'normal';
    s.style.lineHeight = 'normal';
    s.textContent = 'Mg';
    const lh = s.getBoundingClientRect().height;
    s.remove();
    return { width: w, normalLineHeight: lh };
  }
  const inst = measure('Instrument Sans');
  const chak = measure('Chakra Petch');
  return { inst, chak, widthRatio: inst.width / chak.width, lhRatio: inst.normalLineHeight / chak.normalLineHeight };
});
console.log('Instrument:', metrics.inst);
console.log('Chakra    :', metrics.chak);
console.log('width ratio (inst/chak):', metrics.widthRatio.toFixed(4), '=> size-adjust for Chakra:', (metrics.widthRatio * 100).toFixed(2) + '%');
console.log('normal-line-height ratio (inst/chak):', metrics.lhRatio.toFixed(4));

await b.close();
