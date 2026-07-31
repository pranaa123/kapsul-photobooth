"use client";
import {useEffect,useState} from "react";

export function DashboardNotice({children}:{children:string}){
  const[visible,setVisible]=useState(true);
  useEffect(()=>{const timer=setTimeout(()=>{setVisible(false);const url=new URL(window.location.href);url.searchParams.delete("drive");window.history.replaceState({},"",url)},4200);return()=>clearTimeout(timer)},[]);
  if(!visible)return null;
  return <div className="dashboard-toast" role="status"><i/>{children}</div>;
}
