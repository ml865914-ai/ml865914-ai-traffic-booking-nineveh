import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:w-80 z-50 flex items-center gap-3 rounded-xl bg-amber-600 px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-xl animate-bounce"
    >
      <WifiOff className="w-5 h-5 shrink-0" />
      <div>
        <p className="font-bold">أنت غير متصل بالإنترنت</p>
        <p className="text-[11px] text-amber-100 font-normal">يتم استخدام البيانات المحفوظة محلياً مؤقتاً.</p>
      </div>
    </div>
  );
};
