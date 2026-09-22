"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdmin, setAdminCookie, clearAdminCookie } from "@/lib/admin-auth";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?error=1");
  }
  await setAdminCookie(password);
  redirect("/admin");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function createSeller(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  if (!name || !website) return;

  const supabase = createServiceClient();
  await supabase.from("sellers").insert({
    name,
    slug: slugify(name),
    website,
  });
  revalidatePath("/admin");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const category_id = String(formData.get("category_id") ?? "") || null;
  if (!name) return;

  const supabase = createServiceClient();
  await supabase.from("products").insert({
    name,
    slug: slugify(name),
    brand: brand || null,
    category_id,
  });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function addPrice(formData: FormData) {
  await requireAdmin();
  const product_id = String(formData.get("product_id") ?? "");
  const seller_id = String(formData.get("seller_id") ?? "");
  const price = Number(formData.get("price"));
  const product_url = String(formData.get("product_url") ?? "").trim();
  const in_stock = formData.get("in_stock") === "on";
  if (!product_id || !seller_id || !price || !product_url) return;

  const supabase = createServiceClient();
  const { data: product } = await supabase
    .from("products")
    .select("slug")
    .eq("id", product_id)
    .single();

  await supabase.from("prices").insert({
    product_id,
    seller_id,
    price,
    product_url,
    in_stock,
    source: "admin",
    status: "verified",
  });
  revalidatePath("/admin");
  revalidatePath("/");
  if (product?.slug) revalidatePath(`/product/${product.slug}`);
}
