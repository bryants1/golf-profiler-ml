// MLService.js - Main ML service that coordinates all ML components
import DataManager from './DataManager.js';
import SimilarityCalculator from './SimilarityCalculator.js';
import RecommendationEngine from './RecommendationEngine.js';
import QuestionSelector from './QuestionSelector.js';
import FeedbackCollector from './FeedbackCollector.js';
import ProfileGenerator from './ProfileGenerator.js';
import { ML_CONFIG } from './MLConfig.js';

export class MLService {
  constructor(options = {}) {
    // Don't use ML_CONFIG here - store options for later
    this.options = options;

    // Initialize core components
    this.dataManager = new DataManager();
    this.similarityCalculator = new SimilarityCalculator();
    this.recommendationEngine = new RecommendationEngine(this.similarityCalculator, this.dataManager);
    this.questionSelector = new QuestionSelector(this.dataManager);
    this.feedbackCollector = new FeedbackCollector(this.dataManager);
    this.profileGenerator = new ProfileGenerator(
      this.similarityCalculator,
      this.recommendationEngine,
      this.dataManager
    );

    // Configuration - Move this AFTER ML_CONFIG is available
    this.config = null;
    this.isInitialized = false;
    this.modelVersion = '1.0.0';

    // Performance tracking
    this.performanceMetrics = {
      profilesGenerated: 0,
      averageAccuracy: 0,
      totalFeedbacks: 0,
      lastUpdated: Date.now()
    };

    this.initialize();
  }

  async initialize() {
    try {
      // NOW use ML_CONFIG after everything is loaded
      this.config = { ...ML_CONFIG, ...this.options };

      // Load any cached models or configurations
      await this.loadPerformanceMetrics();

      // Initialize components
      this.isInitialized = true;

      console.log('MLService initialized successfully');
    } catch (error) {
      console.error('Error initializing MLService:', error);
      this.isInitialized = false;
    }
  }




  // Main API Methods for Golf Profiler

  // Generate a complete profile with ML enhancement
  async generateProfile(answers, scores, sessionId, options = {}) {
    if (!this.isInitialized) {
      console.warn('MLService not initialized, using basic profile generation');
      return this.profileGenerator.generateProfile(answers, scores, sessionId, 'basic');
    }

    try {
      // Record the profile generation
      this.performanceMetrics.profilesGenerated++;

      // Generate enhanced profile
      const profile = this.profileGenerator.generateProfile(
        answers,
        scores,
        sessionId,
        options.enhancementLevel || 'full'
      );

      // Store profile data for future learning
      await this.addProfileData(answers, scores, profile, sessionId);

      // Update performance metrics
      this.updatePerformanceMetrics();

      return profile;
    } catch (error) {
      console.error('Error generating profile:', error);
      // Fallback to basic profile
      return this.profileGenerator.generateProfile(answers, scores, sessionId, 'basic');
    }
  }

  // Smart question selection with ML
  selectNextQuestion(currentAnswers, currentScores, questionBank, questionNumber, userContext = {}) {
    if (!this.isInitialized) {
      // Fallback to basic question selection
      return this.basicQuestionSelection(currentAnswers, questionBank, questionNumber);
    }

    try {
      return this.questionSelector.selectNextQuestion(
        currentAnswers,
        currentScores,
        questionBank,
        questionNumber,
        userContext
      );
    } catch (error) {
      console.error('Error in ML question selection:', error);
      return this.basicQuestionSelection(currentAnswers, questionBank, questionNumber);
    }
  }

  // Collect and process user feedback
  async collectFeedback(sessionId, feedbackData, profileData = null) {
    try {
      const success = this.feedbackCollector.collectProfileFeedback(sessionId, feedbackData, profileData);

      if (success) {
        this.performanceMetrics.totalFeedbacks++;
        this.updateAccuracyMetrics(feedbackData);
      }

      return success;
    } catch (error) {
      console.error('Error collecting feedback:', error);
      return false;
    }
  }

  // Get enhanced recommendations for existing profile
  async getEnhancedRecommendations(currentScores, currentProfile, options = {}) {
    if (!this.isInitialized) {
      return currentProfile.recommendations;
    }

    try {
      const similarProfiles = this.profileGenerator.findSimilarProfiles(currentScores);

      return this.recommendationEngine.generateEnhancedRecommendations(
        currentScores,
        currentProfile,
        similarProfiles
      );
    } catch (error) {
      console.error('Error generating enhanced recommendations:', error);
      return currentProfile.recommendations;
    }
  }

  // Analytics and Insights

  // Get comprehensive ML statistics
  getMLStatistics() {
    const dataMetrics = this.dataManager.getMLMetrics();
    const feedbackAnalytics = this.feedbackCollector.getFeedbackAnalytics();
    const questionAnalytics = this.questionSelector.getQuestionAnalytics();

    return {
      model: {
        version: this.modelVersion,
        initialized: this.isInitialized,
        confidence: this.calculateModelConfidence()
      },
      data: dataMetrics,
      feedback: feedbackAnalytics,
      questions: questionAnalytics,
      performance: this.performanceMetrics
    };
  }

  // Get user similarity insights
  getUserSimilarityInsights(userScores, options = {}) {
    try {
      const allProfiles = this.dataManager.getProfiles();
      const similarProfiles = this.similarityCalculator.findSimilarProfiles(
        userScores,
        allProfiles,
        options
      );

      return {
        similarUsers: similarProfiles.length,
        averageSimilarity: similarProfiles.length > 0
          ? similarProfiles.reduce((sum, p) => sum + p.similarity, 0) / similarProfiles.length
          : 0,
        topMatches: similarProfiles.slice(0, 5).map(p => ({
          similarity: p.similarity,
          keyDimensions: this.identifyKeyMatchingDimensions(userScores, p.scores)
        })),
        userPercentiles: this.calculateUserPercentiles(userScores, allProfiles)
      };
    } catch (error) {
      console.error('Error getting similarity insights:', error);
      return null;
    }
  }

  // Get recommendation insights and explanations
  getRecommendationInsights(userScores, recommendations) {
    try {
      const similarProfiles = this.profileGenerator.findSimilarProfiles(userScores);

      return {
        confidence: recommendations.confidence || 'Medium',
        explanation: recommendations.explanation || 'Based on user preferences',
        alternatives: recommendations.alternativeOptions || [],
        improvementSuggestions: this.generateImprovementSuggestions(userScores, similarProfiles),
        personalizationLevel: this.calculatePersonalizationLevel(userScores, similarProfiles)
      };
    } catch (error) {
      console.error('Error getting recommendation insights:', error);
      return null;
    }
  }

  // Model Management

  // Update model based on new feedback
  async updateModel(feedbackBatch = null) {
    if (!this.isInitialized) return false;

    try {
      // Process any pending feedback
      if (feedbackBatch) {
        for (const feedback of feedbackBatch) {
          await this.collectFeedback(feedback.sessionId, feedback.data, feedback.profile);
        }
      }

      // Trigger batch processing
      this.feedbackCollector.processBatchFeedback();

      // Update performance metrics
      this.updatePerformanceMetrics();

      console.log('Model updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating model:', error);
      return false;
    }
  }

  // Export model data for backup
  exportModelData() {
    return {
      version: this.modelVersion,
      timestamp: Date.now(),
      data: this.dataManager.exportData(),
      metrics: this.performanceMetrics,
      config: this.config
    };
  }

  // Import model data from backup
  async importModelData(modelData) {
    try {
      if (modelData.version !== this.modelVersion) {
        console.warn(`Version mismatch: ${modelData.version} vs ${this.modelVersion}`);
      }

      const success = this.dataManager.importData(modelData.data);

      if (success && modelData.metrics) {
        this.performanceMetrics = { ...modelData.metrics };
      }

      return success;
    } catch (error) {
      console.error('Error importing model data:', error);
      return false;
    }
  }

  // Utilities and Helpers

  // Basic question selection fallback
  basicQuestionSelection(currentAnswers, questionBank, questionNumber) {
    if (questionNumber === 0) {
      return questionBank.find(q => q.type === 'starter') || questionBank[0];
    }

    const answeredIds = Object.keys(currentAnswers);
    const unansweredQuestions = questionBank.filter(q => !answeredIds.includes(q.id));

    // Simple priority-based selection
    return unansweredQuestions.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
  }

  // Add profile data for training
  async addProfileData(answers, scores, profile, sessionId) {
    try {
      const profileData = {
        sessionId,
        answers,
        scores,
        profile,
        questionSequence: Object.keys(answers),
        totalQuestions: Object.keys(answers).length,
        timestamp: Date.now()
      };

      return this.dataManager.addProfile(profileData);
    } catch (error) {
      console.error('Error adding profile data:', error);
      return false;
    }
  }

  // Calculate model confidence
  calculateModelConfidence() {
    const metrics = this.dataManager.getMLMetrics();
    const profileCount = metrics.totalProfiles || 0;
    const feedbackCount = metrics.totalFeedbacks || 0;
    const averageAccuracy = this.performanceMetrics.averageAccuracy || 0;

    let confidence = 0;

    // Data quantity factor
    if (profileCount >= 100) confidence += 0.4;
    else if (profileCount >= 50) confidence += 0.3;
    else if (profileCount >= 20) confidence += 0.2;
    else if (profileCount >= 10) confidence += 0.1;

    // Feedback quality factor
    if (feedbackCount >= 50) confidence += 0.3;
    else if (feedbackCount >= 20) confidence += 0.2;
    else if (feedbackCount >= 10) confidence += 0.1;

    // Accuracy factor
    confidence += averageAccuracy * 0.3;

    return Math.min(1.0, confidence);
  }

  // Update performance metrics
  updatePerformanceMetrics() {
    const metrics = this.dataManager.getMLMetrics();

    this.performanceMetrics = {
      ...this.performanceMetrics,
      totalProfiles: metrics.totalProfiles || 0,
      totalFeedbacks: metrics.totalFeedbacks || 0,
      modelConfidence: this.calculateModelConfidence(),
      lastUpdated: Date.now()
    };

    // Save to storage
    this.savePerformanceMetrics();
  }

  // Update accuracy metrics from feedback
  updateAccuracyMetrics(feedbackData) {
    const accuracyScore = this.mapAccuracyToScore(feedbackData.accuracy);
    const currentAvg = this.performanceMetrics.averageAccuracy || 0;
    const totalFeedbacks = this.performanceMetrics.totalFeedbacks || 1;

    // Calculate running average
    this.performanceMetrics.averageAccuracy =
      ((currentAvg * (totalFeedbacks - 1)) + accuracyScore) / totalFeedbacks;
  }

  mapAccuracyToScore(accuracy) {
    const mapping = {
      'very_accurate': 1.0,
      'mostly_accurate': 0.8,
      'somewhat_accurate': 0.5,
      'not_accurate': 0.2
    };
    return mapping[accuracy] || 0.5;
  }

  // Load performance metrics from storage
  async loadPerformanceMetrics() {
    try {
      const stored = localStorage.getItem('golf_profiler_performance_metrics');
      if (stored) {
        this.performanceMetrics = { ...this.performanceMetrics, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  }

  // Save performance metrics to storage
  savePerformanceMetrics() {
    try {
      localStorage.setItem('golf_profiler_performance_metrics', JSON.stringify(this.performanceMetrics));
    } catch (error) {
      console.error('Error saving performance metrics:', error);
    }
  }

  // Identify key matching dimensions between users
  identifyKeyMatchingDimensions(scores1, scores2) {
    const matches = [];
    const threshold = 2; // Within 2 points

    ML_CONFIG.SIMILARITY_DIMENSIONS.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;

      if (Math.abs(val1 - val2) <= threshold) {
        matches.push(dim);
      }
    });

    return matches;
  }

  // Calculate user percentiles compared to all users
  calculateUserPercentiles(userScores, allProfiles) {
    if (allProfiles.length === 0) return {};

    const percentiles = {};

    ML_CONFIG.SIMILARITY_DIMENSIONS.forEach(dim => {
      const userValue = userScores[dim] || 0;
      const allValues = allProfiles
        .map(p => p.scores[dim] || 0)
        .sort((a, b) => a - b);

      const index = allValues.findIndex(val => val >= userValue);
      const percentile = index >= 0 ? (index / allValues.length) * 100 : 100;

      percentiles[dim] = Math.round(percentile);
    });

    return percentiles;
  }

  // Generate improvement suggestions
  generateImprovementSuggestions(userScores, similarProfiles) {
    const suggestions = [];

    if (similarProfiles.length < 5) {
      suggestions.push("Complete the full quiz for more personalized recommendations");
    }

    // Analyze areas where user differs from similar users
    const avgSimilarScores = this.calculateAverageSimilarScores(similarProfiles);

    ML_CONFIG.SIMILARITY_DIMENSIONS.forEach(dim => {
      const userScore = userScores[dim] || 0;
      const avgScore = avgSimilarScores[dim] || 0;
      const diff = Math.abs(userScore - avgScore);

      if (diff > 3) {
        suggestions.push(`Consider exploring ${dim} preferences - similar golfers show different patterns`);
      }
    });

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  calculateAverageSimilarScores(similarProfiles) {
    if (similarProfiles.length === 0) return {};

    const avgScores = {};

    ML_CONFIG.SIMILARITY_DIMENSIONS.forEach(dim => {
      const values = similarProfiles.map(p => p.scores[dim] || 0);
      avgScores[dim] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return avgScores;
  }

  // Calculate personalization level
  calculatePersonalizationLevel(userScores, similarProfiles) {
    const confidence = this.calculateModelConfidence();
    const dataQuality = similarProfiles.length >= 10 ? 'High' :
                       similarProfiles.length >= 5 ? 'Medium' : 'Low';

    if (confidence > 0.8 && dataQuality === 'High') return 'Very High';
    if (confidence > 0.6 && dataQuality !== 'Low') return 'High';
    if (confidence > 0.4) return 'Medium';
    return 'Low';
  }

  // Development and testing utilities
  generateMockData(count = 50) {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Mock data generation only available in development mode');
      return false;
    }

    return this.dataManager.generateMockData(count);
  }

  clearAllData() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Data clearing only available in development mode');
      return false;
    }

    const success = this.dataManager.clearAllData();
    if (success) {
      this.performanceMetrics = {
        profilesGenerated: 0,
        averageAccuracy: 0,
        totalFeedbacks: 0,
        lastUpdated: Date.now()
      };
      this.savePerformanceMetrics();
    }

    return success;
  }

  // Health check
  healthCheck() {
    return {
      initialized: this.isInitialized,
      version: this.modelVersion,
      dataHealth: this.dataManager.getMLMetrics(),
      performanceHealth: this.performanceMetrics,
      lastUpdated: new Date(this.performanceMetrics.lastUpdated).toISOString()
    };
  }
}

export default MLService;
