const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/core.js');
const profile=()=>({age:30,sex:'male',height:180,weight:81,activity:'moderate'});
test('body metrics calculate BMI and resting energy from the entered units',()=>{
 assert.equal(typeof C.bodyMetrics,'function');const r=C.bodyMetrics(profile());
 assert.equal(r.bmi,25);assert.equal(r.category,'overweight');assert.equal(r.ree,1790);
 assert.deepEqual(r.weightRange,{min:18.5*1.8**2,max:25*1.8**2});
 assert.deepEqual(r.tdee,{min:1790*1.7,max:1790*1.99});
 assert.equal(C.bodyMetrics({...profile(),sex:'female'}).ree,1624);
});
test('BMI groups use unrounded cutoffs including each obesity class',()=>{
 for(const [weight,category] of [[18.49,'underweight'],[18.5,'healthy'],[24.999,'healthy'],[25,'overweight'],[30,'obesity1'],[35,'obesity2'],[40,'obesity3']])assert.equal(C.bodyMetrics({...profile(),height:100,weight}).category,category);
});
test('energy requires supplied sex and activity without fabricating a result',()=>{
 const r=C.bodyMetrics({...profile(),sex:'',activity:''});assert.equal(r.bmi,25);assert.equal(r.ree,null);assert.equal(r.tdee,null);
 assert.equal(C.bodyMetrics({...profile(),activity:''}).tdee,null);
 for(const [activity,min,max] of [['light',1.4,1.69],['moderate',1.7,1.99],['high',2,2.4]])assert.deepEqual(C.bodyMetrics({...profile(),activity}).tdee,{min:1790*min,max:1790*max});
});
test('younger ages have numeric BMI without adult classification and older adults have no extrapolated energy',()=>{
 const child=C.bodyMetrics({...profile(),age:15});assert.equal(child.bmi,25);assert.equal(child.category,null);assert.equal(child.weightRange,null);assert.equal(child.ree,null);assert.equal(child.tdee,null);
 assert.equal(C.bodyMetrics({...profile(),age:79}).ree,null);assert.equal(C.bodyMetrics({...profile(),age:78}).ree,1550);
});
test('invalid body values are rejected before results or backup restore',()=>{
 for(const bad of [{age:0},{age:22.5},{age:121},{height:0},{height:NaN},{weight:Infinity},{weight:'81'},{sex:'invalid'},{activity:'invalid'}])assert.throws(()=>C.bodyMetrics({...profile(),...bad}));
 const s=C.createState();s.settings.body=profile();assert.deepEqual(C.parseImport(JSON.stringify(s)).settings.body,profile());
 for(const body of [null,{},[],{...profile(),height:-180},{...profile(),sex:'invalid'}]){s.settings.body=body;assert.throws(()=>C.parseImport(JSON.stringify(s)));}
});
test('legacy backups still roundtrip without adding personal measurements',()=>{
 const s=C.createState();assert.equal(s.settings.body,undefined);assert.deepEqual(C.parseImport(JSON.stringify(s)),s);
});
test('nonpositive energy predictions are not displayed as usable calories',()=>{
 const r=C.bodyMetrics({age:78,sex:'female',height:50,weight:10,activity:'high'});assert.equal(r.ree,null);assert.equal(r.tdee,null);
});
