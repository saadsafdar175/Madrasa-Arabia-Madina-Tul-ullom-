import React from 'react';
import { 
  Student, 
  Teacher, 
  AttendanceRecord, 
  FeeRecord, 
  FinanceTransaction, 
  TeacherSalary,
  MadrasaSettings
} from '../../types';
import { formatPKR, generateWhatsAppAbsenceURL } from '../../utils/helpers';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Award, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  AlertCircle, 
  DollarSign,
  ArrowUpRight,
  Send,
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  fees: FeeRecord[];
  finance: FinanceTransaction[];
  salaries: TeacherSalary[];
  settings: MadrasaSettings;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  attendance,
  fees,
  finance,
  salaries,
  settings,
  setActiveTab
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Counts
  const totalStudents = students.filter(s => s.status === 'فعال').length;
  const residentialStudents = students.filter(s => s.residenceType === 'رہائشی' && s.status === 'فعال').length;
  const nonResidentialStudents = students.filter(s => s.residenceType === 'غیر رہائشی' && s.status === 'فعال').length;
  const unspecifiedStudents = students.filter(s => !s.residenceType && s.status === 'فعال').length;
  const totalTeachers = teachers.filter(t => t.status === 'فعال').length;
  const hifzStudents = students.filter(s => s.branch === 'حفظ القرآن' && s.status === 'فعال').length;
  const tajweedStudents = students.filter(s => s.branch === 'تجوید للحفاظ' && s.status === 'فعال').length;
  const darsStudents = students.filter(s => s.branch === 'درس نظامی' && s.status === 'فعال').length;

  // Attendance for today
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentCount = todayAttendance.filter(a => a.status === 'حاضر' || a.status === 'تاخیر سے حاضر').length;
  const absentCount = todayAttendance.filter(a => a.status === 'غیر حاضر').length;
  const absentList = todayAttendance.filter(a => a.status === 'غیر حاضر');

  // Finance calculations
  const totalIncome = finance
    .filter(f => f.type === 'آمدن')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  const totalExpense = finance
    .filter(f => f.type === 'اخراجات')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const currentBalance = totalIncome - totalExpense;

  const todayIncome = finance
    .filter(f => f.type === 'آمدن' && f.date === todayStr)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const todayExpense = finance
    .filter(f => f.type === 'اخراجات' && f.date === todayStr)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Fees calculation
  const totalFeeCollected = fees.reduce((sum, f) => sum + (Number(f.paidAmount) || 0), 0);
  const totalFeePending = fees.reduce((sum, f) => sum + (Number(f.balance) || 0), 0);

  // Salaries paid
  const totalSalariesPaid = salaries.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-500/30">
                مرکزی کنٹرول روم
              </span>
              <span className="text-slate-400 text-xs">تعلیمی سال: {settings.academicYear}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-nastaliq text-amber-400 mt-2">
              {settings.madrasaNameUrdu}
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              خوش آمدید! مدرسہ کا جامع ریکارڈ اور یومیہ دفتری خلاصہ ذیل میں ملاحظہ فرمائیں۔
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('students')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 font-medium"
            >
              <Users className="w-3.5 h-3.5" />
              نیا طالب علم
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 font-medium"
            >
              <Calendar className="w-3.5 h-3.5" />
              حاضری لگائیں
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 font-medium"
            >
              <Receipt className="w-3.5 h-3.5" />
              فیس وصولی
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs px-3.5 py-2 rounded-xl transition shadow flex items-center gap-1.5 font-medium"
            >
              <Wallet className="w-3.5 h-3.5" />
              آمدن و خرچ
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* کل طلبہ */}
        <div 
          onClick={() => setActiveTab('students')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">کل فعال طلبہ</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{totalStudents}</span>
            <span className="text-xs text-blue-600 font-medium">تفصیلات دیکھیں ←</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-semibold">رہائشی: {residentialStudents}</span>
            <span className="text-blue-700 font-semibold">غیر رہائشی: {nonResidentialStudents}</span>
            {unspecifiedStudents > 0 && <span className="text-slate-400">دیگر: {unspecifiedStudents}</span>}
          </div>
        </div>

        {/* کل اساتذہ */}
        <div 
          onClick={() => setActiveTab('teachers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">کل اساتذہ کرام</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{totalTeachers}</span>
            <span className="text-xs text-indigo-600 font-medium">مدرسین فہرست ←</span>
          </div>
        </div>

        {/* حفظ القرآن کے طلبہ */}
        <div 
          onClick={() => setActiveTab('hifz')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">حفظ القرآن کے طلبہ</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">{hifzStudents}</span>
            <span className="text-xs text-emerald-600 font-medium">پیش رفت و سبق ←</span>
          </div>
        </div>

        {/* تجوید للحفاظ کے طلبہ */}
        <div 
          onClick={() => setActiveTab('tajweed')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">تجوید للحفاظ کے طلبہ</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">{tajweedStudents}</span>
            <span className="text-xs text-amber-600 font-medium">تجوید ریکارڈ ←</span>
          </div>
        </div>

        {/* درس نظامی کے طلبہ */}
        <div 
          onClick={() => setActiveTab('dars-e-nizami')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">درس نظامی کے طلبہ</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-700">{darsStudents}</span>
            <span className="text-xs text-purple-600 font-medium">کلاسز و درجات ←</span>
          </div>
        </div>

        {/* آج کی حاضری */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">آج کی حاضری (حاضر)</span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-teal-700">{presentCount} طلبہ</span>
            <span className="text-xs text-teal-600 font-medium">رجسٹر کھولیں ←</span>
          </div>
        </div>

        {/* غیر حاضر طلبہ */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">آج کے غیر حاضر طلبہ</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600">{absentCount} طلبہ</span>
            <span className="text-xs text-rose-600 font-medium">اطلاع WhatsApp ←</span>
          </div>
        </div>

        {/* موجودہ بیلنس */}
        <div 
          onClick={() => setActiveTab('finance')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">موجودہ بیلنس (نیٹ)</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className={`text-xl font-bold ${currentBalance >= 0 ? 'text-blue-800' : 'text-rose-600'}`}>
              {formatPKR(currentBalance)}
            </span>
            <span className="text-xs text-blue-600 font-medium">اکاؤنٹس خلاصہ ←</span>
          </div>
        </div>
      </div>

      {/* Financial Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* آج کی آمدن */}
        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">آج کی کل آمدن</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-900 mt-2">{formatPKR(todayIncome)}</div>
          <div className="text-[11px] text-emerald-700 mt-1">فیس، عطیات و صدقات</div>
        </div>

        {/* آج کے اخراجات */}
        <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">آج کے کل اخراجات</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-900 mt-2">{formatPKR(todayExpense)}</div>
          <div className="text-[11px] text-rose-700 mt-1">راشن، بلز، روزمرہ اخراجات</div>
        </div>

        {/* اس ماہ کی وصول شدہ فیس */}
        <div className="bg-sky-50/60 border border-sky-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-800">کل وصول شدہ فیس</span>
            <Receipt className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-sky-900 mt-2">{formatPKR(totalFeeCollected)}</div>
          <div className="text-[11px] text-sky-700 mt-1">مدرسہ فیس وصولی ریکارڈ</div>
        </div>

        {/* زیر التواء فیس */}
        <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">زیر التواء (بقایا) فیس</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-900 mt-2">{formatPKR(totalFeePending)}</div>
          <div className="text-[11px] text-amber-700 mt-1">طلبہ کی واجب الادا فیس</div>
        </div>
      </div>

      {/* Action Sections: Absent Students Notification & Recent Finance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absent Students Today with Direct WhatsApp Trigger */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-800">آج کے غیر حاضر طلبہ</h3>
              <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {absentList.length}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('attendance')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              حاضری مکمل دیکھیں ←
            </button>
          </div>

          <div className="mt-3">
            {absentList.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm">آج کوئی طالب علم غیر حاضر نہیں ہے یا حاضری نہیں لگی۔</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {absentList.map((rec) => {
                  const phone = rec.guardianMobile || rec.whatsappMobile;
                  const waUrl = generateWhatsAppAbsenceURL(
                    phone,
                    rec.studentName,
                    rec.fatherName,
                    `${rec.branch} - ${rec.grade}`,
                    rec.date
                  );

                  return (
                    <div
                      key={rec.id}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100 transition"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{rec.studentName}</div>
                        <div className="text-xs text-slate-500">
                          والد: {rec.fatherName} • رول: {rec.rollNo} • {rec.grade}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">موبائل: {phone || 'نمبر درج نہیں'}</div>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium shadow-xs shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        WhatsApp اطلاع
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions & Salaries Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800">حالیہ مالیاتی اندراجات</h3>
            </div>
            <button
              onClick={() => setActiveTab('finance')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              تمام ٹرانزیکشنز ←
            </button>
          </div>

          <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {finance.slice(0, 5).map((trx) => (
              <div
                key={trx.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100 transition"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        trx.type === 'آمدن' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    {trx.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    قسم: {trx.category} • طریقہ: {trx.paymentMethod} • تاریخ: {trx.date}
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div
                    className={`font-bold text-sm ${
                      trx.type === 'آمدن' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {trx.type === 'آمدن' ? '+' : '-'} {formatPKR(trx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400">{trx.receiptVoucherNo}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>اساتذہ کی ادا شدہ تنخواہیں:</span>
            <span className="font-bold text-slate-800">{formatPKR(totalSalariesPaid)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
