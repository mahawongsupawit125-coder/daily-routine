const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/core.js');
test('care periods survive backups without changing legacy records or daily completion',()=>{
 const s=C.createState(),d=C.day(s,'2026-10-20');d.care=['c0'];
 s.care.push({id:'morning-item',title:'เช้า',category:'self',period:'morning',note:''},{id:'afternoon-item',title:'บ่าย',category:'self',period:'afternoon',note:''});
 assert.deepEqual(C.parseImport(JSON.stringify(s)),s);
 s.care.at(-1).period='invalid';assert.throws(()=>C.parseImport(JSON.stringify(s)));
});
test('default water plan is eleven 300ml slots and reference is optional',()=>{
 const s=C.createState(); assert.equal(s.water.length,11); assert.equal(s.water.reduce((a,b)=>a+b.ml,0),3300); assert.equal(s.settings.waterReference,3300);
});
test('water toggles, volume edits and dates remain isolated',()=>{
 const s=C.createState(),a=C.day(s,'2026-10-20'),b=C.day(s,'2026-10-21');
 a.water.push(s.water[0].id); assert.equal(C.waterStats(s,'2026-10-20').ml,300); assert.equal(C.waterStats(s,'2026-10-21').ml,0);
 a.waterPlan[0].ml=450; assert.equal(C.waterStats(s,'2026-10-20').ml,450); a.water=[]; assert.equal(C.waterStats(s,'2026-10-20').count,0); assert.notEqual(a,b);
});
test('seed distinguishes confirmed meals and unconfirmed sleep',()=>{
 const s=C.createState(),d=C.day(s,'2026-10-19'); assert.equal(d.meals.length,3);
 assert.equal(d.schedule.find(x=>x.title.includes('นอน')).status,'unknown');
 assert.equal(d.schedule.filter(x=>x.status==='done').length,2); assert.equal(C.day(s,'2026-10-20').schedule.length,0);
});
test('nutrition totals preserve unknown carbohydrates',()=>{
 const t=C.nutrition(C.day(C.createState(),'2026-10-19').meals); assert.equal(t.kcal.value,1050); assert.equal(t.carbs.missing,1); assert.equal(t.protein.value,47);
});
test('workout split matches Monday Tuesday Thursday Friday',()=>{
 const s=C.createState(); for(const [date,group] of [['2026-10-19','A'],['2026-10-20','B'],['2026-10-21','rest'],['2026-10-22','A'],['2026-10-23','B'],['2026-10-24','rest'],['2026-10-25','active']]) assert.equal(C.workoutFor(s,date).group,group);
 assert.equal(s.workouts.A.exercises.length,9); assert.equal(s.workouts.A.exercises.reduce((n,x)=>n+x.sets,0),27);
});
test('JSON roundtrip accepts valid state and rejects malformed state',()=>{
 const s=C.createState(); assert.deepEqual(C.parseImport(JSON.stringify(s)),s);
 for(const bad of ['{}','null','{"version":99}',JSON.stringify({...s,water:[{id:'x',time:'99:90',ml:-1}]})]) assert.throws(()=>C.parseImport(bad));
});
test('hostile nested values and duplicate IDs are rejected before restore',()=>{
 const s=C.createState(); s.days['2026-10-20']={water:[],schedule:[],meals:[{id:'bad',name:{x:1}}],workoutDone:[],care:[]}; assert.throws(()=>C.parseImport(JSON.stringify(s)));
 const t=C.createState();t.water[1].id=t.water[0].id;assert.throws(()=>C.parseImport(JSON.stringify(t)));
});
test('optional historical definitions roundtrip and reject malformed archives',()=>{
 const s=C.createState(),d=C.day(s,'2026-10-19');d.careArchive=[{...s.care[0]}];d.workoutArchive=[{...s.workouts.A.exercises[0],id:'A-e0',group:'A'}];assert.deepEqual(C.parseImport(JSON.stringify(s)),s);
 d.careArchive[0].title={bad:true};assert.throws(()=>C.parseImport(JSON.stringify(s)));d.careArchive=[];d.workoutArchive[0].group='invalid';assert.throws(()=>C.parseImport(JSON.stringify(s)));
});
test('meal eaten time portion and photo analysis source preserve old backups and validate new fields',()=>{
 const s=C.createState(),m=s.days['2026-10-19'].meals[0];assert.doesNotThrow(()=>C.validate(s));m.time='13:45';m.portion='ครึ่งจาน';m.source='photo-ai';assert.deepEqual(C.parseImport(JSON.stringify(s)),s);
 m.time='25:61';assert.throws(()=>C.validate(s));m.time='';m.portion='x'.repeat(201);assert.throws(()=>C.validate(s));m.portion='1 จาน';m.source='untrusted';assert.throws(()=>C.validate(s));
});
function legacyAnimalState(){
 const s=C.createState(),d=C.day(s,'2026-10-20');s.care.push({id:'c5',category:'pet',title:'ตรวจน้ำกระแต',note:'กระต่าย Lionhead'},{id:'old-pet',category:'pet',title:'ตรวจคอก',note:'เก่า'});
 d.water=['w0'];d.care=['c0','c5','old-pet','archived-pet'];d.careNote='ทาครีมแล้ว\nให้อาหารกระแต\nอ่านหนังสือแล้ว';d.careArchive=[{id:'archived-pet',category:'pet',title:'ตรวจอาหาร',note:'เก่า'},{id:'archived-self',category:'self',title:'ดูแลผิว',note:'เก็บไว้'}];
 d.schedule=[{id:'self-task',time:'12:00',title:'อาบน้ำ',status:'done',note:'ดูแลตัวเอง'},{id:'animal-task',time:'13:00',title:'ให้อาหารกระต่าย',status:'done',note:''}];
 s.workouts.active.exercises=[{id:'old-active',name:'ตกเบ็ด / ว่ายน้ำสบาย ๆ / พากระแตเดินสวน',sets:1,reps:'ตามสบาย',note:''},{id:'rabbit-only',name:'ดูแลกระต่าย',sets:1,reps:'',note:''}];d.workoutDone=['active-old-active','active-rabbit-only'];
 return s;
}
test('new app starts with self care only and no animal content',()=>{
 const s=C.createState();assert.ok(s.care.every(x=>x.category==='self'));assert.doesNotMatch(JSON.stringify(s),/กระแต|กระต่าย|Lionhead|rabbit|"pet"/i);
});
test('old backups remove animal templates logs notes and tasks while preserving other daily data',()=>{
 const old=legacyAnimalState(),s=C.parseImport(JSON.stringify(old)),d=s.days['2026-10-20'];assert.deepEqual(d.water,['w0']);assert.deepEqual(d.care,['c0']);assert.equal(d.careNote,'ทาครีมแล้ว\nอ่านหนังสือแล้ว');assert.equal(d.schedule.length,1);assert.equal(d.schedule[0].title,'อาบน้ำ');assert.equal(d.careArchive[0].title,'ดูแลผิว');assert.deepEqual(d.workoutDone,['active-old-active']);assert.match(s.workouts.active.exercises[0].name,/ตกเบ็ด/);assert.doesNotMatch(JSON.stringify(s),/กระแต|กระต่าย|Lionhead|rabbit|"pet"/i);assert.deepEqual(C.parseImport(JSON.stringify(s)),s);assert.equal(s.days['2026-10-19'].meals.length,3);
});
test('mixed self-care and schedule records retain personal content time and completion',()=>{
 const s=C.createState(),d=C.day(s,'2026-10-20');s.care[0].note='ทาครีมและให้อาหารกระต่าย';d.care=['c0'];d.schedule=[{id:'mixed',time:'12:30',title:'อาบน้ำ / ให้อาหารกระต่าย',status:'done',note:'ใช้ครีม · ตรวจคอกกระแต'}];
 const clean=C.parseImport(JSON.stringify(s));assert.equal(clean.care[0].id,'c0');assert.equal(clean.care[0].note,'ทาครีม');assert.deepEqual(clean.days['2026-10-20'].care,['c0']);assert.deepEqual(clean.days['2026-10-20'].schedule,[{id:'mixed',time:'12:30',title:'อาบน้ำ',status:'done',note:'ใช้ครีม'}]);
});
test('cleanup never expands bounded fields or invalidates a valid legacy backup',()=>{
 const s=C.createState();s.workouts.active.exercises[0].name='a;'.repeat(90)+'rabbit';assert.ok(s.workouts.active.exercises[0].name.length<200);const clean=C.parseImport(JSON.stringify(s));assert.ok(clean.workouts.active.exercises[0].name.length<=200);assert.doesNotMatch(clean.workouts.active.exercises[0].name,/rabbit/);assert.equal(clean.days['2026-10-19'].meals.length,3);assert.doesNotThrow(()=>C.validate(clean));
});
