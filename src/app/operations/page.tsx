"use client";

import { useEffect, useState } from "react";
import { Boxes, CheckCircle2, Play, RefreshCw, Shield, CalendarDays, Database, FileCog } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Input, PageTitle, Panel, Select, Textarea } from "@/components/ui";
import * as api from "@/services/api/enterpriseApi";
import type { JsonObject } from "@/services/api/enterpriseApi";

export default function OperationsPage(){
  const [overview,setOverview]=useState<JsonObject|null>(null);
  const [playbooks,setPlaybooks]=useState<JsonObject[]>([]);
  const [runs,setRuns]=useState<JsonObject[]>([]);
  const [integrations,setIntegrations]=useState<JsonObject[]>([]);
  const [meetings,setMeetings]=useState<JsonObject[]>([]);
  const [consents,setConsents]=useState<JsonObject[]>([]);
  const [policies,setPolicies]=useState<JsonObject[]>([]);
  const [retention,setRetention]=useState<JsonObject|null>(null);
  const [selectedPlaybook,setSelectedPlaybook]=useState("");
  const [selectedIntegration,setSelectedIntegration]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  const [playbook,setPlaybook]=useState('{"name":"Incident Response","description":"Automated security response","trigger_type":"MANUAL","trigger_condition":{},"is_active":true}');
  const [step,setStep]=useState('{"step_order":1,"name":"Notify analyst","action_type":"NOTIFY_ANALYST","parameters":{},"requires_approval":false,"timeout_seconds":300}');
  const [integration,setIntegration]=useState('{"name":"SOC Webhook","provider":"WEBHOOK","category":"SIEM","config":{},"status":"ACTIVE"}');
  const [meeting,setMeeting]=useState('{"topic":"Security incident bridge","start_time":"2026-10-07T10:00:00+05:30","status":"SCHEDULED","participants":[],"security_briefing_notes":""}');
  const [policy,setPolicy]=useState('{"name":"Default Risk Threshold","policy_type":"RISK_THRESHOLD","rules":{"critical_threshold":80},"is_active":true}');
  const [task,setTask]=useState('{"task_name":"RECALCULATE_HUMAN_RISK","payload":{}}');
  const [taskId,setTaskId]=useState("");

  async function load(){
    setError("");
    try{
      const [o,p,r,i,m,c,rs,pol]=await Promise.all([
        api.dashboardOverview(),api.listPlaybooks(),api.listPlaybookRuns(),api.listIntegrations(),
        api.listMeetings(),api.listConsent(),api.retentionStatus(),api.listPolicies()
      ]);
      setOverview(o);setPlaybooks(p||[]);setRuns(r||[]);setIntegrations(i||[]);setMeetings(m||[]);setConsents(c||[]);setRetention(rs);setPolicies(pol||[]);
      if(!selectedPlaybook && p?.[0]?.id) setSelectedPlaybook(String(p[0].id));
      if(!selectedIntegration && i?.[0]?.id) setSelectedIntegration(String(i[0].id));
    }catch(e){setError(e instanceof Error?e.message:"Failed to load operations data");}
  }
  useEffect(()=>{void load();},[]);

  async function act(fn:()=>Promise<unknown>){
    setError("");setMessage("");
    try{const data=await fn();setMessage("Operation completed successfully.");await load();return data;}catch(e){setError(e instanceof Error?e.message:"Operation failed");return null;}
  }
  function parse(text:string):JsonObject|null{try{return JSON.parse(text) as JsonObject}catch{setError("Invalid JSON payload.");return null;}}

  return <ProtectedShell>
    <PageTitle title="Security Operations" description="SOAR playbooks, integrations, emergency meetings, governance, background tasks and versioned security policies." action={<Boxes className="h-5 w-5 text-cyan-300"/>}/>

    {overview&&<div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{Object.entries((overview.metrics as JsonObject)||{}).map(([k,v])=><Metric key={k} label={k.replaceAll("_"," ")} value={String(v)}/>)}</div>}

    <div className="grid gap-5 xl:grid-cols-2">
      <Panel className="p-5"><SectionTitle icon={<Play className="h-4 w-4"/>} title="SOAR Playbooks"/>
        <Textarea className="mt-3 min-h-44 font-mono text-xs" value={playbook} onChange={e=>setPlaybook(e.target.value)}/>
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>{const p=parse(playbook);if(p)void act(()=>api.createPlaybook(p));}}>Create playbook</Button><Button variant="ghost" onClick={()=>{if(!selectedPlaybook){setError("Select a playbook.");return;}const s=parse(step);if(s)void act(()=>api.addPlaybookStep(Number(selectedPlaybook),s));}}>Add step</Button></div>
        <Textarea className="mt-3 min-h-36 font-mono text-xs" value={step} onChange={e=>setStep(e.target.value)}/>
        <div className="mt-3 flex gap-2"><Select value={selectedPlaybook} onChange={e=>setSelectedPlaybook(e.target.value)}><option value="">Select playbook</option>{playbooks.map(p=><option key={String(p.id)} value={String(p.id)}>{String(p.name)} #{String(p.id)}</option>)}</Select><Button disabled={!selectedPlaybook} onClick={()=>void act(()=>api.launchPlaybook(Number(selectedPlaybook),{}))}>Run</Button></div>
        <div className="mt-4 space-y-2">{playbooks.slice(0,8).map(p=><div key={String(p.id)} className="rounded-xl border border-white/10 p-3 text-sm"><div className="flex justify-between"><span>{String(p.name)}</span><span className="text-xs text-slate-500">{String(p.step_count??0)} steps</span></div></div>)}</div>
      </Panel>

      <Panel className="p-5"><SectionTitle icon={<Shield className="h-4 w-4"/>} title="Playbook runs & approvals"/>
        <div className="space-y-2">{runs.slice(0,10).map(r=><div key={String(r.id)} className="rounded-xl border border-white/10 p-3 text-sm"><div className="flex items-center justify-between gap-3"><span>#{String(r.id)} {String(r.playbook_name??"Run")}</span><span className="text-xs text-cyan-300">{String(r.status)}</span></div><div className="mt-2 flex flex-wrap gap-2"><Button variant="ghost" onClick={()=>void act(()=>api.approvePlaybookRun(Number(r.id)))}>Approve</Button><Button variant="ghost" onClick={()=>void act(()=>api.rejectPlaybookRun(Number(r.id),"Rejected from command center"))}>Reject</Button><Button variant="ghost" onClick={()=>void act(()=>api.retryPlaybookRun(Number(r.id)))}>Retry</Button><Button variant="danger" onClick={()=>void act(()=>api.cancelPlaybookRun(Number(r.id)))}>Cancel</Button></div></div>)}</div>
      </Panel>

      <Panel className="p-5"><SectionTitle icon={<Database className="h-4 w-4"/>} title="Integrations + OAuth"/>
        <Textarea className="mt-3 min-h-36 font-mono text-xs" value={integration} onChange={e=>setIntegration(e.target.value)}/>
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>{const x=parse(integration);if(x)void act(()=>api.createIntegration(x));}}>Add integration</Button><Button variant="ghost" disabled={!selectedIntegration} onClick={()=>void act(()=>api.testIntegration(Number(selectedIntegration)))}>Test</Button><Button variant="ghost" disabled={!selectedIntegration} onClick={()=>void act(()=>api.syncIntegration(Number(selectedIntegration)))}>Sync</Button><Button variant="ghost" disabled={!selectedIntegration} onClick={()=>void act(()=>api.oauthDisconnect(Number(selectedIntegration)))}>Disconnect OAuth</Button></div>
        <Select className="mt-3" value={selectedIntegration} onChange={e=>setSelectedIntegration(e.target.value)}><option value="">Select integration</option>{integrations.map(i=><option key={String(i.id)} value={String(i.id)}>{String(i.name)} · {String(i.provider)}</option>)}</Select>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{integrations.slice(0,8).map(i=><div key={String(i.id)} className="rounded-xl border border-white/10 p-3 text-xs"><div className="font-medium">{String(i.name)}</div><div className="mt-1 text-slate-500">{String(i.provider)} · {String(i.health_status)}</div></div>)}</div>
      </Panel>

      <Panel className="p-5"><SectionTitle icon={<CalendarDays className="h-4 w-4"/>} title="Emergency meetings"/>
        <Textarea className="mt-3 min-h-36 font-mono text-xs" value={meeting} onChange={e=>setMeeting(e.target.value)}/>
        <Button className="mt-3" onClick={()=>{const x=parse(meeting);if(x)void act(()=>api.createMeeting(x));}}>Schedule meeting</Button>
        <div className="mt-4 space-y-2">{meetings.slice(0,8).map(m=><div key={String(m.id)} className="rounded-xl border border-white/10 p-3"><div className="font-medium">{String(m.topic)}</div><div className="mt-1 text-xs text-slate-500">{String(m.start_time)} · {String(m.status)}</div>{m.join_url&&<a className="mt-2 inline-block text-xs text-cyan-300" href={String(m.join_url)} target="_blank" rel="noreferrer">Open meeting</a>}</div>)}</div>
      </Panel>

      <Panel className="p-5"><SectionTitle icon={<Shield className="h-4 w-4"/>} title="Data governance & consent"/>
        <div className="rounded-xl border border-white/10 p-4 text-xs"><pre className="max-h-40 overflow-auto">{JSON.stringify(retention,null,2)}</pre></div>
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>void act(()=>api.enforceRetention(true))}>Enforce retention</Button><Button variant="ghost" onClick={()=>void act(()=>api.grantConsent({permission_scope:"telemetry_collection",consent_version:"1.0"}))}>Grant telemetry consent</Button><Button variant="ghost" onClick={()=>void act(()=>api.revokeConsent("telemetry_collection"))}>Revoke telemetry consent</Button></div>
        <div className="mt-4 space-y-2">{consents.slice(0,8).map(c=><div key={String(c.id)} className="rounded-xl border border-white/10 p-3 text-xs">{String(c.permission_scope)} · {String(c.consent_given)} · {String(c.granted_at)}</div>)}</div>
      </Panel>

      <Panel className="p-5"><SectionTitle icon={<RefreshCw className="h-4 w-4"/>} title="Background tasks"/>
        <Textarea className="mt-3 min-h-28 font-mono text-xs" value={task} onChange={e=>setTask(e.target.value)}/>
        <div className="mt-3 flex gap-2"><Button onClick={async()=>{const x=parse(task);if(x){const r=await act(()=>api.submitTask(x));if(r&&typeof r==="object"&&"task_id" in r)setTaskId(String((r as JsonObject).task_id));}}}>Submit task</Button><Input placeholder="Task ID" value={taskId} onChange={e=>setTaskId(e.target.value)}/><Button variant="ghost" disabled={!taskId} onClick={()=>void act(()=>api.pollTask(taskId))}>Poll</Button></div>
      </Panel>

      <Panel className="p-5 xl:col-span-2"><SectionTitle icon={<FileCog className="h-4 w-4"/>} title="Versioned security policies"/>
        <Textarea className="mt-3 min-h-32 font-mono text-xs" value={policy} onChange={e=>setPolicy(e.target.value)}/>
        <Button className="mt-3" onClick={()=>{const x=parse(policy);if(x)void act(()=>api.createPolicy(x));}}>Create policy</Button>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{policies.slice(0,12).map(p=><div key={String(p.id)} className="rounded-xl border border-white/10 p-4"><div className="flex justify-between"><span className="font-medium">{String(p.name)}</span><span className="text-xs text-slate-500">v{String(p.version)}</span></div><div className="mt-1 text-xs text-slate-500">{String(p.policy_type)} · active={String(p.is_active)}</div><div className="mt-3 flex gap-2"><Button variant="ghost" onClick={()=>void act(()=>api.updatePolicy(Number(p.id),{is_active:!Boolean(p.is_active)}))}>Toggle</Button><Button variant="danger" onClick={()=>void act(()=>api.deletePolicy(Number(p.id)))}>Delete</Button></div></div>)}</div>
      </Panel>
    </div>
    {(message||error)&&<Panel className={"mt-5 p-4 text-sm " + (error?"text-red-300 border border-red-400/20":"text-emerald-300 border border-emerald-400/20")}>{error||message}</Panel>}
  </ProtectedShell>;
}

function SectionTitle({icon,title}:{icon:React.ReactNode;title:string}){return <div className="flex items-center gap-2"><span className="text-cyan-300">{icon}</span><h2 className="font-semibold">{title}</h2></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white/10 bg-white/[.02] p-3"><div className="text-lg font-bold">{value}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</div></div>}
