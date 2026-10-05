// No authenticated pages or match data are stored in a shared browser cache.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("fetch",event=>{
 if(event.request.mode!=="navigate"||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).catch(()=>new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Basket TV · Hors connexion</title><style>body{background:#0c1220;color:#eef2f9;font:18px system-ui;max-width:32rem;margin:15vh auto;padding:24px}h1{color:#ff9545}a{display:inline-block;background:#ff9545;color:#0c1220;padding:12px 20px;border-radius:8px;font-weight:700;text-decoration:none}</style><h1>Basket TV</h1><h2>Vous êtes hors connexion</h2><p>Reconnectez-vous à Internet pour consulter les rencontres et les diffusions actualisées.</p><a href="/">Réessayer</a></html>`,{status:503,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}})));
});
