"use client";
import {useRef,useState} from "react";
import {Check,Copy,Download} from "lucide-react";
import {QRCodeSVG} from "qrcode.react";

export function EventQrCard({slug,token,baseUrl}:{slug:string;token:string;baseUrl:string}){
  const[copied,setCopied]=useState(false);const[notice,setNotice]=useState("");const qr=useRef<HTMLDivElement>(null);
  const url=`${baseUrl}/e/${slug}?t=${token}`;
  function toast(text:string){setNotice(text);setTimeout(()=>setNotice(""),1800);}
  async function copy(){await navigator.clipboard.writeText(url);setCopied(true);toast("Tautan berhasil disalin");setTimeout(()=>setCopied(false),1800);}
  function download(){const svg=qr.current?.querySelector("svg");if(!svg)return;const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`qr-${slug}.svg`;link.click();URL.revokeObjectURL(link.href);toast("QR berhasil diunduh");}
  return <article className="event-qr-card compact" id="qr">
    <div className="qr-copy"><span>QR ACARAMU</span><code>{url}</code><div><button onClick={copy}>{copied?<Check/>:<Copy/>}{copied?"Tersalin":"Salin link"}</button><button onClick={download}><Download/>Unduh QR</button></div></div>
    <div className="real-qr" ref={qr}><QRCodeSVG value={url} size={92} bgColor="#ffffff" fgColor="#11110f" level="M"/></div>
    {notice&&<div className="dashboard-toast"><i/>{notice}</div>}
  </article>;
}
