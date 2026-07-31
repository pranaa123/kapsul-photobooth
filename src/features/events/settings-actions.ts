"use server";

import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";

export async function updateEventSettings(formData:FormData){
  const eventId=String(formData.get("eventId")||"");
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login?next=/dashboard");
  const{data:event}=await supabase.from("events").select("id,user_id,order_id,branding,max_photos_per_device").eq("id",eventId).eq("user_id",user.id).maybeSingle();
  if(!event)redirect("/dashboard?settings=forbidden");
  const{data:order}=await supabase.from("orders").select("package_id").eq("id",event.order_id).maybeSingle();
  const{data:pkg}=order?await supabase.from("packages").select("max_photos_per_device").eq("id",order.package_id).maybeSingle():{data:null};
  const packageLimit=pkg?.max_photos_per_device??event.max_photos_per_device;
  const requestedLimit=Number(formData.get("maxPhotosPerDevice")||event.max_photos_per_device);
  const maxPhotosPerDevice=Math.max(1,Math.min(packageLimit,Number.isFinite(requestedLimit)?requestedLimit:event.max_photos_per_device));
  const name=String(formData.get("name")||"").trim().slice(0,100);
  const uploadEndsAt=String(formData.get("uploadEndsAt")||"");
  const status=String(formData.get("status")||"paused");
  const branding={...(event.branding as Record<string,unknown>??{}),welcome_message:String(formData.get("welcomeMessage")||"").trim().slice(0,300),completion_message:String(formData.get("completionMessage")||"").trim().slice(0,300),allow_messages:formData.get("allowMessages")==="on"};
  const parsedUploadEnd=uploadEndsAt?new Date(uploadEndsAt):null;
  if(parsedUploadEnd&&Number.isNaN(parsedUploadEnd.valueOf()))redirect(`/dashboard/settings?event=${encodeURIComponent(event.id)}&saved=invalid-date`);
  const{data:updated,error}=await supabase.from("events").update({name:name||"Acara",status:["active","paused","ended"].includes(status)?status:"paused",upload_ends_at:parsedUploadEnd?.toISOString()??null,max_photos_per_device:maxPhotosPerDevice,branding}).eq("id",event.id).eq("user_id",user.id).select("id").maybeSingle();
  if(!error&&updated){revalidatePath("/dashboard");revalidatePath("/dashboard/settings");revalidatePath("/e/[slug]","page")}
  redirect(`/dashboard/settings?event=${encodeURIComponent(event.id)}&saved=${error?"error":"yes"}`);
}

export async function rotateEventToken(formData:FormData){
  const eventId=String(formData.get("eventId")||"");
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=/dashboard");
  const token=crypto.randomUUID().replaceAll("-","")+crypto.randomUUID().replaceAll("-","");
  const{error}=await supabase.from("events").update({public_token:token}).eq("id",eventId).eq("user_id",user.id);
  if(!error){revalidatePath("/dashboard");revalidatePath("/dashboard/settings")}
  redirect(`/dashboard/settings?event=${encodeURIComponent(eventId)}&rotated=${error?"error":"yes"}`);
}
