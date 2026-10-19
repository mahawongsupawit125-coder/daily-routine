const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const C=require('../dist/core.js');
const KEY='jai-daily.v1';
function setup(t,{width=1440,raw=null,blocked=false}={}){
 const errors=[],downloads=[];
 const vc=new VirtualConsole();vc.on('jsdomError',err=>errors.push(err.message));
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8'),{url:'https://jai.test/',runScripts:'outside-only',virtualConsole:vc});
 const w=dom.window,doc=w.document;w.scrollTo=()=>{};
 w.matchMedia=()=>({matches:width<=900,addEventListener(){}});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:test';};w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
 if(raw!==null)w.localStorage.setItem(KEY,raw);
 if(blocked)w.Storage.prototype.setItem=function(){throw Error('QuotaExceededError');};
 w.eval(fs.readFileSync(path.join(__dirname,'../dist/core.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8'));
 t.after(()=>{assert.deepEqual(errors,[]);dom.window.close();});
 const q=s=>doc.querySelector(s),all=s=>[...doc.querySelectorAll(s)];
 const click=s=>{assert.ok(q(s),'missing control: '+s);q(s).click();};
 const change=(s,value)=>{assert.ok(q(s),'missing input: '+s);q(s).value=value;q(s).dispatchEvent(new w.Event('change',{bubbles:true}));};
 const page=p=>click(`[data-page="${p}"]`);
 const date=value=>change('#selectedDate',value);
 const submit=()=>q('#editorForm').requestSubmit();
 const values=obj=>Object.entries(obj).forEach(([key,value])=>{q(`#editorForm [name="${key}"]`).value=value;});
 const stored=()=>JSON.parse(w.localStorage.getItem(KEY));
 return {w,doc,q,all,click,change,page,date,submit,values,stored,downloads};
}
test('all routes render at phone tablet and desktop navigation breakpoints',t=>{
 for(const width of [375,390,768,1024,1440]){
  const a=setup(t,{width});
  if(width<=900){assert.equal(a.q('#sidebar').inert,true);a.click('#menuButton');assert.equal(a.q('#menuButton').getAttribute('aria-expanded'),'true');assert.equal(a.q('#scrim').hidden,false);a.click('#closeNav');assert.equal(a.q('#sidebar').inert,true);}
  for(const p of ['water','schedule','workout','meals','care','settings','dashboard']){a.page(p);assert.ok(a.q('#pageTitle').textContent);assert.ok(a.q('#content').innerHTML.length>100);}
 }
});
test('water totals update immediately, untick, survive reload and stay separate by date',t=>{
 const a=setup(t);a.date('2026-10-19');a.page('water');a.click('[data-action="water-toggle"][data-id="w0"]');
 assert.match(a.q('.ring-number').textContent,/0.3/);assert.deepEqual(a.stored().days['2026-10-19'].water,['w0']);
 const b=setup(t,{raw:JSON.stringify(a.stored())});b.date('2026-10-19');b.page('water');assert.equal(b.q('[data-id="w0"]').getAttribute('aria-pressed'),'true');
 a.date('2026-10-20');assert.match(a.q('.ring-number').textContent,/0.0/);a.date('2026-10-19');a.click('[data-action="water-toggle"][data-id="w0"]');assert.match(a.q('.ring-number').textContent,/0.0/);
});
test('water add edit delete and default plan do not alter another date',t=>{
 const a=setup(t);a.date('2026-10-20');a.page('water');a.click('[data-action="water-add"]');a.values({time:'10:15',ml:450});a.submit();assert.equal(a.all('.slot').length,12);
 const id=a.stored().days['2026-10-20'].waterPlan.find(x=>x.time==='10:15').id;
 a.click(`[data-action="water-toggle"][data-id="${id}"]`);assert.match(a.q('.ring-number').textContent,/0.45/);
 a.click(`[data-action="water-edit"][data-id="${id}"]`);a.values({ml:500});a.submit();assert.match(a.q('.ring-number').textContent,/0.5/);
 a.click('[data-action="water-default"]');a.date('2026-10-21');assert.equal(a.all('.slot').length,12);assert.match(a.q('.ring-number').textContent,/0.0/);
 a.date('2026-10-20');a.click(`[data-action="water-edit"][data-id="${id}"]`);a.click('#deleteItem');a.click('#deleteItem');assert.equal(a.all('.slot').length,11);assert.match(a.q('.ring-number').textContent,/0.0/);
 a.date('2026-10-19');assert.equal(a.all('.slot').length,11);
});
test('schedule CRUD, four statuses and copying only plan reset completion',t=>{
 const a=setup(t);a.date('2026-10-20');a.page('schedule');a.click('[data-action="schedule-add"]');a.values({title:'ทดสอบตาราง',time:'08:30',note:'08:30–09:00'});a.submit();
 const id=a.stored().days['2026-10-20'].schedule[0].id;
 for(const status of ['done','unable','unknown','pending']){a.change(`[data-status-id="${id}"]`,status);assert.equal(a.stored().days['2026-10-20'].schedule[0].status,status);}
 a.click(`[data-action="schedule-edit"][data-id="${id}"]`);a.values({title:'แก้แล้ว'});a.submit();assert.match(a.q('.list').textContent,/แก้แล้ว/);
 a.click('[data-action="schedule-copy"]');a.values({source:'2026-10-19'});a.submit();assert.equal(a.stored().days['2026-10-20'].schedule.length,17);assert.ok(a.stored().days['2026-10-20'].schedule.every(x=>x.status==='pending'));
 a.click(`[data-action="schedule-edit"][data-id="${id}"]`);a.click('#deleteItem');a.click('#deleteItem');assert.equal(a.stored().days['2026-10-20'].schedule.length,16);
});
test('nutrition uses estimates, unknown values, and meal CRUD',t=>{
 const a=setup(t);a.date('2026-10-19');a.page('meals');assert.match(a.q('#content').textContent,/ประมาณการจากข้อมูลที่กรอก/);assert.match(a.q('#content').textContent,/ยังไม่รวม 1 รายการ/);
 a.click('[data-action="meal-add"]');a.values({name:'ข้าวทดสอบ',meal:'เย็น',kcal:100,protein:5});a.submit();let meal=a.stored().days['2026-10-19'].meals.at(-1);assert.equal(meal.carbs,null);assert.equal(meal.estimated,true);
 a.click(`[data-action="meal-edit"][data-id="${meal.id}"]`);a.values({carbs:0,fat:3});a.submit();meal=a.stored().days['2026-10-19'].meals.at(-1);assert.equal(meal.carbs,0);
 a.click(`[data-action="meal-edit"][data-id="${meal.id}"]`);a.click('#deleteItem');a.click('#deleteItem');assert.equal(a.stored().days['2026-10-19'].meals.length,3);
});
test('workout plan, phases, exercise CRUD and daily completion',t=>{
 const a=setup(t);a.date('2026-10-19');a.page('workout');assert.match(a.q('#content').textContent,/27 เซต/);assert.equal(a.all('.exercise-row').length,9);
 a.click('[data-action="workout-toggle"][data-id="A-e0"]');assert.ok(a.stored().days['2026-10-19'].workoutDone.includes('A-e0'));
 a.click('[data-action="exercise-add"]');a.values({name:'ท่าทดสอบ',sets:2,reps:'8 ครั้ง'});a.submit();assert.equal(a.all('.exercise-row').length,10);
 const id=a.stored().workouts.A.exercises.at(-1).id;a.click(`[data-action="exercise-edit"][data-id="${id}"]`);a.values({sets:1});a.submit();assert.equal(a.stored().workouts.A.exercises.at(-1).sets,1);
 a.click(`[data-action="exercise-edit"][data-id="${id}"]`);a.click('#deleteItem');a.click('#deleteItem');assert.equal(a.all('.exercise-row').length,9);
 a.click('[data-action="phase-edit"]');a.values({p1:40});a.submit();assert.match(a.q('.section-actions').textContent,/80 นาที/);
 a.date('2026-10-26');assert.equal(a.q('[data-id="A-e0"]').getAttribute('aria-pressed'),'false');
 a.click('[data-action="workout-plan"]');a.values({group:'rest'});a.submit();assert.match(a.q('#content').textContent,/บันทึกวันพัก/);
});
test('care CRUD, note and check marks persist per day',t=>{
 const a=setup(t);a.date('2026-10-20');a.page('care');assert.match(a.q('#content').textContent,/ยังไม่ยืนยันใช้จริง/);
 a.click('[data-action="care-toggle"][data-id="c5"]');a.q('#careNote').value='อุณหภูมิที่วัด 25°C';a.click('[data-action="care-note"]');assert.match(a.stored().days['2026-10-20'].careNote,/25/);
 a.click('[data-action="care-add"][data-category="pet"]');a.values({title:'ตรวจคอก',note:'ทดสอบ'});a.submit();const id=a.stored().care.at(-1).id;assert.equal(a.stored().care.at(-1).category,'pet');
 a.click(`[data-action="care-edit"][data-id="${id}"]`);a.values({title:'ตรวจคอกแล้ว'});a.submit();assert.match(a.q('#content').textContent,/ตรวจคอกแล้ว/);
 a.click(`[data-action="care-edit"][data-id="${id}"]`);a.click('#deleteItem');a.click('#deleteItem');a.date('2026-10-21');assert.equal(a.q('[data-id="c5"]').getAttribute('aria-pressed'),'false');
});
test('settings save, disable water reference and export JSON',t=>{
 const a=setup(t);a.page('settings');a.q('[name="name"]').value='ทดสอบ';a.q('[name="waterReference"]').value='0';a.q('#settingsForm').requestSubmit();assert.equal(a.stored().settings.waterReference,0);
 a.click('[data-action="export"]');assert.match(a.downloads[1],/^jai-daily-.*\.json$/);a.page('water');assert.match(a.q('#content').textContent,/ปิดค่าอ้างอิง/);
});
test('invalid JSON cannot replace existing state, valid import requires confirmation',async t=>{
 const a=setup(t);a.page('settings');
 async function file(raw){const input=a.q('#importFile');Object.defineProperty(input,'files',{configurable:true,value:[{size:raw.length,text:async()=>raw}]});input.dispatchEvent(new a.w.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));}
 await file('{}');assert.equal(a.q('#editor').open,false);assert.match(a.q('#toast').textContent,/นำเข้าไม่ได้/);
 const imported=C.createState();imported.settings.name='นำเข้าแล้ว';await file(JSON.stringify(imported));assert.equal(a.q('#editor').open,true);a.submit();assert.equal(a.q('#editor').open,true);a.q('[name="confirm"]').checked=true;a.submit();assert.equal(a.stored().settings.name,'นำเข้าแล้ว');
});
test('corrupt local storage is preserved and clearly blocks overwriting',t=>{
 const a=setup(t,{raw:'corrupt'});assert.match(a.q('#content').textContent,/ยังไม่ถูกเขียนทับ/);a.page('water');a.click('[data-action="water-toggle"][data-id="w0"]');assert.equal(a.w.localStorage.getItem(KEY),'corrupt');assert.match(a.q('#saveState').textContent,/ยังไม่ได้บันทึก/);
});
test('storage quota failures are visible without claiming save success',t=>{
 const a=setup(t,{blocked:true});a.page('water');a.click('[data-action="water-toggle"][data-id="w0"]');assert.match(a.q('#saveState').textContent,/ยังไม่ได้บันทึก/);assert.match(a.q('#toast').textContent,/บันทึกในเครื่องไม่ได้/);
});
test('imported text remains text and cannot create HTML elements',t=>{
 const s=C.createState();s.settings.name='<img src=x onerror=alert(1)>';s.care[0].title='<svg onload=alert(1)>';
 const a=setup(t,{raw:JSON.stringify(s)});assert.equal(a.all('img[src="x"],[onerror]').length,0);a.page('care');assert.match(a.q('#content').textContent,/<svg onload/);assert.equal(a.all('[onload],[onerror]').length,0);
});
test('edited phase IDs are escaped when used as field names',t=>{
 const s=C.createState();s.phases[0].id='p0"><img src=x onerror="alert(1)';
 const a=setup(t,{raw:JSON.stringify(s)});a.date('2026-10-19');a.page('workout');a.click('[data-action="phase-edit"]');assert.equal(a.all('img[src="x"],[onerror]').length,0);
});
test('desktop sidebar reports its actual expanded state after navigation',t=>{
 const a=setup(t);a.page('water');assert.equal(a.q('#menuButton').getAttribute('aria-expanded'),'true');a.click('#menuButton');a.page('schedule');assert.equal(a.q('#menuButton').getAttribute('aria-expanded'),'false');
});
test('whitespace-only activity names are rejected without changing saved data',t=>{
 const a=setup(t);a.date('2026-10-20');a.page('schedule');a.click('[data-action="schedule-add"]');a.values({title:'   '});a.submit();assert.equal(a.q('#editor').open,true);assert.match(a.q('#formError').textContent,/กรอก/);assert.equal(a.w.localStorage.getItem(KEY),null);
});
test('validation failure rolls back edits so later saves remain valid',t=>{
 const s=C.createState(),day=C.day(s,'2026-10-20');day.schedule=Array.from({length:500},(_,i)=>({id:'long'+i,time:'10:00',title:'กิจกรรม '+i,status:'pending',note:''}));
 const a=setup(t,{raw:JSON.stringify(s)});a.date('2026-10-20');a.page('schedule');a.click('[data-action="schedule-add"]');a.values({title:'รายการเกินขีดจำกัด'});a.submit();assert.equal(a.q('#editor').open,true);a.click('[data-close]');a.page('water');a.click('[data-action="water-toggle"][data-id="w0"]');assert.doesNotThrow(()=>C.parseImport(a.w.localStorage.getItem(KEY)));
});
test('care notes typed before a checklist toggle survive the rerender and reload',t=>{
 const a=setup(t);a.date('2026-10-20');a.page('care');a.q('#careNote').value='ร่างที่กำลังพิมพ์';a.q('#careNote').dispatchEvent(new a.w.Event('input',{bubbles:true}));a.click('[data-action="care-toggle"][data-id="c5"]');assert.equal(a.q('#careNote').value,'ร่างที่กำลังพิมพ์');
 const b=setup(t,{raw:JSON.stringify(a.stored())});b.date('2026-10-20');b.page('care');assert.equal(b.q('#careNote').value,'ร่างที่กำลังพิมพ์');
});
test('deleting care template preserves completed history with its title on that date',t=>{
 const a=setup(t);a.date('2026-10-19');a.page('care');a.click('[data-action="care-toggle"][data-id="c5"]');a.date('2026-10-20');a.click('[data-action="care-edit"][data-id="c5"]');a.click('#deleteItem');a.click('#deleteItem');
 assert.equal(a.stored().care.some(x=>x.id==='c5'),false);assert.ok(a.stored().days['2026-10-19'].care.includes('c5'));a.date('2026-10-19');assert.match(a.q('#content').textContent,/ตรวจน้ำสะอาดของกระแต/);assert.match(a.q('#content').textContent,/ประวัติ/);assert.doesNotThrow(()=>C.parseImport(JSON.stringify(a.stored())));a.click('[data-action="care-toggle"][data-id="c5"]');assert.equal(a.q('[data-id="c5"]').getAttribute('aria-pressed'),'false');a.click('[data-action="care-toggle"][data-id="c5"]');assert.equal(a.q('[data-id="c5"]').getAttribute('aria-pressed'),'true');
});
test('deleting exercise template preserves its completed log and title on old dates',t=>{
 const a=setup(t);a.date('2026-10-19');a.page('workout');a.click('[data-action="workout-toggle"][data-id="A-e0"]');a.date('2026-10-22');a.click('[data-action="exercise-edit"][data-id="e0"]');a.click('#deleteItem');a.click('#deleteItem');
 assert.equal(a.stored().workouts.A.exercises.some(x=>x.id==='e0'),false);assert.ok(a.stored().days['2026-10-19'].workoutDone.includes('A-e0'));a.date('2026-10-19');assert.match(a.q('#content').textContent,/Push-up/);assert.match(a.q('#content').textContent,/ประวัติ/);assert.doesNotThrow(()=>C.parseImport(JSON.stringify(a.stored())));a.click('[data-action="workout-toggle"][data-id="A-e0"]');assert.equal(a.q('[data-id="A-e0"]').getAttribute('aria-pressed'),'false');a.click('[data-action="workout-toggle"][data-id="A-e0"]');assert.equal(a.q('[data-id="A-e0"]').getAttribute('aria-pressed'),'true');
});
test('existing empty storage is treated as corrupt rather than absent',t=>{
 const a=setup(t,{raw:''});assert.match(a.q('#content').textContent,/ยังไม่ถูกเขียนทับ/);a.page('water');a.click('[data-action="water-toggle"][data-id="w0"]');assert.equal(a.w.localStorage.getItem(KEY),'');
});
test('explicit daily save persists an empty day and opens it from history after reload',t=>{
 const a=setup(t);a.date('2026-10-21');assert.match(a.q('#dailySaveStatus').textContent,/ยังไม่มีบันทึก/);
 a.click('[data-action="day-save"]');const raw=JSON.stringify(a.stored());
 assert.ok(a.stored().days['2026-10-21'].savedAt);assert.match(a.q('#dailySaveStatus').textContent,/บันทึกล่าสุด/);
 const b=setup(t,{raw});b.page('history');b.click('[data-action="open-day"][data-date="2026-10-21"]');
 assert.equal(b.q('#selectedDate').value,'2026-10-21');assert.equal(b.q('#breadcrumb').textContent,'ภาพรวม');assert.match(b.q('#dailySaveStatus').textContent,/บันทึกล่าสุด/);
});
test('daily history restores all daily records independently and filters by month',t=>{
 const a=setup(t);a.date('2026-10-20');a.page('water');a.click('[data-action="water-toggle"][data-id="w0"]');
 a.page('schedule');a.click('[data-action="schedule-add"]');a.values({title:'อ่านหนังสือ',time:'13:00',status:'done'});a.submit();
 a.page('meals');a.click('[data-action="meal-add"]');a.values({name:'มื้อทดสอบ',meal:'กลางวัน',kcal:200});a.submit();
 a.page('workout');a.click('[data-action="workout-toggle"][data-id="B-e0"]');a.page('care');a.click('[data-action="care-toggle"][data-id="c5"]');
 a.q('#careNote').value='น้ำใหม่แล้ว';a.q('#careNote').dispatchEvent(new a.w.Event('input',{bubbles:true}));
 a.date('2026-11-01');a.click('[data-action="day-save"]');const b=setup(t,{raw:JSON.stringify(a.stored())});b.page('history');
 assert.ok(b.q('[data-action="open-day"][data-date="2026-10-20"]'));b.change('#historyMonth','2026-11');assert.equal(b.q('[data-action="open-day"][data-date="2026-10-20"]'),null);
 b.change('#historyMonth','');b.click('[data-action="open-day"][data-date="2026-10-20"]');b.page('water');assert.match(b.q('.ring-number').textContent,/0.3/);
 assert.deepEqual(b.stored().days['2026-10-20'].care,['c5']);assert.equal(b.stored().days['2026-10-20'].careNote,'น้ำใหม่แล้ว');assert.equal(b.stored().days['2026-10-20'].schedule[0].status,'done');assert.equal(b.stored().days['2026-10-20'].meals[0].kcal,200);assert.deepEqual(b.stored().days['2026-10-20'].workoutDone,['B-e0']);
 b.date('2026-11-01');assert.match(b.q('.ring-number').textContent,/0.0/);
});
test('visiting dates does not claim saved history and legacy records still open',t=>{
 const a=setup(t);a.date('2026-10-29');a.page('history');assert.equal(a.all('[data-action="open-day"]').length,0);
 const b=setup(t,{raw:JSON.stringify(C.createState())});b.page('history');assert.match(b.q('#content').textContent,/ไม่ทราบเวลาบันทึก/);b.click('[data-action="open-day"][data-date="2026-10-19"]');assert.match(b.q('#dailySaveStatus').textContent,/บันทึกเดิม/);
});
test('daily save failure never marks the day as saved or adds it to history',t=>{
 const a=setup(t,{blocked:true});a.date('2026-10-21');a.click('[data-action="day-save"]');assert.match(a.q('#dailySaveStatus').textContent,/ยังไม่ได้บันทึกถาวร/);assert.equal(a.w.localStorage.getItem(KEY),null);a.page('history');assert.equal(a.all('[data-action="open-day"]').length,0);
});
test('history pages records in batches without losing older days',t=>{
 const s=C.createState();for(let i=1;i<=31;i++)C.day(s,'2026-10-'+String(i).padStart(2,'0'));
 const a=setup(t,{raw:JSON.stringify(s)});a.page('history');assert.equal(a.all('[data-action="open-day"]').length,20);a.click('[data-action="history-more"]');assert.equal(a.all('[data-action="open-day"]').length,31);
});
