import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, isAdminUser } from '../firebase';
import { SubmissionItem } from '../utils/submissionsStorage';
import { PricingPackage, SiteContentData, InstagramReelWork } from '../types/portfolio';
import { pricingPackages, instagramReelsWorks } from '../data/portfolioData';
import {
  ContactActionItem,
  subscribeToSubmissions,
  subscribeToContactActions,
  subscribeToPublicServices,
  subscribeToAllServices,
  subscribeToSiteContent,
  subscribeToReelsWorks,
  getDefaultSiteContent,
} from '../utils/firebaseService';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  authError: string | null;
  submissions: SubmissionItem[];
  contactActions: ContactActionItem[];
  publicServices: PricingPackage[];
  adminServices: PricingPackage[];
  hasFirestoreServices: boolean;
  siteContent: SiteContentData;
  hasFirestoreContent: boolean;
  reelsWorks: InstagramReelWork[];
  hasFirestoreReels: boolean;
  firestoreLoading: boolean;
  firestoreError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [contactActions, setContactActions] = useState<ContactActionItem[]>([]);

  const [firestorePublicServices, setFirestorePublicServices] = useState<PricingPackage[]>([]);
  const [firestoreAdminServices, setFirestoreAdminServices] = useState<PricingPackage[]>([]);
  const [firestoreSiteContent, setFirestoreSiteContent] = useState<SiteContentData | null>(null);
  const [firestoreReelsWorks, setFirestoreReelsWorks] = useState<InstagramReelWork[]>([]);

  const [firestoreLoading, setFirestoreLoading] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const isAdmin = isAdminUser(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Public content & services subscriptions (safe public reads, fallback to portfolioData)
  useEffect(() => {
    const unsubServices = subscribeToPublicServices(
      (items) => {
        setFirestorePublicServices(items);
      },
      () => {
        // Fallback silently to default static packages on public view
      }
    );

    const unsubContent = subscribeToSiteContent(
      (content) => {
        setFirestoreSiteContent(content);
      },
      () => {
        // Fallback silently to default static content
      }
    );

    const unsubReels = subscribeToReelsWorks(
      (items) => {
        setFirestoreReelsWorks(items);
      },
      () => {
        // Fallback silently to default static reels
      }
    );

    return () => {
      unsubServices();
      unsubContent();
      unsubReels();
    };
  }, []);

  // Admin-only subscriptions (submissions, contactActions, all services including inactive)
  useEffect(() => {
    if (!authReady || !user || !isAdmin) {
      setSubmissions([]);
      setContactActions([]);
      setFirestoreAdminServices([]);
      setFirestoreLoading(false);
      setFirestoreError(null);
      return;
    }

    setFirestoreLoading(true);
    setFirestoreError(null);

    const unsubSubmissions = subscribeToSubmissions(
      (items) => {
        setSubmissions(items);
        setFirestoreLoading(false);
      },
      (err) => {
        setFirestoreError(err.message);
        setFirestoreLoading(false);
      }
    );

    const unsubActions = subscribeToContactActions(
      (items) => {
        setContactActions(items);
      },
      (err) => {
        setFirestoreError(err.message);
      }
    );

    const unsubAdminServices = subscribeToAllServices(
      (items) => {
        setFirestoreAdminServices(items);
      },
      (err) => {
        setFirestoreError(err.message);
      }
    );

    return () => {
      unsubSubmissions();
      unsubActions();
      unsubAdminServices();
    };
  }, [authReady, user, isAdmin]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Нэвтрэх үед алдаа гарлаа.';
      setAuthError(message);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Гарах үед алдаа гарлаа.';
      setAuthError(message);
    }
  };

  const publicServices =
    firestorePublicServices.length > 0 ? firestorePublicServices : pricingPackages;
  const siteContent = firestoreSiteContent ?? getDefaultSiteContent();
  const reelsWorks =
    firestoreReelsWorks.length > 0 ? firestoreReelsWorks : instagramReelsWorks;

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        authError,
        submissions,
        contactActions,
        publicServices,
        adminServices: firestoreAdminServices,
        hasFirestoreServices: firestoreAdminServices.length > 0,
        siteContent,
        hasFirestoreContent: firestoreSiteContent !== null,
        reelsWorks,
        hasFirestoreReels: firestoreReelsWorks.length > 0,
        firestoreLoading,
        firestoreError,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextValue => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
};
