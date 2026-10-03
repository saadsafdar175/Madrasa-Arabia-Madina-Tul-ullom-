export type UserRole = 'admin' | 'teacher' | 'viewer';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  phone?: string;
}

export type BranchType = 'حفظ القرآن' | 'تجوید للحفاظ' | 'درس نظامی' | 'ناظرہ قرآن';

export type DarsGrade = 
  | 'اولیٰ' 
  | 'ثانیہ' 
  | 'ثالثہ' 
  | 'رابعہ' 
  | 'خامسہ' 
  | 'سادسہ' 
  | 'سابعہ' 
  | 'ثامنہ';

export type GradeLevel = DarsGrade | 'پارہ 1 تا 10' | 'پارہ 11 تا 20' | 'پارہ 21 تا 30' | 'قاعدہ' | 'ناظرہ';

export type AssessmentLevel = 'ممتاز' | 'بہت اچھا' | 'اچھا' | 'تسلی بخش' | 'مزید محنت درکار';

export type StudentStatus = 'فعال' | 'غیر فعال' | 'فارغ التحصیل';
export type ResidenceType = 'رہائشی' | 'غیر رہائشی';

// عصری تعلیم (Contemporary / Modern Education) Types
export type AsriStatus = 'زیرِ تعلیم' | 'مکمل' | 'نہیں پڑھ رہا';

export type AsriGrade = 
  | 'نرسری'
  | 'کے جی'
  | 'جماعت اول'
  | 'جماعت دوم'
  | 'جماعت سوم'
  | 'جماعت چہارم'
  | 'جماعت پنجم'
  | 'جماعت ششم'
  | 'جماعت ہفتم'
  | 'جماعت ہشتم'
  | 'جماعت نہم'
  | 'جماعت دہم'
  | 'ایف اے'
  | 'ایف ایس سی'
  | 'آئی سی ایس'
  | 'آئی کام'
  | 'بی اے'
  | 'بی ایس'
  | 'بی کام'
  | 'ایم اے'
  | 'ایم ایس / ایم فل'
  | 'دیگر';

export interface AsriTaleemData {
  status: AsriStatus; // عصری تعلیم کی حیثیت
  currentGrade: string; // موجودہ تعلیمی سطح / کلاس
  instituteName: string; // اسکول / کالج / ادارے کا نام
  boardUniversity: string; // بورڈ / یونیورسٹی
  rollNo: string; // رول نمبر
  academicYear: string; // تعلیمی سال
  lastCompletedGrade: string; // آخری مکمل کی گئی کلاس
  lastExamResult: string; // آخری امتحان کا نتیجہ / فیصد
  subjects: string; // مضامین
  extraInfo: string; // اضافی تعلیمی معلومات
  city: string; // اسکول / کالج کا شہر
  certificateUrl?: string; // تعلیمی اسناد / Certificates
}

export interface Student {
  id: string; // طالب علم ID
  admissionNo: string; // داخلہ نمبر
  rollNo: string; // رول نمبر
  fullName: string; // طالب علم کا نام
  fatherName: string; // والد کا نام
  dob: string; // تاریخ پیدائش
  cnicBForm: string; // CNIC / B-Form
  mobile: string; // موبائل نمبر
  whatsapp: string; // WhatsApp نمبر
  address: string; // پتہ
  village: string; // گاؤں
  district: string; // ضلع
  province: string; // صوبہ
  guardianName: string; // سرپرست کا نام
  guardianRelation: string; // سرپرست سے رشتہ
  guardianMobile: string; // سرپرست موبائل
  guardianAddress?: string; // سرپرست پتہ
  guardianOccupation?: string; // سرپرست کا پیشہ
  alternateMobile: string; // متبادل نمبر
  photoUrl?: string; // طالب علم کی تصویر
  admissionDate: string; // داخلہ تاریخ
  branch: BranchType; // شعبہ
  grade: string; // درجہ
  section: string; // سیکشن (الف، ب، ج)
  academicYear: string; // تعلیمی سال
  status: StudentStatus; // حیثیت
  residenceType?: ResidenceType; // رہائش کی قسم: رہائشی یا غیر رہائشی

  // عصری تعلیم (Contemporary / Secular Education)
  asriTaleem?: AsriTaleemData;

  // Hifz Specific Data (حفظ القرآن)
  hifzData?: {
    currentPara: number; // 1-30 موجودہ پارہ
    completedParas: number; // 0-30 مکمل پارے
    manzil: string; // منزل
    sabaq: string; // سبق
    sabqi: string; // سبقی
    startDate: string; // حفظ شروع کرنے کی تاریخ
    tajweedRating: AssessmentLevel; // تجوید کارکردگی
    teacherRemarks: string; // استاد کے تاثرات
  };

  // Tajweed lil Huffaz Specific Data (تجوید للحفاظ)
  tajweedData?: {
    currentPara: number;
    completedParas: number;
    tajweedLevel: 'مبتدی' | 'متوسط' | 'اعلیٰ';
    sabaq: string;
    sabqi: string;
    manzil: string;
    tajweedMistakes: string; // تجوید کی غلطیاں
    teacherRemarks: string;
    monthlyReview: AssessmentLevel; // ماہانہ جائزہ
    annualReview: AssessmentLevel; // سالانہ جائزہ
  };
}

export type TeacherStatus = 'فعال' | 'رخصت پر' | 'فارغ';
export type SalaryType = 'ماہانہ' | 'گھنٹہ وار';

export interface Teacher {
  id: string; // Teacher ID
  name: string; // Teacher Name
  fatherName: string; // Father Name
  cnic: string; // CNIC No. (Format: 17301-1234567-1, 13 digits)
  mobile: string; // Mobile Number
  whatsapp: string; // WhatsApp Number
  dob: string; // Date of Birth
  address: string; // Address
  qualification: string; // Qualification
  designation: string; // Designation
  joiningDate: string; // Joining Date
  branch: BranchType; // Branch
  assignedClass: string; // Assigned Class
  salaryType: SalaryType; // Salary Type
  basicSalary: number; // Basic Salary
  bankInfo: string; // Bank Information
  easypaisa: string; // Easypaisa
  jazzCash: string; // JazzCash
  status: TeacherStatus; // Status
  notes?: string; // Notes
  photoUrl?: string; // Teacher Photo
}

export type PaymentMethod = 'نقد' | 'بینک' | 'Easypaisa' | 'JazzCash' | 'دیگر';

export interface TeacherSalary {
  id: string;
  teacherId: string;
  teacherName: string;
  month: string; // مثلاً "مارچ 2026"
  year: number;
  basicSalary: number;
  allowance: number; // الاؤنس
  bonus: number; // اضافی رقم
  deduction: number; // کٹوتی
  absentDeduction: number; // غیر حاضری کٹوتی
  advance: number; // ایڈوانس
  otherDeduction: number; // دیگر کٹوتی
  netSalary: number; // خالص تنخواہ
  paidAmount: number; // ادا شدہ رقم
  balance: number; // بقایا
  paymentDate: string; // ادائیگی تاریخ
  paymentMethod: PaymentMethod; // ادائیگی طریقہ
  receiptNo: string; // رسید نمبر
  notes?: string; // نوٹس
}

export type AttendanceStatus = 'حاضر' | 'غیر حاضر' | 'رخصت' | 'تاخیر سے حاضر';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  guardianMobile: string;
  whatsappMobile: string;
  rollNo: string;
  date: string; // YYYY-MM-DD
  branch: BranchType;
  grade: string;
  section: string;
  status: AttendanceStatus;
  notes?: string;
}

export type FeeType = 'ماہانہ فیس' | 'داخلہ فیس' | 'امتحانی فیس' | 'ہاسٹل فیس' | 'دیگر فیس';
export type FeeStatus = 'ادا شدہ' | 'جزوی' | 'بقایا';

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  rollNo: string;
  grade: string;
  branch: BranchType;
  month: string;
  feeType: FeeType;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  date: string;
  paymentMethod: PaymentMethod;
  receiptNo: string;
  status: FeeStatus;
  notes?: string;
}

export type TransactionType = 'آمدن' | 'اخراجات';
export type IncomeCategory = 'فیس' | 'عطیہ' | 'زکوٰۃ' | 'صدقہ' | 'تعاون' | 'دیگر';
export type ExpenseCategory = 'راشن' | 'بجلی' | 'گیس' | 'پانی' | 'تنخواہیں' | 'کتابیں' | 'تعمیرات' | 'مرمت' | 'طلبہ اخراجات' | 'ہاسٹل' | 'دیگر';

export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory;
  title: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  receiptVoucherNo: string;
  personName?: string;
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  totalMarks: number;
  branch: BranchType;
  grade: string;
}

export type ExamType = 'ماہانہ امتحان' | 'ششماہی امتحان' | 'سالانہ امتحان' | 'دیگر';

export interface Exam {
  id: string;
  title: string;
  type: ExamType;
  academicYear: string;
  branch: BranchType;
  grade: string;
  startDate: string;
}

export interface StudentExamMark {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  totalMarks: number;
  obtainedMarks: number;
}

export interface StudentExamResult {
  studentId: string;
  studentName: string;
  fatherName: string;
  rollNo: string;
  admissionNo: string;
  branch: BranchType;
  grade: string;
  academicYear: string;
  examTitle: string;
  examType: ExamType;
  subjects: {
    subjectId: string;
    subjectName: string;
    totalMarks: number;
    obtainedMarks: number;
    grade: string;
    pass: boolean;
  }[];
  totalMaxMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  resultStatus: 'کامیاب' | 'ناکام';
  position?: number;
}

export interface MadrasaSettings {
  madrasaNameUrdu: string;
  madrasaNameEnglish: string;
  registrationNo: string;
  address: string;
  contactPhones: string;
  email: string;
  principalName: string;
  mohtamimName: string;
  nazimTaleematName: string;
  logoBase64: string; // Stored logo in persistent storage
  stampBase64?: string;
  academicYear: string;
}

// WhatsApp Professional Module Types
export type WhatsAppMessageType = 
  | 'انفرادی پیغام' 
  | 'فیس یاد دہانی' 
  | 'غیر حاضری اطلاع' 
  | 'امتحانی نتیجہ' 
  | 'عام اعلان';

export type WhatsAppMessageStatus = 
  | 'مسودہ (Draft)' 
  | 'تیار برائے ترسیل (Ready)' 
  | 'کھولی گئی (Opened via WhatsApp)' 
  | 'بھیجا گیا (Sent)';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  type: WhatsAppMessageType;
  message: string;
  isDefault?: boolean;
}

export interface WhatsAppMessageLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  recipientRole: 'طالب علم' | 'والد / سرپرست' | 'استاد' | 'دیگر';
  studentId?: string;
  messageType: WhatsAppMessageType;
  messageText: string;
  status: WhatsAppMessageStatus;
  sentAt: string;
  method: 'web' | 'app' | 'api';
}

export interface WhatsAppApiConfig {
  enabled: boolean;
  apiUrl: string;
  phoneNumberId: string;
  bearerToken: string;
}

