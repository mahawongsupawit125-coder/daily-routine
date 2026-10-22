(function(root){
'use strict';
function blankState(core){const s=core.createState();s.days={};s.care=[];s.settings={name:'คุณ',waterReference:0};return s;}
function createAccountStore({core,storage,api,onStatus=()=>{},cacheId=''}){
 const s={userId:null,key:null,state:null,revision:0,ready:false,status:'guest'};
 let generation=0,editVersion=0,dirty=false,pending=null;
 const fail=(message,code)=>Object.assign(Error(message),{code});
 function status(value){s.status=value;onStatus(value);}
 function persist(){storage.setItem(s.key,JSON.stringify({state:s.state,revision:s.revision,dirty}));}
 function read(raw){if(!raw)return null;const x=JSON.parse(raw);if(!Number.isSafeInteger(x.revision)||x.revision<0||typeof x.dirty!=='boolean')throw Error('Invalid account cache');return {...x,state:core.parseImport(JSON.stringify(x.state))};}
 s.open=async function(userId){
  const token=++generation;s.userId=userId;s.key='jai-account.v1:'+userId+(cacheId?':'+cacheId:'');s.state=null;s.ready=false;s.revision=0;editVersion=0;dirty=false;pending=null;status('loading');
  let cached=null;
  try{
   cached=read(storage.getItem(s.key));const remote=await api.load(userId);
   if(token!==generation)return false;
   if(remote&&(!Number.isSafeInteger(remote.revision)||remote.revision<1))throw Error('Invalid revision');
   const remoteState=remote?core.parseImport(JSON.stringify(remote.state)):blankState(core);
   s.revision=remote?.revision||0;
   if(cached?.dirty){s.state=cached.state;dirty=true;
    if(cached.revision!==s.revision){s.revision=cached.revision;s.ready=true;status('conflict');return true;}
   }else s.state=remoteState;
   persist();s.ready=true;status(dirty?'pending':'synced');return true;
  }catch(error){if(token===generation){s.ready=false;s.state=cached?.state||null;status('error');}throw error;}
 };
 s.edit=function(state){if(!s.ready)throw fail('Account is not ready','locked');s.state=core.parseImport(JSON.stringify(state));dirty=true;editVersion++;try{persist();}catch(error){status('storage-error');throw error;}if(s.status!=='conflict')status('pending');};
 s.flush=function(){
  if(pending)return pending;
  if(!s.ready)return Promise.reject(fail('Account is not ready','locked'));
  if(s.status==='conflict')return Promise.reject(fail('Keep local draft before loading remote','conflict'));
  const token=generation,user=s.userId;
  const task=(async()=>{
   while(dirty&&token===generation){
    const version=editVersion,snapshot=core.clone(s.state),revision=s.revision;status('saving');
    try{
     const result=await api.save(snapshot,revision,user);
     if(token!==generation)return;
     if(!Number.isSafeInteger(result.revision)||result.revision!==revision+1)throw Error('Invalid save revision');
     s.revision=result.revision;dirty=editVersion!==version;persist();status(dirty?'pending':'synced');
    }catch(error){if(token===generation)status(error.code==='conflict'?'conflict':error.code==='session'?'session-expired':'offline');throw error;}
   }
  })();
  pending=task;task.finally(()=>{if(token===generation)pending=null;}).catch(()=>{});return task;
 };
 s.useRemote=async function(){
  const token=generation,user=s.userId,version=editVersion;status('loading');let remote;
  try{remote=await api.load(user);if(remote&&(!Number.isSafeInteger(remote.revision)||remote.revision<1))throw Error('Invalid revision');}catch(error){if(token===generation)status('conflict');throw error;}
  if(token!==generation)return false;
  if(version!==editVersion){status('conflict');throw fail('Local draft changed during reload','conflict');}
  s.state=remote?core.parseImport(JSON.stringify(remote.state)):blankState(core);s.revision=remote?.revision||0;dirty=false;editVersion++;persist();s.ready=true;status('synced');return true;
 };
 s.close=function(){generation++;s.userId=null;s.key=null;s.state=null;s.revision=0;s.ready=false;dirty=false;pending=null;status('guest');};
 return s;
}
const api={createAccountStore,blankState};if(typeof module!=='undefined')module.exports=api;else root.JaiAccountStore=api;
})(globalThis);
