import { scrapeCelltronics } from "./celltronics";
import { scrapeWasi } from "./wasi";
import { scrapeSimplyTek } from "./simplytek";
import type { ScrapedPrice } from "./types";

export type { ScrapedPrice };

export async function scrapeAllSellers(query: string): Promise<ScrapedPrice[]> {
  const results = await Promise.allSettled([
    scrapeCelltronics(query),
    scrapeWasi(query),
    scrapeSimplyTek(query),
  ]);

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
