const {test}=require('node:test');const assert=require('node:assert/strict');const C=require('../dist/core.js');
const profile=()=>({age:30,sex:'male',height:175,weight:70,activity:'moderate'});
const context=()=>({otherDrinksMl:300,weather:'normal',activityMinutes:0,extraMl:0,restricted:false});
test('personal fluid reference uses saved weight and counts other drinks once',()=>{
 assert.equal(typeof C.hydrationEstimate,'function');const r=C.hydrationEstimate(profile(),context(),600);
 assert.deepEqual(r.base,{min:2100,max:2450});assert.deepEqual(r.reference,r.base);assert.equal(r.knownTotalMl,900);assert.deepEqual(r.remaining,{min:1200,max:1550});
 const updated=C.hydrationEstimate({...profile(),weight:65},context(),600);assert.deepEqual(updated.base,{min:1950,max:2275});
});
test('heat and activity are acknowledged without inventing a measured fluid loss',()=>{
 const hot={...context(),weather:'hot',activityMinutes:90,extraMl:null},r=C.hydrationEstimate(profile(),hot,0);
 assert.ok(r.flags.includes('hot'));assert.ok(r.flags.includes('active'));assert.ok(r.flags.includes('adjustment-unknown'));assert.deepEqual(r.reference,r.base);
 const planned=C.hydrationEstimate(profile(),{...hot,extraMl:500},0);assert.deepEqual(planned.reference,{min:2600,max:2950});
 assert.deepEqual(C.hydrationEstimate(profile(),{...hot,weather:'normal',extraMl:500},0).reference,planned.reference);
});
test('unknown drinks are not treated as a confirmed zero and no remaining prescription is fabricated',()=>{
 const r=C.hydrationEstimate(profile(),{...context(),otherDrinksMl:null,weather:'unknown',activityMinutes:null},600);assert.equal(r.knownTotalMl,600);assert.equal(r.remaining,null);assert.ok(r.flags.includes('drinks-unknown'));assert.ok(r.flags.includes('weather-unknown'));assert.ok(r.flags.includes('activity-unknown'));
 assert.deepEqual(C.hydrationEstimate(profile(),{...context(),otherDrinksMl:0},3000).remaining,{min:0,max:0});
});
test('limited applicability and a clinician fluid plan suppress the numeric reference',()=>{
 for(const p of [null,{...profile(),age:15},{...profile(),age:65},{...profile(),weight:110},{...profile(),weight:40}])assert.equal(C.hydrationEstimate(p,context(),600).reference,null);
 const r=C.hydrationEstimate(profile(),{...context(),restricted:true},600);assert.equal(r.reference,null);assert.equal(r.remaining,null);assert.equal(r.knownTotalMl,900);assert.equal(r.reason,'individual-plan');
});
test('daily hydration context survives backups and remains independent across dates',()=>{
 const s=C.createState();s.settings.body=profile();C.day(s,'2026-10-22').hydration=context();C.day(s,'2026-10-22').water=['w0'];
 const copy=C.parseImport(JSON.stringify(s));assert.deepEqual(copy.days['2026-10-22'].hydration,context());assert.equal(C.day(copy,'2026-10-23').hydration,undefined);assert.deepEqual(copy.days['2026-10-22'].water,['w0']);
});
test('invalid hydration imports and calculation values are rejected',()=>{
 for(const bad of [{otherDrinksMl:-1},{otherDrinksMl:'300'},{extraMl:Infinity},{activityMinutes:1.5},{weather:'invented'},{restricted:'false'}])assert.throws(()=>C.hydrationEstimate(profile(),{...context(),...bad},0));
 const s=C.createState(),d=C.day(s,'2026-10-22');for(const hydration of [null,{},[],{...context(),weather:'bad'}]){d.hydration=hydration;assert.throws(()=>C.parseImport(JSON.stringify(s)));}
 assert.throws(()=>C.hydrationEstimate(profile(),context(),-1));
});
test('old backups preserve their manual water reference without adding guessed daily context',()=>{
 const s=C.createState();assert.equal(C.day(s,'2026-10-22').hydration,undefined);assert.deepEqual(C.parseImport(JSON.stringify(s)),s);assert.equal(s.settings.waterReference,3300);
});
