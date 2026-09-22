export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Seller = {
  id: string;
  name: string;
  slug: string;
  website: string;
  logo_url: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
};

export type Price = {
  id: string;
  product_id: string;
  seller_id: string;
  price: number;
  in_stock: boolean;
  product_url: string;
  source: "admin" | "scraper" | "user_submitted";
  status: "verified" | "user_submitted" | "needs_verification";
  recorded_at: string;
  seller?: Seller;
};

export type ProductWithPrices = Product & {
  prices: Price[];
};
