const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const C=require('../dist/core.js');
const KEY='jai-daily.v1';
test('saved body data drives fluid references and settings without overwriting water history',t=>{
 const s=C.createState();s.settings.body={age:30,sex:'male',height:175,weight:70,activity:'moderate'};C.day(s,'2026-10-22').water=['w0'];
 const a=setup(t,{raw:JSON.stringify(s)});a.date('2026-10-22');a.page('water');assert.match(a.q('#hydrationReference').textContent,/2.1.*2.45/);
 for(const [name,value] of Object.entries({otherDrinksMl:'300',weather:'hot',activityMinutes:'60',extraMl:'400'}))a.q(`#hydrationForm [name="${name}"]`).value=value;
 a.q('#hydrationForm').requestSubmit();assert.equal(a.stored().days['2026-10-22'].hydration.otherDrinksMl,300);assert.match(a.q('#hydrationKnownTotal').textContent,/0.6/);assert.match(a.q('#hydrationReference').textContent,/2.5.*2.85/);
 assert.equal(a.stored().settings.waterReference,3300);assert.deepEqual(a.stored().days['2026-10-22'].water,['w0']);
 a.page('settings');assert.match(a.q('#bodySettingsSummary').textContent,/70/);assert.match(a.q('#bodySettingsSummary').textContent,/22.86/);assert.ok(a.q('#bodySettingsSummary [data-page="body"]'));
 a.page('body');a.q('#bodyForm [name="weight"]').value='65';a.q('#bodyForm').requestSubmit();a.page('water');assert.match(a.q('#hydrationReference').textContent,/2.35.*2.68/);a.page('settings');assert.match(a.q('#bodySettingsSummary').textContent,/65/);
 const b=setup(t,{raw:JSON.stringify(a.stored())});b.date('2026-10-22');b.page('water');assert.equal(b.q('#hydrationForm [name="otherDrinksMl"]').value,'300');b.date('2026-10-23');assert.equal(b.q('#hydrationForm [name="otherDrinksMl"]').value,'');assert.match(b.q('#hydrationRemaining').textContent,/—/);
});
test('missing profile and a clinician plan avoid misleading numeric hydration instructions',t=>{
 const a=setup(t);a.page('water');assert.match(a.q('#hydrationReference').textContent,/—/);assert.ok(a.q('#content [data-page="body"]'));a.page('settings');assert.match(a.q('#bodySettingsSummary').textContent,/ยังไม่มี/);
 const s=C.createState();s.settings.body={age:30,sex:'female',height:165,weight:60,activity:''};C.day(s,'2026-10-22').hydration={otherDrinksMl:0,weather:'hot',activityMinutes:30,extraMl:200,restricted:true};
 const b=setup(t,{raw:JSON.stringify(s)});b.date('2026-10-22');b.page('water');assert.equal(b.q('#hydrationReference').textContent,'—');assert.match(b.q('#hydrationReason').textContent,/เฉพาะบุคคล/);
});
test('hydration drafts autosave valid input before water toggles and invalid input cannot poison later saves',t=>{
 const s=C.createState();s.settings.body={age:30,sex:'male',height:175,weight:70,activity:''};
 const a=setup(t,{raw:JSON.stringify(s)});a.date('2026-10-22');a.page('water');const field=a.q('#hydrationForm [name="otherDrinksMl"]');field.value='450';field.dispatchEvent(new a.w.Event('input',{bubbles:true}));
 a.click('[data-action="water-toggle"][data-id="w0"]');assert.equal(a.q('#hydrationForm [name="otherDrinksMl"]').value,'450');assert.match(a.q('#hydrationKnownTotal').textContent,/0.75/);
 const invalid=a.q('#hydrationForm [name="otherDrinksMl"]');invalid.value='-1';invalid.dispatchEvent(new a.w.Event('input',{bubbles:true}));assert.ok(a.q('#hydrationError').textContent);assert.equal(a.stored().days['2026-10-22'].hydration.otherDrinksMl,450);a.click('[data-action="water-toggle"][data-id="w1"]');assert.doesNotThrow(()=>C.parseImport(JSON.stringify(a.stored())));
});
test('body menu sits below dashboard and above water; live values save and reload without changing nutrition',t=>{
 const a=setup(t),nav=a.all('#navigation [data-page]').map(x=>x.dataset.page);
 assert.deepEqual(nav.slice(0,3),['dashboard','body','water']);a.page('body');assert.equal(a.q('#dailySave').hidden,true);
 assert.equal(a.q('#bodyBmi').textContent,'—');
 for(const [name,value] of Object.entries({age:'30',sex:'male',height:'180',weight:'81',activity:'moderate'})){
  const field=a.q(`#bodyForm [name="${name}"]`);field.value=value;field.dispatchEvent(new a.w.Event('input',{bubbles:true}));
 }
 assert.equal(Number(a.q('#bodyBmi').textContent),25);assert.match(a.q('#bodyRee').textContent,/1,790/);assert.match(a.q('#bodyTdee').textContent,/3,043/);
 assert.equal(a.w.localStorage.getItem(KEY),null);a.q('#bodyForm').requestSubmit();assert.equal(a.stored().settings.body.weight,81);assert.equal(a.stored().days['2026-10-19'].meals.length,3);
 const b=setup(t,{raw:JSON.stringify(a.stored())});b.page('body');assert.equal(b.q('#bodyForm [name="weight"]').value,'81');assert.equal(Number(b.q('#bodyBmi').textContent),25);
 b.q('#bodyForm [name="weight"]').value='';b.q('#bodyForm [name="weight"]').dispatchEvent(new b.w.Event('input',{bubbles:true}));assert.equal(b.q('#bodyBmi').textContent,'—');assert.equal(b.q('#bodyRee').textContent,'—');
});
test('body calculator keeps adult classifications and energy out of child results',t=>{
 const s=C.createState();s.settings.body={age:15,sex:'female',height:150,weight:45,activity:'light'};
 const a=setup(t,{raw:JSON.stringify(s)});a.page('body');assert.equal(Number(a.q('#bodyBmi').textContent),20);assert.equal(a.q('#bodyRee').textContent,'—');assert.equal(a.q('#bodyTdee').textContent,'—');assert.match(a.q('#bodyCategory').textContent,/อายุ/);
});
test('care morning and afternoon lists support adding moving editing deleting and daily persistence',t=>{
 const a=setup(t);a.date('2026-10-20');a.page('care');
 assert.match(a.q('[data-care-period="morning"]').textContent,/ดูแลตัวเองตอนเช้า/);
 assert.match(a.q('[data-care-period="afternoon"]').textContent,/ดูแลตัวเองตอนบ่าย/);
 for(const period of ['morning','afternoon']){
  a.click(`[data-care-period="${period}"] [data-action="care-add"]`);
  assert.equal(a.q('[name="period"]').value,period);a.values({title:'รายการ '+period,note:'ส่วนตัว'});a.submit();
 }
 const s=a.stored(),morning=s.care.find(x=>x.period==='morning'),afternoon=s.care.find(x=>x.period==='afternoon');
 a.click(`[data-action="care-toggle"][data-id="${morning.id}"]`);
 a.click('[data-action="care-toggle"][data-id="c0"]');
 a.click('[data-action="care-edit"][data-id="c0"]');a.values({period:'afternoon'});a.submit();
 assert.ok(a.q('[data-care-period="afternoon"] [data-id="c0"]'));
 assert.ok(a.stored().days['2026-10-20'].care.includes('c0'));
 a.click(`[data-action="care-edit"][data-id="${afternoon.id}"]`);a.values({title:'แก้บ่าย'});a.submit();
 const b=setup(t,{raw:JSON.stringify(a.stored())});b.date('2026-10-20');b.page('care');
 assert.equal(b.q(`[data-action="care-toggle"][data-id="${morning.id}"]`).getAttribute('aria-pressed'),'true');
 assert.match(b.q('[data-care-period="afternoon"]').textContent,/แก้บ่าย/);
 b.date('2026-10-21');assert.equal(b.q(`[data-action="care-toggle"][data-id="${morning.id}"]`).getAttribute('aria-pressed'),'false');
 b.click(`[data-action="care-edit"][data-id="${afternoon.id}"]`);b.click('#deleteItem');b.click('#deleteItem');
 assert.equal(b.stored().care.some(x=>x.id===afternoon.id),false);
});
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
 w.eval(fs.readFileSync(path.join(__dirname,'../dist/food-photo.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(__dirname,'../dist/body-page.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(__dirname,'../dist/hydration.js'),'utf8'));
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
  for(const p of ['body','water','schedule','workout','meals','care','settings','dashboard']){a.page(p);assert.ok(a.q('#pageTitle').textContent);assert.ok(a.q('#content').innerHTML.length>100);}
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
 a.click('[data-action="care-toggle"][data-id="c4"]');a.q('#careNote').value='อุณหภูมิที่วัด 25°C';a.click('[data-action="care-note"]');assert.match(a.stored().days['2026-10-20'].careNote,/25/);
 a.click('[data-action="care-add"]');a.values({title:'ดูแลผิว',note:'ทดสอบ'});a.submit();const id=a.stored().care.at(-1).id;assert.equal(a.stored().care.at(-1).category,'self');
 a.click(`[data-action="care-edit"][data-id="${id}"]`);a.values({title:'ดูแลผิวแล้ว'});a.submit();assert.match(a.q('#content').textContent,/ดูแลผิวแล้ว/);
 a.click(`[data-action="care-edit"][data-id="${id}"]`);a.click('#deleteItem');a.click('#deleteItem');a.date('2026-10-21');assert.equal(a.q('[data-id="c4"]').getAttribute('aria-pressed'),'false');
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
 const a=setup(t);a.date('2026-10-20');a.page('care');a.q('#careNote').value='ร่างที่กำลังพิมพ์';a.q('#careNote').dispatchEvent(new a.w.Event('input',{bubbles:true}));a.click('[data-action="care-toggle"][data-id="c4"]');assert.equal(a.q('#careNote').value,'ร่างที่กำลังพิมพ์');
 const b=setup(t,{raw:JSON.stringify(a.stored())});b.date('2026-10-20');b.page('care');assert.equal(b.q('#careNote').value,'ร่างที่กำลังพิมพ์');
});
test('deleting care template preserves completed history with its title on that date',t=>{
 const a=setup(t);a.date('2026-10-19');a.page('care');a.click('[data-action="care-toggle"][data-id="c4"]');a.date('2026-10-20');a.click('[data-action="care-edit"][data-id="c4"]');a.click('#deleteItem');a.click('#deleteItem');
 assert.equal(a.stored().care.some(x=>x.id==='c4'),false);assert.ok(a.stored().days['2026-10-19'].care.includes('c4'));a.date('2026-10-19');assert.match(a.q('#content').textContent,/ดูแลเพลทจัดฟัน/);assert.match(a.q('#content').textContent,/ประวัติ/);assert.doesNotThrow(()=>C.parseImport(JSON.stringify(a.stored())));a.click('[data-action="care-toggle"][data-id="c4"]');assert.equal(a.q('[data-id="c4"]').getAttribute('aria-pressed'),'false');a.click('[data-action="care-toggle"][data-id="c4"]');assert.equal(a.q('[data-id="c4"]').getAttribute('aria-pressed'),'true');
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
 a.page('workout');a.click('[data-action="workout-toggle"][data-id="B-e0"]');a.page('care');a.click('[data-action="care-toggle"][data-id="c4"]');
 a.q('#careNote').value='น้ำใหม่แล้ว';a.q('#careNote').dispatchEvent(new a.w.Event('input',{bubbles:true}));
 a.date('2026-11-01');a.click('[data-action="day-save"]');const b=setup(t,{raw:JSON.stringify(a.stored())});b.page('history');
 assert.ok(b.q('[data-action="open-day"][data-date="2026-10-20"]'));b.change('#historyMonth','2026-11');assert.equal(b.q('[data-action="open-day"][data-date="2026-10-20"]'),null);
 b.change('#historyMonth','');b.click('[data-action="open-day"][data-date="2026-10-20"]');b.page('water');assert.match(b.q('.ring-number').textContent,/0.3/);
 assert.deepEqual(b.stored().days['2026-10-20'].care,['c4']);assert.equal(b.stored().days['2026-10-20'].careNote,'น้ำใหม่แล้ว');assert.equal(b.stored().days['2026-10-20'].schedule[0].status,'done');assert.equal(b.stored().days['2026-10-20'].meals[0].kcal,200);assert.deepEqual(b.stored().days['2026-10-20'].workoutDone,['B-e0']);
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
function configureFood(a){a.page('settings');a.q('[name="foodEndpoint"]').value='https://food.example/api/analyze-food';a.q('[name="foodAccessCode"]').value='b'.repeat(32);a.q('#foodApiForm').requestSubmit();a.page('meals');}
async function photo(a){
 a.w.Image=class{naturalWidth=1000;naturalHeight=800;set src(v){if(v)queueMicrotask(()=>this.onload());}};
 a.w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},drawImage(){}});a.w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,/9j/2Q==';
 const input=a.q('#foodFile');Object.defineProperty(input,'files',{value:[{type:'image/jpeg',size:20000}],configurable:true});input.dispatchEvent(new a.w.Event('change',{bubbles:true}));await new Promise(r=>setImmediate(r));
}
test('photo flow works without AI through manual review and saves meal time/portion by date',t=>{
 const a=setup(t);a.date('2026-10-20');a.page('meals');a.click('[data-food-action="open"]');assert.equal(a.q('#foodPhotoDialog').open,true);assert.equal(a.q('#foodCamera').getAttribute('capture'),'environment');assert.equal(a.q('#foodAnalyze').disabled,true);
 a.q('#foodDate').value='2026-10-21';a.q('#foodTime').value='13:25';a.q('#foodMeal').value='กลางวัน';a.q('#foodPortion').value='1 จาน';a.q('#foodDescription').value='ข้าวทดสอบ';a.click('[data-food-action="manual"]');assert.equal(a.w.localStorage.getItem(KEY),null);assert.equal(a.q('#editor').open,true);a.submit();
 const m=a.stored().days['2026-10-21'].meals[0];assert.equal(m.name,'ข้าวทดสอบ');assert.equal(m.time,'13:25');assert.equal(m.portion,'1 จาน');assert.equal(m.kcal,null);assert.equal(m.source,'manual');assert.match(a.q('#content').textContent,/13:25/);
});
test('AI photo consent gates network and reviewed result alone is saved to the chosen day',async t=>{
 const a=setup(t);configureFood(a);a.date('2026-10-20');a.click('[data-food-action="open"]');await photo(a);let calls=0;
 a.w.fetch=async(url,options)=>{calls++;assert.equal(url,'https://food.example/api/analyze-food');assert.match(options.headers.Authorization,/^Bearer b/);return {ok:true,json:async()=>({analysis:{isFood:true,foodName:'ข้าวจากรูป',portion:'1 จาน',kcal:500,protein:20.17,carbs:65,fat:18,fiber:null,sodium:null,confidence:'low',note:'ไม่ทราบน้ำมัน'}})};};
 a.click('#foodAnalyze');await new Promise(r=>setImmediate(r));assert.equal(calls,0);assert.match(a.q('#foodPhotoStatus').textContent,/ยืนยัน/);
 a.q('#foodDate').value='2026-10-22';a.q('#foodTime').value='18:45';a.q('#foodMeal').value='เย็น';a.q('#foodConsent').checked=true;a.click('#foodAnalyze');await new Promise(r=>setImmediate(r));assert.equal(calls,1);assert.equal(a.w.localStorage.getItem(KEY),null);assert.equal(a.q('#editor').open,true);
 assert.equal(a.q('#editorForm [name="protein"]').value,'20.2');assert.equal(a.q('#editorForm').checkValidity(),true);a.values({kcal:480});a.submit();const m=a.stored().days['2026-10-22'].meals[0];assert.equal(m.kcal,480);assert.equal(m.time,'18:45');assert.equal(m.source,'photo-ai');assert.equal(m.estimated,true);assert.equal(m.sodium,null);assert.doesNotMatch(JSON.stringify(a.stored()),/Bearer|bbbbbbbb|image\/jpeg/);
 a.click(`[data-action="meal-edit"][data-id="${m.id}"]`);a.values({time:'19:00'});a.submit();assert.equal(a.stored().days['2026-10-22'].meals[0].source,'photo-ai');
});
test('closing a pending photo analysis ignores late results and saves nothing',async t=>{
 const a=setup(t);configureFood(a);a.click('[data-food-action="open"]');await photo(a);a.q('#foodConsent').checked=true;let release,signal;
 a.w.fetch=async(u,o)=>{signal=o.signal;return new Promise(r=>{release=r;});};a.click('#foodAnalyze');a.click('[data-food-action="cancel"]');assert.equal(signal.aborted,true);
 release({ok:true,json:async()=>({analysis:{}})});await new Promise(r=>setImmediate(r));assert.equal(a.q('#editor').open,false);assert.equal(a.w.localStorage.getItem(KEY),null);
});
test('cancel during response JSON download cannot reopen review or close a newer photo dialog',async t=>{
 const a=setup(t);configureFood(a);a.click('[data-food-action="open"]');await photo(a);a.q('#foodConsent').checked=true;let release;
 a.w.fetch=async()=>({ok:true,json:()=>new Promise(r=>{release=r;})});a.click('#foodAnalyze');await new Promise(r=>setImmediate(r));a.click('[data-food-action="cancel"]');a.click('[data-food-action="open"]');
 release({analysis:{isFood:true,foodName:'ผลเก่า',portion:'1 จาน',kcal:500,protein:20,carbs:60,fat:20,fiber:null,sodium:null,confidence:'low',note:'ผลที่มาช้า'}});await new Promise(r=>setImmediate(r));assert.equal(a.q('#editor').open,false);assert.equal(a.q('#foodPhotoDialog').open,true);assert.equal(a.w.localStorage.getItem(KEY),null);
});
test('AI access code is memory only and invalid endpoint or API key is rejected',t=>{
 const a=setup(t);configureFood(a);assert.doesNotMatch([...Array(a.w.localStorage.length)].map((_,i)=>a.w.localStorage.getItem(a.w.localStorage.key(i))).join(''),/bbbbbbbb/);
 a.page('settings');a.q('[name="foodEndpoint"]').value='https://user:pass@food.example/api/analyze-food';a.q('#foodApiForm').requestSubmit();assert.match(a.q('#foodApiStatus').textContent,/HTTPS/);
 a.q('[name="foodEndpoint"]').value='https://food.example/api/analyze-food';a.q('[name="foodAccessCode"]').value='sk-should-not-go-to-browser';a.q('#foodApiForm').requestSubmit();assert.match(a.q('#foodApiStatus').textContent,/ไม่ใช้ API key/);
});
test('legacy animal data is cleaned and persisted on load without erasing other days',t=>{
 const s=C.createState(),day=C.day(s,'2026-10-20');s.care.push({id:'old-rabbit',category:'pet',title:'ดูแลกระแต',note:'กระต่าย'});day.care=['c0','old-rabbit'];day.water=['w0'];day.careNote='ทาครีมแล้ว\nให้อาหารกระต่าย';
 const a=setup(t,{raw:JSON.stringify(s)});assert.doesNotMatch(JSON.stringify(a.stored()),/กระต่าย|กระแต|"pet"/);assert.deepEqual(a.stored().days['2026-10-20'].water,['w0']);assert.deepEqual(a.stored().days['2026-10-20'].care,['c0']);
 for(const p of ['dashboard','care','workout']){a.page(p);assert.doesNotMatch(a.q('#main').textContent,/กระแต|กระต่าย|Lionhead/);}
 a.page('care');a.click('[data-action="care-add"]');assert.equal(a.q('#editorForm [name="category"]'),null);
});
test('failed cleanup write preserves unrelated in-memory records and reports unsaved storage',t=>{
 const s=C.createState(),d=C.day(s,'2026-10-20');s.care.push({id:'retired',category:'pet',title:'ดูแลกระต่าย',note:''});d.water=['w0'];d.care=['retired','c0'];
 const raw=JSON.stringify(s),a=setup(t,{raw,blocked:true});assert.equal(a.w.localStorage.getItem(KEY),raw);a.date('2026-10-20');a.page('water');assert.match(a.q('.ring-number').textContent,/0.3/);assert.match(a.q('#saveState').textContent,/ยังไม่ได้บันทึกถาวร/);a.page('care');assert.doesNotMatch(a.q('#content').textContent,/กระต่าย|กระแต/);assert.ok(a.q('[data-action="care-toggle"][data-id="c0"]'));
});

test('overview links cover every topic and update the selected date without saving a visit',t=>{
 const a=setup(t);
 assert.equal(a.w.document.body.classList.contains('overview-view'),true);
 assert.deepEqual(a.all('.overview-topics [data-page]').map(x=>x.dataset.page),['body','water','schedule','workout','meals','care','history']);
 a.date('2026-10-22');
 assert.equal(a.q('.overview-topic-water small').textContent,'0.0 ลิตร · 0 แก้ววันนี้');
 assert.equal(a.w.localStorage.getItem(KEY),null);
 a.click('.overview-topic-water');
 assert.equal(a.w.document.body.classList.contains('overview-view'),true);
 assert.ok(a.q('.overview-panel-content #hydrationForm'));
 assert.ok(a.q('.overview-topics .overview-topic-water[aria-current="page"]'));
 a.q('.overview-panel-content').scrollTop=120;
 assert.ok(a.q('#hydrationForm'));
 a.click('[data-action="water-toggle"][data-id="w0"]');
 assert.equal(a.q('.overview-panel-content').scrollTop,120);
 a.page('dashboard');
 assert.match(a.q('.overview-topic-water small').textContent,/0.3 ลิตร/);
 a.date('2026-10-23');
 assert.match(a.q('.overview-topic-water small').textContent,/0.0 ลิตร/);
});

test('all topics render their existing forms inside the overview and can return to the introduction',t=>{
 const a=setup(t);
 for(const route of ['body','water','schedule','workout','meals','care','history']){
  a.click('.overview-topic-'+route);
  assert.ok(a.q('.overview-hero.has-panel .overview-panel-content'),route);
  assert.equal(a.all('.overview-topics .overview-topic').length,7);
  assert.ok(a.q('.overview-topic-'+route+'[aria-current="page"]'));
 }
 a.click('.overview-panel-header [data-page="dashboard"]');
 assert.equal(a.q('.overview-panel'),null);
 assert.ok(a.q('.overview-copy'));
 a.page('body');
 for(const [name,value] of Object.entries({age:'30',sex:'male',height:'180',weight:'81',activity:'moderate'}))a.q('#bodyForm [name="'+name+'"]').value=value;
 a.q('#bodyForm').requestSubmit();
 a.click('.overview-topic-water');
 a.click('.overview-topic-body');
 assert.equal(a.q('#bodyForm [name="weight"]').value,'81');
});
