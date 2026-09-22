// Lightweight, deterministic query understanding — regex/keyword based, NOT
// an LLM. It's here so "AI Tech Finder" does something real today (budget
// and category extraction) without pretending to be full natural-language
// AI. Swapping this for an actual LLM call later is a drop-in replacement
// as long as it returns the same shape.
export type ParsedQuery = {
  searchTerm: string;
  maxPrice: number | null;
  category: string | null;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  phone: ["phone", "smartphone", "iphone", "galaxy", "pixel"],
  laptop: ["laptop", "notebook", "macbook"],
  tv: ["tv", "television"],
  audio: ["headphone", "earbud", "earphone", "speaker"],
  "power bank": ["power bank", "powerbank"],
  tablet: ["tablet", "ipad"],
  camera: ["camera"],
  gaming: ["gaming", "console", "ps5", "playstation", "xbox"],
};

export function parseNaturalQuery(input: string): ParsedQuery {
  const raw = input.trim();
  let working = raw.toLowerCase();
  let maxPrice: number | null = null;

  // "under 200k", "under Rs. 200,000", "below 100000", "< 50k"
  const budgetMatch = working.match(
    /(?:under|below|less than|<)\s*(?:rs\.?\s*)?([\d,]+)\s*(k|thousand)?/i
  );
  if (budgetMatch) {
    const num = parseFloat(budgetMatch[1].replace(/,/g, ""));
    maxPrice = budgetMatch[2] ? num * 1000 : num;
    working = working.replace(budgetMatch[0], " ");
  }

  let category: string | null = null;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => working.includes(k))) {
      category = cat;
      break;
    }
  }

  // Strip generic filler words that don't help a seller-site search engine.
  const stripped = working
    .replace(
      /\b(i need|i want|looking for|find me|find|a|an|the|for|some|best|good|cheap|near me|in colombo|in sri lanka)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  const searchTerm = stripped.length >= 2 ? stripped : raw;

  return { searchTerm, maxPrice, category };
}
