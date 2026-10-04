import React, { useState } from 'react';
import { User, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ENABLE_FIREBASE } from '../config';

export function AuthModal() {
  const { authMode, setAuthMode, setShowAuthModal, handleAuthSubmit, handleGoogleAuth, navigateTo } = useAppContext();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState(''); const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isReset = authMode === 'reset';

  const onGoogleAuthClick = async () => {
    setIsGoogleLoading(true);
    try {
      await handleGoogleAuth();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-teal-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3"><User size={24} className="text-teal-600 dark:text-teal-400" /></div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{isReset ? 'Reset Password' : (authMode === 'login' ? 'Welcome Back' : 'Create Account')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{isReset ? 'Enter your email to receive a reset link.' : (authMode === 'login' ? 'Enter your credentials to access.' : 'Register to start your preparation.')}</p>
        </div>

        {!isReset && (
          <div className="mb-4">
            <button
              type="button"
              onClick={onGoogleAuthClick}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 py-2.5 px-4 rounded-lg font-semibold text-sm shadow-sm transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {isGoogleLoading ? 'Connecting...' : (authMode === 'login' ? 'Sign in with Google' : 'Register with Google')}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-400 font-medium">Or email</span>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={(e) => handleAuthSubmit(e, email, password, mobile, name)} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Full Name</label>
              <input type="text" required className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm dark:bg-gray-700 dark:text-white" placeholder="Dr. John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Email Address</label>
            <input type="email" required className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm dark:bg-gray-700 dark:text-white" placeholder="doctor@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Mobile Number</label>
              <input type="tel" required className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm dark:bg-gray-700 dark:text-white" placeholder="9876543210" value={mobile} onChange={e => setMobile(e.target.value)} />
            </div>
          )}
          {!isReset && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={!isReset}
                  className="w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}
          {authMode === 'login' && !isReset && <div className="text-right"><button type="button" onClick={() => setAuthMode('reset')} className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Forgot Password?</button></div>}
          <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-teal-200 dark:shadow-none transition-all">{isReset ? 'Send Reset Link' : (authMode === 'login' ? 'Login' : 'Sign Up')}</button>
        </form>
        {!ENABLE_FIREBASE && authMode === 'login' && (
          <div className="mt-4 p-3 bg-teal-50 dark:bg-gray-700 border border-teal-100 dark:border-gray-600 rounded-lg text-xs text-teal-800 dark:text-teal-200">
            <p className="font-bold mb-1 border-b border-teal-200 dark:border-gray-600 pb-1">Demo Credentials:</p>
            <div className="grid grid-cols-[40px_1fr] gap-y-1"><span className="font-semibold">Admin:</span> <span className="font-mono">admin@medforum.in</span><span className="font-semibold">Gold:</span> <span className="font-mono">gold@user.com</span><span className="font-semibold">User:</span> <span className="font-mono">(any email)</span></div>
          </div>
        )}
        
        {/* Terms and Conditions Notice */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
            By logging in or creating an account, you agree to our{' '}
            <button
              type="button"
              onClick={() => { setShowAuthModal(false); navigateTo('terms'); }}
              className="text-teal-600 dark:text-teal-400 font-semibold underline hover:text-teal-700"
            >
              Terms & Conditions
            </button>
          </p>
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isReset ? <button onClick={() => setAuthMode('login')} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">Back to Login</button> :
              <>{authMode === 'login' ? "Don't have an account? " : "Already have an account? "}<button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">{authMode === 'login' ? 'Register' : 'Login'}</button></>
            }
          </p>
          <button onClick={() => setShowAuthModal(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
}
