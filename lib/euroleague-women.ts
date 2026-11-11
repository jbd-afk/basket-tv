// Euroligue féminine : tentative sur l'API publique d'Euroleague Basketball
// (la même que l'Euroligue masculine). Les codes compétition "EW" puis "W"
// sont essayés ; si l'un renvoie des données, la section s'affiche.
// Tant qu'aucun code ne renvoie de matchs, la section reste simplement absente.
import {parisDate} from "./basket-tv";
export async function euroleagueWomen(date:string){
 const year=Number(date.slice(0,4))-(Number(date.slice(5,7))<7?1:0);
 for(const comp of ["EW","W"]){
  try{
   const r=await fetch(`https://api-live.euroleague.net/v2/competitions/${comp}/seasons/${comp}${year}/games`,{headers:{"User-Agent":"Mozilla/5.0","Accept":"application/json"},signal:AbortSignal.timeout(12000)});
   if(!r.ok)continue;
   const j=await r.json() as any;
   if(!Array.isArray(j.data)||!j.data.length)continue;
   return {league:"EuroLeague féminine",state:"ok",matches:j.data.filter((g:any)=>g.utcDate&&parisDate(g.utcDate)===date).map((g:any)=>({id:String(g.identifier),league:"EuroLeague féminine",date:g.utcDate,home:g.local?.club?.name||"Équipe à déterminer",away:g.road?.club?.name||"Équipe à déterminer",round:`Journée ${g.round}`,source:"https://www.euroleaguebasketball.net/euroleaguewomen/",status:g.played?"Terminé":"À venir",timeConfirmed:g.confirmedHour}))};
  }catch{}
 }
 return {league:"EuroLeague féminine",state:"unavailable",matches:[]};
}
