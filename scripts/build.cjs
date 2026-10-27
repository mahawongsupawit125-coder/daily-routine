const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'01_web_app');
const assets={
 'public/index.html':'index.html',
 'src/shared/i18n.js':'i18n.js',
 'src/shared/core.js':'core.js',
 'src/pages/02_body/body-page.js':'body-page.js',
 'src/pages/03_water/hydration.js':'hydration.js',
 'src/pages/06_meals/food-photo.js':'food-photo.js',
 'assets/styles/styles.css':'styles.css',
 'assets/styles/body.css':'body.css',
 'assets/styles/theme.css':'theme.css',
 'assets/icons/icon.svg':'icon.svg',
 'assets/icons/logo.svg':'logo.svg',
 'assets/icons/logo-v2.png':'logo-v2.png',
 'assets/images/overview-forest.png':'overview-forest.png'
};
function build(output=path.join(root,'dist')){
 fs.mkdirSync(output,{recursive:true});
 const put=(name,data)=>{const file=path.join(output,name),bytes=Buffer.isBuffer(data)?data:Buffer.from(data);if(!fs.existsSync(file)||!fs.readFileSync(file).equals(bytes))fs.writeFileSync(file,bytes);};
 for(const [input,name] of Object.entries(assets))put(name,fs.readFileSync(path.join(source,input)));
 const shell=fs.readFileSync(path.join(source,'src/shared/app-shell.js'),'utf8');
 const app=shell.replace(/\/\* @include (src\/pages\/[a-z0-9_/.-]+\.js) \*\/\n/g,(_,relative)=>{
  const file=path.resolve(source,relative);
  if(!file.startsWith(source+path.sep))throw Error('Page path is outside frontend source');
  return fs.readFileSync(file,'utf8');
 });
 if(app.includes('/* @include'))throw Error('Unresolved page include');
 put('app.js',app);
 return Object.values(assets).concat('app.js');
}
if(require.main===module){const files=build();console.log(`Built ${files.length} public assets from 01_web_app/ into dist/.`);}
module.exports={build};
