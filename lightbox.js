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
    logo: '',                           // '' = ShipInsure lock in logoColor; else an image URL / data URL
    logoColor: '#6675FF',
    headerBorder: '#6675FF',
    box:    { bg: '#ffffff', border: '#e3e5ee', bw: 0, radius: 8, pad: 24 },
    tStyle: { font: '', size: 13, weight: 600, color: '#1f2433' },
    f1:     { font: '', size: 12, weight: 600, color: '#1f2433' },
    f2:     { font: '', size: 12, weight: 400, color: '#6675FF' },
    font: ''                            // base font for the whole lightbox (the store's), '' = Open Sans
  };
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
.silb-logo img{position:absolute;left:4px;right:4px;bottom:0;height:52px;width:56px;object-fit:contain;background:#fff;border-radius:10px;padding:5px}
.silb-body{padding:40px var(--pd) 22px}
.silb-t{margin:0 0 18px}
.silb-fl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.silb-f{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.silb-ck{flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:var(--ckbg);display:inline-flex;align-items:center;justify-content:center}
.silb-sep{opacity:.9;margin:0 2px}
.silb-foot{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:24px;font:400 12px/1.4 var(--ff);color:#6b7085}
.silb-foot a{color:#6b7085;text-decoration:underline}
.silb-pw{display:inline-flex;align-items:center;gap:6px}
.silb-pw b{font-weight:700;color:#3b3f52;letter-spacing:-.01em}
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
  // The ShipInsure lock over the banner (Default Logo Color fills the box badge).
  const LOCK = c => `<svg class="silb-lock" width="64" height="84" viewBox="0 0 64 84" aria-hidden="true">
<path d="M14 40V25a18 18 0 0 1 36 0v15" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
<rect x="3" y="34" width="58" height="50" rx="11" fill="#fff"/>
<rect x="17" y="44" width="30" height="30" rx="7" fill="${c}"/>
<path d="M32 50.5l8.5 4.6v9.4L32 69l-8.5-4.5v-9.4z" fill="#fff"/><path d="M23.5 55.1L32 59.7l8.5-4.6M32 59.7V69" fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const MARK = `<svg width="15" height="16" viewBox="0 0 64 70" aria-hidden="true"><path d="M14 34V22a18 18 0 0 1 36 0v12" fill="none" stroke="#8a8fa3" stroke-width="9"/><rect x="3" y="30" width="58" height="40" rx="9" fill="#8a8fa3"/><path d="M32 39l9 5v10l-9 5-9-5V44z" fill="#fff"/></svg>`;

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
    const foot = c.footer ? `<div class="silb-foot" data-silb="footer"><span class="silb-pw">Powered by ${MARK}<b>ShipInsure</b></span><a href="${esc(url(c.privacyUrl) || DEFAULTS.privacyUrl)}" target="_blank" rel="noopener">Privacy</a><a href="${esc(url(c.termsUrl) || DEFAULTS.termsUrl)}" target="_blank" rel="noopener">Terms</a></div>` : '';
    const title = `<div class="silb-t" data-silb="title" data-ph="Title" style="${fst(c.tStyle, ff)}">${esc(c.title)}</div>`;
    const cls = 'silb ' + (c.variant === 'checkout' ? 'silb-co' : 'silb-cart') + (o.narrow ? ' silb-sheet' : '') + (ed ? ' silb-edit' : '');
    const ban = `<div class="silb-ban${banSrc ? '' : ' silb-none'}" data-silb="banner"${banSrc ? ` style="background-image:url('${banSrc}')"` : ''}>`;
    if (c.variant === 'checkout') {
      return `<div class="${cls}" data-silb="box" role="dialog" aria-modal="true" aria-label="${esc(c.title)}" style="${boxSt}">
<div class="silb-hd">${title}<button type="button" class="silb-x" aria-label="Close" data-silb-close>✕</button></div>
<div class="silb-body">${ban}</div>${feats}${foot}<button type="button" class="silb-cobtn" data-silb-close>Close</button></div></div>`;
    }
    const logo = url(c.logo) ? `<span class="silb-logo" data-silb="logo"><svg width="64" height="84" viewBox="0 0 64 84" aria-hidden="true"><path d="M14 40V25a18 18 0 0 1 36 0v15" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/></svg><img src="${url(c.logo)}" alt=""></span>` : `<span class="silb-logo" data-silb="logo">${LOCK(lc)}</span>`;
    return `<div class="${cls}" data-silb="box" role="dialog" aria-modal="true" aria-label="${esc(c.title)}" style="${boxSt}">
<button type="button" class="silb-x" aria-label="Close" data-silb-close>✕</button>
${ban}${logo}</div>
<div class="silb-body">${title}${feats}${foot}</div></div>`;
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
    const narrow = o.narrow != null ? o.narrow : (inHost ? host.clientWidth : innerWidth) < 480;
    const ov = document.createElement('div');
    ov.className = 'silb-ov' + (inHost ? ' in-host' : '') + (narrow ? ' silb-sheet' : '');
    ov.innerHTML = html(cfg, { narrow });
    ov.addEventListener('click', e => {
      if (e.target === ov || e.target.closest('[data-silb-close]')) { e.preventDefault(); ov.remove(); o.onClose && o.onClose(); }
    });
    host.appendChild(ov);
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
      'Modal Logo: ' + (c.logo ? 'custom (upload the logo file)' : 'default ShipInsure lock'),
      'Modal Banner: ' + (c.banner === 'none' ? 'none' : c.banner === 'default' || !c.banner ? 'default ShipInsure banner' : 'custom (upload the banner file)'),
      'Widget type: ' + (c.variant === 'checkout' ? 'Checkout Extension' : 'Cart widget (toggle / checkbox / dual checkout / info only)')
    ].join('\n');
  }

  window.SILightbox = { DEFAULTS, FEATURES, norm, html, open, close, bind, css, portalText, BASE, DRAFT_KEY: 'si_lightbox_draft' };
})();
