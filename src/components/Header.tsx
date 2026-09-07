import React from 'react';
import { Shield, Search, Phone, Lock, CheckCircle2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { SystemSettings } from '../types';

interface HeaderProps {
  settings: SystemSettings | null;
  onOpenTrack: () => void;
  onOpenAdmin: () => void;
  onStartBooking: () => void;
  isAdminLoggedIn: boolean;
  showAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenTrack,
  onOpenAdmin,
  onStartBooking,
  isAdminLoggedIn,
  showAdmin = false
}) => {
  return (
    <header className="sticky top-0 z-40 bg-indigo-900 text-white border-b border-indigo-950/60 shadow-lg">
      {/* Top Alert Bar - Governorate Nineveh Notice matching Sleek Interface design */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2 flex items-center justify-center gap-2 text-center text-amber-800 text-xs sm:text-sm font-medium shrink-0">
        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
        <span>تنبيه: خدماتنا متاحة حصرياً لمواطني محافظة نينوى فقط.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm shrink-0">
              <img src="/icon.svg" alt="مكتب عبدالله السيد" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-bold leading-tight text-white tracking-tight">
                  مكتب عبدالله السيد للحجز المروري
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  النظام متصل
                </span>
              </div>
              <p className="text-xs text-white/80 font-normal hidden xs:block">
                تنظيم وتسهيل الخدمات المرورية — نينوى
              </p>
            </div>
          </div>

          {/* Actions & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton />

            {/* Track Booking Button */}
            <button
              onClick={onOpenTrack}
              id="header-track-btn"
              className="flex items-center gap-1.5 bg-indigo-950/60 hover:bg-indigo-800/80 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-indigo-700/60 transition-all cursor-pointer shadow-xs"
              title="تتبع حالة الحجز"
            >
              <Search className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">تتبع الحجز</span>
              <span className="sm:hidden">تتبع</span>
            </button>

            {/* Book Now Quick CTA */}
            <button
              onClick={onStartBooking}
              id="header-book-btn"
              className="hidden md:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-950/30 transition-all cursor-pointer"
            >
              <span>تقديم طلب جديد</span>
            </button>

            {/* Admin Portal Button - Only visible for admin (secret param, logged in, or shortcut) */}
            {showAdmin && (
              <button
                onClick={onOpenAdmin}
                id="header-admin-btn"
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isAdminLoggedIn
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-indigo-950/50 text-indigo-200 border-indigo-800/60 hover:text-white hover:bg-indigo-800/50'
                }`}
                title={isAdminLoggedIn ? 'لوحة الإدارة (نشطة)' : 'دخول الإدارة'}
              >
                <Lock className="w-4 h-4" />
                <span className="hidden lg:inline">{isAdminLoggedIn ? 'لوحة الإدارة' : 'الإدارة'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
