import React from 'react';
import {
  ShoppingBag,
  Clock,
  Layers,
  MousePointerClick,
  ArrowRight,
  PhoneCall,
  Mail,
  Trash2,
} from 'lucide-react';
import { SubmissionItem } from '../../utils/submissionsStorage';
import { ContactActionItem, deleteContactActionFromFirestore } from '../../utils/firebaseService';
import { PricingPackage } from '../../types/portfolio';

export type AdminTabKey = 'dashboard' | 'orders' | 'services' | 'content';

interface AdminDashboardTabProps {
  submissions: SubmissionItem[];
  contactActions: ContactActionItem[];
  services: PricingPackage[];
  hasFirestoreServices: boolean;
  onNavigateTab: (tab: AdminTabKey) => void;
  onSelectOrder: (orderId: string) => void;
}

const STATUS_META: Record<
  SubmissionItem['status'],
  { label: string; colorClass: string; barClass: string }
> = {
  new: {
    label: 'Шинэ',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    barClass: 'bg-amber-500',
  },
  contacted: {
    label: 'Холбогдсон',
    colorClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    barClass: 'bg-sky-500',
  },
  in_progress: {
    label: 'Хийгдэж буй',
    colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
    barClass: 'bg-indigo-500',
  },
  completed: {
    label: 'Дууссан',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    barClass: 'bg-emerald-600',
  },
  archived: {
    label: 'Архив',
    colorClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    barClass: 'bg-slate-400',
  },
};

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  submissions,
  contactActions,
  services,
  hasFirestoreServices,
  onNavigateTab,
  onSelectOrder,
}) => {
  const totalOrders = submissions.length;
  const newOrders = submissions.filter((s) => s.status === 'new').length;
  const collabCount = submissions.filter((s) => s.type === 'collaboration').length;
  const contactCount = submissions.filter((s) => s.type === 'contact').length;
  const activeServicesCount = services.filter((s) => s.active !== false).length;

  const statusCounts = {
    new: submissions.filter((s) => s.status === 'new').length,
    contacted: submissions.filter((s) => s.status === 'contacted').length,
    in_progress: submissions.filter((s) => s.status === 'in_progress').length,
    completed: submissions.filter((s) => s.status === 'completed').length,
    archived: submissions.filter((s) => s.status === 'archived').length,
  };

  const recentOrders = submissions.slice(0, 6);
  const recentActions = contactActions.slice(0, 8);

  const handleDeleteAction = async (id: string) => {
    try {
      await deleteContactActionFromFirestore(id);
    } catch {
      // Handled by context/console
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Нийт бүртгэл & захиалга
            </span>
            <ShoppingBag className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-admin-mono tabular-nums">
            {totalOrders}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>{collabCount} хамтрал</span>
            <span aria-hidden="true">·</span>
            <span>{contactCount} шууд зурвас</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Шинэ хүлээгдэж буй
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-admin-mono tabular-nums">
            {newOrders}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Хариу өгөх шаардлагатай хүсэлт
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Идэвхтэй үйлчилгээ
            </span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-admin-mono tabular-nums">
            {activeServicesCount}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {hasFirestoreServices ? 'Firestore-оос шууд ачаалж байна' : 'Анхдагч загвар багцууд'}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Зочдын холбоо барих үйлдэл
            </span>
            <MousePointerClick className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-admin-mono tabular-nums">
            {contactActions.length}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Сүүлийн 100 бүртгэгдсэн үйлдэл
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders + Pipeline & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Recent Orders Table */}
        <div className="lg:col-span-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Сүүлийн захиалга ба бүртгэлүүд
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Вэбсайтаар ирсэн хамгийн сүүлийн хүсэлтүүд
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Бүгдийг харах</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Одоогоор бүртгэгдсэн захиалга алга
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Зочид вэбсайтын хамтын ажиллагаа эсвэл холбоо барих маягт бөглөхөд энд шууд харагдана.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">Брэнд / Захиалагч</th>
                    <th className="py-2.5 px-4">Төрөл</th>
                    <th className="py-2.5 px-4">Холбоо барих</th>
                    <th className="py-2.5 px-4">Төлөв</th>
                    <th className="py-2.5 px-4 text-right">Огноо</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {recentOrders.map((order) => {
                    const meta = STATUS_META[order.status];
                    return (
                      <tr
                        key={order.id}
                        onClick={() => {
                          onSelectOrder(order.id);
                          onNavigateTab('orders');
                        }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {order.brandName || order.senderName}
                          </div>
                          {order.brandName && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {order.senderName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {order.type === 'collaboration' ? 'Хамтрал' : 'Зурвас'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 font-admin-mono tabular-nums text-slate-700 dark:text-slate-300">
                            <PhoneCall className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{order.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{order.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-medium ${meta.colorClass}`}
                          >
                            {meta.label}
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
          )}
        </div>

        {/* Right 4 cols: Status Breakdown + Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Захиалгын төлөвийн хуваарилалт
            </h3>
            <div className="space-y-3">
              {(Object.keys(STATUS_META) as SubmissionItem['status'][]).map((statusKey) => {
                const count = statusCounts[statusKey];
                const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                const meta = STATUS_META[statusKey];
                return (
                  <div key={statusKey}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {meta.label}
                      </span>
                      <span className="font-admin-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${meta.barClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('services')}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
              >
                Үйлчилгээ засах
              </button>
              <button
                onClick={() => onNavigateTab('content')}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
              >
                Контент засах
              </button>
            </div>
          </div>

          {/* Visitor Contact Actions Feed */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Сүүлийн зочдын үйлдэл
              </h3>
            </div>
            {recentActions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Хэрэглэгчдийн товч дарсан түүх одоогоор хоосон байна.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[320px] overflow-y-auto">
                {recentActions.map((act) => (
                  <div
                    key={act.id}
                    className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {act.label}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-admin-mono tabular-nums">
                        <span>{act.section}</span>
                        <span aria-hidden="true">·</span>
                        <span>{act.createdAt}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAction(act.id)}
                      className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                      title="Устгах"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
