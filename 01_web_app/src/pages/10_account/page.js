 function accountPage(){
  const modes={login:'เข้าสู่ระบบ',signup:'สมัครบัญชี',recover:'ลืมรหัสผ่าน',password:'ตั้งรหัสผ่านใหม่'};
  const message=accountError?notice(e(accountError),'error'):'';
  if(accountUser&&accountMode!=='password'){
   const name=accountUser.user_metadata?.display_name||accountUser.user_metadata?.username||'บัญชีของคุณ';
   return `<section class="card account-card"><div class="account-emblem">${icon('account')}</div><h2>${e(name)}</h2><p>ข้อมูลกิจวัตรของคุณแยกจากผู้ใช้คนอื่น</p>${message}<p role="status">${e(accountStatusText())}</p><div class="actions">${btn('ลองเชื่อมต่อ / ซิงก์อีกครั้ง','account-retry','primary')}${accountStore?.state?btn('ส่งออกฉบับในเครื่อง','export'):''}${btn('ออกจากระบบ','account-logout')}${accountStatus==='session-expired'?btn('เข้าสู่ระบบอีกครั้ง','account-reauth'):''}</div>${accountStore?.ready?`<div class="setting-row"><h3>นำเข้าข้อมูลเดิมในเบราว์เซอร์นี้</h3><p>เลือกนำเข้าเองเมื่อพร้อม ข้อมูลบัญชีจะถูกแทนที่ด้วยข้อมูลเดิมในเครื่อง</p><label class="check-field"><input id="accountImportConfirm" type="checkbox">ฉันต้องการแทนที่ข้อมูลบัญชีด้วยข้อมูลเดิมในเครื่อง</label>${btn('นำเข้าข้อมูลเดิม','account-import')}</div>`:''}${accountStatus==='conflict'?`<div class="setting-row"><h3>ข้อมูลเปลี่ยนจากอีกเครื่อง</h3><p>ดาวน์โหลดฉบับนี้ไว้ก่อน แล้วโหลดข้อมูลล่าสุด ไม่มีการเขียนทับอัตโนมัติ</p>${btn('สำรองฉบับนี้ แล้วโหลดข้อมูลล่าสุด','account-remote','primary')}</div>`:''}</section>`;
  }
  if(!accountClient?.enabled())return `<section class="card account-card"><div class="account-emblem">${icon('account')}</div><h2>ระบบบัญชีอยู่ระหว่างตั้งค่า</h2><p>ขณะนี้ยังใช้ข้อมูลที่บันทึกในเบราว์เซอร์นี้ได้ตามเดิม ระบบบัญชีจะเปิดเมื่อเชื่อมต่อฐานข้อมูลและอีเมลเรียบร้อย</p></section>`;
  const signup=accountMode==='signup',recover=accountMode==='recover',password=accountMode==='password';
  return `<section class="card account-card"><div class="account-emblem">${icon('account')}</div><p class="eyebrow">YOUR DAY ACCOUNT</p><h2>${modes[accountMode]}</h2><p>เก็บกิจวัตรของคุณไว้กับบัญชี และเปิดต่อจากอุปกรณ์อื่น</p>${message}<form id="accountForm">
   ${signup||(!recover&&!password)?field('ชื่อผู้ใช้','username','','text','required minlength="3" maxlength="30" pattern="[A-Za-z0-9_]{3,30}" autocomplete="username"','ใช้ a–z, 0–9 หรือ _ จำนวน 3–30 ตัวอักษร'):''}
   ${signup?field('ชื่อที่แสดง','displayName','','text','required maxlength="80" autocomplete="nickname"'):''}
   ${signup||recover?field('อีเมล','email','','email','required maxlength="254" autocomplete="email"'):''}
   ${!recover?`<label class="field"><span>รหัสผ่าน${signup||password?' (อย่างน้อย 12 ตัวอักษร)':''}</span><div class="password-field"><input name="password" type="password" required ${signup||password?'minlength="12"':''} maxlength="128" autocomplete="${signup||password?'new-password':'current-password'}"><button type="button" class="icon-btn" data-action="account-password-toggle" aria-label="แสดงรหัสผ่าน">${icon('eye')}</button></div></label>`:''}
   ${signup||password?field('ยืนยันรหัสผ่าน','confirmPassword','','password','required minlength="12" maxlength="128" autocomplete="new-password"'):''}
   <button class="btn primary" type="submit" ${accountBusy?'disabled':''}>${accountBusy?'กำลังดำเนินการ…':modes[accountMode]}</button><p id="accountFormMessage" role="status"></p>
   </form><div class="account-links">${!password?['login','signup','recover'].filter(k=>k!==accountMode).map(k=>btn(modes[k],'account-mode','soft',`data-mode="${k}"`)).join(''):''}</div></section>`;
 }
 let accountClient=null,accountStore=null,accountUser=null,accountStatus='guest',accountBusy=false,accountMode='login',accountError='',accountSaveTimer,accountSessionChanged=false;
 function accountStatusText(){return ({guest:'บันทึกเฉพาะเบราว์เซอร์นี้',loading:'กำลังโหลดข้อมูลบัญชี',synced:'ซิงก์ข้อมูลบัญชีแล้ว',pending:'มีการแก้ไขรอซิงก์',saving:'กำลังซิงก์ข้อมูล',conflict:'ข้อมูลชนกับอีกเครื่อง — เก็บฉบับนี้ไว้แล้ว',offline:'ยังซิงก์ไม่ได้ — เก็บฉบับในเครื่องไว้แล้ว',error:'โหลดข้อมูลบัญชีไม่ได้ กรุณาลองใหม่','session-expired':'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง','storage-error':'บันทึกฉบับในเครื่องไม่ได้ กรุณาส่งออก JSON'})[accountStatus]||'';}
 function accountCanEdit(){return !accountSessionChanged&&(!accountUser||(accountStore?.ready&&!['loading','error','session-expired','storage-error'].includes(accountStatus)));}
 function accountStatusUpdate(value){
  accountStatus=value;
  const label=accountUser?.user_metadata?.display_name||accountUser?.user_metadata?.username||'บัญชีของคุณ';
  if($('#accountButton')){$('#accountButton').innerHTML=icon('account')+`<span>${e(accountUser?label:'เข้าสู่ระบบ')}</span>`;$('#accountButton').setAttribute('aria-label',accountUser?'เปิดบัญชี '+label:'เข้าสู่ระบบ');}
  if($('#accountSyncStatus'))$('#accountSyncStatus').textContent=accountStatusText();
 }
 function saveAccount(message,stamp){
  if(!accountCanEdit()){toast('กรุณาเชื่อมต่อบัญชีก่อนแก้ไข');return;}
  if(stamp)d().savedAt=new Date().toISOString();
  try{state=window.JaiAccountData.cloudState(C,state);accountStore.edit(state);savedDates=new Set(Object.keys(state.days));clearTimeout(accountSaveTimer);accountSaveTimer=setTimeout(()=>accountStore.flush().catch(err=>{accountError=err.message;accountStatusUpdate(accountStore.status);}),500);if(message)toast('บันทึกฉบับในเครื่องแล้ว · กำลังซิงก์บัญชี');}
  catch(err){accountError=err.message;storageBlocked=true;toast('ยังบันทึกไม่ได้ กรุณาส่งออก JSON เพื่อสำรอง');}
  updateSaveStatus();
 }
 async function openAccount(){
  if(!accountUser)return;closeEditor();state=window.JaiAccountStore.blankState(C);rawBackup=null;storageBlocked=true;accountStatusUpdate('loading');render();
  try{await accountStore.open(accountUser.id);state=accountStore.state;rawBackup=null;storageBlocked=false;storageIssue='';savedDates=new Set(Object.keys(state.days));accountError='';}
  catch(err){if(accountStore.state)state=accountStore.state;accountError=err.message;}
  render();
 }
 function restoreGuest(){
  accountStore?.close();accountUser=null;accountSessionChanged=false;accountError='';storageIssue='';storageBlocked=false;rawBackup=null;
  try{rawBackup=localStorage.getItem(KEY);state=rawBackup===null?C.createState():C.parseImport(rawBackup);}
  catch{state=C.createState();storageBlocked=true;storageIssue='อ่านข้อมูลเดิมในเครื่องไม่ได้ กรุณาส่งออกข้อมูลเดิมเพื่อสำรอง';}
  savedDates=new Set(rawBackup!==null&&!storageBlocked?Object.keys(state.days):[]);accountStatusUpdate('guest');closeEditor();render();
 }
 async function handleAccountAction(button){
  const action=button.dataset.action;
  if(action==='account-password-toggle'){const input=$('#accountForm [name="password"]');if(input){input.type=input.type==='password'?'text':'password';button.setAttribute('aria-label',input.type==='password'?'แสดงรหัสผ่าน':'ซ่อนรหัสผ่าน');}return;}
  if(action==='account-mode'){accountMode=button.dataset.mode;accountError='';render();return;}
  if(accountBusy)return;
  accountBusy=true;accountError='';
  try{
   if(action==='account-logout'||action==='account-reauth'){clearTimeout(accountSaveTimer);const request=accountClient.signOut();restoreGuest();page=action==='account-reauth'?'account':'dashboard';accountMode='login';location.hash=page;render();await request;}
   if(action==='account-retry'){if(!accountStore?.ready)await openAccount();else {await accountStore.flush();render();}}
   if(action==='account-import'){
    if(!$('#accountImportConfirm')?.checked)throw Error('กรุณายืนยันการแทนที่ข้อมูลก่อน');
    if(!accountCanEdit())throw Error('บัญชียังไม่พร้อม');
    const raw=localStorage.getItem(KEY);if(!raw)throw Error('ไม่มีข้อมูลเดิมที่บันทึกในเครื่อง');
    state=window.JaiAccountData.cloudState(C,C.parseImport(raw));saveAccount('',false);render();
   }
   if(action==='account-remote'){download(JSON.stringify(state,null,2),'your-day-local-draft-'+localDate()+'.json');await accountStore.useRemote();state=accountStore.state;storageBlocked=false;savedDates=new Set(Object.keys(state.days));render();}
  }catch(err){accountError=err.message;render();}
  finally{accountBusy=false;}
 }
 async function submitAccount(ev){
  ev.preventDefault();if(accountBusy)return;const form=ev.target,f=new FormData(form),v=k=>String(f.get(k)||'');
  const mode=accountMode,password=v('password');accountBusy=true;accountError='';const submit=form.querySelector('[type="submit"]');submit.disabled=true;
  try{
   if((mode==='signup'||mode==='password')&&password!==v('confirmPassword'))throw Error('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
   const redirect=location.origin+location.pathname;
   if(mode==='login'){await accountClient.signIn(v('username').trim(),password);accountUser=accountClient.user();await openAccount();if(accountStore.ready)navigate('dashboard');}
   if(mode==='signup'){await accountClient.signUp({username:v('username'),displayName:v('displayName'),email:v('email').trim()},password,redirect);accountMode='login';render();toast('โปรดตรวจอีเมลเพื่อยืนยันบัญชี หากยังไม่ได้รับให้ลองใหม่ภายหลัง');}
   if(mode==='recover'){await accountClient.recover(v('email').trim(),redirect);form.reset();$('#accountFormMessage').textContent='หากอีเมลนี้ลงทะเบียนไว้ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้ กรุณาตรวจกล่องจดหมาย';}
   if(mode==='password'){await accountClient.updatePassword(password);await accountClient.signOut();accountMode='login';restoreGuest();navigate('account');toast('เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบอีกครั้ง');}
  }catch(err){accountError=err.message;render();}
  finally{accountBusy=false;const current=$('#accountForm [type="submit"]');if(current)current.disabled=false;}
 }
 function initAccount(){
  if(!window.JaiAccountClient||!window.JaiAccountStore){accountStatusUpdate('guest');return;}
  try{accountClient=window.JaiAccountClient.createClient(window.JaiAccountConfig||{enabled:false});
  let cacheId=C.uid();try{const existing=sessionStorage.getItem('jai-account-tab.v1');if(existing)cacheId=existing;else sessionStorage.setItem('jai-account-tab.v1',cacheId);}catch{/* Memory-only tab ID when session storage is unavailable. */}
  accountStore=window.JaiAccountStore.createAccountStore({core:C,storage:localStorage,api:accountClient,cacheId,onStatus:accountStatusUpdate});}catch{accountError='เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูลบัญชี';accountStatusUpdate('guest');return;}
  accountStatusUpdate('guest');
  if(!accountClient.enabled())return;
  (async()=>{try{
   const hasCallback=/access_token=|error_description=/.test(location.hash);
   const callback=hasCallback?await accountClient.consumeCallback(location.href):null;
   if(hasCallback)history.replaceState(null,'',location.pathname+location.search+'#account');
   accountUser=accountClient.user()||accountClient.restore();
   if(accountUser){if(callback?.recovery){accountMode='password';navigate('account');}else await openAccount();}
  }catch(err){accountError=err.message;accountMode='login';navigate('account');}})();
  window.addEventListener('storage',ev=>{if(ev.key===accountClient.sessionKey){clearTimeout(accountSaveTimer);accountSessionChanged=true;accountClient.invalidate();accountStore.close();state=window.JaiAccountStore.blankState(C);rawBackup=null;closeEditor();accountStatusUpdate('session-expired');storageBlocked=true;accountError='บัญชีเปลี่ยนจากอีกแท็บ กรุณาโหลดหน้าใหม่';render();}});
  window.addEventListener('online',()=>{if(!accountSessionChanged&&accountUser&&accountStore.ready&&accountStatus!=='conflict')accountStore.flush().catch(()=>{});});
 }
 document.addEventListener('click',ev=>{
  const button=ev.target.closest('[data-action^="account-"]');
  if(button){ev.preventDefault();void handleAccountAction(button);return;}
  if(!accountCanEdit()&&(ev.target.closest('#content')||ev.target.closest('#editor'))&&page!=='account'){ev.preventDefault();ev.stopImmediatePropagation();}
 },true);
 for(const type of ['input','change'])document.addEventListener(type,ev=>{if(!accountCanEdit()&&(ev.target.closest('#content')||ev.target.closest('#editor'))&&ev.target.closest('#accountForm')===null){ev.preventDefault();ev.stopImmediatePropagation();}},true);
 document.addEventListener('submit',ev=>{if(ev.target.id==='accountForm')void submitAccount(ev);else if(!accountCanEdit()){ev.preventDefault();ev.stopImmediatePropagation();}},true);
