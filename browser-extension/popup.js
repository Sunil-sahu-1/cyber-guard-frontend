const $ = (id) => document.getElementById(id);
const SENSITIVE_COOKIE_NAMES = /(session|sess|auth|token|jwt|sid|csrf|xsrf|password|passwd|secret|access|refresh)/i;
const PERMISSION_INFO = {
  cookies:["Cookies","Can read or modify cookie metadata/values for permitted sites.","HIGH"],
  management:["Extension management","Can inspect installed extensions and their declared permissions.","MEDIUM"],
  tabs:["Tabs","Can access sensitive tab information and interact with permitted tabs.","HIGH"],
  webRequest:["Web requests","Can observe network request metadata for permitted traffic.","HIGH"],
  webRequestBlocking:["Blocking web requests","Can block or modify permitted web requests.","HIGH"],
  scripting:["Script injection","Can inject scripts into pages when host access permits it.","HIGH"],
  history:["Browsing history","Can read browser history.","HIGH"],
  downloads:["Downloads","Can inspect and manage downloads.","MEDIUM"],
  bookmarks:["Bookmarks","Can read and modify bookmarks.","MEDIUM"],
  clipboardRead:["Clipboard read","Can read clipboard content when allowed by the browser.","HIGH"],
  geolocation:["Location","Can access location-related browser capabilities where applicable.","HIGH"],
  nativeMessaging:["Native messaging","Can communicate with a native application on the computer.","HIGH"],
  identity:["Identity","Can use identity-related browser APIs.","MEDIUM"],
  activeTab:["Active tab","Gets temporary access to the current tab after a user action.","MEDIUM"],
  storage:["Extension storage","Can store extension data locally; this alone does not grant website access.","LOW"],
  notifications:["Notifications","Can display browser notifications.","LOW"]
};

function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

function permissionTags(permissions,origins){
  const tags=[];
  for(const permission of permissions||[]){
    const info=PERMISSION_INFO[permission]||[permission,"Declared browser permission.","MEDIUM"];
    const cls=info[2]==="HIGH"?"risk-high":info[2]==="MEDIUM"?"risk-medium":"risk-low";
    tags.push('<span class="tag '+cls+'">'+escapeHtml(info[0])+"</span>");
  }
  for(const origin of origins||[]){
    const high=origin==="<all_urls>"||/^https?:\/\/\*\//.test(origin);
    tags.push('<span class="tag '+(high?"risk-high":"risk-medium")+'">Host: '+escapeHtml(origin)+"</span>");
  }
  return tags.join("");
}

function getApiBase(){
  return String($("apiBase").value||"http://127.0.0.1:8000/api").replace(/\/$/,"");
}

async function requestCookieAccess(){
  const granted=await chrome.permissions.request({origins:["<all_urls>"]});
  setStatus(granted?"Cookie metadata access granted. Values remain hidden and are never transmitted.":"Cookie access was not granted.");
}

async function getScannerToken(){
  const result=await chrome.storage.session.get(["scannerToken"]);
  return result.scannerToken||"";
}

async function connect(){
  const pairingCode=String($("pairingCode").value||"").trim().toUpperCase();
  if(pairingCode.length!==8){setStatus("Enter the 8-character pairing code.");return;}
  setStatus("Connecting to Cyber Guard...");
  try{
    const response=await fetch(getApiBase()+"/browser-privacy/connect/",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({pairing_code:pairingCode})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.detail||data.message||"Connection failed.");
    await chrome.storage.session.set({scannerToken:data.scan_token,apiBase:getApiBase()});
    setStatus("Connected. The short-lived scanner token is stored only in extension session storage.");
  }catch(error){setStatus(error instanceof Error?error.message:"Connection failed.");}
}

async function scanCookies(){
  const hasAccess=await chrome.permissions.contains({origins:["<all_urls>"]});
  if(!hasAccess) throw new Error("Grant cookie access first.");
  const cookies=await chrome.cookies.getAll({});
  const sensitive=cookies.filter(cookie=>SENSITIVE_COOKIE_NAMES.test(cookie.name));
  $("cookieSummary").innerHTML=[card(cookies.length,"Total cookies"),card(sensitive.length,"Potentially sensitive names"),card(new Set(cookies.map(c=>c.domain)).size,"Domains")].join("");
  $("cookieList").innerHTML=cookies.sort((a,b)=>a.domain.localeCompare(b.domain)||a.name.localeCompare(b.name)).slice(0,250).map(cookie=>{
    const sensitiveName=SENSITIVE_COOKIE_NAMES.test(cookie.name);
    return '<div class="item"><div class="item-title">'+escapeHtml(cookie.name)+(sensitiveName?' <span class="risk-high">• sensitive-looking name</span>':"")+'</div><div class="meta">Domain: '+escapeHtml(cookie.domain)+" · Path: "+escapeHtml(cookie.path)+" · "+(cookie.secure?"Secure":"Not Secure")+" · "+(cookie.httpOnly?"HttpOnly":"Script-readable")+" · SameSite: "+escapeHtml(cookie.sameSite)+"</div></div>";
  }).join("")||'<div class="item">No cookies found for the granted scope.</div>';
  return cookies.map(cookie=>({
    name:cookie.name,
    domain:cookie.domain,
    path:cookie.path,
    secure:Boolean(cookie.secure),
    httpOnly:Boolean(cookie.httpOnly),
    sameSite:cookie.sameSite||"",
    hostOnly:Boolean(cookie.hostOnly),
    session:Boolean(cookie.session)
  }));
}

async function scanExtensions(){
  const extensions=await chrome.management.getAll();
  const installed=extensions.filter(item=>item.type==="extension");
  $("extensionList").innerHTML=installed.sort((a,b)=>a.name.localeCompare(b.name)).map(extension=>{
    const permissions=extension.permissions||[], origins=extension.hostPermissions||[];
    const highCount=permissions.filter(p=>PERMISSION_INFO[p]?.[2]==="HIGH").length+origins.filter(o=>o==="<all_urls>"||/^https?:\/\/\*\//.test(o)).length;
    return '<div class="item"><div class="item-title">'+escapeHtml(extension.name)+"</div><div class="meta">Version "+escapeHtml(extension.version||"unknown")+" · "+(extension.enabled?"Enabled":"Disabled")+" · ID: "+escapeHtml(extension.id)+"</div><div class="meta">Declared access: "+(highCount?'<span class="risk-high">'+highCount+" high-impact item(s)</span>":"No high-impact permission detected")+'</div><div>'+permissionTags(permissions,origins)+"</div></div>";
  }).join("")||'<div class="item">No browser extensions detected.</div>';
  return installed.map(extension=>({
    id:extension.id||"",
    name:extension.name||"",
    version:extension.version||"",
    enabled:Boolean(extension.enabled),
    type:extension.type||"",
    permissions:(extension.permissions||[]).slice(0,100),
    host_permissions:(extension.hostPermissions||[]).slice(0,100),
    high_impact_permissions:(extension.permissions||[]).filter(p=>PERMISSION_INFO[p]?.[2]==="HIGH").slice(0,100)
  }));
}

function card(value,label){return '<div class="card"><strong>'+escapeHtml(value)+'</strong><span>'+escapeHtml(label)+"</span></div>";}
function setStatus(message){$("status").textContent=message;}

async function sendScan(cookies,extensions){
  const token=await getScannerToken();
  if(!token) throw new Error("Connect the scanner with a Cyber Guard pairing code first.");
  const response=await fetch(getApiBase()+"/browser-privacy/scans/",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization:"Bearer "+token},
    body:JSON.stringify({
      browser:"Chrome/Chromium",
      browser_version:navigator.userAgent,
      platform:navigator.platform,
      cookies,
      extensions
    })
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.detail||data.message||"Backend scan upload failed.");
  return data;
}

async function scan(){
  setStatus("Scanning browser locally...");
  try{
    const cookies=await scanCookies();
    const extensions=await scanExtensions();
    setStatus("Uploading sanitized metadata to Cyber Guard...");
    const result=await sendScan(cookies,extensions);
    setStatus("Scan stored in Cyber Guard. Scan ID: "+result.scan_id);
  }catch(error){setStatus(error instanceof Error?error.message:"Scan failed.");}
}

$("connect").addEventListener("click",()=>void connect());
$("cookieAccess").addEventListener("click",()=>void requestCookieAccess());
$("scan").addEventListener("click",()=>void scan());
void (async()=>{
  const saved=await chrome.storage.session.get(["apiBase"]);
  if(saved.apiBase) $("apiBase").value=saved.apiBase;
  void scanExtensions();
})();
