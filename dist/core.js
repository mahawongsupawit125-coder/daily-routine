(function(root){
 'use strict';
 const statuses={pending:'ยังไม่ทำ',done:'ทำแล้ว',unable:'ทำไม่ได้',unknown:'ไม่ทราบ'};
 const uid=()=>globalThis.crypto?.randomUUID?.()||'i'+Date.now().toString(36)+Math.random().toString(36).slice(2);
 const clone=x=>JSON.parse(JSON.stringify(x));
 const water=()=>['08:00','09:30','11:00','12:30','14:00','15:00','16:30','18:00','20:00','21:30','23:00'].map((time,i)=>({id:'w'+i,time,ml:300}));
 function createState(){
  const schedule=[['','มื้อเช้า · EZYGO สลัดไข่ + ดีน่าโปรตีน 15g','done','ยืนยันมื้อแล้ว · ไม่ทราบเวลา'],['04:00','นอนเป้าหมาย','unknown','04:00–12:00 · ยังไม่ยืนยัน'],['12:00','Morning routine','pending','12:00–12:30'],['12:30','กะเพราหมูสับไข่ดาว','done','12:30–13:00 · ยืนยันมื้อกลางวันแล้ว'],['13:00','ติว 1','pending','13:00–14:00'],['14:00','พัก','pending','14:00–15:00'],['15:00','ติว 2','pending','15:00–16:00'],['16:00','ดูคลิปฟิตเนส','pending','16:00–16:30'],['16:30','ออกกำลังกาย','pending','16:30–18:00'],['18:00','อาบน้ำ / มื้อเย็น','pending','18:00–19:00'],['19:00','Relax','pending','19:00–20:00'],['20:00','ติว 3','pending','20:00–21:00'],['21:00','คนคุย','pending','21:00–21:30'],['21:30','ติว 4','pending','21:30–22:30'],['22:30','คนคุย','pending','22:30–23:00'],['23:00','ดูแลตัวเอง','pending','23:00–23:30']].map(([time,title,status,note],i)=>({id:'s'+i,time,title,status,note}));
  const ex=(names)=>names.map((name,i)=>({id:'e'+i,name,sets:3,reps:'ปรับตามความพร้อม',note:'ตัวอย่างแผน · แก้ไขได้'}));
  const s={version:1,settings:{name:'คุณ',waterReference:3300},water:water(),workouts:{
   A:{title:'กลุ่ม A · อก / ไหล่ / หน้าท้อง',exercises:ex(['อก · Push-up','อก · Dumbbell press','อก · Dumbbell fly','ไหล่ · Shoulder press','ไหล่ · Lateral raise','ไหล่ · Front raise','หน้าท้อง · Crunch','หน้าท้อง · Dead bug','หน้าท้อง · Plank'])},
   B:{title:'กลุ่ม B · หลัง / แขน / ขา',exercises:ex(['หลัง · Dumbbell row','หลัง · Reverse fly','หลัง · Band pulldown','แขน · Biceps curl','แขน · Hammer curl','แขน · Triceps extension','ขา · Squat','ขา · Lunge','ขา · Glute bridge'])},
   rest:{title:'วันพัก · ฟื้นตัวในจังหวะของคุณ',exercises:[]},active:{title:'Active recovery · เคลื่อนไหวสบาย ๆ',exercises:ex(['ตกเบ็ด / ว่ายน้ำสบาย ๆ / เดินเล่นสบาย ๆ'])}},
   week:['active','A','B','rest','A','B','rest'],phases:[{id:'p0',name:'วอร์มอัป',minutes:10},{id:'p1',name:'เวท',minutes:50},{id:'p2',name:'วิ่ง / เดิน',minutes:25},{id:'p3',name:'คูลดาวน์',minutes:5}],
   care:[{id:'c0',title:'INGU สีฟ้า',category:'self',note:'บันทึกผลิตภัณฑ์ตามที่ระบุ · ใช้ตามฉลาก'},{id:'c1',title:'มอยส์เจอไรเซอร์สีเขียวมิ้นต์',category:'self',note:'บันทึกผลิตภัณฑ์ตามที่ระบุ'},{id:'c2',title:'กันแดดสีเขียว',category:'self',note:'วางแผนเปลี่ยน · ยังไม่ยืนยันใช้จริง'},{id:'c3',title:'เจลแต้มสิวสีม่วง',category:'self',note:'ใช้ตามฉลากผลิตภัณฑ์'},{id:'c4',title:'ดูแลเพลทจัดฟัน',category:'self',note:'ตามคำแนะนำทันตแพทย์'}],days:{}};
  const d=day(s,'2026-10-19');d.schedule=schedule;d.meals=[
   {id:'m0',name:'EZYGO แซนด์วิชสลัดไข่',meal:'เช้า',kcal:240,protein:7,carbs:20,fat:15,fiber:null,sodium:null,estimated:false,note:'ข้อมูลฉลากที่ผู้ใช้ให้ · ยืนยันกินแล้ว'},
   {id:'m1',name:'DNA นมถั่วเหลืองดำ High Protein',meal:'เช้า',kcal:160,protein:15,carbs:null,fat:6,fiber:null,sodium:null,estimated:false,note:'ข้อมูลฉลากที่ผู้ใช้ให้ · ไม่ได้ระบุคาร์บ · ยืนยันกินแล้ว'},
   {id:'m2',name:'กะเพราหมูสับไข่ดาว',meal:'กลางวัน',kcal:650,protein:25,carbs:65,fat:30,fiber:null,sodium:null,estimated:true,note:'ยืนยันกินแล้ว · ค่าตัวอย่างประมาณการ พลังงานราว 550–800 kcal; สารอาหารทั้งหมดแก้ได้ ไม่ใช่ผลวัดจริง'}];return s;
 }
 function day(s,date){ if(!validDate(date))throw Error('วันที่ไม่ถูกต้อง');return s.days[date]||(s.days[date]={waterPlan:clone(s.water),water:[],schedule:[],meals:[],workoutDone:[],care:[],careNote:''}); }
 function waterStats(s,date){const d=day(s,date),items=d.waterPlan.filter(x=>d.water.includes(x.id));return {ml:items.reduce((a,x)=>a+x.ml,0),count:items.length,planned:d.waterPlan.reduce((a,x)=>a+x.ml,0)};}
 function nutrition(meals){return Object.fromEntries(['kcal','protein','carbs','fat','fiber','sodium'].map(k=>[k,{value:meals.reduce((a,x)=>a+(x[k]??0),0),missing:meals.filter(x=>x[k]===null).length}]));}
 function workoutFor(s,date){const group=s.week[new Date(date+'T12:00:00').getDay()];return {group,...s.workouts[group]};}
 function validDate(v){return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
 const bodyActivityRanges={light:[1.4,1.69],moderate:[1.7,1.99],high:[2,2.4]};
 function validateBody(p){
  const between=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  if(!p||typeof p!=='object'||Array.isArray(p)||!between(p.age,1,120)||!Number.isInteger(p.age)||!between(p.height,50,250)||!between(p.weight,10,400)||!['','male','female'].includes(p.sex)||!['','light','moderate','high'].includes(p.activity))throw Error('กรอกอายุ 1–120 ปี ส่วนสูง 50–250 ซม. น้ำหนัก 10–400 กก. และเลือกข้อมูลให้ถูกต้อง');
  return p;
 }
 function bodyMetrics(profile){
  const p=validateBody(profile),square=(p.height/100)**2,bmi=p.weight/square,adult=p.age>=20;
  const category=!adult?null:bmi<18.5?'underweight':bmi<25?'healthy':bmi<30?'overweight':bmi<35?'obesity1':bmi<40?'obesity2':'obesity3';
  const predicted=adult&&p.age<=78&&p.sex?10*p.weight+6.25*p.height-5*p.age+(p.sex==='male'?5:-161):null,ree=predicted>0?predicted:null;
  const factors=bodyActivityRanges[p.activity];
  return {bmi,category,weightRange:adult?{min:18.5*square,max:25*square}:null,ree,tdee:ree!==null&&factors?{min:ree*factors[0],max:ree*factors[1]}:null};
 }
 function validate(s,legacy=false){
  const fail=()=>{throw Error('รูปแบบข้อมูลไม่ถูกต้อง หรือไฟล์เป็นเวอร์ชันที่ไม่รองรับ');};
  const str=(x,n=2000)=>typeof x==='string'&&x.length<=n;
  const num=(x,max=100000)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
  const time=x=>str(x)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x);
  const arr=(a,fn,max=500)=>Array.isArray(a)&&a.length<=max&&a.every(fn);
  const items=(a,fn)=>arr(a,x=>x&&str(x.id,100)&&x.id.length>0&&fn(x))&&new Set(a.map(x=>x.id)).size===a.length;
  const ids=a=>arr(a,x=>str(x,100))&&new Set(a).size===a.length;
  const waterOK=a=>items(a,x=>time(x.time)&&num(x.ml,10000)&&x.ml>0);
  const careCategory=x=>(x.category==='self'||(legacy&&x.category==='pet'))&&(x.period===undefined||['morning','afternoon'].includes(x.period));
  const mealDetails=x=>(x.time===undefined||x.time===''||time(x.time))&&(x.portion===undefined||str(x.portion,200))&&(x.source===undefined||['manual','photo-ai'].includes(x.source));
  if(s?.settings?.body!==undefined)validateBody(s.settings.body);
  if(!s||s.version!==1||!s.settings||!str(s.settings.name,80)||!num(s.settings.waterReference,20000)||!waterOK(s.water)||!s.workouts||!arr(s.week,x=>['A','B','rest','active'].includes(x),7)||s.week.length!==7)fail();
  for(const k of ['A','B','rest','active']){const w=s.workouts[k];if(!w||!str(w.title,200)||!items(w.exercises,x=>str(x.name,200)&&num(x.sets,100)&&Number.isInteger(x.sets)&&x.sets>0&&str(x.reps,200)&&str(x.note)))fail();}
  if(!items(s.phases,x=>str(x.name,100)&&num(x.minutes,500))||!items(s.care,x=>str(x.title,200)&&careCategory(x)&&str(x.note))||!s.days||typeof s.days!=='object'||Array.isArray(s.days)||Object.keys(s.days).length>10000)fail();
  for(const [date,d] of Object.entries(s.days)){
   if(d?.savedAt!==undefined&&(typeof d.savedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(d.savedAt)||!Number.isFinite(Date.parse(d.savedAt))))fail();
   if(d?.careArchive!==undefined&&!items(d.careArchive,x=>str(x.title,200)&&careCategory(x)&&str(x.note)))fail();
   if(d?.workoutArchive!==undefined&&!items(d.workoutArchive,x=>str(x.name,200)&&num(x.sets,100)&&Number.isInteger(x.sets)&&x.sets>0&&str(x.reps,200)&&str(x.note)&&['A','B','rest','active'].includes(x.group)))fail();
   if(!validDate(date)||!d||!waterOK(d.waterPlan)||!ids(d.water)||d.water.some(id=>!d.waterPlan.some(w=>w.id===id))||!ids(d.workoutDone)||!ids(d.care)||!str(d.careNote)||!items(d.schedule,x=>(x.time===''||time(x.time))&&str(x.title,200)&&Object.hasOwn(statuses,x.status)&&str(x.note))||!items(d.meals,x=>str(x.name,200)&&str(x.meal,100)&&mealDetails(x)&&typeof x.estimated==='boolean'&&str(x.note)&&['kcal','protein','carbs','fat','fiber','sodium'].every(k=>x[k]===null||num(x[k]))))fail();
  }return s;
 }
 function removeLegacyAnimalData(s){
  // Compatibility cleanup for the retired feature; never create these records again.
  const mentions=text=>/กระต่าย|กระแต|lionhead|\brabbits?\b/i.test(text||'');
  const cleanText=text=>{if(!mentions(text))return text;const parts=text.split(/(\r?\n|\s*[·•;|]\s*|\s+\/\s+|\s*และ\s*)/);let result='';for(let i=0;i<parts.length;i+=2){if(!parts[i].trim()||mentions(parts[i]))continue;if(result&&i>0)result+=parts[i-1];result+=parts[i];}return result.trim();};
  const animal=x=>x.category==='pet'||(mentions(x.title)&&!cleanText(x.title));
  const cleanCare=x=>{x.title=cleanText(x.title);x.note=cleanText(x.note);return x;};
  const removedCare=new Set(['c5','c6','c7']),removedWorkouts=new Set();
  for(const x of s.care)if(!animal(x))removedCare.delete(x.id);
  for(const day of Object.values(s.days))for(const x of day.careArchive||[])if(!animal(x))removedCare.delete(x.id);
  s.care=s.care.filter(x=>{if(!animal(x))return true;removedCare.add(x.id);return false;}).map(cleanCare);
  for(const [group,w] of Object.entries(s.workouts)){
   const oldTitle=w.title;w.title=cleanText(w.title)||(mentions(oldTitle)?'กิจกรรม':oldTitle);w.exercises=w.exercises.filter(x=>{const oldName=x.name;x.name=cleanText(x.name);x.note=cleanText(x.note);if(x.name||!mentions(oldName))return true;removedWorkouts.add(group+'-'+x.id);return false;});
  }
  for(const day of Object.values(s.days)){
   if(day.careArchive)day.careArchive=day.careArchive.filter(x=>{if(!animal(x))return true;removedCare.add(x.id);return false;}).map(cleanCare);
   if(day.workoutArchive)day.workoutArchive=day.workoutArchive.filter(x=>{const oldName=x.name;x.name=cleanText(x.name);x.note=cleanText(x.note);if(x.name||!mentions(oldName))return true;removedWorkouts.add(x.id);return false;});
   day.careNote=cleanText(day.careNote);day.schedule=day.schedule.filter(x=>{const old=x.title;x.title=cleanText(x.title);x.note=cleanText(x.note);return x.title||!mentions(old);});
   day.meals=day.meals.filter(x=>{const old=x.name;x.name=cleanText(x.name);x.note=cleanText(x.note);if(x.portion)x.portion=cleanText(x.portion);return x.name||!mentions(old);});
  }
  for(const day of Object.values(s.days)){day.care=day.care.filter(id=>!removedCare.has(id));day.workoutDone=day.workoutDone.filter(id=>!removedWorkouts.has(id));}
  return s;
 }
 function parseImport(raw){if(typeof raw!=='string'||raw.length>5000000)throw Error('ไฟล์ใหญ่เกิน 5 MB');return validate(removeLegacyAnimalData(validate(JSON.parse(raw),true)));}
 const api={uid,clone,createState,day,waterStats,nutrition,workoutFor,parseImport,validate,validDate,statuses,bodyMetrics};
 if(typeof module!=='undefined')module.exports=api;else root.Jai=api;
})(globalThis);
