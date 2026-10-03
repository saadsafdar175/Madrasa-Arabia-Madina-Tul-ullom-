import React, { useState, useRef } from 'react';
import { MadrasaSettings, User } from '../../types';
import { dbService, DEFAULT_MADRASA_LOGO } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Save, 
  CheckCircle2, 
  Image as ImageIcon,
  Building,
  Users,
  ShieldCheck,
  X
} from 'lucide-react';

interface SettingsViewProps {
  settings: MadrasaSettings;
  onRefresh: () => Promise<void>;
  setActiveTab: (tab: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onRefresh,
  setActiveTab
}) => {
  const { role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo States
  const [logoPreview, setLogoPreview] = useState<string>(settings.logoBase64 || DEFAULT_MADRASA_LOGO);
  const [logoModified, setLogoModified] = useState(false);

  // Madrasa Profile Form
  const [formData, setFormData] = useState<MadrasaSettings>({ ...settings });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Open Real Computer File Picker
  const handleBrowseLogo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle selected image file from computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate supported format: PNG, JPG, JPEG, WEBP, SVG
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.svg')) {
        alert('صرف PNG, JPG, JPEG, WEBP یا SVG فائلیں منتخب کریں۔');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('لوگو فائل کا سائز 5MB سے کم ہونا چاہیے۔');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        setLogoPreview(base64Data);
        setLogoModified(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Logo to Persistent Database
  const handleSaveLogo = async () => {
    try {
      await dbService.saveLogo(logoPreview);
      setLogoModified(false);
      setSaveMessage('مدرسہ کا نیا لوگو کامیابی کے ساتھ ڈیٹا بیس میں محفوظ ہو گیا ہے۔ یہ ریفریش اور ری سٹارٹ کے بعد بھی برقرار رہے گا۔');
      setTimeout(() => setSaveMessage(null), 4000);
      await onRefresh();
    } catch (err: any) {
      alert('لوگو محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  // Delete Logo
  const handleDeleteLogo = async () => {
    if (confirm('کیا آپ واقعی مدرسہ کا لوگو حذف کرنا چاہتے ہیں؟')) {
      try {
        await dbService.deleteLogo();
        setLogoPreview('');
        setLogoModified(false);
        setSaveMessage('لوگو حذف کر دیا گیا ہے۔');
        setTimeout(() => setSaveMessage(null), 4000);
        await onRefresh();
      } catch (err: any) {
        alert('لوگو حذف کرنے میں خرابی: ' + err.message);
      }
    }
  };

  // Reset to default logo
  const handleResetDefaultLogo = async () => {
    setLogoPreview(DEFAULT_MADRASA_LOGO);
    await dbService.saveLogo(DEFAULT_MADRASA_LOGO);
    setLogoModified(false);
    setSaveMessage('ڈیفالٹ اسلامی خطاطی لوگو بحال کر دیا گیا ہے۔');
    setTimeout(() => setSaveMessage(null), 4000);
    await onRefresh();
  };

  // Save Madrasa Details
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dbService.saveSettings({
        ...formData,
        logoBase64: logoPreview
      });
      setSaveMessage('مدرسہ کی تمام بنیادی ترتیبات کامیابی سے محفوظ ہو گئیں۔');
      setTimeout(() => setSaveMessage(null), 4000);
      await onRefresh();
    } catch (err: any) {
      alert('ترتیبات محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              ترتیبات، لوگو اور مدرسہ پروفائل (Settings & Logo)
            </h2>
            <p className="text-xs text-slate-500">
              مدرسہ کا لوگو، کمپیوٹر سے منتخب کرنا، محفوظ کرنا، اسناد و رسیدوں کی ترتیبات
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('backup')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          بیک اپ اور بحالی (Backup) ←
        </button>
      </div>

      {saveMessage && (
        <div className="bg-emerald-600 text-white p-3.5 rounded-xl shadow-md text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveMessage}</span>
          </div>
          <button onClick={() => setSaveMessage(null)} className="p-1 hover:bg-black/10 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: LOGO MANAGEMENT (مدرسہ کا لوگو) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900 font-nastaliq">مدرسہ کا لوگو (Logo Management)</h3>
          </div>
          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-bold">
            پائیدار لوکل اسٹوریج (IndexedDB)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Logo Preview Area - Aspect Ratio Preserved, No Stretch */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl min-h-56">
            {logoPreview ? (
              <div className="relative group">
                <img
                  src={logoPreview}
                  alt="مدرسہ کا منتخب لوگو"
                  className="max-w-44 max-h-44 object-contain rounded-xl shadow-sm bg-white p-2 border border-slate-200"
                />
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded">
                  پریویو
                </span>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-xs">کوئی لوگو موجود نہیں ہے</p>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              یہ لوگو تمام پرنٹ ایبل اسناد (DMC)، رزلٹ گزٹ، شناختی کارڈ، فیس رسیدوں اور پے سلپ پر ظاہر ہوگا۔
            </p>
          </div>

          {/* Logo Actions and File Picker */}
          <div className="md:col-span-2 space-y-4">
            {/* Hidden Real File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.svg"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-800">لوگو منتخب کرنے کا طریقہ:</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                کمپیوٹر سے کوئی بھی فائل منتخب کرنے کے لیے نیچے <strong>"لوگو منتخب کریں (Browse)"</strong> پر کلک کریں۔ کسی انٹرنیٹ URL کی ضرورت نہیں ہے۔ فائل کا ڈیٹا لوکل ڈیٹا بیس میں خودکار طور پر محفوظ رہے گا اور ریفریش یا کمپیوٹر بند ہونے کے بعد بھی ضائع نہیں ہوگا۔
              </p>
              <div className="flex gap-2 text-[11px] text-slate-500 font-medium">
                <span>سپورٹ شدہ فارمیٹس:</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">PNG</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">JPG / JPEG</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">WEBP</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">SVG</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {/* Browse Button */}
              <button
                type="button"
                onClick={handleBrowseLogo}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
              >
                <Upload className="w-4 h-4" />
                لوگو منتخب کریں (Browse)
              </button>

              {/* Save Logo Button */}
              <button
                type="button"
                onClick={handleSaveLogo}
                disabled={!logoModified && !logoPreview}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition ${
                  logoModified
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                    : 'bg-emerald-700 text-white hover:bg-emerald-800'
                }`}
              >
                <Save className="w-4 h-4" />
                لوگو محفوظ کریں
              </button>

              {/* Change Logo Button */}
              <button
                type="button"
                onClick={handleBrowseLogo}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                لوگو تبدیل کریں
              </button>

              {/* Reset to Beautiful Default Arabic SVG */}
              <button
                type="button"
                onClick={handleResetDefaultLogo}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
              >
                ڈیفالٹ لوگو بحال کریں
              </button>

              {/* Delete Logo Button */}
              {logoPreview && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  لوگو حذف کریں
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MADRASA INFORMATION FORM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900 font-nastaliq">مدرسہ کی بنیادی معلومات و پروفائل</h3>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">مدرسہ کا اردو نام *</label>
              <input
                type="text"
                required
                value={formData.madrasaNameUrdu}
                onChange={e => setFormData({ ...formData, madrasaNameUrdu: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold font-nastaliq text-base text-blue-950 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Madrasa English Name *</label>
              <input
                type="text"
                required
                value={formData.madrasaNameEnglish}
                onChange={e => setFormData({ ...formData, madrasaNameEnglish: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">رجسٹریشن نمبر</label>
              <input
                type="text"
                value={formData.registrationNo}
                onChange={e => setFormData({ ...formData, registrationNo: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">موجودہ تعلیمی سال</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">رابطہ فون نمبرز</label>
              <input
                type="text"
                value={formData.contactPhones}
                onChange={e => setFormData({ ...formData, contactPhones: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">ای میل ایڈریس</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-slate-700 font-medium mb-1">مکمل پتہ و لوکیشن</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">سرپرست / پرنسپل کا نام</label>
              <input
                type="text"
                value={formData.principalName}
                onChange={e => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">مہتمم صاحب کا نام</label>
              <input
                type="text"
                value={formData.mohtamimName}
                onChange={e => setFormData({ ...formData, mohtamimName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">ناظم تعلیمات کا نام</label>
              <input
                type="text"
                value={formData.nazimTaleematName}
                onChange={e => setFormData({ ...formData, nazimTaleematName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              تمام ترتیبات محفوظ کریں
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
