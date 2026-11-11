// Équipe de France : source "en test". Les horaires proviennent d'un fichier
// maintenu à la main (france-schedule.json) car l'API officielle FFBB est
// protégée par un pare-feu anti-robots difficile à interroger depuis un Worker.
// À enrichir plus tard si une source automatique fiable est identifiée.
import schedule from "./france-schedule.json";
export type FranceMatch={id:string;side:"Masculine"|"Féminine";date:string;home:string;away:string;round:string;venue?:string;status:string;timeConfirmed:boolean;source:string;checkedAt:string;broadcast?:{channel:string;live:boolean;source:string;sourceName:string}};
const parisDate=(d:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(d));
export function franceMatches(date:string){
 const checkedAt=new Date().toISOString();
 const all=(schedule.matches as any[]).map((m:any,i:number)=>({...m,id:`fr-${m.side}-${i}`,status:Date.parse(m.date)<Date.now()?"Terminé":"À venir",source:"https://www.ffbb.com/",checkedAt}));
 return {today:all.filter((m:any)=>parisDate(m.date)===date),upcoming:all.filter((m:any)=>{const t=Date.parse(m.date),n=Date.parse(date+"T12:00:00Z");return t>=n&&t-n<=7*24*3600000})};
}
