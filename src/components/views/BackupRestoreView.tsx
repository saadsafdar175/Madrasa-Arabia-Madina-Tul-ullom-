import React, { useState, useRef } from 'react';
import { dbService } from '../../services/db';
import { DatabaseBackup, Download, Upload, CheckCircle2, AlertTriangle, ShieldCheck, FileJson, X, Trash2, RefreshCw } from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface BackupRestoreViewProps {
  onRefresh: () => Promise<void>;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ onRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Clear all sample / demo / entry records for fresh entry
  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await dbService.clearAllTransactionalData();
      setStatus({
        message: 'تمام پرانے ریکارڈز (طلبہ، اساتذہ، حاضری، فیس، آمدن، اخراجات، تنخواہیں اور امتحانات) کامیابی سے صاف کر دیے گئے ہیں۔ سافٹ ویئر اب نئی ڈیٹا انٹری کے لیے بالکل تیار ہے۔',
        type: 'success'
      });
      setShowClearDataModal(false);
      await onRefresh();
    } catch (err: any) {
      setStatus({
        message: 'ڈیٹا صاف کرنے میں خرابی: ' + err.message,
        type: 'error'
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Export full JSON Backup
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const jsonString = await dbService.exportFullBackup();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `Madrasa_Madina_Tul_Uloom_Backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({
        message: 'تمام ڈیٹا (طلبہ، اساتذہ، حاضری، فیس، امتحانات، نمبرات اور لوگو) کی بیک اپ فائل کامیابی سے ڈاؤن لوڈ ہو گئی ہے۔',
        type: 'success'
      });
    } catch (err: any) {
      setStatus({
        message: 'بیک اپ بنانے میں خرابی: ' + err.message,
        type: 'error'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Trigger File Input for Restore
  const handleTriggerRestore = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process Selected Backup JSON File
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setStatus({
        message: 'غلط فائل فارمیٹ! صرف .json بیک اپ فائل منتخب کریں۔',
        type: 'error'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsImporting(true);
      try {
        const content = event.target?.result as string;
        const result = await dbService.importFullRestore(content);
        if (result.success) {
          setStatus({
            message: result.message,
            type: 'success'
          });
          await onRefresh();
        } else {
          setStatus({
            message: result.message,
            type: 'error'
          });
        }
      } catch (err: any) {
        setStatus({
          message: 'ڈیٹا بحال کرنے میں خرابی: ' + err.message,
          type: 'error'
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <DatabaseBackup className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              ڈیٹا بیک اپ اور بحالی (Backup & Restore)
            </h2>
            <p className="text-xs text-slate-500">
              مدرسہ کے تمام ریکارڈز کو کمپیوٹر پر محفوظ کریں اور بوقتِ ضرورت دوبارہ بحال کریں
            </p>
          </div>
        </div>
      </div>

      {status && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md text-xs font-semibold ${
            status.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{status.message}</span>
          </div>
          <button onClick={() => setStatus(null)} className="p-1 hover:bg-black/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-nastaliq">مکمل بیک اپ ڈاؤن لوڈ کریں (Export)</h3>
              <p className="text-xs text-slate-500">فائل فارمیٹ: JSON</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            اس بٹن پر کلک کرنے سے مدرسہ عربیہ مدینۃ العلوم کا تمام ڈیٹا بیس ایک معیاری JSON فائل میں ایکسپورٹ ہو جائے گا۔ اس میں درج ذیل ریکارڈز شامل ہوں گے:
          </p>

          <ul className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <li>✓ تمام طلبہ اور تفصیلات</li>
            <li>✓ اساتذہ اور CNIC ریکارڈز</li>
            <li>✓ حاضری کی تمام تاریخیں</li>
            <li>✓ فیس کی وصولیاں و بقایا جات</li>
            <li>✓ آمدن و اخراجات کا لیجر</li>
            <li>✓ اساتذہ کی تنخواہیں و سلپس</li>
            <li>✓ امتحانات اور تفصیلی نمبرات</li>
            <li>✓ مدرسہ کا لوگو اور ترتیبات</li>
          </ul>

          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'بیک اپ تیار ہو رہا ہے...' : 'بیک اپ فائل ڈاؤن لوڈ کریں'}
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-nastaliq">بیک اپ بحال کریں (Restore / Import)</h3>
              <p className="text-xs text-slate-500">کمپیوٹر سے JSON فائل منتخب کریں</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            اگر آپ نے پہلے سے کوئی بیک اپ محفوظ کیا ہوا ہے یا دوسرے کمپیوٹر سے ڈیٹا منتقل کرنا چاہتے ہیں تو نیچے کلک کریں۔
          </p>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p>
              <strong>محفوظ بحالی پروٹیکشن:</strong> سافٹ ویئر بحالی سے قبل فائل کی جانچ کرے گا۔ اگر فائل خراب ہوئی تو موجودہ ڈیٹا ضائع نہیں ہوگا۔
            </p>
          </div>

          <div className="pt-6">
            <button
              onClick={handleTriggerRestore}
              disabled={isImporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'ڈیٹا بحال کیا جا رہا ہے...' : 'بیک اپ فائل منتخب کریں اور بحال کریں'}
            </button>
          </div>
        </div>
      </div>

      {/* Clear All Data Section for Fresh Data Entry */}
      <div className="bg-red-50/60 border border-red-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-red-900 font-nastaliq">پرانا / ٹیسٹ ڈیٹا صاف کریں (Clear Data for Fresh Entry)</h3>
            <p className="text-xs text-red-600">نئی اصل انٹریز درج کرنے کے لیے تمام پرانے ریکارڈز کو ایک کلک میں خالی کریں</p>
          </div>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          اس عمل سے طلبہ، اساتذہ، حاضری، فیس، آمدن، اخراجات، تنخواہیں اور امتحانات کا تمام ڈیمو اور ٹیسٹ ڈیٹا مکمل طور پر حذف ہو جائے گا تاکہ آپ تازہ اور حقیقی ریکارڈز درج کر سکیں۔
          <strong> نوٹ:</strong> مدرسہ کا نام، ترتیبات، لوگو اور ایڈمن لاگ ان اکاؤنٹ محفوظ رہیں گے۔
        </p>

        <div className="pt-2">
          <button
            onClick={() => setShowClearDataModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-red-500/20 flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            تمام ٹرانزیکشنل ڈیٹا صاف کریں (Clear All Test Records)
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showClearDataModal}
        title="تمام ٹرانزیکشنل ڈیٹا صاف کرنے کی تصدیق"
        itemName="طلبہ، اساتذہ، حاضری، فیس، آمدن، اخراجات، تنخواہیں اور امتحانات"
        itemDetails="تمام پرانے اور ڈیمو ریکارڈز ڈیٹا بیس سے مکمل خارج کر دیے جائیں گے"
        message="کیا آپ واقعی تمام ٹرانزیکشنل ڈیٹا کو مکمل طور پر خالی کرنا چاہتے ہیں؟ اس عمل کے بعد سافٹ ویئر بالکل خالی جدولوں کے ساتھ نئی اصل انٹریز کے لیے تیار ہو جائے گا۔"
        onConfirm={handleClearAllData}
        onClose={() => setShowClearDataModal(false)}
        isLoading={isClearing}
      />
    </div>
  );
};
