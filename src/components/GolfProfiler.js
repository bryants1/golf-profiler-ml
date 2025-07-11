import React, { useState, useEffect } from 'react';
import { ChevronRight, RotateCcw, MapPin, Star, Users, Clock, Brain, TrendingUp, Edit3, Settings, BarChart3, Lightbulb, Target, Zap } from 'lucide-react';
import MLAdminInterface from './MLAdminInterface';
// Import ML System
import MLService from '../ml/MLService.js';

// Override localStorage methods to use memory for Claude.ai compatibility
if (typeof window !== 'undefined') {
  const memoryStorage = {};
  const originalSetItem = Storage.prototype.setItem;
  const originalGetItem = Storage.prototype.getItem;

  Storage.prototype.setItem = function(key, value) {
    if (key.includes('golf_profiler')) {
      memoryStorage[key] = value;
      console.log(`📝 Stored in memory: ${key}`);
    } else {
      originalSetItem.call(this, key, value);
    }
  };

  Storage.prototype.getItem = function(key) {
    if (key.includes('golf_profiler')) {
      return memoryStorage[key] || null;
    } else {
      return originalGetItem.call(this, key, value);
    }
  };
}

const GolfProfiler = () => {
  // 🔥 ALL HOOKS MUST BE DECLARED FIRST - BEFORE ANY CONDITIONAL LOGIC

  // Core State hooks
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [profile, setProfile] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [mlService] = useState(() => new MLService());
  const [sessionId] = useState(() => Date.now().toString());

  // UI State hooks
  const [showFeedback, setShowFeedback] = useState(false);
  const [showMLStats, setShowMLStats] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isEditing, setIsEditing] = useState(isEditing(false);
  const [editingAnswers, setEditingAnswers] = useState({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // ML State hooks
  const [mlInsights, setMlInsights] = useState(null);
  const [similarityInsights, setSimilarityInsights] = useState(null);
  const [recommendationInsights, setRecommendationInsights] = useState(null);
  const [mlStats, setMlStats] = useState(null);

  const [scores, setScores] = useState({
    skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
    competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
    courseStyle: {}, pace: 0
  });


  // Question bank
  const questionBank = [
    // EXISTING 8 QUESTIONS (keep these as-is)
    {
      id: 'golf_movie',
      type: 'starter',
      priority: 10,
      question: "Pick a Golf Movie to Watch Tonight",
      options: [
        {
          text: "Happy Gilmore",
          image: "🏌️‍♂️💥",
          scores: { skillLevel: 2, socialness: 8, traditionalism: 1, competitiveness: 3, ageGeneration: 6 }
        },
        {
          text: "Tin Cup",
          image: "🏆⛳",
          scores: { skillLevel: 7, socialness: 5, traditionalism: 4, competitiveness: 8, ageGeneration: 4 }
        },
        {
          text: "The Legend of Bagger Vance",
          image: "🧘‍♂️📿",
          scores: { skillLevel: 6, socialness: 4, traditionalism: 9, competitiveness: 4, ageGeneration: 3 }
        },
        {
          text: "Caddyshack",
          image: "😂🐿️",
          scores: { skillLevel: 5, socialness: 9, traditionalism: 2, competitiveness: 3, ageGeneration: 2 }
        }
      ]
    },
    {
      id: 'dream_course',
      type: 'core',
      priority: 9,
      question: "Your Dream Round Looks Like...",
      options: [
        {
          text: "Cliffside coastal course at sunset",
          image: "🌊🌅",
          scores: { luxuryLevel: 8, traditionalism: 6, courseStyle: 'coastal', amenityImportance: 7 }
        },
        {
          text: "Tree-lined classic parkland",
          image: "🌳🏞️",
          scores: { traditionalism: 9, skillLevel: 6, courseStyle: 'parkland', luxuryLevel: 6 }
        },
        {
          text: "Windy open links with brown turf",
          image: "🌬️⛳",
          scores: { skillLevel: 8, traditionalism: 10, competitiveness: 7, courseStyle: 'links' }
        },
        {
          text: "Laid-back 9-hole muni with no dress code",
          image: "👕🍺",
          scores: { socialness: 8, luxuryLevel: 2, traditionalism: 1, competitiveness: 2 }
        }
      ]
    },
    {
      id: 'playing_partner',
      type: 'social',
      priority: 8,
      question: "Pick a Playing Partner for 18 Holes",
      options: [
        {
          text: "Bill Murray",
          image: "😄🎭",
          scores: { socialness: 9, competitiveness: 2, traditionalism: 3, ageGeneration: 3 }
        },
        {
          text: "Tiger Woods",
          image: "🐅🏆",
          scores: { competitiveness: 10, skillLevel: 8, traditionalism: 7, socialness: 3 }
        },
        {
          text: "Barack Obama",
          image: "🎯💼",
          scores: { socialness: 7, traditionalism: 6, competitiveness: 5, ageGeneration: 5 }
        },
        {
          text: "Your best friend",
          image: "👥❤️",
          scores: { socialness: 10, competitiveness: 3, traditionalism: 2, luxuryLevel: 3 }
        }
      ]
    },
    {
      id: 'nineteenth_hole',
      type: 'lifestyle',
      priority: 7,
      question: "What's Waiting for You at the 19th Hole?",
      options: [
        {
          text: "Burger and cold draft beer",
          image: "🍔🍺",
          scores: { socialness: 7, luxuryLevel: 3, traditionalism: 5, genderLean: 2 }
        },
        {
          text: "Glass of wine and charcuterie",
          image: "🍷🧀",
          scores: { luxuryLevel: 8, socialness: 5, traditionalism: 6, genderLean: -2, ageGeneration: 6 }
        },
        {
          text: "Breakfast sandwich and black coffee",
          image: "🥪☕",
          scores: { socialness: 2, pace: 8, competitiveness: 6, luxuryLevel: 2 }
        },
        {
          text: "Bloody Mary and grilled cheese",
          image: "🍅🥪",
          scores: { socialness: 8, luxuryLevel: 6, traditionalism: 4, ageGeneration: 4 }
        }
      ]
    },
    {
      id: 'course_recognition',
      type: 'knowledge',
      priority: 6,
      question: "Which One's a Golf Course You'd Want to Play?",
      options: [
        {
          text: "Dramatic ocean cliff shot",
          image: "🏔️🌊",
          scores: { luxuryLevel: 9, skillLevel: 6, amenityImportance: 8, traditionalism: 7 }
        },
        {
          text: "Sand-swept minimalist course",
          image: "🏜️⛳",
          scores: { skillLevel: 7, traditionalism: 6, competitiveness: 6, luxuryLevel: 7 }
        },
        {
          text: "Tree-lined course with white clubhouse",
          image: "🌳🏛️",
          scores: { traditionalism: 10, luxuryLevel: 8, skillLevel: 7, amenityImportance: 9 }
        },
        {
          text: "Flat muni with '$34 Twilight Rate' sign",
          image: "💰📋",
          scores: { luxuryLevel: 1, socialness: 6, competitiveness: 2, traditionalism: 1 }
        }
      ]
    },
    {
      id: 'game_style',
      type: 'personality',
      priority: 5,
      question: "Your Golf Game Is Most Like...",
      options: [
        {
          text: "A Swiss watch - precise and reliable",
          image: "⌚✨",
          scores: { skillLevel: 8, competitiveness: 7, traditionalism: 6, pace: 3 }
        },
        {
          text: "A blues jam session - improvisational",
          image: "🎷🎵",
          scores: { socialness: 6, competitiveness: 4, traditionalism: 3, skillLevel: 5 }
        },
        {
          text: "A BBQ with too many flames - chaotic but fun",
          image: "🔥🍖",
          scores: { socialness: 9, competitiveness: 2, traditionalism: 1, skillLevel: 3 }
        },
        {
          text: "A golf cart going off-path - adventurous",
          image: "🛻🌿",
          scores: { socialness: 7, competitiveness: 3, traditionalism: 1, skillLevel: 4 }
        }
      ]
    },
    {
      id: 'pressure_shot',
      type: 'skill_assessment',
      priority: 4,
      question: "You're 210 yards out over water. What's in your hand?",
      options: [
        {
          text: "3-wood - going for it",
          image: "🏌️‍♂️💨",
          scores: { skillLevel: 8, competitiveness: 9, traditionalism: 5 }
        },
        {
          text: "Hybrid - smart play",
          image: "🎯⛳",
          scores: { skillLevel: 6, competitiveness: 6, traditionalism: 7 }
        },
        {
          text: "Wedge - laying up safe",
          image: "🎯🛡️",
          scores: { skillLevel: 4, competitiveness: 3, traditionalism: 8 }
        },
        {
          text: "I'm already back in the cart",
          image: "🛺😅",
          scores: { skillLevel: 2, socialness: 8, competitiveness: 1 }
        }
      ]
    },
    {
      id: 'warmup_ritual',
      type: 'preparation',
      priority: 3,
      question: "What's Your Pre-Round Ritual?",
      options: [
        {
          text: "Range session + putting practice",
          image: "🎯📊",
          scores: { skillLevel: 7, competitiveness: 8, traditionalism: 7, amenityImportance: 9 }
        },
        {
          text: "Stretch, playlist, and positive vibes",
          image: "🧘‍♀️🎵",
          scores: { socialness: 6, competitiveness: 4, ageGeneration: 7 }
        },
        {
          text: "Show up and swing - keep it simple",
          image: "🚗⛳",
          scores: { socialness: 5, competitiveness: 3, amenityImportance: 2 }
        },
        {
          text: "Coffee, muffin, and course gossip",
          image: "☕🧁",
          scores: { socialness: 9, competitiveness: 2, traditionalism: 4 }
        }
      ]
    },

    // NEW 22 QUESTIONS (9-30)
    {
      id: 'golf_attire',
      type: 'lifestyle',
      priority: 8,
      question: "What's Your Go-To Golf Outfit?",
      options: [
        {
          text: "Polo, khakis, and proper golf shoes",
          image: "👔⛳",
          scores: { traditionalism: 8, luxuryLevel: 6, competitiveness: 6, genderLean: 1 }
        },
        {
          text: "Athletic wear and spikeless sneakers",
          image: "👟🏃",
          scores: { pace: 8, ageGeneration: 7, traditionalism: 3, competitiveness: 5 }
        },
        {
          text: "Whatever's comfortable and clean",
          image: "👕😌",
          scores: { socialness: 7, traditionalism: 2, luxuryLevel: 3, competitiveness: 3 }
        },
        {
          text: "Designer golf gear and accessories",
          image: "💎👑",
          scores: { luxuryLevel: 9, traditionalism: 5, socialness: 4, amenityImportance: 7 }
        }
      ]
    },
    {
      id: 'weather_preference',
      type: 'conditions',
      priority: 6,
      question: "Perfect Golf Weather Is...",
      options: [
        {
          text: "Crisp autumn morning with no wind",
          image: "🍂🌤️",
          scores: { traditionalism: 7, competitiveness: 7, skillLevel: 6, pace: 5 }
        },
        {
          text: "Warm summer evening twilight round",
          image: "🌅🌡️",
          scores: { socialness: 8, luxuryLevel: 5, pace: 3, ageGeneration: 6 }
        },
        {
          text: "Overcast and cool - no excuses",
          image: "☁️💪",
          scores: { competitiveness: 8, skillLevel: 7, traditionalism: 6, pace: 7 }
        },
        {
          text: "Any weather - golf is golf!",
          image: "🌦️⛳",
          scores: { socialness: 9, competitiveness: 4, skillLevel: 5, pace: 6 }
        }
      ]
    },
    {
      id: 'caddie_preference',
      type: 'service',
      priority: 5,
      question: "Your Ideal Caddie Situation:",
      options: [
        {
          text: "Experienced local caddie with course knowledge",
          image: "🎓⛳",
          scores: { traditionalism: 9, luxuryLevel: 7, skillLevel: 6, amenityImportance: 8 }
        },
        {
          text: "Buddy who carries clubs and cracks jokes",
          image: "😄🎒",
          scores: { socialness: 9, competitiveness: 3, luxuryLevel: 3, traditionalism: 2 }
        },
        {
          text: "GPS cart with all the tech",
          image: "📱🛺",
          scores: { pace: 8, ageGeneration: 6, traditionalism: 3, amenityImportance: 6 }
        },
        {
          text: "Just me and my push cart",
          image: "🚶‍♂️⛳",
          scores: { competitiveness: 6, pace: 7, socialness: 2, luxuryLevel: 2 }
        }
      ]
    },
    {
      id: 'golf_vacation',
      type: 'travel',
      priority: 7,
      question: "Your Dream Golf Vacation:",
      options: [
        {
          text: "Scotland links tour with whisky tastings",
          image: "🏴󠁧󠁢󠁳󠁣󠁴󠁿🥃",
          scores: { traditionalism: 10, luxuryLevel: 8, skillLevel: 7, ageGeneration: 4 }
        },
        {
          text: "Myrtle Beach with the gang",
          image: "🏖️👥",
          scores: { socialness: 9, luxuryLevel: 4, competitiveness: 5, ageGeneration: 5 }
        },
        {
          text: "Pebble Beach VIP experience",
          image: "🌊💎",
          scores: { luxuryLevel: 10, traditionalism: 8, amenityImportance: 9, skillLevel: 7 }
        },
        {
          text: "Budget-friendly state park courses road trip",
          image: "🚐💰",
          scores: { socialness: 6, luxuryLevel: 2, pace: 6, competitiveness: 4 }
        }
      ]
    },
    {
      id: 'golf_equipment',
      type: 'gear',
      priority: 6,
      question: "Your Golf Bag Philosophy:",
      options: [
        {
          text: "Latest technology and annual upgrades",
          image: "🔧✨",
          scores: { luxuryLevel: 8, competitiveness: 7, ageGeneration: 6, amenityImportance: 7 }
        },
        {
          text: "Classic clubs that have served me well",
          image: "⚡🏆",
          scores: { traditionalism: 9, skillLevel: 6, competitiveness: 5, ageGeneration: 3 }
        },
        {
          text: "Whatever works and doesn't break the bank",
          image: "💰🎯",
          scores: { socialness: 6, luxuryLevel: 3, competitiveness: 4, pace: 5 }
        },
        {
          text: "Meticulously researched and fitted set",
          image: "📊🔬",
          scores: { skillLevel: 8, competitiveness: 8, traditionalism: 6, amenityImportance: 8 }
        }
      ]
    },
    {
      id: 'golf_instruction',
      type: 'learning',
      priority: 5,
      question: "How Do You Improve Your Game?",
      options: [
        {
          text: "Regular lessons with a PGA professional",
          image: "👨‍🏫⛳",
          scores: { skillLevel: 7, competitiveness: 7, luxuryLevel: 6, amenityImportance: 8 }
        },
        {
          text: "YouTube videos and practice",
          image: "📱🎯",
          scores: { ageGeneration: 7, pace: 6, luxuryLevel: 3, competitiveness: 6 }
        },
        {
          text: "Playing with better golfers",
          image: "👥📈",
          scores: { socialness: 8, competitiveness: 6, skillLevel: 5, traditionalism: 4 }
        },
        {
          text: "Trial and error on the course",
          image: "🎲⛳",
          scores: { socialness: 5, competitiveness: 4, traditionalism: 3, pace: 7 }
        }
      ]
    },
    {
      id: 'pace_of_play',
      type: 'tempo',
      priority: 7,
      question: "Your Ideal Round Takes:",
      options: [
        {
          text: "3 hours max - let's keep it moving",
          image: "⏰💨",
          scores: { pace: 9, competitiveness: 6, socialness: 3, ageGeneration: 6 }
        },
        {
          text: "4-4.5 hours with time to enjoy",
          image: "🕐😌",
          scores: { socialness: 7, traditinalism: 6, luxuryLevel: 5, pace: 5 }
        },
        {
          text: "5+ hours - golf is my escape",
          image: "🌅🧘",
          scores: { socialness: 8, traditionalism: 7, competitiveness: 3, luxuryLevel: 6 }
        },
        {
          text: "However long it takes to play well",
          image: "🎯⏳",
          scores: { competitiveness: 8, skillLevel: 7, traditionalism: 6, pace: 3 }
        }
      ]
    },
    {
      id: 'golf_scoring',
      type: 'competition',
      priority: 6,
      question: "How Do You Keep Score?",
      options: [
        {
          text: "Every stroke counts - USGA rules",
          image: "📝⚖️",
          scores: { competitiveness: 9, traditionalism: 9, skillLevel: 7, genderLean: 1 }
        },
        {
          text: "Honest but with some gimmes",
          image: "✋😊",
          scores: { socialness: 7, competitiveness: 5, traditionalism: 5, pace: 6 }
        },
        {
          text: "Approximate - just having fun",
          image: "🤷‍♂️⛳",
          scores: { socialness: 9, competitiveness: 2, pace: 7, skillLevel: 3 }
        },
        {
          text: "Detailed stats and analytics",
          image: "📊📈",
          scores: { competitiveness: 8, skillLevel: 7, ageGeneration: 6, amenityImportance: 7 }
        }
      ]
    },
    {
      id: 'golf_season',
      type: 'timing',
      priority: 4,
      question: "Your Favorite Golf Season:",
      options: [
        {
          text: "Spring - fresh start and perfect temps",
          image: "🌸⛳",
          scores: { traditionalism: 6, socialness: 6, competitiveness: 5, pace: 6 }
        },
        {
          text: "Summer - long days and twilight rounds",
          image: "☀️🌅",
          scores: { socialness: 8, luxuryLevel: 5, ageGeneration: 6, pace: 4 }
        },
        {
          text: "Fall - fewer crowds and great conditions",
          image: "🍁⛳",
          scores: { traditionalism: 7, competitiveness: 7, pace: 7, skillLevel: 6 }
        },
        {
          text: "Winter - any golf is good golf",
          image: "❄️⛳",
          scores: { competitiveness: 8, skillLevel: 6, pace: 6, socialness: 4 }
        }
      ]
    },
    {
      id: 'golf_technology',
      type: 'modern',
      priority: 5,
      question: "Technology on the Golf Course:",
      options: [
        {
          text: "GPS watch and shot tracking app",
          image: "⌚📱",
          scores: { ageGeneration: 8, competitiveness: 7, amenityImportance: 7, pace: 6 }
        },
        {
          text: "Rangefinder for precision",
          image: "🔭🎯",
          scores: { skillLevel: 7, competitiveness: 8, traditionalism: 5, amenityImportance: 6 }
        },
        {
          text: "Just yardage markers and instinct",
          image: "📏👁️",
          scores: { traditionalism: 8, skillLevel: 6, competitiveness: 5, ageGeneration: 3 }
        },
        {
          text: "Whatever the course provides",
          image: "🤝⛳",
          scores: { socialness: 7, traditionalism: 4, luxuryLevel: 4, pace: 6 }
        }
      ]
    },
    {
      id: 'golf_etiquette',
      type: 'social_rules',
      priority: 6,
      question: "Most Important Golf Etiquette:",
      options: [
        {
          text: "Repair divots and fix ball marks",
          image: "🌱⛳",
          scores: { traditionalism: 9, skillLevel: 6, competitiveness: 6, amenityImportance: 7 }
        },
        {
          text: "Keep pace with group ahead",
          image: "👥⏰",
          scores: { pace: 9, socialness: 7, competitiveness: 6, traditionalism: 6 }
        },
        {
          text: "Stay quiet during others' shots",
          image: "🤫⛳",
          scores: { traditionalism: 8, socialness: 6, competitiveness: 5, skillLevel: 5 }
        },
        {
          text: "Help others find their ball",
          image: "🔍🤝",
          scores: { socialness: 9, traditionalism: 5, competitiveness: 3, amenityImportance: 4 }
        }
      ]
    },
    {
      id: 'golf_challenge',
      type: 'difficulty',
      priority: 6,
      question: "Your Preferred Course Difficulty:",
      options: [
        {
          text: "Championship tees - bring the pain",
          image: "😤🏆",
          scores: { skillLevel: 9, competitiveness: 9, traditionalism: 6, genderLean: 2 }
        },
        {
          text: "Regular tees with some bite",
          image: "⚖️⛳",
          scores: { skillLevel: 6, competitiveness: 6, traditionalism: 6, socialness: 5 }
        },
        {
          text: "Forward tees for more fun",
          image: "😊⛳",
          scores: { socialness: 8, pace: 7, competitiveness: 3, luxuryLevel: 4 }
        },
        {
          text: "Mix it up based on conditions",
          image: "🎲⛳",
          scores: { socialness: 6, skillLevel: 5, competitiveness: 5, pace: 6 }
        }
      ]
    },
    {
      id: 'golf_motivation',
      type: 'psychology',
      priority: 5,
      question: "What Drives Your Golf?",
      options: [
        {
          text: "Breaking my personal best score",
          image: "📈🏆",
          scores: { competitiveness: 9, skillLevel: 7, traditionalism: 5, pace: 5 }
        },
        {
          text: "Spending time with friends",
          image: "👥❤️",
          scores: { socialness: 10, competitiveness: 3, luxuryLevel: 4, pace: 4 }
        },
        {
          text: "Escaping from daily stress",
          image: "🧘‍♂️🌿",
          scores: { socialness: 4, competitiveness: 3, luxuryLevel: 6, traditionalism: 6 }
        },
        {
          text: "Mastering a difficult skill",
          image: "🎯📚",
          scores: { skillLevel: 8, competitiveness: 7, traditionalism: 7, amenityImportance: 6 }
        }
      ]
    },
    {
      id: 'golf_frustration',
      type: 'emotional',
      priority: 4,
      question: "When You Hit a Bad Shot:",
      options: [
        {
          text: "Analyze what went wrong",
          image: "🤔📊",
          scores: { skillLevel: 7, competitiveness: 7, traditionalism: 6, pace: 4 }
        },
        {
          text: "Laugh it off and move on",
          image: "😂⛳",
          scores: { socialness: 9, competitiveness: 3, pace: 8, skillLevel: 4 }
        },
        {
          text: "Take a practice swing",
          image: "🏌️‍♂️🔄",
          scores: { skillLevel: 6, competitiveness: 6, traditionalism: 7, pace: 5 }
        },
        {
          text: "Get quietly frustrated",
          image: "😤🤐",
          scores: { competitiveness: 8, skillLevel: 6, socialness: 3, genderLean: 1 }
        }
      ]
    },
    {
      id: 'golf_format',
      type: 'competition',
      priority: 6,
      question: "Favorite Way to Play Golf:",
      options: [
        {
          text: "Stroke play - pure competition",
          image: "🏆📝",
          scores: { competitiveness: 9, traditionalism: 8, skillLevel: 7, genderLean: 1 }
        },
        {
          text: "Best ball scramble with friends",
          image: "👥⭐",
          scores: { socialness: 9, competitiveness: 5, pace: 6, skillLevel: 4 }
        },
        {
          text: "Match play head-to-head",
          image: "⚔️🎯",
          scores: { competitiveness: 8, socialness: 6, traditionalism: 7, skillLevel: 6 }
        },
        {
          text: "Solo round at my own pace",
          image: "🚶‍♂️🧘",
          scores: { socialness: 2, pace: 8, competitiveness: 4, skillLevel: 6 }
        }
      ]
    },
    {
      id: 'golf_celebrate',
      type: 'social',
      priority: 4,
      question: "After a Great Shot You:",
      options: [
        {
          text: "Pump your fist and celebrate",
          image: "✊🎉",
          scores: { competitiveness: 8, socialness: 7, ageGeneration: 6, genderLean: 1 }
        },
        {
          text: "Smile and tip your cap",
          image: "😊🧢",
          scores: { traditionalism: 8, socialness: 6, competitiveness: 5, skillLevel: 6 }
        },
        {
          text: "Act like you've been there before",
          image: "😎⛳",
          scores: { competitiveness: 6, traditionalism: 7, skillLevel: 7, genderLean: 1 }
        },
        {
          text: "Thank the golf gods",
          image: "🙏⭐",
          scores: { socialness: 7, skillLevel: 4, traditionalism: 5, competitiveness: 4 }
        }
      ]
    },
    {
      id: 'golf_practice',
      type: 'improvement',
      priority: 5,
      question: "Your Practice Routine:",
      options: [
        {
          text: "Structured range sessions with targets",
          image: "🎯📋",
          scores: { skillLevel: 8, competitiveness: 8, amenityImportance: 7, traditionalism: 6 }
        },
        {
          text: "Hit balls until it feels right",
          image: "⛳🔄",
          scores: { skillLevel: 5, competitiveness: 5, socialness: 4, pace: 6 }
        },
        {
          text: "Practice on the course only",
          image: "🏌️‍♂️⛳",
          scores: { socialness: 6, traditionalism: 6, amenityImportance: 4, pace: 5 }
        },
        {
          text: "What's practice? I just play",
          image: "🤷‍♂️😄",
          scores: { socialness: 8, competitiveness: 3, skillLevel: 3, pace: 7 }
        }
      ]
    },
    {
      id: 'golf_membership',
      type: 'commitment',
      priority: 6,
      question: "Your Golf Membership Preference:",
      options: [
        {
          text: "Exclusive private country club",
          image: "🏛️👑",
          scores: { luxuryLevel: 10, traditionalism: 9, amenityImportance: 9, socialness: 6 }
        },
        {
          text: "Semi-private with good value",
          image: "⚖️💰",
          scores: { luxuryLevel: 6, amenityImportance: 6, socialness: 6, competitiveness: 5 }
        },
        {
          text: "Public courses - variety is key",
          image: "🌍⛳",
          scores: { socialness: 8, luxuryLevel: 3, pace: 6, competitiveness: 4 }
        },
        {
          text: "Municipal course regular",
          image: "🏛️⛳",
          scores: { socialness: 7, luxuryLevel: 2, traditionalism: 4, amenityImportance: 3 }
        }
      ]
    },
    {
      id: 'golf_weather_gear',
      type: 'conditions',
      priority: 3,
      question: "Bad Weather Golf Gear:",
      options: [
        {
          text: "Full rain suit and umbrella",
          image: "☔🧥",
          scores: { competitiveness: 7, traditionalism: 7, amenityImportance: 6, skillLevel: 6 }
        },
        {
          text: "Just a rain jacket and hat",
          image: "🧢🌧️",
          scores: { pace: 7, competitiveness: 5, socialness: 6, skillLevel: 5 }
        },
        {
          text: "Whatever I have in the car",
          image: "🚗🤷‍♂️",
          scores: { socialness: 7, pace: 6, luxuryLevel: 2, competitiveness: 4 }
        },
        {
          text: "Bad weather means no golf",
          image: "🏠☔",
          scores: { luxuryLevel: 6, socialness: 4, competitiveness: 3, amenityImportance: 7 }
        }
      ]
    },
    {
      id: 'golf_achievement',
      type: 'goals',
      priority: 5,
      question: "Your Golf Bucket List Item:",
      options: [
        {
          text: "Play Augusta National",
          image: "🌸🏆",
          scores: { traditionalism: 10, luxuryLevel: 9, skillLevel: 7, competitiveness: 7 }
        },
        {
          text: "Shoot under par",
          image: "📉🎯",
          scores: { competitiveness: 9, skillLevel: 8, traditionalism: 6, amenityImportance: 6 }
        },
        {
          text: "Play golf in every state",
          image: "🗺️⛳",
          scores: { socialness: 7, pace: 7, competitiveness: 4, ageGeneration: 5 }
        },
        {
          text: "Have fun every round",
          image: "😊❤️",
          scores: { socialness: 9, competitiveness: 3, luxuryLevel: 4, pace: 6 }
        }
      ]
    }
];

  // Initialize ML service and first question
  useEffect(() => {
    const initializeML = async () => {
      if (selectedQuestions.length === 0) {
        const firstQuestion = mlService.selectNextQuestion({}, scores, questionBank, 0);
        setSelectedQuestions([firstQuestion]);

        // Load ML stats
        const stats = mlService.getMLStatistics();
        setMlStats(stats);
      }
    };

    initializeML();
  }, [mlService, scores, selectedQuestions.length]);

  // 🔥 NOW CHECK FOR ADMIN MODE (after ALL hooks)
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.get('admin') === 'true';

  // If admin mode, show admin interface
  if (isAdmin) {
    console.log('🔧 Admin mode detected - showing admin interface');
    return <MLAdminInterface mlService={mlService} />;
  }


  // Fixed scoring algorithm using weighted averages
  const calculateWeightedScores = (allAnswers) => {
    const dimensionScores = {
      skillLevel: [], socialness: [], traditionalism: [], luxuryLevel: [],
      competitiveness: [], ageGeneration: [], genderLean: [], amenityImportance: [],
      pace: [], courseStyle: {}
    };

    // Question type weights (more important questions have higher weight)
    const questionWeights = {
      'starter': 1.2,
      'core': 1.5,
      'skill_assessment': 1.8,
      'social': 1.3,
      'lifestyle': 1.0,
      'knowledge': 1.1,
      'personality': 1.4,
      'preparation': 1.0
    };

    // Collect all scores with weights
    Object.entries(allAnswers).forEach(([questionId, answerData]) => {
      // Find the question by ID from the questionBank
      const question = questionBank.find(q => q.id === questionId);
      const weight = questionWeights[question?.type] || 1.0;
      const rawScores = answerData.rawScores || {};

      Object.entries(rawScores).forEach(([dimension, value]) => {
        if (dimension === 'courseStyle') {
          dimensionScores.courseStyle[value] = (dimensionScores.courseStyle[value] || 0) + 1;
        } else if (dimensionScores[dimension]) {
          dimensionScores[dimension].push({ value, weight });
        }
      });
    });

    // Calculate weighted averages
    const finalScores = {
      skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
      competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
      courseStyle: dimensionScores.courseStyle, pace: 0
    };

    Object.keys(finalScores).forEach(dimension => {
      if (dimension === 'courseStyle') return; // Already handled above

      const scores = dimensionScores[dimension];
      if (scores.length > 0) {
        const weightedSum = scores.reduce((sum, score) => sum + (score.value * score.weight), 0);
        const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
        const average = weightedSum / totalWeight;

        // Scale to 0-10 range but don't artificially cap everything at 10
        finalScores[dimension] = Math.round(Math.max(0, Math.min(10, average)) * 10) / 10;
      }
    });

    return finalScores;
  };


  const handleAnswer = async (optionIndex) => {
    const currentQ = selectedQuestions[currentQuestion];
    const selectedOption = currentQ.options[optionIndex];

    console.log('🔍 selectedOption:', selectedOption);
    console.log('🔍 selectedOption.scores:', selectedOption?.scores);
    console.log('🔍 current scores before update:', scores);

    // Store raw scores for better calculation
    const newAnswers = {
      ...answers,
      [currentQ.id]: {
        questionText: currentQ.question,
        answer: selectedOption.text,
        optionIndex,
        rawScores: selectedOption.scores // Store raw scores
      }
    };
    setAnswers(newAnswers);

    // Calculate scores using weighted averaging instead of accumulation
    const newScores = calculateWeightedScores(newAnswers);
    console.log('🎯 newScores after weighted calculation:', newScores);
    setScores(newScores);

    // Determine next question using ML
    const totalQuestions = Object.keys(newAnswers).length;
    const shouldContinue = totalQuestions < 7 && (
      totalQuestions < 5 ||
      Math.abs(newScores.skillLevel - 5) > 2 ||
      Math.abs(newScores.luxuryLevel - 5) > 2 ||
      newScores.amenityImportance === 0
    );

    if (shouldContinue) {
      const nextQuestion = mlService.selectNextQuestion(
        newAnswers,
        newScores,
        questionBank,
        totalQuestions,
        { sessionId, timestamp: Date.now() }
      );

      if (nextQuestion) {
        setSelectedQuestions([...selectedQuestions, nextQuestion]);
        setCurrentQuestion(currentQuestion + 1);
      } else {
        await generateProfile(newAnswers, newScores);
      }
    } else {
      await generateProfile(newAnswers, newScores);
    }
  };

  const generateProfile = async (finalAnswers, finalScores) => {
    try {
      // Generate ML-enhanced profile
      const enhancedProfile = await mlService.generateProfile(
        finalAnswers,
        finalScores,
        sessionId,
        { enhancementLevel: 'full' }
      );

      // Debug the courseStyle recommendation
      console.log('🔍 Enhanced profile courseStyle:', enhancedProfile.recommendations?.courseStyle);
      if (typeof enhancedProfile.recommendations?.courseStyle === 'object') {
        console.log('🔍 CourseStyle object details:', enhancedProfile.recommendations.courseStyle);
      }

      setProfile(enhancedProfile);
      setIsComplete(true);
      setShowFeedback(true);

      // Generate insights
      const similarity = mlService.getUserSimilarityInsights(finalScores);
      setSimilarityInsights(similarity);

      const recInsights = mlService.getRecommendationInsights(finalScores, enhancedProfile.recommendations);
      setRecommendationInsights(recInsights);

      // Update ML stats
      const stats = mlService.getMLStatistics();
      setMlStats(stats);

    } catch (error) {
      console.error('Error generating profile:', error);
      // Fallback to basic profile
      setProfile(generateBasicProfile(finalScores));
      setIsComplete(true);
    }
  };

  const generateBasicProfile = (scores) => {
    return {
      skillLevel: { label: getSkillLabel(scores.skillLevel) },
      personality: { primary: getPersonalityType(scores) },
      preferences: { core: getPreferences(scores) },
      recommendations: getRecommendations(scores),
      demographics: getDemographics(scores),
      mlEnhanced: false
    };
  };

  const handleProfileFeedback = async (feedbackData) => {
    try {
      await mlService.collectFeedback(sessionId, feedbackData, {
        answers,
        scores,
        profile,
        totalQuestions: Object.keys(answers).length,
        questionSequence: Object.keys(answers)
      });

      setShowFeedback(false);

      // Update ML stats after feedback
      const stats = mlService.getMLStatistics();
      setMlStats(stats);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setShowFeedback(false);
    }
  };

  const handleEditAnswers = () => {
    setIsEditing(true);
    setEditingAnswers({ ...answers });
  };

  const handleUpdateAnswers = async () => {
    // Recalculate scores with new answers using weighted system
    const newScores = calculateWeightedScores(editingAnswers);

    setAnswers(editingAnswers);
    setScores(newScores);
    await generateProfile(editingAnswers, newScores);
    setIsEditing(false);
  };

  const restart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setProfile(null);
    setSelectedQuestions([]);
    setIsComplete(false);
    setIsEditing(false);
    setShowFeedback(false);
    setShowMLStats(false);
    setShowInsights(false);
    setMlInsights(null);
    setSimilarityInsights(null);
    setRecommendationInsights(null);
    setScores({
      skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
      competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
      courseStyle: {}, pace: 0
    });

    // Reinitialize the first question
    setTimeout(() => {
      const firstQuestion = mlService.selectNextQuestion({}, {
        skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
        competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
        courseStyle: {}, pace: 0
      }, questionBank, 0);
      setSelectedQuestions([firstQuestion]);
    }, 0);
  };

  // Helper functions (simplified versions)
  const getSkillLabel = (skillScore) => {
    if (skillScore <= 2) return "New to Golf";
    if (skillScore <= 4) return "Recreational Player";
    if (skillScore <= 6) return "Regular Golfer";
    if (skillScore <= 8) return "Serious Player";
    return "Advanced Golfer";
  };

  const getPersonalityType = (scores) => {
    if (scores.socialness >= 7 && scores.competitiveness <= 4) return "Social & Fun-Focused";
    if (scores.competitiveness >= 7 && scores.traditionalism >= 6) return "Competitive Traditionalist";
    if (scores.socialness >= 7 && scores.luxuryLevel >= 6) return "Social Luxury Seeker";
    if (scores.competitiveness <= 3 && scores.socialness <= 4) return "Peaceful Solo Player";
    if (scores.traditionalism >= 8) return "Golf Purist";
    return "Balanced Enthusiast";
  };

  const getPreferences = (scores) => {
    const prefs = [];
    if (scores.amenityImportance >= 6) prefs.push("Values practice facilities & amenities");
    if (scores.luxuryLevel >= 7) prefs.push("Prefers upscale experiences");
    if (scores.socialness >= 7) prefs.push("Enjoys group golf & social aspects");
    if (scores.competitiveness >= 7) prefs.push("Competitive & score-focused");
    if (scores.traditionalism >= 7) prefs.push("Appreciates golf history & tradition");
    return prefs;
  };

  const getRecommendations = (scores) => {
    return {
      courseStyle: Object.keys(scores.courseStyle).length > 0 ?
        Object.entries(scores.courseStyle).sort(([,a], [,b]) => b - a)[0][0] :
        scores.traditionalism >= 7 ? "Classic parkland" : "Resort-style",
      budgetLevel: scores.luxuryLevel >= 7 ? "Premium ($100+)" :
                   scores.luxuryLevel >= 4 ? "Mid-range ($50-100)" : "Value ($25-50)",
      amenities: scores.amenityImportance >= 6 ? ["Driving range", "Practice greens", "Pro shop", "Dining"] :
                 scores.socialness >= 7 ? ["Bar/restaurant", "Event spaces"] : ["Basic facilities"],
      lodging: scores.luxuryLevel >= 7 ? "Resort or boutique hotel" :
               scores.socialness >= 7 ? "Hotel with social areas" : "Comfortable, convenient location"
    };
  };

  const getDemographics = (scores) => {
    const ageGuess = scores.ageGeneration <= 3 ? "25-40" :
                     scores.ageGeneration <= 6 ? "35-55" : "45-65";
    const genderLean = Math.abs(scores.genderLean) <= 1 ? "Neutral preferences" :
                       scores.genderLean > 1 ? "More traditional masculine preferences" :
                       "More contemporary/feminine preferences";
    return { estimatedAge: ageGuess, preferenceStyle: genderLean };
  };

  if (isComplete && profile) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2">Your Golf Profile</h1>
            <p className="text-gray-600">Based on your {Object.keys(answers).length} responses</p>
            <div className="flex items-center justify-center mt-2 gap-4">
              {profile.mlEnhanced && (
                <div className="flex items-center">
                  <Brain className="text-purple-600 mr-2" size={16} />
                  <span className="text-sm text-purple-600">
                    ML Enhanced • {profile.recommendations?.confidence || 'Medium'} Confidence
                  </span>
                </div>
              )}
              {mlStats?.model?.confidence !== undefined && (
              <div className="flex items-center">
                <Zap className="text-blue-600 mr-2" size={16} />
                <span className="text-sm text-blue-600">
                  Model: {typeof mlStats.model.confidence === 'number'
                    ? mlStats.model.confidence.toFixed(1)
                    : 'Loading...'} confidence
                </span>
              </div>
            )}
            </div>
          </div>

          {/* Core Profile */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <Star className="text-green-600 mr-2" size={20} />
                <h3 className="font-semibold text-green-800">Golfer Type</h3>
              </div>
              <p className="text-lg font-medium text-green-700">{profile.skillLevel?.label}</p>
              <p className="text-sm text-green-600 mt-1">{profile.personality?.primary}</p>
              {profile.mlInsights?.personalityPatterns && (
                <div className="mt-2 text-xs text-purple-600">
                  <Brain size={12} className="inline mr-1" />
                  ML: {profile.mlInsights.personalityPatterns.insights || 'Enhanced personality analysis'}
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <Users className="text-blue-600 mr-2" size={20} />
                <h3 className="font-semibold text-blue-800">Demographics & Similarity</h3>
              </div>
              <p className="text-sm text-blue-600">Est. Age: {profile.demographics?.estimatedAge}</p>
              <p className="text-sm text-blue-600">{profile.demographics?.preferenceStyle}</p>
              {similarityInsights && (
                <div className="mt-2 text-xs text-purple-600">
                  <Target size={12} className="inline mr-1" />
                  {similarityInsights.similarUsers} similar golfers found
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Recommendations */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              Course Recommendations
              {profile.recommendations?.mlEnhanced && (
                <div className="ml-2 flex items-center">
                  <Brain className="text-purple-600" size={16} />
                  <span className="text-xs text-purple-600 ml-1">ML Enhanced</span>
                </div>
              )}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Preferred Style:</strong> {
                typeof profile.recommendations?.courseStyle === 'string'
                  ? profile.recommendations.courseStyle
                  : profile.recommendations?.courseStyle?.primary ||
                    (scores.traditionalism >= 7 ? "Classic parkland" : "Parkland")
              }</p>
              <p><strong>Budget Range:</strong> {
                typeof profile.recommendations?.budgetLevel === 'string'
                  ? profile.recommendations.budgetLevel
                  : profile.recommendations?.budgetLevel?.primary || 'Mid-range'
              }</p>
              <p><strong>Key Amenities:</strong> {
                Array.isArray(profile.recommendations?.amenities)
                  ? profile.recommendations.amenities.join(', ')
                  : Array.isArray(profile.recommendations?.amenities?.essential)
                    ? profile.recommendations.amenities.essential.join(', ')
                    : 'Basic facilities'
              }</p>
              <p><strong>Lodging:</strong> {
                typeof profile.recommendations?.lodging === 'string'
                  ? profile.recommendations.lodging
                  : profile.recommendations?.lodging?.recommended || 'Comfortable location'
              }</p>

              {profile.recommendations?.mlEnhanced && (
                <div className="mt-4 p-3 bg-purple-50 rounded border-l-4 border-purple-200">
                  <p className="text-sm text-purple-700">
                    <strong>ML Insights:</strong> {profile.recommendations.explanation || 'Enhanced recommendations based on similar golfers'}
                  </p>
                  {profile.recommendations.alternativeOptions?.courseStyles && (
                    <p className="text-xs text-purple-600 mt-1">
                      Alternative styles: {
                        Array.isArray(profile.recommendations.alternativeOptions.courseStyles)
                          ? profile.recommendations.alternativeOptions.courseStyles.map(cs => cs.style || cs).join(", ")
                          : 'Various options available'
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-3">Your Preferences</h3>
            <div className="space-y-2">
              {(profile.preferences?.core || []).map((pref, idx) => (
                <div key={idx} className="flex items-center bg-gray-50 p-2 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">{pref}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ML Insights Panel */}
          {showInsights && (profile.mlInsights || similarityInsights || recommendationInsights) && (
            <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-4 flex items-center">
                <Lightbulb className="mr-2" size={20} />
                ML Insights & Analytics
              </h3>

              {similarityInsights && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Similarity Analysis</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Similar Users</p>
                      <p className="text-purple-600">{similarityInsights.similarUsers}</p>
                    </div>
                    <div>
                      <p className="font-medium">Avg Similarity</p>
                      <p className="text-purple-600">{(similarityInsights.averageSimilarity * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="font-medium">Top Match</p>
                      <p className="text-purple-600">{similarityInsights.topMatches && similarityInsights.topMatches[0] ? (similarityInsights.topMatches[0].similarity * 100).toFixed(0) + '%' : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Skill Percentile</p>
                      <p className="text-purple-600">{similarityInsights.userPercentiles?.skillLevel || 'N/A'}th</p>
                    </div>
                  </div>
                </div>
              )}

              {recommendationInsights && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Recommendation Quality</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="font-medium">Confidence: </span>
                      <span className="text-purple-600">{recommendationInsights.confidence}</span>
                    </div>
                    <div>
                      <span className="font-medium">Personalization: </span>
                      <span className="text-purple-600">{recommendationInsights.personalizationLevel}</span>
                    </div>
                  </div>
                  {recommendationInsights.improvementSuggestions && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">Suggestions:</p>
                      <ul className="text-xs text-purple-600 ml-4">
                        {recommendationInsights.improvementSuggestions.slice(0, 2).map((suggestion, idx) => (
                          <li key={idx}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ML Statistics */}
          {showMLStats && mlStats && (
            <div className="mb-8 bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <BarChart3 className="mr-2" size={20} />
                Machine Learning Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total Profiles</p>
                  <p className="text-blue-600">{mlStats.data?.totalProfiles || 0}</p>
                </div>
                <div>
                  <p className="font-medium">User Feedback</p>
                  <p className="text-blue-600">{mlStats.feedback?.totalFeedback || 0}</p>
                </div>
                <div>
                  <p className="font-medium">Model Confidence</p>
                  <p className="text-blue-600">{mlStats.model?.confidence?.toFixed(2) || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-medium">Avg Accuracy</p>
                  <p className="text-blue-600">{mlStats.feedback?.averageAccuracy?.toFixed(2) || 'N/A'}</p>
                </div>
              </div>

              {mlStats.feedback?.topIssues && mlStats.feedback.topIssues.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-gray-700 mb-2">Top Improvement Areas:</p>
                  <div className="flex flex-wrap gap-2">
                    {mlStats.feedback.topIssues.slice(0, 3).map(([issue, count], idx) => (
                      <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        {issue.replace(/_/g, ' ')} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback Section */}
          {showFeedback && (
            <div className="mb-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-4 flex items-center">
                <TrendingUp className="mr-2" size={20} />
                Help Improve Our AI Model!
              </h3>
              <p className="text-sm text-yellow-700 mb-4">
                Your feedback helps our machine learning system provide better recommendations for everyone.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleProfileFeedback({ accuracy: 'very_accurate', helpful: true })}
                  className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                >
                  Very Accurate ⭐
                </button>
                <button
                  onClick={() => handleProfileFeedback({ accuracy: 'mostly_accurate', helpful: true })}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                >
                  Mostly Right ✓
                </button>
                <button
                  onClick={() => handleProfileFeedback({ accuracy: 'somewhat_accurate', helpful: false })}
                  className="px-4 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition"
                >
                  Partially Right ~
                </button>
                <button
                  onClick={() => handleProfileFeedback({ accuracy: 'not_accurate', helpful: false })}
                  className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                >
                  Not Accurate ✗
                </button>
              </div>
              <p className="text-xs text-yellow-600">
                Feedback is anonymous and helps improve accuracy for all users.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={restart}
              className="flex-1 min-w-40 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center"
            >
              <RotateCcw className="mr-2" size={20} />
              Take Quiz Again
            </button>

            <button
              onClick={handleEditAnswers}
              className="flex-1 min-w-40 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
            >
              <Edit3 className="mr-2" size={20} />
              Edit Answers
            </button>

            <button
              onClick={() => setShowInsights(!showInsights)}
              className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition duration-200 flex items-center justify-center"
            >
              <Lightbulb className="mr-2" size={20} />
              {showInsights ? 'Hide' : 'Show'} Insights
            </button>

            <button
              onClick={() => setShowMLStats(!showMLStats)}
              className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition duration-200 flex items-center justify-center"
            >
              <BarChart3 className="mr-2" size={20} />
              ML Stats
            </button>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Edit3 className="mr-2" size={20} />
                Edit Your Answers
              </h3>
              <div className="space-y-4">
                {Object.entries(editingAnswers).map(([questionId, answer]) => {
                  const question = questionBank.find(q => q.id === questionId);
                  return (
                    <div key={questionId} className="border-b pb-4">
                      <p className="font-medium text-sm text-gray-700 mb-2">{answer.questionText}</p>
                      <select
                        value={answer.optionIndex}
                        onChange={(e) => setEditingAnswers({
                          ...editingAnswers,
                          [questionId]: {
                            ...answer,
                            optionIndex: parseInt(e.target.value),
                            answer: question.options[parseInt(e.target.value)].text,
                            rawScores: question.options[parseInt(e.target.value)].scores
                          }
                        })}
                        className="w-full p-2 border rounded hover:border-blue-400 focus:border-blue-500 focus:outline-none"
                      >
                        {question.options.map((option, idx) => (
                          <option key={idx} value={idx}>{option.image} {option.text}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleUpdateAnswers}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                >
                  Update Profile
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentQ = selectedQuestions[currentQuestion];
  if (!currentQ) return (
    <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Brain className="mx-auto text-purple-600 mb-4" size={48} />
        <p className="text-gray-600">Initializing ML-enhanced quiz...</p>
      </div>
    </div>
  );

  // Pass sessionId to ML service for A/B testing
  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="text-2xl mr-2">⛳</div>
            <h1 className="text-2xl font-bold text-green-800">AI-Enhanced Golf Profile Quiz</h1>
            <Brain className="text-purple-600 ml-2" size={24} />
          </div>
          <div className="flex justify-center mb-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full mx-1 ${
                  i < Object.keys(answers).length ? 'bg-green-500' :
                  i === Object.keys(answers).length ? 'bg-green-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">Question {Object.keys(answers).length + 1} of 5-7</p>
          <div className="flex items-center justify-center mt-2 gap-4 text-xs">
            <div className="flex items-center text-purple-600">
              <Brain size={12} className="mr-1" />
              ML-Enhanced Question Selection
            </div>
            {mlStats?.model?.confidence !== undefined && (
              <div className="flex items-center text-blue-600">
                <Zap size={12} className="mr-1" />
                Model Confidence: {typeof mlStats.model.confidence === 'number'
                  ? mlStats.model.confidence.toFixed(1)
                  : 'Loading...'}
              </div>
            )}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {currentQ.question}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQ.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200 text-left group hover:shadow-lg"
              >
                <div className="text-4xl mb-3 text-center">{option.image}</div>
                <div className="text-center">
                  <p className="font-medium text-gray-800 group-hover:text-green-700">
                    {option.text}
                  </p>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-green-500 ml-auto mt-2 transition" size={20} />
                            </button>
            ))}
          </div>
        </div>
        {/* Progress Info */}
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-4">
            <span>Questions answered: {Object.keys(answers).length}</span>
            {mlStats?.data?.totalProfiles > 0 && (
              <span className="flex items-center">
                <Users size={12} className="mr-1" />
                Learning from {mlStats?.data?.totalProfiles} golfers
              </span>
            )}
          </div>
          {Object.keys(answers).length > 0 && (
            <button
              onClick={restart}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Start Over
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GolfProfiler;