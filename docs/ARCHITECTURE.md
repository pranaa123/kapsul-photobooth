# Arsitektur MVP biaya Rp0

```text
Browser tamu ── HTTPS ──> Next.js Route Handler
                              │
                              ├─ validasi event, device, kuota
                              └─ signed upload
                                      │
                                      v
                            Supabase Storage (private)
                                      │
                                      v
                            PostgreSQL metadata + RLS
                                      │
                     Dashboard pemilik terautentikasi

Midtrans Sandbox ── webhook valid ──> aktivasi order/event
Resend <──────────── server only ──── email transaksional
```

Supabase menjadi database, authentication, dan storage pada MVP. Ini mengurangi
biaya dan jumlah integrasi tanpa mengorbankan pemisahan kode. Browser tamu tidak
memiliki izin membaca bucket. Galeri selalu melewati pemeriksaan kepemilikan event.

## Batas operasional paket gratis

Dashboard perlu menampilkan pemakaian storage dan bandwidth internal. Sebelum acara
uji, operator memeriksa sisa kuota dan menjalankan simulasi upload. Jika batas mulai
sering tersentuh, upgrade dilakukan dari pendapatan produk; R2 baru dievaluasi saat
volume storage dan egress membenarkannya.

## Prinsip keamanan

- Kuota dan deduplikasi ditetapkan oleh transaksi database, bukan counter browser.
- `event_id + event_device_id + file_hash` unik.
- Webhook pembayaran memiliki unique external ID dan diverifikasi signature-nya.
- URL foto bertanda tangan berumur singkat; bucket tidak publik.
- Token perangkat disimpan sebagai hash.
- Akses admin ke foto menghasilkan audit log.
- Draft lokal akan memakai IndexedDB; mock saat ini hanya menyimpan selama halaman hidup.
