const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createAccountStore,blankState}=require('../01_web_app/src/shared/account-store.js');
const C=require('../01_web_app/src/shared/core.js');
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const fixture=()=>{const rows=new Map(),calls=[];const api={async load(id='A'){return rows.has(id)?C.clone(rows.get(id)):null;},async save(s,r,id='A'){calls.push({s,r});const rev=rows.get(id)?.revision||0;if(r!==rev)throw Object.assign(Error('conflict'),{code:'conflict'});rows.set(id,{state:C.clone(s),revision:rev+1});return {revision:rev+1};}};return {api,calls,replace(s,id='A'){rows.set(id,{state:C.clone(s),revision:(rows.get(id)?.revision||0)+1});}};};
test('new accounts start without guest personal history or body measurements',()=>{
 const s=blankState(C);assert.deepEqual(s.days,{});assert.equal(s.settings.body,undefined);assert.deepEqual(s.care,[]);assert.notEqual(s.settings.name,'Supawit');C.validate(s);
});
test('loading A never imports guest state; B and signout use separate caches',async()=>{
 const cache=storage(),guest=C.createState();cache.setItem('jai-daily.v1',JSON.stringify(guest));
 const f=fixture(),s=createAccountStore({core:C,storage:cache,api:f.api});
 await s.open('A');assert.deepEqual(s.state.days,{});s.state.settings.name='Alice';s.edit(s.state);await s.flush();
 await s.open('B');assert.notEqual(s.state.settings.name,'Alice');s.close();assert.equal(s.userId,null);assert.equal(cache.getItem('jai-daily.v1'),JSON.stringify(guest));
});
test('network load failure does not replace account with guest or blank data',async()=>{
 const s=createAccountStore({core:C,storage:storage(),api:{async load(){throw Error('offline');}}});
 await assert.rejects(s.open('A'),/offline/);assert.equal(s.ready,false);assert.equal(s.state,null);
});
test('a changed remote revision preserves dirty local work and blocks overwriting',async()=>{
 const cache=storage(),f=fixture(),s=createAccountStore({core:C,storage:cache,api:f.api});
 await s.open('A');s.state.settings.name='Local';s.edit(s.state);const remote=blankState(C);remote.settings.name='Other device';f.replace(remote);
 await assert.rejects(s.flush(),e=>e.code==='conflict');assert.equal(s.status,'conflict');assert.equal(s.state.settings.name,'Local');assert.equal(JSON.parse(cache.getItem(s.key)).dirty,true);
 const reopened=createAccountStore({core:C,storage:cache,api:f.api});await reopened.open('A');assert.equal(reopened.status,'conflict');assert.equal(reopened.state.settings.name,'Local');await reopened.useRemote();assert.equal(reopened.state.settings.name,'Other device');
});
test('edits during a save are sent with the returned revision, without losing changes',async()=>{
 let release;const f=fixture(),cache=storage();const original=f.api.save;let first=true;f.api.save=async(s,r)=>{if(first){first=false;await new Promise(resolve=>release=resolve);}return original(s,r);};
 const s=createAccountStore({core:C,storage:cache,api:f.api});await s.open('A');s.state.settings.name='First';s.edit(s.state);const pending=s.flush();await Promise.resolve();
 s.state.settings.name='Second';s.edit(s.state);release();await pending;assert.deepEqual(f.calls.map(x=>x.r),[0,1]);assert.equal(f.calls[1].s.settings.name,'Second');assert.equal(s.status,'synced');
});
test('late responses for a previous account cannot update the next account',async()=>{
 let release;const f=fixture(),base=f.api.load;let once=true;f.api.load=()=>once?(once=false,new Promise(resolve=>release=resolve)):base();
 const s=createAccountStore({core:C,storage:storage(),api:f.api});const old=s.open('A');await s.open('B');release({state:blankState(C),revision:10});await old;assert.equal(s.userId,'B');assert.equal(s.revision,0);
});
test('offline drafts reopen and retry with their base revision',async()=>{
 const cache=storage(),f=fixture(),s=createAccountStore({core:C,storage:cache,api:f.api});await s.open('A');s.state.settings.name='Draft';s.edit(s.state);
 const reopened=createAccountStore({core:C,storage:cache,api:f.api});await reopened.open('A');assert.equal(reopened.state.settings.name,'Draft');await reopened.flush();assert.equal(reopened.status,'synced');
});

test('cloud payload strips imported credentials and original food photos at every level',()=>{
 const {cloudState}=require('../01_web_app/src/shared/account-data.js');const s=C.createState();s.apiKey='private';s.settings.token='private';s.days['2026-10-19'].meals[0].image='data:private';s.workouts.A.exercises[0].password='private';
 const out=cloudState(C,s);assert.ok(!JSON.stringify(out).includes('private'));assert.equal(out.days['2026-10-19'].meals.length,3);
});

test('tab-specific draft caches prevent a late load from overwriting another tab draft',async()=>{
 const cache=storage(),f=fixture();let release;const slow={...f.api,load:()=>new Promise(r=>release=r)};
 const a=createAccountStore({core:C,storage:cache,api:slow,cacheId:'tab-a'}),b=createAccountStore({core:C,storage:cache,api:f.api,cacheId:'tab-b'});
 await b.open('A');const opening=a.open('A');b.state.settings.name='Unsaved in B';b.edit(b.state);release(null);await opening;
 assert.notEqual(a.key,b.key);assert.equal(JSON.parse(cache.getItem(b.key)).state.settings.name,'Unsaved in B');assert.equal(JSON.parse(cache.getItem(b.key)).dirty,true);
});
test('remote replacement refuses to discard edits made while remote is loading',async()=>{
 const f=fixture(),s=createAccountStore({core:C,storage:storage(),api:f.api});await s.open('A');let release;f.api.load=()=>new Promise(r=>release=r);
 const reload=s.useRemote();s.state.settings.name='New edit';s.edit(s.state);release({state:blankState(C),revision:1});await assert.rejects(reload,e=>e.code==='conflict');assert.equal(s.state.settings.name,'New edit');
});
test('failed account loading retains its cached draft read-only for export',async()=>{
 const cache=storage(),f=fixture(),s=createAccountStore({core:C,storage:cache,api:f.api});await s.open('A');s.state.settings.name='Draft';s.edit(s.state);
 const offline=createAccountStore({core:C,storage:cache,api:{load:async()=>{throw Error('offline');}}});await assert.rejects(offline.open('A'));assert.equal(offline.ready,false);assert.equal(offline.state.settings.name,'Draft');
});
