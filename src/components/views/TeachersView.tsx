import React, { useState } from 'react';
import { Teacher, BranchType, TeacherStatus, SalaryType, MadrasaSettings } from '../../types';
import { dbService } from '../../services/db';
import { formatCNIC, isValidCNIC, CNIC_ERROR_MSG, formatPKR } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import {
  Briefcase,
  UserPlus,
  Search,
  Edit,
  Trash2,
  Printer,
  Save,
  X,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  Eye
} from 'lucide-react';

interface TeachersViewProps {
  teachers: Teacher[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
  setActiveTab?: (tab: string) => void;
}

const INITIAL_TEACHER_FORM: Omit<Teacher, 'id'> = {
  name: '',
  fatherName: '',
  cnic: '',
  mobile: '',
  whatsapp: '',
  dob: '1990-01-01',
  address: '',
  qualification: 'فاضل درس نظامی / حفظ القرآن',
  designation: 'مدرس / استاد',
  joiningDate: new Date().toISOString().split('T')[0],
  branch: 'حفظ القرآن',
  assignedClass: '',
  salaryType: 'ماہانہ',
  basicSalary: 40000,
  bankInfo: '',
  easypaisa: '',
  jazzCash: '',
  status: 'فعال',
  notes: '',
  photoUrl: ''
};

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  onRefresh,
  settings,
  setActiveTab
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin';

  const [formData, setFormData] = useState<Omit<Teacher, 'id'> & { id?: string }>(INITIAL_TEACHER_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [cnicError, setCnicError] = useState<string | null>(null);
  const [deleteModalTeacher, setDeleteModalTeacher] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search filters
  const [searchName, setSearchName] = useState('');
  const [searchFather, setSearchFather] = useState('');
  const [searchID, setSearchID] = useState('');
  const [searchCNIC, setSearchCNIC] = useState('');
  const [searchMobile, setSearchMobile] = useState('');

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showMsg = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleNewTeacher = () => {
    const nextId = `TCH-${String(teachers.length + 1).padStart(3, '0')}`;
    setFormData({
      ...INITIAL_TEACHER_FORM,
      id: nextId
    });
    setIsEditing(false);
    setCnicError(null);
    setShowModal(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setFormData({ ...teacher });
    setIsEditing(true);
    setCnicError(null);
    setShowModal(true);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    if (!canEdit) return;
    setDeleteModalTeacher(teacher);
  };

  const confirmDeleteTeacher = async () => {
    if (!deleteModalTeacher) return;
    setIsDeleting(true);
    try {
      await dbService.delete('teachers', deleteModalTeacher.id);
      showMsg(`استاد محترم "${deleteModalTeacher.name}" کا ریکارڈ کامیابی سے خارج ہو گیا۔`, 'success');
      if (selectedTeacher?.id === deleteModalTeacher.id) {
        setShowProfileModal(false);
        setSelectedTeacher(null);
      }
      setDeleteModalTeacher(null);
      await onRefresh();
    } catch (err: any) {
      showMsg('حذف کرنے میں خرابی: ' + (err.message || 'نامعلوم غلطی'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCNICChange = (val: string) => {
    const formatted = formatCNIC(val);
    setFormData(prev => ({ ...prev, cnic: formatted }));
    if (formatted.length > 0 && !isValidCNIC(formatted)) {
      setCnicError(CNIC_ERROR_MSG);
    } else {
      setCnicError(null);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMsg('تصویر کا سائز 2MB سے کم ہونا چاہیے', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, photoUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showMsg('استاد کا نام درج کرنا لازمی ہے۔', 'error');
      return;
    }
    if (!formData.fatherName.trim()) {
      showMsg('والد کا نام درج کرنا لازمی ہے۔', 'error');
      return;
    }

    // CNIC VALIDATION
    if (!formData.cnic || !isValidCNIC(formData.cnic)) {
      setCnicError(CNIC_ERROR_MSG);
      showMsg(CNIC_ERROR_MSG, 'error');
      return;
    }

    // Duplicate CNIC check
    const duplicateCNIC = teachers.find(
      t => t.cnic === formData.cnic && t.id !== formData.id
    );
    if (duplicateCNIC) {
      showMsg(`شناختی کارڈ نمبر ${formData.cnic} پہلے سے استاد "${duplicateCNIC.name}" کے ریکارڈ میں موجود ہے۔`, 'error');
      return;
    }

    try {
      const teacherId = formData.id || `TCH-${String(teachers.length + 1).padStart(3, '0')}`;
      const teacherToSave: Teacher = {
        ...formData,
        id: teacherId,
        basicSalary: Number(formData.basicSalary) || 0
      };

      await dbService.put('teachers', teacherToSave);
      showMsg(
        isEditing ? 'استاد کا ریکارڈ کامیابی سے اپ ڈیٹ ہو گیا ہے۔' : 'نیا استاد کامیابی سے محفوظ ہو گیا ہے۔',
        'success'
      );
      setShowModal(false);
      await onRefresh();
    } catch (err: any) {
      showMsg('محفوظ کرنے میں خرابی: ' + err.message, 'error');
    }
  };

  const handleClear = () => {
    setSearchName('');
    setSearchFather('');
    setSearchID('');
    setSearchCNIC('');
    setSearchMobile('');
  };

  const filteredTeachers = teachers.filter(t => {
    if (searchName && !t.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchFather && !t.fatherName.toLowerCase().includes(searchFather.toLowerCase())) return false;
    if (searchID && !t.id.toLowerCase().includes(searchID.toLowerCase())) return false;
    if (searchCNIC && !t.cnic.includes(searchCNIC)) return false;
    if (searchMobile && !t.mobile.includes(searchMobile)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl flex items-center justify-between shadow-md ${
            feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Card */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              اساتذہ کا انتظام و بنیادی ریکارڈ (Teacher Management)
            </h2>
            <p className="text-xs text-slate-500">
              بنیادی معلومات، 13 ہندسوں کا درست شناختی کارڈ (CNIC No.)، شعبہ، کلاس اور تنخواہ
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              onClick={handleNewTeacher}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              نیا استاد شامل کریں
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            پرنٹ لسٹ اساتذہ
          </button>
        </div>
      </div>

      {/* Search Filters */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 pb-2 border-b">
          <Search className="w-3.5 h-3.5 text-indigo-600" />
          تلاش برائے اساتذہ
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div>
            <label className="block text-slate-600 mb-1">نام استاد</label>
            <input
              type="text"
              placeholder="نام..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">والد کا نام</label>
            <input
              type="text"
              placeholder="والد..."
              value={searchFather}
              onChange={e => setSearchFather(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">Teacher ID</label>
            <input
              type="text"
              placeholder="ID..."
              value={searchID}
              onChange={e => setSearchID(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">CNIC نمبر</label>
            <input
              type="text"
              placeholder="شناختی کارڈ..."
              value={searchCNIC}
              onChange={e => setSearchCNIC(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1">موبائل نمبر</label>
            <input
              type="text"
              placeholder="موبائل..."
              value={searchMobile}
              onChange={e => setSearchMobile(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClear}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              صاف کریں
            </button>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">تصویر</th>
                <th className="p-3">ID</th>
                <th className="p-3">استاد کا نام</th>
                <th className="p-3">والد کا نام</th>
                <th className="p-3 font-bold text-indigo-900">CNIC No. (شناختی کارڈ)</th>
                <th className="p-3">موبائل / WhatsApp</th>
                <th className="p-3">عہدہ و شعبہ</th>
                <th className="p-3">بنیادی تنخواہ</th>
                <th className="p-3">حیثیت</th>
                <th className="p-3 no-print text-center">کارروائی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    کوئی استاد ریکارڈ دستیاب نہیں ملا۔
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(tch => (
                  <tr key={tch.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3">
                      {tch.photoUrl ? (
                        <img
                          src={tch.photoUrl}
                          alt={tch.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                          {tch.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{tch.id}</td>
                    <td className="p-3 font-semibold text-slate-900">{tch.name}</td>
                    <td className="p-3 text-slate-700">{tch.fatherName}</td>
                    <td className="p-3 font-mono font-bold text-indigo-700 bg-indigo-50/50 px-2 rounded">
                      {tch.cnic}
                    </td>
                    <td className="p-3 text-slate-600">{tch.mobile}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{tch.designation}</div>
                      <span className="text-[10px] text-slate-500">{tch.branch}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{formatPKR(tch.basicSalary)}</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        {tch.status}
                      </span>
                    </td>
                    <td className="p-3 no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedTeacher(tch);
                            setShowProfileModal(true);
                          }}
                          title="استاد کا مکمل پروفائل دیکھیں"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleEditTeacher(tch)}
                              title="ترمیم کریں"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(tch)}
                              title="حذف کریں"
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

      {/* TEACHER ENTRY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-nastaliq text-amber-400">
                  {isEditing ? 'استاد محترم کے ریکارڈ میں ترمیم' : 'نئے استاد کا بنیادی ڈیٹا اندراج (Teacher Data Entry)'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTeacher} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Basic Teacher Data with mandatory CNIC */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 text-indigo-900">
                  بنیادی ڈیٹا (Basic Data)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Teacher ID *</label>
                    <input
                      type="text"
                      required
                      value={formData.id}
                      onChange={e => setFormData({ ...formData, id: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Teacher Name (استاد کا نام) *</label>
                    <input
                      type="text"
                      required
                      placeholder="استاد محترم کا نام..."
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Father Name (والد کا نام) *</label>
                    <input
                      type="text"
                      required
                      placeholder="والد کا نام..."
                      value={formData.fatherName}
                      onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* CNIC No. FIELD (CRITICAL REQUIREMENT) */}
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block font-bold text-indigo-900 mb-1">
                      CNIC No. (شناختی کارڈ نمبر) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      placeholder="17301-1234567-1"
                      value={formData.cnic}
                      onChange={e => handleCNICChange(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-1.5 font-mono font-bold text-sm tracking-wide ${
                        cnicError ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-indigo-400 bg-indigo-50/30'
                      }`}
                    />
                    {cnicError ? (
                      <p className="text-rose-600 text-[11px] font-bold mt-1">{cnicError}</p>
                    ) : (
                      <p className="text-slate-400 text-[10px] mt-0.5">فارمیٹ: XXXXX-XXXXXXX-X (صرف 13 ہندسے)</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Mobile Number (موبائل نمبر) *</label>
                    <input
                      type="text"
                      required
                      placeholder="0300-1234567"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">WhatsApp Number *</label>
                    <input
                      type="text"
                      placeholder="0300-1234567"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Date of Birth (تاریخ پیدائش)</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Address (مکمل رہائشی پتہ)</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Academic & Job Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 text-indigo-900">
                  عہدہ، شعبہ و تعلیمی قابلیت
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Qualification (تعلیمی قابلیت)</label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Designation (عہدہ)</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Joining Date (شمولیت کی تاریخ)</label>
                    <input
                      type="date"
                      value={formData.joiningDate}
                      onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Branch (شعبہ)</label>
                    <select
                      value={formData.branch}
                      onChange={e => setFormData({ ...formData, branch: e.target.value as BranchType })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="حفظ القرآن">حفظ القرآن</option>
                      <option value="تجوید للحفاظ">تجوید للحفاظ</option>
                      <option value="درس نظامی">درس نظامی</option>
                      <option value="ناظرہ قرآن">ناظرہ قرآن</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Assigned Class (مختص کلاس)</label>
                    <input
                      type="text"
                      placeholder="مثلاً: درجہ اولیٰ، حفظ کلاس الف"
                      value={formData.assignedClass}
                      onChange={e => setFormData({ ...formData, assignedClass: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Status (حیثیت)</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as TeacherStatus })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="فعال">فعال</option>
                      <option value="رخصت پر">رخصت پر</option>
                      <option value="فارغ">فارغ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Salary & Bank Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-1.5 text-indigo-900">
                  تنخواہ و بینک تفصیلات
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Salary Type (تنخواہ کی قسم)</label>
                    <select
                      value={formData.salaryType}
                      onChange={e => setFormData({ ...formData, salaryType: e.target.value as SalaryType })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="ماہانہ">ماہانہ</option>
                      <option value="گھنٹہ وار">گھنٹہ وار</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Basic Salary (بنیادی تنخواہ - PKR)</label>
                    <input
                      type="number"
                      required
                      value={formData.basicSalary}
                      onChange={e => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Bank Information (بینک اکاؤنٹ)</label>
                    <input
                      type="text"
                      placeholder="بینک نام و اکاؤنٹ نمبر..."
                      value={formData.bankInfo}
                      onChange={e => setFormData({ ...formData, bankInfo: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Easypaisa Number</label>
                    <input
                      type="text"
                      placeholder="0300-1234567"
                      value={formData.easypaisa}
                      onChange={e => setFormData({ ...formData, easypaisa: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">JazzCash Number</label>
                    <input
                      type="text"
                      placeholder="0300-1234567"
                      value={formData.jazzCash}
                      onChange={e => setFormData({ ...formData, jazzCash: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Notes (نوٹس)</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="استاد" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">استاد کی تصویر منتخب کریں (Teacher Photo)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-medium hover:file:bg-indigo-700 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">سپورٹ شدہ فارمیٹس: JPG, PNG, WEBP (زیادہ سے زیادہ 2MB)</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  ریکارڈ محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEACHER PROFILE VIEW MODAL */}
      {showProfileModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-right flex flex-col max-h-[92vh]">
            <button
              onClick={() => setShowProfileModal(false)}
              className="no-print absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              {selectedTeacher.photoUrl ? (
                <img
                  src={selectedTeacher.photoUrl}
                  alt={selectedTeacher.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-600 shadow"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center">
                  {selectedTeacher.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-nastaliq text-slate-900">{selectedTeacher.name}</h3>
                  <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">
                    ID: {selectedTeacher.id}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">ولد: {selectedTeacher.fatherName}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  <span className="bg-indigo-100 text-indigo-900 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                    CNIC: {selectedTeacher.cnic}
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    عہدہ: {selectedTeacher.designation}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    شعبہ: {selectedTeacher.branch}
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                    حیثیت: {selectedTeacher.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1 overflow-y-auto py-4 text-xs space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 border-b pb-1 mb-2 text-indigo-900">
                  بنیادی و رابطے کی معلومات (Basic & Contact Information)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block">شناختی کارڈ نمبر (CNIC):</span>
                    <span className="font-bold text-indigo-900 font-mono text-xs">{selectedTeacher.cnic}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">موبائل نمبر:</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedTeacher.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">WhatsApp نمبر:</span>
                    <span className="font-semibold text-slate-800 font-mono">{selectedTeacher.whatsapp || selectedTeacher.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تاریخ پیدائش:</span>
                    <span className="font-semibold text-slate-800">{selectedTeacher.dob || 'درج نہیں'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تاریخ شمولیت:</span>
                    <span className="font-semibold text-slate-800">{selectedTeacher.joiningDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تعلیمی قابلیت:</span>
                    <span className="font-semibold text-slate-800">{selectedTeacher.qualification}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">مختص کلاس:</span>
                    <span className="font-semibold text-slate-800">{selectedTeacher.assignedClass || 'تمام کلاسز'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">بنیادی تنخواہ:</span>
                    <span className="font-bold text-emerald-700">{formatPKR(selectedTeacher.basicSalary)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تنخواہ کی قسم:</span>
                    <span className="font-semibold text-slate-800">{selectedTeacher.salaryType}</span>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <span className="text-slate-400 block">رہائشی پتہ:</span>
                    <span className="font-semibold text-slate-800">{selectedTeacher.address || 'درج نہیں'}</span>
                  </div>
                </div>
              </div>

              {(selectedTeacher.bankInfo || selectedTeacher.easypaisa || selectedTeacher.jazzCash) && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 border-b pb-1 mb-2 text-indigo-900">
                    بینک و آن لائن اکاؤنٹ تفصیلات
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedTeacher.bankInfo && (
                      <div className="col-span-2">
                        <span className="text-slate-400 block">بینک معلومات:</span>
                        <span className="font-semibold text-slate-800">{selectedTeacher.bankInfo}</span>
                      </div>
                    )}
                    {selectedTeacher.easypaisa && (
                      <div>
                        <span className="text-slate-400 block">Easypaisa:</span>
                        <span className="font-semibold text-slate-800 font-mono">{selectedTeacher.easypaisa}</span>
                      </div>
                    )}
                    {selectedTeacher.jazzCash && (
                      <div>
                        <span className="text-slate-400 block">JazzCash:</span>
                        <span className="font-semibold text-slate-800 font-mono">{selectedTeacher.jazzCash}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTeacher.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">نوٹس / کمنٹس:</span>
                  <p className="text-slate-700">{selectedTeacher.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="no-print pt-4 flex justify-between items-center border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                پرنٹ استاد پروفائل
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
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalTeacher}
        title="استاد محترم کا ریکارڈ خارج کریں"
        itemName={deleteModalTeacher ? `استاد محترم ${deleteModalTeacher.name} ولد ${deleteModalTeacher.fatherName}` : ''}
        itemDetails={deleteModalTeacher ? `شناختی کارڈ: ${deleteModalTeacher.cnic} • موبائل: ${deleteModalTeacher.mobile} • شعبہ: ${deleteModalTeacher.branch}` : ''}
        message="کیا آپ واقعی اس استاد محترم کا تمام ریکارڈ مستقل طور پر خارج کرنا چاہتے ہیں؟ یہ عمل واپس نہیں لیا جا سکے گا۔"
        onConfirm={confirmDeleteTeacher}
        onClose={() => setDeleteModalTeacher(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
