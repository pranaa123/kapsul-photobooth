"use client";
import {useState} from "react";
import {Download,LoaderCircle} from "lucide-react";

export function DownloadZipButton({eventId,disabled=false}:{eventId:string;disabled?:boolean}){
  const[loading,setLoading]=useState(false);
  function download(){if(loading||disabled)return;setLoading(true);window.location.assign(`/api/events/${encodeURIComponent(eventId)}/download-zip`);window.setTimeout(()=>setLoading(false),5000)}
  return <button className="download-zip" type="button" disabled={disabled||loading} onClick={download}>{loading?<LoaderCircle className="spin"/>:<Download/>}{loading?"Menyiapkan ZIP…":"Unduh semua (ZIP)"}</button>
}
