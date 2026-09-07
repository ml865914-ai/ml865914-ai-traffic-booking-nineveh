import React, { useState, useEffect } from 'react';
import { TrafficService, SystemSettings, Booking } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ServicesSection } from './components/ServicesSection';
import { BookingWizard } from './components/BookingWizard';
import { BookingConfirmation } from './components/BookingConfirmation';
import { TrackBookingModal } from './components/TrackBookingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { formatIQD } from './utils/formatters';
import {
  Shield, CheckCircle2, ArrowLeft, ArrowDown, Search,
  Phone, MessageSquare, CreditCard, Sparkles, MapPin,
  Clock, FileCheck, HelpCircle, ChevronDown, Award, Copy, CheckCheck
} from 'lucide-react';

// Fallback initial services matching prompt requirements
const FALLBACK_SERVICES: TrafficService[] = [
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

export default function App() {
  const [view, setView] = useState<'HOME' | 'BOOKING' | 'CONFIRMATION'>('HOME');
  const [services, setServices] = useState<TrafficService[]>(FALLBACK_SERVICES);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [selectedService, setSelectedService] = useState<TrafficService | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Modals
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('nineveh_admin_token') || null;
  });
  const [copiedHomeAccount, setCopiedHomeAccount] = useState(false);

  // Hidden admin access: Only show admin controls if already logged in,
  // or accessed with secret URL param (?admin=1 or #admin), or via secret shortcut (Ctrl+Shift+A)
  const [showAdminAccess, setShowAdminAccess] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const hasAdminParam = urlParams.get('admin') === '1' || urlParams.get('admin') === 'true' || window.location.hash === '#admin';
    const hasToken = !!localStorage.getItem('nineveh_admin_token');
    const wasUnlocked = sessionStorage.getItem('nineveh_admin_unlocked') === 'true';
    return hasAdminParam || hasToken || wasUnlocked;
  });

  // Secret shortcut handler (Ctrl + Shift + A) or secret URL hash listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle admin button visibility with Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setShowAdminAccess((prev) => {
          const nextState = !prev;
          sessionStorage.setItem('nineveh_admin_unlocked', String(nextState));
          return nextState;
        });
        setIsAdminOpen(true);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setShowAdminAccess(true);
        sessionStorage.setItem('nineveh_admin_unlocked', 'true');
        setIsAdminOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Load backend data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, settingsRes] = await Promise.all([
          api.getServices(),
          api.getSettings()
        ]);
        if (servicesRes && servicesRes.length > 0) {
          setServices(servicesRes);
        }
        if (settingsRes) {
          setSettings(settingsRes);
        }
      } catch (err) {
        console.warn('Using local fallback config:', err);
      }
    };
    fetchData();
  }, []);

  const handleAdminAuthChange = (token: string | null) => {
    setAdminToken(token);
    if (token) {
      localStorage.setItem('nineveh_admin_token', token);
    } else {
      localStorage.removeItem('nineveh_admin_token');
    }
  };

  const handleStartBookingWithService = (service: TrafficService) => {
    setSelectedService(service);
    setView('BOOKING');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartGeneralBooking = () => {
    setSelectedService(services[0] || null);
    setView('BOOKING');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingSuccess = (booking: Booking) => {
    setConfirmedBooking(booking);
    setView('CONFIRMATION');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetToHome = () => {
    setView('HOME');
    setSelectedService(null);
    setConfirmedBooking(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const phone = settings?.supportPhone || '07733034802';
  const whatsapp = settings?.whatsappNumber || '07733034802';
  const cleanWa = whatsapp.replace(/\D/g, '').replace(/^0/, '964');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Offline Status Warning */}
      <OfflineIndicator />

      {/* Main Header Navigation */}
      <Header
        settings={settings}
        onOpenTrack={() => setIsTrackOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onStartBooking={handleStartGeneralBooking}
        isAdminLoggedIn={!!adminToken}
        showAdmin={showAdminAccess || !!adminToken}
      />

      <main className="flex-1">
        {/* ==================================================== */}
        {/* VIEW 1: HOME PAGE */}
        {/* ==================================================== */}
        {view === 'HOME' && (
          <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-indigo-950 text-white py-16 sm:py-24 border-b border-indigo-900">
              {/* Subtle background decorative shapes */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40" />

              <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Nineveh Exclusive Notice Badge - Mandated by Requirement 1 & 2 */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs sm:text-sm font-bold mb-6 shadow-inner">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>الخدمة متاحة للمواطنين داخل محافظة نينوى فقط</span>
                </div>

                {/* Primary Hero Heading */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                  مكتب عبدالله السيد للحجز المروري
                </h1>

                {/* Subtitle */}
                <p className="mt-4 text-base sm:text-xl text-indigo-200 font-medium max-w-2xl mx-auto leading-relaxed">
                  احجز معاملتك المرورية بسهولة وسرعة، ادفع الرسوم عبر الحسابات المعتمدة، وتابع موعد مراجعتك إلكترونياً.
                </p>

                {/* CTA Buttons */}
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
                  <button
                    onClick={handleStartGeneralBooking}
                    id="hero-start-booking-btn"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-amber-400/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span>ابدأ الحجز الآن</span>
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsTrackOpen(true)}
                    id="hero-track-btn"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-bold text-base px-6 py-3.5 rounded-2xl border border-white/20 shadow-sm transition-all cursor-pointer"
                  >
                    <Search className="w-5 h-5 text-indigo-300" />
                    <span>تتبع حالة حجزك</span>
                  </button>
                </div>

                {/* Quick Trust Highlights */}
                <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-indigo-200">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>حجز إلكتروني منظم</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>دفع آمن وسريع</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>تدقيق ومراجعة للإيصالات</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>إشعار فوري عبر WhatsApp</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Steps Infographic Section - Mandated by Requirement 2 */}
            <section className="py-12 sm:py-16 bg-slate-100/70 border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase block mb-1">
                    خطوات سهلة ومباشرة
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    كيفية تقديم وتأكيد الحجز المروري
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  {[
                    { step: '١', title: 'اختيار الخدمة', desc: 'حدد نوع المعاملة المرورية المطلوبة' },
                    { step: '٢', title: 'إدخال المعلومات', desc: 'الاسم الرباعي واللقب ورقم الهاتف' },
                    { step: '٣', title: 'مراجعة الطلب', desc: 'التأكد من البيانات ومبلغ الرسوم' },
                    { step: '٤', title: 'التحويل المالي', desc: 'تحويل الرسوم إلى الحساب المعتمد' },
                    { step: '٥', title: 'رفع إثبات الدفع', desc: 'التقاط صورة واضحة لإشعار التحويل' },
                    { step: '٦', title: 'استلام رقم الحجز', desc: 'المتابعة وتأكيد الموعد عبر WhatsApp' }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-center flex flex-col items-center justify-between"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-base mb-3 shadow-inner">
                        {item.step}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 leading-normal">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Services Section with Direct Booking Cards */}
            <ServicesSection
              services={services}
              onSelectService={handleStartBookingWithService}
              allowBookings={settings?.allowBookings !== false}
            />

            {/* Payment Methods Information Section - MasterCard Only */}
            <section id="payment-methods-section" className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>طريقة الدفع المعتمدة</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    حساب الدفع المعتمد لتحويل رسوم الحجز
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2">
                    {settings?.paymentNotice || 'يرجى تحويل رسوم الحجز كاملة إلى حساب MasterCard المعتمد، ثم إرفاق صورة واضحة لإثبات التحويل.'}
                  </p>
                </div>

                <div className="max-w-xl mx-auto">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-200 shadow-md text-center">
                    <div className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xl font-black mb-4">
                      <span>💳</span>
                      <span>MasterCard</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                      <span className="text-xs font-semibold text-slate-500 block mb-1">رقم الحساب المعتمد:</span>
                      <div className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono tracking-widest py-1" dir="ltr">
                        {settings?.masterCardAccount || '7112808287'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings?.masterCardAccount || '7112808287');
                          setCopiedHomeAccount(true);
                          setTimeout(() => setCopiedHomeAccount(false), 2500);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-bold border border-slate-300 shadow-2xs transition cursor-pointer"
                      >
                        {copiedHomeAccount ? (
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

                    <p className="text-xs sm:text-sm text-amber-950 bg-amber-50 border border-amber-200 p-3.5 rounded-xl font-medium leading-relaxed">
                      يرجى تحويل رسوم الحجز كاملة إلى حساب MasterCard أعلاه، ثم إرفاق صورة واضحة لإثبات التحويل.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Citizen Requirements & Instructions */}
            <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
              <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    المستمسكات المطلوبة عند مراجعة مجمع المرور
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2">
                    يرجى اصطحاب المستمسكات الرسمية التالية في اليوم المحدد لمراجعتك في مجمع تسجيل مرور نينوى
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">البطاقة الوطنية الموحدة</strong>
                      <span className="text-xs text-slate-500">أو هوية الأحوال المدنية وشهادة الجنسية (الأصل والمصورة).</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">بطاقة السكن في محافظة نينوى</strong>
                      <span className="text-xs text-slate-500">تثبت إقامة المواطن داخل الرقعة الجغرافية لمحافظة نينوى.</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">رقم الحجز وإشعار الدفع</strong>
                      <span className="text-xs text-slate-500">حفظ صورة الإشعار ورقم الحجز (TR-NIN-2026-XXXXXX) على هاتفك.</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: BOOKING WIZARD */}
        {/* ==================================================== */}
        {view === 'BOOKING' && (
          <BookingWizard
            services={services}
            selectedService={selectedService}
            settings={settings}
            onBookingSuccess={handleBookingSuccess}
            onCancel={handleResetToHome}
          />
        )}

        {/* ==================================================== */}
        {/* VIEW 3: BOOKING CONFIRMATION & RECEIPT */}
        {/* ==================================================== */}
        {view === 'CONFIRMATION' && confirmedBooking && (
          <BookingConfirmation
            booking={confirmedBooking}
            settings={settings}
            onReset={handleResetToHome}
            onOpenTrack={() => setIsTrackOpen(true)}
          />
        )}
      </main>

      {/* Track Booking Modal */}
      <TrackBookingModal
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
        prefillBookingNumber={confirmedBooking?.bookingNumber || ''}
        prefillPhone={confirmedBooking?.phone || ''}
      />

      {/* Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        services={services}
        settings={settings}
        onSettingsUpdated={(updatedSettings, updatedServices) => {
          setSettings(updatedSettings);
          setServices(updatedServices);
        }}
        adminToken={adminToken}
        onAdminAuthChange={handleAdminAuthChange}
      />

      {/* Floating Mobile Quick Action Bar */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 print:hidden">
        <a
          href={`https://wa.me/${cleanWa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600 text-white shadow-xl hover:bg-emerald-500 transition hover:scale-105 cursor-pointer"
          title="تواصل معنا عبر WhatsApp"
        >
          <MessageSquare className="w-6 h-6" />
        </a>
        <a
          href={`tel:${phone}`}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition hover:scale-105 cursor-pointer"
          title="اتصال هاتفي مباشر"
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenTrack={() => setIsTrackOpen(true)}
        onStartBooking={handleStartGeneralBooking}
        onOpenAdmin={() => {
          setShowAdminAccess(true);
          sessionStorage.setItem('nineveh_admin_unlocked', 'true');
          setIsAdminOpen(true);
        }}
      />
    </div>
  );
}
