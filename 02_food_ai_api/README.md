# API วิเคราะห์อาหารจากภาพ

`worker.mjs` เป็น endpoint วิเคราะห์รูปอาหารที่มีอยู่จริง ส่วน `wrangler.jsonc` เป็นการตั้งค่า Cloudflare Worker API นี้เป็นบริการเสริม ต้องกำหนด secrets และ endpoint ก่อนใช้ การบันทึกอาหารด้วยตนเองยังใช้งานได้โดยไม่ต้องเปิด API

ดู [วิธีตั้งค่า](../docs/FOOD-AI-SETUP.md) ห้ามเก็บ API keys หรือ access codes ลง GitHub และหน้าเว็บ
