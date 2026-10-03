// Utility helpers for Madrasa Arabia Madina Tul Uloom

export const formatCNIC = (value: string): string => {
  // Extract only digits
  const clean = value.replace(/\D/g, '').slice(0, 13);
  if (clean.length <= 5) return clean;
  if (clean.length <= 12) return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  return `${clean.slice(0, 5)}-${clean.slice(5, 12)}-${clean.slice(12, 13)}`;
};

export const isValidCNIC = (cnic: string): boolean => {
  const digits = cnic.replace(/\D/g, '');
  return digits.length === 13;
};

export const CNIC_ERROR_MSG = 'درست 13 ہندسوں والا شناختی کارڈ نمبر درج کریں۔ (مثال: 17301-1234567-1)';

export const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount) + ' روپے';
};

export const calculateGrade = (percentage: number): { grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F'; pass: boolean; labelUrdu: string } => {
  if (percentage >= 90) return { grade: 'A+', pass: true, labelUrdu: 'ممتاز (A+)' };
  if (percentage >= 80) return { grade: 'A', pass: true, labelUrdu: 'بہت اچھا (A)' };
  if (percentage >= 70) return { grade: 'B', pass: true, labelUrdu: 'اچھا (B)' };
  if (percentage >= 60) return { grade: 'C', pass: true, labelUrdu: 'تسلی بخش (C)' };
  if (percentage >= 50) return { grade: 'D', pass: true, labelUrdu: 'مقبول (D)' };
  return { grade: 'F', pass: false, labelUrdu: 'ناکام (F)' };
};

// WhatsApp Absence Link Generator
export const generateWhatsAppAbsenceURL = (
  guardianPhone: string,
  studentName: string,
  fatherName: string,
  studentClass: string,
  date: string
): string => {
  // Format phone: if starts with 0, convert to 92 for Pakistan
  let cleanPhone = guardianPhone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('92') && cleanPhone.length === 10) {
    cleanPhone = '92' + cleanPhone;
  }

  const message = `السلام علیکم!

آپ کو اطلاع دی جاتی ہے کہ آپ کا بچہ:

طالب علم: ${studentName}
والد کا نام: ${fatherName}
کلاس: ${studentClass}
تاریخ: ${date}

آج مدرسہ میں غیر حاضر رہا۔

براہ کرم طالب علم کی حاضری کے بارے میں آگاہ رہیں۔

Madrasa Arabia Madina Tul Uloom

شکریہ۔`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

export const printDocument = () => {
  window.print();
};
