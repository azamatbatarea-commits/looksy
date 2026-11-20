// Catalogue-style garment illustrations: volume gradients, folds, seams, hardware and fabric texture.
// Every SVG is standalone (rendered via data: URL), so the ids inside never collide.

const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (hex, amt) => toHex(rgb(hex).map(v => amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
const lum = hex => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

const COPPER = '#C9944E';

// ---------- silhouettes ----------
const LONG = 'M36 11C40 9.5 43 8.5 44 8.5C46 12.5 54 12.5 56 8.5C57 8.5 60 9.5 64 11C72 13 77 17 79 26L87 78C87.5 80.5 86.5 82 84.5 82.5L80 83.5C78 84 76.5 83 76 81L70 44L70.5 90C70.5 92 69 93 67 93L33 93C31 93 29.5 92 29.5 90L30 44L24 81C23.5 83 22 84 20 83.5L15.5 82.5C13.5 82 12.5 80.5 13 78L21 26C23 17 28 13 36 11Z';
const body = y => LONG.replace('L70.5 90C70.5 92 69 93 67 93L33 93C31 93 29.5 92 29.5 90', `L70.5 ${y - 3}C70.5 ${y - 1} 69 ${y} 67 ${y}L33 ${y}C31 ${y} 29.5 ${y - 1} 29.5 ${y - 3}`);
const TEE = 'M36 12C40 10 43 9 44 9C46 13 54 13 56 9C57 9 60 10 64 12L82 22C84 23 85 25 84 27L78 37C77 39 75 39 73 38L69 35L69.5 88C69.5 90 68 91 66 91L34 91C32 91 30.5 90 30.5 88L31 35L27 38C25 39 23 39 22 37L16 27C15 25 16 23 18 22Z';
const COAT = 'M36 9C40 7.5 43 6.5 44 6.5C46 10.5 54 10.5 56 6.5C57 6.5 60 7.5 64 9C72 11 77 15 79 24L87 76C87.5 78.5 86.5 80 84.5 80.5L80 81.5C78 82 76.5 81 76 79L71 42C72 60 73.5 78 75 95C75.2 97 74 98 72 98L28 98C26 98 24.8 97 25 95C26.5 78 28 60 29 42L24 79C23.5 81 22 82 20 81.5L15.5 80.5C13.5 80 12.5 78.5 13 76L21 24C23 15 28 11 36 9Z';
const PUFF = COAT.replace('C72 60 73.5 78 75 95C75.2 97 74 98 72 98L28 98C26 98 24.8 97 25 95C26.5 78 28 60 29 42', 'C71.5 60 72 72 72.5 84C72.5 86 71 87 69 87L31 87C29 87 27.5 86 27.5 84C28 72 28.5 60 29 42');
const PANTS = 'M30 6L70 6C71 30 72.5 60 74 94C74 95.5 73 96 72 96L56 96C55 96 54.2 95.3 54 94.3L50.5 38L46 94.3C45.8 95.3 45 96 44 96L28 96C27 96 26 95.5 26 94C27.5 60 29 30 30 6Z';
const WIDE = 'M30 6L70 6C73 30 78 62 82 94C82.3 95.3 81.5 96 80.3 96L55 96C54 96 53.3 95.4 53.2 94.4L50.3 40L47 94.4C46.9 95.4 46.2 96 45.2 96L19.7 96C18.5 96 17.7 95.3 18 94C22 62 27 30 30 6Z';
const SKIRT = 'M33 12L67 12L83 86C83.4 88 82 89.5 80 89.8C61 92.5 39 92.5 20 89.8C18 89.5 16.6 88 17 86Z';
const SHORTS = 'M28 20L72 20C73 34 74.5 48 76 62C76.2 63.5 75.3 64.5 74 64.7L56 66.5C55 66.6 54 65.8 53.9 64.8L50.3 44L46.1 64.8C46 65.8 45 66.6 44 66.5L26 64.7C24.7 64.5 23.8 63.5 24 62C25.5 48 27 34 28 20Z';
const DRESS = 'M39 4C40.5 3.5 42 3.5 43 4C45 10 55 10 57 4C58 3.5 59.5 3.5 61 4L63 22C61 30 60.5 35 62 40L81 92C81.4 93.6 80.4 95 78.8 95.2C60 97.8 40 97.8 21.2 95.2C19.6 95 18.6 93.6 19 92L38 40C39.5 35 39 30 37 22Z';

export function garmentSVG(type, hex) {
  const L = lum(hex), light = L > 0.8, dark = L < 0.2;
  const hi = shade(hex, dark ? 0.24 : 0.17), lo = shade(hex, -0.17), deep = shade(hex, -0.4);
  const line = light ? '#B7AEA2' : shade(hex, -0.48);
  const seamC = light ? '#A89F93' : dark ? shade(hex, 0.35) : shade(hex, -0.3);
  const hiOp = dark ? 0.16 : light ? 0.5 : 0.3;
  const foldOp = light ? 0.13 : 0.24;

  const defs = `<defs>
    <linearGradient id="g" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${hex}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
    <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
    <linearGradient id="gh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${lo}"/><stop offset=".45" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
    <linearGradient id="lens" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1f24"/><stop offset="1" stop-color="#4b525e"/></linearGradient>
    <radialGradient id="gold" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFF3CF"/><stop offset=".45" stop-color="#D4AD55"/><stop offset="1" stop-color="#7C5D1F"/></radialGradient>
    <radialGradient id="silver" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#C5C8CE"/><stop offset="1" stop-color="#6A6E76"/></radialGradient>
    <radialGradient id="pearl" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#ECE7DF"/><stop offset="1" stop-color="#B5AEA3"/></radialGradient>
    <radialGradient id="horn" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#9A7A5C"/><stop offset=".55" stop-color="#4A3524"/><stop offset="1" stop-color="#1E140C"/></radialGradient>
    <pattern id="tw" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="1" height="2.4" fill="${deep}" fill-opacity=".17"/></pattern>
    <pattern id="rib" width="1.7" height="4" patternUnits="userSpaceOnUse"><rect width=".65" height="4" fill="${deep}" fill-opacity=".3"/></pattern>
    <pattern id="knit" width="3" height="2.6" patternUnits="userSpaceOnUse"><path d="M0 0L1.5 2.2L3 0" fill="none" stroke="${deep}" stroke-opacity=".2" stroke-width=".55"/></pattern>
    <pattern id="grain" width="2.2" height="2.2" patternUnits="userSpaceOnUse"><circle cx=".5" cy=".6" r=".3" fill="${deep}" fill-opacity=".1"/><circle cx="1.6" cy="1.7" r=".26" fill="#fff" fill-opacity=".08"/></pattern>
    <pattern id="gab" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width=".55" height="2" fill="${deep}" fill-opacity=".11"/></pattern>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="soft2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1"/></filter>
    <radialGradient id="key" cx=".3" cy=".18" r=".75"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.22 : light ? 0.5 : 0.32}"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${light ? 0.08 : 0.16}"/></linearGradient>
    <filter id="noise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7"/>
      <feColorMatrix type="matrix" values="0 0 0 0 ${dark ? 1 : 0}  0 0 0 0 ${dark ? 1 : 0}  0 0 0 0 ${dark ? 1 : 0}  0 0 0 .55 -.18"/></filter>
  </defs>`;

  // drawing helpers
  const B = (d, fill = 'url(#g)') => `<path d="${d}" fill="${fill}"/>`;
  const O = d => `<path d="${d}" fill="none" stroke="${line}" stroke-width=".75" stroke-linejoin="round"/>`;
  const T = (d, tex) => tex ? `<path d="${d}" fill="url(#${tex})"/>` : '';
  const Fl = (d, fill, op = 1, stroke = '') => `<path d="${d}" fill="${fill}" fill-opacity="${op}"${stroke ? ` stroke="${stroke}" stroke-width=".6"` : ''}/>`;
  const F = (d, op = foldOp, w = 1.4) => `<path d="${d}" fill="none" stroke="${deep}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
  const H = (d, op = hiOp, w = 1.6) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="round"/>`;
  const S = (d, c = seamC, op = 0.7) => `<path d="${d}" fill="none" stroke="${c}" stroke-opacity="${op}" stroke-width=".5" stroke-dasharray="1.3 .9" stroke-linecap="round"/>`;
  const Ln = (d, c, w = 1, op = 1, cap = 'round') => `<path d="${d}" fill="none" stroke="${c}" stroke-opacity="${op}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
  const Bt = (x, y, r = 1.5, g = 'horn') => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g})" stroke="rgba(0,0,0,.25)" stroke-width=".3"/>` +
    (r > 1.2 ? `<circle cx="${x - r * 0.28}" cy="${y}" r=".22" fill="rgba(0,0,0,.45)"/><circle cx="${x + r * 0.28}" cy="${y}" r=".22" fill="rgba(0,0,0,.45)"/>` : '');
  // silhouette with clipped details, studio lighting and a crisp outline:
  //  - fabric grain (turbulence), key light from the top-left, soft shade toward the floor
  //  - ambient occlusion: a blurred dark stroke along the inside of the edge gives the cloth volume
  let n = 0;
  const garment = (d, tex, inner = '', before = '', after = '') => {
    const id = 'cp' + (n++);
    return `${before}<clipPath id="${id}"><path d="${d}"/></clipPath>${B(d)}<g clip-path="url(#${id})">${T(d, tex)}
      <rect x="-2" y="-3" width="104" height="104" filter="url(#noise)" opacity="${dark ? 0.3 : light ? 0.16 : 0.3}"/>${inner}
      <rect x="-2" y="-3" width="104" height="104" fill="url(#floor)"/><rect x="-2" y="-3" width="104" height="104" fill="url(#key)"/>
      <path d="${d}" fill="none" stroke="${deep}" stroke-opacity="${light ? 0.22 : 0.38}" stroke-width="5" filter="url(#soft)"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-opacity="${dark ? 0.1 : 0.18}" stroke-width="1.6" filter="url(#soft2)" transform="translate(.6 .9)"/></g>${O(d)}${after}`;
  };

  const upperFolds = () =>
    F('M30 44C32 50 32 56 31 60') + F('M70 44C68 50 68 56 69 60') +
    F('M79.5 47C77.5 50.5 78.5 54 81 56.5') + F('M20.5 47C22.5 50.5 21.5 54 19 56.5') +
    F('M38 58C42 64 41 72 38 80', foldOp * 0.6) + F('M62 60C58 67 60 74 63 82', foldOp * 0.6) +
    H('M39 17C45 21 55 21 61 17') + H('M75 30L81 64', hiOp * 0.6, 1.2) + H('M25 30L19 64', hiOp * 0.4, 1.2) +
    S('M64 11.5C68 22 70 32 70 44') + S('M36 11.5C32 22 30 32 30 44');
  const ribBands = (neck = true) =>
    Fl('M76 75.5L86.2 73.6L87 78C87.5 80.5 86.5 82 84.5 82.5L80 83.5C78 84 76.5 83 76 81Z', lo) + T('M76 75.5L86.2 73.6L87 78C87.5 80.5 86.5 82 84.5 82.5L80 83.5C78 84 76.5 83 76 81Z', 'rib') +
    Fl('M24 75.5L13.8 73.6L13 78C12.5 80.5 13.5 82 15.5 82.5L20 83.5C22 84 23.5 83 24 81Z', lo) + T('M24 75.5L13.8 73.6L13 78C12.5 80.5 13.5 82 15.5 82.5L20 83.5C22 84 23.5 83 24 81Z', 'rib') +
    Fl('M29.6 85L70.4 85L70.5 93L29.5 93Z', lo) + T('M29.6 85L70.4 85L70.5 93L29.5 93Z', 'rib') +
    (neck ? Fl('M43 8C45.5 14 54.5 14 57 8L58.6 9.2C56 16.8 44 16.8 41.4 9.2Z', lo) + T('M43 8C45.5 14 54.5 14 57 8L58.6 9.2C56 16.8 44 16.8 41.4 9.2Z', 'rib') : '');
  const isDenim = ['denim', 'lightblue', 'blue', 'navy'].some(() => false) || (rgb(hex)[2] > rgb(hex)[0] + 25 && L < 0.75);

  let s = '';
  switch (type) {
    case 'tshirt':
      s = garment(TEE, 'grain',
        F('M31 35C33 40 33 46 32 50', foldOp * 1.2) + F('M69 35C67 40 67 46 68 50', foldOp * 1.2) +
        F('M38 42C42 48 41 58 38 64', foldOp * 0.7) + F('M62 46C58 54 60 62 63 68', foldOp * 0.7) + F('M44 72C50 75 56 74 60 71', foldOp * 0.5) +
        H('M40 20C46 24 54 24 60 20') + H('M74 24L79 30', hiOp * 0.7) +
        S('M81.3 25.4L75.8 34.6') + S('M18.7 25.4L24.2 34.6') + S('M31 87L69 87') + S('M64 12.5L69 35') + S('M36 12.5L31 35'),
        '', Ln('M44 9C46 13 54 13 56 9', lo, 2.2) + S('M42.8 10.6C45.8 15.6 54.2 15.6 57.2 10.6'));
      break;
    case 'longsleeve':
      s = garment(LONG, 'grain', upperFolds() + S('M76.3 79L86.7 77') + S('M23.7 79L13.3 77') + S('M29.7 89L70.3 89'),
        '', Ln('M44 8.5C46 12.5 54 12.5 56 8.5', lo, 2.2) + S('M42.8 10C45.8 15 54.2 15 57.2 10'));
      break;
    case 'sweater': {
      const cable = x => Ln(`M${x} 18C${x - 2.5} 22 ${x + 2.5} 26 ${x} 30C${x - 2.5} 34 ${x + 2.5} 38 ${x} 42C${x - 2.5} 46 ${x + 2.5} 50 ${x} 54C${x - 2.5} 58 ${x + 2.5} 62 ${x} 66C${x - 2.5} 70 ${x + 2.5} 74 ${x} 78C${x - 2} 81 ${x} 83 ${x} 84`, deep, 1.6, 0.22) +
        Ln(`M${x - 0.6} 19C${x - 3} 23 ${x + 2} 27 ${x - 0.6} 31`, '#fff', 0.7, hiOp * 0.7);
      s = garment(LONG, 'knit', upperFolds() + cable(40) + cable(60) + ribBands(true));
      break;
    }
    case 'hoodie':
      s = garment(LONG, 'grain',
        upperFolds() + ribBands(false) +
        Fl('M35 62C35 60.5 36 60 37.5 60L62.5 60C64 60 65 60.5 65 62L68 80L32 80Z', lo, 0.55) + S('M35.8 61.5L64.2 61.5L66.8 79') + S('M33.2 79L35.8 61.5') +
        F('M37 62C38 68 38 74 36 79', 0.3, 1.2) + F('M63 62C62 68 62 74 64 79', 0.3, 1.2),
        Fl('M37 13C33 3 41 -1 50 -1C59 -1 67 3 63 13Z', 'url(#gv)') + Fl('M41.5 12C41 5 45 2.5 50 2.5C55 2.5 59 5 58.5 12Z', deep, 0.55),
        Ln('M46 13L45 30', '#F2EEE8', 1) + Ln('M54 13L55 30', '#F2EEE8', 1) + Fl('M44.3 29.5L45.7 29.5L45.5 33L44.5 33Z', '#C5C8CE') + Fl('M54.3 29.5L55.7 29.5L55.5 33L54.5 33Z', '#C5C8CE'));
      break;
    case 'shirt':
      s = garment(LONG, 'grain',
        upperFolds() + Fl('M48.6 13L51.4 13L51.4 93L48.6 93Z', hi, 0.5) + S('M48.6 15L48.6 93') + S('M51.4 15L51.4 93') +
        [24, 36, 48, 60, 72, 84].map(y => Bt(50, y, 1.15, 'pearl')).join('') +
        S('M56 30L64 30L64 39C64 40 63 41 62 41L58 41C57 41 56 40 56 39Z') + Ln('M56 30L64 30', lo, 0.8) +
        Fl('M76.6 77L86.4 75.2L87 78C87.5 80.5 86.5 82 84.5 82.5L80 83.5C78 84 76.5 83 76 81Z', lo, 0.45) + S('M76.6 77L86.4 75.2') +
        Fl('M23.4 77L13.6 75.2L13 78C12.5 80.5 13.5 82 15.5 82.5L20 83.5C22 84 23.5 83 24 81Z', lo, 0.45) + S('M23.4 77L13.6 75.2') +
        S('M30 22C40 25 60 25 70 22'),
        '', Fl('M44 8.5L40.5 15.5L47.5 20.5L50 12.5Z', 'url(#gv)', 1, line) + Fl('M56 8.5L59.5 15.5L52.5 20.5L50 12.5Z', 'url(#gv)', 1, line) + Bt(50, 13.5, 0.9, 'pearl'));
      break;
    case 'blouse':
      s = garment(LONG, '',
        upperFolds() + H('M42 24C44 40 43 60 40 80', hiOp * 0.9, 2.4) + H('M58 30C56 46 57 64 60 82', hiOp * 0.6, 2) +
        F('M45 30C48 50 47 70 45 88', foldOp * 0.5) + F('M55 30C52 50 53 70 55 88', foldOp * 0.5) +
        Fl('M76 76L86.3 74.2L87 78C87.5 80.5 86.5 82 84.5 82.5L80 83.5C78 84 76.5 83 76 81Z', lo, 0.4) + F('M79 76.5L80 82.5', 0.3, 0.7) + F('M83 75.6L84 82', 0.3, 0.7) +
        Fl('M24 76L13.7 74.2L13 78C12.5 80.5 13.5 82 15.5 82.5L20 83.5C22 84 23.5 83 24 81Z', lo, 0.4) + F('M21 76.5L20 82.5', 0.3, 0.7) + F('M17 75.6L16 82', 0.3, 0.7),
        '', Ln('M44 8.5C46 17 54 17 56 8.5', lo, 1.6) +
        Fl('M50 15C46 10.5 41.5 12 43.5 16.5C45.5 19 48.5 17 50 15Z', 'url(#gv)', 1, line) + Fl('M50 15C54 10.5 58.5 12 56.5 16.5C54.5 19 51.5 17 50 15Z', 'url(#gv)', 1, line) +
        Ln('M49.4 15.5L46.5 27', hex, 1.8) + Ln('M50.6 15.5L53.5 27', hex, 1.8) + `<circle cx="50" cy="15.2" r="1.6" fill="${lo}" stroke="${line}" stroke-width=".4"/>`);
      break;
    case 'cardigan':
      s = garment(LONG, 'knit',
        upperFolds() + ribBands(false) +
        Fl('M44 8.5L50 42L56 8.5C54 11 46 11 44 8.5Z', deep, 0.4) +
        Fl('M44 8.5L50 42L50 93L47.4 93L47.4 44L42 10Z', lo, 0.55) + T('M44 8.5L50 42L50 93L47.4 93L47.4 44L42 10Z', 'rib') +
        Ln('M50 42L50 93', line, 0.7) + [50, 60, 70, 80].map(y => Bt(48.8, y, 1.35)).join('') +
        Fl('M33 64L44 64L44 76C44 77 43 78 42 78L35 78C34 78 33 77 33 76Z', lo, 0.35) + Fl('M33 64L44 64L44 66.5L33 66.5Z', lo) + T('M33 64L44 64L44 66.5L33 66.5Z', 'rib') +
        Fl('M56 64L67 64L67 76C67 77 66 78 65 78L58 78C57 78 56 77 56 76Z', lo, 0.35) + Fl('M56 64L67 64L67 66.5L56 66.5Z', lo) + T('M56 64L67 64L67 66.5L56 66.5Z', 'rib'));
      break;
    case 'blazer': {
      const d = body(96);
      s = garment(d, 'grain',
        upperFolds() + Fl('M44 8.5L50 50L56 8.5C54 11 46 11 44 8.5Z', deep, 0.45) +
        Fl('M44 8.5L37 13L39.5 22L35.5 25.5L50 50Z', 'url(#gv)', 1, line) + Fl('M56 8.5L63 13L60.5 22L64.5 25.5L50 50Z', 'url(#gv)', 1, line) +
        S('M38.6 14L48.4 46') + S('M61.4 14L51.6 46') + H('M39 15L46 38', hiOp * 0.8, 1) +
        Ln('M50 50C49.6 70 49 84 46.5 96', line, 0.7) + Bt(50.6, 58, 1.6) + Bt(50.3, 70, 1.6) +
        Fl('M31.5 72.5L44 71.5L44 74.8L31.5 75.8Z', lo, 0.8, line) + Fl('M56 71.5L68.5 72.5L68.5 75.8L56 74.8Z', lo, 0.8, line) +
        Fl('M56 33.5L65 32.5L65 35L56 36Z', lo, 0.8, line) + F('M40 52L41 68', foldOp * 0.6) + F('M60 52L59 68', foldOp * 0.6) +
        Bt(81.6, 77.5, 0.8) + Bt(81.2, 75, 0.8) + Bt(18.4, 77.5, 0.8) + Bt(18.8, 75, 0.8) + H('M36 12C32 14 28 18 26 24', hiOp, 2));
      break;
    }
    case 'denimjacket': {
      const d = body(81);
      s = garment(d, 'tw',
        upperFolds() + S('M30 26C40 23.5 60 23.5 70 26', COPPER, 0.9) + S('M30 27.3C40 24.8 60 24.8 70 27.3', COPPER, 0.9) +
        Fl('M48.4 12L51.6 12L51.6 81L48.4 81Z', lo, 0.45) + S('M48.4 14L48.4 74', COPPER, 0.9) + S('M51.6 14L51.6 74', COPPER, 0.9) +
        [27, 39, 51, 63].map(y => Bt(50, y, 1.25, 'silver')).join('') +
        Fl('M33 31L45 31L45 37L39 39.5L33 37Z', lo, 0.85, line) + S('M33.6 31.7L44.4 31.7L44.4 36.6L39 38.8L33.6 36.6Z', COPPER) + Bt(39, 36, 0.95, 'silver') + S('M33 38L33 48L45 48L45 38', COPPER) +
        Fl('M55 31L67 31L67 37L61 39.5L55 37Z', lo, 0.85, line) + S('M55.6 31.7L66.4 31.7L66.4 36.6L61 38.8L55.6 36.6Z', COPPER) + Bt(61, 36, 0.95, 'silver') + S('M55 38L55 48L67 48L67 38', COPPER) +
        S('M38 48L38 74', COPPER) + S('M62 48L62 74', COPPER) +
        Fl('M29.6 74L70.4 74L70.5 81L29.5 81Z', lo, 0.6) + S('M29.6 74.8L70.4 74.8', COPPER) + S('M29.6 80L70.4 80', COPPER) + Bt(53, 77.5, 1.2, 'silver') + Bt(33, 77.5, 0.9, 'silver') + Bt(67, 77.5, 0.9, 'silver') +
        Fl('M76.5 77L86.4 75.2L87 78C87.5 80.5 86.5 82 84.5 82.5L80 83.5C78 84 76.5 83 76 81Z', lo, 0.6) + S('M76.6 77.6L86.4 75.8', COPPER) +
        Fl('M23.5 77L13.6 75.2L13 78C12.5 80.5 13.5 82 15.5 82.5L20 83.5C22 84 23.5 83 24 81Z', lo, 0.6) + S('M23.4 77.6L13.6 75.8', COPPER),
        '', Fl('M43 8.5L37.5 17.5L47 21.5L50 12Z', 'url(#gv)', 1, line) + Fl('M57 8.5L62.5 17.5L53 21.5L50 12Z', 'url(#gv)', 1, line) + S('M42.6 10L38.7 16.8L46.5 20', COPPER) + S('M57.4 10L61.3 16.8L53.5 20', COPPER));
      break;
    }
    case 'leatherjacket': {
      const d = body(82);
      s = garment(d, '',
        upperFolds() + Fl('M44 8.5L33 16L37 30L50.5 25Z', 'url(#gv)', 1, line) + Fl('M56 8.5L67 16L63 31L53 35Z', 'url(#gv)', 1, line) + Bt(36, 18, 0.9, 'silver') + Bt(64, 18, 0.9, 'silver') +
        Ln('M52 13L57.5 82', '#9EA2A9', 1.5) + Ln('M52 13L57.5 82', '#E4E6EA', 0.6, 0.9, 'butt') + Fl('M55.2 46L57.2 45.8L57.6 51L55.6 51.2Z', 'url(#silver)') +
        Ln('M33 50L41 58', '#9EA2A9', 1.1) + Ln('M61 58L67 50', '#9EA2A9', 1.1) + Ln('M64 26L68 22', '#9EA2A9', 1) +
        Fl('M29.6 74L70.4 74L70.5 80L29.5 80Z', lo, 0.85, line) + Fl('M31 73.5L35.5 73.5L35.5 80.5L31 80.5Z', 'none', 1, '#B8BCC3') + Bt(78, 22, 0.9, 'silver') + Bt(22, 22, 0.9, 'silver') +
        H('M36 34C38.5 46 38.5 58 36 70', 0.3, 2.2) + H('M64 38C62 50 62.5 60 64.5 70', 0.18, 1.6) + H('M75.5 32L81.5 66', 0.32, 1.8) + H('M24.5 32L18.5 66', 0.2, 1.4) +
        F('M78 70L86 69', 0.35, 1) + F('M77.5 73L86.4 71.5', 0.35, 1) + F('M22 70L14 69', 0.35, 1) + F('M22.5 73L13.6 71.5', 0.35, 1));
      break;
    }
    case 'trench':
      s = garment(COAT, 'gab',
        upperFolds() + Fl('M44 6.5L50 46L56 6.5C54 9 46 9 44 6.5Z', deep, 0.4) +
        Fl('M44 6.5L35 12L38.5 22L34 26L50 46Z', 'url(#gv)', 1, line) + Fl('M56 6.5L65 12L61.5 22L66 26L50 46Z', 'url(#gv)', 1, line) +
        Fl('M55 12L67 14L66.5 31L56 29Z', lo, 0.45, line) + S('M56 13.5L66 15.2L65.6 29.5L56.8 27.8') +
        [44, 58, 72].map(y => Bt(42, y, 1.5) + Bt(58, y, 1.5)).join('') +
        Fl('M28.4 51L71.6 51L72 57L28 57Z', lo, 0.9, line) + S('M28.6 52L71.6 52') + S('M28.4 56L71.8 56') +
        Fl('M46 50L54 50L54 58L46 58Z', 'none', 1, '#8a6a4f') + Fl('M33 56L37 56L35 70L32 69Z', lo, 0.9, line) +
        F('M36 60C34 74 33 86 33 96') + F('M64 60C66 74 67 86 67 96') + S('M25.5 93L74.5 93') + Ln('M50 46C50 62 50 80 50.4 98', line, 0.6) +
        Fl('M77 73.5L86.3 71.8L86.6 74.5L77.4 76.2Z', lo, 0.9, line) + Fl('M23 73.5L13.7 71.8L13.4 74.5L22.6 76.2Z', lo, 0.9, line),
        '', Fl('M37 9.5L45 7.5L45.5 10.5L37.5 12.5Z', lo, 1, line) + Fl('M63 9.5L55 7.5L54.5 10.5L62.5 12.5Z', lo, 1, line) + Bt(44, 9, 0.7) + Bt(56, 9, 0.7));
      break;
    case 'coat':
      s = garment(COAT, 'grain',
        upperFolds() + Fl('M44 6.5L50 46L56 6.5C54 9 46 9 44 6.5Z', deep, 0.4) +
        Fl('M44 6.5L36 11.5L38.5 21L34.5 24.5L50 46Z', 'url(#gv)', 1, line) + Fl('M56 6.5L64 11.5L61.5 21L65.5 24.5L50 46Z', 'url(#gv)', 1, line) +
        Ln('M50 46C50.2 62 50.4 80 50.6 98', line, 0.7) + [52, 66, 80].map(y => Bt(52.5, y, 1.7)).join('') +
        Fl('M31.5 68L44 67L44 71.5L31.5 72.5Z', lo, 0.8, line) + Fl('M56 67L68.5 68L68.5 72.5L56 71.5Z', lo, 0.8, line) +
        F('M36 54C34 70 33 84 32 96') + F('M64 54C66 70 67 84 68 96') + S('M25.5 94L74.5 94') + S('M76.6 75L86.5 73.5') + S('M23.4 75L13.5 73.5'));
      break;
    case 'puffer':
      s = garment(PUFF, '',
        [18, 29, 40, 51, 62, 73].map(y => F(`M10 ${y}C30 ${y + 3} 70 ${y + 3} 90 ${y}`, 0.34, 1.2) + H(`M10 ${y + 3.6}C30 ${y + 6.6} 70 ${y + 6.6} 90 ${y + 3.6}`, hiOp * 0.9, 2.2)).join('') +
        Ln('M50 10L50 87', '#9EA2A9', 1.4) + Ln('M50 10L50 87', '#E4E6EA', 0.5, 0.9, 'butt') + Fl('M48.9 30L51.1 30L51.3 36L48.7 36Z', 'url(#silver)') +
        Ln('M34 50L37 62', deep, 1, 0.5) + Ln('M66 50L63 62', deep, 1, 0.5) +
        Fl('M76.2 72.5L86.6 70.8L87 76C87.5 78.5 86.5 80 84.5 80.5L80 81.5C78 82 76.5 81 76 79Z', deep, 0.45) + Fl('M23.8 72.5L13.4 70.8L13 76C12.5 78.5 13.5 80 15.5 80.5L20 81.5C22 82 23.5 81 24 79Z', deep, 0.45),
        '', Fl('M39 1.5C44 -0.5 56 -0.5 61 1.5L62 12C56 14.5 44 14.5 38 12Z', 'url(#gv)', 1, line) + F('M39 7C46 9 54 9 61 7', 0.3, 1) + Ln('M50 1L50 13', '#9EA2A9', 1.3));
      break;
    case 'jeans':
      s = garment(PANTS, 'tw',
        Fl('M30 6L70 6L70.25 12.5L29.75 12.5Z', lo, 0.7) + S('M30 7.2L70 7.2', COPPER) + S('M29.8 11.6L70.2 11.6', COPPER) +
        [33, 44, 56, 67].map(x => Fl(`M${x - 1} 5.6L${x + 1} 5.6L${x + 1} 13.4L${x - 1} 13.4Z`, hi, 0.9, line)).join('') +
        Ln('M30.6 12.5C33 20 38 22.5 43.5 22.5', line, 0.7) + S('M30.8 14.5C33.3 21 38 23.8 43.8 24', COPPER) +
        Ln('M69.4 12.5C67 20 62 22.5 56.5 22.5', line, 0.7) + S('M69.2 14.5C66.7 21 62 23.8 56.2 24', COPPER) +
        S('M59.5 13.5L65.5 13.5L65.5 18.5L59.5 18.5', COPPER) + S('M50.6 12.5L50.6 29C50.6 32.5 47 33.5 45.2 30.5L45.2 13', COPPER) +
        Bt(43.5, 22.5, 0.75, 'gold') + Bt(56.5, 22.5, 0.75, 'gold') +
        S('M29.2 26L26.8 92', COPPER, 0.6) + S('M70.8 26L73.2 92', COPPER, 0.6) + S('M48.4 40L45.6 93', COPPER, 0.5) + S('M52.6 40L54.4 93', COPPER, 0.5) +
        S('M26.6 92.6L45.4 92.6', COPPER) + S('M54.6 92.6L73.4 92.6', COPPER) +
        H('M33 26L41 27', hiOp * 1.1, 1.3) + H('M33.5 29L40 30.5', hiOp, 1) + H('M59 27L67 26', hiOp * 1.1, 1.3) + H('M60 30.5L66.5 29', hiOp, 1) +
        H('M34 58L42 57', hiOp * 0.9, 1.1) + H('M58 57L66 58', hiOp * 0.9, 1.1) + H('M36 38L35 80', hiOp * 0.6, 3) + H('M64 38L65 80', hiOp * 0.5, 3) +
        F('M50.5 30L48 40', 0.3) + F('M28 84C33 82.5 39 82.5 45 84', foldOp * 0.7) + F('M55 84C61 82.5 67 82.5 73 84', foldOp * 0.7),
        '', Bt(50, 9.3, 1.3, 'silver'));
      break;
    case 'trousers':
      s = garment(PANTS, 'grain',
        Fl('M30 6L70 6L70.25 12L29.75 12Z', lo, 0.6) + S('M29.9 11.3L70.1 11.3') +
        Ln('M31 12L36.5 27', line, 0.7) + Ln('M69 12L63.5 27', line, 0.7) + S('M50.6 12L50.6 30') +
        H('M38.5 13L36 95', hiOp * 1.1, 1.1) + H('M61.5 13L64 95', hiOp * 1.1, 1.1) + F('M39.5 13L37 95', foldOp * 0.5, 0.8) + F('M60.5 13L63 95', foldOp * 0.5, 0.8) +
        F('M50.5 30L48 40', 0.3) + F('M27 89C32 87.5 39 87.5 45 89', foldOp * 0.6) + F('M55 89C61 87.5 68 87.5 73 89', foldOp * 0.6),
        '', Bt(50, 9, 1.1, 'horn') + Fl('M50 6L56 6L56 12L50 12Z', lo, 0.5, line));
      break;
    case 'wide':
      s = garment(WIDE, 'grain',
        Fl('M30 6L70 6L70.4 12L29.6 12Z', lo, 0.6) + S('M29.7 11.3L70.3 11.3') +
        F('M40 12L38 34', foldOp, 1.2) + F('M60 12L62 34', foldOp, 1.2) + F('M45 12L44 26', foldOp * 0.7, 1) + F('M55 12L56 26', foldOp * 0.7, 1) +
        H('M39 13L32 95', hiOp, 1.4) + H('M61 13L68 95', hiOp, 1.4) +
        F('M35 44C33 62 29 80 26 95', foldOp * 0.6) + F('M65 44C67 62 71 80 74 95', foldOp * 0.6) + F('M46 46C45 64 44 82 44 95', foldOp * 0.4) + F('M54 46C55 64 56 82 56 95', foldOp * 0.4) +
        Ln('M31 12L35.5 25', line, 0.7) + Ln('M69 12L64.5 25', line, 0.7) + F('M50.3 30L47.5 42', 0.3),
        '', Bt(50, 9, 1.1, 'horn'));
      break;
    case 'skirt': {
      let pleats = '';
      for (let i = 0; i < 8; i++) {
        const x1 = 33 + i * 4.25, x2 = 17 + i * 8.25, x3 = 33 + (i + 1) * 4.25, x4 = 17 + (i + 1) * 8.25;
        pleats += Fl(`M${x1} 18L${x3} 18L${x4} 92L${x2} 92Z`, i % 2 ? deep : '#fff', i % 2 ? 0.14 : (dark ? 0.06 : 0.14));
        if (i) pleats += Ln(`M${x1} 18L${x2} 92`, deep, 0.6, 0.35);
      }
      s = garment(SKIRT, 'grain', pleats + Fl('M33 12L67 12L67.5 18.5L32.5 18.5Z', lo, 0.9) + S('M32.8 17.6L67.2 17.6') + S('M18 87.5C39 90.5 61 90.5 82 87.5'), '', Bt(64, 15, 0.9, 'horn'));
      break;
    }
    case 'shorts':
      s = `<g transform="translate(50 47) scale(1.32) translate(-50 -43)">` + garment(SHORTS, isDenim ? 'tw' : 'grain',
        Fl('M28 20L72 20L72.3 26.5L27.7 26.5Z', lo, 0.7) + S('M27.9 25.7L72.1 25.7') +
        Ln('M28.6 26.5C31 33 36 35.5 41 35.5', line, 0.7) + Ln('M71.4 26.5C69 33 64 35.5 59 35.5', line, 0.7) + S('M50.6 26.5L50.6 40') +
        Fl('M24.6 58.5L46.9 60.8L46.1 64.8C46 65.8 45 66.6 44 66.5L26 64.7C24.7 64.5 23.8 63.5 24 62Z', lo, 0.55) +
        Fl('M75.4 58.5L53.1 60.8L53.9 64.8C54 65.8 55 66.6 56 66.5L74 64.7C75.3 64.5 76.2 63.5 76 62Z', lo, 0.55) +
        H('M33 38L31 56', hiOp * 0.8, 2.4) + H('M67 38L69 56', hiOp * 0.6, 2.4) + F('M50.3 40L48 48', 0.3),
        '', Bt(50, 23.2, 1.1, isDenim ? 'silver' : 'horn')) + '</g>';
      break;
    case 'dress':
      s = garment(DRESS, '',
        Ln('M38 40C46 42.5 54 42.5 62 40', lo, 1.3) + F('M44 20L45 34', foldOp * 0.8, 1) + F('M56 20L55 34', foldOp * 0.8, 1) +
        F('M44 46L35 95', foldOp * 0.8) + F('M50 47L49.5 97', foldOp * 0.5) + F('M56 46L65 95', foldOp * 0.8) + F('M40 48L27 94', foldOp * 0.5) + F('M60 48L73 94', foldOp * 0.5) +
        H('M42 12C44 22 44 30 42 37', hiOp * 1.2, 2.2) + H('M47 48L41 94', hiOp * 0.9, 2.4) + H('M58 52L62 90', hiOp * 0.5, 1.8) +
        S('M20.5 92C40 95 60 95 79.5 92'),
        '', Ln('M43 4C45 10 55 10 57 4', lo, 1.6));
      break;
    case 'sneakers': {
      const up = 'M8 62C8 50 14 43 22 42L34 43C38 44 41 47 44 50L56 56C66 59 76 61 85 63C91 64.5 94 67 94 70.5L94 73L8 73Z';
      s = garment(up, '',
        Fl('M74 60.5C82 61.8 89 63.3 92 66.5C93.5 68 94 69.3 94 70.5L94 73L77 73C77 68 76 64 74 60.5Z', lo, 0.35) + S('M75.5 61.5C77 65 78 69 78 72.5') +
        [[80, 66], [83, 66.5], [86, 67], [81.5, 69], [84.5, 69.5], [87.5, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".45" fill="${deep}" fill-opacity=".45"/>`).join('') +
        Fl('M8 62C8 54 10 49 14 46L20 51.5C18 57 17 64 18 73L8 73Z', lo, 0.4) + S('M19 52.5C17.6 58 16.8 65 17.4 72.5') +
        Ln('M28 67C38 60.5 52 58.5 66 62.5', hi, 3.4, 0.85) + Ln('M28 67C38 60.5 52 58.5 66 62.5', line, 0.5, 0.4) +
        H('M40 50C50 55 62 59 76 61.5', hiOp, 1.4) + F('M24 46C26 52 26 60 24 68', foldOp * 0.6),
        Fl('M30 43C31.5 37.5 36 35.5 41 37.5L43.5 47Z', 'url(#gv)', 1, line),
        [[35.5, 46.5], [39.5, 49], [43.5, 51.5], [47.5, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".95" fill="${deep}" stroke="${line}" stroke-width=".3"/>`).join('') +
        Ln('M35.5 46.5L43.5 51.5M39.5 49L47.5 54M35.5 48.5L39.5 49M43.5 53L47.5 54', light ? '#E6E1D9' : '#F5F2EC', 1.1) +
        Fl('M6.5 72.5L95.5 72.5C96 72.5 96.5 73 96.5 73.5L96.5 77C96.5 79 95 80.5 93 80.5L10 80.5C8 80.5 6.5 79 6.5 77Z', '#F7F5F0', 1, '#C2BAAE') +
        Ln('M8 76.5L95 76.5', '#D9D2C8', 0.6) + Fl('M7.5 79.2L95.5 79.2L95 80.5L8 80.5Z', '#CFC6B9') + Fl('M8 50L5.2 48.2L5.2 56.5L8 57.5Z', lo, 1, line));
      break;
    }
    case 'loafers': {
      // penny loafer, side view: high rounded toe box, moc-toe apron seam, saddle strap, stacked heel
      const up = 'M8 72C8 63 13 57 21 56C29 55.5 37 58 45 59C58 60.5 72 61.5 82 64C90 66 94 70 94 75L94 78L9 78C8.4 76 8 74 8 72Z';
      s = garment(up, '',
        Fl('M8 72C8 65 10 60 14 58L18 66C17 70 17 74 18 78L9 78C8.4 76 8 74 8 72Z', lo, 0.4) +
        Fl('M13 61C18 58 28 58 40 60.5C34 63 22 63.5 13 61Z', deep, 0.65) +
        Ln('M48 61.6C60 62.2 70 64.2 76 68C80.5 71 80.5 74.5 78.5 77', line, 0.8, 0.8) + S('M47 63.2C59 63.8 68.5 65.6 74.4 69.3C78.4 71.9 78.6 74.6 77 77') +
        Fl('M41 62.6C50 63.1 58 64 64.5 65.5L63 69.7C56.3 68.5 49.3 67.8 41.6 67.3Z', 'url(#gv)', 1, line) + Fl('M49.5 64.6L56.8 65.3L56.5 66.9L49.3 66.3Z', deep, 0.85) +
        H('M56 61.6C70 62.6 82 65.2 89.5 69.5', 0.5, 1.7) + H('M80 70C84 71 88 72.5 91 75', 0.35, 1.2) + H('M20 59C26 59 31 60 35 61', 0.3, 1),
        '', Fl('M7.5 78L94.5 78L94.3 81C94.2 82.2 93.3 83 92 83L10 83C8.6 83 7.5 82 7.5 80.5Z', '#3A2A20') + Ln('M10 80.4L92 80.4', '#7A5E4A', 0.5, 0.9) +
        Fl('M8 83L24 83L24 86.6L9.6 86.6C8.7 86.6 8 85.9 8 85Z', '#271B14') + Ln('M8.4 84.8L24 84.8', '#4A372A', 0.5));
      break;
    }
    case 'boots': {
      const up = 'M22 10L50 10C51 10 52 11 52 12L53 52C62 54 74 56.5 84 59.5C90 61.3 93 64.5 93 68.5L93 75L20 75L20 14C20 12 21 10 22 10Z';
      s = garment(up, light ? 'grain' : '',
        Fl('M20 10L52 10L52 15.5L20 15.5Z', lo, 0.9) + Fl('M20 55C24 58 26 66 25 75L20 75Z', lo, 0.45) + S('M25.6 56C27 63 27 69 26.4 74.5') +
        S('M58 55.5C70 57 82 60 89.5 64.5') + Ln('M46 16L47 52', deep, 0.8, 0.5) + H('M60 58C70 59.5 80 62 88 66.5', hiOp, 1.4) + H('M27 20L28 50', hiOp * 0.8, 2) +
        F('M28 54C34 56 40 56 46 54', foldOp, 1.1) + F('M28 50C34 52 40 52 46 50', foldOp * 0.6, 1),
        Fl('M22 10L18.5 4L23 3.5L25.5 10Z', lo, 1, line),
        [18, 24, 30, 36, 42, 48].map(y => `<circle cx="50.2" cy="${y}" r="1" fill="url(#gold)"/><circle cx="45.8" cy="${y}" r="1" fill="url(#gold)"/>`).join('') +
        [18, 24, 30, 36, 42].map(y => Ln(`M45.8 ${y}L50.2 ${y + 6}M50.2 ${y}L45.8 ${y + 6}`, '#E9DCC6', 0.9)).join('') +
        Fl('M18.5 75L94.5 75L94.5 80C94.5 81.5 93.5 82.5 92 82.5L21 82.5C19.5 82.5 18.5 81.5 18.5 80Z', '#2B2420') + Ln('M20 77.5L93 77.5', '#C9A77F', 0.5, 0.7) +
        [24, 32, 40, 48, 56, 64, 72, 80, 88].map(x => Fl(`M${x} 82.5L${x + 4} 82.5L${x + 4} 85L${x} 85Z`, '#2B2420')).join(''));
      break;
    }
    case 'heels': {
      // pointed pump, side view: raised heel seat, arch curving to the ground, stiletto
      const up = 'M14 70C13 62 14 55 18 52C22 53 25 57 28 61C36 70 50 74 64 74C74 74 82 72 89 72C94 72 97 75.5 96 80C95 84.5 91 87 85 87L60 87C46 86 30 79 20 74C17 72.5 15 71.5 14 70Z';
      s = garment(up, '',
        Fl('M18.5 53C22 55 26 60 30 64C38 70.5 50 73 62 73.6C50 75.2 36 72.2 27 66.2C23 63.2 20 58.5 18.5 53Z', deep, 0.5) +
        Ln('M19.5 53.8C23 57 26 61 30 64.6C38 70.8 50 73.2 62 73.6', '#fff', 0.7, dark ? 0.15 : 0.35) +
        H('M66 76.5C74 76 83 75.2 90.5 76', 0.55, 1.8) + H('M22 62C25 66 29 69.5 34 72', 0.3, 1.2) + F('M60 85C70 85.6 80 85.6 88 85', 0.3, 1.2),
        Fl('M14 70L21.5 73.5L19.8 94L17.4 94Z', 'url(#gh)', 1, line),
        Fl('M17.2 92.4L19.9 92.4L19.8 95.6L17.3 95.6Z', '#1E1A17') + Ln('M20.5 74.6C32 80.2 46 86 60 87L85 87', deep, 1, 0.85) +
        `<ellipse cx="72" cy="88.5" rx="20" ry="1.4" fill="#000" fill-opacity=".12"/>`);
      break;
    }
    case 'sandals': {
      // flat leather sandal: contoured footbed, wide toe strap, ankle strap with gold buckle
      const strap = 'M50 69C51 58 59 51 69 51C79 51 86 58 87 68L80 68C79 62 75 58 69 58C63 58 58 62 57 69Z';
      const strap2 = 'M36 69C37 61 43 56.5 50 57L51.5 61.5C46.5 61.5 43 64.5 42.5 69Z';
      s = Fl('M8 77L94 75.5L94 78C94 81 90 83.5 85 83.5L16 84C11 84 8 81.5 8 79Z', '#8E6440', 1, '#6E4C30') +
        Ln('M12 81.5L90 80.6', '#6E4C30', 0.6, 0.8) +
        Fl('M8 74C8 70 11 68 16 68L82 66.5C89 66.3 94 69 94 72.5C94 76 90 78 84 78L16 79C11 79 8 77 8 74Z', '#E8DCC8', 1, '#BFAE96') +
        H('M18 70.5L80 69', 0.5, 1.2) + garment(strap2, 'grain', H('M40 64C42 61 45 59.5 48 59.2', hiOp, 1)) +
        garment(strap, 'grain', S('M53 68.6C54.4 60.4 61 54.5 69 54.5C77 54.5 82.6 60 83.6 67.6') + H('M58 58C62 54.5 66 53.5 71 53.6', hiOp, 1.4)) +
        Ln('M18 69C17 55 25 47 33 49C37 50 39 53 40 57', hex, 4.4) + Ln('M18 69C17 55 25 47 33 49C37 50 39 53 40 57', line, 0.5, 0.7) +
        `<rect x="31" y="46.2" width="6" height="5.6" rx="1" fill="none" stroke="url(#gold)" stroke-width="1.5"/>` + Ln('M34 46.6L34 51.4', '#C9A24A', 0.8);
      break;
    }
    case 'handbag': {
      const bd = 'M16 44C16 42 17.5 41 19.5 41L80.5 41C82.5 41 84 42 84 44L87 86C87.2 88.3 85.6 90 83.3 90L16.7 90C14.4 90 12.8 88.3 13 86Z';
      s = Ln('M33 41C33 22 39 15 50 15C61 15 67 22 67 41', lo, 4.6) + Ln('M33.2 40C33.2 23 39.2 16.5 50 16.5C60.8 16.5 66.8 23 66.8 40', hi, 1.1, 0.7) +
        garment(bd, 'grain',
          Fl('M16 44C16 42 17.5 41 19.5 41L80.5 41C82.5 41 84 42 84 44L82 62C81.8 64 80 65 78 65L22 65C20 65 18.2 64 18 62Z', 'url(#gv)', 1, line) +
          S('M19.5 61.8L80.5 61.8') + S('M15.5 87L84.5 87') + S('M16.5 46L14.6 85') + S('M83.5 46L85.4 85') + H('M22 45L78 45', 0.35, 1.2) + F('M18 66C40 68 60 68 82 66', 0.3, 1.2),
          '', Fl('M45.5 61L54.5 61L54.5 69C54.5 70 53.7 70.8 52.7 70.8L47.3 70.8C46.3 70.8 45.5 70 45.5 69Z', 'url(#gold)', 1, '#8A6A2A') +
          `<circle cx="33" cy="41" r="2.3" fill="none" stroke="url(#gold)" stroke-width="1.3"/><circle cx="67" cy="41" r="2.3" fill="none" stroke="url(#gold)" stroke-width="1.3"/>` +
          `<circle cx="22" cy="91" r="1.3" fill="url(#gold)"/><circle cx="78" cy="91" r="1.3" fill="url(#gold)"/>`);
      break;
    }
    case 'tote': {
      const bd = 'M18 34L82 34L86 92C86.2 93.5 85 94.5 83.5 94.5L16.5 94.5C15 94.5 13.8 93.5 14 92Z';
      s = Ln('M30 35C30 12 40 10 42 10C46 10 48 18 48 35', lo, 3.2) + Ln('M52 35C52 18 54 10 58 10C60 10 70 12 70 35', lo, 3.2) +
        garment(bd, 'grain', Fl('M18 34L82 34L82.4 40.5L17.6 40.5Z', hi, 0.45) + S('M17.7 39.6L82.3 39.6') +
          F('M30 44C32 60 31 76 28 92', foldOp * 0.7) + F('M70 44C68 60 69 76 72 92', foldOp * 0.7) + H('M24 46L22 88', hiOp * 0.8, 2) + S('M15 91L85 91'),
          '', Fl('M28.5 34L31.5 34L31.5 41L28.5 41Z', lo) + Fl('M46.5 34L49.5 34L49.5 41L46.5 41Z', lo) + Fl('M50.5 34L53.5 34L53.5 41L50.5 41Z', lo) + Fl('M68.5 34L71.5 34L71.5 41L68.5 41Z', lo));
      break;
    }
    case 'backpack': {
      const bd = 'M24 26C24 14 34 8 50 8C66 8 76 14 76 26L78 90C78 92.5 76 94 73.5 94L26.5 94C24 94 22 92.5 22 90Z';
      s = Ln('M42 9C42 2 58 2 58 9', lo, 2.6) +
        garment(bd, 'grain',
          Ln('M26 30C30 18 40 14 50 14C60 14 70 18 74 30', deep, 1.2, 0.6) + Ln('M26 30C30 18 40 14 50 14C60 14 70 18 74 30', '#C5C8CE', 0.6, 0.9) +
          Fl('M30 56C30 54 31.5 53 33.5 53L66.5 53C68.5 53 70 54 70 56L70 84C70 86 68.5 87 66.5 87L33.5 87C31.5 87 30 86 30 84Z', lo, 0.45, line) + S('M31.5 55L68.5 55L68.5 85L31.5 85Z') +
          Ln('M33 58.5L67 58.5', deep, 1, 0.6) + H('M29 30L27 80', hiOp * 0.8, 2.4) + F('M24 40C26 56 26 72 24 88', foldOp * 0.6) + F('M76 40C74 56 74 72 76 88', foldOp * 0.6),
          '', Fl('M61 57L63 57L63.5 63L60.5 63Z', 'url(#silver)') + Fl('M70.5 27L72.5 27L73 33L70 33Z', 'url(#silver)'));
      break;
    }
    case 'sunglasses':
      s = Ln('M8.5 38L2.5 35.5', hex, 2.2) + Ln('M91.5 38L97.5 35.5', hex, 2.2) +
        Fl('M8 38C8 36 9.5 35 11.5 35L42 35C44 35 45.5 36.5 45 38.5L43 52C42 58 37 62 30 62L24 62C16 62 10 57 9 50Z', 'url(#lens)') +
        Fl('M92 38C92 36 90.5 35 88.5 35L58 35C56 35 54.5 36.5 55 38.5L57 52C58 58 63 62 70 62L76 62C84 62 90 57 91 50Z', 'url(#lens)') +
        Ln('M8 38C8 36 9.5 35 11.5 35L42 35C44 35 45.5 36.5 45 38.5L43 52C42 58 37 62 30 62L24 62C16 62 10 57 9 50Z', hex, 2.4) +
        Ln('M92 38C92 36 90.5 35 88.5 35L58 35C56 35 54.5 36.5 55 38.5L57 52C58 58 63 62 70 62L76 62C84 62 90 57 91 50Z', hex, 2.4) +
        Ln('M45 39.5C47 36 53 36 55 39.5', hex, 2.6) + H('M14 40L24 40', 0.55, 1.6) + H('M15 44L19 44', 0.35, 1.2) + H('M62 40L72 40', 0.55, 1.6) + H('M63 44L67 44', 0.35, 1.2) +
        H('M12 36.3L40 36.3', dark ? 0.25 : 0.4, 0.7) + H('M60 36.3L88 36.3', dark ? 0.25 : 0.4, 0.7);
      break;
    case 'jewelry': {
      const metal = L > 0.55 && rgb(hex)[2] > rgb(hex)[0] - 10 ? 'silver' : 'gold';
      s = Ln('M20 12C26 40 38 56 50 58C62 56 74 40 80 12', deep, 2.2, 0.5) + Ln('M20 12C26 40 38 56 50 58C62 56 74 40 80 12', hex, 1.8, 1, 'round').replace('stroke-linejoin', 'stroke-dasharray="1.6 .7" stroke-linejoin') +
        H('M21 13C27 40 38.5 55 50 57', 0.5, 0.6) +
        `<ellipse cx="50" cy="60" rx="1.6" ry="2.6" fill="none" stroke="url(#${metal})" stroke-width="1"/>` +
        `<path d="M50 62L57 70L50 80L43 70Z" fill="url(#${metal})" stroke="${line}" stroke-width=".4"/><path d="M50 65L54 70L50 76L46 70Z" fill="url(#pearl)"/>` + H('M47 68L49 66', 0.9, 0.8);
      break;
    }
    case 'scarf': {
      // knitted scarf as it hangs: neck loop (horseshoe) + two tails of different length, the front one crossing
      const loop = 'M20 20C20 7 80 7 80 20C80 28 73 33 64 34L60 26C64 25 68 23 68 20C68 14 32 14 32 20C32 23 36 25 40 26L36 34C27 33 20 28 20 20Z';
      const back = 'M36 30L52 31.5L47 92L29 90Z';
      const front = 'M50 30C56 31 62 31 67 29L71 80L53 82Z';
      const fringe = (x0, y0, x1, y1) => Array.from({ length: 9 }, (_, i) => Ln(`M${x0 + (x1 - x0) * i / 8} ${y0 + (y1 - y0) * i / 8}L${x0 + (x1 - x0) * i / 8 - 0.4} ${y0 + (y1 - y0) * i / 8 + 7}`, lo, 1.1)).join('');
      const band = (d) => Fl(d, lo, 0.85);
      s = garment(back, 'rib', band('M30.6 78L47.9 79.6L47.6 83.4L30.2 81.8Z') + band('M31 72L48.3 73.5L48.1 75.6L30.8 74.1Z') + F('M44 34L40 88', foldOp, 1.4) + H('M34 36L31.5 86', hiOp, 2)) +
        fringe(29.6, 90.4, 46.6, 92) +
        garment(loop, 'rib', F('M24 22C30 29 40 32 50 32C60 32 70 29 76 22', foldOp, 1.8) + H('M26 14C34 10 46 9 52 9.4', hiOp, 2.2)) +
        garment(front, 'rib', band('M52.6 70L70.3 68.4L70.6 72.2L52.9 73.8Z') + band('M52.2 64.4L70 62.9L70.1 65L52.4 66.5Z') + F('M56 34L58 80', foldOp * 0.8, 1.4) + H('M64 34L68 78', hiOp, 2) +
          `<path d="M50 30C56 31 62 31 67 29L67.5 35C62 37 56 37 50.5 36Z" fill="${deep}" fill-opacity=".28"/>`) +
        fringe(53.4, 81.8, 70.6, 80.2);
      break;
      break;
    }
    case 'cap': {
      const cr = 'M16 60C16 38 31 24 50 24C69 24 84 38 84 60Z';
      s = garment(cr, 'grain', S('M50 25L50 60') + S('M50 25C40 34 36 46 35 60') + S('M50 25C60 34 64 46 65 60') + Fl('M16 57.5L84 57.5L84 61L16 61Z', deep, 0.2) +
        H('M28 40C34 32 42 28 48 27', hiOp, 2) + `<circle cx="41" cy="39" r=".9" fill="${deep}"/><circle cx="59" cy="39" r=".9" fill="${deep}"/>`,
        '', Fl('M47.5 23.6C47.5 22.3 52.5 22.3 52.5 23.6L52 25L48 25Z', lo) +
        Fl('M10 60C30 57 70 57 96 62C97.5 62.5 97.5 65 96 66C80 70 40 70 12 66C9 65.5 8.5 61 10 60Z', 'url(#gv)', 1, line) + S('M14 63.5C40 66.5 76 66 93.5 64') + S('M18 65.5C42 68 74 67.6 90 66'));
      break;
    }
    default:
      s = garment('M20 20L80 20L80 80L20 80Z', 'grain');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -3 104 104">${defs}${s}</svg>`;
}
