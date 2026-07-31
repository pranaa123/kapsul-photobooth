"use client";
import Link from "next/link";
import {Check,ChevronDown} from "lucide-react";
import {useEffect,useRef,useState} from "react";

type EventOption={id:string;name:string;status:string;photo_count:number};

export function EventSwitcher({events,selectedId}:{events:EventOption[];selectedId:string}){
  const[open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const selected=events.find(item=>item.id===selectedId)!;
  useEffect(()=>{
    function close(event:MouseEvent){if(root.current&&!root.current.contains(event.target as Node))setOpen(false);}
    function escape(event:KeyboardEvent){if(event.key==="Escape")setOpen(false);}
    document.addEventListener("mousedown",close);document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("mousedown",close);document.removeEventListener("keydown",escape);};
  },[]);
  return <div className={`event-switcher${open?" open":""}`} ref={root}>
    <button type="button" aria-expanded={open} onClick={()=>setOpen(value=>!value)}><i/><strong>{selected.name}</strong><ChevronDown/></button>
    {open&&<div className="event-menu"><small>{events.length} ACARA AKTIF</small>{events.map(item=><Link key={item.id} className={item.id===selectedId?"selected":""} href={`/dashboard?event=${item.id}`} onClick={()=>setOpen(false)}><span>{item.name}<i>AKTIF · {item.photo_count} FOTO</i></span>{item.id===selectedId?<Check/>:<span className="event-open">Pilih</span>}</Link>)}</div>}
  </div>;
}
