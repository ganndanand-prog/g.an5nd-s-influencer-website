import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  Database,
  ExternalLink,
} from 'lucide-react';
import { SiteContentData, InstagramReelWork } from '../../types/portfolio';
import {
  getDefaultSiteContent,
  saveSiteContentToFirestore,
  saveReelWorkToFirestore,
  deleteReelWorkFromFirestore,
  seedDefaultReelsToFirestore,
} from '../../utils/firebaseService';

interface AdminContentTabProps {
  siteContent: SiteContentData;
  hasFirestoreContent: boolean;
  reelsWorks: InstagramReelWork[];
  hasFirestoreReels: boolean;
}

interface ReelFormState {
  id?: string;
  title: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  hook: string;
  theme: string;
  tag: string;
  image: string;
  videoUrl: string;
  sortOrder: number;
}

const EMPTY_REEL: ReelFormState = {
  title: '',
  views: '',
  likes: '',
  comments: '',
  shares: '',
  hook: '',
  theme: 'Fun & Lifestyle',
  tag: 'Viral Reel',
  image: '',
  videoUrl: 'https://instagram.com/g.an5nd',
  sortOrder: 0,
};

export const AdminContentTab: React.FC<AdminContentTabProps> = ({
  siteContent,
  hasFirestoreContent,
  reelsWorks,
  hasFirestoreReels,
}) => {
  const [subTab, setSubTab] = useState<'general' | 'about_stats' | 'reels'>('general');
  const [form, setForm] = useState<SiteContentData>(siteContent);
  const [savingContent, setSavingContent] = useState(false);

  const [reelModal, setReelModal] = useState<ReelFormState | null>(null);
  const [isReelEdit, setIsReelEdit] = useState(false);
  const [savingReel, setSavingReel] = useState(false);
  const [seedingReels, setSeedingReels] = useState(false);
  const [confirmDeleteReelId, setConfirmDeleteReelId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm(siteContent);
  }, [siteContent]);

  const showNotice = (msg: string) => {
    setNoticeMsg(msg);
    setTimeout(() => setNoticeMsg(null), 2500);
  };

  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContent(true);
    setErrorMsg(null);
    try {
      await saveSiteContentToFirestore(form);
      showNotice('Вэбсайтын контент Firestore-д амжилттай хадгалагдлаа.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Контент хадгалах үед алдаа гарлаа.');
    } finally {
      setSavingContent(false);
    }
  };

  const handleResetToDefaults = () => {
    setForm(getDefaultSiteContent());
    showNotice('Анхдагч текстүүдийг маягтад сэргээлээ. Хадгалах товч дарж баталгаажуулна уу.');
  };

  const handleSeedReels = async () => {
    setSeedingReels(true);
    setErrorMsg(null);
    try {
      await seedDefaultReelsToFirestore();
      showNotice('Анхны 3 Reels бүтээлийг Firestore-д орууллаа.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Reels оруулахад алдаа гарлаа.');
    } finally {
      setSeedingReels(false);
    }
  };

  const openNewReel = () => {
    setIsReelEdit(false);
    setErrorMsg(null);
    setReelModal({
      ...EMPTY_REEL,
      sortOrder: reelsWorks.length,
    });
  };

  const openEditReel = (work: InstagramReelWork, idx: number) => {
    setIsReelEdit(hasFirestoreReels);
    setErrorMsg(null);
    setReelModal({
      id: work.id,
      title: work.title,
      views: work.views,
      likes: work.likes,
      comments: work.comments,
      shares: work.shares,
      hook: work.hook,
      theme: work.theme,
      tag: work.tag,
      image: work.image,
      videoUrl: work.videoUrl || 'https://instagram.com/g.an5nd',
      sortOrder: work.sortOrder ?? idx,
    });
  };

  const handleSaveReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelModal) return;
    setSavingReel(true);
    setErrorMsg(null);
    try {
      await saveReelWorkToFirestore(
        {
          id: reelModal.id,
          title: reelModal.title,
          views: reelModal.views,
          likes: reelModal.likes,
          comments: reelModal.comments,
          shares: reelModal.shares,
          hook: reelModal.hook,
          theme: reelModal.theme,
          tag: reelModal.tag,
          image: reelModal.image,
          videoUrl: reelModal.videoUrl,
          sortOrder: reelModal.sortOrder,
        },
        isReelEdit
      );
      setReelModal(null);
      showNotice(isReelEdit ? 'Reels бүтээл шинэчлэгдлээ.' : 'Шинэ Reels бүтээл нэмэгдлээ.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Reels хадгалахад алдаа гарлаа.');
    } finally {
      setSavingReel(false);
    }
  };

  const handleDeleteReel = async (id: string) => {
    setSavingReel(true);
    setErrorMsg(null);
    try {
      await deleteReelWorkFromFirestore(id);
      setConfirmDeleteReelId(null);
      showNotice('Reels бүтээл устгагдлаа.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Устгах үед алдаа гарлаа.');
    } finally {
      setSavingReel(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Вэбсайтын контент удирдлага
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Нүүр хуудас, холбоо барих мэдээлэл, Инстаграм статистик болон Reels бүтээлүүдийг шинэчилнэ.
          </p>
        </div>

        <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 self-start">
          <button
            onClick={() => setSubTab('general')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'general'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ерөнхий & Холбоо
          </button>
          <button
            onClick={() => setSubTab('about_stats')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'about_stats'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Тухай & Статистик
          </button>
          <button
            onClick={() => setSubTab('reels')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'reels'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Шилдэг Reels ({reelsWorks.length})
          </button>
        </div>
      </div>

      {!hasFirestoreContent && subTab !== 'reels' && (
        <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-xs text-sky-800 dark:text-sky-300">
          Одоогоор анхдагч текстүүд харагдаж байна. Доорх талбаруудыг засаад "Хадгалах" товч дарснаар Firestore-д шууд хадгалагдаж вэбсайт шинэчлэгдэнэ.
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

      {/* Tab 1 & Tab 2: SiteContent Form */}
      {subTab !== 'reels' ? (
        <form
          onSubmit={handleSaveSiteContent}
          className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5"
        >
          {subTab === 'general' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Мэндчилгээ (Нүүр хэсэг) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={form.greeting}
                    onChange={(e) => setForm({ ...form, greeting: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Үндсэн гарчиг *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={160}
                    value={form.heroTitle}
                    onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Дэд гарчиг *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={form.heroSubtitle}
                  onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Танилцуулга 1 (Нүүр хэсэг) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={1000}
                    value={form.bioPrimary}
                    onChange={(e) => setForm({ ...form, bioPrimary: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Танилцуулга 2 (Хамтрал) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    maxLength={1000}
                    value={form.bioSecondary}
                    onChange={(e) => setForm({ ...form, bioSecondary: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-y"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Утасны дугаар *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    maxLength={40}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    И-мэйл хаяг *
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={160}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Байршил *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Instagram хаяг *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={form.instagramHandle}
                    onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Instagram URL *
                  </label>
                  <input
                    type="url"
                    required
                    maxLength={240}
                    value={form.instagramUrl}
                    onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Хөл хэсгийн уриа (Footer Slogan) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={form.footerSlogan}
                    onChange={(e) => setForm({ ...form, footerSlogan: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  "Миний тухай" оршил текст *
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={1000}
                  value={form.aboutIntro}
                  onChange={(e) => setForm({ ...form, aboutIntro: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  "Миний тухай" онцлох ишлэл *
                </label>
                <textarea
                  rows={3}
                  required
                  maxLength={1000}
                  value={form.aboutQuote}
                  onChange={(e) => setForm({ ...form, aboutQuote: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white resize-y"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Нийт хандалт / Үзэлт *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={form.totalViews}
                    onChange={(e) => setForm({ ...form, totalViews: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Дундаж Reels үзэлт *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={form.avgViews}
                    onChange={(e) => setForm({ ...form, avgViews: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Үзэгчдийн идэвх (Engagement) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={form.engagementRate}
                    onChange={(e) => setForm({ ...form, engagementRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Гол аудиенс (Нас) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={form.targetAge}
                    onChange={(e) => setForm({ ...form, targetAge: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Анхны утга руу буцаах</span>
            </button>

            <button
              type="submit"
              disabled={savingContent}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {savingContent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Өөрчлөлтийг хадгалах</span>
            </button>
          </div>
        </form>
      ) : (
        /* Tab 3: Featured Reels Works */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              "Миний бүтээлүүд & Хандалт" хэсэгт харагдах шилдэг Reels бичлэгүүд.
            </p>
            <div className="flex items-center gap-2">
              {!hasFirestoreReels && (
                <button
                  onClick={handleSeedReels}
                  disabled={seedingReels}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {seedingReels ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  <span>Анхны 3 Reels DB-д оруулах</span>
                </button>
              )}
              <button
                onClick={openNewReel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Reels нэмэх</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reelsWorks.map((work, idx) => (
              <div
                key={work.id}
                className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
              >
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
                  <img
                    src={work.image}
                    alt={work.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>{work.tag}</span>
                      <span aria-hidden="true">·</span>
                      <span>{work.theme}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-1 line-clamp-2">
                      {work.title}
                    </h4>
                    <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] font-admin-mono tabular-nums text-slate-600 dark:text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Үзэлт</span>
                        {work.views}
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Like</span>
                        {work.likes}
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Comm</span>
                        {work.comments}
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Share</span>
                        {work.shares}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={work.videoUrl || 'https://instagram.com/g.an5nd'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Линк</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditReel(work, idx)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Засах"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {hasFirestoreReels &&
                        (confirmDeleteReelId === work.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteReel(work.id)}
                              disabled={savingReel}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] cursor-pointer"
                            >
                              Устгах
                            </button>
                            <button
                              onClick={() => setConfirmDeleteReelId(null)}
                              className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-[11px] cursor-pointer"
                            >
                              Болих
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteReelId(work.id)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Устгах"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reel Edit Modal */}
      {reelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {isReelEdit ? 'Reels бүтээл засах' : 'Шинэ Reels бүтээл нэмэх'}
              </h3>
              <button
                onClick={() => setReelModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReel} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Гарчиг *
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={reelModal.title}
                  onChange={(e) => setReelModal({ ...reelModal, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Үзэлт *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={reelModal.views}
                    onChange={(e) => setReelModal({ ...reelModal, views: e.target.value })}
                    placeholder="245,000+"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Like *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={reelModal.likes}
                    onChange={(e) => setReelModal({ ...reelModal, likes: e.target.value })}
                    placeholder="18.4K"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Сэтгэгдэл *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={reelModal.comments}
                    onChange={(e) => setReelModal({ ...reelModal, comments: e.target.value })}
                    placeholder="420+"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Share *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={reelModal.shares}
                    onChange={(e) => setReelModal({ ...reelModal, shares: e.target.value })}
                    placeholder="5.2K"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Сэдэв *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={reelModal.theme}
                    onChange={(e) => setReelModal({ ...reelModal, theme: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Шошго *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={reelModal.tag}
                    onChange={(e) => setReelModal({ ...reelModal, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hook тайлбар *
                </label>
                <input
                  type="text"
                  required
                  maxLength={240}
                  value={reelModal.hook}
                  onChange={(e) => setReelModal({ ...reelModal, hook: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Зургийн URL *
                </label>
                <input
                  type="url"
                  required
                  maxLength={500}
                  value={reelModal.image}
                  onChange={(e) => setReelModal({ ...reelModal, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Instagram / Видео URL
                  </label>
                  <input
                    type="url"
                    maxLength={500}
                    value={reelModal.videoUrl}
                    onChange={(e) => setReelModal({ ...reelModal, videoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Дараалал
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={reelModal.sortOrder}
                    onChange={(e) =>
                      setReelModal({ ...reelModal, sortOrder: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-admin-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReelModal(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={savingReel}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {savingReel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
