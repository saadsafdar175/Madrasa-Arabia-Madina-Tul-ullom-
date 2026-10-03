import React, { useState } from 'react';
import { Student, FeeRecord, FeeType, FeeStatus, PaymentMethod, MadrasaSettings } from '../../types';
import { dbService } from '../../services/db';
import { formatPKR } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { 
  Receipt, 
  Plus, 
  Search, 
  Printer, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Trash2 
} from 'lucide-react';

interface FeeViewProps {
  students: Student[];
  fees: FeeRecord[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
}

export const FeeView: React.FC<FeeViewProps> = ({
  students,
  fees,
  onRefresh,
  settings
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FeeRecord | null>(null);
  const [deleteModalFee, setDeleteModalFee] = useState<FeeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [month, setMonth] = useState<string>('مارچ 2026');
  const [feeType, setFeeType] = useState<FeeType>('ماہانہ فیس');
  const [totalAmount, setTotalAmount] = useState<number>(3500);
  const [paidAmount, setPaidAmount] = useState<number>(3500);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('نقد');
  const [receiptNo, setReceiptNo] = useState<string>(`REC-2026-${String(fees.length + 1).padStart(3, '0')}`);
  const [notes, setNotes] = useState<string>('');

  const [searchFilter, setSearchFilter] = useState('');

  // Auto calculate balance and status
  const balance = Math.max(0, totalAmount - paidAmount);
  const feeStatus: FeeStatus = paidAmount >= totalAmount ? 'ادا شدہ' : paidAmount > 0 ? 'جزوی' : 'بقایا';

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
  };

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const stu = students.find(s => s.id === selectedStudentId);
    if (!stu) {
      alert('طالب علم کا انتخاب کریں۔');
      return;
    }

    try {
      const record: FeeRecord = {
        id: `FEE-${Date.now()}`,
        studentId: stu.id,
        studentName: stu.fullName,
        fatherName: stu.fatherName,
        rollNo: stu.rollNo,
        grade: stu.grade,
        branch: stu.branch,
        month,
        feeType,
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        balance,
        date,
        paymentMethod,
        receiptNo,
        status: feeStatus,
        notes
      };

      await dbService.put('fees', record);
      setShowModal(false);
      await onRefresh();
    } catch (err: any) {
      alert('محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  const handleDeleteFee = (fee: FeeRecord) => {
    if (!canEdit) return;
    setDeleteModalFee(fee);
  };

  const confirmDeleteFee = async () => {
    if (!deleteModalFee) return;
    setIsDeleting(true);
    try {
      await dbService.delete('fees', deleteModalFee.id);
      if (selectedReceipt?.id === deleteModalFee.id) {
        setSelectedReceipt(null);
      }
      setDeleteModalFee(null);
      await onRefresh();
    } catch (err: any) {
      alert('فیس ریکارڈ حذف کرنے میں خرابی: ' + (err.message || 'نامعلوم خرابی'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFees = fees.filter(f =>
    f.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.rollNo.includes(searchFilter) ||
    f.receiptNo.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.month.includes(searchFilter)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              فیس مینجمنٹ و رسید وصولی (Fee Management)
            </h2>
            <p className="text-xs text-slate-500">
              ماہانہ فیس، داخلہ فیس، بقایا جات، باقاعدہ پرنٹ ایبل کمپیوٹرائزڈ فیس رسید
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {canEdit && (
            <button
              onClick={() => {
                setReceiptNo(`REC-2026-${String(fees.length + 1).padStart(3, '0')}`);
                setShowModal(true);
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              نئی فیس وصولی اندراج
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            پرنٹ فیس ریکارڈ
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="no-print bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="تلاش برائے طالب علم کا نام، رول نمبر، رسید نمبر یا مہینہ..."
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          className="w-full text-xs outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">رسید نمبر</th>
                <th className="p-3">رول نمبر</th>
                <th className="p-3">طالب علم کا نام</th>
                <th className="p-3">والد کا نام</th>
                <th className="p-3">فیس کی قسم</th>
                <th className="p-3">مہینہ</th>
                <th className="p-3">کل فیس</th>
                <th className="p-3 font-bold text-emerald-800">وصول شدہ</th>
                <th className="p-3 font-bold text-rose-700">بقایا</th>
                <th className="p-3">حیثیت</th>
                <th className="p-3 no-print text-center">کارروائی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    کوئی فیس ریکارڈ دستیاب نہیں ملا۔
                  </td>
                </tr>
              ) : (
                filteredFees.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-sky-800">{rec.receiptNo}</td>
                    <td className="p-3 font-bold text-slate-800">{rec.rollNo}</td>
                    <td className="p-3 font-semibold text-slate-900">{rec.studentName}</td>
                    <td className="p-3 text-slate-700">{rec.fatherName}</td>
                    <td className="p-3 text-slate-600">{rec.feeType}</td>
                    <td className="p-3 text-slate-600">{rec.month}</td>
                    <td className="p-3 text-slate-700">{formatPKR(rec.totalAmount)}</td>
                    <td className="p-3 font-bold text-emerald-700 bg-emerald-50/40">{formatPKR(rec.paidAmount)}</td>
                    <td className="p-3 font-bold text-rose-600">{rec.balance > 0 ? formatPKR(rec.balance) : '0'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          rec.status === 'ادا شدہ'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'جزوی'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-3 no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedReceipt(rec);
                            setShowReceiptModal(true);
                          }}
                          title="رسید دیکھیں و پرنٹ کریں"
                          className="bg-sky-50 text-sky-700 hover:bg-sky-100 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          رسید
                        </button>

                        {role === 'admin' && (
                          <button
                            onClick={() => handleDeleteFee(rec)}
                            title="حذف کریں"
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* NEW FEE ENTRY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-nastaliq text-amber-400">
                  طالب علم کی فیس وصولی کا اندراج
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">طالب علم کا انتخاب *</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => handleStudentChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} بن {s.fatherName} (رول: {s.rollNo} - {s.branch})
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">فیس کی قسم</label>
                  <select
                    value={feeType}
                    onChange={e => setFeeType(e.target.value as FeeType)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="ماہانہ فیس">ماہانہ فیس</option>
                    <option value="داخلہ فیس">داخلہ فیس</option>
                    <option value="امتحانی فیس">امتحانی فیس</option>
                    <option value="ہاسٹل فیس">ہاسٹل فیس</option>
                    <option value="دیگر فیس">دیگر فیس</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">مہینہ</label>
                  <input
                    type="text"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500"
                    placeholder="مارچ 2026"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">تاریخ وصولی</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">کل رقم (Total Amount)</label>
                  <input
                    type="number"
                    required
                    value={totalAmount}
                    onChange={e => setTotalAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">وصول شدہ رقم (Paid Amount)</label>
                  <input
                    type="number"
                    required
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="w-full border border-emerald-500 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">ادائیگی کا طریقہ</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="نقد">نقد</option>
                    <option value="بینک">بینک</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="دیگر">دیگر</option>
                  </select>
                </div>

                <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-200 flex flex-col justify-center">
                  <span className="text-[11px] text-sky-800">بقایا رقم:</span>
                  <span className="text-base font-bold text-rose-600">{formatPKR(balance)}</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">نوٹس</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500"
                    placeholder="اضافی ہدایات یا تفصیلات..."
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
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  فیس رسید محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE FEE RECEIPT MODAL (DUPLICATE COPY) */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-right">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="no-print absolute top-4 left-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Content for Clean Print */}
            <div className="border-2 border-slate-800 p-5 rounded-xl space-y-4">
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
                    کمپیوٹرائزڈ فیس رسید (Fee Receipt)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-300">
                <div>
                  <span className="text-slate-500">رسید نمبر: </span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceipt.receiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-500">تاریخ: </span>
                  <span className="font-bold text-slate-900">{selectedReceipt.date}</span>
                </div>
                <div>
                  <span className="text-slate-500">طالب علم کا نام: </span>
                  <span className="font-bold text-slate-900">{selectedReceipt.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-500">والد کا نام: </span>
                  <span className="font-bold text-slate-900">{selectedReceipt.fatherName}</span>
                </div>
                <div>
                  <span className="text-slate-500">رول نمبر: </span>
                  <span className="font-bold text-slate-900">{selectedReceipt.rollNo}</span>
                </div>
                <div>
                  <span className="text-slate-500">شعبہ و درجہ: </span>
                  <span className="font-bold text-slate-900">{selectedReceipt.branch} ({selectedReceipt.grade})</span>
                </div>
              </div>

              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="p-2 border-l text-right">فیس کی قسم</th>
                    <th className="p-2 border-l text-center">مہینہ</th>
                    <th className="p-2 border-l text-center">کل رقم</th>
                    <th className="p-2 border-l text-center">وصول شدہ</th>
                    <th className="p-2 text-left">بقایا</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 border-l font-bold">{selectedReceipt.feeType}</td>
                    <td className="p-2.5 border-l text-center">{selectedReceipt.month}</td>
                    <td className="p-2.5 border-l text-center">{formatPKR(selectedReceipt.totalAmount)}</td>
                    <td className="p-2.5 border-l text-center font-bold text-emerald-800">{formatPKR(selectedReceipt.paidAmount)}</td>
                    <td className="p-2.5 text-left font-bold text-rose-600">{formatPKR(selectedReceipt.balance)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-lg border">
                <span>طریقہ ادائیگی: <strong>{selectedReceipt.paymentMethod}</strong></span>
                <span>حیثیت: <strong className="text-emerald-800">{selectedReceipt.status}</strong></span>
              </div>

              {selectedReceipt.notes && (
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold">نوٹس: </span>{selectedReceipt.notes}
                </div>
              )}

              <div className="grid grid-cols-2 pt-6 text-center text-xs text-slate-800">
                <div>
                  <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
                  <span>دستخط طالب علم / سرپرست</span>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
                  <span>دستخط و مہر دفتر مدرسہ</span>
                </div>
              </div>
            </div>

            <div className="no-print pt-4 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                پرنٹ فیس رسید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalFee}
        title="فیس رسید ریکارڈ حذف کریں"
        itemName={deleteModalFee ? `طالب علم: ${deleteModalFee.studentName} (رول نمبر: ${deleteModalFee.rollNo})` : ''}
        itemDetails={deleteModalFee ? `رسید نمبر: ${deleteModalFee.receiptNo} • رقم: ${formatPKR(deleteModalFee.paidAmount)} • مہینہ: ${deleteModalFee.month}` : ''}
        message="کیا آپ واقعی اس فیس رسید کا ریکارڈ مستقل طور پر خارج کرنا چاہتے ہیں؟"
        onConfirm={confirmDeleteFee}
        onClose={() => setDeleteModalFee(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
