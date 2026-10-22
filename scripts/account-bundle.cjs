const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.account-build','account');
fs.mkdirSync(out,{recursive:true});
for(const [src,name] of [
 ['04_account_backend/functions/account/index.ts','index.ts'],
 ['04_account_backend/functions/account/handler.mjs','handler.mjs'],
 ['01_web_app/src/shared/core.js','core.js'],
 ['01_web_app/src/shared/account-data.js','account-data.js']
])fs.copyFileSync(path.join(root,src),path.join(out,name));
console.log('Account function bundle ready in .account-build/account. No credentials are included.');
