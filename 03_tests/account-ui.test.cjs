const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom'),C=require('../01_web_app/src/shared/core.js');
const tick=()=>new Promise(r=>setTimeout(r,0));
function setup(t,{enabled=false,fetch}={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://site.test/daily-routine/',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 const guest=C.createState();guest.settings.name='Guest';w.localStorage.setItem('jai-daily.v1',JSON.stringify(guest));
 w.fetch=fetch||(()=>{throw Error('unexpected fetch');});
 for(const f of ['core.js','food-photo.js','body-page.js','hydration.js','account-client.js','account-data.js','account-store.js'])w.eval(fs.readFileSync(path.join(__dirname,'../dist',f),'utf8'));
 w.JaiAccountConfig={enabled,url:'https://test.supabase.co',key:enabled?'sb_publishable_test':''};
 w.eval(fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8'));
 t.after(()=>{assert.deepEqual(errors,[]);dom.window.close();});
 const q=s=>w.document.querySelector(s),click=s=>q(s).click();
 return {w,q,click,guest:JSON.stringify(guest),fill(values){for(const [key,value]of Object.entries(values))q('#accountForm [name="'+key+'"]').value=value;},submit(){q('#accountForm').requestSubmit();}};
}
const session={access_token:'access',refresh_token:'refresh',expires_at:9999999999,user:{id:'A',user_metadata:{username:'alice',display_name:'Alice'}}};
test('top-right account icon opens a clear unconfigured page without changing guest data',t=>{
 const a=setup(t);assert.ok(a.q('#accountButton svg'));a.click('#accountButton');assert.match(a.q('#content').textContent,/อยู่ระหว่างตั้งค่า/);assert.equal(a.w.localStorage.getItem('jai-daily.v1'),a.guest);
});
test('login forms include signup recovery and accessible password visibility',t=>{
 const a=setup(t,{enabled:true});a.click('#accountButton');assert.ok(a.q('[name="username"]'));assert.equal(a.q('[name="password"]').type,'password');a.click('[data-action="account-password-toggle"]');assert.equal(a.q('[name="password"]').type,'text');
 a.click('[data-mode="signup"]');assert.ok(a.q('[name="email"]'));assert.ok(a.q('[name="confirmPassword"]'));a.click('[data-mode="recover"]');assert.ok(a.q('[name="email"]'));assert.equal(a.q('[name="password"]'),null);
});
test('login loads account before editing, saves to account and logout restores untouched guest',async t=>{
 let cloud=null,revision=0;const calls=[];
 const a=setup(t,{enabled:true,fetch:async(url,opts)=>{const b=opts.body?JSON.parse(opts.body):{};calls.push(b);if(b.action==='login')return Response.json(session);if(b.action==='load')return Response.json(cloud?{state:cloud,revision}:null);if(b.action==='save'){assert.equal(b.revision,revision);cloud=b.state;return Response.json({revision:++revision});}return Response.json({});}});
 a.click('#accountButton');a.fill({username:'alice',password:'long-password'});a.submit();for(let i=0;i<5;i++)await tick();
 assert.match(a.q('#accountButton').textContent,/Alice/);assert.equal(a.w.localStorage.getItem('jai-daily.v1'),a.guest);
 a.click('[data-page="water"]');a.click('[data-action="water-toggle"][data-id="w0"]');
 a.click('#accountButton');a.click('[data-action="account-retry"]');for(let i=0;i<5;i++)await tick();assert.ok(cloud);assert.equal(a.w.localStorage.getItem('jai-daily.v1'),a.guest);
 a.click('[data-action="account-logout"]');for(let i=0;i<3;i++)await tick();assert.match(a.q('#accountButton').textContent,/เข้าสู่ระบบ/);assert.equal(a.w.localStorage.getItem('jai-daily.v1'),a.guest);
});
test('failed account load never renders or exports guest history as account data',async t=>{
 const a=setup(t,{enabled:true,fetch:async(url,o)=>{const b=JSON.parse(o.body||'{}');return b.action==='login'?Response.json(session):Response.json({}, {status:503});}});
 a.click('#accountButton');a.fill({username:'alice',password:'long-password'});a.submit();for(let i=0;i<5;i++)await tick();
 assert.equal(a.q('[data-action="export"]'),null);a.click('[data-page="water"]');assert.equal(a.q('[data-action="water-toggle"]'),null);assert.equal(a.w.localStorage.getItem('jai-daily.v1'),a.guest);
});
test('another-tab logout closes modal and a late save cannot unlock account editing',async t=>{
 let release;const a=setup(t,{enabled:true,fetch:async(url,o)=>{const b=JSON.parse(o.body||'{}');if(b.action==='login')return Response.json(session);if(b.action==='load')return Response.json(null);if(b.action==='save')return new Promise(resolve=>release=()=>resolve(Response.json({revision:1})));return Response.json({});}});
 a.click('#accountButton');a.fill({username:'alice',password:'long-password'});a.submit();for(let i=0;i<5;i++)await tick();
 a.click('[data-page="water"]');a.click('[data-action="water-toggle"][data-id="w0"]');a.click('#accountButton');a.click('[data-action="account-retry"]');await tick();
 a.click('[data-page="water"]');a.click('[data-action="water-add"]');assert.equal(a.q('#editor').open,true);
 a.w.dispatchEvent(new a.w.StorageEvent('storage',{key:'jai-auth.v1',newValue:null}));assert.equal(a.q('#editor').open,false);
 release();for(let i=0;i<5;i++)await tick();assert.equal(a.q('[data-action="water-toggle"]'),null);assert.match(a.q('#accountSyncStatus').textContent,/หมดอายุ/);
});
