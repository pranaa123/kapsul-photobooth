"use client";
import {useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Camera,Check,LockKeyhole,MessageCircle,RefreshCw,Trash2,X} from "lucide-react";
import {Brand} from "@/components/ui/brand";
import {createClient} from "@/lib/supabase/client";

type Step="welcome"|"camera"|"preview"|"message"|"done";

type GuestEvent={name:string;startsAt?:string|null;maxPhotosPerDevice?:number;eventType?:string;slug?:string;publicToken?:string};
type ReservedUpload={photoId:string;storagePath:string;blob:Blob;uploaded:boolean};
export function GuestCamera({event={name:"Rania & Dava",startsAt:"2026-08-12T16:00:00+08:00",maxPhotosPerDevice:10,eventType:"Pernikahan"}}:{event?:GuestEvent}){
  const limit=event.maxPhotosPerDevice??10;
  const nameParts=event.name.split("&").map(part=>part.trim());
  const eventDate=event.startsAt?new Date(event.startsAt).toLocaleDateString("id-ID",{day:"2-digit",month:"2-digit",year:"numeric"}).replaceAll("/"," · "):"";
  const [step,setStep]=useState<Step>("welcome");
  const [consent,setConsent]=useState(false);
  const [photos,setPhotos]=useState<string[]>([]);
  const [error,setError]=useState("");
  const [guestName,setGuestName]=useState("");
  const [message,setMessage]=useState("");
  const [ready,setReady]=useState(false);
  const [sending,setSending]=useState(false);
  const [uploadError,setUploadError]=useState("");
  const [facing,setFacing]=useState<"user"|"environment">("environment");
  const [flash,setFlash]=useState(false);
  const [notice,setNotice]=useState("");
  const [submittedTotal,setSubmittedTotal]=useState(0);
  const completionKey=`kapsul:guest-progress:${event.slug??`${event.name}:${event.startsAt??"no-date"}`}`;
  const legacyCompletionKey=`kapsul:guest-completed:${event.name}:${event.startsAt??"no-date"}`;
  const remaining=Math.max(0,limit-submittedTotal);
  const video=useRef<HTMLVideoElement>(null);
  const stream=useRef<MediaStream|null>(null);
  const reserved=useRef<ReservedUpload[]|null>(null);
  const noticeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);

  function showNotice(text:string,duration=1500){
    if(noticeTimer.current)clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current=setTimeout(()=>setNotice(""),duration);
  }

  useEffect(()=>{
    const saved=window.localStorage.getItem(completionKey)??window.localStorage.getItem(legacyCompletionKey);
    if(saved){try{const count=Number(JSON.parse(saved).photoCount??0);setSubmittedTotal(count);if(count>=limit)setStep("done");}catch{window.localStorage.removeItem(completionKey);}}
    setReady(true);
  },[completionKey]);

  async function startCamera(nextFacing:"user"|"environment"=facing){
    setError("");
    showNotice(nextFacing===facing?"Sedang membuka kamera...":"Sedang mengganti kamera...",2500);
    try{
      stream.current?.getTracks().forEach(track=>track.stop());
      stream.current=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:nextFacing}},audio:false});
      setFacing(nextFacing);
      setStep("camera");
      showNotice("Kamera siap");
    }catch{setError("Kamera belum dapat dibuka. Periksa izin kamera di browsermu.");}
  }
  async function openCamera(){await startCamera("environment");}
  async function flipCamera(){await startCamera(facing==="environment"?"user":"environment");}
  useEffect(()=>{if(step==="camera"&&video.current&&stream.current){video.current.srcObject=stream.current;void video.current.play();}},[step,facing]);
  useEffect(()=>()=>stream.current?.getTracks().forEach(t=>t.stop()),[]);
  function shoot(){
    if(!video.current)return;
    setFlash(true);setTimeout(()=>setFlash(false),160);navigator.vibrate?.(35);
    const canvas=document.createElement("canvas");
    const sourceWidth=video.current.videoWidth||720,sourceHeight=video.current.videoHeight||960;
    const scale=Math.min(1,1920/Math.max(sourceWidth,sourceHeight));
    canvas.width=Math.round(sourceWidth*scale);canvas.height=Math.round(sourceHeight*scale);
    canvas.getContext("2d")?.drawImage(video.current,0,0,canvas.width,canvas.height);
    setPhotos(p=>[...p,canvas.toDataURL("image/jpeg",.78)].slice(0,remaining));
    showNotice("Foto berhasil diambil");
  }
  function finish(){stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setStep("preview");}
  async function completeSubmission(submittedMessage=message){
    setSending(true);setUploadError("");
    showNotice("Sedang mengirim, tunggu sebentar...",6000);
    try{
      if(event.slug&&event.publicToken){
        const supabase=createClient();
        let deviceToken=window.localStorage.getItem("kapsul:device-token");
        if(!deviceToken){deviceToken=crypto.randomUUID()+crypto.randomUUID();window.localStorage.setItem("kapsul:device-token",deviceToken);}
        if(!reserved.current){
          const prepared=await Promise.all(photos.map(async photo=>{
            const blob=await (await fetch(photo)).blob();
            const fileHash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await blob.arrayBuffer()))).map(byte=>byte.toString(16).padStart(2,"0")).join("");
            return {clientPhotoId:crypto.randomUUID(),fileHash,byteSize:blob.size,blob};
          }));
          const {data,error}=await supabase.rpc("reserve_guest_uploads",{p_slug:event.slug,p_token:event.publicToken,p_device_token:deviceToken,p_photos:prepared.map(({blob,...item})=>item)});
          if(error)throw error;
          const uploads=(data as {uploads:{photoId:string;storagePath:string}[]}).uploads;
          reserved.current=uploads.map((upload,index)=>({...upload,blob:prepared[index].blob,uploaded:false}));
        }
        for(const upload of reserved.current){
          if(upload.uploaded)continue;
          const {error}=await supabase.storage.from("event-photos").upload(upload.storagePath,upload.blob,{contentType:"image/jpeg",upsert:false});
          if(error)throw error;
          upload.uploaded=true;
        }
        const {error}=await supabase.rpc("complete_guest_submission",{p_slug:event.slug,p_token:event.publicToken,p_device_token:deviceToken,p_photo_ids:reserved.current.map(item=>item.photoId),p_guest_name:guestName||null,p_message:submittedMessage||null});
        if(error)throw error;
      }
      const newTotal=Math.min(limit,submittedTotal+photos.length);
      window.localStorage.setItem(completionKey,JSON.stringify({completedAt:new Date().toISOString(),photoCount:newTotal,hasMessage:Boolean(submittedMessage.trim())}));
      setSubmittedTotal(newTotal);
      setStep("done");
      showNotice("Berhasil dikirim");
    }catch(error){
      const detail=typeof error==="object"&&error!==null&&"message" in error?String(error.message):"";
      const friendly=detail.includes("Device photo limit")?"Batas foto dari perangkat ini sudah tercapai.":detail.includes("Event photo limit")?"Kapasitas foto acara sudah penuh.":detail.includes("row-level security")?"Izin penyimpanan foto belum aktif.":detail;
      setUploadError(friendly||"Foto belum berhasil dikirim. Silakan coba lagi.");
    }
    finally{setSending(false);}
  }
  const toast=notice?<div className="action-toast" role="status"><i/>{notice}</div>:null;
  if(!ready)return null;
  if(step==="done")return <div className="guest done-screen"><Brand light/><div className="done-mark"><Check/></div><span className="guest-eyebrow">BERHASIL DIKIRIM</span><h1>TERIMA KASIH<br/>SUDAH <em>HADIR.</em></h1><p>{submittedTotal} dari {limit} foto dari perangkat ini sudah diterima oleh {event.name}.</p>{submittedTotal<limit?<button onClick={()=>{setPhotos([]);setGuestName("");setMessage("");reserved.current=null;setStep("welcome")}}>Ambil foto lagi · {limit-submittedTotal} tersisa</button>:<small>Batas {limit} foto untuk acara ini sudah tercapai.</small>}{toast}</div>;
  if(step==="message")return <div className="guest message-screen">
    <header><Brand light/><span>{photos.length} FOTO TERKIRIM</span></header>
    <section>
      <div className="message-intro"><span className="guest-eyebrow">SATU HAL LAGI</span><div className="message-icon"><MessageCircle/></div><h1>TINGGALKAN<br/><em>UCAPAN.</em></h1><p>Tulis pesan kecil untuk {event.name}. Ucapan ini bersifat privat dan hanya terlihat di dashboard mereka.</p></div>
      <form onSubmit={(event)=>{event.preventDefault();void completeSubmission()}}>
        <label><span>NAMA <i>OPSIONAL</i></span><input value={guestName} onChange={e=>setGuestName(e.target.value)} maxLength={80} placeholder="Namamu"/></label>
        <label><span>UCAPAN <i>OPSIONAL</i></span><textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={500} placeholder="Semoga hari ini menjadi awal dari banyak cerita indah..."/><small>{message.length} / 500</small></label>
        {uploadError&&<div className="camera-error">{uploadError}</div>}
        <button type="submit" disabled={sending}>{sending?"Mengirim foto...":message.trim()?"Kirim ucapan":"Lanjut tanpa ucapan"} {!sending&&<ArrowRight/>}</button>
        {message.trim()&&<button type="button" disabled={sending} className="skip-message" onClick={()=>{setMessage("");void completeSubmission("")}}>Lewati ucapan</button>}
      </form>
    </section>
    <footer><LockKeyhole/> Foto dan ucapan hanya dapat dilihat pemilik acara.</footer>{toast}
  </div>;
  if(step==="preview")return <div className="guest preview-screen"><header><button onClick={()=>void startCamera(facing)}><ArrowLeft/> Kembali</button><span>{submittedTotal+photos.length} / {limit} FOTO</span></header><div className="preview-title"><span className="guest-eyebrow">PERIKSA MOMENMU</span><h1>SUDAH<br/><em>PAS?</em></h1><p>Hapus foto yang kurang pas atau kirim semuanya ke pemilik acara.</p></div><div className="preview-grid">{photos.map((p,i)=><div key={p}><img src={p} alt={`Foto ${i+1}`}/><button onClick={()=>setPhotos(x=>x.filter((_,n)=>n!==i))}><Trash2/></button><span>0{i+1}</span></div>)}</div><div className="preview-action"><p><LockKeyhole/> Hanya pemilik acara yang dapat melihat foto ini.</p><button disabled={!photos.length} onClick={()=>setStep("message")}>Kirim {photos.length} foto <Check/></button></div>{toast}</div>;
  if(step==="camera")return <div className={`guest camera-screen camera-${facing}`}><header><button onClick={()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setStep("welcome")}}><X/></button><Brand light/><span>{submittedTotal+photos.length}/{limit}</span></header><video ref={video} playsInline muted/><div className="camera-overlay"><div className="camera-title">{event.name}<small>{eventDate}</small></div></div>{flash&&<div className="shutter-flash"/>}<div className="camera-controls"><button aria-label="Ganti kamera" onClick={()=>void flipCamera()}><RefreshCw/></button><button className="shoot" onClick={shoot} disabled={photos.length>=remaining}><span/></button><button onClick={finish} disabled={!photos.length} className="thumb">{photos.length?<img src={photos.at(-1)} alt="Foto terakhir"/>:<Camera/>}{photos.length>0&&<i>{photos.length}</i>}</button></div>{toast}</div>;
  return <div className="guest welcome-screen"><div className="guest-top"><Brand light/><span>UNDANGAN KHUSUS</span></div><div className="guest-cover"><div className="cover-copy"><span>{event.eventType?.toUpperCase()||"SPECIAL EVENT"}</span><h1>{nameParts.map((part,index)=><span key={part}>{index>0&&<><br/><i>&</i> </>}{part}</span>)}</h1><p>{eventDate}</p></div><div className="flower">✦</div></div><section><span className="guest-eyebrow">SELAMAT DATANG</span><h2>ABADIKAN<br/>VERSIMU.</h2><p>Ambil hingga {limit} foto dari sudut pandangmu. Foto akan masuk ke galeri privat dan hanya dapat dilihat oleh pemilik acara.</p><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><i>{consent&&<Check/>}</i><span>Saya setuju foto dikirim kepada pemilik acara.</span></label>{error&&<div className="camera-error">{error}</div>}<button className="open-camera" disabled={!consent} onClick={openCamera}><Camera/> Buka kamera</button><small><LockKeyhole/> Tidak ada galeri publik · Privasi terjaga</small></section>{toast}</div>;
}
