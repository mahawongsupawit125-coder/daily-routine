const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
let child,base;
before(async()=>{
 const port=44000+Math.floor(Math.random()*10000);base='http://127.0.0.1:'+port;
 child=spawn(process.execPath,[path.join(__dirname,'../server.cjs')],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe'],windowsHide:true});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server did not start')),10000);child.once('error',reject);child.once('exit',code=>{if(code)reject(Error('Server exit '+code));});child.stdout.on('data',data=>{if(data.toString().includes('Jai Daily:')){clearTimeout(timer);resolve();}});});
});
after(()=>child?.kill());
test('local server serves Thai app with security headers',async()=>{
 const r=await fetch(base+'/');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.match(await r.text(),/lang="th"/);
});
test('all local runtime assets are served',async()=>{
 for(const file of ['app.js','core.js','styles.css','icon.svg']){const r=await fetch(base+'/'+file);assert.equal(r.status,200,file);assert.ok((await r.text()).length>100);}
});
test('source files and Git metadata are not exposed by local server',async()=>{
 for(const file of ['README.md','server.cjs','package.json','.git/config','not-found'])assert.equal((await fetch(base+'/'+file)).status,404,file);
});
test('encoded path traversal is denied',async()=>{assert.equal((await fetch(base+'/%2e%2e%2fserver.cjs')).status,403);});
test('malformed path and write methods are rejected',async()=>{assert.equal((await fetch(base+'/%zz')).status,400);assert.equal((await fetch(base+'/',{method:'POST',body:'test'})).status,405);});
test('HEAD returns headers without a body',async()=>{const r=await fetch(base+'/',{method:'HEAD'});assert.equal(r.status,200);assert.equal(await r.text(),'');});
