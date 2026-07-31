import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function POST(request:NextRequest){const form=await request.formData();const eventId=String(form.get("event")||"");const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.redirect(new URL("/login",request.url),303);await supabase.from("event_drive_connections").delete().eq("event_id",eventId).eq("user_id",user.id);return NextResponse.redirect(new URL(`/dashboard?event=${encodeURIComponent(eventId)}&drive=disconnected`,request.url),303)}
