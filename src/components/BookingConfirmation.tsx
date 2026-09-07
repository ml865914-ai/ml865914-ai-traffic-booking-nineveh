import React, { useState, useRef } from 'react';
import { Booking, SystemSettings } from '../types';
import { formatIQD, formatDateTimeArabic } from '../utils/formatters';
import {
  CheckCircle2, Copy, Check, MessageSquare, Phone, Printer,
  Download, FileText, Image as ImageIcon, Loader2, X, AlertCircle,
  Clock, ShieldCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getReceiptImage } from '../utils/receiptCanvas';

interface BookingConfirmationProps {
  booking: Booking;
  settings: SystemSettings | null;
  onReset: () => void;
  onOpenTrack: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  settings,
  onReset,
  onOpenTrack
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const phone = settings?.supportPhone || '07733034802';
  const rawWa = settings?.whatsappNumber || '07733034802';
  const cleanPhone = rawWa.replace(/\D/g, '');
  const cleanWaNumber = cleanPhone.startsWith('0') ? '964' + cleanPhone.slice(1) : cleanPhone;

  const masterCardAcc = booking.paymentAccountNumber || settings?.masterCardAccount || '7112808287';

  // Exact WhatsApp formatted text mandated by user instructions
  const waMessage =
    `طلب حجز مروري جديد\n` +
    `رقم الحجز: ${booking.bookingNumber}\n` +
    `اسم الزبون: ${booking.fullName}\n` +
    `اللقب: ${booking.surname}\n` +
    `رقم الهاتف: ${booking.phone}\n` +
    `المحافظة: نينوى\n` +
    `الخدمة: ${booking.serviceName}\n` +
    `المبلغ: ${booking.price} دينار عراقي\n` +
    `طريقة الدفع: MasterCard\n` +
    `رقم الحساب المحول إليه: ${masterCardAcc}\n` +
    `حالة الدفع: بانتظار التحقق من إثبات التحويل`;

  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(waMessage)}`;

  const handleCopyBookingNumber = () => {
    navigator.clipboard.writeText(booking.bookingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 1. Generate PDF
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setStatusMessage('جاري إنشاء ملف PDF وتجهيزه للتحميل...');

    try {
      const imgData = await getReceiptImage(receiptRef.current, booking, settings);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // A4 page is 210mm x 297mm
      const pageWidth = 210;
      const margin = 10;
      const imgWidth = pageWidth - margin * 2; // 190mm
      const imgHeight = (1750 * imgWidth) / 1200;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, Math.min(imgHeight, 275));
      pdf.save(`إشعار_حجز_مرور_نينوى_${booking.bookingNumber}.pdf`);

      setStatusMessage('تم تحميل ملف PDF بنجاح!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setStatusMessage('حدث خطأ أثناء تحميل PDF، يرجى استخدام خيار الطباعة المباشرة.');
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Download high-res Image (PNG)
  const handleDownloadImage = async () => {
    setIsGenerating(true);
    setStatusMessage('جاري حفظ صورة الإشعار...');

    try {
      const imgData = await getReceiptImage(receiptRef.current, booking, settings);

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `إشعار_حجز_مرور_نينوى_${booking.bookingNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage('تم حفظ صورة الإشعار في جهازك بنجاح!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      console.error('Failed to save image:', error);
      setStatusMessage('حدث خطأ أثناء حفظ الصورة.');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Direct Browser Printing with iframe fallback
  const handleDirectPrint = () => {
    setStatusMessage('جاري فتح أمر الطباعة...');
    setTimeout(() => setStatusMessage(null), 3000);

    // Try standard print
    try {
      window.print();
    } catch (e) {
      console.warn('Direct window.print() failed, falling back to iframe print:', e);
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        if (iframe.contentWindow && receiptRef.current) {
          const content = receiptRef.current.innerHTML;
          iframe.contentWindow.document.open();
          iframe.contentWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
              <meta charset="utf-8">
              <title>إشعار حجز - ${booking.bookingNumber}</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
              <style>
                * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
                body { margin: 0; padding: 20px; background: #fff; direction: rtl; color: #0f172a; }
                .print-hide { display: none !important; }
                @media print {
                  @page { margin: 10mm; size: A4 portrait; }
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              ${content}
            </body>
            </html>
          `);
          iframe.contentWindow.document.close();
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch (err) {}
          }, 2000);
        }
      } catch (err) {
        console.error('All print methods failed, downloading PDF instead:', err);
        handleDownloadPdf();
      }
    }
  };

  // Main Click Handler: opens options modal AND initiates PDF generation for immediate result
  const handleMainPrintClick = () => {
    setShowOptionsModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Printable / Confirmation Card */}
      <div
        ref={receiptRef}
        id="printable-booking-card"
        className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-none"
      >
        {/* Top Header Banner */}
        <div className="bg-indigo-900 text-white p-6 sm:p-8 text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            تم استلام طلبك بنجاح!
          </h2>
          <p className="text-indigo-200 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            مكتب عبدالله السيد للحجز المروري — مجمع تسجيل مرور محافظة نينوى
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>إشعار تسجيل إلكتروني رسمي</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Prominent Booking Number Box - Requirement 8 */}
          <div className="p-6 rounded-2xl bg-indigo-50/50 border-2 border-indigo-100 text-center relative">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              رقم الحجز الرسمي الخاص بك
            </span>
            <div className="text-2xl sm:text-4xl font-bold text-indigo-950 font-mono tracking-wider py-1" dir="ltr">
              {booking.bookingNumber}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              يرجى الاحتفاظ برقم الحجز لمتابعة طلبك أو عند مراجعة مجمع المرور.
            </p>

            <button
              onClick={handleCopyBookingNumber}
              id="confirmation-copy-number-btn"
              className="mt-3 inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer print:hidden"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تم نسخ رقم الحجز!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ رقم الحجز</span>
                </>
              )}
            </button>
          </div>

          {/* Core Notice Box - Mandated by Requirement 8 */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5 text-amber-950">حالة الطلب الحالية:</strong>
              <p>
                طلبك الآن بانتظار مراجعة إثبات الدفع من قبل إدارة المنصة. سيتم التواصل معك على رقم الهاتف المسجل لتأكيد موعد المراجعة فور تدقيق الإشعار.
              </p>
            </div>
          </div>

          {/* Booking Summary Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700">
              تفاصيل وملخص الحجز
            </div>
            <div className="divide-y divide-slate-100 text-sm sm:text-base">
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="text-slate-600 font-black text-sm sm:text-base">الاسم الرباعي:</span>
                <span className="col-span-2 font-black text-slate-950 text-base">{booking.fullName}</span>
              </div>
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="text-slate-600 font-black text-sm sm:text-base">اللقب / العشيرة:</span>
                <span className="col-span-2 font-black text-slate-950 text-base">{booking.surname}</span>
              </div>
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="text-slate-600 font-black text-sm sm:text-base">رقم الهاتف:</span>
                <span className="col-span-2 font-black text-slate-950 font-mono text-base" dir="ltr">{booking.phone}</span>
              </div>
              <div className="grid grid-cols-3 p-4 items-center">
                <span className="text-slate-600 font-black text-sm sm:text-base">المحافظة:</span>
                <span className="col-span-2 font-black text-indigo-700 text-base">محافظة نينوى (حصراً)</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-slate-500 font-medium">نوع الخدمة المرورية:</span>
                <span className="col-span-2 font-bold text-slate-900">{booking.serviceName}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-slate-500 font-medium">طريقة الدفع:</span>
                <span className="col-span-2 font-bold text-slate-900">MasterCard</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-slate-500 font-medium">رقم الحساب المحول إليه:</span>
                <span className="col-span-2 font-bold font-mono text-slate-900" dir="ltr">{masterCardAcc}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-slate-500 font-medium">المبلغ المطلوب:</span>
                <span className="col-span-2 font-bold text-indigo-600">{formatIQD(booking.price)}</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-slate-500 font-medium">حالة الدفع:</span>
                <span className="col-span-2 font-bold text-amber-700">بانتظار التحقق من إثبات التحويل</span>
              </div>
              <div className="grid grid-cols-3 p-3.5">
                <span className="text-slate-500 font-medium">تاريخ ووقت التقديم:</span>
                <span className="col-span-2 font-medium text-slate-700">{formatDateTimeArabic(booking.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* WhatsApp & Call Integration Section - Mandated by Requirement 8 & 14 */}
          <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 print:hidden">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                إرسال تفاصيل الحجز عبر WhatsApp
              </h3>
            </div>

            {/* Instruction mandated by Requirement 14 */}
            <p className="text-xs text-emerald-950/80 leading-relaxed">
              تم تجهيز رسالة الحجز. يرجى إرسال الرسالة وإرفاق صورة إثبات الدفع في WhatsApp إذا لم تتم إضافتها تلقائياً للتأكيد الفوري من قِبل مسؤول التدقيق.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="confirmation-open-whatsapp-btn"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>فتح WhatsApp وإرسال التفاصيل</span>
              </a>

              <a
                href={`tel:${phone}`}
                id="confirmation-call-btn"
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-5 rounded-xl text-sm transition shadow-sm cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>اتصال هاتفي</span>
              </a>
            </div>
          </div>

          {/* Feedback Status Alert */}
          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center justify-between gap-2 print:hidden animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>{statusMessage}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Utilities Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              {/* Primary Print / PDF Button */}
              <button
                onClick={handleMainPrintClick}
                disabled={isGenerating}
                id="confirmation-print-pdf-btn"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التجهيز...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>طباعة الإشعار / PDF</span>
                  </>
                )}
              </button>

              {/* Fast Direct PDF Download */}
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                title="تحميل مباشر بصيغة PDF"
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>تحميل PDF</span>
              </button>

              {/* Track Booking Button */}
              <button
                onClick={onOpenTrack}
                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <span>تتبع هذا الحجز الآن</span>
              </button>
            </div>

            <button
              onClick={onReset}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              العودة للرئيسية وحجز جديد
            </button>
          </div>
        </div>
      </div>

      {/* Print & PDF Options Modal */}
      {showOptionsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowOptionsModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    طباعة وحفظ إشعار الحجز
                  </h3>
                  <p className="text-xs text-slate-500">
                    رقم الحجز: <span className="font-mono font-bold text-indigo-700">{booking.bookingNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOptionsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-4 mb-5 leading-relaxed">
              اختر الطريقة المناسبة لك لحفظ أو طباعة إشعار الحجز لتقديمه عند مراجعة مجمع تسجيل مرور نينوى:
            </p>

            <div className="space-y-3">
              {/* Option 1: PDF Download */}
              <button
                onClick={() => {
                  handleDownloadPdf();
                  setShowOptionsModal(false);
                }}
                disabled={isGenerating}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 transition text-right group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-indigo-950 group-hover:text-indigo-900">
                      تحميل ملف PDF (A4 رسمي)
                    </h4>
                    <span className="text-[11px] text-indigo-800/80">
                      ملف إلكتروني منسق جاهز للطباعة والمشاركة
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-indigo-600" />
              </button>

              {/* Option 2: High Res Image */}
              <button
                onClick={() => {
                  handleDownloadImage();
                  setShowOptionsModal(false);
                }}
                disabled={isGenerating}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 transition text-right group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950 group-hover:text-emerald-900">
                      حفظ كصورة في الهاتف (PNG)
                    </h4>
                    <span className="text-[11px] text-emerald-800/80">
                      صورة عالية الدقة للحفظ في ألبوم الصور
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-emerald-600" />
              </button>

              {/* Option 3: Direct Print */}
              <button
                onClick={() => {
                  handleDirectPrint();
                  setShowOptionsModal(false);
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-right group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      طباعة ورقية مباشرة
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      إرسال الإشعار مباشرة إلى الطابعة المتصلة
                    </span>
                  </div>
                </div>
                <Printer className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowOptionsModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

