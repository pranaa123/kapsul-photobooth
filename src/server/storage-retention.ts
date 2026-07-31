import {createAdminClient} from "@/lib/supabase/admin";

export async function cleanupExpiredSupabaseMasters(limit=100){
  const admin=createAdminClient();
  const{data:photos,error}=await admin.from("photos").select("id,storage_path,thumbnail_path,drive_file_id,storage_delete_after").not("drive_file_id","is",null).not("thumbnail_path","is",null).is("storage_deleted_at",null).lte("storage_delete_after",new Date().toISOString()).order("storage_delete_after",{ascending:true}).limit(Math.max(1,Math.min(limit,200)));
  if(error)throw error;
  if(!photos?.length)return{deleted:0};
  const bucket=admin.storage.from(process.env.SUPABASE_STORAGE_BUCKET??"event-photos");
  let deleted=0;
  for(const photo of photos){
    if(!photo.drive_file_id||!photo.thumbnail_path)continue;
    const{error:removeError}=await bucket.remove([photo.storage_path]);
    if(removeError)continue;
    const{error:updateError}=await admin.from("photos").update({storage_deleted_at:new Date().toISOString()}).eq("id",photo.id).not("drive_file_id","is",null).not("thumbnail_path","is",null).is("storage_deleted_at",null);
    if(!updateError)deleted++;
  }
  return{deleted};
}

