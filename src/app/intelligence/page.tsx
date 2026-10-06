"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Search, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Input, PageTitle, Panel, Select, Textarea } from "@/components/ui";
import * as api from "@/services/api/enterpriseApi";
import type { JsonObject } from "@/services/api/enterpriseApi";

export default function IntelligencePage(){
  const [query,setQuery]=useState(""); const [type,setType]=useState(""); const [minRisk,setMinRisk]=useState("0");
  const [graph,setGraph]=useState<JsonObject|null>(null); const [result,setResult]=useState<JsonObject|null>(null);
  const [threatId,setThreatId]=useState(""); const [incidentId,setIncidentId]=useState("");
  const [signals,setSignals]=useState('[{"source":"manual","score":50,"indicators":["review requested"]}]');
  const [assistant,setAssistant]=useState(""); const [audit,setAudit]=useState<JsonObject[]>([]); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const [risk,setRisk]=useState<JsonObject|null>(null);

  async function act(fn:()=>Promise<JsonObject>){setBusy(true);setError("");try{setResult(await fn());}catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}}
  async function searchGraph(){setBusy(true);setError("");try{setGraph(await api.graphSearch(query,type,Number(minRisk)||0));}catch(e){setError(e instanceof Error?e.message:"Graph search failed");}finally{setBusy(false);}}
  async function load(){try{const [r,h,l]=await Promise.all([api.humanRiskMe(),api.listHybridAudit(),api.listLLMAudit()]);setRisk(r);setAudit([...(h||[]),...(l||[])].slice(0,20));}catch(e){setError(e instanceof Error?e.message:"Load failed");}}
  useEffect(()=>{void load();},[]);

  return <ProtectedShell>
    <PageTitle title="Security Intelligence" description="Graph analytics, hybrid decisions, human risk, LLM intelligence, unified pipeline and auditability." action={<BrainCircuit className="h-5 w-5 text-cyan-300"/>}/>
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Panel className="p-5">
        <div className="flex items-center gap-2"><Search className="h-4 w-4 text-cyan-300"/><h2 className="font-semibold">Security graph search</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-3"><Input placeholder="Search graph" value={query} onChange={e=>setQuery(e.target.value)}/><Select value={type} onChange={e=>setType(e.target.value)}><option value="">All types</option><option>THREAT</option><option>INCIDENT</option><option>USER</option><option>IP</option><option>DEVICE</option></Select><Input type="number" placeholder="Min risk" value={minRisk} onChange={e=>setMinRisk(e.target.value)}/></div>
        <Button className="mt-3" onClick={searchGraph} loading={busy}>Search graph</Button>
        {graph&&<pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-black/20 p-4 text-xs text-slate-400">{JSON.stringify(graph,null,2)}</pre>}
      </Panel>
      <Panel className="p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300"/><h2 className="font-semibold">My human risk</h2></div>{risk&&<><div className="mt-4 text-4xl font-bold">{String(risk.risk_score??0)}</div><div className="mt-1 text-sm text-slate-500">{String(risk.risk_level??"UNKNOWN")} · {String(risk.review_status??"")}</div><Button className="mt-4" onClick={()=>act(api.humanRiskRecalculate)}>Recalculate</Button></>}</Panel>
    </div>
    <Panel className="mt-5 p-5">
      <h2 className="font-semibold">Hybrid decision + unified pipeline</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2"><Input placeholder="Threat ID (optional)" value={threatId} onChange={e=>setThreatId(e.target.value)}/><Input placeholder="Incident ID (optional)" value={incidentId} onChange={e=>setIncidentId(e.target.value)}/></div>
      <Textarea className="mt-3 min-h-40 font-mono text-xs" value={signals} onChange={e=>setSignals(e.target.value)}/>
      <div className="mt-3 flex flex-wrap gap-2"><Button loading={busy} onClick={()=>{let s:unknown;try{s=JSON.parse(signals);}catch{setError("Signals must be valid JSON.");return;}act(()=>api.hybridDecision({signals:s,threat_id:threatId?Number(threatId):null,incident_id:incidentId?Number(incidentId):null}));}}>Hybrid decision</Button><Button variant="ghost" loading={busy} onClick={()=>{if(!threatId){setError("Threat ID is required for the unified pipeline.");return;}act(()=>api.pipelineAnalyze({threat_id:Number(threatId),enable_llm:true}));}}>Run unified pipeline</Button></div>
    </Panel>
    <Panel className="mt-5 p-5">
      <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300"/><h2 className="font-semibold">LLM security analyst</h2></div>
      <Textarea className="mt-4 min-h-32" placeholder="Ask a security question..." value={assistant} onChange={e=>setAssistant(e.target.value)}/>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button loading={busy} onClick={()=>act(()=>api.llmAssist({question:assistant}))}>Ask assistant</Button>
        <Button variant="ghost" loading={busy} onClick={()=>act(()=>api.llmSummarize({alert:{threat_id:threatId||undefined,incident_id:incidentId||undefined},evidence:[]}))}>Summarize</Button>
        <Button variant="ghost" loading={busy} onClick={()=>act(()=>api.llmInvestigate({threat_id:threatId?Number(threatId):null,evidence:[]}))}>Investigate</Button>
        <Button variant="ghost" loading={busy} onClick={()=>act(()=>api.llmExplain({threat_id:threatId?Number(threatId):null,incident_id:incidentId?Number(incidentId):null,evidence:[]}))}>Explain</Button>
      </div>
    </Panel>
    {error&&<Panel className="mt-5 border border-red-400/20 p-4 text-sm text-red-300">{error}</Panel>}
    {result&&<Panel className="mt-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Latest intelligence response</h2><Button variant="ghost" onClick={()=>setResult(null)}><RefreshCw className="h-4 w-4"/>Clear</Button></div><pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-black/20 p-4 text-xs text-slate-400">{JSON.stringify(result,null,2)}</pre></Panel>}
    <Panel className="mt-5 p-5"><h2 className="font-semibold">Intelligence audit trail</h2><div className="mt-4 space-y-2">{audit.map((x,i)=><div key={String(x.id??i)} className="rounded-xl border border-white/10 p-3 text-xs"><span className="font-medium">{String(x.decision??x.prompt_identifier??x.model??"Audit")}</span><span className="ml-3 text-slate-500">{String(x.created_at??"")}</span></div>)}</div></Panel>
  </ProtectedShell>;
}
