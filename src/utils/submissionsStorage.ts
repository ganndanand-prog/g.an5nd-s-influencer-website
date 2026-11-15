export type SubmissionStatus = 'new' | 'contacted' | 'in_progress' | 'completed' | 'archived';

export interface SubmissionItem {
  id: string;
  type: 'collaboration' | 'contact';
  createdAt: string;
  timestamp: number;
  senderName: string;
  email: string;
  phone: string;
  brandName?: string;
  collabType?: string;
  category?: string;
  message: string;
  deadline?: string;
  budget?: string;
  status: SubmissionStatus;
  adminNote?: string;
  emailDelivered: boolean;
}

const STORAGE_KEY = 'anand_portfolio_submissions_v1';

export const getSubmissions = (): SubmissionItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.timestamp - a.timestamp);
    }
    return [];
  } catch (error) {
    console.error('Failed to read submissions from localStorage:', error);
    return [];
  }
};

export const saveSubmission = (
  item: Omit<SubmissionItem, 'id' | 'createdAt' | 'timestamp' | 'status'>
): SubmissionItem => {
  const existing = getSubmissions();
  const now = new Date();
  
  const newItem: SubmissionItem = {
    ...item,
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now.toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: now.getTime(),
    status: 'new',
  };

  const updated = [newItem, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('submissions_updated'));
  } catch (error) {
    console.error('Failed to save submission to localStorage:', error);
  }

  return newItem;
};

export const updateSubmissionStatus = (id: string, status: SubmissionItem['status']): void => {
  const existing = getSubmissions();
  const updated = existing.map((sub) => (sub.id === id ? { ...sub, status } : sub));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('submissions_updated'));
  } catch (error) {
    console.error('Failed to update submission status:', error);
  }
};

export const deleteSubmission = (id: string): void => {
  const existing = getSubmissions();
  const updated = existing.filter((sub) => sub.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('submissions_updated'));
  } catch (error) {
    console.error('Failed to delete submission:', error);
  }
};

export const clearAllSubmissions = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('submissions_updated'));
  } catch (error) {
    console.error('Failed to clear submissions:', error);
  }
};

const getStatusLabelMn = (status: SubmissionStatus): string => {
  switch (status) {
    case 'new':
      return 'Шинэ';
    case 'contacted':
      return 'Холбогдсон';
    case 'in_progress':
      return 'Хийгдэж буй';
    case 'completed':
      return 'Дууссан';
    case 'archived':
    default:
      return 'Архив';
  }
};

export const exportSubmissionsCSV = (items?: SubmissionItem[]): void => {
  const submissions = items ?? getSubmissions();
  if (submissions.length === 0) return;

  const headers = ['Төрөл', 'Огноо', 'Брэнд/Байгууллага', 'Нэр', 'Утас', 'И-мэйл', 'Формат', 'Чиглэл', 'Дедлайн', 'Төсөв', 'Зурвас', 'Төлөв', 'Админ тэмдэглэл'];
  const rows = submissions.map((s) => [
    s.type === 'collaboration' ? 'Хамтын ажиллагаа' : 'Шууд зурвас',
    `"${s.createdAt}"`,
    `"${(s.brandName || '').replace(/"/g, '""')}"`,
    `"${(s.senderName || '').replace(/"/g, '""')}"`,
    `"${(s.phone || '').replace(/"/g, '""')}"`,
    `"${(s.email || '').replace(/"/g, '""')}"`,
    `"${(s.collabType || '').replace(/"/g, '""')}"`,
    `"${(s.category || '').replace(/"/g, '""')}"`,
    `"${(s.deadline || '').replace(/"/g, '""')}"`,
    `"${(s.budget || '').replace(/"/g, '""')}"`,
    `"${(s.message || '').replace(/"/g, '""')}"`,
    getStatusLabelMn(s.status),
    `"${(s.adminNote || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `anand_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
