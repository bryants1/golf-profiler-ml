// DataManager.js - Handles data persistence and retrieval
import { ML_CONFIG } from './MLConfig.js';

export class DataManager {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    // Initialize storage if it doesn't exist
    if (!this.getTrainingData()) {
      this.saveTrainingData({
        profiles: [],
        feedbacks: [],
        questionPaths: [],
        metrics: {
          totalSessions: 0,
          averageAccuracy: 0,
          lastUpdated: Date.now()
        }
      });
    }
  }

  // Training data operations
  getTrainingData() {
    try {
      const stored = localStorage.getItem(ML_CONFIG.STORAGE_KEYS.TRAINING_DATA);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading training data:', error);
      return null;
    }
  }

  saveTrainingData(data) {
    try {
      localStorage.setItem(ML_CONFIG.STORAGE_KEYS.TRAINING_DATA, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving training data:', error);
      return false;
    }
  }

  // Profile operations
  addProfile(profileData) {
    const trainingData = this.getTrainingData();
    if (!trainingData) return false;

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
    if (!trainingData) return [];

    let profiles = trainingData.profiles;

    // Apply filters
    if (filters.minTimestamp) {
      profiles = profiles.filter(p => p.timestamp >= filters.minTimestamp);
    }

    if (filters.minSimilarity && filters.targetScores) {
      profiles = profiles.filter(p => {
        const similarity = this.calculateBasicSimilarity(filters.targetScores, p.scores);
        return similarity >= filters.minSimilarity;
      });
    }

    if (filters.limit) {
      profiles = profiles.slice(0, filters.limit);
    }

    return profiles;
  }

  // Feedback operations
  addFeedback(feedbackData) {
    const trainingData = this.getTrainingData();
    if (!trainingData) return false;

    const enrichedFeedback = {
      ...feedbackData,
      id: this.generateId(),
      timestamp: Date.now()
    };

    trainingData.feedbacks.push(enrichedFeedback);

    // Update accuracy metrics
    this.updateAccuracyMetrics(trainingData, feedbackData);

    return this.saveTrainingData(trainingData);
  }

  getFeedbacks(sessionId = null) {
    const trainingData = this.getTrainingData();
    if (!trainingData) return [];

    return sessionId
      ? trainingData.feedbacks.filter(f => f.sessionId === sessionId)
      : trainingData.feedbacks;
  }

  // Question path tracking
  addQuestionPath(sessionId, questionSequence, totalQuestions, effectiveness) {
    const trainingData = this.getTrainingData();
    if (!trainingData) return false;

    const pathData = {
      id: this.generateId(),
      sessionId,
      questionSequence,
      totalQuestions,
      effectiveness: effectiveness || 0,
      timestamp: Date.now()
    };

    trainingData.questionPaths.push(pathData);
    return this.saveTrainingData(trainingData);
  }

  getQuestionPaths() {
    const trainingData = this.getTrainingData();
    return trainingData ? trainingData.questionPaths : [];
  }

  // Analytics and metrics
  getMLMetrics() {
    const trainingData = this.getTrainingData();
    if (!trainingData) return null;

    const profiles = trainingData.profiles;
    const feedbacks = trainingData.feedbacks;

    return {
      totalProfiles: profiles.length,
      totalFeedbacks: feedbacks.length,
      averageQuestions: profiles.length > 0
        ? profiles.reduce((sum, p) => sum + (p.totalQuestions || 0), 0) / profiles.length
        : 0,
      averageAccuracy: trainingData.metrics.averageAccuracy || 0,
      profilesLastWeek: profiles.filter(p =>
        p.timestamp > Date.now() - (7 * 24 * 60 * 60 * 1000)
      ).length,
      feedbackDistribution: this.calculateFeedbackDistribution(feedbacks),
      modelConfidence: this.calculateModelConfidence(profiles.length)
    };
  }

  // Question effectiveness tracking
  updateQuestionEffectiveness(questionId, effectiveness) {
    const trainingData = this.getTrainingData();
    if (!trainingData) return false;

    if (!trainingData.questionEffectiveness) {
      trainingData.questionEffectiveness = {};
    }

    if (!trainingData.questionEffectiveness[questionId]) {
      trainingData.questionEffectiveness[questionId] = {
        totalUses: 0,
        totalEffectiveness: 0,
        averageEffectiveness: 0
      };
    }

    const qe = trainingData.questionEffectiveness[questionId];
    qe.totalUses += 1;
    qe.totalEffectiveness += effectiveness;
    qe.averageEffectiveness = qe.totalEffectiveness / qe.totalUses;

    return this.saveTrainingData(trainingData);
  }

  getQuestionEffectiveness() {
    const trainingData = this.getTrainingData();
    return trainingData?.questionEffectiveness || {};
  }

  // Data export/import for backup
  exportData() {
    return {
      timestamp: Date.now(),
      version: '1.0',
      data: this.getTrainingData()
    };
  }

  importData(exportedData) {
    if (!exportedData.data) return false;
    return this.saveTrainingData(exportedData.data);
  }

  // Data cleanup and maintenance
  cleanupOldData(maxAge = 365 * 24 * 60 * 60 * 1000) { // 1 year default
    const trainingData = this.getTrainingData();
    if (!trainingData) return false;

    const cutoffTime = Date.now() - maxAge;

    trainingData.profiles = trainingData.profiles.filter(p => p.timestamp > cutoffTime);
    trainingData.feedbacks = trainingData.feedbacks.filter(f => f.timestamp > cutoffTime);
    trainingData.questionPaths = trainingData.questionPaths.filter(qp => qp.timestamp > cutoffTime);

    return this.saveTrainingData(trainingData);
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  calculateBasicSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    let totalDiff = 0;

    dimensions.forEach(dim => {
      const diff = Math.abs((scores1[dim] || 0) - (scores2[dim] || 0));
      totalDiff += diff / 10; // Normalize to 0-1
    });

    return Math.max(0, 1 - (totalDiff / dimensions.length));
  }

  updateAccuracyMetrics(trainingData, feedbackData) {
    const feedbacks = trainingData.feedbacks;
    if (feedbacks.length === 0) {
      trainingData.metrics.averageAccuracy = this.mapFeedbackToScore(feedbackData.accuracy);
      return;
    }

    // Calculate running average
    const currentAvg = trainingData.metrics.averageAccuracy || 0;
    const newScore = this.mapFeedbackToScore(feedbackData.accuracy);
    const totalFeedbacks = feedbacks.length + 1;

    trainingData.metrics.averageAccuracy =
      ((currentAvg * feedbacks.length) + newScore) / totalFeedbacks;
  }

  mapFeedbackToScore(accuracy) {
    const mapping = {
      'very_accurate': 1.0,
      'mostly_accurate': 0.8,
      'somewhat_accurate': 0.5,
      'not_accurate': 0.2
    };
    return mapping[accuracy] || 0.5;
  }

  calculateFeedbackDistribution(feedbacks) {
    const distribution = {
      very_accurate: 0,
      mostly_accurate: 0,
      somewhat_accurate: 0,
      not_accurate: 0
    };

    feedbacks.forEach(f => {
      if (distribution.hasOwnProperty(f.accuracy)) {
        distribution[f.accuracy]++;
      }
    });

    return distribution;
  }

  calculateModelConfidence(profileCount) {
    if (profileCount >= ML_CONFIG.MIN_PROFILES_FOR_CONFIDENCE.HIGH) return 'High';
    if (profileCount >= ML_CONFIG.MIN_PROFILES_FOR_CONFIDENCE.MEDIUM) return 'Medium';
    return 'Learning';
  }

  // Development helpers
  generateMockData(count = 50) {
    if (process.env.NODE_ENV !== 'development') return false;

    const mockProfiles = [];
    for (let i = 0; i < count; i++) {
      mockProfiles.push(this.generateMockProfile());
    }

    const trainingData = this.getTrainingData();
    trainingData.profiles.push(...mockProfiles);
    return this.saveTrainingData(trainingData);
  }

  generateMockProfile() {
    // Generate realistic mock data for testing
    return {
      id: this.generateId(),
      timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Last 30 days
      scores: {
        skillLevel: Math.floor(Math.random() * 11),
        socialness: Math.floor(Math.random() * 11),
        traditionalism: Math.floor(Math.random() * 11),
        luxuryLevel: Math.floor(Math.random() * 11),
        competitiveness: Math.floor(Math.random() * 11),
        ageGeneration: Math.floor(Math.random() * 11),
        amenityImportance: Math.floor(Math.random() * 11),
        pace: Math.floor(Math.random() * 11),
        courseStyle: { parkland: 1 }
      },
      totalQuestions: 5 + Math.floor(Math.random() * 3),
      version: '1.0'
    };
  }

  clearAllData() {
    if (process.env.NODE_ENV !== 'development') return false;

    localStorage.removeItem(ML_CONFIG.STORAGE_KEYS.TRAINING_DATA);
    localStorage.removeItem(ML_CONFIG.STORAGE_KEYS.USER_SESSIONS);
    localStorage.removeItem(ML_CONFIG.STORAGE_KEYS.ML_METRICS);

    this.initializeStorage();
    return true;
  }
}

export default DataManager;
