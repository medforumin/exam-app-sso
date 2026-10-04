import React from 'react';
import { Filter, Sparkles, Bookmark, CheckCircle2, ZoomIn, ArrowUpDown } from 'lucide-react';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';

export function HowToScreen() {
  return (
    <RestrictedAccessWrapper title="How to Use">
      <div className="space-y-4 text-gray-600 dark:text-gray-300">
        <section>
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
            <Filter size={18} /> Using Filters
          </h3>
          <p className="text-sm leading-relaxed">
            Use the dropdowns at the top of the main screen to filter questions.
            You can filter by <b>Exam</b> (DNB/DCH), specific <b>Year</b>,
            <b> Session</b> (June/Dec), or specific <b>Paper</b> number.
            Selecting <b>"All"</b> shows everything.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
            <ArrowUpDown size={18} /> Sorting Questions
          </h3>
          <p className="text-sm leading-relaxed">
            Use the sorting dropdown to order questions by <b>"Recently Updated"</b> (to view newly added answers & content first), <b>"Importance"</b> (High Yield), or <b>"Year & Session"</b>.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
            <ZoomIn size={18} /> Image Zoom & Pinch
          </h3>
          <p className="text-sm leading-relaxed">
            Tap any diagram, X-ray, or question image to open an interactive full-screen viewer. Use 2-finger pinch or double-tap to zoom up to 5× and drag/pan across detailed images.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-emerald-500" /> Mark as Complete
          </h3>
          <p className="text-sm leading-relaxed">
            Click or tap the <b>Checkmark button (Mark as Complete)</b> on any question card once you have read or studied it.
            This updates your live <b>Study Progress</b> percentage bar and automatically syncs your read status across all your devices when signed in.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
            <Sparkles size={18} /> Bonus Questions
          </h3>
          <p className="text-sm leading-relaxed">
            Questions marked as <b>BONUS</b> have never been asked previously but
            hold a high probability of appearing in upcoming exams. They appear
            specially badged for quick recognition.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
            <Bookmark size={18} /> Mark for Revision
          </h3>
          <p className="text-sm leading-relaxed">
            Tap the <b>bookmark icon</b> on any question card to mark it for
            revision. You can then toggle the <b>"Revision"</b> button in the top
            header to see only your marked questions.
          </p>
          <br />
          <p className="text-sm leading-relaxed">
            👉 Detailed Online Guide:
            <br />
            <a
              href="https://dnbpedia.in/pyq/how-to"
              target="_blank"
              rel="noreferrer"
              className="text-teal-600 dark:text-teal-400 hover:underline"
            >
              https://dnbpedia.in/pyq/how-to
            </a>
          </p>
        </section>
      </div>
    </RestrictedAccessWrapper>
  );
}
