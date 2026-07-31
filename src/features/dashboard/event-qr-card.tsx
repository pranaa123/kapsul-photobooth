"use client";
import {useRef,useState} from "react";
import {Check,Copy,Download,Share2} from "lucide-react";
import {QRCodeSVG} from "qrcode.react";

export function EventQrCard({slug,token,baseUrl}:{slug:string;token:string;baseUrl:string}){
  const[copied,setCopied]=useState(false);const[notice,setNotice]=useState("");const qr=useRef<HTMLDivElement>(null);
  const url=`${baseUrl}/e/${slug}?t=${token}`;
  function toast(text:string){setNotice(text);setTimeout(()=>setNotice(""),1800);}
  async function copy(){await navigator.clipboard.writeText(url);setCopied(true);toast("Tautan berhasil disalin");setTimeout(()=>setCopied(false),1800);}
  async function share(){if(navigator.share){try{await navigator.share({title:"Bagikan momenmu",text:"Buka photobooth privat acara ini untuk mengirim foto dan ucapan.",url});toast("Menu berbagi dibuka");}catch(error){if(error instanceof DOMException&&error.name==="AbortError")return;}}else{await copy();toast("Tautan disalin—siap dibagikan");}}
  function download(){const svg=qr.current?.querySelector("svg");if(!svg)return;const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`qr-${slug}.svg`;link.click();URL.revokeObjectURL(link.href);toast("QR berhasil diunduh");}
  return <article className="event-qr-card compact" id="qr">
    <div className="qr-copy"><span>TAUTAN PENGUNJUNG</span><h2>BAGIKAN<br/>MOMENMU.</h2><p>Kirim QR ini kepada para pengunjung agar mereka dapat mengabadikan foto dan ucapan. Tautan ini hanya membuka halaman tamu, bukan galeri privatmu.</p></div>
    <div className="qr-visual"><div className="real-qr" ref={qr}><QRCodeSVG value={url} size={92} bgColor="#ffffff" fgColor="#11110f" level="M"/></div><button onClick={download}><Download/>Unduh QR</button></div>
    <div className="qr-actions"><label><input aria-label="Tautan pengunjung" readOnly value={url} onFocus={event=>event.currentTarget.select()}/><button aria-label="Salin tautan" onClick={copy}>{copied?<Check/>:<Copy/>}</button></label><button className="share-button" onClick={()=>void share()}><Share2/>Bagikan</button></div>
    {notice&&<div className="dashboard-toast"><i/>{notice}</div>}
  </article>;
}
