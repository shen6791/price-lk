"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";

export async function createAlert(formData: FormData) {
  const query = String(formData.get("query") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const targetPrice = Number(formData.get("target_price"));

  if (!query || !email || !targetPrice) {
    redirect("/price-alerts?error=1");
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("price_alerts").insert({
    query,
    email,
    target_price: targetPrice,
  });

  redirect(error ? "/price-alerts?error=1" : "/price-alerts?created=1");
}
