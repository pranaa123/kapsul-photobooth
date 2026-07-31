import "../dashboard.css";
import Link from "next/link";
import {ArrowLeft,Images} from "lucide-react";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {DownloadZipButton} from "@/features/dashboard/download-zip-button";

export default async function FullGalleryPage({searchParams}:{searchParams:Promise<{event?:string}>}){
  const{event:eventId}=await searchParams;if(!eventId)notFound();
  const supabase=await createClient();
  const{data:event}=await supabase.from("events").select("id,name").eq("id",eventId).maybeSingle();
  if(!event)notFound();
  const{data:photos,count:photoTotal}=await supabase.from("photos").select("id,storage_path,thumbnail_path,drive_file_id,storage_deleted_at,created_at",{count:"exact"}).eq("event_id",event.id).eq("status","uploaded").order("created_at",{ascending:false}).limit(200);
  const storageClient=process.env.SUPABASE_SECRET_KEY?createAdminClient():supabase;
  const bucket=storageClient.storage.from(process.env.SUPABASE_STORAGE_BUCKET??"event-photos");
  const signed=await Promise.all((photos??[]).map(async photo=>{const preview=await bucket.createSignedUrl(photo.thumbnail_path||photo.storage_path,600);const master=photo.storage_deleted_at?null:await bucket.createSignedUrl(photo.storage_path,600);return{preview:preview.data?.signedUrl??"",master:master?.data?.signedUrl??(photo.drive_file_id?`https://drive.google.com/open?id=${photo.drive_file_id}`:"")}}));
  const gallery=(photos??[]).map((photo,index)=>({...photo,url:signed[index]?.preview??"",masterUrl:signed[index]?.master??""})).filter(photo=>photo.url);
  return <main className="full-gallery-page">
    <header><Link href={`/dashboard?event=${event.id}`}><ArrowLeft/>Kembali ke dashboard</Link><span>GALERI PRIVAT</span></header>
    <section className="full-gallery-title"><div><small>{event.name.toUpperCase()}</small><h1>SEMUA<br/><em>MOMEN.</em></h1></div><div className="gallery-actions"><div><Images/><strong>{photoTotal??gallery.length}</strong><span>FOTO TERSIMPAN</span></div><DownloadZipButton eventId={event.id} disabled={!(photoTotal??gallery.length)}/><small>ZIP tidak disimpan dan tidak memakai kuota galeri.</small></div></section>
    {gallery.length?<section className="full-gallery-grid">{gallery.map((photo,index)=><figure key={photo.id}><a href={photo.masterUrl} target="_blank" rel="noreferrer"><img src={photo.url} alt={`Foto tamu ${index+1}`} loading="lazy"/></a><figcaption>#{String(gallery.length-index).padStart(3,"0")} · {new Date(photo.created_at).toLocaleString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</figcaption></figure>)}</section>:<p className="gallery-empty">Belum ada file foto yang dapat ditampilkan.</p>}
  </main>;
}
