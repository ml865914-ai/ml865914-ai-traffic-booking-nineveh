export function normalizeArabicDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

export function normalizeIraqiPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = normalizeArabicDigits(phone).replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('+964')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('00964')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.startsWith('964')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  if (/^7[3-9]\d{8}$/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
}

export function isValidIraqiPhone(phone: string): boolean {
  const norm = normalizeIraqiPhone(phone);
  return /^07[3-9]\d{8}$/.test(norm);
}

/**
 * Iraqi Dinar currency formatter & date helpers
 */

export function formatIQD(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    maximumFractionDigits: 0
  }).format(amount) + ' د.ع';
}

export function formatDateTimeArabic(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateOnlyArabic(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatTimeOnlyArabic(isoString: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return isoString;
  }
}
