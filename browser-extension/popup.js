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
async function requestCookieAccess(){
  const granted=await chrome.permissions.request({origins:["<all_urls>"]});
  setStatus(granted?"Cookie metadata access granted. Values remain hidden and are never transmitted.":"Cookie access was not granted.");
}
async function scanCookies(){
  const hasAccess=await chrome.permissions.contains({origins:["<all_urls>"]});
  if(!hasAccess) throw new Error("Grant cookie access first.");
  const cookies=await chrome.cookies.getAll({});
  const sensitive=cookies.filter(cookie=>SENSITIVE_COOKIE_NAMES.test(cookie.name));
  $("cookieSummary").innerHTML=[card(cookies.length,"Total cookies"),card(sensitive.length,"Potentially sensitive names"),card(new Set(cookies.map(c=>c.domain)).size,"Domains")].join("");
  $("cookieList").innerHTML=cookies.sort((a,b)=>a.domain.localeCompare(b.domain)||a.name.localeCompare(b.name)).slice(0,250).map(cookie=>{
    const sensitiveName=SENSITIVE_COOKIE_NAMES.test(cookie.name);
    return '<div class="item"><div class="item-title">'+escapeHtml(cookie.name)+(sensitiveName?' <span class="risk-high">• sensitive-looking name</span>':"")+"</div><div class="meta">Domain: "+escapeHtml(cookie.domain)+" · Path: "+escapeHtml(cookie.path)+" · "+(cookie.secure?"Secure":"Not Secure")+" · "+(cookie.httpOnly?"HttpOnly":"Script-readable")+" · SameSite: "+escapeHtml(cookie.sameSite)+"</div></div>";
  }).join("")||'<div class="item">No cookies found for the granted scope.</div>';
}
async function scanExtensions(){
  const extensions=await chrome.management.getAll();
  const installed=extensions.filter(item=>item.type==="extension");
  $("extensionList").innerHTML=installed.sort((a,b)=>a.name.localeCompare(b.name)).map(extension=>{
    const permissions=extension.permissions||[], origins=extension.hostPermissions||[];
    const highCount=permissions.filter(p=>PERMISSION_INFO[p]?.[2]==="HIGH").length+origins.filter(o=>o==="<all_urls>"||/^https?:\/\/\*\//.test(o)).length;
    return '<div class="item"><div class="item-title">'+escapeHtml(extension.name)+"</div><div class="meta">Version "+escapeHtml(extension.version||"unknown")+" · "+(extension.enabled?"Enabled":"Disabled")+" · ID: "+escapeHtml(extension.id)+"</div><div class="meta">Declared access: "+(highCount?'<span class="risk-high">'+highCount+" high-impact item(s)</span>":"No high-impact permission detected")+"</div><div>"+permissionTags(permissions,origins)+"</div></div>";
  }).join("")||'<div class="item">No browser extensions detected.</div>';
}
function card(value,label){return '<div class="card"><strong>'+escapeHtml(value)+'</strong><span>'+escapeHtml(label)+"</span></div>";}
function setStatus(message){$("status").textContent=message;}
async function scan(){
  setStatus("Scanning locally...");
  try{await scanCookies();await scanExtensions();setStatus("Scan completed locally. No cookie values were collected or transmitted.");}
  catch(error){setStatus(error instanceof Error?error.message:"Scan failed.");}
}
$("cookieAccess").addEventListener("click",()=>void requestCookieAccess());
$("scan").addEventListener("click",()=>void scan());
void scanExtensions();
