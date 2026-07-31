import { PasswordRecoveryForm } from "@/features/auth/password-recovery-form";

export const metadata = { title: "Lupa password — Kapsul", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="auth-card">
      <span className="auth-eyebrow">PEMULIHAN AKUN</span>
      <h1>LUPA<br /><em>PASSWORD?</em></h1>
      <p>Masukkan email yang digunakan saat mendaftar. Kami akan mengirim tautan untuk membuat password baru.</p>
      <PasswordRecoveryForm />
    </div>
  );
}
