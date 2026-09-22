// Categories are just canned broad queries run through the same live
// search/scrape pipeline — there's no product taxonomy in a database to
// browse, so "category wise" here means "pre-filled search for a broad
// term in that category".
export const CATEGORIES = [
  { label: "Phones", query: "mobile phone" },
  { label: "Laptops", query: "laptop" },
  { label: "TVs", query: "smart tv" },
  { label: "Watches", query: "smartwatch" },
  { label: "Audio", query: "earbuds" },
  { label: "Power banks", query: "power bank" },
  { label: "Tablets", query: "tablet" },
  { label: "Cameras", query: "camera" },
] as const;
