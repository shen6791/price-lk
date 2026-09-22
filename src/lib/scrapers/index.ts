import { scrapeCelltronics } from "./celltronics";
import { scrapeWasi } from "./wasi";
import { scrapeSimplyTek } from "./simplytek";
import { scrapeBuyabans } from "./buyabans";
import type { ScrapedPrice } from "./types";

export type { ScrapedPrice };

export const SELLERS = ["celltronics", "wasi", "simplytek", "buyabans"] as const;

export async function scrapeAllSellers(query: string): Promise<ScrapedPrice[]> {
  const results = await Promise.allSettled([
    scrapeCelltronics(query),
    scrapeWasi(query),
    scrapeSimplyTek(query),
    scrapeBuyabans(query),
  ]);

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
