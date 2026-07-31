import { AuthForm } from "@/features/auth/auth-form";

export const metadata = { title: "Masuk — Kapsul", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="auth-card">
      <span className="auth-eyebrow">SELAMAT DATANG KEMBALI</span>
      <h1>MASUK KE<br /><em>MOMENMU.</em></h1>
      <p>Kelola acara dan lihat semua foto yang dikirim tamumu.</p>
      <AuthForm mode="login" />
    </div>
  );
}
