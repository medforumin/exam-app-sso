import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, CheckCircle2, BookOpen, Layout, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  GraduationCap, Layers, Sparkles
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { RestrictedAccessWrapper } from '../components/RestrictedAccessWrapper';
import { QuestionCard } from '../components/QuestionCard';
import { BannedScreen, LoginRequiredView, VerificationBlockedScreen } from '../components/StatusScreens';

export function ChapterStudyScreen() {
  const { questions, curriculumMap, completedQuestions, markedQuestions, handleToggleMark, handleToggleRead, currentUser, userRole, upgradeMsg } = useAppContext();
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setSelectedChapter({ ...chapter, topic });
    setCurrentPage(1);
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
      const definedChapters = curriculumMap[topic] || [];
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
  }, [questions, curriculumMap]);

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
                <div className="text-[11px] font-extrabold text-teal-600 dark:text-teal-400 uppercase tracking-wider truncate">
                  {selectedChapter.topic}
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

            {chapterQuestions.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 sm:gap-3 mt-5 pb-4 pt-1 px-1">
                <button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 sm:px-3.5 rounded-xl font-bold text-xs sm:text-sm bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 shadow-sm hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 dark:hover:border-teal-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:transform-none transition-all duration-150 cursor-pointer shrink-0 min-h-[36px]"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} className="stroke-[2.5]" />
                  <span className="hidden xs:inline sm:inline">Previous</span>
                </button>

                <div className="flex items-center justify-center px-3 py-1.5 rounded-xl bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200/70 dark:border-gray-700/70 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 shadow-inner">
                  <span>Page <strong className="font-extrabold text-teal-600 dark:text-teal-400">{currentPage}</strong> of <strong className="font-extrabold text-gray-900 dark:text-white">{totalPages}</strong></span>
                </div>

                <button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 sm:px-3.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-md shadow-teal-600/20 dark:shadow-none active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:transform-none transition-all duration-150 cursor-pointer shrink-0 min-h-[36px]"
                  title="Next Page"
                >
                  <span className="hidden xs:inline sm:inline">Next</span>
                  <ChevronRight size={16} className="stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <RestrictedAccessWrapper title="Chapter Study">
      <div className="space-y-4 animate-slide-in">
        {/* Top Curriculum Summary Banner */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 dark:from-teal-900 dark:via-emerald-900 dark:to-teal-950 text-white rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">Curriculum Roadmap</h3>
                <p className="text-xs text-teal-100/90 font-medium">Topic & chapter structured study bank</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-white">{overallStats.pct}%</span>
              <span className="text-[10px] text-teal-100 block uppercase font-bold tracking-wider">Completed</span>
            </div>
          </div>

          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-teal-200 to-white rounded-full transition-all duration-1000"
              style={{ width: `${overallStats.pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-teal-100/90 font-semibold pt-0.5">
            <span className="flex items-center gap-1"><Layers size={13} /> {Object.keys(derivedCurriculum).length} Topics</span>
            <span className="flex items-center gap-1"><BookOpen size={13} /> {overallStats.totalChapters} Chapters</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={13} /> {overallStats.completedQs} / {overallStats.totalQs} Qs</span>
          </div>
        </div>

        {/* Topic Accordions List */}
        <div className="space-y-3">
          {Object.entries(derivedCurriculum).map(([topic, chapters]) => {
            const isExpanded = expandedTopic === topic;
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
                  onClick={() => setExpandedTopic(isExpanded ? null : topic)}
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
                              <h4 className={`font-semibold text-sm truncate ${chapProgress === 100 ? 'text-gray-500 dark:text-gray-400 line-through decoration-gray-300' : 'text-gray-800 dark:text-gray-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors'
                                }`}>
                                {chapter.name}
                              </h4>
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
          })}
        </div>
      </div>
    </RestrictedAccessWrapper>
  );
}
