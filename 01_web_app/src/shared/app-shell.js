/* Your Day: no analytics, external fonts or runtime dependencies. Optional photo AI requires explicit consent. */
(()=>{'use strict';
 const C=window.Jai,KEY='jai-daily.v1',$=s=>document.querySelector(s);
 const paths={menu:'M4 6h16M4 12h16M4 18h16',dashboard:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',water:'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z M9 16a3 3 0 0 0 3 3',schedule:'M5 5h14v16H5zM8 3v4M16 3v4M5 10h14M8 14h3M8 17h6',workout:'M3 9v6M6 6v12M6 12h12M18 6v12M21 9v6',meals:'M6 3v7M3 3v4a3 3 0 0 0 6 0V3M6 10v11M17 3c-4 2-4 9 0 9h2M19 3v18',care:'M20 5a5 5 0 0 0-8-1 5 5 0 0 0-8 6l8 10 8-10a5 5 0 0 0 0-5Z',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM10 3h4l1 3 3 1 3 2v4l-3 2-1 3-3 3h-4l-2-3-3-1-2-3v-4l3-2 1-3Z',check:'M5 12l4 4L19 6',plus:'M12 5v14M5 12h14',edit:'m15 4 5 5M4 20l4-1L21 6l-4-4L4 15Z',arrow:'M5 12h14m-5-5 5 5-5 5',info:'M12 11v6M12 7v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',leaf:'M20 3C8 1 2 8 5 15c3 7 15 3 15-12ZM4 21l12-13',clock:'M12 7v5l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',close:'m6 6 12 12M6 18 18 6'};
 const icon=(name)=>`<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${paths[name]||paths.leaf}"/></svg>`;
 const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const n=x=>Number(x).toLocaleString('th-TH',{maximumFractionDigits:1});
 const litres=ml=>(ml/1000).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:2});
 const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const shift=(date,delta)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+delta);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const thaiDate=date=>new Date(date+'T12:00:00').toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 const routes={dashboard:['ภาพรวม','วันของคุณ','ภาพเล็ก ๆ ของการดูแลตัวเองในแต่ละวัน'],body:['คำนวณร่างกาย','คำนวณร่างกายของคุณ','BMI และพลังงานโดยประมาณจากข้อมูลที่คุณกรอก'],water:['ดื่มน้ำ','เติมความสดชื่น','บันทึกทีละแก้ว ดูยอดเปลี่ยนทันที'],schedule:['ตารางชีวิตรายวัน','จัดวันให้เป็นจังหวะ','วางแผน ปรับเปลี่ยน และเริ่มใหม่ได้เสมอ'],workout:['ออกกำลังกาย','ขยับร่างกาย ใจสบาย','แผนที่ยืดหยุ่นได้ตามความพร้อมของคุณ'],meals:['อาหาร / สารอาหาร','ทุกมื้อของวันนี้','บันทึกเพื่อรู้จักตัวเอง โดยไม่มีโควตาแคลอรี'],care:['ดูแลตัวเอง','ดูแลกันในทุกวัน','เช็กลิสต์และบันทึกการดูแลตัวเอง'],settings:['ตั้งค่า','ข้อมูลร่างกายล่าสุดของคุณ','ข้อมูลชุดเดียวกับหน้าคำนวณร่างกาย · บันทึกแล้วจะอัปเดตหน้านี้และหน้าดื่มน้ำ']};
 let storageBlocked=false,rawBackup=null,state,storageIssue='';
 try{rawBackup=localStorage.getItem(KEY);state=rawBackup===null?C.createState():C.parseImport(rawBackup);
  if(rawBackup!==null&&JSON.stringify(state)!==JSON.stringify(JSON.parse(rawBackup))){try{const cleaned=JSON.stringify(state);localStorage.setItem(KEY,cleaned);rawBackup=cleaned;}catch{storageBlocked=true;storageIssue='ปรับข้อมูลเดิมแล้วในหน้านี้ แต่ยังเขียนลงเครื่องไม่ได้ กรุณาส่งออก JSON ที่ปรับแล้วก่อนปิดหน้า';}}
 }catch(err){state=C.createState();storageBlocked=true;storageIssue=rawBackup!==null?'อ่านข้อมูลเดิมไม่ได้ ข้อมูลเดิมยังไม่ถูกเขียนทับ กรุณาดาวน์โหลดสำรองก่อนเริ่มใหม่':'เบราว์เซอร์ไม่อนุญาตให้บันทึก ขณะนี้ข้อมูลอยู่ชั่วคราว ควรส่งออก JSON ก่อนปิดหน้า';}
 routes.history=['ประวัติรายวัน','วันที่คุณบันทึกไว้','เปิดดูและแก้ไขข้อมูลของแต่ละวันได้เสมอ'];
 let savedDates=new Set(rawBackup!==null&&!storageBlocked?Object.keys(state.days):[]),historyMonth='',historyLimit=20;
 let date=localDate(),page=Object.hasOwn(routes,location.hash.slice(1))?location.hash.slice(1):'dashboard',editor=null,toastTimer,deleteArmed=false;
 const d=()=>C.day(state,date),stats=()=>C.waterStats(state,date);
 function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
 function save(message,stamp=true){
  if(!storageBlocked){const day=stamp?d():null,previous=day?.savedAt;try{if(day)day.savedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(state));savedDates=new Set(Object.keys(state.days));}catch(err){if(day){if(previous===undefined)delete day.savedAt;else day.savedAt=previous;}storageBlocked=true;storageIssue='บันทึกไม่สำเร็จ พื้นที่อาจเต็มหรือเบราว์เซอร์จำกัดการบันทึก ส่งออก JSON เพื่อเก็บข้อมูลก่อนปิดหน้า';}}
  updateSaveStatus();
  if(storageBlocked){$('#saveState').textContent='ยังไม่ได้บันทึกถาวร';if(message)toast('ยังบันทึกในเครื่องไม่ได้ · ส่งออก JSON เพื่อสำรอง');}else if(message)toast(message);
 }
 const savedTime=value=>new Date(value).toLocaleString('th-TH',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 function updateSaveStatus(){
  const day=state.days[date],saved=savedDates.has(date);
  $('#saveState').textContent=storageBlocked?'ยังไม่ได้บันทึกถาวร':saved?'บันทึกแล้วในเครื่อง':'บันทึกอัตโนมัติ';
  $('#dailySaveStatus').textContent=storageBlocked?'ยังไม่ได้บันทึกถาวร · ส่งออก JSON เพื่อสำรองข้อมูล':saved?(day.savedAt?'บันทึกล่าสุด '+savedTime(day.savedAt):'บันทึกเดิมในเครื่อง · ไม่ทราบเวลาบันทึก'):'ยังไม่มีบันทึกของวันที่เลือก · กดบันทึกเพื่อเก็บวันนี้';
  $('#dailySaveDate').textContent=thaiDate(date);
 }
/* @include src/pages/08_history/page.js */
 const btn=(text,action,style='soft',extra='')=>`<button class="btn ${style}" data-action="${action}" ${extra}>${text}</button>`;
 const notice=(text,kind='')=>`<div class="notice ${kind}">${icon('info')}<div>${text}</div></div>`;
 function ring(w){const ref=state.settings.waterReference,percent=ref?Math.min(100,w.ml/ref*100):0;return `<div class="ring" role="img" aria-label="ดื่มแล้ว ${litres(w.ml)} ลิตร${ref?' เทียบแผนอ้างอิง '+litres(ref)+' ลิตร':''}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="51"/><circle class="fill" cx="60" cy="60" r="51" stroke-dasharray="${percent*3.2044} 320.44"/></svg><div class="ring-number"><strong>${litres(w.ml)}</strong><span>ลิตรที่ดื่มแล้ว</span></div></div>`;}
 function waterSummary(){const w=stats();return `<div class="water-summary">${ring(w)}<div class="water-detail"><h3>${n(w.count)} แก้วแล้ววันนี้</h3><p>จากรายการ ${d().waterPlan.length} แก้ว<br>ปริมาณตามรายการ ${litres(w.planned)} ลิตร</p><span class="badge">${state.settings.waterReference?'ตั้งเอง '+litres(state.settings.waterReference)+' ลิตร':'ปิดค่าอ้างอิงแล้ว'}</span></div></div>`;}
 const empty=(title,text,action,label)=>`<div class="empty">${icon('leaf')}<h3>${title}</h3><p>${text}</p>${action?btn(label,action,'primary'):''}</div>`;
 function miniWater(){return `<div class="mini-slots">${d().waterPlan.map(x=>`<button class="mini-slot" data-action="water-toggle" data-id="${e(x.id)}" aria-pressed="${d().water.includes(x.id)}" aria-label="น้ำ ${x.time} ${x.ml} มิลลิลิตร">${d().water.includes(x.id)?icon('check'):icon('water')}${e(x.time)}</button>`).join('')}</div>`;}
 function weekChart(){const dow=new Date(date+'T12:00:00').getDay(),start=shift(date,-((dow+6)%7));const data=Array.from({length:7},(_,i)=>{const t=shift(start,i);const day=state.days[t];return {t,ml:day?day.waterPlan.filter(x=>day.water.includes(x.id)).reduce((a,x)=>a+x.ml,0):0};});const max=Math.max(3300,...data.map(x=>x.ml));return `<div class="week-chart" aria-label="น้ำที่บันทึกใน 7 วัน">${data.map((x,i)=>`<button class="chart-col ${x.t===date?'current':''}" data-action="select-date" data-date="${x.t}" aria-label="${thaiDate(x.t)} ${litres(x.ml)} ลิตร"><small>${litres(x.ml)}</small><div class="bar-track"><span class="bar" style="height:${x.ml/max*100}%"></span></div><span class="chart-label day-label">${['จ.','อ.','พ.','พฤ.','ศ.','ส.','อา.'][i]}</span></button>`).join('')}</div>`;}
/* @include src/pages/01_dashboard/page.js */
/* @include src/pages/03_water/page.js */
/* @include src/pages/04_schedule/page.js */
/* @include src/pages/06_meals/page.js */
/* @include src/pages/05_workout/page.js */
/* @include src/pages/07_self_care/page.js */
/* @include src/pages/09_settings/page.js */
 function enhanceNumberInputs(){
  document.querySelectorAll('input[type="number"]').forEach(input=>{
   if(input.closest('.number-control'))return;
   const label=input.getAttribute('aria-label')||input.labels?.[0]?.querySelector('span:not(.body-input-icon)')?.textContent.trim()||input.name||'ตัวเลข';
   if(!input.hasAttribute('aria-label')&&!input.hasAttribute('aria-labelledby'))input.setAttribute('aria-label',label);
   const group=document.createElement('number-field');group.className='number-control';
   const button=(direction,text)=>{const b=document.createElement('button');b.type='button';b.className='number-step';b.dataset.numberStep=direction;b.textContent=text;b.setAttribute('aria-label',(direction<0?'ลด ':'เพิ่ม ')+label);b.disabled=input.disabled||input.readOnly;return b;};
   input.before(group);group.append(button(-1,'−'),input,button(1,'+'));
  });
 }
 document.addEventListener('click',ev=>{
  const button=ev.target.closest('[data-number-step]');if(!button)return;
  ev.preventDefault();
  const input=button.closest('.number-control').querySelector('input');
  if(input.matches(':disabled')||input.readOnly)return;
  const previous=input.value,direction=Number(button.dataset.numberStep);
  if(input.step==='any'){
   const min=input.min===''?-Infinity:Number(input.min),max=input.max===''?Infinity:Number(input.max);
   input.value=String(Math.min(max,Math.max(min,(input.valueAsNumber||0)+direction)));
  }else if(direction>0)input.stepUp();else input.stepDown();
  input.focus({preventScroll:true});
  if(input.value!==previous){input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
 });
 const numberObserver=new MutationObserver(enhanceNumberInputs);
 numberObserver.observe(document.body,{childList:true,subtree:true});

 let calendarMonth=date.slice(0,7),calendarCursor=date;
 const calendarLocale=()=>window.JaiI18n?.getLanguage()==='en'?'en-GB':'th-TH';
 const calendarText=(th,en)=>window.JaiI18n?.getLanguage()==='en'?en:th;
 function updateHeaderDate(){
  const button=$('#datePickerButton');button.innerHTML=icon('schedule')+'<span>'+e(new Date(date+'T12:00:00').toLocaleDateString(calendarLocale(),{day:'numeric',month:'short',year:'numeric'}))+'</span>';
  button.setAttribute('aria-label',calendarText('เลือกวันที่','Choose date')+' '+new Date(date+'T12:00:00').toLocaleDateString(calendarLocale(),{dateStyle:'full'}));
  $('#prevDate').disabled=date<='2000-01-01';$('#nextDate').disabled=date>='2100-12-31';
 }
 function renderCalendar(){
  const [year,monthNumber]=calendarMonth.split('-').map(Number),month=monthNumber-1,first=calendarMonth+'-01',offset=(new Date(first+'T12:00:00').getDay()+6)%7,today=localDate(),locale=calendarLocale();
  const monthOptions=Array.from({length:12},(_,i)=>'<option value="'+i+'" '+(i===month?'selected':'')+'>'+e(new Date(2026,i,1).toLocaleDateString(locale,{month:'long'}))+'</option>').join('');
  const yearOptions=Array.from({length:101},(_,i)=>{const y=2000+i;return '<option value="'+y+'" '+(y===year?'selected':'')+'>'+new Date(y,0,1).toLocaleDateString(locale,{year:'numeric'})+'</option>';}).join('');
  const weekdays=Array.from({length:7},(_,i)=>'<span>'+e(new Date(2026,0,5+i).toLocaleDateString(locale,{weekday:'short'}))+'</span>').join('');
  const days=Array.from({length:42},(_,i)=>{const iso=shift(first,i-offset),outside=iso.slice(0,7)!==calendarMonth,disabled=iso<'2000-01-01'||iso>'2100-12-31';return '<button type="button" data-calendar-date="'+iso+'" class="calendar-day '+(outside?'outside ':'')+(iso===date?'selected ':'')+(iso===today?'today':'')+'" '+(disabled?'disabled':'')+' tabindex="'+(iso===calendarCursor?'0':'-1')+'" aria-pressed="'+(iso===date)+'" '+(iso===today?'aria-current="date"':'')+' aria-label="'+e(new Date(iso+'T12:00:00').toLocaleDateString(locale,{dateStyle:'full'}))+'">'+Number(iso.slice(-2))+'</button>';}).join('');
  $('#datePicker').innerHTML='<div class="calendar-heading"><button type="button" class="calendar-arrow" data-calendar-month="-1" aria-label="'+calendarText('เดือนก่อนหน้า','Previous month')+'" '+(calendarMonth==='2000-01'?'disabled':'')+'>‹</button><select id="calendarMonth" aria-label="'+calendarText('เลือกเดือน','Choose month')+'">'+monthOptions+'</select><select id="calendarYear" aria-label="'+calendarText('เลือกปี','Choose year')+'">'+yearOptions+'</select><button type="button" class="calendar-arrow" data-calendar-month="1" aria-label="'+calendarText('เดือนถัดไป','Next month')+'" '+(calendarMonth==='2100-12'?'disabled':'')+'>›</button></div><div class="calendar-weekdays" aria-hidden="true">'+weekdays+'</div><div class="calendar-days" role="group" aria-label="'+calendarText('เลือกวัน','Choose day')+'">'+days+'</div><footer class="calendar-footer"><button type="button" class="btn soft" data-calendar-today>'+calendarText('วันนี้','Today')+'</button><button type="button" class="calendar-close" data-calendar-close>'+calendarText('ปิด','Close')+'</button></footer>';
  $('#datePicker').setAttribute('aria-label',calendarText('เลือกวันที่','Choose date'));
 }
 function closeCalendar(focus=true){const picker=$('#datePicker');picker.dataset.open='false';if(picker.hidePopover&&picker.matches(':popover-open'))picker.hidePopover();$('#datePickerButton').setAttribute('aria-expanded','false');if(focus)$('#datePickerButton').focus({preventScroll:true});}
 function openCalendar(){
  const picker=$('#datePicker');if(picker.dataset.open==='true'){closeCalendar();return;}
  calendarMonth=date.slice(0,7);calendarCursor=date;renderCalendar();picker.dataset.open='true';if(picker.showPopover)picker.showPopover();$('#datePickerButton').setAttribute('aria-expanded','true');
  const box=$('#datePickerButton').getBoundingClientRect(),width=picker.offsetWidth||336,height=picker.offsetHeight||400;
  picker.style.left=Math.max(12,Math.min(box.left,innerWidth-width-12))+'px';picker.style.top=Math.max(12,Math.min(box.bottom+10,innerHeight-height-12))+'px';
  picker.querySelector('[data-calendar-date="'+date+'"]')?.focus({preventScroll:true});
 }
 function shiftCalendarMonth(delta){const [y,m]=calendarMonth.split('-').map(Number),target=new Date(y,m-1+delta,1,12);if(target.getFullYear()<2000||target.getFullYear()>2100)return;calendarMonth=target.getFullYear()+'-'+String(target.getMonth()+1).padStart(2,'0');calendarCursor=calendarMonth+'-01';renderCalendar();}
 function syncHeaderLayout(){const mobile=matchMedia('(max-width:900px)').matches;$('#mobileHeader').hidden=!mobile;(mobile?$('#mobileHeader'):$('#sidebar .side-bottom')).append($('.header-actions'));closeCalendar(false);}
 $('#datePickerButton').addEventListener('click',openCalendar);
 $('#datePicker').addEventListener('toggle',event=>{if(event.newState==='closed'){$('#datePicker').dataset.open='false';$('#datePickerButton').setAttribute('aria-expanded','false');}});
 $('#datePicker').addEventListener('click',event=>{const day=event.target.closest('[data-calendar-date]'),month=event.target.closest('[data-calendar-month]');if(day&&!day.disabled){closeCalendar(false);selectDate(day.dataset.calendarDate);$('#datePickerButton').focus({preventScroll:true});}else if(month){shiftCalendarMonth(Number(month.dataset.calendarMonth));}else if(event.target.closest('[data-calendar-today]')){closeCalendar(false);selectDate(localDate());$('#datePickerButton').focus({preventScroll:true});}else if(event.target.closest('[data-calendar-close]'))closeCalendar();});
 $('#datePicker').addEventListener('change',event=>{if(!['calendarMonth','calendarYear'].includes(event.target.id))return;const focus=event.target.id;calendarMonth=$('#calendarYear').value+'-'+String(Number($('#calendarMonth').value)+1).padStart(2,'0');calendarCursor=calendarMonth+'-01';renderCalendar();$('#'+focus).focus({preventScroll:true});});
 $('#datePicker').addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeCalendar();return;}const day=event.target.closest('[data-calendar-date]');if(!day)return;const moves={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};let next;if(Object.hasOwn(moves,event.key))next=shift(day.dataset.calendarDate,moves[event.key]);else if(event.key==='Home'||event.key==='End'){const dow=(new Date(day.dataset.calendarDate+'T12:00:00').getDay()+6)%7;next=shift(day.dataset.calendarDate,event.key==='Home'?-dow:6-dow);}else if(event.key==='PageUp'||event.key==='PageDown'){event.preventDefault();shiftCalendarMonth(event.key==='PageUp'?-1:1);$('#datePicker').querySelector('[data-calendar-date="'+calendarCursor+'"]')?.focus();return;}else return;event.preventDefault();if(next<'2000-01-01'||next>'2100-12-31')return;calendarCursor=next;calendarMonth=next.slice(0,7);renderCalendar();$('#datePicker').querySelector('[data-calendar-date="'+next+'"]')?.focus({preventScroll:true});});
 document.addEventListener('click',event=>{if($('#datePicker').dataset.open==='true'&&!event.target.closest('#datePicker,#datePickerButton'))closeCalendar(false);});
 document.addEventListener('your-day-language',()=>{updateHeaderDate();if($('#datePicker').dataset.open==='true')renderCalendar();});
 window.addEventListener('resize',()=>{if($('#datePicker').dataset.open==='true')closeCalendar(false);});
 function render(){
  const previousPanel=$('.overview-panel-content'),panelScroll=previousPanel?.scrollTop||0,panelTopic=previousPanel?.dataset.topic;
  document.body.classList.toggle('overview-view',page!=='account');
  $('#selectedDate').value=date;$('#pageTitle').textContent=routes[page][1];$('#pageSubtitle').textContent=routes[page][2];$('#breadcrumb').textContent=routes[page][0];$('#eyebrow').textContent=page==='dashboard'?'YOUR EVERYDAY, A LITTLE BETTER':'YOUR DAY / '+page.toUpperCase();
  $('#navigation').innerHTML=Object.keys(routes).filter(k=>k!=='settings').map(k=>`<button class="nav-item ${k===page?'active':''}" data-page="${k}" ${k===page?'aria-current="page"':''}>${icon(k==='history'?'clock':k==='body'?'care':k)}${routes[k][0]}</button>`).join('');
  $('#settingsNav').innerHTML=icon('settings')+'ตั้งค่า';$('#settingsNav').classList.toggle('active',page==='settings');$('#settingsNav').setAttribute('aria-current',page==='settings'?'page':'false');
  const html={dashboard,body:()=>window.JaiBody.render(state.settings.body,!storageBlocked),water:waterPage,schedule:schedulePage,workout:workoutPage,meals:mealsPage,care:carePage,settings:settingsPage,history:dailyHistory}[page]();
  $('#content').innerHTML=(storageBlocked?`<div class="storage-banner">${notice(e(storageIssue)+' <button class="text-btn" data-page="settings">จัดการ / สำรองข้อมูล</button>','error')}</div>`:'')+(page==='dashboard'?html:dashboard(html+historySection()));
  if(panelTopic===page&&$('.overview-panel-content'))$('.overview-panel-content').scrollTop=panelScroll;
  $('#dailySave').hidden=page==='settings'||page==='history'||page==='body';$('.date-tools').hidden=false;if(page==='body')window.JaiBody.update($('#bodyForm'));updateSaveStatus();enhanceNumberInputs();window.JaiI18n?.apply();updateHeaderDate();
 }
 function historySection(){
  if(page==='care'){
   const records=d().careArchive||[];
   return records.length?`<section class="card" style="margin-top:24px"><div class="card-header"><div><h2>ประวัติรายการ</h2><p>รายการที่นำออกจากแผนแล้ว · เก็บบันทึกของวันที่เลือกไว้</p></div></div>${records.map(x=>careRow(x,false)).join('')}</section>`:'';
  }
  if(page==='workout'){
   const records=d().workoutArchive||[];
   return records.length?`<section class="card" style="margin-top:24px"><div class="card-header"><div><h2>ประวัติรายการ</h2><p>ท่าที่นำออกจากแผนแล้ว · เก็บบันทึกของวันที่เลือกไว้</p></div></div>${records.map(x=>`<div class="exercise-row"><button class="check-btn" data-action="workout-toggle" data-id="${e(x.id)}" aria-pressed="${d().workoutDone.includes(x.id)}" aria-label="ทำแล้ว ${e(x.name)}">${icon('check')}</button><div class="row-text"><h3 class="row-title">${e(x.name)}</h3><p class="row-note">กลุ่ม ${e(x.group)} · ${n(x.sets)} เซต · ${e(x.reps)} · ${e(x.note)}</p></div><span class="badge muted">นำออกจากแผนแล้ว</span></div>`).join('')}</section>`:'';
  }
  return '';
 }
 function navigate(p){if(!Object.hasOwn(routes,p))return;page=p;location.hash=p;closeNav();render();window.scrollTo({top:0,behavior:'instant'});($('#overviewTitle')||$('#main')).focus({preventScroll:true});}
 function selectDate(value){
  if(!C.validDate(value)||value<'2000-01-01'||value>'2100-12-31'){toast('เลือกวันที่ระหว่างปี 2000–2100');return;}
  const form=page==='body'?$('#bodyForm'):null;
  const fields=form?Array.from(form.elements).filter(field=>field.name):[];
  const draft=fields.map(field=>[field.name,field.value]);
  const dirty=fields.some(field=>field.value!==(field.tagName==='SELECT'?(Array.from(field.options).find(option=>option.defaultSelected)||field.options[0]).value:field.defaultValue));
  date=value;render();
  if(form){const next=$('#bodyForm');for(const [name,value] of draft)next.elements[name].value=value;window.JaiBody.update(next,dirty);window.JaiI18n?.apply();}
 }
 function closeNav(){document.body.classList.remove('nav-open');$('#scrim').hidden=true;const closed=matchMedia('(max-width:900px)').matches||document.body.classList.contains('nav-collapsed');$('#menuButton').setAttribute('aria-expanded',String(!closed));$('#sidebar').inert=closed;}
 function toggleNav(){if(matchMedia('(max-width:900px)').matches){const open=!document.body.classList.contains('nav-open');document.body.classList.toggle('nav-open',open);$('#scrim').hidden=!open;$('#sidebar').inert=!open;$('#menuButton').setAttribute('aria-expanded',String(open));if(open)$('#closeNav').focus();else $('#menuButton').focus();}else{document.body.classList.toggle('nav-collapsed');const open=!document.body.classList.contains('nav-collapsed');$('#menuButton').setAttribute('aria-expanded',String(open));$('#sidebar').inert=!open;}}
 const toggle=(a,id)=>a.includes(id)?a.filter(x=>x!==id):[...a,id];
 function download(raw,name){const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function statusOptions(value){return Object.entries(C.statuses).map(([k,v])=>`<option value="${k}" ${k===value?'selected':''}>${v}</option>`).join('');}
 function field(label,name,value='',type='text',extra='',hint=''){return `<label class="field"><span>${label}</span><input name="${e(name)}" type="${type}" value="${e(value)}" ${extra}>${hint?`<small>${hint}</small>`:''}</label>`;}
 function textField(label,name,value='',max=2000){return `<label class="field"><span>${label}</span><textarea name="${e(name)}" maxlength="${max}">${e(value)}</textarea></label>`;}
 function openEditor(type,id,category,draft){
  deleteArmed=false;let x,fields='',title='',deletable=false;editor={type,id,category,date};
  if(type==='water'){x=d().waterPlan.find(x=>x.id===id)||{time:'12:00',ml:300};title=id?'แก้ไขแก้วน้ำ':'เพิ่มแก้วน้ำ';fields=field('เวลา','time',x.time,'time','required')+field('ปริมาณ (มล.)','ml',x.ml,'number','required min="1" max="10000" step="1"')+'<p class="small muted">แก้ไขเฉพาะวันที่ '+thaiDate(date)+'</p>';deletable=!!id;}
  if(type==='schedule'){x=d().schedule.find(x=>x.id===id)||{time:'',title:'',status:'pending',note:''};title=id?'แก้ไขกิจกรรม':'เพิ่มกิจกรรม';fields=field('ชื่อกิจกรรม','title',x.title,'text','required maxlength="200"')+field('เวลาเริ่ม (เว้นว่างได้)','time',x.time,'time')+`<label class="field"><span>สถานะ</span><select name="status">${statusOptions(x.status)}</select></label>`+textField('ช่วงเวลา / รายละเอียด / สิ่งที่ยังไม่ยืนยัน','note',x.note);deletable=!!id;}
  if(type==='meal'){x=draft||d().meals.find(x=>x.id===id)||{name:'',meal:'',note:'',estimated:true};editor.source=x.source||'manual';title=id?'แก้ไขอาหาร':editor.source==='photo-ai'?'ตรวจผลวิเคราะห์ก่อนบันทึก':'เพิ่มอาหาร';fields=field('ชื่ออาหาร / เครื่องดื่ม','name',x.name,'text','required maxlength="200"')+field('มื้อ เช่น เช้า กลางวัน เย็น ของว่าง','meal',x.meal,'text','required maxlength="100"')+field('เวลาที่กินจริง (เว้นว่างได้)','time',x.time||'','time')+field('ปริมาณที่กิน','portion',x.portion||'','text','maxlength="200"')+notice('บันทึกลง '+thaiDate(date)+(editor.source==='photo-ai'?' · ผล AI เป็นประมาณการ ตรวจแก้ค่าก่อนบันทึก':''))+'<div class="form-grid">'+[['kcal','พลังงาน (kcal)'],['protein','โปรตีน (กรัม)'],['carbs','คาร์บ (กรัม)'],['fat','ไขมัน (กรัม)'],['fiber','ใยอาหาร (กรัม)'],['sodium','โซเดียม (มก.)']].map(([k,l])=>field(l,k,x[k]??'','number','min="0" max="100000" step="0.1"')).join('')+'</div><p class="small muted">เว้นว่าง = ไม่ทราบ · ใส่ 0 เฉพาะเมื่อทราบว่าเป็นศูนย์</p>'+`<label class="check-field"><input type="checkbox" name="estimated" ${x.estimated?'checked':''}>เป็นค่าประมาณ</label>`+textField('แหล่งข้อมูล / หมายเหตุ / ช่วงประมาณ','note',x.note);deletable=!!id;}
  if(type==='exercise'){const w=C.workoutFor(state,date);editor.group=w.group;x=w.exercises.find(x=>x.id===id)||{name:'',sets:3,reps:'',note:''};title=id?'แก้ไขท่า / กิจกรรม':'เพิ่มท่า / กิจกรรม';fields=notice('ใช้กับกลุ่ม '+w.group+' ทุกสัปดาห์ การทำแล้วบันทึกแยกวัน')+field('ชื่อท่า / กิจกรรม','name',x.name,'text','required maxlength="200"')+field('จำนวนเซต','sets',x.sets,'number','required min="1" max="100" step="1"')+field('จำนวนครั้ง / ระยะเวลา / ตามความพร้อม','reps',x.reps,'text','maxlength="200"')+textField('หมายเหตุ','note',x.note);deletable=!!id;}
  if(type==='care'){x=state.care.find(x=>x.id===id)||{title:'',category:'self',period:category||'morning',note:''};title=id?'แก้ไขเช็กลิสต์':'เพิ่มเช็กลิสต์';fields=field('ชื่อรายการ','title',x.title,'text','required maxlength="200"')+`<label class="field"><span>ช่วงเวลาดูแลตัวเอง</span><select name="period">${[['morning','ตอนเช้า'],['afternoon','ตอนบ่าย'],['','ยังไม่เลือกช่วงเวลา']].map(([k,label])=>`<option value="${k}" ${(x.period||'')===k?'selected':''}>${label}</option>`).join('')}</select></label>`+textField('รายละเอียด / สถานะที่ยังไม่ยืนยัน','note',x.note)+notice('แก้รายการมีผลทุกวัน การทำแล้วบันทึกแยกตามวัน');deletable=!!id;}
  if(type==='phase'){title='แก้ไขช่วงเวลาออกกำลังกาย';fields=state.phases.map(x=>field(e(x.name)+' (นาที)',x.id,x.minutes,'number','required min="0" max="500" step="1"')).join('')+notice('เปลี่ยนการแบ่งเวลาของแผนเวททุกวัน รวมเวลาอาจต่างจากช่วง 16:30–18:00');}
  if(type==='plan'){title='แผนประจำ'+['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'][new Date(date+'T12:00:00').getDay()];fields=`<label class="field"><span>กลุ่มกิจกรรม</span><select name="group">${[['A','กลุ่ม A · อก ไหล่ หน้าท้อง'],['B','กลุ่ม B · หลัง แขน ขา'],['rest','พัก'],['active','Active recovery']].map(([k,v])=>`<option value="${k}" ${C.workoutFor(state,date).group===k?'selected':''}>${v}</option>`).join('')}</select></label>`+notice('มีผลกับวันเดียวกันของสัปดาห์ทั้งหมด บันทึกการทำแล้วเดิมยังอยู่');}
  if(type==='copy'){title='คัดลอกตารางจากวันที่อื่น';fields=field('วันที่ต้นทาง','source',date==='2026-10-19'?shift(date,-1):'2026-10-19','date','required min="2000-01-01" max="2100-12-31"')+notice('เพิ่มกิจกรรมจากต้นทางต่อท้ายตารางวันนี้ โดยเริ่มสถานะเป็น “ยังไม่ทำ” ทั้งหมด ไม่คัดลอกสถานะทำแล้ว');}
  if(type==='reset'){title='ยืนยันคืนข้อมูลเริ่มต้น';fields=notice('ข้อมูลปัจจุบันทั้งหมดในแอปนี้จะถูกแทนที่ รวมประวัติทุกวัน แนะนำให้ส่งออก JSON ก่อน','warning')+`<label class="check-field"><input name="confirm" type="checkbox" required>ฉันสำรองแล้ว / ต้องการเริ่มใหม่</label>`;}
  if(type==='import'){title='ตรวจแล้ว · พร้อมนำเข้า';fields=notice(`พบข้อมูล ${Object.keys(editorImport.days).length} วัน · แผนน้ำเริ่มต้น ${editorImport.water.length} รายการ<br>การนำเข้าจะแทนที่ข้อมูลทั้งหมดในเครื่องนี้`,'warning')+`<label class="check-field"><input name="confirm" type="checkbox" required>ยืนยันแทนที่ข้อมูลปัจจุบัน</label>`;}
  $('#editorTitle').textContent=title;$('#editorFields').innerHTML=fields;$('#formError').textContent='';$('#deleteItem').hidden=!deletable;$('#deleteItem').textContent='ลบรายการ';enhanceNumberInputs();window.JaiI18n?.apply();$('#editor').showModal();
 }
 let editorImport=null;
 function upsert(list,value){const at=list.findIndex(x=>x.id===value.id);if(at<0)list.push(value);else list[at]=value;}
 function closeEditor(){if($('#editor').open)$('#editor').close();editor=null;editorImport=null;}
 function submitEditor(ev){ev.preventDefault();if(!editor)return;const f=new FormData($('#editorForm')),v=k=>String(f.get(k)??'').trim(),number=k=>v(k)===''?null:Number(v(k)),type=editor.type,id=editor.id||C.uid(),previous=C.clone(state);
  try{
   for(const input of $('#editorForm').querySelectorAll('input[type="text"][required]'))if(!input.value.trim())throw Error('กรอกชื่อรายการก่อนบันทึก');
   if(type==='water'){upsert(d().waterPlan,{id,time:v('time'),ml:Number(v('ml'))});d().waterPlan.sort((a,b)=>a.time.localeCompare(b.time));}
   if(type==='schedule'){upsert(d().schedule,{id,time:v('time'),title:v('title'),status:v('status'),note:v('note')});d().schedule.sort((a,b)=>(a.time||'00:00').localeCompare(b.time||'00:00'));}
   if(type==='meal')upsert(d().meals,{id,name:v('name'),meal:v('meal'),kcal:number('kcal'),protein:number('protein'),carbs:number('carbs'),fat:number('fat'),fiber:number('fiber'),sodium:number('sodium'),time:v('time'),portion:v('portion'),source:editor.source,estimated:editor.source==='photo-ai'||f.has('estimated'),note:v('note')});
   if(type==='exercise')upsert(state.workouts[editor.group].exercises,{id,name:v('name'),sets:Number(v('sets')),reps:v('reps'),note:v('note')});
   if(type==='care'){const item={id,title:v('title'),category:'self',note:v('note')};if(v('period'))item.period=v('period');upsert(state.care,item);}
   if(type==='phase')state.phases.forEach(x=>x.minutes=Number(v(x.id)));
   if(type==='plan')state.week[new Date(date+'T12:00:00').getDay()]=v('group');
   if(type==='copy'){if(v('source')===date)throw Error('เลือกวันที่อื่นเพื่อคัดลอก');const source=state.days[v('source')];if(!source?.schedule.length)throw Error('วันที่ต้นทางยังไม่มีตาราง');d().schedule.push(...source.schedule.map(x=>({...x,id:C.uid(),status:'pending'})));d().schedule.sort((a,b)=>(a.time||'00:00').localeCompare(b.time||'00:00'));}
   if(type==='reset'){state=C.createState();storageBlocked=false;storageIssue='';rawBackup=null;}
   if(type==='import'){state=C.clone(editorImport);storageBlocked=false;storageIssue='';rawBackup=null;}
   C.validate(state);save('บันทึกแล้ว',type!=='import'&&type!=='reset');closeEditor();render();
  }catch(err){state=previous;$('#formError').textContent=err.message;}
 }
 function deleteCurrent(){if(!editor)return;if(!deleteArmed){deleteArmed=true;$('#deleteItem').textContent='กดอีกครั้งเพื่อยืนยันลบ';return;}const {type,id,group}=editor;
  if(type==='water'){d().waterPlan=d().waterPlan.filter(x=>x.id!==id);d().water=d().water.filter(x=>x!==id);}
  if(type==='schedule')d().schedule=d().schedule.filter(x=>x.id!==id);
  if(type==='meal')d().meals=d().meals.filter(x=>x.id!==id);
  if(type==='exercise'){const item=state.workouts[group].exercises.find(x=>x.id===id);for(const day of Object.values(state.days))if(day.workoutDone.includes(group+'-'+id)){day.workoutArchive??=[];upsert(day.workoutArchive,{...C.clone(item),id:group+'-'+id,group});}state.workouts[group].exercises=state.workouts[group].exercises.filter(x=>x.id!==id);}
  if(type==='care'){const item=state.care.find(x=>x.id===id);for(const day of Object.values(state.days))if(day.care.includes(id)){day.careArchive??=[];upsert(day.careArchive,C.clone(item));}state.care=state.care.filter(x=>x.id!==id);}
  save('ลบรายการแล้ว');closeEditor();render();
 }
 document.addEventListener('click',ev=>{
  const p=ev.target.closest('[data-page]');if(p){navigate(p.dataset.page);return;}
  if(ev.target.closest('[data-close]')){closeEditor();return;}
  const b=ev.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
  const focusKey={action:a,id};let changed=false;
  if(a==='day-save'){save('บันทึก '+thaiDate(date)+' แล้ว');render();return;}
  if(a==='open-day'){selectDate(b.dataset.date);navigate('dashboard');return;}
  if(a==='history-more'){historyLimit+=20;render();return;}
  if(a==='history-clear'){historyMonth='';historyLimit=20;render();return;}
  if(a==='water-toggle'){d().water=toggle(d().water,id);changed=true;}
  if(a==='care-toggle'){d().care=toggle(d().care,id);changed=true;}
  if(a==='workout-toggle'){d().workoutDone=toggle(d().workoutDone,id);changed=true;}
  for(const [prefix,type] of [['water','water'],['schedule','schedule'],['meal','meal'],['exercise','exercise'],['care','care']])if(a===prefix+'-add'||a===prefix+'-edit'){openEditor(type,id,b.dataset.category);return;}
  if(a==='phase-edit')openEditor('phase');if(a==='workout-plan')openEditor('plan');if(a==='schedule-copy')openEditor('copy');if(a==='reset')openEditor('reset');
  if(a==='select-date')selectDate(b.dataset.date);if(a==='seed-date'){date='2026-10-19';navigate('dashboard');}
  if(a==='water-default'){state.water=C.clone(d().waterPlan);save('ใช้แผนนี้กับวันที่ยังไม่เคยเปิดแล้ว');}
  if(a==='care-note'){d().careNote=$('#careNote').value;save('บันทึกข้อความแล้ว');}
  if(a==='export')download(JSON.stringify(state,null,2),'jai-daily-'+localDate()+'.json');
  if(a==='raw-export')download(rawBackup,'jai-daily-original-backup.json');
  if(a==='reload-data'){try{state=C.parseImport(localStorage.getItem(KEY));savedDates=new Set(Object.keys(state.days));storageBlocked=false;render();}catch{toast('ยังอ่านข้อมูลใหม่ไม่ได้');}}
  if(changed){save();render();toast(storageBlocked?'ยังบันทึกในเครื่องไม่ได้ · ส่งออก JSON เพื่อสำรอง':a==='water-toggle'?`บันทึกน้ำ ${litres(stats().ml)} ลิตร · ${stats().count} แก้ว`:'บันทึกสถานะแล้ว');const target=[...document.querySelectorAll('[data-action]')].find(x=>x.dataset.action===focusKey.action&&x.dataset.id===focusKey.id);target?.focus({preventScroll:true});}
 });
 function saveHydration(form,confirm=false){const h=window.JaiHydration.update(form,state.settings.body,stats().ml);if(!h)return false;d().hydration=h;save(confirm?'บันทึกข้อมูลน้ำวันนี้แล้ว':undefined);$('#hydrationSaveStatus').textContent=storageBlocked?'ยังบันทึกถาวรไม่ได้ กรุณาส่งออก JSON เพื่อสำรอง':'บันทึกข้อมูลน้ำของวันที่เลือกแล้ว';return true;}
 document.addEventListener('input',ev=>{const hydrationForm=ev.target.closest('#hydrationForm');if(hydrationForm)saveHydration(hydrationForm);const bodyForm=ev.target.closest('#bodyForm');if(bodyForm)window.JaiBody.update(bodyForm,true);if(ev.target.id==='careNote'){d().careNote=ev.target.value;save();}});
 document.addEventListener('change',async ev=>{
  if(ev.target.id==='historyMonth'){historyMonth=ev.target.value;historyLimit=20;render();$('#historyMonth').focus();}
  if(ev.target.matches('[data-status-id]')){const id=ev.target.dataset.statusId;d().schedule.find(x=>x.id===id).status=ev.target.value;save('บันทึกสถานะแล้ว');render();[...document.querySelectorAll('[data-status-id]')].find(x=>x.dataset.statusId===id)?.focus({preventScroll:true});}
  if(ev.target.id==='importFile'){
   try{const file=ev.target.files[0];if(!file)return;if(file.size>5000000)throw Error('ไฟล์ใหญ่เกิน 5 MB');editorImport=C.parseImport(await file.text());openEditor('import');}catch(err){toast('นำเข้าไม่ได้: '+err.message);}finally{ev.target.value='';}
  }
 });
 document.addEventListener('submit',ev=>{if(ev.target.id==='hydrationForm'){ev.preventDefault();if(saveHydration(ev.target,true))render();return;}if(ev.target.id==='bodyForm'){ev.preventDefault();const calculated=window.JaiBody.update(ev.target);if(!calculated){ev.target.reportValidity();return;}state.settings.body=calculated.profile;save('บันทึกข้อมูลร่างกายแล้ว',false);render();return;}if(ev.target.id!=='settingsForm')return;ev.preventDefault();const f=new FormData(ev.target);state.settings.name=String(f.get('name')).trim()||'คุณ';state.settings.waterReference=Number(f.get('waterReference'));save('บันทึกการตั้งค่าแล้ว');render();});
 $('#editorForm').addEventListener('submit',submitEditor);$('#deleteItem').addEventListener('click',deleteCurrent);$('#editor').addEventListener('cancel',()=>{editor=null;editorImport=null;});
 $('#menuButton').innerHTML=icon('menu');$('#menuButton').addEventListener('click',toggleNav);$('#closeNav').addEventListener('click',()=>{closeNav();$('#menuButton').focus();});$('#scrim').addEventListener('click',closeNav);
 $('#selectedDate').addEventListener('change',ev=>selectDate(ev.target.value));$('#prevDate').addEventListener('click',()=>selectDate(shift(date,-1)));$('#nextDate').addEventListener('click',()=>selectDate(shift(date,1)));$('#today').addEventListener('click',()=>selectDate(localDate()));
 window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(Object.hasOwn(routes,next)&&next!==page){page=next;render();closeNav();}});
 const mq=matchMedia('(max-width:900px)');mq.addEventListener('change',()=>{syncHeaderLayout();document.body.classList.remove('nav-collapsed');closeNav();$('#sidebar').inert=mq.matches;$('#menuButton').setAttribute('aria-expanded',String(!mq.matches));});
 document.addEventListener('keydown',ev=>{if(!document.body.classList.contains('nav-open'))return;if(ev.key==='Escape'){closeNav();$('#menuButton').focus();}if(ev.key==='Tab'){const items=[...$('#sidebar').querySelectorAll('button')].filter(x=>x.getClientRects().length);if(ev.shiftKey&&document.activeElement===items[0]){ev.preventDefault();items.at(-1).focus();}else if(!ev.shiftKey&&document.activeElement===items.at(-1)){ev.preventDefault();items[0].focus();}}});
 window.addEventListener('storage',ev=>{if(ev.key===KEY){storageBlocked=true;storageIssue='ข้อมูลถูกเปลี่ยนจากอีกแท็บ กรุณาส่งออกงานในแท็บนี้ก่อน แล้วรีเฟรชหน้าเพื่อใช้ข้อมูลล่าสุด';render();}});
 window.JaiFood.init({getDate:()=>date,openSettings:()=>navigate('settings'),onReview:(draft,targetDate)=>{selectDate(targetDate);navigate('meals');openEditor('meal',undefined,undefined,draft);}});
 syncHeaderLayout();closeNav();$('#sidebar').inert=mq.matches;$('#menuButton').setAttribute('aria-expanded',String(!mq.matches));render();
})();
