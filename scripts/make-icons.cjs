// Renders scripts/icon.svg to the PNG icons the PWA needs (uses Playwright).
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const svg = fs.readFileSync(__dirname + '/icon.svg', 'utf8');
  const b = await chromium.launch();
  const p = await b.newPage();
  const shot = async (size, out, pad = 0) => {
    await p.setViewportSize({ width: size, height: size });
    const inner = size - pad * 2;
    await p.setContent(`<body style="margin:0;background:#FF6B35;display:grid;place-items:center;width:${size}px;height:${size}px"><div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body>`);
    await p.screenshot({ path: out });
  };
  await shot(180, 'public/icons/apple-touch-icon.png');
  await shot(192, 'public/icons/icon-192.png');
  await shot(512, 'public/icons/icon-512.png');
  await shot(512, 'public/icons/icon-maskable-512.png', 56);
  await shot(32, 'public/icons/favicon-32.png');
  await b.close();
})();
