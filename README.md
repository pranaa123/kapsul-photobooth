# Kapsul — private web photobooth

Prototype MVP photobooth berbasis web. Landing page, dashboard pemilik, dan alur
kamera tamu sudah dapat dicoba. UI menggunakan data demo; koneksi layanan eksternal
disiapkan sebagai boundary agar frontend tidak bergantung langsung pada detail backend.

## Stack MVP Rp0

- Next.js + TypeScript di Vercel Hobby
- Supabase Free: PostgreSQL, Auth, Storage, RLS
- Resend Free untuk email
- Midtrans Sandbox untuk QRIS
- PostHog Free dan Sentry Free
- Google Drive API setelah MVP stabil

## Menjalankan

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `/` untuk landing, `/dashboard` untuk dashboard demo, dan `/event/demo`
untuk alur tamu. Kamera browser memerlukan `localhost` atau HTTPS.

## Struktur

```text
src/
  app/               route dan composition layer
  components/        UI reusable dan landing
  features/          modul produk (camera, dashboard)
  lib/supabase/      adapter Supabase client/server/admin
  server/
    repositories/    kontrak akses database/payment/storage
supabase/
  migrations/        schema, constraint, dan RLS
docs/                 keputusan arsitektur dan roadmap
```

## Urutan integrasi

1. Buat project Supabase dan jalankan migration.
2. Pasang `@supabase/ssr` dan hubungkan Auth.
3. Buat bucket privat `event-photos`; akses hanya melalui signed URL singkat.
4. Implementasikan reserve-upload dalam satu transaksi database untuk menjaga kuota.
5. Sambungkan Midtrans Sandbox; event aktif hanya dari webhook valid.
6. Tambahkan Resend, PostHog, dan Sentry setelah alur inti stabil.

Jangan gunakan service-role key di browser dan jangan membuat bucket foto publik.
