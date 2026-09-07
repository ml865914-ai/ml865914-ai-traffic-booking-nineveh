/**
 * Data types and interfaces for the Nineveh Traffic Booking Platform
 * منصة الحجز المروري — محافظة نينوى
 */

export type Governorate = 'Nineveh';

export enum PaymentStatus {
  UNPAID = 'UNPAID',                         // لم يتم رفع إثبات الدفع
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // إثبات الدفع بانتظار المراجعة
  VERIFIED = 'VERIFIED',                     // تم التحقق من الدفع
  REJECTED = 'REJECTED'                      // تم رفض إثبات الدفع
}

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',       // بانتظار الدفع
  PAYMENT_REVIEW = 'PAYMENT_REVIEW',         // قيد مراجعة الدفع
  CONFIRMED = 'CONFIRMED',                   // تم تأكيد الحجز
  REJECTED = 'REJECTED',                     // تم رفض الطلب
  COMPLETED = 'COMPLETED'                    // تم إنجاز المعاملة
}

export interface TrafficService {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  sortOrder: number;
  note?: string;
  icon?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;                     // e.g. TR-NIN-2026-000001
  fullName: string;                          // الاسم الرباعي
  surname: string;                           // اللقب
  phone: string;                             // رقم الهاتف العراقي
  governorate: Governorate;                  // نينوى حصراً
  serviceId: string;
  serviceName: string;
  price: number;                             // السعر المعتمد من السيرفر
  paymentMethod: 'MasterCard';               // طريقة الدفع المعتمدة الحصرية
  paymentAccountNumber: string;             // رقم حساب MasterCard (7112808287)
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  paymentProofUrl: string;                   // صورة إثبات التحويل
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
  notes?: string;
  ipHash?: string;
}

export interface SystemSettings {
  siteName: string;
  whatsappNumber: string;
  supportPhone: string;
  workingHours: string;
  welcomeMessage: string;
  allowBookings: boolean;
  closedReasonMessage?: string;
  paymentNotice: string;
  masterCardAccount: string;                 // 7112808287
}

export interface AdminStats {
  totalBookings: number;
  todayBookings: number;
  newBookings: number;
  pendingPayment: number;
  pendingVerification: number;
  confirmedBookings: number;
  rejectedBookings: number;
  completedBookings: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
}

export interface CreateBookingPayload {
  fullName: string;
  surname: string;
  phone: string;
  governorate: string; // Must be Nineveh, server will strictly reject if not!
  serviceId: string;
  paymentMethod: 'MasterCard'; // Mandatory: must be MasterCard only
  paymentAccountNumber?: string; // 7112808287
  notes?: string;
  clientPrice?: number; // Server ignores this and enforces authoritative price
}

export interface SubmitPaymentProofPayload {
  bookingId: string;
  bookingNumber: string;
  phone: string;
  paymentProofImage: string; // Base64 or URL
}
