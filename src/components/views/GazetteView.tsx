import React, { useState } from 'react';
import { Student, Exam, Subject, StudentExamMark, MadrasaSettings } from '../../types';
import { calculateGrade } from '../../utils/helpers';
import { FileText, Printer, Search, Trophy } from 'lucide-react';

interface GazetteViewProps {
  students: Student[];
  exams: Exam[];
  subjects: Subject[];
  marks: StudentExamMark[];
  settings: MadrasaSettings;
}

export const GazetteView: React.FC<GazetteViewProps> = ({
  students,
  exams,
  subjects,
  marks,
  settings
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Compute gazette records for all students in this exam
  const examMarks = marks.filter(m => m.examId === selectedExamId);
  const examStudentIds = Array.from(new Set(examMarks.map(m => m.studentId)));

  const gazetteRecords = examStudentIds.map(stId => {
    const student = students.find(s => s.id === stId);
    const stMarks = examMarks.filter(m => m.studentId === stId);

    const totalMax = stMarks.reduce((sum, m) => sum + (Number(m.totalMarks) || 0), 0);
    const totalObtained = stMarks.reduce((sum, m) => sum + (Number(m.obtainedMarks) || 0), 0);
    const percentage = totalMax > 0 ? Math.min(100, Math.round((totalObtained / totalMax) * 100)) : 0;
    const gradeInfo = calculateGrade(percentage);

    return {
      studentId: stId,
      studentName: student?.fullName || 'نامعلوم',
      fatherName: student?.fatherName || 'نامعلوم',
      rollNo: student?.rollNo || '—',
      branch: student?.branch || selectedExam?.branch || '—',
      grade: student?.grade || selectedExam?.grade || '—',
      totalMax,
      totalObtained,
      percentage,
      gradeLetter: gradeInfo.grade,
      status: gradeInfo.pass ? 'کامیاب' : 'ناکام'
    };
  }).sort((a, b) => b.totalObtained - a.totalObtained);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              رزلٹ گزٹ رپورٹ (A4 Landscape Result Gazette)
            </h2>
            <p className="text-xs text-slate-500">
              امتحان کا مجموعی نتیجہ، درجہ بندی، پوزیشن، رول نمبر، فیصد اور پاس / فیل اسٹیٹس
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition"
        >
          <Printer className="w-4 h-4" />
          پرنٹ گزٹ (A4 لینڈ اسکیپ)
        </button>
      </div>

      {/* Exam Selector */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 text-xs">
        <label className="font-semibold text-slate-700 whitespace-nowrap">امتحان منتخب کریں:</label>
        <select
          value={selectedExamId}
          onChange={e => setSelectedExamId(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white font-bold flex-1 max-w-md"
        >
          {exams.map(ex => (
            <option key={ex.id} value={ex.id}>
              {ex.title} ({ex.branch} - {ex.grade})
            </option>
          ))}
        </select>
      </div>

      {/* A4 Landscape Gazette Print Sheet */}
      <div className="bg-white border-2 border-slate-900 p-8 rounded-xl shadow-xl w-full text-slate-900 print:shadow-none print:border-2 print:border-black print:m-0 print:p-6 print:break-inside-avoid">
        {/* Gazette Header */}
        <div className="text-center pb-4 border-b-2 border-slate-900 flex items-center justify-between">
          <div className="w-20 h-20 flex items-center justify-center">
            {settings.logoBase64 ? (
              <img src={settings.logoBase64} alt="لوگو" className="max-h-20 max-w-20 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-full border border-slate-800 flex items-center justify-center font-bold text-xs">
                لوگو
              </div>
            )}
          </div>

          <div className="flex-1 px-4">
            <h1 className="text-2xl font-bold font-nastaliq text-blue-950">{settings.madrasaNameUrdu}</h1>
            <p className="text-xs font-semibold text-slate-700">{settings.madrasaNameEnglish}</p>
            <div className="mt-1 inline-block bg-slate-900 text-white font-bold text-xs px-6 py-0.5 rounded-full">
              رزلٹ گزٹ (RESULT GAZETTE)
            </div>
            <div className="text-xs text-slate-700 font-semibold mt-1">
              امتحان: {selectedExam?.title} • شعبہ: {selectedExam?.branch} • درجہ: {selectedExam?.grade} • تعلیمی سال: {selectedExam?.academicYear || settings.academicYear}
            </div>
          </div>

          <div className="w-20 text-left text-[11px] text-slate-500">
            <div>تاریخ: {new Date().toLocaleDateString('ur-PK')}</div>
            <div>کل طلبہ: {gazetteRecords.length}</div>
          </div>
        </div>

        {/* Gazette Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse border border-slate-900">
            <thead className="bg-slate-100 border-b border-slate-900 font-bold">
              <tr>
                <th className="p-2 border border-slate-900 text-center w-16">پوزیشن</th>
                <th className="p-2 border border-slate-900 text-center w-20">رول نمبر</th>
                <th className="p-2 border border-slate-900">طالب علم کا نام</th>
                <th className="p-2 border border-slate-900">والد کا نام</th>
                <th className="p-2 border border-slate-900 text-center">شعبہ و درجہ</th>
                <th className="p-2 border border-slate-900 text-center w-20">کل نمبرات</th>
                <th className="p-2 border border-slate-900 text-center w-24">حاصل کردہ نمبرات</th>
                <th className="p-2 border border-slate-900 text-center w-16">فیصد (%)</th>
                <th className="p-2 border border-slate-900 text-center w-16">گریڈ</th>
                <th className="p-2 border border-slate-900 text-center w-20">کیفیت (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400">
              {gazetteRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    اس امتحان کے لیے کوئی رزلٹ ریکارڈ نہیں ملا۔
                  </td>
                </tr>
              ) : (
                gazetteRecords.map((rec, idx) => {
                  const position = idx + 1;
                  return (
                    <tr
                      key={rec.studentId}
                      className={position <= 3 ? 'bg-amber-50/50 font-semibold' : 'hover:bg-slate-50'}
                    >
                      <td className="p-2 border border-slate-400 text-center font-bold">
                        <span className="inline-flex items-center gap-1 justify-center">
                          {position <= 3 && <Trophy className="w-3.5 h-3.5 text-amber-600 inline" />}
                          {position}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-400 text-center font-mono font-bold text-slate-800">
                        {rec.rollNo}
                      </td>
                      <td className="p-2 border border-slate-400 font-bold text-slate-900">{rec.studentName}</td>
                      <td className="p-2 border border-slate-400 text-slate-700">{rec.fatherName}</td>
                      <td className="p-2 border border-slate-400 text-center text-slate-600">
                        {rec.branch} - {rec.grade}
                      </td>
                      <td className="p-2 border border-slate-400 text-center font-bold">{rec.totalMax}</td>
                      <td className="p-2 border border-slate-400 text-center font-bold text-sm text-blue-900">
                        {rec.totalObtained}
                      </td>
                      <td className="p-2 border border-slate-400 text-center font-bold">{rec.percentage}%</td>
                      <td className="p-2 border border-slate-400 text-center font-bold text-sm">
                        {rec.gradeLetter}
                      </td>
                      <td className="p-2 border border-slate-400 text-center font-bold">
                        <span className={rec.status === 'کامیاب' ? 'text-emerald-800' : 'text-rose-700'}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Gazette Signatures */}
        <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs font-semibold text-slate-800 border-t border-slate-300 mt-8">
          <div>
            <div className="w-36 border-b border-slate-700 mx-auto mb-1"></div>
            <span>دستخط ممتحن / تیار کنندہ</span>
          </div>
          <div>
            <div className="w-36 border-b border-slate-700 mx-auto mb-1"></div>
            <span>دستخط ناظم امتحانات</span>
          </div>
          <div>
            <div className="w-36 border-b border-slate-700 mx-auto mb-1"></div>
            <span>دستخط و مہر مہتمم صاحب</span>
          </div>
        </div>
      </div>
    </div>
  );
};
