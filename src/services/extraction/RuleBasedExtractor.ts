import type { Category, Currency } from '@/domain/product';

import type { ExtractedListing, ListingExtractor } from './ListingExtractor';

const NUMBER = String.raw`(\d{1,3}(?:[,.]\d{3})+|\d+(?:\.\d+)?)\s*(k|K|אלף)?`;

const CURRENCY_TOKENS: { currency: Currency; before: string[]; after: string[] }[] = [
  {
    currency: 'ILS',
    before: ['₪', 'NIS', 'ILS'],
    after: ['₪', 'ש"ח', 'ש״ח', 'שח', 'שקל', 'שקלים', 'NIS', 'ILS', 'shekels?', 'shekel'],
  },
  { currency: 'USD', before: [String.raw`\$`, 'USD'], after: [String.raw`\$`, 'USD', 'dollars?'] },
  { currency: 'EUR', before: ['€', 'EUR'], after: ['€', 'EUR', 'euros?'] },
];

// Keywords per category, English and Hebrew. Hebrew words may carry a one-letter prefix (ה, ב, ל, ...).
const CATEGORY_KEYWORDS: Record<Exclude<Category, 'Other'>, string[]> = {
  Vehicles: [
    'car',
    'auto',
    'suzuki',
    'toyota',
    'mazda',
    'hyundai',
    'kia',
    'honda',
    'skoda',
    'motorcycle',
    'scooter',
    'vespa',
    'רכב',
    'מכונית',
    'אוטו',
    'אופנוע',
    'קטנוע',
  ],
  Electronics: [
    'laptop',
    'macbook',
    'computer',
    'iphone',
    'phone',
    'samsung',
    'tv',
    'television',
    'camera',
    'headphones',
    'playstation',
    'xbox',
    'tablet',
    'ipad',
    'turntable',
    'record player',
    'מחשב',
    'טלפון',
    'פלאפון',
    'טלוויזיה',
    'מצלמה',
    'אוזניות',
    'טאבלט',
  ],
  Furniture: [
    'table',
    'chair',
    'sofa',
    'couch',
    'bed',
    'wardrobe',
    'closet',
    'desk',
    'shelf',
    'dresser',
    'שולחן',
    'כיסא',
    'כסא',
    'ספה',
    'מיטה',
    'ארון',
    'מדף',
    'שידה',
  ],
  Home: [
    'mug',
    'kitchen',
    'microwave',
    'lamp',
    'fridge',
    'refrigerator',
    'washing machine',
    'oven',
    'vacuum',
    'plates',
    'ספל',
    'מטבח',
    'מיקרוגל',
    'מנורה',
    'מקרר',
    'מכונת כביסה',
    'תנור',
    'שואב אבק',
  ],
  Fashion: [
    'shoes',
    'heels',
    'sneakers',
    'dress',
    'jacket',
    'coat',
    'shirt',
    'jeans',
    'bag',
    'handbag',
    'watch',
    'נעליים',
    'נעלי',
    'שמלה',
    'מעיל',
    'חולצה',
    "ג'ינס",
    'תיק',
    'שעון',
  ],
  Sports: [
    'bike',
    'bicycle',
    'treadmill',
    'ball',
    'dumbbells',
    'weights',
    'surfboard',
    'skis',
    'tennis',
    'אופניים',
    'הליכון',
    'כדור',
    'משקולות',
    'גלשן',
  ],
  Kids: [
    'stroller',
    'tricycle',
    'toy',
    'toys',
    'crib',
    'baby',
    'kids',
    'lego',
    'car seat',
    'עגלה',
    'עגלת',
    'תלת אופן',
    'צעצוע',
    'צעצועים',
    'עריסה',
    'תינוק',
    'ילדים',
    'לגו',
  ],
  Books: ['book', 'books', 'novel', 'textbook', 'ספר', 'ספרים', 'רומן'],
};

// The 45 largest Israeli cities: [English, ...variants, Hebrew]. The first entry is the display name.
const CITIES: string[][] = [
  ['Jerusalem', 'ירושלים'],
  ['Tel Aviv', 'Tel-Aviv', 'Tel Aviv-Yafo', 'TLV', 'תל אביב', 'תל-אביב', 'ת"א'],
  ['Haifa', 'חיפה'],
  ['Rishon LeZion', 'Rishon Lezion', 'Rishon', 'ראשון לציון', 'ראשל"צ'],
  ['Petah Tikva', 'Petah Tiqva', 'Petach Tikva', 'פתח תקווה', 'פתח תקוה', 'פ"ת'],
  ['Ashdod', 'אשדוד'],
  ['Netanya', 'נתניה'],
  ['Beersheba', "Be'er Sheva", 'Beer Sheva', 'באר שבע', 'ב"ש'],
  ['Bnei Brak', 'בני ברק'],
  ['Holon', 'חולון'],
  ['Ramat Gan', 'רמת גן'],
  ['Ashkelon', 'אשקלון'],
  ['Rehovot', 'רחובות'],
  ['Bat Yam', 'בת ים'],
  ['Beit Shemesh', 'בית שמש'],
  ['Kfar Saba', 'כפר סבא'],
  ['Herzliya', 'הרצליה'],
  ['Hadera', 'חדרה'],
  ['Modiin', "Modi'in", 'מודיעין'],
  ['Nazareth', 'נצרת'],
  ['Lod', 'לוד'],
  ['Ramla', 'רמלה'],
  ["Ra'anana", 'Raanana', 'רעננה'],
  ['Rosh HaAyin', 'Rosh Haayin', 'ראש העין'],
  ['Hod HaSharon', 'Hod Hasharon', 'הוד השרון'],
  ['Kiryat Gat', 'קריית גת'],
  ['Nahariya', 'נהריה'],
  ['Acre', 'Akko', 'עכו'],
  ['Eilat', 'אילת'],
  ['Tiberias', 'טבריה'],
  ['Givatayim', 'גבעתיים'],
  ['Kiryat Ata', 'קריית אתא'],
  ['Afula', 'עפולה'],
  ['Yavne', 'יבנה'],
  ['Or Yehuda', 'אור יהודה'],
  ['Ness Ziona', 'Nes Ziona', 'נס ציונה'],
  ['Kiryat Bialik', 'קריית ביאליק'],
  ['Kiryat Motzkin', 'קריית מוצקין'],
  ['Umm al-Fahm', 'אום אל-פחם'],
  ['Rahat', 'רהט'],
  ['Safed', 'Tzfat', 'צפת'],
  ['Dimona', 'דימונה'],
  ['Arad', 'ערד'],
  ['Kiryat Shmona', 'קריית שמונה'],
  ['Zichron Yaakov', 'Zikhron Yaakov', 'זכרון יעקב'],
];

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isHebrew = (text: string) => /[֐-׿]/.test(text);
// Word boundaries that work for Hebrew too (JS \b only knows ASCII letters).
const wordPattern = (word: string) => {
  const prefix = isHebrew(word) ? '(?:[והבלמכש])?' : '';
  return new RegExp(`(?<![\\p{L}\\d])${prefix}${escape(word)}(?![\\p{L}\\d])`, 'iu');
};
const CATEGORY_PATTERNS = Object.entries(CATEGORY_KEYWORDS).map(
  ([category, words]) => [category as Category, words.map(wordPattern)] as const,
);
const CITY_PATTERNS = CITIES.map((names) => [names[0], names.map(wordPattern)] as const);

function toNumber(raw: string, multiplier: string | undefined): number {
  // "25,000" / "25.000" are thousands; "12.5" is a decimal.
  const value = /[,.]\d{3}(?!\d)/.test(raw) ? Number(raw.replace(/[,.]/g, '')) : Number(raw);
  return multiplier ? value * 1000 : value;
}

function extractPrice(text: string): { price: number | null; currency: Currency | null } {
  for (const { currency, before, after } of CURRENCY_TOKENS) {
    const prefix = new RegExp(`(?:${before.join('|')})\\s*${NUMBER}`, 'iu').exec(text);
    if (prefix) return { price: toNumber(prefix[1], prefix[2]), currency };
    const suffix = new RegExp(`${NUMBER}\\s*(?:${after.join('|')})(?![\\p{L}])`, 'iu').exec(text);
    if (suffix) return { price: toNumber(suffix[1], suffix[2]), currency };
  }
  return { price: null, currency: null };
}

function extractCategory(text: string): Category | null {
  let best: { category: Category; hits: number } | null = null;
  for (const [category, patterns] of CATEGORY_PATTERNS) {
    const hits = patterns.filter((pattern) => pattern.test(text)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { category, hits };
  }
  return best?.category ?? null;
}

function extractLocation(text: string): string | null {
  for (const [name, patterns] of CITY_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(text))) return name;
  }
  // Fallback: "... in Some Place" (capitalised words).
  const match = /\b(?:in|at)\s+([A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)?)/u.exec(text);
  return match ? match[1] : null;
}

export class RuleBasedExtractor implements ListingExtractor {
  extract(text: string): ExtractedListing {
    const { price, currency } = extractPrice(text);
    const hashtags = text.match(/#[\p{L}\d_]+/gu) ?? [];
    return {
      price,
      currency,
      category: extractCategory(text),
      location: extractLocation(text),
      hashtag: hashtags.join(' '),
    };
  }
}
