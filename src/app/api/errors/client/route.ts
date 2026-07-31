import * as Sentry from "@sentry/nextjs";
import {NextRequest,NextResponse} from "next/server";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  const origin=request.headers.get("origin");if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({ok:false},{status:403});
  if(!request.headers.get("content-type")?.includes("application/json"))return NextResponse.json({ok:false},{status:415});
  try{const body=await request.json() as {message?:unknown;source?:unknown;path?:unknown};const message=String(body.message??"").slice(0,500);if(!message)return NextResponse.json({ok:false},{status:400});Sentry.captureMessage(message,{level:"error",tags:{source:String(body.source??"browser").slice(0,120)},extra:{path:String(body.path??"").slice(0,240)}});return NextResponse.json({ok:true})}catch{return NextResponse.json({ok:false},{status:400})}
}
