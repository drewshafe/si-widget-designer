/* ShipInsure Info Lightbox — the modal a shopper sees after clicking the widget's ⓘ.
 *
 * One renderer for every place it shows: the Lightbox designer (lightbox.html), the Checkout
 * Experience preview and merchant link (index.html), and the SI Interactive Demo (demo.html).
 * Its settings mirror the Merchant Portal's widget-config "Modal" tab (Preact multi-widget script):
 * Title, Modal Feature List (first | second text), Show Modal Footer, container / title / feature
 * styles, Modal Header Border Color, Default Logo Color, Modal Logo and Modal Banner.
 *
 *   SILightbox.html(cfg, { narrow })       → the modal's HTML (no backdrop)
 *   SILightbox.open(cfg, { host, narrow }) → shows it over host (default: the page); returns the overlay
 *   SILightbox.close(host)
 *   SILightbox.bind(root, getCfg, opts)    → clicking an ⓘ inside root opens getCfg()'s lightbox
 *   SILightbox.norm(cfg)                   → cfg with every default filled in
 *   SILightbox.portalText(cfg)             → the settings as text, laid out like the Portal's Modal tab
 */
(function () {
  const BASE = (function () {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/[^/]*$/, '') : 'https://drewshafe.github.io/si-widget-designer/';
  })();

  const FEATURES = [
    { a: 'Effortless Protection', b: 'Loss, damage, or theft' },
    { a: 'Instant Approval', b: 'Start to finish coverage' },
    { a: 'One-Click Claims', b: '99% claim approval rate' }
  ];
  // Defaults = what the Portal's modal shows with its fields left empty.
  const DEFAULTS = {
    variant: 'cart',                    // 'cart' (cart widgets: toggle, checkbox, dual checkout, info only) | 'checkout' (Checkout Extension)
    title: 'Stay protected during the shipping process',
    features: FEATURES,
    footer: true,
    privacyUrl: 'https://shipinsure.io/privacy-policy',
    termsUrl: 'https://shipinsure.io/terms-of-service',
    banner: 'default',                  // 'default' | 'none' | an image URL / data URL
    banSrc: '',                         // 'folder' = the merchant folder's brand-kit banner ('' = uploaded / default)
    banFit: 'cover',                    // 'cover' (fill, cropped at banPos) | 'contain' (whole image)
    banPos: '50% 50%',                  // crop focus (background-position)
    logo: '',                           // '' = the ShipInsure lock (si-lock.png); else an image URL / data URL
    logoKind: '',                       // 'lock' = a custom lock from the Lock builder (shown like the SI lock); '' = a logo in a white tile
    logoSrc: '',                        // 'folder:<slot>' = from the merchant folder's brand kit (main, secondary, hero, favicon)
    logoFit: 'contain',                 // tile logo: 'contain' (whole logo) | 'cover' (fills the tile, cropped at logoPos)
    logoPos: '50% 50%',
    logoColor: '#6675FF',
    headerBorder: '#6675FF',
    box:    { bg: '#ffffff', border: '#e3e5ee', bw: 0, radius: 8, pad: 24 },
    tStyle: { font: '', size: 22, weight: 700, color: '#2f3146' },   // big and bold, as the live modals show it
    f1:     { font: '', size: 12, weight: 600, color: '#1f2433' },
    f2:     { font: '', size: 12, weight: 400, color: '#6675FF' },
    font: ''                            // base font for the whole lightbox (the store's), '' = Open Sans
  };
  const POS = p => /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(String(p || '')) ? p : '50% 50%';
  const SYS = /^(arial|helvetica|helvetica neue|times|times new roman|georgia|verdana|system-ui|sans-serif|serif|inherit)$/i;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hex = (c, d) => /^#[0-9a-f]{3,8}$/i.test(String(c || '').trim()) ? String(c).trim() : d;
  const num = (v, d, lo, hi) => { const n = parseFloat(v); return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const fam = f => String(f || '').replace(/['";<>{}]/g, '').trim();
  const url = u => { u = String(u || '').trim(); return /^(https?:|data:image\/|blob:)/i.test(u) || /^[\w./-]+\.(png|jpe?g|gif|webp|svg)$/i.test(u) ? u.replace(/["'()\\<>]/g, encodeURIComponent) : ''; };

  function norm(c) {
    c = c || {};
    const o = Object.assign({}, DEFAULTS, c);
    ['box', 'tStyle', 'f1', 'f2'].forEach(k => { o[k] = Object.assign({}, DEFAULTS[k], c[k] || {}); });
    o.features = Array.isArray(c.features) ? c.features.filter(f => f && (String(f.a || '').trim() || String(f.b || '').trim())).map(f => ({ a: String(f.a || ''), b: String(f.b || '') })) : FEATURES.slice();
    o.variant = o.variant === 'checkout' ? 'checkout' : 'cart';
    // Saves made with the old small title default (13 / 600) get the new big, bold one.
    if (c.tStyle && +c.tStyle.size === 13 && +c.tStyle.weight === 600) { o.tStyle.size = DEFAULTS.tStyle.size; o.tStyle.weight = DEFAULTS.tStyle.weight; if (/^#1f2433$/i.test(c.tStyle.color || '')) o.tStyle.color = DEFAULTS.tStyle.color; }
    o.banFit = o.banFit === 'contain' ? 'contain' : 'cover';
    o.logoFit = o.logoFit === 'cover' ? 'cover' : 'contain';
    o.banPos = POS(o.banPos); o.logoPos = POS(o.logoPos);
    return o;
  }

  // Google Fonts for any family the lightbox uses (system fonts are skipped).
  const loaded = {};
  function loadFont(f) {
    f = fam(f); if (!f || SYS.test(f) || loaded[f]) return;
    loaded[f] = 1;
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css?family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':400,500,600,700&display=swap';
    document.head.appendChild(l);
  }

  const CSS = `
.silb-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(17,20,33,.55);display:flex;align-items:center;justify-content:center;padding:16px;animation:silbFade .18s ease}
.silb-ov.in-host{position:absolute}
.silb-ov.silb-sheet{align-items:flex-end;padding:0}
@keyframes silbFade{from{opacity:0}to{opacity:1}}
@keyframes silbUp{from{transform:translateY(14px);opacity:.4}to{transform:none;opacity:1}}
.silb{position:relative;width:420px;max-width:100%;max-height:100%;overflow:auto;box-sizing:border-box;box-shadow:0 18px 50px rgba(15,18,40,.28);animation:silbUp .22s ease;-webkit-font-smoothing:antialiased;text-align:left;line-height:1.5}
.silb *{box-sizing:border-box}
.silb-x{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,.92);color:#2a2f45;font:600 15px/28px system-ui,sans-serif;text-align:center;cursor:pointer;padding:0;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,.18)}
.silb-ban{position:relative;height:180px;background:#2c2f6b center/cover no-repeat;border-bottom:6px solid var(--hb)}
.silb-ban.silb-none{height:58px;background:var(--hb);border-bottom:0}
.silb-logo{position:absolute;left:22px;bottom:-26px;width:64px;height:84px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.18))}
.silb-logo img.silb-own{position:absolute;left:0;bottom:0;width:76px;height:76px;background:#fff;border-radius:6px;padding:7px;box-sizing:border-box}
.silb-logo img.silb-own.cover{padding:0}
.silb-lock{position:absolute;left:-10px;bottom:0;width:84px;height:84px;display:block;isolation:isolate}
.silb-lock img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.silb-body{padding:40px var(--pd) 22px}
.silb-t{margin:0 0 18px}
.silb-fl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.silb-f{display:flex;align-items:center;gap:10px;flex-wrap:nowrap}
.silb-f>span{flex:0 0 auto;white-space:nowrap}
@media (max-width:480px){.silb.silb-cart .silb-body{padding-left:18px;padding-right:18px}.silb.silb-cart .silb-f{gap:8px}}
.silb-ck{flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:var(--ckbg);display:inline-flex;align-items:center;justify-content:center}
.silb-sep{opacity:.9;margin:0 2px}
.silb-foot{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:24px;font:400 12px/1.4 var(--ff);color:#6b7085}
.silb-foot a{color:#6b7085;text-decoration:underline}
.silb-pw{display:inline-flex;align-items:center;gap:6px}
.silb-pwl{height:15px;width:auto;display:block;filter:brightness(.66)}
/* Checkout Extension: Shopify checkout's own modal (title bar, close, divider) in the store's font */
.silb.silb-co{width:520px}
.silb.silb-co .silb-hd{display:flex;align-items:center;gap:12px;padding:16px var(--pd);border-bottom:1px solid #e6e6e6}
.silb.silb-co .silb-hd .silb-t{margin:0;flex:1}
.silb.silb-co .silb-x{position:static;background:none;box-shadow:none;width:30px;height:30px;font-size:17px;color:#545454}
.silb.silb-co .silb-body{padding:18px var(--pd) 20px}
.silb.silb-co .silb-ban{height:150px;border-radius:8px;border-bottom:0;margin-bottom:18px}
.silb.silb-co .silb-ban.silb-none{display:none}
.silb.silb-co .silb-cobtn{display:block;width:100%;margin-top:20px;padding:13px;border:1px solid #d9d9d9;border-radius:5px;background:#fff;font:600 14px var(--ff);color:#1f1f1f;cursor:pointer}
/* Canvas editor: every part shows it can be clicked */
.silb-edit [data-silb]{cursor:pointer}
.silb-edit [data-silb="title"],.silb-edit [data-silb="fa"],.silb-edit [data-silb="fb"]{cursor:text;border-radius:4px;outline:1px dashed transparent;outline-offset:2px;min-width:12px;display:inline-block}
.silb-edit .silb-t[data-silb]{display:block}
.silb-edit [data-silb]:not([data-silb="box"]):hover{outline:1px dashed #9aa5ff;outline-offset:2px}
.silb-edit [data-silb].silb-on,.silb-edit [contenteditable]:focus{outline:2px solid #6675ff;outline-offset:2px}
.silb-edit [data-silb]:empty::before{content:attr(data-ph);opacity:.4}
.silb.silb-sheet{width:100%;border-radius:16px 16px 0 0 !important;max-height:88%}
.silb.silb-cart.silb-sheet{border-radius:14px 14px 0 0 !important}
`;
  let cssIn = false;
  function css() { if (cssIn) return; cssIn = true; const s = document.createElement('style'); s.id = 'silb-css'; s.textContent = CSS; document.head.appendChild(s); }

  const fst = (s, base) => `font-family:${fam(s.font) ? `'${fam(s.font)}',` : ''}${base};font-size:${num(s.size, 12, 8, 40)}px;font-weight:${num(s.weight, 600, 100, 900)};color:${hex(s.color, '#1f2433')};`;
  const CHECK = c => `<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.2 6.3l2.4 2.4 5.2-5.4" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // The lock over the banner: ShipInsure's own si-lock.png (the Rep Hub's), or a custom lock from the Lock builder.
  const LOCK = src => `<span class="silb-lock"><img src="${src}" alt=""></span>`;
  // "Powered by" uses ShipInsure's own light gray logo.
  const MARK = `<img class="silb-pwl" src="${BASE}si-logo-grey.png" alt="ShipInsure">`;

  function html(cfg, opts) {
    const c = norm(cfg), o = opts || {};
    const ff = `${fam(c.font) ? `'${fam(c.font)}',` : ''}'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
    [c.font, c.tStyle.font, c.f1.font, c.f2.font].forEach(loadFont);
    loadFont('Open Sans');
    const hb = hex(c.headerBorder, '#6675FF'), lc = hex(c.logoColor, '#6675FF');
    const ck = hex(c.f2.color, '#6675FF');
    const b = c.box, pd = num(b.pad, 24, 0, 60);
    const boxSt = `--ff:${ff};--hb:${hb};--pd:${pd}px;--ckbg:${ck}1f;font-family:${ff};background:${hex(b.bg, '#ffffff')};border:${num(b.bw, 0, 0, 12)}px solid ${hex(b.border, '#e3e5ee')};border-radius:${num(b.radius, 8, 0, 40)}px;`;
    const banSrc = c.banner === 'none' ? '' : c.banner === 'default' || !c.banner ? BASE + 'lightbox-banner.png' : url(c.banner);
    // data-silb marks each part, so the canvas editor (lightbox.html?canvas=1) can edit it in place.
    const ed = !!o.edit;
    const feats = `<ul class="silb-fl">${c.features.map((f, i) => `<li class="silb-f"><span class="silb-ck">${CHECK(ck)}</span><span data-silb="fa" data-i="${i}" data-ph="First text" style="${fst(c.f1, ff)}">${esc(f.a)}</span>${(f.a && f.b) || ed ? `<span class="silb-sep" style="${fst(c.f1, ff)}">&nbsp;|&nbsp;</span>` : ''}<span data-silb="fb" data-i="${i}" data-ph="Second text" style="${fst(c.f2, ff)}">${esc(f.b)}</span></li>`).join('')}</ul>`;
    const foot = c.footer ? `<div class="silb-foot" data-silb="footer"><span class="silb-pw">Powered by ${MARK}</span><a href="${esc(url(c.privacyUrl) || DEFAULTS.privacyUrl)}" target="_blank" rel="noopener">Privacy</a><a href="${esc(url(c.termsUrl) || DEFAULTS.termsUrl)}" target="_blank" rel="noopener">Terms</a></div>` : '';
    const tSt = c.variant === 'checkout' ? Object.assign({}, c.tStyle, { size: Math.min(num(c.tStyle.size, 22, 8, 40), 18) }) : c.tStyle;   // Shopify's title bar
    const title = `<div class="silb-t" data-silb="title" data-ph="Title" style="${fst(tSt, ff)};line-height:1.25">${esc(c.title)}</div>`;
    const cls = 'silb ' + (c.variant === 'checkout' ? 'silb-co' : 'silb-cart') + (o.narrow ? ' silb-sheet' : '') + (ed ? ' silb-edit' : '');
    const ban = `<div class="silb-ban${banSrc ? '' : ' silb-none'}" data-silb="banner"${banSrc ? ` style="background-image:url('${banSrc}');background-size:${c.banFit};background-position:${c.banPos}${c.banFit === 'contain' ? `;background-color:${hex(b.bg, '#ffffff')}` : ''}"` : ''}>`;
    if (c.variant === 'checkout') {
      return `<div class="${cls}" data-silb="box" role="dialog" aria-modal="true" aria-label="${esc(c.title)}" style="${boxSt}">
<div class="silb-hd">${title}<button type="button" class="silb-x" aria-label="Close" data-silb-close>✕</button></div>
<div class="silb-body">${ban}</div>${feats}${foot}<button type="button" class="silb-cobtn" data-silb-close>Close</button></div></div>`;
    }
    const logo = !url(c.logo) ? `<span class="silb-logo" data-silb="logo">${LOCK(BASE + 'si-lock.png')}</span>`
      : c.logoKind === 'lock' ? `<span class="silb-logo" data-silb="logo">${LOCK(url(c.logo))}</span>`
      : `<span class="silb-logo" data-silb="logo"><img class="silb-own${c.logoFit === 'cover' ? ' cover' : ''}" src="${url(c.logo)}" alt="" style="object-fit:${c.logoFit};object-position:${c.logoPos}"></span>`;
    return `<div class="${cls}" data-silb="box" role="dialog" aria-modal="true" aria-label="${esc(c.title)}" style="${boxSt}">
<button type="button" class="silb-x" aria-label="Close" data-silb-close>✕</button>
${ban}${logo}</div>
<div class="silb-body">${title}${feats}${foot}</div></div>`;
  }

  // Every feature line stays on one line (first text | second text): when any line is too wide, all the
  // feature texts shrink by the same factor (as the live script does on phones). Refits on resize and typing.
  function fit(root) {
    (root && root.querySelectorAll ? root : document).querySelectorAll('.silb').forEach(box => {
      const run = () => {
        const rows = [...box.querySelectorAll('.silb-f')]; if (!rows.length) return;
        const spans = rows.flatMap(r => [...r.querySelectorAll('[data-silb="fa"], [data-silb="fb"], .silb-sep')]);
        spans.forEach(el => { if (!el.dataset.fs) el.dataset.fs = parseFloat(el.style.fontSize) || 12; el.style.fontSize = el.dataset.fs + 'px'; });
        for (let pass = 0; pass < 3; pass++) {
          let k = 1;
          rows.forEach(r => { const need = r.scrollWidth, have = r.clientWidth; if (have > 0 && need > have + 0.5) k = Math.min(k, have / need); });
          if (k >= 0.999) break;
          spans.forEach(el => { el.style.fontSize = Math.max(7, parseFloat(el.style.fontSize) * k * 0.995) + 'px'; });
        }
      };
      run();
      if (!box._silbFit) {
        box._silbFit = true;
        if (window.ResizeObserver) new ResizeObserver(() => run()).observe(box);
        box.addEventListener('input', run);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
      }
    });
  }

  function close(host) {
    const root = host || document.body;
    root.querySelectorAll(':scope > .silb-ov').forEach(o => o.remove());
  }
  function open(cfg, opts) {
    css();
    const o = opts || {}, host = o.host || document.body;
    close(host);
    const inHost = host !== document.body;
    if (inHost && getComputedStyle(host).position === 'static') host.style.position = 'relative';
    // On a phone the Checkout Extension's modal is a bottom sheet (Shopify checkout); a cart widget's is a centered card.
    const narrow = o.narrow != null ? o.narrow : norm(cfg).variant === 'checkout' && (inHost ? host.clientWidth : innerWidth) < 480;
    const ov = document.createElement('div');
    ov.className = 'silb-ov' + (inHost ? ' in-host' : '') + (narrow ? ' silb-sheet' : '');
    ov.innerHTML = html(cfg, { narrow });
    ov.addEventListener('click', e => {
      if (e.target === ov || e.target.closest('[data-silb-close]')) { e.preventDefault(); ov.remove(); o.onClose && o.onClose(); }
    });
    host.appendChild(ov);
    fit(ov);
    return ov;
  }
  const INFO = '[data-si-info], .wp-info-btn, .wp-leaf-icon, .mk2-hot';
  function bind(root, getCfg, opts) {
    if (!root || root._silbBound) return;
    root._silbBound = true;
    root.addEventListener('click', e => {
      const hit = e.target.closest && e.target.closest(INFO);
      if (!hit || !root.contains(hit)) return;
      const cfg = getCfg(hit); if (!cfg) return;
      e.preventDefault(); e.stopPropagation();
      const o = Object.assign({}, opts || {});
      if (typeof o.host === 'function') o.host = o.host(hit);
      open(cfg, o);
    }, true);
  }
  function portalText(cfg) {
    const c = norm(cfg), s = (k, st) => `${k}: font ${fam(st.font) || '(default)'}, size ${st.size}, weight ${st.weight}, color ${st.color}`;
    return [
      'Merchant Portal → Merchants → General Widget Setup → (configuration) → Modal',
      'Title: ' + c.title,
      'Modal Feature List:',
      ...c.features.map((f, i) => `  ${i + 1}. ${f.a}  |  ${f.b}`),
      'Show Modal Footer: ' + (c.footer ? 'on' : 'off'),
      `Modal Container Style: background ${c.box.bg}, border ${c.box.border}, border width ${c.box.bw}, radius ${c.box.radius}, padding ${c.box.pad}`,
      s('Modal Title Style', c.tStyle),
      'Modal Header Border Color: ' + c.headerBorder,
      s('Modal Feature First Style', c.f1),
      s('Modal Feature Second Style', c.f2),
      'Default Logo Color: ' + c.logoColor,
      'Modal Logo: ' + (c.logo ? (c.logoKind === 'lock' ? 'custom lock (upload the lock PNG)' : 'custom (upload the logo file)') : 'default ShipInsure lock'),
      'Modal Banner: ' + (c.banner === 'none' ? 'none' : c.banner === 'default' || !c.banner ? 'default ShipInsure banner' : 'custom (upload the banner file)'),
      'Widget type: ' + (c.variant === 'checkout' ? 'Checkout Extension' : 'Cart widget (toggle / checkbox / dual checkout / info only)')
    ].join('\n');
  }

  window.SILightbox = { DEFAULTS, FEATURES, norm, html, open, close, bind, css, portalText, fit, BASE, DRAFT_KEY: 'si_lightbox_draft' };
})();
