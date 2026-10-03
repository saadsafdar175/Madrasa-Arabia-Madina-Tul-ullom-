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
  MadrasaSettings,
  User,
  WhatsAppTemplate,
  WhatsAppMessageLog
} from '../types';

const DB_NAME = 'MadrasaMadinaTulUloomDB';
const DB_VERSION = 2;

// Default Calligraphic Arabic / Islamic SVG Logo
export const DEFAULT_MADRASA_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:%231e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:%230f172a;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:%23f59e0b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:%23d97706;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(%23grad)" stroke="url(%23gold)" stroke-width="5" />
  <circle cx="100" cy="100" r="88" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.7"/>
  <!-- Crescent & Star -->
  <path d="M 100 35 A 45 45 0 0 1 125 105 A 40 40 0 1 0 100 35 Z" fill="url(%23gold)" opacity="0.9" />
  <polygon points="122,60 126,67 134,67 127,72 130,80 122,75 115,80 118,72 111,67 119,67" fill="%23ffffff" />
  <!-- Quran Book Shape -->
  <path d="M 60 135 Q 100 120 140 135 L 140 148 Q 100 132 60 148 Z" fill="url(%23gold)" />
  <path d="M 100 125 L 100 152" stroke="%231e3a8a" stroke-width="2" />
  <!-- Text -->
  <text x="100" y="112" font-family="'Noto Naskh Arabic', serif" font-size="14" font-weight="bold" fill="%23ffffff" text-anchor="middle">مدرسہ عربیہ</text>
  <text x="100" y="128" font-family="'Noto Naskh Arabic', serif" font-size="15" font-weight="bold" fill="url(%23gold)" text-anchor="middle">مدینۃ العلوم</text>
  <text x="100" y="172" font-family="sans-serif" font-size="8" font-weight="bold" fill="%23e2e8f0" letter-spacing="1" text-anchor="middle">EST. 1418 H / 1998 M</text>
</svg>`;

export const INITIAL_SETTINGS: MadrasaSettings = {
  madrasaNameUrdu: 'مدرسہ عربیہ مدینۃ العلوم',
  madrasaNameEnglish: 'Madrasa Arabia Madina Tul Uloom',
  registrationNo: 'REG-1422-MDU/PK',
  address: 'قریب جامع مسجد بلال، مین روڈ، بلاک ۳، راولپنڈی / اسلام آباد',
  contactPhones: '0300-1234567 / 051-5551234',
  email: 'info@madinatululoom.edu.pk',
  principalName: 'حضرت مولانا محمد عبد اللہ صاحب مدظلہ',
  mohtamimName: 'مولانا قاری محمد سعید صاحب',
  nazimTaleematName: 'مفتی عبدالرحمن صاحب',
  logoBase64: DEFAULT_MADRASA_LOGO,
  academicYear: '1446-1447ھ / 2025-2026ء'
};

const SEED_USERS: User[] = [
  { id: 'u1', username: 'admin', name: 'مولانا منتظم اعلیٰ (ایڈمن)', role: 'admin', phone: '0300-1112233' },
  { id: 'u2', username: 'teacher', name: 'قاری عبد السمیع (استاد محترم)', role: 'teacher', phone: '0312-3334455' },
  { id: 'u3', username: 'viewer', name: 'ناظر و مبصر (صرف مطالعہ)', role: 'viewer', phone: '0321-5556677' }
];

const SEED_SUBJECTS: Subject[] = [
  { id: 'SUB-01', name: 'قرآن مجید (ناظرہ و حفظ)', code: 'QRN-01', totalMarks: 100, branch: 'حفظ القرآن', grade: 'تمام درجات' },
  { id: 'SUB-02', name: 'تجوید القرآن و ترتیل', code: 'TJW-02', totalMarks: 100, branch: 'تجوید للحفاظ', grade: 'تمام درجات' },
  { id: 'SUB-03', name: 'قواعد النحو', code: 'NAH-03', totalMarks: 100, branch: 'درس نظامی', grade: 'اولیٰ' },
  { id: 'SUB-04', name: 'علم الصرف', code: 'SARF-04', totalMarks: 100, branch: 'درس نظامی', grade: 'اولیٰ' },
  { id: 'SUB-05', name: 'فقہ اسلامی (قدوری / نور الایضاح)', code: 'FIQH-05', totalMarks: 100, branch: 'درس نظامی', grade: 'اولیٰ' },
  { id: 'SUB-06', name: 'ترجمۃ القرآن الکریم', code: 'TARJ-06', totalMarks: 100, branch: 'درس نظامی', grade: 'ثانیہ' },
  { id: 'SUB-07', name: 'عربی ادب (طریقۃ العصریہ / قصص النبیین)', code: 'ARB-07', totalMarks: 100, branch: 'درس نظامی', grade: 'اولیٰ' },
  { id: 'SUB-08', name: 'عقائد و اخلاق', code: 'AQA-08', totalMarks: 100, branch: 'درس نظامی', grade: 'اولیٰ' }
];

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'TPL-01',
    title: 'فیس بقایا یاد دہانی (Fee Reminder)',
    type: 'فیس یاد دہانی',
    message: `محترم {father_name} صاحب!
السلام علیکم ورحمۃ اللہ وبرکاتہ

امید ہے آپ بخیر ہوں گے۔ آپ کے فرزند {student_name} (کلاس: {class}) کی ماہانہ فیس برائے بقایا جات مبلغ {fee_amount} تاحال واجب الادا ہے۔
برائے مہربانی دفتر مدرسہ میں فیس جمع کروا کر رسید حاصل فرمائیں۔

شکریہ،
Madrasa Arabia Madina Tul Uloom`,
    isDefault: true
  },
  {
    id: 'TPL-02',
    title: 'غیر حاضری کی اطلاع (Absence Notice)',
    type: 'غیر حاضری اطلاع',
    message: `محترم {father_name} صاحب!
السلام علیکم ورحمۃ اللہ وبرکاتہ

مطلع کیا جاتا ہے کہ آپ کا بچہ {student_name} (کلاس: {class}) آج تاریخ {date} کو مدرسہ میں غیر حاضر رہا ہے۔
براہِ کرم غیر حاضری کی وجہ سے دفتر مدرسہ کو مطلع فرمائیں۔

شکریہ،
Madrasa Arabia Madina Tul Uloom`,
    isDefault: true
  },
  {
    id: 'TPL-03',
    title: 'امتحانی نتیجہ اطلاع (Exam Result)',
    type: 'امتحانی نتیجہ',
    message: `محترم {father_name} صاحب!
السلام علیکم ورحمۃ اللہ وبرکاتہ

مبارک ہو! آپ کے فرزند {student_name} (کلاس: {class}) کا امتحانی نتیجہ آ چکا ہے:
نتیجہ: {result}

تفصیلی سند و رپورٹ کارڈ کے لیے دفتر مدرسہ سے رابطہ کریں۔

شکریہ،
Madrasa Arabia Madina Tul Uloom`,
    isDefault: true
  },
  {
    id: 'TPL-04',
    title: 'عام تعطیل یا اہم اعلان (General Notice)',
    type: 'عام اعلان',
    message: `محترم والدین و سرپرست کرام!
السلام علیکم ورحمۃ اللہ وبرکاتہ

اطلاع دی جاتی ہے کہ تاریخ {date} کو مدرسہ میں تعلیمی سرگرمیاں حسبِ ضابطہ معطل رہیں گی۔
مزید معلومات کے لیے دفتری اوقات میں رابطہ کیا جا سکتا ہے۔

شکریہ،
Madrasa Arabia Madina Tul Uloom`,
    isDefault: true
  }
];

// Open and Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      const stores = [
        'students',
        'teachers',
        'attendance',
        'fees',
        'finance',
        'salaries',
        'subjects',
        'exams',
        'marks',
        'settings',
        'users',
        'whatsapp_templates',
        'whatsapp_logs'
      ];

      for (const store of stores) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
  });
}

// Database helper functions with fallback and seed auto-initialization
class DatabaseService {
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const db = await openDB();
      const tx = db.transaction(['settings', 'students', 'teachers', 'users', 'subjects', 'exams', 'marks', 'attendance', 'fees', 'finance', 'salaries', 'whatsapp_templates', 'whatsapp_logs'], 'readwrite');
      
      const settingsStore = tx.objectStore('settings');
      const settingsReq = settingsStore.get('main');
      
      settingsReq.onsuccess = () => {
        if (!settingsReq.result) {
          // Initialize default system settings & accounts only
          settingsStore.put({ id: 'main', ...INITIAL_SETTINGS });

          const usersStore = tx.objectStore('users');
          SEED_USERS.forEach(u => usersStore.put(u));

          const subjectsStore = tx.objectStore('subjects');
          SEED_SUBJECTS.forEach(sub => subjectsStore.put(sub));
        }
      };

      // Check default WhatsApp templates
      const tplStore = tx.objectStore('whatsapp_templates');
      const tplReq = tplStore.getAll();
      tplReq.onsuccess = () => {
        if (!tplReq.result || tplReq.result.length === 0) {
          DEFAULT_WHATSAPP_TEMPLATES.forEach(tpl => tplStore.put(tpl));
        }
      };

      await new Promise<void>((resolve) => {
        tx.oncomplete = () => {
          resolve();
        };
        tx.onerror = () => resolve(); // continue even if error
      });

      // One-time purge check to ensure any previously loaded demo/test records are completely wiped
      if (typeof window !== 'undefined' && localStorage.getItem('mm_clean_production_ready_v2') !== 'true') {
        await this.clearAllTransactionalData();
        localStorage.setItem('mm_clean_production_ready_v2', 'true');
      }

      this.initialized = true;
    } catch (e) {
      console.warn('IndexedDB init warning, using local fallback:', e);
      this.initLocalStorageFallback();
      this.initialized = true;
    }
  }

  private initLocalStorageFallback() {
    if (!localStorage.getItem('mm_settings')) {
      localStorage.setItem('mm_settings', JSON.stringify({ id: 'main', ...INITIAL_SETTINGS }));
      localStorage.setItem('mm_users', JSON.stringify(SEED_USERS));
      localStorage.setItem('mm_subjects', JSON.stringify(SEED_SUBJECTS));
      localStorage.setItem('mm_students', JSON.stringify([]));
      localStorage.setItem('mm_teachers', JSON.stringify([]));
      localStorage.setItem('mm_exams', JSON.stringify([]));
      localStorage.setItem('mm_marks', JSON.stringify([]));
      localStorage.setItem('mm_attendance', JSON.stringify([]));
      localStorage.setItem('mm_fees', JSON.stringify([]));
      localStorage.setItem('mm_finance', JSON.stringify([]));
      localStorage.setItem('mm_salaries', JSON.stringify([]));
      localStorage.setItem('mm_whatsapp_templates', JSON.stringify(DEFAULT_WHATSAPP_TEMPLATES));
      localStorage.setItem('mm_whatsapp_logs', JSON.stringify([]));
    }
  }

  // Clear all demo/sample/test records while keeping Settings, Users & Curriculum
  public async clearAllTransactionalData(): Promise<void> {
    const storesToClear = [
      'students',
      'teachers',
      'attendance',
      'fees',
      'finance',
      'salaries',
      'exams',
      'marks'
    ];

    try {
      const db = await openDB();
      const tx = db.transaction(storesToClear, 'readwrite');
      for (const store of storesToClear) {
        tx.objectStore(store).clear();
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Error clearing IndexedDB stores, clearing local storage:', err);
    }

    for (const store of storesToClear) {
      localStorage.removeItem(`mm_${store}`);
      localStorage.setItem(`mm_${store}`, JSON.stringify([]));
    }
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const fallback = localStorage.getItem(`mm_${storeName}`);
      return fallback ? JSON.parse(fallback) : [];
    }
  }

  public async getById<T>(storeName: string, id: string): Promise<T | null> {
    await this.init();
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getAll<any>(storeName);
      return list.find(item => item.id === id) || null;
    }
  }

  public async put<T extends { id: string }>(storeName: string, item: T): Promise<T> {
    await this.init();
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // LocalStorage fallback
    }

    // Keep localStorage synced for redundancy
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`mm_${storeName}`);
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) {
          const index = list.findIndex(i => i.id === item.id);
          if (index >= 0) {
            list[index] = item;
          } else {
            list.push(item);
          }
          localStorage.setItem(`mm_${storeName}`, JSON.stringify(list));
        }
      } catch {}
    }
    return item;
  }

  public async delete(storeName: string, id: string): Promise<void> {
    await this.init();
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // LocalStorage fallback handled below
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`mm_${storeName}`);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const filtered = list.filter(i => i.id !== id);
            localStorage.setItem(`mm_${storeName}`, JSON.stringify(filtered));
          }
        }
      } catch {}
    }
  }

  // Settings & Logo specific
  public async getSettings(): Promise<MadrasaSettings> {
    const record = await this.getById<any>('settings', 'main');
    if (record) {
      return { ...INITIAL_SETTINGS, ...record };
    }
    return INITIAL_SETTINGS;
  }

  public async saveSettings(settings: Partial<MadrasaSettings>): Promise<MadrasaSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings, id: 'main' };
    await this.put('settings', updated);
    return updated;
  }

  public async saveLogo(logoBase64: string): Promise<void> {
    const current = await this.getSettings();
    current.logoBase64 = logoBase64;
    await this.put('settings', { ...current, id: 'main' });
  }

  public async deleteLogo(): Promise<void> {
    const current = await this.getSettings();
    current.logoBase64 = '';
    await this.put('settings', { ...current, id: 'main' });
  }

  // Backup & Restore
  public async exportFullBackup(): Promise<string> {
    const stores = [
      'students',
      'teachers',
      'attendance',
      'fees',
      'finance',
      'salaries',
      'subjects',
      'exams',
      'marks',
      'settings',
      'users',
      'whatsapp_templates',
      'whatsapp_logs'
    ];

    const backupData: Record<string, any> = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      madrasaName: 'Madrasa Arabia Madina Tul Uloom',
      data: {}
    };

    for (const store of stores) {
      backupData.data[store] = await this.getAll(store);
    }

    return JSON.stringify(backupData, null, 2);
  }

  public async importFullRestore(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
        return { success: false, message: 'غلط فائل فارمیٹ! درست بیک اپ فائل منتخب کریں۔' };
      }

      const stores = [
        'students',
        'teachers',
        'attendance',
        'fees',
        'finance',
        'salaries',
        'subjects',
        'exams',
        'marks',
        'settings',
        'users',
        'whatsapp_templates',
        'whatsapp_logs'
      ];

      for (const store of stores) {
        if (Array.isArray(parsed.data[store])) {
          for (const item of parsed.data[store]) {
            if (item && item.id) {
              await this.put(store, item);
            }
          }
        }
      }

      return { success: true, message: 'ڈیٹا کامیابی کے ساتھ بحال (Restore) کر دیا گیا ہے۔' };
    } catch (err: any) {
      return { success: false, message: 'بیک اپ فائل پڑھنے میں خرابی: ' + (err.message || 'نامعلوم غلطی') };
    }
  }
}

export const dbService = new DatabaseService();
