import React, { useState, useEffect } from 'react';
import { Info, HelpCircle, ExternalLink } from 'lucide-react';
import { subscribeGlobalAlerts } from '../platform/native';
import { subscribeSSOLoading } from '../utils/wpSync';

export function GlobalAlerts() {
  const [alertData, setAlertData] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [isSSOLoading, setIsSSOLoading] = useState(false);

  useEffect(() => {
    const unsubAlerts = subscribeGlobalAlerts(
      (detail) => setAlertData(detail),
      (detail) => setConfirmData(detail)
    );
    const unsubSSO = subscribeSSOLoading((loading) => setIsSSOLoading(loading));
    return () => {
      unsubAlerts();
      unsubSSO();
    };
  }, []);

  return (
    <>
      {/* SSO Loading Toast Banner */}
      {isSSOLoading && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900/95 dark:bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-teal-500/40 backdrop-blur-xl flex items-center gap-3.5 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="text-left">
            <div className="font-extrabold text-xs text-white flex items-center gap-1.5">
              Opening DNBPedia... <ExternalLink size={13} className="text-teal-400" />
            </div>
            <div className="text-[10px] text-teal-200 font-medium">Authenticating single sign-on session</div>
          </div>
        </div>
      )}

      {/* Alert & Confirm Modals */}
      {(alertData || confirmData) && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          {alertData && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4">
                <Info size={24} className="text-teal-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notice</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">{alertData.message}</p>
              <div className="flex justify-end">
                <button onClick={() => setAlertData(null)} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors">OK</button>
              </div>
            </div>
          )}
          {confirmData && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle size={24} className="text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Action</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">{confirmData.message}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmData(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-colors">Cancel</button>
                <button onClick={() => { confirmData.onConfirm(); setConfirmData(null); }} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors">Confirm</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
