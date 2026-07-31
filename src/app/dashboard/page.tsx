import "./dashboard.css";
import Link from "next/link";
import {BarChart3,Images,LogOut,MessageCircle,QrCode,Settings} from "lucide-react";
import {Brand} from "@/components/ui/brand";
import {EmptyDashboard} from "@/features/dashboard/empty-dashboard";
import {createClient} from "@/lib/supabase/server";
import {EventQrCard} from "@/features/dashboard/event-qr-card";

export default async function DashboardPage(){
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  const[{data:profile},{data:events}]=await Promise.all([
    supabase.from("profiles").select("full_name").eq("id",user!.id).maybeSingle(),
    supabase.from("events").select("id,name,status,starts_at,photo_count,max_photos,device_count,max_devices,slug,public_token").order("created_at",{ascending:false}).limit(1)
  ]);
  const fullName=profile?.full_name||user?.user_metadata?.full_name||"Pemilik Acara";
  const firstName=fullName.split(" ")[0];
  const event=events?.[0];
  let gallery:{id:string;url:string;createdAt:string}[]=[];
  let messages:{id:string;guest_name:string|null;message:string;created_at:string}[]=[];

  if(event){
    const[{data:photos},{data:guestMessages}]=await Promise.all([
      supabase.from("photos").select("id,storage_path,created_at").eq("event_id",event.id).eq("status","uploaded").order("created_at",{ascending:false}).limit(12),
      supabase.from("guest_messages").select("id,guest_name,message,created_at").eq("event_id",event.id).order("created_at",{ascending:false}).limit(8)
    ]);
    const paths=photos?.map(photo=>photo.storage_path)??[];
    const signed=paths.length?await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET??"event-photos").createSignedUrls(paths,3600):null;
    gallery=(photos??[]).map((photo,index)=>({id:photo.id,url:signed?.data?.[index]?.signedUrl??"",createdAt:photo.created_at})).filter(photo=>photo.url);
    messages=guestMessages??[];
  }

  return <main className="dash">
    <aside className="sidebar">
      <Link href="/"><Brand light/></Link>
      <nav><a className="active" href="#ringkasan"><BarChart3/>Ringkasan</a><a href="#galeri"><Images/>Galeri privat</a><a href="#qr"><QrCode/>QR & tautan</a><a><Settings/>Pengaturan</a></nav>
      <div className="side-bottom"><span>{fullName.slice(0,2).toUpperCase()}</span><div><b>{fullName}</b><small>{user?.email}</small></div><LogOut/></div>
    </aside>
    <section className="dash-main">
      <header className="dash-head"><div><span className="dash-kicker">DASHBOARD PEMILIK</span><button>{event?.name??"Belum ada acara"}</button></div><div><Link href="/create-event">Buat acara baru</Link></div></header>
      {!event?<EmptyDashboard name={firstName}/>:<>
        <div className="status-row" id="ringkasan"><span className="status"><i/>{event.status}</span><span>{event.starts_at?new Date(event.starts_at).toLocaleDateString("id-ID",{dateStyle:"long"}):"Jadwal belum diatur"}</span></div>
        <div className="dash-title"><div><span className="dash-kicker">SELAMAT DATANG KEMBALI, {firstName.toUpperCase()}</span><h1>MOMENMU<br/>SEDANG <em>TUMBUH.</em></h1></div></div>
        <div className="metrics">
          <article><div><Images/><span>FOTO TERKUMPUL</span></div><strong>{event.photo_count}<small> / {event.max_photos.toLocaleString("id-ID")}</small></strong><div className="progress"><i style={{width:`${event.photo_count/event.max_photos*100}%`}}/></div></article>
          <article><div><QrCode/><span>PERANGKAT</span></div><strong>{event.device_count}<small> / {event.max_devices}</small></strong><div className="progress"><i style={{width:`${event.device_count/event.max_devices*100}%`}}/></div></article>
          <article><div><MessageCircle/><span>UCAPAN MASUK</span></div><strong>{messages.length}</strong><p>Ucapan privat dari para tamu.</p></article>
        </div>
        <section className="private-gallery" id="galeri">
          <div className="gallery-head"><div><span className="dash-kicker">GALERI PRIVAT</span><h2>MOMEN TERBARU</h2></div><span>{event.photo_count} FOTO</span></div>
          {gallery.length?<div className="owner-photo-grid">{gallery.map((photo,index)=><figure key={photo.id}><img src={photo.url} alt={`Foto tamu ${index+1}`}/><figcaption>#{String(event.photo_count-index).padStart(3,"0")} · {new Date(photo.createdAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</figcaption></figure>)}</div>:<p className="gallery-empty">Foto tamu akan tampil di sini setelah berhasil dikirim.</p>}
        </section>
        <section className="guest-wishes">
          <div className="gallery-head"><div><span className="dash-kicker">UCAPAN TAMU</span><h2>PESAN UNTUKMU</h2></div></div>
          {messages.length?<div className="wish-list">{messages.map(item=><article key={item.id}><MessageCircle/><p>“{item.message}”</p><div><b>{item.guest_name||"Tamu anonim"}</b><span>{new Date(item.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</span></div></article>)}</div>:<p className="gallery-empty">Belum ada ucapan yang masuk.</p>}
        </section>
        <div id="qr"><EventQrCard slug={event.slug} token={event.public_token}/></div>
      </>}
    </section>
  </main>;
}
