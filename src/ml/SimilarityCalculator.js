// SimilarityCalculator.js - Advanced similarity calculations
import { ML_CONFIG } from './MLConfig.js';

export class SimilarityCalculator {
  constructor() {
    this.weights = this.calculateDimensionWeights();
    this.config = { SIMILARITY_THRESHOLD: 0.5, MAX_SIMILAR_PROFILES: 10 };
  }

  // MLService.js - Updated findSimilarProfilesForML method
  // Replace your existing findSimilarProfilesForML method with this enhanced version

  async findSimilarProfilesForML(userScores, sessionId = 'default') {
    try {
      // Load session algorithms if not already loaded
      if (!this.activeAlgorithms.similarityCalculator) {
        await this.loadSessionAlgorithms(sessionId);
      }

      const allProfiles = await this.dataManager.getProfiles();
      console.log(`🔍 Enhanced similarity search among ${allProfiles.length} total profiles`);
      console.log('🔧 Using similarity algorithm:', this.activeAlgorithms.similarityCalculator?.version || 'fallback');
      console.log('👤 User scores:', userScores);

      // Use enhanced progressive search with archetype validation
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
        // Log archetype distribution for debugging
        const targetArchetype = this.similarityCalculator.determineArchetype(userScores);
        const archetypeDistribution = {};

        similarProfiles.forEach(profile => {
          const archetype = profile.profileArchetype || 'unknown';
          archetypeDistribution[archetype] = (archetypeDistribution[archetype] || 0) + 1;
        });

        console.log(`🎯 Target archetype: ${targetArchetype.archetype} (${(targetArchetype.confidence * 100).toFixed(0)}% confidence)`);
        console.log(`📊 Found archetype distribution:`, archetypeDistribution);

        // Validate match quality
        const sameArchetypeCount = similarProfiles.filter(p =>
          p.profileArchetype === targetArchetype.archetype
        ).length;

        const matchQuality = sameArchetypeCount / similarProfiles.length;
        console.log(`✨ Match quality: ${(matchQuality * 100).toFixed(0)}% same archetype`);

        // Track similarity performance for A/B testing
        await this.trackSimilarityPerformance(sessionId, {
          targetArchetype: targetArchetype.archetype,
          profilesFound: similarProfiles.length,
          matchQuality,
          archetypeDistribution
        });

        return similarProfiles;
      } else {
        console.warn('⚠️ No similar profiles found with enhanced search');

        // Detailed debugging for no matches
        console.log('🔍 Running detailed similarity debug...');

        // Test against a few random profiles to understand why no matches
        const sampleProfiles = allProfiles.slice(0, 5);
        sampleProfiles.forEach((profile, index) => {
          console.log(`\n🧪 Debug similarity with sample profile ${index + 1}:`);
          this.similarityCalculator.debugSimilarityCalculation(userScores, profile.scores);
        });

        return [];
      }

    } catch (error) {
      console.error('❌ Error in enhanced similarity search:', error);
      console.error('Stack trace:', error.stack);
      return [];
    }
  }

  // Add this new method to track similarity performance
  async trackSimilarityPerformance(sessionId, performanceData) {
    try {
      if (!this.algorithmManager || !this.activeAlgorithms.similarityCalculator) {
        return;
      }

      // Track basic metrics
      await this.algorithmManager.trackPerformance(
        'similarity_calculator',
        this.activeAlgorithms.similarityCalculator.version,
        'profiles_found',
        performanceData.profilesFound
      );

      await this.algorithmManager.trackPerformance(
        'similarity_calculator',
        this.activeAlgorithms.similarityCalculator.version,
        'match_quality',
        performanceData.matchQuality
      );

      // Track archetype accuracy
      await this.algorithmManager.trackPerformance(
        'similarity_calculator',
        this.activeAlgorithms.similarityCalculator.version,
        'archetype_accuracy',
        performanceData.matchQuality > 0.5 ? 1 : 0
      );

      console.log(`📊 Tracked similarity performance: ${performanceData.profilesFound} profiles, ${(performanceData.matchQuality * 100).toFixed(0)}% quality`);

    } catch (error) {
      console.error('❌ Error tracking similarity performance:', error);
    }
  }

  // Enhanced testMLEnhancement method for better debugging
  async testMLEnhancement() {
    try {
      console.log('🧪 Testing enhanced ML system capabilities...');

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
        console.log('📊 Test scores:', scenario.scores);

        const allProfiles = await this.dataManager.getProfiles();
        const similarProfiles = this.similarityCalculator.findSimilarProfilesProgressive(
          scenario.scores,
          allProfiles,
          { debug: true }
        );

        console.log(`✅ Found ${similarProfiles.length} similar profiles for ${scenario.name}`);

        if (similarProfiles.length > 0) {
          const archetypes = similarProfiles.map(p => p.profileArchetype).filter(a => a);
          const uniqueArchetypes = [...new Set(archetypes)];
          console.log(`🎯 Archetype matches: ${uniqueArchetypes.join(', ')}`);

          // Show top 3 matches
          similarProfiles.slice(0, 3).forEach((profile, i) => {
            console.log(`  ${i + 1}. ${profile.profileArchetype} - ${(profile.similarity * 100).toFixed(1)}% similarity`);
          });
        }
      }

      console.log('✅ Enhanced ML testing completed');

    } catch (error) {
      console.error('❌ Error testing enhanced ML system:', error);
    }
  }

  // Enhanced getUserSimilarityInsights with archetype information
  async getUserSimilarityInsights(userScores, options = {}) {
    console.log('🔍 Enhanced getUserSimilarityInsights called');

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
      console.log('📊 Getting enhanced similarity insights...');

      const allProfiles = await this.dataManager.getProfiles();
      console.log('📊 Total profiles available:', allProfiles.length);

      // Determine user's archetype
      const userArchetype = this.similarityCalculator.determineArchetype(userScores);
      console.log(`🎯 User archetype: ${userArchetype.archetype} (${(userArchetype.confidence * 100).toFixed(0)}% confidence)`);

      // Find similar profiles with enhanced algorithm
      const similarProfiles = this.similarityCalculator.findSimilarProfilesProgressive(
        userScores,
        allProfiles,
        { ...options, debug: false }
      );

      console.log(`🔍 Found ${similarProfiles.length} enhanced similar profiles`);

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

        // Enhanced archetype insights
        archetype: {
          primary: userArchetype.archetype,
          confidence: userArchetype.confidence,
          sameArchetypeMatches: sameArchetypeProfiles.length,
          compatibleMatches: compatibleProfiles.length,
          matchQuality: similarProfiles.length > 0 ? compatibleProfiles.length / similarProfiles.length : 0
        }
      };

      console.log('✅ Enhanced similarity insights generated:', {
        similarUsers: result.similarUsers,
        archetype: result.archetype.primary,
        matchQuality: (result.archetype.matchQuality * 100).toFixed(0) + '%'
      });

      return result;

    } catch (error) {
      console.error('❌ Error getting enhanced similarity insights:', error);
      return {
        similarUsers: 0,
        averageSimilarity: 0,
        topMatches: [],
        userPercentiles: {},
        archetype: { primary: 'unknown', confidence: 0 }
      };
    }
  }

  // Main similarity calculation with multiple algorithms
  calculateSimilarity(scores1, scores2, algorithm = 'weighted_euclidean') {
    switch (algorithm) {
      case 'cosine':
        return this.cosineSimilarity(scores1, scores2);
      case 'manhattan':
        return this.manhattanSimilarity(scores1, scores2);
      case 'weighted_euclidean':
        return this.weightedEuclideanSimilarity(scores1, scores2);
      case 'pearson':
        return this.pearsonCorrelation(scores1, scores2);
      default:
        return this.weightedEuclideanSimilarity(scores1, scores2);
    }
  }

  // Weighted Euclidean distance (default, works well for golf profiles)
  weightedEuclideanSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    let sumSquaredDiffs = 0;
    let totalWeight = 0;

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const weight = this.weights[dim] || 1;

      const diff = (val1 - val2) / 10; // Normalize to 0-1
      sumSquaredDiffs += weight * (diff * diff);
      totalWeight += weight;
    });

    const euclideanDistance = Math.sqrt(sumSquaredDiffs / totalWeight);
    return Math.max(0, 1 - euclideanDistance); // Convert distance to similarity
  }

  // Cosine similarity - good for high-dimensional data
  cosineSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;

      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    });

    const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  // Manhattan distance similarity
  manhattanSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    let totalDiff = 0;

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      totalDiff += Math.abs(val1 - val2) / 10; // Normalize
    });

    const avgDiff = totalDiff / dimensions.length;
    return Math.max(0, 1 - avgDiff);
  }

  // Pearson correlation coefficient
  pearsonCorrelation(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    const values1 = dimensions.map(dim => scores1[dim] || 0);
    const values2 = dimensions.map(dim => scores2[dim] || 0);

    const mean1 = values1.reduce((a, b) => a + b) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b) / values2.length;

    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;

    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Find similar profiles with advanced filtering
  findSimilarProfiles(targetScores, allProfiles, options = {}) {
    const {
      algorithm = 'weighted_euclidean',
      threshold = ML_CONFIG.SIMILARITY_THRESHOLD,
      maxResults = ML_CONFIG.MAX_SIMILAR_PROFILES,
      minResults = ML_CONFIG.MIN_SIMILAR_PROFILES,
      diversityFactor = 0.1 // 0-1, higher = more diverse results
    } = options;

    // Calculate similarities
    let similarities = allProfiles.map(profile => ({
      ...profile,
      similarity: this.calculateSimilarity(targetScores, profile.scores, algorithm)
    }));

    // Filter by threshold
    similarities = similarities.filter(p => p.similarity >= threshold);

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Apply diversity filtering if requested
    if (diversityFactor > 0 && similarities.length > minResults) {
      similarities = this.applyDiversityFilter(similarities, diversityFactor);
    }

    // Limit results
    return similarities.slice(0, maxResults);
  }

  // Apply diversity filtering to avoid echo chambers
  applyDiversityFilter(similarities, diversityFactor) {
    if (similarities.length <= 3) return similarities;

    const diverseResults = [similarities[0]]; // Always include most similar
    const remaining = similarities.slice(1);

    while (diverseResults.length < similarities.length && remaining.length > 0) {
      let bestCandidate = null;
      let bestScore = -1;

      for (const candidate of remaining) {
        // Calculate diversity score (how different from already selected)
        let diversityScore = 0;

        for (const selected of diverseResults) {
          const diversity = 1 - this.calculateSimilarity(
            candidate.scores,
            selected.scores,
            'weighted_euclidean'
          );
          diversityScore += diversity;
        }

        diversityScore /= diverseResults.length;

        // Combined score: similarity + diversity
        const combinedScore =
          candidate.similarity * (1 - diversityFactor) +
          diversityScore * diversityFactor;

        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        diverseResults.push(bestCandidate);
        remaining.splice(remaining.indexOf(bestCandidate), 1);
      } else {
        break;
      }
    }

    return diverseResults;
  }

  // Calculate dimension weights based on golf profiling importance
  calculateDimensionWeights() {
    return {
      skillLevel: 1.5,      // Very important for course recommendations
      socialness: 1.2,      // Important for experience type
      traditionalism: 1.3,   // Important for course style
      luxuryLevel: 1.4,     // Important for pricing/amenities
      competitiveness: 1.1,  // Moderately important
      ageGeneration: 0.8,    // Less important, more variable
      amenityImportance: 1.3, // Important for facility recommendations
      pace: 0.9,            // Somewhat important
      genderLean: 0.7       // Less critical for recommendations
    };
  }

  // Specialized similarity for specific recommendation types
  calculateCourseSimilarity(scores1, scores2) {
    // Weight dimensions that matter most for course selection
    const courseWeights = {
      skillLevel: 2.0,
      traditionalism: 1.8,
      luxuryLevel: 1.6,
      competitiveness: 1.2,
      amenityImportance: 1.4
    };

    let sumSquaredDiffs = 0;
    let totalWeight = 0;

    Object.entries(courseWeights).forEach(([dim, weight]) => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const diff = (val1 - val2) / 10;

      sumSquaredDiffs += weight * (diff * diff);
      totalWeight += weight;
    });

    const distance = Math.sqrt(sumSquaredDiffs / totalWeight);
    return Math.max(0, 1 - distance);
  }

  calculateSocialSimilarity(scores1, scores2) {
    // Weight dimensions that matter for social/group recommendations
    const socialWeights = {
      socialness: 2.0,
      competitiveness: 1.5,
      pace: 1.3,
      ageGeneration: 1.1,
      traditionalism: 0.8
    };

    let sumSquaredDiffs = 0;
    let totalWeight = 0;

    Object.entries(socialWeights).forEach(([dim, weight]) => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const diff = (val1 - val2) / 10;

      sumSquaredDiffs += weight * (diff * diff);
      totalWeight += weight;
    });

    const distance = Math.sqrt(sumSquaredDiffs / totalWeight);
    return Math.max(0, 1 - distance);
  }

  // Clustering for market segmentation
  performClustering(profiles, numClusters = 5) {
    if (profiles.length < numClusters) return null;

    // Simple k-means clustering implementation
    let centroids = this.initializeCentroids(profiles, numClusters);
    let assignments = new Array(profiles.length);
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;

    while (changed && iterations < maxIterations) {
      changed = false;

      // Assign each profile to nearest centroid
      for (let i = 0; i < profiles.length; i++) {
        let minDistance = Infinity;
        let bestCluster = 0;

        for (let j = 0; j < centroids.length; j++) {
          const distance = 1 - this.calculateSimilarity(
            profiles[i].scores,
            centroids[j],
            'weighted_euclidean'
          );

          if (distance < minDistance) {
            minDistance = distance;
            bestCluster = j;
          }
        }

        if (assignments[i] !== bestCluster) {
          assignments[i] = bestCluster;
          changed = true;
        }
      }

      // Update centroids
      centroids = this.updateCentroids(profiles, assignments, numClusters);
      iterations++;
    }

    return {
      assignments,
      centroids,
      clusters: this.groupProfilesByClusters(profiles, assignments, numClusters)
    };
  }

  initializeCentroids(profiles, numClusters) {
    const centroids = [];
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;

    for (let i = 0; i < numClusters; i++) {
      const centroid = {};
      dimensions.forEach(dim => {
        // Initialize with random values from the data range
        const values = profiles.map(p => p.scores[dim] || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        centroid[dim] = min + Math.random() * (max - min);
      });
      centroids.push(centroid);
    }

    return centroids;
  }

  updateCentroids(profiles, assignments, numClusters) {
    const centroids = [];
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;

    for (let cluster = 0; cluster < numClusters; cluster++) {
      const clusterProfiles = profiles.filter((_, i) => assignments[i] === cluster);

      if (clusterProfiles.length === 0) {
        // Keep the old centroid if no profiles assigned
        centroids.push(centroids[cluster] || {});
        continue;
      }

      const centroid = {};
      dimensions.forEach(dim => {
        const sum = clusterProfiles.reduce((acc, p) => acc + (p.scores[dim] || 0), 0);
        centroid[dim] = sum / clusterProfiles.length;
      });

      centroids.push(centroid);
    }

    return centroids;
  }

  groupProfilesByClusters(profiles, assignments, numClusters) {
    const clusters = Array.from({ length: numClusters }, () => []);

    profiles.forEach((profile, i) => {
      clusters[assignments[i]].push(profile);
    });

    return clusters;
  }

  // Similarity explanation for debugging/transparency
  explainSimilarity(scores1, scores2) {
    const dimensions = ML_CONFIG.SIMILARITY_DIMENSIONS;
    const explanation = {
      overallSimilarity: this.calculateSimilarity(scores1, scores2),
      dimensionBreakdown: {},
      strongestMatches: [],
      biggestDifferences: []
    };

    dimensions.forEach(dim => {
      const val1 = scores1[dim] || 0;
      const val2 = scores2[dim] || 0;
      const diff = Math.abs(val1 - val2);
      const similarity = 1 - (diff / 10);

      explanation.dimensionBreakdown[dim] = {
        user1: val1,
        user2: val2,
        difference: diff,
        similarity: similarity
      };

      if (similarity > 0.8) {
        explanation.strongestMatches.push({ dimension: dim, similarity });
      }
      if (similarity < 0.3) {
        explanation.biggestDifferences.push({ dimension: dim, difference: diff });
      }
    });

    explanation.strongestMatches.sort((a, b) => b.similarity - a.similarity);
    explanation.biggestDifferences.sort((a, b) => b.difference - a.difference);

    return explanation;
  }
}

export default SimilarityCalculator;
