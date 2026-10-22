const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {build}=require('../scripts/build.cjs');
const output=path.resolve(__dirname,'../dist');
test('publication build resolves every local HTML stylesheet, script and icon',()=>{
 const files=build();const html=fs.readFileSync(path.join(output,'index.html'),'utf8');
 const refs=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]).filter(p=>!/^https?:/.test(p));
 assert.ok(refs.length>=8);
 for(const ref of refs){const name=ref.split('?')[0];assert.ok(files.includes(name),ref);assert.ok(fs.statSync(path.join(output,name)).size>0,ref);}
 assert.doesNotMatch(fs.readFileSync(path.join(output,'app.js'),'utf8'),/\/\* @include/);
 assert.ok(!files.some(p=>/worker|wrangler|test|\.md$/.test(p)));
});
test('building twice preserves identical publication bytes',()=>{
 const digest=()=>Object.fromEntries(build().map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(output,p))).digest('hex')]));
 assert.deepEqual(digest(),digest());
});
