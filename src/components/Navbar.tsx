import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MadrasaSettings, UserRole } from '../types';
import { LogOut, UserCircle, Bell, Search, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  settings: MadrasaSettings;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  globalSearch,
  setGlobalSearch,
  setActiveTab
}) => {
  const { currentUser, role, logout, switchRoleDirect } = useAuth();

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">ایڈمن (مکمل اختیارات)</span>;
      case 'teacher':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">استاد محترم</span>;
      case 'viewer':
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">ناظر (صرف مطالعہ)</span>;
    }
  };

  const todayUrdu = new Intl.DateTimeFormat('ur-PK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Madrasa Title & Logo in Header */}
        <div className="flex items-center gap-3">
          {settings.logoBase64 ? (
            <img
              src={settings.logoBase64}
              alt="لوگو"
              className="w-10 h-10 object-contain rounded-full bg-slate-800 border border-amber-500/50 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-900 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-lg shadow-sm">
              م
            </div>
          )}
          <div>
            <h1 className="text-lg md:text-xl font-bold font-nastaliq text-amber-400 leading-tight">
              {settings.madrasaNameUrdu || 'مدرسہ عربیہ مدینۃ العلوم'}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {settings.madrasaNameEnglish || 'Madrasa Arabia Madina Tul Uloom'} • تعلیمی سال: {settings.academicYear}
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="تلاش کریں (طلبہ، اساتذہ، رول نمبر، CNIC)..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pr-9 pl-4 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-left hidden lg:block">
            <div className="text-xs text-slate-300 font-medium">{todayUrdu}</div>
            <div className="text-[11px] text-amber-400/90">سافٹ ویئر ورژن 2.5</div>
          </div>

          {/* Quick Role Switcher for Testing/Role Validation */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-800/80 border border-slate-700 p-1 rounded-lg text-xs">
            <span className="text-slate-400 px-1 text-[11px]">کردار:</span>
            <button
              onClick={() => switchRoleDirect('admin')}
              className={`px-2 py-0.5 rounded transition ${role === 'admin' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              ایڈمن
            </button>
            <button
              onClick={() => switchRoleDirect('teacher')}
              className={`px-2 py-0.5 rounded transition ${role === 'teacher' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              استاد
            </button>
            <button
              onClick={() => switchRoleDirect('viewer')}
              className={`px-2 py-0.5 rounded transition ${role === 'viewer' ? 'bg-slate-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              ناظر
            </button>
          </div>

          <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-200">{currentUser?.name || 'صارف'}</span>
              {getRoleBadge(role)}
            </div>

            <button
              onClick={logout}
              title="لاگ آؤٹ"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
