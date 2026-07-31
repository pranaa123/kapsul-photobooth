import "../dashboard.css";
import Link from "next/link";
import {ArrowLeft,CheckCircle2,Copy,ShieldCheck} from "lucide-react";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {inspectDriveDuplicates} from "@/server/drive-duplicates";

export default async function DriveCleanupPage({searchParams}:{searchParams:Promise<{event?:string;cleaned?:string}>}){
  const{event:eventId,cleaned}=await searchParams;if(!eventId)notFound();
  const supabase=await createClient();const{data:event}=await supabase.from("events").select("id,name").eq("id",eventId).maybeSingle();if(!event)notFound();
  let report;try{report=await inspectDriveDuplicates(event.id)}catch{return <main className="drive-cleanup-page"><header><Link href={`/dashboard?event=${event.id}`}><ArrowLeft/>Kembali</Link><span>PEMERIKSAAN DRIVE</span></header><p className="gallery-empty">Google Drive belum dapat diperiksa. Pastikan akun masih terhubung.</p></main>}
  return <main className="drive-cleanup-page"><header><Link href={`/dashboard?event=${event.id}`}><ArrowLeft/>Kembali ke dashboard</Link><span>PEMERIKSAAN DRIVE</span></header><section className="cleanup-title"><div><small>{event.name.toUpperCase()}</small><h1>FILE<br/><em>GANDA.</em></h1></div><ShieldCheck/></section>{cleaned&&<div className="cleanup-success"><CheckCircle2/>Duplikat sudah dipindahkan ke Trash Google Drive dan masih dapat dipulihkan.</div>}<section className="cleanup-summary"><article><strong>{report.totalFiles}</strong><span>TOTAL FILE DRIVE</span></article><article><strong>{report.duplicateCount}</strong><span>AMAN DIPINDAHKAN</span></article><article><strong>{report.unresolvedCount}</strong><span>PERLU DITINJAU MANUAL</span></article></section><section className="cleanup-list"><h2>HASIL PEMERIKSAAN</h2>{report.groups.length?report.groups.map(group=><article key={group.name}><Copy/><div><b>{group.name}</b><span>{group.items.length} salinan · {group.official?`${group.removable.length} duplikat terverifikasi`:"tidak disentuh karena file resmi belum dapat dipastikan"}</span></div></article>):<p>Tidak ditemukan nama file yang berulang.</p>}</section>{report.duplicateCount>0&&<form className="cleanup-confirm" action="/api/integrations/google/cleanup" method="post"><input type="hidden" name="event" value={event.id}/><div><b>Pembersihan aman</b><span>File resmi dipertahankan. Duplikat hanya dipindahkan ke Trash, bukan dihapus permanen.</span></div><button type="submit">Pindahkan {report.duplicateCount} duplikat ke Trash</button></form>}</main>;
}
