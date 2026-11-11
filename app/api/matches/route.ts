import {officialCalendar} from "../../../lib/official-calendars";
import {espnForeign,chooseForeign,getEuropeanTV} from "../../../lib/foreign-tv";
import {getTV,broadcastsFor,parisDate,teamKey,sameTeam} from "../../../lib/basket-tv";
import {franceMatches} from "../../../lib/france";
import { NextRequest, NextResponse } from "next/server";
const paris=(d:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(d));
async function json(url:string):Promise<any>{const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error("Source indisponible");return r.json();}
export async function GET(req:NextRequest){
 const date=req.nextUrl.searchParams.get("date")||paris(new Date().toISOString());
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))return NextResponse.json({error:"Date invalide"},{status:400});
 const prev=new Date(date+"T12:00:00Z");prev.setUTCDate(prev.getUTCDate()-1);
 const dates=[prev.toISOString().slice(0,10).replaceAll("-",""),date.replaceAll("-","")];
 const checkedAt=new Date().toISOString();
 const jobs=["NBA","EuroLeague"].map(async league=>{
  try{
   let matches:any[]=[];
   if(league==="EuroLeague"){
    const year=Number(date.slice(0,4))-(Number(date.slice(5,7))<7?1:0);
    const j=await json(`https://api-live.euroleague.net/v2/competitions/E/seasons/E${year}/games`);
    if(!Array.isArray(j.data))throw new Error();
    matches=j.data.filter((g:any)=>g.utcDate&&paris(g.utcDate)===date).map((g:any)=>({id:g.identifier,league,date:g.utcDate,home:g.local.club.name,away:g.road.club.name,round:`Journée ${g.round}`,source:"https://www.euroleaguebasketball.net/euroleague/game-center/",status:g.played?"Terminé":"À venir",timeConfirmed:g.confirmedHour}));
   }else{
    const responses=await Promise.allSettled(dates.map(d=>json(`https://site.api.espn.com/apis/site/v2/sports/basketball/${league.toLowerCase()}/scoreboard?dates=${d}`)));
    const valid=responses.filter((r):r is PromiseFulfilledResult<any>=>r.status==="fulfilled"&&Array.isArray(r.value.events));if(!valid.length)throw Error();
    const events=[...new Map(valid.flatMap(r=>r.value.events).map((e:any)=>[e.id,e])).values()] as any[];
    matches=events.filter((e:any)=>paris(e.date)===date).map((e:any)=>{const c=e.competitions[0];const m:any={id:e.id,league,date:e.date,home:c.competitors.find((t:any)=>t.homeAway==="home")?.team.displayName,away:c.competitors.find((t:any)=>t.homeAway==="away")?.team.displayName,round:e.season?.type===3?"Playoffs":"Calendrier",source:e.links?.[0]?.href||`https://www.espn.com/${league.toLowerCase()}/schedule`,status:e.status?.type?.completed?"Terminé":e.status?.type?.state==="in"?"En cours":"À venir",timeConfirmed:c.timeValid!==false};m.foreignCandidates=espnForeign(c,m,checkedAt);return m;});
   }
   return {league,state:"ok",matches};
  }catch{return {league,state:"unavailable",matches:[]};}
 });
 const [base,tv,europe,wnba,lnb,elite2]=await Promise.all([Promise.all(jobs),getTV(date),getEuropeanTV(date),officialCalendar("WNBA",date),officialCalendar("Betclic Élite",date),officialCalendar("Élite 2",date)]);
 const results:any[]=[lnb,elite2,...base.filter(r=>r.league==="EuroLeague"),...base.filter(r=>r.league==="NBA"),wnba];
 // Équipe de France : source en test (construite plus bas, après les fusions TV).
 const france=franceMatches(date);
 for(const group of results)for(const m of group.matches)m.broadcasts=broadcastsFor(m,tv.broadcasts);
 // Fusion tolérante : rattacher une diffusion non reconnue au match officiel correspondant
 // au lieu de créer une entrée dupliquée "Programme TV" (doublons du type 1er novembre).
 const shareTeam=(m:any,b:any)=>[m.home,m.away].some(x=>sameTeam(x,b.home)||sameTeam(x,b.away));
 for(const b of tv.broadcasts.filter((x:any)=>x.live&&parisDate(x.start)===date)){
  const group=results.find(r=>r.league===b.league);if(!group)continue;
  if(group.matches.some((m:any)=>broadcastsFor(m,[b]).length))continue;
  const near=group.matches.filter((m:any)=>!m.tvOnly&&parisDate(m.date)===parisDate(b.start)&&Math.abs(Date.parse(m.date)-Date.parse(b.start))<=4*3600000);
  const fallback=near.filter((m:any)=>!(m.broadcasts||[]).length);
  const target=near.find((m:any)=>shareTeam(m,b))||(fallback.length===1?fallback[0]:undefined);
  if(target){const aligned=target.timeConfirmed&&Math.abs(Date.parse(b.start)-Date.parse(target.date))>15*60000?{...b,start:target.date}:b;if(!(target.broadcasts=target.broadcasts||[]).some((x:any)=>x.channel===aligned.channel&&x.start===aligned.start))target.broadcasts.push(aligned);continue;}
  const match:any={id:`tv-${b.league}-${teamKey(b.home)}-${teamKey(b.away)}-${b.start}`,league:b.league,date:b.start,home:b.home,away:b.away,round:b.round||"Programme TV",source:b.source,status:"À venir",timeConfirmed:true,tvOnly:true,broadcasts:[]};
  match.broadcasts=broadcastsFor(match,tv.broadcasts);group.matches.push(match);
 }
 // LNB TV : plateforme gratuite de la LNB, diffuse les matchs français non repris par une chaîne.
 for(const group of results.filter(r=>r.league==="Betclic Élite"||r.league==="Élite 2"))for(const m of group.matches){
  if((m.broadcasts||[]).some((b:any)=>b.live))continue;
  m.broadcasts.push({league:m.league,home:m.home,away:m.away,start:m.date,channel:"LNB TV",live:true,replay:false,source:"https://www.lnb.tv/",sourceName:"LNB TV · plateforme officielle LNB",checkedAt});
 }
 // Équipe de France : section affichée uniquement les jours de match (source en test).
 // Construite après les fusions TV pour ne pas écraser les diffusions du fichier de données ;
 // les diffusions détectées automatiquement (ex. Matchs TV) viennent s'ajouter.
 if(france.today.length){const fg:any={league:"Équipe de France",state:"ok",matches:france.today.map((m:any)=>({id:m.id,league:"Équipe de France",date:m.date,home:m.home,away:m.away,round:m.round+" · Équipe "+m.side,source:m.source,status:m.status,timeConfirmed:m.timeConfirmed,broadcasts:m.broadcast?[{league:"Équipe de France",home:m.home,away:m.away,start:m.date,channel:m.broadcast.channel,live:m.broadcast.live,replay:false,source:m.broadcast.source,sourceName:m.broadcast.sourceName,checkedAt:m.checkedAt}]:[]}))};
  for(const m of fg.matches)for(const b of broadcastsFor(m,tv.broadcasts))if(!m.broadcasts.some((x:any)=>x.channel===b.channel))m.broadcasts.push(b);
  results.push(fg);}
 for(const group of results)for(const m of group.matches){m.foreignBroadcasts=chooseForeign(m,[...(m.foreignCandidates||[]),...europe.broadcasts]);delete m.foreignCandidates;}
 results.forEach(r=>r.matches.sort((a:any,b:any)=>Date.parse(a.date)-Date.parse(b.date)));
 return NextResponse.json({date,updatedAt:new Date().toISOString(),results,tvState:tv.officialState,tvSources:{official:tv.officialState,secondary:tv.secondaryState},foreignSources:{europe:europe.state,northAmerica:"ESPN · selon les données du match"},tvCheckedAt:tv.checkedAt,franceUpcoming:france.upcoming},{headers:{"Cache-Control":"private, max-age=120"}});
}
