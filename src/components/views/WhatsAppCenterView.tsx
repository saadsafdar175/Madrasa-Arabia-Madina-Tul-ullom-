import React, { useState, useEffect } from 'react';
import {
  Student,
  Teacher,
  FeeRecord,
  AttendanceRecord,
  Exam,
  StudentExamMark,
  MadrasaSettings,
  WhatsAppTemplate,
  WhatsAppMessageLog,
  WhatsAppMessageType,
  WhatsAppMessageStatus,
  WhatsAppApiConfig
} from '../../types';
import { dbService, DEFAULT_WHATSAPP_TEMPLATES } from '../../services/db';
import { formatPKR, calculateGrade } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import {
  MessageSquare,
  Send,
  Users,
  User,
  Clock,
  Settings,
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  DollarSign,
  Award,
  AlertTriangle,
  Smartphone,
  Eye,
  Copy,
  Check
} from 'lucide-react';

interface WhatsAppCenterViewProps {
  students: Student[];
  teachers: Teacher[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
  exams: Exam[];
  marks: StudentExamMark[];
  settings: MadrasaSettings;
  preSelectedStudent?: Student | null;
  onClearPreSelectedStudent?: () => void;
}

export const WhatsAppCenterView: React.FC<WhatsAppCenterViewProps> = ({
  students,
  teachers,
  fees,
  attendance,
  exams,
  marks,
  settings,
  preSelectedStudent,
  onClearPreSelectedStudent
}) => {
  const { role } = useAuth();
  const canManage = role === 'admin' || role === 'teacher';

  const [activeTab, setActiveTab] = useState<'send' | 'bulk' | 'templates' | 'history' | 'api-settings'>('send');

  // Templates & Logs from DB
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Send Message Form State
  const [recipientType, setRecipientType] = useState<'student' | 'teacher' | 'custom'>('student');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [phoneToEdit, setPhoneToEdit] = useState<string>('');

  const [messageType, setMessageType] = useState<WhatsAppMessageType>('انفرادی پیغام');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [messageBody, setMessageBody] = useState<string>('');
  const [sendFeedback, setSendFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Extra context options for fee / exam / date
  const [selectedFeeMonth, setSelectedFeeMonth] = useState<string>('مارچ 2026');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedAbsenceDate, setSelectedAbsenceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Bulk Messaging State
  const [bulkTarget, setBulkTarget] = useState<'all-students' | 'branch-students' | 'fee-defaulters' | 'absent-today' | 'all-teachers'>('fee-defaulters');
  const [bulkBranch, setBulkBranch] = useState<string>('حفظ القرآن');
  const [bulkGrade, setBulkGrade] = useState<string>('تمام درجات');
  const [bulkMessage, setBulkMessage] = useState<string>('');
  const [bulkQueue, setBulkQueue] = useState<Array<{ name: string; phone: string; message: string; role: any }>>([]);
  const [currentBulkIndex, setCurrentBulkIndex] = useState<number>(0);

  // Template Modal State
  const [showTplModal, setShowTplModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState<WhatsAppTemplate | null>(null);
  const [tplTitle, setTplTitle] = useState('');
  const [tplType, setTplType] = useState<WhatsAppMessageType>('انفرادی پیغام');
  const [tplBody, setTplBody] = useState('');
  const [tplToDelete, setTplToDelete] = useState<WhatsAppTemplate | null>(null);

  // History Log Modal / Delete
  const [viewLogDetail, setViewLogDetail] = useState<WhatsAppMessageLog | null>(null);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all');

  // API Config (stored in localStorage for simplicity & offline safety)
  const [apiConfig, setApiConfig] = useState<WhatsAppApiConfig>(() => {
    try {
      const saved = localStorage.getItem('mm_whatsapp_api_config');
      return saved ? JSON.parse(saved) : { enabled: false, apiUrl: '', phoneNumberId: '', bearerToken: '' };
    } catch {
      return { enabled: false, apiUrl: '', phoneNumberId: '', bearerToken: '' };
    }
  });

  // Load Templates & Logs
  const loadData = async () => {
    setLoading(true);
    try {
      const [tplData, logData] = await Promise.all([
        dbService.getAll<WhatsAppTemplate>('whatsapp_templates'),
        dbService.getAll<WhatsAppMessageLog>('whatsapp_logs')
      ]);

      if (tplData.length === 0) {
        setTemplates(DEFAULT_WHATSAPP_TEMPLATES);
      } else {
        setTemplates(tplData);
      }

      setLogs((logData || []).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
    } catch (err) {
      console.error('Failed to load WhatsApp data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle pre-selected student from Student Profile / Table
  useEffect(() => {
    if (preSelectedStudent) {
      setActiveTab('send');
      setRecipientType('student');
      setSelectedStudentId(preSelectedStudent.id);
      const phone = preSelectedStudent.whatsapp || preSelectedStudent.guardianMobile || preSelectedStudent.mobile || '';
      setPhoneToEdit(phone);
    }
  }, [preSelectedStudent]);

  // Clean phone number helper
  const cleanPhoneForWhatsApp = (rawPhone: string): string => {
    let clean = rawPhone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '92' + clean.slice(1);
    } else if (!clean.startsWith('92') && clean.length === 10) {
      clean = '92' + clean;
    }
    return clean;
  };

  // Variable replacement helper
  const resolveTemplateVariables = (rawText: string, student?: Student, customData?: { fee?: number; date?: string; result?: string }): string => {
    let text = rawText;
    const sName = student?.fullName || 'عزیز طالب علم';
    const fName = student?.fatherName || student?.guardianName || 'محترم سرپرست';
    const sClass = student ? `${student.branch} (${student.grade})` : 'کلاس';
    const feeAmt = customData?.fee !== undefined ? formatPKR(customData.fee) : '3,500 روپے';
    const dateStr = customData?.date || new Date().toLocaleDateString('ur-PK');
    const resStr = customData?.result || 'کامیاب - گریڈ A+';

    text = text.replace(/\{student_name\}/g, sName);
    text = text.replace(/\{father_name\}/g, fName);
    text = text.replace(/\{class\}/g, sClass);
    text = text.replace(/\{fee_amount\}/g, feeAmt);
    text = text.replace(/\{date\}/g, dateStr);
    text = text.replace(/\{result\}/g, resStr);

    return text;
  };

  // When recipient or template changes, update messageBody & phone
  const updateMessageDraft = (newStudentId: string, newTplId: string, newMsgType: WhatsAppMessageType) => {
    const student = students.find(s => s.id === newStudentId);
    if (student) {
      const phone = student.whatsapp || student.guardianMobile || student.mobile || '';
      setPhoneToEdit(phone);
    }

    let template = templates.find(t => t.id === newTplId);
    if (!template) {
      template = templates.find(t => t.type === newMsgType) || templates[0];
    }

    if (template) {
      // Find fee or result if needed
      let feeAmt = 3500;
      if (student) {
        const studentFee = fees.find(f => f.studentId === student.id && f.month === selectedFeeMonth);
        if (studentFee) feeAmt = studentFee.balance || studentFee.totalAmount;
      }

      let examResultText = 'کامیاب - اچھے نمبرات';
      if (student && selectedExamId) {
        const sMarks = marks.filter(m => m.examId === selectedExamId && m.studentId === student.id);
        const totMax = sMarks.reduce((a, b) => a + (Number(b.totalMarks) || 0), 0);
        const totObt = sMarks.reduce((a, b) => a + (Number(b.obtainedMarks) || 0), 0);
        const pct = totMax > 0 ? Math.round((totObt / totMax) * 100) : 0;
        const gr = calculateGrade(pct);
        examResultText = `کل نمبرات: ${totMax}، حاصل کردہ: ${totObt} (${pct}%)، گریڈ: ${gr.labelUrdu}`;
      }

      const generated = resolveTemplateVariables(template.message, student, {
        fee: feeAmt,
        date: selectedAbsenceDate,
        result: examResultText
      });
      setMessageBody(generated);
    }
  };

  // Trigger dispatch via WhatsApp Web or App
  const handleDispatchMessage = async (openMode: 'web' | 'app') => {
    let targetPhone = phoneToEdit.trim();
    let targetName = '';
    let roleType: any = 'طالب علم';

    if (recipientType === 'student') {
      const s = students.find(st => st.id === selectedStudentId);
      if (!s) {
        setSendFeedback({ text: 'براہِ کرم پہلے کوئی طالب علم منتخب کریں۔', type: 'error' });
        return;
      }
      targetName = `${s.fullName} (${s.fatherName})`;
      roleType = 'والد / سرپرست';
      if (!targetPhone) {
        targetPhone = s.whatsapp || s.guardianMobile || s.mobile || '';
      }
    } else if (recipientType === 'teacher') {
      const t = teachers.find(tch => tch.id === selectedTeacherId);
      if (!t) {
        setSendFeedback({ text: 'براہِ کرم پہلے کوئی استاد محترم منتخب کریں۔', type: 'error' });
        return;
      }
      targetName = t.name;
      roleType = 'استاد';
      if (!targetPhone) {
        targetPhone = t.whatsapp || t.mobile || '';
      }
    } else {
      if (!customName.trim() || !customPhone.trim()) {
        setSendFeedback({ text: 'براہِ کرم نام اور فون نمبر درج کریں۔', type: 'error' });
        return;
      }
      targetName = customName;
      targetPhone = customPhone;
      roleType = 'دیگر';
    }

    if (!targetPhone) {
      setSendFeedback({ text: 'موبائل / واٹس ایپ نمبر درج کرنا لازمی ہے۔', type: 'error' });
      return;
    }

    if (!messageBody.trim()) {
      setSendFeedback({ text: 'پیغام کا متن خالی نہیں ہو سکتا۔', type: 'error' });
      return;
    }

    const cleanPhone = cleanPhoneForWhatsApp(targetPhone);
    const encodedText = encodeURIComponent(messageBody);

    let url = '';
    if (openMode === 'web') {
      url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    } else {
      url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }

    // Save Log in IndexedDB with honest status: 'کھولی گئی (Opened via WhatsApp)'
    const newLog: WhatsAppMessageLog = {
      id: `WLOG-${Date.now()}`,
      recipientName: targetName,
      recipientPhone: targetPhone,
      recipientRole: roleType,
      studentId: recipientType === 'student' ? selectedStudentId : undefined,
      messageType: messageType,
      messageText: messageBody,
      status: 'کھولی گئی (Opened via WhatsApp)',
      sentAt: new Date().toISOString(),
      method: openMode
    };

    try {
      await dbService.put('whatsapp_logs', newLog);
      setLogs(prev => [newLog, ...prev]);
    } catch (e) {
      console.warn('Could not save WhatsApp log:', e);
    }

    // Open WhatsApp URL
    window.open(url, '_blank');

    setSendFeedback({
      text: `WhatsApp ${openMode === 'web' ? 'ویب' : 'ایپ'} پر پیغام کھول دیا گیا ہے۔ براؤزر ونڈو میں Send بٹن دبائیں۔`,
      type: 'success'
    });

    if (onClearPreSelectedStudent) {
      onClearPreSelectedStudent();
    }
  };

  // Bulk Messaging generator
  const generateBulkQueue = () => {
    let targets: Array<{ name: string; phone: string; message: string; role: any }> = [];

    if (bulkTarget === 'fee-defaulters') {
      const unpaidFees = fees.filter(f => f.status === 'بقایا' || f.status === 'جزوی');
      targets = unpaidFees.map(f => {
        const student = students.find(s => s.id === f.studentId);
        const phone = student?.whatsapp || student?.guardianMobile || student?.mobile || '';
        const msg = resolveTemplateVariables(
          bulkMessage || DEFAULT_WHATSAPP_TEMPLATES[0].message,
          student,
          { fee: f.balance || f.totalAmount, date: f.date }
        );
        return {
          name: f.studentName,
          phone,
          message: msg,
          role: 'والد / سرپرست'
        };
      }).filter(t => !!t.phone);
    } else if (bulkTarget === 'absent-today') {
      const todayAbsent = attendance.filter(a => a.status === 'غیر حاضر');
      targets = todayAbsent.map(a => {
        const student = students.find(s => s.id === a.studentId);
        const phone = a.whatsappMobile || a.guardianMobile || student?.mobile || '';
        const msg = resolveTemplateVariables(
          bulkMessage || DEFAULT_WHATSAPP_TEMPLATES[1].message,
          student,
          { date: a.date }
        );
        return {
          name: a.studentName,
          phone,
          message: msg,
          role: 'والد / سرپرست'
        };
      }).filter(t => !!t.phone);
    } else if (bulkTarget === 'all-students') {
      targets = students.filter(s => s.status === 'فعال').map(s => {
        const phone = s.whatsapp || s.guardianMobile || s.mobile || '';
        const msg = resolveTemplateVariables(bulkMessage || DEFAULT_WHATSAPP_TEMPLATES[3].message, s);
        return {
          name: `${s.fullName} (${s.fatherName})`,
          phone,
          message: msg,
          role: 'والد / سرپرست'
        };
      }).filter(t => !!t.phone);
    } else if (bulkTarget === 'all-teachers') {
      targets = teachers.filter(t => t.status === 'فعال').map(t => {
        const phone = t.whatsapp || t.mobile || '';
        return {
          name: t.name,
          phone,
          message: bulkMessage || `محترم استاد ${t.name}! السلام علیکم ورحمۃ اللہ، مدرسہ کی جانب سے اہم پیغام۔`,
          role: 'استاد'
        };
      }).filter(t => !!t.phone);
    }

    setBulkQueue(targets);
    setCurrentBulkIndex(0);
  };

  const handleSendCurrentBulkItem = async () => {
    if (bulkQueue.length === 0 || currentBulkIndex >= bulkQueue.length) return;
    const item = bulkQueue[currentBulkIndex];
    const cleanPhone = cleanPhoneForWhatsApp(item.phone);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(item.message)}`;

    const newLog: WhatsAppMessageLog = {
      id: `WLOG-BULK-${Date.now()}-${currentBulkIndex}`,
      recipientName: item.name,
      recipientPhone: item.phone,
      recipientRole: item.role,
      messageType: 'عام اعلان',
      messageText: item.message,
      status: 'کھولی گئی (Opened via WhatsApp)',
      sentAt: new Date().toISOString(),
      method: 'app'
    };

    try {
      await dbService.put('whatsapp_logs', newLog);
      setLogs(prev => [newLog, ...prev]);
    } catch (e) {
      console.warn('Failed to log bulk item:', e);
    }

    window.open(url, '_blank');
    setCurrentBulkIndex(prev => prev + 1);
  };

  // Template CRUD
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim() || !tplBody.trim()) {
      alert('عنوان اور پیغام دونوں درج کرنا لازمی ہیں۔');
      return;
    }

    const newTpl: WhatsAppTemplate = {
      id: editingTpl?.id || `TPL-${Date.now().toString().slice(-4)}`,
      title: tplTitle,
      type: tplType,
      message: tplBody,
      isDefault: editingTpl?.isDefault || false
    };

    try {
      await dbService.put('whatsapp_templates', newTpl);
      setTemplates(prev => {
        const idx = prev.findIndex(t => t.id === newTpl.id);
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = newTpl;
          return cp;
        }
        return [...prev, newTpl];
      });
      setShowTplModal(false);
      setEditingTpl(null);
    } catch (err: any) {
      alert('سانچہ محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!tplToDelete) return;
    try {
      await dbService.delete('whatsapp_templates', tplToDelete.id);
      setTemplates(prev => prev.filter(t => t.id !== tplToDelete.id));
      setTplToDelete(null);
    } catch (err: any) {
      alert('حذف کرنے میں خرابی: ' + err.message);
    }
  };

  // Clear Message History
  const confirmClearHistory = async () => {
    try {
      for (const log of logs) {
        await dbService.delete('whatsapp_logs', log.id);
      }
      setLogs([]);
      setShowClearHistoryModal(false);
    } catch (err: any) {
      alert('ہسٹری صاف کرنے میں خرابی: ' + err.message);
    }
  };

  // Filtered Logs
  const filteredLogs = logs.filter(l => {
    if (historyTypeFilter !== 'all' && l.messageType !== historyTypeFilter) return false;
    if (historySearch) {
      const q = historySearch.toLowerCase();
      return (
        l.recipientName.toLowerCase().includes(q) ||
        l.recipientPhone.includes(q) ||
        l.messageText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              واٹس ایپ رابطہ سینٹر (Professional WhatsApp Center)
            </h2>
            <p className="text-xs text-slate-500">
              طلبہ، والدین اور اساتذہ کو فیس یاد دہانی، غیر حاضری، نتائج اور اطلاعات بذریعہ WhatsApp ارسال کریں
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'send' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            انفرادی پیغام
          </button>

          <button
            onClick={() => {
              setActiveTab('bulk');
              if (bulkQueue.length === 0) generateBulkQueue();
            }}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'bulk' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            بلک پیغامات (Bulk)
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'templates' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            پیغامات کے سانچے
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            پیغامات کی تاریخ ({logs.length})
          </button>

          <button
            onClick={() => setActiveTab('api-settings')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'api-settings' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            API ترتیبات
          </button>
        </div>
      </div>

      {sendFeedback && (
        <div
          className={`p-3.5 rounded-xl shadow-xs text-xs font-semibold flex items-center justify-between ${
            sendFeedback.type === 'success'
              ? 'bg-emerald-600 text-white'
              : sendFeedback.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{sendFeedback.text}</span>
          </div>
          <button onClick={() => setSendFeedback(null)} className="p-1 hover:bg-black/10 rounded">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SEND MESSAGE (انفرادی پیغام) */}
      {/* ========================================================================= */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form: Parameters & Template Selector */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base text-slate-900 font-nastaliq flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                پیغام تیار کریں اور بھیجیں
              </h3>
              <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                WhatsApp Web & App Direct
              </span>
            </div>

            {/* Step 1: Choose Recipient Type */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">موصول کنندہ کی قسم منتخب کریں:</label>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientType('student');
                    if (students.length > 0 && !selectedStudentId) {
                      setSelectedStudentId(students[0].id);
                      updateMessageDraft(students[0].id, selectedTemplateId, messageType);
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    recipientType === 'student'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <User className="w-5 h-5 text-emerald-600" />
                  <span>طالب علم / والد</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecipientType('teacher');
                    if (teachers.length > 0 && !selectedTeacherId) {
                      setSelectedTeacherId(teachers[0].id);
                      setPhoneToEdit(teachers[0].whatsapp || teachers[0].mobile || '');
                    }
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    recipientType === 'teacher'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>استاد محترم</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecipientType('custom');
                    setPhoneToEdit(customPhone);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    recipientType === 'custom'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span>دیگر / نیا نمبر</span>
                </button>
              </div>
            </div>

            {/* Recipient Picker */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              {recipientType === 'student' && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">طالب علم منتخب کریں *</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => {
                      setSelectedStudentId(e.target.value);
                      updateMessageDraft(e.target.value, selectedTemplateId, messageType);
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- طالب علم منتخب کریں --</option>
                    {students.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} بن {st.fatherName} (رول: {st.rollNo} • شعبہ: {st.branch} • کلاس: {st.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientType === 'teacher' && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">استاد محترم منتخب کریں *</label>
                  <select
                    value={selectedTeacherId}
                    onChange={e => {
                      setSelectedTeacherId(e.target.value);
                      const t = teachers.find(tch => tch.id === e.target.value);
                      if (t) setPhoneToEdit(t.whatsapp || t.mobile || '');
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- استاد منتخب کریں --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (شعبہ: {t.branch} • موبائل: {t.whatsapp || t.mobile})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientType === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">نام موصول کنندہ</label>
                    <input
                      type="text"
                      placeholder="نام درج کریں..."
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">فون / واٹس ایپ نمبر</label>
                    <input
                      type="text"
                      placeholder="0300-1234567"
                      value={customPhone}
                      onChange={e => {
                        setCustomPhone(e.target.value);
                        setPhoneToEdit(e.target.value);
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Editable Phone Number with verification note */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-medium">
                    واٹس ایپ نمبر برائے ترسیل (پیشگی دیکھیں اور تبدیل کریں):
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                    بین الاقوامی کوڈ خودکار لگے گا (+92)
                  </span>
                </div>
                <input
                  type="text"
                  value={phoneToEdit}
                  onChange={e => setPhoneToEdit(e.target.value)}
                  placeholder="03001234567"
                  className="w-full border border-emerald-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Step 2: Message Type & Template Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">پیغام کی قسم (Message Type)</label>
                <select
                  value={messageType}
                  onChange={e => {
                    const mt = e.target.value as WhatsAppMessageType;
                    setMessageType(mt);
                    updateMessageDraft(selectedStudentId, selectedTemplateId, mt);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-bold text-slate-800"
                >
                  <option value="انفرادی پیغام">انفرادی پیغام (General)</option>
                  <option value="فیس یاد دہانی">فیس بقایا یاد دہانی (Fee Reminder)</option>
                  <option value="غیر حاضری اطلاع">غیر حاضری کی اطلاع (Absence Notice)</option>
                  <option value="امتحانی نتیجہ">امتحانی نتیجہ اطلاع (Exam Result)</option>
                  <option value="عام اعلان">عام اعلان / نوٹس (Announcement)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">سانچہ منتخب کریں (Template)</label>
                <select
                  value={selectedTemplateId}
                  onChange={e => {
                    setSelectedTemplateId(e.target.value);
                    updateMessageDraft(selectedStudentId, e.target.value, messageType);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- سانچہ منتخب کریں --</option>
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title} ({tpl.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Variable Insertion Pills */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600">
                متغیرات (Variables) پر کلک کر کے پیغام میں شامل کریں:
              </label>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  { tag: '{student_name}', label: 'طالب علم کا نام' },
                  { tag: '{father_name}', label: 'والد کا نام' },
                  { tag: '{class}', label: 'شعبہ و درجہ' },
                  { tag: '{fee_amount}', label: 'فیس رقم' },
                  { tag: '{date}', label: 'تاریخ' },
                  { tag: '{result}', label: 'امتحانی نتیجہ' }
                ].map(v => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => setMessageBody(prev => prev + ' ' + v.tag)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2 py-1 rounded-md transition font-mono"
                  >
                    {v.tag} <span className="text-[10px] text-slate-500 font-sans">({v.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                پیغام کا متن (اردو یا English دونوں میں لکھا جا سکتا ہے):
              </label>
              <textarea
                rows={6}
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                placeholder="اپنا پیغام یہاں لکھیں..."
                className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 leading-relaxed font-naskh focus:ring-2 focus:ring-emerald-500"
                dir="auto"
              />
            </div>

            {/* Dispatch Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
              <div className="text-[11px] text-slate-500">
                💡 دونوں بٹن آف لائن ڈیسک ٹاپ یا موبائل براؤزر کے ساتھ بلا تعطل کام کرتے ہیں۔
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDispatchMessage('web')}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  WhatsApp Web پر کھولیں
                </button>

                <button
                  type="button"
                  onClick={() => handleDispatchMessage('app')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  WhatsApp App پر بھیجیں
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Preview Box */}
          <div className="space-y-4">
            <div className="bg-emerald-950 text-white p-5 rounded-2xl shadow-md border border-emerald-900">
              <div className="flex items-center gap-2 border-b border-emerald-800/80 pb-3 mb-3">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm font-nastaliq">WhatsApp لائیو پریویو</h4>
              </div>

              {/* Chat bubble simulation */}
              <div className="bg-emerald-900/60 rounded-xl p-4 border border-emerald-800 text-xs space-y-2">
                <div className="text-[11px] text-emerald-300 font-mono">
                  نمبر: {phoneToEdit || '03xx-xxxxxxx'}
                </div>
                <div className="bg-emerald-800/80 text-white p-3 rounded-lg leading-relaxed whitespace-pre-wrap font-naskh text-[12px] border border-emerald-700">
                  {messageBody || 'پیغام کا متن یہاں ظاہر ہوگا...'}
                </div>
                <div className="text-[10px] text-emerald-300/80 text-left font-mono">
                  {new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>

              <div className="mt-4 text-[11px] text-emerald-200/90 leading-relaxed bg-emerald-900/40 p-3 rounded-xl border border-emerald-800">
                <strong>اہم نکتہ برائے شفافیت:</strong>
                <p className="mt-1">
                  عام WhatsApp لنک کلک کرنے پر چیٹ ونڈو میں پیغام خودکار بھر جاتا ہے۔ صارف کے کلک پر لاگ میں اسٹیٹس <em>"کھولی گئی (Opened via WhatsApp)"</em> درج ہوتا ہے، جعلی Delivery کا دعویٰ نہیں کیا جاتا۔
                </p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-2 text-slate-600">
              <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                طریقہ کار:
              </h5>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-600">
                <li>طالب علم کا انتخاب کریں، فون اور نام خودکار لوڈ ہو جائے گا۔</li>
                <li>پیغام میں اپنی مرضی کے مطابق تبدیلی کر سکتے ہیں۔</li>
                <li>بٹن کلک کرنے پر WhatsApp ونڈو میسج سمیت کھل جائے گی۔</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BULK MESSAGING (بیک وقت متعدد پیغامات) */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-nastaliq flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                بلک پیغامات روانگی (Bulk WhatsApp Messaging)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                فیس نادہندگان، غیر حاضر طلبہ، مخصوص شعبہ جات یا تمام اساتذہ کو ایک کلک میں قطار میں لگا کر ارسال کریں
              </p>
            </div>

            <button
              onClick={generateBulkQueue}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              فہرست دوبارہ تیار کریں
            </button>
          </div>

          {/* Target Group Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setBulkTarget('fee-defaulters');
                setTimeout(generateBulkQueue, 50);
              }}
              className={`p-3 rounded-xl border text-right transition ${
                bulkTarget === 'fee-defaulters'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span className="font-bold">فیس نادہندگان طلبہ</span>
              </div>
              <p className="text-[11px] text-slate-500">جن کی فیس باقی ہے</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setBulkTarget('absent-today');
                setTimeout(generateBulkQueue, 50);
              }}
              className={`p-3 rounded-xl border text-right transition ${
                bulkTarget === 'absent-today'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span className="font-bold">آج کے غیر حاضر طلبہ</span>
              </div>
              <p className="text-[11px] text-slate-500">حاضری ریکارڈ کے مطابق</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setBulkTarget('all-students');
                setTimeout(generateBulkQueue, 50);
              }}
              className={`p-3 rounded-xl border text-right transition ${
                bulkTarget === 'all-students'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-bold">تمام فعال طلبہ</span>
              </div>
              <p className="text-[11px] text-slate-500">کل تعداد: {students.filter(s => s.status === 'فعال').length}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setBulkTarget('all-teachers');
                setTimeout(generateBulkQueue, 50);
              }}
              className={`p-3 rounded-xl border text-right transition ${
                bulkTarget === 'all-teachers'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="font-bold">تمام اساتذہ کرام</span>
              </div>
              <p className="text-[11px] text-slate-500">کل تعداد: {teachers.length}</p>
            </button>
          </div>

          {/* Queue Status and Action Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">قطار میں موجود کل افراد:</p>
              <h4 className="text-xl font-bold font-mono text-emerald-400">
                {bulkQueue.length} افراد <span className="text-xs font-normal text-slate-300">({currentBulkIndex} ارسال شدہ)</span>
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendCurrentBulkItem}
                disabled={bulkQueue.length === 0 || currentBulkIndex >= bulkQueue.length}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                اگلا پیغام ارسال کریں ({currentBulkIndex + 1}/{bulkQueue.length})
              </button>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3">نمبر شمار</th>
                  <th className="p-3">نام موصول کنندہ</th>
                  <th className="p-3">واٹس ایپ نمبر</th>
                  <th className="p-3">پیغام کا پیش نظارہ</th>
                  <th className="p-3">حیثیت</th>
                  <th className="p-3 text-center">کارروائی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bulkQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      کوئی ریکارڈ قطار میں نہیں ملا۔ اوپر گروپ منتخب کریں یا "فہرست دوبارہ تیار کریں" پر کلک کریں۔
                    </td>
                  </tr>
                ) : (
                  bulkQueue.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 transition ${idx === currentBulkIndex ? 'bg-emerald-50/60 font-semibold' : ''}`}
                    >
                      <td className="p-3 font-mono">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="p-3 font-mono">{item.phone}</td>
                      <td className="p-3 max-w-xs truncate text-slate-600">{item.message}</td>
                      <td className="p-3">
                        {idx < currentBulkIndex ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            کھول دیا گیا ✓
                          </span>
                        ) : idx === currentBulkIndex ? (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                            اگلی باری ➔
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">
                            قطار میں
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const clean = cleanPhoneForWhatsApp(item.phone);
                            window.open(`https://wa.me/${clean}?text=${encodeURIComponent(item.message)}`, '_blank');
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition"
                        >
                          ابھی کھولیں
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MESSAGE TEMPLATES (سانچے) */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-nastaliq flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                پیغامات کے معیاری سانچے (Message Templates)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                مختلف مقاصد کے لیے پہلے سے تیار شدہ پیغامات بنائیں، ترمیم کریں اور محفوظ کریں
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setEditingTpl(null);
                  setTplTitle('');
                  setTplType('انفرادی پیغام');
                  setTplBody('');
                  setShowTplModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                نیا سانچہ بنائیں
              </button>
            )}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 font-nastaliq">{tpl.title}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                      {tpl.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap font-naskh leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    {tpl.message}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {tpl.id} {tpl.isDefault ? '• ڈیفالٹ' : ''}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setMessageType(tpl.type);
                        setMessageBody(tpl.message);
                        setActiveTab('send');
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium"
                    >
                      استعمال کریں
                    </button>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTpl(tpl);
                            setTplTitle(tpl.title);
                            setTplType(tpl.type);
                            setTplBody(tpl.message);
                            setShowTplModal(true);
                          }}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded"
                          title="ترمیم کریں"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setTplToDelete(tpl)}
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                          title="حذف کریں"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MESSAGE HISTORY / LOGS (تاریخ) */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-nastaliq flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                پیغامات کی تاریخ و لاگ (WhatsApp Log)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تیار کردہ اور WhatsApp کے ذریعے کھولے گئے تمام پیغامات کا باقاعدہ محفوظ شدہ ریکارڈ
              </p>
            </div>

            <div className="flex items-center gap-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                پرنٹ ہسٹری رپورٹ
              </button>

              {canManage && logs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearHistoryModal(true)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ہسٹری صاف کریں
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-600 mb-1">نام یا فون سے تلاش کریں</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="نام / فون نمبر..."
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 mb-1">پیغام کی قسم سے فلٹر</label>
              <select
                value={historyTypeFilter}
                onChange={e => setHistoryTypeFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value="all">تمام اقسام</option>
                <option value="انفرادی پیغام">انفرادی پیغام</option>
                <option value="فیس یاد دہانی">فیس یاد دہانی</option>
                <option value="غیر حاضری اطلاع">غیر حاضری اطلاع</option>
                <option value="امتحانی نتیجہ">امتحانی نتیجہ</option>
                <option value="عام اعلان">عام اعلان</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setHistorySearch('');
                  setHistoryTypeFilter('all');
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 rounded-lg font-medium transition"
              >
                فلٹرز صاف کریں
              </button>
            </div>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3">تاریخ و وقت</th>
                  <th className="p-3">موصول کنندہ</th>
                  <th className="p-3">رابطہ / فون</th>
                  <th className="p-3">قسم</th>
                  <th className="p-3">پیغام کا خلاصہ</th>
                  <th className="p-3">حیثیت</th>
                  <th className="p-3 no-print text-center">کارروائی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      کوئی ریکارڈ موجود نہیں ہے۔
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString('ur-PK', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{log.recipientName}</td>
                      <td className="p-3 font-mono text-slate-700">{log.recipientPhone}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                          {log.messageType}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-600">{log.messageText}</td>
                      <td className="p-3">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3 no-print text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewLogDetail(log)}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="تفصیل دیکھیں"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const clean = cleanPhoneForWhatsApp(log.recipientPhone);
                              window.open(`https://wa.me/${clean}?text=${encodeURIComponent(log.messageText)}`, '_blank');
                            }}
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="دوبارہ کھولیں"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: OPTIONAL BUSINESS API SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'api-settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-nastaliq flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                WhatsApp Cloud / Business API اختیاری ترتیبات
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                اگر آپ باضابطہ Meta WhatsApp Business API استعمال کرنا چاہیں تو اس کی کنفیگریشن یہاں درج کر سکتے ہیں
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 leading-relaxed space-y-2">
            <h5 className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              اہم معلومات برائے مدرسہ آفس:
            </h5>
            <p>
              عام دفتری استعمال کے لیے کسی ادا شدہ API کی قطعی ضرورت نہیں ہے۔ سافٹ ویئر <strong>WhatsApp Web اور WhatsApp App Direct Link</strong> کی سہولت سے 100% مفت اور آف لائن دوستانہ کام کرتا ہے۔
            </p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              localStorage.setItem('mm_whatsapp_api_config', JSON.stringify(apiConfig));
              setSendFeedback({ text: 'API ترتیبات کامیابی سے محفوظ ہو گئیں۔', type: 'success' });
            }}
            className="space-y-4 text-xs max-w-xl"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="apiEnabled"
                checked={apiConfig.enabled}
                onChange={e => setApiConfig({ ...apiConfig, enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="apiEnabled" className="font-bold text-slate-800">
                باضابطہ WhatsApp Business API فعال کریں (اختیاری)
              </label>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">API Base URL</label>
              <input
                type="text"
                value={apiConfig.apiUrl}
                onChange={e => setApiConfig({ ...apiConfig, apiUrl: e.target.value })}
                placeholder="https://graph.facebook.com/v18.0"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Phone Number ID</label>
              <input
                type="text"
                value={apiConfig.phoneNumberId}
                onChange={e => setApiConfig({ ...apiConfig, phoneNumberId: e.target.value })}
                placeholder="مثلاً: 1092837465..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Permanent Access Token (Bearer)</label>
              <input
                type="password"
                value={apiConfig.bearerToken}
                onChange={e => setApiConfig({ ...apiConfig, bearerToken: e.target.value })}
                placeholder="EAA..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-800"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition"
              >
                ترتیبات محفوظ کریں
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT TEMPLATE */}
      {/* ========================================================================= */}
      {showTplModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-naskh">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-base font-nastaliq">
                {editingTpl ? 'سانچہ میں ترمیم کریں' : 'نیا سانچہ بنائیں'}
              </h4>
              <button
                type="button"
                onClick={() => setShowTplModal(false)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">سانچہ کا عنوان *</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: فیس بقایا یاد دہانی..."
                  value={tplTitle}
                  onChange={e => setTplTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">پیغام کی قسم *</label>
                <select
                  value={tplType}
                  onChange={e => setTplType(e.target.value as WhatsAppMessageType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="انفرادی پیغام">انفرادی پیغام</option>
                  <option value="فیس یاد دہانی">فیس یاد دہانی</option>
                  <option value="غیر حاضری اطلاع">غیر حاضری اطلاع</option>
                  <option value="امتحانی نتیجہ">امتحانی نتیجہ</option>
                  <option value="عام اعلان">عام اعلان</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">پیغام کا متن *</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {['{student_name}', '{father_name}', '{class}', '{fee_amount}', '{date}', '{result}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTplBody(prev => prev + ' ' + tag)}
                      className="bg-slate-100 hover:bg-slate-200 border px-1.5 py-0.5 rounded text-[10px] font-mono"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={5}
                  required
                  value={tplBody}
                  onChange={e => setTplBody(e.target.value)}
                  placeholder="پیغام کا متن درج کریں..."
                  className="w-full border border-slate-300 rounded-lg p-3 leading-relaxed font-naskh focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTplModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-700 hover:bg-slate-100 font-medium"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md"
                >
                  محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW LOG DETAILS */}
      {/* ========================================================================= */}
      {viewLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-naskh">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-base font-nastaliq">پیغام کی تفاصیل</h4>
              <button
                type="button"
                onClick={() => setViewLogDetail(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">موصول کنندہ:</span>
                  <strong className="text-slate-800">{viewLogDetail.recipientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">فون نمبر:</span>
                  <strong className="font-mono text-slate-800">{viewLogDetail.recipientPhone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">قسم:</span>
                  <span className="text-slate-700">{viewLogDetail.messageType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">حیثیت:</span>
                  <span className="text-emerald-700 font-semibold">{viewLogDetail.status}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">پیغام کا مکمل متن:</span>
                <div className="p-3 bg-slate-50 border rounded-xl whitespace-pre-wrap font-naskh text-slate-800 leading-relaxed text-xs">
                  {viewLogDetail.messageText}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    const clean = cleanPhoneForWhatsApp(viewLogDetail.recipientPhone);
                    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(viewLogDetail.messageText)}`, '_blank');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  دوبارہ WhatsApp پر کھولیں
                </button>
                <button
                  type="button"
                  onClick={() => setViewLogDetail(null)}
                  className="px-4 py-1.5 border rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  بند کریں
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Modal */}
      <ConfirmDeleteModal
        isOpen={!!tplToDelete}
        title="سانچہ حذف کریں"
        itemName={tplToDelete?.title || ''}
        itemDetails={`قسم: ${tplToDelete?.type || ''}`}
        message="کیا آپ واقعی اس پیغام کے سانچے کو خارج کرنا چاہتے ہیں؟"
        onConfirm={confirmDeleteTemplate}
        onClose={() => setTplToDelete(null)}
      />

      {/* Clear History Modal */}
      <ConfirmDeleteModal
        isOpen={showClearHistoryModal}
        title="پیغامات کی تاریخ صاف کریں"
        itemName={`تمام (${logs.length}) لاگ ریکارڈز`}
        message="کیا آپ واقعی واٹس ایپ پیغامات کی تمام تاریخ کو ڈیٹا بیس سے مکمل طور پر خارج کرنا چاہتے ہیں؟"
        onConfirm={confirmClearHistory}
        onClose={() => setShowClearHistoryModal(false)}
      />
    </div>
  );
};
