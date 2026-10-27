 function dashboard(panel=''){
  const w=stats(),day=d(),nutrition=C.nutrition(day.meals),work=C.workoutFor(state,date);
  const done=day.schedule.filter(x=>x.status==='done').length;
  const exercised=work.exercises.filter(x=>day.workoutDone.includes(work.group+'-'+x.id)).length;
  const body=state.settings.body;
  const topics=[
   ['body','leaf','ข้อมูลร่างกาย',body?.weight&&body?.height?`${n(body.weight)} กก. · ${n(body.height)} ซม.`:'รู้จักร่างกาย · BMI และพลังงาน'],
   ['water','water','บันทึกการดื่มน้ำ',`${litres(w.ml)} ลิตร · ${w.count} แก้ววันนี้`],
   ['schedule','schedule','ตารางชีวิตรายวัน',`${done} / ${day.schedule.length} รายการที่ทำแล้ว`],
   ['workout','workout','ออกกำลังกาย',`${exercised} / ${work.exercises.length} ท่าที่ทำแล้ว`],
   ['meals','meals','อาหาร / สารอาหาร',`${day.meals.length} มื้อ · ${n(nutrition.kcal.value)} kcal โดยประมาณ${nutrition.kcal.missing?' *':''}`],
   ['care','care','ดูแลตัวเอง',`${day.care.length} รายการที่ดูแลแล้ววันนี้`],
   ['history','clock','ประวัติรายวัน','ย้อนดูทุกวันที่คุณดูแลตัวเอง']
  ];
  return `<section class="overview-hero ${panel?'has-panel':''}" aria-labelledby="overviewTitle">${panel?`<section class="overview-panel" aria-labelledby="overviewTitle"><header class="overview-panel-header"><div><p class="eyebrow">YOUR DAY / ${e(page.toUpperCase())}</p><h1 id="overviewTitle" tabindex="-1">${e(routes[page][1])}</h1></div><button class="icon-btn" data-page="dashboard" aria-label="กลับภาพรวม">${icon('close')}</button></header><div class="overview-panel-content" data-topic="${e(page)}" tabindex="0" role="region" aria-label="${e(routes[page][0])}">${panel}</div></section>`:`<div class="overview-copy"><p class="eyebrow">YOUR DAY, YOUR GROWTH</p><h1 id="overviewTitle" tabindex="-1">ดูแลตัวเองวันนี้<br><span>เติบโตในแบบคุณ</span></h1><p class="overview-description">พื้นที่เล็ก ๆ ของ${e(state.settings.name)}<br>ใส่ใจร่างกาย เติมพลังให้ชีวิต<br>ค่อย ๆ สร้างวันดี ๆ ในจังหวะของคุณ</p><button class="btn primary overview-start" data-page="body">เริ่มดูแลตัวเอง ${icon('arrow')}</button><div class="overview-stats" aria-label="สรุปวันที่เลือก"><div><strong>${litres(w.ml)}<small> ลิตร</small></strong><span>น้ำที่ดื่มแล้ว</span></div><div><strong>${done}<small> / ${day.schedule.length}</small></strong><span>กิจกรรมที่ทำแล้ว</span></div><div><strong>${day.meals.length}<small> มื้อ</small></strong><span>อาหารที่บันทึก</span></div><div><strong>${day.care.length}<small> รายการ</small></strong><span>ดูแลตัวเองแล้ว</span></div></div></div>`}<nav class="overview-topics" aria-label="หัวข้อดูแลตัวเอง">${topics.map(([route,symbol,title,note],i)=>`<button class="overview-topic overview-topic-${route}" data-page="${route}" ${page===route?'aria-current="page"':''}><span class="overview-topic-icon">${icon(symbol)}</span><span class="overview-topic-copy"><strong>${title}</strong><small>${e(note)}</small></span><span class="overview-topic-arrow" aria-hidden="true">→</span></button>`).join('')}</nav></section>`;
 }
