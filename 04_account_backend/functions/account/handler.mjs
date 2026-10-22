export function createHandler({core,cloudState,url,key,secret,origins,fetch:request=globalThis.fetch}){
 const json=(data,status=200,cors={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...cors}});
 const authHeaders=token=>({apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'});
 async function db(path,body){const res=await request(url+'/rest/v1/'+path,{method:'POST',headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});if(!res.ok)throw Error('Database unavailable');return res.json();}
 async function digest(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret+':'+value));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
 return async req=>{
  const origin=req.headers.get('origin'),allowed=origins.includes(origin),cors=allowed?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}:{};
  if(origin&&!allowed)return json({error:'origin'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return json({error:'method'},405,cors);
  try{
   if(Number(req.headers.get('content-length'))>5000000)return json({error:'size'},413,cors);
   const reader=req.body?.getReader();if(!reader)return json({error:'body'},400,cors);
   const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>5000000){await reader.cancel();return json({error:'size'},413,cors);}chunks.push(value);}
   const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
   let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'body'},400,cors);}
   if(!body||typeof body!=='object')return json({error:'body'},400,cors);
   if(body.action==='login'){
    const username=typeof body.username==='string'?body.username.trim().toLowerCase():'';
    if(!/^[a-z0-9_]{3,30}$/.test(username)||typeof body.password!=='string'||!body.password||body.password.length>128)return json({error:'credentials'},401,cors);
    const ip=(req.headers.get('x-forwarded-for')||'unknown').slice(0,200);
    for(const limitKey of ['user:'+username,'ip:'+ip])if(!await db('rpc/account_login_slot',{p_key:await digest(limitKey)}))return json({error:'rate_limit'},429,cors);
    const email=await db('rpc/account_username_email',{p_username:username});
    // A fixed nonexistent account keeps the password verification path for unknown usernames.
    const result=await request(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:email||'missing-account@invalid.example',password:body.password}),signal:AbortSignal.timeout(15000)});
    if(!result.ok||!email)return json({error:'credentials'},401,cors);
    return json(await result.json(),200,cors);
   }
   const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
   if(!token)return json({error:'session'},401,cors);
   const verified=await request(url+'/auth/v1/user',{method:'GET',headers:authHeaders(token),signal:AbortSignal.timeout(15000)});
   if(!verified.ok)return json({error:'session'},401,cors);
   const user=await verified.json();if(!user.id)return json({error:'session'},401,cors);
   if(body.action==='load'){const rows=await db('rpc/account_load',{p_user:user.id});return json(rows?.[0]||null,200,cors);}
   if(body.action==='save'){
    if(!Number.isSafeInteger(body.revision)||body.revision<0)return json({error:'revision'},400,cors);
    let state;try{state=cloudState(core,body.state);}catch{return json({error:'state'},400,cors);}
    const revision=await db('rpc/account_save',{p_user:user.id,p_state:state,p_revision:body.revision});
    return revision===null?json({error:'conflict'},409,cors):json({revision},200,cors);
   }
   return json({error:'action'},400,cors);
  }catch{return json({error:'unavailable'},503,cors);}
 };
}
