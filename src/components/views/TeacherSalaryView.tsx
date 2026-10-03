import React, { useState } from 'react';
import { Teacher, TeacherSalary, PaymentMethod, MadrasaSettings } from '../../types';
import { dbService } from '../../services/db';
import { formatPKR } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { 
  DollarSign, 
  Plus, 
  Printer, 
  Receipt, 
  Search, 
  Save, 
  X, 
  CheckCircle2, 
  Trash2 
} from 'lucide-react';

interface TeacherSalaryViewProps {
  teachers: Teacher[];
  salaries: TeacherSalary[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
}

export const TeacherSalaryView: React.FC<TeacherSalaryViewProps> = ({
  teachers,
  salaries,
  onRefresh,
  settings
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState<TeacherSalary | null>(null);
  const [deleteModalSalary, setDeleteModalSalary] = useState<TeacherSalary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [month, setMonth] = useState<string>('مارچ 2026');
  const [year, setYear] = useState<number>(2026);
  const [basicSalary, setBasicSalary] = useState<number>(teachers[0]?.basicSalary || 40000);
  const [allowance, setAllowance] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [deduction, setDeduction] = useState<number>(0);
  const [absentDeduction, setAbsentDeduction] = useState<number>(0);
  const [advance, setAdvance] = useState<number>(0);
  const [otherDeduction, setOtherDeduction] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(teachers[0]?.basicSalary || 40000);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('بینک');
  const [receiptNo, setReceiptNo] = useState<string>(`SLIP-2026-${String(salaries.length + 1).padStart(3, '0')}`);
  const [notes, setNotes] = useState<string>('');

  // Search filter
  const [searchFilter, setSearchFilter] = useState('');

  // Auto-calculated Net Salary
  const netSalary = Math.max(0, basicSalary + allowance + bonus - deduction - absentDeduction - advance - otherDeduction);
  const balance = Math.max(0, netSalary - paidAmount);

  const handleTeacherChange = (id: string) => {
    setSelectedTeacherId(id);
    const tch = teachers.find(t => t.id === id);
    if (tch) {
      setBasicSalary(tch.basicSalary || 0);
      setPaidAmount(tch.basicSalary || 0);
    }
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    const tch = teachers.find(t => t.id === selectedTeacherId);
    if (!tch) {
      alert('براہ کرم استاد محترم کا انتخاب کریں۔');
      return;
    }

    try {
      const newSalary: TeacherSalary = {
        id: `SAL-${Date.now()}`,
        teacherId: tch.id,
        teacherName: tch.name,
        month,
        year: Number(year),
        basicSalary: Number(basicSalary),
        allowance: Number(allowance),
        bonus: Number(bonus),
        deduction: Number(deduction),
        absentDeduction: Number(absentDeduction),
        advance: Number(advance),
        otherDeduction: Number(otherDeduction),
        netSalary,
        paidAmount: Number(paidAmount),
        balance,
        paymentDate,
        paymentMethod,
        receiptNo,
        notes
      };

      await dbService.put('salaries', newSalary);
      setShowModal(false);
      await onRefresh();
    } catch (err: any) {
      alert('محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  const handleDeleteSalary = (sal: TeacherSalary) => {
    if (!canEdit) return;
    setDeleteModalSalary(sal);
  };

  const confirmDeleteSalary = async () => {
    if (!deleteModalSalary) return;
    setIsDeleting(true);
    try {
      await dbService.delete('salaries', deleteModalSalary.id);
      if (selectedSlip?.id === deleteModalSalary.id) {
        setSelectedSlip(null);
      }
      setDeleteModalSalary(null);
      await onRefresh();
    } catch (err: any) {
      alert('تنخواہ ریکارڈ حذف کرنے میں خرابی: ' + (err.message || 'نامعلوم غلطی'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSalaries = salaries.filter(s =>
    s.teacherName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.month.includes(searchFilter) ||
    s.receiptNo.includes(searchFilter)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              اساتذہ کی تنخواہیں و پے سلپ (Teacher Salaries)
            </h2>
            <p className="text-xs text-slate-500">
              بنیادی تنخواہ، الاؤنسز، کٹوتیاں، نیٹ تنخواہ اور پرنٹ ایبل تنخواہ سلپ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {canEdit && (
            <button
              onClick={() => {
                setReceiptNo(`SLIP-2026-${String(salaries.length + 1).padStart(3, '0')}`);
                setShowModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              نئی تنخواہ ادائیگی اندراج
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            پرنٹ رپورٹ
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="no-print bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="تلاش برائے استاد کا نام، مہینہ، رسید نمبر..."
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          className="w-full text-xs outline-none"
        />
      </div>

      {/* Salaries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">رسید نمبر</th>
                <th className="p-3">استاد کا نام</th>
                <th className="p-3">مہینہ و سال</th>
                <th className="p-3">بنیادی تنخواہ</th>
                <th className="p-3">الاؤنس / بونس</th>
                <th className="p-3">کل کٹوتی</th>
                <th className="p-3 font-bold text-slate-900">خالص تنخواہ</th>
                <th className="p-3 font-bold text-emerald-800">ادا شدہ</th>
                <th className="p-3">بقایا</th>
                <th className="p-3">طریقہ</th>
                <th className="p-3 no-print text-center">کارروائی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    کوئی تنخواہ ریکارڈ موجود نہیں ہے۔
                  </td>
                </tr>
              ) : (
                filteredSalaries.map(sal => {
                  const totalDeductions = (sal.deduction || 0) + (sal.absentDeduction || 0) + (sal.advance || 0) + (sal.otherDeduction || 0);
                  return (
                    <tr key={sal.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-blue-700">{sal.receiptNo}</td>
                      <td className="p-3 font-semibold text-slate-900">{sal.teacherName}</td>
                      <td className="p-3 text-slate-700">{sal.month}</td>
                      <td className="p-3 text-slate-700">{formatPKR(sal.basicSalary)}</td>
                      <td className="p-3 text-emerald-700">+{formatPKR((sal.allowance || 0) + (sal.bonus || 0))}</td>
                      <td className="p-3 text-rose-600">-{formatPKR(totalDeductions)}</td>
                      <td className="p-3 font-bold text-slate-900">{formatPKR(sal.netSalary)}</td>
                      <td className="p-3 font-bold text-emerald-700 bg-emerald-50/40">{formatPKR(sal.paidAmount)}</td>
                      <td className="p-3 text-amber-700 font-bold">{sal.balance > 0 ? formatPKR(sal.balance) : '—'}</td>
                      <td className="p-3 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          {sal.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSlip(sal);
                              setShowSlipModal(true);
                            }}
                            title="تنخواہ سلپ دیکھیں اور پرنٹ کریں"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            سلپ
                          </button>

                          {role === 'admin' && (
                            <button
                              onClick={() => handleDeleteSalary(sal)}
                              title="حذف کریں"
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW SALARY ENTRY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-nastaliq text-amber-400">
                  اساتذہ کی تنخواہ کی ادائیگی کا اندراج
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSalary} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">استاد محترم کا انتخاب *</label>
                  <select
                    value={selectedTeacherId}
                    onChange={e => handleTeacherChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.designation} - {t.branch})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">رسید نمبر</label>
                  <input
                    type="text"
                    required
                    value={receiptNo}
                    onChange={e => setReceiptNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">مہینہ</label>
                  <input
                    type="text"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    placeholder="مثلاً: مارچ 2026"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">سال</label>
                  <input
                    type="number"
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">بنیادی تنخواہ (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={basicSalary}
                    onChange={e => setBasicSalary(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">الاؤنس</label>
                  <input
                    type="number"
                    value={allowance}
                    onChange={e => setAllowance(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">اضافی رقم (بونس)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={e => setBonus(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">عام کٹوتی</label>
                  <input
                    type="number"
                    value={deduction}
                    onChange={e => setDeduction(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">غیر حاضری کٹوتی</label>
                  <input
                    type="number"
                    value={absentDeduction}
                    onChange={e => setAbsentDeduction(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">ایڈوانس کٹوتی</label>
                  <input
                    type="number"
                    value={advance}
                    onChange={e => setAdvance(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">دیگر کٹوتی</label>
                  <input
                    type="number"
                    value={otherDeduction}
                    onChange={e => setOtherDeduction(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Summary Calculation Box */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-blue-700 block">خالص تنخواہ (Net)</span>
                  <span className="text-base font-bold text-blue-900">{formatPKR(netSalary)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-700 block">ادا شدہ رقم</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="w-full border border-emerald-400 rounded-lg px-2 py-1 text-center font-bold text-emerald-900 bg-white"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-amber-700 block">بقایا</span>
                  <span className="text-base font-bold text-amber-900">{formatPKR(balance)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">ادائیگی تاریخ</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">ادائیگی کا طریقہ</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="نقد">نقد (Cash)</option>
                    <option value="بینک">بینک (Bank Transfer)</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="دیگر">دیگر</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">نوٹس</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                    placeholder="مثلاً: ٹرانسفر آئی ڈی، دستخط وغیرہ..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  ادائیگی محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE SALARY SLIP MODAL */}
      {showSlipModal && selectedSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-right">
            <button
              onClick={() => setShowSlipModal(false)}
              className="no-print absolute top-4 left-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Slip Container for Print */}
            <div className="border-2 border-slate-800 p-5 rounded-xl space-y-4">
              {/* Slip Header with Logo */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                {settings.logoBase64 ? (
                  <img src={settings.logoBase64} alt="لوگو" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold">
                    لوگو
                  </div>
                )}
                <div className="text-center flex-1 pr-3">
                  <h2 className="text-xl font-bold font-nastaliq text-slate-900">{settings.madrasaNameUrdu}</h2>
                  <p className="text-xs font-semibold text-slate-700">{settings.madrasaNameEnglish}</p>
                  <span className="inline-block mt-1 bg-slate-900 text-white text-[11px] px-3 py-0.5 rounded-full font-bold">
                    ماہانہ تنخواہ سلپ (Salary Slip)
                  </span>
                </div>
              </div>

              {/* Teacher & Slip Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-300">
                <div>
                  <span className="text-slate-500">استاد محترم: </span>
                  <span className="font-bold text-slate-900">{selectedSlip.teacherName}</span>
                </div>
                <div>
                  <span className="text-slate-500">رسید نمبر: </span>
                  <span className="font-mono font-bold text-slate-900">{selectedSlip.receiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-500">ماہ و سال: </span>
                  <span className="font-bold text-slate-900">{selectedSlip.month} {selectedSlip.year}</span>
                </div>
                <div>
                  <span className="text-slate-500">ادائیگی تاریخ: </span>
                  <span className="font-bold text-slate-900">{selectedSlip.paymentDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">ادائیگی کا طریقہ: </span>
                  <span className="font-bold text-slate-900">{selectedSlip.paymentMethod}</span>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="p-2 border-l text-right">تفصیلات</th>
                    <th className="p-2 text-left">رقم (روپے)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border-l">بنیادی تنخواہ</td>
                    <td className="p-2 text-left font-semibold">{formatPKR(selectedSlip.basicSalary)}</td>
                  </tr>
                  {selectedSlip.allowance > 0 && (
                    <tr>
                      <td className="p-2 border-l">الاؤنس</td>
                      <td className="p-2 text-left font-semibold">+{formatPKR(selectedSlip.allowance)}</td>
                    </tr>
                  )}
                  {selectedSlip.bonus > 0 && (
                    <tr>
                      <td className="p-2 border-l">بونس / اضافی رقم</td>
                      <td className="p-2 text-left font-semibold">+{formatPKR(selectedSlip.bonus)}</td>
                    </tr>
                  )}
                  {selectedSlip.absentDeduction > 0 && (
                    <tr>
                      <td className="p-2 border-l text-rose-600">غیر حاضری کٹوتی</td>
                      <td className="p-2 text-left text-rose-600 font-semibold">-{formatPKR(selectedSlip.absentDeduction)}</td>
                    </tr>
                  )}
                  {selectedSlip.advance > 0 && (
                    <tr>
                      <td className="p-2 border-l text-rose-600">ایڈوانس کٹوتی</td>
                      <td className="p-2 text-left text-rose-600 font-semibold">-{formatPKR(selectedSlip.advance)}</td>
                    </tr>
                  )}
                  {selectedSlip.deduction > 0 && (
                    <tr>
                      <td className="p-2 border-l text-rose-600">دیگر کٹوتیاں</td>
                      <td className="p-2 text-left text-rose-600 font-semibold">-{formatPKR(selectedSlip.deduction)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-800">
                    <td className="p-2 border-l">خالص تنخواہ (Net Salary)</td>
                    <td className="p-2 text-left">{formatPKR(selectedSlip.netSalary)}</td>
                  </tr>
                  <tr className="bg-emerald-50 font-bold text-emerald-900">
                    <td className="p-2 border-l">ادا شدہ رقم (Paid)</td>
                    <td className="p-2 text-left">{formatPKR(selectedSlip.paidAmount)}</td>
                  </tr>
                  {selectedSlip.balance > 0 && (
                    <tr className="bg-amber-50 font-bold text-amber-900">
                      <td className="p-2 border-l">بقایا (Balance)</td>
                      <td className="p-2 text-left">{formatPKR(selectedSlip.balance)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {selectedSlip.notes && (
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold">نوٹس: </span>{selectedSlip.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs text-slate-800">
                <div>
                  <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
                  <span>دستخط وصول کنندہ / استاد</span>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
                  <span>دستخط ناظم مالیات / مہتمم</span>
                </div>
              </div>
            </div>

            {/* Print Action */}
            <div className="no-print pt-4 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                پرنٹ سلپ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalSalary}
        title="استاد محترم کی تنخواہ سلپ ریکارڈ حذف کریں"
        itemName={deleteModalSalary ? `استاد محترم: ${deleteModalSalary.teacherName} (ماہ: ${deleteModalSalary.month})` : ''}
        itemDetails={deleteModalSalary ? `رسید نمبر: ${deleteModalSalary.receiptNo} • ادا شدہ نیٹ تنخواہ: ${formatPKR(deleteModalSalary.netSalary)}` : ''}
        message="کیا آپ واقعی اس تنخواہ سلپ کا ریکارڈ مستقل طور پر خارج کرنا چاہتے ہیں؟"
        onConfirm={confirmDeleteSalary}
        onClose={() => setDeleteModalSalary(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
