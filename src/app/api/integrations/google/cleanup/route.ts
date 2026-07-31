import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {inspectDriveDuplicates} from "@/server/drive-duplicates";
import {trashDriveFile} from "@/server/google-drive";

export const maxDuration=60;
export async function POST(request:NextRequest){const form=await request.formData();const eventId=String(form.get("event")||"");const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.redirect(new URL("/login",request.url),303);const{data:event}=await supabase.from("events").select("id").eq("id",eventId).eq("user_id",user.id).maybeSingle();if(!event)return NextResponse.json({error:"Tidak diizinkan"},{status:403});const report=await inspectDriveDuplicates(event.id);for(const group of report.groups)for(const duplicate of group.removable)await trashDriveFile(report.accessToken,duplicate.id);return NextResponse.redirect(new URL(`/dashboard/drive-cleanup?event=${encodeURIComponent(event.id)}&cleaned=${report.duplicateCount}`,request.url),303)}
