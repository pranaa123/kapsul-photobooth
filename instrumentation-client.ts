function report(message:string,source:string){try{const key="kapsul:last-client-error";const last=Number(sessionStorage.getItem(key)||0);if(Date.now()-last<10_000)return;sessionStorage.setItem(key,String(Date.now()));const body=JSON.stringify({message:message.slice(0,500),source:source.slice(0,120),path:location.pathname});navigator.sendBeacon("/api/errors/client",new Blob([body],{type:"application/json"}))}catch{}}
window.addEventListener("error",event=>report(event.message||"Client error",event.filename||"browser"));
window.addEventListener("unhandledrejection",event=>report(event.reason instanceof Error?event.reason.message:String(event.reason||"Unhandled rejection"),"promise"));
export function onRouterTransitionStart(){}
