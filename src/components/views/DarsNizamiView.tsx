import React, { useState } from 'react';
import { Student, DarsGrade, Subject, MadrasaSettings } from '../../types';
import { GraduationCap, BookOpen, Users, Printer, Plus, CheckCircle2 } from 'lucide-react';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';

interface DarsNizamiViewProps {
  students: Student[];
  subjects: Subject[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
  setActiveTab: (tab: string) => void;
}

const DARS_GRADES: DarsGrade[] = [
  'اولیٰ',
  'ثانیہ',
  'ثالثہ',
  'رابعہ',
  'خامسہ',
  'سادسہ',
  'سابعہ',
  'ثامنہ'
];

export const DarsNizamiView: React.FC<DarsNizamiViewProps> = ({
  students,
  subjects,
  onRefresh,
  settings,
  setActiveTab
}) => {
  const { role } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<DarsGrade>('اولیٰ');

  // Filter students by selected Dars-e-Nizami grade
  const gradeStudents = students.filter(
    s => s.branch === 'درس نظامی' && s.grade === selectedGrade && s.status === 'فعال'
  );

  // Filter subjects for selected grade (or all Dars-e-Nizami subjects)
  const gradeSubjects = subjects.filter(
    sub => sub.branch === 'درس نظامی' && (sub.grade === selectedGrade || sub.grade === 'تمام درجات')
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              شعبہ درس نظامی (عالم و فاضل کورس)
            </h2>
            <p className="text-xs text-slate-500">
              درجہ اولیٰ تا درجہ ثامنہ (دورۂ حدیث شریف) - نصاب، طلبہ، مضامین اور امتحانی ریکارڈ
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-xs flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          پرنٹ کلاس شیٹ
        </button>
      </div>

      {/* Grade Selector Tabs: اولیٰ سے ثامنہ */}
      <div className="no-print bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="text-xs font-bold text-slate-500 mb-2 px-1">درجہ / کلاس کا انتخاب کریں:</div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {DARS_GRADES.map(grade => {
            const isSelected = selectedGrade === grade;
            const count = students.filter(s => s.branch === 'درس نظامی' && s.grade === grade && s.status === 'فعال').length;
            return (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`py-2 px-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
                }`}
              >
                <span className="text-sm">درجہ {grade}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                  {count} طلبہ
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content for Selected Grade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subjects for Selected Grade */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-sm">نصابی کتب و مضامین (درجہ {selectedGrade})</h3>
            </div>
            <button
              onClick={() => setActiveTab('subjects')}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              مضامین ایڈٹ ←
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {gradeSubjects.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                اس درجہ کے لیے ابھی مخصوص مضامین نہیں جوڑے گئے۔ مضامین سیکشن سے شامل کریں۔
              </div>
            ) : (
              gradeSubjects.map(sub => (
                <div
                  key={sub.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{sub.name}</div>
                    <div className="text-[10px] text-slate-500">کوڈ: {sub.code}</div>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    کل نمبر: {sub.totalMarks}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Students of Selected Grade Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                طلبہ کرام درجہ {selectedGrade} ({gradeStudents.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              نیا طالب علم شامل کریں +
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-2.5">رول نمبر</th>
                  <th className="p-2.5">داخلہ نمبر</th>
                  <th className="p-2.5">نام طالب علم</th>
                  <th className="p-2.5">والد کا نام</th>
                  <th className="p-2.5">موبائل نمبر</th>
                  <th className="p-2.5">سیکشن</th>
                  <th className="p-2.5">حیثیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      درجہ {selectedGrade} میں کوئی طالب علم داخل نہیں ہے۔
                    </td>
                  </tr>
                ) : (
                  gradeStudents.map(stu => (
                    <tr key={stu.id} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-bold text-purple-900">{stu.rollNo}</td>
                      <td className="p-2.5 text-slate-600">{stu.admissionNo}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{stu.fullName}</td>
                      <td className="p-2.5 text-slate-700">{stu.fatherName}</td>
                      <td className="p-2.5 text-slate-600">{stu.guardianMobile || stu.mobile}</td>
                      <td className="p-2.5 text-slate-700 font-medium">{stu.section}</td>
                      <td className="p-2.5">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {stu.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
