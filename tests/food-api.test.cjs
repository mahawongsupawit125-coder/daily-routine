const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=()=>import('../api/worker.mjs');
const origin='https://mahawongsupawit125-coder.github.io';
const env=()=>({OPENAI_API_KEY:'server-only-test-key',FOOD_ACCESS_TOKEN:'a'.repeat(32),FOOD_ALLOWED_ORIGINS:origin,FOOD_RATE_LIMIT:{limit:async()=>({success:true})}});
const image='data:image/jpeg;base64,/9j/2Q==';
const request=(body={image,portion:'1 จาน',description:'ข้าว'},headers={})=>new Request('https://food.test/api/analyze-food',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+'a'.repeat(32),'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const analysis=()=>({isFood:true,foodName:'ข้าวผัด',portion:'1 จาน',kcal:550,protein:20,carbs:65,fat:23,fiber:null,sodium:null,confidence:'low',note:'ไม่ทราบน้ำมันที่ใช้'});
const upstream=data=>new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(data)}]}]}),{status:200});
test('unconfigured service fails closed without making an AI request',async()=>{
 const {handleRequest}=await api();let calls=0;const r=await handleRequest(request(),{},async()=>{calls++;});assert.equal(r.status,503);assert.equal(calls,0);
});
test('CORS allows only configured origins and never reflects arbitrary origins',async()=>{
 const {handleRequest}=await api();const r=await handleRequest(request(undefined,{Origin:'https://evil.test'}),env());assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
 const pre=await handleRequest(new Request('https://food.test/api/analyze-food',{method:'OPTIONS',headers:{Origin:origin}}),env());assert.equal(pre.status,204);assert.equal(pre.headers.get('Access-Control-Allow-Origin'),origin);
});
test('authentication, routes and rate limits are enforced before inference',async()=>{
 const {handleRequest}=await api();let calls=0;const fake=async()=>{calls++;};
 assert.equal((await handleRequest(request(undefined,{Authorization:'Bearer wrong'}),env(),fake)).status,401);
 assert.equal((await handleRequest(new Request('https://food.test/'),env(),fake)).status,404);
 const e=env();e.FOOD_RATE_LIMIT.limit=async()=>({success:false});assert.equal((await handleRequest(request(),e,fake)).status,429);assert.equal(calls,0);
});
test('malformed and oversized requests cannot reach the paid model',async()=>{
 const {handleRequest}=await api();let calls=0;const fake=async()=>{calls++;};
 for(const body of [{image:'https://example.com/private.jpg'},{image:'data:image/svg+xml;base64,AAAA'},{image,portion:'x'.repeat(201)},{image,description:'x'.repeat(501)}])assert.equal((await handleRequest(request(body),env(),fake)).status,400);
 assert.equal((await handleRequest(request({image:'data:image/jpeg;base64,'+'A'.repeat(2100000)}),env(),fake)).status,413);assert.equal(calls,0);
});
test('vision request keeps key server side, disables response storage and asks for structured estimates',async()=>{
 const {handleRequest}=await api();let sent;
 const r=await handleRequest(request(),env(),async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');sent=JSON.parse(options.body);assert.equal(options.headers.Authorization,'Bearer server-only-test-key');return upstream(analysis());});
 assert.equal(r.status,200);assert.equal(sent.store,false);assert.equal(sent.text.format.strict,true);assert.equal(sent.input[0].content[1].image_url,image);
 const data=await r.json();assert.equal(data.analysis.kcal,550);assert.equal(data.analysis.fiber,null);assert.equal(data.estimated,true);assert.doesNotMatch(JSON.stringify(data),/server-only-test-key/);
});
test('invalid values, refusal and nonfood never become a recorded meal',async()=>{
 const {handleRequest}=await api();for(const data of [{...analysis(),kcal:-1},{...analysis(),protein:'20'},{...analysis(),confidence:'certain'}])assert.equal((await handleRequest(request(),env(),async()=>upstream(data))).status,502);
 const nonfood={...analysis(),isFood:false,foodName:'',kcal:null};assert.equal((await handleRequest(request(),env(),async()=>upstream(nonfood))).status,422);
 const refused=new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'no'}]}]}));assert.equal((await handleRequest(request(),env(),async()=>refused)).status,422);
});
test('provider failures are actionable and do not leak upstream error content',async()=>{
 const {handleRequest}=await api();for(const [up,status] of [[401,503],[429,429],[500,502]]){const r=await handleRequest(request(),env(),async()=>new Response('secret detail',{status:up}));assert.equal(r.status,status);assert.doesNotMatch(await r.text(),/secret detail/);}
 const r=await handleRequest(request(),env(),async()=>{throw new DOMException('timeout','TimeoutError');});assert.equal(r.status,504);
});
