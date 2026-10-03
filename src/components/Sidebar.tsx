import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Award,
  GraduationCap,
  Briefcase,
  DollarSign,
  CalendarCheck,
  MessageSquare,
  Receipt,
  Wallet,
  BookMarked,
  FileSpreadsheet,
  FileCheck2,
  FileText,
  CreditCard,
  Settings,
  DatabaseBackup,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen
}) => {
  const { role } = useAuth();

  const menuSections = [
    {
      title: 'مرکزی مینیو',
      items: [
        { id: 'dashboard', label: 'ڈیش بورڈ', icon: LayoutDashboard, roles: ['admin', 'teacher', 'viewer'] },
      ]
    },
    {
      title: 'طلبہ و شعبہ جات',
      items: [
        { id: 'students', label: 'طلبہ کا اندراج و ریکارڈ', icon: Users, roles: ['admin', 'teacher', 'viewer'] },
        { id: 'hifz', label: 'شعبہ حفظ القرآن', icon: BookOpen, roles: ['admin', 'teacher', 'viewer'] },
        { id: 'tajweed', label: 'شعبہ تجوید للحفاظ', icon: Award, roles: ['admin', 'teacher', 'viewer'] },
        { id: 'dars-e-nizami', label: 'شعبہ درس نظامی', icon: GraduationCap, roles: ['admin', 'teacher', 'viewer'] },
      ]
    },
    {
      title: 'اساتذہ و حاضری',
      items: [
        { id: 'teachers', label: 'اساتذہ کا انتظام', icon: Briefcase, roles: ['admin', 'viewer'] },
        { id: 'attendance', label: 'حاضری ریکارڈ', icon: CalendarCheck, roles: ['admin', 'teacher', 'viewer'] },
        { id: 'whatsapp', label: 'واٹس ایپ سینٹر (WhatsApp)', icon: MessageSquare, roles: ['admin', 'teacher', 'viewer'] },
      ]
    },
    {
      title: 'امتحانات و اسناد',
      items: [
        { id: 'subjects', label: 'مضامین و نصاب', icon: BookMarked, roles: ['admin', 'teacher', 'viewer'] },
        { id: 'exams-marks', label: 'امتحانات و نمبرات', icon: FileSpreadsheet, roles: ['admin', 'teacher', 'viewer'] },
        { id: 'dmc', label: 'تفصیلی نمبرات سند (DMC)', icon: FileCheck2, roles: ['admin', 'teacher', 'viewer'] },
        { id: 'gazette', label: 'رزلٹ گزٹ (A4 رپورٹ)', icon: FileText, roles: ['admin', 'teacher', 'viewer'] },
        { id: 'id-cards', label: 'طالب علم شناختی کارڈ', icon: CreditCard, roles: ['admin', 'teacher', 'viewer'] },
      ]
    },
    {
      title: 'مالیات و اکاؤنٹس',
      items: [
        { id: 'fees', label: 'فیس مینجمنٹ و رسید', icon: Receipt, roles: ['admin', 'viewer'] },
        { id: 'teacher-salary', label: 'اساتذہ کی تنخواہیں و سلپ', icon: DollarSign, roles: ['admin'] },
        { id: 'finance', label: 'آمدن و اخراجات (مالیات)', icon: Wallet, roles: ['admin', 'viewer'] },
      ]
    },
    {
      title: 'انتظامیہ و ترتیبات',
      items: [
        { id: 'settings', label: 'مدرسہ کا لوگو و ترتیبات', icon: Settings, roles: ['admin'] },
        { id: 'backup', label: 'بیک اپ اور بحالی', icon: DatabaseBackup, roles: ['admin'] },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="no-print lg:hidden fixed bottom-4 left-4 z-50 bg-blue-700 text-white p-3 rounded-full shadow-xl focus:outline-none"
        aria-label="مینیو کھولیں"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="no-print lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`no-print fixed lg:static top-0 bottom-0 right-0 z-40 w-64 bg-slate-900 border-l border-slate-800 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Madrasa Brand Emblem */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-base">
              ☪
            </div>
            <div>
              <span className="font-bold text-white text-sm block">مدینۃ العلوم ایڈمن</span>
              <span className="text-[11px] text-amber-400">سافٹ ویئر کنٹرول پینل</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 text-sm">
          {menuSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-right transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white font-medium shadow-sm shadow-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center text-xs text-slate-400">
          <div>مدرسہ عربیہ مدینۃ العلوم</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">آف لائن لوکل ڈیٹا محفوظ ہے</div>
        </div>
      </aside>
    </>
  );
};
