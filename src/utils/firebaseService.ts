import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SubmissionItem, SubmissionStatus } from './submissionsStorage';
import { PricingPackage, SiteContentData, InstagramReelWork } from '../types/portfolio';
import {
  profileData,
  aboutAnandData,
  instagramStats,
  instagramReelsWorks,
  pricingPackages,
} from '../data/portfolioData';

export type ContactActionType =
  | 'collaboration_submit'
  | 'contact_submit'
  | 'phone_click'
  | 'phone_copy'
  | 'email_copy'
  | 'email_click'
  | 'instagram_click'
  | 'package_select';

export interface ContactActionItem {
  id: string;
  actionType: ContactActionType;
  label: string;
  section: string;
  metadata?: string;
  createdAt: string;
  timestamp: number;
}

const sanitizeText = (value: string | undefined, maxLength: number): string => {
  if (!value) return '';
  return value.trim().slice(0, maxLength);
};

const sanitizeId = (value: string | undefined, fallbackPrefix: string): string => {
  const cleaned = (value || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  if (cleaned.length >= 1) return cleaned;
  return `${fallbackPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const generateValidId = (prefix: string): string => {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${random}`;
};

const formatTimestamp = (ts: unknown): { createdAt: string; timestamp: number } => {
  if (ts instanceof Timestamp) {
    const date = ts.toDate();
    return {
      createdAt: date.toLocaleString('mn-MN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: date.getTime(),
    };
  }
  const now = new Date();
  return {
    createdAt: now.toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: now.getTime(),
  };
};

export const getDefaultSiteContent = (): SiteContentData => ({
  greeting: profileData.greeting || 'Сайн байна уу, та Анандын вэбсайттай холбогдлоо!',
  heroTitle: profileData.title,
  heroSubtitle: profileData.subtitle,
  bioPrimary: profileData.bio[0] || '',
  bioSecondary: profileData.bio[1] || '',
  phone: profileData.phone,
  email: profileData.email,
  instagramHandle: profileData.instagramHandle,
  instagramUrl: profileData.socials.instagram,
  location: profileData.location,
  aboutIntro: aboutAnandData.intro,
  aboutQuote:
    'Би аливаа контентыг үзэгчдэд хүргэхдээ уйтгартай, хэт албаны байхаас зайлсхийдэг. Хүмүүс бичлэгийг үзээд инээмсэглэж, найзууддаа хуваалцахыг хүсэх тийм л хөгжилтэй, сонирхолтой өнгө аясыг бүрдүүлдэг.',
  footerSlogan: aboutAnandData.slogan,
  totalViews: instagramStats[0]?.value || '1.2M+',
  avgViews: instagramStats[1]?.value || '65K - 180K',
  engagementRate: instagramStats[2]?.value || '12.4%',
  targetAge: instagramStats[3]?.value || '15 - 26 нас',
});

export interface SaveSubmissionInput {
  type: 'collaboration' | 'contact';
  senderName: string;
  email: string;
  phone: string;
  message: string;
  brandName?: string;
  collabType?: string;
  category?: string;
  deadline?: string;
  budget?: string;
  emailDelivered: boolean;
  source?: string;
}

export async function saveSubmissionToFirestore(input: SaveSubmissionInput): Promise<string> {
  const id = generateValidId(input.type === 'collaboration' ? 'collab' : 'msg');
  const path = `submissions/${id}`;

  const senderName = sanitizeText(input.senderName, 120);
  const email = sanitizeText(input.email, 160);
  const phone = sanitizeText(input.phone, 40);
  const message = sanitizeText(input.message, 3000);

  if (!senderName || email.length < 3 || phone.length < 4 || !message) {
    throw new Error('Заавал бөглөх талбаруудын мэдээлэл дутуу эсвэл буруу байна.');
  }

  const payload: Record<string, unknown> = {
    type: input.type,
    senderName,
    email,
    phone,
    message,
    status: 'new',
    emailDelivered: Boolean(input.emailDelivered),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const brandName = sanitizeText(input.brandName, 160);
  if (brandName) payload.brandName = brandName;

  const collabType = sanitizeText(input.collabType, 120);
  if (collabType) payload.collabType = collabType;

  const category = sanitizeText(input.category, 120);
  if (category) payload.category = category;

  const deadline = sanitizeText(input.deadline, 120);
  if (deadline) payload.deadline = deadline;

  const budget = sanitizeText(input.budget, 120);
  if (budget) payload.budget = budget;

  const source = sanitizeText(input.source, 60);
  if (source) payload.source = source;

  try {
    await setDoc(doc(db, 'submissions', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  try {
    await logContactActionToFirestore({
      actionType: input.type === 'collaboration' ? 'collaboration_submit' : 'contact_submit',
      label:
        input.type === 'collaboration'
          ? `Хамтран ажиллах хүсэлт: ${brandName || senderName}`
          : `Шууд зурвас илгээсэн: ${senderName}`,
      section: input.type === 'collaboration' ? 'collaboration' : 'contact',
      metadata: sanitizeText(input.collabType || input.phone, 300),
    });
  } catch {
    // Submission already succeeded
  }

  return id;
}

export interface LogContactActionInput {
  actionType: ContactActionType;
  label: string;
  section: string;
  metadata?: string;
}

export async function logContactActionToFirestore(input: LogContactActionInput): Promise<string> {
  const id = generateValidId('act');
  const path = `contactActions/${id}`;

  const label = sanitizeText(input.label, 200);
  const section = sanitizeText(input.section, 80);
  if (!label || !section) {
    throw new Error('Invalid contact action payload.');
  }

  const payload: Record<string, unknown> = {
    actionType: input.actionType,
    label,
    section,
    createdAt: serverTimestamp(),
  };

  const metadata = sanitizeText(input.metadata, 300);
  if (metadata) {
    payload.metadata = metadata;
  }

  try {
    await setDoc(doc(db, 'contactActions', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

const VALID_STATUSES: SubmissionStatus[] = [
  'new',
  'contacted',
  'in_progress',
  'completed',
  'archived',
];

export function subscribeToSubmissions(
  onData: (items: SubmissionItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'submissions';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SubmissionItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const { createdAt, timestamp } = formatTimestamp(data.createdAt);
        const rawStatus = String(data.status || 'new') as SubmissionStatus;
        return {
          id: docSnap.id,
          type: data.type === 'collaboration' ? 'collaboration' : 'contact',
          createdAt,
          timestamp,
          senderName: String(data.senderName || ''),
          email: String(data.email || ''),
          phone: String(data.phone || ''),
          brandName: data.brandName ? String(data.brandName) : undefined,
          collabType: data.collabType ? String(data.collabType) : undefined,
          category: data.category ? String(data.category) : undefined,
          message: String(data.message || ''),
          deadline: data.deadline ? String(data.deadline) : undefined,
          budget: data.budget ? String(data.budget) : undefined,
          status: VALID_STATUSES.includes(rawStatus) ? rawStatus : 'new',
          adminNote: data.adminNote ? String(data.adminNote) : undefined,
          emailDelivered: Boolean(data.emailDelivered),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeToContactActions(
  onData: (items: ContactActionItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'contactActions';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ContactActionItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const { createdAt, timestamp } = formatTimestamp(data.createdAt);
        return {
          id: docSnap.id,
          actionType: data.actionType as ContactActionType,
          label: String(data.label || ''),
          section: String(data.section || ''),
          metadata: data.metadata ? String(data.metadata) : undefined,
          createdAt,
          timestamp,
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function updateSubmissionStatusInFirestore(
  id: string,
  status: SubmissionStatus
): Promise<void> {
  const path = `submissions/${id}`;
  try {
    await updateDoc(doc(db, 'submissions', id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateSubmissionDetailsInFirestore(
  id: string,
  updates: { status?: SubmissionStatus; adminNote?: string }
): Promise<void> {
  const path = `submissions/${id}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (updates.adminNote !== undefined) {
    payload.adminNote = sanitizeText(updates.adminNote, 1000);
  }

  try {
    await updateDoc(doc(db, 'submissions', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubmissionFromFirestore(id: string): Promise<void> {
  const path = `submissions/${id}`;
  try {
    await deleteDoc(doc(db, 'submissions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteContactActionFromFirestore(id: string): Promise<void> {
  const path = `contactActions/${id}`;
  try {
    await deleteDoc(doc(db, 'contactActions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- Services (Pricing Packages) CRUD & Subscriptions ---

const mapServiceDoc = (docSnap: { id: string; data: () => Record<string, unknown> }): PricingPackage => {
  const data = docSnap.data();
  const deliverables = Array.isArray(data.deliverables)
    ? data.deliverables.map((d) => String(d)).filter(Boolean)
    : [];
  return {
    id: docSnap.id,
    title: String(data.title || ''),
    badge: data.badge ? String(data.badge) : undefined,
    priceAmount: data.priceAmount ? String(data.priceAmount) : undefined,
    priceNote: String(data.priceNote || ''),
    deliverables,
    timeline: String(data.timeline || ''),
    idealFor: String(data.idealFor || ''),
    popular: Boolean(data.popular),
    active: data.active !== false,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 0,
  };
};

export function subscribeToPublicServices(
  onData: (items: PricingPackage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'services';
  const q = query(collection(db, path), where('active', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => mapServiceDoc(docSnap))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeToAllServices(
  onData: (items: PricingPackage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'services';
  const q = query(collection(db, path));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => mapServiceDoc(docSnap))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export interface SaveServiceInput {
  id?: string;
  title: string;
  badge?: string;
  priceAmount?: string;
  priceNote: string;
  deliverables: string[];
  timeline: string;
  idealFor: string;
  popular: boolean;
  active: boolean;
  sortOrder: number;
}

export async function saveServiceToFirestore(
  input: SaveServiceInput,
  isUpdate: boolean
): Promise<string> {
  const id = sanitizeId(input.id, 'svc');
  const path = `services/${id}`;

  const title = sanitizeText(input.title, 120);
  const priceNote = sanitizeText(input.priceNote, 300);
  const timeline = sanitizeText(input.timeline, 120);
  const idealFor = sanitizeText(input.idealFor, 200);
  const deliverables = input.deliverables
    .map((d) => sanitizeText(d, 300))
    .filter(Boolean)
    .slice(0, 15);

  if (!title || !priceNote || !timeline || !idealFor || deliverables.length === 0) {
    throw new Error('Үйлчилгээний бүх шаардлагатай талбарыг бөглөнө үү.');
  }

  const badge = sanitizeText(input.badge, 80);
  const priceAmount = sanitizeText(input.priceAmount, 80);
  const sortOrder = Math.max(0, Math.min(1000, Number(input.sortOrder) || 0));

  if (isUpdate) {
    const updatePayload: Record<string, unknown> = {
      title,
      badge,
      priceAmount,
      priceNote,
      deliverables,
      timeline,
      idealFor,
      popular: Boolean(input.popular),
      active: Boolean(input.active),
      sortOrder,
      updatedAt: serverTimestamp(),
    };
    try {
      await updateDoc(doc(db, 'services', id), updatePayload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    const createPayload: Record<string, unknown> = {
      title,
      badge,
      priceAmount,
      priceNote,
      deliverables,
      timeline,
      idealFor,
      popular: Boolean(input.popular),
      active: Boolean(input.active),
      sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'services', id), createPayload);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function deleteServiceFromFirestore(id: string): Promise<void> {
  const path = `services/${id}`;
  try {
    await deleteDoc(doc(db, 'services', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDefaultServicesToFirestore(): Promise<void> {
  for (let i = 0; i < pricingPackages.length; i++) {
    const pkg = pricingPackages[i];
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
        active: true,
        sortOrder: i,
      },
      false
    );
  }
}

// --- Site Content CRUD & Subscription ---

export function subscribeToSiteContent(
  onData: (content: SiteContentData | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'siteContent/main';
  return onSnapshot(
    doc(db, 'siteContent', 'main'),
    (docSnap) => {
      if (!docSnap.exists()) {
        onData(null);
        return;
      }
      const d = docSnap.data();
      const defaults = getDefaultSiteContent();
      onData({
        greeting: String(d.greeting || defaults.greeting),
        heroTitle: String(d.heroTitle || defaults.heroTitle),
        heroSubtitle: String(d.heroSubtitle || defaults.heroSubtitle),
        bioPrimary: String(d.bioPrimary || defaults.bioPrimary),
        bioSecondary: String(d.bioSecondary || defaults.bioSecondary),
        phone: String(d.phone || defaults.phone),
        email: String(d.email || defaults.email),
        instagramHandle: String(d.instagramHandle || defaults.instagramHandle),
        instagramUrl: String(d.instagramUrl || defaults.instagramUrl),
        location: String(d.location || defaults.location),
        aboutIntro: String(d.aboutIntro || defaults.aboutIntro),
        aboutQuote: String(d.aboutQuote || defaults.aboutQuote),
        footerSlogan: String(d.footerSlogan || defaults.footerSlogan),
        totalViews: String(d.totalViews || defaults.totalViews),
        avgViews: String(d.avgViews || defaults.avgViews),
        engagementRate: String(d.engagementRate || defaults.engagementRate),
        targetAge: String(d.targetAge || defaults.targetAge),
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveSiteContentToFirestore(input: SiteContentData): Promise<void> {
  const path = 'siteContent/main';
  const payload = {
    greeting: sanitizeText(input.greeting, 200),
    heroTitle: sanitizeText(input.heroTitle, 160),
    heroSubtitle: sanitizeText(input.heroSubtitle, 200),
    bioPrimary: sanitizeText(input.bioPrimary, 1000),
    bioSecondary: sanitizeText(input.bioSecondary, 1000),
    phone: sanitizeText(input.phone, 40),
    email: sanitizeText(input.email, 160),
    instagramHandle: sanitizeText(input.instagramHandle, 60),
    instagramUrl: sanitizeText(input.instagramUrl, 240),
    location: sanitizeText(input.location, 120),
    aboutIntro: sanitizeText(input.aboutIntro, 1000),
    aboutQuote: sanitizeText(input.aboutQuote, 1000),
    footerSlogan: sanitizeText(input.footerSlogan, 200),
    totalViews: sanitizeText(input.totalViews, 60),
    avgViews: sanitizeText(input.avgViews, 60),
    engagementRate: sanitizeText(input.engagementRate, 60),
    targetAge: sanitizeText(input.targetAge, 60),
    updatedAt: serverTimestamp(),
  };

  if (
    !payload.greeting ||
    !payload.heroTitle ||
    !payload.heroSubtitle ||
    !payload.bioPrimary ||
    !payload.bioSecondary ||
    payload.phone.length < 4 ||
    payload.email.length < 3 ||
    !payload.instagramHandle ||
    !payload.instagramUrl ||
    !payload.location ||
    !payload.aboutIntro ||
    !payload.aboutQuote ||
    !payload.footerSlogan ||
    !payload.totalViews ||
    !payload.avgViews ||
    !payload.engagementRate ||
    !payload.targetAge
  ) {
    throw new Error('Контентын бүх талбаруудыг хоосон орхихгүй бөглөнө үү.');
  }

  try {
    await setDoc(doc(db, 'siteContent', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- Featured Reels Works CRUD & Subscription ---

export function subscribeToReelsWorks(
  onData: (items: InstagramReelWork[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'reelsWorks';
  const q = query(collection(db, path), where('sortOrder', '>=', 0), orderBy('sortOrder', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: InstagramReelWork[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          title: String(d.title || ''),
          views: String(d.views || ''),
          likes: String(d.likes || ''),
          comments: String(d.comments || ''),
          shares: String(d.shares || ''),
          hook: String(d.hook || ''),
          theme: String(d.theme || ''),
          tag: String(d.tag || ''),
          image: String(d.image || ''),
          videoUrl: d.videoUrl ? String(d.videoUrl) : undefined,
          sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 0,
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveReelWorkToFirestore(
  input: Omit<InstagramReelWork, 'id'> & { id?: string },
  isUpdate: boolean
): Promise<string> {
  const id = sanitizeId(input.id, 'reel');
  const path = `reelsWorks/${id}`;

  const title = sanitizeText(input.title, 160);
  const views = sanitizeText(input.views, 60);
  const likes = sanitizeText(input.likes, 60);
  const comments = sanitizeText(input.comments, 60);
  const shares = sanitizeText(input.shares, 60);
  const hook = sanitizeText(input.hook, 240);
  const theme = sanitizeText(input.theme, 80);
  const tag = sanitizeText(input.tag, 60);
  const image = sanitizeText(input.image, 500);
  const videoUrl = sanitizeText(input.videoUrl, 500);
  const sortOrder = Math.max(0, Math.min(1000, Number(input.sortOrder) || 0));

  if (!title || !views || !likes || !comments || !shares || !hook || !theme || !tag || !image) {
    throw new Error('Reels бүтээлийн бүх шаардлагатай талбарыг бөглөнө үү.');
  }

  if (isUpdate) {
    try {
      await updateDoc(doc(db, 'reelsWorks', id), {
        title,
        views,
        likes,
        comments,
        shares,
        hook,
        theme,
        tag,
        image,
        videoUrl,
        sortOrder,
        updatedAt: serverTimestamp(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  } else {
    try {
      await setDoc(doc(db, 'reelsWorks', id), {
        title,
        views,
        likes,
        comments,
        shares,
        hook,
        theme,
        tag,
        image,
        videoUrl,
        sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }
}

export async function deleteReelWorkFromFirestore(id: string): Promise<void> {
  const path = `reelsWorks/${id}`;
  try {
    await deleteDoc(doc(db, 'reelsWorks', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDefaultReelsToFirestore(): Promise<void> {
  for (let i = 0; i < instagramReelsWorks.length; i++) {
    const work = instagramReelsWorks[i];
    await saveReelWorkToFirestore(
      {
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
        sortOrder: i,
      },
      false
    );
  }
}
