import React, { useState } from 'react';
import {
  Stethoscope, Layout, BookOpen, Info, Shield, HelpCircle,
  ArrowRight, ArrowLeft, Sparkles, Lock, LogIn, Megaphone,
  BarChart2, CheckCircle2, Award, Zap, Smartphone, Download
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SafeHtmlContent } from '../components/SafeHtmlContent';
import { isNativePlatform } from '../platform/native';

export function WelcomeScreen() {
  const {
    setCurrentScreen, darkMode, currentUser, userRole,
    announcement, setShowAuthModal, setAuthMode
  } = useAppContext();

  const isLoggedIn = !!currentUser && userRole !== 'guest';

  const [step, setStep] = useState(() => {
    if (isLoggedIn) return 2;
    return 1;
  });

  // Handle hardware / app back button on Step 2 (Guest users go back to Step 1; Logged-in users exit directly from Step 2)
  React.useEffect(() => {
    const handleWelcomeBack = (e) => {
      if (!isLoggedIn && step === 2) {
        e.preventDefault();
        setStep(1);
      }
    };
    window.addEventListener('welcome_back_pressed', handleWelcomeBack);
    return () => window.removeEventListener('welcome_back_pressed', handleWelcomeBack);
  }, [step, isLoggedIn]);

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden font-sans flex items-center justify-center p-3 sm:p-6 transition-colors duration-300 ${darkMode ? 'dark bg-gray-950' : 'bg-emerald-950/5'}`}>

      {/* Main Container Wrapper */}
      <div className="relative w-full max-w-[460px] sm:max-w-lg md:max-w-xl mx-auto">
        {/* Decorative Ambient Glows */}
        <div className="absolute -top-6 -left-6 w-44 h-44 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 -right-6 w-44 h-44 bg-teal-500/20 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Main Card Container */}
        <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-emerald-100 dark:border-emerald-900/40 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">

          {/* Header Banner - Common across both steps */}
          <div className="bg-gradient-to-br from-emerald-900/90 via-teal-900/85 to-emerald-950 p-6 sm:p-7 text-white text-center relative overflow-hidden border-b border-emerald-700/30">
            {/* Background Radial Pattern */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

            {/* Back Button (Only on Step 2 for guest users) */}
            {step === 2 && !isLoggedIn && (
              <button
                onClick={() => setStep(1)}
                className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-emerald-100 backdrop-blur-sm border border-white/15 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Back to Overview"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Overview</span>
              </button>
            )}

            {/* Stethoscope Icon Badge */}
            <div className="relative inline-flex items-center justify-center mb-2">
              <div className="absolute inset-0 bg-emerald-400/25 rounded-3xl blur-md pointer-events-none" />
              <div className="relative bg-gradient-to-tr from-emerald-600 to-teal-500 p-3.5 rounded-3xl text-white shadow-xl border border-emerald-400/30 backdrop-blur-sm">
                <Stethoscope size={34} />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              PediaQ
            </h1>
            <p className="text-xs sm:text-sm font-medium text-emerald-100/90 mt-1">
              Your Complete Roadmap to DNB & Board Exams
            </p>
            <div className="mt-2 inline-block">
              <span className="text-[10px] font-semibold text-emerald-200/90 bg-emerald-800/40 px-3 py-0.5 rounded-full border border-emerald-700/50 backdrop-blur-sm">
                By <a href="https://dnbpedia.in" target="_blank" rel="noreferrer" className="text-emerald-200 font-bold underline hover:text-white transition-colors">MedForum.in</a>
              </span>
            </div>
          </div>

          {/* ================================================================ */}
          {/* STEP 1: App Overview & Value Proposition                        */}
          {/* ================================================================ */}
          {step === 1 && (
            <div className="p-6 sm:p-7 space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">

              {/* Introduction Banner */}
              <div className="text-center space-y-1.5">
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  Welcome to Your Study Companion 🩺
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Designed specifically for pediatric PG residents preparing for DNB, DCH, and MD Pediatrics theory exit examinations.
                </p>
              </div>

              {/* Key Features & Why It's Helpful */}
              <div className="space-y-3">
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl font-bold shrink-0 shadow-xs text-xs">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-emerald-950 dark:text-emerald-100">
                      Comprehensive Exam Repository & Chapterwise Study
                    </strong>
                    <span className="text-[11px] sm:text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-tight block mt-0.5">
                      Years of exit exam papers categorized by exam type, year, session, and paper number. Includes Nelson based Chapter wise structured preparation.
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/40 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
                  <div className="p-2 bg-indigo-500 text-white rounded-xl font-bold shrink-0 shadow-xs text-xs">
                    <Award size={16} />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-indigo-950 dark:text-indigo-100">
                      Exam Readiness & Analytics
                    </strong>
                    <span className="text-[11px] sm:text-xs text-indigo-800/90 dark:text-indigo-300/90 leading-tight block mt-0.5">
                      Live readiness score index, high-yield topic matrix, and progress tracking across all devices.
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms Notice */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-2.5 text-center text-[11px] text-amber-900 dark:text-amber-200 leading-tight">
                By entering, you agree to our{' '}
                <button
                  onClick={() => setCurrentScreen('terms')}
                  className="font-bold underline text-amber-950 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
                >
                  Terms, Privacy Policy & Disclaimers
                </button>
              </div>

              {/* Step 1 Primary Action: Enter App */}
              <div className="pt-1 space-y-2.5">
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 px-6 rounded-2xl text-base font-extrabold shadow-xl shadow-emerald-600/25 dark:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 group cursor-pointer"
                >
                  <span>Enter App</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Show "Get Android App" button ONLY on Web App */}
                {!isNativePlatform() && (
                  <a
                    href="https://play.google.com/store/apps/details?id=in.medforum.pediatricspyq"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-slate-900 hover:bg-slate-950 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-white py-3 px-5 rounded-2xl text-sm font-bold shadow-lg border border-slate-700/60 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5 group cursor-pointer"
                  >
                    <Smartphone size={18} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Get Android App</span>
                    <Download size={15} className="text-slate-400 group-hover:text-white transition-colors ml-auto" />
                  </a>
                )}
              </div>

              {/* Footer Metadata */}
              <p className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-1">
                Version 8.0 • Updated October 2026
              </p>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 2: Dashboard Navigation & Access Screen                    */}
          {/* ================================================================ */}
          {step === 2 && (
            <div className="p-6 sm:p-7 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">

              {/* Global Notification Banner for ALL Users (Guest & Logged In) */}
              {announcement && announcement.trim() !== '' && (
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white rounded-2xl p-4 shadow-md border border-emerald-400/40 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shrink-0 mt-0.5">
                      <Megaphone size={18} className="text-white animate-bounce-slow" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-white text-emerald-900 px-2 py-0.5 rounded-full shadow-xs">
                          Notice
                        </span>
                        <span className="text-[10px] text-emerald-100 font-semibold">
                          Exam Update
                        </span>
                      </div>
                      <SafeHtmlContent
                        className="text-xs font-semibold leading-relaxed text-white pt-1 prose prose-invert prose-xs max-w-none [&_a]:underline [&_a]:font-bold [&_a]:text-white"
                        html={announcement}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LOGGED OUT USER: Sign-in Restriction Screen */}
              {!isLoggedIn ? (
                <div className="space-y-4">
                  {/* Restrict Card */}
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-50 dark:from-amber-950/40 dark:via-gray-800 dark:to-amber-950/30 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl p-5 text-center shadow-sm relative overflow-hidden space-y-3">
                    <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md border border-amber-300/40">
                      <Lock size={26} />
                    </div>

                    <div>
                      <h3 className="font-black text-amber-950 dark:text-amber-100 text-base sm:text-lg">
                        Sign In Required to Access
                      </h3>
                      <p className="text-xs text-amber-900/80 dark:text-amber-200/90 leading-relaxed mt-1">
                        Please sign in or create an account to unlock the full question bank, chapter study mode, and study analytics.
                      </p>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          setShowAuthModal(true);
                        }}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 px-4 rounded-2xl text-sm font-extrabold shadow-md shadow-orange-500/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <LogIn size={18} />
                        <span>Sign In / Create Account</span>
                      </button>

                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                        Instant access for all registered medical members
                      </p>
                    </div>
                  </div>

                  {/* Auxiliary Links for Logged out users */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setCurrentScreen('howto')}
                      className="bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 py-2.5 px-3 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
                    >
                      <Info size={16} className="text-indigo-500 shrink-0" />
                      <span>How To Use</span>
                    </button>
                    <button
                      onClick={() => setCurrentScreen('support')}
                      className="bg-slate-50 dark:bg-gray-800/80 border border-slate-200 dark:border-gray-700 py-2.5 px-3 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
                    >
                      <HelpCircle size={16} className="text-emerald-500 shrink-0" />
                      <span>Support</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* LOGGED IN USER: 2-Column Responsive Navigation Grid */
                <div className="space-y-4">

                  {/* Section Title */}
                  <div className="flex items-center justify-between pt-1">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Study Hub & Navigation
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Ready to Study
                    </span>
                  </div>

                  {/* 2-Column Responsive Grid Layout (2-Column on Mobile & Desktop) */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">

                    {/* Button 1: All Question Bank (Primary Brand Emerald) */}
                    <button
                      onClick={() => setCurrentScreen('app')}
                      className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-900 text-white p-3 sm:p-4 rounded-2xl shadow-md border border-emerald-400/40 dark:border-emerald-600/50 transition-all duration-200 hover:brightness-110 active:scale-[0.98] flex flex-col justify-between items-start text-left min-h-[98px] sm:min-h-[105px] group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between w-full relative z-10">
                        <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                          <BookOpen size={18} className="text-white sm:w-5 sm:h-5" />
                        </div>
                        <ArrowRight size={15} className="text-emerald-100 group-hover:translate-x-1 transition-transform sm:w-4 sm:h-4" />
                      </div>
                      <div className="mt-2.5 sm:mt-3 relative z-10">
                        <span className="text-xs sm:text-sm font-extrabold block text-white tracking-tight">All Question Bank</span>
                        <span className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium block leading-tight">Complete DNB & MD papers</span>
                      </div>
                    </button>

                    {/* Button 2: Chapter Wise Study (Secondary Royal Indigo) */}
                    <button
                      onClick={() => setCurrentScreen('chapters')}
                      className="bg-gradient-to-br from-indigo-600 via-purple-650 to-indigo-800 dark:from-indigo-800 dark:via-purple-800 dark:to-indigo-900 text-white p-3 sm:p-4 rounded-2xl shadow-md border border-indigo-400/40 dark:border-indigo-600/50 transition-all duration-200 hover:brightness-110 active:scale-[0.98] flex flex-col justify-between items-start text-left min-h-[98px] sm:min-h-[105px] group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between w-full relative z-10">
                        <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                          <Layout size={18} className="text-white sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-black bg-amber-400 text-amber-950 px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-0.5 sm:gap-1">
                          <Sparkles size={8} /> NEW
                        </span>
                      </div>
                      <div className="mt-2.5 sm:mt-3 relative z-10">
                        <span className="text-xs sm:text-sm font-extrabold block text-white tracking-tight">Chapter Wise Study</span>
                        <span className="text-[10px] sm:text-[11px] text-indigo-100/90 font-medium block leading-tight">Curriculum modules & topics</span>
                      </div>
                    </button>

                    {/* Button 3: Analytics and Study Progress (Pastel Green Theme) */}
                    <button
                      onClick={() => setCurrentScreen('analytics')}
                      className="bg-gradient-to-br from-emerald-600/90 via-teal-600/85 to-emerald-700 dark:from-emerald-750 dark:via-teal-800 dark:to-emerald-850 text-white p-3 sm:p-4 rounded-2xl shadow-md border border-emerald-300/50 dark:border-emerald-600/50 transition-all duration-200 hover:brightness-110 active:scale-[0.98] flex flex-col justify-between items-start text-left min-h-[98px] sm:min-h-[105px] group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-emerald-300/25 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between w-full relative z-10">
                        <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                          <BarChart2 size={18} className="text-white sm:w-5 sm:h-5" />
                        </div>
                        <ArrowRight size={15} className="text-emerald-100 group-hover:translate-x-1 transition-transform sm:w-4 sm:h-4" />
                      </div>
                      <div className="mt-2.5 sm:mt-3 relative z-10">
                        <span className="text-xs sm:text-sm font-extrabold block text-white tracking-tight">Analytics & Progress</span>
                        <span className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium block leading-tight">Readiness score & statistics</span>
                      </div>
                    </button>

                    {/* Button 4: Support (Warm Amber Accent with Rich Burnt Orange Corner) */}
                    <button
                      onClick={() => setCurrentScreen('support')}
                      className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 dark:from-amber-600 dark:via-orange-600 dark:to-amber-800 text-white p-3 sm:p-4 rounded-2xl shadow-md border border-amber-400/40 dark:border-amber-600/50 transition-all duration-200 hover:brightness-110 active:scale-[0.98] flex flex-col justify-between items-start text-left min-h-[98px] sm:min-h-[105px] group cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute bottom-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-orange-700/35 dark:bg-orange-800/40 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between w-full relative z-10">
                        <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                          <HelpCircle size={18} className="text-white sm:w-5 sm:h-5" />
                        </div>
                        <ArrowRight size={15} className="text-amber-100 group-hover:translate-x-1 transition-transform sm:w-4 sm:h-4" />
                      </div>
                      <div className="mt-2.5 sm:mt-3 relative z-10">
                        <span className="text-xs sm:text-sm font-extrabold block text-white tracking-tight">Support & Help</span>
                        <span className="text-[10px] sm:text-[11px] text-amber-100/90 font-medium block leading-tight">Guidance, FAQ & contact</span>
                      </div>
                    </button>

                  </div>

                  {/* Auxiliary Bottom Toolbar */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
                    <button
                      onClick={() => setCurrentScreen('howto')}
                      className="py-2.5 px-3 rounded-2xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Info size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>How To Use</span>
                    </button>
                    <button
                      onClick={() => setCurrentScreen('terms')}
                      className="py-2.5 px-3 rounded-2xl text-xs font-extrabold text-amber-900 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Shield size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Terms & Policy</span>
                    </button>
                  </div>

                </div>
              )}

              {/* Footer Metadata */}
              <p className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-1">
                Version 8.0 • Updated October 2026
              </p>

            </div>
          )}

        </div>
      </div>
    </div >
  );
}
