import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        id="pwa-install-btn"
        className="flex items-center gap-2 rounded-xl bg-blue-700/90 hover:bg-blue-600 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm border border-blue-500/30 transition-all duration-200 cursor-pointer"
        title="تثبيت التطبيق على جهازك"
      >
        <Download className="w-4 h-4" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          id="pwa-install-ios-btn"
          className="flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>تثبيت على آيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">تثبيت التطبيق على أجهزة آبل (iOS)</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
                  <p>اضغط على زر المشاركة <strong className="text-blue-700">(Share ⎙)</strong> في شريط متصفح Safari السفلي.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
                  <p>اختر <strong className="text-blue-700">"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
                  <p>اضغط على <strong className="text-blue-700">إضافة (Add)</strong> بالأعلى لتثبيت أيقونة التطبيق واستخدامه بسرعة كبرنامج مستقل.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
