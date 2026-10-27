const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {Readable}=require('node:stream');
const root=path.join(__dirname,'..','dist');
const host=process.argv.includes('--lan')?'0.0.0.0':'127.0.0.1';
const port=Number(process.env.PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
let rateWindow=0,rateCount=0;
const localRateLimit={limit:async()=>{const now=Date.now();if(now-rateWindow>60000){rateWindow=now;rateCount=0;}return {success:++rateCount<=6};}};
const server=http.createServer(async(req,res)=>{
 let url;try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('Bad request');}
 if(url==='/api/analyze-food'){
  try{const {handleRequest}=await import('../02_food_ai_api/worker.mjs');const method=req.method,options={method,headers:req.headers};if(!['GET','HEAD'].includes(method)){options.body=Readable.toWeb(req);options.duplex='half';}
   const response=await handleRequest(new Request('http://localhost/api/analyze-food',options),{...process.env,FOOD_RATE_LIMIT:localRateLimit});res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'บริการวิเคราะห์ยังไม่พร้อม กรุณาตรวจการตั้งค่า'}));}
 }
 const target=path.resolve(root,'.'+(url==='/'?'/index.html':url));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Method not allowed');}
 fs.readFile(target,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:data);});
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?`Port ${port} is already in use. Set PORT to another number.`:err.message);process.exitCode=1;});
server.listen(port,host,()=>{console.log(`Jai Daily: http://localhost:${port}`);if(host==='0.0.0.0')console.log('LAN mode: open http://YOUR-COMPUTER-IP:'+port+' on the same Wi-Fi.');console.log('Press Ctrl+C to stop.');});
