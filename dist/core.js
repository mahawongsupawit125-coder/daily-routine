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
   rest:{title:'วันพัก · ฟื้นตัวในจังหวะของคุณ',exercises:[]},active:{title:'Active recovery · เคลื่อนไหวสบาย ๆ',exercises:ex(['ตกเบ็ด / ว่ายน้ำสบาย ๆ / พากระแตเดินสวน'])}},
   week:['active','A','B','rest','A','B','rest'],phases:[{id:'p0',name:'วอร์มอัป',minutes:10},{id:'p1',name:'เวท',minutes:50},{id:'p2',name:'วิ่ง / เดิน',minutes:25},{id:'p3',name:'คูลดาวน์',minutes:5}],
   care:[{id:'c0',title:'INGU สีฟ้า',category:'self',note:'บันทึกผลิตภัณฑ์ตามที่ระบุ · ใช้ตามฉลาก'},{id:'c1',title:'มอยส์เจอไรเซอร์สีเขียวมิ้นต์',category:'self',note:'บันทึกผลิตภัณฑ์ตามที่ระบุ'},{id:'c2',title:'กันแดดสีเขียว',category:'self',note:'วางแผนเปลี่ยน · ยังไม่ยืนยันใช้จริง'},{id:'c3',title:'เจลแต้มสิวสีม่วง',category:'self',note:'ใช้ตามฉลากผลิตภัณฑ์'},{id:'c4',title:'ดูแลเพลทจัดฟัน',category:'self',note:'ตามคำแนะนำทันตแพทย์'},{id:'c5',title:'ตรวจน้ำสะอาดของกระแต',category:'pet',note:'กระต่ายลูกผสม Lionhead · อยู่ในคอก'},{id:'c6',title:'ตรวจอาหารและหญ้าของกระแต',category:'pet',note:'บันทึกสิ่งที่ตรวจจริงในวันนี้'},{id:'c7',title:'ตรวจอุณหภูมิและอากาศในคอก',category:'pet',note:'เพิ่มค่าที่วัดได้ในบันทึกประจำวัน'}],days:{}};
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
 function validate(s){
  const fail=()=>{throw Error('รูปแบบข้อมูลไม่ถูกต้อง หรือไฟล์เป็นเวอร์ชันที่ไม่รองรับ');};
  const str=(x,n=2000)=>typeof x==='string'&&x.length<=n;
  const num=(x,max=100000)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
  const time=x=>str(x)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x);
  const arr=(a,fn,max=500)=>Array.isArray(a)&&a.length<=max&&a.every(fn);
  const items=(a,fn)=>arr(a,x=>x&&str(x.id,100)&&x.id.length>0&&fn(x))&&new Set(a.map(x=>x.id)).size===a.length;
  const ids=a=>arr(a,x=>str(x,100))&&new Set(a).size===a.length;
  const waterOK=a=>items(a,x=>time(x.time)&&num(x.ml,10000)&&x.ml>0);
  if(!s||s.version!==1||!s.settings||!str(s.settings.name,80)||!num(s.settings.waterReference,20000)||!waterOK(s.water)||!s.workouts||!arr(s.week,x=>['A','B','rest','active'].includes(x),7)||s.week.length!==7)fail();
  for(const k of ['A','B','rest','active']){const w=s.workouts[k];if(!w||!str(w.title,200)||!items(w.exercises,x=>str(x.name,200)&&num(x.sets,100)&&Number.isInteger(x.sets)&&x.sets>0&&str(x.reps,200)&&str(x.note)))fail();}
  if(!items(s.phases,x=>str(x.name,100)&&num(x.minutes,500))||!items(s.care,x=>str(x.title,200)&&['self','pet'].includes(x.category)&&str(x.note))||!s.days||typeof s.days!=='object'||Array.isArray(s.days)||Object.keys(s.days).length>10000)fail();
  for(const [date,d] of Object.entries(s.days)){
   if(d?.careArchive!==undefined&&!items(d.careArchive,x=>str(x.title,200)&&['self','pet'].includes(x.category)&&str(x.note)))fail();
   if(d?.workoutArchive!==undefined&&!items(d.workoutArchive,x=>str(x.name,200)&&num(x.sets,100)&&Number.isInteger(x.sets)&&x.sets>0&&str(x.reps,200)&&str(x.note)&&['A','B','rest','active'].includes(x.group)))fail();
   if(!validDate(date)||!d||!waterOK(d.waterPlan)||!ids(d.water)||d.water.some(id=>!d.waterPlan.some(w=>w.id===id))||!ids(d.workoutDone)||!ids(d.care)||!str(d.careNote)||!items(d.schedule,x=>(x.time===''||time(x.time))&&str(x.title,200)&&Object.hasOwn(statuses,x.status)&&str(x.note))||!items(d.meals,x=>str(x.name,200)&&str(x.meal,100)&&typeof x.estimated==='boolean'&&str(x.note)&&['kcal','protein','carbs','fat','fiber','sodium'].every(k=>x[k]===null||num(x[k]))))fail();
  }return s;
 }
 function parseImport(raw){if(typeof raw!=='string'||raw.length>5000000)throw Error('ไฟล์ใหญ่เกิน 5 MB');return validate(JSON.parse(raw));}
 const api={uid,clone,createState,day,waterStats,nutrition,workoutFor,parseImport,validate,validDate,statuses};
 if(typeof module!=='undefined')module.exports=api;else root.Jai=api;
})(globalThis);
