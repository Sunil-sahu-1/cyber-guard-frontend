const BASE_URL=(process.env.NEXT_PUBLIC_API_BASE_URL??"http://127.0.0.1:8000/api").replace(/\/$/,"");

export function getAccessToken(){if(typeof window==="undefined")return null;return localStorage.getItem("cg_access")}
export function getRefreshToken(){if(typeof window==="undefined")return null;return localStorage.getItem("cg_refresh")}
export function saveTokens(access:string,refresh:string){localStorage.setItem("cg_access",access);localStorage.setItem("cg_refresh",refresh)}
export function clearTokens(){localStorage.removeItem("cg_access");localStorage.removeItem("cg_refresh");localStorage.removeItem("cg_user")}
export function saveUser(user:unknown){localStorage.setItem("cg_user",JSON.stringify(user))}
export function getSavedUser<T=unknown>(){if(typeof window==="undefined")return null;const raw=localStorage.getItem("cg_user");return raw?JSON.parse(raw) as T:null}

export async function apiFetch<T>(path:string,init:RequestInit={}){const token=getAccessToken();const headers=new Headers(init.headers);if(!(init.body instanceof FormData))headers.set("Content-Type","application/json");if(token)headers.set("Authorization",`Bearer ${token}`);const res=await fetch(`${BASE_URL}${path}`,{...init,headers,cache:"no-store"});const text=await res.text();let data:unknown={};try{data=text?JSON.parse(text):{}}catch{data={detail:text}}if(!res.ok){const message=typeof data==="object"&&data&&"detail" in data?String((data as {detail:unknown}).detail):"Request failed";throw new Error(message)}return data as T}
