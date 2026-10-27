import { useState } from "react";
import { MapPinned, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { appApiUrl, ProspectorApiError } from "@/lib/prospector-api";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Result = { area: string; found: number; added: number; duplicates: number };

export function AddAreaDialog({open,onOpenChange,onGenerated}:{open:boolean;onOpenChange:(value:boolean)=>void;onGenerated:(area:string)=>Promise<void>|void}){
 const [area,setArea]=useState(""); const [country,setCountry]=useState("South Africa"); const [target,setTarget]=useState("25"); const [busy,setBusy]=useState(false);
 async function generate(){
  const clean=area.trim(); if(clean.length<2){toast.error("Enter a town, suburb, township or city.");return;}
  setBusy(true);
  try{
   const {data}=await supabase.auth.getSession(); const token=data.session?.access_token;
   const response=await fetch(appApiUrl("generate-area.php"),{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({area:clean,country:country.trim()||"South Africa",target:Number(target)})});
   const payload=await response.json().catch(()=>({})) as Partial<Result>&{error?:string};
   if(!response.ok)throw new ProspectorApiError(payload.error||"Area research failed.",response.status,payload);
   await onGenerated(payload.area||clean); onOpenChange(false);
   toast.success(`${payload.added??0} new leads added; ${payload.duplicates??0} existing matches skipped.`);
  }catch(error){toast.error(error instanceof Error?error.message:"Area research failed.");}finally{setBusy(false);}
 }
 return <Dialog open={open} onOpenChange={value=>!busy&&onOpenChange(value)}><DialogContent className="sm:max-w-xl">
  <DialogHeader><div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bolide-gradient text-white"><MapPinned className="h-5 w-5"/></div><DialogTitle>Generate leads for an area</DialogTitle><DialogDescription>Enter a place. The research engine searches public sources, builds its utility profile and adds verified business candidates without duplicating existing leads.</DialogDescription></DialogHeader>
  <div className="grid gap-4 py-2 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="research-area">Area to research</Label><Input id="research-area" value={area} onChange={e=>setArea(e.target.value)} placeholder="e.g. Durban, Inanda or Dubai" autoFocus/></div><div className="space-y-2"><Label htmlFor="research-country">Country</Label><Input id="research-country" value={country} onChange={e=>setCountry(e.target.value)} placeholder="South Africa"/></div><div className="space-y-2"><Label>Research batch</Label><Select value={target} onValueChange={setTarget}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="25">Up to 25 leads</SelectItem><SelectItem value="50">Up to 50 leads</SelectItem></SelectContent></Select></div></div>
  <div className="rounded-xl border border-line bg-soft p-3 text-xs text-muted-foreground"><div className="flex gap-2"><Search className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><p>It searches malls, shopping centres, high-energy shops, hospitals, fuel stations, depots, food businesses and residential estates. Run the same area again later to discover more; existing records are skipped.</p></div></div>
  <DialogFooter><Button variant="outline" onClick={()=>onOpenChange(false)} disabled={busy}>Cancel</Button><Button onClick={()=>void generate()} disabled={busy||area.trim().length<2} className="bolide-gradient"><Sparkles className="mr-2 h-4 w-4"/>{busy?"Researching and saving…":"Generate leads"}</Button></DialogFooter>
 </DialogContent></Dialog>
}
