import {createAdminClient} from "@/lib/supabase/admin";

export async function cleanupAbandonedUploads(limit=100){
  const admin=createAdminClient();const cutoff=new Date(Date.now()-2*60*60*1000).toISOString();
  const{data:photos,error}=await admin.from("photos").select("id,storage_path,thumbnail_path").eq("status","reserved").lt("created_at",cutoff).limit(limit);
  if(error)throw error;if(!photos?.length)return{released:0};
  const paths=photos.flatMap(photo=>[photo.storage_path,photo.thumbnail_path].filter((path):path is string=>Boolean(path)));
  if(paths.length)await admin.storage.from(process.env.SUPABASE_STORAGE_BUCKET??"event-photos").remove(paths);
  const{data,error:releaseError}=await admin.rpc("release_abandoned_uploads",{p_photo_ids:photos.map(photo=>photo.id)});
  if(releaseError)throw releaseError;return{released:Number(data??0)};
}
