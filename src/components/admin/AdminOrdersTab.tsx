import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  PhoneCall,
  Mail,
  Copy,
  Check,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  Inbox,
  Activity,
} from 'lucide-react';
import {
  SubmissionItem,
  SubmissionStatus,
  exportSubmissionsCSV,
} from '../../utils/submissionsStorage';
import {
  ContactActionItem,
  updateSubmissionDetailsInFirestore,
  deleteSubmissionFromFirestore,
  deleteContactActionFromFirestore,
} from '../../utils/firebaseService';

interface AdminOrdersTabProps {
  submissions: SubmissionItem[];
  contactActions: ContactActionItem[];
  loading: boolean;
  initialSelectedOrderId?: string | null;
}

const STATUS_OPTIONS: { value: SubmissionStatus; label: string; badgeClass: string }[] = [
  {
    value: 'new',
    label: 'Шинэ',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  },
  {
    value: 'contacted',
    label: 'Холбогдсон',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
  },
  {
    value: 'in_progress',
    label: 'Хийгдэж буй',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
  },
  {
    value: 'completed',
    label: 'Дууссан',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  },
  {
    value: 'archived',
    label: 'Архив',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
];

const getStatusBadge = (status: SubmissionStatus) => {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
};

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  submissions,
  contactActions,
  loading,
  initialSelectedOrderId,
}) => {
  const [subView, setSubView] = useState<'orders' | 'actions'>('orders');
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'collaboration' | 'contact'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedOrderId || null);

  const [noteDraft, setNoteDraft] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialSelectedOrderId) {
      setSelectedId(initialSelectedOrderId);
      setSubView('orders');
    }
  }, [initialSelectedOrderId]);

  const filteredOrders = submissions.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const haystack = [
        item.senderName,
        item.brandName,
        item.email,
        item.phone,
        item.collabType,
        item.category,
        item.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const activeOrder =
    filteredOrders.find((o) => o.id === selectedId) ||
    submissions.find((o) => o.id === selectedId) ||
    filteredOrders[0] ||
    null;

  useEffect(() => {
    setNoteDraft(activeOrder?.adminNote || '');
    setConfirmDeleteId(null);
  }, [activeOrder?.id, activeOrder?.adminNote]);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleStatusChange = async (orderId: string, nextStatus: SubmissionStatus) => {
    setSavingId(orderId);
    setErrorMsg(null);
    try {
      await updateSubmissionDetailsInFirestore(orderId, { status: nextStatus });
      setSaveNotice('Төлөв шинэчлэгдлээ');
      setTimeout(() => setSaveNotice(null), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Төлөв шинэчлэхэд алдаа гарлаа.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNote = async () => {
    if (!activeOrder) return;
    setSavingId(activeOrder.id);
    setErrorMsg(null);
    try {
      await updateSubmissionDetailsInFirestore(activeOrder.id, { adminNote: noteDraft });
      setSaveNotice('Тэмдэглэл хадгалагдлаа');
      setTimeout(() => setSaveNotice(null), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Тэмдэглэл хадгалахад алдаа гарлаа.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    setSavingId(id);
    setErrorMsg(null);
    try {
      await deleteSubmissionFromFirestore(id);
      setConfirmDeleteId(null);
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Устгах үед алдаа гарлаа.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteAction = async (id: string) => {
    setSavingId(id);
    setErrorMsg(null);
    try {
      await deleteContactActionFromFirestore(id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Устгах үед алдаа гарлаа.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Toolbar: Sub-view switch + Search + Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSubView('orders')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                subView === 'orders'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Захиалга & Хүсэлт ({submissions.length})
            </button>
            <button
              onClick={() => setSubView('actions')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                subView === 'actions'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Зочдын үйлдэл ({contactActions.length})</span>
            </button>
          </div>

          {subView === 'orders' && (
            <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              {(
                [
                  { id: 'all', label: 'Бүх төрөл' },
                  { id: 'collaboration', label: 'Хамтын ажиллагаа' },
                  { id: 'contact', label: 'Шууд зурвас' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    typeFilter === t.id
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {subView === 'orders' && (
            <>
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Нэр, брэнд, утас хайх..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                />
              </div>

              <button
                onClick={() => exportSubmissionsCSV(filteredOrders)}
                disabled={filteredOrders.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV татах</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Filter Bar */}
      {subView === 'orders' && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Бүгд ({submissions.length})
          </button>
          {STATUS_OPTIONS.map((opt) => {
            const count = submissions.filter((s) => s.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === opt.value
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveNotice && (
        <div className="p-2.5 px-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {subView === 'actions' ? (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          {contactActions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
              Зочдын үйлдлийн түүх одоогоор хоосон байна.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">Үйлдэл</th>
                    <th className="py-2.5 px-4">Төрөл</th>
                    <th className="py-2.5 px-4">Хэсэг</th>
                    <th className="py-2.5 px-4">Огноо</th>
                    <th className="py-2.5 px-4 text-right">Засах</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {contactActions.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {act.label}
                        {act.metadata && (
                          <span className="text-slate-400 ml-2 font-normal">· {act.metadata}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-admin-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {act.actionType}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {act.section}
                      </td>
                      <td className="py-3 px-4 font-admin-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {act.createdAt}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAction(act.id)}
                          disabled={savingId === act.id}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Устгах"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="p-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span className="text-xs">Firebase-аас захиалгуудыг ачаалж байна...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Тохирох захиалга олдсонгүй
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Шүүлтүүрээ өөрчлөх эсвэл хайлтын үгээ цэвэрлээд дахин шалгана уу.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left: Orders List Table */}
          <div className="xl:col-span-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">Брэнд / Захиалагч</th>
                    <th className="py-2.5 px-4">Формат / Утас</th>
                    <th className="py-2.5 px-4">Төлөв</th>
                    <th className="py-2.5 px-4 text-right">Огноо</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {filteredOrders.map((order) => {
                    const isSelected = activeOrder?.id === order.id;
                    const badge = getStatusBadge(order.status);
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedId(order.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-slate-100/90 dark:bg-slate-800/80'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {order.brandName || order.senderName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {order.brandName ? `${order.senderName} · ` : ''}
                            {order.type === 'collaboration' ? 'Хамтрал' : 'Шууд зурвас'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                            {order.collabType || 'Ерөнхий холбоо'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-admin-mono tabular-nums">
                            {order.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${badge.badgeClass}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-admin-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {order.createdAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Order Detail & Management Panel */}
          {activeOrder && (
            <div className="xl:col-span-5 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 xl:sticky xl:top-20">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span>{activeOrder.type === 'collaboration' ? 'Хамтын ажиллагаа' : 'Шууд зурвас'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-admin-mono tabular-nums">{activeOrder.createdAt}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {activeOrder.brandName || activeOrder.senderName}
                  </h3>
                  {activeOrder.brandName && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Хариуцсан хүн: {activeOrder.senderName}
                    </p>
                  )}
                </div>

                {confirmDeleteId === activeOrder.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDeleteOrder(activeOrder.id)}
                      disabled={savingId === activeOrder.id}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium cursor-pointer"
                    >
                      Устгах
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium cursor-pointer"
                    >
                      Болих
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(activeOrder.id)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                    title="Захиалга устгах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Contact Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`tel:${activeOrder.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span className="font-admin-mono tabular-nums">{activeOrder.phone}</span>
                </a>
                <button
                  onClick={() => handleCopy(activeOrder.phone, `phone_${activeOrder.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {copiedKey === `phone_${activeOrder.id}` ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Хуулагдлаа</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Утас хуулах</span>
                    </>
                  )}
                </button>
                <a
                  href={`mailto:${activeOrder.email}?subject=${encodeURIComponent(
                    `Хариу: ${activeOrder.brandName || activeOrder.senderName} - Ананд`
                  )}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[180px]">{activeOrder.email}</span>
                </a>
              </div>

              {/* Metadata Grid */}
              {(activeOrder.collabType ||
                activeOrder.category ||
                activeOrder.deadline ||
                activeOrder.budget) && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-xs">
                  {activeOrder.collabType && (
                    <div>
                      <span className="text-[11px] text-slate-400 block">Формат</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {activeOrder.collabType}
                      </span>
                    </div>
                  )}
                  {activeOrder.category && (
                    <div>
                      <span className="text-[11px] text-slate-400 block">Чиглэл</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {activeOrder.category}
                      </span>
                    </div>
                  )}
                  {activeOrder.deadline && (
                    <div>
                      <span className="text-[11px] text-slate-400 block">Дедлайн</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {activeOrder.deadline}
                      </span>
                    </div>
                  )}
                  {activeOrder.budget && (
                    <div>
                      <span className="text-[11px] text-slate-400 block">Төсөв</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {activeOrder.budget}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Message Body */}
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                  Ирсэн зурвас / Санал
                </span>
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {activeOrder.message}
                </div>
              </div>

              {/* Order Status Switcher */}
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-2">
                  Захиалгын төлөв шинэчлэх
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(activeOrder.id, opt.value)}
                      disabled={savingId === activeOrder.id}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        activeOrder.status === opt.value
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Internal Note */}
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                  Админы тэмдэглэл (Зөвхөн админд харагдана)
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Ярилцсан үнийн дүн, зураг авалтын өдөр, нэмэлт мэдээлэл..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 resize-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] font-admin-mono text-slate-400">
                    ID: {activeOrder.id}
                  </span>
                  <button
                    onClick={handleSaveNote}
                    disabled={savingId === activeOrder.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                  >
                    {savingId === activeOrder.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Тэмдэглэл хадгалах</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
