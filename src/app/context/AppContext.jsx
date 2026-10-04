import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc, setDoc, writeBatch, deleteField
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  onAuthStateChanged, sendPasswordResetEmail, sendEmailVerification, updateProfile
} from "firebase/auth";

import {
  ENABLE_FIREBASE, firebaseConfig, ADMIN_EMAILS, INITIAL_DATA_STANDARD,
  INITIAL_DATA_GOLD, getLocalDeviceId
} from "../config";

import { customConfirm, isNativePlatform, exitNativeApp, registerAppStateHandler } from '../platform/native';
import { syncUserToWordPressREST } from '../utils/wpSync';

let db = null;
let auth = null;

if (ENABLE_FIREBASE) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app, "default");
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

export { db, auth };

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export function AppProvider({ children }) {
  const [currentScreen, setCurrentScreenState] = useState(() => {
    const saved = localStorage.getItem('last_screen');
    return saved || 'welcome';
  });

  const [viewMode, setViewModeState] = useState(() => {
    return localStorage.getItem('view_mode') || 'student';
  });

  const historyStack = useRef([]);
  const currentScreenRef = useRef(currentScreen);
  const isInfoModalOpenRef = useRef(false);
  const showAuthModalRef = useRef(false);
  const isRegisteringRef = useRef(false);

  const [questions, setQuestions] = useState([]);
  const [announcement, setAnnouncement] = useState('');
  const [teaser, setTeaser] = useState('');
  const [upgradeMsg, setUpgradeMsg] = useState(() => localStorage.getItem('upgrade_msg') || '');
  const [teaserQuestionCount, setTeaserQuestionCount] = useState('500+');
  const [infoPopupContent, setInfoPopupContent] = useState(() => localStorage.getItem('info_popup_content') || '');
  const [showInfoPopup, setShowInfoPopup] = useState(() => localStorage.getItem('info_popup_enabled') === 'true');
  const [infoPopupTarget, setInfoPopupTarget] = useState(() => localStorage.getItem('info_popup_target') || 'all');
  const [infoPopupId, setInfoPopupId] = useState(() => localStorage.getItem('info_popup_id') || '');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [curriculumMap, setCurriculumMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [currentUser, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('user_role') || 'guest');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [filters, setFilters] = useState({ exam: 'All', year: 'All', session: 'All', paper: 'All' });
  const [showMarkedOnly, setShowMarkedOnly] = useState(false);

  useEffect(() => { currentScreenRef.current = currentScreen; }, [currentScreen]);
  useEffect(() => { isInfoModalOpenRef.current = isInfoModalOpen; }, [isInfoModalOpen]);
  useEffect(() => { showAuthModalRef.current = showAuthModal; }, [showAuthModal]);

  const [markedQuestions, setMarkedQuestions] = useState(() => {
    const saved = localStorage.getItem('markedQuestions');
    return saved ? JSON.parse(saved) : [];
  });
  const [completedQuestions, setCompletedQuestions] = useState(() => {
    const saved = localStorage.getItem('completedQuestions');
    return saved ? JSON.parse(saved) : [];
  });
  const [sortCompletedSnapshot, setSortCompletedSnapshot] = useState(() => {
    const saved = localStorage.getItem('completedQuestions');
    return saved ? JSON.parse(saved) : [];
  });

  const markedRef = useRef(markedQuestions);
  const completedRef = useRef(completedQuestions);
  const hasUnsyncedChanges = useRef(false);

  // Persistence helpers
  const setViewMode = (mode) => {
    const nextMode = typeof mode === 'function' ? mode(viewMode) : mode;
    setViewModeState(nextMode);
    localStorage.setItem('view_mode', nextMode);
  };

  const navigateTo = (nextScreen) => {
    if (nextScreen === currentScreenRef.current) return;
    if (nextScreen === 'welcome' || nextScreen === 'app') {
      historyStack.current = [];
    } else {
      historyStack.current.push(currentScreenRef.current);
    }
    setCurrentScreenState(nextScreen);
    localStorage.setItem('last_screen', nextScreen);
    try {
      window.history.pushState({ screen: nextScreen }, '', '');
    } catch (e) { }
  };

  const setCurrentScreen = (screen) => {
    if (typeof screen === 'function') {
      const next = screen(currentScreenRef.current);
      navigateTo(next);
    } else {
      navigateTo(screen);
    }
  };

  const goBack = useCallback(() => {
    if (isInfoModalOpenRef.current) {
      closeInfoModal();
      return;
    }
    if (showAuthModalRef.current) {
      setShowAuthModal(false);
      return;
    }

    const activeScreen = currentScreenRef.current;

    // Dispatch sub-screen back listener (e.g. welcome_back_pressed, chapters_back_pressed)
    const event = new CustomEvent(`${activeScreen}_back_pressed`, { cancelable: true });
    const isDefaultPrevented = !window.dispatchEvent(event);
    if (isDefaultPrevented) return;

    if (activeScreen === 'welcome') {

      historyStack.current = [];
      customConfirm("Are you sure you want to exit the app?", () => {
        if (isNativePlatform()) {
          exitNativeApp();
        } else {
          try {
            window.close();
          } catch (e) { }
        }
      });
      return;
    }

    if (activeScreen === 'app') {
      historyStack.current = [];
      setCurrentScreenState('welcome');
      localStorage.setItem('last_screen', 'welcome');
      return;
    }

    if (historyStack.current.length > 0) {
      let prevScreen = historyStack.current.pop();
      if (prevScreen === 'welcome' || prevScreen === 'app') {
        historyStack.current = [];
      }
      setCurrentScreenState(prevScreen);
      localStorage.setItem('last_screen', prevScreen);
    } else {
      setCurrentScreenState('welcome');
      localStorage.setItem('last_screen', 'welcome');
    }
  }, []);

  // Web Browser Back Button (popstate)
  useEffect(() => {
    try {
      window.history.replaceState({ screen: currentScreen }, '', '');
    } catch (e) { }

    const handlePopState = () => {
      goBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentScreen]);

  useEffect(() => { markedRef.current = markedQuestions; }, [markedQuestions]);
  useEffect(() => { completedRef.current = completedQuestions; }, [completedQuestions]);
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const uniqueTopics = useMemo(() => {
    const topics = questions.map(q => q.topic ? q.topic.trim() : "").filter(t => t !== "");
    return [...new Set(topics)].sort();
  }, [questions]);

  // Auth & Session Logic
  const handleUserSession = async (user) => {
    setIsProfileLoaded(false);
    const lastUid = localStorage.getItem('last_uid');
    const isNewUser = lastUid && lastUid !== user.uid;

    if (isNewUser) {
      setMarkedQuestions([]); setCompletedQuestions([]); setSortCompletedSnapshot([]);
      localStorage.removeItem('markedQuestions'); localStorage.removeItem('completedQuestions');
      localStorage.removeItem('questions_data'); localStorage.removeItem('user_role');
      setUserName(''); setQuestions([]);
    }

    localStorage.setItem('last_uid', user.uid);
    setCurrentUser(user);
    const localDeviceId = getLocalDeviceId();
    const justLoggedIn = localStorage.getItem('just_logged_in') === 'true';
    if (justLoggedIn) localStorage.removeItem('just_logged_in');

    try {
      if (ENABLE_FIREBASE && db) {
        let determinedRole = 'standard';
        if (ADMIN_EMAILS.includes(user.email)) determinedRole = 'admin';

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        let finalRole = determinedRole;

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role && userData.role !== 'standard') finalRole = userData.role;

          const dbDeviceId = userData.deviceId;
          if (!justLoggedIn && dbDeviceId && dbDeviceId !== localDeviceId && finalRole !== 'admin') {
            alert("Login at other device detected. You have been signed out.");
            if (auth) await signOut(auth);
            return;
          }

          if (userData.bookmarks) setMarkedQuestions(userData.bookmarks);
          if (userData.completed) { setCompletedQuestions(userData.completed); setSortCompletedSnapshot(userData.completed); }
          if (userData.name) { setUserName(userData.name); }
          else if (user.displayName) { setUserName(user.displayName); }

          // Update existing user doc with lastLogin, missing fallbacks, & device binding
          const updatePayload = {
            lastLogin: new Date(),
            emailVerified: user.emailVerified ?? userData.emailVerified ?? false
          };
          if (justLoggedIn || !userData.deviceId) updatePayload.deviceId = localDeviceId;
          if (user.photoURL && !userData.photoURL) updatePayload.photoURL = user.photoURL;
          if (user.displayName && !userData.name) updatePayload.name = user.displayName;
          if (determinedRole === 'admin' && userData.role !== 'admin') updatePayload.role = 'admin';

          await setDoc(userDocRef, updatePayload, { merge: true });
        } else {
          // Brand New User Document Creation (Atomic for both Google Auth and Email Registration)
          const pendingName = window.__pendingAuthName || '';
          const pendingMobile = window.__pendingAuthMobile || '';
          delete window.__pendingAuthName;
          delete window.__pendingAuthMobile;

          const nameToSet = user.displayName || pendingName || (user.email ? user.email.split('@')[0] : 'User');
          setUserName(nameToSet);

          const newProfilePayload = {
            uid: user.uid,
            email: user.email || '',
            name: nameToSet,
            mobile: pendingMobile || user.phoneNumber || '',
            photoURL: user.photoURL || '',
            role: finalRole,
            bookmarks: [],
            completed: [],
            emailVerified: user.emailVerified || false,
            deviceId: localDeviceId,
            createdAt: new Date(),
            lastLogin: new Date()
          };

          await setDoc(userDocRef, newProfilePayload, { merge: true });
        }

        setUserRole(finalRole);
        localStorage.setItem('user_role', finalRole);

        // Fail-Safe Token REST API bridge (On Every Login check - controlled by ENABLE_WP_REST_SYNC flag)
        syncUserToWordPressREST(user).catch(err => console.warn("WP Sync fail-safe warning:", err));
      } else {
        if (user.name) setUserName(user.name);
        else if (user.email) setUserName(user.email.split('@')[0]);
        if (!justLoggedIn && user.deviceId && user.deviceId !== localDeviceId && user.role !== 'admin') {
          alert("Login at other device detected. You have been signed out.");
          localStorage.removeItem('mockUser'); window.location.reload(); return;
        }
      }
    } catch (e) {
      console.error("Session error:", e); setUserRole('standard'); localStorage.setItem('user_role', 'standard');
    } finally { setIsProfileLoaded(true); }
  };

  useEffect(() => {
    if (ENABLE_FIREBASE && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) await handleUserSession(user);
        else {
          setCurrentUser(null); setIsProfileLoaded(false); setUserRole('guest');
          localStorage.removeItem('user_role'); setUserName(''); setViewModeState('student');
        }
      });
      return () => unsubscribe();
    } else {
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) {
        const parsed = JSON.parse(mockUser); handleUserSession(parsed);
        if (parsed.role) { setUserRole(parsed.role); localStorage.setItem('user_role', parsed.role); }
      }
    }
  }, []);

  const fetchData = async (forceSync = false) => {
    setLoading(true);

    const CACHE_KEY = 'questions_data'; const TIME_KEY = 'last_sync_time'; const ROLE_KEY = 'last_sync_role';
    const cachedData = localStorage.getItem(CACHE_KEY);
    const lastSyncTime = localStorage.getItem(TIME_KEY);
    const lastSyncRole = localStorage.getItem(ROLE_KEY);
    const now = Date.now();
    const isExpired = !lastSyncTime || (now - parseInt(lastSyncTime) > 12 * 60 * 60 * 1000);
    const shouldFetch = forceSync || !cachedData || isExpired || lastSyncRole !== userRole;

    if (!shouldFetch) {
      setQuestions(JSON.parse(cachedData));
      setAnnouncement(localStorage.getItem('announcement_data') || '');
      setTeaser(localStorage.getItem('teaser_msg') || '');
      setUpgradeMsg(localStorage.getItem('upgrade_msg') || '🔒 High-yield answers & mnemonics are reserved for GOLD members. <a href="https://dnbpedia.in/pyq/memberships" target="_blank" rel="noopener noreferrer" class="font-extrabold underline hover:opacity-80">UPGRADE NOW ⚡</a>');
      setTeaserQuestionCount(localStorage.getItem('teaser_count') || '500+');
      try { setCurriculumMap(JSON.parse(localStorage.getItem('curriculum_map') || '{}')); } catch (e) { }
      const cachedInfoPopupContent = localStorage.getItem('info_popup_content') || '';
      const cachedShowInfoPopup = localStorage.getItem('info_popup_enabled') === 'true';
      const cachedInfoPopupTarget = localStorage.getItem('info_popup_target') || 'all';
      const cachedInfoPopupId = localStorage.getItem('info_popup_id') || '';
      setInfoPopupContent(cachedInfoPopupContent);
      setShowInfoPopup(cachedShowInfoPopup);
      setInfoPopupTarget(cachedInfoPopupTarget);
      setInfoPopupId(cachedInfoPopupId);
      checkAndTriggerInfoPopup(cachedInfoPopupContent, cachedShowInfoPopup, cachedInfoPopupTarget, cachedInfoPopupId);
      fetchGlobalSettings();
      setLoading(false); return;
    }

    let allQuestions = [];
    let fetchedAnnouncement = '';
    let fetchedTeaser = '';
    let fetchedUpgradeMsg = '';
    let fetchedTeaserCount = '500+';
    let fetchedCurriculum = {};
    let fetchedInfoPopupContent = localStorage.getItem('info_popup_content') || '';
    let fetchedShowInfoPopup = localStorage.getItem('info_popup_enabled') === 'true';
    let fetchedInfoPopupTarget = localStorage.getItem('info_popup_target') || 'all';
    let fetchedInfoPopupId = localStorage.getItem('info_popup_id') || '';

    if (ENABLE_FIREBASE && db) {
      try {
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().deviceId && userDoc.data().deviceId !== getLocalDeviceId() && userDoc.data().role !== 'admin') {
            alert("Login at other device detected. You have been signed out.");
            if (auth) await signOut(auth); setLoading(false); return;
          }
        }
        // Fetch base questions collection (2-document architecture: questions + answers_gold)
        const qSnapshot = await getDocs(collection(db, "questions"));

        const goldAnswers = {};
        if (userRole === 'gold' || userRole === 'admin') {
          const goldAnsSnapshot = await getDocs(collection(db, "answers_gold"));
          goldAnsSnapshot.forEach(d => goldAnswers[d.id] = d.data());
        }

        allQuestions = qSnapshot.docs.map(docSnap => {
          const qData = docSnap.data();
          const isGoldQ = qData.accessLevel === 'gold' || qData.hasGoldAnswer || qData.collection === 'questions_gold';

          let finalAnswerText = qData.answerText || "";
          let finalMnemonic = qData.mnemonic || "";

          // If user is Gold/Admin and this question has a gold answer in answers_gold, override with premium content
          if ((userRole === 'gold' || userRole === 'admin') && isGoldQ && goldAnswers[docSnap.id]) {
            if (goldAnswers[docSnap.id].answerText !== undefined) finalAnswerText = goldAnswers[docSnap.id].answerText;
            if (goldAnswers[docSnap.id].mnemonic !== undefined) finalMnemonic = goldAnswers[docSnap.id].mnemonic;
          }

          return {
            id: docSnap.id,
            ...qData,
            collection: 'questions',
            accessLevel: isGoldQ ? 'gold' : 'standard',
            hasGoldAnswer: isGoldQ,
            answerText: finalAnswerText,
            mnemonic: finalMnemonic
          };
        });

        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          fetchedAnnouncement = data.announcement || '';
          fetchedTeaser = data.teaserContent || '';
          fetchedUpgradeMsg = data.upgradeMsg || '🔒 High-yield answers & mnemonics are reserved for GOLD members. <a href="https://dnbpedia.in/pyq/memberships" target="_blank" rel="noopener noreferrer" class="font-extrabold underline hover:opacity-80">UPGRADE NOW ⚡</a>';
          fetchedTeaserCount = data.teaserQuestionCount || '500+';
          fetchedCurriculum = data.curriculumMap || {};
          const infoPopupObj = data.infoPopup || {};
          fetchedInfoPopupContent = infoPopupObj.content || '';
          fetchedShowInfoPopup = infoPopupObj.enabled ?? false;
          fetchedInfoPopupTarget = infoPopupObj.target || 'all';
          fetchedInfoPopupId = infoPopupObj.id || '';

          localStorage.setItem('info_popup_content', fetchedInfoPopupContent);
          localStorage.setItem('info_popup_enabled', fetchedShowInfoPopup ? 'true' : 'false');
          localStorage.setItem('info_popup_target', fetchedInfoPopupTarget);
          localStorage.setItem('info_popup_id', fetchedInfoPopupId);
        }
      } catch (error) {
        console.error("fetchData error:", error);
        if (cachedData) { alert("Network error. Loaded cached data."); setQuestions(JSON.parse(cachedData)); setLoading(false); return; }
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
      allQuestions = [...INITIAL_DATA_STANDARD];
      if (userRole === 'gold' || userRole === 'admin') allQuestions = [...allQuestions, ...INITIAL_DATA_GOLD];
      fetchedAnnouncement = localStorage.getItem('announcement') || '';
      fetchedTeaser = localStorage.getItem('teaser_msg') || 'Upgrade to GOLD to unlock premium questions!';
      fetchedUpgradeMsg = localStorage.getItem('upgrade_msg') || '🔒 High-yield answers & mnemonics are reserved for GOLD members. <a href="https://dnbpedia.in/pyq/memberships" target="_blank" rel="noopener noreferrer" class="font-extrabold underline hover:opacity-80">UPGRADE NOW ⚡</a>';
      fetchedTeaserCount = localStorage.getItem('teaser_count') || '500+';
      try { fetchedCurriculum = JSON.parse(localStorage.getItem('curriculum_map') || '{}'); } catch (e) { }
      fetchedInfoPopupContent = localStorage.getItem('info_popup_content') || '';
      fetchedShowInfoPopup = localStorage.getItem('info_popup_enabled') === 'true';
      fetchedInfoPopupTarget = localStorage.getItem('info_popup_target') || 'all';
      fetchedInfoPopupId = localStorage.getItem('info_popup_id') || '';
    }

    setQuestions(allQuestions); setAnnouncement(fetchedAnnouncement); setTeaser(fetchedTeaser); setUpgradeMsg(fetchedUpgradeMsg);
    setTeaserQuestionCount(fetchedTeaserCount); setCurriculumMap(fetchedCurriculum);
    setInfoPopupContent(fetchedInfoPopupContent);
    setShowInfoPopup(fetchedShowInfoPopup);
    setInfoPopupTarget(fetchedInfoPopupTarget);
    setInfoPopupId(fetchedInfoPopupId);

    checkAndTriggerInfoPopup(fetchedInfoPopupContent, fetchedShowInfoPopup, fetchedInfoPopupTarget, fetchedInfoPopupId);

    localStorage.setItem(CACHE_KEY, JSON.stringify(allQuestions)); localStorage.setItem(TIME_KEY, now.toString());
    localStorage.setItem(ROLE_KEY, userRole); localStorage.setItem('announcement_data', fetchedAnnouncement);
    localStorage.setItem('teaser_msg', fetchedTeaser); localStorage.setItem('upgrade_msg', fetchedUpgradeMsg); localStorage.setItem('teaser_count', fetchedTeaserCount);
    localStorage.setItem('curriculum_map', JSON.stringify(fetchedCurriculum));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [currentUser, userRole]);

  const syncUserData = async () => {
    if (!currentUser || !ENABLE_FIREBASE || !db || !hasUnsyncedChanges.current) return;
    try { await updateDoc(doc(db, "users", currentUser.uid), { bookmarks: markedRef.current, completed: completedRef.current }); hasUnsyncedChanges.current = false; } catch (e) { }
  };

  useEffect(() => {
    const intervalId = setInterval(() => syncUserData(), 5 * 60 * 1000);
    const handleVisibilityChange = () => { if (document.visibilityState === 'hidden') syncUserData(); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => { clearInterval(intervalId); document.removeEventListener("visibilitychange", handleVisibilityChange); };
  }, [currentUser]);

  // Actions
  const handleLogout = async () => {
    await syncUserData();
    if (ENABLE_FIREBASE && auth) await signOut(auth);
    else { localStorage.removeItem('mockUser'); setCurrentUser(null); setIsProfileLoaded(false); setUserRole('guest'); localStorage.removeItem('user_role'); setUserName(''); window.location.reload(); }
  };

  const handleAuthSubmit = async (e, email, password, mobile, name) => {
    e.preventDefault(); const currentDeviceId = getLocalDeviceId(); localStorage.setItem('just_logged_in', 'true');
    if (ENABLE_FIREBASE && auth) {
      try {
        if (authMode === 'login') {
          await signInWithEmailAndPassword(auth, email, password);
        } else if (authMode === 'register') {
          window.__pendingAuthName = name || '';
          window.__pendingAuthMobile = mobile || '';
          const res = await createUserWithEmailAndPassword(auth, email, password);

          if (name && res.user) {
            try {
              await updateProfile(res.user, { displayName: name });
            } catch (pErr) {
              console.warn("Could not update Auth user profile name:", pErr);
            }
          }

          if (name) setUserName(name);

          try {
            await sendEmailVerification(res.user);
            alert("Account created! Verification email sent.");
          } catch (vErr) {
            console.warn("Could not send verification email:", vErr);
            alert("Account created successfully! Note: Could not send verification email right now (" + vErr.message + "). You can resend it later from your profile.");
          }
        } else if (authMode === 'reset') {
          await sendPasswordResetEmail(auth, email); alert("Password reset email sent!"); setAuthMode('login'); return;
        }
        setShowAuthModal(false);
      } catch (error) { alert(error.message); }
    } else {
      let mockUserObj = { email, uid: 'user', emailVerified: false, role: 'standard', deviceId: currentDeviceId };
      if (authMode === 'login') {
        if (email.includes('admin')) mockUserObj = { email, uid: 'admin', emailVerified: true, role: 'admin', deviceId: currentDeviceId };
        else if (email.includes('gold')) mockUserObj = { email, uid: 'gold_user', emailVerified: true, role: 'gold', deviceId: currentDeviceId };
      } else { mockUserObj = { email, uid: 'user_' + Date.now(), emailVerified: false, role: 'standard', name: name, deviceId: currentDeviceId }; }
      localStorage.setItem('mockUser', JSON.stringify(mockUserObj)); await handleUserSession(mockUserObj);
      if (mockUserObj.role) { setUserRole(mockUserObj.role); localStorage.setItem('user_role', mockUserObj.role); }
      setShowAuthModal(false);
    }
  };

  const handleGoogleAuth = async () => {
    const currentDeviceId = getLocalDeviceId();
    localStorage.setItem('just_logged_in', 'true');

    if (ENABLE_FIREBASE && auth) {
      try {
        const { signInWithGoogle } = await import('../firebase');
        await signInWithGoogle();
        setShowAuthModal(false);
      } catch (error) {
        const errCode = error?.code || '';
        const errMsg = error?.message || error?.toString() || '';
        const lowerMsg = errMsg.toLowerCase();

        if (
          errCode === 'auth/popup-closed-by-user' ||
          errCode === 'auth/cancelled-by-user' ||
          lowerMsg.includes('cancelled') ||
          lowerMsg.includes('closed by user')
        ) {
          console.log("Google Sign-In cancelled by user.");
        } else if (
          errCode === 'auth/account-exists-with-different-credential' ||
          errCode === 'auth/email-already-in-use' ||
          errCode === 'auth/credential-already-in-use' ||
          lowerMsg.includes('account-exists-with-different-credential')
        ) {
          setAuthMode('login');
          alert("This email is registered using direct Email & Password authentication. Please log in by entering your email and password directly below.");
        } else {
          console.error("Google Auth error:", error);
          alert(error.message || error.toString() || "Failed to sign in with Google.");
        }
      }
    } else {
      let mockUserObj = {
        email: 'google.user@example.com',
        name: 'Google User',
        uid: 'google_user_' + Date.now(),
        emailVerified: true,
        role: 'standard',
        deviceId: currentDeviceId
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUserObj));
      await handleUserSession(mockUserObj);
      setUserRole('standard');
      localStorage.setItem('user_role', 'standard');
      setShowAuthModal(false);
    }
  };

  const handleResendVerification = async () => {
    if (ENABLE_FIREBASE && auth && auth.currentUser) {
      try { await sendEmailVerification(auth.currentUser); alert("Verification link resent!"); } catch (e) { alert("Error: " + e.message); }
    } else alert("Mock: Verification email resent to " + currentUser.email);
  };

  const handleToggleMark = (id, e) => { e.stopPropagation(); setMarkedQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]); hasUnsyncedChanges.current = true; };
  const handleToggleRead = (id, e) => { e.stopPropagation(); setCompletedQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]); hasUnsyncedChanges.current = true; };
  const handleManualSync = async () => { setLoading(true); await syncUserData(); setSortCompletedSnapshot(completedRef.current); await fetchData(true); setLoading(false); alert("Synced successfully!"); };

  // --- Add question (2-document model: questions + answers_gold) ---
  const addQuestion = async (newQ, targetCol = 'questions') => {
    const { answerText, mnemonic, accessLevel, collection: legacyCol, originalCollection, ...qMeta } = newQ;
    const isGold = accessLevel === 'gold' || targetCol === 'questions_gold' || legacyCol === 'questions_gold';
    const finalAccess = isGold ? 'gold' : 'standard';
    const nowIso = new Date().toISOString();

    if (ENABLE_FIREBASE && db) {
      try {
        const batch = writeBatch(db);
        const newQuestionRef = doc(collection(db, "questions"));

        // For gold questions, main questions doc contains metadata + hasGoldAnswer: true, while answers live ONLY in answers_gold
        batch.set(newQuestionRef, {
          ...qMeta,
          accessLevel: finalAccess,
          hasGoldAnswer: isGold,
          answerText: isGold ? "" : (answerText || ""),
          mnemonic: isGold ? "" : (mnemonic || ""),
          updatedAt: nowIso
        });

        if (isGold) {
          const newGoldAnsRef = doc(db, "answers_gold", newQuestionRef.id);
          batch.set(newGoldAnsRef, { answerText: answerText || "", mnemonic: mnemonic || "" });
        }

        await batch.commit();

        setQuestions([{
          id: newQuestionRef.id,
          ...qMeta,
          collection: 'questions',
          accessLevel: finalAccess,
          hasGoldAnswer: isGold,
          answerText: answerText || "",
          mnemonic: mnemonic || "",
          updatedAt: nowIso
        }, ...questions]);
      } catch (e) { console.error('Error adding question:', e); }
    } else {
      const id = Date.now().toString();
      setQuestions([{ id, ...newQ, accessLevel: finalAccess, hasGoldAnswer: isGold, updatedAt: nowIso }, ...questions]);
    }
  };

  // --- Update question (2-document model: questions + answers_gold) ---
  const updateQuestion = async (updatedQ) => {
    const { id, originalAccessLevel, accessLevel, answerText, mnemonic, originalCollection, collection: newCollection, ...qData } = updatedQ;

    const existingQuestion = questions.find(q => q.id === id);
    const existingAccess = existingQuestion ? (existingQuestion.accessLevel || (existingQuestion.hasGoldAnswer ? 'gold' : 'standard')) : undefined;
    const finalAccess = accessLevel || (newCollection === 'questions_gold' ? 'gold' : undefined) || existingAccess || 'standard';
    const isGold = finalAccess === 'gold';
    const nowIso = new Date().toISOString();

    if (ENABLE_FIREBASE && db) {
      try {
        const batch = writeBatch(db);
        const qRef = doc(db, "questions", id);

        // For gold questions, answers live exclusively in answers_gold; main questions doc contains empty answerText/mnemonic
        batch.set(qRef, {
          ...qData,
          accessLevel: finalAccess,
          hasGoldAnswer: isGold,
          answerText: isGold ? "" : (answerText || ""),
          mnemonic: isGold ? "" : (mnemonic || ""),
          updatedAt: nowIso
        }, { merge: true });

        const goldAnsRef = doc(db, "answers_gold", id);
        if (isGold) {
          batch.set(goldAnsRef, { answerText: answerText || "", mnemonic: mnemonic || "" }, { merge: true });
        } else {
          batch.delete(goldAnsRef);
        }

        await batch.commit();

        setQuestions(questions.map(q => q.id === id ? {
          ...q,
          ...qData,
          collection: 'questions',
          accessLevel: finalAccess,
          hasGoldAnswer: isGold,
          answerText: answerText || "",
          mnemonic: mnemonic || "",
          updatedAt: nowIso
        } : q));
      } catch (e) { console.error('Error updating question:', e); alert("Error updating question."); }
    } else {
      setQuestions(questions.map(q => q.id === id ? { ...updatedQ, updatedAt: nowIso } : q));
    }
  };

  // --- Delete question (2-document model: deletes from questions and answers_gold) ---
  const deleteQuestion = async (id, colOrAccess) => {
    if (!confirm("Delete this question?")) return;

    if (ENABLE_FIREBASE && db) {
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, "questions", id));
        batch.delete(doc(db, "answers_gold", id));
        batch.delete(doc(db, "questions_gold", id));
        batch.delete(doc(db, "answers_std", id));
        await batch.commit();
        setQuestions(questions.filter(q => q.id !== id));
      } catch (e) { console.error('Error deleting question:', e); }
    } else {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const saveCurriculumMap = (newMap) => {
    setCurriculumMap(newMap);
    if (ENABLE_FIREBASE && db) setDoc(doc(db, "settings", "global"), { curriculumMap: newMap }, { merge: true });
    else localStorage.setItem('curriculum_map', JSON.stringify(newMap));
  };
  const saveAnnouncement = (t) => {
    setAnnouncement(t);
    localStorage.setItem('announcement', t);
    localStorage.setItem('announcement_data', t);
    if (ENABLE_FIREBASE && db) setDoc(doc(db, "settings", "global"), { announcement: t }, { merge: true });
    alert("Announcement saved successfully!");
  };
  const saveTeaserCount = (t) => {
    setTeaserQuestionCount(t);
    localStorage.setItem('teaser_count', t);
    if (ENABLE_FIREBASE && db) setDoc(doc(db, "settings", "global"), { teaserQuestionCount: t }, { merge: true });
    alert("Gold Count updated successfully!");
  };
  const saveTeaserMessage = (t) => {
    setTeaser(t);
    localStorage.setItem('teaser_msg', t);
    if (ENABLE_FIREBASE && db) setDoc(doc(db, "settings", "global"), { teaserContent: t }, { merge: true });
    alert("Teaser Message saved successfully!");
  };

  const saveUpgradeMessage = (t) => {
    setUpgradeMsg(t);
    localStorage.setItem('upgrade_msg', t);
    if (ENABLE_FIREBASE && db) setDoc(doc(db, "settings", "global"), { upgradeMsg: t }, { merge: true });
    alert("Upgrade Message saved successfully!");
  };

  const checkAndTriggerInfoPopup = (
    content = infoPopupContent,
    enabled = showInfoPopup,
    target = infoPopupTarget,
    updateId = infoPopupId
  ) => {
    if (enabled && content && content.trim() !== '') {
      const isNative = isNativePlatform();
      if (target === 'web' && isNative) return;
      if (target === 'android' && !isNative) return;

      const effectiveUpdateId = updateId || content;
      const currentStoredId = localStorage.getItem('info_popup_current_id');
      let closeCount = parseInt(localStorage.getItem('info_popup_close_count') || '0', 10);
      const lastShown = localStorage.getItem('info_popup_last_shown');
      const now = Date.now();
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      // If admin posted a new update (different update ID/content), reset user's close count & timestamp
      if (effectiveUpdateId !== currentStoredId) {
        closeCount = 0;
        localStorage.setItem('info_popup_current_id', effectiveUpdateId);
        localStorage.setItem('info_popup_close_count', '0');
        localStorage.removeItem('info_popup_last_shown');
      }

      const lastShownTime = lastShown ? parseInt(lastShown, 10) : 0;
      const is24HoursPassed = !lastShownTime || (now - lastShownTime >= TWENTY_FOUR_HOURS);

      // Show popup if user has closed it fewer than 4 times AND at least 24 hours have passed since last display
      if (closeCount < 4 && is24HoursPassed) {
        setIsInfoModalOpen(true);
      }
    }
  };

  useEffect(() => {
    checkAndTriggerInfoPopup(infoPopupContent, showInfoPopup, infoPopupTarget, infoPopupId);
  }, [showInfoPopup, infoPopupContent, infoPopupTarget, infoPopupId]);

  const fetchGlobalSettings = async () => {
    if (ENABLE_FIREBASE && db) {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          const fetchedAnnouncement = data.announcement || '';
          const fetchedTeaser = data.teaserContent || '';
          const fetchedUpgradeMsg = data.upgradeMsg || '🔒 High-yield answers & mnemonics are reserved for GOLD members. <a href="https://dnbpedia.in/pyq/memberships" target="_blank" rel="noopener noreferrer" class="font-extrabold underline hover:opacity-80">UPGRADE NOW ⚡</a>';
          const fetchedTeaserCount = data.teaserQuestionCount || '500+';
          const fetchedCurriculum = data.curriculumMap || {};
          const infoPopupObj = data.infoPopup || {};
          const fetchedInfoPopupContent = infoPopupObj.content || '';
          const fetchedShowInfoPopup = infoPopupObj.enabled ?? false;
          const fetchedInfoPopupTarget = infoPopupObj.target || 'all';
          const fetchedInfoPopupId = infoPopupObj.id || '';

          setAnnouncement(fetchedAnnouncement);
          setTeaser(fetchedTeaser);
          setUpgradeMsg(fetchedUpgradeMsg);
          setTeaserQuestionCount(fetchedTeaserCount);
          setCurriculumMap(fetchedCurriculum);
          setInfoPopupContent(fetchedInfoPopupContent);
          setShowInfoPopup(fetchedShowInfoPopup);
          setInfoPopupTarget(fetchedInfoPopupTarget);
          setInfoPopupId(fetchedInfoPopupId);

          localStorage.setItem('info_popup_content', fetchedInfoPopupContent);
          localStorage.setItem('info_popup_enabled', fetchedShowInfoPopup ? 'true' : 'false');
          localStorage.setItem('info_popup_target', fetchedInfoPopupTarget);
          localStorage.setItem('info_popup_id', fetchedInfoPopupId);

          checkAndTriggerInfoPopup(fetchedInfoPopupContent, fetchedShowInfoPopup, fetchedInfoPopupTarget, fetchedInfoPopupId);
        }
      } catch (e) { }
    }
  };

  useEffect(() => {
    const handleAppResume = () => {
      fetchGlobalSettings();
      checkAndTriggerInfoPopup(infoPopupContent, showInfoPopup, infoPopupTarget, infoPopupId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleAppResume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const unbindNativeApp = registerAppStateHandler((state) => {
      if (state.isActive) {
        handleAppResume();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unbindNativeApp();
    };
  }, [showInfoPopup, infoPopupContent, infoPopupTarget, infoPopupId]);

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
    const closeCount = parseInt(localStorage.getItem('info_popup_close_count') || '0', 10);
    localStorage.setItem('info_popup_close_count', (closeCount + 1).toString());
    localStorage.setItem('info_popup_last_shown', Date.now().toString());
  };

  const saveInfoPopupSettings = (content, enabled, target = 'all') => {
    const newUpdateId = Date.now().toString();
    setInfoPopupContent(content);
    setShowInfoPopup(enabled);
    setInfoPopupTarget(target);
    setInfoPopupId(newUpdateId);

    localStorage.setItem('info_popup_content', content);
    localStorage.setItem('info_popup_enabled', enabled ? 'true' : 'false');
    localStorage.setItem('info_popup_target', target);
    localStorage.setItem('info_popup_id', newUpdateId);

    localStorage.setItem('info_popup_current_id', newUpdateId);
    localStorage.setItem('info_popup_close_count', '0');
    localStorage.removeItem('info_popup_last_shown');

    if (ENABLE_FIREBASE && db) {
      setDoc(doc(db, "settings", "global"), {
        infoPopup: {
          content: content,
          enabled: enabled,
          target: target,
          id: newUpdateId
        }
      }, { merge: true });
    }
    alert("Info Popup settings saved successfully! Users will see this update once every 24 hours up to 4 times.");
  };

  const [selectedTopicFilter, setSelectedTopicFilter] = useState('All');
  const [zoomImage, setZoomImage] = useState(null);

  const openImageZoom = useCallback((src, alt = '') => {
    if (src) setZoomImage({ src, alt });
  }, []);

  const closeImageZoom = useCallback(() => {
    setZoomImage(null);
  }, []);

  const navigateToTopicStudy = useCallback((topicName) => {
    if (topicName) setSelectedTopicFilter(topicName);
    setViewModeState('student');
    localStorage.setItem('view_mode', 'student');
    navigateTo('study');
  }, [navigateTo]);

  const ctx = {
    currentScreen, setCurrentScreen, navigateTo, goBack, questions, announcement, teaser, teaserQuestionCount, curriculumMap, loading, darkMode, setDarkMode,
    upgradeMsg, saveUpgradeMessage,
    currentUser, userName, userRole, showAuthModal, setShowAuthModal, authMode, setAuthMode, viewMode, setViewMode, uniqueTopics,
    markedQuestions, completedQuestions, sortCompletedSnapshot, handleAuthSubmit, handleGoogleAuth, handleLogout, handleResendVerification, handleToggleMark,
    handleToggleRead, handleManualSync, addQuestion, updateQuestion, deleteQuestion, saveCurriculumMap, saveAnnouncement, saveTeaserCount, saveTeaserMessage,
    filters, setFilters, showMarkedOnly, setShowMarkedOnly, isProfileLoaded,
    infoPopupContent, showInfoPopup, infoPopupTarget, setInfoPopupTarget, isInfoModalOpen, setIsInfoModalOpen, closeInfoModal, saveInfoPopupSettings,
    selectedTopicFilter, setSelectedTopicFilter, navigateToTopicStudy,
    zoomImage, openImageZoom, closeImageZoom
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}
