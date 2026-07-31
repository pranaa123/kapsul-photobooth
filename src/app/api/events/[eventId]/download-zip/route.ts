import {ZipArchive} from "archiver";
import {PassThrough,Readable} from "node:stream";
import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {decryptDriveToken,downloadDrivePhoto,refreshGoogleAccessToken} from "@/server/google-drive";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;

function safeName(value:string){return value.normalize("NFKD").replace(/[^a-zA-Z0-9 _-]/g,"").trim().replace(/\s+/g,"-").slice(0,80)||"acara"}

export async function HEAD(_request:NextRequest,{params}:{params:Promise<{eventId:string}>}){
  const{eventId}=await params;const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();
  if(!user)return new NextResponse(null,{status:401,headers:{"x-kapsul-error":"Sesi berakhir. Silakan masuk kembali."}});
  const admin=createAdminClient();const{data:event}=await admin.from("events").select("id").eq("id",eventId).eq("user_id",user.id).maybeSingle();
  if(!event)return new NextResponse(null,{status:404,headers:{"x-kapsul-error":"Acara tidak ditemukan."}});
  const{count}=await admin.from("photos").select("id",{count:"exact",head:true}).eq("event_id",event.id).eq("status","uploaded");
  if(!count)return new NextResponse(null,{status:404,headers:{"x-kapsul-error":"Belum ada foto yang dapat diunduh."}});
  return new NextResponse(null,{status:204,headers:{"cache-control":"private, no-store"}})
}

export async function GET(_request:NextRequest,{params}:{params:Promise<{eventId:string}>}){
  const{eventId}=await params;
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Silakan masuk kembali."},{status:401});
  const admin=createAdminClient();
  const{data:event}=await admin.from("events").select("id,name").eq("id",eventId).eq("user_id",user.id).maybeSingle();
  if(!event)return NextResponse.json({error:"Acara tidak ditemukan."},{status:404});
  const since=new Date(Date.now()-60_000).toISOString();
  const{count:recent}=await admin.from("audit_logs").select("id",{count:"exact",head:true}).eq("actor_id",user.id).eq("action","download_event_zip").eq("resource_id",event.id).gte("created_at",since);
  if((recent??0)>0)return NextResponse.json({error:"ZIP sedang disiapkan. Tunggu satu menit sebelum mencoba lagi."},{status:429});
  const{data:photos,error}=await admin.from("photos").select("id,storage_path,drive_file_id,mime_type,created_at,storage_deleted_at").eq("event_id",event.id).eq("status","uploaded").order("created_at",{ascending:true});
  if(error||!photos?.length)return NextResponse.json({error:"Belum ada foto yang dapat diunduh."},{status:404});
  await admin.from("audit_logs").insert({actor_id:user.id,action:"download_event_zip",resource_type:"event",resource_id:event.id,metadata:{photo_count:photos.length}});
  const needsDrive=photos.some(photo=>photo.storage_deleted_at&&photo.drive_file_id);
  let driveAccessToken:string|undefined;
  if(needsDrive){const{data:connection}=await admin.from("event_drive_connections").select("refresh_token_encrypted,status").eq("event_id",event.id).eq("status","connected").maybeSingle();if(connection)driveAccessToken=await refreshGoogleAccessToken(decryptDriveToken(connection.refresh_token_encrypted))}
  const output=new PassThrough();
  const archive=new ZipArchive({zlib:{level:1}});
  archive.pipe(output);
  const bucket=admin.storage.from(process.env.SUPABASE_STORAGE_BUCKET??"event-photos");
  void(async()=>{try{for(const[index,photo]of photos.entries()){
    const extension=photo.mime_type==="image/png"?"png":photo.mime_type==="image/webp"?"webp":"jpg";
    const name=`${String(index+1).padStart(4,"0")}-${photo.id}.${extension}`;
    if(!photo.storage_deleted_at){const{data,error:downloadError}=await bucket.download(photo.storage_path);if(downloadError||!data)throw new Error(`Foto ${index+1} gagal dibaca`);archive.append(Readable.fromWeb(data.stream() as never),{name})}
    else if(photo.drive_file_id&&driveAccessToken){const response=await downloadDrivePhoto(driveAccessToken,photo.drive_file_id);if(!response.body)throw new Error(`Foto ${index+1} tidak memiliki data`);archive.append(Readable.fromWeb(response.body as never),{name})}
    else throw new Error(`Foto ${index+1} belum tersedia untuk ZIP`)
  }await archive.finalize()}catch(error){console.error("ZIP export failed",error);archive.abort();output.destroy(error instanceof Error?error:new Error("ZIP gagal dibuat"))}})();
  return new NextResponse(Readable.toWeb(output) as ReadableStream,{headers:{"content-type":"application/zip","content-disposition":`attachment; filename="kapsul-${safeName(event.name)}.zip"`,"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
}
