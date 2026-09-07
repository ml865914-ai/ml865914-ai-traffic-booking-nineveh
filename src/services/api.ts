import { TrafficService, SystemSettings, Booking, AdminStats, CreateBookingPayload, SubmitPaymentProofPayload } from '../types';

// Supports optional custom backend domain if frontend is hosted on GitHub Pages or custom CDN
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const api = {
  // Fetch services
  async getServices(): Promise<TrafficService[]> {
    const res = await fetch(`${API_BASE}/api/services`);
    if (!res.ok) throw new Error('فشل في جلب قائمة الخدمات المرورية');
    const data = await res.json();
    return data.services;
  },

  // Fetch public settings
  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/api/settings`);
    if (!res.ok) throw new Error('فشل في جلب إعدادات المنصة');
    const data = await res.json();
    return data.settings;
  },

  // Create booking
  async createBooking(payload: CreateBookingPayload): Promise<{ booking: Booking; message: string }> {
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل في إنشاء الحجز');
    }
    return data;
  },

  // Submit payment proof
  async submitPaymentProof(payload: SubmitPaymentProofPayload): Promise<{ booking: Booking; message: string }> {
    const res = await fetch(`${API_BASE}/api/bookings/payment-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل في رفع إثبات الدفع');
    }
    return data;
  },

  // Track single booking by number & phone
  async trackBooking(bookingNumber: string, phone: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/api/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingNumber, phone })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'لم يتم العثور على الحجز');
    }
    return data.booking;
  },

  // Admin login
  async adminLogin(password: string): Promise<{ token: string; adminName: string }> {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'كلمة المرور غير صحيحة');
    }
    return data;
  },

  // Admin fetch stats
  async getAdminStats(token: string): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل في جلب الإحصائيات');
    const data = await res.json();
    return data.stats;
  },

  // Admin fetch all bookings
  async getAdminBookings(token: string): Promise<Booking[]> {
    const res = await fetch(`${API_BASE}/api/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('فشل في جلب الحجوزات');
    const data = await res.json();
    return data.bookings;
  },

  // Admin verify payment
  async verifyPayment(token: string, bookingId: string, adminName: string, notes?: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ adminName, notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل في تأكيد الدفع');
    return data.booking;
  },

  // Admin reject payment
  async rejectPayment(token: string, bookingId: string, reason: string, adminName: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/reject-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason, adminName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل في رفض الدفع');
    return data.booking;
  },

  // Admin complete booking
  async completeBooking(token: string, bookingId: string, adminName: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ adminName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل في إنجاز الحجز');
    return data.booking;
  },

  // Admin update notes
  async updateAdminNotes(token: string, bookingId: string, notes: string): Promise<Booking> {
    const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingId}/notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل في تحديث الملاحظات');
    return data.booking;
  },

  // Admin update settings
  async updateSettings(token: string, settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل في حفظ الإعدادات');
    return data.settings;
  },

  // Admin update services
  async updateServices(token: string, services: TrafficService[]): Promise<TrafficService[]> {
    const res = await fetch(`${API_BASE}/api/admin/services`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ services })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل في حفظ الخدمات');
    return data.services;
  }
};
