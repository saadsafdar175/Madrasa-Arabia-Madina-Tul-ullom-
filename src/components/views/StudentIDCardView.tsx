import React, { useState } from 'react';
import { Student, MadrasaSettings } from '../../types';
import { CreditCard, Printer, Search, CheckCircle } from 'lucide-react';

interface StudentIDCardViewProps {
  students: Student[];
  settings: MadrasaSettings;
  preSelectedStudent?: Student | null;
}

export const StudentIDCardView: React.FC<StudentIDCardViewProps> = ({
  students,
  settings,
  preSelectedStudent
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preSelectedStudent?.id || students[0]?.id || ''
  );
  const [search, setSearch] = useState('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.includes(search) ||
    s.fatherName.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              طالب علم شناختی کارڈ (Student ID Card)
            </h2>
            <p className="text-xs text-slate-500">
              مدرسہ کا محفوظ کارڈ مع تصویر، رول نمبر، شعبہ، کیو آر کوڈ اور دفتری تصدیق
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition"
        >
          <Printer className="w-4 h-4" />
          شناختی کارڈ پرنٹ کریں
        </button>
      </div>

      {/* Selector and Search */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-700 font-medium mb-1">طالب علم منتخب کریں</label>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white font-bold"
          >
            {students.map(st => (
              <option key={st.id} value={st.id}>
                {st.fullName} بن {st.fatherName} (رول: {st.rollNo} - {st.branch})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">فہرست میں فوری تلاش</label>
          <input
            type="text"
            placeholder="نام، والد یا رول نمبر..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ID CARD CONTAINER - PRINT READY */}
      <div className="flex flex-col items-center justify-center p-4">
        {selectedStudent ? (
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Front Side of Card */}
            <div 
              className="w-[86mm] h-[54mm] bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 text-white rounded-2xl p-3 shadow-2xl border-2 border-amber-500/50 flex flex-col justify-between relative overflow-hidden shrink-0 print:shadow-none print:border-2 print:border-black"
              style={{ boxSizing: 'border-box' }}
            >
              {/* Subtle watermark pattern */}
              <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center font-nastaliq text-7xl font-bold">
                مدینۃ العلوم
              </div>

              {/* Card Header */}
              <div className="flex items-center gap-2 border-b border-amber-500/40 pb-1.5 relative z-10">
                {settings.logoBase64 ? (
                  <img
                    src={settings.logoBase64}
                    alt="لوگو"
                    className="w-9 h-9 object-contain rounded-full bg-slate-800 border border-amber-400 p-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-900 border border-amber-400 flex items-center justify-center text-amber-400 font-bold text-xs">
                    م
                  </div>
                )}
                <div className="flex-1 text-center">
                  <div className="text-[12px] font-bold font-nastaliq text-amber-400 leading-tight">
                    {settings.madrasaNameUrdu}
                  </div>
                  <div className="text-[7px] text-slate-300 tracking-wider uppercase font-semibold">
                    {settings.madrasaNameEnglish}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex items-center gap-3 py-1 relative z-10">
                {/* Student Photo */}
                <div className="w-16 h-20 rounded-lg bg-slate-800 border-2 border-amber-400 overflow-hidden shrink-0 flex items-center justify-center shadow">
                  {selectedStudent.photoUrl ? (
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white font-bold text-xl">
                      {selectedStudent.fullName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="text-[9px] space-y-0.5 flex-1">
                  <div>
                    <span className="text-slate-400">نام: </span>
                    <strong className="text-amber-300 font-bold text-[11px] font-nastaliq">{selectedStudent.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">والد کا نام: </span>
                    <strong className="text-slate-100">{selectedStudent.fatherName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="text-slate-400">رول نمبر: </span>
                      <strong className="font-mono text-amber-400 font-bold">{selectedStudent.rollNo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">داخلہ: </span>
                      <strong className="font-mono text-slate-200">{selectedStudent.admissionNo}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">شعبہ: </span>
                    <strong className="text-slate-100">{selectedStudent.branch}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">درجہ: </span>
                    <strong className="text-slate-100">{selectedStudent.grade}</strong>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-amber-500/40 pt-1 flex justify-between items-center text-[7.5px] text-slate-300 relative z-10">
                <span>تعلیمی سال: {selectedStudent.academicYear || settings.academicYear}</span>
                <span className="text-amber-400 font-semibold">طالب علم شناختی کارڈ</span>
              </div>
            </div>

            {/* Back Side of Card */}
            <div 
              className="w-[86mm] h-[54mm] bg-white text-slate-900 rounded-2xl p-3 shadow-2xl border-2 border-slate-800 flex flex-col justify-between shrink-0 print:shadow-none print:border-2 print:border-black"
              style={{ boxSizing: 'border-box' }}
            >
              <div className="text-center border-b border-slate-300 pb-1">
                <div className="text-[10px] font-bold text-blue-950 font-nastaliq">ضروری ہدایات برائے طالب علم</div>
              </div>

              <div className="text-[8px] space-y-1 text-slate-700 py-1">
                <p>۱. یہ کارڈ بوقتِ ضرورت مدرسہ میں ہمراہ رکھنا لازمی ہے۔</p>
                <p>۲. کارڈ گم ہونے کی صورت میں فوری طور پر دفتر کو مطلع کریں۔</p>
                <p>۳. ہنگامی رابطہ نمبر: <strong className="font-mono text-slate-900">{selectedStudent.guardianMobile || selectedStudent.mobile}</strong></p>
                <p>۴. پتہ: {selectedStudent.address}</p>
              </div>

              <div className="border-t border-slate-300 pt-1 flex justify-between items-end text-[8px]">
                <div className="text-center">
                  <div className="w-14 border-b border-slate-700 mb-0.5"></div>
                  <span>دستخط مہتمم</span>
                </div>
                <div className="text-center font-bold text-blue-900">
                  {settings.contactPhones}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">کوئی طالب علم منتخب نہیں۔</div>
        )}
      </div>
    </div>
  );
};
