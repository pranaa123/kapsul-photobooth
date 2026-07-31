import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { CreateEventForm } from "@/features/events/create-event-form";
import { createClient } from "@/lib/supabase/server";
import "./create-event.css";

export const metadata={title:"Buat acara — Kapsul",robots:{index:false}};
export default async function CreateEventPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login?next=/create-event");
  const {data:packages}=await supabase.from("packages").select("id,name,price,max_devices,max_photos,max_photos_per_device,active_hours").order("price");
  return <main className="create-event"><header><Link href="/"><Brand/></Link><span>BUAT ACARA</span><Link href="/dashboard"><ArrowLeft/> Dashboard</Link></header><div className="create-title"><span>ACARA BARU</span><h1>BUAT RUANG<br/>UNTUK <em>MOMENMU.</em></h1><p>Kamu dapat meninjau semua detail sebelum melakukan pembayaran.</p></div><CreateEventForm packages={packages??[]}/></main>
}
