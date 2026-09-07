import React, { useState } from 'react';
import { Booking, PaymentStatus, BookingStatus } from '../types';
import { formatIQD, formatDateTimeArabic } from '../utils/formatters';
import { api } from '../services/api';
import { compressImage } from '../utils/imageCompressor';
import {
  Search, X, CheckCircle2, Clock, AlertTriangle, XCircle,
  FileCheck, ArrowLeft, Upload, RefreshCw
} from 'lucide-react';

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillBookingNumber?: string;
  prefillPhone?: string;
}

export const TrackBookingModal: React.FC<TrackBookingModalProps> = ({
  isOpen,
  onClose,
  prefillBookingNumber = '',
  prefillPhone = ''
}) => {
  const [bookingNumber, setBookingNumber] = useState(prefillBookingNumber);
  const [phone, setPhone] = useState(prefillPhone);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-upload state
  const [showReupload, setShowReupload] = useState(false);
  const [reuploadImage, setReuploadImage] = useState<string | null>(null);
  const [reuploadLoading, setReuploadLoading] = useState(false);
  const [reuploadSuccess, setReuploadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingNumber.trim() || !phone.trim()) {
      setError('يرجى إدخال رقم الحجز ورقم الهاتف المسجل.');
      return;
    }

    setLoading(true);
    setError(null);
    setBooking(null);
    setShowReupload(false);

    try {
      const result = await api.trackBooking(bookingNumber.trim(), phone.trim());
      setBooking(result);
    } catch (err: any) {
      setError(err.message || 'لم يتم العثور على أي حجز بهذه البيانات. تأكد من صحة رقم الحجز ورقم الهاتف.');
    } finally {
      setLoading(false);
    }
  };

  const handleReuploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1400, 1400, 0.82);
      setReuploadImage(compressed);
    } catch {
      setError('فشل في معالجة الصورة.');
    }
  };

  const handleConfirmReupload = async () => {
    if (!booking || !reuploadImage) return;

    setReuploadLoading(true);
    try {
      const result = await api.submitPaymentProof({
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        phone: booking.phone,
        paymentProofImage: reuploadImage
      });
      setBooking(result.booking);
      setReuploadSuccess(true);
      setShowReupload(false);
      setReuploadImage(null);
      setTimeout(() => setReuploadSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'فشل في إعادة رفع إثبات الدفع.');
    } finally {
      setReuploadLoading(false);
    }
  };

  // Helper for Payment Status badge
  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.VERIFIED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>تم التحقق من الدفع (مدفوع)</span>
          </span>
        );
      case PaymentStatus.PENDING_VERIFICATION:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>إثبات الدفع بانتظار المراجعة</span>
          </span>
        );
      case PaymentStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>تم رفض إثبات الدفع</span>
          </span>
        );
      case PaymentStatus.UNPAID:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
            <span>لم يتم الدفع / بانتظار التحويل</span>
          </span>
        );
    }
  };

  // Helper for Booking Status badge
  const getBookingStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
            <FileCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>تم تأكيد الحجز رسمياً</span>
          </span>
        );
      case BookingStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>تم إنجاز المعاملة بنجاح</span>
          </span>
        );
      case BookingStatus.PAYMENT_REVIEW:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300">
            <Clock className="w-3.5 h-3.5 text-purple-700" />
            <span>قيد مراجعة الدفع</span>
          </span>
        );
      case BookingStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>طلب مرفوض</span>
          </span>
        );
      case BookingStatus.PENDING_PAYMENT:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>بانتظار الدفع</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-indigo-950/40 bg-indigo-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">استعلام وتتبع حالة الحجز</h3>
              <p className="text-xs text-white/80">خاص بمواطني محافظة نينوى</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Form styled like Sleek Interface tracking */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  رقم الحجز
                </label>
                <input
                  type="text"
                  value={bookingNumber}
                  onChange={(e) => setBookingNumber(e.target.value)}
                  placeholder="TR-NIN-2026-XXXXXX"
                  dir="ltr"
                  id="track-booking-number-input"
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-right uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  رقم الهاتف المسجل
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07xx xxx xxxx"
                  dir="ltr"
                  id="track-phone-input"
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-right"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="track-submit-btn"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-indigo-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري البحث في السجلات...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>استعلام عن الحجز</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Re-upload Success Notice */}
          {reuploadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم رفع إثبات الدفع بنجاح! طلبك قيد المراجعة الآن.</span>
            </div>
          )}

          {/* Search Result Display */}
          {booking && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">رقم الحجز:</span>
                  <span className="text-base font-bold text-indigo-950 font-mono tracking-wider" dir="ltr">
                    {booking.bookingNumber}
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                  محافظة نينوى
                </span>
              </div>

              {/* Status Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">حالة الدفع:</span>
                  {getPaymentStatusBadge(booking.paymentStatus)}
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">حالة الحجز:</span>
                  {getBookingStatusBadge(booking.bookingStatus)}
                </div>
              </div>

              {/* Citizen & Service Details */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200/80 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-black">الاسم الرباعي:</span>
                  <strong className="text-slate-950 font-black text-sm sm:text-base">{booking.fullName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-black">اللقب / العشيرة:</span>
                  <strong className="text-slate-950 font-black text-sm sm:text-base">{booking.surname}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-black">رقم الهاتف:</span>
                  <strong className="text-slate-950 font-black font-mono" dir="ltr">{booking.phone}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-black">المحافظة:</span>
                  <strong className="text-indigo-700 font-black">محافظة نينوى (حصراً)</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-xs">الخدمة المطلوبة:</span>
                  <strong className="text-slate-900 font-bold">{booking.serviceName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-xs">الرسوم المعتمدة:</span>
                  <strong className="text-indigo-600 font-bold">{formatIQD(booking.price)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold text-xs">تاريخ إنشاء الطلب:</span>
                  <span className="text-slate-600 text-xs font-semibold">{formatDateTimeArabic(booking.createdAt)}</span>
                </div>

                {/* Rejection Reason if any */}
                {booking.rejectionReason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 mt-2">
                    <strong className="block font-bold mb-0.5">سبب رفض الدفع:</strong>
                    <p className="text-xs">{booking.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Allow Re-upload of Payment Proof if UNPAID or REJECTED */}
              {(booking.paymentStatus === PaymentStatus.UNPAID || booking.paymentStatus === PaymentStatus.REJECTED) && (
                <div className="pt-3 border-t border-slate-200">
                  {!showReupload ? (
                    <button
                      onClick={() => setShowReupload(true)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition shadow-sm cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>إرفاق / إعادة رفع إثبات الدفع</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-white border border-indigo-300 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800">إرفاق إثبات الدفع للحجز:</h4>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReuploadImage}
                        className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />

                      {reuploadImage && (
                        <div className="mt-2">
                          <img src={reuploadImage} alt="إثبات الدفع الجديد" className="h-32 object-contain rounded-lg border" />
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={handleConfirmReupload}
                          disabled={reuploadLoading || !reuploadImage}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          {reuploadLoading ? 'جاري الإرسال...' : 'تأكيد الرفع للمراجعة'}
                        </button>
                        <button
                          onClick={() => {
                            setShowReupload(false);
                            setReuploadImage(null);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-800 py-1.5 px-2"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
