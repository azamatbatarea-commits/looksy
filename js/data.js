// Garment catalogue, colour palette and illustrated demo items.

// cat: top | layer | bottom | dress | shoes | bag | acc
// warm: warmth points, form: formality 1 (casual) … 5 (formal)
export const TYPES = {
  tshirt:        { cat: 'top',    warm: 1,   form: 1.5, ru: 'Футболка',        en: 'T-shirt' },
  longsleeve:    { cat: 'top',    warm: 2,   form: 2,   ru: 'Лонгслив',        en: 'Longsleeve' },
  shirt:         { cat: 'top',    warm: 1.5, form: 3.5, ru: 'Рубашка',         en: 'Shirt' },
  blouse:        { cat: 'top',    warm: 1.2, form: 3.5, ru: 'Блузка',          en: 'Blouse' },
  sweater:       { cat: 'top',    warm: 3,   form: 2.5, ru: 'Свитер',          en: 'Sweater' },
  hoodie:        { cat: 'top',    warm: 3,   form: 1,   ru: 'Худи',            en: 'Hoodie' },
  cardigan:      { cat: 'layer',  warm: 2,   form: 2.5, ru: 'Кардиган',        en: 'Cardigan' },
  blazer:        { cat: 'layer',  warm: 2,   form: 4.5, ru: 'Пиджак',          en: 'Blazer' },
  denimjacket:   { cat: 'layer',  warm: 2.5, form: 1.5, ru: 'Джинсовая куртка', en: 'Denim jacket' },
  leatherjacket: { cat: 'layer',  warm: 3,   form: 2.5, ru: 'Кожаная куртка',  en: 'Leather jacket' },
  trench:        { cat: 'layer',  warm: 3,   form: 3.5, ru: 'Тренч',           en: 'Trench coat' },
  coat:          { cat: 'layer',  warm: 4.5, form: 4,   ru: 'Пальто',          en: 'Coat' },
  puffer:        { cat: 'layer',  warm: 6,   form: 1.5, ru: 'Пуховик',         en: 'Puffer' },
  jeans:         { cat: 'bottom', warm: 1.5, form: 2,   ru: 'Джинсы',          en: 'Jeans' },
  trousers:      { cat: 'bottom', warm: 1.2, form: 4,   ru: 'Брюки',           en: 'Trousers' },
  wide:          { cat: 'bottom', warm: 1.2, form: 3.2, ru: 'Широкие брюки',   en: 'Wide-leg trousers' },
  skirt:         { cat: 'bottom', warm: 0.5, form: 3,   ru: 'Юбка',            en: 'Skirt' },
  shorts:        { cat: 'bottom', warm: 0,   form: 1,   ru: 'Шорты',           en: 'Shorts' },
  dress:         { cat: 'dress',  warm: 1,   form: 3.5, ru: 'Платье',          en: 'Dress' },
  sneakers:      { cat: 'shoes',  warm: 0.5, form: 1.5, ru: 'Кроссовки',       en: 'Sneakers' },
  loafers:       { cat: 'shoes',  warm: 0.5, form: 3.5, ru: 'Лоферы',          en: 'Loafers' },
  boots:         { cat: 'shoes',  warm: 1.5, form: 3,   ru: 'Ботинки',         en: 'Boots' },
  heels:         { cat: 'shoes',  warm: 0.3, form: 4.5, ru: 'Туфли',           en: 'Heels' },
  sandals:       { cat: 'shoes',  warm: 0,   form: 1.5, ru: 'Сандалии',        en: 'Sandals' },
  handbag:       { cat: 'bag',    warm: 0,   form: 3.5, ru: 'Сумка',           en: 'Handbag' },
  tote:          { cat: 'bag',    warm: 0,   form: 2.5, ru: 'Шопер',           en: 'Tote' },
  backpack:      { cat: 'bag',    warm: 0,   form: 1.5, ru: 'Рюкзак',          en: 'Backpack' },
  sunglasses:    { cat: 'acc',    warm: 0,   form: 2.5, ru: 'Очки',            en: 'Sunglasses' },
  jewelry:       { cat: 'acc',    warm: 0,   form: 3,   ru: 'Украшение',       en: 'Jewelry' },
  scarf:         { cat: 'acc',    warm: 1,   form: 3,   ru: 'Шарф',            en: 'Scarf' },
  cap:           { cat: 'acc',    warm: 0,   form: 1,   ru: 'Кепка',           en: 'Cap' },
};

export const CATS = ['top', 'layer', 'bottom', 'dress', 'shoes', 'bag', 'acc'];

export const COLORS = [
  { k: 'black',    hex: '#1F1F1F', n: 1, ru: 'чёрный',     en: 'black' },
  { k: 'white',    hex: '#F4F3EF', n: 1, ru: 'белый',      en: 'white' },
  { k: 'grey',     hex: '#9C9A97', n: 1, ru: 'серый',      en: 'grey' },
  { k: 'cream',    hex: '#EDE3D2', n: 1, ru: 'молочный',   en: 'cream' },
  { k: 'beige',    hex: '#D6BF9F', n: 1, ru: 'бежевый',    en: 'beige' },
  { k: 'camel',    hex: '#B88A5A', n: 1, ru: 'кэмел',      en: 'camel' },
  { k: 'brown',    hex: '#6E4B33', n: 1, ru: 'коричневый', en: 'brown' },
  { k: 'navy',     hex: '#1F2C4C', n: 1, ru: 'тёмно-синий', en: 'navy' },
  { k: 'denim',    hex: '#5B7BA6', n: 1, ru: 'деним',      en: 'denim' },
  { k: 'gold',     hex: '#C9A24A', n: 1, ru: 'золотой',    en: 'gold' },
  { k: 'olive',    hex: '#6F6E45', n: 0, ru: 'оливковый',  en: 'olive' },
  { k: 'sage',     hex: '#9FB295', n: 0, ru: 'шалфейный',  en: 'sage' },
  { k: 'green',    hex: '#3F6E50', n: 0, ru: 'зелёный',    en: 'green' },
  { k: 'lightblue',hex: '#A9C4E2', n: 0, ru: 'голубой',    en: 'light blue' },
  { k: 'blue',     hex: '#3C67B0', n: 0, ru: 'синий',      en: 'blue' },
  { k: 'purple',   hex: '#76589A', n: 0, ru: 'фиолетовый', en: 'purple' },
  { k: 'pink',     hex: '#E7B3BC', n: 0, ru: 'розовый',    en: 'pink' },
  { k: 'red',      hex: '#B4363A', n: 0, ru: 'красный',    en: 'red' },
  { k: 'burgundy', hex: '#6B2132', n: 0, ru: 'бордовый',   en: 'burgundy' },
  { k: 'orange',   hex: '#D97636', n: 0, ru: 'оранжевый',  en: 'orange' },
  { k: 'yellow',   hex: '#E2BF4C', n: 0, ru: 'жёлтый',     en: 'yellow' },
];
export const colorByKey = k => COLORS.find(c => c.k === k) || COLORS[0];

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
export function nearestColor(rgb) {
  let best = COLORS[0], bd = Infinity;
  for (const c of COLORS) {
    const [r, g, b] = hexToRgb(c.hex);
    const rm = (rgb[0] + r) / 2;
    const d = (2 + rm / 256) * (rgb[0] - r) ** 2 + 4 * (rgb[1] - g) ** 2 + (2 + (255 - rm) / 256) * (rgb[2] - b) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---------- illustrated garments (used for the demo wardrobe) ----------
const LONG = 'M33 12 L42 9 Q50 15 58 9 L67 12 Q77 15 80 30 L88 82 L79 84 L71 42 L71 92 L29 92 L29 42 L21 84 L12 82 L20 30 Q23 15 33 12 Z';
const COAT = 'M33 10 L42 7 Q50 13 58 7 L67 10 Q77 13 80 28 L88 80 L79 82 L72 40 L74 98 L26 98 L28 40 L21 82 L12 80 L20 28 Q23 13 33 10 Z';
const PANTS = 'M30 6 L70 6 L74 96 L55 96 L50 36 L45 96 L26 96 Z';

export function garmentSVG(type, hex) {
  const d = shade(hex, -0.28), l = shade(hex, 0.25);
  const light = rgbToHsl(hexToRgb(hex))[2] > 0.85;
  const st = light ? '#C9C3BA' : d;
  const P = (p, fill = hex, extra = '') => `<path d="${p}" fill="${fill}" stroke="${st}" stroke-width="1.2" stroke-linejoin="round" ${extra}/>`;
  const L = (p, c = st, w = 1.2) => `<path d="${p}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const C = (x, y, r, c = st) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  let s = '';
  switch (type) {
    case 'tshirt': s = P('M32 14 L42 10 Q50 17 58 10 L68 14 L86 28 L77 38 L70 33 L70 90 L30 90 L30 33 L23 38 L14 28 Z') + L('M42 10 Q50 17 58 10'); break;
    case 'longsleeve': s = P(LONG) + L('M42 9 Q50 15 58 9'); break;
    case 'sweater': s = P(LONG) + L('M42 9 Q50 16 58 9', st, 2.5) + L('M29 86 L71 86') + L('M79 78 L88 76') + L('M12 76 L21 78'); break;
    case 'hoodie': s = P('M38 13 Q35 0 50 0 Q65 0 62 13 Z', d) + P(LONG) + L('M36 64 L64 64 L67 80 L33 80 Z') + L('M46 14 L45 30') + L('M54 14 L55 30'); break;
    case 'shirt': s = P(LONG) + P('M42 9 L46 19 L50 13 L54 19 L58 9 L50 12 Z', l) + L('M50 14 L50 92') + [26, 40, 54, 68, 82].map(y => C(51.5, y, 1.1)).join(''); break;
    case 'blouse': s = P(LONG) + L('M42 9 Q50 24 58 9') + L('M29 50 Q50 54 71 50'); break;
    case 'cardigan': s = P(LONG) + L('M42 9 L50 40 L58 9') + L('M50 40 L50 92') + [50, 62, 74, 86].map(y => C(52, y, 1.3)).join('') + L('M29 86 L71 86'); break;
    case 'blazer': s = P(LONG.replace('L71 92 L29 92', 'L71 94 L29 94')) + P('M42 9 L50 46 L44 30 L37 14 Z', d) + P('M58 9 L50 46 L56 30 L63 14 Z', d) + L('M33 72 L44 72') + L('M56 72 L67 72') + C(50, 58, 1.6); break;
    case 'denimjacket': s = P(LONG.replace('L71 92 L29 92', 'L71 80 L29 80')) + P('M40 9 L50 20 L60 9 L56 7 L50 13 L44 7 Z', d) + L('M50 20 L50 80') + L('M34 34 L46 34 L46 46 L34 46 Z') + L('M54 34 L66 34 L66 46 L54 46 Z') + L('M29 72 L71 72', l, 1.5); break;
    case 'leatherjacket': s = P(LONG.replace('L71 92 L29 92', 'L71 82 L29 82')) + P('M42 9 L36 26 L46 22 Z', d) + P('M58 9 L64 26 L54 22 Z', d) + L('M46 12 L56 82', '#B9B4AC', 1.6) + L('M30 76 L70 76'); break;
    case 'trench': s = P(COAT) + P('M42 7 L50 40 L44 26 L36 12 Z', d) + P('M58 7 L50 40 L56 26 L64 12 Z', d) + L('M28 54 L72 54', d, 3) + [44, 62, 76].map(y => C(42, y, 1.4) + C(58, y, 1.4)).join(''); break;
    case 'coat': s = P(COAT) + P('M42 7 L50 44 L44 28 L36 12 Z', d) + P('M58 7 L50 44 L56 28 L64 12 Z', d) + L('M50 44 L50 98') + [56, 72].map(y => C(53, y, 1.6)).join('') + L('M32 70 L42 70') + L('M58 70 L68 70'); break;
    case 'puffer': s = P(COAT.replace(/L74 98 L26 98/, 'L73 86 L27 86')) + [24, 38, 52, 66, 78].map(y => L(`M28 ${y} L72 ${y}`)).join('') + L('M50 10 L50 86', '#B9B4AC', 1.4) + P('M40 6 Q50 0 60 6 L60 12 L40 12 Z', d); break;
    case 'jeans': s = P(PANTS) + L('M30 13 L70 13') + L('M50 13 L50 30') + L('M33 13 Q36 22 43 22', '#D8A65A') + L('M67 13 Q64 22 57 22', '#D8A65A') + L('M45 96 L50 36 L55 96', '#D8A65A', .8); break;
    case 'trousers': s = P(PANTS) + L('M30 13 L70 13') + L('M38 20 L36 96') + L('M62 20 L64 96'); break;
    case 'wide': s = P('M30 6 L70 6 L82 96 L54 96 L50 38 L46 96 L18 96 Z') + L('M30 13 L70 13') + L('M38 20 L32 96') + L('M62 20 L68 96'); break;
    case 'skirt': s = P('M33 12 L67 12 L82 88 Q50 96 18 88 Z') + L('M33 19 L67 19') + L('M42 20 L36 90') + L('M50 20 L50 92') + L('M58 20 L64 90'); break;
    case 'shorts': s = P('M28 22 L72 22 L76 66 L54 68 L50 44 L46 68 L24 66 Z') + L('M28 29 L72 29'); break;
    case 'dress': s = P('M38 4 L44 4 Q50 12 56 4 L62 4 L64 24 Q60 32 62 40 L80 94 Q50 100 20 94 L38 40 Q40 32 36 24 Z') + L('M38 40 L62 40', d, 2); break;
    case 'sneakers': s = P('M8 60 Q10 42 26 42 L40 46 Q52 52 64 56 L86 60 Q94 62 94 70 L94 74 L8 74 Z') + P('M8 74 L94 74 L94 80 Q50 84 8 80 Z', '#F2EFEA') + L('M32 47 L38 53') + L('M39 49 L45 55') + L('M46 51 L52 57') + L('M8 66 L30 66', d); break;
    case 'loafers': s = P('M8 66 Q10 52 24 52 L50 56 Q70 58 86 62 Q94 64 94 72 L94 76 L8 76 Z') + P('M8 76 L94 76 L94 81 L8 81 Z', d) + L('M44 57 Q54 66 64 59', '#C9A24A', 1.6); break;
    case 'boots': s = P('M22 8 L50 8 L52 54 L80 60 Q92 62 92 74 L92 80 L20 80 Z') + P('M20 80 L92 80 L92 87 L20 87 Z', d) + L('M50 12 L50 50') + L('M22 16 L50 16'); break;
    case 'heels': s = P('M10 70 Q14 54 30 56 L60 64 Q78 66 90 58 L92 62 Q86 74 72 76 L30 78 Z') + P('M14 72 L21 72 L23 93 L18 93 Z', d); break;
    case 'sandals': s = P('M8 72 Q8 66 16 66 L88 66 Q94 66 94 72 Q94 78 88 78 L16 78 Q8 78 8 72 Z', '#E5DCCF') + L('M30 66 Q40 46 52 66', hex, 5) + L('M58 66 Q66 52 76 66', hex, 5); break;
    case 'handbag': s = L('M33 42 Q33 14 50 14 Q67 14 67 42', d, 4) + P('M18 42 L82 42 L86 90 L14 90 Z') + P('M18 42 L82 42 L78 62 L22 62 Z', d) + C(50, 62, 3, '#C9A24A'); break;
    case 'tote': s = L('M30 36 Q30 10 42 10 Q50 10 50 36', d, 3) + L('M50 36 Q50 10 58 10 Q70 10 70 36', d, 3) + P('M20 36 L80 36 L84 92 L16 92 Z'); break;
    case 'backpack': s = P('M24 24 Q24 8 50 8 Q76 8 76 24 L78 92 L22 92 Z') + L('M32 58 L68 58 L68 84 L32 84 Z') + L('M42 8 Q50 0 58 8', d, 3); break;
    case 'sunglasses': s = P('M8 40 L44 40 Q44 62 28 62 Q10 62 8 40 Z') + P('M56 40 L92 40 Q90 62 72 62 Q56 62 56 40 Z') + L('M44 44 Q50 38 56 44', d, 2.5); break;
    case 'jewelry': s = L('M22 16 Q50 74 78 16', hex, 2.5) + C(50, 58, 6, hex) + C(50, 58, 2.5, l); break;
    case 'scarf': s = P('M24 14 L76 14 L76 30 L24 30 Z') + P('M56 30 L70 30 L72 92 L58 92 Z') + L('M58 92 L58 96 M63 92 L63 96 M68 92 L68 96', d); break;
    case 'cap': s = P('M18 60 Q18 26 50 26 Q82 26 82 60 Z') + P('M14 60 L94 60 Q96 70 84 70 L14 66 Z', d) + C(50, 26, 2.5, d); break;
    default: s = P('M20 20 L80 20 L80 80 L20 80 Z');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${s}</svg>`;
}
export const svgURL = (type, hex) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(garmentSVG(type, hex));

// [type, colorKey, brand, made in]
export const DEMO_WARDROBE = [
  ['trench', 'beige', 'Mango', 'Turkey'], ['blazer', 'black', 'Zara', 'Spain'], ['cardigan', 'grey', 'Uniqlo', 'Vietnam'],
  ['denimjacket', 'denim', "Levi's", 'Bangladesh'], ['puffer', 'black', 'Local brand', 'Uzbekistan'],
  ['tshirt', 'white', 'H&M', 'Uzbekistan'], ['tshirt', 'black', 'H&M', 'Uzbekistan'], ['sweater', 'cream', 'Massimo Dutti', 'Turkey'],
  ['shirt', 'lightblue', 'Zara', 'Morocco'], ['blouse', 'white', 'Mango', 'Turkey'], ['longsleeve', 'navy', 'Uniqlo', 'China'],
  ['hoodie', 'grey', 'Nike', 'Vietnam'], ['sweater', 'sage', 'Local brand', 'Uzbekistan'],
  ['jeans', 'denim', "Levi's", 'Turkey'], ['trousers', 'black', 'Zara', 'Turkey'], ['wide', 'cream', 'Mango', 'Turkey'],
  ['skirt', 'beige', 'Koton', 'Turkey'], ['dress', 'black', 'Zara', 'Turkey'],
  ['sneakers', 'white', 'Adidas', 'Vietnam'], ['loafers', 'black', 'Local brand', 'Uzbekistan'], ['boots', 'brown', 'Timberland', 'China'],
  ['heels', 'beige', 'Mango', 'Spain'], ['handbag', 'black', 'Local brand', 'Uzbekistan'], ['tote', 'camel', 'Zara', 'India'],
  ['sunglasses', 'black', 'Ray-Ban', 'Italy'], ['jewelry', 'gold', 'Local brand', 'Uzbekistan'],
];

// ---------- partner brands (fictional demo brands for the pitch) ----------
export const BRANDS = {
  oydin: { name: 'Oydin Atelier', tag: { ru: 'ателье, Ташкент', en: 'atelier, Tashkent' } },
  sayr:  { name: 'Sayr Basics',   tag: { ru: 'базовый гардероб', en: 'everyday basics' } },
  lumo:  { name: 'Lumo Studio',   tag: { ru: 'обувь и аксессуары', en: 'shoes & accessories' } },
  kok:   { name: 'Kök Denim',     tag: { ru: 'деним, Фергана', en: 'denim, Fergana' } },
};
// [id, brand, type, color, price UZS]
export const PRODUCTS = [
  ['p1', 'lumo', 'sneakers', 'white', 420000], ['p2', 'oydin', 'trench', 'beige', 890000], ['p3', 'lumo', 'puffer', 'black', 1150000],
  ['p4', 'oydin', 'blazer', 'black', 760000], ['p5', 'lumo', 'loafers', 'black', 520000], ['p6', 'sayr', 'trousers', 'black', 380000],
  ['p7', 'sayr', 'tshirt', 'white', 120000], ['p8', 'lumo', 'handbag', 'black', 640000], ['p9', 'kok', 'jeans', 'denim', 450000],
  ['p10', 'sayr', 'cardigan', 'cream', 410000], ['p11', 'oydin', 'sweater', 'sage', 480000], ['p12', 'kok', 'denimjacket', 'denim', 590000],
  ['p13', 'sayr', 'shirt', 'white', 290000], ['p14', 'oydin', 'skirt', 'black', 360000], ['p15', 'oydin', 'coat', 'camel', 1290000],
  ['p16', 'sayr', 'sweater', 'burgundy', 460000], ['p17', 'lumo', 'boots', 'black', 780000], ['p18', 'oydin', 'blouse', 'pink', 340000],
  ['p19', 'sayr', 'wide', 'beige', 420000], ['p20', 'lumo', 'tote', 'cream', 330000],
].map(([id, brand, type, color, price]) => ({ id, brand, type, color, price }));

// ---------- demo friends ----------
export const FRIENDS = [
  { id: 'f1', ru: 'Малика', en: 'Malika', hue: '#E7B3BC', likes: 14,
    w: [['blouse', 'white'], ['sweater', 'pink'], ['wide', 'beige'], ['skirt', 'black'], ['dress', 'burgundy'], ['trench', 'beige'], ['heels', 'black'], ['loafers', 'brown'], ['handbag', 'burgundy'], ['jewelry', 'gold']] },
  { id: 'f2', ru: 'Тимур', en: 'Timur', hue: '#A9C4E2', likes: 9,
    w: [['tshirt', 'white'], ['hoodie', 'black'], ['shirt', 'lightblue'], ['jeans', 'denim'], ['trousers', 'grey'], ['leatherjacket', 'black'], ['sneakers', 'white'], ['boots', 'brown'], ['backpack', 'black'], ['cap', 'navy']] },
  { id: 'f3', ru: 'Дильноза', en: 'Dilnoza', hue: '#9FB295', likes: 21,
    w: [['longsleeve', 'cream'], ['sweater', 'sage'], ['blouse', 'lightblue'], ['jeans', 'denim'], ['skirt', 'beige'], ['cardigan', 'grey'], ['coat', 'camel'], ['sneakers', 'white'], ['loafers', 'black'], ['tote', 'camel'], ['sunglasses', 'black']] },
];
export const EXTRA_FRIEND_NAMES = [['Камила', 'Kamila'], ['Жасур', 'Jasur'], ['Нигора', 'Nigora'], ['Санжар', 'Sanjar'], ['Мадина', 'Madina'], ['Бобур', 'Bobur']];

// ImageNet class keyword -> garment type (used by the on-device neural network)
export const IMAGENET_MAP = [
  ['jersey', 'tshirt'], ['T-shirt', 'tshirt'], ['sweatshirt', 'hoodie'], ['cardigan', 'cardigan'], ['jean', 'jeans'],
  ['trench coat', 'trench'], ['fur coat', 'coat'], ['lab coat', 'coat'], ['cloak', 'coat'], ['suit', 'blazer'], ['military uniform', 'blazer'],
  ['miniskirt', 'skirt'], ['overskirt', 'skirt'], ['hoopskirt', 'dress'], ['gown', 'dress'], ['abaya', 'dress'], ['kimono', 'dress'], ['maillot', 'dress'],
  ['running shoe', 'sneakers'], ['Loafer', 'loafers'], ['clog', 'loafers'], ['cowboy boot', 'boots'], ['sandal', 'sandals'],
  ['backpack', 'backpack'], ['purse', 'handbag'], ['mailbag', 'tote'], ['sunglass', 'sunglasses'], ['necklace', 'jewelry'], ['stole', 'scarf'],
  ['pajama', 'longsleeve'], ['wool', 'sweater'], ['poncho', 'sweater'], ['sleeping bag', 'puffer'], ['bulletproof vest', 'puffer'],
  ['swimming trunks', 'shorts'], ['cowboy hat', 'cap'], ['sombrero', 'cap'],
];

export const CITIES = [
  { k: 'tashkent', ru: 'Ташкент', en: 'Tashkent', lat: 41.2995, lon: 69.2401 },
];
