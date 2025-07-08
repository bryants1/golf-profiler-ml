// RecommendationEngine.js - ML-enhanced recommendation generation
import { ML_CONFIG, PROFILE_LABELS } from './MLConfig.js';

export class RecommendationEngine {
  constructor(similarityCalculator, dataManager) {
    this.similarityCalculator = similarityCalculator;
    this.dataManager = dataManager;
  }

  // Generate enhanced recommendations using ML insights
  generateEnhancedRecommendations(currentScores, currentProfile, similarProfiles) {
    const baseRecommendations = currentProfile.recommendations;

    if (similarProfiles.length < ML_CONFIG.MIN_SIMILAR_PROFILES) {
      return {
        ...baseRecommendations,
        mlEnhanced: false,
        confidence: 'Low - Insufficient data',
        explanation: 'Using rule-based recommendations due to limited similar profiles'
      };
    }

    const mlRecommendations = {
      courseStyle: this.recommendCourseStyle(currentScores, similarProfiles),
      budgetLevel: this.recommendBudgetLevel(currentScores, similarProfiles),
      amenities: this.recommendAmenities(currentScores, similarProfiles),
      lodging: this.recommendLodging(currentScores, similarProfiles),
      playingTimes: this.recommendPlayingTimes(currentScores, similarProfiles),
      groupSize: this.recommendGroupSize(currentScores, similarProfiles),
      seasonalPreferences: this.recommendSeasonalPreferences(similarProfiles),
      equipmentSuggestions: this.recommendEquipment(currentScores, similarProfiles)
    };

    return {
      ...baseRecommendations,
      ...mlRecommendations,
      mlEnhanced: true,
      confidence: this.calculateConfidence(similarProfiles),
      explanation: this.generateExplanation(similarProfiles, mlRecommendations),
      alternativeOptions: this.generateAlternatives(currentScores, similarProfiles)
    };
  }

  // Course style recommendations with ML
  recommendCourseStyle(currentScores, similarProfiles) {
    const courseStyleVotes = {};
    const styleWeights = this.calculateStyleWeights(currentScores);

    // Aggregate preferences from similar users
    similarProfiles.forEach(profile => {
      const weight = profile.similarity;
      const userCourseStyle = profile.profile?.recommendations?.courseStyle ||
                             Object.keys(profile.scores.courseStyle || {})[0] ||
                             'parkland';

      courseStyleVotes[userCourseStyle] = (courseStyleVotes[userCourseStyle] || 0) + weight;
    });

    // Apply style weights based on user characteristics
    Object.keys(courseStyleVotes).forEach(style => {
      courseStyleVotes[style] *= (styleWeights[style] || 1);
    });

    const recommendedStyle = Object.entries(courseStyleVotes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'parkland';

    return {
      primary: recommendedStyle,
      alternatives: Object.entries(courseStyleVotes)
        .sort(([,a], [,b]) => b - a)
        .slice(1, 3)
        .map(([style]) => style),
      reasoning: this.explainCourseStyleChoice(recommendedStyle, currentScores)
    };
  }

  // Budget level recommendations
  recommendBudgetLevel(currentScores, similarProfiles) {
    const budgetVotes = { low: 0, medium: 0, high: 0 };

    similarProfiles.forEach(profile => {
      const weight = profile.similarity;
      const luxuryScore = profile.scores.luxuryLevel || 0;

      if (luxuryScore <= 3) budgetVotes.low += weight;
      else if (luxuryScore <= 7) budgetVotes.medium += weight;
      else budgetVotes.high += weight;
    });

    // Adjust based on current user's luxury level
    const userLuxury = currentScores.luxuryLevel || 0;
    if (userLuxury <= 3) budgetVotes.low *= 1.5;
    else if (userLuxury <= 7) budgetVotes.medium *= 1.5;
    else budgetVotes.high *= 1.5;

    const recommended = Object.entries(budgetVotes)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      primary: PROFILE_LABELS.budgetLevels[recommended],
      priceRange: this.getPriceRange(recommended),
      flexibility: this.calculateBudgetFlexibility(budgetVotes),
      reasoning: `Based on ${similarProfiles.length} similar golfers and your luxury preferences`
    };
  }

  // Amenity recommendations
  recommendAmenities(currentScores, similarProfiles) {
    const amenityScores = {};
    const allAmenities = [
      'Driving range', 'Practice greens', 'Pro shop', 'Dining',
      'Bar/restaurant', 'Cart rental', 'Club rental', 'Lessons',
      'Spa services', 'Event spaces', 'Locker rooms', 'Bag storage'
    ];

    // Initialize scores
    allAmenities.forEach(amenity => amenityScores[amenity] = 0);

    // Score amenities based on similar users
    similarProfiles.forEach(profile => {
      const weight = profile.similarity;
      const userAmenities = profile.profile?.recommendations?.amenities || [];

      userAmenities.forEach(amenity => {
        if (amenityScores.hasOwnProperty(amenity)) {
          amenityScores[amenity] += weight;
        }
      });
    });

    // Boost scores based on user characteristics
    const amenityImportance = currentScores.amenityImportance || 0;
    const socialness = currentScores.socialness || 0;
    const luxuryLevel = currentScores.luxuryLevel || 0;

    if (amenityImportance >= 6) {
      amenityScores['Driving range'] *= 1.3;
      amenityScores['Practice greens'] *= 1.3;
    }

    if (socialness >= 7) {
      amenityScores['Bar/restaurant'] *= 1.4;
      amenityScores['Event spaces'] *= 1.2;
    }

    if (luxuryLevel >= 7) {
      amenityScores['Spa services'] *= 1.3;
      amenityScores['Locker rooms'] *= 1.2;
    }

    const recommended = Object.entries(amenityScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([amenity]) => amenity);

    return {
      essential: recommended.slice(0, 3),
      nice_to_have: recommended.slice(3),
      reasoning: this.explainAmenityChoices(recommended, currentScores)
    };
  }

  // Playing time recommendations
  recommendPlayingTimes(currentScores, similarProfiles) {
    const timePreferences = {};
    const pace = currentScores.pace || 0;
    const competitiveness = currentScores.competitiveness || 0;

    // Analyze patterns from similar users
    similarProfiles.forEach(profile => {
      const userPace = profile.scores.pace || 0;
      const userComp = profile.scores.competitiveness || 0;

      if (userPace >= 7 || userComp >= 7) {
        timePreferences['Early morning'] = (timePreferences['Early morning'] || 0) + profile.similarity;
      } else if (userPace <= 3) {
        timePreferences['Afternoon/twilight'] = (timePreferences['Afternoon/twilight'] || 0) + profile.similarity;
      } else {
        timePreferences['Mid-morning'] = (timePreferences['Mid-morning'] || 0) + profile.similarity;
      }
    });

    const recommended = Object.entries(timePreferences)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Mid-morning';

    return {
      optimal: recommended,
      reasoning: this.explainTimeChoice(recommended, pace, competitiveness),
      alternatives: Object.keys(timePreferences).filter(time => time !== recommended)
    };
  }

  // Group size recommendations
  recommendGroupSize(currentScores, similarProfiles) {
    const socialness = currentScores.socialness || 0;
    const competitiveness = currentScores.competitiveness || 0;

    let recommendedSize;
    if (socialness >= 8) recommendedSize = 'Large groups (6+ people)';
    else if (socialness >= 5) recommendedSize = 'Foursomes';
    else if (socialness >= 3) recommendedSize = 'Twosomes/threesomes';
    else recommendedSize = 'Solo play';

    // Adjust based on similar users
    const groupSizes = similarProfiles.map(p => {
      const soc = p.scores.socialness || 0;
      if (soc >= 8) return 'large';
      if (soc >= 5) return 'foursome';
      if (soc >= 3) return 'small';
      return 'solo';
    });

    const groupMode = this.findMode(groupSizes);

    return {
      recommended: recommendedSize,
      confidence: this.calculateGroupSizeConfidence(socialness, groupSizes),
      reasoning: `Based on your social preferences and ${similarProfiles.length} similar golfers`
    };
  }

  // Seasonal preferences
  recommendSeasonalPreferences(similarProfiles) {
    const seasonalData = this.analyzeSeasonalPatterns(similarProfiles);

    return {
      peakSeason: seasonalData.mostPopular,
      shoulderSeason: seasonalData.moderate,
      avoidSeason: seasonalData.leastPopular,
      reasoning: 'Based on when similar golfers are most active'
    };
  }

  // Equipment suggestions
  recommendEquipment(currentScores, similarProfiles) {
    const skillLevel = currentScores.skillLevel || 0;
    const competitiveness = currentScores.competitiveness || 0;
    const luxuryLevel = currentScores.luxuryLevel || 0;

    const suggestions = [];

    if (skillLevel <= 4) {
      suggestions.push('Game improvement irons', 'Forgiving driver', 'Hybrid clubs');
    } else if (skillLevel >= 7) {
      suggestions.push('Players irons', 'Blade putters', 'Tour-level balls');
    }

    if (competitiveness >= 7) {
      suggestions.push('GPS watch', 'Launch monitor access', 'Lesson packages');
    }

    if (luxuryLevel >= 7) {
      suggestions.push('Premium club fitting', 'Custom clubs', 'High-end accessories');
    }

    // Learn from similar users' implied equipment preferences
    const equipmentPatterns = this.analyzeEquipmentPatterns(similarProfiles);

    return {
      immediate: suggestions.slice(0, 3),
      future: suggestions.slice(3),
      trending: equipmentPatterns.trending,
      reasoning: this.explainEquipmentChoices(skillLevel, competitiveness, luxuryLevel)
    };
  }

  // Confidence calculation
  calculateConfidence(similarProfiles) {
    const count = similarProfiles.length;
    const avgSimilarity = similarProfiles.reduce((sum, p) => sum + p.similarity, 0) / count;

    if (count >= 10 && avgSimilarity >= 0.8) return 'Very High';
    if (count >= 7 && avgSimilarity >= 0.75) return 'High';
    if (count >= 5 && avgSimilarity >= 0.7) return 'Medium';
    if (count >= 3) return 'Low';
    return 'Very Low';
  }

  // Generate explanation
  generateExplanation(similarProfiles, recommendations) {
    const count = similarProfiles.length;
    const avgSimilarity = (similarProfiles.reduce((sum, p) => sum + p.similarity, 0) / count * 100).toFixed(0);

    return `Recommendations based on ${count} golfers with ${avgSimilarity}% similarity to your profile. ` +
           `Machine learning has identified patterns in preferences for golfers like you.`;
  }

  // Generate alternatives
  generateAlternatives(currentScores, similarProfiles) {
    // Find the second-most similar cluster of users
    const alternatives = {};

    // Alternative course styles
    const courseStyles = ['links', 'parkland', 'coastal', 'desert', 'mountain'];
    courseStyles.forEach(style => {
      const suitability = this.calculateStyleSuitability(style, currentScores);
      if (suitability > 0.6) {
        alternatives[style] = suitability;
      }
    });

    return {
      courseStyles: Object.entries(alternatives)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .map(([style, score]) => ({ style, confidence: score })),
      reasoning: 'Alternative options based on your profile flexibility'
    };
  }

  // Helper methods
  calculateStyleWeights(scores) {
    return {
      'links': scores.traditionalism >= 8 ? 1.3 : 0.8,
      'parkland': scores.traditionalism >= 6 ? 1.2 : 1.0,
      'coastal': scores.luxuryLevel >= 7 ? 1.4 : 1.0,
      'desert': scores.skillLevel >= 6 ? 1.2 : 0.9,
      'mountain': scores.amenityImportance >= 6 ? 1.1 : 1.0
    };
  }

  explainCourseStyleChoice(style, scores) {
    const explanations = {
      'links': 'Traditional, challenging courses that test skill and shot-making',
      'parkland': 'Classic tree-lined courses with strategic play',
      'coastal': 'Scenic ocean courses with premium experiences',
      'desert': 'Unique landscapes with creative course design',
      'mountain': 'Elevated courses with dramatic views and amenities'
    };
    return explanations[style] || 'Balanced course design suitable for your preferences';
  }

  getPriceRange(budgetLevel) {
    const ranges = {
      low: '$25-50',
      medium: '$50-100',
      high: '$100+'
    };
    return ranges[budgetLevel] || '$50-100';
  }

  calculateBudgetFlexibility(budgetVotes) {
    const total = Object.values(budgetVotes).reduce((a, b) => a + b, 0);
    const entropy = Object.values(budgetVotes).reduce((entropy, votes) => {
      if (votes === 0) return entropy;
      const p = votes / total;
      return entropy - p * Math.log2(p);
    }, 0);

    return entropy > 1.3 ? 'High' : entropy > 0.8 ? 'Medium' : 'Low';
  }

  explainAmenityChoices(amenities, scores) {
    let explanation = 'Selected based on similar golfers\' preferences';

    if (scores.amenityImportance >= 6) {
      explanation += ' and your high priority on practice facilities';
    }
    if (scores.socialness >= 7) {
      explanation += ' and your social playing style';
    }
    if (scores.luxuryLevel >= 7) {
      explanation += ' and your preference for premium experiences';
    }

    return explanation;
  }

  explainTimeChoice(time, pace, competitiveness) {
    if (time === 'Early morning') {
      return 'Recommended for serious players who prefer faster pace and better course conditions';
    } else if (time === 'Afternoon/twilight') {
      return 'Ideal for relaxed rounds with discounted rates';
    } else {
      return 'Balanced timing for most golfers with good pace and conditions';
    }
  }

  calculateGroupSizeConfidence(socialness, groupSizes) {
    const consistency = groupSizes.filter(size => {
      if (socialness >= 7) return size === 'foursome' || size === 'large';
      if (socialness >= 4) return size === 'foursome' || size === 'small';
      return size === 'small' || size === 'solo';
    }).length / groupSizes.length;

    return consistency > 0.7 ? 'High' : consistency > 0.5 ? 'Medium' : 'Low';
  }

  analyzeSeasonalPatterns(similarProfiles) {
    // Simulate seasonal analysis (in real implementation, would use timestamp data)
    return {
      mostPopular: 'Spring/Fall',
      moderate: 'Summer',
      leastPopular: 'Winter'
    };
  }

  analyzeEquipmentPatterns(similarProfiles) {
    // Analyze equipment trends from similar users
    return {
      trending: ['GPS watches', 'Hybrid clubs', 'Premium balls']
    };
  }

  explainEquipmentChoices(skill, competitiveness, luxury) {
    let explanation = 'Equipment suggestions based on your ';
    const factors = [];

    if (skill <= 4) factors.push('developing skill level');
    else if (skill >= 7) factors.push('advanced skill level');

    if (competitiveness >= 7) factors.push('competitive nature');
    if (luxury >= 7) factors.push('preference for premium products');

    return explanation + factors.join(' and ');
  }

  calculateStyleSuitability(style, scores) {
    const suitabilityScores = {
      'links': (scores.traditionalism + scores.skillLevel) / 20,
      'parkland': (scores.traditionalism + 5) / 15,
      'coastal': (scores.luxuryLevel + scores.amenityImportance) / 20,
      'desert': (scores.skillLevel + scores.competitiveness) / 20,
      'mountain': (scores.luxuryLevel + scores.amenityImportance) / 20
    };

    return Math.min(1, suitabilityScores[style] || 0.5);
  }

  findMode(array) {
    const frequency = {};
    array.forEach(item => frequency[item] = (frequency[item] || 0) + 1);
    return Object.entries(frequency).sort(([,a], [,b]) => b - a)[0]?.[0];
  }
}

export default RecommendationEngine;
