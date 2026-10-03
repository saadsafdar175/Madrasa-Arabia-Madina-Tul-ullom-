import React, { useState } from 'react';
import { Student, AssessmentLevel, MadrasaSettings } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, 
  Search, 
  Save, 
  Printer, 
  CheckCircle, 
  Award, 
  Bookmark, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface HifzBranchViewProps {
  students: Student[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
}

export const HifzBranchView: React.FC<HifzBranchViewProps> = ({
  students,
  onRefresh,
  settings
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'teacher';

  const hifzStudents = students.filter(s => s.branch === 'حفظ القرآن' && s.status === 'فعال');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(hifzStudents[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form fields for currently selected student's Hifz data
  const [currentPara, setCurrentPara] = useState<number>(selectedStudent?.hifzData?.currentPara || 1);
  const [completedParas, setCompletedParas] = useState<number>(selectedStudent?.hifzData?.completedParas || 0);
  const [manzil, setManzil] = useState<string>(selectedStudent?.hifzData?.manzil || '');
  const [sabaq, setSabaq] = useState<string>(selectedStudent?.hifzData?.sabaq || '');
  const [sabqi, setSabqi] = useState<string>(selectedStudent?.hifzData?.sabqi || '');
  const [startDate, setStartDate] = useState<string>(selectedStudent?.hifzData?.startDate || '2024-01-01');
  const [tajweedRating, setTajweedRating] = useState<AssessmentLevel>(
    selectedStudent?.hifzData?.tajweedRating || 'بہت اچھا'
  );
  const [teacherRemarks, setTeacherRemarks] = useState<string>(selectedStudent?.hifzData?.teacherRemarks || '');

  const [notification, setNotification] = useState<string | null>(null);

  // When selected student changes, update form
  const handleSelectStudent = (stu: Student) => {
    setSelectedStudent(stu);
    setCurrentPara(stu.hifzData?.currentPara || 1);
    setCompletedParas(stu.hifzData?.completedParas || 0);
    setManzil(stu.hifzData?.manzil || '');
    setSabaq(stu.hifzData?.sabaq || '');
    setSabqi(stu.hifzData?.sabqi || '');
    setStartDate(stu.hifzData?.startDate || '2024-01-01');
    setTajweedRating(stu.hifzData?.tajweedRating || 'بہت اچھا');
    setTeacherRemarks(stu.hifzData?.teacherRemarks || '');
  };

  const handleSaveHifzRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    if (currentPara < 1 || currentPara > 30) {
      alert('موجودہ پارہ 1 تا 30 کے درمیان ہونا چاہیے۔');
      return;
    }
    if (completedParas < 0 || completedParas > 30) {
      alert('مکمل پارے 0 تا 30 کے درمیان ہونے چاہئیں۔');
      return;
    }

    try {
      const updatedStudent: Student = {
        ...selectedStudent,
        hifzData: {
          currentPara: Number(currentPara),
          completedParas: Number(completedParas),
          manzil,
          sabaq,
          sabqi,
          startDate,
          tajweedRating,
          teacherRemarks
        }
      };

      await dbService.put('students', updatedStudent);
      setSelectedStudent(updatedStudent);
      setNotification(`طالب علم "${updatedStudent.fullName}" کا حفظ ریکارڈ کامیابی سے محفوظ ہو گیا ہے۔`);
      setTimeout(() => setNotification(null), 3000);
      await onRefresh();
    } catch (err: any) {
      alert('ریکارڈ محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  const filteredList = hifzStudents.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rollNo.includes(searchQuery) ||
    s.fatherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              شعبہ تحفیظ القرآن الکریم - یومیہ سبق و تعلیمی پیش رفت
            </h2>
            <p className="text-xs text-slate-500">
              موجودہ پارہ (1 تا 30)، منزل، سبق، سبقی اور تجوید کارکردگی کی باقاعدہ جانچ
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-xs flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          پرنٹ رپورٹ حفظ
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-md text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Students List */}
        <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-xs font-bold text-slate-700">حفظ کے طلبہ ({hifzStudents.length})</span>
            <span className="text-[11px] text-emerald-700 font-medium">طالب علم منتخب کریں</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="تلاش برائے نام یا رول نمبر..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {filteredList.map(stu => {
              const isSelected = selectedStudent?.id === stu.id;
              const completed = stu.hifzData?.completedParas || 0;
              return (
                <button
                  key={stu.id}
                  onClick={() => handleSelectStudent(stu)}
                  className={`w-full text-right p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{stu.fullName}</div>
                    <div className="text-[11px] text-slate-500">
                      رول: {stu.rollNo} • والد: {stu.fatherName}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {completed} / 30 پارے
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Data Entry and Visual Tracker for Selected Student */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStudent ? (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              {/* Student Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center">
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

                <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-center">
                  <span className="text-[11px] text-emerald-800 block">مکمل پارے</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {completedParas} / 30
                  </span>
                </div>
              </div>

              {/* Progress 30 Paras Visual Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>قرآن مجید 30 پارے تکمیل کا جائزہ:</span>
                  <span className="text-emerald-700 font-bold">{Math.round((completedParas / 30) * 100)}% مکمل</span>
                </div>

                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(paraNum => {
                    const isDone = paraNum <= completedParas;
                    const isCurrent = paraNum === currentPara;
                    return (
                      <div
                        key={paraNum}
                        title={`پارہ نمبر ${paraNum}`}
                        className={`text-center py-1.5 rounded-md text-[11px] font-bold border transition ${
                          isCurrent
                            ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
                            : isDone
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {paraNum}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> مکمل
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> موجودہ پارہ
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-slate-200 inline-block" /> بقیہ پارے
                  </span>
                </div>
              </div>

              {/* Form Entry */}
              <form onSubmit={handleSaveHifzRecord} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">موجودہ پارہ (1 تا 30) *</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      required
                      value={currentPara}
                      onChange={e => setCurrentPara(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">مکمل پارے (0 تا 30) *</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      required
                      value={completedParas}
                      onChange={e => setCompletedParas(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">حفظ شروع کرنے کی تاریخ</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">آج کا سبق</label>
                    <input
                      type="text"
                      placeholder="مثلاً: پارہ 16، سورۃ الکہف رکوع 4"
                      value={sabaq}
                      onChange={e => setSabaq(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سبقی</label>
                    <input
                      type="text"
                      placeholder="مثلاً: پارہ 15 مکمل، نصف"
                      value={sabqi}
                      onChange={e => setSabqi(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">منزل</label>
                    <input
                      type="text"
                      placeholder="مثلاً: پارہ 1 تا 3"
                      value={manzil}
                      onChange={e => setManzil(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">تجوید کارکردگی</label>
                    <select
                      value={tajweedRating}
                      onChange={e => setTajweedRating(e.target.value as AssessmentLevel)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="ممتاز">ممتاز (بہترین ترتیل و تجوید)</option>
                      <option value="بہت اچھا">بہت اچھا</option>
                      <option value="اچھا">اچھا</option>
                      <option value="تسلی بخش">تسلی بخش</option>
                      <option value="مزید محنت درکار">مزید محنت درکار</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 font-medium mb-1">استاد محترم کے تاثرات و ہدایات</label>
                    <textarea
                      rows={2}
                      placeholder="طالب علم کی یادداشت، وقت کی پابندی اور روزمرہ مشق پر تاثرات..."
                      value={teacherRemarks}
                      onChange={e => setTeacherRemarks(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-3 border-t">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
                    >
                      <Save className="w-4 h-4" />
                      حفظ ریکارڈ محفوظ کریں
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
