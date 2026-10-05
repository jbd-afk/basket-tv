import handler from "vinext/server/fetch-handler";

// This application has no user-specific data. Cache only valid calendar
// responses, never account pages or navigation, to reduce upstream requests.
export default {
 async fetch(request:Request,env:unknown,ctx:ExecutionContext){
  const url=new URL(request.url);
  if(request.method!=="GET"||url.pathname!=="/api/matches")return handler.fetch(request,env,ctx);
  const date=url.searchParams.get("date");
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))return handler.fetch(request,env,ctx);
  const keyUrl=new URL("/api/matches",url.origin);keyUrl.searchParams.set("date",date);
  const key=new Request(keyUrl.toString());
  const cache=(caches as CacheStorage & {default:Cache}).default;
  const cached=await cache.match(key);
  if(cached){const headers=new Headers(cached.headers);headers.set("Cache-Control","private, max-age=120");return new Response(cached.body,{status:cached.status,headers})}
  const response=await handler.fetch(request,env,ctx);
  if(response.ok&&response.headers.get("Content-Type")?.includes("application/json")){
   const headers=new Headers(response.headers);headers.set("Cache-Control","public, max-age=300");headers.delete("Set-Cookie");
   ctx.waitUntil(cache.put(key,new Response(response.clone().body,{status:response.status,headers})).catch(()=>{}));
  }
  return response;
 }
};
