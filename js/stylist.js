// On-device outfit engine: weather + occasion + colour harmony + wear history + feedback.
import { TYPES, colorByKey, hexToRgb, rgbToHsl } from './data.js';
import { t, getLang } from './i18n.js';

const EVENT_FORM = { study: 2.2, work: 3.8, meeting: 2.9, event: 4.2 };
const STYLE_TYPES = {
  minimal: [], classic: ['blazer', 'trousers', 'loafers', 'shirt', 'trench', 'coat'],
  trendy: ['wide', 'leatherjacket', 'sneakers', 'tote'], romantic: ['skirt', 'dress', 'blouse', 'heels', 'jewelry'],
  sporty: ['hoodie', 'sneakers', 'backpack', 'cap', 'tshirt'], street: ['hoodie', 'denimjacket', 'jeans', 'sneakers', 'cap', 'leatherjacket'],
};
const DAY = 864e5;

export const need = T => 3 + Math.max(0, 24 - T) * 0.33;

function rng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const cname = it => colorByKey(it.color)[getLang()];
export const itemLabel = it => `${TYPES[it.type][getLang()].toLowerCase()}`;

function harmony(items) {
  const cols = items.map(it => ({ c: colorByKey(it.color), w: TYPES[it.type].cat === 'acc' ? 0.5 : 1 }));
  const accents = [...new Map(cols.filter(x => !x.c.n).map(x => [x.c.k, x.c])).values()];
  const hsl = cols.map(x => rgbToHsl(hexToRgb(x.c.hex)));
  const lights = hsl.filter(h => h[2] > 0.7).length, darks = hsl.filter(h => h[2] < 0.3).length;
  let s = 0, reason = null;
  const keys = cols.map(x => x.c.k);
  if (keys.includes('black') && keys.includes('navy')) s -= 1;
  if (accents.length === 0) {
    s += 2;
    const uniq = new Set(keys.filter(k => k !== 'gold'));
    if (uniq.size <= 2 && ['black', 'white', 'grey'].some(k => uniq.has(k)) === false) { s += 0.8; reason = t('r.mono'); }
    else if (lights && darks) { s += 0.6; reason = t('r.contrast'); }
    else reason = t('r.neutral');
  } else if (accents.length === 1) {
    s += 2.4; reason = t('r.accent', accents[0][getLang()]);
  } else if (accents.length === 2) {
    const [a, b] = accents.map(c => rgbToHsl(hexToRgb(c.hex))[0]);
    const d = Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
    if (d < 45) { s += 1.4; reason = t('r.analog', accents[0][getLang()], accents[1][getLang()]); }
    else if (d > 140) { s += 0.8; reason = t('r.compl', accents[0][getLang()], accents[1][getLang()]); }
    else s -= 1.5;
  } else s -= 3;
  return { s, reason };
}

function daysSinceWorn(id, worn, now) {
  let last = 0;
  for (const w of worn) if (w.ids.includes(id) && w.date > last) last = w.date;
  return last ? Math.floor((now - last) / DAY) : null;
}

/**
 * @param items   wardrobe items
 * @param ctx     { weather:{morning,day,code}, event, seed, prefs, worn, profile, now }
 * @returns array of outfits { key, parts:{top,bottom,dress,layer,shoes,bag,acc}, reasons[], layerRemovable, score }
 */
export function generate(items, ctx, count = 5) {
  const by = c => items.filter(it => TYPES[it.type]?.cat === c);
  const tops = by('top'), bottoms = by('bottom'), dresses = by('dress'), layers = by('layer'), shoes = by('shoes'), bags = by('bag'), accs = by('acc');
  if (!shoes.length || (!dresses.length && (!tops.length || !bottoms.length))) return [];

  const R = rng(ctx.seed);
  const { morning, day, code } = ctx.weather;
  const rainy = code >= 51;
  const target = EVENT_FORM[ctx.event] ?? 2.5;
  const needM = need(morning), needD = need(day);
  const styles = ctx.profile.styles || [];
  const favs = ctx.profile.colors || [];
  const ip = ctx.prefs.items || {};
  const now = ctx.now;
  const freshCache = new Map();
  const fresh = it => { if (!freshCache.has(it.id)) freshCache.set(it.id, daysSinceWorn(it.id, ctx.worn, now)); return freshCache.get(it.id); };

  const itemScore = it => {
    const T = TYPES[it.type];
    let s = -1.1 * Math.abs(T.form - target);
    if ((ctx.event === 'work' || ctx.event === 'event') && ['hoodie', 'shorts', 'sandals', 'cap', 'backpack'].includes(it.type)) s -= 2;
    if (ctx.event === 'study' && it.type === 'heels') s -= 0.6;
    for (const st of styles) if (STYLE_TYPES[st]?.includes(it.type)) s += 0.35;
    if (favs.includes(it.color)) s += 0.35;
    s += 0.5 * (ip[it.id] || 0);
    const f = fresh(it);
    if (f !== null && f < 2) s -= 1.6;
    else if (f === null) s += 0.25;
    else s += 0.3 * Math.min(f, 14) / 14;
    return s;
  };
  const cache = new Map();
  const IS = it => { if (!cache.has(it.id)) cache.set(it.id, itemScore(it)); return cache.get(it.id); };

  const bases = [];
  for (const tp of tops) for (const bt of bottoms) bases.push([tp, bt]);
  for (const dr of dresses) bases.push([dr]);

  const cands = [];
  for (const base of bases) for (const sh of shoes) for (const ly of [null, ...layers]) {
    const core = [...base, sh];
    let warmBase = core.reduce((a, it) => a + TYPES[it.type].warm, 0);
    const warmFull = warmBase + (ly ? TYPES[ly.type].warm : 0);
    let s = core.reduce((a, it) => a + IS(it), 0) + (ly ? IS(ly) * 0.8 : 0);
    const dM = Math.abs(warmFull - needM);
    const dD = Math.min(Math.abs(warmBase - needD), Math.abs(warmFull - needD));
    s -= 0.7 * dM + 0.9 * dD;
    if (warmFull < needM - 1.5) s -= 1.5; // too cold is worse than too warm
    if (day >= 27 && ly) s -= 1.5;
    if (rainy && sh.type === 'sandals') s -= 2;
    if (base.length === 2 && base[0].color === base[1].color && !colorByKey(base[0].color).n) s -= 0.6;
    const h = harmony(ly ? [...core, ly] : core);
    s += h.s;
    // ~20% of picks of the top bracket differ day to day
    s += R() * 1.2;
    cands.push({ base, sh, ly, s, warmBase, warmFull, h });
  }
  cands.sort((a, b) => b.s - a.s);

  const picked = [];
  const sig = c => [...c.base, c.sh].map(i => i.id);
  for (const c of cands) {
    if (picked.length >= count) break;
    const ids = sig(c);
    const clash = picked.some(p => {
      const pid = sig(p);
      const sameBase = c.base.every(b => p.base.includes(b));
      const shared = ids.filter(i => pid.includes(i)).length + (c.ly && c.ly === p.ly ? 1 : 0);
      return sameBase || shared >= 2;
    });
    if (!clash) picked.push(c);
  }
  // relax if wardrobe is small
  for (const c of cands) { if (picked.length >= Math.min(count, 3)) break; if (!picked.includes(c) && !picked.some(p => p.base.every(b => c.base.includes(b)) && p.sh === c.sh)) picked.push(c); }

  return picked.map(c => finish(c, { bags, accs, IS, needD, morning, day, rainy, fresh }));
}

function finish(c, { bags, accs, IS, needD, morning, day, rainy, fresh }) {
  const all = [...c.base, c.sh, ...(c.ly ? [c.ly] : [])];
  const pickExtra = list => {
    let best = null, bs = -Infinity;
    for (const it of list) { const s = IS(it) + harmony([...all, it]).s * 0.6; if (s > bs) { bs = s; best = it; } }
    return bs > -2.5 ? best : null;
  };
  const bag = pickExtra(bags);
  const acc = day >= 18 || !accs.some(a => a.type === 'scarf') ? pickExtra(accs.filter(a => a.type !== 'scarf' || day < 12)) : pickExtra(accs);
  const parts = { shoes: c.sh, bag, acc, layer: c.ly };
  if (c.base.length === 1) parts.dress = c.base[0]; else { parts.top = c.base[0]; parts.bottom = c.base[1]; }

  const reasons = [];
  let layerNote = null, layerRemovable = false;
  if (c.ly) {
    const removable = Math.abs(c.warmBase - needD) < Math.abs(c.warmFull - needD);
    if (removable && morning < day - 4) { layerNote = t('r.layer', Math.round(morning), Math.round(day), itemLabel(c.ly)); layerRemovable = true; }
    else layerNote = t('r.warmAll', Math.round(Math.min(morning, day)), itemLabel(c.ly));
  } else if (day >= 20) reasons.push(t('r.light', Math.round(day)));
  if (c.h.reason) reasons.push(c.h.reason);
  if (rainy && ['boots', 'sneakers', 'loafers'].includes(c.sh.type)) reasons.push(t('r.rain'));
  // freshness: mention the least recently worn piece
  let freshest = null, fd = -1;
  for (const it of all) { const f = fresh(it); const v = f === null ? 999 : f; if (v > fd) { fd = v; freshest = it; } }
  if (freshest && fd === 999) reasons.push(t('r.never', itemLabel(freshest)));
  else if (freshest && fd >= 5) reasons.push(t('r.fresh', itemLabel(freshest), fd));
  if (all.some(it => IS(it) > 1.2)) reasons.push(t('r.liked'));
  const key = [...all.map(i => i.id), bag?.id, acc?.id].filter(Boolean).sort().join('|');
  return { key, parts, reasons, layerNote, layerRemovable, score: c.s };
}

export const outfitIds = o => Object.values(o.parts).filter(Boolean).map(i => i.id);

// How many new top+bottom+shoes / dress+shoes combinations a new piece unlocks.
export function newLooksWith(items, type) {
  const n = c => items.filter(it => TYPES[it.type].cat === c).length;
  const tops = n('top'), bottoms = n('bottom'), dresses = n('dress'), shoes = n('shoes'), layers = n('layer');
  const bases = tops * bottoms + dresses;
  switch (TYPES[type].cat) {
    case 'top': return Math.max(1, bottoms * shoes);
    case 'bottom': return Math.max(1, tops * shoes);
    case 'dress': return Math.max(1, shoes);
    case 'shoes': return Math.max(1, bases);
    case 'layer': return Math.max(1, Math.round(bases * shoes / Math.max(1, layers + 1)));
    default: return Math.max(1, Math.round(bases / 2));
  }
}

/**
 * Wardrobe gap analysis -> partner product suggestions.
 * Each gap: { product, why }  (why is an i18n key under "gap.")
 */
export function findGaps(items, products, weather, profile, event, dismissed = []) {
  const has = (pred) => items.some(pred);
  const owned = p => items.some(it => it.type === p.type && it.color === p.color);
  const pick = (pred) => products.find(p => pred(p) && !owned(p) && !dismissed.includes(p.id));
  const gaps = [];
  const add = (p, why) => { if (p && !gaps.some(g => g.product.id === p.id)) gaps.push({ product: p, why }); };
  const cat = it => TYPES[it.type].cat;
  if (weather && weather.morning < 8 && !has(it => cat(it) === 'layer' && TYPES[it.type].warm >= 4.5)) add(pick(p => ['puffer', 'coat'].includes(p.type)), 'cold');
  if (weather && weather.morning < 16 && !has(it => cat(it) === 'layer')) add(pick(p => ['trench', 'cardigan', 'denimjacket'].includes(p.type)), 'layer');
  if (!has(it => cat(it) === 'shoes' && it.color === 'white')) add(pick(p => p.type === 'sneakers' && p.color === 'white'), 'whiteShoes');
  if (event === 'work' || event === 'event' || (profile.styles || []).includes('classic')) {
    if (!has(it => it.type === 'blazer')) add(pick(p => p.type === 'blazer'), 'work');
    if (!has(it => cat(it) === 'shoes' && TYPES[it.type].form >= 3.5)) add(pick(p => p.type === 'loafers'), 'formalShoes');
  }
  if (!has(it => cat(it) === 'bag')) add(pick(p => p.type === 'handbag'), 'bag');
  const tops = items.filter(it => cat(it) === 'top').length, bottoms = items.filter(it => cat(it) === 'bottom').length;
  if (tops > bottoms * 2) add(pick(p => cat(p) === 'bottom'), 'bottoms');
  if (bottoms > tops * 1.5) add(pick(p => cat(p) === 'top'), 'tops');
  const favs = (profile.colors || []).filter(c => !items.some(it => it.color === c));
  if (favs.length) add(pick(p => favs.includes(p.color)), 'fav');
  // fill up with what unlocks the most new looks
  const rest = products.filter(p => !owned(p) && !dismissed.includes(p.id)).sort((a, b) => newLooksWith(items, b.type) - newLooksWith(items, a.type));
  for (const p of rest) { if (gaps.length >= 4) break; add(p, 'most'); }
  return gaps.slice(0, 4).map(g => ({ ...g, looks: newLooksWith(items, g.product.type) }));
}
