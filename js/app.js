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
const LOCALE = { ru: 'ru-RU', en: 'en-GB', uz: 'uz-Latn-UZ' };
// browsers' Uzbek locale data is patchy ("M11 21"), so Uzbek dates are spelled out by hand
const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const UZ_WD = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const fmtDate = ts => { const d = new Date(ts); return getLang() === 'uz' ? `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}` : d.toLocaleDateString(LOCALE[getLang()] || 'ru-RU', { day: 'numeric', month: 'long' }); };
const wdShort = d => getLang() === 'uz' ? UZ_WD[d.getDay()] : d.toLocaleDateString(LOCALE[getLang()] || 'ru-RU', { weekday: 'short' });
const fmtPrice = n => n.toLocaleString(getLang() === 'en' ? 'en-US' : 'ru-RU');
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=7`;
    const r = await fetch(url); if (!r.ok) throw 0;
    const j = await r.json();
    const T = j.hourly.temperature_2m, C = j.hourly.weather_code;
    const week = [];
    for (let d = 0; d < 7 && T.length >= d * 24 + 20; d++) {
      const b = d * 24;
      week.push({ date: j.hourly.time[b].slice(0, 10), morning: T[b + 8], day: Math.max(T[b + 13], T[b + 14], T[b + 15]), evening: T[b + 19], code: Math.max(...C.slice(b + 7, b + 20)) });
    }
    W = { now: j.current.temperature_2m, code: j.current.weather_code, morning: week[0].morning, day: week[0].day, evening: week[0].evening,
      dayCode: week[0].code, week, ok: true };
    localStorage.setItem(cacheKey, JSON.stringify(W));
  } catch {
    try { W = JSON.parse(localStorage.getItem(cacheKey)); } catch {}
    if (!W || !W.week) W = climateWeather();
    W.ok = false;
  }
}
// Offline fallback: Tashkent monthly normals (avg high / low, °C).
const CLIMATE = [[6, -3], [9, -1], [15, 4], [22, 10], [27, 14], [33, 19], [36, 21], [34, 19], [29, 14], [21, 8], [13, 3], [8, -1]];
function climateWeather() {
  const week = Array.from({ length: 7 }, (_, d) => {
    const dt = new Date(now() + d * DAY), [hi, lo] = CLIMATE[dt.getMonth()], wob = [0, 1.5, -1, 2, -2, 0.5, 1][d];
    return { date: dt.toISOString().slice(0, 10), morning: lo + 2 + wob, day: hi + wob, evening: (hi + lo) / 2 + 2 + wob, code: [1, 2, 3, 2, 61, 1, 0][d] };
  });
  return { now: week[0].evening, code: week[0].code, morning: week[0].morning, day: week[0].day, evening: week[0].evening, dayCode: week[0].code, week };
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
  share: ic('<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/>'),
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
// ---------- bottom sheets: iOS spring in/out + swipe down to dismiss ----------
let sheetCloseT = null;
function openSheet(html, handlers = {}) {
  clearTimeout(sheetCloseT);
  const open = $('#sheet-root .sheet-back:not(.closing) .sheet');
  if (open) open.innerHTML = `<div class="grab"></div>${html}`; // redraw inside an open sheet: no replay
  else {
    $('#sheet-root').innerHTML = `<div class="sheet-back" data-act="sheetBack"><div class="sheet"><div class="grab"></div>${html}</div></div>`;
    bindSheetDrag($('#sheet-root .sheet'));
  }
  Object.assign(acts, handlers, { sheetBack: (el, e) => { if (e.target === el) closeSheet(); }, closeSheet });
}
function closeSheet() {
  const back = $('#sheet-root .sheet-back');
  if (!back) return;
  if (reduceMotion()) { $('#sheet-root').innerHTML = ''; return; }
  back.classList.add('closing');
  const sh = back.querySelector('.sheet'); void sh.offsetWidth; sh.style.transform = '';
  clearTimeout(sheetCloseT);
  sheetCloseT = setTimeout(() => { if (back.isConnected) back.remove(); }, 320);
}
function bindSheetDrag(sh) {
  let y0 = null, dy = 0, t0 = 0, dragging = false;
  const back = sh.parentElement;
  const start = y => { y0 = y; dy = 0; t0 = performance.now(); dragging = false; };
  const move = (y, e) => {
    if (y0 == null) return;
    dy = y - y0;
    if (!dragging && dy > 6 && sh.scrollTop <= 0) { dragging = true; sh.classList.add('dragging'); }
    if (dragging) {
      if (e && e.cancelable) e.preventDefault();
      const d = Math.max(0, dy);
      sh.style.transform = `translateY(${d}px)`;
      back.style.backgroundColor = `rgba(0,0,0,${0.35 * Math.max(0, 1 - d / 400)})`;
    }
  };
  const end = () => {
    if (y0 == null) return;
    const v = dy / Math.max(1, performance.now() - t0);
    y0 = null; sh.classList.remove('dragging'); back.style.backgroundColor = '';
    if (dragging && (dy > 120 || v > 0.6)) { closeSheet(); }
    else sh.style.transform = '';
    dragging = false;
  };
  sh.addEventListener('touchstart', e => start(e.touches[0].clientY), { passive: true });
  sh.addEventListener('touchmove', e => move(e.touches[0].clientY, e), { passive: false });
  sh.addEventListener('touchend', end); sh.addEventListener('touchcancel', end);
  // mouse: drag by the grab handle
  sh.addEventListener('mousedown', e => { if (e.target.classList.contains('grab')) { start(e.clientY); e.preventDefault(); } });
  addEventListener('mousemove', e => move(e.clientY));
  addEventListener('mouseup', end);
}

// Fly an element's image from one rect to another (shared-element transition).
function flyImage(srcImg, targetImg) {
  if (!srcImg || !targetImg || reduceMotion()) return;
  const app = $('#app'), framed = getComputedStyle(app).transform !== 'none';
  const ar = framed ? app.getBoundingClientRect() : { left: 0, top: 0 };
  const a = srcImg.getBoundingClientRect();
  const sheet = targetImg.closest('.sheet');
  sheet.style.animation = 'none'; const b = targetImg.getBoundingClientRect(); sheet.style.animation = '';
  const clone = srcImg.cloneNode();
  clone.className = 'fly';
  Object.assign(clone.style, { left: a.left - ar.left + 'px', top: a.top - ar.top + 'px', width: a.width + 'px', height: a.height + 'px' });
  app.appendChild(clone);
  targetImg.style.opacity = '0'; srcImg.style.visibility = 'hidden';
  void clone.offsetWidth;
  clone.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width}, ${b.height / a.height})`;
  setTimeout(() => { targetImg.style.opacity = ''; srcImg.style.visibility = ''; clone.remove(); }, 470);
}
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
  let ccNum = '4242 4242 4242 4242', ccExp = '12/29';
  const brandOf = n => { const d = n.replace(/\D/g, ''); return /^8600/.test(d) ? 'UZCARD' : /^9860/.test(d) ? 'HUMO' : /^5[1-5]/.test(d) ? 'MASTERCARD' : /^4/.test(d) ? 'VISA' : ''; };
  const cardFace = () => `<div class="pay-card" id="payCard">
      <div class="row" style="justify-content:space-between"><span class="pc-chip"></span><b class="pc-brand" id="pcBrand">${brandOf(ccNum)}</b></div>
      <div class="pc-num" id="pcNum">${esc(ccNum || '•••• •••• •••• ••••')}</div>
      <div class="row" style="justify-content:space-between"><span class="pc-name">${esc((S.profile.name || 'Looksy').toUpperCase())}</span><span class="pc-exp" id="pcExp">${esc(ccExp)}</span></div></div>`;
  const body = () => `
    <h2>${trial ? t('trialTitle') : t('premium')}</h2>
    <p class="muted small">${trial ? t('trialSub') : `${fmtPrice(priceWithPromo())} ${t('perMonth')}`}</p>
    <div class="section-title"><h3>${t('payMethod')}</h3></div>
    <div class="stack">${methods.map(([k, n, c, a]) => `<button class="pay-method ${k === method ? 'on' : ''}" data-act="pm" data-k="${k}">
      <span class="pay-badge" style="background:${c}">${a}</span><span>${n}</span><span class="pm-check">${k === method ? '✓' : ''}</span></button>`).join('')}</div>
    ${method === 'card' ? `<div class="pay-card-wrap">${cardFace()}</div>
      <label class="field"><span>${t('cardNumber')}</span><input class="input" id="cc" inputmode="numeric" autocomplete="off" value="${esc(ccNum)}" maxlength="19"></label>
      <label class="field"><span>${t('cardExp')}</span><input class="input" id="ccExp" inputmode="numeric" autocomplete="off" value="${esc(ccExp)}" maxlength="5"></label>` : ''}
    <div class="row" style="margin-top:14px"><input id="payPromo" class="input" style="height:40px" placeholder="${t('promo')} / LKS-XXXX" value="${esc(S.sub.promoLabel || '')}">
      <button class="btn sm ghost" data-act="payPromo">${t('apply')}</button></div>
    ${discountPct() ? `<p class="small" style="margin:8px 0 0;color:var(--good)">${fmtPrice(priceWithPromo())} ${t('perMonth')} (−${discountPct()}%)</p>` : ''}
    <div style="margin-top:16px"><button class="btn" data-act="doPay">${trial ? t('startTrial') : `${t('pay')} ${fmtPrice(priceWithPromo())} ${t('perMonth')}`}</button></div>
    <p class="demo-note">${t('demoPay')}</p>`;
  return new Promise(resolve => {
    const bindCard = () => {
      const cc = $('#cc'), ex = $('#ccExp'); if (!cc) return;
      cc.addEventListener('input', () => {
        const d = cc.value.replace(/\D/g, '').slice(0, 16); cc.value = d.replace(/(\d{4})(?=\d)/g, '$1 '); ccNum = cc.value;
        $('#pcNum').textContent = ccNum || '•••• •••• •••• ••••'; $('#pcBrand').textContent = brandOf(ccNum);
      });
      ex.addEventListener('input', () => {
        const d = ex.value.replace(/\D/g, '').slice(0, 4); ex.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; ccExp = ex.value;
        $('#pcExp').textContent = ccExp || 'MM/YY';
      });
      [cc, ex].forEach(i => { i.addEventListener('focus', () => $('#payCard')?.classList.add('lift')); i.addEventListener('blur', () => $('#payCard')?.classList.remove('lift')); });
    };
    const draw = () => { openSheet(body(), handlers); bindCard(); };
    const handlers = {
      pm: el => { method = el.dataset.k; draw(); },
      payPromo: () => { if (applyCode($('#payPromo').value)) draw(); },
      doPay: el => {
        const last4 = ccNum.replace(/\D/g, '').slice(-4);
        const label = methods.find(m => m[0] === method)[1];
        el.classList.add('loading'); el.disabled = true;
        const steps = method === 'card'
          ? [t('pf.check', last4), t('pf.secure'), trial ? t('pf.trial') : t('pf.charge', fmtPrice(priceWithPromo()))]
          : [t('pf.open', label), t('pf.confirm', label), trial ? t('pf.trial') : t('pf.charge', fmtPrice(priceWithPromo()))];
        setTimeout(() => {
          const sh = $('#sheet-root .sheet');
          sh.innerHTML = `<div class="grab"></div><div class="pay-progress">
            <svg class="pay-ring" viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="44"/><circle class="arc" cx="50" cy="50" r="44"/>
              <path class="tick" d="M31 51 L45 64 L70 38"/></svg>
            <h2 id="payTitle">${t('pf.processing')}</h2>
            <ul class="pay-steps">${steps.map((s, i) => `<li data-i="${i}"><span class="dot"></span>${esc(s)}</li>`).join('')}</ul>
            <div id="payDone"></div></div>`;
          const li = [...sh.querySelectorAll('.pay-steps li')];
          li.forEach((x, i) => {
            setTimeout(() => x.classList.add('active'), 150 + i * 750);
            setTimeout(() => { x.classList.remove('active'); x.classList.add('done'); }, 800 + i * 750);
          });
          setTimeout(() => {
            const n = now();
            S.sub = { ...S.sub, status: trial ? 'trial' : 'active', start: n, end: n + (trial ? 7 : 30) * DAY, method: label, last4: method === 'card' ? last4 : '' };
            persist();
            sh.querySelector('.pay-progress').classList.add('success');
            try { navigator.vibrate?.([12, 40, 18]); } catch {}
            $('#payTitle').textContent = trial ? t('trialStarted') : t('paySuccess');
            $('#payDone').innerHTML = `<div class="receipt">
              <div><span>${t('pf.plan')}</span><b>${t('premium')}</b></div>
              <div><span>${t('payMethod')}</span><b>${esc(label)}${method === 'card' && last4 ? ' •••• ' + esc(last4) : ''}</b></div>
              <div><span>${trial ? t('pf.today') : t('pf.paid')}</span><b>${trial ? '0' : fmtPrice(priceWithPromo())} ${t('sum')}</b></div>
              ${trial ? `<div><span>${t('pf.firstCharge')}</span><b>${fmtDate(S.sub.end)}</b></div>` : `<div><span>${t('pf.next')}</span><b>${fmtDate(S.sub.end)}</b></div>`}
              </div><button class="btn" data-act="payDone">${t('pf.continue')}</button><p class="demo-note">${t('demoPay')}</p>`;
            acts.payDone = () => { closeSheet(); resolve(true); };
          }, 300 + steps.length * 750);
        }, 450);
      },
    };
    draw();
  });
}

// ---------------- image processing ----------------
// Neural background removal (IS-Net, runs on the phone via ONNX/WASM, ~40 MB downloaded once and cached).
let bgP = null, bgState = 'idle', bgPct = 0;
const BG_CFG = { model: 'small', output: { format: 'image/png' } };
function loadBg() {
  if (S.settings.mlBg === false) { bgState = 'off'; return Promise.resolve(null); }
  if (!bgP) {
    bgState = 'loading'; const parts = {};
    bgP = (async () => {
      const m = await import('https://esm.sh/@imgly/background-removal@1.4.5');
      await m.preload({ ...BG_CFG, progress: (key, cur, tot) => {
        if (!/fetch/.test(key) || !tot) return; parts[key] = [cur, tot];
        const v = Object.values(parts); bgPct = Math.round(100 * v.reduce((a, x) => a + x[0], 0) / v.reduce((a, x) => a + x[1], 0));
      } });
      bgState = 'ready'; bgPct = 100; return m;
    })().catch(() => { bgState = 'off'; bgP = null; return null; });
  }
  return bgP;
}
async function processPhoto(file, onStage = () => {}) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const max = 640, k = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * k), h = Math.round(img.height * k);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
  // 1) try the neural network: it separates the item from beds, carpets and patterned floors
  let ml = false;
  if (S.settings.mlBg !== false) {
    const wait = setInterval(() => onStage(bgState === 'loading' ? t('bg.loading', bgPct) : t('bg.cutting')), 400);
    try {
      const m = await Promise.race([loadBg(), new Promise(r => setTimeout(() => r(null), bgState === 'ready' ? 0 : 60000))]);
      if (m) {
        onStage(t('bg.cutting'));
        const src = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
        const outBlob = await m.removeBackground(src, BG_CFG);
        const bmp = await createImageBitmap(outBlob);
        g.clearRect(0, 0, w, h); g.drawImage(bmp, 0, 0, w, h); ml = true;
      }
    } catch { g.clearRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h); ml = false; } finally { clearInterval(wait); }
  }
  const data = g.getImageData(0, 0, w, h), px = data.data;
  let cut;
  if (ml) {
    let opaque = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 128) opaque++;
    const r = opaque / (w * h); cut = r > 0.02 && r < 0.97;
    if (!cut) { g.drawImage(img, 0, 0, w, h); const d2 = g.getImageData(0, 0, w, h); px.set(d2.data); }
  } else cut = floodFillCut(px, w, h);
  return finishCut(cv, g, data, px, w, h, cut, ml);
}
// 2) fallback: flood-fill from the borders with the median border colour (works on plain light backgrounds)
function floodFillCut(px, w, h) {
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
  return cut;
}
function finishCut(cv, g, data, px, w, h, cut, ml) {
  // dominant colour of the remaining pixels
  const buckets = new Map();
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (px[i + 3] < 128) continue;
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    // centre-weighted: edges carry shadows, folds and leftover background
    const dx = (x / w - 0.5) * 2, dy = (y / h - 0.5) * 2, wt = Math.max(0.15, 1 - 0.75 * (dx * dx + dy * dy));
    // very dark / blown-out pixels are mostly shadow or glare
    const lum = (px[i] * 3 + px[i + 1] * 4 + px[i + 2]) >> 3, lw = lum < 18 || lum > 248 ? 0.4 : 1;
    const key = (px[i] >> 4) << 8 | (px[i + 1] >> 4) << 4 | (px[i + 2] >> 4);
    const b = buckets.get(key) || [0, 0, 0, 0]; b[0] += px[i] * wt * lw; b[1] += px[i + 1] * wt * lw; b[2] += px[i + 2] * wt * lw; b[3] += wt * lw; buckets.set(key, b);
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
  return { url: out.toDataURL('image/png'), colors: named.length ? named : ['black'], guess, ml };
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
  return classifySource(m, img, img.width, img.height);
}
// draws any image/video source into a 224² white canvas and maps ImageNet classes to garment types
async function classifySource(m, source, sw, sh, crop = null) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 224;
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 224, 224);
  const [cx, cy, cw, ch] = crop || [0, 0, sw, sh];
  const k = 210 / Math.max(cw, ch), w = cw * k, h = ch * k;
  g.drawImage(source, cx, cy, cw, ch, (224 - w) / 2, (224 - h) / 2, w, h);
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
  layer: { layer: [0, 4, 54, 58], top: [40, 4, 40, 36], dress: [38, 4, 42, 64], bottom: [36, 38, 42, 56], shoes: [4, 68, 34, 24], bag: [72, 48, 26, 26], acc: [77, 24, 20, 16] },
  plain: { top: [24, 3, 52, 36], dress: [22, 4, 56, 70], bottom: [28, 37, 44, 54], shoes: [3, 74, 30, 20], bag: [70, 52, 28, 28], acc: [3, 42, 22, 16] },
};
// Mannequin boxes are derived from the mannequin drawing (300×400) so garment shoulders, waist and hems line up with the body.
const MANN = { top: [15, 5.5, 70, 52.5], layer: [12, 3.75, 76, 57], bottom: [16.33, 42, 66, 49.5], dress: [3.67, 7.75, 92.67, 69.5],
  shoes: [33.33, 74, 33.33, 25], bag: [74, 37.5, 24, 18], acc: [75, 12, 22, 16.5] };
const Z = { layer: 1, bottom: 2, dress: 2, top: 3, shoes: 4, bag: 5, acc: 6 };
const MANN_Z = { bottom: 1, dress: 2, top: 2, layer: 4, shoes: 5, bag: 6, acc: 7 };
const mannequinSVG = `<svg class="mannequin" viewBox="0 0 300 400" preserveAspectRatio="none" fill="#FBF9F6" stroke="#B5ACA2" stroke-width="1.6" stroke-linejoin="round">
  <ellipse cx="150" cy="384" rx="58" ry="7" fill="rgba(60,45,30,.12)" stroke="none"/>
  <path d="M114 214L148 214L146 300C145 330 143 350 141 370L127 370C125 350 123 330 121 300C118 270 115 240 114 214Z"/>
  <path d="M152 214L186 214C185 240 182 270 179 300C177 330 175 350 173 370L159 370C157 350 155 330 154 300Z"/>
  <path d="M141 22L159 22L160 44C172 47 190 52 203 62C209 67 210 76 207 84L201 100C197 108 192 112 186 112L184 150C183 165 186 178 190 196C192 206 191 214 188 220L112 220C109 214 108 206 110 196C114 178 117 165 116 150L114 112C108 112 103 108 99 100L93 84C90 76 91 67 97 62C110 52 128 47 140 44Z"/>
  <ellipse cx="150" cy="21" rx="11" ry="4"/></svg>`;

// Where each piece sits for a given look state (flat lay with/without layer, or mannequin).
function lookLayout(o, mode, noLayer) {
  const p = { ...o.parts }; if (noLayer) delete p.layer;
  const pos = mode === 'mann' ? MANN : p.layer ? FLAT.layer : FLAT.plain;
  const z = mode === 'mann' ? MANN_Z : Z;
  const neck = (k, v) => mode === 'mann' && k === 'acc' && v.type === 'jewelry';
  return Object.entries(p).filter(([k, v]) => v && pos[k])
    .map(([k, v]) => ({ k, v, z: neck(k, v) ? 3 : z[k],
      pos: neck(k, v) ? [36.7, 8.5, 26.7, 20] : mode === 'mann' && v.type === 'boots' ? [37.5, 78.5, 25, 18.75] : pos[k] }));
}
const placeStyle = ({ pos: [l, tp, w, h], z }) => `left:${l}%;top:${tp}%;width:${w}%;height:${h}%;z-index:${z}`;
const seenLooks = new Set();
function lookHTML(o, { mode = S.viewMode, noLayer = false, animate = true } = {}) {
  const parts = lookLayout(o, mode, noLayer);
  const fresh = animate && !reduceMotion() && !seenLooks.has(o.key);
  if (animate) seenLooks.add(o.key);
  const imgs = parts.map((x, i) => {
    const [l, tp, w, h] = x.pos, cx = l + w / 2;
    const fly = fresh ? `;--i:${i};--fx:${Math.round((cx - 50) * 0.7)}px;--fy:${tp < 40 ? -26 : 26}px;--fr:${(i % 2 ? 1 : -1) * (3 + i)}deg` : '';
    return `<img data-k="${x.k}" src="${src(x.v)}" alt="${esc(itemName(x.v))}" style="${placeStyle(x)}${fly}">`;
  }).join('');
  return `<div class="look ${mode === 'mann' ? 'mann' : ''} ${fresh ? 'assemble' : ''}">${mannequinSVG}${imgs}</div>`;
}
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Animate an already rendered look to a new state instead of re-rendering it (iOS-style morph).
function morphLook(el, o, mode, noLayer) {
  if (!el) return;
  el.classList.remove('assemble');
  el.classList.toggle('mann', mode === 'mann');
  const next = lookLayout(o, mode, noLayer), keys = new Set(next.map(x => x.k));
  el.querySelectorAll('img[data-k]').forEach(img => {
    if (!keys.has(img.dataset.k)) { img.classList.add('gone'); }
  });
  for (const x of next) {
    let img = el.querySelector(`img[data-k="${x.k}"]`);
    if (!img) {
      img = document.createElement('img'); img.dataset.k = x.k; img.src = src(x.v); img.alt = itemName(x.v);
      img.className = 'gone'; img.setAttribute('style', placeStyle(x)); el.appendChild(img); void img.offsetWidth;
    }
    img.classList.remove('gone');
    const [l, tp, w, h] = x.pos;
    Object.assign(img.style, { left: l + '%', top: tp + '%', width: w + '%', height: h + '%', zIndex: x.z });
  }
}
const isSaved = key => S.saved.some(s => s.key === key);

function lookCard(o, i, { compact = false } = {}) {
  const ids = outfitIds(o);
  const vote = ids.reduce((a, id) => a + (S.prefs.items[id] || 0), 0);
  return `<div class="look-card" data-i="${i}">
    <div style="position:relative">
      ${lookHTML(o, { noLayer: o._day })}
      <button class="look-share" data-act="shareLook" data-i="${i}" aria-label="${t('shareLook')}">${I.share}</button>
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
// ---------- share a look as a Stories-size picture ----------
const loadImg = s => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = s; });
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrapText(g, text, x, y, maxW, lh, maxLines = 2) {
  const words = text.split(' '); let line = '', n = 0;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; if (++n >= maxLines - 1) { line = words.slice(words.indexOf(w)).join(' '); break; } }
    else line = test;
  }
  if (g.measureText(line).width > maxW) { while (line.length && g.measureText(line + '…').width > maxW) line = line.slice(0, -1); line += '…'; }
  g.fillText(line, x, y); return y + lh;
}
async function renderShareImage(o) {
  const W2 = 1080, H2 = 1920, cv = document.createElement('canvas'); cv.width = W2; cv.height = H2;
  const g = cv.getContext('2d');
  try { await Promise.all([document.fonts.load('500 120px "Playfair Display"'), document.fonts.load('500 40px Inter')]); } catch {}
  const bg = g.createLinearGradient(0, 0, 0, H2); bg.addColorStop(0, '#F6F2EE'); bg.addColorStop(1, '#E7DED4'); g.fillStyle = bg; g.fillRect(0, 0, W2, H2);
  g.fillStyle = '#1C1A18'; g.textAlign = 'center'; g.font = '500 110px "Playfair Display", Georgia, serif';
  g.fillText('Looksy', W2 / 2 - 14, 210);
  const lw = g.measureText('Looksy').width; const sx = W2 / 2 - 14 + lw / 2 + 26, sy = 140;
  g.beginPath(); g.moveTo(sx, sy - 22); g.lineTo(sx + 6, sy - 6); g.lineTo(sx + 22, sy); g.lineTo(sx + 6, sy + 6); g.lineTo(sx, sy + 22); g.lineTo(sx - 6, sy + 6); g.lineTo(sx - 22, sy); g.lineTo(sx - 6, sy - 6); g.closePath(); g.fill();
  g.font = '400 36px Inter, sans-serif'; g.fillStyle = '#8A817A';
  g.fillText(`${t('events.' + (o.event || S.event))} · ${deg(W?.day ?? 18)} · ${fmtDate(now())}`, W2 / 2, 280);
  // card with the flat lay
  const cx = 110, cy = 330, cw = 860, ch = 1146;
  g.save(); g.shadowColor = 'rgba(60,45,30,.18)'; g.shadowBlur = 60; g.shadowOffsetY = 20; g.fillStyle = '#FFFFFF'; roundRect(g, cx, cy, cw, ch, 56); g.fill(); g.restore();
  g.fillStyle = '#EFE9E3'; roundRect(g, cx + 30, cy + 30, cw - 60, ch - 60, 40); g.fill();
  const ax = cx + 30, ay = cy + 30, aw = cw - 60, ah = ch - 60;
  const parts = lookLayout(o, 'flat', o._day).sort((a, b) => a.z - b.z);
  for (const x of parts) {
    try {
      const im = await loadImg(src(x.v));
      const [l, tp, w, h] = x.pos, bw = aw * w / 100, bh = ah * h / 100;
      const iw = im.naturalWidth || 400, ih = im.naturalHeight || 400, k = Math.min(bw / iw, bh / ih);
      const dw = iw * k, dh = ih * k, dx = ax + aw * l / 100 + (bw - dw) / 2, dy = ay + ah * tp / 100 + (bh - dh) / 2;
      g.save(); g.shadowColor = 'rgba(40,30,20,.22)'; g.shadowBlur = 24; g.shadowOffsetY = 12; g.drawImage(im, dx, dy, dw, dh); g.restore();
    } catch {}
  }
  // why it works
  g.textAlign = 'left'; g.fillStyle = '#1C1A18'; g.font = '500 40px Inter, sans-serif';
  let y = cy + ch + 80;
  for (const r of (o.layerNote ? [o.layerNote, ...o.reasons] : o.reasons).slice(0, 2)) {
    g.fillStyle = '#C9A27A'; g.fillText('✦', 110, y); g.fillStyle = '#1C1A18';
    y = wrapText(g, r, 160, y, 820, 50, 3) + 12;
  }
  g.textAlign = 'center'; g.fillStyle = '#8A817A'; g.font = '400 32px Inter, sans-serif';
  g.fillText(t('tagline'), W2 / 2, H2 - 110);
  g.fillStyle = '#1C1A18'; g.font = '600 32px Inter, sans-serif';
  g.fillText(location.host + location.pathname.replace(/index\.html$/, ''), W2 / 2, H2 - 62);
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
async function shareLook(o) {
  if (!o) return;
  openSheet(`<div class="spinner"></div><p class="muted" style="text-align:center">${t('shareMaking')}</p>`);
  const blob = await renderShareImage(o);
  const file = new File([blob], 'looksy-look.png', { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  openSheet(`<h2 style="margin-bottom:12px">${t('shareLook')}</h2>
    <img src="${url}" alt="" style="width:62%;margin:0 auto 14px;border-radius:18px;box-shadow:var(--shadow)">
    <div class="stack">${canShare ? `<button class="btn" data-act="doShare">${I.share}${t('share')}</button>` : ''}
      <a class="btn ${canShare ? 'ghost' : ''}" href="${url}" download="looksy-look.png" style="text-decoration:none">${t('saveImg')}</a></div>
    <p class="demo-note">${t('holdToSave')}</p>`, {
    doShare: async () => { try { await navigator.share({ files: [file], title: 'Looksy', text: t('tagline') }); } catch {} },
  });
}

function lookActions(getList) {
  return {
    dayToggle: el => {
      const o = getList()[el.dataset.i]; o._day = el.dataset.v === '1';
      el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el));
      morphLook(el.closest('.look-card').querySelector('.look'), o, S.viewMode, o._day);
    },
    shareLook: el => shareLook(getList()[el.dataset.i]),
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
  const gaps = findGaps(S.items, allProducts(), W, S.profile, S.event, S.dismissed);
  if (!gaps.length) return '';
  gaps.forEach(g => trackBrand(g.product.id, 'v'));
  acts.prod = el => { const g = gaps[el.dataset.i]; trackBrand(g.product.id, 'c'); productSheet(g); };
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
    buy: () => { trackBrand(p.id, 'b'); toast(t('goingToBrand', b.name)); },
    dismiss: () => { S.dismissed.push(p.id); persist(); closeSheet(); render(); },
  });
}

// ---------- brand cabinet (B2B demo): partner sees reach of its pieces inside Looksy ----------
const allProducts = () => [...PRODUCTS, ...(S.brandProducts || [])];
const seenThisSession = new Set();
function trackBrand(pid, kind) {
  if (kind === 'v') { if (seenThisSession.has(pid)) return; seenThisSession.add(pid); }
  S.brandStats = S.brandStats || {}; const s = S.brandStats[pid] || (S.brandStats[pid] = { v: 0, c: 0, b: 0 });
  s[kind]++; persist();
}
const hashN = (str, mod) => { let h = 7; for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h % mod; };
// demo baseline = "other Looksy users in Tashkent"; plus this device's real taps
function productStats(p) {
  const own = S.brandStats?.[p.id] || { v: 0, c: 0, b: 0 }, isNew = p.id.startsWith('u');
  const v0 = isNew ? 0 : 380 + hashN(p.id + 'v', 900), c0 = Math.round(v0 * (0.05 + hashN(p.id + 'c', 50) / 1000)), b0 = Math.round(c0 * (0.28 + hashN(p.id + 'b', 20) / 100));
  return { v: v0 + own.v, c: c0 + own.c, b: b0 + own.b, own };
}
const COMMISSION = 0.1, CONV = 0.12;
function screenBrand() {
  const bk = S.brandSel || 'oydin', b = BRANDS[bk];
  const items = allProducts().filter(p => p.brand === bk).map(p => ({ p, s: productStats(p) }));
  const sum = k => items.reduce((a, x) => a + x.s[k], 0);
  const v = sum('v'), c = sum('c'), go = sum('b');
  const sales = items.reduce((a, x) => a + Math.round(x.s.b * CONV) * x.p.price, 0);
  const days = Array.from({ length: 7 }, (_, i) => Math.round(v / 7 * (0.7 + hashN(bk + i, 60) / 100)));
  const max = Math.max(...days, 1), floor = Math.min(...days) * 0.6; // scale from 60% of the lowest day so differences read clearly
  acts = { ...acts,
    brandBack: () => { S.tab = 'profile'; persist(); render(); },
    brandSel: el => { S.brandSel = el.dataset.k; persist(); render(); },
    addProduct: () => addProductSheet(bk),
  };
  return `
    <div class="topbar"><button class="icon-btn" data-act="brandBack" aria-label="${t('back')}">${I.back}</button><span class="badge">B2B · ${t('demo')}</span></div>
    <h1>${t('brandCab')}</h1><p class="muted" style="margin:4px 0 14px">${t('brandCabSub')}</p>
    <div class="chips" style="margin-bottom:14px">${Object.entries(BRANDS).map(([k, x]) => `<button class="chip ${k === bk ? 'on' : ''}" data-act="brandSel" data-k="${k}">${esc(x.name)}</button>`).join('')}</div>
    <div class="grid2">
      <div class="card kpi"><span class="muted small">${t('kViews')}</span><h2>${fmtPrice(v)}</h2></div>
      <div class="card kpi"><span class="muted small">${t('kClicks')}</span><h2>${fmtPrice(c)}</h2><span class="small" style="color:var(--good)">CTR ${(c / Math.max(v, 1) * 100).toFixed(1)}%</span></div>
      <div class="card kpi"><span class="muted small">${t('kGo')}</span><h2>${fmtPrice(go)}</h2></div>
      <div class="card kpi"><span class="muted small">${t('kSales')}</span><h2>${fmtSum(sales)}</h2><span class="muted small">${t('kFee', fmtSum(sales * COMMISSION))}</span></div>
    </div>
    <div class="card" style="margin-top:10px"><div class="row" style="justify-content:space-between"><b>${t('kWeek')}</b><span class="muted small">${t('kViews').toLowerCase()}</span></div>
      <div class="bars">${days.map((d, i) => { const dt = new Date(now() - (6 - i) * DAY);
        return `<div class="bar"><span class="small">${d}</span><i style="height:${Math.max(8, (d - floor) / Math.max(1, max - floor) * 100)}%"></i><span class="muted small">${wdShort(dt)}</span></div>`; }).join('')}</div></div>
    <div class="section-title"><h3>${t('kProducts')}</h3><button data-act="addProduct">+ ${t('addProduct')}</button></div>
    <div class="list">${items.map(({ p, s }) => `<div class="list-row" style="flex-wrap:nowrap">
      <img src="${src(prodItem(p))}" alt="" style="width:44px;height:44px;object-fit:contain;background:var(--photo-bg);border-radius:10px;padding:3px;flex:none">
      <div style="flex:1;min-width:0"><b class="small">${TYPES[p.type][getLang()] || TYPES[p.type].ru} · ${colorByKey(p.color)[getLang()] || colorByKey(p.color).ru}</b>
        <div class="muted small">${fmtUZS(p.price)}${s.own.v || s.own.c ? ` · <span style="color:var(--good)">${t('kYou', s.own.v, s.own.c)}</span>` : ''}</div></div>
      <div class="small" style="text-align:right;white-space:nowrap"><b>${fmtPrice(s.v)}</b> 👁<br><b>${fmtPrice(s.c)}</b> ↗</div></div>`).join('')}</div>
    <div class="card" style="margin-top:14px"><b>${t('bizModel')}</b><p class="muted small" style="margin:6px 0 0">${t('bizModelSub')}</p></div>
    <p class="demo-note">${t('brandDemoNote')}</p>`;
}
function addProductSheet(bk) {
  let type = 'sweater', color = 'beige';
  const draw = () => openSheet(`<h2 style="margin-bottom:6px">${t('addProduct')}</h2><p class="muted small" style="margin:0 0 12px">${esc(BRANDS[bk].name)}</p>
    <div class="tile" style="width:120px;margin:0 auto 12px"><img src="${svgURL(type, colorByKey(color).hex)}" alt=""></div>
    <label class="field"><span>${t('type')}</span><select class="input" id="np-type">${Object.entries(TYPES).map(([k, x]) => `<option value="${k}" ${k === type ? 'selected' : ''}>${x[getLang()] || x.ru}</option>`).join('')}</select></label>
    <div class="field"><span>${t('color')}</span><div class="swatches">${COLORS.map(c => `<button class="swatch ${c.k === color ? 'on' : ''}" style="background:${c.hex}" data-act="npColor" data-k="${c.k}" aria-label="${c[getLang()] || c.ru}"></button>`).join('')}</div></div>
    <label class="field"><span>${t('price')}, ${t('sum')}</span><input class="input" id="np-price" inputmode="numeric" value="${TYPES[type].price}"></label>
    <button class="btn" data-act="npSave">${t('publishProduct')}</button>`, {
    npColor: el => { type = $('#np-type').value; color = el.dataset.k; redraw(); },
    npSave: () => {
      const price = +$('#np-price').value.replace(/\D/g, '') || TYPES[type].price;
      S.brandProducts = [...(S.brandProducts || []), { id: 'u' + uid(), brand: bk, type: $('#np-type').value, color, price }];
      persist(); closeSheet(); toast(t('productAdded')); render();
    },
  });
  const redraw = () => { draw(); $('#np-type').addEventListener('change', e => { type = e.target.value; redraw(); }); };
  redraw();
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
    ${S.items.length ? statsSection(used) : ''}`;
}

// ---------- wardrobe economics: value, cost per wear, items brought back into use ----------
const itemPrice = it => +it.price || TYPES[it.type].price || 0;
function wardrobeStats() {
  const wears = {}, revived = new Map(), lastSeen = {};
  [...S.worn].sort((a, b) => a.date - b.date).forEach(w => w.ids.forEach(id => {
    wears[id] = (wears[id] || 0) + 1;
    const it = byId(id); if (!it) return;
    const prev = lastSeen[id] ?? it.added ?? w.date;
    if (!revived.has(id) && (lastSeen[id] == null || w.date - prev >= 14 * DAY)) revived.set(id, itemPrice(it));
    lastSeen[id] = w.date;
  }));
  const value = S.items.reduce((a, it) => a + itemPrice(it), 0);
  const totalWears = Object.values(wears).reduce((a, b) => a + b, 0);
  const forgotten = S.items.filter(it => lastSeen[it.id] == null || now() - lastSeen[it.id] > 30 * DAY);
  return { value, cpw: totalWears ? Math.round(value / totalWears) : 0, saved: [...revived.values()].reduce((a, b) => a + b, 0), revivedN: revived.size, forgotten, totalWears };
}
const fmtSum = n => n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.0', '')} ${t('mln')}` : fmtPrice(Math.round(n / 1000) * 1000);
function statsSection(used) {
  const st = wardrobeStats();
  acts.forgot = el => { const it = byId(el.dataset.id); if (it) editItemSheet(it); };
  return `<div class="section-title"><h2>${t('stats')}</h2></div>
    <div class="card save-card">
      <span class="muted small">${t('savedTitle')}</span>
      <div class="save-num">${fmtSum(st.saved)} <span>${t('sum')}</span></div>
      <p class="small muted" style="margin:4px 0 0">${st.revivedN ? t('savedSub', st.revivedN) : t('savedEmpty')}</p>
      <div class="meter"><i style="width:${used}%"></i></div>
      <p class="small" style="margin:6px 0 0">${t('usedLine', used)}</p>
    </div>
    <div class="grid stat-grid" style="margin-top:10px">
      <div class="card"><h3>${fmtSum(st.value)}</h3><span class="muted small">${t('statValue')}</span></div>
      <div class="card"><h3>${st.cpw ? fmtSum(st.cpw) : '—'}</h3><span class="muted small">${t('statCpw')}</span></div>
      <div class="card"><h3>${S.worn.length}</h3><span class="muted small">${t('statLooks')}</span></div>
    </div>
    ${st.forgotten.length ? `<div class="section-title"><h3>${t('forgotTitle', st.forgotten.length)}</h3></div>
      <p class="muted small" style="margin:-6px 0 10px">${t('forgotSub')}</p>
      <div class="chips" style="gap:8px">${st.forgotten.slice(0, 8).map(it => `<button class="tile" style="width:72px;flex:none;padding:8px" data-act="forgot" data-id="${it.id}"><img src="${src(it)}" alt="${esc(itemName(it))}"></button>`).join('')}</div>` : ''}`;
}
function usedPct() {
  if (!S.items.length) return 0;
  const since = now() - 30 * DAY, ids = new Set();
  for (const w of S.worn) if (w.date >= since) w.ids.forEach(i => ids.add(i));
  return Math.round(100 * [...ids].filter(id => byId(id)).length / S.items.length);
}

// ---------- week plan: one look per day for the 7-day forecast, no piece repeated on consecutive days ----------
let weekCache = { sig: '', days: [] };
const dayEvent = (date, i) => {
  if (S.weekEvents?.[date]) return S.weekEvents[date];
  const wd = new Date(date + 'T12:00').getDay();
  return wd === 0 || wd === 6 ? 'meeting' : (S.event === 'event' || S.event === 'meeting' ? 'study' : S.event);
};
function getWeek() {
  const week = W?.week || climateWeather().week;
  const sig = [week.map(d => d.date + d.day).join(), S.reroll, S.items.map(i => i.id + i.type + i.color).join(), JSON.stringify(S.weekEvents || {}), getLang(), S.event].join('/');
  if (weekCache.sig === sig) return weekCache.days;
  const planned = [...S.worn], days = [];
  week.forEach((d, i) => {
    const ev = dayEvent(d.date, i), dayNow = now() + i * DAY;
    const look = generate(S.items, { weather: { morning: d.morning, day: d.day, code: d.code }, event: ev, seed: 'w' + d.date + S.reroll,
      prefs: S.prefs, worn: planned, profile: S.profile, now: dayNow }, 1)[0];
    if (look) { look.event = ev; planned.unshift({ ids: outfitIds(look), date: dayNow }); }
    days.push({ ...d, ev, look });
  });
  weekCache = { sig, days };
  return days;
}
function weekView() {
  const days = getWeek(), sel = Math.min(S.weekDay || 0, days.length - 1), d = days[sel];
  const used = new Set(days.flatMap(x => x.look ? outfitIds(x.look) : []));
  const L = days.map(x => x.look).filter(Boolean);
  acts = { ...acts, ...lookActions(() => [d.look]),
    wday: el => { S.weekDay = +el.dataset.i; persist(); render(); },
    wevent: el => { S.weekEvents = { ...(S.weekEvents || {}), [d.date]: el.dataset.k }; persist(); render(); },
  };
  return `<p class="muted small" style="margin:0 0 12px">${t('weekSummary', L.length, used.size)}</p>
    <div class="chips week-strip" style="margin-bottom:12px">${days.map((x, i) => {
      const dt = new Date(x.date + 'T12:00');
      return `<button class="wday ${i === sel ? 'on' : ''}" data-act="wday" data-i="${i}"><span class="small">${i === 0 ? t('today') : wdShort(dt)}</span>
        <b>${dt.getDate()}</b><span class="wd-ic">${wIcon(x.code)}</span><span class="small">${deg(x.day)}</span></button>`;
    }).join('')}</div>
    <div class="chips" style="margin-bottom:14px">${['study', 'work', 'meeting', 'event'].map(e => `<button class="chip ${d.ev === e ? 'on' : ''}" data-act="wevent" data-k="${e}">${t('events.' + e)}</button>`).join('')}</div>
    <p class="small muted" style="margin:0 0 10px">${t('w.' + wKey(d.code))} · ${t('morning')} ${deg(d.morning)} · ${t('day')} ${deg(d.day)}</p>
    ${d.look ? lookCard(d.look, 0, { compact: true }) : needItemsCard()}`;
}

let thinking = false;
function screenAI() {
  const week = S.aiView === 'week';
  const looks = hasAccess() && W && !thinking && !week ? getLooks() : [];
  acts = { ...acts, ...lookActions(() => looksCache.list),
    aiView: el => { S.aiView = el.dataset.k; persist(); render(); },
    regen: () => { S.reroll++; persist(); thinking = true; render(); setTimeout(() => { thinking = false; render(); }, 900); },
    mode: el => {
      S.viewMode = el.dataset.k; persist();
      el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el));
      document.querySelectorAll('#car .look-card').forEach(card => {
        const o = looksCache.list[card.dataset.i]; if (o) morphLook(card.querySelector('.look'), o, S.viewMode, o._day);
      });
    },
  };
  return `
    <div class="topbar"><h1 style="display:flex;align-items:center;gap:8px"><span style="width:20px;height:20px;display:inline-flex">${I.spark}</span>${t('aiOutfit')}</h1>
      <button class="icon-btn" data-act="regen" aria-label="${t('regenerate')}">${I.refresh}</button></div>
    <div class="row" style="justify-content:space-between;margin-bottom:12px">
      <span class="muted small">${W ? `${t('morning')} ${deg(W.morning)} · ${t('day')} ${deg(W.day)}` : ''}</span>
      <div class="toggle"><button class="${S.viewMode === 'flat' ? 'on' : ''}" data-act="mode" data-k="flat">${t('flatlay')}</button>
        <button class="${S.viewMode === 'mann' ? 'on' : ''}" data-act="mode" data-k="mann">${t('mannequin')}</button></div>
    </div>
    <div class="toggle seg" style="margin-bottom:14px"><button class="${week ? '' : 'on'}" data-act="aiView" data-k="today">${t('today')}</button>
      <button class="${week ? 'on' : ''}" data-act="aiView" data-k="week">${t('weekPlan')}</button></div>
    ${week ? '' : `<div style="margin-bottom:14px">${eventChips()}</div>`}
    ${!hasAccess() ? paywallCard() : thinking || !W ? `<div class="card empty"><div class="spinner"></div><p class="muted">${t('thinking')}</p></div>`
      : week ? weekView() : looks.length ? `<div class="carousel" id="car">${looks.map((o, i) => lookCard(o, i)).join('')}</div>
        <div class="dots">${looks.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>` : needItemsCard()}`;
}

function screenWardrobe() {
  const list = S.items.filter(it => S.wcat === 'all' || TYPES[it.type].cat === S.wcat);
  acts = { ...acts,
    wcat: el => { S.wcat = el.dataset.k; persist(); render(); },
    add: openScanner,
    item: el => { const img = el.querySelector('img'); editItemSheet(byId(el.dataset.id)); flyImage(img, $('#sheet-root .sheet .tile img')); },
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
    <div class="toggle seg" style="margin-bottom:16px"><button class="${S.otab === 'saved' ? 'on' : ''}" data-act="otab" data-k="saved">${t('savedTab')} · ${S.saved.length}</button>
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
    openBrand: () => { S.tab = 'brand'; persist(); render(); scrollTop0(); },
    mlBg: el => { S.settings.mlBg = el.dataset.v === '1'; if (S.settings.mlBg && bgState === 'off') bgState = 'idle'; persist(); render(); },
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
      <button class="list-row" data-act="openBrand"><span>${t('brandCab')} <span class="badge">B2B</span></span>${I.chev.replace('<svg', '<svg width="18" height="18"')}</button>
      <button class="list-row" data-act="editStyle"><span>${t('stylePrefs')}</span>${I.chev.replace('<svg', '<svg width="18" height="18"')}</button>
      <button class="list-row" data-act="editSizes"><span>${t('sizes')}</span><span class="muted small">${esc(p.topSize)} · ${esc(p.bottomSize)} · ${esc(p.shoeSize)}</span></button>
      <div class="list-row"><span>${t('city')}</span><span class="muted">${(CITIES.find(c => c.k === p.city) || CITIES[0])[getLang()]}</span></div>
      <div class="list-row"><span>${t('notifications')}</span><input type="time" class="input" style="width:110px;height:36px" data-bind="time" value="${esc(p.time)}"></div>
      <button class="list-row" data-act="notif"><span>${t('testNotif')}</span>${I.chev.replace('<svg', '<svg width="18" height="18"')}</button>
      <div class="list-row"><span>${t('bg.setting')}<br><span class="muted small">${t('bg.settingSub')}</span></span><div class="toggle">
        <button class="${S.settings.mlBg !== false ? 'on' : ''}" data-act="mlBg" data-v="1">${t('bg.on')}</button><button class="${S.settings.mlBg === false ? 'on' : ''}" data-act="mlBg" data-v="0">${t('bg.off')}</button></div></div>
      <div class="list-row"><span>${t('language')}</span><div class="toggle">${['ru', 'uz', 'en'].map(l => `<button class="${getLang() === l ? 'on' : ''}" data-act="setLang" data-k="${l}">${l.toUpperCase()}</button>`).join('')}</div></div>
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
  $('#app').appendChild(root);
  let stream = null, added = 0, busy = false;
  root.innerHTML = `
    <video playsinline muted autoplay></video>
    <div class="scan-frame"><i></i><i></i><i></i><i></i><div class="scan-line"></div></div>
    <div class="scan-top"><button class="icon-btn" data-s="close" aria-label="${t('close')}">${ic('<path d="M6 6l12 12M18 6L6 18"/>')}</button>
      <div class="scan-title">${t('scanTitle')}<div class="scan-ai small" style="opacity:.75;font-weight:400"></div></div>
      <button class="icon-btn lens-btn" data-s="lens" hidden aria-label="lens">1×</button><span class="lens-gap" style="width:40px"></span></div>
    <div class="scan-hint">${t('scanHint')}</div>
    <div class="scan-bottom"><button class="icon-btn" data-s="gallery" aria-label="${t('fromGallery')}">${I.image}</button>
      <button class="shutter" data-s="shoot" aria-label="${t('takePhoto')}"></button>
      <span class="scan-count" hidden></span></div>`;
  const video = root.querySelector('video'), frame = root.querySelector('.scan-frame'), hint = root.querySelector('.scan-hint');
  const count = root.querySelector('.scan-count');
  const aiEl = root.querySelector('.scan-ai');
  const aiStatus = () => {
    const a = (modelState === 'ready' ? '✦ ' : '') + t('aiModel.' + (modelState === 'idle' ? 'loading' : modelState));
    const b = bgState === 'loading' ? t('bg.short', bgPct) : bgState === 'ready' ? t('bg.ready') : '';
    aiEl.textContent = b ? `${a} · ${b}` : a;
  };
  aiStatus(); loadModel().then(aiStatus); loadBg().then(aiStatus);
  const statusTimer = setInterval(aiStatus, 700);
  // live AI: about once a second the network looks at what's inside the frame and says what it sees
  const live = document.createElement('div'); live.className = 'scan-live'; live.hidden = true; root.appendChild(live);
  let lastLive = null, liveBusy = false;
  const liveTick = async () => {
    if (liveBusy || busy || !stream || modelState !== 'ready' || !video.videoWidth) return;
    liveBusy = true;
    try {
      const m = await loadModel(); if (!m) return;
      const vr = video.getBoundingClientRect(), fr = frame.getBoundingClientRect(), vw = video.videoWidth, vh = video.videoHeight;
      const s = Math.min(vr.width / vw, vr.height / vh), ox = (vr.width - vw * s) / 2, oy = (vr.height - vh * s) / 2;
      const sx = Math.max(0, (fr.left - vr.left - ox) / s), sy = Math.max(0, (fr.top - vr.top - oy) / s);
      const r = await classifySource(m, video, vw, vh, [sx, sy, Math.min(vw - sx, fr.width / s), Math.min(vh - sy, fr.height / s)]);
      lastLive = r && r.p >= 15 ? r : null;
      live.hidden = !lastLive;
      if (lastLive) live.innerHTML = `<span class="dot"></span>${t('aiSees')}: <b>${TYPES[lastLive.type][getLang()] || TYPES[lastLive.type].ru}</b> · ${lastLive.p}%`;
      frame.classList.toggle('locked', !!lastLive && lastLive.p >= 35);
    } catch {} finally { liveBusy = false; }
  };
  const liveTimer = setInterval(liveTick, 900);

  // Show the camera's whole field of view: ask for the sensor's native 4:3 (a portrait size makes iPhone crop),
  // fit the video with "contain", put the frame over the real picture and use the widest lens / lowest zoom available.
  let wideId = null, mainId = null, useWide = false;
  const lensBtn = root.querySelector('.lens-btn');
  const layoutFrame = () => {
    const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return;
    const ew = video.clientWidth, eh = video.clientHeight, s = Math.min(ew / vw, eh / vh);
    const dw = vw * s, dh = vh * s, l = (ew - dw) / 2, tp = (eh - dh) / 2, pad = Math.min(dw, dh) * 0.035;
    Object.assign(frame.style, { left: l + pad + 'px', top: tp + pad + 'px', width: dw - 2 * pad + 'px', height: dh - 2 * pad + 'px', right: 'auto', aspectRatio: 'auto' });
    hint.style.top = Math.min(eh - 150, tp + dh + 12) + 'px';
  };
  video.addEventListener('loadedmetadata', layoutFrame); addEventListener('resize', layoutFrame);
  const open = async deviceId => {
    stream?.getTracks().forEach(tr => tr.stop());
    const size = { width: { ideal: 1920 }, height: { ideal: 1440 } };
    stream = await navigator.mediaDevices.getUserMedia({ video: deviceId ? { deviceId: { exact: deviceId }, ...size } : { facingMode: { ideal: 'environment' }, ...size }, audio: false });
    video.srcObject = stream; await video.play().catch(() => {});
    const track = stream.getVideoTracks()[0], caps = track.getCapabilities?.() || {};
    if (caps.zoom && caps.zoom.min < (track.getSettings?.().zoom ?? 1)) { try { await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min }] }); } catch {} }
    layoutFrame();
  };
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw 0;
      await open(null);
      try {
        const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
        const wide = cams.find(d => /ultra ?wide|сверхширок|ultra-wide|0[.,]5/i.test(d.label));
        const main = cams.find(d => /back|rear|environment|задн|тыл/i.test(d.label) && d !== wide && !/tele|теле|dual|triple/i.test(d.label));
        if (wide && main) { wideId = wide.deviceId; mainId = main.deviceId; lensBtn.hidden = false; root.querySelector('.lens-gap').hidden = true; }
      } catch {}
    } catch {
      root.querySelector('.shutter').style.visibility = 'hidden';
      frame.style.display = 'none'; hint.style.display = 'none';
      const empty = document.createElement('div'); empty.className = 'scan-empty';
      empty.innerHTML = `<div><div style="width:56px;height:56px;margin:0 auto 14px">${I.camera}</div><p style="max-width:280px;margin:0 auto 18px">${t('noCamera')}</p>
        <button class="btn" data-s="gallery" style="background:#fff;color:#1C1A18;width:auto">${I.image}${t('pickPhoto')}</button></div>`;
      root.appendChild(empty);
    }
  };
  const stop = () => { stream?.getTracks().forEach(tr => tr.stop()); stream = null; removeEventListener('resize', layoutFrame); clearInterval(liveTimer); clearInterval(statusTimer); };
  const switchLens = async () => {
    useWide = !useWide; lensBtn.textContent = useWide ? '0.5×' : '1×';
    try { await open(useWide ? wideId : mainId); } catch { useWide = false; lensBtn.textContent = '1×'; try { await open(null); } catch {} }
  };
  const close = () => {
    stop(); root.remove();
    if (added) { S.tab = 'wardrobe'; S.wcat = 'all'; persist(); toast(t('scanAddedToast', added)); }
    render();
  };

  // crop the frame area out of the contain-fitted video (≈ the whole camera picture)
  const grab = () => {
    const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return null;
    const vr = video.getBoundingClientRect(), fr = frame.getBoundingClientRect();
    const s = Math.min(vr.width / vw, vr.height / vh);
    const ox = (vr.width - vw * s) / 2, oy = (vr.height - vh * s) / 2;
    const sx = Math.max(0, (fr.left - vr.left - ox) / s), sy = Math.max(0, (fr.top - vr.top - oy) / s);
    const sw = Math.min(vw - sx, fr.width / s), sh = Math.min(vh - sy, fr.height / s);
    const cv = document.createElement('canvas'); cv.width = Math.round(sw); cv.height = Math.round(sh);
    cv.getContext('2d').drawImage(video, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    return new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
  };

  const analyse = async blob => {
    busy = true; root.classList.add('busy'); hint.textContent = t('scanning');
    let r, ai = null;
    try {
      [r] = await Promise.all([processPhoto(blob, s => { hint.textContent = s; }), new Promise(res => setTimeout(res, 1300))]);
      ai = await classify(r.url).catch(() => null);
      if (lastLive && (!ai || lastLive.p > ai.p)) ai = lastLive; // the live view often sees the item better than the cut-out
    } catch { root.classList.remove('busy'); hint.textContent = t('scanHint'); busy = false; toast('Error'); return; }
    root.classList.remove('busy'); hint.textContent = t('scanHint'); aiStatus();
    showResult({ id: uid(), type: ai ? ai.type : r.guess, color: r.colors[0], brand: '', madeIn: '', size: S.profile.topSize, photo: true, _url: r.url, _colors: r.colors, _ai: ai, _ml: r.ml });
  };

  const showResult = it => {
    const card = document.createElement('div'); card.className = 'scan-result';
    const draw = () => {
      card.innerHTML = `
        <div class="row" style="justify-content:space-between;margin-bottom:12px"><span class="badge">✦ ${t('recognized')}</span><span class="muted small">${it._ai ? t('recognizedPct', it._ai.p) : t('recognizedShape')}${it._ml ? ' · ' + t('bg.byAI') : ''}</span></div>
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
    else if (a === 'lens' && !busy) switchLens();
    else if (a === 'shoot' && !busy) {
      const p = grab(); if (!p) return;
      const fl = document.createElement('div'); fl.className = 'flash'; root.appendChild(fl); setTimeout(() => fl.remove(), 400);
      analyse(await p);
    } else if (a === 'gallery' && !busy) {
      const inp = $('#file-input'); inp.value = '';
      inp.onchange = () => { const f = inp.files[0]; if (f) { lastLive = null; analyse(f); } };
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
    <div class="grid2"><label class="field"><span>${t('madeIn')}</span><input class="input" id="f-made" value="${esc(it.madeIn)}" placeholder="Uzbekistan"></label>
      <label class="field"><span>${t('price')}, ${t('sum')}</span><input class="input" id="f-price" inputmode="numeric" value="${esc(it.price || '')}" placeholder="${fmtPrice(TYPES[it.type].price)}"></label></div>
    <datalist id="brands">${['Zara', 'H&M', 'Mango', 'Uniqlo', 'Massimo Dutti', 'Koton', 'LC Waikiki', 'Nike', 'Adidas', "Levi's", 'Local brand'].map(b => `<option value="${esc(b)}">`).join('')}</datalist>
    <div class="row"><button class="btn" data-act="fsave">${t('save')}</button>${it._new ? '' : `<button class="btn ghost" data-act="fdel" style="color:var(--bad)">${t('del')}</button>`}</div>`, handlers);
  const readForm = () => { it.type = $('#f-type').value; it.brand = $('#f-brand').value.trim(); it.size = $('#f-size').value.trim(); it.madeIn = $('#f-made').value.trim();
    it.price = +$('#f-price').value.replace(/\D/g, '') || 0; };
  const handlers = {
    fcolor: el => { readForm(); it.color = el.dataset.k; draw(); },
    fsave: async () => {
      readForm();
      const clean = { id: it.id, type: it.type, color: it.color, brand: it.brand, size: it.size, madeIn: it.madeIn, price: it.price || 0, photo: !!it.photo, added: it.added || now() };
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
      <div class="row" style="justify-content:center;margin-bottom:16px"><div class="toggle">${['ru', 'uz', 'en'].map(l => `<button class="${getLang() === l ? 'on' : ''}" data-act="lang" data-k="${l}">${({ ru: 'Русский', uz: "O'zbekcha", en: 'English' })[l]}</button>`).join('')}</div></div>
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
      <div class="card" style="text-align:center"><h2>${t('trialTitle')}</h2><p class="muted small" style="margin:6px 0 0">${t('pf.today')}: 0 ${t('sum')} → ${fmtPrice(PRICE)} ${t('perMonth')}</p></div></div>
      <button class="btn" data-act="trial">${t('startTrial')}</button></div>`;
  else body = `<div class="onb">${bar}<div class="grow"><h1>${t('onbWardrobe')}</h1><p class="muted">${t('onbWardrobeSub')}</p>
      <div class="grid" style="margin-top:20px">${DEMO_WARDROBE.slice(0, 9).map(([ty, c]) => `<div class="tile"><img src="${svgURL(ty, colorByKey(c).hex)}" alt=""></div>`).join('')}</div></div>
      <div class="stack"><button class="btn" data-act="finishDemo">${t('loadDemo')}</button><button class="btn ghost" data-act="finishOwn">${I.camera}${t('addOwn')}</button></div></div>`;
  return body;
}
function finishOnb() { S.onboarded = true; S.tab = 'home'; persist(); render(); }

// ---------------- render ----------------
let lastScreen = '', viewAnimT;
function scrollTop0(smooth = false) {
  const b = smooth && !reduceMotion() ? 'smooth' : 'auto';
  window.scrollTo({ top: 0, behavior: b }); $('#view').scrollTo({ top: 0, behavior: b });
}
function render() {
  applyTheme();
  acts = {
    tab: el => { if (S.tab === el.dataset.k) return scrollTop0(true); S.tab = el.dataset.k; persist(); render(); scrollTop0(); },
    event: el => { S.event = el.dataset.k; persist(); render(); },
    loadDemo, subscribe: () => paySheet({ trial: false }).then(render),
    closeSheet,
  };
  subTick();
  const view = $('#view');
  view.classList.toggle('full', !S.onboarded);
  const screens = { home: screenHome, ai: screenAI, wardrobe: screenWardrobe, outfits: screenOutfits, profile: screenProfile, brand: screenBrand };
  view.innerHTML = S.onboarded ? (screens[S.tab] || screenHome)() : screenOnboarding();
  // screen transitions: crossfade between tabs, push/pop between onboarding steps
  const screen = S.onboarded ? 'tab:' + S.tab : 'onb:' + S.step;
  if (lastScreen && screen !== lastScreen && !reduceMotion()) {
    const cls = !S.onboarded && lastScreen.startsWith('onb:') ? (S.step > +lastScreen.slice(4) ? 'push' : 'pop') : 'enter';
    view.classList.remove('enter', 'push', 'pop'); void view.offsetWidth; view.classList.add(cls);
    clearTimeout(viewAnimT); viewAnimT = setTimeout(() => view.classList.remove(cls), 500);
  }
  lastScreen = screen;
  setTimeout(() => document.querySelectorAll('.look.assemble').forEach(l => l.classList.remove('assemble')), 1300);
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
