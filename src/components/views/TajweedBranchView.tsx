import React, { useState } from 'react';
import { Student, AssessmentLevel, MadrasaSettings } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Award, Search, Save, Printer, CheckCircle2, Star } from 'lucide-react';

interface TajweedBranchViewProps {
  students: Student[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
}

export const TajweedBranchView: React.FC<TajweedBranchViewProps> = ({
  students,
  onRefresh,
  settings
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'teacher';

  const tajweedStudents = students.filter(s => s.branch === 'تجوید للحفاظ' && s.status === 'فعال');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(tajweedStudents[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fields for selected student
  const [currentPara, setCurrentPara] = useState<number>(selectedStudent?.tajweedData?.currentPara || 1);
  const [completedParas, setCompletedParas] = useState<number>(selectedStudent?.tajweedData?.completedParas || 0);
  const [tajweedLevel, setTajweedLevel] = useState<'مبتدی' | 'متوسط' | 'اعلیٰ'>(
    selectedStudent?.tajweedData?.tajweedLevel || 'متوسط'
  );
  const [sabaq, setSabaq] = useState<string>(selectedStudent?.tajweedData?.sabaq || '');
  const [sabqi, setSabqi] = useState<string>(selectedStudent?.tajweedData?.sabqi || '');
  const [manzil, setManzil] = useState<string>(selectedStudent?.tajweedData?.manzil || '');
  const [tajweedMistakes, setTajweedMistakes] = useState<string>(
    selectedStudent?.tajweedData?.tajweedMistakes || ''
  );
  const [teacherRemarks, setTeacherRemarks] = useState<string>(
    selectedStudent?.tajweedData?.teacherRemarks || ''
  );
  const [monthlyReview, setMonthlyReview] = useState<AssessmentLevel>(
    selectedStudent?.tajweedData?.monthlyReview || 'بہت اچھا'
  );
  const [annualReview, setAnnualReview] = useState<AssessmentLevel>(
    selectedStudent?.tajweedData?.annualReview || 'بہت اچھا'
  );

  const [notification, setNotification] = useState<string | null>(null);

  const handleSelectStudent = (stu: Student) => {
    setSelectedStudent(stu);
    setCurrentPara(stu.tajweedData?.currentPara || 1);
    setCompletedParas(stu.tajweedData?.completedParas || 0);
    setTajweedLevel(stu.tajweedData?.tajweedLevel || 'متوسط');
    setSabaq(stu.tajweedData?.sabaq || '');
    setSabqi(stu.tajweedData?.sabqi || '');
    setManzil(stu.tajweedData?.manzil || '');
    setTajweedMistakes(stu.tajweedData?.tajweedMistakes || '');
    setTeacherRemarks(stu.tajweedData?.teacherRemarks || '');
    setMonthlyReview(stu.tajweedData?.monthlyReview || 'بہت اچھا');
    setAnnualReview(stu.tajweedData?.annualReview || 'بہت اچھا');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const updated: Student = {
        ...selectedStudent,
        tajweedData: {
          currentPara: Number(currentPara),
          completedParas: Number(completedParas),
          tajweedLevel,
          sabaq,
          sabqi,
          manzil,
          tajweedMistakes,
          teacherRemarks,
          monthlyReview,
          annualReview
        }
      };

      await dbService.put('students', updated);
      setSelectedStudent(updated);
      setNotification(`طالب علم "${updated.fullName}" کا تجوید ریکارڈ محفوظ ہو گیا۔`);
      setTimeout(() => setNotification(null), 3000);
      await onRefresh();
    } catch (err: any) {
      alert('ریکارڈ محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  const filtered = tajweedStudents.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.includes(searchQuery) ||
    s.fatherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              شعبہ تجوید للحفاظ - مخارج و صفات اور حسنِ قرأت
            </h2>
            <p className="text-xs text-slate-500">
              قواعد تجوید، ترتیل، غلطیوں کی اصلاح، ماہانہ و سالانہ جامع کارکردگی
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-xs flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          پرنٹ رپورٹ تجوید
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-md text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Students List */}
        <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-xs font-bold text-slate-700">تجوید کے طلبہ ({tajweedStudents.length})</span>
            <span className="text-[11px] text-amber-700 font-medium">انتخاب کریں</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="تلاش برائے نام یا رول نمبر..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {filtered.map(stu => {
              const isSelected = selectedStudent?.id === stu.id;
              return (
                <button
                  key={stu.id}
                  onClick={() => handleSelectStudent(stu)}
                  className={`w-full text-right p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-50 border-amber-300 shadow-xs'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{stu.fullName}</div>
                    <div className="text-[11px] text-slate-500">
                      رول: {stu.rollNo} • والد: {stu.fatherName}
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    لیول: {stu.tajweedData?.tajweedLevel || 'متوسط'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Student Details & Data Entry */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white font-bold text-lg flex items-center justify-center">
                    {selectedStudent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-nastaliq text-slate-900">
                      {selectedStudent.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      والد: {selectedStudent.fatherName} • رول نمبر: {selectedStudent.rollNo} • داخلہ نمبر: {selectedStudent.admissionNo}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="bg-amber-100 text-amber-900 text-xs px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-600" />
                    ماہانہ جائزہ: {monthlyReview}
                  </span>
                </div>
              </div>

              {/* Data Entry Form */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">طالب علم کا نام</label>
                    <input
                      type="text"
                      disabled
                      value={selectedStudent.fullName}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">والد کا نام</label>
                    <input
                      type="text"
                      disabled
                      value={selectedStudent.fatherName}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">رول نمبر و داخلہ نمبر</label>
                    <input
                      type="text"
                      disabled
                      value={`${selectedStudent.rollNo} / ${selectedStudent.admissionNo}`}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">تجوید لیول</label>
                    <select
                      value={tajweedLevel}
                      onChange={e => setTajweedLevel(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="مبتدی">مبتدی (ابتدائی قواعد)</option>
                      <option value="متوسط">متوسط (درمیانہ درجہ)</option>
                      <option value="اعلیٰ">اعلیٰ (پختہ ترتیل و قراءت)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">موجودہ پارہ</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={currentPara}
                      onChange={e => setCurrentPara(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">مکمل پارے</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={completedParas}
                      onChange={e => setCompletedParas(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سبق (آج کا اجراء)</label>
                    <input
                      type="text"
                      placeholder="مثلاً: مخارج و صفات کا اجراء"
                      value={sabaq}
                      onChange={e => setSabaq(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سبقی</label>
                    <input
                      type="text"
                      value={sabqi}
                      onChange={e => setSabqi(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">منزل</label>
                    <input
                      type="text"
                      value={manzil}
                      onChange={e => setManzil(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 font-medium mb-1">تجوید کی عام غلطیاں و نوٹس</label>
                    <input
                      type="text"
                      placeholder="مثلاً: غنہ، اخفاء، مد کی مقدار، راء کی تفخیم و ترقیق"
                      value={tajweedMistakes}
                      onChange={e => setTajweedMistakes(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">ماہانہ جائزہ (Assessment)</label>
                    <select
                      value={monthlyReview}
                      onChange={e => setMonthlyReview(e.target.value as AssessmentLevel)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="ممتاز">ممتاز</option>
                      <option value="بہت اچھا">بہت اچھا</option>
                      <option value="اچھا">اچھا</option>
                      <option value="تسلی بخش">تسلی بخش</option>
                      <option value="مزید محنت درکار">مزید محنت درکار</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سالانہ جائزہ</label>
                    <select
                      value={annualReview}
                      onChange={e => setAnnualReview(e.target.value as AssessmentLevel)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      <option value="ممتاز">ممتاز</option>
                      <option value="بہت اچھا">بہت اچھا</option>
                      <option value="اچھا">اچھا</option>
                      <option value="تسلی بخش">تسلی بخش</option>
                      <option value="مزید محنت درکار">مزید محنت درکار</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 font-medium mb-1">استاد کے تاثرات</label>
                    <textarea
                      rows={2}
                      value={teacherRemarks}
                      onChange={e => setTeacherRemarks(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-3 border-t">
                    <button
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
                    >
                      <Save className="w-4 h-4" />
                      تجوید ریکارڈ محفوظ کریں
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
              برائے مہربانی پہلے طالب علم منتخب کریں۔
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
