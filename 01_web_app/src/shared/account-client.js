(function(root){
'use strict';
const SESSION_KEY='jai-auth.v1';
function createClient(config,{fetch:request=root.fetch?.bind(root),storage=root.localStorage,now=()=>Date.now()}={}){
 let session=null,refreshing=null,generation=0;
 const error=(message,code)=>Object.assign(Error(message),{code});
 function configured(){if(!config.enabled||!config.url||!config.key)throw error('ระบบบัญชียังอยู่ระหว่างตั้งค่า','unconfigured');}
 async function call(path,body,token,method='POST'){
  configured();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const res=await request(config.url+path,{method,headers:{apikey:config.key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});
   let value;try{value=await res.json();}catch{if(res.ok)throw error('เซิร์ฟเวอร์ตอบข้อมูลไม่สมบูรณ์','response');}
   if(!res.ok)throw error(res.status===409?'ข้อมูลเปลี่ยนจากอีกเครื่อง กรุณาสำรองฉบับนี้ก่อนโหลดใหม่':res.status===401?'กรุณาเข้าสู่ระบบอีกครั้ง':res.status===429?'ลองบ่อยเกินไป กรุณารอสักครู่':'ดำเนินการไม่สำเร็จ กรุณาตรวจข้อมูลและลองใหม่',res.status===409?'conflict':res.status===401?'session':res.status===429?'rate-limit':'server');
   return value;
  }finally{clearTimeout(timeout);}
 }
 function accept(value){
  if(!value?.access_token||!value.refresh_token||!value.user?.id)throw error('ข้อมูลเข้าสู่ระบบไม่สมบูรณ์','session');
  const next={access_token:value.access_token,refresh_token:value.refresh_token,expires_at:value.expires_at||Math.floor(now()/1000)+(value.expires_in||3600),user:{id:value.user.id,user_metadata:{username:value.user.user_metadata?.username||'',display_name:value.user.user_metadata?.display_name||''}}};
  storage.setItem(SESSION_KEY,JSON.stringify(next));session=next;return next.user;
 }
 async function bearer(userId){
  if(!session||session.user.id!==userId)throw error('กรุณาเข้าสู่ระบบอีกครั้ง','session');
  if(session.expires_at<=now()/1000+60){
   if(!refreshing){const g=generation;refreshing=call('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(value=>{if(g!==generation)throw error('บัญชีเปลี่ยนแล้ว','session');return accept(value);}).catch(e=>{if(e.code==='server')e.code='session';throw e;}).finally(()=>refreshing=null);}
   await refreshing;
  }
  if(!session||session.user.id!==userId)throw error('บัญชีถูกเปลี่ยน กรุณาโหลดหน้าใหม่','session');
  return session.access_token;
 }
 return {
  sessionKey:SESSION_KEY,
  enabled:()=>Boolean(config.enabled&&config.url&&config.key),
  user:()=>session?.user||null,
  invalidate(){generation++;session=null;},
  restore(){configured();const raw=storage.getItem(SESSION_KEY);if(!raw)return null;try{const saved=JSON.parse(raw);if(!Number.isFinite(saved.expires_at))throw Error();accept(saved);return session.user;}catch{storage.removeItem(SESSION_KEY);throw error('กรุณาเข้าสู่ระบบอีกครั้ง','session');}},
  async signIn(username,password){const g=++generation;const value=await call('/functions/v1/account',{action:'login',username,password});if(g!==generation)throw error('บัญชีเปลี่ยนแล้ว','session');return accept(value);},
  async signUp({username,displayName,email},password,redirectTo){return call('/auth/v1/signup'+(redirectTo?'?redirect_to='+encodeURIComponent(redirectTo):''),{email,password,data:{username:username.trim().toLowerCase(),display_name:displayName.trim()}});},
  async recover(email,redirectTo){return call('/auth/v1/recover'+(redirectTo?'?redirect_to='+encodeURIComponent(redirectTo):''),{email});},
  async updatePassword(password){const userId=session?.user?.id;const token=await bearer(userId);return call('/auth/v1/user',{password},token,'PUT');},
  async consumeCallback(href){
   const p=new URL(href).hash.slice(1),params=new URLSearchParams(p);
   if(params.has('error'))throw error('ลิงก์ยืนยันหมดอายุหรือใช้ไม่ได้ กรุณาขอลิงก์ใหม่','link');
   if(!params.has('access_token'))return null;
   const token=params.get('access_token'),user=await call('/auth/v1/user',undefined,token,'GET');
   accept({access_token:token,refresh_token:params.get('refresh_token'),expires_in:Number(params.get('expires_in'))||3600,user});
   return {recovery:params.get('type')==='recovery',user:session.user};
  },
  async load(userId){return call('/functions/v1/account',{action:'load'},await bearer(userId));},
  async save(state,revision,userId){return call('/functions/v1/account',{action:'save',state,revision},await bearer(userId));},
  async signOut(){const token=session?.access_token;generation++;session=null;storage.removeItem(SESSION_KEY);if(token)try{await call('/auth/v1/logout',undefined,token);}catch{/* Local logout still succeeds; old access tokens expire server-side. */}}
 };
}
const api={createClient,SESSION_KEY};if(typeof module!=='undefined')module.exports=api;else root.JaiAccountClient=api;
})(globalThis);
