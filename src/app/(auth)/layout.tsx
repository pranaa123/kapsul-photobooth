import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Brand } from "@/components/ui/brand";
import "./auth.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <header><Link href="/"><Brand light /></Link><Link href="/"><ArrowLeft /> Kembali</Link></header>
        <div className="auth-visual-copy"><span>MOMEN YANG HANYA MILIKMU</span><p>“Foto-fotonya terasa seperti mengulang malam itu sekali lagi.”</p><small>— AYU & RAKA</small></div>
        <div className="auth-polaroid"><div>YOU<br />WERE<br />HERE</div></div>
      </section>
      <section className="auth-content">
        {children}
        <div className="auth-private"><LockKeyhole /> Galeri privat · Data terlindungi</div>
      </section>
    </main>
  );
}
