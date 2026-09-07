import React, { useState, useEffect } from 'react';
import { Booking, AdminStats, TrafficService, SystemSettings, PaymentStatus, BookingStatus } from '../types';
import { formatIQD, formatDateTimeArabic } from '../utils/formatters';
import { api } from '../services/api';
import { AdminSettingsModal } from './AdminSettingsModal';
import {
  Lock, KeyRound, LogOut, RefreshCw, Search, Filter, CheckCircle2,
  XCircle, Clock, Eye, AlertCircle, Phone, MessageSquare, Settings,
  TrendingUp, Calendar, CheckSquare, X, ZoomIn, FileText, ArrowUpDown
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  services: TrafficService[];
  settings: SystemSettings | null;
  onSettingsUpdated: (updated: SystemSettings, updatedServices: TrafficService[]) => void;
  adminToken: string | null;
  onAdminAuthChange: (token: string | null) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  services,
  settings,
  onSettingsUpdated,
  adminToken,
  onAdminAuthChange
}) => {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Selected Booking Drawer/Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fullscreen Image Zoom
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Settings Modal Toggle
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load dashboard data when token is present
  useEffect(() => {
    if (adminToken && isOpen) {
      loadDashboardData();
    }
  }, [adminToken, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await api.adminLogin(password);
      onAdminAuthChange(res.token);
    } catch (err: any) {
      setLoginError(err.message || 'كلمة المرور غير صحيحة.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    onAdminAuthChange(null);
    setSelectedBooking(null);
  };

  const loadDashboardData = async () => {
    if (!adminToken) return;
    setLoading(true);
    setError(null);

    try {
      const [statsData, bookingsData] = await Promise.all([
        api.getAdminStats(adminToken),
        api.getAdminBookings(adminToken)
      ]);
      setStats(statsData);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل بيانات الإدارة.');
    } finally {
      setLoading(false);
    }
  };

  // Actions on selected booking
  const handleVerifyPayment = async () => {
    if (!adminToken || !selectedBooking) return;
    setActionLoading(true);
    try {
      const updated = await api.verifyPayment(
        adminToken,
        selectedBooking.id,
        'مدير النظام',
        adminNotesInput
      );
      setSelectedBooking(updated);
      setBookings(bookings.map(b => (b.id === updated.id ? updated : b)));
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'فشل في تأكيد الدفع.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!adminToken || !selectedBooking || !rejectReason.trim()) {
      alert('يرجى تحديد سبب الرفض.');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await api.rejectPayment(
        adminToken,
        selectedBooking.id,
        rejectReason.trim(),
        'مدير النظام'
      );
      setSelectedBooking(updated);
      setBookings(bookings.map(b => (b.id === updated.id ? updated : b)));
      setShowRejectPrompt(false);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'فشل في رفض الدفع.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteBooking = async () => {
    if (!adminToken || !selectedBooking) return;
    setActionLoading(true);
    try {
      const updated = await api.completeBooking(adminToken, selectedBooking.id, 'مدير النظام');
      setSelectedBooking(updated);
      setBookings(bookings.map(b => (b.id === updated.id ? updated : b)));
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'فشل في إنجاز الحجز.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!adminToken || !selectedBooking) return;
    try {
      const updated = await api.updateAdminNotes(adminToken, selectedBooking.id, adminNotesInput);
      setSelectedBooking(updated);
      setBookings(bookings.map(b => (b.id === updated.id ? updated : b)));
    } catch (err: any) {
      alert(err.message || 'فشل في حفظ الملاحظات.');
    }
  };

  // Filter & Search Logic
  const filteredBookings = bookings
    .filter(b => {
      // Filter tab
      if (activeFilter === 'PENDING_VERIFICATION') {
        return b.paymentStatus === PaymentStatus.PENDING_VERIFICATION;
      }
      if (activeFilter === 'CONFIRMED') {
        return b.bookingStatus === BookingStatus.CONFIRMED;
      }
      if (activeFilter === 'REJECTED') {
        return b.bookingStatus === BookingStatus.REJECTED || b.paymentStatus === PaymentStatus.REJECTED;
      }
      if (activeFilter === 'COMPLETED') {
        return b.bookingStatus === BookingStatus.COMPLETED;
      }
      return true;
    })
    .filter(b => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        b.fullName.toLowerCase().includes(q) ||
        b.surname.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.bookingNumber.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-7xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 flex flex-col min-h-[90vh] max-h-[95vh]">
        {/* Top App Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-indigo-950 border-b border-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-amber-400 border border-white/20 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                لوحة إدارة الحجوزات المرورية — نينوى
              </h2>
              <p className="text-[11px] sm:text-xs text-indigo-200">
                مراجعة إثباتات الدفع، تدقيق الحسابات، وإدارة الأسعار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminToken && (
              <>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-900 hover:bg-indigo-800 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-700 transition cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">إعدادات المنصة والأسعار</span>
                </button>

                <button
                  onClick={loadDashboardData}
                  className="p-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-slate-300 transition cursor-pointer"
                  title="تحديث البيانات"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-800 transition cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* LOGIN SCREEN (If not authenticated) */}
        {/* ==================================================== */}
        {!adminToken ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">تسجيل دخول الإدارة</h3>
              <p className="text-xs text-slate-500 mb-6">
                يرجى إدخال كلمة مرور مسؤول النظام لإدارة الحجوزات
              </p>

              <form onSubmit={handleLogin} className="space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">كلمة المرور</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="كلمة مرور الإدارة (افتراضياً: admin123)"
                    id="admin-password-input"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-rose-600 font-semibold">{loginError}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  id="admin-login-submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? 'جاري التحقق...' : 'تسجيل الدخول'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* AUTHENTICATED DASHBOARD */
          /* ==================================================== */
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-6">
            {/* 10 Dashboard Stats Cards - Mandated by Requirement 10 */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-bold block">إجمالي الحجوزات</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                    {stats.totalBookings}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-bold block">حجوزات اليوم</span>
                  <span className="text-xl sm:text-2xl font-black text-indigo-600 mt-1 block">
                    {stats.todayBookings}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs">
                  <span className="text-xs text-amber-800 font-bold block">بانتظار التحقق (جديدة)</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-700 mt-1 block">
                    {stats.pendingVerification}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
                  <span className="text-xs text-emerald-800 font-bold block">الحجوزات المؤكدة</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
                    {stats.confirmedBookings}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-2xs">
                  <span className="text-xs text-rose-800 font-bold block">الحجوزات المرفوضة</span>
                  <span className="text-xl sm:text-2xl font-black text-rose-700 mt-1 block">
                    {stats.rejectedBookings}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-bold block">بانتظار الدفع</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-700 mt-1 block">
                    {stats.pendingPayment}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-bold block">المعاملات المنجزة</span>
                  <span className="text-xl sm:text-2xl font-black text-teal-700 mt-1 block">
                    {stats.completedBookings}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-bold block">إيرادات اليوم</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-700 mt-1 block">
                    {formatIQD(stats.todayRevenue)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-bold block">إيرادات الشهر</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-700 mt-1 block">
                    {formatIQD(stats.monthRevenue)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-900 text-white shadow-2xs">
                  <span className="text-xs text-indigo-200 font-bold block">إجمالي المبالغ المدققة</span>
                  <span className="text-lg sm:text-xl font-black text-amber-300 mt-1 block">
                    {formatIQD(stats.totalRevenue)}
                  </span>
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  الكل ({bookings.length})
                </button>

                <button
                  onClick={() => setActiveFilter('PENDING_VERIFICATION')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'PENDING_VERIFICATION'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>بانتظار التحقق ({stats?.pendingVerification || 0})</span>
                </button>

                <button
                  onClick={() => setActiveFilter('CONFIRMED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeFilter === 'CONFIRMED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  المؤكدة ({stats?.confirmedBookings || 0})
                </button>

                <button
                  onClick={() => setActiveFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeFilter === 'REJECTED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  المرفوضة ({stats?.rejectedBookings || 0})
                </button>

                <button
                  onClick={() => setActiveFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeFilter === 'COMPLETED'
                      ? 'bg-teal-600 text-white'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                  }`}
                >
                  المنجزة ({stats?.completedBookings || 0})
                </button>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث بالاسم، الهاتف، رقم الحجز..."
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  title={sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold">رقم الحجز</th>
                      <th className="p-3 font-bold">اسم المواطن</th>
                      <th className="p-3 font-bold">الهاتف</th>
                      <th className="p-3 font-bold">الخدمة</th>
                      <th className="p-3 font-bold">المبلغ</th>
                      <th className="p-3 font-bold">حالة الدفع</th>
                      <th className="p-3 font-bold">حالة الحجز</th>
                      <th className="p-3 font-bold">التاريخ والوقت</th>
                      <th className="p-3 font-bold text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          لا توجد حجوزات مطابقة لمعايير البحث أو الفلتر المحددة.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-blue-50/40 transition cursor-pointer"
                          onClick={() => {
                            setSelectedBooking(b);
                            setAdminNotesInput(b.adminNotes || '');
                            setShowRejectPrompt(false);
                          }}
                        >
                          <td className="p-3 font-mono font-bold text-indigo-950" dir="ltr">
                            {b.bookingNumber}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {b.fullName} ({b.surname})
                          </td>
                          <td className="p-3 font-mono text-slate-700" dir="ltr">
                            {b.phone}
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {b.serviceName}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {formatIQD(b.price)}
                          </td>
                          <td className="p-3">
                            {b.paymentStatus === PaymentStatus.VERIFIED && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                مدفوع (مؤكد)
                              </span>
                            )}
                            {b.paymentStatus === PaymentStatus.PENDING_VERIFICATION && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                بانتظار التدقيق
                              </span>
                            )}
                            {b.paymentStatus === PaymentStatus.REJECTED && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                مرفوض
                              </span>
                            )}
                            {b.paymentStatus === PaymentStatus.UNPAID && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                غير مدفوع
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-700">
                              {b.bookingStatus === BookingStatus.CONFIRMED && 'مؤكد'}
                              {b.bookingStatus === BookingStatus.PAYMENT_REVIEW && 'قيد المراجعة'}
                              {b.bookingStatus === BookingStatus.PENDING_PAYMENT && 'بانتظار الدفع'}
                              {b.bookingStatus === BookingStatus.REJECTED && 'مرفوض'}
                              {b.bookingStatus === BookingStatus.COMPLETED && 'منجز'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {formatDateTimeArabic(b.createdAt)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(b);
                                setAdminNotesInput(b.adminNotes || '');
                              }}
                              className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition cursor-pointer"
                            >
                              معاينة
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* SELECTED BOOKING REVIEW MODAL / DRAWER */}
        {/* ==================================================== */}
        {selectedBooking && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
              {/* Header */}
              <div className="flex items-center justify-between p-5 bg-indigo-950 border-b border-indigo-900 text-white">
                <div>
                  <h3 className="text-base font-bold">
                    تفاصيل الحجز رقم: {selectedBooking.bookingNumber}
                  </h3>
                  <p className="text-xs text-indigo-200">
                    مقدم من المواطن: {selectedBooking.fullName} ({selectedBooking.surname})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="rounded-xl p-2 text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block">الاسم الرباعي:</span>
                    <strong className="text-slate-900">{selectedBooking.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">اللقب / العشيرة:</span>
                    <strong className="text-slate-900">{selectedBooking.surname}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">رقم الهاتف:</span>
                    <strong className="text-slate-900 font-mono" dir="ltr">{selectedBooking.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المحافظة:</span>
                    <strong className="text-indigo-700 font-bold">نينوى (معتمد)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">الخدمة المرورية:</span>
                    <strong className="text-slate-900">{selectedBooking.serviceName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المبلغ الرسمي:</span>
                    <strong className="text-indigo-600 font-bold">{formatIQD(selectedBooking.price)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">طريقة الدفع:</span>
                    <strong className="text-slate-900 font-bold">💳 MasterCard</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">حساب الاستلام:</span>
                    <strong className="text-slate-900 font-mono" dir="ltr">{selectedBooking.paymentAccountNumber || '7112808287'}</strong>
                  </div>
                </div>

                {/* Direct Contact Buttons */}
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${selectedBooking.phone.replace(/\D/g, '').replace(/^0/, '964')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>مراسلة عبر WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${selectedBooking.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>اتصال بالمواطن</span>
                  </a>
                </div>

                {/* Payment Proof Image Viewer with Zoom Capability */}
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-2">صورة إثبات التحويل المالي:</span>
                  {selectedBooking.paymentProofUrl ? (
                    <div className="relative rounded-2xl border-2 border-slate-300 bg-slate-950 p-2 flex items-center justify-center group overflow-hidden">
                      <img
                        src={selectedBooking.paymentProofUrl}
                        alt="إثبات الدفع"
                        className="max-h-72 w-auto object-contain rounded-xl cursor-pointer"
                        onClick={() => setZoomImage(selectedBooking.paymentProofUrl)}
                      />
                      <button
                        onClick={() => setZoomImage(selectedBooking.paymentProofUrl)}
                        className="absolute bottom-4 left-4 bg-white/90 hover:bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <ZoomIn className="w-4 h-4" />
                        <span>تكبير الصورة</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-100 border border-slate-200 text-center text-slate-400 text-xs font-medium">
                      لم يقم المواطن برفع صورة إثبات الدفع بعد.
                    </div>
                  )}
                </div>

                {/* Audit Trail & Notes */}
                {selectedBooking.verifiedAt && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    تم التدقيق بواسطة: <strong>{selectedBooking.verifiedBy || 'مدير النظام'}</strong> بتاريخ{' '}
                    {formatDateTimeArabic(selectedBooking.verifiedAt)}
                  </div>
                )}

                {/* Internal Admin Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">ملاحظات الإدارة الداخلية</label>
                    <button
                      onClick={handleSaveNotes}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      حفظ الملاحظة
                    </button>
                  </div>
                  <textarea
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    rows={2}
                    placeholder="ملاحظات الحسابات والتدقيق..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                {/* Rejection Prompt Box */}
                {showRejectPrompt && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                    <label className="block text-xs font-bold text-rose-900">
                      سبب رفض الدفع (سيظهر للمواطن عند الاستعلام):
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="مثال: الإشعار غير واضح / المبلغ المحول ناقص..."
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs bg-white text-rose-900"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleRejectPayment}
                        disabled={actionLoading || !rejectReason.trim()}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        تأكيد قرار الرفض
                      </button>
                      <button
                        onClick={() => setShowRejectPrompt(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 px-2"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleVerifyPayment}
                    disabled={actionLoading || selectedBooking.paymentStatus === PaymentStatus.VERIFIED}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد الدفع واعتماد الحجز</span>
                  </button>

                  <button
                    onClick={() => setShowRejectPrompt(true)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>رفض الدفع</span>
                  </button>

                  <button
                    onClick={handleCompleteBooking}
                    disabled={actionLoading || selectedBooking.bookingStatus === BookingStatus.COMPLETED}
                    className="flex items-center justify-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>إنجاز المعاملة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Image Zoom Modal */}
        {zoomImage && (
          <div
            className="fixed inset-0 z-70 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-pointer"
            onClick={() => setZoomImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={zoomImage}
                alt="إثبات الدفع مكبر"
                className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/20"
              />
              <button
                onClick={() => setZoomImage(null)}
                className="absolute top-4 right-4 bg-white/30 hover:bg-white text-slate-900 p-2 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Admin Settings Modal */}
        {settings && showSettingsModal && adminToken && (
          <AdminSettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            settings={settings}
            services={services}
            token={adminToken}
            onSettingsUpdated={(updated, updatedServices) => {
              onSettingsUpdated(updated, updatedServices);
              loadDashboardData();
            }}
          />
        )}
      </div>
    </div>
  );
};
