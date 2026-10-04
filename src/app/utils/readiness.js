// Helper utility to compute Exam Readiness Score & Stats (0 - 100)

export function calculateReadinessStats(questions = [], completedQuestions = [], markedQuestions = []) {
  const totalQs = questions.length;
  const completed = completedQuestions.length;
  const bookmarked = markedQuestions.length;

  if (totalQs === 0) {
    return {
      score: 0,
      level: 'Getting Started',
      badgeBg: 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
      progressGradient: 'from-slate-500 to-gray-600',
      icon: '🌱',
      completionPts: 0,
      highYieldPts: 0,
      revisionPts: 0,
      priorityItems: [],
      masteredItems: [],
      highYieldMatrix: []
    };
  }

  // 1. Topic Stats Base
  const topicStats = {};
  questions.forEach(q => {
    const t = q.topic || 'Uncategorized';
    if (!topicStats[t]) topicStats[t] = { total: 0, completed: 0 };
    topicStats[t].total += 1;
    if (completedQuestions.includes(q.id)) topicStats[t].completed += 1;
  });

  // 2. High-Yield Matrix
  const matrix = Object.entries(topicStats).map(([topic, data]) => {
    const topicQuestions = questions.filter(q => (q.topic || 'Uncategorized') === topic);
    const repeatCount = topicQuestions.reduce((acc, q) => {
      const realApps = (q.appearances || []).filter(a => a.exam !== 'BONUS').length;
      return acc + (realApps > 1 ? realApps : 0);
    }, 0);

    const uncompleted = data.total - data.completed;
    const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
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

  const priorityItems = matrix
    .filter(item => item.isHighPriority && item.uncompleted > 0)
    .sort((a, b) => b.hyScore - a.hyScore || b.uncompleted - a.uncompleted)
    .slice(0, 5);

  const masteredItems = matrix
    .filter(item => item.isMastered)
    .sort((a, b) => b.completed - a.completed);

  // 3. Scores
  // 1. Completion Score (Max 40 pts)
  const completionPts = Math.min(40, Math.round((completed / totalQs) * 40));

  // 2. High-Yield Coverage Score (Max 40 pts)
  const highYieldTopics = matrix.slice(0, 8);
  const avgHyPct = highYieldTopics.length > 0
    ? Math.round(highYieldTopics.reduce((acc, t) => acc + t.pct, 0) / highYieldTopics.length)
    : 0;
  const highYieldPts = Math.round((avgHyPct / 100) * 40);

  // 3. Revision / Bookmark Score (Max 20 pts)
  const bookmarkedCompleted = markedQuestions.filter(id => completedQuestions.includes(id)).length;
  const revisionPts = bookmarked > 0
    ? Math.round((bookmarkedCompleted / bookmarked) * 20)
    : Math.min(20, Math.round((completed / totalQs) * 20));

  const totalScore = Math.min(100, completionPts + highYieldPts + revisionPts);

  let level = 'Getting Started';
  let badgeBg = 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  let progressGradient = 'from-slate-500 to-gray-600';
  let icon = '🌱';

  if (totalScore >= 90) {
    level = 'Exam Ready 🎓';
    badgeBg = 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700/60 shadow-purple-100 dark:shadow-none';
    progressGradient = 'from-purple-500 via-indigo-500 to-teal-400';
    icon = '🏆';
  } else if (totalScore >= 70) {
    level = 'High Performance';
    badgeBg = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60 shadow-emerald-100 dark:shadow-none';
    progressGradient = 'from-teal-500 to-emerald-500';
    icon = '🟢';
  } else if (totalScore >= 35) {
    level = 'On Track';
    badgeBg = 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/60 shadow-amber-100 dark:shadow-none';
    progressGradient = 'from-amber-400 to-orange-500';
    icon = '🟡';
  }

  return {
    score: totalScore,
    level,
    badgeBg,
    progressGradient,
    icon,
    completionPts,
    highYieldPts,
    revisionPts,
    priorityItems,
    masteredItems,
    highYieldMatrix: matrix
  };
}
