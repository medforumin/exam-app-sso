import React from 'react';
import { Home, Crown, Sun, Moon, Bookmark, Shield, BookOpen, LogOut, LogIn, UserCog } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { EXAM_TYPES, SESSIONS, PAPERS, YEARS } from '../config';

export function Header() {
  const { 
    setCurrentScreen, viewMode, setViewMode, userRole, currentUser, darkMode, setDarkMode, 
    setShowAuthModal, handleLogout, filters, setFilters, showMarkedOnly, setShowMarkedOnly 
  } = useAppContext();

  return (
    <header className="bg-gradient-to-r from-teal-700/90 via-emerald-700/85 to-teal-800/90 dark:from-teal-950/90 dark:via-emerald-950/85 dark:to-teal-950/90 backdrop-blur-md text-white px-4 py-2.5 shadow-lg border-b border-teal-500/30 dark:border-teal-700/40 sticky top-0 z-30 transition-all duration-300">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setCurrentScreen('welcome')} 
            className="hover:bg-white/15 p-1.5 rounded-xl transition-colors cursor-pointer" 
            title="Home"
          >
            <Home size={18} />
          </button>
          <h1 className="text-lg font-black tracking-tight flex items-center gap-2 drop-shadow-sm">
            PediaQ
          </h1>
          {userRole === 'gold' && (
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm border border-amber-300/40">
              <Crown size={10} /> GOLD
            </span>
          )}
          {userRole === 'admin' && (
            <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm border border-red-400/40">
              ADMIN
            </span>
          )}
        </div>
        
        <div className="flex gap-1.5 items-center">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="p-1.5 rounded-full hover:bg-white/15 text-white transition-all cursor-pointer" 
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Revision Mode Button */}
          {viewMode === 'student' && (
            <button 
              onClick={() => setShowMarkedOnly(!showMarkedOnly)} 
              className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 font-semibold transition-all cursor-pointer shadow-sm ${
                showMarkedOnly 
                  ? 'bg-amber-400 text-teal-950 font-bold border border-amber-300' 
                  : 'bg-teal-900/60 hover:bg-teal-900/80 border border-teal-500/40 text-white backdrop-blur-sm'
              }`}
            >
              <Bookmark size={12} className={showMarkedOnly ? "fill-teal-950" : ""} /> 
              <span>Revision</span>
            </button>
          )}

          {/* View Mode Toggle Button */}
          <button 
            onClick={() => { 
              if (!currentUser) setShowAuthModal(true); 
              else if (userRole === 'admin') setViewMode(prev => prev === 'admin' ? 'student' : 'admin'); 
              else alert("Restricted Area"); 
            }} 
            className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
              viewMode === 'admin' 
                ? 'bg-white text-teal-800 font-bold border border-white' 
                : 'bg-teal-900/60 hover:bg-teal-900/80 border border-teal-500/40 text-white backdrop-blur-sm'
            }`}
          >
            {viewMode === 'student' ? <Shield size={12} /> : <BookOpen size={12} />}
            <span className="hidden sm:inline">{viewMode === 'student' ? 'Admin' : 'Student'}</span>
          </button>

          {currentUser ? (
            <>
              <button onClick={() => setCurrentScreen('profile')} className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer" title="My Profile"><UserCog size={16} /></button>
              <button onClick={handleLogout} className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer" title="Logout"><LogOut size={16} /></button>
            </>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer" title="Login"><LogIn size={16} /></button>
          )}
        </div>
      </div>

      {/* Filters (Student Mode Only) */}
      {viewMode === 'student' && !showMarkedOnly && (
        <div className="bg-teal-900/40 dark:bg-teal-950/60 border border-teal-400/20 dark:border-teal-700/30 backdrop-blur-sm p-1.5 rounded-xl grid grid-cols-4 gap-1.5 text-xs transition-all duration-300 mt-1">
          <select className="bg-teal-950/60 dark:bg-teal-950/80 text-white border border-teal-500/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all cursor-pointer" value={filters.exam} onChange={e => setFilters({ ...filters, exam: e.target.value })}>
            <option value="All">All Exams</option>{EXAM_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select disabled={filters.exam === 'BONUS'} className="bg-teal-950/60 dark:bg-teal-950/80 text-white border border-teal-500/30 rounded-lg px-2 py-1 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all cursor-pointer" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
            <option value="All">All Years</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select disabled={filters.exam === 'BONUS'} className="bg-teal-950/60 dark:bg-teal-950/80 text-white border border-teal-500/30 rounded-lg px-2 py-1 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all cursor-pointer" value={filters.session} onChange={e => setFilters({ ...filters, session: e.target.value })}>
            <option value="All">All Sessions</option>{SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select disabled={filters.exam === 'BONUS'} className="bg-teal-950/60 dark:bg-teal-950/80 text-white border border-teal-500/30 rounded-lg px-2 py-1 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all cursor-pointer" value={filters.paper} onChange={e => setFilters({ ...filters, paper: e.target.value })}>
            <option value="All">All Papers</option>
            {(filters.exam !== 'All' && filters.exam !== 'BONUS' ? PAPERS[filters.exam] : ['1', '2', '3', '4']).map(p => <option key={p} value={p}>Paper {p}</option>)}
          </select>
        </div>
      )}

      {/* Revision Banner */}
      {viewMode === 'student' && showMarkedOnly && (
        <div className="bg-amber-100/90 dark:bg-amber-900/80 backdrop-blur-sm border border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-100 p-2 rounded-xl text-xs font-semibold flex justify-between items-center mt-1.5 shadow-sm">
          <span className="flex items-center gap-1.5"><Bookmark size={14} className="fill-amber-800 dark:fill-amber-100" /> Viewing Marked for Revision</span>
          <button onClick={() => setShowMarkedOnly(false)} className="underline hover:text-amber-950 dark:hover:text-amber-50 cursor-pointer">Show All</button>
        </div>
      )}
    </header>
  );
}
