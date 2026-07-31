import {createAdminClient} from "@/lib/supabase/admin";
import {decryptDriveToken,listDriveFolderFiles,refreshGoogleAccessToken} from "@/server/google-drive";

export async function inspectDriveDuplicates(eventId:string){
  const admin=createAdminClient();
  const[{data:connection,error},{data:photos}]=await Promise.all([
    admin.from("event_drive_connections").select("refresh_token_encrypted,folder_id").eq("event_id",eventId).eq("status","connected").maybeSingle(),
    admin.from("photos").select("id,drive_file_id").eq("event_id",eventId).not("drive_file_id","is",null)
  ]);
  if(error||!connection)throw new Error("Google Drive belum terhubung");
  const accessToken=await refreshGoogleAccessToken(decryptDriveToken(connection.refresh_token_encrypted));
  const files=await listDriveFolderFiles(accessToken,connection.folder_id);
  const officialIds=new Set((photos??[]).map(photo=>photo.drive_file_id).filter(Boolean) as string[]);
  const byName=new Map<string,typeof files>();
  for(const file of files)byName.set(file.name,[...(byName.get(file.name)??[]),file]);
  const groups=[...byName.entries()].filter(([,items])=>items.length>1).map(([name,items])=>{const official=items.find(item=>officialIds.has(item.id));return{name,items,official,removable:official?items.filter(item=>item.id!==official.id):[]}});
  return{accessToken,folderId:connection.folder_id,totalFiles:files.length,groups,duplicateCount:groups.reduce((sum,group)=>sum+group.removable.length,0),unresolvedCount:groups.filter(group=>!group.official).length};
}
