import React, { useState } from 'react';
import { SystemSettings, TrafficService } from '../types';
import { api } from '../services/api';
import { X, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  services: TrafficService[];
  token: string;
  onSettingsUpdated: (updated: SystemSettings, updatedServices: TrafficService[]) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  settings: initialSettings,
  services: initialServices,
  token,
  onSettingsUpdated
}) => {
  const [siteName, setSiteName] = useState(initialSettings.siteName);
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber);
  const [supportPhone, setSupportPhone] = useState(initialSettings.supportPhone);
  const [workingHours, setWorkingHours] = useState(initialSettings.workingHours);
  const [allowBookings, setAllowBookings] = useState(initialSettings.allowBookings);
  const [closedReasonMessage, setClosedReasonMessage] = useState(initialSettings.closedReasonMessage || '');
  const [paymentNotice, setPaymentNotice] = useState(initialSettings.paymentNotice || '');
  const [masterCardAccount, setMasterCardAccount] = useState(initialSettings.masterCardAccount || '7112808287');

  // Services list & prices
  const [services, setServices] = useState<TrafficService[]>(initialServices);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  // Update service price or name
  const handleUpdateService = (id: string, field: keyof TrafficService, val: any) => {
    setServices(
      services.map(s => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  // Save all settings to backend
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      // 1. Update settings
      const updatedSettings = await api.updateSettings(token, {
        siteName,
        whatsappNumber,
        supportPhone,
        workingHours,
        allowBookings,
        closedReasonMessage,
        paymentNotice,
        masterCardAccount
      });

      // 2. Update services
      const updatedServices = await api.updateServices(token, services);

      setFeedback({ type: 'success', message: 'تم حفظ كافة التعديلات والأسعار بنجاح!' });
      onSettingsUpdated(updatedSettings, updatedServices);
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل في حفظ الإعدادات.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 bg-indigo-950 border-b border-indigo-900 text-white">
          <div>
            <h3 className="text-base font-bold">إعدادات المنصة والأسعار (لوحة الإدارة)</h3>
            <p className="text-xs text-indigo-200">التحكم بأرقام التواصل، حساب MasterCard المعتمد، وأسعار الخدمات</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveAll} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Section: Booking Reception Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">استقبال الحجوزات الجديدة</h4>
              <p className="text-xs text-slate-500">
                {allowBookings ? 'المنصة تستقبل الحجوزات بشكل طبيعي' : 'استقبال الحجوزات معطل ومغلق مؤقتاً'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAllowBookings(!allowBookings)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                allowBookings
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              {allowBookings ? 'نشط (مفتوح)' : 'معطل (مغلق)'}
            </button>
          </div>

          {!allowBookings && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رسالة إغلاق الحجز المخصصة (تظهر للمواطنين)
              </label>
              <input
                type="text"
                value={closedReasonMessage}
                onChange={(e) => setClosedReasonMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          )}

          {/* Section: Contact & WhatsApp */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 border-b pb-2">بيانات التواصل والدعم</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم WhatsApp الرسمي</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف الاتصال</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">أوقات وساعات العمل</label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نص تعليمات التحويل المالي</label>
              <textarea
                value={paymentNotice}
                onChange={(e) => setPaymentNotice(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Section: Service Prices */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-900 border-b pb-2">
              أسعار الخدمات المرورية (تُحفظ في السيرفر وتُطبق تلقائياً)
            </h4>
            <div className="space-y-2.5">
              {services.map((svc) => (
                <div key={svc.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">{svc.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{svc.id}</span>
                  </div>
                  <div className="w-36 flex items-center gap-1">
                    <input
                      type="number"
                      value={svc.price}
                      onChange={(e) => handleUpdateService(svc.id, 'price', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-left"
                    />
                    <span className="text-xs text-slate-500 shrink-0">د.ع</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Approved MasterCard Account Only */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>💳</span>
                <span>طريقة وحساب الدفع المعتمد (MasterCard)</span>
              </h4>
              <p className="text-xs text-slate-500">
                طريقة الدفع الحصرية المعتمدة لاستلام رسوم الحجوزات
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  طريقة الدفع المعتمدة
                </label>
                <input
                  type="text"
                  value="MasterCard (ماستركارد)"
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 text-sm font-bold text-slate-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم حساب MasterCard المعتمد
                </label>
                <input
                  type="text"
                  value={masterCardAccount}
                  onChange={(e) => setMasterCardAccount(e.target.value)}
                  dir="ltr"
                  placeholder="7112808287"
                  className="w-full px-3 py-2 rounded-xl border border-indigo-300 bg-white text-base font-black font-mono tracking-wider text-right"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  الحساب المعتمد المخصص: 7112808287
                </p>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-200 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
