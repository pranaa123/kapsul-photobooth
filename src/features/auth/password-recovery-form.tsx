"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PasswordRecoveryForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/update-password`
    });
    setLoading(false);
    if (resetError) {
      if (resetError.message.toLowerCase().includes("rate limit")) {
        return setError("Batas email percobaan Supabase sudah tercapai. Tunggu sekitar 1 jam, lalu coba satu kali lagi.");
      }
      return setError("Tautan belum dapat dikirim. Pastikan email benar, lalu coba kembali.");
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-success">
        <CheckCircle2 />
        <span className="auth-eyebrow">EMAIL TERKIRIM</span>
        <h1>PERIKSA<br />EMAILMU.</h1>
        <p>Klik tautan pemulihan dari Kapsul, lalu buat password baru. Periksa folder Spam jika belum terlihat.</p>
        <Link href="/login"><ArrowLeft /> Kembali ke halaman masuk</Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label><span>EMAIL AKUN</span><input name="email" type="email" placeholder="nama@email.com" autoComplete="email" required /></label>
      {error && <p className="auth-error">{error}</p>}
      <button className="auth-submit" disabled={loading}>
        {loading ? <LoaderCircle className="spin" /> : <>Kirim tautan pemulihan <ArrowRight /></>}
      </button>
      <p className="auth-switch"><Link href="/login">Kembali ke halaman masuk</Link></p>
    </form>
  );
}
