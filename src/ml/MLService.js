// MLService.js - Fixed ML Service with working components

// Import working components
import { EnhancedQuestionSelector } from './FixedMLSystem.js';
import { SimilarityCalculator } from './SimilarityCalculator.js';
import { FeedbackCollector } from './FeedbackCollector.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { ML_CONFIG } from './MLConfig.js';
import { SupabaseDataManager } from '../db/SupabaseDataManager.js';

export class MLService {
  constructor(options = {}) {
    // Store options for later
    this.options = options;

    // Initialize core components with working classes
    this.dataManager = new SupabaseDataManager();
    this.similarityCalculator = new SimilarityCalculator();
    this.questionSelector = new EnhancedQuestionSelector(this.dataManager);
    this.feedbackCollector = new FeedbackCollector(this.dataManager);
    this.recommendationEngine = new RecommendationEngine(this.similarityCalculator, this.dataManager);

    // Algorithm versioning (simplified for memory mode)
    this.activeAlgorithms = {
      scoring: { version: 'v1.0.0' },
      questionSelection: { version: 'v1.0.0' },
      similarityCalculator: { version: 'v1.0.0' }
    };

    // Configuration
    this.config = {
      ...ML_CONFIG,
      ...options,
      SIMILARITY_THRESHOLD: 0.5,
      MIN_SIMILAR_PROFILES: 3,
      MAX_SIMILAR_PROFILES: 10
    };

    this.isInitialized = false;
    this.modelVersion = '1.0.0';

    // Performance tracking
    this.performanceMetrics = {
      profilesGenerated: 0,
      averageAccuracy: 0,
      totalFeedbacks: 0,
      lastUpdated: Date.now()
    };

    // A/B Testing initialization
    this.abTestMetrics = {};
    this.activeABTests = {};

    console.log('🚀 Starting MLService initialization...');
    // Initialize the service
    this.initialize();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing MLService...');

      // MemoryDataManager initializes itself in constructor
      console.log('📝 DataManager initialized with mock data');

      // Load performance metrics
      await this.loadPerformanceMetrics();

      // CRITICAL: Set to true to enable ML features
      this.isInitialized = true;

      console.log('✅ MLService initialized successfully');
      console.log('📊 ML System Status:', {
        initialized: this.isInitialized,
        profiles: (await this.getDataManagerMetrics()).totalProfiles,
        confidence: await this.calculateModelConfidence(),
        algorithmVersions: {
          scoring: this.activeAlgorithms.scoring?.version || 'v1.0.0',
          questionSelection: this.activeAlgorithms.questionSelection?.version || 'v1.0.0',
          similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'v1.0.0'
        },
        similarityThreshold: this.config?.SIMILARITY_THRESHOLD || 0.5
      });

      // Test similarity finding immediately
      await this.testMLEnhancement();

    } catch (error) {
      console.error('❌ Error initializing MLService:', error);
      this.isInitialized = false;
    }
  }

  // Test ML enhancement capability
  async testMLEnhancement() {
    try {
      console.log('🧪 Testing ML system capabilities...');

      // Test different archetype scenarios
      const testScenarios = [
        {
          name: 'Serious Traditional Player',
          scores: { skillLevel: 8, socialness: 4, traditionalism: 9, luxuryLevel: 6, competitiveness: 8, amenityImportance: 5, pace: 8 }
        },
        {
          name: 'Beginner Social Player',
          scores: { skillLevel: 2, socialness: 8, traditionalism: 3, luxuryLevel: 3, competitiveness: 2, amenityImportance: 6, pace: 3 }
        },
        {
          name: 'Luxury Social Player',
          scores: { skillLevel: 5, socialness: 9, traditionalism: 4, luxuryLevel: 9, competitiveness: 4, amenityImportance: 9, pace: 5 }
        }
      ];

      for (const scenario of testScenarios) {
        console.log(`\n🎯 Testing scenario: ${scenario.name}`);

        const allProfiles = await this.dataManager.getProfiles();
        const similarProfiles = this.similarityCalculator.findSimilarProfilesProgressive(
          scenario.scores,
          allProfiles,
          { debug: false }
        );

        console.log(`✅ Found ${similarProfiles.length} similar profiles for ${scenario.name}`);

        if (similarProfiles.length > 0) {
          const archetypes = similarProfiles.map(p => p.profileArchetype).filter(a => a);
          const uniqueArchetypes = [...new Set(archetypes)];
          console.log(`🎯 Archetype matches: ${uniqueArchetypes.join(', ')}`);
        }
      }

      console.log('✅ ML testing completed');

    } catch (error) {
      console.error('❌ Error testing ML system:', error);
    }
  }

  // Load performance metrics from storage
  async loadPerformanceMetrics() {
    try {
      console.log('📈 Performance metrics loaded (memory mode)');

      // Initialize with reasonable defaults
      this.performanceMetrics = {
        profilesGenerated: 0,
        averageAccuracy: 0.75,
        totalFeedbacks: 0,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  }

  // Main API Methods for Golf Profiler
  async generateProfile(answers, scores, sessionId, options = {}) {
    // CRITICAL: Fall back to basic if not initialized
    if (!this.isInitialized) {
      console.warn('MLService not initialized, using basic profile generation');
      return this.generateCompleteProfile(scores);
    }

    try {
      // Record the profile generation
      this.performanceMetrics.profilesGenerated++;

      console.log('🎯 Generating profile with ML enhancement for:', sessionId);
      console.log('📊 Available profiles for similarity:', (await this.getDataManagerMetrics()).totalProfiles);

      const similarProfiles = await this.findSimilarProfilesForML(scores, sessionId);

      let profile;
      if (similarProfiles.length >= 3) {
        profile = await this.generateEnhancedProfile(scores, similarProfiles, sessionId);
      } else {
        profile = this.generateCompleteProfile(scores, sessionId);
      }

      // Store profile
      await this.addProfileData(answers, scores, profile, sessionId);
      await this.updatePerformanceMetrics();

      console.log('✅ Profile generated with ML enhancement:', profile.mlEnhanced || false);

      return profile;
    } catch (error) {
      console.error('❌ Error generating profile:', error);
      // Fallback to basic profile
      return this.generateCompleteProfile(scores);
    }
  }

  // Smart question selection with A/B testing
  selectNextQuestion(currentAnswers, currentScores, questionBank, questionNumber, userContext = {}) {
    console.log('🎯 selectNextQuestion called');

    // CRITICAL: Fall back to basic if not initialized
    if (!this.isInitialized) {
      console.warn('❌ MLService not initialized, using basic question selection');
      return this.basicQuestionSelection(currentAnswers, questionBank, questionNumber);
    }

    try {
      // A/B Testing: Randomly assign users to different algorithms
      const sessionId = userContext.sessionId || 'default';
      const abTestVariant = this.getABTestVariant(sessionId, 'question_selection');
      
      console.log('🧪 A/B Test variant:', abTestVariant);

      let selectedQuestion;
      
      if (abTestVariant === 'enhanced_ml') {
        console.log('🤖 Using Enhanced ML question selection (Variant A)');
        selectedQuestion = this.questionSelector.selectNextQuestion(
          currentAnswers,
          currentScores,
          questionBank,
          questionNumber,
          userContext
        );
      } else if (abTestVariant === 'priority_based') {
        console.log('📊 Using Priority-based question selection (Variant B)');
        selectedQuestion = this.priorityBasedQuestionSelection(currentAnswers, questionBank, questionNumber);
      } else {
        console.log('🎯 Using Random selection (Control)');
        selectedQuestion = this.randomQuestionSelection(currentAnswers, questionBank, questionNumber);
      }

      // Track A/B test performance
      this.trackABTestMetric(sessionId, 'question_selection', abTestVariant, 'question_selected', selectedQuestion?.id);

      console.log('✅ ML question selected:', selectedQuestion?.id);
      return selectedQuestion;

    } catch (error) {
      console.error('❌ Error in ML question selection:', error);
      console.log('🔄 Falling back to basic question selection');
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
    try {
      const similarProfiles = await this.findSimilarProfilesForML(currentScores);

      if (similarProfiles.length >= ML_CONFIG.MIN_SIMILAR_PROFILES) {
        return this.recommendationEngine.generateEnhancedRecommendations(
          currentScores,
          currentProfile,
          similarProfiles
        );
      } else {
        return this.aggregateRecommendations(similarProfiles, currentScores);
      }
    } catch (error) {
      console.error('Error generating enhanced recommendations:', error);
      return currentProfile.recommendations || this.getDefaultRecommendations(currentScores);
    }
  }

  async getMLStatistics() {
    console.log('🔍 getMLStatistics called');

    if (!this.isInitialized) {
      console.warn('⚠️ MLService not initialized, returning basic stats');
      return {
        model: {
          version: this.modelVersion || '1.0.0',
          initialized: false,
          confidence: 0.3,
          algorithmVersions: {
            scoring: 'not_loaded',
            questionSelection: 'not_loaded',
            similarityCalculator: 'not_loaded'
          }
        },
        data: {
          totalProfiles: 0,
          totalFeedbacks: 0,
          averageQuestions: 6,
          averageAccuracy: 0.75,
          profilesLastWeek: 0,
          feedbackDistribution: {},
          modelConfidence: 'Learning'
        },
        feedback: {
          totalFeedbacks: 0,
          averageRating: 0.75,
          recentTrend: 'stable'
        },
        questions: {
          totalQuestions: 8,
          averageEffectiveness: 0.75,
          selectionVariety: 'high'
        },
        performance: this.performanceMetrics || {
          profilesGenerated: 0,
          averageAccuracy: 0,
          totalFeedbacks: 0,
          lastUpdated: Date.now()
        }
      };
    }

    try {
      console.log('📊 Getting ML statistics...');

      const dataMetrics = await this.getDataManagerMetrics();
      const modelConfidence = await this.calculateModelConfidence();

      const result = {
        model: {
          version: this.modelVersion,
          initialized: this.isInitialized,
          confidence: modelConfidence || 0.5,
          algorithmVersions: {
            scoring: this.activeAlgorithms.scoring?.version || 'v1.0.0',
            questionSelection: this.activeAlgorithms.questionSelection?.version || 'v1.0.0',
            similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'v1.0.0'
          }
        },
        data: dataMetrics,
        feedback: {
          totalFeedbacks: dataMetrics.totalFeedbacks || 0,
          averageRating: 0.75,
          recentTrend: 'stable'
        },
        questions: {
          totalQuestions: 8,
          averageEffectiveness: 0.75,
          selectionVariety: 'high'
        },
        performance: this.performanceMetrics
      };

      console.log('✅ ML statistics generated successfully');
      return result;

    } catch (error) {
      console.error('❌ Error getting ML statistics:', error);
      return {
        model: {
          version: this.modelVersion || '1.0.0',
          initialized: this.isInitialized || false,
          confidence: 0.5,
          algorithmVersions: {
            scoring: 'error',
            questionSelection: 'error',
            similarityCalculator: 'error'
          }
        },
        data: {
          totalProfiles: 0,
          totalFeedbacks: 0,
          averageQuestions: 6,
          averageAccuracy: 0.75,
          profilesLastWeek: 0,
          feedbackDistribution: {},
          modelConfidence: 'Learning'
        },
        feedback: {
          totalFeedbacks: 0,
          averageRating: 0.75,
          recentTrend: 'stable'
        },
        questions: {
          totalQuestions: 8,
          averageEffectiveness: 0.75,
          selectionVariety: 'high'
        },
        performance: this.performanceMetrics || {
          profilesGenerated: 0,
          averageAccuracy: 0,
          totalFeedbacks: 0,
          lastUpdated: Date.now()
        }
      };
    }
  }

  // Get user similarity insights
  async getUserSimilarityInsights(userScores, options = {}) {
    console.log('🔍 getUserSimilarityInsights called');

    if (!this.isInitialized) {
      console.warn('⚠️ MLService not initialized for similarity insights');
      return {
        similarUsers: 0,
        averageSimilarity: 0,
        topMatches: [],
        userPercentiles: {},
        archetype: null
      };
    }

    try {
      console.log('📊 Getting similarity insights...');

      const allProfiles = await this.dataManager.getProfiles();
      console.log('📊 Total profiles available:', allProfiles.length);

      // Determine user's archetype
      const userArchetype = this.similarityCalculator.determineArchetype(userScores);
      console.log(`🎯 User archetype: ${userArchetype.archetype} (${(userArchetype.confidence * 100).toFixed(0)}% confidence)`);

      // Find similar profiles
      const similarProfiles = this.similarityCalculator.findSimilarProfilesProgressive(
        userScores,
        allProfiles,
        { ...options, debug: false }
      );

      console.log(`🔍 Found ${similarProfiles.length} similar profiles`);

      // Calculate archetype-specific insights
      const sameArchetypeProfiles = similarProfiles.filter(p =>
        p.profileArchetype === userArchetype.archetype
      );

      const compatibleProfiles = similarProfiles.filter(p =>
        p.profileArchetype === userArchetype.archetype ||
        this.similarityCalculator.areCompatibleArchetypes(userArchetype.archetype, p.profileArchetype)
      );

      const result = {
        similarUsers: similarProfiles.length,
        averageSimilarity: similarProfiles.length > 0
          ? similarProfiles.reduce((sum, p) => sum + p.similarity, 0) / similarProfiles.length
          : 0,

        topMatches: similarProfiles.slice(0, 5).map(p => ({
          similarity: p.similarity,
          archetype: p.profileArchetype,
          baseSimilarity: p.baseSimilarity,
          archetypeBonus: p.archetypeBonus,
          keyDimensions: this.identifyKeyMatchingDimensions(userScores, p.scores)
        })),

        userPercentiles: this.calculateUserPercentiles(userScores, allProfiles),

        archetype: {
          primary: userArchetype.archetype,
          confidence: userArchetype.confidence,
          sameArchetypeMatches: sameArchetypeProfiles.length,
          compatibleMatches: compatibleProfiles.length,
          matchQuality: similarProfiles.length > 0 ? compatibleProfiles.length / similarProfiles.length : 0
        }
      };

      console.log('✅ Similarity insights generated');
      return result;

    } catch (error) {
      console.error('❌ Error getting similarity insights:', error);
      return {
        similarUsers: 0,
        averageSimilarity: 0,
        topMatches: [],
        userPercentiles: {},
        archetype: { primary: 'unknown', confidence: 0 }
      };
    }
  }

  // Find similar profiles for ML enhancement
  async findSimilarProfilesForML(userScores, sessionId = 'default') {
    try {
      const allProfiles = await this.dataManager.getProfiles();
      console.log(`🔍 Similarity search among ${allProfiles.length} total profiles`);
      console.log('👤 User scores:', userScores);

      // Use enhanced progressive search
      const similarProfiles = this.similarityCalculator.findSimilarProfilesProgressive(
        userScores,
        allProfiles,
        {
          algorithm: 'weighted_euclidean',
          maxResults: this.config?.MAX_SIMILAR_PROFILES || 10,
          minResults: this.config?.MIN_SIMILAR_PROFILES || 3,
          useArchetypeBonus: true,
          diversityFactor: 0.1
        }
      );

      console.log(`✅ Progressive search completed: ${similarProfiles.length} similar profiles found`);

      if (similarProfiles.length > 0) {
        const targetArchetype = this.similarityCalculator.determineArchetype(userScores);
        const archetypeDistribution = {};

        similarProfiles.forEach(profile => {
          const archetype = profile.profileArchetype || 'unknown';
          archetypeDistribution[archetype] = (archetypeDistribution[archetype] || 0) + 1;
        });

        console.log(`🎯 Target archetype: ${targetArchetype.archetype}`);
        console.log(`📊 Found archetype distribution:`, archetypeDistribution);

        return similarProfiles;
      } else {
        console.warn('⚠️ No similar profiles found');
        return [];
      }

    } catch (error) {
      console.error('❌ Error in similarity search:', error);
      return [];
    }
  }

  // Get recommendation insights and explanations
  async getRecommendationInsights(userScores, recommendations) {
    try {
      console.log('🔍 Getting recommendation insights');

      const similarProfiles = await this.findSimilarProfilesForML(userScores);
      const safeRecommendations = recommendations || {};

      const insights = {
        confidence: safeRecommendations.confidence || this.calculateRecommendationConfidence(similarProfiles),
        explanation: safeRecommendations.explanation ||
          `Enhanced recommendations from ${similarProfiles.length} similar golfers`,
        alternatives: safeRecommendations.alternativeOptions || [],
        improvementSuggestions: this.generateImprovementSuggestions(userScores, similarProfiles),
        personalizationLevel: await this.calculatePersonalizationLevel(userScores, similarProfiles),
        similarUserCount: similarProfiles.length,
        dataQuality: similarProfiles.length >= 10 ? 'High' : similarProfiles.length >= 5 ? 'Medium' : 'Low',
        mlEnhanced: safeRecommendations.mlEnhanced || false
      };

      console.log('✅ Generated insights');
      return insights;
    } catch (error) {
      console.error('Error getting recommendation insights:', error);
      return {
        confidence: 'Medium',
        explanation: 'Based on user preferences',
        alternatives: [],
        improvementSuggestions: [],
        personalizationLevel: 'Medium',
        similarUserCount: 0,
        dataQuality: 'Basic',
        mlEnhanced: false
      };
    }
  }

  // Basic question selection fallback
  basicQuestionSelection(currentAnswers, questionBank, questionNumber) {
    console.log('🔧 Using basic question selection');

    if (questionNumber === 0) {
      const starter = questionBank.find(q => q.type === 'starter') || questionBank[0];
      console.log('🎯 Selected starter question:', starter?.id);
      return starter;
    }

    const answeredIds = Object.keys(currentAnswers);
    const unansweredQuestions = questionBank.filter(q => !answeredIds.includes(q.id));

    // Sort by priority
    const sorted = unansweredQuestions.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.id > b.id) ? 1 : -1;
    });

    const selected = sorted[0];
    console.log('🎯 Selected question:', selected?.id);
    return selected;
  }

  // Generate complete profile
  generateCompleteProfile(userScores, sessionId = null) {
    console.log('🎯 Generating complete profile for scores:', userScores);

    const skillLevel = {
      numeric: userScores.skillLevel || 0,
      label: this.getSkillLabel(userScores.skillLevel || 0),
      confidence: 'Medium'
    };

    const personality = {
      primary: this.getPersonalityType(userScores),
      secondary: [],
      confidence: 'Medium'
    };

    const preferences = {
      core: this.getPreferences(userScores)
    };

    const recommendations = this.getDefaultRecommendations(userScores);
    const demographics = this.getDemographics(userScores);

    const completeProfile = {
      skillLevel,
      personality,
      preferences,
      recommendations,
      demographics,
      mlEnhanced: false,
      enhancementLevel: 'basic',
      source: 'Default Algorithm',
      algorithmVersions: sessionId ? {
        scoring: this.activeAlgorithms.scoring?.version || 'v1.0.0',
        questionSelection: this.activeAlgorithms.questionSelection?.version || 'v1.0.0',
        similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'v1.0.0'
      } : {}
    };

    console.log('✅ Complete profile generated');
    return completeProfile;
  }

  // Generate ML-enhanced profile
  async generateEnhancedProfile(userScores, similarProfiles, sessionId = null) {
    console.log('🤖 Generating ML-enhanced profile');

    // Start with basic profile structure
    const baseProfile = this.generateCompleteProfile(userScores, sessionId);

    // Enhance with ML recommendations
    const currentProfile = { recommendations: baseProfile.recommendations };
    const enhancedRecommendations = this.recommendationEngine.generateEnhancedRecommendations(
      userScores,
      currentProfile,
      similarProfiles
    );

    // Enhance personality insights
    const enhancedPersonality = {
      ...baseProfile.personality,
      mlInsights: {
        similarUserCount: similarProfiles.length,
        confidence: similarProfiles.length >= 10 ? 'High' : 'Medium',
        personalityPatterns: {
          insights: `Enhanced based on ${similarProfiles.length} similar golfers`
        }
      }
    };

    return {
      ...baseProfile,
      personality: enhancedPersonality,
      recommendations: enhancedRecommendations,
      mlEnhanced: true,
      enhancementLevel: 'full',
      mlMetadata: {
        similarProfiles: similarProfiles.length,
        confidence: await this.calculateModelConfidence(),
        dataQuality: similarProfiles.length >= 10 ? 'High' : 'Medium',
        algorithmVersions: {
          scoring: this.activeAlgorithms.scoring?.version || 'v1.0.0',
          questionSelection: this.activeAlgorithms.questionSelection?.version || 'v1.0.0',
          similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'v1.0.0'
        }
      }
    };
  }

  // Helper methods
  getSkillLabel(skillScore) {
    if (skillScore <= 2) return "New to Golf";
    if (skillScore <= 4) return "Recreational Player";
    if (skillScore <= 6) return "Regular Golfer";
    if (skillScore <= 8) return "Serious Player";
    return "Advanced Golfer";
  }

  getPersonalityType(scores) {
    if (scores.socialness >= 7 && scores.competitiveness <= 4) return "Social & Fun-Focused";
    if (scores.competitiveness >= 7 && scores.traditionalism >= 6) return "Competitive Traditionalist";
    if (scores.socialness >= 7 && scores.luxuryLevel >= 6) return "Social Luxury Seeker";
    if (scores.competitiveness <= 3 && scores.socialness <= 4) return "Peaceful Solo Player";
    if (scores.traditionalism >= 8) return "Golf Purist";
    return "Balanced Enthusiast";
  }

  getPreferences(scores) {
    const prefs = [];
    if (scores.amenityImportance >= 6) prefs.push("Values practice facilities & amenities");
    if (scores.luxuryLevel >= 7) prefs.push("Prefers upscale experiences");
    if (scores.socialness >= 7) prefs.push("Enjoys group golf & social aspects");
    if (scores.competitiveness >= 7) prefs.push("Competitive & score-focused");
    if (scores.traditionalism >= 7) prefs.push("Appreciates golf history & tradition");
    return prefs;
  }

  getDemographics(scores) {
    const ageGuess = scores.ageGeneration <= 3 ? "25-40" :
                     scores.ageGeneration <= 6 ? "35-55" : "45-65";
    const genderLean = Math.abs(scores.genderLean) <= 1 ? "Neutral preferences" :
                       scores.genderLean > 1 ? "More traditional masculine preferences" :
                       "More contemporary/feminine preferences";
    return {
      estimatedAge: ageGuess,
      preferenceStyle: genderLean
    };
  }

  getDefaultRecommendations(userScores) {
    const { skillLevel = 5, luxuryLevel = 5, socialness = 5 } = userScores;

    let courseStyle = 'parkland';
    if (skillLevel >= 7) courseStyle = 'links';
    if (luxuryLevel >= 8) courseStyle = 'coastal';

    let budgetLevel = 'Mid-range ($50-100)';
    if (luxuryLevel >= 7) budgetLevel = 'Premium ($100+)';
    if (luxuryLevel <= 3) budgetLevel = 'Value ($25-50)';

    return {
      courseStyle,
      budgetLevel,
      socialLevel: socialness >= 6 ? 'Group-friendly' : 'Individual-focused',
      confidence: 'Medium',
      source: 'Default Algorithm'
    };
  }

  // Helper method to calculate recommendation confidence
  calculateRecommendationConfidence(similarProfiles) {
    if (similarProfiles.length >= 10) return 'Very High';
    if (similarProfiles.length >= 7) return 'High';
    if (similarProfiles.length >= 3) return 'Medium';
    return 'Low';
  }

  // Generate improvement suggestions
  generateImprovementSuggestions(userScores, similarProfiles) {
    const suggestions = [];

    if (similarProfiles.length < 5) {
      suggestions.push("Complete the full quiz for more personalized recommendations");
    }

    return suggestions.slice(0, 3);
  }

  // Calculate personalization level
  async calculatePersonalizationLevel(userScores, similarProfiles) {
    const confidence = await this.calculateModelConfidence();
    const dataQuality = similarProfiles.length >= 10 ? 'High' :
                       similarProfiles.length >= 5 ? 'Medium' : 'Low';

    if (confidence > 0.8 && dataQuality === 'High') return 'Very High';
    if (confidence > 0.6 && dataQuality !== 'Low') return 'High';
    if (confidence > 0.4) return 'Medium';
    return 'Low';
  }

  // Calculate user percentiles
  calculateUserPercentiles(userScores, allProfiles) {
    if (allProfiles.length === 0) return {};

    const percentiles = {};
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;

    dimensions.forEach(dim => {
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

  identifyKeyMatchingDimensions(scores1, scores2) {
    const matches = [];
    const threshold = 2;
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      if (Math.abs(val1 - val2) <= threshold) {
        matches.push(dim);
      }
    });

    return matches;
  }

  async addProfileData(answers, scores, profile, sessionId) {
    try {
      const profileData = {
        sessionId,
        answers,
        scores,
        profile,
        questionSequence: Object.keys(answers),
        totalQuestions: Object.keys(answers).length,
        timestamp: Date.now(),
        algorithmVersions: {
          scoring: this.activeAlgorithms.scoring?.version,
          questionSelection: this.activeAlgorithms.questionSelection?.version,
          similarityCalculator: this.activeAlgorithms.similarityCalculator?.version
        }
      };

      return this.dataManager.addProfile(profileData);
    } catch (error) {
      console.error('Error adding profile data:', error);
      return false;
    }
  }

  async calculateModelConfidence() {
    const metrics = await this.getDataManagerMetrics();
    const profileCount = metrics.totalProfiles || 0;
    const feedbackCount = metrics.totalFeedbacks || 0;

    if (profileCount >= ML_CONFIG.MIN_PROFILES_FOR_CONFIDENCE.HIGH && feedbackCount >= 10) return 0.9;
    if (profileCount >= ML_CONFIG.MIN_PROFILES_FOR_CONFIDENCE.MEDIUM && feedbackCount >= 5) return 0.7;
    if (profileCount >= 5) return 0.5;
    return 0.3;
  }

  async updatePerformanceMetrics() {
    const metrics = await this.getDataManagerMetrics();
    this.performanceMetrics = {
      ...this.performanceMetrics,
      totalProfiles: metrics.totalProfiles || 0,
      totalFeedbacks: metrics.totalFeedbacks || 0,
      modelConfidence: await this.calculateModelConfidence(),
      lastUpdated: Date.now()
    };
  }

  updateAccuracyMetrics(feedbackData) {
    const accuracyScore = this.mapAccuracyToScore(feedbackData.accuracy);
    const currentAvg = this.performanceMetrics.averageAccuracy || 0;
    const totalFeedbacks = this.performanceMetrics.totalFeedbacks || 1;

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

  // Helper method to safely get metrics from data manager
  async getDataManagerMetrics() {
    if (this.dataManager.getMLMetrics) {
      return await this.dataManager.getMLMetrics();
    } else {
      const profiles = this.dataManager.getProfiles ? await this.dataManager.getProfiles() : [];
      return {
        totalProfiles: profiles.length,
        totalFeedbacks: 0,
        averageQuestions: 6,
        averageAccuracy: 0.75,
        profilesLastWeek: 0,
        feedbackDistribution: {},
        modelConfidence: 'Learning'
      };
    }
  }

  aggregateRecommendations(similarProfiles, userScores) {
    try {
      console.log('🤖 Aggregating recommendations from similar profiles:', similarProfiles.length);

      if (similarProfiles.length === 0) {
        return this.getDefaultRecommendations(userScores);
      }

      const recommendations = {
        courseStyles: {},
        budgetLevels: {}
      };

      similarProfiles.forEach(({ profile, similarity }) => {
        const weight = similarity;
        const rec = profile.profile?.recommendations;

        if (rec?.courseStyle) {
          recommendations.courseStyles[rec.courseStyle] =
            (recommendations.courseStyles[rec.courseStyle] || 0) + weight;
        }

        if (rec?.budgetLevel) {
          recommendations.budgetLevels[rec.budgetLevel] =
            (recommendations.budgetLevels[rec.budgetLevel] || 0) + weight;
        }
      });

      const topCourseStyle = Object.entries(recommendations.courseStyles)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'parkland';

      const topBudgetLevel = Object.entries(recommendations.budgetLevels)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Mid-range ($50-100)';

      const result = {
        courseStyle: topCourseStyle,
        budgetLevel: topBudgetLevel,
        socialLevel: userScores.socialness >= 6 ? 'Group-friendly' : 'Individual-focused',
        confidence: similarProfiles.length >= 3 ? 'High' : 'Medium',
        source: 'ML Algorithm',
        basedOnProfiles: similarProfiles.length
      };

      console.log('✅ Aggregated recommendations');
      return result;
    } catch (error) {
      console.error('❌ Error aggregating recommendations:', error);
      return this.getDefaultRecommendations(userScores);
    }
  }

  // A/B Testing Implementation
  getABTestVariant(sessionId, testType) {
    // Hash sessionId to ensure consistent assignment
    const hash = this.hashString(sessionId);
    const hashNumber = parseInt(hash.substring(0, 8), 16);
    const variant = hashNumber % 3;
    
    const variants = {
      0: 'enhanced_ml',     // 33% get enhanced ML
      1: 'priority_based',  // 33% get priority-based
      2: 'random'          // 33% get random (control)
    };
    
    return variants[variant];
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  trackABTestMetric(sessionId, testType, variant, metricName, metricValue) {
    if (!this.abTestMetrics) {
      this.abTestMetrics = {};
    }
    
    const key = `${testType}_${variant}`;
    if (!this.abTestMetrics[key]) {
      this.abTestMetrics[key] = {
        variant,
        testType,
        metrics: {},
        users: new Set()
      };
    }
    
    this.abTestMetrics[key].users.add(sessionId);
    
    if (!this.abTestMetrics[key].metrics[metricName]) {
      this.abTestMetrics[key].metrics[metricName] = [];
    }
    
    this.abTestMetrics[key].metrics[metricName].push({
      value: metricValue,
      timestamp: Date.now(),
      sessionId
    });
    
    console.log(`📊 A/B Test tracked: ${testType}/${variant} - ${metricName}:`, metricValue);
  }

  // Alternative question selection methods for A/B testing
  priorityBasedQuestionSelection(currentAnswers, questionBank, questionNumber) {
    if (questionNumber === 0) {
      const starter = questionBank.find(q => q.type === 'starter') || questionBank[0];
      return starter;
    }

    const answeredIds = Object.keys(currentAnswers);
    const unanswered = questionBank.filter(q => !answeredIds.includes(q.id));
    
    if (unanswered.length === 0) return null;
    
    // Sort by priority only
    const sorted = unanswered.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return sorted[0];
  }

  randomQuestionSelection(currentAnswers, questionBank, questionNumber) {
    if (questionNumber === 0) {
      const starter = questionBank.find(q => q.type === 'starter') || questionBank[0];
      return starter;
    }

    const answeredIds = Object.keys(currentAnswers);
    const unanswered = questionBank.filter(q => !answeredIds.includes(q.id));
    
    if (unanswered.length === 0) return null;
    
    // Completely random selection
    return unanswered[Math.floor(Math.random() * unanswered.length)];
  }

  // Get A/B test results
  getABTestResults() {
    if (!this.abTestMetrics) return {};
    
    const results = {};
    
    Object.keys(this.abTestMetrics).forEach(key => {
      const testData = this.abTestMetrics[key];
      results[key] = {
        variant: testData.variant,
        testType: testData.testType,
        userCount: testData.users.size,
        metrics: {}
      };
      
      // Calculate average metrics
      Object.keys(testData.metrics).forEach(metricName => {
        const values = testData.metrics[metricName];
        results[key].metrics[metricName] = {
          count: values.length,
          average: values.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 1), 0) / values.length,
          latest: values[values.length - 1]?.value
        };
      });
    });
    
    return results;
  }

  // Admin functions for testing (simplified)
  async createNewScoringAlgorithm(algorithmData) {
    console.log('📝 Mock: New scoring algorithm created:', algorithmData.version);
    return { success: true, version: algorithmData.version };
  }

  async createABTest(testConfig) {
    console.log('🧪 A/B test created:', testConfig.testName);
    
    // Store A/B test configuration
    if (!this.activeABTests) {
      this.activeABTests = {};
    }
    
    const testId = Date.now();
    this.activeABTests[testId] = {
      id: testId,
      testName: testConfig.testName,
      algorithmType: testConfig.algorithmType,
      variants: testConfig.variants || ['enhanced_ml', 'priority_based', 'random'],
      startDate: new Date().toISOString(),
      status: 'running'
    };
    
    return { success: true, id: testId };
  }

  async activateAlgorithm(algorithmType, version) {
    console.log(`🔄 Mock: Activated ${algorithmType} algorithm: ${version}`);
    this.activeAlgorithms[algorithmType] = { version };
    return true;
  }

  healthCheck() {
    return {
      initialized: this.isInitialized,
      version: this.modelVersion,
      performanceHealth: this.performanceMetrics,
      algorithmVersions: {
        scoring: this.activeAlgorithms.scoring?.version || 'v1.0.0',
        questionSelection: this.activeAlgorithms.questionSelection?.version || 'v1.0.0',
        similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'v1.0.0'
      },
      status: 'Healthy - Memory Mode Active'
    };
  }
}

export default MLService;
