import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, CheckCircle2, BookOpen, Layout, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  GraduationCap, Layers, Sparkles, Search, X, Filter, ChevronsDown, ChevronsUp, RotateCcw, Clock, ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';
import { QuestionCard } from '../components/QuestionCard';
import { BannedScreen, LoginRequiredView, VerificationBlockedScreen } from '../components/StatusScreens';

export function ChapterStudyScreen() {
  const { questions, curriculumMap, completedQuestions, markedQuestions, handleToggleMark, handleToggleRead, currentUser, userRole, upgradeMsg } = useAppContext();
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [expandedTopicsMap, setExpandedTopicsMap] = useState({});
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Phase 1: Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_progress' | 'completed' | 'unstarted'
  const [allExpanded, setAllExpanded] = useState(false);

  // Phase 2: Last Studied Chapter State
  const [lastStudied, setLastStudied] = useState(() => {
    try {
      const key = currentUser?.uid ? `pediaq_last_chapter_${currentUser.uid}` : 'pediaq_last_chapter_guest';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Re-sync lastStudied key when user logs in/out or switches account
  React.useEffect(() => {
    try {
      const key = currentUser?.uid ? `pediaq_last_chapter_${currentUser.uid}` : 'pediaq_last_chapter_guest';
      const saved = localStorage.getItem(key);
      if (saved) {
        setLastStudied(JSON.parse(saved));
      }
    } catch (e) { }
  }, [currentUser?.uid]);

  // Handle hardware / app back button and browser back button when a chapter question list is open
  React.useEffect(() => {
    const handleChaptersBack = (e) => {
      if (selectedChapter) {
        e.preventDefault();
        setSelectedChapter(null);
        setCurrentPage(1);
      }
    };
    window.addEventListener('chapters_back_pressed', handleChaptersBack);
    return () => window.removeEventListener('chapters_back_pressed', handleChaptersBack);
  }, [selectedChapter]);

  const handleSelectChapter = (chapter, topic) => {
    const chapterData = { id: chapter.id, name: chapter.name, topic };
    setSelectedChapter({ ...chapter, topic });
    setLastStudied(chapterData);
    setCurrentPage(1);
    try {
      const key = currentUser?.uid ? `pediaq_last_chapter_${currentUser.uid}` : 'pediaq_last_chapter_guest';
      localStorage.setItem(key, JSON.stringify(chapterData));
    } catch (e) { }
    try {
      window.history.pushState({ screen: 'chapters', chapterId: chapter.id }, '', '');
    } catch (e) { }
  };

  const derivedCurriculum = useMemo(() => {
    const map = {};
    const savedOrder = curriculumMap?._sectionOrder || Object.keys(curriculumMap || {}).filter(k => k !== '_sectionOrder');
    const allTopicsFromQs = [...new Set(questions.map(q => q.topic).filter(Boolean))];

    const orderedTopics = [];
    savedOrder.forEach(t => {
      if (allTopicsFromQs.includes(t) || (curriculumMap?.[t] && curriculumMap[t].length > 0)) {
        orderedTopics.push(t);
      }
    });
    const remainingTopics = allTopicsFromQs.filter(t => !orderedTopics.includes(t)).sort();
    orderedTopics.push(...remainingTopics);

    orderedTopics.forEach(topic => {
      let definedChapters = curriculumMap[topic] || [];
      // Filter out draft chapters for non-admin users
      if (userRole !== 'admin') {
        definedChapters = definedChapters.filter(c => !c.isDraft);
      }
      const allTopicQs = questions.filter(q => q.topic === topic);
      const assignedQIds = new Set(definedChapters.flatMap(c => c.questionIds || []));
      const unassignedQs = allTopicQs.filter(q => !assignedQIds.has(q.id));
      const finalChapters = [...definedChapters];
      if (unassignedQs.length > 0) {
        finalChapters.push({
          id: 'uncategorized_' + topic,
          name: 'Other Questions',
          questionIds: unassignedQs.map(q => q.id)
        });
      }
      map[topic] = finalChapters;
    });
    return map;
  }, [questions, curriculumMap, userRole]);

  // Phase 1: Filter curriculum by search query and topic completion status
  const filteredCurriculum = useMemo(() => {
    const queryLower = searchQuery.trim().toLowerCase();
    const result = {};

    Object.entries(derivedCurriculum).forEach(([topic, chapters]) => {
      // Filter chapters by search query
      const matchingChapters = chapters.filter(chap => {
        if (chap.questionIds.length === 0) return false;
        if (!queryLower) return true;
        return topic.toLowerCase().includes(queryLower) || chap.name.toLowerCase().includes(queryLower);
      });

      if (matchingChapters.length === 0) return;

      // Calculate topic-level progress for status filtering
      const topicTotalQs = matchingChapters.reduce((sum, chap) => sum + chap.questionIds.length, 0);
      const topicCompletedQs = matchingChapters.reduce((sum, chap) => sum + chap.questionIds.filter(id => completedQuestions.includes(id)).length, 0);
      const topicProgress = topicTotalQs > 0 ? Math.round((topicCompletedQs / topicTotalQs) * 100) : 0;

      if (statusFilter === 'completed' && topicProgress < 100) return;
      if (statusFilter === 'in_progress' && (topicProgress === 0 || topicProgress === 100)) return;
      if (statusFilter === 'unstarted' && topicProgress > 0) return;

      result[topic] = matchingChapters;
    });

    return result;
  }, [derivedCurriculum, searchQuery, statusFilter, completedQuestions]);

  // Phase 2: Resolve active details for last studied chapter
  const resolvedLastChapter = useMemo(() => {
    if (!lastStudied || !lastStudied.topic || !lastStudied.id) return null;
    const topicChapters = derivedCurriculum[lastStudied.topic];
    if (!topicChapters) return null;
    const chap = topicChapters.find(c => c.id === lastStudied.id);
    if (!chap || chap.questionIds.length === 0) return null;

    const chapCompleted = chap.questionIds.filter(id => completedQuestions.includes(id)).length;
    const chapTotal = chap.questionIds.length;
    const chapProgress = Math.round((chapCompleted / chapTotal) * 100);

    return {
      ...chap,
      topic: lastStudied.topic,
      completedCount: chapCompleted,
      totalCount: chapTotal,
      progressPct: chapProgress
    };
  }, [lastStudied, derivedCurriculum, completedQuestions]);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedTopicsMap({});
      setExpandedTopic(null);
      setAllExpanded(false);
    } else {
      const allMap = {};
      Object.keys(filteredCurriculum).forEach(t => { allMap[t] = true; });
      setExpandedTopicsMap(allMap);
      setAllExpanded(true);
    }
  };

  const isTopicExpanded = (topic) => {
    if (searchQuery.trim().length > 0) return true; // Auto-expand when searching
    return !!expandedTopicsMap[topic] || expandedTopic === topic;
  };

  const toggleTopicExpand = (topic) => {
    setExpandedTopicsMap(prev => ({
      ...prev,
      [topic]: !isTopicExpanded(topic)
    }));
    if (expandedTopic === topic) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topic);
    }
  };

  const overallStats = useMemo(() => {
    let totalQs = 0;
    let completedQs = 0;
    let totalChapters = 0;
    Object.values(derivedCurriculum).forEach(chapters => {
      chapters.forEach(chap => {
        if (chap.questionIds.length > 0) {
          totalChapters += 1;
          totalQs += chap.questionIds.length;
          completedQs += chap.questionIds.filter(id => completedQuestions.includes(id)).length;
        }
      });
    });
    const pct = totalQs > 0 ? Math.round((completedQs / totalQs) * 100) : 0;
    return { totalQs, completedQs, totalChapters, pct };
  }, [derivedCurriculum, completedQuestions]);

  if (userRole === 'banned') return <RestrictedAccessWrapper title="Access Revoked"><BannedScreen /></RestrictedAccessWrapper>;
  if (!currentUser) return <RestrictedAccessWrapper title="Login Required"><LoginRequiredView /></RestrictedAccessWrapper>;
  if (currentUser && !currentUser.emailVerified && userRole !== 'admin') return <RestrictedAccessWrapper title="Verification Required"><VerificationBlockedScreen /></RestrictedAccessWrapper>;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    scrollToTop();
  };

  // Helper to render chapter metadata badges (Yield Level, Est. Time, Draft)
  const renderChapterBadges = (chapter) => {
    if (!chapter) return null;
    const hasYield = chapter.yieldLevel && chapter.yieldLevel !== 'standard';
    const hasTime = !!chapter.estTime;
    const isDraft = !!chapter.isDraft;

    if (!hasYield && !hasTime && !isDraft) return null;

    return (
      <div className="flex items-center gap-1 flex-wrap shrink-0">
        {isDraft && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 shadow-xs">
            Draft 🟡
          </span>
        )}
        {chapter.yieldLevel === 'high' && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs">
            🌟 High Yield
          </span>
        )}
        {chapter.yieldLevel === 'bonus' && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs">
            🎁 Bonus
          </span>
        )}
        {chapter.estTime && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60">
            ⏱️ {chapter.estTime}
          </span>
        )}
      </div>
    );
  };

  // Phase 5: Pagination Controls Helper
  const renderPaginationControls = (chapterQuestions, totalPages, isTop = false) => {
    if (!chapterQuestions || chapterQuestions.length === 0) return null;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, chapterQuestions.length);

    return (
      <div className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gray-50/90 dark:bg-gray-800/80 rounded-xl border border-gray-200/70 dark:border-gray-700/70 text-xs ${isTop ? 'mb-2' : 'mt-5 pb-2'}`}>
        {/* Items Per Page Selector */}
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-semibold">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={999999}>All ({chapterQuestions.length})</option>
          </select>
        </div>

        {/* Question Counter Indicator */}
        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
          Showing <span className="font-bold text-teal-600 dark:text-teal-400">{startItem}–{endItem}</span> of <span className="font-bold text-gray-800 dark:text-gray-200">{chapterQuestions.length}</span>
        </div>

        {/* Navigation & Direct Jump Selector */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center p-1.5 sm:px-2.5 rounded-lg font-bold text-xs bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 shadow-xs hover:bg-teal-50 dark:hover:bg-teal-950/40 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft size={15} />
              <span className="hidden sm:inline ml-0.5">Prev</span>
            </button>

            {/* Direct Jump Page Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-0.5 shadow-xs">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Page</span>
              <select
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="bg-transparent font-extrabold text-teal-600 dark:text-teal-400 text-xs focus:outline-none cursor-pointer py-0.5"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <option key={p} value={p} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                    {p}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-gray-400 font-medium">/ {totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center p-1.5 sm:px-2.5 rounded-lg font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-xs hover:from-teal-700 hover:to-teal-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              title="Next Page"
            >
              <span className="hidden sm:inline mr-0.5">Next</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    );
  };

  if (selectedChapter) {
    const chapterQuestions = selectedChapter.questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean);
    const completedInChapter = chapterQuestions.filter(q => completedQuestions.includes(q.id)).length;
    const progressPct = chapterQuestions.length > 0 ? Math.round((completedInChapter / chapterQuestions.length) * 100) : 0;
    const totalPages = Math.ceil(chapterQuestions.length / itemsPerPage);
    const currentQuestions = chapterQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div className="min-h-screen font-sans flex justify-center bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white animate-slide-in">
        <div className="w-full md:max-w-2xl lg:max-w-5xl xl:max-w-5xl mx-auto bg-white dark:bg-gray-900 min-h-screen shadow-xl flex flex-col relative transition-colors duration-300">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-2.5 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-30 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedChapter(null); setCurrentPage(1); }}
                className="hover:bg-teal-50 dark:hover:bg-gray-800 p-2 rounded-xl transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 shrink-0 cursor-pointer"
                title="Back to Chapters"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider truncate">
                    {selectedChapter.topic}
                  </span>
                  {renderChapterBadges(selectedChapter)}
                </div>
                <h2 className="font-bold text-base sm:text-lg truncate text-gray-900 dark:text-white leading-tight">
                  {selectedChapter.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-0.5">
              <div className="h-2 flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 shrink-0">
                {completedInChapter} / {chapterQuestions.length} ({progressPct}%)
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
            {/* Top Pagination Controls */}
            {renderPaginationControls(chapterQuestions, totalPages, true)}

            <div key={currentPage} className="space-y-4 animate-slide-up">
              {currentQuestions.length > 0 ? currentQuestions.map((q, idx) => {
                const questionNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <div key={q.id} className="relative">
                    <div className="absolute -left-2 top-4 w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-[10px] font-black z-10 shadow-md border-2 border-white dark:border-gray-900 -translate-x-1/2">
                      {questionNumber}
                    </div>
                    <div className="pl-4">
                      <QuestionCard data={q} isAdmin={false} isExpanded={expandedQuestionId === q.id} onToggle={() => setExpandedQuestionId(prev => prev === q.id ? null : q.id)} isMarked={markedQuestions.includes(q.id)} onToggleMark={handleToggleMark} isRead={completedQuestions.includes(q.id)} onToggleRead={handleToggleRead} userRole={userRole} teaser={''} upgradeMsg={upgradeMsg} />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 font-medium">
                  No active questions in this chapter.
                </div>
              )}
            </div>

            {/* Bottom Pagination Controls */}
            {renderPaginationControls(chapterQuestions, totalPages, false)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <RestrictedAccessWrapper title="Chapter Study">
      <div className="space-y-4 animate-slide-in">
        {/* Top Curriculum Summary Banner */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-900 dark:via-emerald-900 dark:to-teal-950 text-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-white/15 backdrop-blur-sm rounded-lg border border-white/20 shrink-0">
                <GraduationCap size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate">Curriculum Roadmap</h3>
                <p className="text-[11px] text-teal-100/90 font-medium hidden sm:block truncate">Topic & chapter structured study bank</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-lg sm:text-xl font-black text-white leading-none">{overallStats.pct}%</span>
                <span className="text-[10px] text-teal-100 font-bold uppercase tracking-wider">Done</span>
              </div>
            </div>
          </div>

          <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-teal-200 to-white rounded-full transition-all duration-1000"
              style={{ width: `${overallStats.pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] sm:text-xs text-teal-100/90 font-semibold">
            <span className="flex items-center gap-1"><Layers size={12} /> {Object.keys(derivedCurriculum).length} Topics</span>
            <span className="flex items-center gap-1"><BookOpen size={12} /> {overallStats.totalChapters} Chapters</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {overallStats.completedQs}/{overallStats.totalQs} Qs</span>
          </div>
        </div>

        {/* Phase 2: Resume Last Studied Hero Card */}
        {resolvedLastChapter && !selectedChapter && (
          <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 dark:from-amber-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 border border-amber-300/60 dark:border-amber-700/50 rounded-2xl p-3.5 sm:p-4 shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Clock size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Sparkles size={11} className="text-amber-500 animate-pulse" /> Continue Learning
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    {resolvedLastChapter.name}
                  </h4>
                  {renderChapterBadges(resolvedLastChapter)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-teal-600 dark:text-teal-400 truncate">{resolvedLastChapter.topic}</span>
                  <span>•</span>
                  <span>{resolvedLastChapter.completedCount}/{resolvedLastChapter.totalCount} Qs ({resolvedLastChapter.progressPct}%)</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectChapter(resolvedLastChapter, resolvedLastChapter.topic)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-teal-600 to-teal-700 hover:from-amber-600 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/15 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>Resume Chapter</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Phase 1: Search & Filter Toolbar */}
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm space-y-3">
          {/* Search Input Bar + Mobile Icon-Only Expand/Collapse Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics or chapters (e.g. Neonatology, Cardiology)..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors cursor-pointer"
                  title="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile Icon-Only Expand / Collapse Button */}
            <button
              type="button"
              onClick={toggleExpandAll}
              className="sm:hidden p-2.5 rounded-xl text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/50 hover:bg-teal-100/70 dark:hover:bg-teal-900/50 transition-all cursor-pointer shrink-0"
              title={allExpanded ? 'Collapse All' : 'Expand All'}
            >
              {allExpanded ? <ChevronsUp size={18} /> : <ChevronsDown size={18} />}
            </button>
          </div>

          {/* Filter Pills & Desktop Expand/Collapse All */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            {/* Status Filter Pills (Single compact row with horizontal scroll on mobile) */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full shrink-0">
              <span className="text-gray-400 dark:text-gray-500 flex items-center shrink-0 mr-0.5">
                <Filter size={13} className="sm:hidden text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider">
                  <Filter size={11} /> Filter:
                </span>
              </span>
              {[
                { id: 'all', mobileLabel: 'All', desktopLabel: 'All Topics' },
                { id: 'in_progress', mobileLabel: 'In Progress ⏳', desktopLabel: 'In Progress ⏳' },
                { id: 'completed', mobileLabel: 'Done ✅', desktopLabel: 'Completed ✅' },
                { id: 'unstarted', mobileLabel: 'Unstarted ⭕', desktopLabel: 'Unstarted ⭕' }
              ].map(pill => {
                const isActive = statusFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-2.5 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    <span className="sm:hidden">{pill.mobileLabel}</span>
                    <span className="hidden sm:inline">{pill.desktopLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Expand / Collapse All Button */}
            <button
              type="button"
              onClick={toggleExpandAll}
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/50 hover:bg-teal-100/70 dark:hover:bg-teal-900/50 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ml-auto"
            >
              {allExpanded ? (
                <>
                  <ChevronsUp size={13} /> Collapse All
                </>
              ) : (
                <>
                  <ChevronsDown size={13} /> Expand All
                </>
              )}
            </button>
          </div>
        </div>

        {/* Topic Accordions List */}
        <div className="space-y-3">
          {Object.keys(filteredCurriculum).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-sm">
                <Search size={22} />
              </div>
              <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-200">
                No matching topics or chapters found
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Try adjusting your search query or clear the active status filter.
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-sm hover:bg-teal-700 transition-all cursor-pointer"
              >
                <RotateCcw size={13} /> Reset Search & Filters
              </button>
            </div>
          ) : (
            Object.entries(filteredCurriculum).map(([topic, chapters]) => {
              const isExpanded = isTopicExpanded(topic);
              const topicTotalQs = chapters.reduce((sum, chap) => sum + chap.questionIds.length, 0);
              const topicCompletedQs = chapters.reduce((sum, chap) => sum + chap.questionIds.filter(id => completedQuestions.includes(id)).length, 0);
              const topicProgress = topicTotalQs > 0 ? Math.round((topicCompletedQs / topicTotalQs) * 100) : 0;

              return (
                <div
                  key={topic}
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded
                    ? 'border-teal-400/50 dark:border-teal-600/50 bg-white dark:bg-gray-800 shadow-md ring-1 ring-teal-500/20'
                    : 'border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm'
                    }`}
                >
                  <button
                    onClick={() => toggleTopicExpand(topic)}
                    className="w-full p-4 flex flex-col gap-2.5 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800/90 hover:from-teal-50/40 hover:to-white dark:hover:from-gray-750 text-left transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-base sm:text-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        {topic}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${topicProgress === 100
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          : topicProgress > 0
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60'
                            : 'bg-gray-100 dark:bg-gray-750 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                          }`}>
                          {topicProgress}%
                        </span>
                        {isExpanded ? <ChevronUp size={18} className="text-teal-600 dark:text-teal-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full">
                      <span className="text-[11px] font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800/40 shrink-0">
                        {chapters.length} Chapters
                      </span>
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden p-[1px]">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${topicProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold shrink-0">
                        {topicCompletedQs} / {topicTotalQs} Qs
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-850/80 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {chapters.map((chapter) => {
                        const chapCompleted = chapter.questionIds.filter(id => completedQuestions.includes(id)).length;
                        const chapTotal = chapter.questionIds.length;
                        const chapProgress = chapTotal > 0 ? Math.round((chapCompleted / chapTotal) * 100) : 0;
                        if (chapTotal === 0) return null;
                        const isUncategorized = chapter.id.startsWith('uncategorized_');

                        return (
                          <button
                            key={chapter.id}
                            onClick={() => handleSelectChapter(chapter, topic)}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-gray-750 border border-transparent hover:border-teal-200 dark:hover:border-teal-800/50 hover:shadow-sm transition-all text-left group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${chapProgress === 100
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : isUncategorized
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                                  : 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-200/80 dark:border-teal-800/40'
                                }`}>
                                {chapProgress === 100 ? <CheckCircle2 size={18} className="text-emerald-500" /> : <BookOpen size={18} />}
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`font-semibold text-sm truncate ${chapProgress === 100 ? 'text-gray-500 dark:text-gray-400 line-through decoration-gray-300' : 'text-gray-800 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors'
                                    }`}>
                                    {chapter.name}
                                  </h4>
                                  {renderChapterBadges(chapter)}
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                                  <Layout size={11} className="text-teal-500/70" /> {chapTotal} Questions
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {chapProgress > 0 && chapProgress < 100 && (
                                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/40 px-2 py-0.5 rounded-full">
                                  {chapProgress}%
                                </span>
                              )}
                              {chapProgress === 100 && (
                                <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full uppercase">
                                  Done
                                </span>
                              )}
                              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }))}
        </div>
      </div>
    </RestrictedAccessWrapper>
  );
}
