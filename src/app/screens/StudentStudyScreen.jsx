import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle, Crown, Search, RefreshCw, Tags, ChevronDown, ArrowUpDown, Loader2,
  ChevronLeft, ChevronRight, ArrowRight, Target, Sparkles
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { calculateReadinessStats } from '../utils/readiness';
import { QuestionCard } from '../components/QuestionCard';
import { TeaserCard } from '../components/TeaserCard';

export function StudentStudyScreen() {
  const {
    questions, loading, teaser, userRole, userName, setCurrentScreen,
    completedQuestions, markedQuestions, sortCompletedSnapshot, handleToggleMark,
    handleToggleRead, handleManualSync, uniqueTopics, filters, showMarkedOnly,
    selectedTopicFilter, setSelectedTopicFilter, upgradeMsg
  } = useAppContext();

  // Localized State for filtering & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('remaining');
  const [filterTopic, setFilterTopic] = useState(selectedTopicFilter || 'All');
  const [showFreeFirst, setShowFreeFirst] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (selectedTopicFilter) {
      setFilterTopic(selectedTopicFilter);
    }
  }, [selectedTopicFilter]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTopic, filters, showMarkedOnly, showFreeFirst]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    scrollToTop();
  };

  const teaserIndex = useMemo(() => (currentPage % 3) + 4, [currentPage]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTopic = filterTopic === 'All' || q.topic === filterTopic;
      const matchesFilters = q.appearances.some(app => {
        if (app.exam === 'BONUS') return filters.exam === 'BONUS' || (filters.exam === 'All' && filters.year === 'All' && filters.session === 'All' && filters.paper === 'All');
        return (filters.exam === 'All' || app.exam === filters.exam) && (filters.year === 'All' || app.year === Number(filters.year)) && (filters.session === 'All' || app.session === filters.session) && (filters.paper === 'All' || String(app.paper) === String(filters.paper));
      });
      return matchesSearch && matchesTopic && matchesFilters && (showMarkedOnly ? markedQuestions.includes(q.id) : true);
    }).sort((a, b) => {
      if (showFreeFirst) {
        const aIsGold = a.collection === 'questions_gold' || a.accessLevel === 'gold' ? 1 : 0;
        const bIsGold = b.collection === 'questions_gold' || b.accessLevel === 'gold' ? 1 : 0;
        if (aIsGold !== bIsGold) {
          return aIsGold - bIsGold;
        }
      }
      const getSortYear = (app) => Number(app.year) || 0;
      if (sortBy === 'remaining' || sortBy === 'completed') {
        const aCompleted = sortCompletedSnapshot.includes(a.id); const bCompleted = sortCompletedSnapshot.includes(b.id);
        if (aCompleted !== bCompleted) return sortBy === 'remaining' ? (aCompleted ? 1 : -1) : (aCompleted ? -1 : 1);
        return Math.max(...b.appearances.map(getSortYear), 0) - Math.max(...a.appearances.map(getSortYear), 0);
      }
      if (sortBy === 'year') { return Math.max(...b.appearances.map(getSortYear), 0) - Math.max(...a.appearances.map(getSortYear), 0); }
      if (sortBy === 'updated') {
        const getUpdatedTime = (q) => {
          const val = q.updatedAt || q.lastUpdated || q.createdAt || q.updated_at || q.created_at;
          if (val) {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
              const parsed = Date.parse(val);
              if (!isNaN(parsed)) return parsed;
            }
            if (val && typeof val.seconds === 'number') return val.seconds * 1000;
            if (val && typeof val.toDate === 'function') return val.toDate().getTime();
          }
          if (q.id && !isNaN(Number(q.id)) && Number(q.id) > 1000000000) return Number(q.id);
          const maxYear = Math.max(...(q.appearances || []).map(getSortYear), 0);
          return maxYear ? maxYear * 10000 : 0;
        };
        return getUpdatedTime(b) - getUpdatedTime(a);
      }
      if (sortBy === 'topic') return a.topic.localeCompare(b.topic);
      if (sortBy === 'importance') return { 'High': 3, 'Medium': 2, 'Low': 1 }[b.importance] - { 'High': 3, 'Medium': 2, 'Low': 1 }[a.importance];
      if (sortBy === 'frequency') return b.appearances.length - a.appearances.length;
      return 0;
    });
  }, [questions, searchTerm, filterTopic, filters, showMarkedOnly, markedQuestions, sortCompletedSnapshot, sortBy, showFreeFirst]);

  const readiness = useMemo(() => {
    return calculateReadinessStats(questions, completedQuestions, markedQuestions);
  }, [questions, completedQuestions, markedQuestions]);

  const progressPercentage = filteredQuestions.length === 0 ? 0 : Math.round((filteredQuestions.filter(q => completedQuestions.includes(q.id)).length / filteredQuestions.length) * 100);
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const currentQuestions = filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="px-2 pt-2 animate-slide-in">
      <div className="mb-4">
        <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
              Hello, <span className="text-teal-600 dark:text-teal-400">{userName || 'Doctor'}</span> 👋
            </h3>

            {/* Exam Readiness Badge linking to Analytics Screen */}
            <button
              onClick={() => setCurrentScreen('analytics')}
              title={`Exam Readiness: ${readiness.score}% - Click for Analytics`}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${readiness.badgeBg}`}
            >
              <span className="text-xs">{readiness.icon}</span>
              <span>{readiness.level}</span>
              <ArrowRight size={12} className="opacity-70 ml-0.5 shrink-0" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-baseline gap-2"><span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{showMarkedOnly ? 'Revision Progress' : 'Study Progress : '}</span><span className="text-2xl font-black text-teal-600 leading-none">{progressPercentage}%</span></div>
          <div className="text-right"><span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md border">{filteredQuestions.filter(q => completedQuestions.includes(q.id)).length} / {filteredQuestions.length}</span></div>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden p-[2px] shadow-inner"><div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}></div></div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex gap-2 flex-1"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg text-sm dark:bg-gray-700 dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><button onClick={handleManualSync} className="md:hidden p-2 border rounded-lg dark:bg-gray-700 dark:text-white shrink-0"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button></div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-[140px]"><Tags className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={16} /><select value={filterTopic} onChange={(e) => { setFilterTopic(e.target.value); setSelectedTopicFilter(e.target.value); }} className="w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-lg text-sm appearance-none dark:bg-gray-700 dark:text-white truncate"><option value="All">All Topics</option>{uniqueTopics.map(topic => <option key={topic} value={topic}>{topic}</option>)}</select><ChevronDown className="absolute right-2 top-3 text-gray-400 pointer-events-none" size={14} /></div>
          <div className="relative flex-1 md:w-[140px]"><ArrowUpDown className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={16} /><select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-lg text-sm appearance-none dark:bg-gray-700 dark:text-white truncate"><option value="remaining">Remaining Q</option><option value="completed">Completed Q</option><option value="year">Newest</option><option value="updated">Recently Updated</option><option value="frequency">Repeated</option><option value="importance">Imp.</option><option value="topic">Topic</option></select><ChevronDown className="absolute right-2 top-3 text-gray-400 pointer-events-none" size={14} /></div>
          <button onClick={handleManualSync} className="hidden md:flex p-2 border rounded-lg dark:bg-gray-700 dark:text-white shrink-0"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
        </div>
      </div>

      {userRole !== 'gold' && userRole !== 'admin' && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowFreeFirst(prev => !prev)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm border ${
              showFreeFirst
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-amber-200 dark:shadow-none'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800'
            }`}
          >
            {showFreeFirst ? (
              <>
                <RefreshCw size={13} />
                SHOW ALL QUESTIONS
              </>
            ) : (
              <>
                <CheckCircle size={13} className="text-teal-600 dark:text-teal-400" />
                SHOW FREE Qs FIRST
              </>
            )}
          </button>
        </div>
      )}

      <div key={currentPage} className="space-y-4 animate-slide-up">
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-500" size={32} /></div>
          : currentQuestions.length > 0 ? currentQuestions.map(q => (
            <React.Fragment key={q.id}>
              {userRole === 'standard' && currentQuestions.indexOf(q) === teaserIndex && teaser && <TeaserCard message={teaser} />}
              <QuestionCard data={q} isAdmin={false} isExpanded={expandedQuestionId === q.id} onToggle={() => setExpandedQuestionId(prev => prev === q.id ? null : q.id)} isMarked={markedQuestions.includes(q.id)} onToggleMark={handleToggleMark} isRead={completedQuestions.includes(q.id)} onToggleRead={handleToggleRead} userRole={userRole} teaser={teaser} upgradeMsg={upgradeMsg} />
            </React.Fragment>
          )) : <div className="text-center py-10 text-gray-400">No questions found.</div>}
      </div>
      {!loading && filteredQuestions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 mt-5 mb-4 bg-gray-50/90 dark:bg-gray-800/80 rounded-xl border border-gray-200/70 dark:border-gray-700/70 text-xs shadow-xs">
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
              <option value={999999}>All ({filteredQuestions.length})</option>
            </select>
          </div>

          {/* Question Counter Indicator */}
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
            Showing <span className="font-bold text-teal-600 dark:text-teal-400">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredQuestions.length)}–{Math.min(currentPage * itemsPerPage, filteredQuestions.length)}</span> of <span className="font-bold text-gray-800 dark:text-gray-200">{filteredQuestions.length}</span>
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
      )}
    </div>
  );
}
