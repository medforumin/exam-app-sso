// Curated collection of medical study and exam preparation motivational quotes

export const MEDICAL_QUOTES = [
  {
    quote: "The good physician treats the disease; the great physician treats the patient who has the disease.",
    author: "Dr. William Osler"
  },
  {
    quote: "Medicine is a science of uncertainty and an art of probability. Keep studying, keep observing, keep growing.",
    author: "Dr. William Osler"
  },
  {
    quote: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice, and most of all, love of what you are doing.",
    author: "Pelé"
  },
  {
    quote: "Wherever the art of Medicine is loved, there is also a love of Humanity.",
    author: "Hippocrates"
  },
  {
    quote: "The doctor of the future will give no medicine, but will interest his patient in the care of the human frame, in diet, and in the cause and prevention of disease.",
    author: "Thomas A. Edison"
  },
  {
    quote: "Observation, Reason, Human Understanding, Courage; these make the physician.",
    author: "Dr. Martin H. Fischer"
  },
  {
    quote: "It always seems impossible until it's done. Every page studied brings you one step closer to your white coat.",
    author: "Nelson Mandela"
  },
  {
    quote: "Don't wish it were easier; wish you were better. Consistency in your daily PYQ practice will build your confidence for the exam.",
    author: "Jim Rohn"
  },
  {
    quote: "Study hard until you can say: My patient is alive because I didn't give up.",
    author: "Medical Proverb"
  },
  {
    quote: "Future doctors don't sleep to dream; they stay up to turn their dreams into reality.",
    author: "Dr. A.P.J. Abdul Kalam"
  },
  {
    quote: "An investment in knowledge pays the best interest. Your dedication today saves lives tomorrow.",
    author: "Benjamin Franklin"
  },
  {
    quote: "To heal is a calling, but to master medicine requires persistent daily discipline.",
    author: "Dr. Atul Gawande"
  },
  {
    quote: "Work hard in silence; let your exam result be your noise.",
    author: "Frank Ocean"
  },
  {
    quote: "Small daily improvements over time lead to stunning long-term exam results.",
    author: "Robin Sharma"
  },
  {
    quote: "Push yourself, because no one else is going to do it for you. Excellence is a habit, not an act.",
    author: "Aristotle"
  },
  {
    quote: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.",
    author: "Colin Powell"
  },
  {
    quote: "One study hour today creates a lifetime of confidence in the ward.",
    author: "Medical Residency Saying"
  },
  {
    quote: "Believe you can and you're halfway there. Trust your preparation and stay focused.",
    author: "Theodore Roosevelt"
  },
  {
    quote: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar"
  },
  {
    quote: "The hard days are what make you stronger. Keep revising, keep solving.",
    author: "Aly Raisman"
  },
  {
    quote: "Strive for perfection in diagnosis, empathy in care, and persistence in your preparation.",
    author: "Dr. Paul Farmer"
  },
  {
    quote: "The expert in anything was once a beginner. Keep solving past year papers step by step.",
    author: "Helen Hayes"
  },
  {
    quote: "Doubt kills more dreams than failure ever will. Trust your study regimen.",
    author: "Suzy Kassem"
  },
  {
    quote: "Success in PG exit exams is built on the foundation of quiet, focused, uninterrupted study sessions.",
    author: "MedForum Advisory"
  },
  {
    quote: "When you feel like quitting, remember why you started this journey in medicine.",
    author: "Anonymous Doctor"
  },
  {
    quote: "Your white coat is earned with every question solved, every concept mastered, and every revision completed.",
    author: "Medical Mentor"
  },
  {
    quote: "Patience, persistence, and perspiration make an unbeatable combination for medical success.",
    author: "Napoleon Hill"
  },
  {
    quote: "Focus on progress, not perfection. Every completed topic is a victory.",
    author: "Dr. Sanjay Gupta"
  },
  {
    quote: "The secret of getting ahead is getting started. Tackle your highest yield topics first.",
    author: "Mark Twain"
  },
  {
    quote: "You are capable of more than you know. Approach every exam question with clarity and confidence.",
    author: "Dr. Mradul Varshney"
  }
];

export const TOTAL_QUOTES_COUNT = MEDICAL_QUOTES.length;

// Get today's quote (cached once per day in localStorage)
export function getDailyQuote() {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const savedDate = localStorage.getItem('daily_quote_date');
  const savedIndex = localStorage.getItem('daily_quote_index');

  if (savedDate === todayStr && savedIndex !== null) {
    const idx = parseInt(savedIndex, 10);
    if (!isNaN(idx) && idx >= 0 && idx < MEDICAL_QUOTES.length) {
      return MEDICAL_QUOTES[idx];
    }
  }

  // Pick new random quote for today
  const newIndex = Math.floor(Math.random() * MEDICAL_QUOTES.length);
  localStorage.setItem('daily_quote_date', todayStr);
  localStorage.setItem('daily_quote_index', newIndex.toString());
  return MEDICAL_QUOTES[newIndex];
}
