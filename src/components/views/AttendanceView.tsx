import React, { useState } from 'react';
import { Student, AttendanceRecord, AttendanceStatus, BranchType, MadrasaSettings } from '../../types';
import { dbService } from '../../services/db';
import { generateWhatsAppAbsenceURL } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  FileQuestion,
  Printer,
  Send,
  Save,
  CheckCheck,
  Search,
  Filter,
  AlertTriangle,
  Trash2
} from 'lucide-react';

interface AttendanceViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendance,
  onRefresh,
  settings
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'teacher';

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [activeTabMode, setActiveTabMode] = useState<'daily' | 'monthly' | 'absentWhatsApp'>('daily');

  // Local draft status mapping for current date: { [studentId]: AttendanceStatus }
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteDayModal, setShowDeleteDayModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const showMsg = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filter students based on branch/grade/section
  const filteredStudents = students.filter(s => {
    if (s.status !== 'فعال') return false;
    if (selectedBranch !== 'all' && s.branch !== selectedBranch) return false;
    if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
    if (selectedSection !== 'all' && s.section !== selectedSection) return false;
    return true;
  });

  // Unique grades and sections for dropdown filters
  const gradesList = Array.from(new Set(students.map(s => s.grade))).filter(Boolean);
  const sectionsList = Array.from(new Set(students.map(s => s.section))).filter(Boolean);

  // Existing attendance records for selected date
  const dayRecords = attendance.filter(a => a.date === selectedDate);

  // Sync draft state with existing records when date changes
  React.useEffect(() => {
    const initialMap: Record<string, AttendanceStatus> = {};
    for (const stu of filteredStudents) {
      const existing = dayRecords.find(r => r.studentId === stu.id);
      if (existing) {
        initialMap[stu.id] = existing.status;
      } else {
        // default to حاضر if not marked yet
        initialMap[stu.id] = 'حاضر';
      }
    }
    setStatusMap(initialMap);
  }, [selectedDate, selectedBranch, selectedGrade, selectedSection, attendance]);

  // "سب حاضر کریں" button
  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    for (const stu of filteredStudents) {
      updated[stu.id] = 'حاضر';
    }
    setStatusMap(updated);
    showMsg('تمام منتخب طلبہ کو "حاضر" نشان زد کر دیا گیا ہے۔ اب "محفوظ کریں" دبائیں۔', 'success');
  };

  // Change single student status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  // Save attendance batch into database (prevent duplicate records for same student & date)
  const handleSaveAttendance = async () => {
    if (!canEdit) return;

    try {
      for (const stu of filteredStudents) {
        const status = statusMap[stu.id] || 'حاضر';
        const existingRecord = dayRecords.find(r => r.studentId === stu.id);

        const recordId = existingRecord ? existingRecord.id : `ATT-${selectedDate}-${stu.id}`;

        const recordToSave: AttendanceRecord = {
          id: recordId,
          studentId: stu.id,
          studentName: stu.fullName,
          fatherName: stu.fatherName,
          guardianMobile: stu.guardianMobile || stu.mobile,
          whatsappMobile: stu.whatsapp || stu.guardianMobile || stu.mobile,
          rollNo: stu.rollNo,
          date: selectedDate,
          branch: stu.branch,
          grade: stu.grade,
          section: stu.section,
          status
        };

        await dbService.put('attendance', recordToSave);
      }

      showMsg(`تاریخ ${selectedDate} کی حاضری کامیابی کے ساتھ محفوظ ہو گئی۔`, 'success');
      await onRefresh();
    } catch (err: any) {
      showMsg('حاضری محفوظ کرنے میں خرابی: ' + err.message, 'error');
    }
  };

  // Open delete confirmation modal
  const handleDeleteDayAttendance = () => {
    if (!canEdit) return;
    if (dayRecords.length === 0) {
      showMsg('اس تاریخ کی کوئی محفوظ شدہ حاضری موجود نہیں ہے۔', 'error');
      return;
    }
    setShowDeleteDayModal(true);
  };

  // Execute deletion of attendance records
  const confirmDeleteDayAttendance = async () => {
    setIsDeleting(true);
    try {
      for (const rec of dayRecords) {
        await dbService.delete('attendance', rec.id);
      }
      showMsg(`تاریخ ${selectedDate} کا حاضری ریکارڈ کامیابی سے حذف ہو گیا۔`, 'success');
      setShowDeleteDayModal(false);
      await onRefresh();
    } catch (err: any) {
      showMsg('حاضری حذف کرنے میں خرابی: ' + (err.message || 'نامعلوم نقص'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Absent students for current selected date
  const absentStudents = dayRecords.filter(r => r.status === 'غیر حاضر');

  // Bulk WhatsApp Trigger
  const handleNotifyAllAbsent = () => {
    if (absentStudents.length === 0) {
      alert('اس تاریخ کے لیے کوئی طالب علم غیر حاضر نہیں ہے۔');
      return;
    }

    if (confirm(`کل ${absentStudents.length} غیر حاضر طلبہ کے والدین کو WhatsApp میسج بھیجنے کا عمل شروع کریں؟`)) {
      // Open the first one directly in new tab
      const first = absentStudents[0];
      const phone = first.guardianMobile || first.whatsappMobile;
      const url = generateWhatsAppAbsenceURL(
        phone,
        first.studentName,
        first.fatherName,
        `${first.branch} - ${first.grade}`,
        first.date
      );
      window.open(url, '_blank');
      
      if (absentStudents.length > 1) {
        alert(`پہلے طالب علم کا WhatsApp کھل چکا ہے۔ بقیہ ${absentStudents.length - 1} طلبہ کے بٹن پر باری باری کلک کر کے اطلاع ارسال فرمائیں۔`);
      }
    }
  };

  // Overall attendance percentages calculation
  const totalMarked = dayRecords.length;
  const totalPresent = dayRecords.filter(r => r.status === 'حاضر' || r.status === 'تاخیر سے حاضر').length;
  const attendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between shadow-md ${
            feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          <span className="text-xs font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-100 text-teal-800 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              حاضری کا نظام و واٹس ایپ اطلاع برائے غیر حاضری
            </h2>
            <p className="text-xs text-slate-500">
              روزانہ حاضری، سب حاضر کرنے کی سہولت، ڈپلیکیٹ کی روک تھام اور خودکار WhatsApp پیغامات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTabMode('daily')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeTabMode === 'daily' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
            }`}
          >
            روزانہ حاضری
          </button>
          <button
            onClick={() => setActiveTabMode('absentWhatsApp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
              activeTabMode === 'absentWhatsApp' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            اطلاع WhatsApp ({absentStudents.length})
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            پرنٹ رجسٹر
          </button>
        </div>
      </div>

      {/* Filter / Selector Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">تاریخ *</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">شعبہ</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">تمام شعبہ جات</option>
              <option value="حفظ القرآن">حفظ القرآن</option>
              <option value="تجوید للحفاظ">تجوید للحفاظ</option>
              <option value="درس نظامی">درس نظامی</option>
              <option value="ناظرہ قرآن">ناظرہ قرآن</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">درجہ / کلاس</label>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">تمام درجات</option>
              {gradesList.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">سیکشن</label>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="all">تمام سیکشنز</option>
              {sectionsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-end gap-2 col-span-2 sm:col-span-1">
            {canEdit && (
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                سب حاضر کریں
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DAILY ATTENDANCE TAB */}
      {activeTabMode === 'daily' && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="no-print bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-4">
              <span className="text-slate-600">
                منتخب طلبہ: <strong className="text-slate-900">{filteredStudents.length}</strong>
              </span>
              <span className="text-emerald-700">
                حاضر: <strong>{filteredStudents.filter(s => statusMap[s.id] === 'حاضر').length}</strong>
              </span>
              <span className="text-rose-600">
                غیر حاضر: <strong>{filteredStudents.filter(s => statusMap[s.id] === 'غیر حاضر').length}</strong>
              </span>
              <span className="text-amber-700">
                رخصت: <strong>{filteredStudents.filter(s => statusMap[s.id] === 'رخصت').length}</strong>
              </span>
              <span className="text-teal-700">
                تاخیر: <strong>{filteredStudents.filter(s => statusMap[s.id] === 'تاخیر سے حاضر').length}</strong>
              </span>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                {dayRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteDayAttendance}
                    title="اس تاریخ کی محفوظ شدہ حاضری حذف کریں"
                    className="border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg font-semibold text-xs transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حاضری حذف کریں
                  </button>
                )}
                <button
                  onClick={handleSaveAttendance}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg font-semibold text-xs shadow-md flex items-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4" />
                  حاضری محفوظ کریں
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3">رول نمبر</th>
                    <th className="p-3">طالب علم کا نام</th>
                    <th className="p-3">والد کا نام</th>
                    <th className="p-3">شعبہ و درجہ</th>
                    <th className="p-3">سرپرست موبائل</th>
                    <th className="p-3 text-center">حاضری کیفیت</th>
                    <th className="p-3 no-print text-center">WhatsApp اطلاع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        منتخب شعبہ یا کلاس میں کوئی طالب علم نہیں ملا۔
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const currentStatus = statusMap[student.id] || 'حاضر';
                      const phone = student.guardianMobile || student.mobile;
                      const waUrl = generateWhatsAppAbsenceURL(
                        phone,
                        student.fullName,
                        student.fatherName,
                        `${student.branch} - ${student.grade}`,
                        selectedDate
                      );

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-800">{student.rollNo}</td>
                          <td className="p-3 font-semibold text-slate-900">{student.fullName}</td>
                          <td className="p-3 text-slate-700">{student.fatherName}</td>
                          <td className="p-3 text-slate-600">
                            {student.branch} ({student.grade})
                          </td>
                          <td className="p-3 text-slate-600">{phone}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              {(['حاضر', 'غیر حاضر', 'رخصت', 'تاخیر سے حاضر'] as AttendanceStatus[]).map(st => {
                                const isSelected = currentStatus === st;
                                let colorClass = '';
                                if (st === 'حاضر') {
                                  colorClass = isSelected ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-emerald-50 text-emerald-800';
                                } else if (st === 'غیر حاضر') {
                                  colorClass = isSelected ? 'bg-rose-600 text-white font-bold' : 'hover:bg-rose-50 text-rose-800';
                                } else if (st === 'رخصت') {
                                  colorClass = isSelected ? 'bg-amber-600 text-white font-bold' : 'hover:bg-amber-50 text-amber-800';
                                } else {
                                  colorClass = isSelected ? 'bg-teal-600 text-white font-bold' : 'hover:bg-teal-50 text-teal-800';
                                }

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, st)}
                                    className={`px-2.5 py-1 rounded-lg text-xs border border-transparent transition ${colorClass}`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-3 no-print text-center">
                            {currentStatus === 'غیر حاضر' ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded-lg font-medium shadow-xs transition"
                              >
                                <Send className="w-3 h-3" />
                                والدین کو اطلاع دیں
                              </a>
                            ) : (
                              <span className="text-slate-300 text-[11px]">—</span>
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

      {/* WHATSAPP ABSENT NOTIFICATION TAB */}
      {activeTabMode === 'absentWhatsApp' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h3 className="font-bold text-base text-slate-800 font-nastaliq">
                غیر حاضر طلبہ کی فہرست برائے WhatsApp اطلاع ({selectedDate})
              </h3>
              <p className="text-xs text-slate-500">
                ایک کلک پر سرپرست کے موبائل نمبر پر باقاعدہ اردو نوٹیفکیشن پری فل ہو جائے گا
              </p>
            </div>

            {absentStudents.length > 0 && (
              <button
                onClick={handleNotifyAllAbsent}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                تمام غیر حاضر طلبہ کو اطلاع دیں
              </button>
            )}
          </div>

          {absentStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium">تاریخ {selectedDate} پر کوئی طالب علم غیر حاضر درج نہیں ہے۔</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {absentStudents.map(rec => {
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
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{rec.studentName}</span>
                        <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          غیر حاضر
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        والد کا نام: <strong>{rec.fatherName}</strong> • رول: {rec.rollNo} • کلاس: {rec.grade}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        سرپرست موبائل نمبر: <strong className="font-mono text-slate-800">{phone || 'موجود نہیں'}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">تاریخ: {rec.date}</span>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3.5 py-1.5 rounded-lg font-medium shadow-xs flex items-center gap-1.5 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        والدین کو اطلاع دیں
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteDayModal}
        title="حاضری ریکارڈ حذف کریں"
        itemName={`تاریخ ${selectedDate} کا حاضری ریکارڈ`}
        itemDetails={`کل ریکارڈز کی تعداد: ${dayRecords.length}`}
        message="کیا آپ واقعی اس تاریخ کا مکمل حاضری ریکارڈ مستقل طور پر حذف کرنا چاہتے ہیں؟"
        onConfirm={confirmDeleteDayAttendance}
        onClose={() => setShowDeleteDayModal(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};
