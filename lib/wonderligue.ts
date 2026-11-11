// Wonderligue (LFB, 1re division féminine) : pas de source automatique
// accessible pour l'instant (site LFB protégé contre les robots, API FFBB
// derrière un pare-feu). Les matchs se renseignent dans le tableau ci-dessous,
// au format date UTC. La section n'apparaît que si le tableau n'est pas vide.
// Exemple : {date:"2026-11-15T18:00:00Z",home:"Tarbes",away:"Bourges",round:"Journée 5",timeConfirmed:true,
//            broadcast:{channel:"Sport en France",live:true,source:"https://www.sportenfrance.com/",sourceName:"Sport en France"}}
export type CuratedMatch={date:string;home:string;away:string;round:string;timeConfirmed:boolean;broadcast?:{channel:string;live:boolean;source:string;sourceName:string}};
const schedule:CuratedMatch[]=[];
const parisDate=(d:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(d));
export function wonderligueMatches(date:string){
 const checkedAt=new Date().toISOString();
 const matches=schedule.filter(m=>parisDate(m.date)===date).map((m,i)=>({id:`lfb-${i}`,league:"Wonderligue",date:m.date,home:m.home,away:m.away,round:m.round,source:"https://www.basket-lfb.com/",status:Date.parse(m.date)<Date.now()?"Terminé":"À venir",timeConfirmed:m.timeConfirmed,broadcasts:m.broadcast?[{league:"Wonderligue",home:m.home,away:m.away,start:m.date,channel:m.broadcast.channel,live:m.broadcast.live,replay:false,source:m.broadcast.source,sourceName:m.broadcast.sourceName,checkedAt}]:[]}));
 return {league:"Wonderligue",state:matches.length?"ok":"empty",matches};
}
