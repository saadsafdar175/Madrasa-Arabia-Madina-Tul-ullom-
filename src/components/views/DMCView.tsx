import React, { useState } from 'react';
import { 
  Student, 
  Exam, 
  Subject, 
  StudentExamMark, 
  MadrasaSettings 
} from '../../types';
import { calculateGrade, formatPKR } from '../../utils/helpers';
import { FileCheck2, Printer, Search, ArrowRight, Award } from 'lucide-react';

interface DMCViewProps {
  students: Student[];
  exams: Exam[];
  subjects: Subject[];
  marks: StudentExamMark[];
  settings: MadrasaSettings;
  preSelectedStudent?: Student | null;
}

export const DMCView: React.FC<DMCViewProps> = ({
  students,
  exams,
  subjects,
  marks,
  settings,
  preSelectedStudent
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preSelectedStudent?.id || students[0]?.id || ''
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Student marks for this exam
  const studentMarks = marks.filter(
    m => m.examId === selectedExamId && m.studentId === selectedStudentId
  );

  // Totals & Position
  const totalMaxMarks = studentMarks.reduce((sum, m) => sum + (Number(m.totalMarks) || 0), 0);
  const totalObtainedMarks = studentMarks.reduce((sum, m) => sum + (Number(m.obtainedMarks) || 0), 0);
  const percentage = totalMaxMarks > 0 ? Math.min(100, Math.round((totalObtainedMarks / totalMaxMarks) * 100)) : 0;
  const gradeInfo = calculateGrade(percentage);

  // Calculate position in this exam:
  // Rank all students who took this exam
  const examStudentsIds = Array.from(new Set(marks.filter(m => m.examId === selectedExamId).map(m => m.studentId)));
  const rankings = examStudentsIds.map(stId => {
    const stMarks = marks.filter(m => m.examId === selectedExamId && m.studentId === stId);
    const totMax = stMarks.reduce((sum, m) => sum + (Number(m.totalMarks) || 0), 0);
    const totObt = stMarks.reduce((sum, m) => sum + (Number(m.obtainedMarks) || 0), 0);
    const pct = totMax > 0 ? (totObt / totMax) * 100 : 0;
    return { studentId: stId, percentage: pct, totalObtained: totObt };
  }).sort((a, b) => b.totalObtained - a.totalObtained);

  const rankIndex = rankings.findIndex(r => r.studentId === selectedStudentId);
  const position = rankIndex >= 0 ? rankIndex + 1 : 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              تفصیلی نمبرات سند (Detailed Marks Certificate - DMC)
            </h2>
            <p className="text-xs text-slate-500">
              معیاری A4 پورٹریٹ تفصیلی نمبرات سند، مدرسہ کا لوگو، مہر، دستخط اور پوزیشن
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition"
        >
          <Printer className="w-4 h-4" />
          DMC سند پرنٹ کریں
        </button>
      </div>

      {/* Selectors */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-700 font-medium mb-1">امتحان منتخب کریں</label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 bg-white font-bold"
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.branch} - {ex.grade})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">طالب علم منتخب کریں</label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-purple-500 bg-white font-bold"
          >
            {students.map(st => (
              <option key={st.id} value={st.id}>
                {st.fullName} بن {st.fatherName} (رول: {st.rollNo} - {st.branch})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* A4 PORTRAIT DMC DOCUMENT CONTAINER */}
      <div className="flex justify-center">
        <div 
          className="bg-white border-2 border-slate-800 p-8 md:p-12 rounded-xl shadow-xl w-full max-w-[210mm] min-h-[297mm] text-slate-900 flex flex-col justify-between relative print:shadow-none print:border-2 print:border-black print:m-0 print:p-8"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Decorative Islamic Frame Border */}
          <div className="border border-amber-600/60 p-4 h-full flex flex-col justify-between">
            {/* Document Header */}
            <div>
              <div className="text-center font-nastaliq text-base text-slate-700 mb-1">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                {/* Madrasa Logo (Uses the saved persistent logo) */}
                <div className="w-24 h-24 flex items-center justify-center">
                  {settings.logoBase64 ? (
                    <img
                      src={settings.logoBase64}
                      alt="لوگو مدرسہ"
                      className="max-h-24 max-w-24 object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-xs">
                      لوگو
                    </div>
                  )}
                </div>

                {/* Madrasa Title Info */}
                <div className="text-center flex-1 px-2">
                  <h1 className="text-2xl md:text-3xl font-bold font-nastaliq text-blue-950 leading-tight">
                    {settings.madrasaNameUrdu}
                  </h1>
                  <h2 className="text-sm font-semibold tracking-wider text-slate-700 uppercase">
                    {settings.madrasaNameEnglish}
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {settings.address}
                  </p>
                  <div className="mt-2 inline-block bg-slate-900 text-white font-bold text-xs px-6 py-1 rounded-full border border-amber-500">
                    تفصیلی نمبرات کی سند (Detailed Marks Certificate)
                  </div>
                </div>

                {/* Student Photo */}
                <div className="w-24 h-28 border border-slate-400 bg-slate-50 flex items-center justify-center rounded overflow-hidden">
                  {selectedStudent?.photoUrl ? (
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-[10px] text-slate-400 p-2">
                      تصویر طالب علم
                    </div>
                  )}
                </div>
              </div>

              {/* Student Metadata Table */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs py-3 border-b border-slate-300">
                <div>
                  <span className="text-slate-500 font-medium">طالب علم کا نام: </span>
                  <span className="font-bold text-slate-900">{selectedStudent?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">والد کا نام: </span>
                  <span className="font-bold text-slate-900">{selectedStudent?.fatherName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">رول نمبر: </span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudent?.rollNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">داخلہ نمبر: </span>
                  <span className="font-mono font-bold text-slate-900">{selectedStudent?.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">شعبہ: </span>
                  <span className="font-bold text-slate-900">{selectedStudent?.branch}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">درجہ / کلاس: </span>
                  <span className="font-bold text-slate-900">{selectedStudent?.grade}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">امتحان: </span>
                  <span className="font-bold text-slate-900">{selectedExam?.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">تعلیمی سال: </span>
                  <span className="font-bold text-slate-900">{selectedStudent?.academicYear || settings.academicYear}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">تاریخ اجراء: </span>
                  <span className="font-bold text-slate-900">{new Date().toLocaleDateString('ur-PK')}</span>
                </div>
              </div>

              {/* Subject Marks Table */}
              <div className="mt-4">
                <table className="w-full text-xs border-collapse border border-slate-900">
                  <thead className="bg-slate-100 border-b border-slate-900">
                    <tr>
                      <th className="p-2 border border-slate-900 text-center w-12">نمبر شمار</th>
                      <th className="p-2 border border-slate-900 text-right">مضمون / کتاب</th>
                      <th className="p-2 border border-slate-900 text-center w-24">کل نمبرات</th>
                      <th className="p-2 border border-slate-900 text-center w-24">حاصل کردہ نمبرات</th>
                      <th className="p-2 border border-slate-900 text-center w-20">گریڈ</th>
                      <th className="p-2 border border-slate-900 text-center w-20">کیفیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentMarks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          اس طالب علم کے لیے اس امتحان میں نمبرات کا اندراج نہیں کیا گیا ہے۔
                        </td>
                      </tr>
                    ) : (
                      studentMarks.map((m, idx) => {
                        const pct = Math.round((m.obtainedMarks / m.totalMarks) * 100);
                        const isPass = pct >= 50;
                        const subGrade = calculateGrade(pct).grade;

                        return (
                          <tr key={m.id} className="border-b border-slate-400">
                            <td className="p-2 border border-slate-400 text-center font-bold">{idx + 1}</td>
                            <td className="p-2 border border-slate-400 font-semibold">{m.subjectName}</td>
                            <td className="p-2 border border-slate-400 text-center font-bold">{m.totalMarks}</td>
                            <td className="p-2 border border-slate-400 text-center font-bold text-sm">
                              {m.obtainedMarks}
                            </td>
                            <td className="p-2 border border-slate-400 text-center font-bold">{subGrade}</td>
                            <td className="p-2 border border-slate-400 text-center font-bold">
                              {isPass ? 'کامیاب' : 'ناکام'}
                            </td>
                          </tr>
                        );
                      })
                    )}

                    {/* Total Row */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-sm">
                      <td colSpan={2} className="p-2.5 border border-slate-900 text-right">
                        مجموعی میزان (Grand Total)
                      </td>
                      <td className="p-2.5 border border-slate-900 text-center">{totalMaxMarks}</td>
                      <td className="p-2.5 border border-slate-900 text-center text-base">{totalObtainedMarks}</td>
                      <td className="p-2.5 border border-slate-900 text-center">{gradeInfo.grade}</td>
                      <td className="p-2.5 border border-slate-900 text-center">
                        {gradeInfo.pass ? 'کامیاب' : 'ناکام'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Assessment & Position Box */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-400 rounded grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block">فیصد (Percentage)</span>
                  <span className="text-base font-bold text-slate-900">{percentage}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">حتمی گریڈ (Grade)</span>
                  <span className="text-base font-bold text-slate-900">{gradeInfo.grade}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">پوزیشن (Position)</span>
                  <span className="text-base font-bold text-purple-900">
                    {position === 1 ? 'پہلی پوزیشن (1st)' : position === 2 ? 'دوسری پوزیشن (2nd)' : position === 3 ? 'تیسری پوزیشن (3rd)' : `${position}th`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">نتیجہ (Result)</span>
                  <span className={`text-base font-bold ${gradeInfo.pass ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {gradeInfo.pass ? 'کامیاب (Passed)' : 'ناکام (Failed)'}
                  </span>
                </div>
              </div>

              {/* Grading Key Note */}
              <div className="mt-3 text-[10px] text-slate-500 text-center">
                گریڈنگ معیار: 90 تا 100% = A+ (ممتاز) • 80 تا 89% = A (بہت اچھا) • 70 تا 79% = B (اچھا) • 60 تا 69% = C (تسلی بخش) • 50 تا 59% = D (مقبول) • 50% سے کم = F (ناکام)
              </div>
            </div>

            {/* Document Footer: Signatures & Stamp */}
            <div className="pt-8 border-t border-slate-300">
              <div className="grid grid-cols-3 gap-4 text-center text-xs font-semibold text-slate-800">
                <div>
                  <div className="h-12 flex items-end justify-center">
                    <span className="text-slate-400 italic text-[11px]">[دستخط]</span>
                  </div>
                  <div className="border-t border-slate-700 pt-1">
                    استاد متعلقہ / کلاس انچارج
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-700/60 flex items-center justify-center text-[10px] text-amber-900">
                    مہر مدرسہ
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">تصدیقی مہر</span>
                </div>

                <div>
                  <div className="h-12 flex items-end justify-center">
                    <span className="text-slate-400 italic text-[11px]">[دستخط]</span>
                  </div>
                  <div className="border-t border-slate-700 pt-1">
                    مہتمم / ناظمِ تعلیمات
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
