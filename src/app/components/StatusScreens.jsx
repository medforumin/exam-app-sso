import React from 'react';
import { Lock, AlertTriangle, ExternalLink, RefreshCw, Ban, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function LoginRequiredView({ message }) {
  const { setAuthMode, setShowAuthModal, navigateTo } = useAppContext();

  return (
    <div className="py-1 sm:py-2 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
      {/* Decorative Background Blur Glows */}
      <div className="relative w-full max-w-md mx-auto">
        <div className="absolute -top-6 -left-6 w-32 h-32 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Main Card Container */}
        <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-teal-100 dark:border-teal-900/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 text-center overflow-hidden">

          {/* Top Lock Badge Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-indigo-500 rounded-2xl blur-sm opacity-40 animate-pulse" />
            <div className="relative bg-gradient-to-tr from-teal-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md">
              <Lock size={26} />
            </div>
          </div>

          {/* Heading Section */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {message ? 'Access Restricted' : 'Welcome to PediaQ'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-xs mx-auto leading-normal">
              {message || 'Log in or register to access the full question bank and high-yield study tools.'}
            </p>
          </div>

          {/* Compact Access Info Badge */}
          <div className="bg-gradient-to-r from-amber-50 to-teal-50 dark:from-amber-950/30 dark:to-teal-950/30 border border-amber-200/60 dark:border-amber-700/40 rounded-xl p-2.5 text-left text-xs flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm">💡</span>
              <span className="text-gray-700 dark:text-gray-200 text-[11px] leading-tight">
                <strong>Standard & Gold</strong> access tiers available.
              </span>
            </div>
            <a
              href="https://dnbpedia.in/pyq/memberships"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 font-bold text-amber-700 dark:text-amber-300 hover:underline text-[11px] flex items-center gap-0.5"
            >
              Plans <ExternalLink size={10} />
            </a>
          </div>

          {/* Action Button */}
          <div className="pt-0.5 space-y-1.5">
            <button
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-extrabold py-2.5 sm:py-3 px-5 rounded-xl shadow-md shadow-teal-600/20 dark:shadow-none transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              Log In / Register <ArrowRight size={16} />
            </button>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
              By logging in or creating an account, you agree to our{' '}
              <button
                type="button"
                onClick={() => navigateTo('terms')}
                className="text-teal-600 dark:text-teal-400 font-semibold underline hover:text-teal-700"
              >
                Terms & Conditions
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export function VerificationBlockedScreen() {
  const { handleResendVerification } = useAppContext();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-in fade-in">
      <div className="p-6 bg-yellow-100 dark:bg-yellow-900/50 rounded-full"><AlertTriangle size={64} className="text-yellow-600 dark:text-yellow-400" /></div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Verification Required</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto">Please verify your email address to access the question bank. Check your inbox and spam folder.</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button onClick={handleResendVerification} className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2"><ExternalLink size={18} /> Resend Verification Email</button>
        <button onClick={() => window.location.reload()} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"><RefreshCw size={18} /> I've Verified, Refresh</button>
      </div>
    </div>
  );
}

export function BannedScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-in fade-in">
      <div className="p-6 bg-red-100 dark:bg-red-900/50 rounded-full animate-bounce-slow"><Ban size={64} className="text-red-500 dark:text-red-400" /></div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Access Revoked</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto">Your account has been suspended due to suspicious activity or violation of terms.</p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
        <p className="text-gray-500 dark:text-gray-400 mb-1">Contact Support:</p>
        <p className="font-mono font-bold text-gray-800 dark:text-gray-200 select-all">pediatrics@medforum.in</p>
      </div>
    </div>
  );
}
