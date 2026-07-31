"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();

    if (mode === "register") {
      const fullName = String(form.get("fullName") ?? "").trim();
      const phone = String(form.get("phone") ?? "").trim();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
          data: { full_name: fullName, phone }
        }
      });
      setLoading(false);
      if (error) return setMessage(error.message);
      setSent(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMessage("Email atau password belum benar.");
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    router.refresh();
  }

  if (sent) {
    return (
      <div className="auth-success">
        <CheckCircle2 />
        <span className="auth-eyebrow">PERIKSA EMAILMU</span>
        <h1>SATU KLIK<br />LAGI.</h1>
        <p>Kami mengirim tautan verifikasi. Buka email tersebut untuk mengaktifkan akun Kapsul.</p>
        <Link href="/login">Kembali ke halaman masuk <ArrowRight /></Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "register" && (
        <div className="field-row">
          <label><span>NAMA LENGKAP</span><input name="fullName" placeholder="Jayadi Putra" required /></label>
          <label><span>WHATSAPP</span><input name="phone" type="tel" placeholder="0812 3456 7890" required /></label>
        </div>
      )}
      <label><span>EMAIL</span><input name="email" type="email" placeholder="nama@email.com" autoComplete="email" required /></label>
      <label>
        <span>PASSWORD</span>
        <div className="password-field">
          <input name="password" type={showPassword ? "text" : "password"} minLength={8} placeholder="Minimal 8 karakter" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? <EyeOff /> : <Eye />}</button>
        </div>
      </label>
      {mode === "login" && <Link href="/forgot-password" className="forgot">Lupa password?</Link>}
      {message && <p className="auth-error">{message}</p>}
      <button className="auth-submit" disabled={loading}>
        {loading ? <LoaderCircle className="spin" /> : <>{mode === "login" ? "Masuk ke dashboard" : "Buat akun"} <ArrowRight /></>}
      </button>
      <p className="auth-switch">
        {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <Link href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Daftar gratis" : "Masuk"}</Link>
      </p>
    </form>
  );
}
