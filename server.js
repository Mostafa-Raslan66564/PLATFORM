const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// لقراءة البيانات القادمة بصيغة JSON
app.use(express.json());

// تقديم ملفات الواجهة الأمامية (مثل index.html) إذا كانت في المجلد الرئيسي
app.use(express.static(path.join(__dirname)));

// نقطة استقبال طلبات الدفع أو الإشعارات
app.post('/api/notify', (req, res) => {
  console.log('تم استلام بيانات:', req.body);

  // هنا تضيف منطق إرسال الإشعارات أو رسائل الواتساب لاحقاً
  res.status(200).json({
    success: true,
    message: 'تم استلام الطلب بنجاح'
  });
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`السيرفر يعمل على المنفذ ${PORT}`);
});
