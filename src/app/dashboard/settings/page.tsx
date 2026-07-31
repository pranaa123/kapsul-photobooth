import "../dashboard.css";
import Link from "next/link";
import {ArrowLeft,KeyRound,Settings} from "lucide-react";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {rotateEventToken,updateEventSettings} from "@/features/events/settings-actions";
import {DashboardNotice} from "@/features/dashboard/dashboard-notice";
import {SettingsSubmitButton} from "@/features/events/settings-submit-button";

function localDateTime(value:string|null){if(!value)return"";const date=new Date(value);const local=new Date(date.getTime()-date.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)}

export default async function EventSettingsPage({searchParams}:{searchParams:Promise<{event?:string;saved?:string;rotated?:string}>}){
  const params=await searchParams;
  if(!params.event)notFound();
  const supabase=await createClient();
  const{data:event}=await supabase.from("events").select("id,name,status,upload_ends_at,max_photos_per_device,branding").eq("id",params.event).maybeSingle();
  if(!event)notFound();
  const branding=(event.branding??{}) as Record<string,unknown>;
  const saveMessage=params.saved==="yes"?"Pengaturan acara berhasil disimpan.":params.saved==="invalid-date"?"Tanggal penutupan upload tidak valid.":"Pengaturan belum berhasil disimpan.";

  return <main className="event-settings-page">
    <header><Link href={`/dashboard?event=${event.id}`}><ArrowLeft/>Kembali ke dashboard</Link><span>PENGATURAN ACARA</span></header>
    <section className="settings-title"><div><small>{event.name.toUpperCase()}</small><h1>ATUR<br/><em>ACARAMU.</em></h1></div><Settings/></section>
    <form action={updateEventSettings} className="settings-form">
      <input type="hidden" name="eventId" value={event.id}/>
      <section><span className="settings-number">01</span><div><small>IDENTITAS & PESAN</small>
        <label><span>NAMA ACARA</span><input name="name" defaultValue={event.name} minLength={3} maxLength={100} required/></label>
        <label><span>PESAN SAMBUTAN</span><textarea name="welcomeMessage" maxLength={300} defaultValue={String(branding.welcome_message??"")} placeholder="Abadikan momen dari sudut pandangmu."/></label>
        <label><span>PESAN SELESAI</span><textarea name="completionMessage" maxLength={300} defaultValue={String(branding.completion_message??"")} placeholder="Terima kasih sudah menjadi bagian dari acara kami."/></label>
      </div></section>
      <section><span className="settings-number">02</span><div><small>AKSES & KUOTA</small>
        <label><span>STATUS ACARA</span><select name="status" defaultValue={event.status}><option value="active">Aktif — tamu dapat mengirim</option><option value="paused">Dijeda — upload ditutup sementara</option><option value="ended">Selesai — upload ditutup</option></select></label>
        <label><span>UPLOAD DITUTUP</span><input name="uploadEndsAt" type="datetime-local" defaultValue={localDateTime(event.upload_ends_at)}/></label>
        <label><span>FOTO PER PERANGKAT</span><input name="maxPhotosPerDevice" type="number" min={1} max={event.max_photos_per_device} defaultValue={event.max_photos_per_device}/><small>Maksimum sesuai paket: {event.max_photos_per_device} foto.</small></label>
        <label className="settings-check"><input name="allowMessages" type="checkbox" defaultChecked={branding.allow_messages!==false}/><span>Izinkan tamu mengirim ucapan</span></label>
      </div></section>
      <SettingsSubmitButton/>
    </form>
    <section className="token-panel"><div><KeyRound/><div><b>ROTASI TAUTAN & QR</b><p>Gunakan hanya jika QR bocor atau disalahgunakan. Tautan lama langsung berhenti bekerja dan QR harus dibagikan ulang.</p></div></div><form action={rotateEventToken}><input type="hidden" name="eventId" value={event.id}/><button type="submit">Buat QR baru</button></form></section>
    {params.saved&&<DashboardNotice>{saveMessage}</DashboardNotice>}
    {params.rotated&&<DashboardNotice>{params.rotated==="yes"?"QR baru berhasil dibuat. Tautan lama sudah dinonaktifkan.":"QR baru belum berhasil dibuat."}</DashboardNotice>}
  </main>;
}
