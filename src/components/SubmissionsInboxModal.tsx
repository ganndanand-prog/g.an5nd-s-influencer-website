import React, { useState } from 'react';
import {
  X,
  Inbox,
  Mail,
  PhoneCall,
  Copy,
  Check,
  Trash2,
  Download,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Database,
  LogIn,
  LogOut,
  ShieldCheck,
  Activity,
  Loader2,
} from 'lucide-react';
import {
  SubmissionItem,
  exportSubmissionsCSV,
} from '../utils/submissionsStorage';
import {
  updateSubmissionStatusInFirestore,
  deleteSubmissionFromFirestore,
  deleteContactActionFromFirestore,
} from '../utils/firebaseService';
import { useFirebase } from '../contexts/FirebaseContext';
import { RECIPIENT_EMAIL } from '../utils/emailSender';
import { ADMIN_EMAILS } from '../firebase';

interface SubmissionsInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubmissionsInboxModal: React.FC<SubmissionsInboxModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    user,
    authReady,
    isAdmin,
    authError,
    submissions,
    contactActions,
    firestoreLoading,
    firestoreError,
    signInWithGoogle,
    signOutUser,
  } = useFirebase();

  const [filterType, setFilterType] = useState<'all' | 'collaboration' | 'contact' | 'actions'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (id: string, current: SubmissionItem['status']) => {
    const nextStatus: SubmissionItem['status'] = current === 'new' ? 'contacted' : 'new';
    setBusyId(id);
    setActionError(null);
    try {
      await updateSubmissionStatusInFirestore(id, nextStatus);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Төлөв шинэчлэх үед алдаа гарлаа.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await deleteSubmissionFromFirestore(id);
      setConfirmDeleteId(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Устгах үед алдаа гарлаа.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteAction = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await deleteContactActionFromFirestore(id);
      setConfirmDeleteId(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Үйлдлийн бүртгэл устгах үед алдаа гарлаа.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (filterType === 'collaboration') return s.type === 'collaboration';
    if (filterType === 'contact') return s.type === 'contact';
    return true;
  });

  const newCount = submissions.filter((s) => s.status === 'new').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Firebase Хүсэлтүүд & Зурвасууд
                </h3>
                {isAdmin && newCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[11px] font-bold">
                    {newCount} шинэ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Вэбсайтын бүх хүсэлт, зурвас болон холбоо барих үйлдлүүд Firebase Firestore өгөгдлийн санд бодит цагаар хадгалагдана.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && submissions.length > 0 && (
              <button
                onClick={() => exportSubmissionsCSV(submissions)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Excel / CSV татах"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV татах</span>
              </button>
            )}

            {user && (
              <button
                onClick={signOutUser}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                title="Гарах"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Гарах</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Хаах"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate & Content */}
        {!authReady ? (
          <div className="flex-1 py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
            <p className="text-sm font-medium">Firebase холболт шалгаж байна...</p>
          </div>
        ) : !user ? (
          <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/30 text-sky-500 flex items-center justify-center mb-5">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              Админ эрхээр нэвтрэх
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
              Хэрэглэгчдийн хувийн мэдээлэл (утас, имэйл, төсөв)-ийг хамгаалах зорилгоор Firebase өгөгдлийн сан дахь бүх хүсэлт, зурвасыг зөвхөн админ Google бүртгэлээрээ нэвтэрч харна.
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 max-w-md">
                {authError}
              </div>
            )}

            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-lg hover:opacity-90 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Google-ээр нэвтрэх</span>
            </button>
          </div>
        ) : !isAdmin ? (
          <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
              Хандах эрх хүрэлцэхгүй байна
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
              Та одоогоор <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span> хаягаар нэвтэрсэн байна. Firebase өгөгдлийн сангийн хүсэлтүүдийг зөвхөн админ ({ADMIN_EMAILS[0]}) харах эрхтэй.
            </p>
            <button
              onClick={signOutUser}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Өөр бүртгэлээр нэвтрэх</span>
            </button>
          </div>
        ) : (
          <>
            {/* Filter bar & Actions */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Бүгд ({submissions.length})
                </button>

                <button
                  onClick={() => setFilterType('collaboration')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'collaboration'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Хамтын ажиллагаа ({submissions.filter((s) => s.type === 'collaboration').length})
                </button>

                <button
                  onClick={() => setFilterType('contact')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'contact'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  Шууд зурвас ({submissions.filter((s) => s.type === 'contact').length})
                </button>

                <button
                  onClick={() => setFilterType('actions')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filterType === 'actions'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Үйлдлийн түүх ({contactActions.length})</span>
                </button>
              </div>

              {submissions.length > 0 && (
                <button
                  onClick={() => exportSubmissionsCSV(submissions)}
                  className="sm:hidden inline-flex items-center gap-1 text-xs text-sky-600 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              )}
            </div>

            {/* Error Banners */}
            {(firestoreError || actionError) && (
              <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError || firestoreError}</span>
              </div>
            )}

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {firestoreLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-sky-500 mb-2" />
                  <span className="text-xs">Firebase-аас өгөгдөл татаж байна...</span>
                </div>
              ) : filterType === 'actions' ? (
                contactActions.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Үйлдлийн түүх хоосон байна
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      Хэрэглэгчид вэбсайт дээр утас дарах, хуулах, багц сонгох эсвэл хүсэлт илгээх үед энд бүртгэгдэнэ.
                    </p>
                  </div>
                ) : (
                  contactActions.map((act) => (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {act.label}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 font-mono">
                              {act.actionType}
                            </span>
                            <span>Хэсэг: {act.section}</span>
                            {act.metadata && <span>· {act.metadata}</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {act.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      {confirmDeleteId === act.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteAction(act.id)}
                            disabled={busyId === act.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Устгах
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-[11px] font-semibold cursor-pointer"
                          >
                            Болих
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(act.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Устгах"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )
              ) : filteredSubmissions.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Одоогоор хүсэлт бүртгэгдээгүй байна
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    Хэрэглэгч вэбсайтын <strong>Хамтран ажиллах хүсэлт илгээх</strong> эсвэл <strong>Шууд зурвас илгээх</strong> маягтыг бөглөхөд Firebase өгөгдлийн санд хадгалагдаж энд шууд харагдана.
                  </p>
                </div>
              ) : (
                filteredSubmissions.map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      item.status === 'new'
                        ? 'bg-slate-50/90 dark:bg-slate-800/60 border-sky-400/30 dark:border-sky-500/20 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-85'
                    }`}
                  >
                    {/* Item Top row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            item.type === 'collaboration'
                              ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                              : 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                          }`}
                        >
                          {item.type === 'collaboration' ? 'Хамтын ажиллагаа' : 'Шууд зурвас'}
                        </span>

                        <button
                          onClick={() => handleToggleStatus(item.id, item.status)}
                          disabled={busyId === item.id}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            item.status === 'new'
                              ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          }`}
                          title="Төлөв солих"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>{item.status === 'new' ? 'Шинэ хүсэлт' : 'Холбогдсон'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{item.createdAt}</span>
                        </span>

                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDeleteSubmission(item.id)}
                              disabled={busyId === item.id}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Тийм, устгах
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer"
                            >
                              Болих
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Устгах"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Primary sender details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div>
                        {item.brandName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Байгууллага / Брэнд:
                            <span className="text-slate-900 dark:text-white font-extrabold text-sm ml-1.5">
                              {item.brandName}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Хариуцсан хүн / Нэр:
                          <span className="text-slate-900 dark:text-white font-bold text-sm ml-1.5">
                            {item.senderName}
                          </span>
                        </div>
                      </div>

                      {/* Actions for phone & email */}
                      <div className="flex flex-wrap items-center sm:justify-end gap-2">
                        <a
                          href={`tel:${item.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-sm transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{item.phone}</span>
                        </a>

                        <button
                          onClick={() => handleCopy(item.phone, `phone_${item.id}`)}
                          className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs transition-colors cursor-pointer"
                          title="Утас хуулах"
                        >
                          {copiedId === `phone_${item.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <a
                          href={`mailto:${item.email}?subject=Хариу: ${encodeURIComponent(item.brandName || item.senderName)} - Анандтай хамтрах`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-sm transition-colors"
                          title={item.email}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>И-мэйл бичих</span>
                        </a>
                      </div>
                    </div>

                    {/* Additional Collaboration fields if available */}
                    {(item.collabType || item.category || item.deadline || item.budget) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs mb-3">
                        {item.collabType && (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Формат</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.collabType}</span>
                          </div>
                        )}
                        {item.category && (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Чиглэл</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.category}</span>
                          </div>
                        )}
                        {item.deadline && (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Дедлайн</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.deadline}</span>
                          </div>
                        )}
                        {item.budget && (
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Төсөв</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.budget}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message body */}
                    <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Зурвасын агуулга:</span>
                      </div>
                      {item.message}
                    </div>

                    {/* Storage status indicator */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Firebase Firestore-д хадгалагдсан & {RECIPIENT_EMAIL} руу илгээгдсэн</span>
                      </div>
                      <span className="font-mono text-[10px] opacity-70">{item.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            Утас: <strong>88712038</strong> · Админ: <strong>{user?.email || 'Нэвтрээгүй'}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer ml-auto"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
};
