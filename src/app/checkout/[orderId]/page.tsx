import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import { createClient } from "@/lib/supabase/server";
import Script from "next/script";
import { PayButton } from "@/features/payments/pay-button";
import "./checkout.css";

export const metadata={title:"Ringkasan pesanan — Kapsul",robots:{index:false}};

export default async function CheckoutPage({params}:{params:Promise<{orderId:string}>}){
  const {orderId}=await params;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect(`/login?next=/checkout/${orderId}`);
  const {data:order}=await supabase.from("orders").select("id,order_number,total,payment_status,created_at,packages(name,max_devices,max_photos,max_photos_per_device,active_hours),events(id,name,starts_at,branding)").eq("id",orderId).maybeSingle();
  if(!order)notFound();
  const pkg=Array.isArray(order.packages)?order.packages[0]:order.packages;
  const event=Array.isArray(order.events)?order.events[0]:order.events;
  return <main className="checkout-page">
    {process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY&&<Script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}/>} 
    <header><Link href="/"><Brand/></Link><span>CHECKOUT SANDBOX</span><Link href="/create-event"><ArrowLeft/> Ubah detail</Link></header>
    <div className="checkout-layout">
      <section className="checkout-main"><span className="checkout-eyebrow">RINGKASAN PESANAN</span><h1>SELANGKAH<br/>LAGI.</h1><div className="sandbox-note"><ShieldCheck/><div><b>Mode simulasi</b><p>Tidak ada uang yang akan berpindah. Midtrans akan dihubungkan setelah alur ini disetujui.</p></div></div>
        <div className="order-block"><small>ACARA</small><div><h2>{event?.name}</h2><p>{event?.starts_at?new Date(event.starts_at).toLocaleString("id-ID",{dateStyle:"long",timeStyle:"short"}):"-"}</p></div></div>
        <div className="order-block"><small>PAKET</small><div><h2>{pkg?.name}</h2><ul><li><Check/>{pkg?.max_devices} perangkat</li><li><Check/>{pkg?.max_photos?.toLocaleString("id-ID")} foto total</li><li><Check/>{pkg?.max_photos_per_device} foto/perangkat</li><li><Clock3/>Aktif {pkg?.active_hours} jam</li></ul></div></div>
      </section>
      <aside className="payment-card"><div><span>NO. PESANAN</span><b>{order.order_number}</b></div><div className="total"><span>TOTAL</span><strong><small>RP</small>{order.total.toLocaleString("id-ID")}</strong></div><div className="demo-qr">{Array.from({length:100},(_,i)=><i key={i} className={(i*11+i%7)%4<2?"on":""}/>)}</div><p>QRIS SANDBOX</p><PayButton orderId={order.id} clientKey={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}/><small><LockKeyhole/> Pembayaran aman dan terverifikasi webhook</small><Link href="/dashboard">Simpan dan kembali ke dashboard</Link></aside>
    </div>
  </main>
}
