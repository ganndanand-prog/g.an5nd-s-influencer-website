import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  FileEdit,
  LogIn,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import { useFirebase } from '../../contexts/FirebaseContext';
import { ADMIN_EMAILS } from '../../firebase';
import { AdminDashboardTab, AdminTabKey } from './AdminDashboardTab';
import { AdminOrdersTab } from './AdminOrdersTab';
import { AdminServicesTab } from './AdminServicesTab';
import { AdminContentTab } from './AdminContentTab';

interface AdminPortalProps {
  onExitAdmin: () => void;
}

const TAB_LABELS: Record<AdminTabKey, string> = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  services: 'Services',
  content: 'Content',
};

const TAB_SUBTITLES: Record<AdminTabKey, string> = {
  dashboard: 'Ерөнхий тойм, захиалга болон зочдын идэвх',
  orders: 'Бүртгэгдсэн захиалга, хамтран ажиллах хүсэлт ба зурвасууд',
  services: 'Хамтын ажиллагааны багц болон үнийн санал удирдах',
  content: 'Вэбсайтын текст, холбоо барих мэдээлэл болон Reels бүтээлүүд',
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExitAdmin }) => {
  const {
    user,
    authReady,
    isAdmin,
    authError,
    submissions,
    contactActions,
    publicServices,
    adminServices,
    hasFirestoreServices,
    siteContent,
    hasFirestoreContent,
    reelsWorks,
    hasFirestoreReels,
    firestoreLoading,
    firestoreError,
    signInWithGoogle,
    signOutUser,
  } = useFirebase();

  const [activeTab, setActiveTab] = useState<AdminTabKey>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const newOrdersCount = submissions.filter((s) => s.status === 'new').length;

  const navItems: {
    key: AdminTabKey;
    label: string;
    labelMn: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      labelMn: 'Хяналтын самбар',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      key: 'orders',
      label: 'Orders',
      labelMn: 'Захиалга & Бүртгэл',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: newOrdersCount > 0 ? newOrdersCount : undefined,
    },
    {
      key: 'services',
      label: 'Services',
      labelMn: 'Үйлчилгээ & Багц',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      key: 'content',
      label: 'Content',
      labelMn: 'Контент удирдлага',
      icon: <FileEdit className="w-4 h-4" />,
    },
  ];

  // 1. Loading Auth State
  if (!authReady) {
    return (
      <div className="min-h-screen font-admin bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-600 dark:text-slate-300">
        <Loader2 className="w-7 h-7 animate-spin text-slate-900 dark:text-white mb-3" />
        <p className="text-sm font-medium">Нэвтрэлтийн төлөв шалгаж байна...</p>
      </div>
    );
  }

  // 2. Not Logged In -> Login Screen
  if (!user) {
    return (
      <div className="min-h-screen font-admin bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mb-5">
            <ShieldCheck className="w-5 h-5" />
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Админ хэсэгт нэвтрэх
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Бүртгэгдсэн захиалга, хамтын ажиллагааны хүсэлт, үйлчилгээний багц болон вэбсайтын контентыг удирдахын тулд эрхтэй Google бүртгэлээрээ нэвтэрнэ үү.
          </p>

          {authError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={signInWithGoogle}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Google-ээр нэвтрэх</span>
            </button>

            <button
              onClick={onExitAdmin}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Вэбсайт руу буцах</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Logged In, But Not Admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen font-admin bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-5 h-5" />
          </div>

          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Админ эрх хүрэлцэхгүй байна
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Та одоогоор <strong className="text-slate-800 dark:text-slate-200">{user.email}</strong> хаягаар нэвтэрсэн байна. Энэ хэсэгт зөвхөн зөвшөөрөгдсөн админ ({ADMIN_EMAILS.join(', ')}) хандах боломжтой.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={signOutUser}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Гараад өөр бүртгэлээр нэвтрэх</span>
            </button>
            <button
              onClick={onExitAdmin}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Вэбсайт руу буцах
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated Admin Workspace
  return (
    <div className="min-h-screen font-admin bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 h-screen">
        <div className="h-16 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center">
              A
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Ананд Админ
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  {item.icon}
                  <span>{item.label}</span>
                  <span className={`text-[11px] ${isActive ? 'opacity-75' : 'text-slate-400'}`}>
                    · {item.labelMn}
                  </span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-admin-mono tabular-nums font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
            <div className="text-[11px] text-slate-400">Нэвтэрсэн админ</div>
            <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {user.email}
            </div>
          </div>

          <button
            onClick={onExitAdmin}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Вэбсайт харах</span>
          </button>

          <button
            onClick={signOutUser}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Системээс гарах</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 max-w-[80vw] bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Ананд Админ
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-admin-mono font-semibold bg-amber-100 text-amber-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <button
                onClick={onExitAdmin}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Вэбсайт харах</span>
              </button>
              <button
                onClick={signOutUser}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Гарах</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Цэс нээх"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Админ</span>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {TAB_LABELS[activeTab]}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                {TAB_SUBTITLES[activeTab]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Вэбсайт руу буцах</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto">
          {firestoreError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{firestoreError}</span>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              submissions={submissions}
              contactActions={contactActions}
              services={hasFirestoreServices ? adminServices : publicServices}
              hasFirestoreServices={hasFirestoreServices}
              onNavigateTab={setActiveTab}
              onSelectOrder={(orderId) => setSelectedOrderId(orderId)}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              submissions={submissions}
              contactActions={contactActions}
              loading={firestoreLoading}
              initialSelectedOrderId={selectedOrderId}
            />
          )}

          {activeTab === 'services' && (
            <AdminServicesTab
              adminServices={adminServices}
              publicFallbackServices={publicServices}
              hasFirestoreServices={hasFirestoreServices}
            />
          )}

          {activeTab === 'content' && (
            <AdminContentTab
              siteContent={siteContent}
              hasFirestoreContent={hasFirestoreContent}
              reelsWorks={reelsWorks}
              hasFirestoreReels={hasFirestoreReels}
            />
          )}
        </main>
      </div>
    </div>
  );
};
