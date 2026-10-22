# วันของคุณ · Daily Routine

เว็บบันทึกกิจวัตรส่วนตัวภาษาไทย รองรับคอมพิวเตอร์ มือถือ และ iPad

[เปิดเว็บ](https://mahawongsupawit125-coder.github.io/daily-routine/)

## โครงสร้างที่ใช้งานจริง

| ส่วน | เนื้อหา |
| --- | --- |
| [01_web_app](01_web_app) | โค้ดหน้าเว็บ แยก 9 หน้าตามเมนู พร้อม shared logic, styles และ icons |
| [02_food_ai_api](02_food_ai_api) | API วิเคราะห์รูปอาหารและการตั้งค่า Cloudflare Worker |
| [03_tests](03_tests) | ทดสอบสูตรคำนวณ การบันทึก นำเข้า/ส่งออก DOM API และไฟล์เผยแพร่ |
| [docs](docs) | รายละเอียดฟีเจอร์ ขอบเขตโครงการ ผล QA และวิธีตั้งค่า Food AI |
| [scripts](scripts) | Build, syntax checks, local server และตัวช่วย Windows |
| [.github/workflows](.github/workflows) | ตรวจโค้ดและเผยแพร่ GitHub Pages อัตโนมัติ |

### หน้าของเว็บ

ภายใน `01_web_app/src/pages/` แบ่งตามหน้าที่มีอยู่จริง:

1. `01_dashboard` — ภาพรวม
2. `02_body` — คำนวณร่างกาย
3. `03_water` — ดื่มน้ำและเครื่องดื่ม
4. `04_schedule` — ตารางชีวิต
5. `05_workout` — ออกกำลังกาย
6. `06_meals` — อาหารและสารอาหาร
7. `07_self_care` — ดูแลตัวเอง
8. `08_history` — ประวัติรายวัน
9. `09_settings` — ตั้งค่าและสำรองข้อมูล

## รันและตรวจสอบ

ใช้ Node.js 24 ขึ้นไป จากรากโปรเจกต์:

```sh
npm ci
npm run check
npm test
npm start
```

เปิด `http://localhost:4173` หลังรัน `npm start` หรือใช้ `scripts/start.cmd` บน Windows คำสั่งทั้งหมดเรียก build ก่อนใช้ไฟล์ที่เผยแพร่

`npm run build` ประกอบ source ใน `01_web_app/` เป็น `dist/` โดยไม่เพิ่ม runtime dependency ไฟล์ใน dist/ เป็นผล build และไม่เก็บใน Git ให้แก้ source ตามหน้าที่รับผิดชอบแทน

เปิดใน LAN: `npm start -- --lan` จากนั้นใช้ IP ของคอมพิวเตอร์บน Wi-Fi เดียวกัน

## ข้อมูลและการเผยแพร่

ข้อมูลยังบันทึกใน localStorage ของเบราว์เซอร์เดิม คีย์ `jai-daily.v1` และ URL เว็บไซต์เดิมคงไว้ การย้ายโฟลเดอร์ไม่ทำให้ข้อมูลซิงก์ข้ามเครื่อง ใช้ส่งออก/นำเข้า JSON เพื่อย้ายข้อมูลด้วยตนเอง

เมื่อเปลี่ยน source บน main ระบบจะ build, ตรวจ syntax และทดสอบก่อนเผยแพร่ GitHub Pages รองรับการรัน workflow ด้วยตนเองด้วย

## เอกสาร

- [รายละเอียดฟีเจอร์และประวัติการพัฒนา](docs/FEATURES.md)
- [ขอบเขตโครงการ](docs/PROJECT.md)
- [ผลทดสอบและข้อจำกัด](docs/QA.md)
- [ตั้งค่าการวิเคราะห์อาหารจากภาพ](docs/FOOD-AI-SETUP.md)

API อาหารเป็นบริการเสริมและต้องตั้งค่าแยก หน้าเว็บและการบันทึกอาหารด้วยตนเองยังใช้ได้โดยไม่เปิดบริการนี้ ค่าร่างกาย พลังงาน และของเหลวเป็นค่าประมาณประกอบการวางแผน
