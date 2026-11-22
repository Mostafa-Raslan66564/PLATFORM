const express = require('express');
const path = require('path');

// دعم fetch في بيئة Node.js (يعمل مباشرة في Node 18+، أو عبر node-fetch في النسخ الأقدم)
const fetchFn =
  typeof fetch === 'function'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات WaAPI (يفضل وضع التوكن في متغيرات البيئة Environment Variables على الاستضافة)
const WAAPI_TOKEN = process.env.WAAPI_TOKEN || 'YOUR_API_TOKEN';
const WAAPI_INSTANCE_ID = process.env.WAAPI_INSTANCE_ID || '108518';
const WAAPI_URL = `https://waapi.app/api/v1/instances/${WAAPI_INSTANCE_ID}/client/action/send-message`;

// لقراءة البيانات القادمة بصيغة JSON و x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم ملفات الواجهة الأمامية (مثل index.html) إذا كانت في المجلد الرئيسي
app.use(express.static(path.join(__dirname)));

// تنسيق الرقم إلى صيغة chatId الخاصة بـ WaAPI مثل 96179369895@c.us
function formatChatId(to) {
  if (!to) return '96179369895@c.us';
  const trimmed = String(to).trim();
  if (trimmed.endsWith('@c.us') || trimmed.endsWith('@g.us')) {
    return trimmed;
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  return `${digitsOnly}@c.us`;
}

// دالة إرسال رسالة واتساب عبر WaAPI
async function sendWhatsAppMessage({ to, body }) {
  const chatId = formatChatId(to);

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WAAPI_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatId,
      message: body,
    }),
  };

  const response = await fetchFn(WAAPI_URL, requestOptions);
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

  const { to, chatId, body, message } = req.body || {};
  const targetRecipient = chatId || to || '96179369895@c.us';
  const messageText = body || message || 'Hello from the API';

  try {
    const whatsappResult = await sendWhatsAppMessage({
      to: targetRecipient,
      body: messageText,
    });

    console.log('نتيجة WaAPI:', whatsappResult);

    if (!whatsappResult.ok) {
      return res.status(502).json({
        success: false,
        message: 'تم استلام الطلب لكن فشل إرسال رسالة الواتساب',
        waapi: whatsappResult.data,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم استلام الطلب وإرسال رسالة الواتساب بنجاح',
      waapi: whatsappResult.data,
    });
  } catch (error) {
    console.error('خطأ أثناء إرسال رسالة WaAPI:', error);
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
