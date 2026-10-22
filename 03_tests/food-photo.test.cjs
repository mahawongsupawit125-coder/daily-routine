const {test}=require('node:test');const assert=require('node:assert/strict');
const F=require('../dist/food-photo.js');
test('photo API endpoints require HTTPS except local development and reject credentials/query',()=>{
 assert.equal(F.validEndpoint('https://food.example/api/analyze-food'),true);assert.equal(F.validEndpoint('http://localhost:4173/api/analyze-food'),true);
 for(const url of ['http://evil.test/api/analyze-food','https://u:p@food.test/api/analyze-food','https://food.test/api/analyze-food?key=x','javascript:alert(1)','https://food.test/'])assert.equal(F.validEndpoint(url),false,url);
});
test('review draft contains estimates and unknowns without fabricating the eaten time',()=>{
 const a={isFood:true,foodName:'อาหารตัวอย่าง',portion:'ครึ่งจาน',kcal:250,protein:12.34,carbs:null,fat:10,fiber:null,sodium:null,confidence:'low',note:'ไม่ทราบซอส'};
 const draft=F.reviewDraft(a,{meal:'กลางวัน',time:'13:25',portion:'ครึ่งจาน'});assert.equal(draft.time,'13:25');assert.equal(draft.protein,12.3);assert.equal(draft.estimated,true);assert.equal(draft.carbs,null);assert.equal(draft.source,'photo-ai');assert.match(draft.note,/ไม่ทราบซอส/);assert.match(draft.note,/ต่ำ/);
});
test('invalid or nonfood analysis cannot become an editable nutrition draft',()=>{
 for(const a of [{},{isFood:false},{isFood:true,foodName:'x',kcal:NaN}])assert.throws(()=>F.reviewDraft(a,{meal:'เย็น',time:'19:00'}));
});
