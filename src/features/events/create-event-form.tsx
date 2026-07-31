"use client";

import { useState } from "react";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { createEventOrder } from "./actions";

type Package = { id:string;name:string;price:number;max_devices:number;max_photos:number;max_photos_per_device:number;active_hours:number };

export function CreateEventForm({ packages }: { packages: Package[] }) {
  const [selected,setSelected]=useState(packages[1]?.id ?? packages[0]?.id ?? "");
  const chosen=packages.find(item=>item.id===selected);
  return <form action={createEventOrder} className="event-form">
    <input type="hidden" name="packageId" value={selected}/>
    <section className="event-form-section"><div className="form-number">01</div><div className="form-content"><span className="form-eyebrow">PILIH PAKET</span><h2>SEBERAPA BESAR<br/>MOMENMU?</h2><div className="package-options">{packages.map(item=><button type="button" key={item.id} className={selected===item.id?"selected":""} onClick={()=>setSelected(item.id)}><span>{item.name}</span><strong>Rp {item.price.toLocaleString("id-ID")}</strong><small>{item.max_devices} perangkat · {item.max_photos.toLocaleString("id-ID")} foto</small>{selected===item.id&&<i><Check/></i>}</button>)}</div></div></section>
    <section className="event-form-section"><div className="form-number">02</div><div className="form-content"><span className="form-eyebrow">DETAIL ACARA</span><h2>CERITAKAN<br/>SEDIKIT.</h2><div className="input-grid"><label className="wide"><span>NAMA ACARA</span><input name="name" placeholder="Rania & Dava" minLength={3} required/></label><label><span>JENIS ACARA</span><select name="eventType" defaultValue="Pernikahan"><option>Pernikahan</option><option>Ulang tahun</option><option>Corporate</option><option>Wisuda</option><option>Komunitas</option><option>Lainnya</option></select></label><label><span>ESTIMASI TAMU</span><input name="estimatedGuests" type="number" min="1" max="10000" placeholder="150" required/></label><label><span>TANGGAL</span><input name="date" type="date" required/></label><label><span>WAKTU MULAI</span><input name="time" type="time" required/></label><label className="wide"><span>LOKASI</span><div className="with-icon"><MapPin/><input name="location" placeholder="The Garden, Denpasar" required/></div></label></div></div></section>
    <div className="form-submit"><div><small>RINGKASAN</small><p>{chosen?.name} · <b>Rp {chosen?.price.toLocaleString("id-ID")}</b></p><span>Belum ada pembayaran pada tahap ini.</span></div><button>Lanjut ke ringkasan <ArrowRight/></button></div>
  </form>
}
