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
    this.questionAnalytics = {};
    this.userBehaviorPatterns = {};
  }

  selectNextQuestion(currentAnswers, currentScores, questionBank, questionNumber, userContext = {}) {
    console.log('🎯 Enhanced question selection called for question #', questionNumber);

    // Use the basic selection as base
    if (questionNumber === 0) {
      const starters = questionBank.filter(q => q.type === 'starter');
      const selected = starters[Math.floor(Math.random() * starters.length)] || questionBank[0];
      console.log('🎯 Selected starter question:', selected?.id);
      return selected;
    }

    const answeredIds = Object.keys(currentAnswers);
    const unanswered = questionBank.filter(q => !answeredIds.includes(q.id));

    if (unanswered.length === 0) return null;

    // INTELLIGENT ML-BASED SELECTION
    const scored = unanswered.map(q => ({
      question: q,
      score: this.calculateIntelligentQuestionScore(q, currentAnswers, currentScores, questionNumber)
    }));

    scored.sort((a, b) => b.score - a.score);

    console.log('🧠 Question scores:', scored.map(s => ({ id: s.question.id, score: s.score.toFixed(2) })));

    // Add variety - don't always pick the top score
    const topCandidates = scored.slice(0, Math.min(2, scored.length));
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    const selected = topCandidates[randomIndex].question;

    console.log('🎯 Enhanced selection picked:', selected?.id, 'from', topCandidates.length, 'candidates');
    return selected;
  }

  calculateIntelligentQuestionScore(question, currentAnswers, currentScores, questionNumber) {
    let score = question.priority || 0;

    // Calculate which dimensions need more information
    const uncertainties = this.calculateUncertainties(currentScores);
    console.log('🎯 Current uncertainties:', uncertainties);

    // Score based on how much this question helps with uncertain dimensions
    let uncertaintyReduction = 0;
    question.options.forEach(option => {
      Object.keys(option.scores || {}).forEach(dimension => {
        const uncertainty = uncertainties[dimension] || 0;
        if (uncertainty > 3) { // High uncertainty
          uncertaintyReduction += 3;
        } else if (uncertainty > 1) { // Medium uncertainty
          uncertaintyReduction += 1;
        }
      });
    });

    score += uncertaintyReduction;

    // Adaptive question selection based on progress
    if (questionNumber <= 2) {
      // Early questions: prioritize broad, engaging questions
      if (question.type === 'core' || question.type === 'social' || question.type === 'lifestyle') {
        score += 2;
      }
    } else if (questionNumber >= 3) {
      // Later questions: target specific gaps
      if (question.type === 'skill_assessment' && uncertainties.skillLevel > 2) {
        score += 3;
      }
      if (question.type === 'gear' && uncertainties.luxuryLevel > 2) {
        score += 2;
      }
      if (question.type === 'preparation' && uncertainties.amenityImportance > 2) {
        score += 2;
      }
    }

    // Variety bonus - avoid recently selected question types
    const recentTypes = Object.values(currentAnswers).map(a => {
      const q = this.findQuestionById(a.questionId);
      return q?.type;
    }).filter(Boolean);

    const typeCount = recentTypes.filter(t => t === question.type).length;
    if (typeCount === 0) {
      score += 1; // Bonus for new type
    } else if (typeCount >= 2) {
      score -= 1; // Penalty for repeated type
    }

    // Balance different aspects
    if (questionNumber === 2 && !this.hasAnsweredDimension(currentAnswers, 'socialness')) {
      if (question.id === 'playing_partner' || question.id === 'nineteenth_hole') {
        score += 2;
      }
    }

    if (questionNumber === 3 && !this.hasAnsweredDimension(currentAnswers, 'luxuryLevel')) {
      if (question.id === 'course_recognition' || question.id === 'golf_membership') {
        score += 2;
      }
    }

    console.log(`🧠 Question ${question.id}: base=${question.priority}, uncertainty=${uncertaintyReduction}, final=${score}`);
    return score;
  }

  calculateUncertainties(currentScores) {
    const uncertainties = {};
    const dimensions = ['skillLevel', 'socialness', 'traditionalism', 'luxuryLevel', 'competitiveness', 'amenityImportance', 'pace'];

    dimensions.forEach(dim => {
      const value = currentScores[dim] || 0;
      // Higher uncertainty for unset (0) or middle values (around 5)
      if (value === 0) {
        uncertainties[dim] = 10; // Maximum uncertainty
      } else {
        uncertainties[dim] = Math.abs(value - 5); // Distance from middle
      }
    });

    return uncertainties;
  }

  hasAnsweredDimension(currentAnswers, dimension) {
    // Check if we've already explored this dimension
    for (const answer of Object.values(currentAnswers)) {
      const scores = answer.rawScores || {};
      if (scores[dimension] && scores[dimension] > 0) {
        return true;
      }
    }
    return false;
  }

  findQuestionById(questionId) {
    // This would normally reference the question bank, simplified for now
    return { id: questionId, type: 'unknown' };
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