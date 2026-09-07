import fs from 'fs';
import path from 'path';
import { Booking, TrafficService, SystemSettings, PaymentStatus, BookingStatus } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default Traffic Services based on prompt specifications
export const DEFAULT_SERVICES: TrafficService[] = [
  {
    id: 'license',
    name: 'حجز إجازة سوق',
    description: 'إصدار أو تجديد إجازة السوق الرسمية للمركبات بكافة فئاتها داخل مجمع تسجيل مرور نينوى.',
    price: 5000,
    active: true,
    sortOrder: 1,
    note: 'رسوم حجز الموعد والتسجيل المبدئي'
  },
  {
    id: 'vision_drug',
    name: 'حجز فحص نظر ومخدرات',
    description: 'إجراء الفحص الطبي لنظر وفحص تعاطي المخدرات المطلوب لإصدار وتجديد إجازات السوق.',
    price: 55000,
    active: true,
    sortOrder: 2,
    note: 'يشمل رسوم الدفع المسبق'
  },
  {
    id: 'ownership',
    name: 'حجز نقل ملكية',
    description: 'تثبيت عقود تحويل ونقل ملكية المركبات والدراجات النارية في مجمع مرور محافظة نينوى.',
    price: 10000,
    active: true,
    sortOrder: 3,
    note: 'حجز موعد مراجعة نقل الملكية'
  },
  {
    id: 'full_service',
    name: 'حجز إجازة سوق + فحص نظر ومخدرات + ترويج معاملة',
    description: 'باقة شاملة ومتكاملة لحجز إجازة السوق مع الفحوصات الطبية الكاملة ومتابعة ترويج ملف المعاملة.',
    price: 60000,
    active: true,
    sortOrder: 4,
    note: 'الباقة الشاملة والأكثر طلباً'
  }
];

// Default System Settings
export const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'مكتب عبدالله السيد للحجز المروري',
  whatsappNumber: '07733034802',
  supportPhone: '07733034802',
  workingHours: 'كل أيام الأسبوع: من الساعة 7:00 صباحاً إلى الساعة 10:00 مساءً',
  welcomeMessage: 'أهلاً بكم في المنصة الإلكترونية لمكتب عبدالله السيد لتنظيم الحجوزات والخدمات المرورية.',
  allowBookings: true,
  closedReasonMessage: 'نعتذر، استقبال الحجوزات متوقف حالياً للصيانة والتنظيم. يرجى المحاولة لاحقاً.',
  paymentNotice: 'يرجى تحويل رسوم الحجز كاملة إلى حساب MasterCard أعلاه، ثم إرفاق صورة واضحة لإثبات التحويل.',
  masterCardAccount: '7112808287'
};

// Seed sample bookings for realistic live demonstration and testing
const INITIAL_SAMPLE_BOOKINGS: Booking[] = [
  {
    id: 'sample-1',
    bookingNumber: 'TR-NIN-2026-000001',
    fullName: 'أحمد محمود يونس الجبوري',
    surname: 'الجبوري',
    phone: '07701234567',
    governorate: 'Nineveh',
    serviceId: 'license',
    serviceName: 'حجز إجازة سوق',
    price: 5000,
    paymentMethod: 'MasterCard',
    paymentAccountNumber: '7112808287',
    paymentStatus: PaymentStatus.VERIFIED,
    bookingStatus: BookingStatus.CONFIRMED,
    paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    verifiedAt: new Date(Date.now() - 86400000).toISOString(),
    verifiedBy: 'مدير النظام (أبو علي)',
    adminNotes: 'تم تدقيق الإشعار ومطابقة حساب MasterCard بنجاح.'
  },
  {
    id: 'sample-2',
    bookingNumber: 'TR-NIN-2026-000002',
    fullName: 'عمر خالد خليل الحيالي',
    surname: 'الحيالي',
    phone: '07719876543',
    governorate: 'Nineveh',
    serviceId: 'vision_drug',
    serviceName: 'حجز فحص نظر ومخدرات',
    price: 55000,
    paymentMethod: 'MasterCard',
    paymentAccountNumber: '7112808287',
    paymentStatus: PaymentStatus.PENDING_VERIFICATION,
    bookingStatus: BookingStatus.PAYMENT_REVIEW,
    paymentProofUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    adminNotes: 'بانتظار مطابقة كشف الحساب.'
  },
  {
    id: 'sample-3',
    bookingNumber: 'TR-NIN-2026-000003',
    fullName: 'حسين علي عبد الله الشمري',
    surname: 'الشمري',
    phone: '07725554433',
    governorate: 'Nineveh',
    serviceId: 'full_service',
    serviceName: 'حجز إجازة سوق + فحص نظر ومخدرات + ترويج معاملة',
    price: 60000,
    paymentMethod: 'MasterCard',
    paymentAccountNumber: '7112808287',
    paymentStatus: PaymentStatus.UNPAID,
    bookingStatus: BookingStatus.PENDING_PAYMENT,
    paymentProofUrl: '',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    notes: 'يرجى تحديد موعد الصباح الباكر إن أمكن'
  }
];

class MemoryStore {
  private bookings: Booking[] = [];
  private services: TrafficService[] = [];
  private settings: SystemSettings = DEFAULT_SETTINGS;
  private nextSequence: number = 4;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(BOOKINGS_FILE)) {
        this.bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
      } else {
        this.bookings = [...INITIAL_SAMPLE_BOOKINGS];
        this.saveBookings();
      }

      if (fs.existsSync(SERVICES_FILE)) {
        this.services = JSON.parse(fs.readFileSync(SERVICES_FILE, 'utf-8'));
      } else {
        this.services = [...DEFAULT_SERVICES];
        this.saveServices();
      }

      if (fs.existsSync(SETTINGS_FILE)) {
        this.settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
        this.saveSettings();
      }

      // calculate next sequence
      let maxNum = 3;
      for (const b of this.bookings) {
        const match = b.bookingNumber.match(/TR-NIN-2026-(\d+)/);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      this.nextSequence = maxNum + 1;
    } catch (e) {
      console.error('Error loading data files, fallback to initial state:', e);
      this.bookings = [...INITIAL_SAMPLE_BOOKINGS];
      this.services = [...DEFAULT_SERVICES];
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private saveBookings() {
    try {
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(this.bookings, null, 2));
    } catch (e) {
      console.error('Failed to write bookings file:', e);
    }
  }

  private saveServices() {
    try {
      fs.writeFileSync(SERVICES_FILE, JSON.stringify(this.services, null, 2));
    } catch (e) {
      console.error('Failed to write services file:', e);
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2));
    } catch (e) {
      console.error('Failed to write settings file:', e);
    }
  }

  public getServices(): TrafficService[] {
    return this.services;
  }

  public getServiceById(id: string): TrafficService | undefined {
    return this.services.find(s => s.id === id);
  }

  public updateServices(newServices: TrafficService[]): void {
    this.services = newServices;
    this.saveServices();
  }

  public getSettings(): SystemSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<SystemSettings>): SystemSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    return this.settings;
  }

  public getAllBookings(): Booking[] {
    return [...this.bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.find(b => b.id === id);
  }

  public findBooking(bookingNumber: string, phone: string): Booking | undefined {
    const cleanNumber = bookingNumber.trim().toUpperCase();
    const cleanPhone = phone.trim().replace(/\D/g, '');

    return this.bookings.find(b => {
      const bNumber = b.bookingNumber.trim().toUpperCase();
      const bPhone = b.phone.trim().replace(/\D/g, '');
      return bNumber === cleanNumber && (bPhone === cleanPhone || bPhone.endsWith(cleanPhone) || cleanPhone.endsWith(bPhone));
    });
  }

  public countRecentBookingsByPhone(phone: string, hoursWindow = 24): number {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cutoff = Date.now() - hoursWindow * 3600 * 1000;
    return this.bookings.filter(b => {
      const bPhone = b.phone.trim().replace(/\D/g, '');
      const createdAt = new Date(b.createdAt).getTime();
      return bPhone === cleanPhone && createdAt > cutoff;
    }).length;
  }

  public createBooking(params: {
    fullName: string;
    surname: string;
    phone: string;
    serviceId: string;
    serviceName: string;
    price: number;
    notes?: string;
    ipHash?: string;
  }): Booking {
    const seqStr = String(this.nextSequence++).padStart(6, '0');
    const bookingNumber = `TR-NIN-2026-${seqStr}`;
    const id = `booking-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newBooking: Booking = {
      id,
      bookingNumber,
      fullName: params.fullName,
      surname: params.surname,
      phone: params.phone,
      governorate: 'Nineveh',
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      price: params.price,
      paymentMethod: 'MasterCard',
      paymentAccountNumber: this.settings.masterCardAccount || '7112808287',
      paymentStatus: PaymentStatus.UNPAID,
      bookingStatus: BookingStatus.PENDING_PAYMENT,
      paymentProofUrl: '',
      createdAt: new Date().toISOString(),
      notes: params.notes || '',
      ipHash: params.ipHash
    };

    this.bookings.unshift(newBooking);
    this.saveBookings();
    return newBooking;
  }

  public attachPaymentProof(bookingId: string, proofUrl: string): Booking | null {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    booking.paymentProofUrl = proofUrl;
    booking.paymentStatus = PaymentStatus.PENDING_VERIFICATION;
    booking.bookingStatus = BookingStatus.PAYMENT_REVIEW;

    this.saveBookings();
    return booking;
  }

  public verifyPayment(bookingId: string, adminName: string, notes?: string): Booking | null {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    booking.paymentStatus = PaymentStatus.VERIFIED;
    booking.bookingStatus = BookingStatus.CONFIRMED;
    booking.verifiedAt = new Date().toISOString();
    booking.verifiedBy = adminName;
    if (notes) {
      booking.adminNotes = notes;
    }

    this.saveBookings();
    return booking;
  }

  public rejectPayment(bookingId: string, reason: string, adminName: string): Booking | null {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    booking.paymentStatus = PaymentStatus.REJECTED;
    booking.bookingStatus = BookingStatus.REJECTED;
    booking.rejectionReason = reason;
    booking.verifiedAt = new Date().toISOString();
    booking.verifiedBy = adminName;

    this.saveBookings();
    return booking;
  }

  public completeBooking(bookingId: string, adminName: string): Booking | null {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    booking.bookingStatus = BookingStatus.COMPLETED;
    booking.adminNotes = (booking.adminNotes ? booking.adminNotes + ' | ' : '') + `تم إنجاز المعاملة بنجاح بواسطة ${adminName}`;

    this.saveBookings();
    return booking;
  }

  public updateAdminNotes(bookingId: string, notes: string): Booking | null {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    booking.adminNotes = notes;
    this.saveBookings();
    return booking;
  }
}

export const store = new MemoryStore();
