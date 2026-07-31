import {NextRequest,NextResponse} from "next/server";
import {cleanupExpiredSupabaseMasters} from "@/server/storage-retention";
import {cleanupAbandonedUploads} from "@/server/abandoned-uploads";

export const maxDuration=60;
export async function GET(request:NextRequest){
  const secret=process.env.CRON_SECRET;
  if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});
  try{const[retention,abandoned]=await Promise.all([cleanupExpiredSupabaseMasters(100),cleanupAbandonedUploads(100)]);return NextResponse.json({retention,abandoned})}catch(error){console.error("Storage cleanup failed",error);return NextResponse.json({error:"Cleanup failed"},{status:500})}
}
