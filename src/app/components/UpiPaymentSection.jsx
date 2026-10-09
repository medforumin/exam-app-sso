import React, { useState } from 'react';
import {
  Smartphone, QrCode, Copy, CheckCircle2, Zap,
  ShieldCheck, AlertCircle, Send, ArrowRight, Mail
} from 'lucide-react';
import {
  DEFAULT_UPI_CONFIG,
  UPI_APP_PACKAGES,
  buildUpiUrl,
  launchUpiIntent,
  getUpiQrCodeUrl,
  copyUpiIdToClipboard
} from '../utils/upiIntent';
import { showToast } from '../platform/native';
import { useAppContext } from '../context/AppContext';

export function UpiPaymentSection({
  amount = 2999,
  planId = 'plan_gold',
  planTitle = 'Gold Membership',
  upiConfig = DEFAULT_UPI_CONFIG,
  onSubmitUtr = null,
  isSubmitting = false,
  userPendingRequest = null
}) {
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [activeTab, setActiveTab] = useState('intent'); // 'intent' | 'qr'
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const appCtx = useAppContext ? useAppContext() : {};
  const currentUser = appCtx?.currentUser;
  const setCurrentScreen = appCtx?.setCurrentScreen;

  const payeeUpiId = upiConfig.upiId || DEFAULT_UPI_CONFIG.upiId;
  const payeeName = upiConfig.payeeName || DEFAULT_UPI_CONFIG.payeeName;
  const transactionNote = `Gold_Membership_${planId}`;

  const mailtoSubject = 'Payment confirmation for PediaQ GOLD membership';
  const mailtoBody = `Hello PediaQ Team,

I have completed the payment for PediaQ GOLD Membership.

Plan: ${planTitle}
Amount: ₹${amount}
${utrNumber ? `Transaction / UTR ID: ${utrNumber}\n` : ''}${currentUser?.email ? `User Email: ${currentUser.email}\n` : ''}
Please find my payment screenshot attached.

Thank you!`;

  const mailtoUrl = `mailto:pyq@dnbpedia.in?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

  // Generate UPI Payment URI
  const upiUrl = buildUpiUrl({
    pa: payeeUpiId,
    pn: payeeName,
    am: amount,
    tn: transactionNote,
    cu: 'INR'
  });

  const qrImageUrl = getUpiQrCodeUrl(upiUrl, 320);

  const handleCopyUpiId = async () => {
    const success = await copyUpiIdToClipboard(payeeUpiId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleAppLaunch = (appName) => {
    launchUpiIntent({
      pa: payeeUpiId,
      pn: payeeName,
      am: amount,
      tn: transactionNote,
      cu: 'INR'
    }, appName);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      showToast('Please enter a valid 12-digit UTR or Transaction Reference ID.');
      return;
    }

    if (typeof onSubmitUtr === 'function') {
      const res = await onSubmitUtr({
        utrNumber: cleanUtr,
        amount,
        planId,
        planTitle,
        upiId: payeeUpiId
      });
      if (res !== false) {
        setSubmissionSuccess(true);
        setShowConfirmationModal(true);
        setUtrNumber('');
      }
    } else {
      setSubmissionSuccess(true);
      setShowConfirmationModal(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider mb-1 backdrop-blur-sm">
              <Zap size={11} className="fill-white" /> Fast Instant UPI Payment
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight">{planTitle}</h3>
            <p className="text-xs text-amber-100 font-medium">Direct UPI Intent & Dynamic QR Code Launcher</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-amber-100 block">Total Amount</span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight">₹{amount}</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">

        {/* Notice Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 p-3.5 rounded-xl flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs font-medium leading-relaxed">
            <span className="font-extrabold text-amber-950 dark:text-amber-100 block mb-0.5">Important Notice:</span>
            After successful payment send the Trasaction Id via the below option or send the screenshot via email
          </div>
        </div>

        {/* Tab Switcher: Mobile App Intent vs Desktop QR Code */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('intent')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'intent'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} /> Pay via Installed App
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <QrCode size={14} /> Scan UPI QR Code
          </button>
        </div>

        {/* TAB 1: Mobile UPI App Intent Launcher */}
        {activeTab === 'intent' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold px-0.5">
              <span>Select your UPI payment app:</span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Auto-opens app</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Google Pay */}
              <button
                type="button"
                onClick={() => handleAppLaunch('gpay')}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                  GPay
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">Google Pay</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Launch GPay Intent</div>
                </div>
              </button>

              {/* PhonePe */}
              <button
                type="button"
                onClick={() => handleAppLaunch('phonepe')}
                className="flex items-center gap-3 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 group-hover:scale-110 transition-transform">
                  Pe
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-purple-950 dark:text-purple-100 truncate">PhonePe</div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-300">Launch PhonePe Intent</div>
                </div>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => handleAppLaunch('paytm')}
                className="flex items-center gap-3 p-3 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-100/60 dark:hover:bg-sky-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 group-hover:scale-110 transition-transform">
                  Paytm
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-sky-950 dark:text-sky-100 truncate">Paytm UPI</div>
                  <div className="text-[10px] text-sky-600 dark:text-sky-300">Launch Paytm Intent</div>
                </div>
              </button>

              {/* BHIM / Other Apps */}
              <button
                type="button"
                onClick={() => handleAppLaunch('bhim')}
                className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-[10px] shrink-0 group-hover:scale-110 transition-transform">
                  BHIM
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-amber-950 dark:text-amber-100 truncate">BHIM UPI</div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300">Launch BHIM App</div>
                </div>
              </button>
            </div>

            {/* Generic UPI Chooser Button */}
            <button
              type="button"
              onClick={() => handleAppLaunch('generic')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-[0.99]"
            >
              <Zap size={15} /> Pay with Any UPI App (Chooser Dialog) <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* TAB 2: Dynamic QR Code Scanner */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3 animate-in fade-in duration-200 text-center">
            <div className="p-2.5 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
              <img
                src={qrImageUrl}
                alt="UPI Payment QR Code"
                className="w-56 h-56 object-contain rounded-lg"
                loading="lazy"
              />
            </div>
            
            <div className="px-3.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 text-xs font-bold text-amber-950 dark:text-amber-200 shadow-xs">
              Paying to <span className="font-extrabold">{payeeName}</span> (<span className="font-mono">{payeeUpiId}</span>)
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Scan using any UPI App (GPay, PhonePe, Paytm, BHIM)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Amount ₹{amount} pre-filled automatically
              </p>
            </div>
          </div>
        )}

        {/* Payee VPA Box with 1-Click Copy */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Payee VPA / UPI ID
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate block">
              {payeeUpiId}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyUpiId}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 size={13} /> Copied!
              </>
            ) : (
              <>
                <Copy size={13} /> Copy ID
              </>
            )}
          </button>
        </div>

        {/* Payment Verification / UTR Submission */}
        {userPendingRequest ? (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-extrabold text-xs">
              <ShieldCheck size={16} /> Payment Request Pending Verification
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Submitted UTR: <span className="font-mono font-bold">{userPendingRequest.utrNumber}</span>
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Transaction details submitted successfully! Our admin team will verify and activate your GOLD membership within 6-12 hours.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCurrentScreen && setCurrentScreen('support')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-200 underline hover:opacity-80"
              >
                Visit support page to contact us if needed →
              </button>
            </div>
          </div>
        ) : submissionSuccess ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl text-center space-y-2 animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">Transaction Details Submitted Successfully!</h4>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              Your transaction details have been submitted successfully. The admin will activate your membership within 6-12 hours.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setCurrentScreen && setCurrentScreen('support')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 underline hover:opacity-80"
              >
                Visit support page to contact us if needed →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="utr-input" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Step 2: Submit UTR / Transaction Reference ID
              </label>
              <span className="text-[10px] text-slate-400">12-Digit Ref No.</span>
            </div>

            <div className="flex gap-2">
              <input
                id="utr-input"
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter 12-digit UTR (e.g. 4268XXXXXXXX)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-mono font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                type="submit"
                disabled={isSubmitting || !utrNumber.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                {isSubmitting ? 'Saving...' : 'Submit UTR'} <Send size={13} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
              <AlertCircle size={12} />
              <span>After paying via UPI, copy the UTR from your GPay/PhonePe receipt and paste above.</span>
            </div>
          </form>
        )}

        {/* Send Email Confirmation Button below Submit UTR */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Or send payment confirmation / screenshot via email:
          </span>
          <a
            href={mailtoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
          >
            <Mail size={15} /> Send Email to pyq@dnbpedia.in
          </a>
        </div>

      </div>

      {/* Interactive Popup Modal after UTR Submission */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center transform animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Transaction Details Submitted!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Your transaction details have been submitted successfully. The admin will activate your membership within 6-12 hours. Visit support page to contact us if needed.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmationModal(false);
                  if (setCurrentScreen) setCurrentScreen('support');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-md"
              >
                Visit Support Page
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmationModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
