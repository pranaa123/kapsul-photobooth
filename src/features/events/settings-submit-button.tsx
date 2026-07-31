"use client";
import {Save} from "lucide-react";
import {useFormStatus} from "react-dom";

export function SettingsSubmitButton(){const{pending}=useFormStatus();return <button className="settings-save" type="submit" disabled={pending}><Save/>{pending?"Menyimpan...":"Simpan pengaturan"}</button>}
