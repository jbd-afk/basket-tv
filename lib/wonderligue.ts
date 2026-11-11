// Wonderligue (LFB, 1re division féminine) : pas de source automatique
// accessible pour l'instant (site LFB protégé contre les robots, API FFBB
// derrière un pare-feu). Les matchs se renseignent dans le tableau ci-dessous,
// au format date UTC. La section n'apparaît que si le tableau n'est pas vide.
// Exemple : {date:"2026-11-15T18:00:00Z",home:"Tarbes",away:"Bourges",round:"Journée 5",timeConfirmed:true,
//            broadcast:{channel:"Sport en France",live:true,source:"https://www.sportenfrance.com/",sourceName:"Sport en France"}}
// Programmation TV des matchs de Wonderligue (source : Sport en France, mise à jour oct. 2026).
// Les horaires sont ceux de la PRISE D'ANTENNE (le match démarre généralement peu après).
// Les autres matchs de chaque journée sont diffusés sur la chaîne YouTube LBWL (LFB TV).
export type CuratedMatch={date:string;home:string;away:string;round:string;timeConfirmed:boolean;broadcast?:{channel:string;live:boolean;source:string;sourceName:string}};
const schedule:CuratedMatch[]=[
 {date:"2026-11-22T14:15:00Z",home:"Charnay",away:"Bourges",round:"Journée 9",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2026-11-29T14:15:00Z",home:"Bourges",away:"Villeneuve d'Ascq",round:"Journée 10",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne (à confirmer)"}},
 {date:"2026-12-06T19:30:00Z",home:"Chartres",away:"Toulouse",round:"Journée 11",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2026-12-09T19:30:00Z",home:"Landerneau",away:"Bourges",round:"Journée 12",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2026-12-13T14:15:00Z",home:"Bourges",away:"Lattes Montpellier",round:"Journée 13",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2026-12-20T14:15:00Z",home:"Basket Landes",away:"Charleville-Mézières",round:"Journée 14",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2027-01-10T15:15:00Z",home:"Villeneuve d'Ascq",away:"Lattes Montpellier",round:"Journée 15",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2027-01-17T14:15:00Z",home:"Lattes Montpellier",away:"Charleville-Mézières",round:"Journée 16",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2027-01-31T17:00:00Z",home:"Villeneuve d'Ascq",away:"Lyon",round:"Journée 17",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2027-02-06T14:15:00Z",home:"Basket Landes",away:"Toulouse",round:"Journée 18",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2027-02-21T14:15:00Z",home:"Charleville-Mézières",away:"Angers",round:"Journée 19",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2027-02-28T14:15:00Z",home:"Angers",away:"La Tronche Meylan",round:"Journée 20",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2027-03-14T14:15:00Z",home:"Charnay",away:"Angers",round:"Journée 21",timeConfirmed:true,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · prise d'antenne"}},
 {date:"2027-03-21T14:15:00Z",home:"Toulouse",away:"Chartres",round:"Journée 22",timeConfirmed:false,broadcast:{channel:"Sport en France",live:true,source:"https://sportenfrance.com/competitions/la-boulangere-wonderligue",sourceName:"Sport en France · horaire à confirmer"}}
];
const parisDate=(d:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(d));
export function wonderligueMatches(date:string){
 const checkedAt=new Date().toISOString();
 const matches=schedule.filter(m=>parisDate(m.date)===date).map((m,i)=>({id:`lfb-${i}`,league:"Wonderligue",date:m.date,home:m.home,away:m.away,round:m.round,source:"https://www.basket-lfb.com/",status:Date.parse(m.date)<Date.now()?"Terminé":"À venir",timeConfirmed:m.timeConfirmed,broadcasts:m.broadcast?[{league:"Wonderligue",home:m.home,away:m.away,start:m.date,channel:m.broadcast.channel,live:m.broadcast.live,replay:false,source:m.broadcast.source,sourceName:m.broadcast.sourceName,checkedAt}]:[]}));
 return {league:"Wonderligue",state:matches.length?"ok":"empty",matches};
}
