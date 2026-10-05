import foreignSnapshot from "./foreign-snapshot.json";
import {Broadcast,parisDate,broadcastsFor,leagueOf} from "./basket-tv";
export type ForeignBroadcast=Broadcast&{country:string;countryCode:string;market?:string};
const COUNTRIES:Record<string,string>={us:"États-Unis",ca:"Canada",gb:"Royaume-Uni",uk:"Royaume-Uni",es:"Espagne",de:"Allemagne",it:"Italie",gr:"Grèce",rs:"Serbie",tr:"Turquie",lt:"Lituanie",pt:"Portugal",be:"Belgique",ch:"Suisse",nl:"Pays-Bas",at:"Autriche",pl:"Pologne",hr:"Croatie",si:"Slovénie",cz:"Tchéquie",se:"Suède",fi:"Finlande",dk:"Danemark",no:"Norvège",ie:"Irlande",ro:"Roumanie",bg:"Bulgarie",hu:"Hongrie",mc:"Monaco"};
export function espnForeign(competition:any,match:any,checkedAt:string):ForeignBroadcast[]{const out:ForeignBroadcast[]=[];for(const b of competition.geoBroadcasts||[]){const code=String(b.region||"").toLowerCase();const country=COUNTRIES[code];const channel=b.media?.shortName;if(!country||!channel||out.some(x=>x.countryCode===code&&x.channel===channel))continue;out.push({league:match.league,home:match.home,away:match.away,start:match.date,channel,country,countryCode:code,live:true,replay:false,source:match.source,sourceName:"ESPN · calendrier et diffusion",checkedAt,market:b.market?.type});}return out;}
export function chooseForeign(match:any,rows:ForeignBroadcast[]){if(match.broadcasts?.some((b:Broadcast)=>b.live))return [];return broadcastsFor(match,rows) as ForeignBroadcast[];}

const SPAIN_CHANNELS:Record<string,string>={MPLUS:"Movistar Plus",VAMOSD:"M+ Vamos",VAM2SD:"M+ Vamos 2",MELLAV:"M+ Vamos 3",CPDEP:"M+ Deportes",ARTHUR:"M+ Deportes 2",USOP2:"M+ Deportes 3",MBALCT:"M+ Baloncesto",MBALC2:"M+ Baloncesto 2",DAZBA:"DAZN Baloncesto",DAZB2:"DAZN Baloncesto 2",DAZB3:"DAZN Baloncesto 3",USOP3:"M+ Deportes 4",USOP11:"M+ Deportes 5",MULTI8:"M+ Deportes 6",MBALC3:"M+ Baloncesto 3",MBALC4:"M+ Baloncesto 4",MBALC5:"M+ Baloncesto 5"};
export function parseMovistar(j:any,channelId:string,checkedAt:string):ForeignBroadcast[]{if(!Array.isArray(j))throw Error("Grille invalide");return j.flatMap((e:any)=>{
 const league=leagueOf(String(e.Titulo||"").replace(/euroliga/gi,"EuroLeague"));
 if(!league||e.Directo!==true||/previa|post|resumen/i.test(e.Titulo||""))return [];
 const pair=String(e.TituloEpisodio||"").replace(/["“”]/g,"").replace(/\s*\([^)]*\)/g,"").split(/\s+[-–—]\s+/);
 const ms=Number(e.FechaHoraInicio);if(pair.length!==2||!Number.isFinite(ms)||!SPAIN_CHANNELS[channelId])return [];
 return [{league,home:pair[0].trim(),away:pair[1].trim(),start:new Date(ms).toISOString(),channel:SPAIN_CHANNELS[channelId],country:"Espagne",countryCode:"es",live:true,replay:false,source:`https://www.movistarplus.es/programacion-tv/${channelId.toLowerCase()}`,sourceName:"Movistar Plus+ · grille officielle",checkedAt}];
 });}
const foreignCache=new Map<string,{at:number;value:any}>();
export async function getEuropeanTV(date:string){const old=foreignCache.get(date);if(old&&Date.now()-old.at<300000)return old.value;const checkedAt=new Date().toISOString();
 const results=await Promise.allSettled(Object.keys(SPAIN_CHANNELS).map(async channel=>{
  const url=`https://ottcache.dof6.com/movistarplus/webplayer/OTT/epg?from=${date}T00:00:00&span=1&channel=${channel}&version=8&mdrm=true&tlsstream=true&demarcation=18`;
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Referer":"https://www.movistarplus.es/programacion-tv"},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();return parseMovistar(await r.json(),channel,checkedAt).filter(b=>parisDate(b.start)===date);
 }));
 const broadcasts:ForeignBroadcast[]=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);const failed=results.filter(r=>r.status==="rejected").length;
 if(failed)for(const b of foreignSnapshot as ForeignBroadcast[])if(parisDate(b.start)===date&&!broadcasts.some(x=>x.channel===b.channel&&x.start===b.start))broadcasts.push({...b,snapshot:true});
 const value={broadcasts,state:failed===0?"ok":failed===results.length?"unavailable":"partial",checkedAt};foreignCache.set(date,{at:Date.now(),value});if(foreignCache.size>20)foreignCache.delete(foreignCache.keys().next().value!);return value;
}
