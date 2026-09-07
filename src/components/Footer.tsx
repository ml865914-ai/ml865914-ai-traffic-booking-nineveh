import React from 'react';
import { Phone, MessageSquare, MapPin, Clock, ShieldAlert, CheckCircle } from 'lucide-react';
import { SystemSettings } from '../types';

interface FooterProps {
  settings: SystemSettings | null;
  onOpenTrack: () => void;
  onStartBooking: () => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenTrack, onStartBooking, onOpenAdmin }) => {
  const phone = settings?.supportPhone || '07733034802';
  const whatsapp = settings?.whatsappNumber || '07733034802';
  const cleanPhone = whatsapp.replace(/\D/g, '');
  const cleanWaNumber = cleanPhone.startsWith('0') ? '964' + cleanPhone.slice(1) : cleanPhone;

  return (
    <footer className="bg-indigo-950 text-slate-300 border-t border-indigo-900 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contact and Support Bar */}
        <div className="bg-indigo-900/90 rounded-2xl p-6 border border-indigo-800 shadow-xl mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-right">
            <div className="w-12 h-12 rounded-xl bg-indigo-800 text-indigo-300 border border-indigo-700 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-indigo-200 font-medium">للاستفسار والدعم الفني المباشر</p>
              <p className="text-lg sm:text-xl font-bold text-white" dir="ltr">{phone}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <a
              href={`tel:${phone}`}
              id="footer-call-btn"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال هاتفي</span>
            </a>

            <a
              href={`https://wa.me/${cleanWaNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              id="footer-whatsapp-btn"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>محادثة WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-indigo-900/80">
          {/* Column 1: About & Scope */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-700 p-1 flex items-center justify-center">
                <img src="/icon.svg" alt="مكتب عبدالله السيد" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-base font-bold text-white">مكتب عبدالله السيد للحجز المروري</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
              منصة متخصصة تهدف إلى تسهيل وتنظيم إجراءات حجز المواعيد والمعاملات المرورية للمواطنين داخل محافظة نينوى، لتوفير الوقت والجهد وتجنب الازدحام.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              <MapPin className="w-4 h-4" />
              <span>نطاق الخدمة: محافظة نينوى فقط</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              <span>روابط سريعة</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <button onClick={onStartBooking} className="hover:text-amber-300 transition cursor-pointer">
                  • تقديم طلب حجز جديد
                </button>
              </li>
              <li>
                <button onClick={onOpenTrack} className="hover:text-amber-300 transition cursor-pointer">
                  • استعلام وتتبع حالة الحجز
                </button>
              </li>
              <li>
                <a href="#services-section" className="hover:text-amber-300 transition">
                  • جدول الخدمات والأسعار الرسمية
                </a>
              </li>
              <li>
                <a href="#payment-methods-section" className="hover:text-amber-300 transition">
                  • الحسابات المالية المعتمدة للتحويل
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Working Hours & Location */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>أوقات وساعات العمل</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-3">
              {settings?.workingHours || 'كل أيام الأسبوع: من الساعة 7:00 صباحاً إلى الساعة 10:00 مساءً'}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              الموقع الجغرافي: جمهورية العراق — محافظة نينوى — مجمع تسجيل مرور نينوى.
            </p>
          </div>
        </div>

        {/* Legal Disclaimer Box - Strictly mandated by Requirement 26 */}
        <div className="mt-8 p-4 sm:p-5 rounded-xl bg-indigo-900/60 border border-amber-500/30 text-amber-200/90 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-1">تنبيه قانوني وتنظيمي هام:</strong>
            <p>
              هذه المنصة تستقبل وتنظم طلبات الحجز والخدمات فقط، ولا تمثل جهة حكومية ما لم يتم الإعلان عن وجود ارتباط رسمي بها. يتم تدقيق ومراجعة الحجوزات ومطابقة إثباتات الدفع من قبل إدارة المنصة قبل تأكيد الموعد للمواطن.
            </p>
          </div>
        </div>

        {/* Bottom copyright - With confidential triple-click to open admin panel */}
        <div className="mt-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1">
          <p
            onClick={() => {
              if (onOpenAdmin) onOpenAdmin();
            }}
            className="select-none transition cursor-default hover:text-slate-400"
            title=""
          >
            © 2026 مكتب عبدالله السيد للحجز المروري — نينوى. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};
