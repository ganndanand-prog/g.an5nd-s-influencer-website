import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Database,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PricingPackage } from '../../types/portfolio';
import {
  saveServiceToFirestore,
  deleteServiceFromFirestore,
  seedDefaultServicesToFirestore,
} from '../../utils/firebaseService';

interface AdminServicesTabProps {
  adminServices: PricingPackage[];
  publicFallbackServices: PricingPackage[];
  hasFirestoreServices: boolean;
}

interface ServiceFormState {
  id?: string;
  title: string;
  badge: string;
  priceAmount: string;
  priceNote: string;
  deliverablesText: string;
  timeline: string;
  idealFor: string;
  popular: boolean;
  active: boolean;
  sortOrder: number;
}

const EMPTY_FORM: ServiceFormState = {
  title: '',
  badge: '',
  priceAmount: '',
  priceNote: '',
  deliverablesText: '',
  timeline: '',
  idealFor: '',
  popular: false,
  active: true,
  sortOrder: 0,
};

export const AdminServicesTab: React.FC<AdminServicesTabProps> = ({
  adminServices,
  publicFallbackServices,
  hasFirestoreServices,
}) => {
  const [editingService, setEditingService] = useState<ServiceFormState | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const displayedList = hasFirestoreServices ? adminServices : publicFallbackServices;

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 2500);
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setErrorMsg(null);
    try {
      await seedDefaultServicesToFirestore();
      showNotice('Анхны 3 үйлчилгээний багцыг Firestore өгөгдлийн санд амжилттай хадгаллаа.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Анхны багцууд оруулахад алдаа гарлаа.');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setErrorMsg(null);
    setEditingService({
      ...EMPTY_FORM,
      sortOrder: displayedList.length,
    });
  };

  const openEditModal = (pkg: PricingPackage, index: number) => {
    setIsEditMode(hasFirestoreServices);
    setErrorMsg(null);
    setEditingService({
      id: pkg.id,
      title: pkg.title,
      badge: pkg.badge || '',
      priceAmount: pkg.priceAmount || '',
      priceNote: pkg.priceNote,
      deliverablesText: pkg.deliverables.join('\n'),
      timeline: pkg.timeline,
      idealFor: pkg.idealFor,
      popular: Boolean(pkg.popular),
      active: pkg.active !== false,
      sortOrder: pkg.sortOrder ?? index,
    });
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const deliverables = editingService.deliverablesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (deliverables.length === 0) {
      setErrorMsg('Багцад багтсан ажлуудаас дор хаяж 1 мөр оруулна уу.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await saveServiceToFirestore(
        {
          id: editingService.id,
          title: editingService.title,
          badge: editingService.badge,
          priceAmount: editingService.priceAmount,
          priceNote: editingService.priceNote,
          deliverables,
          timeline: editingService.timeline,
          idealFor: editingService.idealFor,
          popular: editingService.popular,
          active: editingService.active,
          sortOrder: editingService.sortOrder,
        },
        isEditMode
      );
      setEditingService(null);
      showNotice(isEditMode ? 'Үйлчилгээ шинэчлэгдлээ.' : 'Шинэ үйлчилгээ нэмэгдлээ.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Хадгалах үед алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg: PricingPackage, index: number) => {
    if (!hasFirestoreServices) {
      await handleSeedDefaults();
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      await saveServiceToFirestore(
        {
          id: pkg.id,
          title: pkg.title,
          badge: pkg.badge || '',
          priceAmount: pkg.priceAmount || '',
          priceNote: pkg.priceNote,
          deliverables: pkg.deliverables,
          timeline: pkg.timeline,
          idealFor: pkg.idealFor,
          popular: Boolean(pkg.popular),
          active: pkg.active === false,
          sortOrder: pkg.sortOrder ?? index,
        },
        true
      );
      showNotice(pkg.active === false ? 'Үйлчилгээ идэвхжлээ.' : 'Үйлчилгээ нуугдлаа.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Төлөв солиход алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      await deleteServiceFromFirestore(id);
      setConfirmDeleteId(null);
      showNotice('Үйлчилгээ устгагдлаа.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Устгах үед алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Үйлчилгээ ба Reels багцууд
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Вэбсайтын "Үнийн санал & Багцууд" хэсэгт харагдах үйлчилгээнүүдийг эндээс удирдана.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!hasFirestoreServices && (
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              <span>Анхны багцуудыг DB-д оруулах</span>
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Шинэ үйлчилгээ</span>
          </button>
        </div>
      </div>

      {!hasFirestoreServices && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            Одоогоор Firestore дээр үйлчилгээ хадгалагдаагүй байгаа тул вэбсайт дээр анхдагч 3 багц харагдаж байна. Засварлахын тулд анхны багцуудыг DB-д оруулах эсвэл шинэ үйлчилгээ үүсгэнэ үү.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {noticeMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* Services Table */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-4">Үйлчилгээний нэр</th>
                <th className="py-2.5 px-4">Үнийн нөхцөл</th>
                <th className="py-2.5 px-4">Хугацаа</th>
                <th className="py-2.5 px-4">Ажлын тоо</th>
                <th className="py-2.5 px-4">Төлөв</th>
                <th className="py-2.5 px-4 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {displayedList.map((pkg, idx) => (
                <tr key={pkg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{pkg.title}</span>
                      {pkg.popular && (
                        <span className="text-[11px] font-medium text-pink-600 dark:text-pink-400">
                          · Онцлох
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {pkg.badge ? `${pkg.badge} · ` : ''}
                      {pkg.idealFor}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-[260px]">
                    {pkg.priceAmount && (
                      <div className="font-semibold text-slate-900 dark:text-white font-admin-mono tabular-nums">
                        {pkg.priceAmount}
                      </div>
                    )}
                    <div className="text-slate-600 dark:text-slate-300 truncate">
                      {pkg.priceNote}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {pkg.timeline}
                  </td>
                  <td className="py-3.5 px-4 font-admin-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {pkg.deliverables.length} ажил
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(pkg, idx)}
                      disabled={saving}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium cursor-pointer transition-colors ${
                        pkg.active !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {pkg.active !== false ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Идэвхтэй</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Нуусан</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(pkg, idx)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Засах"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {hasFirestoreServices && (
                        confirmDeleteId === pkg.id ? (
                          <div className="inline-flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleDelete(pkg.id)}
                              disabled={saving}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-medium cursor-pointer"
                            >
                              Устгах
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-[11px] cursor-pointer"
                            >
                              Болих
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(pkg.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:border-rose-300 cursor-pointer"
                            title="Устгах"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {isEditMode ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ нэмэх'}
              </h3>
              <button
                onClick={() => setEditingService(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Багцын нэр *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editingService.title}
                    onChange={(e) =>
                      setEditingService({ ...editingService, title: e.target.value })
                    }
                    placeholder="Ж: 1 Reels Контент"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Шошго (Badge)
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={editingService.badge}
                    onChange={(e) =>
                      setEditingService({ ...editingService, badge: e.target.value })
                    }
                    placeholder="Ж: Хамгийн эрэлттэй"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Үнийн дүн (заавал биш)
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={editingService.priceAmount}
                    onChange={(e) =>
                      setEditingService({ ...editingService, priceAmount: e.target.value })
                    }
                    placeholder="Ж: 350,000₮ эсвэл Тохиролцоно"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Гүйцэтгэх хугацаа *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={editingService.timeline}
                    onChange={(e) =>
                      setEditingService({ ...editingService, timeline: e.target.value })
                    }
                    placeholder="Ж: 2-4 хоногт"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Үнийн нөхцөлийн тайлбар *
                </label>
                <input
                  type="text"
                  required
                  maxLength={300}
                  value={editingService.priceNote}
                  onChange={(e) =>
                    setEditingService({ ...editingService, priceNote: e.target.value })
                  }
                  placeholder="Байгууллагын онцлог, цар хүрээнээс хамаарч уян хатан ярилцана"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Хэнд тохиромжтой (Зорилго) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={editingService.idealFor}
                  onChange={(e) =>
                    setEditingService({ ...editingService, idealFor: e.target.value })
                  }
                  placeholder="Ж: Шинэ бүтээгдэхүүн, нээлт, урамшуулал зарлах"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Багцад багтсан ажлууд (мөр бүрт 1 ажил бичнэ үү) *
                </label>
                <textarea
                  rows={5}
                  required
                  value={editingService.deliverablesText}
                  onChange={(e) =>
                    setEditingService({ ...editingService, deliverablesText: e.target.value })
                  }
                  placeholder="1x Брэндийн зорилтот Reels богино бичлэг&#10;Бүтээлч санаа гаргалт & Кино зохиол&#10;Story-доо холбоостой хуваалцах"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 resize-y"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 items-center pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Дараалал
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={editingService.sortOrder}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        sortOrder: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-5">
                  <input
                    type="checkbox"
                    checked={editingService.popular}
                    onChange={(e) =>
                      setEditingService({ ...editingService, popular: e.target.checked })
                    }
                    className="rounded border-slate-300"
                  />
                  <span>Онцлох багц</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-5">
                  <input
                    type="checkbox"
                    checked={editingService.active}
                    onChange={(e) =>
                      setEditingService({ ...editingService, active: e.target.checked })
                    }
                    className="rounded border-slate-300"
                  />
                  <span>Вэбсайт дээр харагдах</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Хадгалах</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
