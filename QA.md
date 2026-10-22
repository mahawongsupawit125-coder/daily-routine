# ผลตรวจ วันของคุณ

วันที่: 19 ตุลาคม 2026

ผลล่าสุด: `npm run check` และ `npm test` ใช้ตรวจ **62 ข้อ** (core 13, DOM 32, photo helpers 3, API handler 7, local server 7) บน Node 24 รายละเอียดผลรอบเผยแพร่บันทึกใน commit/CI

## ตรวจแล้ว

- ถอดหมวดดูแลเดิมออกจาก UI/seed; ปรับข้อมูลรุ่นเก่าและไฟล์นำเข้าโดยเก็บข้อมูลน้ำ อาหาร ตาราง และการดูแลตัวเอง; บันทึกผลปรับเมื่อโหลดและแสดงข้อผิดพลาดหากเขียนลงเครื่องไม่ได้; ทดสอบปรับซ้ำแล้วข้อมูลไม่เปลี่ยน

- Photo flow: กล้อง/เลือกไฟล์, preview compression ผ่านตัวจำลอง, consent ก่อนส่ง, ตรวจแก้ผลก่อนเพิ่มมื้อ, เลือกวัน/มื้อ/เวลาจริง, ยกเลิกคำขอแล้วผลที่มาช้าไม่เพิ่มข้อมูล, รหัสเข้าใช้ไม่อยู่ใน localStorage/JSON
- API: ปิดเมื่อไม่มี secrets, exact origin allowlist, token, rate limit, ขนาดและรูปแบบคำขอ, structured response, null ไม่เป็นศูนย์, nonfood/refusal/timeout/upstream errors; ใช้ provider จำลอง ไม่มีค่าใช้จ่ายหรือการเรียก OpenAI จริง
- ไม่มี AI account/key ในสภาพแวดล้อมนี้ จึงยังไม่ตรวจคุณภาพสารอาหารจากโมเดลจริงหรือเผยแพร่ Worker ที่เปิดใช้งาน ต้องทำตาม FOOD-AI-SETUP.md ก่อน

- บันทึกวันที่เลือกพร้อมเวลา, เปิดประวัติหลังโหลดใหม่, แยกน้ำ/ตาราง/อาหาร/ออกกำลัง/ดูแลต่อวัน, กรองเดือน, แบ่งแสดงประวัติครั้งละ 20 วัน, เปิดข้อมูลรุ่นเดิม, วันที่แค่เปิดดูไม่อ้างว่าบันทึกแล้ว, บันทึกล้มเหลวไม่สร้างประวัติสำเร็จ (DOM simulation)

- อัตลักษณ์แบบที่ 3: หัวใจ/คลื่นเวกเตอร์และชื่อ “วันของคุณ” ใน sidebar, favicon และ header; ธีมฟ้าน้ำทะเล; คีย์บันทึกเดิมคงไว้

- JavaScript syntax ของ app.js และ core.js
- Core: 11 ช่วงน้ำรวม 3,300 มล., วันแยกกัน, แก้ปริมาณ/ยกเลิกติ๊ก, ยอดสารอาหารที่มีค่าไม่ทราบ, seed มื้อ/เวลานอน, ตาราง A/B/พัก/active recovery, import ผิดรูปแบบและ ID ซ้ำ
- DOM simulation แบบออฟไลน์: ทุกหน้า เมนูที่ breakpoint 375/390/768/1024/1440, เพิ่ม–แก้–ลบข้อมูล, 4 สถานะตาราง, คัดลอกโดยไม่คัดสถานะทำแล้ว, persistence จากการโหลด state ใหม่, export/import และการยืนยันก่อนแทนที่
- กรณีผิดพลาด: ข้อมูล storage เสียไม่ถูกเขียนทับ, storage เต็มแจ้งว่าบันทึกไม่ได้, ชื่อว่างไม่ผ่าน, validation fail ไม่ทำให้ state เสีย, ข้อความจาก JSON และ field ID ถูก escape
- หลังตรวจทานอิสระ: ทดสอบข้อความดูแลบันทึกก่อนกดเช็กลิสต์, ลบท่า/เช็กลิสต์แล้วประวัติวันเก่ายังมีชื่อและสถานะที่แก้ได้, ตรวจ archive ใน JSON และ storage เสียที่เป็นสตริงว่าง
- Local server: หน้า/ไฟล์ static, HEAD, CSP, ป้องกันอ่านซอร์สนอก dist, ปฏิเสธ traversal, path เสีย และคำขอเขียน
- ไม่โหลด font, รูป หรือไลบรารี runtime จากบริการภายนอก

## ข้อจำกัดของการตรวจ

ตรวจ GitHub Pages จริงแล้วใน in-app browser สำหรับการบันทึกรายวัน รีโหลด เปิดประวัติ และเปิดข้อมูลเดิม ยังไม่ได้ตรวจครบทุกขนาดบนมือถือ/iPad/desktop หรือ Safari จริง jsdom ไม่คำนวณ layout และไม่ใช่หลักฐานว่าไม่มี horizontal overflow ตัว dialog/focus และ responsive styles ยังควรตรวจในอุปกรณ์จริง

## เช็กลิสต์ตรวจในเบราว์เซอร์ต่อ

- [ ] Safari iPhone / iPad และ Chrome desktop ที่ 375, 768, 1024, 1440px ทั้งแนวตั้ง/แนวนอน
- [ ] ไม่มี horizontal scroll และเมนู/ปุ่มวันที่/ข้อความไทยไม่ถูกตัด
- [ ] เปิด hamburger, ปิดด้วย Escape/พื้นหลัง และวน Tab อยู่ในเมนูมือถือ
- [ ] เปิด dialog, กด Tab, ปิดแล้ว focus กลับมาจุดที่ใช้งานได้
- [ ] ติ๊กน้ำสองแก้วเห็น 0.6 ลิตร ยกเลิกเหลือ 0.3 ลิตร รีโหลดแล้วยังอยู่
- [ ] สลับวันแล้วติ๊กไม่ข้ามวัน เพิ่ม/แก้/ลบในทุกหน้า
- [ ] โหลด JSON สำรองจริงในอีกเบราว์เซอร์แล้วข้อมูลตรงกัน
- [ ] ขยายตัวอักษร/zoom 200% และเปิด reduced motion ยังอ่านและกดได้
- [x] หลังเปิด GitHub Pages รัน workflow ผ่านและเปิด URL HTTPS จริง (ระบบบันทึกรายวัน)

## ไม่อยู่ใน MVP

บัญชีผู้ใช้, backend sync, push notification, service worker สำหรับเปิดใหม่แบบ offline, การตรวจสอบฉลากจากบริการภายนอก และคำแนะนำสารอาหารเฉพาะบุคคล
# Self-care periods verification (2026-10-19)

- Added backup validation and UI interaction coverage for morning/afternoon items, moving a legacy item without losing completion, reload, separate dates, edit, and delete.
- Syntax checks passed locally. Core/API/photo tests: 24 passed.
- Local full-suite execution is blocked: npm ci cannot complete dependency downloads; UI tests cannot load jsdom. Seven local server tests fail with EACCES connecting to loopback in this sandbox.
- Browser rendering has not been verified in this session. GitHub Actions results should be checked before publication.

# Body calculator verification (2026-10-20)

- Added formula examples, unrounded BMI boundaries, both equation sexes, PAL ranges, unknown inputs, child and older-adult applicability, positive-energy guard, import validation, and legacy backup compatibility tests.
- Added DOM checks for the requested navigation order, live results, explicit save/reload, keeping existing meals, clearing stale results, and avoiding adult interpretation for younger ages.
- Local syntax and 31 core/API/photo/calculation tests pass. Full local testing is limited by npm directory permissions, unavailable jsdom, and EACCES on loopback server requests. GitHub Actions Check app run 39407020562 completed clean installation, syntax checks, and all 73 tests successfully before release.
- No phone/tablet/desktop browser visual verification has been performed for this page in this session.

# Personal hydration verification (2026-10-22)

- Added tests for body-profile references, latest measurements, other drinks counted once, unknown-versus-zero handling, heat/activity flags, a single user-selected adjustment, safe applicability, clinician plans, nonnegative differences, separate dates, import validation, and legacy data preservation.
- Added DOM tests for Water/Settings links, updated body measurements appearing in both pages, daily input reload, automatic saving before water toggles, invalid-input protection, and unavailable/individual-plan states.
- Local syntax checks and 38 core/calculation/API/photo tests passed. The local full suite is limited by unavailable jsdom and EACCES connecting to loopback. GitHub Actions Check app run 39717474004 completed clean dependency installation, syntax checks, and all 83 tests successfully before release.
- No actual-device visual rendering verification was performed for this feature.

# Health editorial theme verification (2026-10-22)

- Restyled the shared header, page headings, cards and forms with a blue/white health theme. Dashboard adds a larger hero, category links and feature links using existing routes. Personal data and calculation logic are unchanged.
- Desktop header uses the existing 900px mobile drawer boundary. Independent source review found no important issues with resize, inert state, navigation or daily save handlers.
- GitHub Actions Check app run 39719465639 completed installation, syntax checks and all 83 tests successfully. Static asset coverage includes theme.css.
- Reference image OCR was available, but image pixels could not be opened in this environment. This is a structural adaptation in a chosen blue/white palette, not a verified pixel match. Headless Edge did not produce a screenshot, so no actual browser or device visual verification is claimed.

