import React, { useState, useEffect } from 'react';
import {
  Crown, CheckCircle2, Sparkles, Shield,
  Zap, Calendar, AlertCircle
} from 'lucide-react';
import { useAppContext, db } from '../context/AppContext';
import { UpiPaymentSection } from '../components/UpiPaymentSection';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { showToast } from '../platform/native';

export function UpgradeGoldScreen() {
  const { goBack, userRole, currentUser, membershipData, upiId: contextUpiId, payeeName: contextPayeeName, planRates } = useAppContext();
  const [selectedPlanId, setSelectedPlanId] = useState('plan_3m');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  const defaultPlans = [
    {
      id: 'plan_3m',
      title: '3 Months Gold Membership',
      durationMonths: 3,
      price: planRates?.plan_3m || 2999,
      badge: 'Popular Choice',
      description: 'Full access to Gold Answers, High-Yield Mnemonics & Question Bank for 3 Months'
    },
    {
      id: 'plan_6m',
      title: '6 Months Gold Membership',
      durationMonths: 6,
      price: planRates?.plan_6m || 4999,
      badge: 'Best Value',
      description: 'Full access to Gold Answers, High-Yield Mnemonics & Question Bank for 6 Months'
    },
    {
      id: 'plan_12m',
      title: '12 Months Gold Membership',
      durationMonths: 12,
      price: planRates?.plan_12m || 7999,
      badge: 'Maximum Savings',
      description: 'Full access to Gold Answers, High-Yield Mnemonics & Question Bank for 1 Year'
    }
  ];

  const [plans, setPlans] = useState(defaultPlans);
  const [upiConfig, setUpiConfig] = useState({
    upiId: contextUpiId || 'medforum@upi',
    payeeName: contextPayeeName || 'MedForum Pediatrics'
  });

  useEffect(() => {
    setPlans(defaultPlans);
  }, [planRates]);

  useEffect(() => {
    setUpiConfig({
      upiId: contextUpiId || 'medforum@upi',
      payeeName: contextPayeeName || 'MedForum Pediatrics'
    });
  }, [contextUpiId, contextPayeeName]);

  const isGold = userRole === 'gold';

  // Fetch live membership configuration and pending request status from Firestore
  useEffect(() => {
    let isMounted = true;

    async function loadConfigAndStatus() {
      try {
        const configRef = doc(db, 'settings', 'membership_config');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists() && isMounted) {
          const data = configSnap.data();
          if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
            setPlans(data.plans.filter(p => p.isActive !== false));
          }
          if (data.upiId) {
            setUpiConfig({
              upiId: data.upiId,
              payeeName: data.payeeName || 'MedForum Pediatrics'
            });
          }
        }

        // Check if user has a pending verification request
        if (currentUser && currentUser.uid) {
          const reqQuery = query(
            collection(db, 'membership_requests'),
            where('userId', '==', currentUser.uid),
            where('status', '==', 'pending_verification')
          );
          const reqSnap = await getDocs(reqQuery);
          if (!reqSnap.empty && isMounted) {
            const firstReq = reqSnap.docs[0].data();
            setPendingRequest({ id: reqSnap.docs[0].id, ...firstReq });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch membership config or status:', err);
      }
    }

    loadConfigAndStatus();
    return () => { isMounted = false; };
  }, [currentUser]);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0] || defaultPlans[0];

  const handleUtrSubmit = async ({ utrNumber, amount, planId, planTitle, upiId }) => {
    if (!currentUser) {
      showToast('Please log in to submit your payment verification.');
      return false;
    }

    // Security check: sanitize UTR number (must be alphanumeric, 6-24 chars)
    const sanitizedUtr = (utrNumber || '').replace(/[^a-zA-Z0-9]/g, '').trim();
    if (!sanitizedUtr || sanitizedUtr.length < 6) {
      showToast('Please enter a valid alphanumeric UTR / Transaction Reference ID.');
      return false;
    }

    setIsSubmitting(true);
    try {
      const durationMonths = selectedPlan?.durationMonths || (planId === 'plan_12m' ? 12 : planId === 'plan_6m' ? 6 : 3);
      const requestData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Gold Subscriber',
        userEmail: currentUser.email || '',
        planId,
        planTitle,
        durationMonths,
        amount,
        upiId,
        utrNumber: sanitizedUtr,
        status: 'pending_verification',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'membership_requests'), requestData);
      setPendingRequest({ id: docRef.id, ...requestData });
      showToast('Payment reference submitted successfully for Admin verification!');
      setIsSubmitting(false);
      return true;
    } catch (err) {
      console.error('Error submitting UTR:', err);
      showToast('Failed to record submission. Please check your internet connection.');
      setIsSubmitting(false);
      return false;
    }
  };

  return (
    <RestrictedAccessWrapper title="Upgrade to GOLD Access">
      <div className="space-y-6">

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Sparkles size={13} className="fill-white" /> Premium Exam Preparation
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Unlock All High-Yield Gold Answers & Mnemonics
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 font-medium max-w-xl">
              Get instant access to complete detailed solutions, high-yield clinical pearls, board mnemonics, and exclusive gold answers across all question sets.
            </p>

            {isGold && (
              <div className="mt-4 p-3.5 bg-white/20 backdrop-blur-md rounded-2xl flex items-center gap-3 border border-white/30 text-white text-xs font-bold">
                <CheckCircle2 size={20} className="shrink-0" />
                <div>
                  <span className="block font-black">You are currently a active GOLD Member!</span>
                  <span className="text-[11px] text-amber-100">
                    Expiry: {membershipData?.goldExpiry ? new Date(membershipData.goldExpiry).toLocaleDateString() : 'Active Access'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            1. Select Membership Duration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plans.map((p) => {
              const isSelected = selectedPlanId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-4 rounded-2xl border transition-all text-left relative flex flex-col justify-between ${isSelected
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-600 ring-2 ring-amber-500/50 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                  {p.badge && (
                    <span className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {p.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-1">{p.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-400">Price</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">₹{p.price}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
          <input
            id="terms-checkbox"
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
          />
          <label htmlFor="terms-checkbox" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
            I agree to the <span className="font-bold text-slate-800 dark:text-slate-200">Terms & Conditions</span> and <span className="font-bold text-slate-800 dark:text-slate-200">Refund Policy</span>. Payment verification is conducted by MedForum admin within 1-2 hours upon UTR submission.
          </label>
        </div>

        {/* UPI Payment Section */}
        {agreedTerms ? (
          <UpiPaymentSection
            amount={selectedPlan.price}
            planId={selectedPlan.id}
            planTitle={selectedPlan.title}
            upiConfig={upiConfig}
            onSubmitUtr={handleUtrSubmit}
            isSubmitting={isSubmitting}
            userPendingRequest={pendingRequest}
          />
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> Please agree to terms above to view UPI payment options.
          </div>
        )}

      </div>
    </RestrictedAccessWrapper>
  );
}
