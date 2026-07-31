import { AuthForm } from "@/features/auth/auth-form";

export const metadata = { title: "Buat akun — Kapsul", robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="auth-card">
      <span className="auth-eyebrow">MULAI DARI SINI</span>
      <h1>BUAT AKUN.<br /><em>SIMPAN CERITA.</em></h1>
      <p>Daftar gratis. Pilih paket dan bayar hanya saat kamu siap membuat acara.</p>
      <AuthForm mode="register" />
    </div>
  );
}
