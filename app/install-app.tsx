"use client";
import {useEffect,useRef,useState} from "react";
type InstallPrompt=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export default function InstallApp(){
 const prompt=useRef<InstallPrompt|null>(null);
 const [installed,setInstalled]=useState(false),[help,setHelp]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const mode=window.matchMedia("(display-mode: standalone)");
  const update=()=>setInstalled(mode.matches||!!(navigator as Navigator & {standalone?:boolean}).standalone);
  const available=(event:Event)=>{event.preventDefault();prompt.current=event as InstallPrompt;setReady(true)};
  const done=()=>{setInstalled(true);setHelp(false);prompt.current=null;setReady(false)};
  update();mode.addEventListener("change",update);window.addEventListener("beforeinstallprompt",available);window.addEventListener("appinstalled",done);
  if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
  return()=>{mode.removeEventListener("change",update);window.removeEventListener("beforeinstallprompt",available);window.removeEventListener("appinstalled",done)};
 },[]);
 async function install(){
  const event=prompt.current;if(!event){setHelp(x=>!x);return}
  setBusy(true);try{await event.prompt();const choice=await event.userChoice;if(choice.outcome!=="accepted")setHelp(true)}catch{setHelp(true)}finally{prompt.current=null;setReady(false);setBusy(false)};
 }
 if(installed)return null;
 return <section className="installapp" aria-label="Installer Basket TV">
  <button className="sourcebutton" onClick={install} disabled={busy} aria-expanded={help} aria-controls="install-help">{busy?"Installation…":ready?"Installer Basket TV":"Installer sur mon appareil"}</button>
  {help&&<div id="install-help" className="installhelp"><h2>Basket TV sur l’écran d’accueil</h2><p><strong>iPhone ou iPad :</strong> ouvrez ce lien dans Safari, puis utilisez Partager et « Sur l’écran d’accueil ».</p><p><strong>Android :</strong> dans le menu de Chrome, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».</p><p><strong>Ordinateur :</strong> dans Chrome ou Edge, cherchez l’option d’installation dans la barre d’adresse ou le menu.</p><p>Les options dépendent du navigateur. Une connexion Internet est nécessaire pour actualiser les matchs. Si une connexion à votre compte est demandée, utilisez le compte autorisé à consulter ce site.</p><button className="sourcebutton" onClick={()=>setHelp(false)}>Fermer l’aide</button></div>}
 </section>;
}
