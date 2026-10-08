"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Boxes, Play, RefreshCw, Shield, CalendarDays, Database, FileCog, CheckCircle2, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Button, Input, PageTitle, Panel, Select } from "@/components/ui";
import * as api from "@/services/api/enterpriseApi";
import type { JsonObject } from "@/services/api/enterpriseApi";

const inputClass = "w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30";

type PlaybookForm = { name:string; description:string; trigger_type:string; trigger_value:string; is_active:boolean };
type StepForm = { step_order:number; name:string; action_type:string; parameter_value:string; requires_approval:boolean; timeout_seconds:number };
type IntegrationForm = { name:string; provider:string; category:string; status:string; config_key:string; config_value:string };
type MeetingForm = { topic:string; incident_id:string; integration_id:string; start_time:string; end_time:string; status:string; participants:string; notes:string };
type PolicyForm = { name:string; policy_type:string; threshold:number; is_active:boolean };
type TaskForm = { task_name:string; payload_value:string };

const emptyPlaybook:PlaybookForm = { name:"", description:"", trigger_type:"MANUAL", trigger_value:"", is_active:true };
const emptyStep:StepForm = { step_order:1, name:"", action_type:"NOTIFY_ANALYST", parameter_value:"", requires_approval:false, timeout_seconds:300 };
const emptyIntegration:IntegrationForm = { name:"", provider:"WEBHOOK", category:"SIEM", status:"ACTIVE", config_key:"endpoint", config_value:"" };
const emptyMeeting:MeetingForm = { topic:"", incident_id:"", integration_id:"", start_time:"", end_time:"", status:"SCHEDULED", participants:"", notes:"" };
const emptyPolicy:PolicyForm = { name:"", policy_type:"RISK_THRESHOLD", threshold:80, is_active:true };
const emptyTask:TaskForm = { task_name:"RECALCULATE_HUMAN_RISK", payload_value:"" };

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
  const [playbook,setPlaybook]=useState(emptyPlaybook);
  const [step,setStep]=useState(emptyStep);
  const [integration,setIntegration]=useState(emptyIntegration);
  const [meeting,setMeeting]=useState(emptyMeeting);
  const [policy,setPolicy]=useState(emptyPolicy);
  const [task,setTask]=useState(emptyTask);
  const [taskId,setTaskId]=useState("");
  const [consentScope,setConsentScope]=useState("telemetry_collection");
  const [consentVersion,setConsentVersion]=useState("1.0");

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
    try{await fn();setMessage("Operation completed successfully.");await load();return true;}
    catch(e){setError(e instanceof Error?e.message:"Operation failed");return false;}
  }

  function playbookPayload():JsonObject{
    const condition=playbook.trigger_value.trim()?{value:playbook.trigger_value.trim()}: {};
    return {name:playbook.name.trim(),description:playbook.description.trim(),trigger_type:playbook.trigger_type,trigger_condition:condition,is_active:playbook.is_active};
  }
  function stepPayload():JsonObject{
    return {step_order:step.step_order,name:step.name.trim(),action_type:step.action_type,parameters:step.parameter_value.trim()?{value:step.parameter_value.trim()}: {},requires_approval:step.requires_approval,timeout_seconds:step.timeout_seconds};
  }
  function integrationPayload():JsonObject{
    return {name:integration.name.trim(),provider:integration.provider,category:integration.category,status:integration.status,config:integration.config_key.trim()?{[integration.config_key.trim()]:integration.config_value}: {}};
  }
  function meetingPayload():JsonObject{
    return {
      topic:meeting.topic.trim(),incident:meeting.incident_id?Number(meeting.incident_id):null,integration:meeting.integration_id?Number(meeting.integration_id):null,
      start_time:meeting.start_time,end_time:meeting.end_time||null,status:meeting.status,
      participants:meeting.participants.split(",").map(x=>x.trim()).filter(Boolean),security_briefing_notes:meeting.notes.trim()
    };
  }
  function policyPayload():JsonObject{
    return {name:policy.name.trim(),policy_type:policy.policy_type,rules:{critical_threshold:policy.threshold},is_active:policy.is_active};
  }
  function taskPayload():JsonObject{
    return {task_name:task.task_name,payload:task.payload_value.trim()?{value:task.payload_value.trim()}:{}};
  }

  return <ProtectedShell>
    <PageTitle title="Security Operations" description="SOAR playbooks, integrations, emergency meetings, governance, background tasks and versioned security policies." action={<Boxes className="h-5 w-5 text-cyan-300"/>}/>

    {overview&&<div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{Object.entries((overview.metrics as JsonObject)||{}).map(([k,v])=><Metric key={k} label={formatLabel(k)} value={String(v)}/>)}</div>}

    <div className="grid gap-5 xl:grid-cols-2">
      <Panel className="p-5">
        <SectionTitle icon={<Play className="h-4 w-4"/>} title="SOAR Playbooks"/>
        <p className="mt-1 text-xs text-slate-500">Create an automated response playbook and define its first action.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Playbook name"><Input value={playbook.name} placeholder="Incident Response" onChange={e=>setPlaybook({...playbook,name:e.target.value})}/></Field>
          <Field label="Trigger type"><Select value={playbook.trigger_type} onChange={e=>setPlaybook({...playbook,trigger_type:e.target.value})}><option>MANUAL</option><option>INCIDENT_SEVERITY</option><option>THREAT_TYPE</option><option>BEHAVIORAL_ANOMALY</option></Select></Field>
        </div>
        <Field label="Description"><Input className="mt-3" value={playbook.description} placeholder="Describe what this playbook does" onChange={e=>setPlaybook({...playbook,description:e.target.value})}/></Field>
        <Field label="Trigger condition / value"><Input className="mt-3" value={playbook.trigger_value} placeholder="Example: CRITICAL or phishing" onChange={e=>setPlaybook({...playbook,trigger_value:e.target.value})}/></Field>
        <Toggle label="Playbook active" checked={playbook.is_active} onChange={v=>setPlaybook({...playbook,is_active:v})}/>
        <Button className="mt-3" disabled={!playbook.name.trim()} onClick={()=>void act(()=>api.createPlaybook(playbookPayload()))}><Plus className="h-4 w-4"/>Create playbook</Button>

        <div className="mt-6 border-t border-white/10 pt-5">
          <h3 className="text-sm font-semibold">Add playbook step</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Playbook"><Select value={selectedPlaybook} onChange={e=>setSelectedPlaybook(e.target.value)}><option value="">Select playbook</option>{playbooks.map(p=><option key={String(p.id)} value={String(p.id)}>{String(p.name)} #{String(p.id)}</option>)}</Select></Field>
            <Field label="Step order"><Input type="number" min="1" value={step.step_order} onChange={e=>setStep({...step,step_order:Math.max(1,Number(e.target.value))})}/></Field>
            <Field label="Step name"><Input value={step.name} placeholder="Notify analyst" onChange={e=>setStep({...step,name:e.target.value})}/></Field>
            <Field label="Action"><Select value={step.action_type} onChange={e=>setStep({...step,action_type:e.target.value})}><option>BLOCK_IP</option><option>BLOCK_URL</option><option>QUARANTINE_EMAIL</option><option>DISABLE_USER</option><option>REVOKE_SESSION</option><option>NOTIFY_ANALYST</option><option>CREATE_TICKET</option><option>SCHEDULE_MEETING</option><option>HTTP_WEBHOOK</option></Select></Field>
            <Field label="Action parameter"><Input value={step.parameter_value} placeholder="IP, URL, email, message..." onChange={e=>setStep({...step,parameter_value:e.target.value})}/></Field>
            <Field label="Timeout (seconds)"><Input type="number" min="1" value={step.timeout_seconds} onChange={e=>setStep({...step,timeout_seconds:Math.max(1,Number(e.target.value))})}/></Field>
          </div>
          <Toggle label="Require approval before execution" checked={step.requires_approval} onChange={v=>setStep({...step,requires_approval:v})}/>
          <div className="mt-3 flex gap-2"><Button disabled={!selectedPlaybook||!step.name.trim()} onClick={()=>void act(()=>api.addPlaybookStep(Number(selectedPlaybook),stepPayload()))}><Plus className="h-4 w-4"/>Add step</Button><Button variant="ghost" disabled={!selectedPlaybook} onClick={()=>void act(()=>api.launchPlaybook(Number(selectedPlaybook),{}))}><Play className="h-4 w-4"/>Run playbook</Button></div>
        </div>
        <div className="mt-5 space-y-2">{playbooks.slice(0,8).map(p=><div key={String(p.id)} className="rounded-xl border border-white/10 p-3 text-sm"><div className="flex justify-between"><span>{String(p.name)}</span><span className="text-xs text-slate-500">{String(p.step_count??0)} steps · {Boolean(p.is_active)?"Active":"Inactive"}</span></div><div className="mt-1 text-xs text-slate-500">{String(p.description??"")}</div></div>)}</div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<Shield className="h-4 w-4"/>} title="Playbook runs & approvals"/>
        <p className="mt-1 text-xs text-slate-500">Review runs and act only on steps that require approval.</p>
        <div className="mt-4 space-y-3">{runs.slice(0,10).map(r=>{
          const status=String(r.status??"UNKNOWN");
          const waiting=status==="WAITING_APPROVAL";
          return <div key={String(r.id)} className="rounded-xl border border-white/10 bg-white/[.02] p-4">
            <div className="flex items-center justify-between gap-3"><div><div className="font-medium">#{String(r.id)} {String(r.playbook_name??"Run")}</div><div className="mt-1 text-xs text-slate-500">{formatDate(r.created_at)}</div></div><StatusBadge value={status}/></div>
            {r.error_message&&<div className="mt-2 text-xs text-red-300">{String(r.error_message)}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {waiting&&<><Button variant="ghost" onClick={()=>void act(()=>api.approvePlaybookRun(Number(r.id)))}><CheckCircle2 className="h-4 w-4"/>Approve</Button><Button variant="ghost" onClick={()=>void act(()=>api.rejectPlaybookRun(Number(r.id),"Rejected from Security Operations"))}>Reject</Button></>}
              {(status==="FAILED"||status==="CANCELLED")&&<Button variant="ghost" onClick={()=>void act(()=>api.retryPlaybookRun(Number(r.id)))}>Retry</Button>}
              {!["COMPLETED","CANCELLED"].includes(status)&&<Button variant="danger" onClick={()=>void act(()=>api.cancelPlaybookRun(Number(r.id)))}>Cancel</Button>}
            </div>
          </div>
        })}</div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<Database className="h-4 w-4"/>} title="Integrations + OAuth"/>
        <p className="mt-1 text-xs text-slate-500">Register a security integration and manage its connection state.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Integration name"><Input value={integration.name} placeholder="SOC Webhook" onChange={e=>setIntegration({...integration,name:e.target.value})}/></Field>
          <Field label="Provider"><Select value={integration.provider} onChange={e=>setIntegration({...integration,provider:e.target.value})}>{["SLACK","TEAMS","JIRA","PAGERDUTY","GOOGLE_WORKSPACE","MICROSOFT_GRAPH","WEBHOOK","CUSTOM"].map(x=><option key={x}>{x}</option>)}</Select></Field>
          <Field label="Category"><Select value={integration.category} onChange={e=>setIntegration({...integration,category:e.target.value})}>{["COMMUNICATION","TICKETING","SIEM","IDENTITY","CLOUD"].map(x=><option key={x}>{x}</option>)}</Select></Field>
          <Field label="Initial status"><Select value={integration.status} onChange={e=>setIntegration({...integration,status:e.target.value})}><option>ACTIVE</option><option>INACTIVE</option><option>PENDING_AUTH</option><option>ERROR</option></Select></Field>
          <Field label="Config key"><Input value={integration.config_key} placeholder="endpoint" onChange={e=>setIntegration({...integration,config_key:e.target.value})}/></Field>
          <Field label="Config value"><Input value={integration.config_value} placeholder="https://..." onChange={e=>setIntegration({...integration,config_value:e.target.value})}/></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><Button disabled={!integration.name.trim()} onClick={()=>void act(()=>api.createIntegration(integrationPayload()))}>Add integration</Button><Button variant="ghost" disabled={!selectedIntegration} onClick={()=>void act(()=>api.testIntegration(Number(selectedIntegration)))}>Test connection</Button><Button variant="ghost" disabled={!selectedIntegration} onClick={()=>void act(()=>api.syncIntegration(Number(selectedIntegration)))}>Sync</Button><Button variant="ghost" disabled={!selectedIntegration} onClick={()=>void act(()=>api.oauthDisconnect(Number(selectedIntegration)))}>Disconnect OAuth</Button></div>
        <Field label="Selected integration"><Select className="mt-3" value={selectedIntegration} onChange={e=>setSelectedIntegration(e.target.value)}><option value="">Select integration</option>{integrations.map(i=><option key={String(i.id)} value={String(i.id)}>{String(i.name)} · {String(i.provider)}</option>)}</Select></Field>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{integrations.slice(0,8).map(i=><div key={String(i.id)} className="rounded-xl border border-white/10 p-3 text-xs"><div className="flex justify-between"><span className="font-medium">{String(i.name)}</span><StatusBadge value={String(i.health_status??"UNKNOWN")}/></div><div className="mt-1 text-slate-500">{String(i.provider)} · {formatLabel(String(i.category??""))} · {formatLabel(String(i.status??""))}</div></div>)}</div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<CalendarDays className="h-4 w-4"/>} title="Emergency meetings"/>
        <p className="mt-1 text-xs text-slate-500">Schedule an incident bridge with optional integration and participants.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Meeting topic"><Input value={meeting.topic} placeholder="Security incident bridge" onChange={e=>setMeeting({...meeting,topic:e.target.value})}/></Field>
          <Field label="Status"><Select value={meeting.status} onChange={e=>setMeeting({...meeting,status:e.target.value})}><option>SCHEDULED</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>CANCELLED</option></Select></Field>
          <Field label="Incident ID (optional)"><Input type="number" min="1" value={meeting.incident_id} placeholder="Incident ID" onChange={e=>setMeeting({...meeting,incident_id:e.target.value})}/></Field>
          <Field label="Integration (optional)"><Select value={meeting.integration_id} onChange={e=>setMeeting({...meeting,integration_id:e.target.value})}><option value="">None</option>{integrations.map(i=><option key={String(i.id)} value={String(i.id)}>{String(i.name)}</option>)}</Select></Field>
          <Field label="Start time"><Input type="datetime-local" value={meeting.start_time} onChange={e=>setMeeting({...meeting,start_time:e.target.value})}/></Field>
          <Field label="End time (optional)"><Input type="datetime-local" value={meeting.end_time} onChange={e=>setMeeting({...meeting,end_time:e.target.value})}/></Field>
          <Field label="Participants"><Input value={meeting.participants} placeholder="alice@example.com, bob@example.com" onChange={e=>setMeeting({...meeting,participants:e.target.value})}/></Field>
          <Field label="Security briefing notes"><Input value={meeting.notes} placeholder="Key incident details for responders" onChange={e=>setMeeting({...meeting,notes:e.target.value})}/></Field>
        </div>
        <Button className="mt-3" disabled={!meeting.topic.trim()||!meeting.start_time} onClick={()=>void act(()=>api.createMeeting(meetingPayload()))}><CalendarDays className="h-4 w-4"/>Schedule meeting</Button>
        <div className="mt-4 space-y-2">{meetings.slice(0,8).map(m=><div key={String(m.id)} className="rounded-xl border border-white/10 p-3"><div className="flex justify-between"><span className="font-medium">{String(m.topic)}</span><StatusBadge value={String(m.status??"SCHEDULED")}/></div><div className="mt-1 text-xs text-slate-500">{formatDate(m.start_time)}</div>{m.join_url&&<a className="mt-2 inline-block text-xs text-cyan-300" href={String(m.join_url)} target="_blank" rel="noreferrer">Open meeting</a>}</div>)}</div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<Shield className="h-4 w-4"/>} title="Data governance & consent"/>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Metric label="Retention status" value={retention?formatLabel(String(retention.status??retention.state??"Available")):"Loading"}/>
          <Metric label="Archived" value={retention?String(retention.archived_count??retention.archived??0):"—"}/>
          <Metric label="Eligible records" value={retention?String(retention.eligible_count??retention.eligible??0):"—"}/>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Consent scope"><Input value={consentScope} onChange={e=>setConsentScope(e.target.value)} placeholder="telemetry_collection"/></Field>
          <Field label="Consent version"><Input value={consentVersion} onChange={e=>setConsentVersion(e.target.value)} placeholder="1.0"/></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={()=>void act(()=>api.enforceRetention(true))}>Enforce retention</Button><Button variant="ghost" onClick={()=>void act(()=>api.grantConsent({permission_scope:consentScope.trim(),consent_version:consentVersion.trim()||"1.0"}))}>Grant consent</Button><Button variant="ghost" onClick={()=>void act(()=>api.revokeConsent(consentScope.trim()))}>Revoke consent</Button></div>
        <div className="mt-4 space-y-2">{consents.slice(0,8).map(c=><div key={String(c.id)} className="rounded-xl border border-white/10 p-3 text-xs"><div className="flex justify-between"><span>{formatLabel(String(c.permission_scope))}</span><StatusBadge value={Boolean(c.consent_given)?"GRANTED":"REVOKED"}/></div><div className="mt-1 text-slate-500">Version {String(c.consent_version??"—")} · {formatDate(c.granted_at)}</div></div>)}</div>
      </Panel>

      <Panel className="p-5">
        <SectionTitle icon={<RefreshCw className="h-4 w-4"/>} title="Background tasks"/>
        <p className="mt-1 text-xs text-slate-500">Submit a supported background operation and monitor it by task ID.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Task"><Select value={task.task_name} onChange={e=>setTask({...task,task_name:e.target.value})}><option>RECALCULATE_HUMAN_RISK</option><option>SYNC_INTEGRATION</option><option>REFRESH_THREAT_INTELLIGENCE</option></Select></Field>
          <Field label="Task parameter (optional)"><Input value={task.payload_value} placeholder="Example: user_id=12" onChange={e=>setTask({...task,payload_value:e.target.value})}/></Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><Button onClick={async()=>{const ok=await act(async()=>{const r=await api.submitTask(taskPayload());if(r&&typeof r==="object"&&"task_id" in r)setTaskId(String((r as JsonObject).task_id));})}}><Play className="h-4 w-4"/>Submit task</Button><Input className="max-w-xs" placeholder="Task ID" value={taskId} onChange={e=>setTaskId(e.target.value)}/><Button variant="ghost" disabled={!taskId.trim()} onClick={()=>void act(()=>api.pollTask(taskId.trim()))}>Check status</Button></div>
      </Panel>

      <Panel className="p-5 xl:col-span-2">
        <SectionTitle icon={<FileCog className="h-4 w-4"/>} title="Versioned security policies"/>
        <p className="mt-1 text-xs text-slate-500">Create a policy with a clear type, threshold and activation state.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Policy name"><Input value={policy.name} placeholder="Default Risk Threshold" onChange={e=>setPolicy({...policy,name:e.target.value})}/></Field>
          <Field label="Policy type"><Select value={policy.policy_type} onChange={e=>setPolicy({...policy,policy_type:e.target.value})}><option>RISK_THRESHOLD</option><option>PLAYBOOK_TRIGGER</option><option>RETENTION_RULE</option><option>AUTH_RULE</option><option>ACCESS_CONTROL</option></Select></Field>
          <Field label="Critical threshold"><Input type="number" min="0" max="100" value={policy.threshold} onChange={e=>setPolicy({...policy,threshold:Math.max(0,Math.min(100,Number(e.target.value)))})}/></Field>
          <div><span className="mb-1.5 block text-xs font-medium text-slate-400">State</span><Toggle label="Policy active" checked={policy.is_active} onChange={v=>setPolicy({...policy,is_active:v})}/></div>
        </div>
        <Button className="mt-3" disabled={!policy.name.trim()} onClick={()=>void act(()=>api.createPolicy(policyPayload()))}><Plus className="h-4 w-4"/>Create policy</Button>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{policies.slice(0,12).map(p=><div key={String(p.id)} className="rounded-xl border border-white/10 p-4"><div className="flex justify-between gap-3"><span className="font-medium">{String(p.name)}</span><span className="text-xs text-slate-500">v{String(p.version)}</span></div><div className="mt-1 text-xs text-slate-500">{formatLabel(String(p.policy_type??""))} · {Boolean(p.is_active)?"Active":"Inactive"}</div><div className="mt-3 flex gap-2"><Button variant="ghost" onClick={()=>void act(()=>api.updatePolicy(Number(p.id),{is_active:!Boolean(p.is_active)}))}>{Boolean(p.is_active)?"Disable":"Enable"}</Button><Button variant="danger" onClick={()=>void act(()=>api.deletePolicy(Number(p.id)))}><Trash2 className="h-4 w-4"/>Delete</Button></div></div>)}</div>
      </Panel>
    </div>
    {(message||error)&&<Panel className={"mt-5 p-4 text-sm " + (error?"text-red-300 border border-red-400/20":"text-emerald-300 border border-emerald-400/20")}>{error||message}</Panel>}
  </ProtectedShell>;
}

function SectionTitle({icon,title}:{icon:ReactNode;title:string}){return <div className="flex items-center gap-2"><span className="text-cyan-300">{icon}</span><h2 className="font-semibold">{title}</h2></div>}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>{children}</label>}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-3 py-2.5"><span className="text-sm text-slate-300">{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="h-4 w-4 accent-cyan-400"/></label>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white/10 bg-white/[.02] p-3"><div className="text-lg font-bold">{value}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</div></div>}
function StatusBadge({value}:{value:string}){const v=value.replaceAll("_"," ");return <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[10px] uppercase tracking-wider text-slate-300">{v}</span>}
function formatLabel(value:string){return value.replace(/_/g," ").replace(/\b\w/g,letter=>letter.toUpperCase())}
function formatDate(value:unknown){if(!value)return "—";const d=new Date(String(value));return Number.isNaN(d.getTime())?String(value):d.toLocaleString()}
