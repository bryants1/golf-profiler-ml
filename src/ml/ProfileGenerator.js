// ProfileGenerator.js - ML-Enhanced Profile Generation
import { ML_CONFIG, PROFILE_LABELS } from './MLConfig.js';

export class ProfileGenerator {
  constructor(similarityCalculator, recommendationEngine, dataManager) {
    this.similarityCalculator = similarityCalculator;
    this.recommendationEngine = recommendationEngine;
    this.dataManager = dataManager;
  }

  // Main profile generation method
  generateProfile(answers, scores, sessionId, enhancementLevel = 'full') {
    // Generate base profile using rule-based logic
    const baseProfile = this.generateBaseProfile(scores);

    // Enhance with ML if we have enough data
    if (enhancementLevel === 'full' || enhancementLevel === 'ml_only') {
      const similarProfiles = this.findSimilarProfiles(scores);
      const enhancedProfile = this.enhanceProfileWithML(baseProfile, scores, similarProfiles);

      // Add confidence and explanation
      enhancedProfile.mlMetadata = this.generateMLMetadata(similarProfiles, scores);

      return enhancedProfile;
    }

    return baseProfile;
  }

  // Generate base profile using rule-based logic
  generateBaseProfile(scores) {
    return {
      skillLevel: this.generateSkillLevel(scores),
      personality: this.generatePersonalityType(scores),
      preferences: this.generatePreferences(scores),
      recommendations: this.generateBaseRecommendations(scores),
      demographics: this.generateDemographics(scores),
      psychographics: this.generatePsychographics(scores),
      playingStyle: this.generatePlayingStyle(scores)
    };
  }

  // Enhanced skill level assessment
  generateSkillLevel(scores) {
    const skillScore = scores.skillLevel || 0;
    const competitiveness = scores.competitiveness || 0;
    const traditionalism = scores.traditionalism || 0;

    // Adjust skill assessment based on multiple factors
    let adjustedSkill = skillScore;

    // High competitiveness often correlates with skill
    if (competitiveness >= 8) adjustedSkill += 1;

    // High traditionalism might indicate experience
    if (traditionalism >= 8) adjustedSkill += 0.5;

    // Clamp to valid range
    adjustedSkill = Math.max(0, Math.min(10, adjustedSkill));

    const baseLabel = this.getSkillLabel(adjustedSkill);

    return {
      numeric: adjustedSkill,
      label: baseLabel,
      confidence: this.calculateSkillConfidence(scores),
      details: this.generateSkillDetails(adjustedSkill, scores),
      trajectory: this.predictSkillTrajectory(scores)
    };
  }

  // Enhanced personality assessment
  generatePersonalityType(scores) {
    const personalityScores = this.calculatePersonalityScores(scores);
    const primaryType = this.determinePrimaryPersonalityType(personalityScores);
    const secondaryTraits = this.identifySecondaryTraits(personalityScores);

    return {
      primary: primaryType,
      secondary: secondaryTraits,
      scores: personalityScores,
      archetype: this.determineGolferArchetype(scores),
      motivations: this.identifyMotivations(scores),
      socialStyle: this.determineSocialStyle(scores)
    };
  }

  // Generate comprehensive preferences
  generatePreferences(scores) {
    const corePreferences = this.generateCorePreferences(scores);
    const contextualPreferences = this.generateContextualPreferences(scores);
    const temporalPreferences = this.generateTemporalPreferences(scores);

    return {
      core: corePreferences,
      contextual: contextualPreferences,
      temporal: temporalPreferences,
      flexibility: this.calculatePreferenceFlexibility(scores),
      priorities: this.rankPreferencePriorities(scores)
    };
  }

  // Generate enhanced recommendations
  generateBaseRecommendations(scores) {
    return {
      courseStyle: this.recommendCourseStyle(scores),
      budgetLevel: this.recommendBudgetLevel(scores),
      amenities: this.recommendAmenities(scores),
      lodging: this.recommendLodging(scores),
      timing: this.recommendTiming(scores),
      companions: this.recommendCompanions(scores),
      equipment: this.recommendEquipment(scores),
      learning: this.recommendLearningPath(scores)
    };
  }

  // Generate demographics with privacy considerations
  generateDemographics(scores) {
    return {
      estimatedAgeRange: this.estimateAgeRange(scores.ageGeneration || 0),
      preferenceStyle: this.analyzePreferenceStyle(scores.genderLean || 0),
      experienceLevel: this.assessExperienceLevel(scores),
      lifestyleSegment: this.determineLifestyleSegment(scores),
      spendingPattern: this.analyzeSpendingPattern(scores)
    };
  }

  // Generate psychographic profile
  generatePsychographics(scores) {
    return {
      values: this.identifyValues(scores),
      attitudes: this.assessAttitudes(scores),
      interests: this.inferInterests(scores),
      lifestyle: this.analyzeLifestyle(scores),
      decisionMaking: this.analyzeDecisionMakingStyle(scores)
    };
  }

  // Generate playing style analysis
  generatePlayingStyle(scores) {
    return {
      approach: this.determinePlayingApproach(scores),
      pace: this.analyzePreferredPace(scores),
      focus: this.identifyPlayingFocus(scores),
      preparation: this.analyzePreparationStyle(scores),
      postRound: this.analyzePostRoundBehavior(scores)
    };
  }

  // ML Enhancement Methods
  enhanceProfileWithML(baseProfile, scores, similarProfiles) {
    if (similarProfiles.length < ML_CONFIG.MIN_SIMILAR_PROFILES) {
      return {
        ...baseProfile,
        mlEnhanced: false,
        enhancementLevel: 'none'
      };
    }

    // Get ML-enhanced recommendations
    const enhancedRecommendations = this.recommendationEngine.generateEnhancedRecommendations(
      scores,
      baseProfile,
      similarProfiles
    );

    // Enhance personality insights
    const enhancedPersonality = this.enhancePersonalityWithML(baseProfile.personality, similarProfiles);

    // Enhance preferences
    const enhancedPreferences = this.enhancePreferencesWithML(baseProfile.preferences, similarProfiles);

    // Generate ML-specific insights
    const mlInsights = this.generateMLInsights(scores, similarProfiles);

    return {
      ...baseProfile,
      personality: enhancedPersonality,
      preferences: enhancedPreferences,
      recommendations: enhancedRecommendations,
      mlInsights: mlInsights,
      mlEnhanced: true,
      enhancementLevel: 'full'
    };
  }

  // Find similar profiles for ML enhancement
  findSimilarProfiles(scores) {
    const allProfiles = this.dataManager.getProfiles();

    return this.similarityCalculator.findSimilarProfiles(
      scores,
      allProfiles,
      {
        threshold: ML_CONFIG.SIMILARITY_THRESHOLD,
        maxResults: ML_CONFIG.MAX_SIMILAR_PROFILES,
        minResults: ML_CONFIG.MIN_SIMILAR_PROFILES,
        diversityFactor: 0.15 // Add some diversity to avoid echo chambers
      }
    );
  }

  // MISSING METHODS - Now properly added to the class:

  generateContextualPreferences(scores) {
    return {
      weatherPreferences: this.inferWeatherPreferences(scores),
      crowdingTolerance: this.assessCrowdingTolerance(scores),
      difficultyPreference: this.assessDifficultyPreference(scores),
      serviceLevel: this.assessServiceLevelPreference(scores)
    };
  }

  generateTemporalPreferences(scores) {
    return {
      timeOfDay: this.inferTimePreferences(scores),
      seasonality: this.inferSeasonalPreferences(scores),
      frequency: this.inferPlayingFrequency(scores),
      duration: this.inferPreferredDuration(scores)
    };
  }

  inferWeatherPreferences(scores) {
    return scores.luxuryLevel >= 7 ? "Mild, pleasant conditions preferred" : "Adaptable to various weather";
  }

  assessCrowdingTolerance(scores) {
    return scores.socialness >= 7 ? "Comfortable with crowds" : "Prefers quieter settings";
  }

  assessDifficultyPreference(scores) {
    const skill = scores.skillLevel || 0;
    const competitive = scores.competitiveness || 0;

    if (skill >= 7 && competitive >= 7) return "Challenging courses preferred";
    if (skill <= 4) return "Beginner-friendly courses preferred";
    return "Moderate difficulty preferred";
  }

  assessServiceLevelPreference(scores) {
    if (scores.luxuryLevel >= 8) return "Premium, personalized service";
    if (scores.luxuryLevel >= 5) return "Professional, attentive service";
    return "Friendly, basic service";
  }

  inferTimePreferences(scores) {
    const pace = scores.pace || 0;
    const competitive = scores.competitiveness || 0;

    if (pace >= 7 || competitive >= 7) return "Early morning (faster pace, better conditions)";
    if (pace <= 3) return "Afternoon/twilight (relaxed, discounted)";
    return "Mid-morning (balanced timing)";
  }

  inferSeasonalPreferences(scores) {
    if (scores.luxuryLevel >= 7) return "Peak season (best conditions)";
    if (scores.socialness >= 7) return "Active season (more players, events)";
    return "Shoulder season (good value, moderate crowds)";
  }

  inferPlayingFrequency(scores) {
    const competitive = scores.competitiveness || 0;
    const amenity = scores.amenityImportance || 0;

    if (competitive >= 8 && amenity >= 7) return "Weekly or more (serious improvement focus)";
    if (competitive >= 5) return "Bi-weekly (regular practice and play)";
    return "Monthly or less (casual enjoyment)";
  }

  inferPreferredDuration(scores) {
    const social = scores.socialness || 0;
    const pace = scores.pace || 0;

    if (social >= 8) return "Full day experience (18 holes + social time)";
    if (pace >= 7) return "Efficient 18 holes (under 4 hours)";
    return "Flexible timing (9 or 18 holes)";
  }

  assessExperienceLevel(scores) {
    const skill = scores.skillLevel || 0;
    const traditional = scores.traditionalism || 0;

    if (skill >= 8 && traditional >= 7) return "Experienced traditionalist";
    if (skill >= 6) return "Solid intermediate player";
    if (skill <= 3) return "Enthusiastic beginner";
    return "Developing player";
  }

  determineLifestyleSegment(scores) {
    const luxury = scores.luxuryLevel || 0;
    const social = scores.socialness || 0;

    if (luxury >= 8 && social >= 7) return "Luxury social golfer";
    if (luxury >= 6) return "Premium experience seeker";
    if (social >= 7) return "Social community player";
    return "Practical value-conscious golfer";
  }

  analyzeSpendingPattern(scores) {
    const luxury = scores.luxuryLevel || 0;
    const amenity = scores.amenityImportance || 0;

    if (luxury >= 8) return "Premium spending on quality experiences";
    if (luxury >= 5 && amenity >= 6) return "Selective spending on important features";
    return "Value-conscious with selective upgrades";
  }

  identifyValues(scores) {
    const values = [];
    if (scores.traditionalism >= 7) values.push("Tradition and heritage");
    if (scores.competitiveness >= 7) values.push("Achievement and excellence");
    if (scores.socialness >= 7) values.push("Community and relationships");
    if (scores.luxuryLevel >= 7) values.push("Quality and prestige");
    if (values.length === 0) values.push("Fun and enjoyment");
    return values;
  }

  assessAttitudes(scores) {
    const attitudes = [];
    if (scores.competitiveness >= 7) attitudes.push("Goal-oriented and driven");
    if (scores.socialness >= 7) attitudes.push("Collaborative and outgoing");
    if (scores.traditionalism >= 7) attitudes.push("Respectful of golf traditions");
    if (scores.pace >= 6) attitudes.push("Efficient and time-conscious");
    return attitudes;
  }

  inferInterests(scores) {
    const interests = [];
    if (scores.amenityImportance >= 6) interests.push("Golf instruction and improvement");
    if (scores.socialness >= 7) interests.push("Golf events and tournaments");
    if (scores.luxuryLevel >= 7) interests.push("Premium golf destinations");
    if (scores.traditionalism >= 7) interests.push("Golf history and classic courses");
    return interests;
  }

  analyzeLifestyle(scores) {
    const social = scores.socialness || 0;
    const luxury = scores.luxuryLevel || 0;
    const pace = scores.pace || 0;

    if (luxury >= 7 && social >= 6) return "Upscale social lifestyle";
    if (pace >= 7) return "Active, scheduled lifestyle";
    if (social >= 7) return "Community-oriented lifestyle";
    return "Balanced, flexible lifestyle";
  }

  analyzeDecisionMakingStyle(scores) {
    const competitive = scores.competitiveness || 0;
    const traditional = scores.traditionalism || 0;

    if (competitive >= 7) return "Data-driven and performance-focused";
    if (traditional >= 7) return "Careful and tradition-guided";
    if (scores.socialness >= 7) return "Collaborative and consensus-seeking";
    return "Practical and flexible";
  }

  determinePlayingApproach(scores) {
    const competitive = scores.competitiveness || 0;
    const social = scores.socialness || 0;

    if (competitive >= 8) return "Serious and strategic";
    if (social >= 8) return "Fun and social-focused";
    if (scores.traditionalism >= 7) return "Traditional and respectful";
    return "Relaxed and enjoyable";
  }

  analyzePreferredPace(scores) {
    const pace = scores.pace || 0;
    const competitive = scores.competitiveness || 0;

    if (pace >= 7 || competitive >= 7) return "Brisk and efficient";
    if (pace <= 3) return "Leisurely and relaxed";
    return "Moderate and flexible";
  }

  identifyPlayingFocus(scores) {
    const competitive = scores.competitiveness || 0;
    const social = scores.socialness || 0;
    const skill = scores.skillLevel || 0;

    if (competitive >= 7 && skill >= 6) return "Score improvement and competition";
    if (social >= 7) return "Social interaction and fun";
    if (skill <= 4) return "Learning and skill development";
    return "Overall enjoyment and relaxation";
  }

  analyzePreparationStyle(scores) {
    const amenity = scores.amenityImportance || 0;
    const competitive = scores.competitiveness || 0;

    if (competitive >= 7 && amenity >= 6) return "Thorough preparation with practice";
    if (amenity >= 6) return "Some warm-up and preparation";
    return "Minimal preparation, casual approach";
  }

  analyzePostRoundBehavior(scores) {
    const social = scores.socialness || 0;
    const competitive = scores.competitiveness || 0;

    if (social >= 7) return "Social time at 19th hole";
    if (competitive >= 7) return "Score analysis and practice planning";
    return "Quick wrap-up and departure";
  }

  // Helper methods for profile generation
  getSkillLabel(skillScore) {
    if (skillScore <= 2) return "New to Golf";
    if (skillScore <= 4) return "Recreational Player";
    if (skillScore <= 6) return "Regular Golfer";
    if (skillScore <= 8) return "Serious Player";
    return "Advanced Golfer";
  }

  calculateSkillConfidence(scores) {
    const indicators = ['skillLevel', 'competitiveness', 'traditionalism'];
    const nonZeroIndicators = indicators.filter(ind => (scores[ind] || 0) > 0).length;
    return Math.min(1.0, nonZeroIndicators / indicators.length);
  }

  generateSkillDetails(skillLevel, scores) {
    const details = [];

    if (skillLevel <= 4) {
      details.push("Focus on fundamentals and course management");
      if (scores.competitiveness >= 6) {
        details.push("Competitive drive will accelerate improvement");
      }
    } else if (skillLevel >= 7) {
      details.push("Advanced player with refined skills");
      if (scores.traditionalism >= 7) {
        details.push("Appreciates traditional aspects of the game");
      }
    }

    return details;
  }

  predictSkillTrajectory(scores) {
    const competitiveness = scores.competitiveness || 0;
    const amenityImportance = scores.amenityImportance || 0;

    if (competitiveness >= 7 && amenityImportance >= 6) {
      return "Rapid improvement expected with practice focus";
    } else if (competitiveness >= 5) {
      return "Steady improvement with regular play";
    } else {
      return "Casual improvement focused on enjoyment";
    }
  }

  calculatePersonalityScores(scores) {
    return {
      social_orientation: (scores.socialness || 0) / 10,
      competitive_drive: (scores.competitiveness || 0) / 10,
      tradition_affinity: (scores.traditionalism || 0) / 10,
      luxury_preference: (scores.luxuryLevel || 0) / 10,
      pace_preference: (scores.pace || 0) / 10,
      structure_preference: (scores.amenityImportance || 0) / 10
    };
  }

  determinePrimaryPersonalityType(personalityScores) {
    if (personalityScores.social_orientation >= 0.7 && personalityScores.competitive_drive <= 0.4) {
      return "Social & Fun-Focused";
    } else if (personalityScores.competitive_drive >= 0.7 && personalityScores.tradition_affinity >= 0.6) {
      return "Competitive Traditionalist";
    } else if (personalityScores.social_orientation >= 0.7 && personalityScores.luxury_preference >= 0.6) {
      return "Social Luxury Seeker";
    } else if (personalityScores.competitive_drive <= 0.3 && personalityScores.social_orientation <= 0.4) {
      return "Peaceful Solo Player";
    } else if (personalityScores.tradition_affinity >= 0.8) {
      return "Golf Purist";
    } else {
      return "Balanced Enthusiast";
    }
  }

  identifySecondaryTraits(personalityScores) {
    const traits = [];

    if (personalityScores.pace_preference >= 0.7) traits.push("Fast-paced");
    if (personalityScores.structure_preference >= 0.7) traits.push("Detail-oriented");
    if (personalityScores.luxury_preference >= 0.7) traits.push("Quality-focused");
    if (personalityScores.tradition_affinity >= 0.7) traits.push("Traditional");

    return traits;
  }

  determineGolferArchetype(scores) {
    const social = scores.socialness || 0;
    const skill = scores.skillLevel || 0;
    const luxury = scores.luxuryLevel || 0;
    const competitive = scores.competitiveness || 0;

    if (social >= 8 && luxury >= 7) return "Country Club Social";
    if (skill >= 8 && competitive >= 8) return "Serious Competitor";
    if (luxury <= 3 && social >= 6) return "Municipal Regular";
    if (skill <= 4 && social >= 7) return "Social Beginner";
    if (competitive <= 3 && luxury >= 6) return "Leisure Luxury";

    return "Balanced Player";
  }

  identifyMotivations(scores) {
    const motivations = [];

    if (scores.competitiveness >= 7) motivations.push("Achievement and improvement");
    if (scores.socialness >= 7) motivations.push("Social connection and networking");
    if (scores.luxuryLevel >= 7) motivations.push("Premium experiences and status");
    if (scores.traditionalism >= 7) motivations.push("Heritage and tradition");
    if (scores.pace <= 3) motivations.push("Relaxation and escape");

    return motivations;
  }

  determineSocialStyle(scores) {
    const social = scores.socialness || 0;
    const competitive = scores.competitiveness || 0;

    if (social >= 8) return "Highly social - enjoys groups and events";
    if (social >= 5 && competitive >= 6) return "Competitive social - enjoys friendly competition";
    if (social >= 5) return "Moderately social - prefers smaller groups";
    if (social <= 3) return "Independent - prefers solo or intimate play";

    return "Flexible social style";
  }

  generateCorePreferences(scores) {
    const preferences = [];

    if (scores.amenityImportance >= 6) preferences.push("High-quality practice facilities");
    if (scores.luxuryLevel >= 7) preferences.push("Premium course conditions and service");
    if (scores.socialness >= 7) preferences.push("Social atmosphere and group activities");
    if (scores.competitiveness >= 7) preferences.push("Challenging courses and competitive play");
    if (scores.traditionalism >= 7) preferences.push("Classic course design and golf traditions");
    if (scores.pace >= 6) preferences.push("Efficient pace of play");

    return preferences;
  }

  calculatePreferenceFlexibility(scores) {
    const extremeScores = ML_CONFIG.SIMILARITY_DIMENSIONS
      .map(dim => Math.abs((scores[dim] || 5) - 5))
      .filter(diff => diff > 3).length;

    const totalDimensions = ML_CONFIG.SIMILARITY_DIMENSIONS.length;
    const flexibility = 1 - (extremeScores / totalDimensions);

    return {
      score: flexibility,
      level: flexibility > 0.7 ? 'High' : flexibility > 0.4 ? 'Medium' : 'Low',
      reasoning: `Based on ${extremeScores} strongly defined preferences out of ${totalDimensions} dimensions`
    };
  }

  rankPreferencePriorities(scores) {
    const priorities = [];

    const dimensionPriorities = [
      { name: 'Course Quality', score: scores.luxuryLevel || 0 },
      { name: 'Social Experience', score: scores.socialness || 0 },
      { name: 'Skill Development', score: scores.competitiveness || 0 },
      { name: 'Value/Budget', score: 10 - (scores.luxuryLevel || 5) },
      { name: 'Tradition/Heritage', score: scores.traditionalism || 0 },
      { name: 'Convenience/Pace', score: scores.pace || 0 }
    ];

    return dimensionPriorities
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(p => p.name);
  }

  // Simplified implementations for remaining methods
  recommendCourseStyle(scores) {
    return Object.keys(scores.courseStyle || {}).length > 0 ?
      Object.entries(scores.courseStyle).sort(([,a], [,b]) => b - a)[0][0] :
      scores.traditionalism >= 7 ? "Classic parkland" : "Resort-style";
  }

  recommendBudgetLevel(scores) {
    return scores.luxuryLevel >= 7 ? "Premium ($100+)" :
           scores.luxuryLevel >= 4 ? "Mid-range ($50-100)" : "Value ($25-50)";
  }

  recommendAmenities(scores) {
    return scores.amenityImportance >= 6 ? ["Driving range", "Practice greens", "Pro shop", "Dining"] :
           scores.socialness >= 7 ? ["Bar/restaurant", "Event spaces"] : ["Basic facilities"];
  }

  recommendLodging(scores) {
    return scores.luxuryLevel >= 7 ? "Resort or boutique hotel" :
           scores.socialness >= 7 ? "Hotel with social areas" : "Comfortable, convenient location";
  }

  recommendTiming(scores) {
    return this.inferTimePreferences(scores);
  }

  recommendCompanions(scores) {
    if (scores.socialness >= 8) return "Large groups or events";
    if (scores.socialness >= 5) return "Foursomes with friends";
    return "Solo or small groups";
  }

  recommendEquipment(scores) {
    const suggestions = [];
    if (scores.skillLevel <= 4) suggestions.push("Game improvement clubs");
    if (scores.competitiveness >= 7) suggestions.push("Performance tracking tools");
    if (scores.luxuryLevel >= 7) suggestions.push("Premium equipment");
    return suggestions;
  }

  recommendLearningPath(scores) {
    if (scores.competitiveness >= 7) return "Structured lessons and practice";
    if (scores.socialness >= 7) return "Group lessons and playing partners";
    return "Casual improvement through play";
  }

  estimateAgeRange(ageGeneration) {
    return ageGeneration <= 3 ? "25-40" :
           ageGeneration <= 6 ? "35-55" : "45-65";
  }

  analyzePreferenceStyle(genderLean) {
    return Math.abs(genderLean) <= 1 ? "Neutral preferences" :
           genderLean > 1 ? "More traditional masculine preferences" :
           "More contemporary/feminine preferences";
  }

  // ML Enhancement Helper Methods (simplified versions)
  enhancePersonalityWithML(basePersonality, similarProfiles) {
    return {
      ...basePersonality,
      mlInsights: {
        similarUserCount: similarProfiles.length,
        confidence: this.calculatePersonalityConfidence(similarProfiles)
      }
    };
  }

  enhancePreferencesWithML(basePreferences, similarProfiles) {
    return {
      ...basePreferences,
      mlEnhanced: true,
      similarUserInsights: `Based on ${similarProfiles.length} similar golfers`
    };
  }

  generateMLInsights(scores, similarProfiles) {
    return {
      similarUserInsights: {
        count: similarProfiles.length,
        averageSimilarity: similarProfiles.reduce((sum, p) => sum + p.similarity, 0) / similarProfiles.length
      }
    };
  }

  generateMLMetadata(similarProfiles, scores) {
    return {
      dataQuality: similarProfiles.length >= 10 ? "High" : similarProfiles.length >= 5 ? "Medium" : "Low",
      confidence: this.calculateOverallConfidence(similarProfiles)
    };
  }

  calculatePersonalityConfidence(similarProfiles) {
    return similarProfiles.length >= 5 ? "High" : "Medium";
  }

  calculateOverallConfidence(similarProfiles) {
    const count = similarProfiles.length;
    const avgSimilarity = count > 0 ? similarProfiles.reduce((sum, p) => sum + p.similarity, 0) / count : 0;

    if (count >= 10 && avgSimilarity >= 0.8) return "Very High";
    if (count >= 7 && avgSimilarity >= 0.75) return "High";
    if (count >= 5 && avgSimilarity >= 0.7) return "Medium";
    return "Low";
  }
}

export default ProfileGenerator;
