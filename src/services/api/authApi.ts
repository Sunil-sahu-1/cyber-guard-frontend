import {apiFetch,saveTokens,saveUser,clearTokens,getRefreshToken} from "./client";import type {AuthResponse,User} from "@/types/api";
export async function login(user_id:string,password:string){const data=await apiFetch<AuthResponse>("/auth/login/",{method:"POST",body:JSON.stringify({user_id,password})});saveTokens(data.access,data.refresh);saveUser(data.user);return data}
export async function register(payload:Record<string,unknown>){return apiFetch<{message?:string}>("/auth/register/",{method:"POST",body:JSON.stringify(payload)})}
export async function getMe(){return apiFetch<User>("/auth/me/")}
export async function refreshAccess(){const refresh=getRefreshToken();if(!refresh)throw new Error("No refresh token");const data=await apiFetch<{access:string;refresh?:string}>("/auth/token/refresh/",{method:"POST",body:JSON.stringify({refresh})});saveTokens(data.access,data.refresh??refresh);return data}
export async function logout(){const refresh=getRefreshToken();try{if(refresh)await apiFetch("/auth/logout/",{method:"POST",body:JSON.stringify({refresh})})}finally{clearTokens()}}
