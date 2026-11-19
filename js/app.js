import { TYPES, CATS, COLORS, colorByKey, nearestColor, svgURL, DEMO_WARDROBE, CITIES, BRANDS, PRODUCTS, FRIENDS, EXTRA_FRIEND_NAMES, IMAGENET_MAP } from './data.js';
import { t, setLang, getLang } from './i18n.js';
import { generate, outfitIds, findGaps } from './stylist.js';

const DAY = 864e5;
const PRICE = 26000;
const PROMOS = { STUDENT: 50, LOOKSY20: 20, TASHKENT: 100 };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);

// ---------------- state ----------------
const KEY = 'looksy.state';
const DEFAULT = {
  onboarded: false, step: 0, tab: 'home', event: 'study', viewMode: 'flat', wcat: 'all', otab: 'saved',
  profile: { name: '', styles: ['minimal'], colors: [], height: '', weight: '', topSize: 'M', bottomSize: '38', shoeSize: '39', city: 'tashkent', time: '08:00' },
  settings: { theme: 'system', lang: 'ru' },
  items: [], saved: [], worn: [], prefs: { items: {} }, reroll: 0,
  sub: { status: 'none' }, shift: 0, notifiedOn: '',
  refCode: '', invited: 0, dismissed: [], extraFriends: [], friendLikes: {},
};
let S;
try { S = Object.assign(structuredClone(DEFAULT), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = structuredClone(DEFAULT); }
if (!S.refCode) S.refCode = 'LKS-' + Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Storage full'); } };
const now = () => Date.now() + S.shift * DAY;
const fmtDate = ts => new Date(ts).toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long' });
const fmtPrice = n => n.toLocaleString(getLang() === 'ru' ? 'ru-RU' : 'en-US');
setLang(S.settings.lang);

// ---------------- photos (IndexedDB) ----------------
const imgs = {};
const idb = new Promise((res, rej) => {
  const r = indexedDB.open('looksy', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('img');
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const idbTx = (mode, fn) => idb.then(db => new Promise((res, rej) => {
  const tx = db.transaction('img', mode); const st = tx.objectStore('img'); const out = fn(st);
  tx.oncomplete = () => res(out.result); tx.onerror = () => rej(tx.error);
}));
async function loadImages() {
  try {
    const db = await idb;
    await new Promise(res => {
      const req = db.transaction('img').objectStore('img').openCursor();
      req.onsuccess = () => { const c = req.result; if (c) { imgs[c.key] = c.value; c.continue(); } else res(); };
      req.onerror = res;
    });
  } catch {}
}
const src = it => (it.photo && imgs[it.id]) || svgURL(it.type, colorByKey(it.color).hex);
const itemName = it => `${TYPES[it.type][getLang()]} · ${colorByKey(it.color)[getLang()]}`;

// ---------------- weather ----------------
let W = null;
async function loadWeather() {
  const city = CITIES.find(c => c.k === S.profile.city) || CITIES[0];
  const cacheKey = 'looksy.weather.' + city.k;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1`;
    const r = await fetch(url); if (!r.ok) throw 0;
    const j = await r.json();
    const at = h => j.hourly.temperature_2m[h];
    const codes = j.hourly.weather_code.slice(7, 20);
    W = { now: j.current.temperature_2m, code: j.current.weather_code, morning: at(8), day: Math.max(at(13), at(14), at(15)), evening: at(19),
      dayCode: Math.max(...codes), ok: true };
    localStorage.setItem(cacheKey, JSON.stringify(W));
  } catch {
    try { W = JSON.parse(localStorage.getItem(cacheKey)); } catch {}
    if (!W) W = { now: 12, code: 2, morning: 7, day: 18, evening: 13, dayCode: 2 };
    W.ok = false;
  }
}
const wKey = c => (c >= 95 ? 95 : c >= 80 ? 80 : c >= 71 ? 71 : c >= 61 ? 61 : c >= 51 ? 51 : c >= 45 ? 45 : Math.min(c, 3));
const deg = v => `${v > 0 ? '+' : ''}${Math.round(v)}°`;

// ---------------- icons ----------------
const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I = {
  home: ic('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  hanger: ic('<path d="M12 7a2 2 0 1 1 2-2"/><path d="M12 7v2L3 16a1 1 0 0 0 .6 1.8h16.8A1 1 0 0 0 21 16l-9-7"/>'),
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/></svg>',
  looks: ic('<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>'),
  user: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  plus: ic('<path d="M12 5v14M5 12h14"/>'),
  back: ic('<path d="M15 18l-6-6 6-6"/>'),
  heart: ic('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  bookmark: ic('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  up: ic('<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 20H7"/>'),
  down: ic('<path d="M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-2-2v-4H5a2 2 0 0 1-2-2.3l1.3-7A2 2 0 0 1 6.3 4H17"/>'),
  camera: ic('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  image: ic('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  refresh: ic('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
  hangerOn: ic('<path d="M12 7a2 2 0 1 1 2-2"/><path d="M12 7v2L3 16a1 1 0 0 0 .6 1.8h16.8A1 1 0 0 0 21 16l-9-7"/><path d="M9 14l2 2 4-4"/>'),
  chev: ic('<path d="M9 6l6 6-6 6"/>'),
};
const wIcon = c => {
  if (c >= 71 && c < 80) return ic('<path d="M7 16a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 17 16z"/><path d="M8 20h.01M12 21h.01M16 20h.01"/>');
  if (c >= 51) return ic('<path d="M7 15a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 17 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>');
  if (c >= 2) return ic('<circle cx="8" cy="9" r="3" stroke="var(--sun)"/><path d="M9 18a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.5 3.5 0 0 1 19 18z"/>');
  return `<svg viewBox="0 0 24 24" fill="none" stroke="var(--sun)" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
};
const logo = (cls = '') => `<span class="logo ${cls}">Looksy<span class="spark">${I.spark}</span></span>`;

// ---------------- UI plumbing ----------------
let acts = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = acts[el.dataset.act]; if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => {
  const el = e.target.closest('[data-bind]'); if (!el) return;
  S.profile[el.dataset.bind] = el.value; persist();
});
let toastT;
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
}
function openSheet(html, handlers = {}) {
  $('#sheet-root').innerHTML = `<div class="sheet-back" data-act="sheetBack"><div class="sheet"><div class="grab"></div>${html}</div></div>`;
  Object.assign(acts, handlers, { sheetBack: (el, e) => { if (e.target === el) closeSheet(); }, closeSheet });
}
function closeSheet() { $('#sheet-root').innerHTML = ''; }
function applyTheme() {
  const th = S.settings.theme;
  if (th === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', th);
  const dark = th === 'dark' || (th === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name=theme-color]').forEach(m => m.setAttribute('content', dark ? '#141210' : '#F6F2EE'));
}

// ---------------- subscription ----------------
function subTick() {
  const s = S.sub;
  if ((s.status === 'trial' || s.status === 'active') && now() > s.end) {
    s.status = 'active'; s.start = s.end; s.end = s.end + 30 * DAY; persist(); setTimeout(() => toast(t('charged')), 300);
  } else if (s.status === 'canceled' && now() > s.end) { s.status = 'expired'; persist(); }
}
const hasAccess = () => ['trial', 'active', 'canceled'].includes(S.sub.status) && now() <= S.sub.end;
const refBonus = () => Math.min(90, 30 * (S.invited || 0));
const promoPct = () => S.sub.promo === 'REF' ? 30 : (PROMOS[S.sub.promo] || 0);
const discountPct = () => Math.min(100, promoPct() + refBonus());
const priceWithPromo = () => Math.round(PRICE * (1 - discountPct() / 100));
function applyCode(raw) {
  const code = (raw || '').trim().toUpperCase();
  if (code === S.refCode) return toast(t('refOwn'));
  if (/^LKS-[A-Z0-9]{4}$/.test(code)) { S.sub.promo = 'REF'; S.sub.promoLabel = code; persist(); toast(t('refApplied')); return true; }
  if (PROMOS[code] != null) { S.sub.promo = code; S.sub.promoLabel = code; persist(); toast(t('promoOk', PROMOS[code])); return true; }
  toast(t('promoBad'));
}
async function shareRef() {
  const text = t('refShareText', S.refCode), url = location.origin + location.pathname;
  try { if (navigator.share) return await navigator.share({ title: 'Looksy', text, url }); } catch { return; }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); toast(t('copied')); } catch { toast(S.refCode); }
}

function paySheet({ trial }) {
  let method = 'card';
  const methods = [
    ['card', 'Visa / Uzcard / Humo', '#1F2C4C', 'CARD'], ['payme', 'Payme', '#33CCCC', 'PM'], ['click', 'Click', '#2D7FF9', 'CL'],
    ['uzum', 'Uzum Bank', '#7B3FE4', 'UZ'], ['store', 'App Store / Google Play', '#1C1A18', 'APP'],
  ];
  const body = () => `
    <h2>${trial ? t('trialTitle') : t('premium')}</h2>
    <p class="muted small">${trial ? t('trialSub') : `${fmtPrice(priceWithPromo())} ${t('perMonth')}`}</p>
    <div class="section-title"><h3>${t('payMethod')}</h3></div>
    <div class="stack">${methods.map(([k, n, c, a]) => `<button class="pay-method ${k === method ? 'on' : ''}" data-act="pm" data-k="${k}">
      <span class="pay-badge" style="background:${c}">${a}</span><span>${n}</span></button>`).join('')}</div>
    ${method === 'card' ? `<div style="margin-top:14px"><label class="field"><span>${t('cardNumber')}</span><input class="input" id="cc" inputmode="numeric" value="4242 4242 4242 4242" maxlength="19"></label>
      <label class="field"><span>${t('cardExp')}</span><input class="input" value="12/29" maxlength="5"></label></div>` : ''}
    <div class="row" style="margin-top:14px"><input id="payPromo" class="input" style="height:40px" placeholder="${t('promo')} / LKS-XXXX" value="${esc(S.sub.promoLabel || '')}">
      <button class="btn sm ghost" data-act="payPromo">${t('apply')}</button></div>
    ${discountPct() ? `<p class="small" style="margin:8px 0 0;color:var(--good)">${fmtPrice(priceWithPromo())} ${t('perMonth')} (−${discountPct()}%)</p>` : ''}
    <div style="margin-top:16px"><button class="btn" data-act="doPay">${trial ? t('startTrial') : `${t('pay')} ${fmtPrice(priceWithPromo())} ${t('perMonth')}`}</button></div>
    <p class="demo-note">${t('demoPay')}</p>`;
  return new Promise(resolve => {
    const draw = () => openSheet(body(), handlers);
    const handlers = {
      pm: el => { method = el.dataset.k; draw(); },
      payPromo: () => { if (applyCode($('#payPromo').value)) draw(); },
      doPay: () => {
        const cc = ($('#cc')?.value || '').replace(/\D/g, '');
        const label = methods.find(m => m[0] === method)[1];
        $('.sheet').innerHTML = `<div class="grab"></div><div class="spinner"></div><p class="muted" style="text-align:center">${method === 'card' ? '…' : t('redirecting', label)}</p>`;
        setTimeout(() => {
          const n = now();
          S.sub = { ...S.sub, status: trial ? 'trial' : 'active', start: n, end: n + (trial ? 7 : 30) * DAY, method: label, last4: cc.slice(-4) };
          persist(); closeSheet(); toast(trial ? t('trialStarted') : t('paySuccess')); resolve(true);
        }, 1200);
      },
    };
    draw();
  });
}

// ---------------- image processing ----------------
async function processPhoto(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const max = 480, k = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * k), h = Math.round(img.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h), px = data.data;
  // background colour = median of border pixels
  const border = [];
  for (let x = 0; x < w; x += 2) border.push((x) * 4, ((h - 1) * w + x) * 4);
  for (let y = 0; y < h; y += 2) border.push((y * w) * 4, (y * w + w - 1) * 4);
  const med = ch => { const v = border.map(i => px[i + ch]).sort((a, b) => a - b); return v[v.length >> 1]; };
  const bg = [med(0), med(1), med(2)];
  const tol = 38 * 38 * 3;
  const dist = i => (px[i] - bg[0]) ** 2 + (px[i + 1] - bg[1]) ** 2 + (px[i + 2] - bg[2]) ** 2;
  const seen = new Uint8Array(w * h), stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  let removed = 0;
  while (stack.length) {
    const p = stack.pop(); if (seen[p]) continue; seen[p] = 1;
    if (dist(p * 4) > tol) continue;
    px[p * 4 + 3] = 0; removed++;
    const x = p % w;
    if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w); if (p < w * (h - 1)) stack.push(p + w);
  }
  const ratio = removed / (w * h);
  const cut = ratio > 0.05 && ratio < 0.92;
  if (!cut) for (let i = 3; i < px.length; i += 4) px[i] = 255;
  // dominant colour of the remaining pixels
  const buckets = new Map();
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (px[i + 3] < 128) continue;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    const key = (px[i] >> 4) << 8 | (px[i + 1] >> 4) << 4 | (px[i + 2] >> 4);
    const b = buckets.get(key) || [0, 0, 0, 0]; b[0] += px[i]; b[1] += px[i + 1]; b[2] += px[i + 2]; b[3]++; buckets.set(key, b);
  }
  const top = [...buckets.values()].sort((a, b) => b[3] - a[3]);
  const named = [];
  for (const b of top) { const c = nearestColor([b[0] / b[3], b[1] / b[3], b[2] / b[3]]); if (!named.includes(c.k)) named.push(c.k); if (named.length >= 4) break; }
  g.putImageData(data, 0, 0);
  const out = document.createElement('canvas');
  const cw = cut ? maxX - minX + 1 : w, ch = cut ? maxY - minY + 1 : h;
  out.width = cw; out.height = ch;
  out.getContext('2d').drawImage(cv, cut ? minX : 0, cut ? minY : 0, cw, ch, 0, 0, cw, ch);
  const ar = ch / cw;
  const guess = ar > 1.7 ? 'jeans' : ar < 0.7 ? 'sneakers' : 'tshirt';
  return { url: out.toDataURL('image/png'), colors: named.length ? named : ['black'], guess };
}

// ---------------- on-device neural network (MobileNet, ImageNet) ----------------
let modelP = null, modelState = 'idle';
const loadScript = s => new Promise((res, rej) => { const el = document.createElement('script'); el.src = s; el.onload = res; el.onerror = rej; document.head.appendChild(el); });
function loadModel() {
  if (!modelP) {
    modelState = 'loading';
    modelP = (async () => {
      if (!window.tf) await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
      if (!window.mobilenet) await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
      const m = await window.mobilenet.load({ version: 2, alpha: 0.5 });
      modelState = 'ready'; return m;
    })().catch(() => { modelState = 'off'; modelP = null; return null; });
  }
  return modelP;
}
async function classify(url) {
  const m = await Promise.race([loadModel(), new Promise(r => setTimeout(() => r(null), 9000))]);
  if (!m) return null;
  const img = new Image(); img.src = url; await img.decode();
  const cv = document.createElement('canvas'); cv.width = cv.height = 224;
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 224, 224);
  const k = 200 / Math.max(img.width, img.height), w = img.width * k, h = img.height * k;
  g.drawImage(img, (224 - w) / 2, (224 - h) / 2, w, h);
  const preds = await m.classify(cv, 10);
  const score = {};
  for (const p of preds) {
    const syn = p.className.split(', ');
    const hit = IMAGENET_MAP.find(([kw]) => syn.includes(kw));
    if (hit) score[hit[1]] = (score[hit[1]] || 0) + p.probability;
  }
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 0.08 ? { type: best[0], p: Math.round(Math.min(0.99, best[1]) * 100) } : null;
}

// ---------------- outfits ----------------
let looksCache = { sig: '', list: [] };
function getLooks(seedExtra = '') {
  const day = new Date(now()).toDateString();
  // prefs/worn are applied on the next refresh, so cards don't jump while the user taps them
  const sig = [day, S.event, S.reroll, S.items.map(i => i.id + i.type + i.color).join(), W?.day, getLang(), seedExtra].join('/');
  if (looksCache.sig === sig) return looksCache.list;
  const list = generate(S.items, {
    weather: { morning: W.morning, day: W.day, code: W.dayCode }, event: S.event, seed: day + S.event + S.reroll,
    prefs: S.prefs, worn: S.worn, profile: S.profile, now: now(),
  }, 5);
  looksCache = { sig, list };
  return list;
}
const byId = id => S.items.find(i => i.id === id);
function rehydrate(saved) {
  const parts = {};
  for (const [k, id] of Object.entries(saved.parts)) { const it = id && byId(id); if (it) parts[k] = it; }
  return { ...saved, parts };
}
const dehydrate = o => ({ key: o.key, reasons: o.reasons, layerNote: o.layerNote, layerRemovable: o.layerRemovable, event: S.event,
  parts: Object.fromEntries(Object.entries(o.parts).map(([k, v]) => [k, v ? v.id : null])) });

const FLAT = {
  layer: { layer: [0, 4, 54, 58], top: [40, 4, 40, 36], dress: [38, 4, 42, 64], bottom: [36, 38, 42, 56], shoes: [4, 68, 34, 24], bag: [72, 48, 26, 26], acc: [76, 4, 22, 14] },
  plain: { top: [24, 3, 52, 36], dress: [22, 4, 56, 70], bottom: [28, 37, 44, 54], shoes: [3, 74, 30, 20], bag: [70, 52, 28, 28], acc: [4, 6, 24, 18] },
};
const MANN = { layer: [17, 9, 66, 38], top: [24, 10, 52, 30], dress: [22, 10, 56, 64], bottom: [29, 37, 42, 46], shoes: [34, 82, 32, 14], bag: [72, 42, 26, 24], acc: [74, 10, 22, 14] };
const Z = { layer: 1, bottom: 2, dress: 2, top: 3, shoes: 4, bag: 5, acc: 6 };
const MANN_Z = { bottom: 1, dress: 1, top: 2, layer: 3, shoes: 4, bag: 5, acc: 6 };
const mannequinSVG = `<svg class="mannequin" viewBox="0 0 300 400" fill="none" stroke="var(--muted)" stroke-width="2"><path d="M138 30 Q150 18 162 30 L162 44 Q196 50 210 64 L204 132 Q196 160 200 190 L190 330 L160 330 L152 230 L148 230 L140 330 L110 330 L100 190 Q104 160 96 132 L90 64 Q104 50 138 44 Z" fill="var(--surface)" opacity=".7"/><path d="M150 330 L150 380 M118 388 L182 388"/></svg>`;

function lookHTML(o, { mode = S.viewMode, noLayer = false } = {}) {
  const p = { ...o.parts }; if (noLayer) delete p.layer;
  const pos = mode === 'mann' ? MANN : p.layer ? FLAT.layer : FLAT.plain;
  const z = mode === 'mann' ? MANN_Z : Z;
  const imgs = Object.entries(p).filter(([k, v]) => v && pos[k]).map(([k, v]) => {
    const [l, tp, w, h] = pos[k];
    return `<img src="${src(v)}" alt="${esc(itemName(v))}" style="left:${l}%;top:${tp}%;width:${w}%;height:${h}%;z-index:${z[k]}">`;
  }).join('');
  return `<div class="look">${mode === 'mann' ? mannequinSVG : ''}${imgs}</div>`;
}
const isSaved = key => S.saved.some(s => s.key === key);

function lookCard(o, i, { compact = false } = {}) {
  const ids = outfitIds(o);
  const vote = ids.reduce((a, id) => a + (S.prefs.items[id] || 0), 0);
  return `<div class="look-card" data-i="${i}">
    <div style="position:relative">
      ${lookHTML(o, { noLayer: o._day })}
      ${o.layerRemovable ? `<div class="toggle" style="position:absolute;left:10px;top:10px;z-index:9">
        <button class="${o._day ? '' : 'on'}" data-act="dayToggle" data-i="${i}" data-v="0">${t('morning')}</button>
        <button class="${o._day ? 'on' : ''}" data-act="dayToggle" data-i="${i}" data-v="1">${t('day')}</button></div>` : ''}
    </div>
    <div class="look-meta">
      <div class="row" style="justify-content:space-between"><h3>${t('events.' + (o.event || S.event))} · ${deg(W.day)}</h3>
        <span class="badge">${i + 1}/${compact ? 1 : looksCache.list.length}</span></div>
      ${o.layerNote ? `<div class="layer-note">${esc(o.layerNote)}</div>` : ''}
      <ul class="why">${o.reasons.slice(0, 3).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <div class="pieces">${ids.map(id => byId(id)).filter(Boolean).map(it => `<img src="${src(it)}" alt="${esc(itemName(it))}" title="${esc(itemName(it) + (it.brand ? ' — ' + it.brand : ''))}">`).join('')}</div>
      <div class="actions" style="grid-template-columns:44px 44px 44px 1fr">
        <button class="round ${vote < 0 ? 'on' : ''}" data-act="vote" data-i="${i}" data-v="-1" aria-label="dislike">${I.down}</button>
        <button class="round ${vote > 0 ? 'on' : ''}" data-act="vote" data-i="${i}" data-v="1" aria-label="like">${I.up}</button>
        <button class="round ${isSaved(o.key) ? 'on' : ''}" data-act="saveLook" data-i="${i}" aria-label="save">${I.bookmark}</button>
        <button class="btn sm" data-act="wear" data-i="${i}">${I.hangerOn}${t('wearToday')}</button>
      </div>
    </div></div>`;
}
function lookActions(getList) {
  return {
    dayToggle: el => { const o = getList()[el.dataset.i]; o._day = el.dataset.v === '1'; render(); },
    vote: el => {
      const o = getList()[el.dataset.i], v = +el.dataset.v;
      for (const id of outfitIds(o)) S.prefs.items[id] = Math.max(-3, Math.min(3, (S.prefs.items[id] || 0) + v * 0.5));
      persist(); toast(v > 0 ? t('liked') : t('disliked')); render();
    },
    saveLook: el => {
      const o = getList()[el.dataset.i];
      if (isSaved(o.key)) { S.saved = S.saved.filter(s => s.key !== o.key); toast(t('unsaved')); }
      else { S.saved.unshift({ ...dehydrate(o), date: now() }); toast(t('saved')); }
      persist(); render();
    },
    wear: el => {
      const o = getList()[el.dataset.i];
      S.worn.unshift({ ...dehydrate(o), ids: outfitIds(o), date: now() });
      persist(); toast(t('worn'));
    },
  };
}

// ---------------- screens ----------------
function tabbar() {
  const tabs = [['home', I.home], ['wardrobe', I.hanger], ['ai', I.spark], ['outfits', I.looks], ['profile', I.user]];
  const el = $('#tabbar'); el.hidden = !S.onboarded;
  el.innerHTML = tabs.map(([k, icon]) => k === 'ai'
    ? `<button class="tab center ${S.tab === k ? 'on' : ''}" data-act="tab" data-k="${k}"><span class="fab">${icon}</span></button>`
    : `<button class="tab ${S.tab === k ? 'on' : ''}" data-act="tab" data-k="${k}">${icon}<span>${t('tabs.' + k)}</span></button>`).join('');
}

function weatherCard() {
  if (!W) return `<div class="card"><div class="spinner"></div></div>`;
  const city = CITIES.find(c => c.k === S.profile.city) || CITIES[0];
  return `<div class="card">
    <div class="weather"><span class="wicon">${wIcon(W.code)}</span>
      <div><div class="big">${deg(W.now)}</div><div class="muted small">${city[getLang()]} · ${t('w.' + wKey(W.code))}</div></div></div>
    <div class="wparts">
      <div class="wpart"><span class="muted">${t('morning')}</span><b>${deg(W.morning)}</b></div>
      <div class="wpart"><span class="muted">${t('day')}</span><b>${deg(W.day)}</b></div>
      <div class="wpart"><span class="muted">${t('evening')}</span><b>${deg(W.evening)}</b></div>
    </div>
    ${W.ok ? '' : `<p class="muted small" style="margin:10px 0 0">${t('offline')}</p>`}
  </div>`;
}
const eventChips = () => `<div class="chips">${['study', 'work', 'meeting', 'event'].map(e =>
  `<button class="chip ${S.event === e ? 'on' : ''}" data-act="event" data-k="${e}">${t('events.' + e)}</button>`).join('')}</div>`;

function needItemsCard() {
  return `<div class="card empty"><p>${t('needItems')}</p><div class="row" style="justify-content:center;margin-top:12px">
    <button class="btn sm" data-act="tab" data-k="wardrobe">${t('addItems')}</button>
    <button class="btn sm ghost" data-act="loadDemo">${t('loadDemo')}</button></div></div>`;
}
function paywallCard() {
  return `<div class="card" style="text-align:center"><h2>${t('paywallTitle')}</h2><p class="muted">${t('paywallSub')}</p>
    <button class="btn" data-act="subscribe">${t('subscribe')} · ${fmtPrice(priceWithPromo())} ${t('perMonth')}</button></div>`;
}

// ---------- install hint ----------
let installEvt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (S.onboarded && S.tab === 'home') render(); });
addEventListener('appinstalled', () => { installEvt = null; S.installHidden = true; persist(); render(); });
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isMobile = () => /iphone|ipad|ipod|android/i.test(navigator.userAgent);
function installCard() {
  if (standalone() || S.installHidden || (!installEvt && !isMobile())) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  acts.install = async () => { if (installEvt) { installEvt.prompt(); await installEvt.userChoice; installEvt = null; render(); } };
  acts.hideInstall = () => { S.installHidden = true; persist(); render(); };
  return `<div class="card row" style="margin-bottom:14px;align-items:flex-start">
    <img src="icons/icon-192.png" alt="" style="width:44px;height:44px;border-radius:12px;flex:none">
    <div style="flex:1"><b>${t('installTitle')}</b><p class="muted small" style="margin:4px 0 0">${installEvt ? '' : ios ? t('installIOS') : t('installAndroid')}</p>
      ${installEvt ? `<button class="btn sm" data-act="install" style="margin-top:10px">${t('installBtn')}</button>` : ''}</div>
    <button data-act="hideInstall" aria-label="${t('close')}" class="muted" style="font-size:20px;line-height:1">×</button></div>`;
}

// ---------- partner brand recommendations ----------
const fmtUZS = n => `${fmtPrice(n)} ${t('sum')}`;
const prodItem = p => ({ id: 'prod-' + p.id, type: p.type, color: p.color, brand: BRANDS[p.brand].name, photo: false });
function gapsSection() {
  if (!S.items.length || !W) return '';
  const gaps = findGaps(S.items, PRODUCTS, W, S.profile, S.event, S.dismissed);
  if (!gaps.length) return '';
  acts.prod = el => { const g = gaps[el.dataset.i]; productSheet(g); };
  return `<div class="section-title"><h2>${t('gapTitle')}</h2></div>
    <p class="muted small" style="margin:-6px 0 12px">${t('gapSub')}</p>
    <div class="chips" style="gap:10px;padding-bottom:6px">${gaps.map((g, i) => {
      const p = g.product;
      return `<button class="prod" data-act="prod" data-i="${i}">
        <div class="tile" style="box-shadow:none"><img src="${src(prodItem(p))}" alt=""><span class="badge" style="position:absolute;left:6px;top:6px;font-size:10px;background:rgba(255,255,255,.85);color:#1C1A18">${t('partner')}</span></div>
        <b class="small" style="display:block;margin-top:8px">${esc(BRANDS[p.brand].name)}</b>
        <span class="small">${TYPES[p.type][getLang()]} · ${colorByKey(p.color)[getLang()]}</span>
        <span class="small" style="display:block;font-weight:600;margin-top:2px">${fmtUZS(p.price)}</span>
        <span class="small" style="display:block;color:var(--good);margin-top:2px">${t('newLooks', g.looks)}</span>
        <span class="muted" style="display:block;font-size:12px;margin-top:4px;white-space:normal">${t('gap.' + g.why)}</span></button>`;
    }).join('')}</div>`;
}
function productSheet(g) {
  const p = g.product, it = prodItem(p), b = BRANDS[p.brand];
  const looks = generate([...S.items, it], {
    weather: { morning: W.morning, day: W.day, code: W.dayCode }, event: S.event, seed: 'try' + p.id,
    prefs: S.prefs, worn: S.worn, profile: S.profile, now: now(),
  }, 5);
  const look = looks.find(o => outfitIds(o).includes(it.id)) || looks[0];
  const size = TYPES[p.type].cat === 'shoes' ? S.profile.shoeSize : TYPES[p.type].cat === 'bottom' ? S.profile.bottomSize : ['bag', 'acc'].includes(TYPES[p.type].cat) ? 'One size' : S.profile.topSize;
  openSheet(`
    <div class="row" style="justify-content:space-between;margin-bottom:10px"><div><h2>${esc(b.name)}</h2><span class="muted small">${b.tag[getLang()]} · ${t('partner')}</span></div>
      <b>${fmtUZS(p.price)}</b></div>
    <p style="margin:0 0 12px">${TYPES[p.type][getLang()]} · ${colorByKey(p.color)[getLang()]} — <span class="muted">${t('gap.' + g.why)}</span></p>
    ${look ? `<h3 style="margin-bottom:8px">${t('tryOn')}</h3>${lookHTML(look, { mode: 'flat' })}
      <div class="pieces">${outfitIds(look).map(id => id === it.id ? it : byId(id)).filter(Boolean).map(x => `<img src="${src(x)}" alt="" style="${x.id === it.id ? 'outline:2px solid var(--accent)' : ''}">`).join('')}</div>` : ''}
    <div class="row" style="margin:14px 0"><span class="badge" style="color:var(--good)">${t('newLooks', g.looks)}</span><span class="badge">✓ ${t('yourSize', esc(size))}</span></div>
    <div class="stack"><button class="btn" data-act="buy">${t('buyOnSite')}</button>
      <button class="btn ghost" data-act="dismiss">${t('notInterested')}</button></div>`, {
    buy: () => { toast(t('goingToBrand', b.name)); },
    dismiss: () => { S.dismissed.push(p.id); persist(); closeSheet(); render(); },
  });
}

function screenHome() {
  const looks = hasAccess() && W ? getLooks() : [];
  const hour = new Date().getHours();
  const greet = hour < 12 ? t('goodMorning', S.profile.name) : t('hello', S.profile.name);
  const trialLeft = S.sub.status === 'trial' ? Math.max(0, Math.ceil((S.sub.end - now()) / DAY)) : null;
  const used = usedPct();
  acts = { ...acts, ...lookActions(() => looksCache.list) };
  return `
    <div class="topbar">${logo()}<span class="muted small">${fmtDate(now())}</span></div>
    <h1 style="margin-bottom:4px">${esc(greet)}</h1>
    <p class="muted" style="margin:0 0 16px">${t('tagline')}</p>
    ${installCard()}
    ${trialLeft !== null ? `<p class="badge" style="margin:0 0 14px">${t('trialBanner', t('daysLeft', trialLeft))}</p>` : ''}
    ${weatherCard()}
    <div class="section-title"><h2>${t('lookOfDay')}</h2><button data-act="tab" data-k="ai">${t('moreLooks')} →</button></div>
    <div style="margin-bottom:12px">${eventChips()}</div>
    ${!hasAccess() ? paywallCard() : !W ? '<div class="spinner"></div>' : looks.length ? lookCard(looks[0], 0, { compact: true }) : needItemsCard()}
    ${gapsSection()}
    ${S.items.length ? `<div class="section-title"><h2>${t('stats')}</h2></div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="card"><h2>${S.items.length}</h2><span class="muted small">${t('statItems')}</span></div>
      <div class="card"><h2>${used}%</h2><span class="muted small">${t('statUsed')}</span></div>
      <div class="card"><h2>${S.worn.length}</h2><span class="muted small">${t('statLooks')}</span></div>
    </div>` : ''}`;
}
function usedPct() {
  if (!S.items.length) return 0;
  const since = now() - 30 * DAY, ids = new Set();
  for (const w of S.worn) if (w.date >= since) w.ids.forEach(i => ids.add(i));
  return Math.round(100 * [...ids].filter(id => byId(id)).length / S.items.length);
}

let thinking = false;
function screenAI() {
  const looks = hasAccess() && W && !thinking ? getLooks() : [];
  acts = { ...acts, ...lookActions(() => looksCache.list),
    regen: () => { S.reroll++; persist(); thinking = true; render(); setTimeout(() => { thinking = false; render(); }, 900); },
    mode: el => { S.viewMode = el.dataset.k; persist(); render(); },
  };
  return `
    <div class="topbar"><h1 style="display:flex;align-items:center;gap:8px"><span style="width:20px;height:20px;display:inline-flex">${I.spark}</span>${t('aiOutfit')}</h1>
      <button class="icon-btn" data-act="regen" aria-label="${t('regenerate')}">${I.refresh}</button></div>
    <div class="row" style="justify-content:space-between;margin-bottom:12px">
      <span class="muted small">${W ? `${t('morning')} ${deg(W.morning)} · ${t('day')} ${deg(W.day)}` : ''}</span>
      <div class="toggle"><button class="${S.viewMode === 'flat' ? 'on' : ''}" data-act="mode" data-k="flat">${t('flatlay')}</button>
        <button class="${S.viewMode === 'mann' ? 'on' : ''}" data-act="mode" data-k="mann">${t('mannequin')}</button></div>
    </div>
    <div style="margin-bottom:14px">${eventChips()}</div>
    ${!hasAccess() ? paywallCard() : thinking || !W ? `<div class="card empty"><div class="spinner"></div><p class="muted">${t('thinking')}</p></div>`
      : looks.length ? `<div class="carousel" id="car">${looks.map((o, i) => lookCard(o, i)).join('')}</div>
        <div class="dots">${looks.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>` : needItemsCard()}`;
}

function screenWardrobe() {
  const list = S.items.filter(it => S.wcat === 'all' || TYPES[it.type].cat === S.wcat);
  acts = { ...acts,
    wcat: el => { S.wcat = el.dataset.k; persist(); render(); },
    add: openScanner,
    item: el => editItemSheet(byId(el.dataset.id)),
  };
  return `
    <div class="topbar"><h1>${t('myWardrobe')}</h1><button class="icon-btn" data-act="add" aria-label="${t('addItem')}">${I.plus}</button></div>
    <p class="muted" style="margin:-10px 0 14px">${t('items', S.items.length)}</p>
    <div class="chips" style="margin-bottom:14px">${['all', ...CATS].map(c => `<button class="chip ${S.wcat === c ? 'on' : ''}" data-act="wcat" data-k="${c}">${t('cats.' + c)}</button>`).join('')}</div>
    ${S.items.length ? `<div class="grid">${list.map(it => `<button class="tile ${newIds.has(it.id) ? 'new' : ''}" data-act="item" data-id="${it.id}"><img src="${src(it)}" alt="${esc(itemName(it))}" loading="lazy"><span class="dot" style="background:${colorByKey(it.color).hex}"></span></button>`).join('')}</div>`
      : `<div class="card empty"><p>${t('emptyWardrobe')}</p><div class="stack" style="margin-top:12px"><button class="btn" data-act="add">${I.camera}${t('addItem')}</button><button class="btn ghost" data-act="loadDemo">${t('loadDemo')}</button></div></div>`}`;
}

// ---------- friends (demo data, no server) ----------
const allFriends = () => [...FRIENDS, ...(S.extraFriends || [])];
const fname = f => f[getLang()] || f.ru;
const friendItems = f => f.w.map(([type, color], n) => ({ id: `${f.id}-${n}`, type, color, photo: false }));
function friendLooks(f, event, n, salt = '') {
  const w = W || { morning: 10, day: 18, dayCode: 1 };
  return generate(friendItems(f), {
    weather: { morning: w.morning, day: w.day, code: w.dayCode }, event, seed: f.id + new Date(now()).toDateString() + salt,
    prefs: { items: {} }, worn: [], profile: { styles: [], colors: [] }, now: now(),
  }, n);
}
function sendToFriendSheet() {
  openSheet(`<h2 style="margin-bottom:14px">${t('chooseFriend')}</h2><div class="list">${allFriends().map(f =>
    `<button class="list-row" data-act="sendTo" data-id="${f.id}"><span class="row"><span class="avatar" style="background:${f.hue}">${esc(fname(f)[0])}</span>${esc(fname(f))}</span>${I.chev.replace('<svg', '<svg width="18" height="18"')}</button>`).join('')}</div>`, {
    sendTo: el => { const f = allFriends().find(x => x.id === el.dataset.id); closeSheet(); toast(t('sentTo', fname(f))); },
  });
}
function adviseSheet(f) {
  const looks = friendLooks(f, S.event, 3, 'adv' + S.reroll);
  openSheet(`<h2>${t('adviseLook')} · ${esc(fname(f))}</h2><p class="muted small">${t('adviseSub')}</p>
    <div style="margin-bottom:12px">${eventChips().replaceAll('data-act="event"', 'data-act="advEvent"')}</div>
    <div class="grid2">${looks.map((o, i) => `<div>${lookHTML(o, { mode: 'flat' })}<button class="btn sm" style="width:100%;margin-top:8px" data-act="advSend" data-i="${i}">${t('send')}</button></div>`).join('')}</div>`, {
    advSend: () => { closeSheet(); toast(t('sentTo', fname(f))); },
    advEvent: el => { S.event = el.dataset.k; persist(); adviseSheet(f); },
  });
}
function friendsFeed() {
  const evs = ['meeting', 'study', 'work', 'event'];
  const day = new Date(now()).toDateString();
  acts = { ...acts,
    flike: el => { const k = el.dataset.k; S.friendLikes[k] = !S.friendLikes[k]; persist(); render(); },
    advise: el => adviseSheet(allFriends().find(f => f.id === el.dataset.id)),
    addFriend: () => {
      const code = ($('#fcode').value || '').trim().toUpperCase();
      if (code === S.refCode) return toast(t('refOwn'));
      if (!/^LKS-[A-Z0-9]{4}$/.test(code)) return toast(t('promoBad'));
      const n = (S.extraFriends || []).length;
      const [ru, en] = EXTRA_FRIEND_NAMES[n % EXTRA_FRIEND_NAMES.length];
      const w = DEMO_WARDROBE.filter((_, i) => (i * 7 + code.charCodeAt(5) + n) % 3 !== 0).map(([ty, c]) => [ty, c]);
      const hue = ['#E7B3BC', '#A9C4E2', '#9FB295', '#E2BF4C', '#D6BF9F'][n % 5];
      S.extraFriends = [{ id: 'x' + code, ru, en, hue, likes: 3 + (code.charCodeAt(6) % 12), w }, ...(S.extraFriends || []).filter(f => f.id !== 'x' + code)];
      persist(); toast(t('friendAdded', getLang() === 'ru' ? ru : en)); render();
    },
  };
  return `<p class="muted small" style="margin:0 0 10px">${t('friendsHint')}</p>
    <div class="row" style="margin-bottom:16px"><input id="fcode" class="input" style="height:44px" placeholder="${t('addFriend')}"><button class="btn sm" data-act="addFriend">${t('add')}</button></div>
    <div class="stack">${allFriends().map((f, i) => {
      const ev = evs[i % evs.length], look = friendLooks(f, ev, 1)[0]; if (!look) return '';
      const k = f.id + day, liked = !!S.friendLikes[k];
      return `<div class="card">
        <div class="row" style="margin-bottom:10px"><span class="avatar" style="background:${f.hue}">${esc(fname(f)[0])}</span>
          <div style="flex:1"><b>${esc(fname(f))}</b><div class="muted small">${t('today')} · ${t('events.' + ev)}</div></div></div>
        ${lookHTML(look, { mode: 'flat' })}
        <div class="row" style="margin-top:10px"><button class="chip ${liked ? 'on' : ''}" data-act="flike" data-k="${k}">${I.heart.replace('<svg', '<svg width="16" height="16"')} ${f.likes + (liked ? 1 : 0)}</button>
          <span style="flex:1"></span><button class="btn sm ghost" data-act="advise" data-id="${f.id}">✦ ${t('adviseLook')}</button></div></div>`;
    }).join('')}</div>`;
}

function screenOutfits() {
  const list = S.otab === 'friends' ? [] : (S.otab === 'saved' ? S.saved : S.worn).map(rehydrate).filter(o => Object.keys(o.parts).length >= 2);
  acts = { ...acts,
    otab: el => { S.otab = el.dataset.k; persist(); render(); },
    openLook: el => {
      const o = list[el.dataset.i];
      const L = [o];
      openSheet(`${lookCard(o, 0, { compact: true })}<p class="muted small" style="text-align:center">${fmtDate(o.date)}</p>
        <button class="btn ghost" data-act="shareFriend">${t('sendToFriend')}</button>`,
        { ...lookActions(() => L), shareFriend: sendToFriendSheet });
    },
  };
  return `
    <div class="topbar"><h1>${t('yourOutfits')}</h1></div>
    <div class="toggle" style="margin-bottom:16px"><button class="${S.otab === 'saved' ? 'on' : ''}" data-act="otab" data-k="saved">${t('savedTab')} · ${S.saved.length}</button>
      <button class="${S.otab === 'history' ? 'on' : ''}" data-act="otab" data-k="history">${t('historyTab')} · ${S.worn.length}</button>
      <button class="${S.otab === 'friends' ? 'on' : ''}" data-act="otab" data-k="friends">${t('friendsTab')}</button></div>
    ${S.otab === 'friends' ? friendsFeed() : list.length ? `<div class="grid2">${list.map((o, i) => `<button data-act="openLook" data-i="${i}" style="text-align:left">${lookHTML(o, { mode: 'flat' })}
      <div class="small" style="margin-top:6px">${t('events.' + (o.event || 'study'))}</div><div class="muted small">${fmtDate(o.date)}</div></button>`).join('')}</div>`
      : `<div class="card empty muted">${S.otab === 'saved' ? t('noSaved') : t('noHistory')}</div>`}`;
}

function screenProfile() {
  subTick();
  const s = S.sub;
  const left = s.end ? Math.max(0, Math.ceil((s.end - now()) / DAY)) : 0;
  acts = { ...acts,
    setLang: el => { S.settings.lang = el.dataset.k; setLang(el.dataset.k); persist(); looksCache.sig = ''; render(); },
    setTheme: el => { S.settings.theme = el.dataset.k; persist(); applyTheme(); render(); },
    subscribe: () => paySheet({ trial: false }).then(render),
    cancelSub: () => { S.sub.status = 'canceled'; persist(); toast(t('canceledMsg')); render(); },
    resumeSub: () => { S.sub.status = 'active'; persist(); render(); },
    promo: () => { if (applyCode($('#promo').value)) render(); },
    shareRef, simInvite: () => { S.invited = (S.invited || 0) + 1; persist(); toast(t('inviteBonus', refBonus())); render(); },
    shift: () => { S.shift += 7; persist(); subTick(); looksCache.sig = ''; render(); },
    reset: async () => {
      if (!confirm(t('resetConfirm'))) return;
      localStorage.removeItem(KEY); try { await idbTx('readwrite', st => st.clear()); } catch {} location.reload();
    },
    notif: async () => {
      if (!('Notification' in window)) return toast(t('notifDenied'));
      const p = await Notification.requestPermission();
      if (p !== 'granted') return toast(t('notifDenied'));
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body: t('notifBody'), icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
      if (reg) reg.showNotification('Looksy', opts); else new Notification('Looksy', opts);
    },
    editSizes: () => sizesSheet(),
    editStyle: () => styleSheet(),
  };
  const statusLine = s.status === 'trial' ? t('daysLeft', left) : s.status === 'active' ? t('renews', fmtDate(s.end))
    : s.status === 'canceled' ? t('endsOn', fmtDate(s.end)) : '';
  const p = S.profile;
  return `
    <div class="topbar"><h1>${t('profile')}</h1></div>
    <div class="card row" style="margin-bottom:14px"><div class="icon-btn" style="width:56px;height:56px;box-shadow:none;background:var(--surface-2)">${I.user}</div>
      <div><h2>${esc(p.name || 'Looksy')}</h2><span class="muted small">${(p.styles || []).map(k => t('styles.' + k)).join(', ')}</span></div></div>

    <div class="section-title"><h3>${t('subscription')}</h3></div>
    <div class="card">
      <div class="row" style="justify-content:space-between"><b>${t('premium')}</b><span class="badge">${t('subStatus.' + (s.status || 'none'))}</span></div>
      <p class="muted small" style="margin:6px 0 12px">${statusLine}${s.method ? ` · ${esc(s.method)}${s.last4 ? ' •••• ' + esc(s.last4) : ''}` : ''}</p>
      <p style="margin:0 0 12px"><b>${fmtPrice(priceWithPromo())}</b> <span class="muted">${t('perMonth')}</span>
        ${discountPct() ? `<s class="muted small">${fmtPrice(PRICE)}</s>` : ''}
        ${s.promo ? ` <span class="badge">${esc(s.promoLabel || s.promo)} −${promoPct()}%</span>` : ''}${refBonus() ? ` <span class="badge">${t('inviteBonus', refBonus())}</span>` : ''}</p>
      ${s.status === 'trial' || s.status === 'active' ? `<button class="btn ghost sm" data-act="cancelSub">${t('cancelSub')}</button>`
        : s.status === 'canceled' && now() <= s.end ? `<button class="btn sm" data-act="resumeSub">${t('resume')}</button>`
        : `<button class="btn sm" data-act="subscribe">${t('subscribe')}</button>`}
      <div class="row" style="margin-top:12px"><input id="promo" class="input" placeholder="${t('promo')}: STUDENT" style="height:40px"><button class="btn sm ghost" data-act="promo">${t('apply')}</button></div>
    </div>

    <div class="section-title"><h3>${t('refTitle')}</h3></div>
    <div class="card">
      <p class="muted small" style="margin:0">${t('refSub')}</p>
      <div class="ref-code">${esc(S.refCode)}</div>
      <div class="row" style="justify-content:space-between"><span class="small">${t('invited', S.invited || 0)}</span>
        <button class="btn sm" data-act="shareRef">${t('share')}</button></div>
    </div>

    <div class="section-title"><h3>${t('settings')}</h3></div>
    <div class="list">
      <button class="list-row" data-act="editStyle"><span>${t('stylePrefs')}</span>${I.chev.replace('<svg', '<svg width="18" height="18"')}</button>
      <button class="list-row" data-act="editSizes"><span>${t('sizes')}</span><span class="muted small">${esc(p.topSize)} · ${esc(p.bottomSize)} · ${esc(p.shoeSize)}</span></button>
      <div class="list-row"><span>${t('city')}</span><span class="muted">${(CITIES.find(c => c.k === p.city) || CITIES[0])[getLang()]}</span></div>
      <div class="list-row"><span>${t('notifications')}</span><input type="time" class="input" style="width:110px;height:36px" data-bind="time" value="${esc(p.time)}"></div>
      <button class="list-row" data-act="notif"><span>${t('testNotif')}</span>${I.chev.replace('<svg', '<svg width="18" height="18"')}</button>
      <div class="list-row"><span>${t('language')}</span><div class="toggle">${['ru', 'en'].map(l => `<button class="${getLang() === l ? 'on' : ''}" data-act="setLang" data-k="${l}">${l.toUpperCase()}</button>`).join('')}</div></div>
      <div class="list-row"><span>${t('theme')}</span><div class="toggle">${[['system', 'themeSystem'], ['light', 'themeLight'], ['dark', 'themeDark']].map(([k, n]) => `<button class="${S.settings.theme === k ? 'on' : ''}" data-act="setTheme" data-k="${k}">${t(n)}</button>`).join('')}</div></div>
    </div>
    <p class="muted small" style="margin:12px 4px">${t('privacy')}</p>

    <div class="section-title"><h3>${t('demoTools')}</h3></div>
    <div class="stack"><button class="btn ghost" data-act="shift">${t('shiftDays')}</button>
      <button class="btn ghost" data-act="simInvite">${t('simInvite')}</button>
      <button class="btn ghost" data-act="loadDemo">${t('loadDemo')}</button>
      <button class="btn ghost" data-act="reset" style="color:var(--bad)">${t('resetAll')}</button></div>`;
}

// ---------- sheets ----------
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const sizesForm = () => {
  const p = S.profile;
  return `<div class="grid2">
    <label class="field"><span>${t('height')}</span><input class="input" inputmode="numeric" data-bind="height" value="${esc(p.height)}" placeholder="170"></label>
    <label class="field"><span>${t('weight')}</span><input class="input" inputmode="numeric" data-bind="weight" value="${esc(p.weight)}" placeholder="60"></label></div>
    <label class="field"><span>${t('topSize')}</span><div class="chips">${SIZES.map(s => `<button class="chip ${p.topSize === s ? 'on' : ''}" data-act="pset" data-f="topSize" data-v="${s}">${s}</button>`).join('')}</div></label>
    <div class="grid2"><label class="field"><span>${t('bottomSize')}</span><input class="input" inputmode="numeric" data-bind="bottomSize" value="${esc(p.bottomSize)}"></label>
    <label class="field"><span>${t('shoeSize')}</span><input class="input" inputmode="numeric" data-bind="shoeSize" value="${esc(p.shoeSize)}"></label></div>`;
};
const styleForm = () => {
  const p = S.profile;
  return `<p class="muted small">${t('onbStyleSub')}</p><div class="chips wrap" style="margin-bottom:20px">${Object.keys(t('styles')).map(k =>
    `<button class="chip ${p.styles.includes(k) ? 'on' : ''}" data-act="toggleStyle" data-k="${k}">${t('styles.' + k)}</button>`).join('')}</div>
    <h3 style="margin-bottom:10px">${t('onbColors')}</h3><div class="swatches">${COLORS.filter(c => c.k !== 'gold').map(c =>
    `<button class="swatch ${p.colors.includes(c.k) ? 'on' : ''}" style="background:${c.hex}" data-act="toggleColor" data-k="${c.k}" title="${c[getLang()]}" aria-label="${c[getLang()]}"></button>`).join('')}</div>`;
};
const profileToggles = redraw => ({
  pset: el => { S.profile[el.dataset.f] = el.dataset.v; persist(); redraw(); },
  toggleStyle: el => { const a = S.profile.styles; const k = el.dataset.k; S.profile.styles = a.includes(k) ? a.filter(x => x !== k) : [...a, k]; persist(); redraw(); },
  toggleColor: el => { const a = S.profile.colors; const k = el.dataset.k; S.profile.colors = a.includes(k) ? a.filter(x => x !== k) : [...a, k]; persist(); redraw(); },
});
function sizesSheet() {
  const draw = () => openSheet(`<h2 style="margin-bottom:16px">${t('sizes')}</h2>${sizesForm()}<button class="btn" data-act="closeSheet">${t('done')}</button>`, { ...profileToggles(draw), closeSheet: () => { closeSheet(); render(); } });
  draw();
}
function styleSheet() {
  const draw = () => openSheet(`<h2 style="margin-bottom:8px">${t('stylePrefs')}</h2>${styleForm()}<div style="margin-top:20px"><button class="btn" data-act="closeSheet">${t('done')}</button></div>`, { ...profileToggles(draw), closeSheet: () => { closeSheet(); looksCache.sig = ''; render(); } });
  draw();
}

function addItemSheet() {
  openSheet(`<h2 style="margin-bottom:16px">${t('addItem')}</h2><div class="stack">
    <button class="btn" data-act="cam">${I.camera}${t('takePhoto')}</button>
    <button class="btn ghost" data-act="gal">${I.image}${t('fromGallery')}</button></div>`, {
    cam: () => pickFile('#camera-input'), gal: () => pickFile('#file-input'),
  });
}
function pickFile(sel) {
  const inp = $(sel); inp.value = '';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    openSheet(`<div class="spinner"></div><p class="muted" style="text-align:center">${t('processing')}</p>`);
    try {
      const r = await processPhoto(f);
      editItemSheet({ id: uid(), type: r.guess, color: r.colors[0], brand: '', madeIn: '', size: S.profile.topSize, photo: true, _new: true, _url: r.url, _colors: r.colors });
    } catch { closeSheet(); toast('Error'); }
  };
  inp.click();
}
// ---------- in-app scanner ----------
let newIds = new Set();
async function openScanner() {
  closeSheet();
  const root = document.createElement('div');
  root.className = 'scanner';
  document.body.appendChild(root);
  let stream = null, added = 0, busy = false;
  root.innerHTML = `
    <video playsinline muted autoplay></video>
    <div class="scan-frame"><i></i><i></i><i></i><i></i><div class="scan-line"></div></div>
    <div class="scan-top"><button class="icon-btn" data-s="close" aria-label="${t('close')}">${ic('<path d="M6 6l12 12M18 6L6 18"/>')}</button>
      <div class="scan-title">${t('scanTitle')}<div class="scan-ai small" style="opacity:.75;font-weight:400"></div></div><span style="width:40px"></span></div>
    <div class="scan-hint">${t('scanHint')}</div>
    <div class="scan-bottom"><button class="icon-btn" data-s="gallery" aria-label="${t('fromGallery')}">${I.image}</button>
      <button class="shutter" data-s="shoot" aria-label="${t('takePhoto')}"></button>
      <span class="scan-count" hidden></span></div>`;
  const video = root.querySelector('video'), frame = root.querySelector('.scan-frame'), hint = root.querySelector('.scan-hint');
  const count = root.querySelector('.scan-count');
  const aiEl = root.querySelector('.scan-ai');
  const aiStatus = () => { aiEl.textContent = (modelState === 'ready' ? '✦ ' : '') + t('aiModel.' + (modelState === 'idle' ? 'loading' : modelState)); };
  aiStatus(); loadModel().then(aiStatus);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw 0;
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1600 } }, audio: false });
      video.srcObject = stream; await video.play().catch(() => {});
    } catch {
      root.querySelector('.shutter').style.visibility = 'hidden';
      frame.style.display = 'none'; hint.style.display = 'none';
      const empty = document.createElement('div'); empty.className = 'scan-empty';
      empty.innerHTML = `<div><div style="width:56px;height:56px;margin:0 auto 14px">${I.camera}</div><p style="max-width:280px;margin:0 auto 18px">${t('noCamera')}</p>
        <button class="btn" data-s="gallery" style="background:#fff;color:#1C1A18;width:auto">${I.image}${t('pickPhoto')}</button></div>`;
      root.appendChild(empty);
    }
  };
  const stop = () => { stream?.getTracks().forEach(tr => tr.stop()); stream = null; };
  const close = () => {
    stop(); root.remove();
    if (added) { S.tab = 'wardrobe'; S.wcat = 'all'; persist(); toast(t('scanAddedToast', added)); }
    render();
  };

  // crop the frame area out of the cover-scaled video
  const grab = () => {
    const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return null;
    const vr = video.getBoundingClientRect(), fr = frame.getBoundingClientRect();
    const s = Math.max(vr.width / vw, vr.height / vh);
    const ox = (vw * s - vr.width) / 2, oy = (vh * s - vr.height) / 2;
    const sx = (fr.left - vr.left + ox) / s, sy = (fr.top - vr.top + oy) / s, sw = fr.width / s, sh = fr.height / s;
    const cv = document.createElement('canvas'); cv.width = Math.round(sw); cv.height = Math.round(sh);
    cv.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    return new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
  };

  const analyse = async blob => {
    busy = true; root.classList.add('busy'); hint.textContent = t('scanning');
    let r, ai = null;
    try {
      [r] = await Promise.all([processPhoto(blob), new Promise(res => setTimeout(res, 1300))]);
      ai = await classify(r.url).catch(() => null);
    } catch { root.classList.remove('busy'); hint.textContent = t('scanHint'); busy = false; toast('Error'); return; }
    root.classList.remove('busy'); hint.textContent = t('scanHint'); aiStatus();
    showResult({ id: uid(), type: ai ? ai.type : r.guess, color: r.colors[0], brand: '', madeIn: '', size: S.profile.topSize, photo: true, _url: r.url, _colors: r.colors, _ai: ai });
  };

  const showResult = it => {
    const card = document.createElement('div'); card.className = 'scan-result';
    const draw = () => {
      card.innerHTML = `
        <div class="row" style="justify-content:space-between;margin-bottom:12px"><span class="badge">✦ ${t('recognized')}</span><span class="muted small">${it._ai ? t('recognizedPct', it._ai.p) : t('recognizedShape')}</span></div>
        <div class="preview"><img src="${it._url}" alt=""></div>
        <div class="detect"><div><span>${t('type')}</span><b>${TYPES[it.type][getLang()]}</b></div>
          <div><span>${t('color')}</span><b style="display:flex;align-items:center;gap:6px"><i class="swatch" style="width:14px;height:14px;background:${colorByKey(it.color).hex}"></i>${colorByKey(it.color)[getLang()]}</b></div></div>
        <div class="chips" style="margin-bottom:10px">${[...new Set([it.type, 'tshirt', 'shirt', 'sweater', 'hoodie', 'blazer', 'denimjacket', 'jeans', 'trousers', 'skirt', 'dress', 'sneakers', 'boots', 'handbag'])].map(k => `<button class="chip ${k === it.type ? 'on' : ''}" data-s="type" data-k="${k}">${TYPES[k][getLang()]}</button>`).join('')}
          <select class="chip" data-s="typeSel" style="padding-right:8px">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${k === it.type ? 'selected' : ''}>${v[getLang()]}</option>`).join('')}</select></div>
        <div class="swatches" style="margin-bottom:14px">${[...it._colors, ...['black', 'white', 'grey', 'beige', 'navy', 'denim', 'brown'].filter(k => !it._colors.includes(k))].slice(0, 9).map(k =>
          `<button class="swatch ${k === it.color ? 'on' : ''}" style="background:${colorByKey(k).hex}" data-s="color" data-k="${k}" aria-label="${colorByKey(k)[getLang()]}"></button>`).join('')}</div>
        <input class="input" data-s="brand" list="brands2" placeholder="${t('brand')}: Zara, H&M, Local brand…" value="${esc(it.brand)}" style="margin-bottom:14px">
        <datalist id="brands2">${['Zara', 'H&M', 'Mango', 'Uniqlo', 'Massimo Dutti', 'Koton', 'LC Waikiki', 'Nike', 'Adidas', "Levi's", 'Local brand'].map(b => `<option value="${esc(b)}">`).join('')}</datalist>
        <div class="row"><button class="btn ghost" data-s="retake" style="flex:0 0 auto;width:auto">${t('retake')}</button><button class="btn" data-s="save">${t('toWardrobe')}</button></div>`;
    };
    card.addEventListener('click', e => {
      const el = e.target.closest('[data-s]'); if (!el) return;
      const brand = card.querySelector('[data-s=brand]'); if (brand) it.brand = brand.value.trim();
      if (el.dataset.s === 'type') { it.type = el.dataset.k; draw(); }
      else if (el.dataset.s === 'color') { it.color = el.dataset.k; draw(); }
      else if (el.dataset.s === 'retake') { card.remove(); busy = false; }
      else if (el.dataset.s === 'save') save();
    });
    card.addEventListener('change', e => { if (e.target.dataset.s === 'typeSel') { it.type = e.target.value; draw(); } });
    const save = async () => {
      imgs[it.id] = it._url;
      try { await idbTx('readwrite', st => st.put(it._url, it.id)); } catch {}
      S.items.unshift({ id: it.id, type: it.type, color: it.color, brand: it.brand, size: it.size, madeIn: '', photo: true, added: now() });
      persist(); added++; newIds.add(it.id);
      count.hidden = false; count.textContent = t('scanAdded', added);
      card.remove(); busy = false;
    };
    draw(); root.appendChild(card);
  };

  root.addEventListener('click', async e => {
    const el = e.target.closest('[data-s]'); if (!el || el.closest('.scan-result')) return;
    const a = el.dataset.s;
    if (a === 'close') close();
    else if (a === 'shoot' && !busy) {
      const p = grab(); if (!p) return;
      const fl = document.createElement('div'); fl.className = 'flash'; root.appendChild(fl); setTimeout(() => fl.remove(), 400);
      analyse(await p);
    } else if (a === 'gallery' && !busy) {
      const inp = $('#file-input'); inp.value = '';
      inp.onchange = () => { const f = inp.files[0]; if (f) analyse(f); };
      inp.click();
    }
  });
  startCamera();
}

function editItemSheet(item) {
  if (!item) return;
  const it = { ...item };
  const wornN = S.worn.filter(w => w.ids.includes(it.id)).length;
  const last = S.worn.find(w => w.ids.includes(it.id));
  const preview = () => it._url || src(it);
  const draw = () => openSheet(`
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">
      <div class="tile" style="width:110px;flex:none"><img src="${preview()}" alt=""></div>
      <div><h2>${esc(itemName(it))}</h2>
        ${it._new ? `<span class="badge">✦ ${t('aiDetected')}</span>` : `<p class="muted small" style="margin:6px 0 0">${wornN ? t('wornTimes', wornN) + ', ' + t('lastWorn', fmtDate(last.date)) : t('neverWorn')}</p>`}</div></div>
    <label class="field"><span>${t('type')}</span><select class="input" id="f-type">${CATS.map(c => `<optgroup label="${t('cats.' + c)}">${Object.entries(TYPES).filter(([, v]) => v.cat === c).map(([k, v]) =>
      `<option value="${k}" ${k === it.type ? 'selected' : ''}>${v[getLang()]}</option>`).join('')}</optgroup>`).join('')}</select></label>
    <div class="field"><span>${t('color')}</span><div class="swatches">${[...(it._colors || []), ...COLORS.map(c => c.k).filter(k => !(it._colors || []).includes(k))].map(k =>
      `<button class="swatch ${k === it.color ? 'on' : ''}" style="background:${colorByKey(k).hex}" data-act="fcolor" data-k="${k}" aria-label="${colorByKey(k)[getLang()]}"></button>`).join('')}</div></div>
    <div class="grid2"><label class="field"><span>${t('brand')}</span><input class="input" id="f-brand" list="brands" value="${esc(it.brand)}" placeholder="Zara"></label>
      <label class="field"><span>${t('size')}</span><input class="input" id="f-size" value="${esc(it.size)}"></label></div>
    <label class="field"><span>${t('madeIn')}</span><input class="input" id="f-made" value="${esc(it.madeIn)}" placeholder="Uzbekistan"></label>
    <datalist id="brands">${['Zara', 'H&M', 'Mango', 'Uniqlo', 'Massimo Dutti', 'Koton', 'LC Waikiki', 'Nike', 'Adidas', "Levi's", 'Local brand'].map(b => `<option value="${esc(b)}">`).join('')}</datalist>
    <div class="row"><button class="btn" data-act="fsave">${t('save')}</button>${it._new ? '' : `<button class="btn ghost" data-act="fdel" style="color:var(--bad)">${t('del')}</button>`}</div>`, handlers);
  const readForm = () => { it.type = $('#f-type').value; it.brand = $('#f-brand').value.trim(); it.size = $('#f-size').value.trim(); it.madeIn = $('#f-made').value.trim(); };
  const handlers = {
    fcolor: el => { readForm(); it.color = el.dataset.k; draw(); },
    fsave: async () => {
      readForm();
      const clean = { id: it.id, type: it.type, color: it.color, brand: it.brand, size: it.size, madeIn: it.madeIn, photo: !!it.photo, added: it.added || now() };
      if (it._new && it._url) { imgs[it.id] = it._url; try { await idbTx('readwrite', st => st.put(it._url, it.id)); } catch {} }
      const i = S.items.findIndex(x => x.id === it.id);
      if (i >= 0) S.items[i] = clean; else S.items.unshift(clean);
      persist(); closeSheet(); toast(it._new ? t('itemAdded') : t('save')); render();
    },
    fdel: async () => {
      S.items = S.items.filter(x => x.id !== it.id); delete imgs[it.id];
      try { await idbTx('readwrite', st => st.delete(it.id)); } catch {}
      persist(); closeSheet(); toast(t('itemDeleted')); render();
    },
  };
  draw();
}

function loadDemo() {
  const have = new Set(S.items.filter(i => !i.photo).map(i => i.type + i.color));
  const t0 = now();
  DEMO_WARDROBE.forEach(([type, color, brand, madeIn], n) => {
    if (have.has(type + color)) return;
    S.items.push({ id: uid(), type, color, brand, madeIn, size: S.profile.topSize, photo: false, added: t0 - n * 1000 });
  });
  persist(); toast(t('itemAdded')); render();
}

// ---------- onboarding ----------
function screenOnboarding() {
  const st = S.step, total = 6;
  const go = d => { S.step = Math.max(0, st + d); persist(); render(); };
  acts = { ...acts, ...profileToggles(render),
    next: () => go(1), prev: () => go(-1),
    lang: el => { S.settings.lang = el.dataset.k; setLang(el.dataset.k); persist(); render(); },
    trial: () => paySheet({ trial: true }).then(() => go(1)),
    finishDemo: () => { loadDemo(); finishOnb(); },
    finishOwn: () => { finishOnb(); S.tab = 'wardrobe'; persist(); render(); setTimeout(openScanner, 200); },
  };
  const bar = `<div class="row" style="margin-bottom:16px">${st > 0 ? `<button class="icon-btn" data-act="prev" aria-label="${t('back')}">${I.back}</button>` : ''}
    <div class="progress" style="flex:1;margin:0"><i style="width:${(st / total) * 100}%"></i></div></div>`;
  const nextBtn = (label = t('next')) => `<button class="btn" data-act="next">${label}</button>`;
  const p = S.profile;
  let body;
  if (st === 0) body = `<div class="onb"><div class="hero grow">${logo()}<p class="muted" style="max-width:260px;margin:14px auto">${t('tagline')}</p></div>
      <div class="row" style="justify-content:center;margin-bottom:16px"><div class="toggle">${['ru', 'en'].map(l => `<button class="${getLang() === l ? 'on' : ''}" data-act="lang" data-k="${l}">${l === 'ru' ? 'Русский' : 'English'}</button>`).join('')}</div></div>
      ${nextBtn(t('getStarted'))}</div>`;
  else if (st === 1) body = `<div class="onb">${bar}<div class="grow"><h1 style="margin-bottom:20px">${t('onbName')}</h1>
      <input class="input" data-bind="name" value="${esc(p.name)}" placeholder="${t('namePh')}" autocomplete="given-name">
      <h2 style="margin:28px 0 6px">${t('onbStyle')}</h2><p class="muted small">${t('onbStyleSub')}</p>
      <div class="chips wrap">${Object.keys(t('styles')).map(k => `<button class="chip ${p.styles.includes(k) ? 'on' : ''}" data-act="toggleStyle" data-k="${k}">${t('styles.' + k)}</button>`).join('')}</div></div>${nextBtn()}</div>`;
  else if (st === 2) body = `<div class="onb">${bar}<div class="grow"><h1>${t('onbColors')}</h1><p class="muted">${t('onbColorsSub')}</p>
      <div class="swatches" style="gap:14px">${COLORS.filter(c => c.k !== 'gold').map(c => `<button class="swatch ${p.colors.includes(c.k) ? 'on' : ''}" style="background:${c.hex};width:44px;height:44px" data-act="toggleColor" data-k="${c.k}" aria-label="${c[getLang()]}"></button>`).join('')}</div></div>${nextBtn()}</div>`;
  else if (st === 3) body = `<div class="onb">${bar}<div class="grow"><h1>${t('onbSizes')}</h1><p class="muted">${t('onbSizesSub')}</p>${sizesForm()}</div>${nextBtn()}</div>`;
  else if (st === 4) body = `<div class="onb">${bar}<div class="grow"><h1>${t('onbCity')}</h1><p class="muted">${t('onbCitySub')}</p>
      <label class="field"><span>${t('city')}</span><select class="input" data-bind="city">${CITIES.map(c => `<option value="${c.k}">${c[getLang()]}</option>`).join('')}</select></label>
      <label class="field"><span>${t('morningTime')}</span><input type="time" class="input" data-bind="time" value="${esc(p.time)}"></label></div>${nextBtn()}</div>`;
  else if (st === 5) body = `<div class="onb">${bar}<div class="grow"><h1>${t('premium')}</h1><p class="muted">${t('trialSub')}</p>
      <ul class="why" style="font-size:16px;margin:20px 0">${['feat1', 'feat2', 'feat3', 'feat4'].map(f => `<li>${t(f)}</li>`).join('')}</ul>
      <div class="card" style="text-align:center"><h2>${t('trialTitle')}</h2><p class="muted small" style="margin:6px 0 0">${t('for')} 0 ${t('perMonth')} → ${fmtPrice(PRICE)} ${t('perMonth')}</p></div></div>
      <button class="btn" data-act="trial">${t('startTrial')}</button></div>`;
  else body = `<div class="onb">${bar}<div class="grow"><h1>${t('onbWardrobe')}</h1><p class="muted">${t('onbWardrobeSub')}</p>
      <div class="grid" style="margin-top:20px">${DEMO_WARDROBE.slice(0, 9).map(([ty, c]) => `<div class="tile"><img src="${svgURL(ty, colorByKey(c).hex)}" alt=""></div>`).join('')}</div></div>
      <div class="stack"><button class="btn" data-act="finishDemo">${t('loadDemo')}</button><button class="btn ghost" data-act="finishOwn">${I.camera}${t('addOwn')}</button></div></div>`;
  return body;
}
function finishOnb() { S.onboarded = true; S.tab = 'home'; persist(); render(); }

// ---------------- render ----------------
function render() {
  applyTheme();
  acts = {
    tab: el => { S.tab = el.dataset.k; persist(); render(); window.scrollTo(0, 0); },
    event: el => { S.event = el.dataset.k; persist(); render(); },
    loadDemo, subscribe: () => paySheet({ trial: false }).then(render),
    closeSheet,
  };
  subTick();
  const view = $('#view');
  view.classList.toggle('full', !S.onboarded);
  const screens = { home: screenHome, ai: screenAI, wardrobe: screenWardrobe, outfits: screenOutfits, profile: screenProfile };
  view.innerHTML = S.onboarded ? (screens[S.tab] || screenHome)() : screenOnboarding();
  tabbar();
  const car = $('#car');
  if (car) car.addEventListener('scroll', () => {
    const i = Math.round(car.scrollLeft / (car.firstElementChild.offsetWidth + 12));
    document.querySelectorAll('.dots i').forEach((d, j) => d.classList.toggle('on', j === i));
  }, { passive: true });
}

function morningCheck() {
  // Without a push server a PWA can only remind while it is open / when it is launched.
  const [h, m] = (S.profile.time || '08:00').split(':').map(Number);
  const d = new Date(), today = d.toDateString();
  if (S.onboarded && S.notifiedOn !== today && d.getHours() * 60 + d.getMinutes() >= h * 60 + m && 'Notification' in window && Notification.permission === 'granted') {
    S.notifiedOn = today; persist();
    navigator.serviceWorker?.getRegistration().then(reg => reg?.showNotification('Looksy', { body: t('notifBody'), icon: 'icons/icon-192.png' }));
  }
}

async function init() {
  render();
  await loadImages();
  render();
  await loadWeather();
  render();
  morningCheck(); setInterval(morningCheck, 60e3);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();
