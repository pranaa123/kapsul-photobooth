import {createClient} from "@supabase/supabase-js";
import {createHash,randomBytes,randomUUID} from "node:crypto";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret=process.env.SUPABASE_SECRET_KEY;
const site=process.env.SMOKE_SITE_URL||process.env.NEXT_PUBLIC_APP_URL||"https://kapsul-photobooth.vercel.app";
if(!url||!publishable||!secret)throw new Error("Supabase environment belum lengkap");
const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const guest=createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false}});
const suffix=Date.now().toString(36);
const orderId=randomUUID(),eventId=randomUUID(),clientPhotoId=randomUUID();
const slug=`kapsul-smoke-${suffix}`,token=randomBytes(32).toString("hex"),deviceToken=randomBytes(40).toString("hex");
let storagePaths=[];
const checks=[];
function ok(name,value=true){if(!value)throw new Error(`Gagal: ${name}`);checks.push(name)}

try{
  const[{data:profile,error:profileError},{data:pkg,error:packageError}]=await Promise.all([
    admin.from("profiles").select("id").limit(1).single(),admin.from("packages").select("id").eq("is_active",true).limit(1).single()
  ]);
  if(profileError||packageError||!profile||!pkg)throw profileError||packageError||new Error("Profil/paket uji tidak tersedia");
  let result=await admin.from("orders").insert({id:orderId,user_id:profile.id,package_id:pkg.id,order_number:`SMOKE-${suffix}`,total:0,payment_status:"PAID"});if(result.error)throw result.error;
  result=await admin.from("events").insert({id:eventId,user_id:profile.id,order_id:orderId,public_token:token,public_token_hash:"temporary-trigger-value",slug,name:`Kapsul Smoke Test ${suffix}`,starts_at:new Date().toISOString(),upload_ends_at:new Date(Date.now()+3600000).toISOString(),status:"active",max_devices:5,max_photos:20,max_photos_per_device:10,branding:{event_type:"Automated QA"}});if(result.error)throw result.error;
  const publicPage=await fetch(`${site}/e/${slug}?t=${token}`,{redirect:"manual"});ok("tautan tamu dapat dibuka",publicPage.status===200);
  const publicEvent=await guest.rpc("get_public_event",{p_slug:slug,p_token:token});if(publicEvent.error)throw publicEvent.error;ok("token QR membaca acara yang tepat",publicEvent.data?.id===eventId);
  const invalid=await guest.rpc("reserve_guest_uploads",{p_slug:slug,p_token:token,p_device_token:deviceToken,p_photos:[{clientPhotoId,fileHash:"invalid",byteSize:10}]});ok("payload foto palsu ditolak",Boolean(invalid.error));
  const jpeg=Buffer.concat([Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q==","base64"),Buffer.alloc(1200)]);
  const fileHash=createHash("sha256").update(jpeg).digest("hex");
  const reservation=await guest.rpc("reserve_guest_uploads",{p_slug:slug,p_token:token,p_device_token:deviceToken,p_photos:[{clientPhotoId,fileHash,byteSize:jpeg.length}]});if(reservation.error)throw reservation.error;
  const upload=reservation.data.uploads[0];storagePaths=[upload.storagePath,upload.thumbnailStoragePath];ok("reservasi upload berhasil",Boolean(upload.photoId));
  const rapid=await guest.rpc("reserve_guest_uploads",{p_slug:slug,p_token:token,p_device_token:deviceToken,p_photos:[{clientPhotoId:randomUUID(),fileHash:createHash("sha256").update("rapid").digest("hex"),byteSize:1200}]});ok("spam cepat ditolak",rapid.error?.message?.includes("Please wait"));
  const bucket=guest.storage.from(process.env.SUPABASE_STORAGE_BUCKET||"event-photos");
  const master=await bucket.upload(upload.storagePath,jpeg,{contentType:"image/jpeg",upsert:false});if(master.error)throw master.error;
  const thumb=await bucket.upload(upload.thumbnailStoragePath,jpeg,{contentType:"image/webp",upsert:false});if(thumb.error)throw thumb.error;ok("master dan thumbnail tersimpan");
  const completeArgs={p_slug:slug,p_token:token,p_device_token:deviceToken,p_photo_ids:[upload.photoId],p_guest_name:"Kapsul QA",p_message:"Pesan uji otomatis"};
  const completed=await guest.rpc("complete_guest_submission",completeArgs);if(completed.error)throw completed.error;
  const retry=await guest.rpc("complete_guest_submission",completeArgs);if(retry.error)throw retry.error;
  const[{data:event},{data:photo},{count:messages}]=await Promise.all([
    admin.from("events").select("photo_count,device_count").eq("id",eventId).single(),admin.from("photos").select("status").eq("id",upload.photoId).single(),admin.from("guest_messages").select("id",{count:"exact",head:true}).eq("event_id",eventId)
  ]);
  ok("foto selesai diproses",photo?.status==="uploaded");ok("hitungan acara akurat",event?.photo_count===1&&event?.device_count===1);ok("retry tidak menggandakan ucapan",messages===1);
  for(const activity of["page_view","camera_granted","photo_started","submit_success"]){const tracked=await guest.rpc("track_guest_activity",{p_slug:slug,p_token:token,p_device_token:deviceToken,p_activity_type:activity});if(tracked.error)throw tracked.error}ok("analitik privat tercatat");
  console.log(JSON.stringify({success:true,checks},null,2));
}finally{
  if(storagePaths.length)await admin.storage.from(process.env.SUPABASE_STORAGE_BUCKET||"event-photos").remove(storagePaths);
  await admin.from("events").delete().eq("id",eventId);await admin.from("orders").delete().eq("id",orderId);
}
