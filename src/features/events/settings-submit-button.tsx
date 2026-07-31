"use client";
import {ArrowRight,LoaderCircle,Save} from "lucide-react";
import {useFormStatus} from "react-dom";

export function SettingsSubmitButton(){const{pending}=useFormStatus();return <button className={`settings-save${pending?" is-loading":""}`} type="submit" disabled={pending}>{pending?<LoaderCircle className="spin"/>:<Save/>}<span>{pending?"Menyimpan...":"Simpan pengaturan"}</span>{!pending&&<ArrowRight className="settings-arrow"/>}</button>}
