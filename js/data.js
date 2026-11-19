import { garmentSVG } from './garments.js';
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

// Illustrations live in garments.js
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
