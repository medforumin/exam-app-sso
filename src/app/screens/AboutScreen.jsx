import React from 'react';
import { Code, Stethoscope, Sparkles, Zap, Heart } from 'lucide-react';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';

export function AboutScreen() {
  return (
    <RestrictedAccessWrapper title="About Us">
      <div className="space-y-6 text-gray-600 dark:text-gray-300 animate-slide-in">
        {/* App Title & Version Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <Stethoscope size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">PediaQ</h2>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mt-2">
            <span>Version 7.5</span>
            <span>•</span>
            <span>Updated September 2026</span>
          </div>
        </div>

        {/* What's New in Version 7.5 Section */}
        <section className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-teal-50/80 dark:from-amber-950/30 dark:via-gray-800 dark:to-teal-950/20 border border-amber-200/80 dark:border-amber-800/50 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2 text-base">
              <Zap size={20} className="text-amber-500" /> What's New in Version 7.5
            </h3>
            <span className="text-[10px] font-black bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Latest Upgrade
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200">
            <div className="flex items-start gap-2.5">
              <span className="text-base shrink-0 mt-0.5">🔑</span>
              <div>
                <strong className="text-gray-900 dark:text-white block font-bold">Google Registration / Sign In</strong>
                Added Google Registration and 1-tap Sign In for fast, seamless, and secure authentication.
              </div>
            </div>
          </div>
        </section>

        {/* Content Authorship */}
        <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 text-base">
            <Sparkles size={18} /> Medical Content & Editorial
          </h3>
          <p className="text-sm leading-relaxed">
            Content developed by <b>Dr. Mradul Varshney, MD DCH (Pediatrics)</b>, Consultant Pediatrician and Neonatologist with a team of Qualified pediatricians.
          </p>
          <p className="text-sm leading-relaxed">
            Contact at hello@dnbpedia.in
          </p>
        </section>

        {/* Contributions & Acknowledgements */}
        <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 text-base">
            <Heart size={18} /> Contributions & Acknowledgements
          </h3>
          <p className="text-sm leading-relaxed">
            Special thanks to my juniors for their valuable suggestions, contributions, and feedback:
          </p>
          <div className="space-y-1.5 pl-1">
            <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span><b>Dr. Priyaba</b>, Consultant Pediatrician</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span><b>Dr. Rajvi Fuletra</b>, Consultant Pediatrician</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed pt-1">
            Key features like custom question filters and chapter-wise study sections were designed with their inputs and ideas.
          </p>
        </section>

        {/* Development Info */}
        <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-2 text-base">
            <Code size={18} /> Development & Tech
          </h3>
          <p className="text-sm leading-relaxed">
            Developed by <b>Medforum</b> with <b>Medicotech.in</b>
          </p>
          <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/40 rounded-xl text-xs text-teal-800 dark:text-teal-200 font-semibold">
            👨‍💻 Coded by: <b>Dr. Mradul</b>
          </div>
        </section>
      </div>
    </RestrictedAccessWrapper>
  );
}

