import React from 'react';
import { TrafficService } from '../types';
import { formatIQD } from '../utils/formatters';
import { Award, Eye, FileText, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ServicesSectionProps {
  services: TrafficService[];
  onSelectService: (service: TrafficService) => void;
  allowBookings: boolean;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectService,
  allowBookings
}) => {
  // Helper to render distinctive service icons matching Sleek Interface theme
  const getServiceIcon = (id: string, isFeatured: boolean) => {
    if (isFeatured) {
      return (
        <div className="p-2.5 bg-white/20 text-white rounded-xl">
          <Sparkles className="w-6 h-6" />
        </div>
      );
    }
    switch (id) {
      case 'license':
        return (
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        );
      case 'vision_drug':
        return (
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Eye className="w-6 h-6" />
          </div>
        );
      case 'ownership':
        return (
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <section id="services-section" className="py-12 sm:py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 mb-3">
            <span>محافظة نينوى</span>
            <span>•</span>
            <span>الرسوم المعتمدة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            الخدمات المرورية والرسوم الرسمية
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 font-medium">
            اختر الخدمة المطلوبة لبدء إجراءات تقديم طلب الحجز واستكمال التحويل المالي وإرفاق إثبات الدفع.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const isFeatured = service.id === 'full_service';

            return (
              <div
                key={service.id}
                id={`service-card-${service.id}`}
                className={`relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer ${
                  isFeatured
                    ? 'bg-indigo-600 border border-indigo-700 shadow-xl text-white relative overflow-hidden group'
                    : 'bg-white border border-slate-200 shadow-xs hover:border-indigo-500 hover:shadow-md'
                }`}
              >
                {/* Glow for featured card in Sleek Interface */}
                {isFeatured && (
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div>
                  {/* Top Bar: Icon + Price */}
                  <div className="flex items-start justify-between mb-4">
                    {getServiceIcon(service.id, isFeatured)}
                    <span className={`text-xl font-bold font-sans ${isFeatured ? 'text-white' : 'text-indigo-600'}`}>
                      {formatIQD(service.price)}
                    </span>
                  </div>

                  {/* Service Name */}
                  <h3 className={`text-base sm:text-lg font-bold leading-snug mb-2 ${isFeatured ? 'text-white' : 'text-slate-900'}`}>
                    {service.name}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs leading-relaxed mb-4 ${isFeatured ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {service.description}
                  </p>

                  {/* Note Badge (such as "يشمل رسوم الدفع المسبق") */}
                  {service.note && (
                    <div className={`mb-4 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      isFeatured
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isFeatured ? 'text-white' : 'text-emerald-600'}`} />
                      <span>{service.note}</span>
                    </div>
                  )}
                </div>

                <div className={`pt-4 border-t ${isFeatured ? 'border-indigo-500/50' : 'border-slate-100'}`}>
                  {/* Action Button */}
                  <button
                    onClick={() => onSelectService(service)}
                    disabled={!allowBookings}
                    id={`book-service-btn-${service.id}`}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-150 cursor-pointer ${
                      !allowBookings
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : isFeatured
                        ? 'bg-white text-indigo-900 hover:bg-indigo-50 shadow-md'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
                    }`}
                  >
                    <span>احجز الآن</span>
                    <ArrowLeft className="w-4 h-4 rtl:rotate-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reception Status alert if closed */}
        {!allowBookings && (
          <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-center text-amber-900 text-sm font-semibold">
            نعتذر، استقبال الحجوزات متوقف حالياً بأمر إدارة النظام. يرجى المحاولة لاحقاً.
          </div>
        )}
      </div>
    </section>
  );
};
