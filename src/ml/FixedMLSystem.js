// MemoryDataManager.js - Replaces localStorage with in-memory storage
export class MemoryDataManager {
  constructor() {
    // In-memory storage instead of localStorage
    this.memoryStore = {
      trainingData: {
        profiles: [],
        feedbacks: [],
        questionPaths: [],
        metrics: {
          totalSessions: 0,
          averageAccuracy: 0,
          lastUpdated: Date.now()
        }
      },
      questionEffectiveness: {},
      performanceMetrics: {
        profilesGenerated: 0,
        averageAccuracy: 0,
        totalFeedbacks: 0,
        lastUpdated: Date.now()
      }
    };

    this.initializeWithMockData();
  }

  // Initialize with realistic mock data to make ML work
  initializeWithMockData() {
    // Add diverse mock profiles for ML similarity matching
    const mockProfiles = this.generateDiverseMockProfiles(25);
    this.memoryStore.trainingData.profiles = mockProfiles;

    // Add mock feedback data
    const mockFeedbacks = this.generateMockFeedbacks(15);
    this.memoryStore.trainingData.feedbacks = mockFeedbacks;

    // Add mock question effectiveness data
    this.memoryStore.questionEffectiveness = this.generateMockQuestionEffectiveness();

    console.log('Initialized with mock ML data:', {
      profiles: mockProfiles.length,
      feedbacks: mockFeedbacks.length
    });
  }

  generateDiverseMockProfiles(count) {
    const profiles = [];

    for (let i = 0; i < count; i++) {
      profiles.push({
        id: `mock_${Date.now()}_${i}`,
        timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        scores: {
          skillLevel: Math.floor(Math.random() * 11),
          socialness: Math.floor(Math.random() * 11),
          traditionalism: Math.floor(Math.random() * 11),
          luxuryLevel: Math.floor(Math.random() * 11),
          competitiveness: Math.floor(Math.random() * 11),
          ageGeneration: Math.floor(Math.random() * 11),
          amenityImportance: Math.floor(Math.random() * 11),
          pace: Math.floor(Math.random() * 11),
          courseStyle: this.generateRandomCourseStyle()
        },
        totalQuestions: 5 + Math.floor(Math.random() * 3),
        questionSequence: this.generateRandomQuestionSequence(),
        profile: {
          recommendations: {
            courseStyle: this.getRandomCourseStyle(),
            confidence: Math.random() > 0.5 ? 'High' : 'Medium'
          }
        },
        version: '1.0'
      });
    }

    return profiles;
  }

  generateRandomCourseStyle() {
    const styles = ['parkland', 'links', 'coastal', 'desert', 'mountain'];
    const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
    return { [selectedStyle]: 1 };
  }

  getRandomCourseStyle() {
    const styles = ['parkland', 'links', 'coastal', 'desert', 'mountain'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  generateRandomQuestionSequence() {
    const questionIds = ['skill', 'social', 'luxury', 'pace', 'tradition', 'competitive', 'amenity'];
    const count = 5 + Math.floor(Math.random() * 3);
    return questionIds.slice(0, count);
  }

  generateMockFeedbacks(count) {
    const feedbacks = [];
    const accuracyLevels = ['very_accurate', 'mostly_accurate', 'somewhat_accurate', 'not_accurate'];

    for (let i = 0; i < count; i++) {
      feedbacks.push({
        id: `feedback_${i}`,
        sessionId: `session_${i}`,
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        accuracy: accuracyLevels[Math.floor(Math.random() * accuracyLevels.length)],
        responseTime: 5000 + Math.random() * 15000,
        feedbackWeight: 0.8 + Math.random() * 0.4,
        credibilityScore: 0.7 + Math.random() * 0.3
      });
    }

    return feedbacks;
  }

  generateMockQuestionEffectiveness() {
    const questions = ['skill', 'social', 'luxury', 'pace', 'tradition', 'competitive', 'amenity'];
    const effectiveness = {};

    questions.forEach(qId => {
      effectiveness[qId] = {
        totalUses: Math.floor(Math.random() * 20) + 5,
        totalEffectiveness: Math.random() * 15 + 5,
        averageEffectiveness: 0.6 + Math.random() * 0.3
      };
    });

    return effectiveness;
  }

  // Storage methods that work with memory instead of localStorage
  getTrainingData() {
    return this.memoryStore.trainingData;
  }

  saveTrainingData(data) {
    this.memoryStore.trainingData = { ...data };
    return true;
  }

  addProfile(profileData) {
    const trainingData = this.getTrainingData();
    const enrichedProfile = {
      ...profileData,
      id: this.generateId(),
      timestamp: Date.now(),
      version: '1.0'
    };

    trainingData.profiles.push(enrichedProfile);
    trainingData.metrics.totalSessions += 1;
    trainingData.metrics.lastUpdated = Date.now();

    return this.saveTrainingData(trainingData);
  }

  getProfiles(filters = {}) {
    const trainingData = this.getTrainingData();
    let profiles = trainingData.profiles;

    if (filters.minTimestamp) {
      profiles = profiles.filter(p => p.timestamp >= filters.minTimestamp);
    }

    if (filters.limit) {
      profiles = profiles.slice(0, filters.limit);
    }

    return profiles;
  }

  addFeedback(feedbackData) {
    const trainingData = this.getTrainingData();
    const enrichedFeedback = {
      ...feedbackData,
      id: this.generateId(),
      timestamp: Date.now()
    };

    trainingData.feedbacks.push(enrichedFeedback);
    return this.saveTrainingData(trainingData);
  }

  getFeedbacks(sessionId = null) {
    const trainingData = this.getTrainingData();
    return sessionId
      ? trainingData.feedbacks.filter(f => f.sessionId === sessionId)
      : trainingData.feedbacks;
  }

  updateQuestionEffectiveness(questionId, effectiveness) {
    if (!this.memoryStore.questionEffectiveness[questionId]) {
      this.memoryStore.questionEffectiveness[questionId] = {
        totalUses: 0,
        totalEffectiveness: 0,
        averageEffectiveness: 0
      };
    }

    const qe = this.memoryStore.questionEffectiveness[questionId];
    qe.totalUses += 1;
    qe.totalEffectiveness += effectiveness;
    qe.averageEffectiveness = qe.totalEffectiveness / qe.totalUses;

    return true;
  }

  getQuestionEffectiveness() {
    return this.memoryStore.questionEffectiveness;
  }

  getMLMetrics() {
    const profiles = this.memoryStore.trainingData.profiles;
    const feedbacks = this.memoryStore.trainingData.feedbacks;

    return {
      totalProfiles: profiles.length,
      totalFeedbacks: feedbacks.length,
      averageQuestions: profiles.length > 0
        ? profiles.reduce((sum, p) => sum + (p.totalQuestions || 0), 0) / profiles.length
        : 0,
      averageAccuracy: this.memoryStore.trainingData.metrics.averageAccuracy || 0.75,
      profilesLastWeek: profiles.filter(p =>
        p.timestamp > Date.now() - (7 * 24 * 60 * 60 * 1000)
      ).length,
      modelConfidence: profiles.length >= 20 ? 'High' : profiles.length >= 10 ? 'Medium' : 'Learning'
    };
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Add question path tracking
  addQuestionPath(sessionId, questionSequence, totalQuestions, effectiveness) {
    const trainingData = this.getTrainingData();
    const pathData = {
      id: this.generateId(),
      sessionId,
      questionSequence,
      totalQuestions,
      effectiveness: effectiveness || 0.75,
      timestamp: Date.now()
    };

    if (!trainingData.questionPaths) {
      trainingData.questionPaths = [];
    }

    trainingData.questionPaths.push(pathData);
    return this.saveTrainingData(trainingData);
  }

  getQuestionPaths() {
    const trainingData = this.getTrainingData();
    return trainingData.questionPaths || [];
  }
}

// Enhanced QuestionSelector with true randomization
export class EnhancedQuestionSelector {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.questionEffectiveness = this.dataManager.getQuestionEffectiveness();
    this.selectionHistory = new Map(); // Track what's been selected
  }

  selectNextQuestion(currentAnswers, currentScores, questionBank, questionNumber, userContext = {}) {
    if (questionNumber === 0) {
      return this.selectStarterQuestionWithVariation(questionBank);
    }

    const answeredIds = Object.keys(currentAnswers);
    const unansweredQuestions = questionBank.filter(q => !answeredIds.includes(q.id));

    if (unansweredQuestions.length === 0) {
      return null;
    }

    // Calculate scores with randomization
    const questionScores = unansweredQuestions.map(question => ({
      question,
      score: this.calculateQuestionScoreWithVariation(
        question,
        currentAnswers,
        currentScores,
        questionNumber,
        userContext
      )
    }));

    // Sort by score
    questionScores.sort((a, b) => b.score - a.score);

    // Add meaningful randomization - pick from top 3 candidates
    const topQuestions = questionScores.slice(0, Math.min(3, questionScores.length));

    // Weighted random selection with time-based seed
    const weights = topQuestions.map((item, index) => Math.pow(0.7, index)); // Decreasing weights
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // Use time-based randomization
    const seed = (Date.now() + questionNumber * 1000) % 10000;
    let random = (seed / 10000) * totalWeight;

    for (let i = 0; i < topQuestions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        this.recordSelection(topQuestions[i].question.id, questionNumber);
        return topQuestions[i].question;
      }
    }

    return topQuestions[0].question;
  }

  selectStarterQuestionWithVariation(questionBank) {
    const starterQuestions = questionBank.filter(q => q.type === 'starter');

    if (starterQuestions.length === 0) {
      return questionBank[0];
    }

    // Time-based selection for variety
    const timeBasedIndex = Math.floor((Date.now() / 1000) % starterQuestions.length);
    return starterQuestions[timeBasedIndex];
  }

  calculateQuestionScoreWithVariation(question, currentAnswers, currentScores, questionNumber, userContext) {
    let score = question.priority || 0;

    // Add uncertainty reduction score
    score += this.calculateUncertaintyReductionScore(question, currentScores);

    // Add ML effectiveness score
    const effectiveness = this.questionEffectiveness[question.id];
    if (effectiveness) {
      score += effectiveness.averageEffectiveness * 2;
    }

    // Add variation factor based on question type and timing
    score += this.calculateVariationBonus(question, questionNumber);

    // Penalize recently selected similar questions
    score -= this.getRecentSelectionPenalty(question.id);

    return score;
  }

  calculateUncertaintyReductionScore(question, currentScores) {
    const uncertainties = this.calculateCurrentUncertainties(currentScores);
    let reductionScore = 0;

    question.options?.forEach(option => {
      Object.keys(option.scores || {}).forEach(dimension => {
        if (uncertainties[dimension]) {
          reductionScore += uncertainties[dimension] * 0.5;
        }
      });
    });

    return reductionScore;
  }

  calculateCurrentUncertainties(currentScores) {
    const dimensions = ['skillLevel', 'socialness', 'traditionalism', 'luxuryLevel', 'competitiveness', 'ageGeneration', 'amenityImportance', 'pace'];
    const uncertainties = {};

    dimensions.forEach(dimension => {
      const score = currentScores[dimension] || 0;
      uncertainties[dimension] = score === 0 ? 10 : Math.abs(score - 5);
    });

    return uncertainties;
  }

  calculateVariationBonus(question, questionNumber) {
    // Add time-based variation
    const timeVariation = (Date.now() % 1000) / 1000; // 0-1

    // Question type bonuses that change over time
    const typeBonuses = {
      'starter': 2 - (questionNumber * 0.3),
      'core': 1 + timeVariation,
      'skill_assessment': 1.5 + (timeVariation * 0.5),
      'social': 1 + (Math.sin(Date.now() / 10000) * 0.5),
      'preference': 1 + (Math.cos(Date.now() / 8000) * 0.3)
    };

    return typeBonuses[question.type] || timeVariation;
  }

  recordSelection(questionId, position) {
    const key = `${questionId}_${position}`;
    this.selectionHistory.set(key, Date.now());
  }

  getRecentSelectionPenalty(questionId) {
    const recent = Array.from(this.selectionHistory.entries())
      .filter(([key, time]) => key.startsWith(questionId) && (Date.now() - time) < 60000)
      .length;

    return recent * 0.5; // Penalty for recent selections
  }
}

// Usage example:
export function createEnhancedMLSystem() {
  const memoryDataManager = new MemoryDataManager();
  const enhancedQuestionSelector = new EnhancedQuestionSelector(memoryDataManager);

  return {
    dataManager: memoryDataManager,
    questionSelector: enhancedQuestionSelector,
    isReady: true,

    // Test the system
    test() {
      console.log('Testing ML System:');
      console.log('Available profiles:', memoryDataManager.getProfiles().length);
      console.log('ML Metrics:', memoryDataManager.getMLMetrics());

      // Test question selection variation
      const mockQuestions = [
        { id: 'q1', type: 'starter', priority: 5, options: [{ scores: { skillLevel: 2 } }] },
        { id: 'q2', type: 'core', priority: 4, options: [{ scores: { socialness: 3 } }] },
        { id: 'q3', type: 'core', priority: 3, options: [{ scores: { luxuryLevel: 1 } }] }
      ];

      const selections = [];
      for (let i = 0; i < 5; i++) {
        const selected = enhancedQuestionSelector.selectNextQuestion({}, {}, mockQuestions, 0);
        selections.push(selected.id);
      }

      console.log('Question selection variation:', selections);
      return selections.length === new Set(selections).size; // Should have variety
    }
  };
}

// Initialize the system
const mlSystem = createEnhancedMLSystem();
console.log('Enhanced ML System Created:', mlSystem.test());
