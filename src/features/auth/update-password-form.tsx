"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) {
      setLoading(false);
      return setError("Kedua password belum sama.");
    }
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError("Tautan pemulihan tidak valid atau sudah kedaluwarsa.");
    router.push("/login?password=updated");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label><span>PASSWORD BARU</span><input name="password" type="password" minLength={8} placeholder="Minimal 8 karakter" autoComplete="new-password" required /></label>
      <label><span>ULANGI PASSWORD BARU</span><input name="confirmation" type="password" minLength={8} placeholder="Ketik sekali lagi" autoComplete="new-password" required /></label>
      {error && <p className="auth-error">{error}</p>}
      <button className="auth-submit" disabled={loading}>
        {loading ? <LoaderCircle className="spin" /> : <>Simpan password baru <ArrowRight /></>}
      </button>
    </form>
  );
}
