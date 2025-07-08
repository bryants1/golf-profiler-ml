// MLConfig.js - Configuration for ML system
export const ML_CONFIG = {
  // Similarity thresholds
  SIMILARITY_THRESHOLD: 0.7,
  MIN_SIMILAR_PROFILES: 3,
  MAX_SIMILAR_PROFILES: 10,

  // Learning parameters
  MIN_PROFILES_FOR_CONFIDENCE: {
    LOW: 0,
    MEDIUM: 5,
    HIGH: 20
  },

  // Question selection weights
  QUESTION_WEIGHTS: {
    PRIORITY_WEIGHT: 1.0,
    ML_EFFECTIVENESS_WEIGHT: 2.0,
    UNCERTAINTY_WEIGHT: 3.0,
    TYPE_BONUS: {
      starter: 2,
      core: 2,
      skill_assessment: 3,
      preparation: 2
    }
  },

  // Profile dimensions for similarity calculation
  SIMILARITY_DIMENSIONS: [
    'skillLevel',
    'socialness',
    'traditionalism',
    'luxuryLevel',
    'competitiveness',
    'ageGeneration',
    'amenityImportance',
    'pace'
  ],

  // Feedback categories
  FEEDBACK_CATEGORIES: {
    VERY_ACCURATE: { weight: 1.0, helpful: true },
    MOSTLY_ACCURATE: { weight: 0.8, helpful: true },
    SOMEWHAT_ACCURATE: { weight: 0.5, helpful: false },
    NOT_ACCURATE: { weight: 0.2, helpful: false }
  },

  // Storage keys
  STORAGE_KEYS: {
    TRAINING_DATA: 'golf_profiler_training_data',
    USER_SESSIONS: 'golf_profiler_sessions',
    ML_METRICS: 'golf_profiler_ml_metrics'
  },

  // Question flow parameters
  QUESTION_FLOW: {
    MIN_QUESTIONS: 5,
    MAX_QUESTIONS: 7,
    UNCERTAINTY_THRESHOLD: 2,
    REQUIRED_DIMENSIONS: ['skillLevel', 'luxuryLevel', 'amenityImportance']
  }
};

export const PROFILE_LABELS = {
  skillLevel: {
    0: "New to Golf",
    2: "New to Golf",
    4: "Recreational Player",
    6: "Regular Golfer",
    8: "Serious Player",
    10: "Advanced Golfer"
  },

  personalityTypes: {
    'social_fun': "Social & Fun-Focused",
    'competitive_traditional': "Competitive Traditionalist",
    'social_luxury': "Social Luxury Seeker",
    'peaceful_solo': "Peaceful Solo Player",
    'purist': "Golf Purist",
    'balanced': "Balanced Enthusiast"
  },

  budgetLevels: {
    low: "Value ($25-50)",
    medium: "Mid-range ($50-100)",
    high: "Premium ($100+)"
  }
};

export default ML_CONFIG;
