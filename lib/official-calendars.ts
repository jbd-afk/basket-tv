import snapshot from "./calendar-snapshot.json";
import {parisDate} from "./basket-tv";
import {ForeignBroadcast} from "./foreign-tv";
export type OfficialMatch={id:string;league:string;date:string;home:string;away:string;round:string;source:string;status:string;timeConfirmed:boolean;calendarCheckedAt:string;calendarSnapshot?:boolean;conditional?:boolean;officialEventDate?:string;foreignCandidates?:ForeignBroadcast[]};
const WNBA_SOURCE="https://www.wnba.com/schedule";
const lnbCompetitions={"Betclic Élite":{code:"PROA",division:1,source:"https://lnb.fr/fr/calendar/betclicelite?did=1&abbrev=PROA"},"Élite 2":{code:"PROB",division:2,source:"https://lnb.fr/fr/calendar/elite2?did=2&abbrev=PROB"}};
const rounds:Record<string,string>={"First Round":"Playoffs · premier tour",Semifinals:"Demi-finales",Finals:"Finale",Preseason:"Pré-saison","Regular Season":"Saison régulière"};
export function parseWNBA(j:any,checkedAt:string):OfficialMatch[]{if(!Array.isArray(j.leagueSchedule?.gameDates))throw Error("Calendrier WNBA invalide");return j.leagueSchedule.gameDates.flatMap((d:any)=>d.games||[]).map((g:any)=>{
 const timeConfirmed=!!g.gameDateTimeUTC&&!/TBD|TBA|postpon/i.test(g.gameStatusText||"");const day=String(g.gameDateEst||"").slice(0,10);
 const name=(t:any)=>[t?.teamCity,t?.teamName].filter(Boolean).join(" ")||"Équipe à déterminer";
 const m:OfficialMatch={id:g.gameId,league:"WNBA",date:timeConfirmed?g.gameDateTimeUTC:day+"T12:00:00Z",home:name(g.homeTeam),away:name(g.awayTeam),round:[rounds[g.gameLabel]||g.gameLabel||"Calendrier officiel",String(g.seriesGameNumber||"").replace("Game ","Match ")].filter(Boolean).join(" · "),source:WNBA_SOURCE,status:g.gameStatus===3?"Terminé":g.gameStatus===2?"En cours":"À venir",timeConfirmed,calendarCheckedAt:checkedAt,officialEventDate:day.split("-").reverse().join("/"),conditional:g.ifNecessary===true};
 // Only the explicitly national US TV/OTT listings are assigned to the US.
 const us=[...(g.broadcasters?.nationalTvBroadcasters||[]),...(g.broadcasters?.nationalOttBroadcasters||[])];
 m.foreignCandidates=timeConfirmed?us.filter((b:any)=>b.regionId===1&&b.broadcasterDisplay&&!/^(TBD|TBA)$/i.test(b.broadcasterDisplay)).map((b:any)=>({league:"WNBA",home:m.home,away:m.away,start:m.date,channel:b.broadcasterDisplay,country:"États-Unis",countryCode:"us",live:true,replay:false,source:WNBA_SOURCE,sourceName:"WNBA · calendrier officiel",checkedAt})):[];return m;
 });}
export function parseLNB(j:any,checkedAt:string,league:keyof typeof lnbCompetitions="Betclic Élite"):OfficialMatch[]{const competition=lnbCompetitions[league];if(j.status!==true||!Array.isArray(j.data))throw Error("Calendrier LNB invalide");return j.data.flatMap((d:any)=>d.data||[]).filter((g:any)=>g.competition_abbrev===competition.code&&g.division_external_id===competition.division).map((g:any)=>({id:String(g.match_id),league,date:g.match_time_utc||g.match_date+"T12:00:00Z",home:g.teams?.[0]?.team_name||"Équipe à déterminer",away:g.teams?.[1]?.team_name||"Équipe à déterminer",round:`Journée ${g.round_number}`,source:competition.source,status:g.match_status==="COMPLETE"?"Terminé":g.match_status==="IN_PROGRESS"?"En cours":"À venir",timeConfirmed:!!g.match_time_utc,calendarCheckedAt:checkedAt}));}
async function request(url:string,init:RequestInit={}){const r=await fetch(url,{...init,headers:{"User-Agent":"Mozilla/5.0",...(init.headers||{})},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error("Calendrier indisponible");return r.json() as Promise<any>;}
let guestToken:{value:string;at:number}|undefined;
async function lnbToken(){if(guestToken&&Date.now()-guestToken.at<780000)return guestToken.value;const j=await request("https://lnb.fr/api/token");if(!j.token)throw Error("Accès public LNB indisponible");guestToken={value:j.token,at:Date.now()};return j.token;}
const cache=new Map<string,{at:number;matches:OfficialMatch[]}>();
export async function officialCalendar(league:"WNBA"|keyof typeof lnbCompetitions,date:string){const year=Number(date.slice(0,4))-(league!=="WNBA"&&Number(date.slice(5,7))<7?1:0);const key=league+year;const cached=cache.get(key);if(cached&&Date.now()-cached.at<300000)return {league,state:"ok",matches:cached.matches.filter(m=>parisDate(m.date)===date)};
 try{
  const checkedAt=new Date().toISOString();let matches:OfficialMatch[];
  if(league==="WNBA")matches=parseWNBA(await request("https://cdn.wnba.com/static/json/staticData/scheduleLeagueV2_1.json"),checkedAt);
  else{
   const token=await lnbToken();const body={year,competition_abbrev:lnbCompetitions[league].code,division_external_id:0,team_external_id:0,round_number:0,phase_id:0,tournament_number:0,direction:"initial",limit:1000};
   matches=parseLNB(await request("https://api-prod.lnb.fr/match/v3/getCalendar",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,device_type:"web",language_code:"fr"},body:JSON.stringify(body)}),checkedAt,league);
  }
  cache.set(key,{at:Date.now(),matches});return {league,state:"ok",matches:matches.filter(m=>parisDate(m.date)===date)};
 }catch{
  const matches=(cached?.matches||(snapshot as OfficialMatch[]).filter(m=>m.league===league)).filter(m=>parisDate(m.date)===date).map(m=>({...m,calendarSnapshot:true}));return {league,state:matches.length?"snapshot":"unavailable",matches};
 }
}
