import React, { useState, useMemo } from 'react';
import {
  Target, CheckCircle2, Bookmark, GraduationCap,
  ChevronUp, ChevronDown, BarChart, TrendingUp,
  Zap, Sparkles, ArrowRight, Play, Check, Award,
  Quote
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';
import { BannedScreen, LoginRequiredView, VerificationBlockedScreen } from '../components/StatusScreens';
import { calculateReadinessStats } from '../utils/readiness';
import { getDailyQuote } from '../utils/quotes';

export function AnalyticsScreen() {
  const { questions, completedQuestions, markedQuestions, currentUser, userRole, navigateToTopicStudy } = useAppContext();
  const [showAllProgress, setShowAllProgress] = useState(false);
  const [showAllWeightage, setShowAllWeightage] = useState(false);
  const [currentQuote] = useState(() => getDailyQuote());

  const totalQs = questions.length;
  const completed = completedQuestions.length;
  const bookmarked = markedQuestions.length;
  const progressPercent = totalQs > 0 ? Math.round((completed / totalQs) * 100) : 0;

  // 1. Topic Stats Base
  const topicStats = useMemo(() => {
    const stats = {};
    questions.forEach(q => {
      const t = q.topic || 'Uncategorized';
      if (!stats[t]) stats[t] = { total: 0, completed: 0 };
      stats[t].total += 1;
      if (completedQuestions.includes(q.id)) stats[t].completed += 1;
    });
    return stats;
  }, [questions, completedQuestions]);

  // Topic Progress Array
  const topicProgress = useMemo(() => {
    return Object.entries(topicStats)
      .map(([topic, data]) => ({
        topic,
        total: data.total,
        completed: data.completed,
        pct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [topicStats]);

  // Topic Weightage Array
  const topicWeightage = useMemo(() => {
    return Object.entries(topicStats)
      .map(([topic, data]) => ({
        topic,
        total: data.total,
        weight: totalQs > 0 ? (data.total / totalQs) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [topicStats, totalQs]);

  const maxTopicCount = topicWeightage.length > 0 ? topicWeightage[0].total : 1;
  const visibleProgress = showAllProgress ? topicProgress : topicProgress.slice(0, 6);
  const visibleWeightage = showAllWeightage ? topicWeightage : topicWeightage.slice(0, 6);

  // 2. FEATURE 1: High-Yield Priority Matrix Calculation
  const highYieldMatrix = useMemo(() => {
    const matrix = Object.entries(topicStats).map(([topic, data]) => {
      const topicQuestions = questions.filter(q => (q.topic || 'Uncategorized') === topic);
      const repeatCount = topicQuestions.reduce((acc, q) => {
        const realApps = q.appearances.filter(a => a.exam !== 'BONUS').length;
        return acc + (realApps > 1 ? realApps : 0);
      }, 0);

      const uncompleted = data.total - data.completed;
      const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      // High Yield Score combines total question count and repeat frequency
      const hyScore = (data.total * 2) + (repeatCount * 3);

      let isMastered = pct >= 80;
      let isHighPriority = !isMastered && (hyScore >= 6 || uncompleted >= 3);

      return {
        topic,
        total: data.total,
        completed: data.completed,
        uncompleted,
        pct,
        repeatCount,
        hyScore,
        isMastered,
        isHighPriority
      };
    });

    // High Priority Focus Items (Uncompleted high weight topics)
    const priorityItems = matrix
      .filter(item => item.isHighPriority && item.uncompleted > 0)
      .sort((a, b) => b.hyScore - a.hyScore || b.uncompleted - a.uncompleted)
      .slice(0, 5);

    // Mastered Items
    const masteredItems = matrix
      .filter(item => item.isMastered)
      .sort((a, b) => b.completed - a.completed);

    return { priorityItems, masteredItems, all: matrix };
  }, [topicStats, questions]);

  // 3. FEATURE 6: Exam Readiness Score Calculation (0 - 100)
  const readinessStats = useMemo(() => {
    return calculateReadinessStats(questions, completedQuestions, markedQuestions);
  }, [questions, completedQuestions, markedQuestions]);

  // 4. Exam-wise Progress
  const examStats = useMemo(() => {
    const stats = { 'DNB': { total: 0, completed: 0 }, 'DCH': { total: 0, completed: 0 }, 'BONUS': { total: 0, completed: 0 } };
    questions.forEach(q => {
      const examsInQ = new Set(q.appearances.map(a => a.exam));
      examsInQ.forEach(exam => {
        if (stats[exam]) {
          stats[exam].total += 1;
          if (completedQuestions.includes(q.id)) stats[exam].completed += 1;
        }
      });
    });
    return stats;
  }, [questions, completedQuestions]);

  // 5. Repeated Topics (Based on exact frequency of times questions were asked)
  const repeatedTopics = useMemo(() => {
    const repeats = {};
    questions.forEach(q => {
      const realApps = q.appearances.filter(a => a.exam !== 'BONUS').length;
      if (realApps > 1) {
        const t = q.topic || 'Uncategorized';
        repeats[t] = (repeats[t] || 0) + realApps;
      }
    });
    return Object.entries(repeats).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [questions]);

  const maxRepeatCount = repeatedTopics.length > 0 ? repeatedTopics[0][1] : 1;

  if (userRole === 'banned') return <RestrictedAccessWrapper title="Access Revoked"><BannedScreen /></RestrictedAccessWrapper>;
  if (!currentUser) return <RestrictedAccessWrapper title="Login Required"><LoginRequiredView /></RestrictedAccessWrapper>;
  if (currentUser && !currentUser.emailVerified && userRole !== 'admin') return <RestrictedAccessWrapper title="Verification Required"><VerificationBlockedScreen /></RestrictedAccessWrapper>;

  return (
    <RestrictedAccessWrapper title="Study Analytics">
      <div className="space-y-6">
        {/* Informative Note Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 dark:from-blue-950/40 dark:via-gray-800 dark:to-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 rounded-2xl p-3.5 shadow-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="p-1.5 bg-blue-500 text-white rounded-xl text-xs font-bold shrink-0 mt-0.5 shadow-sm">
            💡
          </div>
          <div className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
            <span className="font-bold">Pro Tip for Accurate Analytics:</span> Your personalized study stats depend on questions marked as <span className="font-semibold underline decoration-blue-400 underline-offset-2">read/completed (✔️)</span>. Mark questions as completed after studying for better tracking of your topic progress and exam readiness.
          </div>
        </div>

        {/* Daily Medical Motivational Quote Card */}
        {currentQuote && (
          <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 dark:from-amber-950/30 dark:via-gray-800 dark:to-amber-950/20 border-2 border-orange-500/80 dark:border-amber-500/70 rounded-2xl p-3 sm:p-4.5 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 bg-gradient-to-tr from-orange-500 to-amber-400 text-white rounded-xl shadow-sm shrink-0 mt-0.5 border border-orange-400/30">
                <Quote size={18} />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 font-semibold italic leading-relaxed pt-0.5">
                  "{currentQuote.quote}"
                </p>
                <p className="text-xs font-bold text-orange-700 dark:text-amber-400 pt-0.5">
                  — {currentQuote.author}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Progress Banner */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg flex items-center gap-2"><Target size={20} /> Overall Progress</h3>
            <span className="text-2xl font-black">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p className="text-xs text-teal-100 mt-2">{completed} of {totalQs} questions completed</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-0.5">
              <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{completed}</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Completed</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-0.5">
              <Bookmark size={24} className="text-amber-500 fill-amber-100 dark:fill-amber-900/30 shrink-0" />
              <span className="text-2xl font-bold text-gray-800 dark:text-white">{bookmarked}</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Bookmarked</span>
          </div>
        </div>

        {/* FEATURE 6: Exam Readiness Score Index Card */}
        <div className="bg-gradient-to-br from-indigo-50/95 via-purple-50/70 to-teal-50/90 dark:from-indigo-950/50 dark:via-purple-950/30 dark:to-teal-950/40 border border-indigo-200/70 dark:border-indigo-800/50 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-3 relative overflow-hidden">
          {/* Background Ambient Glows */}
          <div className="absolute -top-10 -right-10 w-40 h-44 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-44 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-100/90 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 shadow-sm">
                <Award size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">Exam Readiness Index</h3>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">Composite preparation score based on coverage & revision</p>
              </div>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-sm ${readinessStats.badgeBg}`}>
              {readinessStats.icon} {readinessStats.level}
            </span>
          </div>

          {/* Main Score Inner Container */}
          <div className="relative z-10 bg-white/70 dark:bg-gray-800/80 backdrop-blur-sm border border-indigo-100/80 dark:border-gray-700/60 rounded-2xl p-4 space-y-3 shadow-inner">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Readiness Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 dark:from-indigo-300 dark:via-purple-300 dark:to-teal-300 bg-clip-text text-transparent">
                  {readinessStats.score}
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">/ 100 pts</span>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="h-3 w-full bg-gray-200/80 dark:bg-gray-700 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${readinessStats.progressGradient} transition-all duration-1000 shadow-md`}
                style={{ width: `${readinessStats.score}%` }}
              />
            </div>

            {/* Pastel Score Breakdown Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-teal-50/90 dark:bg-teal-950/40 p-2 rounded-xl border border-teal-200/80 dark:border-teal-800/50 shadow-sm">
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase block">Q-Bank</span>
                <span className="text-xs font-extrabold text-teal-900 dark:text-teal-200">{readinessStats.completionPts} / 40 pts</span>
              </div>
              <div className="bg-amber-50/90 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/80 dark:border-amber-800/50 shadow-sm">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase block">High Yield</span>
                <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200">{readinessStats.highYieldPts} / 40 pts</span>
              </div>
              <div className="bg-indigo-50/90 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-200/80 dark:border-indigo-800/50 shadow-sm">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase block">Revision</span>
                <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">{readinessStats.revisionPts} / 20 pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE 1 & 2: High-Yield Focus Matrix Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-teal-500/10 dark:from-amber-950/40 dark:to-gray-900 border border-amber-200/80 dark:border-amber-800/50 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-md">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">High-Yield Focus Matrix</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Target high-weightage topics needing focus</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/40">
              {highYieldMatrix.priorityItems.length} Priority Topics
            </span>
          </div>

          {/* Priority Topics List */}
          <div className="space-y-3 pt-1">
            {highYieldMatrix.priorityItems.length > 0 ? (
              highYieldMatrix.priorityItems.map(item => (
                <div key={item.topic} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3.5 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{item.topic}</span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-800/40 shrink-0">
                        {item.uncompleted} Unread Qs
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 shrink-0">{item.pct}%</span>
                    </div>
                  </div>

                  {/* FEATURE 2: Action Button */}
                  <button
                    onClick={() => navigateToTopicStudy(item.topic)}
                    className="shrink-0 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md shadow-teal-600/20 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Play size={12} className="fill-current" /> Practice Now
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 bg-white/60 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                🎉 Great job! You have covered all top high-yield topics.
              </div>
            )}
          </div>
        </div>

        {/* Exam-wise Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><GraduationCap size={18} className="text-indigo-500" /> Exam-wise Progress</h3>
          <div className="space-y-4">
            {Object.entries(examStats).map(([exam, data]) => {
              if (data.total === 0) return null;
              const pct = Math.round((data.completed / data.total) * 100) || 0;
              return (
                <div key={exam} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-gray-700 dark:text-gray-300">{exam}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-semibold">{data.completed} / {data.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${exam === 'BONUS' ? 'bg-purple-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FEATURE 2: Topic-wise Study Progress with Action Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-5">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Target size={18} className="text-teal-500" /> Topic Study Progress</h3>
          <div className="space-y-4 transition-all duration-300">
            {visibleProgress.map(({ topic, total, completed, pct }) => (
              <div key={topic} className="space-y-1.5 bg-gray-50/50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100/80 dark:border-gray-700/60">
                <div className="flex items-center justify-between text-xs gap-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">{topic}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">{completed} / {total} ({pct}%)</span>
                    <button
                      onClick={() => navigateToTopicStudy(topic)}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 active:scale-95"
                    >
                      Study <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
                <div className="relative h-2 w-full bg-gray-200/60 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-teal-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          {topicProgress.length > 6 && (
            <button onClick={() => setShowAllProgress(!showAllProgress)} className="w-full mt-4 py-2.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center justify-center gap-1">
              {showAllProgress ? <><ChevronUp size={14} /> See Less</> : <><ChevronDown size={14} /> See All {topicProgress.length} Topics</>}
            </button>
          )}
        </div>

        {/* Chapter Weightage */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-5">
          <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2"><BarChart size={18} className="text-indigo-500" /> Chapter Weightage</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">Distribution of questions across different chapters in the entire question bank.</p>
          <div className="space-y-4 transition-all duration-300">
            {visibleWeightage.map(({ topic, total, weight }) => (
              <div key={topic} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-2 flex-1">{topic}</span>
                  <span className="text-gray-500 dark:text-gray-400 font-semibold shrink-0">{total} Qs ({Math.round(weight)}%)</span>
                </div>
                <div className="relative h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(total / maxTopicCount) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          {topicWeightage.length > 6 && (
            <button onClick={() => setShowAllWeightage(!showAllWeightage)} className="w-full mt-4 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-1">
              {showAllWeightage ? <><ChevronUp size={14} /> See Less</> : <><ChevronDown size={14} /> See All {topicWeightage.length} Chapters</>}
            </button>
          )}
        </div>

        {/* FEATURE 2: Most Repeated Topics with Action Buttons */}
        {repeatedTopics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-6">
            <h3 className="font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2"><TrendingUp size={18} className="text-amber-500" /> Most Repeated Topics</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">Based on the total number of times questions from these topics were asked in previous exams.</p>
            <div className="space-y-4">
              {repeatedTopics.map(([topic, count], idx) => (
                <div key={topic} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{topic}</span>
                      <button
                        onClick={() => navigateToTopicStudy(topic)}
                        className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        Practice Repeats <ArrowRight size={10} />
                      </button>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000" style={{ width: `${(count / maxRepeatCount) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded shrink-0">
                    {count} Repeats
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RestrictedAccessWrapper>
  );
}
