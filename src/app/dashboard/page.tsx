import "./dashboard.css";
import Link from "next/link";
import { BarChart3, Images, LogOut, QrCode, Settings } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { EmptyDashboard } from "@/features/dashboard/empty-dashboard";
import { createClient } from "@/lib/supabase/server";
import { EventQrCard } from "@/features/dashboard/event-qr-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle(),
    supabase.from("events").select("id,name,status,starts_at,photo_count,max_photos,device_count,max_devices,slug,public_token").order("created_at", { ascending: false }).limit(1)
  ]);
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Pemilik Acara";
  const firstName = fullName.split(" ")[0];
  const event = events?.[0];

  return (
    <main className="dash">
      <aside className="sidebar">
        <Link href="/"><Brand light /></Link>
        <nav><a className="active"><BarChart3 />Ringkasan</a><a><Images />Galeri privat</a><a><QrCode />QR & tautan</a><a><Settings />Pengaturan</a></nav>
        <div className="side-bottom"><span>{fullName.slice(0,2).toUpperCase()}</span><div><b>{fullName}</b><small>{user?.email}</small></div><LogOut /></div>
      </aside>
      <section className="dash-main">
        <header className="dash-head"><div><span className="dash-kicker">DASHBOARD PEMILIK</span><button>{event?.name ?? "Belum ada acara"}</button></div><div><Link href="/create-event">Buat acara baru</Link></div></header>
        {!event ? <EmptyDashboard name={firstName} /> : (
          <>
            <div className="status-row"><span className="status"><i />{event.status}</span><span>{event.starts_at ? new Date(event.starts_at).toLocaleDateString("id-ID",{dateStyle:"long"}) : "Jadwal belum diatur"}</span></div>
            <div className="dash-title"><div><span className="dash-kicker">SELAMAT DATANG KEMBALI, {firstName.toUpperCase()}</span><h1>MOMENMU<br />SEDANG <em>TUMBUH.</em></h1></div></div>
            <div className="metrics">
              <article><div><Images /><span>FOTO TERKUMPUL</span></div><strong>{event.photo_count}<small> / {event.max_photos.toLocaleString("id-ID")}</small></strong><div className="progress"><i style={{width:`${event.photo_count/event.max_photos*100}%`}} /></div></article>
              <article><div><QrCode /><span>PERANGKAT</span></div><strong>{event.device_count}<small> / {event.max_devices}</small></strong><div className="progress"><i style={{width:`${event.device_count/event.max_devices*100}%`}} /></div></article>
            </div>
            <EventQrCard slug={event.slug} token={event.public_token}/>
          </>
        )}
      </section>
    </main>
  );
}
