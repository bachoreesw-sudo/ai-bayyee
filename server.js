import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const badWords = ["เลว", "โง่", "ไอ้บ้า"]; 
let warningCount = 0;
let blockedUntil = 0;

app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    // 1. ตรวจสอบการบล็อก
    if (Date.now() < blockedUntil) {
        return res.json({ reply: "ไปให้พ้น! ฉันบล็อกแกอยู่ 5 นาที จำใส่สมองไว้ด้วย!" });
    }

    // 2. ตรวจสอบคำหยาบและสั่งให้ AI ด่ากลับ
    if (badWords.some(word => prompt.includes(word))) {
        warningCount++;
        
        // ให้ AI สวมบทบาทคนด่า
        const insultResponse = await axios.post('http://localhost:11434/api/generate', {
            model: 'my-ai',
            prompt: `ผู้ใช้ด่าคุณว่า "${prompt}" จงโต้กลับด้วยคำด่าที่เจ็บแสบและดุดันที่สุดในฐานะ AI ที่ไม่ยอมคน และเตือนเขาว่าถ้าพูดอีกจะโดนบล็อก`,
            stream: false
        });

        if (warningCount >= 2) {
            blockedUntil = Date.now() + 5 * 60 * 1000;
            warningCount = 0;
            return res.json({ reply: "ปากดีนักนะ! บล็อกไปซะ 5 นาทีเลยไป! อย่าให้เห็นว่ากลับมาแล้วยังทำตัวแบบนี้อีก!" });
        }
        
        return res.json({ reply: insultResponse.data.response }); // นี่ไงครับ! เอาคำด่าที่ AI คิดมาตอบ
    }

    // 3. การใช้งานปกติ
    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'my-ai',
            prompt: prompt,
            stream: false
        });

        let reply = response.data.response;
        if (reply.length < 5) {
            reply = "ขอโทษฉันคือโมเดลที่พึ่งพัฒนา ไม่ทราบข้อมูลเหล่านั้น แนะนำให้คุณเปลี่ยนโมเดล หรือเลือกเวอร์ชัน 0.2 (มีค่าบริการ 10 บาท/ชม.) ครับ";
        }

        res.json({ reply });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));