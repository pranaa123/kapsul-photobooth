"use client";
import {useState} from "react";
import {Download,LoaderCircle} from "lucide-react";

export function DownloadZipButton({eventId,disabled=false,compact=false}:{eventId:string;disabled?:boolean;compact?:boolean}){
  const[loading,setLoading]=useState(false);
  function download(){if(loading||disabled)return;setLoading(true);window.location.assign(`/api/events/${encodeURIComponent(eventId)}/download-zip`);window.setTimeout(()=>setLoading(false),5000)}
  return <button className={`download-zip${compact?" compact":""}`} type="button" disabled={disabled||loading} onClick={download}>{loading?<LoaderCircle className="spin"/>:<Download/>}{loading?"Menyiapkan…":"Unduh semua (ZIP)"}</button>
}
