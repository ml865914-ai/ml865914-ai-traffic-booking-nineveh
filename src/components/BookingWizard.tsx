import React, { useState, useRef, useEffect } from 'react';
import { TrafficService, SystemSettings, Booking } from '../types';
import { formatIQD, normalizeIraqiPhone, isValidIraqiPhone } from '../utils/formatters';
import { compressImage } from '../utils/imageCompressor';
import { api } from '../services/api';
import {
  Shield, Check, AlertCircle, Camera, Upload, RefreshCw,
  Copy, CheckCheck, ArrowLeft, ArrowRight, FileCheck, Lock, Info, CreditCard
} from 'lucide-react';

interface BookingWizardProps {
  services: TrafficService[];
  selectedService: TrafficService | null;
  settings: SystemSettings | null;
  onBookingSuccess: (booking: Booking) => void;
  onCancel: () => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services,
  selectedService: initialService,
  settings,
  onBookingSuccess,
  onCancel
}) => {
  // Wizard steps: 1: Service Selection, 2: Citizen Info, 3: Review & Payment Transfer, 4: Attach Proof
  const [step, setStep] = useState<number>(initialService ? 2 : 1);
  const [currentService, setCurrentService] = useState<TrafficService | null>(initialService || (services[0] || null));

  // Sync service if initialService or services list updates
  useEffect(() => {
    if (initialService) {
      setCurrentService(initialService);
    } else if (!currentService && services.length > 0) {
      setCurrentService(services[0]);
    }
  }, [initialService, services]);

  // Citizen Form Fields
  const [fullName, setFullName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const governorate = 'Nineveh'; // Fixed and locked to Nineveh strictly!
  const [notes, setNotes] = useState('');

  // Payment Proof State
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Status & Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Created preliminary booking (from server)
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Validation functions
  const validateStep2 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // 1. Full name validation (At least 3 parts e.g. First, Father, Grandfather or Quad name)
    const nameParts = fullName.trim().split(/\s+/).filter(p => p.length >= 2);
    if (!fullName.trim()) {
      newErrors.fullName = 'يرجى إدخال الاسم كاملاً كما في الهوية الرسمية.';
    } else if (nameParts.length < 3) {
      newErrors.fullName = 'يرجى إدخال الاسم الثلاثي أو الرباعي على الأقل (مثال: أحمد محمود يونس).';
    }

    // 2. Surname validation
    if (!surname.trim()) {
      newErrors.surname = 'يرجى إدخال اللقب / اسم العشيرة (مثال: الجبوري).';
    } else if (surname.trim().length < 2) {
      newErrors.surname = 'اللقب قصير جداً.';
    }

    // 3. Iraqi Phone validation
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      newErrors.phone = 'يرجى إدخال رقم الهاتف للتواصل.';
    } else if (!isValidIraqiPhone(trimmedPhone)) {
      newErrors.phone = 'يرجى إدخال رقم هاتف عراقي صحيح مكون من 11 رقماً يبدأ بـ 07 (مثال: 07701234567).';
    }

    // 4. Service validation
    if (!currentService) {
      newErrors.service = 'يرجى اختيار نوع المعاملة المرورية.';
    }

    setErrors(newErrors);

    // If there are errors, scroll to the first invalid field
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.service) {
        setStep(1);
      } else if (newErrors.fullName) {
        document.getElementById('booking-fullname-input')?.focus();
        document.getElementById('booking-fullname-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.surname) {
        document.getElementById('booking-surname-input')?.focus();
        document.getElementById('booking-surname-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (newErrors.phone) {
        document.getElementById('booking-phone-input')?.focus();
        document.getElementById('booking-phone-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  // Copy MasterCard account number helper
  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  // Handle image file selection / camera capture
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size max 5MB before compression
    if (file.size > 5 * 1024 * 1024) {
      setServerError('حجم الصورة كبير جداً، الحد الأقصى المسموح به هو 5 ميجابايت.');
      return;
    }

    // Allowed types: JPG, JPEG, PNG, WEBP
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setServerError('صيغة الملف غير مدعومة. يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP.');
      return;
    }

    try {
      setServerError(null);
      setProofFileName(file.name);
      // Automatically compress image while preserving text clarity
      const compressedBase64 = await compressImage(file, 1400, 1400, 0.82);
      setProofImage(compressedBase64);
    } catch (err) {
      console.error('Failed to process image:', err);
      setServerError('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مرة أخرى.');
    }
  };

  // Step 2 to Step 3: Create Booking on Server first!
  const handleProceedToPayment = async () => {
    setServerError(null);

    const activeService = currentService || (services.length > 0 ? services[0] : null);
    if (!activeService) {
      setServerError('يرجى اختيار نوع المعاملة المرورية أولاً.');
      setStep(1);
      return;
    }
    if (!currentService) {
      setCurrentService(activeService);
    }

    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const normalizedPhone = normalizeIraqiPhone(phone);

      // Send booking creation to backend with strict MasterCard payment
      const result = await api.createBooking({
        fullName: fullName.trim(),
        surname: surname.trim(),
        phone: normalizedPhone,
        governorate: 'Nineveh', // STRICT NINEVEH GOVERNORATE
        serviceId: activeService.id,
        paymentMethod: 'MasterCard', // STRICT: Only MasterCard
        paymentAccountNumber: settings?.masterCardAccount || '7112808287',
        notes: notes.trim(),
        clientPrice: activeService.price
      });

      setCreatedBooking(result.booking);
      setStep(3); // Proceed to Payment Summary & Transfer
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      const errMsg = error.message || 'فشل في إنشاء الحجز. يرجى مراجعة البيانات والمحاولة مرة أخرى.';
      setServerError(errMsg);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Finalize Payment Proof Submission
  const handleFinalizeBooking = async () => {
    if (!createdBooking) return;
    if (!proofImage) {
      setServerError('يرجى إرفاق صورة إشعار التحويل المالي (إثبات الدفع) لإتمام إرسال الطلب.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await api.submitPaymentProof({
        bookingId: createdBooking.id,
        bookingNumber: createdBooking.bookingNumber,
        phone: createdBooking.phone,
        paymentProofImage: proofImage
      });

      // Advance to full confirmation screen
      onBookingSuccess(result.booking);
    } catch (error: any) {
      setServerError(error.message || 'فشل في رفع إثبات الدفع. يرجى المحاولة ثانية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // The ONLY approved MasterCard account
  const masterCardAccount = settings?.masterCardAccount || '7112808287';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Wizard Header Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200">
              {step}
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-indigo-600 rounded-full inline-block"></span>
                {step === 1 && 'الخطوة ١: اختيار الخدمة المرورية'}
                {step === 2 && 'الخطوة ٢: إدخال معلومات المواطن'}
                {step === 3 && 'الخطوة ٣: مراجعة الطلب والتحويل المالي'}
                {step === 4 && 'الخطوة ٤: إرفاق إثبات الدفع وتأكيد الحجز'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 1 && 'حدد نوع المعاملة المرورية المطلوبة'}
                {step === 2 && 'البيانات الشخصية وفق البطاقة الوطنية أو هوية الأحوال'}
                {step === 3 && 'تحويل رسوم الخدمة إلى الحساب المعتمد'}
                {step === 4 && 'التقاط أو اختيار صورة إشعار التحويل'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            إلغاء
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Global Server Error Alert */}
      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 1: SERVICE SELECTION */}
      {/* ==================================================== */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-indigo-600 rounded-full"></span>
            <span>اختر الخدمة المرورية:</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {services.map(s => (
              <div
                key={s.id}
                onClick={() => setCurrentService(s)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  currentService?.id === s.id
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">{s.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                  {s.note && <span className="inline-block mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{s.note}</span>}
                </div>
                <div className="text-left shrink-0 mr-3">
                  <span className="text-base sm:text-lg font-bold text-indigo-600">{formatIQD(s.price)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                if (currentService) setStep(2);
              }}
              disabled={!currentService}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition cursor-pointer"
            >
              <span>المتابعة إلى إدخال المعلومات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 2: CITIZEN INFORMATION */}
      {/* ==================================================== */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          {/* Selected Service Recap */}
          {currentService && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-700 font-semibold block">الخدمة المرورية المختارة:</span>
                <span className="text-sm sm:text-base font-bold text-slate-900">{currentService.name}</span>
              </div>
              <div className="text-left">
                <span className="text-sm sm:text-base font-bold text-indigo-700">{formatIQD(currentService.price)}</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="block text-[11px] text-indigo-600 hover:underline font-bold mt-0.5 cursor-pointer"
                >
                  تغيير الخدمة
                </button>
              </div>
            </div>
          )}

          {/* Locked Governorate Badge - Mandated by Requirement 1 & Sleek Interface */}
          <div>
            <label className="block text-base sm:text-lg font-black text-slate-800 mb-1.5 tracking-wide">
              المحافظة
            </label>
            <div className="relative">
              <input
                type="text"
                value="نينوى (حصراً)"
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-base text-slate-800 font-bold cursor-not-allowed"
              />
              <span className="absolute left-3 top-3 text-[11px] bg-indigo-100 px-2.5 py-1 rounded text-indigo-800 font-bold">
                محافظة نينوى حصراً
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">الخدمة متاحة حصرياً لمواطني محافظة نينوى فقط.</p>
          </div>

          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-base sm:text-lg font-black text-slate-800 mb-1.5 tracking-wide">
                الاسم الكامل <span className="text-rose-600 font-black">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                }}
                placeholder="أدخل الاسم الثلاثي أو الرباعي كما في البطاقة الوطنية"
                id="booking-fullname-input"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                  errors.fullName ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.fullName ? (
                <p className="text-xs text-rose-600 font-bold mt-1">{errors.fullName}</p>
              ) : (
                <p className="text-xs text-slate-500 font-medium mt-1">يجب إدخال الاسم الثلاثي أو الرباعي وفق الهوية الرسمية (مثال: أحمد محمود يونس الجبوري).</p>
              )}
            </div>

            {/* Surname / Clan */}
            <div>
              <label className="block text-base sm:text-lg font-black text-slate-800 mb-1.5 tracking-wide">
                اللقب / العشيرة <span className="text-rose-600 font-black">*</span>
              </label>
              <input
                type="text"
                value={surname}
                onChange={(e) => {
                  setSurname(e.target.value);
                  if (errors.surname) setErrors(prev => ({ ...prev, surname: '' }));
                }}
                placeholder="مثال: الجبوري / الحيالي / الشمري"
                id="booking-surname-input"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                  errors.surname ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.surname && <p className="text-xs text-rose-600 font-bold mt-1">{errors.surname}</p>}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-base sm:text-lg font-black text-slate-800 mb-1.5 tracking-wide">
                رقم الهاتف <span className="text-rose-600 font-black">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                }}
                placeholder="07xx xxx xxxx"
                dir="ltr"
                id="booking-phone-input"
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition text-left font-mono font-bold ${
                  errors.phone ? 'border-rose-400 bg-rose-50/20 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.phone ? (
                <p className="text-xs text-rose-600 font-bold mt-1">{errors.phone}</p>
              ) : (
                <p className="text-xs text-slate-500 font-medium mt-1">رقم هاتف عراقي فعال للتواصل وتأكيد الحجز عبر WhatsApp أو الاتصال.</p>
              )}
            </div>

            {/* Additional Notes (Optional) */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-slate-700 mb-1.5 tracking-wide">
                ملاحظات إضافية <span className="text-slate-400 text-xs font-normal">(اختياري)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="أي تفاصيل خاصة ترغب بإبلاغ إدارة المرور بها..."
                id="booking-notes-input"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Data Protection & Privacy Trust Note */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                بياناتك الشخصية مشفرة ومحمية بالكامل وفق أعلى معايير أمن المعلومات وحفظ الخصوصية المعتمدة لدى مكتب عبدالله السيد.
              </p>
            </div>
          </div>

          {/* Validation or Server Alert Message */}
          {serverError && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {Object.keys(errors).length > 0 && !serverError && (
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-800 font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>يرجى استكمال الحقول المطلوبة أعلاه والمحددة باللون الأحمر للمتابعة إلى الدفع.</span>
            </div>
          )}

          {/* Navigation */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرجوع</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isSubmitting}
              id="booking-step2-submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جاري معالجة الطلب...</span>
              ) : (
                <>
                  <span>المتابعة للدفع</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 3: ORDER SUMMARY & PAYMENT TRANSFER */}
      {/* ==================================================== */}
      {step === 3 && createdBooking && (
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="text-xs font-semibold text-slate-500">رقم الحجز المبدئي المخصص لك:</span>
                <p className="text-lg font-bold text-indigo-900 font-mono tracking-wider" dir="ltr">
                  {createdBooking.bookingNumber}
                </p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                بانتظار إثبات الدفع
              </span>
            </div>

            {/* Summary Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm sm:text-base mb-4 bg-slate-50/70 p-4 rounded-xl border border-slate-150">
              <div>
                <span className="text-slate-500 block text-xs font-black uppercase mb-0.5">الاسم الرباعي:</span>
                <span className="font-black text-slate-900 text-sm sm:text-base">{createdBooking.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs font-black uppercase mb-0.5">اللقب / العشيرة:</span>
                <span className="font-black text-slate-900 text-sm sm:text-base">{createdBooking.surname}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs font-black uppercase mb-0.5">رقم الهاتف:</span>
                <span className="font-black text-slate-900 font-mono text-sm sm:text-base" dir="ltr">{createdBooking.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs font-black uppercase mb-0.5">المحافظة:</span>
                <span className="font-black text-indigo-700 text-sm sm:text-base">محافظة نينوى (حصراً)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">الخدمة المرورية:</span>
                <span className="font-bold text-slate-900">{createdBooking.serviceName}</span>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-500 block">الإجمالي المطلوب:</span>
                <span className="text-xl font-bold text-indigo-600">{formatIQD(createdBooking.price)}</span>
              </div>
            </div>
          </div>

          {/* Dedicated MasterCard Payment Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-lg mx-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                طريقة الدفع المعتمدة
              </span>
              <div className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xl sm:text-2xl font-black mb-4 shadow-xs">
                <span>💳</span>
                <span>MasterCard</span>
              </div>

              {/* Account Number Box with One-Click Copy */}
              <div className="p-6 rounded-2xl bg-slate-50 border-2 border-indigo-200 text-center relative max-w-md mx-auto shadow-inner">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  رقم الحساب:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono tracking-widest py-1" dir="ltr">
                  {masterCardAccount}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAccount(masterCardAccount)}
                  id="copy-mastercard-number-btn"
                  className="mt-3 inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-bold border border-slate-300 shadow-2xs transition cursor-pointer"
                >
                  {copiedAccount ? (
                    <>
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                      <span>تم نسخ رقم الحساب!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ رقم الحساب</span>
                    </>
                  )}
                </button>
              </div>

              {/* Exact Mandated Payment Phrase */}
              <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm font-medium leading-relaxed">
                يرجى تحويل رسوم الحجز كاملة إلى حساب MasterCard أعلاه، ثم إرفاق صورة واضحة لإثبات التحويل.
              </div>
            </div>

            {/* Exactly Mandated Button: "تم الدفع — إرفاق صورة التحويل" */}
            <div className="pt-4 border-t border-slate-100 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setStep(4);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                id="booking-proceed-to-proof"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-200 transition text-base cursor-pointer"
              >
                <span>تم الدفع — إرفاق صورة التحويل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* STEP 4: ATTACH PAYMENT PROOF */}
      {/* ==================================================== */}
      {step === 4 && createdBooking && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">إرفاق إشعار أو صورة إثبات الدفع</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              التقط صورة واضحة لإشعار التحويل المالي أو اخترها من معرض الصور (JPG, PNG, WEBP — بحد أقصى 5MB).
            </p>
          </div>

          {/* Hidden Inputs for File & Camera */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            capture="environment"
            className="hidden"
          />

          {/* Image Preview Box */}
          {proofImage ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-950 p-2 flex items-center justify-center max-h-96">
                <img
                  src={proofImage}
                  alt="إثبات الدفع"
                  className="max-h-80 w-auto object-contain rounded-xl"
                />
                <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>تم التقاط الإثبات بنجاح</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{proofFileName || 'صورة إشعار التحويل'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setProofImage(null);
                    setProofFileName('');
                  }}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  إلغاء وإعادة الالتقاط
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Camera Trigger */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                id="booking-camera-trigger"
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 transition cursor-pointer text-slate-700 hover:text-indigo-900 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">التقاط عبر كاميرا الهاتف</span>
                <span className="text-[11px] text-slate-400 mt-1">فتح الكاميرا والتقاط الإيصال مباشرة</span>
              </button>

              {/* Gallery Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                id="booking-gallery-trigger"
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer text-slate-700 hover:text-slate-900 group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm">اختيار صورة من المعرض</span>
                <span className="text-[11px] text-slate-400 mt-1">رفع لقطة شاشة من الاستوديو</span>
              </button>
            </div>
          )}

          {/* Critical Notice before submitting */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800 block mb-1">ملاحظة أمنية هامة:</strong>
            يتم فحص صورة الإشعار ومطابقة رقم العملية من قبل موظف الحسابات في إدارة مرور نينوى. لا يتم تأكيد الحجز إلا بعد التحقق من وصول الرسوم بالكامل.
          </div>

          {/* Navigation and Final Submit */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرجوع لبيانات الدفع</span>
            </button>

            <button
              type="button"
              onClick={handleFinalizeBooking}
              disabled={isSubmitting || !proofImage}
              id="booking-final-submit"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جاري إرسال الطلب والإثبات...</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>تأكيد وإرسال طلب الحجز النهائي</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
