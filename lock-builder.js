/* ShipInsure Lock builder — the merchant's logo placed inside the SI lock, as a PNG.
 * The same builder as the Checkout Experience's 🔒 Build in Lock, shared so the Info Lightbox and
 * Merchant Folders (brand kit) can make the custom lock too.
 *
 *   SILockBuilder.open({
 *     logo:   URL / data URL to start with (e.g. the folder's main logo),
 *     color:  lock color (default black),
 *     title:  heading (default '🔒 Lock Logo Builder'),
 *     useLabel: button text (default '✓ Use this lock'),
 *     saveTo: folder name → shows "Also save to <name>'s brand kit" (checked),
 *     onUse(dataUrl, { save })
 *   })
 */
(function () {
  const LOCK_SRC = 'https://raw.githubusercontent.com/drewshafe/si-roi-calculator/main/silocktemplate.png';
  const SZ = 480;            // output size (shown at 160px)
  let lockImg = null, sil = null, shad = null, brand = null, color = '#141414', opts = {};
  let bbox = { fx0: 0, fy0: 0, fx1: 1, fy1: 1 }, center = { fx: 0.5, fy: 0.71 };
  const $ = id => document.getElementById(id);

  const CSS = `
#silbk{position:fixed;inset:0;z-index:2147483200;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
#silbk .bk{background:#fff;color:#1a1a1a;border-radius:16px;padding:22px;max-width:500px;width:92%;box-shadow:0 8px 48px rgba(0,0,0,.28);max-height:90vh;overflow-y:auto;text-align:left}
#silbk .hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
#silbk .t{font-size:16px;font-weight:800}#silbk .st{font-size:12px;color:#999;margin-top:2px}
#silbk .x{background:none;border:0;cursor:pointer;font-size:20px;color:#bbb;line-height:1;padding:0 0 0 12px}
#silbk .bd{display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap}
#silbk canvas{border-radius:10px;background:repeating-conic-gradient(#e0e0e0 0% 25%,#f8f8f8 0% 50%) 0 0/12px 12px;width:160px;height:160px;display:block}
#silbk .cap{font-size:10px;color:#bbb;font-weight:700;text-transform:uppercase;letter-spacing:.06em;text-align:center;margin-top:6px}
#silbk .ctl{flex:1;min-width:170px}
#silbk .lb{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#666;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em}
#silbk .lb b{color:#6675ff;font-weight:700}
#silbk .f{margin-bottom:11px}
#silbk .up{display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#6675ff;background:#f4f5ff;border:1px solid #c8ccff;border-radius:7px;padding:7px 13px;font-weight:700}
#silbk .sw{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
#silbk .sw button.c{width:24px;height:24px;border-radius:50%;cursor:pointer;padding:0;border:2px solid #e5e5e5}
#silbk .sw button.c.on{border-color:#6675ff;box-shadow:0 0 0 2px #fff inset}
#silbk .sw label{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#666;cursor:pointer}
#silbk .sw input[type=color]{width:28px;height:24px;border:0;background:none;cursor:pointer;padding:0}
#silbk .mini{font-size:12px;background:#f4f5ff;border:1px solid #c8ccff;border-radius:6px;padding:3px 9px;cursor:pointer;color:#6675ff;font-weight:700}
#silbk .row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
#silbk .row label{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#555;cursor:pointer}
#silbk input[type=range]{width:100%;accent-color:#6675ff}
#silbk .note{font-size:11px;color:#9aa1b2;margin-bottom:9px}
#silbk .save{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#333;margin-top:14px;cursor:pointer}
#silbk .acts{display:flex;gap:8px;margin-top:14px}
#silbk .use{flex:1;padding:11px;background:linear-gradient(135deg,#6675ff,#764ba2);color:#fff;border:0;border-radius:9px;cursor:pointer;font-weight:800;font-size:14px}
#silbk .dl{padding:11px 16px;background:#f4f5ff;color:#6675ff;border:1px solid #c8ccff;border-radius:9px;cursor:pointer;font-weight:800;font-size:14px}
#silbk .use:disabled{opacity:.5;cursor:default}`;

  function build() {
    if ($('silbk')) return;
    if (!$('silbk-css')) { const s = document.createElement('style'); s.id = 'silbk-css'; s.textContent = CSS; document.head.appendChild(s); }
    const w = document.createElement('div'); w.id = 'silbk';
    w.innerHTML = `<div class="bk" role="dialog" aria-modal="true" aria-label="Lock logo builder">
  <div class="hd"><div><div class="t" id="silbkT"></div><div class="st">Place the brand logo inside the ShipInsure lock</div></div><button type="button" class="x" data-k="close" aria-label="Close">✕</button></div>
  <div class="bd">
    <div><canvas id="silbkC" width="${SZ}" height="${SZ}"></canvas><div class="cap">Preview</div></div>
    <div class="ctl">
      <div class="f"><div class="lb">Brand logo</div><label class="up">↑ Upload logo<input type="file" id="silbkF" accept=".png,.jpg,.jpeg,.gif,.svg,.webp" hidden></label></div>
      <div class="f"><div class="lb">Lock color</div><div class="sw" id="silbkSw">
        <button type="button" class="c" data-c="#141414" title="Black" style="background:#141414"></button>
        <button type="button" class="c" data-c="#ffffff" title="White" style="background:#fff"></button>
        <button type="button" class="c" data-c="#8a8f98" title="Grey" style="background:#8a8f98"></button>
        <label>Custom <input type="color" id="silbkCol" value="#141414"></label>
        ${window.EyeDropper ? '<button type="button" class="mini" data-k="eye" title="Pick a color from the screen">🎯</button>' : ''}
      </div></div>
      <div class="row"><label><input type="checkbox" id="silbkG" checked> Center guides</label><button type="button" class="mini" data-k="recenter">↺ Recenter</button></div>
      <div class="note">The logo centers in the lock on its own; the sliders are optional fine-tuning.</div>
      <div class="f"><div class="lb"><span>Logo size</span><b id="silbkSv">28%</b></div><input type="range" id="silbkS" min="8" max="60" value="28"></div>
      <div class="f"><div class="lb"><span>Up / down</span><b id="silbkYv">0</b></div><input type="range" id="silbkY" min="-30" max="30" value="0"></div>
      <div class="f"><div class="lb"><span>Left / right</span><b id="silbkXv">0</b></div><input type="range" id="silbkX" min="-30" max="30" value="0"></div>
    </div>
  </div>
  <label class="save" id="silbkSaveL" hidden><input type="checkbox" id="silbkSave" checked> <span id="silbkSaveT"></span></label>
  <div class="acts"><button type="button" class="use" data-k="use" id="silbkUse"></button><button type="button" class="dl" data-k="dl" title="Download PNG">⬇ Download</button></div>
</div>`;
    document.body.appendChild(w);
    w.addEventListener('mousedown', e => { if (e.target === w) close(); });
    w.addEventListener('click', async e => {
      const c = e.target.closest('[data-c]'); if (c) return setColor(c.dataset.c);
      const k = (e.target.closest('[data-k]') || {}).dataset; if (!k || !k.k) return;
      if (k.k === 'close') close();
      if (k.k === 'recenter') { ['silbkX', 'silbkY'].forEach(id => { $(id).value = 0; }); sync(); }
      if (k.k === 'eye') { try { const r = await new EyeDropper().open(); setColor(r.sRGBHex); } catch (x) {} }
      if (k.k === 'dl') { const a = document.createElement('a'); a.href = out(); a.download = 'si-lock-custom.png'; a.click(); }
      if (k.k === 'use') { if (!brand) return; const u = out(), save = !$('silbkSaveL').hidden && $('silbkSave').checked; close(); opts.onUse && opts.onUse(u, { save }); }
    });
    w.addEventListener('input', e => { if (e.target.id === 'silbkCol') setColor(e.target.value); else sync(); });
    w.addEventListener('change', e => { if (e.target.id === 'silbkG') draw(); });
    $('silbkF').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
      const r = new FileReader(); r.onload = () => loadBrand(r.result); r.readAsDataURL(f);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('silbk') && !$('silbk').hidden) close(); });
  }
  function sync() {
    $('silbkSv').textContent = $('silbkS').value + '%'; $('silbkYv').textContent = $('silbkY').value; $('silbkXv').textContent = $('silbkX').value;
    draw();
  }
  function setColor(c) {
    color = c || '#141414';
    if ($('silbkCol').value.toLowerCase() !== color.toLowerCase()) $('silbkCol').value = color;
    document.querySelectorAll('#silbkSw [data-c]').forEach(b => b.classList.toggle('on', b.dataset.c.toLowerCase() === color.toLowerCase()));
    draw();
  }
  function loadBrand(src) {
    if (!src) return;
    const im = new Image();
    if (!/^data:/.test(src)) im.crossOrigin = 'anonymous';
    im.onload = () => { brand = im; $('silbkUse').disabled = false; draw(); };
    im.onerror = () => { $('silbkUse').textContent = 'Couldn’t load that logo: upload it instead'; };
    im.src = src;
  }
  // Split the template into lock vs drop shadow once, so recoloring never touches the shadow.
  function layers() {
    const w = lockImg.width, h = lockImg.height, src = document.createElement('canvas'); src.width = w; src.height = h;
    const sx = src.getContext('2d'); sx.drawImage(lockImg, 0, 0);
    let img; try { img = sx.getImageData(0, 0, w, h); } catch (e) { sil = shad = null; return; }
    const lc = document.createElement('canvas'), sc = document.createElement('canvas'); lc.width = sc.width = w; lc.height = sc.height = h;
    const li = lc.getContext('2d').createImageData(w, h), si = sc.getContext('2d').createImageData(w, h), d = img.data;
    let minX = w, minY = h, maxX = -1, maxY = -1; const rMin = new Int32Array(h).fill(w), rMax = new Int32Array(h).fill(-1), rCnt = new Int32Array(h);
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], b = d[i + 2], a = d[i + 3], isLock = a > 0 && ((b - r) > 8 || a >= 200), dst = (isLock ? li : si).data;
      dst[i] = r; dst[i + 1] = d[i + 1]; dst[i + 2] = b; dst[i + 3] = a;
      if (isLock) { const p = i >> 2, x = p % w, y = (p / w) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; if (x < rMin[y]) rMin[y] = x; if (x > rMax[y]) rMax[y] = x; rCnt[y]++; }
    }
    lc.getContext('2d').putImageData(li, 0, 0); sc.getContext('2d').putImageData(si, 0, 0); sil = lc; shad = sc;
    if (maxX < minX) return;
    bbox = { fx0: minX / w, fy0: minY / h, fx1: (maxX + 1) / w, fy1: (maxY + 1) / h };
    let mw = 0; for (let y = 0; y < h; y++) if (rCnt[y] > mw) mw = rCnt[y];
    let y0 = -1, y1 = -1, x0 = w, x1 = -1;
    for (let y = 0; y < h; y++) if (rCnt[y] > mw * 0.6) { if (y0 < 0) y0 = y; y1 = y; if (rMin[y] < x0) x0 = rMin[y]; if (rMax[y] > x1) x1 = rMax[y]; }
    if (y1 >= y0 && x1 >= x0) center = { fx: ((x0 + x1) / 2) / w, fy: ((y0 + y1) / 2) / h };
  }
  function draw(noGuides) {
    const cv = $('silbkC'); if (!cv) return;
    const ctx = cv.getContext('2d'), sz = cv.width, k = sz / 160;
    ctx.clearRect(0, 0, sz, sz);
    let lx = 0, ly = 0, lw = sz, lh = sz;
    if (lockImg && lockImg.width) {
      const r = lockImg.width / lockImg.height;
      if (r < 1) { lw = sz * r; lx = (sz - lw) / 2; } else { lh = sz / r; ly = (sz - lh) / 2; }
      const W = Math.max(1, Math.round(lw)), H = Math.max(1, Math.round(lh)), off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d');
      if (sil && shad) ctx.drawImage(shad, lx, ly, lw, lh);
      o.drawImage(sil || lockImg, 0, 0, W, H); o.globalCompositeOperation = 'source-in'; o.fillStyle = color; o.fillRect(0, 0, W, H);
      ctx.drawImage(off, lx, ly, lw, lh);
    }
    const cx = lx + lw * center.fx + parseFloat($('silbkX').value) / 30 * sz * 0.22;
    const cy = ly + lh * center.fy + parseFloat($('silbkY').value) / 30 * sz * 0.15;
    if (brand) {
      const s = parseInt($('silbkS').value, 10) / 100, mW = lw * s * 1.6, mH = lh * s, ra = brand.width / brand.height;
      const bh = Math.min(mH, mW / ra), bw = bh * ra;
      ctx.drawImage(brand, cx - bw / 2, cy - bh / 2, bw, bh);
    }
    if (!noGuides && $('silbkG').checked) {
      const x0 = lx + lw * bbox.fx0, x1 = lx + lw * bbox.fx1, y0 = ly + lh * bbox.fy0, y1 = ly + lh * bbox.fy1;
      ctx.save(); ctx.lineWidth = k; ctx.strokeStyle = 'rgba(102,117,255,0.45)'; ctx.setLineDash([4 * k, 3 * k]); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = 'rgba(102,117,255,0.9)'; ctx.setLineDash([5 * k, 4 * k]); ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y1); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = 'rgba(102,117,255,0.95)'; ctx.beginPath(); ctx.arc(cx, cy, 2.5 * k, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  function out() { draw(true); const u = $('silbkC').toDataURL('image/png'); draw(); return u; }
  function close() { const w = $('silbk'); if (w) w.hidden = true; }
  function open(o) {
    opts = o || {}; build();
    const w = $('silbk'); w.hidden = false;
    $('silbkT').textContent = opts.title || '🔒 Lock Logo Builder';
    $('silbkUse').textContent = opts.useLabel || '✓ Use this lock';
    $('silbkSaveL').hidden = !opts.saveTo; $('silbkSaveT').textContent = opts.saveTo ? `Also save to ${opts.saveTo}’s brand kit` : '';
    brand = null; $('silbkUse').disabled = true;
    setColor(opts.color || color);
    if (opts.logo) loadBrand(opts.logo);
    if (!lockImg) { lockImg = new Image(); lockImg.crossOrigin = 'anonymous'; lockImg.onload = () => { layers(); draw(); }; lockImg.src = LOCK_SRC; }
    else draw();
  }
  window.SILockBuilder = { open, close };
})();
