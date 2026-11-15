import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SpotlightHero } from './components/SpotlightHero';
import { SpaceEduHero } from './components/SpaceEduHero';
import { AboutSection } from './components/AboutSection';
import { InstagramStatsSection } from './components/InstagramStatsSection';
import { SkillsSection } from './components/SkillsSection';
import { PricingSection } from './components/PricingSection';
import { PrinciplesSection } from './components/PrinciplesSection';
import { MarketingCollabSection } from './components/MarketingCollabSection';
import { ContactSection } from './components/ContactSection';
import { SubmissionsInboxModal } from './components/SubmissionsInboxModal';
import { Footer } from './components/Footer';
import { AdminPortal } from './components/admin/AdminPortal';
import { profileData, DEFAULT_NETLIFY_SUBDOMAIN } from './data/portfolioData';
import { useFirebase } from './contexts/FirebaseContext';
import { Sparkles, Orbit } from 'lucide-react';

const isAdminRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname === '/admin' ||
    window.location.pathname.startsWith('/admin/') ||
    window.location.hash === '#/admin'
  );
};

export default function App() {
  const [netlifySubdomain] = useState<string>(DEFAULT_NETLIFY_SUBDOMAIN);
  const [heroTheme, setHeroTheme] = useState<'nival' | 'space'>('nival');
  const [activeSection, setActiveSection] = useState('home');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState<boolean>(isAdminRoute);
  const { isAdmin, submissions, siteContent } = useFirebase();

  const submissionsCount = isAdmin
    ? submissions.filter((s) => s.status === 'new').length
    : 0;

  const liveProfile = {
    ...profileData,
    greeting: siteContent.greeting,
    title: siteContent.heroTitle,
    subtitle: siteContent.heroSubtitle,
    bio: [siteContent.bioPrimary, siteContent.bioSecondary],
    email: siteContent.email,
    phone: siteContent.phone,
    instagramHandle: siteContent.instagramHandle,
    location: siteContent.location,
    socials: {
      ...profileData.socials,
      instagram: siteContent.instagramUrl,
    },
  };

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminView(isAdminRoute());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const openAdminPortal = () => {
    setIsAdminView(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const exitAdminPortal = () => {
    setIsAdminView(false);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    } else if (window.location.hash === '#/admin') {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleExploreCollab = () => {
    const el = document.getElementById('collaboration');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll spy active section
  useEffect(() => {
    if (isAdminView) return;
    const handleScroll = () => {
      const sections = ['home', 'about', 'works', 'skills', 'pricing', 'principles', 'collaboration', 'contact'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAdminView]);

  if (isAdminView) {
    return <AdminPortal onExitAdmin={exitAdminPortal} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors selection:bg-pink-500 selection:text-white">
      
      {/* Navigation */}
      <Navbar
        currentNetlifySub={netlifySubdomain}
        onOpenNetlifySettings={() => {}}
        activeSection={activeSection}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenAdmin={openAdminPortal}
        submissionsCount={submissionsCount}
      />

      {/* Floating Theme Switcher between Nival & SpaceEdu */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-pink-500/10">
          <button
            onClick={() => setHeroTheme('nival')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              heroTheme === 'nival'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Nival: Гэрлийн тусгалтай футуристик загвар"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nival загвар</span>
          </button>

          <button
            onClick={() => setHeroTheme('space')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              heroTheme === 'space'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400'
            }`}
            title="SpaceEdu: Гараг сэлгэх сансрын загвар"
          >
            <Orbit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Сансрын загвар</span>
          </button>
        </div>
      </div>

      <main>
        {/* 1. Hero Section (Dynamic) */}
        {heroTheme === 'nival' ? (
          <SpotlightHero
            profile={liveProfile}
            netlifySubdomain={netlifySubdomain}
            onExploreProjects={handleExploreCollab}
          />
        ) : (
          <SpaceEduHero
            profile={liveProfile}
            netlifySubdomain={netlifySubdomain}
            onExploreProjects={handleExploreCollab}
          />
        )}

        {/* 2. "Миний тухай" (About Section) */}
        <AboutSection />

        {/* 3. "Миний бүтээлүүд" & Инстаграм аккаунтын үзэлт, хандалтын тоо */}
        <InstagramStatsSection />

        {/* 4. "Миний эзэмшсэн ур чадварууд" (3 хэсэг бүхий ур чадвар) */}
        <SkillsSection />

        {/* 5. "Хамтын ажиллагааны нөхцөл & Үнийн санал" (Reel хийх багцууд) */}
        <PricingSection />

        {/* 6. "Анхаарах зүйлс & Миний зарчим" (Мөрийтэй тоглоом, ёс бус зүйл сурталчлахгүй) */}
        <PrinciplesSection />

        {/* 7. Хамтын ажиллагааны маягт (Marketing Collaboration Form) */}
        <MarketingCollabSection />

        {/* 8. Холбоо барих хэсэг (Contact Section) */}
        <ContactSection />
      </main>

      {/* 9. Footer (Хамгийн доор: "Your vision, my creativity. our impact.") */}
      <Footer onOpenAdmin={openAdminPortal} />

      {/* 10. Submissions Inbox Modal for Anand */}
      <SubmissionsInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
      />

    </div>
  );
}
