"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Play, Plus, BrainCircuit, Clock3 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button, EmptyState, Input, Panel, PageTitle, RiskBadge, Textarea } from "@/components/ui";
import { addEvidence, addResponseAction, executeResponseAction, explainIncident, getIncident, getIncidentTimeline, resolveIncident, transitionIncident } from "@/services/api/incidentApi";
import type { Incident } from "@/types/api";

export default function IncidentDetail(){
  const {id}=useParams<{id:string}>();
  const [item,setItem]=useState<Incident|null>(null);
  const [action,setAction]=useState("MONITOR"); const [desc,setDesc]=useState(""); const [evidence,setEvidence]=useState('{"evidence_type":"analyst_note","evidence_value":"","risk_contribution":0}');
  const [transition,setTransition]=useState("INVESTIGATING"); const [explanation,setExplanation]=useState<Record<string,unknown>|null>(null); const [timeline,setTimeline]=useState<Record<string,unknown>[]>([]); const [busy,setBusy]=useState(false); const [error,setError]=useState("");

  async function load(){
    try{const [i,t]=await Promise.all([getIncident(Number(id)),getIncidentTimeline(Number(id))]);setItem(i);setTimeline(t||[]);}catch(e){setError(e instanceof Error?e.message:"Failed to load incident");}
  }
  useEffect(()=>{void load();},[id]);

  async function run(fn:()=>Promise<unknown>){setBusy(true);setError("");try{await fn();await load();}catch(e){setError(e instanceof Error?e.message:"Operation failed");}finally{setBusy(false);}}
  if(!item)return <AppShell><PageTitle title="Incident detail" description="Loading..."/>{error&&<Panel className="p-4 text-red-300">{error}</Panel>}</AppShell>;

  return <AppShell>
    <PageTitle title={item.title} description={"Incident #"+item.id+" • "+item.source_type} action={<Link href="/incidents" className="text-sm text-slate-400"><ArrowLeft className="mr-1 inline h-4 w-4"/>Back</Link>}/>
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <Panel className="p-6"><div className="flex justify-between"><div><div className="text-xs text-slate-600">Risk</div><div className="mt-1 text-4xl font-semibold">{item.risk_score}/100</div></div><RiskBadge value={item.severity}/></div><p className="mt-6 text-sm leading-6 text-slate-400">{item.description}</p><div className="mt-5 grid grid-cols-2 gap-3"><Info label="Status" value={item.status}/><Info label="Source" value={item.source_type+" #"+(item.source_id??"—")}/></div><div className="mt-5 flex flex-wrap gap-2">{!["RESOLVED","CLOSED"].includes(item.status)&&<Button onClick={()=>void run(()=>resolveIncident(Number(id)))}><CheckCircle2 className="h-4 w-4"/>Resolve</Button>}<Button variant="ghost" loading={busy} onClick={()=>void run(()=>transitionIncident(Number(id),transition))}>Transition</Button><select value={transition} onChange={e=>setTransition(e.target.value)} className="rounded-xl border border-white/10 bg-[#091222] px-3 text-sm text-white"><option>NEW</option><option>OPEN</option><option>TRIAGE</option><option>INVESTIGATING</option><option>RESOLVED</option><option>CLOSED</option></select><Button variant="ghost" onClick={()=>void run(async()=>setExplanation(await explainIncident(Number(id),{})))}><BrainCircuit className="h-4 w-4"/>AI Explain</Button></div></Panel>

      <Panel className="p-6"><h2 className="font-semibold">Add response action</h2><select value={action} onChange={e=>setAction(e.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-[#091222] px-3.5 py-3 text-sm text-white"><option>MONITOR</option><option>ESCALATE</option><option>REVOKE_SESSION</option><option>STRENGTHEN_AUTH</option><option>ALERT_USER</option><option>ALERT_ADMIN</option><option>BLOCK_URL</option><option>QUARANTINE_EMAIL</option><option>ISOLATE_DEVICE</option></select><Input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Action description" className="mt-3"/><Button className="mt-3" onClick={()=>void run(()=>addResponseAction(Number(id),{action_type:action,description:desc}))}><Plus className="h-4 w-4"/>Add action</Button><h2 className="mt-6 font-semibold">Add evidence</h2><Textarea className="mt-3 min-h-28 font-mono text-xs" value={evidence} onChange={e=>setEvidence(e.target.value)}/><Button className="mt-3" variant="ghost" onClick={()=>{try{void run(()=>addEvidence(Number(id),JSON.parse(evidence)));}catch{setError("Evidence must be valid JSON.");}}}>Attach evidence</Button></Panel>
    </div>
    {error&&<Panel className="mt-5 border border-red-400/20 p-4 text-sm text-red-300">{error}</Panel>}
    {explanation&&<Panel className="mt-5 p-5"><h2 className="font-semibold">AI incident explanation</h2><pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-black/20 p-4 text-xs text-slate-400">{JSON.stringify(explanation,null,2)}</pre></Panel>}
    <Panel className="mt-5 p-6"><h2 className="font-semibold">Response actions</h2><div className="mt-4 space-y-3">{item.response_actions?.length?item.response_actions.map((a: any)=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4"><div><div className="text-sm font-medium">{a.action_type}</div><div className="mt-1 text-sm text-slate-500">{a.description}</div></div>{!a.executed_at&&<Button variant="ghost" onClick={()=>void run(()=>executeResponseAction(a.id))}><Play className="h-4 w-4"/>Execute</Button>}</div>):<EmptyState text="No response actions recorded."/>}</div></Panel>
    <Panel className="mt-5 p-6"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-300"/><h2 className="font-semibold">Incident timeline</h2></div><div className="mt-4 space-y-2">{timeline.map((x,i)=><div key={String(x.id??i)} className="rounded-xl border border-white/10 p-3 text-xs"><div className="font-medium">{String(x.action??x.event??x.status??"Event")}</div><div className="mt-1 text-slate-500">{String(x.created_at??x.timestamp??"")}</div><pre className="mt-2 overflow-auto text-slate-500">{JSON.stringify(x)}</pre></div>)}</div></Panel>
  </AppShell>;
}
function Info({label,value}:{label:string;value:unknown}){return <div className="rounded-xl border border-white/10 p-3"><div className="text-xs text-slate-600">{label}</div><div className="mt-1 text-sm text-slate-300">{String(value)}</div></div>}
