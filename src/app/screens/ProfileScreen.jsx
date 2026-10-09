import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, UserCog, User, Smartphone, Mail, Save, Loader2, Key, ShieldAlert, Eye, EyeOff,
  Crown, ExternalLink, Check, Copy, ShieldCheck, Calendar, Fingerprint, LogOut
} from 'lucide-react';
import {
  updateProfile, updatePassword, updateEmail, reauthenticateWithCredential,
  EmailAuthProvider, sendEmailVerification
} from "firebase/auth";
import { setDoc, getDoc, doc } from "firebase/firestore";

import { ENABLE_FIREBASE } from '../config';
import { useAppContext, db, auth } from '../context/AppContext';
import { customConfirm } from '../platform/native';
import { NavigationFooter } from '../components/NavigationFooter';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';
import { LoginRequiredView } from '../components/StatusScreens';
import { getGoldStartAt } from '../utils/membershipSchema';

export function ProfileScreen() {
  const { currentUser, setCurrentScreen, darkMode, setUserName, handleLogout, goBack, userRole, enableInAppUpiUpgrade } = useAppContext();


  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    mobile: '',
    email: currentUser?.email || ''
  });
  const [membershipData, setMembershipData] = useState({
    role: userRole || 'standard',
    goldStartAt: null,
    goldExpiry: null
  });
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: '',
    emailPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' or 'security'

  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
      if (ENABLE_FIREBASE && db && currentUser) {
        try {
          const docSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (docSnap.exists() && isMounted) {
            const data = docSnap.data();
            setFormData(prev => ({
              ...prev,
              email: currentUser.email || data.email || prev.email || '',
              mobile: data.mobile || '',
              name: data.name || currentUser.displayName || ''
            }));
            setMembershipData({
              role: data.role || userRole || 'standard',
              goldStartAt: getGoldStartAt(data),
              goldExpiry: data.goldExpiry || null
            });
            if (data.name && data.name !== currentUser.displayName) {
              setUserName(data.name);
            }
          } else if (isMounted) {
            setFormData(prev => ({
              ...prev,
              email: currentUser.email || prev.email || ''
            }));
          }
        } catch (e) {
          console.error("Error fetching profile:", e);
        }
      } else {
        const mockUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
        const role = localStorage.getItem('user_role') || mockUser.role || userRole || 'standard';
        setMembershipData({
          role,
          goldStartAt: mockUser.goldStartAt || null,
          goldExpiry: mockUser.goldExpiry || null
        });
        if (isMounted) {
          setFormData(prev => ({
            ...prev,
            email: mockUser.email || currentUser?.email || prev.email || '',
            name: mockUser.name || prev.name || '',
            mobile: mockUser.mobile || prev.mobile || ''
          }));
        }
      }
    };
    fetchUserData();
    return () => { isMounted = false; };
  }, [currentUser, setUserName, userRole]);

  if (!currentUser || userRole === 'guest') {
    return (
      <RestrictedAccessWrapper title="My Profile">
        <LoginRequiredView message="Please log in or create an account to view and manage your user profile and settings." />
      </RestrictedAccessWrapper>
    );
  }

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      let date;
      if (typeof val === 'object' && val !== null && val.seconds !== undefined) {
        date = new Date(val.seconds * 1000);
      } else if (typeof val === 'object' && val !== null && typeof val.toDate === 'function') {
        date = val.toDate();
      } else {
        date = new Date(val);
      }
      return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const effectiveRole = membershipData.role || userRole || 'standard';
  const isGold = effectiveRole === 'gold';

  const displayUid = currentUser?.uid || auth?.currentUser?.uid || (localStorage.getItem('mockUser') ? JSON.parse(localStorage.getItem('mockUser')).uid : null) || 'N/A';

  const handleCopyUid = () => {
    if (displayUid && displayUid !== 'N/A') {
      navigator.clipboard.writeText(displayUid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (ENABLE_FIREBASE && auth) {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: formData.name });
        }
        await setDoc(doc(db, "users", currentUser.uid), {
          name: formData.name,
          mobile: formData.mobile
        }, { merge: true });

        setUserName(formData.name);
        alert("Profile details updated successfully!");
      } else {
        const mockUser = JSON.parse(localStorage.getItem('mockUser') || '{}');
        mockUser.name = formData.name;
        mockUser.mobile = formData.mobile;
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        setUserName(formData.name);
        alert("Profile updated (Mock Mode)");
      }
    } catch (err) {
      alert("Error updating profile: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      return alert("New passwords do not match!");
    }
    if (securityData.newPassword.length < 6) {
      return alert("Password must be at least 6 characters.");
    }

    setIsLoading(true);
    try {
      if (ENABLE_FIREBASE && auth && auth.currentUser) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, securityData.currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, securityData.newPassword);
        alert("Password updated successfully!");
        setSecurityData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        alert("Password update simulated (Mock Mode)");
      }
    } catch (err) {
      if (err.code === 'auth/wrong-password') alert("Current password is incorrect.");
      else alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (!securityData.newEmail) return;

    customConfirm("Changing your email will log you out and require verification of the new address before you can log in again. Proceed?", async () => {
      setIsLoading(true);
      try {
        if (ENABLE_FIREBASE && auth && auth.currentUser) {
          const credential = EmailAuthProvider.credential(auth.currentUser.email, securityData.emailPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          await updateEmail(auth.currentUser, securityData.newEmail);
          await sendEmailVerification(auth.currentUser);
          alert("Email updated! A verification link has been sent to your new email. You will now be logged out.");
          await handleLogout();
        } else {
          alert("Email update simulated (Mock Mode).");
        }
      } catch (err) {
        if (err.code === 'auth/wrong-password') alert("Current password is incorrect.");
        else if (err.code === 'auth/email-already-in-use') alert("This email is already in use by another account.");
        else alert("Error: " + err.message);
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className={`min-h-screen font-sans flex justify-center overflow-x-hidden transition-colors duration-500 ${darkMode ? 'dark bg-gray-950 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="w-full max-w-full md:max-w-2xl lg:max-w-5xl xl:max-w-5xl mx-auto bg-white dark:bg-gray-900 min-h-screen shadow-xl flex flex-col relative overflow-x-hidden transition-colors duration-300">

        {/* Header */}
        <div className="p-3 sm:p-5 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2.5 text-teal-600 dark:text-teal-400 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <button onClick={() => goBack()} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 sm:p-2 rounded-full transition-colors bg-gray-50 dark:bg-gray-800" title="Go Back">
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <h2 className="font-extrabold text-base sm:text-xl text-gray-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
              <UserCog size={20} className="sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" /> My Profile
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline-flex text-xs font-bold px-3 py-1 rounded-full border ${isGold ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700' : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-600'}`}>
              {isGold ? '✨ Gold Member' : effectiveRole === 'admin' ? '🛡️ Admin' : 'Standard Plan'}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="Log Out"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-6 md:p-8 space-y-3.5 sm:space-y-6 md:space-y-8 overflow-y-auto pb-24 max-w-full overflow-x-hidden animate-slide-in">

          {/* User Hero Banner */}
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-900/30 dark:via-emerald-900/15 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-teal-100 dark:border-teal-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-4 text-center sm:text-left min-w-0 w-full sm:w-auto flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-tr from-teal-600 to-emerald-500 text-white rounded-full flex items-center justify-center font-black text-lg sm:text-2xl md:text-3xl shadow-md sm:shadow-lg shadow-teal-500/20 shrink-0">
                {(formData.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 w-full sm:w-auto">
                <h3 className="font-extrabold text-base sm:text-2xl text-gray-900 dark:text-white truncate">
                  {formData.name || 'Unnamed Member'}
                </h3>
                <p className="text-[11px] sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {currentUser?.email || 'No email associated'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                  <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border ${isGold ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-gray-600'}`}>
                    {isGold ? 'Gold Account' : effectiveRole === 'admin' ? 'Admin Access' : 'Standard Tier'}
                  </span>
                  {currentUser?.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck size={11} className="sm:w-3 sm:h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Slim Manage Membership at dnbpedia.in Button */}
            <a
              href="https://dnbpedia.in/membership-account/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-sm shrink-0 active:scale-95 group"
            >
              <span>View Membership at dnbpedia.in</span>
              <ExternalLink size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* Membership Details Card */}
          <div className={`p-3 sm:p-6 rounded-xl sm:rounded-2xl border transition-all ${isGold
            ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-50/90 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-amber-950/40 border-amber-200 dark:border-amber-800/60 shadow-sm'
            : 'bg-slate-50 dark:bg-gray-700/50 border-slate-200 dark:border-gray-600 shadow-sm'
            }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {isGold ? (
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                    <Crown size={16} className="sm:w-5 sm:h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                    <User size={16} className="sm:w-5 sm:h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Membership Tier</div>
                  <div className="font-extrabold text-sm sm:text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    {isGold ? 'Gold Member' : effectiveRole === 'admin' ? 'Administrator' : 'Standard Member'}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2">
                {enableInAppUpiUpgrade ? (
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('upgrade')}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all shadow-sm ${isGold
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 dark:border-amber-500'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-amber-600 shadow-amber-500/20'
                      }`}
                  >
                    <Crown size={14} className="fill-white" />
                    {isGold ? 'Manage GOLD Membership' : 'Upgrade to GOLD'}
                  </button>
                ) : (
                  <a
                    href="https://dnbpedia.in/membership-levels/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all shadow-sm ${isGold
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 dark:border-amber-500'
                      : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700 dark:border-teal-500'
                      }`}
                  >
                    Manage Membership <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {isGold && (
              <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-4 border-t border-amber-200/80 dark:border-amber-800/50 grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-amber-200/60 dark:border-amber-800/50 flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-md sm:rounded-lg shrink-0">
                    <Calendar size={14} className="sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">Start Date</span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate block">{formatDate(membershipData.goldStartAt)}</span>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 p-2.5 sm:p-4 rounded-lg sm:rounded-xl border border-amber-200/60 dark:border-amber-800/50 flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-md sm:rounded-lg shrink-0">
                    <Calendar size={14} className="sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">Renewal Date</span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate block">{formatDate(membershipData.goldExpiry)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-0.5 sm:p-1 bg-gray-100 dark:bg-gray-700/80 rounded-lg sm:rounded-xl">
            <button
              onClick={() => setActiveSection('profile')}
              className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-md sm:rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${activeSection === 'profile'
                ? 'bg-white dark:bg-gray-600 text-teal-600 dark:text-teal-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              <User size={14} className="sm:w-4 sm:h-4" /> Basic Info
            </button>
            <button
              onClick={() => setActiveSection('security')}
              className={`flex-1 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-md sm:rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${activeSection === 'security'
                ? 'bg-white dark:bg-gray-600 text-red-500 dark:text-red-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              <Key size={14} className="sm:w-4 sm:h-4" /> Security
            </button>
          </div>

          {/* Tab 1: Profile Form */}
          {activeSection === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-3.5 sm:space-y-5 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase flex items-center gap-1.5">
                    <User size={13} className="sm:w-3.5 sm:h-3.5 text-teal-600 dark:text-teal-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 sm:p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="Your Full Name"
                  />
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase flex items-center gap-1.5">
                    <Smartphone size={13} className="sm:w-3.5 sm:h-3.5 text-teal-600 dark:text-teal-400" /> Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full p-2.5 sm:p-3.5 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs sm:text-sm dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase flex items-center gap-1.5">
                    <Mail size={13} className="sm:w-3.5 sm:h-3.5" /> Email Address (Read Only)
                  </label>
                  <input
                    type="email"
                    value={formData.email || currentUser?.email || auth?.currentUser?.email || (localStorage.getItem('mockUser') ? JSON.parse(localStorage.getItem('mockUser')).email : '') || ''}
                    disabled
                    className="w-full p-2.5 sm:p-3.5 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs sm:text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    To update your registered email address, visit the <strong>Security</strong> tab.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Fingerprint size={13} className="sm:w-3.5 sm:h-3.5 text-teal-600 dark:text-teal-400" /> Account ID (UID)
                    </span>
                    {copiedUid && <span className="text-emerald-500 text-[10px] normal-case font-bold">Copied!</span>}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={displayUid}
                      readOnly
                      className="w-full p-2.5 sm:p-3.5 pr-20 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-mono text-xs sm:text-sm select-all cursor-text"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUid}
                      className="absolute right-2 px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Copy Account ID"
                    >
                      {copiedUid ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copiedUid ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    Unique account identifier for support & licensing.
                  </p>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 flex justify-end border-t border-gray-100 dark:border-gray-700/60 mt-3 sm:mt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto sm:min-w-[220px] bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-6 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save & Update Profile</>}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Security */}
          {activeSection === 'security' && (
            <div className="space-y-4 sm:space-y-8 animate-in fade-in">

              {ENABLE_FIREBASE && auth?.currentUser &&
                !auth.currentUser.providerData?.some(p => p.providerId === 'password') &&
                auth.currentUser.providerData?.some(p => p.providerId === 'google.com') ? (
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 text-xs sm:text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2.5 sm:gap-3">
                  <User size={18} className="sm:w-5 sm:h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-base mb-0.5 sm:mb-1">Google Account Managed</h4>
                    <p className="text-[11px] sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      You signed in exclusively using Google Authentication. Password updates and security credentials are managed via your Google Account settings.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  {/* Change Password */}
                  <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4 bg-slate-50/50 dark:bg-gray-700/30 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-gray-700/80">
                    <h3 className="text-xs sm:text-base font-bold text-gray-800 dark:text-white flex items-center gap-1.5 sm:gap-2 border-b border-gray-200 dark:border-gray-700 pb-1.5 sm:pb-2">
                      <Key size={15} className="sm:w-4 sm:h-4 text-teal-500" /> Change Password
                    </h3>

                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Current Password"
                        required
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        className="w-full p-2.5 sm:p-3 pr-9 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New Password"
                          required
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                          className="w-full p-2.5 sm:p-3 pr-9 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                          title={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm New"
                          required
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                          className="w-full p-2.5 sm:p-3 pr-9 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                          title={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2">
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                    </button>
                  </form>

                  {/* Change Email */}
                  <form onSubmit={handleEmailChange} className="space-y-3 sm:space-y-4 bg-slate-50/50 dark:bg-gray-700/30 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-gray-700/80">
                    <h3 className="text-xs sm:text-base font-bold text-gray-800 dark:text-white flex items-center gap-1.5 sm:gap-2 border-b border-gray-200 dark:border-gray-700 pb-1.5 sm:pb-2">
                      <Mail size={15} className="sm:w-4 sm:h-4 text-teal-500" /> Change Email Address
                    </h3>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2.5 sm:p-3 rounded-lg sm:rounded-xl flex gap-2">
                      <ShieldAlert size={16} className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] sm:text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                        Updating your email will require <strong>re-verification</strong>. You will be logged out immediately after updating.
                      </p>
                    </div>

                    <div>
                      <input
                        type="email"
                        placeholder="New Email Address"
                        required
                        value={securityData.newEmail}
                        onChange={(e) => setSecurityData({ ...securityData, newEmail: e.target.value })}
                        className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type={showEmailPassword ? "text" : "password"}
                        placeholder="Current Password (Required)"
                        required
                        value={securityData.emailPassword}
                        onChange={(e) => setSecurityData({ ...securityData, emailPassword: e.target.value })}
                        className="w-full p-2.5 sm:p-3 pr-9 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-xs sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                        title={showEmailPassword ? "Hide password" : "Show password"}
                      >
                        {showEmailPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2">
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Email & Logout'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Logout Action Card */}
          <div className="pt-2">
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/60 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <LogOut size={16} />
              <span>Log Out of Account</span>
            </button>
          </div>

        </div>

        {/* Account Info Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/50 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          <div>
            Account ID: <span className="font-mono text-gray-700 dark:text-gray-300 font-bold select-all">{currentUser?.uid || 'N/A'}</span>
          </div>
          <button
            onClick={handleCopyUid}
            className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
          >
            {copiedUid ? <><Check size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> Copy Account ID</>}
          </button>
        </div>

        {/* Global Navigation Footer */}
        <div className="fixed bottom-0 left-0 right-0 w-full max-w-full md:max-w-2xl lg:max-w-5xl xl:max-w-5xl mx-auto p-1.5 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <NavigationFooter />
        </div>

      </div>
    </div>
  );
}
