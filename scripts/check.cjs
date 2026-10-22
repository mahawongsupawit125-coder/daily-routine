const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function scripts(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const file=path.join(dir,entry.name);return entry.isDirectory()?scripts(file):/\.(?:js|cjs|mjs)$/.test(entry.name)?[file]:[];});}
const files=['01_web_app/src','02_food_ai_api','scripts'].flatMap(p=>scripts(path.join(root,p))).concat(path.join(root,'dist/app.js'));
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{stdio:'inherit',windowsHide:true});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
console.log(`Syntax checks passed for ${files.length} source and built scripts.`);
