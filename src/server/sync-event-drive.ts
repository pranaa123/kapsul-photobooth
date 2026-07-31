import {createAdminClient} from "@/lib/supabase/admin";
import {decryptDriveToken,findDrivePhoto,refreshGoogleAccessToken,uploadPhotoToDrive} from "@/server/google-drive";

export async function syncEventPhotos(eventId:string,limit=6){
  const admin=createAdminClient();
  const{data:connection,error:connectionError}=await admin.from("event_drive_connections").select("refresh_token_encrypted,folder_id,status").eq("event_id",eventId).maybeSingle();
  if(connectionError||!connection||connection.status!=="connected")return{synced:0,pending:0,connected:false};
  const{data:photos,error:photoError}=await admin.rpc("claim_drive_sync_photos",{p_event_id:eventId,p_limit:Math.max(1,Math.min(limit,10))});
  if(photoError)throw photoError;
  if(!photos?.length)return{synced:0,pending:0,connected:true};
  const accessToken=await refreshGoogleAccessToken(decryptDriveToken(connection.refresh_token_encrypted));
  const bucket=admin.storage.from(process.env.SUPABASE_STORAGE_BUCKET??"event-photos");
  let synced=0;
  for(const photo of photos){
    try{
      const{data:blob,error}=await bucket.download(photo.storage_path);
      if(error||!blob)throw error||new Error("File Supabase tidak ditemukan");
      const stamp=new Date(photo.created_at).toISOString().replaceAll(":","-");
      const fileName=`kapsul-${stamp}-${photo.id}.jpg`;
      const existing=await findDrivePhoto(accessToken,connection.folder_id,fileName,photo.id);
      const file=existing??await uploadPhotoToDrive({accessToken,folderId:connection.folder_id,fileName,photoId:photo.id,blob,mimeType:photo.mime_type||"image/jpeg"});
      await admin.from("photos").update({drive_file_id:file.id,drive_synced_at:new Date().toISOString(),drive_sync_status:"synced",drive_sync_started_at:null,drive_sync_error:null}).eq("id",photo.id);
      synced++;
    }catch(error){
      const message=error instanceof Error?error.message:"Sinkronisasi gagal";
      await admin.from("photos").update({drive_sync_status:"failed",drive_sync_started_at:null,drive_sync_error:message.slice(0,500)}).eq("id",photo.id);
    }
  }
  const{count}=await admin.from("photos").select("id",{count:"exact",head:true}).eq("event_id",eventId).eq("status","uploaded").is("drive_file_id",null);
  return{synced,pending:count??0,connected:true};
}

export async function syncAllEventPhotos(eventId:string,maxBatches=12){
  let total=0,pending=0,connected=true;
  for(let batch=0;batch<maxBatches;batch++){
    const result=await syncEventPhotos(eventId,6);
    total+=result.synced;pending=result.pending;connected=result.connected;
    if(!connected||pending===0||result.synced===0)break;
  }
  return{synced:total,pending,connected};
}
