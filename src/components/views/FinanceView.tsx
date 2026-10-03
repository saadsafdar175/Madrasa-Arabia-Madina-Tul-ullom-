import React, { useState } from 'react';
import { 
  FinanceTransaction, 
  TransactionType, 
  IncomeCategory, 
  ExpenseCategory, 
  PaymentMethod, 
  MadrasaSettings 
} from '../../types';
import { dbService } from '../../services/db';
import { formatPKR } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Printer, 
  Search, 
  Save, 
  X, 
  Trash2, 
  Calendar,
  Filter,
  Eye
} from 'lucide-react';

interface FinanceViewProps {
  finance: FinanceTransaction[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
}

const INCOME_CATEGORIES: IncomeCategory[] = ['فیس', 'عطیہ', 'زکوٰۃ', 'صدقہ', 'تعاون', 'دیگر'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'راشن',
  'بجلی',
  'گیس',
  'پانی',
  'تنخواہیں',
  'کتابیں',
  'تعمیرات',
  'مرمت',
  'طلبہ اخراجات',
  'ہاسٹل',
  'دیگر'
];

export const FinanceView: React.FC<FinanceViewProps> = ({
  finance,
  onRefresh,
  settings
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<FinanceTransaction | null>(null);
  const [deleteModalTrx, setDeleteModalTrx] = useState<FinanceTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [type, setType] = useState<TransactionType>('آمدن');
  const [category, setCategory] = useState<string>('عطیہ');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<number>(5000);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('نقد');
  const [receiptVoucherNo, setReceiptVoucherNo] = useState<string>(`VCH-${Date.now().toString().slice(-4)}`);
  const [personName, setPersonName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Computations
  const totalIncome = finance
    .filter(f => f.type === 'آمدن')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalExpense = finance
    .filter(f => f.type === 'اخراجات')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const balance = totalIncome - totalExpense;

  const handleOpenNew = (t: TransactionType) => {
    setType(t);
    setCategory(t === 'آمدن' ? 'عطیہ' : 'راشن');
    setTitle(t === 'آمدن' ? 'تعاون برائے مدرسہ' : 'راشن خریداری');
    setReceiptVoucherNo(`${t === 'آمدن' ? 'INC' : 'EXP'}-${Date.now().toString().slice(-4)}`);
    setShowModal(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('عنوان / تفصیل درج کرنا لازمی ہے۔');
      return;
    }
    if (amount <= 0) {
      alert('رقم صفر سے زیادہ ہونی چاہیے۔');
      return;
    }

    try {
      const newTrx: FinanceTransaction = {
        id: `TRX-${Date.now()}`,
        type,
        category: category as any,
        title,
        amount: Number(amount),
        date,
        paymentMethod,
        receiptVoucherNo,
        personName,
        notes
      };

      await dbService.put('finance', newTrx);
      setShowModal(false);
      await onRefresh();
    } catch (err: any) {
      alert('ٹرانزیکشن محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  const handleDelete = (trx: FinanceTransaction) => {
    if (!canEdit) return;
    setDeleteModalTrx(trx);
  };

  const confirmDeleteFinance = async () => {
    if (!deleteModalTrx) return;
    setIsDeleting(true);
    try {
      await dbService.delete('finance', deleteModalTrx.id);
      if (selectedVoucher?.id === deleteModalTrx.id) {
        setSelectedVoucher(null);
      }
      setDeleteModalTrx(null);
      await onRefresh();
    } catch (err: any) {
      alert('مالیاتی ریکارڈ حذف کرنے میں خرابی: ' + (err.message || 'نامعلوم خرابی'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFinance = finance.filter(f => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.receiptVoucherNo.toLowerCase().includes(q) ||
        (f.personName && f.personName.toLowerCase().includes(q))
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
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              آمدن و اخراجات و جنرل لیجر (Finance & Accounts)
            </h2>
            <p className="text-xs text-slate-500">
              کل آمدن، کل اخراجات، موجودہ نیٹ بیلنس، واؤچرز اور مکمل اکاؤنٹس رپورٹ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => handleOpenNew('آمدن')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                آمدن اندراج (+)
              </button>
              <button
                onClick={() => handleOpenNew('اخراجات')}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                خرچ اندراج (-)
              </button>
            </>
          )}

          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            پرنٹ مالیاتی رپورٹ
          </button>
        </div>
      </div>

      {/* 3 Summary Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* کل آمدن */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 block">کل آمدن (Total Income)</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{formatPKR(totalIncome)}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">فیس، زکوٰۃ، صدقات و عطیات</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* کل اخراجات */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800 block">کل اخراجات (Total Expenses)</span>
            <span className="text-2xl font-bold text-rose-700 mt-1 block">{formatPKR(totalExpense)}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">راشن، تنخواہیں، بلز و مرمت</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* موجودہ بیلنس */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-800 block">موجودہ بیلنس (آمدن - اخراجات)</span>
            <span className={`text-2xl font-bold mt-1 block ${balance >= 0 ? 'text-blue-900' : 'text-rose-600'}`}>
              {formatPKR(balance)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">نیٹ دستیاب فنڈ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="تلاش برائے عنوان، واؤچر، شخص یا کیٹیگری..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">فلٹر قسم:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg transition ${
              filterType === 'all' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            سب
          </button>
          <button
            onClick={() => setFilterType('آمدن')}
            className={`px-3 py-1 rounded-lg transition ${
              filterType === 'آمدن' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            آمدن (+)
          </button>
          <button
            onClick={() => setFilterType('اخراجات')}
            className={`px-3 py-1 rounded-lg transition ${
              filterType === 'اخراجات' ? 'bg-rose-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
            }`}
          >
            اخراجات (-)
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">واؤچر / رسید</th>
                <th className="p-3">تاریخ</th>
                <th className="p-3">قسم</th>
                <th className="p-3">کیٹیگری</th>
                <th className="p-3">عنوان / تفصیل</th>
                <th className="p-3">نام شخص / ادارہ</th>
                <th className="p-3">طریقہ</th>
                <th className="p-3 font-bold text-slate-900">رقم (روپے)</th>
                <th className="p-3 no-print text-center">کارروائی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFinance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    کوئی مالیاتی ٹرانزیکشن دستیاب نہیں ہے۔
                  </td>
                </tr>
              ) : (
                filteredFinance.map(trx => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-700">{trx.receiptVoucherNo}</td>
                    <td className="p-3 text-slate-600">{trx.date}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          trx.type === 'آمدن'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {trx.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{trx.category}</td>
                    <td className="p-3 font-semibold text-slate-900">{trx.title}</td>
                    <td className="p-3 text-slate-600">{trx.personName || '—'}</td>
                    <td className="p-3 text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">{trx.paymentMethod}</span>
                    </td>
                    <td className="p-3 font-bold text-sm">
                      <span className={trx.type === 'آمدن' ? 'text-emerald-700' : 'text-rose-700'}>
                        {trx.type === 'آمدن' ? '+' : '-'} {formatPKR(trx.amount)}
                      </span>
                    </td>
                    <td className="p-3 no-print text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedVoucher(trx)}
                          title="واؤچر رسید دیکھیں و پرنٹ کریں"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {role === 'admin' && (
                          <button
                            onClick={() => handleDelete(trx)}
                            title="حذف کریں"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
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

      {/* NEW TRANSACTION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-nastaliq text-amber-400">
                  نیا مالیاتی اندراج ({type})
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">قسم (Type) *</label>
                  <select
                    value={type}
                    onChange={e => {
                      const t = e.target.value as TransactionType;
                      setType(t);
                      setCategory(t === 'آمدن' ? 'عطیہ' : 'راشن');
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
                  >
                    <option value="آمدن">آمدن (+ Income)</option>
                    <option value="اخراجات">اخراجات (- Expense)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">کیٹیگری *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {type === 'آمدن'
                      ? INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                      : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">عنوان / مد *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثلاً: راشن خریداری، بجلی بل، تعاون از فلاں صاحب"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">رقم (PKR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">تاریخ</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">واؤچر / رسید نمبر</label>
                  <input
                    type="text"
                    required
                    value={receiptVoucherNo}
                    onChange={e => setReceiptVoucherNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">طریقہ ادائیگی</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="نقد">نقد (Cash)</option>
                    <option value="بینک">بینک (Bank)</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="دیگر">دیگر</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">نام شخص / عطیہ دہندہ / دکاندار</label>
                  <input
                    type="text"
                    placeholder="شخص کا نام..."
                    value={personName}
                    onChange={e => setPersonName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">اضافی نوٹس</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
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
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  ٹرانزیکشن محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOUCHER RECEIPT VIEW & PRINT MODAL */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-right flex flex-col">
            <button
              onClick={() => setSelectedVoucher(null)}
              className="no-print absolute top-4 left-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Voucher Content */}
            <div className="border border-slate-300 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-3">
                  {settings.logoBase64 ? (
                    <img src={settings.logoBase64} alt="لوگو" className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-900 text-amber-400 font-bold flex items-center justify-center">
                      م
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold font-nastaliq text-slate-900">{settings.madrasaNameUrdu}</h3>
                    <p className="text-[10px] text-slate-500 font-sans">{settings.madrasaNameEnglish}</p>
                    <p className="text-[10px] text-slate-600">{settings.address}</p>
                  </div>
                </div>

                <div className="text-left">
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                    selectedVoucher.type === 'آمدن' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedVoucher.type === 'آمدن' ? 'آمدن رسید / کریڈٹ واؤچر' : 'خرچ رسید / ڈیبٹ واؤچر'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-slate-200">
                <div>
                  <span className="text-slate-500">واؤچر نمبر: </span>
                  <span className="font-mono font-bold text-slate-900">{selectedVoucher.receiptVoucherNo}</span>
                </div>
                <div>
                  <span className="text-slate-500">تاریخ: </span>
                  <span className="font-bold text-slate-900">{selectedVoucher.date}</span>
                </div>
                <div>
                  <span className="text-slate-500">کیٹیگری: </span>
                  <span className="font-bold text-slate-900">{selectedVoucher.category}</span>
                </div>
                <div>
                  <span className="text-slate-500">طریقہ ادائیگی: </span>
                  <span className="font-bold text-slate-900">{selectedVoucher.paymentMethod}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">عنوان / تفصیل: </span>
                  <span className="font-bold text-slate-900">{selectedVoucher.title}</span>
                </div>
                {selectedVoucher.personName && (
                  <div className="col-span-2">
                    <span className="text-slate-500">شخص / ادارہ نام: </span>
                    <span className="font-bold text-slate-900">{selectedVoucher.personName}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">کل رقم:</span>
                <span className={`text-xl font-bold font-mono ${
                  selectedVoucher.type === 'آمدن' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatPKR(selectedVoucher.amount)}
                </span>
              </div>

              {selectedVoucher.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                  <span className="font-bold">نوٹس: </span>{selectedVoucher.notes}
                </div>
              )}

              <div className="grid grid-cols-2 pt-6 text-center text-xs text-slate-800">
                <div>
                  <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
                  <span>دستخط وصول کنندہ / دہندہ</span>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
                  <span>دستخط ناظم مالیات / دفتر</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="no-print pt-4 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                پرنٹ واؤچر
              </button>

              <button
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalTrx}
        title="مالیاتی واؤچر ریکارڈ حذف کریں"
        itemName={deleteModalTrx ? `${deleteModalTrx.type}: ${deleteModalTrx.title}` : ''}
        itemDetails={deleteModalTrx ? `واؤچر نمبر: ${deleteModalTrx.receiptVoucherNo} • رقم: ${formatPKR(deleteModalTrx.amount)} • تاریخ: ${deleteModalTrx.date}` : ''}
        message="کیا آپ واقعی اس مالیاتی ٹرانزیکشن کا ریکارڈ ہمیشہ کے لیے حذف کرنا چاہتے ہیں؟"
        onConfirm={confirmDeleteFinance}
        onClose={() => setDeleteModalTrx(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
