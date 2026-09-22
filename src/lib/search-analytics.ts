import { createServiceClient } from "@/lib/supabase/server";

export async function logSearchQuery(query: string, resultCount: number) {
  const supabase = createServiceClient();
  await supabase.from("search_queries").insert({ query, result_count: resultCount });
}
