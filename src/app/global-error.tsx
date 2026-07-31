"use client";
import {useEffect} from "react";

export default function GlobalError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{void fetch("/api/errors/client",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:error.message,source:"global-error",path:location.pathname})})},[error]);
  return <html lang="id"><body><main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f4f1eb",fontFamily:"sans-serif"}}><section style={{maxWidth:520,textAlign:"center"}}><small>KAPSUL · GANGGUAN SEMENTARA</small><h1 style={{fontSize:52,lineHeight:.9}}>HALAMAN BELUM<br/>DAPAT DIMUAT.</h1><p style={{color:"#777",lineHeight:1.6}}>Kesalahan sudah dicatat. Silakan coba kembali tanpa perlu mengulangi foto yang sudah berhasil dikirim.</p><button onClick={reset} style={{border:0,borderRadius:999,background:"#171715",color:"white",padding:"14px 22px",cursor:"pointer"}}>Coba lagi</button></section></main></body></html>
}
