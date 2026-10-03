import React, { useState } from 'react';
import { Subject, BranchType, MadrasaSettings } from '../../types';
import { dbService } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { BookMarked, Plus, Search, Edit, Trash2, Save, X, Printer } from 'lucide-react';
import { ConfirmDeleteModal } from '../ConfirmDeleteModal';

interface SubjectsViewProps {
  subjects: Subject[];
  onRefresh: () => Promise<void>;
  settings: MadrasaSettings;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  onRefresh,
  settings
}) => {
  const { role } = useAuth();
  const canEdit = role === 'admin';

  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteModalSubject, setDeleteModalSubject] = useState<Subject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [branch, setBranch] = useState<BranchType>('درس نظامی');
  const [grade, setGrade] = useState<string>('اولیٰ');

  const [search, setSearch] = useState('');

  const handleOpenNew = () => {
    setEditingSubject(null);
    setName('');
    setCode(`SUB-${String(subjects.length + 1).padStart(2, '0')}`);
    setTotalMarks(100);
    setBranch('درس نظامی');
    setGrade('اولیٰ');
    setShowModal(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setTotalMarks(sub.totalMarks);
    setBranch(sub.branch);
    setGrade(sub.grade);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('مضمون کا نام درج کرنا لازمی ہے۔');
      return;
    }

    try {
      const subjectToSave: Subject = {
        id: editingSubject?.id || `SUB-${Date.now().toString().slice(-4)}`,
        name,
        code,
        totalMarks: Number(totalMarks) || 100,
        branch,
        grade
      };

      await dbService.put('subjects', subjectToSave);
      setShowModal(false);
      await onRefresh();
    } catch (err: any) {
      alert('محفوظ کرنے میں خرابی: ' + err.message);
    }
  };

  const handleDelete = (sub: Subject) => {
    if (!canEdit) return;
    setDeleteModalSubject(sub);
  };

  const confirmDeleteSubject = async () => {
    if (!deleteModalSubject) return;
    setIsDeleting(true);
    try {
      await dbService.delete('subjects', deleteModalSubject.id);
      setDeleteModalSubject(null);
      await onRefresh();
    } catch (err: any) {
      alert('مضمون حذف کرنے میں خرابی: ' + (err.message || 'نامعلوم نقص'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.grade.toLowerCase().includes(search.toLowerCase()) ||
    s.branch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-nastaliq text-slate-800">
              مضامین و درجات کا انتظام (Subject Management)
            </h2>
            <p className="text-xs text-slate-500">
              قرآن مجید، تجوید، نحو، صرف، فقہ، حدیث، ادب وغیرہ کے مضامین اور کل نمبرات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={handleOpenNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              نیا مضمون شامل کریں
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            پرنٹ لسٹ
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="no-print bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="تلاش برائے نام مضمون، کوڈ یا درجہ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3">کوڈ</th>
                <th className="p-3">نام مضمون</th>
                <th className="p-3">شعبہ</th>
                <th className="p-3">درجہ / کلاس</th>
                <th className="p-3">کل نمبرات (Total Marks)</th>
                <th className="p-3 no-print text-center">کارروائی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    کوئی مضمون دستیاب نہیں ملا۔
                  </td>
                </tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-blue-700">{sub.code}</td>
                    <td className="p-3 font-semibold text-slate-900 text-sm">{sub.name}</td>
                    <td className="p-3 text-slate-700">{sub.branch}</td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-md font-medium text-[11px]">
                        {sub.grade}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{sub.totalMarks}</td>
                    <td className="p-3 no-print text-center">
                      {canEdit && (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            title="ترمیم کریں"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            title="حذف کریں"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base font-nastaliq text-slate-900">
                {editingSubject ? 'مضمون کی تفصیلات میں ترمیم' : 'نیا مضمون شامل کریں'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">مضمون کا نام *</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: قرآن مجید، فقہ اسلامی، نحو"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">کوڈ (Subject Code)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">کل نمبرات (Total Marks)</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={500}
                  value={totalMarks}
                  onChange={e => setTotalMarks(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">شعبہ</label>
                <select
                  value={branch}
                  onChange={e => setBranch(e.target.value as BranchType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="حفظ القرآن">حفظ القرآن</option>
                  <option value="تجوید للحفاظ">تجوید للحفاظ</option>
                  <option value="درس نظامی">درس نظامی</option>
                  <option value="ناظرہ قرآن">ناظرہ قرآن</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">درجہ / کلاس</label>
                <input
                  type="text"
                  placeholder="مثلاً: اولیٰ، ثانیہ، تمام درجات"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 border rounded-lg text-slate-700"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  محفوظ کریں
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModalSubject}
        title="مضمون کا ریکارڈ حذف کریں"
        itemName={deleteModalSubject ? `${deleteModalSubject.name} (${deleteModalSubject.code})` : ''}
        itemDetails={deleteModalSubject ? `شعبہ: ${deleteModalSubject.branch} • درجہ: ${deleteModalSubject.grade} • کل نمبرات: ${deleteModalSubject.totalMarks}` : ''}
        message="کیا آپ واقعی اس مضمون کو نصاب سے خارج کرنا چاہتے ہیں؟"
        onConfirm={confirmDeleteSubject}
        onClose={() => setDeleteModalSubject(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
