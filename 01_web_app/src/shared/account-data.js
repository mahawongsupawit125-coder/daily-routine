(function(root){
'use strict';
function cloudState(core,input){
 const pick=(x,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(x,k)).map(k=>[k,x[k]]));
 const s=core.parseImport(JSON.stringify(input));
 const out=pick(s,['version','settings','water','workouts','week','phases','care','days']);
 out.settings=pick(s.settings,['name','waterReference','body']);
 if(out.settings.body)out.settings.body=pick(out.settings.body,['age','sex','height','weight','activity']);
 const water=x=>pick(x,['id','time','ml']),care=x=>pick(x,['id','title','category','period','note']),exercise=x=>pick(x,['id','name','sets','reps','note','group']);
 out.water=s.water.map(water);out.workouts=Object.fromEntries(['A','B','rest','active'].map(k=>[k,{title:s.workouts[k].title,exercises:s.workouts[k].exercises.map(exercise)}]));
 out.phases=s.phases.map(x=>pick(x,['id','name','minutes']));out.care=s.care.map(care);
 out.days=Object.fromEntries(Object.entries(s.days).map(([date,d])=>{
  const v=pick(d,['waterPlan','water','schedule','meals','workoutDone','care','careNote','hydration','savedAt','careArchive','workoutArchive']);
  v.waterPlan=d.waterPlan.map(water);v.schedule=d.schedule.map(x=>pick(x,['id','time','title','status','note']));
  v.meals=d.meals.map(x=>pick(x,['id','name','meal','time','portion','source','estimated','note','kcal','protein','carbs','fat','fiber','sodium']));
  if(v.hydration)v.hydration=pick(v.hydration,['otherDrinksMl','weather','activityMinutes','extraMl','restricted']);
  if(v.careArchive)v.careArchive=v.careArchive.map(care);if(v.workoutArchive)v.workoutArchive=v.workoutArchive.map(exercise);
  return [date,v];
 }));
 return core.validate(out);
}
const api={cloudState};if(typeof module!=='undefined')module.exports=api;else root.JaiAccountData=api;
})(globalThis);
