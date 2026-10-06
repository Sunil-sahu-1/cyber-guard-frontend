"use client";

import { useEffect, useState } from "react";
import { Activity, ShieldAlert, History, PlusCircle, RefreshCw } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Input, PageTitle, Panel, RiskBadge, Textarea } from "@/components/ui";
import * as anomalyApi from "@/services/api/anomalyApi";
import type { JsonObject } from "@/services/api/enterpriseApi";

const initialLogin = { failed_attempts:0,new_ip:false,new_device:false,new_location:false,unusual_time:false,impossible_travel:false,suspicious_network:false,status:"SUCCESS" };
const initialBehavior = { unusual_access:false,unusual_resource_access:false,unusual_request_volume:false,new_device:false,new_location:false,suspicious_network:false,activity_type:"ACCESS" };

export default function AnomalyPage(){
  const [login,setLogin]=useState(JSON.stringify(initialLogin,null,2));
  const [behavior,setBehavior]=useState(JSON.stringify(initialBehavior,null,2));
  const [activity,setActivity]=useState('{"status":"SUCCESS","location":"","device_id":""}');
  const [result,setResult]=useState<JsonObject|null>(null);
  const [history,setHistory]=useState<JsonObject[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function run(fn:()=>Promise<JsonObject>){
    setLoading(true);setError("");
    try{setResult(await fn());}catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setLoading(false);}
  }
  async function loadHistory(){
    try{
      const [a,b,c]=await Promise.all([anomalyApi.listAnomalies(),anomalyApi.listBehaviorHistory(),anomalyApi.listLoginHistory()]);
      setHistory([...(a||[]),...(b||[]),...(c||[])].slice(0,40));
    }catch(e){setError(e instanceof Error?e.message:"History load failed");}
  }
  useEffect(()=>{void loadHistory();},[]);

  return <ProtectedShell>
    <PageTitle title="Anomaly Center" description="Analyze login and behavioral anomalies, record activity, and inspect backend-generated history." action={<Activity className="h-5 w-5 text-cyan-300"/>}/>
    <div className="grid gap-5 xl:grid-cols-3">
      <Analyzer title="Login anomaly" value={login} setValue={setLogin} loading={loading} onRun={()=>run(()=>anomalyApi.analyzeLogin(JSON.parse(login)))} />
      <Analyzer title="Behavior anomaly" value={behavior} setValue={setBehavior} loading={loading} onRun={()=>run(()=>anomalyApi.analyzeBehavior(JSON.parse(behavior)))} />
      <Analyzer title="Record login activity" value={activity} setValue={setActivity} loading={loading} onRun={()=>run(()=>anomalyApi.recordLoginActivity(JSON.parse(activity)))} />
    </div>
    {error && <Panel className="mt-5 border border-red-400/20 p-4 text-sm text-red-300">{error}</Panel>}
    {result && <Panel className="mt-5 p-5"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-cyan-300"/><h2 className="font-semibold">Latest response</h2></div><pre className="mt-4 max-h-[420px] overflow-auto rounded-xl bg-black/20 p-4 text-xs text-slate-400">{JSON.stringify(result,null,2)}</pre></Panel>}
    <Panel className="mt-5 p-5">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><History className="h-4 w-4 text-cyan-300"/><h2 className="font-semibold">Anomaly history</h2></div><Button variant="ghost" onClick={loadHistory}><RefreshCw className="h-4 w-4"/>Refresh</Button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {history.map((item,i)=><div key={String(item.id??i)} className="rounded-xl border border-white/10 bg-white/[.02] p-4">
          <div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-500">#{String(item.id??"-")}</span>{item.severity ? <RiskBadge value={String(item.severity)}/> : null}</div>
          <div className="mt-2 text-sm font-medium">{String(item.anomaly_type??item.activity_type??item.status??"Activity")}</div>
          <div className="mt-1 text-xs text-slate-500">{String(item.explanation??item.location??item.created_at??"")}</div>
        </div>)}
      </div>
    </Panel>
  </ProtectedShell>;
}

function Analyzer({title,value,setValue,onRun,loading}:{title:string;value:string;setValue:(v:string)=>void;onRun:()=>void;loading:boolean}){
  return <Panel className="p-5"><h2 className="font-semibold">{title}</h2><Textarea className="mt-4 min-h-[260px] font-mono text-xs" value={value} onChange={e=>setValue(e.target.value)}/><Button className="mt-4 w-full" loading={loading} onClick={()=>{try{onRun();}catch(e){alert(e instanceof Error?e.message:"Invalid JSON");}}}><PlusCircle className="h-4 w-4"/>Run backend analysis</Button></Panel>;
}
