import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: packages, error } = await supabase
      .from("packages")
      .select("id,name")
      .order("price");

    if (error) {
      return NextResponse.json({ connected: false, error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      connected: true,
      service: "supabase",
      database: true,
      packages: packages?.map((item) => item.name) ?? []
    });
  } catch {
    return NextResponse.json(
      { connected: false, error: "Supabase configuration is unavailable." },
      { status: 503 }
    );
  }
}
