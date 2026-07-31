import {NextRequest,NextResponse} from "next/server";
import {cleanupExpiredSupabaseMasters} from "@/server/storage-retention";

export const maxDuration=60;
export async function GET(request:NextRequest){
  const secret=process.env.CRON_SECRET;
  if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"Unauthorized"},{status:401});
  try{return NextResponse.json(await cleanupExpiredSupabaseMasters(100))}catch(error){console.error("Storage retention cleanup failed",error);return NextResponse.json({error:"Cleanup failed"},{status:500})}
}

