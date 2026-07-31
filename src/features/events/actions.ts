"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export async function createEventOrder(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/create-event");

  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "12:00");
  const packageId = String(formData.get("packageId") ?? "");
  const startsAt = new Date(`${date}T${time}:00+08:00`);
  if (!name || !date || !packageId || Number.isNaN(startsAt.valueOf())) redirect("/create-event?error=invalid");

  const slug = `${slugify(name)}-${crypto.randomUUID().slice(0,5)}`;
  const { data, error } = await supabase.rpc("create_event_order", {
    p_package_id: packageId,
    p_name: name,
    p_slug: slug,
    p_event_type: String(formData.get("eventType") ?? "Lainnya"),
    p_location: String(formData.get("location") ?? "").trim(),
    p_estimated_guests: Number(formData.get("estimatedGuests") ?? 1),
    p_starts_at: startsAt.toISOString()
  });

  if (error || !data?.[0]) redirect(`/create-event?error=${encodeURIComponent(error?.message ?? "unknown")}`);
  redirect(`/checkout/${data[0].order_id}`);
}
