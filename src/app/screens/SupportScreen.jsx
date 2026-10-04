import React from 'react';
import { 
  HelpCircle, MessageCircle, Send, ExternalLink, BookOpen, Contact2, Mail, 
  User, Share2, Info, ChevronRight, FileText, Globe, Headset
} from 'lucide-react';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';
import { useAppContext } from '../context/AppContext';

export function SupportScreen() {
  const { setCurrentScreen } = useAppContext();

  return (
    <RestrictedAccessWrapper title="Support & Help">
      <div className="space-y-6">
        {/* Header Hero */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <Headset size={32} className="text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="font-extrabold text-lg text-gray-800 dark:text-gray-100">
            How can we help you?
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Access direct support, manage your profile, or explore helpful resources.
          </p>
        </div>

        {/* UPPER SECTION: Account & Direct Support */}
        <div className="space-y-3">
          <h4 className="text-xs font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider px-1">
            Account & Direct Support
          </h4>

          {/* 1. About Us */}
          <button
            onClick={() => setCurrentScreen('about')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <Info size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                About Us
              </span>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-500" />
          </button>

          {/* 2. Profile (edit) */}
          <button
            onClick={() => setCurrentScreen('profile')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <User size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                Edit Profile
              </span>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-500" />
          </button>

          {/* 3. Email Support */}
          <a
            href="mailto:hello@dnbpedia.in?subject=Need%20help%20with%20Pediatrics%20PYQ%20app"
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <Mail size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                Email Support
              </span>
            </div>
            <Mail size={16} className="text-gray-400 group-hover:text-teal-500" />
          </a>

          {/* 4. Telegram Support */}
          <a
            href="https://t.me/iamhealer"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between p-4 bg-blue-50/70 dark:bg-blue-900/10 hover:bg-blue-100/70 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-blue-500">
                <Send size={18} />
              </div>
              <span className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                Telegram Support Group
              </span>
            </div>
            <ExternalLink size={16} className="text-blue-400" />
          </a>

          {/* 5. Feedback */}
          <a
            href="https://dnbpedia.in/pyq/app-feedback"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <MessageCircle size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                Submit Feedback
              </span>
            </div>
            <ExternalLink size={16} className="text-gray-400 group-hover:text-teal-500" />
          </a>
        </div>

        {/* LOWER SECTION: Resources, Guides & Policies */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <h4 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
            Resources, Guides & Policies
          </h4>

          {/* 1. How To screen link */}
          <button
            onClick={() => setCurrentScreen('howto')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <BookOpen size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                App Usage Guide (How To)
              </span>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-500" />
          </button>

          {/* 2. How to website link */}
          <a
            href="https://dnbpedia.in/pyq/how-to"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <Globe size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                How to Use (Website Guide)
              </span>
            </div>
            <ExternalLink size={16} className="text-gray-400 group-hover:text-teal-500" />
          </a>

          {/* 3. FAQ link */}
          <a
            href="https://dnbpedia.in/pyq/faq"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <HelpCircle size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                Frequently Asked Questions (FAQs)
              </span>
            </div>
            <ExternalLink size={16} className="text-gray-400 group-hover:text-teal-500" />
          </a>

          {/* 4. Terms (linking to Terms screen) */}
          <button
            onClick={() => setCurrentScreen('terms')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <FileText size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                Terms & Conditions
              </span>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-500" />
          </button>

          {/* 5. Contact Us link */}
          <a
            href="https://dnbpedia.in/contact"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-teal-600 dark:text-teal-400">
                <Contact2 size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
                Contact Us (Web Portal)
              </span>
            </div>
            <ExternalLink size={16} className="text-gray-400 group-hover:text-teal-500" />
          </a>

          {/* 6. Referral Scheme link */}
          <a
            href="https://dnbpedia.in/pyq/referral"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between p-4 bg-amber-50/70 dark:bg-amber-900/10 hover:bg-amber-100/70 dark:hover:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-amber-500">
                <Share2 size={18} />
              </div>
              <span className="font-semibold text-sm text-amber-900 dark:text-amber-200">
                Referral Scheme
              </span>
            </div>
            <ExternalLink size={16} className="text-amber-400" />
          </a>
        </div>

      </div>
    </RestrictedAccessWrapper>
  );
}
