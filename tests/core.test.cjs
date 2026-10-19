const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/core.js');
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
