import React, { useState } from 'react';
import { 
  Student, 
  BranchType, 
  StudentStatus, 
  ResidenceType,
  MadrasaSettings, 
  AsriStatus, 
  AsriGrade,
  AttendanceRecord,
  FeeRecord,
  Exam,
  StudentExamMark
} from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Printer, 
  RotateCcw, 
  Save, 
  X, 
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  Award,
  FileText,
  School,
  Building2,
  FileCheck,
  MessageSquare,
  Home
} from 'lucide-react';

interface StudentsViewProps {
  students: Student[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
  attendance?: AttendanceRecord[];
  fees?: FeeRecord[];
  exams?: Exam[];
  marks?: StudentExamMark[];
  onOpenDMC?: (student: Student) => void;
  onOpenIDCard?: (student: Student) => void;
  onOpenWhatsApp?: (student: Student) => void;
}

export const ASRI_GRADE_OPTIONS: AsriGrade[] = [
  'نرسری',
  'کے جی',
  'جماعت اول',
  'جماعت دوم',
  'جماعت سوم',
  'جماعت چہارم',
  'جماعت پنجم',
  'جماعت ششم',
  'جماعت ہفتم',
  'جماعت ہشتم',
  'جماعت نہم',
  'جماعت دہم',
  'ایف اے',
  'ایف ایس سی',
  'آئی سی ایس',
  'آئی کام',
  'بی اے',
  'بی ایس',
  'بی کام',
  'ایم اے',
  'ایم ایس / ایم فل',
  'دیگر'
];

export const DARS_CLASSES = [
  'اولیٰ',
  'ثانیہ',
  'ثالثہ',
  'رابعہ',
  'خامسہ',
  'سادسہ',
  'سابعہ',
  'ثامنہ'
];

const INITIAL_FORM: Omit<Student, 'id'> = {
  admissionNo: '',
  rollNo: '',
  fullName: '',
  fatherName: '',
  dob: '',
  cnicBForm: '',
  mobile: '',
  whatsapp: '',
  address: '',
  village: '',
  district: 'راولپنڈی',
  province: 'پنجاب',
  guardianName: '',
  guardianRelation: 'والد',
  guardianMobile: '',
  guardianAddress: '',
  guardianOccupation: '',
  alternateMobile: '',
  photoUrl: '',
  admissionDate: new Date().toISOString().split('T')[0],
  branch: 'حفظ القرآن',
  grade: 'پارہ 1 تا 10',
  section: 'الف',
  academicYear: '1446-1447ھ / 2025-2026ء',
  status: 'فعال',
  residenceType: 'رہائشی',
  asriTaleem: {
    status: 'زیرِ تعلیم',
    currentGrade: 'جماعت دہم',
    instituteName: '',
    boardUniversity: '',
    rollNo: '',
    academicYear: '2025-2026',
    lastCompletedGrade: 'جماعت نہم',
    lastExamResult: '75%',
    subjects: 'انگریزی، ریاضی، فزکس، کیمسٹری، بیالوجی',
    extraInfo: '',
    city: 'راولپنڈی'
  },
  hifzData: {
    currentPara: 1,
    completedParas: 0,
    manzil: '',
    sabaq: '',
    sabqi: '',
    startDate: new Date().toISOString().split('T')[0],
    tajweedRating: 'اچھا',
    teacherRemarks: ''
  },
  tajweedData: {
    currentPara: 1,
    completedParas: 0,
    tajweedLevel: 'مبتدی',
    sabaq: '',
    sabqi: '',
    manzil: '',
    tajweedMistakes: '',
    teacherRemarks: '',
    monthlyReview: 'اچھا',
    annualReview: 'اچھا'
  }
};

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onRefresh,
  settings,
  attendance = [],
  fees = [],
  exams = [],
  marks = [],
  onOpenDMC,
  onOpenIDCard,
  onOpenWhatsApp
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'teacher';

  const [formData, setFormData] = useState<Omit<Student, 'id'> & { id?: string }>(INITIAL_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<string>('basic');
  const [deleteModalStudent, setDeleteModalStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search Filters
  const [searchName, setSearchName] = useState('');
  const [searchFather, setSearchFather] = useState('');
  const [searchRoll, setSearchRoll] = useState('');
  const [searchAdmission, setSearchAdmission] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [searchID, setSearchID] = useState('');
  const [searchBranch, setSearchBranch] = useState<string>('all');
  const [searchGrade, setSearchGrade] = useState<string>('all');
  const [searchResidenceType, setSearchResidenceType] = useState<string>('all');
  const [searchAsriGrade, setSearchAsriGrade] = useState<string>('all');
  const [searchAsriInstitute, setSearchAsriInstitute] = useState<string>('');

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showMsg = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleClearFilters = () => {
    setSearchName('');
    setSearchFather('');
    setSearchRoll('');
    setSearchAdmission('');
    setSearchMobile('');
    setSearchID('');
    setSearchBranch('all');
    setSearchGrade('all');
    setSearchResidenceType('all');
    setSearchAsriGrade('all');
    setSearchAsriInstitute('');
  };

  const handleNewStudent = () => {
    const nextNum = students.length + 101;
    setFormData({
      ...INITIAL_FORM,
      academicYear: settings.academicYear || INITIAL_FORM.academicYear,
      rollNo: `${nextNum}`,
      admissionNo: `ADM-2026-${String(nextNum).padStart(3, '0')}`,
      guardianRelation: 'والد',
      asriTaleem: {
        status: 'زیرِ تعلیم',
        currentGrade: 'جماعت دہم',
        instituteName: '',
        boardUniversity: '',
        rollNo: '',
        academicYear: '2025-2026',
        lastCompletedGrade: 'جماعت نہم',
        lastExamResult: '',
        subjects: '',
        extraInfo: '',
        city: 'راولپنڈی'
      }
    });
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setFormData({
      ...INITIAL_FORM,
      ...student,
      asriTaleem: student.asriTaleem || {
        status: 'نہیں پڑھ رہا',
        currentGrade: 'جماعت دہم',
        instituteName: '',
        boardUniversity: '',
        rollNo: '',
        academicYear: '2025-2026',
        lastCompletedGrade: '',
        lastExamResult: '',
        subjects: '',
        extraInfo: '',
        city: ''
      }
    });
    setIsEditing(true);
    setShowFormModal(true);
  };

  // OPEN DELETE CONFIRMATION MODAL
  const handleDeleteStudent = (student: Student) => {
    if (!canEdit) return;
    setDeleteModalStudent(student);
  };

  // EXECUTE ACTUAL DELETE OPERATION
  const confirmDeleteStudent = async () => {
    if (!deleteModalStudent) return;
    setIsDeleting(true);
    try {
      await dbService.delete('students', deleteModalStudent.id);
      showMsg(`طالب علم "${deleteModalStudent.fullName}" کا ریکارڈ کامیابی سے ڈیٹا بیس سے خارج کر دیا گیا ہے۔`, 'success');
      if (selectedStudent?.id === deleteModalStudent.id) {
        setShowProfileModal(false);
        setSelectedStudent(null);
      }
      setDeleteModalStudent(null);
      await onRefresh();
    } catch (err: any) {
      showMsg('ریکارڈ حذف کرنے میں خرابی پیش آئی: ' + (err.message || 'نامعلوم نقص'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMsg('تصویر کا سائز 2MB سے کم ہونا چاہیے۔', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, photoUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName.trim()) {
      showMsg('طالب علم کا نام درج کرنا لازمی ہے۔', 'error');
      return;
    }
    if (!formData.fatherName.trim()) {
      showMsg('والد کا نام درج کرنا لازمی ہے۔', 'error');
      return;
    }
    if (!formData.admissionNo.trim()) {
      showMsg('داخلہ نمبر درج کرنا لازمی ہے۔', 'error');
      return;
    }
    if (!formData.rollNo.trim()) {
      showMsg('رول نمبر درج کرنا لازمی ہے۔', 'error');
      return;
    }
    if (!formData.residenceType) {
      showMsg('رہائش کی قسم (رہائشی یا غیر رہائشی) منتخب کرنا لازمی ہے۔', 'error');
      return;
    }

    // Check duplicate admission number
    const duplicateAdm = students.find(
      s => s.admissionNo.trim().toLowerCase() === formData.admissionNo.trim().toLowerCase() && s.id !== formData.id
    );
    if (duplicateAdm) {
      showMsg(`داخلہ نمبر "${formData.admissionNo}" پہلے سے طالب علم "${duplicateAdm.fullName}" کے ریکارڈ میں موجود ہے۔`, 'error');
      return;
    }

    // Check duplicate roll number in same academicYear and grade
    const duplicateRoll = students.find(
      s => s.rollNo.trim() === formData.rollNo.trim() &&
           s.branch === formData.branch &&
           s.grade === formData.grade &&
           s.academicYear === formData.academicYear &&
           s.id !== formData.id
    );
    if (duplicateRoll) {
      showMsg(`رول نمبر ${formData.rollNo} اسی تعلیمی سال اور کلاس میں پہلے سے طالب علم "${duplicateRoll.fullName}" کو مختص ہے۔`, 'error');
      return;
    }

    // Hifz Para validation 1-30
    if (formData.branch === 'حفظ القرآن' && formData.hifzData) {
      const cur = Number(formData.hifzData.currentPara);
      const comp = Number(formData.hifzData.completedParas);
      if (cur < 1 || cur > 30) {
        showMsg('موجودہ پارہ کی قیمت 1 سے 30 کے درمیان ہونی چاہیے۔', 'error');
        return;
      }
      if (comp < 0 || comp > 30) {
        showMsg('مکمل شدہ پارے 0 سے 30 کے درمیان ہونے چاہئیں۔', 'error');
        return;
      }
    }

    try {
      const studentId = formData.id || `STU-${Date.now().toString().slice(-5)}`;
      const studentToSave: Student = {
        ...formData,
        id: studentId
      };

      await dbService.put('students', studentToSave);
      showMsg(
        isEditing ? 'طالب علم کا ریکارڈ کامیابی سے اپ ڈیٹ ہو گیا ہے۔' : 'نیا طالب علم کامیابی سے محفوظ ہو گیا ہے۔',
        'success'
      );
      setShowFormModal(false);
      await onRefresh();
    } catch (err: any) {
      showMsg('محفوظ کرنے میں خرابی پیش آئی: ' + (err.message || 'نامعلوم خرابی'), 'error');
    }
  };

  // Filtered Students
  const filteredStudents = students.filter(s => {
    if (searchName && !s.fullName.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchFather && !s.fatherName.toLowerCase().includes(searchFather.toLowerCase())) return false;
    if (searchRoll && !s.rollNo.includes(searchRoll)) return false;
    if (searchAdmission && !s.admissionNo.toLowerCase().includes(searchAdmission.toLowerCase())) return false;
    if (searchMobile && !(s.mobile.includes(searchMobile) || s.guardianMobile.includes(searchMobile))) return false;
    if (searchID && !s.id.toLowerCase().includes(searchID.toLowerCase())) return false;
    if (searchBranch !== 'all' && s.branch !== searchBranch) return false;
    if (searchGrade !== 'all' && s.grade !== searchGrade) return false;
    if (searchResidenceType !== 'all') {
      if (searchResidenceType === 'رہائشی' && s.residenceType !== 'رہائشی') return false;
      if (searchResidenceType === 'غیر رہائشی' && s.residenceType !== 'غیر رہائشی') return false;
      if (searchResidenceType === 'غیر متعین' && s.residenceType) return false;
    }
    if (searchAsriGrade !== 'all' && s.asriTaleem?.currentGrade !== searchAsriGrade) return false;
    if (searchAsriInstitute && !s.asriTaleem?.instituteName?.toLowerCase().includes(searchAsriInstitute.toLowerCase())) return false;
    return true;
  });

  // Residence & Total Counts for Reports & Summary
  const totalCount = filteredStudents.length;
  const residentialCount = filteredStudents.filter(s => s.residenceType === 'رہائشی').length;
  const nonResidentialCount = filteredStudents.filter(s => s.residenceType === 'غیر رہائشی').length;
  const unspecifiedCount = filteredStudents.filter(s => !s.residenceType).length;

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between shadow-md transition-all ${
            feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              طلبہ کا مکمل انتظام و داخلہ (Student Management)
            </h2>
            <p className="text-xs text-slate-500">
              بنیادی معلومات، دینی تعلیم، نیا فیچر "عصری تعلیم"، حاضری و فیس ریکارڈ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              onClick={handleNewStudent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              نیا طالب علم داخلہ
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            پرنٹ فہرِست طلبہ
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b">
          <Search className="w-3.5 h-3.5 text-blue-600" />
          تلاش برائے طلبہ (Search & Filters)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-500 mb-1">طالب علم کا نام</label>
            <input
              type="text"
              placeholder="نام سے تلاش کریں..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">والد کا نام</label>
            <input
              type="text"
              placeholder="والد کے نام سے..."
              value={searchFather}
              onChange={e => setSearchFather(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">رول نمبر</label>
            <input
              type="text"
              placeholder="رول نمبر..."
              value={searchRoll}
              onChange={e => setSearchRoll(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">داخلہ نمبر</label>
            <input
              type="text"
              placeholder="ADM-2026-..."
              value={searchAdmission}
              onChange={e => setSearchAdmission(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">موبائل / سرپرست فون</label>
            <input
              type="text"
              placeholder="0300-..."
              value={searchMobile}
              onChange={e => setSearchMobile(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">شعبہ</label>
            <select
              value={searchBranch}
              onChange={e => setSearchBranch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">تمام شعبہ جات</option>
              <option value="حفظ القرآن">حفظ القرآن</option>
              <option value="تجوید للحفاظ">تجوید للحفاظ</option>
              <option value="درس نظامی">درس نظامی</option>
              <option value="ناظرہ قرآن">ناظرہ قرآن</option>
            </select>
          </div>

          {/* Contemporary Education Search Filters */}
          <div>
            <label className="block text-indigo-700 font-semibold mb-1">عصری تعلیم کی کلاس</label>
            <select
              value={searchAsriGrade}
              onChange={e => setSearchAsriGrade(e.target.value)}
              className="w-full border border-indigo-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
            >
              <option value="all">تمام عصری کلاسز</option>
              {ASRI_GRADE_OPTIONS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-indigo-700 font-semibold mb-1">اسکول / کالج کا نام</label>
            <input
              type="text"
              placeholder="اسکول / کالج..."
              value={searchAsriInstitute}
              onChange={e => setSearchAsriInstitute(e.target.value)}
              className="w-full border border-indigo-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1">رہائش کی قسم (Residence)</label>
            <select
              value={searchResidenceType}
              onChange={e => setSearchResidenceType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">تمام (رہائشی و غیر رہائشی)</option>
              <option value="رہائشی">رہائشی (Residential / Hostel)</option>
              <option value="غیر رہائشی">غیر رہائشی (Non-Residential / Day)</option>
              <option value="غیر متعین">غیر متعین (Not Specified)</option>
            </select>
          </div>

          <div className="flex items-end sm:col-span-2 md:col-span-2 lg:col-span-2">
            <button
              onClick={handleClearFilters}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              فلٹرز صاف کریں
            </button>
          </div>
        </div>
      </div>

      {/* Residence & Summary Badges Bar */}
      <div className="no-print bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs font-medium text-slate-700">
            کل طلبہ: <strong className="text-slate-900 font-bold">{totalCount}</strong>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs font-medium text-emerald-800 flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-emerald-600" />
            رہائشی طلبہ (Hostel): <strong className="font-bold">{residentialCount}</strong>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg shadow-2xs font-medium text-blue-800 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            غیر رہائشی طلبہ (Day Scholar): <strong className="font-bold">{nonResidentialCount}</strong>
          </div>
          {unspecifiedCount > 0 && (
            <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-medium text-slate-500">
              غیر متعین: <strong className="font-bold">{unspecifiedCount}</strong>
            </div>
          )}
        </div>
        <div className="text-[11px] text-slate-500">
          دکھائے جا رہے فلٹر شدہ ریکارڈز: <span className="font-bold text-slate-700">{filteredStudents.length}</span>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="print-only text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold font-nastaliq text-slate-900">{settings.madrasaNameUrdu}</h1>
        <p className="text-sm font-semibold">{settings.madrasaNameEnglish} • فہرِست طلبہ کرام</p>
        <p className="text-xs text-gray-600 mt-1">
          کل ریکارڈز: {totalCount} • رہائشی طلبہ: {residentialCount} • غیر رہائشی طلبہ: {nonResidentialCount} {unspecifiedCount > 0 ? `• غیر متعین: ${unspecifiedCount}` : ''} • تعلیمی سال: {settings.academicYear} • تاریخ: {new Date().toLocaleDateString('ur-PK')}
        </p>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">تصویر</th>
                <th className="p-3">رول نمبر</th>
                <th className="p-3">داخلہ نمبر</th>
                <th className="p-3">طالب علم کا نام</th>
                <th className="p-3">والد کا نام</th>
                <th className="p-3">شعبہ</th>
                <th className="p-3">درجہ / کلاس</th>
                <th className="p-3">رہائش کی قسم</th>
                <th className="p-3">عصری تعلیم</th>
                <th className="p-3">موبائل / سرپرست</th>
                <th className="p-3">حیثیت</th>
                <th className="p-3 no-print text-center">کارروائی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    <div className="py-6 space-y-2">
                      <p className="text-base font-semibold text-slate-600">کوئی طالب علم ریکارڈ دستیاب نہیں ملا۔</p>
                      <p className="text-xs text-slate-400">نیا ریکارڈ درج کرنے کے لیے اوپر 'نیا طالب علم داخلہ' کے بٹن پر کلک کریں۔</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {student.fullName.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-800 font-mono">{student.rollNo}</td>
                    <td className="p-3 text-slate-600 font-mono">{student.admissionNo}</td>
                    <td className="p-3 font-semibold text-slate-900">{student.fullName}</td>
                    <td className="p-3 text-slate-700">{student.fatherName}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                        {student.branch}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{student.grade}</td>
                    <td className="p-3">
                      {student.residenceType === 'رہائشی' ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px] whitespace-nowrap inline-flex items-center gap-1">
                          <Home className="w-3 h-3 text-emerald-700" />
                          رہائشی
                        </span>
                      ) : student.residenceType === 'غیر رہائشی' ? (
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[11px] whitespace-nowrap inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-700" />
                          غیر رہائشی
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">غیر متعین</span>
                      )}
                    </td>
                    <td className="p-3">
                      {student.asriTaleem?.status === 'زیرِ تعلیم' || student.asriTaleem?.status === 'مکمل' ? (
                        <div>
                          <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {student.asriTaleem.currentGrade}
                          </span>
                          {student.asriTaleem.instituteName && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {student.asriTaleem.instituteName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">نہیں پڑھ رہا</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      <div>{student.guardianMobile || student.mobile}</div>
                      <span className="text-[10px] text-slate-400">({student.guardianRelation || 'والد'})</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          student.status === 'فعال'
                            ? 'bg-emerald-100 text-emerald-800'
                            : student.status === 'فارغ التحصیل'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="p-3 no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            if (onOpenWhatsApp) {
                              onOpenWhatsApp(student);
                            } else {
                              const phone = student.whatsapp || student.guardianMobile || student.mobile;
                              if (phone) {
                                window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                              } else {
                                alert('طالب علم کا واٹس ایپ یا موبائل نمبر درج نہیں ہے۔');
                              }
                            }
                          }}
                          title="واٹس ایپ میسج (WhatsApp)"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setProfileActiveTab('basic');
                            setShowProfileModal(true);
                          }}
                          title="مکمل پروفائل"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleEditStudent(student)}
                              title="ترمیم کریں"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(student)}
                              title="مستقل حذف کریں"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW STUDENT ADMISSION / EDIT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-nastaliq text-amber-400">
                  {isEditing ? 'طالب علم کے ریکارڈ میں ترمیم' : 'نیا طالب علم داخلہ فارم (New Student Admission)'}
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStudent} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Institutional & Academic Fields */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 text-blue-900">
                  مدرسہ و داخلہ معلومات (Madrasa Academic Details)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">داخلہ نمبر (Admission No) *</label>
                    <input
                      type="text"
                      required
                      placeholder="ADM-2026-001"
                      value={formData.admissionNo}
                      onChange={e => setFormData({ ...formData, admissionNo: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">رول نمبر (Roll No) *</label>
                    <input
                      type="text"
                      required
                      placeholder="101"
                      value={formData.rollNo}
                      onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">شعبہ (Branch) *</label>
                    <select
                      value={formData.branch}
                      onChange={e => {
                        const b = e.target.value as BranchType;
                        setFormData({ 
                          ...formData, 
                          branch: b,
                          grade: b === 'درس نظامی' ? 'اولیٰ' : b === 'حفظ القرآن' ? 'پارہ 1 تا 10' : 'پارہ 1 تا 10'
                        });
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="حفظ القرآن">حفظ القرآن</option>
                      <option value="تجوید للحفاظ">تجوید للحفاظ</option>
                      <option value="درس نظامی">درس نظامی</option>
                      <option value="ناظرہ قرآن">ناظرہ قرآن</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">درجہ / کلاس *</label>
                    {formData.branch === 'درس نظامی' ? (
                      <select
                        value={formData.grade}
                        onChange={e => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {DARS_CLASSES.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="مثلاً: پارہ 1 تا 10، ناظرہ"
                        value={formData.grade}
                        onChange={e => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سیکشن</label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={e => setFormData({ ...formData, section: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                      placeholder="الف، ب، ج"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">تعلیمی سال</label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">داخلہ تاریخ *</label>
                    <input
                      type="date"
                      required
                      value={formData.admissionDate}
                      onChange={e => setFormData({ ...formData, admissionDate: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">طالب علم کی حیثیت *</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="فعال">فعال</option>
                      <option value="غیر فعال">غیر فعال</option>
                      <option value="فارغ التحصیل">فارغ التحصیل</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                      <span>رہائش کی قسم (Residence Type) *</span>
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">لازمی فیلڈ</span>
                    </label>
                    <select
                      required
                      value={formData.residenceType || ''}
                      onChange={e => setFormData({ ...formData, residenceType: e.target.value as ResidenceType })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    >
                      <option value="">-- رہائش کی قسم منتخب کریں (لازمی) --</option>
                      <option value="رہائشی">رہائشی (Residential / Hostel Student)</option>
                      <option value="غیر رہائشی">غیر رہائشی (Non-Residential / Day Scholar)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 text-blue-900">
                  ذاتی معلومات (Personal Information)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">طالب علم کا مکمل نام *</label>
                    <input
                      type="text"
                      required
                      placeholder="طالب علم کا نام..."
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">والد کا نام *</label>
                    <input
                      type="text"
                      required
                      placeholder="والد کا نام..."
                      value={formData.fatherName}
                      onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">تاریخ پیدائش</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">CNIC / ب فارم نمبر</label>
                    <input
                      type="text"
                      placeholder="37405-1234567-1"
                      value={formData.cnicBForm}
                      onChange={e => setFormData({ ...formData, cnicBForm: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">طالب علم کا موبائل نمبر</label>
                    <input
                      type="text"
                      placeholder="0300-1234567"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">WhatsApp نمبر</label>
                    <input
                      type="text"
                      placeholder="0300-1234567"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* NEW SECTION: عصری تعلیم (Contemporary Education) */}
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-indigo-200 pb-1.5">
                  <School className="w-4 h-4 text-indigo-700" />
                  <h4 className="font-bold text-sm text-indigo-900">
                    عصری تعلیم (Contemporary / Modern Schooling)
                  </h4>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-semibold">
                    نیا فیچر (New Feature)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">عصری تعلیم کی حیثیت *</label>
                    <select
                      value={formData.asriTaleem?.status || 'زیرِ تعلیم'}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          status: e.target.value as AsriStatus
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="زیرِ تعلیم">زیرِ تعلیم (Currently Studying)</option>
                      <option value="مکمل">مکمل (Completed)</option>
                      <option value="نہیں پڑھ رہا">نہیں پڑھ رہا (Not Studying)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">موجودہ تعلیمی سطح / کلاس *</label>
                    <select
                      value={formData.asriTaleem?.currentGrade || 'جماعت دہم'}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          currentGrade: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {ASRI_GRADE_OPTIONS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">اسکول / کالج / ادارے کا نام</label>
                    <input
                      type="text"
                      placeholder="گورنمنٹ / پرائیویٹ اسکول نام..."
                      value={formData.asriTaleem?.instituteName || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          instituteName: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">بورڈ / یونیورسٹی</label>
                    <input
                      type="text"
                      placeholder="مثلاً: راولپنڈی بورڈ، فیڈرل بورڈ..."
                      value={formData.asriTaleem?.boardUniversity || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          boardUniversity: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">اسکول رول نمبر</label>
                    <input
                      type="text"
                      placeholder="اسکول رول نمبر..."
                      value={formData.asriTaleem?.rollNo || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          rollNo: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">اسکول تعلیمی سال</label>
                    <input
                      type="text"
                      placeholder="2025-2026"
                      value={formData.asriTaleem?.academicYear || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          academicYear: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">آخری مکمل کی گئی کلاس</label>
                    <input
                      type="text"
                      placeholder="مثلاً: جماعت نہم، مڈل..."
                      value={formData.asriTaleem?.lastCompletedGrade || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          lastCompletedGrade: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">آخری امتحان کا نتیجہ / فیصد</label>
                    <input
                      type="text"
                      placeholder="مثلاً: 82% یا اے گریڈ"
                      value={formData.asriTaleem?.lastExamResult || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          lastExamResult: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">اسکول / کالج کا شہر</label>
                    <input
                      type="text"
                      placeholder="مثلاً: راولپنڈی، اسلام آباد..."
                      value={formData.asriTaleem?.city || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          city: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-indigo-900 font-medium mb-1">مضامین (Subjects)</label>
                    <input
                      type="text"
                      placeholder="سائنس، آرٹس، کمپیوٹر، انگلش وغیرہ..."
                      value={formData.asriTaleem?.subjects || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          subjects: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-indigo-900 font-medium mb-1">اضافی تعلیمی معلومات</label>
                    <input
                      type="text"
                      placeholder="کوئی خاص معلومات یا تبصرہ..."
                      value={formData.asriTaleem?.extraInfo || ''}
                      onChange={e => setFormData({
                        ...formData,
                        asriTaleem: {
                          ...formData.asriTaleem!,
                          extraInfo: e.target.value
                        }
                      })}
                      className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Branch Specific Sections */}
              {formData.branch === 'حفظ القرآن' && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <h4 className="font-bold text-sm text-emerald-900 border-b border-emerald-200 pb-1.5">
                    حفظ القرآن کی تفاصیل (Hifz Details)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-emerald-900 font-medium mb-1">موجودہ پارہ (1-30) *</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formData.hifzData?.currentPara || 1}
                        onChange={e => setFormData({
                          ...formData,
                          hifzData: {
                            ...formData.hifzData!,
                            currentPara: Number(e.target.value)
                          }
                        })}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-900 font-medium mb-1">مکمل شدہ پارے (0-30) *</label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={formData.hifzData?.completedParas || 0}
                        onChange={e => setFormData({
                          ...formData,
                          hifzData: {
                            ...formData.hifzData!,
                            completedParas: Number(e.target.value)
                          }
                        })}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-900 font-medium mb-1">حفظ شروع کرنے کی تاریخ</label>
                      <input
                        type="date"
                        value={formData.hifzData?.startDate || ''}
                        onChange={e => setFormData({
                          ...formData,
                          hifzData: {
                            ...formData.hifzData!,
                            startDate: e.target.value
                          }
                        })}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-900 font-medium mb-1">تجوید کارکردگی</label>
                      <select
                        value={formData.hifzData?.tajweedRating || 'اچھا'}
                        onChange={e => setFormData({
                          ...formData,
                          hifzData: {
                            ...formData.hifzData!,
                            tajweedRating: e.target.value as any
                          }
                        })}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="ممتاز">ممتاز</option>
                        <option value="بہت اچھا">بہت اچھا</option>
                        <option value="اچھا">اچھا</option>
                        <option value="تسلی بخش">تسلی بخش</option>
                        <option value="مزید محنت درکار">مزید محنت درکار</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-emerald-900 font-medium mb-1">سبق (Current Sabaq)</label>
                      <input
                        type="text"
                        placeholder="پارہ و رکوع..."
                        value={formData.hifzData?.sabaq || ''}
                        onChange={e => setFormData({
                          ...formData,
                          hifzData: {
                            ...formData.hifzData!,
                            sabaq: e.target.value
                          }
                        })}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-900 font-medium mb-1">سبقی (Sabqi)</label>
                      <input
                        type="text"
                        placeholder="سبقی تفصیل..."
                        value={formData.hifzData?.sabqi || ''}
                        onChange={e => setFormData({
                          ...formData,
                          hifzData: {
                            ...formData.hifzData!,
                            sabqi: e.target.value
                          }
                        })}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-900 font-medium mb-1">منزل (Manzil)</label>
                      <input
                        type="text"
                        placeholder="روزانہ منزل..."
                        value={formData.hifzData?.manzil || ''}
                        onChange={e => setFormData({
                          ...formData,
                          hifzData: {
                            ...formData.hifzData!,
                            manzil: e.target.value
                          }
                        })}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-900 font-medium mb-1">استاد کے تاثرات</label>
                      <input
                        type="text"
                        placeholder="استاد صاحب کے کمنٹس..."
                        value={formData.hifzData?.teacherRemarks || ''}
                        onChange={e => setFormData({
                          ...formData,
                          hifzData: {
                            ...formData.hifzData!,
                            teacherRemarks: e.target.value
                          }
                        })}
                        className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Guardian & Contact Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 text-blue-900">
                  سرپرست و رہائشی معلومات (Guardian & Address)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سرپرست کا نام *</label>
                    <input
                      type="text"
                      required
                      placeholder="سرپرست کا نام..."
                      value={formData.guardianName}
                      onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سرپرست سے رشتہ *</label>
                    <input
                      type="text"
                      required
                      value={formData.guardianRelation}
                      onChange={e => setFormData({ ...formData, guardianRelation: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                      placeholder="والد، بھائی، چچا..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سرپرست موبائل *</label>
                    <input
                      type="text"
                      required
                      value={formData.guardianMobile}
                      onChange={e => setFormData({ ...formData, guardianMobile: e.target.value })}
                      placeholder="0300-1234567"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">سرپرست کا پیشہ</label>
                    <input
                      type="text"
                      placeholder="ملازمت، کاروبار، کاشتکاری..."
                      value={formData.guardianOccupation || ''}
                      onChange={e => setFormData({ ...formData, guardianOccupation: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">متبادل ایمرجنسی نمبر</label>
                    <input
                      type="text"
                      placeholder="0333-..."
                      value={formData.alternateMobile}
                      onChange={e => setFormData({ ...formData, alternateMobile: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">مکمل رہائشی پتہ *</label>
                    <input
                      type="text"
                      required
                      placeholder="محلہ، گلی نمبر، مکان نمبر..."
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">گاؤں / محلہ</label>
                    <input
                      type="text"
                      value={formData.village}
                      onChange={e => setFormData({ ...formData, village: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">ضلع</label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={e => setFormData({ ...formData, district: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">صوبہ</label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={e => setFormData({ ...formData, province: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="طالب علم" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">طالب علم کی تصویر منتخب کریں</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-700 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">سپورٹ شدہ فارمیٹس: JPG, PNG, WEBP (زیادہ سے زیادہ 2MB)</p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  ریکارڈ محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE MODAL WITH REAL TABS */}
      {showProfileModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-right flex flex-col max-h-[92vh]">
            <button
              onClick={() => setShowProfileModal(false)}
              className="no-print absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              {selectedStudent.photoUrl ? (
                <img
                  src={selectedStudent.photoUrl}
                  alt={selectedStudent.fullName}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-blue-600 shadow"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center">
                  {selectedStudent.fullName.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-nastaliq text-slate-900">{selectedStudent.fullName}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        if (onOpenWhatsApp) {
                          onOpenWhatsApp(selectedStudent);
                        } else {
                          const phone = selectedStudent.whatsapp || selectedStudent.guardianMobile || selectedStudent.mobile;
                          if (phone) {
                            window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                          } else {
                            alert('طالب علم کا واٹس ایپ یا موبائل نمبر درج نہیں ہے۔');
                          }
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 shadow-xs transition"
                      title="اس طالب علم کو واٹس ایپ پیغام بھیجیں"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp پیغام
                    </button>
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      ID: {selectedStudent.id}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">ولد: {selectedStudent.fatherName}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    رول نمبر: {selectedStudent.rollNo}
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    شعبہ: {selectedStudent.branch}
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    کلاس: {selectedStudent.grade}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                    <Home className="w-3 h-3 text-emerald-700" />
                    رہائش: {selectedStudent.residenceType === 'رہائشی' ? 'رہائشی (Hostel)' : selectedStudent.residenceType === 'غیر رہائشی' ? 'غیر رہائشی (Day Scholar)' : 'غیر متعین'}
                  </span>
                  {selectedStudent.asriTaleem?.status === 'زیرِ تعلیم' && (
                    <span className="bg-indigo-100 text-indigo-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                      عصری تعلیم: {selectedStudent.asriTaleem.currentGrade}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="no-print flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto py-2 text-xs">
              <button
                onClick={() => setProfileActiveTab('basic')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  profileActiveTab === 'basic' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                بنیادی معلومات
              </button>
              <button
                onClick={() => setProfileActiveTab('asri')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  profileActiveTab === 'asri' ? 'bg-indigo-600 text-white' : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                عصری تعلیم
              </button>
              <button
                onClick={() => setProfileActiveTab('academic')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  profileActiveTab === 'academic' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                حفظ / تجوید / دینی ریکارڈ
              </button>
              <button
                onClick={() => setProfileActiveTab('attendance')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  profileActiveTab === 'attendance' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                حاضری ریکارڈ
              </button>
              <button
                onClick={() => setProfileActiveTab('fees')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  profileActiveTab === 'fees' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                فیس ریکارڈ
              </button>
              <button
                onClick={() => setProfileActiveTab('exams')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  profileActiveTab === 'exams' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                امتحانات و نتائج
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto py-4 text-xs space-y-3">
              {/* Tab 1: Basic Information */}
              {profileActiveTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block">طالب علم ID:</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudent.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">داخلہ نمبر:</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudent.admissionNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">رول نمبر:</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudent.rollNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">شعبہ:</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.branch}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">درجہ / کلاس:</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.grade}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">سیکشن:</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.section || 'الف'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">تعلیمی سال:</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.academicYear}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">داخلہ تاریخ:</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.admissionDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">حیثیت:</span>
                      <span className="font-semibold text-emerald-700">{selectedStudent.status}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">رہائش کی قسم:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedStudent.residenceType === 'رہائشی'
                          ? 'رہائشی (Hostel Student)'
                          : selectedStudent.residenceType === 'غیر رہائشی'
                          ? 'غیر رہائشی (Day Scholar)'
                          : 'غیر متعین'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">CNIC / ب فارم:</span>
                      <span className="font-semibold text-slate-800 font-mono">{selectedStudent.cnicBForm || 'درج نہیں'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">تاریخ پیدائش:</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.dob || 'درج نہیں'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">طالب علم موبائل:</span>
                      <span className="font-semibold text-slate-800">{selectedStudent.mobile || 'درج نہیں'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 border-b pb-1">سرپرست و پتہ</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block">سرپرست کا نام:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.guardianName || selectedStudent.fatherName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">سرپرست سے رشتہ:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.guardianRelation}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">سرپرست موبائل:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.guardianMobile || selectedStudent.mobile}</span>
                      </div>
                      {selectedStudent.guardianOccupation && (
                        <div>
                          <span className="text-slate-400 block">سرپرست کا پیشہ:</span>
                          <span className="font-semibold text-slate-800">{selectedStudent.guardianOccupation}</span>
                        </div>
                      )}
                      {selectedStudent.alternateMobile && (
                        <div>
                          <span className="text-slate-400 block">ایمرجنسی متبادل نمبر:</span>
                          <span className="font-semibold text-slate-800">{selectedStudent.alternateMobile}</span>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-slate-400 block">مکمل رہائشی پتہ:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedStudent.address} {selectedStudent.village && `، ${selectedStudent.village}`} {selectedStudent.district && `، ${selectedStudent.district}`} {selectedStudent.province && `، ${selectedStudent.province}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: عصری تعلیم (Contemporary Education) */}
              {profileActiveTab === 'asri' && (
                <div className="space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-200">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold border-b border-indigo-200 pb-2">
                    <School className="w-4 h-4 text-indigo-700" />
                    عصری تعلیم کی مکمل تفصیلات (Contemporary Education Details)
                  </div>

                  {selectedStudent.asriTaleem ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                      <div>
                        <span className="text-slate-400 block">عصری تعلیم کی حیثیت:</span>
                        <span className="font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                          {selectedStudent.asriTaleem.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">موجودہ تعلیمی سطح / کلاس:</span>
                        <span className="font-bold text-slate-800">{selectedStudent.asriTaleem.currentGrade}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">اسکول / کالج / ادارہ:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.asriTaleem.instituteName || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">بورڈ / یونیورسٹی:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.asriTaleem.boardUniversity || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">اسکول رول نمبر:</span>
                        <span className="font-semibold text-slate-800 font-mono">{selectedStudent.asriTaleem.rollNo || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">اسکول تعلیمی سال:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.asriTaleem.academicYear || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">آخری مکمل کی گئی کلاس:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.asriTaleem.lastCompletedGrade || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">آخری امتحان کا نتیجہ / فیصد:</span>
                        <span className="font-bold text-emerald-700">{selectedStudent.asriTaleem.lastExamResult || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">اسکول کا شہر:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.asriTaleem.city || 'درج نہیں'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block">مضامین (Subjects):</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.asriTaleem.subjects || 'درج نہیں'}</span>
                      </div>
                      {selectedStudent.asriTaleem.extraInfo && (
                        <div className="col-span-2 md:col-span-3">
                          <span className="text-slate-400 block">اضافی معلومات / تبصرہ:</span>
                          <span className="font-semibold text-slate-800">{selectedStudent.asriTaleem.extraInfo}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 py-4 text-center">عصری تعلیم کا کوئی ڈیٹا محفوظ نہیں ہے۔</p>
                  )}
                </div>
              )}

              {/* Tab 3: Religious / Academic details */}
              {profileActiveTab === 'academic' && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 border-b pb-1 text-blue-900">
                    دینی و شعبہ وار ریکارڈ ({selectedStudent.branch})
                  </h4>

                  {selectedStudent.branch === 'حفظ القرآن' && selectedStudent.hifzData ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block">موجودہ پارہ:</span>
                        <span className="font-bold text-blue-800 text-sm">پارہ {selectedStudent.hifzData.currentPara}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">مکمل شدہ پارے:</span>
                        <span className="font-bold text-emerald-700 text-sm">{selectedStudent.hifzData.completedParas} پارے</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">حفظ آغاز تاریخ:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.hifzData.startDate || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">موجودہ سبق:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.hifzData.sabaq || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">سبقی:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.hifzData.sabqi || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">منزل:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.hifzData.manzil || 'درج نہیں'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">تجوید کارکردگی:</span>
                        <span className="font-bold text-amber-700">{selectedStudent.hifzData.tajweedRating || 'اچھا'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block">استاد کے تاثرات:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.hifzData.teacherRemarks || 'کوئی تاثرات درج نہیں۔'}</span>
                      </div>
                    </div>
                  ) : selectedStudent.branch === 'تجوید للحفاظ' && selectedStudent.tajweedData ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block">تجوید لیول:</span>
                        <span className="font-bold text-blue-800">{selectedStudent.tajweedData.tajweedLevel}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">موجودہ پارہ:</span>
                        <span className="font-bold text-slate-800">پارہ {selectedStudent.tajweedData.currentPara}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">مکمل پارے:</span>
                        <span className="font-bold text-emerald-700">{selectedStudent.tajweedData.completedParas}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">ماہانہ جائزہ:</span>
                        <span className="font-bold text-slate-800">{selectedStudent.tajweedData.monthlyReview}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">سالانہ جائزہ:</span>
                        <span className="font-bold text-slate-800">{selectedStudent.tajweedData.annualReview}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">تجوید غلطیاں و مشق:</span>
                        <span className="font-semibold text-slate-800">{selectedStudent.tajweedData.tajweedMistakes || 'کوئی نہیں'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-slate-700">شعبہ: <span className="font-bold">{selectedStudent.branch}</span></p>
                      <p className="text-slate-700">کلاس: <span className="font-bold">{selectedStudent.grade}</span></p>
                      <p className="text-slate-700">سیکشن: <span className="font-bold">{selectedStudent.section}</span></p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Attendance History */}
              {profileActiveTab === 'attendance' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="font-bold text-slate-800">حاضری ریکارڈ (Attendance History)</h4>
                    <span className="text-[11px] text-slate-500">
                      کل ریکارڈز: {attendance.filter(a => a.studentId === selectedStudent.id).length}
                    </span>
                  </div>

                  {attendance.filter(a => a.studentId === selectedStudent.id).length === 0 ? (
                    <p className="text-slate-400 py-4 text-center">اس طالب علم کا کوئی حاضری ریکارڈ موجود نہیں ہے۔</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="p-2">تاریخ</th>
                            <th className="p-2">حیثیت</th>
                            <th className="p-2">نوٹ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {attendance
                            .filter(a => a.studentId === selectedStudent.id)
                            .map(att => (
                              <tr key={att.id}>
                                <td className="p-2 font-mono">{att.date}</td>
                                <td className="p-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      att.status === 'حاضر'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : att.status === 'رخصت'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {att.status}
                                  </span>
                                </td>
                                <td className="p-2 text-slate-500">{att.notes || '-'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Fee History */}
              {profileActiveTab === 'fees' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="font-bold text-slate-800">فیس ادائیگی کی تفصیلات (Fee History)</h4>
                    <span className="text-[11px] text-slate-500">
                      کل ادائیگیاں: {fees.filter(f => f.studentId === selectedStudent.id).length}
                    </span>
                  </div>

                  {fees.filter(f => f.studentId === selectedStudent.id).length === 0 ? (
                    <p className="text-slate-400 py-4 text-center">اس طالب علم کا کوئی فیس ریکارڈ موجود نہیں ہے۔</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="p-2">مہینہ</th>
                            <th className="p-2">فیس قسم</th>
                            <th className="p-2">کل رقم</th>
                            <th className="p-2">وصول شدہ</th>
                            <th className="p-2">بقایا</th>
                            <th className="p-2">حیثیت</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fees
                            .filter(f => f.studentId === selectedStudent.id)
                            .map(f => (
                              <tr key={f.id}>
                                <td className="p-2 font-semibold">{f.month}</td>
                                <td className="p-2">{f.feeType}</td>
                                <td className="p-2 font-mono">PKR {f.totalAmount}</td>
                                <td className="p-2 font-mono text-emerald-700">PKR {f.paidAmount}</td>
                                <td className="p-2 font-mono text-rose-600">PKR {f.balance}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    f.status === 'ادا شدہ' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {f.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Exams and Marks */}
              {profileActiveTab === 'exams' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h4 className="font-bold text-slate-800">امتحانی کارکردگی و نمبرات (Exam Results)</h4>
                  </div>

                  {marks.filter(m => m.studentId === selectedStudent.id).length === 0 ? (
                    <p className="text-slate-400 py-4 text-center">اس طالب علم کے کسی امتحان کے نمبرات درج نہیں ہیں۔</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="p-2">امتحان ID</th>
                            <th className="p-2">مضمون</th>
                            <th className="p-2">کل نمبر</th>
                            <th className="p-2">حاصل کردہ</th>
                            <th className="p-2">فیصد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {marks
                            .filter(m => m.studentId === selectedStudent.id)
                            .map(m => {
                              const pct = m.totalMarks > 0 ? ((m.obtainedMarks / m.totalMarks) * 100).toFixed(0) : '0';
                              return (
                                <tr key={m.id}>
                                  <td className="p-2 font-mono">{m.examId}</td>
                                  <td className="p-2 font-semibold text-slate-800">{m.subjectName}</td>
                                  <td className="p-2 font-mono">{m.totalMarks}</td>
                                  <td className="p-2 font-mono font-bold text-blue-700">{m.obtainedMarks}</td>
                                  <td className="p-2 font-mono font-bold">{pct}%</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="no-print pt-4 flex flex-wrap justify-between items-center gap-2 border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (onOpenWhatsApp) {
                      onOpenWhatsApp(selectedStudent);
                    } else {
                      const phone = selectedStudent.whatsapp || selectedStudent.guardianMobile || selectedStudent.mobile;
                      if (phone) {
                        window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                      } else {
                        alert('طالب علم کا واٹس ایپ یا موبائل نمبر درج نہیں ہے۔');
                      }
                    }
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  واٹس ایپ میسج (WhatsApp)
                </button>

                {onOpenIDCard && (
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      onOpenIDCard(selectedStudent);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium"
                  >
                    شناختی کارڈ پرنٹ
                  </button>
                )}
                {onOpenDMC && (
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      onOpenDMC(selectedStudent);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium"
                  >
                    تفصیلی نمبرات سند (DMC)
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  پرنٹ پروفائل
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium"
                >
                  بند کریں
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalStudent}
        title="طالب علم کا ریکارڈ خارج کریں"
        itemName={deleteModalStudent ? `${deleteModalStudent.fullName} ولد ${deleteModalStudent.fatherName}` : ''}
        itemDetails={deleteModalStudent ? `رول نمبر: ${deleteModalStudent.rollNo} • داخلہ نمبر: ${deleteModalStudent.admissionNo} • شعبہ: ${deleteModalStudent.branch}` : ''}
        message="کیا آپ واقعی اس طالب علم کا تمام ریکارڈ مستقل طور پر حذف کرنا چاہتے ہیں؟ اس طالب علم کی تمام پروفائل اور تعلیمی تفصیلات ڈیٹا بیس سے خارج ہو جائیں گی اور یہ عمل واپس نہیں ہو سکے گا۔"
        onConfirm={confirmDeleteStudent}
        onClose={() => setDeleteModalStudent(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
