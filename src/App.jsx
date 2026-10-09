import React, { useEffect } from 'react';
import { Plus, Megaphone } from 'lucide-react';

import { AppProvider, useAppContext } from './app/context/AppContext';
import { Header } from './app/components/Header';
import { NavigationFooter } from './app/components/NavigationFooter';
import { AuthModal } from './app/components/AuthModal';
import { InfoModal } from './app/components/InfoModal';
import { GlobalAlerts } from './app/components/GlobalAlerts';
import { AdminPanel } from './app/components/AdminPanel';
import { ImageZoomModal } from './app/components/ImageZoomModal';
import {
  BannedScreen, VerificationBlockedScreen, LoginRequiredView
} from './app/components/StatusScreens';

import { WelcomeScreen } from './app/screens/WelcomeScreen';
import { HowToScreen } from './app/screens/HowToScreen';
import { TermsScreen } from './app/screens/TermsScreen';
import { SupportScreen } from './app/screens/SupportScreen';
import { AboutScreen } from './app/screens/AboutScreen';
import { AnalyticsScreen } from './app/screens/AnalyticsScreen';
import { ChapterStudyScreen } from './app/screens/ChapterStudyScreen';
import { StudentStudyScreen } from './app/screens/StudentStudyScreen';
import { ProfileScreen } from './app/screens/ProfileScreen';
import { UpgradeGoldScreen } from './app/screens/UpgradeGoldScreen';

import { registerBackButtonHandler, initNativePushNotifications } from './app/platform/native';
import { openWordPressWithAutoLogin } from './app/utils/wpSync';

import { SafeHtmlContent } from './app/components/SafeHtmlContent';

function AppLayout() {
  const {
    currentScreen, setCurrentScreen, viewMode, setViewMode, userRole,
    currentUser, darkMode, announcement
  } = useAppContext();

  // Dynamic Title & SEO Synchronization per screen
  useEffect(() => {
    const titleMap = {
      welcome: 'Welcome | PediaQ (Pediatrics PYQ) Question Bank',
      howto: 'How To Use | PediaQ (Pediatrics PYQ) Guide',
      terms: 'Terms & Conditions | PediaQ',
      support: 'Support & Help | PediaQ',
      about: 'About Us & Version 8.0 | PediaQ (Pediatrics PYQ)',
      analytics: 'Exam Readiness Analytics | PediaQ (Pediatrics PYQ)',
      chapters: 'Chapter Study Mode | PediaQ (Pediatrics PYQ)',
      profile: 'User Profile & Settings | PediaQ',
      upgrade: 'Upgrade to GOLD Membership & UPI Payment | PediaQ',
      study: 'All Questions Bank | DNB & DCH PediaQ (Pediatrics PYQ)'
    };
    document.title = titleMap[currentScreen] || 'PediaQ (Pediatrics PYQ) Question Bank | DNB & Board Exams by MedForum.in';
  }, [currentScreen]);

  // Global Interceptor for internal screen links and dnbpedia.in links (including HTML text editor content)
  useEffect(() => {
    const validScreens = new Set([
      'welcome', 'study', 'howto', 'terms', 'support', 'about', 'analytics', 'chapters', 'profile', 'upgrade'
    ]);

    const handleGlobalLinkClick = async (event) => {
      const anchor = event.target.closest('a');
      if (!anchor) return;

      const rawHref = anchor.getAttribute('href') || '';
      const dataScreen = anchor.getAttribute('data-screen');

      // 1. Check for data-screen attribute (e.g. <a href="#" data-screen="support">)
      if (dataScreen && validScreens.has(dataScreen.toLowerCase())) {
        event.preventDefault();
        setCurrentScreen(dataScreen.toLowerCase());
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (!rawHref) return;
      const hrefClean = rawHref.trim().toLowerCase();

      // 2. Check for hash/screen syntax (e.g. href="#screen:support", href="#screen=support", href="#support", href="app://support", href="/app/support")
      let targetScreen = null;

      if (hrefClean.startsWith('#screen:') || hrefClean.startsWith('#screen=')) {
        targetScreen = hrefClean.split(/[:=]/)[1];
      } else if (hrefClean.startsWith('app://')) {
        targetScreen = hrefClean.replace('app://', '');
      } else if (hrefClean.startsWith('/app/')) {
        targetScreen = hrefClean.replace('/app/', '');
      } else if (hrefClean.startsWith('#') && hrefClean.length > 1) {
        const potentialScreen = hrefClean.substring(1);
        if (validScreens.has(potentialScreen)) {
          targetScreen = potentialScreen;
        }
      }

      if (targetScreen && validScreens.has(targetScreen)) {
        event.preventDefault();
        setCurrentScreen(targetScreen);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 3. Bypass non-HTTP protocols (mailto:, tel:, sms:, whatsapp:, etc.)
      if (hrefClean.startsWith('mailto:') || hrefClean.startsWith('tel:') || hrefClean.startsWith('sms:') || hrefClean.startsWith('whatsapp:')) {
        return;
      }

      // 4. Intercept dnbpedia.in web page links for SSO auto-login
      const urlString = anchor.href ? anchor.href.toLowerCase() : '';
      if (urlString.includes('dnbpedia.in')) {
        const isMediaFile = /\.(png|jpe?g|gif|webp|svg|pdf|zip|rar)$/i.test(urlString);
        if (isMediaFile) return;

        try {
          const urlObj = new URL(anchor.href);
          // Only intercept HTTP/HTTPS web page navigation to dnbpedia.in
          if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return;
          }

          event.preventDefault();
          const targetPath = urlObj.pathname + urlObj.search;
          await openWordPressWithAutoLogin(targetPath);
        } catch {
          // If URL parsing fails, let standard browser action proceed
          return;
        }
      }
    };

    document.addEventListener('click', handleGlobalLinkClick);
    return () => document.removeEventListener('click', handleGlobalLinkClick);
  }, [setCurrentScreen]);

  // Screen Router
  if (currentScreen === 'welcome') return <WelcomeScreen />;
  if (currentScreen === 'howto') return <HowToScreen />;
  if (currentScreen === 'terms') return <TermsScreen />;
  if (currentScreen === 'support') return <SupportScreen />;
  if (currentScreen === 'about') return <AboutScreen />;
  if (currentScreen === 'analytics') return <AnalyticsScreen />;
  if (currentScreen === 'chapters') return <ChapterStudyScreen />;
  if (currentScreen === 'profile') return <ProfileScreen />;
  if (currentScreen === 'upgrade') return <UpgradeGoldScreen />;

  // Main App Shell (Student / Admin View)
  return (
    <div className={`min-h-screen font-sans flex justify-center overflow-x-hidden transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-5xl xl:max-w-5xl mx-auto bg-white dark:bg-slate-900 min-h-screen shadow-2xl border-x border-slate-200/50 dark:border-slate-800/60 flex flex-col relative overflow-x-hidden transition-colors duration-300">

        {/* Global Header */}
        <Header />

        {/* Content Body based on view mode */}
        <div className="flex-1 p-3 pb-24 overflow-y-auto max-w-full overflow-x-hidden">
          {userRole === 'banned' ? (
            <BannedScreen />
          ) : viewMode === 'admin' ? (
            userRole === 'admin' ? (
              <AdminPanel />
            ) : (
              <LoginRequiredView message="Admin privileges are required to access this panel." />
            )
          ) : (
            <>
              {announcement && (
                <div className="mb-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 dark:from-blue-950/40 dark:via-gray-900 dark:to-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 px-4 py-3 rounded-2xl shadow-sm flex gap-3.5 items-start animate-in fade-in duration-300">
                  <div className="p-2 bg-blue-500 text-white rounded-xl shadow-sm shrink-0">
                    <Megaphone size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-200 mb-1">Announcement</h4>
                    <SafeHtmlContent className="prose prose-sm prose-blue dark:prose-invert max-w-none text-blue-800 dark:text-blue-200 text-xs leading-relaxed" html={announcement} />
                  </div>
                </div>
              )}

              {currentUser && !currentUser.emailVerified && userRole !== 'admin' ? (
                <VerificationBlockedScreen />
              ) : !currentUser ? (
                <LoginRequiredView />
              ) : (
                <StudentStudyScreen />
              )}
            </>
          )}
        </div>

        {/* Floating Add Question Button for Admin in Student View */}
        {viewMode === 'student' && userRole === 'admin' && (
          <div className="fixed bottom-16 right-6 z-40">
            <button
              onClick={() => setViewMode('admin')}
              className="bg-teal-600 hover:bg-teal-700 text-white p-3.5 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              title="Switch to Admin Panel"
            >
              <Plus size={24} />
            </button>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 w-full max-w-full md:max-w-2xl lg:max-w-5xl xl:max-w-5xl mx-auto p-1.5 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <NavigationFooter />
        </div>

      </div>
    </div>
  );
}

function GlobalEffectsWrapper() {
  const { viewMode, goBack, currentUser } = useAppContext();

  // Android Native Back Button registration
  useEffect(() => {
    return registerBackButtonHandler(() => {
      goBack();
    });
  }, [goBack]);

  // Native Push Notifications setup
  useEffect(() => {
    if (currentUser) {
      initNativePushNotifications();
    }
  }, [currentUser]);

  useEffect(() => {
    const preventDefaultHandler = e => { e.preventDefault(); };

    const keydownHandler = e => {
      // Disable F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+Shift+I / Cmd+Option+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect/Console/Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+U (View Source) and Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };

    if (viewMode === 'student') {
      document.addEventListener('copy', preventDefaultHandler, true);
      document.addEventListener('cut', preventDefaultHandler, true);
      document.addEventListener('contextmenu', preventDefaultHandler, true);
      document.addEventListener('keydown', keydownHandler, true);
      document.body.classList.add('no-select');
    } else {
      document.body.classList.remove('no-select');
    }

    return () => {
      document.removeEventListener('copy', preventDefaultHandler, true);
      document.removeEventListener('cut', preventDefaultHandler, true);
      document.removeEventListener('contextmenu', preventDefaultHandler, true);
      document.removeEventListener('keydown', keydownHandler, true);
      document.body.classList.remove('no-select');
    };
  }, [viewMode]);
  return null;
}

function AuthModalWrapper() {
  const { showAuthModal } = useAppContext();
  return showAuthModal ? <AuthModal /> : null;
}

function ImageZoomWrapper() {
  const { zoomImage, closeImageZoom } = useAppContext();
  return zoomImage ? <ImageZoomModal src={zoomImage.src} alt={zoomImage.alt} onClose={closeImageZoom} /> : null;
}

export default function App() {
  return (
    <AppProvider>
      <GlobalEffectsWrapper />
      <AppLayout />
      <AuthModalWrapper />
      <InfoModal />
      <GlobalAlerts />
      <ImageZoomWrapper />
    </AppProvider>
  );
}