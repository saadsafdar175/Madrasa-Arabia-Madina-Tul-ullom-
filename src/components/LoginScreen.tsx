import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MadrasaSettings, UserRole } from '../types';
import { Lock, User as UserIcon, Shield, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface LoginScreenProps {
  settings: MadrasaSettings;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ settings }) => {
  const { login, switchRoleDirect } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(username, password, remember);
      if (!res.success) {
        setError(res.message || 'لاگ ان کرنے میں خرابی پیش آئی۔');
      }
    } catch (err: any) {
      setError('نامعلوم خرابی: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userRole: UserRole) => {
    switchRoleDirect(userRole);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-right font-naskh">
      {/* Background Decorative Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-8 backdrop-blur-md relative z-10 text-white space-y-6">
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 border-2 border-amber-500/60 p-1 flex items-center justify-center shadow-lg">
            {settings.logoBase64 ? (
              <img
                src={settings.logoBase64}
                alt="لوگو"
                className="w-full h-full object-contain rounded-full"
              />
            ) : (
              <span className="text-2xl font-bold font-nastaliq text-amber-400">م</span>
            )}
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-bold font-nastaliq text-amber-400 leading-snug">
              {settings.madrasaNameUrdu}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">
              {settings.madrasaNameEnglish}
            </p>
          </div>

          <div className="inline-block bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs px-3 py-1 rounded-full font-medium">
            جامع دفتری انتظامی سافٹ ویئر
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              صارف کا نام (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin, teacher, viewer..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white pr-9 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              پاس ورڈ (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="پاس ورڈ درج کریں..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white pr-9 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-800 border-slate-700"
              />
              <span>سیشن یاد رکھیں (Remember Session)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/30 transition flex items-center justify-center gap-2"
          >
            {loading ? 'تصدیق ہو رہی ہے...' : 'لاگ ان کریں (Sign In)'}
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Role Selection for Instant Evaluation */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <span className="text-[11px] text-slate-400 block text-center">
            فوری ٹیسٹنگ کے لیے کردار (Role) منتخب کریں:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 p-2 rounded-xl text-xs font-semibold transition text-center"
            >
              ایڈمن (Admin)
              <span className="block text-[9px] text-slate-400 mt-0.5">مکمل کنٹرول</span>
            </button>
            <button
              onClick={() => handleQuickLogin('teacher')}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 p-2 rounded-xl text-xs font-semibold transition text-center"
            >
              استاد (Teacher)
              <span className="block text-[9px] text-slate-400 mt-0.5">حاضری و امتحانات</span>
            </button>
            <button
              onClick={() => handleQuickLogin('viewer')}
              className="bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 border border-slate-600/40 p-2 rounded-xl text-xs font-semibold transition text-center"
            >
              ناظر (Viewer)
              <span className="block text-[9px] text-slate-400 mt-0.5">صرف مطالعہ</span>
            </button>
          </div>
        </div>

        {/* Local Offline Notice */}
        <div className="text-center text-[10px] text-slate-500 pt-2">
          مدرسہ عربیہ مدینۃ العلوم • تمام ڈیٹا آپ کے براؤزر کے محفوظ لوکل ڈیٹا بیس میں محفوظ ہے۔
        </div>
      </div>
    </div>
  );
};
