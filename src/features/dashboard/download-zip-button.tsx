"use client";
import {useState} from "react";
import {Download,LoaderCircle} from "lucide-react";

export function DownloadZipButton({eventId,disabled=false,compact=false}:{eventId:string;disabled?:boolean;compact?:boolean}){
  const[loading,setLoading]=useState(false);
  const[notice,setNotice]=useState("");
  async function download(){if(loading||disabled)return;setLoading(true);setNotice("Memeriksa kesiapan foto…");try{const url=`/api/events/${encodeURIComponent(eventId)}/download-zip`;const response=await fetch(url,{method:"HEAD"});if(!response.ok)throw new Error(response.headers.get("x-kapsul-error")||"ZIP belum dapat dibuat. Coba beberapa saat lagi.");setNotice("ZIP sedang dibuat. Unduhan akan segera dimulai.");window.location.assign(url);window.setTimeout(()=>{setLoading(false);setNotice("")},5000)}catch(error){setLoading(false);setNotice(error instanceof Error?error.message:"ZIP gagal disiapkan.");window.setTimeout(()=>setNotice(""),4500)}}
  return <>{<button className={`download-zip${compact?" compact":""}`} type="button" disabled={disabled||loading} onClick={()=>void download()}>{loading?<LoaderCircle className="spin"/>:<Download/>}{loading?"Menyiapkan…":"Unduh semua (ZIP)"}</button>}{notice&&<span className="zip-toast" role="status"><i/>{notice}</span>}</>
}
