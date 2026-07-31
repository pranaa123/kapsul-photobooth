"use client";
import {useEffect,useState} from "react";
function format(end:string){const left=Math.max(0,new Date(end).getTime()-Date.now());const hours=Math.floor(left/3600000);const minutes=Math.floor(left%3600000/60000);const seconds=Math.floor(left%60000/1000);return`${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`}
export function EventCountdown({endsAt}:{endsAt:string|null}){const[value,setValue]=useState(endsAt?format(endsAt):"—");useEffect(()=>{if(!endsAt)return;const update=()=>setValue(format(endsAt));update();const timer=setInterval(update,1000);return()=>clearInterval(timer)},[endsAt]);return <strong>{value}</strong>}
