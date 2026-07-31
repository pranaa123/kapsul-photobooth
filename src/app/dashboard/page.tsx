import "./dashboard.css";
import Link from "next/link";
import {BarChart3,Images,LogOut,MessageCircle,QrCode,Settings} from "lucide-react";
import {Brand} from "@/components/ui/brand";
import {EmptyDashboard} from "@/features/dashboard/empty-dashboard";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {EventQrCard} from "@/features/dashboard/event-qr-card";
import {EventSwitcher} from "@/features/dashboard/event-switcher";
import {GoogleDriveCard} from "@/features/dashboard/google-drive-card";
import {DashboardNotice} from "@/features/dashboard/dashboard-notice";
import {EventCountdown} from "@/features/dashboard/event-countdown";
import {DownloadZipButton} from "@/features/dashboard/download-zip-button";
import {headers} from "next/headers";

export default async function DashboardPage({searchParams}:{searchParams:Promise<{event?:string;drive?:string}>}){
  const supabase=await createClient();
  const requestHeaders=await headers();
  const host=requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"kapsul-photobooth.vercel.app";
  const protocol=requestHeaders.get("x-forwarded-proto")??(host.includes("localhost")?"http":"https");
  const baseUrl=`${protocol}://${host}`;
  const selectedParams=await searchParams;
  const{data:{user}}=await supabase.auth.getUser();
  const[{data:profile},{data:events}]=await Promise.all([
    supabase.from("profiles").select("full_name").eq("id",user!.id).maybeSingle(),
    supabase.from("events").select("id,name,status,starts_at,upload_ends_at,photo_count,max_photos,device_count,max_devices,slug,public_token").eq("status","active").order("created_at",{ascending:false})
  ]);
  const fullName=profile?.full_name||user?.user_metadata?.full_name||"Pemilik Acara";
  const firstName=fullName.split(" ")[0];
  const event=events?.find(item=>item.id===selectedParams.event)??events?.[0];
  let gallery:{id:string;url:string;createdAt:string}[]=[];
  let messages:{id:string;guest_name:string|null;message:string;created_at:string}[]=[];
  let messageTotal=0;
  let uploadedPhotoTotal=0;
  let driveConnection:{account_email:string|null;folder_id:string;folder_name:string;status:string}|null=null;
  let driveSynced=0;
  let drivePending=0;
  let nextCleanup:string|null=null;
  let analytics={page_views:0,camera_granted:0,photo_started:0,submit_success:0};

  if(event){
    const[{data:photos},{count:uploadedCount},{data:guestMessages,count:guestMessageCount},{data:drive}]=await Promise.all([
      supabase.rpc("get_random_owner_photos",{p_event_id:event.id,p_limit:6}),
      supabase.from("photos").select("id",{count:"exact",head:true}).eq("event_id",event.id).eq("status","uploaded"),
      supabase.from("guest_messages").select("id,guest_name,message,created_at",{count:"exact"}).eq("event_id",event.id).order("created_at",{ascending:false}).limit(8),
      supabase.from("event_drive_connections").select("account_email,folder_id,folder_name,status").eq("event_id",event.id).maybeSingle()
    ]);
    const photoRows=(photos??[]) as {id:string;storage_path:string;thumbnail_path:string|null;created_at:string}[];
    const storageClient=process.env.SUPABASE_SECRET_KEY?createAdminClient():supabase;
    const bucket=storageClient.storage.from(process.env.SUPABASE_STORAGE_BUCKET??"event-photos");
    const signed=await Promise.all(photoRows.map(photo=>bucket.createSignedUrl(photo.thumbnail_path||photo.storage_path,600)));
    gallery=photoRows.map((photo,index)=>({id:photo.id,url:signed[index]?.data?.signedUrl??"",createdAt:photo.created_at})).filter(photo=>photo.url);
    uploadedPhotoTotal=uploadedCount??0;
    messages=guestMessages??[];
    messageTotal=guestMessageCount??messages.length;
    driveConnection=drive??null;
    const{data:analyticsData}=await supabase.rpc("get_owner_event_analytics",{p_event_id:event.id});
    if(analyticsData)analytics={...analytics,...analyticsData};
    if(driveConnection){
      const[{count:syncedCount},{count:pendingCount},{data:cleanupPhoto}]=await Promise.all([
        supabase.from("photos").select("id",{count:"exact",head:true}).eq("event_id",event.id).not("drive_file_id","is",null),
        supabase.from("photos").select("id",{count:"exact",head:true}).eq("event_id",event.id).eq("status","uploaded").is("drive_file_id",null),
        supabase.from("photos").select("storage_delete_after").eq("event_id",event.id).is("storage_deleted_at",null).not("storage_delete_after","is",null).order("storage_delete_after",{ascending:true}).limit(1).maybeSingle()
      ]);
      driveSynced=syncedCount??0;drivePending=pendingCount??0;
      nextCleanup=cleanupPhoto?.storage_delete_after??null;
    }
  }
  const photoTrack=gallery.length?Array.from({length:Math.max(8,gallery.length)},(_,index)=>gallery[index%gallery.length]):[];
  const messageTrack=messages.length?Array.from({length:Math.max(5,messages.length)},(_,index)=>messages[index%messages.length]):[];

  return <main className="dash">
    <aside className="sidebar">
      <Link href="/"><Brand light/></Link>
      <nav><a className="active" href="#ringkasan"><BarChart3/>Ringkasan</a><a href="#galeri"><Images/>Galeri privat</a><a href="#qr"><QrCode/>QR & tautan</a>{event?<a href={`/dashboard/settings?event=${event.id}`}><Settings/>Pengaturan</a>:<a><Settings/>Pengaturan</a>}</nav>
      <div className="side-bottom"><span>{fullName.slice(0,2).toUpperCase()}</span><div><b>{fullName}</b><small>{user?.email}</small></div><LogOut/></div>
    </aside>
    <section className="dash-main">
      <header className="dash-head"><div><span className="dash-kicker">PILIH ACARA AKTIF</span>{event?<EventSwitcher events={events??[]} selectedId={event.id}/>:<strong>Tidak ada acara aktif</strong>}</div><div>{event&&<a href={`/dashboard/settings?event=${event.id}`}><Settings/>Pengaturan acara</a>}<Link href="/create-event">Buat acara baru</Link></div></header>
      {!event?<EmptyDashboard name={firstName}/>:<>
        <div className="status-row" id="ringkasan"><span className="status"><i/>{event.status}</span><span>{event.starts_at?new Date(event.starts_at).toLocaleDateString("id-ID",{dateStyle:"long"}):"Jadwal belum diatur"}</span></div>
        <div className="dash-title"><div><span className="dash-kicker">SELAMAT DATANG KEMBALI, {firstName.toUpperCase()}</span><h1>MOMENMU<br/>SEDANG <em>TUMBUH.</em></h1></div></div>
        <div className="metrics">
          <article><div><Images/><span>FOTO TERKUMPUL</span></div><strong>{uploadedPhotoTotal}<small> / {event.max_photos.toLocaleString("id-ID")}</small></strong><div className="progress"><i style={{width:`${uploadedPhotoTotal/event.max_photos*100}%`}}/></div></article>
          <article><div><QrCode/><span>PERANGKAT</span></div><strong>{event.device_count}<small> / {event.max_devices}</small></strong><div className="progress"><i style={{width:`${event.device_count/event.max_devices*100}%`}}/></div></article>
          <article><div><MessageCircle/><span>UCAPAN MASUK</span></div><strong>{messageTotal}</strong><p>Ucapan privat dari para tamu.</p></article>
          <EventQrCard slug={event.slug} token={event.public_token} baseUrl={baseUrl}/>
        </div>
        <section className="funnel-metrics"><article><span>KUNJUNGAN HALAMAN</span><strong>{analytics.page_views}</strong></article><article><span>IZIN KAMERA</span><strong>{analytics.camera_granted}</strong></article><article><span>MULAI MEMOTRET</span><strong>{analytics.photo_started}</strong></article><article><span>BERHASIL MENGIRIM</span><strong>{analytics.submit_success}</strong></article><article><span>SISA WAKTU UPLOAD</span><EventCountdown endsAt={event.upload_ends_at}/></article></section>
        <section className="private-gallery" id="galeri">
          <div className="gallery-head"><div><span className="dash-kicker">GALERI PRIVAT</span><h2>MOMEN TERBARU</h2></div><div className="gallery-head-actions"><Link className="see-all" href={`/dashboard/gallery?event=${event.id}`}>Lihat semua · {uploadedPhotoTotal}</Link><DownloadZipButton eventId={event.id} disabled={!uploadedPhotoTotal} compact/></div></div>
          {gallery.length?<div className="photo-marquee"><div>{[...photoTrack,...photoTrack].map((photo,index)=><figure key={`${photo.id}-${index}`}><img src={photo.url} alt={`Foto tamu ${(index%gallery.length)+1}`}/></figure>)}</div></div>:<p className="gallery-empty">Foto tamu akan tampil di sini setelah berhasil dikirim.</p>}
        </section>
        <section className="guest-wishes">
          <div className="gallery-head"><div><span className="dash-kicker">UCAPAN TAMU</span><h2>PESAN UNTUKMU</h2></div><Link className="see-all" href={`/dashboard/messages?event=${event.id}`}>Lihat semua · {messageTotal}</Link></div>
          {messages.length?<div className="wish-marquee"><div>{[...messageTrack,...messageTrack].map((item,index)=><article key={`${item.id}-${index}`}><MessageCircle/><p>“{item.message}”</p><div><b>{item.guest_name||"Tamu anonim"}</b><span>{new Date(item.created_at).toLocaleDateString("id-ID",{day:"numeric",month:"short"})}</span></div></article>)}</div></div>:<p className="gallery-empty">Belum ada ucapan yang masuk.</p>}
        </section>
        <GoogleDriveCard eventId={event.id} connection={driveConnection} synced={driveSynced} pending={drivePending} nextCleanup={nextCleanup}/>
        {selectedParams.drive&&<DashboardNotice>{selectedParams.drive==="connected"?"Google Drive berhasil dihubungkan.":selectedParams.drive==="disconnected"?"Google Drive telah diputuskan.":selectedParams.drive==="sync"?"Sinkronisasi semua foto berjalan di latar belakang.":"Koneksi atau sinkronisasi Drive belum berhasil. Silakan coba lagi."}</DashboardNotice>}
      </>}
    </section>
  </main>;
}
