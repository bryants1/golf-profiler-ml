// FeedbackCollector.js - Collect and process user feedback for ML improvement
import { ML_CONFIG } from './MLConfig.js';

export class FeedbackCollector {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.feedbackBuffer = [];
    this.processingQueue = [];
  }

  // Main feedback collection method
  collectProfileFeedback(sessionId, feedbackData, profileData = null) {
    const enrichedFeedback = this.enrichFeedbackData(sessionId, feedbackData, profileData);

    // Store immediately
    const success = this.dataManager.addFeedback(enrichedFeedback);

    if (success) {
      // Add to processing queue for ML updates
      this.processingQueue.push(enrichedFeedback);

      // Process feedback for immediate learning
      this.processImmediateFeedback(enrichedFeedback);

      // Trigger batch processing if queue is full
      if (this.processingQueue.length >= 10) {
        this.processBatchFeedback();
      }
    }

    return success;
  }

  // Enrich feedback with additional context
  enrichFeedbackData(sessionId, feedbackData, profileData) {
    return {
      sessionId,
      timestamp: Date.now(),
      ...feedbackData,

      // Add context
      deviceInfo: this.getDeviceInfo(),
      userAgent: this.getUserAgent(),
      responseTime: feedbackData.responseTime || null,

      // Profile context if available
      profileContext: profileData ? {
        totalQuestions: profileData.totalQuestions,
        questionSequence: profileData.questionSequence,
        profileConfidence: profileData.profile?.recommendations?.confidence
      } : null,

      // Feedback analysis
      feedbackWeight: this.calculateFeedbackWeight(feedbackData),
      credibilityScore: this.calculateCredibilityScore(feedbackData, profileData)
    };
  }

  // Calculate feedback weight based on response quality
  calculateFeedbackWeight(feedbackData) {
    let weight = 1.0;

    // Weight based on accuracy rating
    const accuracyWeights = ML_CONFIG.FEEDBACK_CATEGORIES;
    if (accuracyWeights[feedbackData.accuracy]) {
      weight *= accuracyWeights[feedbackData.accuracy].weight;
    }

    // Boost weight for detailed feedback
    if (feedbackData.detailedComments && feedbackData.detailedComments.length > 20) {
      weight *= 1.2;
    }

    // Boost weight for specific dimension feedback
    if (feedbackData.dimensionFeedback) {
      weight *= 1.1;
    }

    // Reduce weight for very quick responses (might be careless)
    if (feedbackData.responseTime && feedbackData.responseTime < 3000) { // 3 seconds
      weight *= 0.8;
    }

    return Math.max(0.1, Math.min(2.0, weight)); // Clamp between 0.1 and 2.0
  }

  // Calculate credibility score
  calculateCredibilityScore(feedbackData, profileData) {
    let credibility = 1.0;

    // Higher credibility for users who completed more questions
    if (profileData?.totalQuestions) {
      credibility *= Math.min(1.2, 0.8 + (profileData.totalQuestions * 0.1));
    }

    // Higher credibility for consistent responses
    if (feedbackData.consistency) {
      credibility *= feedbackData.consistency;
    }

    // Lower credibility for extreme ratings without explanation
    if ((feedbackData.accuracy === 'very_accurate' || feedbackData.accuracy === 'not_accurate') &&
        (!feedbackData.detailedComments || feedbackData.detailedComments.length < 10)) {
      credibility *= 0.7;
    }

    return Math.max(0.1, Math.min(1.5, credibility));
  }

  // Process feedback immediately for quick learning
  processImmediateFeedback(feedbackData) {
    // Update question effectiveness based on feedback
    if (feedbackData.profileContext?.questionSequence) {
      this.updateQuestionEffectiveness(feedbackData);
    }

    // Update recommendation accuracy tracking
    this.updateRecommendationAccuracy(feedbackData);

    // Update user experience metrics
    this.updateUserExperienceMetrics(feedbackData);
  }

  // Update question effectiveness based on profile accuracy
  updateQuestionEffectiveness(feedbackData) {
    const questionSequence = feedbackData.profileContext.questionSequence;
    const accuracyScore = this.mapAccuracyToScore(feedbackData.accuracy);
    const weight = feedbackData.feedbackWeight;

    questionSequence.forEach((questionId, index) => {
      // Questions asked later have less impact on overall accuracy
      const positionWeight = 1.0 - (index * 0.1);
      const effectiveness = accuracyScore * weight * positionWeight;

      this.dataManager.updateQuestionEffectiveness(questionId, effectiveness);
    });
  }

  // Update recommendation accuracy tracking
  updateRecommendationAccuracy(feedbackData) {
    if (feedbackData.recommendationFeedback) {
      // Track which types of recommendations were accurate
      Object.entries(feedbackData.recommendationFeedback).forEach(([recType, accuracy]) => {
        this.updateRecommendationType(recType, accuracy, feedbackData.feedbackWeight);
      });
    }
  }

  // Update user experience metrics
  updateUserExperienceMetrics(feedbackData) {
    const metrics = {
      satisfaction: this.calculateSatisfaction(feedbackData),
      engagement: this.calculateEngagement(feedbackData),
      completion_likelihood: feedbackData.wouldRecommend ? 1.0 : 0.0,
      response_time: feedbackData.responseTime || null
    };

    // Store aggregated metrics
    this.updateAggregatedMetrics(metrics);
  }

  // Batch process feedback for deeper learning
  processBatchFeedback() {
    if (this.processingQueue.length === 0) return;

    const batch = [...this.processingQueue];
    this.processingQueue = [];

    // Perform batch analysis
    this.analyzeFeedbackPatterns(batch);
    this.updateModelWeights(batch);
    this.identifyImprovementOpportunities(batch);

    console.log(`Processed batch of ${batch.length} feedback items`);
  }

  // Analyze patterns in feedback
  analyzeFeedbackPatterns(feedbackBatch) {
    const patterns = {
      accuracyTrends: this.analyzeAccuracyTrends(feedbackBatch),
      commonIssues: this.identifyCommonIssues(feedbackBatch),
      userSegments: this.analyzeUserSegments(feedbackBatch),
      temporalPatterns: this.analyzeTemporalPatterns(feedbackBatch)
    };

    // Store pattern analysis for future use
    this.storeFeedbackPatterns(patterns);

    return patterns;
  }

  // Analyze accuracy trends over time
  analyzeAccuracyTrends(feedbackBatch) {
    const trends = {
      overall: 0,
      byQuestionCount: {},
      byRecommendationType: {},
      recent: 0
    };

    feedbackBatch.forEach(feedback => {
      const accuracyScore = this.mapAccuracyToScore(feedback.accuracy);

      // Overall trend
      trends.overall += accuracyScore;

      // By question count
      const qCount = feedback.profileContext?.totalQuestions || 0;
      if (!trends.byQuestionCount[qCount]) {
        trends.byQuestionCount[qCount] = { total: 0, count: 0 };
      }
      trends.byQuestionCount[qCount].total += accuracyScore;
      trends.byQuestionCount[qCount].count += 1;

      // Recent feedback (last 24 hours)
      if (feedback.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
        trends.recent += accuracyScore;
      }
    });

    // Calculate averages
    trends.overall /= feedbackBatch.length;
    Object.keys(trends.byQuestionCount).forEach(qCount => {
      const data = trends.byQuestionCount[qCount];
      trends.byQuestionCount[qCount] = data.total / data.count;
    });

    return trends;
  }

  // Identify common issues from feedback
  identifyCommonIssues(feedbackBatch) {
    const issues = {};

    feedbackBatch.forEach(feedback => {
      if (feedback.accuracy === 'not_accurate' || feedback.accuracy === 'somewhat_accurate') {
        // Extract issues from detailed comments
        if (feedback.detailedComments) {
          const extractedIssues = this.extractIssuesFromComments(feedback.detailedComments);
          extractedIssues.forEach(issue => {
            issues[issue] = (issues[issue] || 0) + 1;
          });
        }

        // Track specific dimension issues
        if (feedback.dimensionFeedback) {
          Object.entries(feedback.dimensionFeedback).forEach(([dimension, rating]) => {
            if (rating < 3) { // Poor rating
              const issueKey = `${dimension}_inaccurate`;
              issues[issueKey] = (issues[issueKey] || 0) + 1;
            }
          });
        }
      }
    });

    // Sort by frequency
    return Object.entries(issues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [issue, count]) => {
        obj[issue] = count;
        return obj;
      }, {});
  }

  // Extract issues from text comments using keyword analysis
  extractIssuesFromComments(comments) {
    const issues = [];
    const lowerComments = comments.toLowerCase();

    // Common issue patterns
    const issuePatterns = {
      'skill_level_wrong': ['too advanced', 'too beginner', 'skill level', 'not my level'],
      'course_style_wrong': ['wrong course', 'don\'t like', 'course type', 'style'],
      'budget_wrong': ['too expensive', 'too cheap', 'budget', 'price'],
      'social_wrong': ['too social', 'not social', 'group size', 'alone'],
      'amenities_wrong': ['amenities', 'facilities', 'clubhouse', 'restaurant']
    };

    Object.entries(issuePatterns).forEach(([issue, keywords]) => {
      if (keywords.some(keyword => lowerComments.includes(keyword))) {
        issues.push(issue);
      }
    });

    return issues;
  }

  // Analyze different user segments
  analyzeUserSegments(feedbackBatch) {
    const segments = {
      highEngagement: [],
      lowEngagement: [],
      accurateProfiles: [],
      inaccurateProfiles: []
    };

    feedbackBatch.forEach(feedback => {
      const accuracyScore = this.mapAccuracyToScore(feedback.accuracy);
      const engagement = this.calculateEngagement(feedback);

      if (engagement > 0.8) segments.highEngagement.push(feedback);
      if (engagement < 0.3) segments.lowEngagement.push(feedback);
      if (accuracyScore > 0.8) segments.accurateProfiles.push(feedback);
      if (accuracyScore < 0.5) segments.inaccurateProfiles.push(feedback);
    });

    return segments;
  }

  // Analyze temporal patterns
  analyzeTemporalPatterns(feedbackBatch) {
    const patterns = {
      timeOfDay: {},
      dayOfWeek: {},
      responseDelays: []
    };

    feedbackBatch.forEach(feedback => {
      const date = new Date(feedback.timestamp);

      // Time of day analysis
      const hour = date.getHours();
      const timeSlot = hour < 6 ? 'night' :
                     hour < 12 ? 'morning' :
                     hour < 18 ? 'afternoon' : 'evening';

      patterns.timeOfDay[timeSlot] = (patterns.timeOfDay[timeSlot] || 0) + 1;

      // Day of week analysis
      const dayOfWeek = date.getDay();
      patterns.dayOfWeek[dayOfWeek] = (patterns.dayOfWeek[dayOfWeek] || 0) + 1;

      // Response delay (if available)
      if (feedback.responseDelay) {
        patterns.responseDelays.push(feedback.responseDelay);
      }
    });

    return patterns;
  }

  // Update ML model weights based on feedback
  updateModelWeights(feedbackBatch) {
    const accuracyByFeature = this.calculateFeatureAccuracy(feedbackBatch);

    // Adjust weights for different recommendation types
    Object.entries(accuracyByFeature).forEach(([feature, accuracy]) => {
      if (accuracy < 0.6) {
        // Reduce weight for poorly performing features
        this.adjustFeatureWeight(feature, 0.9);
      } else if (accuracy > 0.8) {
        // Increase weight for well performing features
        this.adjustFeatureWeight(feature, 1.1);
      }
    });
  }

  // Calculate accuracy by feature
  calculateFeatureAccuracy(feedbackBatch) {
    const featureAccuracy = {};

    feedbackBatch.forEach(feedback => {
      if (feedback.recommendationFeedback) {
        Object.entries(feedback.recommendationFeedback).forEach(([feature, rating]) => {
          if (!featureAccuracy[feature]) {
            featureAccuracy[feature] = { total: 0, count: 0 };
          }
          featureAccuracy[feature].total += rating;
          featureAccuracy[feature].count += 1;
        });
      }
    });

    // Calculate averages
    Object.keys(featureAccuracy).forEach(feature => {
      const data = featureAccuracy[feature];
      featureAccuracy[feature] = data.total / data.count;
    });

    return featureAccuracy;
  }

  // Identify improvement opportunities
  identifyImprovementOpportunities(feedbackBatch) {
    const opportunities = [];

    // Low accuracy areas
    const accuracyTrends = this.analyzeAccuracyTrends(feedbackBatch);
    Object.entries(accuracyTrends.byQuestionCount).forEach(([qCount, accuracy]) => {
      if (accuracy < 0.6) {
        opportunities.push({
          type: 'question_sequence',
          issue: `Low accuracy with ${qCount} questions`,
          severity: 1 - accuracy,
          suggestion: 'Optimize question selection for this length'
        });
      }
    });

    // Common issues
    const commonIssues = this.identifyCommonIssues(feedbackBatch);
    Object.entries(commonIssues).forEach(([issue, frequency]) => {
      if (frequency > feedbackBatch.length * 0.2) { // More than 20% of users
        opportunities.push({
          type: 'systematic_issue',
          issue: issue,
          severity: frequency / feedbackBatch.length,
          suggestion: this.getSuggestionForIssue(issue)
        });
      }
    });

    // Store improvement opportunities
    this.storeImprovementOpportunities(opportunities);

    return opportunities;
  }

  // Helper methods
  mapAccuracyToScore(accuracy) {
    const mapping = {
      'very_accurate': 1.0,
      'mostly_accurate': 0.8,
      'somewhat_accurate': 0.5,
      'not_accurate': 0.2
    };
    return mapping[accuracy] || 0.5;
  }

  calculateSatisfaction(feedbackData) {
    let satisfaction = this.mapAccuracyToScore(feedbackData.accuracy);

    if (feedbackData.wouldRecommend) satisfaction += 0.2;
    if (feedbackData.helpful) satisfaction += 0.1;

    return Math.min(1.0, satisfaction);
  }

  calculateEngagement(feedbackData) {
    let engagement = 0.5; // Base engagement

    if (feedbackData.detailedComments && feedbackData.detailedComments.length > 0) {
      engagement += 0.3;
    }

    if (feedbackData.dimensionFeedback) {
      engagement += 0.2;
    }

    if (feedbackData.responseTime && feedbackData.responseTime > 10000) { // Took time to respond
      engagement += 0.1;
    }

    return Math.min(1.0, engagement);
  }

  getDeviceInfo() {
    return {
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
  }

  getUserAgent() {
    return navigator.userAgent.substring(0, 100); // Truncate for privacy
  }

  updateRecommendationType(recType, accuracy, weight) {
    // Implementation would update specific recommendation type accuracy
    console.log(`Updating ${recType} accuracy: ${accuracy} with weight ${weight}`);
  }

  updateAggregatedMetrics(metrics) {
    // Implementation would update running averages of metrics
    console.log('Updating aggregated metrics:', metrics);
  }

  adjustFeatureWeight(feature, multiplier) {
    // Implementation would adjust ML model weights
    console.log(`Adjusting ${feature} weight by ${multiplier}`);
  }

  storeFeedbackPatterns(patterns) {
    // Store patterns for analysis dashboard
    localStorage.setItem('golf_profiler_feedback_patterns', JSON.stringify({
      timestamp: Date.now(),
      patterns
    }));
  }

  storeImprovementOpportunities(opportunities) {
    // Store improvement opportunities for review
    localStorage.setItem('golf_profiler_improvement_opportunities', JSON.stringify({
      timestamp: Date.now(),
      opportunities
    }));
  }

  getSuggestionForIssue(issue) {
    const suggestions = {
      'skill_level_wrong': 'Add more skill assessment questions or refine scoring algorithm',
      'course_style_wrong': 'Improve course style recommendation logic',
      'budget_wrong': 'Better calibrate budget level predictions',
      'social_wrong': 'Enhance social preference detection',
      'amenities_wrong': 'Refine amenity importance weighting'
    };

    return suggestions[issue] || 'Analyze user patterns and refine algorithms';
  }

  // Public interface for different feedback types
  collectQuickFeedback(sessionId, rating) {
    return this.collectProfileFeedback(sessionId, {
      type: 'quick',
      accuracy: rating,
      responseTime: Date.now()
    });
  }

  collectDetailedFeedback(sessionId, feedbackForm) {
    return this.collectProfileFeedback(sessionId, {
      type: 'detailed',
      ...feedbackForm,
      responseTime: Date.now()
    });
  }

  collectDimensionFeedback(sessionId, dimensionRatings) {
    return this.collectProfileFeedback(sessionId, {
      type: 'dimension',
      dimensionFeedback: dimensionRatings,
      accuracy: this.calculateOverallAccuracyFromDimensions(dimensionRatings),
      responseTime: Date.now()
    });
  }

  calculateOverallAccuracyFromDimensions(dimensionRatings) {
    const avgRating = Object.values(dimensionRatings).reduce((a, b) => a + b, 0) / Object.values(dimensionRatings).length;

    if (avgRating >= 4.5) return 'very_accurate';
    if (avgRating >= 3.5) return 'mostly_accurate';
    if (avgRating >= 2.5) return 'somewhat_accurate';
    return 'not_accurate';
  }

  // Analytics and reporting
  getFeedbackAnalytics() {
    const allFeedback = this.dataManager.getFeedbacks();

    return {
      totalFeedback: allFeedback.length,
      averageAccuracy: this.calculateAverageAccuracy(allFeedback),
      feedbackTrends: this.calculateFeedbackTrends(allFeedback),
      topIssues: this.getTopIssues(allFeedback),
      improvementOpportunities: this.getStoredImprovementOpportunities()
    };
  }

  calculateAverageAccuracy(feedbackList) {
    if (feedbackList.length === 0) return 0;

    const totalAccuracy = feedbackList.reduce((sum, feedback) =>
      sum + this.mapAccuracyToScore(feedback.accuracy), 0
    );

    return totalAccuracy / feedbackList.length;
  }

  calculateFeedbackTrends(feedbackList) {
    // Calculate trends over time
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const recent = feedbackList.filter(f => f.timestamp > oneWeekAgo);
    const older = feedbackList.filter(f => f.timestamp <= oneWeekAgo && f.timestamp > oneMonthAgo);

    return {
      recentAccuracy: this.calculateAverageAccuracy(recent),
      previousAccuracy: this.calculateAverageAccuracy(older),
      trend: recent.length > 0 && older.length > 0 ?
        this.calculateAverageAccuracy(recent) - this.calculateAverageAccuracy(older) : 0
    };
  }

  getTopIssues(feedbackList) {
    const issues = {};

    feedbackList.forEach(feedback => {
      if (feedback.accuracy === 'not_accurate' || feedback.accuracy === 'somewhat_accurate') {
        if (feedback.detailedComments) {
          const extractedIssues = this.extractIssuesFromComments(feedback.detailedComments);
          extractedIssues.forEach(issue => {
            issues[issue] = (issues[issue] || 0) + 1;
          });
        }
      }
    });

    return Object.entries(issues)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }

  getStoredImprovementOpportunities() {
    try {
      const stored = localStorage.getItem('golf_profiler_improvement_opportunities');
      return stored ? JSON.parse(stored).opportunities : [];
    } catch {
      return [];
    }
  }
}

export default FeedbackCollector;
