const express = require('express');
const path = require('path');

// دعم fetch في بيئة Node.js (يعمل مباشرة في Node 18+، أو عبر node-fetch في النسخ الأقدم)
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
const PORT = process.env.PORT || 3000;

const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || 'vpee7p0ge3e5t1lf';
const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE || 'instance197382';
const ULTRAMSG_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`;

// لقراءة البيانات القادمة بصيغة JSON و x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم ملفات الواجهة الأمامية (مثل index.html) إذا كانت في المجلد الرئيسي
app.use(express.static(path.join(__dirname)));

// دالة إرسال رسالة واتساب عبر UltraMsg
async function sendWhatsAppMessage({ to, body }) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

  const urlencoded = new URLSearchParams();
  urlencoded.append('token', ULTRAMSG_TOKEN);
  urlencoded.append('to', to);
  urlencoded.append('body', body);

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow',
  };

  const response = await fetchFn(ULTRAMSG_URL, requestOptions);
  const resultText = await response.text();

  try {
    return { ok: response.ok, status: response.status, data: JSON.parse(resultText) };
  } catch {
    return { ok: response.ok, status: response.status, data: resultText };
  }
}

// نقطة استقبال طلبات الدفع أو الإشعارات
app.post('/api/notify', async (req, res) => {
  console.log('تم استلام بيانات:', req.body);

  const { to, body, message } = req.body || {};
  const targetPhone = to || '%2B96181526233';
  const messageText = body || message || 'رسالة تجريبية من UltraMsg.com';

  try {
    const whatsappResult = await sendWhatsAppMessage({
      to: targetPhone,
      body: messageText,
    });

    console.log('نتيجة UltraMsg:', whatsappResult);

    if (!whatsappResult.ok) {
      return res.status(502).json({
        success: false,
        message: 'تم استلام الطلب لكن فشل إرسال رسالة الواتساب',
        ultramsg: whatsappResult.data,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم استلام الطلب وإرسال رسالة الواتساب بنجاح',
      ultramsg: whatsappResult.data,
    });
  } catch (error) {
    console.error('خطأ أثناء إرسال رسالة UltraMsg:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في السيرفر أثناء محاولة الإرسال',
      error: error.message,
    });
  }
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على المنفذ ${PORT}`);
});
