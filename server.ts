// Fix environment issue in Node 22 where tsx/runner sets global.__dirname = '.'
// which breaks Node 22 createRequire in ESM packages (e.g. vite-plugin-pwa)
if (typeof globalThis !== 'undefined' && (globalThis as any).__dirname === '.') {
  delete (globalThis as any).__dirname;
}

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store.js';
import { PaymentStatus, BookingStatus } from './src/types.js';

const app = express();
const PORT = 3000;
const ADMIN_TOKEN_KEY = process.env.ADMIN_TOKEN || 'admin-nineveh-secure-token-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Express middlewares for parsing JSON and URL-encoded bodies (up to 15MB for receipt images)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper: Convert Arabic/Eastern digits to ASCII 0-9
function normalizeArabicDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

// Helper: Normalize Iraqi phone number into standard 07XXXXXXXX format
function normalizeIraqiPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = normalizeArabicDigits(phone).replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('+964')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('00964')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.startsWith('964')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  if (/^7[3-9]\d{8}$/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
}

// Helper: Iraqi phone number validation
function isValidIraqiPhone(phone: string): boolean {
  if (!phone) return false;
  const norm = normalizeIraqiPhone(phone);
  return /^07[3-9]\d{8}$/.test(norm);
}

// Helper: Arabic full name check (First, Father, Grandfather + Surname or 4-part name)
function isValidQuadName(name: string, surname?: string): boolean {
  if (!name) return false;
  const combined = (surname ? `${name.trim()} ${surname.trim()}` : name).trim();
  const parts = combined.split(/\s+/).filter(p => p.length >= 2);
  // Accepts at least 3 parts (first, father, grandfather) or full 4-part name
  return parts.length >= 3;
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'مرور نينوى — نظام الحجز الإلكتروني',
    time: new Date().toISOString()
  });
});

// Get Services (with authoritative server-side prices)
app.get('/api/services', (req: Request, res: Response) => {
  const services = store.getServices().filter(s => s.active);
  res.json({ success: true, services });
});

// Get Public Settings (Site info, WhatsApp, Working hours, MasterCard account, Booking status)
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = store.getSettings();
  res.json({
    success: true,
    settings: {
      siteName: settings.siteName,
      whatsappNumber: settings.whatsappNumber,
      supportPhone: settings.supportPhone,
      workingHours: settings.workingHours,
      welcomeMessage: settings.welcomeMessage,
      allowBookings: settings.allowBookings,
      closedReasonMessage: settings.closedReasonMessage,
      paymentNotice: settings.paymentNotice,
      masterCardAccount: settings.masterCardAccount || '7112808287'
    }
  });
});

// Create Booking (Strict Backend Validation: Nineveh governorate + MasterCard payment)
app.post('/api/bookings', (req: Request, res: Response): void => {
  try {
    const { fullName, surname, phone, governorate, serviceId, notes, paymentMethod } = req.body;
    const settings = store.getSettings();

    // 1. Check if booking reception is active
    if (!settings.allowBookings) {
      res.status(403).json({
        success: false,
        error: settings.closedReasonMessage || 'نعتذر، استقبال الحجوزات متوقف حالياً. يرجى المحاولة لاحقاً.'
      });
      return;
    }

    // 2. CRITICAL CONSTRAINT: Governorate MUST BE "Nineveh"
    // If client attempts to bypass or send any other governorate, REJECT immediately!
    if (governorate !== 'Nineveh' && governorate !== 'نينوى') {
      res.status(400).json({
        success: false,
        error: 'عذراً، هذه المنصة مخصصة لخدمة مواطني محافظة نينوى فقط ولا يتم قبول أي حجز لمحافظة أخرى.'
      });
      return;
    }

    // 3. CRITICAL CONSTRAINT: Payment Method MUST BE "MasterCard"
    // Strictly reject any other payment method (Zain Cash, Ahli Bank, etc.)
    if (paymentMethod !== 'MasterCard') {
      res.status(400).json({
        success: false,
        error: 'عذراً، طريقة الدفع الوحيدة المعتمدة هي MasterCard. تم رفض الطلب.'
      });
      return;
    }

    // 3. Validate Full Name (At least 3 parts + surname or quad name)
    if (!isValidQuadName(fullName, surname)) {
      res.status(400).json({
        success: false,
        error: 'يرجى إدخال الاسم كاملاً (الاسم الثلاثي أو الرباعي كما في الهوية الرسمية).'
      });
      return;
    }

    // 4. Validate Surname
    if (!surname || surname.trim().length < 2) {
      res.status(400).json({
        success: false,
        error: 'يرجى إدخال اللقب / اسم العشيرة بشكل صحيح.'
      });
      return;
    }

    // 5. Validate Iraqi Phone Number
    const normalizedPhone = normalizeIraqiPhone(phone);
    if (!isValidIraqiPhone(phone)) {
      res.status(400).json({
        success: false,
        error: 'يرجى إدخال رقم هاتف عراقي صحيح مكون من 11 رقماً يبدأ بـ 07 (مثال: 07701234567).'
      });
      return;
    }

    // 6. Anti-spam / Rate limiting: Limit maximum active bookings per phone in 24 hours
    const recentCount = store.countRecentBookingsByPhone(normalizedPhone, 24);
    if (recentCount >= 8) {
      res.status(429).json({
        success: false,
        error: 'لقد تجاوزت الحد المسموح به لعدد الحجوزات المسجلة بهذا الرقم خلال 24 ساعة. يرجى مراجعة حجوزاتك السابقة أو التواصل مع الدعم.'
      });
      return;
    }

    // 7. CRITICAL: Enforce Service ID and Price FROM DATABASE (Ignore client submitted price)
    const service = store.getServiceById(serviceId);
    if (!service || !service.active) {
      res.status(400).json({
        success: false,
        error: 'نوع الخدمة المرورية المطلوب غير متاح أو غير معرف في النظام.'
      });
      return;
    }

    // Authoritative price directly from server database
    const authoritativePrice = service.price;

    const ipHash = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    // 8. Create Booking in Store
    const newBooking = store.createBooking({
      fullName: fullName.trim(),
      surname: surname.trim(),
      phone: normalizedPhone,
      serviceId: service.id,
      serviceName: service.name,
      price: authoritativePrice,
      notes: notes ? notes.trim() : '',
      ipHash
    });

    res.status(201).json({
      success: true,
      booking: newBooking,
      message: 'تم استلام طلب الحجز المبدئي بنجاح. يرجى إتمام التحويل المالي وإرفاق إثبات الدفع لتأكيد الحجز.'
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ غير متوقع أثناء معالجة الحجز. يرجى المحاولة مرة أخرى.'
    });
  }
});

// Attach Payment Proof
app.post('/api/bookings/payment-proof', (req: Request, res: Response): void => {
  try {
    const { bookingId, bookingNumber, phone, paymentProofImage } = req.body;

    if (!paymentProofImage || paymentProofImage.length < 50) {
      res.status(400).json({
        success: false,
        error: 'يرجى إرفاق صورة واضحة لإثبات التحويل المالي (إشعار الدفع).'
      });
      return;
    }

    let booking = store.getBookingById(bookingId);
    if (!booking && bookingNumber && phone) {
      booking = store.findBooking(bookingNumber, phone);
    }

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'لم يتم العثور على الحجز المطلوب. تأكد من صحة رقم الحجز ورقم الهاتف.'
      });
      return;
    }

    // Attach payment proof and update status to PENDING_VERIFICATION
    const updated = store.attachPaymentProof(booking.id, paymentProofImage);

    res.json({
      success: true,
      booking: updated,
      message: 'تم رفع إثبات الدفع بنجاح! طلبك الآن بانتظار التحقق والمراجعة من قبل الإدارة.'
    });
  } catch (error: any) {
    console.error('Error attaching payment proof:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في رفع إثبات الدفع. تأكد من حجم الصورة وحاول مرة أخرى.'
    });
  }
});

// Track Booking (Single user query - does not leak other users' bookings)
app.post('/api/track', (req: Request, res: Response): void => {
  try {
    const { bookingNumber, phone } = req.body;

    if (!bookingNumber || !phone) {
      res.status(400).json({
        success: false,
        error: 'يرجى إدخال رقم الحجز ورقم الهاتف المسجل.'
      });
      return;
    }

    const booking = store.findBooking(bookingNumber, phone);

    if (!booking) {
      res.status(404).json({
        success: false,
        error: 'لم يتم العثور على أي حجز مطابق لرقم الحجز ورقم الهاتف المدخلين. يرجى التأكد من البيانات.'
      });
      return;
    }

    // Return booking details safely
    res.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        fullName: booking.fullName,
        surname: booking.surname,
        phone: booking.phone,
        governorate: booking.governorate,
        serviceId: booking.serviceId,
        serviceName: booking.serviceName,
        price: booking.price,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        paymentProofUrl: booking.paymentProofUrl ? 'attached' : '',
        createdAt: booking.createdAt,
        verifiedAt: booking.verifiedAt,
        rejectionReason: booking.rejectionReason,
        notes: booking.notes
      }
    });
  } catch (error: any) {
    console.error('Error tracking booking:', error);
    res.status(500).json({
      success: false,
      error: 'تعذر البحث عن الحجز حالياً. يرجى المحاولة لاحقاً.'
    });
  }
});

// ==========================================
// ADMIN API ROUTES
// ==========================================

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response): void => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({
      success: true,
      token: ADMIN_TOKEN_KEY,
      adminName: 'مدير النظام — مرور نينوى'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'كلمة مرور الإدارة غير صحيحة.'
    });
  }
});

// Middleware for Admin authentication
const requireAdmin = (req: Request, res: Response, next: () => void): void => {
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${ADMIN_TOKEN_KEY}`) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'غير مصرح بالوصول إلى لوحة الإدارة.' });
  }
};

// Admin: Get all bookings
app.get('/api/admin/bookings', requireAdmin, (req: Request, res: Response) => {
  const bookings = store.getAllBookings();
  res.json({ success: true, bookings });
});

// Admin: Get Dashboard Stats
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const bookings = store.getAllBookings();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMonthStr = now.toISOString().slice(0, 7);

  let totalRevenue = 0;
  let todayRevenue = 0;
  let monthRevenue = 0;

  let todayBookings = 0;
  let pendingPayment = 0;
  let pendingVerification = 0;
  let confirmedBookings = 0;
  let rejectedBookings = 0;
  let completedBookings = 0;

  for (const b of bookings) {
    const bDate = b.createdAt.slice(0, 10);
    const bMonth = b.createdAt.slice(0, 7);

    if (bDate === todayStr) {
      todayBookings++;
    }

    if (b.paymentStatus === PaymentStatus.VERIFIED) {
      totalRevenue += b.price;
      if (bDate === todayStr) {
        todayRevenue += b.price;
      }
      if (bMonth === currentMonthStr) {
        monthRevenue += b.price;
      }
    }

    if (b.paymentStatus === PaymentStatus.UNPAID) {
      pendingPayment++;
    }
    if (b.paymentStatus === PaymentStatus.PENDING_VERIFICATION) {
      pendingVerification++;
    }
    if (b.bookingStatus === BookingStatus.CONFIRMED) {
      confirmedBookings++;
    }
    if (b.bookingStatus === BookingStatus.REJECTED || b.paymentStatus === PaymentStatus.REJECTED) {
      rejectedBookings++;
    }
    if (b.bookingStatus === BookingStatus.COMPLETED) {
      completedBookings++;
    }
  }

  res.json({
    success: true,
    stats: {
      totalBookings: bookings.length,
      todayBookings,
      newBookings: pendingVerification,
      pendingPayment,
      pendingVerification,
      confirmedBookings,
      rejectedBookings,
      completedBookings,
      totalRevenue,
      todayRevenue,
      monthRevenue
    }
  });
});

// Admin: Verify Payment
app.post('/api/admin/bookings/:id/verify-payment', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { adminName, notes } = req.body;

  const updated = store.verifyPayment(id, adminName || 'مدير الحجوزات', notes);
  if (!updated) {
    res.status(404).json({ success: false, error: 'الحجز غير موجود.' });
    return;
  }

  res.json({ success: true, booking: updated });
});

// Admin: Reject Payment
app.post('/api/admin/bookings/:id/reject-payment', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { reason, adminName } = req.body;

  if (!reason || !reason.trim()) {
    res.status(400).json({ success: false, error: 'يرجى كتابة سبب رفض الدفع للمواطن.' });
    return;
  }

  const updated = store.rejectPayment(id, reason.trim(), adminName || 'مدير الحجوزات');
  if (!updated) {
    res.status(404).json({ success: false, error: 'الحجز غير موجود.' });
    return;
  }

  res.json({ success: true, booking: updated });
});

// Admin: Complete Booking
app.post('/api/admin/bookings/:id/complete', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { adminName } = req.body;

  const updated = store.completeBooking(id, adminName || 'مدير الحجوزات');
  if (!updated) {
    res.status(404).json({ success: false, error: 'الحجز غير موجود.' });
    return;
  }

  res.json({ success: true, booking: updated });
});

// Admin: Update Notes
app.put('/api/admin/bookings/:id/notes', requireAdmin, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { notes } = req.body;

  const updated = store.updateAdminNotes(id, notes || '');
  if (!updated) {
    res.status(404).json({ success: false, error: 'الحجز غير موجود.' });
    return;
  }

  res.json({ success: true, booking: updated });
});

// Admin: Get & Update Settings
app.get('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  res.json({ success: true, settings: store.getSettings() });
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const newSettings = req.body;
  const updated = store.updateSettings(newSettings);
  res.json({ success: true, settings: updated });
});

// Admin: Update Services
app.put('/api/admin/services', requireAdmin, (req: Request, res: Response) => {
  const { services } = req.body;
  if (!Array.isArray(services)) {
    res.status(400).json({ success: false, error: 'بيانات الخدمات غير صالحة.' });
    return;
  }
  store.updateServices(services);
  res.json({ success: true, services: store.getServices() });
});

// ==========================================
// VITE / STATIC INTEGRATION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof globalThis !== 'undefined' && (globalThis as any).__dirname === '.') {
      delete (globalThis as any).__dirname;
    }
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Traffic Booking Nineveh Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
