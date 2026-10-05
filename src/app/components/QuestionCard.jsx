import React, { useRef, useEffect } from 'react';
import {
  Sparkles, Crown, BarChart, CheckCircle, Bookmark, ChevronUp, ChevronDown,
  CheckCircle2, Clock, Flag, Pencil, Trash2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SafeHtmlContent } from './SafeHtmlContent';

export function QuestionCard({ data, isAdmin, onDelete, onEdit, isExpanded, onToggle, isMarked, onToggleMark, isRead, onToggleRead, userRole, teaser, upgradeMsg }) {
  const { openImageZoom } = useAppContext();
  const cardRef = useRef(null);
  useEffect(() => { if (isExpanded && cardRef.current) setTimeout(() => cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }, [isExpanded]);

  const handleCardClick = (e) => {
    if (e.target && e.target.tagName === 'IMG') {
      e.stopPropagation();
      if (openImageZoom) {
        openImageZoom(e.target.src, e.target.alt || 'Question Diagram');
      }
    }
  };

  const getImportanceColor = (imp) => {
    if (imp === 'High') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    if (imp === 'Medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
  };

  const isBonus = data.appearances.some(app => app.exam === 'BONUS');
  const isGold = data.collection === 'questions_gold' || data.accessLevel === 'gold';
  const isGoldLocked = isGold && userRole !== 'gold' && userRole !== 'admin';
  let cardClasses = `bg-white dark:bg-gray-800 rounded-xl border ${isGold ? 'border-amber-200 dark:border-amber-700' : isBonus ? 'border-purple-300 dark:border-purple-600' : 'border-teal-100 dark:border-gray-700'} shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-600 scroll-mt-32`;
  if (isBonus && !isGold) cardClasses += " bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-900/10 dark:to-gray-800";

  return (
    <div ref={cardRef} className={cardClasses} onClick={handleCardClick}>
      <div onClick={onToggle} className="p-4 cursor-pointer select-none active:bg-gray-50 dark:active:bg-gray-700 relative">
        {isBonus && <div className="absolute top-0 left-0 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10 flex items-center gap-1 shadow-sm"><Sparkles size={10} /> BONUS</div>}
        {isGold && <div className="absolute top-0 right-0 bg-amber-400 dark:bg-amber-600 text-amber-900 dark:text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1"><Crown size={10} /> GOLD</div>}

        <div className={`flex flex-col gap-2 ${(isBonus || isGold) ? 'mt-2' : ''}`}>
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{data.topic}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getImportanceColor(data.importance)}`}>{data.importance}</span>
              {data.appearances.length > 1 && !isBonus && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 flex items-center gap-1"><BarChart size={10} /> Repeated {data.appearances.length}x</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {!isAdmin && onToggleRead && (
                <button
                  disabled={isGoldLocked}
                  onClick={(e) => {
                    if (isGoldLocked) {
                      e.stopPropagation();
                      return;
                    }
                    onToggleRead(data.id, e);
                  }}
                  className={`p-1.5 rounded-full transition-colors ${isGoldLocked ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title={isGoldLocked ? "Mark as complete is disabled for Gold questions" : (isRead ? "Mark as Unread" : "Mark as Read")}
                >
                  <CheckCircle size={18} className={isRead ? "text-green-500 fill-green-100 dark:fill-green-900" : "text-gray-300 dark:text-gray-500 hover:text-green-400"} />
                </button>
              )}
              {!isAdmin && onToggleMark && (
                <button onClick={(e) => onToggleMark(data.id, e)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <Bookmark size={18} className={isMarked ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-500 hover:text-gray-400 dark:hover:text-gray-400"} />
                </button>
              )}
              <div className="text-gray-400 dark:text-gray-500 p-1">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
            </div>
          </div>
          <div className="w-full">
            <h3 className={`font-medium leading-snug ${isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
              {isRead && <CheckCircle2 size={16} className="inline-block mr-1.5 -mt-0.5 text-green-500 align-middle" />} {data.questionText}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {data.appearances.slice(0, 3).map((app, idx) => (
              app.exam === 'BONUS' ? <span key={idx} className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 font-bold flex items-center gap-1">✨ Expected</span>
                : <span key={idx} className="text-[10px] bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-gray-600">{app.exam} {app.session.slice(0, 3)} '{String(app.year).slice(2)} P{app.paper}</span>
            ))}
            {data.appearances.length > 3 && <span className="text-[10px] text-gray-400">+{data.appearances.length - 3} more</span>}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-slate-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Show teaser for gold content to non-gold non-admin users. Admins always see answer area (with fallback note if missing). */}
          {isGold && userRole !== 'gold' && userRole !== 'admin' ? (
            <div className="mb-2">
              <div className="bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="flex items-start gap-3 relative z-10">
                  <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full text-amber-600 dark:text-amber-200"><Crown size={20} /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-1">Premium Content Locked</h4>
                    <SafeHtmlContent className="prose prose-sm prose-amber dark:prose-invert max-w-none text-amber-800 dark:text-amber-200 text-xs leading-relaxed" html={upgradeMsg || '🔒 High-yield answers are available to GOLD members only. <a href="https://dnbpedia.in/pyq/memberships" target="_blank" rel="noopener noreferrer" class="font-extrabold underline hover:opacity-80">UPGRADE NOW⚡</a>'} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Admins or gold users see the answer area. If admin and answer missing, show a small fallback note.
            (userRole === 'admin' && (!data.answerText || data.answerText.trim() === '')) ? (
              <div className="mb-2 text-sm italic text-gray-500">No saved gold answer yet — please edit to add the answer.</div>
            ) : (
              <SafeHtmlContent className="prose prose-sm prose-teal dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 mb-4" html={data.answerText} />
            )
          )}
          {data.mnemonic && data.mnemonic.trim() !== '' && (
            <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 shadow-sm">
              <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-1"><Sparkles size={14} /> High Yield / Mnemonic</h4>
              <SafeHtmlContent className="prose prose-sm prose-indigo dark:prose-invert max-w-none text-indigo-800 dark:text-indigo-200 text-sm" html={data.mnemonic} />
            </div>
          )}
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1"><Clock size={12} /> {isBonus ? 'Question Origin:' : 'Exam History:'}</p>
            <div className="flex flex-wrap gap-1.5">
              {data.appearances.map((app, idx) => (
                app.exam === 'BONUS' ? <span key={idx} className="text-[10px] bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded shadow-sm font-bold flex items-center gap-1">✨ Bonus / High Yield</span>
                  : <span key={idx} className="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded shadow-sm">{app.exam} • {app.year} • {app.session} • Paper {app.paper}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <a
                href={`mailto:pyq@dnbpedia.in?subject=Error%20Report%20-%20Question%20ID:%20${data.id}&body=Question:%20${encodeURIComponent(data.questionText || '')}%0A%0AError%20Details:%20`}
                onClick={(e) => e.stopPropagation()}
                className="text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Report an error or outdated guideline"
              >
                <Flag size={14} /> Report Error
              </a>
              {isAdmin && data?.id && (
                <span
                  className="text-[10px] font-mono font-bold text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-700/80 px-2 py-0.5 rounded border border-slate-200 dark:border-gray-600 select-all cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                  title="Database Document ID (Click to copy)"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (data?.id) navigator.clipboard?.writeText(data.id);
                  }}
                >
                  ID: {data.id}
                </span>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); onEdit(data); }} className="text-teal-600 hover:text-teal-800 dark:text-teal-400 font-medium flex items-center gap-1 text-xs px-2 py-1 bg-teal-50 dark:bg-teal-900/30 rounded"><Pencil size={12} /> Edit</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(data.id, data.collection); }} className="text-red-500 hover:text-red-700 dark:text-red-400 font-medium flex items-center gap-1 text-xs px-2 py-1 bg-red-50 dark:bg-red-900/30 rounded"><Trash2 size={12} /> Delete</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
