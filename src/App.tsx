import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { dbService, INITIAL_SETTINGS } from './services/db';
import {
  Student,
  Teacher,
  AttendanceRecord,
  FeeRecord,
  FinanceTransaction,
  TeacherSalary,
  Subject,
  Exam,
  StudentExamMark,
  MadrasaSettings
} from './types';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';

// Views
import { DashboardView } from './components/views/DashboardView';
import { StudentsView } from './components/views/StudentsView';
import { HifzBranchView } from './components/views/HifzBranchView';
import { TajweedBranchView } from './components/views/TajweedBranchView';
import { DarsNizamiView } from './components/views/DarsNizamiView';
import { TeachersView } from './components/views/TeachersView';
import { TeacherSalaryView } from './components/views/TeacherSalaryView';
import { AttendanceView } from './components/views/AttendanceView';
import { FeeView } from './components/views/FeeView';
import { FinanceView } from './components/views/FinanceView';
import { SubjectsView } from './components/views/SubjectsView';
import { ExamsAndMarksView } from './components/views/ExamsAndMarksView';
import { DMCView } from './components/views/DMCView';
import { GazetteView } from './components/views/GazetteView';
import { StudentIDCardView } from './components/views/StudentIDCardView';
import { SettingsView } from './components/views/SettingsView';
import { BackupRestoreView } from './components/views/BackupRestoreView';
import { WhatsAppCenterView } from './components/views/WhatsAppCenterView';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Selected student when navigating from student table to DMC / ID card
  const [selectedStudentForDoc, setSelectedStudentForDoc] = useState<Student | null>(null);
  const [selectedStudentForWhatsApp, setSelectedStudentForWhatsApp] = useState<Student | null>(null);

  // App Data State
  const [settings, setSettings] = useState<MadrasaSettings>(INITIAL_SETTINGS);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [finance, setFinance] = useState<FinanceTransaction[]>([]);
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [marks, setMarks] = useState<StudentExamMark[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data from IndexedDB
  const refreshAllData = async () => {
    try {
      await dbService.init();
      const [
        loadedSettings,
        loadedStudents,
        loadedTeachers,
        loadedAttendance,
        loadedFees,
        loadedFinance,
        loadedSalaries,
        loadedSubjects,
        loadedExams,
        loadedMarks
      ] = await Promise.all([
        dbService.getSettings(),
        dbService.getAll<Student>('students'),
        dbService.getAll<Teacher>('teachers'),
        dbService.getAll<AttendanceRecord>('attendance'),
        dbService.getAll<FeeRecord>('fees'),
        dbService.getAll<FinanceTransaction>('finance'),
        dbService.getAll<TeacherSalary>('salaries'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<Exam>('exams'),
        dbService.getAll<StudentExamMark>('marks')
      ]);

      setSettings(loadedSettings);
      setStudents(loadedStudents);
      setTeachers(loadedTeachers);
      setAttendance(loadedAttendance);
      setFees(loadedFees);
      setFinance(loadedFinance);
      setSalaries(loadedSalaries);
      setSubjects(loadedSubjects);
      setExams(loadedExams);
      setMarks(loadedMarks);
    } catch (e) {
      console.error('Failed to load database:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen settings={settings} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-naskh">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg">مدرسہ عربیہ مدینۃ العلوم سافٹ ویئر لوڈ ہو رہا ہے...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-naskh text-slate-800">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        {/* Dynamic View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              teachers={teachers}
              attendance={attendance}
              fees={fees}
              finance={finance}
              salaries={salaries}
              settings={settings}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'students' && (
            <StudentsView
              students={students}
              onRefresh={refreshAllData}
              settings={settings}
              attendance={attendance}
              fees={fees}
              exams={exams}
              marks={marks}
              onOpenDMC={(stu) => {
                setSelectedStudentForDoc(stu);
                setActiveTab('dmc');
              }}
              onOpenIDCard={(stu) => {
                setSelectedStudentForDoc(stu);
                setActiveTab('id-cards');
              }}
              onOpenWhatsApp={(stu) => {
                setSelectedStudentForWhatsApp(stu);
                setActiveTab('whatsapp');
              }}
            />
          )}

          {activeTab === 'hifz' && (
            <HifzBranchView
              students={students}
              onRefresh={refreshAllData}
              settings={settings}
            />
          )}

          {activeTab === 'tajweed' && (
            <TajweedBranchView
              students={students}
              onRefresh={refreshAllData}
              settings={settings}
            />
          )}

          {activeTab === 'dars-e-nizami' && (
            <DarsNizamiView
              students={students}
              subjects={subjects}
              onRefresh={refreshAllData}
              settings={settings}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'teachers' && (
            <TeachersView
              teachers={teachers}
              onRefresh={refreshAllData}
              settings={settings}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'teacher-salary' && (
            <TeacherSalaryView
              teachers={teachers}
              salaries={salaries}
              onRefresh={refreshAllData}
              settings={settings}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              students={students}
              attendance={attendance}
              onRefresh={refreshAllData}
              settings={settings}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppCenterView
              students={students}
              teachers={teachers}
              fees={fees}
              attendance={attendance}
              exams={exams}
              marks={marks}
              settings={settings}
              preSelectedStudent={selectedStudentForWhatsApp}
              onClearPreSelectedStudent={() => setSelectedStudentForWhatsApp(null)}
            />
          )}

          {activeTab === 'fees' && (
            <FeeView
              students={students}
              fees={fees}
              onRefresh={refreshAllData}
              settings={settings}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              finance={finance}
              onRefresh={refreshAllData}
              settings={settings}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView
              subjects={subjects}
              onRefresh={refreshAllData}
              settings={settings}
            />
          )}

          {activeTab === 'exams-marks' && (
            <ExamsAndMarksView
              students={students}
              exams={exams}
              subjects={subjects}
              marks={marks}
              onRefresh={refreshAllData}
              settings={settings}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'dmc' && (
            <DMCView
              students={students}
              exams={exams}
              subjects={subjects}
              marks={marks}
              settings={settings}
              preSelectedStudent={selectedStudentForDoc}
            />
          )}

          {activeTab === 'gazette' && (
            <GazetteView
              students={students}
              exams={exams}
              subjects={subjects}
              marks={marks}
              settings={settings}
            />
          )}

          {activeTab === 'id-cards' && (
            <StudentIDCardView
              students={students}
              settings={settings}
              preSelectedStudent={selectedStudentForDoc}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppCenterView
              students={students}
              teachers={teachers}
              fees={fees}
              attendance={attendance}
              exams={exams}
              marks={marks}
              settings={settings}
              preSelectedStudent={selectedStudentForWhatsApp}
              onClearPreSelectedStudent={() => setSelectedStudentForWhatsApp(null)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onRefresh={refreshAllData}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'backup' && (
            <BackupRestoreView onRefresh={refreshAllData} />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
