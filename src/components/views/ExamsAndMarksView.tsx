import React, { useState } from 'react';
import { 
  Student, 
  Exam, 
  ExamType, 
  Subject, 
  StudentExamMark, 
  BranchType, 
  MadrasaSettings 
} from '../../types';
import { dbService } from '../../services/db';
import { calculateGrade } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { 
  FileSpreadsheet, 
  Plus, 
  Save, 
  Printer, 
  CheckCircle2, 
  X, 
  FileCheck2, 
  BookOpen, 
  GraduationCap, 
  Trash2 
} from 'lucide-react';

interface ExamsAndMarksViewProps {
  students: Student[];
  exams: Exam[];
  subjects: Subject[];
  marks: StudentExamMark[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
  setActiveTab: (tab: string) => void;
}

export const ExamsAndMarksView: React.FC<ExamsAndMarksViewProps> = ({
  students,
  exams,
  subjects,
  marks,
  onRefresh,
  settings,
  setActiveTab
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'teacher';

  const [activeTabMode, setActiveTabMode] = useState<'marksEntry' | 'examsList'>('marksEntry');

  // New Exam Modal
  const [showExamModal, setShowExamModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState<ExamType>('سالانہ امتحان');
  const [examYear, setExamYear] = useState('1446-1447ھ / 2025-2026ء');
  const [examBranch, setExamBranch] = useState<BranchType>('درس نظامی');
  const [examGrade, setExamGrade] = useState('اولیٰ');
  const [examStartDate, setExamStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Selected filters for marks entry
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');

  // Local draft marks: { [studentId]: number }
  const [draftMarks, setDraftMarks] = useState<Record<string, number>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [deleteModalExam, setDeleteModalExam] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  // Filter students appropriate for this exam/grade/branch
  const examStudents = students.filter(s => {
    if (s.status !== 'فعال') return false;
    if (selectedExam) {
      if (selectedExam.branch && s.branch !== selectedExam.branch) return false;
      if (selectedExam.grade && selectedExam.grade !== 'تمام درجات' && s.grade !== selectedExam.grade) return false;
    }
    return true;
  });

  // Sync draft marks when exam or subject changes
  React.useEffect(() => {
    if (!selectedExamId || !selectedSubjectId) return;
    const currentSubjectMarks = marks.filter(
      m => m.examId === selectedExamId && m.subjectId === selectedSubjectId
    );
    const map: Record<string, number> = {};
    for (const stu of examStudents) {
      const existing = currentSubjectMarks.find(m => m.studentId === stu.id);
      if (existing) {
        map[stu.id] = existing.obtainedMarks;
      }
    }
    setDraftMarks(map);
  }, [selectedExamId, selectedSubjectId, marks]);

  const handleMarkChange = (studentId: string, val: string) => {
    const total = selectedSubject?.totalMarks || 100;
    const num = Number(val);

    if (num < 0) {
      setValidationError('حاصل کردہ نمبر منفی نہیں ہو سکتے۔');
      return;
    }
    if (num > total) {
      setValidationError(`حاصل کردہ نمبر کل نمبر (${total}) سے زیادہ نہیں ہو سکتے۔`);
      return;
    }

    setValidationError(null);
    setDraftMarks(prev => ({ ...prev, [studentId]: num }));
  };

  const handleSaveMarks = async () => {
    if (!canEdit || !selectedExam || !selectedSubject) return;

    try {
      for (const stu of examStudents) {
        const obtained = draftMarks[stu.id];
        if (obtained !== undefined && !isNaN(obtained)) {
          const markId = `M-${selectedExam.id}-${selectedSubject.id}-${stu.id}`;
          const markObj: StudentExamMark = {
            id: markId,
            examId: selectedExam.id,
            studentId: stu.id,
            subjectId: selectedSubject.id,
            subjectName: selectedSubject.name,
            totalMarks: selectedSubject.totalMarks,
            obtainedMarks: Number(obtained)
          };
          await dbService.put('marks', markObj);
        }
      }

      setSaveSuccess(`امتحان "${selectedExam.title}" برائے "${selectedSubject.name}" کے نمبرات کامیابی سے محفوظ ہو گئے۔`);
      setTimeout(() => setSaveSuccess(null), 3000);
      await onRefresh();
    } catch (err: any) {
      alert('نمبرات محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      alert('امتحان کا نام درج کریں۔');
      return;
    }

    try {
      const newExam: Exam = {
        id: `EXAM-${Date.now().toString().slice(-4)}`,
        title: examTitle,
        type: examType,
        academicYear: examYear,
        branch: examBranch,
        grade: examGrade,
        startDate: examStartDate
      };

      await dbService.put('exams', newExam);
      setSelectedExamId(newExam.id);
      setShowExamModal(false);
      await onRefresh();
    } catch (err: any) {
      alert('امتحان بنانے میں خرابی: ' + err.message);
    }
  };

  const handleDeleteExam = (ex: Exam) => {
    if (!canEdit) return;
    setDeleteModalExam(ex);
  };

  const confirmDeleteExam = async () => {
    if (!deleteModalExam) return;
    setIsDeleting(true);
    try {
      await dbService.delete('exams', deleteModalExam.id);
      const relatedMarks = marks.filter(m => m.examId === deleteModalExam.id);
      for (const rm of relatedMarks) {
        await dbService.delete('marks', rm.id);
      }
      if (selectedExamId === deleteModalExam.id) {
        setSelectedExamId('');
      }
      setDeleteModalExam(null);
      await onRefresh();
    } catch (err: any) {
      alert('امتحان حذف کرنے میں خرابی: ' + (err.message || 'نامعلوم خرابی'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              امتحانات کا انتظام و نمبرات کا اندراج (Exams & Marks)
            </h2>
            <p className="text-xs text-slate-500">
              ماہانہ، ششماہی و سالانہ امتحانات، مضامین کے نمبرات، پوزیشن اور گریڈ کیلکولیشن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabMode('marksEntry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTabMode === 'marksEntry' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}
          >
            نمبرات کا اندراج
          </button>
          <button
            onClick={() => setActiveTabMode('examsList')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTabMode === 'examsList' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}
          >
            امتحانات فہرست ({exams.length})
          </button>

          {canEdit && (
            <button
              onClick={() => setShowExamModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              نیا امتحان بنائیں
            </button>
          )}

          <button
            onClick={() => setActiveTab('dmc')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <FileCheck2 className="w-4 h-4" />
            تفصیلی سند (DMC)
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {saveSuccess}
        </div>
      )}

      {validationError && (
        <div className="bg-rose-600 text-white p-3 rounded-xl shadow-md text-xs font-semibold flex items-center gap-2">
          <X className="w-4 h-4" />
          {validationError}
        </div>
      )}

      {/* MARKS ENTRY MODE */}
      {activeTabMode === 'marksEntry' && (
        <div className="space-y-4">
          {/* Selectors */}
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">امتحان منتخب کریں *</label>
              <select
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white font-bold"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.branch} - {ex.grade})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">مضمون منتخب کریں *</label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white font-bold"
              >
                {subjects.map(sb => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name} (کل نمبر: {sb.totalMarks}) - {sb.grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <span className="text-slate-500 text-[11px] block">اس مضمون کے کل نمبرات:</span>
              <span className="text-lg font-bold text-blue-900">
                {selectedSubject?.totalMarks || 100} نمبر
              </span>
            </div>

            <div className="flex items-end justify-end">
              {canEdit && (
                <button
                  onClick={handleSaveMarks}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4" />
                  نمبرات محفوظ کریں
                </button>
              )}
            </div>
          </div>

          {/* Marks Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">
                امتحان: {selectedExam?.title} • مضمون: {selectedSubject?.name} • کل طلبہ: {examStudents.length}
              </span>
              <span className="text-slate-500 text-[11px]">
                کم از کم پاس نمبرات: 50% ({Math.round((selectedSubject?.totalMarks || 100) * 0.5)})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3">رول نمبر</th>
                    <th className="p-3">طالب علم کا نام</th>
                    <th className="p-3">والد کا نام</th>
                    <th className="p-3">شعبہ و کلاس</th>
                    <th className="p-3 text-center">کل نمبرات</th>
                    <th className="p-3 text-center">حاصل کردہ نمبرات (Obtained) *</th>
                    <th className="p-3 text-center">فیصد (%)</th>
                    <th className="p-3 text-center">گریڈ (Grade)</th>
                    <th className="p-3 text-center">نتیجہ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        اس امتحان یا کلاس کے لیے کوئی فعال طالب علم موجود نہیں ہے۔
                      </td>
                    </tr>
                  ) : (
                    examStudents.map(student => {
                      const totalM = selectedSubject?.totalMarks || 100;
                      const val = draftMarks[student.id];
                      const obtained = val !== undefined && !isNaN(val) ? val : null;
                      const percentage = obtained !== null ? Math.min(100, Math.round((obtained / totalM) * 100)) : null;
                      const gradeInfo = percentage !== null ? calculateGrade(percentage) : null;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-800">{student.rollNo}</td>
                          <td className="p-3 font-semibold text-slate-900">{student.fullName}</td>
                          <td className="p-3 text-slate-700">{student.fatherName}</td>
                          <td className="p-3 text-slate-600">{student.branch} ({student.grade})</td>
                          <td className="p-3 text-center font-bold text-slate-700">{totalM}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={totalM}
                              disabled={!canEdit}
                              placeholder="0"
                              value={obtained !== null ? obtained : ''}
                              onChange={e => handleMarkChange(student.id, e.target.value)}
                              className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800">
                            {percentage !== null ? `${percentage}%` : '—'}
                          </td>
                          <td className="p-3 text-center">
                            {gradeInfo ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  gradeInfo.pass
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {gradeInfo.grade}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {gradeInfo ? (
                              <span
                                className={`font-bold ${
                                  gradeInfo.pass ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {gradeInfo.pass ? 'کامیاب' : 'ناکام'}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXAMS LIST MODE */}
      {activeTabMode === 'examsList' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">تمام منعقدہ امتحانات کی فہرست</h3>
            <span className="text-xs text-slate-500">کل امتحانات: {exams.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3">امتحان نام</th>
                  <th className="p-3">قسم</th>
                  <th className="p-3">تعلیمی سال</th>
                  <th className="p-3">شعبہ</th>
                  <th className="p-3">درجہ / کلاس</th>
                  <th className="p-3">تاریخ آغاز</th>
                  <th className="p-3 no-print text-center">کارروائی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map(ex => (
                  <tr key={ex.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900 text-sm">{ex.title}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium">
                        {ex.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{ex.academicYear}</td>
                    <td className="p-3 text-slate-700">{ex.branch}</td>
                    <td className="p-3 text-slate-700">{ex.grade}</td>
                    <td className="p-3 text-slate-600">{ex.startDate}</td>
                    <td className="p-3 no-print text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedExamId(ex.id);
                            setActiveTabMode('marksEntry');
                          }}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded text-xs font-semibold"
                        >
                          نمبرات لگائیں
                        </button>
                        {role === 'admin' && (
                          <button
                            onClick={() => handleDeleteExam(ex)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW EXAM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base font-nastaliq text-slate-900">نیا امتحان تخلیق کریں</h3>
              <button onClick={() => setShowExamModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">امتحان نام *</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: سالانہ امتحانات ۱۴۴۶ھ"
                  value={examTitle}
                  onChange={e => setExamTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">امتحان کی قسم</label>
                <select
                  value={examType}
                  onChange={e => setExamType(e.target.value as ExamType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ماہانہ امتحان">ماہانہ امتحان</option>
                  <option value="ششماہی امتحان">ششماہی امتحان</option>
                  <option value="سالانہ امتحان">سالانہ امتحان</option>
                  <option value="دیگر">دیگر</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">تعلیمی سال</label>
                <input
                  type="text"
                  value={examYear}
                  onChange={e => setExamYear(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">شعبہ</label>
                <select
                  value={examBranch}
                  onChange={e => setExamBranch(e.target.value as BranchType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="درس نظامی">درس نظامی</option>
                  <option value="حفظ القرآن">حفظ القرآن</option>
                  <option value="تجوید للحفاظ">تجوید للحفاظ</option>
                  <option value="ناظرہ قرآن">ناظرہ قرآن</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">درجہ / کلاس</label>
                <input
                  type="text"
                  placeholder="مثلاً: اولیٰ یا تمام درجات"
                  value={examGrade}
                  onChange={e => setExamGrade(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">تاریخ آغاز</label>
                <input
                  type="date"
                  value={examStartDate}
                  onChange={e => setExamStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-1.5 border rounded-lg text-slate-700"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  امتحان بنائیں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalExam}
        title="امتحان کا ریکارڈ حذف کریں"
        itemName={deleteModalExam ? `${deleteModalExam.title} (${deleteModalExam.branch} - ${deleteModalExam.grade})` : ''}
        itemDetails={deleteModalExam ? `امتحانی سال: ${deleteModalExam.academicYear} • قسم: ${deleteModalExam.type}` : ''}
        message="کیا آپ واقعی اس امتحان اور اس کے تمام طلبہ کے درج شدہ نمبرات کو مستقل طور پر حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکے گا۔"
        onConfirm={confirmDeleteExam}
        onClose={() => setDeleteModalExam(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
