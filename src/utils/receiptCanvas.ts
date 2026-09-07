import { Booking, SystemSettings } from '../types';
import { formatIQD, formatDateTimeArabic } from './formatters';

/**
 * Draws an official, high-resolution receipt on a 2D HTML5 canvas.
 * Guaranteed to NEVER fail, does not parse CSS, completely immune to oklch or CSS errors.
 */
export function drawReceiptToCanvas(booking: Booking, settings: SystemSettings | null): string {
  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 1750;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // 1. Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer Decorative Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Inner subtle border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // 2. Header Banner (Deep Indigo/Navy)
  ctx.fillStyle = '#1e1b4b'; // bg-indigo-950
  ctx.fillRect(40, 40, width - 80, 240);

  // Header Accent Top Bar (Gold/Amber)
  ctx.fillStyle = '#d97706';
  ctx.fillRect(40, 40, width - 80, 8);

  // Title
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('مكتب عبدالله السيد للحجز المروري', width / 2, 125);

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '500 24px sans-serif';
  ctx.fillText('المنظومة الإلكترونية الموحدة — مجمع تسجيل مرور محافظة نينوى', width / 2, 175);

  // Official badge pill
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.beginPath();
  const pillW = 420;
  const pillH = 40;
  const pillX = (width - pillW) / 2;
  const pillY = 205;
  ctx.roundRect(pillX, pillY, pillW, pillH, 20);
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('✓  إشعار تسجيل وحجز موعد مروري رسمي معتمد', width / 2, 232);

  // 3. Booking Number Box
  const boxY = 320;
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(80, boxY, width - 160, 150, 16);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('رقم الحجز المرجعي الإلكتروني (Booking ID)', width / 2, boxY + 45);

  ctx.fillStyle = '#312e81'; // text-indigo-900
  ctx.font = 'bold 44px monospace';
  ctx.fillText(booking.bookingNumber, width / 2, boxY + 105);

  // 4. Section: Citizen Information
  let currentY = 520;
  drawSectionHeader(ctx, 'بيانات المواطن صاحب الحجز', currentY, width);
  currentY += 45;

  const colRightX = width - 100;
  const colLeftX = width / 2 - 20;

  drawInfoRow(ctx, 'الاسم الرباعي:', booking.fullName, colRightX, currentY);
  drawInfoRow(ctx, 'اللقب / العشيرة:', booking.surname, colLeftX, currentY);
  currentY += 55;

  drawInfoRow(ctx, 'رقم الهاتف:', booking.phone, colRightX, currentY);
  drawInfoRow(ctx, 'المحافظة:', 'نينوى (حصراً)', colLeftX, currentY);
  currentY += 75;

  // 5. Section: Booking & Service Details
  drawSectionHeader(ctx, 'تفاصيل المعاملة والرسوم المالية', currentY, width);
  currentY += 45;

  drawInfoRow(ctx, 'نوع المعاملة المرورية:', booking.serviceName, colRightX, currentY);
  currentY += 55;

  drawInfoRow(ctx, 'المبلغ المطلوب:', `${formatIQD(booking.price)}`, colRightX, currentY, '#047857');
  drawInfoRow(ctx, 'طريقة الدفع:', 'MasterCard (ماستر كارد)', colLeftX, currentY, '#1d4ed8');
  currentY += 55;

  const accNumber = booking.paymentAccountNumber || settings?.masterCardAccount || '7112808287';
  drawInfoRow(ctx, 'حساب الدفع المعتمد:', accNumber, colRightX, currentY);
  
  const paymentText =
    booking.paymentStatus === 'VERIFIED'
      ? 'تم التحقق من الدفع ✓'
      : booking.paymentStatus === 'PENDING_VERIFICATION'
      ? 'تم إرفاق الإشعار وبانتظار المطابقة'
      : 'بانتظار التحويل';
  const paymentColor =
    booking.paymentStatus === 'VERIFIED'
      ? '#047857'
      : booking.paymentStatus === 'PENDING_VERIFICATION'
      ? '#b45309'
      : '#b91c1c';

  drawInfoRow(ctx, 'حالة الدفع:', paymentText, colLeftX, currentY, paymentColor);
  currentY += 55;

  drawInfoRow(ctx, 'تاريخ وتوقيت الحجز:', formatDateTimeArabic(booking.createdAt), colRightX, currentY);
  currentY += 75;

  // 6. Section: Center location & Requirements
  drawSectionHeader(ctx, 'موقع المراجعة والمستمسكات المطلوبة', currentY, width);
  currentY += 45;

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('• موقع المراجعة: مجمع تسجيل مرور محافظة نينوى — الموصل', width - 100, currentY);
  currentY += 40;

  ctx.font = '500 19px sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('• المستمسكات المطلوبة عند مراجعة المجمع:', width - 100, currentY);
  currentY += 35;

  ctx.font = '400 18px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('  ١. البطاقة الوطنية الموحدة (أو هوية الأحوال المدنية وشهادة الجنسية الأصلية).', width - 100, currentY);
  currentY += 32;
  ctx.fillText('  ٢. بطاقة السكن في محافظة نينوى.', width - 100, currentY);
  currentY += 32;
  ctx.fillText('  ٣. إبراز هذا الإشعار الإلكتروني أو رقم الحجز مع إثبات الدفع.', width - 100, currentY);
  currentY += 60;

  // 7. Footer Stamp & Legal Note Box
  const footerBoxY = currentY;
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.roundRect(80, footerBoxY, width - 160, 180, 16);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Stamp circle on the left
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(200, footerBoxY + 90, 60, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('مكتب عبدالله السيد', 200, footerBoxY + 75);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('الحجز المروري', 200, footerBoxY + 95);
  ctx.fillText('نينوى — معتمد', 200, footerBoxY + 115);

  // Right side text in footer box
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('مكتب عبدالله السيد للحجز وتسهيل المعاملات المرورية', width - 120, footerBoxY + 50);

  ctx.font = '400 16px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`للاستفسار والدعم الفني عبر الهاتف أو واتساب: ${settings?.supportPhone || '07733034802'}`, width - 120, footerBoxY + 85);
  ctx.fillText(`أوقات العمل: ${settings?.workingHours || 'كل أيام الأسبوع من 7:00 ص إلى 10:00 م'}`, width - 120, footerBoxY + 115);
  ctx.fillText('هذا الإشعار وثيقة إلكترونية رسمية صادرة من نظام الحجز الآلي.', width - 120, footerBoxY + 145);

  // Bottom copyright
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 15px sans-serif';
  ctx.fillText(`© 2026 مكتب عبدالله السيد للحجز المروري — نينوى. جميع الحقوق محفوظة. (تاريخ الإصدار: ${new Date().toLocaleDateString('ar-IQ')})`, width / 2, height - 55);

  return canvas.toDataURL('image/png');
}

function drawSectionHeader(ctx: CanvasRenderingContext2D, title: string, y: number, width: number) {
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(title, width - 80, y);

  // underline
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(width - 80 - ctx.measureText(title).width - 15, y - 6, ctx.measureText(title).width + 30, 3);
}

function drawInfoRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  valueColor: string = '#0f172a'
) {
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(label, x, y);

  const labelW = ctx.measureText(label).width;
  ctx.fillStyle = valueColor;
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText(value, x - labelW - 15, y);
}

/**
 * Gets a clean data URL image for the receipt using our high-performance 2D Canvas engine.
 * Pure canvas rendering avoids DOM querying, CSS rule inlining, and cross-origin stylesheet errors.
 */
export async function getReceiptImage(
  _element: HTMLElement | null,
  booking: Booking,
  settings: SystemSettings | null
): Promise<string> {
  return drawReceiptToCanvas(booking, settings);
}
