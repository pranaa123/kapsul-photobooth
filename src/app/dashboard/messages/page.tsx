import "../dashboard.css";
import Link from "next/link";
import {ArrowLeft,MessageCircle} from "lucide-react";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export default async function AllMessagesPage({searchParams}:{searchParams:Promise<{event?:string}>}){
  const{event:eventId}=await searchParams;if(!eventId)notFound();
  const supabase=await createClient();
  const{data:event}=await supabase.from("events").select("id,name").eq("id",eventId).maybeSingle();if(!event)notFound();
  const{data:messages}=await supabase.from("guest_messages").select("id,guest_name,message,created_at").eq("event_id",event.id).order("created_at",{ascending:false}).limit(500);
  return <main className="all-messages-page">
    <header><Link href={`/dashboard?event=${event.id}`}><ArrowLeft/>Kembali ke dashboard</Link><span>UCAPAN PRIVAT</span></header>
    <section className="all-messages-title"><div><small>{event.name.toUpperCase()}</small><h1>SEMUA<br/><em>UCAPAN.</em></h1></div><strong>{messages?.length??0}</strong></section>
    {messages?.length?<section className="all-message-grid">{messages.map(item=><article key={item.id}><MessageCircle/><p>“{item.message}”</p><footer><b>{item.guest_name||"Tamu anonim"}</b><span>{new Date(item.created_at).toLocaleString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span></footer></article>)}</section>:<p className="gallery-empty">Belum ada ucapan yang masuk.</p>}
  </main>;
}
