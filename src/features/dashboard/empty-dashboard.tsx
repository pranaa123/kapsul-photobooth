import Link from "next/link";
import { ArrowRight, CalendarPlus, Check, QrCode, Sparkles } from "lucide-react";

export function EmptyDashboard({ name }: { name: string }) {
  return (
    <div className="empty-dash">
      <div className="empty-copy">
        <span className="dash-kicker">SELAMAT DATANG, {name.toUpperCase()}</span>
        <h1>MOMEN PERTAMAMU<br />DIMULAI <em>DI SINI.</em></h1>
        <p>Buat acara, pilih paket, lalu bagikan QR kepada tamu. Kamu dapat meninjau semuanya sebelum pembayaran.</p>
        <Link href="/create-event" className="empty-cta">Buat acara pertama <ArrowRight /></Link>
      </div>
      <div className="empty-steps">
        <article><span><CalendarPlus /></span><div><small>LANGKAH 01</small><h2>Isi detail acara</h2><p>Nama, tanggal, lokasi, dan perkiraan tamu.</p></div><Check /></article>
        <article><span><Sparkles /></span><div><small>LANGKAH 02</small><h2>Pilih paket</h2><p>Sesuaikan dengan jumlah perangkat dan foto.</p></div><Check /></article>
        <article><span><QrCode /></span><div><small>LANGKAH 03</small><h2>Bagikan QR</h2><p>QR aktif setelah pembayaran terverifikasi.</p></div></article>
      </div>
    </div>
  );
}
