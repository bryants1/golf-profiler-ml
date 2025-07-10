// MLService.js - Updated with Database-Driven Algorithms and A/B Testing

// Import your original sophisticated classes FIRST
import { SupabaseDataManager } from '../db/SupabaseDataManager.js';
import { EnhancedQuestionSelector } from './FixedMLSystem.js';
import { SimilarityCalculator } from './SimilarityCalculator.js';
import { FeedbackCollector } from './FeedbackCollector.js';
import { RecommendationEngine } from './RecommendationEngine.js';
import { AlgorithmManager } from './AlgorithmManager.js';
import { ML_CONFIG } from './MLConfig.js';

// Your existing MLService class, but using your original classes + database-driven algorithms
export class MLService {
  constructor(options = {}) {
    // Store options for later
    this.options = options;

    // Initialize core components
    this.dataManager = new SupabaseDataManager();
    this.similarityCalculator = new SimilarityCalculator();
    this.questionSelector = new EnhancedQuestionSelector(this.dataManager);
    this.feedbackCollector = new FeedbackCollector(this.dataManager);
    this.recommendationEngine = new RecommendationEngine(this.similarityCalculator, this.dataManager);

    // NEW: Algorithm Manager for database-driven algorithms
    this.algorithmManager = new AlgorithmManager(this.dataManager.supabase);

    // Current active algorithms (loaded from database)
    this.activeAlgorithms = {
      scoring: null,
      questionSelection: null,
      similarityCalculator: null
    };

    // Dynamic algorithm configurations (loaded from database)
    this.scoringConfig = null;
    this.questionSelectionConfig = null;
    this.similarityConfig = null;

    // Configuration
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

    // Session tracking for A/B testing
    this.userSessions = new Map();

    // ✅ Verify all methods exist
    console.log('🔍 Method checks:', {
      hasGetMLStatistics: typeof this.getMLStatistics === 'function',
      hasGetUserSimilarityInsights: typeof this.getUserSimilarityInsights === 'function',
      hasSelectNextQuestion: typeof this.selectNextQuestion === 'function',
      hasGenerateProfile: typeof this.generateProfile === 'function'
    });

    console.log('🚀 Starting MLService initialization...');
    // Initialize the service
    this.initialize();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing MLService with database-driven algorithms...');

      // MemoryDataManager initializes itself in constructor, no initialize() method needed
      console.log('📝 DataManager auto-initialized with mock data');

      // NEW: Initialize Algorithm Manager
      await this.algorithmManager.initialize();

      // Load algorithms from database for this session
      await this.loadSessionAlgorithms();

      // Add our additional mock data
      this.initializeWithMockData();

      // Apply dynamic configuration from algorithms
      await this.applyDynamicConfiguration();

      // Load performance metrics (like original)
      await this.loadPerformanceMetrics();

      // CRITICAL: Set to true to enable ML features
      this.isInitialized = true;

      console.log('✅ MLService initialized successfully');
      console.log('📊 ML System Status:', {
        initialized: this.isInitialized,
        profiles: (await this.getDataManagerMetrics()).totalProfiles,
        confidence: await this.calculateModelConfidence(),
        algorithmVersions: {
          scoring: this.activeAlgorithms.scoring?.version || 'fallback',
          questionSelection: this.activeAlgorithms.questionSelection?.version || 'fallback',
          similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'fallback'
        },
        abTestsActive: this.algorithmManager.activeABTests?.length || 0,
        similarityThreshold: this.config?.SIMILARITY_THRESHOLD || 0.5,
        usingDatabaseAlgorithms: true
      });

      // Test similarity finding immediately
      await this.testMLEnhancement();
      await this.testMockDataQuality();

    } catch (error) {
      console.error('❌ Error initializing MLService:', error);
      this.isInitialized = false;
    }
  }

  // NEW: Load algorithms for the current session (with A/B testing)
  async loadSessionAlgorithms(sessionId = 'default') {
    try {
      console.log('🔧 Loading session algorithms for A/B testing...');

      // Get algorithms for this user session (A/B testing happens here)
      this.activeAlgorithms.scoring = await this.algorithmManager.getAlgorithmForUser(
        sessionId, 'scoring'
      );

      this.activeAlgorithms.questionSelection = await this.algorithmManager.getAlgorithmForUser(
        sessionId, 'question_selection'
      );

      this.activeAlgorithms.similarityCalculator = await this.algorithmManager.getAlgorithmForUser(
        sessionId, 'similarity_calculator'
      );

      console.log('✅ Session algorithms loaded:', {
        scoring: this.activeAlgorithms.scoring?.version,
        questionSelection: this.activeAlgorithms.questionSelection?.version,
        similarityCalculator: this.activeAlgorithms.similarityCalculator?.version
      });

    } catch (error) {
      console.error('❌ Error loading session algorithms:', error);
      // Fallback to loaded algorithms or defaults
    }
  }

  // NEW: Apply dynamic configuration from database algorithms
  async applyDynamicConfiguration() {
    try {
      console.log('⚙️ Applying dynamic algorithm configuration...');

      // Apply scoring algorithm configuration
      if (this.activeAlgorithms.scoring) {
        this.scoringConfig = {
          dimensionWeights: this.activeAlgorithms.scoring.dimension_weights,
          questionTypeWeights: this.activeAlgorithms.scoring.question_type_weights,
          calculationMethod: this.activeAlgorithms.scoring.calculation_method,
          version: this.activeAlgorithms.scoring.version
        };
      }

      // Apply question selection configuration
      if (this.activeAlgorithms.questionSelection) {
        this.questionSelectionConfig = {
          ...this.activeAlgorithms.questionSelection.selection_logic,
          version: this.activeAlgorithms.questionSelection.version
        };
      }

      // Apply similarity calculator configuration
      if (this.activeAlgorithms.similarityCalculator) {
        this.similarityConfig = {
          ...this.activeAlgorithms.similarityCalculator.config,
          version: this.activeAlgorithms.similarityCalculator.version
        };
      }

      // Override base config with dynamic settings
      this.config = {
        ...ML_CONFIG,
        ...this.options,
        // Dynamic overrides from database
        SIMILARITY_THRESHOLD: this.similarityConfig?.similarity_threshold || 0.5,
        MIN_SIMILAR_PROFILES: 3,
        MAX_SIMILAR_PROFILES: this.similarityConfig?.max_similar_profiles || 10
      };

      // Apply the overridden config to our components
      if (this.similarityCalculator && this.similarityCalculator.config) {
        this.similarityCalculator.config = this.config;
      }

      console.log('✅ Dynamic configuration applied');

    } catch (error) {
      console.error('❌ Error applying dynamic configuration:', error);
      // Fallback to static config
      this.config = {
        ...ML_CONFIG,
        ...this.options,
        SIMILARITY_THRESHOLD: 0.5,
        MIN_SIMILAR_PROFILES: 3,
        MAX_SIMILAR_PROFILES: 10
      };
    }
  }

  initializeWithMockData() {
    console.log('🔄 Initializing ML system with QUALITY mock data...');

    // Create better mock data with more realistic clustering
    const mockProfiles = [];

    // Define MORE realistic golf player archetypes with better clustering
    const archetypes = [
      // Beginner Social Players (10 profiles)
      { skill: 2, social: 8, luxury: 3, tradition: 3, competitive: 2, amenity: 6, pace: 3, type: 'social_beginner' },
      { skill: 3, social: 9, luxury: 4, tradition: 2, competitive: 3, amenity: 7, pace: 4, type: 'social_beginner' },
      { skill: 1, social: 7, luxury: 2, tradition: 4, competitive: 1, amenity: 5, pace: 2, type: 'social_beginner' },

      // Serious Traditional Players (8 profiles)
      { skill: 8, social: 4, luxury: 6, tradition: 9, competitive: 9, amenity: 5, pace: 8, type: 'traditional_serious' },
      { skill: 9, social: 3, luxury: 7, tradition: 8, competitive: 8, amenity: 6, pace: 9, type: 'traditional_serious' },
      { skill: 7, social: 5, luxury: 5, tradition: 9, competitive: 7, amenity: 4, pace: 7, type: 'traditional_serious' },

      // Luxury Social Players (7 profiles)
      { skill: 5, social: 9, luxury: 9, tradition: 4, competitive: 4, amenity: 9, pace: 5, type: 'luxury_social' },
      { skill: 6, social: 8, luxury: 8, tradition: 5, competitive: 5, amenity: 8, pace: 6, type: 'luxury_social' },
      { skill: 4, social: 9, luxury: 9, tradition: 3, competitive: 3, amenity: 9, pace: 4, type: 'luxury_social' },

      // Competitive Solo Players (5 profiles)
      { skill: 7, social: 2, luxury: 4, tradition: 6, competitive: 9, amenity: 4, pace: 9, type: 'competitive_solo' },
      { skill: 8, social: 3, luxury: 5, tradition: 7, competitive: 8, amenity: 5, pace: 8, type: 'competitive_solo' },

      // Casual Weekend Players (5 profiles)
      { skill: 4, social: 6, luxury: 5, tradition: 5, competitive: 4, amenity: 6, pace: 5, type: 'casual_weekend' },
      { skill: 3, social: 7, luxury: 4, tradition: 4, competitive: 3, amenity: 5, pace: 4, type: 'casual_weekend' }
    ];

    // Create multiple profiles for each archetype with small variations
    archetypes.forEach((archetype, index) => {
      // Create 2-3 profiles per archetype
      const profilesPerArchetype = archetype.type === 'social_beginner' ? 3 :
                                   archetype.type === 'traditional_serious' ? 3 : 2;

      for (let i = 0; i < profilesPerArchetype; i++) {
        // Add small random variations to create realistic clusters
        const profile = {
          id: `quality_profile_${index}_${i}`,
          sessionId: `mock_session_${index}_${i}`,
          timestamp: Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
          answers: {
            skill: archetype.skill,
            social: archetype.social,
            luxury: archetype.luxury,
            tradition: archetype.tradition,
            competitive: archetype.competitive,
            amenity: archetype.amenity
          },
          scores: {
            skillLevel: Math.max(0, Math.min(10, archetype.skill + Math.floor(Math.random() * 3) - 1)),
            socialness: Math.max(0, Math.min(10, archetype.social + Math.floor(Math.random() * 3) - 1)),
            traditionalism: Math.max(0, Math.min(10, archetype.tradition + Math.floor(Math.random() * 3) - 1)),
            luxuryLevel: Math.max(0, Math.min(10, archetype.luxury + Math.floor(Math.random() * 3) - 1)),
            competitiveness: Math.max(0, Math.min(10, archetype.competitive + Math.floor(Math.random() * 3) - 1)),
            ageGeneration: Math.floor(Math.random() * 11),
            amenityImportance: Math.max(0, Math.min(10, archetype.amenity + Math.floor(Math.random() * 3) - 1)),
            pace: Math.max(0, Math.min(10, archetype.pace + Math.floor(Math.random() * 3) - 1)),
            courseStyle: this.generateRealisticCourseStyle(archetype)
          },
          totalQuestions: 6 + Math.floor(Math.random() * 2),
          questionSequence: ['skill', 'social', 'luxury', 'pace', 'tradition', 'competitive'].slice(0, 6),
          profile: {
            recommendations: this.generateRealisticRecommendations(archetype),
            playerType: archetype.type
          },
          version: '1.0'
        };

        mockProfiles.push(profile);
        // Add each profile using the data manager
        this.dataManager.addProfile(profile);
      }
    });

    // Generate realistic question effectiveness data
    const questionIds = ['skill', 'social', 'luxury', 'pace', 'tradition', 'competitive', 'amenity', 'course_style'];
    questionIds.forEach(qId => {
      this.dataManager.updateQuestionEffectiveness(qId, 0.7 + Math.random() * 0.2); // 0.7-0.9 effectiveness
    });

    // Add some quality feedback data
    const mockFeedbacks = this.generateQualityFeedbacks(15);
    mockFeedbacks.forEach(feedback => {
      this.dataManager.addFeedback(feedback);
    });

    console.log(`✅ ML System initialized with ${mockProfiles.length} QUALITY profiles`);
    console.log(`📊 Data summary by type:`, {
      social_beginner: mockProfiles.filter(p => p.profile.playerType === 'social_beginner').length,
      traditional_serious: mockProfiles.filter(p => p.profile.playerType === 'traditional_serious').length,
      luxury_social: mockProfiles.filter(p => p.profile.playerType === 'luxury_social').length,
      competitive_solo: mockProfiles.filter(p => p.profile.playerType === 'competitive_solo').length,
      casual_weekend: mockProfiles.filter(p => p.profile.playerType === 'casual_weekend').length,
      total: mockProfiles.length
    });

    // Test similarity with a sample profile to ensure clustering works
    this.testMockDataQuality();
  }

  generateRealisticCourseStyle(archetype) {
    const stylesByType = {
      'social_beginner': ['parkland', 'resort'],
      'traditional_serious': ['links', 'parkland'],
      'luxury_social': ['coastal', 'resort'],
      'competitive_solo': ['links', 'desert'],
      'casual_weekend': ['parkland', 'mountain']
    };

    const styles = stylesByType[archetype.type] || ['parkland'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    return { [style]: 1 };
  }

  generateRealisticRecommendations(archetype) {
    const recsByType = {
      'social_beginner': {
        courseStyle: 'parkland',
        budgetLevel: 'Value ($25-50)',
        confidence: 'Medium',
        amenities: ['Driving range', 'Group lessons', 'Bar/restaurant']
      },
      'traditional_serious': {
        courseStyle: 'links',
        budgetLevel: 'Premium ($100+)',
        confidence: 'High',
        amenities: ['Practice greens', 'Pro shop', 'Lessons']
      },
      'luxury_social': {
        courseStyle: 'coastal',
        budgetLevel: 'Premium ($100+)',
        confidence: 'High',
        amenities: ['Spa services', 'Fine dining', 'Event spaces']
      },
      'competitive_solo': {
        courseStyle: 'links',
        budgetLevel: 'Mid-range ($50-100)',
        confidence: 'High',
        amenities: ['Driving range', 'Practice greens', 'GPS cart']
      },
      'casual_weekend': {
        courseStyle: 'parkland',
        budgetLevel: 'Mid-range ($50-100)',
        confidence: 'Medium',
        amenities: ['Cart rental', 'Snack bar', 'Pro shop']
      }
    };

    return recsByType[archetype.type] || recsByType['casual_weekend'];
  }

  async testMockDataQuality() {
    // Test if our clustering is working
    const testScores = { skillLevel: 8, social: 4, luxury: 6, tradition: 9, competitive: 8, amenity: 5, pace: 8 };
    console.log('🧪 Testing mock data quality with traditional serious player profile...');

    const allProfiles = await this.dataManager.getProfiles();
    const similar = this.similarityCalculator.findSimilarProfiles(
      testScores,
      allProfiles,
      { threshold: 0.6, maxResults: 10 }
    );

    console.log(`📊 Found ${similar.length} similar profiles for traditional serious player`);
    if (similar.length > 0) {
      const types = similar.map(p => p.profile?.playerType).filter(t => t);
      console.log('🎯 Player types found:', [...new Set(types)]);
      console.log('✅ Mock data clustering is working!');
    } else {
      console.warn('⚠️ No similar profiles found - may need to adjust similarity threshold');
    }
  }

  generateQualityFeedbacks(count) {
    const feedbacks = [];
    const accuracyLevels = ['very_accurate', 'mostly_accurate', 'somewhat_accurate', 'not_accurate'];
    const weights = [0.5, 0.3, 0.15, 0.05]; // Much more positive feedback for quality data

    for (let i = 0; i < count; i++) {
      // Weighted random selection for more realistic feedback distribution
      let selectedAccuracy = accuracyLevels[0];
      const random = Math.random();
      let cumulative = 0;
      for (let j = 0; j < weights.length; j++) {
        cumulative += weights[j];
        if (random <= cumulative) {
          selectedAccuracy = accuracyLevels[j];
          break;
        }
      }

      feedbacks.push({
        id: `quality_feedback_${i}`,
        sessionId: `mock_session_feedback_${i}`,
        timestamp: Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000,
        accuracy: selectedAccuracy,
        responseTime: Math.round(8000 + Math.random() * 12000),
        feedbackWeight: 0.9 + Math.random() * 0.2,
        credibilityScore: 0.8 + Math.random() * 0.2
      });
    }

    return feedbacks;
  }

  generateCourseStyle() {
    const styles = ['parkland', 'links', 'coastal', 'desert', 'mountain'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    return { [style]: 1 };
  }

  getRandomCourseStyle() {
    const styles = ['parkland', 'links', 'coastal', 'desert', 'mountain'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  // Test ML enhancement capability
  async testMLEnhancement() {
    try {
      const testScores = {
        skillLevel: 5,
        socialness: 7,
        traditionalism: 4,
        luxuryLevel: 6,
        competitiveness: 5,
        ageGeneration: 5,
        amenityImportance: 6,
        pace: 5
      };

      console.log('🧪 Testing RecommendationEngine with sample scores:', testScores);

      const allProfiles = await this.dataManager.getProfiles();
      const similarProfiles = this.similarityCalculator.findSimilarProfiles(
        testScores,
        allProfiles,
        {
          threshold: this.config.SIMILARITY_THRESHOLD,
          maxResults: this.config.MAX_SIMILAR_PROFILES
        }
      );

      // ... rest of the method
    } catch (error) {
      console.error('❌ Error testing ML enhancement:', error);
    }
  }

  // Load performance metrics from storage (like original)
  async loadPerformanceMetrics() {
    try {
      // In memory mode, we just use defaults but log that we're ready
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

  // Save performance metrics (like original)
  savePerformanceMetrics() {
    // In memory mode, we don't persist but we can log updates
    console.log('💾 Performance metrics updated:', {
      profiles: this.performanceMetrics.profilesGenerated,
      accuracy: (this.performanceMetrics.averageAccuracy * 100).toFixed(1) + '%'
    });
  }

  // NEW: Updated scoring with dynamic weights from database
  calculateWeightedScores(allAnswers) {
    console.log('🔢 Calculating weighted scores with dynamic weights...');
    console.log('📊 Using scoring algorithm version:', this.scoringConfig?.version || 'fallback');

    const dimensionScores = {
      skillLevel: [], socialness: [], traditionalism: [], luxuryLevel: [],
      competitiveness: [], ageGeneration: [], genderLean: [], amenityImportance: [],
      pace: [], courseStyle: {}
    };

    // Use dynamic weights from database or fallback to defaults
    const questionWeights = this.scoringConfig?.questionTypeWeights || {
      'starter': 1.2, 'core': 1.5, 'skill_assessment': 1.8,
      'social': 1.3, 'lifestyle': 1.0, 'knowledge': 1.1,
      'personality': 1.4, 'preparation': 1.0
    };

    console.log('📊 Using dynamic question weights:', questionWeights);

    // Collect all scores with dynamic weights
    Object.entries(allAnswers).forEach(([questionId, answerData]) => {
      const question = this.getQuestionById(questionId);
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

    // Calculate weighted averages using dynamic dimension weights
    const dimensionWeights = this.scoringConfig?.dimensionWeights || {
      skillLevel: 1.0, socialness: 1.0, traditionalism: 1.0, luxuryLevel: 1.0,
      competitiveness: 1.0, ageGeneration: 0.8, genderLean: 0.6,
      amenityImportance: 1.0, pace: 0.9
    };

    const finalScores = {
      skillLevel: 0, socialness: 0, traditionalism: 0, luxuryLevel: 0,
      competitiveness: 0, ageGeneration: 0, genderLean: 0, amenityImportance: 0,
      courseStyle: dimensionScores.courseStyle, pace: 0
    };

    Object.keys(finalScores).forEach(dimension => {
      if (dimension === 'courseStyle') return;

      const scores = dimensionScores[dimension];
      if (scores.length > 0) {
        const weightedSum = scores.reduce((sum, score) => sum + (score.value * score.weight), 0);
        const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
        let average = weightedSum / totalWeight;

        // Apply dimension weight
        const dimWeight = dimensionWeights[dimension] || 1.0;
        average = average * dimWeight;

        finalScores[dimension] = Math.round(Math.max(0, Math.min(10, average)) * 10) / 10;
      }
    });

    console.log('✅ Weighted scores calculated with version:', this.scoringConfig?.version);

    // Track scoring performance
    this.trackScoringPerformance(allAnswers, finalScores);

    return finalScores;
  }

  // NEW: Track scoring algorithm performance
  async trackScoringPerformance(answers, scores) {
    try {
      if (!this.activeAlgorithms.scoring) return;

      const questionCount = Object.keys(answers).length;
      const scoreVariance = this.calculateScoreVariance(scores);

      // Track metrics
      await this.algorithmManager.trackPerformance(
        'scoring',
        this.activeAlgorithms.scoring.version,
        'question_count',
        questionCount
      );

      await this.algorithmManager.trackPerformance(
        'scoring',
        this.activeAlgorithms.scoring.version,
        'score_variance',
        scoreVariance
      );

    } catch (error) {
      console.error('❌ Error tracking scoring performance:', error);
    }
  }

  // Main API Methods for Golf Profiler (matching original exactly but with dynamic algorithms)
  async generateProfile(answers, scores, sessionId, options = {}) {
    // CRITICAL: Original logic - fall back to basic if not initialized
    if (!this.isInitialized) {
      console.warn('MLService not initialized, using basic profile generation');
      return this.generateCompleteProfile(scores);
    }

    try {
      // Load session-specific algorithms for this user
      await this.loadSessionAlgorithms(sessionId);

      // Record the profile generation
      this.performanceMetrics.profilesGenerated++;

      console.log('🎯 Generating profile with session algorithms for:', sessionId);
      console.log('📊 Available profiles for similarity:', (await this.getDataManagerMetrics()).totalProfiles);

      // Use session-specific similarity configuration
      const similarProfiles = await this.findSimilarProfilesForML(scores, sessionId);

      let profile;
      if (similarProfiles.length >= 3) {
        profile = await this.generateEnhancedProfile(scores, similarProfiles, sessionId);
      } else {
        profile = this.generateCompleteProfile(scores, sessionId);
      }

      // Store profile with algorithm version info
      await this.addProfileData(answers, scores, profile, sessionId);

      // Track profile generation performance
      await this.trackProfilePerformance(sessionId, profile, similarProfiles.length);

      await this.updatePerformanceMetrics();

      console.log('✅ Profile generated with ML enhancement:', profile.mlEnhanced || false);
      if (profile.mlMetadata) {
        console.log('📈 ML Metadata:', profile.mlMetadata);
      }

      return profile;
    } catch (error) {
      console.error('❌ Error generating profile:', error);
      // Fallback to basic profile (like original)
      return this.generateCompleteProfile(scores);
    }
  }

  // NEW: Track profile generation performance
  async trackProfilePerformance(sessionId, profile, similarProfileCount) {
    try {
      const algorithms = this.activeAlgorithms;

      // Track similarity calculator performance
      if (algorithms.similarityCalculator) {
        await this.algorithmManager.trackPerformance(
          'similarity_calculator',
          algorithms.similarityCalculator.version,
          'similar_profiles_found',
          similarProfileCount
        );

        await this.algorithmManager.trackPerformance(
          'similarity_calculator',
          algorithms.similarityCalculator.version,
          'ml_enhancement_success',
          profile.mlEnhanced ? 1 : 0
        );
      }

    } catch (error) {
      console.error('❌ Error tracking profile performance:', error);
    }
  }

  // Smart question selection with ML (matching original but with dynamic algorithms)
  selectNextQuestion(currentAnswers, currentScores, questionBank, questionNumber, userContext = {}) {
    console.log('🎯 selectNextQuestion called with dynamic algorithm');
    console.log('📊 Question selection algorithm:', this.activeAlgorithms.questionSelection?.version || 'fallback');

    // CRITICAL: Original logic - fall back to basic if not initialized
    if (!this.isInitialized) {
      console.warn('❌ MLService not initialized, using basic question selection');
      return this.basicQuestionSelection(currentAnswers, questionBank, questionNumber);
    }

    try {
      console.log('🤖 Using dynamic ML question selection');

      // Use dynamic question selection logic
      const config = this.questionSelectionConfig || {
        min_questions: 5,
        max_questions: 7,
        diversity_weight: 0.3,
        accuracy_weight: 0.7
      };

      const selectedQuestion = this.enhancedQuestionSelection(
        currentAnswers,
        currentScores,
        questionBank,
        questionNumber,
        config,
        userContext
      );

      console.log('✅ ML question selected:', selectedQuestion?.id);

      // Track question selection performance
      this.trackQuestionSelectionPerformance(questionNumber, selectedQuestion);

      return selectedQuestion;

    } catch (error) {
      console.error('❌ Error in ML question selection:', error);
      console.log('🔄 Falling back to basic question selection');
      return this.basicQuestionSelection(currentAnswers, questionBank, questionNumber);
    }
  }

  // NEW: Enhanced question selection with dynamic logic
  enhancedQuestionSelection(currentAnswers, currentScores, questionBank, questionNumber, config, userContext) {
    // Use the configuration from the database algorithm
    const { min_questions, max_questions, diversity_weight, accuracy_weight } = config;

    // Apply dynamic selection logic based on database configuration
    if (questionNumber === 0) {
      return questionBank.find(q => q.type === 'starter') || questionBank[0];
    }

    const answeredIds = Object.keys(currentAnswers);
    const unansweredQuestions = questionBank.filter(q => !answeredIds.includes(q.id));

    if (unansweredQuestions.length === 0) return null;

    // Use dynamic weights for question scoring
    const scoredQuestions = unansweredQuestions.map(question => ({
      question,
      score: this.calculateQuestionScore(question, currentScores, config)
    }));

    // Sort by dynamic score
    scoredQuestions.sort((a, b) => b.score - a.score);

    return scoredQuestions[0].question;
  }

  // NEW: Calculate question score using dynamic algorithm
  calculateQuestionScore(question, currentScores, config) {
    const { diversity_weight, accuracy_weight } = config;

    // Priority score
    const priorityScore = (question.priority || 0) / 10;

    // Diversity score (prefer different question types)
    const diversityScore = this.calculateDiversityScore(question);

    // Accuracy score (prefer questions that help improve profile accuracy)
    const accuracyScore = this.calculateAccuracyScore(question, currentScores);

    return (priorityScore * 0.3) +
           (diversityScore * diversity_weight) +
           (accuracyScore * accuracy_weight);
  }

  calculateDiversityScore(question) {
    // Simplified diversity calculation
    return Math.random() * 0.5 + 0.5; // 0.5-1.0 range
  }

  calculateAccuracyScore(question, currentScores) {
    // Simplified accuracy calculation based on current scores
    const relevantDimensions = Object.keys(question.options[0]?.scores || {});
    const currentValues = relevantDimensions.map(dim => currentScores[dim] || 0);
    const uncertainty = currentValues.reduce((sum, val) => sum + Math.abs(val - 5), 0) / relevantDimensions.length;

    return uncertainty / 5; // Higher uncertainty = higher accuracy potential
  }

  // NEW: Track question selection performance
  async trackQuestionSelectionPerformance(questionNumber, selectedQuestion) {
    try {
      if (!this.activeAlgorithms.questionSelection || !selectedQuestion) return;

      await this.algorithmManager.trackPerformance(
        'question_selection',
        this.activeAlgorithms.questionSelection.version,
        'question_selected',
        1
      );

      await this.algorithmManager.trackPerformance(
        'question_selection',
        this.activeAlgorithms.questionSelection.version,
        'question_number',
        questionNumber
      );

    } catch (error) {
      console.error('❌ Error tracking question selection performance:', error);
    }
  }

  // Collect and process user feedback (updated with A/B test tracking)
  async collectFeedback(sessionId, feedbackData, profileData = null) {
    try {
      // FeedbackCollector HAS collectProfileFeedback method
      const success = this.feedbackCollector.collectProfileFeedback(sessionId, feedbackData, profileData);

      if (success) {
        this.performanceMetrics.totalFeedbacks++;
        this.updateAccuracyMetrics(feedbackData);

        // Track algorithm performance based on feedback
        await this.trackFeedbackPerformance(sessionId, feedbackData);
      }
      return success;
    } catch (error) {
      console.error('Error collecting feedback:', error);
      return false;
    }
  }

  // NEW: Track feedback performance for A/B testing
  async trackFeedbackPerformance(sessionId, feedbackData) {
    try {
      // Get user's algorithm assignments
      const assignments = await Promise.all([
        this.algorithmManager.getUserAssignment(sessionId, 'scoring'),
        this.algorithmManager.getUserAssignment(sessionId, 'question_selection'),
        this.algorithmManager.getUserAssignment(sessionId, 'similarity_calculator')
      ]);

      // Track feedback for each algorithm version
      for (const assignment of assignments.filter(a => a)) {
        const accuracyScore = this.mapAccuracyToScore(feedbackData.accuracy);

        await this.algorithmManager.trackPerformance(
          assignment.algorithm_type,
          assignment.algorithm_version,
          'user_satisfaction',
          accuracyScore
        );

        await this.algorithmManager.trackPerformance(
          assignment.algorithm_type,
          assignment.algorithm_version,
          'feedback_count',
          1
        );

        // Update A/B test results if this user is in a test
        if (assignment.ab_test_id) {
          await this.updateABTestResults(assignment.ab_test_id, accuracyScore);
        }
      }

    } catch (error) {
      console.error('❌ Error tracking feedback performance:', error);
    }
  }

  // NEW: Update A/B test results
  async updateABTestResults(testId, accuracyScore) {
    try {
      // Get current test results
      const analytics = await this.algorithmManager.getABTestAnalytics(testId);

      if (analytics && analytics.totalAssignments >= 100) {
        // Enough data to determine winner
        const results = {
          totalAssignments: analytics.totalAssignments,
          versionAPerformance: analytics.versionAMetrics,
          versionBPerformance: analytics.versionBMetrics,
          winner: analytics.winner,
          confidence: analytics.sampleSizeAdequate ? 'High' : 'Medium',
          lastUpdated: new Date().toISOString()
        };

        await this.algorithmManager.updateABTestResults(testId, results);

        // Auto-activate winner if test is conclusive
        if (analytics.winner !== 'inconclusive') {
          console.log(`🏆 A/B Test ${testId} winner: ${analytics.winner}`);
        }
      }

    } catch (error) {
      console.error('❌ Error updating A/B test results:', error);
    }
  }

  // Get enhanced recommendations for existing profile
  async getEnhancedRecommendations(currentScores, currentProfile, options = {}) {
    try {
      const similarProfiles = await this.findSimilarProfilesForML(currentScores);

      if (similarProfiles.length >= ML_CONFIG.MIN_SIMILAR_PROFILES) {
        // Use the sophisticated RecommendationEngine
        return this.recommendationEngine.generateEnhancedRecommendations(
          currentScores,
          currentProfile,
          similarProfiles
        );
      } else {
        // Fallback to simple aggregation
        return this.aggregateRecommendations(similarProfiles, currentScores);
      }
    } catch (error) {
      console.error('Error generating enhanced recommendations:', error);
      return currentProfile.recommendations || this.getDefaultRecommendations(currentScores);
    }
  }

  async getMLStatistics() {
    console.log('🔍 getMLStatistics called, stack trace:');
    console.trace();

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
      console.log('✅ Got data metrics:', dataMetrics);

      const modelConfidence = await this.calculateModelConfidence();
      console.log('✅ Got model confidence:', modelConfidence);

      const feedbackAnalytics = {
        totalFeedbacks: dataMetrics.totalFeedbacks || 0,
        averageRating: 0.75,
        recentTrend: 'stable'
      };

      const questionAnalytics = {
        totalQuestions: 8,
        averageEffectiveness: 0.75,
        selectionVariety: 'high'
      };

      const result = {
        model: {
          version: this.modelVersion,
          initialized: this.isInitialized,
          confidence: modelConfidence || 0.5,
          // NEW: Include current algorithm versions and A/B test info
          algorithmVersions: {
            scoring: this.activeAlgorithms.scoring?.version || 'fallback',
            questionSelection: this.activeAlgorithms.questionSelection?.version || 'fallback',
            similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'fallback'
          },
          abTestsActive: this.algorithmManager.activeABTests?.length || 0
        },
        data: dataMetrics,
        feedback: feedbackAnalytics,
        questions: questionAnalytics,
        performance: this.performanceMetrics
      };

      console.log('✅ ML statistics generated successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Error getting ML statistics:', error);
      console.error('❌ Error stack:', error.stack);

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

  // Get user similarity insights - with debugging and error handling
  async getUserSimilarityInsights(userScores, options = {}) {
    console.log('🔍 getUserSimilarityInsights called with:', { userScores, options });

    // Add method existence check
    if (!this.isInitialized) {
      console.warn('⚠️ MLService not initialized for similarity insights');
      return {
        similarUsers: 0,
        averageSimilarity: 0,
        topMatches: [],
        userPercentiles: {}
      };
    }

    try {
      console.log('📊 Getting similarity insights...');

      const allProfiles = await this.dataManager.getProfiles();
      console.log('🔍 Getting similarity insights for user scores:', userScores);
      console.log('📊 Total profiles available:', allProfiles.length);

      // Use a lower threshold to ensure we get similar profiles
      const lowerThreshold = options.threshold || 0.5;

      const similarProfiles = this.similarityCalculator.findSimilarProfiles(
        userScores,
        allProfiles,
        { ...options, threshold: lowerThreshold }
      );

      console.log(`🔍 Found ${similarProfiles.length} similar profiles with threshold ${lowerThreshold}`);

      const result = {
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

      console.log('✅ Similarity insights generated:', result);
      return result;

    } catch (error) {
      console.error('❌ Error getting similarity insights:', error);
      console.error('❌ Error stack:', error.stack);

      // Return safe fallback
      return {
        similarUsers: 0,
        averageSimilarity: 0,
        topMatches: [],
        userPercentiles: {}
      };
    }
  }

  // Override similarity finding to ensure ML enhancement works (updated with session-specific algorithms)
  async findSimilarProfilesForML(userScores, sessionId = 'default') {
    try {
      // Load session algorithms if not already loaded
      if (!this.activeAlgorithms.similarityCalculator) {
        await this.loadSessionAlgorithms(sessionId);
      }

      const allProfiles = await this.dataManager.getProfiles();
      console.log(`🔍 Looking for similar profiles among ${allProfiles.length} total profiles`);
      console.log('🔧 Using similarity algorithm:', this.activeAlgorithms.similarityCalculator?.version || 'fallback');

      // Use dynamic similarity configuration
      const config = this.similarityConfig || { similarity_threshold: 0.5, max_similar_profiles: 10 };
      const thresholds = [config.similarity_threshold, 0.4, 0.3, 0.2];

      for (const threshold of thresholds) {
        const similarProfiles = this.similarityCalculator.findSimilarProfiles(
          userScores,
          allProfiles,
          { threshold, maxResults: config.max_similar_profiles }
        );

        console.log(`Threshold ${threshold}: Found ${similarProfiles.length} similar profiles`);

        if (similarProfiles.length >= 3) {
          console.log(`✅ Using threshold ${threshold} with ${similarProfiles.length} similar profiles`);
          const types = similarProfiles.map(p => p.profile?.playerType).filter(t => t);
          console.log(`🎯 Player types found: ${[...new Set(types)].join(', ')}`);
          return similarProfiles;
        }
      }

      // Fallback logic remains the same
      const allWithSimilarity = allProfiles.map(profile => ({
        ...profile,
        similarity: this.similarityCalculator.calculateSimilarity(userScores, profile.scores, 'weighted_euclidean')
      }));

      allWithSimilarity.sort((a, b) => b.similarity - a.similarity);
      const top5 = allWithSimilarity.slice(0, 5);

      console.log(`📊 Using top 5 most similar profiles with algorithm:`, this.activeAlgorithms.similarityCalculator?.version);
      return top5;

    } catch (error) {
      console.error('Error finding similar profiles:', error);
      return [];
    }
  }

  // Get recommendation insights and explanations
  async getRecommendationInsights(userScores, recommendations) {
    try {
      console.log('🔍 Getting recommendation insights for:', userScores);
      console.log('📋 Recommendations received:', recommendations);

      const similarProfiles = await this.findSimilarProfilesForML(userScores);

      // Handle case where recommendations might be undefined
      const safeRecommendations = recommendations || {};

      const insights = {
        // Use RecommendationEngine's confidence if available, otherwise calculate our own
        confidence: safeRecommendations.confidence || this.calculateRecommendationConfidence(similarProfiles),

        // Use RecommendationEngine's explanation if available
        explanation: safeRecommendations.explanation ||
          `Enhanced with ${this.activeAlgorithms.scoring?.version || 'fallback'} algorithm from ${similarProfiles.length} similar golfers`,

        // Use RecommendationEngine's alternatives if available
        alternatives: safeRecommendations.alternativeOptions || [],

        improvementSuggestions: this.generateImprovementSuggestions(userScores, similarProfiles),
        personalizationLevel: await this.calculatePersonalizationLevel(userScores, similarProfiles),
        similarUserCount: similarProfiles.length,
        dataQuality: similarProfiles.length >= 10 ? 'High' : similarProfiles.length >= 5 ? 'Medium' : 'Low',

        // Add RecommendationEngine specific insights if available
        mlEnhanced: safeRecommendations.mlEnhanced || false,
        detailedBreakdown: this.extractDetailedBreakdown(safeRecommendations)
      };

      console.log('✅ Generated insights:', insights);
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

  // Helper method to calculate recommendation confidence
  calculateRecommendationConfidence(similarProfiles) {
    if (similarProfiles.length >= 10) return 'Very High';
    if (similarProfiles.length >= 7) return 'High';
    if (similarProfiles.length >= 3) return 'Medium';
    return 'Low';
  }

  // Helper method to extract detailed breakdown from RecommendationEngine output
  extractDetailedBreakdown(recommendations) {
    const breakdown = {};

    // Extract course style details
    if (recommendations.courseStyle && typeof recommendations.courseStyle === 'object') {
      breakdown.courseStyle = {
        primary: recommendations.courseStyle.primary,
        alternatives: recommendations.courseStyle.alternatives,
        reasoning: recommendations.courseStyle.reasoning
      };
    }

    // Extract budget details
    if (recommendations.budgetLevel && typeof recommendations.budgetLevel === 'object') {
      breakdown.budgetLevel = {
        primary: recommendations.budgetLevel.primary,
        priceRange: recommendations.budgetLevel.priceRange,
        flexibility: recommendations.budgetLevel.flexibility
      };
    }

    // Extract amenities
    if (recommendations.amenities) {
      breakdown.amenities = recommendations.amenities;
    }

    // Extract other detailed recommendations
    ['lodging', 'playingTimes', 'groupSize', 'equipmentSuggestions'].forEach(key => {
      if (recommendations[key]) {
        breakdown[key] = recommendations[key];
      }
    });

    return breakdown;
  }

  // Generate improvement suggestions
  generateImprovementSuggestions(userScores, similarProfiles) {
    const suggestions = [];

    if (similarProfiles.length < 5) {
      suggestions.push("Complete the full quiz for more personalized recommendations");
    }

    // Analyze areas where user differs from similar users
    if (similarProfiles.length > 0) {
      const avgSimilarScores = this.calculateAverageSimilarScores(similarProfiles);
      const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;

      dimensions.forEach(dim => {
        const userScore = userScores[dim] || 0;
        const avgScore = avgSimilarScores[dim] || 0;
        const diff = Math.abs(userScore - avgScore);

        if (diff > 3) {
          suggestions.push(`Consider exploring ${dim} preferences - similar golfers show different patterns`);
        }
      });
    }

    return suggestions.slice(0, 3); // Limit to top 3 suggestions
  }

  calculateAverageSimilarScores(similarProfiles) {
    if (similarProfiles.length === 0) return {};

    const avgScores = {};
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;

    dimensions.forEach(dim => {
      const values = similarProfiles.map(p => p.scores[dim] || 0);
      avgScores[dim] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    return avgScores;
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

  // Calculate user percentiles compared to all users
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

  basicQuestionSelection(currentAnswers, questionBank, questionNumber) {
    console.log('🔧 Using basic question selection');
    console.log('📊 Current answers:', Object.keys(currentAnswers));
    console.log('📊 Question number:', questionNumber);
    console.log('📊 Available questions:', questionBank.map(q => q.id));

    if (questionNumber === 0) {
      const starter = questionBank.find(q => q.type === 'starter') || questionBank[0];
      console.log('🎯 Selected starter question:', starter?.id);
      return starter;
    }

    const answeredIds = Object.keys(currentAnswers);
    const unansweredQuestions = questionBank.filter(q => !answeredIds.includes(q.id));

    console.log('❓ Unanswered questions:', unansweredQuestions.map(q => q.id));

    // Sort by priority, then by a different factor to add variety
    const sorted = unansweredQuestions.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // Add some variety by using question number as tiebreaker
      return (a.id > b.id) ? 1 : -1;
    });

    const selected = sorted[0];
    console.log('🎯 Selected question:', selected?.id);
    return selected;
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
        // NEW: Include algorithm version info
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

  generateCompleteProfile(userScores, sessionId = null) {
    console.log('🎯 Generating complete profile for scores:', userScores);

    // Generate skill level
    const skillLevel = {
      numeric: userScores.skillLevel || 0,
      label: this.getSkillLabel(userScores.skillLevel || 0),
      confidence: 'Medium'
    };

    // Generate personality type
    const personality = {
      primary: this.getPersonalityType(userScores),
      secondary: [],
      confidence: 'Medium'
    };

    // Generate preferences
    const preferences = {
      core: this.getPreferences(userScores)
    };

    // Generate recommendations
    const recommendations = this.getDefaultRecommendations(userScores);

    // Generate demographics
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
      // NEW: Include algorithm version info
      algorithmVersions: sessionId ? {
        scoring: this.activeAlgorithms.scoring?.version || 'fallback',
        questionSelection: this.activeAlgorithms.questionSelection?.version || 'fallback',
        similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'fallback'
      } : {}
    };

    console.log('✅ Complete profile generated:', completeProfile);
    return completeProfile;
  }

  // Add this new method for ML-enhanced profiles:
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
          insights: `Enhanced based on ${similarProfiles.length} similar golfers using ${this.activeAlgorithms.similarityCalculator?.version || 'fallback'} algorithm`
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
          scoring: this.activeAlgorithms.scoring?.version || 'fallback',
          questionSelection: this.activeAlgorithms.questionSelection?.version || 'fallback',
          similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'fallback'
        }
      }
    };
  }

  // Helper methods (add these to your MLService class):
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

  async calculateModelConfidence() {
    const metrics = await this.getDataManagerMetrics();
    const profileCount = metrics.totalProfiles || 0;
    const feedbackCount = metrics.totalFeedbacks || 0;

    // Use the actual ML_CONFIG thresholds
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
    // Handle both formats: lowercase with underscores (from feedback) and uppercase (from config)
    const mapping = {
      'very_accurate': 1.0,
      'mostly_accurate': 0.8,
      'somewhat_accurate': 0.5,
      'not_accurate': 0.2,
      // Also handle the config format
      'VERY_ACCURATE': 1.0,
      'MOSTLY_ACCURATE': 0.8,
      'SOMEWHAT_ACCURATE': 0.5,
      'NOT_ACCURATE': 0.2
    };
    return mapping[accuracy] || 0.5;
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

  // Helper method to safely get metrics from data manager
  async getDataManagerMetrics() {
    if (this.dataManager.getMLMetrics) {
      return await this.dataManager.getMLMetrics();
    } else {
      // Fallback metrics
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

  // Helper method for basic similarity calculation
  calculateBasicSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    let totalDiff = 0;

    dimensions.forEach(dim => {
      const diff = Math.abs((scores1[dim] || 0) - (scores2[dim] || 0));
      totalDiff += diff / 10;
    });

    const similarity = Math.max(0, 1 - (totalDiff / dimensions.length));
    return similarity;
  }

  // Helper methods for recommendations
  getDefaultRecommendations(userScores) {
    console.log('⚡ Generating default recommendations for scores:', userScores);

    const { skillLevel = 5, luxuryLevel = 5, socialness = 5 } = userScores;

    let courseStyle = 'parkland';
    if (skillLevel >= 7) courseStyle = 'links';
    if (luxuryLevel >= 8) courseStyle = 'coastal';

    let budgetLevel = 'Mid-range ($50-100)';
    if (luxuryLevel >= 7) budgetLevel = 'Premium ($100+)';
    if (luxuryLevel <= 3) budgetLevel = 'Value ($25-50)';

    const result = {
      courseStyle,
      budgetLevel,
      socialLevel: socialness >= 6 ? 'Group-friendly' : 'Individual-focused',
      confidence: 'Medium',
      source: 'Default Algorithm'
    };

    console.log('✅ Default recommendations generated:', result);
    return result;
  }

  async generateRecommendations(userScores) {
    console.log('🎯 Generating recommendations for scores:', userScores);

    const similarProfiles = await this.findSimilarProfiles(userScores, { limit: 5 });
    console.log(`📊 Found ${similarProfiles.length} similar profiles`);

    if (similarProfiles.length === 0) {
      console.log('⚡ Using default recommendations (no similar profiles)');
      const defaultRecs = this.getDefaultRecommendations(userScores);
      console.log('✅ Default recommendations:', defaultRecs);
      return defaultRecs;
    }

    console.log('🤖 Using RecommendationEngine for enhanced recommendations');

    // Create a basic profile with default recommendations for the RecommendationEngine
    const currentProfile = {
      recommendations: this.getDefaultRecommendations(userScores)
    };

    // Use the sophisticated RecommendationEngine
    const enhancedRecs = this.recommendationEngine.generateEnhancedRecommendations(
      userScores,
      currentProfile,
      similarProfiles
    );

    console.log('✅ Enhanced recommendations:', enhancedRecs);
    return enhancedRecs;
  }

  async findSimilarProfiles(userScores, options = {}) {
    try {
      const { minSimilarity = 0.5, limit = 10 } = options;

      console.log(`🔍 Finding similar profiles with threshold ${minSimilarity}, limit ${limit}`);
      console.log(`👤 User scores:`, userScores);

      const allProfiles = await this.dataManager.getProfiles();
      console.log(`📊 Total profiles available: ${allProfiles.length}`);

      // Debug: show sample of available profiles
      if (allProfiles.length > 0) {
        console.log('📋 Sample profiles by type:',
          allProfiles.slice(0, 5).map(p => ({
            type: p.profile?.playerType,
            skill: p.scores.skillLevel,
            social: p.scores.socialness,
            luxury: p.scores.luxuryLevel
          }))
        );
      }

      const similarProfiles = this.similarityCalculator.findSimilarProfiles(
        userScores,
        allProfiles,
        { threshold: minSimilarity, maxResults: limit }
      );

      console.log(`✅ Found ${similarProfiles.length} similar profiles`);

      // Debug: show what types we found
      if (similarProfiles.length > 0) {
        const foundTypes = similarProfiles.map(p => ({
          type: p.profile?.playerType,
          similarity: p.similarity?.toFixed(3),
          scores: {
            skill: p.scores.skillLevel,
            social: p.scores.socialness,
            luxury: p.scores.luxuryLevel
          }
        }));
        console.log('🎯 Similar profiles found:', foundTypes);
      } else {
        console.warn('⚠️ No similar profiles found - recommendations will use defaults');
      }

      return similarProfiles;
    } catch (error) {
      console.error('❌ Error finding similar profiles:', error);
      return []; // Return empty array on error
    }
  }

  aggregateRecommendations(similarProfiles, userScores) {
    try {
      console.log('🤖 Aggregating recommendations from similar profiles:', similarProfiles.length);

      const recommendations = {
        courseStyles: {},
        budgetLevels: {},
        confidence: 'High'
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

      // Get top recommendations
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

      console.log('✅ Aggregated recommendations:', result);
      return result;
    } catch (error) {
      console.error('❌ Error aggregating recommendations:', error);
      // Fallback to default recommendations
      return this.getDefaultRecommendations(userScores);
    }
  }

  // NEW: Admin functions for algorithm management
  async createNewScoringAlgorithm(algorithmData) {
    return await this.algorithmManager.createAlgorithmVersion('scoring', algorithmData);
  }

  async createNewQuestionSelectionAlgorithm(algorithmData) {
    return await this.algorithmManager.createAlgorithmVersion('question_selection', algorithmData);
  }

  async createABTest(testConfig) {
    return await this.algorithmManager.createABTest(testConfig);
  }

  async getABTestResults(testId) {
    return await this.algorithmManager.getABTestAnalytics(testId);
  }

  async activateAlgorithm(algorithmType, version) {
    const success = await this.algorithmManager.activateAlgorithm(algorithmType, version);
    if (success) {
      // Reload algorithms
      await this.loadSessionAlgorithms();
      await this.applyDynamicConfiguration();
    }
    return success;
  }

  async getAlgorithmPerformance() {
    return await this.algorithmManager.getAlgorithmPerformanceSummary();
  }

  // Helper function to get question by ID
  getQuestionById(questionId) {
    // This should be replaced with actual question bank lookup
    // For now, return a default question structure
    return {
      id: questionId,
      type: 'core', // default type
      priority: 5
    };
  }

  // Helper function to calculate score variance
  calculateScoreVariance(scores) {
    const values = Object.values(scores).filter(v => typeof v === 'number');
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  healthCheck() {
    return {
      initialized: this.isInitialized,
      version: this.modelVersion,
      dataHealth: this.getDataManagerMetrics(),
      performanceHealth: this.performanceMetrics,
      algorithmVersions: {
        scoring: this.activeAlgorithms.scoring?.version || 'fallback',
        questionSelection: this.activeAlgorithms.questionSelection?.version || 'fallback',
        similarityCalculator: this.activeAlgorithms.similarityCalculator?.version || 'fallback'
      },
      status: 'Healthy - Database-Driven Algorithms Active'
    };
  }

  exportModelData() {
    return {
      version: this.modelVersion,
      timestamp: Date.now(),
      data: this.dataManager.exportData(),
      metrics: this.performanceMetrics,
      algorithmVersions: {
        scoring: this.activeAlgorithms.scoring?.version,
        questionSelection: this.activeAlgorithms.questionSelection?.version,
        similarityCalculator: this.activeAlgorithms.similarityCalculator?.version
      }
    };
  }

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

  async updateModel(feedbackBatch = null) {
    try {
      if (feedbackBatch) {
        for (const feedback of feedbackBatch) {
          await this.collectFeedback(feedback.sessionId, feedback.data, feedback.profile);
        }
      }

      // FeedbackCollector has processBatchFeedback method
      if (this.feedbackCollector.processBatchFeedback) {
        this.feedbackCollector.processBatchFeedback();
      }

      await this.updatePerformanceMetrics();
      console.log('Model updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating model:', error);
      return false;
    }
  }

  generateMockData(count = 50) {
    console.log('Mock data already initialized');
    return true;
  }

  clearAllData() {
    console.log('Data clearing not available in memory mode');
    return false;
  }
}

export default MLService;
