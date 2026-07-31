import { UpdatePasswordForm } from "@/features/auth/update-password-form";

export const metadata = { title: "Buat password baru — Kapsul", robots: { index: false } };

export default function UpdatePasswordPage() {
  return (
    <div className="auth-card">
      <span className="auth-eyebrow">PASSWORD BARU</span>
      <h1>BUAT YANG<br /><em>MUDAH DIINGAT.</em></h1>
      <p>Gunakan sedikitnya 8 karakter dan jangan memakai password yang sama dengan layanan lain.</p>
      <UpdatePasswordForm />
    </div>
  );
}
