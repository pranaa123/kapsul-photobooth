import "./dashboard.css";
import Link from "next/link";
import {BarChart3,Images,LogOut,MessageCircle,QrCode,Settings} from "lucide-react";
import {Brand} from "@/components/ui/brand";
import {EmptyDashboard} from "@/features/dashboard/empty-dashboard";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {EventQrCard} from "@/features/dashboard/event-qr-card";
import {EventSwitcher} from "@/features/dashboard/event-switcher";
import {headers} from "next/headers";

export default async function DashboardPage({searchParams}:{searchParams:Promise<{event?:string}>}){
  const supabase=await createClient();
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"kapsul-photobooth.vercel.app";
  const protocol=requestHeaders.get("x-forwarded-proto")??(host.includes("localhost")?"http":"https");
  const baseUrl=`${protocol}://${host}`;
  const selectedParams=await searchParams;
  const{data:{user}}=await supabase.auth.getUser();
  const[{data:profile},{data:events}]=await Promise.all([
    supabase.from("profiles").select("full_name").eq("id",user!.id).maybeSingle(),
    supabase.from("events").select("id,name,status,starts_at,photo_count,max_photos,device_count,max_devices,slug,public_token").eq("status","active").order("created_at",{ascending:false})
  ]);
  const fullName=profile?.full_name||user?.user_metadata?.full_name||"Pemilik Acara";
  const firstName=fullName.split(" ")[0];
  const event=events?.find(item=>item.id===selectedParams.event)??events?.[0];
  let gallery:{id:string;url:string;createdAt:string}[]=[];
  let messages:{id:string;guest_name:string|null;message:string;created_at:string}[]=[];
  let messageTotal=0;

  if(event){
    const[{data:photos},{data:guestMessages,count:guestMessageCount}]=await Promise.all([
      supabase.rpc("get_random_owner_photos",{p_event_id:event.id,p_limit:6}),
      supabase.from("guest_messages").select("id,guest_name,message,created_at",{count:"exact"}).eq("event_id",event.id).order("created_at",{ascending:false}).limit(8)
    ]);
    const photoRows=(photos??[]) as {id:string;storage_path:string;created_at:string}[];
    const storageClient=process.env.SUPABASE_SECRET_KEY?createAdminClient():supabase;
    const bucket=storageClient.storage.from(process.env.SUPABASE_STORAGE_BUCKET??"event-photos");
    const signed=await Promise.all(photoRows.map(photo=>bucket.createSignedUrl(photo.storage_path,3600)));
    gallery=photoRows.map((photo,index)=>({id:photo.id,url:signed[index]?.data?.signedUrl??"",createdAt:photo.created_at})).filter(photo=>photo.url);
    messages=guestMessages??[];
    messageTotal=guestMessageCount??messages.length;
  }
  const photoTrack=gallery.length?Array.from({length:Math.max(8,gallery.length)},(_,index)=>gallery[index%gallery.length]):[];
  const messageTrack=messages.length?Array.from({length:Math.max(5,messages.length)},(_,index)=>messages[index%messages.length]):[];

  return <main className="dash">
    <aside className="sidebar">
      <Link href="/"><Brand light/></Link>
      <nav><a className="active" href="#ringkasan"><BarChart3/>Ringkasan</a><a href="#galeri"><Images/>Galeri privat</a><a href="#qr"><QrCode/>QR & tautan</a><a><Settings/>Pengaturan</a></nav>
      <div className="side-bottom"><span>{fullName.slice(0,2).toUpperCase()}</span><div><b>{fullName}</b><small>{user?.email}</small></div><LogOut/></div>
    </aside>
    <section className="dash-main">
      <header className="dash-head"><div><span className="dash-kicker">PILIH ACARA AKTIF</span>{event?<EventSwitcher events={events??[]} selectedId={event.id}/>:<strong>Tidak ada acara aktif</strong>}</div><div><Link href="/create-event">Buat acara baru</Link></div></header>
      {!event?<EmptyDashboard name={firstName}/>:<>
        <div className="status-row" id="ringkasan"><span className="status"><i/>{event.status}</span><span>{event.starts_at?new Date(event.starts_at).toLocaleDateString("id-ID",{dateStyle:"long"}):"Jadwal belum diatur"}</span></div>
        <div className="dash-title"><div><span className="dash-kicker">SELAMAT DATANG KEMBALI, {firstName.toUpperCase()}</span><h1>MOMENMU<br/>SEDANG <em>TUMBUH.</em></h1></div></div>
        <div className="metrics">
          <article><div><Images/><span>FOTO TERKUMPUL</span></div><strong>{event.photo_count}<small> / {event.max_photos.toLocaleString("id-ID")}</small></strong><div className="progress"><i style={{width:`${event.photo_count/event.max_photos*100}%`}}/></div></article>
          <article><div><QrCode/><span>PERANGKAT</span></div><strong>{event.device_count}<small> / {event.max_devices}</small></strong><div className="progress"><i style={{width:`${event.device_count/event.max_devices*100}%`}}/></div></article>
          <article><div><MessageCircle/><span>UCAPAN MASUK</span></div><strong>{messageTotal}</strong><p>Ucapan privat dari para tamu.</p></article>
          <EventQrCard slug={event.slug} token={event.public_token} baseUrl={baseUrl}/>
        </div>
        <section className="private-gallery" id="galeri">
          <div className="gallery-head"><div><span className="dash-kicker">GALERI PRIVAT</span><h2>MOMEN TERBARU</h2></div><Link className="see-all" href={`/dashboard/gallery?event=${event.id}`}>Lihat semua · {event.photo_count}</Link></div>
          {gallery.length?<div className="photo-marquee"><div>{[...photoTrack,...photoTrack].map((photo,index)=><figure key={`${photo.id}-${index}`}><img src={photo.url} alt={`Foto tamu ${(index%gallery.length)+1}`}/></figure>)}</div></div>:<p className="gallery-empty">Foto tamu akan tampil di sini setelah berhasil dikirim.</p>}
        </section>
        <section className="guest-wishes">
          <div className="gallery-head"><div><span className="dash-kicker">UCAPAN TAMU</span><h2>PESAN UNTUKMU</h2></div><Link className="see-all" href={`/dashboard/messages?event=${event.id}`}>Lihat semua · {messageTotal}</Link></div>
          {messages.length?<div className="wish-marquee"><div>{[...messageTrack,...messageTrack].map((item,index)=><article key={`${item.id}-${index}`}><MessageCircle/><p>“{item.message}”</p><div><b>{item.guest_name||"Tamu anonim"}</b><span>{new Date(item.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</span></div></article>)}</div></div>:<p className="gallery-empty">Belum ada ucapan yang masuk.</p>}
        </section>
      </>}
    </section>
  </main>;
}
