import {createHash} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {syncEventPhotos} from "@/server/sync-event-drive";

export async function POST(request:NextRequest){
  const contentType=request.headers.get("content-type")||"";
  let eventId="",returnTo="/dashboard",authorized=false;
  if(contentType.includes("application/json")){
    const body=await request.json() as {slug?:string;token?:string};
    if(body.slug&&body.token){const hash=createHash("sha256").update(body.token).digest("hex");const{data:event}=await createAdminClient().from("events").select("id").eq("slug",body.slug).eq("public_token_hash",hash).maybeSingle();if(event){eventId=event.id;authorized=true}}
  }else{
    const form=await request.formData();eventId=String(form.get("event")||"");returnTo=`/dashboard?event=${encodeURIComponent(eventId)}&drive=sync`;
    const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(user){const{data:event}=await supabase.from("events").select("id").eq("id",eventId).eq("user_id",user.id).maybeSingle();authorized=Boolean(event)}
  }
  if(!authorized)return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  try{const result=await syncEventPhotos(eventId,6);if(contentType.includes("application/json"))return NextResponse.json(result);return NextResponse.redirect(new URL(returnTo,request.url),303)}catch(error){console.error("Drive sync failed",error);if(contentType.includes("application/json"))return NextResponse.json({error:"Sinkronisasi belum berhasil"},{status:500});return NextResponse.redirect(new URL(`/dashboard?event=${encodeURIComponent(eventId)}&drive=sync-error`,request.url),303)}
}
