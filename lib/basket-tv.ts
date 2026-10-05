import snapshot from "./tv-snapshot.json";
export type Broadcast={league:string;home:string;away:string;start:string;channel:string;live:boolean;replay:boolean;source:string;sourceName:string;checkedAt:string;round?:string;eventDate?:string;snapshot?:boolean;delayed?:boolean};
export const parisDate=(d:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(d));
const decode=(s:string)=>s.replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==="x"?parseInt(n.slice(1),16):Number(n))).replaceAll("&amp;","&").replaceAll("&apos;","'").replaceAll("&quot;",'"').replaceAll("&nbsp;"," ");
const text=(s:string)=>decode(s.replace(/<[^>]+>/g," ")).replace(/\s+/g," ").trim();
const norm=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\([^)]*\)/g,"").replace(/[^a-z0-9]+/g," ").trim();
const aliases=[
 ["hapoel tel aviv","hapoel ibi tel aviv"],["zalgiris","zalgiris kaunas"],["efes","anadolu efes","anadolu efes istanbul"],
 ["paris","paris basket","paris basketball"],["asvel","lyon villeurbanne","ldlc asvel villeurbanne","ldlc asvel"],["valence","valencia","valencia basket"],
 ["panathinaikos","panathinaikos aktor athens","panathinaikos athens"],["maccabi tel aviv","maccabi playtika tel aviv","maccabi rapyd tel aviv"],
 ["olympiakos","olympiacos","olympiacos piraeus"],["virtus bologna","virtus segafredo bologna","virtus"],["crvena zvezda","crvena zvezda meridianbet belgrade","etoile rouge belgrade","estrella roja"],
 ["toronto","toronto raptors"],["miami","miami heat"],["denver","denver nuggets"],["utah","utah jazz"],["indiana","indiana fever"],["las vegas","las vegas aces"],
 ["bourg en bresse","jl bourg","bourg"],["chalon sur saone","chalon"],["gravelines dunkerque","gravelines"],["le mans","le mans sarthe basket"]
];
export function teamKey(s:string){const n=norm(s);return aliases.find(a=>a.includes(n))?.[0]||n;}
export function leagueOf(s:string){const n=norm(s);if(n.includes("wnba"))return "WNBA";if(/\bnba\b/.test(n))return "NBA";if(n.includes("euroligue")||n.includes("euroleague"))return "EuroLeague";if(/\belite\s*2\b|\bpro\s*b\b/.test(n))return "Élite 2";if(n.includes("betclic")||n.includes("pro a"))return "Betclic Élite";return "";}
export function parisMidnight(date:string){const midnight=new Date(date+"T00:00:00Z");const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Paris",hour:"2-digit",hourCycle:"h23"}).format(midnight));return new Date(midnight.getTime()-hour*3600000).toISOString();}
function isoParis(date:string,time:string){const [h,m]=time.split(":").map(Number);const base=new Date(date+"T"+String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":00Z");const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Paris",hour:"2-digit",hourCycle:"h23"}).format(new Date(date+"T12:00:00Z")));return new Date(base.getTime()-(hour-12)*3600000).toISOString();}
export function parseBein(j:any,checkedAt:string):Broadcast[]{if(!Array.isArray(j.rows))throw Error("Grille invalide");return j.rows.flatMap((r:any)=>{
 const c=r.data?.content;const league=leagueOf(c?.championshipName||r.title||"");const pair=(c?.eventName||"").split(/\s+\/\s+/);const channel=r.channel?.name||r.data?.airingChannel?.name;
 if(!league||pair.length!==2||!r.startDate||!channel)return [];
 return [{league,home:pair[0],away:pair[1],start:r.startDate,channel,live:r.live===true,replay:r.replay===true,delayed:r.live===false,source:"https://www.beinsports.com/fr-fr/tv-guide",sourceName:"beIN SPORTS · grille officielle",checkedAt,round:c?.championshipRound,eventDate:c?.eventDate}];
 });}
const months=["janvier","fevrier","mars","avril","mai","juin","juillet","aout","septembre","octobre","novembre","decembre"];
export function parseMatchsTV(html:string,checkedAt:string):Broadcast[]{const out:Broadcast[]=[];let day="";const ref=new Date(checkedAt);for(const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)){
 const row=match[1];if(row.includes("<h3")){const d=row.match(/\/jour\/(\d{1,2})-([a-z]+)/);if(d){const month=months.indexOf(d[2]);if(month<0){day="";continue;}let year=ref.getUTCFullYear();if(month<ref.getUTCMonth()-6)year++;if(month>ref.getUTCMonth()+6)year--;day=`${year}-${String(month+1).padStart(2,"0")}-${d[1].padStart(2,"0")}`;}continue;}
 if(!day||!row.includes('class="fixture"')||!row.includes('class="live-broadcast"'))continue;
 const title=row.match(/<h4>([\s\S]*?)<\/h4>/)?.[1];const subtitle=text(row.match(/class="subtitle"[^>]*>([\s\S]*?)<\/div>/)?.[1]||"");const league=leagueOf(subtitle);const tm=text(row.match(/class="date"[^>]*>([\s\S]*?)<\/td>/)?.[1]||"").match(/(\d{1,2})h(\d{2})/);if(!league||!title||!tm)continue;
 const pair=text(title).split(/\s+[–—]\s+/);if(pair.length!==2)continue;
 const cell=row.match(/class="channel"[^>]*>([\s\S]*?)<\/td>/)?.[1]||"";
 const channels=[...cell.matchAll(/<img[^>]*title="([^"]+)"/g)].map(m=>text(m[1]));
 for(let channel of channels){if(/^bein/i.test(channel))channel=channel.replace(/^bein sports/i,"beIN SPORTS");out.push({league,home:pair[0].replace(/\s*\([^)]*\)/g,""),away:pair[1].replace(/\s*\([^)]*\)/g,""),start:isoParis(day,tm[1]+":"+tm[2]),channel,live:true,replay:false,source:"https://matchs.tv/sport/basket/",sourceName:"Matchs TV · programme basket",checkedAt,round:subtitle});}
 }if(!html.includes('programme-tv'))throw Error("Programme invalide");return out;}
const CHANNELS=["66265DD1-D2AA-4A89-9412-2455186E90ED","1E886E98-3104-4D8E-A97F-734B23108E8A","6DB008B8-66DA-423E-805D-616211D4B174","EF7E0369-CFD9-4607-9238-EC483E6D58A3","A4425E44-B004-4137-ACB4-458BA4D710F8","BBD26D71-897D-4799-87A1-A87120130D48","9B4708C5-F5F0-452A-8157-4661C30FAE6A","76D2430C-8BCB-41BD-A1DE-FBA0D58C5E8A","FB208953-1C70-4D1E-B918-103AB02AB181","6F425028-14F0-4E38-B776-71A9DB3F3493"];
async function get(url:string){const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json,text/html"},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error("Source indisponible");return r;}
let tvCache=new Map<string,{at:number;value:any}>();
export async function getTV(date:string){const cached=tvCache.get(date);if(cached&&Date.now()-cached.at<300000)return cached.value;
 const checkedAt=new Date().toISOString(),next=new Date(date+"T12:00:00Z");next.setUTCDate(next.getUTCDate()+1);
 const start=parisMidnight(date),end=parisMidnight(next.toISOString().slice(0,10));
 const official=await Promise.allSettled(CHANNELS.map(async id=>parseBein(await(await get(`https://www.beinsports.com/api/opta/tv-event?startBefore=${end}&endAfter=${start}&channelIds=${id}`)).json(),checkedAt)));
 const rows:Broadcast[]=official.flatMap(r=>r.status==="fulfilled"?r.value:[]);let secondary=false;
 try{rows.push(...parseMatchsTV(await(await get("https://matchs.tv/sport/basket/")).text(),checkedAt).filter(b=>parisDate(b.start)===date));secondary=true;}catch{}
 const failed=official.filter(r=>r.status==="rejected").length;
 // A dated verified backup is used only when its source is currently unavailable.
 for(const b of snapshot as Broadcast[]){if(parisDate(b.start)!==date)continue;const officialSource=b.source.includes("beinsports.com");if((officialSource&&failed>0)||(!officialSource&&!secondary)){if(!rows.some(x=>x.channel===b.channel&&x.start===b.start&&teamKey(x.home)===teamKey(b.home)&&teamKey(x.away)===teamKey(b.away)))rows.push({...b,snapshot:true});}}
 const value={broadcasts:rows,checkedAt,officialState:failed===0?"ok":failed===10?"unavailable":"partial",secondaryState:secondary?"ok":"unavailable"};
 tvCache.set(date,{at:Date.now(),value});if(tvCache.size>20)tvCache.delete(tvCache.keys().next().value!);return value;
}
export function broadcastsFor(m:any,rows:Broadcast[]){const candidates=rows.filter(b=>b.league===m.league&&parisDate(b.start)===parisDate(m.date)&&((teamKey(b.home)===teamKey(m.home)&&teamKey(b.away)===teamKey(m.away))||(teamKey(b.away)===teamKey(m.home)&&teamKey(b.home)===teamKey(m.away)))&&((b.live&&(m.timeConfirmed===false||Math.abs(Date.parse(b.start)-Date.parse(m.date))<=90*60000))||(!b.live&&b.eventDate&&(b.eventDate===m.officialEventDate||b.eventDate===new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Paris"}).format(new Date(m.date))))));
 // The official programme takes precedence over an alternate spelling of the same channel.
 return candidates.filter((b,i,a)=>!a.some((x,j)=>j<i&&x.channel===b.channel&&x.start===b.start)&&!(b.sourceName.startsWith("Matchs TV")&&a.some(x=>x.source.includes("beinsports.com")&&x.live&&b.channel.startsWith("beIN")&&x.channel.replace(" MAX","")===b.channel)));
}
