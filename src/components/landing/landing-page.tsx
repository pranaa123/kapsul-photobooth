"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, Camera, Check, ChevronDown, LockKeyhole, QrCode, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";

const ticker = ["PERNIKAHAN", "ULANG TAHUN", "WISUDA", "GATHERING", "FESTIVAL", "MOMEN KECIL"];

const packages = [
  { name: "Intimate", note: "Untuk momen yang dekat", price: "299K", devices: "50 perangkat", photos: "500 foto", days: "1 hari", dark: false },
  { name: "Celebration", note: "Pilihan paling seimbang", price: "599K", devices: "150 perangkat", photos: "1.500 foto", days: "3 hari", dark: true },
  { name: "Festival", note: "Untuk cerita yang lebih besar", price: "1,2JT", devices: "500 perangkat", photos: "5.000 foto", days: "7 hari", dark: false }
];

export function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <main>
      <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
        <Link href="/" aria-label="Kapsul"><Brand /></Link>
        <div className={`nav-links ${menu ? "nav-links--open" : ""}`}>
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#harga">Harga</a>
          <a href="#faq">FAQ</a>
          <Link href="/login">Masuk</Link>
        </div>
        <Link href="/register" className="btn btn--dark nav-cta">Buat acara <ArrowRight size={16} /></Link>
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Buka navigasi">
          <span /><span />
        </button>
      </nav>

      <header className="hero">
        <div className="hero-kicker"><span>PHOTObooth WEB</span><span>BALI · INDONESIA</span></div>
        <h1>MOMEN DARI<br /><span>SEMUA</span> SUDUT.</h1>
        <div className="hero-bottom">
          <p>Biarkan tamu mengabadikan cerita versi mereka. Cukup scan, jepret, dan semua tersimpan rapi di galeri privat milikmu.</p>
          <a className="round-link" href="#cara-kerja" aria-label="Lihat cara kerja"><ArrowDown size={22} /></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="photo photo--one"><div className="photo-scene scene-one"><span>YOU<br />WERE<br />HERE</span></div></div>
          <div className="photo photo--two"><div className="photo-scene scene-two"><span>05.08.26</span></div></div>
          <div className="photo photo--three"><div className="photo-scene scene-three"><Sparkles size={38}/></div></div>
          <div className="sticker">NO APP<br />NEEDED</div>
        </div>
      </header>

      <section className="ticker" aria-hidden="true">
        <div>{[...ticker, ...ticker].map((item, i) => <span key={i}>{item} <b>✦</b></span>)}</div>
      </section>

      <section className="manifesto">
        <span className="eyebrow">KENAPA KAPSUL</span>
        <p>Foto terbaik sering kali bukan yang direncanakan. Kapsul mengumpulkan tawa, blur, dan kejutan kecil dari sudut pandang orang-orang terdekatmu.</p>
        <div className="privacy-note"><LockKeyhole size={18} /><span>TETAP PRIVAT.<br />HANYA UNTUKMU.</span></div>
      </section>

      <section className="steps" id="cara-kerja">
        <div className="section-head">
          <span className="eyebrow">MUDAH UNTUK SEMUA</span>
          <h2>TIGA LANGKAH.<br />BANYAK CERITA.</h2>
        </div>
        <div className="step-list">
          <article><span>01</span><QrCode/><h3>Buat & bagikan QR</h3><p>Atur acaramu, lalu unduh QR unik untuk ditaruh di meja, layar, atau undangan.</p></article>
          <article><span>02</span><Camera/><h3>Tamu scan & jepret</h3><p>Tanpa instal aplikasi dan tanpa akun. Kamera langsung terbuka dari browser mereka.</p></article>
          <article><span>03</span><LockKeyhole/><h3>Nikmati secara privat</h3><p>Semua foto masuk ke galeri aman yang hanya dapat dibuka dan diunduh olehmu.</p></article>
        </div>
      </section>

      <section className="split-feature">
        <div className="phone-wrap">
          <div className="phone">
            <div className="phone-bar"><Brand light /><span>3/10</span></div>
            <div className="phone-view"><span>RANIA<br /><i>&</i> DAVA</span><small>12 — 08 — 2026</small></div>
            <div className="shutter"><span /></div>
          </div>
        </div>
        <div className="split-copy">
          <span className="eyebrow">DIBUAT UNTUK TAMU</span>
          <h2>BUKA.<br />ARAHKAN.<br /><em>JEPRET.</em></h2>
          <p>Tidak ada formulir panjang. Tidak ada akun baru. Pengalaman kamera yang sederhana membuat semua tamu bisa ikut—dari sahabat sampai keluarga.</p>
          <Link href="/event/demo" className="text-link">Coba pengalaman tamu <ArrowRight size={17}/></Link>
        </div>
      </section>

      <section className="pricing" id="harga">
        <div className="section-head section-head--row">
          <div><span className="eyebrow">PAKET SEDERHANA</span><h2>PILIH UKURAN<br />MOMENMU.</h2></div>
          <p>Semua paket termasuk galeri privat, QR acara, dan unduh foto resolusi tinggi.</p>
        </div>
        <div className="price-grid">
          {packages.map((item) => (
            <article className={item.dark ? "price-card price-card--dark" : "price-card"} key={item.name}>
              {item.dark && <span className="popular">PALING POPULER</span>}
              <div><span className="price-index">0{packages.indexOf(item)+1}</span><h3>{item.name}</h3><p>{item.note}</p></div>
              <div className="price"><sup>RP</sup>{item.price}</div>
              <ul><li><Check/> {item.devices}</li><li><Check/> {item.photos}</li><li><Check/> Aktif {item.days}</li><li><Check/> Maks. 10 foto/perangkat</li></ul>
              <Link href="/event/demo" className={item.dark ? "btn btn--light btn--wide" : "btn btn--outline btn--wide"}>Pilih paket <ArrowRight size={16}/></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="quote-section">
        <div className="quote-mark">“</div>
        <blockquote>FOTO-FOTONYA JUJUR, LUCU, DAN RASANYA SEPERTI MENGULANG MALAM ITU SEKALI LAGI.</blockquote>
        <p>— AYU & RAKA, DENPASAR</p>
      </section>

      <section className="faq" id="faq">
        <div><span className="eyebrow">YANG SERING DITANYAKAN</span><h2>SEBELUM<br />KAMU MULAI.</h2></div>
        <div className="faq-list">
          {[
            ["Apakah tamu harus install aplikasi?", "Tidak. Tamu cukup scan QR dan membuka kamera langsung dari browser."],
            ["Siapa yang bisa melihat foto?", "Hanya pemilik acara yang sudah login. Tamu tidak bisa membuka galeri atau foto orang lain."],
            ["Bagaimana jika internet tamu terputus?", "Draft foto disimpan di perangkat dan bisa dilanjutkan ketika koneksi kembali."],
            ["Berapa lama foto disimpan?", "Masa simpan mengikuti paket dan akan selalu terlihat jelas di dashboard."]
          ].map(([q,a], i) => <details key={q} open={i===0}><summary>{q}<ChevronDown/></summary><p>{a}</p></details>)}
        </div>
      </section>

      <footer>
        <div className="footer-cta"><p>PUNYA MOMEN<br />UNTUK DISIMPAN?</p><Link href="/event/demo">MULAI SEKARANG <ArrowRight/></Link></div>
        <div className="footer-bottom"><Brand light/><span>© 2026 KAPSUL STUDIO</span><div><a href="#">Privasi</a><a href="#">Ketentuan</a><a href="#">Instagram</a></div></div>
      </footer>
    </main>
  );
}
